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
require("unit-test/lib/ti-mocha");
var { expect } = require('unit-test/lib/chai');
var KeyLoaderJson = require('logic/KeyLoaderJson');
var { closeWindow, controllerOpenTest } = require("unit-test/util/TestUtils");

describe('TaxonList controller', function() {
	var key, ctl;
	this.timeout(3000);
	before( function(){
		key = KeyLoaderJson.loadKey( Ti.Filesystem.resourcesDirectory + '/unit-test/resources/simpleKey1/' );
		ctl = Alloy.createController("TaxonList", { key: key });
	});

	after( function() {
		closeWindow( ctl.getView() );
	});

	it('should display the browse view window', function(done) {
		controllerOpenTest( ctl, done );
	});

});
