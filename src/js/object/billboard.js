import Tarumae from "../entry";
import { Vec3, Vec4, Color3, Matrix4, MathFunctions } from "@jingwood/graphics-math";

Tarumae.Billboard = class extends Tarumae.SceneObject {
	constructor(image) {
		super();
	
		if (Tarumae.BillboardMesh.instance == null) {
			Tarumae.BillboardMesh.instance = new Tarumae.BillboardMesh();
		}

		this.addMesh(Tarumae.BillboardMesh.instance);

		this.mat = { tex: null };
	
		if (typeof image === "string" && image.length > 0) {
			Tarumae.ResourceManager.download(image, Tarumae.ResourceTypes.Image, img => {
				this.mat.tex = new Tarumae.Texture(img);
				if (this.scene) {
					this.scene.requireUpdateFrame();
				}
			});
		} else if (image instanceof Image) {
			this.mat.tex = image;
		}
	
		this.targetCamera = null;
		this.cameraMoveListener = null;
		this.attachedScene = null;
		this.cameraChangeListener = null;

		this.on("sceneChange", scene => {
			if (scene) {
				this.targetCamera = scene.mainCamera;
				this.cameraMoveListener = this.targetCamera.on("move", function() {
					Tarumae.Billboard.faceToCamera(this, this.targetCamera);
				});

				this.attachedScene = scene;
				this.cameraChangeListener = scene.on("mainCameraChange", function() {
					Tarumae.Billboard.faceToCamera(this, this.targetCamera);
				});
			} else {
				if (this.targetCamera && this.cameraMoveListener) {
					this.targetCamera.removeEventListener("move", this.cameraMoveListener);
				}
				if (this.attachedScene && this.cameraChangeListener) {
					this.attachedScene.removeEventListener("mainCameraChange", this.cameraChangeListener);
				}

				this.targetCamera = null;
				this.cameraMoveListener = null;
				this.attachedScene = null;
				this.cameraChangeListener = null;
			}
		});

		this.shader = {
			name: "billboard",
		};
	}
};	

Tarumae.Billboard.faceToCamera = function(billboard, camera) {
	var cameraLoc = camera.worldLocation;
	var worldLoc = billboard.worldLocation;

	var diff = cameraLoc.sub(worldLoc);

	billboard.angle.y = _mf.degreeToAngle(Math.atan2(diff.x, diff.z));
};

Tarumae.BillboardMesh = class extends Tarumae.Mesh {
	constructor() {
		super();

		this.meta = {
			vertexCount: 4,
			normalCount: 0,
			texcoordCount: 4
		};

		this.vertexBuffer = Tarumae.BillboardMesh.VertexBuffer;
		this.composeMode = Tarumae.Mesh.ComposeModes.TriangleStrip;
	}
};

Tarumae.BillboardMesh.instance = null;

Tarumae.BillboardMesh.VertexBuffer = new Float32Array([
	-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0, 0, 0, 0, 1, 1, 0, 1, 1
]);