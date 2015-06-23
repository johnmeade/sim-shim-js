/*|
|*|  Drag the mouse to rotate the plot. Edit the code here
|*|  and click the run button to see the effect. Try decreasing
|*|  dx for a smoother graph (decent computers can handle 1/30
|*|  or 1/40 without much lag).
|*|
|*|  This is an animation of the relaxation solution to Laplace's
|*|  equation on a square, with 3 sides held at 0 and one side
|*|  held at a constant, v0.
|*|
|*|  Algorithm:
|*|
|*|  1. guess any solution to the equation (here I use the
|*|     plane z=v0 because it provides a good visual result)
|*|
|*|  2. Apply the relaxation condition for Laplace's
|*|     equation to iterate the graph
|*|
|*|  3. Adjust boundary points to satisfy boundary conditions
|*|
|*|  4. While iterating, store the max value of V'_ij - V_ij
|*|     across all (i,j) pairs, and stop applying the relaxation
|*|     condition if this value is sufficiently small.
|*|     Otherwise go to step 2
|*|
|*/

var pi   = math.PI,
    pow  = math.pow,
    sin  = math.sin,
    sinh = math.sinh,
    v0   = 1,         // constant potential
    l    = 1,         // side length
    eps  = 0.00005,   // tolerance
    dx   = 1/10       // quality of surface
    ;

function guess (x,y) {
  // intentional bad guess for cool visual
  return v0;
}

function createMesh(minx,miny,maxx,maxy,step,fn) {
  // this creates a 2D array of z values
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

function iterMesh(mesh) {
  // return relaxation iteration and max value of V'ij - Vij
  var maxVal = 0,
      hgt    = mesh.length,
      wdt    = mesh[0].length,
      m      = [];

  for (var j = 0; j < hgt; j++) {
    var row = [];
    for (var i = 0; i < wdt; i++) {
      // up, down, left and right adjacent values.
      // also enforce boundary conditions here
      var u = (j-1)<0   ? 0  : mesh[j-1][ i ],
          d = (j+2)>hgt ? v0 : mesh[j+1][ i ],
          l = (i-1)<0   ? 0  : mesh[ j ][i-1],
          r = (i+2)>wdt ? 0  : mesh[ j ][i+1],
          m_ji = (1/4)*(u+d+l+r),
          dif = math.abs(m_ji-mesh[j][i]);
      row.push(m_ji);
      maxVal = maxVal > dif ? maxVal : dif;
    }
    m.push(row);
  }
  return [m, maxVal];
}

var plt = {
  "type"     : "surfaceplot",
  "animated" : true,
  "minX"     : 0,
  "minY"     : 0,
  "maxX"     : 1,
  "maxY"     : 1,
  "start"    : 0,
  "mesh"     : createMesh(0,0,1,1,dx, guess),
  "done"     : false,
  "next"     : function () {
    var thismesh = this.mesh;

    // stop if we are below tolerance
    if (this.done) return thismesh;

    // iterate mesh
    var res = iterMesh(thismesh);
    var maxdif = res[1];
    var newMesh = res[0];

    // check if we are below tolerance
    if (maxdif < eps) this.done = true;

    // return new mesh
    return newMesh;
  }
};

var ss = new SimShim(
  document.getElementById("plot"),
  {
    "cameraPosn": [ -1.1585, -0.84029, 1.7159 ],
    "orbitTarget": [0.5, 0.5, 0.5]
  }
);

ss.addPlot( plt );

ss.start();
