const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const request = require('request');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
// date handling
const fs = require('fs');
const moment = require('moment');
// secret
const CLIENT_ID = '265433400768.269305280000';
const CLIENT_SECRET = '0ddef22b6dcbc4ac8a5f85d7de70489b';
const REDIRECT_URI = 'https://slack-movie-bot-jam3.herokuapp.com/auth/redirect';
const VERIFICATION_TOKEN = '';

// Getting local JSON Data
let movies = JSON.parse(fs.readFileSync('./data/movies.json'));
let variables = JSON.parse(fs.readFileSync('./data/vars.json'));

// define movies
let pastMovies = movies.data.filter(movie => moment(movie.date) < moment());
let futureMovies = movies.data.filter(movie => moment(movie.date) >= moment());
let nextMovie = futureMovies[0];

// API stuff
const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';

// Format Public Search Data
function formatSearchPublicData(movie, search) {
  let production_countries = '';
  let production_company = movie.production_companies[0]
    ? movie.production_companies[0].name
    : '';
  let genres = '';

  if (movie.productions_countries) {
    movie.production_countries.map(
      country => (production_countries += `${country.iso_3166_1 || ''} `)
    );
  }
  if (movie.genres) {
    movie.genres.map(genre => (genres += `${genre.name || ''} `));
  }

  let message = {
    response_type: 'in_channel',
    replace_original: false,
    text: `\t${movie.release_date
      ? `📽️ Date: ${movie.release_date} |`
      : ''} ${movie.original_language
      ? `Lang: ${movie.original_language.toUpperCase()} |`
      : ''}  ${movie.runtime
      ? `Runtime: ${movie.runtime} mins `
      : ''} ${production_company ? `| ${production_company}` : ''}`,
    attachments: [
      {
        fallback: 'Unable to search that movie',
        callback_id: 'search',
        image_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        color: `${variables.publicColor}`,
        attachment_type: 'default',
        title: `${movie.title}`,
        title_link: `http://www.imdb.com/title/${movie.imdb_id}/?ref_=nv_sr_1`,
        text: `${movie.tagline
          ? `${movie.tagline} | `
          : ''}${production_countries ? `${production_countries}` : ''}${genres
          ? ` | ${genres}`
          : ''}\n${movie.overview}`,
        actions: []
      }
    ]
  };

  return message;
}

// Format Search Data
function formatSearchData(movie, search) {
  let production_countries = '';
  let production_company = movie.production_companies[0]
    ? movie.production_companies[0].name
    : '';
  let genres = '';

  if (movie.productions_countries) {
    movie.production_countries.map(
      country => (production_countries += `${country.iso_3166_1 || ''} `)
    );
  }
  if (movie.genres) {
    movie.genres.map(genre => (genres += `${genre.name || ''} `));
  }

  let message = {
    response_type: 'ephemeral',
    replace_original: true,
    text: `\t${movie.release_date
      ? `📽️ Date: ${movie.release_date} |`
      : ''} ${movie.original_language
      ? `Lang: ${movie.original_language.toUpperCase()} |`
      : ''}  ${movie.runtime
      ? `Runtime: ${movie.runtime} mins `
      : ''} ${production_company ? `| ${production_company}` : ''}`,
    attachments: [
      {
        fallback: 'Unable to search that movie',
        callback_id: 'search',
        image_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        color: `${variables.privateColor}`,
        attachment_type: 'default',
        title: `${movie.title}`,
        title_link: `http://www.imdb.com/title/${movie.imdb_id}/?ref_=nv_sr_1`,
        text: `${movie.tagline
          ? `${movie.tagline} | `
          : ''}${production_countries ? `${production_countries}` : ''}${genres
          ? ` | ${genres}`
          : ''}\n${movie.overview}`,
        actions: [
          {
            name: 'post',
            text: 'Post Public',
            type: 'button',
            value: `${movie.id}`
          },
          {
            name: 'shuffle',
            text: 'Shuffle Movie',
            type: 'button',
            value: `${search}`
          }
        ]
      }
    ]
  };

  return message;
}

// Slack Functionality
function sendMessageToSlackResponseURL(responseURL, JSONmessage) {
  var postOptions = {
    uri: responseURL,
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    json: JSONmessage
  };
  request(postOptions, (error, response, body) => {
    if (error) {
      console.log(error);
    }
  });
}

// Get RandomMovie
function getRandomMovie(movies, popular) {
  if (popular) {
    return 0;
  } else {
    let keys = Array.from(movies.keys());
    return keys[Math.floor(Math.random() * keys.length)];
  }
}

// Get movie from search and post public
function getMoviePublic(movie) {
  return fetch(`https://api.themoviedb.org/3/movie/${movie}?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data => formatSearchPublicData(data, movie))
    .catch(err => console.log(err));
}

function showErrorMessage() {
  let message = {
    response_type: 'ephemeral',
    replace_original: true,
    text: `Noooo Why???`,
    attachments: [
      {
        fallback: 'Unable to find that movie',
        callback_id: 'error',
        color: `${variables.errorColor}`,
        attachment_type: 'default',
        title: `Error 😢`,
        text: `We couldn't find that movie`
      }
    ]
  };

  return message;
}

function formatPopularData(data) {
  let outputText;
  data.map(
    movie => (outputText += `${movie.original_title} - ${movie.release_date}\n`)
  );

  let message = {
    response_type: 'ephemeral',
    replace_original: true,
    text: `\tPopular Movies`,
    attachments: [
      {
        fallback: 'Unable to search popular movies',
        callback_id: 'popular',
        color: `${variables.privateColor}`,
        attachment_type: 'default',
        text: `Output Text: ${outputText}`
      }
    ]
  };
  console.log(message);
  return message;
}

// Get 10 most popular movies
function getPopular() {
  let searchQuery = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=popularity.desc`;
  return fetch(searchQuery)
    .then(res => res.json())
    .then(json => json.results)
    .then(data => formatPopularData(data))
    .catch(err => console.log(err));
}

// Get movie from search
function getMovie(movie, popular = true) {
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;
  return fetch(searchQuery)
    .then(res => res.json())
    .then(json =>
      fetch(
        `https://api.themoviedb.org/3/movie/${json.results[
          getRandomMovie(json.results, popular)
        ].id}?api_key=${apiKey}`
      )
    )
    .then(res => res.json())
    .then(data => formatSearchData(data, movie))
    .catch(err => {
      let errorMessage = showErrorMessage();
      return errorMessage;
    });
}

// Get next movie from the JSON Calendar
function getNextMovie() {
  let message = {
    response_type: 'ephemeral',
    replace_original: false,
    text: `📽️ Next Movie: ${nextMovie.name} (${nextMovie.year}) - ${nextMovie.director} - ${moment(
      nextMovie.date
    ).format('ddd, Do MMMM')}`,
    attachments: [
      {
        callback_id: 'next',
        text: `Poster by ${nextMovie.designer} / Join #movie-night for more info`,
        color: `${variables.privateColor}`,
        image_url: `${movies.poster}`,
        footer: `${variables.location} - ${variables.time}`,
        actions: [
          {
            name: 'previous',
            text: 'Previous Movies',
            type: 'button',
            value: 'previous'
          },
          {
            name: 'future',
            text: 'Future Movies',
            type: 'button',
            value: 'future'
          },
          {
            name: `info`,
            text: 'More Info',
            type: 'button',
            value: `${nextMovie.name}`
          }
        ]
      }
    ]
  };

  return message;
}

function getPreviousMovies(visible = false) {
  let text = '';

  // get last 10 items
  pastMovies
    .slice(-10)
    .reverse()
    .map(movie => {
      text += `- ${movie.name} (${movie.year}) - ${movie.director} - ${moment(
        movie.date
      ).format('ddd, Do MMMM')}\n`;
    });

  let message = {
    response_type: `${visible ? 'in_channel' : 'ephemeral'}`,
    text: `Previous Movies`,
    replace_original: false,
    attachments: [
      {
        text: `${text}${variables.suggestion}`,
        callback_id: 'past',
        color: `${variables.jam3Color}`,
        actions: `${visible
          ? ''
          : [
              {
                name: 'post-previous',
                text: 'Post Public',
                type: 'button',
                value: 'post-previous'
              }
            ]}`
      }
    ]
  };

  return message;
}

function getFutureMovies(visible = false) {
  let text = '';

  futureMovies.map(movie => {
    text += `- ${movie.name} (${movie.year}) - ${movie.director} - ${moment(
      movie.date
    ).format('ddd, Do MMMM')}\n`;
  });

  let message = {
    response_type: `${visible ? 'in_channel' : 'ephemeral'}`,
    text: `Future Movies`,
    replace_original: false,
    attachments: [
      {
        text: `${text}${variables.suggestion}`,
        callback_id: 'future',
        color: `${variables.jam3Color}`,
        actions: `${visible
          ? ''
          : [
              {
                name: 'post-future',
                text: 'Post Public',
                type: 'button',
                value: `post-future`
              }
            ]}`
      }
    ]
  };

  return message;
}

function displayError() {
  let message = {
    response_type: 'ephemeral',
    text: `${variables.warning}`
  };
  return message;
}

// Return the movies as json (REST-API)
router.get('/api/movies', (req, res) => {
  //res.send(movies);
  console.log('REST Route GET Getting Movies');
});

// Handle POST request form '/movie' slash command
router.post('/movie', urlencodedParser, (req, res) => {
  res.status(200).end(); // best practice to respond with empty 200 status code
  var body = req.body;
  var bodyText = body.text;
  var responseURL = body.response_url;

  if (bodyText == '') {
    let message = getNextMovie(); // get next movie according to the calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (bodyText == 'previous') {
    let message = getPreviousMovies(false); // get previous movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (bodyText == 'future') {
    let message = getFutureMovies(false); // get future movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (bodyText == 'popular') {
    let message = getPopular(); // get popular movies
    sendMessageToSlackResponseURL(responseURL, message);
  } else {
    getMovie(bodyText, true)
      .then(message => {
        sendMessageToSlackResponseURL(responseURL, message);
      })
      .catch(errorMessage => {
        sendMessageToSlackResponseURL(responseURL, errorMessage);
      });
  }
});

// Handle POST Requests by buttons
router.post('/actions', urlencodedParser, (req, res) => {
  res.status(200).end();
  var actionJSONPayload = JSON.parse(req.body.payload);
  let optionName = actionJSONPayload.actions[0].name;
  let optionValue = actionJSONPayload.actions[0].value;

  if (optionName == 'previous') {
    let message = getPreviousMovies();
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (optionName == 'future') {
    let message = getFutureMovies();
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (optionName == 'shuffle') {
    getMovie(optionValue, false).then(message => {
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
  } else if (optionName == 'info') {
    getMovie(optionValue, true).then(message => {
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
  } else if (optionName == 'post') {
    getMoviePublic(optionValue, true).then(message => {
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
  } else if (optionName == 'post-previous') {
    let message = getPreviousMovies(true); // get previous movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (optionName == 'post-future') {
    let message = getFutureMovies(true); // get previous movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  }
});

//!-------AUTH PROCESS-------!
router.get('/auth', (req, res) => {
  console.log('Going to /Auth');
  res.sendFile(__dirname + '/public/index.html');
});

router.get('/auth/redirect', (req, res) => {
  console.log('Going to /Auth/Redirect');
  var options = {
    uri:
      'https://slack.com/api/oauth.access?code=' +
      req.query.code +
      '&client_id=' +
      CLIENT_ID +
      '&client_secret=' +
      CLIENT_SECRET +
      '&redirect_uri=' +
      REDIRECT_URI,
    method: 'GET'
  };
  request(options, (error, response, body) => {
    var JSONresponse = JSON.parse(body);
    if (!JSONresponse.ok) {
      console.log(JSONresponse);
      res
        .send('Error encountered: \n' + JSON.stringify(JSONresponse))
        .status(200)
        .end();
    } else {
      console.log(JSONresponse);
      res.send('Success!');
    }
  });
});

module.exports = router;
