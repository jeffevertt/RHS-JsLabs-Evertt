
class mat4x4 {
    constructor(m00 = 0, m01 = 0, m02 = 0, m03 = 0, m10 = 0, m11 = 0, m12 = 0, m13 = 0, m20 = 0, m21 = 0, m22 = 0, m23 = 0, m30 = 0, m31 = 0, m32 = 0, m33 = 0) { // Listing row elements left to right, then top to bottom...
		this.set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
    }
	
	set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
		if (m00.m00 != undefined) { // See if another mat4x4 was passed in...
			if (m00.m03 == undefined) { // Or a mat3x3...
			    this.m00 = m00.m00;
				this.m01 = m00.m01;
				this.m02 = m00.m02;
				this.m03 = 0;
				this.m10 = m00.m10;
				this.m11 = m00.m11;
				this.m12 = m00.m12;
				this.m13 = 0;
				this.m20 = m00.m20;
				this.m21 = m00.m21;
				this.m22 = m00.m22;
				this.m23 = 0;
				this.m30 = 0;
				this.m31 = 0;
				this.m32 = 0;
				this.m33 = 1;
			}
			else {
				this.m00 = m00.m00;
				this.m01 = m00.m01;
				this.m02 = m00.m02;
				this.m03 = m00.m03;
				this.m10 = m00.m10;
				this.m11 = m00.m11;
				this.m12 = m00.m12;
				this.m13 = m00.m13;
				this.m20 = m00.m20;
				this.m21 = m00.m21;
				this.m22 = m00.m22;
				this.m23 = m00.m23;
				this.m30 = m00.m30;
				this.m31 = m00.m31;
				this.m32 = m00.m32;
				this.m33 = m00.m33;
			}
		}
		else {
			this.m00 = m00;
			this.m01 = m01;
			this.m02 = m02;
			this.m03 = m03;
			this.m10 = m10;
			this.m11 = m11;
			this.m12 = m12;
			this.m13 = m13;
			this.m20 = m20;
			this.m21 = m21;
			this.m22 = m22;
			this.m23 = m23;
			this.m30 = m30;
			this.m31 = m31;
			this.m32 = m32;
			this.m33 = m33;
		}
		return this;
	}
	
	basisX() {
		return new vec3(this.m00, this.m10, this.m20);
	}
	
	basisY() {
		return new vec3(this.m01, this.m11, this.m21);
	}
	
	basisZ() {
		return new vec3(this.m02, this.m12, this.m22);
	}

    add(other) {
		this.m00 += other.m00;
		this.m01 += other.m01;
		this.m02 += other.m02;
		this.m03 += other.m03;
		this.m10 += other.m10;
		this.m11 += other.m11;
		this.m12 += other.m12;
		this.m13 += other.m13;
		this.m20 += other.m20;
		this.m21 += other.m21;
		this.m22 += other.m22;
		this.m23 += other.m23;
		this.m30 += other.m30;
		this.m31 += other.m31;
		this.m32 += other.m32;
		this.m33 += other.m33;
        return this;
    }

    subtract(other) {
		this.m00 -= other.m00;
		this.m01 -= other.m01;
		this.m02 -= other.m02;
		this.m03 -= other.m03;
		this.m10 -= other.m10;
		this.m11 -= other.m11;
		this.m12 -= other.m12;
		this.m13 -= other.m13;
		this.m20 -= other.m20;
		this.m21 -= other.m21;
		this.m22 -= other.m22;
		this.m23 -= other.m23;
		this.m30 -= other.m30;
		this.m31 -= other.m31;
		this.m32 -= other.m32;
		this.m33 -= other.m33;
        return this;
    }
	
    multiply(other) { 		// other:mat4x4...
		this.set(
			this.m00 * other.m00 + this.m01 * other.m10 + this.m02 * other.m20 + this.m03 * other.m30, 
				this.m00 * other.m01 + this.m01 * other.m11 + this.m02 * other.m21 + this.m03 * other.m31,
				this.m00 * other.m02 + this.m01 * other.m12 + this.m02 * other.m22 + this.m03 * other.m32,
				this.m00 * other.m03 + this.m01 * other.m13 + this.m02 * other.m23 + this.m03 * other.m33,
			this.m10 * other.m00 + this.m11 * other.m10 + this.m12 * other.m20 + this.m13 * other.m30, 
				this.m10 * other.m01 + this.m11 * other.m11 + this.m12 * other.m21 + this.m13 * other.m31,
				this.m10 * other.m02 + this.m11 * other.m12 + this.m12 * other.m22 + this.m13 * other.m32,
				this.m10 * other.m03 + this.m11 * other.m13 + this.m12 * other.m23 + this.m13 * other.m33,
			this.m20 * other.m00 + this.m21 * other.m10 + this.m22 * other.m20 + this.m23 * other.m30, 
				this.m20 * other.m01 + this.m21 * other.m11 + this.m22 * other.m21 + this.m23 * other.m31,
				this.m20 * other.m02 + this.m21 * other.m12 + this.m22 * other.m22 + this.m23 * other.m32,
				this.m20 * other.m03 + this.m21 * other.m13 + this.m22 * other.m23 + this.m23 * other.m33,
			this.m30 * other.m00 + this.m31 * other.m10 + this.m32 * other.m20 + this.m33 * other.m30, 
				this.m30 * other.m01 + this.m31 * other.m11 + this.m32 * other.m21 + this.m33 * other.m31,
				this.m30 * other.m02 + this.m31 * other.m12 + this.m32 * other.m22 + this.m33 * other.m32,
				this.m30 * other.m03 + this.m31 * other.m13 + this.m32 * other.m23 + this.m33 * other.m33 );
        return this;
    }
	
	transform(pt) { 		// pt:vec3, returns vec3...or pt:vec4, returns vec4
		if (pt.w == undefined) {
			return new vec3(
				this.m00 * pt.x + this.m01 * pt.y + this.m02 * pt.z, 
				this.m10 * pt.x + this.m11 * pt.y + this.m12 * pt.z, 
				this.m20 * pt.x + this.m21 * pt.y + this.m22 * pt.z);
		}
		return new vec4(
			this.m00 * pt.x + this.m01 * pt.y + this.m02 * pt.z + this.m03 * pt.w, 
			this.m10 * pt.x + this.m11 * pt.y + this.m12 * pt.z + this.m13 * pt.w, 
			this.m20 * pt.x + this.m21 * pt.y + this.m22 * pt.z + this.m23 * pt.w,
			this.m30 * pt.x + this.m31 * pt.y + this.m32 * pt.z + this.m33 * pt.w );
	}
	
	transformPoint(pt) { 	// pt:vec4, returns vec3...or pt:vec3, returns vec3
		if (pt.w == undefined) {
			let ret = this.transform(new vec4(pt));
			ret.divide(ret.w);
			return new vec3(ret.x, ret.y, ret.z);
		}
		else {
			let ret = this.transform(pt);
			ret.divide(ret.w);
			return new vec3(ret.x, ret.y, ret.z);
		}
	}
	
	rotateVector(v) { 		// v:vec3, returns vec3
		return new vec3(
			this.m00 * v.x + this.m01 * v.y + this.m02 * v.z, 
			this.m10 * v.x + this.m11 * v.y + this.m12 * v.z, 
			this.m20 * v.x + this.m21 * v.y + this.m22 * v.z );
	}
	
	scale(scalar) {
		this.m00 *= scalar;
		this.m01 *= scalar;
		this.m02 *= scalar;
		this.m03 *= scalar;
		this.m10 *= scalar;
		this.m11 *= scalar;
		this.m12 *= scalar;
		this.m13 *= scalar;
		this.m20 *= scalar;
		this.m21 *= scalar;
		this.m22 *= scalar;
		this.m23 *= scalar;
		this.m30 *= scalar;
		this.m31 *= scalar;
		this.m32 *= scalar;
		this.m33 *= scalar;
        return this;
	}

    det() {
		let m3x3a = new mat3x3(this.m11, this.m12, this.m13,  this.m21, this.m22, this.m23,  this.m31, this.m32, this.m33);
		let m3x3b = new mat3x3(this.m10, this.m12, this.m13,  this.m20, this.m22, this.m23,  this.m30, this.m32, this.m33);
		let m3x3c = new mat3x3(this.m10, this.m11, this.m13,  this.m20, this.m21, this.m23,  this.m30, this.m31, this.m33);
		let m3x3d = new mat3x3(this.m10, this.m11, this.m12,  this.m20, this.m21, this.m22,  this.m30, this.m31, this.m32);
		return this.m00 * m3x3a.det() - this.m01 * m3x3b.det() + this.m02 * m3x3c.det() - this.m03 * m3x3b.det();
    }

    transpose() {
		this.set(this.m00, this.m10, this.m20, this.m30,
				 this.m01, this.m11, this.m21, this.m31,
				 this.m02, this.m12, this.m22, this.m32,
				 this.m03, this.m13, this.m23, this.m33 );
		return this;
    }
	
	// TODO
	//inverse() {
	//	let det = this.det();
	//	let inv = new mat4x4(
	//		(this.m11 * this.m22 - this.m21 * this.m12), (this.m02 * this.m21 - this.m22 * this.m01), (this.m01 * this.m12 - this.m11 * this.m02),
	//		(this.m12 * this.m20 - this.m22 * this.m10), (this.m00 * this.m22 - this.m20 * this.m02), (this.m02 * this.m10 - this.m12 * this.m00),
	//		(this.m10 * this.m21 - this.m20 * this.m11), (this.m01 * this.m20 - this.m21 * this.m00), (this.m00 * this.m11 - this.m10 * this.m01));
	//}
	
	toMat4x4() {
		return this;
	}
	
	toStringWithSpaceDelimiter() {
		let m = mat4x4.copy(this);
		m.m00 = Math.round(m.m00 * 1000) / 1000;
		m.m01 = Math.round(m.m01 * 1000) / 1000;
		m.m02 = Math.round(m.m02 * 1000) / 1000;
		m.m03 = Math.round(m.m03 * 1000) / 1000;
		m.m10 = Math.round(m.m10 * 1000) / 1000;
		m.m11 = Math.round(m.m11 * 1000) / 1000;
		m.m12 = Math.round(m.m12 * 1000) / 1000;
		m.m13 = Math.round(m.m13 * 1000) / 1000;
		m.m20 = Math.round(m.m20 * 1000) / 1000;
		m.m21 = Math.round(m.m21 * 1000) / 1000;
		m.m22 = Math.round(m.m22 * 1000) / 1000;
		m.m23 = Math.round(m.m23 * 1000) / 1000;
		m.m30 = Math.round(m.m30 * 1000) / 1000;
		m.m31 = Math.round(m.m31 * 1000) / 1000;
		m.m32 = Math.round(m.m32 * 1000) / 1000;
		m.m33 = Math.round(m.m33 * 1000) / 1000;
		return "(" + m.m00 + " " + m.m01 + " " + m.m02 + " " + m.m03 + ") (" + + m.m10 + " " + m.m11 + " " + m.m12 + " " + m.m13 + ") (" + m.m20 + " " + m.m21 + " " + m.m22 + " " + m.m23 + ") (" + m.m30 + " " + m.m31 + " " + m.m32 + " " + m.m33 + ")";
	}

	// Static functions...
	static add(v1, v2) {
		let ret = mat4x4.copy(m1);
		return ret.add(v2);
	}
	static subtract(v1, v2) {
		let ret = mat4x4.copy(m1);
		return ret.subtract(v2);
	}
	static multiply(m1, m2) {
		let ret = mat4x4.copy(m1);
		return ret.multiply(m2);
	}
	static scale(m1, m2) {
		let ret = mat4x4.copy(m1);
		return ret.scale(m2);
	}
	static det(m) {
		return m.det();
	}
	
	static copy(other) {
		let ret = new mat4x4(other.m00, other.m01, other.m02, other.m03, other.m10, other.m11, other.m12, other.m13, other.m20, other.m21, other.m22, other.m23, other.m30, other.m31, other.m32, other.m33);
		return ret;
	}
	static zero() {
		return new mat4x4(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0);
	}
	static identity() {
		return new mat4x4(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);
	}
}

// Override toString...
mat4x4.prototype.toString = function() {
	let m = mat4x4.copy(this);
	m.m00 = Math.round(m.m00 * 1000) / 1000;
	m.m01 = Math.round(m.m01 * 1000) / 1000;
	m.m02 = Math.round(m.m02 * 1000) / 1000;
	m.m03 = Math.round(m.m03 * 1000) / 1000;
	m.m10 = Math.round(m.m10 * 1000) / 1000;
	m.m11 = Math.round(m.m11 * 1000) / 1000;
	m.m12 = Math.round(m.m12 * 1000) / 1000;
	m.m13 = Math.round(m.m13 * 1000) / 1000;
	m.m20 = Math.round(m.m20 * 1000) / 1000;
	m.m21 = Math.round(m.m21 * 1000) / 1000;
	m.m22 = Math.round(m.m22 * 1000) / 1000;
	m.m23 = Math.round(m.m23 * 1000) / 1000;
	m.m30 = Math.round(m.m30 * 1000) / 1000;
	m.m31 = Math.round(m.m31 * 1000) / 1000;
	m.m32 = Math.round(m.m32 * 1000) / 1000;
	m.m33 = Math.round(m.m33 * 1000) / 1000;
	return "(" + m.m00 + " " + m.m01 + " " + m.m02 + " " + m.m03 + ") (" + + m.m10 + " " + m.m11 + " " + m.m12 + " " + m.m13 + ") (" + m.m20 + " " + m.m21 + " " + m.m22 + " " + m.m23 + ") (" + m.m30 + " " + m.m31 + " " + m.m32 + " " + m.m33 + ")";	
}

// Define these are globals as well...
function m4x4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
	return new mat4x4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
}
function m4x4RotX(angle) { // Angle is in degrees
	return (new mat4x4()).set( m3x3RotX(angle) );
}
function m4x4RotY(angle) { // Angle is in degrees
	return (new mat4x4()).set( m3x3RotY(angle) );
}
function m4x4RotZ(angle) { // Angle is in degrees
	return (new mat4x4()).set( m3x3RotZ(angle) );
}
function m4x4RotAxis(axis, angle) { // Rotation about specified axis, angle is in degrees
	return (new mat4x4()).set( m4x4RotAxis(angle) );
}
function m4x4Trans(offset) { // Angle is in degrees
	return new mat4x4(1, 0, 0, offset.x, 0, 1, 0, offset.y, 0, 0, 1, offset.z, 0, 0, 0, 1);
}
function m4x4Proj(fovDeg = 90, clipNear = 0.1, clipFar = 1000) { // FOV is full FOV in degrees
	let fovS = 1 / tan( fovDeg / 2 )
	return new mat4x4(fovS,0,0,0, 0,fovS,0,0, 0,0,-clipFar/(clipFar-clipNear),-1, 0,0,-(clipFar*clipNear)/(clipFar-clipNear),0);
}
