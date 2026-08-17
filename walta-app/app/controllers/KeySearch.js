
/*
 * KeySearch
 *
 * Displays a choice between a binary set of Questions stored in a
 * KeyNode object.
 *
 */
var Topics = require('ui/Topics');
var PlatformSpecific = require('logic/PlatformSpecific');

exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "ALT Key";
$.name = "decision";

var key = $.args.key;
var keyNode = $.args.node;

// FIXME: The key object has state - but we ideally should be stateless
// this is a hack to return the key object to the correct place.
// (implemented so that the AppWindow class does not need to keep track of key state)
key.setCurrentNodeObj( keyNode );
var questions = $.questions = [];

$.TopLevelWindow.addEventListener('close', function cleanUp() {
  $.destroy();
  $.off();
  goBackBtn.cleanUp();
  questions.forEach( function(q) { q.cleanUp(); } );
  questions = null;
  $.TopLevelWindow.removeEventListener('close', cleanUp );
}); 

var acb = $.getAnchorBar(); 
$.args.name = "decision";
var goBackBtn = Alloy.createController("GoBackButton", {slide: "left"} );
// During a training assessment the key is the only allowed path, so omit the
// speedbug/browse shortcuts — otherwise the anchor bar slips past the greyed
// MethodSelect and defeats the exercise.
if ( !$.args.training ) {
  acb.addTool( acb.createToolBarButton( '/images/icon-speedbug-white.png', Topics.SPEEDBUG, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample, position: $.args.position }, "Speedbug" ), true );
  acb.addTool( acb.createToolBarButton( '/images/icon-browse-white.png', Topics.BROWSE, null, { surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample, position: $.args.position }, "Browse"  ), true );
}
acb.addTool( goBackBtn.getView() );

function goUp(e) {
  if ( !key.isRoot() && (PlatformSpecific.convertSystemToDip(e.x) < (PlatformSpecific.convertSystemToDip($.header.size.width)*0.2) ) ) {
    Topics.fireTopicEvent( Topics.UP, { node: key.getCurrentNode().parentLink, surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample, position: $.args.position, training: $.args.training, slide: "left" } );
  }
}
if ( key.isRoot() ) {
  $.header.remove($.upButton);
}

// Add each question
_(keyNode.questions).each( 
	function( q, index ) {
		var qv = Alloy.createController("Question", { question: q, label: (index === 0 ? 'top' : 'bottom') });
    questions.push( qv );
    $.content.add( _(qv.getView()).extend( { width: '95%', height: '44%', top: '1%', bottom: '1%' }) );
    qv.on("select",function() {
      key.choose( index );
			Topics.fireTopicEvent( Topics.FORWARD, { node: key.getCurrentNode(), surveyType: $.args.surveyType, allowAddToSample: $.args.allowAddToSample, position: $.args.position, training: $.args.training } );
		});
	}
);
