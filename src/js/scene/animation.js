////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";

Tarumae.Animation = class {
	
	constructor(scene, options, onframe, onfinish) {
		this.scene = scene;

		this.startTime = undefined;
		this.endTime = undefined;

		const _options = { ...Tarumae.Animation.DefaultOptions, ...options };
		this.duration = _options.duration || 1;
		this.delay = _options.delay || 0;
		this.repeat = _options.repeat || 0;

		this.isPaused = false;
		this.elapsedTime = 0;
		this.repeatCount = 0;
		this.initialized = false;
  
		if (typeof options.name === "string" && options.name.length > 0) {
			this.name = options.name;
		} else {
			this.name = Tarumae.Animation.getAvailableDefaultName();
		}
  
		if (typeof onframe === "function") {
			this.onframe = onframe;
		}

		if (typeof onfinish === "function") {
			this.on("finish", onfinish);
		}
	}

	get progressRate() {
		if (this._inDelay) return 0;
		return this.elapsedTime / this._msDuration;
	}

	get isPlaying() {
		return this.elapsedTime < this.duration * 1000;
	}

	get isDuringDelay() {
		return this._inDelay;
	}

	get isFinished () {
		return this.elapsedTime >= this._msDuration;
	}

	initialize() {
		this._msDuration = this.duration * 1000;
		this._lastCheckedTime = undefined;

		this._inDelay = this.delay > 0;

		this.startTime = Date.now();
		this.endTime = this.startTime + this.duration * 1000;
    
		this.initialized = true;
	}

	play() {
		if (this.delay) {
			setTimeout(_ => {
				this.play();
			}, this.delay * 1000);
			this.delay = 0;
			return;
		}

		if (typeof this.onframe !== "function") {
			throw Error("must specify the onframe function to start animation.");
		}

		if (!this.initialized) {
			this.initialize();
		}
    
		if (typeof this.name === "string" && this.name.length > 0) {
			Tarumae.Animation.cancelAnimationByName(this.name);
			Tarumae.Animation.RunningAnimations[this.name] = this;
		}

		// resume animation when play is called
		this.isPaused = false;
		this._lastCheckedTime = Date.now();

		// this.createAnimationTimer();
		requestAnimationFrame(_ => this.tick());
	}

	tick() {
		const now = Date.now();
		const diff = now - this._lastCheckedTime;
		this._lastCheckedTime = now;

		if (this.isPaused) return;
    
		this.elapsedTime += diff;

		if (this._inDelay) {
			if (this.elapsedTime < this.delay * 1000) {
				return;
			} else {
				this._inDelay = false;
				this.elapsedTime = 0;
			}
		}
    
		if (this.elapsedTime < this._msDuration) {
			let t = this.elapsedTime / this._msDuration;
    
			switch (this.effect) {
			default:
			case "smooth":
				t = Tarumae.MathFunctions.smoothstep(0, 1, t);
				break;

			case "sharp":
				t = Tarumae.MathFunctions.smoothstep(0.2, 0.8, t);
				break;

			case "fadein":
				t = 1 - Math.cos(Math.PI / 2 * t);
				break;

			case "fadeout":
				t = Math.sin(Math.PI / 2 * t);
				break;
			}

			this.onframe(t);
			if (this.scene) this.scene.requireUpdateFrame();
			
			requestAnimationFrame(_ => this.tick());
			return;
		}

		if (!isFinite(this.repeat)) {
			this.elapsedTime = 0;
			return;
		} else if (this.repeat > 1) {
			this.repeatCount++;

			if (this.repeatCount < this.repeat) {
				this.elapsedTime = 0;
				return;
			}
		}

		this.onframe(1);
		if (this.scene) this.scene.requireUpdateFrame();

		this.removeAnimationTimer();
		this.onfinish();
	}

	// createAnimationTimer() {
	// 	if (!this.timer) {
	// 		var _this = this;
	// 		this.timer = setInterval(function() { _this.tick() }, Tarumae.Animation.Interval);
	// 	}
	// }

	removeAnimationTimer() {
		// if (this.timer) {
		// 	clearInterval(this.timer);
		// 	this.timer = undefined;
		// }

		if (typeof this.name === "string" && this.name.length > 0) {
			var previousInstance = Tarumae.Animation.RunningAnimations[this.name];
			if (previousInstance) {
				delete Tarumae.Animation.RunningAnimations[this.name];
			}
		}
	}

	stop() {
		this.removeAnimationTimer();
		this.onstop();
	}

	pause() {
		// if (this.timer) {
		// 	clearInterval(this.timer);
		// 	this.timer = undefined;
		// }
		this.isPaused = true;

		this.onpause();
	}

	reset() {
		this.elapsedTime = 0;
	}
	
	static isAnyAnimationPlaying() {
		return !Tarumae.Animation.RunningAnimations._s3_isEmpty();
	}

	static isAnimationPlaying(name) {
		return Tarumae.Animation.RunningAnimations.hasOwnProperty(name);
	}

	static cancelAnimationByName(name) {
		var previousInstance = Tarumae.Animation.RunningAnimations[name];
		if (previousInstance) {
			// if (previousInstance.timer) clearInterval(previousInstance.timer);
			delete Tarumae.Animation.RunningAnimations[name];
		}
	}

	static getAvailableDefaultName() {
		var name;
		while (name === undefined || Tarumae.Animation.RunningAnimations.hasOwnProperty(name)) {
			name = "__unnamed" + Date.now() + Math.floor(Math.random());
		}
		return name;
	}
}

Object.assign(Tarumae.Animation, {
	DefaultOptions: {
		effect: "smooth",
		duration: 1,
		delay: 0,
		repeat: 0,
	},

	Interval: 10,  // ms

	Effects: {
		Normal: 0,
		Smooth: 1,
		Sharp: 2,
		FadeIn: 3,
		FadeOut: 4,
	},

	RunningAnimations: {},
});

new Tarumae.EventDispatcher(Tarumae.Animation).registerEvents(
	"finish", "pause", "play", "stop"
);

Tarumae.Storyboard = function(scene, timeline) {
	this.scene = scene;
	this.segments = [];
	this.currentSegment = 0;
	this.playing = false;

	if (Array.isArray(timeline)) {
		for (var i = 0; i < timeline.length; i++) {
			var seg = timeline[i];
			this.add(seg[0], seg[1]);
		}
	}
};

Tarumae.Storyboard.prototype = {
	add: function(settings, action) {
		this.segments.push({ settings: settings, action: action });
	},

	play: function() {
		if (!this.playing) {
			this.playing = true;
			this.playNextSegment();
		}
	},

	playNextSegment: function() {
		var seg = this.segments[this.currentSegment];
		Tarumae.Utility.invokeIfExist(seg, "onbegin");

		var sb = this;

		this.scene.animate(seg.settings, seg.action, function() {
			Tarumae.Utility.invokeIfExist(seg, "onend");

			sb.currentSegment++;

			if (sb.currentSegment < sb.segments.length) {
				sb.playNextSegment();
			} else {
				sb.currentSegment = 0;
				sb.playing = false;

				Tarumae.Utility.invokeIfExist(sb, "onfinish");
			}
		});
	},
};
