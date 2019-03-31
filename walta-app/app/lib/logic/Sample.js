var SURVEY_MAYFLY = 0;
var SURVEY_ORDER = 1;
var SURVEY_DETAILED = 2;

var WATERBODY_RIVER = 0;
var WATERBODY_WETLAND = 1;
var WATERBODY_LAKE = 2;


exports.SURVEY_MAYFLY = SURVEY_MAYFLY;
exports.SURVEY_ORDER = SURVEY_ORDER;
exports.SURVEY_DETAILED = SURVEY_DETAILED;

exports.WATERBODY_RIVER = WATERBODY_RIVER;
exports.WATERBODY_WETLAND = WATERBODY_WETLAND;
exports.WATERBODY_LAKE = WATERBODY_LAKE;

exports.getSpeedbugIndexName = function( type ) {
    switch( type ) {
        case SURVEY_MAYFLY:
            return "Mayfly Muster Speedbug";
        case SURVEY_ORDER:
            return "Order Speedbug";
        default:
            return "Speedbug";
    }
}

exports.surveyTypeToString = function( surveyType ) {
    switch( surveyType ) {
        case SURVEY_MAYFLY:
            return "Mayfly";
        case SURVEY_ORDER:
            return "Quick";
        case SURVEY_DETAILED:
            return "Detailed";
        default:
            return "Unknown";
    } 
}