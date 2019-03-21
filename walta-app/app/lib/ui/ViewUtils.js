function disableControl(view) {
	view.enabled = false;
	view.touchEnabled = false;

	view.oldProps = {
		backgroundColor: view.backgroundColor,
		borderColor: view.borderColor,
		color: view.color
	}

	view.backgroundColor = "#c9cacb";
	view.borderColor = "#c9cacb";
	view.color = "white"; 
}

function enableControl(view) {
	if ( view.oldProps ) {
		view.enabled = true;
		view.touchEnabled = true;
		view.backgroundColor = view.oldProps.backgroundColor;
		view.borderColor = view.oldProps.borderColor;
		view.color = view.oldProps.color;
	}
}

function setError(view) {
	view.oldProps = {
		color: view.color,
		borderColor: view.borderColor
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

exports.disableControl = disableControl;
exports.enableControl = enableControl;
exports.setError = setError;
exports.clearError = clearError;