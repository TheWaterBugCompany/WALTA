var SampleSync = require("logic/SampleSync");
var debug = m => Ti.API.info(m);
exports.Survey = {
    forceUpload: function() {
        debug("forcing synchronise");
        SampleSync.forceUpload();
    },
    startSurvey: function( surveyType ) {
        Alloy.Collections.instance("sample").startNewSurveyIfComplete(surveyType, Alloy.Globals.CerdiApi.retrieveUserId());
    },
    hasUnsavedChanges: async function() {
        return Alloy.Models.instance("sample").hasUnsavedChanges();
    },
    discardSurvey: function() {
        Alloy.Models.instance("sample").destroy();
    }

}