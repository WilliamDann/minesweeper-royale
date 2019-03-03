// THIS IS NOT REALLY A TEST
let mine = require('./minesweeper');
let field = new mine.Minefield(5, 10);
field.populate(5);
field.print();
console.log(field.click(3, 3));