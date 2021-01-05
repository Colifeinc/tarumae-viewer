////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../../src/js/tarumae.js";
import { Vec3, Color4 } from "@jingwood/graphics-math";
import { Quaternion } from "@jingwood/graphics-math/dist/quaternion";

window.addEventListener("load", function () {

  const renderer = new Tarumae.Renderer({
    backColor: new Color4(0, 0, 0),
    // backColor: new Color4(0.74, .87, .85, 0.5),
    // backgroundImage: "textures/bg-gray-gradient.jpg",
    showDebugPanel: false,
    enableLighting: true,
    enablePostprocess: true,
    enableAntialias: true,
    enableEnvmap: false,
    enableShadow: true,
    shadowQuality: {
      scale: 2,
      viewDepth: 2,
      resolution: 2048,
      enableCache: false,
    },
    bloomEffect: {
      enabled: true,
      threshold: 0.2,
      gamma: 1.4,
    },
    renderingImage: {
      gamma: 1.4,
      resolutionRatio: 1,
    },
  });

  const scene = renderer.createScene();
  window._scene = scene;
 
  const ground = {
    mesh: new Tarumae.Shapes.PlaneMesh(3, 3),
    mat: {
      // color: [1.0, 1.0, 1.0],
      // color: [1.5, 1.5, 1.5],
      // tex: "textures/bg-gray-gradient.jpg"
    },
    angle: [15, 20, 0],
  };
  scene.load(ground);

  this.currentIndex = -1;

  let obj1, obj2, obj3, obj4, jointsBackup = [];
  let spine, hips, chest, neck, head;

  scene.createObjectFromURL('models/char3.gltf', obj => {
    obj1 = obj;
    ground.add(obj);
    window.obj1 = obj1;
    
    chest = obj1.findObjectByName('chest');
    spine = obj1.findObjectByName('spine');
    hips = obj1.findObjectByName('hips');
    neck = obj1.findObjectByName('neck');
    head = obj1.findObjectByName('head');

    chest.rotationSystem = 'e';
    spine.rotationType = 'e';
    hips.rotationType = 'e';
    neck.rotationType = 'e';
    head.rotationType = 'e';
    
    const joint1 = obj1.objects[0].objects[0].skin.joints;
    for (let i = 0; i < joint1.length; i++) {
      jointsBackup.push({
        angle: joint1[i].angle.clone(),
        location: joint1[i].location.clone(),
        _quaternion: new Quaternion(joint1[i]._quaternion),
        _quaternionInv: Quaternion.inverse(joint1[i]._quaternion),
      });
    }
  });

  scene.createObjectFromURL('models/char4.gltf', obj => {
    obj2 = obj;
  });

  scene.createObjectFromURL('models/char5.gltf', obj => {
    obj3 = obj;
  });

  scene.createObjectFromURL('models/char2.gltf', obj => {
    obj4 = obj;
  });

  let weight1 = 0, weight2 = 0, weight3 = 0, r1 = 0, headAngle = new Vec3();
  window.changeP1 = function (v) {
    weight1 = v;
    updateJoints();
  };
  window.changeP2 = function (v) {
    weight2 = v;
    updateJoints();
  };
  window.changeP3 = function (v) {
    weight3 = v;
    updateJoints();
  };
  window.changeR1 = function (v) {
    r1 = v;
    updateJoints();
  };
  window.changeHeadY = function(v) {
    headAngle.y = v;
    updateJoints();
  };
  window.changeHeadX = function(v) {
    headAngle.x = v;
    updateJoints();
  };

  function updateJoints() {
    const joint1 = obj1.objects[0].objects[0].skin.joints;
    const joint2 = obj2.objects[0].objects[0].skin.joints;
    const joint3 = obj3.objects[0].objects[0].skin.joints;
    const joint4 = obj4.objects[0].objects[0].skin.joints;

    for (let i = 0; i < joint1.length; i++) {

      const j1 = Quaternion.mul(jointsBackup[i]._quaternionInv, joint2[i]._quaternion);
      const j2 = Quaternion.mul(jointsBackup[i]._quaternionInv, joint3[i]._quaternion);
      const j3 = Quaternion.mul(jointsBackup[i]._quaternionInv, joint4[i]._quaternion);

      const q1 = Quaternion.slerp(Quaternion.zero, j1, weight1);
      const q2 = Quaternion.slerp(Quaternion.zero, j2, weight2);
      const q3 = Quaternion.slerp(Quaternion.zero, j3, weight3);
      
      const q = Quaternion.mul(jointsBackup[i]._quaternion, Quaternion.mul(Quaternion.mul(q1, q2), q3));
      
      joint1[i]._quaternion.copyFrom(q);
      
      // joint1[i].angle.set(Vec3.add(jointsBackup[i].angle,
      //   Vec3.add(
      //     Vec3.add(
      //       Vec3.mul(Vec3.sub(joint2[i].angle, jointsBackup[i].angle), weight1),
      //       Vec3.mul(Vec3.sub(joint3[i].angle, jointsBackup[i].angle), weight2)),
      //       Vec3.mul(Vec3.sub(joint4[i].angle, jointsBackup[i].angle), weight3)
      //   )));
      
      // joint1[i].angle.set(
      //   Vec3.add(
      //     Vec3.lerp(jointsBackup[i].angle, joint3[i].angle, weight2),  
      //     Vec3.lerp(jointsBackup[i].angle, joint4[i].angle, weight3))); 
      
      joint1[i].location.set(Vec3.add(jointsBackup[i].location,
        Vec3.add(
          Vec3.add(
            Vec3.mul(Vec3.sub(joint2[i].location, jointsBackup[i].location), weight1),
            Vec3.mul(Vec3.sub(joint3[i].location, jointsBackup[i].location), weight2)),
            Vec3.mul(Vec3.sub(joint4[i].location, jointsBackup[i].location), weight3)
        )));
      
      chest.angle.y = r1;
      spine.angle.y = r1 * 0.5;
      hips.angle.y = r1 * 0.2;
      head.angle.set(headAngle);
      neck.angle.set(Vec3.mul(headAngle, 0.5));
    }

    hips.updateTransform();

    scene.requireUpdateFrame();
  }
  
  scene.sun.location.set(1, 1, 1);
  scene.sun.mat = { color: [1.2, 1.2, 1.2] };

	scene.mainCamera.fieldOfView = 60;
	scene.mainCamera.location.set(0, 0.7, 2);
	scene.mainCamera.angle.set(0, 0, 0);
	
	// light sources

	const lights = new Tarumae.SceneObject();

	const light2 = new Tarumae.PointLight();
	light2.location.set(5, 7, 10);
	light2.mat.emission = 100;
	lights.add(light2);

	const light4 = new Tarumae.PointLight();
	light4.location.set(-3, -6, 4);
	light4.mat.emission = 5;
	lights.add(light4);

	scene.add(lights);

	// new Tarumae.TouchController(scene);
	const objController = new Tarumae.ObjectViewController(scene, {
		enableVerticalRotation: true,
		minVerticalRotateAngle: -10,
		maxVerticalRotateAngle: 50,
	});
	objController.object = ground;


	scene.show();
});