var mongoose = require('mongoose');

var BookingSchema = mongoose.Schema({
	name:{
		type:String,
	},
	vid:{
		type:String,
	},
	booking_time:{
		type:Number,
	},
	flag:{
		type:Number,
	}
})

var Booking = module.exports = mongoose.model('Booking',BookingSchema);