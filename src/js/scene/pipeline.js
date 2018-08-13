
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
      this._input.isRendered = false;
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
    this.renderer.clearViewport();
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
    this.texture = this.buffer.texture;
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
  constructor(renderer) {
    super(renderer);
    this.screenPlaneMesh = new Tarumae.ScreenMesh();
    this.shader = Tarumae.Renderer.Shaders["screen"].instance;
  }
  
  set input(node) {
    if (!node.output || !(node.output instanceof Tarumae.Texture)) {
      throw "image renderer's input requires a texture pipleline renderer";
    }
    super.input = node;
  }

  render() {
    if (this._input.texture instanceof Tarumae.Texture) {
      const imageShader = this.shader;
      imageShader.texture = this._input.texture;
      this.renderer.useShader(imageShader);

      if (typeof enableAntialias !== "undefined") {
        imageShader.enableAntialias = this.enableAntialias;
      }
      if (typeof this.gammaFactor !== "undefined") {
        imageShader.gammaFactor = this.gammaFactor;
      }

      const gl = this.renderer.gl;
      gl.viewport(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);

      imageShader.beginMesh(this.screenPlaneMesh);
      this.screenPlaneMesh.draw(this.renderer);
      imageShader.endMesh();
      this.renderer.disuseCurrentShader();
    }
  }
};