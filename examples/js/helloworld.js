import Tarumae from '../../src/js/tarumae.js';

window.addEventListener("load", function() {
  // create renderer and scene
  const renderer = new Tarumae.Renderer();
  const scene = renderer.createScene();

  // create a cube object
  const cube = new Tarumae.Shapes.Cube();
  
  scene.add(cube);
  scene.show();

  // drag to rotate the cube
  cube.ondrag = _ => {
    cube.angle.y += renderer.viewer.mouse.movement.x;

    // request renderer to redraw the scene
    scene.requireUpdateFrame();
  };

  // force main camera to look at the cube
  scene.mainCamera.lookAt(cube);
});