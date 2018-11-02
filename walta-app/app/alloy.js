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
var PlatformSpecific = require('ui/PlatformSpecific');

Alloy.Globals.Layout = require('ui/Layout'); 
Alloy.Events = _.clone(Backbone.Events);
Alloy.Globals.Key = null;
Alloy.Globals.isSmallHeight = (Ti.Platform.displayCaps.platformHeight < 500 );
Alloy.Globals.isLdpi = (Ti.Platform.displayCaps.density == "low");
//Alloy.Globals.isMdpi = (Ti.Platform.displayCaps.density == "mdpi");
Alloy.Globals.isHdpi = (Ti.Platform.displayCaps.density == "high");
//Alloy.Globals.isXdpi = (Ti.Platform.displayCaps.density == "xhdpi");
//Alloy.Globals.isXXdpi = (Ti.Platform.displayCaps.density == "xxhdpi");
//Alloy.Globals.isXXXdpi = (Ti.Platform.displayCaps.density == "xxxhdpi");