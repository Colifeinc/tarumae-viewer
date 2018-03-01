
attribute vec3 vertexPosition;
attribute vec3 vertexColor;
attribute float vertexSize;

uniform mat4 projectViewModelMatrix;
uniform float defaultPointSize;

varying vec4 color;

void main(void) {
	gl_Position = projectViewModelMatrix * vec4(vertexPosition, 1.0);
	gl_PointSize = vertexSize;

	color = vec4(vertexColor, 1.0);
}