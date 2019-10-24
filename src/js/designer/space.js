import Tarumae from "../entry";
import { Vec2 } from "../math/vector";

const _mf = Tarumae.MathFunctions;
let _scene = null;

function _test_main_(scene) {
  _scene = scene;

  // const points = [[100, 100], [800, 100], [800, 700], [100, 700]];

  // scene.ondraw = g => {
  //   g.drawLines(points, 2, "black", "transparent", true);
  // };

  // console.log(LayoutGen.calcFloorArea([[4, 10], [10, 8], [11, 2], [-4, -3]]));

  new WallDesigner(scene);
}

class WallDesigner {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;

    this.hover = null;
    this.drawingStartPoint = null;
    this.drawingEndPoint = null;
    this._status = "nothing";
    this.points = [];
    this.outlinePoints = [];
    this.nodes = [];
    this.lines = [];
    this.drawingDockNode = null;
    // this.drawingStartNode = null;

    this.scene.on("mousedown", e => this.mousedown(e));
    this.scene.on("mousemove", e => this.mousemove(e));
    this.scene.on("mouseup", e => this.mouseup(e));
    this.scene.on("keydown", key => this.keydown(key));
    this.scene.on("draw", g => this.draw(g));
  }

  get status() {
    return this._status;
  }

  set status(v) {
    this._status = v;
    console.log("change status to: " + v);
  }

  mousedown(e) {
    switch (this.status) {
      case "nothing":
        {
          this.status = "startDraw";

          if (this.hover && this.hover.position) {
            this.startDrawingWall(this.hover.position);
          } else {
            this.startDrawingWall(e.position);
          }
        }
        break;
      
      case "drawing":
        const line = this.commitWallNode(e.position);
        this.startDrawingWall(e.position, line.endNode);
        break;
    }
  }

  mouseup(e) {
    
  }

  mousemove(e) {
    if (this.status === "startDraw") {
      this.status = "drawing";
    }

    if (this.status === "drawing") {
      this.drawingEndPoint.x = e.position.x;
      this.drawingEndPoint.y = e.position.y;
      this.scene.requireUpdateFrame();
    }

    if (this.status === "drawing" || this.status === "nothing") {
      const p = e.position;
      const ret = this.findItemByPosition(p);

      if (ret) {
        this.scene.renderer.viewer.setCursor("move");
        this.hover = ret;
      } else {
        this.scene.renderer.viewer.setCursor("default");
        this.hover = null;
      }

      this.scene.requireUpdateFrame();
    }
  }

  keydown(key) {
    switch (key) {
      case Tarumae.Viewer.Keys.Escape:
        this.status = "nothing";
        this.drawingStartPoint = null;
        this.drawingEndPoint = null;
        this.scene.requireUpdateFrame();
        break;
    }
  }

  draw(g) {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].draw(g);
    }

    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].draw(g);
    }
    
    if (this.status === "drawing") {
      if (this.drawingStartPoint && this.drawingEndPoint) {
        g.drawLine(this.drawingStartPoint, this.drawingEndPoint, 2, "red");
      }
    }

    if (this.status === "drawing" || this.status === "nothing") {
      if (this.hover) {
        if (this.hover.position) {
          g.drawPoint(this.hover.position, 20, "transparent", "gray");
        }
      }
    }
  }

  startDrawingWall(p, dockedNode) {
    this.drawingStartPoint = new Tarumae.Point(p);
    this.drawingEndPoint = new Tarumae.Point(p);
    this.drawingDockNode = dockedNode;
  }

  commitWallNode(p) {
    const wallLine = new WallLine(null, new WallNode(p));

    if (this.drawingDockNode) {
      wallLine.startNode = this.drawingDockNode;
      this.drawingDockNode.lines.push(wallLine);
    } else {
      wallLine.startNode = new WallNode(this.drawingStartPoint);
      // this.nodes.push(wallLine.startNode);
    }

    wallLine.startNode.lines.push(wallLine);
    wallLine.update();

    this.lines.push(wallLine);
    this.nodes.push(wallLine.startNode);
    this.nodes.push(wallLine.endNode);

    this.scene.requireUpdateFrame();

    return wallLine;
  }

  updateWallOutline() {

  }

  findItemByPosition(p) {
    for (let i = 0; i < this.nodes.length; i++) {
      const ret = this.nodes[i].hitTestByPosition(p);
      if (ret) return ret;
    }

    for (let i = 0; i < this.lines.length; i++) {
      const ret = this.lines[i].hitTestByPosition(p);
      if (ret) return ret;
    }
  }
}

class WallNode {
  constructor(pos) {
    this.position = new Tarumae.Point(pos);
    this.lines = [];
  }

  draw(g) {
    g.drawPoint(this.position, 15, "transparent", "silver");

    // for (let i = 0; i < this.lines.length; i++) {
    //   this.lines[i].draw(g);
    // }
  }

  hitTestByPosition(p) {
    if (_mf.distancePointToPoint2D(p, this.position) < 10) {
      return { obj: this, type: "node", position: this.position };
    }

    // for (let i = 0; i < this.lines.length; i++) {
    //   const line = this.lines[i];
    //   const ret = line.hitTestByPosition(p);
    //   if (ret) return ret;
    // }
  }
}

class WallLine {
  constructor(startNode, endNode) {
    this.startNode = startNode;
    this.endNode = endNode;

    this.line1Start = new Tarumae.Point();
    this.line1End = new Tarumae.Point();
    this.line2Start = new Tarumae.Point();
    this.line2End = new Tarumae.Point();

    this.angle = 0;
    this.mat = new Tarumae.Matrix3();
  }

  update() {
    if (!this.startNode || !this.endNode) return;

    const y = this.endNode.position.y - this.startNode.position.y;
    const x = this.endNode.position.x - this.startNode.position.x;
    
    this.angle = Math.atan2(y, x) / Math.PI * 360;
    console.log(this.angle);

    const start = new Vec2(this.startNode.position), end = new Vec2(this.endNode.position);
    const v = new Vec2(x, y), nor = v.normalize();
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
    // if (this.endNode) {
    //   this.endNode.draw(g);
    // }

    g.drawLine(this.line1Start, this.line1End, 1, "green");
    g.drawLine(this.line2Start, this.line2End, 1, "gray");

    g.drawLine(this.startNode.position, this.endNode.position, 5, "silver");
  }

  hitTestByPosition(p) {
    const test = _mf.nearestPointToLineSegment2DXY(p, this.startNode.position, this.endNode.position);

    if (test.dist < 10) {
      return { obj: this, type: "line", position: { x: test.x, y: test.y } };
    }
  }
}

class LayoutGen {
  constructor() {
  }

  static calcFloorArea(points) {
    if (points.length < 2) return 0;

    let a = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i], p2 = points[i + 1];
      a += p1[0] * p2[1] - p1[1] * p2[0];
    }
    
    const last = points[points.length - 1][0] * points[0][1] - points[points.length - 1][1] * points[0][0];
    return Math.abs(a + last) / 2;
  }
}

class RoomGraph {
  constructor() {
    this.entry = new SpaceEntry();
    this.entry.origin.set(400, 700);

    // room 1
    this.entry.node = new SpaceNode();
    this.entry.node.bounds = [[100, 100], [800, 100], [800, 700], [100, 700]];
  }

  draw(g) {
    this.entry.draw(g);
  }
}

class SpaceEntry {
  constructor() {
    this.node = null;
    this.origin = new Tarumae.Point();
  }

  draw(g) {
    g.drawEllipse({ x: this.origin.x - 10, y: this.origin.y - 10, width: 20, height: 20}, 5, 'red');

    if (this.node) {
      this.node.draw(g);
    }
  }
}

class SpaceNode {
  constructor() {
    this.entries = [];
    
    this._bounds = new Tarumae.Polygon();
  }

  set bounds(points) {
    this._bounds.points = points;
  }

  get bounds() {
    return this._bounds;
  }

  get origin() {
    return this._bounds.origin;
  }

  draw(g) {
    g.drawPoint(this.origin, 10, 'blue');
    g.drawPolygon(this._bounds, 2, 'black', 'transparent');

    this.entries.forEach(e => e.draw(g));
  }
}

export { _test_main_, RoomGraph, SpaceEntry, SpaceNode };