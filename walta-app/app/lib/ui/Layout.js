
/*
 * Module: Layout
 *
 * Holds common constants for laying out user interface.
 *
 */

// Defaults should be visible on even the smallest devices
exports.COLOR_LIGHT_BLUE = '#cfdbf3';

exports.TOOLBAR_HEIGHT = '42dip';
exports.TOOLBAR_BUTTON_SIZE =  '40dip';

exports.THUMBNAIL_IMAGE_WIDTH = '100%';

exports.BUTTON_MARGIN = '8dip';
exports.BUTTON_FONT_SIZE = '8dip';
exports.BUTTON_SIZE = '48dip';

exports.WHITESPACE_GAP = '8dip';

exports.HEADING_SIZE = '22dip';
exports.HEADING_FONT = 'Tahoma';

exports.TEXT_FONT = 'sans-serif';
exports.DETAILS_TEXT_SIZE = '10dip';

exports.QUESTION_TEXT_SIZE = '16dip';
exports.VIDEO_OVERLAY_BUTTON_SIZE = '64dip';

exports.FULLSCREEN_CLOSE_BUTTON_SIZE = '22dip';
exports.FULLSCREEN_CLOSE_BUTTON_BUFFER = '48dip';

exports.PAGER_HEIGHT = '16dip';
exports.PAGER_DOT_SIZE = '12dip';

exports.THUMBNAIL_WIDTH = '180dp';
exports.THUMBNAIL_IMAGE_HEIGHT = '135dp';

exports.MENU_ITEM_HEIGHT = '23.5%';
exports.MENU_ITEM_WIDTH = '96%';
exports.MENU_ITEM_WIDTH_2 = '48%';
exports.MENU_GAP = '1.2%';
exports.MENU_LOGO_WIDTH = '100dip'; 
exports.MENU_LOGO_HEIGHT = '48dip';
exports.MENU_LOGO_LEFT = '22%';
exports.MENU_LOGO_TOP = '18dip';
exports.MENU_ICON_WIDTH = '72dip';
exports.MENU_ICON_HEIGHT = '72dip';
exports.MENU_LARGE_BUTTON_HEADING_FONT_SIZE = '23dip';
exports.MENU_LARGE_BUTTON_TEXT_FONT_SIZE = '11dip';


exports.MENU_TITLE_FONT_SIZE_SMALL = '26dip';
exports.MENU_TITLE_FONT_SIZE = '31dip';
exports.MENU_LOGO_FONT_SIZE = '9dip';
exports.MENU_LOGO_FONT_SIZE_SMALL = '8dip';

exports.GOBACK_BUTTON_TEXT_WIDTH = '125dip';
exports.TOOLBAR_BUTTON_TEXT = '14dip';

exports.BORDER_RADIUS = 25;
exports.BORDER_RADIUS_MENU_BIG = 15;
exports.BORDER_RADIUS_MENU_SMALL = 4;
exports.BORDER_RADIUS_BUTTON = 2;

exports.SPEEDBUG_TILE_WIDTH  = '150dip';
exports.SPEEDBUG_TILE_HEIGHT = '225dip';
exports.SPEEDBUG_PRECACHE_TILES = 2;

function fixScrollContentsSize(ctlr){
    // Derive the width from the window minus its safe-area insets, not the live
    // frame: during a relayout a postlayout can fire while the frame is still
    // the full window width, pinning contentWidth too wide and leaving the
    // right-anchored camera clipped in phantom horizontal scroll.
    var sap = ctlr.TopLevelWindow.safeAreaPadding || {};
    var contentWidth = ctlr.TopLevelWindow.size.width - (sap.left || 0) - (sap.right || 0);
    if ( ctlr.content.contentWidth != contentWidth
        || ctlr.content.contentHeight != ctlr.content.size.height ) {
        ctlr.content.contentWidth = contentWidth;
        ctlr.content.contentHeight = ctlr.content.size.height;
    }
}

function hideKeyboard(blurFields) {
    if(OS_ANDROID){
        Ti.UI.Android.hideSoftKeyboard();
   } else {
    blurFields.forEach( (v)=> v.blur() );
   }
}
function applyKeyboardTweaks( ctlr, blurFields ) {
    function hideKeyboardCallback() {
        hideKeyboard(blurFields);
    }
    function fixScrollContentsSizeCallback() {
        fixScrollContentsSize(ctlr);
    }
    ctlr.TopLevelWindow.addEventListener("touchstart",hideKeyboardCallback );

    var wrapped = false;
    ctlr.TopLevelWindow.addEventListener("close", function closeEvent() {
        ctlr.TopLevelWindow.removeEventListener("touchstart", hideKeyboardCallback );
        ctlr.TopLevelWindow.removeEventListener("close", closeEvent );
        if (OS_IOS && wrapped) {
            ctlr.TopLevelWindow.removeEventListener("postlayout", fixScrollContentsSizeCallback );
        }
    });

    // On iOS we wrap content in a ScrollView so the focused field can
    // scroll clear of the keyboard. Defer the wrap until TopLevelWindow
    // has applied its safe-area padding (see WB-28): wrapping before
    // that point establishes a measurement context where percentage-
    // width children resolve against the full window width, which on
    // notched iPhones pushes items off the right edge. Android doesn't
    // need the wrap — the keyboard resizes the activity automatically.
    if (OS_IOS) {
        function wrapInScrollView() {
            if (wrapped) return;
            wrapped = true;
            // Lock to vertical-only — the ScrollView exists solely to
            // slide content out from under the keyboard. Without these,
            // iOS's rubber-band effect lets the user drag horizontally
            // even when contentWidth matches the viewport.
            var scrollView = Ti.UI.createScrollView({
                top: 0,
                horizontalBounce: false,
                showHorizontalScrollIndicator: false
            });
            // Explicit re-parent: remove content from the window before
            // adding to the ScrollView, then add the ScrollView back.
            // A plain `scrollView.add(content)` leaves content still
            // parented to the window, orphaning the ScrollView with
            // zero measured size. Temporarily remove the anchorBar so
            // it can be re-added last — Ti's view list doubles as
            // z-order. With scrollView on top, iOS's accessibility
            // tree marks anything beneath it `visible="false"`, which
            // breaks Appium lookups of the window title and Back/Next
            // buttons even though the pixels are still painted.
            var oldContent = ctlr.content;
            var window = ctlr.TopLevelWindow;
            var anchorBarView = ctlr.getAnchorBar && ctlr.getAnchorBar().getView();
            window.remove(oldContent);
            if (anchorBarView) window.remove(anchorBarView);
            scrollView.add(oldContent);
            window.add(scrollView);
            if (anchorBarView) window.add(anchorBarView);
            // updateSafeArea targets ctlr.content, about to become the
            // ScrollView — clear the inset already on the inner content so it
            // isn't double-padded once the ScrollView carries it.
            oldContent.applyProperties({ left: 0, right: 0, top: 0, bottom: 0 });
            ctlr.content = scrollView;
            // Seed the inset now: updateSafeArea only re-applies it on the next
            // postlayout, which may not fire until an unrelated relayout, so
            // otherwise the ScrollView opens unpadded and content bleeds under
            // the notch.
            if (!window.useUnSafeArea && window.safeAreaPadding) {
                scrollView.applyProperties(window.safeAreaPadding);
            }
            window.addEventListener("postlayout", fixScrollContentsSizeCallback );
        }
        // Defer the wrap out of the current postlayout callback — doing
        // the re-parent while Ti is mid-layout leaves Classic layout
        // holding stale measurements for percentage/SIZE-sized children
        // (visible on the Back → SiteDetails path: text fields render
        // too short until a property change forces a re-measure).
        function deferWrap() {
            setTimeout(wrapInScrollView, 0);
        }
        if (ctlr.isSafeAreaApplied && ctlr.isSafeAreaApplied()) {
            deferWrap();
        } else {
            ctlr.on("safe-area-applied", deferWrap);
        }
    }
}

exports.applyKeyboardTweaks = applyKeyboardTweaks;