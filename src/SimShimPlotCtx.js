export default class SimShimPlotCtx {
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
