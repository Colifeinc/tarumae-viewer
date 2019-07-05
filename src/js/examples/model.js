////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import "../scene/scene";
import "../scene/animation"
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import "../view/objectcontroller"
import { Color3, Color4 } from "../math/vector";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		renderPixelRatio: window.devicePixelRatio,
		// backColor: new Color4(0.74, .87, .85, 1),
		// backgroundImage: "../static/textures/bg-gray-gradient.jpg",
		showDebugPanel: false,
		// enableLighting: false,
		enableShadow: true,
		postprocess: false,
		enableAntialias: true,
		bloomEffect: {
			threshold: 0.3,
			gamma: 2.4,
		}
	});

	const scene = renderer.createScene();

	window._scene = scene;
 
	// scene.add(new Tarumae.GridLine());
	this.models = [
		// { name: "test.toba" },
		// { name: "chair_adv_01.toba" },
		{ name: "KG-367JB-ZW.toba" },
		// { name: "chair_compact_01.toba" },
		// { name: "chair_jati.toba" },
		// { name: "char_stand_01-baked.toba", scale: [.1, .1, .1], color: [.7, .7, .7] },
		// { name: "desk_study_1p-baked.toba", color: [.7, .7, .7] },
		// { name: "fan_vintage_ceiling.toba", scale: [3, 3, 3] },
		// { name: "print_mfp_w1500.toba", color: [.7, .7, .7] },
		// { name: "rice_cooker_01.toba", z: 1, color: [.8, .8, .8] },
		// { name: "sofa_leather_3s.toba" },
	];

	const ground = {
		mesh: new Tarumae.Shapes.PlaneMesh(2, 2),
		mat: { color: [2, 2, 2], tex: "../static/textures/bg-gray-gradient.jpg" },
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
		
		scene.createObjectFromURL("../static/models/" + mod.name, obj => {
			mod.obj = obj;
			obj.location.x = 5;
			obj.visible = false;
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
				scene.animate({}, t => {
					prevObj.location.x = -3 * t;
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
			scene.animate({ effect: "fadein", duration: 0.5 }, t => {
				nextObj.location.x = 3 * (1 - t);
				nextObj.opacity = t;
			});
			scene.animate({ effect: "fadeout" }, t => {
				nextObj.angle.y = -(1 - t) * 500 + 25;
			});
		}
	}

	scene.mainCamera.location.set(0, 1, 2);
	scene.mainCamera.angle.set(-15, 0, 0);
	
	// light sources

	const lights = new Tarumae.SceneObject();

	const light1 = new Tarumae.PointLight();
	light1.location.set(-2, 5, 4);
	light1.mat.emission = 1.0;
	lights.add(light1);
		
	const light2 = new Tarumae.PointLight();
	light2.location.set(0, 4, 3);
	light2.mat.emission = 0.3;
	lights.add(light2);

	scene.add(lights);

	scene.sun.mat.color = [0.5, 0.5, 0.5];

	// new Tarumae.TouchController(scene);
	const objController = new Tarumae.ObjectViewController(scene, {
		enableVerticalRotation: true,
		minVerticalRotateAngle: -10,
		maxVerticalRotateAngle: 50,
		
	});
	objController.object = ground;

	const cubebox = new Tarumae.ImageCubeBox(renderer, [
		"../static/textures/office-cubemap/px.jpg",
		"../static/textures/office-cubemap/nx.jpg",
		"../static/textures/office-cubemap/py.jpg",
		"../static/textures/office-cubemap/ny.jpg",
		"../static/textures/office-cubemap/pz.jpg",
		"../static/textures/office-cubemap/nz.jpg",
	]);
		
	window.setObjectRefmap = (obj) => {
		obj.eachChild(c => c.meshes[0]._refmap = window.refmap);
		this.console.log("set object refmap done");
	};

	cubebox.on('load', _ => {
		window.refmap = cubebox.cubemap;
		if (window.obj) {
			window.setObjectRefmap(window.obj);
		}
	});

	scene.show();
});