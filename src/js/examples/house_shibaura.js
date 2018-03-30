
import Tarumae from "../entry";
import "../utility/*";
import "../scene/*";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer();

	const scene = renderer.createScene();

	window._scene = scene;
 
	Tarumae.ResourceManager.download("houses/shibaura/scene.json", "json", json => {
		scene.load(json);

		var panoramic = {
			mesh: "models/lightmap/sphere.mesh",
			shader: "simple",
			location: [0, 3, 0],
			scale: [20, 20, 20],
			receiveLight: false,
			mat: { tex: "textures/sky.jpg", color: [0.7, 0.9, 0.99] },
			// mat: { tex: "textures/sky.jpg", color: [1.0,1.1,1.15] },
		};
    
		scene.load(panoramic);
	});
  
	scene.mainCamera.fieldOfView = 90;

	new Tarumae.TouchController(scene);

	scene.show();
});