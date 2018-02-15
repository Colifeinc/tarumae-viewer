attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexcoord;
attribute vec2 vertexTexcoord2;
attribute vec3 vertexTangent;
attribute vec3 vertexBitangent;
attribute vec3 vertexColor;

uniform mat4 projectViewMatrix;
uniform mat4 modelMatrix;
uniform mat3 modelMatrix3x3;
uniform mat4 normalMatrix;

uniform bool hasNormalMap;
uniform bool hasVColor;

varying vec3 vertex;
varying vec3 normal;
varying vec2 texcoord1;
varying vec2 texcoord2;
varying vec3 vcolor;
varying mat3 TBN;

void main(void) {
	vec4 pos = vec4(vertexPosition, 1.0);
	vec4 transformPos = modelMatrix * pos;

	gl_Position = projectViewMatrix * transformPos;
	
	vertex = transformPos.xyz;
	normal = normalize((normalMatrix * vec4(vertexNormal, 0.0)).xyz);
	vcolor = vertexColor;
	
	texcoord1 = vertexTexcoord;
	texcoord2 = vertexTexcoord2;

	if (hasNormalMap) {
		TBN = modelMatrix3x3 * mat3(vertexTangent, vertexBitangent, vertexNormal);
	}
}