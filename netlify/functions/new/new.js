import fetch from 'node-fetch'
const axios = require('axios'); 

export const handler = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const POKE_API = 'https://pokeapi.co/api/v2/pokedex/' + eventBody.region
  console.log("yes");
  const response = await axios.get(POKE_API)
  //const data = response
  return {
    statusCode: 200,
    body: JSON.stringify({
      ifAxios: !!axios,
      pokemon: response.data.pokemon_entries,
    })
  }
}