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
var { expect } = require('specs/lib/chai');
var TestUtils = require('specs/util/TestUtils');
var Topics = require('ui/Topics');
var Alloy = require('alloy');
describe('MenuView', function() {
	var mnu, win;
	before( function() {
		mnu = Alloy.createController("Menu");
		win = TestUtils.wrapViewInWindow( mnu.getView() );
	});
	after( function() {
		TestUtils.closeWindow( win );
	});
	it('should display the menu view', function(done) {
		TestUtils.windowOpenTest( win, done );
	});

	it('should fire the KEYSEARCH topic', function(done) {
		TestUtils.actionFiresTopicTest( mnu.keysearch.getView(), 'click', Topics.KEYSEARCH, done );
	});

	it('should fire the SPEEDBUG topic', function(done) {
		TestUtils.actionFiresTopicTest( mnu.speedbug.getView(), 'click', Topics.SPEEDBUG, done );
	});

	it('should fire the BROWSE topic', function(done) {
		TestUtils.actionFiresTopicTest( mnu.browse.getView(), 'click', Topics.BROWSE, done );
	});

	it('should fire the HELP topic', function(done) {
		TestUtils.actionFiresTopicTest( mnu.help.getView(), 'click', Topics.HELP, done );
	});

	it('should fire the GALLERY topic', function(done) {
		TestUtils.actionFiresTopicTest( mnu.gallery.getView(), 'click', Topics.GALLERY, done );
	});

	it('should fire the ABOUT topic', function(done) {
		TestUtils.actionFiresTopicTest( mnu.about.getView(), 'click', Topics.ABOUT, done );
	});


});
