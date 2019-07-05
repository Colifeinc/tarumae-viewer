import Tarumae from "../entry"
import { Vec3 } from "../math/vector"
import "../math/bbox"

Tarumae.KDNode = class {
  constructor() {
    this.bbox = undefined;
    this.left = undefined;
    this.right = undefined;
    this.items = [];
  }
  
  // static boundingBoxFromTriangles(items) {
  //   const bbox = items[0].bbox;
  //   for (let i = 1; i < itemCount; i++) {
  //     bbox.expandToBox(items[i].bbox);
  //   }
  //   return bbox;
  // }

  reset() {
    this.left = undefined;
    this.right = undefined;
    this.items._t_clear();
  }
  
  build(itemGetter, itemCount, depth = 0) {
    if (itemCount <= 0) {
      return;
    }
    else if (itemCount <= 1) {
      this.bbox = itemGetter(0).bbox;
      this.items.push(items[0]);
      return;
    }

    let bbox = boundingBoxFromItems(items, itemCount);
        
    if (itemCount <= 3) {
      this.bbox = bbox;
      for (let i = 0; i < itemCount; i++) {
        this.items.push(i);
      }
      return;
    }

    let left, right;
    let lbox, rbox;
    let litems, ritems;

    const splitPoint = bbox.min.add(bbox.size.mul(0.5));

    if (bbox.size.x > bbox.size.y && bbox.size.x > bbox.size.z) {
      lbox = new Tarumae.BoundingBox(bbox.min, new Vec3(splitPoint.x, bbox.max.y, bbox.max.z));
      rbox = new Tarumae.BoundingBox(new Vec3(splitPoint.x, bbox.min.y, bbox.min.z), bbox.max);
    } else if (bbox.size.y > bbox.size.x && bbox.size.y > bbox.size.z) {
      lbox = new Tarumae.BoundingBox(bbox.min, new Vec3(bbox.max.x, splitPoint.y, bbox.max.z));
      rbox = new Tarumae.BoundingBox(new Vec3(bbox.min.x, splitPoint.y, bbox.min.z), bbox.max);
    } else {
      lbox = new Tarumae.BoundingBox(bbox.min, new Vec3(bbox.max.x, bbox.max.y, splitPoint.z));
      rbox = new Tarumae.BoundingBox(new Vec3(bbox.min.x, bbox.min.y, splitPoint.z), bbox.max);
    }

    for (let i = 0; i < itemCount; i++/*, pitem++*/) {
      const item = items[i];
      const _bbox = item.bbox;

      if (lbox.containsBox(_bbox)) {
        litems.push(item);
      } else if (rbox.containsBox(_bbox)) {
        ritems.push(item);
      } else {
        this.items.push(item);
      }
    }

    if (litems.length > 0) {
      left = new KDNode();
      left.build(litems.data(), depth + 1);
      this.left = left;
    }

    if (ritems.size() > 0) {
      right = new KDNode();
      right.build(ritems.data(), depth + 1);
      this.right = right;
    }

    if (this.items.size() > 0) {
      bbox = boundingBoxFromItems(this.items.data(), this.items.size());

      if (left != NULL) bbox.expandToBox(left.bbox);
      if (right != NULL) bbox.expandToBox(right.bbox);

      this.bbox = bbox;
    } else {
      if (left != NULL && right == NULL) {
        this.bbox = left.bbox;
      } else if (left == NULL && right != NULL) {
        this.bbox = right.bbox;
      } else {
        this.bbox = new Tarumae.BoundingBox(left.bbox.min, right.bbox.max);
      }
    }
  }

  iterate(ray, iterator) {
    for (let t = 0; t < this.items.length; t++) {
      const res = iterator(t);
      if (!res) return false;
    }

    if (this.left != NULL && this.left.bbox.intersectsRay(ray)) {
      const res = this.left.iterate(ray, iterator);
      if (!res) return false;
    }

    if (this.right != NULL && this.right.bbox.intersectsRay(ray)) {
      const res = this.right.iterate(ray, iterator);
      if (!res) return false;
    }

    return true;
  }
};
