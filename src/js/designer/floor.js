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
    this.nodes = null;
    this.areaValue = 0;
    this.centerPoint = null;
  }

  update() {
    // update area value
    this.areaValue = _mf.calcPolygonArea(this.polygon.points) / 10000;

    // update center point
    let cp = new Vec2(0, 0);
    cp = new Vec2(0, 0);
    this.polygon.points.forEach(p => cp = cp.add(p));
    this.centerPoint = cp.div(this.polygon.points.length);
  }

  eachWall(iterator) {
		if (!this.nodes || this.nodes.length < 2) return;

		for (let i = 0; i < this.nodes.length - 1; i++) {
			const ret = iterator(this.nodes[i], this.nodes[i + 1]);
			if (ret) return;
		}

		iterator(this.nodes[this.nodes.length - 1], this.nodes[0]);
  }
  
  get bounds() {
    if (!this.polygon) return;

    return this.polygon.bbox;
  }

  draw(g) {
    g.drawPolygon(this.polygon.points, 0, null, this.hover ? '#ddddee' : '#ffffee');

    if (this.grid) {
      for (const gr of this.grid) {
        const cp = gr.dists.wallp * 100 + 155;
        g.drawRect(gr.rect, 1, "#dddddd", `rgb(${cp}, ${cp}, ${cp})`);
      }
    }

    g.drawText("Untitled space\n" + Math.round(this.areaValue) + " m²",
      this.centerPoint, this.hover ? "red" : "black", "center", "14px Arial");
  }

  static isSameArea(nl1, nl2) {
    if (nl1.length !== nl2.length) return false;

    for (let j = 0; j < nl1.length; j++) {
      let same = true;

      for (let i = j, k = 0; k < nl2.length; i++ , k++) {
        if (i >= nl1.length) i = 0;

        if (nl1[i] !== nl2[k]) {
          same = false;
          break;
        }
      }

      if (same) return true;

      same = true;

      for (let i = j, k = 0; k < nl2.length; i-- , k++) {
        if (i < 0) i = nl1.length - 1;

        if (nl1[i] !== nl2[k]) {
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