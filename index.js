const params = {
    longitude: "139.696233",
    latitude: "35.570431",
    elevation: "0",
    from_date: "2021-10-15",
    to_date: "2021-10-15",
    time: "20:00:00"
  }
var div = document.querySelector('#test'),
loc = document.querySelector('#locate');
  const id = "aa6b3850-d02a-4183-ada8-6e9ac5e63633";
  const secret = "90b0ed4b46299c3d64868f62aaf5933ba2ffd3b3db1637c4b20be02018b748feab99f0b87c6b5890891f5bcf56b4a57fbf08be13c72838d887c53681ce5945833eeffc7dae81d5b29e0803a188877960d61e91021ae2409c848e3021d3822f1a28a632b3a0b5c08134868bef11952a77";
  

  axios.get('https://api.astronomyapi.com/api/v2/bodies/positions',{
  params: {
    longitude: "7.6317913",
    latitude: "8.9993446",
    elevation: "387.58840287412346",
    from_date: "2021-10-16",
    to_date: "2021-10-16",
    time: "19:50:00"
  },
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Authorization: `Basic ${btoa(
    `${id}:${secret}`
    )}`
  }})
  .then((response) => {div.textContent += JSON.stringify(response.data)
    console.log(response.data)
  })