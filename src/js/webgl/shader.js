////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

////////////////// Shader ///////////////////////

import Tarumae from "../entry";
import { Vec2, Vec3, Vec4, Color3, Color4 } from "../math/vector";
import "../math/matrix";
import "../webgl/texture";

Tarumae.Shader = class {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		if (vertShaderSrc && fragShaderSrc) {
			this.create(vertShaderSrc, fragShaderSrc);
		}

		this.defaultColor = [0.7, 0.7, 0.7];
		this.defaultTexTiling = [1, 1];

		this.sceneStack = [];
		this.objectStack = [];
	}

	create(vertShaderSrc, fragShaderSrc) {
		this.glShaderProgramId = this.gl.createProgram();

		this.uniforms = {};

		if (vertShaderSrc != null) {
			this.vertexShader = new Tarumae.GLShader(this.gl.VERTEX_SHADER, vertShaderSrc);
			this.vertexShader.compile(this);
		}

		if (fragShaderSrc != null) {
			this.fragmentShader = new Tarumae.GLShader(this.gl.FRAGMENT_SHADER, fragShaderSrc);
			this.fragmentShader.compile(this);
		}

		if (this.vertexShader != null && this.fragmentShader != null) {
			this.attach(this.vertexShader);
			this.attach(this.fragmentShader);
			this.link();
		}
	}

	attach(shader) {
		this.gl.attachShader(this.glShaderProgramId, shader.glShaderId);
	}

	link() {
		var gl = this.gl;

		gl.linkProgram(this.glShaderProgramId);

		var linked = gl.getProgramParameter(this.glShaderProgramId, gl.LINK_STATUS);

		if (!linked) {
			// An error occurred while linking
			var lastError = gl.getProgramInfoLog(this.glShaderProgramId);
			console.error("link error: " + lastError);
			//alert("link: " + lastError);

			gl.deleteProgram(this.glShaderProgramId);
			return false;
		}
		else
			return true;
	}

	beginScene(scene) {
		this.sceneStack.push(scene);
		this.scene = scene;
	}

	beginObject(obj) {
		this.objectStack.push(obj);
		this.object = obj;
	}

	beginMesh(mesh) {
		this.currentMesh = mesh;
	}

	endMesh() {
		this.currentMesh = undefined;
	}

	endObject(obj) {
		this.objectStack.pop(obj);
		this.object = this.objectStack.length > 0 ? this.objectStack[this.objectStack.length - 1] : null;
	}

	endScene(scene) {
		this.sceneStack.pop(scene);
		this.scene = this.sceneStack.length > 0 ? this.sceneStack[this.sceneStack.length - 1] : null;
	}

	findAttribute(name) {
		return this.gl.getAttribLocation(this.glShaderProgramId, name);
	}

	findUniform(name) {
		return this.gl.getUniformLocation(this.glShaderProgramId, name);
	}

	bindUniform(name, type, slot) {
		return new Tarumae.ShaderUniform(this, name, type, slot);
	}

	bindUniforms(items) {
		for (var i = 0; i < items.length; i += 3) {
			this.uniforms[items[i]] = this.bindUniform(items[i + 1], items[i + 2]);
		}
	}

	use() {
		this.gl.useProgram(this.glShaderProgramId);
		this.renderer.currentShader = this;
	}

	disuse() {
		// this.gl.useProgram(null);
		console.warn("unsupported method: shader.disuse()");
	}
};

Object.defineProperties(Tarumae.Shader, {
	defaultSunColor: { value: new Vec3(0.21, 0.18, 0.16) },
	emptyTexture: { value: Tarumae.Texture.createEmpty() },
});

Tarumae.ShaderUniform = class {
	constructor(shader, name, type, slot) {
		this.shader = shader;
		this.type = type;
		const gl = shader.gl;

		switch (type) {

			case "bool":
			case "boolean":
			case "int":
				this.address = this.register(shader, name);
				this.set = val => gl.uniform1i(this.address, val);
				break;

			case "float":
				this.address = this.register(shader, name);
				this.set = val => gl.uniform1f(this.address, val);
				break;

			case "vec2":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform2fv(this.address, val);
					} else {
						gl.uniform2fv(this.address, val.toArray());
					}
				};
				break;

			case "color3":
			case "vec3":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform3fv(this.address, val);
					} else {
						gl.uniform3fv(this.address, val.toArray());
					}
				};
				break;

			case "color4":
			case "vec4":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform4fv(this.address, val);
					} else {
						gl.uniform4fv(this.address, val.toArray());
					}
				};
				break;

			case "mat3":
				this.address = this.register(shader, name);
				this.set = val => {
					gl.uniformMatrix3fv(this.address, false, val);
				};
				break;

			case "mat4":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniformMatrix4fv(this.address, false, val);
					} else {
						gl.uniformMatrix4fv(this.address, false, val.toArray());
					}
				};
				break;

			case "tex2d":
			case "texture":
			case "tex":
			case "texcube":
				gl.activeTexture(gl.TEXTURE0 + slot);
				this.address = this.register(shader, name);
				gl.uniform1i(this.address, slot);

				//this.hasUniform = shader.bindUniform("has" + name, "bool");
			
				this.set = tex => {
					gl.activeTexture(gl.TEXTURE0 + slot);
					tex.use(shader.renderer);
				};
				break;

			case "bbox":
				this.max = shader.bindUniform(name + ".max", "vec3");
				this.min = shader.bindUniform(name + ".min", "vec3");
				this.origin = shader.bindUniform(name + ".origin", "vec3");
				
				this.set = bbox => {
					this.max.set(bbox.max);
					this.min.set(bbox.min);
					this.origin.set(bbox.origin);
				};
				break;
		}
	}	
	
	register(shader, name) {
		var address = shader.findUniform(name);
	
		if (!address) {
			if (shader.renderer.debugMode && shader.renderer.developmentVersion) {
				console.warn("uniform not found: " + name);
			}
			this.set = function() { };
			return;
		}
	
		return address;
	}

	unset() {
		switch (this.type) {
			case "tex2d":
			case "texture":
			case "tex":
			case "texcube":
				this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, null);
				break;
		}
	}
};

// function DefaultShaderProgram(renderer, vertShaderSrc, fragShaderSrc) {
// 	this.create(renderer, vertShaderSrc, fragShaderSrc);
	
// 	this.use();

// 	this.vertexPositionAttribute = this.findAttribute('vertexPosition');
// 	this.vertexNormalAttribute = this.findAttribute('vertexNormal');
// 	this.vertexTexcoordAttribute = this.findAttribute('vertexTexcoord');

// 	this.projectMatrixUniform = this.findUniform('projectMatrix');
// 	this.viewMatrixUniform = this.findUniform('viewMatrix');
// 	this.modelMatrixUniform = this.findUniform('modelMatrix');
// 	this.normalMatrixUniform = this.findUniform('normalMatrix');
// }

// DefaultShaderProgram.prototype = new ShaderProgram();

// DefaultShaderProgram.prototype.apply = function(scene, obj) {
// 	var gl = this.gl;

// 	var modelMatrix = scene.transformStack.transform;
	
// 	gl.uniformMatrix4fv(this.projectMatrixUniform, false, this.renderer.projectMatrix.toArray());
// 	gl.uniformMatrix4fv(this.viewMatrixUniform, false, scene.viewMatrix.toArray());	
// 	gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

// 	var normalMatrix = new Matrix4(modelMatrix);
// 	normalMatrix.inverse();
// 	normalMatrix.transpose();

// 	gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix.toArray());
// };

////////////////// SceneShaderProgram ///////////////////////

// function SceneShaderProgram(renderer, vertShaderSrc, fragShaderSrc) {
// 	this.create(renderer, vertShaderSrc, fragShaderSrc);
	
// 	this.use();

// 	// vertex
// 	this.vertexPositionAttribute = this.findAttribute('vertexPosition');
// 	this.vertexNormalAttribute = this.findAttribute('vertexNormal');
// 	this.vertexTexcoordAttribute = this.findAttribute('vertexTexcoord');

// 	// projection
// 	this.projectViewMatrixUniform = this.findUniform('projectViewMatrix');
// 	//	this.viewMatrixUniform = this.findUniform('viewMatrix');
// 	this.modelMatrixUniform = this.findUniform('modelMatrix');
// 	this.normalMatrixUniform = this.findUniform('normalMatrix');

// 	// material
// 	this.colorUniform = this.findUniform("color");
// 	this.opacityUniform = this.findUniform("opacity");

// 	// shadow
// 	this.projectLightMatrixUniform = this.findUniform('projectLightMatrix');
// 	this.directionalLightDirUniform = this.findUniform('directionalLightDir');
// 	this.lightMatrix = null;
// 	this.lightProjectMatrix = null;

// 	// sample
// 	var samplerShadowMap = this.findUniform("samplerShadowMap");
// 	this.gl.uniform1i(samplerShadowMap, 0);

// 	this.textureUniform = this.findUniform("texture");
// 	this.texTilingUniform = this.findUniform("texTiling");
// 	this.gl.uniform1i(this.textureUniform, 1);
// 	this.hasTextureUniform = this.findUniform("hasTexture");

// 	this.lightmapUniform = this.findUniform("lightMap");
// 	this.gl.uniform1i(this.lightmapUniform, 2);
// 	this.hasLightMapUniform = this.findUniform("hasLightMap");
// 	this.defaultMaterialColor = new Color3(1, 1, 1);
// 	this.defaultTexTiling = new Vec2(1, 1);

// 	this.emptyTexture = Texture.createEmpty(renderer);
// }

// SceneShaderProgram.prototype = new ShaderProgram();

// SceneShaderProgram.prototype.apply = function(scene, obj) {
// 	var gl = this.gl;

// 	var modelMatrix = scene.transformStack.matrix;

// 	gl.uniformMatrix4fv(this.projectViewMatrixUniform, false, scene.viewMatrix.mul(this.renderer.projectMatrix).toArray());
// 	gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

// 	var normalMatrix = new Tarumae.Matrix4(modelMatrix);
// 	normalMatrix.inverse();
// 	normalMatrix.transpose();

// 	gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix.toArray());

// 	// directional light matrix
// 	gl.uniformMatrix4fv(this.projectLightMatrixUniform, false, this.lightMatrix.mul(this.lightProjectMatrix).toArray());
// 	gl.uniform3fv(this.directionalLightDirUniform, this.directionalLightDir.toArray());

// 	gl.activeTexture(gl.TEXTURE0);
// 	this.renderer.shadowFrameBuffer.texture.use();

// 	// material
// 	var mat = obj.mat;
	
// 	this.texture = null;
// 	this.lightmap = null;

// 	var color = null;
// 	var texTiling = null;

// 	if (mat != null) {
// 		if(mat.tex instanceof Texture) {
// 			this.texture = mat.tex;
// 		}

// 		if (mat.color instanceof Color3) {
// 			color = mat.color;
// 		}

// 		if (mat.texTiling instanceof Vec2) {
// 			texTiling = mat.texTiling;
// 		}

// 		if (typeof mat.opacity === "undefined") {
// 			gl.uniform1f(this.opacityUniform, 1.0);
// 		} else if (obj.mat.opacity < 1.0) {
// 			gl.enable(gl.BLEND);
// 			gl.disable(gl.DEPTH_TEST);
// 			gl.uniform1f(this.opacityUniform, mat.opacity);
// 		}
// 	}

// 	if (color == null) {
// 		color = this.defaultMaterialColor;
// 	}

// 	if (texTiling == null) {
// 		texTiling = this.defaultTexTiling;
// 		// gl.uniform1i(this.hasAOMapUniform, 1);
// 	}
// 	//  else {
// 	// 	gl.uniform1i(this.hasAOMapUniform, 0);
// 	// }
	
// 	gl.uniform3fv(this.colorUniform, color.toArray());
// 	gl.uniform2fv(this.texTilingUniform, texTiling.toArray());

// 	gl.activeTexture(gl.TEXTURE1);
// 	if (this.texture != null) {
// 		this.texture.use();
// 		gl.uniform1i(this.hasTextureUniform, 1);
// 	} else {
// 		Tarumae.Shader.emptyTexture.use();
// 		gl.uniform1i(this.hasTextureUniform, 0);
// 	}

// 	gl.activeTexture(gl.TEXTURE2);
// 	if (obj.mat != null && obj.mat.lightmap instanceof Texture) {
// 		this.lightmap = obj.mat.lightmap;
// 		this.lightmap.use();
// 		gl.uniform1i(this.hasLightMapUniform, 1);
// 	} else {
// 		Tarumae.Shader.emptyTexture.use();
// 		gl.uniform1i(this.hasLightMapUniform, 0);
// 	}
// };

// SceneShaderProgram.prototype.unapply = function(scene, obj) {
// 	var gl = this.renderer.gl;

// 	if (typeof obj.mat === "object" && typeof obj.mat.opacity !== "undefined"
// 		&& obj.mat.opacity < 1.0) {
// 		gl.disable(gl.BLEND);
// 		gl.enable(gl.DEPTH_TEST);
// 	}	
// };

////////////////// SceneShadowMapShaderProgram ///////////////////////

// function SceneShadowMapShaderProgram(renderer, vertShaderSrc, fragShaderSrc) {
// 	this.create(renderer, vertShaderSrc, fragShaderSrc);
// 	this.use();

// 	this.vertexPositionAttribute = this.findAttribute('vertexPosition');
// 	this.projectLightMatrixUniform = this.findUniform('projectLightMatrix');
// }

// SceneShadowMapShaderProgram.prototype = new ShaderProgram();

// SceneShadowMapShaderProgram.prototype.apply = function(scene, obj) {
// 	var gl = this.gl;

//  	gl.uniformMatrix4fv(this.projectLightMatrixUniform, false,
//  	  (scene.transformStack.matrix.mul(this.lightMatrix).mul(this.lightProjectMatrix)).toArray());
// };

////////////////// ViewerShader ///////////////////////

Tarumae.ViewerShader = class extends Tarumae.Shader {
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
		this.colorUniform = this.findUniform("color");
		this.opacityUniform = this.bindUniform("opacity", "float");
		this.texTilingUniform = this.findUniform("texTiling");

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
		if (texture != null) {
			texture.use(this.renderer);
			gl.uniform1i(this.hasTextureUniform, 1);
		} else {
			Tarumae.Shader.emptyTexture.use(this.renderer);
			gl.uniform1i(this.hasTextureUniform, 0);
		}
	
		// color
		if (color != null) {
			gl.uniform3fv(this.colorUniform, color);
		} else {
			gl.uniform3fv(this.colorUniform, this.defaultColor);
		}

		// texture tiling		
		if (texTiling != null) {
			gl.uniform2fv(this.texTilingUniform, texTiling);
		} else {
			gl.uniform2fv(this.texTilingUniform, this.defaultTexTiling);
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

////////////////// SimpleShader ///////////////////////

Tarumae.SimpleShader = class extends Tarumae.Shader {
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

		this.colorUniform = this.findUniform("color");
		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.texTilingUniform = this.findUniform("texTiling");
		this.opacityUniform = this.bindUniform("opacity", "float");
	}

	beginScene(scene) {
		super.beginScene(scene);

		// render matrix;
		this.projectViewMatrixUniform.set(this.renderer.projectionViewMatrixArray);

		// sun
		if (typeof scene.sun === "object" && scene.sun != null) {
			const sunloc = scene.sun.getWorldLocation();
			const sundir = Vec3.normalize(sunloc);
			this.sundirUniform.set(sundir);
		
			const mat = scene.sun.mat || null;
			const suncolor = (mat && mat.color) || Tarumae.Shader.defaultSunColor;

			this.sunlightUniform.set(suncolor.mul(Vec3.dot(sundir, Vec3.up)).toArray());
		}
	}

	beginObject(obj) {
		super.beginObject(obj);

		var gl = this.gl;

		var modelMatrix = obj._transform;
	
		gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

		var normalMatrix = new Tarumae.Matrix4(modelMatrix);
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
			gl.uniform3fv(this.colorUniform, color);
		} else {
			gl.uniform3fv(this.colorUniform, this.defaultColor);
		}

		// texture tiling		
		if (texTiling !== null) {
			gl.uniform2fv(this.texTilingUniform, texTiling);
		} else {
			gl.uniform2fv(this.texTilingUniform, this.defaultTexTiling);
		}

		// opacity
		if (obj._opacity < 1.0) {
			gl.enable(gl.BLEND);
			//gl.disable(gl.DEPTH_TEST);
			this.opacityUniform.set(obj._opacity);
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

////////////////// BillboardShader ///////////////////////

Tarumae.BillboardShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
		this.projectViewModelMatrixUniform = this.findUniform("projectViewModelMatrix");
		this.colorUniform = this.findUniform("color");
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

		gl.uniform3fv(this.colorUniform, color);

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

////////////////// SolidColorShader ///////////////////////

Tarumae.SolidColorShader = class extends Tarumae.Shader {
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

////////////////// PanoramicImageShader ///////////////////////

Tarumae.PanoramaShader = class extends Tarumae.Shader {
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

		// this.colorUniform = this.findUniform("color");
		this.textureUniform = this.findUniform("texture");
		// this.texTilingUniform = this.findUniform("texTiling");
		// this.opacityUniform = this.bindUniform("opacity", "float");

		// empty cubemap
		this.emptyCubemap = new Tarumae.CubeMap(renderer);
		this.emptyCubemap.enableMipmap = false;
		this.emptyCubemap.createEmpty(2, 2);
	}


	// PanoramaShader.prototype.beginScene = function(scene) {
	// 	Tarumae.Shader.prototype.beginScene.call(this, scene);


	// 	// // sun
	// 	// if (typeof scene.sun === "object" && scene.sun != null) {
	// 	// 	var sunloc = scene.sun.getWorldLocation();
	// 	// 	var sundir = Vec3.normalize(sunloc);
	// 	// 	this.sundirUniform.set(sundir);
		
	// 	// 	var mat = scene.sun.mat || null;
	// 	// 	var suncolor = (mat && mat.color) || this.defaultSunColor;

	// 	// 	this.sunlightUniform.set(suncolor.mul(Vec3.dot(sundir, Vec3.up)).toArray());
	// 	// }

	// };

	beginObject(obj) {
		super.beginObject(obj);

		var gl = this.gl;
	
		var modelMatrix = obj._transform;
		
		this.projectViewModelMatrixUniform.set(
			modelMatrix.mul(this.renderer.projectionViewMatrix));

		// gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

		// var normalMatrix = new Matrix4(modelMatrix);
		// normalMatrix.inverse();
		// normalMatrix.transpose();

		// gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix.toArray());

		// material
		var mat = obj.mat;

		var texture = null;
		// var color = null;
		// var texTiling = null;

		if (mat) {
			// texture
			if (mat.tex && mat.tex instanceof Tarumae.CubeMap) {
				texture = mat.tex;
			}
	
			// color
			// if (typeof mat.color === "object") {
			// 	if (Array.isArray(mat.color)) {
			// 		color = mat.color;
			// 	} else if (mat.color instanceof Color3) {
			// 		color = mat.color.toArray();
			// 	}
			// }

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
		if (texture !== null) {
			texture.use(this.renderer);
		} else {
			this.emptyCubemap.use(this.renderer);
			// Tarumae.Shader.emptyTexture.use(this.renderer);
		}

		// // color
		// if (color !== null) {
		// 	gl.uniform3fv(this.colorUniform, color);
		// } else {
		// 	gl.uniform3fv(this.colorUniform, this.defaultColor);
		// }

		// // texture tiling		
		// if (texTiling !== null) {
		// 	gl.uniform2fv(this.texTilingUniform, texTiling);
		// } else {
		// 	gl.uniform2fv(this.texTilingUniform, this.defaultTexTiling);			
		// }

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

////////////////// StandardShader ///////////////////////

Tarumae.StandardShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexNormalAttribute = this.findAttribute("vertexNormal");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
		this.vertexTexcoord2Attribute = this.findAttribute("vertexTexcoord2");
		this.vertexTangentAttribute = this.findAttribute("vertexTangent");
		this.vertexBitangentAttribute = this.findAttribute("vertexBitangent");
		this.vertexColorAttribute = this.findAttribute("vertexColor");
		
		this.projectViewMatrixUniform = this.findUniform("projectViewMatrix");
		this.modelMatrixUniform = this.findUniform("modelMatrix");
		this.modelMatrix3x3Uniform = this.findUniform("modelMatrix3x3");
		this.normalMatrixUniform = this.findUniform("normalMatrix");

		this.shadowMapUniform = {
			boundingBox: this.bindUniform("shadowMapBox", "bbox"),
			texture: this.findUniform("shadowMap"),
		};
		this.envLightUniform = this.findUniform("envlight");

		this.sundirUniform = this.bindUniform("sundir", "vec3");
		this.sunlightUniform = this.bindUniform("sunlight", "vec3");
	
		this.receiveLightUniform = this.bindUniform("receiveLight", "bool");
		this.opacityUniform = this.bindUniform("opacity", "float");
		this.colorUniform = this.bindUniform("color", "vec3");
		this.texTilingUniform = this.findUniform("texTiling");
		this.glossyUniform = this.findUniform("glossy");
		this.roughnessUniform = this.bindUniform("roughness", "float");
		this.emissionUniform = this.findUniform("emission");
		this.normalMipmapUniform = this.bindUniform("normalMipmap", "float");
		this.normalIntensityUniform = this.bindUniform("normalIntensity", "float");
	
		this.refmapBoxUniform = this.bindUniform("refMapBox", "bbox");

		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.normalMapUniform = this.findUniform("normalMap", "tex", 1);
		this.lightMapUniform = this.bindUniform("lightMap", "tex", 2);
		this.aoMapUniform = this.findUniform("aoMap");
		this.envMapUniform = this.findUniform("envMap");
		this.refMapUniform = this.findUniform("refMap");

		this.hasTextureUniform = this.findUniform("hasTexture");
		this.hasLightMapUniform = this.bindUniform("hasLightMap", "bool");
		this.refMapTypeUniform = this.findUniform("refMapType");
		this.hasNormalMapUniform = this.findUniform("hasNormalMap");
		this.hasShadowMapUniform = this.findUniform("hasShadowMap");
		this.hasUV2Uniform = this.findUniform("hasUV2");
		this.hasEnvMapUniform = this.findUniform("hasEnvMap");

		this.cameraUniform = {
			loc: this.bindUniform("camera.loc", "vec3"),
		};

		this.gl.uniform1i(this.normalMapUniform, 1);
		this.gl.uniform1i(this.envMapUniform, 3);
		this.gl.uniform1i(this.refMapUniform, 4);
		this.gl.uniform1i(this.shadowMapUniform.texture, 5);

		this.lightSources = [];
		this.lightUniforms = [];

		for (var i = 0; i < 200; i++) {
			var indexName = "lights[" + i + "].";
			var lightUniform = {
				type: this.findUniform(indexName + "type"),
				pos: this.bindUniform(indexName + "pos", "vec3"),
				color: this.bindUniform(indexName + "color", "vec3"),
			};
			if (!lightUniform.pos.address) break;
			this.lightUniforms.push(lightUniform);
		}
	
		this.lightCountUniform = this.bindUniform("lightCount", "int");

		// empty cubemap
		this.emptyCubemap = new Tarumae.CubeMap(renderer);
		this.emptyCubemap.enableMipmap = false;
		this.emptyCubemap.createEmpty(2, 2);

		this.emptyBoundingBox = new Tarumae.BoundingBox(Vec3.zero, Vec3.zero);
	}

	checkSceneLightSources(scene, cameraLocation) {
		var shader = this;

		Tarumae.SceneObject.scanTransforms(scene, function(object) {
			if (object.visible === true) {
				if (typeof object.mat === "object" && object.mat !== null) {
					if (typeof object.mat.emission !== "undefined" && object.mat.emission > 0) {
						
						var lightWorldPos;
					
						if (Array.isArray(object.meshes) && object.meshes.length > 0) {
							var bounds = object.getBounds();
							lightWorldPos = Vec3.add(bounds.min, Vec3.mul(Vec3.sub(bounds.max, bounds.min), 0.5));
						} else {
							lightWorldPos = new Vec4(0, 0, 0, 1).mulMat(object._transform).xyz();
						}

						var distance = Vec3.sub(lightWorldPos, cameraLocation).length();
						if (distance > Tarumae.StandardShader.LightLimitation.Distance) return;

						var index = -1;

						for (var i = 0; i < Tarumae.StandardShader.LightLimitation.Count
							&& i < shader.lightSources.length; i++) {
							var existLight = shader.lightSources[i];
							if (distance < existLight.distance) {
								index = i;
								break;
							}
						}

						if (index === -1) {
							shader.lightSources.push({
								object: object,
								worldloc: lightWorldPos,
								distance: distance
							});
						} else if (index >= 0) {
							shader.lightSources.splice(index, 0, {
								object: object,
								worldloc: lightWorldPos,
								distance: distance
							});
						}
					}
				}
			}
		});

		if (this.lightSources.length > Tarumae.StandardShader.LightLimitation.Count) {
			this.lightSources = this.lightSources.slice(0, Tarumae.StandardShader.LightLimitation.Count);
		}
	}

	beginScene(scene) {
		super.beginScene(scene);

		var gl = this.gl;
	
		// render matrix
		gl.uniformMatrix4fv(this.projectViewMatrixUniform, false, this.renderer.projectionViewMatrixArray);

		// camera
		var camera = scene.mainCamera;
		var cameraLocation;

		if (typeof camera !== "undefined" && camera != null) {
			cameraLocation = camera.getWorldLocation();
		} else {
			cameraLocation = new Vec3(0, 0, 0);
		}

		this.cameraUniform.loc.set(cameraLocation.toArray());

		// lights
		this.lightSources._s3_clear();

		if (scene.renderer.options.enableLighting) {
		
			if (this.renderer.debugger) {
				this.renderer.debugger.beforeSelectLightSource();
			}

			this.checkSceneLightSources(scene, cameraLocation);
		
			var lightCount = this.lightSources.length;
		
			if (this.renderer.debugMode) {
				this.renderer.debugger.currentLightCount = lightCount;
			}

			for (var i = 0; i < lightCount; i++) {
				var lightUniform = this.lightUniforms[i];
				var lightWrap = this.lightSources[i];
				var light = lightWrap.object;

				lightUniform.pos.set(lightWrap.worldloc);
			
				if (typeof light.mat === "object") {
					var emission = light.mat.emission;

					if (typeof light.mat.color === "object") {
						if (Array.isArray(light.mat.color)) {
							var colorArr = light.mat.color;
							lightUniform.color.set([colorArr[0] * emission, colorArr[1] * emission, colorArr[2] * emission]);
						} else if (light.mat.color instanceof Color3) {
							lightUniform.color.set(light.mat.color.mul(emission));
						}
					} else {
						lightUniform.color.set([emission, emission, emission]);
					}
				}
			}

			if (this.renderer.debugger) {
				this.renderer.debugger.afterSelectLightSource();
			}
		} else {
			lightCount = 0;
		}
	
		this.lightCountUniform.set(lightCount);

		// sun
		if (typeof scene.sun === "object" && scene.sun != null) {
			const sunloc = scene.sun.getWorldLocation();
			const sundir = Vec3.normalize(sunloc);
			this.sundirUniform.set(sundir);
		
			const mat = scene.sun.mat || null;
			const suncolor = (mat && mat.color) || Tarumae.Shader.defaultSunColor;

			this.sunlightUniform.set(suncolor.mul(Vec3.dot(sundir, Vec3.up)).toArray());
		}
	
		// shadowMap
		var shadowMapTextureUsed = false;

		if (typeof scene.shadowMap === "object" && scene.shadowMap != null) {
			if (typeof scene.shadowMap.texture === "object"
				&& scene.shadowMap.texture instanceof Tarumae.CubeMap) {

				gl.activeTexture(gl.TEXTURE5);
				scene.shadowMap.texture.use();
				gl.uniform1i(this.hasShadowMapUniform, true);
				shadowMapTextureUsed = true;
			}

			this.shadowMapUniform.boundingBox.set(scene.shadowMap.bbox);
		
			// if (typeof scene.shadowMap.boxOrigin !== "undefined") {
			// 	gl.uniform3fv(this.shadowMapUniform.boundingBox.origin, scene.shadowMap.boxOrigin.toArray());
			// } else {
			// 	gl.uniform3fv(this.shadowMapUniform.boundingBox.origin,
			// 		scene.shadowMap.boxMin.add((Vec3.sub(scene.shadowMap.boxMax, scene.shadowMap.boxMin)).div(2)).toArray());
			// }
		}
	
		if (!shadowMapTextureUsed) {
			gl.activeTexture(gl.TEXTURE5);
			this.emptyCubemap.use();
			gl.uniform1i(this.hasShadowMapUniform, false);
		}
	}

	beginObject(obj) {
		super.beginObject(obj);

		var gl = this.gl;

		var modelMatrix = obj._transform;

		gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

		var normalMatrix = new Tarumae.Matrix4(modelMatrix);
		normalMatrix.inverse();
		normalMatrix.transpose();

		gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix.toArray());
	
		this.receiveLightUniform.set((typeof obj.receiveLight === "boolean") ? obj.receiveLight : true);

		// material
		var mat = obj.mat;

		var color = this.defaultColor;
		var texTiling = null;
		var roughness = 0.5;
		var glossy = null;
		var emission = null;
		// var transparency = 0;
		var normalMipmap = 0;
		var normalIntensity = 1.0;

		this.useTexture = null;
		this.usingLightmap = null;
		this.useRefmap = null;
		this.useNormalmap = null;
		this.useEnvmap = null;
	
		if (typeof mat === "object" && mat != null) {
			// texture
			if (mat.tex && typeof mat.tex === "object" && mat.tex instanceof Tarumae.Texture
				&& !mat.tex.isLoading && mat.tex.image && mat.tex.image.complete) {
				this.useTexture = mat.tex;
			}
			
			// normal-map
			if (typeof mat.normalmap === "object" && mat.normalmap instanceof Tarumae.Texture
				&& !mat.normalmap.isLoading && mat.normalmap.image && mat.normalmap.image.complete) {
				this.useNormalmap = mat.normalmap;

				if (typeof mat.normalMipmap !== "undefined") {
					normalMipmap = -Tarumae.MathFunctions.clamp(mat.normalMipmap, 0, 5) * 5;
				}
			
				if (typeof mat.normalIntensity !== "undefined") {
					normalIntensity = mat.normalIntensity;
				}
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
		
			// roughness
			if (typeof mat.roughness !== "undefined") {
				roughness = mat.roughness;
			}
		
			// glossy
			if (typeof mat.glossy !== "undefined") {
				glossy = mat.glossy;
			}

			// // transparency
			// if (typeof mat.transparency !== "undefined" && mat.transparency > 0) {
			// 	transparency = mat.transparency;
			// }

			// emission
			if (typeof mat.emission !== "undefined") {
				emission = mat.emission;
			}
		}

		// texture
		if (this.useTexture != null) {
			this.textureUniform.set(this.useTexture);
			gl.uniform1i(this.hasTextureUniform, true);
		} else {
			this.textureUniform.set(Tarumae.Shader.emptyTexture);
			gl.uniform1i(this.hasTextureUniform, false);
		}

		// normal-map	
		gl.activeTexture(gl.TEXTURE1);
		if (this.renderer.options.enableNormalMap && this.useNormalmap != null) {
			this.useNormalmap.use(this.renderer);
			gl.uniformMatrix3fv(this.modelMatrix3x3Uniform, false, new Tarumae.Matrix3(modelMatrix).toArray());
			gl.uniform1i(this.hasNormalMapUniform, true);

			this.normalMipmapUniform.set(normalMipmap);
			this.normalIntensityUniform.set(normalIntensity);
		} else {
			Tarumae.Shader.emptyTexture.use(this.renderer);
			gl.uniform1i(this.hasNormalMapUniform, false);
		}

		// lightmap
		if (this.renderer.options.enableLightmap
			&& typeof obj.lightmap === "object" && obj.lightmap instanceof Tarumae.Texture) {
			this.lightMapUniform.set(obj.lightmap);
			this.hasLightMapUniform.set(true);
		} else {
			this.lightMapUniform.set(Tarumae.Shader.emptyTexture);
			this.hasLightMapUniform.set(false);
		}

		// refmap
		gl.activeTexture(gl.TEXTURE4);
		if (this.renderer.options.enableEnvmap
			&& typeof obj.refmap === "object" && obj.refmap instanceof Tarumae.CubeMap && obj.refmap.loaded) {
			this.useRefmap = obj.refmap;
			this.useRefmap.use();
		
			if (!obj.refmap.bbox) {
				this.refmapBoxUniform.set(this.emptyBoundingBox);
				gl.uniform1i(this.refMapTypeUniform, 1);
			} else {
				this.refmapBoxUniform.set(obj.refmap.bbox);
				gl.uniform1i(this.refMapTypeUniform, 2);
			}
		} else {
			this.emptyCubemap.use();
			gl.uniform1i(this.refMapTypeUniform, 0);
		}

		this.colorUniform.set(color);
		this.roughnessUniform.set(roughness);

		// texture tiling
		if (texTiling != null) {
			gl.uniform2fv(this.texTilingUniform, texTiling);
		} else {
			gl.uniform2fv(this.texTilingUniform, this.defaultTexTiling);
		}
	
		// glossy
		if (glossy != null) {
			gl.uniform1f(this.glossyUniform, glossy);
		} else {
			gl.uniform1f(this.glossyUniform, 0);
		}
	
		// emission
		if (emission != null) {
			gl.uniform1f(this.emissionUniform, emission);
		} else {
			gl.uniform1f(this.emissionUniform, 0);
		}

		// opacity
		if (obj._opacity < 1) {
			gl.enable(gl.BLEND);
			this.opacityUniform.set(obj._opacity);
		} else {
			this.opacityUniform.set(1);
		}
	}

	beginMesh(mesh) {
		super.beginMesh(mesh);
	
		var gl = this.gl;

		gl.uniform1i(this.hasUV2Uniform, mesh.meta && mesh.meta.uvCount && mesh.meta.uvCount > 1);

		// lightmap
		if (this.usingLightmap === null) {
			gl.activeTexture(gl.TEXTURE2);
			if (this.renderer.options.enableLightmap
				&& typeof this.currentMesh._lightmap === "object" && this.currentMesh._lightmap instanceof Tarumae.Texture) {
				this.usingLightmap = this.currentMesh._lightmap;
				this.usingLightmap.use(this.renderer);
				this.hasLightMapUniform.set(true);
			} else {
				Tarumae.Shader.emptyTexture.use(this.renderer);
				this.hasLightMapUniform.set(false);
			}
		}
	}

	endMesh(mesh) {
		super.endMesh(mesh);
	}

	endObject(obj) {
		var gl = this.renderer.gl;

		this.textureUniform.unset();
		this.lightMapUniform.unset();
	
		// refmap
		if (this.useRefmap !== null) {
			gl.activeTexture(gl.TEXTURE2);
			this.useRefmap.disuse();
		}

		// normal-map	
		if (this.useNormalmap !== null) {
			gl.activeTexture(gl.TEXTURE3);
			this.useNormalmap.disuse();
		}

		gl.disable(gl.BLEND);

		super.endObject(obj);
	}

	endScene(scene) {
		// process goes before call endScene of prototype

		super.endScene(scene);
	}
};

Tarumae.StandardShader.LightLimitation = {
	Count: 15,
	Distance: 50,
};

////////////////// WireframeShader ///////////////////////

Tarumae.WireframeShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
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

////////////////// PointShader ///////////////////////

Tarumae.PointShader = class extends Tarumae.Shader {
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
		var color = undefined;
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

////////////////// ScreenShader ///////////////////////

Tarumae.ScreenShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");
		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.colorUniform = this.bindUniform("color", "color3");
		this.opacityUniform = this.bindUniform("opacity", "float");

		this.projectionMatrix = new Tarumae.Matrix4().ortho(-1, 1, -1, 1, -1, 1);
		this.color = [1, 1, 1];
		this.opacity = 1;
		this.texture = undefined;
	}

	beginMesh(mesh) {
		super.beginMesh(mesh);

		this.projectionMatrixUniform.set(this.projectionMatrix);
		this.colorUniform.set(this.color);
		this.opacityUniform.set(this.opacity);

		if (this.texture) {
			this.textureUniform.set(this.texture);
		} else {
			this.textureUniform.set(Tarumae.Shader.emptyTexture);
		}
	}

	endMesh(mesh) {
		// const gl = this.renderer.gl;
		// gl.disable(gl.BLEND);
		// gl.enable(gl.DEPTH_TEST);

		super.endMesh(mesh);
	}

};

Tarumae.GrayscaleShader = class extends Tarumae.ScreenShader {
};

////////////////// GLShader ///////////////////////

Tarumae.GLShader = function(type, content) {
	this.shaderType = type;
	this.content = content;

	this.glShaderId = null;
};

Tarumae.GLShader.prototype = {
	compile: function(sp) {
		const gl = sp.gl;

		this.glShaderId = gl.createShader(this.shaderType);

		gl.shaderSource(this.glShaderId, this.content);
		gl.compileShader(this.glShaderId);

		if (!gl.getShaderParameter(this.glShaderId, gl.COMPILE_STATUS)) {
			console.error(gl.getShaderInfoLog(this.glShaderId));
			//		alert(gl.getShaderInfoLog(this.glShaderId));
		}
	}
};
