precision mediump float;

uniform sampler2D texture;
uniform float opacity;
uniform vec3 color;
uniform vec2 resolution;
uniform vec2 aaOffset1;
uniform vec2 aaOffset2;
uniform bool enableAntialias;
uniform float gammaFactor;

varying vec2 texcoord;

vec4 sample() {
	return texture2D(texture, texcoord);
}

vec3 grayscale(vec3 rgb) {
  float gray = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
	return vec3(gray);
}

vec4 grayscale(vec4 rgba) {
	return vec4(grayscale(rgba.rgb), rgba.a);
}

vec4 antialias2xSample() {
	vec4 c1 = texture2D(texture, texcoord - aaOffset1);
	vec4 c2 = texture2D(texture, texcoord + aaOffset1);
	return (c1 + c2) * 0.5;
}

vec4 antialias4xSample() {
	vec4 c1 = texture2D(texture, texcoord - aaOffset1);
	vec4 c2 = texture2D(texture, texcoord + aaOffset1);
	vec4 c3 = texture2D(texture, texcoord - aaOffset2);
	vec4 c4 = texture2D(texture, texcoord + aaOffset2);
	return (c1 + c2 + c3 + c4) * 0.25;
}

vec3 gamma(vec3 c, float factor) {
	return pow(c, vec3(factor));
}

vec4 gamma(vec4 c, float factor) {
	return vec4(pow(c.rgb, vec3(factor)), c.a);
}

void main(void) {	
	vec4 finalColor = vec4(color, opacity);
	
	if (enableAntialias) {
		finalColor *= antialias4xSample();
	} else {
		finalColor *= sample();
	}

	if (gammaFactor != 1.0) {
		finalColor = gamma(finalColor, gammaFactor);
	}

	gl_FragColor = finalColor;
}
