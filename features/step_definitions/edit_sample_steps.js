'use strict';
const { Given, When, Then } = require('cucumber');

Given('I have already completed a sample', function () {
    return this.menu.login( "test", "password" )

});

Then('I can add or remove new species', function () {
    return 'pending';
});


When('I activate the sample edit mode', function () {
    return 'pending';
});

