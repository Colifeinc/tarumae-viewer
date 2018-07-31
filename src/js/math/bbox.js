import Tarumae from "../entry"
import { Vec3, Vec4 } from "../math/vector"

Tarumae.BoundingBox = class {
	constructor(min, max) {
		this._dirty = false;

		switch (arguments.length) {
			case 0:
				this._min = new Vec3();
				this._max = new Vec3();
				break;

			case 1:
				if (typeof arguments[0] === "object" && arguments[0].min && arguments[0].max) {
					// get min and max from another boundingbox instance
					this._min = arguments[0].min;
					this._max = arguments[0].max;
				}
				break;

			default:
			case 2:
				this._min = min;
				this._max = max;
				break;
		}

		this._updateSizeAndOrigin();
	}

	get min() {
		return this._min;
	}
	set min(v) {
		this._min = v;
		this._dirty = true;
	}

	get max() {
		return this._max;
	}
	set max(v) {
		this._max = v;
		this._dirty = true;
	}

	_updateSizeAndOrigin() {
		this._size = Vec3.sub(this._max, this._min);
		this._origin = Vec3.add(this._min, Vec3.mul(this._size, 0.5));
		this._dirty = false;
	}

	getVertexArray(bbox) {
		return [
			new Vec3(bbox._max.x, bbox._max.y, bbox._max.z),
			new Vec3(bbox._max.x, bbox._max.y, bbox._min.z),
			new Vec3(bbox._max.x, bbox._min.y, bbox._max.z),
			new Vec3(bbox._max.x, bbox._min.y, bbox._min.z),
			new Vec3(bbox._min.x, bbox._max.y, bbox._max.z),
			new Vec3(bbox._min.x, bbox._max.y, bbox._min.z),
			new Vec3(bbox._min.x, bbox._min.y, bbox._max.z),
			new Vec3(bbox._min.x, bbox._min.y, bbox._min.z),
		];
	}

	get size() {
		if (this._dirty) {
			this._updateSizeAndOrigin();
		}

		return this._size;
	}

	get origin() {
		if (this._dirty) {
			this._updateSizeAndOrigin();
		}

		return this._origin;
	}

	offset(off) {
		this._max = Vec3.add(this._max, off);
		this._min = Vec3.add(this._min, off);
		this._origin = Vec3.add(this._origin, off);
	}

	contains(p) {
		return p.x > this._min.x && p.x < this._max.x
			&& p.y > this._min.y && p.x < this._max.y
			&& p.z > this._min.x && p.z < this._max.z;
	}

	containsBox(bbox) {
		return this.contains(bbox.min) && this.contains(bbox.max);
	}

	containsTriangle(t) {
		return this.contains(t[0]) && this.contains(t[1]) && this.contains(t[2]);
	}

	initTo(p) {
		this._min = p;
		this._max = p;
	}

	expandTo(p) {
		if (this._min.x > p.x) this._min.x = p.x;
		if (this._min.y > p.y) this._min.y = p.y;
		if (this._min.z > p.z) this._min.z = p.z;

		if (this._max.x < p.x) this._max.x = p.x;
		if (this._max.y < p.y) this._max.y = p.y;
		if (this._max.z < p.z) this._max.z = p.z;
	}

	expandToBox(bbox) {
		this.expandTo(bbox.min);
		this.expandTo(bbox.max);
	}

	static fromPoints(points) {
		var bbox = new Tarumae.BoundingBox();

		if (points.length <= 0) {
			return bbox;
		}

		bbox.initTo(points[0]);

		if (points.length <= 1) {
			return bbox;
		}

		for (let i = 1; i < points.length; i++) {
			bbox.expandTo(points[i]);
		}

		return bbox;
	}
	
	static fromVertexArray(vertices, start, count) {
		const bbox = new Tarumae.BoundingBox();
		
		if (count <= 0) {
			return bbox;
		}

		bbox.initTo(vertices[start]);
		
		// if (count <= 1) {
		// 	bbox.

	}
  
	static findBoundingBoxOfBoundingBoxes(bboxA, bboxB) {
		if (!bboxA && !bboxB) return null;
		if (!bboxA) return bboxB;
		if (!bboxB) return bboxA;

		var bbox = {
			min: new Vec3(),
			max: new Vec3()
		};

		bbox.min.x = bboxA.min.x < bboxB.min.x ? bboxA.min.x : bboxB.min.x;
		bbox.max.x = bboxA.max.x > bboxB.max.x ? bboxA.max.x : bboxB.max.x;

		bbox.min.y = bboxA.min.y < bboxB.min.y ? bboxA.min.y : bboxB.min.y;
		bbox.max.y = bboxA.max.y > bboxB.max.y ? bboxA.max.y : bboxB.max.y;

		bbox.min.z = bboxA.min.z < bboxB.min.z ? bboxA.min.z : bboxB.min.z;
		bbox.max.z = bboxA.max.z > bboxB.max.z ? bboxA.max.z : bboxB.max.z;
	
		return bbox;
	}
	
	static transformBoundingBox(bbox, matrix) {
		var ruf = new Vec4(bbox.max.x, bbox.max.y, bbox.max.z, 1).mulMat(matrix);
		var rub = new Vec4(bbox.max.x, bbox.max.y, bbox.min.z, 1).mulMat(matrix);
		var rdf = new Vec4(bbox.max.x, bbox.min.y, bbox.max.z, 1).mulMat(matrix);
		var rdb = new Vec4(bbox.max.x, bbox.min.y, bbox.min.z, 1).mulMat(matrix);
		var luf = new Vec4(bbox.min.x, bbox.max.y, bbox.max.z, 1).mulMat(matrix);
		var lub = new Vec4(bbox.min.x, bbox.max.y, bbox.min.z, 1).mulMat(matrix);
		var ldf = new Vec4(bbox.min.x, bbox.min.y, bbox.max.z, 1).mulMat(matrix);
		var ldb = new Vec4(bbox.min.x, bbox.min.y, bbox.min.z, 1).mulMat(matrix);

		var xList = [ruf.x, rub.x, rdf.x, rdb.x, luf.x, lub.x, ldf.x, ldb.x];
		var yList = [ruf.y, rub.y, rdf.y, rdb.y, luf.y, lub.y, ldf.y, ldb.y];
		var zList = [ruf.z, rub.z, rdf.z, rdb.z, luf.z, lub.z, ldf.z, ldb.z];

		return {
			min: new Vec3(Math.min.apply(null, xList), Math.min.apply(null, yList), Math.min.apply(null, zList)),
			max: new Vec3(Math.max.apply(null, xList), Math.max.apply(null, yList), Math.max.apply(null, zList))
		};
	}
}