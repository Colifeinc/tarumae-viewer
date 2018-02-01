////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

function TarumaeEditor(options) {
	"use strict";

  var editor = this;
  this.options = options || {};

  Tarumae.Renderer.Shaders.editor = {
    vert: "shader/editor.vert", frag: "shader/editor.frag",
    class: "EditorShader"
  };
  
  var renderer = new Tarumae.Renderer(Object.assign({
    perspective: {
      angle: 70.0,
    },
    backColor: new Color4(0.7, 0.7, 0.65, 1),
    enableShadow: false,
    defaultShader: "editor",
  }, options));

  if (typeof renderer.viewer !== "object") {
    console.warn("renderer.viewer is undefined");
    return;
  }

  if (typeof TarumaeEditor.Version === "object") {
		var ver = TarumaeEditor.Version;
		ver.toString = function() {
			return ver.major + "." + ver.minor + "." + ver.build + ver.revision;
		};
		console.debug("tarumae editor v" + ver);
	} else {
    this.debugMode = true;
		this.developmentVersion = true;
		console.debug("tarumae editor (development version)");
	}

  renderer.viewer.angle.set(20, -30, 0);
  renderer.viewer.location.set(0, -0.5, 0);
  renderer.viewer.originDistance = 1.5;
    
  this.renderer = renderer;
  this.viewer = renderer.viewer;

  this.dragReady = false;
  this.dragging = false;

  this.gridLine = new Tarumae.GridLine(10, 1);
  this.gridLine.mat.color = new color3(0.5, 0.5, 0.5);
  
  this.focusObject = null;
  this.focusActivePoint = null;

  // this.cursor = new Tarumae.Axis3DCursor(renderer);
  this.cursor = new Tarumae.Multi3DCursor(renderer);
  this.cursor.on("axisXMove", function(v) { editor.moveSelectedObjects(new Vec3(v, 0, 0)); });
  this.cursor.on("axisYMove", function(v) { editor.moveSelectedObjects(new Vec3(0, v, 0)); });
  this.cursor.on("axisZMove", function(v) { editor.moveSelectedObjects(new Vec3(0, 0, v)); });
  this.cursor.on("axisXRotate", function(v) { editor.rotateSelectedObjects(new Vec3(v, 0, 0)); });
  this.cursor.on("axisYRotate", function(v) { editor.rotateSelectedObjects(new Vec3(0, v, 0)); });
  this.cursor.on("axisZRotate", function(v) { editor.rotateSelectedObjects(new Vec3(0, 0, v)); });
  this.cursor.on("axisXScale", function(v) { editor.scaleSelectedObjects(v, 1, 1); });
  this.cursor.on("axisYScale", function(v) { editor.scaleSelectedObjects(1, v, 1); });
  this.cursor.on("axisZScale", function(v) { editor.scaleSelectedObjects(1, 1, v); });

  this.compass = new TarumaeCompass(renderer);

  this.modelLibrary = {};

  this.operationMode = TarumaeEditor.EditorOperationModes.None;
  this.displayMode = TarumaeEditor.DisplayModes.All;

  this.addingObject = null;
  this.rootObject = new Tarumae.SceneObject();
  this.rootObject.name = "rootObject";
  this.scene = renderer.createScene();
  this.rm = this.scene.resourceManager;

  if (renderer.options.debugMode) {
    Tarumae.Debugger.Editor = this;
  }

  var scene = this.scene;
  scene.add(this.gridLine);
  scene.add(this.rootObject);
  
  var ground = new Tarumae.EditorGround();
  ground.name = "ground";
  this.ground = ground;
  scene.add(this.ground);

  var resizeGuideBox = new Tarumae.EditorResizeGuideBoundingBox();
  resizeGuideBox.visible = false;
  resizeGuideBox.status = "ready";
  scene.add(resizeGuideBox);
  this.resizeGuideBox = resizeGuideBox;
  this.currentResizingObject = null;
  
  var res = this.res;
  
  var meshes = {};
  this.meshes = meshes;

  // remove mainCamera from scene
	scene.mainCamera = null;

  this.handleSceneEvents(scene);

  var viewer = renderer.viewer;
  var inroom = false;
  var toggleFromView;

  var toggleToView = {
    angle: new Vec3(0, 0, 0),
    location: new Vec3(0, 0, 0),
  };

  var lastEditCamera = {};

  this.enterRoom = function() {
    toggleFromView = {
      angle: viewer.angle.clone(),
      location: viewer.location.clone(),
    };

    if (!inroom) {
      toggleToView = {
        angle: new Vec3(0, 0, 0),
        location: new Vec3(0, 0, 0),
      };
      lastEditCamera = {
        angle: viewer.angle.clone(),
        location: viewer.location.clone(),
      };
      inroom = true;
    } else {
      toggleToView = {
        angle: lastEditCamera.angle.clone(),
        location: lastEditCamera.location.clone(),
      };
      inroom = false;
    }

    scene.animate({ duration: 1, effect: "smooth" }, function(t) {
      viewer.angle = toggleToView.angle.lerp(toggleFromView.angle, t);
      viewer.location = toggleToView.location.lerp(toggleFromView.location, t);
    });
  };

  // FIXME: remove setInterval
  setInterval(function() {
    editor.viewerHandler.detectFirstPersonMove();
  }, 10);

  this.viewerHandler = new TarumaeEditor.ViewerHandler(this);

  scene.show();

  // add models  
  this.addModels(TarumaeEditor.BuiltinObjects);

  // add cursor objects and more init
  this.cursor.init();

}

new EventDispatcher(TarumaeEditor).registerEvents(
  "load", "save", "beforeObjectSave", "afterObjectSave",
  "finishAddingObject", "objectCreate",
  "contentChange", "objectSelect", "objectDeselect",
  "undo", "redo"
);

TarumaeEditor.EditorOperationModes = {
  None: 0,
  AddObject: 1,
  DragMove: 2,
  FreeMove: 3,
  CursorMove: 4,
  ActivePointMove: 5,
  FreeResize: 11,
};

TarumaeEditor.DisplayModes = {
  All: 0xFF,
  Mesh: 0x1,
  Image: 0x2,
  Guide: 0x4,
};

TarumaeEditor.AxisPlaneVertices = {
  x: { v1: new Vec3(0, 0, 1), v2: new Vec3(-1, 0, 0), v3: new Vec3(1, 0, 0) },
  y: { v1: new Vec3(0, 1, 0), v2: new Vec3(-1, 0, 0), v3: new Vec3(1, 0, 0) },
  z: { v1: new Vec3(0, 0, 1), v2: new Vec3(-1, 0, 0), v3: new Vec3(1, 0, 0) },

  xz: { v1: new Vec3(0, 0, 1), v2: new Vec3(-1, 0, 0), v3: new Vec3(1, 0, 0) },
  xy: { v1: new Vec3(0, 1, 0), v2: new Vec3(-1, 0, 0), v3: new Vec3(1, 0, 0) },
  yz: { v1: new Vec3(0, 0, 1), v2: new Vec3( 0, 0,-1), v3: new Vec3(0, 1, 0) },
};

Object.assign(TarumaeEditor.prototype, {

  getFirstSelectedObject: function() {
    var scene = this.scene;
    var obj = null;

    if (scene.selectedObjects.length > 0) {
      obj = scene.selectedObjects[0];
    }

    return obj;
  },

  getAvailableNewObjectName: function(name, parent) {
    "use strict";

    if (name.indexOf(' ') > -1) {
      name = Tarumae.Utility.StringExtension.replaceAll(name, ' ', '_');
    }

    if (!parent) parent = this.rootObject;

    if (!Array.isArray(parent.objects) || parent.objects.length <= 0) {
      return name;
    }

    // IE 11 doesn't have Number.parseInt
    var parseInt = (Number.parseInt || window.parseInt);

    var nameExists = true, index = 1, composedName = name;

    while (nameExists) {
      nameExists = false;

      for (var i = 0; i < parent.objects.length; i++) {
        var obj = parent.objects[i];

        if (obj.name == composedName) {
          nameExists = true;

          // var matches = obj.name.match(/\d+$/g);
          // if (matches && matches.length > 0) {
          //   index = parseInt(matches[0]);
          // }

          index++;
          composedName = name + "_" + index;

          break;
        }
      }
    }

    return composedName;
  },

  draw: function() {
    
    var editor = this;
    var renderer = editor.renderer;
    var viewer = editor.viewer;
    var scene = editor.scene;
    var ctx = renderer.ctx;
    
    editor.cursor.draw();
    editor.compass.draw();

    // if (editor.focusObject != null) {
    //   var aps = editor.focusObject.activePoints;
      
    //   if (typeof aps !== "undefined" && aps != null) {
    //     aps._s3_foreach(function(name, ap) {
    //       var pos = ap.get();
          
    //       switch (ap.axies) {
    //         default:
    //           break;

    //         case "-x":
    //         case "+x":
    //         case "-y":
    //         case "+y":
    //         case "-z":
    //         case "+z":
    //           renderer.drawPolygon(ap.arrowPoints, 2.0, "#ffffff", "#eeaa00");
    //           break;
    //       }
    //     });
    //   }
    // }
  },
});