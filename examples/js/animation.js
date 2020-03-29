////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from '../../src/js/tarumae.js';
import texWood from "../img/textures/wood.jpg";
import texFloor from "../img/textures/floor.jpg";

class AnimationDemo {
	constructor() {
	}
	
	show(scene) {
		let lastAnimation = undefined;
  
		const objects = {
			cube1: {
				mesh: new Tarumae.CubeMesh(),
				location: [-1, 0.25, 0.2],
				scale: [0.5, 0.5, 0.5],
				mat: { tex: texWood },

				onmouseup: function() {
					lastAnimation = scene.animate({ duration: 2, delay: 0.5 }, t => {
						const s = 0.25 + Math.abs(Math.sin(t * Math.PI * 5) / 10);
						this.location.y = s;

					});
				},

				label: { location: [0, 0.75, 0], innerHTML: "Delay" },
			},
    
			cube2: {
				mesh: new Tarumae.CubeMesh(),
				location: [0, 0.5, 0],
				scale: [1, 1, 1],
				mat: { tex: texWood },

				onmouseup: function() {
					lastAnimation = scene.animate({ duration: 1, effect: "smooth" }, (t) => {
						this.angle.y = t * 360;
					});
				},

				label: { location: [0, 0.75, 0], innerHTML: "Normal" },
			},

			cube3: {
				mesh: new Tarumae.CubeMesh(),
				location: [1.2, 0.35, -0.2],
				scale: [0.7, 0.7, 0.7],
				mat: { tex: texWood },

				onmouseup: function() {
					lastAnimation = scene.animate({ duration: 1, repeat: 2 }, (t) => {
						this.location.x = 1.2 + Math.sin(t * Math.PI * 10) / 10;
					});
				},
      
				label: { location: [0, 0.75, 0], innerHTML: "Repeat" },
			},

			floor: {
				mesh: new Tarumae.Shapes.PlaneMesh(1, 1),
				scale: [6, 6, 6],
				mat: { tex: texFloor },
			},
		};

		scene.onkeyup = (key) => {
			if (key === Tarumae.Viewer.Keys.Space) {
				if (lastAnimation) {
					if (lastAnimation.isPaused) {
						lastAnimation.play();
					} else {
						lastAnimation.pause();
					}
				}
			}
		};

		scene.load(objects);
  
		scene.mainCamera.fieldOfView = 70;

		const modelViewer = new Tarumae.ModelViewer(scene);
		modelViewer.minRotateX = -10;
		modelViewer.maxRotateX = 80;
		modelViewer.enableDragAcceleration = true;

		scene.show();
	}
}

window.addEventListener("load", (e) => {
	const renderer = new Tarumae.Renderer({
		enableShadow: true
	});
	const scene = renderer.createScene();
	window._scene = scene;

	const demo = new AnimationDemo();
	demo.show(scene);
});