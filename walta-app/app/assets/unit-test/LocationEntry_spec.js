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
var { closeWindow, windowOpenTest, wrapViewInWindow, clickButton, checkTestResult } = require("unit-test/util/TestUtils");
describe("LocationEntry controller", function () {
  //this.timeout(10000);
  var win, scr, view;
  var sample = Alloy.Models.sample;
  function createMap() {
    scr = Alloy.createController("LocationEntry", {
      getCurrentPosition: function (callback) {
        callback({
          coords: {
            accuracy: 100,
            latitude: -42.890734,
            longitude: 147.671216
          }
        });
      }
    });
    view = scr.getView();
    win = wrapViewInWindow(view);
    win.addEventListener("close", function handler() {
      win.removeEventListener("close", handler);
      scr.cleanUp();
    })
  }
  beforeEach(function () {
    sample = Alloy.Models.instance("sample");
    sample.off();
    sample.clear();
  });

  afterEach(function (done) {
    closeWindow(win, done);
  });

  it('should display overlay', function (done) {
    createMap();
    windowOpenTest(win, done);
  });

  it('should fire cancel event', function (done) {
    createMap();
    windowOpenTest(win, function () {
      scr.on("close", () => done());
      scr.cancelButton.fireEvent("click");
    });
  });

  it('should display existing location', function (done) {
    sample.set("lat", "-42.888381");
    sample.set("lng", "147.665715");
    sample.save();
    createMap();
    windowOpenTest(win, done);
  });

  it('should set the location when the locate button is pressed', function (done) {
    var removeDupsDone = _.once(done);
    createMap();
    windowOpenTest(win, function () {
      sample.on("change:lng change:lat", function () {
        checkTestResult(() => {
          let lat = parseFloat(sample.get("lat")),
            lng = parseFloat(sample.get("lng")),
            accuracy = parseFloat(sample.get("accuracy"));
          expect(lat).to.equal(-42.890734);
          expect(lng).to.equal(147.671216);
          expect(accuracy).to.equal(100);
          removeDupsDone();
        });

      });
      clickButton(scr.locateButton);
      clickButton(scr.saveButton);
    });
  });

  it('should set the location on a map save', function (done) {
    var removeDupsDone = _.once(done);
    windowOpenTest(win, function () {
      sample.on("change:lng change:lat", function () {
        checkTestResult(() => {
          let lat = parseFloat(sample.get("lat")),
            lng = parseFloat(sample.get("lng"));
          expect(lat).to.equal(-42.888);
          expect(lng).to.equal(147.665);
          removeDupsDone();
        });
      });
      Ti.App.fireEvent("waterbug-map:longpress", { lat: -42.888, lng: 147.665 });
      clickButton(scr.saveButton);
    });
  });

  it('should NOT set the location on a map cancel', function (done) {
    var removeDupsDone = _.once(done);
    windowOpenTest(win, function () {
      sample.on("change:lng change:lat", function () {
        expect.fail("map click changed point when map cancelled!");
      });
      Ti.App.fireEvent("waterbug-map:longpress", { lat: -42.888, lng: 147.665 });
      clickButton(scr.cancelButton);
      setTimeout(done, 100); // 100 ms is enough to catch event if is going to happen
    });
  });

  it('should NOT set the location on a click if disabled', function (done) {
    windowOpenTest(win, function () {
      sample.on("change:lng change:lat", function () {
        expect.fail("map click changed point when control disabled!");
      });
      Ti.App.fireEvent("waterbug-map:longpress", { lat: -42.888, lng: 147.665 });
      setTimeout(done, 100); // 100 ms is enough to catch event if is going to happen
    });
  });

  context("location entry seperate screen", function () {
    it('should display "unobtained location" with no lock'/*, function (done) {
      ctl = Alloy.createController("SiteDetails");
      controllerOpenTest(ctl, function () {
        // unset these here to avoid triggering the geolocation service
        sample.unset("lng");
        sample.unset("lat");
        expect(ctl.locationStatus.text).to.equal("Location unobtained");
        done();
      });
    }*/);

    it('should display location coordinates with a lock'/*, function (done) {
      ctl = Alloy.createController("SiteDetails");
      controllerOpenTest(ctl, function () {
        expect(ctl.locationStatus.text).to.equal("42.8907°S 147.6713°E");
        done();
      });
    }*/);

    it('should update coordinates when gps lock is obtained'/*, function (done) {
      ctl = Alloy.createController("SiteDetails");
      controllerOpenTest(ctl, function () {
        sample.unset("lng");
        sample.unset("lat");
        Topics.fireTopicEvent(Topics.GPSLOCK, { latitude: -41.8907, longitude: 145.6713, accuracy: 1 });
        setTimeout(() => checkTestResult(done, () => {
          expect(ctl.locationStatus.text).to.equal("41.8907°S 145.6713°E");
        }), 50);
      });
    }*/);

    it('should update coordinates when location is changed'/*, function (done) {
      ctl = Alloy.createController("SiteDetails");
      controllerOpenTest(ctl, function () {
        expect(ctl.locationStatus.text).to.equal("42.8907°S 147.6713°E");
        sample.set("lng", "145.671339");
        sample.set("lat", "-41.890748");
        setTimeout(() => checkTestResult(done, () => {
          expect(ctl.locationStatus.text).to.equal("41.8907°S 145.6713°E");
        }), 50);
      });
    }*/);

    it('should NOT update coordinates when a new gps lock is obtained if location already set'/*, function (done) {
      ctl = Alloy.createController("SiteDetails");
      controllerOpenTest(ctl, function () {
        expect(ctl.locationStatus.text).to.equal("42.8907°S 147.6713°E");
        Topics.fireTopicEvent(Topics.GPSLOCK, { latitude: 23, longitude: 100, accuracy: 1 });
        setTimeout(() => checkTestResult(done, () => {
          expect(ctl.locationStatus.text).to.equal("42.8907°S 147.6713°E");
        }), 50);
      });
    }*/);


    it('should open a map viewer when location icon is clicked'/*, function (done) {
      ctl = Alloy.createController("SiteDetails");
      controllerOpenTest(ctl, function () {
        expect(ctl.locationStatus.text).to.equal("42.8907°S 147.6713°E");
        ctl.locationIndicator.fireEvent("click");
        setTimeout(function () {
          expect(ctl.locationEntry.getView().visible).to.be.true;
          done();
        }, 50);
      });
    }*/);
  })

});