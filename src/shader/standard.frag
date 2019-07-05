////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;
precision highp float;

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

#define MAX_LIGHT_COUNT 5
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

	for (int i = 0; i < MAX_LIGHT_COUNT; i++) {
		if (i >= lightCount) break;

		vec3 lightRay = lights[i].pos - vertex;
		vec3 lightNormal = normalize(lightRay);

		float ln = dot(lightNormal, vertexNormal);
		float ld = pow(length(lightRay), -2.0);

		diff += lights[i].color * smoothstep(0.0, 1.0, ln * ld);

		vec3 lightReflection = reflect(lightNormal, vertexNormal);
		float refd = dot(lightReflection, cameraNormal);

		specular += lights[i].color * smoothstep(0.0, 1.0, pow(refd, glossy) * glossy);
	}

	return diff + specular;
}

void main(void) {

	if (emission > 0.0) {
		gl_FragColor = vec4(normalize(color) * 1.5, opacity);
		return;
	}

	vec2 uv1 = texcoord1 * texTiling;
	vec4 textureColor = texture2D(texture, uv1);

	float alpha = opacity * textureColor.a;

	//////////////// NormalMap ////////////////

	vec3 vertexNormal = normal, normalmapValue = texture2D(normalMap, uv1, normalMipmap).rgb;

	if (hasNormalMap) {
		vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0) * vec3(normalIntensity, normalIntensity, 1.0));
	}

	vec3 cameraRay = vertex - cameraLoc;
	vec3 cameraNormal = normalize(cameraRay);

	//////////////// Lights ////////////////
	
	vec3 finalColor = color;

	if (receiveLight) {
		if (lightCount > 0 || glossy > 0.0) {
			finalColor += traceLight(vertexNormal, cameraNormal);
		}

		finalColor = finalColor * sunlight + max(dot(vertexNormal, sundir), 0.0);
	}

	finalColor = finalColor * textureColor.rgb;

	//////////////// LightMap ////////////////

	vec3 lightmapColor = vec3(0.0);

	lightmapColor = texture2D(lightMap, texcoord2).rgb;
	finalColor = finalColor * 0.3 + finalColor * lightmapColor * 0.7;

	//////////////// RefMap ////////////////

	vec3 refmapLookup = reflect(cameraNormal, vertexNormal);

	if (refMapType == 2) {
		refmapLookup = normalize(correctBoundingBoxIntersect(refMapBox, refmapLookup));
	}

	vec3 refColor = textureCube(refMap, refmapLookup, roughness).rgb;
	
	float gg = clamp(pow(glossy, 3.0), 0.0, 1.0);
	// finalColor = finalColor * (1.0 - gg) + (finalColor * 0.5 + finalColor * 0.5 * refColor) * gg;
	finalColor = finalColor * (1.0 - gg) + (finalColor * refColor * gg);

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
}