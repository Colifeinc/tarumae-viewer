
precision mediump float;

uniform samplerCube texture;

varying vec3 texcoord;

void main(void) {

	vec3 color = textureCube(texture, texcoord).rgb;

	gl_FragColor = vec4(color, 1.0);
}