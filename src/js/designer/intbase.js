import Tarumae from "../entry";
import Draw2D from "../draw/scene2d";
import { Vec2 } from "../math/vector";

const _mf = Tarumae.MathFunctions;

class LayoutObject extends Draw2D.Object {
  constructor() {
    super();
    
    this.style.strokeColor = "gray";

    this.draggable = true;
  }

  drawDimension(g, x = 0, y = 0) {
    const w = this.size.width, h = this.size.height;

    let angle = this.angle;
    if (angle > 90 && angle < 270) angle += 180;
    g.pushRotation(angle, this.origin.x, this.origin.y);
    g.drawText(`${w} cm x ${h} cm`, { x, y }, "black", "center", "0.7em Arial");
    g.popTransform();
  }

  // pointToObject(p) {
  //   p = new Vec2((p.x - 200) * 0.5, (p.y - 200) * 0.5);
  //   return super.pointToObject(p);
  // }

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

  draw(g) {
    this.drawDimension(g);
  }
}

export { LayoutObject };