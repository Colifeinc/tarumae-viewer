////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec3, Vec4 } from "../math/vector";
import "../math/matrix";
import "../view/modelviewer";
import "../view/touchcontroller";
import "../view/objectcontroller";
import "../view/fpscontroller";

Tarumae.Viewer = class {
	constructor(renderer) {
		this.renderer = renderer;

		this.location = new Vec3(0, 0, 0);
		this.angle = new Vec3(0, 0, 0);
		this.scale = new Vec3(1, 1, 1);
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
					case 0: mouse.pressedButtons._t_pushIfNotExist(Tarumae.Viewer.MouseButtons.Left); break;
					case 1: mouse.pressedButtons._t_pushIfNotExist(Tarumae.Viewer.MouseButtons.Middle); break;
					case 2: mouse.pressedButtons._t_pushIfNotExist(Tarumae.Viewer.MouseButtons.Right); break;
				}

				viewer.operationMode = Tarumae.Viewer.OperationModes.DragReady;
      
				viewer.performSceneMouseDown();
			});
 
			surface.addEventListener("mousemove", e => {
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

					// FIXME: integrated 2D 3D event system
					if (this.renderer.current2DScene) {
						this.renderer.current2DScene.mousemove(this.mouse.position);
					}
				}
			});
  
			surface.addEventListener("mousewheel", function(e) {
				viewer.mouse.wheeldelta = e.wheelDelta;

				var scene = viewer.renderer.currentScene;
      
				if (scene && typeof scene.onmousewheel === "function") {
					scene.onmousewheel();
					e.preventDefault();
				}
			}, { passive: false });

			surface.addEventListener('keydown', function(e) {
				viewer.pressedKeys._t_pushIfNotExist(e.keyCode);
      
				var isProcessed = false;

				var scene = viewer.renderer.currentScene;
      
				if (scene) {
					var renderer = viewer.renderer;

					if (renderer.debugMode) {
						if ((e.keyCode == Viewer.Keys.Z
							|| e.keyCode == Viewer.Keys.P)
							&& !viewer.pressedKeys._t_contains(Viewer.Keys.Control)
							&& !viewer.pressedKeys._t_contains(Viewer.Keys.Shift)
							&& !viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Firefox)
							&& !viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Opera)
							&& !viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Left)
							&& !viewer.pressedKeys._t_contains(Viewer.Keys.MacCommand_Right)) {
            
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

						if (viewer.pressedKeys._t_contains(Viewer.Keys.Shift)
							&& viewer.pressedKeys._t_contains(Viewer.Keys.Control)) {

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
			
			surface.addEventListener("mouseout", function(e) {
				const scene = viewer.renderer.currentScene;
				
				if (scene) {
					Tarumae.Utility.invokeIfExist(scene, "mouseout");
				}

				if (viewer.renderer.current2DScene) {
					Tarumae.Utility.invokeIfExist(viewer.renderer.current2DScene, "mouseout");
				}
			});

			surface.addEventListener("blur", function(e) {
				viewer.pressedKeys._t_clear();
				viewer.mouse.pressedButtons._t_clear();
			});

			window.addEventListener("blur", function(e) {
				viewer.pressedKeys._t_clear();
				viewer.mouse.pressedButtons._t_clear();
			});

			window.addEventListener("keyup", function(e) {
				viewer.pressedKeys._t_remove(e.keyCode);

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
				case 0: mouse.pressedButtons._t_remove(Tarumae.Viewer.MouseButtons.Left); break;
				case 1: mouse.pressedButtons._t_remove(Tarumae.Viewer.MouseButtons.Middle); break;
				case 2: mouse.pressedButtons._t_remove(Tarumae.Viewer.MouseButtons.Right); break;
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
		}, { passive: false });

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
	}

	performSceneMouseDown() {
		const scene = this.renderer.currentScene;

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
	}

	performSceneMouseUp() {
		const scene = this.renderer.currentScene;

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
	}

	setCursor(type) {
		this.renderer.surface.style.cursor = type;
	}

	focusAt(target, options) {
		options = options || {};

		let bbox, size = 1;
		let targetLocation;

		if (target instanceof SceneObject) {
			bbox = target.getBounds();
			if (bbox) {
				bbox = new Tarumae.BoundingBox(bbox.min, bbox.max);
				size = Math.max(bbox.size.x, bbox.size.y, bbox.size.z);
				target = bbox.origin;
			} else {
				target = target.worldLocation;
			}
        
			targetLocation = target.neg();
		} else if (target instanceof Vec3) {
			targetLocation = target;
		} else {
			return;
		}

		let targetScale = options.targetScale || (size * 0.15);
		if (targetScale < 0.55) targetScale = 0.55;
        
		var scene = this.renderer.currentScene;

		if (options.animation === true && scene) {
			var startLocation = this.location.clone();
			var startScale = this.originDistance;

			scene.animate({
				name: "_tarumae_viewer_focus_at",
				duration: options.duration || 0.5,
				effect: "smooth",
			}, t => {
				this.location = startLocation.lerp(targetLocation, t);
				if (options.scaleToFitView) this.originDistance = startScale * (1 - t) + targetScale * t;
			});
		} else {
			this.location = targetLocation;
			if (options.scaleToFitView) this.originDistance = targetScale;
			if (scene) scene.requireUpdateFrame();
		}
	}

	rotateTo(angles, options) {
		options = options || {};

		if (options.append) {
			angles = Vec3.add(angles, this.angle);
		}
    
		var scene = this.renderer.currentScene;
		if (scene) {
			var curAngles = this.angle;

			scene.animate({
				name: "_tarumae_viewer_rotate_to",
				duration: options.duration || 0.5,
				effect: options.effect || "smooth",
			}, t => {
				this.angle = curAngles.lerp(angles, t);
			}, _ => {
				while (this.angle.x > 180) this.angle.x -= 360;
				while (this.angle.y > 180) this.angle.y -= 360;
				while (this.angle.z > 180) this.angle.z -= 360;
				while (this.angle.x < -180) this.angle.x += 360;
				while (this.angle.y < -180) this.angle.y += 360;
				while (this.angle.z < -180) this.angle.z += 360;
			});
		}
	}
};

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
		Front: new Vec3(0, 0, 0),
		Back: new Vec3(0, 180, 0),
		Top: new Vec3(90, 0, 0),
		Bottom: new Vec3(-90, 0, 0),
		Left: new Vec3(0, -90, 0),
		Right: new Vec3(0, 90, 0),
	},
});

Tarumae.Viewer.prototype.moveOffset = (function() {
	let m;

	return function(offsetX, offsetY, offsetZ) {

		if (m === undefined) m = new Tarumae.Matrix4();
		m.loadIdentity().rotate(this.angle).inverse();

		var v = new Vec4(offsetX, offsetY, offsetZ, 1).mulMat(m);
		this.location.offset(v);

		var scene = this.renderer.currentScene;
		if (scene) scene.requireUpdateFrame();
	};
})();