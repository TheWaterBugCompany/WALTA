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

var { subtractVectors, determinate, equals, partitionOrthoRing, 
      orthoVerticalIntersects, orthoHorizontalIntersects, Ring, OrthoRing } 
        = require('logic/geometry');

describe('subtractVectors', function() {
    // overkill perhaps but easy so why not.... :)
	it( 'should return (2,2) for (5,4) - (3,2)', function() {
		expect( subtractVectors( [5,4], [3,2]) ).to.deep.equal([2,2]);
    });
    it( 'should return (3,6) for (3,6) - (0,0)', function() {
		expect( subtractVectors( [3,6], [0,0]) ).to.deep.equal([3,6]);
    });
    it( 'should return (-10,-15) for (0,0) - (10,15)', function() {
		expect( subtractVectors( [0,0], [10,15]) ).to.deep.equal([-10,-15]);
    });
    it( 'should return (-8,-9) for (2,5) - (12,14)', function() {
		expect( subtractVectors( [2,5], [12,14]) ).to.deep.equal([-10,-9]);
	});
});

describe('determinate', function() {
    it( 'should return 0 for collinear vertices', function() {
		expect( determinate( [1,2], [3,4], [5,6] ) ).to.equal(0);
    });
	it( 'should return > 0 for counterclockwise concave vertices', function() {
		expect( determinate( [4,5], [5,6], [6,4] ) ).to.be.above(0);
    });
    it( 'should return < 0 for counterclockwise convex vertices', function() {
		expect( determinate( [3,2], [4,1], [5,2]) ).to.be.below(0);
    });
});

describe('equals', function() {
    it('should be true when points are equal', function() {
        expect( equals(0,0.000000005) ).to.be.true;
        expect( equals(9,9.000000005) ).to.be.true;
        expect( equals(9000000,9000000.000000005) ).to.be.true;
    });
    it('should be false when points are not equal', function() {
        expect( equals(0,0.000000015) ).to.be.false;
        expect( equals(9,9.000000015) ).to.be.false;
        expect( equals(9000000,9000000.000000015) ).to.be.false;
        expect( equals(94,92) ).to.be.false;
    });
})

describe('Ring', function() {
    it('should wrap aroung in index()', function() {
        var ring = [ [0,0], [0,1], [1,1], [1,0], [0,0] ];
        expect( new Ring(ring).index(4) ).to.equal(0);
        expect( new Ring(ring).index(6) ).to.equal(2);
        expect( new Ring(ring).index(0) ).to.equal(0);
        expect( new Ring(ring).index(3) ).to.equal(3);
    });
    it('should lookup the correct vertex()', function() {
        var ring = [ [0,0], [0,1], [1,1], [1,0], [0,0] ];
        expect( new Ring(ring).vertex(4)).to.deep.equal([0,0]);
        expect( new Ring(ring).vertex(2)).to.deep.equal([1,1]);
    });

    it('should return the correct slice()', function() {
        var ring = [ [0,0], [0,1], [1,1], [1,0], [0,0] ];
        expect( new Ring(ring).slice(0,3)).to.deep.equal([[0,0],[0,1],[1,1]]);
        expect( new Ring(ring).slice(3,3)).to.deep.equal([[1,0],[0,0],[0,1]]);
    });

    describe('nextConcaveVertex()', function() {
        it( 'should return empty for convex ring', function() {
            expect( new Ring([ [0,0], [1,0], [1, 1], [0, 0] ] )
                    .nextConcaveVertex() )
                .to.be.null;
        });
        it( 'should handle concave ring', function() {
            expect( new Ring([ [0,0], [1,0], [2, 3], [4,2], [2,4], [1,4], [0, 0] ])
                    .nextConcaveVertex() )
                .to.equal( 2 );
        });
    });
});

describe('orthoVerticalIntersects', function(){
    it('should return true if an edge intersects', function() {
        expect( orthoVerticalIntersects( [0,0], [-1,-5], [1,5]) ).to.be.true;
    });
    it('should return true if an edge intersects precisely on the left', function() {
        expect( orthoVerticalIntersects( [5,-15], [5,-5], [8,-5]) ).to.be.true;
    });
    it('should return true if an edge intersects precisely on the right', function() {
        expect( orthoVerticalIntersects( [8,-15], [5,-5], [8,-5]) ).to.be.true;
    });
    it('should return false if an edge doesn\'t intersects', function() {
        expect( orthoVerticalIntersects( [0,0], [-5,5], [-1,5]) ).to.be.false;
    });
});

describe('orthoHorizontalIntersects', function(){
    it('should return true if an edge intersects', function() {
        expect( orthoHorizontalIntersects( [0,0], [-1,-5], [1,5]) ).to.be.true;
    });
    it('should return true if an edge intersects precisely on the top', function() {
        expect( orthoHorizontalIntersects( [5,-15], [5,-15], [8,-5]) ).to.be.true;
    });
    it('should return true if an edge intersects precisely on the bottom', function() {
        expect( orthoHorizontalIntersects( [8,-15], [5,-5], [8,-15]) ).to.be.true;
    });
    it('should return false if an edge doesn\'t intersects', function() {
        expect( orthoHorizontalIntersects( [0,0], [-5,15], [-1,5]) ).to.be.false;
    });
});

describe('OrthoRing', function() {
    describe('nextIntersection', function() {
        it('should split a simple concave polygon horizontal case', function() {
            let ring = new OrthoRing([ [0,0], [0,-1], [1,-1], [1,-2], [3,-2], [3,0], [0,0] ]),
                res = ring.nextIntersection(2);
            expect( res.point ).to.deep.equal([3,-1]);
            expect( res.index ).to.equal(4);
        });
        it('should split a simple concave polygon vertical case', function() {
            let ring = new OrthoRing([ [0,0], [0,-2], [1,-2], [1,-1], [3,-1], [3,0], [0,0] ]),
            res = ring.nextIntersection(3);
            expect( res.point ).to.deep.equal([1,0]);
            expect( res.index ).to.equal(5);
        });
    });
});

describe('partitionOrthoRing', function() {
    it( 'should return the ring if it is convex', function() {
        expect( partitionOrthoRing( [ [0,0], [1,0], [1, 1], [0, 0] ] ) )
            .to.deep.equal( [ [ [0,0], [1,0], [1, 1], [0, 0] ] ] );
    });
    it( 'should handle simpliest case with horizontal concave edge', function() {
        expect( partitionOrthoRing( [ [0,0], [0,-1], [1,-1], [1,-2], [3,-2], [3,0], [0,0] ] ) )
            .to.deep.equal( [ 
                    [ [1,-1], [1,-2], [3, -2], [3,-1], [1, -1] ],
                    [ [3,-1], [3,0], [0,0], [0,-1], [3,-1] ]
                 ] );
    });
    it( 'should handle simpliest case with vertical concave edge', function() {
        expect( partitionOrthoRing( [ [0,0], [0,-2], [1,-2], [1,-1], [3,-1], [3,0], [0,0] ] ) )
            .to.deep.equal( [ 
                    [ [1,-1], [3,-1], [3, 0], [1,0], [1, -1] ],
                    [ [1,0], [0,0], [0,-2], [1,-2], [1,0] ] 
                ] );
    });
    it( 'should handle co-horizontal split', function() {
        expect( partitionOrthoRing( [ [0,0], [0,-1], [1,-1], [1,-2], [2,-2], [2,-1], 
            [3,-1], [3,0], [2,0], [2,1], [1,1], [1,0], [0,0] ] ) )
            .to.deep.equal( [ 
                    [ [1,-1], [1,-2], [2,-2], [2, -1], [1,-1] ],
                    [ [2,0], [2, 1], [1,1], [1,0], [2,0] ],
                    [ [0,0], [0,-1], [3,-1], [3,0], [0,0] ] 
                ] );
    });
    it( 'should handle co-vertical split', function() {
        expect( partitionOrthoRing( [ [0,0], [0,-1], [-1,-1], [-1,-2], [0,-2], [0,-3], 
                    [1,-3], [1,-2], [2,-2], [2,-1], [1,-1], [1,0], [0,0] ] ) )
            .to.deep.equal( [ 
                    [ [0,-1], [-1,-1], [-1,-2], [0,-2], [0,-1] ], 
                    [ [1,-2], [2,-2], [2,-1], [1,-1], [1,-2] ],
                    [ [1,0], [0,0], [0,-3], [1,-3], [1,0] ]
                ] );
    });
    it( 'should handle wrapping around ring', function() {
        expect( partitionOrthoRing( [ [0,0], [0,-2], [2,-2], [2,-1], [1,-1], [1,0], [0,0] ] ) )
            .to.deep.equal( [ 
                    [ [1,-1], [1,0], [0,0], [0,-1], [1, -1] ], 
                    [ [0,-1], [0,-2], [2,-2], [2,-1], [0,-1] ]
                ] );
    } );
    it( 'complex recursive case', function() {
        expect( partitionOrthoRing( [ [0,0], [0,-1], [-2,-1], [-2,-2], [-1,-2], [-1,-3], [0,-3], [0,-4],
            [1,-4], [1,-2.5], [2,-2.5], [2,-5], [4,-5], [4,-4], [3,-4], 
            [3,-2.5], [5,-2.5], [5,-1], [2,-1], [2,0], [0,0] ] ) )
            .to.deep.equal( [ 
                    [ [-1,-2], [-1,-3], [0,-3], [0,-2], [-1,-2] ],
                    [ [0,-2], [0,-1], [-2,-1], [-2,-2], [0,-2] ],
                    [ [3,-4], [3,-2.5], [2,-2.5], [2,-4], [3,-4] ],
                    [ [2,-4], [2,-5], [4,-5], [4,-4], [2,-4] ],
                    [ [2,-1], [2,0], [1,0], [1,-1], [2,-1] ],
                    [ [1,-1], [1,-2.5], [5,-2.5], [5,-1], [1,-1] ],
                    [ [1,0], [0,0], [0,-4], [1,-4], [1,0] ],
                ] );
    } );
});