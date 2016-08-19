var plt = {
  // optional
  "label": "surfaceplot, parsed, animated | sine blanket",
  // required
  "type": "surfaceplot",
  "animated": true,
  "parse": "sin(t/10)*(sin(x)+sin(y))", // "t" variable is always time
  "minX" : -6,
  "maxX" : 6,
  "minY" : -6,
  "maxY" : 6,
  "step" : 0.3,
  "start": 0,
  "dt"   : 1/20
};

// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
