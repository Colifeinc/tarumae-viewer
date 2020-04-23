////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;

struct BoundingBox {
	vec3 min;
	vec3 max;
	vec3 origin;
};

struct Light {
	vec3 pos;
	vec3 color;
};

uniform vec3 cameraLoc;
uniform vec3 sundir;
uniform vec3 sunlight;
uniform vec3 color;
uniform vec2 texTiling;
uniform float opacity;

uniform float glossy;
uniform float roughness;
uniform float emission;
uniform float refraction;
uniform float normalMipmap;
uniform float normalIntensity;

uniform bool receiveLight;
uniform bool hasNormalMap;
uniform bool receiveShadow;
uniform int refMapType;
uniform int shadowMapType;
uniform float shadowIntensity;

uniform sampler2D texture;
uniform sampler2D normalMap;
uniform sampler2D lightMap;
uniform sampler2D shadowMap2D;
uniform samplerCube refMap;
uniform samplerCube shadowMap;

varying vec3 vertex;
varying vec3 normal;
varying vec2 texcoord1;
varying vec2 texcoord2;
varying vec3 vcolor;
varying highp vec3 shadowPosition;
varying mat3 TBN;

#define MAX_LIGHT_COUNT 10
uniform int lightCount;
uniform Light lights[MAX_LIGHT_COUNT];

struct LightReturn {
	vec3 diff;
	vec3 spec;
};

uniform BoundingBox refMapBox;
uniform BoundingBox shadowMapBox;

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 rgb2hsv(vec3 c)
{
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 hsv2rgb(vec3 c)
{
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float cldec(float c) {

  if (c > 0.95) c = 0.95;
  // else if (c > 0.9) c = 0.9;
  else if (c > 0.8) c = 0.8;
	// else if (c > 0.7) c = 0.7;
	else if (c > 0.6) c = 0.6;
	// else if (c > 0.5) c = 0.5;
	else if (c > 0.4) c = 0.4;
	else if (c > 0.2) c = 0.2;
	else c = 0.1;

  return c;
}

vec3 cartoon(vec3 c) {
  // c = vec3(cldec(c.r), cldec(c.g), cldec(c.b));
  c = rgb2hsv(c);
  c = vec3(c.r, c.g, cldec(c.b)); 
  c = hsv2rgb(c);

  return c;
}

vec3 correctBoundingBoxIntersect(BoundingBox bbox, vec3 dir) {
	vec3 invdir = vec3(1.0, 1.0, 1.0) / dir;
	vec3 intersectMaxPointPlanes = (bbox.max - vertex) * invdir;
	vec3 intersectMinPointPlanes = (bbox.min - vertex) * invdir;
	vec3 largestRayParams = max(intersectMaxPointPlanes, intersectMinPointPlanes);
	float dist = min(min(largestRayParams.x, largestRayParams.y), largestRayParams.z);
	vec3 intersectPosition = vertex + dir * dist;
	return intersectPosition - bbox.origin;
}

float decodeFloatRGBA(vec4 rgba) {
  return dot(rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0));
}

vec3 traceLight(vec3 vertexNormal, vec3 cameraNormal) {

	vec3 diff = vec3(0.0);
	vec3 specular = vec3(0.0);

	for (int i = 0; i < MAX_LIGHT_COUNT; i++) {
		if (i >= lightCount) break;

		vec3 lightRay = lights[i].pos - vertex;
		vec3 lightNormal = normalize(lightRay);

		float ln = dot(lightNormal, vertexNormal);
		float ld = length(lightRay);
		float lda = pow(2.718282, -ld);
		diff += lights[i].color * max(ln * lda, 0.0);

		vec3 lightReflection = reflect(lightNormal, vertexNormal);
		float refd = max(dot(lightReflection, cameraNormal), 0.0);
		float sf = pow(refd, pow(glossy, -2.0)) * (1.0 / ld);
		specular += lights[i].color * sf * glossy;
	}

	return diff + specular;
}

vec3 refract2(vec3 d, vec3 normal, float r) {
	vec3 nl = dot(d, normal) < 0.0 ? normal : -normal;
	bool into = dot(nl, normal) > 0.0;
	if (into) r = 1.0 / r;
	
	float c = dot(d, nl);
	float t = 1.0 - r * r * (1.0 - c * c);
	
	if (t < 0.0) {
		return reflect(d, normal);
	}
	
	return normalize(d * r - normal * ((into ? 1.0 : -1.0) * (c * r + sqrt(t))));
}



void main(void) {

	if (emission > 0.0) {
		gl_FragColor = vec4(normalize(color) * 1.5, opacity);
		return;
	}

	vec2 uv1 = texcoord1 * texTiling;
	vec4 textureColor = texture2D(texture, uv1);

	float alpha = opacity * textureColor.a;
	if (alpha < 0.01){
		discard;
	}

	//////////////// NormalMap ////////////////

	vec3 vertexNormal = normal, normalmapValue = texture2D(normalMap, uv1, normalMipmap).rgb;

	if (hasNormalMap) {
		vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0) * vec3(normalIntensity, normalIntensity, 1.0));
	}

	vec3 cameraRay = vertex - cameraLoc;
	vec3 cameraNormal = normalize(cameraRay);
	vec3 finalColor = color * textureColor.rgb;

	//////////////// LightMap ////////////////

	vec3 lightmapColor = texture2D(lightMap, texcoord2).rgb;
	finalColor *= lightmapColor;

	//////////////// Lights ////////////////

	if (receiveLight) {
		if (lightCount > 0 || glossy > 0.0) {
			finalColor += traceLight(vertexNormal, cameraNormal);
		}

		float vtos = clamp(dot(vertexNormal, sundir), 0.0, 1.0);
		finalColor = finalColor * 0.8 + finalColor * (vtos * 0.2);
		finalColor *= sunlight;
	}

	//////////////// RefMap ////////////////
	float roughdelta = pow(roughness, 10.0);

	vec3 refmapLookup = reflect(cameraNormal, vertexNormal);

	if (refMapType == 2) {
		refmapLookup = normalize(correctBoundingBoxIntersect(refMapBox, refmapLookup));
	}

  if (glossy > 0.0) {
    vec3 refColor = textureCube(refMap, refmapLookup, roughdelta).rgb;
    // refColor = clamp(pow(refColor, vec3(pow(glossy, 1.0))), 0.0, 1.0);
		// float gdelta = pow(clamp(glossy, 0.0, 1.0), 2.0);
    finalColor = finalColor * (1.0 - glossy) + finalColor * refColor * glossy;
  }

	//////////////// RefraMap ////////////////

  if (refraction > 0.0) {
    vec3 refraLookup = refract2(vec3(-cameraNormal.x, cameraNormal.y, cameraNormal.z), vertexNormal, 1.05);
    vec3 refraColor = textureCube(refMap, refraLookup, roughdelta).rgb;
		// float rdelta = pow(clamp(refraction, 0.0, 1.0), 2.0);
    finalColor = finalColor * (1.0 - refraction) + finalColor * refraColor * refraction;
  }

	// //////////////// ShadowMap ////////////////

	if (receiveShadow) {
		if (shadowMapType == 1) {
			float shadowDir = dot(vertexNormal, normalize(vec3(2.0, 10.0, 5.0)));
			if (shadowDir > 0.0) {

				float shadowMapDepth;
				// shadowMapDepth = decodeFloatRGBA(texture2D(shadowMap2D, shadowPosition.xy));
				shadowMapDepth = texture2D(shadowMap2D, shadowPosition.xy).r;

				float shadowBlock = 1.0 - smoothstep(0.00001, 0.05, (shadowPosition.z - shadowMapDepth)) / 0.5;
				finalColor = finalColor + finalColor * shadowBlock * shadowIntensity;
			}
		} else if (shadowMapType == 2) {
			vec3 correctedVertexToSun = vec3(0.0);
			correctedVertexToSun = correctBoundingBoxIntersect(shadowMapBox, sundir);

			float shadowBlock = textureCube(shadowMap, correctedVertexToSun).r;
			shadowBlock *= max(dot(normal, sundir), 0.0);
			finalColor += vec3(1.0, 1.0, 0.9) * shadowBlock;
		}
	}

	finalColor = cartoon(finalColor);

	gl_FragColor = vec4(finalColor, alpha);
	//  gl_FragColor.rgb *= gl_FragColor.a;
}