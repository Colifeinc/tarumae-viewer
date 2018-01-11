precision mediump float;
//precision highp float;

struct BoundingBox {
	vec3 min;
	vec3 max;
	vec3 origin;
};

uniform vec3 sundir;
uniform vec3 sunlight;
uniform BoundingBox shadowMapBox;

uniform vec2 texTiling;
uniform float opacity;
uniform bool receiveLight;
uniform float glossy;
uniform float roughness;
uniform float emission;
uniform float normalMipmap;
uniform BoundingBox refBox;

uniform sampler2D texture;
uniform sampler2D normalMap;
uniform sampler2D lightMap;
uniform samplerCube refMap;
uniform samplerCube shadowMap;

uniform bool hasTexture;
uniform bool hasLightMap;
uniform bool hasRefMap;
uniform bool hasNormalMap;
uniform bool hasUV2;
uniform bool hasShadowMap;

varying vec3 vertex;
varying vec3 normal;
varying vec2 texcoord1;
varying vec2 texcoord2;
varying vec3 color;
varying mat3 TBN;

struct Light {
	vec3 pos;
	vec3 color;
};

uniform Light lights[15];
uniform int lightCount;

struct Object
{
	vec3 loc;
};

uniform Object camera;

struct LightReturn {
	vec3 diff;
	vec3 spec;
};

vec3 color3GammaCorrection(vec3 c, float gamma) {
	return pow(c, vec3(gamma));
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

vec3 traceLight(vec3 vertexNormal, vec3 cameraNormal) {

	vec3 diff = vec3(0.0);
	vec3 lightspec = vec3(0.0);
	
	for (int i = 0; i < 50; i++)
	{
		if (i >= lightCount) break;

		vec3 lightRay = lights[i].pos - vertex;
		vec3 lightNormal = normalize(lightRay);

		float ln = dot(lightNormal, vertexNormal);

		if (ln > 0.0) {
			float ld = pow(length(lightRay), -2.0);
			
			if (!hasLightMap) {
				diff += lights[i].color * clamp((ln * ld * (0.5 + roughness * 0.5)), 0.0, 1.0);
			}

			if (glossy > 0.0) {
				vec3 reflection = normalize(reflect(lightNormal, vertexNormal));
				float refd = dot(reflection, cameraNormal);

				if (refd > 0.0) {
					lightspec += lights[i].color * (pow(refd, glossy * 1000.0 * (0.05 / ld)) * glossy);
				}
			}
		}
	}

	return diff + lightspec;
}

void main(void) {

	if (emission > 0.0) {
		gl_FragColor = vec4(color * emission, opacity);
		return;
	}

	vec4 textureColor = vec4(1.0);

	if (hasTexture) {
		textureColor = texture2D(texture, texcoord1 * texTiling);
	}

	float alpha = opacity * textureColor.a;

	if (alpha < 0.05) {
		discard;
	}

	vec3 vertexNormal = normal;

	if (hasNormalMap) {
		vertexNormal = texture2D(normalMap, texcoord1 * texTiling, normalMipmap).rgb * 2.0 - 1.0;
		vertexNormal = normalize(TBN * vertexNormal);
	}
	
	vec3 cameraRay, cameraNormal;

	if (lightCount > 0 || hasRefMap) {
		cameraRay = vertex - camera.loc;
		cameraNormal = normalize(cameraRay);
	}

	vec3 finalColor = color;

	if (receiveLight) {	
		vec3 light;

		if (lightCount > 0) {
			light = traceLight(vertexNormal, cameraNormal);
		}

		finalColor = color * light;
		finalColor += color * (0.5 + max(dot(vertexNormal, sundir), 0.0) * 0.5) + sunlight;
	}

	if (hasTexture) {
		finalColor = finalColor * textureColor.rgb;
	}

	vec2 uv = hasUV2 ? texcoord2 : texcoord1;

	if (hasLightMap) {
		vec3 lightmapColor = texture2D(lightMap, uv).rgb;

		//finalColor = finalColor * lightmapColor;
		//finalColor = finalColor * 0.2 + finalColor * lightmapColor * 0.85;
		//finalColor = finalColor * 0.2 + finalColor * color3GammaCorrection(lightmapColor, 0.4) * 0.9;
		finalColor = finalColor * 0.2 + finalColor * color3GammaCorrection(lightmapColor, 0.5);
	}

	if (hasRefMap) {
		vec3 lookup = reflect(cameraNormal, vertexNormal);
		vec3 refColor = textureCube(refMap, lookup, roughness * 2.0).rgb;

		finalColor = finalColor * 0.5 + refColor * glossy * pow(2.0, glossy) * 0.5;
	}

	if (hasShadowMap) {
		vec3 correctedVertexToSun = correctBoundingBoxIntersect(shadowMapBox, sundir);

		float shadow = textureCube(shadowMap, correctedVertexToSun).r;
		shadow *= max(dot(normal, sundir), 0.0);
		
		finalColor += vec3(1.0, 1.0, 0.90) * (shadow * 0.5);
	}

	gl_FragColor = vec4(finalColor, alpha);
}