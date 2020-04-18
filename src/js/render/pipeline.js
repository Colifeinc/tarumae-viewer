////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import "../scene/object"
import Tarumae from "../entry"
import "../webgl/buffers"

Tarumae.PipelineNode = class {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.options = options;

    this.isRendered = false;
    this._input = null;

    this.width = options.width || renderer.renderPhysicalSize.width;
    this.height = options.height || renderer.renderPhysicalSize.height;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  process() {
    if (this.isRendered) return;
    this.isRendered = true;

    if (this._input) {
      this._input.process();
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
    this.renderer.setViewportToPhysicalRenderSize();
    this.renderer.renderBackground();
    this.renderer.renderFrame();
  }
};

Tarumae.PipelineNodes.SceneToImageRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options = { }) {
    super(renderer, options);

    this.nodes = [];
    this.buffer = null;

    this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height);
  }

  resize(width, height) {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;

      if (this.buffer) {
        this.buffer.destroy();
      }

      this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height);
    }
  }

  render() {
    if (this.shadowMap2DInput) {
      this.shadowMap2DInput.process();

      Tarumae.Renderer.Shaders.standard.instance._shadowMap2D = this.shadowMap2DInput.output;
    } else {
      Tarumae.Renderer.Shaders.standard.instance._shadowMap2D = undefined;
    }

    this.buffer.use();
    
    for (const node of this.nodes) {
      node.process();
    }

    this.renderer.renderBackground();
    this.renderer.renderFrame();
    
    this.buffer.disuse();
  }

  clear() {
    super.clear();

    if (this.shadowMap2DInput) {
      this.shadowMap2DInput.clear();
    }

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
  constructor(renderer, options = {}) {
    super(renderer);
    
    this.options = options;
    this.screenPlaneMesh = new Tarumae.ScreenMesh();
    
    if (options.flipTexcoordY !== false) {
      this.screenPlaneMesh.flipTexcoordY();
    }

    this.shader = Tarumae.Renderer.Shaders.screen.instance;
  }
  
  set input(node) {
    if (!node.output || (!(node.output instanceof Tarumae.Texture)
     && !(node.output instanceof WebGLTexture))) {
      throw "image renderer requires a texture input pipleline node";
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
        this.tex2Input.process();
        imageShader.tex2 = this.tex2Input.output;
      } else {
        imageShader.tex2 = undefined;
      }

      imageShader.texture = this._input.output;

      if (typeof this.enableAntialias !== "undefined") {
        imageShader.enableAntialias = this.enableAntialias;
      } else {
        imageShader.enableAntialias = false;
      }

      if (typeof this.gammaFactor !== "undefined") {
        imageShader.gammaFactor = this.gammaFactor;
      }

      this.renderer.setGLViewportSize(this.width, this.height);
      // this.renderer.setViewportToPhysicalRenderSize();

      imageShader.resolution[0] = this.width;
      imageShader.resolution[1] = this.height;

      if (typeof this.renderer.options.renderingImage.alpha !== "undefined") {
        imageShader.alpha = this.renderer.options.renderingImage.alpha;
      }

      this.renderer.useShader(imageShader);
      imageShader.beginMesh(this.screenPlaneMesh);
      this.screenPlaneMesh.draw(this.renderer);
      imageShader.endMesh();
      this.renderer.disuseCurrentShader();
    }
  }
};

Tarumae.ScreenMesh = class extends Tarumae.Mesh {
  constructor(x = -1, y = -1, w = 2, h = 2) {
		super();

		this.vertices = [x, y + h, 0, x, y, 0, x + w, y + h, 0, x + w, y, 0];
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

Tarumae.PipelineNodes.ImageFilterRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options = {}) {
    super(renderer, options);

    this.options = options;

    this.filter = options.filter || "linear-interp";
    this.flipTexcoordY = options.flipTexcoordY || true;

    this.screenPlaneMesh = new Tarumae.ScreenMesh();
    
    if (this.flipTexcoordY) {
      this.screenPlaneMesh.flipTexcoordY();
    }

    this.tex2Input = null;

    this.shader = Tarumae.Renderer.Shaders.image.instance;
    
    this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height, {
      depthBuffer: false,
      clearBackground: false,
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
      
      if (this.tex2Input) {
        this.tex2Input.process();
        imageShader.tex2 = this.tex2Input.output;
      } else {
        imageShader.tex2 = undefined;
      }

      if (typeof this.enableAntialias !== "undefined") {
        imageShader.enableAntialias = this.enableAntialias;
      } else {
        imageShader.enableAntialias = false;
      }

      if (typeof this.gammaFactor !== "undefined") {
        imageShader.gammaFactor = this.gammaFactor;
      }

      this.renderer.useShader(imageShader);

      switch (this.filter) {
        default:
        case "none": imageShader.filterType = 0; break;
        case "linear-interp": imageShader.filterType = 1; break;
        case "guassblur-hor": imageShader.filterType = 2; break;
        case "guassblur-ver": imageShader.filterType = 3; break;
        case "light-pass": imageShader.filterType = 4; break;
        case "blur3": imageShader.filterType = 5; break;
        case "blur5": imageShader.filterType = 6; break;
        case "antialias-simple": imageShader.filterType = 7; break;
        case "antialias-cross": imageShader.filterType = 8; break;
     }

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

    this.blurHorRenderer = new Tarumae.PipelineNodes.ImageFilterRenderer(renderer, options); 
    this.blurVerRenderer = new Tarumae.PipelineNodes.ImageFilterRenderer(renderer, options);
    this.blurHorRenderer.filter = 'guassblur-hor';
    this.blurVerRenderer.filter = 'guassblur-ver';
  }

  get output() {
    return this.blurVerRenderer.buffer.texture;
  }

  clear() {
    super.clear();

    this.blurHorRenderer.clear();
    this.blurVerRenderer.clear();
  }

  process() {
    if (typeof this.gammaFactor !== undefined) {
      this.blurVerRenderer.gammaFactor = this.gammaFactor;
    }

    this.blurHorRenderer.input = this._input;
    this.blurHorRenderer.process();

    this.blurVerRenderer.input = this.blurHorRenderer;
    this.blurVerRenderer.shader.isVertical = true;
    this.blurVerRenderer.process();
  }
};

Tarumae.PipelineNodes.ShadowMapRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options = { }) {
    super(renderer);

    this.width = options.width || 1280;
    this.height = options.height || 720;
  
    this.shader = Tarumae.Renderer.Shaders.shadowmap.instance;
    this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height);
  }

  render() {
    this.buffer.use();

    const scene = this.renderer.currentScene;

    // const gl = this.renderer.gl;
    // gl.disable(gl.CULL_FACE);
    // gl.cullFace(gl.FRONT);

    this.renderer.currentPipeline = this;

    this.renderer.useShader(this.shader);
    this.shader.beginScene(scene);

    for (let i = 0; i < scene.objects.length; i++) {
			this.drawObject(scene.objects[i]);
    }

    this.renderer.disuseCurrentShader();
    this.buffer.disuse();

    this.renderer.currentPipeline = null;

    // gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.BACK);
  }

  drawObject(obj) {
    if (obj instanceof Tarumae.Camera || obj.castShadow === false) {
      return;
    }

    this.shader.beginObject(obj);

    if (!obj.type || obj.type === Tarumae.ObjectTypes.GenericObject) {
      for (let i = 0; i < obj.meshes.length; i++) {
        var mesh = obj.meshes[i];
        if (mesh && this.renderer.options.enableDrawMesh) {
          this.shader.beginMesh(mesh);
          mesh.draw(this.renderer);
          this.shader.endMesh(mesh);
        }
      }
    }

    for (let i = 0; i < obj.objects.length; i++) {
			this.drawObject(obj.objects[i]);
    }

    this.shader.endObject(obj);
  }

  get output() {
    return this.buffer.texture;
  }
};

Tarumae.PipelineNodes.MultipleImagePreviewRenderer = class extends Tarumae.PipelineNode {

  constructor(renderer, options = {}) {
    super(renderer, options);
    
    this.rows = this.options.rows || 2;
    this.columns = this.options.columns || 2;
    this.previewWidth = 2 / this.columns;
    this.previewHeight = 2 / this.rows;
    this.shader = Tarumae.Renderer.Shaders.screen.instance;

    this.nodes = [];
    this.meshes = [];
  }

  addPreview(piplelineRenderer) {
    if (!piplelineRenderer) return;

    const x = -1.0 + Math.floor(this.nodes.length % this.columns),
      y = -1.0 + Math.floor(this.nodes.length / this.rows);
    const mesh = new Tarumae.ScreenMesh(x * this.previewWidth, y * this.previewHeight,
      this.previewWidth, this.previewHeight);

    mesh.flipTexcoordY();

    this.nodes.push(piplelineRenderer);
    this.meshes.push(mesh);
  }

  clear() {
    super.clear();

    for (const pipeline of this.nodes) {
      pipeline.clear();
    }
  }

  render() {
    const shader = this.shader;

    if (typeof this.enableAntialias !== "undefined") {
      shader.enableAntialias = this.enableAntialias;
    } else {
      shader.enableAntialias = false;
    }

    for (let i = 0; i < this.nodes.length; i++) {
      const pipeline = this.nodes[i];
      pipeline.process();

      const mesh = this.meshes[i];
      shader.texture = pipeline.output;
      shader.enableAntialias = false;
      shader.tex2 = undefined;
      shader.resolution[0] = this.width;
      shader.resolution[1] = this.height;

      this.renderer.setGLViewportSize(this.width, this.height);
      this.renderer.useShader(shader);
      shader.beginMesh(mesh);
      mesh.draw(this.renderer);
      shader.endMesh();
      this.renderer.disuseCurrentShader();
    }
  
  }
}
