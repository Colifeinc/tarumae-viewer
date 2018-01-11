////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Object.assign(TarumaeEditor.prototype, {

  setFocus: function(obj) {
    var editor = this;
    var renderer = editor.renderer;

    editor.focusObject = obj;

    this.updateFocusActivePoints();
  },

  updateFocusActivePoints: function() {
    var editor = this;

    if (editor.focusObject) {
      var aps = editor.focusObject.activePoints;
      
      if (typeof aps === "object" && aps !== null) {
        aps._s3_foreach(function(name, ap) {
          editor.updateActivePoint(ap);
        });
      }
    }

    this.scene.requireUpdateFrame();
  },

  moveSelectedObjects: function(offset) {
    var editor = this;
    var scene = this.scene;

    for (var i = 0; i < scene.selectedObjects.length; i++) {
      var obj = scene.selectedObjects[i];

      var m = obj.getRotationMatrix().inverse();
      var transformedOffset = new vec4(offset, 0).mulMat(m);

      obj.location.offset(transformedOffset);
    }

    scene.requireUpdateFrame();
  },

  rotateSelectedObjects: function(angles) {
    var scene = this.scene;

    var isProcessed = false;

    for (var i = 0; i < scene.selectedObjects.length; i++) {
      var obj = scene.selectedObjects[i];
      obj.angle = obj.angle.add(angles);

      if (this.focusObject == obj) {
        this.updateFocusActivePoints();
      }

      isProcessed = true;
    }

    if (isProcessed) {
      this.backupCurrentEditorScene();
      scene.requireUpdateFrame();
    }

    return isProcessed;
  },

  objectDesignTimeShader: {
    name: "solidcolor",
    color: new color4(1, 0.5, 0.5, 0.5),
  },

  startAddingNewObject: function(modelId) {
    var editor = this;

    this.cancelAddingNewObject();

    var model = this.modelLibrary[modelId];

    if (!model) {
      console.warn("cannot find model by specified id: " + modelId);
      return;
    }

    this.renderer.surface.focus();

    var addingObject = this.createObjectFromModel(addingObject, model);
    
    switch (model.type) {
      default:
        this.rootObject.add(addingObject);
        break;

      case Tarumae.ObjectTypes.Beam:
        // FIXME: decide beam location by a more flex way
        addingObject.location.set(0, 2.55, 0.21);
        addingObject.scale.set(1, 0.1, 0.4);
        break;
    }

    addingObject.name = this.getAvailableNewObjectName(model.name);
    addingObject.indesign = true;
    addingObject.designParent = null;
    addingObject.shader = editor.objectDesignTimeShader;

    this.addingObject = addingObject;
    this.operationMode = TarumaeEditor.EditorOperationModes.AddObject;
  },

  moveAddingNewObject: function() {
    var editor = this;
    var scene = this.scene;
    var out;
    
    switch (this.addingObject.typeId) {
      default:
        out = scene.findObjectsByCurrentMousePosition({
          descendantFilter: function(obj) {
            return obj == editor.ground;
          },
          cullingSurfaceBack: true,
        });

        if (out.object == editor.ground) {
          editor.addingObject.location.x = out.hits[0].localPosition.x;
          editor.addingObject.location.z = out.hits[0].localPosition.z;
          scene.requireUpdateFrame();
        }
        break;

      case Tarumae.ObjectTypes.Beam:
      case Tarumae.ObjectTypes.Door:
      case Tarumae.ObjectTypes.Window:

        out = scene.findObjectsByCurrentMousePosition({
          filter: function(obj) {
            return obj instanceof Tarumae.EditorWall;
          },
          cullingSurfaceBack: true,
        });

        if (out.object instanceof Tarumae.EditorWall) {
          var wall = out.object;

          if (editor.addingObject.designParent) {
            editor.addingObject.designParent.remove(editor.addingObject);
          }

          editor.addingObject.designParent = wall;

          if (!wall.objects._s3_contains(editor.addingObject)) {
            wall.add(editor.addingObject);
          }

          if (editor.addingObject.typeId == Tarumae.ObjectTypes.Beam) {
            editor.addingObject.scale.x = wall.width;
          } else {
            editor.addingObject.location.x = out.hits[0].localPosition.x;
          }

          scene.requireUpdateFrame();
        }
        break;
    }
  },

  submitAddingNewObject: function() {
    var editor = this;
    var scene = this.scene;

    var addingObject = editor.addingObject;
    var out;
      
    switch (editor.addingObject.typeId) {
      default:
        out = scene.findObjectsByCurrentMousePosition({
          descendantFilter: function(obj) {
            return obj == editor.ground;
          },
          cullingSurfaceBack: true,
        });

        if (out.object == editor.ground) {
          addingObject.indesign = false;
          editor.finishAddingNewObject();
        }
        break;

      case Tarumae.ObjectTypes.Beam:
      case Tarumae.ObjectTypes.Door:
      case Tarumae.ObjectTypes.Window:
        {
          out = scene.findObjectsByCurrentMousePosition({
            filter: function(obj) {
              return obj instanceof Tarumae.EditorWall;
            },
            cullingSurfaceBack: true,
          });

          var obj = out.object;

          if (obj instanceof Tarumae.EditorWall) {

            addingObject.indesign = false;
            obj.add(addingObject);
            obj.updateMesh();
            
            editor.finishAddingNewObject();
          }
        }
        break;
    }
  },

  cancelAddingNewObject: function() {
    if (this.addingObject) {

      if (this.addingObject.indesign) {
        if (this.addingObject.designParent) {
          this.addingObject.designParent.remove(this.addingObject);
        } else {
          this.rootObject.remove(this.addingObject);
        }
      }

      delete this.addingObject.shader;

      // clear
      this.addingObject = null;

      this.scene.requireUpdateFrame();
    }

    this.operationMode = TarumaeEditor.EditorOperationModes.None;
  },

  finishAddingNewObject: function() {
    this.cancelAddingNewObject();
    this.backupCurrentEditorScene();

    this.onfinishAddingObject();
  },

  updateActivePoint: function(ap) {
    var renderer = this.renderer;

    var obj = ap.object;
    var worldLocation = obj.getWorldLocation();
    var worldRotation = obj.getWorldRotation();
    var pos = ap.get();
    
    // Getting the final scaling value
    var scalar = new vec3(1, 1, 1);
    var plist = [];
    var parent = obj.parent;

    while (parent) {
      plist.push(parent);
      parent = parent.parent;
    }

    for (var j = plist.length - 1; j >= 0; j--) {
      var parentobj = plist[j];

      scalar = new vec3(parentobj.scale.x * scalar.x, parentobj.scale.y * scalar.y, parentobj.scale.z * scalar.z);
    }
    scalar = new vec3(obj.scale.x * scalar.x, obj.scale.y * scalar.y, obj.scale.z * scalar.z);

    // Custom transformation matrix for Gizmos
    var matrix = new Matrix4().loadIdentity();
    // Translate to the object's world location
    matrix.translate(worldLocation.x, worldLocation.y, worldLocation.z);
    // Rotate on ZYX order
    matrix.rotateZ(-worldRotation.z);
    matrix.rotateY(-worldRotation.y);
    matrix.rotateX(-worldRotation.x);
    // Translate to final gizmo location times scaling value
    matrix.translate(pos.x * scalar.x, pos.y * scalar.y, pos.z * scalar.z);

    switch (ap.axies) {
      default:
        break;

      case "-x":
        ap.arrowPoints = [new vec3(-0.3, 0, 0), new vec3(-0.1, -0.1, 0), new vec3(-0.1, 0.1, 0)];
        break;

      case "+x":
        ap.arrowPoints = [new vec3(0.3, 0, 0), new vec3(0.1, -0.1, 0), new vec3(0.1, 0.1, 0)];
        break;

      case "-y":
        ap.arrowPoints = [new vec3(0, -0.3, 0), new vec3(-0.1, -0.1, 0), new vec3(0.1, -0.1, 0)];
        break;

      case "+y":
        ap.arrowPoints = [new vec3(0, 0.3, 0), new vec3(-0.1, 0.1, 0), new vec3(0.1, 0.1, 0)];
        break;

      case "-z":
        ap.arrowPoints = [new vec3(0, 0, -0.3), new vec3(-0.1, 0, -0.1), new vec3(0.1, 0, -0.1)];
        break;

      case "+z":
        ap.arrowPoints = [new vec3(0, 0, 0.3), new vec3(-0.1, 0, 0.1), new vec3(0.1, 0, 0.1)];
        break;
    }

    for (var i = 0; i < ap.arrowPoints.length; i++) {
      var p = ap.arrowPoints[i];
      ap.arrowPoints[i] = (new vec4(p, 1.0).mulMat(matrix)).xyz();
    }
  },

  getCurrentMousePositionOnAxisPlane: function(pos, axis, offset) {
    var planeVertices = TarumaeEditor.AxisPlaneVertices[axis];

    if (offset !== undefined) {
      var newArray = {};
      planeVertices._s3_foreach(function(name, v) {
        newArray[name] = v.add(offset);
      });
      planeVertices = newArray;
    }

    var res = this.renderer.viewRayHitTestPlaneInWorldSpace(pos, planeVertices);
    return (res && res.hit) ? res.hit : null;
  },
});