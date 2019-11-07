// get random int
function randInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

// Class to store tile information 
class Tile {
	/**
	 * Class to store tile information
	 * @param {Number} number The number of bombs surrounding a tile
	 * @param {String} color The color of the tile when click
	 * @param {Boolean} cleared If the tile has been clicked
	 * @param {Number} x The x position of the tile
	 * @param {Number} y The y position of the tile
	 */
	constructor(number, color = "#fff", cleared = false, x, y) {
		this.number = number;
		this.color = color;
		this.cleared = cleared;
		this.x = x;
		this.y = y;
	}

	/**
	 * Serialize tile for sending to the server
	 * @param {Object} view Object containing view information
	 */
	serialize(view) {
		return [this.number, this.cleared, this.color, this.x - view.x, this.y - view.y];
	}
} module.exports.Tile = Tile;

/**
 * Class to store information about the minefield
 */
class Minefield {
	/**
	 * Class to store information about the minefield
	 * @param {Number} width The width of the minefield
	 * @param {Number} height The height of the minefield
	 */
	constructor(width, height) {
		this.width = width;
		this.height = height;

		this.field = null;
	}
	
	/**
	 * Print a representation of the minefield to the console for debugging
	 */
	print() {
		console.log(this.field.map(row => row.map(t => t.number).join('\t')).join('\n'))
	}

	/**
	 * Get all points surrounding a point
	 * @param {Number} x point x position
	 * @param {Number} y point y position
	 */
	getSurrounding(x, y) {
		let points = [
			{ x: x + 1, y: y },
			{ x: x - 1, y: y },
			{ x: x, y: y + 1 },
			{ x: x, y: y - 1 },
			{ x: x + 1, y: y + 1 },
			{ x: x - 1, y: y + 1 },
			{ x: x - 1, y: y - 1 },
			{ x: x + 1, y: y - 1 }
		]
		let fin = []

		for (let i of points) {
			if ((i.x < this.width && i.x >= 0) && (i.y < this.height && i.y >= 0)) {
				fin.push(i);
			}
		}

		return fin;
	}

	/**
	 * Populate the minefield with bombs
	 * @param {Number} bombs The number of bombs to place
	 */
	populate(bombs) {
		this.field = []

		for (let i = 0; i < this.height; i++) {
			let obj = []
			for (let j = 0; j < this.width; j++) {
				obj.push(new Tile(0, 'fff', false, j, i));
			}
			this.field.push(obj);
		}

		for (let i = 0; i < bombs; i++) {
			let x = randInt(0, this.width - 1);
			let y = randInt(0, this.height - 1);

			if (this.field[y][x].number == -1) continue;
			this.field[y][x].number = -1;

			let around = this.getSurrounding(x, y);
			for (let j of around) {
				if (this.field[j.y][j.x].number != -1) {
					this.field[j.y][j.x].number++;
				}
			}
		}

		return this.field;
	}

	/**
	 * Clear the area where a user clicks
	 * @param {Number} x Click x position
	 * @param {Number} y Click y position
	 * @param {String} color Clicking player's color
	 */
	click(x, y, color) {
		var that = this;

		// flood fill recursion for auto-clearing zeros
		function recurse(x, y) {
				arr.push(that.field[y][x]);
				that.field[y][x].cleared = true;
				that.field[y][x].color = color;
			if (that.field[y][x].number == 0) {
				var points = that.getSurrounding(x, y);
				for (let point of points) {
					if (!that.field[point.y][point.x].cleared) {
						recurse(point.x, point.y);
					}
				}
			}
		}
		
		var arr = []
		recurse(x, y);
		return arr;
	}
} module.exports.Minefield = Minefield;