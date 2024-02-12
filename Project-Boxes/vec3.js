
class vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
		this.z = z;
    }

    add(other) {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
        return this;
    }
	
	plus(other) {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
        return this;
    }

    subtract(other) {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
        return this;
    }
	
	minus(other) {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
        return this;
    }

    multiply(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
        return this;
    }
	
	times(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
        return this;
    }
	
    divide(scalar) {
		this.x /= scalar;
		this.y /= scalar;
		this.z /= scalar;
        return this;
    }

    length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    lengthSqr() {
		return (this.x * this.x + this.y * this.y + this.z * this.z);
    }
	
    normalize() {
		let invLen = 1.0 / this.length();
		this.x *= invLen;
		this.y *= invLen;
		this.z *= invLen;
		return this;
    }

    unit() {
		let unitVec = new vec3(this.x, this.y, this.z);
		unitVec.normalize();
		return unitVec;
    }

    distance(other) {
		let me = new vec3(this.x, this.y, this.z);
		return me.subtract(other).length();
    }

    distanceSqr(other) {
		let me = new vec3(this.x, this.y, this.z);
		return me.subtract(other).lengthSqr();
    }
	
    dot(other) {
		return this.x * other.x + this.y * other.y + this.z * other.z;
    }
	
	toStringWithSpaceDelimiter() {
		let v = new vec3(this.x, this.y, this.z);
		v.x = Math.round(v.x * 1000) / 1000;
		v.y = Math.round(v.y * 1000) / 1000;
		v.z = Math.round(v.z * 1000) / 1000;
		return "" + v.x + " " + v.y + " " + v.z;		
	}

	// Static functions...
	static add(v1, v2) {
		let ret = new vec3(v1.x, v1.y, v1.z);
		return ret.add(v2);
	}

	static subtract(v1, v2) {
		let ret = new vec3(v1.x, v1.y, v1.z);
		return ret.subtract(v2);
	}

	static multiply(v1, s) {
		if ((v1.x == undefined) && (s.x != undefined)) {
			let ret = new vec3(s.x, s.y, s.z);
			return ret.multiply(v1);
		}
		let ret = new vec3(v1.x, v1.y, v1.z);
		return ret.multiply(s);
	}
	
	static divide(v1, s) {
		let ret = new vec3(v1.x, v1.y, v1.z);
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
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
	}
	
	static lerp(v1, v2, t) {
		let delta = subtract(v2, v1);
		let ret = new vec3(v1.x, v1.y, v1.z);
		return ret.add(delta.multiply(t));
	}
	
	static copy(other) {
		return new vec3(other.x, other.y, other.z);
	}
	static zero() {
		return new vec3(0,0,0);
	}
	static right() {
		return new vec3(1,0,0);
	}
	static left() { 
		return new vec3(-1,0,0);
	}
	static up() { 
		return new vec3(0,1,0);
	}
	static down() { 
		return new vec3(0,-1,0);
	}
	static forward() {
		return new vec3(0,0,1);
	}
	static backward() {
		return new vec3(0,0,-1);
	}
}

// Override toString...
vec3.prototype.toString = function() {
	let v = new vec3(this.x, this.y, this.z);
	v.x = Math.round(v.x * 1000) / 1000;
	v.y = Math.round(v.y * 1000) / 1000;
	v.z = Math.round(v.z * 1000) / 1000;
	return "" + v.x + "," + v.y + "," + v.z;
}

// Define these are globals as well...
function v3(x, y, z) {
	return new vec3(x, y, z);
}
