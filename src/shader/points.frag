////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;

varying vec4 color;

void main(void) {

	// float r = 0.0, delta = 0.0;
  
	// vec2 cxy = 2.0 * gl_PointCoord - 1.0;
	// r = dot(cxy, cxy);
	// if (r > 1.0) { discard; }

	gl_FragColor = color;
}