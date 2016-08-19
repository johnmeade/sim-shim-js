/*
This is an live fiddle / demo of sim-shim.

Notes
* Basic saving is supported. When you click the run button, the contents of the
  editor are saved to your browser. This is useful for playing around, but
  you should save a copy of anything important on your computer!
* For reasons outside of my control, it is very difficult to remove objects
  from memory that have been plotted. If this page gets slow, save a copy of
  your code and refresh the page

Controls
* Double-click the plot to re-center the camera
* Drag mouse to orbit
* Scroll to zoom
* The "Reset Editor Text" button will revert this code to it's original form
* The "Run" button will run the code here in your browser and update the plot

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
