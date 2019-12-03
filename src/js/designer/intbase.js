import Tarumae from "../entry";
import Draw2D from "../draw/scene2d";
import { Vec2 } from "../math/vector";

const _mf = Tarumae.MathFunctions;

class LayoutObject extends Draw2D.Object {
  constructor() {
    super();
    
    this.style.strokeWidth = 3;
    this.style.strokeColor = "gray";

    this.draggable = true;
  }

  drawDimension(g, x = 0, y = 0) {
    const w = this.size.width, h = this.size.height;


    const mat = Tarumae.Matrix3.makeRotation(this.angle);
    const tp = new Vec2(x, y).mulMat(mat);

    let angle = this.angle;
    if (angle > 90 && angle < 270) angle += 180;
    g.pushRotation(angle, this.origin.x, this.origin.y);
    g.drawText(`${w} cm x ${h} cm`, tp, "black", "center", "0.7em Arial");
    g.popTransform();
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
    if (!this.draggable) return;

    this.offset(e.movement);

    e.requireUpdateFrame();
  }

  render(g) {
    super.render(g);

    // debug
    if (window._debug) {
      if (this.bounds.points) {
        g.drawLines(this.bounds.points, 1, "blue", "transparent");
      }

      g.drawRect(this.wbbox.rect, 1, "red");
    }
  }

  draw(g) {
    this.drawDimension(g);
  }
}

export { LayoutObject };