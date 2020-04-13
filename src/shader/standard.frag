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
	float rg = 1.0 - roughness;

	for (int i = 0; i < MAX_LIGHT_COUNT; i++) {
		if (i >= lightCount) break;

		vec3 lightRay = lights[i].pos - vertex;
		vec3 lightNormal = normalize(lightRay);

		float ln = dot(lightNormal, vertexNormal);
		float ld = length(lightRay);
		float lda = pow(2.718282, -ld);
		diff += lights[i].color * max(ln * lda, 0.0) * rg;

		vec3 lightReflection = reflect(lightNormal, vertexNormal);
		float refd = max(dot(lightReflection, cameraNormal), 0.0);
		float sf = pow(refd, pow(glossy, -2.0)) * (1.0 / ld);
		specular += lights[i].color * sf * rg;
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

	vec3 refmapLookup = reflect(cameraNormal, vertexNormal);

	if (refMapType == 2) {
		refmapLookup = normalize(correctBoundingBoxIntersect(refMapBox, refmapLookup));
	}

if(glossy>0.0){
	vec3 refColor = textureCube(refMap, refmapLookup, roughness).rgb;
	float rg = glossy * (1.0 - roughness);
	refColor = clamp(pow(refColor, vec3(rg)) * glossy, 0.0, 1.0);
	finalColor = finalColor * (1.0 - glossy) + finalColor * refColor;
}

	//////////////// RefraMap ////////////////


	vec3 refraLookup = refract2(vec3(-cameraNormal.x, cameraNormal.y, cameraNormal.z), vertexNormal, 1.05);
	vec3 refraColor = textureCube(refMap, refraLookup, roughness).rgb;
	refraColor = clamp(pow(refraColor, vec3(refraction)), 0.0, 1.0);
	finalColor = finalColor * (1.0 - refraction) + finalColor * refraColor;


	//////////////// ShadowMap ////////////////

	if (receiveShadow) {
		if (shadowMapType == 1) {
			float shadowDir = dot(vertexNormal, normalize(vec3(2.0, 10.0, 5.0)));
			if (shadowDir > 0.0) {

				float shadowMapDepth;
				shadowMapDepth = decodeFloatRGBA(texture2D(shadowMap2D, shadowPosition.xy));

				float shadowBlock = 1.0 - smoothstep(0.00001, 0.05, (shadowPosition.z - shadowMapDepth)) / 0.5;
				finalColor = finalColor + finalColor * shadowBlock * 0.15;
			}
		} else if (shadowMapType == 2) {
			vec3 correctedVertexToSun = vec3(0.0);
			correctedVertexToSun = correctBoundingBoxIntersect(shadowMapBox, sundir);

			float shadowBlock = textureCube(shadowMap, correctedVertexToSun).r;
			shadowBlock *= max(dot(normal, sundir), 0.0);
			finalColor += vec3(1.0, 1.0, 0.9) * shadowBlock;
		}
	}

	gl_FragColor = vec4(finalColor, alpha);
	//  gl_FragColor.rgb *= gl_FragColor.a;
}