/*
 * Bootstrap the application 
 */
var AppWindow = require('control/AppWindow');
var app = AppWindow.createAppWindow( Ti.Filesystem.resourcesDirectory, "/taxonomy/walta" );
app.start();