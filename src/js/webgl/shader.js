////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

////////////////// Shader ///////////////////////

import Tarumae from "../entry";
import { Vec2, Vec3, Vec4, Color3, Color4 } from "../math/vector";
import "../math/matrix";
import "../webgl/texture";

Tarumae.Shaders = {}

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
		const gl = this.gl;
		
		this.glShaderProgramId = gl.createProgram();

		this.uniforms = {};

		if (vertShaderSrc != null) {
			this.vertexShader = new Tarumae.GLShader(gl.VERTEX_SHADER, vertShaderSrc);
			this.vertexShader.compile(this);
		}

		if (fragShaderSrc != null) {
			this.fragmentShader = new Tarumae.GLShader(gl.FRAGMENT_SHADER, fragShaderSrc);
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
		const gl = this.gl;

		gl.linkProgram(this.glShaderProgramId);

		var linked = gl.getProgramParameter(this.glShaderProgramId, gl.LINK_STATUS);

		if (!linked) {
			const lastError = gl.getProgramInfoLog(this.glShaderProgramId);
			console.error("link error: " + lastError);

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
	defaultSunColor: { value: new Color3(0.21, 0.18, 0.16) },
	// defaultSunColor: { value: new Color3(1.0, 0.97, 0.94) },
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
			
			case "float[]":
				this.address = this.register(shader, name);
				this.set = val => {
					gl.uniform1fv(this.address, val);
				};

				// this.set = (arr, val) => {
				// 	if (Array.isArray(arr)) {
				// 		gl.uniform1fv(this.address, val);
				// 		// for (let i = 0; i < arr.length; i++) {
				// 		// 	gl.uniform1f(`${name}[${i}]`, this.address, arr[i]);
				// 		// }
				// 	} else if (isNumber(arr)) {
				// 		gl.uniform1f(`${name}[${arr}]`, this.address, val);
				// 	}
				// }
				break;

			case "vec2":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform2fv(this.address, val);
					} else {
						gl.uniform2f(this.address, val.x, val.y);
					}
				};
				break;

			case "color3":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform3fv(this.address, val);
					} else {
						gl.uniform3f(this.address, val.r, val.g, val.b);
					}
				};
				break;

			case "vec3":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform3fv(this.address, val);
					} else {
						gl.uniform3f(this.address, val.x, val.y, val.z);
					}
				};
				break;

			case "color4":
				this.address = this.register(shader, name);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform4fv(this.address, val);
					} else {
						gl.uniform4f(this.address, val.r, val.g, val.b, val.a);
					}
				};
				break;
			
			case "vec4":
				this.address = this.register(shader, name);
				this.arr = new Array(4);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniform4fv(this.address, val);
					} else {
						this.arr[0] = val.x; this.arr[1] = val.y; this.arr[2] = val.z; this.arr[3] = val.w;
						gl.uniform4fv(this.address, this.arr);
					}
				};
				break;

			case "mat3":
				this.address = this.register(shader, name);
				this.arr = new Array(9);
				this.set = val => {
					if (Array.isArray(val)) {
						gl.uniformMatrix3fv(this.address, false, val);
					} else {
						this.arr[0] = val.a1; this.arr[1] = val.b1; this.arr[2] = val.c1;
						this.arr[3] = val.a2; this.arr[4] = val.b2; this.arr[5] = val.c2;
						this.arr[6] = val.a3; this.arr[7] = val.b3; this.arr[8] = val.c3;
						gl.uniformMatrix3fv(this.address, false, this.arr);
					}
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
				this.slot = slot;

				gl.activeTexture(gl.TEXTURE0 + slot);
				this.address = this.register(shader, name);
				
				gl.uniform1i(this.address, slot);

				// this.hasUniform = shader.bindUniform("has" + name, "bool");
			
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
				this.shader.gl.activeTexture(this.shader.gl.TEXTURE0 + this.slot);
				this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, null);
				break;
		}
	}
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

// function DefaultShaderProgram(renderer, vertShaderSrc, fragShaderSrc) {
// 	this.create(renderer, vertShaderSrc, fragShaderSrc);
	
// 	this.use();

// 	this.vertexPositionAttribute = this.findAttribute('vertexPosition');
// 	this.vertexNormalAttribute = this.findAttribute('vertexNormal');
// 	this.vertexTexcoordAttribute = this.findAttribute('vertexTexcoord');

// 	this.projectMatrixUniform = this.findUniform('projectionMatrix');
// 	this.viewMatrixUniform = this.findUniform('viewMatrix');
// 	this.modelMatrixUniform = this.findUniform('modelMatrix');
// 	this.normalMatrixUniform = this.findUniform('normalMatrix');
// }

// DefaultShaderProgram.prototype = new ShaderProgram();

// DefaultShaderProgram.prototype.apply = function(scene, obj) {
// 	var gl = this.gl;

// 	var modelMatrix = scene.transformStack.transform;
	
// 	gl.uniformMatrix4fv(this.projectMatrixUniform, false, this.renderer.projectionMatrix.toArray());
// 	gl.uniformMatrix4fv(this.viewMatrixUniform, false, scene.viewMatrix.toArray());	
// 	gl.uniformMatrix4fv(this.modelMatrixUniform, false, modelMatrix.toArray());

// 	var normalMatrix = new Matrix4(modelMatrix);
// 	normalMatrix.inverse();
// 	normalMatrix.transpose();

// 	gl.uniformMatrix4fv(this.normalMatrixUniform, false, normalMatrix.toArray());
// };

////////////////// SceneShaderProgram ///////////////////////
Tarumae.Shaders.ShadowMapShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.vertexPositionAttribute = this.findAttribute('vertexPosition');
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");
		
		// // vertex
		// this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		// this.vertexNormalAttribute = this.findAttribute("vertexNormal");
		// this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");

		// // projection
		// this.projectViewModelMatrixUniform = this.findUniform("projectViewModelMatrix");

		// shadow
		// this.projectionMatrixUniform = this.findUniform('projectionMatrix');
		// this.directionalLightDirUniform = this.findUniform('directionalLightDir');
		this.lightMatrix = new Tarumae.Matrix4();
		this.projectionMatrix = new Tarumae.Matrix4();
		
		const aspectRate = this.renderer.aspectRate;
		const scale = renderer.options.shadowQuality.scale || 5;
		const viewDepth = renderer.options.shadowQuality.viewDepth || 5;
		this.projectionMatrix.ortho(-aspectRate * scale, aspectRate * scale,
			-scale, scale, -viewDepth, viewDepth);
	}

	beginScene(scene) {
		this.lightPosition = scene.sun.location;
		this.lightMatrix.lookAt(this.lightPosition, Vec3.zero, Vec3.up);
	}

	beginObject(obj) {
		super.beginObject(obj);

		// const gl = this.renderer.gl;
		// gl.cullFace(gl.FRONT);

		const m = obj._transform.mul(this.lightMatrix).mul(this.projectionMatrix);
		this.projectionMatrixUniform.set(m);

		// gl.cullFace(gl.BACK);
	}
};

////////////////// ViewerShader ///////////////////////

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

////////////////// SimpleShader ///////////////////////

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

////////////////// SolidColorShader ///////////////////////

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

////////////////// PanoramicImageShader ///////////////////////

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

		// this.colorUniform = this.bindUniform("color", "color3");
		this.textureUniform = this.findUniform("texture");
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
		var mat = obj.mat;

		var texture = null;
		// var color = null;

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
		// 	this.colorUniform.set(color);
		// } else {
		// 	this.colorUniform.set(this.defaultColor);
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

Tarumae.Shaders.StandardShader = class extends Tarumae.Shader {
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
		
		this.projectViewMatrixUniform = this.bindUniform("projectViewMatrix", "mat4");
		this.modelMatrixUniform = this.bindUniform("modelMatrix", "mat4");
		this.modelMatrix3x3Uniform = this.bindUniform("modelMatrix3x3", "mat3");
		this.normalMatrixUniform = this.bindUniform("normalMatrix", "mat4");
		this.shadowMapProjectionMatrixUniform = this.bindUniform("shadowmapProjectionMatrix", "mat4");

		this.sundirUniform = this.bindUniform("sundir", "vec3");
		this.sunlightUniform = this.bindUniform("sunlight", "color3");
	
		this.receiveLightUniform = this.bindUniform("receiveLight", "bool");
		this.receiveShadowUniform = this.bindUniform("receiveShadow", "bool");
		this.opacityUniform = this.bindUniform("opacity", "float");
		this.colorUniform = this.bindUniform("color", "color3");
		this.texTilingUniform = this.bindUniform("texTiling", "vec2");
		this.glossyUniform = this.bindUniform("glossy", "float");
		this.roughnessUniform = this.bindUniform("roughness", "float");
		this.emissionUniform = this.bindUniform("emission", "float");
		this.normalMipmapUniform = this.bindUniform("normalMipmap", "float");
		this.normalIntensityUniform = this.bindUniform("normalIntensity", "float");
	
		this.refmapBoxUniform = this.bindUniform("refMapBox", "bbox");

		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.normalMapUniform = this.bindUniform("normalMap", "tex", 1);
		this.lightMapUniform = this.bindUniform("lightMap", "tex", 2);
		this.refMapUniform = this.bindUniform("refMap", "texcube", 4);

		this.hasTextureUniform = this.bindUniform("hasTexture", "bool");
		this.hasLightMapUniform = this.bindUniform("hasLightMap", "bool");
		this.refMapTypeUniform = this.bindUniform("refMapType", "int");
		this.shadowMapTypeUniform = this.bindUniform("shadowMapType", "int");
		this.hasNormalMapUniform = this.bindUniform("hasNormalMap", "bool");
		this.hasUV2Uniform = this.bindUniform("hasUV2", "bool");

		this.cameraLocUniform = this.bindUniform("cameraLoc", "vec3");

		// light source
		this.lightSources = [];
		this.lightUniforms = [];
		this.normalMatrix = new Tarumae.Matrix4();

		for (var i = 0; i < 50; i++) {
			var indexName = "lights[" + i + "].";
			const lightUniform = {
				type: this.findUniform(indexName + "type"),
				pos: this.bindUniform(indexName + "pos", "vec3"),
				color: this.bindUniform(indexName + "color", "color3"),
			};
			if (!lightUniform.pos.address) break;
			this.lightUniforms.push(lightUniform);
		}
	
		this.lightCountUniform = this.bindUniform("lightCount", "int");

		// shadow
		this.shadowMapUniform = {
			boundingBox: this.bindUniform("shadowMapBox", "bbox"),
			tex2d: this.bindUniform("shadowMap2D", "tex", 3),
			texcube: this.bindUniform("shadowMap", "texcube", 5),
		};
		
		// empty cubemap
		this.emptyCubemap = new Tarumae.CubeMap(renderer);
		this.emptyCubemap.enableMipmap = false;
		this.emptyCubemap.createEmpty();

		this.emptyBoundingBox = new Tarumae.BoundingBox(Vec3.zero, Vec3.zero);
	}

	beginScene(scene) {
		super.beginScene(scene);
	
		this.projectViewMatrixUniform.set(this.renderer.projectionViewMatrixArray);

		// camera
		const camera = scene.mainCamera;
		let cameraLocation;

		if (camera) {
			cameraLocation = camera.worldLocation;
		} else {
			cameraLocation = Vec3.zero;
		}

		this.cameraLocUniform.set(cameraLocation);

		// lights
		let lightCount = 0;

		if (scene.renderer.options.enableLighting) {

			lightCount = scene._activedLightSources.length;
		
			if (this.renderer.debugMode) {
				this.renderer.debugger.currentLightCount = lightCount;
			}

			for (var i = 0; i < lightCount; i++) {
				const lightUniform = this.lightUniforms[i];
				var lightWrap = scene._activedLightSources[i];
				var light = lightWrap.object;

				lightUniform.pos.set(lightWrap.worldloc);
			
				if (light.mat) {
					const emission = light.mat.emission;

					if (light.mat.color) {
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


		}
	
		this.lightCountUniform.set(lightCount);

		// sun
		if (scene.sun !== undefined) {
			const sun = scene.sun;

			const sundir = Vec3.normalize(sun.worldLocation);
			this.sundirUniform.set(sundir);
		
			let sunlight = Tarumae.Shader.defaultSunColor;

			if (sun.mat && sun.mat.color) {
				sunlight = sun.mat.color;
			}

			this.sunlightUniform.set(sunlight);
		}
	
		// shadow

		if (this._shadowMap2D && this._shadowMap2D instanceof Tarumae.Texture) {
			this.shadowMapTypeUniform.set(1);
			this.shadowMapUniform.tex2d.set(this._shadowMap2D);
			this.shadowMapUniform.texcube.set(this.emptyCubemap);
		} else {
			this.shadowMapUniform.tex2d.set(Tarumae.Shader.emptyTexture);
			
			if (scene.shadowMap) {
				this.shadowMapTypeUniform.set(2);
	
				if (typeof scene.shadowMap.texture === "object"
					&& scene.shadowMap.texture instanceof Tarumae.CubeMap) {
	
					this.shadowMapUniform.texcube.set(scene.shadowMap);
				}
	
				this.shadowMapUniform.boundingBox.set(scene.shadowMap.bbox);	
			} else {
				this.shadowMapUniform.texcube.set(this.emptyCubemap);
				this.shadowMapTypeUniform.set(0);
			}
		}
	}

	beginObject(obj) {
		super.beginObject(obj);

		var gl = this.gl;

		const modelMatrix = obj._transform;

		this.modelMatrixUniform.set(obj._transform);
		this.normalMatrixUniform.set(obj._normalTransform);
	
		this.receiveLightUniform.set((typeof obj.receiveLight === "boolean") ? obj.receiveLight : true);
		this.receiveShadowUniform.set((typeof obj.receiveShadow === "boolean") ? obj.receiveShadow : true);

		// material
		var mat = obj.mat;

		// var transparency = 0;
		var normalMipmap = 0;
		var normalIntensity = 1.0;

		this.usingLightmap = null;
		this.useNormalmap = null;
	
		if (typeof mat === "object" && mat != null) {
			// texture
			if (mat.tex && typeof mat.tex === "object" && mat.tex instanceof Tarumae.Texture
				&& !mat.tex.isLoading && mat.tex.image && mat.tex.image.complete) {
				this.textureUniform.set(mat.tex);
				this.hasTextureUniform.set(true);
			} else {
				this.textureUniform.set(Tarumae.Shader.emptyTexture);
				this.hasTextureUniform.set(false);
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
			if (mat.color) {
				this.colorUniform.set(mat.color);
			} else {
				this.colorUniform.set(Color3.black);
			}

			// texture tiling
			if (mat.texTiling) {
				this.texTilingUniform.set(mat.texTiling);
			} else {
				this.texTilingUniform.set(this.defaultTexTiling);
			}
	
			// emission
			if (mat.emission) {
				this.emissionUniform.set(mat.emission);
			} else {
				this.emissionUniform.set(0);
			}
			
			// roughness
			if (mat.roughness !== undefined) {
				this.roughnessUniform.set(mat.roughness);
			} else {
				this.roughnessUniform.set(0.5);
			}
		
			// glossy
			if (mat.glossy) {
				this.glossyUniform.set(mat.glossy);
			} else {
				this.glossyUniform.set(0);
			}

			// // transparency
			// if (typeof mat.transparency !== "undefined" && mat.transparency > 0) {
			// 	transparency = mat.transparency;
			// }
		}

		// normal-map	
		if (this.renderer.options.enableNormalMap && this.useNormalmap) {
			this.normalMapUniform.set(this.useNormalmap);
			this.modelMatrix3x3Uniform.set(modelMatrix);
			this.hasNormalMapUniform.set(true);
			this.normalMipmapUniform.set(normalMipmap);
			this.normalIntensityUniform.set(normalIntensity);
		} else {
			this.normalMapUniform.set(Tarumae.Shader.emptyTexture);
			this.hasNormalMapUniform.set(false);
		}

		// lightmap
		if (this.renderer.options.enableLightmap
			&& obj.lightmap && (obj.lightmap instanceof Tarumae.Texture)
			&& !obj.lightmap.isLoading) {
			this.lightMapUniform.set(obj.lightmap);
			this.hasLightMapUniform.set(true);
		} else {
			this.lightMapUniform.set(Tarumae.Shader.emptyTexture);
			this.hasLightMapUniform.set(false);
		}

		// refmap
		if (this.renderer.options.enableEnvmap
			&& typeof obj.refmap && (obj.refmap instanceof Tarumae.CubeMap) && obj.refmap.loaded) {
			this.refMapUniform.set(obj.refmap);
		
			if (!obj.refmap.bbox) {
				this.refmapBoxUniform.set(this.emptyBoundingBox);
				this.refMapTypeUniform.set(1);
			} else {
				this.refmapBoxUniform.set(obj.refmap.bbox);
				this.refMapTypeUniform.set(2);
			}
		} else {
			this.refMapUniform.set(this.emptyCubemap);
			this.refMapTypeUniform.set(0);
		}

		// opacity
		if (obj._opacity < 1) {
			gl.enable(gl.BLEND);
			this.opacityUniform.set(obj._opacity);
		} else {
			this.opacityUniform.set(1);
		}

		// shadow
		if (this._shadowMap2D) {
			const shadowMapShader = Tarumae.Renderer.Shaders.shadowmap.instance;
			if (shadowMapShader) {
				const m = modelMatrix.mul(shadowMapShader.lightMatrix).mul(shadowMapShader.projectionMatrix);
				this.shadowMapProjectionMatrixUniform.set(m);
			}
		}
	}

	beginMesh(mesh) {
		super.beginMesh(mesh);
	
		var gl = this.gl;

		this.hasUV2Uniform.set(mesh.meta && mesh.meta.uvCount > 1);

		// lightmap
		if (this.usingLightmap === null) {
			gl.activeTexture(gl.TEXTURE2);
			if (this.renderer.options.enableLightmap
				&& typeof mesh._lightmap === "object" && mesh._lightmap instanceof Tarumae.Texture
				&& !mesh._lightmap.isLoading) {
				this.usingLightmap = mesh._lightmap;
				this.usingLightmap.use(this.renderer);
				this.hasLightMapUniform.set(true);
			} else {
				Tarumae.Shader.emptyTexture.use(this.renderer);
				this.hasLightMapUniform.set(false);
			}
		}

		// refmap
		if (this.renderer.options.enableEnvmap
			&& typeof mesh._refmap === "object" && mesh._refmap instanceof Tarumae.CubeMap && mesh._refmap.loaded) {
			this.refMapUniform.set(mesh._refmap);
		
			if (!mesh._refmap.bbox) {
				this.refmapBoxUniform.set(this.emptyBoundingBox);
				this.refMapTypeUniform.set(1);
			} else {
				this.refmapBoxUniform.set(mesh._refmap.bbox);
				this.refMapTypeUniform.set(2);
			}
		} else {
			this.refMapUniform.set(this.emptyCubemap);
			this.refMapTypeUniform.set(0);
		}
	}

	endMesh(mesh) {
		super.endMesh(mesh);
	}

	endObject(obj) {
		var gl = this.renderer.gl;

		this.textureUniform.unset();
		this.lightMapUniform.unset();
		this.refMapUniform.unset();

		// normal-map	
		if (this.useNormalmap !== null) {
			gl.activeTexture(gl.TEXTURE3);
			this.useNormalmap.disuse();
		}

		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);

		super.endObject(obj);
	}

	endScene(scene) {
		// process goes before call endScene of prototype

		super.endScene(scene);
	}
};

Tarumae.Shaders.StandardShader.LightLimitation = {
	Count: 15,
	Distance: 50,
};

////////////////// WireframeShader ///////////////////////

Tarumae.Shaders.WireframeShader = class extends Tarumae.Shader {
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

////////////////// ImageShader ///////////////////////

Tarumae.Shaders.ImageShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");

		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.texture2Uniform = this.bindUniform("tex2", "tex", 1);
		this.hasTex2Uniform = this.bindUniform("hasTex2", "bool");
		
		this.colorUniform = this.bindUniform("color", "color3");
		this.opacityUniform = this.bindUniform("opacity", "float");
		this.resolutionUniform = this.bindUniform("resolution", "vec2");
		this.resStrideUniform = this.bindUniform("resStride", "vec2");
		this.filterTypeUniform = this.bindUniform("filterType", "int");

		this.samplingWeightUniform = this.bindUniform("samplingWeight", "float[]");
		// this.samplingWeightUniform.set([0.132572, 0.125472, 0.106373, 0.08078, 0.05495, 0.033482, 0.018275, 0.008934, 0.003912, 0.001535]);
		this.samplingWeightUniform.set([0.114357, 0.109813, 0.097238, 0.079397, 0.059781, 0.041506, 0.026573, 0.015687, 0.00854, 0.004287]);
		// this.samplingWeightUniform.set([0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216]);
		
		this.enableAntialiasUniform = this.bindUniform("enableAntialias", "bool");
		this.gammaFactorUniform = this.bindUniform("gammaFactor", "float");
		this.projectionMatrix = new Tarumae.Matrix4().ortho(-1, 1, -1, 1, -1, 1);

		this.resetParameters();
	}

	beginMesh(mesh) {
		super.beginMesh(mesh);

		this.projectionMatrixUniform.set(this.projectionMatrix);
		this.colorUniform.set(this.color);
		this.opacityUniform.set(this.opacity);

		this.resStride[0] = 1 / this.resolution[0];
		this.resStride[1] = 1 / this.resolution[1];
		this.resStrideUniform.set(this.resStride);
		this.resolutionUniform.set(this.resolution);

		this.enableAntialiasUniform.set(this.enableAntialias);
		this.gammaFactorUniform.set(this.gammaFactor);
		this.filterTypeUniform.set(this.filterType);
 
		if (this.texture) {
			this.textureUniform.set(this.texture);
		} else {
			this.textureUniform.set(Tarumae.Shader.emptyTexture);
		}

		if (this.tex2) {
			this.texture2Uniform.set(this.tex2);
			this.hasTex2Uniform.set(true);
		} else {
			this.texture2Uniform.set(Tarumae.Shader.emptyTexture);
			this.hasTex2Uniform.set(false);
		}

		this.gl.depthMask(false);
		this.gl.enable(this.gl.BLEND);
	}

	endMesh(mesh) {
		this.resetParameters();

		// const gl = this.renderer.gl;
		// gl.disable(gl.BLEND);
		// gl.enable(gl.DEPTH_TEST);
		this.gl.depthMask(true);
		this.gl.disable(this.gl.BLEND);

		this.textureUniform.unset();
		this.texture2Uniform.unset();

		super.endMesh(mesh);
	}

	resetParameters() {
		this.enableAntialias = false;
		this.gammaFactor = 1;
		this.color = [1, 1, 1];
		this.opacity = 1;
		this.texture = undefined;
		this.resolution = [0, 0];
		this.resStride = [.001, .001];
		this.filterType = 0;
	}
};

////////////////// ScreenShader ///////////////////////

Tarumae.Shaders.ScreenShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");

		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.texture2Uniform = this.bindUniform("tex2", "tex", 1);
		this.hasTex2Uniform = this.bindUniform("hasTex2", "bool");
		
		this.colorUniform = this.bindUniform("color", "color3");
		this.opacityUniform = this.bindUniform("opacity", "float");
		this.resolutionUniform = this.bindUniform("resolution", "vec2");
		this.resStrideUniform = this.bindUniform("resStride", "vec2");
		
		this.samplingWeightUniform = this.bindUniform("samplingWeight", "float[]");
		this.samplingWeightUniform.set([0.114357, 0.109813, 0.097238, 0.079397, 0.059781, 0.041506, 0.026573, 0.015687, 0.00854, 0.004287]);

		this.enableAntialiasUniform = this.bindUniform("enableAntialias", "bool");
		this.enableAntialias = false;

		this.gammaFactorUniform = this.bindUniform("gammaFactor", "float");
		this.gammaFactor = 1;

		this.projectionMatrix = new Tarumae.Matrix4().ortho(-1, 1, -1, 1, -1, 1);
		this.color = [1, 1, 1];
		this.opacity = 1;
		this.texture = undefined;
		this.resolution = [0, 0];
		this.resStride = [.001, .001];
	}

	beginMesh(mesh) {
		super.beginMesh(mesh);

		this.projectionMatrixUniform.set(this.projectionMatrix);
		this.colorUniform.set(this.color);
		this.opacityUniform.set(this.opacity);

		this.resStride[0] = 1 / this.resolution[0];
		this.resStride[1] = 1 / this.resolution[1];
		this.resStrideUniform.set(this.resStride);
		this.resolutionUniform.set(this.resolution);

		this.enableAntialiasUniform.set(this.enableAntialias);
		this.gammaFactorUniform.set(this.gammaFactor);

		if (this.texture) {
			this.textureUniform.set(this.texture);
		} else {
			this.textureUniform.set(Tarumae.Shader.emptyTexture);
		}

		if (this.tex2) {
			this.texture2Uniform.set(this.tex2);
			this.hasTex2Uniform.set(true);
		} else {
			this.texture2Uniform.set(Tarumae.Shader.emptyTexture);
			this.hasTex2Uniform.set(false);
		}

		this.gl.depthMask(false);
		this.gl.enable(this.gl.BLEND);
	}

	endMesh(mesh) {
		this.gl.depthMask(true);
		this.gl.disable(this.gl.BLEND);

		this.textureUniform.unset();
		this.texture2Uniform.unset();

		super.endMesh(mesh);
	}

};

////////////////// GrayscaleShader ///////////////////////

Tarumae.Shaders.GrayscaleShader = class extends Tarumae.Shaders.ImageShader {
};

