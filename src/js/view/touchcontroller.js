import Tarumae from "../entry";
import { Vec3, Matrix4 } from "@jingwood/graphics-math";

Tarumae.TouchController = class {
	static defaultOptions() {
		return {
			speed: 0.02,
			distance: 1,
			clickToMove: true,
			dragAccelerationAttenuation: 0.05,
			dragAccelerationIntensity: 2.5,
		}
	}

	constructor(scene, options) {
		this.scene = scene;
		this.renderer = scene.renderer;
		this.options = { ...Tarumae.TouchController.defaultOptions(), ...options };
		this._enabled = true;

		const viewer = this.renderer.viewer;
		const Viewer = Tarumae.Viewer;
		const controller = this;
  
		var m = new Matrix4(), dir = new Vec3();
  
		var detectFirstPersonMove = () => {
			if (scene && scene.mainCamera) {
				var camera = scene.mainCamera;

				dir.set(0, 0, 0);

				if (viewer.pressedKeys._t_contains(Viewer.Keys.A)) {
					dir.x = -1;
				} else if (viewer.pressedKeys._t_contains(Viewer.Keys.D)) {
					dir.x = 1;
				}

				if (viewer.pressedKeys._t_contains(Viewer.Keys.W)
					|| viewer.pressedKeys._t_contains(Viewer.Keys.Up)) {
					if (viewer.pressedKeys._t_contains(Viewer.Keys.Shift)) {
						camera.location.y += this.options.speed;
						scene.requireUpdateFrame();
					} else {
						dir.z = -1;
					}
				} else if (viewer.pressedKeys._t_contains(Viewer.Keys.S)
					|| viewer.pressedKeys._t_contains(Viewer.Keys.Down)) {
					if (viewer.pressedKeys._t_contains(Viewer.Keys.Shift)) {
						camera.location.y -= this.options.speed;
						scene.requireUpdateFrame();
					} else {
						dir.z = 1;
					}
				}
    
				if (viewer.pressedKeys._t_contains(Viewer.Keys.Left)) {
					camera.angle.y += this.options.speed * 20;
					scene.requireUpdateFrame();
				} else if (viewer.pressedKeys._t_contains(Viewer.Keys.Right)) {
					camera.angle.y -= this.options.speed * 20;
					scene.requireUpdateFrame();
				}

				camera.angle.y = (camera.angle.y + 360) % 360;

				if (dir.x !== 0 || dir.y !== 0 || dir.z !== 0) {

					m.loadIdentity().rotate(camera.angle);
        
					var transformedDir = dir.mulMat(m);
        
					transformedDir.y = 0;
					transformedDir = transformedDir.normalize();

					// don't allow to change y if you don't want fly :)
					camera.move(transformedDir.x * this.options.speed * 2,
						0, transformedDir.z * this.options.speed * 2);

					Tarumae.Utility.invokeIfExist(this, "oncameramove");
				}
			}
		};
		
		this.frameDetect = () => {
			if (!this._enabled) return;

			detectFirstPersonMove();
			requestAnimationFrame(this.frameDetect);
		}
	
		requestAnimationFrame(this.frameDetect);

		var startDragTime;

		scene.on("begindrag", function() {
			if (!controller._enabled) return;

			startDragTime = Date.now();
		});

		scene.on("enddrag", _ => {
			if (!controller._enabled) return;

			if ((Date.now() - startDragTime) < 300) {
				Tarumae.Utility.performMovementAccelerationAnimation(scene,
          this.options.dragAccelerationIntensity, this.options.dragAccelerationAttenuation,
          (xdiff, ydiff) => {
						scene.mainCamera.angle.y += xdiff;
						scene.mainCamera.angle.x += ydiff;
					});
			}
		});

		if (this.options.clickToMove) {
			this.scene.on("mouseup", () => {
				if (!controller._enabled) return;

				var camera = scene.mainCamera;
				if (camera) {
					if (viewer.pressedKeys._t_contains(Viewer.Keys.Shift)
						|| viewer.mouse.pressedButtons._t_contains(Viewer.MouseButtons.Right)) {
						camera.backward(this.options.distance, this.options);
					} else {
						camera.forward(this.options.distance, this.options);
					}
				}
			});
		}

		this.scene.on("drag", (function() {
			var m = new Matrix4();
  
			return function() {
				if (!controller._enabled) return;

				var viewer = this.renderer.viewer;
				var camera = this.mainCamera;
  
				if (viewer && camera) {
					if (viewer.mouse.pressedButtons._t_contains(Viewer.MouseButtons.Left)
						|| viewer.touch.fingers === 1) {
						camera.angle.x += viewer.mouse.movement.y * 200 / viewer.renderer.renderSize.width;
						camera.angle.y += viewer.mouse.movement.x * 200 / viewer.renderer.renderSize.height;

						if (camera.angle.x < -80) camera.angle.x = -80;
						else if (camera.angle.x > 80) camera.angle.x = 80;

						camera.angle.y = (camera.angle.y + 360) % 360;
          
						this.requireUpdateFrame();
					}

					if (viewer.mouse.pressedButtons._t_contains(Viewer.MouseButtons.Right)
						|| viewer.touch.fingers == 2) {

						m.loadIdentity().rotate(camera.angle);
        
						var transformedDir = new Vec3(
							viewer.mouse.movement.x * 30 / viewer.renderer.renderSize.width, 0,
							viewer.mouse.movement.y * 30 / viewer.renderer.renderSize.height).mulMat(m);

						camera.move(-transformedDir.x, 0, -transformedDir.z);
					}
				}
			};
		})());
	}

	get enabled() {
		return this._enabled;
	}

	set enabled(v) {
		if (v && !this._enabled) {
			requestAnimationFrame(this.frameDetect);
		}
		this._enabled = v;
	}
};