
$(function () {
  var em = new EditorManager({
    TAG: 'surface_boilerplate',
    editorId: 'editor',
    plotId: '#plot',
    placeholderPath: "placeholder.js"
  });
  $('#run-btn').click( em.updatePlot );
  $('#reset-text-btn').click( em.resetEditorText );
});
