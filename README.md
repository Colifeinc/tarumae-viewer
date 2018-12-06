# Tarumae

Web viewer of tarumae engine using WebGL.

# Prepare development environment

```shell
yarn
```

Start development environment:

```shell
yarn dev
```

# Build package

```shell
yarn build
```

# Use Tarumae-Viewer

## Hello World

```js

import Tarumae, { Vec2, Vec3, Color3 } from "tarumae"

// create rendering context
const renderer = new Tarumae.Renderer();

// create scene
const scene = renderer.createScene();

// create a cube object
const cube = new Tarumae.Cube();

// add cube into scene
scene.add(cube);

// show the scene (begin rendering) 
scene.show();

```

