
attribute vec3 vertexPosition;

uniform mat4 projectViewModelMatrix;

void main(void) {
	gl_Position = projectViewModelMatrix * vec4(vertexPosition, 1.0);
}