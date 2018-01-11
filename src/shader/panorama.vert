
attribute vec3 vertexPosition;

uniform mat4 projectViewModelMatrix;

varying vec3 texcoord;

void main(void) {
	texcoord = vertexPosition;
	texcoord.x = -texcoord.x;

	gl_Position = (projectViewModelMatrix * vec4(vertexPosition, 1.0)).xyww;
}