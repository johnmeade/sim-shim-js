Breaking Change
----------------

The library has been moved to a CommonJS pattern.
The new API requires that you add the following line:
```js
var SimShim = require('SimShim');
// Now, as before:
//   var ss = new SimShim( target );
//   ss.addPlot( plt );
//   ...
```


3D Plotting and Animation Using WebGL
======================================

The main goals of this project are to provide

* a minimum-setup API for efficient 3D plotting and simulations using WebGL

* easily embeddable visualizations

* A rich set of examples to provide a starting point for common tasks

Usage
------

Create a valid plottable object, and provide a DIV or something for the plot to live in.

There are several types of plottable objects, including lines in 3D space, animated 3D lines, and surface plots. For example, to make an interactive plot containing a triangle and a square, you could write:

```js
var triangle = {
    "type": "lineplot",
    "data": [[0,0,0], [0,0,1], [0, 0.5, 0.5], [0,0,0]]
};

var square = {
    "type": "lineplot",
    "data": [[0,0,0], [1,0,0], [1,1,0], [0,1,0], [0,0,0]]
};

var SimShim = require('SimShim');
var ss = new SimShim( htmlElement );
ss.addPlot( triangle );
ss.addPlot( square );
ss.start();
```

to create an animated spiral:

```js
var animSpiral = {
    "type"      : "lineplot",
    "animated"  : true,
    // provide parametric components:
    // [ x(t), y(t), z(t) ]
    "parse"     : [ "sin(t)", "cos(t)", "t/10" ],
    "start"     : 0,
    "step"      : 1/40,
    "lineLength": 10000
};

var SimShim = require('SimShim');
var ss = new SimShim( htmlElement );
ss.addPlot( animSpiral );
ss.start();
```

to create a surface plot, say a sinusoidal blanket:

```js
var blanket = {
    "type"  : "surfaceplot",
    // provide f(x,y), where z=f(x,y)
    "parse" : "sin(x)+cos(y)",
    "minX"  : -10,
    "maxX"  : 10,
    "minY"  : -10,
    "maxY"  : 10,
    "step"  : 1/10
};

var SimShim = require('SimShim');
var ss = new SimShim( htmlElement );
ss.addPlot( blanket );
ss.start();
```

and to create an animated surface plot, you might write:

```js
var pulsingBlanket = {
    "type": "surfaceplot",
    "animated": true,
    // "t" is always interpretted as time
    "parse": "sin(t)*(sin(x)+sin(y))",
    "minX" : -6,
    "maxX" : 6,
    "minY" : -6,
    "maxY" : 6,
    "step" : 1/4, // dx and dy
    "start": 0,
    "dt"   : 1/20
};

var SimShim = require('SimShim');
var ss = new SimShim( htmlElement );
ss.addPlot( pulsingBlanket );
ss.start();
```

SimShim will figure the rest out. There are many customizable options, check out `/examples/api-overview.js` if you want a quick reference to them.

**Try it out and see examples at http://codemaker1999.github.io/sim-shim-js**

Notes and Tips
---------------

* Choice of variables are mostly up to you, for example `{"parse": "sin(x*y)", ...}` is equivelant to `{"parse": "sin(r*k)", ...}`. The exception to this is "t", which will always be treated as a "time" parameter when used in a surfaceplot.

* Double-click on the plot to retarget the camera (this is useful for animations).

* You can access the Three JS machinery through `things = ['camera', 'scene', 'renderer', 'controls', 'light']; ss.plotCtx[ things[i] ]`, and you can access the Three JS objects in the scene through `ss.plotCtx.plots[i].threeObj`.

* The `SimShim.addPlot` function returns a random string ID that is attached to the corresponding plot object `SimShim.plotCtx.plots[i].id`. To later remove a plot from the scene, do `var id = ss.addPlot( myPlot ); ss.removeById( id )`.

* You can add your own arbitrary objects to the render loop by creating an object `obj` that has a function `obj.update()` (called every frame) and optionally a Three JS object at `obj.threeObj`. Add it to the render loop using `ss.addObject( objWithUpdateMethod )`.

* If you are plotting surfaces and the page is freezeing, try reducing the min and max bounds, and increasing the step size. You can easily and accidentally end up trying to compute millions or billions of points without realizing it! This is even worse for animated surfaces, so beware!

* For efficiency reasons there is a finite length to the trajectories being animated (A finite size buffer is created to hold the points being plotted), so animations will eventually start to disappear sequentially from where they start (they will continue to grow at the same rate, of course).

* For charts and graphs, try this: http://threegraphs.com/

Building
---------

Bower is used for grabbing dependencies, and brunch is used for compilation.
To set up:

```
npm install
bower install
```

Then, to build:

```
brunch build
brunch build --production
```

Note: the `--production` flag generates the minified files
