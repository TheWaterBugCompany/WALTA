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
var HtmlView = require('ui/HtmlView');
exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Help";
$.name = "help";
$.content = HtmlView.createHtmlView( $.args.keyUrl + 'help/help.html' ).view; 
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    if ( Ti.Platform.osname === 'android') { $.content.release(); }
    $.destroy();
    $.off();
    $.TopLevelWindow.removeEventListener('close', cleanUp );
  });