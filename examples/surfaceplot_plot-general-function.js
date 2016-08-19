var minX = -2.5,
    minY = -2.5,
    maxX = 2.5,
    maxY = 2.5,
    dx   = 0.03,
    pow = math.pow,
    sqrt = math.sqrt,
    sin = math.sin,
    cos = math.cos,
    ln = math.log,
    abs = math.abs
    ;

function z (x,y) {
  // change this line:
  return sin(x*x + y);
}

function createMesh(minx,miny,maxx,maxy,step,fn) {
  // create 2D array of z values for plotting
  var sb = [];
  for (var i = minx; i < maxx; i+=step) {
    var row = [];
    for (var j = miny; j < maxy; j+=step) {
      row.push( fn(i,j) );
    }
    sb.push( row );
  }
  return sb;
}

var plt = {
  // optional
  "label": "surfaceplot | general function z=f(x,y)",
  // required
  "type": "surfaceplot",
  "minX": minX,
  "minY": minY,
  "maxX": maxX,
  "maxY": maxY,
  "data": createMesh(minX, minY, maxX, maxY, dx, z),
};

// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
