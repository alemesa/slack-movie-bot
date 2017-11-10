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

function fetchMovie(movie) {
  let text = '';
  let poster = '';
  let data = {};

  const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;

  console.log('fetching');

  fetch(searchQuery)
    .then(res => res.json())
    .then(json => json.results[0])
    .then(movie => {
      console.log(movie);
      if (movie) {
        text = `${movie.original_title} - ${movie.release_date}`;
        if (movie.poster_path != 'N/A') {
          poster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        } else {
          poster = './placeholder.jpg';
        }
      } else if (!json.results[0]) {
        text = 'No results found';
      }
    })
    .then(buildAndReturn)
    .catch(err => console.log(err));

  function buildAndReturn() {
    data = {
      response_type: 'in_channel', // public to the channel
      text: `Title: Gladiator - 2002${text}`,
      attachments: [
        {
          callback_id: 'search',
          color: `${variables.color}`,
          image_url: poster
        }
      ]
    };
    console.log(data);

    return data;
  }
}

function getNextMovie() {
  let image = `${movies.poster}`;

  let data = {
    response_type: 'in_channel',
    text: `${nextMovie.name} (${nextMovie.year}) - ${nextMovie.director} - ${moment(
      nextMovie.date
    ).format('ddd, Do MMMM')}`,
    attachments: [
      {
        callback_id: 'next',
        pretext: `Poster by ${nextMovie.designer} / Join #movie-night for more info`,
        color: `${variables.color}`,
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
        callback_id: 'past',
        color: `${variables.color}`
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
        callback_id: 'future',
        color: `${variables.color}`
      }
    ]
  };

  return data;
}

function displayError() {
  let data = {
    response_type: 'ephemeral', // private to the user
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
    console.log("let's search for a movie");
    let message = fetchMovie(reqBody.text);
    sendMessageToSlackResponseURL(responseURL, message);
  }
});

// Handle POST Requests by buttons
router.post('/actions', urlencodedParser, (req, res) => {
  res.status(200).end(); // best practice to respond with 200 status
  var actionJSONPayload = JSON.parse(req.body.payload); // parse URL-encoded payload JSON string
  console.log(actionJSONPayload);

  if (actionJSONPayload.actions[0].name == 'previous') {
    let message = getPreviousMovies();
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (actionJSONPayload.actions[0].name == 'future') {
    let message = getFutureMovies();
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (actionJSONPayload.actions[0].name == 'info') {
    let message = 'find more info here';
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  }
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
