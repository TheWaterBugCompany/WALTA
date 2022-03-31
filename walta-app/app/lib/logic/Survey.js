var SampleSync = require("logic/SampleSync");

var Topics = require('ui/Topics');

var debug = m => Ti.API.info(m);
exports.Survey = {
    forceUpload: function() {
        debug("forcing synchronise");
        SampleSync.forceUpload();
    },

    startSurvey: function( surveyType ) {
        Alloy.Collections.instance("sample").startNewSurveyIfComplete(surveyType, Alloy.Globals.CerdiApi.retrieveUserId());
    },

    isNewSurvey: function() {
        return Alloy.Models.instance("sample").isNewSurvey();
    },

    hasUnsavedChanges: async function() {
        return Alloy.Models.instance("sample").hasUnsavedChanges();
    },

    discardSurvey: function() {
        Alloy.Models.instance("sample").destroy();
    },

    submitSurvey: function() {
        return Alloy.Models.instance("sample").saveCurrentSample()
            .then( () => {
                Ti.API.info("forcing upload");
                Topics.fireTopicEvent(Topics.FORCE_UPLOAD);
            });
    }

}