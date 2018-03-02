
import Tarumae from "../entry";
import "../utility/*";
import "../scene/*";
import { Color4 } from "../math/vector";

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		backColor: new Color4(0.9),
	});

	const scene = renderer.createScene();

	window._scene = scene;
 
	const count = 20000;
	const pm = new Tarumae.ParticleMesh(count);

	var particles = new Array(count);

	for (var i = 0; i < count; i++) {
   
		particles[i] = {
			speed: Math.random() * 0.2 + 0.02,
			angle: 0,
			x: Math.random() * 20 - 10,
			y: Math.random() * 20 - 10,
			z: Math.random() * 20 - 10,
			ox: Math.random() * 20 - 10,
			oy: Math.random() * 20 - 10,
			oz: Math.random() * 20 - 10,
			r: 1.0, //Math.random(),
			g: Math.random(),
			b: Math.random(),
			size: Math.random() * 3,
		};
	}

	function update(p, i) {
		pm.vertexBuffer._s3_set(i * 3, p.x, p.y, p.z);
		pm.vertexBuffer._s3_set((count + i) * 3, p.r, p.g, p.b);
		pm.vertexBuffer._s3_set((count * 2 * 3 + i), p.size);
		pm.update();
	}

	function setAll(iterator) {
		for (var i = 0; i < count; i++) {
			iterator(particles[i]);
		}
	}

	const pobj = new Tarumae.ParticleObject();
	pobj.angle.x = 20;
	pobj.addMesh(pm);
  
	scene.add(pobj);
	// scene.add(new Tarumae.Cube());

	function updateFrame() {
		for (var i = 0; i < count; i++) {
			var p = particles[i];

			p.x += (p.ox - p.x) * p.speed;
			p.y += (p.oy - p.y) * p.speed;
			p.z += (p.oz - p.z) * p.speed;

			p.angle += p.speed * 0.2;
  
			update(p, i);
		}
    
		scene.requireUpdateFrame();
		requestAnimationFrame(updateFrame);
	}

	scene.onmousedown = () => {
		setAll(p => {
			p.ox = Math.random() * 20 - 10;
			p.oy = Math.random() * 20 - 10;
			p.oz = Math.random() * 20 - 10;
		});
	};

	var collapse = () => {
		if (mesh) {
			setAll(p => {
				var vertexIndex = parseInt(Math.random() * mesh.meta.vertexCount) * 3;

				p.ox = mesh.vertexBuffer[vertexIndex];
				p.oy = mesh.vertexBuffer[vertexIndex + 1];
				p.oz = mesh.vertexBuffer[vertexIndex + 2];
			});
		} else {
			setAll(p => {
				p.ox = Math.random() * 20 - 10;
				p.oy = Math.random() * 20 - 10;
				p.oz = Math.random() * 20 - 10;
			});
		}
	};

	scene.onmouseup = collapse;
	scene.onenddrag = collapse;

	requestAnimationFrame(updateFrame);

	scene.animation = true;

	var mesh;

	scene.createObjectFromURL("models/mountain2.mod", mountain => {
		mesh = mountain.meshes[0];

		console.log(mesh.meta);
		
		collapse();

		scene.animate({
			"duration": 2,
			"effect": "fadeout"
		}, t => {
			pobj.angle.y = 140 + 180 * t;
		});
		
	});

	// scene.load({
	// 	"bundle": "models/mountain2.mod"
	// });


	scene.mainCamera.location.set(0, 0, 10);
	scene.mainCamera.angle.set(0, 0, 0);
  
	//new Tarumae.TouchViewer(scene);

	scene.ondrag = () => {
		pobj.angle.y += renderer.viewer.mouse.movement.x;
	};

	scene.show();
});