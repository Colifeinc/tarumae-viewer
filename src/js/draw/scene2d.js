////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"
import "../utility/event"
import "../render/draw2d.js"
import { Vec2, Matrix3 } from "@jingwood/graphics-math";

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
    this.hoverObject = null;
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
        this.objects._t_pushIfNotExist(arg);
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
    for (let i = this.objects.length - 1; i >= 0; i--) {
      var obj = this.objects[i];
      if (!obj.eachChildInv(handler)) break;
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
    let target = null;
    const transformStack = [new Matrix3().loadIdentity()];

    this.eachObjectInv(obj => {
      if (obj.visible && obj.hitTestPoint(p, transformStack)) {
        target = obj;
        return false;
      }
    });

    return target;
  }

  mousedown(pos) {
    const obj = this.findObjectByPosition(pos);
    let isProcessed = false;
    
    if (obj) {
      this.dragObject = obj;
      isProcessed = obj.mousedown(this.createEventArgument(obj));
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

    if (this.hoverObject !== obj) {
      if (this.hoverObject) {
        this.hoverObject.mouseout(this.createEventArgument(this.hoverObject));
      }

      this.hoverObject = obj;

      if (this.hoverObject) {
        obj.mouseenter(this.createEventArgument(this.hoverObject));
      }
    }
    
    this.onmousemove(this.createEventArgument());
  }

  begindrag() {
    const evtArg = this.createEventArgument(this.dragObject);
    
    if (this.dragObject) {
      this.dragObject.begindrag(evtArg);
      this.requireUpdateFrame();
    }
    
    this.onbegindrag(evtArg);
  }

  drag() {
    const evtArg = this.createEventArgument(this.dragObject);

    if (this.dragObject) {
      this.dragObject.drag(evtArg);
      this.requireUpdateFrame();
    }

    this.ondrag(evtArg);
  }

  enddrag() {
    const evtArg = this.createEventArgument(this.dragObject);
    
    if (this.dragObject) {
      this.dragObject.enddrag(evtArg);
      this.dragObject = null;
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
      this,
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
    this.fillColor = "white";
  }
};

////////////// Event //////////////

Draw2D.EventArgument = class {
  constructor(scene, position, movement) {
    this.scene = scene;
    this.position = position;
    this.movement = movement;
  }

  requireUpdateFrame() {
    this.scene.requireUpdateFrame();
  }
};

////////////// Object //////////////

Draw2D.Object = class {
  constructor() {
    this.objects = [];

    this.visible = true;
    this.zIndex = 0;
    this.style = new Draw2D.Style();

    this.bbox = new Tarumae.BBox2D();
    this.origin = new Tarumae.Point(0, 0);

    this.angle = 0;
    this.scale = new Vec2(1, 1);
    this.transform = new Matrix3().loadIdentity();
  }

  // set origin(v) {
  //   this._origin.set(v);
  // }

  add() {
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (Array.isArray(arg)) {
        for (var k = 0; k < arg.length; k++) {
          this.add(arg[k]);
        }
      }
      else {
        this.objects._t_pushIfNotExist(arg);
      }
    }
  }

  remove(obj) {
    this.objects._t_remove(obj);
  }

  clear() {
    this.objects._t_clear();
  }

  eachChild(handler) {
    for (var i = 0; i < this.objects.length; i++) {
      var child = this.objects[i];
      if (handler(child) === false) break;
      if (child.eachChild(handler) === false) break;
    }
  }

  eachChildInv(handler) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const child = this.objects[i];
      if (child.eachChildInv(handler) === false) return false;
      if (handler(child) === false) return false;
    }
  }

  hitTestPoint(p) {
    return this.bbox.contains(p);
  }

  pointToObject(p) {
    // let m = transformStack[transformStack.length - 1];
    // let t = undefined;
    // if (obj.origin.x !== 0 || obj.origin.y !== 0
    //   || obj.angle !== 0
    //   || obj.scale.x !== 1 || obj.scale.y !== 1) {

    //   t = Matrix3.makeTranslation(obj.origin.x, obj.origin.y);
    //   t.rotate(obj.angle);
    //   t.scale(obj.scale.x, obj.scale.y);
    
    //   transformStack.push(t.clone());
    //   m = m.mul(t);
    // }
    
    // p = p.mulMat(m);

    // if (t) {
    //   transformStack.pop();
    // }

    // return new Tarumae.Point(p.x - this.origin.x, p.y - this.origin.y);
    return p;
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

  mouseenter(e) {
    this.onmouseenter(e);
  }

  mouseout(e) {
    this.onmouseout(e);
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
      this.bbox.origin = p;
      this.onmove();
    } else if (arguments.length === 2) {
      this.bbox.origin = { x: arguments[0], y: arguments[1] };
      this.onmove();
    }
  }

  render(g) {
    const style = this.style;
      
    if (style) {
      if (style.strokeWidth) g.strokeWidth = style.strokeWidth;
      if (style.strokeColor) g.strokeColor = style.strokeColor;
      if (style.fillColor) g.fillColor = style.fillColor;
    }

    let t = undefined;
  
    if (this.origin.x !== 0 || this.origin.y !== 0
      || this.angle !== 0
      || this.scale.x !== 1 || this.scale.y !== 1) {
      t = this.transform.loadIdentity();
      t.translate(this.origin.x, this.origin.y);
      t.rotate(this.angle);
      t.scale(this.scale.x, this.scale.y);
      g.pushTransform(t);
    }
      
    this.draw(g);

    for (let k = 0; k < this.objects.length; k++) {
      const child = this.objects[k];
      if (child && child.visible) {
        child.render(g);
      }
    }

    if (t) {
      g.popTransform();
    }
      
    // g.resetDrawingStyle();
  }

  draw(g) {
    this.ondraw(g);
  }

  update() {
    this.updateBoundingBox();
  }
  
  updateBoundingBox() {
  }
};

// Event declarations
new Tarumae.EventDispatcher(Draw2D.Object).registerEvents(
  "mousedown", "mouseup", "mousemove", "mouseenter", "mouseout",
  "mousewheel",
  "begindrag", "drag", "enddrag",
  "getFocus", "lostFocus",
	"keyup", "keydown",
  "childAdd", "childRemove",
  "move", "rotate",
  "draw");

////////////// Line //////////////

Draw2D.Rect = class extends Draw2D.Object {
  constructor(x, y, w, h) {
    super();
    this.rect = new Tarumae.Rect(x, y, w, h);
    this.bbox = this.rect.bbox;
  }
  
  draw(g) {
    g.drawRect(this.rect, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor);

    this.ondraw(g);
  }

  updateBoundingBox() {
    this.bbox.min = this.rect.topLeft;
    this.bbox.max = this.rect.bottomRight;
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

  updateBoundingBox() {
    this.bbox.updateFromTwoPoints(this.line.start, this.line.end);
  }
};

////////////// Ellipse //////////////

Draw2D.Ellipse = class extends Draw2D.Rect {
  constructor(x, y, w, h) {
    super();
  }

  draw(g) {
    g.drawEllipse(this.rect);
    this.ondraw(g);
  }
};

////////////// Image //////////////

Draw2D.Image = class extends Draw2D.Rect {
  constructor(img, x, y, w, h) {
    super();

    this.img = img;
  }

  draw(g) {
    g.drawImage(this.rect, this.img);
  }
};

////////////// Active Point //////////////

Draw2D.ActivePoint = class extends Draw2D.Rect {
  constructor(x, y) {
    super(new Tarumae.Rect(x - 6, y - 6, 12, 12));

    this.style.strokeWidth = 2;
    this.style.strokeColor = "#385377";
    this.style.fillColor = "rgba(150,150,255,0.3)";
  }

  draw(g) {
    g.drawEllipse(this.bbox, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor);
  }

  drag(e) {
    this.bbox.x += e.movement.x;
    this.bbox.y += e.movement.y;

    this.update();
    this.ondrag(e);
  }
};

export default Draw2D;