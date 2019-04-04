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

Alloy.Globals.Map = require('ti.map');

Alloy.Events = _.clone(Backbone.Events);
Alloy.Globals.Key = null;

Ti.API.info("Determining device screen parameters...")

Ti.API.info(`platform display caps: width = ${Ti.Platform.displayCaps.platformWidth}, height = ${Ti.Platform.displayCaps.platformHeight}, density = ${Ti.Platform.displayCaps.density}, logicalDensityFactor  = ${Ti.Platform.displayCaps.logicalDensityFactor},`);

var relWidth = Ti.Platform.displayCaps.platformWidth / Ti.Platform.displayCaps.logicalDensityFactor;
var relHeight= Ti.Platform.displayCaps.platformHeight / Ti.Platform.displayCaps.logicalDensityFactor;

if ( relHeight > relWidth ) {
    Ti.API.warn(`Ugh we got portrait sized dimensions width = ${relWidth} height = ${relHeight} :-( swapping...`)
    var tmp = relHeight;
    relHeight = relWidth;
    relWidth = relHeight;   
    // we are reporting protrait mode
}

var aspectRatio = relWidth/relHeight;
var sizeFactor = relWidth/533;
 
Ti.API.info(`relWidth=${relWidth}, relHeight=${relHeight}, aspectRatio=${aspectRatio}, sizeFactor=${sizeFactor}`);

Alloy.Globals.isLowRes = sizeFactor < 0.7;
Alloy.Globals.isSquare = aspectRatio < 1.5;
Alloy.Globals.isHighRes = sizeFactor > 1.1 && sizeFactor <= 2;
Alloy.Globals.isXHighRes=  sizeFactor > 2;

Ti.API.info(`isSquare=${Alloy.Globals.isSquare}, isLowRes=${Alloy.Globals.isLowRes}, isHighRes=${Alloy.Globals.isHighRes}, isXHighRes=${Alloy.Globals.isXHighRes}`);
