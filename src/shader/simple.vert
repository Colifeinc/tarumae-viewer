
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexcoord;

uniform mat4 projectViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

uniform vec3 sundir;
uniform vec3 sunlight;
uniform vec3 color;

varying vec3 vertex;
varying vec3 normal;
varying vec2 texcoord;
varying vec3 lightcolor;

void main(void) {
	vec4 pos = vec4(vertexPosition, 1.0);
	vec4 transformPos = modelMatrix * pos;

	gl_Position = projectViewMatrix * transformPos;
	
	vertex = transformPos.xyz;
	normal = normalize((normalMatrix * vec4(vertexNormal, 0.0)).xyz);
	texcoord = vertexTexcoord;

	lightcolor = color + sunlight * max(dot(sundir, normal), 0.15);
}
