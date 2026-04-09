var HtmlView = require('ui/HtmlView');
var Topics = require("ui/Topics");
exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.useUnSafeArea = true;
$.name = "help";
$.htmlView = HtmlView.createHtmlView( $.args.keyUrl + 'help/help.html' ).view;
$.content.add($.htmlView); 
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    if ( Ti.Platform.osname === 'android') { $.htmlView.release(); }
    $.destroy();
    $.off();
    $.TopLevelWindow.removeEventListener('close', cleanUp );
  });
  $.closeButton.on("close", () => Topics.fireTopicEvent( Topics.BACK ) );
