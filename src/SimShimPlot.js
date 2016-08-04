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
        throw new Error(`Unexpected plot type '${obj.type}'`);
    }
  }

  _initLineplot(color) {

    let obj = this.obj;

    // convert to the 'manual' form of lineplot
    if (obj.parse) {

      // fns holds the parsed x(t), y(t), and z(t) funcitons
      let fns = [];
      for (let i = 0; i < obj.parse.length; i++) {

        let tree     = math.parse(obj.parse[i]),
            symNames = SimShimUtil.uniqueSymbolNames( tree ),
            compiled = tree.compile();

        if (symNames.length > 1) throw new Error("Argument Error: "+
          "Please use 0 or 1 symbols for parsed lineplot functions");

        fns.push( function (t) {
          let s = {};
          if (symNames.length > 0) s[symNames[0]] = t;
          return compiled.eval(s);
        });
      }

      let f = (t) => new THREE.Vector3(fns[0](t), fns[1](t), fns[2](t));

      // animated lineplot
      if (obj.animated) {
        // create 'next' function
        obj.t = obj.start;
        obj.dt = obj.step;
        obj.next = (function () {
          let xyz = f( this.t );
          this.t += this.dt;
          return xyz;
        }).bind(obj);
      }

      // static lineplot
      else {
        // sample from the functions
        let start = obj.start,
            end   = obj.end,
            dt    = obj.step,
            data  = [];
        for (let t = start; t < end; t+=dt) data.push( f(t) );
        obj.data = data;
      }
    }

    /**  BUILD THREE JS OBJECT  **/

    // TODO support for custom shaders
    let material = new THREE.LineBasicMaterial({
        color: color,
        linewidth: 2
    });

    // animated lineplot
    if (obj.animated) {
      let geometry = new THREE.Geometry();
      geometry.dynamic = true;
      // initialize all points in geometry to the initial point
      let initialXyz = SimShimUtil.toVec3( obj.next() );
      for (let j=0; j<obj.lineLength; j++) geometry.vertices.push(initialXyz);
      // create and attach THREE object
      let traj = new THREE.Line(geometry, material);
      traj.frustumCulled = false;
      this.threeObj = traj;
      // update function wrapper that calls "next"
      this.update = (function () {
        this.threeObj.geometry.vertices.shift();
        this.threeObj.geometry.vertices.push(SimShimUtil.toVec3(this.obj.next()));
        this.threeObj.geometry.verticesNeedUpdate = true;
      }).bind(this);
    }

    // static lineplot
    else {
      let geometry = new THREE.Geometry();
      // fill the geometry with provided points
      geometry.vertices = obj.data.map( SimShimUtil.toVec3 );
      // construct THREE object
      this.threeObj = new THREE.Line(geometry, material);
      // don't change geometry on update
      this.update = function () {};
    }

  }

  _initSurface(color, shading) {
    let obj = this.obj;

    if (obj.parse) {
      // Parse the string provided and add a mesh + update function
      let fn,
          tree     = math.parse(obj.parse),
          symNames = SimShimUtil.uniqueSymbolNames( tree ),
          compiled = tree.compile(),
          maxAllowedVars = 2;

      // special case for animations
      if (symNames.indexOf("t") != -1) maxAllowedVars++;

      if (symNames.length <= maxAllowedVars) {
        let namesLeft = symNames.filter((n) => n !== 't');
        fn = (vars, t) => {
          let scope = {t: t};
          namesLeft.forEach((n) => scope[n]=vars.shift());
          return compiled.eval(scope);
        }
      } else {
        throw new Error("Invalid Surfaceplot 'parse' Parameter: use 0, 1, or 2 symbols, " +
          "plus 't' if you are animating a surface.");
      }

      // handle animation
      if (obj.animated) {
        // create 'next' function
        obj.t  = obj.start;
        obj.next = (function () {
          // sample from the fn
          let mesh = [];
          // construct initial condition
          for (let x = this.minX; x < this.maxX; x+=this.step) {
            let row = [];
            for (let y = this.minY; y < this.maxY; y+=this.step) {
              row.push( fn([x,y], this.t) );
            }
            mesh.push( row );
          }
          this.t += this.dt;
          return mesh;
        }).bind(obj);

      // not animated
      } else {
        // sample from the fn
        let data = [];
        for (let x = obj.minX; x < obj.maxX; x+=obj.step) {
          let row = [];
          for (let y = obj.minY; y < obj.maxY; y+=obj.step) {
            row.push( fn([x,y]) );
          };
          data.push( row );
        }
        obj.data = data;
      }
    } // end parsing

    // materials
    let material = new THREE.MeshLambertMaterial({
        color: color,
        shading: shading,
        side: THREE.DoubleSide,
    });
    if (obj.wireframe) { // TODO fix
      let wireframeMaterial = new THREE.MeshBasicMaterial({
        color: obj.wireframeColor || 0xeeeeee,
        wireframe: true,
        transparent: true
      });
    }

    if (obj.animated) {

      let geometry = SimShimUtil.makeSurfaceGeometry(
        obj.minX, obj.minY, obj.maxX, obj.maxY, obj.next()
      );
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();

      if (obj.wireframe) { // TODO wireframes
        let multiMaterial = [ material, wireframeMaterial ];
        this.threeObj = THREE.SceneUtils.createMultiMaterialObject(
          geometry,
          multiMaterial
        );
      } else {
        this.threeObj = new THREE.Mesh( geometry, material );
      }
      this.update = (function () {
        let o = this.obj;
        // replace entire geometry object
        // TODO better implementation
        let geo = SimShimUtil.makeSurfaceGeometry(
          o.minX, o.minY, o.maxX, o.maxY, o.next()
        );
        geo.computeFaceNormals();
        geo.computeVertexNormals();
        geo.verticesNeedUpdate = true; // flag for update
        // threeJS holds references to geometries in object3Ds,
        // so we must call .dispose() to avoid memory leaks
        this.threeObj.geometry.dispose();
        this.threeObj.geometry = geo;
      }).bind(this);
    } else {
      let geometry = SimShimUtil.makeSurfaceGeometry(
        obj.minX, obj.minY, obj.maxX, obj.maxY, obj.data
      );
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      this.threeObj = new THREE.Mesh( geometry, material );
      // don't change geometry
      this.update = function () {};
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
    if (obj.rotation) {
      let q;
      if (obj.rotation instanceof THREE.Quaternion) {
        q = rotation;
      } else if (obj.rotation.length === 4) {
        q = new THREE.Quaternion().fromArray( obj.rotation );
      } else {
        let up = new THREE.Vector3(0,0,1);
        let rotn = SimShimUtil.toVec3( obj.rotation );
        rotn.normalize();
        q = new THREE.Quaternion().setFromUnitVectors(up, rotn);
      }
      this.threeObj.setRotationFromQuaternion(q);
    };

  }

}
