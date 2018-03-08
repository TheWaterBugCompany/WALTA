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
require("specs/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');
var MenuView = require('ui/MenuView');
var Topics = require('ui/Topics');

describe('MenuView', function() {
	var mnu, win;

	mnu = MenuView.createMenuView();
	win = TestUtils.wrapViewInWindow( mnu.view );

	it('should display the menu view', function() {
		TestUtils.windowOpenTest( win );
	});

	it('should fire the KEYSEARCH topic', function() {
		TestUtils.actionFiresTopicTest( mnu._views.keysearch, 'click', Topics.KEYSEARCH );
	});

	it('should fire the SPEEDBUG topic', function() {
		TestUtils.actionFiresTopicTest( mnu._views.speedbug, 'click', Topics.SPEEDBUG );
	});

	it('should fire the BROWSE topic', function() {
		TestUtils.actionFiresTopicTest( mnu._views.browse, 'click', Topics.BROWSE );
	});

	it('should fire the HELP topic', function() {
		TestUtils.actionFiresTopicTest( mnu._views.help, 'click', Topics.HELP );
	});

	it('should fire the GALLERY topic', function() {
		TestUtils.actionFiresTopicTest( mnu._views.gallery, 'click', Topics.GALLERY );
	});

	it('should fire the ABOUT topic', function() {
		TestUtils.actionFiresTopicTest( mnu._views.about, 'click', Topics.ABOUT );
	});

	TestUtils.closeWindow( win );

});
