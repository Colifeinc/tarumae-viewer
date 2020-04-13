////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";

Tarumae.Material = class {
	copyFrom(mat) {
		// color
		if (typeof mat.color === "object" && mat.color instanceof Color3) {
			this.color = mat.color.clone();
		} else if (Array.isArray(mat.color)) {
			this.color = mat.color.slice();
		}
		
		if (typeof mat.tex === "object" && mat.tex instanceof Tarumae.Texture) {
			this.tex = mat.tex;
		}
	
		// texture tiling
		if (typeof mat.texTiling === "object") {
			if (typeof mat.texTiling.clone === "function") {
				this.texTiling = mat.texTiling.clone();
			} else if (Array.isArray(mat.texTiling)) {
				this.texTiling = mat.texTiling.slice();
			}
		}
	
		// glossy
		if (typeof mat.glossy !== "undefined") {
			this.glossy = mat.glossy;
		}
	
		// roughness
		if (typeof mat.roughness !== "undefined") {
			this.roughness = mat.glroughnessossy;
		}
	
		// emission
		if (typeof mat.emission !== "undefined") {
			this.emission = mat.emission;
		}
	
		// transparency
		if (typeof mat.transparency !== "undefined") {
			this.transparency = mat.transparency;
		}
		
		// refraction
		if (typeof mat.refraction !== "undefined") {
			this.refraction = mat.refraction;
		}

		// spot range
		if (typeof mat.spotRange !== "undefined") {
			this.spotRange = mat.spotRange;
		}
	
		// normal-map
		if (typeof mat.normalmap === "object" && mat.normalmap instanceof Tarumae.Texture) {
			this.normalmap = mat.normalmap;
		}
	
		// normal mipmap	
		if (typeof mat.normalMipmap !== "undefined") {
			this.normalMipmap = mat.normalMipmap;
		}
	}
	
	static clone() {
		var clone = new Tarumae.Material();
		clone.copyFrom(this);
		return clone;
	}
};