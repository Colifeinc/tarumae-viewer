import Tarumae from "../entry";
import { Vec2 } from "../math/vector";
import "../math/functions";
import { Area } from "./floor";
import { Array } from "core-js";

const _mf = Tarumae.MathFunctions;

class RoomScanner {
  constructor() {
  }

  scanAreas(nodes, lines) {
    this.nodes = nodes;
    this.lines = lines;

    this.areas = [];

    this.lines.forEach(l => this.scanFromLine(l.startNode, l.endNode));
    this.lines.forEach(l => this.scanFromLine(l.endNode, l.startNode));

    return this.areas;
  }

  scanFromLine(start, end) {
    // skip if n1 has only one line, no closure path
    if (start.lines.length <= 1 || end.lines.length <= 1) return;

    const ss = new ScanSessionStack();
    const area = this.scanFromTwoNode(start, end, ss);

    if (area != null
      && area.totalAngle <= ((area.nodes.length - 2) * 180) + 1
      && !this.existedArea(area)
    ) {
      area.update();
      this.areas.push(area);
      // console.debug('found area: ', area);
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
        area.polygon = new Tarumae.Polygon(polygon);
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
      if (Area.isSameArea(this.areas[i].nodes, a.nodes)) {
        return true;
      }
    }
    return false;
  }

  findExpandableWalls(areas) {
    let exwalls = [];
    areas.forEach(area => {
      area.eachWall((n1, n2) => {
        if (!RoomScanner.isSharedAreaWall(areas, area, n1, n2)) {
          exwalls.push({ area, n1, n2 });
        }
      });
    });
    return exwalls;
  }

  static isSharedAreaWall(areas, currentArea, n1, n2) {
    let shared = false;
    for (let i = 0; i < areas.length; i++){
      const area = areas[i];
      if (area === currentArea) continue;

      area.eachWall((w2n1, w2n2) => {
        const ret = RoomScanner.isSameWallNodes(n1, n2, w2n1, w2n2);
        if (ret) {
          shared = true;
          return true;
        }
      });
    }
    return shared;
  }

  static isSameWallNodes(w1n1, w1n2, w2n1, w2n2) {
    return (w1n1 === w2n1 && w1n2 === w2n2)
      || (w1n1 == w2n2 && w1n2 === w2n1);
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
        return this.stack[0].route[0] === node;
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

if (!Array.prototype.any) {
  Array.prototype.any = function(p) {
    for (let i = 0; i < this.length; i++) {
      if (p(this[i])) return true;
    }
    return false;
  };
}

if (!Array.prototype.all) {
  Array.prototype.all = function(p) {
    for (let i = 0; i < this.length; i++) {
      if (!p(this[i])) return false;
    }
    return true;
  };
}
export { RoomScanner };