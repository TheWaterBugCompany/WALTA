'use strict';

/* eslint no-unused-vars: off */
/* eslint-env commonjs */

/**
 * Shim process.stdout.
 */

process.stdout = global.process.stdout;

var Mocha = require('./node_modules/mocha/lib/mocha');

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */

var Date = global.Date;
var setTimeout = global.setTimeout;
var setInterval = global.setInterval;
var clearTimeout = global.clearTimeout;
var clearInterval = global.clearInterval;

var uncaughtExceptionHandlers = [];

var originalOnerrorHandler = global.onerror;

/**
 * Remove uncaughtException listener.
 * Revert to original onerror handler if previously defined.
 */

process.removeListener = function(e, fn) {
  if (e === 'uncaughtException') {
    if (originalOnerrorHandler) {
      global.onerror = originalOnerrorHandler;
    } else {
      global.onerror = function() {};
    }
    var i = uncaughtExceptionHandlers.indexOf(fn);
    if (i !== -1) {
      uncaughtExceptionHandlers.splice(i, 1);
    }
  }
};

/**
 * Implements listenerCount for 'uncaughtException'.
 */

process.listenerCount = function(name) {
  if (name === 'uncaughtException') {
    return uncaughtExceptionHandlers.length;
  }
  return 0;
};

/**
 * Implements uncaughtException listener.
 */

process.on = function(e, fn) {
  if (e === 'uncaughtException') {
    global.onerror = function(err, url, line) {
      fn(new Error(err + ' (' + url + ':' + line + ')'));
      return !mocha.options.allowUncaught;
    };
    uncaughtExceptionHandlers.push(fn);
  }
};

process.listeners = function(e) {
  if (e === 'uncaughtException') {
    return uncaughtExceptionHandlers;
  }
  return [];
};

/* This is a god awful hack to fix an error where
   run() is undefined error occurs.... exploiting the fact
   that Titanium js runtimes function are all global !!
   
   I presume that somewhere in Mocha the global variable
   named "run" is being set to undefined as this is causing
   breakage.

   Oddly it only causes an error on iOS.
   Perhaps because Android js functions don't use a global "run" function.
   */
   var runFunction = global.run;
   global.runner = function (id) {
     return function () {
       runFunction(id);
     };
   };

/**
 * Expose the process shim.
 * https://github.com/mochajs/mocha/pull/916
 */

Mocha.process = process;
module.exports = Mocha;