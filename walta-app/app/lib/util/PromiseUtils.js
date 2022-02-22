// wait for a delay then execute the promise
function delayedPromise( promise, delay) {
    if ( !delay || delay == 0 ) return promise; 
    return new Promise( (resolve, reject ) => {
        setTimeout(function() {
            promise
                .then(resolve)
                .catch(reject);
        }, delay);
    });

}

function checkForErrors(promise) {
    promise 
      .catch( (err) => {
        setTimeout(() => { throw err });
      })
  }


exports.delayedPromise = delayedPromise;
exports.checkForErrors = checkForErrors;