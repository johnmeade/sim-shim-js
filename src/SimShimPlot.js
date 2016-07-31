import SimShimUtil from './SimShimUtil';


export default class SimShimPlot {

  constructor (obj, id, color, shading) {

    this.id = id;

    // parse plottable object into an iterator that updates ThreeJS geometries
    this.obj = obj;

    switch (obj.type) {
      case 'lineplot':
        this._initLineplot(color);
        break;

      case 'surfaceplot':
        this._initSurface(color, shading);
        break;

      // TODO: "ode3", "pde3", "graph", ...?

      default:
        throw `Unexpected plot type '${obj.type}'`;
    }
  }

  _initLineplot(color) {

    let obj = this.obj;

    // convert to the 'manual' form of lineplot
    if (obj.parse) {

      // fns holds the parsed x(t), y(t), and z(t) funcitons
      var fns = [];
      for (var i = 0; i < obj.parse.length; i++) {

        var tree     = math.parse(obj.parse[i]),
            symNames = SimShimUtil.uniqueSymbolNames( tree ),
            compiled = tree.compile();

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
      if (obj.animated) {
        // create 'next' function
        obj.t = obj.start;
        obj.dt = obj.step;
        obj.next = (function (fns) {
          return function () {
            var t   = this.t,
                xyz = [fns[0](t), fns[1](t), fns[2](t)];
            this.t += this.dt;
            return xyz;
          };
        })(fns);
        // set initial condition
        obj.xyz = obj.next();
      }

      // static lineplot
      else {
        // sample from the fns
        var start = obj.start,
            end   = obj.end,
            dt    = obj.step,
            data  = [];
        for (var t = start; t < end; t+=dt) {
          data.push([fns[0](t), fns[1](t), fns[2](t)]);
        };
        obj.data = data;
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
    if (obj.animated) {

      geometry = new THREE.Geometry();
      geometry.dynamic = true;

      // initialize all points in geometry to the initial point
      var xyzArray = obj.next();
      var xyz = new THREE.Vector3( xyzArray[0], xyzArray[1], xyzArray[2] );
      for (var j=0; j<obj.lineLength; j++) {
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
      for (var j=0; j<obj.data.length; j++) {
        var xyz = new THREE.Vector3( obj.data[j][0], obj.data[j][1], obj.data[j][2]);
        geometry.vertices.push(xyz);
      }

      traj = new THREE.Line(geometry, material);
      this.threeObj = traj;
      // don't change geometry on update
      this.update = function () {};
    };

    return traj;
  }

  _initSurface(color, shading) {

    let obj = this.obj;

    if (obj.parse) {
      // Parse the string provided and add a mesh + update function
      var fn,
          tree     = math.parse(obj.parse),
          symNames = SimShimUtil.uniqueSymbolNames( tree ),
          compiled = tree.compile(),
          maxAllowedVars = 2;
      // special case for animations
      if (symNames.indexOf("t") != -1) maxAllowedVars++;

      if (symNames.length <= maxAllowedVars) {
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
      if (obj.animated) {
        // create 'next' function
        obj.t  = obj.start;
        obj.next = (function (fn) {
          return function () {
            // sample from the fn
            var minX = this.minX,
                maxX = this.maxX,
                minY = this.minY,
                maxY = this.maxY,
                t    = this.t,
                dt   = this.dt,
                step = this.step,
                mesh = [];
            // construct initial condition
            for (var i = minX; i < maxX; i+=step) {
              var row = [];
              for (var j = minY; j < maxY; j+=step) {
                row.push( fn([i,j], t) );
              };
              mesh.push( row );
            };
            this.t += dt;
            return mesh;
          };
        })(fn);
        // set initial condition
        obj.mesh = obj.next();
      } else {
        // sample from the fn
        var minX = obj.minX,
            maxX = obj.maxX,
            minY = obj.minY,
            maxY = obj.maxY,
            step = obj.step,
            data = [];
        for (var i = minX; i < maxX; i+=step) {
          var row = [];
          for (var j = minY; j < maxY; j+=step) {
            row.push( fn([i,j]) );
          };
          data.push( row );
        }
        obj.data = data;
      }
    } // end parsing

    // materials
    var material = new THREE.MeshLambertMaterial({
        color: color,
        shading: shading,
        side: THREE.DoubleSide,
    });
    if (obj.wireframe) { // TODO fix
      var wireframeMaterial = new THREE.MeshBasicMaterial({
        color: obj.wireframeColor || 0xeeeeee,
        wireframe: true,
        transparent: true
      });
    }

    // forward declare
    var geometry = {};
    var mesh = {};

    if (obj.animated) {
      geometry = SimShimUtil.makeSurfaceGeometry(
        obj.minX, obj.minY, obj.maxX, obj.maxY, obj.mesh
      );
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      if (obj.wireframe) {
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
        var geo = SimShimUtil.makeSurfaceGeometry(
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
      geometry = SimShimUtil.makeSurfaceGeometry(
        obj.minX, obj.minY, obj.maxX, obj.maxY, obj.data
      );
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      mesh = new THREE.Mesh( geometry, material );
      this.threeObj = mesh;
      // don't change geometry
      this.update = function () {};
    };

    // rotate to specified normal
    // TODO allow quaternion input
    if (obj.rotation) {
      var up = new THREE.Vector3(0,0,1);
      var rotn = new THREE.Vector3(
          obj.rotation[0],
          obj.rotation[1],
          obj.rotation[2]
      );
      rotn.normalize();
      var q = new THREE.Quaternion().setFromUnitVectors(up, rotn)
      mesh.setRotationFromQuaternion(q);
    };

    return mesh;

    break;

  }

}
