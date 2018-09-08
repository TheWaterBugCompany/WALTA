if ( Alloy.CFG.unitTestMode ) {
  require("specs/index");
} else {
  Alloy.Globals.SampleDatabase.load();
  Alloy.Globals.AppWindow.createAppWindow( "walta" ).start();
}
