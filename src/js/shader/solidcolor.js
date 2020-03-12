
import Tarumae from "../entry";

Tarumae.Shaders.SolidColorShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);
		
		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.colorUniform = this.bindUniform("color", "color4");
		this.projectViewModelMatrixUniform = this.bindUniform("projectViewModelMatrix", "mat4");

		this.defaultColor4 = [0.8, 0.8, 0.8, 1.0];
	}

	beginObject(obj) {
		super.beginObject(obj);

		let color;
	
		if (obj.shader && obj.shader.color) {
			const objcolor = obj.shader.color;

			if (Array.isArray(objcolor)) {
				color = objcolor;
			} else if (objcolor instanceof Color4) {
				color = objcolor.toArray();
			} else if (objcolor instanceof Color3) {
				color = [objcolor.r, objcolor.g, objcolor.b, 1.0];
			}
		} else if (this.color) {
			color = this.color;
		} else {
			color = this.defaultColor4;
		}

		this.colorUniform.set(color);
	
		this.projectViewModelMatrixUniform.set(
			(obj._transform.mul(this.renderer.projectionViewMatrix)).toArray());
	
		const gl = this.gl;
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
	}

	endObject(obj) {
		const gl = this.renderer.gl;
	
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);

		super.endObject(obj);
	}
};