////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from '../../src/js/tarumae.js';

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		renderPixelRatio: 1,
		// backColor: new Color4(0.74, .87, .85, 1),
		backgroundImage: "textures/bg-gray-gradient.jpg",
		showDebugPanel: false,
		enableLighting: true,
		// enableShadow: true,
		enableAntialias: true,
		enableEnvmap: true,
		shadowQuality: {
			scale: 2,
			viewDepth: 2,
			resolution: 4096,
		},
		bloomEffect: {
			threshold: 0.25,
			gamma: 1.6,
		},
		renderingImage: {
			gamma: 1.0,
		},
	});

	const scene = renderer.createScene();
	window._scene = scene;
 
	const ground = {
		// mesh: new Tarumae.Shapes.PlaneMesh(3, 3),
		mat: {
			color: [1.5, 1.5, 1.5],
			tex: "textures/bg-gray-gradient.jpg"
		},
		angle: [0, 0, 0],
	};
	scene.load(ground);

	scene.createObjectFromObjFormat("models/cup.obj", obj => {

		obj.location.set(0, 0, 0);
		obj.scale.set(13, 13, 13);
		obj.angle.set(30, 0, 0);

		obj.mat.color = [1, 1, 1];
		// obj.mat.color = [.6, .6, .6];
		// obj.mat.color = [.8, .8, .8];
		// obj.mat.color = [.9, .9, .9];
		// obj.mat.color = [1.0, 1.0, 1.0];
		obj.mat.glossy = .6;
		obj.mat.roughness = 0;
		obj.mat.transparency = 0.2;
		obj.mat.refraction = .8;

		window.obj = obj;
		setObjectRefmap(obj);

		ground.add(obj);

	});

	// const cube = new Tarumae.Shapes.Cube();
	// cube.mat = { 
	// 	transparency: 0,
	// 	// glossy: 0.5
	// 	refraction: 1,
	// };
	// ground.add(cube);
	// this.window.obj = cube;
	// setObjectRefmap(cube);

	scene.on("keydown", e=>{
		
		if(e===65){
			scene.mainCamera.angle.y+=5;
			scene.requireUpdateFrame();
		}	else if(e==68){
			scene.mainCamera.angle.y-=5;
			scene.requireUpdateFrame();
		}
	});

	scene.mainCamera.fieldOfView = 60;
	scene.mainCamera.location.set(0, 0.5, 3.4);
	scene.mainCamera.angle.set(0, 0, 0);
	
	// light sources

	const lights = new Tarumae.SceneObject();

	const light2 = new Tarumae.PointLight();
	light2.location.set(5, 7, 10);
	light2.mat.emission = 10;
	lights.add(light2);

	
	const light3 = new Tarumae.PointLight();
	light3.location.set(0.2, 15, 5);
	light3.mat.emission = 5;
	lights.add(light3);

	// const light4 = new Tarumae.PointLight();
	// light4.location.set(-3, -6, 4);
	// light4.mat.emission = 5;
	// lights.add(light4);

	scene.add(lights);

	// new Tarumae.TouchController(scene);

	const objController = new Tarumae.ObjectViewController(scene, {
		enableVerticalRotation: true,
		minVerticalRotateAngle: -100,
		maxVerticalRotateAngle: 100,
	});
	objController.object = ground;

	const skybox = new Tarumae.SkyBox(renderer, [
		"textures/cubemap/office-256/px.jpg",
		"textures/cubemap/office-256/nx.jpg",
		"textures/cubemap/office-256/py.jpg",
		"textures/cubemap/office-256/ny.jpg",
		"textures/cubemap/office-256/pz.jpg",
		"textures/cubemap/office-256/nz.jpg",
	]);
		
	function setObjectRefmap(obj) {
		obj.eachChild(c => {
			if (c.meshes.length > 0) c.meshes[0]._refmap = window.refmap;
		});
		if (obj.meshes.length > 0) obj.meshes[0]._refmap = window.refmap;
	}

	skybox.on('load', _ => {
		window.refmap = skybox.cubemap;
		if (window.obj) {
			setObjectRefmap(window.obj);
		}
	});

	scene.skybox = skybox;

	scene.show();
});