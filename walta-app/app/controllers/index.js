
var CerdiApi = require("logic/CerdiApi");
Alloy.Globals.CerdiApi = CerdiApi.createCerdiApi( Alloy.CFG.cerdiServerUrl, Alloy.CFG.cerdiApiSecret );
Alloy.createController("Main").startApp(); 