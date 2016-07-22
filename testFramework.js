(function() {
    require('jsdom-global')();

    global.expect = require('chai').expect;
    global.assert = require('chai').assert;
    global.given = require('mocha-testdata').given;
    global.givenAsync = require('mocha-testdata').givenAsync;

    global.sinon = require('sinon');

    global.jquery = require('jquery');
    global.Tour = require('./build/tour.js');

    global.getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };
})();
