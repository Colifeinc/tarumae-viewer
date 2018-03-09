////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

TarumaeEditor.ViewerHandler = function(editor) {
	this.editor = editor;
	this.viewer = editor.viewer;
	this.scene = editor.scene;
};

TarumaeEditor.ViewerHandler.prototype = {
	objectFocusMode: false,
	topViewMode: false,
	viewerLastLocation: null,
	viewerLastAngle: null,
	viewerLastScale: null,

	hoverObjectByPosition: function(predicate) {
		if (!this.viewer) return;

		var out = this.scene.findObjectsByCurrentMousePosition({
			cullingSurfaceBack: true,
		});

		if (out.object && typeof predicate === "function") {
			if (!predicate(out.object)) {
				out.object = null;
			}
		}
        
		var oldHover = this.scene.hoverObject;

		if (out) {
			this.scene.hoverObject = out.object;
		} else {
			this.scene.hoverObject = null;
		}

		if (oldHover != this.scene.hoverObject) {
			this.scene.requireUpdateFrame();
		}
	},

	moveSpeed: 0.1,

	detectFirstPersonMove: (function() {
		var m;

		return function() {
			if (!this.editor.renderer) return;
    
			var viewer = this.editor.renderer.viewer;
			var scene = this.scene;

			var dir = new Vec3();
			var Viewer = Tarumae.Viewer;

			if (!viewer.pressedKeys._t_contains(Viewer.Keys.Shift)) {
				if (viewer.pressedKeys._t_contains(Viewer.Keys.A)) {
					dir.x = this.moveSpeed;
				} else if (viewer.pressedKeys._t_contains(Viewer.Keys.D)) {
					dir.x = -this.moveSpeed;
				}

				if (viewer.pressedKeys._t_contains(Viewer.Keys.W)
          || viewer.pressedKeys._t_contains(Viewer.Keys.Up)) {
					dir.z = this.moveSpeed;
				} else if (viewer.pressedKeys._t_contains(Viewer.Keys.S)
          || viewer.pressedKeys._t_contains(Viewer.Keys.Down)) {
					dir.z = -this.moveSpeed;
				}

				if (viewer.pressedKeys._t_contains(Viewer.Keys.Left)) {
					viewer.angle.y += this.moveSpeed * 10;
					scene.requireUpdateFrame();
				} else if (viewer.pressedKeys._t_contains(Viewer.Keys.Right)) {
					viewer.angle.y -= this.moveSpeed * 10;
					scene.requireUpdateFrame();
				}
			}

			if (dir.x !== 0 || dir.y !== 0 || dir.z !== 0) {
				if (m === undefined) m = new Tarumae.Matrix4();
				m.loadIdentity();

				m.rotateX(-viewer.angle.x);
				m.rotateY(-viewer.angle.y);

				var transformedDir = dir.mulMat(m);

				viewer.location.x += transformedDir.x;
				viewer.location.z += transformedDir.z;

				scene.requireUpdateFrame();
			}
		};
	})(),
};

Object.assign(TarumaeEditor.prototype, {

	restoreFreeViewStatus: function() {
		this.viewer.focusAt(this.viewerLastLocation, {
			animation: true,
			scaleToFitView: true,
			targetScale: this.viewerLastScale,
		});
	},

	toggleTopViewMode: function() {
		var viewer = this.viewer;

		if (!this.topViewMode) {
			this.viewerLastAngle = viewer.angle;

			viewer.rotateTo(Tarumae.Viewer.Faces.Top);
			this.renderer.options.perspective.method = Tarumae.ProjectionMethods.Ortho;
			this.topViewMode = true;
		} else {
			viewer.rotateTo(this.viewerLastAngle);
			this.renderer.options.perspective.method = Tarumae.ProjectionMethods.Persp;
			this.topViewMode = false;
		}
	},

	focusAtObject: function(obj) {
		var viewer = this.viewer;

		this.viewerLastLocation = viewer.location;
		this.viewerLastScale = viewer.scale.z;

		viewer.focusAt(obj, {
			animation: true,
			scaleToFitView: true,
		});

		this.objectFocusMode = true;
	},

	viewFocusAt: function() {
		var focusObject = this.getFirstSelectedObject();
          
		if (focusObject) {
			this.focusAtObject(focusObject);
		}
	},

	toggleObjectFocus: function() {

		if (!this.objectFocusMode) {
			this.viewFocusAt();
		} else {
			this.restoreFreeViewStatus();
			this.objectFocusMode = false;
		}
	},

	resetObjectFocusMode: function() {
		this.objectFocusMode = false;
	},

	rotateViewLeft: function() {
		this.viewer.rotateTo(Tarumae.Viewer.Faces.Left, { append: true });
	},

	rotateViewRight: function() {
		this.viewer.rotateTo(Tarumae.Viewer.Faces.Right, { append: true });
	},

	rotateToViewFront: function() {
		this.viewer.rotateTo(Tarumae.Viewer.Faces.Front);
	},

	rotateToViewBack: function() {
		this.viewer.rotateTo(Tarumae.Viewer.Faces.Back);    
	}
});