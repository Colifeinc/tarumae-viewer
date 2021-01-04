
import Tarumae from "../entry";
import { Vec3, Matrix4 } from "@jingwood/graphics-math";

Tarumae.Shaders.ShadowMapShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.vertexPositionAttribute = this.findAttribute('vertexPosition');
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");
    
    // skin
    this.vertexJointAttribute = this.findAttribute("a_joint");
    this.vertexWeightAttribute = this.findAttribute("a_weight");
    this.jointMatrixUniforms = this.bindUniformArray("u_jointMat", "mat4", 100);

		this.lightMatrix = new Matrix4();
		this.projectionMatrix = new Matrix4();
		
		const aspectRate = this.renderer.aspectRate;
		const scale = renderer.options.shadowQuality.scale || 5;
		const viewDepth = renderer.options.shadowQuality.viewDepth || 5;
		this.projectionMatrix.ortho(-aspectRate * scale, aspectRate * scale,
      -scale, scale, -viewDepth, viewDepth);
	}

	beginScene(scene) {
		this.lightPosition = scene.sun.location;
		this.lightMatrix.lookAt(this.lightPosition, Vec3.zero, Vec3.add(this.lightPosition, Vec3.forward));

    this.lightProjectionMatrix = this.lightMatrix.mul(this.projectionMatrix);
	}

	beginObject(obj) {
		super.beginObject(obj);
  
		const m = obj._transform.mul(this.lightProjectionMatrix);
    this.projectionMatrixUniform.set(m);
    
    this.maxJointCount = 2;
    
    // skin
    if (obj.skin) {
      if (this.maxJointCount < obj.skin.joints.length) {
        this.maxJointCount = obj.skin.joints.length;
      }

      if (obj.skin.inverseMatrices.length > 0) {
        for (let i = 0; i < obj.skin.joints.length; i++) {
          this.jointMatrixUniforms[i].set(obj.skin.inverseMatrices[i].mul(obj.skin.joints[i].jointMatrix));
        }
      } else {
        for (let i = 0; i < obj.skin.joints.length; i++) {
          this.jointMatrixUniforms[i].set(obj.skin.joints[i].jointMatrix);
        }
      }
    } else {
      for (let i = 0; i < this.maxJointCount; i++) {
        this.jointMatrixUniforms[i].set(Matrix4.IdentityArray);
      }
    }
  }

  beginMesh(mesh) {
    super.beginMesh(mesh);

    const gl = this.gl;
    
    // skin
    if (this.vertexJointAttribute >= 0) {
      if (mesh.jointBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meta.skinJointBufferId);
        gl.vertexAttribPointer(this.vertexJointAttribute, 4, gl.UNSIGNED_SHORT, false, mesh.meta.jointStride, 0);
        gl.enableVertexAttribArray(this.vertexJointAttribute);
      } else {
        gl.disableVertexAttribArray(this.vertexJointAttribute);
      }
    }
    if (this.vertexWeightAttribute >= 0) {
      if (mesh.jointWeightsBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.meta.skinJointWeightsBufferId);
        gl.vertexAttribPointer(this.vertexWeightAttribute, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertexWeightAttribute);
      } else {
        gl.disableVertexAttribArray(this.vertexWeightAttribute);
      }
    }
  }
  
  endObject(obj) {
    super.endObject(obj);

    // skin
    if (obj.skin) {
      for (let i = 0; i < this.maxJointCount; i++) {
        this.jointMatrixUniforms[i].set(Matrix4.IdentityArray);
      }
    }
  }
};
