////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec2 } from "../math/vector"

////////// Point //////////

// Tarumae.Point = class {
// 	constructor(x, y) {
// 		this.x = x;
// 		this.y = y;
// 	}
	
// 	set(x, y) {
// 		this.x = x;
// 		this.y = y;
// 	}

// 	clone() {
// 		return new Tarumae.Point(this.x, this.y);
// 	}

// 	mulMat(m) {
// 		return new Tarumae.Point(
// 			this.x * m.a1 + this.y * m.a2 + m.a3,
// 			this.x * m.b1 + this.y * m.b2 + m.b3);
// 	}
// };

// Tarumae.Point.zero = new Tarumae.Point(0, 0);

Tarumae.Point = Vec2;

////////// Size //////////

Tarumae.Size = class {
	constructor() {
		this.set.apply(this, arguments);
	}

	set() {
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
				this.width = arguments[0];
				this.height = arguments[1];
				break;
		}
	}
	
	clone() {
		return new Tarumae.Size(this.width, this.height);
	}

	toArray() {
		return [this.width, this.height];
	}
};

////////// BBox2D //////////

Tarumae.BBox2D = class {
	constructor() {
		this.set.apply(this, arguments);
	}

	set() {
		switch (arguments.length) {
			case 0:
				this.min = Vec2.zero.clone();
				this.max = Vec2.zero.clone();
				break;
			
			case 1:
				const bbox2 = arguments[0];
				if (bbox2 instanceof Tarumae.BBox2D) {
					this.set(bbox2.min, bbox2.max);
				}
				break;
			
			case 2:
				this.min = arguments[0].clone();
				this.max = arguments[1].clone();
				break;
			
			case 4:
				this.min.x = arguments[0];
				this.min.y = arguments[1];
				this.max.x = arguments[2];
				this.max.y = arguments[3];
				break;
			
			default:
				throw new Error("BBox2D: unsupported argument count");
		}
	}

	get size() {
		return new Tarumae.Size(this.max.x - this.min.x,
			this.max.y - this.min.y);
	}

	get origin() {
		const size = this.size;
		return new Tarumae.Point(this.min.x + size.width * 0.5,
			this.min.y + size.height * 0.5);
	}

	get rect() {
		const size = this.size;
		return new Tarumae.Rect(this.min.x, this.min.y, size.width, size.height);
	}

	expendToBBox(bbox) {
		if (this.min.x > bbox.min.x) this.min.x = bbox.min.x;
		if (this.min.y > bbox.min.y) this.min.y = bbox.min.y;
		if (this.max.x < bbox.max.x) this.max.x = bbox.max.x;
		if (this.max.y < bbox.max.y) this.max.y = bbox.max.y;
	}

	updateFromTwoPoints(p1, p2) {
		this.min.x = Math.min(p1.x, p2.x);
		this.min.y = Math.min(p1.y, p2.y);
		this.max.x = Math.max(p1.x, p2.x);
		this.max.y = Math.max(p1.y, p2.y);
	}

	updateFrom4Points(p1, p2, p3, p4) {
		this.min.x = Math.min(p1.x, Math.min(p2.x, Math.min(p3.x, p4.x)));
		this.min.y = Math.min(p1.y, Math.min(p2.y, Math.min(p3.y, p4.y)));
		this.max.x = Math.max(p1.x, Math.max(p2.x, Math.max(p3.x, p4.x)));
		this.max.y = Math.max(p1.x, Math.max(p2.x, Math.max(p3.x, p4.x)));
	}

	updateFromTwoBoundingBoxes(b1, b2) {
		this.updateFrom4Points(b1.min, b1.max, b2.min, b2.max);
	}

	updateFromPoints() {
		if (arguments.length < 1) {
			throw new Error("number of arguments must be greater than 1");
		}

		this.min.x = arguments[0].x; this.min.y = arguments[0].y;
		this.max.x = arguments[0].x; this.max.y = arguments[0].y;

		for (let i = 1; i < arguments.length; i++) {
			const x = arguments[i].x, y = arguments[i].y;
			if (this.min.x > x) this.min.x = x;
			if (this.min.y > y) this.min.y = y;			
			if (this.max.x > x) this.max.x = x;
			if (this.max.y > y) this.max.y = y;
		}
	}

	updateFromPolygon(p) {
		if (p.length <= 0) {
			throw new Error("polygon doesn't contain any points");
		}

		this.min.x = p[0][0]; this.min.y = p[0][1];
		this.max.x = p[0][0]; this.max.y = p[0][1];

		for (let i = 0; i < p.length; i++) {
      const px = p[i][0], py = p[i][1];
			
			if (this.min.x > px) this.min.x = px;
			if (this.min.y > py) this.min.y = py;
			if (this.max.x < px) this.max.x = px;
			if (this.max.y < py) this.max.y = py;
		}
	}

	// @deprecate
	contains(p) {
		return this.containsPoint(p);
	}

	containsPoint(p) {
		return p.x >= this.min.x && p.x <= this.max.x
			&& p.y >= this.min.y && p.y <= this.max.y;
	}

	intersectsBBox2D(box2) {
		if (this.max.x < box2.min.x) return false;
		if (this.min.x > box2.max.x) return false;
		if (this.max.y < box2.min.y) return false;
		if (this.min.y > box2.max.y) return false;
	}

	toString() {
		return `[${this.min.x}, ${this.min.y}] - [${this.max.x}, ${this.max.y}]`;
	}

	static fromTwoPoints(v1, v2) {
		const bbox = new Tarumae.BBox2D();
		bbox.updateFromTwoPoints(v1, v2);
		return bbox;
	}

	static from4Points(p1, p2, p3, p4) {
		const bbox = new Tarumae.BBox2D();
		bbox.updateFrom4Points(p1, p2, p3, p4);
		return bbox;
	}

	static fromTwoBoundingBoxes(b1, b2) {
		const bbox = new Tarumae.BBox2D();
		bbox.updateFromTwoBoundingBoxes(b1, b2);
		return bbox;
	}

	static fromPoints() {
		const bbox = new Tarumae.BBox2D();
		bbox.updateFromPoints(...arguments);
		return bbox;
	}

	static fromPolygon(p) {
		const bbox = new Tarumae.BBox2D();
		bbox.updateFromPolygon(p);
		return bbox;
	}
};

////////// Rect //////////

Tarumae.Rect = class {
	constructor(x, y, width, height) {
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
				this.width = arguments[1].width;
				this.height = arguments[1].height;
				break;

			case 4:
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				break;
		}
	}

	clone() {
		return new Tarumae.Rect(this.x, this.y, this.width, this.height);
	}

	contains(pos) {
		return this.x <= pos.x && this.y <= pos.y
			&& this.right >= pos.x && this.bottom >= pos.y;
	}
	
	moveTo(x, y) {
		this.x = x;
		this.y = y;
	}
	
	offset(value) {
		this.x += value.x;
		this.y += value.y;
	}

	get right() {
		return this.x + this.width;
	}
	
	set right(v) {
		this.width = this.x + v;
	}

	get bottom() {
		return this.y + this.height;
	}
	
	set bottom(v) {
		this.height = this.y + v;
	}

	get origin() {
		return new Tarumae.Point(
			this.x + this.width / 2,
			this.y + this.height / 2);
	}
	
	set origin(p) {
		this.x = p.x - this.width / 2;
		this.y = p.y - this.height / 2;
	}

	get topLeft() {
		return new Tarumae.Point(this.x, this.y);
	}

	get topRight() {
		return new Tarumae.Point(this.right, this.y);
	}

	get bottomLeft() {
		return new Tarumae.Point(this.x, this.bottom);
	}

	get bottomRight() {
		return new Tarumae.Point(this.right, this.bottom);
	}

	get topEdge() {
		return new Tarumae.LineSegment2D(this.x, this.y, this.right, this.y);
	}
	
	get bottomEdge() {
		return new Tarumae.LineSegment2D(this.x, this.bottom, this.right, this.bottom);
	}

	get leftEdge() {
		return new Tarumae.LineSegment2D(this.x, this.y, this.x, this.bottom);
	}
	
	get rightEdge() {
		return new Tarumae.LineSegment2D(this.right, this.y, this.right, this.bottom);
	}

	set(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	strink(x, y) {
		this.x += x;
		this.width -= x;
		this.y += y;
		this.height -= y;
	}

	inflate(w, h) {
		const hw = w * 0.5, hh = h * 0.5;
		this.x -= hw; this.y -= hh;
		this.width += hw; this.height += hh;
	}

	bbox() {
		return new Tarumae.BBox2D(this.topLeft, this.bottomRight);
	}

	toString() {
		return `[${this.x}, ${this.y}], [${this.width}, ${this.height}]`;
	}

	static createFromPoints(p1, p2) {
		var minx = Math.min(p1.x, p2.x);
		var miny = Math.min(p1.y, p2.y);
		var maxx = Math.max(p1.x, p2.x);
		var maxy = Math.max(p1.y, p2.y);
	
		return new Tarumae.Rect(minx, miny, maxx - minx, maxy - miny);
	}
};

////////// LineSegment2D //////////

Tarumae.LineSegment2D = class {
	constructor(x1, y1, x2, y2) {
		this.start = { x: x1, y: y1 };
		this.end = { x: x2, y: y2 };

		this.bbox = new Tarumae.BBox2D(
			Tarumae.Point.zero.clone(), Tarumae.Point.zero.clone());
		this.updateBoundingBox();
	}

	get x1() {
		return this.start.x;
	}
	set x1(v) {
		this.start.x = v;
		this.updateBoundingBoxX();
	}
	
	get y1() {
		return this.start.y;
	}
	set y1(v) {
		this.start.y = v;
		this.updateBoundingBoxY();
	}

	get x2() {
		return this.end.x;
	}
	set x2(v) {
		this.end.x = v;
		this.updateBoundingBoxX();
	}
	
	get y2() {
		return this.end.y;
	}
	set y2(v) {
		this.end.y = v;
		this.updateBoundingBoxY();
	}
	
	updateBoundingBox() {
		this.updateBoundingBoxX();
		this.updateBoundingBoxY();
	}

	updateBoundingBoxX() {
		this.bbox.min.x = Math.min(this.start.x, this.end.x) - 1;
		this.bbox.max.x = Math.max(this.start.x, this.end.x) + 1;
	}

	updateBoundingBoxY() {
		this.bbox.min.y = Math.min(this.start.y, this.end.y) - 1;
		this.bbox.max.y = Math.max(this.start.y, this.end.y) + 1;
	}

	intersectsLineSegment(l2) {

	}
};

Tarumae.Polygon = class {
	constructor(points) {
		this.bbox = new Tarumae.BBox2D();
		this.points = points;
	}

	set points(points) {
		this._points = points;
		this.updateBoundingBox();
	}

	get points() {
		return this._points;
	}

	get origin() {
		return this.bbox.origin;
	}

	updateBoundingBox() {
		if (!this._points || !Array.isArray(this._points) || this._points.length <= 0) {
			return;
		}

		const { min, max } = this.bbox;
		
		min.x = this._points[0].x;
		min.y = this._points[0].y;

		this._points.forEach(({ x, y }) => {
			if (min.x > x) min.x = x;
			if (min.y > y) min.y = y;
			if (max.x < x) max.x = x;
			if (max.y < y) max.y = y;
		});
	}

	eachEdge(iterator) {
		if (!this.points || this.points.length < 2) return;

		for (let i = 0; i < this.points.length - 1; i++) {
			const ret = iterator(this.points[i], this.points[i + 1]);
			if (ret) return;
		}

		const last1 = this.points[this.points.length - 1], last2 = this.points[0];
		iterator(last1, last2);
	}

	containsPoint(p) {
		if (!this._points)
			return false;
		else if (!this.bbox.containsPoint(p))
			return false;
		else
			return Tarumae.MathFunctions.polygonContainsPoint(this._points, p);
		
	}

	distanceToPoint(p) {
		if (!this._points)
			return Number.MAX_VALUE;
		else
			return Tarumae.MathFunctions.distancePointToPolygon(p, this._points);
	}
};

////////// DrawingContext2D //////////

Tarumae.DrawingContext2D = class {
	constructor(canvas, ctx, options) {
		this.canvas = canvas;
		this.ctx = ctx;

		this.resetDrawingStyle();

		this.currentTransform = new Tarumae.Matrix3().loadIdentity();
		this.transformStack = new Array();

		if (options.scale) {
			// this.pushScale(options.scale.x, options.scale.y);
		}
	}

	pushTransform(t) {
		this.transformStack.push(this.currentTransform);
		t = t.mul(this.currentTransform);
		this.ctx.setTransform(t.a1, t.b1, t.a2, t.b2, t.a3, t.b3);
	}

	popTransform() {
		this.currentTransform = this.transformStack.pop();
		var t = this.currentTransform;
		this.ctx.setTransform(t.a1, t.b1, t.a2, t.b2, t.a3, t.b3);
	}

	pushTranslation(x, y) {
		const m = Tarumae.Matrix3.makeTranslation(x, y);
		this.pushTransform(m);
		return m;
	}

	pushRotation(angle, x, y) {
		const m = Tarumae.Matrix3.makeRotation(angle, x, y);
		this.pushTransform(m);
		return m;
	}

	pushScale(x, y) {
		const m = Tarumae.Matrix3.makeScale(x, y);
		this.pushTransform(m);
		return m;
	}

	resetTransform() {
		this.currentTransform.loadIdentity();
		this.transformStack._t_clear();
	}

	setTransform(t) {
		this.ctx.setTransform(t.a1, t.b1, t.a2, t.b2, t.a3, t.b3);
	}

	resetDrawingStyle() {
		this.strokeWidth = 1;
		this.strokeColor = "black";
		this.fillColor = "white";
	}

	drawRect(rect, strokeWidth, strokeColor, fillColor) {
		var ctx = this.ctx;
	
		strokeWidth = strokeWidth || this.strokeWidth || 1;
		strokeColor = strokeColor || this.strokeColor || "black";
		fillColor = fillColor || this.fillColor;

		// ctx.beginPath();

		ctx.fillStyle = fillColor;
		if (fillColor) {
				ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
		}
		
		if (typeof strokeWidth !== "undefined") {
			ctx.lineWidth = strokeWidth;
		} else {
			ctx.lineWidth = this.strokeWidth;
		}

		if (strokeColor != undefined) {

			if (typeof strokeColor !== "undefined") {
				ctx.strokeStyle = strokeColor;
			} else {
				ctx.strokeStyle = this.strokeColor;
			}

			if (ctx.lineWidth > 0) {
				ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
			}
		}
		// ctx.closePath();

	}

	drawRoundRect(rect, cornerSize, strokeWidth, strokeColor, fillColor) {
		const ctx = this.ctx;
		
		strokeWidth = strokeWidth || this.strokeWidth || 1;
		strokeColor = strokeColor || this.strokeColor || "black";
		fillColor = fillColor || this.fillColor || "white";

		const minEdge = Math.min(rect.width, rect.height);
		if (cornerSize > minEdge) cornerSize = minEdge;

		const
			w = rect.width, h = rect.height,
			x = rect.x, y = rect.y,
			hc = cornerSize / 2,
			xe = x + w, ye = y + h;
	
		ctx.beginPath();
		ctx.moveTo(x + hc, y);
		ctx.arc(xe - hc, y + hc, hc, Math.PI / 2 + Math.PI, 0);
		ctx.arc(xe - hc, ye - hc, hc, 0, Math.PI / 2);
		ctx.arc(x + hc, ye - hc, hc, Math.PI / 2, Math.PI);
		ctx.arc(x + hc, y + hc, hc, Math.PI, Math.PI / 2 + Math.PI);
		ctx.closePath();

		ctx.fillStyle = fillColor;
		if (fillColor) {
			ctx.fill();
		}

		if (strokeWidth > 0 && strokeColor) {
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = strokeColor;
			ctx.stroke();
		}
	}

	drawPoint(p, size = 3, strikeColor = "transparent", fillColor = "black") {
		this.drawEllipse(new Tarumae.Rect(p.x - size / 2, p.y - size / 2, size, size), 0, strikeColor, fillColor);
	}

	// drawEllipse(p, size, strokeWidth, strokeColor, fillColor) {
	// 	var r = new Tarumae.Rect(p.x - size / 2, p.y - size / 2, size, size);
	// 	return this.drawEllipse(r, strokeWidth, strokeColor, fillColor);
	// };

	drawEllipse(rect, strokeWidth, strokeColor, fillColor) {
		var ctx = this.ctx;
		
		strokeWidth = strokeWidth || this.strokeWidth;
		strokeColor = strokeColor || this.strokeColor;
		fillColor = fillColor || this.fillColor;

		var w = rect.width;
		var h = rect.height;
		var hw = w / 2;
		var hh = h / 2;
		// var x = rect.x - hw;
		// var y = rect.y - hh;
		var x = rect.x;
		var y = rect.y;
	
		var kappa = 0.5522848,
			ox = hw * kappa,   // control point offset horizontal
			oy = hh * kappa,   // control point offset vertical
			xe = x + w,        // x-end
			ye = y + h,        // y-end
			xm = x + hw,       // x-middle
			ym = y + hh;       // y-middle
	
		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	
		ctx.closePath();

		if (fillColor) {
			ctx.fillStyle = fillColor;
			ctx.fill();
		}

		if (typeof strokeWidth === "undefined") {
			strokeWidth = 1;
		}
	
		if (strokeWidth || strokeColor) {
			ctx.lineWidth = strokeWidth || 1;
			ctx.strokeStyle = strokeColor || "black";
			ctx.stroke();
		}
	}

	drawArc(rect, startAngle, endAngle, strokeWidth, strokeColor, fillColor) {
		const ctx = this.ctx;
		
		strokeWidth = strokeWidth || this.strokeWidth || 1;
		strokeColor = strokeColor || this.strokeColor || "black";
		fillColor = fillColor || this.fillColor;

		const x = rect.x, y = rect.y,
			w = rect.width, h = rect.height,
			hw = w / 2, hh = h / 2,
			r = Math.max(w, h);
		
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, r, startAngle * Math.PI / 180, endAngle * Math.PI / 180);
		ctx.closePath();

		if (fillColor) {
			ctx.fillStyle = fillColor;
			ctx.fill();
		}
	
		if (strokeWidth > 0 && strokeColor) {
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = strokeColor;
			ctx.stroke();
		}
	}

	drawImage(p, image) {
		var ctx = this.ctx;
		
		ctx.drawImage(image, p.x, p.y);
	}

	drawText(text, p, color, halign, font) {
		var ctx = this.ctx;
	
		ctx.fillStyle = color || "black";
		
		// TODO: get text height, allow to change text font
		ctx.font = "12px Arial";
	
		if (halign == "center") {
			const size = ctx.measureText(text);
			p = { x: p.x - size.width / 2, y: p.y };
		}

		if (font) ctx.font = font;
	
		ctx.fillText(text, p.x, p.y);
  }
  		
	drawLine(from, to, strokeWidth, strokeColor) {
		const ctx = this.ctx;

		ctx.lineWidth = strokeWidth || this.strokeWidth || 1;
		ctx.strokeStyle = strokeColor || this.strokeColor || "black";

		ctx.beginPath();

		if (Array.isArray(from)) {
			ctx.moveTo(from[0], from[1]);
			ctx.lineTo(to[0], to[1]);
		} else {
			ctx.moveTo(from.x, from.y);
			ctx.lineTo(to.x, to.y);
		}

		ctx.closePath();
		ctx.stroke();
	};
		
	drawLineSegments() {
		return this.drawLines(...arguments);
	};

	drawLines(lines, width, color, strip) {
		if (lines.length < 2) return;
	
		const ctx = this.ctx;
	
		if (width === undefined) width = this.strokeWidth;
		if (color === undefined) color = this.strokeColor;

		if (width > 0 && color != "transparent") {
			ctx.lineWidth = width || 1;
			ctx.strokeStyle = color || "black";
	
			ctx.beginPath();
	
			if (strip) {
				const from = lines[0];

				if (Array.isArray(from)) {
					ctx.moveTo(from[0], from[1]);
				} else {
					ctx.moveTo(from.x, from.y);
				}

				for (let i = 1; i < lines.length; i++) {
					const to = lines[i];
					if (Array.isArray(to)) {
						ctx.lineTo(to[0], to[1]);
					} else {
						ctx.lineTo(to.x, to.y);
					}
				}
			} else {
				for (let i = 0; i < lines.length; i += 2) {
					const from = lines[i], to = lines[i + 1];
					if (Array.isArray(from)) {
						ctx.moveTo(from[0], from[1]);
						ctx.lineTo(to[0], to[1]);
					} else {
						ctx.moveTo(from.x, from.y);
						ctx.lineTo(to.x, to.y);
					}
				}
			}

			ctx.closePath();
			ctx.stroke();
		}
	}
		
	drawArrow(from, to, width, color, arrowSize) {
		var ctx = this.ctx;
		
		if (width === undefined) width = 2;
		if (arrowSize === undefined) arrowSize = width * 5;
		
		ctx.lineWidth = width;
		ctx.strokeStyle = color || "black";
		
		var angle = Math.atan2(to.y - from.y, to.x - from.x);
		
		ctx.beginPath();
		
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		
		ctx.lineTo(to.x - arrowSize * Math.cos(angle - Math.PI / 6),
			to.y - arrowSize * Math.sin(angle - Math.PI / 6));
		
		ctx.moveTo(to.x, to.y);
		ctx.lineTo(to.x - arrowSize * Math.cos(angle + Math.PI / 6),
			to.y - arrowSize * Math.sin(angle + Math.PI / 6));
		
		ctx.closePath();
		ctx.stroke();
	};
		
	fillArrow(from, to, size, color) {
		var ctx = this.ctx;
		
		size = size || 10;
		ctx.fillStyle = color || "black";
		
		var angle = Math.atan2(to.y - from.y, to.x - from.x);
		
		ctx.beginPath();
		
		ctx.moveTo(to.x, to.y);
		ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
		ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
		
		ctx.closePath();
		ctx.fill();
	};
		
	drawPolygon(points, strokeWidth, strokeColor, fillColor) {
		const ctx = this.ctx;

		if (!points || points.length < 2) return;
		
		ctx.beginPath();
		
		var p0 = points[0];
		if (Array.isArray(p0))
			ctx.moveTo(p0[0], p0[1]);
		else
			ctx.moveTo(p0.x, p0.y);
		
		for (var i = 1; i < points.length; i++) {
			var p = points[i];
			if (Array.isArray(p))
				ctx.lineTo(p[0], p[1]);
			else
				ctx.lineTo(p.x, p.y);
		}
		
		if (Array.isArray(p0))
			ctx.lineTo(p0[0], p0[1]);
		else
			ctx.lineTo(p0.x, p0.y);

		ctx.closePath();
				
		strokeWidth = strokeWidth || this.strokeWidth || 1;
		strokeColor = strokeColor || this.strokeColor || "black";
		fillColor = fillColor || this.fillColor;
		
		if (fillColor) {
			ctx.fillStyle = fillColor;
			ctx.fill();
		}

		if (strokeWidth || strokeColor) {
			ctx.lineWidth = strokeWidth || 1;
			ctx.strokeStyle = strokeColor || "black";
		
			ctx.stroke();
		}
	};
};