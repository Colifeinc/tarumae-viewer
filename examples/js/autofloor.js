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
		// backgroundImage: "/textures/52642.jpg",
	
		enablePostprocess: true,
		postprocess: {
			gamma: 1.4,
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
			gamma: 1.2,
		},
	});

	
	
	const scene = renderer.createScene();
	window._scene = scene;

	// const session = this.scene.createObjectFromURL(floorTobaUrl, obj => {
	// 	this.vr.floorRootObj = obj;
	// 	this.scene.add(obj);

	// 	const bbox = new BoundingBox(obj.getBounds());
	// 	const maxbsize = Math.max(bbox.size.x, bbox.size.y, bbox.size.z);
	// 	let topY = maxbsize / 5;

	// 	if (topY < 10) topY = 10;
	// 	else if (topY > 40) topY = 40;

	// 	const camera = this.scene.mainCamera;

	// 	camera.location.set(0, topY, 3);
	// 	camera.lookAt(Vec3.zero, Vec3.forward);
		
	// 	this.topViewStatus.topViewHeight = camera.location.y;

	// 	this.planRootObject = obj.findObjectByName('plans');
	// 	if (!this.planRootObject) console.error("plans not found");

	// 	const ceiling = this.scene.findObjectByName("ceiling");
	// 	if (ceiling) ceiling.receiveLight = false;

	// 	const wall = this.scene.findObjectByName("wall");
	// 	if (wall) wall.mat.color = [.9, .9, .9];

	// 	const floor = this.scene.findObjectByName("floor");
	// 	if (floor) floor.mat.color = [.8, .8, .8];

	// 	for (const [i, obj] of this.planRootObject.objects.entries()) {
	// 		obj.visible = 0 === i
	// 	}

	// 	obj.scale.set(0.00001, 0.00001, 0.00001)
	// 	this.scene.add(obj)

	// 	setTimeout(() => {
	// 		this.scene.animate({duration: 0.7}, t => {
	// 			const s = Math.sin(t * 2);
	// 			obj.scale.set(s, s, s);
	// 		});
	// 	}, 500);

	// 	const cubebox = new Tarumae.ImageCubeBox(renderer, [
	// 		"img/office-env/px.jpg",
	// 		"img/office-env/nx.jpg",
	// 		"img/office-env/py.jpg",
	// 		"img/office-env/ny.jpg",
	// 		"img/office-env/pz.jpg",
	// 		"img/office-env/nz.jpg",
	// 	]);
			
	// 	cubebox.on('load', () => {
	// 		obj.eachChild(o => {
	// 			if (o.meshes.length > 0) o.meshes[0]._refmap = cubebox.cubemap;
	// 		});
	// 	});
	// });

	// session.on('progress', t => {
	// 	const w = this.scene.renderer.canvas.width;
	// 	const h = this.scene.renderer.canvas.height;
	// 	this.scene.renderer.drawingContext2D.drawRect({x:0, y: h - 10, width: w * t, height: h}, 0, 'white', '#61A9A9');
	// })

	const showcaseToba = "/floors/floor-ecomode.toba";
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

	let baseurl = "../img/cubemap/city/"
  const skyImageUrls = [
    baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
    baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
	];

	scene.skybox = new Tarumae.SkyBox(renderer, skyImageUrls);
	scene.skybox.visible = false;

	baseurl = "../img/cubemap/office-256/"
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

	scene.show();
});

