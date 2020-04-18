////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;

uniform sampler2D texture;
uniform sampler2D tex2;

uniform vec3 color;
uniform float alpha;
uniform vec2 resolution;
uniform vec2 resStride;
uniform float gammaFactor;
uniform int filterType;
uniform bool enableAntialias;
uniform bool hasTex2;

#define BLUR_SAMPLINGS 10
uniform float samplingWeight[BLUR_SAMPLINGS];

varying vec2 texcoord;

vec4 sample(sampler2D tex) {
	return texture2D(tex, texcoord);
}

vec4 sample(sampler2D tex, vec2 uv) {
	return texture2D(tex, uv);
}

vec4 sample(vec2 uv) {
	return texture2D(texture, uv);
}

vec4 sample() {
  return texture2D(texture, texcoord);
}

vec4 antialias(sampler2D tex) {
	return sample(tex);
}

vec4 antialiasCross(sampler2D tex) {
  vec2 uv = texcoord;

  vec4 c1 = sample(uv - vec2(resStride.x * 0.6, resStride.y * 0.4));
  vec4 c2 = sample(uv - vec2(resStride.x * 0.4, resStride.y * 0.6));
  vec4 c3 = sample(uv + vec2(resStride.x * 0.6, resStride.y * 0.4));
  vec4 c4 = sample(uv + vec2(resStride.x * 0.4, resStride.y * 0.6));

  return (c1 + c2 + c3 + c4) * 0.25;
}

vec4 guassblur_h(sampler2D tex) {
  vec4 color = texture2D(tex, texcoord) * samplingWeight[0];
  
  for (int i = 1; i < BLUR_SAMPLINGS; i++) {
    color += texture2D(tex, texcoord + vec2(resStride.x * float(i), 0)) * samplingWeight[i];
    color += texture2D(tex, texcoord - vec2(resStride.x * float(i), 0)) * samplingWeight[i];
  }

  return color;
}

vec4 guassblur_v(sampler2D tex) {
  vec4 color = texture2D(tex, texcoord) * samplingWeight[0];

  for (int i = 1; i < BLUR_SAMPLINGS; i++) {
    color += texture2D(tex, texcoord + vec2(0, resStride.y * float(i))) * samplingWeight[i];
    color += texture2D(tex, texcoord - vec2(0, resStride.y * float(i))) * samplingWeight[i];
  }

  return color;
}

vec3 light_pass(vec3 color) {
  float b = dot(color, vec3(0.3, 0.7152, 0.0722));
  return (b > 0.7) ? color : vec3(0.0);
}

vec4 light_pass(vec4 color) {
  float b = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  return (b > 0.7) ? color : vec4(0.0, 0.0, 0.0, 1.0);
}

// 0.0625   0.125   0.0625   
// 0.125     0.25    0.125
// 0.0625   0.125   0.0625

vec4 blur3(sampler2D tex) {
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

vec4 blur5(sampler2D tex) {
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

vec4 interp(sampler2D tex) {
  vec2 uv = texcoord;

  vec4 c1 = sample(uv);
  vec4 c2 = sample(uv + vec2(0, resStride.y));
  vec4 c3 = sample(uv + vec2(resStride.x, 0));
  vec4 c4 = sample(uv + resStride);

  return (c1 + c2 + c3 + c4) * 0.25;

  // vec2 r = (texcoord * resizeScale) - p;
  // vec4 d = c1 * (1.0 - r.x) + c3 * r.x;
  // vec4 e = c2 * (1.0 - r.x) + c4 * r.x;
  // vec4 f = d * (1.0 - r.y) + e * r.y;
  
  // return f;
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

vec3 add(vec3 a, vec3 b, float factor) {
  return a + b * factor;
}

vec3 sub(vec3 a, vec3 b, float factor) {
  return a - b * factor;
}

vec3 lighter(vec3 a, vec3 b, float factor) {
	vec3 d = max(b - a, 0.0);
	return a + d * factor;
}

vec3 lighter2(vec3 a, vec3 b, float factor) {
	vec3 d = clamp(b - a, 0.0, 1.0);
	return a + pow(d, vec3(2.0)) * factor;
}

void main(void) {

	vec4 fc = vec4(0);
  
  if (filterType == 0) {
    fc = sample(texture);
  } else if (filterType == 1) /* linear-interp */ {
    fc = interp(texture);
  } else if (filterType == 2) /* guassblur-h */ {
    fc = guassblur_h(texture);
  } else if (filterType == 3) /* guassblur-v */ {
    fc = guassblur_v(texture);
  } else if (filterType == 4) /* light-pass */ {
    fc = light_pass(sample(texture));
    // fc = sample(texture);
  } else if (filterType == 5) /* blur3 */ {
    fc = blur3(texture);
  } else if (filterType == 6) /* blur5 */ {
    fc = blur5(texture);
  } else if (filterType == 7) /* antialias-smple */ {
    fc = antialias(texture);
  } else if (filterType == 8) /* antialias-cross */ {
    fc = antialiasCross(texture);
  }

	vec3 t2c = vec3(0);
	
	if (hasTex2) {
		t2c = sample(tex2).rgb;
		fc.rgb = lighter(fc.rgb, t2c.rgb, 1.0);;
	}

  fc.rgb = gamma(fc.rgb, gammaFactor);
  fc.a = alpha;

	gl_FragColor = fc;
}
