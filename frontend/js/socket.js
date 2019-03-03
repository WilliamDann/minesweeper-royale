class GameSocket extends EventEmitter {
	constructor(url) {
		super();
		this.ws = new WebSocket(url);
		this.ws.addEventListener('open', e => this.emit('open', e));
		this.ws.addEventListener('close', e => this.emit('close', e));
		this.ws.addEventListener('error', e => this.emit('error', e));
		this.ws.addEventListener('message', e => this.doMessage(e));
	}
	doMessage(ev) {
		let msg;
		try {
			msg = JSON.parse(ev.data);
		} catch (e) {
			return console.error(e);
		}
		if (!msg.action) return console.error('No action: ', ev.data);
		this.emit(msg.action, msg);
	}

	send(action, data) {
		data.action = action;
		this.ws.send(JSON.stringify(data));
	}
}