////////////////////////////////////////////////////////////////////////////////
// Tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";

Tarumae.ResourceTypes = {
	Binary: "arraybuffer",
	Text: "text",
	Image: "image",
	JSON: "json",
};

Tarumae.ResourceManager = class {
	constructor() {
		this.loadingQueue = [];
		this.loadingSessionId = 1;
		this.loadingQueueCount = {};
		this.loadingQueueLength = {};
		this.loadingQueueFinish = {};
		this.resources = {};
		this.onprogress = function(p) { };
	}

	add(url, type, onload, onprogress) {
	
		if (typeof url === "string") {
			// single resource
			if (typeof type === "undefined") {
				type = Tarumae.ResourceTypes.Binary;
			}
	
			this.addSingleResource(url, type, onload, onprogress);
		}
		else if (url instanceof Array) {
			var resArray = url;
	
			// multiple resource
			for (var i = 0; i < resArray.length; i += 2) {
				this.addSingleResource(resArray[i], resArray[i + 1]);
			}
		}
	}

	addSingleResource(url, type, onload, onprogress) {
		var res = { url, type, "data": null, "sessionId": this.loadingSessionId };
		var self = this;
	
		res.onload = function() {
			try {
				if (typeof onload === "function") {
					onload.apply(this, arguments);
				}
			} finally {
				if (--self.loadingQueueCount[this.sessionId] <= 0) {
					self.loadingQueueFinish[this.sessionId]();
				}
				self.progress(this.sessionId);
			}
		};
	
		if (typeof onprogress !== "undefined") {
			res.onprogress = onprogress;
		}
	
		this.loadingQueue.push(res);
	}

	get(url) {
		var res = this.resources[url];
		if (!res) {
			console.error('resource not managed: ' + url);
			return;
		} else {
			return res.data;
		}
	}

	progress(sessionId) {
		var p = this.loadingQueueCount[sessionId] / this.loadingQueueLength[sessionId];
	
		var round = function(val, precision){
			var digit = Math.pow(10, precision);
			val = val * digit;
			val = Math.round(val);
			val = val / digit;
			return val;
		};
	
		this.onprogress(round((1 - p), 3));
	}

	preload(url, type, data) {
		var res = { url, type, data, sessionId: this.loadingSessionId };
		this.resources[url] = res;
	}

	load(onfinish) {
		if (typeof onfinish !== "function") {
			onfinish = function() { };
		}
	
		// start new loading session
		var self = this;
		this.finished = false;
		this.loadingQueueCount[this.loadingSessionId]  = this.loadingQueue.length;
		this.loadingQueueLength[this.loadingSessionId] = this.loadingQueue.length;
		this.loadingQueueFinish[this.loadingSessionId] = onfinish;
	
		var max_connection = 400;
		
		var dl = function() {
			var res = self.loadingQueue.pop();
			if (!res) { return; }
	
			if (self.resources[res.url]) {
				res.data = self.resources[res.url].data;
			} else {
				self.resources[res.url] = res;
			}
	
			if (res.data != null) {
				res.onload(res.data);
				
				if (self.loadingQueue.length > 0) {
					dl();
				}
			} else {
				(function(res) {
					Tarumae.ResourceManager.download(res.url, res.type, function(data) {
						res.data = data;
	
						res.onload(data);
						
						if (self.loadingQueue.length > 0) {
							dl();
						}
					}, res.onprogress);
				})(res);
			}
		}
		
		var next = function() {
			var cnt = (self.loadingQueue.length > max_connection) ? max_connection : self.loadingQueue.length;
			for (var ii = 0; ii < cnt; ii++) {
				dl();
			}
		}
	
		if (this.loadingQueue.length <= 0) {
			onfinish();
		} else {
			next();
		}
	
		this.loadingSessionId++;
	}

	static download(url, type, onfinish, onprogress) {
		try {
			// var max_retry = 3;
			// var can_retry = max_retry;
			
			(function() {
				// 	var callee = arguments.callee;
				// var retry = function(e) {
				// 	if( --can_retry > 0 ){
				// 		setTimeout(callee, 20);// Do retry
				// 	}else{
						// console.warn("download resource error: " + url);
						// onfinish(null);
					// }
				// };
				onfinish = (typeof onfinish === "function")? onfinish : function(){};
				
				if (type === Tarumae.ResourceTypes.Image) {
					var image = new Image();
					//max_retry = can_retry = 0; //It's not possible to get the HTTP status of request
	
					// image.onerror = retry;
					// image.onabort = retry;
	
					image.onload = function() {
						// if( can_retry < max_retry ){
						// 	console.log("recovery: " + url);
						// }
						onfinish(image);
					};
					
					try {
						if ((new URL(url)).origin !== window.location.origin) {
							image.crossOrigin = "anonymous";
						}
					} catch (e) { }
					
					image.src = url;
				} else {
					
					var request = new XMLHttpRequest();
					request.open("GET", url, true);
					request.responseType = type;
					request.timeout = 500000;
	
					// request.onerror = retry;
					// request.onabort = retry;
	
					if (typeof onprogress === "function") {
						request.onprogress = onprogress;
					}
	
					request.onload = function(oEvent) {
						if (request.status == 404) {
							console.warn("resource not found: " + url);
							onfinish(null);
						} else {
							var buffer = request.response;
							var result = (typeof buffer !== "undefined" && buffer != null)? buffer : null;
							
							// if( can_retry < max_retry ){
							// 	console.log("recovery: " + url);
							// }
	
							// for some browsers, like IE11, they don't parse JSON format from downloaded 
							// stream automatically. we parse it manually.
							if ((type == "json" || type == "JSON") && typeof buffer === "string") {
								try {
									buffer = JSON.parse(buffer);
								} catch (e) {
									console.warn("parse downloaded json error: " + url);
								}
							}
	
							onfinish(buffer);
						}
						request.abort();
						
						// cannot delete local variable
						// delete request;
					};
	
					request.send(null);
					
				}
			})();
		}
		catch(e){
			console.warn(e);
		}
	}
}