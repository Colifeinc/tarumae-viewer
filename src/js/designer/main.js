import Tarumae from "../entry"
import "../scene/scene";
import "../scene/viewer";
import "../utility/archive";
import "../utility/res";
import Drawing2d from "../draw/scene2d";
import { isThisSecond } from "date-fns";

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
    this.scene.ondraw = _ => this.draw();

    this.data = {
      walls: [
        [0, 0], [400, 0], [400, 320], [160, 320], [160, 160], [0, 160],
      ],
      doors: [
        { loc: [0, 45], size: 30, wallIndex: 5, dirs: [0, 0] },
      ],
      windows: [
        { loc: [200, 320], size: 40, wallIndex: 3, dirs: [0, 0] },
        { loc: [240, 320], size: 40, wallIndex: 3, dirs: [0, 0] },
        { loc: [280, 320], size: 40, wallIndex: 3, dirs: [0, 0] },
        { loc: [320, 320], size: 40, wallIndex: 3, dirs: [0, 0] },
        { loc: [360, 320], size: 40, wallIndex: 3, dirs: [0, 0] },
      ],
      pillars: [
        [[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]],
      ],
      objects: [],
    };

    this.createLayout(this.data);

    this.grid = [];

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

    this.entryCells = [
      10
    ];

    // this.generateCells();
  }

  show() {
    this.scene.show();
  }

  createLayout(data) {
    const layout = new Drawing2d.ContainerObject();
    layout.rect.moveTo(200, 200);
    layout.scale.set(2, 2);
    this.scene.add(layout);

    const polygon = data.walls;

    const room = new Room(polygon);
    layout.add(room);

    for (let i = 0, j = 0; i < polygon.length; i++ , j++) {
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
    }
    
    for (const w of data.windows) {
      const wall = room.walls[w.wallIndex];
      const window = new Window(wall, w.loc, w.size, w.dirs);
      wall.add(window);
    }
  }

  generateCells() {
    const gridSize = 20, halfGridSize = gridSize * 0.5;
    let cellIndex = -1;

    const walls = this.data.walls;
    const mf = Tarumae.MathFunctions;

    let maxDists = {
      wall: 0,
      entry: 0,
      window: 0,
    };

    for (let y = 0, yi = 0; y <= 300; y += gridSize, yi++) {
      for (let x = 0, xi = 0; x < 400; x += gridSize, xi++) {
        cellIndex++;

        const rect = new Tarumae.Rect(x, y, gridSize, gridSize);

        // if (!Tarumae.MathFunctions.polygonContainsRect(this.data.walls, rect)) {
        //   continue;
        // }

        if (!mf.polygonContainsPoint(walls, rect.origin)) {
          continue;
        }

        const c = {
          index: cellIndex,
          //origin: new Tarumae.Point(x + gridSize * 0.5, y + gridSize * 0.5),
          rect,
          dists: {
          },
        };

        const wallDist = mf.distancePointToPolygon(rect.origin, walls);
        c.dists.wall = wallDist;
        if (wallDist > maxDists.wall) maxDists.wall = wallDist;

        for (const w of this.data.windows) {
          
        }

        const windowDist = mf.distancePointToLine(rect.origin, walls);
        c.dists.window = windowDist;
        if (windowDist > maxDists.window) maxDists.window = windowDist;

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
        c.wallAdjacent = true;
      }
    }
  }

  makeTableCells() {
    for (const c of this.grid) {
      if (this.entryCells.includes(c.index)) continue;
      
    }
  }

  draw() {
    // const r = this.ctx;
    // const data = this.data;

    // const walls = data.walls;

    // const m = new Tarumae.Matrix3().loadIdentity();
    // m.translate(100, 100);
    // m.scale(2, 2);
    // r.pushTransform(m);
    
    this.drawGrid();

    // r.drawLines(walls, 6, "gray", true);
    
    // for (const [_, p] of data.pillars.entries()) {
    //   r.drawLines(p, 0, undefined, "gray");
    // }
    // for (const [_, w] of walls.entries()) {
      // r.drawLine({ x: w.from[0], y: w.from[1] }, { x: w.to[0], y: w.to[1] }, 5, "gray");
    // }

    // for (const [_, d] of data.doors.entries()) {
    //   this.drawDoor(d);
    // }

    // for (const [_, w] of data.windows.entries()) {
    //   this.drawWindow(w);
    // }

    // for (const [_, o] of data.objects.entries()) {
    //   this.drawObjects(o);
    // }


    // r.popTransform();
  }

  drawDoor(d) {
    const g = this.ctx;
    
    const x = d.loc[0], y = d.loc[1];
    const w = d.size, h = 5;

    g.drawRect({ x: x - 2, y: y, width: h, height: w }, 1, "gray", "white");
    g.drawArc({ x: x + 3, y: y, width: w, height: w }, 0, 90, 1, "gray", "white");
  }

  drawObjects(o) {
    switch (o.type) {
      case "chair": this.drawChair(o); break;
      case "table": this.drawTable(o); break;
      case "table set": this.drawTableSet(o); break;
    }
  }

  drawChair(c) {
    const g = this.ctx;
    const size = 15, hs = size / 2;
    const x = c.loc[0] - hs, y = c.loc[1] - hs;

    g.drawRoundRect({ x, y, width: size, height: size }, size * 0.7, 1, "black", "white");
    g.drawRoundRect({ x, y: y - 2, width: size, height: 4 }, size * 0.2, 1, "black", "white");

    g.drawRoundRect({ x: x - 2, y: y + hs - 4, width: 3, height: 8 }, size * 0.2, 1, "black", "white");
    g.drawRoundRect({ x: x + size - 1, y: y + hs - 4, width: 3, height: 8 }, size * 0.2, 1, "black", "white");
  }

  drawTable(t) {
    const g = this.ctx;
    const w = t.size[0], h = t.size[1],
      hw = w / 2, hh = h / 2,
      x = t.loc[0] - hw, y = t.loc[1] - hh;

    g.drawRect({ x, y, width: w, height: h }, 1, "black", "white");

  }

  drawTableSet(o) {
    const g = this.ctx;
    const x = o.loc[0], y = o.loc[1],
      w = o.size[0], h = o.size[1],
      ox = x + w / 2, oy = y + h / 2;
    
    const m = Tarumae.Matrix3.makeRotation(o.angle, ox, oy);
    g.pushTransform(m);
    
    this.drawChair({ type: "chair", loc: [0, 0 - 8] });
    this.drawTable({ type: "table", loc: [0, 0 + 8], size: [w, 18] });

    g.popTransform();
  }

  drawGrid() {
    const g = this.ctx;

    for (const c of this.grid) {
      let color = 'silver';

      if (c.wallAdjacent || c.left || c.right || c.top || c.bottom) {
        color = '#c0ffc0';
      }
      
      if (c.way) color = '#ffffc0';
      if (c.entry) color = '#ffffc0';

      const p = c.dists * 255;
      color = `rgb(150, ${p}, ${p})`;

      const o = c.rect.origin;

      g.drawRect(c.rect, 1, "white", color);
      // g.drawRect(new Tarumae.Rect(o.x - 2, o.y - 2, 4, 4), 0, undefined, "silver");
      g.drawText(o, c.index, "silver", "center", "5px Arial");
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
  }

  draw(g) {
    g.drawLines(this.polygon, 6, "gray", true);
  }
}

class Wall extends Drawing2d.Object {
  constructor(x1, y1, x2, y2) {
    super();
  
    this.line = new Tarumae.LineSegment2D(x1, y1, x2, y2);
    this.angle = Math.atan2(y2 - y1, x2 - x1);
    this.width = 6;

    this.polygon = [];
  }

  update() {
    this.polygon = [];
  }

  draw(g) {
    g.drawLine(this.line.start, this.line.end, 1);
  }
}

class WallChildObject extends Drawing2d.Line {
  constructor(wall, loc, size) {
    super();

    this.wall = wall;
    this.loc = loc;
    this.size = size;
    
    const angle = wall.angle;

    const m = Tarumae.Matrix3.makeRotation(angle);
    const hw = size * 0.5, hh = this.wall.width * 0.5;
    const start = new Tarumae.Point(-hw, -hw).mulMat(m),
      end = new Tarumae.Point(-hh, hh).mulMat(m);
    
    this.line.start = start;
    this.line.end = end;
  }
}

class Door extends WallChildObject {
  constructor(wall, loc, size, dirs) {
    super(wall, loc, size);

    this.dirs = dirs;
  }
}

class Window extends WallChildObject {
  constructor(wall, loc, size, dirs) {
    super(wall, loc, size);
    
    this.dirs = dirs;
  }

  draw(g) {
    // const x = w.loc[0], y = w.loc[1];

    // g.drawRect({ x: x, y: y - 2, width: w.size, height: 4 }, 1, "gray", "white");
    // g.drawRect({ x: x, y: y + 2, width: w.size, height: 2 }, 1, "gray", "white");

    const m = Tarumae.Matrix3.makeTranslation(this.loc[0], this.loc[1]);
    m.rotate(this.wall.angle);

    g.pushTransform(m);

    const w = this.size, hw = this.size * 0.5;
    const h = this.wall.width, hh = h * 0.5;

    g.drawRect(new Tarumae.Rect(-hw, -hh, w, h), 1, "gray", "white");
    g.drawRect(new Tarumae.Rect(-hw, h - 2, w, 2), 1, "gray", "white");

    g.popTransform();
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
