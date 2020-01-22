////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

Object.assign(TarumaeEditor.prototype, {

	rotateObjectHorizontally: function(obj, angle) {
		obj.angle.y += (angle || 90);
	},

	rotateSelectedObjectsHorizontally: function(angle) {
		var scene = this.scene;

		for (var i = 0; i < scene.selectedObjects.length; i++) {
			this.rotateObjectHorizontally(scene.selectedObjects[i], angle);
		}
    
		scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	scaleObject: function(obj, x, y, z) {
		obj.scale.set(obj.scale.x * x, obj.scale.y * y, obj.scale.z * z);
	},

	scaleSelectedObjects: function(x, y, z) {
		if (y === undefined) y = x;
		if (z === undefined) z = x;

		var scene = this.scene;

		for (var i = 0; i < scene.selectedObjects.length; i++) {
			this.scaleObject(scene.selectedObjects[i], x, y, z);
		}
    
		scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	hideSelectedObjects: function() {
		var scene = this.scene;

		for (var i = 0; i < scene.selectedObjects.length; i++) {
			scene.selectedObjects[i].visible = false;
		}
    
		scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	deleteSelectedObjects: function() {
		var scene = this.scene;

		while (scene.selectedObjects.length > 0) {
			scene.remove(scene.selectedObjects[0]);
			scene.selectedObjects._t_removeAt(0);
		}
    
		scene.selectedObjects._t_clear();
		scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	deleteAllObjects: function() {
		this.rootObject.objects._t_clear();
		this.scene.selectedObjects._t_clear();

		this.scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	clearObjectTransform: function(obj, prop) {
		if (!prop || prop == "location") {
			obj.location.set(0, 0, 0);
		}

		if (!prop || prop == "angle") {
			obj.angle.set(0, 0, 0);
		}

		if (!prop || prop == "scale") {
			obj.scale.set(1, 1, 1);
		}
	},

	clearTransformOfSelectedObject: function(prop) {
		var scene = this.scene;

		for (var i = 0; i < scene.selectedObjects.length; i++) {
			this.clearObjectTransform(scene.selectedObjects[i], prop);
		}

		scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	duplicateObject: function(obj) {
		var json = {};
		json[obj.name] = this.generateObjectJSON(obj);
		this.load(json);
	},

	duplicateSelectedObjects: function() {
		// TODO: filter child objects, duplicate only selected parent objects

		var scene = this.scene;
    
		if (scene.selectedObjects.length < 0) return;

		var json = {};
    
		for (var i = 0; i < scene.selectedObjects.length; i++) {
			var obj = scene.selectedObjects[i];
			var child = this.generateObjectJSON(obj);
			if (!child._s3_isEmpty()) {
				json[obj.name] = child;
			}
		}

		this.load(json);

		scene.requireUpdateFrame();
		this.backupCurrentEditorScene();
	},

	resizeObjectByBoundingBox: function(obj, bbox) {
		obj.location = bbox.location;
		obj.scale = bbox.scale;
	},

	handleSceneEvents: function(scene) {
		var editor = this;
		var renderer = editor.renderer;
		var viewer = editor.viewer;
		var Viewer = Tarumae.Viewer;
    
		this.modelViewer = new Tarumae.ModelViewer(scene);
		this.modelViewer.detach();

		scene.on("drag", function() {
			switch (editor.operationMode) {
				default:
					if (viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)
            || viewer.mouse.pressedButtons._t_contains(Tarumae.Viewer.MouseButtons.Right)
            || viewer.mouse.pressedButtons._t_contains(Tarumae.Viewer.MouseButtons.Middle)) {
						editor.modelViewer.panViewByMouseMove();
					} else if (viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Control)) {
						editor.modelViewer.zoomViewByMouseButton();
					} else {
						editor.modelViewer.dragToRotateScene();
					}
					break;
        
				case TarumaeEditor.EditorOperationModes.DragMove:
					editor.cursor.ondrag();
					break;
        
				case TarumaeEditor.EditorOperationModes.ActivePointMove:
					if (editor.focusActivePoint) {
						var pos = editor.focusActivePoint.get();

						editor.focusActivePoint.set(viewer.mouse.movement);
          
						var aps = editor.focusObject.activePoints;
						aps._t_foreach(function(name, ap) {
							editor.updateActivePoint(ap);
						});
          
						scene.requireUpdateFrame();
					}
					break;
			}
		});

		scene.on("enddrag", function() {
			switch (editor.operationMode) {
				default:
					break;

				case TarumaeEditor.EditorOperationModes.DragMove:
					editor.cursor.selectedArrow = null;
					editor.operationMode = TarumaeEditor.EditorOperationModes.None;

					for (var i = 0; i < scene.selectedObjects.length; i++) {
						var obj = scene.selectedObjects[i];
          
						if ((obj.typeId == Tarumae.ObjectTypes.Door
              || obj.typeId == Tarumae.ObjectTypes.Window)
              && obj.parent instanceof Tarumae.EditorWall) {
							obj.parent.updateMesh();
						}
					}

					if (editor.focusObject) {
						editor.updateFocusActivePoints();
					}

					editor.cursor.selectedArrow = null;

					scene.requireUpdateFrame();
					break;

				case TarumaeEditor.EditorOperationModes.ActivePointMove:
					editor.operationMode = TarumaeEditor.EditorOperationModes.None;
					break;
			}
    
			editor.backupCurrentEditorScene();
		});

		scene.on("mousewheel", function() {
			editor.modelViewer.zoomViewByMouseWheel();
		});

		scene.on("mousedown", function(pos) {
			var isProcessed = false;

			switch (editor.operationMode) {
				default:
					break;

				case TarumaeEditor.EditorOperationModes.None:

					if (editor.cursor.onmousedown(pos)) {
						editor.operationMode = TarumaeEditor.EditorOperationModes.DragMove;
						isProcessed = true;
					}
					else if (editor.compass.onmousedown(pos)) {
						var angle = viewer.angle.clone();
						if (editor.compass.selectedArrow == editor.compass.arrows.x) {
							angle.y = -90;
						} else if (editor.compass.selectedArrow == editor.compass.arrows.y) {
							angle.x = 90;
						} else if (editor.compass.selectedArrow == editor.compass.arrows.z) {
							angle.y = 0;
						} else if (editor.compass.selectedArrow == editor.compass.arrows.x2) {
							angle.y = 90;
						} else if (editor.compass.selectedArrow == editor.compass.arrows.y2) {
							angle.x = 0;
						} else if (editor.compass.selectedArrow == editor.compass.arrows.z2) {
							angle.y = 180;
						}

						if (!editor.compass.moving) {
							editor.compass.moving = true;
							scene.animate({ duration: 1, effect: "smooth" }, function(t) {
								viewer.angle.x = angle.x * t + viewer.angle.x * (1 - t);
								viewer.angle.y = angle.y * t + viewer.angle.y * (1 - t);
							}, function() {
								editor.compass.moving = false;
							});
						}
					}

					if (!isProcessed) {
						if (editor.focusObject) {
							// var aps = editor.focusObject.activePoints;

							// if (typeof aps !== "undefined" && aps != null) {
							//   aps._t_foreach(function (name, ap) {
							//     if (MathFunctions.triangleContainsPoint3D(viewer.mouse.position,
							//       renderer.transformPoints(ap.arrowPoints))) {

							//       editor.focusActivePoint = ap;
							//       editor.operationMode = TarumaeEditor.EditorOperationModes.ActivePointMove;
							//     }
							//   });
							// }
						}
					}
					break;

				case TarumaeEditor.EditorOperationModes.FreeResize:
					break;
			}
		});

		scene.on("mousemove", function(pos) {

			switch (editor.operationMode) {
				default:
					break;

				case TarumaeEditor.EditorOperationModes.AddObject:
					editor.moveAddingNewObject();
					break;

				case TarumaeEditor.EditorOperationModes.FreeMove:
					// todo
					break;

				case TarumaeEditor.EditorOperationModes.FreeResize:
					if (editor.resizeGuideBox) {
						var box = editor.resizeGuideBox;

						switch (box.status) {
							default:
							case "ready":
								break;
                
							case "x":
								var axispos = editor.getCurrentMousePositionOnAxisPlane(pos, "x");
								if (axispos) {
									var size = axispos.sub(box.startLocation);
									box.location = box.startLocation.add(size.mul(0.5));
									box.scale.set(size.x, 0.01, size.z);
									scene.requireUpdateFrame();
								}
								break;

							case "y":
								var axispos = editor.getCurrentMousePositionOnAxisPlane(pos, "y", box.startLocation);
								if (axispos) {
									var size = Math.abs(axispos.y - box.startLocation.y);
									box.location.y = size * 0.5;
									box.scale.y = size;
									scene.requireUpdateFrame();
								}
								break;
						}
					}
					break;
			}
		});

		scene.on("mouseup", function(pos) {

			switch (editor.operationMode) {
				default:
					editor.selectObjectByPosition();
					break;

				case TarumaeEditor.EditorOperationModes.AddObject:
					editor.submitAddingNewObject();
					editor.backupCurrentEditorScene();
					break;

				case TarumaeEditor.EditorOperationModes.DragMove:
					editor.cursor.selectedArrow = null;
					editor.operationMode = TarumaeEditor.EditorOperationModes.None;
					editor.backupCurrentEditorScene();
					break;

				case TarumaeEditor.EditorOperationModes.ActivePointMove:
					break;
          
				case TarumaeEditor.EditorOperationModes.FreeResize:
					if (editor.resizeGuideBox) {
						var box = editor.resizeGuideBox;
            
						switch (box.status) {
							case "ready":
								var axispos = editor.getCurrentMousePositionOnAxisPlane(pos, "x");
								if (axispos) {
									box.startLocation = axispos;
									box.location = axispos;
									box.scale.set(0.01, 0.01, 0.01);
									box.status = "x";
								}
								break;
                
							case "x":
								var offset = box.location.add(box.scale.mul(0.5));  
								var axispos = editor.getCurrentMousePositionOnAxisPlane(pos, "y", offset);
								if (axispos) {
									var halfScale = box.scale.mul(0.5).abs();

									var minpos = box.location.sub(halfScale);
									var maxpos = box.location.add(halfScale);
                  
									var minx = Math.min(minpos.x, maxpos.x),
										miny = Math.min(minpos.y, maxpos.y),
										minz = Math.min(minpos.z, maxpos.z),
										maxx = Math.max(minpos.x, maxpos.x),
										maxy = Math.max(minpos.y, maxpos.y),
										maxz = Math.max(minpos.z, maxpos.z);
                  
									minpos = new Vec3(minx, miny, minz);
									maxpos = new Vec3(maxx, maxy, maxz);

									box.location = minpos.add(halfScale);
									box.scale = box.scale.abs();

									box.startLocation = offset;
									box.status = "y";
								}
								break;

							case "y":
                
								if (editor.addingObject) {
									editor.resizeObjectByBoundingBox(editor.addingObject, box);
									editor.addingObject.visible = true;
									editor.operationMode = TarumaeEditor.EditorOperationModes.AddObject;
									editor.submitAddingNewObject();
								} else if (editor.currentResizingObject) {
									editor.resizeObjectByBoundingBox(editor.currentResizingObject, box);
								}
              
								box.visible = false;
								box.status = "ready";
								break;
						}
					}  
					break;
			}
    
		});
   
		scene.on("frame", function() {
			editor.draw();
		});

		scene.on("keydown", function(key) {
			var isProcessed = false;

			switch (key) {
				case Viewer.Keys.T:
					var json = editor.generateJSON();
					console.log(json);
					isProcessed = true;
					break;

				case Viewer.Keys.N:
					for (var i = 0; i < scene.selectedObjects.length; i++) {
						console.log(scene.selectedObjects[i]);
					}
					isProcessed = true;
					break;

				case Viewer.Keys.Q:
				case Viewer.Keys.E:
				case Viewer.Keys.R:
					if ( editor.cursor["onkeydown"] ){
						editor.cursor.onkeydown(key,(viewer.pressedKeys._t_contains(Viewer.Keys.Shift)));
					}
					isProcessed = true;
					break;

				case Viewer.Keys.Delete:
					editor.deleteSelectedObjects();
					isProcessed = true;
					break;

				case Viewer.Keys.Enter:
					editor.enterRoom();
					isProcessed = true;
					break;

				case Viewer.Keys.Z:
					if (viewer.pressedKeys._t_contains(Viewer.Keys.Control)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Firefox)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Opera)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Left)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Right)
					) {
						if (viewer.pressedKeys._t_contains(Viewer.Keys.Shift)) {
							editor.redo();
						} else {
							editor.undo();
						}
						isProcessed = true;
					}
					break;

				case Viewer.Keys.Y:
					if (viewer.pressedKeys._t_contains(Viewer.Keys.Control)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Firefox)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Opera)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Left)
            || viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Right)
					) {
						editor.redo();
						isProcessed = true;
					}
					break;

				case Viewer.Keys.D1:
					editor.toggleTopViewMode();
					isProcessed = true;
					break;

				case Viewer.Keys.D2: editor.rotateViewLeft(); break;
				case Viewer.Keys.D3: editor.rotateViewRight(); break;
				case Viewer.Keys.D4: editor.rotateToViewFront(); break;
				case Viewer.Keys.D5: editor.rotateToViewBack(); break;
					
				case Viewer.Keys.Space:
					editor.toggleObjectFocus();
					isProcessed = true;
					break;

				case Viewer.Keys.S:
					break;

				case Viewer.Keys.H:
					editor.hideSelectedObjects();
					break;

				case Viewer.Keys.G:
					if (editor.operationMode == TarumaeEditor.EditorOperationModes.None) {
						editor.operationMode = TarumaeEditor.EditorOperationModes.FreeMove;
						// todo
					}
					break;

				case Viewer.Keys.Tab:

					if (viewer.pressedKeys._t_contains(Viewer.Keys.Shift)) {
						editor.displayMode = TarumaeEditor.DisplayModes.All;
						editor.renderer.options.enableCustomDraw = true;
						editor.renderer.options.enableDrawMesh = true;
					} else {
						switch (editor.displayMode) {
							default:
							case TarumaeEditor.DisplayModes.All:
								editor.displayMode = TarumaeEditor.DisplayModes.Mesh;
								editor.renderer.options.enableCustomDraw = false;
								editor.renderer.options.enableDrawMesh = true;
								break;

							case TarumaeEditor.DisplayModes.Mesh:
								editor.displayMode = TarumaeEditor.DisplayModes.Mesh | TarumaeEditor.DisplayModes.Image;
								editor.renderer.options.enableCustomDraw = true;
								editor.renderer.options.enableDrawMesh = true;
								break;

							case TarumaeEditor.DisplayModes.Mesh | TarumaeEditor.DisplayModes.Image:
								editor.displayMode = TarumaeEditor.DisplayModes.Mesh | TarumaeEditor.DisplayModes.Guide;
								editor.renderer.options.enableCustomDraw = true;
								editor.renderer.options.enableDrawMesh = true;
								break;

							case TarumaeEditor.DisplayModes.Mesh | TarumaeEditor.DisplayModes.Guide:
								editor.displayMode = TarumaeEditor.DisplayModes.Image | TarumaeEditor.DisplayModes.Guide;
								editor.renderer.options.enableCustomDraw = true;
								editor.renderer.options.enableDrawMesh = false;
								break;

							case TarumaeEditor.DisplayModes.Image | TarumaeEditor.DisplayModes.Guide:
								editor.displayMode = TarumaeEditor.DisplayModes.All;
								editor.renderer.options.enableCustomDraw = true;
								editor.renderer.options.enableDrawMesh = true;
								break;
						}
					}
          
					editor.scene.requireUpdateFrame();
					isProcessed = true;
					break;

				case Viewer.Keys.Alt:
					if (editor.operationMode === TarumaeEditor.EditorOperationModes.AddObject) {
						if (editor.addingObject) {
							editor.addingObject.visible = false;
							editor.resizeGuideBox.visible = true;
							editor.resizeGuideBox.scale.set(0, 0, 0);
							editor.operationMode = TarumaeEditor.EditorOperationModes.FreeResize;
							scene.requireUpdateFrame();
						}
					}
					break;
			}
    
			return isProcessed;
		});

		scene.on("keyup", function(key) {
			switch (key) {
        
				case Viewer.Keys.Alt: 
					switch (editor.operationMode) {
						case TarumaeEditor.EditorOperationModes.FreeResize:
							if (editor.addingObject) {
								editor.addingObject.visible = true;
								editor.operationMode = TarumaeEditor.EditorOperationModes.AddObject;
							}

							var box = editor.resizeGuideBox;
							box.visible = false;
							box.status = "ready";
							scene.requireUpdateFrame();
							break;
					}
					break;
			}
		});
	},
});