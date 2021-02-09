var { menuEntry } = require('ui/MenuBuilder');
var Topics = require('ui/Topics');

$.view = menuEntry( $.content, null, null, null,
  "View previously submitted survey.", false, true, "45%" );

$.edit = menuEntry( $.content, null, null, null,
  "Revise a previously submitted survey.", false, true, "45%" );

$.view.on("click", () => {
    Alloy.Models.instance("sample").loadById($.args.sampleId);
	Alloy.Collections.instance("taxa").load($.args.sampleId);
    Topics.fireTopicEvent( Topics.SITEDETAILS, {slide:"right",readonly:true});
} );

$.edit.on("click", () => {
    Alloy.Models.instance("sample").loadById($.args.sampleId);
	Alloy.Collections.instance("taxa").load($.args.sampleId);
    Topics.fireTopicEvent( Topics.SITEDETAILS, {slide:"right",readonly:false});
}  );

function closeEvent() {
  $.trigger("close");
}

function cleanUp() {
  $.destroy();
  $.off();
  $.view.cleanUp();
  $.edit.cleanUp();
}
exports.cleanUp = cleanUp;
