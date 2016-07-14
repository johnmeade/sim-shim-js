import SimShimPlotCtx from 'SimShimPlotCtx';
import SimShimPlot from 'SimShimPlot';

module.exports = class SimShim {

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
    return this.plotCtx.plots.find((p)=>{ return p.id == id });
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
        this.plotCtx.scene.remove( this.plotCtx.plots[match].threeObj );
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

// module.exports = SimShim;
