![npm](https://img.shields.io/npm/v/tarumae-viewer.svg)

# Tarumae

Tarumae is optimized WebGL engine for showcase application. 
Tarumae-viewer is the web viewer of tarumae engine using WebGL.

# Setting up development environment

```shell
yarn
```

Start development environment:

```shell
yarn serve
```

# Build release

```shell
yarn pub
```

All files published as npm package content are located in `dist` folder.

# Use Tarumae-Viewer

## Hello World

```js
import Tarumae, { Vec3, Color3 } from "tarumae"

// create rendering context
const renderer = new Tarumae.Renderer();

// create scene
const scene = renderer.createScene();

// create a cube object
const cube = new Tarumae.Shapes.Cube();

// add cube into scene
scene.add(cube);

// show the scene (begin rendering) 
scene.show();
```

## Set material

Initialize material object:

```js
cube.mat = {};
```

```js
// color
cube.mat.color = new Color3(1, 0, 0); // red (0 ~ 1)

// glossy (mirror reflection)
cube.mat.glossy = 0.7; // (0 ~ 1)

```

### Set resources via async download

```js

// texture
renderer.createTextureFromURL("/public/mytex.png", tex => {
  cube.mat.tex = tex;
});

// normalmap
renderer.createTextureFromURL("/public/mynormalmap.png", tex => {
  cube.mat.normalmap = tex;
});
```


