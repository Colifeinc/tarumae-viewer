////////////////// StandardShader ///////////////////////

Tarumae.EditorShader = function(renderer, vertShaderSrc, fragShaderSrc) {
	this.create(renderer, vertShaderSrc, fragShaderSrc);
	this.use();

	this.vertexPositionAttribute = this.findAttribute('vertexPosition');
	this.vertexNormalAttribute = this.findAttribute('vertexNormal');
	this.vertexTexcoordAttribute = this.findAttribute('vertexTexcoord');
	this.vertexTexcoord2Attribute = this.findAttribute('vertexTexcoord2');
	this.vertexTangentAttribute = this.findAttribute('vertexTangent');
	this.vertexBitangentAttribute = this.findAttribute('vertexBitangent');
		
	this.projectViewMatrixUniform = this.findUniform('projectViewMatrix');
	this.modelMatrixUniform = this.findUniform('modelMatrix');
	this.modelMatrix3x3Uniform = this.findUniform('modelMatrix3x3');
	this.normalMatrixUniform = this.findUniform('normalMatrix');

	this.sundirUniform = this.bindUniform("sundir", "vec3");
	this.sunlightUniform = this.bindUniform("sunlight", "vec3");
	
	this.receiveLightUniform = this.bindUniform("receiveLight", "bool");
	this.opacityUniform = this.bindUniform("opacity", "float");
	this.colorUniform = this.bindUniform("color", "vec3");
	this.texTilingUniform = this.bindUniform("texTiling", "vec2");
	this.glossyUniform = this.findUniform("glossy");
	this.roughnessUniform = this.bindUniform("roughness", "float");
	this.emissionUniform = this.findUniform("emission");
	this.normalMipmapUniform = this.bindUniform("normalMipmap", "float");
	// this.normalIntensityUniform = this.bindUniform("normalIntensity", "float");
	
	this.textureUniform = this.findUniform("texture");
	this.normalMapUniform = this.findUniform("normalMap");
	this.hasTextureUniform = this.findUniform("hasTexture");	
	this.hasNormalMapUniform = this.findUniform("hasNormalMap");
	this.hasShadowMapUniform = this.findUniform("hasShadowMap");
	this.hasUV2Uniform = this.findUniform("hasUV2");

  this.shadowMapUniform = this.findUniform("shadowMap");
	this.cameraLocUniform = this.bindUniform("camera.loc", "vec3");

	this.gl.uniform1i(this.textureUniform, 0);
	this.gl.uniform1i(this.normalMapUniform, 1);
	this.gl.uniform1i(this.shadowMapUniform, 2);

	this.pointLightUniforms = [];
	this.spotLightUniforms = [];
  this.pointLightCount = 0;
  this.spotLightCount = 0;

	for (var i = 0; i < 200; i++) {
		var indexName = "pointLights[" + i + "].";
		var lightUniform = {
			pos: this.bindUniform(indexName + "pos", "vec3"),
			color: this.bindUniform(indexName + "color", "vec3"),
		};
		if (!lightUniform.pos.address) break;
		this.pointLightUniforms.push(lightUniform);
	}
  
  for (var i = 0; i < 200; i++) {
		var indexName = "spotLights[" + i + "].";
		var lightUniform = {
      pos: this.bindUniform(indexName + "pos", "vec3"),
      dir: this.bindUniform(indexName + "dir", "vec3"),
			color: this.bindUniform(indexName + "color", "vec3"),
			range: this.bindUniform(indexName + "range", "float"),
		};
		if (!lightUniform.pos.address) break;
		this.spotLightUniforms.push(lightUniform);
  }
  
	this.pointLightCountUniform = this.bindUniform("pointLightCount", "int");
	this.spotLightCountUniform = this.bindUniform("spotLightCount", "int");
}
  
Tarumae.EditorShader.prototype = new Tarumae.Shader();

Object.assign(Tarumae.EditorShader.prototype, {
  
  setShaderLightSource: function(object) {

    if (typeof object.mat === "object" && object.mat !== null) {
      var mat = object.mat;

      var lightWorldPos;

      if (Array.isArray(object.meshes) && object.meshes.length > 0) {
        var bounds = object.getBounds();
        lightWorldPos = Vec3.add(bounds.min, Vec3.div(Vec3.sub(bounds.max, bounds.min), 2));
      } else {
        lightWorldPos = new Vec4(0, 0, 0, 1).mulMat(object._transform).xyz();
      }
      
      var lightUniform;
    
      if (typeof mat.spotRange === "undefined" || isNaN(mat.spotRange) || mat.spotRange < 0 || mat.spotRange > 180) {
        if (this.pointLightCount < 10) {
          lightUniform = this.pointLightUniforms[this.pointLightCount++];
        }
      } else {
        if (this.spotLightCount < 30) {
          lightUniform = this.spotLightUniforms[this.spotLightCount++];

          var rt = object.getRotationMatrix(true);
          rt.rotateX(-90);
          var lightDir = rt.extractLookAtVectors();
          lightUniform.dir.set(lightDir.dir);

          var spotRangeDot = Math.cos(Tarumae.MathFunctions.angleToDegree(mat.spotRange * 0.5));
          lightUniform.range.set(spotRangeDot);

        }
      }

      if (lightUniform) {
        lightUniform.pos.set(lightWorldPos);

        var emission = mat.emission;

        if (typeof mat.color === "object") {
          if (Array.isArray(mat.color)) {
            var colorArr = mat.color;
            lightUniform.color.set([colorArr[0] * emission, colorArr[1] * emission, colorArr[2] * emission]);
          } else if (mat.color instanceof Color3) {
            lightUniform.color.set(mat.color.mul(emission));
          }
        } else {
          lightUniform.color.set([emission, emission, emission]);
        }
      }
    }
  },

  beginScene: function(scene) {
    "use strict";

    Tarumae.Shader.prototype.beginScene.call(this, scene);

    var gl = this.gl;
	
    // render matrix
    gl.uniformMatrix4fv(this.projectViewMatrixUniform, false, this.renderer.projectionViewMatrixArray);

    // lights
    this.pointLightCount = 0;
    this.spotLightCount = 0;

    if (scene.renderer.options.enableLighting) {
		
      if (this.renderer.debugger) {
        this.renderer.debugger.beforeSelectLightSource();
      }

      var _this = this;

      Tarumae.SceneObject.scanTransforms(scene, function(object) {
        if (object.visible === true) {
          if (typeof object.mat === "object" && object.mat !== null) {
            if (typeof object.mat.emission !== "undefined" && object.mat.emission > 0 && object.meshes.length <= 0) {
              _this.setShaderLightSource(object);
            }
          }
        }
      });

      if (this.renderer.debugger) {
        this.renderer.debugger.currentLightCount = this.pointLightCount + this.spotLightCount;
        this.renderer.debugger.afterSelectLightSource();
      }
    }
	
    this.pointLightCountUniform.set(this.pointLightCount);
    this.spotLightCountUniform.set(this.spotLightCount);

    // sun
    if (typeof scene.sun === "object" && scene.sun != null) {
      var sunloc = scene.sun.worldLocation;
      var sundir = Vec3.normalize(sunloc);
      this.sundirUniform.set(sundir);
		
      var mat = scene.sun.mat || null;
      var suncolor = (mat && mat.color) || this.defaultSunColor;

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
    }
    
    if (!shadowMapTextureUsed) {
      gl.activeTexture(gl.TEXTURE5);
      this.emptyTexture.use(scene.renderer);
      gl.uniform1i(this.hasShadowMapUniform, false);
    }
  },

  beginObject: function(obj) {
    Tarumae.Shader.prototype.beginObject.call(this, obj);

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
    var transparency = 0;
    var normalMipmap = 0;

    this.useTexture = null;
    this.useNormalmap = null;
	
    if (typeof mat === "object" && mat != null) {
      // texture
      if (typeof mat.tex === "object" && mat.tex instanceof Tarumae.Texture) {
        this.useTexture = mat.tex;
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

      // transparency
      if (typeof mat.transparency !== "undefined" && mat.transparency > 0) {
        transparency = mat.transparency;
      }

      // emission
      if (typeof mat.emission !== "undefined") {
        emission = mat.emission;
      }
		
      // normal-map
      if (typeof mat.normalmap === "object" && mat.normalmap instanceof Tarumae.Texture) {
        this.useNormalmap = mat.normalmap;

        if (typeof mat.normalMipmap !== "undefined") {
          normalMipmap = -Tarumae.MathFunctions.clamp(mat.normalMipmap, 0, 5) * 5;
        }
			
        if (typeof mat.normalIntensity !== "undefined") {
          normalIntensity = mat.normalIntensity;
        }
      }
    }

    // texture
    gl.activeTexture(gl.TEXTURE0);
    if (this.useTexture != null) {
      this.useTexture.use(this.renderer);
      gl.uniform1i(this.hasTextureUniform, true);
    } else {
      this.emptyTexture.use(this.renderer);
      gl.uniform1i(this.hasTextureUniform, false);
    }

    // normal-map	
    gl.activeTexture(gl.TEXTURE1);
    if (this.renderer.options.enableNormalMap && this.useNormalmap != null) {
      this.useNormalmap.use(this.renderer);
      gl.uniformMatrix3fv(this.modelMatrix3x3Uniform, false, new Tarumae.Matrix3(modelMatrix).toArray());
      gl.uniform1i(this.hasNormalMapUniform, true);

      this.normalMipmapUniform.set(normalMipmap);
      //this.normalIntensityUniform.set(normalIntensity);
    } else {
      this.emptyTexture.use(this.renderer);
      gl.uniform1i(this.hasNormalMapUniform, false);
    }

    this.colorUniform.set(color);
    this.roughnessUniform.set(roughness);

    // texture tiling
    if (texTiling != null) {
      this.texTilingUniform.set();
    } else {
      this.texTilingUniform.set(this.defaultTexTiling);
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
      this.opacityUniform.set(obj._opacity);
    } else {
      this.opacityUniform.set(1);
    }
  },

  beginMesh: function(mesh) {
    Tarumae.Shader.prototype.beginMesh.call(this, mesh);
	
    this.gl.uniform1i(this.hasUV2Uniform, mesh.meta && mesh.meta.uvCount && mesh.meta.uvCount > 1);
  },

  endObject: function(obj) {
    var gl = this.renderer.gl;

    // texture	
    if (this.useTexture != null) {
      gl.activeTexture(gl.TEXTURE0);
      this.useTexture.disuse();
    }

    // normal-map	
    if (this.useNormalmap != null) {
      gl.activeTexture(gl.TEXTURE3);
      this.useNormalmap.disuse();
    }

    Tarumae.Shader.prototype.endObject.call(this, obj);
  },

  endScene: function(scene) {
    // process goes before call endScene of prototype
	
    Tarumae.Shader.prototype.endScene.call(this, scene);
  }
});