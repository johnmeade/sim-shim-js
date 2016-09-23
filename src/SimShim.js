import THREE from 'three'

import SimShimSanitize from './SimShimSanitize'
import SimShimPlotCtx from './SimShimPlotCtx'
import SimShimObj from './SimShimObj'
import SimShimUtil from './SimShimUtil'
import { ParseError } from './Errors'

import FlyControls from '../vendor/threejs-extras/FlyControls'
import OrbitControls from '../vendor/threejs-extras/OrbitControls'


export default class SimShim {


  /**
   * Creates a new instance of SimShim. You can have as many instances as you
   * want, but you should probably avoid this when possible.
   *
   * @param {string OR Element OR JQuery selection array} plotTarget - The
   *   renderer will be attached to this element. It can be specified as a
   *   string (querySelector) which will be queried, an Element which is used
   *   directly, or the output of a JQuery query like `$('#my-plot-div')`
   *
   * @param {JSON Object} settings - [Optional] Specify additional details such
   *   as where the camera should be positioned / pointing, the background color
   *   of the plot, the light intensity to shine on the plot (for surfaces), etc
   */
  constructor(plotTarget, settings = {}) {
    this.ids = []
    this.paused = false

    /*\
    |*|  Sanitize
    \*/

    // try to parse the plot target

    if (typeof plotTarget === 'string') {
      // '#plot'
      plotTarget = document.querySelector(plotTarget)
    } else if (plotTarget instanceof Array) {
      // $('.plot')
      plotTarget = plotTarget[0]
    }

    if (!(plotTarget instanceof Element)) {
      throw new Error('First argument of SimShim constructor must be a selector string, jquery selection array, or an Element')
    }

    SimShimSanitize.checkSettings(settings, 'throw')

    /*\
    |*|  Unpack / Initialize Settings
    \*/

    let setns = {}

    setns.userDefinedCam     = Boolean(settings.cameraPosn)
    setns.far                = settings.far                || 500
    setns.near               = settings.near               || 0.005
    setns.showGrid           = settings.showGrid           || true // TODO
    setns.showAxes           = settings.showAxes           || true // TODO
    setns.ctrlType           = settings.ctrlType           || "orbit"
    setns.clearColor         = settings.clearColor         || "#111"
    setns.autoRotate         = settings.autoRotate         || false
    setns.cameraPosn         = settings.cameraPosn         || [0,0,0]
    setns.cameraAngle        = settings.cameraAngle        || 45
    setns.orbitTarget        = settings.orbitTarget        || [0,0,0]
    setns.lightIntensity     = settings.lightIntensity     || 0.85

    /*\
    |*|  Conversions
    \*/

    // accept arrays from users, but work with Vector3 internally
    setns.cameraPosn = SimShimUtil.toVec3( setns.cameraPosn )
    setns.orbitTarget = SimShimUtil.toVec3( setns.orbitTarget )

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


    /*\
    |*|  Set up ThreeJS
    \*/

    // -----------------------------------------------------
    // Renderer

    if (!window.__simshim_renderer__)
      window.__simshim_renderer__ = new THREE.WebGLRenderer({
          // TODO expose more options?
          // scale: SCALE,
          // brightness: 2,
          // antialias: true
      })
    let renderer = window.__simshim_renderer__
    renderer.setSize( WIDTH, HEIGHT )
    // renderer.domElement.style.top = "0px"
    // renderer.domElement.style.left = "0px"
    renderer.domElement.style.margin = "0px"
    renderer.domElement.style.padding = "0px"
    renderer.setClearColor( CLEARCOLOR )
    plotTarget.appendChild( renderer.domElement )

    // -----------------------------------------------------
    // Scene

    let scene = new THREE.Scene()

    // -----------------------------------------------------
    // Camera

    let camera = new THREE.PerspectiveCamera(CAMANGLE, WIDTH/HEIGHT, NEAR, FAR)
    camera.position.set( CAMERAPOSN )
    camera.up = new THREE.Vector3(0,0,1)
    camera.lookAt( ORBITTARGET )
    scene.add(camera)

    // -----------------------------------------------------
    // Controls

    let controls
    switch (CTRLTYPE) {

      case "fly":
        controls = new FlyControls( camera )
        controls.dragToLook = true
        break

      case "orbit":
        controls = new OrbitControls( camera, renderer.domElement )
        controls.target.set( ORBITTARGET )
        controls.autoRotate = AUTOROT
        break

      default:
        throw new Error(`[SimShim] Argument Error: Invalid control type "${CTRLTYPE}"`)
        break

    }

    // -----------------------------------------------------
    // Light

    let light = new THREE.DirectionalLight( 0xffffff, LIGHTINTESITY )
    scene.add(light)

    // -----------------------------------------------------
    // Animate

    // create plot context
    this.plotCtx = new SimShimPlotCtx(renderer, scene, camera, controls, light)

    // -----------------------------------------------------
    // Events

    // retarget camera (helpful for animations)
    plotTarget.addEventListener(
      'dblclick',
      (e) => {
        if (this.plotCtx.objects.length === 0) return
        this.retargetCamera()
      },
      false
    )

    // resize (only fire event after 500ms of no resize events)
    let resizeCallback
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeCallback)
        resizeCallback = setTimeout(
          () => {
            let W = plotTarget.offsetWidth,
                H = plotTarget.offsetHeight
            camera.aspect = W / H
            camera.updateProjectionMatrix()
            renderer.setSize( W, H )
          },
          500
        )
      },
      false
    )

    // force bind the scope just in case of weird edge cases
    this.setPaused = this.setPaused.bind(this)
    this.getPaused = this.getPaused.bind(this)
    this.addPlot = this.addPlot.bind(this)
    this.addObject = this.addObject.bind(this)
    this.getById = this.getById.bind(this)
    this.removeObject = this.removeObject.bind(this)
    this.removeAllObjects = this.removeAllObjects.bind(this)
    this.removeById = this.removeById.bind(this)
    this.setSettings = this.setSettings.bind(this)
    this.retargetCamera = this.retargetCamera.bind(this)
    this.animate = this.animate.bind(this)
    this.start = this.start.bind(this)
  }


  /**
   * Pause or unpause the animation with this setter
   *
   * @param {boolean} bool - Truthy values are coerced into booleans
   */
  setPaused (bool) {
    this.paused = Boolean(bool)
  }


  /**
   * @returns {boolean} - True if the animation is paused
   */
  getPaused() {
    return this.paused
  }


  /**
   * Creates a SimShimObj with the provided plot manifest
   *
   * @param {JSON Object} plot - The manifest of the plot object you would like
   *   generated
   *
   * @param {JSON Object} settings - [Optional] Additional options modifying the
   *   colour of the plot object and it's shading (for surfaces)
   *
   * @returns {string} - Alpha-numeric string ID to later retrieve the
   *   object with
   */
  addPlot (plot, settings = {}) {
    try {

      SimShimSanitize.checkPlotObj(plot, 'throw') // throws

      // add/parse color
      let color = settings.color ?
                  new THREE.Color(settings.color) :
                  new THREE.Color().setHSL(Math.random(),80/100,65/100)

      // shading type
      let shading
      switch (settings.shading) {
        case 'smooth':
          shading = THREE.SmoothShading
          break
        case 'flat':
          shading = THREE.FlatShading
          break
        default:
          shading = THREE.SmoothShading
      }

      // make unique alpha-num string
      let id
      do id = Math.random().toString(36).slice(2)
      while (this.ids.indexOf(id) != -1)
      this.ids.push(id)

      // parse into wrapper
      let ssPlot = SimShimObj.fromPlotManifest( id, plot, { color, shading } ) // throws
      this.plotCtx.scene.add( ssPlot.threeObj )
      this.plotCtx.objects.push( ssPlot )

      return id

    } catch (e) {
      if (e.stack) console.error(e.stack)
      else console.error(e)
      console.warn('[SimShim] addPlot returning null')
      return null
    }
  }


  /**
   * Creates a SimShimObj with optional ThreeJS object and an optional update
   * function to be called in the render loop.
   *
   * @param {THREE.Object3D} threeObj - [Optional] if an Object3D is given here,
   *   it is added to the scene.
   *
   * @param {function()} updateFunction - [Optional] if a function is given here,
   *   it is added to the render loop and called every frame.
   *
   * @returns {string} - Alpha-numeric string ID to later retrieve the
   *   object with
   *
   * @example
   * var ss = new SimShim('#plot-div');
   * ss.addObject(null, myCoolFunc);
   * ss.addObject(myCoolObject, null);
   */
  addObject (threeObj, updateFunction) {

    if (!(threeObj instanceof THREE.Object3D)) threeObj = null
    if (typeof updateFunction !== 'function') updateFunction = () => {}

    // make unique alpha-num string
    let id
    do id = Math.random().toString(36).slice(2)
    while (this.ids.indexOf(id) != -1)

    this.ids.push(id)
    this.plotCtx.objects.push( new SimShimObj(id, {}, threeObj, updateFunction) )
    if (threeObj) this.plotCtx.scene.add( threeObj )

    return id
  }


  /**
   * Retrieve a plot based on it's ID. IDs are returned by the `addPlot` and
   * `addObject` methods.
   *
   * @param {string} id - The ID to search for
   *
   * @returns {SimShimObj} - The matching object or undefined if nothing matched
   */
  getById (id) {
    return this.plotCtx.objects.find( o => o.id == id )
  }


  /**
   * Does it's best to remove the object and any associated structures. This
   * process is experimental because ThreeJS has questionable support for this
   * at the moment.
   *
   * @param {THREE.Object3D or SimShimObj} o - The object to attempt removal of
   */
  removeObject(o) {
    console.warn('[SimShim] the removeObject method is experimental and '+
      'might not completely free up memory')
    this.plotCtx.scene.remove( o )
    if (o.threeObj) {
      this.plotCtx.scene.remove( o.threeObj )
      if (o.threeObj.geometry) {
        o.threeObj.geometry.dispose()
        o.threeObj.geometry = undefined
      }
      if (o.threeObj.dispose) o.threeObj.dispose()
      o.threeObj = undefined
    }
    if (typeof o.dispose === 'function') o.dispose()
  }


  /**
   * A more thorough method than `removeObject`, this method tries removing all
   * objects and also tries iterating through the ThreeJS structures and
   * calling various disposal methods. This method is also very experimental,
   * and should not be relied upon too much (or at all if you don't want
   * memory leaks!)
   */
  removeAllObjects() {
    console.warn('[SimShim] the removeAllObjects method is experimental and '+
      'might not completely free up memory')
    // SimShim
    this.plotCtx.objects.forEach(this.removeObject)
    // THREEjs
    let scene = this.plotCtx.scene
    if (scene.__objects) scene.__objects.forEach(function(obj, idx) {
      scene.remove(obj)
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (obj.material instanceof THREE.MeshFaceMaterial) {
          obj.material.materials.forEach(function(mat, idx) {
            mat.dispose()
          })
        } else obj.material.dispose()
      }
      if (obj.dispose) obj.dispose()
    })
    // reset containers / remove references
    this.plotCtx.objects = []
    this.ids = []
    this.paused = true
  }


  /**
   * Remove a plot by it's ID. This attempts to remove the ThreeJS objects
   * from memory, but this process has questionable results, so memory leaks
   * may occur.
   */
  removeById (id) {
    console.warn('[SimShim] the removeById method is experimental and '+
      'might not completely free up memory')
    let idIdx = this.ids.indexOf( id )
    let plotIdx = this.plotCtx.objects.findIndex(p => p.id == id)
    if (idIdx == -1) console.warn(`[SimShim] Plot id ${id} not found`)
    else this.ids.splice( idIdx, 1 )
    if (plotIdx == -1) console.warn(`[SimShim] No plot with id ${id} found, no plots removed`)
    else {
      this.removeObject( this.plotCtx.objects[plotIdx] )
      this.plotCtx.objects.splice( plotIdx, 1 )
    }
  }


  /**
   * Replace a subset of global settings at runtime. Currently supports
   * cameraPosn, cameraAngle, orbitTarget, lightIntensity, and autoRotate
   */
  setSettings (settings = {}) {

    SimShimSanitize.checkSettings(settings, 'warn')

    for (let k in settings) {
      switch (k) {
        case 'cameraPosn':
          this.plotCtx.camera.position.setX(settings[k][0])
          this.plotCtx.camera.position.setY(settings[k][1])
          this.plotCtx.camera.position.setZ(settings[k][2])
          this.plotCtx.camera.updateProjectionMatrix()
          break
        case 'cameraAngle':
          this.plotCtx.camera.fov = settings[k]
          this.plotCtx.camera.updateProjectionMatrix()
          break
        case 'orbitTarget':
          this.plotCtx.controls.target.setX(settings[k][0])
          this.plotCtx.controls.target.setY(settings[k][1])
          this.plotCtx.controls.target.setZ(settings[k][2])
          this.plotCtx.controls.update(1)
          break
        case 'lightIntensity':
          this.plotCtx.light.intensity = settings[k]
          break
        case 'autoRotate':
          this.plotCtx.controls.autoRotate = settings[k]
          break
        default:
          console.warn(`[SimShim] Cannot modify setting "${k}", skipping this key`)
          break
      }
    }
  }


  /**
   * Manually trigger camera to retarget. This will place the camera a
   * reasonable distance back from the action and fixes where it is looking
   * to a point near the middle of the action.
   */
  retargetCamera () {
    let M = this.plotCtx.updateMetrics(),
        relativeCameraPosn = new THREE.Vector3(
            M.distX, M.distY, M.distZ
        ).multiplyScalar(3),
        cameraPosn = relativeCameraPosn.add(M.center)
    // Camera
    this.plotCtx.camera.position.x = cameraPosn.x
    this.plotCtx.camera.position.y = cameraPosn.y
    this.plotCtx.camera.position.z = cameraPosn.z
    this.plotCtx.camera.lookAt(M.center)
    if (this.plotCtx.controls instanceof OrbitControls) {
      this.plotCtx.controls.target.copy(M.center)
    }
  }


  animate () {
    // loop
    window.requestAnimationFrame( () => { this.animate() } )

    // increment iterator plot objects
    if (!this.paused) {
      for (let j = 0; j < this.plotCtx.objects.length; j++) {
        this.plotCtx.objects[j].update()
      }

      // update controls and lights
      this.plotCtx.controls.update( 1 )
      this.plotCtx.light.position.copy( this.plotCtx.camera.position )
      this.plotCtx.light.lookAt( this.plotCtx.metrics.center )
    }

    // render
    this.plotCtx.render()
  }


  start () {
    this.plotCtx.render()

    // Update Scene (Lights, Camera)
    if (!this.userDefinedCam) this.retargetCamera()
    this.plotCtx.light.position.copy( this.plotCtx.camera.position )
    this.plotCtx.light.lookAt( this.plotCtx.metrics.center )

    // polyfill animation frames
    window.requestAnimationFrame = window.requestAnimationFrame
                                || window.webkitRequestAnimationFrame
                                || window.mozRequestAnimationFrame
                                || window.oRequestAnimationFrame
                                || window.msRequestAnimationFrame
                                || ((cb) => window.setTimeout( cb, 1000 / 60 ))
    // start the render loop
    this.animate()
  }

}
