if ( true ) {
  var AppWindow = require("control/AppWindow");
  AppWindow.createAppWindow( "walta" ).start();
} else {
  require("specs/index");
}
