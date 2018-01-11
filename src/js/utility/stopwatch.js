
export function Stopwatch() {
	this.reset();
};

Stopwatch.prototype = {
	start: function() {
		this.startTime = Date.now();
	},

	stop: function() {
		this.endTime = Date.now();
		this.elapsedTime = this.endTime - this.startTime;
	},

	reset: function() {
		this.startTime = null;
		this.endTime = null;
		this.elapsedTime = 0;
	},
};

Stopwatch.startNew = function() {
	var sw = new Stopwatch();
	sw.start();
	return sw;
};
