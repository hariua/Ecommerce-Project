var createError = require('http-errors');
var express = require('express');
var path = require('path');
var dotenv = require('dotenv').config()
var hbs = require('express-handlebars')
var handlebars = require('handlebars');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileupload = require('express-fileupload')
var session = require('express-session')
var Croppie = require('croppie')
var db = require('./config/connection')

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
app.use(
  session({
    key:'user_id',
    secret:'this is random',
    resave:false,
    saveUninitialized:false,
    cookie:{

      expires:5000000
    }

  })
  );

  app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  })
  handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});
app.use(logger('dev'));
app.use(express.json());
app.use(fileupload())
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
db.connect((err)=>
{
  if(err)
  {
    console.log("Database Connection Failed");
 }
 else{
   console.log("Database Connection Success");
 }
})
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).render('error')
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
