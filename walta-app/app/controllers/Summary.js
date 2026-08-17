var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "Summary";
$.name = "summary"; 

var readOnlyMode = $.args.readonly === true;
var Survey = $.args.Survey;
var sample = $.args.sample;

// Render the summary from the sample threaded in (in edit mode that is a temp copy,
// not the global singleton), so the scores, date and assessment aren't blank when
// editing. transform() already resolves the edit date from overrideDateCompleted.
function renderSummary() {
    var s = sample.transform();
    $.heading.text = `${s.surveyType} Survey`;
    $.siteInfo.text = s.siteInfo;
    $.dateCompleted.text = `Date: ${s.dateCompleted}`;
    $.signalScore.text = s.score;
    $.signalScore.backgroundColor = s.scoreColor;
    $.weightedSignalScore.text = s.w_score;
    $.weightedSignalScore.backgroundColor = s.w_scoreColor;
    $.taxaCount.text = `${s.taxaCount}`;
    $.interpretation.text = s.impactText;
}
renderSummary();

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.destroy();
    $.off();
    $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var acb = $.getAnchorBar(); 
$.backButton = Alloy.createController("GoBackButton", { topic: Topics.NOTES, slide: "left", readonly: readOnlyMode  }  ); 
$.nextButton = Alloy.createController("NavButton");

$.nextButton.setLabel("Done");
if ( readOnlyMode ) {
    $.nextButton.disable();
} else {
    $.nextButton.on("click", doneClick );
}
acb.addTool( $.backButton.getView() ); 
acb.addTool( $.nextButton.getView() );



function doneClick() {
    saveSampleAndUpload()
     .then(() => {
        if ( Alloy.Globals.CerdiApi.retrieveUserToken() )
            Topics.fireTopicEvent( Topics.HOME, null );
        else
            Topics.fireTopicEvent( Topics.LOGIN, null );
     });
}

var COMPLETE = "The survey is complete and will be uploaded in the background when internet access becomes available.";
var COMPLETE_NOT_REGISTERED = "The survey is complete. The next step is to register via the home screen and data will be uploaded in the background when internet access becomes available.";
var INCOMPLETE_NO_LOCK = "I haven't been able to obtain a GPS lock yet, please ensure you have location enabled and move to out into the open to allow the coordinates to be collected.";

var saveSampleAndUpload = function() {
    return Survey.submitSurvey( sample )
        .then( setMessageText );
};

function checkGpsLock() {
    if ( !(sample.get("lat") && sample.get("lng") ) ) {
        $.nextButton.disable();
        $.message.text = INCOMPLETE_NO_LOCK;
        $.message.color = "red";
    } else {
        if ( !readOnlyMode) {
            $.nextButton.enable();
        }
        setMessageText();
        
    }
}

function setMessageText() {
    if ( sample.isComplete() ) {
        if ( !Alloy.Globals.CerdiApi.retrieveUserToken() ) {
            $.message.text = COMPLETE_NOT_REGISTERED
        } else {
            $.message.text = COMPLETE
        }
        $.message.color = "#70Ad47";
    }
}


sample.on("change", checkGpsLock );	
sample.trigger("change");

