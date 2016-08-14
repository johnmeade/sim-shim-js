/*

This is an live demo of plotter-js.

Notes
* If you do not plot a static object, you might need
to double-click the plot once it turns black in
order to see anything
* Drag mouse to orbit and scroll to zoom
* Double-click the plot to retarget the camera
* Click the "run" button to execute this code and
replace the contents of the plot
* The plot target is a div with id "plot"

*/

// standard line plot
var square = {
  "color": "#ee1155", // optional
  "type": "lineplot",
  "data": [ [0,0,0], [1,0,0], [1,0,1], [0,0,1], [0,0,0] ]
};

// Parametric plot animation
var animHelix = {
  "type": "lineplot",
  "animated": true,
  "lineLength": 10000, // animations must be fixed length
  "xyz": [-2,-1,0], // initial condition
  // The "next" function must return the next point each frame.
  // Here, it creates a spiral
  "next": function () {
    var t = this.t;
    var p = [Math.sin(t) - 2, Math.cos(t) - 2, t/10];
    this.t += 1/50;
    this.t = this.t % 100;
    return p;
  },
  "t": 0, // you can use custom keys
};

// Other 3D animation
var wireCube = {
  "type": "lineplot",
  "animated": true,
  "lineLength": 300, // animations must be fixed length
  "xyz": [2,2,0], // initial point
  // The "next" function must return the next point each frame.
  // Here, it just returns a random point in the unit cube
  "next": function () {
    var x = 2 + Math.random(),
        y = 2 + Math.random(),
        z = Math.random();
    return [x,y,z];
  },
};

// import library
var SimShim = require('SimShim');

// intantiate a sim-shim object
var ss = new SimShim(
  document.getElementById("plot")
);

// add some plots
ss.addPlot( square    );
ss.addPlot( wireCube  );
ss.addPlot( animHelix );

// start rending
ss.start();
