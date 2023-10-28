import fetch from 'node-fetch'
export const handler = async (event, context) => {
  const payId = JSON.parse(event.body)
  const platformAPI = `api.minepi.com/v2/payments/${payId.payId}/approve`

  var res = await fetch(
    platformAPI,{
      method: "POST",
      /*headers: {
        'Authorization': 'eopkkppz0wtscvdmkbbzpdqesvnzgotbtnghlnpzqqaghwhwvjatt6b9nfk3uvh8'
      }*/
    }
    )
  var resSend = await res.json()
  return {
    body: JSON.stringify(resSend)
  }
}/*.then((res)=>{
      return {
    statusCode: 200,
    body: res
  }
    })
    .catch((error)=>{
      return {
        statusCode: 400,
        body: JSON.stringify(error)
      }
    })
}*/