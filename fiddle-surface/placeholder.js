/*|
|*|  Boilerplate for a simple z=f(x,y) surface plot.
|*|
|*|  Be careful with the min/max bounds and the dx parameter,
|*|  the page will likely crash if you try to plot millions
|*|  of points.
|*|
|*|  Tune the performance of the plot by adjusting the dx
|*|  parameter. the quality of the plot makes a big difference
|*|  in performance.
|*|
|*|  If the page becomes sluggish, reload. This editor attempts
|*|  to save your code to your browser when you click run... but
|*|  for anything other than fiddling, you should save a copy in
|*|  your code editor!
|*|
|*/

var minX = -2.5,
    minY = -2.5,
    maxX = 2.5,
    maxY = 2.5,
    dx   = 0.03,
    pow = Math.pow,
    sqrt = Math.sqrt,
    sin = Math.sin,
    cos = Math.cos,
    ln = Math.log,
    abs = Math.abs
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
  "type": "surfaceplot",
  "minX": minX,
  "minY": minY,
  "maxX": maxX,
  "maxY": maxY,
  "data": createMesh(minX, minY, maxX, maxY, dx, z),
};


var ss = new SimShim(
  document.getElementById("plot")
);

ss.addPlot( plt );

ss.start();
