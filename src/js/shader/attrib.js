////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";

import { Vec2, Vec3, Color3, Color4, Matrix4 } from "@jingwood/graphics-math";
import { BoundingBox3D } from "@jingwood/graphics-math";
import { MathFunctions } from "@jingwood/graphics-math";

Tarumae.Shaders.AttributeShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.vertexPositionAttribute = this.findAttribute('vertexPosition');
    this.vertexNormalAttribute = this.findAttribute("vertexNormal");
    
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");
		this.normalMatrixUniform = this.bindUniform("normalMatrix", "mat4");
    this.typeUniform = this.bindUniform("type", "int");
    
    this.type = 0;
	}

	beginScene(scene) {
    this.typeUniform.set(this.type);
	}

	beginObject(obj) {
    super.beginObject(obj);
    
		this.projectionMatrixUniform.set(obj._transform.mul(this.renderer.projectionViewMatrix));
    this.normalMatrixUniform.set(obj._normalTransform);
	}
};