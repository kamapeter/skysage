const axios = require('axios')
export const handler = async (event, context) => {
  const pay = JSON.parse(event.body)
  const platformAPI = `https://api.minepi.com/v2/payments/${pay.payId}/complete`

  var res = await axios.post(
    platformAPI,{txid: pay.txid},{
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