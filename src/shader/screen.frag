precision mediump float;

uniform sampler2D texture;
uniform sampler2D tex2;

uniform bool hasTex2;

uniform float opacity;
uniform vec3 color;
uniform vec2 resolution;
uniform vec2 resStride;
uniform bool enableAntialias;
uniform float gammaFactor;

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

vec4 interp(sampler2D tex) {
  vec2 uv = texcoord;

  vec4 c1 = sample(uv);
  vec4 c2 = sample(uv + vec2(0, resStride.y));
  vec4 c3 = sample(uv + vec2(resStride.x, 0));
  vec4 c4 = sample(uv + resStride);

  return (c1 + c2 + c3 + c4) * 0.25;
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
	// vec3 d = smoothstep(0.0, 0.8, b - a);
	// vec3 d = smoothstep(0.5, 1.0, b - a);
	return a + d * factor;
}

vec3 lighter2(vec3 a, vec3 b, float factor) {
	vec3 diff = b - a;
	float l = length(diff);
	if (l > 0.0) {
		return a + vec3(0.0, l, 0.0);
	}
	return a;
}

void main(void) {

	vec4 fc = sample(texture);
	// vec4 fc = guassBlur3(texture);
	// vec4 fc = guassBlur(texture, 0.0007);

	fc = gamma(fc, gammaFactor);

	vec3 t2c = vec3(0);
	
	if (hasTex2) {
		t2c = sample(tex2).rgb;
		t2c = lighter(fc.rgb, t2c, 0.8);
		// t2c = clamp(t2c, 0.0, 1.0);
		
		fc = vec4(t2c.rgb, fc.a);
		// fc = vec4(lighter2(fc.rgb, t2c, 0.2), fc.a);
	}

	gl_FragColor = fc;
}
