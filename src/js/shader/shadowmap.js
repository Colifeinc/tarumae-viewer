
import Tarumae from "../entry";
import { Vec3, Matrix4 } from "@jingwood/graphics-math";

Tarumae.Shaders.ShadowMapShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.vertexPositionAttribute = this.findAttribute('vertexPosition');
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");
		
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
		this.lightMatrix.lookAt(this.lightPosition, Vec3.zero, Vec3.add(this.lightPosition, Vec3.forward));
	}

	beginObject(obj) {
		super.beginObject(obj);

		const m = obj._transform.mul(this.lightMatrix).mul(this.projectionMatrix);
		this.projectionMatrixUniform.set(m);
	}
};