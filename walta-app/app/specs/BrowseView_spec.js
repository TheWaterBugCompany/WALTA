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
require("specs/lib/ti-mocha");
var TestUtils = require('specs/util/TestUtils');
var KeyLoaderJson = require('logic/KeyLoaderJson');
var BrowseView = require('ui/BrowseView');

describe('BrowseView', function() {
	var bv, win, key;
	before( function(){
		key = KeyLoaderJson.loadKey( Ti.Filesystem.resourcesDirectory + '/specs/resources/simpleKey1/' );
		bv = BrowseView.createBrowseView( key );
		win = TestUtils.wrapViewInWindow( bv.view );
	});

	after( function() {
		TestUtils.closeWindow( win );
	});

	it('should display the browse view window', function() {
		TestUtils.windowOpenTest( win );
	});

});
