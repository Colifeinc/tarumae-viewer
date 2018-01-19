
import Tarumae from "../entry"
import "../utility/*"
import "../scene/*"

import texWood from "../../../resources/textures/wood.jpg";
import texFloor from "../../../resources/textures/floor.jpg";

window.addEventListener('load', function() {

  var renderer = new Tarumae.Renderer();

  var scene = renderer.createScene();

  window._scene = scene;
  window.lastAnimation = undefined;
  
  var objects = {
    cube1: {
      mesh: new Tarumae.CubeMesh(),
      location: [-1, 0.25, 0.2],
      scale: [0.5, 0.5, 0.5],
      mat: { tex: texWood },

      onmouseup: function() {
        var cube = this;

        lastAnimation = scene.animate({duration: 2, delay: 0.5}, function(t) {
          var s = 0.25 + Math.abs(Math.sin(t * Math.PI * 5) / 10);
          cube.location.y = s;
          // cube.scale = new Vec3(0.25 + s, 0.5, 0.25 + s);
        });
      },

      label: { location: [0, 0.75, 0], innerHTML: "Delay" },
    },
    
    cube2: {
      mesh: new Tarumae.CubeMesh(),
      location: [0, 0.5, 0],
      scale: [1, 1, 1],
      mat: { tex: texWood },

      onmouseup: function() {
        var cube = this;

        lastAnimation = scene.animate({duration: 1, effect: "smooth"}, function(t) {
          cube.angle.y = t * 360;
        });
      },

      label: { location: [0, 0.75, 0], innerHTML: "Normal" },
    },

    cube3: {
      mesh: new Tarumae.CubeMesh(),
      location: [1.2, 0.35, 0.5],
      scale: [0.7, 0.7, 0.7],
      mat: { tex: texWood },

      onmouseup: function() {
        var cube = this;

        lastAnimation = scene.animate({duration: 1, repeat: 2}, function(t) {
          cube.location.x = 1.2 + Math.sin(t * Math.PI * 10) / 10;
        });
      },
      
      label: { location: [0, 0.75, 0], innerHTML: "Repeat" },
    },

    floor: {
      mesh: new Tarumae.PlaneMesh(2, 2),
      scale: [3, 3, 3],
      mat: { tex: texFloor },
    },
  };

  scene.onkeyup = function(key) {
    if (key === Tarumae.Viewer.Keys.Space) {
      if (lastAnimation) {
        if (lastAnimation.isPaused)
          lastAnimation.play();
        else
          lastAnimation.pause();
      }
    }
  };

  scene.add(objects);
  
  scene.mainCamera.fieldOfView = 30;

  var modelViewer = new Tarumae.ModelViewer(scene);
  modelViewer.minRotateX = -8;
  modelViewer.maxRotateX = 70;
  modelViewer.enableDragAcceleration = true;

  scene.show();
});