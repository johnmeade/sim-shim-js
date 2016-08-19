import THREE from 'three'


export default class SimShimPlotCtx {
  constructor (renderer, scene, camera, controls, light) {
    this.renderer = renderer;
    this.scene    = scene;
    this.camera   = camera;
    this.controls = controls;
    this.light    = light;
    this.plots    = [];
  }

  updateMetrics () {
    // init (also defaults for when no plots exist)
    var res = {
      'maxX': 0, 'maxY': 0, 'maxZ': 0,
      'minX': 0, 'minY': 0, 'minZ': 0,
      'midX': 0, 'midY': 0, 'midZ': 0,
      'distX': 1, 'distY': 1, 'distZ': 1
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

    // if plots exist, update these values
    if (this.plots.length) {

      // iterate
      this.plots.forEach((plt) => {
        if (plt.threeObj) setMaxMin( plt.threeObj.geometry.vertices );
        else console.warn('SimShimPlot found with no THREEjs object');
      });

      // compute extra metrics
      res.midX    = (res.maxX + res.minX)/2;
      res.midY    = (res.maxY + res.minY)/2;
      res.midZ    = (res.maxZ + res.minZ)/2;
      res.distX   = (res.maxX - res.minX)/2;
      res.distY   = (res.maxY - res.minY)/2;
      res.distZ   = (res.maxZ - res.minZ)/2;

    }

    // computed metrics

    res.maxDist = Math.sqrt( Math.pow(res.distX, 2)
                           + Math.pow(res.distY, 2)
                           + Math.pow(res.distZ, 2)
                           );
    res.center  = new THREE.Vector3(res.midX, res.midY, res.midZ);

    // set and return

    this.metrics = res;
    return res;
  }

  render () {
    this.renderer.render(this.scene, this.camera);
  }
}
