////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

varying highp vec3 value;
uniform int type;

void main(void) {
  vec4 position = projectionMatrix * vec4(vertexPosition, 1.0);

  // depth = 0.5 + (position.z / position.w) * 0.5;

  if (type == 0) {
    value = vec3(1.0 - position.z / 10.0);
  } else if (type == 1) {
    // value = normalize((normalMatrix * vec4(vertexNormal, 0.0))).xyz;
    value = vertexNormal;
  }
  
  gl_Position = position;
}
