;(function(undefined) {
  'use strict';

  /**
   * Sigma Keyboard Utility
   * ================================
   *
   * The aim of this plugin is to bind any function to a combinaison of keys,
   * and to control the camera zoom and position with the keyboard.
   * Use (Alt +) Arrow to move in any direction.
   * Use (Alt +) Space + Top/Bottom Arrow to zoom in/out.
   *
   * Author: Sébastien Heymann <seb@linkurio.us> (Linkurious)
   * Version: 0.0.1
   */

  if (typeof sigma === 'undefined')
    throw 'sigma.plugins.keyboard: sigma is not declared';

  // Initialize package:
  sigma.utils.pkg('sigma.plugins');

  /**
   * The default settings.
   *
   */
  var settings = {
    // {number} Camera displacement in pixels
    displacement: 100,
    // {number} Override the `mouseZoomDuration` setting of Sigma
    duration: 200,
    // {number} Override the `zoomingRatio` setting of Sigma
    zoomingRatio: 1.7,
    // {boolean} Set focus on the visualization container when the plugin is
    // initialized and when the mouse is over it. The container must have the
    // focus to enable keyboard events.
    autofocus: true,
    // {number} Tab index of the graph container provided if no `tabindex`
    // attribute is found
    tabIndex: -1
  };

  var _instance = {};

  /**
   * Keyboard Object
   * ------------------
   *
   * @param  {sigma}   s       The related sigma instance.
   * @param  {object} renderer The renderer to attach keyboard events.
   * @param  {object} params   The options related to the object.
   */
  function Keyboard(s, renderer, params) {
    params = sigma.utils.extend(params, settings);
    params.zoomingRatio = params.zoomingRatio || s.settings('zoomingRatio');
    params.duration = params.duration || s.settings('mouseZoomDuration');

    this.domElt = renderer.container;
    this.keys = {};
    this.currentEvents = null;

    var self = this;

    sigma.classes.dispatcher.extend(this);

    function camera(o) {
      // Normalize ratio:
      var ratio = Math.max(
        s.settings('zoomMin'),
        Math.min(s.settings('zoomMax'), s.camera.ratio * (o.ratio || 1))
      );

      sigma.misc.animation.camera(
        s.camera,
        {
          x: s.camera.x + (o.x || 0),
          y: s.camera.y + (o.y || 0),
          ratio: ratio
        },
        { duration: o.duration}
      );
    }

    function moveLeft() {
      camera({
        x: - params.displacement,
        duration: params.duration
      });
    };

    function moveTop() {
      camera({
        y: - params.displacement,
        duration: params.duration
      });
    };

    function moveRight() {
      camera({
        x: params.displacement,
        duration: params.duration
      });
    };

    function moveDown() {
      camera({
        y: params.displacement,
        duration: params.duration
      });
    };

    function zoomIn() {
      camera({
        ratio: 1 / params.zoomingRatio,
        duration: params.duration
      });
    };

    function zoomOut() {
      camera({
        ratio: params.zoomingRatio,
        duration: params.duration
      });
    };

    this.keyDown = function(event) {
      if (event.which !== 9 && event.which !== 18 && event.which !== 20 && !self.keys[event.which]) {
        // Do nothing on Tabbing, Alt and Capslock because keyUp won't be triggered
        self.keys[event.which] = true;
        self.currentEvents = Object.keys(self.keys).join('+');
        self.dispatchEvent(self.currentEvents);
      }
    }

    this.keyUp = function(event) {
      delete self.keys[event.which];
      self.currentEvents = null;
    }

    this.focus = function(event) {
      self.domElt.focus();
      return true;
    }

    this.blur = function(event) {
      self.domElt.blur();
      self.keys = {};
      self.currentEvents = null;
      return true;
    }

    // needed to provide focus to the graph container
    // see http://www.dbp-consulting.com/tutorials/canvas/CanvasKeyEvents.html
    this.domElt.tabIndex = params.tabIndex;

    if (params.autofocus) {
      this.domElt.focus();
      this.domElt.addEventListener('mouseover', this.focus, false);
      this.domElt.addEventListener('mouseout', this.blur, false);
    }

    this.domElt.addEventListener('keydown', this.keyDown, false);
    this.domElt.addEventListener('keyup', this.keyUp, false);

    this.bind('37 18+37', moveLeft); // (ALT +) LEFT ARROW
    this.bind('38 18+38', moveTop); // (ALT +) TOP ARROW
    this.bind('39 18+39', moveRight); // (ALT +) RIGHT ARROW
    this.bind('40 18+40', moveDown); // (ALT +) BOTTOM ARROW

    this.bind('32+38 18+32+38', zoomIn); // (ALT +) SPACE + TOP ARROW
    this.bind('32+40 18+32+40', zoomOut); // (ALT +) SPACE + BOTTOM ARROW
  };


  /**
   * Interface
   * ------------------
   */

  /**
   * This function initializes the Keyboard for a specified Sigma instance.
   *
   * Usage:
   *   var kbd = sigma.plugins.keyboard(s, s.renderers[0]);
   *   kbd.bind('32', function() { console.log('"Space" key pressed'); });
   *
   * @param  {sigma}  s        The related sigma instance.
   * @param  {object} renderer The renderer to attach keyboard events.
   * @param  {object} options  The options related to the object.
   */
  sigma.plugins.keyboard = function(s, renderer, options) {
    // Create object if undefined
    if (!_instance[s.id]) {
      _instance[s.id] = new Keyboard(s, renderer, options);

      s.bind('kill', function() {
        sigma.plugins.killKeyboard(s);
      });
    }

    return _instance[s.id];
  };

  /**
   * This function kills the Keyboard instance.
   */
  sigma.plugins.killKeyboard = function(s) {
    if (_instance[s.id] instanceof Keyboard) {
      _instance[s.id].unbind();
      _instance[s.id].domElt.removeEventListener('mouseover', _instance[s.id].focus, false);
      _instance[s.id].domElt.removeEventListener('mouseout', _instance[s.id].blur, false);
      _instance[s.id].domElt.removeEventListener('keydown', _instance[s.id].keyDown, false);
      _instance[s.id].domElt.removeEventListener('keyup', _instance[s.id].keyUp, false);
      _instance[s.id].domElt = null;
      _instance[s.id].keys = {};
      _instance[s.id].currentEvents = null;
      delete _instance[s.id];
    }
  };

}).call(this);
