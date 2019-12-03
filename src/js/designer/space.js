import Tarumae from "../entry";
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import { Vec2 } from "../math/vector";
import Draw2D from "../draw/scene2d";
import { WallNode, WallLine } from "./wall";
import { RoomScanner } from "./scan";
import { _create_test_room_ } from "./test";
import { Area } from "./floor";
import { LayoutGenerator } from "./autolayout";

const _mf = Tarumae.MathFunctions;

let _scene = null;

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
    enableLighting: false,
    renderPixelRatio: window.devicePixelRatio,
  });

  _scene = new Draw2D.Scene2D();
  _scene.renderer = renderer;
  _scene.show();

  window._scene = _scene;
  window._designer = new WallDesigner(_scene);

});

class WallDesigner {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.gridSize = 20;

    this._mode = "move";
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
    this.rooms = [];
    this.areas = [];
    this._hoverArea = null;
    this.roomScanner = new RoomScanner();
    this.expandingWall = null;
    this._activeWall = null;
    this.moveStartOffset = null;
    this.layoutGenerator = new LayoutGenerator(this);
    this.doors = [];
    this.wallAssets = [];
    
    this.ground = new Ground(this);
    this.ground.size = new Tarumae.Size(this.scene.renderer.renderSize);
    this.scene.add(this.ground);

    this.roomHolder = new RoomHolder(this);
    this.scene.add(this.roomHolder);

    this.wallHolder = new WallHolder(this);
    this.scene.add(this.wallHolder);

    this.doorHolder = new Draw2D.Object();
    this.scene.add(this.doorHolder);

    this.scene.on("mousedown", e => this.mousedown(e));
    this.scene.on("mousemove", e => this.mousemove(e));
    this.scene.on("mouseout", e => this.mouseout(e));
    this.scene.on("mouseup", e => this.mouseup(e));
    this.scene.on("drag", e => this.drag(e));
    this.scene.on("enddrag", e => this.enddrag(e));
    this.scene.on("keydown", key => this.keydown(key));
    this.scene.on("draw", g => this.draw(g));

    _create_test_room_(this);
  }

  get status() {
    return this._status;
  }

  set status(v) {
    if (this._status !== v) {
      this._status = v;
      console.debug("change status to: " + v);
    }
  }
  
  get mode() {
    return this._mode;
  }

  set mode(v) {
    if (this._mode !== v) {
      this._mode = v;
    
      if (this._mode !== "draw") {
        this.hover = null;
        this.status = "nothing";
        this.drawingEndPoint = null;
        this.invalidate();
      }
    
      if (this._mode === "draw") {
        this.status = "nothing";
      }

      console.debug("change mode to: " + v);
    }
  }

  get activeWall() {
    return this._activeWall;
  }

  set activeWall(wall) {
    if (this._activeWall !== wall) {
      this._activeWall = wall;
      console.debug("change active wall to: " + wall);
    }
  }
  
  get hoverArea() {
    return this._hoverArea;
  }

  set hoverArea(area) {
    if (this._hoverArea !== area) {
      if (this._hoverArea) this._hoverArea.hover = false;
      this._hoverArea = area;
      if (this._hoverArea) this._hoverArea.hover = true;
      this.invalidate();
    }
  }

  mousedown(e) {
    const p = e.position;

    if (this.mode === "draw") {
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
          if (ret.obj instanceof WallLine) {
            this.activeWall = ret.obj;
          }

          this.selectObject(ret.obj);

          this.mouseStartPoint = new Tarumae.Point(p);
          
          if (ret.obj instanceof WallLine) {
            this.moveStartOffset = Vec2.sub(p, ret.obj.startNode.position);
          } else if (ret.obj instanceof WallNode) {
            this.moveStartOffset = Vec2.sub(p, ret.obj.position);
          }

          if (this.scene.renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Control)) {
            this.status = "expanding";
            this.expandingWall = this.activeWall;
            this.drawingEndPoint = new Vec2(p);
          } else {
            this.status = "moving";
          }
        }
      }
    }
  }

  mousemove(e) {
    const p = e.position;

    // drawing
    if (this.mode === "draw") {
      if (this.status === "startDraw") {
        this.status = "drawing";
      }

      if (this.status === "drawing") {
        const snappedPos = this.positionSnapToGrid(p);
     
        const fromStart = new Tarumae.Point(p.x - this.mouseStartPoint.x,
          p.y - this.mouseStartPoint.y);
        if (this.scene.renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
          if (Math.abs(fromStart.x) > Math.abs(fromStart.y)) {
            snappedPos.y = this.mouseStartPoint.y;
          } else {
            snappedPos.x = this.mouseStartPoint.x;
          }
        }

        this.drawingEndPoint.x = snappedPos.x;
        this.drawingEndPoint.y = snappedPos.y;

        this.invalidate();
      }

      if (this.status === "drawing" || this.status === "nothing") {

        const ret = this.findItemByPosition(this.positionSnapToGrid(p));

        if (this.mode === "draw") {
          this.hover = null;

          if (ret) {
            this.hover = ret;
          }

          // FIXME: improve redraw timing
          this.invalidate();
        }
      }
    }

    // move
    if (this.mode === "move") {
      const ret = this.findItemByPosition(p);

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

    if (this.mode === "move") {
      // update hover area
      this.hoverArea = this.findAreaByPosition(p);
    }
  }

  mouseup(e) {
    const p = e.position;

    if (this.status === "moving") {
      this.status = "move";
    }
  }
  
  mouseout() {
  }

  drag(e) {
    const p = e.position;

    if (this.mode === "move") {
      if (this.status === "moving") {
        const fromStart = new Vec2(p.x - this.mouseStartPoint.x, p.y - this.mouseStartPoint.y);
        const offset = new Vec2(e.movement);

        if (this.scene.renderer.viewer.pressedKeys._t_contains(Tarumae.Viewer.Keys.Shift)) {
          if (Math.abs(fromStart.x) > Math.abs(fromStart.y)) {
            offset.y = 0;
          } else {
            offset.x = 0;
          }
        }

        this.offsetSelectedObjects(offset);
      } else if (this.status === "expanding") {
        this.drawingEndPoint = new Vec2(p);
        this.invalidate();
      }
    }
  }

  enddrag(e) {
    if (this.status === "moving") {
      this.status = "move";

      this.scanRooms();
      this.invalidate();
    } else if (this.status === "expanding") {

      const activeV = this.activeWall._vector;
      const sv = this.drawingEndPoint.sub(this.moveStartOffset);
      const ev = this.drawingEndPoint.add(Vec2.sub(activeV, this.moveStartOffset));

      const newStartNode = new WallNode(sv);
      const newEndNode = new WallNode(ev);
      
      const newLine1 = new WallLine(this.activeWall.startNode, newStartNode);
      const newLine2 = new WallLine(newStartNode, newEndNode);
      const newLine3 = new WallLine(newEndNode, this.activeWall.endNode);

      newLine1.update();
      newLine2.update();
      newLine3.update();

      this.nodes.push(newStartNode, newEndNode);
      this.lines.push(newLine1, newLine2, newLine3);

      this.status = "move";
      this.scanRooms();
      this.invalidate();
    }
  }

  keydown(key) {
    switch (key) {

      case Tarumae.Viewer.Keys.D1:
        this.mode = "draw";
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
      
      case Tarumae.Viewer.Keys.Z:
        window._debug = !window._debug;
        this.invalidate();
        break;
      
      case Tarumae.Viewer.Keys.R:
        this.nodes = [];
        this.lines = [];
        this.areas = [];
        this.rooms = [];
        this.roomHolder.objects = [];
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

    // drawing
    if (this.mode === "draw" && this.status === "drawing") {
      if (this.mouseStartPoint && this.drawingEndPoint) {
        g.drawLine(this.mouseStartPoint, this.drawingEndPoint, 2, "red");

        const v = Vec2.sub(this.drawingEndPoint, this.mouseStartPoint);
        if (v.magnitude > 0) {
          const cp = this.mouseStartPoint.add(v.mul(0.5));
          let angle = v.angle;
          if (angle > 90 && angle < 270) angle += 180;
          const lenValue = Number(parseFloat(Math.round(v.magnitude * 100) / 10000).toFixed(2));
        
          g.pushRotation(angle, cp.x, cp.y);
          g.drawText(lenValue + " m", new Vec2(0, -2), "black", "center", "0.7em Arial");
          g.popTransform();
        }
      }
    }

    // drawing & hover
    if (this.mode === "draw") {
      if (this.status === "drawing" || this.status === "nothing") {
        if (this.hover) {
          if (this.hover.position) {
            g.drawPoint(this.hover.position, 15, "transparent", "red");
          }
        }
      }
    }

    if (this.mode === "move" && this.status === "expanding") {
      const activeV = this.activeWall._vector;
      const sv = this.drawingEndPoint.sub(this.moveStartOffset);
      const ev = this.drawingEndPoint.add(Vec2.sub(activeV, this.moveStartOffset));
        
      g.drawLine(this.activeWall.startNode.position, sv, 2, "red");
      g.drawLine(this.activeWall.endNode.position, ev, 2, "red");
      g.drawLine(sv, ev, 2, "red");
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
    wallLine.update();
    this.lines.push(wallLine);

    this.scene.requireUpdateFrame();

    this.scanRooms();

    return wallLine;
  }

  splitLine(line, position) {
    const newNode = new WallNode(position);
    const newLine = new WallLine(newNode, line.endNode);
    
    // modify existing line
    line.endNode.lines._t_remove(line);
    line.endNode = newNode;
    newNode.lines.push(line);

    line.update();
    newLine.update();

    this.nodes.push(newNode);
    this.lines.push(newLine);

    return newNode;
  }

  scanRooms() {
    this.areas = this.roomScanner.scanAreas(this.nodes, this.lines);

    this.roomHolder.objects._t_clear();
    this.rooms = [];

    for (const area of this.areas) {
      this.layoutGenerator.autoLayout(area);
    }

    // const exwalls = this.roomScanner.findExpandableWalls(this.areas);
    // console.log(exwalls);
    this.expandableWalls = [];
  }

  // FIXME: rename method
  findItemByPosition(p) {
    const ret = this.findWallNodeByPosition(p);
    if (ret) return ret;
    
    return this.findWallLineByPosition(p);
  }

  findWallNodeByPosition(p) {
    for (const node of this.nodes) {
      const ret = node.hitTestByPosition(p);
      if (ret) return ret;
    }
  }

  findWallLineByPosition(p) {
    for (const line of this.lines) {
      const ret = line.hitTestByPosition(p);
      if (ret) return ret;
    }
  }

  findAreaByPosition(p) {
    for (const area of this.areas) {
      if (area.polygon.containsPoint(p)) {
        return area;
      }
    }
    return null;
  }

  selectObject(obj, append) {
    if (!append) {
      this.deselectAllObjects();
    }
    if (obj) {
      obj.selected = true;
      this.selectedObjects._t_pushIfNotExist(obj);
    }
    this.invalidate();
  }

  deselectAllObjects() {
    this.selectedObjects.forEach(obj => obj.selected = false);
    this.selectedObjects._t_clear();
    this.invalidate();
  }

  moveToSelectedObjects(p) {
    for (const obj of this.selectedObjects) {
      this.moveToObject(obj, p);
    }
  }

  moveToObject(obj, p) {
    obj.moveTo(p);
    this.invalidate();
  }

  offsetSelectedObjects(offset) {
    for (const obj of this.selectedObjects) {
      this.offsetObject(obj, offset);
    }
  }

  offsetObject(obj, offset) {
    obj.offset(offset);
    this.invalidate();
  }

  findArea(nodeList) {
    for (const area of this.areas) {
      if (Area.isSameArea(area.nodes, nodeList)) {
        return area;
      }
    }
  }
}

class Ground extends Draw2D.Object {
  constructor(designer) {
    super();

    this.designer = designer;
  }

  draw(g) { 
    const width = this.size.width;
    const height = this.size.height;
    const gridSize = this.designer.gridSize;

    for (let y = 0; y < height; y += gridSize) {
      if ((y % 50) === 0) {
        g.drawLine([0, y], [width, y], 2, "#ddd");
      } else {
        g.drawLine([0, y], [width, y], 1, "#eee");
      }
    }

    for (let x = 0; x < width; x += gridSize) {
      if ((x % 50) == 0) {
        g.drawLine([x, 0], [x, height], 2, "#ddd");
      } else {
        g.drawLine([x, 0], [x, height], 1, "#eee");
      }
    }
  }
}

class RoomHolder extends Draw2D.Object {
  constructor(designer) { 
    super();

    this.designer = designer;
  }
}

class WallHolder extends Draw2D.Object {
  constructor(designer) {
    super();
    this.designer = designer;
  }

  draw(g) {
    // nodes, lines and areas
    this.designer.areas.forEach(area => area.draw(g));
    this.designer.lines.forEach(line => line.draw(g));
    this.designer.nodes.forEach(node => node.draw(g));
  }
}

export {  };