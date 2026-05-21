var SampleSync = require("logic/SampleSync");

var Topics = require('ui/Topics');

var Logger = require('util/Logger');
var debug = (m, tag = "ui") => Logger.debug(m, tag);
exports.Survey = {
    uploadNewSample: function() {
        debug("uploading new sample");
        SampleSync.uploadPending();
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
                debug("forcing upload");
                Topics.fireTopicEvent(Topics.FORCE_UPLOAD);
            });
    }

}