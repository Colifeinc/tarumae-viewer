import Tarumae from "../entry"
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import Drawing2d from "../draw/scene2d";
import { Vec2 } from "../math/vector";
import { TimerObservable } from "rxjs/observable/TimerObservable";

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

    this.viewport = {
      origin: new Vec2(200, 200),
      scale: 2,
    };
    // this.viewport = {
    //   origin: new Vec2(0, 0),
    //   scale: 1,
    // };

    this.createLayout(this.data);

    // setTimeout(_ => {
    //   const gridSize = 40;

    //   let cellIndex = 0;
    //   for (let y = 0, yi = 0; y < 300; y += gridSize, yi++) {
    //     for (let x = 0, xi = 0; x < 400; x += gridSize, xi++) {
    //       if (y > 140 && x < 150) continue;
    //       const c = { index: cellIndex, rect: new Tarumae.Rect(x, y, gridSize, gridSize) };
    //       if (xi === 0) c.left = "wall";
    //       if (xi === 9) c.right = "wall";
    //       if (yi === 0) c.top = "wall";
    //       if (yi === 7) c.bottom = "wall";
    //       if (yi == 3 && xi < 4) c.bottom = "wall";
    //       if (yi > 3 && xi === 4) c.left = "wall";
    //       if (cellIndex == 10) c.entry = true;
    //       if (yi == 1 && xi < 9) c.way = true;
    //       if ((xi == 8 || xi == 5) && yi > 1 && yi < 7) c.way = true;
    //       if (yi == 6 && xi > 5 && xi < 8) c.way = true;

    //       this.grid.push(c);
    //       cellIndex++;
    //     }
    //   }

    //   this.scene.requireUpdateFrame();
    // }, 2000);

    // setTimeout(_ => {
    //   this.data.objects = [
    //     // { type: "chair", loc: [100, 100] },
    //     // { type: "table", loc: [100, 118], size: [40, 20] },
        
    //     // { type: "table set", loc: [160, 280], size: [40, 40], angle: 0 },
    //     { type: "table set", loc: [200, 280], size: [40, 40], angle: 0 },
    //     { type: "table set", loc: [240, 280], size: [40, 40], angle: 0 },
    //     { type: "table set", loc: [280, 280], size: [40, 40], angle: 0 },
    //     { type: "table set", loc: [320, 280], size: [40, 40], angle: 0 },
    //     // { type: "table set", loc: [360, 280], size: [40, 40], angle: 0 },

    //     { type: "table set", loc: [40, 0], size: [40, 40], angle: 180 },
    //     { type: "table set", loc: [80, 0], size: [40, 40], angle: 180 },
    //     { type: "table set", loc: [120, 0], size: [40, 40], angle: 180 },
    //     { type: "table set", loc: [160, 0], size: [40, 40], angle: 180 },
    //     { type: "table set", loc: [200, 0], size: [40, 40], angle: 180 },
    //     { type: "table set", loc: [240, 0], size: [40, 40], angle: 180 },
    //     { type: "table set", loc: [280, 0], size: [40, 40], angle: 180 },
    //     { type: "table set", loc: [320, 0], size: [40, 40], angle: 180 },

    //     { type: "table set", loc: [360, 40], size: [40, 40], angle: 270 },
    //     { type: "table set", loc: [360, 80], size: [40, 40], angle: 270 },
    //     { type: "table set", loc: [360, 120], size: [40, 40], angle: 270 },
    //     { type: "table set", loc: [360, 160], size: [40, 40], angle: 270 },
    //     { type: "table set", loc: [360, 200], size: [40, 40], angle: 270 },
    //     { type: "table set", loc: [360, 240], size: [40, 40], angle: 270 },

    //     { type: "table set", loc: [40, 120], size: [40, 40], angle: 0 },
    //     { type: "table set", loc: [80, 120], size: [40, 40], angle: 0 },
    //     { type: "table set", loc: [120, 120], size: [40, 40], angle: 0 },

    //     { type: "table set", loc: [160, 160], size: [40, 40], angle: 90 },
    //     { type: "table set", loc: [160, 200], size: [40, 40], angle: 90 },
    //     { type: "table set", loc: [160, 240], size: [40, 40], angle: 90 },
    //   ];

    //   this.scene.requireUpdateFrame();
    // }, 4000);

    this.autoLayout();
  }

  show() {
    this.scene.show();
  }

  createLayout() {
    const data = this.data;
    const polygon = data.walls;

    const floorSize = Tarumae.BBox2D.fromPolygon(polygon).size;
    this.gridSize = 20;
    this.cellCountX = floorSize.width / this.gridSize;
    this.cellCountY = floorSize.height / this.gridSize;
    console.log(this.cellCountX, this.cellCountY);

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

    for (const d of data.doors) {
      const wall = room.walls[d.wallIndex];
      const door = new Door(wall, d.loc, d.size, d.dirs);
      wall.add(door);
      wall.doors.push(door);
    }
    
    for (const w of data.windows) {
      const wall = room.walls[w.wallIndex];
      const window = new Window(wall, w.loc, w.size, w.dirs);
      wall.add(window);
      wall.windows.push(window);
    }
  }

  autoLayout() {
    this.generateCells();
    this.generateInterior();
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

          c.dists.door = minDoorDist;
          if (maxDists.door < minDoorDist) maxDists.door = minDoorDist;

          // window
          let minWindowDist = Infinity;
          for (const wall of this.room.walls) {
            for (const w of wall.windows) {
              const windowDist = _mf.distancePointToLineSegment2D(rect.origin, w.line);
              if (minWindowDist > windowDist) minWindowDist = windowDist;
            }
          }

          c.dists.window = minWindowDist;
          if (maxDists.window < minWindowDist) maxDists.window = minWindowDist;

        } else {
          c.invalid = true;
        }

        // this.markupCellBorder(c);

        // if (xi === 0) c.left = "wall";
        // if (xi === 9) c.right = "wall";
        // if (yi === 0) c.top = "wall";
        // if (yi === 7) c.bottom = "wall";
        // if (yi == 3 && xi < 4) c.bottom = "wall";
        // if (yi > 3 && xi === 4) c.left = "wall";
        // if (cellIndex == 10) c.entry = true;
        // if (yi == 1 && xi < 9) c.way = true;
        // if ((xi == 8 || xi == 5) && yi > 1 && yi < 7) c.way = true;
        // if (yi == 6 && xi > 5 && xi < 8) c.way = true;

        this.grid.push(c);
        this.cells[yi].push(c);
      }
      console.log(yi);
    }

    for (const c of this.grid) {

      c.dists.wallp = c.dists.wall / maxDists.wall;

      if (c.dist < gridSize) {
        c.interior = true;
      }

      c.dists.doorp = c.dists.door / maxDists.door;
      c.dists.windowp = c.dists.window / maxDists.window;
    }
  }

  generateInterior() {
    const removes = [];
    for (let i = 0; i < this.room.objects.length; i++) {
      if (this.room.objects[i] instanceof InteriorObject) {
        removes.push(this.room.objects[i]);
      }
    }
    for (let i = 0; i < removes.length; i++) {
      this.room.remove(removes[i]);
    }

    const width = 40, height = 40;

    for (let i = 0; i < 20; i++) {
      const list = this.findAvailableSpace(width, height);

      if (list.length > 0) {
        list.sort((a, b) => b.scores.work - a.scores.work);

        const pos = list[0];
        console.log(pos);

        const ts1 = new TableChairSet(1, 1, true);
        ts1.origin.set(pos.xi * this.gridSize, pos.yi * this.gridSize);
        this.putInterior(ts1);
      }
    }
  }

  findAvailableSpace(width, height) {
    const poslist = [];

    const rect = new Tarumae.Rect(0, 0, width, height);

    const cw = Math.ceil(rect.width / this.gridSize);
    const ch = Math.ceil(rect.height / this.gridSize);
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

            workscore += c.dists.doorp * c.dists.doorp
              + (1 - c.dists.windowp) ;
            
            runs++;
          }
        }

        if (!ctaken && runs >= needrun) {
          poslist.push({
            xi: xi + cw * 0.5,
            yi: yi + ch * 0.5,
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
        console.log("taken " + c.xi + ", " + c.yi);
      }
    }

    this.scene.requireUpdateFrame();
    this.room.add(obj);
  }

  drawGrid(g) {
    for (const c of this.grid) {
      if (c.invalid) {
        g.drawRect(c.rect, 1, "white", "#f0f0f0");
        continue;
      }
        
      let color = 'silver';

      if (c.wallAdjacent || c.left || c.right || c.top || c.bottom) {
        color = '#c0ffc0';
      }
      
      if (c.way) color = '#ffffc0';
      if (c.door) color = '#ffffc0';

      const p1 = c.dists.wallp * 255;
      const p2 = c.dists.doorp * 255;
      const p3 = c.dists.windowp * 255;
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
  constructor() {
    super();

    this.style.strokeColor = "gray";
  }

  pointToObject(p) {
    p = new Vec2((p.x - 200) * 0.5, (p.y - 200) * 0.5);
    return super.pointToObject(p);
  }
  
  hitTestPoint(p) {
    return this.bbox.contains(this.pointToObject(p));
  }

  mouseenter(e) {
    this.style.strokeWidth = 2;
    this.style.strokeColor = "orangered";
    e.requireUpdateFrame();
  }

  mouseout(e) {
    this.style.strokeWidth = 1;
    this.style.strokeColor = "gray";
    e.requireUpdateFrame();
  }
}

class WallChildObject extends LayoutObject {
  constructor(wall, loc, size) {
    super();

    this.line = new Tarumae.LineSegment2D();

    this.wall = wall;
    this.size = size;
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
      const hw = this.size * 0.5, hh = this.wall.width * 0.5;
    
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
  constructor(wall, loc, size, dirs) {
    super(wall, loc, size);
    this.dirs = dirs;
  }

  render(g) {
    super.render(g);
    // g.drawLine(this.line.start, this.line.end, 4, "red");
    // g.drawLine({ x: this.bbox.minx, y: this.bbox.miny },
    //   { x: this.bbox.maxx, y: this.bbox.maxy }, 4, "red");
  }

  draw(g) {
    if (this.wall) {
      const w = this.size, hw = w * 0.5, h = this.wall.width, hh = h * 0.5;

      g.drawRect(new Tarumae.Rect(-hw, -hh, w, h));
      g.drawArc(new Tarumae.Rect(hw, hh, w, h), 90, 180);
    }
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
      const w = this.size, hw = this.size * 0.5;
      const h = this.wall.width, hh = h * 0.5;

      g.drawRect(new Tarumae.Rect(-hw, -hh, w, h));
      g.drawRect(new Tarumae.Rect(-hw, -4, w, 2));
    }
  }
}

class InteriorObject extends LayoutObject {
  constructor(width, height) {
    super();
    this.size = new Tarumae.Size(width, height);

    this.update();
  }

  updateBoundingBox() {
    const w = this.size.width, hw = w * 0.5,
      h = this.size.height, hh = h * 0.5;

    this.bbox.min.set(this.origin.x - hw, this.origin.y - hh);
    this.bbox.max.set(this.origin.x + hw, this.origin.y + hh);
  }
}

class Chair extends InteriorObject {
  constructor() {
    super(15, 15);
  }

  draw(g) {
    const w = this.size.width, hh = this.size.height / 2;
    const x = -hh, y = -hh;

    g.drawRoundRect({ x, y, width: w, height: w }, w * 0.7);
    g.drawRoundRect({ x, y: y - 2, width: w, height: 4 }, w * 0.2);

    g.drawRoundRect({ x: x - 2, y: y + hh - 4, width: 3, height: 8 }, w * 0.2);
    g.drawRoundRect({ x: x + w - 1, y: y + hh - 4, width: 3, height: 8 }, w * 0.2);
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

    horsets |= 1;
    versets |= 1;

    for (let y = 0; y < versets; y++) {
      for (let x = 0; x < horsets; x++) {

        if (ftf) {
          const chair1 = new Chair(15, 15);
          const table1 = new Table(35, 15);
          const chair2 = new Chair(15, 15);
          const table2 = new Table(35, 15);
          chair1.origin.set(0, -25);
          table1.origin.set(0, -15);
          table2.origin.set(0, 0);
          chair2.origin.set(0, 10);
          this.add(chair1, chair2, table1, table2);
        } else {
          const chair = new Chair(15, 15);
          const table = new Table(35, 15);
          chair.origin.set(0, -5);
          table.origin.set(0, 5);
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

    if (this.chair && this.table) {
      this.size = Tarumae.BBox2D.fromTwoBoundingBoxes(this.chair.bbox, this.table.bbox).size;

      super.updateBoundingBox();
    }
  }

  render(g) {
    super.render(g);
    // g.drawRect(this.bbox.rect, 2, "red", "white");
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
