'use strict';

module.exports = (_chai, utils) => {
  let Assertion = _chai.Assertion;

  Assertion.addProperty('falsy', function () {
    this.assert(
        !this._obj
      , 'expected #{this} to be falsy'
      , 'expected #{this} to be truthy'
      , false
      , this._obj
    );
  });

  Assertion.addProperty('truthy', function () {
    this.assert(
        !!this._obj
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy'
      , true
      , this._obj
    );
  });
};
