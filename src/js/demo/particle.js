
import Tarumae from "../entry"
import "../utility/*"
import "../scene/*"
import { Color4 } from "../math/vector";
import { setInterval } from "timers";

window.addEventListener('load', function() {

  const renderer = new Tarumae.Renderer({
    backColor: new Color4(0),
  });

  const scene = renderer.createScene();

  window._scene = scene;
 
  const count = 10000;
  const pm = new Tarumae.ParticleMesh(count);

  var particles = new Array();

  for (var i = 0; i < count; i++) {
    var x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, z = Math.random() * 2 - 1;
    particles.push({
      speed: Math.random(),
      angle: 0,
      x: x,
      y: y,
      z: z,
      ox: x * y,
      oy: y,
      oz: z,
      r: 1.0, //Math.random(),
      g: 1.0, //Math.random(),
      b: Math.random(),
    });
  }

  function update(p, i) {
    pm.vertexBuffer._s3_set(i * 3, p.x, p.y, p.z);
    pm.vertexBuffer._s3_set((count + i) * 3, p.r, p.g, p.b);
    pm.update();
  }

  const pobj = new Tarumae.ParticleObject();
  pobj.addMesh(pm);
  
  scene.add(pobj);

  function updateFrame() {
    for (var i = 0; i < count; i++) {
      var p = particles[i];
      p.x = p.ox + Math.sin(p.angle);
      p.y = p.oy + Math.sin(p.angle) * Math.cos(p.angle);
      p.z = p.oz + Math.cos(p.angle);
      p.angle += p.speed * 0.2;
  
      update(p, i);
    }
    
    scene.requireUpdateFrame();
    requestAnimationFrame(updateFrame);
  }

  requestAnimationFrame(updateFrame);

  //scene.animation = true;
  
  new Tarumae.TouchController(scene);

  scene.show();
});