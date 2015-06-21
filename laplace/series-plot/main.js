// init ace
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");

// download js
$.get("series-plot-placeholder.js", function (data) {
    // set editor contents and run
    editor.getSession().setValue( data );
    updatePlot();
});

function updatePlot () {
    // stop current plot
    for (var x in window) {
      var y = window[x];
      if (y instanceof SimShim) y.kill();
    }
    $("#plot").empty();
    // run new code
    var code = editor.getSession().getValue();
    eval(code);
}

$('#run-btn').click(updatePlot);
