var express = require('express');
var router = express.Router();

function getUsers() {
	return [...expressWs.getWss().clients].map(ws => ws.user);
}
function broadcast(sender, action, data) {
	data.action = action;
	[...expressWs.getWss().clients].forEach(ws => ws.send(JSON.stringify(data)));
}

router.ws('/', function (ws, req) {
	let send = (action, data) => {
		data.action = action;
		ws.send(JSON.stringify(data));
	}
	ws.user = {name: '', ready: false};
	broadcast(ws, 'lobby', {count: getUsers().length, ready: getUsers().filter(u => u.ready).length});
	ws.on('message', function (data) {
		console.log(getUsers());
		let msg;
		try {
			msg = JSON.parse(data);
		} catch (e) {
			return console.error(data);
		}
		if (!msg.action) return console.error('No action: ', data);
		
		switch(msg.action) {
			case "ready":
				if (!msg.name) return send('nametaken', {message:'Invalid Username'})
				if (getUsers().find(user => user.name === msg.name)) return send('nametaken', {message:'Username Taken'});
				ws.user.name = msg.name;
				ws.user.ready = true;
				let r = getUsers().filter(u => u.ready).length;
				let c = getUsers().length;
				broadcast(null, 'lobby', {count: c, ready: r});
				if (r == c && c > 1) {
					broadcast(null, 'start', )
				}
		}
	});
});

module.exports = router;