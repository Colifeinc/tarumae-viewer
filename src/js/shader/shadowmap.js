
import Tarumae from "../entry";
import { Vec3, Matrix4 } from "@jingwood/graphics-math";

Tarumae.Shaders.ShadowMapShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.vertexPositionAttribute = this.findAttribute('vertexPosition');
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");
		
		// // vertex
		// this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		// this.vertexNormalAttribute = this.findAttribute("vertexNormal");
		// this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");

		// // projection
		// this.projectViewModelMatrixUniform = this.findUniform("projectViewModelMatrix");

		// shadow
		// this.projectionMatrixUniform = this.findUniform('projectionMatrix');
		// this.directionalLightDirUniform = this.findUniform('directionalLightDir');
		this.lightMatrix = new Matrix4();
		this.projectionMatrix = new Matrix4();
		
		const aspectRate = this.renderer.aspectRate;
		const scale = renderer.options.shadowQuality.scale || 5;
		const viewDepth = renderer.options.shadowQuality.viewDepth || 5;
		this.projectionMatrix.ortho(-aspectRate * scale, aspectRate * scale,
			-scale, scale, -viewDepth, viewDepth);
	}

	beginScene(scene) {
		this.lightPosition = scene.sun.location;
		this.lightMatrix.lookAt(this.lightPosition, Vec3.zero, Vec3.up);
	}

	beginObject(obj) {
		super.beginObject(obj);

		// const gl = this.renderer.gl;
		// gl.cullFace(gl.FRONT);

		const m = obj._transform.mul(this.lightMatrix).mul(this.projectionMatrix);
		this.projectionMatrixUniform.set(m);

		// gl.cullFace(gl.BACK);
	}
};