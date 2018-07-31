precision mediump float;

uniform float opacity;
uniform vec3 color;

void main(void) {
	gl_FragColor = vec4(color, opacity);
}
