// Set up Canvas
var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '30px Arial';

// Connect to the socket.io server
var socket = io();

socket.on('newPositions', function(data) {
	ctx.clearRect(0, 0, 500, 500);
	for (var i = 0; i < data.length; i++) {
		ctx.fillText(data[i].number, data[i].x, data[i].y);
	}
	drawBoard();
});

function drawBoard() {
	// Line 1
	ctx.moveTo(175, 50);
	ctx.lineTo(175, 450);
	ctx.stroke();

	// Line 2
	ctx.moveTo(325, 50);
	ctx.lineTo(325, 450);
	ctx.stroke();

	// Line 3
	ctx.moveTo(50, 175);
	ctx.lineTo(450, 175);
	ctx.stroke();

	// Line 4
	ctx.moveTo(50, 325);
	ctx.lineTo(450, 325);
	ctx.stroke();
}