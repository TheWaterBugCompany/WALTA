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
        Topics.fireTopicEvent(Topics.SURVEY_STARTED, {
            sample: Alloy.Models.instance("sample"),
            taxa: Alloy.Collections.instance("taxa"),
        });
    },

    isNewSurvey: function( sample ) {
        return sample.isNewSurvey();
    },

    hasUnsavedChanges: async function( sample ) {
        return sample.hasUnsavedChanges();
    },

    discardSurvey: function( sample ) {
        sample.destroy();
    },

    submitSurvey: function( sample ) {
        return sample.saveCurrentSample()
            .then( () => {
                debug("forcing upload");
                Topics.fireTopicEvent(Topics.FORCE_UPLOAD);
            });
    }

}