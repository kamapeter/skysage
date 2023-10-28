import fetch from 'node-fetch'
export const handler = async (event, context) => {
  const payId = JSON.parse(event.body)
  const platformAPI = `api.minepi.com/v2/payments/${payId.payId}/approve`

  fetch(
    platformAPI,{
      method: "POST",
      headers: {
        'Authorization': 'eopkkppz0wtscvdmkbbzpdqesvnzgotbtnghlnpzqqaghwhwvjatt6b9nfk3uvh8'
      }
    }
    ).then((res)=>{
      return {
    statusCode: 200
  }
    })
    .catch((error)=>{
      return {
        statusCode: 400,
        body: JSON.stringify(error)
      }
    })
}