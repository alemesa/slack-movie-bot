'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/api');
const tools = require('./util/util');

// setup express
const app = express();

app.use(express.static('public')); // serve static html for the frontend
app.use(bodyParser.json()); // bodyparser for the request
app.use(bodyParser.urlencoded({ extended: true }));

// initialize routes
app.use('/', routes);

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Express server listening on port %d in %s mode',
    server.address().port,
    app.settings.env
  );
});
