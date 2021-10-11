var express = require('express');
var logger = require('morgan');
var helmet = require('helmet');

//initialise routes
var index = require('./routes/index');
var searchPage = require('./routes/search');
var moviePage = require('./routes/movie');
var loginPage = require('./routes/login');
var flickrPage = require('./routes/flickr');

var app = express();

const hostname = '127.0.0.1';
const port = 3000;

// view engine setup
app.use(logger('dev'));
app.use(express.json());
app.use(helmet());
app.use(express.static(__dirname + '/public'));

//using routes
app.use(express.urlencoded({ extended: false }));
app.use('/', index);
app.use('/movieSearch?',searchPage);
app.use('/movie?', moviePage);
app.use('/flickr?', flickrPage);
app.use('/login?', loginPage);

app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});

module.exports = app;
