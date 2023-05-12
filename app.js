// Send the HTML file to the client
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
serv.listen(2000);
console.log('Server Started.');

// Set up lists
var SOCKET_LIST = {};

// Player Constructor
var Player = function(id) {
	var self = {
		x: 50,
		y: 50,
		id: id,
		number: "" + Math.floor(10 * Math.random())
	}

	self.update = function() {
		self.x++;
		self.y++;
	}

	Player.list[id] = self;
	return self;
}
Player.list = {};

Player.onConnect = function(socket) {
	Player(socket.id);
}

Player.onDisconnect = function(socket) {
	delete Player.list[socket.id];
}

Player.update = function() {
	var pack = [];
	for (var i in Player.list) {
		var player = Player.list[i];
		player.update();
		pack.push({
			x: player.x,
			y: player.y,
			number: player.number
		});
	}

	return pack;
}

// Game Constructor
var Game = function(id) {
	var self = {
		id: id,
		players: [],
		chips: []
	}

	self.update = function() {
		self.x++;
		self.y++;
	}

	Game.list[id] = self;
	return self;
}
Game.list = {};

// Set up the sockets
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	Player.onConnect(socket);

	socket.on('disconnect', function() {
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
});


// Update x and y every 40 ms
setInterval(function() {
	var pack = Player.update();

	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}

	
}, 40);

// Generate GameID
const guid = () => "" + Math.floor(999 * Math.random());