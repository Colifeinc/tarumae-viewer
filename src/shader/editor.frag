////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

precision mediump float;
//precision highp float;

struct BoundingBox {
	vec3 min;
	vec3 max;
	vec3 origin;
};

struct PointLight {
	vec3 pos;
	vec3 color;
};

struct SpotLight {
	vec3 pos;
	vec3 dir;
	vec3 color;
	float range;
};

uniform vec3 sundir;
uniform vec3 sunlight;
uniform vec3 cameraLoc;

uniform BoundingBox shadowMapBox;

uniform vec3 color;
uniform vec2 texTiling;
uniform float opacity;
uniform bool receiveLight;

uniform float glossy;
uniform float roughness;
uniform float emission;
uniform float normalMipmap;
//uniform float normalIntensity;

uniform sampler2D texture;
uniform sampler2D normalMap;
uniform sampler2D shadowMap;

uniform bool hasTexture;
uniform bool hasNormalMap;
uniform bool hasUV2;
uniform bool hasShadowMap;

varying vec3 vertex;
varying vec3 normal;
varying vec2 texcoord1;
varying vec2 texcoord2;
varying mat3 TBN;

uniform PointLight pointLights[10];
uniform SpotLight spotLights[30];
uniform int pointLightCount;
uniform int spotLightCount;

struct LightReturn {
	vec3 diff;
	vec3 spec;
};

vec3 correctBoundingBoxIntersect(BoundingBox bbox, vec3 dir) {
	vec3 invdir = vec3(1.0, 1.0, 1.0) / dir;

	vec3 intersectMaxPointPlanes = (bbox.max - vertex) * invdir;
	vec3 intersectMinPointPlanes = (bbox.min - vertex) * invdir;

	vec3 largestRayParams = max(intersectMaxPointPlanes, intersectMinPointPlanes);

	float dist = min(min(largestRayParams.x, largestRayParams.y), largestRayParams.z);

	vec3 intersectPosition = vertex + dir * dist;
	
	return intersectPosition - bbox.origin;
}

vec3 traceLight(vec3 color, vec3 vertexNormal, vec3 cameraNormal) {

	vec3 diff = vec3(0.0);
	vec3 specular = vec3(0.0);

	for (int i = 0; i < 50; i++) {
		if (i >= pointLightCount) break;

		vec3 lightRay = pointLights[i].pos - vertex;
		vec3 lightNormal = normalize(lightRay);

		float ln = dot(lightNormal, vertexNormal);

		if (ln > 0.0) {
			float ld = pow(length(lightRay), -2.0);
			diff += pointLights[i].color * clamp(ln * ld * (0.3 + roughness * 0.3), 0.0, 1.0);
		}

		if (glossy > 0.0) {
			vec3 reflection = reflect(lightNormal, vertexNormal);
			float refd = dot(reflection, cameraNormal);

			if (refd > 0.0) {
				specular += pointLights[i].color * (pow(refd, 1000.0 * glossy)) * 0.1;
			}
		}
	}

	for (int i = 0; i < 50; i++) {
		if (i >= spotLightCount) break;

		vec3 lightRay = spotLights[i].pos - vertex;
		vec3 lightNormal = normalize(lightRay);

		float ln = dot(lightNormal, vertexNormal);

		if (ln > 0.0) {
			float spotRangeDot = spotLights[i].range;
			float toSpotNormal = dot(-lightNormal, spotLights[i].dir);
			ln *= smoothstep(max(spotRangeDot - 0.1, 0.0), min(spotRangeDot + 0.1, 1.0), toSpotNormal);

			if (ln > 0.0) {
				float ld = pow(length(lightRay), -2.0);
				diff += spotLights[i].color * clamp(ln * ld * (0.3 + roughness * 0.3), 0.0, 1.0);
			}
		}

//		if (glossy > 0.0) {
//			vec3 reflection = reflect(lightNormal, vertexNormal);
//			float refd = dot(reflection, cameraNormal);

//			if (refd > 0.0) {
//				specular += spotLights[i].color * (pow(refd, 1000.0 * glossy)) * 0.1;
//			}
//		}
	}

	return color * diff + specular;
}

void main(void) {

	if (emission > 0.0) {
		gl_FragColor = vec4(normalize(color) * 1.5, opacity);
		return;
	}

	vec2 uv1 = texcoord1 * texTiling;
	vec4 textureColor = texture2D(texture, uv1);

	float alpha = opacity * textureColor.a;

	if (alpha < 0.05) {
		discard;
	}

	vec3 vertexNormal = normal, normalmapValue = texture2D(normalMap, uv1, normalMipmap).rgb;

	if (hasNormalMap) {
		//vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0) * vec3(normalIntensity, normalIntensity, 1.0));
		vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0));
	}

	vec3 cameraRay, cameraNormal;

	if (pointLightCount > 0 || spotLightCount > 0) {
		cameraRay = vertex - cameraLoc;
		cameraNormal = normalize(cameraRay);
	}

	vec3 finalColor = color * max(dot(normal, vec3(0.408,0.815,0.408)), 0.1) * 0.5 + 0.4;

	if (receiveLight) {	
		if (pointLightCount > 0 || spotLightCount > 0) {
			finalColor += traceLight(color, vertexNormal, cameraNormal);
		}

		finalColor += sunlight;
	}

	if (hasTexture) {
		finalColor = finalColor * textureColor.rgb;
	}

	gl_FragColor = vec4(finalColor, alpha);
}