
////////////// Designer //////////////

var PlanDesigner = function(renderer) {
  this.renderer = renderer;

  var _designer = this;

  this.operationMode = PlanDesigner.OperationModes.None;
  this.currentDrawingMode = 'none';

  this.scene = renderer.createScene2D();
  this.scene.show();

  this.areasHolder = new Draw2D.Object();
  this.activePointsHolder = new Draw2D.Object();
  this.selectedObjects = [];
  this.selectedAreas = [];
  this.focusObject = undefined;
  this.focusArea = undefined;

  this.scene.add(this.areasHolder);
  this.scene.add(this.activePointsHolder);

  var designArea = new PlanDesigner.Area(this, 100 + 15, 50 + 20, 1000 - 20, 800 - 10);
  this.designArea = designArea;
  this.areasHolder.add(designArea);
  
  this.scene.ondraw = function(e) { _designer.render(e) };
  this.scene.onmousedown = function(e) { _designer.mousedown(e) };
  this.scene.onmousemove = function(e) { _designer.mousemove(e) };
  this.scene.onmouseup = function(e) { _designer.mouseup(e) };
  this.scene.onbegindrag = function(e) { _designer.begindrag(e) };
  this.scene.ondrag = function(e) { _designer.drag(e) };
  this.scene.onenddrag = function(e) { _designer.enddrag(e) };
  this.scene.onkeydown = function(e) { _designer.keydown(e) };
};

// Event declarations
new EventDispatcher(PlanDesigner).registerEvents("areaPlaced");

Object.assign(PlanDesigner, {
  OperationModes: {
    None: 0,
    SelectingArea: 1,
  },

  AreaPlanTypes: {
    Pending: 0,
    WorkArea: 1,
    ConferenceArea: 2,
    RestArea: 3,
    MealArea: 4,
    DecorateArea: 5,
    ReservedArea: 9,
  },
});

Object.assign(PlanDesigner.prototype, {
  render: function(ctx) {
    for (var k = 0; k < this.selectedObjects.length; k++) {
      var obj = this.selectedObjects[k];
      this.drawSelectedObject(ctx, obj);
    }
  },

  drawSelectedObject: function(renderer, obj) {
    renderer.drawRect(obj.bbox, 1, 'blue');
  },

  mousedown: function(e) {
    switch (this.operationMode) {
      default:
        var foundObject = this.scene.findObjectByPosition(e.position);

        if (foundObject instanceof Draw2D.ActivePoint) {
          // do nothing
        }
        else if (foundObject instanceof PlanDesigner.FixedArea) {
          this.selectObject(foundObject);
          this.setFocusObject(foundObject);
          this.setFocusArea(foundObject);
        } else {
          this.selectObject(undefined);
          this.setFocusObject(undefined);
          this.setFocusArea(undefined);
        }
        break;
    }
  },

  mouseup: function(e) {
  },

  mousemove: function(e) {
    switch (this.operationMode) {
      default:
        var hoverObject = this.scene.findObjectByPosition(e.position);
        if (hoverObject) {
          // if (hoverObject instanceof PlanDesigner.Area) {
          hoverObject.mousemove(this.scene.createEventArgument(hoverObject));
          this.scene.requireUpdateFrame();
          // }
        }  
        break;
    }
  },

  begindrag: function(e) {
  },

  drag: function(e) {
  },

  enddrag: function(e) {
  },

  keydown: function(key) {
    switch (key) {
      case Tarumae.Viewer.Keys.D1:
        this.changeDrawingMode('wall');
        break;

      case Tarumae.Viewer.Keys.D2:
        this.changeDrawingMode('door');
        break;

      case Tarumae.Viewer.Keys.D3:
        this.changeDrawingMode('window');
        break;

      case Tarumae.Viewer.Keys.Space:
        this.changeDrawingMode('none');
        break;
    }
  },

  changeDrawingMode: function(mode) {
    this.currentDrawingMode = mode;
    console.log('change draw mode: ' + mode);
  },

  selectObject: function(obj, isAppend) {
    if (!isAppend) {
      this.deselectAllObjectsExcept(obj);
    }

    if (obj) {
      if (!this.selectedObjects._t_contains(obj)) {
        this.selectedObjects.push(obj);

        var aps = this.createActivePointsForObject(obj);
        this.activePointsHolder.add(aps);
      }
    }

    this.scene.requireUpdateFrame();    
  },

  deselectAllObjectsExcept: function(exceptObj) {
    for (var i = 0; i < this.selectedObjects.length; i++) {
      var obj = this.selectedObjects[i];
      if (obj !== exceptObj) {
        this.removeActivePointsBelongToObject(obj);
        this.selectedObjects._t_remove(obj);
      }
    }
  },

  deselectObject: function(obj) {
    if (this.selectedObjects._t_contains(obj)) {
      this.removeActivePointsBelongToObject(obj);
      this.scene.requireUpdateFrame();
    }
  },

  setFocusObject: function(obj) {
    this.focusObject = obj;
  },

  setFocusArea: function(area) {
    this.focusArea = area;
  },

  resetAreas: function() {
    this.designArea.clear();
  },

  createActivePointsForObject: function(obj) {
    var _designer = this;
    var aps = [];
    var origin = obj.bbox.origin;

    obj._activePoints = {};
    var _aps = obj._activePoints;

    var ap;
    
    // ap = this.createSingleActivePointForObject(obj);
    // _aps.leftTop = ap;
    // aps.push(ap);

    // ap = this.createSingleActivePointForObject(obj);
    // _aps.leftBottom = ap;
    // aps.push(ap);

    // ap = this.createSingleActivePointForObject(obj);
    // _aps.rightTop = ap;
    // aps.push(ap);

    ap = this.createSingleActivePointForObject(obj);
    ap.ondrag = function(e) {
      obj.bbox.width += e.movement.x;
      obj.bbox.height += e.movement.y;
      _designer.updateActivePointsForObject(obj);
    };
    _aps.rightBottom = ap;
    aps.push(ap);

    // ap = this.createSingleActivePointForObject(obj);
    // _aps.leftMiddle = ap;
    // aps.push(ap);

    // ap = this.createSingleActivePointForObject(obj);
    // _aps.rightMiddle = ap;
    // aps.push(ap);

    // ap = this.createSingleActivePointForObject(obj);
    // _aps.topMiddle = ap;
    // aps.push(ap);

    // ap = this.createSingleActivePointForObject(obj);
    // _aps.bottomMiddle = ap;
    // aps.push(ap);

    this.updateActivePointsForObject(obj);

    return aps;
  },

  updateActivePointsForObject: function(obj) {
    var origin = obj.bbox.origin;
    
    var aps = obj._activePoints;
    if (!aps) return;

    if (aps.leftTop) aps.leftTop.moveTo(obj.bbox.x, obj.bbox.y);
    if (aps.leftBottom) aps.leftBottom.moveTo(obj.bbox.x, obj.bbox.bottom);
    if (aps.rightTop) aps.rightTop.moveTo(obj.bbox.right, obj.bbox.y);
    if (aps.rightBottom) aps.rightBottom.moveTo(obj.bbox.right, obj.bbox.bottom);

    if (aps.leftMiddle) aps.leftMiddle.moveTo(obj.bbox.x, origin.y);
    if (aps.rightMiddle) aps.rightMiddle.moveTo(obj.bbox.right, origin.y);
    if (aps.topMiddle) aps.topMiddle.moveTo(origin.x, obj.bbox.y);
    if (aps.bottomMiddle) aps.bottomMiddle.moveTo(origin.x, obj.bbox.bottom);

  },

  createSingleActivePointForObject: function(obj, x, y) {
    if (typeof x === "undefined") x = 0;
    if (typeof y === "undefined") y = 0;

    var aps = new Draw2D.ActivePoint(x, y);
    aps.owner = obj;
    return aps;
  },

  removeActivePointsBelongToObject: function(obj) {
    var removeList = [];

    for (var i = 0; i < this.activePointsHolder.objects.length; i++) {
      var ap = this.activePointsHolder.objects[i];
      if (ap.owner === obj) {
        removeList.push(ap);
      }
    }

    for (var k = 0; k < removeList.length; k++) {
      this.activePointsHolder._t_remove(removeList[k]);
    }
  },

  add: function(obj) {
    this.designArea.add(obj);
  },

  placeNewArea: function(area) {
    this.add(area);
    this.focusArea = area;
    this.onAreaPlaced(area);
  },
  
  replaceAreaWith: function(areaFrom, areaTo) {
    areaTo.bbox = areaFrom.bbox.clone();
    Tarumae.Utility.invokeIfExist(areaTo, "layout");
    this.designArea.remove(areaFrom);
    this.designArea.add(areaTo);
    this.refreshUI();
  },

  refreshUI: function() {
    this.scene.requireUpdateFrame();
  },

});

PlanDesigner.Area = function(designer, x, y, w, h) {
  Draw2D.Object.setup.call(this);

  this.designer = designer;
  this.bbox = new Tarumae.Rect(x, y, w, h);

  this.gridSizeX = 16;
  this.gridSizeY = 16;
  this.hoverGridIndex = null;
  this.selectAreaStartIndex = undefined;
  this.selectAreaEndIndex = undefined;
};

PlanDesigner.Area.prototype = new Draw2D.Object();

Object.assign(PlanDesigner.Area.prototype, {

  draw: function(renderer) {
    renderer.drawRect(this.bbox, 1, null, 'white');

    var right = this.bbox.right;
    var bottom = this.bbox.bottom;

    for (var ix = this.bbox.x; ix < right; ix += this.gridSizeX) {
      for (var iy = this.bbox.y; iy < bottom; iy += this.gridSizeY) {
        renderer.drawEllipse(new Tarumae.Rect(ix - 1, iy - 1, 2, 2), 1, '#339999');
      }
    }

    switch (this.designer.operationMode) {
      default:
        break;
        
      case PlanDesigner.OperationModes.None:
      case PlanDesigner.OperationModes.SelectingArea:
        {
          if (this.hoverGridIndex) {
            renderer.drawRect({
              x: this.bbox.x + this.gridSizeX * this.hoverGridIndex.x,
              y: this.bbox.y + this.gridSizeY * this.hoverGridIndex.y,
              width: this.gridSizeX, height: this.gridSizeY
            }, 0, null, '#cfddcf');
          }

          if (this.selectAreaStartIndex && this.selectAreaEndIndex) {
            var startX = Math.min(this.selectAreaStartIndex.x, this.selectAreaEndIndex.x);
            var startY = Math.min(this.selectAreaStartIndex.y, this.selectAreaEndIndex.y);
            var countX = Math.max(this.selectAreaStartIndex.x, this.selectAreaEndIndex.x) - startX + 1;
            var countY = Math.max(this.selectAreaStartIndex.y, this.selectAreaEndIndex.y) - startY + 1;
      
            var x = startX * this.gridSizeX, y = startY * this.gridSizeY;
            var rect = new Tarumae.Rect(this.bbox.x + x, this.bbox.y + y,
              countX * this.gridSizeX, countY * this.gridSizeY);

            renderer.drawRect(rect, 0, null, '#ffddcf');
            renderer.drawText(countX + " x " + countY, rect.origin, 'black', 'center');
          }
        }
        break;
    }
  },

  mousemove: function(e) {
    switch (this.designer.operationMode) {
      default:
        this.hoverGridIndex = this.getGridPositionFromMousePosition(e.localPosition);
        break;
    }
  },

  mousedown: function(e) {
    switch (this.designer.operationMode) {
      default:
        this.selectAreaStartIndex = this.getGridPositionFromMousePosition(e.localPosition);
        this.selectAreaEndIndex = this.selectAreaStartIndex.clone();
        this.designer.operationMode = PlanDesigner.OperationModes.SelectingArea;
        break;
    }
  },

  begindrag: function(e) {
    switch (this.designer.operationMode) {
      default:
        break;
    }
  },

  drag: function(e) {
    switch (this.designer.operationMode) {
      default:
        break;
      
      case PlanDesigner.OperationModes.SelectingArea:
        this.selectAreaEndIndex = this.getGridPositionFromMousePosition(e.localPosition);
        break;
    }
  },

  enddrag: function(e) {
    this.designer.operationMode = PlanDesigner.OperationModes.None;

    var startX = Math.min(this.selectAreaStartIndex.x, this.selectAreaEndIndex.x);
    var startY = Math.min(this.selectAreaStartIndex.y, this.selectAreaEndIndex.y);
    var countX = Math.max(this.selectAreaStartIndex.x, this.selectAreaEndIndex.x) - startX + 1;
    var countY = Math.max(this.selectAreaStartIndex.y, this.selectAreaEndIndex.y) - startY + 1;

    if (countX >= 1 || countY >= 1) {
      this.hoverGridIndex = null;
    
      if (this.designer.currentDrawingMode === 'wall') {
        var r = this.getRectFromIndex(startX, startY, countX, countY);
        var wall = new PlanDesigner.WallArea(this, r.x, r.y, r.width, r.height);
        this.add(wall);
      } else {
        this.createFixedAreaFromIndex(startX, startY, countX, countY);
      }
    }
  },

  mouseout: function(e) {
  },

  getGridPositionFromMousePosition: function(p) {
    return new Tarumae.Point(
      Math.floor(p.x / this.gridSizeX),
      Math.floor(p.y / this.gridSizeY));
  },

  createFixedAreaFromIndex: function(startX, startY, countX, countY) {
    var r = this.getRectFromIndex(startX, startY, countX, countY);
    var newArea = new PlanDesigner.FixedArea(this.designer, r.x, r.y, r.width, r.height);
    this.designer.placeNewArea(newArea);
    return newArea;
  },

  getRectFromIndex: function(startX, startY, countX, countY) {
    var x = startX * this.gridSizeX, y = startY * this.gridSizeY;

    return new Tarumae.Rect(
      this.bbox.x + x, this.bbox.y + y, countX * this.gridSizeX, countY * this.gridSizeY);
  },
});

PlanDesigner.FixedArea = function(designer, x, y, w, h) {
  Draw2D.Object.setup.call(this);
  
  this.designer = designer;
  this.bbox = new Tarumae.Rect(x, y, w, h);

  this.planType = PlanDesigner.AreaPlanTypes.Pending;
};

Object.assign(PlanDesigner.FixedArea, {
  createItem: function(url, x, y, angle) {
    var img = new Image();
    img.src = url;
    var item = new Draw2D.Image(img, x, y, 32, 32);
    item.angle = angle;
    return item;
  },
});

PlanDesigner.FixedArea.prototype = new Draw2D.Object();

Object.assign(PlanDesigner.FixedArea.prototype, {

  layout: function(type, horizonArg) {
    if (typeof type !== "undefined") {
      this.planType = type;
    }

    var horizontal;
    if (typeof horizontal !== "undefined") {
      horizontal = horizonArg;
    } else {
      horizontal = this.bbox.width > this.bbox.height;
    }

    this.clearLayout();
    
    switch (this.planType) {
      case PlanDesigner.AreaPlanTypes.Pending:
      case PlanDesigner.AreaPlanTypes.ReservedArea:
        break;

      default:
      case PlanDesigner.AreaPlanTypes.WorkArea:
        {
          
          var x = this.bbox.x, y = this.bbox.y;
          var right = this.bbox.right, bottom = this.bbox.bottom;
          
          // if (horizontal) {
          while (y < bottom) {
            var group = this.createGroupArea(horizontal, x, y);
            if (!group || group.bbox.width <= 0 || group.bbox.height <= 0) {
              console.warn("strange group, abort to layout");
              break;
            }
            
            x += group.bbox.width;
              
            if (x <= right) {
              this.add(group);
      
              if (x + group.bbox.width >= this.bbox.right) {
                y += group.bbox.height;
                x = this.bbox.x;
              }
      
              if (y + group.bbox.height > bottom) break;
            } else {
              y += group.bbox.height;
              x = this.bbox.x;
            }
          }
          // } else {
          //   while (x < right) {
          //     var group = this.createGroupArea(horizontal);
          //     x += group.bbox.width;
              
          //     if (x <= right) {
          //       this.add(group);
          //     } else {
          //       y += group.bbox.height;
          //       x = this.bbox.x;
          //     }
          //   }
          // }
        }
        break;
    }

    switch (this.planType) {
      default:
      case PlanDesigner.AreaPlanTypes.WorkArea:
        this.style.fillColor = '#eff4f7';
        break;

      case PlanDesigner.AreaPlanTypes.ConferenceArea:
        this.style.fillColor = '#f7f0e1';
        break;

      case PlanDesigner.AreaPlanTypes.RestArea:
        this.style.fillColor = '#f0f7ef';
        break;

      case PlanDesigner.AreaPlanTypes.MealArea:
        this.style.fillColor = '#f9f0ef';
        break;

      case PlanDesigner.AreaPlanTypes.DecorateArea:
        this.style.fillColor = 'transparent';
        break;

      case PlanDesigner.AreaPlanTypes.ReservedArea:
        this.style.strokeColor = 'gray';
        this.style.fillColor = '#d9d9d9';
        break;
    }

    this.designer.refreshUI();
  },

  createGroupArea: function(horizontal, x, y) {
    var groupArea = undefined;

    switch (this.planType) {
      default:
      case PlanDesigner.AreaPlanTypes.WorkArea:
      case PlanDesigner.AreaPlanTypes.ConferenceArea:
        groupArea = new PlanDesigner.GroupPlace(this.designer, x, y,
          this.bbox.right - x, this.bbox.bottom - y, horizontal);
        groupArea.planType = this.planType;
        groupArea.layout();
        break;
    }

    return groupArea;
  },

  clearLayout: function() {
    this.clear();
  },

  draw: function(renderer) {
    renderer.drawRect(this.bbox, 1, null, this.style.fillColor);
    
    switch (this.planType) {
      default:
        break;

      case PlanDesigner.AreaPlanTypes.ReservedArea:
        // var meshSpace = 50;
        // for (var ix = this.bbox.x; ix < this.bbox.right; ix += meshSpace) {
        //   renderer.drawLines([{ x: ix, y: this.bbox.y }, { x: ix + meshSpace, y: this.bbox.bottom }], 1, 'silver');
        // }
        // for (var ix = this.bbox.x; ix < this.bbox.right; ix += meshSpace) {
        //   renderer.drawLines([{ x: ix, y: this.bbox.y }, { x: ix - meshSpace, y: this.bbox.bottom }], 1, 'silver');
        // }
        renderer.drawRect(this.bbox, 1, 'gray', this.style.fillColor);
        renderer.drawLines([{ x: this.bbox.x, y: this.bbox.y }, { x: this.bbox.right, y: this.bbox.bottom }], 1, 'silver');
        renderer.drawLines([{ x: this.bbox.right, y: this.bbox.y }, { x: this.bbox.x, y: this.bbox.bottom }], 1, 'silver');
        break;
    }
  },
});


PlanDesigner.GroupPlace = function(designer, x, y, w, h, horizontal) {
  Draw2D.Object.setup.call(this);
  
  this.availableBbox = new Tarumae.Rect(x, y, w, h);
  this.bbox.x = x;
  this.bbox.y = y;
  this.startPoint = { x: x, y: y };
  this.designer = designer;
  this.horizontal = horizontal;

  this.planType = PlanDesigner.AreaPlanTypes.Pending;
};

PlanDesigner.GroupPlace.prototype = new Draw2D.Object();

Object.assign(PlanDesigner.GroupPlace.prototype, {
  
  layout: function() {
    var horizontal = this.horizontal;

    var itemSize, itemSpace, itemUrl, tableSize;
    var availableSpace = this.horizontal ? this.availableBbox.width : this.availableBbox.height;
    
    switch (this.planType) {
      case PlanDesigner.AreaPlanTypes.WorkArea:
        itemSize = 32;
        itemSpace = 40;
        tableSize = 60;
        itemUrl = "images/OfficeChair-32.png";
        break;
    
      case PlanDesigner.AreaPlanTypes.ConferenceArea:
        itemSize = 32;
        itemSpace = 30;
        tableSize = 40;
        itemUrl = "images/OfficeChair-G-32.png";
        break;

      case PlanDesigner.AreaPlanTypes.DecorateArea:
        itemUrl = "images/PottedPlant-Green-24.png";
        break;
    }
    
    var stride = itemSize + itemSpace;
    var items = (availableSpace - stride) / stride;

    var workTableStyle = {
      strokeWidth: 2,
      strokeColor: "#5b8699",
      fillColor: '#afc5ce',
    };
    var confTableStyle = {
      strokeWidth: 2,
      strokeColor: "#c1b385",
      fillColor: '#efe1c2',
    };
    
    switch (this.planType) {
      case PlanDesigner.AreaPlanTypes.WorkArea:
      case PlanDesigner.AreaPlanTypes.ConferenceArea:
      
        if (horizontal) {
          for (var i = 0; i < items; i++) {
            var item = PlanDesigner.FixedArea.createItem(itemUrl,
              this.bbox.x + stride / 2 + i * stride, this.startPoint.y + 10, 0);
            this.add(item);
          }
          for (var i = 0; i < items; i++) {
            var item = PlanDesigner.FixedArea.createItem(itemUrl,
              this.startPoint.x + stride / 2 + i * stride, this.startPoint.y + tableSize + 40, 180);
            this.add(item);
          }
          this.bbox = new Tarumae.Rect(this.startPoint.x, this.startPoint.y, availableSpace, tableSize + 90);
        } else {
          for (var i = 0; i < items; i++) {
            var item = PlanDesigner.FixedArea.createItem(itemUrl,
              this.startPoint.x + 10, this.startPoint.y + stride / 2 + i * stride, -90);
            this.add(item);
          }
          for (var i = 0; i < items; i++) {
            var item = PlanDesigner.FixedArea.createItem(itemUrl,
              this.startPoint.x + tableSize + 40, this.startPoint.y + stride / 2 + i * stride, 90);
            this.add(item);
          }
          this.bbox = new Tarumae.Rect(this.startPoint.x, this.startPoint.y, tableSize + 90, availableSpace);
        }
        
        break;

      case PlanDesigner.AreaPlanTypes.RestArea:
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 10, this.startPoint.y + 40, -90));
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 70, this.startPoint.y + 40, 90));
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 40, this.startPoint.y + 10, 180));
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 40, this.startPoint.y + 70, -180));
        var table = new Draw2D.Rect(this.startPoint.x + 30, this.startPoint.y + 30, 50, 50);
        table.style.strokeWidth = 1;
        table.style.fillColor = 'LightGreen';
        this.add(table);
        this.bbox = new Tarumae.Rect(this.startPoint.x, this.startPoint.y, 100, 100);
        break;

      case PlanDesigner.AreaPlanTypes.MealArea:
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 10, this.startPoint.y + 10, -45));
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 70, this.startPoint.y + 10, 45));
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 70, this.startPoint.y + 70, 90 + 45));
        this.add(PlanDesigner.FixedArea.createItem("images/LivingRoomChair-32.png",
          this.startPoint.x + 10, this.startPoint.y + 70, 90 + 90 + 45));
        var table = new Draw2D.Rect(this.startPoint.x + 30, this.startPoint.y + 30, 50, 50);
        table.angle = 45;
        table.style.strokeWidth = 1;
        table.style.fillColor = 'PeachPuff';
        this.add(table);
        this.bbox = new Tarumae.Rect(this.startPoint.x, this.startPoint.y, 100, 100);
        break;

      case PlanDesigner.AreaPlanTypes.DecorateArea:
        this.add(PlanDesigner.FixedArea.createItem(itemUrl,
          this.startPoint.x, this.startPoint.y, 0));
        this.bbox = new Tarumae.Rect(this.startPoint.x, this.startPoint.y, 32, 32);
        break;

      default:
      case PlanDesigner.AreaPlanTypes.ReservedArea:
        this.bbox = this.availableBbox;
        break;
    }

    switch (this.planType) {
      case PlanDesigner.AreaPlanTypes.WorkArea:
        if (horizontal) {
          var table1Rect = new Draw2D.Rect(this.startPoint.x + 10, this.startPoint.y + 40, availableSpace - 20, tableSize);
          table1Rect.style = workTableStyle;
          this.add(table1Rect);
        } else {
          var table1Rect = new Draw2D.Rect(this.startPoint.x + 40, this.startPoint.y + 10, tableSize, availableSpace - 20);
          table1Rect.style = workTableStyle;
          this.add(table1Rect);
        }
        break;

      case PlanDesigner.AreaPlanTypes.ConferenceArea:
        if (horizontal) {
          var table1Rect = new Draw2D.Rect(this.startPoint.x + 10, this.startPoint.y + 40, availableSpace - 20, tableSize);
          table1Rect.style = confTableStyle;
          this.add(table1Rect);
        } else {
          var table1Rect = new Draw2D.Rect(this.startPoint.x + 40, this.startPoint.y + 10, tableSize, availableSpace - 20);
          table1Rect.style = confTableStyle;
          this.add(table1Rect);
        }
        break;
    }

    this.designer.refreshUI();
  },

});

PlanDesigner.WallArea = function(designer, x, y, w, h) {
  PlanDesigner.WallArea.setup.call(this, designer, x, y, w, h);
};

Object.assign(PlanDesigner.WallArea, {
  prototype: new Draw2D.Rect(),
  
  setup: function(designer, x, y, w, h) {
    this.constructor.setup.call(this, x, y, w, h);

    this.designer = designer;
    this.style.fillColor = '#aaaaaa';
  },
});

Object.assign(PlanDesigner.WallArea.prototype, {
  
  layout: function() {
  },

  mousemove: function(e) {

  },

  draw: function(renderer) {
    renderer.drawRect(this.bbox, this.style.strokeWidth, this.style.strokeColor, this.style.fillColor); 
    this.ondraw(renderer);
  },
});

PlanDesigner.SimpleWallArea = function(designer, x, y, w, h) {
  PlanDesigner.WallArea.setup.call(this, designer, x, y, w, h);
    
  this.layout();
};

PlanDesigner.SimpleWallArea.prototype = new PlanDesigner.WallArea();

Object.assign(PlanDesigner.SimpleWallArea.prototype, {
  layout: function() {
    var horizontal = this.bbox.width > this.bbox.height;
    var availableSpace = horizontal ? this.bbox.width : this.bbox.height;
    
    var pillarSize = 20;
    var space = 50;
    var stride = pillarSize / 2 + space;
    var pillars = availableSpace / stride;

    if (horizontal) {
      for (var i = 0; i <= pillars; i++) {
        var r = new Draw2D.Rect(this.bbox.x + i * stride, this.bbox.y - 5, pillarSize, pillarSize);
        r.style = this.style;
        this.add(r);
      }
    } else {
      for (var i = 0; i <= pillars; i++) {
        var r = new Draw2D.Rect(this.bbox.x - 5, this.bbox.y + i * stride, pillarSize, pillarSize);
        r.style = this.style;
        this.add(r);
      }
    }
  },
});

class Wall extends Draw2D.Object {
  constructor() {
    super();
    
    this.startPosition = new Tarumae.Point();
    this.endPosition = new Tarumae.Point();
  }

  draw() {
    console.log('aaa');
  }
}

//PlanDesigner.Wall.prototype = new Draw2D.Object();

// Object.defineProperties(PlanDesigner.Wall.prototype, {
//   draw: {
//     value: function() {

//     },
//   }
// });