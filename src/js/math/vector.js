////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

///////////////////// vec2 //////////////////////

function vec2(x, y) {
	if (typeof x === "undefined") {
		this.x = 0; this.y = 0;
	}
	else {
		this.x = x; this.y = y;
	}	
}

vec2.prototype.scale = function(scaleX, scaleY) {
	this.x *= scaleX;
	this.y *= scaleY;
};

vec2.prototype.mul = function(sx, sy) {
	switch (arguments.length) {
		case 1:
			if (typeof sx === "object") {
				return new vec2(this.x * sx.x, this.y * sx.y);
			} else {
				return new vec2(this.x * sx, this.y * sx);
			}
				
		case 2:
			return new vec2(this.x * sx, this.y * sy);
	}
};

vec2.prototype.neg = function() {
	return new vec2(-this.x, -this.y);
};

vec2.prototype.length = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

vec2.prototype.normalize = function() {
	var delta = 1 / this.length();
	return new vec2(this.x * delta, this.y * delta);
};

vec2.prototype.clone = function() {
	return new vec2(this.x, this.y);
};

vec2.prototype.toArray = function() {
	return [this.x, this.y];
};

vec2.prototype.toFloat32Array = function() {
	return new Float32Array(this.toArray());
};

vec2.prototype.toString = function() {
	var toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;
	return "[" + toStringDigits(this.x) + ", " + (this.y) + "]";
};

vec2.add = function(v1, v2) {
	return new vec2(v1.x + v2.x, v1.y + v2.y);
};

vec2.sub = function(v1, v2) {
	return new vec2(v1.x - v2.x, v1.y - v2.y);
};

vec2.dot = function(v1, v2) {
	return v1.x * v2.x + v1.y * v2.y;
};

///////////////////// vec3 //////////////////////

function vec3(x, y, z) {
	if (typeof x === "undefined") {
		this.x = 0; this.y = 0; this.z = 0;
	} else {
		this.x = x; this.y = y; this.z = z;
	}
}

vec3.prototype.xy = function() {
	return new vec2(this.x, this.y);	
};

vec3.prototype.set = function(x, y, z) {
	this.x = x; this.y = y; this.z = z;
};

vec3.prototype.setToZero = function() {
	this.x = 0; this.y = 0; this.z = 0;
};

vec3.prototype.equals = function() {
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
};

vec3.prototype.almostSame = function() {
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

vec3.prototype.toString = function() {
	var toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;

	return "[" + toStringDigits(this.x) + ", " + toStringDigits(this.y) + ", "
		+ toStringDigits(this.z) + "]";
};

vec3.prototype.mulMat = function (m) {
	return new vec3(
		this.x * m.a1 + this.y * m.a2 + this.z * m.a3,
		this.x * m.b1 + this.y * m.b2 + this.z * m.b3,
		this.x * m.c1 + this.y * m.c2 + this.z * m.c3);
};

vec3.prototype.length = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

vec3.prototype.normalize = function () {
	var scalar = 1 / this.length();
	
	if (isFinite(scalar)) {
		return new vec3(this.x * scalar, this.y * scalar, this.z * scalar);
	} else {
		return new vec3();
	}
};

vec3.prototype.add = function(v) {
	return new vec3(this.x + v.x, this.y + v.y, this.z + v.z);
};

vec3.prototype.sub = function(v) {
	return new vec3(this.x - v.x, this.y - v.y, this.z - v.z);
};

vec3.prototype.mul = function(scalar) {
	var x, y, z;

	if (isFinite(scalar)) {
		return new vec3(this.x * scalar, this.y * scalar, this.z * scalar);
	} else {
		return new vec3();
	}
};

vec3.prototype.div = function(s) {
	var scalar = 1 / s;

	if (isFinite(scalar)) {
		return new vec3(this.x * scalar, this.y * scalar, this.z * scalar);
	} else {
		return new vec3();
	}
};

vec3.prototype.cross = function(v) {
	return new vec3(this.y * v.z - this.z * v.y,
				-(this.x * v.z - this.z * v.x),
				this.x * v.y - this.y * v.x);
};

vec3.prototype.dot = function(v) {
	return this.x * v.x + this.y * v.y + this.z * v.z;
};

vec3.prototype.neg = function() {
	return new vec3(-this.x, -this.y, -this.z);
};

vec3.prototype.abs = function() {
	return new vec3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
};

vec3.prototype.lerp = function(v2, t) {
	return this.add((v2.sub(this)).mul(t));
};

vec3.lerp = function(v1, v2, t) {
	return v1.lerp(v2, t);
};

vec3.prototype.fromEulers = function(e1, e2) {
	var v = Tarumae.MathFunctions.vectorFromEulerAngles(e1, e2);
	this.x = v.x;
	this.y = v.y;
	this.z = v.z;
};

vec3.prototype.offset = function(x, y, z) {
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
};

vec3.prototype.clone = function() {
	return new vec3(this.x, this.y, this.z);
};

vec3.prototype.toArray = function() {
	return [this.x, this.y, this.z];
};

vec3.prototype.toArrayDigits = function(digits) {
	var roundDigits = Tarumae.Utility.NumberExtension.roundDigits;
	return [roundDigits(this.x, digits), roundDigits(this.y, digits), roundDigits(this.z, digits)];
};

vec3.prototype.toFloat32Array = function() {
	return new Float32Array(this.toArray());
};

vec3.add = function(v1, v2) {
	return new vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
};

vec3.sub = function(v1, v2) {
	return new vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
};

vec3.mul = function(v1, s) {
	return new vec3(v1.x * s, v1.y * s, v1.z * s);
};

vec3.div = function(v1, s) {
	return new vec3(v1.x / s, v1.y / s, v1.z / s);
};

vec3.neg = function(v1) {
	return new vec3(-v1.x, -v1.y, -v1.z);
};

vec3.dot = function(v1, v2) {
	return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

vec3.cross = function(v1, v2) {
	return new vec3(v1.y * v2.z - v1.z * v2.y,
				-(v1.x * v2.z - v1.z * v2.x),
				v1.x * v2.y - v1.y * v2.x);
};

vec3.getLength = function(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
};

vec3.normalize = function(v) {
	var scalar = 1 / vec3.getLength(v);
	
	if (isFinite(scalar)) {
		return new vec3(v.x * scalar, v.y * scalar, v.z * scalar);
	} else {
		return new vec3();
	}
};

vec3.createFromEulers = (function() {
	var m;

	return function(ex, ey, ez) {
		
		// TODO: might be replaced by Quaternion	
		if (m == undefined) m = new Matrix4();
		m.loadIdentity().rotate(ex, ey, ez);
		
		return new vec3(-m.a3, -m.b3, -m.c3);
	}
})();

vec3.fromArray = function(arr) {
	return new vec3(arr[0], arr[1], arr[2]);
};

vec3.zero = new vec3(0, 0, 0);
vec3.one = new vec3(1, 1, 1);
vec3.up = new vec3(0, 1, 0);
vec3.down = new vec3(0, -1, 0);
vec3.left = new vec3(-1, 0, 0);
vec3.right = new vec3(1, 0, 0);
vec3.forward = new vec3(0, 0, -1);
vec3.back = new vec3(0, 0, 1);

//////////////////// vec4 //////////////////////

function vec4(x, y, z, w) {
	switch (arguments.length) {
		default:
			this.x = 0;
			this.y = 0;
			this.z = 0;
			this.w = 0;
			break;
			
		case 1:
			var obj = arguments[0];
			
			if (typeof obj === "object") {
				if (obj instanceof vec3) {
					this.x = obj.x;
					this.y = obj.y;
					this.z = obj.z;
					this.w = 1.0;
				} else if (obj instanceof vec4) {
					this.x = obj.x;
					this.y = obj.y;
					this.z = obj.z;
					this.w = obj.w;
				}
			}
			break;

		case 2:
			var obj = arguments[0];
			
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

vec4.prototype.xyz = function () {
	return new vec3(this.x, this.y, this.z);
};

vec4.prototype.set = function(x, y, z, w) {
	this.x = x; this.y = y; this.z = z; this.w = w;
};

vec4.prototype.equals = function() {
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

vec4.prototype.almostSame = function() {
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

vec4.prototype.add = function(v) {
	return new vec4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
};

vec4.prototype.sub = function(v) {
	return new vec4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
};

vec4.prototype.mul = function(s) {
	return new vec4(this.x * s, this.y * s, this.z * s, this.w * s);
};

vec4.prototype.div = function(s) {
	return new vec4(this.x / s, this.y / s, this.z / s, this.w / s);
};

vec4.prototype.mulMat = function(m) {
	return new vec4(
		this.x * m.a1 + this.y * m.a2 + this.z * m.a3 + this.w * m.a4,
		this.x * m.b1 + this.y * m.b2 + this.z * m.b3 + this.w * m.b4,
		this.x * m.c1 + this.y * m.c2 + this.z * m.c3 + this.w * m.c4,
		this.x * m.d1 + this.y * m.d2 + this.z * m.d3 + this.w * m.d4);
};

vec4.prototype.dot = function(v) {
	return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
};

vec4.prototype.neg = function() {
	return new vec4(-this.x, -this.y, -this.z, -this.w);
};

vec4.prototype.length = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
};

vec4.prototype.normalize = function () {
	var scalar = 1 / this.length();
	
	if (isFinite(scalar)) {
		return new vec4(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
	} else {
		return new vec4();
	}
};

vec4.prototype.lerp = function(v2, t) {
	return this.add((v2.sub(this)).mul(t));
};

vec4.lerp = function(v1, v2, t) {
	return v1.lerp(v2, t);
};

vec4.prototype.clone = function() {
	return new vec4(this.x, this.y, this.z, this.w);
};

vec4.prototype.toArray = function() {
	return [this.x, this.y, this.z, this.w];
};

vec4.prototype.toArrayDigits = function(digits) {
	var roundDigits = Tarumae.Utility.NumberExtension.roundDigits;
	return [roundDigits(this.x, digits), roundDigits(this.y, digits),
		roundDigits(this.z, digits), roundDigits(this.w, digits)];
};

/////////////////// color3 ////////////////////

function color3(r, g, b) {
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

color3.prototype.clone = function() {
	return new color3(this.r, this.g, this.b);
};

color3.prototype.copyFrom = function(c) {
	this.r = c.r;
	this.g = c.g;
	this.b = c.b;
	return this;
};

color3.prototype.add = function(c) {
	return new color3(this.r + c.r, this.g + c.g, this.b + c.b);
};

color3.prototype.sub = function(c) {
	return new color3(this.r - c.r, this.g - c.g, this.b - c.b);
};

color3.prototype.mul = function(s) {
	return new color3(this.r * s, this.g * s, this.b * s);
};

color3.prototype.length = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

color3.prototype.normalize = function () {
	var scalar = 1 / this.length();
	
	if (isFinite(scalar)) {
		return new color3(this.x * scalar, this.y * scalar, this.z * scalar);
	} else {
		return new color3();
	}
};

color3.prototype.lerp = function(v2, t) {
	return this.add((v2.sub(this)).mul(t));
};

color3.lerp = function(v1, v2, t) {
	return v1.lerp(v2, t);
};

color3.prototype.toArray = function() {
	return [this.r, this.g, this.b];
};

color3.prototype.toFloat32Array = function() {
	return new Float32Array(this.toArray());
};

color3.prototype.toString = function() {
	var toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;

	return "[" + toStringDigits(this.r) + ", " + toStringDigits(this.g) + ", "
		+ toStringDigits(this.b) + "]";
};

color3.white = new color3(1.0, 1.0, 1.0);
color3.silver = new color3(0.7, 0.7, 0.7);
color3.gray = new color3(0.5, 0.5, 0.5);
color3.dimgray = new color3(0.3, 0.3, 0.3);
color3.black = new color3(0.0, 0.0, 0.0);
color3.red = new color3(1.0, 0.0, 0.0);
color3.green = new color3(0.0, 1.0, 0.0);
color3.blue = new color3(0.0, 0.0, 1.0);

color3.randomly = function() {
	return new color3(Math.random(), Math.random(), Math.random());
};

color3.randomlyLight = function() {
	return new color3(0.3 + Math.random() * 0.7, 0.3 + Math.random() * 0.7, 0.3 + Math.random() * 0.7);
};

color3.randomlyDark = function() {
	return new color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
};
/////////////////// color4 ////////////////////

export function color4(r, g, b, a) {
	switch (arguments.length) {
		default:
		case 0:
			this.r = 0; this.g = 0; this.b = 0; this.a = 0;
			break;
			
		case 1:
			if (typeof r === "object") {
				if (r instanceof color3) {
					this.r = r.r;
					this.g = r.g;
					this.b = r.b;
					this.a = g;
				} else if (r instanceof color4) {
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

color4.prototype.rgb = function () {
	return new color3(this.r, this.g, this.b);
};

color4.prototype.clone = function() {
	return new color4(this.r, this.g, this.b, this.a);
};

color4.prototype.add = function(c) {
	return new color4(this.r + c.r, this.g + c.g, this.b + c.b, this.a + c.a);
};

color4.prototype.sub = function(c) {
	return new color4(this.r - c.r, this.g - c.g, this.b - c.b, this.a - c.a);
};

color4.prototype.mul = function(s) {
	return new color4(this.r * s, this.g * s, this.b * s, this.a * s);
};

color4.prototype.lerp = function(c2, t) {
	return this.add((c2.sub(this)).mul(t));
};

color4.lerp = function(c1, c2, t) {
	return c1.lerp(c2, t);
};

color4.prototype.toArray = function() {
	return [this.r, this.g, this.b, this.a];
};

color4.prototype.toFloat32Array = function() {
	return new Float32Array(this.toArray());
};

color4.white = new color4(color3.white, 1.0);
color4.black = new color4(color3.black, 1.0);

////////// Quaternion //////////

function Quaternion() {
	
}

////////// Ray //////////

function Ray(origin, dir) {
	if (typeof origin === "undefined") {
		this.origin = new vec3();
		this.dir = new vec3();
	} else {
		this.origin = origin;
		this.dir = dir;
	}
}

Ray.MaxDistance = 999999;

////////// Bounding Box //////////

function BoundingBox(min, max) {

	switch (arguments.length) {
		case 0:
			this.min = new vec3();
			this.max = new vec3();
			this.origin = new vec3();
			break;

		case 1:
			if (typeof arguments[0] === "object") {
				// get min and max from another boundingbox instance
				this.max = arguments[0].max;
				this.min = arguments[0].min;
			}
			break;

		default:
		case 2:
			this.min = min;
			this.max = max;
			break;
	}

	this.origin = this.getOrigin();
	this.size = this.getSize();
};

BoundingBox.getVertexArray = function(bbox) {
	return [
		new vec3(bbox.max.x, bbox.max.y, bbox.max.z),
		new vec3(bbox.max.x, bbox.max.y, bbox.min.z),
		new vec3(bbox.max.x, bbox.min.y, bbox.max.z),
		new vec3(bbox.max.x, bbox.min.y, bbox.min.z),
		new vec3(bbox.min.x, bbox.max.y, bbox.max.z),
		new vec3(bbox.min.x, bbox.max.y, bbox.min.z),
		new vec3(bbox.min.x, bbox.min.y, bbox.max.z),
		new vec3(bbox.min.x, bbox.min.y, bbox.min.z),
	];
};

BoundingBox.prototype = {
	getSize: function() {
		return vec3.sub(this.max, this.min);
	},

	getOrigin: function() {
		if (typeof this.size === "undefined") {
			this.size = this.getSize();
		}

		return vec3.add(this.min, vec3.div(this.size, 2));
	},

	offset: function(off) {
		this.max = vec3.add(this.max, off);
		this.min = vec3.add(this.min, off);
		this.origin = vec3.add(this.origin, off);
	},

	contains: function(p) {
		return p.x > this.min.x && p.x < this.max.x
			&& p.y > this.min.y && p.x < this.max.y
			&& p.z > this.min.x && p.z < this.max.z;
	},
};

BoundingBox.findBoundingBoxOfBoundingBoxes = function(bboxA, bboxB) {
	if (!bboxA && !bboxB) return null;
	if (!bboxA) return bboxB;
	if (!bboxB) return bboxA;

	var bbox = {
		min: new vec3(),
		max: new vec3()
	};

	bbox.min.x = bboxA.min.x < bboxB.min.x ? bboxA.min.x : bboxB.min.x;
	bbox.max.x = bboxA.max.x > bboxB.max.x ? bboxA.max.x : bboxB.max.x;

	bbox.min.y = bboxA.min.y < bboxB.min.y ? bboxA.min.y : bboxB.min.y;
	bbox.max.y = bboxA.max.y > bboxB.max.y ? bboxA.max.y : bboxB.max.y;

	bbox.min.z = bboxA.min.z < bboxB.min.z ? bboxA.min.z : bboxB.min.z;
	bbox.max.z = bboxA.max.z > bboxB.max.z ? bboxA.max.z : bboxB.max.z;
	
	return bbox;
};

BoundingBox.transformBoundingBox = function(bbox, matrix) {

	var ruf = new vec4(bbox.max.x, bbox.max.y, bbox.max.z, 1).mulMat(matrix);
	var rub = new vec4(bbox.max.x, bbox.max.y, bbox.min.z, 1).mulMat(matrix);
	var rdf = new vec4(bbox.max.x, bbox.min.y, bbox.max.z, 1).mulMat(matrix);
	var rdb = new vec4(bbox.max.x, bbox.min.y, bbox.min.z, 1).mulMat(matrix);
	var luf = new vec4(bbox.min.x, bbox.max.y, bbox.max.z, 1).mulMat(matrix);
	var lub = new vec4(bbox.min.x, bbox.max.y, bbox.min.z, 1).mulMat(matrix);
	var ldf = new vec4(bbox.min.x, bbox.min.y, bbox.max.z, 1).mulMat(matrix);
	var ldb = new vec4(bbox.min.x, bbox.min.y, bbox.min.z, 1).mulMat(matrix);

	var xList = [ruf.x, rub.x, rdf.x, rdb.x, luf.x, lub.x, ldf.x, ldb.x];
	var yList = [ruf.y, rub.y, rdf.y, rdb.y, luf.y, lub.y, ldf.y, ldb.y];
	var zList = [ruf.z, rub.z, rdf.z, rdb.z, luf.z, lub.z, ldf.z, ldb.z];

	return {
		min: new vec3(Math.min.apply(null, xList), Math.min.apply(null, yList), Math.min.apply(null, zList)),
		max: new vec3(Math.max.apply(null, xList), Math.max.apply(null, yList), Math.max.apply(null, zList))
	};
};

/////////////////////// 2D Objects /////////////////////

////////// Point //////////

function Point(x, y) {
	this.x = x;
	this.y = y;
}

Object.assign(Point.prototype, {
	clone: function() {
		return new Point(this.x, this.y);
	},

	mulMat: function() {
		return new Point(
			this.x * m.a1 + this.y * m.a2 + m.a3,
			this.x * m.b1 + this.y * m.b2 + m.b3);
	},
});	
Point.prototype.set = function(x, y) {
	this.x = x;
	this.y = y;
};

////////// Size //////////

function Size(w, h) {
	switch (arguments.length) {
		case 0:
			this.width = 0;
			this.height = 0;
			break;

		case 1:
			var obj = arguments;
			if (typeof obj === "object") {
				this.width = obj.width;
				this.height = obj.height;
			}
			break;
			
		case 2:
			this.width = w;
			this.height = h;
			break;
	}
}

Size.prototype.clone = function() {
	return new Size(this.width, this.height);
};

////////// Rect //////////

function Rect(x, y, width, height) {
	switch (arguments.length) {
		default:
			this.x = 0;
			this.y = 0;
			this.width = 0;
			this.height = 0;
			break;

		case 2:
			this.x = arguments[0].x;
			this.y = arguments[0].y;
			this.width = arguments[1].x;
			this.height = arguments[1].y;
			break;

		case 4:
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			break;
	}
}

Rect.createFromPoints = function(p1, p2) {
	var minx = Math.min(p1.x, p2.x);
	var miny = Math.min(p1.y, p2.y);
	var maxx = Math.max(p1.x, p2.x);
	var maxy = Math.max(p1.y, p2.y);

	return new Rect(minx, miny, maxx - minx, maxy - miny);
};

Object.assign(Rect.prototype, {
	clone: function() {
		return new Rect(this.x, this.y, this.width, this.height);
	},

	contains: function(pos) {
		return this.x <= pos.x && this.y <= pos.y
			&& this.right >= pos.x && this.bottom >= pos.y;
	},
	
	offset: function(value) {
		this.x += value.x;
		this.y += value.y;
	},
	
	centerAt: function(pos) {
		this.x = pos.x - this.width / 2;
		this.y = pos.y - this.height / 2;
	},
});

Object.defineProperties(Rect.prototype, {

	right: {
		get: function() {
			return this.x + this.width;
		},
		set: function(v) {
			this.width = this.x + v;
		}
	},

	bottom: {
		get: function() {
			return this.y + this.height;
		},
		set: function(v) {
			this.height = this.y + v;
		}
	},

	origin: {
		get: function() {
			return new Point(
				this.x + this.width / 2,
				this.y + this.height / 2);
		},
		set: function(p) {
			this.x = p.x - this.width / 2;
			this.y = p.y - this.height / 2;
		},
	},
	
	set: {
		value: function(x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		}
	},

	clone: {
		value: function() {
			return new Rect(this.x, this.y, this.width, this.height);
		}
	},

	contains: {
		value: function(pos) {
			return this.x <= pos.x && this.y <= pos.y
				&& this.right >= pos.x && this.bottom >= pos.y;
		}
	},
	
	offset: {
		value: function(value) {
			this.x += value.x;
			this.y += value.y;
		}
	},

	centerAt: {
		value: function(pos) {
			this.x = pos.x - this.width / 2;
			this.y = pos.y - this.height / 2;
		}
	},
});

