var Topics = require('ui/Topics');
exports.baseController  = "NavButton";
$.setLabel( "Next" );
$.setIconRight( "/images/icon-go-forward.png" );
_( $.args ).extend({slide: "right"});
$.on("click", () => Topics.fireTopicEvent( $.args.topic, $.args ) );
