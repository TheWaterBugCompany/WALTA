/*
 * KeySearch
 *
 * Displays a choice between a binary set of Questions stored in a
 * KeyNode object.
 *
 */
var Topics = require('ui/Topics');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "ALT Key";
$.name = "decision";
$.args.name = "decision";

// Floor + the anchor bar. The Ti-free lib/mvvm/controllers/KeySearch (built by
// View.openView) owns the view-model, the branch collection and the hint; all
// that remains here is anchor-bar view construction, which waits on a nav seam.
// See docs/patterns/screen-controllers.md.
var acb = $.getAnchorBar();
var goBackBtn = Alloy.createController("GoBackButton", {slide: "left"} );
// During a training assessment the key is the only allowed path, so omit the
// speedbug/browse shortcuts — otherwise the anchor bar slips past the greyed
// MethodSelect and defeats the exercise.
if ( !$.args.training ) {
  acb.addTool( acb.createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample, position: $.args.position }, "Speedbug" ), true );
  acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample, position: $.args.position }, "Browse"  ), true );
}
acb.addTool( goBackBtn.getView() );

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  goBackBtn.cleanUp();
  $.destroy();
  $.off();
  $.TopLevelWindow.removeEventListener('close', cleanUp );
});
