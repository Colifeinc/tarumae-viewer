
import Tarumae from "../entry";

Tarumae.Shaders.WireframeShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		// this.vertexSizeAttribute = this.findAttribute("vertexSize");
		this.projectViewModelMatrixUniform = this.bindUniform("projectViewModelMatrix", "mat4");

		// material
		this.colorUniform = this.bindUniform("color", "color3");
		this.opacityUniform = this.bindUniform("opacity", "float");
	}

	beginObject(obj) {
		super.beginObject(obj);

		const gl = this.gl;

		const modelMatrix = obj._transform;
		this.projectViewModelMatrixUniform.set(modelMatrix.mul(this.renderer.projectionViewMatrix));

		// material
		const mat = obj.mat;
		const opacity = obj.opacity;
		let color;
		
		if (typeof mat === "object" && mat != null) {			
			// color
			if (typeof mat.color === "object") {
				color = mat.color;
			}
		}

		// color
		if (color != null) {
			this.colorUniform.set(color);
		} else {
			this.colorUniform.set(this.defaultColor);
		}

		// opacity
		if (opacity) {
			gl.enable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);
			this.opacityUniform.set(opacity);
		} else {
			this.opacityUniform.set(1.0);
		}
	}

	endObject(obj) {
		var gl = this.renderer.gl;

		if (obj.mat && !isNaN(obj.mat.opacity) && obj.mat.opacity < 1.0) {
			gl.disable(gl.BLEND);
			gl.enable(gl.DEPTH_TEST);
		}

		super.endObject(obj);
	}

};