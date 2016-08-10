import SimShimSanitize from 'SimShimSanitize';
import SimShimPlotCtx from 'SimShimPlotCtx';
import SimShimPlot from 'SimShimPlot';
import SimShimUtil from 'SimShimUtil';

module.exports = class SimShim {

  constructor(plotTarget, settings = {}) {
    this.ids = [];
    this.paused = false;

    /*\
    |*|  Sanitize
    \*/

    // try to parse the plot target

    if (typeof plotTarget === 'string') {
      // '#plot'
      plotTarget = document.querySelector(plotTarget);
    } else if (plotTarget instanceof Array) {
      // $('.plot')
      plotTarget = plotTarget[0];
    }

    if (!(plotTarget instanceof Element)) {
      throw new Error('First argument of SimShim constructor must be a selector string, jquery selection array, or an Element');
    }

    SimShimSanitize.checkSettings(settings, 'throw');

    /*\
    |*|  Unpack / Initialize Settings
    \*/

    let setns = {};

    setns.userDefinedCam     = Boolean(settings.cameraPosn);
    setns.far                = settings.far            || 500;
    setns.near               = settings.near           || 0.005;
    setns.showGrid           = settings.showGrid       || true; // TODO
    setns.showAxes           = settings.showAxes       || true; // TODO
    setns.ctrlType           = settings.ctrlType       || "orbit";
    setns.clearColor         = settings.clearColor     || "#111";
    setns.autoRotate         = settings.autoRotate     || false;
    setns.cameraPosn         = settings.cameraPosn     || [0,0,0];
    setns.cameraAngle        = settings.cameraAngle    || 45;
    setns.orbitTarget        = settings.orbitTarget    || [0,0,0];
    setns.lightIntensity     = settings.lightIntensity || 0.85;

    /*\
    |*|  Conversions
    \*/

    // accept arrays from users, but work with Vector3 internally
    setns.cameraPosn = SimShimUtil.toVec3( setns.cameraPosn );
    setns.orbitTarget = SimShimUtil.toVec3( setns.orbitTarget );

    /*\
    |*|  Constants
    \*/

    const WIDTH         = plotTarget.offsetWidth,
          HEIGHT        = plotTarget.offsetHeight,
          FAR           = setns.far,
          NEAR          = setns.near,
          SHOWGRID      = setns.showGrid,
          SHOWAXES      = setns.showAxes,
          CTRLTYPE      = setns.ctrlType,
          AUTOROT       = setns.autoRotate,
          CAMERAPOSN    = setns.cameraPosn,
          CAMANGLE      = setns.cameraAngle,
          ORBITTARGET   = setns.orbitTarget,
          LIGHTINTESITY = setns.lightIntensity,
          CLEARCOLOR    = new THREE.Color( setns.clearColor )
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
    camera.position.set( CAMERAPOSN );
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt( ORBITTARGET );
    scene.add(camera);

    // -----------------------------------------------------
    // Controls

    var controls;
    switch (CTRLTYPE) {

      case "fly":
        if (!THREE.FlyControls) throw new Error("Error: "+
          "Please include FlyControls.js before plotting");
        controls = new THREE.FlyControls( camera );
        controls.dragToLook = true;
        break;

      case "orbit":
        if (!THREE.OrbitControls) throw new Error("Error: "+
          "Please include OrbitControls.js before plotting");
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.target.set( ORBITTARGET );
        controls.autoRotate = AUTOROT;
        break;

      default:
        throw new Error(`Argument Error: Invalid control type "${CTRLTYPE}"`);
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
        this.retargetCamera();
      },
      false
    );

    // resize
    let resizeCallback
    window.addEventListener(
      'resize',
      () => {
        let W = plotTarget.offsetWidth,
            H = plotTarget.offsetHeight
        clearTimeout(resizeCallback)
        resizeCallback = setTimeout(
          () => {
            camera.aspect = W / H
            camera.updateProjectionMatrix()
            renderer.setSize( W, H )
          },
          400
        )
      },
      false
    );

  }

  setPaused (bool) {
    this.paused = bool;
  }

  isPaused() {
    return this.paused;
  }

  addPlot (plot, settings = {}) {
    try {

      SimShimSanitize.checkPlotObj(plot, 'throw'); // throws

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
      let ssPlot = new SimShimPlot( plot, id, color, sh ); // throws
      this.plotCtx.scene.add( ssPlot.threeObj );
      this.plotCtx.plots.push( ssPlot );

      return id;

    } catch (e) {
      if (e.stack) console.error(e.stack);
      else console.error(e);
      console.warn('addPlot returning null');
      return null;
    }
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
    return this.plotCtx.plots.find( (p) => p.id == id );
  }

  // remove all SimShimPlots and pause
  kill () {
    for (let i=0; i<this.plotCtx.plots.length; i++) {
      let p = this.plotCtx.plots[i];
      this.plotCtx.scene.remove( p.threeObj );
    }
    this.plotCtx.plots = [];
    this.ids = [];
    this.paused = true;
  }

  removeById (id) {
    let idIdx = this.ids.indexOf( id );
    let plotIdx = this.plotCtx.plots.findIndex((p) => p.id == id);
    if (idIdx == -1) console.warn(`Plot id ${id} not tracked by SimShim (did you use the 'addPlot' method?)`);
    else this.ids.splice( idIdx, 1 );
    if (plotIdx == -1) console.warn(`No plot with id ${id} found, no plots removed`);
    else {
      this.plotCtx.scene.remove( this.plotCtx.plots[plotIdx].threeObj );
      this.plotCtx.plots.splice( plotIdx, 1 );
    }
  }

  // replace any given settings
  setSettings (settings = {}) {

    SimShimSanitize.checkSettings(settings, 'warn');

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
        default:
          console.warn(`Cannot modify setting "${k}", skipping this key`);
          break;
      }
    }
  }

  retargetCamera () {
    var M = this.plotCtx.updateMetrics(),
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
    if (!this.userDefinedCam) this.retargetCamera();
    this.plotCtx.light.position.copy( this.plotCtx.camera.position );
    this.plotCtx.light.lookAt( this.plotCtx.metrics.center );

    // polyfill animation frames
    window.requestAnimationFrame = window.requestAnimationFrame
                                || window.webkitRequestAnimationFrame
                                || window.mozRequestAnimationFrame
                                || window.oRequestAnimationFrame
                                || window.msRequestAnimationFrame
                                || ((cb) => window.setTimeout( cb, 1000 / 60 ));
    // start the render loop
    this.animate();
  }
}
