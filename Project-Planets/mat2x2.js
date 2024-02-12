
class mat2x2 {
    constructor(a = 0, b = 0, c = 0, d = 0) { // Listing row elements left to right, then top to bottom...
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
    }
	
	set(a, b, c, d) {
		if (a.a != undefined) { // See if another mat3x3 was passed in...
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
		}
		else {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
		}
		return this;
	}
	
	basisX() {
		return new vec2(this.a, this.c);
	}
	
	basisY() {
		return new vec2(this.b, this.d);
	}

    add(other) {
		this.a += other.a;
		this.b += other.b;
		this.c += other.c;
		this.d += other.d;
        return this;
    }

    subtract(other) {
		this.a -= other.a;
		this.b -= other.b;
		this.c -= other.c;
		this.d -= other.d;
        return this;
    }
	
    multiply(other) {
		this.set(
			this.a * other.a + this.b * other.c, this.a * other.b + this.b * other.d,
			this.c * other.a + this.d * other.c, this.c * other.b + this.d * other.d);
        return this;
    }
	
	transform(pt) { // pt:vec2
		return new vec2(
			this.a * pt.x + this.b * pt.y, 
			this.c * pt.x + this.d * pt.y);
	}
	
	scale(scalar) {
		this.a *= scalar;
		this.b *= scalar;
		this.c *= scalar;
		this.d *= scalar;
        return this;
	}

    det() {
		return this.a * this.d - this.b * this.c;
    }

    inverse() {
		this.set(this.d, -this.b, -this.c, this.a);
		return this.scale(det());
    }
	
	toStringWithSpaceDelimiter() {
		let m = new mat2x2(this.a, this.b, this.c, this.d);
		m.a = Math.round(m.a * 1000) / 1000;
		m.b = Math.round(m.b * 1000) / 1000;
		m.c = Math.round(m.c * 1000) / 1000;
		m.d = Math.round(m.d * 1000) / 1000;
		return "" + m.a + " " + m.b + " " + m.c + " " + m.d;		
	}

	// Static functions...
	static add(v1, v2) {
		let ret = mat2x2.copy(m1);
		return ret.add(v2);
	}
	static subtract(v1, v2) {
		let ret = mat2x2.copy(m1);
		return ret.subtract(v2);
	}
	static multiply(m1, m2) {
		let ret = mat2x2.copy(m1);
		return ret.multiply(m2);
	}
	static scale(m1, m2) {
		let ret = mat2x2.copy(m1);
		return ret.scale(m2);
	}
	static inverse(m) {
		let ret = mat2x2.copy(m);
		return ret.inverse();
	}
	static det(m) {
		return m.det();
	}
	
	static copy(other) {
		return new mat2x2(other.a, other.b, other.c, other.d);
	}
	static zero() {
		return new mat2x2(0,0,0,0);
	}
	static identity() {
		return new mat2x2(1,0,0,1);
	}
}

// Matrix container (or chain)
class mat2x2c {
	constructor(matArray = []) {
		this.mats = matArray;
	}
	
	clear() {
		this.mats = [];
	}
	
	insertEnd(mat) {
		this.mats.push(mat);
	}
	insertFront(mat) {
		this.mats.unshift(mat);
	}
	
	eval() {
		if (this.mats.length == 0) {
			return mat2x2.identity();
		}
		let ret = mat2x2.copy(this.mats[0]);
		for (let i = 1; i < this.mats.length; ++i) {
			ret.multiply(this.mats[i]);
		}
		return ret;
	}
}

// Override toString...
mat2x2.prototype.toString = function() {
		let m = new mat2x2(this.a, this.b, this.c, this.d);
		m.a = Math.round(m.a * 1000) / 1000;
		m.b = Math.round(m.b * 1000) / 1000;
		m.c = Math.round(m.c * 1000) / 1000;
		m.d = Math.round(m.d * 1000) / 1000;
		return "" + m.a + "," + m.b + "," + m.c + "," + m.d;		
	}

// Define these are globals as well...
function m2x2(a, b, c, d) {
	return new mat2x2(a, b, c, d);
}