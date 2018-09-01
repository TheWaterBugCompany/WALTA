if ( Alloy.CFG.unitTestMode ) {
  Alloy.Globals.SampleDatabase.load();
  Alloy.Globals.AppWindow.createAppWindow( "walta" ).start();
} else {
  require("specs/index");
}
