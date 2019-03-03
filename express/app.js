var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var socketRouter = require('./routes/socket');

var app = express();

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

var expressWs = require('express-ws')(app);

app.use('/socket', socketRouter);

module.exports = app;
