////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

import Tarumae from "../entry"

Tarumae.CubeMap = function(renderer, images) {
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
};

Tarumae.CubeMap.prototype = {
  getLoadingFaces: function() {
    var gl = this.gl;

    if (Tarumae.CubeMap.LoadingFaces === null) {
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
  },

  createEmpty: function(width, height) {
    if (!this.renderer) {
      throw "renderer must be specified before create empty cubemap";
    }

    this.width = width;
    this.height = height;

    this.use();
    
    var gl = this.gl;

    var faces = this.getLoadingFaces();

    this.setParameters();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    
    for (var i = 0; i < faces.length; i++) {
      gl.texImage2D(faces[i], 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    this.disuse();
  },

  setParameters: function() {
    var gl = this.gl;

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (this.mipmappable) {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  },

  setFaceImage: function(face, image) {
    this.use();

    var gl = this.gl;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    var faces = this.getLoadingFaces();
  
    gl.texImage2D(faces[face], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (this.mipmappable) {
      this.mipmappable = Tarumae.Utility.isPowerOf2(image.width)
        && Tarumae.Utility.isPowerOf2(image.height);
    }
  
    this.setParameters();
  
    this.disuse();
  },

  setImages: function(images) {
    if (!Array.isArray(images)) {
      throw "missing arguments: images";
    }

    this.images = images;

    this.bindTextures();
  },

  bind: function(renderer) {
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
  },

  unbind: function() {
    if (this.glTexture) {
      this.gl.deleteTexture(this.glTexture);
      this.glTexture = null;

      if (this.renderer && this.renderer.debugger) {
        this.renderer.debugger.totalNumberOfTexturesUsed -= 6;
      }
    }
  },

  bindTextures: function() {
    this.use();

    if (!this.glTexture) {
      throw "cubemap must be bound before set texture images";
    }

    var gl = this.gl;

    var faces = this.getLoadingFaces();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    this.mipmappable = this.enableMipmap;
    this.mipmapped = false;

    for (var i = 0; i < faces.length; i++) {
      var image = this.images[i];
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
  },

  setRawData: function(stream) {
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
    var resX = res >> 16, resY = res & 0xffff;

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
  },
 
  use: function(renderer) {
    if (this.glTexture === null) {
      this.bind(renderer);
    }
    
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.glTexture);
  },

  disuse: function() {
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
  },
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

Tarumae.ImageCubeBox = function(renderer, imageUrls) {
  if (renderer && Array.isArray(imageUrls)) {
    this.createFromImageUrls(renderer, imageUrls);
  }
};

Tarumae.ImageCubeBox.createFromImageUrls = function(renderer, imageUrls) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 6) {
    console.warn("ImageCubeBox: not enough image URLs to create image cube box, need six image URLs.");
    return;
  }

  this.cubemap = new Tarumae.CubeMap(renderer);
  
  _this = this;

  var rm = new ResourceManager();

  rm.add([
    imageUrls[0], ResourceTypes.Image,
    imageUrls[1], ResourceTypes.Image,
    imageUrls[2], ResourceTypes.Image,
    imageUrls[3], ResourceTypes.Image,
    imageUrls[4], ResourceTypes.Image,
    imageUrls[5], ResourceTypes.Image,
  ]);

  rm.load(function() {
    _this.cubemap.bindTextures([
      rm.get(imageUrls[0]),
      rm.get(imageUrls[1]),
      rm.get(imageUrls[2]),
      rm.get(imageUrls[3]),
      rm.get(imageUrls[4]),
      rm.get(imageUrls[5]),
    ]);
  });

  Tarumae.Utility.invokeIfExist("onload");
}

/////////////////// SkyCube ///////////////////

Tarumae.SkyCube = function(renderer, imageUrls) {
  if (renderer && Array.isArray(imageUrls)) {
    this.createFromImageUrls(renderer, imageUrls);
  }
};

Tarumae.SkyCube.prototype = new Tarumae.ImageCubeBox();
