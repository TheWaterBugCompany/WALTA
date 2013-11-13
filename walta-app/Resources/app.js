/*
 * Bootstrap the application 
 */
var AppWindow = require('control/AppWindow');
var keyPath;
//keyPath = [ Ti.Filesystem.resourcesDirectory, "taxonomy/walta" ];
keyPath = [ Ti.Filesystem.externalStorageDirectory, "walta-taxonomy/walta" ]
var app = AppWindow.createAppWindow.apply( AppWindow, keyPath );
app.start();