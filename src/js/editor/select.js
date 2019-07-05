////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

Object.assign(TarumaeEditor.prototype, {
  /**
 * Selects specified object.
 * 
 * @param object {Tarumae.SceneObject} Object to be selected.
 * @param isAppend {boolean} Do not clear current selected objects if this argument is true.
 */
  selectObject: function(object, isAppend) {
    var scene = this.scene;

    if (!isAppend) {
      for (var i = 0; i < scene.selectedObjects.length; i++) {
        var obj = scene.selectedObjects[i];

        if (object != obj && obj.isSelected) {
          obj.isSelected = false;
          this.onobjectDeselect(obj);
        }
      }

      scene.selectedObjects._t_clear();
    }
    
    this.setFocus(object);

    if (object) {
      if (!object.isSelected) {
        object.isSelected = true;
        this.onobjectSelect(object);
      }
      scene.selectedObjects._t_pushIfNotExist(object);
      
      this.cursor.position = object.worldLocation;
      this.cursor.show();
    } else {
      this.cursor.hide();
    }

    scene.requireUpdateFrame();
  },

  selectObjectByPosition: function(predicate) {
    if (!this.viewer) return;

    var editor = this;

    var out = this.scene.findObjectsByCurrentMousePosition({
      filter: function(obj) {
        return obj != editor.ground && obj != editor.cursors && !obj.childOf(editor.cursors);
      },
      cullingSurfaceBack: true,
    });

    var obj = null;
    
    if (out && out.object) {
      obj = out.object;

      if (obj.model) {
        var p = this.findParentModelObject(obj);
          
        if (!p.isInstanced) {
          if (!this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Alt)) {
            obj = p;
          }
        } else {
          if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Alt)) {
            obj = p;
          }
        }
      }

      this.resetObjectFocusMode();
      if (obj.isSelected) return;
    }

    if (!this.viewer.mouse.pressedButtons._t_contains(Tarumae.Viewer.MouseButtons.Left)) {
      if (!obj) return;
    }
    
    this.selectObject(obj, this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift));  
  },

  selectAllObjects: function() {
    var _this = this;
    var scene = this.scene;

    this.rootObject.eachChild(function(obj) {
      if (obj.isModelParent && !obj.isSelected) {
        obj.isSelected = true;
        _this.onobjectSelect(obj);
        scene.selectedObjects.push(obj);
      }
    });

    scene.requireUpdateFrame();
  },

  selectParentModelOfSelectedObjects: function() {
    var scene = this.scene;
    var i;
    var removeList = [], appendList = [];
    
    for (i = 0; i < scene.selectedObjects.length; i++) {
      var obj = scene.selectedObjects[i];
      
      var patObj = this.findParentModelObject(obj);
      if (patObj != obj) {
        if (obj.isSelected) {
          this.onobjectDeselect(obj);
          removeList.push(obj);
        }

        if (!patObj.isSelected) {
          this.onobjectSelect(patObj);
          appendList.push(patObj);
        }
      }
    }

    for (i = 0; i < removeList.length; i++) {
      scene.selectedObjects._t_remove(removeList[i]);
    }

    for (i = 0; i < appendList.length; i++) {
      scene.selectedObjects.push(appendList[i]);
    }

    scene.requireUpdateFrame();
  },
});