
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
	return rect.x <= point.x && point.x < rect.x + rect.w && rect.y <= point.y && point.y < rect.y + rect.h;
}
function randomHue() {
	h = Math.random();
	s = 0.8;
	l = 0.8;
	let r, g, b;
	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	const toHex = x => {
		const hex = Math.round(x * 255).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	};
	return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}
var field;
router.ws('/', function (ws, req) {
	let send = (action, data) => {
		data.action = action;
		ws.send(JSON.stringify(data));
	}
	ws.user = { name: '', ready: false, firstClick: true, alive: true };
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
				ws.user.color = randomHue();
				let us = getUsers();
				let r = us.filter(u => u.ready).length;
				let c = us.length;
				broadcast(null, 'lobby', { count: c, ready: r });
				if (r == c && c > 1) {
					field = new minesweeper.Minefield(40 * c, 20 * c);
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
					field.populate(500);
					field.print();
					getSockets().forEach(ws2 => ws2.send(JSON.stringify({ action: 'start', width: 20, height: 10, color: ws2.user.color })));
				}
				break;
			case "click":
				if (msg.x == undefined || msg.y == undefined) return console.error("invalid", data);
				let x = msg.x + ws.user.view.x,
					y = msg.y + ws.user.view.y;
				if (!ws.user.alive) {
					return;
				}

				if (ws.user.firstClick && field.field[y][x].number === -1) {
					field.field[y][x].number = 0;
					console.log(x, y);
					let surr = field.getSurrounding(x, y);
					console.log(field.getSurrounding(x, y));
					for (let i = 0; i < surr.length; i++) {
						let tile = field.field[surr[i].y][surr[i].x];
						console.log(' ', tile.x, tile.y, tile.number);
						if (tile.number === -1) field.field[y][x].number++;
						else if (tile.number > 0) tile.number--;
						console.log(' ', tile.x, tile.y, tile.number);
					}
					field.field[y][x].number = 0
				} else if (field.field[y][x].number === -1) {
					// Die
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
				}
				ws.user.firstClick = false;
				if (field.field[y][x].selected || !pointInRect({ x: x, y: y }, ws.user.view)) return;
				let updates = field.click(msg.x + ws.user.view.x, msg.y + ws.user.view.y, ws.user.color);
				for (let sock of getSockets()) {
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
