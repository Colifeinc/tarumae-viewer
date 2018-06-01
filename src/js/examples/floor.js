
import Tarumae from "../entry";
import { Vec3, Color3, Color4 } from "../math/vector";
import "../scene/scene";
import "../scene/animation"
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		backColor: new Color4(.95, .98, 1, 1),
		// defaultShader: "simple",
		enableLighting: false,
	});

	const scene = renderer.createScene();

	window._scene = scene;
	var o, c, a;

	scene.createObjectFromURL("/static/floor.toba", obj => {

		// DEBUG
		window.o = o = obj;
		window.c = c = scene.mainCamera;
		window.a = a = scene.animate;
		window.sur_range = 3;

		window.sur = o => {
			if (!o) o = scene.findObjectsByCurrentMousePosition({
				filter: _o => _o.name !== "wall" && _o.name != "ceiling"
					&& _o.name != "floor"
			}).object;

			if (o) {
				const oloc = o.getWorldLocation();

				scene.animate({ duration: 8 }, t => {
					window.c.location.x = oloc.x + Math.sin(t * Math.PI * 2) * window.sur_range;
					window.c.location.z = oloc.z + Math.cos(t * Math.PI * 2) * window.sur_range;
					window.c.lookAt(o);
				});
			}
		};

		window.s = function(idx) {
			for (let i = 0; i < 3; i++) {
				window.o.plans.objects[i].visible = i === idx;
			}
			scene.requireUpdateFrame();
		};

		window.sur2_r = loc => {
			window.c.location.x = loc.x + Math.sin(0.3+0) * window.sur_range;
			window.c.location.z = loc.z + Math.cos(.3+0) * window.sur_range;
			var loc2 = loc.clone();
			loc2.y = 0.7;
			window.c.lookAt(loc2);
			scene.requireUpdateFrame();
		};

		// window.lc = new Vec3(7.78031674133481, 1.4, 15.326139636976146);
		// window.sur2_r(window.lc.clone());

		window.sur2 = loc => {
			scene.animate({ duration: 8 }, t => {
				window.c.location.x = loc.x + Math.sin(.3+t * Math.PI * 1.5) * window.sur_range;
				window.c.location.z = loc.z + Math.cos(.3+t * Math.PI * 1.5) * window.sur_range;
				var loc2 = loc.clone();
				loc2.y = 0.7;
				window.c.lookAt(loc2);
			});
		};

		scene.add(obj);

		var cursor = new Tarumae.Circle();
		scene.add(cursor);
		cursor.location.set(-28, 0.1, 7);
	});

	scene.mainCamera.location.set(-30, 1.4, 7);
	scene.mainCamera.angle.y = -90;
	
	// new Tarumae.ModelViewer(scene);
	var tc = new Tarumae.TouchController(scene);
	tc.moveOption.speed = 0.05;
	tc.moveOption.distance = 2;
	
	// scene.renderer.viewer.angle.set(20, 30, 0);
	// scene.renderer.viewer.originDistance = 2;

	scene.show();
});