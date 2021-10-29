var assert = require('assert');
var mine = require('../backend/minesweeper');

describe('Tile', () => {
    it('should create a new Tile object', (done) => {
        let tile = new mine.Tile(0, "000", true, 2, 3);

        assert.deepEqual(
            [tile.number, tile.color, tile.cleared, tile.x, tile.y],
            [0, "000", true, 2, 3]
        );
        done();
    });

    describe('serialize', () => {
        it('should return a properly serialized array', (done) => {
            let tile = new mine.Tile(0, "000", true, 2, 3);

            assert.deepEqual(
                tile.serialize({ x: 0, y: 0 }),
                [0, true, "000", 2, 3]
            );
            done();
        });
    });
});

describe('Minefield', () => {
    it('should create a new Minefield object', (done) => {
        let minefield = new mine.Minefield(30, 50);

        assert.deepEqual(
            [minefield.width, minefield.height],
            [30, 50]
        );
        done();
    });

    describe('populate', () => {
        it('should create a 2D array of correct width and height', (done) => {
            let field = new mine.Minefield(10, 5);
            field.populate(0);

            assert.equal(field.field.length, 5);
            for (let row of field.field) {
                assert.equal(row.length, 10);
            }

            done();
        });

        it('should place bombs into the board', (done) => {
            let field = new mine.Minefield(10, 5);
            field.populate(10);

            let bomb = false;
            for (let row of field.field) {
                for (let tile of row) {
                    if (tile.number == -1) bomb = true;
                }
            }
            assert.equal(bomb, true);

            done();
        });
    });

    describe('getSurrounding', () => {
        it('should get all surrounding points', (done) => {
            let field = new mine.Minefield(10, 10);
            field.populate(0);

            assert.deepEqual(
                field.getSurrounding(5, 5),
                [
                    { x: 6, y: 5 },
                    { x: 4, y: 5 },
                    { x: 5, y: 6 },
                    { x: 5, y: 4 },
                    { x: 6, y: 6 },
                    { x: 4, y: 6 },
                    { x: 4, y: 4 },
                    { x: 6, y: 4 }
                ]
            );

            done();
        });

        it('should only return points within the bounds of the field', (done) => {
            let field = new mine.Minefield(6, 6);
            field.populate(0);

            assert.deepEqual(
                field.getSurrounding(5, 5),
                [
                    { x: 4, y: 5 },
                    { x: 5, y: 4 },
                    { x: 4, y: 4 },
                ]
            );

            done();            
        });
    });

    describe('click', () => {
        it('should set the clicked tile to cleared', (done) => {
            let field = new mine.Minefield(20, 20);
            field.populate(0);

            field.click(0, 0);
            assert.equal(field.field[0][0].cleared, true);

            done();
        });

        it('should flood fill clicks to other adjacent zeros', (done) => {
            let field = new mine.Minefield(20, 20);
            field.populate(0);

            field.click(19, 19);
            assert.equal(field.field[0][0].cleared, true);

            done();
        });
    });
});