////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec3, Vec4, Color3, Color4 } from "../math/vector";
import "../webgl/mesh";
import "../utility/event";
import "./material";

Tarumae.CollisionModes = {
	None: 0,
	BoundingBox: 1,
	Sphere: 2,
	Cylinder: 3,
	Mesh: 5,
	NavMesh: 6,
	Compound: 8,
	Custom: 9,
};

Tarumae.SceneObject = class {
	constructor() {		
		this._parent = undefined;
		this._scene = undefined;
		this._transform = new Tarumae.Matrix4().loadIdentity();

		// this._location = new Vec3(0, 0, 0);
		// this._angle = new Vec3(0, 0, 0);
		// this._scale = new Vec3(1, 1, 1);
		this._suspendTransformUpdate = true;
		this._location = new Tarumae.ObjectVectorProperty(this, this.onmove);
		this._angle = new Tarumae.ObjectVectorProperty(this, this.onrotate);
		this._scale = new Tarumae.ObjectVectorProperty(this, this.onscale, Vec3.One);
		this._suspendTransformUpdate = false;

		this.meshes = [];
		this.objects = [];

		this.shadowCast = true;
		this.receiveLight = true;
		this.visible = true;
		this.hitable = true;

		this.collisionMode = Tarumae.CollisionModes.BoundingBox;
		this.collisionTarget = null;
		this.radiyBody = null;

		this.isSelected = false;
	}

	get scene() {
		return this._scene;
	}

	set scene(val) {
		if (this._scene != val) {
			this._scene = val;
			this.onsceneChange(this._scene);
		}

		for (let i = 0; i < this.objects.length; i++) {
			var child = this.objects[i];
			if (child._scene != this._scene) {
				child.scene = this._scene;
			}
		}
	}

	get location() { return this._location; }
	set location(value) { this._location.setVec3(value); }

	get angle() { return this._angle; }
	set angle(value) { this._angle.setVec3(value); }
	
	get scale() { return this._scale; }
	set scale(value) { this._scale.setVec3(value); }

	get parent() { return this._parent; }
	set parent(value) {
		if (this._parent != value) {
			this._parent = value;
			this.onparentChange();
		}
	}

	get polygonCount() {
		if (!Array.isArray(this.meshes)) return 0;
			
		let polygonCount = 0;
		for (let i = 0; i < this.meshes.length; i++) {
			polygonCount += this.meshes[i].polygonCount;
		}

		return polygonCount;
	}

	updateTransform() {
		if (this._suspendTransformUpdate) return;

		var t = this._transform;

		if (this._parent) {
			t.copyFrom(this._parent._transform);
		} else {
			t.loadIdentity();
		}

		if (!this._location.equals(0, 0, 0)
			|| !this._angle.equals(0, 0, 0)
			|| !this._scale.equals(1, 1, 1)) {

			t.translate(this._location._x, this._location._y, this._location._z);
			t.rotate(this._angle._x, this._angle._y, this._angle._z);
			t.scale(this._scale._x, this._scale._y, this._scale._z);
		}

		for (var i = 0; i < this.objects.length; i++) {
			this.objects[i].updateTransform();
		}

	}

	clone() {
		return Tarumae.SceneObject.clone(this);
	}

	static clone(obj) {
		let newObj = new Tarumae.SceneObject();
		
		newObj._suspendTransformUpdate = true;

		newObj.location = obj.location;
		newObj.angle = obj.angle;
		newObj.scale = obj.scale;

		newObj.visible = obj.visible;
		newObj.shadowCast = obj.shadowCast;
		newObj.receiveLight = obj.receiveLight;

		newObj.collisionMode = obj.collisionMode;
		newObj.collisionTarget = obj.collisionTarget;
		newObj.radiyBody = obj.radiyBody;
		newObj.isSelected = obj.isSelected;
		newObj.wireframe = obj.wireframe;

		newObj._transform = obj._transform;

		newObj.mat = Tarumae.Material.clone(obj.mat);
		
		for (const mesh of obj.meshes) {
			newObj.addMesh(mesh);
		}

		for (const newChild of obj.objects) {
			newObj.add(newChild);
		}

		newObj._suspendTransformUpdate = false;	
		newObj.updateTransform();

		return newObj;
	}
};

new Tarumae.EventDispatcher(Tarumae.SceneObject).registerEvents(
	"mousedown", "mouseup", "mouseenter", "mouseout", 
	"begindrag", "drag", "enddrag",
	"move", "rotate", "scale",
	"draw", 
	"add", "sceneChange", "parentChange",
	"meshAdd", "meshRemove");

Tarumae.ObjectVectorProperty = class extends Vec3 {
	constructor(obj, eventName, defValue) {
		super();

		this.obj = obj;

		if (defValue) {
			this.setVec3(defValue);
		} else {
			this._x = 0;
			this._y = 0;
			this._z = 0;
		}	
	
		if (eventName) {
			this.eventName = eventName;
			this.changeEvent = obj[eventName];
		}
	}
	
	get x() { return this._x; }
	set x(val) {
		if (this._x !== val) {
			this._x = val;
			if (this.obj) {
				if (this.changeEvent) this.changeEvent.call(this.obj);
				this.obj.updateTransform();
			}	
		}
	}
	
	get y() { return this._y; }
	set y(val) {
		if (this._y !== val) {
			this._y = val;
			if (this.obj) {
				if (this.changeEvent) this.changeEvent.call(this.obj);
				this.obj.updateTransform();
			}	
		}
	}
		
	get z() { return this._z; }
	set z(val) {
		if (this._z !== val) {
			this._z = val;
			if (this.obj) {
				if (this.changeEvent) this.changeEvent.call(this.obj);
				this.obj.updateTransform();
			}	
		}
	}
		
	set(x, y, z) {
		if ((this._x !== x || this._y !== y || this._z !== z)) {
			this._x = x;
			this._y = y;
			this._z = z;
			if (this.obj) {
				if (this.changeEvent) this.changeEvent.call(this.obj);
				this.obj.updateTransform();
			}
		}
	}
	
	setVec3(v) {
		if (!this.equals(v)) {
			this._x = v.x;
			this._y = v.y;
			this._z = v.z;
			if (this.obj) {
				if (this.changeEvent) this.changeEvent.call(this.obj);
				this.obj.updateTransform();
			}	
		}
	}
	
};

Object.defineProperties(Tarumae.SceneObject.prototype, {

	// "angle": {
	// 	get: function() { return this._angle; },
	// 	set: function(value) { this._angle.setVec3(value); },
	// 	enumerable: false,
	// },
	// "location": {
	// 	get: function() {
	// 		return this._location;
	// 	},
	// 	set: function(value) {
	// 		// Vec3 object should be copied rather than set reference directly (treat as struct)
	// 		if (typeof value === "object" && typeof value.clone === "function") {
	// 			this._location = value.clone();
	// 		}
	// 		else {
	// 			this._location = value;
	// 		}
	// 	},
	// 	enumerable: false,
	// },

	// "angle": {
	// 	get: function() {
	// 		return this._angle;
	// 	},
	// 	set: function(value) {
	// 		// Vec3 object should be copied rather than set reference directly (treat as struct)
	// 		if (typeof value === "object" && typeof value.clone === "function") {
	// 			this._angle = value.clone();
	// 		}
	// 		else {
	// 			this._angle = value;
	// 		}
	// 	},
	// 	enumerable: false,
	// },

	// "scale": {
	// 	get: function() {
	// 		return this._scale;
	// 	},
	// 	set: function(value) {
	// 		// Vec3 object should be copied rather than set reference directly (treat as struct)
	// 		if (typeof value === "object" && typeof value.clone === "function") {
	// 			this._scale = value.clone();
	// 		}
	// 		else {
	// 			this._scale = value;
	// 		}
	// 	},
	// 	enumerable: false,
	// },

});

Object.assign(Tarumae.SceneObject.prototype, {

	move: function(x, y, z) {
		var movement = new Vec3(x, y, z);
		
		switch (this.collisionMode) {
			default:
				break;
	
			case Tarumae.CollisionModes.NavMesh:
				var navmesh = this.collisionTarget;
				if (navmesh && Array.isArray(navmesh.meshes) && navmesh.meshes.length > 0) {
					var mesh = navmesh.meshes[0];

					if (movement.x !== 0 || movement.y !== 0 || movement.z !== 0) {
						var worldLoc = this.getWorldLocation();
						var transform = navmesh.getTransformMatrix(true);

						var scene = this.scene;
						var rdebugger = (scene && scene.renderer && scene.renderer.debugMode) ? scene.renderer.debugger : undefined;
						
						if (rdebugger) {
							rdebugger.beforeNavmeshMovementCheck();
						}

						var result = mesh.validateMovementUsingVertexData(worldLoc, movement, this.collisionOption, transform);
						
						if (rdebugger) {
							rdebugger.afterNavmeshMovementCheck();
						}
						
						if (!result) return false;
					}
				}
				break;
		}
		
		if (movement.x !== 0 || movement.y !== 0 || movement.z !== 0) {
			this.location.offset(movement);
			if (this.scene) this.scene.requireUpdateFrame();
			this.onmove();
		}

		return true;
	},

	moveOffset: function(x, y, z) {
		return this._changeLocation(this.location.x + x, this.location.y + y, this.location.z + z);
	},

	forward: (function() {
		var defaultOptions = {
			animation: true,
			speed: 0.02,
		};

		return function(distance, options) {
			if (options && typeof options === "object") {
				Object.setPrototypeOf(options, defaultOptions);
			} else {
				options = defaultOptions;
			}
		
			var obj = this;
			var dir = obj.getLookAt().dir;

			if (typeof options.ignoreUpwardDirection === "undefined" || options.ignoreUpwardDirection === true) {
				dir.y = 0;
				dir = dir.normalize();
			}

			if (options.animation === false) {
				obj.move(dir.x * distance, 0, dir.z * distance);
			} else {
				var steps = Math.abs(distance / options.speed);
				var stepsInv = 1 / steps;
				var i = 0;

				function updateFrame() {
					if (i++ < steps) {
						var s = Math.sin(i * stepsInv * Math.PI);
						s = s * s * distance * options.speed * 2;
						obj.move(dir.x * s, 0, dir.z * s);
						requestAnimationFrame(updateFrame);
					}
				}
				requestAnimationFrame(updateFrame);
			}
		};
	})(),	

	backward: function(distance, options) {
		return this.forward(-distance, options);
	},

	add: function(child) {
		if (child.parent) {
			child.parent.remove(child);
		}

		this.objects.push(child);
		child.parent = this;
		child.updateTransform();

		var scene = this.scene;
	
		if (scene && child._scene != scene) {
			child.scene = scene;
			scene.onobjectAdd(child);
		}
	},

	remove: function(child) {
		this.objects._s3_remove(child);
		child.parent = null;

		var scene = this.scene;
		if (scene) {
			scene.onobjectRemove(child);
		}
	},

	addMesh: function(mesh) {
		if (mesh) {
			this.meshes._s3_pushIfNotExist(mesh);
			this.onmeshAdd(mesh);
		}
	},

	removeMesh: function(mesh) {
		this.meshes._s3_remove(mesh);
		this.onmeshRemove(mesh);
	},

	findObjectByName: function(name) {
		var obj, i;

		for (i = 0; i < this.objects.length; i++) {
			obj = this.objects[i];
			if (obj.name == name) return obj;
		}

		for (i = 0; i < this.objects.length; i++) {
			obj = this.objects[i];
			var child = obj.findObjectByName(name);
			if (child) return child;
		}

		return null;
	},

	findObjectsByType: function(type, options) {
		type = (type || Tarumae.ObjectTypes.GenericObject);
		options = options || {};
		
		var arr = [], i, obj;

		for (i = 0; i < this.objects.length; i++) {
			obj = this.objects[i];
			if (obj.type == type) {
				if (typeof options.filter === "undefined" || options.filter(obj)) {
					arr.push(obj);
				}
			}	
		}

		for (i = 0; i < this.objects.length; i++) {
			obj = this.objects[i];
			arr = arr.concat(obj.findObjectsByType(type, options));
		}

		return arr;
	},

	/*
	 * itearte over all children of this object,
	 * pass the object to specified iterator function.
	 */
	eachChild: function(iterator) {
		if (typeof iterator !== "function") return;
	
		for (var i = 0; i < this.objects.length; i++) {
			var obj = this.objects[i];
			iterator(obj);
		}

		for (i = 0; i < this.objects.length; i++) {
			this.objects[i].eachChild(iterator);
		}
	},

	draw: function(renderer) {
		this.ondraw(renderer);
	},

	lookAt: (function() {
		var m;

		return function lookAt(target, up) {
			if (target instanceof Tarumae.SceneObject) {
				target = target.getWorldLocation();
			}

			if (typeof target !== "object") {
				return;
			}

			if (up === undefined) up = Vec3.up;
			if (m === undefined) m = new Tarumae.Matrix4();

			m.lookAt(this.getWorldLocation(), target, up);
			this.angle = m.extractEulerAngles().neg();
		};
	})(),

	lookAtObject: function(obj, up) {
		return this.lookAt(obj.getWorldLocation(), up);
	},

	moveTo: function(loc, options, onfinish) {
		if (typeof loc !== "object") return;

		options = options || {};
		var _this = this;

		var startLocation = options.startLocation || this.getWorldLocation(),
			startDirection, startUplook,
			endLocation = loc,
			endDirection, endUplook;

		var rotationMatrix;

		if (options.lookdir) {
			endDirection = options.lookdir || (options.lookObject ? options.lookObject.getWorldLocation() : Vec3.forward);
		}

		if (options.lookup) {
			endUplook = options.up || options.lookup || Vec3.up;
		} else if (options.lookdir) {
			endUplook = Vec3.up;
		}

		if (options.startLookdir && endDirection) {
			startDirection = options.startLookdir;
		} else {
			if (rotationMatrix === undefined) rotationMatrix = this.getRotationMatrix(true);
			startDirection = new Vec3(rotationMatrix.c1, rotationMatrix.c2, -rotationMatrix.c3).normalize();
		}

		if (startDirection && endDirection && options.startLookup && endUplook) {
			startUplook = options.startLookup;
		} else {
			if (rotationMatrix === undefined) rotationMatrix = this.getRotationMatrix(true);
			startUplook = new Vec3(rotationMatrix.b1, rotationMatrix.b2, -rotationMatrix.b3).normalize();
		}
		
		if (typeof options.animation !== "boolean" || options.animation === true) {
			this.scene.animate(options, function(t) {

				var newLocation = Vec3.lerp(startLocation, endLocation, t);
				var diff = Vec3.sub(newLocation, _this.location);
				_this.move(diff.x, diff.y, diff.z);

				if (startDirection && endDirection) {
					_this.lookAt(
						Vec3.add(_this.location, Vec3.lerp(startDirection, endDirection, t)),
						Vec3.lerp(startUplook, endUplook, t));
				}

				if (typeof options.onframe === "function") {
					options.onframe.call(_this, t);
				}

			}, function() {
				if (typeof onfinish === "function") {
					onfinish();
				}
			});
		} else {
			this.location = endLocation;
			this.lookAt(endDirection, endUplook);
		}
	},

	getLookAt: function() {
		return this.getRotationMatrix(true).extractLookAtVectors();
	},

	/**
	 * Check whether this object is child object of specified object.
	 */
	childOf: function(parent) {
		var obj = this;
		while (obj.parent) {
			if (obj.parent == parent) {
				return true;
			}
			obj = obj.parent;
		}
		return false;
	},

	getTransformMatrix: function(selfTransform) {

		if (selfTransform) {
			return this._transform;
		}
			
		return this._parent ? this._parent._transform : Tarumae.Matrix4.Identity;
		
		// var plist = [];
		// var parent = this.parent;

		// while (parent) {
		// 	plist.push(parent);
		// 	parent = parent.parent;
		// }

		// var m = new Tarumae.Matrix4().loadIdentity();

		// for (var i = plist.length - 1; i >= 0; i--) {
		// 	var obj = plist[i];

		// 	m.translate(obj.location.x, obj.location.y, obj.location.z)
		// 		.rotate(obj.angle.x, obj.angle.y, obj.angle.z)
		// 		.scale(obj.scale.x, obj.scale.y, obj.scale.z);
		// }

		// if (selfTransform === true) {
		// 	m.translate(this.location.x, this.location.y, this.location.z)
		// 		.rotate(this.angle.x, this.angle.y, this.angle.z)
		// 		.scale(this.scale.x, this.scale.y, this.scale.z);
		// }

		// return m;
	},

	getRotationMatrix: function(selfRotate) {
		var plist = [];
		var parent = this.parent;

		while (parent) {
			plist.push(parent);
			parent = parent.parent;
		}

		var m = new Tarumae.Matrix4().loadIdentity();

		for (var i = plist.length - 1; i >= 0; i--) {
			var obj = plist[i];

			m.rotate(obj.angle.x, obj.angle.y, obj.angle.z);
		}

		if (selfRotate === true) {
			m.rotate(this.angle.x, this.angle.y, this.angle.z);
		}

		return m;
	},

	getWorldLocation: function() {
		var m = this.getTransformMatrix();
		return (new Vec4(this.location, 1.0).mulMat(m)).xyz();
	},

	getWorldRotation: function() {
		var m = this.getRotationMatrix(true);
		return Tarumae.MathFunctions.getEulerAnglesFromMatrix(m);
	},

	setWorldLocation: function(loc) {
		var m = this.getTransformMatrix().inverse();
		this.location = (new Vec4(loc, 1.0).mulMat(m)).xyz();
	},

	setWorldRotation: function(rot) {
		var m = this.getRotationMatrix().inverse();
		m.rotateZ(-rot.z);
		m.rotateY(-rot.y);
		m.rotateX(-rot.x);
		this.angle = m.inverse().extractEulerAngles();
	},

	/*
	 * Perform hit test with specified ray.
	 */
	hitTestByRay: function(ray, out) {
		if (typeof this.radiyBody === "object" && this.radiyBody !== null) {
			var type = "cube";

			if (typeof this.radiyBody.type !== "undefined") {
				type = this.radiyBody.type;
			}

			switch (type) {
				default:
				case "box":
					break;

				case "plane":
					var triangle = this.radiyBody.vertices;
					if (triangle) {
						if (Array.isArray(triangle)) {
							triangle = { v1: triangle[0], v2: triangle[1], v3: triangle[2] };
						}
					
						var planeVectors = {
							v1: new Vec4(triangle.v1, 1.0).mulMat(this._transform).xyz(),
							v2: new Vec4(triangle.v2, 1.0).mulMat(this._transform).xyz(),
							v3: new Vec4(triangle.v3, 1.0).mulMat(this._transform).xyz(),
						};
						
						var hit = Tarumae.MathFunctions.rayIntersectsPlane(ray, planeVectors, 99999);

						if (hit) {
							out.t = hit.t;

							var f1 = planeVectors.v1.sub(hit.hit);
							var f2 = planeVectors.v2.sub(hit.hit);
							var f3 = planeVectors.v3.sub(hit.hit);

							var a = ((planeVectors.v1.sub(planeVectors.v2)).cross(planeVectors.v1.sub(planeVectors.v3))).length();
							var a1 = f2.cross(f3).length() / a;
							var a2 = f3.cross(f1).length() / a;
							var a3 = f1.cross(f2).length() / a;
					
							out.localPosition = (triangle.v1.mul(a1)).add(triangle.v2.mul(a2)).add(triangle.v3.mul(a3));
							
							return true;
						}
						
						return false;
					}
					break;

				case "sphere":
					{
						var radius = 0.1;

						if (typeof this.radiyBody.radius !== "undefined") {
							radius = this.radiyBody.radius;
						}

						var loc = new Vec4(0, 0, 0, 1).mulMat(this._transform).xyz();

						var inSphere = Tarumae.MathFunctions.rayIntersectsSphere(ray, { origin: loc, radius: radius }, out);
						if (inSphere) out.t = 0;

						return inSphere;
					}
					break;
			}
		}
	},

	getBounds: function(options) {
		var bbox, i;

		// scan meshes
		if (Array.isArray(this.meshes)) {
			for (i = 0; i < this.meshes.length; i++) {
				bbox = Tarumae.BoundingBox.findBoundingBoxOfBoundingBoxes(bbox, this.meshes[i].boundingBox);
			}
		}
	
		if (bbox) {
			bbox = Tarumae.BoundingBox.transformBoundingBox(bbox, this._transform);
		}

		// scan children
		if (Array.isArray(this.objects)) {
			for (i = 0; i < this.objects.length; i++) {
				var object = this.objects[i];
				
				if (typeof object.visible !== "undefined" && object.visible) {
					var objectBBox = object.getBounds();
					
					if (!options || !options.filter || options.filter(object)) {
						bbox = Tarumae.BoundingBox.findBoundingBoxOfBoundingBoxes(bbox, objectBBox);
					}
				}
			}
		}

		return bbox;
	},

	setCustomProperties: function(value) {
		this._customProperties = value;
	},

	getCustomProperties: function() {
		return this._customProperties;
	}
});

Tarumae.SceneObject.scanTransforms = function(parent, handler) {

	for (var i = 0; i < parent.objects.length; i++) {
		var obj = parent.objects[i];

		handler(obj, obj._transform);

		if (obj.objects.length > 0) {
			this.scanTransforms(obj, handler);
		}
	}
};

////////////////////////// Sun //////////////////////////

Tarumae.Sun = class extends Tarumae.SceneObject {
	constructor() {
		super();

		this.visible = false;
	}
};

//////////////////// ParticleObject ////////////////////

Tarumae.ParticleObject = class extends Tarumae.SceneObject {
	constructor() {
		super();
	}
};