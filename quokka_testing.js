const fetch = require('node-fetch');
const variables = {
  color: 'blue'
};

let movie = 'Gladiator';

const apiKey = '0ceedd539b0a1efa834d0c7318eb6355';
const searchQuery = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`;

function formatSearchData() {}

function getInfo(movie) {
  let text,
    poster = '';

  return fetch(searchQuery)
    .then(res => res.json())
    .then(json => json.results[0])
    .then(movie => {
      console.log(movie);
      return [
        (text = `${movie.original_title} - ${movie.release_date}`),
        (poster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
      ];
    })
    .then(resp => {
        return {
            response_type: 'in_channel', // public to the channel
            text: `${resp[0]}`,
            attachments: [
              {
                callback_id: 'search',
                color: `${variables.color}`,
                image_url: `${resp[1]}`,
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
        }
    )
    .catch(err => console.log(err));
}



  console.log(getInfo(movie));
  console.log(data.attachments.image_url);
  return data;
}

returnMovie(movie);
