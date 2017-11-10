'use strict';

const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const routes = require('./routes/api');
const tools = require('./util/util');

// setup express
const app = express();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public')); // serve static html for the frontend
app.use(bodyParser.json()); // bodyparser for the request
app.use(bodyParser.urlencoded({ extended: true }));

// initialize routes
app.use('/', routes);

// Process the movie info here

// Starting server
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Express server listening on port %d in %s mode',
    server.address().port,
    app.settings.env
  );
});
