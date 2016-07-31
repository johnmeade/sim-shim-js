// import * as RKStuff from './runge-kutta';
//
// window.SimShimUtil = RKStuff;

export default class SimShimUtil {

  static toVector3(o) {
    if (o instanceof THREE.Vector3) return o;
    if (o instanceof Array) return new THREE.Vector3().fromArray(o);
    console.error('Cannot coerce into Vector3');
  }

  // helper for mathjs expression parsing. In particular for evalutation and
  // determining if "t" was used (interpretted as time)
  static uniqueSymbolNames (tree) {
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

  // convert 2D array of data into a THREEjs geometry with faces and vertices
  static makeSurfaceGeometry (minX,minY,maxX,maxY,data) {
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

}
