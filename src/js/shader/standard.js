////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";

import { Vec2, Vec3, Color3, Color4, Matrix4 } from "@jingwood/graphics-math";
import { BoundingBox3D } from "@jingwood/graphics-math";
import { MathFunctions } from "@jingwood/graphics-math";

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
		this.refractionUniform = this.bindUniform("refraction", "float");
		this.normalMipmapUniform = this.bindUniform("normalMipmap", "float");
		this.normalIntensityUniform = this.bindUniform("normalIntensity", "float");
	
		this.refmapBoxUniform = this.bindUniform("refMapBox", "bbox");

		this.textureUniform = this.bindUniform("texture", "tex", 0);
		this.normalMapUniform = this.bindUniform("normalMap", "tex", 1);
		this.lightMapUniform = this.bindUniform("lightMap", "tex", 2);
		this.refMapUniform = this.bindUniform("refMap", "texcube", 4);

		// this.hasTextureUniform = this.bindUniform("hasTexture", "bool");
		// this.hasLightMapUniform = this.bindUniform("hasLightMap", "bool");
		this.refMapTypeUniform = this.bindUniform("refMapType", "int");
		this.shadowMapTypeUniform = this.bindUniform("shadowMapType", "int");
		this.hasNormalMapUniform = this.bindUniform("hasNormalMap", "bool");
		// this.hasUV2Uniform = this.bindUniform("hasUV2", "bool");

		this.cameraLocUniform = this.bindUniform("cameraLoc", "vec3");

		// light source
		this.lightSources = [];
		this.lightUniforms = [];
		this.normalMatrix = new Matrix4();

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

		this.emptyBoundingBox = new BoundingBox3D();
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

		if (this.renderer.options.enableShadow
			&& this._shadowMap2D && this._shadowMap2D instanceof Tarumae.Texture) {
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
	
		this.textureUniform.set(Tarumae.Shader.emptyTexture);
		// this.hasTextureUniform.set(false);

		let color = this.defaultColor;

		if (mat) {
			// texture
			if (mat.tex && typeof mat.tex === "object" && mat.tex instanceof Tarumae.Texture
				&& !mat.tex.isLoading && mat.tex.image && mat.tex.image.complete) {
				this.textureUniform.set(mat.tex);
				// this.hasTextureUniform.set(true);
			}
			
			// normal-map
			if (typeof mat.normalmap === "object" && mat.normalmap instanceof Tarumae.Texture
				&& !mat.normalmap.isLoading && mat.normalmap.image && mat.normalmap.image.complete) {
				this.useNormalmap = mat.normalmap;

				if (typeof mat.normalMipmap !== "undefined") {
					normalMipmap = -MathFunctions.clamp(mat.normalMipmap, 0, 5) * 5;
				}
			
				if (typeof mat.normalIntensity !== "undefined") {
					normalIntensity = mat.normalIntensity;
				}
			}

			if (mat.color) {
				color = mat.color;
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
			if (!isNaN(mat.roughness)) {
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
			
			// refraction
			if (mat.refraction) {
				this.refractionUniform.set(mat.refraction);
			} else {
				this.refractionUniform.set(0);
			}
			// // transparency
			// if (typeof mat.transparency !== "undefined" && mat.transparency > 0) {
			// 	transparency = mat.transparency;
			// }
		}

		this.colorUniform.set(color);

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
			// this.hasLightMapUniform.set(true);
		} else {
			this.lightMapUniform.set(Tarumae.Shader.emptyTexture);
			// this.hasLightMapUniform.set(false);
		}

		// refmap
		if (this.renderer.options.enableEnvmap
			&& typeof obj.refmap && (obj.refmap instanceof Tarumae.CubeMap) && obj.refmap.loaded) {
			this.refMapUniform.set(obj.refmap);
			this.refMapTypeUniform.set(1);
		
			if (!obj.refmap.bbox) {
				this.refmapBoxUniform.set(this.emptyBoundingBox);
			} else {
				this.refmapBoxUniform.set(obj.refmap.bbox);
				this.refMapTypeUniform.set(2);
			}
		} else {
			this.refMapUniform.set(this.emptyCubemap);
			this.refMapTypeUniform.set(0);
		}

		// opacity
		if (obj.__opacity < 1) {
      gl.enable(gl.BLEND);
			this.opacityUniform.set(obj.__opacity);
		} else {
			this.opacityUniform.set(1);
		}

		// shadow
		if (this.renderer.options.enableShadow && this._shadowMap2D) {
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

		// this.hasUV2Uniform.set(mesh.meta && mesh.meta.uvCount > 1);

		// lightmap
		if (this.usingLightmap === null) {
			gl.activeTexture(gl.TEXTURE2);
			if (this.renderer.options.enableLightmap
				&& typeof mesh._lightmap === "object" && mesh._lightmap instanceof Tarumae.Texture
				&& !mesh._lightmap.isLoading) {
				this.usingLightmap = mesh._lightmap;
				this.usingLightmap.use(this.renderer);
				// this.hasLightMapUniform.set(true);
			} else {
				Tarumae.Shader.emptyTexture.use(this.renderer);
				// this.hasLightMapUniform.set(false);
			}
		}

		// refmap
		if (this.renderer.options.enableEnvmap
			&& typeof mesh._refmap === "object" && mesh._refmap instanceof Tarumae.CubeMap && mesh._refmap.loaded) {
			this.refMapUniform.set(mesh._refmap);
			this.refMapTypeUniform.set(1);
		
			if (!mesh._refmap.bbox) {
				this.refmapBoxUniform.set(this.emptyBoundingBox);
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
