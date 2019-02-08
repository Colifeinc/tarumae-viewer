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

		if (ln > 0.0) {
			float ld = pow(length(lightRay), -5.0);
			diff += lights[i].color * clamp(ln * ld, 0.0, 1.0) * ((roughness * roughness) + 0.1);
		}

		if (glossy > 0.0) {
			vec3 reflection = reflect(lightNormal, vertexNormal);
			float refd = dot(reflection, cameraNormal);

			if (refd > 0.0) {
				specular += lights[i].color * pow(refd, 7.0) * pow(glossy, 10.0);
			}
		}
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
		// vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0));
	}

	vec3 cameraRay, cameraNormal;

	if (lightCount > 0 || refMapType > 0) {
		cameraRay = vertex - cameraLoc;
		cameraNormal = normalize(cameraRay);
	}

	//////////////// Lights ////////////////
	
	vec3 finalColor = color;

	if (receiveLight) {
		if (lightCount > 0 || glossy > 0.0) {
			finalColor += traceLight(vertexNormal, cameraNormal);
		}

		finalColor = finalColor * 0.5 + finalColor * sunlight * max(dot(vertexNormal, sundir), 0.0) * 0.5;
	}

	finalColor = finalColor * textureColor.rgb;

	//////////////// LightMap ////////////////

	vec3 lightmapColor = vec3(0.0);

	lightmapColor = texture2D(lightMap, texcoord2).rgb;
	// finalColor = finalColor * pow(lightmapColor, vec3(0.5)) + pow(lightmapColor, vec3(10.0)) * 0.1;
	finalColor = finalColor * 0.3 + finalColor * lightmapColor * 0.7;
	// finalColor = finalColor * lightmapColor;


		//////////////// RefMap ////////////////

		vec3 refmapLookup = vec3(0.0);

		if (glossy > 0.0) {
			if (refMapType == 1) {
				refmapLookup = reflect(cameraNormal, vertexNormal);
			} else if (refMapType == 2) {
				refmapLookup = reflect(cameraNormal, vertexNormal);
				refmapLookup = normalize(correctBoundingBoxIntersect(refMapBox, refmapLookup));
			}

			vec3 refColor = textureCube(refMap, refmapLookup, (roughness - 0.5) * 7.0).rgb;

			if (refMapType == 1) {
				finalColor += pow(refColor, vec3(10.0)) * glossy;
			} else if (refMapType == 2) {
				if (dot(normal, vec3(0.0, 1.0, 0.0)) > 0.98) {
					refColor *= clamp(1.0 - dot(refmapLookup, normal), 0.0, 1.0);
				}
				finalColor = finalColor + pow(refColor, vec3(1.0 / glossy)) * pow(glossy, 4.0);
			}
		
			// if (alpha < 1.0) {
			// 	alpha = max(finalColor.r, max(finalColor.g, finalColor.b)) * 0.5;
			// }
		}

		// if (alpha < 0.05) {
		// 	discard;
		// }

		//////////////// ShadowMap ////////////////

	if (receiveShadow) {
		if (shadowMapType == 1) {
			float shadowDir = dot(vertexNormal, normalize(vec3(2.0, 10.0, 5.0)));
			if (shadowDir > 0.0) {

				float shadowMapDepth;
				shadowMapDepth = decodeFloatRGBA(texture2D(shadowMap2D, shadowPosition.xy));
				// float stride = 0.00024;
				// shadowMapDepth  = 0.25 * decodeFloatRGBA(texture2D(shadowMap2D, shadowPosition.xy + vec2(stride * 0.4, stride * 0.6)));
				// shadowMapDepth += 0.25 * decodeFloatRGBA(texture2D(shadowMap2D, shadowPosition.xy + vec2(stride * 0.6, stride * 0.4)));
				// shadowMapDepth += 0.25 * decodeFloatRGBA(texture2D(shadowMap2D, shadowPosition.xy - vec2(stride * 0.4, stride * 0.6)));
				// shadowMapDepth += 0.25 * decodeFloatRGBA(texture2D(shadowMap2D, shadowPosition.xy - vec2(stride * 0.6, stride * 0.4)));
				// shadowMapDepth  = 0.25 * (texture2D(shadowMap2D, shadowPosition.xy + vec2(stride * 0.4, stride * 0.6))).r;
				// shadowMapDepth += 0.25 * (texture2D(shadowMap2D, shadowPosition.xy + vec2(stride * 0.6, stride * 0.4))).r;
				// shadowMapDepth += 0.25 * (texture2D(shadowMap2D, shadowPosition.xy - vec2(stride * 0.4, stride * 0.6))).r;
				// shadowMapDepth += 0.25 * (texture2D(shadowMap2D, shadowPosition.xy - vec2(stride * 0.6, stride * 0.4))).r;

				// float shadowBlock = (shadowPosition.z - shadowMapDepth);
				// float shadowBlock = 1.0 - clamp((shadowPosition.z - shadowMapDepth) * 0.5, 0.0, 0.1);
				float shadowBlock = 1.0 - smoothstep(0.00001, 0.05, (shadowPosition.z - shadowMapDepth)) / 0.5;
				// float shadowBlock = 1.0 - smoothstep(0.0002, 0.3, (shadowPosition.z - shadowMapDepth)) / 0.5;
				finalColor = finalColor * 0.75 + finalColor * shadowBlock * 0.25;

				// float block = (shadowPosition.z - shadowMapDepth);
				// if (block > 0.02) {
				// 	finalColor *= 0.5;
				// }
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