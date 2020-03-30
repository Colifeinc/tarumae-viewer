////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from '../../src/js/tarumae.js';
import { Color4 } from "@jingwood/graphics-math";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		enableLighting: true,
		backColor: new Color4(0.96, .98, 1, 1),
		enablePostprocess: true,
		renderingImage: {
			gamma: 1.0,
		},
		enableAntialias: true,
		enableShadow: false,
		bloomEffect: {
			threshold: 0.2,
			gamma: 1.4,
		},
	});
	
	const scene = renderer.createScene();

	window._scene = scene;

	const showcaseToba = "models/room_01a-baked.toba";
	scene.createObjectFromURL(showcaseToba, obj => {
		window.obj = obj;
		scene.add(obj);

		obj.eachChild(child => {
			if (child.mat) {
				if (child.mat.emission > 1) {
					child.mat.emission = 1;
				}
			}
		});

		const floorObj = obj.findObjectByName("floor");
		if (floorObj) {
			scene.mainCamera.collisionMode = Tarumae.CollisionModes.NavMesh;
			scene.mainCamera.collisionTarget = floorObj;
		}

		setupSkyBox();
	});

	function setupSkyBox() {
		const baseurl = "img/cubemap/city-night/"
		const skyImageUrls = [
			baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
			baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
		];

		scene.skybox = new Tarumae.SkyBox(renderer, skyImageUrls);
	}

	scene.sun.location.set(0, 1, 0);
	scene.sun.mat.color = [1, 1, 1];

	scene.mainCamera.fieldOfView = 75;
	scene.mainCamera.location.set(-2.55, 1.5, 2.12);
	scene.mainCamera.angle.set(-3, 310, 0);

	const cameraController = new Tarumae.TouchController(scene);

	scene.show();
});

