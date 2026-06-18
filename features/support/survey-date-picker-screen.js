const IosSurveyDatePickerScreen = require('./ios-survey-date-picker-screen');
const AndroidSurveyDatePickerScreen = require('./android-survey-date-picker-screen');

// iOS shows an inline Ti.UI.Picker (date wheels) in an Alloy modal; Android
// shows the native calendar dialog. Entirely different element trees, so each
// gets its own screen class; this factory returns the right one.
function createSurveyDatePickerScreen( world ) {
    return world.platform === 'ios'
        ? new IosSurveyDatePickerScreen( world )
        : new AndroidSurveyDatePickerScreen( world );
}
module.exports = createSurveyDatePickerScreen;
