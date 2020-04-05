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

  if ((matches = line.match(/^v\s+([\-\d\.]+)\s+([\-\d\.]+)\s+([\-\d\.]+)/))) {
    addVector(s.vertices, matches[1], matches[2], matches[3]);
  }
  else if ((matches = line.match(/^vn\s+([\-\d\.]+)\s+([\-\d\.]+)\s+([\-\d\.]+)/))) {
    addVector(s.normals, matches[1], matches[2], matches[3]);
  }
  else if ((matches = line.match(/^f\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)/))) {
    s.faces.push([matches[1], matches[2], matches[3],
      matches[4], matches[5], matches[6],
      matches[7], matches[8], matches[9]].map(e => new Number(e)));
  }
}

function addVector(arr, x, y, z) {
  arr.push({ x: new Number(x), y: new Number(y), z: new Number(z) });
}

Tarumae.loadObjFormat = function(text) {
  const s = {
    vertices: [],
    normals: [],
    texcoords: [],
    faces: [],
    vertexBuffer: [],
  };

  const arrayOfLines = text.match(/[^\r\n]+/g);
  for (const line of arrayOfLines) {
    readLine(s, line);
  }

  console.log(s.vertices.length);

  for (const face of s.faces) {
    console.log(face[0], face[3], face[6]);
    const v1 = s.vertices[face[0]-1], v2 = s.vertices[face[3]-1], v3 = s.vertices[face[6]-1];
    s.vertexBuffer.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
  }

  console.log(s.faces.length);
  console.log(s.vertexBuffer.length);

  const obj = new Tarumae.SceneObject();
  obj.mat = {};

  const mesh = new Tarumae.Mesh();
  mesh.vertexBuffer = s.vertexBuffer;
  mesh.meta = {
    vertexCount: s.faces.length,
  };

  obj.meshes.push(mesh);
  
  return obj;
};
  