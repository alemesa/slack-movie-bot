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
  if (text == '') {
    let image =
      'https://images-na.ssl-images-amazon.com/images/M/MV5BOGJjNzZmMmUtMjljNC00ZjU5LWJiODQtZmEzZTU0MjBlNzgxL2ltYWdlXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY1200_CR90,0,630,1200_AL_.jpg';

    let data = {
      response_type: 'in_channel', // public to the channle
      text: 'Spirited Away (2001) - Hayao Miyasaki - Tuesday 14 November',
      attachments: [
        {
          pretext: 'Poster by @steven',
          color: '#231F20',
          image_url: image,
          footer: 'Ocean (3rd Room Couch & TV) 6:30-9pm'
        }
      ]
    };
    res.json(data);
  } else if (text == 'previous') {
    let data = {
      response_type: 'in_channel', // public to the channle
      text:
        'Alien (1979) - Ridley Scott - Tuesday 17 October\nBlade Runner (1982) - Ridley Scott - Tuesday 3 October',
      attachments: [
        {
          color: '#231F20'
        }
      ]
    };
    res.json(data);
  } else {
    let data = {
      response_type: 'ephemeral', // public to the channle
      text: "You're doing it wrong either type /movie or /movie previous"
    };
    res.json(data);
  }
});
