
class vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
		this.x += other.x;
		this.y += other.y;
        return this;
    }
	
	plus(other) {
		this.x += other.x;
		this.y += other.y;
        return this;
    }

    subtract(other) {
		this.x -= other.x;
		this.y -= other.y;
        return this;
    }
	
	minus(other) {
		this.x -= other.x;
		this.y -= other.y;
        return this;
    }

    multiply(scalar) {
		this.x *= scalar;
		this.y *= scalar;
        return this;
    }
	
	times(scalar) {
		this.x *= scalar;
		this.y *= scalar;
        return this;
    }
	
    divide(scalar) {
		this.x /= scalar;
		this.y /= scalar;
        return this;
    }

    length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lengthSqr() {
		return (this.x * this.x + this.y * this.y);
    }
	
    normalize() {
		let invLen = 1.0 / this.length();
		this.x *= invLen;
		this.y *= invLen;
		return this;
    }

    unit() {
		let unitVec = new vec2(this.x, this.y);
		unitVec.normalize();
		return unitVec;
    }

    angle() {
		return Math.atan2(this.y, this.x) * 180.0 / Math.PI;
    }

    distance(other) {
		let me = new vec2(this.x, this.y);
		return me.subtract(other).length();
    }

    distanceSqr(other) {
		let me = new vec2(this.x, this.y);
		return me.subtract(other).lengthSqr();
    }
	
    dot(other) {
		return this.x * other.x + this.y * other.y;
    }
	
	rotate(angle) {
		angle = angle * (Math.PI/180);
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const x = this.x;
		const y = this.y;
		this.x = x * cos - y * sin;
		this.y = x * sin + y * cos;
		return this;
	}
	
	toStringWithSpaceDelimiter() {
		let v = new vec2(this.x, this.y);
		v.x = Math.round(v.x * 1000) / 1000;
		v.y = Math.round(v.y * 1000) / 1000;
		return "" + v.x + " " + v.y;		
	}

	// Static functions...
	static add(v1, v2) {
		let ret = new vec2(v1.x, v1.y);
		return ret.add(v2);
	}

	static subtract(v1, v2) {
		let ret = new vec2(v1.x, v1.y);
		return ret.subtract(v2);
	}

	static multiply(v1, s) {
		let ret = new vec2(v1.x, v1.y);
		return ret.multiply(s);
	}
	
	static divide(v1, s) {
		let ret = new vec2(v1.x, v1.y);
		return ret.divide(s);
	}	

	static unit(v1) {
		return v1.unit();
	}
	
	static length(v) {
		return v.length();
	}

	static lengthSqr(v) {
		return v.lengthSqr();
	}
	
	static distance(v1, v2) {
		return v1.distance(v2);
	}
	
	static distanceSqr(v1, v2) {
		return v1.distanceSqr(v2);
	}
	
	static dot(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y;
	}
	
	static rotate(v1, a) {
		let ret = new vec2(v1.x, v1.y);
		return ret.rotate(a);
	}
	
	static lerp(v1, v2, t) {
		let delta = subtract(v2, v1);
		let ret = new vec2(v1.x, v1.y);
		return ret.add(delta.multiply(t));
	}
	
	static copy(other) {
		return new vec2(other.x, other.y);
	}
	static zero() {
		return new vec2(0,0);
	}
	static right() {
		return new vec2(1,0);
	}
	static left() { 
		return new vec2(-1,0);
	}
	static up() { 
		return new vec2(0,1);
	}
	static down() { 
		return new vec2(0,-1);
	}
}

// Override toString...
vec2.prototype.toString = function() {
	let v = new vec2(this.x, this.y);
	v.x = Math.round(v.x * 1000) / 1000;
	v.y = Math.round(v.y * 1000) / 1000;
	return "" + v.x + "," + v.y;
}

// Define these are globals as well...
function v2(x, y) {
	return new vec2(x, y);
}

function add(v1, v2) {
	return vec2.add(v1, v2);
}

function subtract(v1, v2) {
	return vec2.subtract(v1, v2);
}

function multiply(v1, s) {
	return vec2.multiply(v1, s);
}

function divide(v1, s) {
	return vec2.divide(v1, s);
}	

function unit(v1) {
	return v1.unit();
}

function length(v) {
	return vec2.length(v);
}

function lengthSqr(v) {
	return vec2.lengthSqr(v);
}

function distance(v1, v2) {
	return v1.distance(v2);
}

function distanceSqr(v1, v2) {
	return v1.distanceSqr(v2);
}

function dot(v1, v2) {
	return vec2.dot(v1, v2);
}

function rotate(v1, a) {
	return vec2.rotate(v1, a);
}