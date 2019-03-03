var express = require('express');
var router = express.Router();
var minesweeper = require('../backend/minesweeper');

function getUsers() {
	return [...expressWs.getWss().clients].map(ws => ws.user);
}
function getSockets() {
	return [...expressWs.getWss().clients];
}
function broadcast(sender, action, data) {
	data.action = action;
	[...expressWs.getWss().clients].forEach(ws => ws.send(JSON.stringify(data)));
}
function intersectRect(r1, r2) {
	if (!r2) return true;
	return !(r2.x > r1.x + r1.w ||
		r2.x + r1.w < r1.x ||
		r2.y > r1.y + r1.h ||
		r2.y + r1.h < r1.y);
}
function pointInRect(point, rect) {
	return (rect.x <= point.x <= rect.x + rect.w) && (rect.y <= point.y <= rect.y + rect.h);
}
var field;
router.ws('/', function (ws, req) {
	let send = (action, data) => {
		data.action = action;
		ws.send(JSON.stringify(data));
	}
	ws.user = { name: '', ready: false };
	broadcast(ws, 'lobby', { count: getUsers().length, ready: getUsers().filter(u => u.ready).length });
	ws.on('message', function (data) {
		console.log(getUsers());
		let msg;
		try {
			msg = JSON.parse(data);
		} catch (e) {
			return console.error(data);
		}
		if (!msg.action) return console.error('No action: ', data);

		switch (msg.action) {
			case "ready":
				if (!msg.name) return send('nametaken', { message: 'Invalid Username' });
				if (getUsers().find(user => user.name === msg.name)) return send('nametaken', { message: 'Username Taken' });
				ws.user.name = msg.name;
				ws.user.ready = true;
				let us = getUsers();
				let r = us.filter(u => u.ready).length;
				let c = us.length;
				broadcast(null, 'lobby', { count: c, ready: r });
				if (r == c && c > 1) {
					field = new minesweeper.Minefield(40 * c, 40 * c);
					let rects = [];
					for (let i = 0; i < c; i++) {
						let newR;
						while (newR == undefined || rects.some(r2 => intersectRect(r2, newR))) {
							newR = { x: Math.floor(Math.random() * (40 * c - 20)), y: Math.floor(Math.random() * (20 * c - 10)), w: 20, h: 10 };
						}
						console.log(newR);
						rects.push(newR);
						us[i].view = newR;
					}
					field.populate(1000);
					field.print();
					broadcast(null, 'start', { width: 20, height: 10 });
				}
				break;
			case "click":
				if (msg.x == undefined || msg.y == undefined) return console.error("invalid", data);
				console.log(msg.x + ws.user.view.x, msg.y + ws.user.view.y);
				let updates = field.click(msg.x + ws.user.view.x, msg.y + ws.user.view.y); //TODO check if click in bounds
				console.log(updates);
				for (let sock of getSockets()) {
					let theseUpdates = []
					for (let tile of updates) { // TODO fix
						if (pointInRect(tile, sock.user.view)) {
							theseUpdates.push(tile);
						}
					}
					console.log(theseUpdates);
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
