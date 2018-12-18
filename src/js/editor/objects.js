////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016-2017 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

//////////////// Editor Object ////////////////

_s3_Class("EditorObject", Tarumae.SceneObject, function() {
  this.super();
});

//////////////// Floor ////////////////

_s3_Class("EditorGround", Tarumae.EditorObject, function() {
  this.super();

  this.radiyBody = {
    type: "plane",
    vertices: [new Vec3(0, 0, -1000), new Vec3(-1000, 0, 1000), new Vec3(1000, 0, 1000)],
  };
});

//////////////// Floor ////////////////

_s3_Class("EditorFloor", Tarumae.EditorObject, function(width, height) {
  this.super();
  
  this.meshes.push(new Tarumae.Shapes.PlaneMesh(width, height));
});

//////////////// Wall ////////////////

// Wall
_s3_Class("EditorWall", Tarumae.EditorObject, function(width, height) {
  this.super();

  this.thickness = 0.05;

  if (typeof loc !== "undefined") {
    this.location = loc;
  }
  
  if (typeof angle !== "undefined") {
    this.angle = new Vec3(0, angle, 0);
  }

  if (typeof width !== "undefined") {
    this.width = width;
  } else {
    this.width = 4;
  }
  
  if (typeof height !== "undefined") {
    this.height = height;
  } else {
    this.height = 2.6;
  }

  this.create();
});

Tarumae.EditorWall.prototype.create = function() {
  var wall = this;

  this.activePoints = {
    left: {
      axies: "-x",
      get: function() {
        return new Vec3(-wall.width / 2, wall.height / 2, 0);
      },
      set: function(movement) {
        var mx = movement.x / 50;
        wall.width -= mx;
      
        var a = -wall.angle.y * Math.PI / 180;
        var c = Math.cos(a), s = Math.sin(a);

        var off = mx / 2;
        wall.location.x += off * c;
        wall.location.z += off * s;

        wall.updateChildren();
        wall.updateMesh();
      },
      object: wall,
    },
    right: {
      axies: "+x",
      get: function() {
        return new Vec3(wall.width / 2, wall.height / 2, 0);
      },
      set: function(movement) {
        var mx = movement.x / 50;
        wall.width += mx;

        var a = -wall.angle.y * Math.PI / 180;
        var c = Math.cos(a), s = Math.sin(a);

        var off = mx / 2;
        wall.location.x += off * c;
        wall.location.z += off * s;

        wall.updateChildren();
        wall.updateMesh();
      },
      object: wall,
    },
    back: {
      axies: "-z",
      get: function() {
        return new Vec3(0, wall.height / 2, -wall.thickness / 2);
      },
      set: function(movement) {
        var mx = movement.x / 50;
        
        if(wall.thickness - mx > 0){
          wall.thickness -= mx;
        }
        
        wall.updateChildren();
        wall.updateMesh();
      },
      object: wall,
    },
    front: {
      axies: "+z",
      get: function() {
        return new Vec3(0, wall.height / 2, wall.thickness / 2);
      },
      set: function(movement) {
        var mx = movement.x / 50;

        if(wall.thickness + mx > 0){
          wall.thickness += mx;
        }
        
        wall.updateChildren();
        wall.updateMesh();
      },
      object: wall,
    },
  };

  this.updateMesh();
};

Tarumae.EditorWall.prototype.updateChildren = function() {
  for (var i = 0; i < this.objects.length; i++) {
    var child = this.objects[i];

    if (child instanceof Tarumae.EditorBeam) {
      child.scale.x = this.width;
    }
  }
};

Tarumae.EditorWall.prototype.updateMesh = function() {
  for (var i = 0; i < this.meshes.length; i++) {
    var mesh = this.meshes[i];
    mesh.destroy();
  }

  this.meshes._s3_clear();

  this.generateMeshes();
};

Tarumae.EditorWall.prototype.generateMeshes = function() {
  
  this.doors = 0;
  this.windows = 0;

  var obj, i, k;

  for (k = 0; k < this.objects.length; k++) {
    obj = this.objects[k];

    switch (obj.typeId) {
      default:
        break;

      case Tarumae.ObjectTypes.Door:
        this.doors++;
        break;

      case Tarumae.ObjectTypes.Window:
        this.windows++;
        break;
    }
  }
  
  // plane indexes for generating vertex array
  var columns = new Array(2 + 2 * (this.doors + this.windows));

  var start = -this.width / 2;
  var end = this.width / 2;
  i = 0;

  columns[i++] = { x: start, y1: 0, y2: 0 };
  
  for (k = 0; k < this.objects.length; k++) {
    obj = this.objects[k];
  
    if (typeof obj.model === "object") {
      var modelDefine = obj.model;

      if (typeof modelDefine.clip === "object") {
        var clip = modelDefine.clip;
        var loc = obj.location;

        var bottom = (typeof clip.bottom !== "undefined") ? clip.bottom : 0;
        
        columns[i++] = { x: loc.x + clip.left, y1: loc.y + clip.top, y2: bottom };
        columns[i++] = { x: loc.x + clip.right, y1: loc.y + clip.top, y2: bottom };
      }
    }
  }

  columns[i++] = { x: end, y1: 0, y2: 0 };

  if (columns.length > 2) {
    columns.sort(
      function(a, b) { return a.x - b.x; }
    );
  }

  this.addMesh(this.generateMeshFront(columns));
  this.addMesh(this.generateMeshBack(columns));
  this.addMesh(this.generateMeshTop());
};

Tarumae.EditorWall.prototype.generateMeshFront = function(columns) {

  var vertexCount = (this.doors * 6 + this.windows * 8 + 4);

  var vertices = new Array(vertexCount * 3);
  var normals = new Array(vertexCount * 3);
  var uv = new Array(vertexCount * 2);

  var indexCount = (this.doors * 4 + this.windows * 6 + 2) * 3;
  var indexes = new Array(indexCount);

  var i = 0, j;

  // generate vertices - front
  var z = this.thickness / 2;

  for (j = 0; j < columns.length; j++) {
    var pi = columns[j];

    vertices._t_set(i, pi.x, this.height, z); i += 3;

    if (pi.y1 !== 0) {
      vertices._t_set(i, pi.x, pi.y1, z); i += 3;
    }

    if (pi.y2 !== 0) {
      vertices._t_set(i, pi.x, pi.y2, z); i += 3;
    }

    vertices._t_set(i, pi.x, 0, z); i += 3;
  }

  // generate normals - front
  for (j = 0, i = 0; j < vertexCount; j++ , i += 3) {
    normals._t_set(i, 0, 0, 1);
  }

  // generate uv texcoords - front
  var xmin = columns[0].x;

  for (j = 0, k = 0, i = 0; j < vertexCount; j++ , k++) {
    var x = vertices[k++], y = vertices[k++];
    uv[i++] = x - xmin;
    uv[i++] = y - this.height;
  }

  // generate indexes - front

  var idx = 0;
  i = 0;

  for (j = 0; j < columns.length - 1; j++) {

    var y1n = columns[j].y1;
    var y2n = columns[j].y2;

    var y1m = columns[j + 1].y1;
    var y2m = columns[j + 1].y2;

    var idx1 = idx, idx2 = idx + 1, idx3 = idx + 2, idx4 = idx + 3;

    if (y2n !== 0 && (j % 2) !== 0) {
      // current is window
      idx3 = idx2 + 3;
      idx4 = idx3 + 1;

      indexes[i++] = idx1; indexes[i++] = idx2; indexes[i++] = idx3;
      indexes[i++] = idx3; indexes[i++] = idx2; indexes[i++] = idx4;

      indexes[i++] = idx1 + 2; indexes[i++] = idx2 + 2; indexes[i++] = idx3 + 2;
      indexes[i++] = idx3 + 2; indexes[i++] = idx2 + 2; indexes[i++] = idx4 + 2;

      idx += 2;
    }
    else if (y1n !== 0 && (j % 2) !== 0) {
      // current is door
      idx3 = idx2 + 2;
      idx4 = idx3 + 1;

      indexes[i++] = idx1; indexes[i++] = idx2; indexes[i++] = idx3;
      indexes[i++] = idx3; indexes[i++] = idx2; indexes[i++] = idx4;

      idx += 1;
    }
    else {
      // current is wall

      if (y2n !== 0) {
        // previous was window
        idx2 = idx1 + 3;

        idx += 2;
      }
      else if (y1n !== 0) {
        // previous was door
        idx2 = idx1 + 2;

        idx += 1;
      }

      idx3 = idx2 + 1;

      if (y2m !== 0) {
        // next is window
        idx4 = idx3 + 3;
      }
      else if (y1m !== 0) {
        // next is door
        idx4 = idx3 + 2;
      }
      else {
        idx4 = idx3 + 1;
      }

      indexes[i++] = idx1; indexes[i++] = idx2; indexes[i++] = idx3;
      indexes[i++] = idx3; indexes[i++] = idx2; indexes[i++] = idx4;
    }

    idx += 2;
  }

  var mesh = new Tarumae.Mesh();

  mesh.vertices = vertices;
  mesh.normals = normals;
  mesh.texcoords = uv;
  mesh.indexes = indexes;
  mesh.indexed = true;

  return mesh;
};

Tarumae.EditorWall.prototype.generateMeshBack = function(columns) {

  var vertexCount = (this.doors * 6 + this.windows * 8 + 4);

  var vertices = new Array(vertexCount * 3);
  var normals = new Array(vertexCount * 3);
  var uv = new Array(vertexCount * 2);

  var indexCount = (this.doors * 4 + this.windows * 6 + 2) * 3;
  var indexes = new Array(indexCount);

  var i = 0, j;

  // generate vertices - back
  var z = -this.thickness / 2;

  for (j = 0; j < columns.length; j++) {
    var pi = columns[j];

    vertices._t_set(i, pi.x, this.height, z); i += 3;

    if (pi.y1 !== 0) {
      vertices._t_set(i, pi.x, pi.y1, z); i += 3;
    }

    if (pi.y2 !== 0) {
      vertices._t_set(i, pi.x, pi.y2, z); i += 3;
    }

    vertices._t_set(i, pi.x, 0, z); i += 3;
  }

  // generate normals - back
  for (j = 0, i = 0; j < vertexCount; j++ , i += 3) {
    normals._t_set(i, 0, 0, -1);
  }

  // generate uv texcoords - back
  var xmin = columns[0].x;

  for (j = 0, k = 0, i = 0; j < vertexCount; j++ , k++) {
    var x = vertices[k++], y = vertices[k++];
    uv[i++] = x - xmin;
    uv[i++] = y - this.height;
  }

  // generate indexes - back

  var idx = 0;
  i = 0;

  for (j = 0; j < columns.length - 1; j++) {

    var y1n = columns[j].y1;
    var y2n = columns[j].y2;

    var y1m = columns[j + 1].y1;
    var y2m = columns[j + 1].y2;

    var idx1 = idx, idx2 = idx + 1, idx3 = idx + 2, idx4 = idx + 3;

    if (y2n !== 0 && (j % 2) !== 0) {
      // current is window
      idx3 = idx2 + 3;
      idx4 = idx3 + 1;

      indexes[i++] = idx1; indexes[i++] = idx3; indexes[i++] = idx2;
      indexes[i++] = idx2; indexes[i++] = idx3; indexes[i++] = idx4;

      indexes[i++] = idx1 + 2; indexes[i++] = idx3 + 2; indexes[i++] = idx2 + 2;
      indexes[i++] = idx2 + 2; indexes[i++] = idx3 + 2; indexes[i++] = idx4 + 2;

      idx += 2;
    }
    else if (y1n !== 0 && (j % 2) !== 0) {
      // current is door
      idx3 = idx2 + 2;
      idx4 = idx3 + 1;

      indexes[i++] = idx1; indexes[i++] = idx3; indexes[i++] = idx2;
      indexes[i++] = idx2; indexes[i++] = idx3; indexes[i++] = idx4;

      idx += 1;
    }
    else {
      // current is wall

      if (y2n !== 0) {
        // previous was window
        idx2 = idx1 + 3;

        idx += 2;
      }
      else if (y1n !== 0) {
        // previous was door
        idx2 = idx1 + 2;

        idx += 1;
      }

      idx3 = idx2 + 1;

      if (y2m !== 0) {
        // next is window
        idx4 = idx3 + 3;
      }
      else if (y1m !== 0) {
        // next is door
        idx4 = idx3 + 2;
      }
      else {
        idx4 = idx3 + 1;
      }

      indexes[i++] = idx1; indexes[i++] = idx3; indexes[i++] = idx2;
      indexes[i++] = idx2; indexes[i++] = idx3; indexes[i++] = idx4;
    }

    idx += 2;
  }

  var mesh = new Tarumae.Mesh();

  mesh.vertices = vertices;
  mesh.normals = normals;
  mesh.texcoords = uv;
  mesh.indexes = indexes;
  mesh.indexed = true;

  return mesh;
};

Tarumae.EditorWall.prototype.generateMeshTop = function() {
  var start = -this.width / 2;
  var end = this.width / 2;

  var y = this.height;
  var z = this.thickness / 2;

  var mesh = new Tarumae.Mesh();
  
	mesh.vertices = [start, y, -z, start, y, z, end, y, -z, end, y, z];
	mesh.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
	mesh.texcoords = [0, 0, 0, 1, 1, 0, 1, 1];

  mesh.composeMode = Tarumae.Mesh.ComposeModes.TriangleStrip;
  
  return mesh;
};

_s3_Class("EditorBeam", Tarumae.EditorObject, function() {
  this.super();
  
  var beam = this;
  
  this.editEnabled = {
    translate: {
      x: false,
      y: false,
      z: false,
    },
    rotate: {
      x: false,
      y: false,
      z: false,
    },
  };

  this.activePoints = {
    front: {
      axies: "+z",
      get: function() {
        return new Vec3(0, 0, 0.5);
      },
      set: function(movement) {
        var mx = movement.x / 50;
        beam.scale.z += mx;
        beam.location.z += mx / 2;
      },
      object: beam,
    },
    down: {
      axies: "-y",
      get: function() {
        return new Vec3(0, -0.5, 0);
      },
      set: function(movement) {
        var mx = movement.y / 50;
        beam.scale.y += mx;
        beam.location.y -= mx / 2;
      },
      object: beam,
    },
  };

  this.addMesh(new Tarumae.CubeMesh());	  
});

_s3_Class("EditorCube", Tarumae.EditorObject, function() {
  this.super();
  
  var cube = this;
  
  this.activePoints = {
    top: {
      axies: "+y",
      get: function() {
        return new Vec3(0, 0.5, 0);
      },
      set: function(movement) {
        var mx = movement.y / 50;
        cube.scale.y -= mx;
        cube.location.y -= mx / 2;
      },
      object: cube,
    },
    down: {
      axies: "-y",
      get: function() {
        return new Vec3(0, -0.5, 0);
      },
      set: function(movement) {
        var mx = movement.y / 50;
        cube.scale.y += mx;
        cube.location.y -= mx / 2;
      },
      object: cube,
    },
    front: {
      axies: "+z",
      get: function() {
        return new Vec3(0, 0, 0.5);
      },
      set: function(movement) {
        var mx = movement.x / 50;
        cube.scale.z -= mx;
        cube.location.z -= mx / 2;
      },
      object: cube,
    },
  };

  this.addMesh(new Tarumae.CubeMesh());	  
});

//////////////// Camera /////////////////

_s3_Class("EditorCamera", Tarumae.Camera, function() {
  this.super();

  this.location.y = 1.2;
  
	// keep only one camera mesh instance	
	if (Tarumae.Camera.meshInstance === null) {
		Tarumae.Camera.meshInstance = new CameraMesh();
  }

	// add mesh into camera object
	this.addMesh(Tarumae.Camera.meshInstance);

  this.visible = true;
  this.scale.set(0.5, 0.5, 0.5);
});

//////////////// EditorImageObject /////////////////

_s3_Class("EditorImageObject", Tarumae.EditorObject, function() {
  this.super();

  this.radiyBody = {
    type: "sphere",
    radius: 0.2
  };
});

Tarumae.EditorImageObject.prototype.draw = function(renderer) {
  if (this.model && this.model.gizmoImage instanceof Image
  && (this.editor.displayMode & TarumaeEditor.DisplayModes.Image) === TarumaeEditor.DisplayModes.Image) {
    renderer.drawImage(this.getWorldLocation(), this.model.gizmoImage);
  }
};

//////////////// LightObject /////////////////

_s3_Class("LightObject", Tarumae.EditorImageObject, function() {
  this.super();

  this.location.y = 2;
});

Tarumae.LightObject.prototype.hitTestByRay = function() {
  if (this.indesign) return false;

  return Tarumae.SceneObject.prototype.hitTestByRay.apply(this, arguments);
};


//////////////// PointLight /////////////////

_s3_Class("PointLight", Tarumae.LightObject, function() {
  this.super();
  
  // for a light, set the radiy body to sphere for hit test
  this.radiyBody = {
    type: "sphere",
    radius: 0.2
  };
});

//////////////// SpotLight /////////////////

_s3_Class("SpotLight", Tarumae.LightObject, function() {
  this.super();

  // for a light, set the radiy body to sphere for hit test
  this.radiyBody = {
    type: "sphere",
    radius: 0.2
  };
});

//////////////// EditorEmptyObject /////////////////

_s3_Class("EditorEmptyObject", Tarumae.EditorObject, function() {
  this.super();

  this.size = 0.5;
  this.color = "#66dddd";

  this.radiyBody = {
    type: "sphere",
    radius: 0.2
  };
});

Tarumae.EditorEmptyObject.prototype.draw = function(renderer) {  
  if ((this.editor.displayMode & TarumaeEditor.DisplayModes.Guide) !== TarumaeEditor.DisplayModes.Guide) {
    return;
  }
  
  var loc = this.getWorldLocation();

  var halfSize = this.size * 0.5;
  
  var top = Vec3.add(loc, new Vec3(0, this.size, 0)),
    bottom = Vec3.add(loc, new Vec3(0, -this.size, 0)),
    left = Vec3.add(loc, new Vec3(-this.size, 0, 0)),
    right = Vec3.add(loc, new Vec3(this.size, 0, 0)),
    forward = Vec3.add(loc, new Vec3(0, 0, -this.size)),
    back = Vec3.add(loc, new Vec3(0, 0, this.size));
  
  renderer.drawLine(bottom, top, 2, this.color);
  renderer.drawLine(left, right, 2, this.color);
  renderer.drawLine(back, forward, 2, this.color);
};

//////////////// EditorRefRange /////////////////

_s3_Class("EditorRefRange", Tarumae.EditorEmptyObject, function() {
  this.super();

  this.size = 0.2;
  this.color = "#005aff";
  this.location.y = 0.5;

  this.radiyBody = {
    type: "sphere",
    radius: 0.2,
  };
});

Tarumae.EditorRefRange.prototype.draw = function(renderer) {
  Tarumae.EditorEmptyObject.prototype.draw.call(this, renderer);

  if ((this.editor.displayMode & TarumaeEditor.DisplayModes.Guide) !== TarumaeEditor.DisplayModes.Guide) {
    return;
  }

  var loc = this.getWorldLocation();
  var halfSize = this.scale.mul(0.5);
  
  renderer.drawFocusBBox({
    min: Vec3.add(loc, halfSize.neg()),
    max: Vec3.add(loc, halfSize),
  }, 0.1, 2, this.color);

  // temporary hide text label of range guide 
  //renderer.drawText(Vec3.add(loc, new Vec3(0, -0.5, 0)), this.name, "black", "center");
};

//////////////// EditorResizeGuideBoundingBox /////////////////

_s3_Class("EditorResizeGuideBoundingBox", Tarumae.EditorEmptyObject, function() {
  this.super();

  this.size = 0.2;
  this.color = "#00e594";

  this.radiyBody = {
    type: "sphere",
    radius: 0.2,
  };
});

Tarumae.EditorResizeGuideBoundingBox.prototype.draw = function(renderer) {
  var loc = this.getWorldLocation();
  var halfSize = this.scale.mul(0.5);
  
  renderer.drawFocusBBox({
    min: Vec3.add(loc, halfSize.neg()),
    max: Vec3.add(loc, halfSize),
  }, 0.1, 2, this.color);
};