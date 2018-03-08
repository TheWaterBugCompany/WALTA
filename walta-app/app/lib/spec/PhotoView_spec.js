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
require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');

var PhotoView = require('ui/PhotoView');
var TestUtils = require('util/TestUtils');

describe('PhotoView', function() {
	var win, vw, pv;
	
	pv = PhotoView.createPhotoView([ 
			'/spec/resources/simpleKey1/media/amphipoda_01.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_02.jpg',
			'/spec/resources/simpleKey1/media/amphipoda_03.jpg'
		]);
	win = Ti.UI.createWindow( { 
		backgroundColor: 'white', 
		orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
	);
	vw = Ti.UI.createView( { width: '300dip', height: '250dip' });
	vw.add( pv.view );
	win.add( vw );

	it('should display the photo view thumbnail', function() {
		TestUtils.windowOpenTest( win ); 
	});
	
	TestUtils.closeWindow( win );
});
