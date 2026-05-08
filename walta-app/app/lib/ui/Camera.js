/*
 * Camera wrapper — test implementation (simulator builds).
 *
 * Replaces Ti.Media.showCamera with a tappable Ti.UI window so that
 * acceptance tests can drive the capture flow on a simulator. The real
 * iOS image picker is a system-process modal that Appium/WDA can't send
 * synthesised touches to, and newer simulator models have no camera
 * simulation at all (iPhone 16e confirmed 2026-04-20).
 *
 * The test window exposes a "PhotoCapture" accessibility label (matching
 * the native picker's naming) so the CameraScreen test driver can tap it
 * with a plain clickRaw. On tap, we return a bundled site-mock photo
 * via the same `success` callback signature that Ti.Media.showCamera uses.
 */

var Logger = require('util/Logger');
var log = (m, tag = "media") => Logger.log(m, tag);

exports.hasCameraPermissions = function () {
    // No real camera involved, so permissions are irrelevant.
    return true;
};

exports.requestCameraPermissions = function (callback) {
    // Immediately report success — keeps PhotoSelect.js's existing flow
    // (hasCameraPermissions/requestCameraPermissions wrapper) unchanged.
    if (callback) {
        callback({ success: true });
    }
};

exports.showCamera = function (options) {
    log('[Camera-test] showCamera called — opening test camera window');
    var win = Ti.UI.createWindow({
        backgroundColor: Alloy.CFG.colors.black,
        fullscreen: true,
        layout: 'vertical',
        exitOnClose: false
    });
    var header = Ti.UI.createLabel({
        text: 'TEST CAMERA',
        color: Alloy.CFG.colors.white,
        top: '5%',
        font: { fontSize: '24dp', fontWeight: 'bold' }
    });
    var viewfinder = Ti.UI.createView({
        backgroundColor: '#444',
        width: '80%',
        height: '50%',
        top: '5%',
        borderColor: '#888',
        borderWidth: '1dp'
    });
    viewfinder.add(Ti.UI.createLabel({
        text: '(simulated viewfinder)',
        color: '#aaa',
        font: { fontSize: '16dp' }
    }));
    // Ti.UI.createButton resolves to MaterialButton on Android, which
    // crashes if the app theme isn't Theme.MaterialComponents — the
    // test camera is the only place we'd need to bump the base theme,
    // so use plain Views with accessibilityLabels instead.
    function tappableBox(opts) {
        var box = Ti.UI.createView({
            accessibilityLabel: opts.accessibilityLabel,
            top: opts.top,
            width: opts.width,
            height: opts.height,
            backgroundColor: opts.backgroundColor,
            borderRadius: '4dp'
        });
        box.add(Ti.UI.createLabel({
            text: opts.title,
            color: opts.color,
            font: { fontSize: '16dp', fontWeight: 'bold' }
        }));
        return box;
    }
    var captureBtn = tappableBox({
        title: 'Take Picture',
        accessibilityLabel: 'PhotoCapture',
        top: '5%',
        width: '200dp',
        height: '60dp',
        backgroundColor: Alloy.CFG.colors.white,
        color: Alloy.CFG.colors.black
    });
    var cancelBtn = tappableBox({
        title: 'Cancel',
        accessibilityLabel: 'DismissImagePickerButton',
        top: '3%',
        width: '150dp',
        height: '44dp',
        backgroundColor: '#888',
        color: Alloy.CFG.colors.white
    });

    function closeAndCallback(cbName) {
        win.addEventListener('close', function handler() {
            win.removeEventListener('close', handler);
            if (cbName === 'success' && options.success) {
                var mockPhoto = Ti.Filesystem.getFile(
                    Ti.Filesystem.resourcesDirectory,
                    'spec/resources/site-mock.jpg'
                );
                if (!mockPhoto.exists()) {
                    log('[Camera-test] site-mock.jpg missing — falling back to error');
                    if (options.error) options.error({ error: 'test-mock photo missing' });
                    return;
                }
                options.success({
                    media: mockPhoto.read(),
                    mediaType: Ti.Media.MEDIA_TYPE_PHOTO
                });
            } else if (cbName === 'cancel' && options.cancel) {
                options.cancel();
            }
        });
        win.close();
    }

    captureBtn.addEventListener('click', function () { closeAndCallback('success'); });
    cancelBtn.addEventListener('click', function () { closeAndCallback('cancel'); });

    win.add(header);
    win.add(viewfinder);
    win.add(captureBtn);
    win.add(cancelBtn);
    win.open();
};
