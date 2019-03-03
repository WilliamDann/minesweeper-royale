// THIS IS NOT REALLY A TEST
let mine = require('./minesweeper');
let field = new mine.Minefield(20, 10);
field.populate(10);
field.print();