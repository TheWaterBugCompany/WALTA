Ti.API.debug(`Alloy.CFG.unitTestMode = ${Alloy.CFG.unitTestMode}`);
Ti.API.debug(`Alloy.CFG.stopAfterEachTest = ${Alloy.CFG.stopAfterEachTest}`);
//Ti.Android.currentActivity.intent.getBooleanExtra("android.intent.action.UnitTest", false )
if ( Alloy.CFG.unitTestMode ) {
  
  require("specs/index");
} else {
  var CerdiApi = require("logic/CerdiApi");
  var SampleSync = require("logic/SampleSync");
  Alloy.Globals.AppWindow = require("control/AppWindow");
  Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
  Alloy.Collections.instance("sample").load();
  Alloy.Globals.AppWindow.createAppWindow( "walta" ).start();
  SampleSync.init(); 
}
