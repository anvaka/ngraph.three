# ngraph.three

This is a 3d graph renderer, which uses [three.js](https://github.com/mrdoob/three.js) as a rendering engine. 
This library is a part of [ngraph](https://github.com/anvaka/ngraph) project. 
Please check out [ngraph.pixel](https://github.com/anvaka/ngraph.pixel) - it is also developed with three.js,
however it uses lower level primitive ([ShaderMaterial](http://threejs.org/docs/#Reference/Materials/ShaderMaterial))
which allows it to be really fast (the price is flexibility of your UI model).

# usage

Basic example:

``` js
// Create graph:
var createGraph = require('ngraph.graph');
var graph = createGraph();
graph.addLink(1, 2);

// And render it
var nthree = require('ngraph.three');
var graphics = nthree(graph);

graphics.run(); // begin animation loop
```

Very often it is required to do something with scene before animation frame is rendered. To do so
use `onFrame()` callback:

``` js
var nthree = require('ngraph.three');
var graphics = nthree(graph);

graphics.onFrame(function() {
 console.log('Frame is being rendered');
});
graphics.run(); // begin animation loop
```

# Configuration

You can configure renderer in many ways. To do so you can pass `settings` object to the function. Calling

``` js
var nthree = require('ngraph.three');
var graphics = nthree(graph);
```

Is equivalent of calling:

``` js
var nthree = require('ngraph.three');
var graphics = nthree(graph, {
   // allow users to zoom/pan with mouse wheel:
  interactive: true,
  
  // DOM element where to render the graph:
  container: document.body,
  
  // Custom settings for physics engine simulator
  physicsSettings: {
      // Ideal length for links (springs in physical model).
      springLength: 30,

      // Hook's law coefficient. 1 - solid spring.
      springCoeff: 0.0008,

      // Coulomb's law coefficient. It's used to repel nodes thus should be negative
      // if you make it positive nodes start attract each other :).
      gravity: -1.2,

      // Theta coefficient from Barnes Hut simulation. Ranged between (0, 1).
      // The closer it's to 1 the more nodes algorithm will have to go through.
      // Setting it to one makes Barnes Hut simulation no different from
      // brute-force forces calculation (each node is considered).
      theta: 0.8,

      // Drag force coefficient. Used to slow down system, thus should be less than 1.
      // The closer it is to 0 the less tight system will be
      dragCoeff: 0.02,

      // Default time step (dt) for forces integration
      timeStep : 20
   },
  
  // custom 3d layout:
  layout: require('ngraph.forcelayout3d')(graph, this.physicsSettings),
  
  // Custom three.js renderer:
  renderer: isWebGlSupported ? new THREE.WebGLRenderer(this) : new THREE.CanvasRenderer(this),

  // allow clients to reuse custom three.js scene:
  scene: new THREE.Scene(),  
  
  // custom three.js camera:
  camera: new THREE.PerspectiveCamera(75, this.container.clientWidth/container.clientHeight, 0.1, 3000)
});
```

You can always override any of these settings with your own.

# examples
Many examples are available in [ngraph](https://github.com/anvaka/ngraph/tree/master/examples/three.js) repository

# install

With [npm](https://npmjs.org) do:

```
npm install ngraph.three
```

# license

MIT
