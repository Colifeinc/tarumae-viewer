////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

attribute vec3 vertexPosition;
attribute vec2 vertexTexcoord;

uniform mat4 projectionMatrix;

varying vec2 texcoord;

void main(void) {
	gl_Position = projectionMatrix * vec4(vertexPosition, 1.0);
	
	texcoord = vertexTexcoord;
}
