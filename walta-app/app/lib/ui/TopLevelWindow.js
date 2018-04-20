// Transition code to enable incremental transition to Alloy controllers
function makeTopLevelWindow(args) {
  Alloy.createController( "TopLevelWindow", args );
}
exports.makeTopLevelWindow = makeTopLevelWindow;
