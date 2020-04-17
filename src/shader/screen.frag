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

uniform vec3 color;
uniform vec2 resolution;
uniform vec2 resStride;
uniform bool enableAntialias;
uniform float alpha;
uniform float gammaFactor;

#define BLUR_SAMPLINGS 10
uniform float samplingWeight[BLUR_SAMPLINGS];

varying vec2 texcoord;

vec4 blur5(sampler2D tex, vec2 uv);

vec4 sample(sampler2D tex) {
	return texture2D(tex, texcoord);
}

vec4 sample(vec2 uv) {
	return texture2D(texture, uv);
}

vec4 sample() {
  return texture2D(texture, texcoord);
}

vec4 antialias(sampler2D tex) {
  vec2 uv = texcoord;

  vec4 c1 = sample(uv);
  vec4 c2 = sample(uv + vec2(0, resStride.y));
  vec4 c3 = sample(uv + vec2(resStride.x, 0));
  vec4 c4 = sample(uv + resStride);

  return (c1 + c2 + c3 + c4) * 0.25;
}

vec4 antialiasCross(sampler2D tex) {
  vec2 uv = texcoord;

  vec4 c1 = sample(uv - vec2(resStride.x * 0.6, resStride.y * 0.4));
  vec4 c2 = sample(uv - vec2(resStride.x * 0.4, resStride.y * 0.6));
  vec4 c3 = sample(uv + vec2(resStride.x * 0.6, resStride.y * 0.4));
  vec4 c4 = sample(uv + vec2(resStride.x * 0.4, resStride.y * 0.6));

  return (c1 + c2 + c3 + c4) * 0.25;
}

vec4 antialias100(sampler2D tex) {
  vec4 c = vec4(0);

  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      c += texture2D(tex, texcoord +
        vec2(resStride.x * float(x), resStride.y * float(y)));
    }
  }

  return c /= 25.0;
}

// 0.0625   0.125   0.0625   
// 0.125     0.25    0.125
// 0.0625   0.125   0.0625

// 0.024879	0.107973	0.024879
// 0.107973	0.468592	0.107973
// 0.024879	0.107973	0.024879

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

// 0.008173	0.021861	0.030337	0.021861	0.008173
// 0.021861	0.058473	0.081144	0.058473	0.021861
// 0.030337	0.081144	0.112606	0.081144	0.030337
// 0.021861	0.058473	0.081144	0.058473	0.021861
// 0.008173	0.021861	0.030337	0.021861	0.008173,

vec4 guassBlur5(sampler2D tex) {
	vec2 uv = texcoord;
  vec4 color = vec4(0.0);

  float offx1 = resStride.x;
  float offx2 = resStride.x * 2.0;
  float offy1 = resStride.y;
  float offy2 = resStride.y * 2.0;

  color += texture2D(tex, uv + vec2(-offx2, -offy2)) * 0.008173;
  color += texture2D(tex, uv + vec2(-offx1, -offy2)) * 0.021861;
  color += texture2D(tex, uv + vec2(0, -offy2)) * 0.030337;
  color += texture2D(tex, uv + vec2(offx1, -offy2)) * 0.021861;
  color += texture2D(tex, uv + vec2(offx2, -offy2)) * 0.00390625;

  color += texture2D(tex, uv + vec2(-offx2, -offy1)) * 0.021861;
  color += texture2D(tex, uv + vec2(-offx1, -offy1)) * 0.058473;
  color += texture2D(tex, uv + vec2(0, -offy1)) * 0.081144;
  color += texture2D(tex, uv + vec2(offx1, -offy1)) * 0.058473;
  color += texture2D(tex, uv + vec2(offx2, -offy1)) * 0.021861;

  color += texture2D(tex, uv + vec2(-offx2, 0)) * 0.030337;
  color += texture2D(tex, uv + vec2(-offx1, 0)) * 0.081144;
  color += texture2D(tex, uv + vec2(0, 0)) * 0.112606;
  color += texture2D(tex, uv + vec2(offx1, 0)) * 0.081144;
  color += texture2D(tex, uv + vec2(offx2, 0)) * 0.030337;

  color += texture2D(tex, uv + vec2(-offx2, offy1)) * 0.021861;
  color += texture2D(tex, uv + vec2(-offx1, offy1)) * 0.058473;
  color += texture2D(tex, uv + vec2(0, offy1)) * 0.081144;
  color += texture2D(tex, uv + vec2(offx1, offy1)) * 0.058473;
  color += texture2D(tex, uv + vec2(offx2, offy1)) * 0.021861;

  color += texture2D(tex, uv + vec2(-offx2, offy2)) * 0.008173;
  color += texture2D(tex, uv + vec2(-offx1, offy2)) * 0.021861;
  color += texture2D(tex, uv + vec2(0, offy2)) * 0.030337;
  color += texture2D(tex, uv + vec2(offx1, offy2)) * 0.021861;
  color += texture2D(tex, uv + vec2(offx2, offy2)) * 0.008173;

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

vec3 lighter(vec3 a, vec3 b, float factor) {
	vec3 d = clamp(b - a, 0.0, 1.0);
	return a + d * factor;
}

vec3 lighter2(vec3 a, vec3 b, float factor) {
	vec3 d = clamp(b - a, 0.0, 1.0);
  float n = dot(b, vec3(0.299, 0.587, 0.114));
  n = smoothstep(0.5, 1.0, n);
	return a + d * n * factor;
}

void main(void) {

	vec4 fc;
	
	if (enableAntialias) {
		fc = antialiasCross(texture);
	} else {
		fc = sample(texture);
	}

	vec3 t2c = vec3(0);
	
	if (hasTex2) {
		t2c = sample(tex2).rgb;
		t2c = lighter(fc.rgb, t2c, 1.0);
		fc.rgb = t2c.rgb;
	}

	fc.rgb = gamma(fc.rgb, gammaFactor);
  fc.a = alpha;

	gl_FragColor = fc;
}
