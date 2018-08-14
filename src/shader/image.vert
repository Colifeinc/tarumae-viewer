
attribute vec3 vertexPosition;
attribute vec2 vertexTexcoord;
attribute vec3 vertexColor;

uniform mat4 projectionMatrix;
uniform bool isFlipY;

varying vec2 texcoord;

void main(void) {
	gl_Position = projectionMatrix * vec4(vertexPosition, 1.0);
	
	texcoord = vertexTexcoord;
	if (isFlipY) texcoord.y = 1.0 - texcoord.y;
}
