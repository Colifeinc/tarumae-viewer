////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;

uniform sampler2D texture;
uniform sampler2D tex2;

uniform bool hasTex2;
uniform vec2 tex2Resolution;

uniform float opacity;
uniform vec3 color;
uniform vec2 resolution;
uniform vec2 resStride;
uniform bool enableAntialias;
uniform float gammaFactor;
uniform bool isVertical;

varying vec2 texcoord;

vec4 sample(sampler2D tex) {
	return texture2D(tex, texcoord);
}

vec4 antialias(sampler2D tex) {
	return sample(tex);
}

// 0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216
uniform float samplingWeight[5];

vec4 blur5(sampler2D tex, vec2 uv) {
  vec4 color = texture2D(tex, uv) * samplingWeight[0];
  
	if (isVertical) {
		for (int i = 1; i < 5; i++) {
			color += texture2D(tex, uv + vec2(+resStride.x, 0)) * samplingWeight[i];
			color += texture2D(tex, uv + vec2(-resStride.x, 0)) * samplingWeight[i];
		}
	} else {
		for (int i = 1; i < 5; i++) {
			color += texture2D(tex, uv + vec2(0, +resStride.y)) * samplingWeight[i];
			color += texture2D(tex, uv + vec2(0, -resStride.y)) * samplingWeight[i];
		}
	}

  return color;
}

vec4 blur5(sampler2D tex) {
	return blur5(tex, texcoord);
}

vec4 guassBlur3(sampler2D tex, float distance) {
	vec2 uv = texcoord;
  vec4 color = vec4(0.0);
  float off1 = distance;
  float off2 = distance * 2.0;

  color += texture2D(tex, uv + vec2(-off2, -off2)) * 0.01;
	return color;
}

// 0.0625   0.125   0.0625   
// 0.125     0.25    0.125
// 0.0625   0.125   0.0625

vec4 guassBlur3(sampler2D tex) {
	vec2 uv = texcoord;
  vec4 color = vec4(0.0);
	float offx = resStride.x;
	float offy = resStride.y;

  color += texture2D(tex, uv + vec2(-offx, -offy)) * 0.0625;
  color += texture2D(tex, uv + vec2(0, -offy)) * 0.125;
  color += texture2D(tex, uv + vec2(offx, -offy)) * 0.0625;

  color += texture2D(tex, uv + vec2(-offx, 0)) * 0.125;
  color += texture2D(tex, uv + vec2(0, 0)) * 0.25;
  color += texture2D(tex, uv + vec2(offx, 0)) * 0.125;

  color += texture2D(tex, uv + vec2(-offx, offy)) * 0.0625;
  color += texture2D(tex, uv + vec2(0, offy)) * 0.125;
  color += texture2D(tex, uv + vec2(offx, offy)) * 0.0625;

	return color;
}

	// 0.00390625, 0.015625, 0.0234375, 0.015625, 0.00390625
	// 0.015625, 0.0625, 0.09375, 0.0625, 0.015625,
	// 0.0234375, 0.09375, 0.140625, 0.09375, 0.0234375,
	// 0.015625, 0.0625, 0.09375, 0.0625, 0.015625,
	// 0.00390625, 0.015625, 0.0234375, 0.015625, 0.00390625,

vec4 guassBlur5(sampler2D tex) {
	vec2 uv = texcoord;
  vec4 color = vec4(0.0);

  float offx1 = resStride.x;
  float offx2 = resStride.x * 2.0;
  float offy1 = resStride.y;
  float offy2 = resStride.y * 2.0;

  color += texture2D(tex, uv + vec2(-offx2, -offy2)) * 0.00390625;
  color += texture2D(tex, uv + vec2(-offx1, -offy2)) * 0.015625;
  color += texture2D(tex, uv + vec2(0, -offy2)) * 0.0234375;
  color += texture2D(tex, uv + vec2(offx1, -offy2)) * 0.015625;
  color += texture2D(tex, uv + vec2(offx2, -offy2)) * 0.00390625;

  color += texture2D(tex, uv + vec2(-offx2, -offy1)) * 0.015625;
  color += texture2D(tex, uv + vec2(-offx1, -offy1)) * 0.0625;
  color += texture2D(tex, uv + vec2(0, -offy1)) * 0.09375;
  color += texture2D(tex, uv + vec2(offx1, -offy1)) * 0.0625;
  color += texture2D(tex, uv + vec2(offx2, -offy1)) * 0.015625;

  color += texture2D(tex, uv + vec2(-offx2, 0)) * 0.0234375;
  color += texture2D(tex, uv + vec2(-offx1, 0)) * 0.09375;
  color += texture2D(tex, uv + vec2(0, 0)) * 0.140625;
  color += texture2D(tex, uv + vec2(offx1, 0)) * 0.09375;
  color += texture2D(tex, uv + vec2(offx2, 0)) * 0.0234375;

  color += texture2D(tex, uv + vec2(-offx2, offy1)) * 0.015625;
  color += texture2D(tex, uv + vec2(-offx1, offy1)) * 0.0625;
  color += texture2D(tex, uv + vec2(0, offy1)) * 0.09375;
  color += texture2D(tex, uv + vec2(offx1, offy1)) * 0.0625;
  color += texture2D(tex, uv + vec2(offx2, offy1)) * 0.015625;

  color += texture2D(tex, uv + vec2(-offx2, offy2)) * 0.00390625;
  color += texture2D(tex, uv + vec2(-offx1, offy2)) * 0.015625;
  color += texture2D(tex, uv + vec2(0, offy2)) * 0.0234375;
  color += texture2D(tex, uv + vec2(offx1, offy2)) * 0.015625;
  color += texture2D(tex, uv + vec2(offx2, offy2)) * 0.00390625;

	return color;
}

vec3 grayscale(vec3 rgb) {
  float gray = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
	return vec3(gray);
}

vec4 grayscale(vec4 rgba) {
	return vec4(grayscale(rgba.rgb), rgba.a);
}

vec3 gamma(vec3 c, float factor) {
	return pow(c, vec3(factor));
}

vec4 gamma(vec4 c, float factor) {
	return vec4(pow(c.rgb, vec3(factor)), c.a);
}

vec3 lighter(vec3 a, vec3 b, float factor) {
	vec3 d = clamp(b - a, 0.0, 1.0);
	return a + d * factor;
}

void main(void) {

	gl_FragColor = blur5(texture);

	// fc = gamma(fc, gammaFactor);

}
