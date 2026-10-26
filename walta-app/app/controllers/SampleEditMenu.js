var Topics = require('ui/Topics');

// Loading into the current-sample singleton would leave it pointing at a
// finished sample while the user's unfinished survey still sits in the table,
// and the next "start survey" would replace that survey.
function onViewClick() {
    let viewed = Alloy.createModel("sample");
    viewed.loadById($.args.sampleId);
    let viewedTaxa = Alloy.createCollection("taxa");
    viewedTaxa.load($.args.sampleId);
    Topics.fireTopicEvent(Topics.SURVEY_STARTED, {
        sample: viewed,
        taxa: viewedTaxa,
    });
    Topics.fireTopicEvent( Topics.SITEDETAILS, {slide:"right",readonly:true});
}

function onEditClick() {
    let sample = Alloy.createModel("sample");
    sample.loadById($.args.sampleId);
    let tempSample = sample.createTemporaryForEdit();
    Topics.fireTopicEvent(Topics.SURVEY_STARTED, {
        sample: tempSample,
        taxa: tempSample.loadTaxa(),
    });
    Topics.fireTopicEvent( Topics.SITEDETAILS, {slide:"right",readonly:false});
}

$.view.addEventListener("click", onViewClick);
$.edit.addEventListener("click", onEditClick);
$.closeButton.on("close", () => $.trigger("close") );

function cleanUp() {
  $.view.removeEventListener("click", onViewClick);
  $.edit.removeEventListener("click", onEditClick);
  $.destroy();
  $.off();
}
exports.cleanUp = cleanUp;
