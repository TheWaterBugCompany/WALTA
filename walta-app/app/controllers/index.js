if ( true ) {
  var AppWindow = require("control/AppWindow");
  var SampleDatabase = require("logic/SampleDatabase");
  SampleDatabase.load();
  AppWindow.createAppWindow( "walta" ).start();
} else {
  require("specs/index");
}
