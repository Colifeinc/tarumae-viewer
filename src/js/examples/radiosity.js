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
import { Color3, Color4, Vec3 } from "../math/vector";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		renderPixelRatio: window.devicePixelRatio,
		backColor: new Color4(0.74, .87, .85, 1),
		// backgroundImage: "../static/textures/bg-gray-gradient.jpg",
		enableLighting: false,
	});

	const scene = renderer.createScene();

	const mesh = new TestMesh();
	mesh.updateEdgeData();

	const obj = new Tarumae.SceneObject();

	const ray = new Tarumae.Ray(new Vec3(0, 1, 0), new Vec3(0.2, -1.2, 0));
	
	
	let hitpoint;

	scene.onframe = r => {
		r.drawRay(ray);

		if (hitpoint) {
			r.drawPoint(hitpoint, 10, "red");
		}
	}

	obj.addMesh(mesh);

	scene.add(obj);

	const res = scene.findObjectsByRay(ray);
	this.console.log(res);
	if (res.object) {
		hitpoint = res.worldPosition;
		console.log(hitpoint);
		scene.requireUpdateFrame();
	}

	scene.mainCamera.location.set(0, 1, 5);
	scene.mainCamera.angle.set(-10, 0, 0);

	// new Tarumae.TouchController(scene);
	new Tarumae.ModelViewer(scene);

	scene.show();
});

class TestMesh extends Tarumae.Mesh {
	constructor() {
		super();

		const width = 3, height = 3;
		const hw = width * 0.5, hh = height * 0.5;

		this.vertices = [-hw, 0, -hh,
			-hw, 0, hh,
			hw, 0, -hh,
			hw, 0, -hh,
			-hw, 0, hh,
			hw, 0, hh];
		
		this.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
		this.texcoords = [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1];
		this.tangents = [-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0];
		this.bitangents = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];

		this.meta = {
			vertexCount: 6,
			normalCount: 6,
			uvCount: 1,
			texcoordCount: 6,
			tangentBasisCount: 6,
		};

		this.composeMode = Tarumae.Mesh.ComposeModes.Triangles;
	}
}