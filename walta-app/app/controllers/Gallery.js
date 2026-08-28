var Logger = require('util/Logger');
var log = (m, tag = "ui") => Logger.log(m, tag);
var debug = (m, tag = "ui") => Logger.debug(m, tag);
/*
 * Controller: Gallery
 *
 * Browse the key: a random handful of its taxon photos, extended as the reader
 * pages on, each naming its taxon and leading into the key. Photos the reader
 * took are the PhotoViewer's job — this screen only ever shows the key's.
 *
 */
var Topics = require('ui/Topics');
exports.baseController  = "TopLevelWindow";
$.name = "gallery";

$.TopLevelWindow.useUnSafeArea = true;
$.TopLevelWindow.addEventListener('close', function cleanUp() {
    $.TopLevelWindow.removeEventListener('close', cleanUp );
});

var startPhotoIndex = 0;
var allPhotos = _.shuffle( $.args.key.findAllMedia('photoUrls') );
var photos = allPhotos.slice(0,5);

// Every photo here belongs to a taxon — findAllMedia pairs them — so every page
// names one and leads into the key.
function buildPhotoView(urlObj) {
    var imageUrl = urlObj.url;
    debug(`creating tile for url = ${imageUrl}`);
    var container = Ti.UI.createView({
        width: Ti.UI.FILL,
        height: Ti.UI.SIZE
    });
    var imageView = Ti.UI.createImageView({ 
        enableZoomControls: true, 
        image: imageUrl, 
        height: Ti.UI.FILL
    } );
    container.add(imageView);

    var label = Ti.UI.createLabel({
        color: "white",
        font: { fontSize:"20dp" },
        shadowColor: Alloy.CFG.colors.black,
        shadowOffset: {x:"5", y:"5"},
        shadowRadius: "3dp",
        text: urlObj.taxon.name,
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        top: "50dp"
    });
    label.addEventListener("click", function() {
        Topics.fireTopicEvent(Topics.JUMPTO, {id: urlObj.taxon.id, allowAddToSample: false});
    });
    container.add(label);

    imageView.addEventListener("postlayout", function setSize() {
        imageView.height = $.scrollView.size.height;
    });
    container.addEventListener("close", function cleanUpImageView() {
        imageView.removeEventListener("postlayout", setSize);
        imageView.removeEventListener("close", cleanUpImageView);
    });
    if ( OS_IOS ) {
        var zoomable = Ti.UI.createScrollView( { disableBounce: true, maxZoomScale: 10.0, minZoomScale: 1.0, width: Ti.UI.FILL, height: Ti.UI.FILL });
        zoomable.add( container );
        return zoomable;
    } else {
        return container;
    }
}

function updatePhotoView() {
    const LIMIT_VIEWS_SIZE_TO=20;
    var page = $.scrollView.currentPage;
    var total = $.scrollView.views.length;
    
    log(`scroll page = ${page} total = ${total}`)
    if ( page+1 == total && (startPhotoIndex+$.scrollView.views.length) < (allPhotos.length - 5)) {
        startPhotoIndex=startPhotoIndex+5;
        var newViews = allPhotos.slice(startPhotoIndex+$.scrollView.views.length, startPhotoIndex+$.scrollView.views.length+5)
            .map( p => buildPhotoView(p) ) 
        $.scrollView.insertViewsAt(total,newViews);
        if ( $.scrollView.views.length > LIMIT_VIEWS_SIZE_TO) {
            var extra = $.scrollView.views.length-LIMIT_VIEWS_SIZE_TO;
            for(var i = 0; i<extra; i++)
                $.scrollView.removeView($.scrollView.views[0]);
            $.scrollView.currentPage = page - extra;
        }
    } else if ( page == 0 && startPhotoIndex > 5) {
        startPhotoIndex=startPhotoIndex-5;
        var newViews = allPhotos.slice(startPhotoIndex, startPhotoIndex+5)
            .map( p => buildPhotoView(p) )
        $.scrollView.insertViewsAt(0,newViews);
        if ( $.scrollView.views.length > LIMIT_VIEWS_SIZE_TO) {
            var extra = $.scrollView.views.length-LIMIT_VIEWS_SIZE_TO;
            for(var i = 0; i<extra; i++) {
                $.scrollView.removeView($.scrollView.views[$.scrollView.views.length-1]);
            }
        }
        $.scrollView.currentPage = page + newViews.length;
    }
    
}
photos.forEach( (url => {
    var view = buildPhotoView(url)
    $.scrollView.addView(view);
}));

// No dot row, and no page number in the accessibility label: the window keeps
// growing and sliding as the reader pages on, so an index into it names a
// different photo from one moment to the next. The label stays the screen's name
// (set in the view); the PhotoViewer, which knows how many photos it has, is the
// one that counts them.
function scrollEvent() {
    updatePhotoView();
}

$.closeButton.on("close", () => Topics.fireTopicEvent( Topics.BACK ) );