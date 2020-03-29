
import Tarumae from '../../src/js/tarumae.js';
import { Vec3, Color4, MathFunctions as _mf } from "@jingwood/graphics-math";

window.addEventListener('load', function() {
  const renderer = new Tarumae.Renderer({
    backColor: new Color4(.05, .05, .2, 1),
		backgroundImage: "img/bg-gray-gradient.jpg",
  });

  const scene = renderer.createScene();
  scene.animation = true;

  // scene.onframe = function() {
  //   renderer.drawText(10, 200, "Moveable direction detecting: " + 
  //   !renderer.viewer.pressedKeys._s3_contains(Tarumae.Viewer.Keys.Shift));
  // };

  const navmesh = {
    mesh: "models/navmesh.mesh",
    visible: false,
  };

  const navmeshWall = {
    mesh: "models/navmesh_bounds.mesh",
    location: [0,0.01,0],
    mat: { color: [.4, .5, .6], roughness: 0.1 },
  };

  const sphere = new Tarumae.Shapes.Sphere();
  sphere.scale.set(.15, .15, .15);
  sphere.mat = {color : [.6, 1.0, .4], emission: 0.5};
  sphere.location.y = 0.1;

  sphere.collisionMode = Tarumae.CollisionModes.NavMesh;
  sphere.collisionTarget = navmesh;
  sphere.collisionOption = {};

  scene.load(navmesh, navmeshWall, {
    light: {
      location: [0, 3, 0],
      mat: { emission: 2.0 },
    }
  });

  scene.add(sphere);
  
  scene.sun.location.set(-1, 1, 1);

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
    } else if(renderer.viewer.pressedKeys.includes(Tarumae.Viewer.Keys.Down)) {
      diry = 0.05;
    }

    if (renderer.viewer.pressedKeys.includes(Tarumae.Viewer.Keys.Left)) {
      dirx = -0.05;
    } else if(renderer.viewer.pressedKeys.includes(Tarumae.Viewer.Keys.Right)) {
      dirx = 0.05;
    }
  }, 10);

  scene.mainCamera.fieldOfView = 50;
  scene.mainCamera.location.set(0, 16, 16);
  scene.mainCamera.angle.set(-50, 0, 0);

  scene.show();
});
