import Tarumae from "../entry";

Tarumae.ObjectViewController = class {
  constructor(scene, {
    enableHorizontalRotation = true,
    enableVerticalRotation = true,
    enableScrollToScaleObject = true,
  
    minVerticalRotateAngle = -90,
    maxVerticalRotateAngle = 90,

    minOriginDistance = 0,
    maxOriginDistance = 50,
  
    enableDragAcceleration = true,
    dragAccelerationAttenuation = 0.03,
    dragAccelerationIntensity = 5,

    object,
  } = {}) {
    this.scene = scene;
    this.renderer = scene.renderer;
    this.viewer = scene.renderer.viewer;
    this._enabled = true;
    this.object = object;
    
    this.enableHorizontalRotation = enableHorizontalRotation;
    this.enableVerticalRotation = enableVerticalRotation;
    this.enableScrollToScaleObject = enableScrollToScaleObject;
    this.minVerticalRotateAngle = minVerticalRotateAngle;
    this.maxVerticalRotateAngle = maxVerticalRotateAngle;
    this.minOriginDistance = minOriginDistance;
    this.maxOriginDistance = maxOriginDistance;
    this.enableDragAcceleration = enableDragAcceleration;
    this.dragAccelerationAttenuation = dragAccelerationAttenuation;
    this.dragAccelerationIntensity = dragAccelerationIntensity;

    this.sceneDragHandlerListener = scene.on("drag", _ => this.sceneDragHandler());
    this.sceneMouseWheelHandlerListener = scene.on("mousewheel", _ => this.sceneMouseWheelHandler());
    this.sceneMouseDragAccelerationHandler = scene.on("enddrag", _ => this.dragAcceleration());

    this.startDragTime = 0;
    this.scene.on("begindrag", _ => {
      this.startDragTime = Date.now();
    });
  }

  get enabled() {
    return _enabled;
  }
  set enabled(v) {
    this._enabled = v;
  }

  sceneDragHandler() {
    if (!this._enabled) return;

    
    if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
      this.panObjectByMouseMove();
    } else if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Control)) {
      this.zoomViewByMouseButton();
    } else {
      this.dragToRotateObject();
    }
  }

  sceneMouseWheelHandler() {
    if (!this._enabled) return;

    this.zoomViewByMouseWheel();
  }

  zoomViewByMouseWheel() {
    if (!this._enabled) return;

    let s = this.viewer.originDistance - this.viewer.mouse.wheeldelta / 3000;
    if (s > 50) s = 50; else if (s < 0) s = 0;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  }

  zoomViewByMouseButton() {
    if (!this._enabled) return;

    let s = this.viewer.originDistance - (this.viewer.mouse.movement.x + this.viewer.mouse.movement.y) / -100;
    if (s > 50) s = 50; else if (s < 0) s = 0;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  }

  panObjectByMouseMove() {
    if (!this._enabled || !this.object) return;

    this.object.moveOffset(this.viewer.mouse.movement.x / 50, -this.viewer.mouse.movement.y / 50, 0);
  }

  limitViewAngleScope() {
    if (!this.object) return;

    if (this.object.angle.x < this.minVerticalRotateAngle) this.object.angle.x = this.minVerticalRotateAngle;
    if (this.object.angle.x > this.maxVerticalRotateAngle) this.object.angle.x = this.maxVerticalRotateAngle;

    if (this.object.angle.y < 0) this.object.angle.y += 360;
    if (this.object.angle.y > 360) this.object.angle.y -= 360;
  }

  dragToRotateObject() {
    if (!this._enabled || !this.object) return;

    const movement = this.viewer.mouse.movement;

    if (this.enableHorizontalRotation) {
      this.object.angle.y += movement.x;
    }
    if (this.enableVerticalRotation) {
      this.object.angle.x += movement.y;
    }

    this.limitViewAngleScope();
    this.scene.requireUpdateFrame();
  }

  dragAcceleration() {
    if (!this._enabled || !this.object) return;
    if (!this.enableDragAcceleration) return;

    const scene = this.scene, viewer = this.viewer;

    if ((Date.now() - this.startDragTime) < 300) {
      Tarumae.Utility.performMovementAccelerationAnimation(scene,
        this.dragAccelerationIntensity, this.dragAccelerationAttenuation, (xdiff, ydiff) => {

          if (this.enableHorizontalRotation) {
            this.object.angle.y += xdiff;
          }

          if (this.enableVerticalRotation) {
            this.object.angle.x += ydiff;
          }

          this.limitViewAngleScope();
        });
    }
  }
};
