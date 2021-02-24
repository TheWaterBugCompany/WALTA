// wait for a delay then execute the promise
function delayedPromise( promise, delay) {
    return new Promise( (resolve, reject ) => {
        setTimeout(function() {
            promise
                .then(resolve)
                .catch(reject);
        }, delay);
    })
}

exports.delayedPromise = delayedPromise;