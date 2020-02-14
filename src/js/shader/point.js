
import Tarumae from "../entry";
import { Color3 } from "@jingwood/graphics-math";

Tarumae.Shaders.PointShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		// vertex
		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		// this.vertexNormalAttribute = this.findAttribute('vertexNormal');
		this.vertexColorAttribute = this.findAttribute("vertexColor");
		this.vertexSizeAttribute = this.findAttribute("vertexSize");

		// projection
		this.projectViewModelMatrixUniform = this.bindUniform("projectViewModelMatrix", "mat4");

		// material
		this.colorUniform = this.bindUniform("color", "vec3");
		this.opacityUniform = this.bindUniform("opacity", "float");

		this.pointSizeUniform = this.bindUniform("defaultPointSize", "float");
		this.pointSizeUniform.set(1);
	}

	beginObject(obj) {
		super.beginObject(obj);
	
		var gl = this.gl;
		
		this.projectViewModelMatrixUniform.set(obj._transform.mul(this.renderer.projectionViewMatrix));
		
		var mat = obj.mat;
		var color = Color3.silver;
		var opacity = obj.opacity;
		
		if (typeof mat === "object" && mat != null) {
			
			// color
			if (typeof mat.color === "object") {
				if (Array.isArray(mat.color)) {
					color = mat.color;
				} else if (mat.color instanceof Color3) {
					color = mat.color.toArray();
				}
			}
		}
		
		// color
		if (color) {
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

		gl.enable(gl.BLEND);
	}

	endObject(obj) {
		var gl = this.renderer.gl;
	
		if (typeof obj.mat === "object" && typeof obj.mat.opacity !== "undefined"
			&& obj.mat.opacity < 1.0) {
			gl.disable(gl.BLEND);
			gl.enable(gl.DEPTH_TEST);
		}
		gl.disable(gl.BLEND);
	
		super.endObject(obj);
	}
};