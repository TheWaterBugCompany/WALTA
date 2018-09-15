Ti.API.info(`Alloy.CFG.unitTestMode = ${Alloy.CFG.unitTestMode}`);
Ti.API.info(`Alloy.CFG.stopAfterEachTest = ${Alloy.CFG.stopAfterEachTest}`);
if ( Alloy.CFG.unitTestMode ) {
  
  require("specs/index");
} else {
  var CerdiApi = require("logic/CerdiApi");
  Alloy.Globals.AppWindow = require("control/AppWindow");
  Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
  Alloy.Collections.instance("sample").load();
  Alloy.Globals.AppWindow.createAppWindow( "walta" ).start();
}
