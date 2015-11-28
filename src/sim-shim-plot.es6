class SimShimPlot {
  constructor (plot, scene, color, shading) {
    // parse plottable object into an iterator that updates ThreeJS geometries
    this.obj = plot;

    switch (plot.type) {
      case "lineplot":

      /**  PARSE INPUT  **/

      // convert to the 'manual' form of lineplot
      if (plot.parse) {

        // fns holds the parsed x(t), y(t), and z(t) funcitons
        var fns = [];
        for (var i = 0; i < plot.parse.length; i++) {

          var tree     = math.parse(plot.parse[i]),
              symNames = this.uniqueSymbolNames( tree ),
              compiled = tree.compile(math);

          if (symNames.length > 1) throw "Argument Error: "+
            "Please use 0 or 1 symbols for parsed lineplot functions";

          fns.push(
            (function (cpd, symNames) {
              return function (t) {
                var s = {};
                if (symNames.length > 0) s[symNames[0]] = t;
                return cpd.eval(s);
              }
            })(compiled, symNames)
          );

        }

        // animated lineplot
        if (plot.animated) {
          // create 'next' function
          plot.t = plot.start;
          plot.dt = plot.step;
          plot.next = (function (fns) {
            return function () {
              var t   = this.t,
                  xyz = [fns[0](t), fns[1](t), fns[2](t)];
              this.t += this.dt;
              return xyz;
            };
          })(fns);
          // set initial condition
          plot.xyz = plot.next();
        }

        // static lineplot
        else {
          // sample from the fns
          var start = plot.start,
              end   = plot.end,
              dt    = plot.step,
              data  = [];
          for (var t = start; t < end; t+=dt) {
            data.push([fns[0](t), fns[1](t), fns[2](t)]);
          };
          plot.data = data;
        };

      }

      /**  BUILD THREE JS OBJECT  **/

      // TODO support for custom shaders
      var material = new THREE.LineBasicMaterial({
          color: color,
          linewidth: 2
      });
      var geometry = {};
      var traj = {};

      // animated lineplot
      if (plot.animated) {

        geometry = new THREE.Geometry();
        geometry.dynamic = true;

        // initialize all points in geometry to the initial point
        var xyzArray = plot.next();
        var xyz = new THREE.Vector3( xyzArray[0], xyzArray[1], xyzArray[2] );
        for (var j=0; j<plot.lineLength; j++) {
          geometry.vertices.push(xyz);
        }

        traj = new THREE.Line(geometry, material);
        traj.frustumCulled = false;

        // plot
        this.threeObj = traj;
        this.update = function () {
          var xyz = this.obj.next();
          var new_xyz = new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
          this.obj.xyz = new_xyz;
          // update trajectory
          this.threeObj.geometry.vertices.shift();
          this.threeObj.geometry.vertices.push(new_xyz);
          this.threeObj.geometry.verticesNeedUpdate = true;
        };

      }

      // static lineplot
      else {
        geometry = new THREE.Geometry();

        // fill the geometry with provided points
        for (var j=0; j<plot.data.length; j++) {
          var xyz = new THREE.Vector3( plot.data[j][0], plot.data[j][1], plot.data[j][2]);
          geometry.vertices.push(xyz);
        }

        traj = new THREE.Line(geometry, material);
        this.threeObj = traj;
        // don't change geometry on update
        this.update = function () {};
      };

      scene.add(traj);

      break;

      // -------------------------------------------------------------------------
      // -------------------------------------------------------------------------

      case "surfaceplot":

      if (plot.parse) {
        // convert into the other form and continue
        var fn;
        var tree     = math.parse(plot.parse),
            symNames = this.uniqueSymbolNames( tree ),
            compiled = tree.compile(math),
            reqNumVars = 3;
        // special case for animations
        if (symNames.indexOf("t") != -1) reqNumVars++;

        if (symNames.length < reqNumVars) {
          fn = (function (cpd, vnames) {
                return function (vars, t) {
                  var s = {}, j = 0;
                  for (var i = 0; i < vnames.length; i++) {
                    // NOTE: input symbols are used in order they
                    // appear in the input funciton string (except t)
                    if (typeof t != "undefined" && vnames[i] === "t") {
                      s["t"] = t;
                      j++;
                    } else {
                      s[vnames[i]] = vars[i-j];
                    };
                  };
                  return cpd.eval(s);
                }
              })(compiled, symNames);
        } else {
          throw "Invalid Surfaceplot 'parse' Parameter: use 0, 1, or 2 symbols, " +
            "plus 't' if you are animating a surface.";
        }
        // now we have a fns array
        // handle animation
        if (plot.animated) {
          // create 'next' function
          plot.t  = plot.start;
          plot.dt = plot.step;
          plot.next = (function (fn) {
            return function () {
              // sample from the fn
              var minX = this.minX,
                  maxX = this.maxX,
                  minY = this.minY,
                  maxY = this.maxY,
                  t    = this.t,
                  dt   = this.dt,
                  mesh = [];
              // construct initial condition
              for (var i = minX; i < maxX; i+=dt) {
                var row = [];
                for (var j = minY; j < maxY; j+=dt) {
                  row.push( fn([i,j], t) );
                };
                mesh.push( row );
              };
              this.t += dt;
              return mesh;
            };
          })(fn);
          // set initial condition
          plot.mesh = plot.next();
        } else {
          // sample from the fn
          var minX = plot.minX,
              maxX = plot.maxX,
              minY = plot.minY,
              maxY = plot.maxY,
              step = plot.step,
              data = [];
          for (var i = minX; i < maxX; i+=step) {
            var row = [];
            for (var j = minY; j < maxY; j+=step) {
              row.push( fn([i,j]) );
            };
            data.push( row );
          }
          plot.data = data;
        }
      } // end parsing

      // materials
      var material = new THREE.MeshLambertMaterial({
          color: color,
          shading: shading,
          side: THREE.DoubleSide,
      });
      if (plot.wireframe) {
        var wireframeMaterial = new THREE.MeshBasicMaterial({
          color: plot.wireframeColor || 0xeeeeee,
          wireframe: true,
          transparent: true
        });
      }

      // forward declare
      var geometry = {};
      var mesh = {};

      if (plot.animated) {
        geometry = this.makeSurface(
          plot.minX, plot.minY, plot.maxX, plot.maxY, plot.mesh
        );
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        if (plot.wireframe) {
          var multiMaterial = [ material, wireframeMaterial ];
          mesh = THREE.SceneUtils.createMultiMaterialObject(
            geometry,
            multiMaterial
          );
        } else {
          mesh = new THREE.Mesh( geometry, material );
        }
        this.threeObj = mesh;
        this.update = function () {
          var plt = this.obj;
          plt.mesh = plt.next();
          // replace entire geometry object
          // TODO better implementation
          var geo = this.makeSurface(
            plt.minX, plt.minY, plt.maxX, plt.maxY, plt.mesh
          );
          geo.computeFaceNormals();
          geo.computeVertexNormals();
          geo.verticesNeedUpdate = true; // flag for update
          // threeJS holds references to geometries in object3Ds,
          // so we must call .dispose() to avoid memory leaks
          this.threeObj.geometry.dispose();
          this.threeObj.geometry = geo;
        };
      } else {
        geometry = this.makeSurface(
          plot.minX, plot.minY, plot.maxX, plot.maxY, plot.data
        );
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        mesh = new THREE.Mesh( geometry, material );
        this.threeObj = mesh;
        // don't change geometry
        this.update = function () {};
      };

      // rotate to specified normal
      if (plot.rotation) {
        var up = new THREE.Vector3(0,0,1);
        var rotn = new THREE.Vector3(
            plot.rotation[0],
            plot.rotation[1],
            plot.rotation[2]
        );
        rotn.normalize();
        var q = new THREE.Quaternion().setFromUnitVectors(up, rotn)
        mesh.setRotationFromQuaternion(q);
      };

      // add to scene and quit
      scene.add(mesh);

      break;

      // -------------------------------------------------------
      // TODO: "ode3", "pde3", "graph", ...
    }
  }

  makeSurface (minX,minY,maxX,maxY,data) {
    var geometry = new THREE.Geometry();
    // add vertices
    var wid = data[0].length;
    var hgt = data.length;
    var dy = (maxY - minY)/hgt;
    var dx = (maxX - minX)/wid;
    for (var j = 0; j < hgt; j++) {
      for (var i = 0; i < wid; i++) {
        var v = new THREE.Vector3(
          minX + i*dx,
          minY + j*dy,
          data[j][i]
        );
        geometry.vertices.push(v);
      }
    };
    // create triangles
    var triangles = [];
    for (var j = 0; j < hgt - 1; j++) {
      for (var i = 0; i < wid - 1; i++) {
        // up-left, up-right, etc. points
        var ul = data[j][i],
            ur = data[j][i+1],
            dl = data[j+1][i],
            dr = data[j+1][i+1],
            ind_ul =     j*wid + i,
            ind_ur =     j*wid + (i+1),
            ind_dl = (j+1)*wid + i,
            ind_dr = (j+1)*wid + (i+1);
        // create 2 faces from 4 points
        geometry.faces.push(new THREE.Face3(
          ind_ul, ind_ur, ind_dl
        ));
        geometry.faces.push(new THREE.Face3(
          ind_ur, ind_dr, ind_dl
        ));
      }
    }

    return geometry;
  }

  uniqueSymbolNames (tree) {
    // return the unique symbolNodes of tree
    // filter the SymbolNodes out
    var arr = tree.filter((node) => {
      return node.type == 'SymbolNode';
    });
    // get unique list of names
    var dummy = {}, names = [];
    for(var i = 0, l = arr.length; i < l; ++i){
      if(!dummy.hasOwnProperty(arr[i].name)) {
        names.push(arr[i].name);
        dummy[arr[i].name] = 1;
      }
    }
    return names;
  }
}
