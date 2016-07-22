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

            it("Should respect the passed number", function() {
                t.isStepPotentiallyVisible.returns(true);
                expect(t.getNextStepNumber(2)).to.equal(3);
                expect(t.getCurrentStepNumber.called).to.equal(false);
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

            it("Should respect the passed number", function() {
                // Currently on step 2, and step 3 is visible.
                expect(t.getPreviousStepNumber(0)).to.equal(null);
                expect(t.getCurrentStepNumber.called).to.equal(false);
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
        it("Should call gotoStep with the next step number", function() {
            let t = new Tour();

            t.getNextStepNumber.returns(42);

            t.next.restore();
            t.next();

            expect(t.gotoStep.calledWith(42)).to.equal.true;
        });
    });

    describe("previous", function() {
        it("Should call gotoStep with the previous step number", function() {
            let t = new Tour();

            let stepNo = getRandomInt(1, 100);

            t.getPreviousStepNumber.returns(stepNo);

            t.previous.restore();
            t.previous();

            expect(t.gotoStep.calledWith(stepNo)).to.equal.true;
        });
    });

    describe("restartTour", function() {
        it("Should clear the completion flag before restarting", function() {
            let t = new Tour();

            t.restartTour.restore();
            t.restartTour();

            expect(t.startTour.called).to.equal(true);
            expect(t.startTour.calledWith(0)).to.equal(true);
        });
    });

    describe("endTour", function() {
        it("Should fire the beforeEnd handler before hiding", function() {
            let t = new Tour();

            t.endTour.restore();
            t.endTour();

            expect(t.fireEventHandlers.getCall(0).args[0] === 'beforeEnd').to.equal(true);
            expect(t.fireEventHandlers.calledBefore(t.hide)).to.equal(true);
        });

        it("Should fire the afterEnd handler after hiding", function() {
            let t = new Tour();

            t.endTour.restore();
            t.endTour();

            expect(t.fireEventHandlers.getCall(1).args[0] === 'afterEnd').to.equal(true);
            expect(t.fireEventHandlers.getCall(1).calledAfter(t.hide.getCall(0))).to.equal(true);
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
                    [{orphan: 1},    true],
                ];
        };

        given(dataProvider()).it("Should return the correct values in each testcase",
            function(stepConfig, expectation) {
                t.isStepActuallyVisible.returns(false);
                expect(t.isStepPotentiallyVisible(stepConfig)).to.equal(expectation);
            });

        it("Should return true if the step is actually visible", function() {
            t.isStepActuallyVisible.returns(true);
            expect(t.isStepPotentiallyVisible({})).to.equal(true);
        });
    });

    describe("isStepActuallyVisible", function() {
        let t;

        beforeEach(function() {
            t = new Tour();
            t.isStepActuallyVisible.restore();
        });

        let dataProvider = function() {
            return [
                    [undefined,     false],
                    [null,          false],
                    [0,             false],
                    [1,             false],
                    [{},            false],
                ];
        };

        given(dataProvider()).it("Should return the correct values in each testcase",
            function(stepConfig, expectation) {
                expect(t.isStepActuallyVisible(stepConfig)).to.equal(expectation);
            });

        it("Should check the validity of step targets", function() {
            t.getStepTarget.returns($('<span class="some-element"></span>'));
            expect(t.isStepActuallyVisible({target: '.some-element'})).to.equal(true);
        });
    });

    describe("isFirstStep", function() {
        let t;

        beforeEach(function() {
            t = new Tour();
            t.isFirstStep.restore();
        });

        it("Should return true if there is no previous step", function() {
            t.getPreviousStepNumber.returns(null);

            expect(t.isFirstStep()).to.equal(true);
        });

        it("Should return false if there is a positive step number", function() {
            t.getPreviousStepNumber.returns(1);

            expect(t.isFirstStep()).to.equal(false);
        });

        it("Should return false if there is a negative step number", function() {
            t.getPreviousStepNumber.returns(-1);

            expect(t.isFirstStep()).to.equal(false);
        });

        it("Should return false if the step number is 0", function() {
            t.getPreviousStepNumber.returns(0);

            expect(t.isFirstStep()).to.equal(false);
        });
    });

    describe("isLastStep", function() {
        let t;

        beforeEach(function() {
            t = new Tour();
            t.isLastStep.restore();
        });

        it("Should return true if there is no next step", function() {
            t.getNextStepNumber.returns(null);

            expect(t.isLastStep()).to.equal(true);
        });

        it("Should return false if there is a positive step number", function() {
            t.getNextStepNumber.returns(1);

            expect(t.isLastStep()).to.equal(false);
        });

        it("Should return false if there is a negative step number", function() {
            t.getNextStepNumber.returns(-1);

            expect(t.isLastStep()).to.equal(false);
        });

        it("Should return false if the step number is 0", function() {
            t.getNextStepNumber.returns(0);

            expect(t.isLastStep()).to.equal(false);
        });
    });

    describe("startTour", function() {
        it("Should fire the beforeStart handler before attempting to render a step", function() {
            let t = new Tour();

            t.startTour.restore();
            t.startTour(0);

            expect(t.fireEventHandlers.getCall(0).args[0]).to.equal('beforeStart');
            expect(t.fireEventHandlers.getCall(0).calledBefore(t.gotoStep.getCall(0))).to.equal(true);
        });

        it("Should fire the afterStart handler after attempting to render a step", function() {
            let t = new Tour();

            t.startTour.restore();
            t.startTour(0);

            expect(t.fireEventHandlers.getCall(1).args[0]).to.equal('afterStart');
            expect(t.fireEventHandlers.getCall(1).calledAfter(t.gotoStep.getCall(0))).to.equal(true);
        });

        it("Step number fetched if not specified", function() {
            let t = new Tour();

            t.startTour.restore();
            t.startTour();

            expect(t.getCurrentStepNumber.called).to.equal(true);
        });
    });

    describe("gotoStep", function() {
        it("Should fire the beforeRender handler before attempting to render a step", function() {
            let t = new Tour();

            t.getStepConfig.returns({});

            t.gotoStep.restore();
            t.gotoStep(0);

            expect(t.fireEventHandlers.getCall(0).args[0]).to.equal('beforeRender');
            expect(t.fireEventHandlers.getCall(0).calledBefore(t.renderStep.getCall(0))).to.equal(true);
        });

        it("Should fire the afterRender handler after attempting to render a step", function() {
            let t = new Tour();

            t.getStepConfig.returns({});

            t.gotoStep.restore();
            t.gotoStep(0);

            expect(t.fireEventHandlers.getCall(1).args[0]).to.equal('afterRender');
            expect(t.fireEventHandlers.getCall(1).calledAfter(t.renderStep.getCall(0))).to.equal(true);
        });

        it("Should end the tour if the requested step has no configuration", function() {
            let t = new Tour();

            t.getStepConfig.returns(null);

            t.gotoStep.restore();
            t.gotoStep(0);

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
                    [[], null],
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

    describe("normalizeStepConfig", function() {
        let t;
        beforeEach(function() {
            t = new Tour();
            t.normalizeStepConfig.restore();
        });

        describe("Adding step defaults", function() {
            it("Adds defaults to supplied config", function() {
                t.stepDefaults = {foo: 'bar'};
                let stepConfig = t.normalizeStepConfig({baz: 'bum'});
                expect(stepConfig).to.have.property('foo', 'bar');
                expect(stepConfig).to.have.property('baz', 'bum');
            });

            it("Provided configuration overrides defaults", function() {
                t.stepDefaults = {foo: 'bar'};
                let stepConfig = t.normalizeStepConfig({foo: 'bum'});
                expect(stepConfig).to.have.property('foo', 'bum');
            });
        });

    });

    describe("getStepTarget", function() {
        let t;
        beforeEach(function() {
            t = new Tour();
            t.getStepTarget.restore();
        });

        it("Returns null if no target was specified", function() {
            expect(t.getStepTarget({})).to.equal(null);
        });

        it("Returns a jquery object if the target was specified", function() {
            expect(t.getStepTarget({target: 'body'})).to.eql($('body'));
        });
    });

    describe("positionStep", function() {
        let t;
        beforeEach(function() {
            t = new Tour();
            t.positionStep.restore();

            // Replace the current popper.
            global.Popper = sinon.spy();
        });

        it("Does nothing if there is not currentStepNode", function() {
            expect(t.positionStep({})).to.equal(t);
            expect(global.Popper.called).to.equal(false);
        });

        it("Calls Popper if there is a stepNode to popperise", function() {
            t.currentStepNode = $('<div>');
            expect(t.positionStep({})).to.equal(t);
            expect(global.Popper.called).to.equal(true);
        });

        let dataProvider = function() {
            return [
                    // Sensible defaults on unknown placement.
                    [{}, 'flip'],
                    [{placement: 'foo'}, 'flip'],

                    // Standard placement logic.
                    // Current side, opposite side, then top/bottom or left/right.
                    [{placement: 'left'}, ['left', 'right', 'top', 'bottom']],
                    [{placement: 'right'}, ['right', 'left', 'top', 'bottom']],
                    [{placement: 'top'}, ['top', 'bottom', 'right', 'left']],
                    [{placement: 'bottom'}, ['bottom', 'top', 'right', 'left']],
                ];
        };

        given(dataProvider()).it("Should get the correct flip behaviour for the placement",
        function(stepConfig, behaviour) {
            t.currentStepNode = $('<div>');
            expect(t.positionStep(stepConfig)).to.equal(t);
            expect(global.Popper.getCall(0).args[2].flipBehavior).to.eql(behaviour);
        });
    });

    describe("hide", function() {
        let t;
        beforeEach(function() {
            t = new Tour();
            t.hide.restore();
        });

        it("Should destroy the popper", function() {
            t.currentStepNode = $('<div></div>');
            t.currentStepPopper = {destroy: sinon.spy()};

            expect(t.hide()).to.equal(t);
            expect(t.currentStepPopper.destroy).to.have.been.called;
        });

        it("Should hide the node", function() {
            t.currentStepNode = $('<div></div>');

            expect(t.hide()).to.equal(t);
            // Note: jsdom breaks :hidden filter because it does not have real layout.
            expect(t.currentStepNode.css('display')).to.equal('none');
        });

        it("Should reset the step listeners", function() {
            t.hide();

            expect(t.resetStepListeners.called).to.equal(true);
        });
    });

    describe("show", function() {
        let t;
        beforeEach(function() {
            t = new Tour();
            t.show.restore();
        });

        it("Should goto the current step number", function() {
            let spy = sinon.spy();
            t.getCurrentStepNumber.returns(spy);

            t.show();
            expect(t.gotoStep.calledWith(spy)).to.equal(true);
        });

        it("Should go to a step", function() {
            t.show();
            expect(t.gotoStep.called).to.equal(true);
        });
    });

    describe("Step Listeners", function() {
        describe("processStepListeners", function() {
            let t;

            beforeEach(function() {
                t = new Tour();
                t.processStepListeners.restore();

                t.currentStepNode = $('<span>');
                t.listeners = [];
                sinon.spy(t.currentStepNode, 'on');
            });

            it("Should add listeners to the listeners container", function() {
                expect(t.processStepListeners({})).to.equal(t);

                // Add 1 for the keypress listeners on the body.
                let listenCount = t.currentStepNode.on.callCount + 1;
                expect(t.listeners).to.have.lengthOf(listenCount);
            });

            it("Should add moveOnClick", function() {
                // Mock the target.
                let target = $('<span>');
                sinon.spy(target, 'on');
                t.getStepTarget.returns(target);

                expect(t.processStepListeners({moveOnClick: true})).to.equal(t);
                expect(target.on.called).to.equal(true);

                // Add 1 for the keypress listeners on the body.
                let listenCount = t.currentStepNode.on.callCount + 1;
                expect(t.listeners).to.have.lengthOf(listenCount + 1);
            });

            it("Should not add moveOnClick if set to false", function() {
                // Mock the target.
                let target = $('<span>');
                sinon.spy(target, 'on');
                t.getStepTarget.returns(target);

                expect(t.processStepListeners({moveOnClick: false})).to.equal(t);
                expect(target.on.called).to.equal(false);

                // Add 1 for the keypress listeners on the body.
                let listenCount = t.currentStepNode.on.callCount + 1;
                expect(t.listeners).to.have.lengthOf(listenCount);
            });
        });

        describe("resetStepListeners", function() {
            let t;
            beforeEach(function() {
                t = new Tour();
                t.resetStepListeners.restore();

                sinon.spy($.prototype, 'off');
            });

            afterEach(function() {
                $.prototype.off.restore();
            });

            it("Resets the listeners to an empty array", function() {
                t.listeners = null;

                expect(t.resetStepListeners()).to.equal(t);
                expect(t.listeners).to.eql([]);
            });

            it("Calls off for each listener", function() {
                let spy1 = $('<div>');
                let spy1args = sinon.spy();
                let spy2 = $('<div>');
                let spy2args = sinon.spy();
                let spy3 = $('<div>');
                let spy3args = sinon.spy();
                t.listeners = [
                    {
                        node: spy1,
                        args: [spy1args],
                    },
                    {
                        node: spy2,
                        args: [spy2args],
                    },
                    {
                        node: spy3,
                        args: [spy3args],
                    },
                ];

                expect(t.resetStepListeners()).to.equal(t);

                expect($.prototype.off.callCount).to.equal(3);
                expect($.prototype.off.withArgs(spy1args).calledOnce).to.equal(true);
                expect($.prototype.off.withArgs(spy2args).calledOnce).to.equal(true);
                expect($.prototype.off.withArgs(spy3args).calledOnce).to.equal(true);
            });
        });
    });
    describe("renderStep", function() {
        let t;
        beforeEach(function() {
            t = new Tour();

            // Mock required parts.
            t.getTemplateContent = sinon.stub();
            t.getTemplateContent.returns($('<div>'));

            // Mock the function being tested.
            t.renderStep.restore();
        });

        it("Should store the step number after rendering", function() {
            t.renderStep({});

            expect(t.setCurrentStepNumber.called).to.equal(true);
        });

        let expectedFunctionNameCallsProvider = function() {
            return [
                    ['addStepToPage'],
                    ['processStepListeners'],
                    ['announceStep'],
                ];
        };

        given(expectedFunctionNameCallsProvider()).it("Should call function", function(functionName) {
            t.renderStep({});

            expect(t[functionName].called).to.equal(true);
        });

        it("Should set the title in the template content", function() {
            t.getTemplateContent.returns($('<div><div data-placeholder="title"></div></div>'));

            t.renderStep({title: 'Supplied Value'});

            expect(t.addStepToPage.getCall(0).args[0].template).to.have.text('Supplied Value');
        });

        it("Should set the body in the template content", function() {
            t.getTemplateContent.returns($('<div><div data-placeholder="body"></div></div>'));

            t.renderStep({body: 'Supplied Value'});

            expect(t.addStepToPage.getCall(0).args[0].template).to.have.text('Supplied Value');
        });

        let templateButtonProvider = function() {
            return [
                    [
                        {
                            isFirstStep: true,
                        },
                        '<div data-role="previous"></div>',
                        '[data-role="previous"]',
                        true,
                    ],
                    [
                        {
                            isFirstStep: false,
                        },
                        '<div data-role="previous"></div>',
                        '[data-role="previous"]',
                        false,
                    ],
                    [
                        {
                            isLastStep: true,
                        },
                        '<div data-role="next"></div>',
                        '[data-role="next"]',
                        true,
                    ],
                    [
                        {
                            isLastStep: false,
                        },
                        '<div data-role="next"></div>',
                        '[data-role="next"]',
                        false,
                    ],
                ];
        };

        given(templateButtonProvider()).it("Should update buttons based on other content",
        function(returners, template, selector, disabled) {
            let fn;
            for (fn in returners) {
                t[fn].returns(returners[fn]);
            }

            t.getTemplateContent.returns($('<div>' + template + '</div>'));

            t.renderStep({});

            expect($(t.addStepToPage.getCall(0).args[0].template).find(selector))
                .to.have.prop('disabled', disabled);
        });
    });
});
