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

  destroy() { }
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

  destroy() {
    this.input = null;

    if (this.buffer) {
      this.buffer.destroy();
    }
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
    
    if (this.options.width) {
      this.width = this.options.width;
    }

    if (this.options.height) {
      this.height = this.options.height;
    }
    
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
    if (this._input && this._input.output) {

      const imageShader = this.shader;

      if (this.tex2Input) {
        this.tex2Input.process();
        imageShader.tex2 = this.tex2Input.output;
      } else {
        imageShader.tex2 = null;
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
      // this.renderer.setGLViewportSize(this.renderer.renderLogicalSize.width,
      //   this.renderer.renderLogicalSize.height);
      
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

      // this.renderer.setViewportToPhysicalRenderSize();
      // this.renderer.setGLViewportSize(this.renderer.renderLogicalSize.width,
      //   this.renderer.renderLogicalSize.height);
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
    this.tex2Filter = options.tex2Filter || "none";

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
      throw "image renderer requires a texture input pipleline node";
    }
    super.input = node;
  }

  get output() {
    return this.buffer.texture;
  }

  clear() {
    super.clear();
  
    if (this.tex2Input) {
      this.tex2Input.clear();
    }
  }

  render() {
    if (this._input && this._input.output) {
      const imageShader = this.shader;
      imageShader.texture = this._input.output;
      
      if (this.tex2Input) {
        this.tex2Input.process();
        imageShader.tex2 = this.tex2Input.output;
        imageShader.tex2Intensity = this.options.tex2Intensity || 1.0;
      } else {
        imageShader.tex2 = null;
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
        case "ssao": imageShader.filterType = 20; break;
     }
    
      switch (this.tex2Filter) {
        default:
        case "none": imageShader.tex2FilterType = 0; break;
        case "add": imageShader.tex2FilterType = 1; break;
        case "sub": imageShader.tex2FilterType = 2; break;
        case "lighter": imageShader.tex2FilterType = 3; break;
        case "darker": imageShader.tex2FilterType = 4; break;
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

  destroy() {
    super.destroy();

    this.input = null;
    
    if (this.buffer) {
      this.buffer.destroy();
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

    this.blurVerRenderer.input = this.blurHorRenderer;
    this.blurVerRenderer.shader.isVertical = true;
  }

  get input() {
    return this.blurHorRenderer.input;
  }

  set input(v) {
    this.blurHorRenderer.input = v;
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

    this.blurHorRenderer.process();
    this.blurVerRenderer.process();
  }

  destroy() {
    this.blurHorRenderer.destroy();
    this.blurVerRenderer.destroy();

    super.destroy();
  }
};

////////////////////////////////////////////////////////////////////////////////

Tarumae.PipelineNodes.ShadowMapRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options = { }) {
    super(renderer);

    this.width = options.width || 1280;
    this.height = options.height || 720;
  
    this.cacheDirty = true;

    this.shader = Tarumae.Renderer.Shaders.shadowmap.instance;
    this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height);
  }

  render() {
    const scene = this.renderer.currentScene;


    this.buffer.use();

    // const gl = this.renderer.gl;
    // gl.cullFace(gl.FRONT);

    this.renderer.useShader(this.shader);
    this.shader.beginScene(scene);

    for (let i = 0; i < scene.objects.length; i++) {
			this.drawObject(scene.objects[i]);
    }

    this.renderer.disuseCurrentShader();
    this.buffer.disuse();

    // gl.cullFace(gl.BACK);
  }

  drawObject(obj) {
    if (obj instanceof Tarumae.Camera || obj.castShadow === false) {
      return;
    }

    this.shader.beginObject(obj);

    if (!obj.type || obj.type === Tarumae.ObjectTypes.GenericObject) {
      for (const mesh of obj.meshes) {
        if (mesh && this.renderer.options.enableDrawMesh) {
          this.shader.beginMesh(mesh);
          mesh.draw(this.renderer);
          this.shader.endMesh(mesh);
        }
      }
    }

    for (const child of obj.objects) {
			this.drawObject(child);
    }

    this.shader.endObject(obj);
  }

  get output() {
    return this.buffer.texture;
  }

  destroy() {    
    this.input = null;
    
    if (this.buffer) {
      this.buffer.destroy();
    }

    super.destroy();
  }
};

Tarumae.PipelineNodes.ShadowMapBlurCacheRenderer = class extends Tarumae.PipelineNodes.BlurRenderer {
  constructor(renderer, options) {
    super(renderer, options);
  }

  process() {
    
    if (this.renderer.options.enableShadow === false) return;

    const scene = this.renderer.currentScene;

    if (!this.renderer.options.shadowQuality.enableCache
      || scene.shadowMapUpdateRequested) {

        scene.shadowMapUpdateRequested = false;
      super.process();
      
      if (this.renderer.debugger) {
        this.renderer.debugger.shadowRenderCount++;
      }
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

Tarumae.PipelineNodes.AttributeRenderer = class extends Tarumae.PipelineNode {
  constructor(renderer, options = { }) {
    super(renderer);

    this.width = options.width || 1280;
    this.height = options.height || 720;

    this.type = options.type;
  
    this.shader = Tarumae.Renderer.Shaders.attributemap.instance;
    this.buffer = new Tarumae.FrameBuffer(this.renderer, this.width, this.height);
  }

  render() {
    this.buffer.use();

    const scene = this.renderer.currentScene;

    this.shader.type = this.type;

    this.renderer.useShader(this.shader);
    this.shader.beginScene(scene);

    for (const obj of scene.objects) {
			this.drawObject(obj);
    }

    this.renderer.disuseCurrentShader();
    this.buffer.disuse();
  }

  drawObject(obj) {
    if (obj instanceof Tarumae.Camera) {
      return;
    }

    this.shader.beginObject(obj);

    if (!obj.type || obj.type === Tarumae.ObjectTypes.GenericObject) {
      for (const mesh of obj.meshes) {
        if (mesh && this.renderer.options.enableDrawMesh) {
          this.shader.beginMesh(mesh);
          mesh.draw(this.renderer);
          this.shader.endMesh(mesh);
        }
      }
    }

    for (const child of obj.objects) {
			this.drawObject(child);
    }

    this.shader.endObject(obj);
  }

  get output() {
    return this.buffer.texture;
  }

  destroy() {    
    this.input = null;
    
    if (this.buffer) {
      this.buffer.destroy();
    }

    super.destroy();
  }
};

////////////////////////////////////////////////////////////////////////////////

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

    for (const node of this.nodes) {
      node.clear();
    }
  }

  render() {
    const shader = this.shader;

    if (typeof this.enableAntialias !== "undefined") {
      shader.enableAntialias = this.enableAntialias;
    } else {
      shader.enableAntialias = false;
    }

    for (let i = 0; i < this.nodes.length;i++) {
      const node = this.nodes[i];
      node.process();

      const mesh = this.meshes[i];
      shader.texture = node.output;
      shader.enableAntialias = false;
      shader.tex2 = null;
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

  destroy() {
    for (const node of this.nodes) {
      node.destroy();
    }

    for (const mesh of this.meshes) {
      mesh.destroy();
    }
  }
}
