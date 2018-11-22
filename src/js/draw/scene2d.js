import Tarumae from "../entry"
import "../utility/event"
import { Vec2 } from "../math/vector";

var Draw2D = {};

////////////// Renderer2D //////////////

Draw2D.Renderer2D = class {
  constructor() {
  }
};

////////////// Scene2D //////////////

Draw2D.Scene2D = class {
  constructor() {
    this.animation = false;
    this.requestedUpdateFrame = false;

    this.objects = [];
    this.focusObject = null;
    this.dragObject = null;
  }

  show() {
    this.renderer.current2DScene = this;
    this.requireUpdateFrame();
  }

  add() {
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
  }

  remove(obj) {
    this.objects.remove(obj);
  }

  render(g) {
    for (var i = 0; i < this.objects.length; i++) {
      var obj = this.objects[i];
      if (obj && obj.visible) {
        obj.render(g);
      }
    }

    this.ondraw(g);
  }

  requireUpdateFrame() {
    this.requestedUpdateFrame = true;
  }

  eachObject(handler) {
    var ret = undefined;

    for (var i = 0; i < this.objects.length; i++) {
      var obj = this.objects[i];
      if (handler(obj) === false) break;
      if (obj.eachChild(handler) === false) break;
    }
  }

  eachObjectInv(handler) {
    var ret = undefined;

    for (var i = this.objects.length - 1; i >= 0; i--) {
      var obj = this.objects[i];
      if (obj.eachChildInv(handler) === false) break;
      if (handler(obj) === false) break;
    }
  }

  eachObjectFromParentInv(parent, handler) {
    var ret = undefined;

    for (var i = parent.objects.length - 1; i >= 0; i--) {
      var obj = parent.objects[i];
      if (handler(obj) === false) break;

      if (this.eachObjectFromParentInv(obj, handler) === false) return false;
    }
  }

  findObjectByPosition(p) {
    var target = null;

    this.eachObjectInv(function(obj) {
      if (obj.visible && obj.hitTestPoint(p)) {
        target = obj;
        return false;
      }
    });

    return target;
  }

  hitTestObject(obj, p) {
    var target = null;
    var transformed = false;
    
    var t = new Tarumae.Matrix3().loadIdentity();
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
  }

  mousedown(pos) {
    var obj = this.findObjectByPosition(pos);
    var isProcessed = false;
    
    if (obj) {
      this.dragObject = obj;
      isProcessed = obj.mousedown(this.createEventArgument(obj)) === true;
    }

    if (!isProcessed) {
      this.onmousedown(this.createEventArgument());
    }  
  }

  mouseup() {
    this.onmouseup(this.createEventArgument());
  }

  mousemove(pos) {
    var obj = this.findObjectByPosition(pos);
    
    if (obj) {
      obj.mousemove(this.createEventArgument(obj));
    }
    
    this.onmousemove(this.createEventArgument());
  }

  begindrag() {
    var evtArg = this.createEventArgument(this.dragObject);
    
    if (this.dragObject) {
      this.dragObject.begindrag(evtArg);
      this.requireUpdateFrame();
    }
    
    this.onbegindrag(evtArg);
  }

  drag() {
    var evtArg = this.createEventArgument(this.dragObject);

    if (this.dragObject) {
      this.dragObject.drag(evtArg);
      this.requireUpdateFrame();
    }

    this.ondrag(evtArg);
  }

  enddrag() {
    var evtArg = this.createEventArgument(this.dragObject);
    
    if (this.dragObject) {
      this.dragObject.enddrag(evtArg);
      this.requireUpdateFrame();
    }
    
    this.onenddrag(evtArg);
  }

  keydown(key) {
    this.onkeydown(key);
  }

  keyup(key) {
    this.onkeyup(key);
  }

  createEventArgument(obj) {
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
  }
};

// Event declarations
new Tarumae.EventDispatcher(Draw2D.Scene2D).registerEvents(
	"mousedown", "mouseup", "mousemove", "mousewheel",
  "begindrag", "drag", "enddrag",
  "getFocus", "lostFocus",
	"keyup", "keydown",
	"objectAdd", "objectRemove",
	"draw");

////////////// Style //////////////

Draw2D.Style = class {
  constructor() {
    this.strokeWidth = 1;
    this.strokeColor = "black";
    this.fillColor = "transparent";
  }
};

////////////// Event //////////////

Draw2D.EventArgument = class {
  constructor(position, movement) {
    this.position = position;
    this.movement = movement;
  }
};

////////////// Object //////////////

Draw2D.Object = class {
  constructor() {
    this.objects = [];

    this.zIndex = 0;
    this.rect = new Tarumae.Rect();
    this.style = new Draw2D.Style();
    this.visible = true;

    this.angle = 0;
    this.scale = new Vec2(1, 1);
    this.transform = new Tarumae.Matrix3().loadIdentity();
  }

  add() {
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
  }

  remove(obj) {
    this.objects._s3_remove(obj);
  }

  clear() {
    this.objects._s3_clear();
  }

  draw(g) {
    this.ondraw(g);
  }

  eachChild(handler) {
    for (var i = 0; i < this.objects.length; i++) {
      var child = this.objects[i];
      if (handler(child) === false) break;
      if (child.eachChild(handler) === false) break;
    }
  }

  eachChildInv(handler) {
    for (var i = this.objects.length - 1; i >= 0; i--) {
      var child = this.objects[i];
      if (child.eachChildInv(handler) === false) return false;
      if (handler(child) === false) return false;
    }
  }

  hitTestPoint(p) {
    return this.rect.contains(p);
  }

  pointToObject(p) {
    return new Tarumae.Point(p.x - this.rect.x, p.y - this.rect.y);
  }

  get origin() {
    return this.rect.origin;
  }

  set origin(v) {
    this.rect.origin = v;
  }

  mousedown(e) {
    this.onmousedown(e);
  }

  mousemove(e) {
    this.onmousemove(e);
  }

  mouseup(e) {
    this.onmouseup(e);
  }

  begindrag(e) {
    this.onbegindrag(e);
  }

  drag(e) {
    this.ondrag(e);
  }

  enddrag(e) {
    this.onenddrag(e);
  }
  
  moveTo(p) {
    if (arguments.length === 1) {
      this.rect.origin = p;
      this.onmove();
    } else if (arguments.length === 2) {
      this.rect.origin = { x: arguments[0], y: arguments[1] };
      this.onmove();
    }
  }

  render(g) {
    const style = this.style;
      
    if (style) {
      if (style.strokeWidth) g.strokeColor = style.strokeWidth;
      if (style.strokeStyle) g.strokeStyle = style.strokeStyle;
      if (style.fillColor) g.fillColor = style.fillColor;
    }

    this.draw(g);

    for (let k = 0; k < this.objects.length; k++) {
      const child = this.objects[k];
      if (child && child.visible) {
        child.render(g);
      }
    }
      
    // g.resetDrawingStyle();
  }
};

// Event declarations
new Tarumae.EventDispatcher(Draw2D.Object).registerEvents(
	"mousedown", "mouseup", "mousemove", "mousewheel",
  "begindrag", "drag", "enddrag",
  "getFocus", "lostFocus",
	"keyup", "keydown",
  "childAdd", "childRemove",
  "move", "rotate",
  "draw");
  
////////////// ContainerObject //////////////

Draw2D.ContainerObject = class extends Draw2D.Object {
  constructor() {
    super();

    this.rect = new Tarumae.Rect(0, 0, 100, 100);
    this.scale = new Vec2(1, 1);
  }

  render(g) {
    
    let t = undefined;
  
    if (this.rect.x !== 0 || this.rect.y !== 0) {
      t = this.transform.loadIdentity();
      t.translate(this.rect.x, this.rect.y);
    }

    if (this.angle !== 0) {
      t = t || this.transform.loadIdentity();
      
      t.rotate(this.angle, this.origin.x, this.origin.y);
    }
  
    if (this.scale.x !== 1 || this.scale.y !== 1) {
      t = t || this.transform.loadIdentity();
      t.scale(this.scale.x, this.scale.y);
    }

    if (t) {
      g.pushTransform(t);
    }
      
    super.render(g);

    if (t) {
      g.popTransform();
    }
  }
};

////////////// Line //////////////

Draw2D.Rect = class extends Draw2D.Object {
  constructor(x, y, w, h) {
    super();
    this.rect = new Tarumae.Rect(x, y, w, h);
  }
  
  draw(g) {
    g.drawRect(this.rect, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor);

    this.ondraw(g);
  }
};

////////////// Line //////////////

Draw2D.Line = class extends Draw2D.Object {
  constructor(start, end) {
    super();

    this.line = new Tarumae.LineSegment2D(start, end);
  }

  draw(g) {
    g.drawLine(this.line.start, this.line.end,
      this.style.strokeWidth, this.style.strokeColor);
  }
};

////////////// Ellipse //////////////

Draw2D.Ellipse = class extends Draw2D.Object {
  constructor(x, y, w, h) {
    super();
    this.rect = new Tarumae.Rect(x, y, w, h);
  }

  draw(g) {
    g.drawEllipse(this.rect);
    this.ondraw(g);
  }
};

////////////// Image //////////////

Draw2D.Image = class extends Draw2D.Object {
  constructor(img, x, y, w, h) {
    super();

    this.img = img;
    this.rect = new Tarumae.Rect(x, y, w, h);
  }

  draw(g) {
    g.drawImage(this.rect, this.img);
  }
};

////////////// Active Point //////////////

Draw2D.ActivePoint = class extends Draw2D.Object {
  constructor(x, y) {
    super();

    this.style.strokeWidth = 2;
    this.style.strokeColor = "#385377";
    this.style.fillColor = "rgba(150,150,255,0.3)";
    this.rect = new Tarumae.Rect(x - 6, y - 6, 12, 12);
  }

  draw(g) {
    g.drawEllipse(this.rect, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor);
  }

  drag(e) {
    this.rect.x += e.movement.x;
    this.rect.y += e.movement.y;

    this.ondrag(e);
  }
};

export default Draw2D;