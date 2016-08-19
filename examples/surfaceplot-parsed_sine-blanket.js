var plt = {
  // optional
  "label": "surfaceplot, parsed | sine blanket",
  "rotation": [0,0,1],
  // required
  "type": "surfaceplot",
  "parse": "sin(x)+cos(y)", // this is f(x,y), where z=f(x,y)
  "minX": -10,
  "maxX": 10,
  "minY": -10,
  "maxY": 10,
  "step": 1/10
};

// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
