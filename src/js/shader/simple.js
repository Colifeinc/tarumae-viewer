
import Tarumae from "../entry";

Tarumae.Shaders.SimpleShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexNormalAttribute = this.findAttribute("vertexNormal");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
	
		this.projectViewMatrixUniform = this.bindUniform("projectViewMatrix", "mat4");
		this.modelMatrixUniform = this.findUniform("modelMatrix");
		this.normalMatrixUniform = this.findUniform("normalMatrix");

		this.sundirUniform = this.bindUniform("sundir", "vec3");
		this.sunlightUniform = this.bindUniform("sunlight", "vec3");

		this.colorUniform = this.bindUniform("color", "color3");
		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.texTilingUniform = this.bindUniform("texTiling", "vec2");
		this.opacityUniform = this.bindUniform("opacity", "float");
	}

	beginScene(scene) {
		super.beginScene(scene);

		// render matrix;
		this.projectViewMatrixUniform.set(this.renderer.projectionViewMatrixArray);

		// sun
		if (typeof scene.sun === "object" && scene.sun != null) {
			const sunloc = scene.sun.worldLocation;
			const sundir = Vec3.normalize(sunloc);
			this.sundirUniform.set(sundir);
		
			const mat = scene.sun.mat || null;
			if (mat && Array.isArray(mat.color)) {
				mat.color = Color3.fromArray(mat.color);
			}
			const suncolor = (mat && mat.color) || Tarumae.Shader.defaultSunColor;

			this.sunlightUniform.set(suncolor.mul(Vec3.dot(sundir, Vec3.up)).toArray());
		}
	}

	beginObject(obj) {
		super.beginObject(obj);

		var gl = this.gl;

		var modelMatrix = obj._transform;
	
		gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

		var normalMatrix = new Matrix4(modelMatrix);
		normalMatrix.inverse();
		normalMatrix.transpose();

		gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix.toArray());

		// material
		var mat = obj.mat;

		var texture = null;
		var color = null;
		var texTiling = null;

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
		if (texture !== null) {
			texture.use(this.renderer);
		} else {
			Tarumae.Shader.emptyTexture.use(this.renderer);
		}

		// color
		if (color !== null) {
			this.colorUniform.set(color);
		} else {
			this.colorUniform.set(this.defaultColor);
		}

		// texture tiling		
		if (texTiling !== null) {
			this.texTilingUniform.set(texTiling);
		} else {
			this.texTilingUniform.set(this.defaultTexTiling);
		}

		// opacity
		if (obj.__opacity < 1.0) {
			gl.enable(gl.BLEND);
			//gl.disable(gl.DEPTH_TEST);
			this.opacityUniform.set(obj.__opacity);
		} else {
			this.opacityUniform.set(1.0);
		}
	}

	endObject(obj) {
		const gl = this.renderer.gl;

		gl.disable(gl.BLEND);
		//gl.enable(gl.DEPTH_TEST);

		super.endObject(obj);
	}
}