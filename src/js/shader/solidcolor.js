
import Tarumae from "../entry";

Tarumae.Shaders.SolidColorShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);
		
		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.colorUniform = this.bindUniform("color", "vec4");
		this.projectViewModelMatrixUniform = this.bindUniform("projectViewModelMatrix", "mat4");

		this.defaultColor4 = [0.8, 0.8, 0.8, 1.0];
	}

	beginObject(obj) {
		super.beginObject(obj);

		var gl = this.gl;

		var color;
	
		if (obj.shader && obj.shader.color) {
			var cobj = obj.shader.color;

			if (Array.isArray(cobj)) {
				color = cobj;
			} else if (cobj instanceof Color4) {
				color = cobj.toArray();
			} else if (cobj instanceof Color3) {
				color = [cobj.r, cobj.g, cobj.b, 1.0];
			}
		}
	
		this.color = color || this.color || this.defaultColor4;

		this.colorUniform.set(this.color);

		var modelMatrix = obj._transform;
	
		this.projectViewModelMatrixUniform.set(
			(modelMatrix.mul(this.renderer.projectionViewMatrix)).toArray());
	
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
	}

	endObject(obj) {
		var gl = this.renderer.gl;
	
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);

		super.endObject(obj);
	}
};