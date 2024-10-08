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
var { wrapViewInWindow, closeWindow, windowOpenTest, actionFiresTopicTest, setManualTests } = require('unit-test/util/TestUtils');
var Topics = require('ui/Topics');

describe('AnchorBar controller', function() {
	var acb, win, vw;
	function openAnchorBar(data) {
		acb = Alloy.createController( "AnchorBar", data);
		vw = acb.getView();
		vw.bottom = 0;
		vw.height = "10%";
		win = wrapViewInWindow(vw);
	}
	afterEach( async () => closeWindow( win ) );

	describe('with default Tools', function() {
		beforeEach( function(done) {
			openAnchorBar({ title: "Anchor Bar"});
			windowOpenTest( win, done );
		});

		it('should display an anchor bar', function() {
			
		});

		it('should fire the HOME event when the home button is clicked', function(done) {
			actionFiresTopicTest( acb.home, 'click', Topics.HOME, done );
		});
	})
    describe('without default tools', function() {
		beforeEach( function(done) {
			openAnchorBar({ title: "Anchor Bar", noDefaultTools: true});
			windowOpenTest( win, done );
		})
		it('should remove the default tools when noDefaultTools is true', function() {
			expect(acb.leftTools.children.length).to.equal(0) 
		});
	});

});
