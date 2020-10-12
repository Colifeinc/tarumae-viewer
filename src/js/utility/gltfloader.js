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
  // const regex = /^data:.+\/(.+);base64,(.*)/;

  // const matches = string.match(regex);
  // if (matches.length > 2) {
  //   // const type = matches[1];
  //   const data = matches[2];

  //   const buffer = _base64ToArrayBuffer(data);
  //   return buffer;
  // }
  if (string.startsWith('data:')) {
    const s = string.indexOf(';base64,');
    if (s > 0) {
      const data = string.substr(s + 8);
      return _base64ToArrayBuffer(data);
    }
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
      return new Float32Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count * 3);
     
    case 'VEC4':
      return new Float32Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count * 4);
      
    case 'MAT4':
      return new Float32Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count * 16);

    default:
    case 'SCALAR':
      switch (accessor.componentType) {
        default:
        case 5123:
          return new Uint16Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count);
        
        case 5126:
          return new Float32Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count);

      }
  }
}

function concatFloat32Array(first, second) {
    let result = new Float32Array(first.length + second.length);

    result.set(first);
    result.set(second, first.length);

    return result;
}

function loadTexture(json, id) {
}

function loadMaterial(session, id) {
  const { loadedMats } = session;

  let mat = loadedMats[id];
  if (mat) return mat;

  mat = new Tarumae.Material();
  session.loadedMats[id] = mat;

  const matjson = session.json.materials[id];
  if (matjson.pbrMetallicRoughness) {
  }
}

function loadMesh(session, gltfMesh) {
  const { json } = session;

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
    mesh.vertexBuffer = concatFloat32Array(mesh.vertexBuffer, getBufferArray(json, normalBufferAccessor));
  }

  if (jointBufferAccessor) {
    mesh.jointBuffer = getBufferArray(json, jointBufferAccessor);
    mesh.meta.jointStride = json.bufferViews[jointBufferAccessor.bufferView].byteStride ?? 0;
  }

  if (jointWeightsBufferAccessor) {
    mesh.jointWeightsBuffer = getBufferArray(json, jointWeightsBufferAccessor);
    mesh.meta.jointWeightsStride = json.bufferViews[jointWeightsBufferAccessor.bufferView].byteStride ?? 0;
  }

  if (!isNaN(meshPrimitives.material)) {
    mesh.mat = loadMaterial(session, meshPrimitives.material);
  }

  // FIXME: debug
  mesh._gltfMesh = gltfMesh;

  console.assert(mesh.vertexBuffer.length > 0);

  return mesh;
}

function loadJoints(session, id) {
  const { skinJointMats, json } = session;
    
  let jointMats = skinJointMats[id];

  if (!jointMats) {
    const inverseMatsBuffer = getBufferArray(json, json.accessors[json.skins[id].inverseBindMatrices]);
    const _im = inverseMatsBuffer;
    let mat2 = new Matrix4();
    let lastMat = new Matrix4().loadIdentity();
  
    jointMats = [];
    skinJointMats[id] = jointMats;

    let i = 0;
    const jointIndices = json.skins[id].joints;
    for (let jointIndex of jointIndices) {
      const joint = json.nodes[jointIndex];

      let mat;

      if (joint.rotation) {
        mat = new Quaternion(joint.rotation[0], joint.rotation[1],
          joint.rotation[2], joint.rotation[3]).toMatrix();
      } else {
        mat = new Matrix4().loadIdentity();
      }
      
      // if (joint.translation) {
      //   mat.translate(joint.translation[0], joint.translation[1], joint.translation[2]);
      // }

      mat2.a1 = _im[i + 0]; mat2.b1 = _im[i + 1]; mat2.c1 = _im[i + 2]; mat2.d1 = _im[i + 3];
      mat2.a2 = _im[i + 4]; mat2.b2 = _im[i + 5]; mat2.c2 = _im[i + 6]; mat2.d2 = _im[i + 7];
      mat2.a3 = _im[i + 8]; mat2.b3 = _im[i + 9]; mat2.c3 = _im[i + 10]; mat2.d3 = _im[i + 11];
      mat2.a4 = _im[i + 12]; mat2.b4 = _im[i + 13]; mat2.c4 = _im[i + 14]; mat2.d4 = _im[i + 15];
      //mat.transpose();
      i += 16;
      // mat = mat.mul(mat2);

      // mat = mat.mul(lastMat);
      // lastMat.copyFrom(mat);

      console.assert(!isNaN(mat.a1) && !isNaN(mat.b1) && !isNaN(mat.c1) && !isNaN(mat.d1));
      console.assert(!isNaN(mat.a2) && !isNaN(mat.b2) && !isNaN(mat.c2) && !isNaN(mat.d2));
      console.assert(!isNaN(mat.a3) && !isNaN(mat.b3) && !isNaN(mat.c3) && !isNaN(mat.d3));
      console.assert(!isNaN(mat.a4) && !isNaN(mat.b4) && !isNaN(mat.c4) && !isNaN(mat.d4));

      jointMats.push(mat);
    }
  }

  return jointMats;
}

function loadNode(session, node) {
  const { json } = session;

  const obj = new Tarumae.SceneObject();

  obj.name = node.name;

  if (!isNaN(node.mesh)) {
    const gltfMesh = json.meshes[node.mesh];
    const mesh = loadMesh(session, gltfMesh);
    obj.meshes.push(mesh);
  }

  if (Array.isArray(node.children)) {
    for (const childIndex of node.children) {
      const child = loadNode(session, json.nodes[childIndex]);
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

  if (!isNaN(node.skin)) {
    obj._jointMats = loadJoints(session, node.skin);
  }

  if (obj.meshes[0] && obj.meshes[0].mat) {
    obj.mat = obj.meshes[0].mat;
  }

  return obj;
}


Tarumae.GLTFLoader = {
  loadFromJSONObject(json) {
    const session = {
      json,
      skinJointMats: {},
      loadedMats: {}
    };

    const root = new Tarumae.SceneObject();
    root.mat = {};

    for (const scene of json.scenes) {
      for (const nodeIndex of scene.nodes) {
        const node = json.nodes[nodeIndex];
        const obj = loadNode(session, node);
        if (obj) {
          root.add(obj);
        }
      }
    }

    return root;
  }
};