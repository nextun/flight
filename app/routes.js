var Flight = require('./models/flight');
module.exports = function(app) {
	// api ---------------------------------------------------------------------
    // get all
    app.get('/api/flights', function(req, res) {
		Flight.find(function(err, data) {
			if (err) res.send(err)
			res.json(data);
		});
	});
	// create
	app.post('/api/flights', function(req, res) {
		Flight.create({
            code : req.body.code,
            from : req.body.from,
            to : req.body.to,
            depart : req.body.depart,
            arrive : req.body.arrive,
            price : req.body.price,
            seats : req.body.seats,
            books : req.body.books
		}, function(err, data) {
			if (err) res.send(err);
			Flight.find(function(err, data) {
				if (err) res.send(err)
				res.json(data);
			});
		});
	});
	// delete
	app.delete('/api/flights/:flight_id', function(req, res) {
        
        console.log("req.params.flight_id:"+req.params.flight_id);
        
		Flight.remove({
			_id : req.params.flight_id
		}, function(err, data) {
			if (err) res.send(err);
			Flight.find(function(err, data) {
				if (err) res.send(err)
				res.json(data);
			});
		});
	});
	// application -------------------------------------------------------------
	app.get('*', function(req, res) {
		res.sendfile('./www/index.html');
	});
};