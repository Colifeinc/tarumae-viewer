
import Tarumae from "../entry";

Tarumae.Shaders.PanoramaShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);
		
		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		// this.vertexNormalAttribute = this.findAttribute("vertexNormal");
		// this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
	
		this.projectViewModelMatrixUniform = this.bindUniform("projectViewModelMatrix", "mat4");
		// this.modelMatrixUniform = this.findUniform("modelMatrix");
		// this.normalMatrixUniform = this.findUniform("normalMatrix");

		// this.sundirUniform = this.bindUniform("sundir", "vec3");
		// this.sunlightUniform = this.bindUniform("sunlight", "vec3");

		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.colorUniform = this.bindUniform("color", "color3");
		// this.texTilingUniform = this.findUniform("texTiling");
		// this.opacityUniform = this.bindUniform("opacity", "float");

		// empty cubemap
		this.emptyCubemap = new Tarumae.CubeMap(renderer);
		this.emptyCubemap.enableMipmap = false;
		this.emptyCubemap.createEmpty();
	}


	// PanoramaShader.prototype.beginScene = function(scene) {
	// 	Tarumae.Shader.prototype.beginScene.call(this, scene);


	// 	// // sun
	// 	// if (typeof scene.sun === "object" && scene.sun != null) {
	// 	// 	var sunloc = scene.sun.worldLocation;
	// 	// 	var sundir = Vec3.normalize(sunloc);
	// 	// 	this.sundirUniform.set(sundir);
		
	// 	// 	var mat = scene.sun.mat || null;
	// 	// 	var suncolor = (mat && mat.color) || this.defaultSunColor;

	// 	// 	this.sunlightUniform.set(suncolor.mul(Vec3.dot(sundir, Vec3.up)).toArray());
	// 	// }

	// };

	beginObject(obj) {
		super.beginObject(obj);

		const gl = this.gl;
	
		var modelMatrix = obj._transform;
		
		this.projectViewModelMatrixUniform.set(
			modelMatrix.mul(this.renderer.projectionViewMatrix));

		// gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

		// var normalMatrix = new Matrix4(modelMatrix);
		// normalMatrix.inverse();
		// normalMatrix.transpose();

		// gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix.toArray());

		// material
		const mat = obj.mat;

		let texture = null;
		let color = null;

		if (mat) {
			// texture
			if (mat.tex && mat.tex instanceof Tarumae.CubeMap) {
				texture = mat.tex;
			}
	
      // color
      if (mat.color) {
        color = mat.color;
      }
		}

		// texture
		if (texture) {
			this.textureUniform.set(texture);
    } else {
      this.textureUniform.set(this.emptyCubemap);
		}

		// color
		if (color) {
			this.colorUniform.set(color);
		} else {
      this.colorUniform.set([1, 1, 1]);
		}

		// // opacity
		// if (obj._opacity < 1.0) {
		// 	gl.enable(gl.BLEND);
		// 	//gl.disable(gl.DEPTH_TEST);
		// 	this.opacityUniform.set(obj._opacity);
		// } else {
		// 	this.opacityUniform.set(1.0);
		// }

		gl.cullFace(gl.FRONT);
		// gl.disable(gl.DEPTH_TEST);
	}

	endObject(obj) {
		const gl = this.renderer.gl;

		// gl.disable(gl.BLEND);
		//gl.enable(gl.DEPTH_TEST);
		gl.cullFace(gl.BACK);
	
		super.endObject(obj);
	}
};