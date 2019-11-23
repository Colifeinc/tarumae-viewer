////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

function TarumaeCompass(renderer) {
  this.renderer = renderer;

  this.screenPosition = new Vec2(0, 0);
  this.angle = new Vec3(0, 0, 0);
  this.moving = false;

  this.arrows = {
    x: { dir: new Vec3(1, 0, 0), color: "#00ff00", enabled: true, screenPosition: new Vec2(0, 0), name: "X" },
    x2: { dir: new Vec3(-1, 0, 0), color: "#888888", enabled: true, screenPosition: new Vec2(0, 0) },
    y: { dir: new Vec3(0, 1, 0), color: "#ff0000", enabled: true, screenPosition: new Vec2(0, 0), name: "Y" },
    y2: { dir: new Vec3(0, -1, 0), color: "#888888", enabled: true, screenPosition: new Vec2(0, 0) },
    z: { dir: new Vec3(0, 0, 1), color: "#0000ff", enabled: true, screenPosition: new Vec2(0, 0), name: "Z" },
    z2: { dir: new Vec3(0, 0, -1), color: "#888888", enabled: true, screenPosition: new Vec2(0, 0) },
  };

  this.selectedArrow = null;
}

TarumaeCompass.Length = 50;

TarumaeCompass.prototype.draw = function () {
  var renderer = this.renderer;

  this.angle = renderer.viewer.angle.clone();
  this.screenPosition = new Tarumae.Point(renderer.renderSize.width - TarumaeCompass.Length * 2, TarumaeCompass.Length * 2);

  // Custom rotation matrix to tranform angles to axes for the 3D Compass
  // See http://www.songho.ca/opengl/gl_anglestoaxes.html for information
  // Uses an XYZ order since it uses the viewer angles to calculate
  // Pitch
  var theta = this.angle.x * Math.PI / 180;
  var sx = Math.sin(theta);
  var cx = Math.cos(theta);

  // Yaw
  theta = this.angle.y * Math.PI / 180;
  var sy = Math.sin(theta);
  var cy = Math.cos(theta);

  // Roll
  theta = this.angle.z * Math.PI / 180;
  var sz = Math.sin(theta);
  var cz = Math.cos(theta);

  // X arrow
  this.arrows.x.dir.x = cy * cz;
  this.arrows.x.dir.y = sx * sy * cz + cx * sz;
  this.arrows.x.dir.z = -cx * sy * cz + sx * sz;
  this.arrows.x.dir = this.arrows.x.dir.normalize();
  this.arrows.x2.dir.x = -this.arrows.x.dir.x;
  this.arrows.x2.dir.y = -this.arrows.x.dir.y;
  this.arrows.x2.dir.z = -this.arrows.x.dir.z;

  // Y arrow
  this.arrows.y.dir.x = -cy * sz;
  this.arrows.y.dir.y = -sx * sy * sz + cx * cz;
  this.arrows.y.dir.z = cx * sy * sz + sx * cz;
  this.arrows.y.dir = this.arrows.y.dir.normalize();
  this.arrows.y2.dir.x = -this.arrows.y.dir.x;
  this.arrows.y2.dir.y = -this.arrows.y.dir.y;
  this.arrows.y2.dir.z = -this.arrows.y.dir.z;

  // Z arrow
  this.arrows.z.dir.x = sy;
  this.arrows.z.dir.y = -sx * cy;
  this.arrows.z.dir.z = cx * cy;
  this.arrows.z.dir = this.arrows.z.dir.normalize();
  this.arrows.z2.dir.x = -this.arrows.z.dir.x;
  this.arrows.z2.dir.y = -this.arrows.z.dir.y;
  this.arrows.z2.dir.z = -this.arrows.z.dir.z;

  this.drawArrow(this.arrows.x2);
  this.drawArrow(this.arrows.z2);
  this.drawArrow(this.arrows.y2);
  this.drawArrow(this.arrows.x);
  this.drawArrow(this.arrows.z);
  this.drawArrow(this.arrows.y);
};

TarumaeCompass.prototype.drawArrow = function(arrow) {
  var renderer = this.renderer;
  var viewer = renderer.viewer;

  var to = arrow.dir.mul(TarumaeCompass.Length);

  arrow.screenPosition = new Tarumae.Point(this.screenPosition.x + to.x, this.screenPosition.y - to.y);
  
  renderer.drawArrow2D(this.screenPosition, arrow.screenPosition, 3.2, arrow.color);
  
  if (arrow.name) {
    renderer.drawText2D(new Tarumae.Point(arrow.screenPosition.x + 10, arrow.screenPosition.y + 5), arrow.name, "white");
  }
};

TarumaeCompass.prototype.onmousedown = function() {
  var viewer = this.renderer.viewer;
  
  var p = viewer.mouse.position;

  this.selectedArrow = null;

  if (this.checkArrowHittedByPosition(this.arrows.x, p)) {
    this.selectedArrow = this.arrows.x;
  } else if (this.checkArrowHittedByPosition(this.arrows.y, p)) {
    this.selectedArrow = this.arrows.y;
  } else if (this.checkArrowHittedByPosition(this.arrows.z, p)) {
    this.selectedArrow = this.arrows.z;
  } else if (this.checkArrowHittedByPosition(this.arrows.x2, p)) {
    this.selectedArrow = this.arrows.x2;
  } else if (this.checkArrowHittedByPosition(this.arrows.y2, p)) {
    this.selectedArrow = this.arrows.y2;
  } else if (this.checkArrowHittedByPosition(this.arrows.z2, p)) {
    this.selectedArrow = this.arrows.z2;
  } 

  return this.selectedArrow !== null;
};

TarumaeCompass.prototype.checkArrowHittedByPosition = function(arrow, p) {
  var bounds = Tarumae.Rect.createFromPoints(this.screenPosition, arrow.screenPosition);
  
  if (bounds.width < 8) {
    bounds.x -= 4; 
    bounds.width = 8;
  }

  if (bounds.height < 8) {
    bounds.y -= 4;
    bounds.height = 8;
  }

  return bounds.contains(p)
    && (Tarumae.MathFunctions.distancePointToLine2D(this.screenPosition, arrow.screenPosition, p) < 5);
};