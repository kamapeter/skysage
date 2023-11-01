import fetch from 'node-fetch'
const axios = require('axios');
export const handler = async (event, context) => {
  const paymentInfo = JSON.parse(event.body)
  console.log(paymentInfo)
  const payId = paymentInfo.payId;
  const txid = paymentInfo.txid;
  console.log(payId,txid);
  const platformAPI = `https://api.minepi.com/v2/payments/${payId}/complete`

  var res = await axios.post(
    platformAPI,{
      'txid': txid
    },{
      headers: {
        'Authorization': `Key ${process.env.API_KEY}`
      }
    }
    )
  return {
    body: JSON.stringify(res)
  }
}