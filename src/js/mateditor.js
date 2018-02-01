var MatEditor = {
  renderer: null,
  scene: null,
  obj: {
    mesh: "../models/sphere.mesh",
    angle: [0, 0, 0],
    mat: {
      tex: null,//"textures/DefaultTile.jpg",
      normalmap: null,//"textures/DefaultTile_n.jpg",
      normalMipmap: 0,
      normalIntensity: 1.0,
      glossy: 0.5,
      roughness: 0.5,
      transparency: 0,
      color: [0.7, 0.7, 0.7],
      texTiling: [3, 3],
    },
    ondrag: function() {
      var _this = MatEditor;
      _this.obj.angle.x += _this.renderer.viewer.mouse.movement.y / 2;
      _this.obj.angle.y += _this.renderer.viewer.mouse.movement.x / 2;
      _this.scene.requireUpdateFrame();
    }
  },
  autoRotation: false,
  rotationInterval: null,
  rotate: function (){
    MatEditor.obj.angle.y += 0.3;
    MatEditor.scene.requireUpdateFrame();
  },
  update: function() {
    var obj = MatEditor.obj;
    var mat = obj.mat;

    mat.glossy = params.glossy;
    mat.roughness = params.roughness;
    mat.transparency = params.transparency;
    mat.color = params.color.map(function(value) { return value / 255});
    mat.texTiling = [params.texTilingX, params.texTilingY];
    mat.normalMipmap = params.normalMipmap;
    mat.normalIntensity = params.normalIntensity;
    
    if (params.reflection) {
      obj.refmap = MatEditor.skybox;
    } else {
      obj.refmap = null;
    }
    
    MatEditor.scene.requireUpdateFrame();
  },
  init: function(){
    Tarumae.Renderer.ContainerStyle = this.containerStyle;
    this.renderer = new Tarumae.Renderer({
      "baseShaderUrl": "../"
    });
    this.scene = this.renderer.createScene();

    var rm = new ResourceManager();
    var skybox = new Tarumae.CubeMap(this.renderer);
    rm.add([
      "skybox/right.jpg", ResourceTypes.Image,
      "skybox/left.jpg", ResourceTypes.Image,
      "skybox/top.jpg", ResourceTypes.Image,
      "skybox/bottom.jpg", ResourceTypes.Image,
      "skybox/front.jpg", ResourceTypes.Image,
      "skybox/back.jpg", ResourceTypes.Image,
    ]);

    rm.load(function() {
      skybox.setImages([
        rm.get("skybox/right.jpg"),
        rm.get("skybox/left.jpg"),
        rm.get("skybox/top.jpg"),
        rm.get("skybox/bottom.jpg"),
        rm.get("skybox/back.jpg"),
        rm.get("skybox/front.jpg"),
      ]);

      MatEditor.skybox = skybox;
      MatEditor.obj.refmap = skybox;
      MatEditor.update();
    });
    var objs = {
      light: {
        location: new Vec3(0.8, 5.0, 3.0),
        mat: {emission: 1.0}
      },
      sphere: this.obj
    };
    this.scene.add(objs);

    this.scene.sun.location.set(0, 10, 10);
    this.scene.sun.mat = { color: new Color3(0.15, 0.15, 0.15) };
    this.scene.mainCamera.location.set(0, 0, 2);
    this.scene.mainCamera.angle.set(0, 0, 0);
    this.scene.show();

    this.scene.onkeydown = function(key) {
      if (key == Tarumae.Viewer.Keys.Space) {
        var _this = MatEditor;
        _this.autoRotation = !_this.autoRotation;
        if (_this.autoRotation)
          _this.rotationInterval = setInterval(_this.rotate, 10);
        else
          clearInterval(_this.rotationInterval);
      }
    };

    this.datGUI(params);
    $('input[type="file"]').change(MatEditor.handleFile);

    this.renderer.setContainerStyle();
  },
  datGUI: function(params){
    var gui = new dat.GUI({autoPlace: false});
    console.log(gui.domElement);
    document.getElementById("mateditor").appendChild(gui.domElement);

    var glossy        = gui.add(params, 'glossy', 0, 1, 0.05);
    var roughness     = gui.add(params, 'roughness', 0, 1, 0.05);
    var transparency  = gui.add(params, 'transparency', 0, 1, 0.05);
    var color         = gui.addColor(params, 'color');

    var texture = gui.addFolder('Texture');
    texture.add(params, 'texture');
    texture.add(params, 'remove_tex');
    texture.open();

    var normalmap = gui.addFolder('Normal Map');
    normalmap.add(params, 'normalmap');
    normalmap.add(params, 'remove_normalmap');
    var normalMipmap = normalmap.add(params, 'normalMipmap', 0, 1, 0.05);
    var normalIntensity = normalmap.add(params, 'normalIntensity', 0, 5, 0.1);
    normalmap.open();

    var tiling  = gui.addFolder('Tiling');
    var tilingX = tiling.add(params, 'texTilingX', 1, 10, 0.1);
    var tilingY = tiling.add(params, 'texTilingY', 1, 10, 0.1);
    tiling.open();

    var reflection = gui.add(params, 'reflection');

    glossy.onChange(this.update);
    roughness.onChange(this.update);
    transparency.onChange(this.update);
    color.onChange(this.update);
    tilingX.onChange(this.update);
    tilingY.onChange(this.update);
    normalMipmap.onChange(this.update);
    normalIntensity.onChange(this.update);
    reflection.onChange(this.update);
  },
  handleFile: function(e){
    var file = e.target.files[0];
    var target = $(this).attr("id");
    if (file.type.match(/image.*/)) {
      var img = new Image();
      img.src = window.URL.createObjectURL(file);
      img.onload = function(){
        MatEditor.obj.mat[target] = new Tarumae.Texture(img);
        MatEditor.scene.requireUpdateFrame();
      };
    };
  },
  removeFile: function(id){
    this.obj.mat[id] = null;
    this.scene.requireUpdateFrame();
  },
  filePicker: function(id){
    $("#" + id).trigger("click");
  },
  containerStyle : [
    "#canvas-container { position: relative; }",
    "#canvas-container canvas, #canvas-container .surface { position: absolute; }",
    "#canvas-container canvas, #canvas-container .surface { top: 0; }",
    "#canvas-container canvas, #canvas-container .surface { left: 0; }",
    "#canvas-container canvas, #canvas-container .surface { width: 100%; }",
    "#canvas-container canvas, #canvas-container .surface { height: 100%; }"
  ]
}
