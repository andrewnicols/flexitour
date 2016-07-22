/* eslint-env mocha */
"use strict";

require('../testFramework.js');
describe('Tour', function() {
    let mocks = [];

    beforeEach(function() {
        let fn;
        for (fn in Tour.prototype) {
            switch (fn) {
                case 'init':
                case 'checkConfigSanity':
                    continue;
                    break;
                default:
                    break;
            }
            if (Tour.prototype.hasOwnProperty(fn)) {
                mocks.push(sinon.stub(Tour.prototype, fn));
            }
        }
    });

    afterEach(function() {
        mocks.forEach(function(mock) {
            mock.restore();
        });
    });

    describe('configure', function() {
        let t,
            mocks = [];

        beforeEach(function() {
            t = new Tour({
                    tourName: 'example'
                });

            // Restore configure for testing.
            Tour.prototype.configure.restore();

        });


        given([[undefined], [null], [{}], [0], [1], ['function'], [[]]])
        .it("Should use the default renderer if a function was not provided", function(data) {
            t.configure({renderFunction: data});
            expect(t.render).to.equal(t.stepRenderer);
        });

        it("Should use the default renderer if no config was provided", function() {
            t.configure();
            expect(t.render).to.equal(t.stepRenderer);
        });

        it("Should use the default renderer if no renderFunction was provided", function() {
            t.configure();
            expect(t.render).to.equal(t.stepRenderer);
        });

        it("Should accept a custom renderer", function() {
            let customFunction = sinon.spy();
            t.configure({
                renderFunction: customFunction
            });
            expect(t.render).to.equal(customFunction);
        });

        it("Should not override an existing renderer", function() {
            let customFunction = sinon.spy();

            // Set the renderer once.
            t.configure({
                renderFunction: customFunction
            });

            // Calling setup again should not cause the render function to be overwritten.
            t.configure();
            expect(t.render).to.equal(customFunction);
        });

        it("Should store the steps provided", function() {
            let stepList = [{title: 'foo'}];

            t.configure({steps: stepList});
            expect(t.steps).to.equal(stepList);
        });

        it("Should store the template provided", function() {
            let template = 'Example template';

            t.configure({template: template});
            expect(t.templateContent).to.equal(template);
        });
    });

    describe('resetStepDefaults', function() {

        it("Should use the original configuration if available", function() {
            let exampleConfig = {foo: 'bar'};

            let t = new Tour({stepDefaults: exampleConfig});
            t.resetStepDefaults.restore();
            t.resetStepDefaults();
            expect(t.setStepDefaults.calledWith(exampleConfig)).to.be.true;
        });

        it("Should use empty configuration if not available", function() {
            let t = new Tour();
            t.resetStepDefaults.restore();
            t.resetStepDefaults();
            expect(t.setStepDefaults.calledWith({})).to.be.true;
        });

        it("Should use empty configuration if available but told not to", function() {
            let exampleConfig = {foo: 'bar'};
            let t = new Tour(exampleConfig);

            t.resetStepDefaults.restore();
            t.resetStepDefaults(false);
            expect(t.setStepDefaults.calledWith({})).to.be.true;
        });

        it("Should be chainable", function() {
            let t = new Tour();
            t.resetStepDefaults.restore();
            expect(t.resetStepDefaults()).to.equal(t);
        });
    });

    describe("setStepDefaults", function() {
        it("Should apply additional defaults", function() {
            let t = new Tour();
            t.setStepDefaults.restore();

            t.setStepDefaults({example: 'foo'});
            expect(t.stepDefaults).to.have.property('example');
            expect(t.stepDefaults).not.to.have.property('foo');

            t.setStepDefaults({foo: 'bar'});
            expect(t.stepDefaults).to.have.property('example');
            expect(t.stepDefaults).to.have.property('foo');
        });

        it("Should contain original defaults", function() {
            let t = new Tour();
            t.setStepDefaults.restore();

            // Clear the current value.
            t.stepDefaults = {};

            t.setStepDefaults();
            expect(t.stepDefaults).to.have.property('placement');
            expect(t.stepDefaults.placement).to.equal('top');
        });

        it("Should be chainable", function() {
            let t = new Tour();
            t.setStepDefaults.restore();

            expect(t.setStepDefaults()).to.equal(t);
        });
    });

    describe("Step number manipulations", function() {
        it("Should return the current step number after it has been changed", function() {
            let t = new Tour();

            t.setCurrentStepNumber.restore();
            t.setCurrentStepNumber(42);

            t.getCurrentStepNumber.restore();
            expect(t.getCurrentStepNumber()).to.equal(42);
        });

        describe("getNextStepNumber", function() {
            let t;
            beforeEach(function() {
                t = new Tour();

                // Restore the defaults.
                t.reset.restore();
                t.reset();

                t.steps = [{}, {}, {}];

                t.getNextStepNumber.restore();
            });

            it("Should return null if at the end of the list", function() {
                t.getCurrentStepNumber.returns(3);
                expect(t.getNextStepNumber()).to.equal(null);
            });

            it("Should return the next number", function() {
                // Currently on step 2, and step 3 is visible.
                t.getCurrentStepNumber.returns(2);
                t.isStepPotentiallyVisible.returns(true);
                expect(t.getNextStepNumber()).to.equal(3);
            });

            it("Should iterate until it finds one", function() {
                // Currently on step 1.
                // Step 2 is not available and step 3 is visible.
                t.getCurrentStepNumber.returns(1);
                t.isStepPotentiallyVisible.onCall(0).returns(false);
                t.isStepPotentiallyVisible.onCall(1).returns(true);
                expect(t.getNextStepNumber()).to.equal(3);
            });
        });

        describe("getPreviousStepNumber", function() {
            let t;
            beforeEach(function() {
                t = new Tour();

                // Restore the defaults.
                t.reset.restore();
                t.reset();

                t.steps = [{}, {}, {}];

                t.getPreviousStepNumber.restore();
            });

            it("Should return the previous number", function() {
                t.getCurrentStepNumber.returns(42);
                t.isStepPotentiallyVisible.returns(true);
                expect(t.getPreviousStepNumber()).to.equal(41);
            });

            it("Should return null if at the beginning of the list", function() {
                t.getCurrentStepNumber.returns(0);
                expect(t.getPreviousStepNumber()).to.equal(null);
            });

            it("Should iterate until it finds one", function() {
                // Currently on step 3.
                // Step 2 is not available and step 1 is visible.
                t.getCurrentStepNumber.returns(3);
                t.isStepPotentiallyVisible.onCall(0).returns(false);
                t.isStepPotentiallyVisible.onCall(1).returns(true);
                expect(t.getPreviousStepNumber()).to.equal(1);
            });
        });
    });

    describe("fireEventHandlers", function() {
        it("Should return chainable if no handler was found", function() {
            Tour.prototype.reset.restore();
            let t = new Tour();
            t.fireEventHandlers.restore();

            expect(t.fireEventHandlers('unknownHandler')).to.equal(t);
        });

        it("Should return chainable if a handler was found", function() {
            let t = new Tour();

            let stub = sinon.stub();
            t.eventHandlers = {
                someHandler: [stub]
            };

            t.fireEventHandlers.restore();
            expect(t.fireEventHandlers('someHandler')).to.equal(t);
            expect(stub.calledOnce).to.equal.true;
        });
    });

    describe("addEventHandler", function() {
        it("Should add a new handler", function() {
            Tour.prototype.reset.restore();
            let t = new Tour();

            let stub = sinon.stub();
            Tour.prototype.addEventHandler.restore();
            t.addEventHandler('exampleHandler', stub);

            expect(t.eventHandlers.exampleHandler).to.exist;
            expect(t.eventHandlers.exampleHandler).to.have.lengthOf(1);
            expect(t.eventHandlers.exampleHandler).to.eql([stub]);
        });

        it("Should add additional handlers", function() {
            Tour.prototype.reset.restore();
            let t = new Tour();

            let stub1 = sinon.stub();
            let stub2 = sinon.stub();
            Tour.prototype.addEventHandler.restore();

            t.addEventHandler('exampleHandler', stub1);
            t.addEventHandler('exampleHandler', stub2);

            expect(t.eventHandlers.exampleHandler).to.exist;
            expect(t.eventHandlers.exampleHandler).to.have.lengthOf(2);
            expect(t.eventHandlers.exampleHandler).to.eql([stub1, stub2]);
        });
    });

    describe("next", function() {
        it("Should call renderStep with the next step number", function() {
            let t = new Tour();

            t.getNextStepNumber.returns(42);

            t.next.restore();
            t.next();

            expect(t.renderStep.calledWith(42)).to.equal.true;
        });
    });

    describe("previous", function() {
        it("Should call renderStep with the previous step number", function() {
            let t = new Tour();

            let stepNo = getRandomInt(1, 100);

            t.getPreviousStepNumber.returns(stepNo);

            t.previous.restore();
            t.previous();

            expect(t.renderStep.calledWith(stepNo)).to.equal.true;
        });
    });

    describe("gotoStep", function() {
        it("Should call renderStep with the supplied step number", function() {
            let t = new Tour();

            let stepNo = getRandomInt(1, 100);

            t.gotoStep.restore();
            t.gotoStep(stepNo);

            expect(t.renderStep.calledWith(stepNo)).to.equal.true;
        });
    });

    describe("restartTour", function() {
        it("Should clear the completion flag before restarting", function() {
            let t = new Tour();

            t.restartTour.restore();
            t.restartTour();

            expect(t.clearCompletionFlag.called).to.equal(true);
            expect(t.startTour.called).to.equal(true);
            expect(t.clearCompletionFlag.calledBefore(t.startTour)).to.equal(true);
            expect(t.startTour.calledWith(0)).to.equal(true);
        });
    });

    describe("endTour", function() {
        it("Should mark the tour as complete", function() {
            let t = new Tour();

            t.endTour.restore();
            t.endTour();

            expect(t.markComplete.called).to.equal(true);
        });

        it("Should fire the beforeEnd handler before hiding", function() {
            let t = new Tour();

            t.endTour.restore();
            t.endTour();

            expect(t.fireEventHandlers.calledBefore(t.hide)).to.equal(true);
        });

        it("Should fire the beforeEnd handler before marking complete", function() {
            let t = new Tour();

            t.endTour.restore();
            t.endTour();

            let fec = t.fireEventHandlers.getCall(0);
            let mc = t.markComplete.getCall(0);

            expect(t.fireEventHandlers.getCall(0).args[0] === 'beforeEnd').to.equal(true);
            expect(t.fireEventHandlers.getCall(0).calledBefore(t.markComplete.getCall(0))).to.equal(true);
        });

        it("Should fire the beforeEnd handler before marking complete", function() {
            let t = new Tour();

            t.endTour.restore();
            t.endTour();

            expect(t.fireEventHandlers.getCall(1).args[0] === 'afterEnd').to.equal(true);
            expect(t.fireEventHandlers.getCall(1).calledAfter(t.markComplete.getCall(0))).to.equal(true);
        });
    });

    describe("isStepPotentiallyVisible", function() {
        let t;

        beforeEach(function() {
            t = new Tour();
            t.isStepPotentiallyVisible.restore();
        });

        let dataProvider = function() {
            return [
                    [undefined,     false],
                    [null,          false],
                    [0,             false],
                    [1,             false],
                    [{},            false],
                    [{delay: 0},    false],
                    [{delay: 1},    true],
                ];
        };

        given(dataProvider()).it("Should return the correct values in each testcase",
            function(stepConfig, expectation) {
                expect(t.isStepPotentiallyVisible(stepConfig)).to.equal(expectation);
            });

        it("Should check the validity of step targets", function() {
            t.getStepTarget.restore();
            jquery('body').append('<span class="some-element"></span>');
            expect(t.isStepPotentiallyVisible({target: '.some-element'})).to.equal(true);
        });
    });

    describe("isFirstStep", function() {
        let dataProvider = function() {
            return [
                    [null,      undefined,  true],
                    [0,         undefined,  false],
                    [42,        undefined,  false],
                    [undefined, null,       true],
                    [undefined, 0,          false],
                    [undefined, 42,         false],
                ];
        };

        given(dataProvider()).it("Should use the default renderer if a function was not provided",
            function(input, previousStepNumber, expectation) {
                let t = new Tour();
                t.getPreviousStepNumber.returns(previousStepNumber);
                t.isFirstStep.restore();
                expect(t.isFirstStep(input)).to.equal(expectation);
            });
    });

    describe("isLastStep", function() {
        let dataProvider = function() {
            return [
                    [null,      undefined,  true],
                    [0,         undefined,  false],
                    [42,        undefined,  false],
                    [undefined, null,       true],
                    [undefined, 0,          false],
                    [undefined, 42,         false],
                ];
        };

        given(dataProvider()).it("Should use the default renderer if a function was not provided",
            function(input, nextStepNumber, expectation) {
                let t = new Tour();
                t.getNextStepNumber.returns(nextStepNumber);
                t.isLastStep.restore();
                expect(t.isLastStep(input)).to.equal(expectation);
            }
        );
    });

    describe("startTour", function() {
        it("Should fire the beforeStart handler before attempting to render a step", function() {
            let t = new Tour();

            t.isMarkedComplete.returns(false);

            t.startTour.restore();
            t.startTour(0);

            expect(t.fireEventHandlers.getCall(0).args[0]).to.equal('beforeStart');
            expect(t.fireEventHandlers.getCall(0).calledBefore(t.gotoStep.getCall(0))).to.equal(true);
        });

        it("Should fire the afterStart handler after attempting to render a step", function() {
            let t = new Tour();

            t.isMarkedComplete.returns(false);

            t.startTour.restore();
            t.startTour(0);

            expect(t.fireEventHandlers.getCall(1).args[0]).to.equal('afterStart');
            expect(t.fireEventHandlers.getCall(1).calledAfter(t.gotoStep.getCall(0))).to.equal(true);
        });

        it("No event handles will be called if marked complete", function() {
            let t = new Tour();

            t.isMarkedComplete.returns(true);

            t.startTour.restore();
            t.startTour(0);

            expect(t.fireEventHandlers.called).to.equal(false);
        });

        it("No step rendered if marked complete", function() {
            let t = new Tour();

            t.isMarkedComplete.returns(true);

            t.startTour.restore();
            t.startTour(0);

            expect(t.gotoStep.called).to.equal(false);
        });

        it("Step number fetched if not specified", function() {
            let t = new Tour();

            t.isMarkedComplete.returns(true);

            t.startTour.restore();
            t.startTour();

            expect(t.getCurrentStepNumber.called).to.equal(true);
        });
    });

    describe("renderStep", function() {
        it("Should fire the beforeRender handler before attempting to render a step", function() {
            let t = new Tour();

            t.getStepConfig.returns({});

            // Mock the renderer.
            t.render = sinon.spy();

            t.renderStep.restore();
            t.renderStep(0);

            expect(t.fireEventHandlers.getCall(0).args[0]).to.equal('beforeRender');
            expect(t.fireEventHandlers.getCall(0).calledBefore(t.render.getCall(0))).to.equal(true);
        });

        it("Should fire the afterRender handler after attempting to render a step", function() {
            let t = new Tour();

            t.getStepConfig.returns({});

            // Mock the renderer.
            t.render = sinon.spy();

            t.renderStep.restore();
            t.renderStep(0);

            expect(t.fireEventHandlers.getCall(1).args[0]).to.equal('afterRender');
            expect(t.fireEventHandlers.getCall(1).calledAfter(t.render.getCall(0))).to.equal(true);
        });

        it("Should store the step number after rendering", function() {
            let t = new Tour();

            t.getStepConfig.returns({});

            // Mock the renderer.
            t.render = sinon.spy();

            t.renderStep.restore();
            t.renderStep(0);

            expect(t.setCurrentStepNumber.getCall(0).calledAfter(t.render.getCall(0))).to.equal(true);
        });

        it("Should end the tour if the requested step has no configuration", function() {
            let t = new Tour();

            t.getStepConfig.returns(null);

            t.renderStep.restore();
            t.renderStep(0);

            expect(t.endTour.called).to.equal(true);
        });
    });

    describe("getStepConfig", function() {
        let t;
        beforeEach(function() {
            t = new Tour();
            t.getStepConfig.restore();
        });

        let dataProvider = function() {
            return [
                    [[], -1],
                    [[], 0],
                    [[], 1],
                    [[{}], 1],
                ];
        };

        given(dataProvider()).it("Should return null if the step does not exist",
        function(stepList, stepNumber) {
            t.steps = stepList;
            expect(t.getStepConfig(stepNumber)).to.equal(null);
        });

        it("Normalises configuration", function() {
            t.steps = [{}];
            t.getStepConfig(0);

            expect(t.normalizeStepConfig.called).to.equal(true);
        });

        it("Adds the step number.", function() {
            t.steps = [{}, {}, {}, {}];

            t.normalizeStepConfig.returns({});
            expect(t.getStepConfig(2)).to.have.property('stepNumber', 2);
        });

        it("Overrides the step number in the config", function() {
            t.steps = [{}, {}, {}, {}];

            t.normalizeStepConfig.returns({stepNumber: 99});
            expect(t.getStepConfig(2)).to.have.property('stepNumber', 2);
        });
    });
});
