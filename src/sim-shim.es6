class SimShimPlotCtx {
  constructor (renderer, scene, camera, controls, light) {
    this.renderer = renderer;
    this.scene    = scene;
    this.camera   = camera;
    this.controls = controls;
    this.light    = light;
    this.plots    = [];
  }

  render () {
    this.renderer.render(this.scene, this.camera);
  }
}

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
        var xyz = new THREE.Vector3( plot.xyz[0], plot.xyz[1], plot.xyz[2] );
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

class SimShim {

  constructor(plotTarget, settings = {}) {
    this.ids = [];
    this.paused = false;

    /*\
    |*|  Unpack settings
    \*/

    this._userDefinedCam      = Boolean(settings.cameraPosn); // flag
    settings.far            = settings.far            || 500;
    settings.near           = settings.near           || 0.005;
    settings.showGrid       = settings.showGrid       || true; // TODO
    settings.showAxes       = settings.showAxes       || true; // TODO
    settings.ctrlType       = settings.ctrlType       || "orbit";
    settings.clearColor     = settings.clearColor     || "#111";
    settings.autoRotate     = settings.autoRotate     || false;
    settings.cameraPosn     = settings.cameraPosn     || [0,0,0];
    settings.cameraAngle    = settings.cameraAngle    || 45;
    settings.orbitTarget    = settings.orbitTarget    || [0,0,0];
    settings.lightIntensity = settings.lightIntensity || 0.85;

    /*\
    |*|  Constants
    \*/

    const FAR           = settings.far,
          NEAR          = settings.near,
          WIDTH         = plotTarget.offsetWidth,
          HEIGHT        = plotTarget.offsetHeight,
          AUTOROT       = settings.autoRotate,
          CTRLTYPE      = settings.ctrlType,
          SHOWGRID      = settings.showGrid,
          SHOWAXES      = settings.showAxes,
          CAMANGLE      = settings.cameraAngle,
          CAMERAPOSN    = settings.cameraPosn,
          CLEARCOLOR    = new THREE.Color( settings.clearColor ),
          ORBITTARGET   = settings.orbitTarget,
          LIGHTINTESITY = settings.lightIntensity
          ;

    /*\
    |*|  Set up ThreeJS
    \*/

    // -----------------------------------------------------
    // Renderer
    var renderer = new THREE.WebGLRenderer({

        // TODO expose more options?
        // scale: SCALE,
        // brightness: 2,
        // antialias: true
    });
    renderer.setSize( WIDTH, HEIGHT );
    // renderer.domElement.style.top = "0px";
    // renderer.domElement.style.left = "0px";
    renderer.domElement.style.margin = "0px";
    renderer.domElement.style.padding = "0px";
    renderer.setClearColor( CLEARCOLOR );
    plotTarget.appendChild( renderer.domElement );

    // -----------------------------------------------------
    // Scene

    var scene = new THREE.Scene();

    // -----------------------------------------------------
    // Camera

    var camera = new THREE.PerspectiveCamera(CAMANGLE, WIDTH/HEIGHT, NEAR, FAR);
    camera.position.x = CAMERAPOSN[0];
    camera.position.y = CAMERAPOSN[1];
    camera.position.z = CAMERAPOSN[2];
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(ORBITTARGET);
    scene.add(camera);

    // -----------------------------------------------------
    // Controls

    var controls;
    switch (CTRLTYPE) {

      case "fly":
      if (!THREE.FlyControls) throw "Error: "+
        "Please include FlyControls.js before plotting";
      controls = new THREE.FlyControls( camera );
      controls.dragToLook = true;
      break;

      case "orbit":
      if (!THREE.OrbitControls) throw "Error: "+
        "Please include OrbitControls.js before plotting";
      controls = new THREE.OrbitControls( camera, renderer.domElement );
      controls.target.x = ORBITTARGET[0];
      controls.target.y = ORBITTARGET[1];
      controls.target.z = ORBITTARGET[2];
      controls.autoRotate = AUTOROT;
      break;

      default:
      throw "Argument Error: Invalid control type '"+CTRLTYPE+"'";
      break;

    }

    // -----------------------------------------------------
    // Light

    var light = new THREE.DirectionalLight( 0xffffff, LIGHTINTESITY );
    scene.add(light);

    // -----------------------------------------------------
    // Animate

    // create plot context
    this.plotCtx = new SimShimPlotCtx(renderer, scene, camera, controls, light);

    // -----------------------------------------------------
    // Events

    // retarget camera (helpful for animations)
    plotTarget.addEventListener(
      'dblclick',
      (e) => {
        if (this.plotCtx.plots.length === 0) return;
        this.updateMetrics();
        this.retargetCamera();
      },
      false
    );

    // resize
    window.addEventListener(
      'resize',
      ((rend, cam) => {
        return () => {
          var W = rend.domElement.offsetWidth,
              H = rend.domElement.offsetHeight;
          cam.aspect = W / H;
          cam.updateProjectionMatrix();
          rend.setSize( W, H );
        }
      })(this.plotCtx.renderer, this.plotCtx.camera),
      false
    );

  }

  setPaused (bool) {
    this.paused = bool;
  }

  addPlot (plot, settings = {}) {
    // add/parse color
    var color = settings.color ?
                new THREE.Color(settings.color) :
                new THREE.Color().setHSL(Math.random(),80/100,65/100);

    // shading type
    var sh;
    switch (settings.shading) {
      case 'smooth':
        sh = THREE.SmoothShading;
        break;
      case 'flat':
        sh = THREE.FlatShading;
        break;
      default:
        sh = THREE.SmoothShading;
    }

    // make unique alpha-num string
    var id;
    do id = Math.random().toString(36).slice(2);
    while (this.ids.indexOf(id) != -1);
    this.ids.push(id);

    // parse into wrapper
    var _plot = new SimShimPlot( plot, this.plotCtx.scene, color, sh );
    _plot.id = id;
    this.plotCtx.plots.push( _plot );

    return id;
  }

  addObject (obj, settings = {}) {
    // add/parse color
    var color = settings.color ?
                new THREE.Color(settings.color) :
                new THREE.Color().setHSL(Math.random(),80/100,65/100);

    // make unique alpha-num string
    var id;
    do id = Math.random().toString(36).slice(2);
    while (this.ids.indexOf(id) != -1);

    this.ids.push(id);
    obj.id = id;

    this.plotCtx.plots.push( obj );
    if (obj.threeObj) this.plotCtx.scene.add( obj.threeObj );

    return id;
  }

  getPlot (id) {
    return this.plotCtx.plots.find((p)=>{p.id == id});
  }

  kill () {
    // remove all SimShimPlots and pause
    for (let i=0; i<this.plotCtx.plots.length; i++) {
      let p = this.plotCtx.plots[i];
      this.plotCtx.scene.remove( p.threeObj );
    }
    this.plotCtx.plots = [];
    this.ids = [];
    this.paused = true;
  }

  removeById (id) {
    let ind = this.ids.indexOf( id );
    if (ind > -1) {
      let match = -1;
      for (let i=0; i<this.plotCtx.plots.length; i++) {
        if (this.plotCtx.plots[i].id == id) {
          match = i;
          break;
        }
      }
      if (match > -1) {
        this.plotCtx.scene.remove( ps[match].threeObj );
        this.plotCtx.plots.splice( match, 1 );
        this.ids.splice( ind, 1 );
      }
    } else {
      console.warn("No plot with id "+id+", did not remove any plots.");
    }
  }

  setSettings (settings = {}) {

    for (let k in settings) {
      switch (k) {
        case 'cameraPosn':
          this.plotCtx.camera.position.setX(settings[k][0]);
          this.plotCtx.camera.position.setY(settings[k][1]);
          this.plotCtx.camera.position.setZ(settings[k][2]);
          this.plotCtx.camera.updateProjectionMatrix();
          break;
        case 'cameraAngle':
          this.plotCtx.camera.fov = settings[k];
          this.plotCtx.camera.updateProjectionMatrix();
          break;
        case 'orbitTarget':
          this.plotCtx.controls.target.setX(settings[k][0]);
          this.plotCtx.controls.target.setY(settings[k][1]);
          this.plotCtx.controls.target.setZ(settings[k][2]);
          this.plotCtx.controls.update(1);
          break;
        case 'lightIntensity':
          this.plotCtx.light.intensity = settings[k];
          break;
        case 'autoRotate':
          this.plotCtx.controls.autoRotate = settings[k];
          break;
      }
    }
  }

  updateMetrics () {
    var res = {
      "maxX": 0, "maxY": 0, "maxZ": 0,
      "minX": 0, "minY": 0, "minZ": 0,
    };

    // set Max and Min helper
    function setMaxMin (data) {
      for (let j = 0; j < data.length; j++) {
        var px = data[j][0] || data[j].x,
            py = data[j][1] || data[j].y,
            pz = data[j][2] || data[j].z;
        // set max
        res.maxX = px > res.maxX ? px : res.maxX;
        res.maxY = py > res.maxY ? py : res.maxY;
        res.maxZ = pz > res.maxZ ? pz : res.maxZ;
        // set min
        res.minX = px < res.minX ? px : res.minX;
        res.minY = py < res.minY ? py : res.minY;
        res.minZ = pz < res.minZ ? pz : res.minZ;
      }
    }

    // iterate
    for (let i = 0; i < this.plotCtx.plots.length; i++) {
        let p = this.plotCtx.plots[i];
        if (p.threeObj) setMaxMin( p.threeObj.geometry.vertices );
    }

    // compute extra metrics
    res.midX    = (res.maxX + res.minX)/2;
    res.midY    = (res.maxY + res.minY)/2;
    res.midZ    = (res.maxZ + res.minZ)/2;
    res.distX   = (res.maxX - res.minX)/2;
    res.distY   = (res.maxY - res.minY)/2;
    res.distZ   = (res.maxZ - res.minZ)/2;
    res.maxDist = Math.sqrt(
      Math.pow(res.distX, 2) +
      Math.pow(res.distY, 2) +
      Math.pow(res.distZ, 2)
    );
    res.center  = new THREE.Vector3(res.midX, res.midY, res.midZ);

    this.plotCtx.metrics = res;
  }

  retargetCamera () {
    var M = this.plotCtx.metrics,
        relativeCameraPosn = new THREE.Vector3(
            M.distX, M.distY, M.distZ
        ).multiplyScalar(3),
        cameraPosn = relativeCameraPosn.add(M.center);
    // Camera
    this.plotCtx.camera.position.x = cameraPosn.x;
    this.plotCtx.camera.position.y = cameraPosn.y;
    this.plotCtx.camera.position.z = cameraPosn.z;
    this.plotCtx.camera.lookAt(M.center);
    if (THREE.OrbitControls && this.plotCtx.controls instanceof THREE.OrbitControls) {
      this.plotCtx.controls.target.copy(M.center);
    };
  }

  animate () {
    // loop
    window.requestAnimationFrame( () => { this.animate() } );

    // increment iterator plot objects
    if (!this.paused) {
      for (var j = 0; j < this.plotCtx.plots.length; j++) {
        this.plotCtx.plots[j].update();
      }

      // update controls and lights
      this.plotCtx.controls.update( 1 );
      this.plotCtx.light.position.copy( this.plotCtx.camera.position );
      this.plotCtx.light.lookAt( this.plotCtx.metrics.center );
    }

    // render
    this.plotCtx.render();
  }

  start () {
    this.plotCtx.render();

    // Update Scene (Lights, Camera)
    this.updateMetrics();
    if (!this._userDefinedCam) this.retargetCamera();
    this.plotCtx.light.position.copy( this.plotCtx.camera.position );
    this.plotCtx.light.lookAt( this.plotCtx.metrics.center );

    // start the render loop
    window.requestAnimationFrame =
      window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
    	function (cb) { window.setTimeout( cb, 1000 / 60 ) };
    this.animate();
  }
}
