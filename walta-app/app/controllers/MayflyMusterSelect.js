var Topics = require('ui/Topics');
var { menuEntry } = require('ui/MenuBuilder');
$.explore = menuEntry( $.content, "/images/add-site-icon.png", "Explore Emergence", null,
  "Visualise mayfly emergence on a map.", false, true, "46%" );

$.survey = menuEntry( $.content, "/images/mayfly-muster-icon.png", "Start Survey", Topics.MAYFLY,
  "Perform a mayfly survey.", false, true, "45%"  );

$.explore.on("click", function() {
  Topics.fireTopicEvent( Topics.MAYFLY_EMERGENCE );
});

function closeEvent() {
  $.trigger("close");
}

function cleanUp() {
  $.destroy();
  $.off();
  $.explore.cleanUp();
  $.survey.cleanUp(); 
}
exports.cleanUp = cleanUp;
