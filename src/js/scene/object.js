////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
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
		this._normalTransform = new Tarumae.Matrix4().loadIdentity();

		this._suspendTransformUpdate = true;
		this._location = new Tarumae.ObjectVectorProperty(this, "onmove");
		this._angle = new Tarumae.ObjectVectorProperty(this, "onrotate");
		this._scale = new Tarumae.ObjectVectorProperty(this, "onscale", Vec3.One);
		this._worldLocation = Vec3.zero;
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

	_changePrototype(newproto) {
		this._location.obj = newproto;
		this._angle.obj = newproto;
		this._scale.obj = newproto;
	}

	get scene() {
		return this._scene;
	}

	set scene(val) {
		if (this._scene != val) {
			if (this._scene) {
				this._scene.onobjectRemove(this);
			}

			this._scene = val;
			this._scene.whenObjectAdd(this);
			this.onsceneChange(this._scene);
		}

		for (let i = 0; i < this.objects.length; i++) {
			const child = this.objects[i];
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

		const t = this._transform;

		if (this._parent) {
			t.copyFrom(this._parent._transform);
		} else {
			t.loadIdentity();
		}

		this._worldLocation = (new Vec4(this._location, 1.0).mulMat(t)).xyz();

		if (!this._location.equals(0, 0, 0)
			|| !this._angle.equals(0, 0, 0)
			|| !this._scale.equals(1, 1, 1)) {

			// TODO: merge transform calc
			t.translate(this._location._x, this._location._y, this._location._z);
			t.rotate(this._angle._x, this._angle._y, this._angle._z);
			t.scale(this._scale._x, this._scale._y, this._scale._z);
		}

		this._normalTransform.copyFrom(t);
		this._normalTransform.inverse().transpose();

		for (let i = 0; i < this.objects.length; i++) {
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

	move(x, y, z) {
		var movement = new Vec3(x, y, z);
		
		switch (this.collisionMode) {
			default:
				break;
	
			case Tarumae.CollisionModes.NavMesh:
				var navmesh = this.collisionTarget;
				if (navmesh && Array.isArray(navmesh.meshes) && navmesh.meshes.length > 0) {
					var mesh = navmesh.meshes[0];

					if (movement.x !== 0 || movement.y !== 0 || movement.z !== 0) {
						var worldLoc = this.worldLocation;
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
	}

	moveOffset(x, y, z) {
		this.location.set(this.location.x + x, this.location.y + y, this.location.z + z);
		if (this.scene) {
			this.scene.requireUpdateFrame();
		}
	}

	add(obj) {
		if (obj.parent) {
			obj.parent.remove(obj);
		}

		this.objects.push(obj);
		obj.parent = this;
		obj.updateTransform();

		const scene = this.scene;
	
		if (scene && obj._scene != scene) {
			obj.scene = scene;
		}
	}

	remove(child) {
		this.objects._t_remove(child);
		child.parent = null;

		var scene = this.scene;
		if (scene) {
			scene.onobjectRemove(child);
		}
	}

	addMesh(mesh) {
		if (mesh) {
			this.meshes._t_pushIfNotExist(mesh);
			this.onmeshAdd(mesh);
		}
	}

	removeMesh(mesh) {
		this.meshes._t_remove(mesh);
		this.onmeshRemove(mesh);
	}

	findObjectByName(name) {
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
	}

	findObjectsByType(type, options) {
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
	}

	// /*
	//  * Finds objects and children in this scene by given conditions. Returns null if nothing found.
	//  */
	// iterateObjects(handler) {
	// 	for (let i = 0; i < this.objects.length; i++) {
	// 		let obj = this.objects[i];
	// 		if (handler(obj)) yield obj;
	// 	}

	// 	for (let k = 0; k < this.objects.length; k++) {
	// 		let obj = this.objects[k];
	// 		obj.iterateObjects(handler);
	// 	}

	// 	return null;
	// }

	/*
	 * itearte over all children of this object,
	 * pass the object to specified iterator function.
	 */
	eachChild(iterator) {
		if (typeof iterator !== "function") return;
	
		for (let i = 0; i < this.objects.length; i++) {
			iterator(this.objects[i]);
		}

		for (let i = 0; i < this.objects.length; i++) {
			this.objects[i].eachChild(iterator);
		}
	}

	draw(renderer) {
		this.ondraw(renderer);
	}

	moveTo(loc, options, onfinish) {
		if (typeof loc !== "object") return;

		options = options || {};
		var _this = this;

		var startLocation = options.startLocation || this.worldLocation,
			startDirection, startUplook,
			endLocation = loc,
			endDirection, endUplook;

		var rotationMatrix;

		if (options.lookdir) {
			endDirection = options.lookdir || (options.lookObject ? options.lookObject.worldLocation : Vec3.forward);
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
	}
	
	getLookAt() {
		return this.getRotationMatrix(true).extractLookAtVectors();
	}

	/**
	 * Check whether this object is child object of specified object.
	 */
	childOf(parent) {
		var obj = this;
		while (obj.parent) {
			if (obj.parent == parent) {
				return true;
			}
			obj = obj.parent;
		}
		return false;
	}

	getTransformMatrix(selfTransform) {

		if (selfTransform) {
			return this._transform;
		}
			
		return this._parent ? this._parent._transform : Tarumae.Matrix4.Identity;
	}

	getRotationMatrix(selfRotate) {
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
	}

	get worldLocation() {
		return this._worldLocation;
	}

	getWorldRotation() {
		var m = this.getRotationMatrix(true);
		return Tarumae.MathFunctions.getEulerAnglesFromMatrix(m);
	}

	setWorldLocation(loc) {
		var m = this.getTransformMatrix().inverse();
		this.location = (new Vec4(loc, 1.0).mulMat(m)).xyz();
	}

	setWorldRotation(rot) {
		var m = this.getRotationMatrix().inverse();
		m.rotateZ(-rot.z);
		m.rotateY(-rot.y);
		m.rotateX(-rot.x);
		this.angle = m.inverse().extractEulerAngles();
	}

	/*
	 * Perform hit test from specified ray.
	 */
	hitTestByRay(ray, out) {
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
	}

	getBounds(options) {
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
	}

	setCustomProperties(value) {
		this._customProperties = value;
	}

	getCustomProperties() {
		return this._customProperties;
	}

	onmove() {
	}

	onrotate() {
	}

	onscale() {
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
				this.obj.updateTransform();
				if (this.changeEvent) this.changeEvent.call(this.obj);
			}	
		}
	}
	
	get y() { return this._y; }
	set y(val) {
		if (this._y !== val) {
			this._y = val;
			if (this.obj) {
				this.obj.updateTransform();
				if (this.changeEvent) this.changeEvent.call(this.obj);
			}	
		}
	}
		
	get z() { return this._z; }
	set z(val) {
		if (this._z !== val) {
			this._z = val;
			if (this.obj) {
				this.obj.updateTransform();
				if (this.changeEvent) this.changeEvent.call(this.obj);
			}	
		}
	}
		
	set(x, y, z) {
		if ((this._x !== x || this._y !== y || this._z !== z)) {
			this._x = x;
			this._y = y;
			this._z = z;
			if (this.obj) {
				this.obj.updateTransform();
				if (this.changeEvent) this.changeEvent.call(this.obj);
			}
		}
	}
	
	setVec3(v) {
		if (!this.equals(v)) {
			this._x = v.x;
			this._y = v.y;
			this._z = v.z;
			if (this.obj) {
				this.obj.updateTransform();
				if (this.changeEvent) this.changeEvent.call(this.obj);
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

	lookAt: (function() {
		var m;

		return function lookAt(target, up) {
			if (target instanceof Tarumae.SceneObject) {
				target = target.worldLocation;
			}

			if (typeof target !== "object") {
				return;
			}

			if (up === undefined) up = Vec3.up;
			if (m === undefined) m = new Tarumae.Matrix4();

			m.lookAt(this.worldLocation, target, up);
			this.angle = m.extractEulerAngles().neg();
		};
	})(),

	lookAtObject: function(obj, up) {
		return this.lookAt(obj.worldLocation, up);
	},

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


////////////////////////// GridLine //////////////////////////

Tarumae.GridLine = class extends Tarumae.SceneObject {
	constructor(gridSize, stride) {
		super();

		this.mat = { color: new Color3(0.7, 0.7, 0.7) };
		this.receiveLight = false;

		if (typeof gridSize === "undefined") {
			this.gridSize = 10.0;
		} else {
			this.gridSize = gridSize;
		}

		if (typeof stride === "undefined") {
			this.stride = 1.0;
		} else {
			this.stride = stride;
		}

		this.conflictWithRay = false;
		this.receiveLight = false;

		this.addMesh(Tarumae.GridLine.generateGridLineMesh(this.gridSize, this.stride));
	}
}

Tarumae.GridLine.generateGridLineMesh = function(gridSize, stride) {
	var width = gridSize, height = gridSize;

	var mesh = new Tarumae.Mesh();
	mesh.vertices = [];
	mesh.composeMode = Tarumae.Mesh.ComposeModes.Lines;

	for (var y = -height; y <= height; y += stride) {
		mesh.vertices.push(-width, 0, y);
		mesh.vertices.push(width, 0, y);
	}

	for (var x = -width; x <= width; x += stride) {
		mesh.vertices.push(x, 0, -height);
		mesh.vertices.push(x, 0, height);
	}

	return mesh;
};

////////////////////////// Billboard //////////////////////////

Tarumae.Billboard = class extends Tarumae.SceneObject {
	constructor(image) {
		super();
	
		if (Tarumae.BillboardMesh.instance == null) {
			Tarumae.BillboardMesh.instance = new Tarumae.BillboardMesh();
		}

		this.addMesh(Tarumae.BillboardMesh.instance);

		this.mat = { tex: null };
	
		if (typeof image === "string" && image.length > 0) {
			Tarumae.ResourceManager.download(image, Tarumae.ResourceTypes.Image, img => {
				this.mat.tex = new Tarumae.Texture(img);
				if (this.scene) {
					this.scene.requireUpdateFrame();
				}
			});
		} else if (image instanceof Image) {
			this.mat.tex = image;
		}
	
		this.targetCamera = null;
		this.cameraMoveListener = null;
		this.attachedScene = null;
		this.cameraChangeListener = null;

		this.on("sceneChange", scene => {
			if (scene) {
				this.targetCamera = scene.mainCamera;
				this.cameraMoveListener = this.targetCamera.on("move", function() {
					Tarumae.Billboard.faceToCamera(this, this.targetCamera);
				});

				this.attachedScene = scene;
				this.cameraChangeListener = scene.on("mainCameraChange", function() {
					Tarumae.Billboard.faceToCamera(this, this.targetCamera);
				});
			} else {
				if (this.targetCamera && this.cameraMoveListener) {
					this.targetCamera.removeEventListener("move", this.cameraMoveListener);
				}
				if (this.attachedScene && this.cameraChangeListener) {
					this.attachedScene.removeEventListener("mainCameraChange", this.cameraChangeListener);
				}

				this.targetCamera = null;
				this.cameraMoveListener = null;
				this.attachedScene = null;
				this.cameraChangeListener = null;
			}
		});

		this.shader = {
			name: "billboard",
		};
	}
};	

Tarumae.Billboard.faceToCamera = function(billboard, camera) {
	var cameraLoc = camera.worldLocation;
	var worldLoc = billboard.worldLocation;

	var diff = cameraLoc.sub(worldLoc);

	billboard.angle.y = Tarumae.MathFunctions.degreeToAngle(Math.atan2(diff.x, diff.z));
};

Tarumae.BillboardMesh = class extends Tarumae.Mesh {
	constructor() {
		super();

		this.meta = {
			vertexCount: 4,
			normalCount: 0,
			texcoordCount: 4
		};

		this.vertexBuffer = Tarumae.BillboardMesh.VertexBuffer;
		this.composeMode = Tarumae.Mesh.ComposeModes.TriangleStrip;
	}
};

Tarumae.BillboardMesh.instance = null;

Tarumae.BillboardMesh.VertexBuffer = new Float32Array([
	-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0, 0, 0, 0, 1, 1, 0, 1, 1
]);

////////////////////////// Light //////////////////////////

Tarumae.PointLight = class extends Tarumae.SceneObject {
	constructor() {
		super();

		this.mat = {
			emission: 1.0,
			color: new Color3(1.0, 0.95, 0.9),
		};

		this.type = Tarumae.ObjectTypes.PointLight;
	}
};
