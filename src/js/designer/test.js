import { WallNode, WallLine } from "./wall";
import { Vec2 } from "../math/vector";
import { LayoutGenerator } from "./autolayout";

let de = null;

function _create_test_room_(designer) {
  de = designer;

  const n1 = newNode(200, 200);
  const n2 = newNode(1200, 200);
  const n3 = newNode(1200, 500);
  const n4 = newNode(200, 500);

  newRoom(n1, n2, n3, n4);

  de.scanRooms();

  // const area1 = de.findArea([n1, n2, n3, n4]);
  // if (area1) {
  //   this.layoutGenerator.autoLayout(area1);
  // }
}

function newNode(x, y) {
  const node = new WallNode(new Vec2(x, y));
  de.nodes.push(node);
  return node;
}

function newLine(n1, n2) {
  const line = new WallLine(n1, n2);
  line.update();
  de.lines.push(line);
  return line;
}

function newRoom() {
  if (arguments.length < 2) return;
  
  for (let i = 0; i < arguments.length - 1; i++) {
    newLine(arguments[i], arguments[i + 1]);
  }

  newLine(arguments[arguments.length - 1], arguments[0]);
}

export { _create_test_room_ };