import Tarumae from "../entry";

Tarumae.ModelViewer = class {
  constructor(scene, {
    dragBehavior,
  } = {}) {
    this.scene = scene;
    this.renderer = scene.renderer;
    this.viewer = scene.renderer.viewer;
    this.enabled = true;
  
    this.minRotateX = -90;
    this.maxRotateX = 90;
    this.startDragTime = 0;
    this.enableDragAcceleration = true;
    this.dragAccelerationAttenuation = 0.03;
    this.dragAccelerationIntensity = 5;
    this.maximalZoomDistance = 10;
    this.minimalZoomDistance = 0;
    this.dragBehavior = dragBehavior;

    this.sceneDragHandlerListener = undefined;
    this.sceneMouseWheelHandlerListener = undefined;
    this.sceneMouseDragAccelerationHandler = undefined;
    
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
    if (!this.enabled) return;

    if (this.dragBehavior === "pan") {
      if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
        this.dragToRotateScene();
      } else {
        this.panViewByMouseMove();
      }
    } else {
      if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
        this.panViewByMouseMove();
      } else if (this.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Control)) {
        this.zoomViewByMouseButton();
      } else {
        this.dragToRotateScene();
      }
    }
  }

  sceneMouseWheelHandler() {
    if (!this.enabled) return;

    this.zoomViewByMouseWheel();
  }

  zoomViewByMouseWheel() {
    if (!this.enabled) return;

    let s = this.viewer.originDistance - this.viewer.mouse.wheeldelta / 3000;
    if (s > this.maximalZoomDistance) s = this.maximalZoomDistance; else if (s < this.minimalZoomDistance) s = this.minimalZoomDistance;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  }

  zoomViewByMouseButton() {
    if (!this.enabled) return;

    let s = this.viewer.originDistance - (this.viewer.mouse.movement.x + this.viewer.mouse.movement.y) / -100;
    if (s > this.maximalZoomDistance) s = this.maximalZoomDistance; else if (s < this.minimalZoomDistance) s = this.minimalZoomDistance;
    this.viewer.originDistance = s;
    this.scene.requireUpdateFrame();
  }

  panViewByMouseMove() {
    if (!this.enabled) return;

    this.viewer.moveOffset(this.viewer.mouse.movement.x / 50, -this.viewer.mouse.movement.y / 50, 0);
  }

  limitViewAngleScope() {
    if (!this.enabled) return;

    if (this.viewer.angle.x < this.minRotateX) this.viewer.angle.x = this.minRotateX;
    if (this.viewer.angle.x > this.maxRotateX) this.viewer.angle.x = this.maxRotateX;

    if (this.viewer.angle.y < 0) this.viewer.angle.y += 360;
    if (this.viewer.angle.y > 360) this.viewer.angle.y -= 360;
  }

  dragToRotateScene() {
    if (!this.enabled) return;

    const movement = this.viewer.mouse.movement;

    this.viewer.angle.y += movement.x;
    this.viewer.angle.x += movement.y;

    this.limitViewAngleScope();
    this.scene.requireUpdateFrame();
  }

  dragAcceleration() {
    if (!this.enabled) return;
    if (this.dragBehavior === "pan") return;
    if (!this.enableDragAcceleration) return;

    const scene = this.scene, viewer = this.viewer;

    if ((Date.now() - this.startDragTime) < 300) {
      Tarumae.Utility.performMovementAccelerationAnimation(scene,
        this.dragAccelerationIntensity, this.dragAccelerationAttenuation, (xdiff, ydiff) => {
          viewer.angle.y += xdiff;
          viewer.angle.x += ydiff;

          this.limitViewAngleScope();
        });
    }
  }
};