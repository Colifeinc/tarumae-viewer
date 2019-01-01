
import Tarumae from "../entry";
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		postprocess: true,
		enableLighting: false,
		renderPixelRatio: window.devicePixelRatio,
	});
	const scene = renderer.createScene();

	window._scene = scene;
 
	const cube = new Tarumae.Shapes.Cube();
	cube.scale.set(100, 5, 100);
	cube.location.set(0, 1, 0);
	cube.meshes[0].flipSurfaces();
	cube.mat = { color: [0.93, 0.97, 1] };
	cube.receiveLight = false;
	scene.add(cube);

	scene.createObjectFromURL("/static/floor.toba", obj => {
		scene.add(obj);
	});

	new Tarumae.TouchController(scene, {
		speed: 0.1,
		distance: 2
	});

	scene.show();
});