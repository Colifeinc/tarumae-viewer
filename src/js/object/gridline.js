////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec3, Vec4, Color3, Matrix4, MathFunctions } from "@jingwood/graphics-math";
import { MathFunctions as _mf, MathFunctions as _mf3 } from "@jingwood/graphics-math";
import "../scene/object.js";

Tarumae.GridLine = class extends Tarumae.SceneObject {
	constructor(gridSize, stride) {
		super();

		this.mat = { color: new Color3(0.7, 0.7, 0.7) };
		this.receiveLight = false;

		if (typeof gridSize === "undefined") {
			this.gridSize = 10.0;
		} else {
			this.gridSize = gridSize;
		}

		if (typeof stride === "undefined") {
			this.stride = 1.0;
		} else {
			this.stride = stride;
		}

		this.conflictWithRay = false;
		this.receiveLight = false;

		this.addMesh(Tarumae.GridLine.generateGridLineMesh(this.gridSize, this.stride));
	}
}

Tarumae.GridLine.generateGridLineMesh = function(gridSize, stride) {
	const width = gridSize, height = gridSize;

	const mesh = new Tarumae.Mesh();
	mesh.vertices = [];
	mesh.composeMode = Tarumae.Mesh.ComposeModes.Lines;

	for (var y = -height; y <= height; y += stride) {
		mesh.vertices.push(-width, 0, y);
		mesh.vertices.push(width, 0, y);
	}

	for (var x = -width; x <= width; x += stride) {
		mesh.vertices.push(x, 0, -height);
		mesh.vertices.push(x, 0, height);
	}

	return mesh;
};
