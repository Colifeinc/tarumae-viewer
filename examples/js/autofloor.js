////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from '../../src/js/tarumae.js';
import { Vec3, Color4 } from "@jingwood/graphics-math";

function _base64ToArrayBuffer(base64) {
	const binary_string = window.atob(base64);
	const len = binary_string.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
			bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		enableLighting: false,
		backColor: new Color4(0.96, .98, 1, 1),
		
		enablePostprocess: true,
		renderingImage: {
			gamma: 1.0,
		},
		enableAntialias: true,
		enableShadow: false,
		shadowQuality: {
			scale: 10,
			viewDepth: 14,
			resolution: 4096,
		},
		bloomEffect: {
			threshold: 0.2,
			gamma: 1.6,
		},
	});

	const scene = renderer.createScene();
	window._scene = scene;

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

		if (floorObj) floorObj.mat.color = [.8, .8, .8];
		
		scene.add(obj);

		obj.scale.set(0.00001, 0.00001, 0.00001);

		setTimeout(() => {
			scene.animate({duration: 0.7}, t => {
				const s = Math.sin(t * 2);
				obj.scale.set(s, s, s);
			});
		}, 500);
	});

	let baseurl = "img/cubemap/city/"
  const skyImageUrls = [
    baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
    baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
	];

	scene.skybox = new Tarumae.SkyBox(renderer, skyImageUrls);
	scene.skybox.visible = false;

	baseurl = "img/cubemap/office-256/"
  const refBoxUrls = [
    baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
    baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
	];
	
	const refCubebox = new Tarumae.ImageCubeBox(renderer, refBoxUrls);
		
	window.setObjectRefmap = (obj) => {
		obj.eachChild(c => {
			if (c.meshes.length > 0) c.meshes[0]._refmap = window.refmap;
		});
	};

	refCubebox.on('load', _ => {
		window.refmap = refCubebox.cubemap;
		if (window.obj) {
			window.setObjectRefmap(window.obj);
			ground.meshes[0]._refmap = window.refmap;
		}
	});

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

	scene.sun.mat.color = [1.1, 1.1, 1.1];

	scene.show();
});

