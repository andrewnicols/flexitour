"use strict";
(function() {
    require('jsdom-global')();

    // Use chai as the main assertion library.
    let chai = require('chai');
    global.expect = chai.expect;
    global.assert = chai.assert;

    // Use mocha-testdata as a data provider.
    global.given = require('mocha-testdata').given;
    global.givenAsync = require('mocha-testdata').givenAsync;

    // Use sinon for mocks, stubs, spies, etc.
    global.sinon = require('sinon');

    // jQuery is used in the plugin
    global.jquery = global.jQuery = global['$'] = require('jquery');

    global.Popper = require('popper.js');

    // jQuery Assertions are handy.
    chai.use(require('chai-jquery'));

    // Include the built tour.
    global.Tour = require('./src/tour.js');

    // Helper functions.
    global.getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };
})();
