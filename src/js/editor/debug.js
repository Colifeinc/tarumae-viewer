////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

function initEditorDebugFunctions(editor) {
  Object.assign(editor, {

    dumpSelectedObjects: function() {
      var json = {};
      
      // TODO: remove duplicated child object that may already dumped
      for (var i = 0; i < this.scene.selectedObjects.length; i++) {
        var obj = this.scene.selectedObjects[i];
        json[obj.name] = this.generateObjectJSON(obj);
      }

      console.log(JSON.stringify(json));
    },

    dumpAllObjects: function() {
      console.log(this.generateJSON());
    },
  });
};

