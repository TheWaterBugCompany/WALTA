
var question = $.args.question;
$.question.text = question.text;

if ( question.photoUrls.length > 0 ) {
    $.photoSelect.setImage( question.photoUrls );
} else {
    $.Question.remove( $.photoSelect.getView() );
    $.question.width="80%";
    $.question.right="5%";
}

function clickEvent(e) {
    e.cancelBubble = true;
    $.trigger( "select", e );
}

function cleanUp() {
    $.destroy();
    $.off();
}

exports.cleanUp = cleanUp;
