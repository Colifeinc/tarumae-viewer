import Tarumae from "../entry";
import { Vec3 } from "../math/vector";

Tarumae.ScenePrologue = class {
  static defaultOptions() {
    return {
      effect: "tall",
      duration: 1
    };
  }

  constructor(scene, objects, options) {
    this.scene = scene;
    this.objects = objects;
    this.options = { ...Tarumae.ScenePrologue.defaultOptions(), ...options };
  }

  start() {
    const options = this.options;
    const session = this.scene.add(this.objects);

    this.oldCameraLocation = this.scene.mainCamera.location;
    this.oldCameraAngle = this.scene.mainCamera.angle;
    
    this.scene.mainCamera.location = options.startCameraLocation || new Vec3(-17.232386, 10, -12.892001);
    this.scene.mainCamera.lookAt(options.startCameraLookAt || new Vec3(0, 1, 0));
    
    session.on("objectMeshDownload", (obj, mesh) => {

      if (session.downloadMeshCount >= session.resourceMeshCount) {
        // wait for animation finish
        setTimeout(function() {
          this.onfinish();
        }, duration);
      }

      switch (options.effect) {
        case "tall":
          this.scene.animate({ duration: options.duration, effect: "smooth" }, t => obj.scale.y = t);
          break;
      
        case "fadein":
          var originLocation = obj.location.clone();

          var fadeLocation = new Vec3((Math.random() * 25) - 12.5, 0,
            (Math.random() * 25) - 12.5);

          this.scene.animate({ duration: options.duration, effect: "smooth" }, t => {
            obj.location = fadeLocation.lerp(originLocation, t);
          });
          
          break;
      }
    });

    return session;
  }
};

new Tarumae.EventDispatcher(Tarumae.ScenePrologue).registerEvents("progress", "finish");

