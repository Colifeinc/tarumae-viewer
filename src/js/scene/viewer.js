////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Tarumae.Viewer = function(renderer) {
  this.renderer = renderer;

  this.location = new vec3(0, 0, 0);
  this.angle = new vec3(0, 0, 0);
  this.scale = new vec3(1, 1, 1);
  this.originDistance = 0;

  this.firstMovementUpdate = true;
  
  // mouse or touch  
  this.mouse = {
    // current mouse position
    position: { x: 0, y: 0 },

    // amount of mouse movement difference
    movement: { x: 0, y: 0 },

    // draging start and end position
    dragstart: { x: 0, y: 0 },
    dragend: { x: 0, y: 0 },

    // mouse wheel
    wheeldelta: 0,

    // current pressed mouse buttons    
    pressedButtons: [],
  };

  this.touch = {
    fingers: 0,
  };
  
  this.pressedKeys = [];
  this.operationMode = Tarumae.Viewer.OperationModes.None;

  var viewer = this;
  var Viewer = Tarumae.Viewer;

  var surface = renderer.surface;

  if (typeof surface === "object") {
    surface.tabIndex = -1;

    if (typeof renderer.options.canvasAutoFocus !== "boolean" || renderer.options.canvasAutoFocus === true) {
      surface.focus();
    }

    surface.addEventListener("mousedown", function(e) {
      var mouse = viewer.mouse;
      var clientRect = surface.getBoundingClientRect();
      mouse.position.x = e.clientX - clientRect.left;
      mouse.position.y = e.clientY - clientRect.top;

      mouse.movement.x = 0;
      mouse.movement.y = 0;

      mouse.dragstart.x = mouse.position.x;
      mouse.dragstart.y = mouse.position.y;

      switch (e.button) {
        case 0: mouse.pressedButtons._s3_pushIfNotExist(Tarumae.Viewer.MouseButtons.Left); break;
        case 1: mouse.pressedButtons._s3_pushIfNotExist(Tarumae.Viewer.MouseButtons.Middle); break;
        case 2: mouse.pressedButtons._s3_pushIfNotExist(Tarumae.Viewer.MouseButtons.Right); break;
      }

      viewer.operationMode = Tarumae.Viewer.OperationModes.DragReady;
      
      viewer.performSceneMouseDown();
    });
 
    surface.addEventListener("mousemove", function(e) {
      var mouse = viewer.mouse;
      var scene = viewer.renderer.currentScene;

      if (viewer.operationMode == Tarumae.Viewer.OperationModes.DragReady) {
        if (Math.abs(mouse.position.x - mouse.dragstart.x) > 3
          || Math.abs(mouse.position.y - mouse.dragstart.y) > 3) {
          
          if (scene) {
            scene.begindrag();
          }

          // FIXME: integrated 2D 3D event system
          if (viewer.renderer.current2DScene) {
            viewer.renderer.current2DScene.begindrag();
          }

          viewer.operationMode = Tarumae.Viewer.OperationModes.Dragging;
        }
      }

      if (viewer.operationMode === Tarumae.Viewer.OperationModes.None) {
        var clientRect = surface.getBoundingClientRect();
        var client = {
          x: e.clientX - clientRect.left,
          y: e.clientY - clientRect.top
        }
        if (viewer.firstMovementUpdate) {
          mouse.movement.x = 0;
          mouse.movement.y = 0;
          viewer.firstMovementUpdate = false;
        } else {
          mouse.movement.x = client.x - mouse.position.x;
          mouse.movement.y = client.y - mouse.position.y;
        }

        mouse.position.x = client.x;
        mouse.position.y = client.y;

        if (scene) {
          scene.mousemove(mouse.position);
        }
      }
    });
  
    surface.addEventListener("mousewheel", function(e) {
      viewer.mouse.wheeldelta = e.wheelDelta;

      var scene = viewer.renderer.currentScene;
      
      if (scene && typeof scene.onmousewheel === "function") {
        scene.onmousewheel();
      }
    }, { passive: true });

    surface.addEventListener('keydown', function(e) {
      viewer.pressedKeys._s3_pushIfNotExist(e.keyCode);
      
      var isProcessed = false;

      var scene = viewer.renderer.currentScene;
      
      if (scene) {
        var renderer = viewer.renderer;

        if (renderer.debugMode) {
          if ((e.keyCode == Viewer.Keys.Z
            || e.keyCode == Viewer.Keys.P)
            && !viewer.pressedKeys._s3_contains(Viewer.Keys.Control)
            && !viewer.pressedKeys._s3_contains(Viewer.Keys.Shift)
            && !viewer.pressedKeys._s3_contains(Viewer.Keys.MacCommand_Firefox)
            && !viewer.pressedKeys._s3_contains(Viewer.Keys.MacCommand_Opera)
            && !viewer.pressedKeys._s3_contains(Viewer.Keys.MacCommand_Left)
            && !viewer.pressedKeys._s3_contains(Viewer.Keys.MacCommand_Right)) {
            
            switch (e.keyCode) {
              case Viewer.Keys.Z:
                renderer.wireframe = !renderer.wireframe;
                break;
                
              case Viewer.Keys.P:
                if (scene.mainCamera) {
                  if (scene.mainCamera.projectionMethod == Tarumae.ProjectionMethods.Persp) {
                    scene.mainCamera.projectionMethod = Tarumae.ProjectionMethods.Ortho;
                  } else {
                    scene.mainCamera.projectionMethod = Tarumae.ProjectionMethods.Persp;
                  }
                } else {
                  if (renderer.options.perspective.method == Tarumae.ProjectionMethods.Persp) {
                    renderer.options.perspective.method = Tarumae.ProjectionMethods.Ortho;
                  } else {
                    renderer.options.perspective.method = Tarumae.ProjectionMethods.Persp;
                  }
                }
                break;
            }

            scene.requireUpdateFrame();
            isProcessed = true;
          }

          if (viewer.pressedKeys._s3_contains(Viewer.Keys.Shift)
            && viewer.pressedKeys._s3_contains(Viewer.Keys.Control)) {

            if (e.keyCode == Viewer.Keys.K) {
              renderer.debugger.showDebugPanel = !renderer.debugger.showDebugPanel;
              scene.requireUpdateFrame();
              isProcessed = true;
            }

            if (e.keyCode == Viewer.Keys.B) {
              renderer.debugger.showObjectBoundingBox = !renderer.debugger.showObjectBoundingBox;
              scene.requireUpdateFrame();
              isProcessed = true;
            }
          }
        }

        isProcessed = isProcessed || scene.keydown(e.keyCode);
      }

      // FIXME: integrated 2D 3D event system
      if (viewer.renderer.current2DScene) {
        isProcessed = isProcessed || viewer.renderer.current2DScene.keydown(e.keyCode);
      }

      if (isProcessed) {
        e.preventDefault();
        return false;
      }
    });

    surface.addEventListener("blur", function(e) {
      viewer.pressedKeys._s3_clear();
      viewer.mouse.pressedButtons._s3_clear();
    });

    window.addEventListener("blur", function(e) {
      viewer.pressedKeys._s3_clear();
      viewer.mouse.pressedButtons._s3_clear();
    });

    window.addEventListener('keyup', function(e) {
      viewer.pressedKeys._s3_remove(e.keyCode);

      var scene = viewer.renderer.currentScene;

      if (scene) {
        Tarumae.Utility.invokeIfExist(scene, "keyup", e.keyCode);
      }
    });

    surface.addEventListener("touchstart", function(e) {
      if (typeof e.touches === "object") {
        var t = e.touches[0];

        var mouse = viewer.mouse;
        var clientRect = surface.getBoundingClientRect();
        
        mouse.position.x = t.clientX - clientRect.left;
        mouse.position.y = t.clientY - clientRect.top;

        mouse.movement.x = 0;
        mouse.movement.y = 0;

        mouse.dragstart.x = mouse.position.x;
        mouse.dragstart.y = mouse.position.y;
        
        viewer.operationMode = Viewer.OperationModes.DragReady;
        viewer.touch.fingers = e.touches.length;

        viewer.performSceneMouseDown();
      }
    }, { passive: true });

  }

  window.addEventListener("mousemove", function(e) {
    var mouse = viewer.mouse;
    var clientRect = surface.getBoundingClientRect();
    var client = {
      x: e.clientX - clientRect.left,
      y: e.clientY - clientRect.top
    }
    if (viewer.firstMovementUpdate) {
      mouse.movement.x = 0;
      mouse.movement.y = 0;
      viewer.firstMovementUpdate = false;
    } else {
      mouse.movement.x = client.x - mouse.position.x;
      mouse.movement.y = client.y - mouse.position.y;
    }

    mouse.position.x = client.x;
    mouse.position.y = client.y;

    switch (viewer.operationMode) {
      case Tarumae.Viewer.OperationModes.Dragging:
        if (viewer.renderer.currentScene) {
          viewer.renderer.currentScene.drag();
        }
         
        // FIXME: integrated 2D 3D event system
        if (viewer.renderer.current2DScene) {
          viewer.renderer.current2DScene.drag();
        }
        break;
    }
  });

  window.addEventListener("mouseup", function(e) {
    var mouse = viewer.mouse;

    viewer.performSceneMouseUp();

    switch (e.button) {
      case 0: mouse.pressedButtons._s3_remove(Tarumae.Viewer.MouseButtons.Left); break;
      case 1: mouse.pressedButtons._s3_remove(Tarumae.Viewer.MouseButtons.Middle); break;
      case 2: mouse.pressedButtons._s3_remove(Tarumae.Viewer.MouseButtons.Right); break;
    }

    viewer.operationMode = Viewer.OperationModes.None;
  });

  window.addEventListener("touchmove", function(e) {
    if (typeof e.touches === "object") {
      var t = e.touches[0];

      var mouse = viewer.mouse;
      var clientRect = surface.getBoundingClientRect();
      var client = {
        x: t.clientX - clientRect.left,
        y: t.clientY - clientRect.top
      }
      mouse.movement.x = (client.x - mouse.position.x);
      mouse.movement.y = (client.y - mouse.position.y);

      mouse.position.x = client.x;
      mouse.position.y = client.y;

      switch (viewer.operationMode) {
        case Viewer.OperationModes.DragReady:
          var scene = viewer.renderer.currentScene;
        
          if (scene) {
            scene.begindrag();
          }

          e.preventDefault(); 

          viewer.operationMode = Viewer.OperationModes.Dragging;
          break;       

        case Viewer.OperationModes.Dragging:
          var scene = viewer.renderer.currentScene;

          if (scene) {
            scene.drag();
          }

          e.preventDefault();          
          break;
      }
    }
  }, {passive: false});

  window.addEventListener("touchend", function(e) {
    if (e.touches) {
      viewer.touch.fingers = e.touches.length;
    } else {
      viewer.touch.fingers = 0;
    }

    viewer.performSceneMouseUp();
    
    viewer.operationMode = Viewer.OperationModes.None;    
  });

  window.oncontextmenu = function(e) {
    e.preventDefault();
    return false;
  };
};

// backward compatibility
Object.defineProperty(window, "Viewer", { get: Tarumae.Utility.deprecate("Viewer", "Tarumae.Viewer") });

Object.assign(Tarumae.Viewer, {
  OperationModes: {
    None: 0,
    DragReady: 1,
    Dragging: 2,
  },

  MouseButtons: {
    None: 0,
    Left: 1,
    Middle: 2,
    Right: 3,
    Touch0: 10,
    Touch1: 11,
    Touch2: 12,
    Touch3: 13,
    Touch4: 14,
    Touch5: 15,
  },

  Keys: {
    Backspace: 8, Tab: 9, Enter: 13,
    Shift: 16, Control: 17, Alt: 18,

    Escape: 27, Space: 32, PageUp: 33, PageDown: 34,
    End: 35, Home: 36,
    Left: 37, Up: 38, Right: 39, Down: 40,
    Insert: 45, Delete: 46,

    D0: 48, D1: 49, D2: 50, D3: 51, D4: 52,
    D5: 53, D6: 54, D7: 55, D8: 56, D9: 57,

    A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71,
    H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78,
    O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84,
    U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,

    MacCommand_Firefox: 224, MacCommand_Opera: 17,
    MacCommand_Left: 91, MacCommand_Right: 93,
  
    Multiply: 106, Add: 107, Subtract: 108, Divide: 111,

    Backquote: 192,
  },

  Faces: {
    Front: new vec3(0, 0, 0),
    Back: new vec3(0, 180, 0),
    Top: new vec3(90, 0, 0),
    Bottom: new vec3(-90, 0, 0),
    Left: new vec3(0, -90, 0),
    Right: new vec3(0, 90, 0),
  },
});

Tarumae.Viewer.prototype = {
  performSceneMouseDown: function() {
    var scene = this.renderer.currentScene;

    if (scene) {
      var ret = scene.mousedown(this.mouse.position);
      
      if (typeof ret !== "undefined" && ret) {
        return;
      }
    }

    // FIXME: integrated 2D 3D event system
    if (this.renderer.current2DScene) {
      this.renderer.current2DScene.mousedown(this.mouse.position);
    }
  },

  performSceneMouseUp: function() {
    var scene = this.renderer.currentScene;

    switch (this.operationMode) {
      default:
        if (scene) {
          if (this.mouse.pressedButtons.length > 0) {
            scene.mouseup(this.mouse.position);
          }
        }

        // FIXME: integrated 2D 3D event system
        if (this.renderer.current2DScene) {
          this.renderer.current2DScene.mouseup(this.mouse.position);
        }            
        break;

      case Tarumae.Viewer.OperationModes.Dragging:
        if (scene) {
          scene.enddrag(this.mouse.position);
        }

        // FIXME: integrated 2D 3D event system
        if (this.renderer.current2DScene) {
          this.renderer.current2DScene.enddrag(this.mouse.position);
        }
        break;
    }
  },

  setCursor: function(type) {
    this.renderer.surface.style.cursor = type;
  },

  moveOffset: (function() {
    var m;

    return function(offsetX, offsetY, offsetZ) {

      if (m === undefined) m = new Matrix4();
      m.loadIdentity().rotate(this.angle).inverse();

      var v = new vec4(offsetX, offsetY, offsetZ, 1).mulMat(m);
      this.location.offset(v);

      var scene = this.renderer.currentScene;
      if (scene) scene.requireUpdateFrame();
    };
  })(),

  focusAt: function(target, options) {
    "use strict";

    options = options || {};

    var bbox, size = 1;
    var targetLocation;

    if (target instanceof SceneObject) {
      bbox = target.getBounds();
      if (bbox) {
        bbox = new Tarumae.BoundingBox(bbox.min, bbox.max);
        size = Math.max(bbox.size.x, bbox.size.y, bbox.size.z);
        target = bbox.origin;
      } else {
        target = target.getWorldLocation();
      }
        
      targetLocation = target.neg();
    } else if (target instanceof vec3) {
      targetLocation = target;
    } else {
      return;
    }

    var targetScale = options.targetScale || (size * 0.15);
    if (targetScale < 0.55) targetScale = 0.55;
        
    var _this = this;
    var scene = this.renderer.currentScene;

    if (options.animation === true && scene) {
      var startLocation = this.location.clone();
      var startScale = this.originDistance;

      scene.animate({
        name: "_tarumae_viewer_focus_at",
        duration: options.duration || 0.5,
        effect: "smooth",
      }, function(t) {
        _this.location = startLocation.lerp(targetLocation, t);
        if (options.scaleToFitView) _this.originDistance = startScale * (1 - t) + targetScale * t;
      });
    } else {
      _this.location = targetLocation;
      if (options.scaleToFitView) _this.originDistance = targetScale;
      if (scene) scene.requireUpdateFrame();
    }
  },

  rotateTo: function(angles, options) {
    var _this = this;
    options = options || {};

    if (options.append) {
      angles = vec3.add(angles, this.angle);
    }
    
    var scene = _this.renderer.currentScene;
    if (scene) {
      var curAngles = _this.angle;

      scene.animate({
        name: "_tarumae_viewer_rotate_to",
        duration: options.duration || 0.5,
        effect: options.effect || "smooth",
      }, function(t) {
        _this.angle = curAngles.lerp(angles, t);
      }, function() {
        while (_this.angle.x > 180) _this.angle.x -= 360;
        while (_this.angle.y > 180) _this.angle.y -= 360;
        while (_this.angle.z > 180) _this.angle.z -= 360;
        while (_this.angle.x < -180) _this.angle.x += 360;
        while (_this.angle.y < -180) _this.angle.y += 360;
        while (_this.angle.z < -180) _this.angle.z += 360;
      });
    }
  },
};

//////////////// Model Viewer ////////////////

Tarumae.ModelViewer = function(scene) {
  this.scene = scene;
  this.renderer = scene.renderer;
  this.viewer = scene.renderer.viewer;
  
  this.minRotateX = -90;
  this.maxRotateX = 90;
  this.startDragTime = 0;
  this.enableDragAcceleration = false;
  this.dragAccelerationAttenuation = 0.05;
  this.dragAccelerationIntensity = 5;

  this.sceneDragHandlerListener = undefined;
  this.sceneMouseWheelHandlerListener = undefined;
  this.sceneMouseDragAccelerationHandler = undefined;
    
  var _this = this;  
  this.scene.on("begindrag", function() {
    _this.startDragTime = Date.now();
  });

  this.attach();
};

Tarumae.ModelViewer.prototype = {

  attach: function() {
    var _this = this;
    var scene = this.scene;

    if (scene) {
      this.sceneDragHandlerListener = scene.on("drag", function() { _this.sceneDragHandler(); });
      this.sceneMouseWheelHandlerListener = scene.on("mousewheel", function() { _this.sceneMouseWheelHandler(); });
      this.sceneMouseDragAccelerationHandler = scene.on("enddrag", function() { _this.dragAcceleration(); });
    }
  },
  
  detach: function() {
    var scene = this.scene;

    if (this.sceneDragHandlerListener) {
      scene.removeEventListener("drag", this.sceneDragHandlerListener);
      this.sceneMouseWheelHandlerListener = undefined;
    }
    
    if (this.sceneMouseWheelHandlerListener) {
      scene.removeEventListener("mousewheel", this.sceneMouseWheelHandlerListener);
      this.sceneMouseWheelHandlerListener = undefined;
    }
        
    if (this.sceneMouseDragAccelerationHandler) {
      scene.removeEventListener("enddrag", this.sceneMouseWheelHandlerListener);
      this.sceneMouseDragAccelerationHandler = undefined;
    }
  },

  sceneDragHandler: function() {
    if (this.viewer.pressedKeys._s3_contains(Tarumae.Viewer.Keys.Shift)) {
      this.panViewByMouseMove();
    } else if (this.viewer.pressedKeys._s3_contains(Tarumae.Viewer.Keys.Control)) {
      this.zoomViewByMouseButton();
    } else {
      this.dragToRotateScene();
    }
  },

  sceneMouseWheelHandler: function() {
    this.zoomViewByMouseWheel();
  },

  zoomViewByMouseWheel: function() {
    var s = this.viewer.originDistance - this.viewer.mouse.wheeldelta / 3000;
    if (s > 50) s = 50; else if (s < 0.55) s = 0.55;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  },

  zoomViewByMouseButton: function() {
    var s = this.viewer.originDistance - (this.viewer.mouse.movement.x + this.viewer.mouse.movement.y) / -100;
    if (s > 50) s = 50; else if (s < 0.55) s = 0.55;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  },

  panViewByMouseMove: function() {
    this.viewer.moveOffset(this.viewer.mouse.movement.x / 50, -this.viewer.mouse.movement.y / 50, 0);
  },

  limitViewAngleScope: function() {
    if (this.viewer.angle.x < this.minRotateX) this.viewer.angle.x = this.minRotateX;
    if (this.viewer.angle.x > this.maxRotateX) this.viewer.angle.x = this.maxRotateX;

    if (this.viewer.angle.y < 0) this.viewer.angle.y += 360;
    if (this.viewer.angle.y > 360) this.viewer.angle.y -= 360;
  },

  dragToRotateScene: function() {
    var movement = this.viewer.mouse.movement;

    this.viewer.angle.y += movement.x;
    this.viewer.angle.x += movement.y;

    this.limitViewAngleScope();
    this.scene.requireUpdateFrame();
  },

  dragAcceleration: function() {
    if (!this.enableDragAcceleration) return;

    var _this = this, scene = this.scene, viewer = this.viewer;

    if ((Date.now() - this.startDragTime) < 300) {
      Tarumae.Utility.perforMovementAccelerationAnimation(scene,
        this.dragAccelerationIntensity, this.dragAccelerationAttenuation, function(xdiff, ydiff) {
          viewer.angle.y += xdiff;
          viewer.angle.x += ydiff;

          _this.limitViewAngleScope();
        });
    }
  },
};

//////////////// FPSController ////////////////

Tarumae.FPSController = function(scene) {
  this.scene = scene;
  this.renderer = scene.renderer;
  
  var fpscontroller = this;
  var viewer = this.renderer.viewer;
  var movementDetectingTimer = null;
  var _this = this;

  scene.on("keydown", function() {
    if (!movementDetectingTimer) {
      movementDetectingTimer = setInterval(function() {
        fpscontroller.detectFirstPersonMove();
      }, 10);
    }
  });

  scene.on("keyup", function() {
    if (viewer.pressedKeys.length === 0) {
      clearInterval(movementDetectingTimer);
      movementDetectingTimer = null;
    }
  });

  scene.on("begindrag", function() {
    this.renderer.viewer.setCursor("none");
  });

  scene.on("enddrag", function() {
    this.renderer.viewer.setCursor("auto");
  });

  scene.on("drag", function() {
    var camera = this.mainCamera;
    
    if (viewer && camera) {
      if (viewer.mouse.pressedButtons._s3_contains(Tarumae.Viewer.MouseButtons.Left)
        || viewer.touch.fingers == 1) {
          
        if (viewer.pressedKeys._s3_contains(Tarumae.Viewer.Keys.Shift)) {
          _this.dragToMoveCamera();
        } else {
          _this.dragToRotateCamera();
        }
      }

      if (viewer.mouse.pressedButtons._s3_contains(Tarumae.Viewer.MouseButtons.Right)
        || viewer.touch.fingers == 2) {
        _this.dragToMoveCamera();
      }
    }
  });
};

Tarumae.FPSController.prototype = {
  dragToRotateCamera: function() {
    var viewer = this.renderer.viewer;
    var camera = this.scene.mainCamera;

    camera.angle.x -= viewer.mouse.movement.y * 200 / viewer.renderer.renderSize.width;
    camera.angle.y -= viewer.mouse.movement.x * 200 / viewer.renderer.renderSize.height;

    if (camera.angle.x < -80) camera.angle.x = -80;
    else if (camera.angle.x > 80) camera.angle.x = 80;

    camera.angle.y = (camera.angle.y + 360) % 360;
      
    this.scene.requireUpdateFrame();
  },

  dragToMoveCamera: (function() {
    var m;
    
    return function() {
      var viewer = this.renderer.viewer;
      var camera = this.scene.mainCamera;

      if (m === undefined) m = new Matrix4();
      m.loadIdentity().rotate(camera.angle);
          
      var transformedDir = new vec3(
        viewer.mouse.movement.x * 50 / viewer.renderer.renderSize.width, 0,
        viewer.mouse.movement.y * 50 / viewer.renderer.renderSize.height).mulMat(m);

      camera.location.x += transformedDir.x;
      camera.location.z += transformedDir.z;

      camera.onmove();

      this.scene.requireUpdateFrame();
    };
  })(),

  moveSpeed: 0.2,
  
  detectFirstPersonMove: (function() {
    var m = new Matrix4(), dir = new vec3();
    
    return function() {
      var scene = this.scene;
      var viewer = this.renderer.viewer;
      var Viewer = Tarumae.Viewer;

      if (scene && scene.mainCamera) {
        var camera = scene.mainCamera;

        dir.setToZero();

        if (viewer.pressedKeys._s3_contains(Viewer.Keys.A)) {
          dir.x = -1;
        } else if (viewer.pressedKeys._s3_contains(Viewer.Keys.D)) {
          dir.x = 1;
        }

        if (viewer.pressedKeys._s3_contains(Viewer.Keys.W)
          || viewer.pressedKeys._s3_contains(Viewer.Keys.Up)) {
          if (viewer.pressedKeys._s3_contains(Viewer.Keys.Shift)) {
            camera.location.y += this.moveSpeed;
            scene.requireUpdateFrame();
          } else {
            dir.z = -1;
          }
        } else if (viewer.pressedKeys._s3_contains(Viewer.Keys.S)
          || viewer.pressedKeys._s3_contains(Viewer.Keys.Down)) {
          if (viewer.pressedKeys._s3_contains(Viewer.Keys.Shift)) {
            camera.location.y -= this.moveSpeed;
            scene.requireUpdateFrame();
          } else {
            dir.z = 1;
          }
        }
      
        if (viewer.pressedKeys._s3_contains(Viewer.Keys.Left)) {
          camera.angle.y += this.moveSpeed * 10;
          scene.requireUpdateFrame();
        } else if (viewer.pressedKeys._s3_contains(Viewer.Keys.Right)) {
          camera.angle.y -= this.moveSpeed * 10;
          scene.requireUpdateFrame();
        }

        camera.angle.y = (camera.angle.y + 360) % 360;
        
        if (dir.x !== 0 || dir.y !== 0 || dir.z !== 0) {

          m.loadIdentity().rotate(camera.angle);
          
          var transformedDir = dir.mulMat(m);

          transformedDir.y = 0;
          transformedDir = transformedDir.normalize();

          // don't allow to change y if you don't want fly :)
          camera.move(transformedDir.x * this.moveSpeed, 0, transformedDir.z * this.moveSpeed);

          Tarumae.Utility.invokeIfExist(this, "oncameramove");
        }
      }
    };
  })(),
};

// backward compatibility
Object.defineProperty(window, "FPSController",
  { get: Tarumae.Utility.deprecate("FPSController", "Tarumae.FPSController") });

//////////////// Touch Controller ////////////////

Tarumae.TouchController = function(scene) {
  this.scene = scene;
  this.renderer = scene.renderer;

  this.moveSpeed = 0.075;
  this.moveDistance = 1;
  this.dragAccelerationAttenuation = 0.05;
  this.dragAccelerationIntensity = 2.5;

  var _this = this;
  var viewer = this.renderer.viewer;
  var Viewer = Tarumae.Viewer;
  
  var m = new Matrix4(), dir = new vec3();  
  
  this.detectFirstPersonMove = function() {
    if (scene && scene.mainCamera) {
      var camera = scene.mainCamera;

      dir.setToZero();

      if (viewer.pressedKeys._s3_contains(Viewer.Keys.A)) {
        dir.x = -1;
      } else if (viewer.pressedKeys._s3_contains(Viewer.Keys.D)) {
        dir.x = 1;
      }

      if (viewer.pressedKeys._s3_contains(Viewer.Keys.W)
        || viewer.pressedKeys._s3_contains(Viewer.Keys.Up)) {
        if (viewer.pressedKeys._s3_contains(Viewer.Keys.Shift)) {
          camera.location.y += _this.moveSpeed;
          scene.requireUpdateFrame();
        } else {
          dir.z = -1;
        }
      } else if (viewer.pressedKeys._s3_contains(Viewer.Keys.S)
        || viewer.pressedKeys._s3_contains(Viewer.Keys.Down)) {
        if (viewer.pressedKeys._s3_contains(Viewer.Keys.Shift)) {
          camera.location.y -= _this.moveSpeed;
          scene.requireUpdateFrame();
        } else {
          dir.z = 1;
        }
      }
    
      if (viewer.pressedKeys._s3_contains(Viewer.Keys.Left)) {
        camera.angle.y += _this.moveSpeed * 20;
        scene.requireUpdateFrame();
      } else if (viewer.pressedKeys._s3_contains(Viewer.Keys.Right)) {
        camera.angle.y -= _this.moveSpeed * 20;
        scene.requireUpdateFrame();
      }

      camera.angle.y = (camera.angle.y + 360) % 360;

      if (dir.x !== 0 || dir.y !== 0 || dir.z !== 0) {

        m.loadIdentity().rotate(camera.angle);
        
        var transformedDir = dir.mulMat(m);
        
        transformedDir.y = 0;
        transformedDir = transformedDir.normalize();

        // don't allow to change y if you don't want fly :)
        camera.move(transformedDir.x * _this.moveSpeed, 0, transformedDir.z * _this.moveSpeed);

        Tarumae.Utility.invokeIfExist(this, "oncameramove");
      }
    }
  };

  var movementDetectingTimer = null;

  scene.on("keydown", function() {
    if (!movementDetectingTimer) {
      movementDetectingTimer = setInterval(_this.detectFirstPersonMove, 10);
    }
  });

  scene.on("keyup", function() {
    if (viewer.pressedKeys.length === 0) {
      clearInterval(movementDetectingTimer);
      movementDetectingTimer = null;
    }
  });

  var startDragTime;

  scene.on("begindrag", function() {
    this.renderer.viewer.setCursor("none");

    startDragTime = Date.now();
  });

  scene.on("enddrag", function() {
    viewer.setCursor("auto");
    
    if ((Date.now() - startDragTime) < 300) {
      Tarumae.Utility.perforMovementAccelerationAnimation(this,
        _this.dragAccelerationIntensity, _this.dragAccelerationAttenuation, function(xdiff, ydiff) {
          scene.mainCamera.angle.y += xdiff;
          scene.mainCamera.angle.x += ydiff;;
        });
    }
  });

  this.scene.on("mouseup", function() {
    var camera = this.mainCamera;
    if (camera) {
      if (viewer.pressedKeys._s3_contains(Viewer.Keys.Shift)
      || viewer.mouse.pressedButtons._s3_contains(Viewer.MouseButtons.Right)) {
        camera.backward(_this.moveDistance);
      } else {
        camera.forward(_this.moveDistance);
      }
    }
  });

  this.scene.on("drag", (function() {
    var m = new Matrix4();
  
    return function() {
      var viewer = this.renderer.viewer;
      var camera = this.mainCamera;
  
      if (viewer && camera) {
        if (viewer.mouse.pressedButtons._s3_contains(Viewer.MouseButtons.Left)
          || viewer.touch.fingers === 1) {
          camera.angle.x += viewer.mouse.movement.y * 200 / viewer.renderer.renderSize.width;
          camera.angle.y += viewer.mouse.movement.x * 200 / viewer.renderer.renderSize.height;

          if (camera.angle.x < -80) camera.angle.x = -80;
          else if (camera.angle.x > 80) camera.angle.x = 80;

          camera.angle.y = (camera.angle.y + 360) % 360;
          
          this.requireUpdateFrame();
        }

        if (viewer.mouse.pressedButtons._s3_contains(Viewer.MouseButtons.Right)
          || viewer.touch.fingers == 2) {

          m.loadIdentity().rotate(camera.angle);
        
          var transformedDir = new vec3(
            viewer.mouse.movement.x * 30 / viewer.renderer.renderSize.width, 0,
            viewer.mouse.movement.y * 30 / viewer.renderer.renderSize.height).mulMat(m);

          camera.move(-transformedDir.x, 0, -transformedDir.z);
        }
      }
    };
  })());
};

////////////////////// ScenePrologue //////////////////////

Tarumae.ScenePrologue = function(scene, objects, options) {
  this.scene = scene;
  this.objects = objects;
  this.options = options || {};
};

Tarumae.ScenePrologue.prototype = {
  start: function() {
    var _this = this;
    var options = this.options;

    var session = this.scene.add(this.objects);

    this.oldCameraLocation = this.scene.mainCamera.location;
    this.oldCameraAngle = this.scene.mainCamera.angle;
    
    this.scene.mainCamera.location = options.startCameraLocation || new vec3(-17.232386, 10, -12.892001);
    this.scene.mainCamera.lookAt(options.startCameraLookAt || new vec3(0, 1, 0));

    var effect = options.effect || "tall";
    var duration = options.duration || 1;
    
    session.on("objectMeshDownload", function(obj, mesh) {

      if (session.downloadMeshCount >= session.resourceMeshCount) {
        // wait for animation finish
        setTimeout(function() {
          _this.onfinish();
        }, duration);
      }

      switch (effect) {
        case "tall":
          _this.scene.animate({
            duration: duration, effect: "smooth",
          }, function(t) {
            obj.scale.y = t;
          });
          break;
      
        case "fadein":
          var originLocation = obj.location.clone();

          var fadeLocation = new vec3((Math.random() * 25) - 12.5, 0,
            (Math.random() * 25) - 12.5);

          _this.scene.animate({
            duration: duration, effect: "smooth",
          }, function(t) {
            obj.location = fadeLocation.lerp(originLocation, t);
          });
          break;
      }
    });

    return session;
  },

};

new Tarumae.EventDispatcher(Tarumae.ScenePrologue).registerEvents("progress", "finish");

