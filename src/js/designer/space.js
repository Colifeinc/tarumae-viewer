import Tarumae from "../entry";
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import { Vec2 } from "../math/vector";
import Drawing2D from "../draw/scene2d";
import { WallNode, WallLine, Area } from "./wall";
import { RoomScanner } from "./scan";

const _mf = Tarumae.MathFunctions;

let _scene = null;

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
    enableLighting: false,
    renderPixelRatio: window.devicePixelRatio,
  });

  _scene = new Drawing2D.Scene2D();
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

    this._mode = "draw";
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
    this.roomScanner = new RoomScanner();

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
    
    if (this._mode !== "draw") {
      this.hover = null;
      this.status = "nothing";
      this.drawingEndPoint = null;
      this.invalidate();
    }
    
    if (this._mode === "draw") {
      this.status = "nothing";
    }

    console.log("change mode to: " + v);
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
          this.selectObject(ret.obj);

          this.mouseStartPoint = new Tarumae.Point(p);
          this.status = "moving";
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
        this.hover = null;

        const ret = this.findItemByPosition(this.positionSnapToGrid(p));

        if (this.mode === "draw") {
          if (ret) {
            this.hover = ret;
          }
        }

        this.invalidate();
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

    // update hover area
    this.hoverArea = null;

    if (this.status !== "drawing") {
      this.hoverArea = this.findAreaByPosition(p);
    }
  }

  mouseup(e) {
    const p = e.position;
    console.log('mouse up');
    if (this.status === "moving") {
      this.status = "move";
    }
  }
  
  mouseout() {
  }

  drag(e) {
    const p = e.position;

    if (this.status === "moving") {
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
    if (this.status === "moving") {
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
      g.drawPolygon(area.polygon.points, 0, "transparent", this.hoverArea===area?'#ddddee': '#ffffee');
      g.drawText(Math.round(area.areaValue / 10000) + " m²", area.centerPoint, "#000000", "center", "14px Arial");
    });

    // walls
    this.lines.forEach(l => l.draw(g));
    this.nodes.forEach(n => n.draw(g));

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

    line.update();
    newLine.update();

    this.nodes.push(newNode);
    this.lines.push(newLine);

    return newNode;
  }

  updateWallOutline() {

  }

  scanRooms() {
    this.areas = this.roomScanner.scanAreas(this.nodes, this.lines);
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
    for (let i = 0; i < this.areas.length; i++) {
      const area = this.areas[i];
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


export {  };