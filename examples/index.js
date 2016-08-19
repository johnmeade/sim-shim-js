function initExamples() {

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

  // init options
  var sel = $('#select-box');
  var states = {};

  // init ace
  var editor = ace.edit('editor');
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");
  editor.$blockScrolling = Infinity
  editor.setOptions({
    showPrintMargin: false,
    fontSize: '12pt'
  });

  // plot management
  var plotMgr = new PlotManager();

  // manage SimShim state on select
  sel.on('change', function () {
    var o = states[this.value];
    if (!o) return;
    o.editMgr.initEditor();

    // remove old and add new click listeners using jquery namespaces

    $('#run-btn').off('click.runBtnClicks');
    $('#run-btn').on('click.runBtnClicks', function() {
      var code = o.editMgr.getEditorText();
      plotMgr.update( code );
      o.editMgr.setStorageText( code );
    });

    $('#reset-text-btn').off('click.resetEditorClicks');
    $('#reset-text-btn').on('click.resetEditorClicks', o.editMgr.resetEditorText);
  });


  manifests.forEach(function (m) {

    var em = new EditorManager({
          TAG: m.id,
          editor: editor,
          placeholderPath: m.filePath
        });

    states[m.id] = { editMgr: em };

    sel.append($('<option>', {
      value: m.id,
      text: m.label
    }))

  });

}

$(window).load(initExamples);
