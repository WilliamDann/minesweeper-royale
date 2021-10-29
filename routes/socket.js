const express     = require('express');
const router      = express.Router();
const minesweeper = require('../src/minesweeper');

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

// determine game parameters
// TODO needs to be moved
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


function addConnection(connection) {
	connection.user = {
		name: '',
		ready: false,
		firstClick: true,
		alive: true
	};
	
	broadcastReadyPlayers(connection);	
}

function removeConnection(connection)
{
	connection.user.alive = false;

	broadcast(
		null,
		'leaderboard',
		{ count: getConnectedClients().filter(x => x.alive).length }
	);
}

function parseData(data)
{
	try 
	{
		return JSON.parse(data)
	} catch (e)
	{
		return undefined;
	}
}

function createUser(connection, name, ready, color)
{
	connection.user.name  = name;
	connection.user.ready = ready;
	connection.user.color = color;
}

function broadcastReadyPlayers(broadcaster=null)
{
	const all = getConnectedClients();

	broadcast(broadcaster, 'lobby', { count: all.length, ready: all.filter(x => x.ready).length });
}

function playerMinReached()
{
	return getConnectedClients().length >= minPlayers;
}

function allPlayersReady()
{
	const clients = getConnectedClients();
	return clients.length == clients.filter(x => x.ready).length;
}

let field;
router.ws('/', function (ws, req) {
	const send = (action, data) => {
		data.action = action;
		ws.send(JSON.stringify(data));
	}

	addConnection(ws);

	ws.on('close', () => removeConnection(ws))

	ws.on('message', data => {
		const msg = parseData(data);

		if (!msg || !msg.action) 
			return console.error('No action: ', data); // todo send error code rather than print error

		switch (msg.action) {
			case "ready":
				if (field)     return send('nametaken', { message: 'Game In Progress' }); // TODO nametaken should be renamed to name_error
				if (!msg.name) return send('nametaken', { message: 'Invalid Username' });

				if (getConnectedClients().find(user => user.name === msg.name))
					return send('nametaken', { message: 'Username Taken' });

					createUser(ws, msg.name, true, util.randomColor());
					broadcastReadyPlayers();
					
				if (playerMinReached() && allPlayersReady()) {
					const connectedClients = getConnectedClients();
					const c                = connectedClients.length;

					// todo make function
					field = new minesweeper.Minefield(40 * c, 40 * c);
					let rects = [];
					for (let i = 0; i < c; i++) {
						let newR;
						while (newR == undefined || rects.some(r2 => util.intersectRect(r2, newR))) {
							newR = { x: Math.floor(Math.random() * (40 * c - 20)), y: Math.floor(Math.random() * (40 * c - 10)), w: 20, h: 10 };
						}
						rects.push(newR);
						connectedClients[i].view = newR;
					}
					//

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
					send('reveal', { tiles: [].concat.apply([], field.field).filter(t => t.cleared && util.pointInRect(t, ws.user.view)).map(t => t.serialize(ws.user.view)) });
				}
				for (let sock of getActiveSockets()) {
					let theseUpdates = [];
					for (let tile of updates) {
						if (util.pointInRect(tile, sock.user.view)) {
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
