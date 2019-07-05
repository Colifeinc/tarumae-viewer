////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"

Tarumae.VertexBuffer = class {
	constructor(renderer) {
		this.renderer = renderer;
		this.glBuffer = null;
	}

	bind(vertices, normals, texcoords, colors) {
		const gl = this.renderer.gl;
	}
}

/////////////////////// CommonBuffer /////////////////////////

Tarumae.CommonBuffer = class {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;
		this.gl = renderer.gl;
		this.glFrameBuffer = null;

		const gl = this.gl;

		this.glFrameBuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.glFrameBuffer);
	}

	disuse() {
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}

	destroy() {
		if (this.glFrameBuffer) {
			this.gl.deleteFramebuffer(this.glFrameBuffer);
			this.glFrameBuffer = null;
		}
	}
};

/////////////////////// FrameBuffer /////////////////////////

Tarumae.FrameBuffer = class extends Tarumae.CommonBuffer {
	constructor(renderer,
		width = renderer.canvas.width,
		height = renderer.canvas.height, {
			depthBuffer = true,
			clearBackground = true,
		} = {}) {
		super(renderer, width, height);

		this.clearBackground = clearBackground;
	
		const gl = this.gl;

		this.texture = Tarumae.Texture.create(this.width, this.height);
		this.texture.enableMipmapped = false;
		this.texture.enableRepeat = false;

		gl.activeTexture(gl.TEXTURE0);
		this.texture.bind(this.renderer);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.glTexture, 0);

		if (depthBuffer) {
			this.renderbuffer = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		}
		
		this.disuse();
	}

	use() {
		const gl = this.gl;

		gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFrameBuffer);
		gl.viewport(0, 0, this.width, this.height);

		if (this.clearBackground) {
			if (!this.renderer.options.backgroundImage) {
				const backColor = this.renderer.options.backColor;
				gl.clearColor(backColor.r, backColor.g, backColor.b, 1.0);
			}
		}

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	destroy() {
		if (this.texture) {
			this.texture.destroy();
			this.texture = undefined;
		}
	
		super.destroy(this);
	};
};

/////////////////////// CubeFrameBuffer /////////////////////////

Tarumae.CubeMapFrameBuffer = class extends Tarumae.CommonBuffer {
	constructor(renderer, width, height, backColor) {
		super(renderer, width, height, backColor);

		const gl = this.gl;
		
		const cubemap = new Tarumae.CubeMap(this.renderer);
		cubemap.createEmpty(this.width, this.height);
		this.texture = cubemap;

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, this.texture.glTexture, 0);
 	
		// renderbuffer
		this.renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		this.disuse();
	}
	
	changeFace(index) {
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, this.texture.glTexture, 0);
	}
}

////////////////////// StencilBuffer ///////////////////////

Tarumae.StencilBuffer = class extends Tarumae.CommonBuffer {
	constructor(renderer) {
		super(renderer)
	}

	beginDraw() {
		this.gl.enable(this.gl.STENCIL_TEST);
		this.gl.stencilFunc(this.gl.ALWAYS, 1, 0xFF);
		this.gl.stencilOp(this.gl.KEEP, this.gl.KEEP, this.gl.REPLACE);
		this.gl.stencilMask(0xFF);
		this.gl.clear(this.gl.STENCIL_BUFFER_BIT);
		this.gl.colorMask(0, 0, 0, 0);
		this.gl.depthMask(false);
	}
	
	endDraw() {
		this.gl.depthMask(true);
		this.gl.colorMask(1, 1, 1, 1);
	}

	beginMask() {
		this.gl.stencilFunc(this.gl.EQUAL, 1, 0xFF);
		this.gl.stencilMask(0);
	}

	endMask() {
		this.gl.disable(this.gl.STENCIL_TEST);
	}
}
