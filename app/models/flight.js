var mongoose = require('mongoose');

var schema = new mongoose.Schema({

    code : String,
	from : String,
	to : String,
	depart : String,
	arrive : String,
	price : Number,
	seats : Array,
	books : Array
                                
});


module.exports = mongoose.model('Flight', schema);