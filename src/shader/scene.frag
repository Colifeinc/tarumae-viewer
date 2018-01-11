
precision highp float;

//uniform sampler2D samplerShadowMap;

uniform sampler2D texture;
uniform sampler2D lightMap;
uniform sampler2D reflectionMap;

uniform int enableShadow;
uniform int hasTexture;
uniform int hasLightMap;
uniform int hasReflectionMap;
uniform float opacity; 

uniform vec2 texTiling;
uniform vec3 color;

//varying vec3 shadowPosition;
//varying vec3 position;
//varying vec3 normal;
varying vec2 texcoord;
//varying vec3 color;

void main(void) {

	float shadowMapDepth = texture2D(samplerShadowMap, shadowPosition.xy).r;
	float shadowBlock = 1.0 - (smoothstep(0.002, 0.003, shadowPosition.z - shadowMapDepth) * 0.4);

	vec3 c = color;

	if (hasTexture == 1) {
		c *= texture2D(texture, texcoord * texTiling).rgb;
	} 

	if (hasLightMap == 1) {
		c *= texture2D(lightMap, texcoord).rgb;
	}

	c *= shadowBlock;

	gl_FragColor = vec4(c, opacity);
	
}