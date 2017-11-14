const fetch = require('node-fetch');
const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';

//fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`)

function formatArrayData(data) {
  console.log(data);
}

function getPopularMovies() {
  const searchQuery = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=popularity.desc`;
  let array = [];
  return fetch(searchQuery)
    .then(res => res.json())
    .then(json =>
      json.results.filter((movie, index) => index < 10).map(movie => movie.id)
    )
    .then(data => {
      data.map(id =>
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`)
          .then(res => res.json())
          .then(json => [json.original_title, json.imdb_id])
      );
    })
    .then(data => console.log(data))
    .catch(err => console.log(err));
}

getPopularMovies().then(array => console.log(array));
