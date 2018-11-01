var MAYFLY = 0;
var ORDER = 1;
var DETAILED = 2;


exports.MAYFLY = MAYFLY;
exports.ORDER = ORDER;
exports.DETAILED = DETAILED;
exports.getSpeedbugIndexName = function( type ) {
    switch( type ) {
        case MAYFLY:
            return "Mayfly Muster Speedbug";
        case ORDER:
            return "Order Speedbug";
        case DETAILED:
            return "Speedbug";
    }
}