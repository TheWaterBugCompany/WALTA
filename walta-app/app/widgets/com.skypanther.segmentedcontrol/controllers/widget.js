var args = arguments[0] || {},
	enabled = true;

// custom properties that can/should be set in the TSS of the view where you're putting the tabbed bar
var selectedButtonColor = args.selectedButtonColor || "#d9bc1b",
	unselectedButtonColor = args.unselectedButtonColor || "#226e92",
	selectedButtonTextColor = args.selectedButtonTextColor || "#fff",
	unselectedButtonTextColor = args.unselectedButtonTextColor || "#000",
	disabledTextColor = args.disabledTextColor || '#aaa',
	disabledButtonBackgroundColor = args.disabledButtonBackgroundColor || '#444',
	borderColor = args.borderColor || 'transparent',
	font = args.font || (OS_IOS ? {
		fontFamily: 'Avenir-Light',
		fontSize: 11
	} : {
		fontWeight: 'normal',
		fontSize: '15dp'
	}),
	skipindex = false;

args.borderColor = borderColor; // stuff this back in there in case it's not set in the tss

$.segCtrlWrapper.applyProperties(_.omit(args, 'id', '__parentSymbol', '__itemTemplate', '$model', 'selectedButtonColor', 'unselectedButtonColor', 'selectedButtonTextColor', 'unselectedButtonTextColor', 'font'));

var height = ((isNaN(parseInt($.segCtrlWrapper.height))) ? 40 : parseInt($.segCtrlWrapper.height)) - 2;
if (OS_ANDROID) {
	height += 'dp';
}
$.segCtrlButtonContainer.height = Ti.UI.FILL;

var callback = function () {}; // empty function as placeholder
var selectedIndex = undefined; // Stores the current selected index

var buttons = [];
exports.init = function (labels, cb, opts) {
	if (opts) {
		skipindex = opts.skipindex;
	}
	var calculatedWidth;
	if (typeof cb === 'function') {
		callback = cb;
	}
	if (!labels || !_.isArray(labels) || labels.length === 0) {
		labels = ['Yes', 'No'];
	}
	if (OS_ANDROID) {
		if (typeof $.segCtrlWrapper.width === 'string' && $.segCtrlWrapper.width.slice(-1) === '%') {
			calculatedWidth = Ti.Platform.displayCaps.platformWidth / Ti.Platform.displayCaps.logicalDensityFactor * parseInt($.segCtrlWrapper.width) / 100;
		} else if (isNaN(parseInt($.segCtrlWrapper.width))) {
			calculatedWidth = Ti.Platform.displayCaps.platformWidth / Ti.Platform.displayCaps.logicalDensityFactor;
		} else {
			calculatedWidth = parseInt($.segCtrlWrapper.width);
		}
	} else if (OS_IOS) {
		if (typeof $.segCtrlWrapper.width === 'string' && $.segCtrlWrapper.width.slice(-1) === '%') {
			calculatedWidth = Math.floor(Ti.Platform.displayCaps.platformWidth * parseInt($.segCtrlWrapper.width) / 100);
			// console.log('Calculated the width of ' + args.id + ' to be ' + calculatedWidth);
		} else if (isNaN(parseInt($.segCtrlWrapper.width))) {
			// iOS handles rotation, but the wrapper width needs to be calculated to be
			// the smaller of the height or width to avoid layout issues
			if (Ti.Platform.displayCaps.platformWidth < Ti.Platform.displayCaps.platformHeight) {
				calculatedWidth = Ti.Platform.displayCaps.platformWidth;
			} else {
				calculatedWidth = Ti.Platform.displayCaps.platformHeight;
			}
		} else {
			calculatedWidth = parseInt($.segCtrlWrapper.width);
		}
	}

	// The control paints its border inside its own width, so buttons sized to the
	// full width cover it at both ends.
	var innerWidth = calculatedWidth - 2 * borderWidth();
	// A filled width still starts at the outer edge, so the row is placed inside the
	// border explicitly — left and width, never a right, which would push the row
	// back out past its parent.
	$.segCtrlButtonContainer.left = OS_ANDROID ? borderWidth() + 'dp' : borderWidth();
	$.segCtrlButtonContainer.width = OS_ANDROID ? innerWidth + 'dp' : innerWidth;
	// The buttons add up to exactly this width, and a horizontal row wraps a child
	// that misses fitting by a rounding pixel — which drops the last segment's
	// label out of the control while its divider stays behind.
	$.segCtrlButtonContainer.horizontalWrap = false;
	// The remainder goes on the last button so the row adds back up to innerWidth
	// exactly, at any density or button count.
	var btnWidth = Math.floor(innerWidth / labels.length);
	var lastBtnWidth = innerWidth - btnWidth * (labels.length - 1);

	// make our buttons
	for (var i = 0, j = labels.length; i < j; i++) {
		var width = (i === j - 1) ? lastBtnWidth : btnWidth;
		var btn = Widget.createController('button', { // jshint ignore:line
			text: labels[i],
			accessibilityLabel: labels[i],
			width: OS_ANDROID ? width + 'dp' : width,
			height: Ti.UI.FILL,
			left: 0,
			top: 0,
			bottom: 0,
			color: unselectedButtonTextColor,
			backgroundColor: unselectedButtonColor,
			font: font
		}).getView();
		if (args.index === i) {
			_highlight(btn);
		}
		buttons.push(btn);
		$.segCtrlButtonContainer.add(btn);
	}

	// add the button dividers, if desired
	if (args.withDividers) {
		var left;
		for (var i = 0, j = labels.length - 1; i < j; i++) { // jshint ignore:line
			left = btnWidth * (i + 1) + borderWidth();
			if (OS_ANDROID) {
				left += 'dp';
			}
			$.segCtrlWrapper.add(Ti.UI.createView({
				width: OS_ANDROID ? '1dp' : 1,
				height: height,
				left: left,
				backgroundColor: selectedButtonColor,
				zIndex: 10
			}));
		}
	}

	// event listener on the wrapper determines button clicked by x coord of click location
	$.segCtrlWrapper.addEventListener('click', function (e) {
		var clickedButton,
			butWid;
		var point = e.source.convertPointToView({
			x: e.x,
			y: e.y
		}, $.segCtrlWrapper);
		butWid = OS_ANDROID ? btnWidth * Ti.Platform.displayCaps.logicalDensityFactor : btnWidth;
		// The last button carries the rounding remainder, so a click past the end of
		// the evenly sized ones still belongs to it rather than to no button at all.
		clickedButton = Math.min(Math.floor(point.x / butWid), buttons.length - 1);
		if (buttons[clickedButton].disabled) {
			return;
		}
		_.each(buttons, function (element, index) {
			if (enabled) {
				if (index === clickedButton) {
					_highlight(element);
				} else {
					_unhighlight(element);
				}
			}
		});

		// Save current value
		selectedIndex = clickedButton;

		callback({
			index: exports.getIndex(),
			source: {
				id: args.id || undefined
			}
		});
	});
};

function _highlight(btn) {
	if (btn) {
		btn.backgroundColor = selectedButtonColor;
		btn.color = selectedButtonTextColor;
	}
}

function _unhighlight(btn) {
	if (!btn.disabled) {
		btn.backgroundColor = unselectedButtonColor;
		btn.color = unselectedButtonTextColor;
	}
}

// Is an alias function
exports.select = function (num) {
	exports.setIndex(num);
};
exports.getIndex = function () {
	if (skipindex !== false && selectedIndex >= skipindex) {
		return (selectedIndex + 1);
	} else {
		return selectedIndex;
	}
};
exports.setIndex = function (num) {
	if (skipindex !== false) {
		if (num >= skipindex) {
			num--;
		}
	}
	var btnNumber = parseInt(num) || 0;
	exports.deselectAll();
	_highlight(buttons[btnNumber]);
	selectedIndex = btnNumber;
};
exports.deselect = function (num) {
	var btnNumber = parseInt(num) || 0;
	_unhighlight(buttons[btnNumber]);
};
exports.enable = function () {
	enabled = true;
};
exports.disable = function () {
	enabled = false;
};
exports.deselectAll = function () {
	_.each(buttons, _unhighlight);
};

exports.changeButtonLabels = function (arr) {
	if (!arr || !arr.length || arr.length !== buttons.length) {
		throw "You must pass an array with " + buttons.length + " members to this function";
	}
	for (var b = 0, c = buttons.length; b < c; b++) {
		buttons[b].text = arr[b];
	}
};


/*
Public function to disable a button (make it non-clickable)
*/
exports.disableButton = function (num) {
	if (typeof num !== 'number' || !buttons[num]) {
		return;
	}
	// turn it semi-transparent
	// disable the click handler
	_unhighlight(buttons[num]);
	buttons[num].opacity = 0.4;
	buttons[num].color = disabledTextColor;
	buttons[num].backgroundColor = disabledButtonBackgroundColor;
	buttons[num].disabled = true;
};
exports.disableAllButtons = function () {
	for (var i = 0, j = buttons.length; i < j; i++) {
		exports.disableButton(i);
	}
};
/*
Public function to enable a button (make it clickable)
*/
exports.enableButton = function (num) {
	// turn it fully opaque
	// enable the click handler
	if (typeof num !== 'number' || !buttons[num]) {
		return;
	}
	_unhighlight(buttons[num]);
	buttons[num].opacity = 1;
	buttons[num].color = unselectedButtonTextColor;
	buttons[num].disabled = false;
};
exports.enableAllButtons = function () {
	for (var i = 0, j = buttons.length; i < j; i++) {
		exports.enableButton(i);
	}
};

exports.isDisabled= function() {
	return !enabled || _.every( buttons, function(b) { b.disabled } );
}

exports.getButtons = function() {
	return buttons;
}

// Titanium draws a one-unit border for a border colour given without a width, so
// an unset borderWidth still costs the buttons room on both sides.
function borderWidth() {
	if (!borderColor || borderColor === 'transparent') return 0;
	var declared = parseInt($.segCtrlWrapper.borderWidth);
	return isNaN(declared) ? 1 : declared;
}
