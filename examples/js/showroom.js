////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from '../../src/js/tarumae.js';
import { Vec3, Color4 } from "@jingwood/graphics-math";

const ringTobaURL = 
`data:text/plain;base64,
dG9iYQABAAAQAAAAAAAAABAAAAAAAQAAAgAAAAAAAAABAAAAbWlmdEAAAACcAAAA
AQAAAAAAAADGrY8kbWVzaNwAAACgAgAAAQAAAAAAAAB42mWOQQ6DIBBF95yCsCaK
1Cp6iF6gaQi1VE0UGoaNMd69I7bddFbvz7xM/kqYnk20YTQTsJauhFJ28c5+GFPn
Jx8wXkWmxD6c/tONH3I/eYAF7Z9y7GMwDl4mWNctBZ5PpZBnUStVFLKSTV1lyRZo
b2TjhIXR9d8+s4UBmYG/t3mudRxG0DqXpXqaR1cxniQTdyd1J/jjDSDfNrp42u2W
MUtcQRDHV1AuEWMRtU4ZsToLSQLhPVPZWoTUaQwaYhHSBBQ8COQDGAh+ABELbUKu
SMDdwHmVtTap1UY8G7ETZ/Z2zt8eRz5AeA/k/X3u/md2ZvaHq0ufloeHRt1n59wf
+Rly3ed2w7kfl9cPnWuE7hd9N8qk07v3zNtb970dW1z/ueH++bz78iF61Dqt4tfH
J1FfPD4unv99HfXJi/HyaOJljL2/PVXc5+EavyfXot5rLxSi4/oV0a9mZqP+drhZ
0L8+MxvsO/fKmmBr7EwHz742JW5pcekvecb14xPH2V7JOSDnuP5qe8rT03w67QV/
MzwX18u7pCd93qT8pzstT0/6yB6vWutHT9kftdbyaarnuXyrp/qcHG56+jfld9X6
d+6Vs3nr1X48j3PWE5sJqWP8rnU9k9iqH4zMhd3U07rkyBzgk/nDp0Q+mT/Wh7bU
KOUZvm/Vot7ZqmU5WJaPWmXmj/xL1DDzRx2Czo1qma8s7ullq7D1V3FGu+eiv/Sp
sLiSZ7A86Y/ehZW0/kjOy7iM1UzftV/0n+5012hvMVect4AZ03cj1SeLy/7qXNqM
0f881UF7a/dL+0Z/3BG/k3qkveLem9Qv7Rvuu+de3FlPVnAvuaHnGcAKT4aQD+QG
/ckfevaxqMcHcoOe5A89ySKyQud1EIvICnqSRWQFfehPVthMal/oTz6QG/Qnf+hD
f959MoGe5A89yaI+/vTmlrPKu08mMC75w7hkEfnDuGQROaCzYgxhXPKHccki8odx
ySJygLGYwyD+WP+NReQP45JF5MD7e88sB/KHccki8odxySL2kbGYA/nDuGQR+cO4
ZBH5Q0+yiPyhJ1lEPtCTLCIr6JmzqP//qEpXutKVrnSlK13p/1vfAcVDMGE=`

function _base64ToArrayBuffer(base64) {
	const binary_string = window.atob(base64);
	const len = binary_string.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
			bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}

class ShowroomController {
	constructor(scene) {
		this.scene = scene;
		this._targetObject = undefined;
		this.topViewAngle =  70;

		this.moveController = new Tarumae.TouchController(scene, {
			speed: 0.1,
			distance: 2,
		});
		this.moveController.enabled = false;

		this.topViewController = new Tarumae.ModelViewer(scene, {
			dragBehavior: "pan",
		});

		this.ring = undefined;
	
		this.topViewStatus = {
			topViewMode: true,
			topViewHeight: 30,
			lastCameraLoc: new Vec3(0, 1.4, 0),
			lastCameraRot: { dir: Vec3.forward, up: Vec3.up },
		};
	
		scene.on('mouseup', _ => this.mouseUpHandler());
		scene.on('mousemove', _ => this.mouseMoveHandler())
		
		scene.on("keydown", key => {
			if (key === Tarumae.Viewer.Keys.Space) {
				this.toggleTopView();
			}
		});

		scene.createObjectFromURL(ringTobaURL, obj => {
			if (obj && obj.meshes.length > 0) {
				obj.visible = false;
				obj.opacity = 0.5;
				obj.receiveLight = false;
				this.ring = obj;
				scene.add(obj);
			}
		});
	
		const camera = scene.mainCamera;
		camera.location.set(0, 0, 0);
		camera.angle.set(0, 0, 0);
		
		const viewer = scene.renderer.viewer;
		viewer.originDistance = 0;
		viewer.angle.set(0, 0, 0);
	}

	get targetObject() {
		return this._targetObject;
	}
	
	set targetObject(obj) {
		this._targetObject = obj;
		this.topViewController.object = obj;
	}

	toggleTopView(toPos) {
		const tvs = this.topViewStatus;
		const scene = this.scene;
		const camera = scene.mainCamera;
		const viewer = scene.renderer.viewer;

		if (!tvs.topViewMode) {
			tvs.lastCameraLoc = camera.location.clone();
			tvs.lastCameraRot = camera.getLookAt();
			tvs.topViewMode = true;

			console.debug('switch to topview mode');

			const dist = viewer.originDistance;
			const angle = camera.angle.clone();

			scene.animate({ duration: 1.0 }, t => {
				viewer.originDistance = 2 * t;
				viewer.angle.set(t * this.topViewAngle, 0, 0);

				camera.location = tvs.lastCameraLoc.lerp(Vec3.zero, t);
				camera.angle = angle.lerp(Vec3.zero, t);
			})

			this.moveController.enabled = false;
			this.topViewController.enabled = true;
		} else {
			tvs.topViewMode = false;

			camera.moveTo((toPos instanceof Vec3) ? toPos : tvs.lastCameraLoc, {
				lookdir: tvs.lastCameraRot.dir,
				lookup: tvs.lastCameraRot.up,
			});

			console.debug('switch to walkthrough mode');

			// this.scene.animate({}, t => { camera.fieldOfView = 90 - t * 40 }, () => { camera.fieldOfView = 50 })
			const curDist = viewer.originDistance;
			const curAngle = viewer.angle.clone();
			const curLoc = viewer.location.clone();

			scene.animate({ duration: 1.0, effect: "shape" }, t => {
				viewer.originDistance = (1.0 - t) * curDist;
				viewer.angle = curAngle.lerp(Vec3.zero, t);
				viewer.location = curLoc.lerp(Vec3.zero, t);
			})

			this.moveController.enabled = true;
			this.topViewController.enabled = false;
		}
	}

	mouseMoveHandler() {
		if (this.ring) {
			const rs = this.scene.findObjectsByCurrentMousePosition({
				filter: _obj => _obj.name === 'floor'
			})

			if (rs.object) {
				const wpos = rs.worldPosition;
				this.ring.location.set(wpos.x, 0.005, wpos.z);
				this.ring.visible = true;

				// if (this.topViewStatus.topViewMode) {
				// 	this.ring.scale.set(1, 1, 1);
				// } else {
					this.ring.scale.set(0.5, 0.5, 0.5);
				// }

				this.scene.requireUpdateFrame();
			} else {
				if (this.ring.visible) {
					this.ring.visible = false;
					this.scene.requireUpdateFrame();
				}
			}
		}
	}

	mouseUpHandler() {
		if (this.ring) {
			const rs = this.scene.findObjectsByCurrentMousePosition({
				filter: _obj => _obj.name === 'floor'
			});

			if (rs.object) {
				this.ring.visible = false;

				const wpos = rs.worldPosition;
				const camera = this.scene.mainCamera;
			
				if (this.topViewStatus.topViewMode) {
					this.toggleTopView(new Vec3(wpos.x, 1.4, wpos.z));
				} else {
					const targetPos = new Vec3(wpos.x, camera.location.y, wpos.z);
					const startPos = camera.location.clone();

					this.scene.animate({}, t =>
						camera.location = startPos.lerp(targetPos, t))
				}
				
				return true;
			}
		}
	}

	fadeIn(delay = 500) {
		if (!this._targetObject) return;

		const scene = this.scene;
		const viewer = scene.renderer.viewer;
		const obj = this._targetObject;

		obj.visible = false;
		obj.scale.set(0.00001, 0.00001, 0.00001);

		viewer.originDistance = 2;

		setTimeout(_ => {
			obj.visible = true;

			scene.animate({ duration: 1.5 }, t => {
				obj.scale.set(t, t, t);
				viewer.angle.x = t * this.topViewAngle;
			})
		}, delay);
	}
}

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
		enableLighting: true,

		backColor: new Color4(0.96, .98, 1, 1),
		backgroundImage: "/textures/52642.jpg",
	
		enablePostprocess: true,
		postprocess: {
			gamma: 1.0,
		},
		enableAntialias: true,
		enableShadow: false,
		shadowQuality: {
			scale: 10,
			viewDepth: 14,
			resolution: 4096,
		},
		bloomEffect: {
			threshold: 0.2,
			gamma: 1.2,
		},
	});
	
	const scene = renderer.createScene();

	window._scene = scene;

	const showcaseToba = "/models/room_01a-baked.toba";
	scene.createObjectFromURL(showcaseToba, obj => {
		window.obj = obj;

		scene.add(obj);

		obj.eachChild(child => {
			if (child.mat) {
				if (child.mat.emission > 1) {
					child.mat.emission = 1;
				}
			}
		});
	});

	const baseurl = "../img/cubemap/city/"
  const skyImageUrls = [
    baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
    baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
  ];

	scene.skybox = new Tarumae.SkyBox(renderer, skyImageUrls);

	scene.sun.location.set(0, 1, 0);
	scene.sun.mat.color = [1, 1, 1];

	scene.mainCamera.fieldOfView = 75;
	scene.mainCamera.location.set(-2.55, 1.5, 2.12);
	scene.mainCamera.angle.set(-3, 310, 0);

	new Tarumae.TouchController(scene);

	scene.show();
});

