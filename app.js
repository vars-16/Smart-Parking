var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
/*mongoose.connect('mongodb://vars:shubham07@ds253879.mlab.com:53879/smartparking');*/
mongoose.connect('mongodb://localhost:27017/smartparking');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("DB Connected");
});
var Booking = require('./models/booking');
var CronJob = require('cron').CronJob;
 

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/',(req,res)=>{
	res.sendFile(path.join(__dirname + '/public/websocket.html'));
})

try{
	new CronJob('30 * * * * *',function(){
		var now = new Date();
	    var datetime = 0;
	    datetime +=  3600*(now.getHours()) + 60*(now.getMinutes()) + now.getSeconds(); 
		db.collection('bookings').find({flag:0}).toArray(function(err,docs){
			if(err) throw err;
			for(var i=0;i<docs.length;i++){
				if(datetime - docs[i].booking_time > 60){
				Booking.findByIdAndUpdate({_id:docs[i]._id}, {flag: 1} , function(err,doc){
					if(err) throw err;
					//console.log('Done');
				})
				}
			}
		})
	},function(){
		//console.log('I am getting closed');
	},true,'Asia/Kolkata');
}catch(ex){
	console.log('Invalid pattern');
}

app.post('/api/book',function(req,res){
	var booking = new Booking({
		'name':req.body.name,
		'vid':req.body.vid,
		'booking_time':req.body.booking_time,
		'flag':req.body.flag
	});
	booking.save(function(err){
		if(err) throw err;
	})
	res.status(200);
	res.json({"success":"Booking confirmed"});
})

app.get('/api/getbooked',function(req,res){
	Booking.find({flag: 0} , function(err,doc){
					if(err) throw err;
					//console.log(doc.length);
					res.status(200);
					res.json({"count1":doc.length});
	})
})

app.listen(3000,function(){
	console.log('Server started on port 3000');	
})