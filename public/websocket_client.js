// real-time interactions are possible using websocket
// Notice the ws:. This is the new URL schema for WebSocket connections. 
// There is also wss: for secure WebSocket connection the same way 
// https: is used for secure HTTP connections.
// you can get it from Artik cloud documentation page
var wsUri = "wss://api.artik.cloud/v1.1/websocket?ack=true";
var device_id = "11d51108a6a548b98267ae39488fa295"; // Edison parking DEVICE ID
var device_token = "6fd7e31205854628aea0103bb4f9ea9f"; //Intel Edison parking DEVICE TOKEN
var count_decrement=0;
var rainbowData;

var WebSocket = require('ws');
var isWebSocketReady = false;
var data="";
var ws = null;
var flag;

var output;
var attributes_log;
var websocket;


function init() {     
    var lat,long;
    output = document.getElementById("output");
    attributes_log = document.getElementById("attributes_log");
    if (browserSupportsWebSockets() === false) {
        writeToScreen("Sorry! your web browser does not support WebSockets. Try using Google Chrome or Firefox Latest Versions");
        var element = document.getElementById("websocketelements");
        element.parentNode.removeChild(element);

        return; //
    }
    websocket = new WebSocket(wsUri);
    websocket.onopen = function() {		
        writeToScreen("Successfully connected to Parking System");
		register();
    };
    websocket.onmessage = function(evt) {
        onMessage(evt);
    };
    websocket.onerror = function(evt) {
        onError(evt);
    };
}
function geo_success(position) {
  lat =  position.coords.latitude;
  long = position.coords.longitude;
  //console.log(lat,long);
  var directionsDisplay;
  var directionsService = new google.maps.DirectionsService();
  var map;
  var mapCanvas = document.getElementById("map");
            directionsDisplay = new google.maps.DirectionsRenderer();
            var mapOptions = {
                zoom: 7,
                center: new google.maps.LatLng(26.90441253, 77.35887609),
            };
            map = new google.maps.Map(document.getElementById('map'), mapOptions);
            directionsDisplay.setMap(map);
            calcRoute(lat,long,directionsService,directionsDisplay);
            //calcRoute1(lat,long,directionsService,directionsDisplay);
}

function calcRoute(lat,long,directionsService,directionsDisplay) {
        var start = new google.maps.LatLng(lat, long);
        var end = new google.maps.LatLng(28.549733, 77.183923);
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(start);
        bounds.extend(end);
        var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                directionsDisplay.setMap(map);
            } else {
                alert("Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
            }
        });
    }

function geo_error(err) {
  if(err.code == 1) {
    error('The user denied the request for location information.')
  } else if (err.code == 2) {
    error('Your location information is unavailable.')
  } else if (err.code == 3) {
    error('The request to get your location timed out.')
  } else {
    error('An unknown error occurred while requesting your location.')
  }
}


function onClose(evt) {
    websocket.close();
    writeToScreen("DISCONNECTED");
}

function onMessage(evt) {   
    writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data + '</span>');
	handleRcvMsg(evt.data);
}

function onError(evt) {
    writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
}

function doSend(message) {
    websocket.send(message);
    writeToScreen("SENT: " + message);
}

function writeAttributeValues(prefix) {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = "INFO " + getCurrentDate() + " " + prefix + "<b> readyState: " + websocket.readyState + " bufferedAmount: " + websocket.bufferedAmount + "</b>";
    ;
    attributes_log.appendChild(pre);
}

function writeToScreen(message) {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    //output.appendChild(pre);
}

function getCurrentDate() {
    var now = new Date();
    var datetime = now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate();
    datetime += ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    return datetime;
}

function getCurrentDate1() {
    var now = new Date();
    var datetime = 0;
    datetime +=  3600*(now.getHours()) + 60*(now.getMinutes()) + now.getSeconds();
    return datetime;
}

function browserSupportsWebSockets() {
    if ("WebSocket" in window){
        return true;
    }
    else{
        return false;
    }
}

function getTimeMillis(){
    return parseInt(Date.now().toString());
}

function register(){
    writeToScreen("Registering device on the WebSocket connection");
    try{
        var registerMessage = '{"type":"register", "sdid":"'+device_id+'", "Authorization":"bearer '+device_token+'", "cid":"'+getTimeMillis()+'"}';
        writeToScreen('Sending register message ' + registerMessage + '\n');
        websocket.send(registerMessage, {mask: true});
        isWebSocketReady = true;
	}
    catch (e) {
        writeToScreen('Failed to register messages. Error in registering message: ' + e.toString());
    }    
}


function handleRcvMsg(msg){
	var msgObj = JSON.parse(msg);  
    if (msgObj.type != "action") return; //Early return;
    var actions = msgObj.data.actions;
    var actionName = actions[0].name; 
    //console.log("The received action is " + actionName);
    try{
        var http = new XMLHttpRequest();
        var url = "/api/getbooked";
        http.open("GET", url, true);
        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                //console.log(http.responseText.json());
                var data = JSON.parse(http.responseText);
                //console.log(data['count1']);
                count_decrement = (data['count1']);
            }
        }
        http.send();
    }
    catch (e) {
        console.error('Error in sending a message: ' + e.toString() +'\n');
    }
    /*console.log(count_decrement);*/
    rainbowData = actions[0].parameters.text - count_decrement; 
    if(rainbowData<=0){
        flag = false;
        if(!flag){
            document.getElementById('book').disabled = true;
        }
    }
    console.log(rainbowData);
	document.getElementById("rainbow").innerHTML = "Capacity: 5,  Free Slot: "+rainbowData;
   
}

function called(){
    var name = document.getElementById('name').value;
    var vid = document.getElementById('vid').value;
    if(name=="" && vid==""){
        flag = false;
    }else{
        flag = true;
    }
    if(!flag){
        document.getElementById('book').disabled = true;
    }else{
        document.getElementById('book').disabled = false;
    }
}


function bookslot(){
    try{
        var name = document.getElementById('name').value;
        var vid = document.getElementById('vid').value;
        console.log(name,vid);
        ts = ', "ts": '+getTimeMillis();
        var http = new XMLHttpRequest();
        var url = "/api/book";
        var params = {
            "name":name,
            "vid":vid,
            "booking_time":getCurrentDate1(),
            "flag":0
        }
        var param = JSON.stringify(params);
        http.open("POST", url, true);
        http.setRequestHeader("Content-type", "application/json");

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                alert(http.responseText);
            }
        }
        http.send(param);
        try{
        var http = new XMLHttpRequest();
        var url = "/api/getbooked";
        http.open("GET", url, true);
        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                var data = JSON.parse(http.responseText);
                count_decrement = (data['count1']);
                rainbowData -= count_decrement;
                if(rainbowData<=0){
                    flag = false;
                    if(!flag){
                        document.getElementById('book').disabled = true;
                    }
                }
            }
        }
        http.send();
        }
        catch (e) {
            console.error('Error in sending a message: ' + e.toString() +'\n');
        }
        var data = {
            "parking_slot" : rainbowData,
            "booking_check":true,
            "count_flag":1
        };
        var payload = '{"sdid":"'+device_id+'"'+ts+', "data": '+JSON.stringify(data)+', "cid":"'+getTimeMillis()+'"}';
        //console.log('Sending payload ' + payload + '\n');
        websocket.send(payload, {mask: true});
        /*count_decrement = 1;
        setInterval(function(){ count_decrement = 0 }, 60000);*/
    } 
    catch (e) {
        console.error('Error in sending a message: ' + e.toString() +'\n');
    }   
}