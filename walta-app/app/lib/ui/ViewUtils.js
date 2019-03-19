function disableControl(view) {
	view.enabled = false;
	view.touchEnabled = false;
	view.backgroundColor = "#c9cacb";
	view.borderColor = "#c9cacb";
	view.color = "white"; 
}

function enableControl(view) {
	view.enabled = true;
	view.touchEnabled = true;
	view.backgroundColor = "#b4d2d9";
	view.borderColor = "#b4d2d9";
	view.color = "#26849c";
}

function setError(view) {
	view.color = "red";
	view.borderColor = "red";
}

function clearError(view) {
	view.color = "#26849c";
	view.borderColor = "#26849c";
}

exports.disableControl = disableControl;
exports.enableControl = enableControl;
exports.setError = setError;
exports.clearError = clearError;