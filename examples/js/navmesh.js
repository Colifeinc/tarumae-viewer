
import Tarumae from '../../src/js/tarumae.js';
import { Vec3, Color4, MathFunctions as _mf } from "@jingwood/graphics-math";

window.addEventListener('load', function() {
  const renderer = new Tarumae.Renderer({
    backColor: new Color4(.05, .05, .2, 1),
    backgroundImage: "textures/bg-gray-gradient.jpg",
    enableShadow: true,
    shadowQuality: {
      scale: 8,
      viewDepth: 2,
      resolution: 512,
      intensity: 0.1,
      enableCache: true,
    },
  });

  const scene = renderer.createScene();
  scene.animation = true;

  const navmesh = {
    mesh: "models/navmesh.mesh",
    location: [0, 0.01, 0],
    scale: [0.7, 0.7, 0.7],
    mat: { color: [.2, .2, .2] },
  };

  const navmeshWall = {
    mesh: "models/navmesh_bounds.mesh",
    location: [0, 0, 0],
    scale: [0.7, 1, 0.7],
    mat: { color: [.4, .5, .6] },
  };

  const sphere = new Tarumae.Shapes.Sphere();
  sphere.scale.set(.1, .1, .1);
  sphere.mat = {color : [.6, 1.0, .4], emission: 0.5};
  sphere.location.y = 0.1;

  const sp2 = new Tarumae.Shapes.Sphere();
  sp2.receiveLight = false;
  sp2.mat = { color: [0.2, 0.5, 1], transparency: 1 };
  sphere.add(sp2);

  setInterval(_ => {
    scene.animate({ duration: 1 }, t => {
      const d = t * 5;
      sp2.scale.set(d, d, d);
      sp2.mat.transparency = t;
    });
  }, 2000);

  sphere.collisionMode = Tarumae.CollisionModes.NavMesh;
  sphere.collisionTarget = navmesh;
  sphere.collisionOption = {};

  const session = scene.load(navmesh, navmeshWall, {
    light: {
      location: [0, 3, 0],
      mat: { emission: 2.0 },
    }
  });

  // when the mesh is loaded, request to update the shadow map.
  // (by default, Tarumae caches the shadow map until request to update)
  session.on("finish", _ => scene.shadowMapUpdateRequested = true);

  scene.add(sphere);
  
  scene.sun.location.set(0, 5, 0);
  
  let dirx = 0, diry = 0;
  scene.onmousemove = function() {
    dirx += renderer.viewer.mouse.movement.x * 0.001;
    diry += renderer.viewer.mouse.movement.y * 0.001;

    dirx = _mf.clamp(dirx, -0.1, 0.1);
    diry = _mf.clamp(diry, -0.1, 0.1);
  };

  setInterval(function() {
    if (!sphere.move(dirx, 0, diry)) {
      dirx = 0; diry = 0;
    }

    if (renderer.viewer.pressedKeys.includes(Tarumae.Viewer.Keys.Up)) {
      diry = -0.05;
    } else if (renderer.viewer.pressedKeys.includes(Tarumae.Viewer.Keys.Down)) {
      diry = 0.05;
    }

    if (renderer.viewer.pressedKeys.includes(Tarumae.Viewer.Keys.Left)) {
      dirx = -0.05;
    } else if (renderer.viewer.pressedKeys.includes(Tarumae.Viewer.Keys.Right)) {
      dirx = 0.05;
    }
  }, 10);

  scene.mainCamera.fieldOfView = 50;
  scene.mainCamera.location.set(0, 10, 10);
  scene.mainCamera.angle.set(-50, 0, 0);

  scene.show();
});
