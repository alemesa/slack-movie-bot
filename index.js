'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Express server listening on port %d in %s mode',
    server.address().port,
    app.settings.env
  );
});

/* *******************************
/* Next Movie Slash Command
/* ***************************** */

app.get('/', (req, res) => {
  console.log('working');
});

app.post('/', (req, res) => {
  // if next or previous
  let text = req.body.text;

  let image =
    'https://images-na.ssl-images-amazon.com/images/M/MV5BOGJjNzZmMmUtMjljNC00ZjU5LWJiODQtZmEzZTU0MjBlNzgxL2ltYWdlXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY1200_CR90,0,630,1200_AL_.jpg';

  let data = {
    response_type: 'in_channel', // public to the channle
    text: 'Spirited Away (2001) - Hayao Miyasaki - Tuesday 14 November',
    attachments: [
      {
        color: '#F44336',
        pretext: 'Spirited Away (2001) - Hayao Miyasaki - Tuesday 14 November',
        image_url: image,
        footer: 'Movies!!!'
      }
    ]
  };
  res.json(data);
});
