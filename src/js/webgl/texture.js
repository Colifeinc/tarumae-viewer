////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";

Tarumae.Utility.isPowerOf2 = function(value) {
	return (value & (value - 1)) == 0;
};

Tarumae.Texture = function(image, enableMipmapped, linearInterpolation, enableRepeat) {
	this.glTexture = null;

	if (typeof image !== "undefined") {
		this.image = image;

		if (image instanceof Image) {
			this.width = image.width;
			this.height = image.height;
		}
	}

	if (typeof enableMipmapped === "boolean") {
		this.enableMipmapped = enableMipmapped;
	} else {
		this.enableMipmapped = true;
	}
	
	this.mipmapped = false;
	this.canMipmap = false;
		
	if (typeof linearInterpolation === "boolean") {
		this.linearInterpolation = linearInterpolation;
	} else {
		this.linearInterpolation = true;
	}

	if (typeof enableRepeat === "boolean") {
		this.enableRepeat = enableRepeat;
	} else {
		this.enableRepeat = true;
	}
};

Tarumae.Texture.create = function(renderer, width, height) {
	var tex = new Tarumae.Texture(null);
	tex.renderer = renderer;
	tex.width = width;
	tex.height = height;
	return tex;
};

Tarumae.Texture.createEmpty = function() {
	var tex = new Tarumae.Texture(new Uint8Array([255, 255, 255, 255]), false, false);
	tex.width = 1;
	tex.height = 1;
	return tex;
};

Tarumae.Texture.prototype = {

	// create: function(renderer, width, height) {
	// 	this.renderer = renderer;
	// 	this.width = width;
	// 	this.height = height;
	// 	this.gl = renderer.gl;
	// 	this.glTexture = this.gl.createTexture();

	// 	if (renderer.debugger) {
	// 		renderer.debugger.totalNumberOfTexturesUsed++;
	// 	}

	// 	this.use();
	// 	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
	// 	this.linear();
	// 	this.clampToEdge();
	// 	this.disuse();

	// 	return this;
	// },

	setupParameters: function() {
		var gl = this.renderer.gl;

		if (this.canMipmap) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
			if (this.mipmapped) {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			} else {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.linearInterpolation ? gl.LINEAR : gl.NEAREST);
		}

		if (this.mipmapped && this.enableRepeat) {
			this.repeat();
		} else {
			this.clampToEdge();
		}
	},

	linear: function() {
		var gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		return this;
	},

	mipMapLinearToLinear: function() {
		var gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		return this;
	},

	repeat: function() {
		var gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		return this;
	},

	clampToEdge: function() {
		var gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		return this;
	},

	bind: function(renderer) {
		if (this.image === undefined) return;

		if (!this.renderer) {
			this.renderer = renderer;
		}

		var gl = this.renderer.gl;

		this.glTexture = gl.createTexture();

		if (this.renderer.debugger) {
			this.renderer.debugger.totalNumberOfTexturesUsed++;
		}

		gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
	
		if (this.image === null || this.image instanceof Uint8Array || this.image instanceof Float32Array) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
		} else if (this.image instanceof Image) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
		}
	
		this.canMipmap = Tarumae.Utility.isPowerOf2(this.width) && Tarumae.Utility.isPowerOf2(this.height);

		if (this.enableMipmapped && this.canMipmap) {
			gl.generateMipmap(gl.TEXTURE_2D);
			this.mipmapped = true;
		}
	
		this.setupParameters();
	},

	use: function(renderer) {
		if (!this.renderer) {
			this.renderer = renderer;
		}	

		if (!this.glTexture) {
			this.bind(this.renderer);
		}

		this.renderer.gl.bindTexture(this.renderer.gl.TEXTURE_2D, this.glTexture);
	},

	disuse: function() {

		if (this.glTexture) {
			this.renderer.gl.bindTexture(this.renderer.gl.TEXTURE_2D, null);
		}
	},

	destroy: function() {
		if (!this.renderer) return;

		var gl = this.renderer.gl;
		if (!gl) return;

		if (this.glTexture) {
			gl.deleteTexture(this.glTexture);
			this.glTexture = null;

			if (this.renderer && this.renderer.debugger) {
				this.renderer.debugger.totalNumberOfTexturesUsed--;
			}
		}
	},
};