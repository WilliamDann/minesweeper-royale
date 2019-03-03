class GameCanvas {
	constructor(canvas, sock, w, h) {
		this.tiles = [];
		this.sock = sock;
		this.numXTiles = w;
		this.numYTiles = h;
		this.clickingTile = null;
		this.lastClickingTile = null;

		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.ctx.imageSmoothingEnabled = false;
		this.ctx.mozImageSmoothingEnabled = false;
		this.ctx.webkitImageSmoothingEnabled = false;
		this._initMouse();

		let self = this;
		window.addEventListener('resize', () => this.resize(self));
		this.resize(self);
		this.init();
	}

	_initMouse() {
		this.mouseDown = false;
		this.canvas.onmousedown = (ev) => {
			this.mouseDown = true;
			this.canvas.onmousemove(ev);
			return false;
		};
		this.canvas.onmousemove = (ev) => {
			if (this.mouseDown && ev.which != 3) {
				let { x, y } = this.screenToTileCoords(ev.clientX, ev.clientY);

				if (x >= 0 && y >= 0 && x < this.numXTiles && y < this.numYTiles && !this.getTile(x, y)) {
					if (this.clickingTile)
						this.lastClickingTile = this.getTile(this.clickingTile.x, this.clickingTile.y);
					this.clickingTile = { x: x, y: y, type: 0 };
					this.render();

				}
			}

			return false;
		};
		this.canvas.onmouseup = ev => {
			this.mouseDown = false;
			// If right mouse button
			if (ev.which == 3) {
				let { x, y } = this.screenToTileCoords(ev.clientX, ev.clientY);

				if (x >= 0 && y >= 0 && x < this.numXTiles && y < this.numYTiles) {
					let tile = this.getTile(x, y);
					
					if (!tile) {
						tile = {type: 'U', x:x, y:y}
						game.canvas.tiles.push(tile);
					}

					console.log(tile.type)
					if (tile.type == "F") {
						this.drawTile({type: 'U', x: x, y: y});
						tile.type = "U";
					} else if (tile.type == "U") {
						this.drawTile({type: 'F', x: x, y: y});
						tile.type = "F";
					}

					return false;
				}
			}

			this.mouseDown = false;
			let coords = this.screenToTileCoords(ev.clientX, ev.clientY);
			this.sock.send('click', coords);
			this.render();
		};
		this.canvas.onmouseout = () => this.mouseDown = false;
	}

	screenToTileCoords(x, y) {
		return {
			x: Math.floor((x - this.gamePanelLeft) / this.tileSize),
			y: Math.floor((y - this.gamePanelTop) / this.tileSize)
		};
	}

	drawRect(x, y, w, h, inset) {
		this.ctx.fillStyle = inset ? 'white' : '#7b7b7b'; // dark
		this.ctx.fillRect(x, y, w, h);

		this.ctx.fillStyle = inset ? '#7b7b7b' : 'white'; // light
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x, y + h);
		if (w !== h) {
			this.ctx.lineTo(x + 4, y + h - 4);
			this.ctx.lineTo(x + w - 4, y + 4);
		}
		this.ctx.lineTo(x + w, y);
		this.ctx.closePath();
		this.ctx.fill();

		this.ctx.fillStyle = 'silver'; // medium
		this.ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
	}
	drawSevenSegment(num, x, y) {
		let string = num.toString();
		while (string.length < 3) string = '0' + string;
		for (let i = 0; i < string.length; i++) {
			let char = string.charAt(i);
			this.ctx.drawImage($(`time${char}`), x + i * 26, y, 26, 46);
		}
	}

	// initilize the canvas with a blank board
	init() {

		// Field
		let singleTileWidth = (this.canvas.width - 40) / this.numXTiles;
		let singleTileHeight = (this.canvas.height - 124) / this.numYTiles;

		if (singleTileWidth < singleTileHeight) this.tileSize = singleTileWidth;
		else this.tileSize = singleTileHeight;

		let gamePanelWidth = this.tileSize * this.numXTiles;
		let gamePanelHeight = this.tileSize * this.numYTiles;

		this.gamePanelLeft = (this.canvas.width - gamePanelWidth) / 2;
		this.gamePanelTop = 104;

		this.drawRect(this.gamePanelLeft - 4, this.gamePanelTop - 4, gamePanelWidth + 8, gamePanelHeight + 8, true, true); // draw panel


		// Background
		this.drawRect(0, 0, this.canvas.width, this.canvas.height, false);
		for (let y = 0; y < this.numYTiles; y++) {
			for (let x = 0; x < this.numXTiles; x++) {
				this.drawTile({ type: 'U', x: x, y: y });
			}
		}

		// Header
		this.drawRect(16, 16, this.canvas.width - 32, 72, true);
		this.drawSevenSegment(0, 32, 28);
	}

	render() {
		if (this.clickingTile && this.mouseDown) {
			this.drawTile(this.clickingTile);
		}
		if (this.lastClickingTile) {
			this.drawTile(this.lastClickingTile);
		}
	}
	getTile(x, y) {
		return this.tiles.find(t => t.x === x && t.y === y);
	}
	drawTile(tile) {
		this.ctx.drawImage($('tile' + tile.type),
			this.gamePanelLeft + tile.x * this.tileSize,
			this.gamePanelTop + tile.y * this.tileSize,
			this.tileSize, this.tileSize);

		if (tile.color) {
			console.log(tile.color);
			this.ctx.globalAlpha = 0.5;
			this.ctx.fillStyle = '#' + tile.color;
			this.ctx.fillRect(
				this.gamePanelLeft + tile.x * this.tileSize,
				this.gamePanelTop + tile.y * this.tileSize,
				this.tileSize, this.tileSize);
			this.ctx.globalAlpha = 1;
		}
	}

	resize(self) {
		self.canvas.width = window.innerWidth;
		self.canvas.height = window.innerHeight;
		self.render();
	}
}

class Tile {
	constructor(arr) {
		this.type = arr[0];
		this.color = arr[2];
		this.x = arr[3];
		this.y = arr[4];
	}
}