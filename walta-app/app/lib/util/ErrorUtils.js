var Logger = require('util/Logger');
function formatError(err) {
    let message = "<unknown error>";

    if ( err.error ) {
        message = err.error;
    } else if ( err.errors ) {
        message = `${err.message} ${JSON.stringify(err.errors)}`;
    } else if ( err.message ) {
        message = err.message
    }
    return `${message} Details: ${JSON.stringify(err)}`;
}
function errorHandler( err ) {
    Logger.recordException( err );
}
exports.errorHandler = errorHandler;
exports.formatError = formatError;