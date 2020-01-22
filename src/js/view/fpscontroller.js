import Tarumae from "../entry";
import { Vec3, Matrix4 } from "@jingwood/graphics-math";

Tarumae.FPSController = class {

  static defaultOptions() {
    return {
      moveSpeed: 0.2,
    };
  }

  constructor(scene, options) {
    this.scene = scene;
    this.renderer = scene.renderer;
    this.options = { ...Tarumae.FPSController.defaultOptions(), ...options };

    const viewer = this.renderer.viewer;
    let movementDetectingTimer = null;

    scene.on("keydown", _ => {
      if (!movementDetectingTimer) {
        movementDetectingTimer = setInterval(_ => {
          this.detectFirstPersonMove();
        }, 10);
      }
    });

    scene.on("keyup", _ => {
      if (viewer.pressedKeys.length === 0) {
        clearInterval(movementDetectingTimer);
        movementDetectingTimer = null;
      }
    });

    scene.on("begindrag", _ => {
      this.renderer.viewer.setCursor("none");
    });

    scene.on("enddrag", _ => {
      this.renderer.viewer.setCursor("auto");
    });

    scene.on("drag", _ => {
      const camera = scene.mainCamera;
    
      if (viewer && camera) {
        if (viewer.mouse.pressedButtons._t_contains(Tarumae.Viewer.MouseButtons.Left)
          || viewer.touch.fingers == 1) {
          
          if (viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
            this.dragToMoveCamera();
          } else {
            this.dragToRotateCamera();
          }
        }

        if (viewer.mouse.pressedButtons._t_contains(Tarumae.Viewer.MouseButtons.Right)
          || viewer.touch.fingers == 2) {
          this.dragToMoveCamera();
        }
      }
    });
  }

  dragToRotateCamera() {
    var viewer = this.renderer.viewer;
    var camera = this.scene.mainCamera;

    camera.angle.x -= viewer.mouse.movement.y * 200 / viewer.renderer.renderSize.width;
    camera.angle.y -= viewer.mouse.movement.x * 200 / viewer.renderer.renderSize.height;

    if (camera.angle.x < -80) camera.angle.x = -80;
    else if (camera.angle.x > 80) camera.angle.x = 80;

    camera.angle.y = (camera.angle.y + 360) % 360;
      
    this.scene.requireUpdateFrame();
  }
};

Tarumae.FPSController.prototype.dragToMoveCamera = (function() {
  var m;
    
  return function() {
    var viewer = this.renderer.viewer;
    var camera = this.scene.mainCamera;

    if (m === undefined) m = new Matrix4();
    m.loadIdentity().rotate(camera.angle);
          
    var transformedDir = new Vec3(
      viewer.mouse.movement.x * 50 / viewer.renderer.renderSize.width, 0,
      viewer.mouse.movement.y * 50 / viewer.renderer.renderSize.height).mulMat(m);

    camera.location.x += transformedDir.x;
    camera.location.z += transformedDir.z;

    camera.onmove();

    this.scene.requireUpdateFrame();
  };
})();
  
Tarumae.FPSController.prototype.detectFirstPersonMove = (function() {
  const m = new Matrix4(), dir = new Vec3();
    
  return function() {
    var scene = this.scene;
    var viewer = this.renderer.viewer;
    var Viewer = Tarumae.Viewer;

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
          camera.location.y += this.options.moveSpeed;
          scene.requireUpdateFrame();
        } else {
          dir.z = -1;
        }
      } else if (viewer.pressedKeys._t_contains(Viewer.Keys.S)
        || viewer.pressedKeys._t_contains(Viewer.Keys.Down)) {
        if (viewer.pressedKeys._t_contains(Viewer.Keys.Shift)) {
          camera.location.y -= this.options.moveSpeed;
          scene.requireUpdateFrame();
        } else {
          dir.z = 1;
        }
      }
      
      if (viewer.pressedKeys._t_contains(Viewer.Keys.Left)) {
        camera.angle.y += this.options.moveSpeed * 10;
        scene.requireUpdateFrame();
      } else if (viewer.pressedKeys._t_contains(Viewer.Keys.Right)) {
        camera.angle.y -= this.options.moveSpeed * 10;
        scene.requireUpdateFrame();
      }

      camera.angle.y = (camera.angle.y + 360) % 360;
        
      if (dir.x !== 0 || dir.y !== 0 || dir.z !== 0) {

        m.loadIdentity().rotate(camera.angle);
          
        var transformedDir = dir.mulMat(m);

        transformedDir.y = 0;
        transformedDir = transformedDir.normalize();

        // don't allow to change y if you don't want fly :)
        camera.move(transformedDir.x * this.options.moveSpeed, 0, transformedDir.z * this.options.moveSpeed);

        Tarumae.Utility.invokeIfExist(this, "oncameramove");
      }
    }
  };
})();