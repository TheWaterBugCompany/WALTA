/*
    These functions follow a right handed convention; that is rings are ordered in
    counter-clockwise order. Holes are ordered in clockwise order. As per RFC7946.

    Vectors are an array where v[0] = x and v[1] = y, this is chosen to mesh well with
    parsing GeoJSON data. 
*/
'use strict';

const _ = require('lodash');

const TOLERANCE = 0.00000001;

// convenience function to subtract to position coordinates to get
// vectors.
function subtractVectors( a, b ) {
    return [a[0]-b[0], a[1]-b[1]];
}

// if the determinate is 0 then vectors are collinear, if > 0 they are concave
// and if < 0 they are convex.
function determinate( a, b, c ) {
    let v1 = subtractVectors( b, a ), v2 = subtractVectors( b, c );
    return v1[0]*v2[1] - v1[1]*v2[0];
}

function equals(a,b) {
    return Math.abs(a-b) < TOLERANCE;
}

/* s is point on a vertical edge, v1->v2 is horizontal
   does the extension of s intersect v1->v2 ? */
function orthoVerticalIntersects( s, v1, v2 ) {
    return ( (s[0] < v1[0] && s[0] > v2[0]) 
      || (s[0] > v1[0] && s[0] < v2[0]) )
      || equals(s[0],v1[0]) || equals(s[0],v2[0]);
}

/* s is a point on a horizontal edge, v1->v2 is vertical
    does the extension of s->e intersect v1->v2 ? */
function orthoHorizontalIntersects( s, v1, v2 ) {
    return ( (s[1] < v1[1] && s[1] > v2[1]) 
        || (s[1] > v1[1] && s[1] < v2[1]) )
        || equals(s[1],v1[1]) || equals(s[1],v2[1]);
}

class Ring {
    constructor( ring ) {
        this.ring = ring;
    }
    index(n) {
        return n%(this.ring.length-1)
    }
     
    vertex(n) {
        return this.ring[this.index(n)];
    }

    slice(s,n) {
        let r = [];
        for( let i = 0; i < n; i++) 
            r.push(this.vertex(s+i));
        return r;
    }

    nextConcaveVertex(s = 0) {
        for( let i = 0; i < this.ring.length - 1; i++ ) {
            if ( determinate( this.vertex(s+i), this.vertex(s+i+1), this.vertex(s+i+2) ) > 0 )  
                return s+i+1;
        }
        return null;
    }
}

class OrthoRing extends Ring {
    constructor( ring ) {
        super( ring );
    }

    /* Follow the ring around counterclockwise
       and return the point of intersection created
       by extending edge v[n]=>v[n+1]. returns: 
        {
            point: the coordinates of intersection
            index: the index of edge being split
        } */
    nextIntersection( n ) {
        let s = this.vertex(n), p = this.vertex(n-1),
            isVert = equals( s[0], p[0] );

        /* We can skip every second vertex because of the
           nature of an orthogonal polygon...*/
        for( let i = 2; i < this.ring.length+1; i=i+2 ) {
            let v1 = this.vertex(n+i),
                v2 = this.vertex(n+i+1);
            /* The following exploits the fact that the edges
               are orthonormal which makes the intersection 
               rather trivial... */
            if ( isVert ) {
                if ( orthoVerticalIntersects( s, v1, v2 ) )
                    return { point: [s[0],v1[1]], index: this.index(n+i)};
            } else { 
                if ( orthoHorizontalIntersects( s, v1, v2 ) )
                    return { point: [v1[0],s[1]], index: this.index(n+i)};
            }
        }
    }

    /* Takes a concave orthogonal ring and splits it into a partition of 
       convex rectangular rings. Note there is no guarentee that the 
       partition will be minimal. */
    partition() {
        let i = this.nextConcaveVertex(0);

        // No intersections implies non-concave ring so the
        // paritition is simply the identity.
        if ( _.isNull(i) ) return [this];

        let ixn = this.nextIntersection( i );
        
        // Snip off a sub polygon
        let p1 = this.slice( i, Math.abs(ixn.index - i + 1) );
        p1.push( ixn.point );
        p1.push( p1[0] );

        // Splice the rest of the polygon 
        let p2 = this.slice( ixn.index+1, this.ring.length - p1.length + 1);

        // Check for co-grid points before adding intersection point.
        if ( ! ( equals( p2[0][0], ixn.point[0] ) 
             && equals( p2[0][1], ixn.point[1] ) ) ) {
            p2.unshift(ixn.point);
        }

        // Check for the case where the first point is collinear, if so
        // the first point in the new ring is rendendant so discard it.
        if ( determinate( p2[p2.length-1], p2[0], p2[1]) === 0 ) {
            p2.shift(p2);
        }
        p2.push( p2[0] );

        return new OrthoRing(p1).partition()
            .concat( new OrthoRing(p2).partition());
    }
}

function partitionOrthoRing( ring ) {
    return _.map(new OrthoRing(ring).partition(), (p) => p.ring);
}

exports.equals = equals;
exports.orthoVerticalIntersects = orthoVerticalIntersects;
exports.orthoHorizontalIntersects = orthoHorizontalIntersects;
exports.subtractVectors = subtractVectors;
exports.determinate = determinate;
exports.Ring = Ring;
exports.OrthoRing = OrthoRing;
exports.partitionOrthoRing = partitionOrthoRing;