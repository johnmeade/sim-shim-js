
function defaultEditorPlotInit(TAG) {

  $(window).load(function () {

    // init ace
    var editor = ace.edit('editor');
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.$blockScrolling = Infinity
    editor.setOptions({
      showPrintMargin: false,
      fontSize: '12pt'
    });

    var em = new EditorManager({
          TAG: TAG,
          editor: editor,
          placeholderPath: 'placeholder.js'
        }),
        pm = new PlotManager();

    // events
    $('#run-btn').click(function() {
      var code = em.getEditorText()
      pm.update( code );
      em.setStorageText( code );
    });
    $('#reset-text-btn').click( em.resetEditorText );

    // run
    em.initEditor()
  })

}
