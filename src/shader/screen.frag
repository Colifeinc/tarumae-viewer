precision mediump float;

uniform sampler2D texture;
uniform float opacity;
uniform vec3 color;

varying vec2 texcoord;

float grayscale(vec3 rgb) {
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

vec3 antialias(vec3 c) {
	vec2 th1 = vec2(0.0005, 0.0002);
	vec2 th2 = vec2(-0.0002, 0.0005);
	vec3 c1 = texture2D(texture, texcoord - th1).rgb;
	vec3 c2 = texture2D(texture, texcoord + th1).rgb;
	vec3 c3 = texture2D(texture, texcoord - th2).rgb;
	vec3 c4 = texture2D(texture, texcoord + th2).rgb;
	//vec3 co = texture2D(texture, texcoord).rgb;
	return (c1 + c2 + c3 + c4) * 0.25;// * 0.7 + co * 0.3;
}

void main(void) {
	vec3 finalColor = color * texture2D(texture, texcoord).rgb;
	
	
	finalColor = antialias(finalColor);


	gl_FragColor = vec4(finalColor, opacity);
}
