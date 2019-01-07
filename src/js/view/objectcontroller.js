import Tarumae from "../entry";

Tarumae.ObjectController = class {
  constructor(scene, {
    enableVerticalRotation = false
  } = {}) {
    this.scene = scene;
    this.renderer = scene.renderer;
    this.viewer = scene.renderer.viewer;
    this.object = null;
  
    this.minRotateX = -90;
    this.maxRotateX = 90;
    this.startDragTime = 0;
    this.enableDragAcceleration = true;
    this.dragAccelerationAttenuation = 0.03;
    this.dragAccelerationIntensity = 5;

    this.sceneDragHandlerListener = undefined;
    this.sceneMouseWheelHandlerListener = undefined;
    this.sceneMouseDragAccelerationHandler = undefined;

    this.enableHorizontalRotation = true;
    this.enableVerticalRotation = enableVerticalRotation;
    
    this.scene.on("begindrag", _ => {
      this.startDragTime = Date.now();
    });

    this.attach();
  }

  attach() {
    const scene = this.scene;

    if (scene) {
      this.sceneDragHandlerListener = scene.on("drag", _ => this.sceneDragHandler());
      this.sceneMouseWheelHandlerListener = scene.on("mousewheel", _ => this.sceneMouseWheelHandler());
      this.sceneMouseDragAccelerationHandler = scene.on("enddrag", _ => this.dragAcceleration());
    }
  }
  
  detach() {
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
  }

  sceneDragHandler() {
    if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
      this.panViewByMouseMove();
    } else if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Control)) {
      this.zoomViewByMouseButton();
    } else {
      this.dragToRotateObject();
    }
  }

  sceneMouseWheelHandler() {
    this.zoomViewByMouseWheel();
  }

  zoomViewByMouseWheel() {
    let s = this.viewer.originDistance - this.viewer.mouse.wheeldelta / 3000;
    if (s > 50) s = 50; else if (s < 0) s = 0;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  }

  zoomViewByMouseButton() {
    let s = this.viewer.originDistance - (this.viewer.mouse.movement.x + this.viewer.mouse.movement.y) / -100;
    if (s > 50) s = 50; else if (s < 0) s = 0;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  }

  panViewByMouseMove() {
    this.viewer.moveOffset(this.viewer.mouse.movement.x / 50, -this.viewer.mouse.movement.y / 50, 0);
  }

  limitViewAngleScope() {
    if (this.viewer.angle.x < this.minRotateX) this.viewer.angle.x = this.minRotateX;
    if (this.viewer.angle.x > this.maxRotateX) this.viewer.angle.x = this.maxRotateX;

    if (this.viewer.angle.y < 0) this.viewer.angle.y += 360;
    if (this.viewer.angle.y > 360) this.viewer.angle.y -= 360;
  }

  dragToRotateObject() {
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