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
  "label": "surfaceplot, animated | sine blanket",
  "type": "surfaceplot",
  "rotation": [0,1,1],
  // helper keys
  "t": 0,
  "dt": 1/20,
  // required
  "animated": true,
  "minX": -5,
  "maxX": 5,
  "minY": -5,
  "maxY": 5,
  "next": function () {
      var t = this.t;
      var mesh = sineBlanket(-5,-5,5,5,1/3,t);
      this.t += this.dt;
      return mesh;
  }
};

// var SimShim = require('SimShim');
// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
