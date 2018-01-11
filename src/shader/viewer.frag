
precision highp float;

uniform sampler2D texture;
uniform sampler2D lightMap;
uniform sampler2D reflectionMap;

uniform bool hasTexture;
uniform bool hasLightMap;
uniform bool hasReflectionMap;
uniform float opacity;

uniform vec2 texTiling;
uniform vec3 color;

varying vec2 texcoord;

void main(void) {
	vec3 c = color;

	if (hasTexture) {
		c *= texture2D(texture, texcoord * texTiling).rgb;
	}

	if (hasLightMap) {
		c *= texture2D(lightMap, texcoord).rgb;
	}

	gl_FragColor = vec4(c, opacity);
}