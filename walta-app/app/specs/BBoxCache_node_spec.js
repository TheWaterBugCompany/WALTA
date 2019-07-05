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
require("specs/lib/mocha");
var { expect } = require('specs/lib/chai');
if ( typeof(_) == "undefined") _ = require('underscore')._;

var BBoxCache = require('logic/BBoxCache');

describe('BBoxCache', function() {

	it( 'requesting a bbox never requested before returns the bbox', function() {
		var cache = new BBoxCache();
		var bbox = [0,0,10,10];
		expect( cache.bboxsToFetch(bbox) ).to.deep.equal([bbox]);
	});

	it( 'requesting an already requested bbox should return empty array', function() {
		var cache = new BBoxCache();
		var bbox = [0,0,10,10];
		cache.bboxsToFetch(bbox);
		expect( cache.bboxsToFetch(bbox) ).to.be.an('array').that.is.empty;
	});

	it( 'requesting an overlapping requested bbox should return multiple bboxes that do not overlap', function() {
		var cache = new BBoxCache();
		var bbox1 = [0,0,10,10], bbox2 = [5,5,15,15];
		cache.bboxsToFetch(bbox1);
		expect( cache.bboxsToFetch(bbox2) ).to.deep.equal([ [5,10,15,15], [10,5,15,10] ] );
	});
});
