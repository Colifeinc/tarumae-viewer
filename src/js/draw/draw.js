var Draw2D = {};

////////////// Renderer2D //////////////

Draw2D.Renderer2D = function() {
};

Object.assign(Draw2D.Renderer2D.prototype, {
  
});

////////////// Scene2D //////////////

Draw2D.Scene2D = function() {
  this.animation = false;
  this.requestedUpdateFrame = false;

  this.objects = [];
  this.focusObject = null;
  this.dragObject = null;
};

// Event declarations
new Tarumae.EventDispatcher(Draw2D.Scene2D).registerEvents(
	"mousedown", "mouseup", "mousemove", "mousewheel",
  "begindrag", "drag", "enddrag",
  "getFocus", "lostFocus",
	"keyup", "keydown",
	"objectAdd", "objectRemove",
	"draw");

Object.assign(Draw2D.Scene2D.prototype, {
  show: function() {
    this.renderer.current2DScene = this;
    this.requireUpdateFrame();
  },

  add: function(obj) {
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (Array.isArray(arg)) {
        for (var k = 0; k < arg.length; k++) {
          this.add(arg[k]);
        }
      }
      else {
        this.objects._s3_pushIfNotExist(arg);
      }
    }
    this.requireUpdateFrame();
  },

  remove: function(obj) {
    this.objects.remove(obj);
  },

  render: function(ctx) {
    for (var i = 0; i < this.objects.length; i++) {
      var obj = this.objects[i];
      if (obj) {
        this.drawObject(ctx, obj);
      }
    }

    this.ondraw(ctx);
  },

  drawObject: function(ctx, obj) {
    var style = obj.style;
    
    if (style) {
      if (style.strokeWidth) ctx.strokeColor = style.strokeWidth;
      if (style.strokeStyle) ctx.strokeStyle = style.strokeStyle;
      if (style.fillColor) ctx.fillColor = style.fillColor;
    }
    
    var transformed = false, t = undefined;

    if (obj.angle !== 0) {
      t = obj.transform.loadIdentity();
    
      var origin = obj.getOrigin();
      t.translate(origin.x, origin.y);
      t.rotate(obj.angle);
      t.translate(-origin.x, -origin.y);
    
      ctx.pushTransform(t);
      transformed = true;
    }

    if (obj.scale.x !== 1 || obj.scale.y !== 1) {
      t = t || obj.transform.loadIdentity();
      t.scale(obj.scale.x, obj.scale.y);
    }

    obj.draw(ctx);
    
    for (var k = 0; k < obj.objects.length; k++) {
      var child = obj.objects[k];
      if (child) {
        this.drawObject(ctx, child);
      }
    }
    
    if (transformed) {
      ctx.popTransform();
    }
    
    ctx.resetDrawingStyle();
  },

  requireUpdateFrame: function() {
    this.requestedUpdateFrame = true;
  },

  eachObject: function(handler) {
    var ret = undefined;

    for (var i = 0; i < this.objects.length; i++) {
      var obj = this.objects[i];
      if (handler(obj) === false) break;
      if (obj.eachChild(handler) === false) break;
    }
  },

  eachObjectInv: function(handler) {
    var ret = undefined;

    for (var i = this.objects.length - 1; i >= 0; i--) {
      var obj = this.objects[i];
      if (obj.eachChildInv(handler) === false) break;
      if (handler(obj) === false) break;
    }
  },

  eachObjectFromParentInv: function(parent, handler) {
    var ret = undefined;

    for (var i = parent.objects.length - 1; i >= 0; i--) {
      var obj = parent.objects[i];
      if (handler(obj) === false) break;

      if (this.eachObjectFromParentInv(obj, handler) === false) return false;
    }
  },

  findObjectByPosition: function(p) {
    var target = null;

    this.eachObjectInv(function(obj) {
      if (obj.visible === true && obj.hitTestPoint(p)) {
        target = obj;
        return false;
      }
    });

    return target;
  },

  hitTestObject: function(obj, p) {
    var target = null;
    var transformed = false;
    
    var t = new Matrix3().loadIdentity();
    var transformStack = [];

    if (obj.angle !== 0) {
      transformStack.push(t.clone());

      t.translate(origin.x, origin.y);
      t.rotate(obj.angle);
      t.translate(-origin.x, -origin.y);
    
      transformed = true;
    }

    if (obj.scale.x !== 1 || obj.scale.y !== 1) {
      t.scale(obj.scale.x, obj.scale.y);
    }

    p = p.mulMat(t);

    if (obj.hitTestPoint(p)) {
      target = p;
    }

    return target;
  },

  mousedown: function(pos) {
    var obj = this.findObjectByPosition(pos);
    var isProcessed = false;
    
    if (obj) {
      this.dragObject = obj;
      isProcessed = obj.mousedown(this.createEventArgument(obj)) === true;
    }

    if (!isProcessed) {
      this.onmousedown(this.createEventArgument());
    }  
  },

  mouseup: function() {
    this.onmouseup(this.createEventArgument());
  },

  mousemove: function(pos) {
    var obj = this.findObjectByPosition(pos);
    
    if (obj) {
      obj.mousemove(this.createEventArgument(obj));
    }
    
    this.onmousemove(this.createEventArgument());
  },

  begindrag: function() {
    var evtArg = this.createEventArgument(this.dragObject);
    
    if (this.dragObject) {
      this.dragObject.begindrag(evtArg);
      this.requireUpdateFrame();
    }
    
    this.onbegindrag(evtArg);
  },

  drag: function() {
    var evtArg = this.createEventArgument(this.dragObject);

    if (this.dragObject) {
      this.dragObject.drag(evtArg);
      this.requireUpdateFrame();
    }

    this.ondrag(evtArg);
  },

  enddrag: function() {
    var evtArg = this.createEventArgument(this.dragObject);
    
    if (this.dragObject) {
      this.dragObject.enddrag(evtArg);
      this.requireUpdateFrame();
    }
    
    this.onenddrag(evtArg);
  },

  keydown: function(key) {
    this.onkeydown(key);
  },

  keyup: function(key) {
    this.onkeyup(key);
  },

  createEventArgument: function(obj) {
    if (!this.renderer) return;

    var viewer = this.renderer.viewer;

    if (!viewer) return;

    var arg = new Draw2D.EventArgument(
      viewer.mouse.position,
      viewer.mouse.movement);
    
    if (obj) {
      arg.localPosition = obj.pointToObject(arg.position);
    }

    return arg;
  },
});

////////////// Style //////////////

Draw2D.Style = function() {
  this.strokeWidth = 1;
  this.strokeColor = "black";
  this.fillColor = "transparent";
};

////////////// Event //////////////

Draw2D.EventArgument = function(position, movement) {
  this.position = position;
  this.movement = movement;
};

////////////// Object //////////////

Draw2D.Object = function() {
  Draw2D.Object.setup.call(this);
};

Object.assign(Draw2D.Object, {
  setup: function() {
    this.objects = [];

    this.zIndex = 0;
    this.bbox = new Tarumae.Rect();
    this.style = new Draw2D.Style();
    this.visible = true;

    this.angle = 0;
    this.scale = { x: 1, y: 1 };
    this.transform = new Matrix3().loadIdentity();
  },
});

// Event declarations
new Tarumae.EventDispatcher(Draw2D.Object).registerEvents(
	"mousedown", "mouseup", "mousemove", "mousewheel",
  "begindrag", "drag", "enddrag",
  "getFocus", "lostFocus",
	"keyup", "keydown",
  "childAdd", "childRemove",
  "move", "rotate",
	"draw");

Object.assign(Draw2D.Object.prototype, {

  add: function(obj) {
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (Array.isArray(arg)) {
        for (var k = 0; k < arg.length; k++) {
          this.add(arg[k]);
        }
      }
      else {
        this.objects._s3_pushIfNotExist(arg);
      }
    }
  },

  remove: function(obj) {
    this.objects._s3_remove(obj);
  },

  clear: function() {
    this.objects._s3_clear();
  },

  draw: function(renderer) {
    this.ondraw(renderer);
  },

  eachChild: function(handler) {
    for (var i = 0; i < this.objects.length; i++) {
      var child = this.objects[i];
      if (handler(child) === false) break;
      if (child.eachChild(handler) === false) break;
    }
  },

  eachChildInv: function(handler) {
    for (var i = this.objects.length - 1; i >= 0; i--) {
      var child = this.objects[i];
      if (child.eachChildInv(handler) === false) return false;
      if (handler(child) === false) return false;
    }
  },

  hitTestPoint: function(p) {
    return this.bbox.contains(p);
  },

  pointToObject: function(p) {
    return new Tarumae.Point(p.x - this.bbox.x, p.y - this.bbox.y);
  },

  getOrigin: function() {
    return new Tarumae.Point(this.bbox.x + this.bbox.width / 2, this.bbox.y + this.bbox.height / 2);
  },

  mousedown: function(e) {
    this.onmousedown(e);
  },

  mousemove: function(e) {
    this.onmousemove(e);
  },

  mouseup: function(e) {
    this.onmouseup(e);
  },

  begindrag: function(e) {
    this.onbegindrag(e);
  },

  drag: function(e) {
    this.ondrag(e);
  },

  enddrag: function(e) {
    this.onenddrag(e);
  },
  
  moveTo: function(p) {
    if (arguments.length === 1) {
      this.bbox.origin = p;
      this.onmove();
    } else if (arguments.length === 2) {
      this.bbox.origin = { x: arguments[0], y: arguments[1] };
      this.onmove();
    }
  },
});

////////////// Line //////////////

Draw2D.Rect = function(x, y, w, h) {
  Draw2D.Rect.setup.call(this, x, y, w, h);
};

Object.assign(Draw2D.Rect, {
  prototype: new Draw2D.Object(),

  setup: function(x, y, w, h) {
    Draw2D.Object.setup.call(this);
    this.bbox = new Tarumae.Rect(x, y, w, h);
  }
});

Object.assign(Draw2D.Rect.prototype, {
  draw: function(renderer) {
    renderer.drawRect(this.bbox, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor);

    this.ondraw(renderer);
  }
});

////////////// Line //////////////

Draw2D.Line = function() {
  Draw2D.Object.setup.call(this);
};

Draw2D.Line.prototype = new Draw2D.Object();

////////////// Ellipse //////////////

Draw2D.Ellipse = function(x, y, w, h) {
  Draw2D.Object.setup.call(this);

  this.bbox = new Tarumae.Rect(x, y, w, h);
};

Draw2D.Ellipse.prototype = new Draw2D.Object();

Object.assign(Draw2D.Ellipse.prototype, {
  draw: function(renderer) {
    renderer.drawEllipse(this.bbox);

    this.ondraw(renderer);
  }
});

////////////// Image //////////////

Draw2D.Image = function(img, x, y, w, h) {
  Draw2D.Object.setup.call(this);

  this.img = img;
  this.bbox = new Tarumae.Rect(x, y, w, h);
  
};

Draw2D.Image.prototype = new Draw2D.Object();

Object.assign(Draw2D.Image.prototype, {
  draw: function(renderer) {
    renderer.drawImage(this.bbox, this.img);
  },
});

////////////// Active Point //////////////

Draw2D.ActivePoint = function(x, y) {
  Draw2D.Object.setup.call(this);

  this.style.strokeWidth = 2;
  this.style.strokeColor = "#385377";
  this.style.fillColor = "rgba(150,150,255,0.3)";
  this.bbox = new Tarumae.Rect(x - 6, y - 6, 12, 12);
};

Draw2D.ActivePoint.prototype = new Draw2D.Object();

Object.assign(Draw2D.ActivePoint.prototype, {
  draw: function(renderer) {
    renderer.drawEllipse(this.bbox, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor);
  },

  // hitTestPoint: function(p) {
  //   return true;
  // },

  // mousemove: function(e) {
  // },

  drag: function(e) {
    this.bbox.x += e.movement.x;
    this.bbox.y += e.movement.y;

    this.ondrag(e);
  }
});
