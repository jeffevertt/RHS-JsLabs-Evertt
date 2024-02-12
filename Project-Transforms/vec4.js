
class vec4 {
    constructor(x, y, z, w) {
		if (x.w != undefined) { 	 // If passed in another vec4...
			this.x = x.x;
			this.y = x.y;
			this.z = x.z;
			this.w = x.w;
		}
		else if (x.x != undefined) { // If passed in a vec3...
			this.x = x.x;
			this.y = x.y;
			this.z = x.z;
			this.w = 1;
		}
		else {
			this.x = x;
			this.y = y;
			this.z = z;
			this.w = w;
		}
    }

    add(other) {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
		this.w += other.w;
        return this;
    }
	
	plus(other) {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
		this.w += other.w;
        return this;
    }

    subtract(other) {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
		this.w -= other.w;
        return this;
    }
	
	minus(other) {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
		this.w -= other.w;
        return this;
    }

    multiply(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		this.w *= scalar;
        return this;
    }
	
	times(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		this.w *= scalar;
        return this;
    }
	
    divide(scalar) {
		this.x /= scalar;
		this.y /= scalar;
		this.z /= scalar;
		this.w /= scalar;
        return this;
    }

    length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    lengthSqr() {
		return (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
	
    normalize() {
		let invLen = 1.0 / this.length();
		this.x *= invLen;
		this.y *= invLen;
		this.z *= invLen;
		this.w *= invLen;
		return this;
    }

    unit() {
		let unitVec = new vec4(this.x, this.y, this.z, this.w);
		unitVec.normalize();
		return unitVec;
    }

    distance(other) {
		let me = new vec4(this.x, this.y, this.z, this.w);
		return me.subtract(other).length();
    }

    distanceSqr(other) {
		let me = new vec4(this.x, this.y, this.z, this.w);
		return me.subtract(other).lengthSqr();
    }
	
    dot(other) {
		return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }
	
	toStringWithSpaceDelimiter() {
		let v = new vec4(this.x, this.y, this.z, this.w);
		v.x = Math.round(v.x * 1000) / 1000;
		v.y = Math.round(v.y * 1000) / 1000;
		v.z = Math.round(v.z * 1000) / 1000;
		v.w = Math.round(v.w * 1000) / 1000;
		return "" + v.x + " " + v.y + " " + v.z + " " + v.w;
	}

	// Static functions...
	static add(v1, v2) {
		let ret = new vec4(v1.x, v1.y, v1.z, v1.w);
		return ret.add(v2);
	}

	static subtract(v1, v2) {
		let ret = new vec4(v1.x, v1.y, v1.z, v1.w);
		return ret.subtract(v2);
	}

	static multiply(v1, s) {
		if ((v1.x == undefined) && (s.x != undefined)) {
			let ret = new vec4(s.x, s.y, s.z, s.w);
			return ret.multiply(v1);
		}		
		let ret = new vec4(v1.x, v1.y, v1.z, v1.w);
		return ret.multiply(s);
	}
	
	static divide(v1, s) {
		let ret = new vec4(v1.x, v1.y, v1.z, v1.w);
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
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z + v1.w * v2.w;
	}
	
	static lerp(v1, v2, t) {
		let delta = subtract(v2, v1);
		let ret = new vec4(v1.x, v1.y, v1.z, v1.w);
		return ret.add(delta.multiply(t));
	}
	
	static copy(other) {
		return new vec4(other.x, other.y, other.z, other.w);
	}
	static zero() {
		return new vec4(0,0,0,0);
	}
	static right() {
		return new vec4(1,0,0,0);
	}
	static left() { 
		return new vec4(-1,0,0,0);
	}
	static up() { 
		return new vec4(0,1,0,0);
	}
	static down() { 
		return new vec4(0,-1,0,0);
	}
	static forward() {
		return new vec4(0,0,1,0);
	}
	static backward() {
		return new vec4(0,0,-1,0);
	}
}

// Override toString...
vec4.prototype.toString = function() {
	let v = new vec4(this.x, this.y, this.z, this.w);
	v.x = Math.round(v.x * 1000) / 1000;
	v.y = Math.round(v.y * 1000) / 1000;
	v.z = Math.round(v.z * 1000) / 1000;
	v.w = Math.round(v.w * 1000) / 1000;
	return "" + v.x + "," + v.y + "," + v.z + "," + v.w;
}

// Define these are globals as well...
function v4(x, y, z, w) {
	return new vec4(x, y, z, w);
}
