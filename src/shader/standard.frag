precision mediump float;
//precision highp float;

struct BoundingBox {
	vec3 min;
	vec3 max;
	vec3 origin;
};

struct Light {
	vec3 pos;
	vec3 color;
};

struct Object
{
	vec3 loc;
};

uniform vec3 sundir;
uniform vec3 sunlight;

uniform BoundingBox refMapBox;
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
uniform sampler2D lightMap;
uniform samplerCube refMap;
uniform samplerCube shadowMap;

uniform bool hasTexture;
uniform bool hasLightMap;
uniform bool hasNormalMap;
uniform bool hasUV2;
uniform bool hasShadowMap;
uniform int refMapType;

varying vec3 vertex;
varying vec3 normal;
varying vec2 texcoord1;
varying vec2 texcoord2;
varying mat3 TBN;

uniform Light lights[15];
uniform int lightCount;

uniform Object camera;

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

	for (int i = 0; i < 50; i++)
	{
		if (i >= lightCount) break;

		vec3 lightRay = lights[i].pos - vertex;
		vec3 lightNormal = normalize(lightRay);

		float ln = dot(lightNormal, vertexNormal);

		if (ln > 0.0) {
			if (!hasLightMap) {
				float ld = pow(length(lightRay), -2.0);
				diff += lights[i].color * clamp(ln * ld * (0.5 + roughness * 0.5), 0.0, 1.0);
			}
		}

		if (glossy > 0.0) {
				vec3 reflection = reflect(lightNormal, vertexNormal);
				float refd = dot(reflection, cameraNormal);

				if (refd > 0.0) {
					specular += lights[i].color * (pow(refd, 400.0 * glossy)) * 0.2;
				}
		}
	}

	return color + color * diff + specular;
}

void main(void) {

	if (emission > 0.0) {
		gl_FragColor = vec4(normalize(color) * 1.5, opacity);
		return;
	}

	vec2 uv1 = texcoord1 * texTiling;
	vec4 textureColor = texture2D(texture, uv1);

	float alpha = opacity * textureColor.a;

//	if (alpha < 0.05) {
//		discard;
//	}

	//////////////// NormalMap ////////////////

	vec3 vertexNormal = normal, normalmapValue = texture2D(normalMap, uv1, normalMipmap).rgb;

	if (hasNormalMap) {
		//vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0) * vec3(normalIntensity, normalIntensity, 1.0));
		vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0));
	}

	vec3 cameraRay, cameraNormal;

	if (lightCount > 0 || refMapType > 0) {
		cameraRay = vertex - camera.loc;
		cameraNormal = normalize(cameraRay);
	}

	//////////////// Lights ////////////////
	
	vec3 finalColor = color;

	if (receiveLight) {	
		if (lightCount > 0 && (!hasLightMap || glossy > 0.0)) {
			finalColor = traceLight(color, vertexNormal, cameraNormal);
		}

		finalColor = finalColor * (1.0 + dot(vertexNormal, sundir) * 0.2) + sunlight;
	}

	if (hasTexture) {
		finalColor = finalColor * textureColor.rgb;
	}

	//////////////// LightMap ////////////////
	vec2 uv2 = hasUV2 ? texcoord2 : texcoord1;

	vec3 lightmapColor = texture2D(lightMap, uv2).rgb;

	if (hasLightMap) {
		finalColor = finalColor * pow(lightmapColor, vec3(0.5)) + pow(lightmapColor, vec3(10.0)) * 0.1;
	}

	//////////////// RefMap ////////////////

	vec3 refmapLookup = vec3(0.0);

	if (glossy > 0.0) {
		if (refMapType == 1) {
			refmapLookup = reflect(cameraNormal, vertexNormal);
		} else if (refMapType == 2) {
			refmapLookup = reflect(cameraNormal, vertexNormal);
			refmapLookup = normalize(correctBoundingBoxIntersect(refMapBox, refmapLookup));
		}
	}

	vec3 refColor = textureCube(refMap, refmapLookup, (roughness - 0.5) * 5.0).rgb;
	
	if (glossy > 0.0) {
		if (refMapType == 1) {
			finalColor += pow(refColor, vec3(10.0)) * glossy;
		} else if (refMapType == 2) {
			if (dot(normal, vec3(0.0, 1.0, 0.0)) > 0.98) {
				refColor *= clamp(1.0 - dot(refmapLookup, normal), 0.0, 1.0);
			}
			finalColor = finalColor + pow(refColor, vec3(7.5)) * (glossy * 0.7);
		}
	
		if (alpha < 1.0) {
			alpha = max(finalColor.r, max(finalColor.g, finalColor.b)) * 0.5;
		}
	}

	if (alpha < 0.05) {
		discard;
	}

	//////////////// ShadowMap ////////////////

	vec3 correctedVertexToSun = vec3(0.0);

	if (hasShadowMap) {
    correctedVertexToSun = correctBoundingBoxIntersect(shadowMapBox, sundir);
	}

	float shadow = textureCube(shadowMap, correctedVertexToSun).r;

	if (hasShadowMap) {
		shadow *= max(dot(normal, sundir), 0.0);
		if (shadow > 0.0) {
			finalColor += vec3(1.0, 1.0, 0.9) * shadow;
		}
	}

	gl_FragColor = vec4(finalColor, alpha);
}