//
// This fragment shader defines a reference implementation for Physically Based Shading of
// a microfacet surface material defined by a glTF model.
//
// References:
// [1] Real Shading in Unreal Engine 4
//     http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
// [2] Physically Based Shading at Disney
//     http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
// [3] README.md - Environment Maps
//     https://github.com/KhronosGroup/glTF-WebGL-PBR/#environment-maps
// [4] "An Inexpensive BRDF Model for Physically based Rendering" by Christophe Schlick
//     https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf
#extension GL_EXT_shader_texture_lod: enable
#extension GL_OES_standard_derivatives : enable

// #define USE_IBL

precision highp float;

// const vec3 u_LightDirection;
uniform vec3 sundir;
// const vec3 u_LightColor = vec3(1.0, 0.0, 1.0);
uniform vec3 sunlight;

// #ifdef USE_IBL
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;
// #endif

// uniform sampler2D u_BaseColorSampler;
uniform sampler2D texture;

// uniform sampler2D u_NormalSampler;
// const float u_NormalScale = 1.0;
uniform sampler2D normalMap;
uniform float normalMipmap;
uniform bool hasNormalMap;
const float normalIntensity = 1.0;

// #ifdef HAS_EMISSIVEMAP
// uniform sampler2D u_EmissiveSampler;
// uniform vec3 u_EmissiveFactor;
// #endif

// uniform sampler2D u_MetallicRoughnessSampler;

// #ifdef HAS_OCCLUSIONMAP
// uniform sampler2D u_OcclusionSampler;
// uniform float u_OcclusionStrength;
// #endif

// uniform vec2 u_MetallicRoughnessValues;
uniform float glossy;
uniform float roughness;
vec4 u_BaseColorFactor = vec4(1.0);

// uniform vec3 u_Camera;
uniform vec3 cameraLoc;

// debugging flags used for shader output of intermediate PBR variables
vec4 u_ScaleDiffBaseMR = vec4(1.0);
vec4 u_ScaleFGDSpec = vec4(1.0);
vec4 u_ScaleIBLAmbient = vec4(1.0);

// varying vec3 v_Position;
varying vec3 vertex;

// varying vec2 v_UV;
varying vec2 texcoord1;

// varying mat3 v_TBN;
varying mat3 TBN;

// varying vec3 v_Normal;
varying vec3 normal;

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo
{
    float NdotL;                  // cos angle between normal and light direction
    float NdotV;                  // cos angle between normal and view direction
    float NdotH;                  // cos angle between normal and half vector
    float LdotH;                  // cos angle between light direction and half vector
    float VdotH;                  // cos angle between view direction and half vector
    float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
    float metalness;              // metallic value at the surface
    vec3 reflectance0;            // full reflectance color (normal incidence angle)
    vec3 reflectance90;           // reflectance color at grazing angle
    float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuseColor;            // color contribution from diffuse lighting
    vec3 specularColor;           // color contribution from specular lighting
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec4 SRGBtoLINEAR(vec4 srgbIn)
{
    #ifdef MANUAL_SRGB
        #ifdef SRGB_FAST_APPROXIMATION
        vec3 linOut = pow(srgbIn.xyz,vec3(2.2));
        #else // NOT SRGB_FAST_APPROXIMATION
        vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
        vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
        #endif //SRGB_FAST_APPROXIMATION
        return vec4(linOut,srgbIn.w);;
    #else // NOT MANUAL_SRGB
        return srgbIn;
    #endif //MANUAL_SRGB
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getNormal() {

 	vec3 vertexNormal = normal;
    vec3 normalmapValue = texture2D(normalMap, texcoord1, normalMipmap).rgb;

	if (hasNormalMap) {
		vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0) * vec3(normalIntensity, normalIntensity, 1.0));
		// vertexNormal = normalize(TBN * (normalmapValue * 2.0 - 1.0));
	}

    return vertexNormal;
}

// #ifdef USE_IBL
// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
vec3 getIBLContribution(PBRInfo pbrInputs, vec3 n, vec3 reflection) 
{
    float mipCount = 9.0; // resolution of 512x512
    float lod = (pbrInputs.perceptualRoughness * mipCount);
    // retrieve a scale and bias to F0. See [1], Figure 3
    vec3 brdf = SRGBtoLINEAR(texture2D(u_brdfLUT, vec2(pbrInputs.NdotV, 1.0 - pbrInputs.perceptualRoughness))).rgb;
    vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_DiffuseEnvSampler, n)).rgb;

#ifdef USE_TEX_LOD
    vec3 specularLight = SRGBtoLINEAR(textureCubeLodEXT(u_SpecularEnvSampler, reflection, lod)).rgb;
#else
    vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;
#endif

    vec3 diffuse = diffuseLight * pbrInputs.diffuseColor;
    vec3 specular = specularLight * (pbrInputs.specularColor * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms
    diffuse *= u_ScaleIBLAmbient.x;
    specular *= u_ScaleIBLAmbient.y;

    return diffuse + specular;
}
// #endif /* USE_IBL */

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
vec3 diffuse(PBRInfo pbrInputs)
{
    return pbrInputs.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(PBRInfo pbrInputs)
{
    return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(PBRInfo pbrInputs)
{
    float NdotL = pbrInputs.NdotL;
    float NdotV = pbrInputs.NdotV;
    float r = pbrInputs.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float microfacetDistribution(PBRInfo pbrInputs)
{
    float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;
    float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}

vec3 gamma(vec3 color, float factor) {
    return pow(color, vec3(1.0 / factor));
}

void main()
{
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map

    // float perceptualRoughness = u_MetallicRoughnessValues.y;
    // float metallic = u_MetallicRoughnessValues.x;
    float perceptualRoughness = roughness;
    float metallic = glossy;

// #ifdef HAS_METALROUGHNESSMAP
//     // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
//     // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
//     vec4 mrSample = texture2D(u_MetallicRoughnessSampler, v_UV);
//     perceptualRoughness = mrSample.g * perceptualRoughness;
//     metallic = mrSample.b * metallic;
// #endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    vec2 v_UV = texcoord1;

    // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
    // vec4 baseColor = SRGBtoLINEAR(texture2D(u_BaseColorSampler, v_UV)) * u_BaseColorFactor;
    // vec4 baseColor = SRGBtoLINEAR(texture2D(texture, v_UV)) * u_BaseColorFactor;
// #else
    vec4 baseColor = u_BaseColorFactor;
// #endif

    vec3 f0 = vec3(0.04);
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
    diffuseColor *= 1.0 - metallic;
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    vec3 n = getNormal();                           // normal at surface point
    vec3 v = normalize(cameraLoc - vertex);         // Vector from surface point to camera
    vec3 l = normalize(sundir);                     // Vector from surface point to light
    vec3 h = normalize(l + v);                      // Half vector between both l and v
    vec3 reflection = -normalize(reflect(v, n));

    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float LdotH = clamp(dot(l, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    PBRInfo pbrInputs = PBRInfo(
        NdotL,
        NdotV,
        NdotH,
        LdotH,
        VdotH,
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor
    );

    // Calculate the shading terms for the microfacet specular shading model
    vec3 F = specularReflection(pbrInputs);
    float G = geometricOcclusion(pbrInputs);
    float D = microfacetDistribution(pbrInputs);

    // Calculation of analytical lighting contribution
    vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInputs);
    vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);
    // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
    vec3 color = NdotL * sunlight * (diffuseContrib + specContrib);

    // Calculate lighting contribution from image based lighting source (IBL)
// #ifdef USE_IBL
    color += getIBLContribution(pbrInputs, n, reflection);
// #endif

    // Apply optional PBR terms for additional (optional) shading
// #ifdef HAS_OCCLUSIONMAP
//     float ao = texture2D(u_OcclusionSampler, v_UV).r;
//     color = mix(color, color * ao, u_OcclusionStrength);
// #endif

// #ifdef HAS_EMISSIVEMAP
//     vec3 emissive = SRGBtoLINEAR(texture2D(u_EmissiveSampler, v_UV)).rgb * u_EmissiveFactor;
//     color += emissive;
// #endif

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
    // color = mix(color, F, u_ScaleFGDSpec.x);
    // color = mix(color, vec3(G), u_ScaleFGDSpec.y);
    // color = mix(color, vec3(D), u_ScaleFGDSpec.z);
    // color = mix(color, specContrib, u_ScaleFGDSpec.w);

    // color = mix(color, diffuseContrib, u_ScaleDiffBaseMR.x);
    // color = mix(color, baseColor.rgb, u_ScaleDiffBaseMR.y);
    // color = mix(color, vec3(metallic), u_ScaleDiffBaseMR.z);
    // color = mix(color, vec3(perceptualRoughness), u_ScaleDiffBaseMR.w);

    gl_FragColor = vec4(gamma(color, 2.2), baseColor.a);
}