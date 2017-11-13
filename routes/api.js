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

// API stuff
const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';

// Format Search Data
function formatSearchData(movie) {
  let production_countries = '';
  let production_company = movie.production_companies[0].name;
  let genres = '';

  movie.production_countries.map(
    country => (production_countries += `${country.iso_3166_1} `)
  );
  movie.genres.map(genre => (genres += `${genre.name} `));

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
            value: `${movie.title}`
          }
        ]
      }
    ]
  };
  tempMovie = message;
  tempMovie.response_type = 'ephemeral';
  tempMovie.replace_original = true;
  tempMovie.attachments.color = `${variables.errorColor}`;
  tempMovie.actions = '';
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
function getMovie(movie, random = false) {
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;
  return fetch(searchQuery)
    .then(res => res.json())
    .then(json =>
      fetch(
        `https://api.themoviedb.org/3/movie/${random
          ? json.results[getRandomMovie(json.results)].id
          : json.results[0].id}?api_key=${apiKey}`
      )
    )
    .then(res => res.json())
    .then(data => formatSearchData(data))
    .catch(err => console.log(err));
}

// Get next movie from the JSON Calendar
function getNextMovie() {
  let image = `${movies.poster}`;

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
        image_url: movies.poster,
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
  var reqBody = req.body;
  var responseURL = reqBody.response_url;

  if (reqBody.text == '') {
    console.log('SLASH COMMAND Getting the Next Movie');
    let message = getNextMovie(); // get next movie according to the calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (reqBody.text == 'previous') {
    console.log('SLASH COMMAND Getting the Previous Movies');
    let message = getPreviousMovies(); // get previous movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (reqBody.text == 'future') {
    console.log('SLASH COMMAND Getting the Future Movies');
    let message = getFutureMovies(); // get future movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else {
    console.log(`SLASH COMMAND let's search for a movie => ${reqBody.text}`);
    // search for a movie depending on the body text
    getMovie(reqBody.text).then(message => {
      console.log(message);
      sendMessageToSlackResponseURL(responseURL, message);
    });
  }
});

// Handle POST Requests by buttons
router.post('/actions', urlencodedParser, (req, res) => {
  res.status(200).end(); // best practice to respond with 200 status
  var actionJSONPayload = JSON.parse(req.body.payload); // parse URL-encoded payload JSON string

  if (actionJSONPayload.actions[0].name == 'previous') {
    console.log('BUTTON Getting the Previous Movies');
    let message = getPreviousMovies(); // get previous movies according to calendar
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (actionJSONPayload.actions[0].name == 'future') {
    console.log('BUTTON Getting the Future Movies');
    let message = getFutureMovies(); // get future movie according to calendar
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (actionJSONPayload.actions[0].name == 'shuffle') {
    console.log('BUTTON Shuffle Movie');
    getMovie(actionJSONPayload.actions[0].value, true).then(message => {
      console.log(message);
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
    let message = getFutureMovies(); // get a new movie if possible
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (actionJSONPayload.actions[0].name == 'info') {
    // get more info about the next movie using the API
    getMovie(actionJSONPayload.actions[0].value, false).then(message => {
      console.log('BUTTON Getting Movie Extra Info');
      console.log(message);
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
  } else if (actionJSONPayload.actions[0].name == 'post') {
    console.log('BUTTON Posting Public Clicked');
    // post the current movie
    console.log(tempMovie);
    let movieHook =
      'https://hooks.slack.com/services/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';
    console.log('Default Hook => ' + actionJSONPayload.response_url);
    console.log('Movie Night Hook =>' + movieHook);
    sendMessageToSlackResponseURL(movieHook, tempMovie);
  }
});

module.exports = router;
