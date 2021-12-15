exports.Survey = {
    forceUpload: function() {
        debug("forcing synchronise");
        SampleSync.forceUpload();
    },
    startSurvey: function( surveyType ) {
        Alloy.Collections.instance("sample").startNewSurveyIfComplete(surveyType, Alloy.Globals.CerdiApi.retrieveUserId());
    }
}