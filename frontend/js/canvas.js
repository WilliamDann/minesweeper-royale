class GameCanvas {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
	}
	drawRectRaw(x, y, w, h, inset) {
		this.ctx.fillStyle = inset ? 'white' : '#7b7b7b'; // dark
		this.ctx.fillRect(x, y, w, h);

		this.ctx.fillStyle =  inset ? '#7b7b7b' : 'white'; // light
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x, y + h);
		this.ctx.lineTo(x + w, y);
		this.ctx.closePath();
		this.ctx.fill();

		this.ctx.fillStyle = 'silver'; // medium
		this.ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
	}
	draw() {
		this.drawRectRaw(0, 0, this.canvas.width, this.canvas.height, false);
		this.drawRectRaw(15, 15, this.canvas.width - 30, 72);
		this.sevenSegment('000', 32, 28);
	}
	sevenSegment(string, x, y) {
		for(let i = 0; i < string.length; i++) {
			let char = string.charAt(i);
			this.ctx.drawImage($(`time${char}`), x + i * 26, y);
		}
	}
}