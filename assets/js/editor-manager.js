// uses window.localStorage to store text in an ace editor


function EditorManager(opt) {

  // unpack
  var TAG = opt.TAG,
      editorId = opt.editorId,
      placeholderPath = opt.placeholderPath,
      editorOptions = opt.editorOptions || {};

  // init ace
  var editor = ace.edit(editorId);
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");
  editor.$blockScrolling = Infinity
  editorOptions.fontSize = editorOptions.fontSize || '12pt';
  editor.setOptions(editorOptions);

  function getStorageText() {
    return window.localStorage[TAG];
  }

  function setStorageText(txt) {
    window.localStorage[TAG]=txt;
  }

  function getEditorText() {
    return editor.getSession().getValue();
  }

  function setEditorText(txt) {
    return editor.getSession().setValue(txt);
  }

  function resetEditorText() {
    if (placeholderPath)
      // specify dataType so js is not executed
      $.ajax(placeholderPath, {
        dataType: 'text',
        success: setEditorText
      });
  }

  // set editor text
  function initEditor() {
    var existing = getStorageText();
    if (existing) setEditorText( existing );
    else resetEditorText();
  }

  return {
    TAG: TAG,
    editor: editor,
    getStorageText: getStorageText,
    setStorageText: setStorageText,
    getEditorText: getEditorText,
    setEditorText: setEditorText,
    resetEditorText: resetEditorText,
    initEditor: initEditor
  };
}
