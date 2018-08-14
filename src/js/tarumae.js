////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.work
//
// Copyright(c) 2018 BULB corp., all rights reserved
////////////////////////////////////////////////////////////////////////////////

import "babel-polyfill";

import Tarumae from "./entry";

import "./utility/archive.js";
import "./utility/debug.js";
import "./utility/event.js";
import "./utility/res.js";
import "./utility/stopwatch.js";
import "./utility/utility.js";
import "./math/functions.js";
import "./math/matrix.js";
import "./math/spacetree.js";
import "./math/vector.js";
import "./scene/animation.js";
import "./scene/camera.js";
import "./scene/material.js";
import "./scene/object.js";
import "./scene/renderer.js";
import "./scene/scene.js";
import "./scene/viewer.js";
import "./view/modelviewer.js";
import "./view/touchcontroller.js";
import "./view/fpscontroller.js";
import "./view/prologue.js";
import "./webgl/buffers.js";
import "./webgl/cubemap.js";
import "./webgl/mesh.js";
import "./webgl/shader.js";
import "./webgl/texture.js";

export default Tarumae;
export { Vec2, Vec3, Vec4, Color3, Color4 } from "./math/vector";
export { Matrix3, Matrix4 } from "./math/matrix";
