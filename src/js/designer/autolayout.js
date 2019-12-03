import Tarumae from "../entry";
import { TableChairSet, RoundRestTableGroup, InteriorAsset } from "./furniture";
import { Room } from "./floor";
import { Door } from "./wall";

const _mf = Tarumae.MathFunctions;

const gridSize = 30;
const wallWidth = 20;

class LayoutGenerator {
  constructor(designer) {
    this.designer = designer;
  }

  autoLayout(area) {
    this.area = area;

    this.generateCells(area);

    const room = new Room();
    room.area = area;
    this.designer.roomHolder.add(room);
    this.designer.rooms.push(room);

    this.generateLayout(room);

  }

  generateCells(area) {
    const maxDists = {
      wall: 0,
      door: 0,
      window: 0,
    };

    const bounds = area.bounds;
    area.cellCountX = (bounds.width - wallWidth) / gridSize;
    area.cellCountY = (bounds.height - wallWidth) / gridSize;

    area.grid = [];
    area.cells = [];
    let cellId = 0;

    for (let yi = 0, y = bounds.min.y + wallWidth * 0.5;
      yi < area.cellCountY; y += gridSize, yi++) {
      area.cells.push([]);
   
      for (let xi = 0, x = bounds.min.x + wallWidth * 0.5;
        xi < area.cellCountX; x += gridSize, xi++) {
        const rect = new Tarumae.Rect(x, y, gridSize - 1, gridSize - 1);
      
        const c = {
          cellId,
          xi, yi,
          rect,
          dists: {
            wall: 0,
            door: 0,
            window: 0,
          },
        };
        
        c.invalid = false;

        if (!area.polygon.containsRect(rect)) {
          c.invalid = true;
        }

        if (!c.invalid) {
          for (const wall of area.lines) {
            for (const obj of wall.objects) {
              if (rect.intersectsRect(obj.wbbox.rect)) {
                c.invalid = true;
                break;
              }
            }
            if (c.invalid) break;
          }
        }

        if (!c.invalid) {
          cellId++;

          const wallDist = _mf.distancePointToPolygon(rect.origin, area.polygon.points);
          c.dists.wall = wallDist;
          if (wallDist > maxDists.wall) maxDists.wall = wallDist;

          let minDoorDist = Infinity;
          for (const wall of area.lines) {
            for (const obj of wall.objects) {
              if (obj instanceof Door) {
                const doorDist = _mf.distancePointToPoint2D(rect.origin, obj.origin);
                if (minDoorDist > doorDist) minDoorDist = doorDist;
              }
            }
          }
          
          if (minDoorDist < Infinity) {
            c.dists.door = minDoorDist;
            if (maxDists.door < minDoorDist) maxDists.door = minDoorDist;
          }

          area.grid.push(c);
        }
        
        area.cells[yi].push(c);
      }
    }

    for (const c of area.grid) {
      c.dists.wallp = c.dists.wall / maxDists.wall;
      c.dists.doorp = c.dists.door === 0 ? 0 : (c.dists.door / maxDists.door);
      c.dists.windowp = c.dists.window === 0 ? 0 : (c.dists.window / maxDists.window);
    }
  }

  generateLayout(room) {
    for (let i = 0; i < 2; i++) {
      const horsets = 2, versets = 1, opposite = true;
      const ts = new TableChairSet(horsets, versets, opposite);
      this.putInterior(room, ts);
    }

    const restTableGroup = new RoundRestTableGroup();
    this.putInterior(room, restTableGroup);

    this.putInterior(room, new InteriorAsset("print_mfp_w1500", 270, 100));
  }

  putInterior(room, obj) {
    const objSize = obj.size;
    const cw = Math.ceil(objSize.width / gridSize);
    const ch = Math.ceil(objSize.height / gridSize);

    const list = this.findAvailableSpace(room.area, cw, ch);

    if (list.length > 0) {
      list.sort((a, b) => b.scores.work - a.scores.work);

      const pos = list[0];

      obj.origin.set(pos.cell.rect.origin.x + (cw * gridSize) * 0.5,
        pos.cell.rect.origin.y + (ch * gridSize * 0.5));
        
      this.finalizeInterior(room, obj);
    }
  }

  finalizeInterior(room, obj) {
    obj.update();

    const area = room.area;
    const objRect = obj.wbbox.rect;

    for (const c of area.grid) {
      if (_mf.rectIntersectsRect(c.rect, objRect)) {
        c.taken = true;
      }
    }

    // area.objects.push(obj);
    room.add(obj);
    this.designer.invalidate();
  }

  findAvailableSpace(area, cw, ch) {
   
    const poslist = [];
    const needrun = cw * ch;

    for (const cell of area.grid) {
  
      let ctaken = false;
      let workscore = 0;
      let runs = 0;

      for (let i = 0, yi = cell.yi + i; i < ch && yi < area.cellCountY; i++, yi++) {
        if (ctaken) {
          break;
        }

        for (let k = 0, xi = cell.xi + k; k < cw && xi < area.cellCountX; k++, xi++) {
          const cell = area.cells[yi][xi];
          if (!cell || cell.invalid) continue;

          if (cell.taken) {
            ctaken = true;
            break;
          }

          // workscore += c.dists.doorp * c.dists.doorp + (1 - c.dists.windowp);
          workscore += (cell.dists.wallp);
          
          runs++;
        }
      }

      if (!ctaken && runs >= needrun) {
        poslist.push({
          cell,
          scores: {
            work: workscore,
          }
        });
      }
    }

    return poslist;
  }
}

export { LayoutGenerator };