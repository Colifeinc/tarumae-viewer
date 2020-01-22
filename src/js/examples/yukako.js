////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Color3, Color4 } from "@jingwood/graphics-math";
import "../scene/scene";
import "../scene/animation"
import "../scene/shapes";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		// backColor: new Color4(0.9),
		// defaultShader: "solidcolor",
		enableObjectHover: true,
	});

	const scene = renderer.createScene();

	window._scene = scene;
 
	const playground = new Tarumae.SceneObject();
	playground.angle.set(0, 37, 0);

	var ground = new Tarumae.SceneObject();
	playground.add(ground);

	for (var x = -5; x < 5; x++) {
		for (var y = -5; y < 5; y++) {
			var cell = new Tarumae.Shapes.Cube();

			cell.location.set(x, 0, y);
			cell.scale.set(1, 0.5, 1);
			cell.mat = { color: new Color3(0.7, 0.7, 0.7) };

			cell.onmouseenter = function() {
				this.mat.color.r = 0;
				scene.requireUpdateFrame();
			};
			cell.onmouseout = function() {
				this.mat.color.r = 0.7;
				scene.requireUpdateFrame();
			};

			ground.add(cell);
		}
	}

	scene.add(playground);
	//scene.add(new Tarumae.GridLine());

	var afkun = undefined;

	scene.createObjectFromURL("models/autofloor-kun.mod", obj => {
		afkun = obj;

		afkun.remove(afkun.eye_left);

		afkun.body.mat = { color: new Color3(0.5, 0.5, 0.5) };
		
		var eyeMat = { color: new Color3(0.2, 0.2, 0.2) };
		afkun.eye_left.mat = eyeMat;
		afkun.eye_right.mat = eyeMat;
		afkun.mouth.mat = eyeMat;

		afkun.scale.set(0.5, 0.5, 0.5);
		afkun.location.set(0, 0.75, -6);

		playground.add(afkun);
	});

	scene.mainCamera.location.set(0, 5, 12);
	scene.mainCamera.focusAt(playground, { padding: -0.8 });

	new Tarumae.ModelViewer(scene);

	scene.show();
});