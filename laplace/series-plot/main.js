
$(function () {
  var em = new EditorManager({
    TAG: 'laplace_series',
    editorId: 'editor',
    plotId: '#plot',
    placeholderPath: "placeholder.js"
  });
  $('#run-btn').click( em.updatePlot );
  $('#reset-text-btn').click( em.resetEditorText );
});
