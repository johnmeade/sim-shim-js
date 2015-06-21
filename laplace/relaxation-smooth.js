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

function interpolate(mesh1, mesh2, n) {
    // Generate linear transition between the z values
    // of 2 meshes. This smooths out the animation so
    // we can see the first few steps of the relaxation.
    // n is the number of intermediate meshes to generate.
    if (n==0) return [mesh2];
    
    var meshes = [],
        hgt    = mesh1.length,
        wdt    = mesh1[0].length;
    
    for (var i=0; i<n; i++) {
        var mi = [];
        for (var y = 0; y < hgt; y++) {
            var row = [];
            for (var x = 0; x < wdt; x++) {
                var z1 = mesh1[y][x],
                    z2 = mesh2[y][x],
                    lower = Math.min(z1,z2),
                    higher = Math.max(z1,z2);
                row.push(lower + (i/n)*(higher-lower));
            }
            mi.push(row);
        }
        meshes.push(mi);
    }
    
    return meshes;
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
    // 'meshes' stores interpolated meshes to flesh out animation frames
    "meshes"   : [],
    "done"     : false,
    "next"     : function () {

        var thismesh = this.mesh;
        
        // stop if we are below tolerance
        if (this.done) return thismesh;
        
        // iterate mesh
        var maxdif;
        if (this.meshes.length === 0) {

            // iterate mesh
            var res = iterMesh(thismesh);
            maxdif = res[1];
            var newMesh = res[0];

            // n is the number of interpolation steps
            // it is fairly arbitrary, but will decrease
            // to 0 after several iterations
            var n = Math.floor(maxdif*50);

            // generate linear transition of meshes
            this.meshes = interpolate(thismesh, newMesh, n);

        };

        // get next mesh
        var mesh = this.meshes.pop();

        // check if we are below tolerance
        if (maxdif < eps) this.done = true;

        return mesh;
    }
};

ThreePlot.plot(
    [ plt ],
    document.getElementById("plot"),
    {
        "cameraPosn": [2.4325, -0.84350, 1.1971],
        "orbitTarget": [0.5, 0.5, 0.5]
    }
);