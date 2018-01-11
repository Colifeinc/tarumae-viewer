precision mediump float;

uniform sampler2D texture;
uniform vec3 color;
uniform float opacity;

varying vec2 texcoord;

void main(void) {
	vec4 texcolor = texture2D(texture, texcoord);

	float alpha = opacity * texcolor.a;

	if (alpha < 0.5) {
		discard;
	}

	gl_FragColor = vec4(color * texcolor.rgb, alpha);
}