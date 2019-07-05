////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

attribute vec3 vertexPosition;
uniform mat4 projectionMatrix;

varying highp float depth;

void main(void) {
    vec4 position = projectionMatrix * vec4(vertexPosition, 1.0);

    depth = 0.5 + (position.z / position.w) * 0.5;

    gl_Position = position;
}
