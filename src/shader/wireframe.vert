
attribute vec3 vertexPosition;
attribute vec3 vertexColor;

uniform mat4 projectViewModelMatrix;

void main(void) {
	vec4 pos = vec4(vertexPosition, 1.0);
	gl_Position = projectViewModelMatrix * pos;
}
