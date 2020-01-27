////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

////////////////// Shader ///////////////////////

import Tarumae from "../entry";
import { Vec2, Vec3, Color3, Color4, Matrix4 } from "@jingwood/graphics-math";
import { BBox3D as BoundingBox } from "@jingwood/graphics-math";
import { MathFunctions } from "@jingwood/graphics-math";
import "../webgl/texture";

import "./program";
import "../shader/standard";
import "../shader/wireframe";
import "../shader/image";
import "../shader/screen";
import "../shader/solidcolor";
import "../shader/panorama";
import "../shader/point";
import "../shader/shadowmap";

Tarumae.Shaders.GrayscaleShader = class extends Tarumae.Shaders.ImageShader {
};

