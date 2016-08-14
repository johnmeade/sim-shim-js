var plt = {
  "label": "lineplot | random 3D line sphere",
  "type": "lineplot",
  "animated": true,
  "lineLength": 300, // buffered geometry is fixed size
  "next": function () {
      var phi   = 2*Math.PI*Math.random(),
          theta = Math.PI*Math.random(),
          x     = Math.cos(phi)*Math.sin(theta),
          y     = Math.sin(phi)*Math.sin(theta),
          z     = Math.cos(theta);
      return [x,y,z];
  }
};

// var SimShim = require('SimShim');
// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
