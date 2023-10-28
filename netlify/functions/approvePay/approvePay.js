import fetch from 'node-fetch'
export const handler = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const platformAPI = 'https://pokeapi.co/api/v2/pokedex/' + eventBody.region

  const response = await fetch(platformAPI)
  const data = await response.json()

  return {
    statusCode: 200,
    body: JSON.stringify({
      pokemon: data.pokemon_entries
    })
  }
}