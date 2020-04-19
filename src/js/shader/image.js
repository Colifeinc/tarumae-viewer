
import Tarumae from "../entry";
import { Matrix4 } from "@jingwood/graphics-math";

Tarumae.Shaders.ImageShader = class extends Tarumae.Shader {
	constructor(renderer, vertShaderSrc, fragShaderSrc) {
		super(renderer, vertShaderSrc, fragShaderSrc);

		this.use();

		this.vertexPositionAttribute = this.findAttribute("vertexPosition");
		this.vertexTexcoordAttribute = this.findAttribute("vertexTexcoord");
		this.projectionMatrixUniform = this.bindUniform("projectionMatrix", "mat4");

		this.texture1Uniform = this.bindUniform("tex1", "tex", 0);
		this.texture2Uniform = this.bindUniform("tex2", "tex", 1);

		this.colorUniform = this.bindUniform("color", "color3");
		this.alphaUniform = this.bindUniform("alpha", "float");
		this.resolutionUniform = this.bindUniform("resolution", "vec2");
		this.resStrideUniform = this.bindUniform("resStride", "vec2");
		this.filterTypeUniform = this.bindUniform("filterType", "int");
		this.tex2FilterTypeUniform = this.bindUniform("tex2FilterType", "int");
		this.tex2IntensityUniform = this.bindUniform("tex2Intensity", "float");
    
		this.samplingWeightUniform = this.bindUniform("samplingWeight", "float[]");
		// this.samplingWeightUniform.set([0.132572, 0.125472, 0.106373, 0.08078, 0.05495, 0.033482, 0.018275, 0.008934, 0.003912, 0.001535]);
		this.samplingWeightUniform.set([0.114357, 0.109813, 0.097238, 0.079397, 0.059781, 0.041506, 0.026573, 0.015687, 0.00854, 0.004287]);
		// this.samplingWeightUniform.set([0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216]);
		
		this.enableAntialiasUniform = this.bindUniform("enableAntialias", "bool");
		this.gammaFactorUniform = this.bindUniform("gammaFactor", "float");
		this.projectionMatrix = new Matrix4().ortho(-1, 1, -1, 1, -1, 1);

		this.resetParameters();
	}

	beginMesh(mesh) {
		super.beginMesh(mesh);

		this.projectionMatrixUniform.set(this.projectionMatrix);
		this.colorUniform.set(this.color);
		this.alphaUniform.set(this.alpha);

		this.resStride[0] = 1 / this.resolution[0];
		this.resStride[1] = 1 / this.resolution[1];
		this.resStrideUniform.set(this.resStride);
		this.resolutionUniform.set(this.resolution);

		this.enableAntialiasUniform.set(this.enableAntialias);
		this.gammaFactorUniform.set(this.gammaFactor);
		this.filterTypeUniform.set(this.filterType);
 
		if (this.texture) {
			this.texture1Uniform.set(this.texture);
		} else {
			this.texture1Uniform.set(Tarumae.Shader.emptyTexture);
		}

		if (this.tex2) {
			this.texture2Uniform.set(this.tex2);
      this.tex2FilterTypeUniform.set(this.tex2FilterType);
      this.tex2IntensityUniform.set(this.tex2Intensity);
		} else {
			this.texture2Uniform.set(Tarumae.Shader.emptyTexture);
			this.tex2FilterTypeUniform.set(0);
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

		this.texture1Uniform.unset();
		this.texture2Uniform.unset();

		super.endMesh(mesh);
	}

	resetParameters() {
		this.enableAntialias = false;
		this.gammaFactor = 1;
		this.color = [1, 1, 1];
		this.alpha = 1;
		this.tex2 = null;
		this.texture = undefined;
		this.resolution = [0, 0];
		this.resStride = [.001, .001];
    this.filterType = 0;
    this.tex2FilterType = 0;
    this.tex2Intensity = 1.0;
	}
};
