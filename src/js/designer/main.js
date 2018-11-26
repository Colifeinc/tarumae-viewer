import Tarumae from "../entry"
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import Drawing2d from "../draw/scene2d";
import { Vec2 } from "../math/vector";

const TarumaeDesigner = {
};

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

  createLayout(data) {
    const layout = new Drawing2d.Object();
    layout.origin.set(this.viewport.origin);
    layout.scale.set(this.viewport.scale, this.viewport.scale);
    this.scene.add(layout);

    const polygon = data.walls;

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

    const gridSize = 20, halfGridSize = gridSize * 0.5;
    this.gridSize = gridSize;

    const wallPolygon = this.data.walls;
    const _mf = Tarumae.MathFunctions;

    const maxDists = {
      wall: 0,
      door: 0,
      window: 0,
    };

    let cellIndex = -1;
    for (let y = 0, yi = 0; y <= 300; y += gridSize, yi++) {
      for (let x = 0, xi = 0; x < 400; x += gridSize, xi++) {
        cellIndex++;

        const rect = new Tarumae.Rect(x, y, gridSize, gridSize);

        if (!_mf.polygonContainsPoint(wallPolygon, rect.origin)) {
          continue;
        }

        const c = {
          index: cellIndex,
          rect,
          dists: {
          },
        };

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
      }
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
    const c1 = new Chair();
    c1.origin.set(10, 100);
    this.room.add(c1);
  }

  drawGrid(g) {
    for (const c of this.grid) {
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
      g.drawText(o, c.index, "silver", "center", "5px Arial");
    }
  }

  // drawObjects(o) {
  //   switch (o.type) {
  //     case "chair": this.drawChair(o); break;
  //     case "table": this.drawTable(o); break;
  //     case "table set": this.drawTableSet(o); break;
  //   }
  // }

  // drawTableSet(o) {
  //   const g = this.ctx;
  //   const x = o.loc[0], y = o.loc[1],
  //     w = o.size[0], h = o.size[1],
  //     ox = x + w / 2, oy = y + h / 2;
    
  //   const m = Tarumae.Matrix3.makeRotation(o.angle, ox, oy);
  //   g.pushTransform(m);
    
  //   this.drawChair({ type: "chair", loc: [0, 0 - 8] });
  //   this.drawTable({ type: "table", loc: [0, 0 + 8], size: [w, 18] });

  //   g.popTransform();
  // }
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
    return new Vec2((p.x - 200) * 0.5, (p.y - 200) * 0.5);
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
    const w = this.size, hw = w * 0.5, h = this.wall.width, hh = h * 0.5;

    g.drawRect(new Tarumae.Rect(-hw, -hh, w, h));
    g.drawArc(new Tarumae.Rect(hw, hh, w, h), 90, 180);
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
    const w = this.size, hw = this.size * 0.5;
    const h = this.wall.width, hh = h * 0.5;

    g.drawRect(new Tarumae.Rect(-hw, -hh, w, h));
    g.drawRect(new Tarumae.Rect(-hw, -4, w, 2));
  }
}

class InteriorObject extends LayoutObject {
  constructor(width, height) {
    super();
    this.size = new Tarumae.Size(width, height);
  }

  updateBoundingBox() {
    
  }
}

class Chair extends InteriorObject {
  constructor() {
    super(15, 15);
  }

  draw(g) {
    const size = this.size.width, hs = this.size.height / 2;
    const x = this.origin.x - hs, y = this.origin.y - hs;

    g.drawRoundRect({ x, y, width: size, height: size }, size * 0.7);
    g.drawRoundRect({ x, y: y - 2, width: size, height: 4 }, size * 0.2);

    g.drawRoundRect({ x: x - 2, y: y + hs - 4, width: 3, height: 8 }, size * 0.2);
    g.drawRoundRect({ x: x + size - 1, y: y + hs - 4, width: 3, height: 8 }, size * 0.2);
  }
}

class Table extends InteriorObject {
  constructor() {
    super(40, 15);
  }

  draw(g) {
    const w = t.size.width, h = t.size.height,
      hw = w / 2, hh = h / 2,
      x = t.origin.x - hw, y = t.origin.y - hh;

    g.drawRect({ x, y, width: w, height: h });
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
