import Tarumae from "../entry";
import Draw2D from "../draw/scene2d";
import { Vec2 } from "../math/vector";
import { LayoutObject } from "./intbase";

const _mf = Tarumae.MathFunctions;

class InteriorObject extends LayoutObject {
  constructor() {
    super();
    
    this.style.strokeWidth = 3;
  }

  render(g) {
    super.render(g);

    // debug
    if (window._debug) {
      if (this.bounds.points) {
        g.drawLines(this.bounds.points, 1, "blue", "transparent");
      }
    }
  }
}

class InteriorGroup extends InteriorObject {
  constructor() {
    super();
  }

  updateBoundingBox() {
    if (this.objects.length > 0) {
      this.bbox.set(this.objects[0].bbox);

      for (let i = 1; i < this.objects.length; i++) {
        this.bbox.expendToBBox(this.objects[i].bbox);
      }
    }

    this.size = this.bbox.size;
  }

  updateWorldBoundingBox() {
    if (this.objects.length > 0) {
      this.wbbox.set(this.objects[0].wbbox);

      for (let i = 1; i < this.objects.length; i++) {
        this.wbbox.expendToBBox(this.objects[i].wbbox);
      }
    }
    
    this.size = this.wbbox.size;
  }

  render(g) {
    super.render(g);

    if (window._debug) {
      g.drawRect(this.wbbox.rect, 1, "red");
    }
  }
}

class TableChairSet extends InteriorGroup {
  constructor(horsets, versets, opposite) {
    super();

    this.horsets = horsets || 1;
    this.versets = versets || 1;
    this.opposite = opposite;

    this.tableWidth = 120;
    this.tableHeight = 60;
    this.chairToTable = 0.2;

    this.tables = [];
    this.chairs = [];

    this.createChildren();
    this.layout();
  }

  createChildren() {
    for (let y = 0; y < this.versets; y++) {
      for (let x = 0; x < this.horsets; x++) {
        if (this.opposite) {
          const table1 = new Table();
          const chair1 = new Chair2();
          const table2 = new Table();
          const chair2 = new Chair2();
          table2.angle = 180;
          chair2.angle = 180;
          this.tables.push(table1, table2);
          this.chairs.push(chair1, chair2);
        } else {
          const table = new Table();
          const chair = new Chair2();
          this.tables.push(table);
          this.chairs.push(chair);
          chair.angle = 180;
        }
      }
    }

    this.chairs.forEach(o => this.add(o));
    this.tables.forEach(o => this.add(o));
  }

  layout() {
    const hw = this.tableWidth * 0.5, hh = this.tableHeight * 0.5;
    const totalWidth = this.tableWidth * this.horsets, htw = totalWidth * 0.5;
    const ctt = this.chairToTable;

    for (let y = 0; y < this.versets; y++) {
      let i = 0;

      for (let x = 0; x < this.horsets; x++) {
        const ox = x * this.tableWidth + hw - htw;

        if (this.opposite) {
          const table1 = this.tables[i];
          const chair1 = this.chairs[i];
          const table2 = this.tables[i + 1];
          const chair2 = this.chairs[i + 1];
          table1.origin.set(ox, -hh);
          chair1.origin.set(ox, -table1.height - hh * ctt);
          table2.origin.set(ox, hh);
          chair2.origin.set(ox, table2.height + hh * ctt);
        } else {
          const table = this.tables[i];
          const chair = this.chairs[i];
          table.origin.set(ox, -hh);
          chair.origin.set(ox, table.height * ctt);
        }

        i += this.opposite ? 2 : 1;
      }
    }

    this.update();
  }
}

class Table extends InteriorObject {
  constructor(width, height) {
    super();
    
    this.width = width || 120;
    this.height = height || 60;
    this.size.set(this.width, this.height);
  }

  draw(g) {
    const w = this.size.width, h = this.size.height,
      hw = w / 2, hh = h / 2,
      x = -hw, y = -hh;

    g.drawRect({ x, y, width: w, height: h }, 3, this.style.strokeColor, this.style.fillColor);
  }
}

class Chair extends InteriorObject {
  constructor() {
    super();

    this.size.set(50, 50);
  }

  draw(g) {
    const w = this.size.width, hh = this.size.height / 2;
    const x = -hh, y = -hh;

    g.drawRoundRect({ x: x + 2, y, width: w - 4, height: w }, w * 0.5);
    g.drawRoundRect({ x: x + 2, y: y - 2, width: w - 4, height: 8 }, w * 0.3);

  }
}

class Chair2 extends Chair {
  constructor() {
    super();

    this.size.set(50, 50);
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

class RoundRestTableGroup extends InteriorObject {
  constructor(seats) {
    super();

    this.tableRadius = 100;
    this.seats = seats || 4;
    this.chairs = [];
    this.angle = 45;
    this.size.set(this.tableRadius + 80, this.tableRadius + 80);

    const segAngle = 360 / this.seats;

    for (let i = 0; i < this.seats; i++) {
      const chair = new Chair();
      const angle = i * segAngle;
      chair.origin.set(Math.sin(_mf.angleToDegree(angle)) * this.tableRadius * 0.6,
        Math.cos(_mf.angleToDegree(angle)) * this.tableRadius * 0.6);
      chair.angle = (180 - angle);
      this.chairs.push(chair);
      this.add(chair);
    }

    const table = new RoundTable(this.tableRadius);
    this.add(table);

    this.update();
  }
}

class RoundTable extends InteriorObject {
  constructor(radius) {
    super();

    this.radius = radius || 100;

    this.bbox.min.set(-this.radius, -this.radius);
    this.bbox.max.set(this.radius, this.radius);

    this.size.set(this.radius, this.radius);
  }

  draw(g) {
    g.drawEllipse(this.bbox.rect, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor);
  }
}

class InteriorAsset extends InteriorObject {
  constructor(assetId, width, height) {
    super();
    
    this.assetId = assetId;
    this.size.set(width, height);
    
    this.image = new Image();
    this.image.src = `https://itoki-uploads.autofloor.jp/previews/256/${assetId}-topview.png`;

    this.update();
  }

  draw(g) {
    g.drawImage(this.image, -this.size.width * 0.5, -this.size.height * 0.5);
  }
}

export { TableChairSet, RoundRestTableGroup, InteriorAsset }