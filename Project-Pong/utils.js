
function randRange(min, max) {
    return min + Math.random() * (max - min);
}

function touchRect(r, ball) {
    if (ball.attr('cx') + ball.attr('r') < r.attr('x') ||
        ball.attr('cy') + ball.attr('r') < r.attr('y') ||
        ball.attr('cx') - ball.attr('r') > r.attr('x') + r.attr('width') ||
        ball.attr('cy') - ball.attr('r') > r.attr('y') + r.attr('height')) {
        return false;
    }
    return true;
}
function inRect(r, ball) {
    if (ball.attr('cx') + ball.attr('r') < r.attr('x') ||
        ball.attr('cy') + ball.attr('r') < r.attr('y') ||
        ball.attr('cx') - ball.attr('r') > r.attr('x') + r.attr('width') ||
        ball.attr('cy') - ball.attr('r') > r.attr('y') + r.attr('height')) {
        return false;
    }
    return true;
}
function inCircle(circle, ball) {
    let dx = ball.attr('cx') - circle.attr('cx');
    let dy = ball.attr('cy') - circle.attr('cy');
    let dst = Math.sqrt(dx * dx + dy * dy);
    if (dst < 10) {
        return true;
    }
    return false;
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
    pos.x = (pos.x-origin.x)/pixelsPerUnit;
    pos.y = -(pos.y-origin.y)/pixelsPerUnit;
    return pos;
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
    pos.x = pos.x * pixelsPerUnit + origin.x;
    pos.y = -pos.y * pixelsPerUnit + origin.y;
    return pos;
}
function toPixelsLength(len) {
    return len * pixelsPerUnit;
}

// Override the log function...
function log(value) {
    document.getElementById('log').value += value + "\n";
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
    let u = v - vec2.multiply(lineDirUnit, vec2.dot(v, lineDirUnit));
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

// Creates a polygon/path by clipping a rectangle...
function createPolygonFromClippedRectangle(rectUL, rectLR, point, dirUnit, normUnit) {
    // Setup rect...
    let rectCorners = [
        new vec2(rectUL.x, rectUL.y),
        new vec2(rectLR.x, rectUL.y),
        new vec2(rectLR.x, rectLR.y),
        new vec2(rectUL.x, rectLR.y) ];
    let rectULr = vec2.subtract(rectCorners[1], rectUL); // UL-Right (not normalized)
    let rectULd = vec2.subtract(rectCorners[3], rectUL);    // UL-Down  (not normalized)
    let rectLRl = vec2.subtract(rectCorners[3], rectLR); // LR-Left  (not normalized)
    let rectLRu = vec2.subtract(rectCorners[1], rectLR);    // LR-Down  (not normalized)

    // Intersect ray with edges of rectangle...
    let segDir = vec2.multiply(dirUnit, 2000);
    let segStart = vec2.subtract(point, vec2.multiply(segDir, 0.5));
    let pts = [ intersectSegments(segStart, segDir, rectUL, rectULr), 
                intersectSegments(segStart, segDir, rectLR, rectLRu),
                intersectSegments(segStart, segDir, rectLR, rectLRl),
                intersectSegments(segStart, segDir, rectUL, rectULd) ];

    // Loop over the points, building the polygon...
    let poly = null;
    let firstIntersection = null;
    let firstIntersectionIdx = null;
    for (let i = 0; i < pts.length; ++i) {
        if (pts[i] == null) {
            continue;
        }
        if (firstIntersection == null) {
            // First intersection...
            firstIntersectionIdx = i;
            firstIntersection = pts[i];
        }
        else {
            // Figure out our first corner to fill...
            let firstCornerIdx = (distancePointToPlane(rectCorners[firstIntersectionIdx + 1], point, normUnit) < 0) ? (firstIntersectionIdx + 1) : (i + 1);

            // Now, walk the corners...
            for (let j = firstCornerIdx; j < (firstCornerIdx + 4); ++j) {
                let cornerIdx = j % 4; 
                let dst = distancePointToPlane(rectCorners[cornerIdx], point, normUnit);
                if (dst < 0) {
                    if (poly == null) {
                        if (firstCornerIdx == (firstIntersectionIdx + 1)) {
                            poly = "M " + toPixels(firstIntersection).toStringWithSpaceDelimiter();
                            firstIntersection = null;
                        } else {
                            poly = "M " + toPixels(pts[i]).toStringWithSpaceDelimiter();
                        }
                    }
                    poly += " L " + toPixels(rectCorners[cornerIdx]).toStringWithSpaceDelimiter();
                }
            }
            if (firstIntersection != null) {
                poly += " L " + toPixels(firstIntersection).toStringWithSpaceDelimiter();
                firstIntersection = null;
            }
            else {
                poly += " L " + toPixels(pts[i]).toStringWithSpaceDelimiter();
            }
            break;
        }
    }
    if (poly == null) {
        return null;
    }
    
    return poly + " Z";
}
