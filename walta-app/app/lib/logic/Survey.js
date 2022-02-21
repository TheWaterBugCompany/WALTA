var SampleSync = require("logic/SampleSync");
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