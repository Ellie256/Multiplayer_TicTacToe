// Connect to the socket.io server
var socket = io();

/***************** Game Code ***********************/
// Set up Canvas
var ctxBoard = document.getElementById("ctx-board").getContext("2d");
var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '30px Arial';
drawBoard();

// socket.on('newPositions', function(data) {
// 	ctx.clearRect(0, 0, 500, 500);
// 	for (var i = 0; i < data.length; i++) {
// 		ctx.fillText(data[i].number, data[i].x, data[i].y);
// 	}
// });

function drawBoard() {
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
}

// Get mouse events
document.onmousedown = function(event) {
	var x = event.clientX;
	var y = event.clientY;

	if (x > 50 && x < 450 && y > 50 && y < 450) {
		// Box 1
		if (x < 175 && y < 175) {
			console.log(1)
		}
		// Box 2
		else if (x > 175 && x < 325 && y < 175) {
			console.log(2)
		}
		// Box 3
		else if (x > 325 && y < 175) {
			console.log(3)
		}
		// Box 4
		else if (x < 175 && y > 175 && y < 325) {
			console.log(4)
		}
		// Box 5
		else if (x > 175 && x < 325 && y > 175 && y < 325) {
			console.log(5)
		}
		// Box 6
		else if (x > 325 && y > 175 && y < 325) {
			console.log(6)
		}
		// Box 7
		else if (x < 175 && y > 325) {
			console.log(7)
		}
		// Box 8
		else if (x > 175 && x < 325 && y > 325) {
			console.log(8)
		}
		// Box 9
		else {
			console.log(9)
		}
	}
	
	// socket.emit('keyPress', {inputId: 'attack', state:true});
}

/**************** Sign In Code *******************/
var joinDiv = document.getElementById('joinDiv');
var joinBtn = document.getElementById('join-btn');
var createBtn = document.getElementById('create-btn');
var joinInput = document.getElementById('join-input');
var gameDiv = document.getElementById('gameDiv');

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