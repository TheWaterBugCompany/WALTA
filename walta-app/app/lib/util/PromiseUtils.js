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


async function withRetry(fn, opts) {
    const {
        maxRetries = 3,
        isRetryable = () => true,
        baseDelayMs = 1000,
        capDelayMs = 30000,
        jitter = false,
        random = Math.random,
        sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
    } = opts || {};
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            if (attempt >= maxRetries || !isRetryable(err)) throw err;
            let delay;
            if (typeof err === 'object' && err !== null && typeof err.retryAfterMs === 'number') {
                delay = err.retryAfterMs;
            } else {
                const base = Math.min(baseDelayMs * Math.pow(2, attempt), capDelayMs);
                delay = jitter ? base + Math.floor(base * 0.25 * random()) : base;
            }
            await sleep(delay);
            attempt++;
        }
    }
}

exports.delayedPromise = delayedPromise;
exports.checkForErrors = checkForErrors;
exports.withRetry = withRetry;