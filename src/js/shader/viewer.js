
import Tarumae from "../entry";

Tarumae.Shaders.ViewerShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		// vertex
		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexNormalAttribute = this.findAttribute("vertexNormal");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");

		// projection
		this.projectViewModelMatrixUniform = this.findUniform("projectViewModelMatrix");

		// material
		this.colorUniform = this.bindUniform("color", "color3");
		this.opacityUniform = this.bindUniform("opacity", "float");
		this.texTilingUniform = this.bindUniform("texTiling", "vec2");

		// texture
		this.textureUniform = this.findUniform("texture");
		this.lightMapUniform = this.findUniform("lightMap");

		this.gl.uniform1i(this.textureUniform, 0);
		this.gl.uniform1i(this.lightMapUniform, 1);
		this.gl.uniform1i(this.reflectionMapUniform, 2);

		this.hasTextureUniform = this.findUniform("hasTexture");
		this.hasLightMapUniform = this.findUniform("hasLightMap");
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
		var color = null;
		var texTiling = null;
		var opacity = obj.opacity;
	
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
			if (typeof mat.texTiling === "object") {
				if (Array.isArray(mat.texTiling)) {
					texTiling = mat.texTiling;
				} else if (mat.texTiling instanceof Vec2) {
					texTiling = mat.texTiling.toArray();
				}
			}
		}

		// texture
		gl.activeTexture(gl.TEXTURE0);
		if (texture) {
			texture.use(this.renderer);
			gl.uniform1i(this.hasTextureUniform, 1);
		} else {
			Tarumae.Shader.emptyTexture.use(this.renderer);
			gl.uniform1i(this.hasTextureUniform, 0);
		}
	
		// color
		if (color) {
			this.colorUniform.set(color);
		} else {
			this.colorUniform.set(this.defaultColor);
		}

		// texture tiling		
		if (texTiling) {
			this.texTilingUniform.set(texTiling);
		} else {
			this.texTilingUniform.set(this.defaultTexTiling);
		}

		// opacity
		if (opacity) {
			gl.enable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);
			this.opacityUniform.set(opacity);
		} else {
			this.opacityUniform.set(1.0);
		}

		// lightmap	
		gl.activeTexture(gl.TEXTURE1);
		if (typeof obj.lightmap === "object" && obj.lightmap instanceof Tarumae.Texture) {
			obj.lightmap.use(this.renderer);
			gl.uniform1i(this.hasLightMapUniform, 1);
		} else {
			Tarumae.Shader.emptyTexture.use(this.renderer);
			gl.uniform1i(this.hasLightMapUniform, 0);
		}
	}

	endObject(obj) {
		var gl = this.renderer.gl;

		if (typeof obj.mat === "object" && typeof obj.mat.opacity !== "undefined"
			&& obj.mat.opacity < 1.0) {
			gl.disable(gl.BLEND);
			gl.enable(gl.DEPTH_TEST);
		}

		super.endObject(obj);
	}
};