////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Object.assign(TarumaeEditor.prototype, {

	addModels: function(modlib) {
		var _this = this;

		modlib._s3_foreach(function(id, modelDefine) {
			modelDefine.id = String(id);
			modelDefine.loaded = false;
			
			if (typeof modelDefine.gizmoImage === "string" && modelDefine.gizmoImage.length > 0) {
				_this.rm.add(modelDefine.gizmoImage, ResourceTypes.Image, function(img) {
					modelDefine.gizmoImage = img;
					_this.scene.requireUpdateFrame();
				});
			}
		});

		_this.rm.load();

		Object.assign(this.modelLibrary, modlib);
	},
	
	createObjectFromModel: function(obj, model) {
    'use strict';
		var editor = this;

		var constructor;
		
		if (typeof model.class === "string") {
			constructor = eval(model.class);
			if (!constructor) {
				console.warn("editor object constructor cannot be found: " + model.class);
				return null;
			}
		} else {
			constructor = Tarumae.SceneObject;
		}

		if (typeof obj !== "object" || obj === null) {
			obj = new constructor();
		} else {
			Object.setPrototypeOf(obj, new constructor());
		}
		
		obj.model = model;
		
		if (typeof model.object === "object" && model.object) {
			if (obj.isInstanced) {
				editor.createInstancedObjectFromModel(obj, model.object);
			} else {
				editor.createSceneObjectFromModel(obj, model.object);
			}

			if (!model.loaded) {
				(function(model) {
					editor.rm.load(function() {
						model.loaded = true;
					});
				})(model);
			}
		}

		obj.isModelParent = true;
		obj.editor = this;
		obj.typeId = model.type || 0;

		editor.onobjectCreate(obj);
		return obj;
	},

	addObjectMeshFromModel: function(obj, url) {
		var scene = this.scene;

		if (typeof url === "string") {
			scene.createMeshFromURL(url, function(dlMesh) {
				obj.addMesh(dlMesh);
				scene.requireUpdateFrame();
			});
		}
	},
	
	createSceneObjectFromModel: function(obj, objPrototype) {
		"use strict";
		var editor = this;

		objPrototype._s3_foreach(function(name, value) {
			switch (name) {
				case "conflictWithRay":
					obj.conflictWithRay = objPrototype.conflictWithRay;
					break;
					
				case "location":
				case "angle":
				case "scale":
					if (Array.isArray(value)) {
						obj[name]._s3_set(value[0], value[1], value[2]);
					}
					break;

				// ignore these properties					
				case "mesh":
				case "model":
					break;

				case "mat":
					if (typeof value === "string" && value.length > 0) {
						var mat = editor.scene.materials[value];
						if (mat) {
							editor.assignMaterialForObject(obj, mat);
						} else {
							// set material name if material object not found
							obj.mat = value;
						}
					} else if (typeof value === "object") {
						// duplicate material object to avoid reference updating
						obj.mat = Object.assign({}, value);
					}
					break;
				
				case "tag":
				case "userData":
				case "_customProperties":
				case "_extensionProperties":					
				case "_bake":
					// copy value from model prototype
					obj[name] = Object.assign({}, value);
					break;
				
				default:
					if (typeof value !== "object") {
						obj[name] = value;
					} else if (value) {
						var child;

						if (value.model) {
							var childModel = editor.modelLibrary[value.model];
							if (!childModel) {
								console.warn("cannot find model by specified id: " + childModel);
							} else {
								child = editor.createObjectFromModel(child, childModel);
								child.model = childModel;
							}
						} else {
							child = new Tarumae.SceneObject();
							child.model = obj.model;
						}
					
						if (child) {
							editor.createSceneObjectFromModel(child, value);
							child.name = name;
							child.parentModel = obj.model;
							child.isModelChild = true;

							obj.add(child);
							editor.onobjectCreate(child);
						}
					}
					break;
			}
		});

		// mesh
		var mesh = objPrototype.mesh;
			
		if (typeof mesh === "string") {
			if (mesh.length > 0) {
				editor.addObjectMeshFromModel(obj, mesh);
			}	
		} else if (Array.isArray(mesh)) {
			for (var i = 0; i < value.length; i++) {
				editor.addObjectMeshFromModel(obj, mesh[i]);
			}
		}
	},

	createInstancedObjectFromModel: function(obj, objPrototype) {
		"use strict";
		var editor = this;
		
		obj._s3_foreach(function(name, value) {
			switch (name) {

				case "location":
				case "angle":
				case "scale":
					if (Array.isArray(value)) {
						obj[name] = new vec3(value[0], value[1], value[2]);
					}
					break;

				case "_bake":
					// copy value
					obj[name] = Object.assign({}, value);
					break;

				// ignore these properties
				case "mesh":
				case "model":
				case "editor":
				case "mat":
				case "tag":	
				case "userData":	
				case "_customProperties":	
				case "_extensionProperties":	
					break;
					
				default:
					if (typeof value === "object") {
						var childPrototype = objPrototype[name];

						if (childPrototype) {
							if (!(value instanceof Tarumae.SceneObject)) {
								Object.setPrototypeOf(value, new Tarumae.SceneObject());
							}

							value.name = name;
							editor.createInstancedObjectFromModel(value, childPrototype);
							editor.onobjectCreate(value);
						}
					}
					break;
			}
		});

		// mesh
		var mesh = objPrototype.mesh;
			
		if (typeof mesh === "string") {
			if (mesh.length > 0) {
				editor.addObjectMeshFromModel(obj, mesh);
			}	
		} else if (Array.isArray(mesh)) {
			for (var i = 0; i < value.length; i++) {
				editor.addObjectMeshFromModel(obj, mesh[i]);
			}
		}

	},

	instanceSelectedObjects: function() {
		var scene = this.scene;

		for (var i = 0; i < scene.selectedObjects.length; i++) {
			this.instanceObject(scene.selectedObjects[i]);
		}

		scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	instanceObject: (function() {

		var iterateModelChild = function(obj, model, iterator) {
			if (!Array.isArray(obj.objects)) return;

			for (var i = 0; i < obj.objects.length; i++) {
				var child = obj.objects[i];

				if (child.parentModel == model) {
					iterator(child);
					iterateModelChild(child, model, iterator);
				}
			}
		};

		return function(obj) {
			obj = this.findParentModelObject(obj);
			
			if (obj.model && !obj.isInstanced) {
				obj.isInstanced = true;

				iterateModelChild(obj, obj.model, function(child) {
					child.isModelChild = false;
				});

				console.info("instance object, model id:", obj.model.id);
			}
		};
	})(),
	
	/*
	 * find the object that is the model object defined in model library.
	 */
	findParentModelObject: function(obj) {
		while (obj && obj.model && obj.isModelChild) {
			obj = obj.parent;
		}

		return obj;
	},
});