////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"
import { Vec3, Vec4 } from "../math/vector"
import "../math/matrix"

Tarumae.Mesh = class {
	constructor() {
		this.renderer = undefined;
		this.meta = undefined;
	
		this.vertices = undefined;
		this.normals = undefined;
		this.texcoords = undefined;

		this.indexed = false;
		this.indexes = undefined;

		this.composeMode = Tarumae.Mesh.ComposeModes.Triangles;

		this.vertexBuffer = undefined;
		this.indexBuffer = undefined;

		this.cachedTransformedVertices = undefined;
		this.cachedNavmeshBorders = undefined;
	
		// for debug
		this._vertexMemorySize = undefined;
		this._polygonCount = undefined;

		this._lightmap = undefined;
		this._lightmapTrunkId = undefined;
		this._lightmapType = undefined;
	}

	loadFromStream(stream) {
		if (!stream || stream.byteLength <= 0) {
			console.error("can't load mesh: content is empty");
			return;
		}

		var header;
		
		// header
		try {
			header = new Int32Array(stream);
		} catch (e) {
			console.error("load mesh error: " + e);
			return;
		}

		// check for v1.x
		if (header[0] == 0x6873656d /* tag: mesh */) {

			var verAndFlags = header[1];

			var ver = verAndFlags & 0xffff;
			var flags = verAndFlags >> 16;

			// check for v1.2	
			if (ver >= 0x0102) {
				var vertexCount = header[3];

				// new format		
				this.meta = {
					vertexCount: vertexCount,
					uvCount: header[4],
					indexCount: header[5],
					normalCount: 0,
					texcoordCount: 0,
					tangentBasisCount: 0,
					hasColor: false,
				};

				this.indexed = this.meta.indexCount > 0;

				if ((flags & Tarumae.Mesh.HeaderFlags.HasNormal) === Tarumae.Mesh.HeaderFlags.HasNormal) {
					this.meta.normalCount = this.meta.vertexCount;
				}
			
				if ((flags & Tarumae.Mesh.HeaderFlags.HasTexcoord) === Tarumae.Mesh.HeaderFlags.HasTexcoord) {
					this.meta.texcoordCount = this.meta.vertexCount;
				}

				if (ver >= 0x0103) {
					if ((flags & Tarumae.Mesh.HeaderFlags.HasLightmap) === Tarumae.Mesh.HeaderFlags.HasLightmap) {
						this._lightmapTrunkId = new Uint32Array(stream, 80, 4)[0];
						this._lightmapType = header[21];
					}
				}
			} else {
				this.meta = {
					vertexCount: header[3],
					normalCount: header[4],
					uvCount: header[5],
					texcoordCount: header[6],
					indexCount: header[7],
				};
			}

			if ((flags & Tarumae.Mesh.HeaderFlags.HasBoundingBox) === Tarumae.Mesh.HeaderFlags.HasBoundingBox) {
				var boundingBoxBuffer = new Float32Array(stream, 32, 48);

				this._boundingBox = {
					min: new Vec3(boundingBoxBuffer[0], boundingBoxBuffer[1], boundingBoxBuffer[2]),
					max: new Vec3(boundingBoxBuffer[3], boundingBoxBuffer[4], boundingBoxBuffer[5]),
				};
			}

			if ((flags & Tarumae.Mesh.HeaderFlags.HasTangentBasisData) === Tarumae.Mesh.HeaderFlags.HasTangentBasisData) {
				this.meta.tangentBasisCount = this.meta.vertexCount;
			}

			if ((flags & 0x20) == 0x20) {
				this.meta.hasColor = true;
			}
		
			var headerLength = header[2];

			this.vertexBuffer = new Float32Array(stream, headerLength);

			if (this.indexed) {
				var indexByteOffset = headerLength
					+ this.meta.vertexCount * 12
					+ this.meta.normalCount * 12
					+ this.meta.texcoordCount * this.meta.uvCount * 8
					+ this.meta.tangentBasisCount * 24
					+ (this.meta.hasColor ? this.meta.vertexCount * 12 : 0);
				
				this.indexBuffer = new Uint16Array(stream, indexByteOffset);
			}
		} else {

			// old format
			this.meta = {
				vertexCount: header[0],
				normalCount: header[1],
				texcoordCount: header[2],
				uvCount: 1,
				stride: 0,
		
				vertexBufferId: undefined,
				indexBufferId: undefined,
			};

			this.vertexBuffer = new Float32Array(stream, 12);
		}
	}

	bind(renderer) {
		if (this.meta === undefined) {
			this.meta = {
				vertexCount: 0,
				normalCount: 0,
				normalOffset: 0,
				texcoordCount: 0,
				texcoordOffset: 0,
				texcoord2Offset: 0,
				tangentBasisOffset: 0,
				bitangentBasisOffset: 0,
				stride: 0,
			
				vertexBufferId: undefined,
				indexBufferId: undefined,
			};
		}

		var meta = this.meta;

		meta.renderer = renderer;

		// calc count

		if (Array.isArray(this.vertices) && this.vertices.length > 0) {
			meta.vertexCount = (this.vertices.length / 3);
		}

		if (Array.isArray(this.normals)) {
			meta.normalCount = meta.vertexCount;
		}

		if (Array.isArray(this.texcoords)) {
			meta.texcoordCount = meta.vertexCount;
		}

		if (Array.isArray(this.colors)) {
			meta.hasColor = true;
		}

		if (Array.isArray(this.indexes)) {
			meta.indexCount = this.indexes.length;
		}

		if (this.vertexBuffer === undefined) {
			// compose memory buffer
			if (!Array.isArray(this.vertices) || this.vertices.length <= 0) {
				return false;
			}

			var vertexBuffer = this.vertices.slice();

			if (meta.normalCount > 0) {
				vertexBuffer = vertexBuffer.concat(this.normals);
			}

			if (meta.texcoordCount > 0) {
				vertexBuffer = vertexBuffer.concat(this.texcoords);
			}

			if (meta.tangentBasisCount > 0) {
				vertexBuffer = vertexBuffer.concat(this.tangents).concat(this.bitangents);
			}

			if (meta.hasColor) {
				vertexBuffer = vertexBuffer.concat(this.colors);
			}

			this.vertexBuffer = new Float32Array(vertexBuffer);
		}

		// calc offset
		if (typeof meta.structureType === "number"
			&& meta.structureType == Tarumae.Mesh.StructureTypes.StructureArray) {
		
			meta.normalOffset = 12;

			if (meta.texcoordCount > 0) {
				meta.texcoordOffset = meta.normalOffset + 12;
			}

			meta.stride = 12 + (meta.normalCount > 0 ? 12 : 0) + (meta.texcoordCount > 0 ? 8 : 0);
		} else {
			var offset = meta.vertexCount * 12;

			meta.normalOffset = offset;
			offset += meta.normalCount * 12;

			if (meta.texcoordCount > 0) {
				meta.texcoordOffset = offset;
				offset += meta.texcoordCount * 8;

				if (meta.uvCount > 1) {
					meta.texcoord2Offset = offset;
					offset += meta.texcoordCount * 8;
				}
			}

			if (meta.tangentBasisCount > 0) {
				meta.tangentBasisOffset = offset;
				offset += meta.tangentBasisCount * 12;

				meta.bitangentBasisOffset = offset;
				offset += meta.tangentBasisCount * 12;
			}

			if (meta.hasColor) {
				meta.vertexColorOffset = offset;
				offset += meta.vertexCount * 12;
			}
		}

		if (this.indexed && !this.indexBuffer) {
			if (Array.isArray(this.indexes)) {
				this.indexBuffer = new Uint16Array(this.indexes);
			}
		}

		var gl = renderer.gl;

		this.meta.vertexBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.meta.vertexBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertexBuffer, gl.STATIC_DRAW);
	
		if (this.indexed) {
			this.meta.indexBufferId = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.meta.indexBufferId);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer, gl.STATIC_DRAW);
		}

		var indexBufferLength = (!this.indexBuffer ? 0 : (this.indexBuffer.length * 2));
		
		if (renderer.debugger) {
			this._vertexMemorySize = this.vertexBuffer.length * 4 + indexBufferLength;
			renderer.debugger.totalMeshMemoryUsed += this._vertexMemorySize;

			switch (this.composeMode) {
				default:
				case Tarumae.Mesh.ComposeModes.Triangles:
					this._polygonCount = this.meta.vertexCount / 3;
					break;

				case Tarumae.Mesh.ComposeModes.TriangleStrip:
					this._polygonCount = this.meta.vertexCount - 2;
					break;

				case Tarumae.Mesh.ComposeModes.TriangleFan:
					this._polygonCount = this.meta.vertexCount - 2;
					break;
			}

			renderer.debugger.totalNumberOfPolygonBound += this._polygonCount;
		}
		
		return true;
	}

	unbind() {
		if (this.meta) {

			var renderer = this.meta.renderer;
		
			if (this.meta.vertexBufferId) {
				if (renderer) renderer.gl.deleteBuffer(this.meta.vertexBufferId);
				this.meta.vertexBufferId = undefined;
				this.vertexBuffer = undefined;
			}

			if (this.meta.indexBufferId) {
				if (renderer) renderer.gl.deleteBuffer(this.meta.indexBufferId);
				this.meta.indexBufferId = undefined;
				this.indexBuffer = undefined;
			}

			if (renderer && renderer.debugger) {
				if (this._polygonCount) {
					renderer.debugger.totalNumberOfPolygonBound -= this._polygonCount;
				}

				if (this._vertexMemorySize) {
					renderer.debugger.totalMeshMemoryUsed -= this._vertexMemorySize;
				}
			}
		}
	}

	destroy() {
		this.unbind();

		if(Array.isArray(this.vertices)) {
			this.vertices.length = 0;
		}
		if(Array.isArray(this.normals)) {
			this.normals.length = 0;
		}
		if(Array.isArray(this.texcoords)) {
			this.texcoords.length = 0;
		}
		if(Array.isArray(this.indexes)) {
			this.indexes.length = 0;
		}
		
		this._polygonCount = 0;
	}

	draw(renderer) {
		'use strict';

		if (!this.meta || !this.meta.vertexBufferId) {
			if (!this.bind(renderer)) {
				return;
			}
		}

		var sp = renderer.currentShader;
		if (!sp) return;

		var meta = this.meta;
		var gl = renderer.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.meta.vertexBufferId);

		// vertex
		gl.vertexAttribPointer(sp.vertexPositionAttribute, 3, gl.FLOAT, false, meta.stride, 0);
		gl.enableVertexAttribArray(sp.vertexPositionAttribute);

		// normal	
		if (sp.vertexNormalAttribute >= 0) {
			if (meta.normalCount > 0) {
				gl.vertexAttribPointer(sp.vertexNormalAttribute, 3, gl.FLOAT, false, meta.stride, meta.normalOffset);
				gl.enableVertexAttribArray(sp.vertexNormalAttribute);
			} else {
				gl.disableVertexAttribArray(sp.vertexNormalAttribute);
			}
		}
	
		// texcoords 1
		if (sp.vertexTexcoordAttribute >= 0) {
			if (meta.texcoordCount > 0) {
				gl.vertexAttribPointer(sp.vertexTexcoordAttribute, 2, gl.FLOAT, false, meta.stride, meta.texcoordOffset);
				gl.enableVertexAttribArray(sp.vertexTexcoordAttribute);
			} else {
				gl.disableVertexAttribArray(sp.vertexTexcoordAttribute);
			}
		}
	
		// texcoords 2
		if (sp.vertexTexcoord2Attribute >= 0) {
			if (meta.texcoordCount > 0 && meta.uvCount > 1) {
				gl.vertexAttribPointer(sp.vertexTexcoord2Attribute, 2, gl.FLOAT, false, meta.stride, meta.texcoord2Offset);
				gl.enableVertexAttribArray(sp.vertexTexcoord2Attribute);
			} else {
				gl.disableVertexAttribArray(sp.vertexTexcoord2Attribute);
			}
		}
	
		// tangents & bitangents
		if (sp.vertexTangentAttribute >= 0 && sp.vertexBitangentAttribute >= 0) {
			if (meta.tangentBasisCount > 0) {
				gl.vertexAttribPointer(sp.vertexTangentAttribute, 3, gl.FLOAT, false, meta.stride, meta.tangentBasisOffset);
				gl.vertexAttribPointer(sp.vertexBitangentAttribute, 3, gl.FLOAT, false, meta.stride, meta.bitangentBasisOffset);
				gl.enableVertexAttribArray(sp.vertexTangentAttribute);
				gl.enableVertexAttribArray(sp.vertexBitangentAttribute);
			} else {
				gl.disableVertexAttribArray(sp.vertexTangentAttribute);
				gl.disableVertexAttribArray(sp.vertexBitangentAttribute);
			}
		}

		// color
		if (sp.vertexColorAttribute >= 0) {
			if (meta.hasColor) {
				gl.vertexAttribPointer(sp.vertexColorAttribute, 3, gl.FLOAT, false, meta.stride, meta.vertexColorOffset);
				gl.enableVertexAttribArray(sp.vertexColorAttribute);
			} else {
				gl.disableVertexAttribArray(sp.vertexColorAttribute);
			}
		}

		// size
		if (sp.vertexSizeAttribute >= 0) {
			if (meta.hasSize) {
				gl.vertexAttribPointer(sp.vertexSizeAttribute, 1, gl.FLOAT, false, meta.stride, meta.vertexSizeOffset);
				gl.enableVertexAttribArray(sp.vertexSizeAttribute);
			} else {
				gl.disableVertexAttribArray(sp.vertexSizeAttribute);
			}
		}

		var glPrimitiveMode;

		switch (this.composeMode) {
			case Tarumae.Mesh.ComposeModes.Points: glPrimitiveMode = gl.POINTS; break;
			case Tarumae.Mesh.ComposeModes.Lines: glPrimitiveMode = gl.LINES; break;
			case Tarumae.Mesh.ComposeModes.LineStrip: glPrimitiveMode = gl.LINE_STRIP; break;
			case Tarumae.Mesh.ComposeModes.LineLoop: glPrimitiveMode = gl.LINE_LOOP; break;
		
			default:
			case Tarumae.Mesh.ComposeModes.Triangles: glPrimitiveMode = gl.TRIANGLES; break;

			case Tarumae.Mesh.ComposeModes.TriangleStrip: glPrimitiveMode = gl.TRIANGLE_STRIP; break;
			case Tarumae.Mesh.ComposeModes.TriangleFan: glPrimitiveMode = gl.TRIANGLE_FAN; break;
		}

		if (renderer.wireframe && glPrimitiveMode != gl.LINES) {
			glPrimitiveMode = gl.LINE_STRIP;
		}
	
		if (this.indexed) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.meta.indexBufferId);
			gl.drawElements(glPrimitiveMode, meta.indexCount, gl.UNSIGNED_SHORT, 0);
		} else {
			gl.drawArrays(glPrimitiveMode, 0, meta.vertexCount);
		}
	}

	get boundingBox() {
		if (!this._boundingBox) {
			this._boundingBox = this.calcBoundingBox();
		}

		return {
			min: this._boundingBox.min.clone(),
			max: this._boundingBox.max.clone(),
		};
	}
	
	get polygonCount() {
		return this._polygonCount;
	}
	
};

Object.assign(Tarumae.Mesh.prototype, {

	hitTestByRay: function(ray, maxt, session, options) {
		'use strict';

		var vertices = undefined, vertexElementCount = 0;
		var normals = undefined, normalCount = 0;

		if (Array.isArray(this.vertices)) {
			vertices = this.vertices;
			normals = this.normals;
			vertexElementCount = this.vertices.length;
		}
		else if (this.vertexBuffer instanceof Float32Array) {
			vertices = this.vertexBuffer;
			vertexElementCount = this.meta.vertexCount * 3;
			normals = new Float32Array(this.vertexBuffer.buffer, this.vertexBuffer.byteOffset + vertexElementCount * 4);
		}

		if (this.indexed) {
			if (Array.isArray(this.indexes)) {
				vertexElementCount = this.indexes.length * 3;
			} else if (this.indexBuffer) {
				vertexElementCount = this.meta.indexCount * 3;
			} else {
				return null;
			}
		}
		
		// even not enough to compose a single triangle
		if (vertexElementCount < 9) return false;

		if (typeof options.allowUsingBoundingBox !== "boolean" || options.allowUsingBoundingBox === true) {
			var mmat = session.mmat;
			var bbox = this.boundingBox;

			bbox = Tarumae.BoundingBox.transformBoundingBox(bbox, mmat);

			if (!Tarumae.MathFunctions.rayIntersectsBox(ray, bbox)) {
				return null;
			}
		}

		var t = maxt;
		var hit = null;
		var worldPosition = null;
		var localPosition = null;
		
		switch (this.composeMode) {
			case Tarumae.Mesh.ComposeModes.Triangles:
				for (var i = 0; i < vertexElementCount; i += 9) {
					var out = this.hitTestByRayUsingVertexIndex(ray, vertices, normals, i, i + 3, i + 6, t, session, options);
					if (out != null) {
						t = out.t;
						hit = out.hit;
						worldPosition = out.worldPosition;
						localPosition = out.localPosition;
					}
				}
				break;

			case Tarumae.Mesh.ComposeModes.TriangleStrip:
				for (var i = 0; i < vertexElementCount - 6; i += 3) {
					var out = this.hitTestByRayUsingVertexIndex(ray, vertices, normals, i, i + 3, i + 6, t, session, options);
					if (out != null) {
						t = out.t;
						hit = out.hit;
						worldPosition = out.worldPosition;
						localPosition = out.localPosition;
					}
				}
				break;
		}

		return (hit == null) ? null : { t: t, hit: hit, worldPosition: worldPosition, localPosition: localPosition };
	},

	hitTestByRayUsingVertexIndex: (function() {
		'use strict';

		var nmat = new Tarumae.Matrix4();

		return function(ray, vertices, normals, i1, i2, i3, maxt, session, options) {

			if (this.indexed) {
				var indexes;

				if (Array.isArray(this.indexes)) {
					indexes = this.indexes;
				} else if (this.indexBuffer != null) {
					indexes = this.indexBuffer;
				}

				i1 = indexes[i1 / 3] * 3;
				i2 = indexes[i2 / 3] * 3;
				i3 = indexes[i3 / 3] * 3;
			}

			var v1 = new Vec4(vertices[i1], vertices[i1 + 1], vertices[i1 + 2], 1);
			var v2 = new Vec4(vertices[i2], vertices[i2 + 1], vertices[i2 + 2], 1);
			var v3 = new Vec4(vertices[i3], vertices[i3 + 1], vertices[i3 + 2], 1);

			var mmat = session.mmat;

			var vv1 = v1.mulMat(mmat).xyz();
			var vv2 = v2.mulMat(mmat).xyz();
			var vv3 = v3.mulMat(mmat).xyz();
		
			var out = Tarumae.MathFunctions.rayIntersectsTriangle(ray, { v1: vv1, v2: vv2, v3: vv3 }, maxt);

			if (out) {
				var f1 = vv1.sub(out.hit);
				var f2 = vv2.sub(out.hit);
				var f3 = vv3.sub(out.hit);

				var a = ((vv1.sub(vv2)).cross(vv1.sub(vv3))).length();
				var a1 = f2.cross(f3).length() / a;
				var a2 = f3.cross(f1).length() / a;
				var a3 = f1.cross(f2).length() / a;

				if (options.cullingSurfaceBack === true && (normals instanceof Float32Array || Array.isArray(normals))) {
				
					var n1 = new Vec4(normals[i1], normals[i1 + 1], normals[i1 + 2], 0);
					var n2 = new Vec4(normals[i2], normals[i2 + 1], normals[i2 + 2], 0);
					var n3 = new Vec4(normals[i3], normals[i3 + 1], normals[i3 + 2], 0);
					
					var vertexNormal = (n1.mul(a1)).add(n2.mul(a2)).add(n3.mul(a3));

					nmat.copyFrom(mmat).inverse().transpose();

					var normal = new Vec4(vertexNormal, 0).mulMat(nmat).xyz().normalize();

					if (Vec3.dot(session.rayNormalizedNegDir, normal) < 0) {
						return null;
					}
				}
			
				out.worldPosition = out.hit;
				out.localPosition = (v1.mul(a1)).add(v2.mul(a2)).add(v3.mul(a3)).xyz();

				return out;
			}
			
			return null;
		}
	})(),

	scaleTexcoords: function(scaleX, scaleY) {
		if (Array.isArray(this.texcoords)) {
			for (var i = 0; i < this.texcoords.length;) {
				this.texcoords[i++] *= scaleX;
				this.texcoords[i++] *= scaleY;
			}
		}
	},

	calcBoundingBox: function() {
		var vertices, vertexElementCount = 0;
		
		if (this.vertexBuffer && this.meta) {
			vertices = this.vertexBuffer;
			vertexElementCount = (this.meta.vertexCount || 0) * 3;
		} else if (Array.isArray(this.vertices)) {
			vertices = this.vertices;
			vertexElementCount = this.vertices.length;
		}

		var minx = 0, miny = 0, minz = 0, maxx = 0, maxy = 0, maxz = 0;

		if (vertices && vertexElementCount >= 3) {
			minx = maxx = vertices[0];
			miny = maxy = vertices[1];
			minz = maxz = vertices[2];
		
			for (var i = 3; i < vertexElementCount; i += 3) {
				var x = vertices[i], y = vertices[i + 1], z = vertices[i + 2];
				if (minx > x) minx = x;
				if (miny > y) miny = y;
				if (minz > z) minz = z;
				if (maxx < x) maxx = x;
				if (maxy < y) maxy = y;
				if (maxz < z) maxz = z;
			}
		}

		return {
			min: new Vec3(minx, miny, minz),
			max: new Vec3(maxx, maxy, maxz),
		};
	},

	getTranformedVerticesFromCache: function(transform) {
		if (!this.cachedTransformedVertices) {
			this.cachedTransformedVertices = [];

			var vertices, vertexElementCount = 0;
		
			if (this.vertexBuffer && this.meta) {
				vertices = this.vertexBuffer;
				vertexElementCount = (this.meta.vertexCount || 0) * 3;
			} else if (Array.isArray(this.vertices)) {
				vertices = this.vertices;
				vertexElementCount = this.vertices.length;
			}

			for (var i = 0; i < vertexElementCount; i += 9) {
				var v1 = new Vec4(vertices[i + 0], vertices[i + 1], vertices[i + 2], 1).mulMat(transform);
				var v2 = new Vec4(vertices[i + 3], vertices[i + 4], vertices[i + 5], 1).mulMat(transform);
				var v3 = new Vec4(vertices[i + 6], vertices[i + 7], vertices[i + 8], 1).mulMat(transform);

				this.cachedTransformedVertices.push(v1, v2, v3);
			}
		}
		
		return this.cachedTransformedVertices;
	},

	clearVertexCache: function() {
		this.cachedTransformedVertices = undefined;
	},

	clearNavmeshDataCache: function() {
		this.cachedNavmeshBorders = undefined;
	},

	getCacheTransformedVertexBorderPolygon: (function() {

		var isSameEdge = function(v1, v2, v3, v4) {
			return (Vec3.sub(v3, v1) < 0.00001 && Vec3.sub(v4, v2) < 0.00001);
		};

		return function() {
			var transformedVertices = this.getTranformedVerticesFromCache(transform);

			var points = [];

			for (var i = 0; i < transformedVertices.length; i += 3) {
				var v1 = transformedVertices[i], v2 = transformedVertices[i + 1], v3 = transformedVertices[i + 2];

				for (var k = 0; k < transformedVertices.length; k += 3) {
					var vv1 = transformedVertices[i], vv2 = transformedVertices[i + 1], vv3 = transformedVertices[i + 2];
				}
			}
		};
	})(),
	
	containsPointHorizontally: (function() {
		var cp1 = { x: 0, y: 0 }, cv1 = { x: 0, y: 0 }, cv2 = { x: 0, y: 0 }, cv3 = { x: 0, y: 0 };

		return function(p, transform) {
			var transformedVertices = this.getTranformedVerticesFromCache(transform);

			for (var i = 0; i < transformedVertices.length; i += 3) {
				var v1 = transformedVertices[i], v2 = transformedVertices[i + 1], v3 = transformedVertices[i + 2];

				cv1.x = v1.x; cv1.y = v1.z;
				cv2.x = v2.x; cv2.y = v2.z;
				cv3.x = v3.x; cv3.y = v3.z;
				cp1.x = p.x; cp1.y = p.z;

				if (Tarumae.MathFunctions.triangleContainsPoint2D(cv1, cv2, cv3, cp1)) {
					return true;
				}
			}
		
			return false;
		};
	})(),

	validateMovementUsingVertexData: (function() {

		var enumerateEdge = function(transformedVertices, iterator) {
			for (var i = 0; i < transformedVertices.length; i += 3) {
				var v1 = transformedVertices[i], v2 = transformedVertices[i + 1], v3 = transformedVertices[i + 2];

				if (iterator(i, { v1: v1, v2: v2, shared: false })) return true;
				if (iterator(i, { v1: v1, v2: v3, shared: false })) return true;
				if (iterator(i, { v1: v2, v2: v3, shared: false })) return true;
			}

			return false;
		};

		return function(loc, movement, options, transform) {
			options = options || {};
			var _this = this;

			if (this.cachedNavmeshBorders === undefined) {
				this.cachedNavmeshBorders = [];

				var transformedVertices = this.getTranformedVerticesFromCache(transform);

				var findSharedEdge = function(i, e1) {
					return enumerateEdge(transformedVertices, function(i2, e2) {
						return i !== i2
							&& ((e1.v1.almostSame(e2.v1) && e1.v2.almostSame(e2.v2))
								|| (e1.v1.almostSame(e2.v2) && e1.v2.almostSame(e2.v1)));
					});
				};

				enumerateEdge(transformedVertices, function(i, edge) {
					if (findSharedEdge(i, edge)) {
						edge.shared = true;
					} else {
						_this.cachedNavmeshBorders.push(edge);
					}
				});
			}
			
			var target = Vec3.add(loc, movement);
	
			if (!this.containsPointHorizontally(target, transform)) {

				if (options.detectMoveableDirection === false) {
					return false;
				}

				var hits = [];

				for (var i = 0; i < _this.cachedNavmeshBorders.length; i++) {
					var border = _this.cachedNavmeshBorders[i];

					var out = Tarumae.MathFunctions.lineIntersectsLine2D(loc.x, loc.z, target.x, target.z,
						border.v1.x, border.v1.z, border.v2.x, border.v2.z);
					
					if (out && out.ta >= 0 && out.ta <= 1 && out.tb >= 0 && out.tb <= 1) {
						out.v1 = border.v1;
						out.v2 = border.v2;
						out.hit = new Vec2(out.x, out.y);
						hits.push(out);
					}
				}

				if (hits.length > 0) {
					if (hits.length > 1) {
						hits.sort(function(a, b) { return a.ta - b.ta; });
					}

					var border = hits[0];
					
					var vmove = new Vec2(movement.x, movement.z);
					var movedir = vmove.normalize();

					var vborder = new Vec2(border.v2.x - border.v1.x, border.v2.z - border.v1.z);
					var borderdir = vborder.normalize();

					if (Vec2.dot(borderdir, movedir) < 0) {
						vborder = vborder.neg();
						borderdir = borderdir.neg();
					}

					var fixmove = borderdir.mul(Math.max(vmove.length(), 0));
				
					// FIXME: need to be optimized without searching mesh again
					if (!this.containsPointHorizontally(Vec3.add(loc, new Vec3(fixmove.x, 0, fixmove.y)), transform)) {
						return false;
					}
					
					movement.x = fixmove.x;
					movement.z = fixmove.y;
				}
			}

			return true;
		}
	})(),
});

Object.assign(Tarumae.Mesh, {

	ComposeModes: {
		Triangles: 0,
		TriangleStrip: 1,
		TriangleFan: 2,
		Points: 3,
		Lines: 4,
		LineStrip: 5,
		LineCount: 6,
	},

	HeaderFlags: {
		HasNormal: 0x2,
		HasTexcoord: 0x4,
		HasBoundingBox: 0x8,
		HasTangentBasisData: 0x10,
		HasColor: 0x20,
		HasLightmap: 0x40,
	},

	StructureTypes: {
		Array: 0,
		StructureArray: 1,
	},

	createFromStream: function(stream) {
		var mesh = new Tarumae.Mesh();
		mesh.loadFromStream(stream);
		return mesh;
	},

	translate: function(vertices, t) {
		if (!Array.isArray(vertices)) return;

		for (var i = 0; i < vertices.length; i += 3) {
			vertices[i] += t.x;
			vertices[i + 1] += t.y;
			vertices[i + 2] += t.z;
		}
	},

	flipNormals: function(normals) {
		if (!Array.isArray(normals)) return;

		for (var i = 0; i < normals.length; i++) {
			normals[i] = -normals[i];
		}
	},

	extend2d: function(vertices, axis) {
		// todo
	},

	rotate: (function() {
		var m = new Tarumae.Matrix4();
		var v = new Vec3();

		return function(mesh, x, y, z) {
			var vertices = mesh.vertices;
			var normals = mesh.normals;

			if (!Array.isArray(vertices) || vertices.length <= 0) {
				return;
			}
	
			var rotateMatrix = m.loadIdentity().rotate(x, y, z);

			// vertex
			for (var i = 0; i < vertices.length; i += 3) {
				v.x = vertices[i]; v.y = vertices[i + 1]; v.z = vertices[i + 2];
				v = v.mulMat(rotateMatrix);
				vertices[i] = v.x; vertices[i + 1] = v.y; vertices[i + 2] = v.z;
			}

			// normal
			for (var i = 0; i < normals.length; i += 3) {
				v.x = normals[i]; v.y = normals[i + 1]; v.z = normals[i + 2];
				v = v.mulMat(rotateMatrix);
				normals[i] = v.x; normals[i + 1] = v.y; normals[i + 2] = v.z;
			}
		};
	})(),
});

Tarumae.ParticleMesh = class extends Tarumae.Mesh {
	constructor(count = 100) {
		super();

		// this.vertexBuffer = new Float32Array();
		this.meta = {
			vertexCount: count,
			hasColor: true,
			stride: 0,
			vertexColorOffset: count * 3 * 4,
		};

		this.composeMode = Tarumae.Mesh.ComposeModes.Points;
		this.bufferDirty = true;

		// this.vertexArray = new ArrayBuffer(count * 2 * 3 * 4);
		this.vertexBuffer = new Float32Array(count * 2 * 3);
	}

	bind(renderer) {
		if (!this.meta || this.meta.vertexBufferId) return;

		this.meta.renderer = renderer;
		var gl = renderer.gl;

		this.meta.vertexBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.meta.vertexBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertexBuffer, gl.DYNAMIC_DRAW);
	}

	updateBuffer() {
		if (this.meta && this.meta.vertexBufferId) {
			var gl = this.meta.renderer.gl;
			if (gl) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.meta.vertexBufferId);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexBuffer);

				this.bufferDirty = false;
			}
		}
	}

	update() {
		this.bufferDirty = true;
	}

	draw(renderer) {
		if (!this.meta || !this.meta.vertexBufferId) {
			this.bind(renderer);

			if (!this.meta.vertexBufferId) {
				return;
			}
		}

		if (this.bufferDirty) {
			this.updateBuffer();

			if (this.bufferDirty) {
				return;
			}
		}

		super.draw.apply(this, arguments);
	}
};