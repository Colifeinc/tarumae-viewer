////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from '../../src/js/tarumae.js';

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		// backColor: new Color4(0.74, .87, .85, 1),
		backgroundImage: "img/bg-gray-gradient.jpg",
		showDebugPanel: false,
		enableLighting: true,
		enableShadow: true,
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
 
	this.models = [
		{ path: "models/chair_adv_01.toba" },
	];

	const ground = {
		mesh: new Tarumae.Shapes.PlaneMesh(3, 3),
		mat: {
			color: [1.5, 1.5, 1.5],
			tex: "img/bg-gray-gradient.jpg"
		},
		angle: [0, 30, 0],
	};
	scene.load(ground);

	const holder = new Tarumae.SceneObject();
	scene.add(holder);

	scene.onkeydown = function(key) {
		if (key >= Tarumae.Viewer.Keys.D1
			&& key <= Tarumae.Viewer.Keys.D9) {
			switchTo(key - Tarumae.Viewer.Keys.D1);
		}
	};

	let firstObject = true;
	this.currentIndex = -1;

	for (const [i, mod] of models.entries()) {
		
		scene.createObjectFromURL(mod.path, obj => {
			mod.obj = obj;
			obj.scale.set(0, 0, 0);
			obj.eachChild(child => {
				if (child.mat) {
					if (child.mat.glossy > 0) {
						child.mat.roughness = 1 - child.mat.glossy;
					}
				}
			});

			ground.add(obj);

			if (firstObject) {
				switchTo(i);
				firstObject = false;
			}
		});
	}

	function switchTo(idx) {
		if (idx === window.currentIndex) return;
		
		if (window.currentIndex !== -1) {
			const mod = window.models[currentIndex];
			if (mod) {
				const prevObj = window.models[currentIndex].obj;
				scene.animate({duration: 0.2}, t => {
					prevObj.scale.set(1 - t, 1 - t, 1 - t);
					prevObj.opacity = 1 - t;
				}, _ => prevObj.visible = false);
			}
		}

		currentIndex = idx;

		const mod = models[currentIndex];
		if (mod && mod.obj) {
			const nextObj = mod.obj;
			if (mod.color) {
				if (!nextObj.mat) nextObj.mat = {}
				nextObj.mat.color = mod.color;
			}
			if (mod.scale) {
				nextObj.scale.set(mod.scale[0], mod.scale[1], mod.scale[2]);
			}
			window.obj = nextObj;
			if (window.refmap) window.setObjectRefmap(window.obj);
				
			nextObj.visible = true;
			scene.animate({ effect: "fadein", duration: 0.2 }, t => {
				nextObj.scale.set(1, t, t);
				nextObj.opacity = t;
			});
			scene.animate({ effect: "fadeout" }, t => {
				// nextObj.angle.y = -(1 - t) * 500 + 25;
			});
		}
	}

	scene.mainCamera.fieldOfView = 50;
	scene.mainCamera.location.set(0, 0.7, 1.4);
	scene.mainCamera.angle.set(-10, 0, 0);
	
	// light sources

	const lights = new Tarumae.SceneObject();

	// const light1 = new Tarumae.PointLight();
	// light1.location.set(-3, 4, 2);
	// light1.mat.emission = 2;
	// lights.add(light1);
		
	const light2 = new Tarumae.PointLight();
	light2.location.set(5, 7, 10);
	light2.mat.emission = 20;
	lights.add(light2);

	// const light3 = new Tarumae.PointLight();
	// light3.location.set(2, 4, -5);
	// light3.mat.emission = 1;
	// lights.add(light3);

	const light4 = new Tarumae.PointLight();
	light4.location.set(-3, -6, 4);
	light4.mat.emission = 10;
	lights.add(light4);

	scene.add(lights);

	// new Tarumae.TouchController(scene);
	const objController = new Tarumae.ObjectViewController(scene, {
		enableVerticalRotation: true,
		minVerticalRotateAngle: -10,
		maxVerticalRotateAngle: 50,
	});
	objController.object = ground;

	const cubebox = new Tarumae.ImageCubeBox(renderer, [
		"img/cubemap/office-256/px.jpg",
		"img/cubemap/office-256/nx.jpg",
		"img/cubemap/office-256/py.jpg",
		"img/cubemap/office-256/ny.jpg",
		"img/cubemap/office-256/pz.jpg",
		"img/cubemap/office-256/nz.jpg",
	]);
		
	window.setObjectRefmap = (obj) => {
		obj.eachChild(c => {
			if (c.meshes.length > 0) c.meshes[0]._refmap = window.refmap;
		});
	};

	cubebox.on('load', _ => {
		window.refmap = cubebox.cubemap;
		if (window.obj) {
			window.setObjectRefmap(window.obj);
			ground.meshes[0]._refmap = window.refmap;
		}
	});

	scene.show();
});