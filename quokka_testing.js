const fetch = require('node-fetch');
const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';

function formatSearchData(movie) {
  console.log('Inside FORMAT SEARCH data ' + movie);
  console.log(movie.id);
  let text = movie.original_title + ' ' + movie.release_date;
  let imageSrc = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;
  const specificSearchQuery = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`;
  console.log(specificSearchQuery);
  let imdb = ' asdasdasd';

  fetch(specificSearchQuery)
    .then(res => res.json())
    .then(json => json.imdb_id)
    .then(id => (imdb = id));

  let message = {
    response_type: 'ephemeral', // private to the channel
    text: text + imdb,
    attachments: [
      {
        callback_id: 'search',
        image_url: imageSrc,
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
  console.log(message.text);

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

getMovie('gladiator');
