
import Tarumae from "../entry";
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import { Color4 } from "../math/vector";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		postprocess: true,
		enableLighting: false,
		backColor: new Color4(0.96, .98, 1, 1),
		// renderPixelRatio: window.devicePixelRatio,
		renderPixelRatio: Math.max(window.devicePixelRatio * 0.75, 1),
		// renderPixelRatio: 1,
		enableAntialias: true,
		// enableShadow: true,
		shadowQuality: {
			scale: 15,
			viewDepth: 5,
			resolution: 4096,
		},
	});
	
	const scene = renderer.createScene();

	window._scene = scene;
 
	// const cube = new Tarumae.Shapes.Cube();
	// cube.scale.set(100, 5, 100);
	// cube.location.set(0, 1, 0);
	// cube.meshes[0].flipSurfaces();
	// cube.mat = { color: [0.98, 0.99, 1] };
	// cube.receiveLight = false;
	// scene.add(cube);

	scene.createObjectFromURL("/static/floor.toba", obj => {
		scene.add(obj);
	});

	new Tarumae.TouchController(scene, {
		speed: 0.1,
		distance: 2
	});

	scene.show();
});