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
// console.log('Server Started.');

/************** Objects *****************/
/************* Player ******************/
// Player Constructor
var Player = function(param) {
	var self = {
		id: "",
		gameId: "",
		chip: '',
		score: 0,
		myTurn: false
	}

	if(param) {
		if(param.id)
			self.id = param.id;
		if(param.gameId)
			self.gameId = param.gameId;
		if(param.chip)
			self.chip = param.chip;
		if(param.myTurn)
			self.myTurn = param.myTurn;
	}

	self.getInitPack = function() {
		return {
			id: self.id,
			gameId: self.gameId,
			chip: self.chip,
			score: self.score,
			myTurn: self.myTurn
		};
	}

	self.getUpdatePack = function() {
		return {
			id: self.id,
			myTurn: self.myTurn,
			score: self.score
		};
	}

	self.update = function() {
		// self.x++;
		// self.y++;
	}

	Player.list[self.id] = self;
	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};

Player.onConnect = function(socket, param) {
	var player = Player(param);

	// Listen for keypress event
	socket.on('keyPress', function(data) {
		if (!player.myTurn || Game.list[player.gameId].p2 === null || Game.list[player.gameId].winner !== null)
			return;
		else if (Game.list[player.gameId].board_state[data.state] !== 0)
			return;
		else {
			var g = Game.list[player.gameId];
			if (player.chip === 'x') {
				g.board_state[data.state] = 1;
				Player.list[g.p2].myTurn = true;
			}
			else {
				g.board_state[data.state] = -1;
				Player.list[g.p1].myTurn = true;
			}
			
			player.myTurn = false;
		}
	});

	socket.emit('init', {
		selfId: socket.id,
		player: Player.getAllInitPack(),
		game: Game.getAllInitPack()
	})
}

Player.getAllInitPack = function() {
	var players = [];
	for(var i in Player.list) {
		players.push(Player.list[i].getInitPack());
	}
	return players;
}

Player.onDisconnect = function(socket) {
	var p = Player.list[socket.id];
	if(!p)
		return;

	var gameId = p.gameId;
	var p2 = '';
	if(p.chip === 'x')
		p2 = Game.list[gameId].p2;
	else
		p2 = Game.list[gameId].p1;
	
	removePack.game.push(gameId);
	removePack.player.push(socket.id);
	removePack.player.push(p2);
	delete Player.list[socket.id];
	delete Player.list[p2];
	delete Game.list[gameId];
}

Player.update = function() {
	var pack = [];
	// Loop through players to update
	for(var i in Player.list) {
		// update x and y
		var player = Player.list[i];
		player.update();
		// add to package
		pack.push(player.getUpdatePack());
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
		winner: null,
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

	self.getInitPack = function() {
		return {
			id: self.id,
			p1: self.p1,
			p2: self.p2,
			winner: self.winner,
			board_state: self.board_state
		};
	}

	self.getUpdatePack = function() {
		return {
			id: self.id,
			winner: self.winner,
			board_state: self.board_state
		};
	}

	self.update = function() {
		self.checkWin();
	}

	self.checkWin = function() {
		if (self.winner !== null)
			return;
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
        if (row1 === 3 || row2 === 3 || row3 === 3 || col1 === 3 || col2 === 3 || col3 === 3 || dia1 === 3 || dia2 === 3) {
            self.winner = 'P1';
			Player.list[self.p1].score += 1;
		}
        else if (row1 === -3 || row2 === -3 || row3 === -3 || col1 === -3 || col2 === -3 || col3 === -3 || dia1 === -3 || dia2 === -3) {
            self.winner = 'P2';
			Player.list[self.p2].score += 1;
		}
        
        counter = 0
        for (var i = 0; i < 9; i++) {
			if (self.board_state[i] !== 0)
                counter += 1
		}
        if (counter === 9)
            self.winner = 'Tie'
	}

	self.reset = function() {
		self.winner = null;
		self.board_state = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	}

	Game.list[self.id] = self;
	initPack.game.push(self.getInitPack());
	return self;
}
Game.list = {};

Game.getAllInitPack = function() {
	var games = [];
	for(var i in Game.list) {
		games.push(Game.list[i].getInitPack());
	}
	return games;
}

Game.update = function() {
	var pack = [];
	// Loop through players to update
	for(var i in Game.list) {
		// update x and y
		var game = Game.list[i];
		game.update();
		// add to package
		pack.push(game.getUpdatePack());
	}
	return pack;
}


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

var DEBUG = false;

// Set up the sockets
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('createGame', function() {
		var gameId = "" + Math.floor(10000 * Math.random())
		while(doesGameExist({gameId: gameId}))
			gameId = "" + Math.floor(10000 * Math.random())
		
		addGame({gameId:gameId, name:socket.id});
		Player.onConnect(socket, {id:socket.id,chip:'x',myTurn:true,gameId:gameId});
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
			Game.list[data.gameId].p2 = socket.id;
			Player.onConnect(socket, {id:socket.id,chip:'o',myTurn:false,gameId:data.gameId});
			SOCKET_LIST[Game.list[data.gameId].p1].emit('addP2', {p2: socket.id})
			socket.emit('joinGameResponse', {success:true});
		}
	});

	socket.on('resetGame', function(data) {
		var g = Game.list[data.gameId];
		g.reset();
		socket.emit('resetGameResponse');
		
		if (Player.list[socket.id].chip === 'x') {
			SOCKET_LIST[g.p2].emit('resetGameResponse');
		}
		else {
			SOCKET_LIST[g.p1].emit('resetGameResponse');
		}

	});

	socket.on('disconnect', function() {
		Player.onDisconnect(socket);
		delete SOCKET_LIST[socket.id];
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

var initPack = {player:[], game:[]};
var removePack = {player:[], game:[]};
// Update x and y every 40 ms
setInterval(function() {
	var pack = {
		player: Player.update(),
		game: Game.update()
	}

	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('init', initPack);
		socket.emit('update', pack);
		socket.emit('remove', removePack);
	}

	initPack.player = [];
	initPack.game = [];
	removePack.player = [];
	removePack.game = [];
	
}, 40);
