////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Tarumae.VertexBuffer = function(renderer) {
	this.renderer = renderer;
	this.glBuffer = null;
}

Tarumae.VertexBuffer.prototype.bind = function (vertices, normals, texcoords, colors) {
	var gl = this.renderer.gl;
};

/////////////////////// CommonBuffer /////////////////////////

Tarumae.CommonBuffer = function() {
	this.glFrameBuffer = null;
};

Tarumae.CommonBuffer.prototype = {
	use: function() {
		var gl = this.gl;

		gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFrameBuffer);
		this.texture.use();

		gl.viewport(0.0, 0.0, this.width, this.height);

		var backColor = this.backColor;
	
		if (typeof backColor == "undefined") {
			backColor = this.renderer.options.backColor;
		}
	
		gl.clearColor(backColor.r, backColor.g, backColor.b, backColor.a);
		gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	},

	disuse: function() {
		this.texture.disuse();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

		this.renderer.resetViewport();
		this.renderer.clear();
	},

	destroy: function() {
		if (this.glFrameBuffer) {
			this.gl.deleteFramebuffer(this.glFrameBuffer);
			this.glFrameBuffer = null;
		}
	},
};

/////////////////////// FrameBuffer /////////////////////////

Tarumae.FrameBuffer = function(renderer, width, height, backColor) {
	this.renderer = renderer;
	this.gl = renderer.gl;
	this.width = width;
	this.height = height;

	this.backColor = backColor;

	var gl = this.gl;

	// framebuffer
	this.glFrameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFrameBuffer);

	// texture
	this.texture = Tarumae.Texture.create(renderer, width, height);
	this.texture.bind();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.glTexture, 0);
 	
	// renderbuffer
	this.renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	this.disuse();
};

Tarumae.FrameBuffer.prototype = new Tarumae.CommonBuffer();

Tarumae.FrameBuffer.prototype.destroy = function() {
	if (this.texture) {
		this.texture.destroy();
		this.texture = null;
	}

	Tarumae.CommonBuffer.prototype.destroy.call(this);
};

/////////////////////// CubeFrameBuffer /////////////////////////

Tarumae.CubeMapFrameBuffer = function(renderer, width, height, backColor) {
	this.renderer = renderer;
	this.gl = renderer.gl;
	this.width = width;
	this.height = height;

	this.backColor = backColor;

	var gl = this.gl;

	// framebuffer
	this.glFrameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFrameBuffer);

	// texture
	var cubemap = new Tarumae.CubeMap(this.renderer);
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
};

Tarumae.CubeMapFrameBuffer.prototype = new Tarumae.CommonBuffer();

Tarumae.CubeMapFrameBuffer.prototype.changeFace = function(index) {
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, this.texture.glTexture, 0);
};

////////////////////// StencilBuffer ///////////////////////

Tarumae.StencilBuffer = function(renderer) {
	this.renderer = renderer;
	this.gl = renderer.gl;
};

Tarumae.StencilBuffer.prototype = {
	beginDraw: function() {
		this.gl.enable(this.gl.STENCIL_TEST);
		this.gl.stencilFunc(this.gl.ALWAYS, 1, 0xFF);
		this.gl.stencilOp(this.gl.KEEP, this.gl.KEEP, this.gl.REPLACE);
		this.gl.stencilMask(0xFF);
		this.gl.clear(this.gl.STENCIL_BUFFER_BIT);
		this.gl.colorMask(0, 0, 0, 0);
		this.gl.depthMask(false);
	},
	
	endDraw: function() {
		this.gl.depthMask(true);
		this.gl.colorMask(1, 1, 1, 1);
	},

	beginMask: function() {
		this.gl.stencilFunc(this.gl.EQUAL, 1, 0xFF);
		this.gl.stencilMask(0);
	},

	endMask: function() {
		this.gl.disable(this.gl.STENCIL_TEST);
	}
};
