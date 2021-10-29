function randomColor() {
	let r = Math.floor(Math.random() * 255).toString(16),
		g = Math.floor(Math.random() * 255).toString(16),
		b = Math.floor(Math.random() * 255).toString(16);

	return `${r}${g}${b}`;
} module.exports.randomColor = randomColor;