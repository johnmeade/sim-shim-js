![logo](https://raw.githubusercontent.com/codemaker1999/sim-shim-js/master/logo-150px.png)

#### SimShim

3D Plotting and Animation Using WebGL
======================================

**Try it out and see examples at http://codemaker1999.github.io/sim-shim-js**

The main goals of this project are to provide

* a minimum-setup API for efficient 3D plotting and simulations using WebGL

* easily embeddable visualizations

* A rich set of examples to provide a starting point for common tasks


Examples
---------

There is an included set of examples that demonstrates all supported uses of
the library in the `examples` folder. See them in action (and fiddle with them)
[here](http://codemaker1999.github.io/sim-shim-js).


Usage
------

Plots are described by "manifests" (plain old JS Objects) that contain certain
properties. This basically works as follows:

* You must specify a `'type'` property, with a value of either `'lineplot'` or
  `'surfaceplot'`.

* You can specify the optional `'animated'` property and set it to `true` or
  `false`. This lets the lib know you are trying to create an animated plot.

* Now you can choose to specify the data yourself, or supply an expression
  string (like `'sin(x)+3*y'`) and have SimShim try to generate the data
  for you. This is done by specifying the `'parse'` property.

Once you have your manifest, you need to initialize the library with the dom
element you want to display the plot in. This can be done in several ways, as
shown in the first example below, which contains a triangle and a square:

```js
var triangle = {
    "type": "lineplot",
    "data": [[0,0,0], [0,0,1], [0, 0.5, 0.5], [0,0,0]]
};

var square = {
    "type": "lineplot",
    "data": [[0,0,0], [1,0,0], [1,1,0], [0,1,0], [0,0,0]]
};

var ss = new SimShim('#plot-div');
// or "var ss = new SimShim(document.getElementById('plot-div'));"
// or "var ss = new SimShim($('#plot-div'));"
ss.addPlot( triangle );
ss.addPlot( square );
ss.start();
```

In the next example we use the optional `animated` flag and ask SimShim to parse
some expression strings and generate the data for us. The result of the code
below is an animated spiral / helix:

```js
var animSpiral = {
    "type"      : "lineplot",
    "animated"  : true,
    // provide parametric components:
    // [ x(t), y(t), z(t) ]
    "parse"     : [ "sin(t)", "cos(t)", "t/10" ],
    // other needed properties for this plot type:
    "start"     : 0,
    "step"      : 1/40,
    // your line must have a finite number of points!
    "lineLength": 10000
};

var ss = new SimShim('#plot-div');
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

var ss = new SimShim('#plot-div');
ss.addPlot( blanket );
ss.start();
```

and to create an animated surface plot, you set the animated flag once again.
If you are also using the `parse` property, note that `'t'` is always
interpretted as time:

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

var ss = new SimShim('#plot-div');
ss.addPlot( pulsingBlanket );
ss.start();
```

Trying to remember which properties to use for specific plot types is very cumbersome, so there is a lot of built-in help for dealing with this problem. The `examples/` folder has a minimal example for each type of plot supported, so they're the best starting points. Otherwise, you can basically just guess your way through writing the manifests, as there is a built-in system that tells you (by logging errors in the console) if the manifest is missing any properties based on the type of plot you seem to be trying to create.

Once the manifest is done, SimShim will figure the rest out. There are many customizable options, some of which can be found in the examples at http://codemaker1999.github.io/sim-shim-js.


Controls
---------

The scheme used for controls is a camera looking at a point in space (the orbit target) that is some distance away from this point. The camera orbits around this point when the mouse is dragged, and gets closer / farther by zooming. More detail is below, with mobile phone browser instructions in square brackets.

* Drag the mouse [drag your finger] to orbit the camera around

* Double-click [double-tap] on the plot to retarget the camera. This computes the min and max bounds of all objects in the scene and positions the camera so that you can see everything (this is very useful! Especially for animations!)

* Scroll [pinch] to zoom closer to the camera orbit target

* Use the arrow keys to manually move the point the camera is looking at


Importing
----------

This is a fairly large library, and so it might take a bit of time for
your browser to download it. If you are not concerned about the load time
in your web page before all content is displayed, you can simply ignore this
and just make sure the script tag that imports this library is above any script
tags that make use of it in your html. If you want the best experience on your
site then you should do one of the following (or similar)

* [Recommended] Add a `defer` attribute to all `<script>` tags that import or
  use the library:
  ```html
  <script defer src=".../sim-shim-bundle.js"></script>
  <script defer src=".../your-simulation.js"></script>
  ```
  When this attribute is present, the script is run when the page is finished
  loading. The original order of the scripts is maintained when the browser
  processes deferred scripts (make sure you import the lib above the script tags
  that use it).

* Make sure your script tags are at the bottom of the `<body>` tag, after all
  other content, and that the tag that imports the library is above the scripts
  that use it.
  ```html
    <!-- ... -->
    <script src=".../sim-shim-bundle.js"></script>
    <script src=".../your-simulation.js"></script>
  </body>
  ```

* If you're using JQuery, you can import the library using JS (meaning you
  don't need to have a `<script>` tag for `sim-shim-bundle.js` in your html
  at all) like this:
  ```js
  // with JQuery

  $.getScript(".../sim-shim-bundle.js", function(){
    var ss = new SimShim('#plot');
    // ...
  });

  // without JQuery

  function getScript(url, callback) {
      // Adding the script tag to the head as suggested before
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;

      // Then bind the event to the callback function.
      // There are several events for cross browser compatibility.
      script.onreadystatechange = callback;
      script.onload = callback;

      // Fire the loading
      head.appendChild(script);
  }

  getScript(".../sim-shim-bundle.js", function(){
    var ss = new SimShim('#plot');
    // ...
  });
  ```


Notes and Tips
---------------

* Choice of variables are mostly up to you, for example `{"parse": "sin(x*y)", ...}` is equivelant to `{"parse": "sin(r*k)", ...}`. The exception to this is "t", which will always be treated as a "time" parameter when used in a surfaceplot.

* You can access the Three JS machinery through `ss.plotCtx[ prop ]`, where `prop` is one of `['camera', 'scene', 'renderer', 'controls', 'light', 'objects']`, and you can access the Three JS objects in the scene through `ss.plotCtx.objects[i].threeObj`.

* The `SimShim.addPlot` function returns a random string ID that is attached to the corresponding plot object `SimShim.plotCtx.objects[i].id`. To later remove a plot from the scene, do `var id = ss.addPlot( myPlot ); ss.removeById( id )`.

* You can add your own Three JS objects to the scene and / or add a function to the render loop by calling `ss.addObject( threeObj, updateFunction )`. Both arguments are optional, if you just need a static object or just need an update function.

* If you are plotting surfaces and the page is freezeing, try reducing the min and max bounds, and increasing the step size. You can easily and accidentally end up trying to compute millions or billions of points without realizing it! This is even worse for animated surfaces, so beware!

* For efficiency reasons there is a finite length to the trajectories being animated (A finite size buffer is created to hold the points being plotted), so animations will eventually start to disappear sequentially from where they start (they will continue to grow at the same rate, of course).

* For charts and graphs, try this: http://threegraphs.com/


Building
---------

```bash
npm install
# only un-minified files:
npm build-dev
npm watch-dev
# only minified files:
npm build-prod
npm watch-prod
# build both dev and production
npm build-all
```


What's Next?
-------------

* GUI features like buttons for fullscreen, floating plot labels, etc

* implicit surface plots, ie plotting `f(x,y,z)` such that `f(x,y,z) = 0`. The
  constraint on `f` yields `3-1=2` degrees of freedom, thus defining a surface
  (implicitly).

* built-in ODE simulation (runge kutta methods library)

* AND MORE!!!
