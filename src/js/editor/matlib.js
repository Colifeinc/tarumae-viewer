
Object.assign(TarumaeEditor.prototype, {
  
  addMaterials: function(mats) {
    mats._t_foreach(function(name, mat) {
      mat.name = name;
      mat.loaded = false;
    });

    Object.assign(this.scene.materials, mats);
  },

  assignMaterialForSelectedObjects: function(mat) {
    if (mat) {
      // initialize material object if texture resources not downloaded      
      if (!mat.loaded) {
        this.scene.prepareMaterialObject(mat);
        mat.loaded = true;
      }

      for (var i = 0; i < this.scene.selectedObjects.length; i++) {
        var obj = this.scene.selectedObjects[i];
        obj.mat = mat;
      }
    } else {
      // set material to undefined to remove material when 'None' is selected
      for (var i = 0; i < this.scene.selectedObjects.length; i++) {
        var obj = this.scene.selectedObjects[i];
        obj.mat = undefined;
      }
    }

    this.scene.resourceManager.load();    
    this.backupCurrentEditorScene();
  },
  
  assignMaterialForObject: function(obj, mat) {
		
    if (mat) {
      // initialize material object if texture resources not downloaded      
      if (!mat.loaded) {        
        this.scene.prepareMaterialObject(mat);
        mat.loaded = true;
      }

      obj.mat = mat;
    } else {
      // set material to undefined to remove material when 'None' is selected
      obj.mat = undefined;
    }

    this.backupCurrentEditorScene();
  },
});