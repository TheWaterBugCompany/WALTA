
var question = $.args.question;
$.question.text = question.text;

if ( question.photoUrls.length > 0 ) {
    $.photoSelect.setImage( question.photoUrls );
} else {
    $.Question.remove( $.photoSelectWrapper );
    $.question.width="80%";
    $.question.right="5%";
}

$.Question.accessibilityLabel = `question_${$.args.label}`;

function clickEvent(e) {
    e.cancelBubble = true;
    $.trigger( "select", e );
}

function cleanUp() {
    $.destroy();
    $.off();
}

exports.cleanUp = cleanUp;
