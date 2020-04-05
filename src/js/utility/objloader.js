////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec2 } from "@jingwood/graphics-math";

const triangleIndexPattern = "\d+\/\d+\/\d+";
const faceTrianglePattern = `^f\s+${ triangleIndexPattern }\s+`;

function readLine(s, line) {
  let matches;

  if ((matches = line.match(/^v\s+([\-\d\.]+)\s+([\-\d\.]+)\s+([\-\d\.]+)/ig))) {
    addIntoArr(s.vertices, matches[1], matches[2], matches[3]);
  }
  else if ((matches = line.match(/^vn\s+([\-\d\.]+)\s+([\-\d\.]+)\s+([\-\d\.]+)/ig))) {
    addIntoArr(s.normals, matches[1], matches[2], matches[3]);
  }
  else if ((matches = line.match(/^f\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)/ig))) {
    s.faces.push([matches[1], matches[2], matches[3],
      matches[4], matches[5], matches[6],
      matches[7], matches[8], matches[9]].map(e => new Number(e)));
  }
}

function addIntoArr(arr, x, y , z) {
  arr.push(new Number(x), new Number(y), new Number(z));
}

Tarumae.loadObjFormat = function(text) {
  const s = {
    vertices: [],
    normals: [],
    texcoords: [],
    faces:[],
  };

  const arrayOfLines = text.match(/[^\r\n]+/g);
  for (const line of arrayOfLines) {
    readLine(s, line);
  }

  console.log(s.vertices.length);
  console.log(s.normals.length);
  console.log(s.faces);

  const obj = new Tarumae.SceneObject();
  obj.mat = {};

  const mesh = new Tarumae.Mesh();
  obj.meshes.push(mesh);
  
  return obj;
};
  