////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Object.assign(TarumaeEditor.prototype, {

  generateJSON: function() {
    var json = {};

    this.generateChildrenJSON(json, this.rootObject);

    return JSON.stringify(json);
  },

  generateChildrenJSON: function(json, obj, parentModel) {
    for (var i = 0; i < obj.objects.length; i++) {
      var child = obj.objects[i];

      if (!child.parentModel || child.parentModel != parentModel) {
        var childJson = this.generateObjectJSON(child);
        json[child.name] = childJson;
      }
    }
  },

  generateObjectJSON: function(obj) {
    "use strict";
    
    var editor = this;
    
    var json = {};
    var parentModel;

    if (typeof obj.typeId === "number") {
      switch (obj.typeId) {
        default:
          break;

        case Tarumae.ObjectTypes.Wall:
          json.width = Tarumae.Utility.NumberExtension.roundDigits(obj.width);
          break;
      }
    }

    if (obj.isModelParent && obj.model) {
      json.model = obj.model.id;

      if (obj.isInstanced) {
        json.isInstanced = true;
      } else {
        parentModel = obj.model;
      }
    }

    if (!obj.location.equals(0, 0, 0)) {
      json.location = obj.location.toArrayDigits();
    }

    if (!obj.angle.equals(0, 0, 0)) {
      json.angle = obj.angle.toArrayDigits();
    }

    if (!obj.scale.equals(1, 1, 1)) {
      json.scale = obj.scale.toArrayDigits();
    }

    if (typeof obj.mat === "object" && obj.mat !== null) {
      if (typeof obj.mat.name === "string") {
        json.mat = obj.mat.name;
      } else {
        json.mat = editor.generateMaterialJSON(obj.mat);
      }
    } else if (typeof obj.mat === "string" && obj.mat.length > 0) {
      json.mat = obj.mat;
    }

    // properties
    if (obj.visible === false) {
      json.visible = obj.visible;
    }

    if (obj.viewVisible === false) {
      json.viewVisible = obj.viewVisible;
    }
    
    if (obj.shadowCast === false) {
      json.shadowCast = obj.shadowCast;
    }
    
    if (obj.receiveLight === false) {
      json.receiveLight = obj.receiveLight;
    }

    if (obj.hitable === false) {
      json.hitable = obj.hitable;
    }

    if (obj.collisionMode && obj.collisionMode != Tarumae.CollisionModes.BoundingBox) {
      json.collisionMode = obj.receiveLight;
    }
    
    if (obj.collisionTarget && obj.collisionTarget.name) {
      json.collisionTarget = obj.collisionTarget.name;
    }

    if (obj._customProperties) {
      json._customProperties = obj._customProperties;
    }

    // bake properties
    var hasBakeProperties = obj._bake
      && (obj._bake.enabled === false
        || obj._bake.domain || obj._bake.resolution);
    
    if (hasBakeProperties) {
      var bakeContent = {};
      var _bake = obj._bake;

      if (_bake.enabled === false) {
        bakeContent.enabled = obj._bake.enabled;
      }
      
      if (_bake.resolution) {
        bakeContent.resolution = _bake.resolution;
      }

      if (_bake.domain) {
        bakeContent.domain = _bake.domain;
      }

      json._bake = bakeContent;
    }
        
    this.generateChildrenJSON(json, obj, parentModel);

    return json;
  },

  generateMaterialJSON: function(mat) {
    "use strict";
    
    var jsobj = {};
    
    mat._s3_foreach(function(name, item) {

      var converted = false;

      if (typeof item === "object") {
        if (item instanceof color3) {
          jsobj[name] = [item.r, item.g, item.b];
          converted = true;
        } else if (item instanceof Color4) {
          jsobj[name] = [item.r, item.g, item.b, item.a];
          converted = true;
        }
      }

      if (!converted) {
        jsobj[name] = item;
      }
    });

    return jsobj;
  }

});