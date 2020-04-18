////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from '../../src/js/tarumae.js';
import { Vec3, Color4 } from "@jingwood/graphics-math";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		enableLighting: false,
		backColor: new Color4(0.96, .98, 1, 1),
		
		enablePostprocess: true,
		renderingImage: {
			gamma: 1.2,
			resolutionRatio: 0.75,
		},
		enableAntialias: true,
		enableShadow: true,
		shadowQuality: {
			scale: 10,
			viewDepth: 3,
			resolution: 512,
			intensity: 0.3,
		},
		bloomEffect: {
			threshold: 0.3,
			gamma: 1.4,
		},
	});

	const scene = renderer.createScene();
	window._scene = scene;
	
	let rootObj, refCubebox;

	const setObjectRefmap = (obj) => {
		obj.eachChild(c => {
			if (c.meshes.length > 0) c.meshes[0]._refmap = refCubebox.cubemap;
			if (c.mat && !c.mat.glossy) {
				c.mat.glossy = 0.1;
			}
		});
	};

	const showcaseToba = "floors/floor-ecomode.toba";
	scene.createObjectFromURL(showcaseToba, obj => {
		const floorObj = obj.findObjectByName("floor");
	
		if (floorObj) {
			floorViewController.targetObject = floorObj;
			scene.mainCamera.collisionMode = Tarumae.CollisionModes.NavMesh;
			scene.mainCamera.collisionTarget = floorObj;
		}

		const wall = obj.findObjectByName("wall");
		if (wall) wall.mat.color = [1, 1, 1];

		obj.eachChild(child => {
			child.receiveShadow = child === floorObj;
		});
		
		scene.add(obj);

		obj.scale.set(0.00001, 0.00001, 0.00001);

		rootObj = obj;

		if (refCubebox) {
			setObjectRefmap(obj);
		}

		setTimeout(() => {
			scene.animate({duration: 0.7}, t => {
				const s = Math.sin(t * 2);
				obj.scale.set(s, s, s);
			});
		}, 500);
	});

	let baseurl = "textures/cubemap/city/"
  const skyImageUrls = [
    baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
    baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
	];

	scene.skybox = new Tarumae.SkyBox(renderer, skyImageUrls);
	scene.skybox.visible = false;

	// baseurl = "textures/cubemap/office-256-blur/"
  // const refBoxUrls = [
  //   baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
  //   baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
	// ];
	
	// refCubebox = new Tarumae.ImageCubeBox(renderer, refBoxUrls);

	// refCubebox.on('load', _ => {
	// 	if (rootObj) {
	// 		setObjectRefmap(rootObj);
	// 	}
	// });

	const floorViewController = new Tarumae.FloorViewController(scene);
	floorViewController.on("beginChangeMode", _ => {
		if (scene.skybox) {
			if (floorViewController.topViewStatus.topViewMode) {
				scene.skybox.visible = false;
			}
		}
	});
	floorViewController.on("modeChanged", _ => {
		if (scene.skybox) {
			if (!floorViewController.topViewStatus.topViewMode) {
				scene.skybox.visible = true;
			}
		}
	});

	scene.sun.location.set(0, 10, 0);
	scene.sun.mat.color = [1.1, 1.1, 1.1];

	scene.show();
});

