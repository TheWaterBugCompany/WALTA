var Topics = require('ui/Topics');
exports.baseController  = "NavButton";
$.setLabel( "Back");
$.setIconLeft( "/images/icon-go-back.png" );
_( $.args ).extend({slide: "left"});
if ( ! $.args.topic ) {
    $.args.topic = Topics.BACK
}
$.on("click", () => Topics.fireTopicEvent( $.args.topic, $.args ) );
