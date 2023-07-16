/************** Set Up *******************/
// Send the HTML file to the client
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
serv.listen(process.env.PORT || 2000);
console.log('Server Started.');

/************** Objects *****************/
/************* Player ******************/
// Player Constructor
var Player = function(param) {
	var self = {
		id: "",
		chip: '',
		myTurn: false
	}

	if(param) {
		if(param.id)
			self.id = param.id;
		if(param.chip)
			self.chip = param.chip;
		if(param.myTurn)
			self.myTurn = param.myTurn;
	}

	self.update = function() {
		// self.x++;
		// self.y++;
	}

	Player.list[self.id] = self;
	return self;
}
Player.list = {};

Player.onConnect = function(socket, chip, myTurn) {
	Player({
		id: socket.id,
		chip: chip,
		myTurn: myTurn
	});
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

/**************** Game ***************/
// Game Constructor
var Game = function(param) {
	var self = {
		id: "",
		p1: null,
		p2: null,
		winner: "",
		board_state: [0, 0, 0, 0, 0, 0, 0, 0, 0]
	}

	if(param) {
		if(param.id)
			self.id = param.id;
		if(param.p1)
			self.p1 = param.p1;
		if(param.p2)
			self.p2 = param.p2;
	}

	self.update = function() {
		// self.x++;
		// self.y++;
	}

	self.checkWin = function() {
		// 0 1 2
        // 3 4 5
        // 6 7 8
		row1 = self.board_state[0] + self.board_state[1] + self.board_state[2]
        row2 = self.board_state[3] + self.board_state[4] + self.board_state[5]
        row3 = self.board_state[6] + self.board_state[7] + self.board_state[8]
        col1 = self.board_state[0] + self.board_state[3] + self.board_state[6]
        col2 = self.board_state[1] + self.board_state[4] + self.board_state[7]
        col3 = self.board_state[2] + self.board_state[5] + self.board_state[8]
        dia1 = self.board_state[0] + self.board_state[4] + self.board_state[8]
        dia2 = self.board_state[2] + self.board_state[4] + self.board_state[6]
        if (row1 === 3 || row2 === 3 || row3 === 3 || col1 === 3 || col2 === 3 || col3 === 3 || dia1 === 3 || dia2 === 3)
            self.winner = 'P1'
        else if (row1 === -3 || row2 === -3 || row3 === -3 || col1 === -3 || col2 === -3 || col3 === -3 || dia1 === -3 || dia2 === -3)
            self.winner = 'P2'
        
        counter = 0
        for (var i in self.board_state.length) {
			if (self.board_state[i] != 0)
                counter += 1
		}
        if (counter == 9 && self.winner == '')
            self.winner = 'Tie'
	}

	Game.list[self.id] = self;
	return self;
}
Game.list = {};


var SOCKET_LIST = {};

var isGameFull = function(data) {
	if (Game.list[data.gameId].p2 === null)
		return false;
	else
		return true;
}
var doesGameExist = function(data) {
	return Game.list[data.gameId];
}
var addGame = function(data) {
	Game({
		id: data.gameId,
		p1: data.name
	});
}

var DEBUG = true;

// Set up the sockets
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('createGame', function() {
		var gameId = "" + Math.floor(10000 * Math.random())
		while(doesGameExist({gameId: gameId}))
			gameId = "" + Math.floor(10000 * Math.random())
		Player.onConnect(socket, 'x', true);
		addGame({gameId: gameId, name:socket.id});
		socket.emit('createGameResponse', {success:true});
	});

	socket.on('joinGame', function(data) {
		if (!doesGameExist(data)) {
			socket.emit('joinGameResponse', {success:false, msg: "Game ID doesn't exist"});
		}
		else if (isGameFull(data)) {
			socket.emit('joinGameResponse', {success:false, msg: "Game is full"});
		}
		else {
			Player.onConnect(socket, 'o', false);
			Game.list[data.gameId].p2 = socket.id;
			socket.emit('joinGameResponse', {success:true});
		}
	});

	socket.on('disconnect', function() {
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});

	socket.on('sendMsgToServer', function(data) {
		var playerName = ("" + socket.id).slice(2, 7);
		for(var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('addToChat', playerName + ": " + data);
		}
	});

	socket.on('evalServer', function(data) {
		if(!DEBUG)
			return;
		
		var res = eval(data);
		socket.emit('evalAnswer', res);
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