import Tarumae from "../entry";
import { Vec2 } from "../math/vector";

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

    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      const next = l.selectNode(this);
      
      if (next.id !== previous.id) {
        const edge2 = this.position.sub(next.position);
        const angle = _mf.fixAngle(edge1.angle - edge2.angle);
        
        nodes.push({ node: next, angle });
      }
    }

    nodes = nodes.sort((n1, n2) => n1.angle - n2.angle);
    return nodes;
  }

  offset(offset) {
    if (offset.x === 0 && offset.y === 0) return;

    this.position.x += offset.x;
    this.position.y += offset.y;

    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].update();
    }
  }

  moveTo(p) {
    this.position.x = p.x;
    this.position.y = p.y;

    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].update();
    }
  }

  draw(g) {
    g.drawPoint(this.position, 15, "transparent", this.hover ? "#0dd" : ( this.selected ? "green" : "silver"));

    // for (let i = 0; i < this.lines.length; i++) {
    //   this.lines[i].draw(g);
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
    const diff = new Tarumae.Point(
      p.x - this.startNode.position.x,
      p.y - this.startNode.position.y);
    
    this.startNode.offset(diff);
    this.endNode.offset(diff);
  }

  update() {
    if (!this.startNode || !this.endNode) return;

    this._vector = Vec2.sub(this.endNode.position, this.startNode.position);
    this._normalizedVector = this._vector.normalize();
    this._vectorMagnitude = this._vector.magnitude;
    this._angle = this._vector.angle;

    const start = this.startNode.position, end = this.endNode.position;
    const nor = this._normalizedVector;
    const p1 = start.add(new Vec2(nor.y, -nor.x).mul(10));
    const p2 = end.add(new Vec2(nor.y, -nor.x).mul(10));
    const p3 = start.add(new Vec2(-nor.y, nor.x).mul(10));
    const p4 = end.add(new Vec2(-nor.y, nor.x).mul(10));

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

    g.drawLine(this.startNode.position, this.endNode.position, 5, "silver");

    const cp = this.startNode.position.add(this._vector.mul(0.5));
    let angle = this._angle;
    if (angle > 90 && angle < 270) angle += 180;
    const lenValue = Number(parseFloat(Math.round(this._vectorMagnitude * 100) / 10000).toFixed(2));
    g.pushRotation(angle, cp.x, cp.y);
    g.drawText(lenValue + " m", new Vec2(0, -2), "black", "center", "0.7em Arial");
    g.popTransform();
  }

  hitTestByPosition(p) {
    const test = _mf.nearestPointToLineSegment2DXY(p, this.startNode.position, this.endNode.position);

    if (test.dist < 13) {
      return { obj: this, position: { x: test.x, y: test.y } };
    }
  }
}

export { WallLine, WallNode };