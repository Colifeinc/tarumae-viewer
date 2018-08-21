precision mediump float;

uniform sampler2D texture;
uniform sampler2D tex2;

uniform bool hasTex2;

uniform float opacity;
uniform vec3 color;
uniform vec2 resolution;
uniform vec2 aaOffset1;
uniform vec2 aaOffset2;
uniform bool enableAntialias;
uniform float gammaFactor;

varying vec2 texcoord;

vec4 sample(sampler2D tex) {
	return texture2D(tex, texcoord);
}

vec4 antialias(sampler2D tex) {
	float px = texcoord.x, py = texcoord.y;

	vec4 c1 = texture2D(tex, texcoord);
	vec4 c2 = texture2D(tex, vec2(px, py + aaOffset1.y));
	vec4 c3 = texture2D(tex, vec2(px + aaOffset1.x, py));
	vec4 c4 = texture2D(tex, texcoord + aaOffset1);

	return (c1 + c2 + c3 + c4) * 0.25;
}

vec4 antialias2xSample(sampler2D tex) {
	vec4 c1 = texture2D(tex, texcoord - aaOffset1);
	vec4 c2 = texture2D(tex, texcoord + aaOffset1);
	return (c1 + c2) * 0.5;
}

vec4 antialias4xSample(sampler2D tex) {
	vec4 c1 = texture2D(tex, texcoord - aaOffset1);
	vec4 c2 = texture2D(tex, texcoord + aaOffset1);
	vec4 c3 = texture2D(tex, texcoord - aaOffset2);
	vec4 c4 = texture2D(tex, texcoord + aaOffset2);
	return (c1 + c2 + c3 + c4) * 0.25;
}

vec4 antialias8xSample(sampler2D tex) {
	vec4 c1 = texture2D(tex, texcoord - aaOffset1);
	vec4 c2 = texture2D(tex, texcoord + aaOffset1);
	vec4 c3 = texture2D(tex, texcoord - aaOffset2);
	vec4 c4 = texture2D(tex, texcoord + aaOffset2);
	vec4 c5 = texture2D(tex, texcoord - aaOffset1 * 2.0);
	vec4 c6 = texture2D(tex, texcoord + aaOffset1 * 2.0);
	vec4 c7 = texture2D(tex, texcoord - aaOffset2 * 2.0);
	vec4 c8 = texture2D(tex, texcoord + aaOffset2 * 2.0);
	return (c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8) * 0.125;
}

vec4 blur5(sampler2D tex, vec2 uv, vec2 distance) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * distance;
  color += texture2D(tex, uv) * 0.29411764705882354;
  color += texture2D(tex, uv + (off1 / resolution / distance)) * 0.35294117647058826;
  color += texture2D(tex, uv - (off1 / resolution / distance)) * 0.35294117647058826;
  return color;
}

vec4 blur5(sampler2D tex) {
	return blur5(tex, texcoord, vec2(1.0));
}

vec4 blur9(sampler2D tex, vec2 uv, vec2 distance) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * distance;
  vec2 off2 = vec2(3.2307692308) * distance;
  color += texture2D(tex, uv) * 0.2270270270;
  color += texture2D(tex, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(tex, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(tex, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(tex, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

vec4 blur9(sampler2D tex) {
	return blur9(tex, texcoord, vec2(1.0));
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

	vec4 fc = blur5(texture);

	fc = gamma(fc, gammaFactor);

	vec3 t2c = blur5(tex2, texcoord, vec2(0.1)).rgb;

	if (hasTex2) {
		fc = vec4(lighter(fc.rgb, t2c, 0.2), fc.a);
	}

	gl_FragColor = fc;
}
