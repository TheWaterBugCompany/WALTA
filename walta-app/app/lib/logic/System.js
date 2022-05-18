var PlatformSpecific = require("logic/PlatformSpecific");
var debug = m => Ti.API.info(m);
exports.System = {
    requestPermission: function( permissions ) {
        if ( OS_ANDROID ) {
            return new Promise( (accept) => {
                debug('Asking for permissions...');
                Ti.Android.requestPermissions(permissions, accept );
            });
        } else {
            return Promise.resolve({ success: true });
        }
        

    },

    closeApp: function() {
        PlatformSpecific.appShutdown();
    }
}