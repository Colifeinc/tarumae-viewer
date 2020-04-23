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

uniform bool enableAntialias;
uniform bool hasTex2;


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

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 rgb2hsv(vec3 c)
{
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 hsv2rgb(vec3 c)
{
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float cldec(float c) {

  if (c > 0.95) c = 0.95;
  // else if (c > 0.9) c = 0.9;
  else if (c > 0.8) c = 0.8;
	// else if (c > 0.7) c = 0.7;
	else if (c > 0.6) c = 0.6;
	// else if (c > 0.5) c = 0.5;
	else if (c > 0.4) c = 0.4;
	else if (c > 0.25) c = 0.25;
	else c = 0.1;

  return c;
}

vec3 cartoon() {
  vec3 c = guassBlur3(texture).rgb;
  // c = vec3(cldec(c.r), cldec(c.g), cldec(c.b));
  c = rgb2hsv(c);
  c = vec3(cldec(c.r), c.g, cldec(c.b));
  
  c = hsv2rgb(c);

  return c;
}


vec4 edgeDetect() {
  // return sample(texture);

  vec2 uv = texcoord;
  float color = 0.0;
	float offx = resStride.x;
	float offy = resStride.y;

  const int range = 2;

  vec3 o = texture2D(texture, uv).xyz;

  for (int y = 0; y < range; y++) {
    for (int x = 0; x < range; x++) {
      vec3 t1 = texture2D(texture, uv + vec2(-offx * float(x), -offy * float(y))).xyz;
      vec3 t2 = texture2D(texture, uv + vec2(offx * float(x), offy * float(y))).xyz;

      color += dot(o, t1) - dot(o, t2);
      // color += max(dot(o, t3) - dot(o, t4), -0.5);
      // color += max(1.0 / max(dot(o, t1),0.0) - 1.0 / max(dot(o, t2),0.0), 0.0);
    }
  }

  color = clamp(color, 0.0, 1.0);
  return vec4(vec3(color), 1.0);
}


void main(void) {

	vec4 fc;
	
	if (enableAntialias) {
		fc = antialiasCross(texture);
	} else {
		fc = sample(texture);
	}

  // fc.rgb = corton();
  fc += edgeDetect() * 0.3;

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
