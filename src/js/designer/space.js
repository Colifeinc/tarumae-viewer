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
    this.gridSize = 15;

    this._mode = "drawing";
    this._status = "nothing";

    this.hover = null;
    this.mouseStartPoint = null;
    this.drawingEndPoint = null;
    this.points = [];
    this.outlinePoints = [];
    this.nodes = [];
    this.lines = [];
    this.hotDockStart = null;
    this.selectedObjects = [];
    // this.drawingStartNode = null;

    this.scene.on("mousedown", e => this.mousedown(e));
    this.scene.on("mousemove", e => this.mousemove(e));
    this.scene.on("mouseout", e => this.mouseout(e));
    this.scene.on("mouseup", e => this.mouseup(e));
    this.scene.on("ondrag", e => this.drag(e));
    this.scene.on("enddrag", e => this.enddrag(e));
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
  
  get mode() {
    return this._mode;
  }

  set mode(v) {
    this._mode = v;
    
    if (this._mode !== "drawing") {
      this.hover = null;
      this.status = "nothing";
      this.drawingEndPoint = null;
      this.invalidate();
    } else if (this._mode === "drawing") {
    }

    console.log("change mode to: " + v);
  }

  mousedown(e) {
    const p = e.position;

    if (this.mode === "drawing") {
      const sp = this.positionSnapToGrid(p);

      switch (this.status) {
        case "nothing":
          {
            this.status = "startDraw";

            if (this.hover && this.hover.position) {
              this.startDrawingWall(this.hover.position, this.hover);
            } else {
              this.startDrawingWall(sp);
            }
          }
          break;
      
        case "drawing":
          {
            const fromStart = new Tarumae.Point(p.x - this.mouseStartPoint.x, p.y - this.mouseStartPoint.y);
            if (this.scene.renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
              if (Math.abs(fromStart.x) > Math.abs(fromStart.y)) {
                sp.y = this.mouseStartPoint.y;
              } else {
                sp.x = this.mouseStartPoint.x;
              }
            }
          
            let dockedNode;

            if (this.hover) {
              // if (this.hover.obj instanceof WallNode) {
                dockedNode = this.hover.obj;
              // }
            }

            const line = this.commitWallNode(sp, this.hover);
            this.startDrawingWall(sp, { obj: line.endNode, position: sp });
          }
          break;
      }
    } else if (this.mode === "move") {
      const ret = this.findItemByPosition(p);

      if (ret) {
        if (ret.obj) {
          this.selectObject(ret.obj);

          this.mouseStartPoint = new Tarumae.Point(p);
          this.mode = "moving";
        }
      }
    }
  }

  mousemove(e) {
    const p = e.position;

    // drawing
    if (this.mode === "drawing") {
      if (this.status === "startDraw") {
        this.status = "drawing";
      }

      if (this.status === "drawing") {
        const snappedPos = this.positionSnapToGrid(p);
     
        const fromStart = new Tarumae.Point(p.x - this.mouseStartPoint.x, p.y - this.mouseStartPoint.y);
        if (this.scene.renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
          if (Math.abs(fromStart.x) > Math.abs(fromStart.y)) {
            snappedPos.y = this.mouseStartPoint.y;
          } else {
            snappedPos.x = this.mouseStartPoint.x;
          }
        }

        this.drawingEndPoint.x = snappedPos.x;
        this.drawingEndPoint.y = snappedPos.y;
        this.scene.requireUpdateFrame();
      }

      if (this.status === "drawing" || this.status === "nothing") {
        this.hover = null;

        const ret = this.findItemByPosition(this.positionSnapToGrid(p));

        if (this.mode === "drawing") {
          if (ret) {
            this.hover = ret;
          }
        }

        this.invalidate();
      }
    }

    // move
    if (this.mode === "move") {
      const ret = this.findItemByPosition(this.positionSnapToGrid(p));

      if (this.hover) {
        if (this.hover.obj) this.hover.obj.hover = false;
      }

      if (ret) {        
        if (ret.obj) {
          ret.obj.hover = true;
        }

        this.hover = ret;
        this.scene.renderer.viewer.setCursor("move");
      } else {
        this.hover = null;
        this.scene.renderer.viewer.setCursor("default");
      }

      this.invalidate();
    }
  }

  mouseup(e) {
  }
  
  mouseout() {
  }

  drag(e) {
    const p = e.position;

    if (this.mode === "moving") {
      const fromStart = new Tarumae.Point(p.x - this.mouseStartPoint.x, p.y - this.mouseStartPoint.y);
      const offset = new Tarumae.Point(e.movement);

      if (this.scene.renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) { 
        if (Math.abs(fromStart.x) > Math.abs(fromStart.y)) {
          offset.y = 0;
        } else {
          offset.x = 0;
        }
      }

      this.offsetSelectedObjects(offset);
    }
  }

  enddrag(e) {
    if (this.mode === "moving") {
      this.mode = "move";
    }
  }

  keydown(key) {
    switch (key) {

      case Tarumae.Viewer.Keys.D1:
        this.mode = "drawing";
        break;

      case Tarumae.Viewer.Keys.D2:
          this.mode = "move";
          break;
    
      case Tarumae.Viewer.Keys.Escape:
        this.status = "nothing";
        this.mouseStartPoint = null;
        this.drawingEndPoint = null;
        this.invalidate();
        break;
    }
  }

  draw(g) {
    this.drawGuideGrid(g);

    // walls
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].draw(g);
    }

    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].draw(g);
    }
    
    // drawing
    if (this.mode === "drawing" && this.status === "drawing") {
      if (this.mouseStartPoint && this.drawingEndPoint) {
        g.drawLine(this.mouseStartPoint, this.drawingEndPoint, 2, "red");
      }
    }

    // drawing & hover
    if (this.mode === "drawing") {
      if (this.status === "drawing" || this.status === "nothing") {
        if (this.hover) {
          if (this.hover.position) {
            g.drawPoint(this.hover.position, 15, "transparent", "red");
          }
        }
      }
    }
  }

  drawGuideGrid(g) {
    const renderWidth = this.scene.renderer.renderSize.width;
    const renderHeight = this.scene.renderer.renderSize.height;

    // small grid
    for (let y = 0; y < renderHeight; y += this.gridSize) {
      g.drawLine([0, y], [renderWidth, y], 1, "#eee");       
    }

    for (let x = 0; x < renderWidth; x += this.gridSize) {
      g.drawLine([x, 0], [x, renderHeight], 1, "#eee"); 
    }

    // large grid

    for (let y = 0; y < renderHeight; y += this.gridSize * 5) {
      g.drawLine([0, y], [renderWidth, y], 2, "#ddd");
    }

    for (let x = 0; x < renderWidth; x += this.gridSize * 5) {
      g.drawLine([x, 0], [x, renderHeight], 2, "#ddd"); 
    }
  }

  invalidate() {
    this.scene.requireUpdateFrame();
  }

  startDrawingWall(p, hotdock) {
    this.mouseStartPoint = new Tarumae.Point(p);
    this.drawingEndPoint = new Tarumae.Point(p);
    this.hotDockStart = hotdock;
    console.log("start dock node = " + this.hotDockStart);
  }

  commitWallNode(p, hotdock) {
    if (hotdock) {
      p = hotdock.position;
    }

    let endNode;
    if (hotdock && hotdock.obj instanceof WallNode) {
      endNode = hotdock.obj;
    } else if (hotdock && hotdock.obj instanceof WallLine) {
      endNode = this.splitLine(hotdock.obj, hotdock.position);
    }
    else {
      endNode = new WallNode(p);
      this.nodes.push(endNode);
    }

    let startNode;

    if (this.hotDockStart) {
      if (this.hotDockStart.obj instanceof WallNode) {
        startNode = this.hotDockStart.obj;
      } else if (this.hotDockStart.obj instanceof WallLine) {
        startNode = this.splitLine(this.hotDockStart.obj, this.hotDockStart.position);
      }
    } else {
      startNode = new WallNode(this.mouseStartPoint);
      this.nodes.push(startNode);
    }

    const wallLine = new WallLine(startNode, endNode);
    startNode.lines.push(wallLine);
    endNode.lines.push(wallLine);
    
    wallLine.update();
    this.lines.push(wallLine);

    this.scene.requireUpdateFrame();

    return wallLine;
  }

  splitLine(line, position) {
    const newNode = new WallNode(position);
    const newLine = new WallLine(newNode, line.endNode);
    
    // existing line
    line.endNode.lines._t_remove(line);
    line.endNode = newNode;

    // new line
    newLine.endNode.lines.push(newLine);

    // new node
    newNode.lines.push(line);
    newNode.lines.push(newLine);

    this.nodes.push(newNode);
    this.lines.push(newLine);

    return newNode;
  }

  positionSnapToGrid(p) {
    const h = this.gridSize / 2;
    const dx = p.x % this.gridSize, dy = p.y % this.gridSize;
    const x = p.x + (dx < h ? -dx : (this.gridSize - dx));
    const y = p.y + (dy < h ? -dy : (this.gridSize - dy));
    
    return new Tarumae.Point(x, y);
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

  selectObject(obj, append) {
    if (!append) {
      this.deselectAllObjects();
    }
    obj.selected = true;
    this.selectedObjects._t_pushIfNotExist(obj);
    this.invalidate();
  }

  deselectAllObjects() {
    this.selectedObjects.forEach(obj => obj.selected = false);
    this.selectedObjects._t_clear();
    this.invalidate();
  }

  moveToSelectedObjects(p) {
    for (let i = 0; i < this.selectedObjects.length; i++) {
      this.moveToObject(this.selectedObjects[i], p);
    }
  }

  moveToObject(obj, p) {
    obj.moveTo(p);
    this.invalidate();
  }

  offsetSelectedObjects(offset) {
    for (let i = 0; i < this.selectedObjects.length; i++) {
      this.offsetObject(this.selectedObjects[i], offset);
    }
  }

  offsetObject(obj, offset) {
    if (obj instanceof WallNode) {
      obj.offset(offset);
    } else if (obj instanceof WallLine) {
      obj.startNode.offset(offset);
      obj.endNode.offset(offset);
    }

    this.invalidate();
  }
}

class WallNode {
  constructor(pos) {
    this.position = new Tarumae.Point(pos);
    this.lines = [];

    this.hover = false;
    this.selected = false;
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
}

class WallLine {
  constructor(startNode, endNode) {
    this.startNode = startNode;
    this.endNode = endNode;

    this.hover = false;
    this.selected = false;

    this.line1Start = new Tarumae.Point();
    this.line1End = new Tarumae.Point();
    this.line2Start = new Tarumae.Point();
    this.line2End = new Tarumae.Point();

    this.angle = 0;
    this.mat = new Tarumae.Matrix3();
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

    const y = this.endNode.position.y - this.startNode.position.y;
    const x = this.endNode.position.x - this.startNode.position.x;
    
    this.angle = Math.atan2(y, x) / Math.PI * 360;

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

    const color = this.hover ? "#0dd" : (this.selected ? "green" : "gray");

    g.drawLine(this.line1Start, this.line1End, 2, color);
    g.drawLine(this.line2Start, this.line2End, 2, color);

    g.drawLine(this.startNode.position, this.endNode.position, 5, "silver");
  }

  hitTestByPosition(p) {
    const test = _mf.nearestPointToLineSegment2DXY(p, this.startNode.position, this.endNode.position);

    if (test.dist < 13) {
      return { obj: this, position: { x: test.x, y: test.y } };
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