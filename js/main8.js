/**
 * Dragdealer.js 0.9.8
 * http://github.com/skidding/dragdealer
 *
 * (c) 2010+ Ovidiu Cherecheș
 * http://skidding.mit-license.org
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports.Dragdealer = factory();
  } else {
    // Browser globals
    root.Dragdealer = factory();
  }
}(this, function () {

  var Dragdealer = function(wrapper, options) {
    /**
     * Drag-based component that works around two basic DOM elements.
     *
     *   - The wrapper: The top-level element with the .dragdealer class. We
     *                  create a Dragdealer instance with the wrapper as the
     *                  first constructor parameter (it can either receive the ID
     *                  of the wrapper, or the element itself.) The wrapper
     *                  establishes the dragging bounds.
     *
     *   - The handle: A child of the wrapper element, div with a required
     *                 .handle class (may be overridden in options). This will be
     *                 the dragged element, constrained by the wrapper's bounds.
     *
     *
     * The handle can be both smaller or bigger than the wrapper.
     *
     *   - When the handle is smaller, Dragdealer will act as a regular slider,
     *     enabling the handle to be dragged from one side of the wrapper to
     *     another.
     *
     *   - When the handle is bigger, Dragdealer will act a mask for a draggable
     *     surface, where the handle is the draggable surface contrained by the
     *     smaller bounds of the wrapper. The drag action in this case is used
     *     to reveal and "discover" partial content at a time.
     *
     *
     * Simple usage:
     *
     *   // JavaScript
     *   new Dragdealer('simple-slider');
     *
     *   <!-- HTML -->
     *   <div id="simple-slider" class="dragdealer">
     *     <div class="handle">drag me</div>
     *   </div>
     *
     *
     * The second parameter of the Dragdealer constructor is an object used for
     * specifying any of the supported options. All of them are optional.
     *
     *   - bool disabled=false: Init Dragdealer in a disabled state. The handle
     *                          will have a .disabled class.
     *
     *   - bool horizontal=true: Enable horizontal dragging.
     *
     *   - bool vertical=false: Enable vertical dragging.
     *
     *   - number x=0: Initial horizontal (left) position. Accepts a float number
     *                 value between 0 and 1. Read below about positioning in
     *                 Dragdealer.
     *
     *   - number y=0: Initial vertical (top) position. Accepts a float number
     *                 value between 0 and 1. Read below about positoning in
     *                 Dragdealer.
     *
     *   - number steps=0: Limit the positioning of the handle within the bounds
     *                     of the wrapper, by defining a virtual grid made out of
     *                     a number of equally-spaced steps. This restricts
     *                     placing the handle anywhere in-between these steps.
     *                     E.g. setting 3 steps to a regular slider will only
     *                     allow you to move it to the left, to the right or
     *                     exactly in the middle.
     *
     *   - bool snap=false: When a number of steps is set, snap the position of
     *                      the handle to its closest step instantly, even when
     *                      dragging.
     *
     *   - number speed=0.1: Speed can be set between 0 and 1, with 1 being the
     *                       fastest. It represents how fast the handle will slide
     *                       to position after you mouse up.
     *
     *   - bool slide=true: Slide handle after releasing it, depending on the
     *                      movement speed before the mouse/touch release. The
     *                      formula for calculating how much will the handle
     *                      slide after releasing it is defined by simply
     *                      extending the movement of the handle in the current
     *                      direction, with the last movement unit times four (a
     *                      movement unit is considered the distance crossed
     *                      since the last animation loop, which is currently
     *                      25ms.) So if you were to drag the handle 50px in the
     *                      blink of an eye, it will slide another 200px in the
     *                      same direction. Steps interfere with this formula, as
     *                      the closest step is calculated before the sliding
     *                      distance.
     *
     *   - bool loose=false: Loosen-up wrapper boundaries when dragging. This
     *                       allows the handle to be *slightly* dragged outside
     *                       the bounds of the wrapper, but slides it back to the
     *                       margins of the wrapper upon release. The formula for
     *                       calculating how much the handle exceeds the wrapper
     *                       bounds is made out of the actual drag distance
     *                       divided by 4. E.g. Pulling a slider outside its
     *                       frame by 100px will only position it 25px outside
     *                       the frame.
     *
     *   - number top=0: Top padding between the wrapper and the handle.
     *
     *   - number bottom=0: Bottom padding between the wrapper and the handle.
     *
     *   - number left=0: Left padding between the wrapper and the handle.
     *
     *   - number right=0: Right padding between the wrapper and the handle.
     *
     *   - fn callback(x, y): Called when releasing handle, with the projected
     *                        x, y position of the handle. Projected value means
     *                        the value the slider will have after finishing a
     *                        sliding animation, caused by either a step
     *                        restriction or drag motion (see steps and slide
     *                        options.) This implies that the actual position of
     *                        the handle at the time this callback is called
     *                        might not yet reflect the x, y values received.
     *
     *   - fn dragStopCallback(x,y): Same as callback(x,y) but only called after
     *                               a drag motion, not after setting the step
     *                               manually.
     *
     *   - fn dragStartCallback(x,y): Same as dragStopCallback(x,y) but called at
     *                                the beginning of a drag motion and with the
     *                                sliders initial x, y values.
     *
     *   - fn animationCallback(x, y): Called every animation loop, as long as
     *                                 the handle is being dragged or in the
     *                                 process of a sliding animation. The x, y
     *                                 positional values received by this
     *                                 callback reflect the exact position of the
     *                                 handle DOM element, which includes
     *                                 exceeding values (even negative values)
     *                                 when the loose option is set true.
     *
     *   - string handleClass='handle': Custom class of handle element.
     *
     *   - bool css3=true: Use css3 transform in modern browsers instead of
     *                     absolute positioning.
     *
     *   - fn customRequestAnimationFrame: Provide custom requestAnimationFrame
     *                                     function (used in tests).
     *   - fn customCancelAnimationFrame: Provide custom cancelAnimationFrame
     *                                    function (used in tests).
     *
     * Dragdealer also has a few methods to interact with, post-initialization.
     *
     *   - disable: Disable dragging of a Dragdealer instance. Just as with the
     *              disabled option, the handle will receive a .disabled class
     *
     *   - enable: Enable dragging of a Dragdealer instance. The .disabled class
     *             of the handle will be removed.
     *
     *   - reflow: Recalculate the wrapper bounds of a Dragdealer instance, used
     *             when the wrapper is responsive and its parent container
     *             changed its size, or after changing the size of the wrapper
     *             directly.
     *
     *   - getValue: Get the value of a Dragdealer instance programatically. The
     *               value is returned as an [x, y] tuple and is the equivalent
     *               of the (projected) value returned by the regular callback,
     *               not animationCallback.
     *
     *   - getStep: Same as getValue, but the value returned is in step
     *              increments (see steps option)
     *
     *   - setValue(x, y, snap=false): Set the value of a Dragdealer instance
     *                                 programatically. The 3rd parameter allows
     *                                 to snap the handle directly to the desired
     *                                 value, without any sliding transition.
     *
     *   - setStep(x, y, snap=false): Same as setValue, but the value is received
     *                                in step increments (see steps option)
     *
     *
     * Positioning in Dragdealer:
     *
     *   Besides the top, bottom, left and right paddings, which represent a
     *   number of pixels, Dragdealer uses a [0, 1]-based positioning. Both
     *   horizontal and vertical positions are represented by ratios between 0
     *   and 1. This allows the Dragdealer wrapper to have a responsive size and
     *   not revolve around a specific number of pixels. This is how the x, y
     *   options are set, what the callback args contain and what values the
     *   setValue method expects. Once picked up, the ratios can be scaled and
     *   mapped to match any real-life system of coordinates or dimensions.
     */
    this.options = this.applyDefaults(options || {});
    this.bindMethods();
    this.wrapper = this.getWrapperElement(wrapper);
    if (!this.wrapper) {
      return;
    }
    this.handle = this.getHandleElement(this.wrapper, this.options.handleClass);
    if (!this.handle) {
      return;
    }
    this.init();
    this.bindEventListeners();
  };


  Dragdealer.prototype = {
    defaults: {
      disabled: false,
      horizontal: true,
      vertical: false,
      slide: true,
      steps: 0,
      snap: false,
      loose: false,
      speed: 0.1,
      xPrecision: 0,
      yPrecision: 0,
      handleClass: 'handle',
      css3: true,
      activeClass: 'active',
      tapping: true
    },
    init: function() {
      if (this.options.css3) {
        triggerWebkitHardwareAcceleration(this.handle);
      }
      this.value = {
        prev: [-1, -1],
        current: [this.options.x || 0, this.options.y || 0],
        target: [this.options.x || 0, this.options.y || 0]
      };
      this.offset = {
        wrapper: [0, 0],
        mouse: [0, 0],
        prev: [-999999, -999999],
        current: [0, 0],
        target: [0, 0]
      };
      this.dragStartPosition = {x: 0, y: 0};
      this.change = [0, 0];
      this.stepRatios = this.calculateStepRatios();

      this.activity = false;
      this.dragging = false;
      this.tapping = false;

      this.reflow();
      if (this.options.disabled) {
        this.disable();
      }
    },
    applyDefaults: function(options) {
      for (var k in this.defaults) {
        if (!options.hasOwnProperty(k)) {
          options[k] = this.defaults[k];
        }
      }
      return options;
    },
    getWrapperElement: function(wrapper) {
      if (typeof(wrapper) == 'string') {
        return document.getElementById(wrapper);
      } else {
        return wrapper;
      }
    },
    getHandleElement: function(wrapper, handleClass) {
      var childElements,
        handleClassMatcher,
        i;
      if (wrapper.getElementsByClassName) {
        childElements = wrapper.getElementsByClassName(handleClass);
        if (childElements.length > 0) {
          return childElements[0];
        }
      } else {
        handleClassMatcher = new RegExp('(^|\\s)' + handleClass + '(\\s|$)');
        childElements = wrapper.getElementsByTagName('*');
        for (i = 0; i < childElements.length; i++) {
          if (handleClassMatcher.test(childElements[i].className)) {
            return childElements[i];
          }
        }
      }
    },
    calculateStepRatios: function() {
      var stepRatios = [];
      if (this.options.steps >= 1) {
        for (var i = 0; i <= this.options.steps - 1; i++) {
          if (this.options.steps > 1) {
            stepRatios[i] = i / (this.options.steps - 1);
          } else {
            // A single step will always have a 0 value
            stepRatios[i] = 0;
          }
        }
      }
      return stepRatios;
    },
    setWrapperOffset: function() {
      this.offset.wrapper = Position.get(this.wrapper);
    },
    calculateBounds: function() {
      // Apply top/bottom/left and right padding options to wrapper extremities
      // when calculating its bounds
      var bounds = {
        top: this.options.top || 0,
        bottom: -(this.options.bottom || 0) + this.wrapper.offsetHeight,
        left: this.options.left || 0,
        right: -(this.options.right || 0) + this.wrapper.offsetWidth
      };
      // The available width and height represents the horizontal and vertical
      // space the handle has for moving. It is determined by the width and
      // height of the wrapper, minus the width and height of the handle
      bounds.availWidth = (bounds.right - bounds.left) - this.handle.offsetWidth;
      bounds.availHeight = (bounds.bottom - bounds.top) - this.handle.offsetHeight;
      return bounds;
    },
    calculateValuePrecision: function() {
      // The sliding transition works by dividing itself until it reaches a min
      // value step; because Dragdealer works with [0-1] values, we need this
      // "min value step" to represent a pixel when applied to the real handle
      // position within the DOM. The xPrecision/yPrecision options can be
      // specified to increase the granularity when we're controlling larger
      // objects from one of the callbacks
      var xPrecision = this.options.xPrecision || Math.abs(this.bounds.availWidth),
        yPrecision = this.options.yPrecision || Math.abs(this.bounds.availHeight);
      return [
        xPrecision ? 1 / xPrecision : 0,
        yPrecision ? 1 / yPrecision : 0
      ];
    },
    bindMethods: function() {
      if (typeof(this.options.customRequestAnimationFrame) === 'function') {
        this.requestAnimationFrame = bind(this.options.customRequestAnimationFrame, window);
      } else {
        this.requestAnimationFrame = bind(requestAnimationFrame, window);
      }
      if (typeof(this.options.customCancelAnimationFrame) === 'function') {
        this.cancelAnimationFrame = bind(this.options.customCancelAnimationFrame, window);
      } else {
        this.cancelAnimationFrame = bind(cancelAnimationFrame, window);
      }
      this.animateWithRequestAnimationFrame = bind(this.animateWithRequestAnimationFrame, this);
      this.animate = bind(this.animate, this);
      this.onHandleMouseDown = bind(this.onHandleMouseDown, this);
      this.onHandleTouchStart = bind(this.onHandleTouchStart, this);
      this.onDocumentMouseMove = bind(this.onDocumentMouseMove, this);
      this.onWrapperTouchMove = bind(this.onWrapperTouchMove, this);
      this.onWrapperMouseDown = bind(this.onWrapperMouseDown, this);
      this.onWrapperTouchStart = bind(this.onWrapperTouchStart, this);
      this.onDocumentMouseUp = bind(this.onDocumentMouseUp, this);
      this.onDocumentTouchEnd = bind(this.onDocumentTouchEnd, this);
      this.onHandleClick = bind(this.onHandleClick, this);
      this.onWindowResize = bind(this.onWindowResize, this);
    },
    bindEventListeners: function() {
      // Start dragging
      addEventListener(this.handle, 'mousedown', this.onHandleMouseDown);
      addEventListener(this.handle, 'touchstart', this.onHandleTouchStart);
      // While dragging
      addEventListener(document, 'mousemove', this.onDocumentMouseMove);
      addEventListener(this.wrapper, 'touchmove', this.onWrapperTouchMove);
      // Start tapping
      addEventListener(this.wrapper, 'mousedown', this.onWrapperMouseDown);
      addEventListener(this.wrapper, 'touchstart', this.onWrapperTouchStart);
      // Stop dragging/tapping
      addEventListener(document, 'mouseup', this.onDocumentMouseUp);
      addEventListener(document, 'touchend', this.onDocumentTouchEnd);

      addEventListener(this.handle, 'click', this.onHandleClick);
      addEventListener(window, 'resize', this.onWindowResize);

      this.animate(false, true);
      this.interval = this.requestAnimationFrame(this.animateWithRequestAnimationFrame);

    },
    unbindEventListeners: function() {
      removeEventListener(this.handle, 'mousedown', this.onHandleMouseDown);
      removeEventListener(this.handle, 'touchstart', this.onHandleTouchStart);
      removeEventListener(document, 'mousemove', this.onDocumentMouseMove);
      removeEventListener(this.wrapper, 'touchmove', this.onWrapperTouchMove);
      removeEventListener(this.wrapper, 'mousedown', this.onWrapperMouseDown);
      removeEventListener(this.wrapper, 'touchstart', this.onWrapperTouchStart);
      removeEventListener(document, 'mouseup', this.onDocumentMouseUp);
      removeEventListener(document, 'touchend', this.onDocumentTouchEnd);
      removeEventListener(this.handle, 'click', this.onHandleClick);
      removeEventListener(window, 'resize', this.onWindowResize);
      this.cancelAnimationFrame(this.interval);
    },
    onHandleMouseDown: function(e) {
      Cursor.refresh(e);
      preventEventDefaults(e);
      stopEventPropagation(e);
      this.activity = false;
      this.startDrag();
    },
    onHandleTouchStart: function(e) {
      Cursor.refresh(e);
      // Unlike in the `mousedown` event handler, we don't prevent defaults here,
      // because this would disable the dragging altogether. Instead, we prevent
      // it in the `touchmove` handler. Read more about touch events
      // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events#Handling_clicks
      stopEventPropagation(e);
      this.activity = false;
      this.startDrag();
    },
    onDocumentMouseMove: function(e) {
      if ((e.clientX - this.dragStartPosition.x) === 0 &&
        (e.clientY - this.dragStartPosition.y) === 0) {
        // This is required on some Windows8 machines that get mouse move events without actual mouse movement
        return;
      }

      Cursor.refresh(e);
      if (this.dragging) {
        this.activity = true;
        preventEventDefaults(e);
      }
    },
    onWrapperTouchMove: function(e) {
      Cursor.refresh(e);
      // Dragging on a disabled axis (horizontal or vertical) shouldn't prevent
      // defaults on touch devices. !this.activity denotes this is the first move
      // inside a drag action; you can drag in any direction after this point if
      // the dragging wasn't stopped
      if (!this.activity && this.draggingOnDisabledAxis()) {
        if (this.dragging) {
          this.stopDrag();
        }
        return;
      }
      // Read comment in `onHandleTouchStart` above, to understand why we're
      // preventing defaults here and not there
      preventEventDefaults(e);
      this.activity = true;
    },
    onWrapperMouseDown: function(e) {
      Cursor.refresh(e);
      preventEventDefaults(e);
      this.startTap();
    },
    onWrapperTouchStart: function(e) {
      Cursor.refresh(e);
      preventEventDefaults(e);
      this.startTap();
    },
    onDocumentMouseUp: function(e) {
      this.stopDrag();
      this.stopTap();
    },
    onDocumentTouchEnd: function(e) {
      this.stopDrag();
      this.stopTap();
    },
    onHandleClick: function(e) {
      // We keep track if any dragging activity has been made between the
      // mouse/touch down and up events; based on this we allow or cancel a click
      // event from inside the handle. i.e. Click events shouldn't be triggered
      // when dragging, but should be allowed when clicking still
      if (this.activity) {
        preventEventDefaults(e);
        stopEventPropagation(e);
      }
    },
    onWindowResize: function(e) {
      this.reflow();
    },
    enable: function() {
      this.disabled = false;
      this.handle.className = this.handle.className.replace(/\s?disabled/g, '');
    },
    disable: function() {
      this.disabled = true;
      this.handle.className += ' disabled';
    },
    reflow: function() {
      this.setWrapperOffset();
      this.bounds = this.calculateBounds();
      this.valuePrecision = this.calculateValuePrecision();
      this.updateOffsetFromValue();
    },
    getStep: function() {
      return [
        this.getStepNumber(this.value.target[0]),
        this.getStepNumber(this.value.target[1])
      ];
    },
    getStepWidth: function () {
      return Math.abs(this.bounds.availWidth / this.options.steps);
    },
    getValue: function() {
      return this.value.target;
    },
    setStep: function(x, y, snap) {
      this.setValue(
        this.options.steps && x > 1 ? (x - 1) / (this.options.steps - 1) : 0,
        this.options.steps && y > 1 ? (y - 1) / (this.options.steps - 1) : 0,
        snap
      );
    },
    setValue: function(x, y, snap) {
      this.setTargetValue([x, y || 0]);
      if (snap) {
        this.groupCopy(this.value.current, this.value.target);
        // Since the current value will be equal to the target one instantly, the
        // animate function won't get to run so we need to update the positions
        // and call the callbacks manually
        this.updateOffsetFromValue();
        this.callAnimationCallback();
      }
    },
    startTap: function() {
      if (this.disabled || !this.options.tapping) {
        return;
      }

      this.tapping = true;
      this.setWrapperOffset();

      this.setTargetValueByOffset([
        Cursor.x - this.offset.wrapper[0] - (this.handle.offsetWidth / 2),
        Cursor.y - this.offset.wrapper[1] - (this.handle.offsetHeight / 2)
      ]);
    },
    stopTap: function() {
      if (this.disabled || !this.tapping) {
        return;
      }
      this.tapping = false;

      this.setTargetValue(this.value.current);
    },
    startDrag: function() {
      if (this.disabled) {
        return;
      }
      this.dragging = true;
      this.setWrapperOffset();

      this.dragStartPosition = {x: Cursor.x, y: Cursor.y};
      this.offset.mouse = [
        Cursor.x - Position.get(this.handle)[0],
        Cursor.y - Position.get(this.handle)[1]
      ];
      if (!this.wrapper.className.match(this.options.activeClass)) {
        this.wrapper.className += ' ' + this.options.activeClass;
      }
      this.callDragStartCallback();
    },
    stopDrag: function() {
      if (this.disabled || !this.dragging) {
        return;
      }
      this.dragging = false;
      var deltaX = this.bounds.availWidth === 0 ? 0 :
          ((Cursor.x - this.dragStartPosition.x) / this.bounds.availWidth),
        deltaY = this.bounds.availHeight === 0 ? 0 :
          ((Cursor.y - this.dragStartPosition.y) / this.bounds.availHeight),
        delta = [deltaX, deltaY];

      var target = this.groupClone(this.value.current);
      if (this.options.slide) {
        var ratioChange = this.change;
        target[0] += ratioChange[0] * 4;
        target[1] += ratioChange[1] * 4;
      }
      this.setTargetValue(target);
      this.wrapper.className = this.wrapper.className.replace(' ' + this.options.activeClass, '');
      this.callDragStopCallback(delta);
    },
    callAnimationCallback: function() {
      var value = this.value.current;
      if (this.options.snap && this.options.steps > 1) {
        value = this.getClosestSteps(value);
      }
      if (!this.groupCompare(value, this.value.prev)) {
        if (typeof(this.options.animationCallback) == 'function') {
          this.options.animationCallback.call(this, value[0], value[1]);
        }
        this.groupCopy(this.value.prev, value);
      }
    },
    callTargetCallback: function() {
      if (typeof(this.options.callback) == 'function') {
        this.options.callback.call(this, this.value.target[0], this.value.target[1]);
      }
    },
    callDragStartCallback: function() {
      if (typeof(this.options.dragStartCallback) == 'function') {
        this.options.dragStartCallback.call(this, this.value.target[0], this.value.target[1]);
      }
    },
    callDragStopCallback: function(delta) {
      if (typeof(this.options.dragStopCallback) == 'function') {
        this.options.dragStopCallback.call(this, this.value.target[0], this.value.target[1], delta);
      }
    },
    animateWithRequestAnimationFrame: function (time) {
      if (time) {
        // using requestAnimationFrame
        this.timeOffset = this.timeStamp ? time - this.timeStamp : 0;
        this.timeStamp = time;
      } else {
        // using setTimeout(callback, 25) polyfill
        this.timeOffset = 25;
      }
      this.animate();
      this.interval = this.requestAnimationFrame(this.animateWithRequestAnimationFrame);
    },
    animate: function(direct, first) {
      if (direct && !this.dragging) {
        return;
      }
      if (this.dragging) {
        var prevTarget = this.groupClone(this.value.target);

        var offset = [
          Cursor.x - this.offset.wrapper[0] - this.offset.mouse[0],
          Cursor.y - this.offset.wrapper[1] - this.offset.mouse[1]
        ];
        this.setTargetValueByOffset(offset, this.options.loose);

        this.change = [
          this.value.target[0] - prevTarget[0],
          this.value.target[1] - prevTarget[1]
        ];
      }
      if (this.dragging || first) {
        this.groupCopy(this.value.current, this.value.target);
      }
      if (this.dragging || this.glide() || first) {
        this.updateOffsetFromValue();
        this.callAnimationCallback();
      }
    },
    glide: function() {
      var diff = [
        this.value.target[0] - this.value.current[0],
        this.value.target[1] - this.value.current[1]
      ];
      if (!diff[0] && !diff[1]) {
        return false;
      }
      if (Math.abs(diff[0]) > this.valuePrecision[0] ||
        Math.abs(diff[1]) > this.valuePrecision[1]) {
        this.value.current[0] += diff[0] * Math.min(this.options.speed * this.timeOffset / 25, 1);
        this.value.current[1] += diff[1] * Math.min(this.options.speed * this.timeOffset / 25, 1);
      } else {
        this.groupCopy(this.value.current, this.value.target);
      }
      return true;
    },
    updateOffsetFromValue: function() {
      if (!this.options.snap) {
        this.offset.current = this.getOffsetsByRatios(this.value.current);
      } else {
        this.offset.current = this.getOffsetsByRatios(
          this.getClosestSteps(this.value.current)
        );
      }
      if (!this.groupCompare(this.offset.current, this.offset.prev)) {
        this.renderHandlePosition();
        this.groupCopy(this.offset.prev, this.offset.current);
      }
    },
    renderHandlePosition: function() {

      var transform = '';
      if (this.options.css3 && StylePrefix.transform) {
        if (this.options.horizontal) {
          transform += 'translateX(' + this.offset.current[0] + 'px)';
        }
        if (this.options.vertical) {
          transform += ' translateY(' + this.offset.current[1] + 'px)';
        }
        this.handle.style[StylePrefix.transform] = transform;
        return;
      }

      if (this.options.horizontal) {
        this.handle.style.left = this.offset.current[0] + 'px';
      }
      if (this.options.vertical) {
        this.handle.style.top = this.offset.current[1] + 'px';
      }
    },
    setTargetValue: function(value, loose) {
      var target = loose ? this.getLooseValue(value) : this.getProperValue(value);

      this.groupCopy(this.value.target, target);
      this.offset.target = this.getOffsetsByRatios(target);

      this.callTargetCallback();
    },
    setTargetValueByOffset: function(offset, loose) {
      var value = this.getRatiosByOffsets(offset);
      var target = loose ? this.getLooseValue(value) : this.getProperValue(value);

      this.groupCopy(this.value.target, target);
      this.offset.target = this.getOffsetsByRatios(target);
    },
    getLooseValue: function(value) {
      var proper = this.getProperValue(value);
      return [
        proper[0] + ((value[0] - proper[0]) / 4),
        proper[1] + ((value[1] - proper[1]) / 4)
      ];
    },
    getProperValue: function(value) {
      var proper = this.groupClone(value);

      proper[0] = Math.max(proper[0], 0);
      proper[1] = Math.max(proper[1], 0);
      proper[0] = Math.min(proper[0], 1);
      proper[1] = Math.min(proper[1], 1);

      if ((!this.dragging && !this.tapping) || this.options.snap) {
        if (this.options.steps > 1) {
          proper = this.getClosestSteps(proper);
        }
      }
      return proper;
    },
    getRatiosByOffsets: function(group) {
      return [
        this.getRatioByOffset(group[0], this.bounds.availWidth, this.bounds.left),
        this.getRatioByOffset(group[1], this.bounds.availHeight, this.bounds.top)
      ];
    },
    getRatioByOffset: function(offset, range, padding) {
      return range ? (offset - padding) / range : 0;
    },
    getOffsetsByRatios: function(group) {
      return [
        this.getOffsetByRatio(group[0], this.bounds.availWidth, this.bounds.left),
        this.getOffsetByRatio(group[1], this.bounds.availHeight, this.bounds.top)
      ];
    },
    getOffsetByRatio: function(ratio, range, padding) {
      return Math.round(ratio * range) + padding;
    },
    getStepNumber: function(value) {
      // Translate a [0-1] value into a number from 1 to N steps (set using the
      // "steps" option)
      return this.getClosestStep(value) * (this.options.steps - 1) + 1;
    },
    getClosestSteps: function(group) {
      return [
        this.getClosestStep(group[0]),
        this.getClosestStep(group[1])
      ];
    },
    getClosestStep: function(value) {
      var k = 0;
      var min = 1;
      for (var i = 0; i <= this.options.steps - 1; i++) {
        if (Math.abs(this.stepRatios[i] - value) < min) {
          min = Math.abs(this.stepRatios[i] - value);
          k = i;
        }
      }
      return this.stepRatios[k];
    },
    groupCompare: function(a, b) {
      return a[0] == b[0] && a[1] == b[1];
    },
    groupCopy: function(a, b) {
      a[0] = b[0];
      a[1] = b[1];
    },
    groupClone: function(a) {
      return [a[0], a[1]];
    },
    draggingOnDisabledAxis: function() {
      return (!this.options.horizontal && Cursor.xDiff > Cursor.yDiff) ||
        (!this.options.vertical && Cursor.yDiff > Cursor.xDiff);
    }
  };


  var bind = function(fn, context) {
    /**
     * CoffeeScript-like function to bind the scope of a method to an instance,
     * the context of that method, regardless from where it is called
     */
    return function() {
      return fn.apply(context, arguments);
    };
  };

// Cross-browser vanilla JS event handling

  var addEventListener = function(element, type, callback) {
    if (element.addEventListener) {
      element.addEventListener(type, callback, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + type, callback);
    }
  };

  var removeEventListener = function(element, type, callback) {
    if (element.removeEventListener) {
      element.removeEventListener(type, callback, false);
    } else if (element.detachEvent) {
      element.detachEvent('on' + type, callback);
    }
  };

  var preventEventDefaults = function(e) {
    if (!e) {
      e = window.event;
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.returnValue = false;
  };

  var stopEventPropagation = function(e) {
    if (!e) {
      e = window.event;
    }
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    e.cancelBubble = true;
  };


  var Cursor = {
    /**
     * Abstraction for making the combined mouse or touch position available at
     * any time.
     *
     * It picks up the "move" events as an independent component and simply makes
     * the latest x and y mouse/touch position of the user available at any time,
     * which is requested with Cursor.x and Cursor.y respectively.
     *
     * It can receive both mouse and touch events consecutively, extracting the
     * relevant meta data from each type of event.
     *
     * Cursor.refresh(e) is called to update the global x and y values, with a
     * genuine MouseEvent or a TouchEvent from an event listener, e.g.
     * mousedown/up or touchstart/end
     */
    x: 0,
    y: 0,
    xDiff: 0,
    yDiff: 0,
    refresh: function(e) {
      if (!e) {
        e = window.event;
      }
      if (e.type == 'mousemove') {
        this.set(e);
      } else if (e.touches) {
        this.set(e.touches[0]);
      }
    },
    set: function(e) {
      var lastX = this.x,
        lastY = this.y;
      if (e.clientX || e.clientY) {
        this.x = e.clientX;
        this.y = e.clientY;
      } else if (e.pageX || e.pageY) {
        this.x = e.pageX - document.body.scrollLeft - document.documentElement.scrollLeft;
        this.y = e.pageY - document.body.scrollTop - document.documentElement.scrollTop;
      }
      this.xDiff = Math.abs(this.x - lastX);
      this.yDiff = Math.abs(this.y - lastY);
    }
  };


  var Position = {
    /**
     * Helper for extracting position of a DOM element, relative to the viewport
     *
     * The get(obj) method accepts a DOM element as the only parameter, and
     * returns the position under a (x, y) tuple, as an array with two elements.
     */
    get: function(obj) {
      // Dragdealer relies on getBoundingClientRect to calculate element offsets,
      // but we want to be sure we don't throw any unhandled exceptions and break
      // other code from the page if running from in very old browser that doesn't
      // support this method
      var rect = {left: 0, top: 0};
      if (obj.getBoundingClientRect !== undefined) {
        rect = obj.getBoundingClientRect();
      }
      return [rect.left, rect.top];
    }
  };


  var StylePrefix = {
    transform: getPrefixedStylePropName('transform'),
    perspective: getPrefixedStylePropName('perspective'),
    backfaceVisibility: getPrefixedStylePropName('backfaceVisibility')
  };

  function getPrefixedStylePropName(propName) {
    var domPrefixes = 'Webkit Moz ms O'.split(' '),
      elStyle = document.documentElement.style;
    if (elStyle[propName] !== undefined) return propName; // Is supported unprefixed
    propName = propName.charAt(0).toUpperCase() + propName.substr(1);
    for (var i = 0; i < domPrefixes.length; i++) {
      if (elStyle[domPrefixes[i] + propName] !== undefined) {
        return domPrefixes[i] + propName; // Is supported with prefix
      }
    }
  };

  function triggerWebkitHardwareAcceleration(element) {
    if (StylePrefix.backfaceVisibility && StylePrefix.perspective) {
      element.style[StylePrefix.perspective] = '1000px';
      element.style[StylePrefix.backfaceVisibility] = 'hidden';
    }
  };

  var vendors = ['webkit', 'moz'];
  var requestAnimationFrame = window.requestAnimationFrame;
  var cancelAnimationFrame = window.cancelAnimationFrame;

  for (var x = 0; x < vendors.length && !requestAnimationFrame; ++x) {
    requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!requestAnimationFrame) {
    requestAnimationFrame = function (callback) {
      return setTimeout(callback, 25);
    };
    cancelAnimationFrame = clearTimeout;
  }

  return Dragdealer;

}));







/*!
 * tram.js v0.8.3-global
 * Cross-browser CSS3 transitions in JavaScript
 * https://github.com/bkwld/tram
 * MIT License
 */
window.tram = (function (jQuery) {

  /*!
   * P.js
   * A lightweight class system.  It's just prototypes!
   * http:// github.com/jayferd/pjs
   * MIT license
   */
  var P = (function(prototype, ownProperty, undefined) {
    // helper functions that also help minification
    function isObject(o) { return typeof o === 'object'; }
    function isFunction(f) { return typeof f === 'function'; }

    // a function that gets reused to make uninitialized objects
    function BareConstructor() {}

    function P(_superclass /* = Object */, definition) {
      // handle the case where no superclass is given
      if (definition === undefined) {
        definition = _superclass;
        _superclass = Object;
      }

      // C is the class to be returned.
      //
      // It delegates to instantiating an instance of `Bare`, so that it
      // will always return a new instance regardless of the calling
      // context.
      //
      //  TODO: the Chrome inspector shows all created objects as `C`
      //        rather than `Object`.  Setting the .name property seems to
      //        have no effect.  Is there a way to override this behavior?
      function C() {
        var self = new Bare;
        if (isFunction(self.init)) self.init.apply(self, arguments);
        return self;
      }

      // C.Bare is a class with a noop constructor.  Its prototype is the
      // same as C, so that instances of C.Bare are also instances of C.
      // New objects can be allocated without initialization by calling
      // `new MyClass.Bare`.
      function Bare() {}
      C.Bare = Bare;

      // Set up the prototype of the new class.
      var _super = BareConstructor[prototype] = _superclass[prototype];
      var proto = Bare[prototype] = C[prototype] = new BareConstructor;

      // other variables, as a minifier optimization
      var extensions;


      // set the constructor property on the prototype, for convenience
      proto.constructor = C;

      C.mixin = function(def) {
        Bare[prototype] = C[prototype] = P(C, def)[prototype];
        return C;
      };

      C.open = function(def) {
        extensions = {};

        if (isFunction(def)) {
          // call the defining function with all the arguments you need
          // extensions captures the return value.
          extensions = def.call(C, proto, _super, C, _superclass);
        }
        else if (isObject(def)) {
          // if you passed an object instead, we'll take it
          extensions = def;
        }

        // ...and extend it
        if (isObject(extensions)) {
          for (var ext in extensions) {
            if (ownProperty.call(extensions, ext)) {
              proto[ext] = extensions[ext];
            }
          }
        }

        // if there's no init, we assume we're inheriting a non-pjs class, so
        // we default to applying the superclass's constructor.
        if (!isFunction(proto.init)) {
          proto.init = _superclass;
        }

        return C;
      };

      return C.open(definition);
    }

    // ship it
    return P;

    // as a minifier optimization, we've closured in a few helper functions
    // and the string 'prototype' (C[p] is much shorter than C.prototype)
  })('prototype', ({}).hasOwnProperty);

  // --------------------------------------------------
  // Easing methods { id: [ cssString, jsFunction ] }

  var easing = {

    // --------------------------------------------------
    // CSS easings, converted to functions using Timothee Groleau's generator.
    // http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm

    'ease': ['ease', function (t, b, c, d) {
      var ts=(t /= d)*t;
      var tc=ts*t;
      return b+c*(-2.75*tc*ts + 11*ts*ts + -15.5*tc + 8*ts + 0.25*t);
    }]

    , 'ease-in': ['ease-in', function (t, b, c, d) {
      var ts=(t /= d)*t;
      var tc=ts*t;
      return b+c*(-1*tc*ts + 3*ts*ts + -3*tc + 2*ts);
    }]

    , 'ease-out': ['ease-out', function (t, b, c, d) {
      var ts=(t /= d)*t;
      var tc=ts*t;
      return b+c*(0.3*tc*ts + -1.6*ts*ts + 2.2*tc + -1.8*ts + 1.9*t);
    }]

    , 'ease-in-out': ['ease-in-out', function (t, b, c, d) {
      var ts=(t /= d)*t;
      var tc=ts*t;
      return b+c*(2*tc*ts + -5*ts*ts + 2*tc + 2*ts);
    }]

    // --------------------------------------------------
    // Robert Penner easing equations and their CSS equivalents.
    // http://www.robertpenner.com/easing_terms_of_use.html

    , 'linear': ['linear', function (t, b, c, d) {
      return c*t/d + b;
    }]

    // Quad
    , 'ease-in-quad':
      ['cubic-bezier(0.550, 0.085, 0.680, 0.530)', function (t, b, c, d) {
        return c*(t /= d)*t + b;
      }]

    , 'ease-out-quad':
      ['cubic-bezier(0.250, 0.460, 0.450, 0.940)', function (t, b, c, d) {
        return -c *(t /= d)*(t-2) + b;
      }]

    , 'ease-in-out-quad':
      ['cubic-bezier(0.455, 0.030, 0.515, 0.955)', function (t, b, c, d) {
        if ((t /= d/2) < 1) return c/2*t*t + b;
        return -c/2 * ((--t)*(t-2) - 1) + b;
      }]

    // Cubic
    , 'ease-in-cubic':
      ['cubic-bezier(0.550, 0.055, 0.675, 0.190)', function (t, b, c, d) {
        return c*(t /= d)*t*t + b;
      }]

    , 'ease-out-cubic':
      ['cubic-bezier(0.215, 0.610, 0.355, 1)', function (t, b, c, d) {
        return c*((t=t/d-1)*t*t + 1) + b;
      }]

    , 'ease-in-out-cubic':
      ['cubic-bezier(0.645, 0.045, 0.355, 1)', function (t, b, c, d) {
        if ((t /= d/2) < 1) return c/2*t*t*t + b;
        return c/2*((t-=2)*t*t + 2) + b;
      }]

    // Quart
    , 'ease-in-quart':
      ['cubic-bezier(0.895, 0.030, 0.685, 0.220)', function (t, b, c, d) {
        return c*(t /= d)*t*t*t + b;
      }]

    , 'ease-out-quart':
      ['cubic-bezier(0.165, 0.840, 0.440, 1)', function (t, b, c, d) {
        return -c * ((t=t/d-1)*t*t*t - 1) + b;
      }]

    , 'ease-in-out-quart':
      ['cubic-bezier(0.770, 0, 0.175, 1)', function (t, b, c, d) {
        if ((t /= d/2) < 1) return c/2*t*t*t*t + b;
        return -c/2 * ((t-=2)*t*t*t - 2) + b;
      }]

    // Quint
    , 'ease-in-quint':
      ['cubic-bezier(0.755, 0.050, 0.855, 0.060)', function (t, b, c, d) {
        return c*(t /= d)*t*t*t*t + b;
      }]

    , 'ease-out-quint':
      ['cubic-bezier(0.230, 1, 0.320, 1)', function (t, b, c, d) {
        return c*((t=t/d-1)*t*t*t*t + 1) + b;
      }]

    , 'ease-in-out-quint':
      ['cubic-bezier(0.860, 0, 0.070, 1)', function (t, b, c, d) {
        if ((t /= d/2) < 1) return c/2*t*t*t*t*t + b;
        return c/2*((t-=2)*t*t*t*t + 2) + b;
      }]

    // Sine
    , 'ease-in-sine':
      ['cubic-bezier(0.470, 0, 0.745, 0.715)', function (t, b, c, d) {
        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
      }]

    , 'ease-out-sine':
      ['cubic-bezier(0.390, 0.575, 0.565, 1)', function (t, b, c, d) {
        return c * Math.sin(t/d * (Math.PI/2)) + b;
      }]

    , 'ease-in-out-sine':
      ['cubic-bezier(0.445, 0.050, 0.550, 0.950)', function (t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
      }]

    // Expo
    , 'ease-in-expo':
      ['cubic-bezier(0.950, 0.050, 0.795, 0.035)', function (t, b, c, d) {
        return (t === 0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
      }]

    , 'ease-out-expo':
      ['cubic-bezier(0.190, 1, 0.220, 1)', function (t, b, c, d) {
        return (t === d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
      }]

    , 'ease-in-out-expo':
      ['cubic-bezier(1, 0, 0, 1)', function (t, b, c, d) {
        if (t === 0) return b;
        if (t === d) return b+c;
        if ((t /= d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
        return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
      }]

    // Circ
    , 'ease-in-circ':
      ['cubic-bezier(0.600, 0.040, 0.980, 0.335)', function (t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d)*t) - 1) + b;
      }]

    , 'ease-out-circ':
      ['cubic-bezier(0.075, 0.820, 0.165, 1)', function (t, b, c, d) {
        return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
      }]

    , 'ease-in-out-circ':
      ['cubic-bezier(0.785, 0.135, 0.150, 0.860)', function (t, b, c, d) {
        if ((t /= d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
        return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
      }]

    // Back
    , 'ease-in-back':
      ['cubic-bezier(0.600, -0.280, 0.735, 0.045)', function (t, b, c, d, s) {
        if (s === undefined) s = 1.70158;
        return c*(t /= d)*t*((s+1)*t - s) + b;
      }]

    , 'ease-out-back':
      ['cubic-bezier(0.175, 0.885, 0.320, 1.275)', function (t, b, c, d, s) {
        if (s === undefined) s = 1.70158;
        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
      }]

    , 'ease-in-out-back':
      ['cubic-bezier(0.680, -0.550, 0.265, 1.550)', function (t, b, c, d, s) {
        if (s === undefined) s = 1.70158;
        if ((t /= d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
        return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
      }]
  };

  // Clamp cubic-bezier values for webkit bug
  // https://bugs.webkit.org/show_bug.cgi?id=45761
  var clamped = {
    'ease-in-back': 'cubic-bezier(0.600, 0, 0.735, 0.045)'
    , 'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.320, 1)'
    , 'ease-in-out-back': 'cubic-bezier(0.680, 0, 0.265, 1)'
  };

  // --------------------------------------------------
  // Private vars
  /*global jQuery, P, easing, clamped */

  var doc = document
    , win = window
    , dataKey = 'bkwld-tram'
    , unitRegex = /[\-\.0-9]/g
    , capsRegex = /[A-Z]/
    , typeNumber = 'number'
    , typeColor = /^(rgb|#)/
    , typeLength = /(em|cm|mm|in|pt|pc|px)$/
    , typeLenPerc = /(em|cm|mm|in|pt|pc|px|%)$/
    , typeAngle = /(deg|rad|turn)$/
    , typeFancy = 'unitless'
    , emptyTrans = /(all|none) 0s ease 0s/
    , allowAuto = /^(width|height)$/
    , space = ' '
    ;

  // --------------------------------------------------
  // Private functions

  // Simple feature detect, returns both dom + css prefixed names
  var testDiv = doc.createElement('a')
    , domPrefixes = ['Webkit', 'Moz', 'O', 'ms']
    , cssPrefixes = ['-webkit-', '-moz-', '-o-', '-ms-']
    ;
  var testFeature = function (prop) {
    // unprefixed case
    if (prop in testDiv.style) return { dom: prop, css: prop };
    // test all prefixes
    var i, domProp, domSuffix = '', words = prop.split('-');
    for (i = 0; i < words.length; i++) {
      domSuffix += words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    for (i = 0; i < domPrefixes.length; i++) {
      domProp = domPrefixes[i] + domSuffix;
      if (domProp in testDiv.style) return { dom: domProp, css: cssPrefixes[i] + prop };
    }
  };

  // Run feature tests
  var support = tram.support = {
    bind: Function.prototype.bind
    , transform: testFeature('transform')
    , transition: testFeature('transition')
    , backface: testFeature('backface-visibility')
    , timing: testFeature('transition-timing-function')
  };

  // Modify easing variants for webkit clamp bug
  if (support.transition) {
    var timingProp = support.timing.dom;
    testDiv.style[timingProp] = easing['ease-in-back'][0];
    if (!testDiv.style[timingProp]) {
      // style invalid, use clamped versions instead
      for (var x in clamped) easing[x][0] = clamped[x];
    }
  }

  // Animation timer shim with setTimeout fallback
  var enterFrame = tram.frame = function () {
    var raf = win.requestAnimationFrame ||
      win.webkitRequestAnimationFrame ||
      win.mozRequestAnimationFrame ||
      win.oRequestAnimationFrame ||
      win.msRequestAnimationFrame;
    if (raf && support.bind) return raf.bind(win);
    return function (callback) {
      win.setTimeout(callback, 16);
    };
  }();

  // Timestamp shim with fallback
  var timeNow = tram.now = function () {
    // use high-res timer if available
    var perf = win.performance,
      perfNow = perf && (perf.now || perf.webkitNow || perf.msNow || perf.mozNow);
    if (perfNow && support.bind) return perfNow.bind(perf);
    // fallback to epoch-based timestamp
    return Date.now || function () {
        return +(new Date);
      };
  }();

  // --------------------------------------------------
  // Transition class - public API returned from the tram() wrapper.

  var Transition = P(function(proto) {

    proto.init = function (el) {
      this.$el = jQuery(el);
      this.el = this.$el[0];
      this.props = {};
      this.queue = [];
      this.style = '';
      this.active = false;

      // store inherited transitions from css styles
      if (config.keepInherited && !config.fallback) {
        var upstream = getStyle(this.el, 'transition');
        if (upstream && !emptyTrans.test(upstream)) this.upstream = upstream;
      }

      // hide backface if supported, for better perf
      if (support.backface && config.hideBackface) {
        setStyle(this.el, support.backface.css, 'hidden');
      }
    };

    // Public chainable methods
    chain('add', add);
    chain('start', start);
    chain('wait', wait);
    chain('then', then);
    chain('next', next);
    chain('stop', stop);
    chain('set', set);
    chain('show', show);
    chain('hide', hide);
    chain('redraw', redraw);
    chain('destroy', destroy);

    // Public add() - chainable
    function add(transition, options) {
      // Parse transition settings
      var settings = compact(('' + transition).split(space));
      var name = settings[0];
      options = options || {};

      // Get property definition from map
      var definition = propertyMap[name];
      if (!definition) return warn('Unsupported property: ' + name);

      // Ignore weak property additions
      if (options.weak && this.props[name]) return;

      // Init property instance
      var Class = definition[0];
      var prop = this.props[name];
      if (!prop) prop = this.props[name] = new Class.Bare();
      // Init settings + type + options
      prop.init(this.$el, settings, definition, options);
      return prop; // return for internal use
    }

    // Public start() - chainable
    function start(options, fromQueue, queueArgs) {
      if (!options) return;
      var optionType = typeof options;

      // Clear queue unless start was called from it
      if (!fromQueue) {
        this.timer && this.timer.destroy();
        this.queue = [];
        this.active = false;
      }

      // If options is a number, wait for a delay and continue queue.
      if (optionType == 'number' && fromQueue) {
        this.timer = new Delay({ duration: options, context: this, complete: next });
        this.active = true;
        return;
      }

      // If options is a string, invoke add() to modify transition settings
      if (optionType == 'string' && fromQueue) {
        switch (options) {
          case 'hide': hide.call(this); break;
          case 'stop': stop.call(this); break;
          case 'redraw': redraw.call(this); break;
          default: add.call(this, options, (queueArgs && queueArgs[1]));
        }
        return next.call(this);
      }

      // If options is a function, invoke it.
      if (optionType == 'function') {
        options.call(this, this);
        return;
      }

      // If options is an object, start property tweens.
      if (optionType == 'object') {

        // loop through each valid property
        var timespan = 0;
        eachProp.call(this, options, function (prop, value) {
          // determine the longest time span (duration + delay)
          if (prop.span > timespan) timespan = prop.span;
          // stop current, then begin animation
          prop.stop();
          prop.animate(value);
        }, function (extras) {
          // look for wait property and use it to override timespan
          if ('wait' in extras) timespan = validTime(extras.wait, 0);
        });
        // update main transition styles for active props
        updateStyles.call(this);

        // start timer for total transition timespan
        if (timespan > 0) {
          this.timer = new Delay({ duration: timespan, context: this });
          this.active = true;
          if (fromQueue) this.timer.complete = next;
        }
        // apply deferred styles after a single frame delay
        var self = this, found = false, styles = {};
        enterFrame(function () {
          eachProp.call(self, options, function (prop) {
            if (!prop.active) return;
            found = true;
            styles[prop.name] = prop.nextStyle;
          });
          found && self.$el.css(styles); // set styles object
        });
      }
    }

    // Public wait() - chainable
    function wait(time) {
      time = validTime(time, 0);
      // if start() has ocurred, simply push wait into queue
      if (this.active) {
        this.queue.push({ options: time });
      } else {
        // otherwise, start a timer. wait() is starting the sequence.
        this.timer = new Delay({ duration: time, context: this, complete: next });
        this.active = true;
      }
    }

    // Public then() - chainable
    function then(options) {
      if (!this.active) {
        return warn('No active transition timer. Use start() or wait() before then().');
      }
      // push options into queue
      this.queue.push({ options: options, args: arguments });
      // set timer complete callback
      this.timer.complete = next;
    }

    // Public next() - chainable
    function next() {
      // stop current timer in case next() was called early
      this.timer && this.timer.destroy();
      this.active = false;
      // if the queue is empty do nothing
      if (!this.queue.length) return;
      // start next item in queue
      var queued = this.queue.shift();
      start.call(this, queued.options, true, queued.args);
    }

    // Public stop() - chainable
    function stop(options) {
      this.timer && this.timer.destroy();
      this.queue = [];
      this.active = false;
      var values;
      if (typeof options == 'string') {
        values = {};
        values[options] = 1;
      } else if (typeof options == 'object' && options != null) {
        values = options;
      } else {
        values = this.props;
      }
      eachProp.call(this, values, stopProp);
      updateStyles.call(this);
    }

    // Public set() - chainable
    function set(values) {
      stop.call(this, values);
      eachProp.call(this, values, setProp, setExtras);
    }

    // Public show() - chainable
    function show(display) {
      // Show an element by setting its display
      if (typeof display != 'string') display = 'block';
      this.el.style.display = display;
    }

    // Public hide() - chainable
    function hide() {
      // Stop all transitions before hiding the element
      stop.call(this);
      this.el.style.display = 'none';
    }

    // Public redraw() - chainable
    function redraw() {
      this.el.offsetHeight;
    }

    // Public destroy() - chainable
    function destroy() {
      stop.call(this);
      jQuery.removeData(this.el, dataKey);
      this.$el = this.el = null;
    }

    // Update transition styles
    function updateStyles() {
      // build transition string from active props
      var p, prop, result = [];
      if (this.upstream) result.push(this.upstream);
      for (p in this.props) {
        prop = this.props[p];
        if (!prop.active) continue;
        result.push(prop.string);
      }
      // set transition style property on dom element
      result = result.join(',');
      if (this.style === result) return;
      this.style = result;
      this.el.style[support.transition.dom] = result;
    }

    // Loop through valid properties, auto-create them, and run iterator callback
    function eachProp(collection, iterator, ejector) {
      // skip auto-add during stop()
      var autoAdd = iterator !== stopProp;
      var name;
      var prop;
      var value;
      var matches = {};
      var extras;
      // find valid properties in collection
      for (name in collection) {
        value = collection[name];
        // match transform sub-properties
        if (name in transformMap) {
          if (!matches.transform) matches.transform = {};
          matches.transform[name] = value;
          continue;
        }
        // convert camelCase to dashed
        if (capsRegex.test(name)) name = toDashed(name);
        // match base properties
        if (name in propertyMap) {
          matches[name] = value;
          continue;
        }
        // otherwise, add property to extras
        if (!extras) extras = {};
        extras[name] = value;
      }
      // iterate on each matched property, auto-adding them
      for (name in matches) {
        value = matches[name];
        prop = this.props[name];
        if (!prop) {
          // skip auto-add during stop()
          if (!autoAdd) continue;
          // auto-add property instances
          prop = add.call(this, name);
        }
        // iterate on each property
        iterator.call(this, prop, value);
      }
      // finally, eject the extras into space
      if (ejector && extras) ejector.call(this, extras);
    }

    // Loop iterators
    function stopProp(prop) { prop.stop(); }
    function setProp(prop, value) { prop.set(value); }
    function setExtras(extras) { this.$el.css(extras); }

    // Define a chainable method that takes children into account
    function chain(name, method) {
      proto[name] = function () {
        if (this.children) return eachChild.call(this, method, arguments);
        this.el && method.apply(this, arguments);
        return this;
      };
    }

    // Iterate through children and apply the method, return for chaining
    function eachChild(method, args) {
      var i, count = this.children.length;
      for (i = 0; i < count; i++) {
        method.apply(this.children[i], args);
      }
      return this;
    }
  });

  // Tram class - extends Transition + wraps child instances for chaining.
  var Tram = P(Transition, function (proto) {

    proto.init = function (element, options) {
      var $elems = jQuery(element);

      // Invalid selector, do nothing.
      if (!$elems.length) return this;

      // Single case - return single Transition instance
      if ($elems.length === 1) return factory($elems[0], options);

      // Store multiple instances for chaining
      var children = [];
      $elems.each(function (index, el) {
        children.push(factory(el, options));
      });
      this.children = children;
      return this;
    };

    // Retrieve instance from data or create a new one.
    function factory(el, options) {
      var t = jQuery.data(el, dataKey) || jQuery.data(el, dataKey, new Transition.Bare());
      if (!t.el) t.init(el);
      if (options) return t.start(options);
      return t;
    }
  });

  // --------------------------------------------------
  // Property class - get/set property values

  var Property = P(function (proto) {

    var defaults = {
      duration: 500
      , ease: 'ease'
      , delay: 0
    };

    proto.init = function ($el, settings, definition, options) {
      // Initialize or extend settings
      this.$el = $el;
      this.el = $el[0];
      var name = settings[0];
      if (definition[2]) name = definition[2]; // expand name
      if (prefixed[name]) name = prefixed[name];
      this.name = name;
      this.type = definition[1];
      this.duration = validTime(settings[1], this.duration, defaults.duration);
      this.ease = validEase(settings[2], this.ease, defaults.ease);
      this.delay = validTime(settings[3], this.delay, defaults.delay);
      this.span = this.duration + this.delay;
      this.active = false;
      this.nextStyle = null;
      this.auto = allowAuto.test(this.name);
      this.unit = options.unit || this.unit || config.defaultUnit;
      this.angle = options.angle || this.angle || config.defaultAngle;
      // Animate using tween fallback if necessary, otherwise use transition.
      if (config.fallback || options.fallback) {
        this.animate = this.fallback;
      } else {
        this.animate = this.transition;
        this.string = this.name + space + this.duration + 'ms' +
          (this.ease != 'ease' ? space + easing[this.ease][0] : '') +
          (this.delay ? space + this.delay + 'ms' : '');
      }
    };

    // Set value immediately
    proto.set = function (value) {
      value = this.convert(value, this.type);
      this.update(value);
      this.redraw();
    };

    // CSS transition
    proto.transition = function (value) {
      // set new value to start transition
      this.active = true;
      value = this.convert(value, this.type);
      if (this.auto) {
        // when transitioning from 'auto', we must reset to computed
        if (this.el.style[this.name] == 'auto') {
          this.update(this.get());
          this.redraw();
        }
        if (value == 'auto') value = getAuto.call(this);
      }
      this.nextStyle = value;
    };

    // Fallback tweening
    proto.fallback = function (value) {
      var from = this.el.style[this.name] || this.convert(this.get(), this.type);
      value = this.convert(value, this.type);
      if (this.auto) {
        if (from == 'auto') from = this.convert(this.get(), this.type);
        if (value == 'auto') value = getAuto.call(this);
      }
      this.tween = new Tween({
        from: from
        , to: value
        , duration: this.duration
        , delay: this.delay
        , ease: this.ease
        , update: this.update
        , context: this
      });
    };

    // Get current element style
    proto.get = function () {
      return getStyle(this.el, this.name);
    };

    // Update element style value
    proto.update = function (value) {
      setStyle(this.el, this.name, value);
    };

    // Stop animation
    proto.stop = function () {
      // Stop CSS transition
      if (this.active || this.nextStyle) {
        this.active = false;
        this.nextStyle = null;
        setStyle(this.el, this.name, this.get());
      }
      // Stop fallback tween
      var tween = this.tween;
      if (tween && tween.context) tween.destroy();
    };

    // Convert value to expected type
    proto.convert = function (value, type) {
      if (value == 'auto' && this.auto) return value;
      var warnType
        , number = typeof value == 'number'
        , string = typeof value == 'string'
        ;
      switch(type) {
        case typeNumber:
          if (number) return value;
          if (string && value.replace(unitRegex, '') === '') return +value;
          warnType = 'number(unitless)';
          break;
        case typeColor:
          if (string) {
            if (value === '' && this.original) {
              return this.original;
            }
            if (type.test(value)) {
              if (value.charAt(0) == '#' && value.length == 7) return value;
              return cssToHex(value);
            }
          }
          warnType = 'hex or rgb string';
          break;
        case typeLength:
          if (number) return value + this.unit;
          if (string && type.test(value)) return value;
          warnType = 'number(px) or string(unit)';
          break;
        case typeLenPerc:
          if (number) return value + this.unit;
          if (string && type.test(value)) return value;
          warnType = 'number(px) or string(unit or %)';
          break;
        case typeAngle:
          if (number) return value + this.angle;
          if (string && type.test(value)) return value;
          warnType = 'number(deg) or string(angle)';
          break;
        case typeFancy:
          if (number) return value;
          if (string && typeLenPerc.test(value)) return value;
          warnType = 'number(unitless) or string(unit or %)';
          break;
      }
      // Type must be invalid, warn people.
      typeWarning(warnType, value);
      return value;
    };

    proto.redraw = function () {
      this.el.offsetHeight;
    };

    // Calculate expected value for animating towards 'auto'
    function getAuto() {
      var oldVal = this.get();
      this.update('auto');
      var newVal = this.get();
      this.update(oldVal);
      return newVal;
    }

    // Make sure ease exists
    function validEase(ease, current, safe) {
      if (current !== undefined) safe = current;
      return ease in easing ? ease : safe;
    }

    // Convert rgb and short hex to long hex
    function cssToHex(c) {
      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
      return (m ? rgbToHex(m[1], m[2], m[3]) : c)
        .replace(/#(\w)(\w)(\w)$/, '#$1$1$2$2$3$3');
    }
  });

  // --------------------------------------------------
  // Color prop

  var Color = P(Property, function (proto, supr) {

    proto.init = function () {
      supr.init.apply(this, arguments);

      // Store original computed value to allow tweening to ''
      if (this.original) return;
      this.original = this.convert(this.get(), typeColor);
    };
  });

  // --------------------------------------------------
  // Scroll prop

  var Scroll = P(Property, function (proto, supr) {

    proto.init = function () {
      supr.init.apply(this, arguments);
      this.animate = this.fallback;
    };

    proto.get = function () {
      return this.$el[this.name]();
    };

    proto.update = function (value) {
      this.$el[this.name](value);
    };
  });

  // --------------------------------------------------
  // Transform prop w/ sub-properties

  var Transform = P(Property, function (proto, supr) {

    proto.init = function () {
      supr.init.apply(this, arguments);

      // If a current state exists, return here
      if (this.current) return;

      // Store transform state
      this.current = {};

      // Set default perspective, if specified
      if (transformMap.perspective && config.perspective) {
        this.current.perspective = config.perspective;
        setStyle(this.el, this.name, this.style(this.current));
        this.redraw();
      }
    };

    proto.set = function (props) {
      // convert new props and store current values
      convertEach.call(this, props, function (name, value) {
        this.current[name] = value;
      });

      // set element style immediately
      setStyle(this.el, this.name, this.style(this.current));
      this.redraw();
    };

    proto.transition = function (props) {
      // convert new prop values and set defaults
      var values = this.values(props);

      // create MultiTween to track values over time
      this.tween = new MultiTween({
        current: this.current
        , values: values
        , duration: this.duration
        , delay: this.delay
        , ease: this.ease
      });

      // build temp object for final transition values
      var p, temp = {};
      for (p in this.current) {
        temp[p] = p in values ? values[p] : this.current[p];
      }

      // set new value to start transition
      this.active = true;
      this.nextStyle = this.style(temp);
    };

    proto.fallback = function (props) {
      // convert new prop values and set defaults
      var values = this.values(props);

      // create MultiTween to track values over time
      this.tween = new MultiTween({
        current: this.current
        , values: values
        , duration: this.duration
        , delay: this.delay
        , ease: this.ease
        , update: this.update
        , context: this
      });
    };

    // Update current values (called from MultiTween)
    proto.update = function () {
      setStyle(this.el, this.name, this.style(this.current));
    };

    // Get combined style string from props
    proto.style = function (props) {
      var p, out = '';
      for (p in props) {
        out += p + '(' + props[p] + ') ';
      }
      return out;
    };

    // Build values object and set defaults
    proto.values = function (props) {
      var values = {}, def;
      convertEach.call(this, props, function (name, value, type) {
        values[name] = value;
        // set default value if current property does not exist
        if (this.current[name] === undefined) {
          def = 0; // default prop value
          if (~name.indexOf('scale')) def = 1;
          this.current[name] = this.convert(def, type);
        }
      });
      return values;
    };

    // Loop through each prop and output name + converted value
    function convertEach(props, iterator) {
      var p, name, type, definition, value;
      for (p in props) {
        definition = transformMap[p];
        type = definition[0];
        name = definition[1] || p;
        value = this.convert(props[p], type);
        iterator.call(this, name, value, type);
      }
    }
  });

  // --------------------------------------------------
  // Tween class - tweens values over time, based on frame timers.

  var Tween = P(function (proto) {

    // Private vars
    var defaults = {
      ease: easing.ease[1]
      , from: 0
      , to: 1
    };

    proto.init = function (options) {
      // Init timing props
      this.duration = options.duration || 0;
      this.delay = options.delay || 0;

      // Use ease function or key value from easing map
      var ease = options.ease || defaults.ease;
      if (easing[ease]) ease = easing[ease][1];
      if (typeof ease != 'function') ease = defaults.ease;
      this.ease = ease;

      this.update = options.update || noop;
      this.complete = options.complete || noop;
      this.context = options.context || this;
      this.name = options.name;

      // Format value and determine units
      var from = options.from;
      var to = options.to;
      if (from === undefined) from = defaults.from;
      if (to === undefined) to = defaults.to;
      this.unit = options.unit || '';
      if (typeof from == 'number' && typeof to == 'number') {
        this.begin = from;
        this.change = to - from;
      } else {
        this.format(to, from);
      }
      // Store value + unit in case it's accessed before delay is up
      this.value = this.begin + this.unit;

      // Set start time for all Tween instances
      this.start = timeNow();

      // Start tween (unless autoplay disabled)
      if (options.autoplay !== false) {
        this.play();
      }
    };

    proto.play = function () {
      if (this.active) return;
      if (!this.start) this.start = timeNow();
      this.active = true;
      addRender(this);
    };

    proto.stop = function () {
      if (!this.active) return;
      this.active = false;
      removeRender(this);
    };

    proto.render = function (now) {
      var value, delta = now - this.start;
      // skip render during delay
      if (this.delay) {
        if (delta <= this.delay) return;
        // after delay, reduce delta
        delta -= this.delay;
      }
      if (delta < this.duration) {
        // calculate eased position
        var position = this.ease(delta, 0, 1, this.duration);
        value = this.startRGB ? interpolate(this.startRGB, this.endRGB, position)
          : round(this.begin + (position * this.change));
        this.value = value + this.unit;
        this.update.call(this.context, this.value);
        return;
      }
      // we're done, set final value and destroy
      value = this.endHex || this.begin + this.change;
      this.value = value + this.unit;
      this.update.call(this.context, this.value);
      this.complete.call(this.context);
      this.destroy();
    };

    // Format string values for tween
    proto.format = function (to, from) {
      // cast strings
      from += '';
      to += '';
      // hex colors
      if (to.charAt(0) == '#') {
        this.startRGB = hexToRgb(from);
        this.endRGB = hexToRgb(to);
        this.endHex = to;
        this.begin = 0;
        this.change = 1;
        return;
      }
      // determine unit suffix
      if (!this.unit) {
        var fromUnit = from.replace(unitRegex, '');
        var toUnit = to.replace(unitRegex, '');
        if (fromUnit !== toUnit) unitWarning('tween', from, to);
        this.unit = fromUnit;
      }
      from = parseFloat(from);
      to = parseFloat(to);
      this.begin = this.value = from;
      this.change = to - from;
    };

    // Clean up for garbage collection
    proto.destroy = function () {
      this.stop();
      this.context = null;
      this.ease = this.update = this.complete = noop;
    };

    // Add a tween to the render list
    var tweenList = [];
    function addRender(tween) {
      // if this is the first item, start the render loop
      if (tweenList.push(tween) === 1) enterFrame(renderLoop);
    }

    // Loop through all tweens on each frame
    function renderLoop() {
      var i, now, tween, count = tweenList.length;
      if (!count) return;
      enterFrame(renderLoop);
      now = timeNow();
      for (i = count; i--;) {
        tween = tweenList[i];
        tween && tween.render(now);
      }
    }

    // Remove tween from render list
    function removeRender(tween) {
      var rest, index = jQuery.inArray(tween, tweenList);
      if (index >= 0) {
        rest = tweenList.slice(index + 1);
        tweenList.length = index;
        if (rest.length) tweenList = tweenList.concat(rest);
      }
    }

    // Round number to limit decimals
    var factor = 1000;
    function round(value) {
      return Math.round(value * factor) / factor;
    }

    // Interpolate rgb colors based on `position`, returns hex string
    function interpolate(start, end, position) {
      return rgbToHex(
        start[0] + position * (end[0] - start[0]),
        start[1] + position * (end[1] - start[1]),
        start[2] + position * (end[2] - start[2])
      );
    }
  });

  // Delay - simple delay timer that hooks into frame loop
  var Delay = P(Tween, function (proto) {

    proto.init = function (options) {
      this.duration = options.duration || 0;
      this.complete = options.complete || noop;
      this.context = options.context;
      this.play();
    };

    proto.render = function (now) {
      var delta = now - this.start;
      if (delta < this.duration) return;
      this.complete.call(this.context);
      this.destroy();
    };
  });

  // MultiTween - tween multiple properties on a single frame loop
  var MultiTween = P(Tween, function (proto, supr) {

    proto.init = function (options) {
      // configure basic options
      this.context = options.context;
      this.update = options.update;

      // create child tweens for each changed property
      this.tweens = [];
      this.current = options.current; // store direct reference
      var name, value;
      for (name in options.values) {
        value = options.values[name];
        if (this.current[name] === value) continue;
        this.tweens.push(new Tween({
          name: name
          , from: this.current[name]
          , to: value
          , duration: options.duration
          , delay: options.delay
          , ease: options.ease
          , autoplay: false
        }));
      }
      // begin MultiTween render
      this.play();
    };

    proto.render = function (now) {
      // render each child tween
      var i, tween, count = this.tweens.length;
      var alive = false;
      for (i = count; i--;) {
        tween = this.tweens[i];
        if (tween.context) {
          tween.render(now);
          // store current value directly on object
          this.current[tween.name] = tween.value;
          alive = true;
        }
      }
      // destroy and stop render if no longer alive
      if (!alive) return this.destroy();

      // call update method
      this.update && this.update.call(this.context);
    };

    proto.destroy = function () {
      supr.destroy.call(this);
      if (!this.tweens) return;

      // Destroy all child tweens
      var i, count = this.tweens.length;
      for (i = count; i--;) {
        this.tweens[i].destroy();
      }
      this.tweens = null;
      this.current = null;
    };
  });

  // --------------------------------------------------
  // Main wrapper - returns a Tram instance with public chaining API.

  function tram(element, options) {
    // Chain on the result of Tram.init() to optimize single case.
    var wrap = new Tram.Bare();
    return wrap.init(element, options);
  }

  // Global tram config
  var config = tram.config = {
    debug: false // debug mode with console warnings
    , defaultUnit: 'px' // default unit added to <length> types
    , defaultAngle: 'deg' // default unit added to <angle> types
    , keepInherited: false // optionally keep inherited CSS transitions
    , hideBackface: false // optionally hide backface on all elements
    , perspective: '' // optional default perspective value e.g. '1000px'
    , fallback: !support.transition // boolean to globally set fallback mode
    , agentTests: [] // array of userAgent test strings for sniffing
  };

  // fallback() static - browser sniff to force fallback mode
  //  Example: tram.fallback('firefox');
  //  Would match Firefox along with previously sniffed browsers.
  tram.fallback = function (testString) {
    // if no transition support, fallback is always true
    if (!support.transition) return config.fallback = true;
    config.agentTests.push('(' + testString + ')');
    var pattern = new RegExp(config.agentTests.join('|'), 'i');
    config.fallback = pattern.test(navigator.userAgent);
  };
  // Default sniffs for browsers that support transitions badly ;_;
  tram.fallback('6.0.[2-5] Safari');

  // tram.tween() static method
  tram.tween = function (options) {
    return new Tween(options);
  };

  // tram.delay() static method
  tram.delay = function (duration, callback, context) {
    return new Delay({ complete: callback, duration: duration, context: context });
  };

  // --------------------------------------------------
  // jQuery methods

  // jQuery plugin method, diverts chain to Tram object.
  jQuery.fn.tram = function (options) {
    return tram.call(null, this, options);
  };

  // Shortcuts for internal jQuery style getter / setter
  var setStyle = jQuery.style;
  var getStyle = jQuery.css;

  // --------------------------------------------------
  // Property maps + unit values

  // Prefixed property names
  var prefixed = {
    'transform': support.transform && support.transform.css
  };

  // Main Property map { name: [ Class, valueType, expand ]}
  var propertyMap = {
    'color'                : [ Color, typeColor ]
    , 'background'           : [ Color, typeColor, 'background-color' ]
    , 'outline-color'        : [ Color, typeColor ]
    , 'border-color'         : [ Color, typeColor ]
    , 'border-top-color'     : [ Color, typeColor ]
    , 'border-right-color'   : [ Color, typeColor ]
    , 'border-bottom-color'  : [ Color, typeColor ]
    , 'border-left-color'    : [ Color, typeColor ]
    , 'border-width'         : [ Property, typeLength ]
    , 'border-top-width'     : [ Property, typeLength ]
    , 'border-right-width'   : [ Property, typeLength ]
    , 'border-bottom-width'  : [ Property, typeLength ]
    , 'border-left-width'    : [ Property, typeLength ]
    , 'border-spacing'       : [ Property, typeLength ]
    , 'letter-spacing'       : [ Property, typeLength ]
    , 'margin'               : [ Property, typeLength ]
    , 'margin-top'           : [ Property, typeLength ]
    , 'margin-right'         : [ Property, typeLength ]
    , 'margin-bottom'        : [ Property, typeLength ]
    , 'margin-left'          : [ Property, typeLength ]
    , 'padding'              : [ Property, typeLength ]
    , 'padding-top'          : [ Property, typeLength ]
    , 'padding-right'        : [ Property, typeLength ]
    , 'padding-bottom'       : [ Property, typeLength ]
    , 'padding-left'         : [ Property, typeLength ]
    , 'outline-width'        : [ Property, typeLength ]
    , 'opacity'              : [ Property, typeNumber ]
    , 'top'                  : [ Property, typeLenPerc ]
    , 'right'                : [ Property, typeLenPerc ]
    , 'bottom'               : [ Property, typeLenPerc ]
    , 'left'                 : [ Property, typeLenPerc ]
    , 'font-size'            : [ Property, typeLenPerc ]
    , 'text-indent'          : [ Property, typeLenPerc ]
    , 'word-spacing'         : [ Property, typeLenPerc ]
    , 'width'                : [ Property, typeLenPerc ]
    , 'min-width'            : [ Property, typeLenPerc ]
    , 'max-width'            : [ Property, typeLenPerc ]
    , 'height'               : [ Property, typeLenPerc ]
    , 'min-height'           : [ Property, typeLenPerc ]
    , 'max-height'           : [ Property, typeLenPerc ]
    , 'line-height'          : [ Property, typeFancy ]
    , 'scroll-top'           : [ Scroll, typeNumber, 'scrollTop' ]
    , 'scroll-left'          : [ Scroll, typeNumber, 'scrollLeft' ]
    // , 'background-position'  : [ Property, typeLenPerc ]
  };

  // Transform property maps
  var transformMap = {};

  if (support.transform) {
    // Add base properties if supported
    propertyMap['transform'] = [ Transform ];
    // propertyMap['transform-origin'] = [ Transform ];

    // Transform sub-property map { name: [ valueType, expand ]}
    transformMap = {
      x:            [ typeLenPerc, 'translateX' ]
      , y:            [ typeLenPerc, 'translateY' ]
      , rotate:       [ typeAngle ]
      , rotateX:      [ typeAngle ]
      , rotateY:      [ typeAngle ]
      , scale:        [ typeNumber ]
      , scaleX:       [ typeNumber ]
      , scaleY:       [ typeNumber ]
      , skew:         [ typeAngle ]
      , skewX:        [ typeAngle ]
      , skewY:        [ typeAngle ]
    };
  }

  // Add 3D transform props if supported
  if (support.transform && support.backface) {
    transformMap.z           = [ typeLenPerc, 'translateZ' ];
    transformMap.rotateZ     = [ typeAngle ];
    transformMap.scaleZ      = [ typeNumber ];
    transformMap.perspective = [ typeLength ];
  }

  // --------------------------------------------------
  // Utils

  function toDashed(string) {
    return string.replace(/[A-Z]/g, function (letter) {
      return '-' + letter.toLowerCase();
    });
  }

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    return [r,g,b];
  }

  function rgbToHex(r, g, b) {
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }

  function noop() {}

  function typeWarning(exp, val) {
    warn('Type warning: Expected: [' + exp + '] Got: [' + typeof val + '] ' + val);
  }

  function unitWarning(name, from, to) {
    warn('Units do not match [' + name + ']: ' + from + ', ' + to);
  }

  // Normalize time values
  var milli = /ms/, seconds = /s|\./;
  function validTime(string, current, safe) {
    if (current !== undefined) safe = current;
    if (string === undefined) return safe;
    var n = safe;
    // if string contains 'ms' or contains no suffix
    if (milli.test(string) || !seconds.test(string)) {
      n = parseInt(string, 10);
      // otherwise if string contains 's' or a decimal point
    } else if (seconds.test(string)) {
      n = parseFloat(string) * 1000;
    }
    if (n < 0) n = 0; // no negative times
    return n === n ? n : safe; // protect from NaNs
  }

  // Log warning message if supported
  function warn(msg) {
    config.debug && window && window.console.warn(msg);
  }

  // Lo-Dash compact()
  // MIT license <http://lodash.com/license>
  // Creates an array with all falsey values of `array` removed
  function compact(array) {
    var index = -1,
      length = array ? array.length : 0,
      result = [];

    while (++index < length) {
      var value = array[index];
      if (value) {
        result.push(value);
      }
    }
    return result;
  }

  // --------------------------------------------------
  // Export public module.
  return jQuery.tram = tram;

}(window.jQuery));








const BREAKPOINTS = {
	tablet: 640,
	pc: 960,
	max: 1340
};

const BOARD = {
	NO_ITEM: '등록된 글이 없습니다.',
	RETRY_LATER: '잠시 후 다시 시도해주세요.'
};

let getLoadingBarTpl = function () {
	return '<div class="loadingbar"></div>';
};



class Navi {
	constructor(options) {
		if (!options) return;

		const _ = this;

		_.btns = options.btns || [];

		_.mouseoverCallback = options.mouseoverCallback || null;
		_.mouseoutCallback = options.mouseoutCallback || null;
		_.mousedownCallback = options.mousedownCallback || null;
		_.mouseupCallback = options.mouseupCallback || null;
		_.clickCallback = options.clickCallback || null;
		_.activateCallback = options.activateCallback || null;

		_.currentIndex = 0;
		_.activateIndex = 0;

		_.proxy = {
			mouseoverBtnEventHandler: null,
			mouseoutBtnEventHandler: null,
			mousedownBtnEventHandler: null,
			mouseupBtnEventHandler: null,
			clickBtnEventHandler: null
		};
	}

	init(obj) {
		const _ = this;

		_.proxy = {
			mouseoverBtnEventHandler: $.proxy(_.mouseoverBtnEventHandler, _),
			mouseoutBtnEventHandler: $.proxy(_.mouseoutBtnEventHandler, _),
			mousedownBtnEventHandler: $.proxy(_.mousedownBtnEventHandler, _),
			mouseupBtnEventHandler: $.proxy(_.mouseupBtnEventHandler, _),
			clickBtnEventHandler: $.proxy(_.clickBtnEventHandler, _)
		};

		_.setBtnsEventHandler(true);

		return _;
	}

	setBtnsEventHandler(flag) {
		const _ = this;

		if (flag) {
			for (let i = 0, max = _.btns.length; i < max; i++) {
				$(_.btns.get(i))
					.on('mouseover.ui.navi', _.proxy.mouseoverBtnEventHandler)
					.on('mouseout.ui.navi', _.proxy.mouseoutBtnEventHandler)
					.on('mousedown.ui.navi', _.proxy.mousedownBtnEventHandler)
					.on('mouseup.ui.navi', _.proxy.mouseupBtnEventHandler)
					.on('click.ui.navi', _.proxy.clickBtnEventHandler);
			}
		} else {
			for (let i = 0, max = _.btns.length; i < max; i++) {
				$(_.btns.get(i))
					.off('mouseover.ui.navi', _.proxy.mouseoverBtnEventHandler)
					.off('mouseout.ui.navi', _.proxy.mouseoutBtnEventHandler)
					.off('mousedown.ui.navi', _.proxy.mousedownBtnEventHandler)
					.off('mouseup.ui.navi', _.proxy.mouseupBtnEventHandler)
					.off('click.ui.navi', _.proxy.clickBtnEventHandler);
				}
			}

			return _;
		}

	mouseoverBtnEventHandler(evt) {
		evt.preventDefault();

		const _ = this,
		btn = evt.currentTarget;

		_.currentIndex = $(_.btns).index(btn) + 1;

		if (_.mouseoverCallback) {
			_.mouseoverCallback.call(null, {
				event: evt,
				btn: btn,
				index: _.currentIndex
			});
		}
	}

	mouseoutBtnEventHandler(evt) {
		evt.preventDefault();

		const _ = this,
		btn = evt.currentTarget;

		if (_.mouseoutCallback) {
			_.mouseoutCallback.call(null, {
				event: evt,
				btn: btn,
				index: $(_.btns).index(btn) + 1
			});
		}
	}

	mousedownBtnEventHandler(evt) {
		evt.preventDefault();

		const _ = this,
		btn = evt.currentTarget;

		if (_.mousedownCallback) {
			_.mousedownCallback.call(null, {
				event: evt,
				btn: btn,
				index: $(_.btns).index(btn) + 1
			});
		}
	}

	mouseupBtnEventHandler(evt) {
		evt.preventDefault();

		const _ = this,
		btn = evt.currentTarget;

		if (_.mouseupCallback) {
			_.mouseupCallback.call(null, {
				event: evt,
				btn: btn,
				index: $(_.btns).index(btn) + 1
			});
		}
	}

	clickBtnEventHandler(evt) {
		evt.preventDefault();

		const _ = this,
		btn = evt.currentTarget,
		prevIndex = _.activateIndex,
		idx = $(_.btns).index(btn) + 1;

		if (_.clickCallback) {
			 _.clickCallback.call(null, {
				event: evt,
				btn: btn,
				prevIndex: prevIndex,
				index: idx
			});
		}

		if (_.activateCallback) {
			_.activateCallback.call(null, {
				prevIndex: prevIndex,
				index: idx
			})
		}

		_.currentIndex = _.activateIndex = idx;
	}

	/*
	 * public methods
	 */
	getBtns() {
		return this.btns;
	}

	getBtn(index) {
		let idx = index - 1;
		if (idx < 0 || idx >= this.btns.length) return null;

		return $( $(this.btns).get(idx) );
	}

	getActivatedIndex() {
		return this.activateIndex;
	}

	activate(index) {
		const _ = this,
		idx = (index <= 0 || index > _.btns.length) ? 0 : index;

		if (_.activateCallback) {
			_.activateCallback.call(null, {
				prevIndex: _.activateIndex,
				index: idx
			});
		}

		_.activateIndex = idx;

		return _;
	}

	destroy(obj) {
		const _ = this;

		_.setBtnsEventHandler(false);

		_.btns = [];

		_.mouseoverCallback = null;
		_.mouseoutCallback = null;
		_.clickCallback = null;
		_.activateCallback = null;

		_.currentIndex = 0;
		_.activateIndex = 0;

		return _;
	}
}




class HorizontalSlideNavi extends Navi {
	constructor(options) {
		if (!options) return;

		let opt = {
			/*
			// Navi.js options
			btns,
			mouseoverCallback,
			mouseoutCallback,
			mousedownCallback,
			mouseupCallback,
			clickCallback,
			activateCallback,
			*/

			Dragdealer: null,

			wrap: null,
			handleClass: '',
			btnsWrap: null,

			disabled: false,
			slide: true,
			loose: true,
			speed: 0.25,
			css3: true,

			dragStartCallback: null,
			dragStopCallback: null,
			slideEndCallback: null,

			global: window
		};
		$.extend(true, opt, options);

		opt.Dragdealer = (opt.Dragdealer) ? opt.Dragdealer : opt.global.Dragdealer;
		if (!opt.Dragdealer) {
			// https://github.com/skidding/dragdealer
			throw new Error('HorizontalSlideNavi.js require Dragdealer.js Library.');
		}

		super(opt);

		let _ = this;

		_.option = opt;

		_.isDraggable = false;

		_.dragDealer = null;

		$.extend(true, _.proxy, {
			resizeEventHandler: null
		});
	}

	init(obj) {
		super.init(obj);

		const _ = this;

		_.proxy.resizeEventHandler = $.proxy(_.resize, _);

		_.setInstance();

		_.setResizeEventHandler(true);
		_.resize();

		return _;
	}

	setInstance() {
		const _ = this,
		opt = _.option;

		_.dragDealer = new opt.Dragdealer($(opt.wrap).get(0), {
			handleClass: opt.handleClass,
			disabled: opt.disabled,
			horizontal: true,
			vertical: false,
			slide: opt.slide,
			loose: opt.loose,
			speed: opt.speed,
			css3: opt.css3,

			dragStartCallback: opt.dragStartCallback,
			dragStopCallback: opt.dragStopCallback,
			callback: opt.slideEndCallback
		});

		return _;
	}

	setResizeEventHandler(flag) {
		const _ = this,
		global = $(_.option.global);

		if (flag) {
			global.on('resize.ui.horizontalslidenavi', _.proxy.resizeEventHandler);
		} else {
			global.off('resize.ui.horizontalslidenavi', _.proxy.resizeEventHandler);
		}

		return _;
	}

	resize(evt) {
		const _ = this;

		if (!_.dragDealer) return;

		let opt = _.option;

		if ($(_.getHandle()).outerWidth() > $(opt.wrap).width()) {
			// console.log('can scroll');

			_.dragDealer.enable();
			_.isDraggable = true;

		} else {
			// console.log('can not scroll');

			if (!_.dragDealer.disabled) _.dragDealer.disable();
			_.setRatioX(0);
			_.isDraggable = false;
		}

		return _;
	}

	/*
	 * public methods
	 */
	// getBtns(), getBtn(index), getActivatedIndex(), activate(index) method from Navi.js

	getRatioX() {
		let offset = this.dragDealer.getValue();
		return offset[0];
	}

	getOffsetRatioByPosition(x) {
		return this.dragDealer.getRatiosByOffsets([x, 0]); // return [0, 0];
	}

	getHandle() {
		return this.dragDealer.handle;
	}

	setX(x) {
		let offset = this.getOffsetRatioByPosition(x);
		this.dragDealer.setValue(offset[0], offset[1]);

		return this;
	}

	setRatioX(ratioX) {
		this.dragDealer.setValue(ratioX, 0);
		return this;
	}

	isSlidable() {
		return this.isDraggable;
	}

	enable() {
		this.dragDealer.enable();
		return this;
	}

	disable() {
		this.dragDealer.disable();
		return this;
	}

	destroy(obj) {
		let _ = this;

		_.setResizeEventHandler(false);

		_.$proxyResize = null;

		_.isDraggable = false;

		if (_.dragDealer) _.dragDealer.unbindEventListeners();
		_.dragDealer = null;

		super.destroy(obj);

		return _;
	}
}




class PageNoDisplay {
	constructor(options) {
		const _ = this;
		if (!options) return;

		_.options = $.extend({
			wrap: null
			}, options);

		_.wrap = null;

		_.currentNoWrap = null;
		_.totalNoWrap = null;
	}

	init() {
		const _ = this;

		_.setInstance();

		return _;
	}

	setInstance() {
		const _ = this;

		_.wrap = $(_.options.wrap);
		_.currentNoWrap = $('.current', _.wrap);
		_.totalNoWrap = $('.total', _.wrap);
	}

	setCurrentNo(index) {
		this.currentNoWrap.text(index);
		return this;
	}

	setTotalNo(index) {
		this.totalNoWrap.text(index);
		return this;
	}
}




class Pagination {
	constructor(options) {
		const _ = this;
		if (!options) return;

		_.option = $.extend(
			true, {
			wrap: null,
			breakpoint: BREAKPOINTS,
			isMobileEnv: false,
			global: window
			}, options);

		_.isMobileEnv = _.option.isMobileEnv;

		// import Dragdealer
		_.Dragdealer = Dragdealer;

		_.wrap = null;

		// mobile slideNavi
		_.slideNavi = null;
		_.slideNaviListItems = null;

		// pc navi
		_.desktopNavi = null;

		_.currentIndex = 1;
		_.currentResolution = '';

		_.global = _.option.global || window;

		// fix iPad Chrome resize, orientationchange delay bug
		_.subscribeResizeWindow$ = null;
	}

	init(obj) {
		const _ = this;

		_.wrap = $(_.option.wrap);

		if (_.wrap.length > 0) {
			_.currentResolution = getResolution(_.option.breakpoint, _.global);

			_.setInstance();
		}

		return _;
	}

	setInstance() {
		const _ = this;

		if (isMobileResolution(_.currentResolution)) {
			_.setSlideNavi();

			$('.btn-prev-mobile').on('click', (e)=>{
				let idx = _.currentIndex;
				idx = idx <= 1 ? 0 : idx - 1;

				$(_).trigger({
					type: Pagination.CLICK_PAGE_BTN,
					index: idx
				});
			});
      
			$('.btn-next-mobile').on('click', (e)=>{
				let idx = _.currentIndex;
				idx = idx > _.slideNavi.getBtns().length ? 0 : idx + 1;

				$(_).trigger({
					type: Pagination.CLICK_PAGE_BTN,
					index: idx
				});
			});
		} else {
			_.setDesktopNavi();
		}

		if (_.isMobileEnv) {
			// trigger mobile device browser resize delay
			_.subscribeResizeWindow$ = fromEvent(window, 'resize')
				.pipe(
					debounceTime(100),
					tap(evt => _.resize())
				)
				.subscribe();
		} else {
			$(_.global).on(
				'resize.ui.pagination orientationchange.ui.pagination',
				$.proxy(_.resize, _)
				);
		}

		_.resize();
	}

	setSlideNavi() {
		const _ = this;

		let slideNaviWrap = $('.pagination-mobile', _.wrap),
		btnsWrap = $('.btns', slideNaviWrap);

		// set list items width.
		_.slideNaviListItems = $('li', btnsWrap);
		_.setSlideNaviListItemsWidth(_.slideNaviListItems.length);

		// set slideNavi
		_.slideNavi = new HorizontalSlideNavi({
			Dragdealer: _.Dragdealer,

			// Navi.js options
			btns: $('li a', btnsWrap),

			clickCallback: function(obj) {
				const index = obj.index,
				activatedIndex = _.slideNavi.getActivatedIndex();
				if (index === activatedIndex) return;

				_.currentIndex = obj.index;

				$(_).trigger({
					type: Pagination.CLICK_PAGE_BTN,
					index: obj.index
				});
			},

			activateCallback: function(obj) {
				_.activateSlideNaviBtn(obj.index);
			},

			// HorizontalSlideNavi.js options
			wrap: slideNaviWrap,
			handleClass: 'handle',
			btnsWrap: btnsWrap
		});
		_.slideNavi.init();

		if (_.slideNaviListItems.length <= 2) _.slideNavi.disable();
	}

	setDesktopNavi() {
		const _ = this;

		_.desktopNavi = new DesktopPaginationNavi({
			wrap: $('.pagination-pc', _.wrap),

			clickCallback: function(obj) {
				console.log(_.currentIndex, obj)
				const index = obj.index,
				activatedIndex = _.desktopNavi.getActivatedIndex();
				if (index === activatedIndex) return;

				_.currentIndex = obj.index;

				$(_).trigger({
					type: Pagination.CLICK_PAGE_BTN,
					index: obj.index
				});
			},

			firstIndex: _.currentIndex,

			global: _.global
		});
		_.desktopNavi.init();

		$(_.desktopNavi).on(DesktopPaginationNavi.CLICK_PREVNEXT_BTN, function( evt ) {
			const index = evt.index,
			direction = evt.direction;

			_.desktopNavi.switchBtns(direction, index);

			$(_).trigger({
				type: Pagination.CLICK_PAGE_BTN,
				index: index
			});
		});
	}

	resize(evt) {
		const _ = this,
		breakpoint = _.option.breakpoint;

		if (breakpoint.max && _.global.innerWidth >= breakpoint.max) {
			if (_.slideNavi) {
				_.slideNavi.destroy();
				_.slideNavi = null;
			}

			if (!_.desktopNavi) _.setDesktopNavi();
			_.desktopNavi.activate(_.currentIndex);
		} else if (breakpoint.pc && _.global.innerWidth >= breakpoint.pc) {
			if (_.slideNavi) {
				_.slideNavi.destroy();
				_.slideNavi = null;
			}

			if (!_.desktopNavi) _.setDesktopNavi();
			_.desktopNavi.activate(_.currentIndex);
		} else if (breakpoint.tablet && _.global.innerWidth >= breakpoint.tablet) {
			if (_.desktopNavi) {
				_.desktopNavi.destroy();
				_.desktopNavi = null;
			}

			if (!_.slideNavi) _.setSlideNavi();
			_.slideNavi.activate(_.currentIndex);
			_.setSlidePositionByIndex(_.currentIndex);

			if (_.slideNaviListItems.length > 2) _.slideNavi.enable();
			_.setSlideNaviListItemsWidth(_.slideNaviListItems.length);
		} else {
			if (_.desktopNavi) {
				_.desktopNavi.destroy();
				_.desktopNavi = null;
			}

			if (!_.slideNavi) _.setSlideNavi();
			_.slideNavi.activate(_.currentIndex);
			_.setSlidePositionByIndex(_.currentIndex);

			_.slideNavi.disable();
			_.setSlideNaviListItemsWidth(_.slideNaviListItems.length);
		}
	}

	activateSlideNaviBtn(index) {
		const _ = this,
		btns = $(_.slideNavi.getBtns()),
		btn = $(_.slideNavi.getBtn(index));

		btns.removeClass('on');
		btn.addClass('on');
	}

	setSlidePositionByIndex(index) {
		const _ = this;
		if (!_.slideNavi) return;

		_.slideNavi.activate(index);

		if (index < 1 || index > _.slideNavi.getBtns().length) return;

		const prev = index <= 1 ? 0 : index - 1,
		next = index > _.slideNavi.getBtns().length ? 0 : index + 1;

		if (!prev) {
			// go to left end.
			_.slideNavi.setRatioX(0);
			return;
		}

		if (!next) {
			// go go right end.
			_.slideNavi.setRatioX(1);
			return;
		}

		const btn = $(_.slideNavi.getBtn(prev));
		if (btn.length) _.slideNavi.setX(-btn.position().left);
	}

	setSlideNaviListItemsWidth(itemLength) {
		const _ = this;
		if (_.slideNaviListItems.length)
			_.slideNaviListItems.width(_.getSlideNaviListItemWidth(itemLength));
	}

	getSlideNaviListItemWidth(itemLength) {
		const width = this.global.innerWidth;
		if (itemLength <= 1) return width;

		return width / 2;
	}

	/*
	 * public methods
	 */
	activate(index, direction) {
		const _ = this;

		if (_.slideNavi) {
			_.activateSlideNaviBtn(index);
			_.setSlidePositionByIndex(index);
		}

		if (_.desktopNavi) {
			if (direction) _.desktopNavi.switchBtns(direction, index);
			_.desktopNavi.activate(index);
		}

		_.currentIndex = index;
	}
}
Pagination.CLICK_PAGE_BTN = 'CLICK_PAGE_BTN';




class DesktopPaginationNavi {
	constructor(options) {
		const _ = this;
		if (!options) return;

		_.option = $.extend(true, {
			wrap: null,
			clickCallback: null,
			firstIndex: 1,
			global: window
			}, options);

		_.wrap = $(_.option.wrap);

		_.naviWrap = $('> .btns', _.wrap);

		_.navi = null;
		_.naviListItems = [];

		_.prevBtn = null;
		_.nextBtn = null;

		_.edgeBtnsIndex = {
			left: 0,
			right: 0
		};

		_.global = _.option.global || window;

		/*
		 * const
		 */
		_.DISPLAY_BTN_NUM = 4;

		_.DISABLE_PREVNEXT_BTN_INTERVAL = 500;
	}

	init() {
		this.setInstance();
	}

	setInstance() {
		const _ = this;

		if (_.wrap.length <= 0) return;

		// set list items width, position.
		_.naviListItems = $('li', _.naviWrap);

		// set left, right edge btn index.
		if (_.naviListItems.length > _.DISPLAY_BTN_NUM) {
			_.edgeBtnsIndex = {
				left: _.option.firstIndex,
				right: getLoopedLastIndex(_.naviListItems.length, _.DISPLAY_BTN_NUM, _.option.firstIndex)
			};
		}

		_.setNavi();
		_.setPrevNextBtn();
		_.arrangeNaviListItems();

		$(_.global).on('resize.ui.desktoppaginationnavi', $.proxy(_.resize, _));
		_.resize();
	}

	setNavi() {
		const _ = this;

		_.navi = new Navi({
			btns: $('.btns li a', _.wrap),

			clickCallback: function (obj) {
				if (_.option.clickCallback) _.option.clickCallback.call(null, obj);
			},

			activateCallback: function (obj) {
				_.activateNaviBtn(obj.index);
			}
		});
		_.navi.init();
	}

	setPrevNextBtn() {
		const _ = this;

		_.prevBtn = $('.btn-prev', _.wrap);
		_.nextBtn = $('.btn-next', _.wrap);

		if (_.naviListItems.length <= _.DISPLAY_BTN_NUM) {
			_.prevBtn.hide();
			_.nextBtn.hide();
		} else {
			_.prevBtn.show();
			_.nextBtn.show();
		}

		_.prevBtn.on('click.ui.desktoppaginationnavi', function (evt) {
			evt.preventDefault();

			let index = _.navi.getActivatedIndex() - 1;
			if (index <= 0) index = _.navi.getBtns().length;

			$(_).trigger({
				type: DesktopPaginationNavi.CLICK_PREVNEXT_BTN,
				direction: 'prev',
				index: index
			});

			_.disablePrevNextBtnAtMoment(_.prevBtn, _.DISABLE_PREVNEXT_BTN_INTERVAL);
		});

		_.nextBtn.on('click.ui.desktoppaginationnavi', function (evt) {
			evt.preventDefault();

			let index = _.navi.getActivatedIndex() + 1;
			if (index > _.navi.getBtns().length) index = 1;

			$(_).trigger({
				type: DesktopPaginationNavi.CLICK_PREVNEXT_BTN,
				direction: 'next',
				index: index
			});

			_.disablePrevNextBtnAtMoment(_.nextBtn, _.DISABLE_PREVNEXT_BTN_INTERVAL);
		});
	}

	disablePrevNextBtnAtMoment(btn, interval) {
		btn.prop('disabled', true);

		window.setTimeout(function() {
			btn.prop('disabled', false);
 		}, interval);
	}

	activateNaviBtn(index) {
		const _ = this;

		let btns = $(_.navi.getBtns()),
		btn = $(_.navi.getBtn(index));

		btns.removeClass('on');
		btn.addClass('on');
	}

	arrangeNaviListItems() {
		const _ = this,
		listItemWidth = _.getNaviListItemWidth(_.naviListItems.length);

		_.setNaviListItemsWidth(listItemWidth);
		_.setNaviListItemsPosition(_.naviListItems, listItemWidth);
	}

	setNaviListItemsWidth(itemWidth) {
		const _ = this;
		if (_.naviListItems.length) _.naviListItems.width(itemWidth);
	}

	setNaviListItemsPosition(listItems, itemWidth) {
		const _ = this;
		if (listItems.length <= 0) return;

		// set visible listItems position.
		if (listItems.length <= _.DISPLAY_BTN_NUM) {
			for (let i = 0; i < listItems.length; i++) {
				let listItem = $(listItems[i]);
				tram(listItem).set({x: i * itemWidth});
			}

		} else {
			// show only visible btns.
			$(listItems).hide();

			let index = _.edgeBtnsIndex.left;
			for (let i = 0; i < _.DISPLAY_BTN_NUM; i++) {
				let listItem = $(listItems[index - 1]);

				index++;
				if (_.naviListItems.length < index) index = 1;

				listItem.show();
				tram(listItem).set({x: i * itemWidth});
			}
		}
	}

	getNaviListItemWidth(itemLength) {
		const _ = this,
		width = _.naviWrap.width();

		if (itemLength <= 1) {
			return width;

		} else if (itemLength <= _.DISPLAY_BTN_NUM) {
			return width / itemLength;
		}

		return width / _.DISPLAY_BTN_NUM;
	}

	resize(evt) {
		const _ = this;
		_.arrangeNaviListItems();
	}

	destroy(obj) {
		const _ = this;

		$(_.global).off('resize.ui.desktoppaginationnavi');

		if (_.navi) _.navi.destroy();
		_.navi = null;

		_.naviListItems = [];

		_.prevBtn.off('click.ui.desktoppaginationnavi');
		_.prevBtn = null;

		_.nextBtn.off('click.ui.desktoppaginationnavi');
		_.nextBtn = null;
	}

	/*
	 * public methods
	 */
	activate(index) {
		const _ = this;
		if (_.navi) _.navi.activate(index);
	}

	getActivatedIndex() {
		const _ = this;
		if (_.navi) return _.navi.getActivatedIndex();
		return 0;
	}

	switchBtns(direction, index) {
		const _ = this;

		if (_.naviListItems.length <= _.DISPLAY_BTN_NUM) return;
		if (!direction) return;
		if (isIndexInLoop(_.naviListItems.length, _.DISPLAY_BTN_NUM, _.edgeBtnsIndex.left, index)) return;

		const btnsWrap = $('.btns', _.wrap),
		btns = _.navi.getBtns(),
		itemWidth = _.getNaviListItemWidth(btns.length);

		let slideBtnWrapStartX = 0;

		switch (direction) {
		case 'prev' :
			_.edgeBtnsIndex = {
				left: getReverseLoopedFirstIndex(_.naviListItems.length, _.DISPLAY_BTN_NUM, index),
				right: index
			};

			slideBtnWrapStartX = -_.global.innerWidth;
			break;

		case 'next' :
			_.edgeBtnsIndex = {
				left: index,
				right: getLoopedLastIndex(_.naviListItems.length, _.DISPLAY_BTN_NUM, index)
			};

			slideBtnWrapStartX = _.global.innerWidth;
			break;
		}

		_.setNaviListItemsWidth(itemWidth);
		_.setNaviListItemsPosition(_.naviListItems, itemWidth);

		tram(btnsWrap)
			.stop({x: true})
			.set({x: slideBtnWrapStartX})
			.add('transform 0.5s ease-out-expo')
			.start({x: 0})
			.then(function () {
			});
	}
}
DesktopPaginationNavi.CLICK_PREVNEXT_BTN = 'CLICK_PREVNEXT_BTN';




class PromotionBanner {
	constructor(options) {
		const _ = this;

		if (!options) return;

		_.option = $.extend({
			wrap: null,
			rollingInterval: 0,
			breakpoint: BREAKPOINTS,
			global: window,
			data: null
			}, options);

		_.global = _.option.global ? _.option.global : window;

		_.isMobileEnv = $('body').hasClass('mobile') || $('body').hasClass('tablet');

		_.wrap = null;
		_.slickWrap = null;

		_.slickWrapOuterHtml = '';
		_.currentResolution = '';

		// pageNo
		_.pageNoDisplay = null;
		_.currentPageNo = 0;
		_.totalPageNo = 0;

		// pagination
		_.pagination = null;

		// promotion list toggled
		_.promotionListAll = null;

		// banner rolling interval
		_.rollingBannerIntervalId = null;

		// fix iPad Chrome resize, orientationchange delay bug
		_.subscribeResizeWindow$ = null;
	}

	init() {
		const _ = this;
		_.wrap = $(_.option.wrap);

		// console.log('# promontionbanner.js init() _.option.wrap : ', _.option.wrap);
		// _.option.data

		let tmpl_bannerItem = _.option.data.map( (item, i) => {
			return `<li>` +
				`<div class="bg-mobile" data-lazy="${item.banner}"></div>` +
				`<div class="bg" data-lazy="${item.banner}"></div>` +
				`<div class="article">` +
					`<a href="${item.url}" class="self">` +
						`<span class="type"></span>` +
						`<strong class="title">${item.title}</strong>` +
						`<span class="desc">${item.desc}</span>` +
					`</a>` +
				`</div>` +
			`</li>`;
		}).join('');

		let tmpl_navItem = _.option.data.map( (item, i) => {
			return `<li><a href="#">${item.title}</a></li>`;
		}).join('');

		let tmpl_listallItem = _.option.data.map( (item, i) => {
			return `<li><a href="${item.url}"><img src="${item.thumbnail}" class="thumb"><div class="article"><strong class="subject">${item.title}</strong><span class="date">${item.desc}</span></div></a></li>`;
		}).join('');

		let tmpl = `<div class="section-promotion__list banner-wrap"><ul>${tmpl_bannerItem}</ul></div>` +
		`<div class="pagination-wrap">` +
			`<div class="page-no"><span class="current">0</span><span class="divider">/</span><span class="total">0</span></div>` +
			`<button type="button" class="btn-prev-mobile">prev</button>` +
			`<button type="button" class="btn-next-mobile">next</button>` +
			`<div class="pagination-mobile"><div class="handle"><ul class="btns">${tmpl_navItem}</ul></div></div>` +
			`<div class="pagination-pc"><ul class="btns">${tmpl_navItem}</ul><button type="button" class="btn-prev">prev</button><button type="button" class="btn-next">next</button></div>` +
		`</div>` +
		`<div class="section-promotion__listall"><div class="bundle"><button class="btn-listall"></button><div class="wrap-listall"><ul>${tmpl_listallItem}</ul></div></div></div>`;

		_.option.wrap.empty().append(tmpl);

		_.setInstance();

	}

	setInstance() {
		const _ = this;

		_.wrap = $(_.option.wrap);

		if (notSingleEle(_.wrap)) return _;

		_.slickWrap = $('.section-promotion__list ul', _.wrap);

		let bannerItems = $('li', _.slickWrap);
		if (bannerItems.length <= 0) return _;

		_.slickWrapOuterHtml = _.slickWrap
					.clone()
					.wrapAll('<div />')
					.parent()
					.html();
		_.currentResolution = getResolution(_.option.breakpoint, _.global);

		_.currentPageNo = 1;
		_.totalPageNo = bannerItems.length;

		_.promotionListAll = $('.section-promotion__listall', _.wrap);

		_.addEvent();

		return _;
	}

	addEvent() {
		const _ = this;

		_.showWrap();

		_.setPromotionListAll();

		_.setPageNoDisplay();
		_.setPagination();

		_.resetBannerByBreakPoint(_.currentResolution);
		_.setBanner(_.currentPageNo);

		_.setPageNo(_.currentPageNo, _.totalPageNo);
		_.activatePagination(_.currentPageNo);

		_.setPromotionBannerRolling();

		if (_.isMobileEnv) {
			// trigger mobile device browser resize delay
			_.subscribeResizeWindow$ = fromEvent(window, 'resize')
					.pipe(
						debounceTime(100),
						tap(evt => _.resize())
					)
					.subscribe();
		} else {
			$(_.global).on('resize orientationchange', $.proxy(_.resize, _));
		}

		_.resize();
	}

	setPromotionListAll() {
		const _ = this;

		$('.btn-listall', _.promotionListAll).on('click', evt => {
			evt.preventDefault();

			const isWrapVisible = _.promotionListAll.hasClass('on');
			_.showPromotionList(!isWrapVisible);
		});
	}

	showPromotionList(flag) {
		truthy(flag) ? this.promotionListAll.addClass('on') : this.promotionListAll.removeClass('on');
	}

	setPageNoDisplay() {
		const _ = this;

		_.pageNoDisplay = new PageNoDisplay({
			wrap: $('.pagination-wrap .page-no', _.wrap)
		}).init();
	}

	setPagination() {
		const _ = this;

		_.pagination = new Pagination({
			wrap: $('.pagination-wrap', _.wrap),
			breakpoint: _.option.breakpoint,
			isMobileEnv: _.isMobileEnv,
			global: _.global
		}).init();

		$(_.pagination).on(Pagination.CLICK_PAGE_BTN, $.proxy(_.activateBannerByPagination, _));
	}

	resetBannerByBreakPoint(resolution) {
		const _ = this;

		_.destroySlickWrap();

		// replace <div> has .bg, .bg-mobile class to <img>. for slick's lazy load. (slick's lazy load feature can apply only to <img>.)
		let slickWrap = $('.section-promotion__list ul', _.wrap),
		items = $('li', slickWrap),
		bg = null,
		bgMobile = null;

		if (isPhoneResolution(resolution)) {
			//console.log('phone');

			// phone resolution
			for (let i = 0, max = items.length; i < max; i++) {
				bgMobile = $('.bg-mobile', items.get(i));
				bgMobile.replaceWith(`<img class="${bgMobile.attr('class')}" data-lazy="${bgMobile.attr('data-lazy')}">`); // <div> to <img> has data-lazy attribute.
			}
		} else if (isTabletResolution(resolution)) {
			//console.log('tablet');

			// tablet resolution
			for (let i = 0, max = items.length; i < max; i++) {
				bg = $('.bg', items.get(i));

				bgMobile = $('.bg-mobile', items.get(i));
				bgMobile.replaceWith(`<img class="${bgMobile.attr('class')}" data-lazy="${bg.attr('data-lazy')}">`); // <div> to <img> has data-lazy attribute.
			}
		} else {
			//console.log('pc or max');

			// pc or max resolution
			for (let i = 0, max = items.length; i < max; i++) {
				bg = $('.bg', items.get(i));
				bg.replaceWith(`<img class="${bg.attr('class')}" data-lazy="${bg.attr('data-lazy')}">`); // <div> to <img> has data-lazy attribute.
			}
		}
	}

	setBanner(index = 1) {
		const _ = this;

		_.slickWrap = $('.section-promotion__list ul', _.wrap);

		_.slickWrap.on('lazyLoaded', function(event, slick, image, imageSource) {
			let img = $(image);

			if (img.length) {
				let banner = $(`<div class="${img.attr('class')}" style="background-image:url(${imageSource});"></div>`);
				tram(banner).set({ opacity: 0 });

				img.replaceWith(banner);

				tram(banner)
					.stop({ opacity: true })
					.add('opacity 0.5s ease-out-expo')
					.start({ opacity: 1 });
			}
		});

		_.slickWrap.on('lazyLoadError', function(event, slick, image, imageSource) {
			// error. but, try to set background image.
			const img = $(image);
			if (img.length) 
				img.replaceWith( `<div class="${img.attr('class') || ''}" style="background-image:url(${imageSource || ''});"></div>`);
		});

		_.slickWrap.on('beforeChange', function(
			event,
			slick,
			currentSlideIndex,
			nextSlideIndex
			) {
			const index = nextSlideIndex + 1,
			direction = slick.currentDirection === 0 ? 'next' : 'prev';

			_.activatePagination(index, direction);

			_.currentPageNo = index;
		});

		_.slickWrap.slick({
			infinite: true,
			arrows: false,
			speed: 250,
			lazyLoad: 'ondemand',
			initialSlide: index - 1
		});

		_.slickWrap.slick('setPosition');
	}

	setPageNo(currentNo, totalNo) {
		const _ = this;

		if (isNotDefined(_.pageNoDisplay)) return;

		if (isDefined(currentNo)) _.pageNoDisplay.setCurrentNo(currentNo);

		if (isDefined(totalNo)) _.pageNoDisplay.setTotalNo(totalNo);
	}

	activatePagination(index, direction = undefined) {
		const _ = this;

		_.setPageNo(index);

		if (_.pagination && isDefined(direction))
			_.pagination.activate(index, direction);
	}

	activateBannerByPagination(
		data = { type: Pagination.CLICK_PAGE_BTN, index: 1 }
	) {
		const _ = this,
		index = data.index;

		if (_.isSlickWrapInitialized()) {
			_.slickWrap.slick('slickGoTo', index - 1);
			_.currentPageNo = index;
		}
	}

	showWrap() {
		const _ = this;

		tram(_.wrap)
			.set({
				opacity: 0,
				visibility: 'visible'
			})
			.stop({ opacity: true })
			.add('opacity 0.5s ease-out-expo')
			.start({ opacity: 1 });
	}

	resize(evt) {
		const _ = this,
		resolution = getResolution(_.option.breakpoint, _.global);

		if (resolution !== _.currentResolution) {
			const isMobileRes = isMobileResolution(resolution),
			isCurrentMobileRes = isMobileResolution(_.currentResolution);

			if (isMobileRes && isCurrentMobileRes) {
				//console.log('change between phone and tablet');

				const index = _.slickWrap.slick('slickCurrentSlide') + 1;
				_.resetBannerByBreakPoint(resolution);
				_.setBanner(index);

				_.showPromotionList(false);
			} else if (!isMobileRes && !isCurrentMobileRes) {
				//console.log('change between pc and max');
			} else {
				//console.log('change between phone/tablet and pc/max');

				const index = _.slickWrap.slick('slickCurrentSlide') + 1;
				_.resetBannerByBreakPoint(resolution);
				_.setBanner(index);

				_.showPromotionList(false);
			}

			_.currentResolution = resolution;
		}

		// _.currentResolution = resolution;
	}

	destroySlickWrap() {
		const _ = this;

		if (_.isSlickWrapInitialized()) {
			// destroy slick.
			_.slickWrap.off('lazyLoaded');
			_.slickWrap.off('lazyLoadError');
			_.slickWrap.slick('unslick');

			// reset slickWrap html.
			_.slickWrap.replaceWith(_.slickWrapOuterHtml);
		}
	}

	isSlickWrapInitialized() {
		const _ = this;

		if (_.slickWrap && _.slickWrap.length)
			return _.slickWrap.hasClass('slick-initialized');
		return false;
	}

	setPromotionBannerRolling() {
		const _ = this;

		if (_.totalPageNo <= 1) return;

		_.setRollingBannerInterval(
			true,
			_.option.rollingInterval,
			_.activateNextPromotionBanner
		);

		// set interaction
		if (_.isMobileEnv === true) {
			_.wrap
			.on('touchstart.ui.promotionbanner', evt => {
				_.setRollingBannerInterval(false);
			})
			.on('touchend.ui.promotionbanner', evt => {
				_.setRollingBannerInterval(
					true,
					_.option.rollingInterval,
					_.activateNextPromotionBanner
				);
			});
		} else {
			_.wrap
			.on('mouseover.ui.promotionbanner', evt => {
				_.setRollingBannerInterval(false);
			})
			.on('mouseout.ui.promotionbanner', evt => {
				_.setRollingBannerInterval(
					true,
					_.option.rollingInterval,
					_.activateNextPromotionBanner
				);
			});
		}
	}

	setRollingBannerInterval(flag, interval, callback) {
		const _ = this;

		if (isDefined(_.rollingBannerIntervalId)) {
			_.global.clearInterval(_.rollingBannerIntervalId);
			_.rollingBannerIntervalId = null;
		}

		if (truthy(flag)) {
			_.rollingBannerIntervalId = _.global.setInterval(() => {
				if (callback) callback.apply(_, []);
			}, interval);
		}
	}

	activateNextPromotionBanner() {
		const _ = this;

		_.currentPageNo++;
		if (_.currentPageNo > _.totalPageNo) _.currentPageNo = 1;

		_.slickWrap.slick('slickGoTo', _.currentPageNo - 1);
	}
}

class ServiceShortcut {
	constructor(options) {
		const _ = this;
		if (!options) return;
		_.option = $.extend({
			wrap: null,
			breakpoint: BREAKPOINTS,
			global: window,
			data : null
		}, options);

		// import Dragdealer
		_.Dragdealer = Dragdealer;
		_.global = (_.option.global) ? _.option.global : window;
		_.slideNavi = null;
	}

	init(obj) {
		const _ = this;
		if (isDefined(_.option.wrap) && _.option.wrap.length) _.setInstance();
		return _;
	}

	setInstance() {
		const _ = this;

		if (_.option.data) {
			let tmpl_item = _.option.data.map( (item, i) => {
				let _url = item.url;
				if (/^js:/.test(_url)) {
					_url = `javascript:${_url.substring(3)}`; // 'js:' 제거 후 'javascript:' 추가
				}
				return `<li class="visible"><a href="${_url}" target="_self"><span class="icon" style="background-image:url(${item.image})"></span><span class="name">${item.name}</span></a></li>`;
			}).join('');

			let tmpl = `<div class="handle" ><ul class="btns">${tmpl_item}</ul></div>`;
			_.option.wrap.append(tmpl);
		}

		_.setSlideNavi();

		$(_.global).on('resize', $.proxy(_.resize, _));

		_.resize();
	}

	setSlideNavi() {
		const _ = this,
		slideNaviWrap = $(_.option.wrap),
		btnsWrap = $('.btns', slideNaviWrap);

		_.slideNavi = new HorizontalSlideNavi({
			Dragdealer: _.Dragdealer,

			// Navi.js options
			btns: $('li a', btnsWrap),

			clickCallback: function (obj) {
				if (!obj || !obj.btn) return;

				const btn = $(obj.btn),
				href = btn.attr('href'),
				target = btn.attr('target') || '_self';

				if (!href) return;
				window.open(href, target);
			},

			activateCallback: function (obj) {
				let btns = $(_.slideNavi.getBtns()),
				btn = $(_.slideNavi.getBtn(obj.index));

				btns.removeClass('on');
				btn.addClass('on');
			},

			// HorizontalSlideNavi.js options
			wrap: slideNaviWrap,
			handleClass: 'handle',
			btnsWrap: btnsWrap
		}).init();
	}

	destroySlideNavi() {
		const _ = this;

		if (isNotDefined(_.slideNavi)) return;

		_.slideNavi.destroy();
		_.slideNavi = null;

		// remove handle's css maked by Dragdealer.
		const handle = $('.handle', _.option.wrap);
		handle.css({
			'-webkit-transform': 'translateY(0)',
			'-moz-transform': 'translateY(0)',
			'-ms-transform': 'translateY(0)',
			'-o-transform': 'translateY(0)',
			'transform': 'translateY(0)',
			'perspective': '',
			'backface-visibility': ''
		});
	}

	resizeList(breakpoint) {
		const _ = this,
		list = $('.btns', _.option.wrap);
		let listSize;

		if(breakpoint === 'pc' ){
			listSize = list.children(':visible:not(".only-mobile")').length;
		} else {
			listSize = list.children(':visible:not(".only-pc")').length;
		}

		list.children('li').css({'width':'calc(100%/'+ listSize +')'});
	}

	resize(evt) {
		const _ = this,
		breakpoint = _.option.breakpoint;

		if (breakpoint.max && _.global.innerWidth >= breakpoint.max) {
			_.destroySlideNavi();
			_.resizeList('pc');

		} else if (breakpoint.pc && _.global.innerWidth >= breakpoint.pc) {
			_.destroySlideNavi();
			_.resizeList('pc');

		} else if (breakpoint.tablet && _.global.innerWidth >= breakpoint.tablet) {
			_.destroySlideNavi();
			_.resizeList('mobile');

		} else {
			if (!_.slideNavi) _.setSlideNavi();
			_.resizeList('mobile');
		}

	}
}


(function ($, global) {
	"use strict";

	let promotionBanner = null,
	serviceShortcut = null;

	namespace('nc.lineage');

	nc.lineage.main = function (options) {
		if (isNotDefined(options)) throw new Error('nc.lineage.main require options object');

		let contiGroupData = {};

		$(options.promotionBanner.wrap).append(getLoadingBarTpl());

		init();

		function init() {
			if (!index_data) {
				console.log( 'error : no data' );
				return;
			}

			// index 페이지 데이터 로드
			$.each(index_data, function(key, element) {
				switch(key){
				case 'PROMOTIONS':
					contiGroupData.promotion = element;
					break;
				case 'SHORTCUT':
					contiGroupData.shortcut = element;
					break;
				default:
					console.log('UNDEFINED_INDEX_DATA_KEY : ' + key);
					break;
				}
			});

			setInstance();
		}

		function setInstance() {
			const option = $.extend(true, {
				promotionBanner: {
					wrap: null,
					rollingInterval: 5000,
					breakpoint: BREAKPOINTS,
					global: global,
					data : contiGroupData.promotion
				},
				serviceShortcut: {
					wrap: null,
					breakpoint: BREAKPOINTS,
					global: global,
					data : contiGroupData.shortcut
				}

			}, options);

			// 담당 데이터 생성
			promotionBanner = new PromotionBanner(option.promotionBanner).init();
			serviceShortcut = new ServiceShortcut(option.serviceShortcut).init();
		}
	};
}(jQuery, window));