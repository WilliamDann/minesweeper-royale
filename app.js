var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const app = express();
expressWs = require('express-ws')(app);

var socketRouter = require('./routes/socket');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Determine where the server should run
var hostname = "localhost";
process.argv.forEach(function (val, index, array) {
	switch (val) {
		case "--hostname":
			let data = process.argv[index+1];
			if (data) hostname = data;
		break;
	}
});

app.use('/socket', socketRouter);
app.get('/js/scripts.js', function (req, res, next) {
	return res.render('scripts', { socket: 'ws://' +  hostname + ':3000/socket' });
});

app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

app.listen(3000);
console.log("Started on http://" + hostname + ":3000");