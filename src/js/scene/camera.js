////////////////////////// Camera //////////////////////////

import Tarumae from "../entry";
import { Vec3 } from "../math/vector";
import "../scene/object";
import "../webgl/mesh";

Tarumae.CameraMesh = class extends Tarumae.Mesh {
	constructor() {
		super();

		this.vertexBuffer = Tarumae.CameraMesh.VertexBuffer;

		this.meta = {
			vertexCount: 24,
			normalCount: 24,
			texcoordCount: 0,
		};
	}
};

Tarumae.CameraMesh.VertexBuffer = new Float32Array([-0.5, -0.5, -0.375, 0.0, 0.0, 0.625, -0.5,
	0.5, -0.375, -0.5, 0.5, -0.375, 0.0, 0.0, 0.625, 0.5, 0.5, -0.375, 0.5, -0.5, -0.375,
	0.0, 0.0, 0.625, -0.5, -0.5, -0.375, 0.5, 0.5, -0.375, 0.0, 0.0, 0.625, 0.5, -0.5,
	-0.375, 0.0, 0.0, 0.104, -0.5, 0.5, -0.375, 0.5, 0.5, -0.375, 0.5, -0.5, -0.375, 0.0,
	0.0, 0.104, 0.5, 0.5, -0.375, -0.5, 0.5, -0.375, 0.0, 0.0, 0.104, -0.5, -0.5, -0.37,
	-0.5, -0.5, -0.375, 0.0, 0.0, 0.104, 0.5, -0.5, -0.375, -0.894, 0.0, 0.447, -0.894,
	0.0, 0.447, -0.894, 0.0, 0.447, 0.0, 0.894, 0.447, 0.0, 0.894, 0.447, 0.0, 0.894,
	0.447, 0.0, -0.894, 0.447, 0.0, -0.894, 0.447, 0.0, -0.894, 0.447, 0.894, 0.0,
	0.447, 0.894, 0.0, 0.447, 0.894, 0.0, 0.447, -0.0, -0.692, -0.722, -0.0, -0.692,
	-0.722, -0.0, -0.692, -0.722, -0.692, 0.0, -0.722, -0.692, 0.0, -0.722, -0.692,
	0.0, -0.722, 0.692, 0.0, -0.722, 0.692, 0.0, -0.722, 0.692, 0.0, -0.722, -0.0, 0.692,
	-0.722, -0.0, 0.692, -0.722, -0.0, 0.692, -0.722]);

Tarumae.Camera = class extends Tarumae.SceneObject {
	constructor() {
		super();

		// camera is invisible
		this.visible = false;
	
		// render result image size
		this.viewSize = new Tarumae.Size(800, 600);

		// Field of View (AFOV)
		this.fieldOfView = 40;

		// Projection Method (Persp/Ortho)
		this.projectionMethod = Tarumae.ProjectionMethods.Persp;

		// keep only one camera mesh instance	
		if (Tarumae.Camera.meshInstance === null) {
			Tarumae.Camera.meshInstance = new Tarumae.CameraMesh();
		}

		// add mesh into camera object
		this.addMesh(Tarumae.Camera.meshInstance);

		// render scene to texture
		this.renderTexture = null;
  
		// post process filters
		this.filters = [];
	}

	calcVisibleDistanceToObject(obj, padding, out) {
		if (!this.scene || !this.scene.renderer) {
			throw "camera must be added into a scene before use this function";
		}
	
		if (padding === undefined) padding = 0.1;
		const paddingAngle = this.fieldOfView * padding;
		const renderer = this.scene.renderer;
		let target, size, bbox = obj.getBounds();
	
		if (bbox) {
			bbox = new Tarumae.BoundingBox(bbox);
			target = bbox.origin;
			size = Math.max(bbox.size.x, bbox.size.y, bbox.size.z) * 2.0;
		} else {
			target = obj.worldLocation;
			size = 1;
		}
	
		if (typeof out === "object") {
			out.targetLocation = target;
		}
		
		var distance = size * 0.5 + ((size / renderer.aspectRate) / Math.tan((this.fieldOfView - paddingAngle) * Math.PI / 180));
	
		return distance;
	}
	
	focusAt(obj, options) {
		options = options || {};
		
		var out = {};
		var distance = this.calcVisibleDistanceToObject(obj, options.padding, out);
	
		var worldpos = this.worldLocation;
		var dir = Vec3.sub(worldpos, out.targetLocation).normalize();
	
		var targetpos = out.targetLocation.add(dir.mul(distance));
	
		if (options.animation === false) {
			this.location = targetpos;
			this.lookAt(out.targetLocation);
	
			var scene = this.scene;
			if (scene) scene.requireUpdateFrame();
		} else {
			this.moveTo(targetpos, {
				duration: options.duration || 0.8,
				effect: options.effect || "smooth",
				lookdir: out.targetLocation.sub(worldpos),
				lookup: options.lookup || Vec3.up,
			}, options.onfinish);
		}
	}
};

new Tarumae.EventDispatcher(Tarumae.Camera).registerEvents("onmove");

/*
 * Instance of camera mesh. This property is used to share one mesh instance
 * between multiple camera object instances.
 */ 
Tarumae.Camera.meshInstance = null;

/*
 * Calc the AFOV (angle in degrees) by specified focus length and sensor size.
 */
Tarumae.Camera.calcFov = function(focusLength, sensorSize) {
	if (typeof sensorSize === "undefined") {
		sensorSize = 35;
	}

	return 2 * Math.atan2(sensorSize, 2 * focusLength) * 180 / Math.PI;
};

// backward compatibility
// Object.defineProperty(window, "Camera",
// 	{ get: Tarumae.Utility.deprecate("Camera", "Tarumae.Camera") });
