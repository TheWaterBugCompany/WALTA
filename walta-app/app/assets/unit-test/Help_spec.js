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
var Topics = require("ui/Topics");
var { closeWindow, controllerOpenTest, actionFiresTopicTest } = require("unit-test/util/TestUtils");
describe("Help controller", function() {
	var ctl;
	beforeEach( async () => {
		ctl = Alloy.createController("Help", { keyUrl: Ti.Filesystem.resourcesDirectory + "taxonomy/walta/" });
    await controllerOpenTest( ctl );
  });
	afterEach( async () => await closeWindow( ctl.getView() ) );
	it('should display the Help view', () => {});
  it('should fire the BACK event when the close button is clicked',  
    async () =>
      await actionFiresTopicTest( ctl.closeButton, 'click', Topics.BACK ) 
  );
});