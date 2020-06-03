////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

////////////////////////// Camera //////////////////////////

import Tarumae from "../entry";
import { Vec3, BoundingBox3D } from "@jingwood/graphics-math";
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
		this.fieldOfView = 75;

		// Projection Method (Persp/Ortho)
		this.projectionMethod = Tarumae.ProjectionMethods.Persp;

		// keep only one camera mesh instance	
		if (!Tarumae.Camera.meshInstance) {
			Tarumae.Camera.meshInstance = new Tarumae.CameraMesh();
		}

		// add mesh into camera object
		this.addMesh(Tarumae.Camera.meshInstance);

		// render scene to texture
		this.renderTexture = null;
  
		// post process filters
		this.filters = [];
	}

	calcVisibleDistanceToObject(obj, out) {
		if (!this.scene || !this.scene.renderer) {
			throw "camera must be added into a scene before use this function";
		}
	
		const renderer = this.scene.renderer;
		let target, size, bbox = obj.getBounds();
	
		if (bbox) {
			bbox = new BoundingBox3D(bbox);
			target = bbox.origin;
			size = Math.max(bbox.size.x, bbox.size.y, bbox.size.z) * 2.0;
		} else {
			target = obj.worldLocation;
			size = 1;
		}
	
		if (typeof out === "object") {
			out.targetLocation = target;
		}
		
		const distance = size * 0.5 + ((size / renderer.aspectRate) / Math.tan((this.fieldOfView) * Math.PI / 180));
	
		return distance;
	}
	
  focusAt(objectOrPoint, options = {
    distance: 1,
  }) {
		
    let targetMovePos, targetLookatPos, vectorToTarget, distanceToTarget;
    
    const worldpos = this.worldLocation;
    
    if (objectOrPoint instanceof Tarumae.SceneObject) {
      const out = {};
      distanceToTarget = this.calcVisibleDistanceToObject(objectOrPoint, out);
      targetLookatPos = out.targetLocation;
      vectorToTarget = Vec3.sub(targetLookatPos, worldpos);
    } else if (objectOrPoint instanceof Vec3) {
      targetLookatPos = objectOrPoint;
      vectorToTarget = Vec3.sub(targetLookatPos, worldpos);
      distanceToTarget = Vec3.length(vectorToTarget);
    } else if (typeof objectOrPoint === "object") {
      const { x, y, z } = objectOrPoint;
      targetLookatPos = new Vec3(x, y, z);
      vectorToTarget = Vec3.sub(targetLookatPos, worldpos);
      distanceToTarget = Vec3.length(vectorToTarget);
    } else {
      throw Error("invalid target, type is not recognized: " + objectOrPoint);
    }

    if (typeof options.distance !== "undefined" && !isNaN(options.distance)) {
      distanceToTarget -= options.distance;
    } else {
      distanceToTarget -= 1;
    }
  
		const dir = Vec3.normalize(vectorToTarget);
		targetMovePos = Vec3.add(worldpos, Vec3.mul(dir, distanceToTarget));
	
		if (options.animation === false) {
			this.location = targetMovePos;
			this.lookAt(targetLookatPos, options.lookup);
	
			const scene = this.scene;
			if (scene) scene.requireUpdateFrame();
		} else {
			this.moveTo(targetMovePos, {
				duration: options.duration || 0.8,
				effect: options.effect || "smooth",
				lookdir: targetLookatPos.sub(worldpos),
				lookup: options.lookup || Vec3.up,
			}, _ => options.onfinish(targetLookatPos));
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
