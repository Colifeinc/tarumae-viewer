import Tarumae from "../entry";
import { Vec2 } from "../math/vector";
import Draw2D from "../draw/scene2d";
import { LayoutObject } from "./intbase";

const _mf = Tarumae.MathFunctions;

let nodeIdCounter = 0;
let lineIdCounter = 0;

class WallNode {
  constructor(pos) {
    this.id = nodeIdCounter++;
    this.position = new Tarumae.Point(pos);
    this.lines = [];

    this.hover = false;
    this.selected = false;
  }

  nextNodes(previous) {
    let nodes = [];
    const edge1 = this.position.sub(previous.position);

    for (const l of this.lines) {
      const next = l.selectNode(this);
      
      if (next.id !== previous.id) {
        const edge2 = this.position.sub(next.position);
        const angle = _mf.fixAngle(edge1.angle - edge2.angle);
        
        nodes.push({ node: next, angle, line: l });
      }
    }

    nodes = nodes.sort((n1, n2) => n1.angle - n2.angle);
    return nodes;
  }

  offset(offset) {
    if (offset.x === 0 && offset.y === 0) return;

    this.position.x += offset.x;
    this.position.y += offset.y;

    for (const line of this.lines) {
      line.update();
    }
  }

  moveTo(p) {
    this.position.x = p.x;
    this.position.y = p.y;

    for (const line of this.lines) {
      line.update();
    }
  }

  draw(g) {
    g.drawPoint(this.position, 15, "transparent", this.hover ? "#0dd" : ( this.selected ? "green" : "silver"));

    // for (const line of this.lines) {
    //   line.draw(g);
    // }
  }

  hitTestByPosition(p) {
    if (_mf.distancePointToPoint2D(p, this.position) < 15) {
      return { obj: this, position: this.position };
    }

    // for (let i = 0; i < this.lines.length; i++) {
    //   const line = this.lines[i];
    //   const ret = line.hitTestByPosition(p);
    //   if (ret) return ret;
    // }
  }

  toString() {
    return "wall" + this.id;
  }
}

class WallLine {
  constructor(startNode, endNode) {
    this.id = lineIdCounter++;

    this.startNode = startNode;
    this.endNode = endNode;

    startNode.lines.push(this);
    endNode.lines.push(this);

    this.width = 20;

    this.hover = false;
    this.selected = false;

    this.line1Start = new Tarumae.Point();
    this.line1End = new Tarumae.Point();
    this.line2Start = new Tarumae.Point();
    this.line2End = new Tarumae.Point();

    this._vector = null;
    this._vectorMagnitude = 0;
    this._normalizedVector = null;
    this.angle = 0;
    this.mat = new Tarumae.Matrix3();

    this.objects = [];
  }

  getVector() {
    return this.endNode.position.sub(this.startNode.position);
  }

  selectNode(previous) {
    if (previous === this.startNode) {
      return this.endNode;
    }
    else if (previous === this.endNode) {
      return this.startNode;
    }

    return null;
  }

  moveTo(p) {
    this.startNode.moveTo(diff);
    this.endNode.moveTo(diff);
  }

  // FIXME: stop use offset to move objects
  offset(off) {
    this.startNode.offset(off);
    this.endNode.offset(off);
    this.objects.forEach(o => o.offset(off));
  }

  update() {
    if (!this.startNode || !this.endNode) return;

    this._vector = Vec2.sub(this.endNode.position, this.startNode.position);
    this._normalizedVector = this._vector.normalize();
    this._vectorMagnitude = this._vector.magnitude;
    this._angle = this._vector.angle;

    const start = this.startNode.position, end = this.endNode.position;
    const nor = this._normalizedVector;
    const halfWidth = this.width * 0.5;
    const p1 = start.add(new Vec2(nor.y, -nor.x).mul(halfWidth));
    const p2 = end.add(new Vec2(nor.y, -nor.x).mul(halfWidth));
    const p3 = start.add(new Vec2(-nor.y, nor.x).mul(halfWidth));
    const p4 = end.add(new Vec2(-nor.y, nor.x).mul(halfWidth));

    this.line1Start.x = p1.x;
    this.line1Start.y = p1.y;
    this.line1End.x = p2.x;
    this.line1End.y = p2.y;
    this.line2Start.x = p3.x;
    this.line2Start.y = p3.y;
    this.line2End.x = p4.x;
    this.line2End.y = p4.y;
  }

  draw(g) {
    const color = this.hover ? "#0dd" : (this.selected ? "green" : "gray");

    g.drawLine(this.line1Start, this.line1End, 2, color);
    g.drawLine(this.line2Start, this.line2End, 2, color);

    // g.drawLine(this.startNode.position, this.endNode.position, 5, "silver");
    g.drawPolygon([this.line1Start, this.line1End, this.line2End, this.line2Start],
      2, color, "#ddd");

    const cp = this.startNode.position.add(this._vector.mul(0.5));
    let angle = this._angle;
    if (angle > 90 && angle < 270) angle += 180;
    const lenValue = Number(parseFloat(Math.round(this._vectorMagnitude * 100) / 10000).toFixed(2));
    g.pushRotation(angle, cp.x, cp.y);
    g.drawText(lenValue + " m", new Vec2(0, 3), "black", "center", "0.7em Arial");
    g.popTransform();
  }

  hitTestByPosition(p) {
    const test = _mf.nearestPointToLineSegment2DXY(p, this.startNode.position, this.endNode.position);

    if (test.dist < 13) {
      return { obj: this, position: { x: test.x, y: test.y } };
    }
  }

  add(obj) {
    obj.wall = this;
    this.objects.push(obj);
  }

  remove(obj) {
    obj.wall = null;
    this.objects._t_remove(obj);
  }
}

class WallChildObject extends LayoutObject {
  constructor(width = 80) {
    super();
    this._wall = null;

    this.width = width;
    this.line = new Tarumae.LineSegment2D();

    this.designer = null;
  }

  get wall() {
    return this._wall;
  }

  set wall(wall) {
    if (this._wall !== wall) {
      if (this._wall) {
        this._wall.objects._t_remove(this);
      }

      this._wall = wall;
      this.angle = this._wall._angle;
      this.size = new Tarumae.Size(this.width, this.wall.width);
      this._wall.objects._t_pushIfNotExist(this);
      this.update();
    }
  }

  updateBoundingBox() {
    if (this.wall) {
      const angle = this.wall._angle;

      const m = Tarumae.Matrix3.makeRotation(angle);
      const hw = this.size.width * 0.5, hh = this.wall.width * 0.5;
    
      this.line.start = new Vec2(-hw, 0).mulMat(m);
      this.line.end = new Vec2(hw, 0).mulMat(m);

      const v1 = new Vec2(-hw, -hh).mulMat(m);
      const v2 = new Vec2(hw, hh).mulMat(m);

      this.bbox.min.x = Math.min(v1.x, v2.x);
      this.bbox.min.y = Math.min(v1.y, v2.y);
      this.bbox.max.x = Math.max(v1.x, v2.x);
      this.bbox.max.y = Math.max(v1.y, v2.y);
    }
  }

  drag(e) {
    if (this.designer) {
      // const p = this.pointToObject(e.position);

      const ret = this.designer.findWallLineByPosition(e.position);

      if (ret && ret.obj) {
        const wall = ret.obj;
        if (this.wall !== wall) {
          this.wall = wall;
        }

        this.origin.set(ret.position);
        this.update();
        e.requireUpdateFrame();
      }
    }
    
    return true;
  }

  enddrag(e) {
    if (this.designer) {
      e.requireUpdateFrame();
    }

    return true;
  }
}

class Door extends WallChildObject {
  constructor(width = 80, dir = 0, type = "one_side") {
    super(width);

    this.style.strokeWidth = 3;

    this.dir = dir;
    this.type = type;
  }

  render(g) {
    super.render(g);
    // g.drawLine(this.line.start, this.line.end, 4, "red");
    // g.drawLine({ x: this.bbox.minx, y: this.bbox.miny },
    //   { x: this.bbox.maxx, y: this.bbox.maxy }, 4, "red");
  }

  draw(g) {
    if (this.wall) {
      const w = this.size.width, hw = w * 0.5, h = this.wall.width, hh = h * 0.5;

      switch (this.type) {
        case "one_side":
          defaut:
          g.drawRect(new Tarumae.Rect(-hw, -hh, w, h), this.style.strokeWidth, this.style.strokeColor, "white");
          g.drawArc(new Tarumae.Rect(hw, hh, w, h), 90, 180);
          break;
        
        case "one_slide":
          g.drawRect(new Tarumae.Rect(-w - hw, -hh, w, h));
          g.drawRect(new Tarumae.Rect(-hw, -hh, w, h), 0, "white");
          g.drawLine({ x: -w - hw + 2, y: 0 }, { x: hw - 2, y: 0 }, 1);
          g.drawLine({ x: 0, y: -hh }, { x: 0, y: hh }, 1);
          break;
      }

      super.drawDimension(g, 0, (-hh - 3));
    }
  }

  // updateBoundingBox() {
  //   this.bbox.updateFromPoints(
  // }
}

export { WallLine, WallNode, Door };