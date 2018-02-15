////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"
import "../utility/event"
import { Vec3, Color3 } from "../math/vector"
import "../math/matrix"
import "../scene/renderer"
import "../scene/object"
import "../scene/camera"
import "../webgl/texture"
import "../webgl/cubemap"

Tarumae.Scene = class {
	constructor(renderer) {
		this.renderer = renderer;

		this.objects = [];
		this.hoverObject = null;
		this.selectedObjects = [];

		this.hitObject = null;
		this.draggingObject = null;

		this.models = {};
		this.materials = {};
		this._refmaps = {};
		this.archives = {};
		this._archives = {};

		this.resourceManager = new Tarumae.ResourceManager();
		this.animation = false;
		this.requestedUpdateFrame = true;

		// main camera
		if (typeof Tarumae.Camera === 'function') {
			this.mainCamera = new Tarumae.Camera();
			this.mainCamera.location.set(0, 1.5, 6);
			this.mainCamera.angle.x = -5;
			this.add(this.mainCamera);
		}

		// sun
		if (typeof Tarumae.Sun === 'function') {
			this.sun = new Tarumae.Sun();
			this.sun.location = new Vec3(10, 20, 5);
		}

		this.shadowMap = null;
		this.skycube = null;
	}

	createObjectFromArchive(archive, childName) {
		var manifestData = archive.getChunkData(0x1, 0x6e6f736a);
		if (manifestData) {
			var manifest = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(manifestData)));
			
			var _archives = manifest._archives;

			if (_archives) {
				_archives._s3_foreach((name, arinfo) => {

					if (arinfo.url === "__this__") {
						arinfo.url = archive.url;
						arinfo.name = name;
						arinfo.archive = archive;

						this._archives[name] = arinfo;
					}
				});
			}

			this.load(manifest);
		}
	}
	
	createObjectFromURL(url, handler, childName) {
		var archive = this._archives[url];
			
		if (archive) {
			this.createObjectFromArchive(archive, childName);
		} else {
	
			Tarumae.ResourceManager.download(url, Tarumae.ResourceTypes.Binary, buffer => {
				var archive = new Tarumae.Utility.Archive();
				archive.url = url;
				archive.loadFromStream(buffer);
				this.createObjectFromArchive(archive, childName);
			});
		};
	}

	load() {
	
		var loadingSession = new Tarumae.ObjectsLoadingSession(this.resourceManager);
		
		for (var i = 0; i < arguments.length; i++) {
			var obj = arguments[i];
	
			if (obj === null || obj === undefined) continue;
	
			var _archives = obj._archives;
			if (_archives) {
				this.loadArchives(_archives, loadingSession);
			}
			
			var _materials = obj._materials;
			if (_materials) {
				this.loadMaterials(_materials, loadingSession);
			}
	
			var _refmaps = obj._refmaps;
			if (_refmaps) {
				this.loadReflectionMaps(_refmaps, loadingSession);
			}
	
			this.prepareObjects(obj, loadingSession);
			this.objects.push(obj);
			obj.scene = this;
		}
	
		this.resourceManager.load();

		this.requireUpdateFrame();
	
		// add callback
		for (var k = 0; k < arguments.length; k++) {
			this.onobjectAdd(arguments[k]);
		}
	
		return loadingSession;
	}

	loadArchives(archs, loadingSession) {
		var _this = this;
	
		var loadArchive = function(aName, aValue) {
			if (!aValue.archive) {
				aValue.name = aName;
				_this._archives[aName] = aValue;
	
				var archive = new Tarumae.Utility.Archive();
				archive.isLoading = true;
	
				aValue.archive = archive;
				loadingSession.downloadArchives.push(archive);
			
				loadingSession.rm.add(aValue.url, Tarumae.ResourceTypes.Binary, function(stream) {
					try {
						archive.loadFromStream(stream);
					} catch (e) { }
					archive.isLoading = false;
				}, function(e) {
					archive.dataLength = e.total;
					archive.loadingLength = e.loaded;
			
					if (loadingSession) loadingSession.progress();
				});
			}
		};
		
		archs._s3_foreach(loadArchive);
	}

	add() {
		for (var i = 0; i < arguments.length; i++) {
			var obj = arguments[i];
			if (obj !== null && obj !== undefined) {
				this.objects._s3_pushIfNotExist(obj);
			}	
		}
		this.requireUpdateFrame();
	}

	show() {
		this.renderer.showScene(this);
		this.requireUpdateFrame();
	}


}

// Event declarations
new Tarumae.EventDispatcher(Tarumae.Scene).registerEvents(
	"mousedown", "mouseup", "mousemove", "mousewheel",
	"begindrag", "drag", "enddrag",
	"keyup", "keydown",
	"objectAdd", "objectRemove", "mainCameraChange",
	"frame");

var Scene = Tarumae.Scene;

Scene.prototype.addRes = function(url, type) {
	this.resourceManager.add(url, type);
};

Scene.prototype.getRes = function(name) {
	return this.resourceManager.get(name);
};

Scene.prototype.destroy = function() {
	// todo: destroy all objects and meshes that use the resources 
	// 			 downloaded and created from this scene
};

Scene.prototype.drawSky = function() {
	var gl = this.renderer.gl;
	var x = this.renderer.canvas.width / this.renderer.canvas.height;
	this.projectMatrix.ortho(-x, x, -1, 1, -1, 1);
};

Scene.prototype.drawFrame = function(renderer) {
	this.onframe(renderer);
	this.requestedUpdateFrame = false;
};

Scene.prototype.requireUpdateFrame = function() {
	this.requestedUpdateFrame = true;
};

Scene.prototype.loadMaterials = function(mats, loadingSession) {
	var _this = this;

	var iterateMaterials = function(mName, mValue) {
		mValue.name = mName;
		_this.materials[mName] = mValue;
		_this.prepareMaterialObject(mValue, loadingSession.rm, loadingSession);
	};
	
	mats._s3_foreach(iterateMaterials);
};

Scene.prototype.loadReflectionMaps = function(refmaps, loadingSession) {
	var _this = this;

	var datafileUrl = refmaps._datafile;
	// loadingSession.rm.add(maps[i], Tarumae.ResourceTypes.Binary, function(stream) {
	// 	var header = new Int32Array(stream);
	// 	var res = header[2];
	// 	var faceDataLength = res * res * 3 * 4;
	// 	var probeDataLength = faceDataLength * 6;

	// 	var facedata = new Float32Array(stream, header[0]);
		
	// 	refmaps._s3_foreach(function(pName, pValue) {
	// 		if (pName == "_datafile") return;
	// 		pValue.cubemap.setFaceData();
	// 	});
	// });

	var iterateReflectionMap = function(pName, pValue) {
		if (pName == "_datafile") return;

		pValue.name = pName;
		pValue.cubemap = new Tarumae.CubeMap(_this.renderer);

		var bbmin = Vec3.fromArray(pValue.bounds.min);
		var bbmax = Vec3.fromArray(pValue.bounds.max);
		pValue.cubemap.bbox = new Tarumae.BoundingBox(bbmin, bbmax);
		_this._refmaps[pName] = pValue;

		if (!datafileUrl) {
			pValue.downloadedImageCount = 0;
		
			var maps = pValue.maps;
			var dataUrl = pValue.data;
			var rm = loadingSession.rm;

			if (maps) {
				for (var i = 0; i < maps.length; i++) {
					rm.add(maps[i], Tarumae.ResourceTypes.Image, function() {
						pValue.downloadedImageCount++;

						if (pValue.downloadedImageCount >= 6) {
							pValue.cubemap.setImages([
								rm.get(maps[0]), rm.get(maps[1]), rm.get(maps[2]),
								rm.get(maps[3]), rm.get(maps[4]), rm.get(maps[5]),
							]);
						}
					});
				}
			} else if (dataUrl) {

				var loadedHandler = function(buffer) {
					pValue.cubemap.setRawData(buffer);
				};

				if (!Tarumae.Utility.Archive.canLoadFromArchive(_this, dataUrl, loadedHandler)) {
					rm.add(dataUrl, Tarumae.ResourceTypes.Binary, loadedHandler);
				}
			}
		}
	};

	refmaps._s3_foreach(iterateReflectionMap);
};

Scene.prototype.remove = function(obj) {
	if (!obj) return;

	// if object has parent, remove from its parent
	if (obj.parent) {
		obj.parent.remove(obj);
	} else if (this.objects._s3_contains(obj)) {
		// else remove from current scene
		this.objects._s3_remove(obj);
		obj.parent = null;
		obj.scene = null;
	}

	this.onobjectRemove(obj);
};

Scene.prototype.selectObject = function(obj) {
	this.selectedObjects._s3_pushIfNotExist(obj);
	obj.isSelected = true;
};

Scene.prototype.deselectObject = function(obj) {
	this.selectedObjects._s3_remove(obj);
	obj.isSelected = false;
};

Scene.prototype.removeAllSelectedObjects = function() {
	for (var i = 0; i < this.selectedObjects.length; i++) {
		this.remove(this.selectedObjects[i]);
	}

	this.selectedObjects._s3_clear();
	this.requireUpdateFrame();
};

Scene.prototype.createMeshFromURL = function(url, handler, rm) {
	var renderer = this.renderer;

	var cachedMesh = renderer.cachedMeshes[url];
	if (cachedMesh && typeof handler === "function") {
		handler(cachedMesh);
		return;
	}

	if (rm === undefined) {
		rm = this.resourceManager;
	}
	
	rm.add(url, Tarumae.ResourceTypes.Binary, function(stream) {
		var mesh = renderer.cachedMeshes[url];
		
		if (!mesh && stream) {
			mesh = new Tarumae.Mesh();
			mesh.loadFromStream(stream);
		}

		if (mesh) {
			renderer.cachedMeshes[url] = mesh;
		}

		if (typeof handler === "function") {
			handler(mesh);
		}
	});

	rm.load();
};

Scene.prototype.createTextureFromURL = function(url, handler) {
	var renderer = this.renderer;

	var cachedTexture = renderer.cachedTextures[url];
	if (cachedTexture && typeof handler === "function") {
		handler(cachedTexture);
		return;
	}

	this.resourceManager.add(url, Tarumae.ResourceTypes.Image, function(stream) {
		var texture = renderer.cachedTextures[url];
		
		if (!texture && stream) {
			texture = new Tarumae.Texture(stream);
		}

		if (texture) {
			renderer.cachedTextures[url] = texture;
		}

		if (typeof handler === "function") {
			handler(texture);
		}
	});

	this.resourceManager.load();
};

Scene.prototype.prepareObjectMesh = function(obj, name, value, loadingSession) {
	var scene = this;

	var rm = loadingSession.rm || this.resourceManager;
			
	if (typeof value === "string" && value.length > 0) {
		if (scene.renderer.cachedMeshes.hasOwnProperty(value)) {
			var mesh = scene.renderer.cachedMeshes[value];
			obj.addMesh(mesh);
			if (typeof name === "string") {
				obj[name] = mesh;
			}
		} else {
			if (loadingSession) loadingSession.resourceMeshCount++;

			var loadedHandler = function(buffer, archive, uid) {
				if (loadingSession) {
					loadingSession.downloadMeshCount++;
					loadingSession.progress();
				}
			
				var mesh = scene.prepareObjectMeshFromURLStream(obj, value, buffer, loadingSession);

				if (mesh) {
					if (archive && mesh._lightmapTrunkId) {
						if (mesh._lightmapType === 1) {
							var lightmapData = archive.getChunkData(mesh._lightmapTrunkId, 0x70616d6c);
							var img;

							if (typeof Blob === "function" && typeof URL === "function") {
								var blob = new Blob([new Uint8Array(lightmapData)], {type: 'image/jpeg'});

								img = new Image();
								img.src = URL.createObjectURL(blob);
							} else {
								var imageDataBase64 = Tarumae.Utility.byteArrayToBase64(new Uint8Array(lightmapData));

								img = new Image();
								img.src = "data:image/jpeg;base64," + imageDataBase64;
							}
				
							if (img) {
								img.onload = function() {
									var tex = new Tarumae.Texture(img);
									tex.enableRepeat = false;
									mesh._lightmap = tex;
									scene.requireUpdateFrame();
								};
							}
						}
					}
				}
			};

			if (!Tarumae.Utility.Archive.canLoadFromArchive(this, value, loadedHandler)) {
				rm.add(value, Tarumae.ResourceTypes.Binary, loadedHandler);
			}
		}
	}
};

Scene.prototype.prepareObjectMeshFromURLStream = function(obj, url, buffer, loadingSession) {
	if (!buffer) return;

	var mesh = null;
	var renderer = this.renderer;
	
	if (renderer.cachedMeshes.hasOwnProperty(url)) {
		mesh = renderer.cachedMeshes[url];
	} else {
		mesh = new Tarumae.Mesh();
		mesh.loadFromStream(buffer);
		renderer.cachedMeshes[url] = mesh;
	}

	if (mesh) {
		obj.addMesh(mesh);
		this.requireUpdateFrame();

		if (typeof name === "string") {
			obj[name] = mesh;
		}

		if (loadingSession) {
			loadingSession.onobjectMeshDownload(obj, mesh);
		}
	}

	return mesh;
};

Scene.prototype.prepareMaterialObject = function(mat, rm, loadingSession) {
	var scene = this;

	if (rm === undefined) {
		rm = this.resourceManager;
	}
		
	mat._s3_foreach(function(name, value) {
		switch (name) {
			case "color":
				if (typeof value === "object" && value instanceof Array) {
					switch (value.length) {
						case 3:
							mat[name] = new Color3(value[0], value[1], value[2]);
							break;
						case 4:
							mat[name] = new Color4(value[0], value[1], value[2], value[3]);
							break;
					}
				}
				break;

			case "tex":
			case "normalmap":
				if (typeof value === "string" && value.length > 0) {
					if (scene.renderer.cachedTextures.hasOwnProperty(value)) {
						obj[name] = scene.renderer.cachedTextures[value];
					} else {
						if (loadingSession) loadingSession.resourceTextureCount++;

						rm.add(value, Tarumae.ResourceTypes.Image, function(image) {
							if (loadingSession) {
								loadingSession.downloadTextureCount++;
								loadingSession.progress();
							}

							if (image) {
								if (scene.renderer.cachedTextures.hasOwnProperty(value)) {
									obj[name] = scene.renderer.cachedTextures[value];
								} else {
									mat[name] = new Tarumae.Texture(image);
									scene.requireUpdateFrame();
								}
							}
						});
					}
				}
				break;

			case "texTiling":
				if (typeof value === "object" && value instanceof Array) {
					switch (value.length) {
						default: break;
						case 2: mat[name] = new Vec2(value[0], value[1]); break;
						case 3: mat[name] = new Vec3(value[0], value[1], value[2]); break;
						case 4: mat[name] = new Vec4(value[0], value[1], value[2], value[3]); break;
					}
				}
				break;
		}
	});
};

Scene.prototype.prepareObjects = function(obj, loadingSession) {	

	var scene = this;
	var rm = loadingSession.rm || this.resourceManager;

	if (!(obj instanceof Tarumae.SceneObject)) {
		if (obj.type === Tarumae.ObjectTypes.Camera) {
			Object.setPrototypeOf(obj, new Tarumae.Camera());
		} else {
			Object.setPrototypeOf(obj, new Tarumae.SceneObject());
		}
	}
	
	obj._s3_foreach(function(name, value) {
		switch (name) {
			case '_models':
				value._s3_foreach(function(mName, mValue) {
					scene.models[mName] = mValue;
				});
				scene.prepareObjects(value, loadingSession);
			break;

			// since always read _materials before reading scene objects 
			// the following code can be ignored
			//	
			// case "_materials":
			// 	value._s3_foreach(function(mName, mValue) {
			// 		if (typeof mValue.name === "undefined") {
			// 			mValue.name = mName;
			// 		}
					
			// 		scene.materials[mName] = mValue;
			// 		scene.prepareMaterialObject(mValue, rm, loadingSession);
			// 	});
			// 	break;

			case "model":
				var model = scene.models[value];
				if (!(model instanceof Tarumae.SceneObject)) {
					scene.prepareObjects(model, loadingSession);
				}
				Object.setPrototypeOf(obj, model);
				break;

			case "mesh":
				if (typeof value === "string" && value.length > 0) {
					scene.prepareObjectMesh(obj, "mesh", value, loadingSession);
				} else if (typeof value === "object") {
					if (value instanceof Array) {
						for (var i = 0; i < value.length; i++) {
							var mesh = value[i];
							scene.prepareObjectMesh(obj, null, mesh, loadingSession);
						}
					} else if (value instanceof Tarumae.Mesh) {
						obj.addMesh(value);
					}
				}
				break;

			case "lightmap":
				if (typeof value === "string" && value.length > 0) {
					if (loadingSession) loadingSession.resourceLightmapCount++;

					rm.add(value, Tarumae.ResourceTypes.Image, function(image) {

						if (loadingSession) {
							loadingSession.downloadLightmapCount++;
							loadingSession.progress();
						}
						
						if (image) {
							var lmapTex = new Tarumae.Texture(image);
							lmapTex.enableRepeat = false;
							obj[name] = lmapTex;
							scene.requireUpdateFrame();
						}
					});
				}
				break;

			case "refmap":
				if (typeof value === "string" && value.length > 0) {
					if (scene._refmaps && scene._refmaps.hasOwnProperty(value)) {
						obj.refmap = scene._refmaps[value].cubemap;
					}
				}
				break;

			case "mat":
				if (typeof value === "string" && value.length > 0) {
					var material = scene.materials[value];
					if (material) {
						obj.mat = material;
					} else if (scene.renderer.debugMode) {
						console.warn("material not found: " + value);
					}
				} else if (typeof value === "object") {
					scene.prepareMaterialObject(value, rm, loadingSession);
				}
				break;

			// case "location":
			// 	delete obj[name];

			// 	var loc = new SceneObject.Vector3Property(obj);
			// 	obj._location = loc;
				
			// 	if (typeof value === "object") {
			// 		if (value instanceof Vec3) {
			// 			loc.setVector(value);
			// 		} else if (value instanceof Array && value.length == 3) {
			// 			loc.set(value[0], value[1], value[2]); break;
			// 		}
			// 	}
			// 	break;

			case "location":
			case "angle":
			case "scale":
				if (typeof value === "object" && value instanceof Array) {
					switch (value.length) {
						default: break;
						case 2: obj[name] = new Vec2(value[0], value[1]); break;
						case 3: obj[name] = new Vec3(value[0], value[1], value[2]); break;
						case 4: obj[name] = new Vec4(value[0], value[1], value[2], value[3]); break;
					}
				}
				break;

			case "innerHTML":
				var div = document.createElement("div");
				div.style.position = "absolute";
				div.innerHTML = value;
				obj._htmlObject = div;
				obj.type = Tarumae.ObjectTypes.Div;
				scene.renderer.surface.appendChild(div);
				break;

			case "mainCamera":
				if (!scene.mainCamera) {
					scene.mainCamera = new Tarumae.Camera();
					scene.add(scene.mainCamera);
				} else {
					Object.setPrototypeOf(value, scene.mainCamera);
				}
				scene.prepareObjects(value, loadingSession);
				break;

			case "scene":
			case "_scene":
			case "parent":
			case "_parent":
			case "_location":
			case "_materials":
			case "_archives":
			case "_eventListeners":
			case "_customProperties":
			case "shader":
			case "viewSize":
			case "texTiling":
			case "color":
			case "renderTexture":
			case "collisionTarget":
			case "collisionOption":	
			case "radiyBody":
			case "lightmap":
			case "refmap":
			case "envmap":
			case "tag":
			case "userData":
				// ignore these properties
				break;

			default:
				if ((typeof value === 'object')
					&& value
					&& !(value instanceof Tarumae.Mesh)
					&& !(value instanceof Tarumae.Texture)
					&& !(value instanceof Tarumae.CubeMap)
					&& !(value instanceof Scene)
					&& !(value instanceof Vec3)
					&& !(value instanceof Color3)
					&& !(value instanceof Array)) {
					scene.prepareObjects(value, loadingSession);
					value.name = name;
					obj.add(value);
				}
				break;
		}
	});
};

/*
 * Finds objects and children in this scene by specified name. Returns null if nothing found.
 */ 
Scene.prototype.findObjectByName = function(name) {
	for (var i = 0; i < this.objects.length; i++) {
		var obj = this.objects[i];
		if (obj.name == name) return obj;
	}

	for (var k = 0; k < this.objects.length; k++) {
		var obj = this.objects[k];

		var child = obj.findObjectByName(name);
		if (child) return child;
	}

	return null;
};

/*
 * Find over all objects in this scene by specified type,
 * put the result into an array.
 */
Scene.prototype.findObjectsByType = function(type, options) {
	type = (type || Tarumae.ObjectTypes.GenericObject);
	options = options || {};
	var arr = [];

	for (var i = 0; i < this.objects.length; i++) {
		var obj = this.objects[i];
		if (obj.type == type) {
			if (typeof options.filter === "undefined" || options.filter(obj)) {
				arr.push(obj);
			}
		}
	}

	for (var k = 0; k < this.objects.length; k++) {
		var child = this.objects[k];
		arr = arr.concat(child.findObjectsByType(type, options));
	}

	return arr;
};
	
/*
 * itearte over all children of this object,
 * pass the object to specified iterator function.
 */
Scene.prototype.eachObject = function(iterator) {
	if (typeof iterator !== "function") return;

	for (var i = 0; i < this.objects.length; i++) {
		var obj = this.objects[i];
		iterator(obj);
	}

	for (var k = 0; k < this.objects.length; k++) {
		this.objects[k].eachChild(iterator);
	}
};

Scene.prototype.findObjectsByCurrentMousePosition = function(options) {
	return this.findObjectsByViewPosition(this.renderer.viewer.mouse.position, options);
};

Scene.prototype.findObjectsByViewPosition = function(p, options) {
	if (!(this.objects instanceof Array)) return { object: null };

	var ray = this.renderer.createWorldRayFromScreenPosition(p);

	return this.findObjectsByViewRay(ray, options);
};

Scene.prototype.findObjectsByRay = function(ray, options) {
	return this.findObjectsByWorldRay(ray, options);
};

Scene.prototype.findObjectsByViewRay = function(ray, options) {
	//TODO: remove?
	return this.findObjectsByWorldRay(ray, options);
};

Scene.prototype.findObjectsByWorldRay = function(ray, options) {

	if (this.renderer.debugMode) {
		this.renderer.debugger.beforeRaycast();
	}
	
	options = options || {};

	var out = { object: null, hits: [], t: Tarumae.Ray.MaxDistance };
	
	var rayNormalizedDir = ray.dir.normalize();

	var session = {
		level: 0,
		rayNormalizedDir: rayNormalizedDir,
		rayNormalizedNegDir: rayNormalizedDir.neg(),
	};

	for (var i = 0; i < this.objects.length; i++) {
		var obj = this.objects[i];
		this.hitTestObjectByRay(obj, ray, out, session, options);
	}

	if (out.hits.length > 0) {
		out.hits.sort(function(a, b) {
			return a.t - b.t;
		});

		out.object = out.hits[0].object;
		out.localPosition = out.hits[0].localPosition;
		out.worldPosition = out.hits[0].worldPosition;
	}

	if (this.renderer.debugMode) {
		this.renderer.debugger.afterRaycast();
	}

	return out;
};

Scene.prototype.hitTestObjectByRay = function(obj, ray, out, session, options) {
	if ((!options.includeInvisible && obj.visible === false) || obj.hitable === false) {
		return false;
	}

	if (typeof session.maxLevel !== "undefined" && session.level >= session.maxLevel) {
		return false;
	}

	if (typeof options.descendantFilter === "function" && options.descendantFilter(obj) === false) {
		return false;
	}
	
	if (typeof obj.hitTestByRay === "function"
		&& (typeof options.filter !== "function" || options.filter(obj))) {
		if (obj.hitTestByRay.call(obj, ray, out)) {
			if (typeof out.t === "undefined") {
				out.t = 0;
			}

			out.hits.push({
				object: obj,
				mesh: out.mesh,
				t: out.t,
				worldPosition: out.worldPosition,
				localPosition: out.localPosition,
			});
		}
	}

	if (!Array.isArray(obj.objects) || !Array.isArray(obj.meshes)) {
		return false;
	}

	session.level++;

	if (Array.isArray(obj.objects)) {
		for (var i = 0; i < obj.objects.length; i++) {
			var child = obj.objects[i];
			this.hitTestObjectByRay(child, ray, out, session, options);
		}
	}

	if ((typeof obj.conflictWithRay !== "boolean" || obj.conflictWithRay === true)
		&& (typeof options.filter !== "function" || options.filter(obj))
		&& Array.isArray(obj.meshes)) {

		var mmat = obj._transform;
		session.mmat = mmat;
		
		for (var k = 0; k < obj.meshes.length; k++) {
			var mesh = obj.meshes[k];
			
			var mout = mesh.hitTestByRay(ray, Tarumae.Ray.MaxDistance, session, options);
			
			if (mout) {
				out.hits.push({
					object: obj,
					mesh: mesh,
					t: mout.t,
					worldPosition: mout.worldPosition,
					localPosition: mout.localPosition,
				});
			}
		}
	}
};

/*
 * Get the bounds of this scene.
 */
Scene.prototype.getBounds = function() {
	var bbox = null;

	for (var i = 0; i < this.objects.length; i++) {
		var object = this.objects[i];
		if (typeof object.visible !== "undefined" && object.visible) {

			var objectBBox = object.getBounds();
		
			if (!options || !options.filter || options.filter(object)) {
				bbox = Tarumae.BoundingBox.findBoundingBoxOfBoundingBoxes(bbox, objectBBox);
			} else if (!bbox) {
				bbox = objectBBox;
			}
		}
	}

	if (!bbox) {
		// no objects, no bounds :-(
		return { min: new Vec3(), max: new Vec3() };
	}

	return bbox;
}

Scene.prototype.mousedown = function(scrpos) {

	var out = this.findObjectsByCurrentMousePosition();

	if (out.object) {
		var obj = out.object;

		var renderer = this.renderer;
		
		if (renderer.debugger
			&& renderer.viewer.pressedKeys._s3_contains(Tarumae.Viewer.Keys.Shift)
			&& renderer.viewer.pressedKeys._s3_contains(Tarumae.Viewer.Keys.Control)) {
			renderer.debugger.showObjectInfoPanel(obj);
		}

		this.hitObject = obj;

		if (typeof obj.onmousedown === "function") {
			var ret = obj.onmousedown(out.hits[0]);

			if (typeof ret !== "undefined" && ret) {
				return ret;
			}
		}
	}

	return this.onmousedown(scrpos);
};

Scene.prototype.begindrag = function() {
	var ret = false;
	
	if (this.hitObject) {
		this.draggingObject = this.hitObject;
		
		ret = this.draggingObject.onbegindrag();
	}
	
	if (!ret) {
		return this.onbegindrag();
	}
};

Scene.prototype.drag = function() {
	var ret = false;

	if (this.draggingObject) {
		ret = this.draggingObject.ondrag();
	}

	if (!ret) {
		return this.ondrag();
	}
};

Scene.prototype.enddrag = function() {
	var ret = false;

	if (this.renderer.debugger) {
		this.renderer.debugger.hideObjectInfoPanel();
	}
	
	if (this.draggingObject) {
		ret = this.draggingObject.onenddrag();
	}

	this.hitObject = null;
	this.draggingObject = null;

	if (!ret) {
		return this.onenddrag();
	}
};

Scene.prototype.mousemove = function(pos) {
	if (this.renderer.options.enableObjectHover) {

		var out = this.findObjectsByViewPosition(this.renderer.viewer.mouse.position);

		var obj = out.object;

		if (this.hoverObject != obj) {
			if (this.hoverObject) {
				this.hoverObject.onmouseout();
			}

			this.hoverObject = obj;

			if (obj) {
				this.hoverObject.onmouseenter();
			}

			this.requireUpdateFrame();
		}
	}

	return this.onmousemove(pos);
};

Scene.prototype.mouseup = function(pos) {
	if (this.hitObject) { 
		this.hitObject.onmouseup(pos);
	}
	
	this.hitObject = null;

	if (this.renderer.debugger) {
		this.renderer.debugger.hideObjectInfoPanel();
	}

	return this.onmouseup(pos);
};

Scene.prototype.keydown = function(key) {
	return this.onkeydown(key);
};

Scene.prototype.keyup = function(key) {
	return this.onkeyup(key);
};

Scene.prototype.animate = function(options, onframe, onfinish) {
	if (typeof Tarumae.Animation !== "function") {
		return;
	}

	if (typeof options.effect === "string") {
		switch (options.effect) {
			default:
			case "normal":
				options.effect = Tarumae.Animation.Effects.Normal;
				break;

			case "smooth":
				options.effect = Tarumae.Animation.Effects.Smooth;
				break;

			case "sharp":
				options.effect = Tarumae.Animation.Effects.Sharp;
				break;

			case "fadein":
				options.effect = Tarumae.Animation.Effects.FadeIn;
				break;

			case "fadeout":
				options.effect = Tarumae.Animation.Effects.FadeOut;
				break;
		}
	}

	var animation = new Tarumae.Animation(this, options, onframe, onfinish);
	animation.play();
	return animation;
};

///////////////////////// ObjectTypes /////////////////////////

Tarumae.ObjectTypes = {
	GenericObject: 0,
	Empty: 11,
	RoovRange: 15,
	Wall: 201,
	Beam: 202,
	Door: 203,
	Window: 204,
	Floor: 205,
	Div: 701,
	Text2D: 702,
	Camera: 801,
	PointLight: 901,
	SpotLight: 902,
	ReflectionSource: 950,
	Cursor: 999,
};

///////////////////////// ObjectsLoadingSession /////////////////////////

Tarumae.ObjectsLoadingSession = class {
	constructor(rm) {
		this.rm = rm;
		this.progressRate = 0;

		this.resourceMeshCount = 0;
		this.resourceTextureCount = 0;
		this.resourceLightmapCount = 0;

		this.downloadMeshCount = 0;
		this.downloadTextureCount = 0;
		this.downloadLightmapCount = 0;

		this.downloadArchives = [];
	}
	
	progress() {
		this.onprogress();

		var loaded = this.totalDownloads;
		var total = this.totalResources;

		this.progressRate = loaded / total;
		
		if (this.progressRate >= 1) {
			this.onfinish();
		}
	}

	get totalResources() {
		return this.resourceMeshCount + this.resourceTextureCount + this.resourceLightmapCount + this.resourceTotalArchiveBytes;
	}

	get totalDownloads() {
		return this.downloadMeshCount + this.downloadTextureCount + this.downloadLightmapCount + this.downloadTotalArchiveBytes;
	}

	get resourceTotalArchiveBytes() {
		var bytes = 0;
		for (var i = 0; i < this.downloadArchives.length; i++) {
			bytes += this.downloadArchives[i].dataLength;
		}
		return bytes;
	}

	get downloadTotalArchiveBytes() {
		var bytes = 0;
		for (var i = 0; i < this.downloadArchives.length; i++) {
			bytes += this.downloadArchives[i].loadingLength;
		}
		return bytes;
	}
};

new Tarumae.EventDispatcher(Tarumae.ObjectsLoadingSession).registerEvents(
	"progress", "finish", "objectMeshDownload");
