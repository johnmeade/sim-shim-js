
function PlotManager(opt) {

  // unpack
  var plotId = opt.plotId,
      SimShim = require('SimShim'),
      scope = {};

  if (plotId[0] !== '#') plotId = '#'+plotId;

  // update plots
  function updatePlot(code) {
    // stop current plots
    for (var x in scope) {
      var y = scope[x];
      if (y instanceof SimShim) y.kill();
    }
    scope = {};
    $(plotId).empty();
    // run new code
    try {
      eval.call(scope, code);
    } catch (e) {
      console.error(e)
    }
  }

  return {
    update: updatePlot
  };
}
