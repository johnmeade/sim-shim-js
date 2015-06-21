function run () {
  for (var x in window) {
    var y = window[x];
    if (y instanceof SimShim) y.kill();
  }
  document.getElementById('plot').innerHTML = '';
  var code = editor.getSession().getValue();
  eval(code);
}

$(function () {
  $.get('placeholder.js', function (data) {
    editor.getSession().setValue( data );
  });
});

// init ace
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");
