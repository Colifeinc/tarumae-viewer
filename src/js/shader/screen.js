
import Tarumae from "../entry";
import { Matrix4 } from "@jingwood/graphics-math";

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

		this.projectionMatrix = new Matrix4().ortho(-1, 1, -1, 1, -1, 1);
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