(function(){

var SimShim = require('SimShim');

var files = [ 'lineplot_square.js'
            , 'lineplot-animated_parametric-helix.js'
            , 'lineplot-animated_random-line-sphere.js'
            , 'lineplot-parsed_spikey-thing.js'
            , 'lineplot-parsed-animated_spikey-thing.js'
            , 'surfaceplot-animated_sine-blanket.js'
            , 'surfaceplot-parsed-animated_sine-blanket.js'
            , 'surfaceplot-parsed_sine-blanket.js'
            , 'surfaceplot_sine-blanket.js'
            ];

// init ace
var editor = ace.edit('editor');
editor.setTheme('ace/theme/monokai');
editor.getSession().setMode('ace/mode/javascript');
editor.setOptions({
  readOnly: true,
  fontSize: '10pt'
});

// init simshim
var ss = new SimShim('#plot', {clearColor: '#111'});
ss.start();
ss.setPaused(true);

// init options
var sel = $('#select-box');
var plots = [];

sel.on('change', function () {
  var o = plots[this.value];
  if (!o) return;
  editor.getSession().setValue( o.code );
  ss.kill();
  ss.addPlot( o.plt );
  ss.setPaused(false);
});

files.forEach(function (filePath, idx) {
  $.ajax(filePath, {
    dataType: 'text', // don't execute downloaded js
    success: function (data) {
      eval(data);
      plots[idx] = {plt: plt, code: data};
      sel.append($('<option>', {
        value: idx,
        text: plt.label
      }));
    }
  })
});

})();
