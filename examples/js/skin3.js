////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../../src/js/tarumae.js";
import { Vec3, Color4, Matrix4 } from "@jingwood/graphics-math";
import { Quaternion } from "@jingwood/graphics-math/dist/quaternion";
import { Vec4 } from "@jingwood/graphics-math/dist/vec4";

let renderFrame = 0;
let startFrame = 5000;
let endFrame = 10000; //5600
let frameStep = 2;
let frameCount = (endFrame - startFrame) / frameStep;
  
window.addEventListener("load", function() {

  const renderer = new Tarumae.Renderer({
    backColor: new Color4(0, 0, 0),
    // backColor: new Color4(0.74, .87, .85, 0.5),
    // backgroundImage: "textures/bg-gray-gradient.jpg",
    showDebugPanel: false,
    enableLighting: true,
    enablePostprocess: false,
    enableAntialias: true,
    enableEnvmap: false,
    enableShadow: false,
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
      color: [0.1, 0.4, 0.1],
      tex: '../textures/checkboard.png',
      texTiling: [5, 5],
    },
    angle: [0, 90, 0],
  };
  scene.load(ground);

  let timer, isStop = false, playSpeed = 50;

  function onplay() {
    if (isStop) {
      setTimeout(onplay, 1000);
      return;
    }

    renderFrame++;
    if (renderFrame >= frameCount) {
      renderFrame = 0;
    }
    scene.requireUpdateFrame();
    
    setTimeout(onplay, playSpeed);
  }

  onplay();

  const infoPanel = document.getElementById('info');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progress');
  const speedLabel = document.getElementById('speedLabel');
  const testAngleLabel = document.getElementById('testAngle');
 
  function updateUI() {
    infoPanel.innerHTML = `${renderFrame * frameStep + startFrame} / ${endFrame}`;
    speedLabel.innerHTML = (Math.round(100 / playSpeed)) + 'x';
    progressBar.style.width = (renderFrame / frameCount * progressContainer.clientWidth) + 'px';
    testAngleLabel.innerText = testAngle.toArray();
  }
  scene.onframe = g => {
    updateJoints();
    updateUI();
  };

  window.changeSpeed = function(speed) {
    playSpeed = speed;
  };
  window.playOrPause = function() {
    isStop = !isStop;
  };
  window.changeFrame = function(e) {
    console.log(e);
  };

  let standObj, seizaObj, jointsBackup = [];
  let spine, hips, chest, neck, head, testAngle = new Vec3();
  let upperarmR, forearmR, thumb01R, f_pinky01R;

  const skeletons = [
    // { name: 'chest', obj: null, base: 8, target: 1, previous: null },
    { name: 'spine', type: 'body', base: 8, target: 1, factor: 1.5 },
    { name: 'head', type: 'body', base: 1, target: 0, previous: 8, factor: 0.6 },
    
    { name: 'shoulder.R', type: 'body', base: 1, target: 2, mulq: Quaternion.fromEuler(new Vec3(-30, 0, 0)) },
    { name: 'upper_arm.R', type: 'body', base: 2, target: 3 },
    { name: 'forearm.R', type: 'body', base: 3, target: 4 },
    { name: 'hand.R', point: 4 },

    { name: 'shoulder.L', base: 1, target: 5, mulq: Quaternion.fromEuler(new Vec3(-30, 0, 0)) },
    { name: 'upper_arm.L', base: 5, target: 6 },
    { name: 'forearm.L', base: 6, target: 7 },
    { name: 'hand.L', point: 7 },

    { name: 'thumb.01.R', type: 'rhand', base: 1, target: 2 },
    { name: 'thumb.02.R', type: 'rhand', base: 2, target: 3 },
    { name: 'thumb.03.R', type: 'rhand', base: 3, target: 4 },

    { name: 'f_index.01.R', type: 'rhand', base: 5, target: 6 },
    { name: 'f_index.02.R', type: 'rhand', base: 6, target: 7 },
    { name: 'f_index.03.R', type: 'rhand', base: 7, target: 8 },

    { name: 'f_middle.01.R', type: 'rhand', base: 9, target: 10 },
    { name: 'f_middle.02.R', type: 'rhand', base: 10, target: 11 },
    { name: 'f_middle.03.R', type: 'rhand', base: 11, target: 12 },

    { name: 'f_ring.01.R', type: 'rhand', base: 13, target: 14 },
    { name: 'f_ring.02.R', type: 'rhand', base: 14, target: 15 },
    { name: 'f_ring.03.R', type: 'rhand', base: 15, target: 16 },

    { name: 'f_pinky.01.R', type: 'rhand', base: 17, target: 18 },
    { name: 'f_pinky.02.R', type: 'rhand', base: 18, target: 19 },
    { name: 'f_pinky.03.R', type: 'rhand', base: 19, target: 20 },


    { name: 'thumb.01.L', type: 'lhand', base: 1, target: 2 },
    { name: 'thumb.02.L', type: 'lhand', base: 2, target: 3 },
    { name: 'thumb.03.L', type: 'lhand', base: 3, target: 4 },

    { name: 'f_index.01.L', type: 'lhand', base: 5, target: 6 },
    { name: 'f_index.02.L', type: 'lhand', base: 6, target: 7 },
    { name: 'f_index.03.L', type: 'lhand', base: 7, target: 8 },

    { name: 'f_middle.01.L', type: 'lhand', base: 9, target: 10 },
    { name: 'f_middle.02.L', type: 'lhand', base: 10, target: 11 },
    { name: 'f_middle.03.L', type: 'lhand', base: 11, target: 12 },

    { name: 'f_ring.01.L', type: 'lhand', base: 13, target: 14 },
    { name: 'f_ring.02.L', type: 'lhand', base: 14, target: 15 },
    { name: 'f_ring.03.L', type: 'lhand', base: 15, target: 16 },

    { name: 'f_pinky.01.L', type: 'lhand', base: 17, target: 18 },
    { name: 'f_pinky.02.L', type: 'lhand', base: 18, target: 19 },
    { name: 'f_pinky.03.L', type: 'lhand', base: 19, target: 20 },

  ];

  const skeletonObjs = {};

  const constSkels = [
    { name: 'upper_arm.R.001', type: 'angle'},
    { name: 'upper_arm.R.002', type: 'const', q: Quaternion.fromEuler(new Vec3(142,31,-13))  },
    { name: 'upper_arm.R.003', type: 'const', q: Quaternion.fromEuler(new Vec3(135,23,2))  },

    { name: 'forearm.R.002', type: 'angle' },
    { name: 'forearm.R.003', type: 'const', q: Quaternion.fromEuler(new Vec3(142,31,-13))   },
    { name: 'forearm.R.004', type: 'const', q: Quaternion.fromEuler(new Vec3(135,23,2))   },
  
    // { name: 'upper_arm.L.001', type: 'angle' },
    // { name: 'upper_arm.L.002', type: 'aa'   },
    // { name: 'upper_arm.L.003', type: 'angle', q: Quaternion.fromEuler(new Vec3(-95,2,5))   },

    // { name: 'forearm.L.002', type: 'angle' },
    // { name: 'forearm.L.003', type: 'aa'   },
    // { name: 'forearm.L.004', type: 'angle', q: Quaternion.fromEuler(new Vec3(-95,2,5))   },
  ];

  scene.createObjectFromURL('models/char3.gltf', obj => {
    standObj = obj;
    ground.add(obj);
    window.obj1 = standObj;
    
    chest = standObj.findObjectByName('chest');
    spine = standObj.findObjectByName('spine');
    hips = standObj.findObjectByName('hips');
    neck = standObj.findObjectByName('neck');
    head = standObj.findObjectByName('head');

    upperarmR = standObj.findObjectByName('upperarmR');
    forearmR = standObj.findObjectByName('forearmR');
    thumb01R = standObj.findObjectByName('thumb01R');
    f_pinky01R = standObj.findObjectByName('f_pinky01R');

    chest.rotationType = 'e';
    spine.rotationType = 'e';
    hips.rotationType = 'e';
    neck.rotationType = 'e';
    head.rotationType = 'e';

    for (const skel of skeletons) {
      skel.obj = standObj.findObjectByName(skel.name);
      skel.obj.rotationType = 'q';
      skel._backupQ = new Quaternion(skel.obj._quaternion);
      skel._backupQInv = Quaternion.inverse(skel.obj._quaternion);
      skel._backupM = skel.obj._quaternion.toMatrix();
      skel._lookAt = skel._backupM.extractLookAtVectors();
      skel._backupLoc = new Vec3(skel.obj.location);

      if (skel.checkParent && skel.obj.parent) {
        skel._dir = Vec3.sub(skel.obj.location, skel.obj.parent.location).normalize();
      }

      skeletonObjs[skel.name] = skel;
    }
    
    for (const cskel of constSkels) {
      cskel.obj = standObj.findObjectByName(cskel.name);
      cskel.obj.rotationType = 'q';
    }

    const joint1 = standObj.objects[0].objects[0].skin.joints;
    for (let i = 0; i < joint1.length; i++) {
      jointsBackup.push({
        angle: joint1[i].angle.clone(),
        location: joint1[i].location.clone(),
        _quaternion: new Quaternion(joint1[i]._quaternion),
        _quaternionInv: Quaternion.inverse(joint1[i]._quaternion),
      });
    }
  });

  scene.createObjectFromURL('models/char2.gltf', obj => {
    seizaObj = obj;
  });

  let chawan;
  scene.createObjectFromURL('models/matcha/chawan_white.toba', obj => {
    chawan = obj;
    ground.add(chawan);
  });

  // let tana;
  // scene.createObjectFromURL('models/matcha/tana.toba', obj => {
  //   tana = obj;
  //   tana.location.set(0.4, 0, 0.7);
  //   ground.add(tana);
  // });

  let furo;
  scene.createObjectFromURL('models/matcha/furo.toba', obj => {
    furo = obj;
    furo.location.set(0.2, 0, 0.7);
    furo.angle.set(0, 180, 0);
    ground.add(furo);
  });

  let chasen;
  scene.createObjectFromURL('models/matcha/chasen.toba', obj => {
    chasen = obj;
    chasen.location.set(-0.2, 0, 0.7);
    ground.add(chasen);
  });

  let natumeBody;
  scene.createObjectFromURL('models/matcha/natume_body.toba', obj => {
    natumeBody = obj;
    natumeBody.location.set(-0.07, 0, 0.7);
    ground.add(natumeBody);
  });

  let natumeFuta;
  scene.createObjectFromURL('models/matcha/natume_futa.toba', obj => {
    natumeFuta = obj;
    natumeFuta.location.set(-0.07, 0, 0.7);
    ground.add(natumeFuta);
  });

  let seizaWeight = 1, r1 = 0, headAngle = new Vec3();
  window.changeP3 = function(v) {
    seizaWeight = v;
    updateJoints();
  };
  window.changeR1 = function(v) {
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
  window.changeRX = v => { testAngle.x = v; updateJoints(); };
  window.changeRY = v => { testAngle.y = v; updateJoints(); };
  window.changeRZ = v => { testAngle.z = v; updateJoints(); };

  function updateJoints() {
    if (!standObj || !seizaObj) return;

    const standJoint = standObj.objects[0].objects[0].skin.joints;
    const seizaJoint = seizaObj.objects[0].objects[0].skin.joints;

    for (let i = 0; i < standJoint.length; i++) {
      const j3 = Quaternion.mul(jointsBackup[i]._quaternionInv, seizaJoint[i]._quaternion);
      const q3 = Quaternion.slerp(Quaternion.zero, j3, seizaWeight);
      const q = Quaternion.mul(jointsBackup[i]._quaternion, q3);
      
      standJoint[i]._quaternion.copyFrom(q);
      
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
      
      standJoint[i].location.set(Vec3.add(jointsBackup[i].location, Vec3.mul(Vec3.sub(seizaJoint[i].location, jointsBackup[i].location), seizaWeight)));
    }

    chest.angle.y = r1;
    spine.angle.y = r1 * 0.5;
    hips.angle.y = r1 * 0.2;
    head.angle.set(headAngle);
    neck.angle.set(Vec3.mul(headAngle, 0.5));

    hips.updateTransform();

    if (poseData) {
      const translateSkeleton = (skel) => {
        let jointDataContainer;

        if (skel.type === 'rhand') {
          jointDataContainer = poseData.handRightJoints;
        } else if (skel.type === 'lhand') {
          jointDataContainer = poseData.handLeftJoints;
        } else {
          jointDataContainer = poseData.bodyJoints;
        }

        const baseJoint = jointDataContainer[renderFrame][skel.base];

        if (!baseJoint || baseJoint.score < minScore) return;

        const base = baseJoint.v;
        const target = jointDataContainer[renderFrame][skel.target].v;

        let q = new Quaternion();

        // if (skel.apply) {
          // q.setFromEuler(testAngle);
        // }

        q.setFromVectors(Vec3.up, Vec3.normalize(Vec3.sub(target, base)));
        if (skel.factor > 0) {
          q = Quaternion.slerp(Quaternion.zero, q, skel.factor);
        }
        q = q.normalize();

        if (skel.mulq) {
          q = Quaternion.mul(q, skel.mulq);
          q = q.normalize();
        }
        
        let wq = Quaternion.fromRotationMatrix(skel.obj.parent.jointWorldRotation);
        wq = wq.inverse();
        q = Quaternion.mul(wq, q);


        skel.obj._quaternion.set(q);
        skel.obj.updateJoint();

        
        if (skel.name === 'forearm.R') {
          const thumb01RData1 = poseData.handRightJoints[renderFrame][2].v;
          const thumb01RData2 = poseData.handRightJoints[renderFrame][17].v;
          
          const angle = Math.atan2(thumb01RData2.y - thumb01RData1.y, thumb01RData2.x - thumb01RData1.x) * 180 / Math.PI;
          const armRRotate = Quaternion.fromEuler(new Vec3(0, angle, 0));
          // let armRRotate = Quaternion.fromVectors( Vec3.normalize(Vec3.sub(thumb01RData1, thumb01RData2)));
          // armRRotate = Quaternion.mul(skel._backupQInv, armRRotate);

          q = Quaternion.mul(q, armRRotate);
   
          skel.obj._quaternion.set(q);
          skel.obj.updateJoint();
        }

           
        if (skel.name === 'forearm.L') {
          const thumb01RData1 = poseData.handLeftJoints[renderFrame][17].v;
          const thumb01RData2 = poseData.handLeftJoints[renderFrame][2].v;
          
          const angle = Math.atan2(thumb01RData2.y - thumb01RData1.y, thumb01RData2.x - thumb01RData1.x) * 180 / Math.PI;
          const armRRotate = Quaternion.fromEuler(new Vec3(0, angle, 0));
          // let armRRotate = Quaternion.fromVectors( Vec3.normalize(Vec3.sub(thumb01RData1, thumb01RData2)));
          // armRRotate = Quaternion.mul(skel._backupQInv, armRRotate);

          q = Quaternion.mul(q, armRRotate);
   
          skel.obj._quaternion.set(q);
          skel.obj.updateJoint();
        }
        // --------------------------------------------------------------------------------------------------------
        
        // skel.obj.location.set(base);
      }

      for (const skel of skeletons) {
        translateSkeleton(skel);
      }

      // const chestBaselv1 = loadedSkinData.bodyJoints[renderFrame][1].v;
      // const chestLv1 = loadedSkinData.bodyJoints[renderFrame][0].v;
      // chest.location.set(Vec3.add(new Vec3(0, 0.2, 0), Vec3.sub(chestLv1, chestBaselv1)));
    }

    // for (const cskel of constSkels) {
    //   if (cskel.type === 'angle') {
    //     let q = Quaternion.fromEuler(testAngle);
     
    //     const wq = Quaternion.fromRotationMatrix(cskel.obj.parent.jointWorldRotation).inverse();
    //     q = Quaternion.mul(wq, q);

    //     cskel.obj._quaternion.set(q);
    //   }
    //   else if (cskel.type === 'const') {
    //     const wq = Quaternion.fromRotationMatrix(cskel.obj.parent.jointWorldRotation).inverse();
    //     let q = Quaternion.mul(cskel.q, wq);
    //     cskel.obj._quaternion.set(q);
    //   }
    //   // else if (cskel.type === 'loc') {
    //     // cskel.obj.location.x = cskel.obj.parent.location.x;
    //     // cskel.obj.location.z = cskel.obj.parent.location.z;

    //     // let q = Quaternion.fromEuler(testAngle);

    //     // // const wq = Quaternion.fromRotationMatrix(cskel.obj.parent.jointWorldRotation).inverse();
    //     // // q = Quaternion.mul(wq, q);

    //     // cskel.obj._quaternion.set(q);
    //   // }

    //   cskel.obj.updateJoint();
    // }

    hips.updateTransform();

    if (chawan && poseData && poseData.handRightJoints) {
      // const p = this.location.mulMat(this.skin.inverseMatrices[i].mul(this.jointMatrix))
      // const loc = skeletonObjs['f_middle.03.R'].obj.location.mulMat(
      //   skeletonObjs['f_middle.03.R'].obj.jointMatrix)
      //   ;
      // const obj = skeletonObjs['hand.L'].obj;

      // const skin = scene.findObjectByName('woman_body');
      // const mat = skin._calculatedJointMatrixCache[obj._jointIndex];
      // let loc = obj.location.mulMat(mat);

      // const loc = obj.location.mulMat( obj.jointMatrix);
      // const loc = obj.worldLocation;
      const pointJoint = poseData.handRightJoints[renderFrame][7].v;
      
      chawan.location.set(pointJoint);
    }

    scene.requireUpdateFrame();
  }

  let poseData;

  Tarumae.ResourceManager.download('../skin/converted-skin-data.json', Tarumae.ResourceTypes.JSON, json => {
    startFrame = json.startFrame;
    endFrame = json.endFrame;
    frameStep = json.frameStep;
    frameCount = (endFrame - startFrame) / frameStep;
    
    poseData = json;

    hips.updateTransform();
    scene.requireUpdateFrame();

    const skinRenderObj = new SkinRenderObject('yellow');
    skinRenderObj.scale.set(1.5, 1.5, 1.5);
    skinRenderObj.location.y = -0.1;
    skinRenderObj.bodyJoints = json.bodyJoints;
    skinRenderObj.handLeftJoints = json.handLeftJoints;
    skinRenderObj.handRightJoints = json.handRightJoints;
    // ground.add(skinRenderObj);
  });
  
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
		minVerticalRotateAngle: -90,
		maxVerticalRotateAngle: 90,
	});
	objController.object = ground;


	scene.show();
});

const minScore = 0.2;

const bodyJointLines = [
  1, 0, 1, 8,
  
  1, 2, 2, 3, 3, 4,  // left arm
  1, 5, 5, 6, 6, 7,  // right arm

  8, 9, 9, 10, 10, 11, 11, 24, 11, 22, 22, 23,  // left leg
  8, 12, 12, 13, 13, 14, 14, 21, 14, 19, 19, 20, // right leg

  0, 15, 15, 17,  // head left
  0, 16, 16, 18,  // head right
];

const handJointLines = [
  0, 1, 1, 2, 2, 3, 3, 4,
  0, 5, 5, 6, 6, 7, 7, 8,
  0, 9, 9, 10, 10, 11, 11, 12,
  0, 13, 13, 14, 14, 15, 15, 16,
  0, 17, 17, 18, 18, 19, 19, 20,
];

class SkinRenderObject extends Tarumae.SceneObject {
  constructor(skinColor) {
    super();

    this.skinColor = skinColor;

    this.bodyJoints = null;
    this.handLeftJoints = null;
    this.handRightJoints = null;
  }
  
  drawJoints(g, skinJoints, jointLines) {
    const joints = skinJoints[renderFrame];
    if (joints) {
      for (let i = 0; i < joints.length; i++) {
        const s = joints[i];
        if (s.score > minScore) {
          let { v } = s;
          v = Vec4.mulMat(v, this.transform);
          g.drawPoint(v, 10, this.skinColor);
        }
      }

      for (let i = 0; i < jointLines.length; i += 2) {
        const s0 = joints[jointLines[i]], s1 = joints[jointLines[i + 1]];
        let v0 = s0.v, v1 = s1.v;
        if (s0.score > minScore && s1.score > minScore) {
          v0 = Vec4.mulMat(v0, this.transform);
          v1 = Vec4.mulMat(v1, this.transform);
          g.drawLine(v0, v1, 4, this.skinColor);
        }
      }
    }
  }
  
  ondraw(g) {
    super.ondraw(g);

    this.drawJoints(g, this.bodyJoints, bodyJointLines);
    this.drawJoints(g, this.handLeftJoints, handJointLines);
    this.drawJoints(g, this.handRightJoints, handJointLines);
  }
}