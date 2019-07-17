/*
    Simple class to determine which bboxes have been
    already been requested, and return a set of bboxes
    needed to fill in any gaps.
*/
const bbox = require('@turf/bbox').default;
const bboxPolygon = require('@turf/bbox-polygon').default;
const difference = require('@turf/difference');
const { polygon } = require('@turf/helpers');
const { flattenReduce } = require('@turf/meta');
const { partitionOrthoRing } = require('./geometry');
const union = require('@turf/union').default;
const _ = require('lodash');
const RBush = require('rbush');

 function toBBoxRBush(bbox) {
    return {
        minX: bbox[0], 
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3] 
    }
}

function fromRBushBBox(rrb) {
    return [ rrb.minX, rrb.minY, rrb.maxX, rrb.maxY ];
}

function processPolygons( p ) {
    return _.map( 
        partitionOrthoRing( p.geometry.coordinates[0] ), 
        (r)=> bbox( polygon( [r] ) ) 
    );
}

class BBoxCache {
    constructor() {
        this.index = new RBush();
    }
    bboxsToFetch( bbox1 ) {
        const existing = this.index.search( toBBoxRBush(bbox1) );
        if ( existing.length > 0 ) {
            const unionBBoxes = _.reduce( _.map(existing, (rbb) => bboxPolygon( fromRBushBBox( rbb ) ) ), union );
            
            const differenceBBoxes = difference( bboxPolygon( bbox1 ), unionBBoxes );
            if ( _.isNil( differenceBBoxes  ) ) {
                 return [];
            } else {
                this.index.insert( toBBoxRBush( bbox1 ) );
            }
            return flattenReduce( differenceBBoxes, (acc,p) => acc.concat( processPolygons(p) ), [] );
        } else {
            this.index.insert( toBBoxRBush( bbox1 ) );
            return [ bbox1 ];
        }
    }
}
module.exports = BBoxCache;