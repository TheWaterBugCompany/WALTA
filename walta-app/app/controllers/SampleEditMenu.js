var Topics = require('ui/Topics');

function onViewClick() {
    Alloy.Models.instance("sample").loadById($.args.sampleId);
    Alloy.Collections.instance("taxa").load($.args.sampleId);
    Topics.fireTopicEvent( Topics.SITEDETAILS, {slide:"right",readonly:true});
}

function onEditClick() {
    let sample = Alloy.Models.instance("sample");
    sample.loadById($.args.sampleId);
    let tempSample = sample.createTemporaryForEdit();
    Alloy.Models.sample = tempSample;
    Alloy.Collections.taxa = tempSample.loadTaxa();
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
