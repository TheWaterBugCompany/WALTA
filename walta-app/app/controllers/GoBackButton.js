var Topics = require('ui/Topics');
exports.baseController  = "NavButton";
$.setLabel( "Back");
$.setIconLeft( "/images/icon-go-back.png" );
$.on("click", () => Topics.fireTopicEvent( Topics.BACK, $.args ) );
