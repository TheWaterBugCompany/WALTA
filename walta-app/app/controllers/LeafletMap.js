// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
var ready = false;
var mapPoint = null;
var longPressHandler = null;
var onReadyHandlers = [];
function cleanUp() {
    $.destroy();
    $.off();
    if ( Ti.Platform.osname === 'android' )
        $.LeafletMap.release();
    if ( longPressHandler ) {
        Ti.App.removeEventListener("waterbug-map:longpress", longPressHandler );
    }
    Ti.App.removeEventListener("waterbug-map:opened", webviewReady);
}
function webviewReady() {
    Ti.API.info("LeaftletMap: WebView is ready");
    ready = true;
    onReadyHandlers.forEach( function( h ) {
        h();
    });
}
Ti.App.addEventListener("waterbug-map:opened", webviewReady);

function fireSetLocation() {
    Ti.App.fireEvent("waterbug-map:setlocation", {
        lat: mapPoint.lat,
        lng: mapPoint.lng,
        accuracy: mapPoint.accuracy
    });
}
function setLocation( lat, lng, accuracy ) {
    if ( isNaN(lat) || isNaN(lng) )
        return;
    if ( isNaN(accuracy) ) {
        accuracy = 0;
    }
    mapPoint = {
        lat: lat,
        lng: lng,
        accuracy: accuracy
    }
    // if the map isn't opened yet we need to wait for the
    // waterbug-map:opened event first
    if ( ready )
        fireSetLocation();
    else
        onReadyHandlers.push(fireSetLocation);
}

function removeLongPressHandler() {
    if ( longPressHandler ) 
        Ti.App.removeEventListener("waterbug-map:longpress", longPressHandler );
}

function setLongPressHandler(callback) {
    if ( longPressHandler ) 
        Ti.App.removeEventListener("waterbug-map:longpress", longPressHandler );
    longPressHandler = callback;
    Ti.App.addEventListener("waterbug-map:longpress", longPressHandler);
}

function fireEnableLongPress() {
    Ti.App.fireEvent("waterbug-map:enablelongpress");
}

function fireAddMayflyLayer() {
    Ti.App.fireEvent("waterbug-map:addmayflylayer");
}

function onLongPress(callback) {
    removeLongPressHandler();
    setLongPressHandler(callback);
    onReadyHandlers.push(fireEnableLongPress);
}

function addMayflyLayer() {
    onReadyHandlers.push(fireAddMayflyLayer);
}

exports.addMayflyLayer = addMayflyLayer;
exports.onLongPress = onLongPress;
exports.setLocation = setLocation;
exports.cleanUp = cleanUp;