////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;

uniform samplerCube texture;

varying vec3 texcoord;

void main(void) {

	vec3 color = textureCube(texture, texcoord).rgb;

	gl_FragColor = vec4(color, 1.0);
}