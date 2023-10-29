import fetch from 'node-fetch'
const axios = require('axios');
export const handler = async (event, context) => {
  const payment = JSON.parse(event.body);
  const payId = payment.identifier;
  const txid = payment.transaction.txid;
  //const payId = "uaHVqgqolhISKNV1WLGnGSRCPOCw"
  //const txid = "7cb39f257c3a675b9ab43d4f7f2284907f708e2bb804cb4c8dd77f4bdaaa7fa6";
  console.log(event.body)
  const platformAPI = `https://api.minepi.com/v2/payments/${payId}/complete`

  var res = await axios.post(
    platformAPI,{
      'txid': txid
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