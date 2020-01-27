import Tarumae from "../entry";
import { Color3 } from "@jingwood/graphics-math";
import "../webgl/texture";

Tarumae.Shaders = {};

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
	// defaultSunColor: { value: new Color3(0.21, 0.18, 0.16) },
	// defaultSunColor: { value: new Color3(0.5, 0.48, 0.46) },
	defaultSunColor: { value: new Color3(1.0, 0.97, 0.94) },
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

Tarumae.GLShader = class {
	constructor(type, content) {
		this.shaderType = type;
		this.content = content;

		this.glShaderId = null;
	}

	compile(sp) {
		const gl = sp.gl;

		this.glShaderId = gl.createShader(this.shaderType);

		gl.shaderSource(this.glShaderId, this.content);
		gl.compileShader(this.glShaderId);

		if (!gl.getShaderParameter(this.glShaderId, gl.COMPILE_STATUS)) {
			console.error(gl.getShaderInfoLog(this.glShaderId));
		}
	}
};