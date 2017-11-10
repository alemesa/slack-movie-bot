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

function getNextMovie() {
  let image = `${movies.poster}`;

  let data = {
    response_type: 'in_channel',
    text: `${nextMovie.name} (${nextMovie.year}) - ${nextMovie.director} - ${moment(
      nextMovie.date
    ).format('ddd, Do MMMM')}`,
    attachments: [
      {
        pretext: `Poster by ${nextMovie.designer} / Join #movie-night for more info`,
        color: `${variables.color}`,
        image_url: movies.poster,
        footer: `${variables.location} - ${variables.time}`
      }
    ]
  };

  return data;
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

  let data = {
    response_type: 'in_channel', // public to the channel
    text: `${text}${variables.suggestion}`,
    attachments: [
      {
        color: `${variables.color}`
      }
    ]
  };

  return data;
}

function fetchMovie(movie) {
  let text = '';
  let poster = '';

  const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;

  console.log('fetching');

  fetch(searchQuery)
    .then(res => res.json())
    .then(json => json.results[0])
    .then(movie => {
      console.log(movie);
      if (movie) {
        text = `${movie.original_title} - ${movie.release.date}`;
        poster = movie.poster_path;
      } else if (!json.results[0]) {
        text = 'No results found';
      }
    });

  let data = {
    response_type: 'in_channel', // public to the channel
    text: `${text}`,
    attachments: [
      {
        color: `${variables.color}`,
        image_url: poster
      }
    ]
  };

  return data;
}

function getFutureMovies() {
  let text = '';
  futureMovies.map(movie => {
    text += `${movie.name} (${movie.year}) - ${movie.director} - ${moment(
      movie.date
    ).format('ddd, Do MMMM')}\n`;
  });

  let data = {
    response_type: 'in_channel', // public to the channel
    text: `${text}${variables.suggestion}`,
    attachments: [
      {
        color: `${variables.color}`
      }
    ]
  };

  return data;
}

function displayError() {
  let data = {
    response_type: 'ephemeral', // public to the channle
    text: `${variables.warning}`
  };
  return data;
}

// Return the movies as json (REST-API)
router.get('/api/movies', (req, res) => {
  res.send(movies);
});

// Handle POST request form '/movie' slash command
router.post('/movie', urlencodedParser, (req, res) => {
  console.log('post received, processing request');
  res.status(200).end(); // best practice to respond with empty 200 status code
  var reqBody = req.body;
  var responseURL = reqBody.response_url;
  if (req.body) {
    console.log('exists');
  }
  // if (reqBody.token != TOKEN) {
  //   res.status(403).end('Access forbidden');
  // }
  if (reqBody.text == '') {
    let message = getNextMovie();
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (reqBody.text == 'previous') {
    let message = getPreviousMovies();
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (reqBody.text == 'future') {
    let message = getFutureMovies();
    sendMessageToSlackResponseURL(responseURL, message);
  } else {
    let message = fetchMovie(reqBody.text);
    sendMessageToSlackResponseURL(responseURL, reqBody.text);
  }
});

// Handle POST Requests by buttons
router.post('/actions', urlencodedParser, (req, res) => {
  res.status(200).end(); // best practice to respond with 200 status
  var actionJSONPayload = JSON.parse(req.body.payload); // parse URL-encoded payload JSON string
  var message = {
    text:
      actionJSONPayload.user.name +
      ' clicked: ' +
      actionJSONPayload.actions[0].name,
    replace_original: false
  };
  sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
});

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

module.exports = router;
