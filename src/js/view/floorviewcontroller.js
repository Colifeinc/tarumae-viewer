import Tarumae from "../entry";
import "./touchcontroller";
import "../utility/event";

import { Vec3, BoundingBox3D } from "@jingwood/graphics-math";

const ringTobaURL =
  `data:text/plain;base64,
  dG9iYQABAAAQAAAAAAAAABAAAAAAAQAAAgAAAAAAAAABAAAAbWlmdEAAAACcAAAA
  AQAAAAAAAADGrY8kbWVzaNwAAACgAgAAAQAAAAAAAAB42mWOQQ6DIBBF95yCsCaK
  1Cp6iF6gaQi1VE0UGoaNMd69I7bddFbvz7xM/kqYnk20YTQTsJauhFJ28c5+GFPn
  Jx8wXkWmxD6c/tONH3I/eYAF7Z9y7GMwDl4mWNctBZ5PpZBnUStVFLKSTV1lyRZo
  b2TjhIXR9d8+s4UBmYG/t3mudRxG0DqXpXqaR1cxniQTdyd1J/jjDSDfNrp42u2W
  MUtcQRDHV1AuEWMRtU4ZsToLSQLhPVPZWoTUaQwaYhHSBBQ8COQDGAh+ABELbUKu
  SMDdwHmVtTap1UY8G7ETZ/Z2zt8eRz5AeA/k/X3u/md2ZvaHq0ufloeHRt1n59wf
  +Rly3ed2w7kfl9cPnWuE7hd9N8qk07v3zNtb970dW1z/ueH++bz78iF61Dqt4tfH
  J1FfPD4unv99HfXJi/HyaOJljL2/PVXc5+EavyfXot5rLxSi4/oV0a9mZqP+drhZ
  0L8+MxvsO/fKmmBr7EwHz742JW5pcekvecb14xPH2V7JOSDnuP5qe8rT03w67QV/
  MzwX18u7pCd93qT8pzstT0/6yB6vWutHT9kftdbyaarnuXyrp/qcHG56+jfld9X6
  d+6Vs3nr1X48j3PWE5sJqWP8rnU9k9iqH4zMhd3U07rkyBzgk/nDp0Q+mT/Wh7bU
  KOUZvm/Vot7ZqmU5WJaPWmXmj/xL1DDzRx2Czo1qma8s7ullq7D1V3FGu+eiv/Sp
  sLiSZ7A86Y/ehZW0/kjOy7iM1UzftV/0n+5012hvMVect4AZ03cj1SeLy/7qXNqM
  0f881UF7a/dL+0Z/3BG/k3qkveLem9Qv7Rvuu+de3FlPVnAvuaHnGcAKT4aQD+QG
  /ckfevaxqMcHcoOe5A89ySKyQud1EIvICnqSRWQFfehPVthMal/oTz6QG/Qnf+hD
  f959MoGe5A89yaI+/vTmlrPKu08mMC75w7hkEfnDuGQROaCzYgxhXPKHccki8odx
  ySJygLGYwyD+WP+NReQP45JF5MD7e88sB/KHccki8odxySL2kbGYA/nDuGQR+cO4
  ZBH5Q0+yiPyhJ1lEPtCTLCIr6JmzqP//qEpXutKVrnSlK13p/1vfAcVDMGE=`;

Tarumae.FloorViewController = class {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.camera = options.camera || scene.mainCamera;

    this.topViewStatus = {
      topViewMode: false,
      topViewHeight: 30,
      lastCameraLoc: undefined,
      lastCameraRot: undefined
    };

    this.cameraFovWalk = options.cameraFovWalk || 75;
    this.cameraFovTop = options.cameraFovTop || 90;

    this._targetObject = options.targetObject;

    this.ring = options.cursorObject;
    if (!this.ring) {
      this.scene.createObjectFromURL(ringTobaURL, obj => {
        if (obj && obj.meshes.length > 0) {
          obj.visible = false;
          obj.opacity = 0.5;
          obj.receiveLight = false;
          this.ring = obj;
          this.scene.add(obj);
        }
      });
    }

    this.scene.on("mousemove", () => {
      if (this.ring) {
        const rs = this.scene.findObjectsByCurrentMousePosition({
          filter: _obj => _obj === this.targetObject
        });

        if (rs.object) {
          const wpos = rs.worldPosition;
          this.ring.location.set(wpos.x, 0.005, wpos.z);
          this.ring.visible = true;

          if (this.topViewStatus.topViewMode) {
            this.ring.scale.set(1, 1, 1);
          } else {
            this.ring.scale.set(0.5, 0.5, 0.5);
          }

          this.scene.requireUpdateFrame();
        } else {
          if (this.ring.visible) {
            this.ring.visible = false;
            this.scene.requireUpdateFrame()
          }
        }
      }
    })

    this.scene.on("mouseup", () => {
      if (this.ring) {
        const rs = this.scene.findObjectsByCurrentMousePosition({
          filter: _obj => _obj === this.targetObject
        })

        if (rs.object) {
          this.ring.visible = false;

          const wpos = rs.worldPosition;

          if (this.topViewStatus.topViewMode) {
            this.toggleTopView(new Vec3(wpos.x, 1.4, wpos.z));
          } else {
            const targetPos = new Vec3(wpos.x, this.camera.location.y, wpos.z);
            const startPos = this.camera.location.clone();

            this.scene.animate(_, t =>
              this.camera.location = startPos.lerp(targetPos, t)
            );
          }
          return true;
        }
      }
    });

    scene.on("drag", () => {
      if (this.topViewStatus.topViewMode) {
        if (this.targetObject) {
          scene.renderer.viewer.angle.y += scene.renderer.viewer.mouse.movement.x;
          scene.renderer.viewer.angle.y = scene.renderer.viewer.angle.y % 360;

          scene.renderer.viewer.angle.x += scene.renderer.viewer.mouse.movement.y;
          if (scene.renderer.viewer.angle.x < -70) scene.renderer.viewer.angle.x = -70;
          else if (scene.renderer.viewer.angle.x > 10) scene.renderer.viewer.angle.x = 10;

          scene.requireUpdateFrame();
        }
      }
    });

    scene.on("keyup", key => {
      if (key === 32) {
        this.toggleTopView();
      }
    });

    this.camera.location.set(0, 10, 3);
    this.camera.angle.set(0, 0, 0);
    this.camera.fieldOfView = this.cameraFovTop;
    this.topViewStatus.topViewMode = true;
    this.topViewStatus.lastCameraLoc = new Vec3(0, 1.4, 0);
    this.topViewStatus.lastCameraRot = { dir: Vec3.forward, up: Vec3.up };

    this.cameraController = new Tarumae.TouchController(this.scene, {
      speed: 0.05,
      distance: 2,
      clickToMove: false,
    })
    this.cameraController.enabled = false;


    document.addEventListener("mousewheel", e => {
      function onmousewheel(e) {
        if (this.topViewStatus.topViewMode) {
          scene.mainCamera.location.y += (e.deltaX + e.deltaY + e.deltaZ) / 500;
          if (scene.mainCamera.location.y < 9) scene.mainCamera.location.y = 9;
          else if (scene.mainCamera.location.y > 40) scene.mainCamera.location.y = 40;
          scene.requireUpdateFrame();
        } else {
          scene.mainCamera.forward(-(e.deltaX + e.deltaY + e.deltaZ) / 500, { animation: true });
        }
        return false;
      }

      onmousewheel.call(this, e);
      e.preventDefault();
      return false;
    }, { passive: false });
  }

  get targetObject() {
    return this._targetObject;
  }

  set targetObject(obj) {
    this._targetObject = obj;
    
    if (this.camera) {
      const bbox = new BoundingBox3D(obj.getBounds());
      const maxbsize = Math.max(bbox.size.x, bbox.size.y, bbox.size.z);
      
      let topY = maxbsize / 5;
      if (topY < 10) topY = 10;
      else if (topY > 40) topY = 40;

      this.camera.location.set(0, topY, 3);
      this.camera.lookAt(bbox.origin, Vec3.forward);
      
      this.topViewStatus.topViewHeight = this.camera.location.y;
    }
  }

  toggleTopView(toPos) {
    const tvs = this.topViewStatus;
    const camera = this.camera;

    if (!tvs.topViewMode) {
      // to top mode
      tvs.lastCameraLoc = camera.location.clone();
      tvs.lastCameraRot = camera.getLookAt();
      tvs.topViewMode = true;

      camera.moveTo(new Vec3(0, this.topViewStatus.topViewHeight, 3), {
        lookdir: new Vec3(0, -1, -0.2),
        lookup: Vec3.forward
      });

      this.onbeginChangeMode();

      this.scene.animate({}, t => {
        camera.fieldOfView = this.cameraFovWalk + t * (this.cameraFovTop - this.cameraFovWalk);
        this.scene.renderer.viewer.angle.y = tvs.lastViewerAngleY * t;
        this.scene.renderer.viewer.angle.x = tvs.lastViewerAngleX * t;
      }, () => {
        camera.fieldOfView = this.cameraFovTop;
        this.onmodeChanged();
      });

      this.cameraController.enabled = false;
    } else {
      // to walk mode
      tvs.topViewMode = false;
      tvs.lastViewerAngleY = this.scene.renderer.viewer.angle.y;
      tvs.lastViewerAngleX = this.scene.renderer.viewer.angle.x;

      camera.moveTo((toPos instanceof Vec3) ? toPos : tvs.lastCameraLoc, {
        lookdir: tvs.lastCameraRot.dir,
        lookup: tvs.lastCameraRot.up
      });
        
      this.onbeginChangeMode();

      this.scene.animate({}, t => {
        camera.fieldOfView = this.cameraFovTop - t * (this.cameraFovTop - this.cameraFovWalk);
        this.scene.renderer.viewer.angle.y = tvs.lastViewerAngleY * (1 - t);
        this.scene.renderer.viewer.angle.x = tvs.lastViewerAngleX * (1 - t);
      }, () => {
          camera.fieldOfView = this.cameraFovWalk;
          this.onmodeChanged();
      });

      this.cameraController.enabled = true;
    }
  }
}

new Tarumae.EventDispatcher(Tarumae.FloorViewController).registerEvents(
  "beginChangeMode", "modeChanged");