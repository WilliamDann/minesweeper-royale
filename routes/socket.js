var express = require('express');
var router = express.Router();
var minesweeper = require('../backend/minesweeper');

const util = require('../src/util');

function getConnectedClients() {
	return [...expressWs.getWss().clients].map(ws => ws.user);
}

function getActiveSockets() {
	return [...expressWs.getWss().clients].filter(ws => ws.readyState == ws.OPEN);
}

function broadcast(sender, action, data) {
	data.action = action;
	getActiveSockets().forEach(ws => ws.send(JSON.stringify(data)));
}

/**
 * Determine if two rectangles intersect
 * @param {Object} r1 Object containing an x, y, w, and h for rectangle one
 * @param {Object} r2 Object containing an x, y, w, and h for rectangle two
 */
function intersectRect(r1, r2) {
	if (!r2) return true;
	return !(r2.x > r1.x + r1.w ||
		r2.x + r1.w < r1.x ||
		r2.y > r1.y + r1.h ||
		r2.y + r1.h < r1.y);
}

function pointInRect(point, rect) {
	if (!point || !rect) return false;
	return rect.x <= point.x && point.x < rect.x + rect.w && rect.y <= point.y && point.y < rect.y + rect.h;
}


// determine game parameters
var bombs = 0;
var minPlayers = 2;
process.argv.forEach(function (val, index, array) {
	switch (val) {
		case "--bombs":
			var data = process.argv[index+1];
			if (data) bombs = parseInt(data);
		break;

		case "--minPlayers":
			var data = process.argv[index+1];
			if (data) minPlayers = parseInt(data);
		break;	}
});



var field;
router.ws('/', function (ws, req) {
	let send = (action, data) => {
		data.action = action;
		ws.send(JSON.stringify(data));
	}

	ws.user = { name: '', ready: false, firstClick: true, alive: true };
	broadcast(ws, 'lobby', { count: getConnectedClients().length, ready: getConnectedClients().filter(u => u.ready).length });
	ws.on('close', () => {
		ws.user.alive = false;
		let alive = getConnectedClients().filter(u => u.alive).length;
		broadcast(null, 'leaderboard', { count: alive });
	});

	ws.on('message', function (data) {
		let msg;
		try {
			msg = JSON.parse(data);
		} catch (e) {
			return console.error(data);
		}
		if (!msg.action) return console.error('No action: ', data);

		switch (msg.action) {
			case "ready":
				if (field) return send('nametaken', { message: 'Game In Progress' });
				if (!msg.name) return send('nametaken', { message: 'Invalid Username' });
				if (getConnectedClients().find(user => user.name === msg.name)) return send('nametaken', { message: 'Username Taken' });

				ws.user.name = msg.name;
				ws.user.ready = true;
				ws.user.color = util.randomColor();

				let us = getConnectedClients();
				let r = us.filter(u => u.ready).length;
				let c = us.length;

				broadcast(null, 'lobby', { count: c, ready: r });

				// If all users are ready, start the game
				if (r == c && c >= minPlayers) {
					field = new minesweeper.Minefield(40 * c, 40 * c);
					let rects = [];
					for (let i = 0; i < c; i++) {
						let newR;
						while (newR == undefined || rects.some(r2 => intersectRect(r2, newR))) {
							newR = { x: Math.floor(Math.random() * (40 * c - 20)), y: Math.floor(Math.random() * (40 * c - 10)), w: 20, h: 10 };
						}
						rects.push(newR);
						us[i].view = newR;
					}
					field.populate(bombs * c);
					getActiveSockets().forEach(ws2 => ws2.send(JSON.stringify({ action: 'start', width: 20, height: 10, color: ws2.user.color, count: c })));
				}
				break;
			case "click":
				if (msg.x == undefined || msg.y == undefined) return console.error("invalid", data);
				let x = msg.x + ws.user.view.x,
					y = msg.y + ws.user.view.y;
				if (!ws.user.alive || msg.x < 0 || msg.y < 0 || msg.x > ws.user.view.w || msg.y > ws.user.view.h || field.field[y][x].selected) {
					return;
				}

				// Ensure that the first tile clicked is not a bomb
				if (ws.user.firstClick && field.field[y][x].number === -1) {
					field.field[y][x].number = 0;
					let surr = field.getSurrounding(x, y);

					// TODO, let tile of surr sould be simpler
					for (let i = 0; i < surr.length; i++) {
						let tile = field.field[surr[i].y][surr[i].x];
						
						if (tile.number === -1) field.field[y][x].number++;
						else if (tile.number > 0) tile.number--;
					}
				} else if (field.field[y][x].number === -1) {
					// Die if a bomb is clicked
					ws.user.alive = false;
					let theseUpdates = [];
					for (let y = ws.user.view.y; y < ws.user.view.y + ws.user.view.h; y++) {
						for (let x = ws.user.view.x; x < ws.user.view.x + ws.user.view.w; x++) {
							if (field.field[y][x].number === -1) {
								theseUpdates.push(field.field[y][x]);
							}
						}
					}
					ws.send(JSON.stringify({ action: 'die', tiles: theseUpdates.map(t => t.serialize(ws.user.view)) }));
					let alive = getConnectedClients().filter(u => u.alive).length;
					broadcast(null, 'leaderboard', { count: alive });
					if (alive === 0) {
						broadcast(null, 'gameover', {
							leaderboard: getConnectedClients().map(user => {
								return { name: user.name, color: user.color, score: [].concat.apply([], field.field).filter(t => t.color === user.color).length };
							}).sort((a, b) => a - b)
						});
						field = null;
						getActiveSockets().forEach(s => s.close());
					}
					return;
				}

				// handle a click on a valid tile
				ws.user.firstClick = false;
				let updates = field.click(msg.x + ws.user.view.x, msg.y + ws.user.view.y, ws.user.color);
				let old = JSON.parse(JSON.stringify(ws.user.view));
				let x2 = ws.user.view.x + ws.user.view.w;
				let y2 = ws.user.view.y + ws.user.view.h;
				for (let tile of updates) {
					ws.user.view.x = Math.max(Math.min(ws.user.view.x, tile.x - 3), 0);
					ws.user.view.y = Math.max(Math.min(ws.user.view.y, tile.y - 3), 0);
					x2 = Math.min(Math.max(x2, tile.x + 3), field.width - 1);
					y2 = Math.min(Math.max(y2, tile.y + 3), field.height - 1);
				}
				ws.user.view.w = x2 - ws.user.view.x;
				ws.user.view.h = y2 - ws.user.view.y;
				if (ws.user.view.x != old.x || ws.user.view.y != old.y || ws.user.view.w != old.w || ws.user.view.h != old.h) {
					send('resize', { x: ws.user.view.x - old.x, y: ws.user.view.y - old.y, w: ws.user.view.w, h: ws.user.view.h });
					send('reveal', { tiles: [].concat.apply([], field.field).filter(t => t.cleared && pointInRect(t, ws.user.view)).map(t => t.serialize(ws.user.view)) });
				}
				for (let sock of getActiveSockets()) {
					let theseUpdates = [];
					for (let tile of updates) {
						if (pointInRect(tile, sock.user.view)) {
							theseUpdates.push(tile);
						}
					}
					if (theseUpdates.length) {
						sock.send(JSON.stringify({ action: 'reveal', tiles: theseUpdates.map(t => t.serialize(sock.user.view)) }));
					}
				}
				break;
			default:
				console.error("Invliad acionfcx", data);
		}
	});
});

module.exports = router;
