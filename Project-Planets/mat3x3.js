
class mat3x3 {
    constructor(m00 = 0, m01 = 0, m02 = 0, m10 = 0, m11 = 0, m12 = 0, m20 = 0, m21 = 0, m22 = 0) { // Listing row elements left to right, then top to bottom...
		this.set(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }
	
	set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
		if (m00.m00 != undefined) { // See if another mat3x3 was passed in...
			this.m00 = m00.m00;
			this.m01 = m00.m01;
			this.m02 = m00.m02;
			this.m10 = m00.m10;
			this.m11 = m00.m11;
			this.m12 = m00.m12;
			this.m20 = m00.m20;
			this.m21 = m00.m21;
			this.m22 = m00.m22;
		}
		else {
			this.m00 = m00;
			this.m01 = m01;
			this.m02 = m02;
			this.m10 = m10;
			this.m11 = m11;
			this.m12 = m12;
			this.m20 = m20;
			this.m21 = m21;
			this.m22 = m22;
		}
		return this;
	}
	
	basisX() {
		return new vec2(this.m00, this.m10);
	}
	
	basisY() {
		return new vec2(this.m01, this.m11);
	}
	
	basisZ() {
		return new vec2(this.m02, this.m12);
	}

    add(other) {
		this.m00 += other.m00;
		this.m01 += other.m01;
		this.m02 += other.m02;
		this.m10 += other.m10;
		this.m11 += other.m11;
		this.m12 += other.m12;
		this.m20 += other.m20;
		this.m21 += other.m21;
		this.m22 += other.m22;
        return this;
    }

    subtract(other) {
		this.m00 -= other.m00;
		this.m01 -= other.m01;
		this.m02 -= other.m02;
		this.m10 -= other.m10;
		this.m11 -= other.m11;
		this.m12 -= other.m12;
		this.m20 -= other.m20;
		this.m21 -= other.m21;
		this.m22 -= other.m22;
        return this;
    }
	
    multiply(other) { 		// other:mat3x3...
		this.set(
			this.m00 * other.m00 + this.m01 * other.m10 + this.m02 * other.m20, 
				this.m00 * other.m01 + this.m01 * other.m11 + this.m02 * other.m21,
				this.m00 * other.m02 + this.m01 * other.m12 + this.m02 * other.m22,
			this.m10 * other.m00 + this.m11 * other.m10 + this.m12 * other.m20, 
				this.m10 * other.m01 + this.m11 * other.m11 + this.m12 * other.m21,
				this.m10 * other.m02 + this.m11 * other.m12 + this.m12 * other.m22,
			this.m20 * other.m00 + this.m21 * other.m10 + this.m22 * other.m20, 
				this.m20 * other.m01 + this.m21 * other.m11 + this.m22 * other.m21,
				this.m20 * other.m02 + this.m21 * other.m12 + this.m22 * other.m22);
        return this;
    }
	
	transform(pt) { 		// pt:vec3, returns vec3
		return new vec3(
			this.m00 * pt.x + this.m01 * pt.y + this.m02 * pt.z, 
			this.m10 * pt.x + this.m11 * pt.y + this.m12 * pt.z, 
			this.m20 * pt.x + this.m21 * pt.y + this.m22 * pt.z);
	}
	
	transformPoint(pt) { 	// pt:vec3, returns vec2
		let ret = this.transform(pt);
		ret.divide(ret.z);
		return new vec2(ret.x, ret.y);
	}
	
	scale(scalar) {
		this.m00 *= scalar;
		this.m01 *= scalar;
		this.m02 *= scalar;
		this.m10 *= scalar;
		this.m11 *= scalar;
		this.m12 *= scalar;
		this.m20 *= scalar;
		this.m21 *= scalar;
		this.m22 *= scalar;
        return this;
	}

    det() {
		let l = this.m00 * (this.m11 * this.m22 - this.m21 * this.m12);
		let m = this.m01 * (this.m10 * this.m22 - this.m20 * this.m12);
		let r = this.m02 * (this.m10 * this.m21 - this.m20 * this.m11);
		return (l - m + r);
    }

    transpose() {
		this.set(this.m00, this.m10, this.m20,
				 this.m01, this.m11, this.m21,
				 this.m02, this.m12, this.m22);
		return this;
    }
	
	inverse() {
		let det = this.det();
		let inv = new mat3x3(
			(this.m11 * this.m22 - this.m21 * this.m12), (this.m02 * this.m21 - this.m22 * this.m01), (this.m01 * this.m12 - this.m11 * this.m02),
			(this.m12 * this.m20 - this.m22 * this.m10), (this.m00 * this.m22 - this.m20 * this.m02), (this.m02 * this.m10 - this.m12 * this.m00),
			(this.m10 * this.m21 - this.m20 * this.m11), (this.m01 * this.m20 - this.m21 * this.m00), (this.m00 * this.m11 - this.m10 * this.m01));
	}
	
	toMat3x3() {
		return this;
	}
	
	toStringWithSpaceDelimiter() {
		let m = mat3x3.copy(this);
		m.m00 = Math.round(m.m00 * 1000) / 1000;
		m.m01 = Math.round(m.m01 * 1000) / 1000;
		m.m02 = Math.round(m.m02 * 1000) / 1000;
		m.m10 = Math.round(m.m10 * 1000) / 1000;
		m.m11 = Math.round(m.m11 * 1000) / 1000;
		m.m12 = Math.round(m.m12 * 1000) / 1000;
		m.m20 = Math.round(m.m20 * 1000) / 1000;
		m.m21 = Math.round(m.m21 * 1000) / 1000;
		m.m22 = Math.round(m.m22 * 1000) / 1000;
		return "(" + m.m00 + " " + m.m01 + " " + m.m02 + ") (" + + m.m10 + " " + m.m11 + " " + m.m12 + ") (" + m.m20 + " " + m.m21 + " " + m.m22 + ")";
	}

	// Static functions...
    static add(m1, m2) {
        let ret = mat3x3.copy(m1);
        return ret.add(m2);
    }
    static subtract(m1, m2) {
        let ret = mat3x3.copy(m1);
        return ret.subtract(m2);
    }
    static multiply(m1, m2) {
        let ret = mat3x3.copy(m1);
        return ret.multiply(m2);
    }
    static scale(m1, m2) {
        let ret = mat3x3.copy(m1);
        return ret.scale(m2);
    }
	static det(m) {
		return m.det();
	}
	
	static copy(other) {
		return new mat3x3(other.m00, other.m01, other.m02, other.m10, other.m11, other.m12, other.m20, other.m21, other.m22);
	}
	static zero() {
		return new mat3x3(0,0,0,0,0,0,0,0,0);
	}
	static identity() {
		return new mat3x3(1,0,0,0,1,0,0,0,1);
	}
}

// Override toString...
mat3x3.prototype.toString = function() {
	let m = mat3x3.copy(this);
	m.m00 = Math.round(m.m00 * 1000) / 1000;
	m.m01 = Math.round(m.m01 * 1000) / 1000;
	m.m02 = Math.round(m.m02 * 1000) / 1000;
	m.m10 = Math.round(m.m10 * 1000) / 1000;
	m.m11 = Math.round(m.m11 * 1000) / 1000;
	m.m12 = Math.round(m.m12 * 1000) / 1000;
	m.m20 = Math.round(m.m20 * 1000) / 1000;
	m.m21 = Math.round(m.m21 * 1000) / 1000;
	m.m22 = Math.round(m.m22 * 1000) / 1000;
	return "(" + m.m00 + " " + m.m01 + " " + m.m02 + ") (" + + m.m10 + " " + m.m11 + " " + m.m12 + ") (" + m.m20 + " " + m.m21 + " " + m.m22 + ")";	
}

// Define these are globals as well...
function m3x3(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
	return new mat3x3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
}
function m3x3RotX(angle) { // Angle is in degrees
	return new mat3x3(1, 0, 0, 0, cos(angle), -sin(angle), 0, sin(angle), cos(angle));
}
function m3x3RotY(angle) { // Angle is in degrees
	return new mat3x3(cos(angle), 0, sin(angle), 0, 1, 0, -sin(angle), 0, cos(angle));
}
function m3x3RotZ(angle) { // Angle is in degrees
	return new mat3x3(cos(angle), -sin(angle), 0, sin(angle), cos(angle), 0, 0, 0, 1);
}
function m3x3RotAxis(axis, angle) { // Rotation about specified axis, angle is in degrees
	axis.normalize();
	return new mat3x3(cos(angle) + axis.x * axis.x * (1 - cos(angle)), axis.x * axis.y * (1 - cos(angle)) - axis.z * sin(angle), axis.x * axis.z * (1 - cos(angle)) + axis.y * sin(angle),
	                  axis.y * axis.z * (1 - cos(angle)) + axis.z * sin(angle), cos(angle) + axis.y * axis.y * (1 - cos(angle)), axis.y * axis.z * (1 - cos(angle)) - axis.x * sin(angle),
					  axis.z * axis.x * (1 - cos(angle)) - axis.y * sin(angle), axis.z * axis.y * (1 - cos(angle)) + axis.x * sin(angle), cos(angle) + axis.z * axis.z * (1 - cos(angle)));
}