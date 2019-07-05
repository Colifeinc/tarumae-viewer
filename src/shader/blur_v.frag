////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;

uniform sampler2D texture;
uniform vec3 color;
uniform float opacity;

varying vec2 texcoord;

void main(void) {
	vec4 texcolor;
	
	const float off = 0.01;

	texcolor += texture2D(texture, texcoord + vec2(0, -off)) * 0.2;
	texcolor += texture2D(texture, texcoord) * 0.6;
	texcolor += texture2D(texture, texcoord + vec2(0, off)) * 0.2;

	texcolor /= 3.0;

	float alpha = opacity * texcolor.a;

	gl_FragColor = vec4(color * texcolor.rgb, 1.0);
}