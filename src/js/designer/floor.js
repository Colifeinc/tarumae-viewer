import Tarumae from "../entry";
import { Vec2 } from "../math/vector";
import "../math/functions";

const _mf = Tarumae.MathFunctions;

class Floor {
  constructor() { 

  }
}


class Area {
  constructor() {
    this.areaValue = 0;
    this.centerPoint = null;
  }

  update() {
    // update area value
    this.areaValue = _mf.calcPolygonArea(this.polygon.points);

    // update center point
    let cp = new Vec2(0, 0);
    cp = new Vec2(0, 0);
    this.polygon.points.forEach(p => cp = cp.add(p));
    this.centerPoint = cp.div(this.polygon.points.length);
  }

  static isSameArea(n1, n2) {
    if (n1.length !== n2.length) return false;

    for (let j = 0; j < n1.length; j++) {
      let same = true;

      for (let i = j, k = 0; k < n2.length; i++ , k++) {
        if (i >= n1.length) i = 0;

        if (n1[i] !== n2[k]) {
          same = false;
          break;
        }
      }

      if (same) return true;

      same = true;

      for (let i = j, k = 0; k < n2.length; i-- , k++) {
        if (i < 0) i = n1.length - 1;

        if (n1[i] !== n2[k]) {
          same = false;
          break;
        }
      }

      if (same) return true;
    }

    return false;
  }
}

export { Floor, Area };