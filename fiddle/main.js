
$(function () {
  var em = new EditorManager({
    TAG: 'demo',
    editorId: 'editor',
    plotId: '#plot',
    placeholderPath: "placeholder.js"
  });
  $('#run-btn').click( em.updatePlot );
  $('#reset-text-btn').click( em.resetEditorText );
});
