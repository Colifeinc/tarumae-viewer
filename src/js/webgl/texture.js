////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";

if (!Tarumae.Utility.isPowerOf2) {
	Tarumae.Utility.isPowerOf2 = function(value) {
		return (value & (value - 1)) == 0;
	};
}

Tarumae.Texture = class {
	constructor(image) {
		this.glTexture = null;

		if (image) {
			this.image = image;

			if (typeof Image === "function" && image instanceof Image) {
				this.width = image.width;
				this.height = image.height;
			}
		}
			
		this.enableMipmapped = true;
		this.enableRepeat = true;
		this.linearInterpolation = false;
		this.canMipmap = false;
		this._mipmapped = false;
	}

	setupParameters() {
		const gl = this.renderer.gl;

		if (this.canMipmap) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
			if (this._mipmapped) {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.linearInterpolation ?
					gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR_MIPMAP_NEAREST);
			} else {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
		} else {
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.linearInterpolation ? gl.LINEAR : gl.NEAREST);
			if (this.linearInterpolation) {
				this.linear();
			} else {
				this.nearest();
			}
		}

		if (this._mipmapped && this.enableRepeat) {
			this.repeat();
		} else {
			this.clampToEdge();
		}

	}

	linear() {
		const gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		return this;
	}

	nearest() {
		const gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		return this;
	}
		
	mipMapLinearToLinear() {
		const gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		return this;
	}

	repeat() {
		const gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		return this;
	}

	clampToEdge() {
		const gl = this.renderer.gl;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		return this;
	}

	bind(renderer) {
		// allows this.image === null
		if (this.image === undefined) return;

		if (!this.renderer) {
			this.renderer = renderer;
    }

    if (typeof Image === "function" && this.image instanceof Image) {
      this.width = this.image.width;
      this.height = this.image.height;
    }

		const gl = this.renderer.gl;

		this.glTexture = gl.createTexture();

		if (this.renderer.debugger) {
			this.renderer.debugger.totalNumberOfTexturesUsed++;
		}

		gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
	
		if (this.image === null || this.image instanceof Uint8Array || this.image instanceof Float32Array) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
		} else if (typeof Image === "function" && this.image instanceof Image) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
		}
	
    this.canMipmap = this.enableMipmapped
      // && this.width > 4 && this.height > 4
      && Tarumae.Utility.isPowerOf2(this.width) && Tarumae.Utility.isPowerOf2(this.height);

		if (this.canMipmap) {
			this.generateMipmap();
		}
	
		this.setupParameters();
	}

	generateMipmap() {
		const gl = this.renderer.gl;
		gl.generateMipmap(gl.TEXTURE_2D);
		this._mipmapped = true;
	}

	use(renderer) {
		if (!this.renderer) {
			this.renderer = renderer;
		}

		if (this.isLoading && this.image && !this.image.complete) {
			return false;
		}

		if (!this.glTexture) {
			this.bind(this.renderer);
		}

		this.renderer.gl.bindTexture(this.renderer.gl.TEXTURE_2D, this.glTexture);

		return true;
	}

	disuse() {
		if (this.glTexture) {
			this.renderer.gl.bindTexture(this.renderer.gl.TEXTURE_2D, null);
		}
	}

	destroy() {
		if (!this.renderer) return;

		const gl = this.renderer.gl;
		if (!gl) return;

		if (this.glTexture) {
			gl.deleteTexture(this.glTexture);
			this.glTexture = null;

			if (this.renderer && this.renderer.debugger) {
				this.renderer.debugger.totalNumberOfTexturesUsed--;
			}
		}
	}

	static create(width, height) {
		const tex = new Tarumae.Texture();
		tex.image = null;
		tex.width = width;
		tex.height = height;
		return tex;
	}
	
	static createEmpty() {
		const tex = new Tarumae.Texture(new Uint8Array([255, 255, 255, 255]), false, false);
		tex.width = 1;
		tex.height = 1;
		return tex;
	}
};
