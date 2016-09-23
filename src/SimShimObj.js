import THREE from 'three'
import math from 'mathjs'

import U from './SimShimUtil'
import { newParseError } from './Errors'


/**
 * Responsible for parsing input manifests into ThreeJS objects and
 * creating update functions. Exported interface is just a constructor and
 * an `update` method.
 *
 * Advanced usage might require access to the input manifest, ThreeJS object,
 * update function, etc. The original input is cached in the `manifest`
 * instance variable, and an instance variable called `controller` holds
 * the reference to the ThreeJS object (`threeObj`), the update function
 * (`next`), and other properties specific to the implementation.
 *
 */
export default class SimShimObj {


  constructor(id, manifest, threeObj, update) {
    this.id = id
    this.manifest = manifest
    this.threeObj = threeObj
    this.update = update
  }


  static fromPlotManifest(id, manifest, { color, shading }) {

    let o
    switch (manifest.type) {
      case 'lineplot':
        o = SimShimObj._initLineplot(manifest, color)
        break;

      case 'surfaceplot':
        o = SimShimObj._initSurface(manifest, color, shading)
        break;

      // TODO: "ode3", "pde3", "graph", ...?

      default:
        throw newParseError(`[SimShim] Unexpected plot type '${manifest.type}'`)
    }

    return new SimShimObj(id, manifest, o.threeObj, o.update)
  }


  static _initLineplot(man, color) {

    let threeObj,
        update,
        // overridden by parsed, non-animated lines:
        lineData = man.data,
        // overridden by parsed, animated lines:
        nextFunc = man.next ? man.next.bind(man) : null

    // expand "parse" prop into several props the rest of the function needs
    if (man.parse) {

      // fns holds the parsed x(t), y(t), and z(t) funcitons
      let fns = []
      for (let i = 0; i < man.parse.length; i++) {

        let tree     = math.parse(man.parse[i]),
            symNames = U.uniqueSymbolNames( tree ),
            compiled = tree.compile();

        if (symNames.length > 1) throw newParseError("[SimShim] Argument Error: "+
          "Please use 0 or 1 symbols for parsed lineplot functions")

        // inject an error message into any incorrect expressions
        fns.push( t => {
          let s = {}
          if (symNames.length > 0) s[symNames[0]] = t
          return compiled.eval(s)
        })
      }

      let f = (t) => new THREE.Vector3(fns[0](t), fns[1](t), fns[2](t))

      if (man.animated) { // animated lineplot

        // create 'next' function
        let scope = {
          t: man.start,
          dt: man.step
        }
        nextFunc = function () {
          let xyz = f( scope.t )
          scope.t += scope.dt
          return xyz
        }

      } else { // static lineplot

        // sample from the functions
        lineData = []
        for (let t = man.start; t < man.end; t+=man.step) lineData.push( f(t) )

      }
    }

    /**  BUILD THREE JS OBJECT  **/

    // TODO support for custom shaders
    let material = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 2
    })

    // animated lineplot
    if (man.animated) {

      let geometry = new THREE.Geometry()
      geometry.dynamic = true
      // initialize all points in geometry to the initial point
      let initialXyz = U.toVec3( nextFunc() )
      for (let j=0; j<man.lineLength; j++) geometry.vertices.push(initialXyz)
      // create and attach THREE object
      let traj = new THREE.Line(geometry, material)
      traj.frustumCulled = false
      threeObj = traj
      // update function wrapper that calls "next" on manifest.
      // NOTE: references "this" which will be bound to an instance later
      update = () => {
        threeObj.geometry.vertices.shift()
        threeObj.geometry.vertices.push( U.toVec3( nextFunc() ) )
        threeObj.geometry.verticesNeedUpdate = true
      }

    } else { // static lineplot

      let geometry = new THREE.Geometry()
      // fill the geometry with provided points
      geometry.vertices = lineData.map( U.toVec3 )
      // construct THREE object
      threeObj = new THREE.Line(geometry, material)
      // don't change geometry on update
      update = () => {}

    }

    return { threeObj, update }
  }


  static _initSurface(man, color, shading) {

    let threeObj,
        update,
        // overridden by parsed, non-animated surfaces:
        surfData = man.data,
        // overridden by parsed, animated surfaces:
        nextFunc = man.next ? man.next.bind(man) : null

    if (man.parse) {
      // Parse the string provided and add a mesh + update function
      let fn,
          tree     = math.parse(man.parse),
          symNames = U.uniqueSymbolNames( tree ),
          compiled = tree.compile(),
          maxAllowedVars = 2

      // special case for animations
      if (symNames.indexOf("t") != -1) maxAllowedVars++

      if (symNames.length <= maxAllowedVars) {
        let namesLeft = symNames.filter((n) => n !== 't')
        fn = (vars, t) => {
          let scope = {t: t}
          namesLeft.forEach((n) => scope[n]=vars.shift());
          return compiled.eval(scope)
        }
      } else {
        throw newParseError("[SimShim] Invalid Surfaceplot 'parse' Parameter: use 0, 1, or 2 symbols, " +
          "plus 't' if you are animating a surface.")
      }

      // handle animation
      if (man.animated) {
        // create 'next' function
        let scope = {
          t: man.start,
          dt: man.step
        }
        nextFunc = function() {
          // sample from the fn
          let mesh = []
          // construct initial condition
          for (let x = man.minX; x < man.maxX; x+=man.step) {
            let row = []
            for (let y = man.minY; y < man.maxY; y+=man.step) {
              row.push( fn([x,y], scope.t) )
            }
            mesh.push( row )
          }
          scope.t += scope.dt
          return mesh
        }

      // not animated
      } else {
        // sample from the fn
        surfData = []
        for (let x = man.minX; x < man.maxX; x+=man.step) {
          let row = []
          for (let y = man.minY; y < man.maxY; y+=man.step) {
            row.push( fn([x,y]) )
          };
          surfData.push( row )
        }
      }
    } // end parsing

    // materials
    let material = new THREE.MeshLambertMaterial({
        color: color,
        shading: shading,
        side: THREE.DoubleSide,
    })
    if (man.wireframe) { // TODO fix
      let wireframeMaterial = new THREE.MeshBasicMaterial({
        color: man.wireframeColor || 0xeeeeee,
        wireframe: true,
        transparent: true
      })
    }

    if (man.animated) {

      let geometry = U.makeSurfaceGeometry(
        man.minX, man.minY, man.maxX, man.maxY, nextFunc()
      )
      geometry.computeFaceNormals()
      geometry.computeVertexNormals()

      if (man.wireframe) { // TODO wireframes
        let multiMaterial = [ material, wireframeMaterial ]
        threeObj = THREE.SceneUtils.createMultiMaterialObject(
          geometry,
          multiMaterial
        )
      } else {
        threeObj = new THREE.Mesh( geometry, material )
      }
      update = () => {
        // replace entire geometry object
        // TODO better implementation
        let geo = U.makeSurfaceGeometry(
          man.minX, man.minY, man.maxX, man.maxY, nextFunc()
        )
        geo.computeFaceNormals()
        geo.computeVertexNormals()
        geo.verticesNeedUpdate = true // flag for update
        // threeJS holds references to geometries in object3Ds,
        // so we must call .dispose() to avoid memory leaks
        // TODO: diff and update instead of disposing
        threeObj.geometry.dispose()
        threeObj.geometry = geo
      }

    } else {
      let geometry = U.makeSurfaceGeometry(
        man.minX, man.minY, man.maxX, man.maxY, surfData
      )
      geometry.computeFaceNormals()
      geometry.computeVertexNormals()
      threeObj = new THREE.Mesh( geometry, material )
      // don't change geometry
      update = () => {}
    }

    // Rotate the surface by inputting...
    //   * a quaternion (4 component array or THREE.Quaternion) that
    //     is applied to the mesh, or
    //   * a vector (3 component array or THREE.Vector3) that is interpretted
    //     as a transformation of the vector (0,0,1). A quaternion is
    //     interpolated from the input and (0,0,1), and this is used to
    //     rotate the surface. This is just provided as a quick way to get
    //     a rough rotation in place, and the resulting surface might be
    //     rotated around in an undesirable way.
    if (man.rotation) {
      let q
      if (man.rotation instanceof THREE.Quaternion) {
        q = rotation
      } else if (man.rotation.length === 4) {
        q = new THREE.Quaternion().fromArray( man.rotation )
      } else {
        let up = new THREE.Vector3(0,0,1)
        let rotn = U.toVec3( man.rotation )
        rotn.normalize()
        q = new THREE.Quaternion().setFromUnitVectors(up, rotn)
      }
      threeObj.setRotationFromQuaternion(q)
    }

    return { threeObj, update }
  }


}
