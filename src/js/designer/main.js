import Tarumae from "../entry"
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import Drawing2d from "../draw/scene2d";
import { Vec2 } from "../math/vector";

const TarumaeDesigner = {
};

const _mf = Tarumae.MathFunctions;

TarumaeDesigner.SelectableGrid = class extends Tarumae.SceneObject {
  constructor() {
    super();

    this.groundMesh = new Tarumae.DynamicMesh();
    this.groundMesh.composeMode = Tarumae.Mesh.ComposeModes.TriangleStrip;

    const gridCount = 10;
    const stride = 0.1;
    const start = -0.5;

    this.groundMesh.vertices = new Array(gridCount * 3 * 2);

    // for (let y = 0; y < gridCount; y++) {
      for (let x = 0; x < gridCount; x++) {
        this.groundMesh.vertices._t_set(x * 2,
          start + stride * x, 0, start + stride * x - stride);
        this.groundMesh.vertices._t_set(x * 2 + 1,
          start + stride * x, 0, start + stride * x - stride);
      }
    // }

    this.addMesh(this.groundMesh);
  }
};

Tarumae.Designer = class {

  constructor(renderer) {
    this.renderer = renderer;
    this.scene = this.renderer.createScene();

    const scene = this.scene;

    this.ground = new TarumaeDesigner.SelectableGrid();
    scene.add(this.ground);
  }
  
  show() {
    this.scene.show();
  }
};

const AutoFloor = {
};

AutoFloor.LayoutDesigner = class {

  constructor(renderer) {
    this.renderer = renderer;
    this.ctx = this.renderer.drawingContext2D;
    // this.scene = this.renderer.createScene();
    const scene = new Drawing2d.Scene2D();
    scene.renderer = renderer;
    this.scene = scene;
    renderer.scene = scene;

    // FIXME: remove global variable
    window._designer = this;

    this.data = {
      walls: [
        [0, 0], [400, 0], [400, 320], [160, 320], [160, 160], [0, 160],
      ],
      doors: [
        { loc: [0, 45], size: 30, wallIndex: 5, dirs: [0, 0] },
      ],
      windows: [
        { loc: [200, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
        { loc: [240, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
        { loc: [280, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
        { loc: [320, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
        { loc: [360, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
      ],
      pillars: [
        [[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]],
      ],
      objects: [],
    };
    
    // this.data = {
    //   walls: [
    //     [0, 0], [200, 0], [200, 300], [0, 300]
    //   ],
    //   doors: [
    //     { loc: [0, 40], size: 40, wallIndex: 3, dirs: [0, 0], type: "one_slide" },
    //   ],
    //   // windows: [
    //   //   { loc: [200, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
    //   //   { loc: [240, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
    //   //   { loc: [280, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
    //   //   { loc: [320, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
    //   //   { loc: [360, 320], size: 40, wallIndex: 2, dirs: [0, 0] },
    //   // ],
    //   // pillars: [
    //   //   [[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]],
    //   // ],
    //   objects: [
    //     { loc: [] }
    //   ],
    // };

    this.viewport = {
      origin: new Vec2(200, 200),
      scale: 2,
    };
    // this.viewport = {
    //   origin: new Vec2(0, 0),
    //   scale: 1,
    // };

    this.obj_test();

    // this.createLayout(this.data);
    // this.autoLayout();

    // this.generateInterior();

  }

  show() {
    this.scene.show();
  }

  obj_test() {
    const chair1 = new Chair(15, 15);
    // chair1.scale.set(3, 3);
    chair1.origin.set(200, 200);
    chair1.update();

    this.scene.add(chair1);
  }

  createLayout() {
    const data = this.data;
    const polygon = data.walls;

    const floorSize = Tarumae.BBox2D.fromPolygon(polygon).size;
    this.gridSize = 20;
    this.cellCountX = floorSize.width / this.gridSize;
    this.cellCountY = floorSize.height / this.gridSize;

    const layout = new Drawing2d.Object();
    layout.origin.set(this.viewport.origin);
    layout.scale.set(this.viewport.scale, this.viewport.scale);
    this.scene.add(layout);

    const room = new Room(polygon);
    room.ondraw = g => this.drawGrid(g);
    layout.add(room);
    this.room = room;

    for (let i = 0, j = 1; i < polygon.length; i++, j++) {
      if (j >= polygon.length) j = 0;

      const x1 = polygon[i][0], y1 = polygon[i][1], x2 = polygon[j][0], y2 = polygon[j][1];
      const wall = new Wall(x1, y1, x2, y2);
      room.walls.push(wall);
      room.add(wall);
    }

    if (data.doors) {
      for (const d of data.doors) {
        const wall = room.walls[d.wallIndex];
        const door = new Door(wall, d.loc, d.size, d.dirs, d.type);
        wall.add(door);
        wall.doors.push(door);
      }
    }
    
    if (data.windows) {
      for (const w of data.windows) {
        const wall = room.walls[w.wallIndex];
        const window = new Window(wall, w.loc, w.size, w.dirs);
        wall.add(window);
        wall.windows.push(window);
      }
    }
  }

  autoLayout() {
    this.generateCells();
    this.generateInteriorOffice();
  }

  generateCells() {
    this.grid = [];

    const gridSize = this.gridSize;
    const wallPolygon = this.data.walls;

    const maxDists = {
      wall: 0,
      door: 0,
      window: 0,
    };

    let cellIndex = -1;

    this.cells = [];
    
    for (let y = 0, yi = 0; yi < this.cellCountY; y += gridSize, yi++) {
      this.cells.push([]);

      for (let x = 0, xi = 0; xi < this.cellCountX; x += gridSize, xi++) {
        cellIndex++;

        const rect = new Tarumae.Rect(x, y, gridSize, gridSize);

        const c = {
          index: cellIndex, xi, yi,
          rect,
          dists: {
            wall: 0,
            door: 0,
            window: 0,
          },
        };

        if (_mf.polygonContainsPoint(wallPolygon, rect.origin)) {
          
          const wallDist = _mf.distancePointToPolygon(rect.origin, wallPolygon);
          c.dists.wall = wallDist;
          if (wallDist > maxDists.wall) maxDists.wall = wallDist;
        
          // door
          let minDoorDist = Infinity;
          for (const wall of this.room.walls) {
            for (const d of wall.doors) {
              const doorDist = _mf.distancePointToLineSegment2D(rect.origin, d.line);
              if (minDoorDist > doorDist) minDoorDist = doorDist;
            }
          }

          if (minDoorDist < Infinity) {
            c.dists.door = minDoorDist;
            if (maxDists.door < minDoorDist) maxDists.door = minDoorDist;
          }

          // window
          let minWindowDist = Infinity;
          for (const wall of this.room.walls) {
            for (const w of wall.windows) {
              const windowDist = _mf.distancePointToLineSegment2D(rect.origin, w.line);
              if (minWindowDist > windowDist) minWindowDist = windowDist;
            }
          }

          if (minWindowDist < Infinity) {
            c.dists.window = minWindowDist;
            if (maxDists.window < minWindowDist) maxDists.window = minWindowDist;
          }

        } else {
          c.invalid = true;
        }

        this.grid.push(c);
        this.cells[yi].push(c);
      }
    }

    for (const c of this.grid) {
      c.dists.wallp = c.dists.wall / maxDists.wall;
      c.dists.doorp = c.dists.door / maxDists.door;
      c.dists.windowp = c.dists.window / maxDists.window;
    }

    // setTimeout(_ => {
    //   for (const c of this.grid) {
    //     c.dists.wallp = c.dists.wall / maxDists.wall;
    //     // c.dists.doorp = c.dists.door / maxDists.door;
    //     // c.dists.windowp = c.dists.window / maxDists.window;
    //     c.dists.doorp = 1;
    //     c.dists.windowp = 1;
    //   }
    //   this.scene.requireUpdateFrame();
    // }, 5000);

    // setTimeout(_ => {
    //   for (const c of this.grid) {
    //     // c.dists.wallp = c.dists.wall / maxDists.wall;
    //     c.dists.doorp = c.dists.door / maxDists.door;
    //     // c.dists.windowp = c.dists.window / maxDists.window;
    //   }
    //   this.scene.requireUpdateFrame();
    // }, 10000);

    // setTimeout(_ => {
    //   for (const c of this.grid) {
    //     // c.dists.wallp = c.dists.wall / maxDists.wall;
    //     // c.dists.doorp = c.dists.door / maxDists.door;
    //     c.dists.windowp = c.dists.window / maxDists.window;
    //   }
    //   this.scene.requireUpdateFrame();
    // }, 15000);

  }

  generateInterior() {

    this.addDiningSet({ x: 157, y: 100 });

  }

  addDiningSet(diningset) {
    
    const chair1 = new AssetObject("chair", 25, 25);
    chair1.origin.set(diningset.x - 20, diningset.y - 20);
    this.putInterior(chair1);

    const chair2 = new AssetObject("chair", 25, 25);
    chair2.origin.set(diningset.x + 20, diningset.y - 20);
    this.putInterior(chair2);

    const chair3 = new AssetObject("chair", 25, 25);
    chair3.origin.set(diningset.x - 20, diningset.y + 20);
    chair3.angle = 180;
    this.putInterior(chair3);

    const chair4 = new AssetObject("chair", 25, 25);
    chair4.origin.set(diningset.x + 20, diningset.y + 20);
    chair4.angle = 180;
    this.putInterior(chair4);

    const sofa = new AssetObject("sofa", 80, 35);
    sofa.origin.set(diningset.x, diningset.y);
    this.putInterior(sofa);
  }

  generateInteriorOffice() {
    const removes = [];
    for (let i = 0; i < this.room.objects.length; i++) {
      if (this.room.objects[i] instanceof InteriorObject) {
        removes.push(this.room.objects[i]);
      }
    }
    for (let i = 0; i < removes.length; i++) {
      this.room.remove(removes[i]);
    }

    const gridSize = this.gridSize;
    const horsets = 3, versets = 1, ftf = 1;
    const protoSize = new TableChairSet(horsets, versets, ftf).bbox.size;
    const cw = Math.ceil(protoSize.width / this.gridSize);
    const ch = Math.ceil(protoSize.height / this.gridSize);

    for (let i = 0; i < 5; i++) {
      const list = this.findAvailableSpace(cw, ch);

      if (list.length > 0) {
        list.sort((a, b) => b.scores.work - a.scores.work);

        const pos = list[0];

        const ts = new TableChairSet(horsets, versets, ftf);

        ts.origin.set(pos.xi * gridSize + cw * gridSize * 0.5,
          pos.yi * gridSize + ch * gridSize * 0.5);
        this.putInterior(ts);
      }
    }
  }

  generateWorkspace() {
  }

  findAvailableSpace(cw, ch) {
    const poslist = [];

    const needrun = cw * ch;

    for (let yi = 0; yi <= this.cellCountY - ch; yi++) {
      for (let xi = 0; xi <= this.cellCountX - cw; xi++) {
    
        let ctaken = false;
        let workscore = 0;
        let runs = 0;

        for (let i = 0; i < ch; i++) {
          if (ctaken) {
            break;
          }

          for (let k = 0; k < cw; k++) {
            const c = this.cells[yi + i][xi + k];
            if (c.invalid) continue;

            if (c.taken) {
              ctaken = true;
              break;
            }

            workscore += c.dists.doorp * c.dists.doorp + (1 - c.dists.windowp) ;
            
            runs++;
          }
        }

        if (!ctaken && runs >= needrun) {
          const c = this.cells[yi][xi];
          if (c.taken) {
            debugger;
          }

          poslist.push({
            xi, yi,
            cell: c,
            scores: {
              work: workscore,
            }
          });
        }
      }
    }

    return poslist;
  }

  putInterior(obj) {
    obj.update();

    const objrect = obj.bbox.rect;

    for (const c of this.grid) {
      if (_mf.rectIntersectsRect(c.rect, objrect)) {
        c.taken = true;
      }
    }

    this.scene.requireUpdateFrame();
    this.room.add(obj);
  }

  drawGrid(g) {
    if (!this.grid) return;

    for (const c of this.grid) {
      if (c.invalid) {
        g.drawRect(c.rect, 1, "white", "#f0f0f0");
        continue;
      }
        
      let color = 'silver';

      // if (c.wallAdjacent || c.left || c.right || c.top || c.bottom) {
      //   color = '#c0ffc0';
      // }
      
      // if (c.way) color = '#ffffc0';
      // if (c.door) color = '#ffffc0';
      const level = 100;

      const p1 = c.dists.wallp * 255;
      const p2 = isNaN(c.dists.doorp) ? 0 : (c.dists.doorp * 255);
      const p3 = isNaN(c.dists.windowp) ? 0 : (c.dists.windowp * 255);
      p1 = level + p1 / 255 * (255 - level);
      p2 = level + p2 / 255 * (255 - level);
      p3 = level + p3 / 255 * (255 - level);
      color = `rgb(${p1}, ${p2}, ${p3})`;

      const o = c.rect.origin;
      
      g.drawRect(c.rect, 1, "white", color);
      g.drawText(o, c.index, c.taken ? "red" : "silver", "center", "5px Arial");
    }
  }
};

window.addEventListener("load", function() {

	const renderer = new Tarumae.Renderer({
    enableLighting: false,
    renderPixelRatio: window.devicePixelRatio,
  });

  // const designer = new Tarumae.Designer(renderer);
  // designer.show();

  const designer = new AutoFloor.LayoutDesigner(renderer);
  designer.show();

  // __test__(renderer);
});

class Room extends Drawing2d.Object {
  constructor(polygon) {
    super();

    this.walls = [];
    this.polygon = polygon;
    this.outsideWallWidth = 6;

  }

  draw(g) {
    super.draw(g);
    g.drawLines(this.polygon, this.outsideWallWidth, "gray", true);
  }
}

class Wall extends Drawing2d.Object {
  constructor(x1, y1, x2, y2) {
    super();
  
    this.line = new Tarumae.LineSegment2D(x1, y1, x2, y2);
    this.lineAngle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    this.width = 6;
    this.polygon = [];
    this.doors = [];
    this.windows = [];
  }

  update() {
    this.polygon = [];
  }

  draw(g) {
    // g.drawLine(this.line.start, this.line.end, this.width);
  }
}

class LayoutObject extends Drawing2d.Object {
  constructor(size) {
    super();

    this.size = size;

    this.style.strokeColor = "gray";
  }

  drawDimension(g, x, y) {
    const w = this.size.width, h = this.size.height;
    g.drawText({ x, y }, `${w * 20} mm x ${h * 20} mm`, "black", "center", "0.3em Arial");
  }

  pointToObject(p) {
    p = new Vec2((p.x - 200) * 0.5, (p.y - 200) * 0.5);
    return super.pointToObject(p);
  }

  mouseenter(e) {
    this.style.strokeWidth = 4;
    this.style.strokeColor = "orangered";
    e.requireUpdateFrame();
  }

  mouseout(e) {
    this.style.strokeWidth = 3;
    this.style.strokeColor = "gray";
    e.requireUpdateFrame();
  }

  drag(e) {
    const p = e.movement;

    let x = p.x;
    let y = p.y;

    function snapToGrid(x) {
      const xb = x;
      const snapSize = 10;
      const m = (x % 10), hm = snapSize * 0.5;
      if (m < hm) x -= m;
      // if (m < hm) x -= m;
      console.log(xb, " -> ", x);
      return x;
    }

    this.origin.x = this.origin.x + x;
    this.origin.y = this.origin.y + y;

    this.update();
    e.requireUpdateFrame();
  }
}

class WallChildObject extends LayoutObject {
  constructor(wall, loc, size) {
    super(new Tarumae.Size(size, wall.width));

    this.line = new Tarumae.LineSegment2D();

    this.wall = wall;
    this.angle = this.wall.lineAngle;

    this.location = new Vec2(loc[0], loc[1]);
  }

  set location(p) {
    this.loc = p;
    this.origin.set(p);

    this.update();
  }

  updateBoundingBox() {
    if (this.wall) {
      const m = Tarumae.Matrix3.makeRotation(this.angle, this.origin.x, this.origin.y);
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
    const p = this.pointToObject(e.position);

    const ret = Tarumae.MathFunctions.pointToNearestPolygon(p, window._designer.room.polygon);
    
    if (ret.dist < 50) {
      const wall = window._designer.room.walls[ret.lineIndex];
      this.wall = wall;
      this.angle = wall.lineAngle;
      this.location = ret.ip;
    }

    e.requireUpdateFrame();
  }

  enddrag(e) {
    window._designer.autoLayout();
    e.requireUpdateFrame();
  }
}

class Door extends WallChildObject {
  constructor(wall, loc, size, dirs, type) {
    super(wall, loc, size);
    this.dirs = dirs;
    this.type = type || "one_side";
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
          g.drawRect(new Tarumae.Rect(-hw, -hh, w, h));
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
}

class WallOpen extends WallChildObject {
  constructor(wall, loc, size, dirs) {
    super(wall, loc, size);
    this.dirs = dirs;
  }

  draw(g) {
    if (this.wall) {
      const w = this.size.width, hw = w * 0.5, h = this.wall.width, hh = h * 0.5;
      g.drawRect(new Tarumae.Rect(-hw, -hh, w, h));
    }

    super.draw(g);
  }
}

class Window extends WallChildObject {
  constructor(wall, loc, size, dirs) {
    super(wall, loc, size);
    this.dirs = dirs;
  }

  // render(g) {
  //   super.render(g);
  //   g.drawLine(this.line.start, this.line.end, 4, "blue");
  // }

  draw(g) {
    if (this.wall) {
      const w = this.size.width, hw = w * 0.5;
      const h = this.wall.width, hh = h * 0.5;

      g.drawRect(new Tarumae.Rect(-hw, -hh, w, h));
      g.drawRect(new Tarumae.Rect(-hw, -4, w, 2));
    }

    super.draw(g);
  }
}

class InteriorObject extends LayoutObject {
  constructor(width, height) {
    super(new Tarumae.Size(width, height));
    
    this.style.strokeWidth = 3;

    this.update();
  }

  render(g) {
    super.render(g);
    g.drawRect(this.bbox.rect, 1, "blue", "transparent");
  }
}

class Chair extends InteriorObject {
  constructor() {
    super(45, 45);
  }

  draw(g) {
    const w = this.size.width, hh = this.size.height / 2;
    const x = -hh, y = -hh;

    g.drawRoundRect({ x: x + 2, y, width: w - 4, height: w }, w * 0.5);
    g.drawRoundRect({ x: x + 2, y: y - 2, width: w - 4, height: 8 }, w * 0.3);

    g.drawRoundRect({ x: x - 3, y: y + hh - 9, width: 8, height: 22 }, w * 0.2);
    g.drawRoundRect({ x: x + w - 5, y: y + hh - 9, width: 8, height: 22 }, w * 0.2);
  }
}

class Table extends InteriorObject {
  constructor(width, height) {
    super(width || 40, height || 15);
  }

  draw(g) {
    const w = this.size.width, h = this.size.height,
      hw = w / 2, hh = h / 2,
      x = -hw, y = -hh;

    g.drawRect({ x, y, width: w, height: h });
  }
}

class TableChairSet extends InteriorObject {
  constructor(horsets, versets, ftf) {
    super();

    horsets = horsets || 1;
    versets = versets || 1;

    const width = 37, hw = width * 0.5;
    const totalWidth = width * horsets, htw = totalWidth * 0.5;

    for (let y = 0; y < versets; y++) {
      for (let x = 0; x < horsets; x++) {

        const ox = x * width + hw - htw;

        if (ftf) {
          const chair1 = new Chair(15, 15);
          const table1 = new Table(width, 15);
          const chair2 = new Chair(15, 15);
          const table2 = new Table(width, 15);
          chair1.origin.set(ox, -15);
          table1.origin.set(ox, -5);
          table2.origin.set(ox, 10);
          chair2.origin.set(ox, 20);
          this.add(chair1, chair2, table1, table2);
        } else {
          const chair = new Chair(15, 15);
          const table = new Table(width, 15);
          chair.origin.set(ox, 0);
          table.origin.set(ox, 10);
          this.add(chair, table);
        }
      }
    }

    this.angle = 0;
    this.update();
  }

  update() {
    this.updateChildren();
    super.update();
  }

  updateChildren() {
    for (const o of this.objects) {
      o.update();
    }
  }

  updateBoundingBox() {
    if (this.objects.length > 0) {
      this.bbox.set(this.objects[0].bbox);

      for (let i = 1; i < this.objects.length; i++) {
        this.bbox.expendToBBox(this.objects[i].bbox);
      }

      this.size = this.bbox.size;
    }

    super.updateBoundingBox();
  }

  render(g) {
    super.render(g);
    // g.drawRect(this.bbox.rect, 2, "red", "white");
  }
}

class AssetObject extends InteriorObject {
  constructor(objType, width, height) {
    super(width, height);

    const assetMaster = {
      "sofa": {
        draw: (g, w, h, hw, hh) => {
          g.drawRoundRect(new Tarumae.Rect(-hw, -hh, w, h), 5);
          super.drawDimension(g, 0, 0);
        }
      }, 
      "chair": {
        draw: (g, w, h, hw, hh) => {
          const x = -hw, y = -hh;
          g.drawRoundRect({ x: -hw, y: -hh, width: w, height: w }, w * 0.7);
          g.drawRoundRect({ x: -hw, y: -hh - 2, width: w, height: h * 0.17 }, w * 0.2);
    
          // g.drawRoundRect({ x: x - 2, y: y + hh - 4, width: 3, height: 8 }, w * 0.2);
          // g.drawRoundRect({ x: x + w - 1, y: y + hh - 4, width: 3, height: 8 }, w * 0.2);

          super.drawDimension(g, 0, - hh - 5);
        }
      },
      "dining_set": {
        
      },
      "sofa_1p": {
        draw: (g, w, h, hw, hh) => {
          const x = -hw, y = -hh;
          g.drawRoundRect({ x: -hw, y: -hh, width: w, height: w }, w * 0.7);
          g.drawRoundRect({ x: -hw, y: -hh - 2, width: w, height: h * 0.17 }, w * 0.2);
    
          // g.drawRoundRect({ x: x - 2, y: y + hh - 4, width: 3, height: 8 }, w * 0.2);
          // g.drawRoundRect({ x: x + w - 1, y: y + hh - 4, width: 3, height: 8 }, w * 0.2);

          super.drawDimension(g, 0, - hh - 5);
        }
      },
      "locker": {
        draw: (g, w, h, hw, hh) => {
          const x = -hw, y = -hh;
          g.drawRect({ x: -hw, y: -hh, width: w, height: w });
        }
      },
    }

    this.objProto = assetMaster[objType];

    this.ondraw = g => {
      const w = this.size.width, hw = w * 0.5, h = this.size.height, hh = h * 0.5;
      this.objProto.draw(g, w, h, hw, hh); 
    }
  }
}

function __test__(renderer) {
  const scene = new Drawing2d.Scene2D();
  scene.renderer = renderer;
  renderer.scene = scene;

  const wall1 = new WallLine(100, 100, 400, 200);
  scene.add(wall1);

  scene.show();
}
