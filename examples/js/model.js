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
		backgroundImage: "../img/bg-gray-gradient.jpg",
		renderPixelRatio: window.devicePixelRatio,
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
			gamma: 1.8,
		},
		renderingImage: {
			gamma: 1.0,
		},
	});

	const scene = renderer.createScene();

	window._scene = scene;
 
	// scene.add(new Tarumae.GridLine());
	this.models = [
		// { name: "test.toba" },
		// { name: "chair_adv_01.toba" },

		// { name: "itoki/CZR-187BAC.toba" },
		// { name: "chair_compact_01.toba" },
		// { name: "chair_jati.toba" },
		// { name: "char_stand_01-baked.toba", scale: [.1, .1, .1], color: [.7, .7, .7] },
		// { name: "desk_study_1p-baked.toba", color: [.7, .7, .7] },
		// { name: "fan_vintage_ceiling.toba", scale: [3, 3, 3] },
		// { name: "print_mfp_w1500.toba", color: [.7, .7, .7] },
		// { name: "rice_cooker_01.toba", z: 1, color: [.8, .8, .8] },
		// { name: "sofa_leather_3s.toba" },

		// { name: "layoutAssets/areca_palm.toba" },
		// // { name: "layoutAssets/ficus.toba" },
		// { name: "layoutAssets/bathtub_faucet_set1.toba" },
		// { name: "layoutAssets/JZD-1407HB_CWK.toba" },
		// { name: "layoutAssets/JZD-1407HB_CTH.toba" },
		// { name: "models/floor-glossy.toba" },
		// { name: "layoutAssets/salemachine_01.toba" },
		// { name: "layoutAssets/table_round_01.toba" },

		// { name: "layoutAssets/chair_folding_01.toba" },
		// { name: "layoutAssets/JVB-1207GLPN_PH.toba" },
		// { name: "layoutAssets/chair_bar_01.toba" },
		// { name: "layoutAssets/chair_armrest.toba" },
		// { name: "layoutAssets/table_circle.toba" },
		// { name: "layoutAssets/umbrella_stand.toba" },
		// { name: "layoutAssets/chair_folding_02.toba" },
		// { name: "layoutAssets/desk_medical_tool_3s.toba" },
		// { name: "layoutAssets/tel_desk.toba" },
		// { name: "layoutAssets/desk_kaari_h750.toba" },
		{ name: "layoutAssets/chair_adv_01.toba" },
		// { name: "layoutAssets/shredder.toba" },
		
	];


	// const ground = new Tarumae.Shapes.Sphere();
	
	const ground = {
		mesh: new Tarumae.Shapes.PlaneMesh(3, 3),
		mat: {
			color: [1.5, 1.5, 1.5],
			tex: "../img/bg-gray-gradient.jpg"
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
		
		scene.createObjectFromURL("../" + mod.name, obj => {
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
		"../img/cubemap/office-256/px.jpg",
		"../img/cubemap/office-256/nx.jpg",
		"../img/cubemap/office-256/py.jpg",
		"../img/cubemap/office-256/ny.jpg",
		"../img/cubemap/office-256/pz.jpg",
		"../img/cubemap/office-256/nz.jpg",
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