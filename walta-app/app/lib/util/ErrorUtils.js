var Logger = require('util/Logger');
var log = Logger.log;
var debug = m => Ti.API.info(m);
function formatError(err) {
    let message = "<unknown error>";
    if ( err.error ) {
        message = err.error;
    } else if ( err.message ) {
        message = err.message;
    }
    if ( err.source ) {
        message = `${message} Details: ${JSON.stringify(err.source)}` 
    }
    if ( err.stack ) {
        message = `${message} ${err.stack}` 
    }
    return message;
}
function errorHandler( err ) {
    if ( err.message === "The given data was invalid.") {
        var errors = _(err.errors).values().map((e)=> e.join("\n")).join("\n");
        log(`Data was invalid continuing: ${errors}`);
    } 
    Logger.recordException( err );
    return Promise.reject(err);
}
exports.errorHandler = errorHandler;
exports.formatError = formatError;