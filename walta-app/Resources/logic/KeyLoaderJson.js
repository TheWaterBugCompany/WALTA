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
var CircularJSON = require('lib/circular-json');
var Key = require('logic/Key');

// takes a variable list of path elements like the getFile() API call does
function loadKey( root ) {
	var file = Ti.Filesystem.getFile( root + "key.json" );
	return Key.createKey( CircularJSON.parse( file.read().text ) );
}

exports.loadKey = loadKey;