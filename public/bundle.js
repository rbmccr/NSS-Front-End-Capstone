(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * heatmap.js v2.0.5 | JavaScript Heatmap Library
 *
 * Copyright 2008-2016 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license 
 *
 * :: 2016-09-05 01:16
 */
;(function (name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

})("h337", this, function () {

// Heatmap Config stores default values and will be merged with instance config
var HeatmapConfig = {
  defaultRadius: 40,
  defaultRenderer: 'canvas2d',
  defaultGradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
  defaultMaxOpacity: 1,
  defaultMinOpacity: 0,
  defaultBlur: .85,
  defaultXField: 'x',
  defaultYField: 'y',
  defaultValueField: 'value', 
  plugins: {}
};
var Store = (function StoreClosure() {

  var Store = function Store(config) {
    this._coordinator = {};
    this._data = [];
    this._radi = [];
    this._min = 10;
    this._max = 1;
    this._xField = config['xField'] || config.defaultXField;
    this._yField = config['yField'] || config.defaultYField;
    this._valueField = config['valueField'] || config.defaultValueField;

    if (config["radius"]) {
      this._cfgRadius = config["radius"];
    }
  };

  var defaultRadius = HeatmapConfig.defaultRadius;

  Store.prototype = {
    // when forceRender = false -> called from setData, omits renderall event
    _organiseData: function(dataPoint, forceRender) {
        var x = dataPoint[this._xField];
        var y = dataPoint[this._yField];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var value = dataPoint[this._valueField] || 1;
        var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = value;
          radi[x][y] = radius;
        } else {
          store[x][y] += value;
        }
        var storedVal = store[x][y];

        if (storedVal > max) {
          if (!forceRender) {
            this._max = storedVal;
          } else {
            this.setDataMax(storedVal);
          }
          return false;
        } else if (storedVal < min) {
          if (!forceRender) {
            this._min = storedVal;
          } else {
            this.setDataMin(storedVal);
          }
          return false;
        } else {
          return { 
            x: x, 
            y: y,
            value: value, 
            radius: radius,
            min: min,
            max: max 
          };
        }
    },
    _unOrganizeData: function() {
      var unorganizedData = [];
      var data = this._data;
      var radi = this._radi;

      for (var x in data) {
        for (var y in data[x]) {

          unorganizedData.push({
            x: x,
            y: y,
            radius: radi[x][y],
            value: data[x][y]
          });

        }
      }
      return {
        min: this._min,
        max: this._max,
        data: unorganizedData
      };
    },
    _onExtremaChange: function() {
      this._coordinator.emit('extremachange', {
        min: this._min,
        max: this._max
      });
    },
    addData: function() {
      if (arguments[0].length > 0) {
        var dataArr = arguments[0];
        var dataLen = dataArr.length;
        while (dataLen--) {
          this.addData.call(this, dataArr[dataLen]);
        }
      } else {
        // add to store  
        var organisedEntry = this._organiseData(arguments[0], true);
        if (organisedEntry) {
          // if it's the first datapoint initialize the extremas with it
          if (this._data.length === 0) {
            this._min = this._max = organisedEntry.value;
          }
          this._coordinator.emit('renderpartial', {
            min: this._min,
            max: this._max,
            data: [organisedEntry]
          });
        }
      }
      return this;
    },
    setData: function(data) {
      var dataPoints = data.data;
      var pointsLen = dataPoints.length;


      // reset data arrays
      this._data = [];
      this._radi = [];

      for(var i = 0; i < pointsLen; i++) {
        this._organiseData(dataPoints[i], false);
      }
      this._max = data.max;
      this._min = data.min || 0;
      
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    removeData: function() {
      // TODO: implement
    },
    setDataMax: function(max) {
      this._max = max;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setDataMin: function(min) {
      this._min = min;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setCoordinator: function(coordinator) {
      this._coordinator = coordinator;
    },
    _getInternalData: function() {
      return { 
        max: this._max,
        min: this._min, 
        data: this._data,
        radi: this._radi 
      };
    },
    getData: function() {
      return this._unOrganizeData();
    }/*,

      TODO: rethink.

    getValueAt: function(point) {
      var value;
      var radius = 100;
      var x = point.x;
      var y = point.y;
      var data = this._data;

      if (data[x] && data[x][y]) {
        return data[x][y];
      } else {
        var values = [];
        // radial search for datapoints based on default radius
        for(var distance = 1; distance < radius; distance++) {
          var neighbors = distance * 2 +1;
          var startX = x - distance;
          var startY = y - distance;

          for(var i = 0; i < neighbors; i++) {
            for (var o = 0; o < neighbors; o++) {
              if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
                if (data[startY+i] && data[startY+i][startX+o]) {
                  values.push(data[startY+i][startX+o]);
                }
              } else {
                continue;
              } 
            }
          }
        }
        if (values.length > 0) {
          return Math.max.apply(Math, values);
        }
      }
      return false;
    }*/
  };


  return Store;
})();

var Canvas2dRenderer = (function Canvas2dRendererClosure() {

  var _getColorPalette = function(config) {
    var gradientConfig = config.gradient || config.defaultGradient;
    var paletteCanvas = document.createElement('canvas');
    var paletteCtx = paletteCanvas.getContext('2d');

    paletteCanvas.width = 256;
    paletteCanvas.height = 1;

    var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
    for (var key in gradientConfig) {
      gradient.addColorStop(key, gradientConfig[key]);
    }

    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  };

  var _getPointTemplate = function(radius, blurFactor) {
    var tplCanvas = document.createElement('canvas');
    var tplCtx = tplCanvas.getContext('2d');
    var x = radius;
    var y = radius;
    tplCanvas.width = tplCanvas.height = radius*2;

    if (blurFactor == 1) {
      tplCtx.beginPath();
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
      tplCtx.fillStyle = 'rgba(0,0,0,1)';
      tplCtx.fill();
    } else {
      var gradient = tplCtx.createRadialGradient(x, y, radius*blurFactor, x, y, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      tplCtx.fillStyle = gradient;
      tplCtx.fillRect(0, 0, 2*radius, 2*radius);
    }



    return tplCanvas;
  };

  var _prepareData = function(data) {
    var renderData = [];
    var min = data.min;
    var max = data.max;
    var radi = data.radi;
    var data = data.data;

    var xValues = Object.keys(data);
    var xValuesLen = xValues.length;

    while(xValuesLen--) {
      var xValue = xValues[xValuesLen];
      var yValues = Object.keys(data[xValue]);
      var yValuesLen = yValues.length;
      while(yValuesLen--) {
        var yValue = yValues[yValuesLen];
        var value = data[xValue][yValue];
        var radius = radi[xValue][yValue];
        renderData.push({
          x: xValue,
          y: yValue,
          value: value,
          radius: radius
        });
      }
    }

    return {
      min: min,
      max: max,
      data: renderData
    };
  };


  function Canvas2dRenderer(config) {
    var container = config.container;
    var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
    var canvas = this.canvas = config.canvas || document.createElement('canvas');
    var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0];

    var computed = getComputedStyle(config.container) || {};

    canvas.className = 'heatmap-canvas';

    this._width = canvas.width = shadowCanvas.width = config.width || +(computed.width.replace(/px/,''));
    this._height = canvas.height = shadowCanvas.height = config.height || +(computed.height.replace(/px/,''));

    this.shadowCtx = shadowCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');

    // @TODO:
    // conditional wrapper

    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

    container.style.position = 'relative';
    container.appendChild(canvas);

    this._palette = _getColorPalette(config);
    this._templates = {};

    this._setStyles(config);
  };

  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      if (data.data.length > 0) {
        this._drawAlpha(data);
        this._colorize();
      }
    },
    renderAll: function(data) {
      // reset render boundaries
      this._clear();
      if (data.data.length > 0) {
        this._drawAlpha(_prepareData(data));
        this._colorize();
      }
    },
    _updateGradient: function(config) {
      this._palette = _getColorPalette(config);
    },
    updateConfig: function(config) {
      if (config['gradient']) {
        this._updateGradient(config);
      }
      this._setStyles(config);
    },
    setDimensions: function(width, height) {
      this._width = width;
      this._height = height;
      this.canvas.width = this.shadowCanvas.width = width;
      this.canvas.height = this.shadowCanvas.height = height;
    },
    _clear: function() {
      this.shadowCtx.clearRect(0, 0, this._width, this._height);
      this.ctx.clearRect(0, 0, this._width, this._height);
    },
    _setStyles: function(config) {
      this._blur = (config.blur == 0)?0:(config.blur || config.defaultBlur);

      if (config.backgroundColor) {
        this.canvas.style.backgroundColor = config.backgroundColor;
      }

      this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width;
      this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height;


      this._opacity = (config.opacity || 0) * 255;
      this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
      this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
      this._useGradientOpacity = !!config.useGradientOpacity;
    },
    _drawAlpha: function(data) {
      var min = this._min = data.min;
      var max = this._max = data.max;
      var data = data.data || [];
      var dataLen = data.length;
      // on a point basis?
      var blur = 1 - this._blur;

      while(dataLen--) {

        var point = data[dataLen];

        var x = point.x;
        var y = point.y;
        var radius = point.radius;
        // if value is bigger than max
        // use max as value
        var value = Math.min(point.value, max);
        var rectX = x - radius;
        var rectY = y - radius;
        var shadowCtx = this.shadowCtx;




        var tpl;
        if (!this._templates[radius]) {
          this._templates[radius] = tpl = _getPointTemplate(radius, blur);
        } else {
          tpl = this._templates[radius];
        }
        // value from minimum / value range
        // => [0, 1]
        var templateAlpha = (value-min)/(max-min);
        // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
        shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha;

        shadowCtx.drawImage(tpl, rectX, rectY);

        // update renderBoundaries
        if (rectX < this._renderBoundaries[0]) {
            this._renderBoundaries[0] = rectX;
          }
          if (rectY < this._renderBoundaries[1]) {
            this._renderBoundaries[1] = rectY;
          }
          if (rectX + 2*radius > this._renderBoundaries[2]) {
            this._renderBoundaries[2] = rectX + 2*radius;
          }
          if (rectY + 2*radius > this._renderBoundaries[3]) {
            this._renderBoundaries[3] = rectY + 2*radius;
          }

      }
    },
    _colorize: function() {
      var x = this._renderBoundaries[0];
      var y = this._renderBoundaries[1];
      var width = this._renderBoundaries[2] - x;
      var height = this._renderBoundaries[3] - y;
      var maxWidth = this._width;
      var maxHeight = this._height;
      var opacity = this._opacity;
      var maxOpacity = this._maxOpacity;
      var minOpacity = this._minOpacity;
      var useGradientOpacity = this._useGradientOpacity;

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      if (x + width > maxWidth) {
        width = maxWidth - x;
      }
      if (y + height > maxHeight) {
        height = maxHeight - y;
      }

      var img = this.shadowCtx.getImageData(x, y, width, height);
      var imgData = img.data;
      var len = imgData.length;
      var palette = this._palette;


      for (var i = 3; i < len; i+= 4) {
        var alpha = imgData[i];
        var offset = alpha * 4;


        if (!offset) {
          continue;
        }

        var finalAlpha;
        if (opacity > 0) {
          finalAlpha = opacity;
        } else {
          if (alpha < maxOpacity) {
            if (alpha < minOpacity) {
              finalAlpha = minOpacity;
            } else {
              finalAlpha = alpha;
            }
          } else {
            finalAlpha = maxOpacity;
          }
        }

        imgData[i-3] = palette[offset];
        imgData[i-2] = palette[offset + 1];
        imgData[i-1] = palette[offset + 2];
        imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;

      }

      img.data = imgData;
      this.ctx.putImageData(img, x, y);

      this._renderBoundaries = [1000, 1000, 0, 0];

    },
    getValueAt: function(point) {
      var value;
      var shadowCtx = this.shadowCtx;
      var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
      var data = img.data[3];
      var max = this._max;
      var min = this._min;

      value = (Math.abs(max-min) * (data/255)) >> 0;

      return value;
    },
    getDataURL: function() {
      return this.canvas.toDataURL();
    }
  };


  return Canvas2dRenderer;
})();


var Renderer = (function RendererClosure() {

  var rendererFn = false;

  if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
    rendererFn = Canvas2dRenderer;
  }

  return rendererFn;
})();


var Util = {
  merge: function() {
    var merged = {};
    var argsLen = arguments.length;
    for (var i = 0; i < argsLen; i++) {
      var obj = arguments[i]
      for (var key in obj) {
        merged[key] = obj[key];
      }
    }
    return merged;
  }
};
// Heatmap Constructor
var Heatmap = (function HeatmapClosure() {

  var Coordinator = (function CoordinatorClosure() {

    function Coordinator() {
      this.cStore = {};
    };

    Coordinator.prototype = {
      on: function(evtName, callback, scope) {
        var cStore = this.cStore;

        if (!cStore[evtName]) {
          cStore[evtName] = [];
        }
        cStore[evtName].push((function(data) {
            return callback.call(scope, data);
        }));
      },
      emit: function(evtName, data) {
        var cStore = this.cStore;
        if (cStore[evtName]) {
          var len = cStore[evtName].length;
          for (var i=0; i<len; i++) {
            var callback = cStore[evtName][i];
            callback(data);
          }
        }
      }
    };

    return Coordinator;
  })();


  var _connect = function(scope) {
    var renderer = scope._renderer;
    var coordinator = scope._coordinator;
    var store = scope._store;

    coordinator.on('renderpartial', renderer.renderPartial, renderer);
    coordinator.on('renderall', renderer.renderAll, renderer);
    coordinator.on('extremachange', function(data) {
      scope._config.onExtremaChange &&
      scope._config.onExtremaChange({
        min: data.min,
        max: data.max,
        gradient: scope._config['gradient'] || scope._config['defaultGradient']
      });
    });
    store.setCoordinator(coordinator);
  };


  function Heatmap() {
    var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
    this._coordinator = new Coordinator();
    if (config['plugin']) {
      var pluginToLoad = config['plugin'];
      if (!HeatmapConfig.plugins[pluginToLoad]) {
        throw new Error('Plugin \''+ pluginToLoad + '\' not found. Maybe it was not registered.');
      } else {
        var plugin = HeatmapConfig.plugins[pluginToLoad];
        // set plugin renderer and store
        this._renderer = new plugin.renderer(config);
        this._store = new plugin.store(config);
      }
    } else {
      this._renderer = new Renderer(config);
      this._store = new Store(config);
    }
    _connect(this);
  };

  // @TODO:
  // add API documentation
  Heatmap.prototype = {
    addData: function() {
      this._store.addData.apply(this._store, arguments);
      return this;
    },
    removeData: function() {
      this._store.removeData && this._store.removeData.apply(this._store, arguments);
      return this;
    },
    setData: function() {
      this._store.setData.apply(this._store, arguments);
      return this;
    },
    setDataMax: function() {
      this._store.setDataMax.apply(this._store, arguments);
      return this;
    },
    setDataMin: function() {
      this._store.setDataMin.apply(this._store, arguments);
      return this;
    },
    configure: function(config) {
      this._config = Util.merge(this._config, config);
      this._renderer.updateConfig(this._config);
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    repaint: function() {
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    getData: function() {
      return this._store.getData();
    },
    getDataURL: function() {
      return this._renderer.getDataURL();
    },
    getValueAt: function(point) {

      if (this._store.getValueAt) {
        return this._store.getValueAt(point);
      } else  if (this._renderer.getValueAt) {
        return this._renderer.getValueAt(point);
      } else {
        return null;
      }
    }
  };

  return Heatmap;

})();


// core
var heatmapFactory = {
  create: function(config) {
    return new Heatmap(config);
  },
  register: function(pluginKey, plugin) {
    HeatmapConfig.plugins[pluginKey] = plugin;
  }
};

return heatmapFactory;


});
},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const URL = "http://localhost:8088";
const API = {
  getSingleItem(extension, id) {
    return fetch(`${URL}/${extension}/${id}`).then(data => data.json());
  },

  getAll(extension) {
    return fetch(`${URL}/${extension}`).then(data => data.json());
  },

  deleteItem(extension, id) {
    return fetch(`${URL}/${extension}/${id}`, {
      method: "DELETE"
    }).then(e => e.json());
  },

  postItem(extension, obj) {
    return fetch(`${URL}/${extension}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(obj)
    }).then(r => r.json());
  },

  putItem(extension, obj) {
    return fetch(`${URL}/${extension}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(obj)
    }).then(r => r.json());
  }

};
var _default = API;
exports.default = _default;

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _heatmapData = _interopRequireDefault(require("./heatmapData"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
const dateFilter = {
  buildDateFilter() {
    // this function is called from heatmaps.js and is triggered from the heatmaps page of the site when
    // the date filter is selected
    const endDateInput = (0, _elementBuilder.default)("input", {
      "id": "endDateInput",
      "class": "input",
      "type": "date"
    }, null);
    const endDateControl = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, endDateInput);
    const endDateLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Date 2:\xa0");
    const endDateInputField = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered is-grouped-multiline"
    }, null, endDateLabel, endDateControl);
    const startDateInput = (0, _elementBuilder.default)("input", {
      "id": "startDateInput",
      "class": "input",
      "type": "date"
    }, null);
    const startDateControl = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, startDateInput);
    const startDateLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Date 1:\xa0");
    const startDateInputField = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered is-grouped-multiline"
    }, null, startDateLabel, startDateControl);
    const clearFilterBtn = (0, _elementBuilder.default)("button", {
      "id": "clearDateFilter",
      "class": "button is-danger"
    }, "Clear Filter");
    const clearFilterButtonControl = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, clearFilterBtn);
    const dateSaveBtn = (0, _elementBuilder.default)("button", {
      "id": "setDateFilter",
      "class": "button is-success"
    }, "Set Filter");
    const saveButtonControl = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, dateSaveBtn);
    const cancelBtn = (0, _elementBuilder.default)("button", {
      "id": "cancelModalWindow",
      "class": "button is-danger"
    }, "Cancel");
    const cancelButtonControl = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, cancelBtn);
    const buttonField = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered is-grouped-multiline"
    }, null, saveButtonControl, clearFilterButtonControl, cancelButtonControl);
    const modalContent = (0, _elementBuilder.default)("div", {
      "class": "modal-content box"
    }, null, startDateInputField, endDateInputField, buttonField);
    const modalBackground = (0, _elementBuilder.default)("div", {
      "class": "modal-background"
    }, null);
    const modal = (0, _elementBuilder.default)("div", {
      "id": "modal-dateFilter",
      "class": "modal"
    }, null, modalBackground, modalContent);
    webpage.appendChild(modal);
    this.modalsEventManager();
  },

  modalsEventManager() {
    const clearDateFilterBtn = document.getElementById("clearDateFilter");
    const setDateFilterBtn = document.getElementById("setDateFilter");
    const cancelModalWindowBtn = document.getElementById("cancelModalWindow");
    cancelModalWindowBtn.addEventListener("click", dateFilter.cancelModalWindow);
    setDateFilterBtn.addEventListener("click", dateFilter.setFilter);
    clearDateFilterBtn.addEventListener("click", dateFilter.clearDateFilter);
  },

  openDateFilter() {
    const dateRangeBtn = document.getElementById("dateRangeBtn");
    const dateFilterModal = document.getElementById("modal-dateFilter"); // check if global vars are set. If so, don't toggle color of button

    const dateSet = _heatmapData.default.handleDateFilterGlobalVariables(true);

    if (dateSet !== undefined) {
      dateFilterModal.classList.toggle("is-active");
    } else {
      dateRangeBtn.classList.toggle("is-outlined");
      dateFilterModal.classList.toggle("is-active");
    }
  },

  clearDateFilter() {
    // this function resets global date filter variables in heatmapData.js and replaces date inputs with blank date inputs
    let startDateInput = document.getElementById("startDateInput");
    let endDateInput = document.getElementById("endDateInput");
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const setDateFilterBtn = document.getElementById("setDateFilter");

    _heatmapData.default.handleDateFilterGlobalVariables();

    dateRangeBtn.classList.add("is-outlined");
    startDateInput.replaceWith((0, _elementBuilder.default)("input", {
      "id": "startDateInput",
      "class": "input",
      "type": "date"
    }, null));
    endDateInput.replaceWith((0, _elementBuilder.default)("input", {
      "id": "endDateInput",
      "class": "input",
      "type": "date"
    }, null));
    setDateFilterBtn.removeEventListener("click", dateFilter.setFilter);
    setDateFilterBtn.addEventListener("click", dateFilter.setFilter);

    if (dateFilterModal.classList.contains("is-active")) {
      dateFilterModal.classList.remove("is-active");
    }
  },

  setFilter() {
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const startDateInput = document.getElementById("startDateInput");
    const endDateInput = document.getElementById("endDateInput");
    startDateInput.classList.remove("is-danger");
    endDateInput.classList.remove("is-danger"); // check if date pickers have a valid date

    if (startDateInput.value === "") {
      startDateInput.classList.add("is-danger");
    } else if (endDateInput.value === "") {
      endDateInput.classList.add("is-danger");
    } else {
      // if they do, then set global vars in heatmaps page and close modal
      _heatmapData.default.handleDateFilterGlobalVariables(false, startDateInput.value, endDateInput.value);

      dateFilterModal.classList.toggle("is-active");
    }
  },

  cancelModalWindow() {
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const dateRangeBtn = document.getElementById("dateRangeBtn"); // if global variables are defined already, cancel should not change the class on the date range button

    const dateSet = _heatmapData.default.handleDateFilterGlobalVariables(true);

    if (dateSet !== undefined) {
      dateFilterModal.classList.toggle("is-active");
    } else {
      dateRangeBtn.classList.toggle("is-outlined");
      dateFilterModal.classList.toggle("is-active");
    }
  },

  applydateFilter(startDate, endDate, gameIds, game) {
    // this function examines the game object argument compared to the user-defined start and end dates
    // if the game date is within the two dates specified, then the game ID is pushed to the gameIds array
    // split timestamp and recall only date
    let gameDate = game.timeStamp.split("T")[0];

    if (startDate <= gameDate && gameDate <= endDate) {
      gameIds.push(game.id);
    }
  },

  applydateFilterToSavedHeatmap(startDate, endDate, shots, shotsMatchingFilter) {
    shots.forEach(shot => {
      let shotDate = shot.timeStamp.split("T")[0];

      if (startDate <= shotDate && shotDate <= endDate) {
        shotsMatchingFilter.push(shot);
      }
    });
  }

};
var _default = dateFilter;
exports.default = _default;

},{"./elementBuilder":4,"./heatmapData":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function elBuilder(name, attributesObj, txt, ...children) {
  const el = document.createElement(name);

  for (let attr in attributesObj) {
    el.setAttribute(attr, attributesObj[attr]);
  }

  el.textContent = txt || null;
  children.forEach(child => {
    el.appendChild(child);
  });
  return el;
}

var _default = elBuilder;
exports.default = _default;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _API = _interopRequireDefault(require("./API"));

var _shotData = _interopRequireDefault(require("./shotData"));

var _gameplay = _interopRequireDefault(require("./gameplay"));

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// the purpose of this module is to:
// 1. save all content in the gameplay page (shot and game data) to the database
// 2. immediately clear the gameplay containers of content on save
// 3. immediately reset all global variables in the shotdata file to allow the user to begin saving shots and entering game data for their next game
// 4. affordance for user to recall all data from previous saved game for editing
// 5. include any other functions needed to support the first 4 requirements
// this global variable is used to pass saved shots, ball speed, and aerial boolean to shotData.js during the edit process
let savedGameObject;
let putPromisesEditMode = [];
let postPromisesEditMode = [];
let postPromises = [];
const gameData = {
  gameTypeButtonToggle(e) {
    // this function toggles the "is-selected" class between the game type buttons
    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1];
    let btnClicked = e.target;

    if (!btnClicked.classList.contains("is-selected")) {
      const currentGameTypeBtn = gameTypeBtns.filter(btn => btn.classList.contains("is-selected"));
      currentGameTypeBtn[0].classList.remove("is-selected");
      currentGameTypeBtn[0].classList.remove("is-link");
      btnClicked.classList.add("is-selected");
      btnClicked.classList.add("is-link");
    } else {
      return;
    }
  },

  resetGlobalGameVariables() {
    savedGameObject = undefined;
    putPromisesEditMode = [];
    postPromisesEditMode = [];
    postPromises = [];
  },

  putEditedShots(previouslySavedShotsArr) {
    // PUT first, sicne you can't save a game initially without at least 1 shot
    previouslySavedShotsArr.forEach(shot => {
      // even though it's a PUT, we have to reformat the _fieldX syntax to fieldX
      let shotForPut = {};
      shotForPut.gameId = savedGameObject.id;
      shotForPut.fieldX = shot._fieldX;
      shotForPut.fieldY = shot._fieldY;
      shotForPut.goalX = shot._goalX;
      shotForPut.goalY = shot._goalY;
      shotForPut.ball_speed = Number(shot.ball_speed);
      shotForPut.aerial = shot._aerial;
      shotForPut.timeStamp = shot._timeStamp;
      putPromisesEditMode.push(_API.default.putItem(`shots/${shot.id}`, shotForPut));
    });
    return Promise.all(putPromisesEditMode);
  },

  postNewShotsMadeDuringEditMode(shotsNotYetPostedArr) {
    shotsNotYetPostedArr.forEach(shotObj => {
      let shotForPost = {};
      shotForPost.gameId = savedGameObject.id;
      shotForPost.fieldX = shotObj._fieldX;
      shotForPost.fieldY = shotObj._fieldY;
      shotForPost.goalX = shotObj._goalX;
      shotForPost.goalY = shotObj._goalY;
      shotForPost.ball_speed = Number(shotObj.ball_speed);
      shotForPost.aerial = shotObj._aerial;
      shotForPost.timeStamp = shotObj._timeStamp;
      postPromisesEditMode.push(_API.default.postItem("shots", shotForPost));
    });
    return Promise.all(postPromisesEditMode);
  },

  postNewShots(gameId) {
    // post shots with gameId
    const shotArr = _shotData.default.getShotObjectsForSaving();

    shotArr.forEach(shotObj => {
      let shotForPost = {};
      shotForPost.gameId = gameId;
      shotForPost.fieldX = shotObj._fieldX;
      shotForPost.fieldY = shotObj._fieldY;
      shotForPost.goalX = shotObj._goalX;
      shotForPost.goalY = shotObj._goalY;
      shotForPost.ball_speed = Number(shotObj.ball_speed);
      shotForPost.aerial = shotObj._aerial;
      shotForPost.timeStamp = shotObj._timeStamp;
      postPromises.push(_API.default.postItem("shots", shotForPost));
    });
    return Promise.all(postPromises);
  },

  saveData(gameDataObj, savingEditedGame) {
    // this function first determines if a game is being saved as new, or a previously saved game is being edited
    // if saving an edited game, the game is PUT, all shots saved previously are PUT, and new shots are POSTED
    // if the game is a new game altogether, then the game is POSTED and all shots are POSTED
    // then functions are called to reload the master container and reset global shot data variables
    if (savingEditedGame) {
      // use ID of game stored in global var
      _API.default.putItem(`games/${savedGameObject.id}`, gameDataObj).then(gamePUT => {
        console.log("PUT GAME", gamePUT); // post shots with gameId

        const shotArr = _shotData.default.getShotObjectsForSaving();

        const previouslySavedShotsArr = [];
        const shotsNotYetPostedArr = []; // create arrays for PUT and POST functions (if there's an id in the array, it's been saved to the database before)

        shotArr.forEach(shot => {
          if (shot.id !== undefined) {
            previouslySavedShotsArr.push(shot);
          } else {
            shotsNotYetPostedArr.push(shot);
          }
        }); // call functions to PUT and POST
        // call functions that clear gameplay content and reset global shot/game data variables

        gameData.putEditedShots(previouslySavedShotsArr).then(x => {
          console.log("PUTS:", x); // if no new shots were made, reload. else post new shots

          if (shotsNotYetPostedArr.length === 0) {
            _gameplay.default.loadGameplay();

            _shotData.default.resetGlobalShotVariables();

            gameData.resetGlobalGameVariables();
          } else {
            gameData.postNewShotsMadeDuringEditMode(shotsNotYetPostedArr).then(y => {
              console.log("POSTS:", y);

              _gameplay.default.loadGameplay();

              _shotData.default.resetGlobalShotVariables();

              gameData.resetGlobalGameVariables();
            });
          }
        });
      });
    } else {
      _API.default.postItem("games", gameDataObj).then(game => game.id).then(gameId => {
        gameData.postNewShots(gameId).then(z => {
          console.log("SAVED NEW SHOTS", z);

          _gameplay.default.loadGameplay();

          _shotData.default.resetGlobalShotVariables();

          gameData.resetGlobalGameVariables();
        });
      });
    }
  },

  packageGameData() {
    // get user ID from session storage
    // package each input from game data container into variables
    // TODO: conditional statement to prevent blank score entries
    // TODO: create a modal asking user if they want to save game
    // playerId
    const activeUserId = Number(sessionStorage.getItem("activeUserId")); // game type (1v1, 2v2, 3v3)

    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1];
    let gameType = undefined;
    gameTypeBtns.forEach(btn => {
      if (btn.classList.contains("is-selected")) {
        gameType = btn.textContent;
      }
    }); // game mode (note: did not use boolean in case more game modes are supported in the future)

    const sel_gameMode = document.getElementById("gameModeInput");
    const gameMode = sel_gameMode.value.toLowerCase(); // my team

    const sel_team = document.getElementById("teamInput");
    let teamedUp;

    if (sel_team.value === "No party") {
      teamedUp = false;
    } else {
      teamedUp = true;
    } // scores


    let myScore;
    let theirScore;
    const inpt_myScore = document.getElementById("myScoreInput");
    const inpt_theirScore = document.getElementById("theirScoreInput");
    myScore = Number(inpt_myScore.value);
    theirScore = Number(inpt_theirScore.value); // overtime

    let overtime;
    const sel_overtime = document.getElementById("overtimeInput");

    if (sel_overtime.value === "Overtime") {
      overtime = true;
    } else {
      overtime = false;
    }

    let gameDataObj = {
      "userId": activeUserId,
      "mode": gameMode,
      "type": gameType,
      "party": teamedUp,
      "score": myScore,
      "opp_score": theirScore,
      "overtime": overtime
    }; // determine whether or not a new game or edited game is being saved. If an edited game is being saved, then there is at least one shot saved already, making the return from the shotData function more than 0

    const savingEditedGame = _shotData.default.getInitialNumOfShots();

    if (savingEditedGame !== undefined) {
      gameDataObj.timeStamp = savedGameObject.timeStamp;
      gameData.saveData(gameDataObj, true);
    } else {
      // time stamp if new game
      let timeStamp = new Date();
      gameDataObj.timeStamp = timeStamp;
      gameData.saveData(gameDataObj, false);
    }
  },

  savePrevGameEdits() {
    gameData.packageGameData();
  },

  cancelEditingMode() {
    _gameplay.default.loadGameplay();

    _shotData.default.resetGlobalShotVariables();
  },

  renderEditButtons() {
    // this function removes & replaces edit and save game buttons with "Save Edits" and "Cancel Edits"
    const btn_editPrevGame = document.getElementById("editPrevGame");
    const btn_saveGame = document.getElementById("saveGame"); // in case of lag in fetch, prevent user from double clicking button

    btn_editPrevGame.disabled = true;
    btn_editPrevGame.classList.add("is-loading");
    const btn_cancelEdits = (0, _elementBuilder.default)("button", {
      "id": "cancelEdits",
      "class": "button is-danger"
    }, "Cancel Edits");
    const btn_saveEdits = (0, _elementBuilder.default)("button", {
      "id": "saveEdits",
      "class": "button is-success"
    }, "Save Edits");
    btn_cancelEdits.addEventListener("click", gameData.cancelEditingMode);
    btn_saveEdits.addEventListener("click", gameData.savePrevGameEdits);
    btn_editPrevGame.replaceWith(btn_cancelEdits);
    btn_saveGame.replaceWith(btn_saveEdits);
  },

  renderPrevGame(game) {
    // this function is responsible for rendering the saved game information in the "Enter Game Data" container.
    // it relies on a function in shotData.js to render the shot buttons
    console.log(game); // call function in shotData that calls gamaData.provideShotsToShotData()
    // the function will capture the array of saved shots and render the shot buttons

    _shotData.default.renderShotsButtonsFromPreviousGame(); // overtime


    const sel_overtime = document.getElementById("overtimeInput");

    if (game.overtime) {
      sel_overtime.value = "Overtime";
    } else {
      sel_overtime.value = "No overtime";
    } // my team


    const sel_team = document.getElementById("teamInput");

    if (game.party === false) {
      sel_team.value = "No party";
    } else {
      sel_team.value = "Party";
    } // score


    const inpt_myScore = document.getElementById("myScoreInput");
    const inpt_theirScore = document.getElementById("theirScoreInput");
    inpt_myScore.value = game.score;
    inpt_theirScore.value = game.opp_score; // game type (1v1, 2v2, 3v3)

    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");

    if (game.type === "3v3") {
      btn_3v3.classList.add("is-selected");
      btn_3v3.classList.add("is-link"); // 2v2 is the default

      btn_2v2.classList.remove("is-selected");
      btn_2v2.classList.remove("is-link");
    } else if (game.type === "2v2") {
      btn_2v2.classList.add("is-selected");
      btn_2v2.classList.add("is-link");
    } else {
      btn_1v1.classList.add("is-selected");
      btn_1v1.classList.add("is-link");
      btn_2v2.classList.remove("is-selected");
      btn_2v2.classList.remove("is-link");
    } // game mode


    const sel_gameMode = document.getElementById("gameModeInput");

    if (game.mode = "competitive") {
      sel_gameMode.value = "Competitive";
    } else {
      sel_gameMode.value = "Casual";
    }
  },

  provideShotsToShotData() {
    // this function provides the shots for rendering to shotData
    return savedGameObject;
  },

  editPrevGame() {
    // fetch content from most recent game saved to be rendered
    // TODO: create a modal asking user if they want to edit previous game
    const activeUserId = sessionStorage.getItem("activeUserId");

    _API.default.getSingleItem("users", `${activeUserId}?_embed=games`).then(user => {
      if (user.games.length === 0) {
        alert("No games have been saved by this user");
      } else {
        // get max game id (which is the most recent game saved)
        const recentGameId = user.games.reduce((max, obj) => obj.id > max ? obj.id : max, user.games[0].id); // fetch most recent game and embed shots

        _API.default.getSingleItem("games", `${recentGameId}?_embed=shots`).then(gameObj => {
          _gameplay.default.loadGameplay();

          _shotData.default.resetGlobalShotVariables();

          gameData.renderEditButtons();
          savedGameObject = gameObj;
          gameData.renderPrevGame(gameObj);
        });
      }
    });
  }

};
var _default = gameData;
exports.default = _default;

},{"./API":2,"./elementBuilder":4,"./gameplay":6,"./shotData":15}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _shotData = _interopRequireDefault(require("./shotData"));

var _gameData = _interopRequireDefault(require("./gameData"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
const gameplay = {
  loadGameplay() {
    webpage.innerHTML = null; // const xButton = elBuilder("button", { "class": "delete" });
    // xButton.addEventListener("click", closeBox, event); // button will display: none on parent container
    // const headerInfo = elBuilder("div", { "class": "notification is-info" }, "Create and save shots - then save the game record.", xButton);
    // webpage.appendChild(headerInfo);

    this.buildShotContent();
    this.buildGameContent();
    this.gameplayEventManager();
  },

  buildShotContent() {
    // this function builds shot containers and adds container content
    // container title
    const shotTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item title is-4"
    }, "Enter Shot Data");
    const shotTitleContainer = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, shotTitle); // new shot and save shot buttons

    const newShot = (0, _elementBuilder.default)("button", {
      "id": "newShot",
      "class": "button is-success"
    }, "New Shot");
    const saveShot = (0, _elementBuilder.default)("button", {
      "id": "saveShot",
      "class": "button is-success"
    }, "Save Shot");
    const cancelShot = (0, _elementBuilder.default)("button", {
      "id": "cancelShot",
      "class": "button is-danger"
    }, "Cancel Shot");
    const shotButtons = (0, _elementBuilder.default)("div", {
      "id": "shotControls",
      "class": "level-item buttons"
    }, null, newShot, saveShot, cancelShot);
    const alignShotButtons = (0, _elementBuilder.default)("div", {
      "class": "level-left"
    }, null, shotButtons);
    const shotButtonContainer = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, alignShotButtons); // ball speed input and aerial select

    const ballSpeedInputTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, "Ball speed (mph):");
    const ballSpeedInput = (0, _elementBuilder.default)("input", {
      "id": "ballSpeedInput",
      "class": "level-item input",
      "type": "number",
      "placeholder": "enter ball speed"
    });
    const aerialOption1 = (0, _elementBuilder.default)("option", {}, "Standard");
    const aerialOption2 = (0, _elementBuilder.default)("option", {}, "Aerial");
    const aerialSelect = (0, _elementBuilder.default)("select", {
      "id": "aerialInput",
      "class": "select"
    }, null, aerialOption1, aerialOption2);
    const aerialSelectParent = (0, _elementBuilder.default)("div", {
      "class": "select"
    }, null, aerialSelect);
    const aerialControl = (0, _elementBuilder.default)("div", {
      "class": "control level-item"
    }, null, aerialSelectParent);
    const shotDetails = (0, _elementBuilder.default)("div", {
      "class": "level-left"
    }, null, ballSpeedInputTitle, ballSpeedInput, aerialControl);
    const shotDetailsContainer = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, shotDetails); // field and goal images (note field-img is clipped to restrict click area coordinates in later function.
    // goal-img uses an x/y formula for click area coordinates restriction, since it's a rectangle)
    // additionally, field and goal are not aligned with level-left or level-right - it's a direct level --> level-item for centering

    const fieldImage = (0, _elementBuilder.default)("img", {
      "id": "field-img",
      "src": "../images/DFH_stadium_790x540_no_bg_90deg.png",
      "alt": "DFH Stadium",
      "style": "height: 100%; width: 100%; object-fit: contain"
    });
    const fieldImageBackground = (0, _elementBuilder.default)("img", {
      "id": "field-img-bg",
      "src": "../images/DFH_stadium_790x540_no_bg_90deg.png",
      "alt": "DFH Stadium",
      "style": "height: 100%; width: 100%; object-fit: contain"
    });
    const fieldImageParent = (0, _elementBuilder.default)("div", {
      "id": "field-img-parent",
      "class": ""
    }, null, fieldImageBackground, fieldImage);
    const alignField = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, null, fieldImageParent);
    const goalImage = (0, _elementBuilder.default)("img", {
      "id": "goal-img",
      "src": "../images/RL_goal_cropped_no_bg_BW.png",
      "alt": "DFH Stadium",
      "style": "height: 100%; width: 100%; object-fit: contain"
    });
    const goalImageParent = (0, _elementBuilder.default)("div", {
      "id": "goal-img-parent",
      "class": "level"
    }, null, goalImage);
    const alignGoal = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, null, goalImageParent);
    const shotCoordinatesContainer = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, alignField, alignGoal); // parent container holding all shot information

    const parentShotContainer = (0, _elementBuilder.default)("div", {
      "class": "container box"
    }, null, shotTitleContainer, shotButtonContainer, shotDetailsContainer, shotCoordinatesContainer); // append shots container to page

    webpage.appendChild(parentShotContainer);
  },

  buildGameContent() {
    // this function creates game content containers (team, game type, game mode, etc.)
    // container title
    const gameTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item title is-4"
    }, "Enter Game Data");
    const titleContainer = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, gameTitle); // ---------- top container
    // 1v1/2v2/3v3 buttons (note: control class is used with field to adhere buttons together)

    const gameType3v3 = (0, _elementBuilder.default)("div", {
      "id": "_3v3",
      "class": "button"
    }, "3v3");
    const gameType3v3Control = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, gameType3v3);
    const gameType2v2 = (0, _elementBuilder.default)("div", {
      "id": "_2v2",
      "class": "button is-selected is-link"
    }, "2v2");
    const gameType2v2Control = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, gameType2v2);
    const gameType1v1 = (0, _elementBuilder.default)("div", {
      "id": "_1v1",
      "class": "button"
    }, "1v1");
    const gameType1v1Control = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, gameType1v1);
    const gameTypeButtonField = (0, _elementBuilder.default)("div", {
      "class": "field has-addons"
    }, null, gameType3v3Control, gameType2v2Control, gameType1v1Control);
    const gameTypeButtonContainer = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, null, gameTypeButtonField); // game mode select

    const modeOption1 = (0, _elementBuilder.default)("option", {}, "Casual");
    const modeOption2 = (0, _elementBuilder.default)("option", {}, "Competitive");
    const modeSelect = (0, _elementBuilder.default)("select", {
      "id": "gameModeInput",
      "class": "select"
    }, null, modeOption1, modeOption2);
    const modeSelectParent = (0, _elementBuilder.default)("div", {
      "class": "select"
    }, null, modeSelect);
    const modeControl = (0, _elementBuilder.default)("div", {
      "class": "control level-item"
    }, null, modeSelectParent); // team select

    const teamOption1 = (0, _elementBuilder.default)("option", {}, "No party");
    const teamOption2 = (0, _elementBuilder.default)("option", {}, "Party");
    const teamSelect = (0, _elementBuilder.default)("select", {
      "id": "teamInput",
      "class": "select"
    }, null, teamOption1, teamOption2);
    const teamSelectParent = (0, _elementBuilder.default)("div", {
      "class": "select"
    }, null, teamSelect);
    const teamControl = (0, _elementBuilder.default)("div", {
      "class": "control level-item"
    }, null, teamSelectParent); // overtime select

    const overtimeOption1 = (0, _elementBuilder.default)("option", {}, "No overtime");
    const overtimeOption2 = (0, _elementBuilder.default)("option", {}, "Overtime");
    const overtimeSelect = (0, _elementBuilder.default)("select", {
      "id": "overtimeInput",
      "class": "select"
    }, null, overtimeOption1, overtimeOption2);
    const overtimeSelectParent = (0, _elementBuilder.default)("div", {
      "class": "select"
    }, null, overtimeSelect);
    const overtimeControl = (0, _elementBuilder.default)("div", {
      "class": "control level-item"
    }, null, overtimeSelectParent); // ---------- bottom container
    // score inputs
    // ****Note inline styling of input widths

    const myScoreInputTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, "Score:");
    const myScoreInput = (0, _elementBuilder.default)("input", {
      "id": "myScoreInput",
      "class": "input",
      "type": "number",
      "placeholder": "my team's score"
    });
    const myScoreControl = (0, _elementBuilder.default)("div", {
      "class": "level-item control"
    }, null, myScoreInput);
    const theirScoreInputTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, "Opponent's score:");
    const theirScoreInput = (0, _elementBuilder.default)("input", {
      "id": "theirScoreInput",
      "class": "input",
      "type": "number",
      "placeholder": "their team's score"
    });
    const theirScoreControl = (0, _elementBuilder.default)("div", {
      "class": "level-item control"
    }, null, theirScoreInput);
    const scoreInputContainer = (0, _elementBuilder.default)("div", {
      "class": "level-left"
    }, null, myScoreInputTitle, myScoreControl, theirScoreInputTitle, theirScoreControl); // edit/save game buttons

    const editPreviousGame = (0, _elementBuilder.default)("button", {
      "id": "editPrevGame",
      "class": "button is-danger"
    }, "Edit Previous Game");
    const saveGame = (0, _elementBuilder.default)("button", {
      "id": "saveGame",
      "class": "button is-success"
    }, "Save Game");
    const gameButtonAlignment = (0, _elementBuilder.default)("div", {
      "class": "buttons level-item"
    }, null, saveGame, editPreviousGame);
    const gameButtonContainer = (0, _elementBuilder.default)("div", {
      "class": "level-right"
    }, null, gameButtonAlignment); // append to webpage

    const gameContainerTop = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, gameTypeButtonContainer, modeControl, teamControl, overtimeControl);
    const gameContainerBottom = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, scoreInputContainer, gameButtonContainer);
    const parentGameContainer = (0, _elementBuilder.default)("div", {
      "class": "container box"
    }, null, titleContainer, gameContainerTop, gameContainerBottom);
    webpage.appendChild(parentGameContainer);
  },

  gameplayEventManager() {
    // buttons
    const btn_newShot = document.getElementById("newShot");
    const btn_saveShot = document.getElementById("saveShot");
    const btn_cancelShot = document.getElementById("cancelShot");
    const btn_editPrevGame = document.getElementById("editPrevGame");
    const btn_saveGame = document.getElementById("saveGame");
    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1]; // add listeners

    btn_newShot.addEventListener("click", _shotData.default.createNewShot);
    btn_saveShot.addEventListener("click", _shotData.default.saveShot);
    btn_cancelShot.addEventListener("click", _shotData.default.cancelShot);
    btn_saveGame.addEventListener("click", _gameData.default.packageGameData);
    gameTypeBtns.forEach(btn => btn.addEventListener("click", _gameData.default.gameTypeButtonToggle));
    btn_editPrevGame.addEventListener("click", _gameData.default.editPrevGame);
  }

};
var _default = gameplay;
exports.default = _default;

},{"./elementBuilder":4,"./gameData":5,"./shotData":15}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _heatmap = _interopRequireDefault(require("../lib/node_modules/heatmap.js/build/heatmap.js"));

var _API = _interopRequireDefault(require("./API.js"));

var _elementBuilder = _interopRequireDefault(require("./elementBuilder.js"));

var _dateFilter = _interopRequireDefault(require("./dateFilter.js"));

var _heatmapFeedback = _interopRequireDefault(require("./heatmapFeedback"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ID of setInterval function used to monitor container width and repaint heatmap if container width changes
let intervalId; // global variable to store fetched shots

let globalShotsArr;
let joinTableArr = []; // global variable used with ball speed filter on heatmaps

let configHeatmapWithBallspeed = false; // global variables used with date range filter

let startDate;
let endDate; // FIXME: rendering a saved heatmap with date filter sometimes bugs out

const heatmapData = {
  getUserShots() {
    // this function removes an existing heatmap if necessary and then determines whether
    // to call the basic heatmap or saved heatmap functions
    const fieldContainer = document.getElementById("field-img-parent");
    const goalContainer = document.getElementById("goal-img-parent");
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const heatmapName = heatmapDropdown.value;
    const fieldHeatmapCanvas = fieldContainer.childNodes[2];
    const goalHeatmapCanvas = goalContainer.childNodes[1]; // if there's already a heatmap loaded, remove it before continuing

    if (fieldHeatmapCanvas !== undefined) {
      fieldHeatmapCanvas.remove();
      goalHeatmapCanvas.remove();

      if (heatmapName === "Basic Heatmap") {
        heatmapData.fetchBasicHeatmapData();
      } else {
        heatmapData.fetchSavedHeatmapData();
      }
    } else {
      if (heatmapName === "Basic Heatmap") {
        heatmapData.fetchBasicHeatmapData();
      } else {
        heatmapData.fetchSavedHeatmapData();
      }
    }
  },

  fetchBasicHeatmapData() {
    // this function goes to the database and retrieves shots that meet specific filters (all shots fetched if )
    let gameIds_date = [];
    let gameIds_result = [];
    let gameIds = []; // array that contains game ID values passing both the date and game result filters

    const gameResultFilter = document.getElementById("filter-gameResult").value;
    const gameURLextension = heatmapData.applyGameFilters();

    _API.default.getAll(gameURLextension).then(games => {
      games.forEach(game => {
        // the date filter and game results filters cannot be applied in the JSON server URL, so the filters are
        // called here. Each function populates an array with game IDs that match the filter requirements.
        // a filter method is then used to collect all matching game IDs from the two arrays (i.e. a game that passed
        // the requirements of both filters)
        // NOTE: if start date is not defined, the result filter is the only function called, and it is passed the third array
        if (startDate !== undefined) {
          _dateFilter.default.applydateFilter(startDate, endDate, gameIds_date, game);

          heatmapData.applyGameResultFilter(gameResultFilter, gameIds_result, game);
        } else {
          heatmapData.applyGameResultFilter(gameResultFilter, gameIds, game);
        }
      });

      if (startDate !== undefined) {
        gameIds = gameIds_date.filter(id => gameIds_result.includes(id));
        return gameIds;
      }

      return gameIds;
    }).then(gameIds => {
      if (gameIds.length === 0) {
        alert("Sorry! Either no shots have been saved yet or no games match the current filters. Visit the Gameplay page to get started or to add more shots.");
        return;
      } else {
        const shotURLextension = heatmapData.applyShotFilters(gameIds);

        _API.default.getAll(shotURLextension).then(shots => {
          if (shots.length === 0) {
            alert("Sorry! No shots match the current filters. Visit the Gameplay page to get started or add to more shots.");
            return;
          } else {
            globalShotsArr = shots;
            heatmapData.buildFieldHeatmap(shots);
            heatmapData.buildGoalHeatmap(shots);

            _heatmapFeedback.default.loadFeedback(shots); // intervalId = setInterval(heatmapData.getActiveOffsets, 500);

          }
        });
      }
    });
  },

  fetchSavedHeatmapData() {
    // this function, and its counterpart fetchSavedShotsUsingJoinTables render an already-saved heatmap though these steps:
    // 1. getting the heatmap name from the dropdown value
    // 2. using the name to find the childNodes index of the dropdown value (i.e. which HTML <option>) and get its ID
    // 3. fetch all shot_heatmap join tables with matching heatmap ID
    // 4. fetch shots using shot IDs from join tables
    // 5. render heatmap by calling build functions
    // step 1: get name of heatmap
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value; // step 2: use name to get heatmap ID stored in HTML option element

    let currentHeatmapId;
    heatmapDropdown.childNodes.forEach(child => {
      if (child.textContent === currentDropdownValue) {
        currentHeatmapId = child.id.slice(8);
      }
    }); // step 3: fetch join tables

    _API.default.getAll(`shot_heatmap?heatmapId=${currentHeatmapId}`).then(joinTables => heatmapData.fetchSavedShotsUsingJoinTables(joinTables) // step 5: pass shots to buildFieldHeatmap() and buildGoalHeatmap()
    .then(shots => {
      // apply date filter if filter has been set
      if (startDate !== undefined) {
        let shotsMatchingFilter = [];

        _dateFilter.default.applydateFilterToSavedHeatmap(startDate, endDate, shots, shotsMatchingFilter);

        heatmapData.buildFieldHeatmap(shotsMatchingFilter);
        heatmapData.buildGoalHeatmap(shotsMatchingFilter);
        globalShotsArr = shotsMatchingFilter; // IMPORTANT! prevents error in heatmap save when rendering saved map after rendering basic heatmap
      } else {
        heatmapData.buildFieldHeatmap(shots);
        heatmapData.buildGoalHeatmap(shots);
        globalShotsArr = shots; // IMPORTANT! prevents error in heatmap save when rendering saved map after rendering basic heatmap

        _heatmapFeedback.default.loadFeedback(shots);
      }

      joinTableArr = [];
    }));
  },

  fetchSavedShotsUsingJoinTables(joinTables) {
    // see notes on fetchSavedHeatmapData()
    joinTables.forEach(table => {
      // step 4. then fetch using each shotId in the join tables
      joinTableArr.push(_API.default.getSingleItem("shots", table.shotId));
    });
    return Promise.all(joinTableArr);
  },

  applyGameFilters() {
    // NOTE: game result filter (victory/defeat) cannot be applied in this function and is applied after the fetch
    const activeUserId = sessionStorage.getItem("activeUserId");
    const gameModeFilter = document.getElementById("filter-gameMode").value;
    const gametypeFilter = document.getElementById("filter-gameType").value;
    const overtimeFilter = document.getElementById("filter-overtime").value;
    const teamStatusFilter = document.getElementById("filter-teamStatus").value;
    let URL = "games";
    URL += `?userId=${activeUserId}`; // game mode

    if (gameModeFilter === "Competitive") {
      URL += "&mode=competitive";
    } else if (gameModeFilter === "Casual") {
      URL += "&mode=casual";
    } // game type


    if (gametypeFilter === "3v3") {
      URL += "&type=3v3";
    } else if (gametypeFilter === "2v2") {
      URL += "&type=2v2";
    } else if (gametypeFilter === "1v1") {
      URL += "&type=1v1";
    } // overtime


    if (overtimeFilter === "OT") {
      URL += "&overtime=true";
    } else if (overtimeFilter === "No OT") {
      URL += "&overtime=false";
    } // team status


    if (teamStatusFilter === "No party") {
      URL += "&party=false";
    } else if (teamStatusFilter === "Party") {
      URL += "&party=true";
    }

    return URL;
  },

  applyGameResultFilter(gameResultFilter, gameIds, game) {
    // if victory, then check for game's score vs game's opponent score
    // if the filter isn't selected at all, push all game IDs to gameIds array
    if (gameResultFilter === "Victory") {
      if (game.score > game.opp_score) {
        gameIds.push(game.id);
      } else {
        return;
      }
    } else if (gameResultFilter === "Defeat") {
      if (game.score < game.opp_score) {
        gameIds.push(game.id);
      } else {
        return;
      }
    } else {
      gameIds.push(game.id);
    }
  },

  applyShotFilters(gameIds) {
    const shotTypeFilter = document.getElementById("filter-shotType").value;
    let URL = "shots"; // game ID
    // for each gameId, append URL. Append & instead of ? once first gameId is added to URL

    if (gameIds.length > 0) {
      let gameIdCount = 0;
      gameIds.forEach(id => {
        if (gameIdCount < 1) {
          URL += `?gameId=${id}`;
          gameIdCount++;
        } else {
          URL += `&gameId=${id}`;
        }
      });
    } // else statement is handled in fetchBasicHeatmapData()
    // shot type


    if (shotTypeFilter === "Aerial") {
      URL += "&aerial=true";
    } else if (shotTypeFilter === "Standard") {
      URL += "&aerial=false";
    }

    return URL;
  },

  buildFieldHeatmap(shots) {
    console.log("Array of shots", shots); // create field heatmap with configuration

    const fieldContainer = document.getElementById("field-img-parent");
    let varWidth = fieldContainer.offsetWidth;
    let varHeight = fieldContainer.offsetHeight;
    let fieldConfig = heatmapData.getFieldConfig(fieldContainer);
    let fieldHeatmapInstance;
    fieldHeatmapInstance = _heatmap.default.create(fieldConfig);
    let fieldDataPoints = [];
    shots.forEach(shot => {
      let x_ = Number((shot.fieldX * varWidth).toFixed(0));
      let y_ = Number((shot.fieldY * varHeight).toFixed(0));
      let value_ = 1; // set value as ball speed if speed filter is selected

      if (configHeatmapWithBallspeed) {
        value_ = shot.ball_speed;
      }

      let fieldObj = {
        x: x_,
        y: y_,
        value: value_
      };
      fieldDataPoints.push(fieldObj);
    });
    const fieldData = {
      max: 1,
      min: 0,
      data: fieldDataPoints
    }; // set max value as max ball speed in shots, if filter is selected

    if (configHeatmapWithBallspeed) {
      let maxBallSpeed = shots.reduce((max, shot) => shot.ball_speed > max ? shot.ball_speed : max, shots[0].ball_speed);
      fieldData.max = maxBallSpeed;
    }

    fieldHeatmapInstance.setData(fieldData);
    let initialWidth = varWidth;

    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = setInterval(function () {
        heatmapData.getActiveOffsets(fieldContainer, initialWidth, shots);
      }, 500);
    } else {
      intervalId = setInterval(function () {
        heatmapData.getActiveOffsets(fieldContainer, initialWidth, shots);
      }, 500);
    }
  },

  getActiveOffsets(fieldContainer, initialWidth, shots) {
    // this function evaluates the width of the heatmap container at 0.5 second intervals. If the width has changed,
    // then the heatmap canvas is repainted to fit within the container limits
    let width = initialWidth;
    let captureWidth = fieldContainer.offsetWidth; //evaluate container width after 0.5 seconds vs initial container width

    if (captureWidth === width) {
      console.log("unchanged");
    } else {
      width = captureWidth;
      console.log("new width", width); // remove current heatmaps

      const heatmapCanvasArr = document.querySelectorAll(".heatmap-canvas");
      heatmapCanvasArr[0].remove();
      heatmapCanvasArr[1].remove(); // repaint same heatmap instance

      heatmapData.buildFieldHeatmap(shots);
      heatmapData.buildGoalHeatmap(shots);
    }
  },

  buildGoalHeatmap(shots) {
    // create goal heatmap with configuration
    const goalContainer = document.getElementById("goal-img-parent");
    let varGoalWidth = goalContainer.offsetWidth;
    let varGoalHeight = goalContainer.offsetHeight;
    let goalConfig = heatmapData.getGoalConfig(goalContainer);
    let GoalHeatmapInstance;
    GoalHeatmapInstance = _heatmap.default.create(goalConfig);
    let goalDataPoints = [];
    shots.forEach(shot => {
      let x_ = Number((shot.goalX * varGoalWidth).toFixed(0));
      let y_ = Number((shot.goalY * varGoalHeight).toFixed(0));
      let value_ = 1; // set value as ball speed if speed filter is selected

      if (configHeatmapWithBallspeed) {
        value_ = shot.ball_speed;
      }

      let goalObj = {
        x: x_,
        y: y_,
        value: value_
      };
      goalDataPoints.push(goalObj);
    });
    const goalData = {
      max: 1,
      min: 0,
      data: goalDataPoints // set max value as max ball speed in shots, if filter is selected

    };

    if (configHeatmapWithBallspeed) {
      let maxBallSpeed = shots.reduce((max, shot) => shot.ball_speed > max ? shot.ball_speed : max, shots[0].ball_speed);
      goalData.max = maxBallSpeed;
    }

    GoalHeatmapInstance.setData(goalData);
  },

  getFieldConfig(fieldContainer) {
    // Ideal radius is about 25px at 550px width, or 4.545%
    return {
      container: fieldContainer,
      radius: 0.045454545 * fieldContainer.offsetWidth,
      maxOpacity: .6,
      minOpacity: 0,
      blur: .85
    };
  },

  getGoalConfig(goalContainer) {
    // Ideal radius is about 35px at 550px width, or 6.363%
    return {
      container: goalContainer,
      radius: .063636363 * goalContainer.offsetWidth,
      maxOpacity: .6,
      minOpacity: 0,
      blur: .85
    };
  },

  ballSpeedMax() {
    // this button function callback (it's a filter) changes a boolean global variable that determines the min and max values
    // used when rendering the heatmaps (see buildFieldHeatmap() and buildGoalHeatmap())
    const ballSpeedBtn = document.getElementById("ballSpeedBtn");

    if (configHeatmapWithBallspeed) {
      configHeatmapWithBallspeed = false;
      ballSpeedBtn.classList.toggle("is-outlined");
    } else {
      configHeatmapWithBallspeed = true;
      ballSpeedBtn.classList.toggle("is-outlined");
    }
  },

  saveHeatmap() {
    // this function is responsible for saving a heatmap object with a name, userId, and date - then making join tables with heatmapId and each shotId
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const saveInput = document.getElementById("saveHeatmapInput");
    const fieldContainer = document.getElementById("field-img-parent");
    const activeUserId = Number(sessionStorage.getItem("activeUserId"));
    const saveHeatmapBtn = document.getElementById("saveHeatmapBtn");
    let heatmapNameIsUnique = true;
    saveHeatmapBtn.disabled = true; // immediately disable save button to prevent multiple clicks

    const heatmapTitle = saveInput.value;
    const fieldHeatmapCanvas = fieldContainer.childNodes[2]; // 1. heatmap must have title & the title cannot be "Save successful!" or "Basic Heatmap" or "Cannot save prior heatmap" or "No title provided" or "Heatmap name not unique"
    // 2. there must be a heatmap canvas loaded on the page
    // 3. (see second if statement) the save button will respond work if the user is trying to save an already-saved heatmap

    if (heatmapTitle.length > 0 && heatmapTitle !== "Save successful" && heatmapTitle !== "Basic Heatmap" && heatmapTitle !== "Cannot save prior heatmap" && heatmapTitle !== "Cannot save prior heatmap" && heatmapTitle !== "Heatmap name not unique" && heatmapTitle !== "No title provided" && heatmapTitle !== "No heatmap loaded" && fieldHeatmapCanvas !== undefined) {
      if (heatmapDropdown.value !== "Basic Heatmap") {
        saveInput.classList.add("is-danger");
        saveInput.value = "Cannot save prior heatmap";
        saveHeatmapBtn.disabled = false;
        return;
      } else {
        // check for unique heatmap name - if it's unique then save the heatmap and join tables
        _API.default.getAll(`heatmaps?userId=${activeUserId}`).then(heatmaps => {
          heatmaps.forEach(heatmap => {
            if (heatmap.name.toLowerCase() === heatmapTitle.toLowerCase()) {
              heatmapNameIsUnique = false; // if any names match, variable becomes false
            }
          }); // if name is unique - all conditions met - save heatmap

          if (heatmapNameIsUnique) {
            saveInput.classList.remove("is-danger");
            saveInput.classList.add("is-success");
            heatmapData.saveHeatmapObject(heatmapTitle, activeUserId).then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(x => {
              console.log("join tables saved", x); // empty the temporary global array used with Promise.all

              joinTableArr = []; // append newly created heatmap as option element in select dropdown

              heatmapDropdown.appendChild((0, _elementBuilder.default)("option", {
                "id": `heatmap-${heatmapObj.id}`
              }, `${heatmapObj.timeStamp.split("T")[0]}: ${heatmapObj.name}`));
              saveInput.value = "Save successful";
              saveHeatmapBtn.disabled = false;
            }));
          } else {
            saveInput.classList.add("is-danger");
            saveInput.value = "Heatmap name not unique";
            saveHeatmapBtn.disabled = false;
          }
        });
      }
    } else {
      saveInput.classList.add("is-danger");

      if (heatmapTitle.length === 0) {
        saveInput.value = "No title provided";
        saveHeatmapBtn.disabled = false;
      } else if (fieldHeatmapCanvas === undefined) {
        saveInput.value = "No heatmap loaded";
        saveHeatmapBtn.disabled = false;
      } else {
        saveHeatmapBtn.disabled = false;
      }
    }
  },

  saveHeatmapObject(heatmapTitle, activeUserId) {
    // this function saves a heatmap object with the user-provided name, the userId, and the current date/time
    let timeStamp = new Date();
    const heatmapObj = {
      name: heatmapTitle,
      userId: activeUserId,
      timeStamp: timeStamp
    };
    return _API.default.postItem("heatmaps", heatmapObj);
  },

  saveJoinTables(heatmapObj) {
    console.log("globalshotsarray", globalShotsArr);
    globalShotsArr.forEach(shot => {
      let joinTableObj = {
        shotId: shot.id,
        heatmapId: heatmapObj.id
      };
      joinTableArr.push(_API.default.postItem("shot_heatmap", joinTableObj));
    });
    return Promise.all(joinTableArr);
  },

  deleteHeatmap() {
    // this function is the logic that prevents the user from deleting a heatmap in one click.
    // a second delete button and a cancel button are rendered before a delete is confirmed
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;

    if (currentDropdownValue === "Basic Heatmap") {
      return;
    } else {
      const deleteHeatmapBtn = document.getElementById("deleteHeatmapBtn");
      const confirmDeleteBtn = (0, _elementBuilder.default)("button", {
        "class": "button is-danger"
      }, "Confirm Delete");
      const rejectDeleteBtn = (0, _elementBuilder.default)("button", {
        "class": "button is-dark"
      }, "Cancel");
      const DeleteControl = (0, _elementBuilder.default)("div", {
        "id": "deleteControl",
        "class": "buttons"
      }, null, confirmDeleteBtn, rejectDeleteBtn);
      deleteHeatmapBtn.replaceWith(DeleteControl);
      confirmDeleteBtn.addEventListener("click", heatmapData.confirmHeatmapDeletion);
      rejectDeleteBtn.addEventListener("click", heatmapData.rejectHeatmapDeletion);
    }
  },

  rejectHeatmapDeletion() {
    // this function re-renders the primary delete button
    const DeleteControl = document.getElementById("deleteControl");
    const deleteHeatmapBtn = (0, _elementBuilder.default)("button", {
      "id": "deleteHeatmapBtn",
      "class": "button is-danger"
    }, "Delete Heatmap");
    DeleteControl.replaceWith(deleteHeatmapBtn);
    deleteHeatmapBtn.addEventListener("click", heatmapData.deleteHeatmap);
  },

  confirmHeatmapDeletion() {
    // this function will delete the selected heatmap option in the dropdown list and remove all shot_heatmap join tables
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;
    heatmapDropdown.childNodes.forEach(child => {
      if (child.textContent === currentDropdownValue) {
        child.remove();
        heatmapData.deleteHeatmapObjectandJoinTables(child.id).then(() => {
          heatmapDropdown.value = "Basic Heatmap";
          heatmapData.rejectHeatmapDeletion();
        });
      } else {
        return;
      }
    });
  },

  deleteHeatmapObjectandJoinTables(heatmapId) {
    const activeUserId = sessionStorage.getItem("activeUserId");
    return _API.default.deleteItem("heatmaps", `${heatmapId.slice(8)}?userId=${activeUserId}`);
  },

  handleBallSpeedGlobalVariables() {
    // this function is used by the reset filters button and navbar heatmaps tab to force the ball speed filter off
    configHeatmapWithBallspeed = false;
  },

  handleDateFilterGlobalVariables(returnBoolean, startDateInput, endDateInput) {
    // this function is used to SET the date filter global variables on this page or CLEAR them
    // if the 1. page is reloaded or 2. the "reset filters" button is clicked
    // the dateFilter.js cancel button requests a global var to determine how to handle button color
    if (returnBoolean) {
      return startDate;
    } // if no input values are provided, that means the variables need to be reset and the date
    // filter button should be outlined - else set global vars for filter


    if (startDateInput === undefined) {
      startDate = undefined;
      endDate = undefined;
    } else {
      startDate = startDateInput;
      endDate = endDateInput;
    }
  },

  clearHeatmapRepaintInterval() {
    // this function is used when navigating between pages so that the webpage doesn't continue running the heatmap container width tracker
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  }

};
var _default = heatmapData;
exports.default = _default;

},{"../lib/node_modules/heatmap.js/build/heatmap.js":1,"./API.js":2,"./dateFilter.js":3,"./elementBuilder.js":4,"./heatmapFeedback":8}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _API = _interopRequireDefault(require("./API"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const feedback = {
  loadFeedback(shots) {
    // first, use the shots we have to fetch the games they're associated with
    let gameIds = [];
    shots.forEach(shot => {
      gameIds.push(shot.gameId);
    }); // remove duplicate game IDs

    gameIds = gameIds.filter((item, idx) => {
      return gameIds.indexOf(item) == idx;
    });
    this.fetchGames(gameIds).then(games => this.calculateFeedback(shots, games));
  },

  fetchGames(gameIds) {
    let games = [];
    gameIds.forEach(gameId => {
      games.push(_API.default.getSingleItem("games", gameId));
    });
    return Promise.all(games);
  },

  calculateFeedback(shots, games) {
    let feedbackResults = {}; // get heatmap date generated

    let now = new Date().toLocaleString();
    feedbackResults.now = now; // convert game dates out of Z time to get local timezone accuracy

    let gameTimes = [];
    games.forEach(game => {
      gameTimes.push(new Date(game.timeStamp).toLocaleString().split(",")[0]);
    }); // sort array of dates from

    gameTimes.sort((a, b) => {
      return Number(new Date(a)) - Number(new Date(b));
    }); // get range of dates on games (max and min)

    feedbackResults.lastGame = gameTimes.pop();
    feedbackResults.firstGame = gameTimes.shift(); // get average field x,y coordinate of player based on shots and give player feedback

    let sumX = 0;
    let sumY = 0;
    let avgX;
    let avgY;
    shots.forEach(shot => {
      sumX += shot.fieldX;
      sumY += shot.fieldY;
    });
    avgX = sumX / shots.length;
    avgY = sumY / shots.length;
    let fieldPosition;

    if (avgX < 0.15) {
      fieldPosition = "Keeper";
    } else if (0.15 <= avgX && avgX <= 0.30) {
      fieldPosition = "Sweeper";
    } else if (0.30 <= avgX && avgX < 0.45 && avgY <= 0.40) {
      fieldPosition = "Left Fullback";
    } else if (0.30 <= avgX && avgX < 0.45 && 0.60 <= avgY) {
      fieldPosition = "Right Fullback";
    } else if (0.30 <= avgX && avgX <= 0.45) {
      fieldPosition = "Center Fullback";
    } else if (0.45 <= avgX && avgX < 0.60 && avgY <= 0.40) {
      fieldPosition = "Left Halfback";
    } else if (0.45 <= avgX && avgX < 0.60 && 0.60 <= avgY) {
      fieldPosition = "Right Halfback";
    } else if (0.45 <= avgX && avgX <= 0.60) {
      fieldPosition = "Center Halfback";
    } else if (0.60 <= avgX && avgX < 0.75 && avgY <= 0.50) {
      fieldPosition = "Left Forward";
    } else if (0.60 <= avgX && avgX < 0.75 && 0.50 < avgY) {
      fieldPosition = "Right Forward";
    } else if (0.75 <= avgX) {
      fieldPosition = "Striker";
    }

    feedbackResults.fieldPosition = fieldPosition; // determine players that compliment the player's style

    let complementA;
    let complementB;

    if (fieldPosition === "Keeper") {
      complementA = "Left Forward";
      complementB = "Right Forward";
    } else if (fieldPosition === "Sweeper") {
      complementA = "Center Halfback";
      complementB = "Left/Right Forward";
    } else if (fieldPosition === "Left Fullback") {
      complementA = "Right Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Right FullBack") {
      complementA = "Left Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Center Fullback") {
      complementA = "Left/Right Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Left Halfback") {
      complementA = "Right Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Right Halfback") {
      complementA = "Left Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Center Halfback") {
      complementA = "Striker";
      complementB = "Left/Right Forward";
    } else if (fieldPosition === "Left Forward") {
      complementA = "Center Halfback";
      complementB = "Right Forward";
    } else if (fieldPosition === "Right Forward") {
      complementA = "Center Halfback";
      complementB = "Left Forward";
    } else if (fieldPosition === "Striker") {
      complementA = "Left/Right Forward";
      complementB = "Center Halfback";
    }

    feedbackResults.complementA = complementA;
    feedbackResults.complementB = complementB; // shots scored on team side and opponent side of field, & defensive redirects (i.e. within keeper range of goal)

    let teamSide = 0;
    let oppSide = 0;
    let defensiveRedirect = 0;
    shots.forEach(shot => {
      if (shot.fieldX > 0.50) {
        oppSide++;
      } else {
        teamSide++;
      }

      if (shot.fieldX < 0.15) {
        defensiveRedirect++;
      }
    });
    feedbackResults.teamSideGoals = teamSide;
    feedbackResults.opponentSideGoals = oppSide;
    feedbackResults.defensiveRedirect = defensiveRedirect; // aerial count & percentage of all shots

    let aerial = 0;
    shots.forEach(shot => {
      if (shot.aerial === true) {
        aerial++;
      }
    });
    let aerialPercentage = Number((aerial / shots.length * 100).toFixed(0));
    feedbackResults.aerial = aerial;
    feedbackResults.aerialPercentage = aerialPercentage; // max ball speed, average ball speed, shots over 70 mph

    let avgBallSpeed = 0;
    let shotsOver70mph = 0;
    shots.forEach(shot => {
      if (shot.ball_speed >= 70) {
        shotsOver70mph++;
      }

      avgBallSpeed += shot.ball_speed;
    });
    avgBallSpeed = Number((avgBallSpeed / shots.length).toFixed(1));
    feedbackResults.maxBallSpeed = shots.reduce((max, shot) => shot.ball_speed > max ? shot.ball_speed : max, shots[0].ball_speed);
    feedbackResults.avgBallSpeed = avgBallSpeed;
    feedbackResults.shotsOver70mph = shotsOver70mph; // 3v3, 2v2, and 1v1 games played

    let _3v3 = 0;
    let _2v2 = 0;
    let _1v1 = 0;
    games.forEach(game => {
      if (game.type === "3v3") {
        _3v3++;
      } else if (game.type === "2v2") {
        _2v2++;
      } else {
        _1v1++;
      }
    });
    feedbackResults._3v3 = _3v3;
    feedbackResults._2v2 = _2v2;
    feedbackResults._1v1 = _1v1; // total games played, total shots scored, wins/losses/win%

    feedbackResults.totalGames = games.length;
    feedbackResults.totalShots = shots.length;
    let wins = 0;
    let losses = 0;
    games.forEach(game => {
      if (game.score > game.opp_score) {
        wins++;
      } else {
        losses++;
      }
    });
    feedbackResults.wins = wins;
    feedbackResults.losses = losses;
    feedbackResults.winPct = Number((wins / (wins + losses) * 100).toFixed(0)); // comp games / win %, casual games / win %, games in OT

    let competitiveGames = 0;
    let compWin = 0;
    let casualGames = 0;
    let casualWin = 0;
    let overtimeGames = 0;
    games.forEach(game => {
      if (game.mode === "casual") {
        casualGames++;

        if (game.score > game.opp_score) {
          casualWin++;
        }
      } else {
        competitiveGames++;

        if (game.score > game.opp_score) {
          compWin++;
        }
      }

      if (game.overtime === true) {
        overtimeGames++;
      }
    });
    let compWinPct = 0;

    if (competitiveGames === 0) {
      compWinPct = 0;
    } else {
      compWinPct = Number((compWin / competitiveGames * 100).toFixed(0));
    }

    let casualWinPct = 0;

    if (casualGames === 0) {
      casualWinPct = 0;
    } else {
      casualWinPct = Number((casualWin / casualGames * 100).toFixed(1));
    }

    feedbackResults.competitiveGames = competitiveGames;
    feedbackResults.casualGames = casualGames;
    feedbackResults.compWinPct = compWinPct;
    feedbackResults.casualWinPct = casualWinPct;
    feedbackResults.overtimeGames = overtimeGames;
    return this.buildLevels(feedbackResults);
  },

  buildLevels(feedbackResults) {
    const feedbackContainer = document.getElementById("heatmapAndFeedbackContainer"); // reformat heatmap generation time to remove seconds

    const timeReformat = [feedbackResults.now.split(":")[0], feedbackResults.now.split(":")[1]].join(":") + feedbackResults.now.split(":")[2].slice(2); // heatmap generation and range of dates on games (max and min)

    const item3_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.lastGame}`);
    const item3_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Last game");
    const item3_wrapper = (0, _elementBuilder.default)("div", {}, null, item3_child, item3_child2);
    const item3 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item3_wrapper);
    const item2_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.firstGame}`);
    const item2_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "First game");
    const item2_wrapper = (0, _elementBuilder.default)("div", {}, null, item2_child, item2_child2);
    const item2 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item2_wrapper);
    const item1_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${timeReformat}`);
    const item1_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Heatmap generated");
    const item1_wrapper = (0, _elementBuilder.default)("div", {}, null, item1_child, item1_child2);
    const item1 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item1_wrapper);
    const columns1_HeatmapDetails = (0, _elementBuilder.default)("div", {
      "id": "feedback-1",
      "class": "columns has-background-white-ter"
    }, null, item1, item2, item3); // player feedback based on average field x,y coordinate of player shots

    const item6_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.complementB}`);
    const item6_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Complementing player 2");
    const item6_wrapper = (0, _elementBuilder.default)("div", {}, null, item6_child, item6_child2);
    const item6 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item6_wrapper);
    const item5_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.complementA}`);
    const item5_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Complementing player 1");
    const item5_wrapper = (0, _elementBuilder.default)("div", {}, null, item5_child, item5_child2);
    const item5 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item5_wrapper);
    const item4_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.fieldPosition}`);
    const item4_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Your playstyle");
    const item4_wrapper = (0, _elementBuilder.default)("div", {}, null, item4_child, item4_child2);
    const item4 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item4_wrapper);
    const columns2_playerType = (0, _elementBuilder.default)("div", {
      "id": "feedback-2",
      "class": "columns"
    }, null, item4, item5, item6); // shots on team/opponent sides of field, defensive redirects, and aerial shots / %

    const item9_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.defensiveRedirect}`);
    const item9_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Redirects from Own Goal");
    const item9_wrapper = (0, _elementBuilder.default)("div", {}, null, item9_child, item9_child2);
    const item9 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item9_wrapper);
    const item8_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.teamSideGoals} : ${feedbackResults.opponentSideGoals}`);
    const item8_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Goals Behind & Beyond Midfield");
    const item8_wrapper = (0, _elementBuilder.default)("div", {}, null, item8_child, item8_child2);
    const item8 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item8_wrapper);
    const item7_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.aerial} : ${feedbackResults.aerialPercentage}%`);
    const item7_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Aerial Goal Total & Pct");
    const item7_wrapper = (0, _elementBuilder.default)("div", {}, null, item7_child, item7_child2);
    const item7 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item7_wrapper);
    const columns3_shotDetails = (0, _elementBuilder.default)("div", {
      "id": "feedback-3",
      "class": "columns"
    }, null, item7, item8, item9); // max ball speed, average ball speed, shots over 70 mph

    const item12_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.shotsOver70mph}`);
    const item12_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Goals Over 70 mph");
    const item12_wrapper = (0, _elementBuilder.default)("div", {}, null, item12_child, item12_child2);
    const item12 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item12_wrapper);
    const item11_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.avgBallSpeed} mph`);
    const item11_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Average Ball Speed");
    const item11_wrapper = (0, _elementBuilder.default)("div", {}, null, item11_child, item11_child2);
    const item11 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item11_wrapper);
    const item10_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.maxBallSpeed} mph`);
    const item10_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Max Ball Speed");
    const item10_wrapper = (0, _elementBuilder.default)("div", {}, null, item10_child, item10_child2);
    const item10 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item10_wrapper);
    const columns4_ballDetails = (0, _elementBuilder.default)("div", {
      "id": "feedback-4",
      "class": "columns has-background-white-ter"
    }, null, item10, item11, item12); // total games played, total shots scored, wins/losses/win%

    const item15_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.wins} : ${feedbackResults.losses} : ${feedbackResults.winPct}%`);
    const item15_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Wins, Losses, & Win Pct");
    const item15_wrapper = (0, _elementBuilder.default)("div", {}, null, item15_child, item15_child2);
    const item15 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item15_wrapper);
    const item14_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.totalShots}`);
    const item14_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Total Goals");
    const item14_wrapper = (0, _elementBuilder.default)("div", {}, null, item14_child, item14_child2);
    const item14 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item14_wrapper);
    const item13_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.totalGames}`);
    const item13_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Total Games");
    const item13_wrapper = (0, _elementBuilder.default)("div", {}, null, item13_child, item13_child2);
    const item13 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item13_wrapper);
    const columns5_victoryDetails = (0, _elementBuilder.default)("div", {
      "id": "feedback-5",
      "class": "columns has-background-white-ter"
    }, null, item13, item14, item15); // 3v3, 2v2, and 1v1 games played

    const item18_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults._1v1}`);
    const item18_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "1v1 Games");
    const item18_wrapper = (0, _elementBuilder.default)("div", {}, null, item18_child, item18_child2);
    const item18 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item18_wrapper);
    const item17_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults._2v2}`);
    const item17_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "2v2 games");
    const item17_wrapper = (0, _elementBuilder.default)("div", {}, null, item17_child, item17_child2);
    const item17 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item17_wrapper);
    const item16_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults._3v3}`);
    const item16_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "3v3 Games");
    const item16_wrapper = (0, _elementBuilder.default)("div", {}, null, item16_child, item16_child2);
    const item16 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item16_wrapper);
    const columns6_gameTypeDetails = (0, _elementBuilder.default)("div", {
      "id": "feedback-6",
      "class": "columns"
    }, null, item16, item17, item18); // comp games / win %, casual games / win %, games in OT

    const item21_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.overtimeGames}`);
    const item21_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Overtime Games");
    const item21_wrapper = (0, _elementBuilder.default)("div", {}, null, item21_child, item21_child2);
    const item21 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item21_wrapper);
    const item20_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.competitiveGames} : ${feedbackResults.compWinPct}%`);
    const item20_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Competitive Games & Win Pct");
    const item20_wrapper = (0, _elementBuilder.default)("div", {}, null, item20_child, item20_child2);
    const item20 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item20_wrapper);
    const item19_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.casualGames} : ${feedbackResults.casualWinPct}%`);
    const item19_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Casual Games & Win Pct");
    const item19_wrapper = (0, _elementBuilder.default)("div", {}, null, item19_child, item19_child2);
    const item19 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item19_wrapper);
    const columns7_overtimeDetails = (0, _elementBuilder.default)("div", {
      "id": "feedback-7",
      "class": "columns has-background-white-ter"
    }, null, item19, item20, item21); // replace old content if it's already on the page

    const feedback1 = document.getElementById("feedback-1");
    const feedback2 = document.getElementById("feedback-2");
    const feedback3 = document.getElementById("feedback-3");
    const feedback4 = document.getElementById("feedback-4");
    const feedback5 = document.getElementById("feedback-5");
    const feedback6 = document.getElementById("feedback-6");
    const feedback7 = document.getElementById("feedback-7");

    if (feedback1 !== null) {
      feedback1.replaceWith(columns1_HeatmapDetails);
      feedback2.replaceWith(columns2_playerType);
      feedback3.replaceWith(columns3_shotDetails);
      feedback4.replaceWith(columns4_ballDetails);
      feedback5.replaceWith(columns5_victoryDetails);
      feedback6.replaceWith(columns6_gameTypeDetails);
      feedback7.replaceWith(columns7_overtimeDetails);
    } else {
      feedbackContainer.appendChild(columns1_HeatmapDetails);
      feedbackContainer.appendChild(columns2_playerType);
      feedbackContainer.appendChild(columns4_ballDetails);
      feedbackContainer.appendChild(columns3_shotDetails);
      feedbackContainer.appendChild(columns5_victoryDetails);
      feedbackContainer.appendChild(columns6_gameTypeDetails);
      feedbackContainer.appendChild(columns7_overtimeDetails);
    }
  }

};
var _default = feedback;
/*
- Heatmap generated on
- start date
- end date
-------------
- relevant soccer position based on avg score position
- paired best with 1
- paired best with 2
--------------
- shots scored left / right of midfield
- shots scored as redirects beside own goal (Defensive redirects)
- aerial count & shot %
--------------
- max ball speed
- avg ball speed
- shots over 70mph (~ 110 kph)
--------------
- 3v3 games played
- 2v2 games played
- 1v1 games played
-------------
- total games played
- total shots scored
- win / loss / win%
-------------
- comp games / win %
- casual games / win %
- games in OT
-------------

*/

exports.default = _default;

},{"./API":2,"./elementBuilder":4}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _heatmapData = _interopRequireDefault(require("./heatmapData"));

var _API = _interopRequireDefault(require("./API"));

var _dateFilter = _interopRequireDefault(require("./dateFilter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
const heatmaps = {
  loadHeatmapContainers() {
    webpage.innerHTML = null;
    this.buildFilters(); // builds button to generate heatmap, save heatmap, and view saved heatmaps
    // the action is async because the user's saved heatmaps have to be rendered as HTML option elements

    this.buildGenerator();
  },

  buildFilters() {
    // reset button
    const resetBtn = (0, _elementBuilder.default)("button", {
      "id": "resetFiltersBtn",
      "class": "button is-danger"
    }, "Reset Filters"); // date range button

    const dateBtnText = (0, _elementBuilder.default)("span", {}, "Dates");
    const dateBtnIcon = (0, _elementBuilder.default)("i", {
      "class": "far fa-calendar"
    }, null);
    const dateBtnIconSpan = (0, _elementBuilder.default)("span", {
      "class": "icon is-small"
    }, null, dateBtnIcon);
    const dateBtn = (0, _elementBuilder.default)("a", {
      "id": "dateRangeBtn",
      "class": "button is-outlined is-dark"
    }, null, dateBtnIconSpan, dateBtnText);
    const dateBtnParent = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, dateBtn); // ball speed button

    const ballSpeedBtnText = (0, _elementBuilder.default)("span", {}, "Ball Speed");
    const ballSpeedBtnIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-bolt"
    }, null);
    const ballSpeedBtnIconSpan = (0, _elementBuilder.default)("span", {
      "class": "icon is-small"
    }, null, ballSpeedBtnIcon);
    const ballSpeedBtn = (0, _elementBuilder.default)("a", {
      "id": "ballSpeedBtn",
      "class": "button is-outlined is-dark"
    }, null, ballSpeedBtnIconSpan, ballSpeedBtnText);
    const ballSpeedBtnParent = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, ballSpeedBtn); // overtime

    const icon6 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-clock"
    }, null);
    const iconSpan6 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon6);
    const sel6_op1 = (0, _elementBuilder.default)("option", {}, "Overtime");
    const sel6_op2 = (0, _elementBuilder.default)("option", {}, "OT");
    const sel6_op3 = (0, _elementBuilder.default)("option", {}, "No OT");
    const select6 = (0, _elementBuilder.default)("select", {
      "id": "filter-overtime"
    }, null, sel6_op1, sel6_op2, sel6_op3);
    const selectDiv6 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select6, iconSpan6);
    const control6 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv6); // result

    const icon5 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-trophy"
    }, null);
    const iconSpan5 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon5);
    const sel5_op1 = (0, _elementBuilder.default)("option", {}, "Result");
    const sel5_op2 = (0, _elementBuilder.default)("option", {}, "Victory");
    const sel5_op3 = (0, _elementBuilder.default)("option", {}, "Defeat");
    const select5 = (0, _elementBuilder.default)("select", {
      "id": "filter-gameResult"
    }, null, sel5_op1, sel5_op2, sel5_op3);
    const selectDiv5 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select5, iconSpan5);
    const control5 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv5); // game type

    const icon4 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-sitemap"
    }, null);
    const iconSpan4 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon4);
    const sel4_op1 = (0, _elementBuilder.default)("option", {}, "Game Type");
    const sel4_op2 = (0, _elementBuilder.default)("option", {}, "3v3");
    const sel4_op3 = (0, _elementBuilder.default)("option", {}, "2v2");
    const sel4_op4 = (0, _elementBuilder.default)("option", {}, "1v1");
    const select4 = (0, _elementBuilder.default)("select", {
      "id": "filter-gameType"
    }, null, sel4_op1, sel4_op2, sel4_op3, sel4_op4);
    const selectDiv4 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select4, iconSpan4);
    const control4 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv4); // game mode

    const icon3 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-gamepad"
    }, null);
    const iconSpan3 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon3);
    const sel3_op1 = (0, _elementBuilder.default)("option", {}, "Game Mode");
    const sel3_op2 = (0, _elementBuilder.default)("option", {}, "Competitive");
    const sel3_op3 = (0, _elementBuilder.default)("option", {}, "Casual");
    const select3 = (0, _elementBuilder.default)("select", {
      "id": "filter-gameMode"
    }, null, sel3_op1, sel3_op2, sel3_op3);
    const selectDiv3 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select3, iconSpan3);
    const control3 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv3); // party

    const icon2 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-handshake"
    }, null);
    const iconSpan2 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon2);
    const sel2_op1 = (0, _elementBuilder.default)("option", {}, "Team");
    const sel2_op2 = (0, _elementBuilder.default)("option", {}, "No party");
    const sel2_op3 = (0, _elementBuilder.default)("option", {}, "Party");
    const select2 = (0, _elementBuilder.default)("select", {
      "id": "filter-teamStatus"
    }, null, sel2_op1, sel2_op2, sel2_op3);
    const selectDiv2 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select2, iconSpan2);
    const control2 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv2); // shot type

    const icon1 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-futbol"
    }, null);
    const iconSpan1 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon1);
    const sel1_op1 = (0, _elementBuilder.default)("option", {}, "Shot Type");
    const sel1_op2 = (0, _elementBuilder.default)("option", {}, "Aerial");
    const sel1_op3 = (0, _elementBuilder.default)("option", {}, "Standard");
    const select1 = (0, _elementBuilder.default)("select", {
      "id": "filter-shotType"
    }, null, sel1_op1, sel1_op2, sel1_op3);
    const selectDiv1 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select1, iconSpan1);
    const control1 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv1);
    const filterField = (0, _elementBuilder.default)("div", {
      "id": "filterField",
      "class": "field is-grouped is-grouped-centered is-grouped-multiline"
    }, null, control1, control2, control3, control4, control5, control6, ballSpeedBtnParent, dateBtnParent, resetBtn);
    const ParentFilterContainer = (0, _elementBuilder.default)("div", {
      "class": "container box"
    }, null, filterField); // append filter container to webpage

    webpage.appendChild(ParentFilterContainer);
  },

  buildGenerator() {
    const activeUserId = sessionStorage.getItem("activeUserId"); // use fetch to append options to select element if user at least 1 saved heatmap

    _API.default.getAll(`heatmaps?userId=${activeUserId}`).then(heatmaps => {
      const icon = (0, _elementBuilder.default)("i", {
        "class": "fas fa-fire"
      }, null);
      const iconSpan = (0, _elementBuilder.default)("span", {
        "class": "icon is-left"
      }, null, icon);
      const sel1_op1 = (0, _elementBuilder.default)("option", {}, "Basic Heatmap");
      const heatmapDropdown = (0, _elementBuilder.default)("select", {
        "id": "heatmapDropdown"
      }, null, sel1_op1);
      const heatmapSelectDiv = (0, _elementBuilder.default)("div", {
        "class": "select is-dark"
      }, null, heatmapDropdown, iconSpan);
      const heatmapControl = (0, _elementBuilder.default)("div", {
        "class": "control has-icons-left"
      }, null, heatmapSelectDiv);
      const deleteHeatmapBtn = (0, _elementBuilder.default)("button", {
        "id": "deleteHeatmapBtn",
        "class": "button is-danger"
      }, "Delete Heatmap");
      const deleteBtnControl = (0, _elementBuilder.default)("div", {
        "class": "control"
      }, null, deleteHeatmapBtn);
      const saveBtn = (0, _elementBuilder.default)("button", {
        "id": "saveHeatmapBtn",
        "class": "button is-success"
      }, "Save Heatmap");
      const saveBtnControl = (0, _elementBuilder.default)("div", {
        "class": "control"
      }, null, saveBtn);
      const saveInput = (0, _elementBuilder.default)("input", {
        "id": "saveHeatmapInput",
        "class": "input",
        "type": "text",
        "placeholder": "Name and save this heatmap",
        "maxlength": "25"
      }, null);
      const saveControl = (0, _elementBuilder.default)("div", {
        "class": "control is-expanded"
      }, null, saveInput);
      const generatorButton = (0, _elementBuilder.default)("button", {
        "id": "generateHeatmapBtn",
        "class": "button is-dark"
      }, "Generate Heatmap");
      const generatorControl = (0, _elementBuilder.default)("div", {
        "class": "control"
      }, null, generatorButton); // if no heatmaps are saved, generate no extra options in dropdown

      if (heatmaps.length === 0) {
        const generatorField = (0, _elementBuilder.default)("div", {
          "class": "field is-grouped is-grouped-centered is-grouped-multiline"
        }, null, heatmapControl, generatorControl, saveControl, saveBtnControl, deleteBtnControl);
        const ParentGeneratorContainer = (0, _elementBuilder.default)("div", {
          "class": "container box"
        }, null, generatorField);
        webpage.appendChild(ParentGeneratorContainer);
      } else {
        // else, for each heatmap saved, make a new option and append it to the
        heatmaps.forEach(heatmap => {
          heatmapDropdown.appendChild((0, _elementBuilder.default)("option", {
            "id": `heatmap-${heatmap.id}`
          }, `${heatmap.timeStamp.split("T")[0]}: ${heatmap.name}`));
        });
        const generatorField = (0, _elementBuilder.default)("div", {
          "class": "field is-grouped is-grouped-centered is-grouped-multiline"
        }, null, heatmapControl, generatorControl, saveControl, saveBtnControl, deleteBtnControl);
        const ParentGeneratorContainer = (0, _elementBuilder.default)("div", {
          "class": "container box"
        }, null, generatorField);
        webpage.appendChild(ParentGeneratorContainer);
      }

      this.buildFieldandGoal();

      _dateFilter.default.buildDateFilter();

      this.heatmapEventManager();
    });
  },

  buildFieldandGoal() {
    const fieldImage = (0, _elementBuilder.default)("img", {
      "id": "field-img",
      "src": "../images/DFH_stadium_790x540_no_bg_90deg.png",
      "alt": "DFH Stadium",
      "style": "height: 100%; width: 100%; object-fit: contain"
    });
    const fieldImageBackground = (0, _elementBuilder.default)("img", {
      "id": "field-img-bg",
      "src": "../images/DFH_stadium_790x540_no_bg_90deg.png",
      "alt": "DFH Stadium",
      "style": "height: 100%; width: 100%; object-fit: contain"
    });
    const fieldImageParent = (0, _elementBuilder.default)("div", {
      "id": "field-img-parent",
      "class": ""
    }, null, fieldImageBackground, fieldImage);
    const alignField = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, null, fieldImageParent);
    const goalImage = (0, _elementBuilder.default)("img", {
      "id": "goal-img",
      "src": "../images/RL_goal_cropped_no_bg_BW.png",
      "alt": "DFH Stadium",
      "style": "height: 100%; width: 100%; object-fit: contain"
    });
    const goalImageParent = (0, _elementBuilder.default)("div", {
      "id": "goal-img-parent",
      "class": "level"
    }, null, goalImage);
    const alignGoal = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, null, goalImageParent);
    const heatmapImageContainers = (0, _elementBuilder.default)("div", {
      "class": "level"
    }, null, alignField, alignGoal); // parent container holding all shot information

    const parentShotContainer = (0, _elementBuilder.default)("div", {
      "id": "heatmapAndFeedbackContainer",
      "class": "container box"
    }, null, heatmapImageContainers); // append field and goal to page

    webpage.appendChild(parentShotContainer);
  },

  heatmapEventManager() {
    // add functionality to primary buttons on heatmap page
    const generateHeatmapBtn = document.getElementById("generateHeatmapBtn");
    const saveHeatmapBtn = document.getElementById("saveHeatmapBtn");
    const deleteHeatmapBtn = document.getElementById("deleteHeatmapBtn");
    generateHeatmapBtn.addEventListener("click", _heatmapData.default.getUserShots);
    saveHeatmapBtn.addEventListener("click", _heatmapData.default.saveHeatmap);
    deleteHeatmapBtn.addEventListener("click", _heatmapData.default.deleteHeatmap); // add listener to heatmap parent that highlights filter buttons red when changed
    // heatmap buttons return to default color if the default option is selected

    const filterField = document.getElementById("filterField");
    filterField.addEventListener("change", e => {
      e.target.parentNode.classList.add("is-danger");

      if (e.target.value === e.target.childNodes[0].textContent) {
        e.target.parentNode.classList.remove("is-danger");
      }
    }); // add listener to heatmap title input to clear red highliting and text if an error was thrown

    const saveHeatmapInput = document.getElementById("saveHeatmapInput");
    saveHeatmapInput.addEventListener("click", () => {
      if (saveHeatmapInput.classList.contains("is-danger") || saveHeatmapInput.classList.contains("is-success")) {
        saveHeatmapInput.value = "";
        saveHeatmapInput.classList.remove("is-danger");
        saveHeatmapInput.classList.remove("is-success");
      }
    }); // add functionality to reset filter button

    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const gameModeFilter = document.getElementById("filter-gameMode");
    const shotTypeFilter = document.getElementById("filter-shotType");
    const gameResultFilter = document.getElementById("filter-gameResult");
    const gametypeFilter = document.getElementById("filter-gameType");
    const overtimeFilter = document.getElementById("filter-overtime");
    const teamStatusFilter = document.getElementById("filter-teamStatus");
    const dateRangeBtn = document.getElementById("dateRangeBtn");
    const ballSpeedBtn = document.getElementById("ballSpeedBtn");
    resetFiltersBtn.addEventListener("click", () => {
      gameModeFilter.value = "Game Mode";
      gameModeFilter.parentNode.classList.remove("is-danger");
      shotTypeFilter.value = "Shot Type";
      shotTypeFilter.parentNode.classList.remove("is-danger");
      gameResultFilter.value = "Result";
      gameResultFilter.parentNode.classList.remove("is-danger");
      gametypeFilter.value = "Game Type";
      gametypeFilter.parentNode.classList.remove("is-danger");
      overtimeFilter.value = "Overtime";
      overtimeFilter.parentNode.classList.remove("is-danger");
      teamStatusFilter.value = "Team";
      teamStatusFilter.parentNode.classList.remove("is-danger"); // reset ball speed global variables

      _heatmapData.default.handleBallSpeedGlobalVariables();

      ballSpeedBtn.classList.add("is-outlined"); // reset date filter and associated global variables

      _dateFilter.default.clearDateFilter();
    }); // add functionality to ball speed button

    ballSpeedBtn.addEventListener("click", _heatmapData.default.ballSpeedMax); // add functionality to date range button

    dateRangeBtn.addEventListener("click", _dateFilter.default.openDateFilter);
  }

};
var _default = heatmaps;
exports.default = _default;

},{"./API":2,"./dateFilter":3,"./elementBuilder":4,"./heatmapData":7}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _API = _interopRequireDefault(require("./API"));

var _navbar = _interopRequireDefault(require("./navbar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
const webpageNav = document.getElementById("nav-master");
const loginOrSignup = {
  loginForm() {
    // this function builds a login form that validates user input. Successful login stores user id in session storage
    const loginButton = (0, _elementBuilder.default)("button", {
      "id": "loginNow",
      "class": "button is-dark"
    }, "Login now");
    const loginBtnControl = (0, _elementBuilder.default)("div", {
      "class": "buttons is-centered"
    }, null, loginButton); // password input with icon

    const loginPasswordIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-lock"
    });
    const loginPasswordIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, loginPasswordIcon);
    const loginInput_password = (0, _elementBuilder.default)("input", {
      "id": "passwordInput",
      "class": "input",
      "type": "password",
      "placeholder": "enter password"
    });
    const loginPasswordControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, loginInput_password, loginPasswordIconDiv);
    const loginPasswordLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Password");
    const loginPasswordField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, loginPasswordLabel, loginPasswordControl); // username input with icon

    const loginUsernameIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-user"
    });
    const loginUsernameIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, loginUsernameIcon);
    const loginInput_username = (0, _elementBuilder.default)("input", {
      "id": "usernameInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter username"
    });
    const loginUsernameControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, loginInput_username, loginUsernameIconDiv);
    const loginUsernameLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Username");
    const loginUsernameField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, loginUsernameLabel, loginUsernameControl); // form

    const loginForm = (0, _elementBuilder.default)("form", {
      "id": "loginForm",
      "class": "box",
      "style": "margin-top:-57px; min-width:20%"
    }, null, loginUsernameField, loginPasswordField, loginBtnControl);
    webpage.innerHTML = null; // set style of master container to display flex to align forms in center of container

    webpage.style.display = "flex";
    webpage.style.justifyContent = "center";
    webpage.style.alignItems = "center";
    webpage.appendChild(loginForm);
    this.userEventManager();
  },

  signupForm() {
    const signupButton = (0, _elementBuilder.default)("button", {
      "id": "signupNow",
      "class": "button is-dark"
    }, "Sign up now");
    const signupBtnControl = (0, _elementBuilder.default)("div", {
      "class": "buttons is-centered"
    }, null, signupButton); // name input with icon

    const signupNameIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-pencil-alt"
    });
    const signupNameIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, signupNameIcon);
    const signupInput_name = (0, _elementBuilder.default)("input", {
      "id": "nameInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter name"
    });
    const signupNameControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, signupInput_name, signupNameIconDiv);
    const signupNameLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Name");
    const signupNameField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, signupNameLabel, signupNameControl); // username input with icon

    const signupUsernameIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-user"
    });
    const signupUsernameIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, signupUsernameIcon);
    const signupInput_username = (0, _elementBuilder.default)("input", {
      "id": "usernameInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter username",
      "maxlength": "20"
    });
    const signupUsernameControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, signupInput_username, signupUsernameIconDiv);
    const signupUsernameLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Username");
    const signupUsernameField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, signupUsernameLabel, signupUsernameControl); // email input with icon

    const signupEmailIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-at"
    });
    const signupEmailIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, signupEmailIcon);
    const signupInput_email = (0, _elementBuilder.default)("input", {
      "id": "emailInput",
      "class": "input",
      "type": "email",
      "placeholder": "enter email"
    });
    const signupEmailControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, signupInput_email, signupEmailIconDiv);
    const signupEmailLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Email");
    const signupEmailField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, signupEmailLabel, signupEmailControl); // password input with icon

    const signupPasswordIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-lock"
    });
    const signupPasswordIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, signupPasswordIcon);
    const signupInput_password = (0, _elementBuilder.default)("input", {
      "id": "passwordInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter password"
    });
    const signupPasswordControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, signupInput_password, signupPasswordIconDiv);
    const signupPasswordLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Password");
    const signupPasswordField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, signupPasswordLabel, signupPasswordControl); // confirm password input with icon

    const signupConfirmIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-lock"
    });
    const signupConfirmIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, signupConfirmIcon);
    const signupInput_confirm = (0, _elementBuilder.default)("input", {
      "id": "confirmPassword",
      "class": "input",
      "type": "email",
      "placeholder": "confirm password"
    });
    const signupConfirmControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, signupInput_confirm, signupConfirmIconDiv);
    const signupConfirmLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Confirm Password");
    const signupConfirmField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, signupConfirmLabel, signupConfirmControl); // profile pic input with icon

    const signupProfilePicIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-image"
    });
    const signupProfilePicIconDiv = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, signupProfilePicIcon);
    const signupInput_profilePic = (0, _elementBuilder.default)("input", {
      "id": "profilePicURL",
      "class": "input",
      "type": "email",
      "placeholder": "provide a URL (optional)"
    });
    const signupProfilePicControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, signupInput_profilePic, signupProfilePicIconDiv);
    const signupProfilePicLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Profile Picture");
    const signupProfilePicField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, signupProfilePicLabel, signupProfilePicControl); // car type select

    const sel_icon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-car"
    }, null);
    const sel_iconSpan = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, sel_icon);
    const sel1_op1 = (0, _elementBuilder.default)("option", {}, "Octane");
    const sel1_op2 = (0, _elementBuilder.default)("option", {}, "Dominus GT");
    const sel1_op3 = (0, _elementBuilder.default)("option", {}, "Breakout Type S");
    const select = (0, _elementBuilder.default)("select", {
      "id": "userCar"
    }, null, sel1_op1, sel1_op2, sel1_op3);
    const sel_Div = (0, _elementBuilder.default)("div", {
      "class": "select is-white-ter"
    }, null, select, sel_iconSpan);
    const sel_control = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, sel_Div);
    const controlLabel = (0, _elementBuilder.default)("label", {
      "class": "label"
    }, "Choose Your Car");
    const carSelectField = (0, _elementBuilder.default)("div", {
      "class": "field"
    }, null, controlLabel, sel_control); // form

    const signupForm = (0, _elementBuilder.default)("form", {
      "id": "signupForm",
      "class": "box",
      "style": "min-width:20%"
    }, null, signupNameField, signupUsernameField, signupEmailField, signupPasswordField, signupConfirmField, signupProfilePicField, carSelectField, signupBtnControl);
    webpage.innerHTML = null;
    webpage.style.display = "flex";
    webpage.style.justifyContent = "center";
    webpage.style.alignItems = "center";
    webpage.appendChild(signupForm);
    this.userEventManager();
  },

  // assign event listeners based on which form is on the webpage
  userEventManager() {
    const loginNow = document.getElementById("loginNow");
    const signupNow = document.getElementById("signupNow");

    if (loginNow === null) {
      signupNow.addEventListener("click", this.signupUser, event);
    } else {
      loginNow.addEventListener("click", this.loginUser, event);
    }
  },

  loginUser(e) {
    // validate user login form inputs before logging in
    e.preventDefault();
    const username = document.getElementById("usernameInput").value;
    const password = document.getElementById("passwordInput").value;

    if (username === "") {
      return;
    } else if (password === "") {
      return;
    } else {
      _API.default.getAll(`users?username=${username.toLowerCase()}`).then(user => {
        // validate username and password
        console.log(user.length);

        if (user.length === 1) {
          if (user[0].password === password) {
            console.log("password check");
            loginOrSignup.loginStatusActive(user[0]);
          } else {
            alert("Username or password is incorrect.");
            return;
          }
        } else {
          alert("Username or password is incorrect.");
          return;
        }
      });
    }
  },

  signupUser(e) {
    e.preventDefault();
    const _name = document.getElementById("nameInput").value;
    const _username = document.getElementById("usernameInput").value;
    const _password = document.getElementById("passwordInput").value;
    const _confirm = document.getElementById("confirmPassword").value;
    const _email = document.getElementById("emailInput").value;
    const _picture = document.getElementById("profilePicURL").value;
    const _car = document.getElementById("userCar").value;

    if (_name === "") {
      return;
    } else if (_username === "") {
      return;
    } else if (_password === "") {
      return;
    } else if (_email === "") {
      return;
    } else if (_confirm === "") {
      return;
    } else if (_password !== _confirm) {
      return;
    } else {
      _API.default.getAll(`users?username=${_username.toLowerCase()}`).then(user => {
        // check for existing username in database. Length = 1 if username is not unique
        if (user.length === 1) {
          alert("this username already exists");
          return;
        } else {
          //post the new user if username is unique
          let newUser = {
            name: _name,
            username: _username.toLowerCase(),
            email: _email.toLowerCase(),
            password: _password,
            joined: new Date(),
            car: _car,
            picture: _picture
          };

          _API.default.postItem("users", newUser).then(user => {
            loginOrSignup.loginStatusActive(user);
          });
        }
      });
    }
  },

  loginStatusActive(user) {
    sessionStorage.setItem("activeUserId", user.id);
    webpage.innerHTML = null;
    webpageNav.innerHTML = null;
    webpage.style.display = "block";

    _navbar.default.generateNavbar(true); //build logged in version of navbar

  },

  logoutUser() {
    sessionStorage.removeItem("activeUserId");
    webpage.innerHTML = null;
    webpageNav.innerHTML = null;
    webpage.style.display = "block";

    _navbar.default.generateNavbar(false); //build logged out version of navbar

  }

};
var _default = loginOrSignup;
exports.default = _default;

},{"./API":2,"./elementBuilder":4,"./navbar":12}],11:[function(require,module,exports){
"use strict";

var _navbar = _interopRequireDefault(require("./navbar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_navbar.default.generateNavbar();

},{"./navbar":12}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _login = _interopRequireDefault(require("./login"));

var _profile = _interopRequireDefault(require("./profile"));

var _gameplay = _interopRequireDefault(require("./gameplay"));

var _shotData = _interopRequireDefault(require("./shotData"));

var _heatmaps = _interopRequireDefault(require("./heatmaps"));

var _heatmapData = _interopRequireDefault(require("./heatmapData"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
  Bulma navbar structure:
  <nav>
    <navbar-brand>
      <navbar-burger> (optional)
    </navbar-brand>
    <navbar-menu>
      <navbar-start>
      </navbar-start>
      <navbar-end>
      </navbar-end>
    </navbar-menu>
  </nav>
*/
const webpageNav = document.getElementById("nav-master");
const navbar = {
  generateNavbar(loggedInBoolean) {
    // navbar-menu (right side of navbar - appears on desktop 1024px+)
    const button2 = (0, _elementBuilder.default)("a", {
      "class": "button is-dark"
    }, "Login");
    const button1 = (0, _elementBuilder.default)("a", {
      "class": "button is-dark"
    }, "Sign up");
    const buttonContainer = (0, _elementBuilder.default)("div", {
      "class": "buttons"
    }, null, button1, button2);
    const menuItem1 = (0, _elementBuilder.default)("div", {
      "class": "navbar-item"
    }, null, buttonContainer);
    const navbarEnd = (0, _elementBuilder.default)("div", {
      "class": "navbar-end"
    }, null, menuItem1);
    const navbarStart = (0, _elementBuilder.default)("div", {
      "class": "navbar-start"
    });
    const navbarMenu = (0, _elementBuilder.default)("div", {
      "id": "navbarMenu",
      "class": "navbar-menu"
    }, null, navbarStart, navbarEnd); // navbar-brand (left side of navbar - includes mobile hamburger menu)

    const burgerMenuSpan1 = (0, _elementBuilder.default)("span", {
      "aria-hidden": "true"
    });
    const burgerMenuSpan2 = (0, _elementBuilder.default)("span", {
      "aria-hidden": "true"
    });
    const burgerMenuSpan3 = (0, _elementBuilder.default)("span", {
      "aria-hidden": "true"
    });
    const navbarBrandChild2 = (0, _elementBuilder.default)("a", {
      "role": "button",
      "class": "navbar-burger burger",
      "aria-label": "menu",
      "aria-expanded": "false",
      "data-target": "navbarMenu"
    }, null, burgerMenuSpan1, burgerMenuSpan2, burgerMenuSpan3);
    const navbarBrandChild1 = (0, _elementBuilder.default)("a", {
      "class": "navbar-item",
      "href": "#"
    }, null, (0, _elementBuilder.default)("img", {
      "src": "images/fire90deg.png",
      "width": "112",
      "height": "28"
    }));
    const navbarBrand = (0, _elementBuilder.default)("div", {
      "class": "navbar-brand"
    }, null, navbarBrandChild1, navbarBrandChild2); // nav (parent nav HTML element)

    const nav = (0, _elementBuilder.default)("nav", {
      "class": "navbar",
      "role": "navigation",
      "aria-label": "main navigation"
    }, null, navbarBrand, navbarMenu); // if logged in, append additional menu options to navbar and remove signup/login buttons

    if (loggedInBoolean) {
      // remove log in and sign up buttons
      const signup = buttonContainer.childNodes[0];
      const login = buttonContainer.childNodes[1];
      buttonContainer.removeChild(signup);
      buttonContainer.removeChild(login); // add logout button

      const button3 = (0, _elementBuilder.default)("a", {
        "class": "button is-dark"
      }, "Logout");
      buttonContainer.appendChild(button3); // create and append new menu items for user

      const loggedInItem1 = (0, _elementBuilder.default)("a", {
        "class": "navbar-item"
      }, "Home");
      const loggedInItem2 = (0, _elementBuilder.default)("a", {
        "class": "navbar-item"
      }, "Profile");
      const loggedInItem3 = (0, _elementBuilder.default)("a", {
        "class": "navbar-item"
      }, "Gameplay");
      const loggedInItem4 = (0, _elementBuilder.default)("a", {
        "class": "navbar-item"
      }, "Heatmaps");
      navbarStart.appendChild(loggedInItem1);
      navbarStart.appendChild(loggedInItem2);
      navbarStart.appendChild(loggedInItem3);
      navbarStart.appendChild(loggedInItem4);
    } // add event listeners to navbar


    this.navbarEventManager(nav); // append to webpage

    webpageNav.appendChild(nav);
  },

  navbarEventManager(nav) {
    // this function adds a single click listener to the nav that redirects the user to the correct page
    // based on the text content of the target
    nav.addEventListener("click", e => {
      if (e.target.textContent === "Login") {
        _login.default.loginForm();
      }

      if (e.target.textContent === "Sign up") {
        _login.default.signupForm();
      }

      if (e.target.textContent === "Logout") {
        _heatmapData.default.clearHeatmapRepaintInterval();

        _login.default.logoutUser();
      }

      if (e.target.textContent === "Profile") {
        _heatmapData.default.clearHeatmapRepaintInterval();

        _profile.default.loadProfile();
      }

      if (e.target.textContent === "Gameplay") {
        _heatmapData.default.clearHeatmapRepaintInterval();

        _gameplay.default.loadGameplay();

        _shotData.default.resetGlobalShotVariables();
      }

      if (e.target.textContent === "Heatmaps") {
        _heatmapData.default.clearHeatmapRepaintInterval();

        _heatmapData.default.handleBallSpeedGlobalVariables();

        _heatmapData.default.handleDateFilterGlobalVariables();

        _heatmaps.default.loadHeatmapContainers();
      }
    });
  }

};
var _default = navbar;
exports.default = _default;

},{"./elementBuilder":4,"./gameplay":6,"./heatmapData":7,"./heatmaps":9,"./login":10,"./profile":13,"./shotData":15}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _API = _interopRequireDefault(require("./API"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
let fragment = document.createDocumentFragment(); // global variable used to count total games and shots

let gameIds = [];
const profile = {
  loadProfile() {
    webpage.innerHTML = null;
    const activeUserId = sessionStorage.getItem("activeUserId"); // get user, then push all unique game IDs to array, then fetch all shots associated with game Ids

    _API.default.getSingleItem("users", activeUserId).then(user => {
      _API.default.getAll(`games?userId=${user.id}`).then(games => {
        games.forEach(game => {
          gameIds.push(game.id);
        });
        return Promise.all(gameIds);
      }).then(gameIds => {
        if (gameIds.length === 0) {
          // call next function in chain of functions to get playstyle
          let shots = [];
          this.determinePlaystyle(user, shots, gameIds);
          gameIds = [];
          return;
        } else {
          let URL = "shots";
          gameIds.forEach(id => {
            if (URL === "shots") {
              URL += `?gameId=${id}`;
            } else {
              URL += `&gameId=${id}`;
            }
          });
          return _API.default.getAll(URL);
        }
      }).then(shots => {
        // call next function in chain of functions to get playstyle
        this.determinePlaystyle(user, shots, gameIds);
        gameIds = [];
      });
    });
  },

  determinePlaystyle(user, shots, gameIds) {
    // this function uses avg field coordinates to label the user's playstyle for their profile page
    // if user hasn't saved any games, pass correct information to build function
    if (gameIds.length === 0) {
      return this.buildProfile(user, shots, gameIds, "unknown position");
    }

    let sumX = 0;
    let sumY = 0;
    let avgX;
    let avgY;
    shots.forEach(shot => {
      sumX += shot.fieldX;
      sumY += shot.fieldY;
    });
    avgX = sumX / shots.length;
    avgY = sumY / shots.length;
    let fieldPosition;

    if (avgX < 0.15) {
      fieldPosition = "keeper";
    } else if (0.15 <= avgX && avgX <= 0.30) {
      fieldPosition = "sweeper";
    } else if (0.30 <= avgX && avgX < 0.45 && avgY <= 0.40) {
      fieldPosition = "left fullback";
    } else if (0.30 <= avgX && avgX < 0.45 && 0.60 <= avgY) {
      fieldPosition = "right fullback";
    } else if (0.30 <= avgX && avgX <= 0.45) {
      fieldPosition = "center fullback";
    } else if (0.45 <= avgX && avgX < 0.60 && avgY <= 0.40) {
      fieldPosition = "left halfback";
    } else if (0.45 <= avgX && avgX < 0.60 && 0.60 <= avgY) {
      fieldPosition = "right halfback";
    } else if (0.45 <= avgX && avgX <= 0.60) {
      fieldPosition = "center halfback";
    } else if (0.60 <= avgX && avgX < 0.75 && avgY <= 0.50) {
      fieldPosition = "left forward";
    } else if (0.60 <= avgX && avgX < 0.75 && 0.50 < avgY) {
      fieldPosition = "right forward";
    } else if (0.75 <= avgX) {
      fieldPosition = "striker";
    } // call function to load containers using all fetched information


    this.buildProfile(user, shots, gameIds, fieldPosition);
  },

  buildProfile(user, shots, gameIds, fieldPosition) {
    // media containers showing user stats (appended to card container)
    const playstyle = (0, _elementBuilder.default)("div", {
      "class": "title is-3"
    }, `Plays ${fieldPosition}`);
    const playstyleContent = (0, _elementBuilder.default)("div", {
      "class": "content"
    }, null, playstyle);
    const playstyleContentParent = (0, _elementBuilder.default)("div", {
      "class": "media-content"
    }, null, playstyleContent);
    const icon3 = (0, _elementBuilder.default)("img", {
      "src": "images/icons/icons8-stadium-96.png"
    }, null);
    const iconParent3 = (0, _elementBuilder.default)("figure", {
      "class": "image is-48x48"
    }, null, icon3);
    const left3 = (0, _elementBuilder.default)("div", {
      "class": "media-left"
    }, null, iconParent3);
    const userPlaystyle = (0, _elementBuilder.default)("div", {
      "class": "media is-marginless",
      "style": "padding:20px;"
    }, null, left3, playstyleContentParent);
    const gameStats = (0, _elementBuilder.default)("div", {
      "class": "title is-2"
    }, `${gameIds.length} games`);
    const gameContent = (0, _elementBuilder.default)("div", {
      "class": "content"
    }, null, gameStats);
    const gameContentParent = (0, _elementBuilder.default)("div", {
      "class": "media-content"
    }, null, gameContent);
    const icon2 = (0, _elementBuilder.default)("img", {
      "src": "images/icons/icons8-game-controller-100.png"
    }, null);
    const iconParent2 = (0, _elementBuilder.default)("figure", {
      "class": "image is-48x48"
    }, null, icon2);
    const left2 = (0, _elementBuilder.default)("div", {
      "class": "media-left"
    }, null, iconParent2);
    const totalGames = (0, _elementBuilder.default)("div", {
      "class": "media is-marginless",
      "style": "padding:20px;"
    }, null, left2, gameContentParent);
    const goalStats = (0, _elementBuilder.default)("div", {
      "class": "title is-2"
    }, `${shots.length} goals`);
    const goalContent = (0, _elementBuilder.default)("div", {
      "class": "content"
    }, null, goalStats);
    const goalContentParent = (0, _elementBuilder.default)("div", {
      "class": "media-content"
    }, null, goalContent);
    const icon1 = (0, _elementBuilder.default)("img", {
      "src": "images/icons/icons8-soccer-ball-96.png"
    }, null);
    const iconParent1 = (0, _elementBuilder.default)("figure", {
      "class": "image is-48x48"
    }, null, icon1);
    const left1 = (0, _elementBuilder.default)("div", {
      "class": "media-left"
    }, null, iconParent1);
    const totalGoals = (0, _elementBuilder.default)("div", {
      "class": "media is-marginless",
      "style": "padding:20px;"
    }, null, left1, goalContentParent); // card container profile picture, car photo, name, username, and member since mm/dd/yyyy

    let carImgVariable = user.car.toLowerCase();
    let profileImgVariable = user.picture;
    let profileImgTitle = user.picture;

    if (user.picture === "") {
      profileImgVariable = "images/profile-placeholder.jpg";
      profileImgTitle = "profile-placeholder.jpg";
    }

    let memberSinceDateFormatted = new Date(user.joined).toLocaleString().split(",")[0];
    const memberSince = (0, _elementBuilder.default)("div", {
      "class": "subtitle is-6",
      "style": "margin-top:10px"
    }, `Became a hotshot on ${memberSinceDateFormatted}`);
    const username = (0, _elementBuilder.default)("div", {
      "class": "tag"
    }, `@${user.username}`);
    const name = (0, _elementBuilder.default)("div", {
      "class": "title is-4 is-marginless"
    }, `${user.name}`);
    const userInfo = (0, _elementBuilder.default)("div", {
      "class": "media-content"
    }, null, name, username, memberSince);
    const carImg = (0, _elementBuilder.default)("img", {
      "src": `images/cars/${carImgVariable}.png`,
      "alt": "car",
      "title": `${carImgVariable}`
    }, null);
    const carImgFigure = (0, _elementBuilder.default)("figure", {
      "class": "image is-96x96"
    }, null, carImg);
    const carImgParent = (0, _elementBuilder.default)("div", {
      "class": "media-left"
    }, null, carImgFigure);
    const media = (0, _elementBuilder.default)("div", {
      "class": "media"
    }, null, carImgParent, userInfo);
    const content = (0, _elementBuilder.default)("div", {
      "class": "card-content"
    }, null, media); // main profile picture

    const Img = (0, _elementBuilder.default)("img", {
      "src": `${profileImgVariable}`,
      "alt": "profile picture",
      "title": `${profileImgTitle}`
    });
    const figure = (0, _elementBuilder.default)("figure", {
      "class": "image"
    }, null, Img);
    const profilePicture = (0, _elementBuilder.default)("div", {
      "class": "card-image"
    }, null, figure);
    const card = (0, _elementBuilder.default)("div", {
      "class": "card"
    }, null, profilePicture, content, totalGoals, totalGames, userPlaystyle); // parent containers that organize profile information into columns

    const blankColumnLeft = (0, _elementBuilder.default)("div", {
      "class": "column is-one-fourth"
    }, null);
    const profileColumn = (0, _elementBuilder.default)("div", {
      "class": "column is-half"
    }, null, card);
    const blankColumnRight = (0, _elementBuilder.default)("div", {
      "class": "column is-one-fourth"
    }, null);
    const columns = (0, _elementBuilder.default)("div", {
      "class": "columns is-vcentered"
    }, null, blankColumnLeft, profileColumn, blankColumnRight);
    const playerProfile = (0, _elementBuilder.default)("div", {
      "id": "profileContainer",
      "class": "container",
      "style": "padding:20px;"
    }, null, columns);
    fragment.appendChild(playerProfile);
    webpage.appendChild(fragment);
  }

};
var _default = profile;
exports.default = _default;

},{"./API":2,"./elementBuilder":4}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class shotOnGoal {
  set fieldX(fieldX) {
    this._fieldX = fieldX;
  }

  set fieldY(fieldY) {
    this._fieldY = fieldY;
  }

  set goalX(goalX) {
    this._goalX = goalX;
  }

  set goalY(goalY) {
    this._goalY = goalY;
  }

  set aerial(aerialBoolean) {
    this._aerial = aerialBoolean;
  }

  set ballSpeed(ballSpeed) {
    this.ball_speed = ballSpeed;
  }

  set timeStamp(dateObj) {
    this._timeStamp = dateObj;
  }

}

var _default = shotOnGoal;
exports.default = _default;

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _shotClass = _interopRequireDefault(require("./shotClass"));

var _gameData = _interopRequireDefault(require("./gameData"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let shotCounter = 0;
let editingShot = false; //editing shot is used for both new and old shots

let shotObj = undefined;
let shotArray = []; // reset when game is saved
// global vars used with shot editing

let previousShotObj;
let previousShotFieldX;
let previousShotFieldY;
let previousShotGoalX;
let previousShotGoalY; // global var used when saving an edited game (to determine if new shots were added for POST)

let initialLengthOfShotArray;
const shotData = {
  resetGlobalShotVariables() {
    // this function is called when gameplay is clicked on the navbar and when a game is saved, in order to prevent bugs with previously created shots
    shotCounter = 0;
    editingShot = false;
    shotObj = undefined;
    shotArray = [];
    previousShotObj = undefined;
    previousShotFieldX = undefined;
    previousShotFieldY = undefined;
    previousShotGoalX = undefined;
    previousShotGoalY = undefined;
    initialLengthOfShotArray = undefined;
  },

  createNewShot() {
    const btn_newShot = document.getElementById("newShot");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");
    shotObj = new _shotClass.default();
    shotObj.timeStamp = new Date(); // prevent user from selecting any edit shot buttons

    shotData.disableEditShotbuttons(true);
    editingShot = true;
    btn_newShot.disabled = true;
    fieldImg.addEventListener("click", shotData.getClickCoords);
    goalImg.addEventListener("click", shotData.getClickCoords); // activate click functionality and conditional statements on both field and goal images
  },

  getClickCoords(e) {
    // this function gets the relative x and y of the click within the field image container
    // and then calls the function that appends a marker on the page
    let parentContainer;

    if (e.target.id === "field-img") {
      parentContainer = document.getElementById("field-img-parent");
    } else {
      parentContainer = document.getElementById("goal-img-parent");
    } // offsetX and Y are the x and y coordinates (pixels) of the click in the container
    // the expressions divide the click x and y by the parent full width and height


    const xCoordRelative = Number((e.offsetX / parentContainer.offsetWidth).toFixed(3));
    const yCoordRelative = Number((e.offsetY / parentContainer.offsetHeight).toFixed(3)); // restrict user from submitting a click in the goal if y < 0.20 or y > 0.85 or x > 0.90 or x < 0.10

    if (parentContainer.id === "goal-img-parent" && yCoordRelative < 0.20 || yCoordRelative > 0.85 || xCoordRelative < 0.10 || xCoordRelative > 0.90) {
      return;
    } else {
      shotData.markClickonImage(xCoordRelative, yCoordRelative, parentContainer);
    }
  },

  markClickonImage(x, y, parentContainer) {
    console.log(x, y);
    let markerId;

    if (parentContainer.id === "field-img-parent") {
      markerId = "shot-marker-field";
    } else {
      markerId = "shot-marker-goal";
    } // adjust for 50% of width and height of marker so it's centered about mouse pointer


    let adjustMarkerX = 12.5 / parentContainer.offsetWidth;
    let adjustMarkerY = 12.5 / parentContainer.offsetHeight; // if there's NOT already a marker, then make one and place it

    if (!parentContainer.contains(document.getElementById(markerId))) {
      this.generateMarker(parentContainer, adjustMarkerX, adjustMarkerY, markerId, x, y); // else move the existing marker to the new position
    } else {
      this.moveMarker(markerId, x, y, adjustMarkerX, adjustMarkerY);
    } // save coordinates to object


    this.addCoordsToClass(markerId, x, y);
  },

  generateMarker(parentContainer, adjustMarkerX, adjustMarkerY, markerId, x, y) {
    const div = document.createElement("div");
    div.id = markerId;
    div.style.width = "25px";
    div.style.height = "25px";
    div.style.backgroundColor = "firebrick";
    div.style.border = "1px solid black";
    div.style.borderRadius = "50%";
    div.style.position = "absolute";
    div.style.left = (x - adjustMarkerX) * 100 + "%";
    div.style.top = (y - adjustMarkerY) * 100 + "%";
    parentContainer.appendChild(div);
  },

  moveMarker(markerId, x, y, adjustMarkerX, adjustMarkerY) {
    const currentMarker = document.getElementById(markerId);
    currentMarker.style.left = (x - adjustMarkerX) * 100 + "%";
    currentMarker.style.top = (y - adjustMarkerY) * 100 + "%";
  },

  addCoordsToClass(markerId, x, y) {
    // this function updates the instance of shotOnGoal class to record click coordinates
    // if a shot is being edited, then append the coordinates to the object in question
    if (previousShotObj !== undefined) {
      if (markerId === "shot-marker-field") {
        // use global vars instead of updating object directly here to prevent accidental editing of marker without clicking "save shot"
        previousShotFieldX = x;
        previousShotFieldY = y;
      } else {
        previousShotGoalX = x;
        previousShotGoalY = y;
      } // otherwise, a new shot is being created, so append coordinates to the new object

    } else {
      if (markerId === "shot-marker-field") {
        shotObj.fieldX = x;
        shotObj.fieldY = y;
      } else {
        shotObj.goalX = x;
        shotObj.goalY = y;
      }
    }
  },

  cancelShot() {
    const btn_newShot = document.getElementById("newShot");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");
    const fieldImgParent = document.getElementById("field-img-parent");
    const goalImgParent = document.getElementById("goal-img-parent");
    const fieldMarker = document.getElementById("shot-marker-field");
    const goalMarker = document.getElementById("shot-marker-goal");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");

    if (!editingShot) {
      return;
    } else {
      editingShot = false;
      btn_newShot.disabled = false;
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard"; // if a new shot is being created, cancel the new instance of shotClass

      shotObj = undefined; // if a previously saved shot is being edited, then set global vars to undefined

      previousShotObj = undefined;
      previousShotFieldX = undefined;
      previousShotFieldY = undefined;
      previousShotGoalX = undefined;
      previousShotGoalY = undefined; // remove markers from field and goal

      if (fieldMarker !== null) {
        fieldImgParent.removeChild(fieldMarker);
      }

      if (goalMarker !== null) {
        goalImgParent.removeChild(goalMarker);
      } // remove click listeners from field and goal


      fieldImg.removeEventListener("click", shotData.getClickCoords);
      goalImg.removeEventListener("click", shotData.getClickCoords); // allow user to select edit shot buttons

      shotData.disableEditShotbuttons(false);
    }
  },

  saveShot() {
    const btn_newShot = document.getElementById("newShot");
    const fieldImgParent = document.getElementById("field-img-parent");
    const goalImgParent = document.getElementById("goal-img-parent");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");
    const fieldMarker = document.getElementById("shot-marker-field");
    const goalMarker = document.getElementById("shot-marker-goal");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");
    const shotBtnContainer = document.getElementById("shotControls");

    if (!editingShot) {
      return;
    } else {
      editingShot = false;
      btn_newShot.disabled = false; // clear field and goal event listeners

      fieldImg.removeEventListener("click", shotData.getClickCoords);
      goalImg.removeEventListener("click", shotData.getClickCoords); // remove markers from field and goal

      fieldImgParent.removeChild(fieldMarker);
      goalImgParent.removeChild(goalMarker); // conditional statement to save correct object (i.e. shot being edited vs. new shot)
      // if shot is being edited, then previousShotObj will not be undefined

      if (previousShotObj !== undefined) {
        if (sel_aerial.value === "Aerial") {
          previousShotObj._aerial = true;
        } else {
          previousShotObj._aerial = false;
        }

        ;
        previousShotObj.ball_speed = inpt_ballSpeed.value;
        previousShotObj._fieldX = previousShotFieldX;
        previousShotObj._fieldY = previousShotFieldY;
        previousShotObj._goalX = previousShotGoalX;
        previousShotObj._goalY = previousShotGoalY; // else save to new instance of class and append button to page with correct ID for editing
      } else {
        if (sel_aerial.value === "Aerial") {
          shotObj.aerial = true;
        } else {
          shotObj.aerial = false;
        }

        ;
        shotObj.ballSpeed = inpt_ballSpeed.value;
        shotArray.push(shotObj); // append new button

        shotCounter++;
        const newShotBtn = (0, _elementBuilder.default)("button", {
          "id": `shot-${shotCounter}`,
          "class": "button is-link"
        }, `Shot ${shotCounter}`);
        shotBtnContainer.appendChild(newShotBtn);
        document.getElementById(`shot-${shotCounter}`).addEventListener("click", shotData.renderSavedShot);
      } //TODO: add condition to prevent blank entries and missing coordinates


      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard"; // cancel the new instance of shotClass (matters if a new shot is being created)

      shotObj = undefined; // set global vars to undefined (matters if a previously saved shot is being edited)

      previousShotObj = undefined;
      previousShotFieldX = undefined;
      previousShotFieldY = undefined;
      previousShotGoalX = undefined;
      previousShotGoalY = undefined; // allow user to select any edit shot buttons

      shotData.disableEditShotbuttons(false);
    }
  },

  renderSavedShot(e) {
    // this function references the shotArray to get a shot object that matches the shot# button clicked (e.g. shot 2 button = index 1 of the shotArray)
    // the function (and its associated conditional statements in other local functions) has these basic requirements:
    // re-initialize click listeners on images
    // revive a saved instance of shotClass for editing shot coordinates, ball speed, and aerial
    // render markers for existing coordinates on field and goal images
    // affordance to save edits
    // affordance to cancel edits
    // the data is rendered on the page and can be saved (overwritten) by using the "save shot" button or canceled by clicking the "cancel shot" button
    const btn_newShot = document.getElementById("newShot");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img"); // prevent new shot button from being clicked

    btn_newShot.disabled = true; // allow cancel and saved buttons to be clicked

    editingShot = true; // get ID of shot# btn clicked and access shotArray at [btnID - 1]

    let btnId = e.target.id.slice(5);
    previousShotObj = shotArray[btnId - 1]; // render ball speed and aerial dropdown for the shot

    inpt_ballSpeed.value = previousShotObj.ball_speed;

    if (previousShotObj._aerial === true) {
      sel_aerial.value = "Aerial";
    } else {
      sel_aerial.value = "Standard";
    } // add event listeners to field and goal


    fieldImg.addEventListener("click", shotData.getClickCoords);
    goalImg.addEventListener("click", shotData.getClickCoords); // render shot marker on field

    let parentContainer = document.getElementById("field-img-parent");
    let x = previousShotObj._fieldX * parentContainer.offsetWidth / parentContainer.offsetWidth;
    let y = previousShotObj._fieldY * parentContainer.offsetHeight / parentContainer.offsetHeight;
    shotData.markClickonImage(x, y, parentContainer); // render goal marker on field

    parentContainer = document.getElementById("goal-img-parent");
    x = Number((previousShotObj._goalX * parentContainer.offsetWidth / parentContainer.offsetWidth).toFixed(3));
    y = Number((previousShotObj._goalY * parentContainer.offsetHeight / parentContainer.offsetHeight).toFixed(3));
    shotData.markClickonImage(x, y, parentContainer);
  },

  disableEditShotbuttons(disableOrNot) {
    // for each button after "New Shot", "Save Shot", and "Cancel Shot" disable the buttons if the user is creating a new shot (disableOrNot = true) or enable them on save/cancel of a new shot (disableOrNot = false)
    const shotBtnContainer = document.getElementById("shotControls");
    let editBtn;
    let length = shotBtnContainer.childNodes.length;

    for (let i = 3; i < length; i++) {
      editBtn = document.getElementById(`shot-${i - 2}`);
      editBtn.disabled = disableOrNot;
    }
  },

  getShotObjectsForSaving() {
    // provides array for use in gameData.js (when saving a new game, not when saving an edited game)
    return shotArray;
  },

  getInitialNumOfShots() {
    // provides initial number of shots that were saved to database to gameData.js to identify an edited game is being saved
    return initialLengthOfShotArray;
  },

  renderShotsButtonsFromPreviousGame() {
    // this function requests the array of shots from the previous saved game, sets it as shotArray, and renders shot buttons
    const shotBtnContainer = document.getElementById("shotControls"); // get saved game with shots embedded as array

    let savedGameObj = _gameData.default.provideShotsToShotData(); // create shotArray with format required by local functions


    let savedShotObj;
    savedGameObj.shots.forEach(shot => {
      savedShotObj = new _shotClass.default();
      savedShotObj.fieldX = shot.fieldX;
      savedShotObj.fieldY = shot.fieldY;
      savedShotObj.goalX = shot.goalX;
      savedShotObj.goalY = shot.goalY;
      savedShotObj.aerial = shot.aerial;
      savedShotObj.ball_speed = shot.ball_speed.toString();
      savedShotObj.timeStamp = shot.timeStamp;
      savedShotObj.id = shot.id;
      shotArray.push(savedShotObj);
    });
    console.log(shotArray);
    shotArray.forEach((shot, idx) => {
      const newShotBtn = (0, _elementBuilder.default)("button", {
        "id": `shot-${idx + 1}`,
        "class": "button is-link"
      }, `Shot ${idx + 1}`);
      shotBtnContainer.appendChild(newShotBtn);
      document.getElementById(`shot-${idx + 1}`).addEventListener("click", shotData.renderSavedShot);
    });
    shotCounter = shotArray.length;
    initialLengthOfShotArray = shotArray.length;
  }

};
var _default = shotData;
exports.default = _default;

},{"./elementBuilder":4,"./gameData":5,"./shotClass":14}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2RhdGVGaWx0ZXIuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwRmVlZGJhY2suanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBzLmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIiwiLi4vc2NyaXB0cy9zaG90Q2xhc3MuanMiLCIuLi9zY3JpcHRzL3Nob3REYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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T0FBNUQsRUFBcUUsUUFBUSxDQUFDLGVBQTlFO0FBQ0QsS0FKRDtBQUtBLElBQUEsV0FBVyxHQUFHLFNBQVMsQ0FBQyxNQUF4QjtBQUNBLElBQUEsd0JBQXdCLEdBQUcsU0FBUyxDQUFDLE1BQXJDO0FBQ0Q7O0FBNVRjLENBQWpCO2VBZ1VlLFEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogaGVhdG1hcC5qcyB2Mi4wLjUgfCBKYXZhU2NyaXB0IEhlYXRtYXAgTGlicmFyeVxuICpcbiAqIENvcHlyaWdodCAyMDA4LTIwMTYgUGF0cmljayBXaWVkIDxoZWF0bWFwanNAcGF0cmljay13aWVkLmF0PiAtIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIE1JVCBhbmQgQmVlcndhcmUgbGljZW5zZSBcbiAqXG4gKiA6OiAyMDE2LTA5LTA1IDAxOjE2XG4gKi9cbjsoZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGZhY3RvcnkpIHtcblxuICAvLyBTdXBwb3J0cyBVTUQuIEFNRCwgQ29tbW9uSlMvTm9kZS5qcyBhbmQgYnJvd3NlciBjb250ZXh0XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dFtuYW1lXSA9IGZhY3RvcnkoKTtcbiAgfVxuXG59KShcImgzMzdcIiwgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4vLyBIZWF0bWFwIENvbmZpZyBzdG9yZXMgZGVmYXVsdCB2YWx1ZXMgYW5kIHdpbGwgYmUgbWVyZ2VkIHdpdGggaW5zdGFuY2UgY29uZmlnXG52YXIgSGVhdG1hcENvbmZpZyA9IHtcbiAgZGVmYXVsdFJhZGl1czogNDAsXG4gIGRlZmF1bHRSZW5kZXJlcjogJ2NhbnZhczJkJyxcbiAgZGVmYXVsdEdyYWRpZW50OiB7IDAuMjU6IFwicmdiKDAsMCwyNTUpXCIsIDAuNTU6IFwicmdiKDAsMjU1LDApXCIsIDAuODU6IFwieWVsbG93XCIsIDEuMDogXCJyZ2IoMjU1LDAsMClcIn0sXG4gIGRlZmF1bHRNYXhPcGFjaXR5OiAxLFxuICBkZWZhdWx0TWluT3BhY2l0eTogMCxcbiAgZGVmYXVsdEJsdXI6IC44NSxcbiAgZGVmYXVsdFhGaWVsZDogJ3gnLFxuICBkZWZhdWx0WUZpZWxkOiAneScsXG4gIGRlZmF1bHRWYWx1ZUZpZWxkOiAndmFsdWUnLCBcbiAgcGx1Z2luczoge31cbn07XG52YXIgU3RvcmUgPSAoZnVuY3Rpb24gU3RvcmVDbG9zdXJlKCkge1xuXG4gIHZhciBTdG9yZSA9IGZ1bmN0aW9uIFN0b3JlKGNvbmZpZykge1xuICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0ge307XG4gICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgIHRoaXMuX3JhZGkgPSBbXTtcbiAgICB0aGlzLl9taW4gPSAxMDtcbiAgICB0aGlzLl9tYXggPSAxO1xuICAgIHRoaXMuX3hGaWVsZCA9IGNvbmZpZ1sneEZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRYRmllbGQ7XG4gICAgdGhpcy5feUZpZWxkID0gY29uZmlnWyd5RmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFlGaWVsZDtcbiAgICB0aGlzLl92YWx1ZUZpZWxkID0gY29uZmlnWyd2YWx1ZUZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRWYWx1ZUZpZWxkO1xuXG4gICAgaWYgKGNvbmZpZ1tcInJhZGl1c1wiXSkge1xuICAgICAgdGhpcy5fY2ZnUmFkaXVzID0gY29uZmlnW1wicmFkaXVzXCJdO1xuICAgIH1cbiAgfTtcblxuICB2YXIgZGVmYXVsdFJhZGl1cyA9IEhlYXRtYXBDb25maWcuZGVmYXVsdFJhZGl1cztcblxuICBTdG9yZS5wcm90b3R5cGUgPSB7XG4gICAgLy8gd2hlbiBmb3JjZVJlbmRlciA9IGZhbHNlIC0+IGNhbGxlZCBmcm9tIHNldERhdGEsIG9taXRzIHJlbmRlcmFsbCBldmVudFxuICAgIF9vcmdhbmlzZURhdGE6IGZ1bmN0aW9uKGRhdGFQb2ludCwgZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgdmFyIHggPSBkYXRhUG9pbnRbdGhpcy5feEZpZWxkXTtcbiAgICAgICAgdmFyIHkgPSBkYXRhUG9pbnRbdGhpcy5feUZpZWxkXTtcbiAgICAgICAgdmFyIHJhZGkgPSB0aGlzLl9yYWRpO1xuICAgICAgICB2YXIgc3RvcmUgPSB0aGlzLl9kYXRhO1xuICAgICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4O1xuICAgICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhUG9pbnRbdGhpcy5fdmFsdWVGaWVsZF0gfHwgMTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IGRhdGFQb2ludC5yYWRpdXMgfHwgdGhpcy5fY2ZnUmFkaXVzIHx8IGRlZmF1bHRSYWRpdXM7XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XSkge1xuICAgICAgICAgIHN0b3JlW3hdID0gW107XG4gICAgICAgICAgcmFkaVt4XSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XVt5XSkge1xuICAgICAgICAgIHN0b3JlW3hdW3ldID0gdmFsdWU7XG4gICAgICAgICAgcmFkaVt4XVt5XSA9IHJhZGl1cztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9yZVt4XVt5XSArPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RvcmVkVmFsID0gc3RvcmVbeF1beV07XG5cbiAgICAgICAgaWYgKHN0b3JlZFZhbCA+IG1heCkge1xuICAgICAgICAgIGlmICghZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21heCA9IHN0b3JlZFZhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXREYXRhTWF4KHN0b3JlZFZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yZWRWYWwgPCBtaW4pIHtcbiAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9taW4gPSBzdG9yZWRWYWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YU1pbihzdG9yZWRWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICB4OiB4LCBcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsIFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpdXMsXG4gICAgICAgICAgICBtaW46IG1pbixcbiAgICAgICAgICAgIG1heDogbWF4IFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIF91bk9yZ2FuaXplRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdW5vcmdhbml6ZWREYXRhID0gW107XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG4gICAgICB2YXIgcmFkaSA9IHRoaXMuX3JhZGk7XG5cbiAgICAgIGZvciAodmFyIHggaW4gZGF0YSkge1xuICAgICAgICBmb3IgKHZhciB5IGluIGRhdGFbeF0pIHtcblxuICAgICAgICAgIHVub3JnYW5pemVkRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpW3hdW3ldLFxuICAgICAgICAgICAgdmFsdWU6IGRhdGFbeF1beV1cbiAgICAgICAgICB9KTtcblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgIGRhdGE6IHVub3JnYW5pemVkRGF0YVxuICAgICAgfTtcbiAgICB9LFxuICAgIF9vbkV4dHJlbWFDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgnZXh0cmVtYWNoYW5nZScsIHtcbiAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgIG1heDogdGhpcy5fbWF4XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFkZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGFyZ3VtZW50c1swXS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBkYXRhQXJyID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB2YXIgZGF0YUxlbiA9IGRhdGFBcnIubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoZGF0YUxlbi0tKSB7XG4gICAgICAgICAgdGhpcy5hZGREYXRhLmNhbGwodGhpcywgZGF0YUFycltkYXRhTGVuXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCB0byBzdG9yZSAgXG4gICAgICAgIHZhciBvcmdhbmlzZWRFbnRyeSA9IHRoaXMuX29yZ2FuaXNlRGF0YShhcmd1bWVudHNbMF0sIHRydWUpO1xuICAgICAgICBpZiAob3JnYW5pc2VkRW50cnkpIHtcbiAgICAgICAgICAvLyBpZiBpdCdzIHRoZSBmaXJzdCBkYXRhcG9pbnQgaW5pdGlhbGl6ZSB0aGUgZXh0cmVtYXMgd2l0aCBpdFxuICAgICAgICAgIGlmICh0aGlzLl9kYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fbWluID0gdGhpcy5fbWF4ID0gb3JnYW5pc2VkRW50cnkudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcnBhcnRpYWwnLCB7XG4gICAgICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICAgICAgZGF0YTogW29yZ2FuaXNlZEVudHJ5XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBkYXRhUG9pbnRzID0gZGF0YS5kYXRhO1xuICAgICAgdmFyIHBvaW50c0xlbiA9IGRhdGFQb2ludHMubGVuZ3RoO1xuXG5cbiAgICAgIC8vIHJlc2V0IGRhdGEgYXJyYXlzXG4gICAgICB0aGlzLl9kYXRhID0gW107XG4gICAgICB0aGlzLl9yYWRpID0gW107XG5cbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwb2ludHNMZW47IGkrKykge1xuICAgICAgICB0aGlzLl9vcmdhbmlzZURhdGEoZGF0YVBvaW50c1tpXSwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWF4ID0gZGF0YS5tYXg7XG4gICAgICB0aGlzLl9taW4gPSBkYXRhLm1pbiB8fCAwO1xuICAgICAgXG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUT0RPOiBpbXBsZW1lbnRcbiAgICB9LFxuICAgIHNldERhdGFNYXg6IGZ1bmN0aW9uKG1heCkge1xuICAgICAgdGhpcy5fbWF4ID0gbWF4O1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKG1pbikge1xuICAgICAgdGhpcy5fbWluID0gbWluO1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldENvb3JkaW5hdG9yOiBmdW5jdGlvbihjb29yZGluYXRvcikge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IgPSBjb29yZGluYXRvcjtcbiAgICB9LFxuICAgIF9nZXRJbnRlcm5hbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHsgXG4gICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICBtaW46IHRoaXMuX21pbiwgXG4gICAgICAgIGRhdGE6IHRoaXMuX2RhdGEsXG4gICAgICAgIHJhZGk6IHRoaXMuX3JhZGkgXG4gICAgICB9O1xuICAgIH0sXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdW5Pcmdhbml6ZURhdGEoKTtcbiAgICB9LyosXG5cbiAgICAgIFRPRE86IHJldGhpbmsuXG5cbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHJhZGl1cyA9IDEwMDtcbiAgICAgIHZhciB4ID0gcG9pbnQueDtcbiAgICAgIHZhciB5ID0gcG9pbnQueTtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgICAgaWYgKGRhdGFbeF0gJiYgZGF0YVt4XVt5XSkge1xuICAgICAgICByZXR1cm4gZGF0YVt4XVt5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgLy8gcmFkaWFsIHNlYXJjaCBmb3IgZGF0YXBvaW50cyBiYXNlZCBvbiBkZWZhdWx0IHJhZGl1c1xuICAgICAgICBmb3IodmFyIGRpc3RhbmNlID0gMTsgZGlzdGFuY2UgPCByYWRpdXM7IGRpc3RhbmNlKyspIHtcbiAgICAgICAgICB2YXIgbmVpZ2hib3JzID0gZGlzdGFuY2UgKiAyICsxO1xuICAgICAgICAgIHZhciBzdGFydFggPSB4IC0gZGlzdGFuY2U7XG4gICAgICAgICAgdmFyIHN0YXJ0WSA9IHkgLSBkaXN0YW5jZTtcblxuICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgbyA9IDA7IG8gPCBuZWlnaGJvcnM7IG8rKykge1xuICAgICAgICAgICAgICBpZiAoKGkgPT0gMCB8fCBpID09IG5laWdoYm9ycy0xKSB8fCAobyA9PSAwIHx8IG8gPT0gbmVpZ2hib3JzLTEpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFbc3RhcnRZK2ldICYmIGRhdGFbc3RhcnRZK2ldW3N0YXJ0WCtvXSkge1xuICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goZGF0YVtzdGFydFkraV1bc3RhcnRYK29dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCB2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSovXG4gIH07XG5cblxuICByZXR1cm4gU3RvcmU7XG59KSgpO1xuXG52YXIgQ2FudmFzMmRSZW5kZXJlciA9IChmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyQ2xvc3VyZSgpIHtcblxuICB2YXIgX2dldENvbG9yUGFsZXR0ZSA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBncmFkaWVudENvbmZpZyA9IGNvbmZpZy5ncmFkaWVudCB8fCBjb25maWcuZGVmYXVsdEdyYWRpZW50O1xuICAgIHZhciBwYWxldHRlQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHBhbGV0dGVDdHggPSBwYWxldHRlQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBwYWxldHRlQ2FudmFzLndpZHRoID0gMjU2O1xuICAgIHBhbGV0dGVDYW52YXMuaGVpZ2h0ID0gMTtcblxuICAgIHZhciBncmFkaWVudCA9IHBhbGV0dGVDdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMjU2LCAxKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZ3JhZGllbnRDb25maWcpIHtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChrZXksIGdyYWRpZW50Q29uZmlnW2tleV0pO1xuICAgIH1cblxuICAgIHBhbGV0dGVDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgcGFsZXR0ZUN0eC5maWxsUmVjdCgwLCAwLCAyNTYsIDEpO1xuXG4gICAgcmV0dXJuIHBhbGV0dGVDdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIDI1NiwgMSkuZGF0YTtcbiAgfTtcblxuICB2YXIgX2dldFBvaW50VGVtcGxhdGUgPSBmdW5jdGlvbihyYWRpdXMsIGJsdXJGYWN0b3IpIHtcbiAgICB2YXIgdHBsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHRwbEN0eCA9IHRwbENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHZhciB4ID0gcmFkaXVzO1xuICAgIHZhciB5ID0gcmFkaXVzO1xuICAgIHRwbENhbnZhcy53aWR0aCA9IHRwbENhbnZhcy5oZWlnaHQgPSByYWRpdXMqMjtcblxuICAgIGlmIChibHVyRmFjdG9yID09IDEpIHtcbiAgICAgIHRwbEN0eC5iZWdpblBhdGgoKTtcbiAgICAgIHRwbEN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgdHBsQ3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEpJztcbiAgICAgIHRwbEN0eC5maWxsKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBncmFkaWVudCA9IHRwbEN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudCh4LCB5LCByYWRpdXMqYmx1ckZhY3RvciwgeCwgeSwgcmFkaXVzKTtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLDAsMCwxKScpO1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDApJyk7XG4gICAgICB0cGxDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICB0cGxDdHguZmlsbFJlY3QoMCwgMCwgMipyYWRpdXMsIDIqcmFkaXVzKTtcbiAgICB9XG5cblxuXG4gICAgcmV0dXJuIHRwbENhbnZhcztcbiAgfTtcblxuICB2YXIgX3ByZXBhcmVEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZW5kZXJEYXRhID0gW107XG4gICAgdmFyIG1pbiA9IGRhdGEubWluO1xuICAgIHZhciBtYXggPSBkYXRhLm1heDtcbiAgICB2YXIgcmFkaSA9IGRhdGEucmFkaTtcbiAgICB2YXIgZGF0YSA9IGRhdGEuZGF0YTtcblxuICAgIHZhciB4VmFsdWVzID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gICAgdmFyIHhWYWx1ZXNMZW4gPSB4VmFsdWVzLmxlbmd0aDtcblxuICAgIHdoaWxlKHhWYWx1ZXNMZW4tLSkge1xuICAgICAgdmFyIHhWYWx1ZSA9IHhWYWx1ZXNbeFZhbHVlc0xlbl07XG4gICAgICB2YXIgeVZhbHVlcyA9IE9iamVjdC5rZXlzKGRhdGFbeFZhbHVlXSk7XG4gICAgICB2YXIgeVZhbHVlc0xlbiA9IHlWYWx1ZXMubGVuZ3RoO1xuICAgICAgd2hpbGUoeVZhbHVlc0xlbi0tKSB7XG4gICAgICAgIHZhciB5VmFsdWUgPSB5VmFsdWVzW3lWYWx1ZXNMZW5dO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3hWYWx1ZV1beVZhbHVlXTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IHJhZGlbeFZhbHVlXVt5VmFsdWVdO1xuICAgICAgICByZW5kZXJEYXRhLnB1c2goe1xuICAgICAgICAgIHg6IHhWYWx1ZSxcbiAgICAgICAgICB5OiB5VmFsdWUsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgIHJhZGl1czogcmFkaXVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtaW46IG1pbixcbiAgICAgIG1heDogbWF4LFxuICAgICAgZGF0YTogcmVuZGVyRGF0YVxuICAgIH07XG4gIH07XG5cblxuICBmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyKGNvbmZpZykge1xuICAgIHZhciBjb250YWluZXIgPSBjb25maWcuY29udGFpbmVyO1xuICAgIHZhciBzaGFkb3dDYW52YXMgPSB0aGlzLnNoYWRvd0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcyA9IGNvbmZpZy5jYW52YXMgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHJlbmRlckJvdW5kYXJpZXMgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAwLCAxMDAwMCwgMCwgMF07XG5cbiAgICB2YXIgY29tcHV0ZWQgPSBnZXRDb21wdXRlZFN0eWxlKGNvbmZpZy5jb250YWluZXIpIHx8IHt9O1xuXG4gICAgY2FudmFzLmNsYXNzTmFtZSA9ICdoZWF0bWFwLWNhbnZhcyc7XG5cbiAgICB0aGlzLl93aWR0aCA9IGNhbnZhcy53aWR0aCA9IHNoYWRvd0NhbnZhcy53aWR0aCA9IGNvbmZpZy53aWR0aCB8fCArKGNvbXB1dGVkLndpZHRoLnJlcGxhY2UoL3B4LywnJykpO1xuICAgIHRoaXMuX2hlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSBzaGFkb3dDYW52YXMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCB8fCArKGNvbXB1dGVkLmhlaWdodC5yZXBsYWNlKC9weC8sJycpKTtcblxuICAgIHRoaXMuc2hhZG93Q3R4ID0gc2hhZG93Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIC8vIEBUT0RPOlxuICAgIC8vIGNvbmRpdGlvbmFsIHdyYXBwZXJcblxuICAgIGNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gc2hhZG93Q2FudmFzLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246YWJzb2x1dGU7bGVmdDowO3RvcDowOyc7XG5cbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgdGhpcy5fcGFsZXR0ZSA9IF9nZXRDb2xvclBhbGV0dGUoY29uZmlnKTtcbiAgICB0aGlzLl90ZW1wbGF0ZXMgPSB7fTtcblxuICAgIHRoaXMuX3NldFN0eWxlcyhjb25maWcpO1xuICB9O1xuXG4gIENhbnZhczJkUmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAgIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9kcmF3QWxwaGEoZGF0YSk7XG4gICAgICAgIHRoaXMuX2NvbG9yaXplKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZW5kZXJBbGw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIHJlc2V0IHJlbmRlciBib3VuZGFyaWVzXG4gICAgICB0aGlzLl9jbGVhcigpO1xuICAgICAgaWYgKGRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX2RyYXdBbHBoYShfcHJlcGFyZURhdGEoZGF0YSkpO1xuICAgICAgICB0aGlzLl9jb2xvcml6ZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3VwZGF0ZUdyYWRpZW50OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX3BhbGV0dGUgPSBfZ2V0Q29sb3JQYWxldHRlKGNvbmZpZyk7XG4gICAgfSxcbiAgICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgaWYgKGNvbmZpZ1snZ3JhZGllbnQnXSkge1xuICAgICAgICB0aGlzLl91cGRhdGVHcmFkaWVudChjb25maWcpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3R5bGVzKGNvbmZpZyk7XG4gICAgfSxcbiAgICBzZXREaW1lbnNpb25zOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLnNoYWRvd0NhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zaGFkb3dDYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH0sXG4gICAgX2NsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc2hhZG93Q3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICB9LFxuICAgIF9zZXRTdHlsZXM6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fYmx1ciA9IChjb25maWcuYmx1ciA9PSAwKT8wOihjb25maWcuYmx1ciB8fCBjb25maWcuZGVmYXVsdEJsdXIpO1xuXG4gICAgICBpZiAoY29uZmlnLmJhY2tncm91bmRDb2xvcikge1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb25maWcuYmFja2dyb3VuZENvbG9yO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5zaGFkb3dDYW52YXMud2lkdGggPSBjb25maWcud2lkdGggfHwgdGhpcy5fd2lkdGg7XG4gICAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNoYWRvd0NhbnZhcy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IHx8IHRoaXMuX2hlaWdodDtcblxuXG4gICAgICB0aGlzLl9vcGFjaXR5ID0gKGNvbmZpZy5vcGFjaXR5IHx8IDApICogMjU1O1xuICAgICAgdGhpcy5fbWF4T3BhY2l0eSA9IChjb25maWcubWF4T3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1heE9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fbWluT3BhY2l0eSA9IChjb25maWcubWluT3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1pbk9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fdXNlR3JhZGllbnRPcGFjaXR5ID0gISFjb25maWcudXNlR3JhZGllbnRPcGFjaXR5O1xuICAgIH0sXG4gICAgX2RyYXdBbHBoYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbiA9IGRhdGEubWluO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heCA9IGRhdGEubWF4O1xuICAgICAgdmFyIGRhdGEgPSBkYXRhLmRhdGEgfHwgW107XG4gICAgICB2YXIgZGF0YUxlbiA9IGRhdGEubGVuZ3RoO1xuICAgICAgLy8gb24gYSBwb2ludCBiYXNpcz9cbiAgICAgIHZhciBibHVyID0gMSAtIHRoaXMuX2JsdXI7XG5cbiAgICAgIHdoaWxlKGRhdGFMZW4tLSkge1xuXG4gICAgICAgIHZhciBwb2ludCA9IGRhdGFbZGF0YUxlbl07XG5cbiAgICAgICAgdmFyIHggPSBwb2ludC54O1xuICAgICAgICB2YXIgeSA9IHBvaW50Lnk7XG4gICAgICAgIHZhciByYWRpdXMgPSBwb2ludC5yYWRpdXM7XG4gICAgICAgIC8vIGlmIHZhbHVlIGlzIGJpZ2dlciB0aGFuIG1heFxuICAgICAgICAvLyB1c2UgbWF4IGFzIHZhbHVlXG4gICAgICAgIHZhciB2YWx1ZSA9IE1hdGgubWluKHBvaW50LnZhbHVlLCBtYXgpO1xuICAgICAgICB2YXIgcmVjdFggPSB4IC0gcmFkaXVzO1xuICAgICAgICB2YXIgcmVjdFkgPSB5IC0gcmFkaXVzO1xuICAgICAgICB2YXIgc2hhZG93Q3R4ID0gdGhpcy5zaGFkb3dDdHg7XG5cblxuXG5cbiAgICAgICAgdmFyIHRwbDtcbiAgICAgICAgaWYgKCF0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXSkge1xuICAgICAgICAgIHRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdID0gdHBsID0gX2dldFBvaW50VGVtcGxhdGUocmFkaXVzLCBibHVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cGwgPSB0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXTtcbiAgICAgICAgfVxuICAgICAgICAvLyB2YWx1ZSBmcm9tIG1pbmltdW0gLyB2YWx1ZSByYW5nZVxuICAgICAgICAvLyA9PiBbMCwgMV1cbiAgICAgICAgdmFyIHRlbXBsYXRlQWxwaGEgPSAodmFsdWUtbWluKS8obWF4LW1pbik7XG4gICAgICAgIC8vIHRoaXMgZml4ZXMgIzE3Njogc21hbGwgdmFsdWVzIGFyZSBub3QgdmlzaWJsZSBiZWNhdXNlIGdsb2JhbEFscGhhIDwgLjAxIGNhbm5vdCBiZSByZWFkIGZyb20gaW1hZ2VEYXRhXG4gICAgICAgIHNoYWRvd0N0eC5nbG9iYWxBbHBoYSA9IHRlbXBsYXRlQWxwaGEgPCAuMDEgPyAuMDEgOiB0ZW1wbGF0ZUFscGhhO1xuXG4gICAgICAgIHNoYWRvd0N0eC5kcmF3SW1hZ2UodHBsLCByZWN0WCwgcmVjdFkpO1xuXG4gICAgICAgIC8vIHVwZGF0ZSByZW5kZXJCb3VuZGFyaWVzXG4gICAgICAgIGlmIChyZWN0WCA8IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0gPSByZWN0WDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RZIDwgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSA9IHJlY3RZO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFggKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gPSByZWN0WCArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFkgKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gPSByZWN0WSArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cblxuICAgICAgfVxuICAgIH0sXG4gICAgX2NvbG9yaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB4ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXTtcbiAgICAgIHZhciB5ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXTtcbiAgICAgIHZhciB3aWR0aCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gLSB4O1xuICAgICAgdmFyIGhlaWdodCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gLSB5O1xuICAgICAgdmFyIG1heFdpZHRoID0gdGhpcy5fd2lkdGg7XG4gICAgICB2YXIgbWF4SGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xuICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5O1xuICAgICAgdmFyIG1heE9wYWNpdHkgPSB0aGlzLl9tYXhPcGFjaXR5O1xuICAgICAgdmFyIG1pbk9wYWNpdHkgPSB0aGlzLl9taW5PcGFjaXR5O1xuICAgICAgdmFyIHVzZUdyYWRpZW50T3BhY2l0eSA9IHRoaXMuX3VzZUdyYWRpZW50T3BhY2l0eTtcblxuICAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgIHggPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHkgPCAwKSB7XG4gICAgICAgIHkgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHggKyB3aWR0aCA+IG1heFdpZHRoKSB7XG4gICAgICAgIHdpZHRoID0gbWF4V2lkdGggLSB4O1xuICAgICAgfVxuICAgICAgaWYgKHkgKyBoZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgaGVpZ2h0ID0gbWF4SGVpZ2h0IC0geTtcbiAgICAgIH1cblxuICAgICAgdmFyIGltZyA9IHRoaXMuc2hhZG93Q3R4LmdldEltYWdlRGF0YSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIHZhciBpbWdEYXRhID0gaW1nLmRhdGE7XG4gICAgICB2YXIgbGVuID0gaW1nRGF0YS5sZW5ndGg7XG4gICAgICB2YXIgcGFsZXR0ZSA9IHRoaXMuX3BhbGV0dGU7XG5cblxuICAgICAgZm9yICh2YXIgaSA9IDM7IGkgPCBsZW47IGkrPSA0KSB7XG4gICAgICAgIHZhciBhbHBoYSA9IGltZ0RhdGFbaV07XG4gICAgICAgIHZhciBvZmZzZXQgPSBhbHBoYSAqIDQ7XG5cblxuICAgICAgICBpZiAoIW9mZnNldCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbmFsQWxwaGE7XG4gICAgICAgIGlmIChvcGFjaXR5ID4gMCkge1xuICAgICAgICAgIGZpbmFsQWxwaGEgPSBvcGFjaXR5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChhbHBoYSA8IG1heE9wYWNpdHkpIHtcbiAgICAgICAgICAgIGlmIChhbHBoYSA8IG1pbk9wYWNpdHkpIHtcbiAgICAgICAgICAgICAgZmluYWxBbHBoYSA9IG1pbk9wYWNpdHk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmaW5hbEFscGhhID0gYWxwaGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBtYXhPcGFjaXR5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGltZ0RhdGFbaS0zXSA9IHBhbGV0dGVbb2Zmc2V0XTtcbiAgICAgICAgaW1nRGF0YVtpLTJdID0gcGFsZXR0ZVtvZmZzZXQgKyAxXTtcbiAgICAgICAgaW1nRGF0YVtpLTFdID0gcGFsZXR0ZVtvZmZzZXQgKyAyXTtcbiAgICAgICAgaW1nRGF0YVtpXSA9IHVzZUdyYWRpZW50T3BhY2l0eSA/IHBhbGV0dGVbb2Zmc2V0ICsgM10gOiBmaW5hbEFscGhhO1xuXG4gICAgICB9XG5cbiAgICAgIGltZy5kYXRhID0gaW1nRGF0YTtcbiAgICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YShpbWcsIHgsIHkpO1xuXG4gICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAsIDEwMDAsIDAsIDBdO1xuXG4gICAgfSxcbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHNoYWRvd0N0eCA9IHRoaXMuc2hhZG93Q3R4O1xuICAgICAgdmFyIGltZyA9IHNoYWRvd0N0eC5nZXRJbWFnZURhdGEocG9pbnQueCwgcG9pbnQueSwgMSwgMSk7XG4gICAgICB2YXIgZGF0YSA9IGltZy5kYXRhWzNdO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heDtcbiAgICAgIHZhciBtaW4gPSB0aGlzLl9taW47XG5cbiAgICAgIHZhbHVlID0gKE1hdGguYWJzKG1heC1taW4pICogKGRhdGEvMjU1KSkgPj4gMDtcblxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgZ2V0RGF0YVVSTDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYW52YXMudG9EYXRhVVJMKCk7XG4gICAgfVxuICB9O1xuXG5cbiAgcmV0dXJuIENhbnZhczJkUmVuZGVyZXI7XG59KSgpO1xuXG5cbnZhciBSZW5kZXJlciA9IChmdW5jdGlvbiBSZW5kZXJlckNsb3N1cmUoKSB7XG5cbiAgdmFyIHJlbmRlcmVyRm4gPSBmYWxzZTtcblxuICBpZiAoSGVhdG1hcENvbmZpZ1snZGVmYXVsdFJlbmRlcmVyJ10gPT09ICdjYW52YXMyZCcpIHtcbiAgICByZW5kZXJlckZuID0gQ2FudmFzMmRSZW5kZXJlcjtcbiAgfVxuXG4gIHJldHVybiByZW5kZXJlckZuO1xufSkoKTtcblxuXG52YXIgVXRpbCA9IHtcbiAgbWVyZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtZXJnZWQgPSB7fTtcbiAgICB2YXIgYXJnc0xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzTGVuOyBpKyspIHtcbiAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbaV1cbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgbWVyZ2VkW2tleV0gPSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlZDtcbiAgfVxufTtcbi8vIEhlYXRtYXAgQ29uc3RydWN0b3JcbnZhciBIZWF0bWFwID0gKGZ1bmN0aW9uIEhlYXRtYXBDbG9zdXJlKCkge1xuXG4gIHZhciBDb29yZGluYXRvciA9IChmdW5jdGlvbiBDb29yZGluYXRvckNsb3N1cmUoKSB7XG5cbiAgICBmdW5jdGlvbiBDb29yZGluYXRvcigpIHtcbiAgICAgIHRoaXMuY1N0b3JlID0ge307XG4gICAgfTtcblxuICAgIENvb3JkaW5hdG9yLnByb3RvdHlwZSA9IHtcbiAgICAgIG9uOiBmdW5jdGlvbihldnROYW1lLCBjYWxsYmFjaywgc2NvcGUpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuXG4gICAgICAgIGlmICghY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgY1N0b3JlW2V2dE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgY1N0b3JlW2V2dE5hbWVdLnB1c2goKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHNjb3BlLCBkYXRhKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSxcbiAgICAgIGVtaXQ6IGZ1bmN0aW9uKGV2dE5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuICAgICAgICBpZiAoY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgdmFyIGxlbiA9IGNTdG9yZVtldnROYW1lXS5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBjU3RvcmVbZXZ0TmFtZV1baV07XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIENvb3JkaW5hdG9yO1xuICB9KSgpO1xuXG5cbiAgdmFyIF9jb25uZWN0ID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgICB2YXIgcmVuZGVyZXIgPSBzY29wZS5fcmVuZGVyZXI7XG4gICAgdmFyIGNvb3JkaW5hdG9yID0gc2NvcGUuX2Nvb3JkaW5hdG9yO1xuICAgIHZhciBzdG9yZSA9IHNjb3BlLl9zdG9yZTtcblxuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJwYXJ0aWFsJywgcmVuZGVyZXIucmVuZGVyUGFydGlhbCwgcmVuZGVyZXIpO1xuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJhbGwnLCByZW5kZXJlci5yZW5kZXJBbGwsIHJlbmRlcmVyKTtcbiAgICBjb29yZGluYXRvci5vbignZXh0cmVtYWNoYW5nZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNjb3BlLl9jb25maWcub25FeHRyZW1hQ2hhbmdlICYmXG4gICAgICBzY29wZS5fY29uZmlnLm9uRXh0cmVtYUNoYW5nZSh7XG4gICAgICAgIG1pbjogZGF0YS5taW4sXG4gICAgICAgIG1heDogZGF0YS5tYXgsXG4gICAgICAgIGdyYWRpZW50OiBzY29wZS5fY29uZmlnWydncmFkaWVudCddIHx8IHNjb3BlLl9jb25maWdbJ2RlZmF1bHRHcmFkaWVudCddXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBzdG9yZS5zZXRDb29yZGluYXRvcihjb29yZGluYXRvcik7XG4gIH07XG5cblxuICBmdW5jdGlvbiBIZWF0bWFwKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLl9jb25maWcgPSBVdGlsLm1lcmdlKEhlYXRtYXBDb25maWcsIGFyZ3VtZW50c1swXSB8fCB7fSk7XG4gICAgdGhpcy5fY29vcmRpbmF0b3IgPSBuZXcgQ29vcmRpbmF0b3IoKTtcbiAgICBpZiAoY29uZmlnWydwbHVnaW4nXSkge1xuICAgICAgdmFyIHBsdWdpblRvTG9hZCA9IGNvbmZpZ1sncGx1Z2luJ107XG4gICAgICBpZiAoIUhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5Ub0xvYWRdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGx1Z2luIFxcJycrIHBsdWdpblRvTG9hZCArICdcXCcgbm90IGZvdW5kLiBNYXliZSBpdCB3YXMgbm90IHJlZ2lzdGVyZWQuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGx1Z2luID0gSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpblRvTG9hZF07XG4gICAgICAgIC8vIHNldCBwbHVnaW4gcmVuZGVyZXIgYW5kIHN0b3JlXG4gICAgICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IHBsdWdpbi5yZW5kZXJlcihjb25maWcpO1xuICAgICAgICB0aGlzLl9zdG9yZSA9IG5ldyBwbHVnaW4uc3RvcmUoY29uZmlnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoY29uZmlnKTtcbiAgICAgIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JlKGNvbmZpZyk7XG4gICAgfVxuICAgIF9jb25uZWN0KHRoaXMpO1xuICB9O1xuXG4gIC8vIEBUT0RPOlxuICAvLyBhZGQgQVBJIGRvY3VtZW50YXRpb25cbiAgSGVhdG1hcC5wcm90b3R5cGUgPSB7XG4gICAgYWRkRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5hZGREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnJlbW92ZURhdGEgJiYgdGhpcy5fc3RvcmUucmVtb3ZlRGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWF4OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGFNYXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YU1pbi5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX2NvbmZpZyA9IFV0aWwubWVyZ2UodGhpcy5fY29uZmlnLCBjb25maWcpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIudXBkYXRlQ29uZmlnKHRoaXMuX2NvbmZpZyk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9zdG9yZS5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZXBhaW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX3N0b3JlLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlLmdldERhdGEoKTtcbiAgICB9LFxuICAgIGdldERhdGFVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldERhdGFVUkwoKTtcbiAgICB9LFxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG5cbiAgICAgIGlmICh0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KHBvaW50KTtcbiAgICAgIH0gZWxzZSAgaWYgKHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQocG9pbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBIZWF0bWFwO1xuXG59KSgpO1xuXG5cbi8vIGNvcmVcbnZhciBoZWF0bWFwRmFjdG9yeSA9IHtcbiAgY3JlYXRlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICByZXR1cm4gbmV3IEhlYXRtYXAoY29uZmlnKTtcbiAgfSxcbiAgcmVnaXN0ZXI6IGZ1bmN0aW9uKHBsdWdpbktleSwgcGx1Z2luKSB7XG4gICAgSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpbktleV0gPSBwbHVnaW47XG4gIH1cbn07XG5cbnJldHVybiBoZWF0bWFwRmFjdG9yeTtcblxuXG59KTsiLCJjb25zdCBVUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OFwiXHJcblxyXG5jb25zdCBBUEkgPSB7XHJcblxyXG4gIGdldFNpbmdsZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGdldEFsbChleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBkZWxldGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWAsIHtcclxuICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHBvc3RJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHB1dEl0ZW0oZXh0ZW5zaW9uLCBvYmopIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBVVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBUEkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGhlYXRtYXBEYXRhIGZyb20gXCIuL2hlYXRtYXBEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBkYXRlRmlsdGVyID0ge1xyXG5cclxuICBidWlsZERhdGVGaWx0ZXIoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tIGhlYXRtYXBzLmpzIGFuZCBpcyB0cmlnZ2VyZWQgZnJvbSB0aGUgaGVhdG1hcHMgcGFnZSBvZiB0aGUgc2l0ZSB3aGVuXHJcbiAgICAvLyB0aGUgZGF0ZSBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImVuZERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGVuZERhdGVJbnB1dCk7XHJcbiAgICBjb25zdCBlbmREYXRlTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiRGF0ZSAyOlxceGEwXCIpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0RmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgZW5kRGF0ZUxhYmVsLCBlbmREYXRlQ29udHJvbCk7XHJcblxyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzdGFydERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgc3RhcnREYXRlSW5wdXQpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiRGF0ZSAxOlxceGEwXCIpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXRGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBzdGFydERhdGVMYWJlbCwgc3RhcnREYXRlQ29udHJvbCk7XHJcblxyXG4gICAgY29uc3QgY2xlYXJGaWx0ZXJCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2xlYXJEYXRlRmlsdGVyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDbGVhciBGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBjbGVhckZpbHRlckJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGNsZWFyRmlsdGVyQnRuKTtcclxuICAgIGNvbnN0IGRhdGVTYXZlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNldERhdGVGaWx0ZXJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTZXQgRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRhdGVTYXZlQnRuKTtcclxuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxNb2RhbFdpbmRvd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsXCIpO1xyXG4gICAgY29uc3QgY2FuY2VsQnV0dG9uQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgY2FuY2VsQnRuKTtcclxuICAgIGNvbnN0IGJ1dHRvbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIHNhdmVCdXR0b25Db250cm9sLCBjbGVhckZpbHRlckJ1dHRvbkNvbnRyb2wsIGNhbmNlbEJ1dHRvbkNvbnRyb2wpO1xyXG5cclxuICAgIGNvbnN0IG1vZGFsQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtb2RhbC1jb250ZW50IGJveFwiIH0sIG51bGwsIHN0YXJ0RGF0ZUlucHV0RmllbGQsIGVuZERhdGVJbnB1dEZpZWxkLCBidXR0b25GaWVsZCk7XHJcbiAgICBjb25zdCBtb2RhbEJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibW9kYWwtYmFja2dyb3VuZFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgbW9kYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibW9kYWwtZGF0ZUZpbHRlclwiLCBcImNsYXNzXCI6IFwibW9kYWxcIiB9LCBudWxsLCBtb2RhbEJhY2tncm91bmQsIG1vZGFsQ29udGVudCk7XHJcblxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChtb2RhbCk7XHJcbiAgICB0aGlzLm1vZGFsc0V2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIG1vZGFsc0V2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGNsZWFyRGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xlYXJEYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2V0RGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2V0RGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IGNhbmNlbE1vZGFsV2luZG93QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxNb2RhbFdpbmRvd1wiKTtcclxuXHJcbiAgICBjYW5jZWxNb2RhbFdpbmRvd0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5jYW5jZWxNb2RhbFdpbmRvdyk7XHJcbiAgICBzZXREYXRlRmlsdGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLnNldEZpbHRlcik7XHJcbiAgICBjbGVhckRhdGVGaWx0ZXJCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuY2xlYXJEYXRlRmlsdGVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgb3BlbkRhdGVGaWx0ZXIoKSB7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIC8vIGNoZWNrIGlmIGdsb2JhbCB2YXJzIGFyZSBzZXQuIElmIHNvLCBkb24ndCB0b2dnbGUgY29sb3Igb2YgYnV0dG9uXHJcbiAgICBjb25zdCBkYXRlU2V0ID0gaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyh0cnVlKTtcclxuXHJcbiAgICBpZiAoZGF0ZVNldCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGF0ZVJhbmdlQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGNsZWFyRGF0ZUZpbHRlcigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVzZXRzIGdsb2JhbCBkYXRlIGZpbHRlciB2YXJpYWJsZXMgaW4gaGVhdG1hcERhdGEuanMgYW5kIHJlcGxhY2VzIGRhdGUgaW5wdXRzIHdpdGggYmxhbmsgZGF0ZSBpbnB1dHNcclxuICAgIGxldCBzdGFydERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhcnREYXRlSW5wdXRcIik7XHJcbiAgICBsZXQgZW5kRGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbmREYXRlSW5wdXRcIik7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBzZXREYXRlRmlsdGVyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZXREYXRlRmlsdGVyXCIpO1xyXG5cclxuICAgIGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgIGRhdGVSYW5nZUJ0bi5jbGFzc0xpc3QuYWRkKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICBzdGFydERhdGVJbnB1dC5yZXBsYWNlV2l0aChlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzdGFydERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpKTtcclxuICAgIGVuZERhdGVJbnB1dC5yZXBsYWNlV2l0aChlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJlbmREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKSk7XHJcbiAgICBzZXREYXRlRmlsdGVyQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLnNldEZpbHRlcik7XHJcbiAgICBzZXREYXRlRmlsdGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLnNldEZpbHRlcik7XHJcblxyXG4gICAgaWYgKGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1hY3RpdmVcIikpIHtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNldEZpbHRlcigpIHtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGFydERhdGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5kRGF0ZUlucHV0XCIpO1xyXG5cclxuICAgIHN0YXJ0RGF0ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICBlbmREYXRlSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAvLyBjaGVjayBpZiBkYXRlIHBpY2tlcnMgaGF2ZSBhIHZhbGlkIGRhdGVcclxuICAgIGlmIChzdGFydERhdGVJbnB1dC52YWx1ZSA9PT0gXCJcIikge1xyXG4gICAgICBzdGFydERhdGVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgfSBlbHNlIGlmIChlbmREYXRlSW5wdXQudmFsdWUgPT09IFwiXCIpIHtcclxuICAgICAgZW5kRGF0ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBpZiB0aGV5IGRvLCB0aGVuIHNldCBnbG9iYWwgdmFycyBpbiBoZWF0bWFwcyBwYWdlIGFuZCBjbG9zZSBtb2RhbFxyXG4gICAgICBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKGZhbHNlLCBzdGFydERhdGVJbnB1dC52YWx1ZSwgZW5kRGF0ZUlucHV0LnZhbHVlKTtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsTW9kYWxXaW5kb3coKSB7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuXHJcbiAgICAvLyBpZiBnbG9iYWwgdmFyaWFibGVzIGFyZSBkZWZpbmVkIGFscmVhZHksIGNhbmNlbCBzaG91bGQgbm90IGNoYW5nZSB0aGUgY2xhc3Mgb24gdGhlIGRhdGUgcmFuZ2UgYnV0dG9uXHJcbiAgICBjb25zdCBkYXRlU2V0ID0gaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyh0cnVlKTtcclxuICAgIGlmIChkYXRlU2V0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkYXRlUmFuZ2VCdG4uY2xhc3NMaXN0LnRvZ2dsZShcImlzLW91dGxpbmVkXCIpO1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhcHBseWRhdGVGaWx0ZXIoc3RhcnREYXRlLCBlbmREYXRlLCBnYW1lSWRzLCBnYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGV4YW1pbmVzIHRoZSBnYW1lIG9iamVjdCBhcmd1bWVudCBjb21wYXJlZCB0byB0aGUgdXNlci1kZWZpbmVkIHN0YXJ0IGFuZCBlbmQgZGF0ZXNcclxuICAgIC8vIGlmIHRoZSBnYW1lIGRhdGUgaXMgd2l0aGluIHRoZSB0d28gZGF0ZXMgc3BlY2lmaWVkLCB0aGVuIHRoZSBnYW1lIElEIGlzIHB1c2hlZCB0byB0aGUgZ2FtZUlkcyBhcnJheVxyXG5cclxuICAgIC8vIHNwbGl0IHRpbWVzdGFtcCBhbmQgcmVjYWxsIG9ubHkgZGF0ZVxyXG4gICAgbGV0IGdhbWVEYXRlID0gZ2FtZS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdO1xyXG5cclxuICAgIGlmIChzdGFydERhdGUgPD0gZ2FtZURhdGUgJiYgZ2FtZURhdGUgPD0gZW5kRGF0ZSkge1xyXG4gICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlkYXRlRmlsdGVyVG9TYXZlZEhlYXRtYXAoc3RhcnREYXRlLCBlbmREYXRlLCBzaG90cywgc2hvdHNNYXRjaGluZ0ZpbHRlcikge1xyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IHNob3REYXRlID0gc2hvdC50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdO1xyXG5cclxuICAgICAgaWYgKHN0YXJ0RGF0ZSA8PSBzaG90RGF0ZSAmJiBzaG90RGF0ZSA8PSBlbmREYXRlKSB7XHJcbiAgICAgICAgc2hvdHNNYXRjaGluZ0ZpbHRlci5wdXNoKHNob3QpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRhdGVGaWx0ZXIiLCJmdW5jdGlvbiBlbEJ1aWxkZXIobmFtZSwgYXR0cmlidXRlc09iaiwgdHh0LCAuLi5jaGlsZHJlbikge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcclxuICBmb3IgKGxldCBhdHRyIGluIGF0dHJpYnV0ZXNPYmopIHtcclxuICAgIGVsLnNldEF0dHJpYnV0ZShhdHRyLCBhdHRyaWJ1dGVzT2JqW2F0dHJdKTtcclxuICB9XHJcbiAgZWwudGV4dENvbnRlbnQgPSB0eHQgfHwgbnVsbDtcclxuICBjaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICB9KVxyXG4gIHJldHVybiBlbDtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZWxCdWlsZGVyIiwiaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIjtcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCI7XHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiO1xyXG5pbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcblxyXG4vLyB0aGUgcHVycG9zZSBvZiB0aGlzIG1vZHVsZSBpcyB0bzpcclxuLy8gMS4gc2F2ZSBhbGwgY29udGVudCBpbiB0aGUgZ2FtZXBsYXkgcGFnZSAoc2hvdCBhbmQgZ2FtZSBkYXRhKSB0byB0aGUgZGF0YWJhc2VcclxuLy8gMi4gaW1tZWRpYXRlbHkgY2xlYXIgdGhlIGdhbWVwbGF5IGNvbnRhaW5lcnMgb2YgY29udGVudCBvbiBzYXZlXHJcbi8vIDMuIGltbWVkaWF0ZWx5IHJlc2V0IGFsbCBnbG9iYWwgdmFyaWFibGVzIGluIHRoZSBzaG90ZGF0YSBmaWxlIHRvIGFsbG93IHRoZSB1c2VyIHRvIGJlZ2luIHNhdmluZyBzaG90cyBhbmQgZW50ZXJpbmcgZ2FtZSBkYXRhIGZvciB0aGVpciBuZXh0IGdhbWVcclxuLy8gNC4gYWZmb3JkYW5jZSBmb3IgdXNlciB0byByZWNhbGwgYWxsIGRhdGEgZnJvbSBwcmV2aW91cyBzYXZlZCBnYW1lIGZvciBlZGl0aW5nXHJcbi8vIDUuIGluY2x1ZGUgYW55IG90aGVyIGZ1bmN0aW9ucyBuZWVkZWQgdG8gc3VwcG9ydCB0aGUgZmlyc3QgNCByZXF1aXJlbWVudHNcclxuXHJcbi8vIHRoaXMgZ2xvYmFsIHZhcmlhYmxlIGlzIHVzZWQgdG8gcGFzcyBzYXZlZCBzaG90cywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbCBib29sZWFuIHRvIHNob3REYXRhLmpzIGR1cmluZyB0aGUgZWRpdCBwcm9jZXNzXHJcbmxldCBzYXZlZEdhbWVPYmplY3Q7XHJcbmxldCBwdXRQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbmxldCBwb3N0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG5sZXQgcG9zdFByb21pc2VzID0gW107XHJcblxyXG5jb25zdCBnYW1lRGF0YSA9IHtcclxuXHJcbiAgZ2FtZVR5cGVCdXR0b25Ub2dnbGUoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB0b2dnbGVzIHRoZSBcImlzLXNlbGVjdGVkXCIgY2xhc3MgYmV0d2VlbiB0aGUgZ2FtZSB0eXBlIGJ1dHRvbnNcclxuXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgYnRuQ2xpY2tlZCA9IGUudGFyZ2V0O1xyXG5cclxuICAgIGlmICghYnRuQ2xpY2tlZC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICBjb25zdCBjdXJyZW50R2FtZVR5cGVCdG4gPSBnYW1lVHlwZUJ0bnMuZmlsdGVyKGJ0biA9PiBidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICAgIGJ0bkNsaWNrZWQuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpIHtcclxuICAgIHNhdmVkR2FtZU9iamVjdCA9IHVuZGVmaW5lZDtcclxuICAgIHB1dFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxuICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbiAgICBwb3N0UHJvbWlzZXMgPSBbXTtcclxuICB9LFxyXG5cclxuICBwdXRFZGl0ZWRTaG90cyhwcmV2aW91c2x5U2F2ZWRTaG90c0Fycikge1xyXG4gICAgLy8gUFVUIGZpcnN0LCBzaWNuZSB5b3UgY2FuJ3Qgc2F2ZSBhIGdhbWUgaW5pdGlhbGx5IHdpdGhvdXQgYXQgbGVhc3QgMSBzaG90XHJcbiAgICBwcmV2aW91c2x5U2F2ZWRTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICAvLyBldmVuIHRob3VnaCBpdCdzIGEgUFVULCB3ZSBoYXZlIHRvIHJlZm9ybWF0IHRoZSBfZmllbGRYIHN5bnRheCB0byBmaWVsZFhcclxuICAgICAgbGV0IHNob3RGb3JQdXQgPSB7fTtcclxuICAgICAgc2hvdEZvclB1dC5nYW1lSWQgPSBzYXZlZEdhbWVPYmplY3QuaWQ7XHJcbiAgICAgIHNob3RGb3JQdXQuZmllbGRYID0gc2hvdC5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUHV0LmZpZWxkWSA9IHNob3QuX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclB1dC5nb2FsWCA9IHNob3QuX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUHV0LmdvYWxZID0gc2hvdC5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQdXQuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90LmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUHV0LmFlcmlhbCA9IHNob3QuX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclB1dC50aW1lU3RhbXAgPSBzaG90Ll90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwdXRQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnB1dEl0ZW0oYHNob3RzLyR7c2hvdC5pZH1gLCBzaG90Rm9yUHV0KSk7XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHB1dFByb21pc2VzRWRpdE1vZGUpXHJcbiAgfSxcclxuXHJcbiAgcG9zdE5ld1Nob3RzTWFkZUR1cmluZ0VkaXRNb2RlKHNob3RzTm90WWV0UG9zdGVkQXJyKSB7XHJcbiAgICBzaG90c05vdFlldFBvc3RlZEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICBsZXQgc2hvdEZvclBvc3QgPSB7fTtcclxuICAgICAgc2hvdEZvclBvc3QuZ2FtZUlkID0gc2F2ZWRHYW1lT2JqZWN0LmlkO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFggPSBzaG90T2JqLl9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWSA9IHNob3RPYmouX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFggPSBzaG90T2JqLl9nb2FsWDtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFkgPSBzaG90T2JqLl9nb2FsWTtcclxuICAgICAgc2hvdEZvclBvc3QuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90T2JqLmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUG9zdC5hZXJpYWwgPSBzaG90T2JqLl9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQb3N0LnRpbWVTdGFtcCA9IHNob3RPYmouX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXNFZGl0TW9kZSlcclxuICB9LFxyXG5cclxuICBwb3N0TmV3U2hvdHMoZ2FtZUlkKSB7XHJcbiAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgIHNob3RBcnIuZm9yRWFjaChzaG90T2JqID0+IHtcclxuICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgIHNob3RGb3JQb3N0LmdhbWVJZCA9IGdhbWVJZDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRYID0gc2hvdE9iai5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFkgPSBzaG90T2JqLl9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxYID0gc2hvdE9iai5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxZID0gc2hvdE9iai5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdE9iai5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclBvc3QuYWVyaWFsID0gc2hvdE9iai5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUG9zdC50aW1lU3RhbXAgPSBzaG90T2JqLl90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwb3N0UHJvbWlzZXMucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkpO1xyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXMpXHJcbiAgfSxcclxuXHJcbiAgc2F2ZURhdGEoZ2FtZURhdGFPYmosIHNhdmluZ0VkaXRlZEdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZmlyc3QgZGV0ZXJtaW5lcyBpZiBhIGdhbWUgaXMgYmVpbmcgc2F2ZWQgYXMgbmV3LCBvciBhIHByZXZpb3VzbHkgc2F2ZWQgZ2FtZSBpcyBiZWluZyBlZGl0ZWRcclxuICAgIC8vIGlmIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSwgdGhlIGdhbWUgaXMgUFVULCBhbGwgc2hvdHMgc2F2ZWQgcHJldmlvdXNseSBhcmUgUFVULCBhbmQgbmV3IHNob3RzIGFyZSBQT1NURURcclxuICAgIC8vIGlmIHRoZSBnYW1lIGlzIGEgbmV3IGdhbWUgYWx0b2dldGhlciwgdGhlbiB0aGUgZ2FtZSBpcyBQT1NURUQgYW5kIGFsbCBzaG90cyBhcmUgUE9TVEVEXHJcbiAgICAvLyB0aGVuIGZ1bmN0aW9ucyBhcmUgY2FsbGVkIHRvIHJlbG9hZCB0aGUgbWFzdGVyIGNvbnRhaW5lciBhbmQgcmVzZXQgZ2xvYmFsIHNob3QgZGF0YSB2YXJpYWJsZXNcclxuXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSkge1xyXG4gICAgICAvLyB1c2UgSUQgb2YgZ2FtZSBzdG9yZWQgaW4gZ2xvYmFsIHZhclxyXG4gICAgICBBUEkucHV0SXRlbShgZ2FtZXMvJHtzYXZlZEdhbWVPYmplY3QuaWR9YCwgZ2FtZURhdGFPYmopXHJcbiAgICAgICAgLnRoZW4oZ2FtZVBVVCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlBVVCBHQU1FXCIsIGdhbWVQVVQpXHJcbiAgICAgICAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICAgICAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgICAgICAgIGNvbnN0IHByZXZpb3VzbHlTYXZlZFNob3RzQXJyID0gW107XHJcbiAgICAgICAgICBjb25zdCBzaG90c05vdFlldFBvc3RlZEFyciA9IFtdO1xyXG5cclxuICAgICAgICAgIC8vIGNyZWF0ZSBhcnJheXMgZm9yIFBVVCBhbmQgUE9TVCBmdW5jdGlvbnMgKGlmIHRoZXJlJ3MgYW4gaWQgaW4gdGhlIGFycmF5LCBpdCdzIGJlZW4gc2F2ZWQgdG8gdGhlIGRhdGFiYXNlIGJlZm9yZSlcclxuICAgICAgICAgIHNob3RBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgICAgICAgaWYgKHNob3QuaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHByZXZpb3VzbHlTYXZlZFNob3RzQXJyLnB1c2goc2hvdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc2hvdHNOb3RZZXRQb3N0ZWRBcnIucHVzaChzaG90KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0byBQVVQgYW5kIFBPU1RcclxuICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRoYXQgY2xlYXIgZ2FtZXBsYXkgY29udGVudCBhbmQgcmVzZXQgZ2xvYmFsIHNob3QvZ2FtZSBkYXRhIHZhcmlhYmxlc1xyXG4gICAgICAgICAgZ2FtZURhdGEucHV0RWRpdGVkU2hvdHMocHJldmlvdXNseVNhdmVkU2hvdHNBcnIpXHJcbiAgICAgICAgICAgIC50aGVuKHggPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUUzpcIiwgeClcclxuICAgICAgICAgICAgICAvLyBpZiBubyBuZXcgc2hvdHMgd2VyZSBtYWRlLCByZWxvYWQuIGVsc2UgcG9zdCBuZXcgc2hvdHNcclxuICAgICAgICAgICAgICBpZiAoc2hvdHNOb3RZZXRQb3N0ZWRBcnIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90c01hZGVEdXJpbmdFZGl0TW9kZShzaG90c05vdFlldFBvc3RlZEFycilcclxuICAgICAgICAgICAgICAgICAgLnRoZW4oeSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQT1NUUzpcIiwgeSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkucG9zdEl0ZW0oXCJnYW1lc1wiLCBnYW1lRGF0YU9iailcclxuICAgICAgICAudGhlbihnYW1lID0+IGdhbWUuaWQpXHJcbiAgICAgICAgLnRoZW4oZ2FtZUlkID0+IHtcclxuICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90cyhnYW1lSWQpXHJcbiAgICAgICAgICAgIC50aGVuKHogPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU0FWRUQgTkVXIFNIT1RTXCIsIHopO1xyXG4gICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcGFja2FnZUdhbWVEYXRhKCkge1xyXG5cclxuICAgIC8vIGdldCB1c2VyIElEIGZyb20gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgICAvLyBwYWNrYWdlIGVhY2ggaW5wdXQgZnJvbSBnYW1lIGRhdGEgY29udGFpbmVyIGludG8gdmFyaWFibGVzXHJcbiAgICAvLyBUT0RPOiBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gcHJldmVudCBibGFuayBzY29yZSBlbnRyaWVzXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gc2F2ZSBnYW1lXHJcblxyXG4gICAgLy8gcGxheWVySWRcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgZ2FtZVR5cGUgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IHtcclxuICAgICAgaWYgKGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICAgIGdhbWVUeXBlID0gYnRuLnRleHRDb250ZW50XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIChub3RlOiBkaWQgbm90IHVzZSBib29sZWFuIGluIGNhc2UgbW9yZSBnYW1lIG1vZGVzIGFyZSBzdXBwb3J0ZWQgaW4gdGhlIGZ1dHVyZSlcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsX2dhbWVNb2RlLnZhbHVlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gbXkgdGVhbVxyXG4gICAgY29uc3Qgc2VsX3RlYW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlYW1JbnB1dFwiKTtcclxuICAgIGxldCB0ZWFtZWRVcDtcclxuICAgIGlmIChzZWxfdGVhbS52YWx1ZSA9PT0gXCJObyBwYXJ0eVwiKSB7XHJcbiAgICAgIHRlYW1lZFVwID0gZmFsc2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0ZWFtZWRVcCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NvcmVzXHJcbiAgICBsZXQgbXlTY29yZTtcclxuICAgIGxldCB0aGVpclNjb3JlO1xyXG4gICAgY29uc3QgaW5wdF9teVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteVNjb3JlSW5wdXRcIik7XHJcbiAgICBjb25zdCBpbnB0X3RoZWlyU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRoZWlyU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICBteVNjb3JlID0gTnVtYmVyKGlucHRfbXlTY29yZS52YWx1ZSk7XHJcbiAgICB0aGVpclNjb3JlID0gTnVtYmVyKGlucHRfdGhlaXJTY29yZS52YWx1ZSk7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGxldCBvdmVydGltZTtcclxuICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgIGlmIChzZWxfb3ZlcnRpbWUudmFsdWUgPT09IFwiT3ZlcnRpbWVcIikge1xyXG4gICAgICBvdmVydGltZSA9IHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvdmVydGltZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBnYW1lRGF0YU9iaiA9IHtcclxuICAgICAgXCJ1c2VySWRcIjogYWN0aXZlVXNlcklkLFxyXG4gICAgICBcIm1vZGVcIjogZ2FtZU1vZGUsXHJcbiAgICAgIFwidHlwZVwiOiBnYW1lVHlwZSxcclxuICAgICAgXCJwYXJ0eVwiOiB0ZWFtZWRVcCxcclxuICAgICAgXCJzY29yZVwiOiBteVNjb3JlLFxyXG4gICAgICBcIm9wcF9zY29yZVwiOiB0aGVpclNjb3JlLFxyXG4gICAgICBcIm92ZXJ0aW1lXCI6IG92ZXJ0aW1lLFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSBuZXcgZ2FtZSBvciBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZC4gSWYgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQsIHRoZW4gdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHNob3Qgc2F2ZWQgYWxyZWFkeSwgbWFraW5nIHRoZSByZXR1cm4gZnJvbSB0aGUgc2hvdERhdGEgZnVuY3Rpb24gbW9yZSB0aGFuIDBcclxuICAgIGNvbnN0IHNhdmluZ0VkaXRlZEdhbWUgPSBzaG90RGF0YS5nZXRJbml0aWFsTnVtT2ZTaG90cygpXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHNhdmVkR2FtZU9iamVjdC50aW1lU3RhbXBcclxuICAgICAgZ2FtZURhdGEuc2F2ZURhdGEoZ2FtZURhdGFPYmosIHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdGltZSBzdGFtcCBpZiBuZXcgZ2FtZVxyXG4gICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuICAgICAgZ2FtZURhdGFPYmoudGltZVN0YW1wID0gdGltZVN0YW1wXHJcbiAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNhdmVQcmV2R2FtZUVkaXRzKCkge1xyXG4gICAgZ2FtZURhdGEucGFja2FnZUdhbWVEYXRhKCk7XHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsRWRpdGluZ01vZGUoKSB7XHJcbiAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlckVkaXRCdXR0b25zKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZW1vdmVzICYgcmVwbGFjZXMgZWRpdCBhbmQgc2F2ZSBnYW1lIGJ1dHRvbnMgd2l0aCBcIlNhdmUgRWRpdHNcIiBhbmQgXCJDYW5jZWwgRWRpdHNcIlxyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIC8vIGluIGNhc2Ugb2YgbGFnIGluIGZldGNoLCBwcmV2ZW50IHVzZXIgZnJvbSBkb3VibGUgY2xpY2tpbmcgYnV0dG9uXHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuY2xhc3NMaXN0LmFkZChcImlzLWxvYWRpbmdcIik7XHJcblxyXG4gICAgY29uc3QgYnRuX2NhbmNlbEVkaXRzID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbEVkaXRzXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDYW5jZWwgRWRpdHNcIilcclxuICAgIGNvbnN0IGJ0bl9zYXZlRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUVkaXRzXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBFZGl0c1wiKVxyXG5cclxuICAgIGJ0bl9jYW5jZWxFZGl0cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuY2FuY2VsRWRpdGluZ01vZGUpXHJcbiAgICBidG5fc2F2ZUVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5zYXZlUHJldkdhbWVFZGl0cylcclxuXHJcbiAgICBidG5fZWRpdFByZXZHYW1lLnJlcGxhY2VXaXRoKGJ0bl9jYW5jZWxFZGl0cyk7XHJcbiAgICBidG5fc2F2ZUdhbWUucmVwbGFjZVdpdGgoYnRuX3NhdmVFZGl0cyk7XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlbmRlclByZXZHYW1lKGdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHJlbmRlcmluZyB0aGUgc2F2ZWQgZ2FtZSBpbmZvcm1hdGlvbiBpbiB0aGUgXCJFbnRlciBHYW1lIERhdGFcIiBjb250YWluZXIuXHJcbiAgICAvLyBpdCByZWxpZXMgb24gYSBmdW5jdGlvbiBpbiBzaG90RGF0YS5qcyB0byByZW5kZXIgdGhlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc29sZS5sb2coZ2FtZSlcclxuXHJcbiAgICAvLyBjYWxsIGZ1bmN0aW9uIGluIHNob3REYXRhIHRoYXQgY2FsbHMgZ2FtYURhdGEucHJvdmlkZVNob3RzVG9TaG90RGF0YSgpXHJcbiAgICAvLyB0aGUgZnVuY3Rpb24gd2lsbCBjYXB0dXJlIHRoZSBhcnJheSBvZiBzYXZlZCBzaG90cyBhbmQgcmVuZGVyIHRoZSBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLnJlbmRlclNob3RzQnV0dG9uc0Zyb21QcmV2aW91c0dhbWUoKVxyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBjb25zdCBzZWxfb3ZlcnRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm92ZXJ0aW1lSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5vdmVydGltZSkge1xyXG4gICAgICBzZWxfb3ZlcnRpbWUudmFsdWUgPSBcIk92ZXJ0aW1lXCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF9vdmVydGltZS52YWx1ZSA9IFwiTm8gb3ZlcnRpbWVcIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIG15IHRlYW1cclxuICAgIGNvbnN0IHNlbF90ZWFtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5wYXJ0eSA9PT0gZmFsc2UpIHtcclxuICAgICAgc2VsX3RlYW0udmFsdWUgPSBcIk5vIHBhcnR5XCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF90ZWFtLnZhbHVlID0gXCJQYXJ0eVwiXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NvcmVcclxuICAgIGNvbnN0IGlucHRfbXlTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF90aGVpclNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aGVpclNjb3JlSW5wdXRcIik7XHJcblxyXG4gICAgaW5wdF9teVNjb3JlLnZhbHVlID0gZ2FtZS5zY29yZTtcclxuICAgIGlucHRfdGhlaXJTY29yZS52YWx1ZSA9IGdhbWUub3BwX3Njb3JlO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZSAoMXYxLCAydjIsIDN2MylcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuXHJcbiAgICBpZiAoZ2FtZS50eXBlID09PSBcIjN2M1wiKSB7XHJcbiAgICAgIGJ0bl8zdjMuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgICAvLyAydjIgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2UgaWYgKGdhbWUudHlwZSA9PT0gXCIydjJcIikge1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJ0bl8xdjEuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLm1vZGUgPSBcImNvbXBldGl0aXZlXCIpIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDb21wZXRpdGl2ZVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfZ2FtZU1vZGUudmFsdWUgPSBcIkNhc3VhbFwiXHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHByb3ZpZGVTaG90c1RvU2hvdERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHByb3ZpZGVzIHRoZSBzaG90cyBmb3IgcmVuZGVyaW5nIHRvIHNob3REYXRhXHJcbiAgICByZXR1cm4gc2F2ZWRHYW1lT2JqZWN0XHJcbiAgfSxcclxuXHJcbiAgZWRpdFByZXZHYW1lKCkge1xyXG4gICAgLy8gZmV0Y2ggY29udGVudCBmcm9tIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQgdG8gYmUgcmVuZGVyZWRcclxuXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gZWRpdCBwcmV2aW91cyBnYW1lXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYCR7YWN0aXZlVXNlcklkfT9fZW1iZWQ9Z2FtZXNgKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBpZiAodXNlci5nYW1lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBhbGVydChcIk5vIGdhbWVzIGhhdmUgYmVlbiBzYXZlZCBieSB0aGlzIHVzZXJcIik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IG1heCBnYW1lIGlkICh3aGljaCBpcyB0aGUgbW9zdCByZWNlbnQgZ2FtZSBzYXZlZClcclxuICAgICAgICBjb25zdCByZWNlbnRHYW1lSWQgPSB1c2VyLmdhbWVzLnJlZHVjZSgobWF4LCBvYmopID0+IG9iai5pZCA+IG1heCA/IG9iai5pZCA6IG1heCwgdXNlci5nYW1lc1swXS5pZCk7XHJcbiAgICAgICAgLy8gZmV0Y2ggbW9zdCByZWNlbnQgZ2FtZSBhbmQgZW1iZWQgc2hvdHNcclxuICAgICAgICBBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGAke3JlY2VudEdhbWVJZH0/X2VtYmVkPXNob3RzYCkudGhlbihnYW1lT2JqID0+IHtcclxuICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJFZGl0QnV0dG9ucygpO1xyXG4gICAgICAgICAgc2F2ZWRHYW1lT2JqZWN0ID0gZ2FtZU9iajtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlclByZXZHYW1lKGdhbWVPYmopO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZURhdGEiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBnYW1lcGxheSA9IHtcclxuXHJcbiAgbG9hZEdhbWVwbGF5KCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgLy8gY29uc3QgeEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJkZWxldGVcIiB9KTtcclxuICAgIC8vIHhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQm94LCBldmVudCk7IC8vIGJ1dHRvbiB3aWxsIGRpc3BsYXk6IG5vbmUgb24gcGFyZW50IGNvbnRhaW5lclxyXG4gICAgLy8gY29uc3QgaGVhZGVySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb24gaXMtaW5mb1wiIH0sIFwiQ3JlYXRlIGFuZCBzYXZlIHNob3RzIC0gdGhlbiBzYXZlIHRoZSBnYW1lIHJlY29yZC5cIiwgeEJ1dHRvbik7XHJcbiAgICAvLyB3ZWJwYWdlLmFwcGVuZENoaWxkKGhlYWRlckluZm8pO1xyXG4gICAgdGhpcy5idWlsZFNob3RDb250ZW50KCk7XHJcbiAgICB0aGlzLmJ1aWxkR2FtZUNvbnRlbnQoKTtcclxuICAgIHRoaXMuZ2FtZXBsYXlFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBidWlsZFNob3RDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgc2hvdCBjb250YWluZXJzIGFuZCBhZGRzIGNvbnRhaW5lciBjb250ZW50XHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBzaG90VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBTaG90IERhdGFcIik7XHJcbiAgICBjb25zdCBzaG90VGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90VGl0bGUpO1xyXG5cclxuICAgIC8vIG5ldyBzaG90IGFuZCBzYXZlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3QgbmV3U2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJuZXdTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiTmV3IFNob3RcIik7XHJcbiAgICBjb25zdCBzYXZlU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgU2hvdFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbFNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIFNob3RcIik7XHJcbiAgICBjb25zdCBzaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJzaG90Q29udHJvbHNcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gYnV0dG9uc1wiIH0sIG51bGwsIG5ld1Nob3QsIHNhdmVTaG90LCBjYW5jZWxTaG90KTtcclxuICAgIGNvbnN0IGFsaWduU2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIHNob3RCdXR0b25zKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnblNob3RCdXR0b25zKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGlucHV0IGFuZCBhZXJpYWwgc2VsZWN0XHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJhbGwgc3BlZWQgKG1waCk6XCIpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZElucHV0XCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGlucHV0XCIsIFwidHlwZVwiOlwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBiYWxsIHNwZWVkXCIgfSk7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiYWVyaWFsSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbE9wdGlvbjEsIGFlcmlhbE9wdGlvbjIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdCk7XHJcbiAgICBjb25zdCBhZXJpYWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdFBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgYmFsbFNwZWVkSW5wdXRUaXRsZSwgYmFsbFNwZWVkSW5wdXQsIGFlcmlhbENvbnRyb2wpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90RGV0YWlscyk7XHJcblxyXG4gICAgLy8gZmllbGQgYW5kIGdvYWwgaW1hZ2VzIChub3RlIGZpZWxkLWltZyBpcyBjbGlwcGVkIHRvIHJlc3RyaWN0IGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgaW4gbGF0ZXIgZnVuY3Rpb24uXHJcbiAgICAvLyBnb2FsLWltZyB1c2VzIGFuIHgveSBmb3JtdWxhIGZvciBjbGljayBhcmVhIGNvb3JkaW5hdGVzIHJlc3RyaWN0aW9uLCBzaW5jZSBpdCdzIGEgcmVjdGFuZ2xlKVxyXG4gICAgLy8gYWRkaXRpb25hbGx5LCBmaWVsZCBhbmQgZ29hbCBhcmUgbm90IGFsaWduZWQgd2l0aCBsZXZlbC1sZWZ0IG9yIGxldmVsLXJpZ2h0IC0gaXQncyBhIGRpcmVjdCBsZXZlbCAtLT4gbGV2ZWwtaXRlbSBmb3IgY2VudGVyaW5nXHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IHNob3RDb29yZGluYXRlc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBzaG90VGl0bGVDb250YWluZXIsIHNob3RCdXR0b25Db250YWluZXIsIHNob3REZXRhaWxzQ29udGFpbmVyLCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIpXHJcblxyXG4gICAgLy8gYXBwZW5kIHNob3RzIGNvbnRhaW5lciB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2FtZUNvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGNyZWF0ZXMgZ2FtZSBjb250ZW50IGNvbnRhaW5lcnMgKHRlYW0sIGdhbWUgdHlwZSwgZ2FtZSBtb2RlLCBldGMuKVxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3QgZ2FtZVRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgR2FtZSBEYXRhXCIpO1xyXG4gICAgY29uc3QgdGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVGl0bGUpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gdG9wIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIDF2MS8ydjIvM3YzIGJ1dHRvbnMgKG5vdGU6IGNvbnRyb2wgY2xhc3MgaXMgdXNlZCB3aXRoIGZpZWxkIHRvIGFkaGVyZSBidXR0b25zIHRvZ2V0aGVyKVxyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTN2M0NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlM3YzKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zZWxlY3RlZCBpcy1saW5rXCIgfSwgXCIydjJcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMnYyKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8xdjFcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjFDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTF2MSk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGhhcy1hZGRvbnNcIiB9LCBudWxsLCBnYW1lVHlwZTN2M0NvbnRyb2wsIGdhbWVUeXBlMnYyQ29udHJvbCwgZ2FtZVR5cGUxdjFDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkZpZWxkKTtcclxuXHJcbiAgICAvLyBnYW1lIG1vZGUgc2VsZWN0XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDb21wZXRpdGl2ZVwiKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZ2FtZU1vZGVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZU9wdGlvbjEsIG1vZGVPcHRpb24yKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZVNlbGVjdCk7XHJcbiAgICBjb25zdCBtb2RlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBtb2RlU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyB0ZWFtIHNlbGVjdFxyXG4gICAgY29uc3QgdGVhbU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gcGFydHlcIik7XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJQYXJ0eVwiKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwidGVhbUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtT3B0aW9uMSwgdGVhbU9wdGlvbjIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtU2VsZWN0KTtcclxuICAgIGNvbnN0IHRlYW1Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHRlYW1TZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lIHNlbGVjdFxyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIG92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwib3ZlcnRpbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVPcHRpb24xLCBvdmVydGltZU9wdGlvbjIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3QpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIGJvdHRvbSBjb250YWluZXJcclxuXHJcbiAgICAvLyBzY29yZSBpbnB1dHNcclxuICAgIC8vICoqKipOb3RlIGlubGluZSBzdHlsaW5nIG9mIGlucHV0IHdpZHRoc1xyXG4gICAgY29uc3QgbXlTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiU2NvcmU6XCIpO1xyXG4gICAgY29uc3QgbXlTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibXlTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcIm15IHRlYW0ncyBzY29yZVwiIH0pO1xyXG4gICAgY29uc3QgbXlTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgbXlTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IHRoZWlyU2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIk9wcG9uZW50J3Mgc2NvcmU6XCIpXHJcbiAgICBjb25zdCB0aGVpclNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ0aGVpclNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwidGhlaXIgdGVhbSdzIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCB0aGVpclNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCB0aGVpclNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3Qgc2NvcmVJbnB1dENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgbXlTY29yZUlucHV0VGl0bGUsIG15U2NvcmVDb250cm9sLCB0aGVpclNjb3JlSW5wdXRUaXRsZSwgdGhlaXJTY29yZUNvbnRyb2wpO1xyXG5cclxuICAgIC8vIGVkaXQvc2F2ZSBnYW1lIGJ1dHRvbnNcclxuICAgIGNvbnN0IGVkaXRQcmV2aW91c0dhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZWRpdFByZXZHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJFZGl0IFByZXZpb3VzIEdhbWVcIik7XHJcbiAgICBjb25zdCBzYXZlR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlR2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgR2FtZVwiKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25BbGlnbm1lbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9ucyBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgc2F2ZUdhbWUsIGVkaXRQcmV2aW91c0dhbWUpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1yaWdodFwiIH0sIG51bGwsIGdhbWVCdXR0b25BbGlnbm1lbnQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyVG9wID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25Db250YWluZXIsIG1vZGVDb250cm9sLCB0ZWFtQ29udHJvbCwgb3ZlcnRpbWVDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJCb3R0b20gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzY29yZUlucHV0Q29udGFpbmVyLCBnYW1lQnV0dG9uQ29udGFpbmVyKTtcclxuICAgIGNvbnN0IHBhcmVudEdhbWVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHRpdGxlQ29udGFpbmVyLCBnYW1lQ29udGFpbmVyVG9wLCBnYW1lQ29udGFpbmVyQm90dG9tKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50R2FtZUNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlFdmVudE1hbmFnZXIoKSB7XHJcblxyXG4gICAgLy8gYnV0dG9uc1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZVNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2NhbmNlbFNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbmNlbFNob3RcIik7XHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lcnNcclxuICAgIGJ0bl9uZXdTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jcmVhdGVOZXdTaG90KTtcclxuICAgIGJ0bl9zYXZlU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuc2F2ZVNob3QpO1xyXG4gICAgYnRuX2NhbmNlbFNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmNhbmNlbFNob3QpO1xyXG4gICAgYnRuX3NhdmVHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5wYWNrYWdlR2FtZURhdGEpO1xyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZ2FtZVR5cGVCdXR0b25Ub2dnbGUpKTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmVkaXRQcmV2R2FtZSlcclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZXBsYXkiLCJpbXBvcnQgaGVhdG1hcCBmcm9tIFwiLi4vbGliL25vZGVfbW9kdWxlcy9oZWF0bWFwLmpzL2J1aWxkL2hlYXRtYXAuanNcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSS5qc1wiO1xyXG5pbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyLmpzXCI7XHJcbmltcG9ydCBkYXRlRmlsdGVyIGZyb20gXCIuL2RhdGVGaWx0ZXIuanNcIjtcclxuaW1wb3J0IGZlZWRiYWNrIGZyb20gXCIuL2hlYXRtYXBGZWVkYmFja1wiO1xyXG5cclxuLy8gSUQgb2Ygc2V0SW50ZXJ2YWwgZnVuY3Rpb24gdXNlZCB0byBtb25pdG9yIGNvbnRhaW5lciB3aWR0aCBhbmQgcmVwYWludCBoZWF0bWFwIGlmIGNvbnRhaW5lciB3aWR0aCBjaGFuZ2VzXHJcbmxldCBpbnRlcnZhbElkO1xyXG4vLyBnbG9iYWwgdmFyaWFibGUgdG8gc3RvcmUgZmV0Y2hlZCBzaG90c1xyXG5sZXQgZ2xvYmFsU2hvdHNBcnI7XHJcbmxldCBqb2luVGFibGVBcnIgPSBbXTtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHVzZWQgd2l0aCBiYWxsIHNwZWVkIGZpbHRlciBvbiBoZWF0bWFwc1xyXG5sZXQgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlcyB1c2VkIHdpdGggZGF0ZSByYW5nZSBmaWx0ZXJcclxubGV0IHN0YXJ0RGF0ZTtcclxubGV0IGVuZERhdGU7XHJcblxyXG4vLyBGSVhNRTogcmVuZGVyaW5nIGEgc2F2ZWQgaGVhdG1hcCB3aXRoIGRhdGUgZmlsdGVyIHNvbWV0aW1lcyBidWdzIG91dFxyXG5cclxuY29uc3QgaGVhdG1hcERhdGEgPSB7XHJcblxyXG4gIGdldFVzZXJTaG90cygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVtb3ZlcyBhbiBleGlzdGluZyBoZWF0bWFwIGlmIG5lY2Vzc2FyeSBhbmQgdGhlbiBkZXRlcm1pbmVzIHdoZXRoZXJcclxuICAgIC8vIHRvIGNhbGwgdGhlIGJhc2ljIGhlYXRtYXAgb3Igc2F2ZWQgaGVhdG1hcCBmdW5jdGlvbnNcclxuXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG5cclxuICAgIGNvbnN0IGhlYXRtYXBOYW1lID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXVxyXG4gICAgY29uc3QgZ29hbEhlYXRtYXBDYW52YXMgPSBnb2FsQ29udGFpbmVyLmNoaWxkTm9kZXNbMV1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIGFscmVhZHkgYSBoZWF0bWFwIGxvYWRlZCwgcmVtb3ZlIGl0IGJlZm9yZSBjb250aW51aW5nXHJcbiAgICBpZiAoZmllbGRIZWF0bWFwQ2FudmFzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZmllbGRIZWF0bWFwQ2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICBnb2FsSGVhdG1hcENhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgaWYgKGhlYXRtYXBOYW1lID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaGVhdG1hcE5hbWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBmZXRjaEJhc2ljSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIGRhdGFiYXNlIGFuZCByZXRyaWV2ZXMgc2hvdHMgdGhhdCBtZWV0IHNwZWNpZmljIGZpbHRlcnMgKGFsbCBzaG90cyBmZXRjaGVkIGlmIClcclxuICAgIGxldCBnYW1lSWRzX2RhdGUgPSBbXTtcclxuICAgIGxldCBnYW1lSWRzX3Jlc3VsdCA9IFtdO1xyXG4gICAgbGV0IGdhbWVJZHMgPSBbXTsgLy8gYXJyYXkgdGhhdCBjb250YWlucyBnYW1lIElEIHZhbHVlcyBwYXNzaW5nIGJvdGggdGhlIGRhdGUgYW5kIGdhbWUgcmVzdWx0IGZpbHRlcnNcclxuICAgIGNvbnN0IGdhbWVSZXN1bHRGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lUmVzdWx0XCIpLnZhbHVlO1xyXG4gICAgY29uc3QgZ2FtZVVSTGV4dGVuc2lvbiA9IGhlYXRtYXBEYXRhLmFwcGx5R2FtZUZpbHRlcnMoKTtcclxuXHJcbiAgICBBUEkuZ2V0QWxsKGdhbWVVUkxleHRlbnNpb24pXHJcbiAgICAgIC50aGVuKGdhbWVzID0+IHtcclxuICAgICAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICAgICAgLy8gdGhlIGRhdGUgZmlsdGVyIGFuZCBnYW1lIHJlc3VsdHMgZmlsdGVycyBjYW5ub3QgYmUgYXBwbGllZCBpbiB0aGUgSlNPTiBzZXJ2ZXIgVVJMLCBzbyB0aGUgZmlsdGVycyBhcmVcclxuICAgICAgICAgIC8vIGNhbGxlZCBoZXJlLiBFYWNoIGZ1bmN0aW9uIHBvcHVsYXRlcyBhbiBhcnJheSB3aXRoIGdhbWUgSURzIHRoYXQgbWF0Y2ggdGhlIGZpbHRlciByZXF1aXJlbWVudHMuXHJcbiAgICAgICAgICAvLyBhIGZpbHRlciBtZXRob2QgaXMgdGhlbiB1c2VkIHRvIGNvbGxlY3QgYWxsIG1hdGNoaW5nIGdhbWUgSURzIGZyb20gdGhlIHR3byBhcnJheXMgKGkuZS4gYSBnYW1lIHRoYXQgcGFzc2VkXHJcbiAgICAgICAgICAvLyB0aGUgcmVxdWlyZW1lbnRzIG9mIGJvdGggZmlsdGVycylcclxuICAgICAgICAgIC8vIE5PVEU6IGlmIHN0YXJ0IGRhdGUgaXMgbm90IGRlZmluZWQsIHRoZSByZXN1bHQgZmlsdGVyIGlzIHRoZSBvbmx5IGZ1bmN0aW9uIGNhbGxlZCwgYW5kIGl0IGlzIHBhc3NlZCB0aGUgdGhpcmQgYXJyYXlcclxuICAgICAgICAgIGlmIChzdGFydERhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBkYXRlRmlsdGVyLmFwcGx5ZGF0ZUZpbHRlcihzdGFydERhdGUsIGVuZERhdGUsIGdhbWVJZHNfZGF0ZSwgZ2FtZSk7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmFwcGx5R2FtZVJlc3VsdEZpbHRlcihnYW1lUmVzdWx0RmlsdGVyLCBnYW1lSWRzX3Jlc3VsdCwgZ2FtZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5hcHBseUdhbWVSZXN1bHRGaWx0ZXIoZ2FtZVJlc3VsdEZpbHRlciwgZ2FtZUlkcywgZ2FtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZiAoc3RhcnREYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGdhbWVJZHMgPSBnYW1lSWRzX2RhdGUuZmlsdGVyKGlkID0+IGdhbWVJZHNfcmVzdWx0LmluY2x1ZGVzKGlkKSlcclxuICAgICAgICAgIHJldHVybiBnYW1lSWRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZ2FtZUlkcztcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oZ2FtZUlkcyA9PiB7XHJcbiAgICAgICAgaWYgKGdhbWVJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBhbGVydChcIlNvcnJ5ISBFaXRoZXIgbm8gc2hvdHMgaGF2ZSBiZWVuIHNhdmVkIHlldCBvciBubyBnYW1lcyBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLiBWaXNpdCB0aGUgR2FtZXBsYXkgcGFnZSB0byBnZXQgc3RhcnRlZCBvciB0byBhZGQgbW9yZSBzaG90cy5cIilcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBzaG90VVJMZXh0ZW5zaW9uID0gaGVhdG1hcERhdGEuYXBwbHlTaG90RmlsdGVycyhnYW1lSWRzKTtcclxuICAgICAgICAgIEFQSS5nZXRBbGwoc2hvdFVSTGV4dGVuc2lvbilcclxuICAgICAgICAgICAgLnRoZW4oc2hvdHMgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChzaG90cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiU29ycnkhIE5vIHNob3RzIG1hdGNoIHRoZSBjdXJyZW50IGZpbHRlcnMuIFZpc2l0IHRoZSBHYW1lcGxheSBwYWdlIHRvIGdldCBzdGFydGVkIG9yIGFkZCB0byBtb3JlIHNob3RzLlwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGdsb2JhbFNob3RzQXJyID0gc2hvdHM7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgICAgIGZlZWRiYWNrLmxvYWRGZWVkYmFjayhzaG90cyk7XHJcbiAgICAgICAgICAgICAgICAvLyBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoaGVhdG1hcERhdGEuZ2V0QWN0aXZlT2Zmc2V0cywgNTAwKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9LFxyXG5cclxuICBmZXRjaFNhdmVkSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uLCBhbmQgaXRzIGNvdW50ZXJwYXJ0IGZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyByZW5kZXIgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwIHRob3VnaCB0aGVzZSBzdGVwczpcclxuICAgIC8vIDEuIGdldHRpbmcgdGhlIGhlYXRtYXAgbmFtZSBmcm9tIHRoZSBkcm9wZG93biB2YWx1ZVxyXG4gICAgLy8gMi4gdXNpbmcgdGhlIG5hbWUgdG8gZmluZCB0aGUgY2hpbGROb2RlcyBpbmRleCBvZiB0aGUgZHJvcGRvd24gdmFsdWUgKGkuZS4gd2hpY2ggSFRNTCA8b3B0aW9uPikgYW5kIGdldCBpdHMgSURcclxuICAgIC8vIDMuIGZldGNoIGFsbCBzaG90X2hlYXRtYXAgam9pbiB0YWJsZXMgd2l0aCBtYXRjaGluZyBoZWF0bWFwIElEXHJcbiAgICAvLyA0LiBmZXRjaCBzaG90cyB1c2luZyBzaG90IElEcyBmcm9tIGpvaW4gdGFibGVzXHJcbiAgICAvLyA1LiByZW5kZXIgaGVhdG1hcCBieSBjYWxsaW5nIGJ1aWxkIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8vIHN0ZXAgMTogZ2V0IG5hbWUgb2YgaGVhdG1hcFxyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBsZXQgY3VycmVudERyb3Bkb3duVmFsdWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcbiAgICAvLyBzdGVwIDI6IHVzZSBuYW1lIHRvIGdldCBoZWF0bWFwIElEIHN0b3JlZCBpbiBIVE1MIG9wdGlvbiBlbGVtZW50XHJcbiAgICBsZXQgY3VycmVudEhlYXRtYXBJZDtcclxuICAgIGhlYXRtYXBEcm9wZG93bi5jaGlsZE5vZGVzLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgICBpZiAoY2hpbGQudGV4dENvbnRlbnQgPT09IGN1cnJlbnREcm9wZG93blZhbHVlKSB7XHJcbiAgICAgICAgY3VycmVudEhlYXRtYXBJZCA9IGNoaWxkLmlkLnNsaWNlKDgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIHN0ZXAgMzogZmV0Y2ggam9pbiB0YWJsZXNcclxuICAgIEFQSS5nZXRBbGwoYHNob3RfaGVhdG1hcD9oZWF0bWFwSWQ9JHtjdXJyZW50SGVhdG1hcElkfWApXHJcbiAgICAgIC50aGVuKGpvaW5UYWJsZXMgPT4gaGVhdG1hcERhdGEuZmV0Y2hTYXZlZFNob3RzVXNpbmdKb2luVGFibGVzKGpvaW5UYWJsZXMpXHJcbiAgICAgICAgLy8gc3RlcCA1OiBwYXNzIHNob3RzIHRvIGJ1aWxkRmllbGRIZWF0bWFwKCkgYW5kIGJ1aWxkR29hbEhlYXRtYXAoKVxyXG4gICAgICAgIC50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgIC8vIGFwcGx5IGRhdGUgZmlsdGVyIGlmIGZpbHRlciBoYXMgYmVlbiBzZXRcclxuICAgICAgICAgIGlmIChzdGFydERhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsZXQgc2hvdHNNYXRjaGluZ0ZpbHRlciA9IFtdO1xyXG4gICAgICAgICAgICBkYXRlRmlsdGVyLmFwcGx5ZGF0ZUZpbHRlclRvU2F2ZWRIZWF0bWFwKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgc2hvdHMsIHNob3RzTWF0Y2hpbmdGaWx0ZXIpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90c01hdGNoaW5nRmlsdGVyIC8vIElNUE9SVEFOVCEgcHJldmVudHMgZXJyb3IgaW4gaGVhdG1hcCBzYXZlIHdoZW4gcmVuZGVyaW5nIHNhdmVkIG1hcCBhZnRlciByZW5kZXJpbmcgYmFzaWMgaGVhdG1hcFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90cyAvLyBJTVBPUlRBTlQhIHByZXZlbnRzIGVycm9yIGluIGhlYXRtYXAgc2F2ZSB3aGVuIHJlbmRlcmluZyBzYXZlZCBtYXAgYWZ0ZXIgcmVuZGVyaW5nIGJhc2ljIGhlYXRtYXBcclxuICAgICAgICAgICAgZmVlZGJhY2subG9hZEZlZWRiYWNrKHNob3RzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGpvaW5UYWJsZUFyciA9IFtdO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIClcclxuICB9LFxyXG5cclxuICBmZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMoam9pblRhYmxlcykge1xyXG4gICAgLy8gc2VlIG5vdGVzIG9uIGZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpXHJcbiAgICBqb2luVGFibGVzLmZvckVhY2godGFibGUgPT4ge1xyXG4gICAgICAvLyBzdGVwIDQuIHRoZW4gZmV0Y2ggdXNpbmcgZWFjaCBzaG90SWQgaW4gdGhlIGpvaW4gdGFibGVzXHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5nZXRTaW5nbGVJdGVtKFwic2hvdHNcIiwgdGFibGUuc2hvdElkKSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoam9pblRhYmxlQXJyKVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5R2FtZUZpbHRlcnMoKSB7XHJcbiAgICAvLyBOT1RFOiBnYW1lIHJlc3VsdCBmaWx0ZXIgKHZpY3RvcnkvZGVmZWF0KSBjYW5ub3QgYmUgYXBwbGllZCBpbiB0aGlzIGZ1bmN0aW9uIGFuZCBpcyBhcHBsaWVkIGFmdGVyIHRoZSBmZXRjaFxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZU1vZGVcIikudmFsdWU7XHJcbiAgICBjb25zdCBnYW1ldHlwZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVUeXBlXCIpLnZhbHVlO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1vdmVydGltZVwiKS52YWx1ZTtcclxuICAgIGNvbnN0IHRlYW1TdGF0dXNGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci10ZWFtU3RhdHVzXCIpLnZhbHVlO1xyXG5cclxuICAgIGxldCBVUkwgPSBcImdhbWVzXCI7XHJcblxyXG4gICAgVVJMICs9IGA/dXNlcklkPSR7YWN0aXZlVXNlcklkfWA7XHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGlmIChnYW1lTW9kZUZpbHRlciA9PT0gXCJDb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZtb2RlPWNvbXBldGl0aXZlXCJcclxuICAgIH0gZWxzZSBpZiAoZ2FtZU1vZGVGaWx0ZXIgPT09IFwiQ2FzdWFsXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm1vZGU9Y2FzdWFsXCJcclxuICAgIH1cclxuICAgIC8vIGdhbWUgdHlwZVxyXG4gICAgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjN2M1wiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTN2M1wiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjJ2MlwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTJ2MlwiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjF2MVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTF2MVwiXHJcbiAgICB9XHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgaWYgKG92ZXJ0aW1lRmlsdGVyID09PSBcIk9UXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm92ZXJ0aW1lPXRydWVcIlxyXG4gICAgfSBlbHNlIGlmIChvdmVydGltZUZpbHRlciA9PT0gXCJObyBPVFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZvdmVydGltZT1mYWxzZVwiXHJcbiAgICB9XHJcbiAgICAvLyB0ZWFtIHN0YXR1c1xyXG4gICAgaWYgKHRlYW1TdGF0dXNGaWx0ZXIgPT09IFwiTm8gcGFydHlcIikge1xyXG4gICAgICBVUkwgKz0gXCImcGFydHk9ZmFsc2VcIlxyXG4gICAgfSBlbHNlIGlmICh0ZWFtU3RhdHVzRmlsdGVyID09PSBcIlBhcnR5XCIpIHtcclxuICAgICAgVVJMICs9IFwiJnBhcnR5PXRydWVcIlxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBVUkw7XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlHYW1lUmVzdWx0RmlsdGVyKGdhbWVSZXN1bHRGaWx0ZXIsIGdhbWVJZHMsIGdhbWUpIHtcclxuICAgIC8vIGlmIHZpY3RvcnksIHRoZW4gY2hlY2sgZm9yIGdhbWUncyBzY29yZSB2cyBnYW1lJ3Mgb3Bwb25lbnQgc2NvcmVcclxuICAgIC8vIGlmIHRoZSBmaWx0ZXIgaXNuJ3Qgc2VsZWN0ZWQgYXQgYWxsLCBwdXNoIGFsbCBnYW1lIElEcyB0byBnYW1lSWRzIGFycmF5XHJcbiAgICBpZiAoZ2FtZVJlc3VsdEZpbHRlciA9PT0gXCJWaWN0b3J5XCIpIHtcclxuICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChnYW1lUmVzdWx0RmlsdGVyID09PSBcIkRlZmVhdFwiKSB7XHJcbiAgICAgIGlmIChnYW1lLnNjb3JlIDwgZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhcHBseVNob3RGaWx0ZXJzKGdhbWVJZHMpIHtcclxuICAgIGNvbnN0IHNob3RUeXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItc2hvdFR5cGVcIikudmFsdWU7XHJcbiAgICBsZXQgVVJMID0gXCJzaG90c1wiXHJcblxyXG4gICAgLy8gZ2FtZSBJRFxyXG4gICAgLy8gZm9yIGVhY2ggZ2FtZUlkLCBhcHBlbmQgVVJMLiBBcHBlbmQgJiBpbnN0ZWFkIG9mID8gb25jZSBmaXJzdCBnYW1lSWQgaXMgYWRkZWQgdG8gVVJMXHJcbiAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGxldCBnYW1lSWRDb3VudCA9IDA7XHJcbiAgICAgIGdhbWVJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgaWYgKGdhbWVJZENvdW50IDwgMSkge1xyXG4gICAgICAgICAgVVJMICs9IGA/Z2FtZUlkPSR7aWR9YDtcclxuICAgICAgICAgIGdhbWVJZENvdW50Kys7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFVSTCArPSBgJmdhbWVJZD0ke2lkfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSAvLyBlbHNlIHN0YXRlbWVudCBpcyBoYW5kbGVkIGluIGZldGNoQmFzaWNIZWF0bWFwRGF0YSgpXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGlmIChzaG90VHlwZUZpbHRlciA9PT0gXCJBZXJpYWxcIikge1xyXG4gICAgICBVUkwgKz0gXCImYWVyaWFsPXRydWVcIjtcclxuICAgIH0gZWxzZSBpZiAoc2hvdFR5cGVGaWx0ZXIgPT09IFwiU3RhbmRhcmRcIikge1xyXG4gICAgICBVUkwgKz0gXCImYWVyaWFsPWZhbHNlXCJcclxuICAgIH1cclxuICAgIHJldHVybiBVUkw7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQXJyYXkgb2Ygc2hvdHNcIiwgc2hvdHMpXHJcblxyXG4gICAgLy8gY3JlYXRlIGZpZWxkIGhlYXRtYXAgd2l0aCBjb25maWd1cmF0aW9uXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGxldCB2YXJXaWR0aCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHZhckhlaWdodCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICBsZXQgZmllbGRDb25maWcgPSBoZWF0bWFwRGF0YS5nZXRGaWVsZENvbmZpZyhmaWVsZENvbnRhaW5lcik7XHJcblxyXG4gICAgbGV0IGZpZWxkSGVhdG1hcEluc3RhbmNlO1xyXG4gICAgZmllbGRIZWF0bWFwSW5zdGFuY2UgPSBoZWF0bWFwLmNyZWF0ZShmaWVsZENvbmZpZyk7XHJcblxyXG4gICAgbGV0IGZpZWxkRGF0YVBvaW50cyA9IFtdO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCB4XyA9IE51bWJlcigoc2hvdC5maWVsZFggKiB2YXJXaWR0aCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB5XyA9IE51bWJlcigoc2hvdC5maWVsZFkgKiB2YXJIZWlnaHQpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgdmFsdWVfID0gMTtcclxuICAgICAgLy8gc2V0IHZhbHVlIGFzIGJhbGwgc3BlZWQgaWYgc3BlZWQgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICAgIHZhbHVlXyA9IHNob3QuYmFsbF9zcGVlZDtcclxuICAgICAgfVxyXG4gICAgICBsZXQgZmllbGRPYmogPSB7IHg6IHhfLCB5OiB5XywgdmFsdWU6IHZhbHVlXyB9O1xyXG4gICAgICBmaWVsZERhdGFQb2ludHMucHVzaChmaWVsZE9iaik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBmaWVsZERhdGEgPSB7XHJcbiAgICAgIG1heDogMSxcclxuICAgICAgbWluOiAwLFxyXG4gICAgICBkYXRhOiBmaWVsZERhdGFQb2ludHNcclxuICAgIH07XHJcblxyXG4gICAgLy8gc2V0IG1heCB2YWx1ZSBhcyBtYXggYmFsbCBzcGVlZCBpbiBzaG90cywgaWYgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgbGV0IG1heEJhbGxTcGVlZCA9IHNob3RzLnJlZHVjZSgobWF4LCBzaG90KSA9PiBzaG90LmJhbGxfc3BlZWQgPiBtYXggPyBzaG90LmJhbGxfc3BlZWQgOiBtYXgsIHNob3RzWzBdLmJhbGxfc3BlZWQpO1xyXG4gICAgICBmaWVsZERhdGEubWF4ID0gbWF4QmFsbFNwZWVkO1xyXG4gICAgfVxyXG5cclxuICAgIGZpZWxkSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZmllbGREYXRhKTtcclxuXHJcbiAgICBsZXQgaW5pdGlhbFdpZHRoID0gdmFyV2lkdGg7XHJcblxyXG4gICAgaWYgKGludGVydmFsSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsSWQpO1xyXG4gICAgICBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkgeyBoZWF0bWFwRGF0YS5nZXRBY3RpdmVPZmZzZXRzKGZpZWxkQ29udGFpbmVyLCBpbml0aWFsV2lkdGgsIHNob3RzKTsgfSwgNTAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGludGVydmFsSWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7IGhlYXRtYXBEYXRhLmdldEFjdGl2ZU9mZnNldHMoZmllbGRDb250YWluZXIsIGluaXRpYWxXaWR0aCwgc2hvdHMpOyB9LCA1MDApO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBnZXRBY3RpdmVPZmZzZXRzKGZpZWxkQ29udGFpbmVyLCBpbml0aWFsV2lkdGgsIHNob3RzKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGV2YWx1YXRlcyB0aGUgd2lkdGggb2YgdGhlIGhlYXRtYXAgY29udGFpbmVyIGF0IDAuNSBzZWNvbmQgaW50ZXJ2YWxzLiBJZiB0aGUgd2lkdGggaGFzIGNoYW5nZWQsXHJcbiAgICAvLyB0aGVuIHRoZSBoZWF0bWFwIGNhbnZhcyBpcyByZXBhaW50ZWQgdG8gZml0IHdpdGhpbiB0aGUgY29udGFpbmVyIGxpbWl0c1xyXG4gICAgbGV0IHdpZHRoID0gaW5pdGlhbFdpZHRoO1xyXG5cclxuICAgIGxldCBjYXB0dXJlV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aFxyXG4gICAgLy9ldmFsdWF0ZSBjb250YWluZXIgd2lkdGggYWZ0ZXIgMC41IHNlY29uZHMgdnMgaW5pdGlhbCBjb250YWluZXIgd2lkdGhcclxuICAgIGlmIChjYXB0dXJlV2lkdGggPT09IHdpZHRoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwidW5jaGFuZ2VkXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2lkdGggPSBjYXB0dXJlV2lkdGg7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwibmV3IHdpZHRoXCIsIHdpZHRoKTtcclxuICAgICAgLy8gcmVtb3ZlIGN1cnJlbnQgaGVhdG1hcHNcclxuICAgICAgY29uc3QgaGVhdG1hcENhbnZhc0FyciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuaGVhdG1hcC1jYW52YXNcIik7XHJcbiAgICAgIGhlYXRtYXBDYW52YXNBcnJbMF0ucmVtb3ZlKCk7XHJcbiAgICAgIGhlYXRtYXBDYW52YXNBcnJbMV0ucmVtb3ZlKCk7XHJcbiAgICAgIC8vIHJlcGFpbnQgc2FtZSBoZWF0bWFwIGluc3RhbmNlXHJcbiAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKTtcclxuICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90cyk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHb2FsSGVhdG1hcChzaG90cykge1xyXG4gICAgLy8gY3JlYXRlIGdvYWwgaGVhdG1hcCB3aXRoIGNvbmZpZ3VyYXRpb25cclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGxldCB2YXJHb2FsV2lkdGggPSBnb2FsQ29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHZhckdvYWxIZWlnaHQgPSBnb2FsQ29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICBsZXQgZ29hbENvbmZpZyA9IGhlYXRtYXBEYXRhLmdldEdvYWxDb25maWcoZ29hbENvbnRhaW5lcik7XHJcblxyXG4gICAgbGV0IEdvYWxIZWF0bWFwSW5zdGFuY2U7XHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZ29hbENvbmZpZyk7XHJcblxyXG4gICAgbGV0IGdvYWxEYXRhUG9pbnRzID0gW107XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IHhfID0gTnVtYmVyKChzaG90LmdvYWxYICogdmFyR29hbFdpZHRoKS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHlfID0gTnVtYmVyKChzaG90LmdvYWxZICogdmFyR29hbEhlaWdodCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB2YWx1ZV8gPSAxO1xyXG4gICAgICAvLyBzZXQgdmFsdWUgYXMgYmFsbCBzcGVlZCBpZiBzcGVlZCBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgICAgdmFsdWVfID0gc2hvdC5iYWxsX3NwZWVkO1xyXG4gICAgICB9XHJcbiAgICAgIGxldCBnb2FsT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZ29hbERhdGFQb2ludHMucHVzaChnb2FsT2JqKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGdvYWxEYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZ29hbERhdGFQb2ludHNcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgbWF4IHZhbHVlIGFzIG1heCBiYWxsIHNwZWVkIGluIHNob3RzLCBpZiBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICBsZXQgbWF4QmFsbFNwZWVkID0gc2hvdHMucmVkdWNlKChtYXgsIHNob3QpID0+IHNob3QuYmFsbF9zcGVlZCA+IG1heCA/IHNob3QuYmFsbF9zcGVlZCA6IG1heCwgc2hvdHNbMF0uYmFsbF9zcGVlZCk7XHJcbiAgICAgIGdvYWxEYXRhLm1heCA9IG1heEJhbGxTcGVlZDtcclxuICAgIH1cclxuXHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZ29hbERhdGEpO1xyXG4gIH0sXHJcblxyXG4gIGdldEZpZWxkQ29uZmlnKGZpZWxkQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMjVweCBhdCA1NTBweCB3aWR0aCwgb3IgNC41NDUlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGZpZWxkQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IDAuMDQ1NDU0NTQ1ICogZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC42LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuODVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMzVweCBhdCA1NTBweCB3aWR0aCwgb3IgNi4zNjMlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGdvYWxDb250YWluZXIsXHJcbiAgICAgIHJhZGl1czogLjA2MzYzNjM2MyAqIGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC42LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuODVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgYmFsbFNwZWVkTWF4KCkge1xyXG4gICAgLy8gdGhpcyBidXR0b24gZnVuY3Rpb24gY2FsbGJhY2sgKGl0J3MgYSBmaWx0ZXIpIGNoYW5nZXMgYSBib29sZWFuIGdsb2JhbCB2YXJpYWJsZSB0aGF0IGRldGVybWluZXMgdGhlIG1pbiBhbmQgbWF4IHZhbHVlc1xyXG4gICAgLy8gdXNlZCB3aGVuIHJlbmRlcmluZyB0aGUgaGVhdG1hcHMgKHNlZSBidWlsZEZpZWxkSGVhdG1hcCgpIGFuZCBidWlsZEdvYWxIZWF0bWFwKCkpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZEJ0blwiKTtcclxuXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gdHJ1ZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzYXZlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHNhdmluZyBhIGhlYXRtYXAgb2JqZWN0IHdpdGggYSBuYW1lLCB1c2VySWQsIGFuZCBkYXRlIC0gdGhlbiBtYWtpbmcgam9pbiB0YWJsZXMgd2l0aCBoZWF0bWFwSWQgYW5kIGVhY2ggc2hvdElkXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGNvbnN0IHNhdmVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIikpO1xyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwQnRuXCIpO1xyXG4gICAgbGV0IGhlYXRtYXBOYW1lSXNVbmlxdWUgPSB0cnVlO1xyXG5cclxuICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gdHJ1ZTsgLy8gaW1tZWRpYXRlbHkgZGlzYWJsZSBzYXZlIGJ1dHRvbiB0byBwcmV2ZW50IG11bHRpcGxlIGNsaWNrc1xyXG4gICAgY29uc3QgaGVhdG1hcFRpdGxlID0gc2F2ZUlucHV0LnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXTtcclxuXHJcbiAgICAvLyAxLiBoZWF0bWFwIG11c3QgaGF2ZSB0aXRsZSAmIHRoZSB0aXRsZSBjYW5ub3QgYmUgXCJTYXZlIHN1Y2Nlc3NmdWwhXCIgb3IgXCJCYXNpYyBIZWF0bWFwXCIgb3IgXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCIgb3IgXCJObyB0aXRsZSBwcm92aWRlZFwiIG9yIFwiSGVhdG1hcCBuYW1lIG5vdCB1bmlxdWVcIlxyXG4gICAgLy8gMi4gdGhlcmUgbXVzdCBiZSBhIGhlYXRtYXAgY2FudmFzIGxvYWRlZCBvbiB0aGUgcGFnZVxyXG4gICAgLy8gMy4gKHNlZSBzZWNvbmQgaWYgc3RhdGVtZW50KSB0aGUgc2F2ZSBidXR0b24gd2lsbCByZXNwb25kIHdvcmsgaWYgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHNhdmUgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwXHJcbiAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA+IDAgJiYgaGVhdG1hcFRpdGxlICE9PSBcIlNhdmUgc3VjY2Vzc2Z1bFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJCYXNpYyBIZWF0bWFwXCIgJiYgaGVhdG1hcFRpdGxlICE9PSBcIkNhbm5vdCBzYXZlIHByaW9yIGhlYXRtYXBcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiQ2Fubm90IHNhdmUgcHJpb3IgaGVhdG1hcFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJIZWF0bWFwIG5hbWUgbm90IHVuaXF1ZVwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyB0aXRsZSBwcm92aWRlZFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyBoZWF0bWFwIGxvYWRlZFwiICYmIGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChoZWF0bWFwRHJvcGRvd24udmFsdWUgIT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCJcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGNoZWNrIGZvciB1bmlxdWUgaGVhdG1hcCBuYW1lIC0gaWYgaXQncyB1bmlxdWUgdGhlbiBzYXZlIHRoZSBoZWF0bWFwIGFuZCBqb2luIHRhYmxlc1xyXG4gICAgICAgIEFQSS5nZXRBbGwoYGhlYXRtYXBzP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gICAgICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwcy5mb3JFYWNoKGhlYXRtYXAgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChoZWF0bWFwLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gaGVhdG1hcFRpdGxlLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgICAgICAgIGhlYXRtYXBOYW1lSXNVbmlxdWUgPSBmYWxzZSAvLyBpZiBhbnkgbmFtZXMgbWF0Y2gsIHZhcmlhYmxlIGJlY29tZXMgZmFsc2VcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC8vIGlmIG5hbWUgaXMgdW5pcXVlIC0gYWxsIGNvbmRpdGlvbnMgbWV0IC0gc2F2ZSBoZWF0bWFwXHJcbiAgICAgICAgICAgIGlmIChoZWF0bWFwTmFtZUlzVW5pcXVlKSB7XHJcbiAgICAgICAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1zdWNjZXNzXCIpO1xyXG4gICAgICAgICAgICAgIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwT2JqZWN0KGhlYXRtYXBUaXRsZSwgYWN0aXZlVXNlcklkKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oaGVhdG1hcE9iaiA9PiBoZWF0bWFwRGF0YS5zYXZlSm9pblRhYmxlcyhoZWF0bWFwT2JqKS50aGVuKHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImpvaW4gdGFibGVzIHNhdmVkXCIsIHgpXHJcbiAgICAgICAgICAgICAgICAgIC8vIGVtcHR5IHRoZSB0ZW1wb3JhcnkgZ2xvYmFsIGFycmF5IHVzZWQgd2l0aCBQcm9taXNlLmFsbFxyXG4gICAgICAgICAgICAgICAgICBqb2luVGFibGVBcnIgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgLy8gYXBwZW5kIG5ld2x5IGNyZWF0ZWQgaGVhdG1hcCBhcyBvcHRpb24gZWxlbWVudCBpbiBzZWxlY3QgZHJvcGRvd25cclxuICAgICAgICAgICAgICAgICAgaGVhdG1hcERyb3Bkb3duLmFwcGVuZENoaWxkKGVsQnVpbGRlcihcIm9wdGlvblwiLCB7IFwiaWRcIjogYGhlYXRtYXAtJHtoZWF0bWFwT2JqLmlkfWAgfSwgYCR7aGVhdG1hcE9iai50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdfTogJHtoZWF0bWFwT2JqLm5hbWV9YCkpO1xyXG4gICAgICAgICAgICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIlNhdmUgc3VjY2Vzc2Z1bFwiO1xyXG4gICAgICAgICAgICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC52YWx1ZSA9IFwiSGVhdG1hcCBuYW1lIG5vdCB1bmlxdWVcIjtcclxuICAgICAgICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgIGlmIChoZWF0bWFwVGl0bGUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJObyB0aXRsZSBwcm92aWRlZFwiO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH0gZWxzZSBpZiAoZmllbGRIZWF0bWFwQ2FudmFzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIk5vIGhlYXRtYXAgbG9hZGVkXCI7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2F2ZUhlYXRtYXBPYmplY3QoaGVhdG1hcFRpdGxlLCBhY3RpdmVVc2VySWQpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gc2F2ZXMgYSBoZWF0bWFwIG9iamVjdCB3aXRoIHRoZSB1c2VyLXByb3ZpZGVkIG5hbWUsIHRoZSB1c2VySWQsIGFuZCB0aGUgY3VycmVudCBkYXRlL3RpbWVcclxuICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG4gICAgY29uc3QgaGVhdG1hcE9iaiA9IHtcclxuICAgICAgbmFtZTogaGVhdG1hcFRpdGxlLFxyXG4gICAgICB1c2VySWQ6IGFjdGl2ZVVzZXJJZCxcclxuICAgICAgdGltZVN0YW1wOiB0aW1lU3RhbXBcclxuICAgIH1cclxuICAgIHJldHVybiBBUEkucG9zdEl0ZW0oXCJoZWF0bWFwc1wiLCBoZWF0bWFwT2JqKVxyXG4gIH0sXHJcblxyXG4gIHNhdmVKb2luVGFibGVzKGhlYXRtYXBPYmopIHtcclxuICAgIGNvbnNvbGUubG9nKFwiZ2xvYmFsc2hvdHNhcnJheVwiLCBnbG9iYWxTaG90c0FycilcclxuICAgIGdsb2JhbFNob3RzQXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCBqb2luVGFibGVPYmogPSB7XHJcbiAgICAgICAgc2hvdElkOiBzaG90LmlkLFxyXG4gICAgICAgIGhlYXRtYXBJZDogaGVhdG1hcE9iai5pZFxyXG4gICAgICB9XHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RfaGVhdG1hcFwiLCBqb2luVGFibGVPYmopKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW5UYWJsZUFycilcclxuICB9LFxyXG5cclxuICBkZWxldGVIZWF0bWFwKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB0aGUgbG9naWMgdGhhdCBwcmV2ZW50cyB0aGUgdXNlciBmcm9tIGRlbGV0aW5nIGEgaGVhdG1hcCBpbiBvbmUgY2xpY2suXHJcbiAgICAvLyBhIHNlY29uZCBkZWxldGUgYnV0dG9uIGFuZCBhIGNhbmNlbCBidXR0b24gYXJlIHJlbmRlcmVkIGJlZm9yZSBhIGRlbGV0ZSBpcyBjb25maXJtZWRcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG5cclxuICAgIGlmIChjdXJyZW50RHJvcGRvd25WYWx1ZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgICBjb25zdCBjb25maXJtRGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNvbmZpcm0gRGVsZXRlXCIpO1xyXG4gICAgICBjb25zdCByZWplY3REZWxldGVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkNhbmNlbFwiKTtcclxuICAgICAgY29uc3QgRGVsZXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJkZWxldGVDb250cm9sXCIsIFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgY29uZmlybURlbGV0ZUJ0biwgcmVqZWN0RGVsZXRlQnRuKTtcclxuICAgICAgZGVsZXRlSGVhdG1hcEJ0bi5yZXBsYWNlV2l0aChEZWxldGVDb250cm9sKTtcclxuICAgICAgY29uZmlybURlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuY29uZmlybUhlYXRtYXBEZWxldGlvbik7XHJcbiAgICAgIHJlamVjdERlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICByZWplY3RIZWF0bWFwRGVsZXRpb24oKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlLXJlbmRlcnMgdGhlIHByaW1hcnkgZGVsZXRlIGJ1dHRvblxyXG4gICAgY29uc3QgRGVsZXRlQ29udHJvbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlQ29udHJvbFwiKTtcclxuICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZGVsZXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRGVsZXRlIEhlYXRtYXBcIilcclxuICAgIERlbGV0ZUNvbnRyb2wucmVwbGFjZVdpdGgoZGVsZXRlSGVhdG1hcEJ0bilcclxuICAgIGRlbGV0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXApO1xyXG4gIH0sXHJcblxyXG4gIGNvbmZpcm1IZWF0bWFwRGVsZXRpb24oKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHdpbGwgZGVsZXRlIHRoZSBzZWxlY3RlZCBoZWF0bWFwIG9wdGlvbiBpbiB0aGUgZHJvcGRvd24gbGlzdCBhbmQgcmVtb3ZlIGFsbCBzaG90X2hlYXRtYXAgam9pbiB0YWJsZXNcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG5cclxuICAgIGhlYXRtYXBEcm9wZG93bi5jaGlsZE5vZGVzLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgICBpZiAoY2hpbGQudGV4dENvbnRlbnQgPT09IGN1cnJlbnREcm9wZG93blZhbHVlKSB7XHJcbiAgICAgICAgY2hpbGQucmVtb3ZlKCk7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcE9iamVjdGFuZEpvaW5UYWJsZXMoY2hpbGQuaWQpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi52YWx1ZSA9IFwiQmFzaWMgSGVhdG1hcFwiO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5yZWplY3RIZWF0bWFwRGVsZXRpb24oKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUhlYXRtYXBPYmplY3RhbmRKb2luVGFibGVzKGhlYXRtYXBJZCkge1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHJldHVybiBBUEkuZGVsZXRlSXRlbShcImhlYXRtYXBzXCIsIGAke2hlYXRtYXBJZC5zbGljZSg4KX0/dXNlcklkPSR7YWN0aXZlVXNlcklkfWApXHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlQmFsbFNwZWVkR2xvYmFsVmFyaWFibGVzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB1c2VkIGJ5IHRoZSByZXNldCBmaWx0ZXJzIGJ1dHRvbiBhbmQgbmF2YmFyIGhlYXRtYXBzIHRhYiB0byBmb3JjZSB0aGUgYmFsbCBzcGVlZCBmaWx0ZXIgb2ZmXHJcbiAgICBjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCA9IGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMocmV0dXJuQm9vbGVhbiwgc3RhcnREYXRlSW5wdXQsIGVuZERhdGVJbnB1dCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIFNFVCB0aGUgZGF0ZSBmaWx0ZXIgZ2xvYmFsIHZhcmlhYmxlcyBvbiB0aGlzIHBhZ2Ugb3IgQ0xFQVIgdGhlbVxyXG4gICAgLy8gaWYgdGhlIDEuIHBhZ2UgaXMgcmVsb2FkZWQgb3IgMi4gdGhlIFwicmVzZXQgZmlsdGVyc1wiIGJ1dHRvbiBpcyBjbGlja2VkXHJcblxyXG4gICAgLy8gdGhlIGRhdGVGaWx0ZXIuanMgY2FuY2VsIGJ1dHRvbiByZXF1ZXN0cyBhIGdsb2JhbCB2YXIgdG8gZGV0ZXJtaW5lIGhvdyB0byBoYW5kbGUgYnV0dG9uIGNvbG9yXHJcbiAgICBpZiAocmV0dXJuQm9vbGVhbikge1xyXG4gICAgICByZXR1cm4gc3RhcnREYXRlXHJcbiAgICB9XHJcbiAgICAvLyBpZiBubyBpbnB1dCB2YWx1ZXMgYXJlIHByb3ZpZGVkLCB0aGF0IG1lYW5zIHRoZSB2YXJpYWJsZXMgbmVlZCB0byBiZSByZXNldCBhbmQgdGhlIGRhdGVcclxuICAgIC8vIGZpbHRlciBidXR0b24gc2hvdWxkIGJlIG91dGxpbmVkIC0gZWxzZSBzZXQgZ2xvYmFsIHZhcnMgZm9yIGZpbHRlclxyXG4gICAgaWYgKHN0YXJ0RGF0ZUlucHV0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgc3RhcnREYXRlID0gdW5kZWZpbmVkO1xyXG4gICAgICBlbmREYXRlID0gdW5kZWZpbmVkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc3RhcnREYXRlID0gc3RhcnREYXRlSW5wdXQ7XHJcbiAgICAgIGVuZERhdGUgPSBlbmREYXRlSW5wdXQ7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2xlYXJIZWF0bWFwUmVwYWludEludGVydmFsKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB1c2VkIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIHBhZ2VzIHNvIHRoYXQgdGhlIHdlYnBhZ2UgZG9lc24ndCBjb250aW51ZSBydW5uaW5nIHRoZSBoZWF0bWFwIGNvbnRhaW5lciB3aWR0aCB0cmFja2VyXHJcbiAgICBpZiAoaW50ZXJ2YWxJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxJZCk7XHJcbiAgICAgIGludGVydmFsSWQgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGVhdG1hcERhdGEiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcblxyXG5jb25zdCBmZWVkYmFjayA9IHtcclxuXHJcbiAgbG9hZEZlZWRiYWNrKHNob3RzKSB7XHJcblxyXG4gICAgLy8gZmlyc3QsIHVzZSB0aGUgc2hvdHMgd2UgaGF2ZSB0byBmZXRjaCB0aGUgZ2FtZXMgdGhleSdyZSBhc3NvY2lhdGVkIHdpdGhcclxuICAgIGxldCBnYW1lSWRzID0gW107XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgZ2FtZUlkcy5wdXNoKHNob3QuZ2FtZUlkKTtcclxuICAgIH0pXHJcblxyXG4gICAgLy8gcmVtb3ZlIGR1cGxpY2F0ZSBnYW1lIElEc1xyXG4gICAgZ2FtZUlkcyA9IGdhbWVJZHMuZmlsdGVyKChpdGVtLCBpZHgpID0+IHtcclxuICAgICAgcmV0dXJuIGdhbWVJZHMuaW5kZXhPZihpdGVtKSA9PSBpZHg7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmZldGNoR2FtZXMoZ2FtZUlkcylcclxuICAgICAgLnRoZW4oZ2FtZXMgPT4gdGhpcy5jYWxjdWxhdGVGZWVkYmFjayhzaG90cywgZ2FtZXMpKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hHYW1lcyhnYW1lSWRzKSB7XHJcbiAgICBsZXQgZ2FtZXMgPSBbXTtcclxuICAgIGdhbWVJZHMuZm9yRWFjaChnYW1lSWQgPT4ge1xyXG4gICAgICBnYW1lcy5wdXNoKEFQSS5nZXRTaW5nbGVJdGVtKFwiZ2FtZXNcIiwgZ2FtZUlkKSlcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGdhbWVzKVxyXG4gIH0sXHJcblxyXG4gIGNhbGN1bGF0ZUZlZWRiYWNrKHNob3RzLCBnYW1lcykge1xyXG5cclxuICAgIGxldCBmZWVkYmFja1Jlc3VsdHMgPSB7fTtcclxuXHJcbiAgICAvLyBnZXQgaGVhdG1hcCBkYXRlIGdlbmVyYXRlZFxyXG4gICAgbGV0IG5vdyA9IG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5ub3cgPSBub3c7XHJcblxyXG4gICAgLy8gY29udmVydCBnYW1lIGRhdGVzIG91dCBvZiBaIHRpbWUgdG8gZ2V0IGxvY2FsIHRpbWV6b25lIGFjY3VyYWN5XHJcbiAgICBsZXQgZ2FtZVRpbWVzID0gW107XHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBnYW1lVGltZXMucHVzaChuZXcgRGF0ZShnYW1lLnRpbWVTdGFtcCkudG9Mb2NhbGVTdHJpbmcoKS5zcGxpdChcIixcIilbMF0pO1xyXG4gICAgfSlcclxuXHJcbiAgICAvLyBzb3J0IGFycmF5IG9mIGRhdGVzIGZyb21cclxuICAgIGdhbWVUaW1lcy5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgIHJldHVybiAgTnVtYmVyKG5ldyBEYXRlKGEpKSAtIE51bWJlcihuZXcgRGF0ZShiKSk7XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGdldCByYW5nZSBvZiBkYXRlcyBvbiBnYW1lcyAobWF4IGFuZCBtaW4pXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWUgPSBnYW1lVGltZXMucG9wKClcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWUgPSBnYW1lVGltZXMuc2hpZnQoKTtcclxuXHJcbiAgICAvLyBnZXQgYXZlcmFnZSBmaWVsZCB4LHkgY29vcmRpbmF0ZSBvZiBwbGF5ZXIgYmFzZWQgb24gc2hvdHMgYW5kIGdpdmUgcGxheWVyIGZlZWRiYWNrXHJcbiAgICBsZXQgc3VtWCA9IDA7XHJcbiAgICBsZXQgc3VtWSA9IDA7XHJcbiAgICBsZXQgYXZnWDtcclxuICAgIGxldCBhdmdZO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHN1bVggKz0gc2hvdC5maWVsZFg7XHJcbiAgICAgIHN1bVkgKz0gc2hvdC5maWVsZFk7XHJcbiAgICB9KVxyXG5cclxuICAgIGF2Z1ggPSBzdW1YIC8gc2hvdHMubGVuZ3RoO1xyXG4gICAgYXZnWSA9IHN1bVkgLyBzaG90cy5sZW5ndGg7XHJcbiAgICBsZXQgZmllbGRQb3NpdGlvbjtcclxuXHJcbiAgICBpZiAoYXZnWCA8IDAuMTUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiS2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4xNSA8PSBhdmdYICYmIGF2Z1ggPD0gMC4zMCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJTd2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJMZWZ0IEZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJSaWdodCBGdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNDUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiQ2VudGVyIEZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJMZWZ0IEhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJSaWdodCBIYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNjApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiQ2VudGVyIEhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC42MCA8PSBhdmdYICYmIGF2Z1ggPCAwLjc1ICYmIGF2Z1kgPD0gMC41MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJMZWZ0IEZvcndhcmRcIlxyXG4gICAgfSBlbHNlIGlmICgwLjYwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNzUgJiYgMC41MCA8IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiUmlnaHQgRm9yd2FyZFwiXHJcbiAgICB9IGVsc2UgaWYgKDAuNzUgPD0gYXZnWCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJTdHJpa2VyXCJcclxuICAgIH1cclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuZmllbGRQb3NpdGlvbiA9IGZpZWxkUG9zaXRpb25cclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgcGxheWVycyB0aGF0IGNvbXBsaW1lbnQgdGhlIHBsYXllcidzIHN0eWxlXHJcbiAgICBsZXQgY29tcGxlbWVudEE7XHJcbiAgICBsZXQgY29tcGxlbWVudEI7XHJcblxyXG4gICAgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiS2VlcGVyXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlN3ZWVwZXJcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJMZWZ0IEZ1bGxiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJSaWdodCBGdWxsQmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJDZW50ZXIgRnVsbGJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiTGVmdCBIYWxmYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiUmlnaHQgSGFsZmJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiQ2VudGVyIEhhbGZiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIlN0cmlrZXJcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkxlZnQgRm9yd2FyZFwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJSaWdodCBGb3J3YXJkXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiU3RyaWtlclwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgfVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wbGVtZW50QSA9IGNvbXBsZW1lbnRBO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRCID0gY29tcGxlbWVudEI7XHJcblxyXG4gICAgLy8gc2hvdHMgc2NvcmVkIG9uIHRlYW0gc2lkZSBhbmQgb3Bwb25lbnQgc2lkZSBvZiBmaWVsZCwgJiBkZWZlbnNpdmUgcmVkaXJlY3RzIChpLmUuIHdpdGhpbiBrZWVwZXIgcmFuZ2Ugb2YgZ29hbClcclxuICAgIGxldCB0ZWFtU2lkZSA9IDA7XHJcbiAgICBsZXQgb3BwU2lkZSA9IDA7XHJcbiAgICBsZXQgZGVmZW5zaXZlUmVkaXJlY3QgPSAwO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGlmIChzaG90LmZpZWxkWCA+IDAuNTApIHtcclxuICAgICAgICBvcHBTaWRlKys7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGVhbVNpZGUrKztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNob3QuZmllbGRYIDwgMC4xNSkge1xyXG4gICAgICAgIGRlZmVuc2l2ZVJlZGlyZWN0Kys7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnRlYW1TaWRlR29hbHMgPSB0ZWFtU2lkZTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5vcHBvbmVudFNpZGVHb2FscyA9IG9wcFNpZGU7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuZGVmZW5zaXZlUmVkaXJlY3QgPSBkZWZlbnNpdmVSZWRpcmVjdDtcclxuXHJcbiAgICAvLyBhZXJpYWwgY291bnQgJiBwZXJjZW50YWdlIG9mIGFsbCBzaG90c1xyXG4gICAgbGV0IGFlcmlhbCA9IDA7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgaWYgKHNob3QuYWVyaWFsID09PSB0cnVlKSB7XHJcbiAgICAgICAgYWVyaWFsKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGxldCBhZXJpYWxQZXJjZW50YWdlID0gTnVtYmVyKChhZXJpYWwgLyBzaG90cy5sZW5ndGggKiAxMDApLnRvRml4ZWQoMCkpO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5hZXJpYWwgPSBhZXJpYWw7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuYWVyaWFsUGVyY2VudGFnZSA9IGFlcmlhbFBlcmNlbnRhZ2U7XHJcblxyXG4gICAgLy8gbWF4IGJhbGwgc3BlZWQsIGF2ZXJhZ2UgYmFsbCBzcGVlZCwgc2hvdHMgb3ZlciA3MCBtcGhcclxuICAgIGxldCBhdmdCYWxsU3BlZWQgPSAwO1xyXG4gICAgbGV0IHNob3RzT3ZlcjcwbXBoID0gMDtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBpZiAoc2hvdC5iYWxsX3NwZWVkID49IDcwKSB7XHJcbiAgICAgICAgc2hvdHNPdmVyNzBtcGgrKztcclxuICAgICAgfVxyXG4gICAgICBhdmdCYWxsU3BlZWQgKz0gc2hvdC5iYWxsX3NwZWVkXHJcbiAgICB9KTtcclxuXHJcbiAgICBhdmdCYWxsU3BlZWQgPSBOdW1iZXIoKGF2Z0JhbGxTcGVlZCAvIHNob3RzLmxlbmd0aCkudG9GaXhlZCgxKSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLm1heEJhbGxTcGVlZCA9IHNob3RzLnJlZHVjZSgobWF4LCBzaG90KSA9PiBzaG90LmJhbGxfc3BlZWQgPiBtYXggPyBzaG90LmJhbGxfc3BlZWQgOiBtYXgsIHNob3RzWzBdLmJhbGxfc3BlZWQpO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmF2Z0JhbGxTcGVlZCA9IGF2Z0JhbGxTcGVlZDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5zaG90c092ZXI3MG1waCA9IHNob3RzT3ZlcjcwbXBoO1xyXG5cclxuICAgIC8vIDN2MywgMnYyLCBhbmQgMXYxIGdhbWVzIHBsYXllZFxyXG4gICAgbGV0IF8zdjMgPSAwO1xyXG4gICAgbGV0IF8ydjIgPSAwO1xyXG4gICAgbGV0IF8xdjEgPSAwO1xyXG5cclxuICAgIGdhbWVzLmZvckVhY2goZ2FtZSA9PiB7XHJcbiAgICAgIGlmIChnYW1lLnR5cGUgPT09IFwiM3YzXCIpIHtcclxuICAgICAgICBfM3YzKys7XHJcbiAgICAgIH0gZWxzZSBpZiAoZ2FtZS50eXBlID09PSBcIjJ2MlwiKSB7XHJcbiAgICAgICAgXzJ2MisrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIF8xdjErKztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLl8zdjMgPSBfM3YzO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLl8ydjIgPSBfMnYyO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLl8xdjEgPSBfMXYxO1xyXG5cclxuICAgIC8vIHRvdGFsIGdhbWVzIHBsYXllZCwgdG90YWwgc2hvdHMgc2NvcmVkLCB3aW5zL2xvc3Nlcy93aW4lXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMudG90YWxHYW1lcyA9IGdhbWVzLmxlbmd0aDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy50b3RhbFNob3RzID0gc2hvdHMubGVuZ3RoO1xyXG5cclxuICAgIGxldCB3aW5zID0gMDtcclxuICAgIGxldCBsb3NzZXMgPSAwO1xyXG5cclxuICAgIGdhbWVzLmZvckVhY2goZ2FtZSA9PiB7XHJcbiAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICB3aW5zKytcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb3NzZXMrKztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLndpbnMgPSB3aW5zO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmxvc3NlcyA9IGxvc3NlcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy53aW5QY3QgPSBOdW1iZXIoKCh3aW5zIC8gKHdpbnMgKyBsb3NzZXMpKSAqIDEwMCkudG9GaXhlZCgwKSk7XHJcblxyXG4gICAgLy8gY29tcCBnYW1lcyAvIHdpbiAlLCBjYXN1YWwgZ2FtZXMgLyB3aW4gJSwgZ2FtZXMgaW4gT1RcclxuICAgIGxldCBjb21wZXRpdGl2ZUdhbWVzID0gMDtcclxuICAgIGxldCBjb21wV2luID0gMDtcclxuICAgIGxldCBjYXN1YWxHYW1lcyA9IDA7XHJcbiAgICBsZXQgY2FzdWFsV2luID0gMDtcclxuICAgIGxldCBvdmVydGltZUdhbWVzID0gMDtcclxuXHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBpZiAoZ2FtZS5tb2RlID09PSBcImNhc3VhbFwiKSB7XHJcbiAgICAgICAgY2FzdWFsR2FtZXMrKztcclxuICAgICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgICBjYXN1YWxXaW4rKztcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29tcGV0aXRpdmVHYW1lcysrO1xyXG4gICAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICAgIGNvbXBXaW4rKztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdhbWUub3ZlcnRpbWUgPT09IHRydWUpIHtcclxuICAgICAgICBvdmVydGltZUdhbWVzKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGxldCBjb21wV2luUGN0ID0gMDtcclxuXHJcbiAgICBpZiAoY29tcGV0aXRpdmVHYW1lcyA9PT0gMCkge1xyXG4gICAgICBjb21wV2luUGN0ID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbXBXaW5QY3QgPSBOdW1iZXIoKChjb21wV2luIC8gY29tcGV0aXRpdmVHYW1lcykgKiAxMDApLnRvRml4ZWQoMCkpO1xyXG4gICAgfVxyXG4gICAgbGV0IGNhc3VhbFdpblBjdCA9IDA7XHJcblxyXG4gICAgaWYgKGNhc3VhbEdhbWVzID09PSAwKSB7XHJcbiAgICAgIGNhc3VhbFdpblBjdCA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjYXN1YWxXaW5QY3QgPSBOdW1iZXIoKChjYXN1YWxXaW4gLyBjYXN1YWxHYW1lcykgKiAxMDApLnRvRml4ZWQoMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wZXRpdGl2ZUdhbWVzID0gY29tcGV0aXRpdmVHYW1lcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jYXN1YWxHYW1lcyA9IGNhc3VhbEdhbWVzO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBXaW5QY3QgPSBjb21wV2luUGN0O1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNhc3VhbFdpblBjdCA9IGNhc3VhbFdpblBjdDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5vdmVydGltZUdhbWVzID0gb3ZlcnRpbWVHYW1lcztcclxuXHJcbiAgICByZXR1cm4gdGhpcy5idWlsZExldmVscyhmZWVkYmFja1Jlc3VsdHMpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkTGV2ZWxzKGZlZWRiYWNrUmVzdWx0cykge1xyXG5cclxuICAgIGNvbnN0IGZlZWRiYWNrQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwQW5kRmVlZGJhY2tDb250YWluZXJcIik7XHJcblxyXG4gICAgLy8gcmVmb3JtYXQgaGVhdG1hcCBnZW5lcmF0aW9uIHRpbWUgdG8gcmVtb3ZlIHNlY29uZHNcclxuICAgIGNvbnN0IHRpbWVSZWZvcm1hdCA9IFtmZWVkYmFja1Jlc3VsdHMubm93LnNwbGl0KFwiOlwiKVswXSwgZmVlZGJhY2tSZXN1bHRzLm5vdy5zcGxpdChcIjpcIilbMV1dLmpvaW4oXCI6XCIpICsgZmVlZGJhY2tSZXN1bHRzLm5vdy5zcGxpdChcIjpcIilbMl0uc2xpY2UoMik7XHJcblxyXG4gICAgLy8gaGVhdG1hcCBnZW5lcmF0aW9uIGFuZCByYW5nZSBvZiBkYXRlcyBvbiBnYW1lcyAobWF4IGFuZCBtaW4pXHJcbiAgICBjb25zdCBpdGVtM19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWV9YCk7XHJcbiAgICBjb25zdCBpdGVtM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiTGFzdCBnYW1lXCIpO1xyXG4gICAgY29uc3QgaXRlbTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTNfY2hpbGQsIGl0ZW0zX2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW0zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtM193cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0yX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWV9YCk7XHJcbiAgICBjb25zdCBpdGVtMl9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiRmlyc3QgZ2FtZVwiKTtcclxuICAgIGNvbnN0IGl0ZW0yX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yX2NoaWxkLCBpdGVtMl9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHt0aW1lUmVmb3JtYXR9YCk7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiSGVhdG1hcCBnZW5lcmF0ZWRcIik7XHJcbiAgICBjb25zdCBpdGVtMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMV9jaGlsZCwgaXRlbTFfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczFfSGVhdG1hcERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stMVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMSwgaXRlbTIsIGl0ZW0zKVxyXG5cclxuICAgIC8vIHBsYXllciBmZWVkYmFjayBiYXNlZCBvbiBhdmVyYWdlIGZpZWxkIHgseSBjb29yZGluYXRlIG9mIHBsYXllciBzaG90c1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRCfWApO1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDJcIik7XHJcbiAgICBjb25zdCBpdGVtNl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNl9jaGlsZCwgaXRlbTZfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW02X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRBfWApO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDFcIik7XHJcbiAgICBjb25zdCBpdGVtNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNV9jaGlsZCwgaXRlbTVfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW01X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmZpZWxkUG9zaXRpb259YCk7XHJcbiAgICBjb25zdCBpdGVtNF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiWW91ciBwbGF5c3R5bGVcIik7XHJcbiAgICBjb25zdCBpdGVtNF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNF9jaGlsZCwgaXRlbTRfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW00X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczJfcGxheWVyVHlwZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay0yXCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zXCIgfSwgbnVsbCwgaXRlbTQsIGl0ZW01LCBpdGVtNilcclxuXHJcbiAgICAvLyBzaG90cyBvbiB0ZWFtL29wcG9uZW50IHNpZGVzIG9mIGZpZWxkLCBkZWZlbnNpdmUgcmVkaXJlY3RzLCBhbmQgYWVyaWFsIHNob3RzIC8gJVxyXG4gICAgY29uc3QgaXRlbTlfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmRlZmVuc2l2ZVJlZGlyZWN0fWApO1xyXG4gICAgY29uc3QgaXRlbTlfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlJlZGlyZWN0cyBmcm9tIE93biBHb2FsXCIpO1xyXG4gICAgY29uc3QgaXRlbTlfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTlfY2hpbGQsIGl0ZW05X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtOSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTlfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtOF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudGVhbVNpZGVHb2Fsc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5vcHBvbmVudFNpZGVHb2Fsc31gKTtcclxuICAgIGNvbnN0IGl0ZW04X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJHb2FscyBCZWhpbmQgJiBCZXlvbmQgTWlkZmllbGRcIik7XHJcbiAgICBjb25zdCBpdGVtOF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtOF9jaGlsZCwgaXRlbThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW04ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtOF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW03X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5hZXJpYWx9IDogJHtmZWVkYmFja1Jlc3VsdHMuYWVyaWFsUGVyY2VudGFnZX0lYCk7XHJcbiAgICBjb25zdCBpdGVtN19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQWVyaWFsIEdvYWwgVG90YWwgJiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtN193cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtN19jaGlsZCwgaXRlbTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW03ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtN193cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnMzX3Nob3REZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTNcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtNywgaXRlbTgsIGl0ZW05KVxyXG5cclxuICAgIC8vIG1heCBiYWxsIHNwZWVkLCBhdmVyYWdlIGJhbGwgc3BlZWQsIHNob3RzIG92ZXIgNzAgbXBoXHJcbiAgICBjb25zdCBpdGVtMTJfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnNob3RzT3ZlcjcwbXBofWApO1xyXG4gICAgY29uc3QgaXRlbTEyX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJHb2FscyBPdmVyIDcwIG1waFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTJfY2hpbGQsIGl0ZW0xMl9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTEyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmF2Z0JhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkF2ZXJhZ2UgQmFsbCBTcGVlZFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTFfY2hpbGQsIGl0ZW0xMV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTExID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTFfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLm1heEJhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIk1heCBCYWxsIFNwZWVkXCIpO1xyXG4gICAgY29uc3QgaXRlbTEwX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xMF9jaGlsZCwgaXRlbTEwX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTAgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xMF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM0X2JhbGxEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTRcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnMgaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyXCIgfSwgbnVsbCwgaXRlbTEwLCBpdGVtMTEsIGl0ZW0xMilcclxuXHJcbiAgICAvLyB0b3RhbCBnYW1lcyBwbGF5ZWQsIHRvdGFsIHNob3RzIHNjb3JlZCwgd2lucy9sb3NzZXMvd2luJVxyXG4gICAgY29uc3QgaXRlbTE1X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy53aW5zfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLmxvc3Nlc30gOiAke2ZlZWRiYWNrUmVzdWx0cy53aW5QY3R9JWApO1xyXG4gICAgY29uc3QgaXRlbTE1X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJXaW5zLCBMb3NzZXMsICYgV2luIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTVfY2hpbGQsIGl0ZW0xNV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTVfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnRvdGFsU2hvdHN9YCk7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlRvdGFsIEdvYWxzXCIpO1xyXG4gICAgY29uc3QgaXRlbTE0X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xNF9jaGlsZCwgaXRlbTE0X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xNF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudG90YWxHYW1lc31gKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiVG90YWwgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTEzX2NoaWxkLCBpdGVtMTNfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTEzX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczVfdmljdG9yeURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stNVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTMsIGl0ZW0xNCwgaXRlbTE1KVxyXG5cclxuICAgIC8vIDN2MywgMnYyLCBhbmQgMXYxIGdhbWVzIHBsYXllZFxyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMXYxfWApO1xyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIxdjEgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMThfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE4X2NoaWxkLCBpdGVtMThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xOCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE4X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMnYyfWApO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIydjIgZ2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTdfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE3X2NoaWxkLCBpdGVtMTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE3X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fM3YzfWApO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIzdjMgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTZfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE2X2NoaWxkLCBpdGVtMTZfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE2X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczZfZ2FtZVR5cGVEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTZcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtMTYsIGl0ZW0xNywgaXRlbTE4KVxyXG5cclxuICAgIC8vIGNvbXAgZ2FtZXMgLyB3aW4gJSwgY2FzdWFsIGdhbWVzIC8gd2luICUsIGdhbWVzIGluIE9UXHJcbiAgICBjb25zdCBpdGVtMjFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLm92ZXJ0aW1lR2FtZXN9YCk7XHJcbiAgICBjb25zdCBpdGVtMjFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIk92ZXJ0aW1lIEdhbWVzXCIpO1xyXG4gICAgY29uc3QgaXRlbTIxX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yMV9jaGlsZCwgaXRlbTIxX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0yMV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0yMF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY29tcGV0aXRpdmVHYW1lc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5jb21wV2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0yMF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ29tcGV0aXRpdmUgR2FtZXMgJiBXaW4gUGN0XCIpO1xyXG4gICAgY29uc3QgaXRlbTIwX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yMF9jaGlsZCwgaXRlbTIwX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMjAgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0yMF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xOV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY2FzdWFsR2FtZXN9IDogJHtmZWVkYmFja1Jlc3VsdHMuY2FzdWFsV2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0xOV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ2FzdWFsIEdhbWVzICYgV2luIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xOV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTlfY2hpbGQsIGl0ZW0xOV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE5ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTlfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zN19vdmVydGltZURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stN1wiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTksIGl0ZW0yMCwgaXRlbTIxKVxyXG5cclxuICAgIC8vIHJlcGxhY2Ugb2xkIGNvbnRlbnQgaWYgaXQncyBhbHJlYWR5IG9uIHRoZSBwYWdlXHJcbiAgICBjb25zdCBmZWVkYmFjazEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTFcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTJcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTNcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTRcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTVcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTZcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTdcIik7XHJcblxyXG4gICAgaWYgKGZlZWRiYWNrMSAhPT0gbnVsbCkge1xyXG4gICAgICBmZWVkYmFjazEucmVwbGFjZVdpdGgoY29sdW1uczFfSGVhdG1hcERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazIucmVwbGFjZVdpdGgoY29sdW1uczJfcGxheWVyVHlwZSk7XHJcbiAgICAgIGZlZWRiYWNrMy5yZXBsYWNlV2l0aChjb2x1bW5zM19zaG90RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNC5yZXBsYWNlV2l0aChjb2x1bW5zNF9iYWxsRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNS5yZXBsYWNlV2l0aChjb2x1bW5zNV92aWN0b3J5RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNi5yZXBsYWNlV2l0aChjb2x1bW5zNl9nYW1lVHlwZURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazcucmVwbGFjZVdpdGgoY29sdW1uczdfb3ZlcnRpbWVEZXRhaWxzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnMxX0hlYXRtYXBEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczJfcGxheWVyVHlwZSk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM0X2JhbGxEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczNfc2hvdERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zNV92aWN0b3J5RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM2X2dhbWVUeXBlRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM3X292ZXJ0aW1lRGV0YWlscyk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZlZWRiYWNrXHJcblxyXG5cclxuLypcclxuLSBIZWF0bWFwIGdlbmVyYXRlZCBvblxyXG4tIHN0YXJ0IGRhdGVcclxuLSBlbmQgZGF0ZVxyXG4tLS0tLS0tLS0tLS0tXHJcbi0gcmVsZXZhbnQgc29jY2VyIHBvc2l0aW9uIGJhc2VkIG9uIGF2ZyBzY29yZSBwb3NpdGlvblxyXG4tIHBhaXJlZCBiZXN0IHdpdGggMVxyXG4tIHBhaXJlZCBiZXN0IHdpdGggMlxyXG4tLS0tLS0tLS0tLS0tLVxyXG4tIHNob3RzIHNjb3JlZCBsZWZ0IC8gcmlnaHQgb2YgbWlkZmllbGRcclxuLSBzaG90cyBzY29yZWQgYXMgcmVkaXJlY3RzIGJlc2lkZSBvd24gZ29hbCAoRGVmZW5zaXZlIHJlZGlyZWN0cylcclxuLSBhZXJpYWwgY291bnQgJiBzaG90ICVcclxuLS0tLS0tLS0tLS0tLS1cclxuLSBtYXggYmFsbCBzcGVlZFxyXG4tIGF2ZyBiYWxsIHNwZWVkXHJcbi0gc2hvdHMgb3ZlciA3MG1waCAofiAxMTAga3BoKVxyXG4tLS0tLS0tLS0tLS0tLVxyXG4tIDN2MyBnYW1lcyBwbGF5ZWRcclxuLSAydjIgZ2FtZXMgcGxheWVkXHJcbi0gMXYxIGdhbWVzIHBsYXllZFxyXG4tLS0tLS0tLS0tLS0tXHJcbi0gdG90YWwgZ2FtZXMgcGxheWVkXHJcbi0gdG90YWwgc2hvdHMgc2NvcmVkXHJcbi0gd2luIC8gbG9zcyAvIHdpbiVcclxuLS0tLS0tLS0tLS0tLVxyXG4tIGNvbXAgZ2FtZXMgLyB3aW4gJVxyXG4tIGNhc3VhbCBnYW1lcyAvIHdpbiAlXHJcbi0gZ2FtZXMgaW4gT1RcclxuLS0tLS0tLS0tLS0tLVxyXG5cclxuKi8iLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiO1xyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgZGF0ZUZpbHRlciBmcm9tIFwiLi9kYXRlRmlsdGVyXCI7XHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgaGVhdG1hcHMgPSB7XHJcblxyXG4gIGxvYWRIZWF0bWFwQ29udGFpbmVycygpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHRoaXMuYnVpbGRGaWx0ZXJzKCk7XHJcbiAgICAvLyBidWlsZHMgYnV0dG9uIHRvIGdlbmVyYXRlIGhlYXRtYXAsIHNhdmUgaGVhdG1hcCwgYW5kIHZpZXcgc2F2ZWQgaGVhdG1hcHNcclxuICAgIC8vIHRoZSBhY3Rpb24gaXMgYXN5bmMgYmVjYXVzZSB0aGUgdXNlcidzIHNhdmVkIGhlYXRtYXBzIGhhdmUgdG8gYmUgcmVuZGVyZWQgYXMgSFRNTCBvcHRpb24gZWxlbWVudHNcclxuICAgIHRoaXMuYnVpbGRHZW5lcmF0b3IoKTtcclxuICB9LFxyXG5cclxuICBidWlsZEZpbHRlcnMoKSB7XHJcblxyXG4gICAgLy8gcmVzZXQgYnV0dG9uXHJcbiAgICBjb25zdCByZXNldEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJyZXNldEZpbHRlcnNCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIlJlc2V0IEZpbHRlcnNcIik7XHJcblxyXG4gICAgLy8gZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGNvbnN0IGRhdGVCdG5UZXh0ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7fSwgXCJEYXRlc1wiKTtcclxuICAgIGNvbnN0IGRhdGVCdG5JY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXIgZmEtY2FsZW5kYXJcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGRhdGVCdG5JY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbFwiIH0sIG51bGwsIGRhdGVCdG5JY29uKTtcclxuICAgIGNvbnN0IGRhdGVCdG4gPSBlbEJ1aWxkZXIoXCJhXCIsIHtcImlkXCI6XCJkYXRlUmFuZ2VCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1vdXRsaW5lZCBpcy1kYXJrXCIgfSwgbnVsbCwgZGF0ZUJ0bkljb25TcGFuLCBkYXRlQnRuVGV4dCk7XHJcbiAgICBjb25zdCBkYXRlQnRuUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkYXRlQnRuKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGJ1dHRvblxyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuVGV4dCA9IGVsQnVpbGRlcihcInNwYW5cIiwge30sIFwiQmFsbCBTcGVlZFwiKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0bkljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1ib2x0XCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5JY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbFwiIH0sIG51bGwsIGJhbGxTcGVlZEJ0bkljb24pO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiaWRcIjogXCJiYWxsU3BlZWRCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1vdXRsaW5lZCBpcy1kYXJrXCIgfSwgbnVsbCwgYmFsbFNwZWVkQnRuSWNvblNwYW4sIGJhbGxTcGVlZEJ0blRleHQpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBiYWxsU3BlZWRCdG4pO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBjb25zdCBpY29uNiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWNsb2NrXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb242KTtcclxuICAgIGNvbnN0IHNlbDZfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT1RcIik7XHJcbiAgICBjb25zdCBzZWw2X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBPVFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDYgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLW92ZXJ0aW1lXCIgfSwgbnVsbCwgc2VsNl9vcDEsIHNlbDZfb3AyLCBzZWw2X29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NiwgaWNvblNwYW42KTtcclxuICAgIGNvbnN0IGNvbnRyb2w2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY2KTtcclxuXHJcbiAgICAvLyByZXN1bHRcclxuICAgIGNvbnN0IGljb241ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtdHJvcGh5XCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjUgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb241KTtcclxuICAgIGNvbnN0IHNlbDVfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlJlc3VsdFwiKTtcclxuICAgIGNvbnN0IHNlbDVfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlZpY3RvcnlcIik7XHJcbiAgICBjb25zdCBzZWw1X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJEZWZlYXRcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q1ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1nYW1lUmVzdWx0XCIgfSwgbnVsbCwgc2VsNV9vcDEsIHNlbDVfb3AyLCBzZWw1X29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NSwgaWNvblNwYW41KTtcclxuICAgIGNvbnN0IGNvbnRyb2w1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY1KTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGVcclxuICAgIGNvbnN0IGljb240ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtc2l0ZW1hcFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW40ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNCk7XHJcbiAgICBjb25zdCBzZWw0X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJHYW1lIFR5cGVcIik7XHJcbiAgICBjb25zdCBzZWw0X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBzZWw0X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIydjJcIik7XHJcbiAgICBjb25zdCBzZWw0X29wNCA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIxdjFcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1nYW1lVHlwZVwiIH0sIG51bGwsIHNlbDRfb3AxLCBzZWw0X29wMiwgc2VsNF9vcDMsIHNlbDRfb3A0KTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q0LCBpY29uU3BhbjQpO1xyXG4gICAgY29uc3QgY29udHJvbDQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjQpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZVxyXG4gICAgY29uc3QgaWNvbjMgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1nYW1lcGFkXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24zKTtcclxuICAgIGNvbnN0IHNlbDNfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkdhbWUgTW9kZVwiKTtcclxuICAgIGNvbnN0IHNlbDNfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNvbXBldGl0aXZlXCIpO1xyXG4gICAgY29uc3Qgc2VsM19vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ2FzdWFsXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MyA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItZ2FtZU1vZGVcIiB9LCBudWxsLCBzZWwzX29wMSwgc2VsM19vcDIsIHNlbDNfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QzLCBpY29uU3BhbjMpO1xyXG4gICAgY29uc3QgY29udHJvbDMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjMpO1xyXG5cclxuICAgIC8vIHBhcnR5XHJcbiAgICBjb25zdCBpY29uMiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWhhbmRzaGFrZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uMik7XHJcbiAgICBjb25zdCBzZWwyX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJUZWFtXCIpO1xyXG4gICAgY29uc3Qgc2VsMl9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gcGFydHlcIik7XHJcbiAgICBjb25zdCBzZWwyX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJQYXJ0eVwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDIgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLXRlYW1TdGF0dXNcIiB9LCBudWxsLCBzZWwyX29wMSwgc2VsMl9vcDIsIHNlbDJfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QyLCBpY29uU3BhbjIpO1xyXG4gICAgY29uc3QgY29udHJvbDIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjIpO1xyXG5cclxuICAgIC8vIHNob3QgdHlwZVxyXG4gICAgY29uc3QgaWNvbjEgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1mdXRib2xcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjEpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU2hvdCBUeXBlXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQWVyaWFsXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU3RhbmRhcmRcIik7XHJcbiAgICBjb25zdCBzZWxlY3QxID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1zaG90VHlwZVwiIH0sIG51bGwsIHNlbDFfb3AxLCBzZWwxX29wMiwgc2VsMV9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDEsIGljb25TcGFuMSk7XHJcbiAgICBjb25zdCBjb250cm9sMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2MSk7XHJcblxyXG4gICAgY29uc3QgZmlsdGVyRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmlsdGVyRmllbGRcIiwgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGNvbnRyb2wxLCBjb250cm9sMiwgY29udHJvbDMsIGNvbnRyb2w0LCBjb250cm9sNSwgY29udHJvbDYsIGJhbGxTcGVlZEJ0blBhcmVudCwgZGF0ZUJ0blBhcmVudCwgcmVzZXRCdG4pO1xyXG4gICAgY29uc3QgUGFyZW50RmlsdGVyQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBmaWx0ZXJGaWVsZCk7XHJcblxyXG4gICAgLy8gYXBwZW5kIGZpbHRlciBjb250YWluZXIgdG8gd2VicGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRGaWx0ZXJDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2VuZXJhdG9yKCkge1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuXHJcbiAgICAvLyB1c2UgZmV0Y2ggdG8gYXBwZW5kIG9wdGlvbnMgdG8gc2VsZWN0IGVsZW1lbnQgaWYgdXNlciBhdCBsZWFzdCAxIHNhdmVkIGhlYXRtYXBcclxuICAgIEFQSS5nZXRBbGwoYGhlYXRtYXBzP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gICAgICAudGhlbihoZWF0bWFwcyA9PiB7XHJcbiAgICAgICAgY29uc3QgaWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWZpcmVcIiB9LCBudWxsKTtcclxuICAgICAgICBjb25zdCBpY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbik7XHJcbiAgICAgICAgY29uc3Qgc2VsMV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQmFzaWMgSGVhdG1hcFwiKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiaGVhdG1hcERyb3Bkb3duXCIgfSwgbnVsbCwgc2VsMV9vcDEpO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBTZWxlY3REaXYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBoZWF0bWFwRHJvcGRvd24sIGljb25TcGFuKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgaGVhdG1hcFNlbGVjdERpdik7XHJcblxyXG4gICAgICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZGVsZXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRGVsZXRlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBkZWxldGVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkZWxldGVIZWF0bWFwQnRuKVxyXG4gICAgICAgIGNvbnN0IHNhdmVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBzYXZlQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgc2F2ZUJ0bilcclxuICAgICAgICBjb25zdCBzYXZlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzYXZlSGVhdG1hcElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJOYW1lIGFuZCBzYXZlIHRoaXMgaGVhdG1hcFwiLCBcIm1heGxlbmd0aFwiOiBcIjI1XCIgfSwgbnVsbClcclxuICAgICAgICBjb25zdCBzYXZlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGlzLWV4cGFuZGVkXCIgfSwgbnVsbCwgc2F2ZUlucHV0KVxyXG5cclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZ2VuZXJhdGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiR2VuZXJhdGUgSGVhdG1hcFwiKTtcclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnZW5lcmF0b3JCdXR0b24pO1xyXG5cclxuICAgICAgICAvLyBpZiBubyBoZWF0bWFwcyBhcmUgc2F2ZWQsIGdlbmVyYXRlIG5vIGV4dHJhIG9wdGlvbnMgaW4gZHJvcGRvd25cclxuICAgICAgICBpZiAoaGVhdG1hcHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGVsc2UsIGZvciBlYWNoIGhlYXRtYXAgc2F2ZWQsIG1ha2UgYSBuZXcgb3B0aW9uIGFuZCBhcHBlbmQgaXQgdG8gdGhlXHJcbiAgICAgICAgICBoZWF0bWFwcy5mb3JFYWNoKGhlYXRtYXAgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24uYXBwZW5kQ2hpbGQoZWxCdWlsZGVyKFwib3B0aW9uXCIsIHsgXCJpZFwiOiBgaGVhdG1hcC0ke2hlYXRtYXAuaWR9YCB9LCBgJHtoZWF0bWFwLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF19OiAke2hlYXRtYXAubmFtZX1gKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgY29uc3QgZ2VuZXJhdG9yRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgaGVhdG1hcENvbnRyb2wsIGdlbmVyYXRvckNvbnRyb2wsIHNhdmVDb250cm9sLCBzYXZlQnRuQ29udHJvbCwgZGVsZXRlQnRuQ29udHJvbCk7XHJcbiAgICAgICAgICBjb25zdCBQYXJlbnRHZW5lcmF0b3JDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGdlbmVyYXRvckZpZWxkKTtcclxuICAgICAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idWlsZEZpZWxkYW5kR29hbCgpO1xyXG4gICAgICAgIGRhdGVGaWx0ZXIuYnVpbGREYXRlRmlsdGVyKCk7XHJcbiAgICAgICAgdGhpcy5oZWF0bWFwRXZlbnRNYW5hZ2VyKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICB9LFxyXG5cclxuICBidWlsZEZpZWxkYW5kR29hbCgpIHtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgaGVhdG1hcEltYWdlQ29udGFpbmVycyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHtcImlkXCI6XCJoZWF0bWFwQW5kRmVlZGJhY2tDb250YWluZXJcIiwgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBoZWF0bWFwSW1hZ2VDb250YWluZXJzKVxyXG5cclxuICAgIC8vIGFwcGVuZCBmaWVsZCBhbmQgZ29hbCB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGhlYXRtYXBFdmVudE1hbmFnZXIoKSB7XHJcbiAgICAvLyBhZGQgZnVuY3Rpb25hbGl0eSB0byBwcmltYXJ5IGJ1dHRvbnMgb24gaGVhdG1hcCBwYWdlXHJcbiAgICBjb25zdCBnZW5lcmF0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdlbmVyYXRlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IHNhdmVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUhlYXRtYXBCdG5cIik7XHJcblxyXG4gICAgZ2VuZXJhdGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5nZXRVc2VyU2hvdHMpO1xyXG4gICAgc2F2ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwKTtcclxuICAgIGRlbGV0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXApO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lciB0byBoZWF0bWFwIHBhcmVudCB0aGF0IGhpZ2hsaWdodHMgZmlsdGVyIGJ1dHRvbnMgcmVkIHdoZW4gY2hhbmdlZFxyXG4gICAgLy8gaGVhdG1hcCBidXR0b25zIHJldHVybiB0byBkZWZhdWx0IGNvbG9yIGlmIHRoZSBkZWZhdWx0IG9wdGlvbiBpcyBzZWxlY3RlZFxyXG4gICAgY29uc3QgZmlsdGVyRmllbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlckZpZWxkXCIpO1xyXG4gICAgZmlsdGVyRmllbGQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZSkgPT4ge1xyXG4gICAgICBlLnRhcmdldC5wYXJlbnROb2RlLmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgIGlmIChlLnRhcmdldC52YWx1ZSA9PT0gZS50YXJnZXQuY2hpbGROb2Rlc1swXS50ZXh0Q29udGVudCkge1xyXG4gICAgICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gYWRkIGxpc3RlbmVyIHRvIGhlYXRtYXAgdGl0bGUgaW5wdXQgdG8gY2xlYXIgcmVkIGhpZ2hsaXRpbmcgYW5kIHRleHQgaWYgYW4gZXJyb3Igd2FzIHRocm93blxyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIHNhdmVIZWF0bWFwSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgaWYgKHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtZGFuZ2VyXCIpIHx8IHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc3VjY2Vzc1wiKSkge1xyXG4gICAgICAgIHNhdmVIZWF0bWFwSW5wdXQudmFsdWUgPSBcIlwiO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgICAgICBzYXZlSGVhdG1hcElucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zdWNjZXNzXCIpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIHJlc2V0IGZpbHRlciBidXR0b25cclxuICAgIGNvbnN0IHJlc2V0RmlsdGVyc0J0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzZXRGaWx0ZXJzQnRuXCIpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lTW9kZVwiKTtcclxuICAgIGNvbnN0IHNob3RUeXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItc2hvdFR5cGVcIik7XHJcbiAgICBjb25zdCBnYW1lUmVzdWx0RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVJlc3VsdFwiKTtcclxuICAgIGNvbnN0IGdhbWV0eXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVR5cGVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLW92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3QgdGVhbVN0YXR1c0ZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLXRlYW1TdGF0dXNcIik7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkQnRuXCIpO1xyXG5cclxuICAgIHJlc2V0RmlsdGVyc0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICBnYW1lTW9kZUZpbHRlci52YWx1ZSA9IFwiR2FtZSBNb2RlXCI7XHJcbiAgICAgIGdhbWVNb2RlRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIHNob3RUeXBlRmlsdGVyLnZhbHVlID0gXCJTaG90IFR5cGVcIjtcclxuICAgICAgc2hvdFR5cGVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgZ2FtZVJlc3VsdEZpbHRlci52YWx1ZSA9IFwiUmVzdWx0XCI7XHJcbiAgICAgIGdhbWVSZXN1bHRGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgZ2FtZXR5cGVGaWx0ZXIudmFsdWUgPSBcIkdhbWUgVHlwZVwiO1xyXG4gICAgICBnYW1ldHlwZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBvdmVydGltZUZpbHRlci52YWx1ZSA9IFwiT3ZlcnRpbWVcIjtcclxuICAgICAgb3ZlcnRpbWVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgdGVhbVN0YXR1c0ZpbHRlci52YWx1ZSA9IFwiVGVhbVwiO1xyXG4gICAgICB0ZWFtU3RhdHVzRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIC8vIHJlc2V0IGJhbGwgc3BlZWQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICBoZWF0bWFwRGF0YS5oYW5kbGVCYWxsU3BlZWRHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC5hZGQoXCJpcy1vdXRsaW5lZFwiKTtcclxuXHJcbiAgICAgIC8vIHJlc2V0IGRhdGUgZmlsdGVyIGFuZCBhc3NvY2lhdGVkIGdsb2JhbCB2YXJpYWJsZXNcclxuICAgICAgZGF0ZUZpbHRlci5jbGVhckRhdGVGaWx0ZXIoKTtcclxuXHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIGJhbGwgc3BlZWQgYnV0dG9uXHJcbiAgICBiYWxsU3BlZWRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmJhbGxTcGVlZE1heCk7XHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGRhdGVSYW5nZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5vcGVuRGF0ZUZpbHRlcik7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGVhdG1hcHMiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5pbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbG9naW5PclNpZ251cCA9IHtcclxuXHJcbiAgbG9naW5Gb3JtKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgYSBsb2dpbiBmb3JtIHRoYXQgdmFsaWRhdGVzIHVzZXIgaW5wdXQuIFN1Y2Nlc3NmdWwgbG9naW4gc3RvcmVzIHVzZXIgaWQgaW4gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJsb2dpbk5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luIG5vd1wiKTtcclxuICAgIGNvbnN0IGxvZ2luQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zIGlzLWNlbnRlcmVkXCIgfSwgbnVsbCwgbG9naW5CdXR0b24pXHJcblxyXG4gICAgLy8gcGFzc3dvcmQgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBsb2dpblBhc3N3b3JkSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWxvY2tcIiB9KVxyXG4gICAgY29uc3QgbG9naW5QYXNzd29yZEljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIGxvZ2luUGFzc3dvcmRJY29uKVxyXG4gICAgY29uc3QgbG9naW5JbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInBhc3N3b3JkXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBwYXNzd29yZFwiIH0pO1xyXG5cclxuICAgIGNvbnN0IGxvZ2luUGFzc3dvcmRDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBsb2dpbklucHV0X3Bhc3N3b3JkLCBsb2dpblBhc3N3b3JkSWNvbkRpdilcclxuICAgIGNvbnN0IGxvZ2luUGFzc3dvcmRMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJQYXNzd29yZFwiKVxyXG4gICAgY29uc3QgbG9naW5QYXNzd29yZEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgbG9naW5QYXNzd29yZExhYmVsLCBsb2dpblBhc3N3b3JkQ29udHJvbClcclxuXHJcbiAgICAvLyB1c2VybmFtZSBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IGxvZ2luVXNlcm5hbWVJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtdXNlclwiIH0pXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgbG9naW5Vc2VybmFtZUljb24pXHJcbiAgICBjb25zdCBsb2dpbklucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgbG9naW5JbnB1dF91c2VybmFtZSwgbG9naW5Vc2VybmFtZUljb25EaXYpXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiVXNlcm5hbWVcIilcclxuICAgIGNvbnN0IGxvZ2luVXNlcm5hbWVGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIGxvZ2luVXNlcm5hbWVMYWJlbCwgbG9naW5Vc2VybmFtZUNvbnRyb2wpXHJcblxyXG4gICAgLy8gZm9ybVxyXG4gICAgY29uc3QgbG9naW5Gb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJsb2dpbkZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiLCBcInN0eWxlXCI6IFwibWFyZ2luLXRvcDotNTdweDsgbWluLXdpZHRoOjIwJVwiIH0sIG51bGwsIGxvZ2luVXNlcm5hbWVGaWVsZCwgbG9naW5QYXNzd29yZEZpZWxkLCBsb2dpbkJ0bkNvbnRyb2wpO1xyXG5cclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIC8vIHNldCBzdHlsZSBvZiBtYXN0ZXIgY29udGFpbmVyIHRvIGRpc3BsYXkgZmxleCB0byBhbGlnbiBmb3JtcyBpbiBjZW50ZXIgb2YgY29udGFpbmVyXHJcbiAgICB3ZWJwYWdlLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSBcImNlbnRlclwiO1xyXG4gICAgd2VicGFnZS5zdHlsZS5hbGlnbkl0ZW1zID0gXCJjZW50ZXJcIjtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQobG9naW5Gb3JtKTtcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIHNpZ251cEZvcm0oKSB7XHJcbiAgICBjb25zdCBzaWdudXBCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2lnbnVwTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cCBub3dcIik7XHJcbiAgICBjb25zdCBzaWdudXBCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnMgaXMtY2VudGVyZWRcIiB9LCBudWxsLCBzaWdudXBCdXR0b24pXHJcblxyXG4gICAgLy8gbmFtZSBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IHNpZ251cE5hbWVJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtcGVuY2lsLWFsdFwiIH0pXHJcbiAgICBjb25zdCBzaWdudXBOYW1lSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwTmFtZUljb24pXHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9uYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBuYW1lXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwTmFtZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X25hbWUsIHNpZ251cE5hbWVJY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwTmFtZUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIk5hbWVcIilcclxuICAgIGNvbnN0IHNpZ251cE5hbWVGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIHNpZ251cE5hbWVMYWJlbCwgc2lnbnVwTmFtZUNvbnRyb2wpXHJcblxyXG4gICAgLy8gdXNlcm5hbWUgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBzaWdudXBVc2VybmFtZUljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS11c2VyXCIgfSlcclxuICAgIGNvbnN0IHNpZ251cFVzZXJuYW1lSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwVXNlcm5hbWVJY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ1c2VybmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciB1c2VybmFtZVwiLCBcIm1heGxlbmd0aFwiOiBcIjIwXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwVXNlcm5hbWVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzaWdudXBJbnB1dF91c2VybmFtZSwgc2lnbnVwVXNlcm5hbWVJY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwVXNlcm5hbWVMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJVc2VybmFtZVwiKVxyXG4gICAgY29uc3Qgc2lnbnVwVXNlcm5hbWVGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIHNpZ251cFVzZXJuYW1lTGFiZWwsIHNpZ251cFVzZXJuYW1lQ29udHJvbClcclxuXHJcbiAgICAvLyBlbWFpbCBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IHNpZ251cEVtYWlsSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWF0XCIgfSlcclxuICAgIGNvbnN0IHNpZ251cEVtYWlsSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwRW1haWxJY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfZW1haWwgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJlbWFpbElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJlbWFpbFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgZW1haWxcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X2VtYWlsLCBzaWdudXBFbWFpbEljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbExhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkVtYWlsXCIpXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgc2lnbnVwRW1haWxMYWJlbCwgc2lnbnVwRW1haWxDb250cm9sKVxyXG5cclxuICAgIC8vIHBhc3N3b3JkIGlucHV0IHdpdGggaWNvblxyXG4gICAgY29uc3Qgc2lnbnVwUGFzc3dvcmRJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtbG9ja1wiIH0pXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZEljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cFBhc3N3b3JkSWNvbilcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X3Bhc3N3b3JkLCBzaWdudXBQYXNzd29yZEljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZExhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIlBhc3N3b3JkXCIpXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgc2lnbnVwUGFzc3dvcmRMYWJlbCwgc2lnbnVwUGFzc3dvcmRDb250cm9sKVxyXG5cclxuICAgIC8vIGNvbmZpcm0gcGFzc3dvcmQgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBzaWdudXBDb25maXJtSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWxvY2tcIiB9KVxyXG4gICAgY29uc3Qgc2lnbnVwQ29uZmlybUljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cENvbmZpcm1JY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfY29uZmlybSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImNvbmZpcm1QYXNzd29yZFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZW1haWxcIiwgXCJwbGFjZWhvbGRlclwiOiBcImNvbmZpcm0gcGFzc3dvcmRcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBDb25maXJtQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwSW5wdXRfY29uZmlybSwgc2lnbnVwQ29uZmlybUljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBDb25maXJtTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiQ29uZmlybSBQYXNzd29yZFwiKVxyXG4gICAgY29uc3Qgc2lnbnVwQ29uZmlybUZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgc2lnbnVwQ29uZmlybUxhYmVsLCBzaWdudXBDb25maXJtQ29udHJvbClcclxuXHJcbiAgICAvLyBwcm9maWxlIHBpYyBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IHNpZ251cFByb2ZpbGVQaWNJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtaW1hZ2VcIiB9KVxyXG4gICAgY29uc3Qgc2lnbnVwUHJvZmlsZVBpY0ljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cFByb2ZpbGVQaWNJY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfcHJvZmlsZVBpYyA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInByb2ZpbGVQaWNVUkxcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImVtYWlsXCIsIFwicGxhY2Vob2xkZXJcIjogXCJwcm92aWRlIGEgVVJMIChvcHRpb25hbClcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBQcm9maWxlUGljQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwSW5wdXRfcHJvZmlsZVBpYywgc2lnbnVwUHJvZmlsZVBpY0ljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBQcm9maWxlUGljTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiUHJvZmlsZSBQaWN0dXJlXCIpXHJcbiAgICBjb25zdCBzaWdudXBQcm9maWxlUGljRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGRcIiB9LCBudWxsLCBzaWdudXBQcm9maWxlUGljTGFiZWwsIHNpZ251cFByb2ZpbGVQaWNDb250cm9sKVxyXG5cclxuICAgIC8vIGNhciB0eXBlIHNlbGVjdFxyXG4gICAgY29uc3Qgc2VsX2ljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1jYXJcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IHNlbF9pY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgc2VsX2ljb24pO1xyXG4gICAgY29uc3Qgc2VsMV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT2N0YW5lXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiRG9taW51cyBHVFwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJyZWFrb3V0IFR5cGUgU1wiKTtcclxuICAgIGNvbnN0IHNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJ1c2VyQ2FyXCIgfSwgbnVsbCwgc2VsMV9vcDEsIHNlbDFfb3AyLCBzZWwxX29wMyk7XHJcbiAgICBjb25zdCBzZWxfRGl2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy13aGl0ZS10ZXJcIiB9LCBudWxsLCBzZWxlY3QsIHNlbF9pY29uU3Bhbik7XHJcbiAgICBjb25zdCBzZWxfY29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsX0Rpdik7XHJcbiAgICBjb25zdCBjb250cm9sTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiQ2hvb3NlIFlvdXIgQ2FyXCIpXHJcblxyXG4gICAgY29uc3QgY2FyU2VsZWN0RmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGRcIiB9LCBudWxsLCBjb250cm9sTGFiZWwsIHNlbF9jb250cm9sKTtcclxuXHJcbiAgICAvLyBmb3JtXHJcbiAgICBjb25zdCBzaWdudXBGb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJzaWdudXBGb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiwgXCJzdHlsZVwiOiBcIm1pbi13aWR0aDoyMCVcIiB9LCBudWxsLCBzaWdudXBOYW1lRmllbGQsIHNpZ251cFVzZXJuYW1lRmllbGQsIHNpZ251cEVtYWlsRmllbGQsIHNpZ251cFBhc3N3b3JkRmllbGQsIHNpZ251cENvbmZpcm1GaWVsZCwgc2lnbnVwUHJvZmlsZVBpY0ZpZWxkLCBjYXJTZWxlY3RGaWVsZCwgc2lnbnVwQnRuQ29udHJvbCk7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gXCJjZW50ZXJcIjtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuYWxpZ25JdGVtcyA9IFwiY2VudGVyXCI7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHNpZ251cEZvcm0pO1xyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gYXNzaWduIGV2ZW50IGxpc3RlbmVycyBiYXNlZCBvbiB3aGljaCBmb3JtIGlzIG9uIHRoZSB3ZWJwYWdlXHJcbiAgdXNlckV2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGxvZ2luTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2dpbk5vd1wiKVxyXG4gICAgY29uc3Qgc2lnbnVwTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaWdudXBOb3dcIilcclxuICAgIGlmIChsb2dpbk5vdyA9PT0gbnVsbCkge1xyXG4gICAgICBzaWdudXBOb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2lnbnVwVXNlciwgZXZlbnQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2dpbk5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpblVzZXIsIGV2ZW50KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ2luVXNlcihlKSB7XHJcbiAgICAvLyB2YWxpZGF0ZSB1c2VyIGxvZ2luIGZvcm0gaW5wdXRzIGJlZm9yZSBsb2dnaW5nIGluXHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKGB1c2Vycz91c2VybmFtZT0ke3VzZXJuYW1lLnRvTG93ZXJDYXNlKCl9YCkudGhlbih1c2VyID0+IHtcclxuICAgICAgICAvLyB2YWxpZGF0ZSB1c2VybmFtZSBhbmQgcGFzc3dvcmRcclxuICAgICAgICBjb25zb2xlLmxvZyh1c2VyLmxlbmd0aClcclxuICAgICAgICBpZiAodXNlci5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGlmICh1c2VyWzBdLnBhc3N3b3JkID09PSBwYXNzd29yZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBhc3N3b3JkIGNoZWNrXCIpXHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlclswXSlcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiVXNlcm5hbWUgb3IgcGFzc3dvcmQgaXMgaW5jb3JyZWN0LlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGFsZXJ0KFwiVXNlcm5hbWUgb3IgcGFzc3dvcmQgaXMgaW5jb3JyZWN0LlwiKTtcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCBfbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfdXNlcm5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF9wYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFzc3dvcmRJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX2NvbmZpcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbmZpcm1QYXNzd29yZFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX2VtYWlsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbWFpbElucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfcGljdHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZmlsZVBpY1VSTFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX2NhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlckNhclwiKS52YWx1ZVxyXG4gICAgaWYgKF9uYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfdXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX2VtYWlsID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfY29uZmlybSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkICE9PSBfY29uZmlybSkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5nZXRBbGwoYHVzZXJzP3VzZXJuYW1lPSR7X3VzZXJuYW1lLnRvTG93ZXJDYXNlKCl9YCkudGhlbih1c2VyID0+IHtcclxuICAgICAgICAvLyBjaGVjayBmb3IgZXhpc3RpbmcgdXNlcm5hbWUgaW4gZGF0YWJhc2UuIExlbmd0aCA9IDEgaWYgdXNlcm5hbWUgaXMgbm90IHVuaXF1ZVxyXG4gICAgICAgIGlmICh1c2VyLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgYWxlcnQoXCJ0aGlzIHVzZXJuYW1lIGFscmVhZHkgZXhpc3RzXCIpO1xyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vcG9zdCB0aGUgbmV3IHVzZXIgaWYgdXNlcm5hbWUgaXMgdW5pcXVlXHJcbiAgICAgICAgICBsZXQgbmV3VXNlciA9IHtcclxuICAgICAgICAgICAgbmFtZTogX25hbWUsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiBfdXNlcm5hbWUudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgZW1haWw6IF9lbWFpbC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogX3Bhc3N3b3JkLFxyXG4gICAgICAgICAgICBqb2luZWQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgIGNhcjogX2NhcixcclxuICAgICAgICAgICAgcGljdHVyZTogX3BpY3R1cmUsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBBUEkucG9zdEl0ZW0oXCJ1c2Vyc1wiLCBuZXdVc2VyKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9naW5TdGF0dXNBY3RpdmUodXNlcikge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiLCB1c2VyLmlkKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKTsgLy9idWlsZCBsb2dnZWQgaW4gdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9LFxyXG5cclxuICBsb2dvdXRVc2VyKCkge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcihmYWxzZSk7IC8vYnVpbGQgbG9nZ2VkIG91dCB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvZ2luT3JTaWdudXAiLCJpbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5uYXZiYXIuZ2VuZXJhdGVOYXZiYXIoKTsiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGxvZ2luT3JTaWdudXAgZnJvbSBcIi4vbG9naW5cIlxyXG5pbXBvcnQgcHJvZmlsZSBmcm9tIFwiLi9wcm9maWxlXCJcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuaW1wb3J0IGhlYXRtYXBzIGZyb20gXCIuL2hlYXRtYXBzXCJcclxuaW1wb3J0IGhlYXRtYXBEYXRhIGZyb20gXCIuL2hlYXRtYXBEYXRhXCJcclxuXHJcbi8qXHJcbiAgQnVsbWEgbmF2YmFyIHN0cnVjdHVyZTpcclxuICA8bmF2PlxyXG4gICAgPG5hdmJhci1icmFuZD5cclxuICAgICAgPG5hdmJhci1idXJnZXI+IChvcHRpb25hbClcclxuICAgIDwvbmF2YmFyLWJyYW5kPlxyXG4gICAgPG5hdmJhci1tZW51PlxyXG4gICAgICA8bmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8L25hdmJhci1zdGFydD5cclxuICAgICAgPG5hdmJhci1lbmQ+XHJcbiAgICAgIDwvbmF2YmFyLWVuZD5cclxuICAgIDwvbmF2YmFyLW1lbnU+XHJcbiAgPC9uYXY+XHJcbiovXHJcblxyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbmF2YmFyID0ge1xyXG5cclxuICBnZW5lcmF0ZU5hdmJhcihsb2dnZWRJbkJvb2xlYW4pIHtcclxuXHJcbiAgICAvLyBuYXZiYXItbWVudSAocmlnaHQgc2lkZSBvZiBuYXZiYXIgLSBhcHBlYXJzIG9uIGRlc2t0b3AgMTAyNHB4KylcclxuICAgIGNvbnN0IGJ1dHRvbjIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpblwiKVxyXG4gICAgY29uc3QgYnV0dG9uMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXBcIilcclxuICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgYnV0dG9uMSwgYnV0dG9uMilcclxuICAgIGNvbnN0IG1lbnVJdGVtMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIG51bGwsIGJ1dHRvbkNvbnRhaW5lcilcclxuICAgIGNvbnN0IG5hdmJhckVuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItZW5kXCIgfSwgbnVsbCwgbWVudUl0ZW0xKVxyXG4gICAgY29uc3QgbmF2YmFyU3RhcnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLXN0YXJ0XCIgfSlcclxuICAgIGNvbnN0IG5hdmJhck1lbnUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibmF2YmFyTWVudVwiLCBcImNsYXNzXCI6IFwibmF2YmFyLW1lbnVcIiB9LCBudWxsLCBuYXZiYXJTdGFydCwgbmF2YmFyRW5kKVxyXG5cclxuICAgIC8vIG5hdmJhci1icmFuZCAobGVmdCBzaWRlIG9mIG5hdmJhciAtIGluY2x1ZGVzIG1vYmlsZSBoYW1idXJnZXIgbWVudSlcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQyID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwicm9sZVwiOiBcImJ1dHRvblwiLCBcImNsYXNzXCI6IFwibmF2YmFyLWJ1cmdlciBidXJnZXJcIiwgXCJhcmlhLWxhYmVsXCI6IFwibWVudVwiLCBcImFyaWEtZXhwYW5kZWRcIjogXCJmYWxzZVwiLCBcImRhdGEtdGFyZ2V0XCI6IFwibmF2YmFyTWVudVwiIH0sIG51bGwsIGJ1cmdlck1lbnVTcGFuMSwgYnVyZ2VyTWVudVNwYW4yLCBidXJnZXJNZW51U3BhbjMpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIsIFwiaHJlZlwiOiBcIiNcIiB9LCBudWxsLCBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9maXJlOTBkZWcucG5nXCIsIFwid2lkdGhcIjogXCIxMTJcIiwgXCJoZWlnaHRcIjogXCIyOFwiIH0pKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1icmFuZFwiIH0sIG51bGwsIG5hdmJhckJyYW5kQ2hpbGQxLCBuYXZiYXJCcmFuZENoaWxkMik7XHJcblxyXG4gICAgLy8gbmF2IChwYXJlbnQgbmF2IEhUTUwgZWxlbWVudClcclxuICAgIGNvbnN0IG5hdiA9IGVsQnVpbGRlcihcIm5hdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXJcIiwgXCJyb2xlXCI6IFwibmF2aWdhdGlvblwiLCBcImFyaWEtbGFiZWxcIjogXCJtYWluIG5hdmlnYXRpb25cIiB9LCBudWxsLCBuYXZiYXJCcmFuZCwgbmF2YmFyTWVudSk7XHJcblxyXG4gICAgLy8gaWYgbG9nZ2VkIGluLCBhcHBlbmQgYWRkaXRpb25hbCBtZW51IG9wdGlvbnMgdG8gbmF2YmFyIGFuZCByZW1vdmUgc2lnbnVwL2xvZ2luIGJ1dHRvbnNcclxuICAgIGlmIChsb2dnZWRJbkJvb2xlYW4pIHtcclxuICAgICAgLy8gcmVtb3ZlIGxvZyBpbiBhbmQgc2lnbiB1cCBidXR0b25zXHJcbiAgICAgIGNvbnN0IHNpZ251cCA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdO1xyXG4gICAgICBjb25zdCBsb2dpbiA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzFdO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQoc2lnbnVwKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvZ2luKTtcclxuICAgICAgLy8gYWRkIGxvZ291dCBidXR0b25cclxuICAgICAgY29uc3QgYnV0dG9uMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ291dFwiKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbjMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgbmV3IG1lbnUgaXRlbXMgZm9yIHVzZXJcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkhvbWVcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJQcm9maWxlXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiR2FtZXBsYXlcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTQgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJIZWF0bWFwc1wiKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMSk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTIpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0zKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtNCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBuYXZiYXJcclxuICAgIHRoaXMubmF2YmFyRXZlbnRNYW5hZ2VyKG5hdik7XHJcblxyXG4gICAgLy8gYXBwZW5kIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2VOYXYuYXBwZW5kQ2hpbGQobmF2KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgbmF2YmFyRXZlbnRNYW5hZ2VyKG5hdikge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBhZGRzIGEgc2luZ2xlIGNsaWNrIGxpc3RlbmVyIHRvIHRoZSBuYXYgdGhhdCByZWRpcmVjdHMgdGhlIHVzZXIgdG8gdGhlIGNvcnJlY3QgcGFnZVxyXG4gICAgLy8gYmFzZWQgb24gdGhlIHRleHQgY29udGVudCBvZiB0aGUgdGFyZ2V0XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9naW5cIikge1xyXG4gICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5Gb3JtKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJTaWduIHVwXCIpIHtcclxuICAgICAgICBsb2dpbk9yU2lnbnVwLnNpZ251cEZvcm0oKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ291dFwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuY2xlYXJIZWF0bWFwUmVwYWludEludGVydmFsKCk7XHJcbiAgICAgICAgbG9naW5PclNpZ251cC5sb2dvdXRVc2VyKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJQcm9maWxlXCIpIHtcclxuICAgICAgICBoZWF0bWFwRGF0YS5jbGVhckhlYXRtYXBSZXBhaW50SW50ZXJ2YWwoKTtcclxuICAgICAgICBwcm9maWxlLmxvYWRQcm9maWxlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJHYW1lcGxheVwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuY2xlYXJIZWF0bWFwUmVwYWludEludGVydmFsKCk7XHJcbiAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJIZWF0bWFwc1wiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuY2xlYXJIZWF0bWFwUmVwYWludEludGVydmFsKCk7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuaGFuZGxlQmFsbFNwZWVkR2xvYmFsVmFyaWFibGVzKCk7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgICAgIGhlYXRtYXBzLmxvYWRIZWF0bWFwQ29udGFpbmVycygpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuYXZiYXIiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxubGV0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4vLyBnbG9iYWwgdmFyaWFibGUgdXNlZCB0byBjb3VudCB0b3RhbCBnYW1lcyBhbmQgc2hvdHNcclxubGV0IGdhbWVJZHMgPSBbXTtcclxuXHJcbmNvbnN0IHByb2ZpbGUgPSB7XHJcblxyXG4gIGxvYWRQcm9maWxlKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIC8vIGdldCB1c2VyLCB0aGVuIHB1c2ggYWxsIHVuaXF1ZSBnYW1lIElEcyB0byBhcnJheSwgdGhlbiBmZXRjaCBhbGwgc2hvdHMgYXNzb2NpYXRlZCB3aXRoIGdhbWUgSWRzXHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGFjdGl2ZVVzZXJJZCkudGhlbih1c2VyID0+IHtcclxuICAgICAgQVBJLmdldEFsbChgZ2FtZXM/dXNlcklkPSR7dXNlci5pZH1gKS50aGVuKGdhbWVzID0+IHtcclxuICAgICAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGdhbWVJZHMpO1xyXG4gICAgICB9KVxyXG4gICAgICAgIC50aGVuKGdhbWVJZHMgPT4ge1xyXG4gICAgICAgICAgaWYgKGdhbWVJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIGNhbGwgbmV4dCBmdW5jdGlvbiBpbiBjaGFpbiBvZiBmdW5jdGlvbnMgdG8gZ2V0IHBsYXlzdHlsZVxyXG4gICAgICAgICAgICBsZXQgc2hvdHMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5kZXRlcm1pbmVQbGF5c3R5bGUodXNlciwgc2hvdHMsIGdhbWVJZHMpO1xyXG4gICAgICAgICAgICBnYW1lSWRzID0gW107XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IFVSTCA9IFwic2hvdHNcIjtcclxuICAgICAgICAgICAgZ2FtZUlkcy5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgICAgICAgICBpZiAoVVJMID09PSBcInNob3RzXCIpIHtcclxuICAgICAgICAgICAgICAgIFVSTCArPSBgP2dhbWVJZD0ke2lkfWBcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgVVJMICs9IGAmZ2FtZUlkPSR7aWR9YFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIEFQSS5nZXRBbGwoVVJMKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pLnRoZW4oc2hvdHMgPT4ge1xyXG4gICAgICAgICAgLy8gY2FsbCBuZXh0IGZ1bmN0aW9uIGluIGNoYWluIG9mIGZ1bmN0aW9ucyB0byBnZXQgcGxheXN0eWxlXHJcbiAgICAgICAgICB0aGlzLmRldGVybWluZVBsYXlzdHlsZSh1c2VyLCBzaG90cywgZ2FtZUlkcyk7XHJcbiAgICAgICAgICBnYW1lSWRzID0gW107XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcblxyXG4gIH0sXHJcblxyXG4gIGRldGVybWluZVBsYXlzdHlsZSh1c2VyLCBzaG90cywgZ2FtZUlkcykge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB1c2VzIGF2ZyBmaWVsZCBjb29yZGluYXRlcyB0byBsYWJlbCB0aGUgdXNlcidzIHBsYXlzdHlsZSBmb3IgdGhlaXIgcHJvZmlsZSBwYWdlXHJcblxyXG4gICAgLy8gaWYgdXNlciBoYXNuJ3Qgc2F2ZWQgYW55IGdhbWVzLCBwYXNzIGNvcnJlY3QgaW5mb3JtYXRpb24gdG8gYnVpbGQgZnVuY3Rpb25cclxuICAgIGlmIChnYW1lSWRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5idWlsZFByb2ZpbGUodXNlciwgc2hvdHMsIGdhbWVJZHMsIFwidW5rbm93biBwb3NpdGlvblwiKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBzdW1YID0gMDtcclxuICAgIGxldCBzdW1ZID0gMDtcclxuICAgIGxldCBhdmdYO1xyXG4gICAgbGV0IGF2Z1k7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc3VtWCArPSBzaG90LmZpZWxkWDtcclxuICAgICAgc3VtWSArPSBzaG90LmZpZWxkWTtcclxuICAgIH0pXHJcblxyXG4gICAgYXZnWCA9IHN1bVggLyBzaG90cy5sZW5ndGg7XHJcbiAgICBhdmdZID0gc3VtWSAvIHNob3RzLmxlbmd0aDtcclxuICAgIGxldCBmaWVsZFBvc2l0aW9uO1xyXG5cclxuICAgIGlmIChhdmdYIDwgMC4xNSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJrZWVwZXJcIlxyXG4gICAgfSBlbHNlIGlmICgwLjE1IDw9IGF2Z1ggJiYgYXZnWCA8PSAwLjMwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcInN3ZWVwZXJcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNDUgJiYgYXZnWSA8PSAwLjQwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcImxlZnQgZnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNDUgJiYgMC42MCA8PSBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcInJpZ2h0IGZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPD0gMC40NSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJjZW50ZXIgZnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8IDAuNjAgJiYgYXZnWSA8PSAwLjQwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcImxlZnQgaGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8IDAuNjAgJiYgMC42MCA8PSBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcInJpZ2h0IGhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPD0gMC42MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJjZW50ZXIgaGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjYwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNzUgJiYgYXZnWSA8PSAwLjUwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcImxlZnQgZm9yd2FyZFwiXHJcbiAgICB9IGVsc2UgaWYgKDAuNjAgPD0gYXZnWCAmJiBhdmdYIDwgMC43NSAmJiAwLjUwIDwgYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJyaWdodCBmb3J3YXJkXCJcclxuICAgIH0gZWxzZSBpZiAoMC43NSA8PSBhdmdYKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcInN0cmlrZXJcIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNhbGwgZnVuY3Rpb24gdG8gbG9hZCBjb250YWluZXJzIHVzaW5nIGFsbCBmZXRjaGVkIGluZm9ybWF0aW9uXHJcbiAgICB0aGlzLmJ1aWxkUHJvZmlsZSh1c2VyLCBzaG90cywgZ2FtZUlkcywgZmllbGRQb3NpdGlvbik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRQcm9maWxlKHVzZXIsIHNob3RzLCBnYW1lSWRzLCBmaWVsZFBvc2l0aW9uKSB7XHJcblxyXG4gICAgLy8gbWVkaWEgY29udGFpbmVycyBzaG93aW5nIHVzZXIgc3RhdHMgKGFwcGVuZGVkIHRvIGNhcmQgY29udGFpbmVyKVxyXG4gICAgY29uc3QgcGxheXN0eWxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTNcIiB9LCBgUGxheXMgJHtmaWVsZFBvc2l0aW9ufWApXHJcbiAgICBjb25zdCBwbGF5c3R5bGVDb250ZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRlbnRcIiB9LCBudWxsLCBwbGF5c3R5bGUpXHJcbiAgICBjb25zdCBwbGF5c3R5bGVDb250ZW50UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhLWNvbnRlbnRcIiB9LCBudWxsLCBwbGF5c3R5bGVDb250ZW50KVxyXG4gICAgY29uc3QgaWNvbjMgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9pY29ucy9pY29uczgtc3RhZGl1bS05Ni5wbmdcIiB9LCBudWxsKVxyXG4gICAgY29uc3QgaWNvblBhcmVudDMgPSBlbEJ1aWxkZXIoXCJmaWd1cmVcIiwgeyBcImNsYXNzXCI6IFwiaW1hZ2UgaXMtNDh4NDhcIiB9LCBudWxsLCBpY29uMylcclxuICAgIGNvbnN0IGxlZnQzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhLWxlZnRcIiB9LCBudWxsLCBpY29uUGFyZW50Myk7XHJcbiAgICBjb25zdCB1c2VyUGxheXN0eWxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhIGlzLW1hcmdpbmxlc3NcIiwgXCJzdHlsZVwiOiBcInBhZGRpbmc6MjBweDtcIiB9LCBudWxsLCBsZWZ0MywgcGxheXN0eWxlQ29udGVudFBhcmVudClcclxuXHJcbiAgICBjb25zdCBnYW1lU3RhdHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtMlwiIH0sIGAke2dhbWVJZHMubGVuZ3RofSBnYW1lc2ApXHJcbiAgICBjb25zdCBnYW1lQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250ZW50XCIgfSwgbnVsbCwgZ2FtZVN0YXRzKVxyXG4gICAgY29uc3QgZ2FtZUNvbnRlbnRQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibWVkaWEtY29udGVudFwiIH0sIG51bGwsIGdhbWVDb250ZW50KVxyXG4gICAgY29uc3QgaWNvbjIgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9pY29ucy9pY29uczgtZ2FtZS1jb250cm9sbGVyLTEwMC5wbmdcIiB9LCBudWxsKVxyXG4gICAgY29uc3QgaWNvblBhcmVudDIgPSBlbEJ1aWxkZXIoXCJmaWd1cmVcIiwgeyBcImNsYXNzXCI6IFwiaW1hZ2UgaXMtNDh4NDhcIiB9LCBudWxsLCBpY29uMilcclxuICAgIGNvbnN0IGxlZnQyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhLWxlZnRcIiB9LCBudWxsLCBpY29uUGFyZW50Mik7XHJcbiAgICBjb25zdCB0b3RhbEdhbWVzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhIGlzLW1hcmdpbmxlc3NcIiwgXCJzdHlsZVwiOiBcInBhZGRpbmc6MjBweDtcIiB9LCBudWxsLCBsZWZ0MiwgZ2FtZUNvbnRlbnRQYXJlbnQpXHJcblxyXG4gICAgY29uc3QgZ29hbFN0YXRzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTJcIiB9LCBgJHtzaG90cy5sZW5ndGh9IGdvYWxzYClcclxuICAgIGNvbnN0IGdvYWxDb250ZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRlbnRcIiB9LCBudWxsLCBnb2FsU3RhdHMpXHJcbiAgICBjb25zdCBnb2FsQ29udGVudFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1jb250ZW50XCIgfSwgbnVsbCwgZ29hbENvbnRlbnQpXHJcbiAgICBjb25zdCBpY29uMSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL2ljb25zL2ljb25zOC1zb2NjZXItYmFsbC05Ni5wbmdcIiB9LCBudWxsKVxyXG4gICAgY29uc3QgaWNvblBhcmVudDEgPSBlbEJ1aWxkZXIoXCJmaWd1cmVcIiwgeyBcImNsYXNzXCI6IFwiaW1hZ2UgaXMtNDh4NDhcIiB9LCBudWxsLCBpY29uMSlcclxuICAgIGNvbnN0IGxlZnQxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhLWxlZnRcIiB9LCBudWxsLCBpY29uUGFyZW50MSk7XHJcbiAgICBjb25zdCB0b3RhbEdvYWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhIGlzLW1hcmdpbmxlc3NcIiwgXCJzdHlsZVwiOiBcInBhZGRpbmc6MjBweDtcIiB9LCBudWxsLCBsZWZ0MSwgZ29hbENvbnRlbnRQYXJlbnQpXHJcblxyXG4gICAgLy8gY2FyZCBjb250YWluZXIgcHJvZmlsZSBwaWN0dXJlLCBjYXIgcGhvdG8sIG5hbWUsIHVzZXJuYW1lLCBhbmQgbWVtYmVyIHNpbmNlIG1tL2RkL3l5eXlcclxuICAgIGxldCBjYXJJbWdWYXJpYWJsZSA9IHVzZXIuY2FyLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBsZXQgcHJvZmlsZUltZ1ZhcmlhYmxlID0gdXNlci5waWN0dXJlO1xyXG4gICAgbGV0IHByb2ZpbGVJbWdUaXRsZSA9IHVzZXIucGljdHVyZTtcclxuICAgIGlmICh1c2VyLnBpY3R1cmUgPT09IFwiXCIpIHtcclxuICAgICAgcHJvZmlsZUltZ1ZhcmlhYmxlID0gXCJpbWFnZXMvcHJvZmlsZS1wbGFjZWhvbGRlci5qcGdcIlxyXG4gICAgICBwcm9maWxlSW1nVGl0bGUgPSBcInByb2ZpbGUtcGxhY2Vob2xkZXIuanBnXCJcclxuICAgIH1cclxuICAgIGxldCBtZW1iZXJTaW5jZURhdGVGb3JtYXR0ZWQgPSBuZXcgRGF0ZSh1c2VyLmpvaW5lZCkudG9Mb2NhbGVTdHJpbmcoKS5zcGxpdChcIixcIilbMF07XHJcblxyXG4gICAgY29uc3QgbWVtYmVyU2luY2UgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic3VidGl0bGUgaXMtNlwiLCBcInN0eWxlXCI6IFwibWFyZ2luLXRvcDoxMHB4XCIgfSwgYEJlY2FtZSBhIGhvdHNob3Qgb24gJHttZW1iZXJTaW5jZURhdGVGb3JtYXR0ZWR9YClcclxuICAgIGNvbnN0IHVzZXJuYW1lID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInRhZ1wiIH0sIGBAJHt1c2VyLnVzZXJuYW1lfWApO1xyXG4gICAgY29uc3QgbmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy00IGlzLW1hcmdpbmxlc3NcIiB9LCBgJHt1c2VyLm5hbWV9YCk7XHJcbiAgICBjb25zdCB1c2VySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1jb250ZW50XCIgfSwgbnVsbCwgbmFtZSwgdXNlcm5hbWUsIG1lbWJlclNpbmNlKTtcclxuICAgIGNvbnN0IGNhckltZyA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IGBpbWFnZXMvY2Fycy8ke2NhckltZ1ZhcmlhYmxlfS5wbmdgLCBcImFsdFwiOiBcImNhclwiLCBcInRpdGxlXCI6IGAke2NhckltZ1ZhcmlhYmxlfWAgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBjYXJJbWdGaWd1cmUgPSBlbEJ1aWxkZXIoXCJmaWd1cmVcIiwgeyBcImNsYXNzXCI6IFwiaW1hZ2UgaXMtOTZ4OTZcIiB9LCBudWxsLCBjYXJJbWcpO1xyXG4gICAgY29uc3QgY2FySW1nUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhLWxlZnRcIiB9LCBudWxsLCBjYXJJbWdGaWd1cmUpO1xyXG4gICAgY29uc3QgbWVkaWEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibWVkaWFcIiB9LCBudWxsLCBjYXJJbWdQYXJlbnQsIHVzZXJJbmZvKTtcclxuICAgIGNvbnN0IGNvbnRlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY2FyZC1jb250ZW50XCIgfSwgbnVsbCwgbWVkaWEpO1xyXG4gICAgLy8gbWFpbiBwcm9maWxlIHBpY3R1cmVcclxuICAgIGNvbnN0IEltZyA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IGAke3Byb2ZpbGVJbWdWYXJpYWJsZX1gLCBcImFsdFwiOiBcInByb2ZpbGUgcGljdHVyZVwiLCBcInRpdGxlXCI6IGAke3Byb2ZpbGVJbWdUaXRsZX1gIH0pO1xyXG4gICAgY29uc3QgZmlndXJlID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlXCIgfSwgbnVsbCwgSW1nKTtcclxuICAgIGNvbnN0IHByb2ZpbGVQaWN0dXJlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNhcmQtaW1hZ2VcIiB9LCBudWxsLCBmaWd1cmUpO1xyXG4gICAgY29uc3QgY2FyZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjYXJkXCIgfSwgbnVsbCwgcHJvZmlsZVBpY3R1cmUsIGNvbnRlbnQsIHRvdGFsR29hbHMsIHRvdGFsR2FtZXMsIHVzZXJQbGF5c3R5bGUpO1xyXG5cclxuICAgIC8vIHBhcmVudCBjb250YWluZXJzIHRoYXQgb3JnYW5pemUgcHJvZmlsZSBpbmZvcm1hdGlvbiBpbnRvIGNvbHVtbnNcclxuICAgIGNvbnN0IGJsYW5rQ29sdW1uTGVmdCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLWZvdXJ0aFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgcHJvZmlsZUNvbHVtbiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtaGFsZlwiIH0sIG51bGwsIGNhcmQpO1xyXG4gICAgY29uc3QgYmxhbmtDb2x1bW5SaWdodCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLWZvdXJ0aFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgY29sdW1ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW5zIGlzLXZjZW50ZXJlZFwiIH0sIG51bGwsIGJsYW5rQ29sdW1uTGVmdCwgcHJvZmlsZUNvbHVtbiwgYmxhbmtDb2x1bW5SaWdodCk7XHJcbiAgICBjb25zdCBwbGF5ZXJQcm9maWxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcInByb2ZpbGVDb250YWluZXJcIiwgXCJjbGFzc1wiOiBcImNvbnRhaW5lclwiLCBcInN0eWxlXCI6IFwicGFkZGluZzoyMHB4O1wiIH0sIG51bGwsIGNvbHVtbnMpO1xyXG5cclxuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHBsYXllclByb2ZpbGUpO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChmcmFnbWVudCk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJvZmlsZSIsImNsYXNzIHNob3RPbkdvYWwge1xyXG4gIHNldCBmaWVsZFgoZmllbGRYKSB7XHJcbiAgICB0aGlzLl9maWVsZFggPSBmaWVsZFhcclxuICB9XHJcbiAgc2V0IGZpZWxkWShmaWVsZFkpIHtcclxuICAgIHRoaXMuX2ZpZWxkWSA9IGZpZWxkWVxyXG4gIH1cclxuICBzZXQgZ29hbFgoZ29hbFgpIHtcclxuICAgIHRoaXMuX2dvYWxYID0gZ29hbFhcclxuICB9XHJcbiAgc2V0IGdvYWxZKGdvYWxZKSB7XHJcbiAgICB0aGlzLl9nb2FsWSA9IGdvYWxZXHJcbiAgfVxyXG4gIHNldCBhZXJpYWwoYWVyaWFsQm9vbGVhbikge1xyXG4gICAgdGhpcy5fYWVyaWFsID0gYWVyaWFsQm9vbGVhblxyXG4gIH1cclxuICBzZXQgYmFsbFNwZWVkKGJhbGxTcGVlZCkge1xyXG4gICAgdGhpcy5iYWxsX3NwZWVkID0gYmFsbFNwZWVkXHJcbiAgfVxyXG4gIHNldCB0aW1lU3RhbXAoZGF0ZU9iaikge1xyXG4gICAgdGhpcy5fdGltZVN0YW1wID0gZGF0ZU9ialxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2hvdE9uR29hbCIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgc2hvdE9uR29hbCBmcm9tIFwiLi9zaG90Q2xhc3NcIlxyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSBcIi4vZ2FtZURhdGFcIjtcclxuXHJcbmxldCBzaG90Q291bnRlciA9IDA7XHJcbmxldCBlZGl0aW5nU2hvdCA9IGZhbHNlOyAvL2VkaXRpbmcgc2hvdCBpcyB1c2VkIGZvciBib3RoIG5ldyBhbmQgb2xkIHNob3RzXHJcbmxldCBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG5sZXQgc2hvdEFycmF5ID0gW107IC8vIHJlc2V0IHdoZW4gZ2FtZSBpcyBzYXZlZFxyXG4vLyBnbG9iYWwgdmFycyB1c2VkIHdpdGggc2hvdCBlZGl0aW5nXHJcbmxldCBwcmV2aW91c1Nob3RPYmo7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFg7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFk7XHJcbmxldCBwcmV2aW91c1Nob3RHb2FsWDtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxZO1xyXG4vLyBnbG9iYWwgdmFyIHVzZWQgd2hlbiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUgKHRvIGRldGVybWluZSBpZiBuZXcgc2hvdHMgd2VyZSBhZGRlZCBmb3IgUE9TVClcclxubGV0IGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuXHJcbmNvbnN0IHNob3REYXRhID0ge1xyXG5cclxuICByZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGdhbWVwbGF5IGlzIGNsaWNrZWQgb24gdGhlIG5hdmJhciBhbmQgd2hlbiBhIGdhbWUgaXMgc2F2ZWQsIGluIG9yZGVyIHRvIHByZXZlbnQgYnVncyB3aXRoIHByZXZpb3VzbHkgY3JlYXRlZCBzaG90c1xyXG4gICAgc2hvdENvdW50ZXIgPSAwO1xyXG4gICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBzaG90QXJyYXkgPSBbXTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSB1bmRlZmluZWQ7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlTmV3U2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgc2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsO1xyXG4gICAgc2hvdE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vIHByZXZlbnQgdXNlciBmcm9tIHNlbGVjdGluZyBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnModHJ1ZSk7XHJcblxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcblxyXG4gICAgLy8gYWN0aXZhdGUgY2xpY2sgZnVuY3Rpb25hbGl0eSBhbmQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBvbiBib3RoIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gIH0sXHJcblxyXG4gIGdldENsaWNrQ29vcmRzKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZ2V0cyB0aGUgcmVsYXRpdmUgeCBhbmQgeSBvZiB0aGUgY2xpY2sgd2l0aGluIHRoZSBmaWVsZCBpbWFnZSBjb250YWluZXJcclxuICAgIC8vIGFuZCB0aGVuIGNhbGxzIHRoZSBmdW5jdGlvbiB0aGF0IGFwcGVuZHMgYSBtYXJrZXIgb24gdGhlIHBhZ2VcclxuICAgIGxldCBwYXJlbnRDb250YWluZXI7XHJcbiAgICBpZiAoZS50YXJnZXQuaWQgPT09IFwiZmllbGQtaW1nXCIpIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICB9XHJcbiAgICAvLyBvZmZzZXRYIGFuZCBZIGFyZSB0aGUgeCBhbmQgeSBjb29yZGluYXRlcyAocGl4ZWxzKSBvZiB0aGUgY2xpY2sgaW4gdGhlIGNvbnRhaW5lclxyXG4gICAgLy8gdGhlIGV4cHJlc3Npb25zIGRpdmlkZSB0aGUgY2xpY2sgeCBhbmQgeSBieSB0aGUgcGFyZW50IGZ1bGwgd2lkdGggYW5kIGhlaWdodFxyXG4gICAgY29uc3QgeENvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WCAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSlcclxuICAgIGNvbnN0IHlDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIC8vIHJlc3RyaWN0IHVzZXIgZnJvbSBzdWJtaXR0aW5nIGEgY2xpY2sgaW4gdGhlIGdvYWwgaWYgeSA8IDAuMjAgb3IgeSA+IDAuODUgb3IgeCA+IDAuOTAgb3IgeCA8IDAuMTBcclxuICAgIGlmIChwYXJlbnRDb250YWluZXIuaWQgPT09IFwiZ29hbC1pbWctcGFyZW50XCIgJiYgeUNvb3JkUmVsYXRpdmUgPCAwLjIwIHx8IHlDb29yZFJlbGF0aXZlID4gMC44NSB8fCB4Q29vcmRSZWxhdGl2ZSA8IDAuMTAgfHwgeENvb3JkUmVsYXRpdmUgPiAwLjkwKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4Q29vcmRSZWxhdGl2ZSwgeUNvb3JkUmVsYXRpdmUsIHBhcmVudENvbnRhaW5lcilcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBtYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcikge1xyXG4gICAgY29uc29sZS5sb2coeCwgeSlcclxuICAgIGxldCBtYXJrZXJJZDtcclxuICAgIGlmIChwYXJlbnRDb250YWluZXIuaWQgPT09IFwiZmllbGQtaW1nLXBhcmVudFwiKSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1maWVsZFwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWdvYWxcIjtcclxuICAgIH1cclxuICAgIC8vIGFkanVzdCBmb3IgNTAlIG9mIHdpZHRoIGFuZCBoZWlnaHQgb2YgbWFya2VyIHNvIGl0J3MgY2VudGVyZWQgYWJvdXQgbW91c2UgcG9pbnRlclxyXG4gICAgbGV0IGFkanVzdE1hcmtlclggPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IGFkanVzdE1hcmtlclkgPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIE5PVCBhbHJlYWR5IGEgbWFya2VyLCB0aGVuIG1ha2Ugb25lIGFuZCBwbGFjZSBpdFxyXG4gICAgaWYgKCFwYXJlbnRDb250YWluZXIuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpKSkge1xyXG4gICAgICB0aGlzLmdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpO1xyXG4gICAgICAvLyBlbHNlIG1vdmUgdGhlIGV4aXN0aW5nIG1hcmtlciB0byB0aGUgbmV3IHBvc2l0aW9uXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpO1xyXG4gICAgfVxyXG4gICAgLy8gc2F2ZSBjb29yZGluYXRlcyB0byBvYmplY3RcclxuICAgIHRoaXMuYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSlcclxuICB9LFxyXG5cclxuICBnZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgZGl2LmlkID0gbWFya2VySWQ7XHJcbiAgICBkaXYuc3R5bGUud2lkdGggPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImZpcmVicmlja1wiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCI1MCVcIjtcclxuICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgIGRpdi5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgZGl2LnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpO1xyXG4gIH0sXHJcblxyXG4gIG1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpIHtcclxuICAgIGNvbnN0IGN1cnJlbnRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCk7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICB9LFxyXG5cclxuICBhZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHVwZGF0ZXMgdGhlIGluc3RhbmNlIG9mIHNob3RPbkdvYWwgY2xhc3MgdG8gcmVjb3JkIGNsaWNrIGNvb3JkaW5hdGVzXHJcbiAgICAvLyBpZiBhIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIGFwcGVuZCB0aGUgY29vcmRpbmF0ZXMgdG8gdGhlIG9iamVjdCBpbiBxdWVzdGlvblxyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgLy8gdXNlIGdsb2JhbCB2YXJzIGluc3RlYWQgb2YgdXBkYXRpbmcgb2JqZWN0IGRpcmVjdGx5IGhlcmUgdG8gcHJldmVudCBhY2NpZGVudGFsIGVkaXRpbmcgb2YgbWFya2VyIHdpdGhvdXQgY2xpY2tpbmcgXCJzYXZlIHNob3RcIlxyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIG90aGVyd2lzZSwgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBzbyBhcHBlbmQgY29vcmRpbmF0ZXMgdG8gdGhlIG5ldyBvYmplY3RcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaG90T2JqLmdvYWxYID0geDtcclxuICAgICAgICBzaG90T2JqLmdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbFNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBpZiAoZmllbGRNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdvYWxNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZSBjbGljayBsaXN0ZW5lcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIC8vIGNsZWFyIGZpZWxkIGFuZCBnb2FsIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICAvLyBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gc2F2ZSBjb3JyZWN0IG9iamVjdCAoaS5lLiBzaG90IGJlaW5nIGVkaXRlZCB2cy4gbmV3IHNob3QpXHJcbiAgICAgIC8vIGlmIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHByZXZpb3VzU2hvdE9iaiB3aWxsIG5vdCBiZSB1bmRlZmluZWRcclxuICAgICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRYID0gcHJldmlvdXNTaG90RmllbGRYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRZID0gcHJldmlvdXNTaG90RmllbGRZO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFggPSBwcmV2aW91c1Nob3RHb2FsWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxZID0gcHJldmlvdXNTaG90R29hbFk7XHJcbiAgICAgICAgLy8gZWxzZSBzYXZlIHRvIG5ldyBpbnN0YW5jZSBvZiBjbGFzcyBhbmQgYXBwZW5kIGJ1dHRvbiB0byBwYWdlIHdpdGggY29ycmVjdCBJRCBmb3IgZWRpdGluZ1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHNob3RPYmouYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBzaG90T2JqLmFlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgc2hvdE9iai5iYWxsU3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBzaG90QXJyYXkucHVzaChzaG90T2JqKTtcclxuICAgICAgICAvLyBhcHBlbmQgbmV3IGJ1dHRvblxyXG4gICAgICAgIHNob3RDb3VudGVyKys7XHJcbiAgICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtzaG90Q291bnRlcn1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke3Nob3RDb3VudGVyfWApO1xyXG4gICAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtzaG90Q291bnRlcn1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgICAgfVxyXG4gICAgICAvL1RPRE86IGFkZCBjb25kaXRpb24gdG8gcHJldmVudCBibGFuayBlbnRyaWVzIGFuZCBtaXNzaW5nIGNvb3JkaW5hdGVzXHJcblxyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzcyAobWF0dGVycyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQpXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWQgKG1hdHRlcnMgaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkKVxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2F2ZWRTaG90KGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVmZXJlbmNlcyB0aGUgc2hvdEFycmF5IHRvIGdldCBhIHNob3Qgb2JqZWN0IHRoYXQgbWF0Y2hlcyB0aGUgc2hvdCMgYnV0dG9uIGNsaWNrZWQgKGUuZy4gc2hvdCAyIGJ1dHRvbiA9IGluZGV4IDEgb2YgdGhlIHNob3RBcnJheSlcclxuICAgIC8vIHRoZSBmdW5jdGlvbiAoYW5kIGl0cyBhc3NvY2lhdGVkIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gb3RoZXIgbG9jYWwgZnVuY3Rpb25zKSBoYXMgdGhlc2UgYmFzaWMgcmVxdWlyZW1lbnRzOlxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBjbGljayBsaXN0ZW5lcnMgb24gaW1hZ2VzXHJcbiAgICAvLyByZXZpdmUgYSBzYXZlZCBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgZm9yIGVkaXRpbmcgc2hvdCBjb29yZGluYXRlcywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbFxyXG4gICAgLy8gcmVuZGVyIG1hcmtlcnMgZm9yIGV4aXN0aW5nIGNvb3JkaW5hdGVzIG9uIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBzYXZlIGVkaXRzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIGNhbmNlbCBlZGl0c1xyXG4gICAgLy8gdGhlIGRhdGEgaXMgcmVuZGVyZWQgb24gdGhlIHBhZ2UgYW5kIGNhbiBiZSBzYXZlZCAob3ZlcndyaXR0ZW4pIGJ5IHVzaW5nIHRoZSBcInNhdmUgc2hvdFwiIGJ1dHRvbiBvciBjYW5jZWxlZCBieSBjbGlja2luZyB0aGUgXCJjYW5jZWwgc2hvdFwiIGJ1dHRvblxyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IG5ldyBzaG90IGJ1dHRvbiBmcm9tIGJlaW5nIGNsaWNrZWRcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIC8vIGFsbG93IGNhbmNlbCBhbmQgc2F2ZWQgYnV0dG9ucyB0byBiZSBjbGlja2VkXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICAvLyBnZXQgSUQgb2Ygc2hvdCMgYnRuIGNsaWNrZWQgYW5kIGFjY2VzcyBzaG90QXJyYXkgYXQgW2J0bklEIC0gMV1cclxuICAgIGxldCBidG5JZCA9IGUudGFyZ2V0LmlkLnNsaWNlKDUpO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gc2hvdEFycmF5W2J0bklkIC0gMV07XHJcbiAgICAvLyByZW5kZXIgYmFsbCBzcGVlZCBhbmQgYWVyaWFsIGRyb3Bkb3duIGZvciB0aGUgc2hvdFxyXG4gICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZDtcclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9PT0gdHJ1ZSkgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJBZXJpYWxcIjsgfSBlbHNlIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjsgfVxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBmaWVsZCBhbmQgZ29hbFxyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIC8vIHJlbmRlciBzaG90IG1hcmtlciBvbiBmaWVsZFxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IHggPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHkgPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcbiAgICAvLyByZW5kZXIgZ29hbCBtYXJrZXIgb24gZmllbGRcclxuICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpXHJcbiAgICB4ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpO1xyXG4gICAgeSA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG5cclxuICB9LFxyXG5cclxuICBkaXNhYmxlRWRpdFNob3RidXR0b25zKGRpc2FibGVPck5vdCkge1xyXG4gICAgLy8gZm9yIGVhY2ggYnV0dG9uIGFmdGVyIFwiTmV3IFNob3RcIiwgXCJTYXZlIFNob3RcIiwgYW5kIFwiQ2FuY2VsIFNob3RcIiBkaXNhYmxlIHRoZSBidXR0b25zIGlmIHRoZSB1c2VyIGlzIGNyZWF0aW5nIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IHRydWUpIG9yIGVuYWJsZSB0aGVtIG9uIHNhdmUvY2FuY2VsIG9mIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IGZhbHNlKVxyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgbGV0IGVkaXRCdG47XHJcbiAgICBsZXQgbGVuZ3RoID0gc2hvdEJ0bkNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aDtcclxuICAgIGZvciAobGV0IGkgPSAzOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWRpdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aSAtIDJ9YCk7XHJcbiAgICAgIGVkaXRCdG4uZGlzYWJsZWQgPSBkaXNhYmxlT3JOb3Q7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGdldFNob3RPYmplY3RzRm9yU2F2aW5nKCkge1xyXG4gICAgLy8gcHJvdmlkZXMgYXJyYXkgZm9yIHVzZSBpbiBnYW1lRGF0YS5qcyAod2hlbiBzYXZpbmcgYSBuZXcgZ2FtZSwgbm90IHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lKVxyXG4gICAgcmV0dXJuIHNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsTnVtT2ZTaG90cygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGluaXRpYWwgbnVtYmVyIG9mIHNob3RzIHRoYXQgd2VyZSBzYXZlZCB0byBkYXRhYmFzZSB0byBnYW1lRGF0YS5qcyB0byBpZGVudGlmeSBhbiBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZFxyXG4gICAgcmV0dXJuIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICByZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZXF1ZXN0cyB0aGUgYXJyYXkgb2Ygc2hvdHMgZnJvbSB0aGUgcHJldmlvdXMgc2F2ZWQgZ2FtZSwgc2V0cyBpdCBhcyBzaG90QXJyYXksIGFuZCByZW5kZXJzIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgLy8gZ2V0IHNhdmVkIGdhbWUgd2l0aCBzaG90cyBlbWJlZGRlZCBhcyBhcnJheVxyXG4gICAgbGV0IHNhdmVkR2FtZU9iaiA9IGdhbWVEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKTtcclxuICAgIC8vIGNyZWF0ZSBzaG90QXJyYXkgd2l0aCBmb3JtYXQgcmVxdWlyZWQgYnkgbG9jYWwgZnVuY3Rpb25zXHJcbiAgICBsZXQgc2F2ZWRTaG90T2JqXHJcbiAgICBzYXZlZEdhbWVPYmouc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc2F2ZWRTaG90T2JqID0gbmV3IHNob3RPbkdvYWxcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWCA9IHNob3QuZmllbGRYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZmllbGRZID0gc2hvdC5maWVsZFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWCA9IHNob3QuZ29hbFg7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWSA9IHNob3QuZ29hbFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5hZXJpYWwgPSBzaG90LmFlcmlhbDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmJhbGxfc3BlZWQgPSBzaG90LmJhbGxfc3BlZWQudG9TdHJpbmcoKTtcclxuICAgICAgc2F2ZWRTaG90T2JqLnRpbWVTdGFtcCA9IHNob3QudGltZVN0YW1wXHJcbiAgICAgIHNhdmVkU2hvdE9iai5pZCA9IHNob3QuaWRcclxuICAgICAgc2hvdEFycmF5LnB1c2goc2F2ZWRTaG90T2JqKTtcclxuICAgIH0pXHJcblxyXG4gICAgY29uc29sZS5sb2coc2hvdEFycmF5KTtcclxuICAgIHNob3RBcnJheS5mb3JFYWNoKChzaG90LCBpZHgpID0+IHtcclxuICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtpZHggKyAxfWAsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtbGlua1wiIH0sIGBTaG90ICR7aWR4ICsgMX1gKTtcclxuICAgICAgc2hvdEJ0bkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdTaG90QnRuKTtcclxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpZHggKyAxfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5yZW5kZXJTYXZlZFNob3QpO1xyXG4gICAgfSk7XHJcbiAgICBzaG90Q291bnRlciA9IHNob3RBcnJheS5sZW5ndGg7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3REYXRhIl19
