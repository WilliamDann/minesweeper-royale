function randomColor() {
	let r = Math.floor(Math.random() * 255).toString(16),
		g = Math.floor(Math.random() * 255).toString(16),
		b = Math.floor(Math.random() * 255).toString(16);

	return `${r}${g}${b}`;
} module.exports.randomColor = randomColor;

// TODO needs tests
function intersectRect(r1, r2) {
	if (!r2) return true;
	return !(r2.x > r1.x + r1.w ||
		r2.x + r1.w < r1.x ||
		r2.y > r1.y + r1.h ||
		r2.y + r1.h < r1.y);
} module.exports.intersectRect = intersectRect;

// TODO needs tests
function pointInRect(point, rect) {
	if (!point || !rect) return false;
	return rect.x <= point.x && point.x < rect.x + rect.w && rect.y <= point.y && point.y < rect.y + rect.h;
} module.exports.pointInRect = pointInRect;
