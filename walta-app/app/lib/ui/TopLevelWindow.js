// Transition code to enable incremental transition to Alloy controllers
function makeTopLevelWindow(args) {
  var toplevel = Alloy.createController( "TopLevelWindow", { surveyType: args.surveyType, allowAddToSample: args.allowAddToSample} );
  toplevel.TopLevelWindow.title = args.title;
  toplevel.content = args.uiObj.view;
  toplevel.name = args.name;

  return toplevel;
}
exports.makeTopLevelWindow = makeTopLevelWindow;
