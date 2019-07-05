
////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016 unvell, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"

Tarumae.EventDispatcher = class {
  constructor(cstor) {
    if (!cstor) {
      throw "Owner object to define events cannot be null or undefined";
    }

    this.owner = cstor;
    this.events = {};
  }

  registerEvents() {
    for (var i = 0; i < arguments.length; i++) {
      var eventName = arguments[i];
      this.events[eventName] = null;
      this.setupPrototypeEventDispatcher(this.owner, eventName);
		}
  }

  setupPrototypeEventDispatcher(cstor, name) {
    var _this = this;

    var addEventListener = function(eventName, listener) {
      var obj = this;

      if (eventName.indexOf(" ") > 0) {
        var eventNames = eventName.split(" ");
        for (var i = 0; i < eventNames.length; i++) {
          _this.addEventListenerForObject(obj, eventNames[i], listener);
        }
      } else {
        _this.addEventListenerForObject(obj, eventName, listener);
      }

      return listener;
    };

    var proto = cstor.prototype;
    
    // addEventListener
    if (typeof proto.addEventListener !== "function") {
      proto.addEventListener = addEventListener;
    }

    if (typeof proto.on !== "function") {
      proto.on = proto.addEventListener;
    }

    // removeEventListener
    if (typeof proto.removeEventListener !== "function") {
      proto.removeEventListener = function(eventName, listener) {

        if (!this._eventListeners.hasOwnProperty(eventName)) {
          if (!(function() {
            if (eventName.startsWith("on")) {
              var eventNameWithoutOn = eventName.substr(2);

              if (_this.events.hasOwnProperty(eventNameWithoutOn)) {
                console.warn("recommended to remove 'on' prefix for removing event listener: " + eventName);
                eventName = eventNameWithoutOn;

                return true;
              }
            }

            return false;
          })()) {
            console.warn("listener to be removed from an event which does not exist: " + eventName);
            return;
          }
        }

        this._eventListeners[eventName]._t_remove(listener);
      };
    }
    
    // define event property
    Object.defineProperty(proto, "on" + name, {
      get: function() {
        
        // raise event
        return function() {
          if (typeof this._eventListeners !== "object"
            || !this._eventListeners.hasOwnProperty(name)) {
            return;
          }
            
          var listenerList = this._eventListeners[name];

          var ret;
            
          for (var i = 0; i < listenerList.length; i++) {
            var listener = listenerList[i];
            ret = listener.apply(this, arguments);

            if (ret === true) {
              break;
            }
          }

          return ret;
        };
      },

      set: function(listener) {
        // if assign listener to an event, clear all current registered events
        if (typeof this._eventListeners === "undefined") {
          Object.defineProperty(this, "_eventListeners", {
            value: {},
            enumerable: false,
          });
        }

        this._eventListeners[name] = [listener];
      },

      enumerable: false,
    });
  }

  addEventListenerForObject(obj, eventName, listener) {
    if (!this.events.hasOwnProperty(eventName)) {

      if (!(function() {
        if (eventName.startsWith("on")) {
          var eventNameWithoutOn = eventName.substr(2);

          if (this.events.hasOwnProperty(eventNameWithoutOn)) {
            console.warn("recommended to remove 'on' prefix for adding event listener: " + eventName);
            eventName = eventNameWithoutOn;

            return true;
          }
        }

        return false;
      }).call(this)) {
        console.warn("event to be listened does not exist: " + eventName);
        return;
      }
    }

    if (typeof obj._eventListeners === "undefined") {
      Object.defineProperty(obj, "_eventListeners", {
        value: {},
        enumerable: false,
      });
    }

    if (!obj._eventListeners.hasOwnProperty(eventName)) {
      obj._eventListeners[eventName] = [];
    }

    obj._eventListeners[eventName]._t_pushIfNotExist(listener);
  }
}
