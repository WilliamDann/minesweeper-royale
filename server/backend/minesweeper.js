// get random int
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Tile {
    constructor(number, color = "#fff", cleared = false, x, y) {
        this.number = number;
        this.color = color;
				this.cleared = cleared;
				this.x = x;
				this.y = y;
    }

    serialize(view) {
        return [this.number, this.cleared, this.color, this.x - view.x, this.y - view.y];
    }


} module.exports.Tile = Tile;

class Minefield {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.field = null;
    }
    // debug print
    print() {
        console.log(this.field.map(row => row.map(t => t.number).join('\t')).join('\n'))
    }
    
    // get points touching another point
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
            if ((i.x < this.width && i.x >= 0) && (i.y < this.width && i.y >= 0)) {
                fin.push(i);
            }
        }

        return fin;
    }

    // Populate the board with bombs and numbers
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
            let x = randInt(0, this.width-1);
            let y = randInt(0, this.height-1);

            this.field[y][x].number = -1;

            let around = this.getSurrounding(x, y);
            for (let j in around) {
                if (this.field[around[j].y][around[j].x].number != -1) {
                    this.field[around[j].y][around[j].x].number++;
                }
            }
        }

        return this.field;
    }

    // handle a click
    click(x, y) {
        var that = this;
        function recurse(x, y) {
            arr.push(that.field[y][x]);
            that.field[y][x].cleared = true;

            if (that.field[y][x].number == 0) {
                var points = that.getSurrounding(x, y);
                for (let point of points) {
                    if (that.field[point.y][point.x].cleared == false) {
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