import Tarumae from "../entry";

Tarumae.Shaders.BillboardShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
		this.projectViewModelMatrixUniform = this.findUniform("projectViewModelMatrix");
		this.colorUniform = this.bindUniform("color", "color3");
		this.textureUniform = this.findUniform("texture");
		this.opacityUniform = this.bindUniform("opacity", "float");
	}

	beginObject(obj) {
		super.beginObject(obj);

		var gl = this.gl;

		var modelMatrix = obj._transform;
	
		gl.uniformMatrix4fv(this.projectViewModelMatrixUniform, false,
			modelMatrix.mul(this.renderer.projectionViewMatrix).toArray());

		// material
		var mat = obj.mat;

		var texture = null;
		var color = this.defaultColor;
		// var texTiling = null;

		if (typeof mat === "object" && mat != null) {
			// texture
			if (typeof mat.tex === "object" && mat.tex instanceof Tarumae.Texture) {
				texture = mat.tex;
			}

			// color
			if (typeof mat.color === "object") {
				if (Array.isArray(mat.color)) {
					color = mat.color;
				} else if (mat.color instanceof Color3) {
					color = mat.color.toArray();
				}
			}

			// texture tiling		
			// if (typeof mat.texTiling === "object") {
			// 	if (Array.isArray(mat.texTiling)) {
			// 		texTiling = mat.texTiling;
			// 	} else if (mat.texTiling instanceof Vec2) {
			// 		texTiling = mat.texTiling.toArray();
			// 	}	
			// }
		}
	
		// texture
		gl.activeTexture(gl.TEXTURE0);
		if (texture != null) {
			texture.use(this.renderer);
		} else {
			Tarumae.Shader.emptyTexture.use(this.renderer);
		}

		this.colorUniform.set(color);

		var opacity = obj.opacity;
		if (opacity) {
			this.opacityUniform.set(opacity);
		} else {
			this.opacityUniform.set(1.0);
		}

		gl.enable(gl.BLEND);
	}

	endObject(obj) {
		var gl = this.renderer.gl;

		gl.disable(gl.BLEND);

		super.endObject(obj);
	}
};
