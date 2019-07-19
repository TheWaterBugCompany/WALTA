
var question = $.args.question;
var { setAccessibilityLabel } = require('ui/ViewUtils');
$.question.text = question.text;

if ( question.photoUrls.length > 0 ) {
    $.photoSelect.setImage( question.photoUrls );
} else {
    $.Question.remove( $.photoSelectWrapper );
    $.question.width="80%";
    $.question.right="5%";
}

setAccessibilityLabel( $.Question, "question", $.args.label );

function clickEvent(e) {
    e.cancelBubble = true;
    $.trigger( "select", e );
}

function cleanUp() {
    $.destroy();
    $.off();
}

exports.cleanUp = cleanUp;
