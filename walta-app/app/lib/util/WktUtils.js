/**
 * 
 * @param {*} start - the starting angle in degrees
 * @param {*} end - the ending angle in degrees
 * @param {*} size - the size of the arc
 */
SEGMENTS = 5;
module.exports.makeArc = function( start, end, size ) {
    let start_rads = start*Math.PI/180,
        end_rads = end*Math.PI/180;
    let theta = start_rads,
        d = (end_rads - start_rads)/SEGMENTS;
    let pts = [], i = SEGMENTS;
    pts.push( [0,0] );
    while( i-- >= 0 ) {
        let x = size*Math.cos(theta),
            y = size*Math.sin(theta);
        pts.push( [x,y] );
        theta += d;
    }
    return `POLYGON((${pts.map(p => p.join(" ")).join(",")}))`
}