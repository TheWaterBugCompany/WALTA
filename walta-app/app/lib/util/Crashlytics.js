
// Interface for Crashlytics module - alos loaded during Node based unit tests
exports.configure = function() {}
exports.isAvailable = function() {}
exports.setCustomKey = function(name, value) {}
exports.recordException = function(e) {}
exports.setUserId = function(userId) {}
exports.log = function( message ) {}