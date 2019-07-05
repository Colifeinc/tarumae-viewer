////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import "../math/matrix";
import "../math/bbox";

///////////////////// Vec2 //////////////////////

export class Vec2 {
	constructor() {
		this.set(...arguments);
	}
	
	set() {
		switch (arguments.length) {
			case 0:
				this.x = 0; this.y = 0;
				break;
			
			case 1:
				this.x = arguments[0].x; this.y = arguments[0].y;
				break;
			
			case 2:
				this.x = arguments[0]; this.y = arguments[1];
				break;
		}
	}

	scale(scaleX, scaleY) {
		this.x *= scaleX;
		this.y *= scaleY;
	}

	mul(sx, sy) {
		switch (arguments.length) {
			case 1:
				if (typeof sx === "object") {
					return new Vec2(this.x * sx.x, this.y * sx.y);
				} else {
					return new Vec2(this.x * sx, this.y * sx);
				}

			case 2:
				return new Vec2(this.x * sx, this.y * sy);
		}
	}

	mulMat(m) {
		return new Vec2(
			this.x * m.a1 + this.y * m.a2 + m.a3,
			this.x * m.b1 + this.y * m.b2 + m.b3);
	}

	neg() {
		return new Vec2(-this.x, -this.y);
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalize() {
		const delta = 1 / this.length();
		return new Vec2(this.x * delta, this.y * delta);
	}

	clone() {
		return new Vec2(this.x, this.y);
	}

	toArray() {
		return [this.x, this.y];
	}

	toFloat32Array() {
		return new Float32Array(this.toArray());
	}

	toString() {
		const toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;
		return "[" + toStringDigits(this.x) + ", " + (this.y) + "]";
	}

	add(v2) {
		return new Vec2(this.x + v2.x, this.y + v2.y);
	}

	static add(v1, v2) {
		return new Vec2(v1.x + v2.x, v1.y + v2.y);
	}

	sub(v2) {
		return new Vec2(this.x - v2.x, this.y - v2.y);
	}
		
	static sub(v1, v2) {
		return new Vec2(v1.x - v2.x, v1.y - v2.y);
	}

	dot(v2) {
		return this.x * v2.x + this.y * v2.y;
	}

	static dot(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y;
	}
}	

Vec2.zero = new Vec2(0, 0);
Vec2.one = new Vec2(1, 1);

///////////////////// Vec3 //////////////////////

export class Vec3 {
	constructor(x, y, z) {		
		if (typeof x === "undefined") {
			this.x = 0; this.y = 0; this.z = 0;
		} else {
			this.x = x; this.y = y; this.z = z;
		}
	}

	xy() {
		return new Vec2(this.x, this.y);
	}
	
	set(x, y, z) {
		this.x = x; this.y = y; this.z = z;
	}

	copyFrom(v) {
		this.x = v.x; this.y = v.y; this.z = v.z;
	}
	
	setToZero() {
		this.x = 0; this.y = 0; this.z = 0;
	}
	
	equals() {
		switch (arguments.length) {
			default:
				return false;
	
			case 1:
				var obj = arguments[0];
				return (typeof obj === "object")
					&& this.x == obj.x && this.y == obj.y && this.z == obj.z;
	
			case 3:
				return this.x == arguments[0] && this.y == arguments[1] && this.z == arguments[2];
		}
	}
	
	almostSame() {
		switch (arguments.length) {
			default:
				return false;
	
			case 1:
				var obj = arguments[0];
				return (typeof obj === "object")
					&& Math.abs(this.x - obj.x) < 0.00001 && Math.abs(this.y - obj.y) < 0.00001
					&& Math.abs(this.z - obj.z) < 0.00001;
	
			case 3:
				return Math.abs(this.x - arguments[0]) < 0.00001 && Math.abs(this.y - arguments[1]) < 0.00001
					&& Math.abs(this.z - arguments[2]) < 0.00001;
		}
	}
	
	mulMat(m) {
		return new Vec3(
			this.x * m.a1 + this.y * m.a2 + this.z * m.a3,
			this.x * m.b1 + this.y * m.b2 + this.z * m.b3,
			this.x * m.c1 + this.y * m.c2 + this.z * m.c3);
	}
	
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
	
	normalize() {
		var scalar = 1 / this.length();
		
		if (isFinite(scalar)) {
			return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
		} else {
			return new Vec3();
		}
	}
	
	add(v) {
		return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
	}
	
	sub(v) {
		return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
	}
	
	mul(scalar) {
		var x, y, z;
	
		if (isFinite(scalar)) {
			return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
		} else {
			return new Vec3();
		}
	}
	
	div(s) {
		var scalar = 1 / s;
	
		if (isFinite(scalar)) {
			return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
		} else {
			return new Vec3();
		}
	}
	
	cross(v) {
		return new Vec3(this.y * v.z - this.z * v.y,
			-(this.x * v.z - this.z * v.x),
			this.x * v.y - this.y * v.x);
	}
	
	dot(v) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}
	
	neg() {
		return new Vec3(-this.x, -this.y, -this.z);
	}
	
	abs() {
		return new Vec3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
	}
	
	lerp(v2, t) {
		return this.add((v2.sub(this)).mul(t));
	}
	
	static lerp(v1, v2, t) {
		return v1.lerp(v2, t);
	}
	
	fromEulers(e1, e2) {
		var v = Tarumae.MathFunctions.vectorFromEulerAngles(e1, e2);
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
	}
	
	offset(x, y, z) {
		switch (arguments.length) {
			case 1:
				if (typeof x === "object") {
					this.x += x.x;
					this.y += x.y;
					this.z += x.z;
				}
				break;
			
			case 3:
				this.x += x;
				this.y += y;
				this.z += z;
				break;
		}
	
		return this;
	}
	
	clone() {
		return new Vec3(this.x, this.y, this.z);
	}
	
	toArray() {
		return [this.x, this.y, this.z];
	}
	
	toArrayDigits(digits) {
		var roundDigits = Tarumae.Utility.NumberExtension.roundDigits;
		return [roundDigits(this.x, digits), roundDigits(this.y, digits), roundDigits(this.z, digits)];
	}
	
	toFloat32Array() {
		return new Float32Array(this.toArray());
	}
		
	toString() {
		var toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;
	
		return "[" + toStringDigits(this.x) + ", " + toStringDigits(this.y) + ", "
			+ toStringDigits(this.z) + "]";
	}

	static add(v1, v2) {
		return new Vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
	}

	static sub(v1, v2) {
		return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
	}

	static mul(v1, s) {
		return new Vec3(v1.x * s, v1.y * s, v1.z * s);
	}

	static div(v1, s) {
		return new Vec3(v1.x / s, v1.y / s, v1.z / s);
	}

	static neg(v1) {
		return new Vec3(-v1.x, -v1.y, -v1.z);
	}

	static dot(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
	}

	static cross(v1, v2) {
		return new Vec3(v1.y * v2.z - v1.z * v2.y,
			-(v1.x * v2.z - v1.z * v2.x),
			v1.x * v2.y - v1.y * v2.x);
	}

	static getLength(v) {
		return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
	}

	static normalize(v) {
		var scalar = 1 / Vec3.getLength(v);
	
		if (isFinite(scalar)) {
			return new Vec3(v.x * scalar, v.y * scalar, v.z * scalar);
		} else {
			return new Vec3();
		}
	}
}

Vec3.createFromEulers = (function() {
	var m;

	return function(ex, ey, ez) {
		
		// TODO: might be replaced by Quaternion	
		if (m === undefined) m = new Tarumae.Matrix4();
		m.loadIdentity().rotate(ex, ey, ez);
		
		return new Vec3(-m.a3, -m.b3, -m.c3);
	};
})();

Vec3.fromArray = function(arr) {
	return new Vec3(arr[0], arr[1], arr[2]);
};

// deparacted
Vec3.zero = new Vec3(0, 0, 0);
Vec3.one = new Vec3(1, 1, 1);
Vec3.up = new Vec3(0, 1, 0);
Vec3.down = new Vec3(0, -1, 0);
Vec3.left = new Vec3(-1, 0, 0);
Vec3.right = new Vec3(1, 0, 0);
Vec3.forward = new Vec3(0, 0, -1);
Vec3.back = new Vec3(0, 0, 1);

Vec3.Zero = new Vec3(0, 0, 0);
Vec3.One = new Vec3(1, 1, 1);
Vec3.Up = new Vec3(0, 1, 0);
Vec3.Down = new Vec3(0, -1, 0);
Vec3.Left = new Vec3(-1, 0, 0);
Vec3.Right = new Vec3(1, 0, 0);
Vec3.Forward = new Vec3(0, 0, -1);
Vec3.Back = new Vec3(0, 0, 1);

//////////////////// Vec4 //////////////////////

export function Vec4(x, y, z, w) {
	let obj;

	switch (arguments.length) {
		default:
			this.x = 0;
			this.y = 0;
			this.z = 0;
			this.w = 0;
			break;
			
		case 1:
			obj = arguments[0];
			
			if (typeof obj === "object") {
				if (obj instanceof Vec3) {
					this.x = obj.x;
					this.y = obj.y;
					this.z = obj.z;
					this.w = 1.0;
				} else if (obj instanceof Vec4) {
					this.x = obj.x;
					this.y = obj.y;
					this.z = obj.z;
					this.w = obj.w;
				}
			}
			break;

		case 2:
			obj = arguments[0];
			
			if (typeof obj === "object") {
				this.x = obj.x;
				this.y = obj.y;
				this.z = obj.z;
				this.w = arguments[1];
			}
			break;

		case 3:
			this.x = x; this.y = y; this.z = z; this.w = 1.0;
			break;

		case 4:
			this.x = x; this.y = y; this.z = z; this.w = w;
			break;
	}
}

Vec4.prototype.xyz = function () {
	return new Vec3(this.x, this.y, this.z);
};

Vec4.prototype.set = function(x, y, z, w) {
	this.x = x; this.y = y; this.z = z; this.w = w;
};

Vec4.prototype.equals = function() {
	switch (arguments.length) {
		default:
			return false;

		case 1:
			var obj = arguments[0];
			return (typeof obj === "object")
				&& this.x == obj.x && this.y == obj.y && this.z == obj.z && this.w == obj.w;

		case 4:
			return this.x == arguments[0] && this.y == arguments[1]
				&& this.z == arguments[2] && this.w == arguments[3];
	}
};

Vec4.prototype.almostSame = function() {
	switch (arguments.length) {
		default:
			return false;

		case 1:
			var obj = arguments[0];
			return (typeof obj === "object")
				&& Math.abs(this.x - obj.x) < 0.00001 && Math.abs(this.y - obj.y) < 0.00001
				&& Math.abs(this.z - obj.z) < 0.00001;

		case 3:
			return Math.abs(this.x - arguments[0]) < 0.00001 && Math.abs(this.y - arguments[1]) < 0.00001
				&& Math.abs(this.z - arguments[2]) < 0.00001;
	}
};

Vec4.prototype.add = function(v) {
	return new Vec4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
};

Vec4.prototype.sub = function(v) {
	return new Vec4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
};

Vec4.prototype.mul = function(s) {
	return new Vec4(this.x * s, this.y * s, this.z * s, this.w * s);
};

Vec4.prototype.div = function(s) {
	return new Vec4(this.x / s, this.y / s, this.z / s, this.w / s);
};

Vec4.prototype.mulMat = function(m) {
	return new Vec4(
		this.x * m.a1 + this.y * m.a2 + this.z * m.a3 + this.w * m.a4,
		this.x * m.b1 + this.y * m.b2 + this.z * m.b3 + this.w * m.b4,
		this.x * m.c1 + this.y * m.c2 + this.z * m.c3 + this.w * m.c4,
		this.x * m.d1 + this.y * m.d2 + this.z * m.d3 + this.w * m.d4);
};

Vec4.prototype.dot = function(v) {
	return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
};

Vec4.prototype.neg = function() {
	return new Vec4(-this.x, -this.y, -this.z, -this.w);
};

Vec4.prototype.length = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
};

Vec4.prototype.normalize = function () {
	var scalar = 1 / this.length();
	
	if (isFinite(scalar)) {
		return new Vec4(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
	} else {
		return new Vec4();
	}
};

Vec4.prototype.lerp = function(v2, t) {
	return this.add((v2.sub(this)).mul(t));
};

Vec4.lerp = function(v1, v2, t) {
	return v1.lerp(v2, t);
};

Vec4.prototype.clone = function() {
	return new Vec4(this.x, this.y, this.z, this.w);
};

Vec4.prototype.toArray = function() {
	return [this.x, this.y, this.z, this.w];
};

Vec4.prototype.toArrayDigits = function(digits) {
	var roundDigits = Tarumae.Utility.NumberExtension.roundDigits;
	return [roundDigits(this.x, digits), roundDigits(this.y, digits),
		roundDigits(this.z, digits), roundDigits(this.w, digits)];
};

/////////////////// Color3 ////////////////////

export class Color3 {
	constructor(r, g, b) {
		switch (arguments.length) {
			case 0:
				this.r = 0; this.g = 0; this.b = 0;
				break;
			
			case 1:
				if (typeof r === "number") {
					this.r = r; this.g = r; this.b = r;
				} else if (typeof r === "object") {
					this.r = r.r; this.g = r.g; this.b = r.b;
				}
				break;

			case 3:
				this.r = r; this.g = g; this.b = b;
				break;
		}
	}

	clone() {
		const c = new Color3();
		c.copyFrom(this);
		return c;
	}

	copyFrom(c) {
		this.r = c.r; this.g = c.g; this.b = c.b;
		return this;
	}

	add(c) {
		return new Color3(this.r + c.r, this.g + c.g, this.b + c.b);
	}
	
	sub(c) {
		return new Color3(this.r - c.r, this.g - c.g, this.b - c.b);
	}
	
	mul(s) {
		return new Color3(this.r * s, this.g * s, this.b * s);
	}
	
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
	
	normalize() {
		const scalar = 1 / this.length();
		
		if (isFinite(scalar)) {
			return new Color3(this.x * scalar, this.y * scalar, this.z * scalar);
		} else {
			return new Color3();
		}
	};
	
	lerp(v2, t) {
		return this.add((v2.sub(this)).mul(t));
	}
	
	static lerp(v1, v2, t) {
		return v1.lerp(v2, t);
	}
	
	toArray() {
		return [this.r, this.g, this.b];
	}
	
	toFloat32Array() {
		return new Float32Array(this.toArray());
	}
	
	toString() {
		var toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;
	
		return "[" + toStringDigits(this.r) + ", " + toStringDigits(this.g) + ", "
			+ toStringDigits(this.b) + "]";
	}

	static fromArray(arr) {
		return new Color3(arr[0], arr[1], arr[2]);
	}

	static randomly() {
		return new Color3(Math.random(), Math.random(), Math.random());
	};
	
	static randomlyLight() {
		return new Color3(0.3 + Math.random() * 0.7, 0.3 + Math.random() * 0.7, 0.3 + Math.random() * 0.7);
	};
	
	static randomlyDark() {
		return new Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
	};
}

Color3.white = new Color3(1.0, 1.0, 1.0);
Color3.silver = new Color3(0.7, 0.7, 0.7);
Color3.gray = new Color3(0.5, 0.5, 0.5);
Color3.dimgray = new Color3(0.3, 0.3, 0.3);
Color3.black = new Color3(0.0, 0.0, 0.0);
Color3.red = new Color3(1.0, 0.0, 0.0);
Color3.green = new Color3(0.0, 1.0, 0.0);
Color3.blue = new Color3(0.0, 0.0, 1.0);

/////////////////// Color4 ////////////////////

export function Color4(r, g, b, a) {
	switch (arguments.length) {
		default:
		case 0:
			this.r = 0; this.g = 0; this.b = 0; this.a = 0;
			break;
			
		case 1:
			if (typeof r === "object") {
				if (r instanceof Color3) {
					this.r = r.r;
					this.g = r.g;
					this.b = r.b;
					this.a = g;
				} else if (r instanceof Color4) {
					this.r = r.r;
					this.g = r.g;
					this.b = r.b;
					this.a = r.a;
				}
			} else if (typeof r === "number") {
				this.r = r;
				this.g = r;
				this.b = r;
				this.a = r;
			}
			break;

		case 3:
			this.r = r; this.g = g; this.b = b; this.a = 1;
			break;
			
		case 4:
			this.r = r; this.g = g; this.b = b; this.a = a;
			break;
	}
}

Color4.prototype.rgb = function () {
	return new Color3(this.r, this.g, this.b);
};

Color4.prototype.clone = function() {
	return new Color4(this.r, this.g, this.b, this.a);
};

Color4.prototype.add = function(c) {
	return new Color4(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a);
};

Color4.prototype.sub = function(c) {
	return new Color4(this.r - c.r, this.g - c.g, this.b - c.b, this.a - c.a);
};

Color4.prototype.mul = function(s) {
	return new Color4(this.r * s, this.g * s, this.b * s, this.a * s);
};

Color4.prototype.lerp = function(c2, t) {
	return this.add((c2.sub(this)).mul(t));
};

Color4.lerp = function(c1, c2, t) {
	return c1.lerp(c2, t);
};

Color4.prototype.toArray = function() {
	return [this.r, this.g, this.b, this.a];
};

Color4.prototype.toFloat32Array = function() {
	return new Float32Array(this.toArray());
};

Color4.white = new Color4(Color3.white, 1.0);
Color4.black = new Color4(Color3.black, 1.0);

////////// Quaternion //////////

Tarumae.Quaternion = class {
	constructor() {
		throw "not available yet";
	}
};

////////// Ray //////////

Tarumae.Ray = class {
	constructor(origin, dir) {
		if (typeof origin === "undefined") {
			this.origin = new Vec3();
			this.dir = new Vec3();
		} else {
			this.origin = origin;
			this.dir = dir;
		}
	}
};

Tarumae.Ray.MaxDistance = Infinity;

////////// Point BPNode //////////

Tarumae.PointBPNode = class {
	constructor(inputPoints) {
		this.points = [];

		if (Array.isArray(inputPoints)) {
			if (inputPoints.length > 5) {
				this.build(inputPoints);
			} else {
				this.points.concat(inputPoints);
			}
		}	
	}

	build(points) {
		var bbox = Tarumae.BoundingBox.fromPoints(points);
		
		var lbox = new Tarumae.BoundingBox(), rbox = new Tarumae.BoundingBox();
		var lpoints = new Array(), rpoints = new Array();

		var ns = bbox.size.normalize();
		if (ns.x > ns.y && ns.x > ns.z) {
			lbox.min.set(bbox.min.x, bbox.min.y, bbox.min.z);
			lbox.max.set(bbox.min.x + bbox.size.x * 0.5, bbox.max.y, bbox.max.z);

			rbox.min.set(bbox.min.x + bbox.size.x * 0.5, bbox.min.y, bbox.min.z);
			rbox.max.set(bbox.max.x, bbox.max.y, bbox.max.z);
		} else if (ns.y > ns.x && ns.y > ns.z) {
			lbox.min.set(bbox.min.x, bbox.min.y, bbox.min.z);
			lbox.max.set(bbox.min.x, bbox.min.y + bbox.size.y * 0.5, bbox.min.z);

			rbox.min.set(bbox.min.x, bbox.min.y + bbox.size.y * 0.5, bbox.min.z);
			rbox.max.set(bbox.max.x, bbox.max.y, bbox.max.z);
		} else {
			lbox.min.set(bbox.min.x, bbox.min.y, bbox.min.z);
			lbox.max.set(bbox.min.x, bbox.min.y, bbox.min.z + bbox.size.z * 0.5);

			rbox.min.set(bbox.min.x, bbox.min.y, bbox.min.z + bbox.size.z * 0.5);
			rbox.max.set(bbox.max.x, bbox.max.y, bbox.max.z);
		}

		for (let i = 0; i < points.length; i++) {
			var p = points[i];

			if (lbox.contains(p)) {
				lpoints.push(p);
			}

			if (rbox.contains(p)) {
				rpoints.push(p);
			}
		}

		if (lpoints.length > 0) {
			this.left = new Tarumae.PointBPNode(lpoints);
		}
		
		if (rpoints.length > 0) {
			this.right = new Tarumae.PointBPNode(rpoints);
		}	
	}

	contains(p) {
		if (this.points._t_contains(p)) {
			return true;
		}

		if (this.left && this.left.contains(p)) {
			return true;
		}

		if (this.right && this.right.cotains(p)) {
			return true;
		}

		return false;
	}
};

/////////////////////// 2D Shapes /////////////////////

