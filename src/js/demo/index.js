
import Tarumae from "../tarumae"

import texWood from "../../../resources/textures/wood.jpg"
import texFloor from "../../../resources/textures/floor.jpg"

import cube_mod from "../../../resources/models/car.mod"

window.addEventListener('load', function() {

  var renderer = new Tarumae.Renderer();

  var scene = renderer.createScene();

  window._scene = scene;
  window.lastAnimation = undefined;
 
  scene.createObjectFromURL(cube_mod, obj => {
    scene.add(obj);
  });
  
  scene.mainCamera.fieldOfView = 30;

  var modelViewer = new Tarumae.ModelViewer(scene);
  modelViewer.enableDragAcceleration = true;

  scene.show();
});