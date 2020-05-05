////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision highp float;

varying vec3 value;

void main(void) {
  gl_FragColor = vec4(value, 1.0);
}