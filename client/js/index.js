// Get elements
var joinDiv = document.getElementById('joinDiv');
var joinBtn = document.getElementById('join-btn');
var createBtn = document.getElementById('create-btn');
var joinInput = document.getElementById('join-input');
var joinForm = document.getElementById('join-form');
var gameDiv = document.getElementById('gameDiv');
var gameIdP = document.getElementById('gameId-p');
var turnP = document.getElementById('turn-p');
var playerP = document.getElementById('player-p');
var opponentP = document.getElementById('opponent-p');
var resetBtn = document.getElementById('reset-btn');


// Connect to the socket.io server
var socket = io();

/***************** Game Code ***********************/
// Set up Canvas
var ctxBoard = document.getElementById("ctx-board").getContext("2d");
var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '40px Arial';
drawBoard();

// INIT
var Player = function(initPack) {
	var self = {};
	self.id = initPack.id;
	self.chip = initPack.chip;
	self.gameId = initPack.gameId;
	self.myTurn = initPack.myTurn;
	self.score = initPack.score;

	self.draw = function() {}

	Player.list[self.id] = self;
	return self;
}
Player.list = {};

var Game = function(initPack) {
	var self = {};
	self.id = initPack.id;
	self.p1 = initPack.p1;
	self.p2 = initPack.p2;
	self.winner = initPack.winner;
	self.board_state = initPack.board_state;

	self.draw = function() {}

	self.reset = function() {
		self.winner = null;
		self.board_state = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	}

	Game.list[self.id] = self;
	return self;
}
Game.list = {};

var selfId = null;
var gameId = null;
socket.on('init', function(data) {
	for(var i = 0; i < data.player.length; i++) {
		new Player(data.player[i]);
	}
	for(var i = 0; i < data.game.length; i++) {
		new Game(data.game[i])
	}
	if(data.selfId) {
		selfId = data.selfId;
		gameId = Player.list[selfId].gameId;
		gameIdP.innerHTML = "Game ID: " + gameId;
	}
});

// UPDATE
socket.on('update', function(data) {
	for(var i = 0; i < data.player.length; i++) {
		var pack = data.player[i];
		var p = Player.list[pack.id];
		if(p) {
			if(pack.myTurn !== undefined)
				p.myTurn = pack.myTurn;
			if(pack.score !== undefined)
				p.score = pack.score;
		}
	}
	for(var i = 0; i < data.game.length; i++) {
		var pack = data.game[i];
		var g = Game.list[pack.id];
		if(g) {
			if(pack.winner !== undefined)
				g.winner = pack.winner;
			if(pack.board_state !== undefined)
				g.board_state = pack.board_state;
		}
	}

	if (gameId !== null) {
		if (Game.list[gameId].winner === null)
			turnP.innerHTML = Player.list[selfId].myTurn ? "Your Turn" : "Opponent's Turn";
		else {
			var win = Game.list[gameId].winner;
			var chip = Player.list[selfId].chip;
			if (win === 'Tie')
				turnP.innerHTML = "It's a Tie!";
			else if ((win === 'P1' && chip === 'x') || (win === 'P2' && chip === 'o'))
				turnP.innerHTML = "You win!";
			else
				turnP.innerHTML = "You lose!";
		}

		if (Game.list[gameId].p2 !== null) {
			playerP.innerHTML = "Your wins: " + Player.list[selfId].score;
			if (Player.list[selfId].chip === 'x') 
				opponentP.innerHTML = "Opponent wins: " + Player.list[Game.list[gameId].p2].score;
			else
				opponentP.innerHTML = "Opponent wins: " + Player.list[Game.list[gameId].p1].score;
		}
	}
	
});

// REMOVE
socket.on('remove', function(data) {
	for(var i = 0; i < data.player.length; i++) {
		if(data.player[i] === selfId) {
			joinDiv.style.display = 'inline-block';
			gameDiv.style.display = 'none';
			joinInput.value = '';
			selfId = null;
			gameId = null;
			ctx.clearRect(0, 0, 500, 500);
		}
		delete Player.list[data.player[i]];
	}
	for(var i = 0; i < data.game.length; i++) {
		delete Game.list[data.game[i]];
	}
});

// Add player 2
socket.on('addP2', function(data) {
	Game.list[gameId].p2 = data.p2;
});

// Reset the game
resetBtn.onclick = function() {
	socket.emit('resetGame', {gameId: gameId});
}
socket.on('resetGameResponse', function() {
	Game.list[gameId].reset();
});

function drawBoard() {
	ctxBoard.fillStyle = 'black';
	// Line 1
	ctxBoard.moveTo(175, 50);
	ctxBoard.lineTo(175, 450);
	ctxBoard.stroke();

	// Line 2
	ctxBoard.moveTo(325, 50);
	ctxBoard.lineTo(325, 450);
	ctxBoard.stroke();

	// Line 3
	ctxBoard.moveTo(50, 175);
	ctxBoard.lineTo(450, 175);
	ctxBoard.stroke();

	// Line 4
	ctxBoard.moveTo(50, 325);
	ctxBoard.lineTo(450, 325);
	ctxBoard.stroke();

	// 50 - 175 - 325 - 450
	// 0 1 2
	// 3 4 5
	// 6 7 8
}
var row1 = 125;
var row2 = 265;
var row3 = 405;
var col1 = 90;
var col2 = 235;
var col3 = 385;
var chipPlacements = {
	0: {x: col1, y: row1},
	1: {x: col2, y: row1},
	2: {x: col3, y: row1},
	3: {x: col1, y: row2},
	4: {x: col2, y: row2},
	5: {x: col3, y: row2},
	6: {x: col1, y: row3},
	7: {x: col2, y: row3},
	8: {x: col3, y: row3}
};
// Draw the board
setInterval(function() {
	if(!selfId)
		return;
	ctx.clearRect(0, 0, 500, 500);
	for(var i = 0; i < 9; i++) {
		if(Game.list[gameId].board_state[i] === 1) {
			ctx.fillStyle = 'red';
			ctx.fillText("X", chipPlacements[i].x, chipPlacements[i].y);
		}
		else if(Game.list[gameId].board_state[i] === -1) {
			ctx.fillStyle = 'blue';
			ctx.fillText("O", chipPlacements[i].x, chipPlacements[i].y);
		}
	}
}, 40);

// Get mouse events
document.onmousedown = function(event) {
	if (!selfId)
		return;
	var x = event.clientX;
	var y = event.clientY;

	if (x > 50 && x < 450 && y > 50 && y < 450) {
		// Box 1
		if (x < 175 && y < 175) {
			socket.emit('keyPress', {state:0});
		}
		// Box 2
		else if (x > 175 && x < 325 && y < 175) {
			socket.emit('keyPress', {state:1});
		}
		// Box 3
		else if (x > 325 && y < 175) {
			socket.emit('keyPress', {state:2});
		}
		// Box 4
		else if (x < 175 && y > 175 && y < 325) {
			socket.emit('keyPress', {state:3});
		}
		// Box 5
		else if (x > 175 && x < 325 && y > 175 && y < 325) {
			socket.emit('keyPress', {state:4});
		}
		// Box 6
		else if (x > 325 && y > 175 && y < 325) {
			socket.emit('keyPress', {state:5});
		}
		// Box 7
		else if (x < 175 && y > 325) {
			socket.emit('keyPress', {state:6});
		}
		// Box 8
		else if (x > 175 && x < 325 && y > 325) {
			socket.emit('keyPress', {state:7});
		}
		// Box 9
		else {
			socket.emit('keyPress', {state:8});
		}
	}
}

/**************** Sign In Code *******************/
// Join Game
joinBtn.onclick = function() {
	socket.emit('joinGame', {gameId: joinInput.value});
}
socket.on('joinGameResponse', function(data) {
	if(data.success) {
		joinDiv.style.display = 'none';
		gameDiv.style.display = 'inline-block';
	}
	else {
		if (data.msg)
			alert(data.msg);
		else
			alert("Join Game Unsuccessful");
	}
});
joinForm.onsubmit = function(e) {
	// Must call prevent default to prevent a page refresh
	e.preventDefault();
	socket.emit('joinGame', {gameId: joinInput.value});
}

// Create Game
createBtn.onclick = function() {
	socket.emit('createGame');
}
socket.on('createGameResponse', function(data) {
	if(data.success) {
		joinDiv.style.display = 'none';
		gameDiv.style.display = 'inline-block';
	}
	else {
		alert("Create Game Unsuccessful");
	}
});

/***************** Chat Box *******************/
// Get Chat box
var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-in');
var chatForm = document.getElementById('chat-form');

// Add chat text
socket.on('addToChat', function(data) {
	chatText.innerHTML += '<div>' + data + '</div>';
});

// Add get debug answer
socket.on('evalAnswer', function(data) {
	console.log(data);
});

chatForm.onsubmit = function(e) {
	// Must call prevent default to prevent a page refresh
	e.preventDefault();

	if(chatInput.value[0] === '/')
		socket.emit('evalServer', chatInput.value.slice(1))
	else
		socket.emit('sendMsgToServer', chatInput.value);
	chatInput.value = '';
}