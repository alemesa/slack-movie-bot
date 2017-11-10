const fetch = require('node-fetch');

const movie = 'Gladiator';
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
      console.log(text);
      if (movie.poster_path != 'N/A') {
        poster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      } else {
        poster = './placeholder.jpg';
      }
    } else if (!json.results[0]) {
      text = 'No results found';
    }
    console.log(poster);
  })
  .catch(err => console.log(err));
