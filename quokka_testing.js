const fetch = require('node-fetch');

function formatSearchData(movie) {
  console.log('Inside FORMAT SEARCH data ' + movie);
  console.log(movie.original_title);
  console.log(movie.release_date);
  let message = {
    response_type: 'ephemeral', // private to the channel
    text: `${movie.original_title} - ${movie.release_date}`,
    attachments: [
      {
        callback_id: 'search',
        color: `${variables.color}`,
        image_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        actions: [
          {
            name: 'post',
            text: 'Post Public',
            type: 'button',
            value: 'post',
            style: 'danger'
          }
        ]
      }
    ]
  };
  console.log(message.actions);
  // Keep a temporal variable in case the user want's too post the movie
  tempMovie = message;
  tempMovie.response_type = 'in_channel';
  tempMovie.actions = [];
  console.log(message);
  return message;
}

function getMovie(movie) {
  const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;
  const specificSearchQuery = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`;
  fetch(searchQuery)
    .then(res => res.json())
    .then(json => {
      console.log(json.results[0]);
      console.log(formatSearchData(json.results[0]));
      json.results[0];
    })
    .then(movie => {
      console.log(movie);
      formatSearchData(movie);
    })
    .catch(err => console.log(err));
}

getMovie('gladiator');
