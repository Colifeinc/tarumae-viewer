////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec3, BoundingBox3D } from "@jingwood/graphics-math";

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
      matches[7], matches[8], matches[9]].map(e => Number.parseInt(e)));
  }
  else if ((matches = line.match(/^f\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)/))) {
    s.faces.push([matches[1], 0, matches[2], matches[3], 0, matches[4], 
      matches[5], 0, matches[6]].map(e => Number.parseInt(e)));
  }
}

function addVector(arr, x, y, z) {
  arr.push({ x: Number.parseFloat(x), y: Number.parseFloat(y), z: Number.parseFloat(z) });
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

  if (s.vertices.length <= 0) {
    throw Error("no vertex found from obj format.");
  }

  const bbox = new BoundingBox3D(s.vertices[0], s.vertices[0]);

  for (const v of s.vertices) {
    bbox.expandTo(v);
  }

  for (let i = 0; i < s.vertices.length; i++) {
    s.vertices[i] = Vec3.sub(s.vertices[i], bbox.origin);
  }

  for (const face of s.faces) {
    const v1 = s.vertices[face[0]-1], v2 = s.vertices[face[3]-1], v3 = s.vertices[face[6]-1];
    s.vertexBuffer.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
  }

  for (const face of s.faces) {
    const i1 = face[2]-1, i2 = face[5]-1, i3 = face[8]-1;
    const v1 = s.normals[face[2]-1], v2 = s.normals[face[5]-1], v3 = s.normals[face[8]-1];
    s.vertexBuffer.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
  }

  const obj = new Tarumae.SceneObject();
  obj.mat = {};

  const mesh = new Tarumae.Mesh();
  mesh.vertexBuffer = new Float32Array(s.vertexBuffer);
  mesh.meta = {
    vertexCount: s.faces.length * 3,
    normalCount: s.faces.length * 3,
  };

  obj.meshes.push(mesh);
  
  return obj;
};
  