/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Bootstrap the application
 */

const Crashlytics = require('util/Crashlytics');
var log = Crashlytics.log;
var debug = m => Ti.API.info(m);

const appConfig = Ti.Filesystem.getFile("app-config.json").read();
_.extend(Alloy.CFG, JSON.parse(appConfig));


Crashlytics.configure();
Crashlytics.setCustomKey("deployType", Ti.App.deployType );

Ti.App.addEventListener( "uncaughtException", function(e) {
  if ( Crashlytics.isAvailable() ) {
    Crashlytics.recordException( e );
  }
});

//Alloy.Globals.Map = require('ti.map');

Alloy.Events = _.clone(Backbone.Events);
Alloy.Globals.Key = null;

debug("Determining device screen parameters...")
log(`platform display caps: width = ${Ti.Platform.displayCaps.platformWidth}, height = ${Ti.Platform.displayCaps.platformHeight}, density = ${Ti.Platform.displayCaps.density}, logicalDensityFactor  = ${Ti.Platform.displayCaps.logicalDensityFactor},`);

var relWidth = Ti.Platform.displayCaps.platformWidth / Ti.Platform.displayCaps.logicalDensityFactor;
var relHeight= Ti.Platform.displayCaps.platformHeight / Ti.Platform.displayCaps.logicalDensityFactor;

if ( relHeight > relWidth ) {
  debug(`Ugh we got portrait sized dimensions width = ${relWidth} height = ${relHeight} :-( swapping...`)
    var tmp = relHeight;
    relHeight = relWidth;
    relWidth = tmp;    
    // we are reporting protrait mode
}

var aspectRatio = relWidth/relHeight; 
 
log(`relWidth=${relWidth}, relHeight=${relHeight}, aspectRatio=${aspectRatio}`);

Alloy.Globals.isSquare = aspectRatio < 1.5;

Alloy.Globals.isLowRes = relHeight < 300; 
Alloy.Globals.isHighRes = (relHeight >= 300) && (relHeight < 700);
Alloy.Globals.isXHighRes=  relHeight >= 700;

log(`isSquare=${Alloy.Globals.isSquare}, isLowRes=${Alloy.Globals.isLowRes}, isHighRes=${Alloy.Globals.isHighRes}, isXHighRes=${Alloy.Globals.isXHighRes}`);
