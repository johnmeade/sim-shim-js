/*|
|*|  Drag the mouse to rotate the plot. Edit the code here
|*|  and click the run button to see the effect.
|*|
|*|  This is the series solution to Laplace's equation on
|*|  a square, with 3 sides held at 0 and one side held at
|*|  a constant, v0.
|*|
|*/

var pi    = math.PI,
    pow   = math.pow,
    sin   = math.sin,
    sinh  = math.sinh,
    terms = 20, // 10 non-zero terms + 10 zero terms
    v0    = 1,
    l     = 1,
    dx    = 0.01 // quality of plot
    ;

function z_n (n,x,y) {
    // one term in power series for z
    var t1 = v0*(1 - pow(-1, n)),
        t2 = n*pi*sinh(n*pi),
        t3 = 2*sinh(n*pi*y/l),
        t4 = sin(n*pi*x/l);
    return t1 * t3 * t4 / t2;
}

function z (x,y) {
    // calculate z up up to 'terms' number of terms
    var res = 0;
    for (var i = 1; i <= terms; i++) {
        res += z_n(i,x,y);
    }
    return res;
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
    "minX": 0,
    "minY": 0,
    "maxX": l,
    "maxY": l,
    "data": createMesh(0, 0, l, l, dx, z),
};

var ss = new SimShim(
  document.getElementById("plot"),
  {
    "cameraPosn": [-1.1585, -0.84029, 1.7159],
    "orbitTarget": [0.5, 0.5, 0.5]
  }
);

ss.addPlot( plt );

ss.start();
