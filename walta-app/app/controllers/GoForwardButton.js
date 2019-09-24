var Topics = require('ui/Topics');
exports.baseController  = "NavButton";
$.setLabel( "Next" );
$.setIconRight( "/images/icon-go-forward.png" );
$.on("click", () => Topics.fireTopicEvent( $.args.topic , $.args ) );
