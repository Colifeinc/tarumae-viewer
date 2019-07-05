////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexTexcoord;

uniform mat4 projectViewMatrix, modelMatrix, normalMatrix;
uniform mat4 projectViewModelMatrix;
//uniform mat4 projectionMatrix;
//uniform vec3 directionalLightDir;
//uniform vec3 color;

//varying vec3 shadowPosition;
//varying vec3 position;
//varying vec3 normal;
varying vec2 texcoord;
//varying vec3 color;

void main(void) {
	vec4 vertexPos = modelMatrix * vec4(vertexPosition, 1.0);
	gl_Position = projectViewMatrix * vertexPos;

//	position = vertexPos.xyz;
//	vec4 pos = projectionMatrix * vertexPos;
//	shadowPosition = vec3(0.5, 0.5, 0.5) + (pos.xyz / pos.w) * 0.5;

//	vec3 normal = vec3(normalMatrix * vec4(vertexNormal, 0.0));

//	color = vec3(1.0, 1.0, 1.0) 
//	+ vec3(0.3, 0.3, 0.3) * max(dot(normal, normalize(vec3(-1.0, 1.0, 1.0))), 0.0)
//	+ vec3(0.5, 0.5, 0.5) * max(dot(normal, normalize(vec3(0.5, -1.0, 0.5))), 0.0)
//	+ vec3(0.5, 0.5, 0.35) * max(dot(normal, normalize(vec3(0.5, -1.0, 1.0))), 0.0)
//	+ vec3(0.6, 0.6, 0.2) * pow(max(dot(normal, directionalLightDir), 0.0), 40.0)
//	;

//	color *= matColor;

	texcoord = vertexTexcoord;
}