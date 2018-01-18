////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"
import { vec3 } from "./vector"
import "./functions"

///////////////////// Matrix3 //////////////////////

Tarumae.Matrix3 = class {
	constructor(copySource) {
		if (copySource) {
			this.copyFrom(copySource);
		}
	}

	loadIdentity() {
		this.a1 = 1.0; this.b1 = 0.0; this.c1 = 0.0;
		this.a2 = 0.0; this.b2 = 1.0; this.c2 = 0.0;
		this.a3 = 0.0; this.b3 = 0.0; this.c3 = 1.0;

		return this;
	}

	copyFrom(m) {
		this.a1 = m.a1; this.b1 = m.b1; this.c1 = m.c1;
		this.a2 = m.a2; this.b2 = m.b2; this.c2 = m.c2;
		this.a3 = m.a3; this.b3 = m.b3; this.c3 = m.c3;

		return this;
	}

	rotate(angle) {
		if (angle === 0) return this;

		var d = angle * Math.PI / 180;

		var sin = Math.sin(d);
		var cos = Math.cos(d);

		var m2a1 = cos, m2b1 = sin;
		var m2a2 = -sin, m2b2 = cos;

		var a1 = this.a1 * m2a1 + this.a2 * m2b1;
		var b1 = this.b1 * m2a1 + this.b2 * m2b1;
		var c1 = this.c1 * m2a1 + this.c2 * m2b1;

		var a2 = this.a1 * m2a2 + this.a2 * m2b2;
		var b2 = this.b1 * m2a2 + this.b2 * m2b2;
		var c2 = this.c1 * m2a2 + this.c2 * m2b2;

		this.a1 = a1; this.b1 = b1; this.c1 = c1;
		this.a2 = a2; this.b2 = b2; this.c2 = c2;

		return this;
	}

	translate(x, y) {
		this.a3 += this.a1 * x + this.a2 * y;
		this.b3 += this.b1 * x + this.b2 * y;
		this.c3 += this.c1 * x + this.c2 * y;

		return this;
	}

	scale(x, y) {
		if (x === 1 && y === 1) return this;
	
		this.a1 *= x; this.b1 *= x; this.c1 *= x;
		this.a2 *= y; this.b2 *= y; this.c2 *= y;

		return this;
	}

	transpose() {
		var a2 = this.b1;
		var a3 = this.c1;
		var b1 = this.a2;
		var b3 = this.c2;
		var c1 = this.a3;
		var c2 = this.b3;

		this.b1 = b1; this.c1 = c1;
		this.a2 = a2; this.c2 = c2;
		this.a3 = a3; this.b3 = b3;

		return this;
	}

	mul(m2) {
		var m1 = this;
		var m3 = new Tarumae.Matrix3();

		m3.a1 = m1.a1 * m2.a1 + m1.b1 * m2.a2 + m1.c1 * m2.a3;
		m3.b1 = m1.a1 * m2.b1 + m1.b1 * m2.b2 + m1.c1 * m2.b3;
		m3.c1 = m1.a1 * m2.c1 + m1.b1 * m2.c2 + m1.c1 * m2.c3;

		m3.a2 = m1.a2 * m2.a1 + m1.b2 * m2.a2 + m1.c2 * m2.a3;
		m3.b2 = m1.a2 * m2.b1 + m1.b2 * m2.b2 + m1.c2 * m2.b3;
		m3.c2 = m1.a2 * m2.c1 + m1.b2 * m2.c2 + m1.c2 * m2.c3;

		m3.a3 = m1.a3 * m2.a1 + m1.b3 * m2.a2 + m1.c3 * m2.a3;
		m3.b3 = m1.a3 * m2.b1 + m1.b3 * m2.b2 + m1.c3 * m2.b3;
		m3.c3 = m1.a3 * m2.c1 + m1.b3 * m2.c2 + m1.c3 * m2.c3;

		return m3;
	}

	extractEulerAngles(order) {
		return Tarumae.MathFunctions.getEulerAnglesFromMatrix(this, order);
	}

	mulInv(m1) {
		var m2 = this;
		var m3 = new Tarumae.Matrix3();

		m3.a1 = m1.a1 * m2.a1 + m1.a2 * m2.b1 + m1.a3 * m2.c1;
		m3.b1 = m1.b1 * m2.a1 + m1.b2 * m2.b1 + m1.b3 * m2.c1;
		m3.c1 = m1.c1 * m2.a1 + m1.c2 * m2.b1 + m1.c3 * m2.c1;

		m3.a2 = m1.a1 * m2.a2 + m1.a2 * m2.b2 + m1.a3 * m2.c2;
		m3.b2 = m1.b1 * m2.a2 + m1.b2 * m2.b2 + m1.b3 * m2.c2;
		m3.c2 = m1.c1 * m2.a2 + m1.c2 * m2.b2 + m1.c3 * m2.c2;

		m3.a3 = m1.a1 * m2.a3 + m1.a2 * m2.b3 + m1.a3 * m2.c3;
		m3.b3 = m1.b1 * m2.a3 + m1.b2 * m2.b3 + m1.b3 * m2.c3;
		m3.c3 = m1.c1 * m2.a3 + m1.c2 * m2.b3 + m1.c3 * m2.c3;
	
		return m3;
	}

	equals(m2) {
		return this.a1 == m2.a1 && this.b1 == m2.b1 && this.c1 == m2.c1
			&& this.a2 == m2.a2 && this.b2 == m2.b2 && this.c2 == m2.c2
			&& this.a3 == m2.a3 && this.b3 == m2.b3 && this.c3 == m2.c3;
	}

	toArray() {
		return [
			this.a1, this.b1, this.c1,
			this.a2, this.b2, this.c2,
			this.a3, this.b3, this.c3,
		];
	}

	toFloat32Array() {
		return new Float32Array(this.toArray());
	}

	clone() {
		return new Tarumae.Matrix3(this);
	}
}

///////////////////// Matrix4 //////////////////////

Tarumae.Matrix4 = class {
	constructor(copySource) {
		if (copySource) {
			this.copyFrom(copySource);
		}

		return this;
	}
	
	loadIdentity() {
		this.a1 = 1.0; this.b1 = 0.0; this.c1 = 0.0; this.d1 = 0.0;
		this.a2 = 0.0; this.b2 = 1.0; this.c2 = 0.0; this.d2 = 0.0;
		this.a3 = 0.0; this.b3 = 0.0; this.c3 = 1.0; this.d3 = 0.0;
		this.a4 = 0.0; this.b4 = 0.0; this.c4 = 0.0; this.d4 = 1.0;

		return this;
	}

	copyFrom(m) {
		this.a1 = m.a1; this.b1 = m.b1; this.c1 = m.c1; this.d1 = m.d1;
		this.a2 = m.a2; this.b2 = m.b2; this.c2 = m.c2; this.d2 = m.d2;
		this.a3 = m.a3; this.b3 = m.b3; this.c3 = m.c3; this.d3 = m.d3;
		this.a4 = m.a4; this.b4 = m.b4; this.c4 = m.c4; this.d4 = m.d4;

		return this;
	}
	
	/*
	 * Makes a rotation matrix by given euler angles and multiplies by this matrix.
	 */
	rotate(x, y, z, order) {

		// TODO: handle the 'order' parameter

		switch (arguments.length) {
			case 1:
				if (typeof x === "object" && x instanceof vec3) {
					this.rotateX(x.x);
					this.rotateY(x.y);
					this.rotateZ(x.z);
				}
				break;

			case 3:
				if (y !== undefined && z !== undefined) {
					this.rotateX(x);
					this.rotateY(y);
					this.rotateZ(z);
				}
				break;
		}

		// TODO: Need to be optimized by combining Rx Ry Rz calculation
		// this.rotateCombine(x, y, z);
	
		return this;
	}

	rotateX(angle) {
		if (angle === 0) return this;

		var d = Tarumae.MathFunctions.angleToDegree(angle);

		var sin = Math.sin(d);
		var cos = Math.cos(d);

		var m2b2 = cos, m2c2 = sin;
		var m2b3 = -sin, m2c3 = cos;

		var a2 = this.a2 * m2b2 + this.a3 * m2c2;
		var b2 = this.b2 * m2b2 + this.b3 * m2c2;
		var c2 = this.c2 * m2b2 + this.c3 * m2c2;
		var d2 = this.d2 * m2b2 + this.d3 * m2c2;

		var a3 = this.a2 * m2b3 + this.a3 * m2c3;
		var b3 = this.b2 * m2b3 + this.b3 * m2c3;
		var c3 = this.c2 * m2b3 + this.c3 * m2c3;
		var d3 = this.d2 * m2b3 + this.d3 * m2c3;

		this.a2 = a2; this.b2 = b2; this.c2 = c2; this.d2 = d2;
		this.a3 = a3; this.b3 = b3; this.c3 = c3; this.d3 = d3;

		return this;
	}

	rotateY(angle) {
		if (angle === 0) return this;

		var d = Tarumae.MathFunctions.angleToDegree(angle);

		var sin = Math.sin(d);
		var cos = Math.cos(d);

		var m2a1 = cos, m2c1 = -sin;
		var m2a3 = sin, m2c3 = cos;

		var a1 = this.a1 * m2a1 + this.a3 * m2c1;
		var b1 = this.b1 * m2a1 + this.b3 * m2c1;
		var c1 = this.c1 * m2a1 + this.c3 * m2c1;
		var d1 = this.d1 * m2a1 + this.d3 * m2c1;

		var a3 = this.a1 * m2a3 + this.a3 * m2c3;
		var b3 = this.b1 * m2a3 + this.b3 * m2c3;
		var c3 = this.c1 * m2a3 + this.c3 * m2c3;
		var d3 = this.d1 * m2a3 + this.d3 * m2c3;

		this.a1 = a1; this.b1 = b1; this.c1 = c1; this.d1 = d1;
		this.a3 = a3; this.b3 = b3; this.c3 = c3; this.d3 = d3;

		return this;
	}

	rotateZ(angle) {
		if (angle === 0) return this;

		var d = Tarumae.MathFunctions.angleToDegree(angle);

		var sin = Math.sin(d);
		var cos = Math.cos(d);

		var m2a1 = cos, m2b1 = sin;
		var m2a2 = -sin, m2b2 = cos;

		var a1 = this.a1 * m2a1 + this.a2 * m2b1;
		var b1 = this.b1 * m2a1 + this.b2 * m2b1;
		var c1 = this.c1 * m2a1 + this.c2 * m2b1;
		var d1 = this.d1 * m2a1 + this.d2 * m2b1;

		var a2 = this.a1 * m2a2 + this.a2 * m2b2;
		var b2 = this.b1 * m2a2 + this.b2 * m2b2;
		var c2 = this.c1 * m2a2 + this.c2 * m2b2;
		var d2 = this.d1 * m2a2 + this.d2 * m2b2;

		this.a1 = a1; this.b1 = b1; this.c1 = c1; this.d1 = d1;
		this.a2 = a2; this.b2 = b2; this.c2 = c2; this.d2 = d2;
	
		return this;
	}

	rotateCombine(x, y, z) {
		x = Tarumae.MathFunctions.angleToDegree(x);
		y = Tarumae.MathFunctions.angleToDegree(y);
		z = Tarumae.MathFunctions.angleToDegree(z);

		var
			sinX = Math.sin(x), sinY = Math.sin(y), sinZ = Math.sin(z),
			cosX = Math.cos(x), cosY = Math.cos(y), cosZ = Math.cos(z),

			m2a1 = cosY * cosZ, m2b1 = cosY * sinZ, m2c1 = -sinY,
			m2a2 = sinX * sinY * cosZ, m2b2 = -cosX * sinZ, m2c2 = sinX * sinY,
			m2a3 = cosX * sinY * cosZ + sinX * sinZ, m2b3 = cosX * sinY * sinZ - sinX * cosZ, m2c3 = cosX * cosY;
	
		var m1 = this;

		var a1 = m1.a1 * m2a1 + m1.a2 * m2b1 + m1.a3 * m2c1;
		var a2 = m1.a1 * m2a2 + m1.a2 * m2b2 + m1.a3 * m2c2;
		var a3 = m1.a1 * m2a3 + m1.a2 * m2b3 + m1.a3 * m2c3;

		var b1 = m1.b1 * m2a1 + m1.b2 * m2b1 + m1.b3 * m2c1;
		var b2 = m1.b1 * m2a2 + m1.b2 * m2b2 + m1.b3 * m2c2;
		var b3 = m1.b1 * m2a3 + m1.b2 * m2b3 + m1.b3 * m2c3;

		var c1 = m1.c1 * m2a1 + m1.c2 * m2b1 + m1.c3 * m2c1;
		var c2 = m1.c1 * m2a2 + m1.c2 * m2b2 + m1.c3 * m2c2;
		var c3 = m1.c1 * m2a3 + m1.c2 * m2b3 + m1.c3 * m2c3;

		var d1 = m1.d1 * m2a1 + m1.d2 * m2b1 + m1.d3 * m2c1;
		var d2 = m1.d1 * m2a2 + m1.d2 * m2b2 + m1.d3 * m2c2;
		var d3 = m1.d1 * m2a3 + m1.d2 * m2b3 + m1.d3 * m2c3;

		this.a1 = a1; this.b1 = b1; this.c1 = c1; this.d1 = d1;
		this.a2 = a2; this.b2 = b2; this.c2 = c2; this.d2 = d2;
		this.a3 = a3; this.b3 = b3; this.c3 = c3; this.d3 = d3;

		return this;
	}

	translate(x, y, z) {
		this.a4 += this.a1 * x + this.a2 * y + this.a3 * z;
		this.b4 += this.b1 * x + this.b2 * y + this.b3 * z;
		this.c4 += this.c1 * x + this.c2 * y + this.c3 * z;
		this.d4 += this.d1 * x + this.d2 * y + this.d3 * z;

		return this;
	}

	translateZ(z) {
		this.a4 += this.a3 * z;
		this.b4 += this.b3 * z;
		this.c4 += this.c3 * z;
		this.d4 += this.d3 * z;

		return this;
	}

	scale(x, y, z) {
		if (x == 1 && y == 1 && z == 1) return this;
	
		this.a1 *= x; this.b1 *= x; this.c1 *= x; this.d1 *= x;
		this.a2 *= y; this.b2 *= y; this.c2 *= y; this.d2 *= y;
		this.a3 *= z; this.b3 *= z; this.c3 *= z; this.d3 *= z;

		return this;
	}

	canInverse() {
		var
			a = this.a1, b = this.b1, c = this.c1, d = this.d1,
			e = this.a2, f = this.b2, g = this.c2, h = this.d2,
			i = this.a3, j = this.b3, k = this.c3, l = this.d3,
			m = this.a4, n = this.b4, o = this.c4, p = this.d4;

		var q = f * k * p + j * o * h + n * g * l
			- f * l * o - g * j * p - h * k * n;

		var r = e * k * p + i * o * h + m * g * l
			- e * l * o - g * i * p - h * k * m;

		var s = e * j * p + i * n * h + m * f * l
			- e * l * n - f * i * p - h * j * m;

		var t = e * j * o + i * n * g + m * f * k
			- e * k * n - f * i * o - g * j * m;

		var delta = (a * q - b * r + c * s - d * t);

		return (delta !== 0);
	}

	inverse() {
		var
			a = this.a1, b = this.b1, c = this.c1, d = this.d1,
			e = this.a2, f = this.b2, g = this.c2, h = this.d2,
			i = this.a3, j = this.b3, k = this.c3, l = this.d3,
			m = this.a4, n = this.b4, o = this.c4, p = this.d4;

		var q = f * k * p + j * o * h + n * g * l
			- f * l * o - g * j * p - h * k * n;

		var r = e * k * p + i * o * h + m * g * l
			- e * l * o - g * i * p - h * k * m;

		var s = e * j * p + i * n * h + m * f * l
			- e * l * n - f * i * p - h * j * m;

		var t = e * j * o + i * n * g + m * f * k
			- e * k * n - f * i * o - g * j * m;

		var delta = (a * q - b * r + c * s - d * t);

		if (delta === 0) return this;

		var detM = 1 / delta;

		// adj
		var m2a1 = q, m2b1 = r, m2c1 = s, m2d1 = t;
		var m2a2 = b * k * p + j * o * d + n * c * l - b * l * o - c * j * p - d * k * n;
		var m2b2 = a * k * p + i * o * d + m * c * l - a * l * o - c * i * p - d * k * m;
		var m2c2 = a * j * p + i * n * d + m * b * l - a * l * n - b * i * p - d * j * m;
		var m2d2 = a * j * o + i * n * c + m * b * k - a * k * n - b * i * o - c * j * m;
		var m2a3 = b * g * p + f * o * d + n * c * h - b * h * o - c * f * p - d * g * n;
		var m2b3 = a * g * p + e * o * d + m * c * h - a * h * o - c * e * p - d * g * m;
		var m2c3 = a * f * p + e * n * d + m * b * h - a * h * n - b * e * p - d * f * m;
		var m2d3 = a * f * o + e * n * c + m * b * g - a * g * n - b * e * o - c * f * m;
		var m2a4 = b * g * l + f * k * d + j * c * h - b * h * k - c * f * l - d * g * j;
		var m2b4 = a * g * l + e * k * d + i * c * h - a * h * k - c * e * l - d * g * i;
		var m2c4 = a * f * l + e * j * d + i * b * h - a * h * j - b * e * l - d * f * i;
		var m2d4 = a * f * k + e * j * c + i * b * g - a * g * j - b * e * k - c * f * i;

		m2b1 = -m2b1; m2d1 = -m2d1;
		m2a2 = -m2a2; m2c2 = -m2c2;
		m2b3 = -m2b3; m2d3 = -m2d3;
		m2a4 = -m2a4; m2c4 = -m2c4;

		// transpose
		var m3a1 = m2a1, m3b1 = m2a2, m3c1 = m2a3, m3d1 = m2a4;
		var m3a2 = m2b1, m3b2 = m2b2, m3c2 = m2b3, m3d2 = m2b4;
		var m3a3 = m2c1, m3b3 = m2c2, m3c3 = m2c3, m3d3 = m2c4;
		var m3a4 = m2d1, m3b4 = m2d2, m3c4 = m2d3, m3d4 = m2d4;

		this.a1 = m3a1 * detM; this.b1 = m3b1 * detM; this.c1 = m3c1 * detM; this.d1 = m3d1 * detM;
		this.a2 = m3a2 * detM; this.b2 = m3b2 * detM; this.c2 = m3c2 * detM; this.d2 = m3d2 * detM;
		this.a3 = m3a3 * detM; this.b3 = m3b3 * detM; this.c3 = m3c3 * detM; this.d3 = m3d3 * detM;
		this.a4 = m3a4 * detM; this.b4 = m3b4 * detM; this.c4 = m3c4 * detM; this.d4 = m3d4 * detM;

		return this;
	}

	transpose() {
		var a2 = this.b1;
		var a3 = this.c1;
		var a4 = this.d1;

		var b1 = this.a2;
		var b3 = this.c2;
		var b4 = this.d2;

		var c1 = this.a3;
		var c2 = this.b3;
		var c4 = this.d3;

		var d1 = this.a4;
		var d2 = this.b4;
		var d3 = this.c4;

		this.b1 = b1; this.c1 = c1; this.d1 = d1;
		this.a2 = a2; this.c2 = c2; this.d2 = d2;
		this.a3 = a3; this.b3 = b3; this.d3 = d3;
		this.a4 = a4; this.b4 = b4; this.c4 = c4;

		return this;
	}

	mul(m2) {
		var m1 = this;
		var m3 = new Tarumae.Matrix4();

		m3.a1 = m1.a1 * m2.a1 + m1.b1 * m2.a2 + m1.c1 * m2.a3 + m1.d1 * m2.a4;
		m3.a2 = m1.a2 * m2.a1 + m1.b2 * m2.a2 + m1.c2 * m2.a3 + m1.d2 * m2.a4;
		m3.a3 = m1.a3 * m2.a1 + m1.b3 * m2.a2 + m1.c3 * m2.a3 + m1.d3 * m2.a4;
		m3.a4 = m1.a4 * m2.a1 + m1.b4 * m2.a2 + m1.c4 * m2.a3 + m1.d4 * m2.a4;

		m3.b1 = m1.a1 * m2.b1 + m1.b1 * m2.b2 + m1.c1 * m2.b3 + m1.d1 * m2.b4;
		m3.b2 = m1.a2 * m2.b1 + m1.b2 * m2.b2 + m1.c2 * m2.b3 + m1.d2 * m2.b4;
		m3.b3 = m1.a3 * m2.b1 + m1.b3 * m2.b2 + m1.c3 * m2.b3 + m1.d3 * m2.b4;
		m3.b4 = m1.a4 * m2.b1 + m1.b4 * m2.b2 + m1.c4 * m2.b3 + m1.d4 * m2.b4;

		m3.c1 = m1.a1 * m2.c1 + m1.b1 * m2.c2 + m1.c1 * m2.c3 + m1.d1 * m2.c4;
		m3.c2 = m1.a2 * m2.c1 + m1.b2 * m2.c2 + m1.c2 * m2.c3 + m1.d2 * m2.c4;
		m3.c3 = m1.a3 * m2.c1 + m1.b3 * m2.c2 + m1.c3 * m2.c3 + m1.d3 * m2.c4;
		m3.c4 = m1.a4 * m2.c1 + m1.b4 * m2.c2 + m1.c4 * m2.c3 + m1.d4 * m2.c4;

		m3.d1 = m1.a1 * m2.d1 + m1.b1 * m2.d2 + m1.c1 * m2.d3 + m1.d1 * m2.d4;
		m3.d2 = m1.a2 * m2.d1 + m1.b2 * m2.d2 + m1.c2 * m2.d3 + m1.d2 * m2.d4;
		m3.d3 = m1.a3 * m2.d1 + m1.b3 * m2.d2 + m1.c3 * m2.d3 + m1.d3 * m2.d4;
		m3.d4 = m1.a4 * m2.d1 + m1.b4 * m2.d2 + m1.c4 * m2.d3 + m1.d4 * m2.d4;

		return m3;
	}

	mulInv(m1) {
		var m2 = this;
		var m3 = new Tarumae.Matrix4();

		m3.a1 = m1.a1 * m2.a1 + m1.a2 * m2.b1 + m1.a3 * m2.c1 + m1.a4 * m2.d1;
		m3.a2 = m1.a1 * m2.a2 + m1.a2 * m2.b2 + m1.a3 * m2.c2 + m1.a4 * m2.d2;
		m3.a3 = m1.a1 * m2.a3 + m1.a2 * m2.b3 + m1.a3 * m2.c3 + m1.a4 * m2.d3;
		m3.a4 = m1.a1 * m2.a4 + m1.a2 * m2.b4 + m1.a3 * m2.c4 + m1.a4 * m2.d4;

		m3.b1 = m1.b1 * m2.a1 + m1.b2 * m2.b1 + m1.b3 * m2.c1 + m1.b4 * m2.d1;
		m3.b2 = m1.b1 * m2.a2 + m1.b2 * m2.b2 + m1.b3 * m2.c2 + m1.b4 * m2.d2;
		m3.b3 = m1.b1 * m2.a3 + m1.b2 * m2.b3 + m1.b3 * m2.c3 + m1.b4 * m2.d3;
		m3.b4 = m1.b1 * m2.a4 + m1.b2 * m2.b4 + m1.b3 * m2.c4 + m1.b4 * m2.d4;

		m3.c1 = m1.c1 * m2.a1 + m1.c2 * m2.b1 + m1.c3 * m2.c1 + m1.c4 * m2.d1;
		m3.c2 = m1.c1 * m2.a2 + m1.c2 * m2.b2 + m1.c3 * m2.c2 + m1.c4 * m2.d2;
		m3.c3 = m1.c1 * m2.a3 + m1.c2 * m2.b3 + m1.c3 * m2.c3 + m1.c4 * m2.d3;
		m3.c4 = m1.c1 * m2.a4 + m1.c2 * m2.b4 + m1.c3 * m2.c4 + m1.c4 * m2.d4;

		m3.d1 = m1.d1 * m2.a1 + m1.d2 * m2.b1 + m1.d3 * m2.c1 + m1.d4 * m2.d1;
		m3.d2 = m1.d1 * m2.a2 + m1.d2 * m2.b2 + m1.d3 * m2.c2 + m1.d4 * m2.d2;
		m3.d3 = m1.d1 * m2.a3 + m1.d2 * m2.b3 + m1.d3 * m2.c3 + m1.d4 * m2.d3;
		m3.d4 = m1.d1 * m2.a4 + m1.d2 * m2.b4 + m1.d3 * m2.c4 + m1.d4 * m2.d4;
	
		return m3;
	}

	equals(m2) {
		return this.a1 == m2.a1 && this.b1 == m2.b1 && this.c1 == m2.c1 && this.d1 == m2.d1
			&& this.a2 == m2.a2 && this.b2 == m2.b2 && this.c2 == m2.c2 && this.d2 == m2.d2
			&& this.a3 == m2.a3 && this.b3 == m2.b3 && this.c3 == m2.c3 && this.d3 == m2.d3
			&& this.a4 == m2.a4 && this.b4 == m2.b4 && this.c4 == m2.c4 && this.d4 == m2.d4;
	}

	frustum(left, right, top, bottom, near, far) {
		var x = right - left, y = bottom - top, z = far - near;

		this.a1 = near * 2 / x; this.b1 = 0; this.c1 = 0; this.d1 = 0;
		this.a2 = 0; this.b2 = near * 2 / y; this.c2 = 0; this.d2 = 0;
		this.a3 = (right + left) / x; this.b3 = (bottom + top) / y; this.c3 = -(far + near) / z; this.d3 = -1;
		this.a4 = 0; this.b4 = 0; this.c4 = -(far * near * 2) / z; this.d4 = 0;

		return this;
	}

	perspective(angle, widthRate, near, far) {
		var topRate = near * Math.tan(angle * Math.PI / 360);
		widthRate = topRate * widthRate;
		this.frustum(-widthRate, widthRate, -topRate, topRate, near, far);

		return this;
	}

	ortho(left, right, bottom, top, near, far) {
		var x = right - left, y = top - bottom, z = far - near;

		this.a1 = 2 / x; this.b1 = 0; this.c1 = 0; this.d1 = 0;
		this.a2 = 0; this.b2 = 2 / y; this.c2 = 0; this.d2 = 0;
		this.a3 = 0; this.b3 = 0; this.c3 = -2 / z; this.d3 = 0;

		this.a4 = -(left + right) / x;
		this.b4 = -(top + bottom) / y;
		this.c4 = -(far + near) / z;
		this.d4 = 1;

		return this;
	}

	/*
	 * Make a lookat matrix. This method does not require an identity matrix.
	 */
	lookAt(eye, target, up) {
		var zaxis = vec3.sub(eye, target).normalize();    // forward
		var xaxis = vec3.cross(up, zaxis).normalize();    // right
		var yaxis = vec3.cross(zaxis, xaxis);             // up

		this.a1 = xaxis.x; this.b1 = yaxis.x; this.c1 = zaxis.x; this.d1 = 0;
		this.a2 = xaxis.y; this.b2 = yaxis.y; this.c2 = zaxis.y; this.d2 = 0;
		this.a3 = xaxis.z; this.b3 = yaxis.z; this.c3 = zaxis.z; this.d3 = 0;

		// this.a4 = -xaxis.dot(eye); this.b4 = -yaxis.dot(eye); this.c4 = -zaxis.dot(eye); this.d4 = 1;
	
		// maybe we can ignore the row 4 like below to get more better performance
		this.a4 = 0; this.b4 = 0; this.c4 = 0; this.d4 = 1;

		return this;
	}

	extractEulerAngles() {
		var
			m11 = this.a1, m12 = this.b1, m13 = this.c1,
			m21 = this.a2, m22 = this.b2, m23 = this.c2,
			m31 = this.a3, m32 = this.b3, m33 = this.c3;
	
		var x, y, z;
	
		if (m21 > 0.99999 || m21 < -0.99999) {
			x = 0;
			y = Math.atan2(m13, m33);
			z = -Math.PI / 2;
		} else {
			x = Math.atan2(m23, m22);
			y = Math.atan2(m31, m11);
			z = Math.asin(-m21);
		}

		return new vec3(Tarumae.MathFunctions.degreeToAngle(x),
			Tarumae.MathFunctions.degreeToAngle(y),
			Tarumae.MathFunctions.degreeToAngle(z));
	}

	extractLookAtVectors() {
		return {
			dir: new vec3(this.c1, this.c2, -this.c3).normalize(),
			up: new vec3(this.b1, this.b2, -this.b3).normalize()
		};
	}

	toArray() {
		return [
			this.a1, this.b1, this.c1, this.d1,
			this.a2, this.b2, this.c2, this.d2,
			this.a3, this.b3, this.c3, this.d3,
			this.a4, this.b4, this.c4, this.d4
		];
	}

	toFloat32Array() {
		return new Float32Array(this.toArray());
	}
}