precision mediump float;

uniform sampler2D texture;
uniform vec2 texTiling;
uniform float opacity;

varying vec3 vertex;
varying vec3 normal;
varying vec2 texcoord;
varying vec3 lightcolor;

void main(void) {
	vec4 texcolor = texture2D(texture, texcoord * texTiling);

	vec3 finalColor = lightcolor * texcolor.rgb;

	gl_FragColor = vec4(finalColor, opacity * texcolor.a);
}
