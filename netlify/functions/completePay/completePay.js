import fetch from 'node-fetch'
export const handler = async (event, context) => {
  const pay = JSON.parse(event.body)
  const platformAPI = `https://api.minepi.com/v2/payments/${pay.payId}/complete`

  var res = await fetch(
    platformAPI,{
      method: "POST",
      //body: {txid: pay.txid},
      headers: {
        'Authorization': 'Key eopkkppz0wtscvdmkbbzpdqesvnzgotbtnghlnpzqqaghwhwvjatt6b9nfk3uvh8'
      }
    }
    )
  var resSend = await res.json()
  return {
    body: JSON.stringify(resSend)
  }
}