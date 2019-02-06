////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Object.assign(TarumaeEditor.prototype, {

  sceneSnapshostJSONHistory: ["{}"],
  currentSceneSnapshotJSON: "{}",
  currentUndoIndex: 0,
  maxHistoryCount: 10,
  suspendBackupScene: false,
  
  backupCurrentEditorScene: function() {
    if (this.suspendBackupScene) return;

    var editorJSON = this.generateJSON();

    if (editorJSON == this.currentSceneSnapshotJSON) {
      return;
    }

    if (this.currentUndoIndex < this.sceneSnapshostJSONHistory.length - 1) {
      this.sceneSnapshostJSONHistory.splice(this.currentUndoIndex + 1);
    }

    this.oncontentChange(editorJSON);
        
    this.sceneSnapshostJSONHistory.push(editorJSON);

    if (this.sceneSnapshostJSONHistory.length > this.maxHistoryCount) {
      this.sceneSnapshostJSONHistory.splice(0, this.sceneSnapshostJSONHistory.length - this.maxHistoryCount);
    }

    this.currentUndoIndex = this.sceneSnapshostJSONHistory.length - 1;
    this.currentSceneSnapshotJSON = editorJSON;

    console.debug("scene backuped: " + this.currentUndoIndex);
  },

  restoreHistoryEditorScene: function(snapshotIndex) {
    if (snapshotIndex >= 0 && snapshotIndex < this.sceneSnapshostJSONHistory.length) {
      var editor = this;
      
      editor.currentSceneSnapshotJSON = this.sceneSnapshostJSONHistory[snapshotIndex];
      
      editor.rootObject.objects._t_clear();
      editor.scene.selectedObjects._t_clear();
      editor.cursor.hide();
      editor.setFocus(null);
      
      var json = JSON.parse(editor.currentSceneSnapshotJSON);
      
      editor.suspendBackupScene = true;

      json._t_foreach(function(name, obj) {
        editor.loadObject(name, obj);
        editor.rootObject.add(obj);
      });

      this.oncontentChange(editor.currentSceneSnapshotJSON);
      editor.scene.requireUpdateFrame();

      editor.suspendBackupScene = false;
    }

    console.debug("scene restored: " + snapshotIndex);
  },

  resetHistoryBasePoint: function(json) {
    this.sceneSnapshostJSONHistory = [json];
    this.currentSceneSnapshotJSON = json;
    this.currentUndoIndex = 0;
  },

  undo: function() {
    if (this.currentUndoIndex > 0) {
      this.currentUndoIndex--;
      this.restoreHistoryEditorScene(this.currentUndoIndex);
      this.onundo();
    }
  },

  redo: function() {
    if (this.currentUndoIndex < this.sceneSnapshostJSONHistory.length - 1) {
      this.currentUndoIndex++;
      this.restoreHistoryEditorScene(this.currentUndoIndex);
      this.onredo();
    }
  },
});