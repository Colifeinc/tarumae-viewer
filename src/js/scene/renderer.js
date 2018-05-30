////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import "../utility/utility";
import { Vec2, Vec3, Vec4, Color3, Color4, Point } from "../math/vector";
import "../scene/scene";
import "../webgl/shader";
import { Debugger } from "../utility/debug";

//import fs from "fs";

Tarumae.Renderer = class {
	constructor(options) {

		this.initialized = false;
		this.debugMode = false;
		this.developmentVersion = false;

		if (typeof Tarumae.Renderer.Version === "object") {
			var ver = Tarumae.Renderer.Version;
			ver.toString = function() {
				return ver.major + "." + ver.minor + "." + ver.build + "." + ver.revision;
			};
			console.debug("tarumae v" + ver);
		} else {
			this.debugMode = true;
			this.developmentVersion = true;
			console.debug("tarumae (development version)");
		}

		if (typeof options === "undefined") {
			this.options = {};
		} else {
			this.options = options;
		}

		// container
		if (typeof this.options.containerId === "undefined") {
			this.options.containerId = "canvas-container";
		}

		this.container = document.getElementById(this.options.containerId);

		if (!this.container) {
			console.error("Cannot find canvas container");
			return;
		}

		// 3d canvas
		var canvas3d = document.createElement("canvas");
		this.canvas = canvas3d;
		this.container.appendChild(this.canvas);

		var gl;

		try {
			gl = this.canvas.getContext("webgl");
			if (!gl) gl = this.canvas.getContext("experimental-webgl");
		} catch (e) {
			console.error("cannot create webgl context: " + e);
		}

		if (!gl) {
			console.error("failed to initialize WebGL context.");
			return;
		}

		this.gl = gl;

		// 2d canvas
		this.canvas2d = document.createElement("canvas");
		this.container.appendChild(this.canvas2d);
		try {
			this.ctx = this.canvas2d.getContext("2d");
		} catch (e) {
			this.ctx = null;
		}

		// surface div
		this.surface = document.createElement("div");
		this.surface.className = "surface";
		this.surface.focus();
		this.container.appendChild(this.surface);

		// styles
		this.setContainerStyle();

		// init options
		this.initOptions(this.options);

		// debug mode
		if (this.debugMode) {
			this.debugger = new Tarumae.Debugger(this);
		}

		this.drawingContext2D = new Tarumae.DrawingContext2D(this.canvas2d, this.ctx);

		this.currentScene = null;
		this.current2DScene = null;
	
		this.wireframe = false;
		this.aspectRate = 1.0;
		this.transparencyList = [];

		this.respool = new Tarumae.ResourcePool();

		// matrices
		this.projectMatrix = new Tarumae.Matrix4();
		this.viewMatrix = new Tarumae.Matrix4();
		this.cameraMatrix = new Tarumae.Matrix4();
		this.modelMatrix = new Tarumae.Matrix4();

		this.gl = gl;

		// load shaders
		this.currentShader = null;
		this.shaderStack = [];

		if (typeof this.options.defaultShader === "undefined") {
			this.options.defaultShader = "standard";
		}

		this.aspectRate = 1;
		this.renderSize = { width: 0, height: 0 };

		var renderer = this;

		if (this.options.enableShadow && typeof Tarumae.FrameBuffer === "function") {
			this.shadowFrameBuffer = new Tarumae.FrameBuffer(this, 2048, 2048, Color4.white);
		}

		if (typeof Tarumae.StencilBuffer === "function") {
			this.stencilBuffer = new Tarumae.StencilBuffer(this);
		}

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		window.addEventListener("resize", (function() { renderer.resetViewport(); }), false);

		this.resetViewport();

		if (typeof Tarumae.Viewer === "function") {
			this.viewer = new Tarumae.Viewer(this);
		} else {
			this.viewer = null;
		}

		this.cachedMeshes = {};
		this.cachedTextures = {};
		this.cachedImages = {};

		var downloader = new Tarumae.ResourceManager();
		downloader.downloadShaders = [];

		// create shader programs either from server or tarumae.js
		Tarumae.Renderer.Shaders._s3_foreach(function(name, shaderDefine) {
			// load shader source from tarumae.js
			renderer.loadShader(shaderDefine, shaderDefine.vert, shaderDefine.frag);
		});

		renderer.init();

		requestAnimationFrame(function() {
			renderer.drawFrame();
		});
	}

	setContainerStyle() {
		var containerId = this.options.containerId;
		var tagId = "tarumae-stylesheet";
	
		if (document.getElementById(tagId) !== null) {
			document.getElementById(tagId).remove();
		}
	
		var styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		styleSheet.media = "screen";
		styleSheet.id = tagId;
		document.getElementsByTagName("head").item(0).appendChild(styleSheet);
		var css = styleSheet.sheet;
	
		// for (var value of Tarumae.Renderer.ContainerStyle) {
		// 	var rule = value.replace(/#canvas-container/g, "#" + containerId);
		// 	css.insertRule(rule, 0);
		// }
		for (var i = 0; i < Tarumae.Renderer.ContainerStyle.length; i++) {
			var value = Tarumae.Renderer.ContainerStyle[i];
			var rule = value.replace(/#canvas-container/g, "#" + containerId);
			css.insertRule(rule, 0);
		}
	}
	
	initOptions(options) {
		// options
	
		if (typeof options.renderPixelRatio === "undefined") {
			options.renderPixelRatio = 1;
		}
	
		if (typeof options.enableShadow === "undefined") {
			options.enableShadow = false;
		}
	
		if (typeof options.enableEnvmap === "undefined") {
			options.enableEnvmap = true;
		}
	
		// perspective
		if (typeof options.perspective === "undefined") {
			options.perspective = {};
		}
	
		if (typeof options.perspective.method === "undefined") {
			options.perspective.method = Tarumae.ProjectionMethods.Persp;
		}
	
		if (typeof options.perspective.angle === "undefined") {
			options.perspective.angle = 50.0;
		}
	
		if (typeof options.perspective.near === "undefined") {
			options.perspective.near = 0.01;
		}
	
		if (typeof options.perspective.far === "undefined") {
			options.perspective.far = 100.0;
		}
	
		// swtiches
		if (typeof options.enableDrawMesh === "undefined") {
			options.enableDrawMesh = true;
		}
	
		if (typeof options.enableCustomDraw === "undefined") {
			options.enableCustomDraw = true;
		}
	
		if (typeof options.enableLighting === "undefined") {
			options.enableLighting = true;
		}
	
		if (typeof options.enableLightmap === "undefined") {
			options.enableLightmap = true;
		}
	
		if (typeof options.enableNormalMap === "undefined") {
			options.enableNormalMap = true;
		}
	
		if (typeof options.enableEnvmap === "undefined") {
			options.enableEnvmap = true;
		}
	
		if (typeof options.enableHighlightSelectedChildren === "undefined") {
			options.enableHighlightSelectedChildren = true;
		}
	
		if (options.debugMode === true) {
			this.debugMode = options.debugMode;
		}
	
		// background color
		if (typeof options.backColor === "undefined") {
			options.backColor = new Color4(0.93, 0.93, 0.93, 1.0);
		}
	}

	get renderPixelRatio() {
		return this.options.renderPixelRatio;
	}
	
	set renderPixelRatio(val) {
		this.options.renderPixelRatio = val;
		this.resetViewport();
	}

	resetViewport() {
		var size = this.renderSize;
	
		size.width = this.container.clientWidth;
		size.height = this.container.clientHeight;
	
		this.aspectRate = size.width / size.height;
	
		// 3d
		this.canvas.width = size.width * this.options.renderPixelRatio;
		this.canvas.height = size.height * this.options.renderPixelRatio;
		this.gl.viewport(0, 0, size.width * this.options.renderPixelRatio, size.height * this.options.renderPixelRatio);
	
		// 2d
		this.canvas2d.width = size.width;
		this.canvas2d.height = size.height;
	
		if (this.currentScene) {
			this.currentScene.requireUpdateFrame();
		}
	}
	
	init() {
		var renderer = this;
	
		renderer.initialized = true;
	
		// apply default shader
		renderer.useShader(renderer.options.defaultShader);
	
		Tarumae.Utility.invokeIfExist(renderer, "oninit");
	
		if (renderer.currentScene) {
			renderer.currentScene.requireUpdateFrame();
		}
	
		console.debug("renderer initialized.");
	}
	
	loadShader(shaderDefine, vertSource, fragSource) {
		var renderer = this;
	
		var shader = new Tarumae[shaderDefine.class](renderer, vertSource, fragSource);
		shaderDefine.instance = shader;
		Tarumae.Utility.invokeIfExist(shaderDefine, "oncreate");
	}
	
	useShader(shader) {
		if (!shader) return;
	
		if (!this.initialized) {
			this.options.defaultShader = shader;
		} else {
			var shaderDefine = Tarumae.Renderer.Shaders[shader];
	
			if (typeof shaderDefine !== "undefined"
				&& shaderDefine.instance instanceof Tarumae.Shader) {
	
				var shaderInstance = shaderDefine.instance;
	
				this.shaderStack.push(shaderInstance);
				shaderInstance.use();
	
				return shaderInstance;
			}
		}
	
		return null;
	}
	
	getCurrentShader() {
		return this.shaderStack[this.shaderStack.length - 1];
	}
	
	useCurrentShader() {
		var shader = this.getCurrentShader();
		shader.use();
	}
	
	disuseCurrentShader() {
		if (this.shaderStack.length > 1) {
			this.shaderStack.pop();
			var shader = this.shaderStack[this.shaderStack.length - 1];
			shader.use();
		}
	}
	
	clear() {
		var gl = this.gl;
	
		var backColor = this.options.backColor;
	
		this.ctx.clearRect(0, 0, this.canvas2d.width, this.canvas2d.height);
		this.ctx2dCleared = true;
	
		gl.clearColor(backColor.r, backColor.g, backColor.b, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	
	perspectiveProject(m) {
		var afov = this.getAfov();
	
		m.perspective(afov, this.aspectRate,
			this.options.perspective.near, this.options.perspective.far);
	}
	
	orthographicProject(m) {
		var scale = ((this.viewer.originDistance - 0.5) * 10);
		m.ortho(-this.aspectRate * scale, this.aspectRate * scale, -scale, scale, -this.options.perspective.far, this.options.perspective.far);
	}
	
	getAfov() {
		var scene = this.currentScene;
	
		if (scene && scene.mainCamera && typeof scene.mainCamera.fieldOfView !== "undefined") {
			return scene.mainCamera.fieldOfView;
		} else {
			return this.options.perspective.angle;
		}
	}
	
	drawFrame() {
	
		if (this.initialized) {
	
			this.ctx2dCleared = false;
	
			var scene = this.currentScene;
	
			if (scene && (scene.animation || scene.requestedUpdateFrame)) {
	
				if (this.debugMode) {
					this.debugger.beforeDrawFrame();
				}
	
				var projectionMethod = ((this.currentScene && this.currentScene.mainCamera)
					? (this.currentScene.mainCamera.projectionMethod)
					: (this.options.perspective.method));
	
				switch (projectionMethod) {
					default:
					case Tarumae.ProjectionMethods.Persp:
					case "persp":
						this.perspectiveProject(this.projectMatrix);
						break;
	
					case Tarumae.ProjectionMethods.Ortho:
					case "ortho":
						this.orthographicProject(this.projectMatrix);
						break;
				}
	
				this.drawSceneFrame(scene);
	
				if (this.debugMode) {
					this.debugger.afterDrawFrame();
				}
			}
	
			if (this.current2DScene && (this.current2DScene.animation || this.current2DScene.requestedUpdateFrame)) {
				if (!this.ctx2dCleared) {
					this.ctx.clearRect(0, 0, this.canvas2d.width, this.canvas2d.height);
				}
	
				this.current2DScene.render(this.drawingContext2D);
				this.current2DScene.requestedUpdateFrame = false;
			}
		}
	
		var renderer = this;
	
		requestAnimationFrame(function() {
			renderer.drawFrame();
		});
	}
	
	drawSceneFrame(scene) {
		this.clear();
	
		this.cameraMatrix.loadIdentity();
		this.viewMatrix.loadIdentity();
		this.transparencyList._s3_clear();
	
		if (!scene) return;
	
		if (scene.mainCamera) {
			this.makeCameraMatrix(scene.mainCamera, this.cameraMatrix);
		}
	
		this.makeViewMatrix(this.viewMatrix);
	
		this.projectionViewMatrix = this.viewMatrix.mul(this.cameraMatrix).mul(this.projectMatrix);
		this.projectionViewMatrixArray = this.projectionViewMatrix.toArray();
	
		if (this.currentShader) {
			Tarumae.Utility.invokeIfExist(this.currentShader, "beginScene", scene);
		}
	
		if (this.debugger) {
			this.debugger.totalNumberOfObjectDrawed = 0;
			this.debugger.totalNumberOfPolygonDrawed = 0;
		}

		for (var i = 0; i < scene.objects.length; i++) {
			this.drawObject(scene.objects[i], false);
		}
	
		// this.useShader("simple");
		this.currentShader.beginScene(scene);
	
		// draw transparency objects
		for (var j = 0; i < this.transparencyList.length; j++) {
			this.drawObject(this.transparencyList[j], true);
		}
	
		// this.disuseCurrentShader();
	
		// draw selected objects
		if (Array.isArray(scene.selectedObjects)) {
			for (var k = 0; k < scene.selectedObjects.length; k++) {
				var obj = scene.selectedObjects[k];
				if (obj.visible) {
					this.drawHighlightObject(obj, new Color4(0.1, 0.6, 1.0, 0.5));
	
					if (this.options.enableHighlightSelectedChildren) {
						this.drawHighlightChildren(obj, new Color4(0.1, 1.0, 0.6, 0.5));
					}
				}
			}
		}
	
		// draw hover object
		// if (scene.hoverObject) {
		// 	this.drawHighlightObject(scene.hoverObject, new Color4(1.0, 0.5, 0.0, 0.5));
		// }
	
		scene.drawFrame(this);
	
		if (this.currentShader) {
			Tarumae.Utility.invokeIfExist(this.currentShader, "endScene", scene);
		}
	}
	
	makeCameraMatrix(camera, m) {
	
		var plist = [];
		var parent = camera.parent;
	
		while (parent) {
			plist.push(parent);
			parent = parent.parent;
		}
	
		// scale
		for (var i = plist.length - 1; i >= 0; i--) {
			var obj = plist[i];
	
			m.scale(1 / obj.scale.x, 1 / obj.scale.y, 1 / obj.scale.z);
		}
	
		m.scale(1 / camera.scale.x, 1 / camera.scale.y, 1 / camera.scale.z);
	
		// rotate
		for (let i = plist.length - 1; i >= 0; i--) {
			let obj = plist[i];
	
			m.rotate(-obj.angle.x, -obj.angle.y, -obj.angle.z);
		}
	
		m.rotate(-camera.angle.x, -camera.angle.y, -camera.angle.z);
	
		// translate
		for (let i = plist.length - 1; i >= 0; i--) {
			let obj = plist[i];
	
			m.translate(-obj.location.x, -obj.location.y, -obj.location.z);
		}
	
		m.translate(-camera.location.x, -camera.location.y, -camera.location.z);
	
		return m;
	}
	
	getCameraRotationMatrix(camera) {
	
		var plist = [];
		var parent = camera.parent;
	
		while (parent) {
			plist.push(parent);
			parent = parent.parent;
		}
	
		var m = new Tarumae.Matrix4().loadIdentity();
	
		for (var i = plist.length - 1; i >= 0; i--) {
			var obj = plist[i];
	
			m.rotate(-obj.angle.x, -obj.angle.y, -obj.angle.z);
		}
	
		return m;
	}
	
	makeViewMatrix(m) {
		var viewer = this.viewer;
	
		if (viewer) {
			m.translateZ(-(viewer.originDistance) * 10);
	
			if ((!viewer.location.equals(0, 0, 0) || !viewer.angle.equals(0, 0, 0)
			// || !viewer.scale.equals(1, 1, 1)
			)) {
				m.rotate(viewer.angle)
					.translate(viewer.location.x, viewer.location.y, viewer.location.z)
					//.scale(viewer.scale.z, viewer.scale.z, viewer.scale.z)
				;
			}
		}
	}
	
	makeProjectMatrix(projectMethod, m) {
		var projectionMethod = projectMethod
			|| ((this.currentScene && this.currentScene.mainCamera)
				? (this.currentScene.mainCamera.projectionMethod)
				: (this.options.perspective.method));
	
		switch (projectionMethod) {
			default:
			case Tarumae.ProjectionMethods.Persp:
			case "persp":
				this.perspectiveProject(m);
				break;
	
			case Tarumae.ProjectionMethods.Ortho:
			case "ortho":
				this.orthographicProject(m);
				break;
		}
	}
	
	createScene() {
		return new Tarumae.Scene(this);
	}
	
	create2DScene() {
		if (!Tarumae.Draw2D && !Draw2D) return null;
	
		var scene = new Draw2D.Scene2D();
		scene.renderer = this;
		return scene;
	}
	
	showScene(scene) {
		if (this.currentScene != scene) {
			if (this.currentScene) {
				this.currentScene.close();
			}
	
			this.currentScene = scene;
	
			if (this.debugMode) {
				Tarumae.Debugger.currentScene = scene;
			}
		}
	}
	
	drawObject(obj, transparencyRendering) {

		if (!obj || obj.visible === false) {
			return;
		}
	
		if (!transparencyRendering) {	
			obj._opacity = (!isNaN(obj.opacity) ? obj.opacity : 1)
				* (1.0 - Tarumae.MathFunctions.clamp((obj.mat && !isNaN(obj.mat.transparency)) ? obj.mat.transparency : 0));
	
			if (obj._opacity < 1) {
				this.transparencyList.push(obj);
	
				for (let i = 0; i < obj.objects.length; i++) {
					let child = obj.objects[i];
					this.drawObject(child, false);
				}
	
				return;
			}
		}
	
		var shaderPushed = false;
	
		var objShader = obj.shader || null;
		if (objShader) {
			var objShaderName = objShader.name || null;
	
			if (objShaderName) {
				// var shader =
				this.useShader(objShaderName);
				// if (shader) {
				// 	shader.beginScene(this.currentScene);
				// }
				shaderPushed = true;
			}
		}

		if (!shaderPushed && obj instanceof Tarumae.ParticleObject) {
			this.useShader("point");
			shaderPushed = true;
		}
	
		this.currentShader.beginObject(obj);
	
		if (this.options.enableCustomDraw) {
			obj.draw(this);
		}
	
		switch (obj.type) {
			default:
			case Tarumae.ObjectTypes.GenericObject:
				{
					for (let i = 0; i < obj.meshes.length; i++) {
						var mesh = obj.meshes[i];
						if (mesh && this.options.enableDrawMesh) {
							if (mesh.meta && mesh.meta.vertexCount == 0) {
								console.warn('invaliad mesh from object ' + obj.name);
							}
							this.currentShader.beginMesh(mesh);
							mesh.draw(this);
							this.currentShader.endMesh(mesh);
						}
					}
	
					if (!transparencyRendering) {
						for (let i = 0; i < obj.objects.length; i++) {
							let child = obj.objects[i];
							this.drawObject(child, false);
						}
					}
				}
				break;
	
			case Tarumae.ObjectTypes.Div:
				{
					var div = obj._htmlObject;
	
					var worldloc = new Vec4(0, 0, 0, 1).mulMat(obj._transform);
					var p = this.transformPoint(worldloc);
	
					var w = div.scrollWidth / 2;
					var h = div.scrollHeight / 2;
	
					div.style.left = (p.x - w) + "px";
					div.style.top = (p.y - h) + "px";
	
					if (typeof obj.enableDepthScale !== "undefined"
						&& obj.enableDepthScale) {
						var pw = 1 + 1 / p.w;
						// let tw = div.scrollWidth * pw / 2;
						// let th = div.scrollHeight * pw / 2;
						// div.style.transform = "translate(" + (tw) + "px," + (th) +"px) scale(" + pw + "," + pw +") translate(" + (-tw) + "px," + (-th) + "px)";
						div.style.transform = "scale3d(" + pw + "," + pw + "," + pw + ")";
					}
				}
				break;
		}
	
		this.currentShader.endObject(obj);

		if (shaderPushed) {
			this.disuseCurrentShader();
		}
		
		if (this.debugger) {
			this.debugger.totalNumberOfObjectDrawed++;
		}
		// if (this.debugMode) {
		// 	this.debugger.drawBoundingBox(obj, this.transformStack);
		// }
	}
	
	drawHighlightObject(obj, color) {
		if (obj.visible === false || !this.options.enableDrawMesh || !obj._transform) {
			return;
		}
	
		// var gl = this.gl;
	
		var shader = this.useShader("solidcolor");
	
		shader.color = color;
		shader.beginObject(obj);
	
		for (var i = 0; i < obj.meshes.length; i++) {
			var mesh = obj.meshes[i];
	
			shader.beginMesh(mesh);
			mesh.draw(this);
			shader.endMesh(mesh);
		}
	
		if (this.options.enableCustomDraw) {
			obj.draw(this);
		}
	
		shader.endObject(obj);
		this.disuseCurrentShader();
	}
	
	drawHighlightChildren(obj, color) {
		for (var i = 0; i < obj.objects.length; i++) {
			var child = obj.objects[i];
			this.drawHighlightObject(child, color);
	
			if (child.objects.length > 0) {
				this.drawHighlightChildren(child, color);
			}
		}
	}
	
	createWorldRayFromScreenPosition(p) {
		var ray;
	
		var projectMethod = (this.currentScene && this.currentScene.mainCamera)
			? (this.currentScene.mainCamera.projectionMethod)
			: (this.options.perspective.method);
	
		switch (projectMethod) {
			default:
			case Tarumae.ProjectionMethods.Persp:
			case "persp":
				{
					var viewAngle = (this.currentScene && this.currentScene.mainCamera)
						? (this.currentScene.mainCamera.fieldOfView)
						: (this.options.perspective.angle);
	
					var viewRange = Math.tan(viewAngle * Math.PI / 2.0 / 180.0);
	
					var viewportWidth = viewRange * this.aspectRate;
					var viewportHeight = viewRange;
	
					ray = new Tarumae.Ray(new Vec3(0, 0, 0), new Vec3(
						(p.x / this.renderSize.width - 0.5) * viewportWidth,
						-(p.y / this.renderSize.height - 0.5) * viewportHeight,
						-0.5).normalize());
				}
				break;
	
			case Tarumae.ProjectionMethods.Ortho:
			case "ortho":
				{
					// var viewRange = (this.viewer.originDistance - 0.5) * 10 * 2;
	
					// var viewportWidth = viewRange * this.aspectRate;
					// var viewportHeight = viewRange;
	
					var x = (p.x / this.renderSize.width - 0.5) * viewportWidth;
					var y = -(p.y / this.renderSize.height - 0.5) * viewportHeight;
	
					ray = new Tarumae.Ray(new Vec3(x, y, 0), new Vec3(0, 0, -1));
				}
				break;
		}
	
		var m = this.viewMatrix.mul(this.cameraMatrix).inverse();
		ray.origin = new Vec4(ray.origin, 1).mulMat(m).xyz();
		ray.dir = new Vec4(ray.dir, 0).mulMat(m).xyz().normalize();
	
		return ray;
	}
	
	transformPoint(pos, matrix, projectMethod) {
		return this.toScreenPosition(this.toWorldPosition(pos, matrix, projectMethod), projectMethod);
	}
	
};

Tarumae.Renderer.prototype.toWorldPosition = (function() {
	var projectMatrix = new Tarumae.Matrix4();
	
	return function(pos, viewMatrix, projectMethod) {
	
		this.makeProjectMatrix(projectMethod, projectMatrix);
	
		var m = (viewMatrix || this.viewMatrix).mul(this.cameraMatrix).mul(projectMatrix);
	
		if (Array.isArray(pos)) {
			for (var i = 0; i < pos.length; i++) {
				pos[i] = new Vec4(pos[i], 1.0).mulMat(m);
			}
		} else {
			return new Vec4(pos, 1.0).mulMat(m);
		}
	};
})();
	
Tarumae.Renderer.prototype.toScreenPosition = function(pos) {
	var projectMethod = projectMethod
			|| ((this.currentScene && this.currentScene.mainCamera)
				? (this.currentScene.mainCamera.projectionMethod)
				: (this.options.perspective.method));
	
	var renderHalfWidth = this.renderSize.width / 2;
	var renderHalfHeight = this.renderSize.height / 2;
	
	var w = ((projectMethod == Tarumae.ProjectionMethods.Persp || projectMethod == "persp") ? pos.w : 1.0) || 1.0;
	
	return new Point(
		(pos.x / w) * renderHalfWidth + renderHalfWidth,
		-(pos.y / w) * renderHalfHeight + renderHalfHeight);
};
	
Tarumae.Renderer.prototype.toScreenPositionEx = function(pos) {
	var projectMethod = projectMethod
			|| ((this.currentScene && this.currentScene.mainCamera)
				? (this.currentScene.mainCamera.projectionMethod)
				: (this.options.perspective.method));
	
	var renderHalfWidth = this.renderSize.width / 2;
	var renderHalfHeight = this.renderSize.height / 2;
	
	var w = ((projectMethod == Tarumae.ProjectionMethods.Persp || projectMethod == "persp") ? pos.w : 1.0) || 1.0;
	
	return new Vec3(
		(pos.x / w) * renderHalfWidth + renderHalfWidth,
		-(pos.y / w) * renderHalfHeight + renderHalfHeight,
		1.0 / pos.z
	);
};
	
var TarumaeRenderer = Tarumae.Renderer;
	
TarumaeRenderer.prototype.transformPoints = function(points) {
	const renderHalfWidth = this.renderSize.width / 2;
	const renderHalfHeight = this.renderSize.height / 2;
	
	const ps = new Array(points.length);
	
	for (var i = 0; i < points.length; i++) {
		var p = new Vec4(points[i], 1.0).mulMat(this.projectionViewMatrix);
	
		ps[i] = new Point(
			(p.x / p.w) * renderHalfWidth + renderHalfWidth,
			-(p.y / p.w) * renderHalfHeight + renderHalfHeight);
	}
	
	return ps;
};
	
TarumaeRenderer.prototype.transformTriangle = function(triangle) {
	const m = this.viewMatrix.mul(this.cameraMatrix);
	
	return {
		v1: new Vec4(triangle.v1, 1.0).mulMat(m).xyz(),
		v2: new Vec4(triangle.v2, 1.0).mulMat(m).xyz(),
		v3: new Vec4(triangle.v3, 1.0).mulMat(m).xyz(),
	};
};
	
TarumaeRenderer.prototype.viewRayHitTestPlaneInWorldSpace = function(pos, planeVertices) {
	const ray = this.createWorldRayFromScreenPosition(pos);
	return Tarumae.MathFunctions.rayIntersectsPlane(ray, planeVertices, Tarumae.Ray.MaxDistance);
};
	
TarumaeRenderer.prototype.drawLine = function(from, to, width, color) {
	var points = this.transformPoints([from, to]);
	this.drawLine2D(points[0], points[1], width, color);
};
	
TarumaeRenderer.prototype.drawLine2D = function(from, to, width, color) {
	this.drawLineSegments2D([from, to], width, color);
};
	
TarumaeRenderer.prototype.drawLineSegments2D = function() {
	return this.drawingContext2D.drawLines.apply(this.drawingContext2D, arguments);
};
	
TarumaeRenderer.prototype.drawBox = function(box, width, color) {
	if (!box) return;
	
	var points = this.transformPoints([
		{ x: box.min.x, y: box.min.y, z: box.min.z },
		{ x: box.max.x, y: box.min.y, z: box.min.z },
		{ x: box.min.x, y: box.max.y, z: box.min.z },
		{ x: box.max.x, y: box.max.y, z: box.min.z },
	
		{ x: box.min.x, y: box.min.y, z: box.max.z },
		{ x: box.max.x, y: box.min.y, z: box.max.z },
		{ x: box.min.x, y: box.max.y, z: box.max.z },
		{ x: box.max.x, y: box.max.y, z: box.max.z },
	]);
	
	this.drawLineSegments2D([
		points[0], points[1], points[2], points[3],
		points[4], points[5], points[6], points[7],
	
		points[0], points[4], points[1], points[5],
		points[2], points[6], points[3], points[7],
	
		points[0], points[4], points[1], points[5],
		points[2], points[6], points[3], points[7],
	
		points[0], points[2], points[1], points[3],
		points[4], points[6], points[5], points[7],
	], width, color);
};
	
TarumaeRenderer.prototype.drawFocusBox = function(box, len, width, color) {
	if (!box) return;
	
	len = len || 0.1;
	
	var points = this.transformPoints([
		{ x: box.min.x, y: box.min.y, z: box.min.z },
		{ x: box.max.x, y: box.min.y, z: box.min.z },
		{ x: box.min.x, y: box.max.y, z: box.min.z },
		{ x: box.max.x, y: box.max.y, z: box.min.z },
	
		{ x: box.min.x, y: box.min.y, z: box.max.z },
		{ x: box.max.x, y: box.min.y, z: box.max.z },
		{ x: box.min.x, y: box.max.y, z: box.max.z },
		{ x: box.max.x, y: box.max.y, z: box.max.z },
	]);
	
	this.drawLineSegments2D([
		points[0], points[1], points[2], points[3],
		points[4], points[5], points[6], points[7],
	
		points[0], points[4], points[1], points[5],
		points[2], points[6], points[3], points[7],
	
		points[0], points[4], points[1], points[5],
		points[2], points[6], points[3], points[7],
	
		points[0], points[2], points[1], points[3],
		points[4], points[6], points[5], points[7],
	], width, color);
};
	
TarumaeRenderer.prototype.drawArrow = function(from, to, width, color) {
	var points = this.transformPoints([from, to]);
	this.drawArrow2D(points[0], points[1], width, color);
};
	
TarumaeRenderer.prototype.drawArrow2D = function(from, to, width, color, arrowSize) {
	var ctx = this.ctx;
	
	if (width === undefined) width = 2;
	if (arrowSize === undefined) arrowSize = width * 5;
	
	ctx.lineWidth = width;
	ctx.strokeStyle = color || "black";
	
	var angle = Math.atan2(to.y - from.y, to.x - from.x);
	
	ctx.beginPath();
	
	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);
	
	ctx.lineTo(to.x - arrowSize * Math.cos(angle - Math.PI / 6),
		to.y - arrowSize * Math.sin(angle - Math.PI / 6));
	
	ctx.moveTo(to.x, to.y);
	ctx.lineTo(to.x - arrowSize * Math.cos(angle + Math.PI / 6),
		to.y - arrowSize * Math.sin(angle + Math.PI / 6));
	
	ctx.stroke();
	ctx.closePath();
};
	
TarumaeRenderer.prototype.fillArrow = function(from, to, size, color) {
	var points = this.transformPoints([from, to]);
	this.fillArrow2D(points[0], points[1], size, color);
};
	
TarumaeRenderer.prototype.fillArrow2D = function(from, to, size, color) {
	var ctx = this.ctx;
	
	size = size || 10;
	ctx.fillStyle = color || "black";
	
	var angle = Math.atan2(to.y - from.y, to.x - from.x);
	
	ctx.beginPath();
	
	ctx.moveTo(to.x, to.y);
	ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
	ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
	
	ctx.fill();
	ctx.closePath();
};
	
TarumaeRenderer.prototype.drawRect = function(topLeft, bottomRight, strokeWidth, strokeColor, fillColor) {
	var rect3d = this.transformPoints([topLeft, bottomRight]);
	
	var left = Math.min(rect3d[0].x, rect3d[1].x),
		top = Math.min(rect3d[0].y, rect3d[1].y),
		right = Math.max(rect3d[0].x, rect3d[1].x),
		bottom = Math.max(rect3d[0].y, rect3d[1].y);
	
	this.drawRect2D(new Tarumae.Rect(left, top, right - left, bottom - top), strokeWidth, strokeColor, fillColor);
};
	
TarumaeRenderer.prototype.drawRect2D = function() {
	return this.drawingContext2D.drawRect.apply(this.drawingContext2D, arguments);
};
	
TarumaeRenderer.prototype.drawPolygon = function(points, strokeWidth, strokeColor, fillColor) {
	if (points.length < 2) return;
	this.drawPolygon2D(this.transformPoints(points), strokeWidth, strokeColor, fillColor);
};
	
TarumaeRenderer.prototype.drawPolygon2D = function(points, strokeWidth, strokeColor, fillColor) {
	var ctx = this.ctx;
	
	if (points.length < 2) return;
	
	ctx.beginPath();
	
	var p0 = points[0];
	ctx.moveTo(p0.x, p0.y);
	
	for (var i = 1; i < points.length; i++) {
		var p = points[i];
		ctx.lineTo(p.x, p.y);
	}
	
	ctx.lineTo(p0.x, p0.y);
	
	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fill();
	}
	
	if (strokeWidth || strokeColor) {
		ctx.lineWidth = strokeWidth || 1;
		ctx.strokeStyle = strokeColor || "black";
	
		ctx.stroke();
	}
	
	ctx.closePath();
};
	
TarumaeRenderer.prototype.drawEllipse = function(v, size, strokeWidth, strokeColor, fillColor) {
	this.drawEllipse2D(this.transformPoint(v), size, strokeWidth, strokeColor, fillColor);
};
	
TarumaeRenderer.prototype.drawEllipse2D = function(p, size, strokeWidth, strokeColor, fillColor) {
	var r = new Tarumae.Rect(p.x - size / 2, p.y - size / 2, size, size);
	return this.drawingContext2D.drawEllipse(r, strokeWidth, strokeColor, fillColor);
};
	
TarumaeRenderer.prototype.drawImage = function(location, image) {		
	var p = this.transformPoint(location);
			
	var x = p.x - image.width / 2;
	var y = p.y - image.height / 2;
			
	if (x >= 0 && y >= 0
			&& x < this.renderSize.width && y < this.renderSize.height) {
		return this.drawingContext2D.drawImage({ x: x, y: y }, image);
	}
};
	
TarumaeRenderer.prototype.drawText = function(location, text, color, halign) {
	var p = this.transformPoint(location);
	this.drawText2D(p, text, color, halign);
};
	
TarumaeRenderer.prototype.drawText2D = function() {
	return this.drawingContext2D.drawText.apply(this.drawingContext2D, arguments);
};
	
TarumaeRenderer.prototype.createSnapshotOfRenderingImage = function(imgformat, imgQuality) {
	var scene = this.currentScene;
	if (!scene || !Tarumae.FrameBuffer) return null;
	
	var width = this.renderSize.width, height = this.renderSize.height;
	
	var renderbuffer = new Tarumae.FrameBuffer(this, width, height);
	renderbuffer.use();
	
	this.drawSceneFrame(scene);
	
	var img = null;
	
	try {
		img = Tarumae.Utility.getImageDataURLFromTexture(this, renderbuffer.texture, imgformat, imgQuality);
	} catch (e) { /* ignore exception */ }
	
	renderbuffer.disuse();
	renderbuffer.destroy();
	
	return img;
};

Tarumae.ProjectionMethods = {
	Persp: 0,
	Ortho: 1,
};

Tarumae.DrawMode = {
	Normal: 0,
	ShadowMap: 1,
};

import solidcolorVert from '../../shader/solidcolor.vert';
import solidcolorFrag from '../../shader/solidcolor.frag';
import billboardVert from '../../shader/billboard.vert';
import billboardFrag from '../../shader/billboard.frag';
import simpleVert from '../../shader/simple.vert';
import simpleFrag from '../../shader/simple.frag';
import panoramaVert from '../../shader/panorama.vert';
import panoramaFrag from '../../shader/panorama.frag';
import standardVert from '../../shader/standard.vert';
import standardFrag from '../../shader/standard.frag';
import pointVert from '../../shader/points.vert';
import pointFrag from '../../shader/points.frag';

TarumaeRenderer.Shaders = {
	// viewer: {
	// 	vert: fs.readFileSync(__dirname + "../../../shader/viewer.vert", "utf8"),
	// 	frag: fs.readFileSync(__dirname + "../../../shader/viewer.frag", "utf8"), class: "ViewerShader"
	// },
	solidcolor: { vert: solidcolorVert, frag: solidcolorFrag, class: "SolidColorShader" },
	billboard: { vert: billboardVert, frag: billboardFrag, class: "BillboardShader" },
	simple: { vert: simpleVert, frag: simpleFrag, class: "SimpleShader" },
	point: { vert: pointVert, frag: pointFrag, class: "PointShader" },
	panorama: { vert: panoramaVert, frag: panoramaFrag, class: "PanoramaShader" },
	standard: { vert: standardVert, frag: standardFrag, class: "StandardShader" },
	point: { vert: pointVert, frag: pointFrag, class: "PointShader" },
};

TarumaeRenderer.ContainerStyle = [
	"#canvas-container { position: relative; }",
	"#canvas-container { width: 100%; }",
	"#canvas-container:before { content: ''; }",
	"#canvas-container:before { display: block; }",
	"#canvas-container canvas, #canvas-container .surface { position: absolute; }",
	"#canvas-container canvas, #canvas-container .surface { top: 0; }",
	"#canvas-container canvas, #canvas-container .surface { left: 0; }",
	"#canvas-container canvas, #canvas-container .surface { width: 100%; }",
	"#canvas-container canvas, #canvas-container .surface { height: 100%; }",
	"#canvas-container .surface div { pointer-events: none; }",
];

TarumaeRenderer.DefaultOptions = {
	debugMode: false,
	backColor: new Color4(0.93, 0.93, 0.93, 1.0),
};

///////////////// DrawingContext2D /////////////////

Tarumae.ResourcePool = class {
	constructor() {

	}

	loadTexture(url, onload) {
	}
};

new Tarumae.EventDispatcher(Tarumae.ResourcePool).registerEvents(
	"texadded");

///////////////// DrawingContext2D /////////////////

Tarumae.DrawingContext2D = class {
	constructor(canvas, ctx) {
		this.canvas = canvas;
		this.ctx = ctx;

		this.resetDrawingStyle();

		this.currentTransform = new Tarumae.Matrix3().loadIdentity();
		this.transformStack = new Array();
	}

	pushTransform(t) {
		this.transformStack.push(this.currentTransform.clone());
		this.currentTransform = this.currentTransform.mul(t);
		t = this.currentTransform;
		this.ctx.setTransform(t.a1, t.b1, t.a2, t.b2, t.a3, t.b3);
	}

	popTransform() {
		this.currentTransform = this.transformStack.pop();
		var t = this.currentTransform;
		this.ctx.setTransform(t.a1, t.b1, t.a2, t.b2, t.a3, t.b3);
	}

	resetDrawingStyle() {
		this.strokeWidth = 1;
		this.strokeColor = "black";
		this.fillColor = "transparent";
	}

	drawRect(rect, strokeWidth, strokeColor, fillColor) {
		var ctx = this.ctx;
	
		fillColor = fillColor || this.fillColor;

		if (fillColor !== "transparent") {
			ctx.fillStyle = fillColor;
			ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
		}
		
		if (typeof strokeWidth !== "undefined") {
			ctx.lineWidth = strokeWidth;
		} else {
			ctx.lineWidth = this.strokeWidth;
		}

		if (strokeColor !== null) {

			if (typeof strokeColor !== "undefined") {
				ctx.strokeStyle = strokeColor;
			} else {
				ctx.strokeStyle = this.strokeColor;
			}

			if (ctx.lineWidth > 0) {
				// ctx.beginPath();
				ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
				// ctx.closePath();
			}
		}
	}

	drawPoint(p, size = 3, color = "black") {
		this.drawEllipse(new Tarumae.Rect(p.x - size / 2, p.y - size / 2, size, size), 0, null, color);
	}

	drawEllipse(rect, strokeWidth, strokeColor, fillColor) {
		var ctx = this.ctx;
		
		strokeWidth = strokeWidth || this.strokeWidth;
		strokeColor = strokeColor || this.strokeColor;
		fillColor = fillColor || this.fillColor;

		var w = rect.width;
		var h = rect.height;
		var hw = w / 2;
		var hh = h / 2;
		// var x = rect.x - hw;
		// var y = rect.y - hh;
		var x = rect.x;
		var y = rect.y;
	
		var kappa = 0.5522848,
			ox = hw * kappa,   // control point offset horizontal
			oy = hh * kappa,   // control point offset vertical
			xe = x + w,        // x-end
			ye = y + h,        // y-end
			xm = x + hw,       // x-middle
			ym = y + hh;       // y-middle
	
		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
	
		if (fillColor) {
			ctx.fillStyle = fillColor;
			ctx.fill();
		}

		if (typeof strokeWidth === "undefined") {
			strokeWidth = 1;
		}
	
		if (strokeWidth || strokeColor) {
			ctx.lineWidth = strokeWidth || 1;
			ctx.strokeStyle = strokeColor || "black";
			ctx.stroke();
		}
	
		ctx.closePath();
	}

	drawLines(lines, width, color) {
		if (lines.length < 2) return;
	
		var ctx = this.ctx;
	
		if (width == undefined) width = this.strokeWidth;
		if (color == undefined) color = this.strokeColor;

		if (width > 0 && color != "transparent") {
			ctx.lineWidth = width || 1;
			ctx.strokeStyle = color || "black";
	
			ctx.beginPath();
	
			for (var i = 0; i < lines.length; i += 2) {
				var from = lines[i], to = lines[i + 1];
				ctx.moveTo(from.x, from.y);
				ctx.lineTo(to.x, to.y);
			}
	
			ctx.stroke();
			ctx.closePath();
		}
	}

	drawImage(p, image) {
		var ctx = this.ctx;
		
		ctx.drawImage(image, p.x, p.y);
	}

	drawText(p, text, color, halign) {
		var ctx = this.ctx;
	
		ctx.fillStyle = color || "black";
	
		var size = ctx.measureText(text);
	
		// TODO: get text height, allow to change text font
		ctx.font = "12px Arial";
	
		if (halign == "center") {
			p.x -= size.width / 2;
		}
	
		ctx.fillText(text, p.x, p.y);
	}
};