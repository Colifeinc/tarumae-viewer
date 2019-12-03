import Tarumae from "../entry";
import "../math/functions";
import Draw2D from "../draw/scene2d";

const _mf = Tarumae.MathFunctions;

class Floor {
  constructor() { 

  }
}


class Area {
  constructor() {
    this.nodes = null;
    this.areaValue = 0;
    this.walls = [];
    this.objects = [];
  }

  update() {
    // update area value
    this.areaValue = _mf.calcPolygonArea(this.polygon.points) / 10000;
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
    g.drawText("Untitled space\n" + Math.round(this.areaValue) + " m²",
      this.polygon.bbox.origin, this.hover ? "red" : "black", "center", "14px Arial");
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

class Room extends Draw2D.Object {
  constructor() {
    super();
  }

  draw(g) {
    g.drawPolygon(this.area.polygon.points, 0, null, this.area.hover ? '#ddddee' : '#ffffee');

    if (window._debug) {
      if (this.area.grid) {
        for (const c of this.area.grid) {
          const cp = c.dists.doorp * 200 + 55;
          if (c.taken) cp = "0";
          g.drawRect(c.rect, 1, "#dddddd", `rgba(${cp}, ${cp}, ${cp}, 0.5)`);
          // g.drawText(new String(Math.round(c.dists.door)), c.rect.origin, "balck", "center");
        }
      }
    }
  }
}

export { Floor, Area, Room };