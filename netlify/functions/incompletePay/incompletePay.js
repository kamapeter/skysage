import fetch from 'node-fetch'
const axios = require('axios');
export const handler = async (event, context) => {
  const payment = JSON.parse(event.body);
  const payId = payment.identifier;
  const txid = payment.transaction.txid;
  const platformAPI = `https://api.minepi.com/v2/payments/${payId}/complete`

  var res = await axios.post(
    platformAPI,{
      txid
    },{
      headers: {
        'Authorization': 'Key eopkkppz0wtscvdmkbbzpdqesvnzgotbtnghlnpzqqaghwhwvjatt6b9nfk3uvh8'
      }
    }
    )
  return {
    body: JSON.stringify(res)
  }
}