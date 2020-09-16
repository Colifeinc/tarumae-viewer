////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec3, Matrix4, BoundingBox3D } from "@jingwood/graphics-math";

function uriToBuffer(string) {
  var regex = /^data:.+\/(.+);base64,(.*)$/;

  const matches = string.match(regex);
  const type1 = matches[0];
  const type2 = matches[1];
  const data = matches[2];
  const buffer = _base64ToArrayBuffer(data);
  return buffer;
}

function _base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = binary_string.charCodeAt(i);
  }
  return array.buffer;
}

function getBufferArray(json, accessor) {
  const bufferView = json.bufferViews[accessor.bufferView];

  let buffer = bufferView._buffer;

  if (!buffer) {
    buffer = json.buffers[bufferView.buffer];
    bufferView._buffer = buffer;
  }

  if (!buffer._data) {
    buffer._data = uriToBuffer(buffer.uri);
  }

  let bufferConstructor;

  switch (accessor.type) {
    case 'VEC3':
      return new Float32Array(buffer._data, bufferView.byteOffset, bufferView.byteLength / 4);
    
    default:
    case 'SCALAR':
      switch (accessor.componentType) {
        default:
          return bufferData;

        case 5123:
          return new Uint8Array(buffer._data, 0, 48);
      }
      
  }
}

Tarumae.GLTFLoader = {
  loadFromJSONObject(json) {

    var session = { buffers: [] };

    const meshPrimitives = json.meshes[0].primitives[0];

    const vertexBufferAccessor = json.accessors[meshPrimitives.attributes.POSITION];
    const indicesBufferAccessor = json.accessors[meshPrimitives.indices];

    const obj = new Tarumae.SceneObject();
    obj.mat = {};

    const mesh = new Tarumae.Mesh();
    mesh.vertexBuffer = getBufferArray(json, vertexBufferAccessor);
    mesh.indexBuffer = getBufferArray(json, indicesBufferAccessor);
    mesh.indexed = true;
    mesh.meta = {
      vertexCount: vertexBufferAccessor.count,
      indexCount: indicesBufferAccessor.count,
      //normalCount: s.faces.length * 3,
    };
    // mesh.composeMode = Tarumae.Mesh.ComposeModes.TriangleStrip;
  
    obj.meshes.push(mesh);

    return obj;
  }
};