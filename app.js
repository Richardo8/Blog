var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session')
var MongoStore = require('connect-mongo')(session);

var routes = require('./routes/index')
var settings = require('./settings')
var flash = require('connect-flash')
// var multer = require('multer')

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var ejs = require('ejs')

var app = express();

//app.use() requires middleware functions 用原来的方法multer会抛出该错误
// app.use(multer({
//   dest: './public/images',
//   rename: function (fieldname, filename) {
//     return filename;
//   }
// }))

app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,
  cookie: {maxAge: 1000*60*60*24*30},
  store: new MongoStore({
    // db: settings.db,
    // host: settings.host,
    // port: settings.port
    url: settings.url
  })
}))
//connect-mongo之后的版本new store的时候需要修改格式 被注释掉的是早现版本的 新版本的使用url

app.set('port', process.env.PORT || 3001);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', ejs.__express);
app.set('view engine', 'html');

app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream: accessLog}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + ']' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
})

routes(app)

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
