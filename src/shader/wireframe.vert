////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

attribute vec3 vertexPosition;
attribute vec3 vertexColor;

uniform mat4 projectViewModelMatrix;

void main(void) {
	vec4 pos = vec4(vertexPosition, 1.0);
	gl_Position = projectViewModelMatrix * pos;
}
