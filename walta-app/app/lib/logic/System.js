exports.System = {
    requestPermission: function( permissions, done ) {
        if ( OS_ANDROID ) {
            debug('Asking for permissions...');
            Ti.Android.requestPermissions(permissions, done );
        } else {
            done({ success: true });
        }
    },

    closeApp: function() {
        PlatformSpecific.appShutdown();
    }
}