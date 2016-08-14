(function(){

var SimShim = require('SimShim');

var manifests = [ { id: 'BOUWWVHK'
                  , label: 'lineplot: square'
                  , filePath: './lineplot_square.js'
                  }
                , { id: '97H8ES58'
                  , label: 'lineplot, animated: parametric helix'
                  , filePath: './lineplot-animated_parametric-helix.js'
                  }
                , { id: 'D9IPFA2D'
                  , label: 'lineplot, animated: random line sphere'
                  , filePath: './lineplot-animated_random-line-sphere.js'
                  }
                , { id: 'GB00RQES'
                  , label: 'lineplot, parsed: spikey thing'
                  , filePath: './lineplot-parsed_spikey-thing.js'
                  }
                , { id: '1YIDVBT3'
                  , label: 'lineplot, parsed, animated: spikey thing'
                  , filePath: './lineplot-parsed-animated_spikey-thing.js'
                  }
                , { id: 'J2IQ5GBH'
                  , label: 'surfaceplot, parsed: sine blanket'
                  , filePath: './surfaceplot-parsed_sine-blanket.js'
                  }
                , { id: '7B8PBYUA'
                  , label: 'surfaceplot, parsed, animated: sine blanket'
                  , filePath: './surfaceplot-parsed-animated_sine-blanket.js'
                  }
                , { id: 'QLRYMOT5'
                  , label: 'surfaceplot, animated: sine blanket'
                  , filePath: './surfaceplot-animated_sine-blanket.js'
                  }
                , { id: 'I3XINTDS'
                  , label: 'surfaceplot: sine blanket'
                  , filePath: './surfaceplot_sine-blanket.js'
                  }
                ];

// turn template code into runnable code
function getPlotCode(em) {
  return em.getEditorText() +
    'var SimShim = require(\'SimShim\');' +
    'var ss = new SimShim(\'#plot\');' +
    'ss.addPlot( plt );' +
    'ss.start();';
}

// init options
var sel = $('#select-box');
var states = {};

// manage SimShim state on select
sel.on('change', function () {
  var o = states[this.value];
  if (!o) return;
  o.editorManager.initEditor();
  $('#run-btn').click(function() {
    o.plotManager.update( getPlotCode(o.editorManager) );
  });
  $('#reset-text-btn').click( o.editorManager.resetEditorText );
});


manifests.forEach(function (m) {

  var em = new EditorManager({
        TAG: m.id,
        editorId: 'editor',
        placeholderPath: m.filePath
      }),
      pm = new PlotManager({
        plotId: 'plot'
      });

  states[m.id] = { editorManager: em, plotManager: pm };

  sel.append($('<option>', {
    value: m.id,
    text: m.label
  }))

});

})();
