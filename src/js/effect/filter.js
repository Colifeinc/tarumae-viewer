
Tarumae.Effect = function() {

};

Tarumae.PostFilter = function() {
  this.shader = null;
};

Tarumae.PostFilter.prototype = new Tarumae.Effect();

Tarumae.PostFilter.prototype.render = function(renderer) {
  renderer.useShader(this.shader);
  renderer.drawFrame();
};

Tarumae.GrayscaleFilter = function() {
  this.shader = null;
};

Tarumae.PostFilter.prototype = new Tarumae.Effect();

Tarumae.PostFilter.prototype.render = function(renderer) {
  renderer.useShader(this.shader);
  renderer.drawFrame();
};

