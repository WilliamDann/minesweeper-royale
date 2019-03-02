const $ = (id) => document.getElementById(id);

const lobby = $('lobby');
lobby.count = $('count');
lobby.ready = $('ready');
lobby.username = $('username');
lobby.error = $('lerror');

const game = $('game');
game.canvas = $('canvas');
game.canvas

const sock = new GameSocket('ws://demos.kaazing.com/echo');

lobby.ready.addEventListener('click', () => {
	sock.send('ready', { name: lobby.username.value });
	lobby.username.disabled = true;
});

sock.on('nametaken', msg => {
	lobby.username.disabled = false;
	lobby.error.innerText = msg.message;
});
sock.on('lobby', msg => {
	lobby.count.innerText = `${msg.ready}/${msg.count} players ready`;
});
sock.on('start', msg => {
	lobby.style.display = 'none';
	game.style.display = 'block';
})