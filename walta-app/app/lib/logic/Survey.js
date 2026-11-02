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
        // Read the taxa off the sample we just settled on: reopening an
        // unfinished survey leaves the taxa singleton empty, and handing that
        // over shows an empty tray and reads as the identifications being lost.
        let sample = Alloy.Models.instance("sample");
        Topics.fireTopicEvent(Topics.SURVEY_STARTED, {
            sample: sample,
            taxa: sample.loadTaxa(),
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