function cleanUp() {
    $.destroy();
    $.off();
    $.GoBackButton.removeEventListener( 'click', clickButton);
}
function clickButton(e) {
    Topics.fireTopicEvent( Topics.BACK, $.args );
    e.cancelBubble = true;
} 
$.GoBackButton.addEventListener( 'click', clickButton);
exports.cleanUp = cleanUp;

