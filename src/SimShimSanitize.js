// This messy class is intended to give useful error messages when the API is
// used incorrectly.

import THREE from 'three'
import chai from 'chai'


export default class SimShimSanitize {

  static _handle(str, policy) {
    switch (policy) {
      case 'error':
        console.error('[SimShim] '+str);
        break;
      case 'warn':
        console.warn('[SimShim] '+str);
        break;
      default:
        throw new Error('[SimShim] '+str);
    }
  }

  // everything is optional in settings
  static checkSettings(settings, policy='warn') {
    let s = [],
        i = (x, o) => x instanceof o,
        t = (obj, str) => typeof obj === str
        ;

    if (!t(settings.far, 'undefined') && !t(settings.far, 'number')) s.push('The "far" setting must be a number');
    if (!t(settings.near, 'undefined') && !t(settings.near, 'number')) s.push('The "near" setting must be a number');
    if (!t(settings.cameraAngle, 'undefined') && !t(settings.cameraAngle, 'number')) s.push('The "cameraAngle" setting must be a number');
    if (!t(settings.lightIntensity, 'undefined') && !t(settings.lightIntensity, 'number')) s.push('The "lightIntensity" setting must be a number');

    if ( settings.ctrlType && !t(settings.ctrlType, 'string')) s.push('The "ctrlType" setting must be a string');
    if ( settings.clearColor && !t(settings.clearColor, 'string')) s.push('The "clearColor" setting must be a string');

    if ( settings.showGrid && !t(settings.showGrid, 'boolean')) s.push('The "showGrid" setting must be a boolean');
    if ( settings.showAxes && !t(settings.showAxes, 'boolean')) s.push('The "showAxes" setting must be a boolean');
    if ( settings.autoRotate && !t(settings.autoRotate, 'boolean')) s.push('The "autoRotate" setting must be a boolean');

    if ( settings.cameraPosn && ! (i(settings.cameraPosn, Array) || i(settings.cameraPosn, THREE.Vector3))) s.push('The "cameraPosn" setting must be an array or THREE.Vector3');
    if ( settings.orbitTarget && ! (i(settings.orbitTarget, Array) || i(settings.orbitTarget, THREE.Vector3))) s.push('The "orbitTarget" setting must be an array or THREE.Vector3');

    if (s.length) this._handle(s.join('\n'), policy);
  }

  // some required fields exist in plot objects. Ugly conditional nesting
  // required to drill down and provide useful errors.
  static checkPlotObj(plot, policy='warn') {
    let s = [],
        i = (x, o) => x instanceof o,
        t = (obj, str) => typeof obj === str,
        all = (stuff, cond) => stuff.findIndex((x) => !cond(x)) == -1,
        isArr = (x) => i(x, Array),
        isNum = (x) => t(x, 'number'),
        isNumArr = (x) => all(x, (y) => isNum(y)),
        isNumArr2D = (pts) => all(pts, (pt)=>(isArr(pt) && isNumArr(pt))),
        x // use this with the comma operator to save a bit of space
        ;

    // OPTIONAL

    if (x=plot.label, x && !t(x, 'string')) s.push('The "label" attribute must be a string');
    if (x=plot.rotation, x && !(isNumArr(x) || i(x, THREE.Quaternion))) s.push('The "rotation" attribute must be an array of numbers (a rotation of [0,0,1] that will be applied to the plot) or a THREE.Quaternion');

    // REQUIRED

    if (x=plot.type, !x || !t(x, 'string')) s.push('The "type" attribute is required and must be a string');
    else {

      if (plot.type == 'lineplot') { // ===============================================================================================

        if (plot.parse) {

          if (x=plot.parse, !isArr(x) || !all(x, (y) => t(y, 'string'))) s.push('The "parse" attribute must be an array of strings');
          if (!isNum(plot.start)) s.push('A parsed lineplot requires a "start" attribute (initial t value)');
          if (!isNum(plot.step)) s.push('A parsed lineplot requires a "step" attribute (timestep between t values)');

          if (plot.animated) { // lineplot, parsed, animated

            if (!isNum(plot.lineLength)) s.push('This type of lineplot requires a "lineLength" attribute (animated lines have finite length)');

          } else { // lineplot, parsed, not animated

            // handled above.

          }
        } else {

          if (plot.animated) { // lineplot, not parsed, animated

            if (!isNum(plot.lineLength)) s.push('This type of lineplot requires a "lineLength" attribute (animated lines have finite length)');
            if (x=plot.next, !x || !t(x, 'function')) s.push('This type of lineplot requires a "next" attribute (a function producing the next point)');

          } else { // lineplot, not parsed, not animated

            if (x=plot.data, !x || !isArr(x) || !isNumArr2D(x)) s.push('This type of lineplot requires a "next" attribute (a function producing the next point)');

          }

        }

      } else if (plot.type == 'surfaceplot') { // =====================================================================================

        if (!isNum(plot.minX)) s.push('Surfaceplots require the "minX" attribute (minimum x value)');
        if (!isNum(plot.maxX)) s.push('Surfaceplots require the "maxX" attribute (maximum x value)');
        if (!isNum(plot.minY)) s.push('Surfaceplots require the "minY" attribute (minimum y value)');
        if (!isNum(plot.maxY)) s.push('Surfaceplots require the "maxY" attribute (maxmium y value)');

        if (plot.parse) {

          if (!isNum(plot.step)) s.push('A parsed surfaceplot requires the "step" attribute (interval between adjascent x and y values)');
          if (x=plot.parse, !x || !t(x, 'string')) s.push('A parsed surfaceplot requires the "parse" attribute, which must be a string representing an expression for z, ie the "f" in "z=f(x,y)" (ex: "sin(x)*y", "t*x*y", etc. Don\'t forget to add the "animated" attribute and a "t" in the function if you want it to be animated)');

          if (plot.animated) { // surfaceplot, parsed, animated

            if (!isNum(plot.start)) s.push('A parsed, animated surfaceplot requires the "start" attribute (initial time value)');
            if (!isNum(plot.dt)) s.push('A parsed, animated surfaceplot requires the "dt" attribute (time step per frame)');

          } else { // surfaceplot, parsed, not animated

            // handled above.

          }

        } else {

          if (plot.animated) { // surfaceplot, not parsed, animated

            if (x=plot.next, !x || !t(x, 'function')) s.push('An animated surfaceplot requires a "next" attribute (provides the a new 2D array of heights each frame) or a "parse" attribute')

          } else { // surfaceplot, not parsed, not animated

            if (x=plot.data, !x || !isArr(x) || !isNumArr2D(x)) s.push('This type of surfaceplot requires the "data" attribute (2D array of height values)');

          }
        }
      }
    }

    if (s.length) this._handle(s.join('\n'), policy);
  }

}
