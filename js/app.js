  /*var SavedObj = localStorage.getItem('savedData')?
     JSON.parse(localStorage.getItem('savedData')):
     null;*/
     var t;
  var isContained = function(prop) {
    if (!SavedObj)
      return false;
    return !!SavedObj[prop]
  }
  Number.prototype.getDeci = function() {
    return this - Math.floor(this);
  }

  var formatDate = function(date) {
    return date.toJSON()
      .match(/(\d+)-(\d+)-(\d+)/)[0]
  }
  var Store = Vue.observable({
    debug: false,
    State: {
      //isConfigured: true,
      isConfigured: function() {
        return !!(this.pos.lat && this.pos.long && this.pos.alt)
      },
      dateChanged: false,
      endpoint: 'https://api.astronomyapi.com/api/v2/bodies',
      from_date: formatDate(new Date),
      to_date: formatDate(new Date),
      time: localStorage.getItem('time')? localStorage.getItem('time'): '18:00:00',
      requestOccur: false,
      pos: localStorage.getItem('savedData') ?
        JSON.parse(localStorage.getItem('savedData')) : {},
      appSecret: "90b0ed4b46299c3d64868f62aaf5933ba2ffd3b3db1637c4b20be02018b748feab99f0b87c6b5890891f5bcf56b4a57fbf08be13c72838d887c53681ce5945833eeffc7dae81d5b29e0803a188877960d61e91021ae2409c848e3021d3822f1a28a632b3a0b5c08134868bef11952a77",
      appId: "aa6b3850-d02a-4183-ada8-6e9ac5e63633"
    },
    computed: {
      homeError: {
        message: null,
        boolean: null
      },
      bodiesList: null,
      Constellations: null,
      sideRealAngle: null,
      chartUrl: null,
      JD: null
    },
    /*requests: {
      moonUrl: null,
      moonStillLoading: true,
      chartUrl: null,
      chartStillLoading: true,
    },*/
    setData(propName, newValue, cat='State') {
      if (this.debug) console.log('setData triggered with', newValue, 'on', propName);
      this[cat][propName] = newValue
    },
    clearMessageAction(propName) {
      if (this.debug) console.log(propName, 'cleared')
      this.state[propName] = ''
    },
    setJD(y, m, d) {
      if (m <= 2) {
        var mg = m + 12,
          yg = y - 1;
      } else {
        var mg = m,
          yg = y;
      }
      var A = Math.floor(yg / 100),
        B = 2 - A + Math.floor(A / 4),
        JD = Math.floor(365.25 * (yg + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
      Store.setData('JD',JD,'computed')
    },
    setSTAngle(present,obsTime, long,JD) {
      present.setHours(obsTime.hr,obsTime.min,obsTime.sec)
      var y = present.getUTCFullYear(),
        mth = present.getUTCMonth() +1,
        d = present.getUTCDate(),
        hr = present.getUTCHours(),
        min = present.getUTCMinutes(),
        sec = present.getUTCSeconds(),
        T = (JD - 2451545.0) / 36525,
        ST0 = 280.46061837 + 360.98564736629 * (JD - 2451545) + 0.000387933 * T ** 2 - (T ** 3 / 38710000);
      ST0 %= 360;
      ST0 = ST0 < 0 ? ST0 + 360 : ST0;
      Store.setData('sideRealAngle',ST0,'computed')
    },
    setBodiesList(context) {
      var vm = context.SharedData || context;
      Store.setData('requestOccur', true)
      axios.get('https://api.astronomyapi.com/api/v2/bodies/positions', {
          params: {
            longitude: vm.pos.long,
            latitude: vm.pos.lat,
            elevation: vm.pos.alt,
            from_date: vm.from_date,
            to_date: vm.to_date,
            time: vm.time
          },
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Authorization: `Basic ${btoa(
              `${vm.appId}:${vm.appSecret}`
              )}`
          }
        })
        .then((response) => {
          if (response) {
            Store.setData('homeError',{
              boolean:null,message:null
            },'computed')
            console.log(response.data.data.table.rows);
            ParsedObj = response.data.data.table.rows.reduce((filtered, item) => {
              var ra = Number(item.cells[0].position.equatorial.rightAscension.hours) * 15,
                dec = Number(item.cells[0].position.equatorial.declination.degrees),
                name = item.cells[0].id;
                const {lat,long}= Store.State.pos;
              riseSet = Store.setRiseSet(Number(long), Number(lat), ra, dec, Store.computed.sideRealAngle, name)
              item.rise = riseSet.rise;
              item.sett = riseSet.sett;
              filtered.push(item)
            
              return filtered
            },[])
            Store.setData('bodiesList', ParsedObj, 'computed');
          }
        })
        .catch(error =>{
          t = error;
          error.boolean = true;
          Store.setData('homeError',error,'computed')
        })
        .finally(()=> Store.setData('requestOccur',false))
    },
    setRiseSet(long, lat, ra, dec, st,name) {
        var h0;
        if (name == 'sun')
          h0 = -0.8333;
        else if(name == 'moon')
          h0 = 0.125
        else
          h0 = 0.5667;
        var toRad = Math.PI / 180.0,
          toDeg = 180.0 / Math.PI,
          cosH0 = (Math.sin(h0 * toRad) - (Math.sin(lat * toRad) * Math.sin(dec * toRad))) / (Math.cos(lat * toRad) * Math.cos(dec * toRad)),
          H0 = Math.acos(cosH0) * toDeg,
          trans = Store.constrain(
            (ra + long - st) / 360),
          rise = Store.constrain(
            trans - (H0 / 360)),
          sett = Store.constrain(trans + (H0 / 360));
        var hour2Time = function(hr) {
          var hrFrac = parseFloat(hr).getDeci();
          var hrs = hr - hrFrac >= 10 ? hr - hrFrac : '0' + (hr - hrFrac),
            mins = Math.floor(hrFrac * 60) >= 10 ? Math.floor(hrFrac * 60) : '0' + Math.floor(hrFrac * 60);
          return `${hrs}:${mins}`
        };
        return {
          rise: hour2Time(rise * 24  - 5/60),
          sett: hour2Time(sett * 24  + 5/60)
        };
      },
      constrain(x) {
        var x = parseFloat(x);
        return x > 1 ? x - 1 : x < 0 ? x + 1 : x;
      },
    setCheckDate(context,event,form) {
      var changed = false;
      var [day,month,year,hour,minute] = [form.day.value, form.month.value, form.year.value, form.hour.value,form.minute.value];
      function fmt(digit) {
        var num = Number(digit);
        return num > 9? num: `0${num}` 
      }
      if (
        `${year}-${fmt(month)}-${fmt(day)}` == Store.State.from_date && `${fmt(hour)}:${fmt(minute)}:00` == Store.State.time
      ) return;
      const checkDate = function (yr,mt,dy){
        if(new Date(yr,mt -1,dy).getMonth() != mt -1 || yr < 2000)
          context.dateError ="Error: invalid date input";
        else {
          Store.setData('dateChanged', true);
          Store.setData('from_date', `${year}-${month}-${day}`)
          Store.setData('to_date', `${yr}-${fmt(mt)}-${fmt(dy)}`)
          changed = true;
          Object.assign(context, {
            ddate: [yr, fmt(mt), fmt(dy)],
            dateError: null
          })
        }
      }
      const checkTime = function (h,m){
        var newT = `${fmt(hour)}:${fmt(minute)}:00`;
        if (newT == Store.State.time)
          return;
        else if (new Date(year, month - 1, day, h, m).getHours() == hour) {
          changed = true;
          localStorage.setItem('time',newT)
          Store.setData('time', newT)
          Object.assign(context, {
            dtime: [fmt(h), fmt(m), '00'],
            timeError: null
          })
        }else {
          context.timeError = "Error: invalid time inputs"
        }
      }
      if(year,month,day)
        checkDate(year,month,day);
      else
        context.dateError = "Error: a date field was left empty";
      if(minute && hour)
        checkTime(hour,minute);
      else
        context.timeError = "Error: time field left empty";
      if(changed && context.SharedData.isConfigured()){
        Store.setJD(Number(year),Number(month),Number(day))
        Store.setSTAngle(new Date(year,month,day),{hr: hour,min:minute,sec: 00},context.SharedData.pos.long,Store.computed.JD)
        Store.setBodiesList(context)
      } 
    }

  });

  //components
  const animComp = {
    template: '#anim',
    props: [],
    data: function () {
      return{
        docsNotLoaded: true,
      }  
    },
    computed: {
      showAnim() {
        return Store.State.requestOccur || this.docsNotLoaded
      }
    },
    mounted() {
      var thisComp = this;
      document.onreadystatechange = () =>{
        if(document.readyState = 'complete' /*&& thisComp.requestOccur == true*/){
          this.docsNotLoaded = false;
        }
        // setInterval(function () {
        //   alert(thisComp.showAnim )
        // },5000)
      }
    }
  }
  const Settings = {
    template: '#settings',
    props: ['isConfigured','fromDate','time'],
    data: function() {
      return {
        SharedData: Store.State,
        willShowForm: !this.isConfigured,
        auth: {
          signed: false,
          result: null
        },
        //year: this.fromDate.split('-')[0],
        ddate: Store.State.from_date.split('-'),
        dtime: Store.State.time.split(':'),
        fullDate: function (){
          var parDate = Array.from(this.ddate);
          parDate[1] -= 1;
          return new Date(...parDate).toDateString()
        },
        fullTime(){
          var dateArr = Array.from(this.ddate),
              timeArr = Array.from(this.dtime);
          return new Date(dateArr[0],dateArr[1]-1,dateArr[2],timeArr[0],timeArr[1],timeArr[2]).toLocaleTimeString()
        },
        dateError: '',
        manualLocError: '',
        autoLocError: '',
        ManualData: {
          lng: {
            num: '',
            dir: 'W',
          },
          lat: {
            num: '',
            dir: 'N'
          },
          alt: ''
        },
        timeError: ''
      }
    },
    computed: {

    },
    methods: {
      showForm() {
        this.willShowForm = true
      },
      saveLocationData(posObj){
        Store.setData('pos', posObj)
        var newPosData = JSON.stringify(posObj);
        if(newPosData != JSON.stringify(localStorage.getItem('savedData'))
        ){
          localStorage.setItem(
            'savedData', JSON.stringify(posObj)
          )
          this.willShowForm = false;
          Store.setBodiesList(this)
        }
      },
      setAutoLoc() {
        var thisComp = this;
        if ('geolocation' in navigator) {
          function success(pos) {
            var proxyObj = {
              lat: pos.coords.latitude,
              long: pos.coords.longitude,
              alt: pos.coords.altitude || 58
            }
            thisComp.saveLocationData(proxyObj)
            thisComp.autoLocError =''
          }
          function error(e) {
            thisComp.autoLocError = e.message
          }
          navigator.geolocation.getCurrentPosition(success, error)
        }else
         this.autoLocError = 'Oops.. your browser does not support geolocation.\
          Try installing a more modern browser or choose another method';
      },
      setManualLoc(posData) {
        console.log(JSON.stringify(posData))
        const isNum = function (num) {
          return typeof Number(num) == 'number' && !isNaN(num) && num != ''
        }
        const {lat, lng, alt} = posData;
        console.log(lat.dir == 'N',lng.dir == 'W')
        if (isNum(lat.num) && isNum(lat.num) && isNum(alt)) {
          const lngNum = lng.dir == "E" ? lng.num : -1 * lng.num,
            latNum = lat.dir == "N" ? lat.num : -1 * lat.num;
          if (latNum <= 90 && latNum >= -90 && lngNum <= 180 && lngNum >= -180) {
            const posObj = {
              long: lngNum,
              lat: latNum,
              alt: alt
            }
            this.saveLocationData(posObj)
            this.manualLocError = ''
          } else {
            this.manualLocError = 'Make Sure that longitude is less than 180 and latitude is less than 90';
            return
          }
        } else {
          this.manualLocError = 'Make sure that all your inputs are valid numbers';
          return
        }
      },
      authenticate (){
        function onIncompletePaymentFound(payment) { return 0 };
        var scopes = ['username','payments'];
        var thee = this;
        Pi.authenticate(scopes, onIncompletePaymentFound).then(function(auth) {
             thee.auth.signed = true;
             thee.auth.result = auth.user;
        }).catch(function(error) {
             alert('error');
         });
      },
      pay(){
        var PaymentData = {
          amount: 1,
          memo: "donation for dev",
          metadata: {
            orderID: 1
          },
        };
        const axiosClient = axios.create({ baseURL: `https://skysage.netlify.app/.netlify/`, timeout: 20000, withCredentials: true});

        var PaymentCallbacks = {
           onReadyForServerApproval: (paymentId)=>{
            alert("onReadyForServerApproval. "+ paymentId)
            fetch(
              "https://skysage.netlify.app/.netlify/functions/approvePay",{
                method: 'POST',
                body: JSON.stringify({
                  payId: paymentId
                })
              }).then(
                alert("approval in progress")
                ).catch(e=>{
                  alert(e.body)
                })
                  
          },
          onReadyForServerCompletion: (paymentId,txid) => {
            
          },
          onCancel: (paymentId) =>{
            
          },
          onError: (error, PaymentDTO) => {
            
          },
        };
        
        Pi.createPayment(PaymentData, PaymentCallbacks)
      },
      parseDateInput(e){
        var form = document.querySelector('#dateForm');
        Store.setCheckDate(this,e,form)
      }
    }
  };
  const  Weather = {
    template: '#weather',
    data: function (){
      return {
        SharedData: Store.State, 
        weatherResp: null,
        
        uri() {
          return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${this.SharedData.pos.lat},${this.SharedData.pos.long}/${this.specDate()}?unitGroup=metric&elements=datetime%2Cname%2Caddress%2CresolvedAddress%2Clatitude%2Clongitude%2Chumidity%2Cprecip%2Ccloudcover%2Cvisibility%2Cconditions%2Cdescription%2Cicon&key=R4THCUW49NCMKX86RCKMBJ2G7&contentType=json`
      },
      specDate() {
        return `${this.SharedData.from_date}T${this.SharedData.time}`
      }
      }
    },
    computed: {
      
    },
    created: function() {
      var thee = this;
        axios.get(this.uri())
        .then(response => {
          var hr = Number(Store.State.time.split(':')[0]);
          var con = Array.from(response.data.days[0].hours);
          thee.weatherResp =  con[hr]
        })
        .catch((e) => {
    
        })
        .finally(() => {
    
        })
    }
  }
  
  const inputError = {
    template: '#inputError',
    props: ['error']
  };
  
  const networkError = {
    template: '#networkError',
    props: ['error'],
    methods: {
      // reset(){
      //   Store.setData('homeError',{
      //     boolean: false,
      //     message: null
      //   }, 'computed')
      // }
    }
  }
  Vue.component('anim', animComp)
  Vue.component('network-error', networkError)
  Vue.component('input-error',inputError)
  Vue.component('weather', Weather)
  Vue.component('not-configured',{
    template: '#notConfigured'
  })
  const Home = {
    template: '#planetsComp',
    props: ['isConfigured','bodieList'],
    data: function() {
      return {
        pos: Store.State.pos, 
        bodiesList: Store.State.bodiesList,
        SharedData: Store.State,
        dtime: Store.State.time.split(':'),
        ddate: Store.State.from_date.split('-'),
        dateError: null,
        timeError: null
      }
    },
    methods: {
      
      parseDateInput(e){
        var form = document.querySelector('#homeForm');
        // console.log(form,e)
        Store.setCheckDate(this,e,form)
      }
    }, 
    computed: {
      error() {
        return Store.computed.homeError
      },
      planetsList() {
        var list = Array.from(Store.computed.bodiesList),
          thisComp = this;
        var  {lat,long} = this.pos;
        if(list){
          list.splice(4,1);
          var visiblePlanets = list.reduce((filtered,item) => {
              if(item.cells[0].position.horizonal.altitude.degrees > 0){
                filtered.push(item)
              }
              return filtered
            },[])
          return visiblePlanets;
        }
      }
    },
  }
  
  const solarSystem = {
    template: '#solarSys',
    props: ['isConfigured','bodieList'],
    data: function(){
      return{
        dtime: Store.State.time.split(':'),
        ddate: Store.State.from_date.split('-'),
        SharedData: Store.State
      }
    },
    computed: {
      error(){
        return Store.computed.homeError
      },
      bodiesList(){
        var fullList = Array.from(Store.computed.bodiesList);
        fullList.splice(1,1);
        return fullList
      }
    },
    methods: {
      parseDateInput(e) {
        var form = document.querySelector('#homeFor');
        // console.log(form,e)
        Store.setCheckDate(this, e, form)
      }
    }
  }
  
  const MoonPhase = {
    props: ['isConfigured'],
    template: '#moonPhase',
    data: function() {
      return {
        SharedData: Store.State,
        requestOccur: false,
        imageUrl: '',
        error: '',
        stillLoading: false
      }
    },
    computed: {
      moonData(){
        return Store.computed.bodiesList[1].cells[0]
      },
      percentage() {
        if(this.moonData){
          var i = Math.cos(this.moonData.extraInfo.phase.angel * Math.PI / 180)
          return parseInt(((1 - i) / 2) *100)
        }
      }
    },
    methods: {
      imgLoaded(e){
        // if(e.target.getAttribute('src') != '')
        alert('loaded')
          Store.setData('requestOccur',false);
      }
    },
    
    activated: function() {
      var vm = this.SharedData;
      var sel = this;
      if(vm.dateChanged || sel.imageUrl == ''){
        sel.requestOccur = true;
        sel.stillLoading = true;
        Store.setData('dateChanged',false)
        axios.post('https://api.astronomyapi.com/api/v2/studio/moon-phase', {
              format: 'svg',
              style: {
                moonStyle: "default",
                backgroundStyle: "solid",
                backgroundColor: "#111",
                headingColor: "white",
                textColor: "#fff"
              },
              observer: {
                latitude: Number(vm.pos.lat),
                longitude: Number(vm.pos.long),
                date: vm.from_date
              },
              view: {
                type: "portrait-simple",
                orientation: "south-up"
              }
          },
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
              Authorization: `Basic ${btoa(
                        `${vm.appId}:${vm.appSecret}`
              )}`
            }
          })
          .then((response) => {
            sel.imageUrl = response.data.data.imageUrl
          })
          .catch((e)=>{
            this.error = e
          })
          .finally(()=>{
            this.requestOccur = false;
          })
      }
    }
  }
  
  const starChart = {
    props: ['isConfigured'],
    template: '#starChart',
    data: function (){
      return {
        SharedData: Store.State,
        stillLoading: true,
        requestOccur: false,
        // imageUrl: '',
        inputConst: '',
        inputRA: '',
        inputDec: '',
        inputZoom: '',
        dConst: '',
        showModal: false,
        error: '',
        areaErr: '',
        constErr: '',
      }
    },
    computed: {
      Constellations(){
        return Store.computed.Constellations
      },
      imageUrl(){
        return Store.computed.chartUrl
      }
    },
    methods: {
      fetchImg(e){
        
        var parameters = {};
        var vmD = this.SharedData;
        var form = e.target.parentNode, type, 
          thy = this;
        if (this.inputConst){
          type = 'constellation';
          var key = this.inputConst.trim().toLowerCase();
          if(thy.Constellations[key])
            parameters['constellation'] = thy.Constellations[key];
          else{
            thy.constErr = 'Invalid Constellation Name'
            return
          }
        }
        else if(thy.inputRA && thy.inputDec){
          var RA = Number(thy.inputRA),
            dec = Number(thy.inputDec),
            zoom = Number(thy.inputZoom)
          if(RA >= 0 && RA <= 23 && dec >=-90 && dec <= 90 && zoom > 0){
              type = 'area';
              parameters['position'] = {
              equatorial: {
                rightAscension: RA,
                declination: dec
              }
            };
            parameters['zoom'] = zoom;
          }else {
            thy.areaErr = 'Ensure RA (0.00 to 23.99), Dec(-90 to +90) and zoom (1 to 10) are all valid'
            return
          }
        }
        Object.assign(this,{
          stillLoading: true,
          requestOccur: true,
          dConst: '',
          constErr: '',
          areaErr: ''
        })
        axios
          .post(
            'https://api.astronomyapi.com/api/v2/studio/star-chart',
            {
              style: 'default',
              observer: {
                longitude: Number(vmD.pos.long),
                latitude: Number(vmD.pos.lat),
                date: vmD.from_date,
              },
              view: {
                type: type,
                parameters,
              },
            },
            {
              headers: {
                "X-Requested-With": "XMLHttpRequest",
                Authorization: `Basic ${btoa(
                          `${vmD.appId}:${vmD.appSecret}`
                        )}`,
              },
            }
          )
          .then((response) => {
            // thy.imageUrl =response.data.data.imageUrl
            thy.dConst = thy.inputConst;
            thy.inputConst = ''; 
            Store.setData('chartUrl',response.data.data.imageUrl,'computed')
          })
          .catch((e)=>{
            this.error = e;
          })
          .finally(()=>{
            this.requestOccur = false
          })
      },
      scrollToView(e){
        this.stillLoading = false;
        e.target.scrollIntoView({behavior: "smooth", block: "start", inline: "center"});
      }
      
    },
    created(){
      var vm = this;
      if(vm.Constellations == null){
        fetch('./js/constellations.json')
        .then(response =>{
          response.json()
          .then(data =>{
            Store.setData('Constellations',data,'computed')
          })
        })
        .catch((e) =>{
          
        })
      }
    }
  }
  //router
  const router = new VueRouter({
    routes: [
      {
        path: '/',
        component: Home
      },
      {
        path: '/home',
        component: Home
      },
      {
        path: '/Settings',
        component: Settings
      },
      {
        path: '/moonPhase',
        component: MoonPhase
      },
      {
        path: '/solar-system',
        component: solarSystem
      },
      {
        path: '/star-chart',
        component: starChart
      }
   ]
  });
  
  // app instance

  const app = new Vue({
    el: '#app',
    router: router,
    data: function() {
      return {
        SharedData: Store.State
      }
    },
    computed: {
      bodiesList: function() {
        return Store.computed.bodiesList;
      },
      JD: function() {
        return Store.computed.JD;
      } 
    },
    mounted: function (arg) {
      var dateArr = this.SharedData.from_date.split('-'),
          timeArr = this.SharedData.time.split(':')
          long = this.SharedData.pos.long;
      Store.setJD(Number(dateArr[0]),Number(dateArr[1]),Number(dateArr[2]))
      if (long)
        Store.setSTAngle(new Date(), {hr: timeArr[0],min:timeArr[1], sec: timeArr[2]},long,this.JD)
    },
    created: function () {
      if(this.SharedData.isConfigured())
        Store.setBodiesList(this);
    }
  })
