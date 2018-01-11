
Object.assign(PlanDesigner.prototype, {
  demoSetup: function() {
    var roomArea = new Tarumae.Rect(200, 100, 800, 600);

    var demoArea = new PlanDesigner.Area(this, roomArea.x + 15, roomArea.y + 20, roomArea.width - 20, roomArea.height - 10);
    demoArea.gridSizeX = 20;
    demoArea.gridSizeY = 20;
    this.demoArea = demoArea;
    this.add(demoArea);

    var outwallSize = 10;
    
    var outwallTop = new PlanDesigner.SimpleWallArea(this, roomArea.x - 5, roomArea.y + 5, roomArea.width, outwallSize);
    var outwallBottom = new PlanDesigner.SimpleWallArea(this, roomArea.x - 5, roomArea.bottom + 5, roomArea.width, outwallSize);
    var outwallLeft = new PlanDesigner.SimpleWallArea(this, roomArea.x, roomArea.y, outwallSize, roomArea.height);
    var outwallRight = new PlanDesigner.SimpleWallArea(this, roomArea.right - 20, roomArea.y, outwallSize, roomArea.height);
    
    this.scene.add(outwallTop, outwallBottom, outwallLeft, outwallRight);
  },

  demo1: function() {
    this.demoSetup();

    var area;

    area = this.demoArea.createFixedAreaFromIndex(0, 0, 26, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    
    area = this.demoArea.createFixedAreaFromIndex(0, 8, 13, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    
    area = this.demoArea.createFixedAreaFromIndex(13, 8, 1, 7);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(14, 8, 12, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);

    area = this.demoArea.createFixedAreaFromIndex(27, 0, 11, 6);
    area.layout(PlanDesigner.AreaPlanTypes.ConferenceArea);

    area = this.demoArea.createFixedAreaFromIndex(27, 8, 11, 6);
    area.layout(PlanDesigner.AreaPlanTypes.ConferenceArea);

    area = this.demoArea.createFixedAreaFromIndex(27, 6, 11, 2);
    area.layout(PlanDesigner.AreaPlanTypes.DecorateArea);

    ///
    area = this.demoArea.createFixedAreaFromIndex(29, 15, 3, 6);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(32, 15, 3, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(35, 15, 3, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(35, 18, 3, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(35, 21, 3, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);
    ///

    area = this.demoArea.createFixedAreaFromIndex(27, 15, 2, 8);
    area.layout(PlanDesigner.AreaPlanTypes.DecorateArea);

    area = this.demoArea.createFixedAreaFromIndex(0, 16, 26, 5);
    area.layout(PlanDesigner.AreaPlanTypes.RestArea);
    
    /// 
    area = this.demoArea.createFixedAreaFromIndex(0, 22, 13, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    
    area = this.demoArea.createFixedAreaFromIndex(13, 22, 1, 7);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(14, 22, 12, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    ///

    ///
    area = this.demoArea.createFixedAreaFromIndex(0, 21, 13, 1);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);
    
    area = this.demoArea.createFixedAreaFromIndex(13, 21, 1, 1);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);
    
    area = this.demoArea.createFixedAreaFromIndex(14, 21, 12, 1);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);
    ///

    area = this.demoArea.createFixedAreaFromIndex(27, 24, 11, 5);
    area.layout(PlanDesigner.AreaPlanTypes.MealArea);
  },

  demo2: function() {
    this.demoSetup();

    var area;

    ///
    area = this.demoArea.createFixedAreaFromIndex(3, 8, 13, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    
    area = this.demoArea.createFixedAreaFromIndex(16, 8, 1, 7);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(17, 8, 12, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    ///
    

    ///
    area = this.demoArea.createFixedAreaFromIndex(3, 16, 13, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    
    area = this.demoArea.createFixedAreaFromIndex(16, 16, 1, 7);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(17, 16, 12, 7);
    area.layout(PlanDesigner.AreaPlanTypes.WorkArea);
    ///
    
    ///
    area = this.demoArea.createFixedAreaFromIndex(0, 8, 2, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(0, 11, 2, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(0, 17, 2, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);
    
    area = this.demoArea.createFixedAreaFromIndex(0, 20, 2, 3);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    ///

    area = this.demoArea.createFixedAreaFromIndex(31, 0, 7, 11);
    area.layout(PlanDesigner.AreaPlanTypes.ConferenceArea, true);

    area = this.demoArea.createFixedAreaFromIndex(31, 12, 7, 11);
    area.layout(PlanDesigner.AreaPlanTypes.ConferenceArea, true);


    area = this.demoArea.createFixedAreaFromIndex(30, 0, 1, 9);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);
        
    area = this.demoArea.createFixedAreaFromIndex(30, 14, 1, 9);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);
    ///

    area = this.demoArea.createFixedAreaFromIndex(0, 0, 11, 6);
    area.layout(PlanDesigner.AreaPlanTypes.ConferenceArea);
    
    area = this.demoArea.createFixedAreaFromIndex(11, 0, 1, 6);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(12, 0, 11, 6);
    area.layout(PlanDesigner.AreaPlanTypes.ConferenceArea);
    
    area = this.demoArea.createFixedAreaFromIndex(24, 0, 6, 6);
    area.layout(PlanDesigner.AreaPlanTypes.MealArea);

    ///
    
    area = this.demoArea.createFixedAreaFromIndex(23, 0, 1, 6);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    ///

    area = this.demoArea.createFixedAreaFromIndex(0, 24, 11, 5);
    area.layout(PlanDesigner.AreaPlanTypes.RestArea);
    
    area = this.demoArea.createFixedAreaFromIndex(11, 24, 2, 6);
    area.layout(PlanDesigner.AreaPlanTypes.DecorateArea);
    
    area = this.demoArea.createFixedAreaFromIndex(12, 24, 11, 5);
    area.layout(PlanDesigner.AreaPlanTypes.RestArea);
   
    area = this.demoArea.createFixedAreaFromIndex(23, 24, 2, 6);
    area.layout(PlanDesigner.AreaPlanTypes.DecorateArea);
   
    area = this.demoArea.createFixedAreaFromIndex(25, 24, 2, 5);
    area.layout(PlanDesigner.AreaPlanTypes.ReservedArea);

    area = this.demoArea.createFixedAreaFromIndex(27, 24, 11, 5);
    area.layout(PlanDesigner.AreaPlanTypes.MealArea);
    
  },
});
