
function sqrt(x) {
	return Math.sqrt(x);
}
function abs(x) {
	return Math.abs(x);
}
function max(x, y) {
	return Math.max(x, y);
}
function min(x, y) {
	return Math.min(x, y);
}

function toDegrees(angle) {
	return angle * (180 / Math.PI);
}
function toRadians(angle) {
	return angle * (Math.PI / 180);
}
	
function sin(x) {
	return Math.sin(toRadians(x));
}
function cos(x) {
	return Math.cos(toRadians(x));
}
function tan(x) {
	return Math.tan(toRadians(x));
}
function asin(x) {
	return toDegrees(Math.asin(x));
}
function acos(x) {
	return toDegrees(Math.acos(x));
}
function atan(x) {
	return toDegrees(Math.atan(x));
}
function atan2(y, x) {
	let angle = toDegrees(Math.atan2(y, x));
	angle = (angle < -90) ? angle + 360 : angle;
	return angle;
}
