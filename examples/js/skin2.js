////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../../src/js/tarumae.js";
import { Vec3, Vec4, Color4, Matrix4 } from "@jingwood/graphics-math";
import { Quaternion } from "@jingwood/graphics-math/dist/quaternion";
import { Matrix3 } from "@jingwood/graphics-math/dist/matrix3";

let renderFrame = 0;
const startFrame = 4000;
const endFrame = 5600; //5600
const frameStep = 2;
const frameCount = (endFrame - startFrame) / frameStep;
  
window.addEventListener("load", function() {

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
      color: [0.1, 0.4, 0.1],
      tex: '../textures/checkboard.png',
      texTiling: [5, 5],
    },
    angle: [15, 20, 0],
  };
  scene.load(ground);

  // scene
  scene.sun.location.set(1, 1, 1);
  scene.sun.mat = { color: [1.2, 1.2, 1.2] };

  scene.mainCamera.fieldOfView = 60;
  scene.mainCamera.location.set(0, 0.3, 1.2);
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
    maxVerticalRotateAngle: 90,
  });
  objController.object = ground;

  let timer, isStop = false, playSpeed = 50;

  function onplay() {
    if (isStop) {
      setTimeout(onplay, 1000);
      return;
    }

    renderFrame++;
    if (renderFrame > frameCount) {
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
 
  function updateUI() {
    infoPanel.innerHTML = `${renderFrame * frameStep + startFrame} / ${endFrame}`;
    speedLabel.innerHTML = 'Speed: ' + (Math.round(100 / playSpeed)) + 'x';
    progressBar.setAttribute("style", "width:" + (renderFrame / frameCount * progressContainer.clientWidth) + "px");
  }
  scene.onframe = g => updateUI();

  window.changeSpeed = function(speed) {
    playSpeed = speed;
  };
  window.playOrPause = function() {
    isStop = !isStop;
  };
  window.changeFrame = function(e) {
    console.log(e);
  };


  const skinObj1 = loadSkinData('IMG_6365_720p', 274, 'gray');
  const skinObj2 = loadSkinData('IMG_1924_720p', 0, 'silver');
  let transformSkin = new SkinRenderObject('yellow');

  ground.add(skinObj1);
  ground.add(skinObj2);
  ground.add(transformSkin);

  scene.onkeydown = key => {
    switch (key) {
      case Tarumae.Viewer.Keys.Space:
        playOrPause();
        break;
      
      case Tarumae.Viewer.Keys.D1:
        skinObj1.visible = !skinObj1.visible;
        scene.requireUpdateFrame();
        break;
      
      case Tarumae.Viewer.Keys.D2:
        skinObj2.visible = !skinObj2.visible;
        scene.requireUpdateFrame();
        break;
      
      case Tarumae.Viewer.Keys.D3:
        transformSkin.visible = !transformSkin.visible;
        scene.requireUpdateFrame();
        break;
    }
  };

  scene.show();

  let isConverted = false;
  window.onobjLoad = function() {
    if (skinObj1.isLoaded && skinObj2.isLoaded) {
      if (isConverted) return;

      isConverted = true;

      const aspect = 1280 / 720;
      const unprojection = new Matrix4().frustum(-aspect, aspect, -1, 1, 0.1, 100).inverse();

      function convertJoint(jointArray) {
        for (let i = 0; i < frameCount; i++) {
          const skinBodyFrame1 = skinObj1[jointArray][i];
          const skinBodyFrame2 = skinObj2[jointArray][i];

          const joints = [];

          for (let j = 0; j < skinBodyFrame1.length; j++) {
            const skinBody1 = skinBodyFrame1[j];
            const skinBody2 = skinBodyFrame2[j];
            let  v1 = skinBody1.v, v2 = skinBody2.v;
            const s1 = skinBody1.score, s2 = skinBody2.score;
            let score = Math.min(s1, s2);

            // v1 = v1.mulMat(unprojection);
            // v2 = v2.mulMat(unprojection);

            const v = new Vec4();
            const diff = Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);

            const d = diff * ((3 - v1.y) / 3);
            const z = diff + d ** 2;

            v.x = (v1.x + v2.x) * 0.5;
            v.y = (v1.y + v2.y) * 0.5;
            v.z = z;
            v.w = 1;
            // v = unprojection. Vec4.mul(Vec4.add(v1, v2), 0.5)

            // v = v.mulMat(unprojection);
        
            joints.push({ v, score });
          }

          transformSkin[jointArray][i] = joints;
        }
      }
      
      convertJoint('bodyJoints');
      convertJoint('handLeftJoints');
      convertJoint('handRightJoints');
    }
  };
});

function pad(num, length) {
  num = num.toString();
  while (num.length < length) num = "0" + num;
  return num;
}

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

const transform = new Matrix4().loadIdentity()
  .scale(0.5625, 0.5625, 1)
  .scale(0.0025, -0.0025, 1)
  .translate(-1280 * 0.5, -600, 0);

function loadSkinData(filename, frameOffset = 0, skinColor = 'white') {

  function readJointsData(skinJoints, i, personData, jointKeyName) {
    const data = personData[jointKeyName];
    if (!data) return;

    const joints = [];
          
    for (let i = 0; i < data.length; i += 3) {
      const v = new Vec3(data[i], data[i + 1], 0);
      v = new Vec4(v, 1).mulMat(transform);//.mulMat(unprojection);
      joints.push({ v, score: data[i + 2] });
    }

    skinJoints[i] = joints;
  }
  
  const rm = new Tarumae.ResourceManager();
  const obj = new SkinRenderObject(skinColor);
 
  for (let i = startFrame + frameOffset, j = 0; i <= endFrame + frameOffset; i += frameStep, j++) {
    const jsonPath = `skin/${filename}_${pad(i, 12)}_keypoints.json`;
    rm.add(jsonPath, Tarumae.ResourceTypes.JSON, json => {
      if (!json) {
        console.warn('download failed: ', jsonPath);
        return;
      }

      const p0 = json.people[0];
      if (p0) {
        readJointsData(obj.bodyJoints, j, p0, 'pose_keypoints_2d');
        readJointsData(obj.handLeftJoints, j, p0, 'hand_left_keypoints_2d');
        readJointsData(obj.handRightJoints, j, p0, 'hand_right_keypoints_2d');
      }
    });
  }

  rm.load(_ => {
    obj.isLoaded = true;
    window.onobjLoad(obj);
  });
 
  return obj;
}

class SkinRenderObject extends Tarumae.SceneObject {
  constructor(skinColor) {
    super();

    this.skinColor = skinColor;

    this.bodyJoints = new Array(frameCount);
    this.handLeftJoints = new Array(frameCount);
    this.handRightJoints = new Array(frameCount);
  }
  
  drawJoints(g, skinJoints, jointLines) {
    const joints = skinJoints[renderFrame];
    if (joints) {
      for (let i = 0; i < joints.length; i++) {
        const s = joints[i];
        if (s.score > minScore) {
          let { v } = s;
          v = v.mulMat(this.transform);
          g.drawPoint(v, 10, this.skinColor);
        }
      }

      for (let i = 0; i < jointLines.length; i += 2) {
        const s0 = joints[jointLines[i]], s1 = joints[jointLines[i + 1]];
        let v0 = s0.v, v1 = s1.v;
        if (s0.score > minScore && s1.score > minScore) {
          v0 = v0.mulMat(this.transform);
          v1 = v1.mulMat(this.transform);
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