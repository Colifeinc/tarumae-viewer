
import Tarumae from "../entry";
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({});
	const scene = renderer.createScene();

	window._scene = scene;
 
	scene.createObjectFromURL("/static/floor.toba", obj => {
		scene.add(obj);
	});

	new Tarumae.TouchController(scene);

	scene.show();
});