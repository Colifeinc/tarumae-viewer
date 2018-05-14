# Tarumae

Web viewer of tarumae engine using WebGL.

# Prepare development environment

First time to start up tarumae-viewer:

```
npm install -g parcel-bundler
```

Start demo:

```
npm start
```

# Build package

```
npm pack
```

To build a minified output:

```
npm run build
```

## Build release package

```
build/pack
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

