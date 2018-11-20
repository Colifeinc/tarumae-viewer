import Tarumae from "../entry";
import { start } from "pretty-error";

Tarumae.DrawingContext2D = class {
	constructor(canvas, ctx) {
		this.canvas = canvas;
		this.ctx = ctx;

		this.resetDrawingStyle();

		this.currentTransform = new Tarumae.Matrix3().loadIdentity();
		this.transformStack = new Array();
	}

	pushTransform(t) {
		this.transformStack.push(this.currentTransform.clone());
		this.currentTransform = t.mul(this.currentTransform);
		t = this.currentTransform;
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

	resetDrawingStyle() {
		this.strokeWidth = 1;
		this.strokeColor = "black";
		this.fillColor = "transparent";
	}

	drawRect(rect, strokeWidth, strokeColor, fillColor) {
		var ctx = this.ctx;
	
		fillColor = fillColor || this.fillColor;

		if (fillColor !== "transparent") {
			ctx.fillStyle = fillColor;
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
				// ctx.beginPath();
				ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
				// ctx.closePath();
			}
		}
	}

	drawRoundRect(rect, cornerSize, strokeWidth, strokeColor, fillColor) {
		const ctx = this.ctx;
		
		strokeWidth = strokeWidth || this.strokeWidth || 1;
		strokeColor = strokeColor || this.strokeColor || "black";
		fillColor = fillColor || this.fillColor;

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

	drawPoint(p, size = 3, color = "black") {
		this.drawEllipse(new Tarumae.Rect(p.x - size / 2, p.y - size / 2, size, size), 0, null, color);
	}

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

	drawText(p, text, color, halign, font) {
		var ctx = this.ctx;
	
		ctx.fillStyle = color || "black";
	
		var size = ctx.measureText(text);
	
		// TODO: get text height, allow to change text font
		ctx.font = "12px Arial";
	
		if (halign == "center") {
			p.x -= size.width / 2;
		}

		if (font) ctx.font = font;
	
		ctx.fillText(text, p.x, p.y);
  }
  		
	drawLine(from, to, width, color) {
		this.drawLineSegments([from, to], width, color);
	};
		
	drawLineSegments() {
		return this.drawLines(...arguments);
	};

	drawLines(lines, width, color, strip) {
		if (lines.length < 2) return;
	
		const ctx = this.ctx;
	
		if (width == undefined) width = this.strokeWidth;
		if (color == undefined) color = this.strokeColor;

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
					if (Array.isArray(from)) {
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
		
	drawBox(box, width, color) {
		if (!box) return;
		
		var points = this.transformPoints([
			{ x: box.min.x, y: box.min.y, z: box.min.z },
			{ x: box.max.x, y: box.min.y, z: box.min.z },
			{ x: box.min.x, y: box.max.y, z: box.min.z },
			{ x: box.max.x, y: box.max.y, z: box.min.z },
		
			{ x: box.min.x, y: box.min.y, z: box.max.z },
			{ x: box.max.x, y: box.min.y, z: box.max.z },
			{ x: box.min.x, y: box.max.y, z: box.max.z },
			{ x: box.max.x, y: box.max.y, z: box.max.z },
		]);
		
		this.drawLineSegments([
			points[0], points[1], points[2], points[3],
			points[4], points[5], points[6], points[7],
		
			points[0], points[4], points[1], points[5],
			points[2], points[6], points[3], points[7],
		
			points[0], points[4], points[1], points[5],
			points[2], points[6], points[3], points[7],
		
			points[0], points[2], points[1], points[3],
			points[4], points[6], points[5], points[7],
		], width, color);
	}
		
	drawFocusBox(box, len, width, color) {
		if (!box) return;
		
		len = len || 0.1;
		
		var points = this.transformPoints([
			{ x: box.min.x, y: box.min.y, z: box.min.z },
			{ x: box.max.x, y: box.min.y, z: box.min.z },
			{ x: box.min.x, y: box.max.y, z: box.min.z },
			{ x: box.max.x, y: box.max.y, z: box.min.z },
		
			{ x: box.min.x, y: box.min.y, z: box.max.z },
			{ x: box.max.x, y: box.min.y, z: box.max.z },
			{ x: box.min.x, y: box.max.y, z: box.max.z },
			{ x: box.max.x, y: box.max.y, z: box.max.z },
		]);
		
		this.drawLineSegments2D([
			points[0], points[1], points[2], points[3],
			points[4], points[5], points[6], points[7],
		
			points[0], points[4], points[1], points[5],
			points[2], points[6], points[3], points[7],
		
			points[0], points[4], points[1], points[5],
			points[2], points[6], points[3], points[7],
		
			points[0], points[2], points[1], points[3],
			points[4], points[6], points[5], points[7],
		], width, color);
	};
		
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
		var ctx = this.ctx;
		
		if (points.length < 2) return;
		
		ctx.beginPath();
		
		var p0 = points[0];
		ctx.moveTo(p0.x, p0.y);
		
		for (var i = 1; i < points.length; i++) {
			var p = points[i];
			ctx.lineTo(p.x, p.y);
		}
		
		ctx.lineTo(p0.x, p0.y);

		ctx.closePath();
		
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
    
	drawEllipse(p, size, strokeWidth, strokeColor, fillColor) {
		var r = new Tarumae.Rect(p.x - size / 2, p.y - size / 2, size, size);
		return this.drawingContext2D.drawEllipse(r, strokeWidth, strokeColor, fillColor);
	};
		
	drawText2D() {
		return this.drawingContext2D.drawText.apply(this.drawingContext2D, arguments);
	};

};