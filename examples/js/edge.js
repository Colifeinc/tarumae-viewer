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
import { Vec3, Vec2 } from "@jingwood/graphics-math";

// import data1 from "/Users/jing/Projects/reconstruction/data/no16/16_1_2.txt" ;
import data1 from "/Users/jing/Projects/reconstruction/data/no16/16_3.txt" ;
// import data1 from "/Users/jing/Projects/reconstruction/data/no16/16_24.txt" ;

// import data1 from "/Users/jing/Projects/reconstruction/data/no16/16_3.txt" ;

window.addEventListener('load', e => {
	const renderer = new Tarumae.Renderer();
	const scene = renderer.createScene();
	window._scene = scene;
	renderer.gl.lineWidth(5);
	let r = renderer;

	// scene.add(new Tarumae.GridLine());
	scene.show();

	scene.mainCamera.location.set(0, 0, 3);
	scene.mainCamera.angle.set(0, 0, 0);

	scene.onframe = r => {
		r.drawLines(vertices, 3);
		// for (let i = 0; i < vertices.length; i++) {
		// 	const v = vertices[i];
			// r.drawPoint(v, 9, window.selectedVertices._t_contains(v) ? "red" : "black");
			// r.drawText(v, i);
		// }e
	};

	window.selectedVertices = [];

	scene.onmousemove = p => {
		if (r.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
			for (const v of vertices) {
				if (!window.selectedVertices._t_contains(v)) {
					const vp = r.transformPoint(v);
					if (Math.abs(vp.x - p.x) < 5 && Math.abs(vp.y - p.y) < 5) {
						window.selectedVertices.push(v);
						console.log("add " + v);
						scene.requireUpdateFrame();
					}
				}
			}
		}

		if (r.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Control)) {
			for (const v of vertices) {
				if (window.selectedVertices._t_contains(v)) {
					const vp = r.transformPoint(v);
					if (Math.abs(vp.x - p.x) < 5 && Math.abs(vp.y - p.y) < 5) {
						window.selectedVertices._t_remove(v);
						console.log("remove " + v);
						scene.requireUpdateFrame();
					}
				}
			}
		}
	};

	window.ssx = function(x) {
		for (const v of window.selectedVertices) {
			v.x = x;
		}
		scene.requireUpdateFrame();
	};

	window.ssy = function(y) {
		for (const v of window.selectedVertices) {
			v.y = y;
		}
		scene.requireUpdateFrame();
	};

	window.ssx = function(z) {
		for (const v of window.selectedVertices) {
			v.z = z;
		}
		scene.requireUpdateFrame();
	};

	// console.log(readData("file:///Users/jing/Projects/reconstruction/data/no16/16_1.txt"));
	let vertices = parseData(data1);

	window._delta = 0;
	window._transform = function() {
		for (let v of vertices) {
			v.z = Math.sqrt(v.x * v.x + v.y * v.y) * window._delta;
		}
	}
	window._to3d = function() {
		if (window._delta < 1.0) {
			window._delta += 0.01;
			window._transform();
			
			scene.requireUpdateFrame();
			setTimeout(window._to3d, 10);
		}
	}

	window.vertices = vertices;
	// console.log(vertices);

	new Tarumae.TouchController(scene);
});

function offsetVertices(vs, off) {
	for (let v of vs) {
		v.set(v.x + off.x, v.y + off.y, v.z + off.z);
	}
}

function parseData(str) {
	var imageSize = new Vec2();
	var m, vertices = [];
	
	var lines = str.match(/[^(\r|\n)]+/g);
	for (var line of lines) {
		if (line.startsWith("imageSize ")) {
			m = line.match(/([0-9.-]+)/g);
			imageSize.set(Number.parseFloat(m[0]), Number.parseFloat(m[1]));
		} else if (line.startsWith("eg ")) {
			m = line.match(/([0-9.-]+)/g);
			vertices.push(new Vec3((Number.parseFloat(m[0]) / imageSize.x - 0.5) * 1.4, -Number.parseFloat(m[1]) / imageSize.y + 0.5, 0));
			vertices.push(new Vec3((Number.parseFloat(m[2]) / imageSize.x - 0.5) * 1.4, -Number.parseFloat(m[3]) / imageSize.y + 0.5, 0));
		}
	}

	return vertices;
}

function readFileData(path) {
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", path, false);
	rawFile.onreadystatechange = function() {
		if (rawFile.readyState === 4) {
			if (rawFile.status === 200 || rawFile.status == 0) {
				var allText = rawFile.responseText;
				alert(allText);
			}
		}
	}
	rawFile.send(null);
}