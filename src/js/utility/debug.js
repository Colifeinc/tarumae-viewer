////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"

Tarumae.Debugger = class {
  constructor(renderer) {
  this.renderer = renderer;

  this.showDebugPanel = false;  
  this.showObjectBoundingBox = false;
  
  this.lastRaycastElapsedTime = 0;
  this.totalFrameRenderingTime = 0;
  this.averageFrameRenderingTime = 0;
  this.lightSourceFilterElapsedTime = 0;
  this.navmeshCheckElapsedTime = 0;
  this.currentLightCount = 0;
  this.totalMeshMemoryUsed = 0;
  this.totalNumberOfTexturesUsed = 0;
  this.totalNumberOfPolygonBound = 0;

  this._maxPathLength = 30;

  this.fpsMonitor = {
    enabled: true,
    currentFPS: 0,
    countingFPS: 0,
    maxFPS: 0,
    minFPS: 0,
    fpsRecord: [],
    maxFPSNumberOfRecord: 20,
    indicatorWidth: 80,
    indicatorHeight: 30,
  };

  this.elapsedTime = {
    drawFrameBegin: 0,
    drawFrameEnd: 0,
    raycastBegin: null,
    raycastEnd: null,
    lightFilterBegin: null,
    lightFilterEnd: null,
    navmeshCheckBegin: null,
    navmeshCheckEnd: null,
  };

  var debugPanel = document.createElement("div");
  debugPanel.style.top = "0px";
  debugPanel.style.left = "0px";
  debugPanel.style.minWidth = "500px";
  debugPanel.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
  debugPanel.style.position = "absolute";
  debugPanel.style.fontFamily = "monospace";
  debugPanel.style.color = "black";
  debugPanel.style["text-shadow"] = "0px 0px 1px #ffffff";
  debugPanel.style.display = "none";
  renderer.container.appendChild(debugPanel);

  var fpsCanvas = document.createElement("canvas");
  fpsCanvas.style.top = "0px";
  fpsCanvas.style.left = (this.renderer.container.clientWidth - this.fpsMonitor.indicatorWidth) + "px";
  fpsCanvas.style.width = this.fpsMonitor.indicatorWidth + "px";
  fpsCanvas.style.height = this.fpsMonitor.indicatorHeight + "px";
  fpsCanvas.width = this.fpsMonitor.indicatorWidth;
  fpsCanvas.height = this.fpsMonitor.indicatorHeight;
  fpsCanvas.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  fpsCanvas.style.position = "absolute";
  fpsCanvas.style.display = "none";
  renderer.container.appendChild(fpsCanvas);

  var objInfoPanel = document.createElement("div");
  objInfoPanel.style.bottom = "0px";
  objInfoPanel.style.left = "0px";
  objInfoPanel.style.backgroundColor = "rgba(0, 50, 50, 0.2)";
  objInfoPanel.style.position = "absolute";
  objInfoPanel.style.fontFamily = "monospace";
  objInfoPanel.style.color = "black";
  objInfoPanel.style["text-shadow"] = "0px 0px 1px #ffffff";
  objInfoPanel.style.display = "none";
  renderer.container.appendChild(objInfoPanel);
  
  this.debugPanel = debugPanel;
  this.fpsCanvas = fpsCanvas;
  this.objInfoPanel = objInfoPanel;

  this.ctx = fpsCanvas.getContext("2d");
  }
  
  beforeDrawFrame() {
    this.elapsedTime.drawFrameBegin = Date.now();
  }

  afterDrawFrame() {
    var now = Date.now();

    this.countFPS(now);
    
    this.elapsedTime.drawFrameEnd = now;
    this.totalFrameRenderingTime += this.elapsedTime.drawFrameEnd - this.elapsedTime.drawFrameBegin;

    this.renderDebugPanel();
    this.drawFPSRecord();
  }

  beforeRaycast() {
    this.elapsedTime.raycastBegin = Date.now();
  }

  afterRaycast() {
    this.lastRaycastElapsedTime = Date.now() - this.elapsedTime.raycastBegin;
  }

  beforeSelectLightSource() {
    this.elapsedTime.lightFilterBegin = Date.now();
  }

  afterSelectLightSource() {
    this.lightSourceFilterElapsedTime = Date.now() - this.elapsedTime.lightFilterBegin;
  }

  beforeNavmeshMovementCheck() {
    this.elapsedTime.navmeshCheckBegin = Date.now();
  }

  afterNavmeshMovementCheck() {
    this.navmeshCheckElapsedTime = Date.now() - this.elapsedTime.navmeshCheckBegin;
  }

  countFPS(now) {
    var fm = this.fpsMonitor;

    // convert to minutes    
    if (Math.floor(now * 0.000001667) !== Math.floor(this.elapsedTime.drawFrameEnd * 0.000001667)) {
      fm.minFPS = 0;
      fm.maxFPS = 0;
    }

    if (Math.floor(now * 0.001) === Math.floor(this.elapsedTime.drawFrameEnd * 0.001)) {
      fm.countingFPS++;
    } else {
      fm.currentFPS = fm.countingFPS;

      if (fm.minFPS > fm.currentFPS || fm.minFPS == null) fm.minFPS = fm.currentFPS;
      if (fm.maxFPS < fm.currentFPS) fm.maxFPS = fm.currentFPS;

      fm.countingFPS = 0;
      fm.fpsRecord.splice(0, 0, fm.currentFPS);

      if (fm.fpsRecord.length > fm.maxFPSNumberOfRecord) {
        fm.fpsRecord = fm.fpsRecord.slice(0, fm.maxFPSNumberOfRecord);
      }

      this.averageFrameRenderingTime = fm.currentFPS <= 0 ? 0 : (this.totalFrameRenderingTime / fm.currentFPS);
      this.totalFrameRenderingTime = 0;
    }
  }

  drawFPSRecord() {
    var ctx = this.ctx;
    var fm = this.fpsMonitor;

    ctx.clearRect(0, 0, fm.indicatorWidth, fm.indicatorHeight);
    ctx.fillStyle = "#55bbbb";

    var width = (fm.indicatorWidth - 2) / fm.maxFPSNumberOfRecord;

    for (var i = 0; i < fm.maxFPSNumberOfRecord && i < fm.fpsRecord.length; i++) {
      var fps = fm.fpsRecord[i];

      // var height = fps / fm.maxFPS * fm.indicatorHeight - 2;
      var height = fps / 60 /* assume max is 60 instead of fm.maxFPS */ * fm.indicatorHeight - 2;

      ctx.fillRect(fm.indicatorWidth - width - 1 - i * width, fm.indicatorHeight - height - 1, width, height);
    }
  }

  drawBoundingBox(obj, transformStack) {
    if (this.showObjectBoundingBox) {
			var bbox = obj.getBoundsWithTransform(transformStack);
			this.renderer.drawBox(bbox, 1.5, "#6666aa");
		}
  }

  renderDebugPanel() {
    if (this.showDebugPanel) {
      this.debugPanel.style.display = "initial";
      this.fpsCanvas.style.display = "initial";
      this.debugPanel.innerHTML = this.renderDebugInfo();
    } else {
      this.debugPanel.style.display = "none";
      this.fpsCanvas.style.display = "none";
    }
  }

  renderDebugInfo() {
  	var tarumaeversion = typeof TarumaeRenderer.Version === "object" ? TarumaeRenderer.Version.toString() : "development version";

    var fm = this.fpsMonitor;
    
    return this.generateDebugInfo("<br/>");
  }

  generateDebugInfo(newline) {
  	var tarumaeversion = typeof TarumaeRenderer.Version === "object" ? TarumaeRenderer.Version.toString() : "development version";

    var fm = this.fpsMonitor;

    var toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;
    
    return "<b>Tarumae (" + tarumaeversion + ")</b>" + newline + newline
      + "FPS: " + toStringDigits(fm.currentFPS, 2) + " ~ " + toStringDigits(fm.maxFPS, 2) + ")" + newline
      + "average frame rendering time: " + toStringDigits(this.averageFrameRenderingTime, 2) + " ms." + newline
      + "last raycast operation time: " + toStringDigits(this.lastRaycastElapsedTime, 2) + " ms." + newline
      + "current enabled lights: " + this.currentLightCount + newline
      + "light source filter time: " + this.lightSourceFilterElapsedTime + " ms." + newline
      + "navmesh movement check time: " + this.navmeshCheckElapsedTime + " ms." + newline
      + "total number of polygons bound: " + this.totalNumberOfPolygonBound + newline
      + "total mesh memory used: " + this.totalMeshMemoryUsed + " bytes" + newline
      + "total number of textures used: " + this.totalNumberOfTexturesUsed + newline
      + "";
  }

  showObjectInfoPanel(obj) {
    if (this.objInfoPanel) {
      var toStringDigits = Tarumae.Utility.NumberExtension.toStringWithDigits;

      var html = (obj.name ? this.getShorterUrl(obj.name) : "&lt;unnamed&gt;") + "<br/><br/>";
      
      html += "local: " + obj.location.toString() + "<br/>"
        + "world: " + obj.getWorldLocation().toString() + "<br/>"
        + "angle: " + obj.angle.toString() + "<br/>"
        + "scale: " + obj.scale.toString() + "<br/>"
        + "polys: " + obj.polygonCount + "<br/><br/>";
      
      var bbox = obj.getBounds();
      if (bbox) {
        bbox = new Tarumae.BoundingBox(bbox);
        html += "bbmin: " + bbox.min.toArrayDigits() + "<br/>"
          + "bbmax: " + bbox.max.toArrayDigits() + "<br/>"
          + "bborg: " + bbox.origin.toArrayDigits() + "<br/>"
          + "bbsiz: " + bbox.size.toArrayDigits() + "<br/><br/>";
      }
      
      if (obj.mat) {
        html
          += (obj.mat.name ? ("mat&nbsp;&nbsp;: " + obj.mat.name) : "") + "<br/>"
          + "color: " + (obj.mat.color ? obj.mat.color.toString() : "<default>") + "<br/>"
          + "gloss: " + (!isNaN(obj.mat.glossy) ? toStringDigits(obj.mat.glossy) : 0) + "<br/>"
          + "rough: " + (!isNaN(obj.mat.roughness) ? toStringDigits(obj.mat.roughness) : 0.5) + "<br/>"
          + "trans: " + (!isNaN(obj.mat.transparency) ? toStringDigits(transparency) : 0) + "<br/>"
          + "tilng: " + (obj.mat.texTiling ? obj.mat.texTiling.toString() : "[1, 1]") + "<br/>";

        if (obj.mat.normalMipmap) {
          html += "normip: " + (obj.mat.normalMipmap ? toStringDigits(normalMipmap) : 0) + "<br/>";
        }
        
        if (obj.mat.emission) {
          html += "emiss: " + (obj.mat.emission ? toStringDigits(emission) : 0) + "<br/>";
        }
        
        if (obj.mat.spotRange) {
          html += "sptrn: " + (obj.mat.spotRange ? toStringDigits(spotRange) : 0) + "<br/>";
        }

        if (typeof obj.mat.tex === "string") {
          html += "tex: " + this.getShorterUrl(obj.mat.tex) + "<br/>";

          if (typeof obj.mat.normalmap === "string") {
            html += "nor: " + this.getShorterUrl(obj.mat.normalmap) + "<br/>";
          }
        } else if (typeof obj.mat.tex === "object" && obj.mat.tex instanceof Tarumae.Texture && obj.mat.tex.image) {
          html += "tex: <img src='" + obj.mat.tex.image.src + "' style='width:100px;'/>";

          if (typeof obj.mat.normalmap === "object" && obj.mat.normalmap instanceof Tarumae.Texture && obj.mat.normalmap.image) {
            html += "&nbsp;nor: <img src='" + obj.mat.normalmap.image.src + "' style='width:100px;'/><br/>";
          } else {
            html += "<br/>";
          }
        }
      }

      html += "<br/>";

      if (obj.lightmap && (obj.lightmap instanceof Tarumae.Texture)) {
        html += "ltmap: <img src='" + obj.lightmap.image.src + "' style='width:100px;'/><br/>";
      }

      if (obj.refmap && (obj.refmap instanceof Tarumae.CubeMap)) {
        html += "rfmap: yes<br/>";
      }

      this.objInfoPanel.innerHTML = html;
      this.objInfoPanel.style.display = "initial";
    }
  }

  hideObjectInfoPanel() {
    if (this.objInfoPanel) this.objInfoPanel.style.display = "none";
  }

  getShorterUrl(url) {
    return (url.length > this._maxPathLength) ? ("..." + url.substr(url.length - this._maxPathLength, this._maxPathLength)) : url;
  }
  
  static get status() {
    if (this.currentScene && this.currentScene.renderer && this.currentScene.renderer.debugger) {
      return this.currentScene.renderer.debugger.generateDebugInfo("\n");
    }
  }

  static dumpCameraPose() {
    var scene = this.currentScene;
    if (scene) {
      var camera = scene.mainCamera;
      if (camera) {
        var str = "scene.mainCamera.location.set(" + camera.location.toArrayDigits() + ");\n";
        str += "scene.mainCamera.angle.set(" + camera.angle.toArrayDigits() + ");"
        return str;
      }
    }
  }
}

