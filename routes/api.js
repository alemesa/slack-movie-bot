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

function formatSearchData(movie) {
  console.log('Inside FORMAT SEARCH data ' + movie);

  let text = `${movie.original_title} - ${movie.release_date}`;
  //let imageSrc = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  let imageSrc = 'http://lexingtonvenue.com/media/poster-placeholder.jpg';

  let message = {
    response_type: 'ephemeral', // private to the channel
    text: text,
    attachments: [
      {
        callback_id: 'search',
        image_url: imageSrc,
        color: '#E3C94A',
        attachment_type: 'default',
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
  console.log(message);
  tempMovie = message;
  tempMovie.response_type = 'in_channel';
  tempMovie.actions = [];
  return message;
}

function getMovie(movie) {
  const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;
  const specificSearchQuery = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`;
  return fetch(searchQuery)
    .then(res => res.json())
    .then(json => formatSearchData(json.results[0]))
    .catch(err => console.log(err));
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

  if (reqBody.text == '') {
    let message = getNextMovie(); // get next movie according to the calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (reqBody.text == 'previous') {
    let message = getPreviousMovies(); // get previous movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else if (reqBody.text == 'future') {
    let message = getFutureMovies(); // get future movie according to calendar
    sendMessageToSlackResponseURL(responseURL, message);
  } else {
    console.log(`let's search for a movie => ${reqBody.text}`);
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
  console.log(actionJSONPayload);

  if (actionJSONPayload.actions[0].name == 'previous') {
    let message = getPreviousMovies(); // get previous movies according to calendar
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (actionJSONPayload.actions[0].name == 'future') {
    let message = getFutureMovies(); // get future movie according to calendar
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  } else if (actionJSONPayload.actions[0].name == 'info') {
    // get more info about the next movie using the API
    getMovie(actionJSONPayload.actions[0].value).then(message => {
      sendMessageToSlackResponseURL(responseURL, message);
    });
  } else if (actionJSONPayload.actions[0].name == 'post') {
    // post the current movie
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, tempMovie);
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
