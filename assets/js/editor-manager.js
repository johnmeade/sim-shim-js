
function EditorManager(opt) {

  // unpack
  var TAG = opt.TAG,
      editorId = opt.editorId,
      plotId = opt.plotId,
      placeholderPath = opt.placeholderPath,
      SimShim = require('SimShim');

  // init ace
  var editor = ace.edit(editorId);
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");

  // update plots
  var updateFunction = function() {
    // stop current plot
    for (var x in window) {
      var y = window[x];
      if (y instanceof SimShim) {
        y.kill();
        delete y;
      }
    }
    $(plotId).empty();
    // run new code
    var code = editor.getSession().getValue();
    window.localStorage[TAG]=code;
    eval.call(window, code);
  }

  // set editor text
  var existing = window.localStorage[TAG];
  if (existing) {
    editor.getSession().setValue( existing );
    // updateFunction();
  } else if (placeholderPath) {
    // specify dataType so js is not executed
    $.ajax(placeholderPath, {
        dataType: 'text',
        success: function (data) {
          editor.getSession().setValue( data );
          // updateFunction();
        }
    });
  }

  // reset placeholder
  var resetFunction = function() {
    if (placeholderPath)
      // specify dataType so js is not executed
      $.ajax(placeholderPath, {
          dataType: 'text',
          success: function (data) {
            editor.getSession().setValue( data );
            // delete window.localStorage[TAG];
          }
      });
  }

  return {
    TAG: TAG,
    editor: editor,
    updatePlot: updateFunction,
    resetEditorText: resetFunction
  };
}
