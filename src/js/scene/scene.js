////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import "../utility/event";
import { Vec2, Vec3, Vec4, Color3, Color4, Matrix3, Matrix4, Ray } from "@jingwood/graphics-math";
import { BoundingBox3D } from "@jingwood/graphics-math";
import "../render/renderer";
import "../scene/animation";
import "../scene/shapes";
import "../scene/camera";
import "../webgl/texture";
import "../webgl/cubemap";
import "../utility/objloader";

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
		this._bundles = {};
		this._lightSources = [];
		this._activedLightSources = [];

		this.resourceManager = new Tarumae.ResourceManager();
		this.animation = false;
		this.requestedUpdateFrame = true;

		// main camera
		if (typeof Tarumae.Camera === "function") {
			this.mainCamera = new Tarumae.Camera();
			this.mainCamera.location.set(0, 1, 3);
			this.mainCamera.angle.x = -5;
			this.add(this.mainCamera);
		}

		// sun
		if (typeof Tarumae.Sun === "function") {
			this.sun = new Tarumae.Sun();
			this.sun.location = new Vec3(10, 20, 5);
			this.sun.mat = {};
		}

		this.shadowMap = null;
		this.skybox = null;
	}

	loadArchive(name, url, loadingSession, callback) {
	
		var archiveInfo = this._bundles[name];
	
		if (!archiveInfo) {
			var archive = new Tarumae.Utility.Archive();
	
			archiveInfo = {
				name: name,
				url: url,
				archive: archive,
			};
	
			this._bundles[name] = archiveInfo;
	
			archive.isLoading = true;
	
			var rm = loadingSession ? loadingSession.rm : this.resourceManager;
	
			if (loadingSession) {
				loadingSession.downloadArchives.push(archive);
			}
		
			rm.add(url, Tarumae.ResourceTypes.Binary, stream => {
				try {
					archive.loadFromStream(stream);
				} catch (e) { console.error(e); }
				archive.isLoading = false;
				if (typeof callback === "function") callback(archive);
				this.onarchiveLoaded(url, archive);
			}, e => {
				archive.dataLength = e.total;
				archive.loadingLength = e.loaded;
		
				if (loadingSession) loadingSession.progress();
			});
		
			if (!loadingSession) {
				rm.load();
			}
		} else if (archiveInfo.archive.isLoading) {
			this.on("archiveLoaded", function(_url, bundle) {
				if (url === _url) {
					if (typeof callback === "function") callback(bundle);
				}
			});
		} else if (archiveInfo.archive) {
			if (typeof callback === "function") callback(archiveInfo.archive);
		}
	}

	loadArchives(archs, loadingSession) {
		for (const [key, value] of Object.entries(archs)) {
			this.loadArchive(key, value.url, loadingSession);
		};
	}

	createObjectFromBundle(url, ondone, loadingSession) {
		this.loadArchive(url, url, loadingSession, archive => {
			const manifestData = archive.getChunkData(0x1, 0x7466696d);
			if (manifestData) {
				const uarr = new Uint8Array(manifestData);
				var carr = new Array(uarr.length);
				for (var i = 0; i < uarr.length; i++) {
					carr[i] = String.fromCharCode(uarr[i]);
				}
				let manifest;
				try {
					manifest = JSON.parse(carr.join(""));
				} catch (ex) {
					console.warn("parse manifest error: " + ex);
				}
				if (manifest && typeof ondone === "function") {
					ondone(archive, manifest);
				}
			}
		});
	}

	createObjectFromURL(url, callback) {
		var rm = new Tarumae.ResourceManager();
		const loadingSession = new Tarumae.ObjectsLoadingSession(rm);

		this.createObjectFromBundle(url, (bundle, manifest) => {
			this.loadObject(manifest, undefined, bundle);

			if (typeof callback === "function") {
				var obj = manifest;
				if (obj.objects.length === 1) {
					obj = obj.objects[0];
				}
				callback(obj);
			}
		}, loadingSession);
	
		rm.load();
		return loadingSession;
	}
	
	load() {
	
		const loadingSession = new Tarumae.ObjectsLoadingSession(this.resourceManager);
		
		for (let i = 0; i < arguments.length; i++) {
			let obj = arguments[i];
	
			if (obj) {
				this.loadObject(obj, loadingSession);
				this.add(obj);
			}
		}
	
		this.resourceManager.load();
		this.requireUpdateFrame();
	
		return loadingSession;
	}

	close() {
		// TODO
	}

	loadObject(obj, loadingSession, bundle) {
		var _bundles = obj._bundles;
		if (_bundles) {
			this.loadArchives(_bundles, loadingSession);
		}
			
		var _materials = obj._materials;
		if (_materials) {
			this.loadMaterials(_materials, loadingSession, bundle);
		}
	
		var _refmaps = obj._refmaps;
		if (_refmaps) {
			this.loadReflectionMaps(_refmaps, loadingSession, bundle);
		}
	
		this.prepareObjects(obj, loadingSession, bundle);
	}

	createObjectFromObjFormat(url, callback) {
		this.resourceManager.add(url, Tarumae.ResourceTypes.Text, text => {
			callback(Tarumae.loadObjFormat(text));
		});
		this.resourceManager.load();
	}

	add() {
		for (var i = 0; i < arguments.length; i++) {
			var obj = arguments[i];
			if (obj !== null && obj !== undefined
				&& obj instanceof Tarumae.SceneObject) {
				this.objects._t_pushIfNotExist(obj);
			}
			obj.scene = this;
			obj.updateTransform();
		}
		this.requireUpdateFrame();
	}

	whenObjectAdd(obj) {
		if (obj.mat && obj.mat.emission > 0) {
			this._lightSources.push(obj);
		}

		this.onobjectAdd(obj);
	}

	whenObjectRemove(obj) {
		this._lightSources.t_remove(obj);

		this.onobjectRemove(obj);
	}

	show() {
		this.renderer.showScene(this);
		this.requireUpdateFrame();
	}

	destroy() {
		// todo: destroy all objects and meshes that use the resources 
		// 			 downloaded and created from this scene
	}

	beforeDrawFrame(renderer) {
		this.updateLightSources();
	}

	afterDrawFrame(renderer) {
		this.onframe(renderer);
		this.requestedUpdateFrame = false;
	}

	requireUpdateFrame() {
		this.requestedUpdateFrame = true;
	}

	loadMaterials(mats, loadingSession, bundle) {
		for (const [mName, mValue] of Object.entries(mats)) {
			mValue.name = mName;
			this.materials[mName] = mValue;
			this.prepareMaterialObject(mValue, loadingSession ? loadingSession.rm : undefined, loadingSession, bundle);
		}
	}

	loadReflectionMaps(refmaps, loadingSession, bundle) {
		var _this = this;

		var datafileUrl = refmaps._datafile;
		// loadingSession.rm.add(maps[i], Tarumae.ResourceTypes.Binary, function(stream) {
		// 	var header = new Int32Array(stream);
		// 	var res = header[2];
		// 	var faceDataLength = res * res * 3 * 4;
		// 	var probeDataLength = faceDataLength * 6;

		// 	var facedata = new Float32Array(stream, header[0]);
		
		// 	refmaps._t_foreach(function(pName, pValue) {
		// 		if (pName == "_datafile") return;
		// 		pValue.cubemap.setFaceData();
		// 	});
		// });

		for (const [pName, pValue] of Object.entries(refmaps)) {
			if (pName == "_datafile") continue;

			pValue.name = pName;
			pValue.cubemap = new Tarumae.CubeMap(_this.renderer);

			var bbmin = Vec3.fromArray(pValue.bounds.min);
			var bbmax = Vec3.fromArray(pValue.bounds.max);
			pValue.cubemap.bbox = new BoundingBox3D(bbmin, bbmax);
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

					const loadedHandler = function(buffer) {
						pValue.cubemap.setRawData(buffer);
					};

					if (!Tarumae.Utility.Archive.canLoadFromArchive(_this, dataUrl, 0x70616d72, bundle, loadedHandler)) {
						rm.add(dataUrl, Tarumae.ResourceTypes.Binary, loadedHandler);
					}
				}
			}
		}
	}

	remove(obj) {
		if (!obj) return;

		// if object has parent, remove from its parent
		if (obj.parent) {
			obj.parent.remove(obj);
		} else if (this.objects._t_contains(obj)) {
			// else remove from current scene
			this.objects._t_remove(obj);
			obj.parent = null;
			obj.scene = null;
		}

		this.onobjectRemove(obj);
	}

	selectObject(obj) {
		this.selectedObjects._t_pushIfNotExist(obj);
		obj.isSelected = true;
	}

	deselectObject(obj) {
		this.selectedObjects._t_remove(obj);
		obj.isSelected = false;
	}

	removeAllSelectedObjects() {
		for (var i = 0; i < this.selectedObjects.length; i++) {
			this.remove(this.selectedObjects[i]);
	}

		this.selectedObjects._t_clear();
		this.requireUpdateFrame();
	}
	
	updateLightSources() {
		this._activedLightSources._t_clear();

		if (!this.renderer.options.enableLighting) {
			return;
		}
		
		if (this.renderer.debugger) {
			this.renderer.debugger.beforeSelectLightSource();
		}

		let cameraLocation;

		if (this.mainCamera) {
			cameraLocation = this.mainCamera.worldLocation;
		} else {
			cameraLocation = Vec3.zero;
		}

		for (const object of this._lightSources) {
			if (object.visible === true) {
				if (typeof object.mat === "object" && object.mat !== null) {
					if (typeof object.mat.emission !== "undefined" && object.mat.emission > 0) {
							
						var lightWorldPos;
						
						if (Array.isArray(object.meshes) && object.meshes.length > 0) {
							var bounds = object.getBounds();
							lightWorldPos = Vec3.add(bounds.min, Vec3.mul(Vec3.sub(bounds.max, bounds.min), 0.5));
						} else {
							lightWorldPos = new Vec4(0, 0, 0, 1).mulMat(object._transform).xyz;
						}
	
						var distance = Vec3.sub(lightWorldPos, cameraLocation).length();
						if (distance > Tarumae.Shaders.StandardShader.LightLimitation.Distance) return;
	
						var index = -1;
	
						for (var i = 0; i < Tarumae.Shaders.StandardShader.LightLimitation.Count
							&& i < this._activedLightSources.length; i++) {
							var existLight = this._activedLightSources[i];
							if (distance < existLight.distance) {
								index = i;
								break;
							}
						}
	
						if (index === -1) {
							this._activedLightSources.push({
								object: object,
								worldloc: lightWorldPos,
								distance: distance
							});
						} else if (index >= 0) {
							this._activedLightSources.splice(index, 0, {
								object: object,
								worldloc: lightWorldPos,
								distance: distance
							});
						}
					}
				}
			}
		}
	
		if (this._activedLightSources.length > Tarumae.Shaders.StandardShader.LightLimitation.Count) {
			this._activedLightSources = this._activedLightSources.slice(0, Tarumae.Shaders.StandardShader.LightLimitation.Count);
		}

		if (this.renderer.debugger) {
			this.renderer.debugger.afterSelectLightSource();
		}
	}

	createMeshFromURL(url, handler, rm) {
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
	}

	createTextureFromURL(url, handler) {
		if (this.renderer) {
			this.renderer.createTextureFromURL(url, handler);
		}
	}

	prepareObjectMesh(obj, name, value, loadingSession, bundle) {
		const scene = this;
		const renderer = this.renderer;

		const rm = loadingSession ? loadingSession.rm : this.resourceManager;
			
		if (typeof value === "string" && value.length > 0) {
			if (renderer.cachedMeshes.hasOwnProperty(value)) {
				var mesh = renderer.cachedMeshes[value];
				obj.addMesh(mesh);
				if (typeof name === "string") {
					obj[name] = mesh;
				}
			} else {
				if (loadingSession) loadingSession.resourceMeshCount++;

				var loadedHandler = function(buffer, archive) {
					if (loadingSession) {
						loadingSession.downloadMeshCount++;
						loadingSession.progress();
					}
			
					var mesh = scene.prepareObjectMeshFromURLStream(obj, value, buffer, loadingSession);

					if (mesh) {
						if (archive) {
							if (mesh._lightmapTrunkId) {
								if (mesh._lightmapType === 1) {
									let tex = archive.cachedChunks[mesh._lightmapTrunkId];

									if (tex) {
										mesh._lightmap = tex;
										scene.requireUpdateFrame();
									} else {
										tex = new Tarumae.Texture();
										tex.isLoading = true;

										archive.cachedChunks[mesh._lightmapTrunkId] = tex;

										const lightmapData = archive.getChunkData(mesh._lightmapTrunkId);

										let img = undefined;

										if (typeof Blob === "function" && typeof URL === "function") {
											const blob = new Blob([new Uint8Array(lightmapData)], { type: "image/jpeg" });

											img = new Image();
											img.src = URL.createObjectURL(blob);
										} else {
											const imageDataBase64 = Tarumae.Utility.byteArrayToBase64(new Uint8Array(lightmapData));

											img = new Image();
											img.src = "data:image/jpeg;base64," + imageDataBase64;
										}
				
										if (img) {
											img.onload = function() {
												tex.image = img;
												tex.isLoading = false;
												tex.enableMipmapped = true;
												tex.enableRepeat = false;
												mesh._lightmap = tex;
												scene.requireUpdateFrame();
											};
										}
									}
								}
							}

							if (mesh._refmapTrunkId) {
								let refmap = archive.cachedChunks[mesh._refmapTrunkId];

								if (!refmap) {
									refmap = new Tarumae.CubeMap(this.renderer);

									archive.cachedChunks[mesh._refmapTrunkId] = refmap;

									const refmapData = archive.getChunkData(mesh._refmapTrunkId);
									refmap.setRawData(refmapData);
								}

								if (refmap) {
									mesh._refmap = refmap;
								}
							}
						}
					}
				};

				if (!Tarumae.Utility.Archive.canLoadFromArchive(this, value, 0x6873656d, bundle, loadedHandler)) {
					rm.add(value, Tarumae.ResourceTypes.Binary, loadedHandler);
				}
			}
		}
	}

	prepareObjectMeshFromURLStream(obj, url, buffer, loadingSession) {
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
	}

	prepareMaterialObject(mat, rm, loadingSession, bundle) {
		var scene = this;

		if (!rm) {
			rm = this.resourceManager;
		}

		function setTextureImage(name, buffer, url) {
			if (loadingSession) {
				loadingSession.downloadTextureCount++;
				loadingSession.progress();
			}

			let timg = scene.renderer.cachedImages[url];
			if (timg) {
				mat[name] = timg.tex;
				return;
			}

			if (buffer instanceof ArrayBuffer) {
				let image;

				if (typeof Blob === "function" && typeof URL === "function") {
					var blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });

					image = new Image();
					image.src = URL.createObjectURL(blob);
				} else {
					var imageDataBase64 = Tarumae.Utility.byteArrayToBase64(new Uint8Array(buffer));

					image = new Image();
					image.src = "data:image/jpeg;base64," + imageDataBase64;
				}

				let tex = new Tarumae.Texture(image);
				tex.isLoading = true;

				scene.renderer.cachedImages[url] = {
					img: image,
					tex: tex,
				};

				mat[name] = tex;
				scene.renderer.cachedTextures[url] = tex;

				image.addEventListener("load", () => {
					tex.isLoading = false;
					scene.requireUpdateFrame();
				});
			} else if (buffer instanceof Image) {
				mat[name] = new Tarumae.Texture(buffer);
				scene.renderer.cachedTextures[url] = mat[name];
				scene.requireUpdateFrame();
			}
		}

		for (const [name, value] of Object.entries(mat)) {

			switch (name) {
				case "color":
					if (typeof value === "object" && value instanceof Array) {
						switch (value.length) {
							case 3:
								mat[name] = new Color3(...value);
								break;
							case 4:
								mat[name] = new Color4(...value);
								break;
						}
					}
					break;

				case "tex":
				case "normalmap":
					if (typeof value === "string" && value.length > 0) {
						if (scene.renderer.cachedTextures.hasOwnProperty(value)) {
							mat[name] = scene.renderer.cachedTextures[value];
						} else {
							if (loadingSession) loadingSession.resourceTextureCount++;

							if (!Tarumae.Utility.Archive.canLoadFromArchive(this, value, 0, bundle, (buffer, bundle, uid) => {
								setTextureImage(name, buffer, value, bundle, uid);
							})) {
								rm.add(value, Tarumae.ResourceTypes.Image, (image) => {
									setTextureImage(name, image, value);
								});
							}
						}
					}
					break;

				case "texTiling":
					if (typeof value === "object" && value instanceof Array) {
						switch (value.length) {
							default: break;
							case 2: mat[name] = new Vec2(...value); break;
							case 3: mat[name] = new Vec3(value[0], value[1], value[2]); break;
							case 4: mat[name] = new Vec4(value[0], value[1], value[2], value[3]); break;
						}
					}
					break;
			}
		}
	}

	prepareObjects(obj, loadingSession, bundle) {

		const scene = this;
		const rm = loadingSession ? loadingSession.rm : this.resourceManager;

		if (!(obj instanceof Tarumae.SceneObject)) {
			let typeConstructor;

			if (obj.type === Tarumae.ObjectTypes.Camera) {
				typeConstructor = Tarumae.Camera;
			} else {
				typeConstructor = Tarumae.SceneObject;
			}

			obj.__proto__ = typeConstructor.prototype;
			typeConstructor.call(obj);
		}
	
		const prepareObjectProperties = function(obj, loadingSession, bundle) {
			for (const [name, value] of Object.entries(obj)) {
				switch (name) {
					case "_models":
						value._t_foreach(function(mName, mValue) {
							scene.models[mName] = mValue;
						});
						scene.prepareObjects(value, loadingSession, bundle);
						break;

					// since always read _materials before reading scene objects 
					// the following code can be ignored
					//	
					// case "_materials":
					// 	value._t_foreach(function(mName, mValue) {
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
							scene.prepareObjects(model, loadingSession, bundle);
						}
						Object.setPrototypeOf(obj, model);
						break;

					case "mesh":
						if (typeof value === "string" && value.length > 0) {
							scene.prepareObjectMesh(obj, "mesh", value, loadingSession, bundle);
						} else if (typeof value === "object") {
							if (value instanceof Array) {
								for (var i = 0; i < value.length; i++) {
									var mesh = value[i];
									scene.prepareObjectMesh(obj, null, mesh, loadingSession, bundle);
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
							scene.prepareMaterialObject(value, rm, loadingSession, bundle);
						}
						break;
					
					case "location":
					case "angle":
					case "scale":
						if (typeof value === "object" && Array.isArray(value)) {
							switch (value.length) {
								default: break;
								case 3: case 4:
									delete obj[name]; // delete property from define
									obj[name].set(value[0], value[1], value[2]);
									break;
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
					case "_bundles":
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
					case "envmap":
					case "tag":
					case "userData":
						// ignore these properties
						break;

					default:
						if ((typeof value === "object")
							&& value
							&& !(value instanceof Tarumae.Mesh)
							&& !(value instanceof Tarumae.Texture)
							&& !(value instanceof Tarumae.CubeMap)
							&& !(value instanceof Tarumae.Scene)
							&& !(value instanceof Vec3)
							&& !(value instanceof Color3)
							&& !(value instanceof Color4)
							&& !(value instanceof Matrix3)
							&& !(value instanceof Matrix4)
							&& !(value instanceof Array)) {
							scene.prepareObjects(value, loadingSession, bundle);
							value.name = name;
							obj.add(value);
						}
						break;
				}
			}
		}

		const _bundle = obj._bundle || obj.bundle;
		if (_bundle) {
			this.createObjectFromBundle(_bundle, function(bundle, manifest) {
				Object.assign(obj, manifest);
				prepareObjectProperties(obj, loadingSession, bundle);
			}, loadingSession);
		} else {
			prepareObjectProperties(obj, loadingSession, bundle);
		}
	}

	/*
	 * Finds objects and children in this scene by specified name. Returns null if nothing found.
	 */
	findObjectByName(name) {
		for (const obj of this.objects) {
			if (obj.name === name) return obj;
		}

		for (const obj of this.objects) {
			const child = obj.findObjectByName(name);
			if (child) return child;
		}

		return null;
	}

	/*
	 * Find over all objects in this scene by specified type,
	 * put the result into an array.
	 */
	findObjectsByType(type, options) {
		type = (type || Tarumae.ObjectTypes.GenericObject);
		options = options || {};
		var arr = [];

		for (var i = 0; i < this.objects.length; i++) {
			var obj = this.objects[i];
			if (obj.type === type) {
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
	eachObject(iterator) {
		if (typeof iterator !== "function") return;

		for (var i = 0; i < this.objects.length; i++) {
			var obj = this.objects[i];
			iterator(obj);
		}

		for (var k = 0; k < this.objects.length; k++) {
			this.objects[k].eachChild(iterator);
		}
	}

	findObjectsByCurrentMousePosition(options) {
		return this.findObjectsByViewPosition(this.renderer.viewer.mouse.position, options);
	}

	findObjectsByViewPosition(p, options) {
		if (!(this.objects instanceof Array)) return { object: null };

		var ray = this.renderer.createWorldRayFromScreenPosition(p);

		return this.findObjectsByViewRay(ray, options);
	}

	findObjectsByRay(ray, options) {
		return this.findObjectsByWorldRay(ray, options);
	}

	findObjectsByViewRay(ray, options) {
		//TODO: remove?
		return this.findObjectsByWorldRay(ray, options);
	}

	findObjectsByWorldRay(ray, options) {

		if (this.renderer.debugMode) {
			this.renderer.debugger.beforeRaycast();
		}
	
		options = options || {};

		var out = { object: null, hits: [], t: Ray.MaxDistance };
	
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
			out.t = out.hits[0].t;
			out.localPosition = out.hits[0].localPosition;
			out.worldPosition = out.hits[0].worldPosition;
			out.surfaceIndex = out.hits[0].surfaceIndex;
		}

		if (this.renderer.debugMode) {
			this.renderer.debugger.afterRaycast();
		}

		return out;
	}

	hitTestObjectByRay(obj, ray, out, session, options) {
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
			
				var mout = mesh.hitTestByRay(ray, Ray.MaxDistance, session, options);
			
				if (mout) {
					out.hits.push({
						object: obj,
						mesh: mesh,
						t: mout.t,
						worldPosition: mout.worldPosition,
						localPosition: mout.localPosition,
						surfaceIndex: mout.surfaceIndex,
					});
				}
			}
		}
	}

	/*
	 * Get the bounds of this scene.
	 */
	getBounds(options) {
		var bbox = null;

		for (var i = 0; i < this.objects.length; i++) {
			var object = this.objects[i];
			if (typeof object.visible !== "undefined" && object.visible) {

				var objectBBox = object.getBounds(options);
		
				if (!options || !options.filter || options.filter(object)) {
					bbox = BoundingBox3D.findBoundingBoxOfBoundingBoxes(bbox, objectBBox);
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

	mousedown(scrpos) {

		var out = this.findObjectsByCurrentMousePosition();

		if (out.object) {
			var obj = out.object;

			var renderer = this.renderer;
		
			if (renderer.debugger
				&& renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)
				&& renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Control)) {
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
	}

	begindrag() {
		var ret = false;
	
		if (this.hitObject) {
			this.draggingObject = this.hitObject;
		
			ret = this.draggingObject.onbegindrag();
		}
	
		if (!ret) {
			return this.onbegindrag();
		}
	}

	drag() {
		var ret = false;

		if (this.draggingObject) {
			ret = this.draggingObject.ondrag();
		}

		if (!ret) {
			return this.ondrag();
		}
	}

	enddrag() {
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
	}

	mousemove(pos) {
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
	}

	mouseup(pos) {
		if (this.hitObject) {
			this.hitObject.onmouseup(pos);
		}
	
		this.hitObject = null;

		if (this.renderer.debugger) {
			this.renderer.debugger.hideObjectInfoPanel();
		}

		return this.onmouseup(pos);
	}

	keydown(key) {
		return this.onkeydown(key);
	}

	keyup(key) {
		return this.onkeyup(key);
	}

	animate(options, onframe, onfinish) {
		if (typeof Tarumae.Animation !== "function") {
			return "requires animation feature but library is not included";
		}

		const animation = new Tarumae.Animation(this, options, onframe, onfinish);
		animation.play();
		return animation;
	}
};

new Tarumae.EventDispatcher(Tarumae.Scene).registerEvents(
	"mousedown", "mouseup", "mousemove", "mousewheel",
	"begindrag", "drag", "enddrag",
	"keyup", "keydown",
	"objectAdd", "objectRemove", "mainCameraChange",
	"frame",
	"archiveLoaded");

///////////////////////// ObjectTypes /////////////////////////

Tarumae.ObjectTypes = {
	GenericObject: 0,
	Empty: 11,
	Range: 15,
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
		var loaded = this.totalDownloads;
		var total = this.totalResources;

		this.progressRate = loaded / total;
		
		this.onprogress(this.progressRate);

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

