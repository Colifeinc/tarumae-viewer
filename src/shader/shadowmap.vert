////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision highp float;

attribute vec3 vertexPosition;
attribute vec4 a_joint;
attribute vec4 a_weight;

uniform mat4 projectionMatrix;
uniform mat4 u_jointMat[100];

varying float depth;

void main(void) {
    mat4 skinMat =
        a_weight.x * u_jointMat[int(a_joint.x)] +
        a_weight.y * u_jointMat[int(a_joint.y)] +
        a_weight.z * u_jointMat[int(a_joint.z)] +
        a_weight.w * u_jointMat[int(a_joint.w)];

	vec4 position =  projectionMatrix * skinMat * vec4(vertexPosition, 1.0);
  
  depth = 0.5 + (position.z / position.w) * 0.5;
  
  gl_Position = position;
}
