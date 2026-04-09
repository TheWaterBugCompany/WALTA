var HtmlView = require('ui/HtmlView');
exports.baseController  = "TopLevelWindow";
$.TopLevelWindow.title = "About";
$.name = "about";
$.content = HtmlView.createHtmlView( $.args.keyUrl + 'credits/credits.html').view;
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    if ( Ti.Platform.osname === 'android') { $.content.release(); }
    $.destroy();
    $.off();
    $.TopLevelWindow.removeEventListener('close', cleanUp );
  });