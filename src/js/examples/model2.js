////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import "../utility/*";
import "../scene/*";
import { Color3, Color4 } from "../math/vector";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
	});

	const scene = renderer.createScene();

	window._scene = scene;
 
	// scene.add(new Tarumae.GridLine());

	scene.createObjectFromURL("models/partition_high_test.mod", obj => {
		scene.add(obj);
	});

	const floor = new Tarumae.Shapes.Plane();
	floor.scale.set(20, 1, 20);
	floor.mat = {
		tex: "textures/Floor01/Floor01_d.jpg",
		texTiling: [6, 6],
		color: new Color3(.8, .75, .7)
	};
	scene.load(floor);
	

	// const refmap = new Tarumae.ImageCubeBox(renderer, [
	// 	"../static/textures/skybox/left.jpg",
	// 	"../static/textures/skybox/right.jpg",
	// 	"../static/textures/skybox/top.jpg",
	// 	"../static/textures/skybox/bottom.jpg",
	// 	"../static/textures/skybox/front.jpg",
	// 	"../static/textures/skybox/back.jpg",
	// ]);
	
	var pointLight = new Tarumae.PointLight();
	pointLight.mat.emission = 0.2;
	pointLight.location.set(0, 2.4, 0);
	scene.add(pointLight);

	scene.mainCamera.location.set(-1.8, 1.5, 1.2);
	scene.mainCamera.angle.set(-5, 307, 0);
	scene.mainCamera.fieldOfView = 90;
	
	// new Tarumae.ModelViewer(scene);
	new Tarumae.TouchController(scene);
	// scene.renderer.viewer.angle.x = 13;
	// scene.renderer.viewer.originDistance = 0.5;

	scene.show();
});