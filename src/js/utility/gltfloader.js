////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry";
import { Vec3, Matrix4, BoundingBox3D } from "@jingwood/graphics-math";
import { Quaternion } from "@jingwood/graphics-math";

function uriToBuffer(string) {
  // var regex = /^data:.+\/(.+);base64,(.*)$/;

  // const matches = string.match(regex);
  // const type1 = matches[0];
  // const type2 = matches[1];
  // const data = matches[2];

  const head = 'data:application/octet-stream;base64,';
  if (string.startsWith(head)) {
    const data = string.substr(head.length);
    const buffer = _base64ToArrayBuffer(data);
    return buffer;
  }
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

  switch (accessor.type) {
    case 'VEC3':
      return new Float32Array(buffer._data, accessor.byteOffset ?? 0 + bufferView.byteOffset ?? 0, accessor.count * 3);
     
    case 'VEC4':
      return new Float32Array(buffer._data, accessor.byteOffset ?? 0 + bufferView.byteOffset ?? 0, accessor.count * 4);
      
    default:
    case 'SCALAR':
      switch (accessor.componentType) {
        default:
        case 5123:
          return new Uint16Array(buffer._data, accessor.byteOffset ?? 0 + bufferView.byteOffset ?? 0, accessor.count);
      }
  }
}

function loadMesh(json, gltfMesh) {
  const meshPrimitives = gltfMesh.primitives[0];
 
  const vertexBufferAccessor = json.accessors[meshPrimitives.attributes.POSITION];
  const normalBufferAccessor = json.accessors[meshPrimitives.attributes.NORMAL];
  
  const jointBufferAccessor = json.accessors[meshPrimitives.attributes.JOINTS_0];
  const jointWeightsBufferAccessor = json.accessors[meshPrimitives.attributes.WEIGHTS_0];
  const indicesBufferAccessor = json.accessors[meshPrimitives.indices];

  const mesh = new Tarumae.Mesh();
  mesh.vertexBuffer = getBufferArray(json, vertexBufferAccessor);
  mesh.indexBuffer = getBufferArray(json, indicesBufferAccessor);
  
  mesh.indexed = true;
  mesh.meta = {
    vertexCount: vertexBufferAccessor.count,
    indexCount: indicesBufferAccessor.count,
    stride: 0,
  };
  // mesh.composeMode = Tarumae.Mesh.ComposeModes.TriangleStrip;

  if (normalBufferAccessor) {
    mesh.meta.normalOffset = json.bufferViews[normalBufferAccessor.bufferView].byteOffset;
    mesh.meta.normalStride = json.bufferViews[normalBufferAccessor.bufferView].byteStride ?? 0;
    mesh.meta.normalCount = normalBufferAccessor.count;
  }

  if (jointBufferAccessor) {
    mesh.jointBuffer = getBufferArray(json, jointBufferAccessor);
    mesh.meta.jointStride = json.bufferViews[jointBufferAccessor.bufferView].byteStride ?? 0;
  }

  if (jointWeightsBufferAccessor) {
    mesh.jointWeightsBuffer = getBufferArray(json, jointWeightsBufferAccessor);
    mesh.meta.jointWeightsStride = json.bufferViews[jointWeightsBufferAccessor.bufferView].byteStride ?? 0;
  }

  // debug
  mesh._gltfMesh = gltfMesh;

  return mesh;
}

function loadNode(json, node) {
  const obj = new Tarumae.SceneObject();

  if (!isNaN(node.mesh)) {
    const gltfMesh = json.meshes[node.mesh];
    const mesh = loadMesh(json, gltfMesh);
    obj.meshes.push(mesh);
  }

  if (Array.isArray(node.children)) {
    for (const childIndex of node.children) {
      const child = loadNode(json, json.nodes[childIndex]);
      if (child) {
        obj.add(child);
      }
    }
  }

  if (node.translation) {
    obj.location.set(node.translation);
  }

  if (node.rotation) {
    obj._quaternion = new Quaternion(node.rotation[0], node.rotation[1],
      node.rotation[2], node.rotation[3]);
  }

  return obj;
}

Tarumae.GLTFLoader = {
  loadFromJSONObject(json) {

    const root = new Tarumae.SceneObject();
    root.mat = {};

    for (const scene of json.scenes) {
      for (const nodeIndex of scene.nodes) {
        const node = json.nodes[nodeIndex];
        const obj = loadNode(json, node);
        if (obj) {
          root.add(obj);
        }
      }
    }

    return root;
  }
};