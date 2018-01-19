////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Object.assign(TarumaeEditor.prototype, {
  loadObject: function(name, obj) {
    "use strict";

    var editor = this;

    if (!(obj instanceof Tarumae.SceneObject)) {
      Object.setPrototypeOf(obj, new Tarumae.SceneObject());
    }
    
    obj.name = name;
        
    // backup object material
    var matValue = obj.mat;
    var mergedMat = null;

    // backup custom material items
    if (typeof matValue === "object") {
      mergedMat = new Material();
      mergedMat.copyFrom(matValue);
    }
    
    // model
    var modelId = obj.model;
    var model = editor.modelLibrary[modelId];
    if (model) {
      obj = editor.createObjectFromModel(obj, model);
    }

    // restore object material    
    if ((typeof matValue === "string") && matValue.length > 0) {
      var predefinedMat = editor.scene.materials[matValue];
      if (predefinedMat) {
        editor.assignMaterialForObject(obj, predefinedMat);
      }
      
      var sceneMat = editor.scene.materials[matValue];
      if (sceneMat) {
        editor.assignMaterialForObject(obj, sceneMat);
      }
    }
    else if (mergedMat) {
      // object has overwritten materials, merge these values
      Object.assign(obj.mat, mergedMat);
    }
    
    obj._s3_foreach(function(name, prop) {
      switch (name) {

        case "location":
        case "angle":
        case "scale":
          if (prop instanceof Array && prop.length == 3) {
            obj[name] = new Vec3(prop[0], prop[1], prop[2]);
          }
          break;
        
        case "model":
        case "mat":
        case "editor":
        case "_materials":  
        case "_bake":
        case "_customProperties":
          // ignore these properties  
          break;

        case "width":
          // todo: set wall width
          break;

        default:
          if (typeof prop === "object") {
            editor.loadObject(name, prop);
            obj.add(prop);
          }
          break;
      }
    });

    if (obj instanceof Tarumae.EditorWall) {
      obj.create();
    }
  },

  load: function(objs) {
    if (!objs) return;
    
    var editor = this;
    var scene = editor.scene;

    editor.suspendBackupScene = true;
    
    var iterateMaterials = function(mName, mValue) {
      scene.materials[mName] = mValue;
      scene.prepareMaterialObject(mValue, editor.rm);
    };

		var _materials = objs._materials;
		if (_materials) {
			_materials._s3_foreach(iterateMaterials);
		}
    
    objs._s3_foreach(function(name, obj) {
      if (name != "_materials") {
        name = editor.getAvailableNewObjectName(name);

        editor.loadObject(name, obj);
        editor.rootObject.add(obj);
      }
    });

    this.rm.load();

    editor.resetHistoryBasePoint(editor.generateJSON());

    editor.onload(objs);

    editor.suspendBackupScene = false;

    editor.scene.requireUpdateFrame();
  },
});