////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

function Material() {
}

Material.prototype.copyFrom = function(mat) {
	// color
	if (typeof mat.color === "object" && mat.color instanceof color3) {
		this.color = mat.color.clone();
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

Material.prototype.clone = function() {
	var clone = new Material();
	clone.copyFrom(this);
	return clone;
}