
function PlotManager() {

  var ssInstances = [];

  // update plots
  function updatePlot(code) {
    // remove dead references
    ssInstances = ssInstances.filter(function(ss) {
      return (ss instanceof SimShim)
    });
    // try to stop the simulation (unavoidable memory leaks here...)
    ssInstances.map(function (ss) {
      ss.removeAllObjects();
      ss.setPaused(true);
    });
    // bit of a hack to force eval in global scope
    (function(code) {eval.call(this,code)}(code));
    // gather up all the SimShim references we can find
    for (var k in window) {
      if (window[k] instanceof SimShim) ssInstances.push(window[k])
    }
  }

  return {
    update: updatePlot
  };
}
