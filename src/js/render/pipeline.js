
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

    if (this.renderer.debugger) {
      this.renderer.debugger.numberOfRenderPassesPerFrame++;
    }
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

Tarumae.PipelineNodes.ImageToScreenRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options) {
    super(renderer);
    
    this.options = options;  
    this.screenPlaneMesh = new Tarumae.ScreenMesh();
    
    if (!options || !options.flipTexcoordY) {
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

      if (this.tex2Input) {
        this.tex2Input._render();
        imageShader.tex2 = this.tex2Input.output;
      } else {
        imageShader.tex2 = undefined;
      }

      imageShader.texture = this._input.output;

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
      imageShader.resolution[0] = width;
      imageShader.resolution[1] = height;

      this.renderer.useShader(imageShader);
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

    const w = 1, h = 1;

		this.vertices = [-w, h, 0, -w, -h, 0, w, h, 0, w, -h, 0];
		this.texcoords = [0, 0, 0, 1, 1, 0, 1, 1];

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

    this.options = options || {};
    this.width = this.options.width || this.renderer.canvas.width;
    this.height = this.options.height || this.renderer.canvas.height;

    this.screenPlaneMesh = new Tarumae.ScreenMesh();
    
    if (this.options.flipTexcoordY) {
      this.screenPlaneMesh.flipTexcoordY();
    }

    this.shader = Tarumae.Renderer.Shaders["image"].instance;
    
    this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height, {
      depthBuffer: false
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
      imageShader.tex2 = undefined;

      if (typeof this.enableAntialias !== "undefined") {
        imageShader.enableAntialias = this.enableAntialias;
      }
      if (typeof this.gammaFactor !== "undefined") {
        imageShader.gammaFactor = this.gammaFactor;
      }
      if (typeof this.options.resizeScale !== "undefined") {
        imageShader.resizeScale[0] = this.options.resizeScale[0];
        imageShader.resizeScale[1] = this.options.resizeScale[1];
      }

      this.renderer.useShader(imageShader);
      
      this.buffer.use();
     
      imageShader.resolution[0] = this.buffer.width;
      imageShader.resolution[1] = this.buffer.height;
      imageShader.beginMesh(this.screenPlaneMesh);
      this.screenPlaneMesh.draw(this.renderer);
      imageShader.endMesh();
      this.renderer.disuseCurrentShader();

      this.buffer.disuse();
    }
  }
};

Tarumae.PipelineNodes.BlurRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options) {
    super(renderer);

    this.blurHorRenderer = new Tarumae.PipelineNodes.MemoryImageRenderer(renderer, options); 
    this.blurVerRenderer = new Tarumae.PipelineNodes.MemoryImageRenderer(renderer, options);
  }

  get output() {
    return this.blurVerRenderer.buffer.texture;
  }

  _render() {
    this.blurHorRenderer.clear();
    this.blurVerRenderer.clear();
    
    if (typeof this.gammaFactor !== undefined) {
      this.blurHorRenderer.gammaFactor = this.gammaFactor;
      this.blurVerRenderer.gammaFactor = this.gammaFactor;
    }

    this.blurHorRenderer.input = this._input;
    this.blurHorRenderer.shader.isVertical = false;
    this.blurHorRenderer.shader.filterType = 2;
    this.blurHorRenderer._render();

    this.blurVerRenderer.input = this.blurHorRenderer;
    this.blurVerRenderer.shader.isVertical = true;
    this.blurVerRenderer.shader.filterType = 2;
    this.blurVerRenderer._render();
  }
};
