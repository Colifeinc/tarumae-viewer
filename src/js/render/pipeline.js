
import "../scene/object"
import Tarumae from "../entry"
import "../webgl/buffers"

Tarumae.PipelineNode = class {
  constructor(renderer) {
    this.renderer = renderer;
    this.isRendered = false;
    this._input = undefined;
  }

  _render() {
    if (this.isRendered) return;
    this.isRendered = true;

    if (this._input && !this._input.isRendered) {
      this._input._render();
    }

    this.render();
  }

  render() { }

  clear() {
    this.isRendered = false;
    
    if (this._input) {
      this._input.clear();
    }
  }

  set input(node) { this._input = node; }
  get input() { return this._input; }
  
  get output() { }
};

Tarumae.PipelineNodes = {};

Tarumae.PipelineNodes.DefaultRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer) {
    super(renderer);
  }

  render() {
    //this.renderer.clearViewport();
    this.renderer.renderFrame();
  }
};

Tarumae.PipelineNodes.SceneToImageRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options) {
    super(renderer);
    this.nodes = [];

    if (options && options.imageSize
      && options.imageSize.width && options.imageSize.height) {
      this._width = options.imageSize.width;
      this._height = options.imageSize.height;
      this.autoSize = false;
    } else {
      this.autoSize = true;
    }

    this.createBuffer();
  }

  get width() {
    if (this.autoSize) {
      return this.renderer.canvas.width;
    } else {
      return this._width;
    }
  }

  get height() {
    if (this.autoSize) {
      return this.renderer.canvas.height;
    } else {
      return this._height;
    }
  }

  createBuffer() {
    this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height);
    // this.texture = this.buffer.texture;

    // const gl = this.renderer.gl;
    // this.tex2 = Tarumae.Texture.create(128, 128);
		// this.tex2.glTexture = gl.createTexture();
		// gl.bindTexture(gl.TEXTURE_2D, this.tex2.glTexture);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.tex2.width, this.tex2.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.bindTexture(gl.TEXTURE_2D, null);


    //this.tex2.renderer = this.renderer;
		// this.buf2 = gl.createFramebuffer();
  }

  render() {
    if (this.autoSize && (this.buffer.width != this.renderer.canvas.width
      || this.buffer.height != this.renderer.canvas.height)) {
        this.buffer.destroy();
      this.createBuffer();
    }

    this.buffer.use();

    for (const node of this.nodes) {
      node._render();
    }

    this.renderer.renderFrame();

    // const gl = this.renderer.gl;

    // // gl.bindFramebuffer(gl.FRAMEBUFFER, this.buf2);
		// // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.buffer.texture.glTexture, 0);
		// gl.bindTexture(gl.TEXTURE_2D, this.tex2.glTexture);
    // gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, this.renderer.canvas.width, this.renderer.canvas.height, 0);
    // // gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, 128, 128);
    // // this.tex2.generateMipmap();
    // const rs = gl.getError();
    // if (rs) console.log("error = 0x" + rs.toString(16));
    
    this.buffer.disuse();

		// gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  clear() {
    super.clear();

    for (const node of this.nodes) {
      node.clear();
    }
  }

  get output() {
    return this.buffer.texture;
  }
};

Tarumae.PipelineNodes.ImageSource = class extends Tarumae.PipelineNode {
  constructor(renderer, tex) {
    super(renderer);
    this.texture = tex;
  }

  get output() {
    return this.texture;
  }
};

Tarumae.PipelineNodes.ImageRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options) {
    super(renderer);
    
    this.options = options;  
    this.screenPlaneMesh = new Tarumae.ScreenMesh();
    
    if (options && options.flipTexcoordY) {
      this.screenPlaneMesh.flipTexcoordY();
    }

    this.shader = Tarumae.Renderer.Shaders["screen"].instance;
  }
  
  set input(node) {
    if (!node.output || (!(node.output instanceof Tarumae.Texture)
     && !(node.output instanceof WebGLTexture))) {
      throw "image renderer requires a texture input pipleline";
    }
    super.input = node;
  }

  clear() {
    if (this.tex2Input) {
      this.tex2Input.clear();
    }
    super.clear();
  }

  render() {
    if (this._input.output) {

      const imageShader = this.shader;
      imageShader.texture = this._input.output;

      if (this.tex2Input) {
        this.tex2Input._render();
        imageShader.tex2 = this.tex2Input.output;
      } else {
        imageShader.tex2 = undefined;
      }

      this.renderer.useShader(imageShader);

      if (typeof enableAntialias !== "undefined") {
        imageShader.enableAntialias = this.enableAntialias;
      }
      if (typeof this.gammaFactor !== "undefined") {
        imageShader.gammaFactor = this.gammaFactor;
      }

      const gl = this.renderer.gl;
      const width = this.options && this.options.width ? this.options.width : this.renderer.canvas.width;
      const height = this.options && this.options.height ? this.options.height : this.renderer.canvas.height;

      gl.viewport(0, 0, width, height);

      imageShader.beginMesh(this.screenPlaneMesh);
      this.screenPlaneMesh.draw(this.renderer);
      imageShader.endMesh();
      this.renderer.disuseCurrentShader();
    }
  }
};

Tarumae.ScreenMesh = class extends Tarumae.Mesh {
	constructor() {
		super();

		this.vertices = [-1, 1, 0,    -1, -1, 0,   1, 1, 0,   1, -1, 0];
		this.texcoords = [0, 0,   0, 1,   1, 0,   1, 1];

		this.meta = {
			vertexCount: 4,
			normalCount: 0,
			uvCount: 1,
			texcoordCount: 4,
			tangentBasisCount: 0,
		};

		this.composeMode = Tarumae.Mesh.ComposeModes.TriangleStrip;
	}
};

Tarumae.PipelineNodes.MemoryImageRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options) {
    super(renderer);

    this.options = options;  
    this.screenPlaneMesh = new Tarumae.ScreenMesh();
    
    if (options && options.flipTexcoordY) {
      this.screenPlaneMesh.flipTexcoordY();
    }

    this.shader = Tarumae.Renderer.Shaders["screen"].instance;
    
    this.buffer = new Tarumae.FrameBuffer(this.renderer,
      this.options.width || this.renderer.canvas.width,
      this.options.height || this.renderer.canvas.height, {
        depthBuffer: true
      });

  }
  
  set input(node) {
    if (!node.output || (!(node.output instanceof Tarumae.Texture)
     && !(node.output instanceof WebGLTexture))) {
      throw "image renderer requires a texture input pipleline";
    }
    super.input = node;
  }

  get output() {
    return this.buffer.texture;
  }

  render() {
    if (this._input.output) {
      const imageShader = this.shader;
      imageShader.texture = this._input.output;
      this.renderer.useShader(imageShader);

      if (typeof enableAntialias !== "undefined") {
        imageShader.enableAntialias = this.enableAntialias;
      }
      if (typeof this.gammaFactor !== "undefined") {
        imageShader.gammaFactor = this.gammaFactor;
      }
      imageShader.tex2 = undefined;
      
      this.buffer.use();

      imageShader.beginMesh(this.screenPlaneMesh);
      this.screenPlaneMesh.draw(this.renderer);
      imageShader.endMesh();
      this.renderer.disuseCurrentShader();

      this.buffer.disuse();
    }
  }
};
