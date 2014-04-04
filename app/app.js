
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var socketio = require('socket.io');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    res.render('index', {
        title: 'Running builds',
        socket: process.env.socket || 'http://localhost:3000/'
    });
});

var server = http.createServer(app);
var io = socketio.listen(server);
io.set('log level', 1);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {
  socket.emit('buildstate', monitor.currentBuilds);
});

var monitor = new (require('./monitor').Monitor)();
var tfs = require('./monitor-tfs');

tfs.configure({
    server: process.env.server, // 'https://odatawrapper'
    user: process.env.user, // 'Domain\User'
    password: process.env.password, // 'Password'
    collection: process.env.collection || 'DefaultCollection'
});

monitor.extendWith(tfs);

monitor.on('update', function (builds) {
  io.sockets.emit('buildstate', monitor.currentBuilds);
});

monitor.run();