////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"

Object.defineProperties(Tarumae.Utility.NumberExtension, {
	toStringWithDigits: {
		value: function(num, digits) {
			if (typeof digits === "undefined") {
				digits = 6;
			}
			var delta = Math.pow(10, digits);
			return Math.round(num * delta) / delta;
		}
	},

	roundDigits: {
		value: function(num, digits) {
			if (typeof digits === "undefined") {
				digits = 6;
			}
			var delta = Math.pow(10, digits);
			return Math.round(num * delta) / delta;
		}
	},
});

Object.defineProperties(Tarumae.Utility.StringExtension, {
	
	replaceAll: {
		value: function(str, search, replacement) {
			//return this.replace(new RegExp(search, 'g'), replacement); // need check illegal chars for regex
			return str.split(search).join(replacement);
		}
	},
});
	
Object.defineProperties(Object.prototype, {

	_t_foreach: {
		value: function(iterator) {
			if (typeof iterator !== "function") return;

			for (var key in this) {
				if (this.hasOwnProperty(key)) {
					iterator.call(this, key, this[key]);
				}
			}
		},
		enumerable: false
	},

	_s3_isEmpty: {
		value: function() {
			for (var key in this) {
				if (this.hasOwnProperty(key)) {
					return false;
				}
			}

			return true;
		},
		enumerable: false
	}

});

Object.defineProperties(Array.prototype, {
	_t_foreach: {
		value: function(iterator) {
			if (typeof iterator !== "function") return;

			for (var i = 0; i < this.length; i++) {
				var element = this[i];
				iterator.call(this, i, element);
			}
		},
		enumerable: false
	},

	_t_arrayIndexOf: {
		value: function(element) {
			for (var i = 0; i < this.length; i++) {
				var item = this[i];
		
				if (item === element) {
					return i;
				}
			}
		
			return -1;
		},
		enumerable: false
	},

	_t_contains: {
		value: function(element) {
			return this._t_arrayIndexOf(element) >= 0;
		},
		enumerable: false
	},

	_t_remove: {
		value: function(element) {
			var index = this._t_arrayIndexOf(element);
			if (index > -1) this.splice(index, 1);
		},
		enumerable: false
	},

	_t_removeAt: {
		value: function(index) {
			this.splice(index, 1);
		}
	},

	_t_clear: {
		value: function() {
			this.length = 0;
		},
		enumerable: false
	},

	_t_pushIfNotExist: {
		value: function(element) {
			if (!this._t_contains(element)) {
				this.push(element);
			}
		},
		enumerable: false
	},

	_t_set: {
		value: function(i) {
			if (arguments.length > 1) {
				for (var j = 1; j < arguments.length - 1; j++) {
					this[i++] = arguments[j];
				}
			}
		},
		enumerable: false
	},

	_t_any: {
		value: function(handler) {
			for (var i = 0; i < this.length; i++) {
				var item = this[i];
		
				if (handler(item)) {
					return true;
				}
			}
		}
	}
});

Object.defineProperties(Float32Array.prototype, {
	_t_set: {
		value: function(i) {
			if (arguments.length > 1) {
				for (var j = 0; j < arguments.length - 1; j++) {
					this[i++] = arguments[j + 1];
				}
			}
		},
		enumerable: false
	},
});
	
// IE ployfill
if (typeof Object.assign !== "function") {
	Object.assign = function(target, varArgs) { // .length of function is 2
		"use strict";

		if (target === undefined || target === null) { // TypeError if undefined or null
			throw new TypeError("cannot convert undefined or null to object");
		}

		var to = Object(target);

		for (var index = 1; index < arguments.length; index++) {
			var nextSource = arguments[index];

			if (nextSource !== undefined && nextSource !== null) { // Skip over if undefined or null
				for (var nextKey in nextSource) {
					// Avoid bugs when hasOwnProperty is shadowed
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	};
}

Object.defineProperties(Tarumae.Utility, {
	invokeIfExist: {
		value: function(obj, method) {
			if (typeof method === "string") {
				if (typeof obj[method] !== "function") return;
				method = obj[method];
			}

			if (typeof method === "function") {
				return method.apply(obj, Array.prototype.slice.call(arguments, 2));
			}
		}
	},

	deprecate: {
		value: function(oldStaff, newStaff) {
			var warningMessageDisplayed = false;

			return function() {
				if (!warningMessageDisplayed) {
					console.warn(oldStaff + " is deprecated, use " + newStaff + " instead");
					warningMessageDisplayed = true;
				}
				return eval(newStaff);
			}
		}
	},

	getImageDataURLFromTexture: {
		value: function(renderer, tex, imgformat = "image/png", imgQuality = 0.85) {
			if (!renderer || !tex) return;

			const width = tex.width, height = tex.height;
			const data = new Uint8Array(width * height * 4);

			tex.use(renderer);
			renderer.gl.readPixels(0, 0, width, height, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, data);
			tex.disuse();

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext("2d");

			if (ctx) {
				const imgData = ctx.createImageData(width, height);

				for (let y = 0; y < height; y++) {
					for (let x = 0; x < width; x++) {
						const index1 = y * width * 4 + x * 4, index2 = (height - y) * width * 4 + x * 4;

						imgData.data[index2 + 0] = data[index1 + 0];
						imgData.data[index2 + 1] = data[index1 + 1];
						imgData.data[index2 + 2] = data[index1 + 2];
						imgData.data[index2 + 3] = data[index1 + 3];
					}
				}

				ctx.putImageData(imgData, 0, 0);
			}

			return canvas.toDataURL(imgformat, imgQuality);
		}
	},

	performMovementAccelerationAnimation: {
		value: function(scene, intensity, attenuation, onframe, onfinish) {

			if (typeof onframe !== "function" || !scene) return;

			const renderer = scene.renderer;
			if (!renderer) return;

			const viewer = renderer.viewer;
			if (!viewer) return;

			const movement = {
				x: viewer.mouse.movement.x * intensity,
				y: viewer.mouse.movement.y * intensity,
			};

			function updateFrame() {
				var xvol = movement.x * attenuation;
				var yvol = movement.y * attenuation;
				movement.x -= xvol;
				movement.y -= yvol;

				onframe(xvol, yvol);

				scene.requireUpdateFrame();

				if (Math.abs(movement.x) > 0.2 || Math.abs(movement.y) > 0.2) {
					requestAnimationFrame(updateFrame);
				} else {
					if (typeof onfinish === "function") {
						onfinish();
					}
				}
			}
			
			requestAnimationFrame(updateFrame);
		}
	},

	// public method for encoding an Uint8Array to base64
	// original code from https://stackoverflow.com/questions/11089732/display-image-from-blob-using-javascript-and-websockets
	byteArrayToBase64: {
		value: function(input) {
			var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			while (i < input.length) {
				chr1 = input[i++];
				chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
				chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}
				output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
					keyStr.charAt(enc3) + keyStr.charAt(enc4);
			}
	
			return output;
		}
	},

	ImageToolkit: {
		value: {
			convertToImageData: function(image) {
				// TODO
			}
		}
	},

  byteToString: {
    value: function(bytes) {
      const uarr = new Uint8Array(bytes);
      const carr = new Array(uarr.length);
      for (let i = 0; i < uarr.length; i++) {
        carr[i] = String.fromCharCode(uarr[i]);
      }
    
      return carr.join("");
    }
  },
});
