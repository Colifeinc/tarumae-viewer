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

function concatFloat32Array(first, second) {
  let result = new Float32Array(first.length + second.length);

  result.set(first);
  result.set(second, first.length);

  return result;
}

Tarumae.GLTFLoader = class {
  constructor() {
  }

  getBufferArray(accessor) {    
    const { json } = this.session;

    if (!Array.isArray(json.buffers)) return;

    const bufferView = json.bufferViews[accessor.bufferView];

    let buffer = bufferView._buffer;

    if (!buffer) {
      if (bufferView.buffer < 0 || bufferView.buffer >= json.buffers.length) {
        return;
      }

      buffer = json.buffers[bufferView.buffer];
      bufferView._buffer = buffer;
    }

    if (!buffer._data) {
      buffer._data = uriToBuffer(buffer.uri);
    }

    switch (accessor.type) {
      case 'VEC2':
        return new Float32Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count * 2);
     
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
            return new Uint8Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count || bufferView.byteLength);
        
          case 5123:
            return new Uint16Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count);
        
          case 5126:
            return new Float32Array(buffer._data, (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0), accessor.count);
        }
    }
  }


  loadTexture(sourceId) {
    const { json } = this.session;
   
    const imageEntry = json.images[sourceId];
    if (imageEntry._tex) {
      return imageEntry._tex;
    }
  
    const imgData = this.getBufferArray(imageEntry);
        
    const blob = new Blob([imgData], { type: "image/png" });

    const tex = new Tarumae.Texture();
    tex.isLoading = true;

    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = _ => {
      tex.image = img;
      tex.isLoading = false;
      _scene.requireUpdateFrame();
    };

    imageEntry._tex = tex;
    return tex;
  }

  loadMaterial(id) {
    const { json, loadedMats } = this.session;

    let mat = loadedMats[id];
    if (mat) return mat;

    mat = new Tarumae.Material();
    loadedMats[id] = mat;

    const matjson = json.materials[id];
    if (matjson.pbrMetallicRoughness) {
      const matrgh = matjson.pbrMetallicRoughness;

      if (matrgh.baseColorTexture && !isNaN(matrgh.baseColorTexture.index)) {
        if (Array.isArray(json.textures)
          && matrgh.baseColorTexture.index >= 0
          && matrgh.baseColorTexture.index < json.textures.length) {
          const sourceEntry = json.textures[matrgh.baseColorTexture.index];
          if (!isNaN(sourceEntry.source)) {
            mat.tex = this.loadTexture(sourceEntry.source);
          }
        }
      }
    }

    return mat;
  }

  loadMesh(gltfMesh) {
    const { json } = this.session;

    if (!Array.isArray(json.accessors)) {
      return;
    }

    const meshPrimitives = gltfMesh.primitives[0];
 
    const vertexBufferAccessor = json.accessors[meshPrimitives.attributes.POSITION];
    const normalBufferAccessor = json.accessors[meshPrimitives.attributes.NORMAL];
    const texcoord0BufferAccessor = json.accessors[meshPrimitives.attributes.TEXCOORD_0];
  
    const jointBufferAccessor = json.accessors[meshPrimitives.attributes.JOINTS_0];
    const jointWeightsBufferAccessor = json.accessors[meshPrimitives.attributes.WEIGHTS_0];
    const indicesBufferAccessor = json.accessors[meshPrimitives.indices];

    const mesh = new Tarumae.Mesh();
    mesh.vertexBuffer = this.getBufferArray(vertexBufferAccessor);
    mesh.indexBuffer = this.getBufferArray(indicesBufferAccessor);
  
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

      if (mesh.vertexBuffer) {
        mesh.vertexBuffer = concatFloat32Array(mesh.vertexBuffer, this.getBufferArray(normalBufferAccessor));
      } else {
        mesh.vertexBuffer = normalBufferAccessor;
      }
    }

    if (texcoord0BufferAccessor) {
      const _tex0Buffer = this.getBufferArray(texcoord0BufferAccessor);

      if (_tex0Buffer) {
        mesh.meta.texcoordOffset = json.bufferViews[texcoord0BufferAccessor.bufferView].byteOffset;
        mesh.meta.texcoordStride = json.bufferViews[texcoord0BufferAccessor.bufferView].byteStride ?? 0;
        mesh.meta.texcoordCount = texcoord0BufferAccessor.count;

        if (mesh.vertexBuffer) {
          mesh.vertexBuffer = concatFloat32Array(mesh.vertexBuffer, _tex0Buffer);
        } else {
          mesh.vertexBuffer = texcoord0BufferAccessor;
        }
      }
    }

    if (jointBufferAccessor) {
      mesh.jointBuffer = this.getBufferArray(jointBufferAccessor);
      mesh.meta.jointStride = json.bufferViews[jointBufferAccessor.bufferView].byteStride ?? 0;
    }

    if (jointWeightsBufferAccessor) {
      mesh.jointWeightsBuffer = this.getBufferArray(jointWeightsBufferAccessor);
      mesh.meta.jointWeightsStride = json.bufferViews[jointWeightsBufferAccessor.bufferView].byteStride ?? 0;
    }

    // material
    if (!isNaN(meshPrimitives.material)) {
      mesh.mat = this.loadMaterial(meshPrimitives.material);
    }

    // FIXME: debug
    mesh._gltfMesh = gltfMesh;

    if (!mesh.vertexBuffer || mesh.vertexBuffer.length <= 0) {
      console.warn("mesh loaded from gltf doesn't contain vertex buffer");
    }

    return mesh;
  }

  loadSkin(skin) {
    const { json } = this.session;

    // let skinInfo = this.session.loadedSkins[skinId];
    // if (skinInfo) return skinInfo;

    const skinInfo = {
      joints: [],
      rootJoints: [],
      inverseMatrices: [],
    };
    
    if (Array.isArray(json.accessors)
      && skin.inverseBindMatrices >= 0 && skin.inverseBindMatrices < json.accessors.length) {
      const _im = this.getBufferArray(json.accessors[skin.inverseBindMatrices]);
  
      for (let i = 0; i < _im.length; i += 16) {
        const mat2 = new Matrix4();
        mat2.a1 = _im[i + 0]; mat2.b1 = _im[i + 1]; mat2.c1 = _im[i + 2]; mat2.d1 = _im[i + 3];
        mat2.a2 = _im[i + 4]; mat2.b2 = _im[i + 5]; mat2.c2 = _im[i + 6]; mat2.d2 = _im[i + 7];
        mat2.a3 = _im[i + 8]; mat2.b3 = _im[i + 9]; mat2.c3 = _im[i + 10]; mat2.d3 = _im[i + 11];
        mat2.a4 = _im[i + 12]; mat2.b4 = _im[i + 13]; mat2.c4 = _im[i + 14]; mat2.d4 = _im[i + 15];
        // mat2.transpose();
        skinInfo.inverseMatrices.push(mat2);
      }
    }

    if (Array.isArray(skin.joints)) {
      for (const jointId of skin.joints) {
        if (this.session.loadedJoints.hasOwnProperty(jointId)) {
          const jointObj = this.session.loadedJoints[jointId];
          skinInfo.joints.push(jointObj);
        }
      }
    }

    // find root joints
    for (const jointObj of skinInfo.joints) {
      let obj = jointObj;
      while (obj.parent) obj = obj.parent;
      if (!skinInfo.rootJoints.some(_j => _j === obj)) {
        skinInfo.rootJoints.push(obj);
      }
    }

    return skinInfo;
  }

  isJointNode(id) {
    const { json } = this.session;

    if (Array.isArray(json.skins)) {
      for (const skin of json.skins) {
        if (Array.isArray(skin.joints)) {
          if (skin.joints.includes(id)) return true;
        }
      }
    }

    return false;
  }

  loadNode(nodeId) {
    const { json } = this.session;
    const node = json.nodes[nodeId];
    const objTypeStack = this.session.objTypeStack;

    // const objType = objTypeStack[objTypeStack.length - 1];
    let objType;

    if (this.isJointNode(nodeId)) {
      objType = Tarumae.JointObject;
    } else {
      objType = Tarumae.SceneObject;
    }

    const obj = new objType();

    obj.name = node.name;
    obj._nodeId = nodeId;

    if (objType === Tarumae.JointObject) {
      this.session.loadedJoints[nodeId] = obj;
    }

    if (Array.isArray(json.meshes) && !isNaN(node.mesh)
      && node.mesh >= 0 && node.mesh < json.meshes.length) {
      const gltfMesh = json.meshes[node.mesh];
      const mesh = this.loadMesh(gltfMesh);
      obj.meshes.push(mesh);
    }

    if (Array.isArray(node.children)) {
      for (const childId of node.children) {
        const child = this.loadNode(childId);
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
      obj.angle.set(obj._quaternion.toMatrix().extractEulerAngles());
      obj.rotationType = 'q';
    }

    if (!isNaN(node.skin)) {
      this.session.skinnedObjects.push({ obj, skinId: node.skin });
    }

    if (obj.meshes[0] && obj.meshes[0].mat) {
      obj.mat = obj.meshes[0].mat;
    }

    return obj;
  }

  reset() {
    this.session = {
      skinJointMats: {},
      loadedSkins: [],
      loadedJoints: {},
      loadedMats: {},
      objTypeStack: [Tarumae.SceneObject],
      skinnedObjects: [],
    };
  }

  loadFromUrl(url, callback) {
    const pathSplit = url.lastIndexOf('/');
    if (pathSplit >= 0) {
      this.basePath = url.substr(0, pathSplit);
    }

    Tarumae.ResourceManager.download(url, Tarumae.ResourceTypes.JSON, json => {
      this.load(json, obj => callback(obj));
    });
  }

  load(json, callback) {
    this.reset();
    this.session.json = json;

    if (Array.isArray(json.buffers)
      && json.buffers.some(_b => _b.uri && !_b.uri.startsWith('data:application/'))) {
      const rm = new Tarumae.ResourceManager();

      for (const buffer of json.buffers) {
        if (buffer.uri.startsWith('data:application/')) {
          continue;
        }

        let path;

        if ((buffer.uri.indexOf('//') < 0 || !buffer.uri.startsWith('/'))
          && this.basePath) {
          path = this.basePath.concat('/').concat(buffer.uri);
        } else {
          path = buffer.uri;
        }

        rm.add(path, Tarumae.ResourceTypes.Binary, _data => {
          buffer._data = _data
        });
      }

      rm.load(_ => callback(this.loadJson(json)));
    } else {
      callback(this.loadJson(json));
    }
  }

  loadJson(json) {

    const root = new Tarumae.SceneObject();
    root.mat = {};

    for (const scene of json.scenes) {
      for (const nodeId of scene.nodes) {
        const obj = this.loadNode(nodeId);
        if (obj) {
          root.add(obj);
        }
      }
    }

    if (Array.isArray(json.skins)) {
      for (const skin of json.skins) {
        this.session.loadedSkins.push(this.loadSkin(skin));
      }
    }

    for (const { obj, skinId } of this.session.skinnedObjects) {
      obj.skin = this.session.loadedSkins[skinId];
    }

    return root;
  }
    
};