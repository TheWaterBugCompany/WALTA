function closeEvent(e) {
    e.cancelBubble = true;
    $.trigger("close");
}