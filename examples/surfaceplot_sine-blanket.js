// Create a 2D array of z values. SimShim interpolates the x and y components
// from the "minX", "maxX", etc keys.
function sineBlanket(minx,miny,maxx,maxy,step,t) {
  var sb = [];
  t = t || Math.PI/2;
  for (var i = minx; i < maxx; i+=step) {
    var row = [];
    for (var j = miny; j < maxy; j+=step) {
      row.push( (Math.sin(i) + Math.cos(j))*Math.sin(t) );
    }
    sb.push( row );
  }
  return sb;
}

var plt = {
  // optional
  "label": "surfaceplot | sine blanket",
  "type": "surfaceplot",
  "rotation": [0,1,1], // rotate after plotting
  // required
  "minX": -10,
  "maxX": 10,
  "minY": -10,
  "maxY": 10,
  "data": sineBlanket(-10,-10,10,10,0.5)
};

// var SimShim = require('SimShim');
// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
