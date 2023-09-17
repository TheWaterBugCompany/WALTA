var Logger = require('util/Logger');
var log = Logger.log;
var debug = m => Ti.API.info(m);
function formatError(err) {
    let message = "<unknown error>";

    if ( err.error ) {
        message = err.error;
    } else if ( err.errors ) {
        message = `${err.message} ${JSON.stringify(err.errors)}`;
    } else if ( err.message ) {
        message = err.message
    }

    if ( err.source ) {
        message = `${message} Details: ${JSON.stringify(err.source)}`;
    }
    if ( err.stack ) {
        message = `${message} ${err.stack}`;
    }
    return message;
}
function errorHandler( err ) {
    Logger.recordException( err );
    //return Promise.reject(err);
}
exports.errorHandler = errorHandler;
exports.formatError = formatError;