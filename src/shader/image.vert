
attribute vec3 vertexPosition;
attribute vec2 vertexTexcoord;
attribute vec3 vertexColor;

uniform mat4 projectionMatrix;

varying vec2 texcoord;

void main(void) {
	gl_Position = projectionMatrix * vec4(vertexPosition, 1.0);
	
	texcoord = vertexTexcoord;
}
