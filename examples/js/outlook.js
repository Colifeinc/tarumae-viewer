
import Tarumae from '../../src/js/tarumae.js';

window.addEventListener('load', function() {

  const renderer = new Tarumae.Renderer();

  const scene = renderer.createScene();
  window._scene = scene;
  
  // Download outlook images from Google Street View API
  // const baseurl = "https://maps.googleapis.com/maps/api/streetview?size=512x512&location=43.064000,141.357363&fov=90&"
  // const key = `&key=${process.env.GOOGLE_MAP_API_KEY}`;
  // const skyImageUrls = [
  //   baseurl + "heading=90&pitch=0" + key,
  //   baseurl + "heading=-90&pitch=0" + key,
  //   baseurl + "heading=0&pitch=90" + key,
  //   baseurl + "heading=0&pitch=-90" + key,
  //   baseurl + "heading=0&pitch=0" + key,
  //   baseurl + "heading=180&pitch=0" + key,
  //   ];

  const baseurl = "textures/cubemap/landscape/"
  const skyImageUrls = [
    baseurl + "px.jpg", baseurl + "nx.jpg", baseurl + "py.jpg",
    baseurl + "ny.jpg", baseurl + "pz.jpg", baseurl + "nz.jpg",
  ];

  const skybox = new Tarumae.SkyBox(renderer, skyImageUrls);
  scene.skybox = skybox;

  new Tarumae.TouchController(scene);

  scene.mainCamera.fieldOfView = 75;

  scene.show();
});