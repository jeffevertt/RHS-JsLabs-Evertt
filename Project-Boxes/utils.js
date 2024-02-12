
function randRange(min, max) {
	return min + Math.random() * (max - min);
}

function inRect(rc, x, y, r) {
	if ((x + r) < (toCoordFrameX(rc.attr('x'))) ||
		(y + r) < (toCoordFrameY(rc.attr('y')) - toCoordFrameLength(rc.attr('height'))) ||
		(x - r) > (toCoordFrameX(rc.attr('x')) + toCoordFrameLength(rc.attr('width'))) ||
		(y - r) > (toCoordFrameY(rc.attr('y')))) {
		return false;
	}
	return true;
}
function inCircle(circle, x, y) {
	let dx = x - circle.attr('cx');
	let dy = y - circle.attr('cy');
	let dst = Math.sqrt(dx * dx + dy * dy);
	if (dst < 10) {
		return true;
	}
	return false;
}

function raphaelRect(p0, p1, color = 'darkgray', strokeColor = 'black', thickness = 0.4) {
	let dirVec = vec2.subtract(p1, p0);
	let segLen = dirVec.length();
	let angle = -Math.atan2(dirVec.y, dirVec.x);
	let gfx = raphael.rect(toPixelsX(p0.x), toPixelsY(p0.y + thickness/2), toPixelsLength(segLen), toPixelsLength(thickness), 3);
	gfx.attr({ fill: color, stroke: strokeColor, 'stroke-width': 3 });
	gfx.attr({ transform:"R"+R2D(angle)+","+toPixelsX(p0.x)+","+toPixelsY(p0.y) });
	return gfx;
}

function toCoordFrameX(pos) {
	pos = (pos-origin.x)/pixelsPerUnit;
	return pos;
}
function toCoordFrameY(pos) {
	pos = -(pos-origin.y)/pixelsPerUnit;
	return pos;
}
function toCoordFrame(pos) {
	let ret = vec2.copy(pos);
	ret.x = (ret.x-origin.x)/pixelsPerUnit;
	ret.y = -(ret.y-origin.y)/pixelsPerUnit;
	return ret;
}
function toCoordFrameLength(len) {
	return len / pixelsPerUnit;
}
function toPixelsX(pos) {
	pos = pos * pixelsPerUnit + origin.x;
	return pos;
}
function toPixelsY(pos) {
	pos = -pos * pixelsPerUnit + origin.y;
	return pos;
}
function toPixels(pos) {
	let ret = vec2.copy(pos);
	ret.x = ret.x * pixelsPerUnit + origin.x;
	ret.y = -ret.y * pixelsPerUnit + origin.y;
	return ret;
}
function toPixelsLength(len) {
	return len * pixelsPerUnit;
}

function maxCoordinateX() {
	return toCoordFrameX(canvas.offsetWidth);
}
function minCoordinateX() {
	return toCoordFrameX(0);
}
function maxCoordinateY() {
	return toCoordFrameY(0);
}
function minCoordinateY() {
	return toCoordFrameY(canvas.offsetHeight);
}

function R2D(radians) {
	return radians * (180/Math.PI);
}
function D2R(degrees) {
	return degrees * (Math.PI/180);
}


function ColorChannelToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}
function RGBToHex(r, g, b) {
	return "#" + ColorChannelToHex(r) + ColorChannelToHex(g) + ColorChannelToHex(b);
}
function HSVToRGBHex(h, s, v) { // h, s, and v are [0, 1]. however, v super saturates, 0.5 for full color, 1 for white
    var r, g, b;
    if(s == 0) {
        r = g = b = v; // achromatic
    } else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = v < 0.5 ? v * (1 + s) : v + s - v * s;
        var p = 2 * v - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return RGBToHex(Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255));
}

// Override the log function...
function log(str) {
	if (document.getElementById('log') != null) {
		document.getElementById('log').value += str + "\n";
	}
}

// Exec code...
function cleanCode(code) {
	return code.replaceAll('–','-').replaceAll('.x​','.x').replaceAll('.y​','.y').replaceAll('​',''); // That last one is some kind of end of line character word sometimes puts in (?)
}

function executeCode(code) {
	try {
		eval(cleanCode(code));
	} catch (error) {
		document.getElementById('log').value += error + "\n";
		return false;
	}
	return true;
}

// Intersection/Distances (returns null if no intersection, vec2 with intersection otherwise)...
function distancePointToLine(point, linePoint, lineDirUnit) {
	let v = vec2.subtract(point, linePoint);
	let u = v.subtract(vec2.multiply(lineDirUnit, vec2.dot(v, lineDirUnit)));
	return u.length();
}

function distancePointToPlane(point, linePoint, lineNormalUnit) {
	let v = vec2.subtract(point, linePoint);
	return vec2.dot(v, lineNormalUnit);
}

function intersectSegments(r0p, r0d, r1p, r1d) {
    let s = (-r0d.y * (r0p.x - r1p.x) + r0d.x * (r0p.y - r1p.y)) / (-r1d.x * r0d.y + r0d.x * r1d.y);
    let t = ( r1d.x * (r0p.y - r1p.y) - r1d.y * (r0p.x - r1p.x)) / (-r1d.x * r0d.y + r0d.x * r1d.y);
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
		return new vec2(r0p.x + (t * r0d.x), r0p.y + (t * r0d.y));
    }
    return null;
}

// Returns { intersects:bool, closestPoint:vec2, closestPointT:float }
function intersectSphereSegment(sphereCenter, sphereRadius, segStart, segDir) {
	let v = vec2.subtract(sphereCenter, segStart);
	let segLen = segDir.length();
	let segDirUnit = vec2.multiply(segDir, 1 / segLen);
	let alongSegT = Math.min(Math.max((vec2.dot(v, segDirUnit) / segLen), 0), 1);
	let closestPoint = vec2.add(segStart, vec2.multiply(segDir, alongSegT));
	let intersectsSphere = (sphereCenter.distanceSqr(closestPoint) < (sphereRadius * sphereRadius)) ? true : false;
	return { intersects:intersectsSphere, closestPoint:closestPoint, closestPointT:alongSegT };
}
