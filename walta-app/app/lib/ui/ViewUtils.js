function disableControl(view) {
	view.enabled = false;
	view.touchEnabled = false;

	if ( ! view.oldProps ) {
		view.oldProps = {
			backgroundColor: view.backgroundColor,
			borderColor: view.borderColor,
			color: view.color
		}
	}

	view.backgroundColor = "#c9cacb";
	view.borderColor = "#c9cacb";
	view.color = "white"; 
}

function enableControl(view) {
	view.enabled = true;
	view.touchEnabled = true;
	if ( view.oldProps ) {
		view.backgroundColor = view.oldProps.backgroundColor;
		view.borderColor = view.oldProps.borderColor;
		view.color = view.oldProps.color;
	}
}

function setError(view) {
	if ( ! view.oldProps ) {
		view.oldProps = {
			color: view.color,
			borderColor: view.borderColor
		}
	}
	view.color = "red";
	view.borderColor = "red";
}

function clearError(view) {
	if ( view.oldProps ) {
		view.color = view.oldProps.color;
		view.borderColor = view.oldProps.borderColor;
	}
}

function makeAccessibilityLabel( prefix, label, postfix = ""  ) {
	if ( label ) {
		return `${prefix}_${label.toLowerCase().replace(' ','_')}${( postfix.length > 0 ? 
			"_" + postfix : "")}`;
	} else {
		return `${prefix}_unknown`;
	}
}

function setAccessibilityLabel( view, prefix, label, postfix = "" ) {
	if ( label ) {
		view.accessibilityLabel = makeAccessibilityLabel( prefix, label, postfix);
	}
}

exports.makeAccessibilityLabel = makeAccessibilityLabel;
exports.setAccessibilityLabel = setAccessibilityLabel;
exports.disableControl = disableControl;
exports.enableControl = enableControl;
exports.setError = setError;
exports.clearError = clearError;