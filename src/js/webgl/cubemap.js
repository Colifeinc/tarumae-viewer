////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"
import { Vec2 } from "../math/vector";

Tarumae.CubeMap = class {
  constructor(renderer, images) {
    this.glTexture = null;
    this.enableMipmap = true;
    this.mipmapped = false;
    this.loaded = false;

    if (renderer) {
      this.renderer = renderer;
      this.gl = renderer.gl;
    }

    if (Array.isArray(images)) {
      this.images = images;
    } else {
      this.images = [];
    }
  } 
   
  getLoadingFaces() {
    const gl = this.gl;

    if (!Tarumae.CubeMap.LoadingFaces) {
      Tarumae.CubeMap.LoadingFaces = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      ];
    }
  
    return Tarumae.CubeMap.LoadingFaces;
  }

  create(width, height, defaultData) {
    if (!this.renderer) {
      throw "renderer must be specified before create empty cubemap";
    }

    this.width = width;
    this.height = height;

    this.use();
    
    const gl = this.gl;
    const faces = this.getLoadingFaces();

    this.setParameters();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    
    for (let i = 0; i < faces.length; i++) {
      gl.texImage2D(faces[i], 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, defaultData);
    }

    this.disuse();
  }

  createEmpty() {
    this.create(1, 1, new Uint8Array([255, 255, 255, 255]));
    // this.create(1, 1, new Uint8Array([0, 0, 0, 0]));
  }

  setParameters() {
    const gl = this.gl;

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (this.mipmappable) {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  setFaceImage(face, image) {
    this.use();

    const gl = this.gl;
    const faces = this.getLoadingFaces();
  
    gl.texImage2D(faces[face], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (this.mipmappable) {
      this.mipmappable = Tarumae.Utility.isPowerOf2(image.width)
        && Tarumae.Utility.isPowerOf2(image.height);
    }
  
    this.setParameters();
  
    this.disuse();
  }

  setImages(images) {
    if (!Array.isArray(images)) {
      throw "missing arguments: images";
    }

    this.images = images;

    this.bindTextures();
  }

  bind(renderer) {
    if (renderer) {
      this.renderer = renderer;
      this.gl = renderer.gl;
    }  

    this.glTexture = this.gl.createTexture()
    
    if (this.renderer && this.renderer.debugger) {
      this.renderer.debugger.totalNumberOfTexturesUsed += 6;
    }

    if (this.images.length > 6) {
      this.bindTextures(this.images);
    }
  }

  unbind() {
    if (this.glTexture) {
      this.gl.deleteTexture(this.glTexture);
      this.glTexture = null;

      if (this.renderer && this.renderer.debugger) {
        this.renderer.debugger.totalNumberOfTexturesUsed -= 6;
      }
    }
  }

  bindTextures() {
    this.use();

    if (!this.glTexture) {
      throw "cubemap must be bound before set texture images";
    }

    const gl = this.gl;
    const faces = [
      gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    ];

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    this.mipmappable = this.enableMipmap;
    this.mipmapped = false;

    for (var i = 0; i < faces.length; i++) {
      const image = this.images[i];
      gl.texImage2D(faces[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      if (this.mipmappable) {
        this.mipmappable = Tarumae.Utility.isPowerOf2(image.width) && Tarumae.Utility.isPowerOf2(image.height);
      }
    }
  
    this.setParameters();
  
    if (this.mipmappable) {
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      this.mipmapped = true;
    }

    this.disuse();

    this.loaded = true;
  }

  setRawData(stream) {
    this.use();

    if (!this.glTexture) {
      throw "cubemap must be bound before set raw data";
    }

    var header = new Int32Array(stream);
    var tag = header[0];

    if (tag !== 0x70616d72) {
      throw "illegal raw data format";
    }

    var headerLen = header[1];
    var res = header[3];
    const resX = res >> 16, resY = res & 0xffff;

    const bboxBuffer = new Float32Array(stream, 16, 24);
    this.bbox = new Tarumae.BoundingBox(bboxBuffer[0], bboxBuffer[1], bboxBuffer[2],
      bboxBuffer[3], bboxBuffer[4], bboxBuffer[5]);

    var faceDataLen = resX * resY * 3;

    var gl = this.gl;
    var faces = this.getLoadingFaces();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    this.mipmappable = this.enableMipmap && Tarumae.Utility.isPowerOf2(resX) && Tarumae.Utility.isPowerOf2(resY);

    for (var i = 0; i < faces.length; i++) {
      gl.texImage2D(faces[i], 0, gl.RGB, resX, resY, 0, gl.RGB, gl.UNSIGNED_BYTE,
        new Uint8Array(stream, (headerLen) + faceDataLen * i));
    }
  
    this.setParameters();
  
    if (this.mipmappable) {
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      this.mipmapped = true;
    }

    this.disuse();

    this.loaded = true;
  }
 
  use(renderer) {
    if (this.glTexture === null) {
      this.bind(renderer);
    }
    
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.glTexture);
  }

  disuse() {
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
  }
};
 
Tarumae.CubeMap.LoadingFaces = null;

Tarumae.CubeMap.Faces = {
  Right: 0,  //+x
  Left: 1,   //-x
  Top: 2,    //+y
  Bottom: 3, //-y
  Front: 4,  //+z
  Back: 5,   //-z
};

/////////////////// ImageCubeBox ///////////////////

Tarumae.ImageCubeBox = class {
  constructor(renderer, imageUrls) {
    if (!renderer) {
      throw new Error("renderer cannot be null or undefined");
    }

    this.renderer = renderer;

    if (Array.isArray(imageUrls)) {
      this.createFromImageUrls(renderer, imageUrls);
    }
  }

  createFromImageUrls(renderer, imageUrls) {
    if (!Array.isArray(imageUrls) || imageUrls.length < 6) {
      console.warn("ImageCubeBox: not enough number of images to create cubebox, need six image URLs.");
      return;
    }

    this.cubemap = new Tarumae.CubeMap(renderer);
  
    var rm = new Tarumae.ResourceManager();

    rm.add([
      imageUrls[0], Tarumae.ResourceTypes.Image,
      imageUrls[1], Tarumae.ResourceTypes.Image,
      imageUrls[2], Tarumae.ResourceTypes.Image,
      imageUrls[3], Tarumae.ResourceTypes.Image,
      imageUrls[4], Tarumae.ResourceTypes.Image,
      imageUrls[5], Tarumae.ResourceTypes.Image,
    ]);

    rm.load(() => {
      this.cubemap.setImages([
        rm.get(imageUrls[0]),
        rm.get(imageUrls[1]),
        rm.get(imageUrls[2]),
        rm.get(imageUrls[3]),
        rm.get(imageUrls[4]),
        rm.get(imageUrls[5]),
      ]);
  
      this.onload();
    });
  }
};

new Tarumae.EventDispatcher(Tarumae.ImageCubeBox).registerEvents("load");

/////////////////// SkyBox ///////////////////

Tarumae.SkyBox = class extends Tarumae.ImageCubeBox {
  constructor(renderer, imageUrls) {
    super(renderer, imageUrls);
    this.size = { width: 1000, height: 1000 };
  }

  render() {

  }
};
