(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["jquery"], function (a0) {
      return (root['Tour'] = factory(a0));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("jquery"));
  } else {
    root['Tour'] = factory(jquery);
  }
}(this, function (jquery) {

"use strict";

/**
 * A Tour.
 *
 * @class   Tour
 * @param   {object}    config  The configuration object.
 */
function Tour(config) {
    this.init(config);
}

/**
 * The name of the tour.
 *
 * @property    {String}    tourName
 */
Tour.prototype.tourName;

/**
 * The original configuration as passed into the constructor.
 *
 * @property    {Object}    originalConfiguration
 */
Tour.prototype.originalConfiguration;

/**
 * The list of step listeners.
 *
 * @property    {Array}     listeners
 */
Tour.prototype.listeners;

/**
 * The list of event handlers.
 *
 * @property    {Object}    eventHandlers
 */
Tour.prototype.eventHandlers;

/**
 * The list of steps.
 *
 * @property    {Object[]}      steps
 */
Tour.prototype.steps;

/**
 * The current step number.
 *
 * @property    {Integer}       currentStepNumber
 */
Tour.prototype.currentStepNumber;

/**
 * The current step number.
 *
 * @property    {jQuery}        currentStepNode
 */
Tour.prototype.currentStepNode;

/**
 * The render function to use.
 *
 * @property    {Function}      render
 */
Tour.prototype.render;

/**
 * The template content.
 *
 * @property    {String}        templateContent
 */
Tour.prototype.templateContent;

/**
 * Initialise the tour.
 *
 * @method  init
 * @param   {object}    config  The configuration object.
 * @chainable
 */
Tour.prototype.init = function(config) {
    // Reset the current tour states.
    this.reset();

    // Store the initial configuration.
    this.originalConfiguration = config || {};

    // Apply configuration.
    this.configure.apply(this, arguments);
};

/**
 * Reset the current tour state.
 *
 * @method  reset
 * @chainable
 */
Tour.prototype.reset = function() {
    // Hide the current step.
    this.hide();

    // Unset all handlers.
    this.eventHandlers = [];

    // Unset all listeners.
    this.resetStepListeners();

    // Unset the original configuration.
    this.originalConfiguration = {};

    // Reset the current step number and list of steps.
    this.currentStepNumber = 0;
    this.steps = [];

    // Unset the render function.
    this.render = null;

    return this;
};

/**
 * Prepare tour configuration.
 *
 * @method  configure
 * @chainable
 */
Tour.prototype.configure = function(config) {
    if (typeof config !== 'object') {
        config = {};
    }

    // Tour configuration:
    // tourName
    // strings
    // steps
    // eventHandlers
    // storage
    // template
    // renderFunction

    // Tour name.

    // Configure the render function.
    if (typeof config.renderFunction === 'function') {
        this.render = config.renderFunction;
    } else if (typeof this.render !== 'function') {
        this.render = this.stepRenderer;
    }

    // Reset the step configuration.
    this.resetStepDefaults(true);

    if (typeof config.steps === 'object') {
        this.steps = config.steps;
    }

    if (typeof config.template !== 'undefined') {
        this.templateContent = config.template;
    }

    return this;
};

/**
 * Reset step default configuration.
 *
 * @method  configure
 * @param   {Boolean}   loadOriginalConfiguration   Whether to load the original configuration supplied with the Tour.
 * @chainable
 */
Tour.prototype.resetStepDefaults = function(loadOriginalConfiguration) {
    if (typeof loadOriginalConfiguration === 'undefined') {
        loadOriginalConfiguration = true;
    }

    this.stepDefaults = {};
    if (!loadOriginalConfiguration || typeof this.originalConfiguration.stepDefaults === 'undefined') {
        this.setStepDefaults({});
    } else {
        this.setStepDefaults(this.originalConfiguration.stepDefaults);
    }

    return this;
};

Tour.prototype.setStepDefaults = function(stepDefaults) {
    if (!this.stepDefaults) {
        this.stepDefaults = {};
    }
    jquery.extend(
        this.stepDefaults,
        {
            element:        '',
            placement:      'top',
            delay:          0,
            moveOnClick:    false,
            moveAfterTime:  0,
            orphan:         false,
        },
        stepDefaults
    );

    return this;
};

/**
 * Retrieve the current step number.
 *
 * @method  getCurrentStepNumber
 * @return  {Integer}                   The current step number
 */
Tour.prototype.getCurrentStepNumber = function() {
    return this.currentStepNumber;
};

/**
 * Store the current step number.
 *
 * @method  setCurrentStepNumber
 * @param   {Integer}   stepNumber      The current step number
 * @chainable
 */
Tour.prototype.setCurrentStepNumber = function(stepNumber) {
    this.currentStepNumber = stepNumber;

    return this;
};

/**
 * Get the next step number after the currently displayed step.
 *
 * @method  getNextStepNumber
 * @return  {Integer}    The next step number to display
 */
Tour.prototype.getNextStepNumber = function() {
    var stepNumber = this.getCurrentStepNumber();
    let nextStepNumber = stepNumber + 1;

    // Keep checking the remaining steps.
    while (nextStepNumber <= this.steps.length) {
        if (this.isStepPotentiallyVisible(this.getStepConfig(nextStepNumber))) {
            return nextStepNumber;
        }
        nextStepNumber++;
    }

    return null;
};

/**
 * Get the previous step number before the currently displayed step.
 *
 * @method  getPreviousStepNumber
 * @return  {Integer}    The previous step number to display
 */
Tour.prototype.getPreviousStepNumber = function() {
    var stepNumber = this.getCurrentStepNumber();
    let previousStepNumber = stepNumber - 1;

    // Keep checking the remaining steps.
    while (previousStepNumber >= 0) {
        if (this.isStepPotentiallyVisible(this.getStepConfig(previousStepNumber))) {
            return previousStepNumber;
        }
        previousStepNumber--;
    }

    return null;
};

/**
 * Is the step the final step number?
 *
 * @method  isLastStep
 * @param   {Integer}   stepNumber  Step number to test
 * @return  {Boolean}               Whether the step is the final step
 */
Tour.prototype.isLastStep = function(stepNumber) {
    let nextStepNumber = stepNumber;
    if (typeof nextStepNumber === 'undefined') {
        nextStepNumber = this.getNextStepNumber();
    }
    return nextStepNumber === null;
};

/**
 * Is the step the first step number?
 *
 * @method  isFirstStep
 * @param   {Integer}   stepNumber  Step number to test
 * @return  {Boolean}               Whether the step is the first step
 */
Tour.prototype.isFirstStep = function(stepNumber) {
    let previousStepNumber = stepNumber;
    if (typeof previousStepNumber === 'undefined') {
        previousStepNumber = this.getPreviousStepNumber();
    }
    return previousStepNumber === null;
};

/**
 * Is this step potentially visible?
 *
 * @method  isStepPotentiallyVisible
 * @param   {Integer}   stepNumber  Step number to test
 * @return  {Boolean}               Whether the step is the first step
 */
Tour.prototype.isStepPotentiallyVisible = function(stepConfig) {
    if (!stepConfig) {
        return false;
    }
    if (typeof stepConfig.delay !== 'undefined' && stepConfig.delay) {
        return true;
    }

    let target = this.getStepTarget(stepConfig);
    if (target && target.length) {
        return !!target.length;
    }
    return false;
};

/**
 * Go to the next step in the tour.
 *
 * @method  next
 * @chainable
 */
Tour.prototype.next = function() {
    return this.renderStep(this.getNextStepNumber());
};

/**
 * Go to the previous step in the tour.
 *
 * @method  previous
 * @chainable
 */
Tour.prototype.previous = function() {
    return this.renderStep(this.getPreviousStepNumber());
};

/**
 * Go to the specified step in the tour.
 *
 * @method  gotoStep
 * @param   {Integer}   stepNumber      The step number to display
 * @chainable
 */
Tour.prototype.gotoStep = function(stepNumber) {
    return this.renderStep(stepNumber);
};

/**
 * Render the specified step number.
 *
 * @method  renderStep
 * @param   {Integer}   stepNumber      The step number to display
 * @chainable
 */
Tour.prototype.renderStep = function(stepNumber) {
    let stepConfig = this.getStepConfig(stepNumber);
    if (!stepConfig) {
        return this.endTour();
    }

    this.hide();

    this.fireEventHandlers('beforeRender', stepConfig);

    this.render(stepConfig);
    this.setCurrentStepNumber(stepNumber);

    this.fireEventHandlers('afterRender', stepConfig);

    return this;
};

/**
 * Fetch the normalised step configuration for the specified step number.
 *
 * @method  getStepConfig
 * @param   {Integer}   stepNumber      The step number to fetch configuration for
 * @return  {Object}                    The step configuration
 */
Tour.prototype.getStepConfig = function(stepNumber) {
    if (stepNumber < 0 || stepNumber >= this.steps.length) {
        return null;
    }

    // Normalise the step configuration.
    let stepConfig = this.normalizeStepConfig(this.steps[stepNumber]);

    // Add the stepNumber to the stepConfig.
    stepConfig = jquery.extend(stepConfig, {stepNumber: stepNumber});

    return stepConfig;
};

/**
 * Normalise the supplied step configuration.
 *
 * @method  normalizeStepConfig
 * @param   {Object}    stepConfig      The step configuration to normalise
 * @return  {Object}                    The normalised step configuration
 */
Tour.prototype.normalizeStepConfig = function(stepConfig) {
    stepConfig = jquery.extend({}, this.stepDefaults, stepConfig);

    // TODO REMOVE
    if (!stepConfig.target && stepConfig.element) {
        stepConfig.target = stepConfig.element;
    }

    if (!stepConfig.body && stepConfig.content) {
        stepConfig.body = stepConfig.content;
    }
    // END TODO

    return stepConfig;
};

/**
 * Fetch the actual step target from the selector.
 *
 * This should not be called until after any delay has completed.
 *
 * @method  getStepTarget
 * @param   {Object}    stepConfig      The step configuration
 * @return  {jquery}
 */
Tour.prototype.getStepTarget = function(stepConfig) {
    if (stepConfig.target) {
        return jquery(stepConfig.target);
    }

    return null;
};

/**
 * Fire any event handlers for the specified event.
 *
 * @param   {String}    eventName       The name of the event to handle
 * @param   {Object}    data            Any data to pass to the event
 * @chainable
 */
Tour.prototype.fireEventHandlers = function(eventName, data) {
    if (typeof this.eventHandlers[eventName] === 'undefined') {
        return this;
    }

    this.eventHandlers[eventName].forEach(function(thisEvent) {
        thisEvent.call(this, data);
    }, this);

    return this;
};

/**
 * @method  addEventHandler
 * @param   string      eventName       The name of the event to listen for
 * @param   function    handler         The event handler to call
 */
Tour.prototype.addEventHandler = function(eventName, handler) {
    if (typeof this.eventHandlers[eventName] === 'undefined') {
        this.eventHandlers[eventName] = [];
    }

    this.eventHandlers[eventName].push(handler);

    return this;
};

/**
 * Process listeners for the step being shown.
 *
 * @method  processStepListeners
 * @param   {object}    stepConfig      The configuration for the step
 * @chainable
 */
Tour.prototype.processStepListeners = function(stepConfig) {
    this.listeners.push(
        // Next/Previous buttons.
        this.currentStepNode.on('click', '[data-role="next"]', jquery.proxy(this.next, this)),
        this.currentStepNode.on('click', '[data-role="previous"]', jquery.proxy(this.previous, this)),

        // Close (end tour) buttons.
        this.currentStepNode.on('click', '[data-role="end"]', jquery.proxy(this.endTour, this))
    );


    if (stepConfig.moveOnClick) {
        let target = this.getStepTarget(stepConfig);
        this.listeners.push(
            target.on('click', jquery.proxy(this.next(), this))
        );
    }

    return this;
};

/**
 * Reset step listeners.
 *
 * @method  resetStepListeners
 * @chainable
 */
Tour.prototype.resetStepListeners = function() {
    // Stop listening to all external handlers.
    if (this.listeners) {
        while (this.listeners.length) {
            let listener = this.listeners.pop();
            jquery().off(listener);
        }
    }
    this.listeners = [];

    return this;
};

/**
 * The standard step renderer.
 *
 * @method  stepRenderer
 * @param   {Object}    stepConfig      The step configuration of the step
 * @chainable
 */
Tour.prototype.stepRenderer = function(stepConfig) {
    // Fetch the template and convert it to a jquery object.
    let template = jquery(this.getTemplateContent());

    // Title.
    template.find('[data-placeholder="title"]')
        .html(stepConfig.title);

    // Body.
    template.find('[data-placeholder="body"]')
        .html(stepConfig.body);

    // Is this the first step?
    if (this.isFirstStep(stepConfig.stepNumber)) {
        template.find('[data-role="previous"]').prop('disabled', true);
    } else {
        template.find('[data-role="previous"]').prop('disabled', false);
    }

    // Is this the final step?
    if (this.isLastStep(stepConfig.stepNumber)) {
        template.find('[data-role="next"]').prop('disabled', true);
    } else {
        template.find('[data-role="next"]').prop('disabled', false);
    }

    // Add to the page.
    this.addStepToPage(stepConfig, template);

    // Process step listeners after adding to the page.
    // This uses the currentNode.
    this.processStepListeners(stepConfig);

    // Scroll into view.
    this.scrollIntoView();

    // Announce via ARIA.
    this.announceStep(stepConfig);

    return this;
};

/**
 * Getter for the template content.
 *
 * @method  getTemplateContent
 * @return  {jquery}
 */
Tour.prototype.getTemplateContent = function() {
    return jquery(this.templateContent).clone();
};

/**
 * Helper to add a step to the page.
 *
 * @method  addStepToPage
 * @param   {Object}    stepConfig      The step configuration of the step
 * @param   {String}    stepContent     The step content
 * @chainable
 */
Tour.prototype.addStepToPage = function(stepConfig, stepContent) {
    stepContent.insertAfter(this.getStepTarget(stepConfig));

    // TODO Will remove this.
    stepContent.show();

    this.currentStepNode = stepContent;

    this.positionStep(stepConfig);

    return this;
};

/**
 * Helper to scroll the step into view.
 *
 * @method  scrollIntoView
 * @chainable
 */
Tour.prototype.scrollIntoView = function() {
    let offsetTop = this.currentStepNode.offset().top;
    let windowHeight = jquery(window).height();

    // Set the scrollTop such that it will try to show the step in the middle of the screen.
    let scrollTop = Math.max(0, offsetTop - (windowHeight / 2));

    // The scroll animation occurs on the body or html.
    jquery('body, html')
        // Stop any existing animations first.
        .stop(true, true)
        // Animate scrollTop to scroll into view.
        .animate({scrollTop: Math.ceil(scrollTop)});

    return this;
};

/**
 * Helper to announce the step on the page.
 *
 * @method  announceStep
 * @param   {Object}    stepConfig      The step configuration of the step
 * @chainable
 */
Tour.prototype.announceStep = function(stepConfig) {
    return this;
};

/**
 * Start the current tour.
 *
 * @method  startTour
 * @param   {Integer}   startAt     Which step number to start at. If not specified, starts at the last point.
 * @chainable
 */
Tour.prototype.startTour = function(startAt) {
    if (typeof startAt === 'undefined') {
        startAt = this.getCurrentStepNumber();
    }

    if (this.isMarkedComplete()) {
        return this;
    }

    this.fireEventHandlers('beforeStart', startAt);

    this.gotoStep(startAt);

    this.fireEventHandlers('afterStart', startAt);

    return this;
};

/**
 * Restart the tour from the beginning, resetting the completionlag.
 *
 * @method  restartTour
 * @chainable
 */
Tour.prototype.restartTour = function() {
    // Clear the completion tag.
    this.clearCompletionFlag();

    return this.startTour(0);
};

/**
 * End the current tour.
 *
 * @method  endTour
 * @chainable
 */
Tour.prototype.endTour = function() {
    // The beforeEnd event.
    this.fireEventHandlers('beforeEnd');

    // Hide the current step.
    this.hide();

    // Mark the tour as complete.
    this.markComplete();

    // The afterEnd event.
    this.fireEventHandlers('afterEnd');

    return this;
};

/**
 * Hide any currently visible steps.
 *
 * @method hide
 * @chainable
 */
Tour.prototype.hide = function() {
    // Hide any currently visible steps.
    // TODO add events.
    // TODO convert to transitions?

    if (this.currentStepNode && this.currentStepNode.length) {
        this.currentStepNode.hide();
    }

    // Reset the listeners.
    this.resetStepListeners();

    return this;
};

/**
 * Show the current steps.
 *
 * @method show
 * @chainable
 */
Tour.prototype.show = function() {
    // Show the current step.
    let startAt = this.getCurrentStepNumber();

    return this.gotoStep(startAt);
};

/**
 * Mark the current step as complete.
 *
 * @todo
 * @method  markComplete
 * @chainable
 */
Tour.prototype.markComplete = function() {
    return this;
};

/**
 * Clear the completion flag for this tour.
 *
 * @todo
 * @method  clearCompletionFlag
 * @chainable
 */
Tour.prototype.clearCompletionFlag = function() {
    return this;
};

/**
 * Determine whether the tour has already been marked as complete.
 *
 * @todo
 * @method  isMarkedComplete
 * @return  {Boolean}
 */
Tour.prototype.isMarkedComplete = function() {
    return false;
};

/**
 * Return the current step node.
 *
 * @method  getStepContainer
 * @return  {jQuery}
 */
Tour.prototype.getStepContainer = function() {
    return $(this.currentStepNode);
};

/**
 * ============================================================================
 * ============================================================================
 * ============================================================================
 * ============================================================================
 */

/**
 * Position the step on the page.
 *
 * @method  positionStep
 * @param   {Object}    stepConfig      The step configuration of the step
 * @chainable
 */
Tour.prototype.positionStep = function(stepConfig) {
    let content = this.currentStepNode;
    if (!content || !content.length) {
        // Unable to find the step node.
        return this;
    }

    let el = content[0];
    let pos = this.getPosition(content);
    let actualWidth = el.offsetWidth;
    let actualHeight = el.offsetHeight;

    // Funky stuff for responsiveness.
    // TODO

    let calculatedOffset = this.getCalculatedOffset(stepConfig.placement, pos, actualWidth, actualHeight);

    this.applyPlacement(calculatedOffset, stepConfig.placement);

    return this;
};

/**
 * Get the current position of the supplied object.
 *
 * @param   {DOMElement}    content     The content to determine the position of
 * @return  {object}                    The top, left, scroll, width, height, and bounds of the supplied object
 */
Tour.prototype.getPosition = function(content) {
    // Normalise the input.
    content = $(content);
    let element = content[0];

    let bounds = element.getBoundingClientRect();

    let elOffset, scroll, outerDims;
    if (element.tagName == 'BODY') {
        // The supplied content is the body for some reason.
        // Have sensible fallbacks.
        elOffset = {
            top:    0,
            left:   0,
        };

        scroll = {
            scroll: document.documentElement.scrollTop || document.body.scrollTop,
        };

        outerDims = {
            width:  jquery(window).width(),
            height: jquery(window).height(),
        };
    } else {
        elOffset = content.offest();
        scroll = {
            scroll: content.scrollTop()
        };
        outerDims = null;
    }

    return jquery.extend({}, bounds, scroll, outerDims, elOffset);
};

/**
 * Get the calculated offset.
 *
 */
Tour.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    if (placement === 'bottom') {
        return {
            top:    pos.top + pos.height,
            left:   pos.left + pos.width / 2 - actualWidth / 2,
        };
    } else if (placement === 'top') {
        return {
            top:    pos.top - actualHeight,
            left:   pos.left + pos.width / 2 - actualWidth / 2,
        };
    } else if (placement === 'left') {
        return {
            top:    pos.top + pos.height / 2 - actualHeight / 2,
            left:   pos.left - actualWidth
        };
    } else {
        return {
            top:    pos.top + pos.height / 2 - actualHeight / 2,
            left:   pos.left + pos.width
        };
    }
};

Tour.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.getStepContainer().find('[data-role="step"]');
    var width  = $tip[0].offsetWidth;
    var height = $tip[0].offsetHeight;

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10);
    var marginLeft = parseInt($tip.css('margin-left'), 10);

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0;
    if (isNaN(marginLeft)) marginLeft = 0;

    offset.top  += marginTop;
    offset.left += marginLeft;

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    jquery.offset.setOffset($tip[0], jquery.extend({
        using: function (props) {
            $tip.css({
                top: Math.round(props.top),
                left: Math.round(props.left)
            });
        }
    }, offset), 0);

    $tip.addClass('in');

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth;
    var actualHeight = $tip[0].offsetHeight;

    if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight;
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);

    if (delta.left) offset.left += delta.left;
    else offset.top += delta.top;

    var isVertical          = /top|bottom/.test(placement);
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';

    $tip.offset(offset);
    //this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical);
};

Tour.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 };
    return delta;
    if (!this.$viewport) return delta;

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
    var viewportDimensions = this.getPosition(this.$viewport);

    if (/right|left/.test(placement)) {
        var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll;
        var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
        if (topEdgeOffset < viewportDimensions.top) { // top overflow
            delta.top = viewportDimensions.top - topEdgeOffset;
        } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
            delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
        }
    } else {
        var leftEdgeOffset  = pos.left - viewportPadding;
        var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
        if (leftEdgeOffset < viewportDimensions.left) { // left overflow
            delta.left = viewportDimensions.left - leftEdgeOffset;
        } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
            delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
        }
    }

    return delta;
};

return Tour;

}));
