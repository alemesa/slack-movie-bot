const fetch = require('node-fetch');
const variables = {
  color: 'blue'
};

let movie = 'Gladiator';

function formatSearchData(movie) {
  console.log(movie);
  let message = {
    response_type: 'ephemeral', // public to the channel
    text: `${movie.original_title} - ${movie.release_date}`,
    attachments: [
      {
        callback_id: 'search',
        color: `${variables.color}`,
        image_url: `${data[1]}`,
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
  return message;
}

function getMovie(movie) {
  const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';
  const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;
  fetch(searchQuery)
    .then(res => {
      console.log(res);
      res.json();
    })
    .then(json => {
      console.log(json.results[0]);
      json.results[0];
    })
    .then(movie => formatSearchData(movie))
    .catch(err => console.log(err));
}

console.log(getMovie(movie));
