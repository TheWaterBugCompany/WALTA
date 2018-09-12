// Transition code to enable incremental transition to Alloy controllers
function makeTopLevelWindow(args) {
  var toplevel = Alloy.createController( "TopLevelWindow" );
  toplevel.TopLevelWindow.title = args.title;
  toplevel.content = args.uiObj.view;
  toplevel.name = args.name;
  toplevel.open();
}
exports.makeTopLevelWindow = makeTopLevelWindow;
