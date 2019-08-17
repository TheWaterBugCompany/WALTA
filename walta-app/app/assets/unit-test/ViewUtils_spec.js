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
var { expect } = require("unit-test/lib/chai");
var { closeWindow, windowOpenTest } = require("unit-test/util/TestUtils");
var { disableControl, enableControl, setError, clearError } = require("ui/ViewUtils");
describe("ViewUtils", function() {
	var win, btn;
	beforeEach( function() {
    win = Ti.UI.createWindow( { title: 'Test Window' });
    btn = Ti.UI.createButton( { title: 'Button', backgroundColor: 'green', borderColor: 'yellow', color: 'blue' } );
    win.add( btn );
    
	});
	afterEach( function(done) {
		closeWindow( win, done );
	});
	it('should grey button when disabled', function(done) {
		windowOpenTest( win, function() {
      disableControl( btn );
      expect( btn.backgroundColor).to.equal("#c9cacb");
      expect( btn.borderColor).to.equal("#c9cacb");
      expect( btn.color).to.equal("white");
      expect( btn.enabled ).to.be.false;
      expect( btn.touchEnabled ).to.be.false;
      done();
    } );
  });
  it('should reset button color when enabled', function(done) {
		windowOpenTest( win, function() {
      disableControl( btn );
      enableControl( btn );
      expect( btn.backgroundColor).to.equal("green");
      expect( btn.borderColor).to.equal("yellow");
      expect( btn.color).to.equal("blue");
      expect( btn.enabled ).to.be.true;
      expect( btn.touchEnabled ).to.be.true;
      done();
    } );
  });
  it('should enable even if not disabled', function(done) {
		windowOpenTest( win, function() {
      enableControl( btn );
      expect( btn.backgroundColor).to.equal("green");
      expect( btn.borderColor).to.equal("yellow");
      expect( btn.color).to.equal("blue");
      expect( btn.enabled ).to.be.true;
      expect( btn.touchEnabled ).to.be.true;
      done();
    } );
  });
  it('should remember original colors across multiple disables', function(done) {
		windowOpenTest( win, function() {
      disableControl( btn );
      disableControl( btn );
      enableControl( btn );
      expect( btn.backgroundColor).to.equal("green");
      expect( btn.borderColor).to.equal("yellow");
      expect( btn.color).to.equal("blue");
      expect( btn.enabled ).to.be.true;
      expect( btn.touchEnabled ).to.be.true;
      done();
    } );
  });
  it('should indicate error', function(done) {
		windowOpenTest( win, function() {
      setError( btn );
      expect( btn.borderColor).to.equal("red");
      expect( btn.color).to.equal("red");
      done();
    } );
  });
  it('should clear error', function(done) {
		windowOpenTest( win, function() {
      setError( btn );
      clearError( btn );
      expect( btn.borderColor).to.equal("yellow");
      expect( btn.color).to.equal("blue");
      done();
    } );
  });
  it('should clear error after multiple sets', function(done) {
		windowOpenTest( win, function() {
      setError( btn );
      setError( btn );
      clearError( btn );
      expect( btn.borderColor).to.equal("yellow");
      expect( btn.color).to.equal("blue");
      done();
    } );
  });
});