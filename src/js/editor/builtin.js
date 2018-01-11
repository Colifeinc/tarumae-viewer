////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

Tarumae = Tarumae || {};
Tarumae.Editor = {};

TarumaeEditor.BuiltinObjects = {
  "1": {
    "name": "Plane",
    "preview": "images/plane.png",
    "class": "Tarumae.Plane",
    "builtin": true
  },
  "2": {
    "name": "Cube",
    "preview": "images/cube.png",
    "class": "Tarumae.EditorCube",
    "builtin": true
  },
  "11": {
    "name": "Empty",
    "type": 11,
    "preview": "images/empty.png",
    "class": "Tarumae.EditorEmptyObject",
    "builtin": true
  },
  "15": {
    "type": 15,
    "name": "ReflectionRange",
    "preview": "images/roomRange.png",
    "class": "Tarumae.EditorRefRange",
    "builtin": true
  },
  "101": {
    "type": 201,
    "name": "Wall",
    "preview": "images/wall.png",
    "class": "Tarumae.EditorWall",
    "builtin": true,
    "object": { "mat": "DefaultCloth" }
  },
  "102": {
    "type": 202,
    "name": "Beam",
    "preview": "images/beam.png",
    "class": "Tarumae.EditorBeam",
    "builtin": true,
    "object": { "mat": "DefaultCloth" }
  },
  "107": {
    "type": 271,
    "name": "Floor",
    "preview": "images/plane.png",
    "class": "Tarumae.Plane",
    "builtin": true,
    "object": { "mat": "DefaultFloor" }
  },
  "801": {
    "type": 801,
    "name": "Camera",
    "preview": "images/camera.png",
    "class": "Tarumae.EditorCamera",
    "builtin": true
  },
  "901": {
    "type": 901,
    "name": "Point Light",
    "preview": "images/point-light.png",
    "class": "Tarumae.PointLight",
    "gizmoImage": "images/PointLight-32.png",
    "builtin": true,
    "object": {
      "mat": { "color": [1.0, 0.95, 0.9], "emission": 1.0 }
    }
  },
  "902": {
    "type": 902,
    "name": "Spot Light",
    "preview": "images/spot-light.png",
    "gizmoImage": "images/SpotLight-32.png",
    "class": "Tarumae.SpotLight",
    "builtin": true,
    "object": {
      "mat": { "color": [1.0, 0.9, 0.8], "emission": 1.0, "spotRange": 120 }
    }
  }
};