import Tarumae from "../entry";
import { Vec2 } from "../math/vector";
import { WallNode, WallLine, Area } from "./wall";

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
    this.rooms = [];
    this.areas = [];
    this.hoverArea = null;

    this.scene.on("mousedown", e => this.mousedown(e));
    this.scene.on("mousemove", e => this.mousemove(e));
    this.scene.on("mouseout", e => this.mouseout(e));
    this.scene.on("mouseup", e => this.mouseup(e));
    this.scene.on("drag", e => this.drag(e));
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

    this.hoverArea = null;
  }

  mouseup(e) {
  }
  
  mouseout() {
  }

  drag(e) {
    const p = e.position;

    if (this.mode === "moving") {
      const fromStart = new Vec2(p.x - this.mouseStartPoint.x,
        p.y - this.mouseStartPoint.y);
      const offset = new Vec2(e.movement);

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

      this.scanRooms();
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

  positionSnapToGrid(p) {
    const h = this.gridSize / 2;
    const dx = p.x % this.gridSize, dy = p.y % this.gridSize;
    const x = p.x + (dx < h ? -dx : (this.gridSize - dx));
    const y = p.y + (dy < h ? -dy : (this.gridSize - dy));
    
    return new Tarumae.Point(x, y);
  }

  draw(g) {
    this.drawGuideGrid(g);

    // rooms
    this.areas.forEach(area => {
      g.drawPolygon(area.polygon, 0, "transparent", '#ffffee');
      g.drawText((area.areaValue / 1000) + " m²", area.centerPoint, "#000000", "center", "14px Arial");
    });

    // walls
    this.lines.forEach(l => l.draw(g));
    this.nodes.forEach(n => n.draw(g));

    // drawing
    if (this.mode === "drawing" && this.status === "drawing") {
      if (this.mouseStartPoint && this.drawingEndPoint) {
        
        g.drawLine(this.mouseStartPoint, this.drawingEndPoint, 2, "red");

        const angle = Math.round(this.drawingEndPoint.sub(this.mouseStartPoint).angle);
        g.drawText(angle + "˚", {
          x: this.drawingEndPoint.x,
          y: this.drawingEndPoint.y - 10
        }, "red");
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

    let startNode, endNode;

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

    if (hotdock) {
      if (hotdock.obj instanceof WallNode) {
        endNode = hotdock.obj;
      } else if (hotdock && hotdock.obj instanceof WallLine) {
        endNode = this.splitLine(hotdock.obj, hotdock.position);
      }
    } else {
      endNode = new WallNode(p);
      this.nodes.push(endNode);
    }

    const wallLine = new WallLine(startNode, endNode);
    startNode.lines.push(wallLine);
    endNode.lines.push(wallLine);
    
    wallLine.update();
    this.lines.push(wallLine);

    this.scene.requireUpdateFrame();

    this.scanRooms();

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

  updateWallOutline() {

  }

  scanRooms() {
    this.scanAreas();
  }

  scanAreas() {
    this.areas = [];

    this.lines.forEach(l => this.scanFromLine(l.startNode, l.endNode));
    this.lines.forEach(l => this.scanFromLine(l.endNode, l.startNode));
  }

  scanFromLine(start, end) {
    // skip if n1 has only one line, no closure path
    if (start.lines.length <= 1 || end.lines.length <= 1) return;

    const ss = new ScanSessionStack();
    const area = this.scanFromTwoNode(start, end, ss);

    if (area != null
      && area.totalAngle <= ((area.polygon.length - 2) * 180) + 1
      && !this.existedArea(area)
    ) {
      area.update();
      this.areas.push(area);
      console.debug('found area: ', area);
      return area;
    }
  }

  scanFromTwoNode(start, end, ss) {
    // // can remove?
    // if (ss.visitedNode(end) && !ss.isStartNode(end))
    // {
    // 	// never reached
    // 	return;
    // }

    if (ss.isStartNode(end)) {
      let desc = "";
      const polygon = [];
      const nodes = [];
      let centerPoint = new Vec2();

      ss.getPath().forEach(pn => {
        desc += pn.id + "  ";
        polygon.push(pn.position);
        nodes.push(pn);
      });

      desc += start.id;
      polygon.push(start.position);
      nodes.push(start);

      if (nodes.length > 2) {
        const a1 = nodes[0].position.sub(start.position).angle;
        const a2 = nodes[0].position.sub(nodes[1].position).angle;
          
        const lastAngle = _mf.fixAngle(a1 - a2);

        const area = new Area();
        area.nodes = nodes;
        area.polygon = polygon;
        area.desc = desc;
        area.totalAngle = ss.current.totalAngle + lastAngle;

        return area;
      }

      // number of vertices for a polygon is less than 3, illegal polygon?
      console.debug("vertices of polygon lesses than 3");
      return;
    }

    ss.addVisit(start, end);

    const nexts = end.nextNodes(start);

    if (nexts.length == 1) {
      const ni = nexts[0];

      if (ss.visitedPath(end, ni.node)) return;

      ss.current.totalAngle += ni.angle;
      const area = this.scanFromTwoNode(end, ni.node, ss);
      if (area) return area;
    }
    else if (nexts.length > 1) {
      for (let i = 0; i < nexts.length; i++) {
        const ni = nexts[i];

        if (ss.visitedPath(end, ni.node)) return;

        ss.push();
        ss.current.totalAngle += ni.angle;
        const area = this.scanFromTwoNode(end, ni.node, ss);
        if (area) return area;
        ss.pop();
      }
    }
  }

  existedArea(a) {
    for (let i = 0; i < this.areas.length; i++) {
      if (WallDesigner.isSameArea(this.areas[i].nodes, a.nodes)) {
        return true;
      }
    }
    return false;
  }

  static isSameArea(n1, n2) {
    if (n1.length !== n2.length) return false;

    for (let j = 0; j < n1.length; j++) {
      let same = true;

      for (let i = j, k = 0; k < n2.length; i++ , k++) {
        if (i >= n1.length) i = 0;

        if (n1[i] != n2[k]) {
          same = false;
          break;
        }
      }

      if (same) return true;

      same = true;

      for (let i = j, k = 0; k < n2.length; i-- , k++) {
        if (i < 0) i = n1.length - 1;

        if (n1[i] != n2[k]) {
          same = false;
          break;
        }
      }

      if (same) return true;
    }

    return false;
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

  findAreaByPosition(p) {

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

class ScanSession {
  constructor() {
    this.lines = {};
    this.route = [];
    this.totalAngle = 0;
  }
}

class ScanSessionStack {
  constructor() {
    this.stack = [];
    this.push();
  }

  get current() {
    if (this.stack.length <= 0) return;
    return this.stack[this.stack.length - 1];
  }
  
  push() {
    const ss = new ScanSession();
    if (this.current) ss.totalAngle = this.current.totalAngle;
    this.stack.push(ss);
  }

  pop() {
    this.stack.pop();
  }

  addVisit(start, end) {
    this.current.lines[start.id] = end.id;
    this.current.route.push(start);
  }

  // visitedNode(node) {
  //   for (let i = 0; i < this.stack.length; i++) {
  //     const ss = this.stack[i];
  //     for (let k = 0; k < ss.route.length; k++) {
  //       if (ss.route[k].id === node.id) {
  //         return true;
  //       }
  //     }
  //   }
  //   return false;
  // }

  isStartNode(node) {
    if (this.stack.length > 0) {
      if (this.stack[0].route.length > 0) {
        return this.stack[0].route[0].id === node.id;
      }
    }
    return false;
  }

  visitedPath(start, end) {
    for (let i = 0; i < this.stack.length; i++) {
      const ss = this.stack[i];
      if (ss.lines[start.id] === end.id) {
        return true;
      }
    }
    return false;
  }

  getPath() {
    const path = [];
    this.stack.forEach(s => path.push(...s.route));
    return path;
  }
}

export { _test_main_ };