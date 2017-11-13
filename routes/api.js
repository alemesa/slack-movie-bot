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

// Format Search Data
function formatSearchData(movie) {
  let message = {
    response_type: 'ephemeral',
    replace_original: false,
    text: `${movie.original_title} - ${movie.release_date}`,
    attachments: [
      {
        fallback: 'Unable to search that movie',
        callback_id: 'search',
        image_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        color: `${variables.successColor}`,
        attachment_type: 'default',
        title_link: 'https://google.ca',
        text: `${movie.overview}`,
        actions: [
          {
            name: 'post',
            text: 'Post Public',
            type: 'button',
            value: 'post'
          }
        ]
      }
    ]
  };
  tempMovie = message;
  tempMovie.response_type = 'in_channel';
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

// Get movie from search
function getMovie(movie) {
  const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;
  const specificSearchQuery = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`;
  return fetch(searchQuery)
    .then(res => res.json())
    .then(json => formatSearchData(json.results[0]))
    .catch(err => console.log(err));
}

// Get next movie from the JSON Calendar
function getNextMovie() {
  let image = `${movies.poster}`;

  let message = {
    response_type: 'in_channel',
    text: `${nextMovie.name} (${nextMovie.year}) - ${nextMovie.director} - ${moment(
      nextMovie.date
    ).format('ddd, Do MMMM')}`,
    attachments: [
      {
        callback_id: 'next',
        pretext: `Poster by ${nextMovie.designer} / Join #movie-night for more info`,
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
    text: `${text}${variables.suggestion}`,
    attachments: [
      {
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
    text: `${text}${variables.suggestion}`,
    attachments: [
      {
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
  } else if (actionJSONPayload.actions[0].name == 'info') {
    // get more info about the next movie using the API
    getMovie(actionJSONPayload.actions[0].value).then(message => {
      console.log('BUTTON Getting Movie Extra Info');
      sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
    });
  } else if (actionJSONPayload.actions[0].name == 'post') {
    console.log('BUTTON Posting Public Clicked');
    // post the current movie
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, tempMovie);
  }
});

module.exports = router;
