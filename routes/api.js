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
const TOKEN = '4Xnfaf6wEsWftMP5puPSKFiF';

// Getting local JSON Data
let movies = JSON.parse(fs.readFileSync('./data/movies.json'));
let variables = JSON.parse(fs.readFileSync('./data/vars.json'));

// define movies
let pastMovies = movies.data.filter(movie => moment(movie.date) <= moment());
let futureMovies = movies.data.filter(movie => moment(movie.date) >= moment());
let nextMovie = futureMovies[0];
let tempMovie = {};
let tempSearchTerm = '';

// API stuff
const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';

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
    text: `\t📽️ Date: ${movie.release_date} | Lang: ${movie.original_language.toUpperCase()} | Runtime: ${movie.runtime} mins | ${production_company}`,
    attachments: [
      {
        fallback: 'Unable to search that movie',
        callback_id: 'search',
        image_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        color: `${variables.successColor}`,
        attachment_type: 'default',
        title: `${movie.title}`,
        title_link: `http://www.imdb.com/title/${movie.imdb_id}/?ref_=nv_sr_1`,
        text: `${movie.tagline} | ${production_countries} | ${genres}\n${movie.overview}`,
        actions: [
          {
            name: 'post',
            text: 'Post Public on #movie-night',
            type: 'button',
            value: 'post'
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
  tempMovie = message;
  tempMovie.response_type = 'ephemeral';
  tempMovie.replace_original = true;
  tempMovie.attachments.color = `${variables.errorColor}`;
  tempMovie.attachments.actions = '';
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

function getRandomMovie(movies) {
  let keys = Array.from(movies.keys());
  return keys[Math.floor(Math.random() * keys.length)];
}

// Get movie from search
function getMovie(movie) {
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;
  return fetch(searchQuery)
    .then(res => res.json())
    .then(json =>
      fetch(
        `https://api.themoviedb.org/3/movie/${json.results[
          getRandomMovie(json.results)
        ].id}?api_key=${apiKey}`
      )
    )
    .then(res => res.json())
    .then(data => formatSearchData(data, movie))
    .catch(err => console.log(err));
}

// Get next movie from the JSON Calendar
function getNextMovie() {
  let message = {
    response_type: 'in_channel',
    replace_original: false,
    text: `🎥 Next Movie: ${nextMovie.name} (${nextMovie.year}) - ${nextMovie.director} - ${moment(
      nextMovie.date
    ).format('ddd, Do MMMM')}`,
    attachments: [
      {
        callback_id: 'next',
        text: `Poster by ${nextMovie.designer} / Join #movie-night for more info`,
        color: `${variables.jam3Color}`,
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

function getPreviousMovies() {
  let text = '';

  // get last 10 items
  pastMovies
    .slice(-10)
    .reverse()
    .map(movie => {
      text += `${movie.name} (${movie.year}) - ${movie.director} - ${moment(
        movie.date
      ).format('ddd, Do MMMM')}\n`;
    });

  let message = {
    response_type: 'in_channel',
    text: `Previous Movies`,
    replace_original: false,
    attachments: [
      {
        text: `${text}${variables.suggestion}`,
        callback_id: 'past',
        color: `${variables.jam3Color}`
      }
    ]
  };

  return message;
}

function getFutureMovies() {
  let text = '';
  futureMovies.map(movie => {
    text += `${movie.name} (${movie.year}) - ${movie.director} - ${moment(
      movie.date
    ).format('ddd, Do MMMM')}\n`;
  });

  let message = {
    response_type: 'in_channel',
    text: `Future Movies`,
    replace_original: false,
    attachments: [
      {
        text: `${text}${variables.suggestion}`,
        callback_id: 'future',
        color: `${variables.jam3Color}`
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
  res.send(movies);
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
    let message = getPreviousMovies(); // get previous movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (bodyText == 'future') {
    let message = getFutureMovies(); // get future movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else {
    getMovie(bodyText).then(message => {
      sendMessageToSlackResponseURL(responseURL, message);
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
    getMovie(optionValue).then(message => {
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
  } else if (optionName == 'info') {
    getMovie(optionValue).then(message => {
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
  } else if (optionName == 'post') {
    let movieHook =
      'https://hooks.slack.com/services/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';
    sendMessageToSlackResponseURL(movieHook, tempMovie);
  }
});

module.exports = router;
