export const handler = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const platformAPI = 'api.minepi.com/v2' + eventBody.region

  const response = await fetch(POKE_API)
  const data = await response.json()

  return {
    statusCode: 200,
    body: JSON.stringify({
      pokemon: data.pokemon_entries
    })
  }
}