////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// http://tarumae.jp
//
// Copyright(c) 2016 BULB CORP. all rights reserved
////////////////////////////////////////////////////////////////////////////////

function SpaceTreeNode(origin, size) {
  if (typeof origin === "undefined") {
    this.origin = null;
    this.size = null;
    this.halfSize = null;
    this.minpos = null;
    this.maxpos = null;
  } else {
    this.origin = origin;
    this.size = size;
    this.halfSize = size.div(2);
    this.minpos = origin.sub(halfSize);
    this.maxpos = origin.add(halfSize);
  }
  
  this.splitted = false;
  this.splitNextDir = SpaceTree.ST_SplitX;
	this.left = null;
  this.right = null;
  this.list = [];
}

SpaceTreeNode.prototype.split = function(depth) {
	switch (this.splitNextDir)
  {
    case SpaceTree.ST_SplitX:
      {
        var halfHalfSize = this.halfSize.x / 2;
        var splittdBoxSize = new Vec3(this.halfSize.x, this.size.y, this.size.z);
        
        this.left = new SpaceTreeNode(new Vec3(origin.x - halfHalfSize,
                                          origin.y,
                                          origin.z), splittdBoxSize);

        this.right = new SpaceTreeNode(new Vec3(origin.x + halfHalfSize,
                                           origin.y,
                                           origin.z), splittdBoxSize);
        
        this.left.splitNextDir = SpaceTree.ST_SplitY;
        this.right.splitNextDir = SpaceTree.ST_SplitY;
      }
      break;
      
    case SpaceTree.ST_SplitY:
      {
        var halfHalfSize = this.halfSize.y / 2;
        var splittdBoxSize = new Vec3(this.size.x, this.halfSize.y, this.size.z);
        
        this.left = new SpaceTreeNode(new Vec3(origin.x,
                                          origin.y - halfHalfSize,
                                          origin.z), splittdBoxSize);
        
        this.right = new SpaceTreeNode(new Vec3(origin.x,
                                           origin.y + halfHalfSize,
                                           origin.z), splittdBoxSize);
        
        this.left.splitNextDir = SpaceTree.ST_SplitZ;
        this.right.splitNextDir = SpaceTree.ST_SplitZ;
      }
      break;
      
    case SpaceTree.ST_SplitZ:
      {
        var halfHalfSize = this.halfSize.z / 2;
        var splittdBoxSize = new Vec3(this.size.x, this.size.y, this.halfSize.z);
        
        this.left = new SpaceTreeNode(new Vec3(origin.x,
                                          origin.y,
                                          origin.z - halfHalfSize), splittdBoxSize);
        
        this.right = new SpaceTreeNode(new Vec3(origin.x, 
                                           origin.y,
                                           origin.z + halfHalfSize), splittdBoxSize);
        
        this.left.splitNextDir = SpaceTree.ST_SplitX;
        this.right.splitNextDir = SpaceTree.ST_SplitX;
      }
      break;
  }
  
  this.splitted = true;

  if (depth < SpaceTree.MaxDepth)
  {
    this.left.split(depth + 1);
    this.right.split(depth + 1);
  }
};

SpaceTreeNode.prototype.intersectTriangle = function(t) {
  return Tarumae.MathFunctions.triangleIntersectBox(this.origin, this.halfSize, t);
};
  
SpaceTreeNode.prototype.intersectRay = function(ray) {
  return Tarumae.MathFunctions.rayIntersectBox(r.origin, r.dir, this.minpos, this.maxpos, null);
}

function SpaceTree() {
  this.root = new SpaceTreeNode();
}

SpaceTree.init = function(spaceSize) {
  if (typeof spaceSize === "undefined") {
    spaceSize = 30;
  }

  var halfSize = spaceSize / 2.0;
    
  this.root.origin = new Vec3(0, 0, 0);
  this.root.size = new Vec3(spaceSize, spaceSize, spaceSize);
  this.root.halfSize = new Vec3(halfSize, halfSize, halfSize);

  this.root.split(maxDepth);
};

SpaceTree.SplitDirs =　{
  ST_SplitX : 0,
  ST_SplitY : 1,
  ST_SplitZ : 2,
};

SpaceTree.MaxDepth = 2;
