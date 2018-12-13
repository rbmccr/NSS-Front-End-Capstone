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
    const dateRangeBtn = document.getElementById("dateRangeBtn");

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
    // conditional statement to prevent blank score entries .... else save game and shots to database
    const inpt_myScore = document.getElementById("myScoreInput");
    const inpt_theirScore = document.getElementById("theirScoreInput"); // get number of shots currently saved. If there aren't any, then the user can't save the game

    let shots = _shotData.default.getShotObjectsForSaving().length;

    if (shots === 0) {
      alert("A game cannot be saved without at least one goal scored.");
      return;
    } else if (inpt_myScore.value === "" || inpt_theirScore.value === "" || inpt_myScore.value === inpt_theirScore.value) {
      alert("Please enter scores. No tie games accepted.");
    } else {
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

    const ballSpeedIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-bolt"
    });
    const ballSpeedIconSpan = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, ballSpeedIcon);
    const ballSpeedInputTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, "Ball speed (mph):");
    const ballSpeedInput = (0, _elementBuilder.default)("input", {
      "id": "ballSpeedInput",
      "class": "input",
      "type": "number",
      "placeholder": "enter ball speed"
    });
    const ballSpeedControl = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left level-item"
    }, null, ballSpeedInput, ballSpeedIconSpan);
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
    }, null, ballSpeedInputTitle, ballSpeedControl, aerialControl);
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
    }, null, gameType3v3Control, gameType2v2Control, gameType1v1Control); // game mode select

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
      "class": "control"
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
      "class": "control"
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
      "class": "control"
    }, null, overtimeSelectParent); // column layout - empty column width 1/12 of container on left and right

    const selectField1 = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered column is-3 is-offset-1"
    }, null, gameTypeButtonField);
    const selectField2 = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered column is-2"
    }, null, modeControl);
    const selectField3 = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered column is-2"
    }, null, teamControl);
    const selectField4 = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered column is-3"
    }, null, overtimeControl);
    const emptyColumnRight = (0, _elementBuilder.default)("div", {
      "class": "column is-1"
    }); // ---------- bottom container

    const myScoreIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-handshake"
    });
    const myScoreIconSpan = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, myScoreIcon);
    const myScoreInput = (0, _elementBuilder.default)("input", {
      "id": "myScoreInput",
      "class": "input",
      "type": "number",
      "placeholder": "my team's score"
    });
    const myScoreControl = (0, _elementBuilder.default)("div", {
      "class": "control is-expanded has-icons-left"
    }, null, myScoreInput, myScoreIconSpan);
    const theirScoreIcon = (0, _elementBuilder.default)("i", {
      "class": "far fa-handshake"
    });
    const theirScoreIconSpan = (0, _elementBuilder.default)("span", {
      "class": "icon is-small is-left"
    }, null, theirScoreIcon);
    const theirScoreInput = (0, _elementBuilder.default)("input", {
      "id": "theirScoreInput",
      "class": "input",
      "type": "number",
      "placeholder": "opponent's score"
    });
    const theirScoreControl = (0, _elementBuilder.default)("div", {
      "class": "control is-expanded has-icons-left"
    }, null, theirScoreInput, theirScoreIconSpan);
    const myScoreField = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered"
    }, null, myScoreControl);
    const theirScoreField = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered"
    }, null, theirScoreControl);
    const myScoreColumn = (0, _elementBuilder.default)("div", {
      "class": "column is-3 is-offset-1"
    }, null, myScoreField);
    const theirscoreColumn = (0, _elementBuilder.default)("div", {
      "class": "column is-3"
    }, null, theirScoreField); // edit/save game buttons

    const editPreviousGame = (0, _elementBuilder.default)("button", {
      "id": "editPrevGame",
      "class": "button is-danger"
    }, "Edit Previous Game");
    const saveGame = (0, _elementBuilder.default)("button", {
      "id": "saveGame",
      "class": "button is-success"
    }, "Save Game");
    const gameButtonAlignment = (0, _elementBuilder.default)("div", {
      "class": "buttons is-centered"
    }, null, saveGame, editPreviousGame);
    const gameButtonContainer = (0, _elementBuilder.default)("div", {
      "class": "column"
    }, null, gameButtonAlignment); // append to webpage

    const gameContainerTop = (0, _elementBuilder.default)("div", {
      "class": "columns"
    }, null, selectField1, selectField2, selectField3, selectField4, emptyColumnRight);
    const gameContainerBottom = (0, _elementBuilder.default)("div", {
      "class": "columns"
    }, null, myScoreColumn, theirscoreColumn, gameButtonContainer);
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
let endDate;
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
    // create field heatmap with configuration
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
      return;
    } else {
      width = captureWidth; // remove current heatmaps

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
      blur: 0.925
    };
  },

  getGoalConfig(goalContainer) {
    // Ideal radius is about 35px at 550px width, or 6.363%
    return {
      container: goalContainer,
      radius: .063636363 * goalContainer.offsetWidth,
      maxOpacity: .6,
      minOpacity: 0,
      blur: 0.925
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
            heatmapData.saveHeatmapObject(heatmapTitle, activeUserId).then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(() => {
              // empty the temporary global array used with Promise.all
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
    feedbackResults.complementB = complementB; // shots scored on team side and opponent side of field

    let teamSide = 0;
    let oppSide = 0;
    shots.forEach(shot => {
      if (shot.fieldX > 0.50) {
        oppSide++;
      } else {
        teamSide++;
      }
    });
    feedbackResults.teamSideGoals = teamSide;
    feedbackResults.opponentSideGoals = oppSide;
    feedbackResults.goalsPerGame = Number((shots.length / games.length).toFixed(1)); // aerial count & percentage of all shots

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
    }, null, item4, item5, item6); // shots on team/opponent sides of field, and aerial shots / %  games in OT

    const item9_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.overtimeGames}`);
    const item9_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Games In Overtime");
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
    }, null, item10, item11, item12); // total games played, total shots scored, goals per game

    const item15_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.goalsPerGame}`);
    const item15_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Goals Per Game");
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
    }, null, item16, item17, item18); // comp games / win %, casual games / win %, wins/losses/win%

    const item21_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${feedbackResults.wins} : ${feedbackResults.losses} : ${feedbackResults.winPct}%`);
    const item21_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Wins, Losses, & Win Pct");
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
      feedbackContainer.appendChild(columns5_victoryDetails);
      feedbackContainer.appendChild(columns6_gameTypeDetails);
      feedbackContainer.appendChild(columns4_ballDetails);
      feedbackContainer.appendChild(columns3_shotDetails);
      feedbackContainer.appendChild(columns7_overtimeDetails);
    }
  }

};
var _default = feedback;
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
        if (user.length === 1) {
          if (user[0].password === password) {
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
    // this function is called when gameplay is clicked on the navbar and when a game is saved, in order to prevent bug conflicts with previously created shots
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
      // first check if ball speed entry is blank or if the field/goal images haven't been clicked
      // note "e" is considered a number and should not be accepted either
      if (inpt_ballSpeed.value === "" || goalMarker === null || fieldMarker === null) {
        alert("A ball speed, a field marker, and a goal marker are all required to save a shot. If ball speed is unknown, use your average listed on the heatmaps page.");
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
        }

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
    }
  },

  renderSavedShot(e) {
    // this function references the shotArray to get a shot object that matches the shot# button clicked (e.g. shot 2 button = index 1 of the shotArray)
    // the function (and its associated conditional statements in other local functions) has these basic requirements:
    // re-initialize click listeners on images
    // revive a saved instance of shotClass in the shotArray for editing shot coordinates, ball speed, and aerial
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2RhdGVGaWx0ZXIuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwRmVlZGJhY2suanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBzLmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIiwiLi4vc2NyaXB0cy9zaG90Q2xhc3MuanMiLCIuLi9zY3JpcHRzL3Nob3REYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUEsUUFBUSxDQUFDLGNBQVQsQ0FBeUIsUUFBTyxHQUFHLEdBQUcsQ0FBRSxFQUF4QyxFQUEyQyxnQkFBM0MsQ0FBNEQsT0FBNUQsRUFBcUUsUUFBUSxDQUFDLGVBQTlFO0FBQ0QsS0FKRDtBQUtBLElBQUEsV0FBVyxHQUFHLFNBQVMsQ0FBQyxNQUF4QjtBQUNBLElBQUEsd0JBQXdCLEdBQUcsU0FBUyxDQUFDLE1BQXJDO0FBQ0Q7O0FBaFVjLENBQWpCO2VBb1VlLFEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogaGVhdG1hcC5qcyB2Mi4wLjUgfCBKYXZhU2NyaXB0IEhlYXRtYXAgTGlicmFyeVxuICpcbiAqIENvcHlyaWdodCAyMDA4LTIwMTYgUGF0cmljayBXaWVkIDxoZWF0bWFwanNAcGF0cmljay13aWVkLmF0PiAtIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIE1JVCBhbmQgQmVlcndhcmUgbGljZW5zZSBcbiAqXG4gKiA6OiAyMDE2LTA5LTA1IDAxOjE2XG4gKi9cbjsoZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGZhY3RvcnkpIHtcblxuICAvLyBTdXBwb3J0cyBVTUQuIEFNRCwgQ29tbW9uSlMvTm9kZS5qcyBhbmQgYnJvd3NlciBjb250ZXh0XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dFtuYW1lXSA9IGZhY3RvcnkoKTtcbiAgfVxuXG59KShcImgzMzdcIiwgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4vLyBIZWF0bWFwIENvbmZpZyBzdG9yZXMgZGVmYXVsdCB2YWx1ZXMgYW5kIHdpbGwgYmUgbWVyZ2VkIHdpdGggaW5zdGFuY2UgY29uZmlnXG52YXIgSGVhdG1hcENvbmZpZyA9IHtcbiAgZGVmYXVsdFJhZGl1czogNDAsXG4gIGRlZmF1bHRSZW5kZXJlcjogJ2NhbnZhczJkJyxcbiAgZGVmYXVsdEdyYWRpZW50OiB7IDAuMjU6IFwicmdiKDAsMCwyNTUpXCIsIDAuNTU6IFwicmdiKDAsMjU1LDApXCIsIDAuODU6IFwieWVsbG93XCIsIDEuMDogXCJyZ2IoMjU1LDAsMClcIn0sXG4gIGRlZmF1bHRNYXhPcGFjaXR5OiAxLFxuICBkZWZhdWx0TWluT3BhY2l0eTogMCxcbiAgZGVmYXVsdEJsdXI6IC44NSxcbiAgZGVmYXVsdFhGaWVsZDogJ3gnLFxuICBkZWZhdWx0WUZpZWxkOiAneScsXG4gIGRlZmF1bHRWYWx1ZUZpZWxkOiAndmFsdWUnLCBcbiAgcGx1Z2luczoge31cbn07XG52YXIgU3RvcmUgPSAoZnVuY3Rpb24gU3RvcmVDbG9zdXJlKCkge1xuXG4gIHZhciBTdG9yZSA9IGZ1bmN0aW9uIFN0b3JlKGNvbmZpZykge1xuICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0ge307XG4gICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgIHRoaXMuX3JhZGkgPSBbXTtcbiAgICB0aGlzLl9taW4gPSAxMDtcbiAgICB0aGlzLl9tYXggPSAxO1xuICAgIHRoaXMuX3hGaWVsZCA9IGNvbmZpZ1sneEZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRYRmllbGQ7XG4gICAgdGhpcy5feUZpZWxkID0gY29uZmlnWyd5RmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFlGaWVsZDtcbiAgICB0aGlzLl92YWx1ZUZpZWxkID0gY29uZmlnWyd2YWx1ZUZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRWYWx1ZUZpZWxkO1xuXG4gICAgaWYgKGNvbmZpZ1tcInJhZGl1c1wiXSkge1xuICAgICAgdGhpcy5fY2ZnUmFkaXVzID0gY29uZmlnW1wicmFkaXVzXCJdO1xuICAgIH1cbiAgfTtcblxuICB2YXIgZGVmYXVsdFJhZGl1cyA9IEhlYXRtYXBDb25maWcuZGVmYXVsdFJhZGl1cztcblxuICBTdG9yZS5wcm90b3R5cGUgPSB7XG4gICAgLy8gd2hlbiBmb3JjZVJlbmRlciA9IGZhbHNlIC0+IGNhbGxlZCBmcm9tIHNldERhdGEsIG9taXRzIHJlbmRlcmFsbCBldmVudFxuICAgIF9vcmdhbmlzZURhdGE6IGZ1bmN0aW9uKGRhdGFQb2ludCwgZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgdmFyIHggPSBkYXRhUG9pbnRbdGhpcy5feEZpZWxkXTtcbiAgICAgICAgdmFyIHkgPSBkYXRhUG9pbnRbdGhpcy5feUZpZWxkXTtcbiAgICAgICAgdmFyIHJhZGkgPSB0aGlzLl9yYWRpO1xuICAgICAgICB2YXIgc3RvcmUgPSB0aGlzLl9kYXRhO1xuICAgICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4O1xuICAgICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhUG9pbnRbdGhpcy5fdmFsdWVGaWVsZF0gfHwgMTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IGRhdGFQb2ludC5yYWRpdXMgfHwgdGhpcy5fY2ZnUmFkaXVzIHx8IGRlZmF1bHRSYWRpdXM7XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XSkge1xuICAgICAgICAgIHN0b3JlW3hdID0gW107XG4gICAgICAgICAgcmFkaVt4XSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XVt5XSkge1xuICAgICAgICAgIHN0b3JlW3hdW3ldID0gdmFsdWU7XG4gICAgICAgICAgcmFkaVt4XVt5XSA9IHJhZGl1cztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9yZVt4XVt5XSArPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RvcmVkVmFsID0gc3RvcmVbeF1beV07XG5cbiAgICAgICAgaWYgKHN0b3JlZFZhbCA+IG1heCkge1xuICAgICAgICAgIGlmICghZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21heCA9IHN0b3JlZFZhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXREYXRhTWF4KHN0b3JlZFZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yZWRWYWwgPCBtaW4pIHtcbiAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9taW4gPSBzdG9yZWRWYWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YU1pbihzdG9yZWRWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICB4OiB4LCBcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsIFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpdXMsXG4gICAgICAgICAgICBtaW46IG1pbixcbiAgICAgICAgICAgIG1heDogbWF4IFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIF91bk9yZ2FuaXplRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdW5vcmdhbml6ZWREYXRhID0gW107XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG4gICAgICB2YXIgcmFkaSA9IHRoaXMuX3JhZGk7XG5cbiAgICAgIGZvciAodmFyIHggaW4gZGF0YSkge1xuICAgICAgICBmb3IgKHZhciB5IGluIGRhdGFbeF0pIHtcblxuICAgICAgICAgIHVub3JnYW5pemVkRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpW3hdW3ldLFxuICAgICAgICAgICAgdmFsdWU6IGRhdGFbeF1beV1cbiAgICAgICAgICB9KTtcblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgIGRhdGE6IHVub3JnYW5pemVkRGF0YVxuICAgICAgfTtcbiAgICB9LFxuICAgIF9vbkV4dHJlbWFDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgnZXh0cmVtYWNoYW5nZScsIHtcbiAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgIG1heDogdGhpcy5fbWF4XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFkZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGFyZ3VtZW50c1swXS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBkYXRhQXJyID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB2YXIgZGF0YUxlbiA9IGRhdGFBcnIubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoZGF0YUxlbi0tKSB7XG4gICAgICAgICAgdGhpcy5hZGREYXRhLmNhbGwodGhpcywgZGF0YUFycltkYXRhTGVuXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCB0byBzdG9yZSAgXG4gICAgICAgIHZhciBvcmdhbmlzZWRFbnRyeSA9IHRoaXMuX29yZ2FuaXNlRGF0YShhcmd1bWVudHNbMF0sIHRydWUpO1xuICAgICAgICBpZiAob3JnYW5pc2VkRW50cnkpIHtcbiAgICAgICAgICAvLyBpZiBpdCdzIHRoZSBmaXJzdCBkYXRhcG9pbnQgaW5pdGlhbGl6ZSB0aGUgZXh0cmVtYXMgd2l0aCBpdFxuICAgICAgICAgIGlmICh0aGlzLl9kYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fbWluID0gdGhpcy5fbWF4ID0gb3JnYW5pc2VkRW50cnkudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcnBhcnRpYWwnLCB7XG4gICAgICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICAgICAgZGF0YTogW29yZ2FuaXNlZEVudHJ5XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBkYXRhUG9pbnRzID0gZGF0YS5kYXRhO1xuICAgICAgdmFyIHBvaW50c0xlbiA9IGRhdGFQb2ludHMubGVuZ3RoO1xuXG5cbiAgICAgIC8vIHJlc2V0IGRhdGEgYXJyYXlzXG4gICAgICB0aGlzLl9kYXRhID0gW107XG4gICAgICB0aGlzLl9yYWRpID0gW107XG5cbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwb2ludHNMZW47IGkrKykge1xuICAgICAgICB0aGlzLl9vcmdhbmlzZURhdGEoZGF0YVBvaW50c1tpXSwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWF4ID0gZGF0YS5tYXg7XG4gICAgICB0aGlzLl9taW4gPSBkYXRhLm1pbiB8fCAwO1xuICAgICAgXG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUT0RPOiBpbXBsZW1lbnRcbiAgICB9LFxuICAgIHNldERhdGFNYXg6IGZ1bmN0aW9uKG1heCkge1xuICAgICAgdGhpcy5fbWF4ID0gbWF4O1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKG1pbikge1xuICAgICAgdGhpcy5fbWluID0gbWluO1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldENvb3JkaW5hdG9yOiBmdW5jdGlvbihjb29yZGluYXRvcikge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IgPSBjb29yZGluYXRvcjtcbiAgICB9LFxuICAgIF9nZXRJbnRlcm5hbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHsgXG4gICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICBtaW46IHRoaXMuX21pbiwgXG4gICAgICAgIGRhdGE6IHRoaXMuX2RhdGEsXG4gICAgICAgIHJhZGk6IHRoaXMuX3JhZGkgXG4gICAgICB9O1xuICAgIH0sXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdW5Pcmdhbml6ZURhdGEoKTtcbiAgICB9LyosXG5cbiAgICAgIFRPRE86IHJldGhpbmsuXG5cbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHJhZGl1cyA9IDEwMDtcbiAgICAgIHZhciB4ID0gcG9pbnQueDtcbiAgICAgIHZhciB5ID0gcG9pbnQueTtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgICAgaWYgKGRhdGFbeF0gJiYgZGF0YVt4XVt5XSkge1xuICAgICAgICByZXR1cm4gZGF0YVt4XVt5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgLy8gcmFkaWFsIHNlYXJjaCBmb3IgZGF0YXBvaW50cyBiYXNlZCBvbiBkZWZhdWx0IHJhZGl1c1xuICAgICAgICBmb3IodmFyIGRpc3RhbmNlID0gMTsgZGlzdGFuY2UgPCByYWRpdXM7IGRpc3RhbmNlKyspIHtcbiAgICAgICAgICB2YXIgbmVpZ2hib3JzID0gZGlzdGFuY2UgKiAyICsxO1xuICAgICAgICAgIHZhciBzdGFydFggPSB4IC0gZGlzdGFuY2U7XG4gICAgICAgICAgdmFyIHN0YXJ0WSA9IHkgLSBkaXN0YW5jZTtcblxuICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgbyA9IDA7IG8gPCBuZWlnaGJvcnM7IG8rKykge1xuICAgICAgICAgICAgICBpZiAoKGkgPT0gMCB8fCBpID09IG5laWdoYm9ycy0xKSB8fCAobyA9PSAwIHx8IG8gPT0gbmVpZ2hib3JzLTEpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFbc3RhcnRZK2ldICYmIGRhdGFbc3RhcnRZK2ldW3N0YXJ0WCtvXSkge1xuICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goZGF0YVtzdGFydFkraV1bc3RhcnRYK29dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCB2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSovXG4gIH07XG5cblxuICByZXR1cm4gU3RvcmU7XG59KSgpO1xuXG52YXIgQ2FudmFzMmRSZW5kZXJlciA9IChmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyQ2xvc3VyZSgpIHtcblxuICB2YXIgX2dldENvbG9yUGFsZXR0ZSA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBncmFkaWVudENvbmZpZyA9IGNvbmZpZy5ncmFkaWVudCB8fCBjb25maWcuZGVmYXVsdEdyYWRpZW50O1xuICAgIHZhciBwYWxldHRlQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHBhbGV0dGVDdHggPSBwYWxldHRlQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBwYWxldHRlQ2FudmFzLndpZHRoID0gMjU2O1xuICAgIHBhbGV0dGVDYW52YXMuaGVpZ2h0ID0gMTtcblxuICAgIHZhciBncmFkaWVudCA9IHBhbGV0dGVDdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMjU2LCAxKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZ3JhZGllbnRDb25maWcpIHtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChrZXksIGdyYWRpZW50Q29uZmlnW2tleV0pO1xuICAgIH1cblxuICAgIHBhbGV0dGVDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgcGFsZXR0ZUN0eC5maWxsUmVjdCgwLCAwLCAyNTYsIDEpO1xuXG4gICAgcmV0dXJuIHBhbGV0dGVDdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIDI1NiwgMSkuZGF0YTtcbiAgfTtcblxuICB2YXIgX2dldFBvaW50VGVtcGxhdGUgPSBmdW5jdGlvbihyYWRpdXMsIGJsdXJGYWN0b3IpIHtcbiAgICB2YXIgdHBsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHRwbEN0eCA9IHRwbENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHZhciB4ID0gcmFkaXVzO1xuICAgIHZhciB5ID0gcmFkaXVzO1xuICAgIHRwbENhbnZhcy53aWR0aCA9IHRwbENhbnZhcy5oZWlnaHQgPSByYWRpdXMqMjtcblxuICAgIGlmIChibHVyRmFjdG9yID09IDEpIHtcbiAgICAgIHRwbEN0eC5iZWdpblBhdGgoKTtcbiAgICAgIHRwbEN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgdHBsQ3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEpJztcbiAgICAgIHRwbEN0eC5maWxsKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBncmFkaWVudCA9IHRwbEN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudCh4LCB5LCByYWRpdXMqYmx1ckZhY3RvciwgeCwgeSwgcmFkaXVzKTtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLDAsMCwxKScpO1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDApJyk7XG4gICAgICB0cGxDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICB0cGxDdHguZmlsbFJlY3QoMCwgMCwgMipyYWRpdXMsIDIqcmFkaXVzKTtcbiAgICB9XG5cblxuXG4gICAgcmV0dXJuIHRwbENhbnZhcztcbiAgfTtcblxuICB2YXIgX3ByZXBhcmVEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZW5kZXJEYXRhID0gW107XG4gICAgdmFyIG1pbiA9IGRhdGEubWluO1xuICAgIHZhciBtYXggPSBkYXRhLm1heDtcbiAgICB2YXIgcmFkaSA9IGRhdGEucmFkaTtcbiAgICB2YXIgZGF0YSA9IGRhdGEuZGF0YTtcblxuICAgIHZhciB4VmFsdWVzID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gICAgdmFyIHhWYWx1ZXNMZW4gPSB4VmFsdWVzLmxlbmd0aDtcblxuICAgIHdoaWxlKHhWYWx1ZXNMZW4tLSkge1xuICAgICAgdmFyIHhWYWx1ZSA9IHhWYWx1ZXNbeFZhbHVlc0xlbl07XG4gICAgICB2YXIgeVZhbHVlcyA9IE9iamVjdC5rZXlzKGRhdGFbeFZhbHVlXSk7XG4gICAgICB2YXIgeVZhbHVlc0xlbiA9IHlWYWx1ZXMubGVuZ3RoO1xuICAgICAgd2hpbGUoeVZhbHVlc0xlbi0tKSB7XG4gICAgICAgIHZhciB5VmFsdWUgPSB5VmFsdWVzW3lWYWx1ZXNMZW5dO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3hWYWx1ZV1beVZhbHVlXTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IHJhZGlbeFZhbHVlXVt5VmFsdWVdO1xuICAgICAgICByZW5kZXJEYXRhLnB1c2goe1xuICAgICAgICAgIHg6IHhWYWx1ZSxcbiAgICAgICAgICB5OiB5VmFsdWUsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgIHJhZGl1czogcmFkaXVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtaW46IG1pbixcbiAgICAgIG1heDogbWF4LFxuICAgICAgZGF0YTogcmVuZGVyRGF0YVxuICAgIH07XG4gIH07XG5cblxuICBmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyKGNvbmZpZykge1xuICAgIHZhciBjb250YWluZXIgPSBjb25maWcuY29udGFpbmVyO1xuICAgIHZhciBzaGFkb3dDYW52YXMgPSB0aGlzLnNoYWRvd0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcyA9IGNvbmZpZy5jYW52YXMgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHJlbmRlckJvdW5kYXJpZXMgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAwLCAxMDAwMCwgMCwgMF07XG5cbiAgICB2YXIgY29tcHV0ZWQgPSBnZXRDb21wdXRlZFN0eWxlKGNvbmZpZy5jb250YWluZXIpIHx8IHt9O1xuXG4gICAgY2FudmFzLmNsYXNzTmFtZSA9ICdoZWF0bWFwLWNhbnZhcyc7XG5cbiAgICB0aGlzLl93aWR0aCA9IGNhbnZhcy53aWR0aCA9IHNoYWRvd0NhbnZhcy53aWR0aCA9IGNvbmZpZy53aWR0aCB8fCArKGNvbXB1dGVkLndpZHRoLnJlcGxhY2UoL3B4LywnJykpO1xuICAgIHRoaXMuX2hlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSBzaGFkb3dDYW52YXMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCB8fCArKGNvbXB1dGVkLmhlaWdodC5yZXBsYWNlKC9weC8sJycpKTtcblxuICAgIHRoaXMuc2hhZG93Q3R4ID0gc2hhZG93Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIC8vIEBUT0RPOlxuICAgIC8vIGNvbmRpdGlvbmFsIHdyYXBwZXJcblxuICAgIGNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gc2hhZG93Q2FudmFzLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246YWJzb2x1dGU7bGVmdDowO3RvcDowOyc7XG5cbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgdGhpcy5fcGFsZXR0ZSA9IF9nZXRDb2xvclBhbGV0dGUoY29uZmlnKTtcbiAgICB0aGlzLl90ZW1wbGF0ZXMgPSB7fTtcblxuICAgIHRoaXMuX3NldFN0eWxlcyhjb25maWcpO1xuICB9O1xuXG4gIENhbnZhczJkUmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAgIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9kcmF3QWxwaGEoZGF0YSk7XG4gICAgICAgIHRoaXMuX2NvbG9yaXplKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZW5kZXJBbGw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIHJlc2V0IHJlbmRlciBib3VuZGFyaWVzXG4gICAgICB0aGlzLl9jbGVhcigpO1xuICAgICAgaWYgKGRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX2RyYXdBbHBoYShfcHJlcGFyZURhdGEoZGF0YSkpO1xuICAgICAgICB0aGlzLl9jb2xvcml6ZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3VwZGF0ZUdyYWRpZW50OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX3BhbGV0dGUgPSBfZ2V0Q29sb3JQYWxldHRlKGNvbmZpZyk7XG4gICAgfSxcbiAgICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgaWYgKGNvbmZpZ1snZ3JhZGllbnQnXSkge1xuICAgICAgICB0aGlzLl91cGRhdGVHcmFkaWVudChjb25maWcpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3R5bGVzKGNvbmZpZyk7XG4gICAgfSxcbiAgICBzZXREaW1lbnNpb25zOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLnNoYWRvd0NhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zaGFkb3dDYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH0sXG4gICAgX2NsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc2hhZG93Q3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICB9LFxuICAgIF9zZXRTdHlsZXM6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fYmx1ciA9IChjb25maWcuYmx1ciA9PSAwKT8wOihjb25maWcuYmx1ciB8fCBjb25maWcuZGVmYXVsdEJsdXIpO1xuXG4gICAgICBpZiAoY29uZmlnLmJhY2tncm91bmRDb2xvcikge1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb25maWcuYmFja2dyb3VuZENvbG9yO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5zaGFkb3dDYW52YXMud2lkdGggPSBjb25maWcud2lkdGggfHwgdGhpcy5fd2lkdGg7XG4gICAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNoYWRvd0NhbnZhcy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IHx8IHRoaXMuX2hlaWdodDtcblxuXG4gICAgICB0aGlzLl9vcGFjaXR5ID0gKGNvbmZpZy5vcGFjaXR5IHx8IDApICogMjU1O1xuICAgICAgdGhpcy5fbWF4T3BhY2l0eSA9IChjb25maWcubWF4T3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1heE9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fbWluT3BhY2l0eSA9IChjb25maWcubWluT3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1pbk9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fdXNlR3JhZGllbnRPcGFjaXR5ID0gISFjb25maWcudXNlR3JhZGllbnRPcGFjaXR5O1xuICAgIH0sXG4gICAgX2RyYXdBbHBoYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbiA9IGRhdGEubWluO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heCA9IGRhdGEubWF4O1xuICAgICAgdmFyIGRhdGEgPSBkYXRhLmRhdGEgfHwgW107XG4gICAgICB2YXIgZGF0YUxlbiA9IGRhdGEubGVuZ3RoO1xuICAgICAgLy8gb24gYSBwb2ludCBiYXNpcz9cbiAgICAgIHZhciBibHVyID0gMSAtIHRoaXMuX2JsdXI7XG5cbiAgICAgIHdoaWxlKGRhdGFMZW4tLSkge1xuXG4gICAgICAgIHZhciBwb2ludCA9IGRhdGFbZGF0YUxlbl07XG5cbiAgICAgICAgdmFyIHggPSBwb2ludC54O1xuICAgICAgICB2YXIgeSA9IHBvaW50Lnk7XG4gICAgICAgIHZhciByYWRpdXMgPSBwb2ludC5yYWRpdXM7XG4gICAgICAgIC8vIGlmIHZhbHVlIGlzIGJpZ2dlciB0aGFuIG1heFxuICAgICAgICAvLyB1c2UgbWF4IGFzIHZhbHVlXG4gICAgICAgIHZhciB2YWx1ZSA9IE1hdGgubWluKHBvaW50LnZhbHVlLCBtYXgpO1xuICAgICAgICB2YXIgcmVjdFggPSB4IC0gcmFkaXVzO1xuICAgICAgICB2YXIgcmVjdFkgPSB5IC0gcmFkaXVzO1xuICAgICAgICB2YXIgc2hhZG93Q3R4ID0gdGhpcy5zaGFkb3dDdHg7XG5cblxuXG5cbiAgICAgICAgdmFyIHRwbDtcbiAgICAgICAgaWYgKCF0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXSkge1xuICAgICAgICAgIHRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdID0gdHBsID0gX2dldFBvaW50VGVtcGxhdGUocmFkaXVzLCBibHVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cGwgPSB0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXTtcbiAgICAgICAgfVxuICAgICAgICAvLyB2YWx1ZSBmcm9tIG1pbmltdW0gLyB2YWx1ZSByYW5nZVxuICAgICAgICAvLyA9PiBbMCwgMV1cbiAgICAgICAgdmFyIHRlbXBsYXRlQWxwaGEgPSAodmFsdWUtbWluKS8obWF4LW1pbik7XG4gICAgICAgIC8vIHRoaXMgZml4ZXMgIzE3Njogc21hbGwgdmFsdWVzIGFyZSBub3QgdmlzaWJsZSBiZWNhdXNlIGdsb2JhbEFscGhhIDwgLjAxIGNhbm5vdCBiZSByZWFkIGZyb20gaW1hZ2VEYXRhXG4gICAgICAgIHNoYWRvd0N0eC5nbG9iYWxBbHBoYSA9IHRlbXBsYXRlQWxwaGEgPCAuMDEgPyAuMDEgOiB0ZW1wbGF0ZUFscGhhO1xuXG4gICAgICAgIHNoYWRvd0N0eC5kcmF3SW1hZ2UodHBsLCByZWN0WCwgcmVjdFkpO1xuXG4gICAgICAgIC8vIHVwZGF0ZSByZW5kZXJCb3VuZGFyaWVzXG4gICAgICAgIGlmIChyZWN0WCA8IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0gPSByZWN0WDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RZIDwgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSA9IHJlY3RZO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFggKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gPSByZWN0WCArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFkgKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gPSByZWN0WSArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cblxuICAgICAgfVxuICAgIH0sXG4gICAgX2NvbG9yaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB4ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXTtcbiAgICAgIHZhciB5ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXTtcbiAgICAgIHZhciB3aWR0aCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gLSB4O1xuICAgICAgdmFyIGhlaWdodCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gLSB5O1xuICAgICAgdmFyIG1heFdpZHRoID0gdGhpcy5fd2lkdGg7XG4gICAgICB2YXIgbWF4SGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xuICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5O1xuICAgICAgdmFyIG1heE9wYWNpdHkgPSB0aGlzLl9tYXhPcGFjaXR5O1xuICAgICAgdmFyIG1pbk9wYWNpdHkgPSB0aGlzLl9taW5PcGFjaXR5O1xuICAgICAgdmFyIHVzZUdyYWRpZW50T3BhY2l0eSA9IHRoaXMuX3VzZUdyYWRpZW50T3BhY2l0eTtcblxuICAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgIHggPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHkgPCAwKSB7XG4gICAgICAgIHkgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHggKyB3aWR0aCA+IG1heFdpZHRoKSB7XG4gICAgICAgIHdpZHRoID0gbWF4V2lkdGggLSB4O1xuICAgICAgfVxuICAgICAgaWYgKHkgKyBoZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgaGVpZ2h0ID0gbWF4SGVpZ2h0IC0geTtcbiAgICAgIH1cblxuICAgICAgdmFyIGltZyA9IHRoaXMuc2hhZG93Q3R4LmdldEltYWdlRGF0YSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIHZhciBpbWdEYXRhID0gaW1nLmRhdGE7XG4gICAgICB2YXIgbGVuID0gaW1nRGF0YS5sZW5ndGg7XG4gICAgICB2YXIgcGFsZXR0ZSA9IHRoaXMuX3BhbGV0dGU7XG5cblxuICAgICAgZm9yICh2YXIgaSA9IDM7IGkgPCBsZW47IGkrPSA0KSB7XG4gICAgICAgIHZhciBhbHBoYSA9IGltZ0RhdGFbaV07XG4gICAgICAgIHZhciBvZmZzZXQgPSBhbHBoYSAqIDQ7XG5cblxuICAgICAgICBpZiAoIW9mZnNldCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbmFsQWxwaGE7XG4gICAgICAgIGlmIChvcGFjaXR5ID4gMCkge1xuICAgICAgICAgIGZpbmFsQWxwaGEgPSBvcGFjaXR5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChhbHBoYSA8IG1heE9wYWNpdHkpIHtcbiAgICAgICAgICAgIGlmIChhbHBoYSA8IG1pbk9wYWNpdHkpIHtcbiAgICAgICAgICAgICAgZmluYWxBbHBoYSA9IG1pbk9wYWNpdHk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmaW5hbEFscGhhID0gYWxwaGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBtYXhPcGFjaXR5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGltZ0RhdGFbaS0zXSA9IHBhbGV0dGVbb2Zmc2V0XTtcbiAgICAgICAgaW1nRGF0YVtpLTJdID0gcGFsZXR0ZVtvZmZzZXQgKyAxXTtcbiAgICAgICAgaW1nRGF0YVtpLTFdID0gcGFsZXR0ZVtvZmZzZXQgKyAyXTtcbiAgICAgICAgaW1nRGF0YVtpXSA9IHVzZUdyYWRpZW50T3BhY2l0eSA/IHBhbGV0dGVbb2Zmc2V0ICsgM10gOiBmaW5hbEFscGhhO1xuXG4gICAgICB9XG5cbiAgICAgIGltZy5kYXRhID0gaW1nRGF0YTtcbiAgICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YShpbWcsIHgsIHkpO1xuXG4gICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAsIDEwMDAsIDAsIDBdO1xuXG4gICAgfSxcbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHNoYWRvd0N0eCA9IHRoaXMuc2hhZG93Q3R4O1xuICAgICAgdmFyIGltZyA9IHNoYWRvd0N0eC5nZXRJbWFnZURhdGEocG9pbnQueCwgcG9pbnQueSwgMSwgMSk7XG4gICAgICB2YXIgZGF0YSA9IGltZy5kYXRhWzNdO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heDtcbiAgICAgIHZhciBtaW4gPSB0aGlzLl9taW47XG5cbiAgICAgIHZhbHVlID0gKE1hdGguYWJzKG1heC1taW4pICogKGRhdGEvMjU1KSkgPj4gMDtcblxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgZ2V0RGF0YVVSTDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYW52YXMudG9EYXRhVVJMKCk7XG4gICAgfVxuICB9O1xuXG5cbiAgcmV0dXJuIENhbnZhczJkUmVuZGVyZXI7XG59KSgpO1xuXG5cbnZhciBSZW5kZXJlciA9IChmdW5jdGlvbiBSZW5kZXJlckNsb3N1cmUoKSB7XG5cbiAgdmFyIHJlbmRlcmVyRm4gPSBmYWxzZTtcblxuICBpZiAoSGVhdG1hcENvbmZpZ1snZGVmYXVsdFJlbmRlcmVyJ10gPT09ICdjYW52YXMyZCcpIHtcbiAgICByZW5kZXJlckZuID0gQ2FudmFzMmRSZW5kZXJlcjtcbiAgfVxuXG4gIHJldHVybiByZW5kZXJlckZuO1xufSkoKTtcblxuXG52YXIgVXRpbCA9IHtcbiAgbWVyZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtZXJnZWQgPSB7fTtcbiAgICB2YXIgYXJnc0xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzTGVuOyBpKyspIHtcbiAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbaV1cbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgbWVyZ2VkW2tleV0gPSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlZDtcbiAgfVxufTtcbi8vIEhlYXRtYXAgQ29uc3RydWN0b3JcbnZhciBIZWF0bWFwID0gKGZ1bmN0aW9uIEhlYXRtYXBDbG9zdXJlKCkge1xuXG4gIHZhciBDb29yZGluYXRvciA9IChmdW5jdGlvbiBDb29yZGluYXRvckNsb3N1cmUoKSB7XG5cbiAgICBmdW5jdGlvbiBDb29yZGluYXRvcigpIHtcbiAgICAgIHRoaXMuY1N0b3JlID0ge307XG4gICAgfTtcblxuICAgIENvb3JkaW5hdG9yLnByb3RvdHlwZSA9IHtcbiAgICAgIG9uOiBmdW5jdGlvbihldnROYW1lLCBjYWxsYmFjaywgc2NvcGUpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuXG4gICAgICAgIGlmICghY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgY1N0b3JlW2V2dE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgY1N0b3JlW2V2dE5hbWVdLnB1c2goKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHNjb3BlLCBkYXRhKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSxcbiAgICAgIGVtaXQ6IGZ1bmN0aW9uKGV2dE5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuICAgICAgICBpZiAoY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgdmFyIGxlbiA9IGNTdG9yZVtldnROYW1lXS5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBjU3RvcmVbZXZ0TmFtZV1baV07XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIENvb3JkaW5hdG9yO1xuICB9KSgpO1xuXG5cbiAgdmFyIF9jb25uZWN0ID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgICB2YXIgcmVuZGVyZXIgPSBzY29wZS5fcmVuZGVyZXI7XG4gICAgdmFyIGNvb3JkaW5hdG9yID0gc2NvcGUuX2Nvb3JkaW5hdG9yO1xuICAgIHZhciBzdG9yZSA9IHNjb3BlLl9zdG9yZTtcblxuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJwYXJ0aWFsJywgcmVuZGVyZXIucmVuZGVyUGFydGlhbCwgcmVuZGVyZXIpO1xuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJhbGwnLCByZW5kZXJlci5yZW5kZXJBbGwsIHJlbmRlcmVyKTtcbiAgICBjb29yZGluYXRvci5vbignZXh0cmVtYWNoYW5nZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNjb3BlLl9jb25maWcub25FeHRyZW1hQ2hhbmdlICYmXG4gICAgICBzY29wZS5fY29uZmlnLm9uRXh0cmVtYUNoYW5nZSh7XG4gICAgICAgIG1pbjogZGF0YS5taW4sXG4gICAgICAgIG1heDogZGF0YS5tYXgsXG4gICAgICAgIGdyYWRpZW50OiBzY29wZS5fY29uZmlnWydncmFkaWVudCddIHx8IHNjb3BlLl9jb25maWdbJ2RlZmF1bHRHcmFkaWVudCddXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBzdG9yZS5zZXRDb29yZGluYXRvcihjb29yZGluYXRvcik7XG4gIH07XG5cblxuICBmdW5jdGlvbiBIZWF0bWFwKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLl9jb25maWcgPSBVdGlsLm1lcmdlKEhlYXRtYXBDb25maWcsIGFyZ3VtZW50c1swXSB8fCB7fSk7XG4gICAgdGhpcy5fY29vcmRpbmF0b3IgPSBuZXcgQ29vcmRpbmF0b3IoKTtcbiAgICBpZiAoY29uZmlnWydwbHVnaW4nXSkge1xuICAgICAgdmFyIHBsdWdpblRvTG9hZCA9IGNvbmZpZ1sncGx1Z2luJ107XG4gICAgICBpZiAoIUhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5Ub0xvYWRdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGx1Z2luIFxcJycrIHBsdWdpblRvTG9hZCArICdcXCcgbm90IGZvdW5kLiBNYXliZSBpdCB3YXMgbm90IHJlZ2lzdGVyZWQuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGx1Z2luID0gSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpblRvTG9hZF07XG4gICAgICAgIC8vIHNldCBwbHVnaW4gcmVuZGVyZXIgYW5kIHN0b3JlXG4gICAgICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IHBsdWdpbi5yZW5kZXJlcihjb25maWcpO1xuICAgICAgICB0aGlzLl9zdG9yZSA9IG5ldyBwbHVnaW4uc3RvcmUoY29uZmlnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoY29uZmlnKTtcbiAgICAgIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JlKGNvbmZpZyk7XG4gICAgfVxuICAgIF9jb25uZWN0KHRoaXMpO1xuICB9O1xuXG4gIC8vIEBUT0RPOlxuICAvLyBhZGQgQVBJIGRvY3VtZW50YXRpb25cbiAgSGVhdG1hcC5wcm90b3R5cGUgPSB7XG4gICAgYWRkRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5hZGREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnJlbW92ZURhdGEgJiYgdGhpcy5fc3RvcmUucmVtb3ZlRGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWF4OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGFNYXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YU1pbi5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX2NvbmZpZyA9IFV0aWwubWVyZ2UodGhpcy5fY29uZmlnLCBjb25maWcpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIudXBkYXRlQ29uZmlnKHRoaXMuX2NvbmZpZyk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9zdG9yZS5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZXBhaW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX3N0b3JlLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlLmdldERhdGEoKTtcbiAgICB9LFxuICAgIGdldERhdGFVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldERhdGFVUkwoKTtcbiAgICB9LFxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG5cbiAgICAgIGlmICh0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KHBvaW50KTtcbiAgICAgIH0gZWxzZSAgaWYgKHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQocG9pbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBIZWF0bWFwO1xuXG59KSgpO1xuXG5cbi8vIGNvcmVcbnZhciBoZWF0bWFwRmFjdG9yeSA9IHtcbiAgY3JlYXRlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICByZXR1cm4gbmV3IEhlYXRtYXAoY29uZmlnKTtcbiAgfSxcbiAgcmVnaXN0ZXI6IGZ1bmN0aW9uKHBsdWdpbktleSwgcGx1Z2luKSB7XG4gICAgSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpbktleV0gPSBwbHVnaW47XG4gIH1cbn07XG5cbnJldHVybiBoZWF0bWFwRmFjdG9yeTtcblxuXG59KTsiLCJjb25zdCBVUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OFwiXHJcblxyXG5jb25zdCBBUEkgPSB7XHJcblxyXG4gIGdldFNpbmdsZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGdldEFsbChleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBkZWxldGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWAsIHtcclxuICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHBvc3RJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHB1dEl0ZW0oZXh0ZW5zaW9uLCBvYmopIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBVVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBUEkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGhlYXRtYXBEYXRhIGZyb20gXCIuL2hlYXRtYXBEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBkYXRlRmlsdGVyID0ge1xyXG5cclxuICBidWlsZERhdGVGaWx0ZXIoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tIGhlYXRtYXBzLmpzIGFuZCBpcyB0cmlnZ2VyZWQgZnJvbSB0aGUgaGVhdG1hcHMgcGFnZSBvZiB0aGUgc2l0ZSB3aGVuXHJcbiAgICAvLyB0aGUgZGF0ZSBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImVuZERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGVuZERhdGVJbnB1dCk7XHJcbiAgICBjb25zdCBlbmREYXRlTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiRGF0ZSAyOlxceGEwXCIpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0RmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgZW5kRGF0ZUxhYmVsLCBlbmREYXRlQ29udHJvbCk7XHJcblxyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzdGFydERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgc3RhcnREYXRlSW5wdXQpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiRGF0ZSAxOlxceGEwXCIpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXRGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBzdGFydERhdGVMYWJlbCwgc3RhcnREYXRlQ29udHJvbCk7XHJcblxyXG4gICAgY29uc3QgY2xlYXJGaWx0ZXJCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2xlYXJEYXRlRmlsdGVyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDbGVhciBGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBjbGVhckZpbHRlckJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGNsZWFyRmlsdGVyQnRuKTtcclxuICAgIGNvbnN0IGRhdGVTYXZlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNldERhdGVGaWx0ZXJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTZXQgRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRhdGVTYXZlQnRuKTtcclxuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxNb2RhbFdpbmRvd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsXCIpO1xyXG4gICAgY29uc3QgY2FuY2VsQnV0dG9uQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgY2FuY2VsQnRuKTtcclxuICAgIGNvbnN0IGJ1dHRvbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIHNhdmVCdXR0b25Db250cm9sLCBjbGVhckZpbHRlckJ1dHRvbkNvbnRyb2wsIGNhbmNlbEJ1dHRvbkNvbnRyb2wpO1xyXG5cclxuICAgIGNvbnN0IG1vZGFsQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtb2RhbC1jb250ZW50IGJveFwiIH0sIG51bGwsIHN0YXJ0RGF0ZUlucHV0RmllbGQsIGVuZERhdGVJbnB1dEZpZWxkLCBidXR0b25GaWVsZCk7XHJcbiAgICBjb25zdCBtb2RhbEJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibW9kYWwtYmFja2dyb3VuZFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgbW9kYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibW9kYWwtZGF0ZUZpbHRlclwiLCBcImNsYXNzXCI6IFwibW9kYWxcIiB9LCBudWxsLCBtb2RhbEJhY2tncm91bmQsIG1vZGFsQ29udGVudCk7XHJcblxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChtb2RhbCk7XHJcbiAgICB0aGlzLm1vZGFsc0V2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIG1vZGFsc0V2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGNsZWFyRGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xlYXJEYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2V0RGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2V0RGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IGNhbmNlbE1vZGFsV2luZG93QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxNb2RhbFdpbmRvd1wiKTtcclxuXHJcbiAgICBjYW5jZWxNb2RhbFdpbmRvd0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5jYW5jZWxNb2RhbFdpbmRvdyk7XHJcbiAgICBzZXREYXRlRmlsdGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLnNldEZpbHRlcik7XHJcbiAgICBjbGVhckRhdGVGaWx0ZXJCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuY2xlYXJEYXRlRmlsdGVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgb3BlbkRhdGVGaWx0ZXIoKSB7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIC8vIGNoZWNrIGlmIGdsb2JhbCB2YXJzIGFyZSBzZXQuIElmIHNvLCBkb24ndCB0b2dnbGUgY29sb3Igb2YgYnV0dG9uXHJcbiAgICBjb25zdCBkYXRlU2V0ID0gaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyh0cnVlKTtcclxuXHJcbiAgICBpZiAoZGF0ZVNldCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGF0ZVJhbmdlQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGNsZWFyRGF0ZUZpbHRlcigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVzZXRzIGdsb2JhbCBkYXRlIGZpbHRlciB2YXJpYWJsZXMgaW4gaGVhdG1hcERhdGEuanMgYW5kIHJlcGxhY2VzIGRhdGUgaW5wdXRzIHdpdGggYmxhbmsgZGF0ZSBpbnB1dHNcclxuICAgIGxldCBzdGFydERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhcnREYXRlSW5wdXRcIik7XHJcbiAgICBsZXQgZW5kRGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbmREYXRlSW5wdXRcIik7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBzZXREYXRlRmlsdGVyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZXREYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3QgZGF0ZVJhbmdlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXRlUmFuZ2VCdG5cIik7XHJcblxyXG4gICAgaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgZGF0ZVJhbmdlQnRuLmNsYXNzTGlzdC5hZGQoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIHN0YXJ0RGF0ZUlucHV0LnJlcGxhY2VXaXRoKGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInN0YXJ0RGF0ZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJkYXRlXCIgfSwgbnVsbCkpO1xyXG4gICAgZW5kRGF0ZUlucHV0LnJlcGxhY2VXaXRoKGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImVuZERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpKTtcclxuICAgIHNldERhdGVGaWx0ZXJCdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuc2V0RmlsdGVyKTtcclxuICAgIHNldERhdGVGaWx0ZXJCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuc2V0RmlsdGVyKTtcclxuXHJcbiAgICBpZiAoZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWFjdGl2ZVwiKSkge1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnJlbW92ZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2V0RmlsdGVyKCkge1xyXG4gICAgY29uc3QgZGF0ZUZpbHRlck1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RhbC1kYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0YXJ0RGF0ZUlucHV0XCIpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbmREYXRlSW5wdXRcIik7XHJcblxyXG4gICAgc3RhcnREYXRlSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgIGVuZERhdGVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgIC8vIGNoZWNrIGlmIGRhdGUgcGlja2VycyBoYXZlIGEgdmFsaWQgZGF0ZVxyXG4gICAgaWYgKHN0YXJ0RGF0ZUlucHV0LnZhbHVlID09PSBcIlwiKSB7XHJcbiAgICAgIHN0YXJ0RGF0ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICB9IGVsc2UgaWYgKGVuZERhdGVJbnB1dC52YWx1ZSA9PT0gXCJcIikge1xyXG4gICAgICBlbmREYXRlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGlmIHRoZXkgZG8sIHRoZW4gc2V0IGdsb2JhbCB2YXJzIGluIGhlYXRtYXBzIHBhZ2UgYW5kIGNsb3NlIG1vZGFsXHJcbiAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMoZmFsc2UsIHN0YXJ0RGF0ZUlucHV0LnZhbHVlLCBlbmREYXRlSW5wdXQudmFsdWUpO1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjYW5jZWxNb2RhbFdpbmRvdygpIHtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IGRhdGVSYW5nZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGF0ZVJhbmdlQnRuXCIpO1xyXG5cclxuICAgIC8vIGlmIGdsb2JhbCB2YXJpYWJsZXMgYXJlIGRlZmluZWQgYWxyZWFkeSwgY2FuY2VsIHNob3VsZCBub3QgY2hhbmdlIHRoZSBjbGFzcyBvbiB0aGUgZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGNvbnN0IGRhdGVTZXQgPSBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKHRydWUpO1xyXG4gICAgaWYgKGRhdGVTZXQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRhdGVSYW5nZUJ0bi5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5ZGF0ZUZpbHRlcihzdGFydERhdGUsIGVuZERhdGUsIGdhbWVJZHMsIGdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZXhhbWluZXMgdGhlIGdhbWUgb2JqZWN0IGFyZ3VtZW50IGNvbXBhcmVkIHRvIHRoZSB1c2VyLWRlZmluZWQgc3RhcnQgYW5kIGVuZCBkYXRlc1xyXG4gICAgLy8gaWYgdGhlIGdhbWUgZGF0ZSBpcyB3aXRoaW4gdGhlIHR3byBkYXRlcyBzcGVjaWZpZWQsIHRoZW4gdGhlIGdhbWUgSUQgaXMgcHVzaGVkIHRvIHRoZSBnYW1lSWRzIGFycmF5XHJcblxyXG4gICAgLy8gc3BsaXQgdGltZXN0YW1wIGFuZCByZWNhbGwgb25seSBkYXRlXHJcbiAgICBsZXQgZ2FtZURhdGUgPSBnYW1lLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF07XHJcblxyXG4gICAgaWYgKHN0YXJ0RGF0ZSA8PSBnYW1lRGF0ZSAmJiBnYW1lRGF0ZSA8PSBlbmREYXRlKSB7XHJcbiAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhcHBseWRhdGVGaWx0ZXJUb1NhdmVkSGVhdG1hcChzdGFydERhdGUsIGVuZERhdGUsIHNob3RzLCBzaG90c01hdGNoaW5nRmlsdGVyKSB7XHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgc2hvdERhdGUgPSBzaG90LnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF07XHJcblxyXG4gICAgICBpZiAoc3RhcnREYXRlIDw9IHNob3REYXRlICYmIHNob3REYXRlIDw9IGVuZERhdGUpIHtcclxuICAgICAgICBzaG90c01hdGNoaW5nRmlsdGVyLnB1c2goc2hvdCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGF0ZUZpbHRlciIsImZ1bmN0aW9uIGVsQnVpbGRlcihuYW1lLCBhdHRyaWJ1dGVzT2JqLCB0eHQsIC4uLmNoaWxkcmVuKSB7XHJcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xyXG4gIGZvciAobGV0IGF0dHIgaW4gYXR0cmlidXRlc09iaikge1xyXG4gICAgZWwuc2V0QXR0cmlidXRlKGF0dHIsIGF0dHJpYnV0ZXNPYmpbYXR0cl0pO1xyXG4gIH1cclxuICBlbC50ZXh0Q29udGVudCA9IHR4dCB8fCBudWxsO1xyXG4gIGNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgZWwuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gIH0pXHJcbiAgcmV0dXJuIGVsO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBlbEJ1aWxkZXIiLCJpbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIjtcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCI7XHJcbmltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIjtcclxuXHJcbi8vIHRoZSBwdXJwb3NlIG9mIHRoaXMgbW9kdWxlIGlzIHRvOlxyXG4vLyAxLiBzYXZlIGFsbCBjb250ZW50IGluIHRoZSBnYW1lcGxheSBwYWdlIChzaG90IGFuZCBnYW1lIGRhdGEpIHRvIHRoZSBkYXRhYmFzZVxyXG4vLyAyLiBpbW1lZGlhdGVseSBjbGVhciB0aGUgZ2FtZXBsYXkgY29udGFpbmVycyBvZiBjb250ZW50IG9uIHNhdmVcclxuLy8gMy4gaW1tZWRpYXRlbHkgcmVzZXQgYWxsIGdsb2JhbCB2YXJpYWJsZXMgaW4gdGhlIHNob3RkYXRhIGZpbGUgdG8gYWxsb3cgdGhlIHVzZXIgdG8gYmVnaW4gc2F2aW5nIHNob3RzIGFuZCBlbnRlcmluZyBnYW1lIGRhdGEgZm9yIHRoZWlyIG5leHQgZ2FtZVxyXG4vLyA0LiBhZmZvcmRhbmNlIGZvciB1c2VyIHRvIHJlY2FsbCBhbGwgZGF0YSBmcm9tIHByZXZpb3VzIHNhdmVkIGdhbWUgZm9yIGVkaXRpbmdcclxuLy8gNS4gaW5jbHVkZSBhbnkgb3RoZXIgZnVuY3Rpb25zIG5lZWRlZCB0byBzdXBwb3J0IHRoZSBmaXJzdCA0IHJlcXVpcmVtZW50c1xyXG5cclxuLy8gdGhpcyBnbG9iYWwgdmFyaWFibGUgaXMgdXNlZCB0byBwYXNzIHNhdmVkIHNob3RzLCBiYWxsIHNwZWVkLCBhbmQgYWVyaWFsIGJvb2xlYW4gdG8gc2hvdERhdGEuanMgZHVyaW5nIHRoZSBlZGl0IHByb2Nlc3NcclxubGV0IHNhdmVkR2FtZU9iamVjdDtcclxubGV0IHB1dFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxubGV0IHBvc3RQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbmxldCBwb3N0UHJvbWlzZXMgPSBbXTtcclxuXHJcbmNvbnN0IGdhbWVEYXRhID0ge1xyXG5cclxuICBnYW1lVHlwZUJ1dHRvblRvZ2dsZShlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHRvZ2dsZXMgdGhlIFwiaXMtc2VsZWN0ZWRcIiBjbGFzcyBiZXR3ZWVuIHRoZSBnYW1lIHR5cGUgYnV0dG9uc1xyXG5cclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuICAgIGxldCBidG5DbGlja2VkID0gZS50YXJnZXQ7XHJcblxyXG4gICAgaWYgKCFidG5DbGlja2VkLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKSB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRHYW1lVHlwZUJ0biA9IGdhbWVUeXBlQnRucy5maWx0ZXIoYnRuID0+IGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSk7XHJcbiAgICAgIGN1cnJlbnRHYW1lVHlwZUJ0blswXS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGN1cnJlbnRHYW1lVHlwZUJ0blswXS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bkNsaWNrZWQuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCkge1xyXG4gICAgc2F2ZWRHYW1lT2JqZWN0ID0gdW5kZWZpbmVkO1xyXG4gICAgcHV0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG4gICAgcG9zdFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxuICAgIHBvc3RQcm9taXNlcyA9IFtdO1xyXG4gIH0sXHJcblxyXG4gIHB1dEVkaXRlZFNob3RzKHByZXZpb3VzbHlTYXZlZFNob3RzQXJyKSB7XHJcbiAgICAvLyBQVVQgZmlyc3QsIHNpY25lIHlvdSBjYW4ndCBzYXZlIGEgZ2FtZSBpbml0aWFsbHkgd2l0aG91dCBhdCBsZWFzdCAxIHNob3RcclxuICAgIHByZXZpb3VzbHlTYXZlZFNob3RzQXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIC8vIGV2ZW4gdGhvdWdoIGl0J3MgYSBQVVQsIHdlIGhhdmUgdG8gcmVmb3JtYXQgdGhlIF9maWVsZFggc3ludGF4IHRvIGZpZWxkWFxyXG4gICAgICBsZXQgc2hvdEZvclB1dCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUHV0LmdhbWVJZCA9IHNhdmVkR2FtZU9iamVjdC5pZDtcclxuICAgICAgc2hvdEZvclB1dC5maWVsZFggPSBzaG90Ll9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQdXQuZmllbGRZID0gc2hvdC5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUHV0LmdvYWxYID0gc2hvdC5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQdXQuZ29hbFkgPSBzaG90Ll9nb2FsWTtcclxuICAgICAgc2hvdEZvclB1dC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3QuYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQdXQuYWVyaWFsID0gc2hvdC5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUHV0LnRpbWVTdGFtcCA9IHNob3QuX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHB1dFByb21pc2VzRWRpdE1vZGUucHVzaChBUEkucHV0SXRlbShgc2hvdHMvJHtzaG90LmlkfWAsIHNob3RGb3JQdXQpKTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHV0UHJvbWlzZXNFZGl0TW9kZSlcclxuICB9LFxyXG5cclxuICBwb3N0TmV3U2hvdHNNYWRlRHVyaW5nRWRpdE1vZGUoc2hvdHNOb3RZZXRQb3N0ZWRBcnIpIHtcclxuICAgIHNob3RzTm90WWV0UG9zdGVkQXJyLmZvckVhY2goc2hvdE9iaiA9PiB7XHJcbiAgICAgIGxldCBzaG90Rm9yUG9zdCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBzYXZlZEdhbWVPYmplY3QuaWQ7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclBvc3QudGltZVN0YW1wID0gc2hvdE9iai5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcG9zdFByb21pc2VzRWRpdE1vZGUucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHBvc3RQcm9taXNlc0VkaXRNb2RlKVxyXG4gIH0sXHJcblxyXG4gIHBvc3ROZXdTaG90cyhnYW1lSWQpIHtcclxuICAgIC8vIHBvc3Qgc2hvdHMgd2l0aCBnYW1lSWRcclxuICAgIGNvbnN0IHNob3RBcnIgPSBzaG90RGF0YS5nZXRTaG90T2JqZWN0c0ZvclNhdmluZygpO1xyXG4gICAgc2hvdEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICBsZXQgc2hvdEZvclBvc3QgPSB7fTtcclxuICAgICAgc2hvdEZvclBvc3QuZ2FtZUlkID0gZ2FtZUlkO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFggPSBzaG90T2JqLl9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWSA9IHNob3RPYmouX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFggPSBzaG90T2JqLl9nb2FsWDtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFkgPSBzaG90T2JqLl9nb2FsWTtcclxuICAgICAgc2hvdEZvclBvc3QuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90T2JqLmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUG9zdC5hZXJpYWwgPSBzaG90T2JqLl9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQb3N0LnRpbWVTdGFtcCA9IHNob3RPYmouX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHBvc3RQcm9taXNlcy5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RzXCIsIHNob3RGb3JQb3N0KSk7XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHBvc3RQcm9taXNlcylcclxuICB9LFxyXG5cclxuICBzYXZlRGF0YShnYW1lRGF0YU9iaiwgc2F2aW5nRWRpdGVkR2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBmaXJzdCBkZXRlcm1pbmVzIGlmIGEgZ2FtZSBpcyBiZWluZyBzYXZlZCBhcyBuZXcsIG9yIGEgcHJldmlvdXNseSBzYXZlZCBnYW1lIGlzIGJlaW5nIGVkaXRlZFxyXG4gICAgLy8gaWYgc2F2aW5nIGFuIGVkaXRlZCBnYW1lLCB0aGUgZ2FtZSBpcyBQVVQsIGFsbCBzaG90cyBzYXZlZCBwcmV2aW91c2x5IGFyZSBQVVQsIGFuZCBuZXcgc2hvdHMgYXJlIFBPU1RFRFxyXG4gICAgLy8gaWYgdGhlIGdhbWUgaXMgYSBuZXcgZ2FtZSBhbHRvZ2V0aGVyLCB0aGVuIHRoZSBnYW1lIGlzIFBPU1RFRCBhbmQgYWxsIHNob3RzIGFyZSBQT1NURURcclxuICAgIC8vIHRoZW4gZnVuY3Rpb25zIGFyZSBjYWxsZWQgdG8gcmVsb2FkIHRoZSBtYXN0ZXIgY29udGFpbmVyIGFuZCByZXNldCBnbG9iYWwgc2hvdCBkYXRhIHZhcmlhYmxlc1xyXG5cclxuICAgIGlmIChzYXZpbmdFZGl0ZWRHYW1lKSB7XHJcbiAgICAgIC8vIHVzZSBJRCBvZiBnYW1lIHN0b3JlZCBpbiBnbG9iYWwgdmFyXHJcbiAgICAgIEFQSS5wdXRJdGVtKGBnYW1lcy8ke3NhdmVkR2FtZU9iamVjdC5pZH1gLCBnYW1lRGF0YU9iailcclxuICAgICAgICAudGhlbihnYW1lUFVUID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUIEdBTUVcIiwgZ2FtZVBVVClcclxuICAgICAgICAgIC8vIHBvc3Qgc2hvdHMgd2l0aCBnYW1lSWRcclxuICAgICAgICAgIGNvbnN0IHNob3RBcnIgPSBzaG90RGF0YS5nZXRTaG90T2JqZWN0c0ZvclNhdmluZygpO1xyXG4gICAgICAgICAgY29uc3QgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIgPSBbXTtcclxuICAgICAgICAgIGNvbnN0IHNob3RzTm90WWV0UG9zdGVkQXJyID0gW107XHJcblxyXG4gICAgICAgICAgLy8gY3JlYXRlIGFycmF5cyBmb3IgUFVUIGFuZCBQT1NUIGZ1bmN0aW9ucyAoaWYgdGhlcmUncyBhbiBpZCBpbiB0aGUgYXJyYXksIGl0J3MgYmVlbiBzYXZlZCB0byB0aGUgZGF0YWJhc2UgYmVmb3JlKVxyXG4gICAgICAgICAgc2hvdEFyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc2hvdC5pZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIucHVzaChzaG90KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzaG90c05vdFlldFBvc3RlZEFyci5wdXNoKHNob3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRvIFBVVCBhbmQgUE9TVFxyXG4gICAgICAgICAgLy8gY2FsbCBmdW5jdGlvbnMgdGhhdCBjbGVhciBnYW1lcGxheSBjb250ZW50IGFuZCByZXNldCBnbG9iYWwgc2hvdC9nYW1lIGRhdGEgdmFyaWFibGVzXHJcbiAgICAgICAgICBnYW1lRGF0YS5wdXRFZGl0ZWRTaG90cyhwcmV2aW91c2x5U2F2ZWRTaG90c0FycilcclxuICAgICAgICAgICAgLnRoZW4oeCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQVVRTOlwiLCB4KVxyXG4gICAgICAgICAgICAgIC8vIGlmIG5vIG5ldyBzaG90cyB3ZXJlIG1hZGUsIHJlbG9hZC4gZWxzZSBwb3N0IG5ldyBzaG90c1xyXG4gICAgICAgICAgICAgIGlmIChzaG90c05vdFlldFBvc3RlZEFyci5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZ2FtZURhdGEucG9zdE5ld1Nob3RzTWFkZUR1cmluZ0VkaXRNb2RlKHNob3RzTm90WWV0UG9zdGVkQXJyKVxyXG4gICAgICAgICAgICAgICAgICAudGhlbih5ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBPU1RTOlwiLCB5KVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5wb3N0SXRlbShcImdhbWVzXCIsIGdhbWVEYXRhT2JqKVxyXG4gICAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5pZClcclxuICAgICAgICAudGhlbihnYW1lSWQgPT4ge1xyXG4gICAgICAgICAgZ2FtZURhdGEucG9zdE5ld1Nob3RzKGdhbWVJZClcclxuICAgICAgICAgICAgLnRoZW4oeiA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTQVZFRCBORVcgU0hPVFNcIiwgeik7XHJcbiAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBwYWNrYWdlR2FtZURhdGEoKSB7XHJcbiAgICAvLyBnZXQgdXNlciBJRCBmcm9tIHNlc3Npb24gc3RvcmFnZVxyXG4gICAgLy8gcGFja2FnZSBlYWNoIGlucHV0IGZyb20gZ2FtZSBkYXRhIGNvbnRhaW5lciBpbnRvIHZhcmlhYmxlc1xyXG5cclxuICAgIC8vIGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBwcmV2ZW50IGJsYW5rIHNjb3JlIGVudHJpZXMgLi4uLiBlbHNlIHNhdmUgZ2FtZSBhbmQgc2hvdHMgdG8gZGF0YWJhc2VcclxuICAgIGNvbnN0IGlucHRfbXlTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF90aGVpclNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aGVpclNjb3JlSW5wdXRcIik7XHJcbiAgICAvLyBnZXQgbnVtYmVyIG9mIHNob3RzIGN1cnJlbnRseSBzYXZlZC4gSWYgdGhlcmUgYXJlbid0IGFueSwgdGhlbiB0aGUgdXNlciBjYW4ndCBzYXZlIHRoZSBnYW1lXHJcbiAgICBsZXQgc2hvdHMgPSBzaG90RGF0YS5nZXRTaG90T2JqZWN0c0ZvclNhdmluZygpLmxlbmd0aFxyXG5cclxuICAgIGlmIChzaG90cyA9PT0gMCkge1xyXG4gICAgICBhbGVydChcIkEgZ2FtZSBjYW5ub3QgYmUgc2F2ZWQgd2l0aG91dCBhdCBsZWFzdCBvbmUgZ29hbCBzY29yZWQuXCIpO1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoaW5wdF9teVNjb3JlLnZhbHVlID09PSBcIlwiIHx8IGlucHRfdGhlaXJTY29yZS52YWx1ZSA9PT0gXCJcIiB8fCBpbnB0X215U2NvcmUudmFsdWUgPT09IGlucHRfdGhlaXJTY29yZS52YWx1ZSkge1xyXG4gICAgICBhbGVydChcIlBsZWFzZSBlbnRlciBzY29yZXMuIE5vIHRpZSBnYW1lcyBhY2NlcHRlZC5cIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBwbGF5ZXJJZFxyXG4gICAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKSk7XHJcblxyXG4gICAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuICAgICAgbGV0IGdhbWVUeXBlID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IHtcclxuICAgICAgICBpZiAoYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKSB7XHJcbiAgICAgICAgICBnYW1lVHlwZSA9IGJ0bi50ZXh0Q29udGVudFxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIGdhbWUgbW9kZSAobm90ZTogZGlkIG5vdCB1c2UgYm9vbGVhbiBpbiBjYXNlIG1vcmUgZ2FtZSBtb2RlcyBhcmUgc3VwcG9ydGVkIGluIHRoZSBmdXR1cmUpXHJcbiAgICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxfZ2FtZU1vZGUudmFsdWUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgIC8vIG15IHRlYW1cclxuICAgICAgY29uc3Qgc2VsX3RlYW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlYW1JbnB1dFwiKTtcclxuICAgICAgbGV0IHRlYW1lZFVwO1xyXG4gICAgICBpZiAoc2VsX3RlYW0udmFsdWUgPT09IFwiTm8gcGFydHlcIikge1xyXG4gICAgICAgIHRlYW1lZFVwID0gZmFsc2U7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGVhbWVkVXAgPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzY29yZXNcclxuICAgICAgbGV0IG15U2NvcmU7XHJcbiAgICAgIGxldCB0aGVpclNjb3JlO1xyXG5cclxuICAgICAgbXlTY29yZSA9IE51bWJlcihpbnB0X215U2NvcmUudmFsdWUpO1xyXG4gICAgICB0aGVpclNjb3JlID0gTnVtYmVyKGlucHRfdGhlaXJTY29yZS52YWx1ZSk7XHJcblxyXG4gICAgICAvLyBvdmVydGltZVxyXG4gICAgICBsZXQgb3ZlcnRpbWU7XHJcbiAgICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgICAgaWYgKHNlbF9vdmVydGltZS52YWx1ZSA9PT0gXCJPdmVydGltZVwiKSB7XHJcbiAgICAgICAgb3ZlcnRpbWUgPSB0cnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG92ZXJ0aW1lID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBnYW1lRGF0YU9iaiA9IHtcclxuICAgICAgICBcInVzZXJJZFwiOiBhY3RpdmVVc2VySWQsXHJcbiAgICAgICAgXCJtb2RlXCI6IGdhbWVNb2RlLFxyXG4gICAgICAgIFwidHlwZVwiOiBnYW1lVHlwZSxcclxuICAgICAgICBcInBhcnR5XCI6IHRlYW1lZFVwLFxyXG4gICAgICAgIFwic2NvcmVcIjogbXlTY29yZSxcclxuICAgICAgICBcIm9wcF9zY29yZVwiOiB0aGVpclNjb3JlLFxyXG4gICAgICAgIFwib3ZlcnRpbWVcIjogb3ZlcnRpbWUsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSBuZXcgZ2FtZSBvciBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZC4gSWYgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQsIHRoZW4gdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHNob3Qgc2F2ZWQgYWxyZWFkeSwgbWFraW5nIHRoZSByZXR1cm4gZnJvbSB0aGUgc2hvdERhdGEgZnVuY3Rpb24gbW9yZSB0aGFuIDBcclxuICAgICAgY29uc3Qgc2F2aW5nRWRpdGVkR2FtZSA9IHNob3REYXRhLmdldEluaXRpYWxOdW1PZlNob3RzKClcclxuICAgICAgaWYgKHNhdmluZ0VkaXRlZEdhbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHNhdmVkR2FtZU9iamVjdC50aW1lU3RhbXBcclxuICAgICAgICBnYW1lRGF0YS5zYXZlRGF0YShnYW1lRGF0YU9iaiwgdHJ1ZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gdGltZSBzdGFtcCBpZiBuZXcgZ2FtZVxyXG4gICAgICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHRpbWVTdGFtcFxyXG4gICAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCBmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVByZXZHYW1lRWRpdHMoKSB7XHJcbiAgICBnYW1lRGF0YS5wYWNrYWdlR2FtZURhdGEoKTtcclxuICB9LFxyXG5cclxuICBjYW5jZWxFZGl0aW5nTW9kZSgpIHtcclxuICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyRWRpdEJ1dHRvbnMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlbW92ZXMgJiByZXBsYWNlcyBlZGl0IGFuZCBzYXZlIGdhbWUgYnV0dG9ucyB3aXRoIFwiU2F2ZSBFZGl0c1wiIGFuZCBcIkNhbmNlbCBFZGl0c1wiXHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgLy8gaW4gY2FzZSBvZiBsYWcgaW4gZmV0Y2gsIHByZXZlbnQgdXNlciBmcm9tIGRvdWJsZSBjbGlja2luZyBidXR0b25cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuZGlzYWJsZWQgPSB0cnVlO1xyXG5cclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIEVkaXRzXCIpXHJcbiAgICBjb25zdCBidG5fc2F2ZUVkaXRzID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgRWRpdHNcIilcclxuXHJcbiAgICBidG5fY2FuY2VsRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmNhbmNlbEVkaXRpbmdNb2RlKVxyXG4gICAgYnRuX3NhdmVFZGl0cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuc2F2ZVByZXZHYW1lRWRpdHMpXHJcblxyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5yZXBsYWNlV2l0aChidG5fY2FuY2VsRWRpdHMpO1xyXG4gICAgYnRuX3NhdmVHYW1lLnJlcGxhY2VXaXRoKGJ0bl9zYXZlRWRpdHMpO1xyXG5cclxuICB9LFxyXG5cclxuICByZW5kZXJQcmV2R2FtZShnYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIHNhdmVkIGdhbWUgaW5mb3JtYXRpb24gaW4gdGhlIFwiRW50ZXIgR2FtZSBEYXRhXCIgY29udGFpbmVyLlxyXG4gICAgLy8gaXQgcmVsaWVzIG9uIGEgZnVuY3Rpb24gaW4gc2hvdERhdGEuanMgdG8gcmVuZGVyIHRoZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnNvbGUubG9nKGdhbWUpXHJcblxyXG4gICAgLy8gY2FsbCBmdW5jdGlvbiBpbiBzaG90RGF0YSB0aGF0IGNhbGxzIGdhbWFEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIHdpbGwgY2FwdHVyZSB0aGUgYXJyYXkgb2Ygc2F2ZWQgc2hvdHMgYW5kIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5yZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKClcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUub3ZlcnRpbWUpIHtcclxuICAgICAgc2VsX292ZXJ0aW1lLnZhbHVlID0gXCJPdmVydGltZVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfb3ZlcnRpbWUudmFsdWUgPSBcIk5vIG92ZXJ0aW1lXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBteSB0ZWFtXHJcbiAgICBjb25zdCBzZWxfdGVhbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUucGFydHkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHNlbF90ZWFtLnZhbHVlID0gXCJObyBwYXJ0eVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfdGVhbS52YWx1ZSA9IFwiUGFydHlcIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNjb3JlXHJcbiAgICBjb25zdCBpbnB0X215U2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15U2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfdGhlaXJTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGhlaXJTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIGlucHRfbXlTY29yZS52YWx1ZSA9IGdhbWUuc2NvcmU7XHJcbiAgICBpbnB0X3RoZWlyU2NvcmUudmFsdWUgPSBnYW1lLm9wcF9zY29yZTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcblxyXG4gICAgaWYgKGdhbWUudHlwZSA9PT0gXCIzdjNcIikge1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzN2My5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgLy8gMnYyIGlzIHRoZSBkZWZhdWx0XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIGlmIChnYW1lLnR5cGUgPT09IFwiMnYyXCIpIHtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzF2MS5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5tb2RlID0gXCJjb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIHNlbF9nYW1lTW9kZS52YWx1ZSA9IFwiQ29tcGV0aXRpdmVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDYXN1YWxcIlxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBwcm92aWRlU2hvdHNUb1Nob3REYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBwcm92aWRlcyB0aGUgc2hvdHMgZm9yIHJlbmRlcmluZyB0byBzaG90RGF0YVxyXG4gICAgcmV0dXJuIHNhdmVkR2FtZU9iamVjdFxyXG4gIH0sXHJcblxyXG4gIGVkaXRQcmV2R2FtZSgpIHtcclxuICAgIC8vIGZldGNoIGNvbnRlbnQgZnJvbSBtb3N0IHJlY2VudCBnYW1lIHNhdmVkIHRvIGJlIHJlbmRlcmVkXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYCR7YWN0aXZlVXNlcklkfT9fZW1iZWQ9Z2FtZXNgKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBpZiAodXNlci5nYW1lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBhbGVydChcIk5vIGdhbWVzIGhhdmUgYmVlbiBzYXZlZCBieSB0aGlzIHVzZXJcIik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IG1heCBnYW1lIGlkICh3aGljaCBpcyB0aGUgbW9zdCByZWNlbnQgZ2FtZSBzYXZlZClcclxuICAgICAgICBjb25zdCByZWNlbnRHYW1lSWQgPSB1c2VyLmdhbWVzLnJlZHVjZSgobWF4LCBvYmopID0+IG9iai5pZCA+IG1heCA/IG9iai5pZCA6IG1heCwgdXNlci5nYW1lc1swXS5pZCk7XHJcbiAgICAgICAgLy8gZmV0Y2ggbW9zdCByZWNlbnQgZ2FtZSBhbmQgZW1iZWQgc2hvdHNcclxuICAgICAgICBBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGAke3JlY2VudEdhbWVJZH0/X2VtYmVkPXNob3RzYCkudGhlbihnYW1lT2JqID0+IHtcclxuICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJFZGl0QnV0dG9ucygpO1xyXG4gICAgICAgICAgc2F2ZWRHYW1lT2JqZWN0ID0gZ2FtZU9iajtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlclByZXZHYW1lKGdhbWVPYmopO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZURhdGEiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBnYW1lcGxheSA9IHtcclxuXHJcbiAgbG9hZEdhbWVwbGF5KCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgLy8gY29uc3QgeEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJkZWxldGVcIiB9KTtcclxuICAgIC8vIHhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQm94LCBldmVudCk7IC8vIGJ1dHRvbiB3aWxsIGRpc3BsYXk6IG5vbmUgb24gcGFyZW50IGNvbnRhaW5lclxyXG4gICAgLy8gY29uc3QgaGVhZGVySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb24gaXMtaW5mb1wiIH0sIFwiQ3JlYXRlIGFuZCBzYXZlIHNob3RzIC0gdGhlbiBzYXZlIHRoZSBnYW1lIHJlY29yZC5cIiwgeEJ1dHRvbik7XHJcbiAgICAvLyB3ZWJwYWdlLmFwcGVuZENoaWxkKGhlYWRlckluZm8pO1xyXG4gICAgdGhpcy5idWlsZFNob3RDb250ZW50KCk7XHJcbiAgICB0aGlzLmJ1aWxkR2FtZUNvbnRlbnQoKTtcclxuICAgIHRoaXMuZ2FtZXBsYXlFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBidWlsZFNob3RDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgc2hvdCBjb250YWluZXJzIGFuZCBhZGRzIGNvbnRhaW5lciBjb250ZW50XHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBzaG90VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBTaG90IERhdGFcIik7XHJcbiAgICBjb25zdCBzaG90VGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90VGl0bGUpO1xyXG5cclxuICAgIC8vIG5ldyBzaG90IGFuZCBzYXZlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3QgbmV3U2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJuZXdTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiTmV3IFNob3RcIik7XHJcbiAgICBjb25zdCBzYXZlU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgU2hvdFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbFNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIFNob3RcIik7XHJcbiAgICBjb25zdCBzaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJzaG90Q29udHJvbHNcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gYnV0dG9uc1wiIH0sIG51bGwsIG5ld1Nob3QsIHNhdmVTaG90LCBjYW5jZWxTaG90KTtcclxuICAgIGNvbnN0IGFsaWduU2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIHNob3RCdXR0b25zKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnblNob3RCdXR0b25zKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGlucHV0IGFuZCBhZXJpYWwgc2VsZWN0XHJcbiAgICBjb25zdCBiYWxsU3BlZWRJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtYm9sdFwiIH0pO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkSWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIGJhbGxTcGVlZEljb24pO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJCYWxsIHNwZWVkIChtcGgpOlwiKVxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJiYWxsU3BlZWRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBiYWxsIHNwZWVkXCIgfSk7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnQgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGJhbGxTcGVlZElucHV0LCBiYWxsU3BlZWRJY29uU3BhbilcclxuXHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiYWVyaWFsSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbE9wdGlvbjEsIGFlcmlhbE9wdGlvbjIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdCk7XHJcbiAgICBjb25zdCBhZXJpYWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdFBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgYmFsbFNwZWVkSW5wdXRUaXRsZSwgYmFsbFNwZWVkQ29udHJvbCwgYWVyaWFsQ29udHJvbCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlsc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNob3REZXRhaWxzKTtcclxuXHJcbiAgICAvLyBmaWVsZCBhbmQgZ29hbCBpbWFnZXMgKG5vdGUgZmllbGQtaW1nIGlzIGNsaXBwZWQgdG8gcmVzdHJpY3QgY2xpY2sgYXJlYSBjb29yZGluYXRlcyBpbiBsYXRlciBmdW5jdGlvbi5cclxuICAgIC8vIGdvYWwtaW1nIHVzZXMgYW4geC95IGZvcm11bGEgZm9yIGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgcmVzdHJpY3Rpb24sIHNpbmNlIGl0J3MgYSByZWN0YW5nbGUpXHJcbiAgICAvLyBhZGRpdGlvbmFsbHksIGZpZWxkIGFuZCBnb2FsIGFyZSBub3QgYWxpZ25lZCB3aXRoIGxldmVsLWxlZnQgb3IgbGV2ZWwtcmlnaHQgLSBpdCdzIGEgZGlyZWN0IGxldmVsIC0tPiBsZXZlbC1pdGVtIGZvciBjZW50ZXJpbmdcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25GaWVsZCwgYWxpZ25Hb2FsKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIGhvbGRpbmcgYWxsIHNob3QgaW5mb3JtYXRpb25cclxuICAgIGNvbnN0IHBhcmVudFNob3RDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHNob3RUaXRsZUNvbnRhaW5lciwgc2hvdEJ1dHRvbkNvbnRhaW5lciwgc2hvdERldGFpbHNDb250YWluZXIsIHNob3RDb29yZGluYXRlc0NvbnRhaW5lcilcclxuXHJcbiAgICAvLyBhcHBlbmQgc2hvdHMgY29udGFpbmVyIHRvIHBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50U2hvdENvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHYW1lQ29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gY3JlYXRlcyBnYW1lIGNvbnRlbnQgY29udGFpbmVycyAodGVhbSwgZ2FtZSB0eXBlLCBnYW1lIG1vZGUsIGV0Yy4pXHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBnYW1lVGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBHYW1lIERhdGFcIik7XHJcbiAgICBjb25zdCB0aXRsZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUaXRsZSk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSB0b3AgY29udGFpbmVyXHJcblxyXG4gICAgLy8gMXYxLzJ2Mi8zdjMgYnV0dG9ucyAobm90ZTogY29udHJvbCBjbGFzcyBpcyB1c2VkIHdpdGggZmllbGQgdG8gYWRoZXJlIGJ1dHRvbnMgdG9nZXRoZXIpXHJcbiAgICBjb25zdCBnYW1lVHlwZTN2MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfM3YzXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjMpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzJ2MlwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXNlbGVjdGVkIGlzLWxpbmtcIiB9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUydjIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzF2MVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIxdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMXYxKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaGFzLWFkZG9uc1wiIH0sIG51bGwsIGdhbWVUeXBlM3YzQ29udHJvbCwgZ2FtZVR5cGUydjJDb250cm9sLCBnYW1lVHlwZTF2MUNvbnRyb2wpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZSBzZWxlY3RcclxuICAgIGNvbnN0IG1vZGVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNhc3VhbFwiKTtcclxuICAgIGNvbnN0IG1vZGVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNvbXBldGl0aXZlXCIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJnYW1lTW9kZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlT3B0aW9uMSwgbW9kZU9wdGlvbjIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlU2VsZWN0KTtcclxuICAgIGNvbnN0IG1vZGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBtb2RlU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyB0ZWFtIHNlbGVjdFxyXG4gICAgY29uc3QgdGVhbU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gcGFydHlcIik7XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJQYXJ0eVwiKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwidGVhbUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtT3B0aW9uMSwgdGVhbU9wdGlvbjIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtU2VsZWN0KTtcclxuICAgIGNvbnN0IHRlYW1Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCB0ZWFtU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyBvdmVydGltZSBzZWxlY3RcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBvdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcIm92ZXJ0aW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lT3B0aW9uMSwgb3ZlcnRpbWVPcHRpb24yKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0KTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIGNvbHVtbiBsYXlvdXQgLSBlbXB0eSBjb2x1bW4gd2lkdGggMS8xMiBvZiBjb250YWluZXIgb24gbGVmdCBhbmQgcmlnaHRcclxuICAgIGNvbnN0IHNlbGVjdEZpZWxkMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgY29sdW1uIGlzLTMgaXMtb2Zmc2V0LTFcIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkZpZWxkKTtcclxuICAgIGNvbnN0IHNlbGVjdEZpZWxkMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgY29sdW1uIGlzLTJcIiB9LCBudWxsLCBtb2RlQ29udHJvbCk7XHJcbiAgICBjb25zdCBzZWxlY3RGaWVsZDMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGNvbHVtbiBpcy0yXCIgfSwgbnVsbCwgdGVhbUNvbnRyb2wpO1xyXG4gICAgY29uc3Qgc2VsZWN0RmllbGQ0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBjb2x1bW4gaXMtM1wiIH0sIG51bGwsIG92ZXJ0aW1lQ29udHJvbCk7XHJcbiAgICBjb25zdCBlbXB0eUNvbHVtblJpZ2h0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy0xXCIgfSk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSBib3R0b20gY29udGFpbmVyXHJcbiAgICBjb25zdCBteVNjb3JlSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWhhbmRzaGFrZVwiIH0pO1xyXG4gICAgY29uc3QgbXlTY29yZUljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsIGlzLWxlZnRcIiB9LCBudWxsLCBteVNjb3JlSWNvbik7XHJcbiAgICBjb25zdCBteVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJteVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwibXkgdGVhbSdzIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCBteVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGlzLWV4cGFuZGVkIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgbXlTY29yZUlucHV0LCBteVNjb3JlSWNvblNwYW4pO1xyXG5cclxuICAgIGNvbnN0IHRoZWlyU2NvcmVJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXIgZmEtaGFuZHNoYWtlXCIgfSk7XHJcbiAgICBjb25zdCB0aGVpclNjb3JlSWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHRoZWlyU2NvcmVJY29uKTtcclxuICAgIGNvbnN0IHRoZWlyU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInRoZWlyU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJvcHBvbmVudCdzIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCB0aGVpclNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGlzLWV4cGFuZGVkIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgdGhlaXJTY29yZUlucHV0LCB0aGVpclNjb3JlSWNvblNwYW4pO1xyXG5cclxuICAgIGNvbnN0IG15U2NvcmVGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWRcIiB9LCBudWxsLCBteVNjb3JlQ29udHJvbCk7XHJcbiAgICBjb25zdCB0aGVpclNjb3JlRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkXCIgfSwgbnVsbCwgdGhlaXJTY29yZUNvbnRyb2wpO1xyXG4gICAgY29uc3QgbXlTY29yZUNvbHVtbiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtMyBpcy1vZmZzZXQtMVwiIH0sIG51bGwsIG15U2NvcmVGaWVsZCk7XHJcbiAgICBjb25zdCB0aGVpcnNjb3JlQ29sdW1uID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy0zXCIgfSwgbnVsbCwgdGhlaXJTY29yZUZpZWxkKTtcclxuXHJcbiAgICAvLyBlZGl0L3NhdmUgZ2FtZSBidXR0b25zXHJcbiAgICBjb25zdCBlZGl0UHJldmlvdXNHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImVkaXRQcmV2R2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRWRpdCBQcmV2aW91cyBHYW1lXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUdhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEdhbWVcIik7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQWxpZ25tZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnMgaXMtY2VudGVyZWRcIiB9LCBudWxsLCBzYXZlR2FtZSwgZWRpdFByZXZpb3VzR2FtZSk7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtblwiIH0sIG51bGwsIGdhbWVCdXR0b25BbGlnbm1lbnQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyVG9wID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBzZWxlY3RGaWVsZDEsIHNlbGVjdEZpZWxkMiwgc2VsZWN0RmllbGQzLCBzZWxlY3RGaWVsZDQsIGVtcHR5Q29sdW1uUmlnaHQpO1xyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lckJvdHRvbSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW5zXCIgfSwgbnVsbCwgbXlTY29yZUNvbHVtbiwgdGhlaXJzY29yZUNvbHVtbiwgZ2FtZUJ1dHRvbkNvbnRhaW5lcik7XHJcbiAgICBjb25zdCBwYXJlbnRHYW1lQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCB0aXRsZUNvbnRhaW5lciwgZ2FtZUNvbnRhaW5lclRvcCwgZ2FtZUNvbnRhaW5lckJvdHRvbSk7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudEdhbWVDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5RXZlbnRNYW5hZ2VyKCkge1xyXG5cclxuICAgIC8vIGJ1dHRvbnNcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzXHJcbiAgICBidG5fbmV3U2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY3JlYXRlTmV3U2hvdCk7XHJcbiAgICBidG5fc2F2ZVNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnNhdmVTaG90KTtcclxuICAgIGJ0bl9jYW5jZWxTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jYW5jZWxTaG90KTtcclxuICAgIGJ0bl9zYXZlR2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEucGFja2FnZUdhbWVEYXRhKTtcclxuICAgIGdhbWVUeXBlQnRucy5mb3JFYWNoKGJ0biA9PiBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmdhbWVUeXBlQnV0dG9uVG9nZ2xlKSk7XHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5lZGl0UHJldkdhbWUpXHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVwbGF5IiwiaW1wb3J0IGhlYXRtYXAgZnJvbSBcIi4uL2xpYi9ub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUEkuanNcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlci5qc1wiO1xyXG5pbXBvcnQgZGF0ZUZpbHRlciBmcm9tIFwiLi9kYXRlRmlsdGVyLmpzXCI7XHJcbmltcG9ydCBmZWVkYmFjayBmcm9tIFwiLi9oZWF0bWFwRmVlZGJhY2tcIjtcclxuXHJcbi8vIElEIG9mIHNldEludGVydmFsIGZ1bmN0aW9uIHVzZWQgdG8gbW9uaXRvciBjb250YWluZXIgd2lkdGggYW5kIHJlcGFpbnQgaGVhdG1hcCBpZiBjb250YWluZXIgd2lkdGggY2hhbmdlc1xyXG5sZXQgaW50ZXJ2YWxJZDtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHRvIHN0b3JlIGZldGNoZWQgc2hvdHNcclxubGV0IGdsb2JhbFNob3RzQXJyO1xyXG5sZXQgam9pblRhYmxlQXJyID0gW107XHJcbi8vIGdsb2JhbCB2YXJpYWJsZSB1c2VkIHdpdGggYmFsbCBzcGVlZCBmaWx0ZXIgb24gaGVhdG1hcHNcclxubGV0IGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gZmFsc2U7XHJcbi8vIGdsb2JhbCB2YXJpYWJsZXMgdXNlZCB3aXRoIGRhdGUgcmFuZ2UgZmlsdGVyXHJcbmxldCBzdGFydERhdGU7XHJcbmxldCBlbmREYXRlO1xyXG5cclxuY29uc3QgaGVhdG1hcERhdGEgPSB7XHJcblxyXG4gIGdldFVzZXJTaG90cygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVtb3ZlcyBhbiBleGlzdGluZyBoZWF0bWFwIGlmIG5lY2Vzc2FyeSBhbmQgdGhlbiBkZXRlcm1pbmVzIHdoZXRoZXJcclxuICAgIC8vIHRvIGNhbGwgdGhlIGJhc2ljIGhlYXRtYXAgb3Igc2F2ZWQgaGVhdG1hcCBmdW5jdGlvbnNcclxuXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG5cclxuICAgIGNvbnN0IGhlYXRtYXBOYW1lID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXVxyXG4gICAgY29uc3QgZ29hbEhlYXRtYXBDYW52YXMgPSBnb2FsQ29udGFpbmVyLmNoaWxkTm9kZXNbMV1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIGFscmVhZHkgYSBoZWF0bWFwIGxvYWRlZCwgcmVtb3ZlIGl0IGJlZm9yZSBjb250aW51aW5nXHJcbiAgICBpZiAoZmllbGRIZWF0bWFwQ2FudmFzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZmllbGRIZWF0bWFwQ2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICBnb2FsSGVhdG1hcENhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgaWYgKGhlYXRtYXBOYW1lID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaGVhdG1hcE5hbWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBmZXRjaEJhc2ljSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIGRhdGFiYXNlIGFuZCByZXRyaWV2ZXMgc2hvdHMgdGhhdCBtZWV0IHNwZWNpZmljIGZpbHRlcnMgKGFsbCBzaG90cyBmZXRjaGVkIGlmIClcclxuICAgIGxldCBnYW1lSWRzX2RhdGUgPSBbXTtcclxuICAgIGxldCBnYW1lSWRzX3Jlc3VsdCA9IFtdO1xyXG4gICAgbGV0IGdhbWVJZHMgPSBbXTsgLy8gYXJyYXkgdGhhdCBjb250YWlucyBnYW1lIElEIHZhbHVlcyBwYXNzaW5nIGJvdGggdGhlIGRhdGUgYW5kIGdhbWUgcmVzdWx0IGZpbHRlcnNcclxuICAgIGNvbnN0IGdhbWVSZXN1bHRGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lUmVzdWx0XCIpLnZhbHVlO1xyXG4gICAgY29uc3QgZ2FtZVVSTGV4dGVuc2lvbiA9IGhlYXRtYXBEYXRhLmFwcGx5R2FtZUZpbHRlcnMoKTtcclxuXHJcbiAgICBBUEkuZ2V0QWxsKGdhbWVVUkxleHRlbnNpb24pXHJcbiAgICAgIC50aGVuKGdhbWVzID0+IHtcclxuICAgICAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICAgICAgLy8gdGhlIGRhdGUgZmlsdGVyIGFuZCBnYW1lIHJlc3VsdHMgZmlsdGVycyBjYW5ub3QgYmUgYXBwbGllZCBpbiB0aGUgSlNPTiBzZXJ2ZXIgVVJMLCBzbyB0aGUgZmlsdGVycyBhcmVcclxuICAgICAgICAgIC8vIGNhbGxlZCBoZXJlLiBFYWNoIGZ1bmN0aW9uIHBvcHVsYXRlcyBhbiBhcnJheSB3aXRoIGdhbWUgSURzIHRoYXQgbWF0Y2ggdGhlIGZpbHRlciByZXF1aXJlbWVudHMuXHJcbiAgICAgICAgICAvLyBhIGZpbHRlciBtZXRob2QgaXMgdGhlbiB1c2VkIHRvIGNvbGxlY3QgYWxsIG1hdGNoaW5nIGdhbWUgSURzIGZyb20gdGhlIHR3byBhcnJheXMgKGkuZS4gYSBnYW1lIHRoYXQgcGFzc2VkXHJcbiAgICAgICAgICAvLyB0aGUgcmVxdWlyZW1lbnRzIG9mIGJvdGggZmlsdGVycylcclxuICAgICAgICAgIC8vIE5PVEU6IGlmIHN0YXJ0IGRhdGUgaXMgbm90IGRlZmluZWQsIHRoZSByZXN1bHQgZmlsdGVyIGlzIHRoZSBvbmx5IGZ1bmN0aW9uIGNhbGxlZCwgYW5kIGl0IGlzIHBhc3NlZCB0aGUgdGhpcmQgYXJyYXlcclxuICAgICAgICAgIGlmIChzdGFydERhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBkYXRlRmlsdGVyLmFwcGx5ZGF0ZUZpbHRlcihzdGFydERhdGUsIGVuZERhdGUsIGdhbWVJZHNfZGF0ZSwgZ2FtZSk7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmFwcGx5R2FtZVJlc3VsdEZpbHRlcihnYW1lUmVzdWx0RmlsdGVyLCBnYW1lSWRzX3Jlc3VsdCwgZ2FtZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5hcHBseUdhbWVSZXN1bHRGaWx0ZXIoZ2FtZVJlc3VsdEZpbHRlciwgZ2FtZUlkcywgZ2FtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZiAoc3RhcnREYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGdhbWVJZHMgPSBnYW1lSWRzX2RhdGUuZmlsdGVyKGlkID0+IGdhbWVJZHNfcmVzdWx0LmluY2x1ZGVzKGlkKSlcclxuICAgICAgICAgIHJldHVybiBnYW1lSWRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZ2FtZUlkcztcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oZ2FtZUlkcyA9PiB7XHJcbiAgICAgICAgaWYgKGdhbWVJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBhbGVydChcIlNvcnJ5ISBFaXRoZXIgbm8gc2hvdHMgaGF2ZSBiZWVuIHNhdmVkIHlldCBvciBubyBnYW1lcyBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLiBWaXNpdCB0aGUgR2FtZXBsYXkgcGFnZSB0byBnZXQgc3RhcnRlZCBvciB0byBhZGQgbW9yZSBzaG90cy5cIilcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBzaG90VVJMZXh0ZW5zaW9uID0gaGVhdG1hcERhdGEuYXBwbHlTaG90RmlsdGVycyhnYW1lSWRzKTtcclxuICAgICAgICAgIEFQSS5nZXRBbGwoc2hvdFVSTGV4dGVuc2lvbilcclxuICAgICAgICAgICAgLnRoZW4oc2hvdHMgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChzaG90cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiU29ycnkhIE5vIHNob3RzIG1hdGNoIHRoZSBjdXJyZW50IGZpbHRlcnMuIFZpc2l0IHRoZSBHYW1lcGxheSBwYWdlIHRvIGdldCBzdGFydGVkIG9yIGFkZCB0byBtb3JlIHNob3RzLlwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGdsb2JhbFNob3RzQXJyID0gc2hvdHM7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgICAgIGZlZWRiYWNrLmxvYWRGZWVkYmFjayhzaG90cyk7XHJcbiAgICAgICAgICAgICAgICAvLyBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoaGVhdG1hcERhdGEuZ2V0QWN0aXZlT2Zmc2V0cywgNTAwKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9LFxyXG5cclxuICBmZXRjaFNhdmVkSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uLCBhbmQgaXRzIGNvdW50ZXJwYXJ0IGZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyByZW5kZXIgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwIHRob3VnaCB0aGVzZSBzdGVwczpcclxuICAgIC8vIDEuIGdldHRpbmcgdGhlIGhlYXRtYXAgbmFtZSBmcm9tIHRoZSBkcm9wZG93biB2YWx1ZVxyXG4gICAgLy8gMi4gdXNpbmcgdGhlIG5hbWUgdG8gZmluZCB0aGUgY2hpbGROb2RlcyBpbmRleCBvZiB0aGUgZHJvcGRvd24gdmFsdWUgKGkuZS4gd2hpY2ggSFRNTCA8b3B0aW9uPikgYW5kIGdldCBpdHMgSURcclxuICAgIC8vIDMuIGZldGNoIGFsbCBzaG90X2hlYXRtYXAgam9pbiB0YWJsZXMgd2l0aCBtYXRjaGluZyBoZWF0bWFwIElEXHJcbiAgICAvLyA0LiBmZXRjaCBzaG90cyB1c2luZyBzaG90IElEcyBmcm9tIGpvaW4gdGFibGVzXHJcbiAgICAvLyA1LiByZW5kZXIgaGVhdG1hcCBieSBjYWxsaW5nIGJ1aWxkIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8vIHN0ZXAgMTogZ2V0IG5hbWUgb2YgaGVhdG1hcFxyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBsZXQgY3VycmVudERyb3Bkb3duVmFsdWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcbiAgICAvLyBzdGVwIDI6IHVzZSBuYW1lIHRvIGdldCBoZWF0bWFwIElEIHN0b3JlZCBpbiBIVE1MIG9wdGlvbiBlbGVtZW50XHJcbiAgICBsZXQgY3VycmVudEhlYXRtYXBJZDtcclxuICAgIGhlYXRtYXBEcm9wZG93bi5jaGlsZE5vZGVzLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgICBpZiAoY2hpbGQudGV4dENvbnRlbnQgPT09IGN1cnJlbnREcm9wZG93blZhbHVlKSB7XHJcbiAgICAgICAgY3VycmVudEhlYXRtYXBJZCA9IGNoaWxkLmlkLnNsaWNlKDgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIHN0ZXAgMzogZmV0Y2ggam9pbiB0YWJsZXNcclxuICAgIEFQSS5nZXRBbGwoYHNob3RfaGVhdG1hcD9oZWF0bWFwSWQ9JHtjdXJyZW50SGVhdG1hcElkfWApXHJcbiAgICAgIC50aGVuKGpvaW5UYWJsZXMgPT4gaGVhdG1hcERhdGEuZmV0Y2hTYXZlZFNob3RzVXNpbmdKb2luVGFibGVzKGpvaW5UYWJsZXMpXHJcbiAgICAgICAgLy8gc3RlcCA1OiBwYXNzIHNob3RzIHRvIGJ1aWxkRmllbGRIZWF0bWFwKCkgYW5kIGJ1aWxkR29hbEhlYXRtYXAoKVxyXG4gICAgICAgIC50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgIC8vIGFwcGx5IGRhdGUgZmlsdGVyIGlmIGZpbHRlciBoYXMgYmVlbiBzZXRcclxuICAgICAgICAgIGlmIChzdGFydERhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsZXQgc2hvdHNNYXRjaGluZ0ZpbHRlciA9IFtdO1xyXG4gICAgICAgICAgICBkYXRlRmlsdGVyLmFwcGx5ZGF0ZUZpbHRlclRvU2F2ZWRIZWF0bWFwKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgc2hvdHMsIHNob3RzTWF0Y2hpbmdGaWx0ZXIpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90c01hdGNoaW5nRmlsdGVyIC8vIElNUE9SVEFOVCEgcHJldmVudHMgZXJyb3IgaW4gaGVhdG1hcCBzYXZlIHdoZW4gcmVuZGVyaW5nIHNhdmVkIG1hcCBhZnRlciByZW5kZXJpbmcgYmFzaWMgaGVhdG1hcFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90cyAvLyBJTVBPUlRBTlQhIHByZXZlbnRzIGVycm9yIGluIGhlYXRtYXAgc2F2ZSB3aGVuIHJlbmRlcmluZyBzYXZlZCBtYXAgYWZ0ZXIgcmVuZGVyaW5nIGJhc2ljIGhlYXRtYXBcclxuICAgICAgICAgICAgZmVlZGJhY2subG9hZEZlZWRiYWNrKHNob3RzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGpvaW5UYWJsZUFyciA9IFtdO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIClcclxuICB9LFxyXG5cclxuICBmZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMoam9pblRhYmxlcykge1xyXG4gICAgLy8gc2VlIG5vdGVzIG9uIGZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpXHJcbiAgICBqb2luVGFibGVzLmZvckVhY2godGFibGUgPT4ge1xyXG4gICAgICAvLyBzdGVwIDQuIHRoZW4gZmV0Y2ggdXNpbmcgZWFjaCBzaG90SWQgaW4gdGhlIGpvaW4gdGFibGVzXHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5nZXRTaW5nbGVJdGVtKFwic2hvdHNcIiwgdGFibGUuc2hvdElkKSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoam9pblRhYmxlQXJyKVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5R2FtZUZpbHRlcnMoKSB7XHJcbiAgICAvLyBOT1RFOiBnYW1lIHJlc3VsdCBmaWx0ZXIgKHZpY3RvcnkvZGVmZWF0KSBjYW5ub3QgYmUgYXBwbGllZCBpbiB0aGlzIGZ1bmN0aW9uIGFuZCBpcyBhcHBsaWVkIGFmdGVyIHRoZSBmZXRjaFxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZU1vZGVcIikudmFsdWU7XHJcbiAgICBjb25zdCBnYW1ldHlwZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVUeXBlXCIpLnZhbHVlO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1vdmVydGltZVwiKS52YWx1ZTtcclxuICAgIGNvbnN0IHRlYW1TdGF0dXNGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci10ZWFtU3RhdHVzXCIpLnZhbHVlO1xyXG5cclxuICAgIGxldCBVUkwgPSBcImdhbWVzXCI7XHJcblxyXG4gICAgVVJMICs9IGA/dXNlcklkPSR7YWN0aXZlVXNlcklkfWA7XHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGlmIChnYW1lTW9kZUZpbHRlciA9PT0gXCJDb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZtb2RlPWNvbXBldGl0aXZlXCJcclxuICAgIH0gZWxzZSBpZiAoZ2FtZU1vZGVGaWx0ZXIgPT09IFwiQ2FzdWFsXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm1vZGU9Y2FzdWFsXCJcclxuICAgIH1cclxuICAgIC8vIGdhbWUgdHlwZVxyXG4gICAgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjN2M1wiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTN2M1wiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjJ2MlwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTJ2MlwiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjF2MVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTF2MVwiXHJcbiAgICB9XHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgaWYgKG92ZXJ0aW1lRmlsdGVyID09PSBcIk9UXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm92ZXJ0aW1lPXRydWVcIlxyXG4gICAgfSBlbHNlIGlmIChvdmVydGltZUZpbHRlciA9PT0gXCJObyBPVFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZvdmVydGltZT1mYWxzZVwiXHJcbiAgICB9XHJcbiAgICAvLyB0ZWFtIHN0YXR1c1xyXG4gICAgaWYgKHRlYW1TdGF0dXNGaWx0ZXIgPT09IFwiTm8gcGFydHlcIikge1xyXG4gICAgICBVUkwgKz0gXCImcGFydHk9ZmFsc2VcIlxyXG4gICAgfSBlbHNlIGlmICh0ZWFtU3RhdHVzRmlsdGVyID09PSBcIlBhcnR5XCIpIHtcclxuICAgICAgVVJMICs9IFwiJnBhcnR5PXRydWVcIlxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBVUkw7XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlHYW1lUmVzdWx0RmlsdGVyKGdhbWVSZXN1bHRGaWx0ZXIsIGdhbWVJZHMsIGdhbWUpIHtcclxuICAgIC8vIGlmIHZpY3RvcnksIHRoZW4gY2hlY2sgZm9yIGdhbWUncyBzY29yZSB2cyBnYW1lJ3Mgb3Bwb25lbnQgc2NvcmVcclxuICAgIC8vIGlmIHRoZSBmaWx0ZXIgaXNuJ3Qgc2VsZWN0ZWQgYXQgYWxsLCBwdXNoIGFsbCBnYW1lIElEcyB0byBnYW1lSWRzIGFycmF5XHJcbiAgICBpZiAoZ2FtZVJlc3VsdEZpbHRlciA9PT0gXCJWaWN0b3J5XCIpIHtcclxuICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChnYW1lUmVzdWx0RmlsdGVyID09PSBcIkRlZmVhdFwiKSB7XHJcbiAgICAgIGlmIChnYW1lLnNjb3JlIDwgZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhcHBseVNob3RGaWx0ZXJzKGdhbWVJZHMpIHtcclxuICAgIGNvbnN0IHNob3RUeXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItc2hvdFR5cGVcIikudmFsdWU7XHJcbiAgICBsZXQgVVJMID0gXCJzaG90c1wiXHJcblxyXG4gICAgLy8gZ2FtZSBJRFxyXG4gICAgLy8gZm9yIGVhY2ggZ2FtZUlkLCBhcHBlbmQgVVJMLiBBcHBlbmQgJiBpbnN0ZWFkIG9mID8gb25jZSBmaXJzdCBnYW1lSWQgaXMgYWRkZWQgdG8gVVJMXHJcbiAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGxldCBnYW1lSWRDb3VudCA9IDA7XHJcbiAgICAgIGdhbWVJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgaWYgKGdhbWVJZENvdW50IDwgMSkge1xyXG4gICAgICAgICAgVVJMICs9IGA/Z2FtZUlkPSR7aWR9YDtcclxuICAgICAgICAgIGdhbWVJZENvdW50Kys7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFVSTCArPSBgJmdhbWVJZD0ke2lkfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSAvLyBlbHNlIHN0YXRlbWVudCBpcyBoYW5kbGVkIGluIGZldGNoQmFzaWNIZWF0bWFwRGF0YSgpXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGlmIChzaG90VHlwZUZpbHRlciA9PT0gXCJBZXJpYWxcIikge1xyXG4gICAgICBVUkwgKz0gXCImYWVyaWFsPXRydWVcIjtcclxuICAgIH0gZWxzZSBpZiAoc2hvdFR5cGVGaWx0ZXIgPT09IFwiU3RhbmRhcmRcIikge1xyXG4gICAgICBVUkwgKz0gXCImYWVyaWFsPWZhbHNlXCJcclxuICAgIH1cclxuICAgIHJldHVybiBVUkw7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpIHtcclxuICAgIC8vIGNyZWF0ZSBmaWVsZCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBsZXQgdmFyV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB2YXJIZWlnaHQgPSBmaWVsZENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgbGV0IGZpZWxkQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0RmllbGRDb25maWcoZmllbGRDb250YWluZXIpO1xyXG5cclxuICAgIGxldCBmaWVsZEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIGZpZWxkSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZmllbGRDb25maWcpO1xyXG5cclxuICAgIGxldCBmaWVsZERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZmllbGRYICogdmFyV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZmllbGRZICogdmFySGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIC8vIHNldCB2YWx1ZSBhcyBiYWxsIHNwZWVkIGlmIHNwZWVkIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgICB2YWx1ZV8gPSBzaG90LmJhbGxfc3BlZWQ7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IGZpZWxkT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZmllbGREYXRhUG9pbnRzLnB1c2goZmllbGRPYmopO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZmllbGREYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZmllbGREYXRhUG9pbnRzXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHNldCBtYXggdmFsdWUgYXMgbWF4IGJhbGwgc3BlZWQgaW4gc2hvdHMsIGlmIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgIGxldCBtYXhCYWxsU3BlZWQgPSBzaG90cy5yZWR1Y2UoKG1heCwgc2hvdCkgPT4gc2hvdC5iYWxsX3NwZWVkID4gbWF4ID8gc2hvdC5iYWxsX3NwZWVkIDogbWF4LCBzaG90c1swXS5iYWxsX3NwZWVkKTtcclxuICAgICAgZmllbGREYXRhLm1heCA9IG1heEJhbGxTcGVlZDtcclxuICAgIH1cclxuXHJcbiAgICBmaWVsZEhlYXRtYXBJbnN0YW5jZS5zZXREYXRhKGZpZWxkRGF0YSk7XHJcblxyXG4gICAgbGV0IGluaXRpYWxXaWR0aCA9IHZhcldpZHRoO1xyXG5cclxuICAgIGlmIChpbnRlcnZhbElkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcclxuICAgICAgaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHsgaGVhdG1hcERhdGEuZ2V0QWN0aXZlT2Zmc2V0cyhmaWVsZENvbnRhaW5lciwgaW5pdGlhbFdpZHRoLCBzaG90cyk7IH0sIDUwMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkgeyBoZWF0bWFwRGF0YS5nZXRBY3RpdmVPZmZzZXRzKGZpZWxkQ29udGFpbmVyLCBpbml0aWFsV2lkdGgsIHNob3RzKTsgfSwgNTAwKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgZ2V0QWN0aXZlT2Zmc2V0cyhmaWVsZENvbnRhaW5lciwgaW5pdGlhbFdpZHRoLCBzaG90cykge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlIHdpZHRoIG9mIHRoZSBoZWF0bWFwIGNvbnRhaW5lciBhdCAwLjUgc2Vjb25kIGludGVydmFscy4gSWYgdGhlIHdpZHRoIGhhcyBjaGFuZ2VkLFxyXG4gICAgLy8gdGhlbiB0aGUgaGVhdG1hcCBjYW52YXMgaXMgcmVwYWludGVkIHRvIGZpdCB3aXRoaW4gdGhlIGNvbnRhaW5lciBsaW1pdHNcclxuICAgIGxldCB3aWR0aCA9IGluaXRpYWxXaWR0aDtcclxuXHJcbiAgICBsZXQgY2FwdHVyZVdpZHRoID0gZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGhcclxuICAgIC8vZXZhbHVhdGUgY29udGFpbmVyIHdpZHRoIGFmdGVyIDAuNSBzZWNvbmRzIHZzIGluaXRpYWwgY29udGFpbmVyIHdpZHRoXHJcbiAgICBpZiAoY2FwdHVyZVdpZHRoID09PSB3aWR0aCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoID0gY2FwdHVyZVdpZHRoO1xyXG4gICAgICAvLyByZW1vdmUgY3VycmVudCBoZWF0bWFwc1xyXG4gICAgICBjb25zdCBoZWF0bWFwQ2FudmFzQXJyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5oZWF0bWFwLWNhbnZhc1wiKTtcclxuICAgICAgaGVhdG1hcENhbnZhc0FyclswXS5yZW1vdmUoKTtcclxuICAgICAgaGVhdG1hcENhbnZhc0FyclsxXS5yZW1vdmUoKTtcclxuICAgICAgLy8gcmVwYWludCBzYW1lIGhlYXRtYXAgaW5zdGFuY2VcclxuICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBidWlsZEdvYWxIZWF0bWFwKHNob3RzKSB7XHJcbiAgICAvLyBjcmVhdGUgZ29hbCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZ29hbENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgbGV0IHZhckdvYWxXaWR0aCA9IGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgdmFyR29hbEhlaWdodCA9IGdvYWxDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIGxldCBnb2FsQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKTtcclxuXHJcbiAgICBsZXQgR29hbEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIEdvYWxIZWF0bWFwSW5zdGFuY2UgPSBoZWF0bWFwLmNyZWF0ZShnb2FsQ29uZmlnKTtcclxuXHJcbiAgICBsZXQgZ29hbERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZ29hbFggKiB2YXJHb2FsV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZ29hbFkgKiB2YXJHb2FsSGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIC8vIHNldCB2YWx1ZSBhcyBiYWxsIHNwZWVkIGlmIHNwZWVkIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgICB2YWx1ZV8gPSBzaG90LmJhbGxfc3BlZWQ7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IGdvYWxPYmogPSB7IHg6IHhfLCB5OiB5XywgdmFsdWU6IHZhbHVlXyB9O1xyXG4gICAgICBnb2FsRGF0YVBvaW50cy5wdXNoKGdvYWxPYmopO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZ29hbERhdGEgPSB7XHJcbiAgICAgIG1heDogMSxcclxuICAgICAgbWluOiAwLFxyXG4gICAgICBkYXRhOiBnb2FsRGF0YVBvaW50c1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCBtYXggdmFsdWUgYXMgbWF4IGJhbGwgc3BlZWQgaW4gc2hvdHMsIGlmIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgIGxldCBtYXhCYWxsU3BlZWQgPSBzaG90cy5yZWR1Y2UoKG1heCwgc2hvdCkgPT4gc2hvdC5iYWxsX3NwZWVkID4gbWF4ID8gc2hvdC5iYWxsX3NwZWVkIDogbWF4LCBzaG90c1swXS5iYWxsX3NwZWVkKTtcclxuICAgICAgZ29hbERhdGEubWF4ID0gbWF4QmFsbFNwZWVkO1xyXG4gICAgfVxyXG5cclxuICAgIEdvYWxIZWF0bWFwSW5zdGFuY2Uuc2V0RGF0YShnb2FsRGF0YSk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0RmllbGRDb25maWcoZmllbGRDb250YWluZXIpIHtcclxuICAgIC8vIElkZWFsIHJhZGl1cyBpcyBhYm91dCAyNXB4IGF0IDU1MHB4IHdpZHRoLCBvciA0LjU0NSVcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvbnRhaW5lcjogZmllbGRDb250YWluZXIsXHJcbiAgICAgIHJhZGl1czogMC4wNDU0NTQ1NDUgKiBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aCxcclxuICAgICAgbWF4T3BhY2l0eTogLjYsXHJcbiAgICAgIG1pbk9wYWNpdHk6IDAsXHJcbiAgICAgIGJsdXI6IDAuOTI1XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGdldEdvYWxDb25maWcoZ29hbENvbnRhaW5lcikge1xyXG4gICAgLy8gSWRlYWwgcmFkaXVzIGlzIGFib3V0IDM1cHggYXQgNTUwcHggd2lkdGgsIG9yIDYuMzYzJVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29udGFpbmVyOiBnb2FsQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IC4wNjM2MzYzNjMgKiBnb2FsQ29udGFpbmVyLm9mZnNldFdpZHRoLFxyXG4gICAgICBtYXhPcGFjaXR5OiAuNixcclxuICAgICAgbWluT3BhY2l0eTogMCxcclxuICAgICAgYmx1cjogMC45MjVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgYmFsbFNwZWVkTWF4KCkge1xyXG4gICAgLy8gdGhpcyBidXR0b24gZnVuY3Rpb24gY2FsbGJhY2sgKGl0J3MgYSBmaWx0ZXIpIGNoYW5nZXMgYSBib29sZWFuIGdsb2JhbCB2YXJpYWJsZSB0aGF0IGRldGVybWluZXMgdGhlIG1pbiBhbmQgbWF4IHZhbHVlc1xyXG4gICAgLy8gdXNlZCB3aGVuIHJlbmRlcmluZyB0aGUgaGVhdG1hcHMgKHNlZSBidWlsZEZpZWxkSGVhdG1hcCgpIGFuZCBidWlsZEdvYWxIZWF0bWFwKCkpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZEJ0blwiKTtcclxuXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gdHJ1ZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzYXZlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHNhdmluZyBhIGhlYXRtYXAgb2JqZWN0IHdpdGggYSBuYW1lLCB1c2VySWQsIGFuZCBkYXRlIC0gdGhlbiBtYWtpbmcgam9pbiB0YWJsZXMgd2l0aCBoZWF0bWFwSWQgYW5kIGVhY2ggc2hvdElkXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGNvbnN0IHNhdmVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIikpO1xyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwQnRuXCIpO1xyXG4gICAgbGV0IGhlYXRtYXBOYW1lSXNVbmlxdWUgPSB0cnVlO1xyXG5cclxuICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gdHJ1ZTsgLy8gaW1tZWRpYXRlbHkgZGlzYWJsZSBzYXZlIGJ1dHRvbiB0byBwcmV2ZW50IG11bHRpcGxlIGNsaWNrc1xyXG4gICAgY29uc3QgaGVhdG1hcFRpdGxlID0gc2F2ZUlucHV0LnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXTtcclxuXHJcbiAgICAvLyAxLiBoZWF0bWFwIG11c3QgaGF2ZSB0aXRsZSAmIHRoZSB0aXRsZSBjYW5ub3QgYmUgXCJTYXZlIHN1Y2Nlc3NmdWwhXCIgb3IgXCJCYXNpYyBIZWF0bWFwXCIgb3IgXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCIgb3IgXCJObyB0aXRsZSBwcm92aWRlZFwiIG9yIFwiSGVhdG1hcCBuYW1lIG5vdCB1bmlxdWVcIlxyXG4gICAgLy8gMi4gdGhlcmUgbXVzdCBiZSBhIGhlYXRtYXAgY2FudmFzIGxvYWRlZCBvbiB0aGUgcGFnZVxyXG4gICAgLy8gMy4gKHNlZSBzZWNvbmQgaWYgc3RhdGVtZW50KSB0aGUgc2F2ZSBidXR0b24gd2lsbCByZXNwb25kIHdvcmsgaWYgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHNhdmUgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwXHJcbiAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA+IDAgJiYgaGVhdG1hcFRpdGxlICE9PSBcIlNhdmUgc3VjY2Vzc2Z1bFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJCYXNpYyBIZWF0bWFwXCIgJiYgaGVhdG1hcFRpdGxlICE9PSBcIkNhbm5vdCBzYXZlIHByaW9yIGhlYXRtYXBcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiQ2Fubm90IHNhdmUgcHJpb3IgaGVhdG1hcFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJIZWF0bWFwIG5hbWUgbm90IHVuaXF1ZVwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyB0aXRsZSBwcm92aWRlZFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyBoZWF0bWFwIGxvYWRlZFwiICYmIGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChoZWF0bWFwRHJvcGRvd24udmFsdWUgIT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCJcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGNoZWNrIGZvciB1bmlxdWUgaGVhdG1hcCBuYW1lIC0gaWYgaXQncyB1bmlxdWUgdGhlbiBzYXZlIHRoZSBoZWF0bWFwIGFuZCBqb2luIHRhYmxlc1xyXG4gICAgICAgIEFQSS5nZXRBbGwoYGhlYXRtYXBzP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gICAgICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwcy5mb3JFYWNoKGhlYXRtYXAgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChoZWF0bWFwLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gaGVhdG1hcFRpdGxlLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgICAgICAgIGhlYXRtYXBOYW1lSXNVbmlxdWUgPSBmYWxzZSAvLyBpZiBhbnkgbmFtZXMgbWF0Y2gsIHZhcmlhYmxlIGJlY29tZXMgZmFsc2VcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC8vIGlmIG5hbWUgaXMgdW5pcXVlIC0gYWxsIGNvbmRpdGlvbnMgbWV0IC0gc2F2ZSBoZWF0bWFwXHJcbiAgICAgICAgICAgIGlmIChoZWF0bWFwTmFtZUlzVW5pcXVlKSB7XHJcbiAgICAgICAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1zdWNjZXNzXCIpO1xyXG4gICAgICAgICAgICAgIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwT2JqZWN0KGhlYXRtYXBUaXRsZSwgYWN0aXZlVXNlcklkKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oaGVhdG1hcE9iaiA9PiBoZWF0bWFwRGF0YS5zYXZlSm9pblRhYmxlcyhoZWF0bWFwT2JqKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgLy8gZW1wdHkgdGhlIHRlbXBvcmFyeSBnbG9iYWwgYXJyYXkgdXNlZCB3aXRoIFByb21pc2UuYWxsXHJcbiAgICAgICAgICAgICAgICAgIGpvaW5UYWJsZUFyciA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAvLyBhcHBlbmQgbmV3bHkgY3JlYXRlZCBoZWF0bWFwIGFzIG9wdGlvbiBlbGVtZW50IGluIHNlbGVjdCBkcm9wZG93blxyXG4gICAgICAgICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24uYXBwZW5kQ2hpbGQoZWxCdWlsZGVyKFwib3B0aW9uXCIsIHsgXCJpZFwiOiBgaGVhdG1hcC0ke2hlYXRtYXBPYmouaWR9YCB9LCBgJHtoZWF0bWFwT2JqLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF19OiAke2hlYXRtYXBPYmoubmFtZX1gKSk7XHJcbiAgICAgICAgICAgICAgICAgIHNhdmVJbnB1dC52YWx1ZSA9IFwiU2F2ZSBzdWNjZXNzZnVsXCI7XHJcbiAgICAgICAgICAgICAgICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJIZWF0bWFwIG5hbWUgbm90IHVuaXF1ZVwiO1xyXG4gICAgICAgICAgICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgICAgaWYgKGhlYXRtYXBUaXRsZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIk5vIHRpdGxlIHByb3ZpZGVkXCI7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgfSBlbHNlIGlmIChmaWVsZEhlYXRtYXBDYW52YXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHNhdmVJbnB1dC52YWx1ZSA9IFwiTm8gaGVhdG1hcCBsb2FkZWRcIjtcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUsIGFjdGl2ZVVzZXJJZCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBzYXZlcyBhIGhlYXRtYXAgb2JqZWN0IHdpdGggdGhlIHVzZXItcHJvdmlkZWQgbmFtZSwgdGhlIHVzZXJJZCwgYW5kIHRoZSBjdXJyZW50IGRhdGUvdGltZVxyXG4gICAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XHJcbiAgICBjb25zdCBoZWF0bWFwT2JqID0ge1xyXG4gICAgICBuYW1lOiBoZWF0bWFwVGl0bGUsXHJcbiAgICAgIHVzZXJJZDogYWN0aXZlVXNlcklkLFxyXG4gICAgICB0aW1lU3RhbXA6IHRpbWVTdGFtcFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIEFQSS5wb3N0SXRlbShcImhlYXRtYXBzXCIsIGhlYXRtYXBPYmopXHJcbiAgfSxcclxuXHJcbiAgc2F2ZUpvaW5UYWJsZXMoaGVhdG1hcE9iaikge1xyXG4gICAgZ2xvYmFsU2hvdHNBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IGpvaW5UYWJsZU9iaiA9IHtcclxuICAgICAgICBzaG90SWQ6IHNob3QuaWQsXHJcbiAgICAgICAgaGVhdG1hcElkOiBoZWF0bWFwT2JqLmlkXHJcbiAgICAgIH1cclxuICAgICAgam9pblRhYmxlQXJyLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdF9oZWF0bWFwXCIsIGpvaW5UYWJsZU9iaikpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoam9pblRhYmxlQXJyKVxyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUhlYXRtYXAoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHRoZSBsb2dpYyB0aGF0IHByZXZlbnRzIHRoZSB1c2VyIGZyb20gZGVsZXRpbmcgYSBoZWF0bWFwIGluIG9uZSBjbGljay5cclxuICAgIC8vIGEgc2Vjb25kIGRlbGV0ZSBidXR0b24gYW5kIGEgY2FuY2VsIGJ1dHRvbiBhcmUgcmVuZGVyZWQgYmVmb3JlIGEgZGVsZXRlIGlzIGNvbmZpcm1lZFxyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBsZXQgY3VycmVudERyb3Bkb3duVmFsdWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcblxyXG4gICAgaWYgKGN1cnJlbnREcm9wZG93blZhbHVlID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUhlYXRtYXBCdG5cIik7XHJcbiAgICAgIGNvbnN0IGNvbmZpcm1EZWxldGVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ29uZmlybSBEZWxldGVcIik7XHJcbiAgICAgIGNvbnN0IHJlamVjdERlbGV0ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiQ2FuY2VsXCIpO1xyXG4gICAgICBjb25zdCBEZWxldGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImRlbGV0ZUNvbnRyb2xcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbnNcIiB9LCBudWxsLCBjb25maXJtRGVsZXRlQnRuLCByZWplY3REZWxldGVCdG4pO1xyXG4gICAgICBkZWxldGVIZWF0bWFwQnRuLnJlcGxhY2VXaXRoKERlbGV0ZUNvbnRyb2wpO1xyXG4gICAgICBjb25maXJtRGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5jb25maXJtSGVhdG1hcERlbGV0aW9uKTtcclxuICAgICAgcmVqZWN0RGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5yZWplY3RIZWF0bWFwRGVsZXRpb24pO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHJlamVjdEhlYXRtYXBEZWxldGlvbigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmUtcmVuZGVycyB0aGUgcHJpbWFyeSBkZWxldGUgYnV0dG9uXHJcbiAgICBjb25zdCBEZWxldGVDb250cm9sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVDb250cm9sXCIpO1xyXG4gICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJkZWxldGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJEZWxldGUgSGVhdG1hcFwiKVxyXG4gICAgRGVsZXRlQ29udHJvbC5yZXBsYWNlV2l0aChkZWxldGVIZWF0bWFwQnRuKVxyXG4gICAgZGVsZXRlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgY29uZmlybUhlYXRtYXBEZWxldGlvbigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gd2lsbCBkZWxldGUgdGhlIHNlbGVjdGVkIGhlYXRtYXAgb3B0aW9uIGluIHRoZSBkcm9wZG93biBsaXN0IGFuZCByZW1vdmUgYWxsIHNob3RfaGVhdG1hcCBqb2luIHRhYmxlc1xyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBsZXQgY3VycmVudERyb3Bkb3duVmFsdWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcblxyXG4gICAgaGVhdG1hcERyb3Bkb3duLmNoaWxkTm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICAgIGlmIChjaGlsZC50ZXh0Q29udGVudCA9PT0gY3VycmVudERyb3Bkb3duVmFsdWUpIHtcclxuICAgICAgICBjaGlsZC5yZW1vdmUoKTtcclxuICAgICAgICBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwT2JqZWN0YW5kSm9pblRhYmxlcyhjaGlsZC5pZClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaGVhdG1hcERyb3Bkb3duLnZhbHVlID0gXCJCYXNpYyBIZWF0bWFwXCI7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLnJlamVjdEhlYXRtYXBEZWxldGlvbigpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcE9iamVjdGFuZEpvaW5UYWJsZXMoaGVhdG1hcElkKSB7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgcmV0dXJuIEFQSS5kZWxldGVJdGVtKFwiaGVhdG1hcHNcIiwgYCR7aGVhdG1hcElkLnNsaWNlKDgpfT91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICB9LFxyXG5cclxuICBoYW5kbGVCYWxsU3BlZWRHbG9iYWxWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYnkgdGhlIHJlc2V0IGZpbHRlcnMgYnV0dG9uIGFuZCBuYXZiYXIgaGVhdG1hcHMgdGFiIHRvIGZvcmNlIHRoZSBiYWxsIHNwZWVkIGZpbHRlciBvZmZcclxuICAgIGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyhyZXR1cm5Cb29sZWFuLCBzdGFydERhdGVJbnB1dCwgZW5kRGF0ZUlucHV0KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gU0VUIHRoZSBkYXRlIGZpbHRlciBnbG9iYWwgdmFyaWFibGVzIG9uIHRoaXMgcGFnZSBvciBDTEVBUiB0aGVtXHJcbiAgICAvLyBpZiB0aGUgMS4gcGFnZSBpcyByZWxvYWRlZCBvciAyLiB0aGUgXCJyZXNldCBmaWx0ZXJzXCIgYnV0dG9uIGlzIGNsaWNrZWRcclxuXHJcbiAgICAvLyB0aGUgZGF0ZUZpbHRlci5qcyBjYW5jZWwgYnV0dG9uIHJlcXVlc3RzIGEgZ2xvYmFsIHZhciB0byBkZXRlcm1pbmUgaG93IHRvIGhhbmRsZSBidXR0b24gY29sb3JcclxuICAgIGlmIChyZXR1cm5Cb29sZWFuKSB7XHJcbiAgICAgIHJldHVybiBzdGFydERhdGVcclxuICAgIH1cclxuICAgIC8vIGlmIG5vIGlucHV0IHZhbHVlcyBhcmUgcHJvdmlkZWQsIHRoYXQgbWVhbnMgdGhlIHZhcmlhYmxlcyBuZWVkIHRvIGJlIHJlc2V0IGFuZCB0aGUgZGF0ZVxyXG4gICAgLy8gZmlsdGVyIGJ1dHRvbiBzaG91bGQgYmUgb3V0bGluZWQgLSBlbHNlIHNldCBnbG9iYWwgdmFycyBmb3IgZmlsdGVyXHJcbiAgICBpZiAoc3RhcnREYXRlSW5wdXQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBzdGFydERhdGUgPSB1bmRlZmluZWQ7XHJcbiAgICAgIGVuZERhdGUgPSB1bmRlZmluZWQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzdGFydERhdGUgPSBzdGFydERhdGVJbnB1dDtcclxuICAgICAgZW5kRGF0ZSA9IGVuZERhdGVJbnB1dDtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjbGVhckhlYXRtYXBSZXBhaW50SW50ZXJ2YWwoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gcGFnZXMgc28gdGhhdCB0aGUgd2VicGFnZSBkb2Vzbid0IGNvbnRpbnVlIHJ1bm5pbmcgdGhlIGhlYXRtYXAgY29udGFpbmVyIHdpZHRoIHRyYWNrZXJcclxuICAgIGlmIChpbnRlcnZhbElkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcclxuICAgICAgaW50ZXJ2YWxJZCA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBoZWF0bWFwRGF0YSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIjtcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIjtcclxuXHJcbmNvbnN0IGZlZWRiYWNrID0ge1xyXG5cclxuICBsb2FkRmVlZGJhY2soc2hvdHMpIHtcclxuXHJcbiAgICAvLyBmaXJzdCwgdXNlIHRoZSBzaG90cyB3ZSBoYXZlIHRvIGZldGNoIHRoZSBnYW1lcyB0aGV5J3JlIGFzc29jaWF0ZWQgd2l0aFxyXG4gICAgbGV0IGdhbWVJZHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBnYW1lSWRzLnB1c2goc2hvdC5nYW1lSWQpO1xyXG4gICAgfSlcclxuXHJcbiAgICAvLyByZW1vdmUgZHVwbGljYXRlIGdhbWUgSURzXHJcbiAgICBnYW1lSWRzID0gZ2FtZUlkcy5maWx0ZXIoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgICByZXR1cm4gZ2FtZUlkcy5pbmRleE9mKGl0ZW0pID09IGlkeDtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuZmV0Y2hHYW1lcyhnYW1lSWRzKVxyXG4gICAgICAudGhlbihnYW1lcyA9PiB0aGlzLmNhbGN1bGF0ZUZlZWRiYWNrKHNob3RzLCBnYW1lcykpO1xyXG5cclxuICB9LFxyXG5cclxuICBmZXRjaEdhbWVzKGdhbWVJZHMpIHtcclxuICAgIGxldCBnYW1lcyA9IFtdO1xyXG4gICAgZ2FtZUlkcy5mb3JFYWNoKGdhbWVJZCA9PiB7XHJcbiAgICAgIGdhbWVzLnB1c2goQVBJLmdldFNpbmdsZUl0ZW0oXCJnYW1lc1wiLCBnYW1lSWQpKVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoZ2FtZXMpXHJcbiAgfSxcclxuXHJcbiAgY2FsY3VsYXRlRmVlZGJhY2soc2hvdHMsIGdhbWVzKSB7XHJcblxyXG4gICAgbGV0IGZlZWRiYWNrUmVzdWx0cyA9IHt9O1xyXG5cclxuICAgIC8vIGdldCBoZWF0bWFwIGRhdGUgZ2VuZXJhdGVkXHJcbiAgICBsZXQgbm93ID0gbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLm5vdyA9IG5vdztcclxuXHJcbiAgICAvLyBjb252ZXJ0IGdhbWUgZGF0ZXMgb3V0IG9mIFogdGltZSB0byBnZXQgbG9jYWwgdGltZXpvbmUgYWNjdXJhY3lcclxuICAgIGxldCBnYW1lVGltZXMgPSBbXTtcclxuICAgIGdhbWVzLmZvckVhY2goZ2FtZSA9PiB7XHJcbiAgICAgIGdhbWVUaW1lcy5wdXNoKG5ldyBEYXRlKGdhbWUudGltZVN0YW1wKS50b0xvY2FsZVN0cmluZygpLnNwbGl0KFwiLFwiKVswXSk7XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIHNvcnQgYXJyYXkgb2YgZGF0ZXMgZnJvbVxyXG4gICAgZ2FtZVRpbWVzLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgcmV0dXJuICBOdW1iZXIobmV3IERhdGUoYSkpIC0gTnVtYmVyKG5ldyBEYXRlKGIpKTtcclxuICAgIH0pXHJcblxyXG4gICAgLy8gZ2V0IHJhbmdlIG9mIGRhdGVzIG9uIGdhbWVzIChtYXggYW5kIG1pbilcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5sYXN0R2FtZSA9IGdhbWVUaW1lcy5wb3AoKVxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmZpcnN0R2FtZSA9IGdhbWVUaW1lcy5zaGlmdCgpO1xyXG5cclxuICAgIC8vIGdldCBhdmVyYWdlIGZpZWxkIHgseSBjb29yZGluYXRlIG9mIHBsYXllciBiYXNlZCBvbiBzaG90cyBhbmQgZ2l2ZSBwbGF5ZXIgZmVlZGJhY2tcclxuICAgIGxldCBzdW1YID0gMDtcclxuICAgIGxldCBzdW1ZID0gMDtcclxuICAgIGxldCBhdmdYO1xyXG4gICAgbGV0IGF2Z1k7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc3VtWCArPSBzaG90LmZpZWxkWDtcclxuICAgICAgc3VtWSArPSBzaG90LmZpZWxkWTtcclxuICAgIH0pXHJcblxyXG4gICAgYXZnWCA9IHN1bVggLyBzaG90cy5sZW5ndGg7XHJcbiAgICBhdmdZID0gc3VtWSAvIHNob3RzLmxlbmd0aDtcclxuICAgIGxldCBmaWVsZFBvc2l0aW9uO1xyXG5cclxuICAgIGlmIChhdmdYIDwgMC4xNSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJLZWVwZXJcIlxyXG4gICAgfSBlbHNlIGlmICgwLjE1IDw9IGF2Z1ggJiYgYXZnWCA8PSAwLjMwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlN3ZWVwZXJcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNDUgJiYgYXZnWSA8PSAwLjQwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkxlZnQgRnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNDUgJiYgMC42MCA8PSBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlJpZ2h0IEZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPD0gMC40NSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJDZW50ZXIgRnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8IDAuNjAgJiYgYXZnWSA8PSAwLjQwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkxlZnQgSGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8IDAuNjAgJiYgMC42MCA8PSBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlJpZ2h0IEhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPD0gMC42MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJDZW50ZXIgSGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjYwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNzUgJiYgYXZnWSA8PSAwLjUwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkxlZnQgRm9yd2FyZFwiXHJcbiAgICB9IGVsc2UgaWYgKDAuNjAgPD0gYXZnWCAmJiBhdmdYIDwgMC43NSAmJiAwLjUwIDwgYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJSaWdodCBGb3J3YXJkXCJcclxuICAgIH0gZWxzZSBpZiAoMC43NSA8PSBhdmdYKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlN0cmlrZXJcIlxyXG4gICAgfVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5maWVsZFBvc2l0aW9uID0gZmllbGRQb3NpdGlvblxyXG5cclxuICAgIC8vIGRldGVybWluZSBwbGF5ZXJzIHRoYXQgY29tcGxpbWVudCB0aGUgcGxheWVyJ3Mgc3R5bGVcclxuICAgIGxldCBjb21wbGVtZW50QTtcclxuICAgIGxldCBjb21wbGVtZW50QjtcclxuXHJcbiAgICBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJLZWVwZXJcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiU3dlZXBlclwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkxlZnQgRnVsbGJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlJpZ2h0IEZ1bGxCYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkNlbnRlciBGdWxsYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJMZWZ0IEhhbGZiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJSaWdodCBIYWxmYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJDZW50ZXIgSGFsZmJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiU3RyaWtlclwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiTGVmdCBGb3J3YXJkXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlJpZ2h0IEZvcndhcmRcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJTdHJpa2VyXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICB9XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRBID0gY29tcGxlbWVudEE7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY29tcGxlbWVudEIgPSBjb21wbGVtZW50QjtcclxuXHJcbiAgICAvLyBzaG90cyBzY29yZWQgb24gdGVhbSBzaWRlIGFuZCBvcHBvbmVudCBzaWRlIG9mIGZpZWxkXHJcbiAgICBsZXQgdGVhbVNpZGUgPSAwO1xyXG4gICAgbGV0IG9wcFNpZGUgPSAwO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGlmIChzaG90LmZpZWxkWCA+IDAuNTApIHtcclxuICAgICAgICBvcHBTaWRlKys7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGVhbVNpZGUrKztcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMudGVhbVNpZGVHb2FscyA9IHRlYW1TaWRlO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLm9wcG9uZW50U2lkZUdvYWxzID0gb3BwU2lkZTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5nb2Fsc1BlckdhbWUgPSBOdW1iZXIoKHNob3RzLmxlbmd0aCAvIGdhbWVzLmxlbmd0aCkudG9GaXhlZCgxKSk7XHJcblxyXG4gICAgLy8gYWVyaWFsIGNvdW50ICYgcGVyY2VudGFnZSBvZiBhbGwgc2hvdHNcclxuICAgIGxldCBhZXJpYWwgPSAwO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGlmIChzaG90LmFlcmlhbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGFlcmlhbCsrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgYWVyaWFsUGVyY2VudGFnZSA9IE51bWJlcigoYWVyaWFsIC8gc2hvdHMubGVuZ3RoICogMTAwKS50b0ZpeGVkKDApKTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuYWVyaWFsID0gYWVyaWFsO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmFlcmlhbFBlcmNlbnRhZ2UgPSBhZXJpYWxQZXJjZW50YWdlO1xyXG5cclxuICAgIC8vIG1heCBiYWxsIHNwZWVkLCBhdmVyYWdlIGJhbGwgc3BlZWQsIHNob3RzIG92ZXIgNzAgbXBoXHJcbiAgICBsZXQgYXZnQmFsbFNwZWVkID0gMDtcclxuICAgIGxldCBzaG90c092ZXI3MG1waCA9IDA7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgaWYgKHNob3QuYmFsbF9zcGVlZCA+PSA3MCkge1xyXG4gICAgICAgIHNob3RzT3ZlcjcwbXBoKys7XHJcbiAgICAgIH1cclxuICAgICAgYXZnQmFsbFNwZWVkICs9IHNob3QuYmFsbF9zcGVlZDtcclxuICAgIH0pO1xyXG5cclxuICAgIGF2Z0JhbGxTcGVlZCA9IE51bWJlcigoYXZnQmFsbFNwZWVkIC8gc2hvdHMubGVuZ3RoKS50b0ZpeGVkKDEpKTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubWF4QmFsbFNwZWVkID0gc2hvdHMucmVkdWNlKChtYXgsIHNob3QpID0+IHNob3QuYmFsbF9zcGVlZCA+IG1heCA/IHNob3QuYmFsbF9zcGVlZCA6IG1heCwgc2hvdHNbMF0uYmFsbF9zcGVlZCk7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuYXZnQmFsbFNwZWVkID0gYXZnQmFsbFNwZWVkO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnNob3RzT3ZlcjcwbXBoID0gc2hvdHNPdmVyNzBtcGg7XHJcblxyXG4gICAgLy8gM3YzLCAydjIsIGFuZCAxdjEgZ2FtZXMgcGxheWVkXHJcbiAgICBsZXQgXzN2MyA9IDA7XHJcbiAgICBsZXQgXzJ2MiA9IDA7XHJcbiAgICBsZXQgXzF2MSA9IDA7XHJcblxyXG4gICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgaWYgKGdhbWUudHlwZSA9PT0gXCIzdjNcIikge1xyXG4gICAgICAgIF8zdjMrKztcclxuICAgICAgfSBlbHNlIGlmIChnYW1lLnR5cGUgPT09IFwiMnYyXCIpIHtcclxuICAgICAgICBfMnYyKys7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgXzF2MSsrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuXzN2MyA9IF8zdjM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuXzJ2MiA9IF8ydjI7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuXzF2MSA9IF8xdjE7XHJcblxyXG4gICAgLy8gdG90YWwgZ2FtZXMgcGxheWVkLCB0b3RhbCBzaG90cyBzY29yZWQsIHdpbnMvbG9zc2VzL3dpbiVcclxuICAgIGZlZWRiYWNrUmVzdWx0cy50b3RhbEdhbWVzID0gZ2FtZXMubGVuZ3RoO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnRvdGFsU2hvdHMgPSBzaG90cy5sZW5ndGg7XHJcblxyXG4gICAgbGV0IHdpbnMgPSAwO1xyXG4gICAgbGV0IGxvc3NlcyA9IDA7XHJcblxyXG4gICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgIHdpbnMrKztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb3NzZXMrKztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLndpbnMgPSB3aW5zO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmxvc3NlcyA9IGxvc3NlcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy53aW5QY3QgPSBOdW1iZXIoKCh3aW5zIC8gKHdpbnMgKyBsb3NzZXMpKSAqIDEwMCkudG9GaXhlZCgwKSk7XHJcblxyXG4gICAgLy8gY29tcCBnYW1lcyAvIHdpbiAlLCBjYXN1YWwgZ2FtZXMgLyB3aW4gJSwgZ2FtZXMgaW4gT1RcclxuICAgIGxldCBjb21wZXRpdGl2ZUdhbWVzID0gMDtcclxuICAgIGxldCBjb21wV2luID0gMDtcclxuICAgIGxldCBjYXN1YWxHYW1lcyA9IDA7XHJcbiAgICBsZXQgY2FzdWFsV2luID0gMDtcclxuICAgIGxldCBvdmVydGltZUdhbWVzID0gMDtcclxuXHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBpZiAoZ2FtZS5tb2RlID09PSBcImNhc3VhbFwiKSB7XHJcbiAgICAgICAgY2FzdWFsR2FtZXMrKztcclxuICAgICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgICBjYXN1YWxXaW4rKztcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29tcGV0aXRpdmVHYW1lcysrO1xyXG4gICAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICAgIGNvbXBXaW4rKztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdhbWUub3ZlcnRpbWUgPT09IHRydWUpIHtcclxuICAgICAgICBvdmVydGltZUdhbWVzKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGxldCBjb21wV2luUGN0ID0gMDtcclxuXHJcbiAgICBpZiAoY29tcGV0aXRpdmVHYW1lcyA9PT0gMCkge1xyXG4gICAgICBjb21wV2luUGN0ID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbXBXaW5QY3QgPSBOdW1iZXIoKChjb21wV2luIC8gY29tcGV0aXRpdmVHYW1lcykgKiAxMDApLnRvRml4ZWQoMCkpO1xyXG4gICAgfVxyXG4gICAgbGV0IGNhc3VhbFdpblBjdCA9IDA7XHJcblxyXG4gICAgaWYgKGNhc3VhbEdhbWVzID09PSAwKSB7XHJcbiAgICAgIGNhc3VhbFdpblBjdCA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjYXN1YWxXaW5QY3QgPSBOdW1iZXIoKChjYXN1YWxXaW4gLyBjYXN1YWxHYW1lcykgKiAxMDApLnRvRml4ZWQoMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wZXRpdGl2ZUdhbWVzID0gY29tcGV0aXRpdmVHYW1lcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jYXN1YWxHYW1lcyA9IGNhc3VhbEdhbWVzO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBXaW5QY3QgPSBjb21wV2luUGN0O1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNhc3VhbFdpblBjdCA9IGNhc3VhbFdpblBjdDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5vdmVydGltZUdhbWVzID0gb3ZlcnRpbWVHYW1lcztcclxuXHJcbiAgICByZXR1cm4gdGhpcy5idWlsZExldmVscyhmZWVkYmFja1Jlc3VsdHMpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkTGV2ZWxzKGZlZWRiYWNrUmVzdWx0cykge1xyXG5cclxuICAgIGNvbnN0IGZlZWRiYWNrQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwQW5kRmVlZGJhY2tDb250YWluZXJcIik7XHJcblxyXG4gICAgLy8gcmVmb3JtYXQgaGVhdG1hcCBnZW5lcmF0aW9uIHRpbWUgdG8gcmVtb3ZlIHNlY29uZHNcclxuICAgIGNvbnN0IHRpbWVSZWZvcm1hdCA9IFtmZWVkYmFja1Jlc3VsdHMubm93LnNwbGl0KFwiOlwiKVswXSwgZmVlZGJhY2tSZXN1bHRzLm5vdy5zcGxpdChcIjpcIilbMV1dLmpvaW4oXCI6XCIpICsgZmVlZGJhY2tSZXN1bHRzLm5vdy5zcGxpdChcIjpcIilbMl0uc2xpY2UoMik7XHJcblxyXG4gICAgLy8gaGVhdG1hcCBnZW5lcmF0aW9uIGFuZCByYW5nZSBvZiBkYXRlcyBvbiBnYW1lcyAobWF4IGFuZCBtaW4pXHJcbiAgICBjb25zdCBpdGVtM19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWV9YCk7XHJcbiAgICBjb25zdCBpdGVtM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiTGFzdCBnYW1lXCIpO1xyXG4gICAgY29uc3QgaXRlbTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTNfY2hpbGQsIGl0ZW0zX2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW0zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtM193cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0yX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWV9YCk7XHJcbiAgICBjb25zdCBpdGVtMl9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiRmlyc3QgZ2FtZVwiKTtcclxuICAgIGNvbnN0IGl0ZW0yX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yX2NoaWxkLCBpdGVtMl9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHt0aW1lUmVmb3JtYXR9YCk7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiSGVhdG1hcCBnZW5lcmF0ZWRcIik7XHJcbiAgICBjb25zdCBpdGVtMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMV9jaGlsZCwgaXRlbTFfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczFfSGVhdG1hcERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stMVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMSwgaXRlbTIsIGl0ZW0zKVxyXG5cclxuICAgIC8vIHBsYXllciBmZWVkYmFjayBiYXNlZCBvbiBhdmVyYWdlIGZpZWxkIHgseSBjb29yZGluYXRlIG9mIHBsYXllciBzaG90c1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRCfWApO1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDJcIik7XHJcbiAgICBjb25zdCBpdGVtNl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNl9jaGlsZCwgaXRlbTZfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW02X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRBfWApO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDFcIik7XHJcbiAgICBjb25zdCBpdGVtNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNV9jaGlsZCwgaXRlbTVfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW01X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmZpZWxkUG9zaXRpb259YCk7XHJcbiAgICBjb25zdCBpdGVtNF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiWW91ciBwbGF5c3R5bGVcIik7XHJcbiAgICBjb25zdCBpdGVtNF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNF9jaGlsZCwgaXRlbTRfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW00X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczJfcGxheWVyVHlwZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay0yXCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zXCIgfSwgbnVsbCwgaXRlbTQsIGl0ZW01LCBpdGVtNilcclxuXHJcbiAgICAvLyBzaG90cyBvbiB0ZWFtL29wcG9uZW50IHNpZGVzIG9mIGZpZWxkLCBhbmQgYWVyaWFsIHNob3RzIC8gJSAgZ2FtZXMgaW4gT1RcclxuICAgIGNvbnN0IGl0ZW05X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5vdmVydGltZUdhbWVzfWApO1xyXG4gICAgY29uc3QgaXRlbTlfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkdhbWVzIEluIE92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3QgaXRlbTlfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTlfY2hpbGQsIGl0ZW05X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtOSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTlfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtOF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudGVhbVNpZGVHb2Fsc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5vcHBvbmVudFNpZGVHb2Fsc31gKTtcclxuICAgIGNvbnN0IGl0ZW04X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJHb2FscyBCZWhpbmQgJiBCZXlvbmQgTWlkZmllbGRcIik7XHJcbiAgICBjb25zdCBpdGVtOF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtOF9jaGlsZCwgaXRlbThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW04ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtOF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW03X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5hZXJpYWx9IDogJHtmZWVkYmFja1Jlc3VsdHMuYWVyaWFsUGVyY2VudGFnZX0lYCk7XHJcbiAgICBjb25zdCBpdGVtN19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQWVyaWFsIEdvYWwgVG90YWwgJiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtN193cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtN19jaGlsZCwgaXRlbTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW03ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtN193cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnMzX3Nob3REZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTNcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtNywgaXRlbTgsIGl0ZW05KVxyXG5cclxuICAgIC8vIG1heCBiYWxsIHNwZWVkLCBhdmVyYWdlIGJhbGwgc3BlZWQsIHNob3RzIG92ZXIgNzAgbXBoXHJcbiAgICBjb25zdCBpdGVtMTJfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnNob3RzT3ZlcjcwbXBofWApO1xyXG4gICAgY29uc3QgaXRlbTEyX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJHb2FscyBPdmVyIDcwIG1waFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTJfY2hpbGQsIGl0ZW0xMl9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTEyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmF2Z0JhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkF2ZXJhZ2UgQmFsbCBTcGVlZFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTFfY2hpbGQsIGl0ZW0xMV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTExID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTFfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLm1heEJhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIk1heCBCYWxsIFNwZWVkXCIpO1xyXG4gICAgY29uc3QgaXRlbTEwX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xMF9jaGlsZCwgaXRlbTEwX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTAgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xMF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM0X2JhbGxEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTRcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnMgaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyXCIgfSwgbnVsbCwgaXRlbTEwLCBpdGVtMTEsIGl0ZW0xMilcclxuXHJcbiAgICAvLyB0b3RhbCBnYW1lcyBwbGF5ZWQsIHRvdGFsIHNob3RzIHNjb3JlZCwgZ29hbHMgcGVyIGdhbWVcclxuICAgIGNvbnN0IGl0ZW0xNV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuZ29hbHNQZXJHYW1lfWApO1xyXG4gICAgY29uc3QgaXRlbTE1X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJHb2FscyBQZXIgR2FtZVwiKTtcclxuICAgIGNvbnN0IGl0ZW0xNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTVfY2hpbGQsIGl0ZW0xNV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTVfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnRvdGFsU2hvdHN9YCk7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlRvdGFsIEdvYWxzXCIpO1xyXG4gICAgY29uc3QgaXRlbTE0X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xNF9jaGlsZCwgaXRlbTE0X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xNF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudG90YWxHYW1lc31gKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiVG90YWwgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTEzX2NoaWxkLCBpdGVtMTNfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTEzX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczVfdmljdG9yeURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stNVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTMsIGl0ZW0xNCwgaXRlbTE1KVxyXG5cclxuICAgIC8vIDN2MywgMnYyLCBhbmQgMXYxIGdhbWVzIHBsYXllZFxyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMXYxfWApO1xyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIxdjEgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMThfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE4X2NoaWxkLCBpdGVtMThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xOCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE4X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMnYyfWApO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIydjIgZ2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTdfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE3X2NoaWxkLCBpdGVtMTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE3X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fM3YzfWApO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIzdjMgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTZfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE2X2NoaWxkLCBpdGVtMTZfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE2X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczZfZ2FtZVR5cGVEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTZcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtMTYsIGl0ZW0xNywgaXRlbTE4KVxyXG5cclxuICAgIC8vIGNvbXAgZ2FtZXMgLyB3aW4gJSwgY2FzdWFsIGdhbWVzIC8gd2luICUsIHdpbnMvbG9zc2VzL3dpbiVcclxuICAgIGNvbnN0IGl0ZW0yMV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMud2luc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5sb3NzZXN9IDogJHtmZWVkYmFja1Jlc3VsdHMud2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0yMV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiV2lucywgTG9zc2VzLCAmIFdpbiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtMjFfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTIxX2NoaWxkLCBpdGVtMjFfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0yMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTIxX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTIwX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5jb21wZXRpdGl2ZUdhbWVzfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBXaW5QY3R9JWApO1xyXG4gICAgY29uc3QgaXRlbTIwX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJDb21wZXRpdGl2ZSBHYW1lcyAmIFdpbiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtMjBfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTIwX2NoaWxkLCBpdGVtMjBfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0yMCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTIwX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE5X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5jYXN1YWxHYW1lc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5jYXN1YWxXaW5QY3R9JWApO1xyXG4gICAgY29uc3QgaXRlbTE5X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJDYXN1YWwgR2FtZXMgJiBXaW4gUGN0XCIpO1xyXG4gICAgY29uc3QgaXRlbTE5X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xOV9jaGlsZCwgaXRlbTE5X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTkgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xOV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM3X292ZXJ0aW1lRGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay03XCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zIGhhcy1iYWNrZ3JvdW5kLXdoaXRlLXRlclwiIH0sIG51bGwsIGl0ZW0xOSwgaXRlbTIwLCBpdGVtMjEpXHJcblxyXG4gICAgLy8gcmVwbGFjZSBvbGQgY29udGVudCBpZiBpdCdzIGFscmVhZHkgb24gdGhlIHBhZ2VcclxuICAgIGNvbnN0IGZlZWRiYWNrMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stMVwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stMlwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrMyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stM1wiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stNFwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stNVwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stNlwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stN1wiKTtcclxuXHJcbiAgICBpZiAoZmVlZGJhY2sxICE9PSBudWxsKSB7XHJcbiAgICAgIGZlZWRiYWNrMS5yZXBsYWNlV2l0aChjb2x1bW5zMV9IZWF0bWFwRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrMi5yZXBsYWNlV2l0aChjb2x1bW5zMl9wbGF5ZXJUeXBlKTtcclxuICAgICAgZmVlZGJhY2szLnJlcGxhY2VXaXRoKGNvbHVtbnMzX3Nob3REZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2s0LnJlcGxhY2VXaXRoKGNvbHVtbnM0X2JhbGxEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2s1LnJlcGxhY2VXaXRoKGNvbHVtbnM1X3ZpY3RvcnlEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2s2LnJlcGxhY2VXaXRoKGNvbHVtbnM2X2dhbWVUeXBlRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNy5yZXBsYWNlV2l0aChjb2x1bW5zN19vdmVydGltZURldGFpbHMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczFfSGVhdG1hcERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zMl9wbGF5ZXJUeXBlKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczVfdmljdG9yeURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zNl9nYW1lVHlwZURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zNF9iYWxsRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnMzX3Nob3REZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczdfb3ZlcnRpbWVEZXRhaWxzKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZmVlZGJhY2siLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiO1xyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgZGF0ZUZpbHRlciBmcm9tIFwiLi9kYXRlRmlsdGVyXCI7XHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgaGVhdG1hcHMgPSB7XHJcblxyXG4gIGxvYWRIZWF0bWFwQ29udGFpbmVycygpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHRoaXMuYnVpbGRGaWx0ZXJzKCk7XHJcbiAgICAvLyBidWlsZHMgYnV0dG9uIHRvIGdlbmVyYXRlIGhlYXRtYXAsIHNhdmUgaGVhdG1hcCwgYW5kIHZpZXcgc2F2ZWQgaGVhdG1hcHNcclxuICAgIC8vIHRoZSBhY3Rpb24gaXMgYXN5bmMgYmVjYXVzZSB0aGUgdXNlcidzIHNhdmVkIGhlYXRtYXBzIGhhdmUgdG8gYmUgcmVuZGVyZWQgYXMgSFRNTCBvcHRpb24gZWxlbWVudHNcclxuICAgIHRoaXMuYnVpbGRHZW5lcmF0b3IoKTtcclxuICB9LFxyXG5cclxuICBidWlsZEZpbHRlcnMoKSB7XHJcblxyXG4gICAgLy8gcmVzZXQgYnV0dG9uXHJcbiAgICBjb25zdCByZXNldEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJyZXNldEZpbHRlcnNCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIlJlc2V0IEZpbHRlcnNcIik7XHJcblxyXG4gICAgLy8gZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGNvbnN0IGRhdGVCdG5UZXh0ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7fSwgXCJEYXRlc1wiKTtcclxuICAgIGNvbnN0IGRhdGVCdG5JY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXIgZmEtY2FsZW5kYXJcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGRhdGVCdG5JY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbFwiIH0sIG51bGwsIGRhdGVCdG5JY29uKTtcclxuICAgIGNvbnN0IGRhdGVCdG4gPSBlbEJ1aWxkZXIoXCJhXCIsIHtcImlkXCI6XCJkYXRlUmFuZ2VCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1vdXRsaW5lZCBpcy1kYXJrXCIgfSwgbnVsbCwgZGF0ZUJ0bkljb25TcGFuLCBkYXRlQnRuVGV4dCk7XHJcbiAgICBjb25zdCBkYXRlQnRuUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkYXRlQnRuKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGJ1dHRvblxyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuVGV4dCA9IGVsQnVpbGRlcihcInNwYW5cIiwge30sIFwiQmFsbCBTcGVlZFwiKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0bkljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1ib2x0XCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5JY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbFwiIH0sIG51bGwsIGJhbGxTcGVlZEJ0bkljb24pO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiaWRcIjogXCJiYWxsU3BlZWRCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1vdXRsaW5lZCBpcy1kYXJrXCIgfSwgbnVsbCwgYmFsbFNwZWVkQnRuSWNvblNwYW4sIGJhbGxTcGVlZEJ0blRleHQpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBiYWxsU3BlZWRCdG4pO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBjb25zdCBpY29uNiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWNsb2NrXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb242KTtcclxuICAgIGNvbnN0IHNlbDZfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT1RcIik7XHJcbiAgICBjb25zdCBzZWw2X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBPVFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDYgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLW92ZXJ0aW1lXCIgfSwgbnVsbCwgc2VsNl9vcDEsIHNlbDZfb3AyLCBzZWw2X29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NiwgaWNvblNwYW42KTtcclxuICAgIGNvbnN0IGNvbnRyb2w2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY2KTtcclxuXHJcbiAgICAvLyByZXN1bHRcclxuICAgIGNvbnN0IGljb241ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtdHJvcGh5XCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjUgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb241KTtcclxuICAgIGNvbnN0IHNlbDVfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlJlc3VsdFwiKTtcclxuICAgIGNvbnN0IHNlbDVfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlZpY3RvcnlcIik7XHJcbiAgICBjb25zdCBzZWw1X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJEZWZlYXRcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q1ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1nYW1lUmVzdWx0XCIgfSwgbnVsbCwgc2VsNV9vcDEsIHNlbDVfb3AyLCBzZWw1X29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NSwgaWNvblNwYW41KTtcclxuICAgIGNvbnN0IGNvbnRyb2w1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY1KTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGVcclxuICAgIGNvbnN0IGljb240ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtc2l0ZW1hcFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW40ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNCk7XHJcbiAgICBjb25zdCBzZWw0X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJHYW1lIFR5cGVcIik7XHJcbiAgICBjb25zdCBzZWw0X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBzZWw0X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIydjJcIik7XHJcbiAgICBjb25zdCBzZWw0X29wNCA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIxdjFcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1nYW1lVHlwZVwiIH0sIG51bGwsIHNlbDRfb3AxLCBzZWw0X29wMiwgc2VsNF9vcDMsIHNlbDRfb3A0KTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q0LCBpY29uU3BhbjQpO1xyXG4gICAgY29uc3QgY29udHJvbDQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjQpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZVxyXG4gICAgY29uc3QgaWNvbjMgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1nYW1lcGFkXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24zKTtcclxuICAgIGNvbnN0IHNlbDNfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkdhbWUgTW9kZVwiKTtcclxuICAgIGNvbnN0IHNlbDNfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNvbXBldGl0aXZlXCIpO1xyXG4gICAgY29uc3Qgc2VsM19vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ2FzdWFsXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MyA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItZ2FtZU1vZGVcIiB9LCBudWxsLCBzZWwzX29wMSwgc2VsM19vcDIsIHNlbDNfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QzLCBpY29uU3BhbjMpO1xyXG4gICAgY29uc3QgY29udHJvbDMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjMpO1xyXG5cclxuICAgIC8vIHBhcnR5XHJcbiAgICBjb25zdCBpY29uMiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWhhbmRzaGFrZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uMik7XHJcbiAgICBjb25zdCBzZWwyX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJUZWFtXCIpO1xyXG4gICAgY29uc3Qgc2VsMl9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gcGFydHlcIik7XHJcbiAgICBjb25zdCBzZWwyX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJQYXJ0eVwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDIgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLXRlYW1TdGF0dXNcIiB9LCBudWxsLCBzZWwyX29wMSwgc2VsMl9vcDIsIHNlbDJfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QyLCBpY29uU3BhbjIpO1xyXG4gICAgY29uc3QgY29udHJvbDIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjIpO1xyXG5cclxuICAgIC8vIHNob3QgdHlwZVxyXG4gICAgY29uc3QgaWNvbjEgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1mdXRib2xcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjEpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU2hvdCBUeXBlXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQWVyaWFsXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU3RhbmRhcmRcIik7XHJcbiAgICBjb25zdCBzZWxlY3QxID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1zaG90VHlwZVwiIH0sIG51bGwsIHNlbDFfb3AxLCBzZWwxX29wMiwgc2VsMV9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDEsIGljb25TcGFuMSk7XHJcbiAgICBjb25zdCBjb250cm9sMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2MSk7XHJcblxyXG4gICAgY29uc3QgZmlsdGVyRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmlsdGVyRmllbGRcIiwgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGNvbnRyb2wxLCBjb250cm9sMiwgY29udHJvbDMsIGNvbnRyb2w0LCBjb250cm9sNSwgY29udHJvbDYsIGJhbGxTcGVlZEJ0blBhcmVudCwgZGF0ZUJ0blBhcmVudCwgcmVzZXRCdG4pO1xyXG4gICAgY29uc3QgUGFyZW50RmlsdGVyQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBmaWx0ZXJGaWVsZCk7XHJcblxyXG4gICAgLy8gYXBwZW5kIGZpbHRlciBjb250YWluZXIgdG8gd2VicGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRGaWx0ZXJDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2VuZXJhdG9yKCkge1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuXHJcbiAgICAvLyB1c2UgZmV0Y2ggdG8gYXBwZW5kIG9wdGlvbnMgdG8gc2VsZWN0IGVsZW1lbnQgaWYgdXNlciBhdCBsZWFzdCAxIHNhdmVkIGhlYXRtYXBcclxuICAgIEFQSS5nZXRBbGwoYGhlYXRtYXBzP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gICAgICAudGhlbihoZWF0bWFwcyA9PiB7XHJcbiAgICAgICAgY29uc3QgaWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWZpcmVcIiB9LCBudWxsKTtcclxuICAgICAgICBjb25zdCBpY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbik7XHJcbiAgICAgICAgY29uc3Qgc2VsMV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQmFzaWMgSGVhdG1hcFwiKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiaGVhdG1hcERyb3Bkb3duXCIgfSwgbnVsbCwgc2VsMV9vcDEpO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBTZWxlY3REaXYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBoZWF0bWFwRHJvcGRvd24sIGljb25TcGFuKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgaGVhdG1hcFNlbGVjdERpdik7XHJcblxyXG4gICAgICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZGVsZXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRGVsZXRlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBkZWxldGVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkZWxldGVIZWF0bWFwQnRuKVxyXG4gICAgICAgIGNvbnN0IHNhdmVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBzYXZlQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgc2F2ZUJ0bilcclxuICAgICAgICBjb25zdCBzYXZlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzYXZlSGVhdG1hcElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJOYW1lIGFuZCBzYXZlIHRoaXMgaGVhdG1hcFwiLCBcIm1heGxlbmd0aFwiOiBcIjI1XCIgfSwgbnVsbClcclxuICAgICAgICBjb25zdCBzYXZlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGlzLWV4cGFuZGVkXCIgfSwgbnVsbCwgc2F2ZUlucHV0KVxyXG5cclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZ2VuZXJhdGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiR2VuZXJhdGUgSGVhdG1hcFwiKTtcclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnZW5lcmF0b3JCdXR0b24pO1xyXG5cclxuICAgICAgICAvLyBpZiBubyBoZWF0bWFwcyBhcmUgc2F2ZWQsIGdlbmVyYXRlIG5vIGV4dHJhIG9wdGlvbnMgaW4gZHJvcGRvd25cclxuICAgICAgICBpZiAoaGVhdG1hcHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGVsc2UsIGZvciBlYWNoIGhlYXRtYXAgc2F2ZWQsIG1ha2UgYSBuZXcgb3B0aW9uIGFuZCBhcHBlbmQgaXQgdG8gdGhlXHJcbiAgICAgICAgICBoZWF0bWFwcy5mb3JFYWNoKGhlYXRtYXAgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24uYXBwZW5kQ2hpbGQoZWxCdWlsZGVyKFwib3B0aW9uXCIsIHsgXCJpZFwiOiBgaGVhdG1hcC0ke2hlYXRtYXAuaWR9YCB9LCBgJHtoZWF0bWFwLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF19OiAke2hlYXRtYXAubmFtZX1gKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgY29uc3QgZ2VuZXJhdG9yRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgaGVhdG1hcENvbnRyb2wsIGdlbmVyYXRvckNvbnRyb2wsIHNhdmVDb250cm9sLCBzYXZlQnRuQ29udHJvbCwgZGVsZXRlQnRuQ29udHJvbCk7XHJcbiAgICAgICAgICBjb25zdCBQYXJlbnRHZW5lcmF0b3JDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGdlbmVyYXRvckZpZWxkKTtcclxuICAgICAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idWlsZEZpZWxkYW5kR29hbCgpO1xyXG4gICAgICAgIGRhdGVGaWx0ZXIuYnVpbGREYXRlRmlsdGVyKCk7XHJcbiAgICAgICAgdGhpcy5oZWF0bWFwRXZlbnRNYW5hZ2VyKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICB9LFxyXG5cclxuICBidWlsZEZpZWxkYW5kR29hbCgpIHtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgaGVhdG1hcEltYWdlQ29udGFpbmVycyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHtcImlkXCI6XCJoZWF0bWFwQW5kRmVlZGJhY2tDb250YWluZXJcIiwgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBoZWF0bWFwSW1hZ2VDb250YWluZXJzKVxyXG5cclxuICAgIC8vIGFwcGVuZCBmaWVsZCBhbmQgZ29hbCB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGhlYXRtYXBFdmVudE1hbmFnZXIoKSB7XHJcbiAgICAvLyBhZGQgZnVuY3Rpb25hbGl0eSB0byBwcmltYXJ5IGJ1dHRvbnMgb24gaGVhdG1hcCBwYWdlXHJcbiAgICBjb25zdCBnZW5lcmF0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdlbmVyYXRlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IHNhdmVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUhlYXRtYXBCdG5cIik7XHJcblxyXG4gICAgZ2VuZXJhdGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5nZXRVc2VyU2hvdHMpO1xyXG4gICAgc2F2ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwKTtcclxuICAgIGRlbGV0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXApO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lciB0byBoZWF0bWFwIHBhcmVudCB0aGF0IGhpZ2hsaWdodHMgZmlsdGVyIGJ1dHRvbnMgcmVkIHdoZW4gY2hhbmdlZFxyXG4gICAgLy8gaGVhdG1hcCBidXR0b25zIHJldHVybiB0byBkZWZhdWx0IGNvbG9yIGlmIHRoZSBkZWZhdWx0IG9wdGlvbiBpcyBzZWxlY3RlZFxyXG4gICAgY29uc3QgZmlsdGVyRmllbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlckZpZWxkXCIpO1xyXG4gICAgZmlsdGVyRmllbGQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZSkgPT4ge1xyXG4gICAgICBlLnRhcmdldC5wYXJlbnROb2RlLmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgIGlmIChlLnRhcmdldC52YWx1ZSA9PT0gZS50YXJnZXQuY2hpbGROb2Rlc1swXS50ZXh0Q29udGVudCkge1xyXG4gICAgICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gYWRkIGxpc3RlbmVyIHRvIGhlYXRtYXAgdGl0bGUgaW5wdXQgdG8gY2xlYXIgcmVkIGhpZ2hsaXRpbmcgYW5kIHRleHQgaWYgYW4gZXJyb3Igd2FzIHRocm93blxyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIHNhdmVIZWF0bWFwSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgaWYgKHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtZGFuZ2VyXCIpIHx8IHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc3VjY2Vzc1wiKSkge1xyXG4gICAgICAgIHNhdmVIZWF0bWFwSW5wdXQudmFsdWUgPSBcIlwiO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgICAgICBzYXZlSGVhdG1hcElucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zdWNjZXNzXCIpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIHJlc2V0IGZpbHRlciBidXR0b25cclxuICAgIGNvbnN0IHJlc2V0RmlsdGVyc0J0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzZXRGaWx0ZXJzQnRuXCIpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lTW9kZVwiKTtcclxuICAgIGNvbnN0IHNob3RUeXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItc2hvdFR5cGVcIik7XHJcbiAgICBjb25zdCBnYW1lUmVzdWx0RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVJlc3VsdFwiKTtcclxuICAgIGNvbnN0IGdhbWV0eXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVR5cGVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLW92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3QgdGVhbVN0YXR1c0ZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLXRlYW1TdGF0dXNcIik7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkQnRuXCIpO1xyXG5cclxuICAgIHJlc2V0RmlsdGVyc0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICBnYW1lTW9kZUZpbHRlci52YWx1ZSA9IFwiR2FtZSBNb2RlXCI7XHJcbiAgICAgIGdhbWVNb2RlRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIHNob3RUeXBlRmlsdGVyLnZhbHVlID0gXCJTaG90IFR5cGVcIjtcclxuICAgICAgc2hvdFR5cGVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgZ2FtZVJlc3VsdEZpbHRlci52YWx1ZSA9IFwiUmVzdWx0XCI7XHJcbiAgICAgIGdhbWVSZXN1bHRGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgZ2FtZXR5cGVGaWx0ZXIudmFsdWUgPSBcIkdhbWUgVHlwZVwiO1xyXG4gICAgICBnYW1ldHlwZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBvdmVydGltZUZpbHRlci52YWx1ZSA9IFwiT3ZlcnRpbWVcIjtcclxuICAgICAgb3ZlcnRpbWVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgdGVhbVN0YXR1c0ZpbHRlci52YWx1ZSA9IFwiVGVhbVwiO1xyXG4gICAgICB0ZWFtU3RhdHVzRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIC8vIHJlc2V0IGJhbGwgc3BlZWQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICBoZWF0bWFwRGF0YS5oYW5kbGVCYWxsU3BlZWRHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC5hZGQoXCJpcy1vdXRsaW5lZFwiKTtcclxuXHJcbiAgICAgIC8vIHJlc2V0IGRhdGUgZmlsdGVyIGFuZCBhc3NvY2lhdGVkIGdsb2JhbCB2YXJpYWJsZXNcclxuICAgICAgZGF0ZUZpbHRlci5jbGVhckRhdGVGaWx0ZXIoKTtcclxuXHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIGJhbGwgc3BlZWQgYnV0dG9uXHJcbiAgICBiYWxsU3BlZWRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmJhbGxTcGVlZE1heCk7XHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGRhdGVSYW5nZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5vcGVuRGF0ZUZpbHRlcik7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGVhdG1hcHMiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5pbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbG9naW5PclNpZ251cCA9IHtcclxuXHJcbiAgbG9naW5Gb3JtKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgYSBsb2dpbiBmb3JtIHRoYXQgdmFsaWRhdGVzIHVzZXIgaW5wdXQuIFN1Y2Nlc3NmdWwgbG9naW4gc3RvcmVzIHVzZXIgaWQgaW4gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJsb2dpbk5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luIG5vd1wiKTtcclxuICAgIGNvbnN0IGxvZ2luQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zIGlzLWNlbnRlcmVkXCIgfSwgbnVsbCwgbG9naW5CdXR0b24pXHJcblxyXG4gICAgLy8gcGFzc3dvcmQgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBsb2dpblBhc3N3b3JkSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWxvY2tcIiB9KVxyXG4gICAgY29uc3QgbG9naW5QYXNzd29yZEljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIGxvZ2luUGFzc3dvcmRJY29uKVxyXG4gICAgY29uc3QgbG9naW5JbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInBhc3N3b3JkXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBwYXNzd29yZFwiIH0pO1xyXG5cclxuICAgIGNvbnN0IGxvZ2luUGFzc3dvcmRDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBsb2dpbklucHV0X3Bhc3N3b3JkLCBsb2dpblBhc3N3b3JkSWNvbkRpdilcclxuICAgIGNvbnN0IGxvZ2luUGFzc3dvcmRMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJQYXNzd29yZFwiKVxyXG4gICAgY29uc3QgbG9naW5QYXNzd29yZEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgbG9naW5QYXNzd29yZExhYmVsLCBsb2dpblBhc3N3b3JkQ29udHJvbClcclxuXHJcbiAgICAvLyB1c2VybmFtZSBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IGxvZ2luVXNlcm5hbWVJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtdXNlclwiIH0pXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgbG9naW5Vc2VybmFtZUljb24pXHJcbiAgICBjb25zdCBsb2dpbklucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgbG9naW5JbnB1dF91c2VybmFtZSwgbG9naW5Vc2VybmFtZUljb25EaXYpXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiVXNlcm5hbWVcIilcclxuICAgIGNvbnN0IGxvZ2luVXNlcm5hbWVGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIGxvZ2luVXNlcm5hbWVMYWJlbCwgbG9naW5Vc2VybmFtZUNvbnRyb2wpXHJcblxyXG4gICAgLy8gZm9ybVxyXG4gICAgY29uc3QgbG9naW5Gb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJsb2dpbkZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiLCBcInN0eWxlXCI6IFwibWFyZ2luLXRvcDotNTdweDsgbWluLXdpZHRoOjIwJVwiIH0sIG51bGwsIGxvZ2luVXNlcm5hbWVGaWVsZCwgbG9naW5QYXNzd29yZEZpZWxkLCBsb2dpbkJ0bkNvbnRyb2wpO1xyXG5cclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIC8vIHNldCBzdHlsZSBvZiBtYXN0ZXIgY29udGFpbmVyIHRvIGRpc3BsYXkgZmxleCB0byBhbGlnbiBmb3JtcyBpbiBjZW50ZXIgb2YgY29udGFpbmVyXHJcbiAgICB3ZWJwYWdlLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSBcImNlbnRlclwiO1xyXG4gICAgd2VicGFnZS5zdHlsZS5hbGlnbkl0ZW1zID0gXCJjZW50ZXJcIjtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQobG9naW5Gb3JtKTtcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIHNpZ251cEZvcm0oKSB7XHJcbiAgICBjb25zdCBzaWdudXBCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2lnbnVwTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cCBub3dcIik7XHJcbiAgICBjb25zdCBzaWdudXBCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnMgaXMtY2VudGVyZWRcIiB9LCBudWxsLCBzaWdudXBCdXR0b24pXHJcblxyXG4gICAgLy8gbmFtZSBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IHNpZ251cE5hbWVJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtcGVuY2lsLWFsdFwiIH0pXHJcbiAgICBjb25zdCBzaWdudXBOYW1lSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwTmFtZUljb24pXHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9uYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBuYW1lXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwTmFtZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X25hbWUsIHNpZ251cE5hbWVJY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwTmFtZUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIk5hbWVcIilcclxuICAgIGNvbnN0IHNpZ251cE5hbWVGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIHNpZ251cE5hbWVMYWJlbCwgc2lnbnVwTmFtZUNvbnRyb2wpXHJcblxyXG4gICAgLy8gdXNlcm5hbWUgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBzaWdudXBVc2VybmFtZUljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS11c2VyXCIgfSlcclxuICAgIGNvbnN0IHNpZ251cFVzZXJuYW1lSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwVXNlcm5hbWVJY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ1c2VybmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciB1c2VybmFtZVwiLCBcIm1heGxlbmd0aFwiOiBcIjIwXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwVXNlcm5hbWVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzaWdudXBJbnB1dF91c2VybmFtZSwgc2lnbnVwVXNlcm5hbWVJY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwVXNlcm5hbWVMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJVc2VybmFtZVwiKVxyXG4gICAgY29uc3Qgc2lnbnVwVXNlcm5hbWVGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIHNpZ251cFVzZXJuYW1lTGFiZWwsIHNpZ251cFVzZXJuYW1lQ29udHJvbClcclxuXHJcbiAgICAvLyBlbWFpbCBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IHNpZ251cEVtYWlsSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWF0XCIgfSlcclxuICAgIGNvbnN0IHNpZ251cEVtYWlsSWNvbkRpdiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbCBpcy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwRW1haWxJY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfZW1haWwgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJlbWFpbElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJlbWFpbFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgZW1haWxcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X2VtYWlsLCBzaWdudXBFbWFpbEljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbExhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkVtYWlsXCIpXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgc2lnbnVwRW1haWxMYWJlbCwgc2lnbnVwRW1haWxDb250cm9sKVxyXG5cclxuICAgIC8vIHBhc3N3b3JkIGlucHV0IHdpdGggaWNvblxyXG4gICAgY29uc3Qgc2lnbnVwUGFzc3dvcmRJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtbG9ja1wiIH0pXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZEljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cFBhc3N3b3JkSWNvbilcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X3Bhc3N3b3JkLCBzaWdudXBQYXNzd29yZEljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZExhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIlBhc3N3b3JkXCIpXHJcbiAgICBjb25zdCBzaWdudXBQYXNzd29yZEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgc2lnbnVwUGFzc3dvcmRMYWJlbCwgc2lnbnVwUGFzc3dvcmRDb250cm9sKVxyXG5cclxuICAgIC8vIGNvbmZpcm0gcGFzc3dvcmQgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBzaWdudXBDb25maXJtSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWxvY2tcIiB9KVxyXG4gICAgY29uc3Qgc2lnbnVwQ29uZmlybUljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cENvbmZpcm1JY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfY29uZmlybSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImNvbmZpcm1QYXNzd29yZFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZW1haWxcIiwgXCJwbGFjZWhvbGRlclwiOiBcImNvbmZpcm0gcGFzc3dvcmRcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBDb25maXJtQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwSW5wdXRfY29uZmlybSwgc2lnbnVwQ29uZmlybUljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBDb25maXJtTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiQ29uZmlybSBQYXNzd29yZFwiKVxyXG4gICAgY29uc3Qgc2lnbnVwQ29uZmlybUZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgc2lnbnVwQ29uZmlybUxhYmVsLCBzaWdudXBDb25maXJtQ29udHJvbClcclxuXHJcbiAgICAvLyBwcm9maWxlIHBpYyBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IHNpZ251cFByb2ZpbGVQaWNJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtaW1hZ2VcIiB9KVxyXG4gICAgY29uc3Qgc2lnbnVwUHJvZmlsZVBpY0ljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cFByb2ZpbGVQaWNJY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfcHJvZmlsZVBpYyA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInByb2ZpbGVQaWNVUkxcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImVtYWlsXCIsIFwicGxhY2Vob2xkZXJcIjogXCJwcm92aWRlIGEgVVJMIChvcHRpb25hbClcIiB9KTtcclxuXHJcbiAgICBjb25zdCBzaWdudXBQcm9maWxlUGljQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwSW5wdXRfcHJvZmlsZVBpYywgc2lnbnVwUHJvZmlsZVBpY0ljb25EaXYpXHJcbiAgICBjb25zdCBzaWdudXBQcm9maWxlUGljTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiUHJvZmlsZSBQaWN0dXJlXCIpXHJcbiAgICBjb25zdCBzaWdudXBQcm9maWxlUGljRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGRcIiB9LCBudWxsLCBzaWdudXBQcm9maWxlUGljTGFiZWwsIHNpZ251cFByb2ZpbGVQaWNDb250cm9sKVxyXG5cclxuICAgIC8vIGNhciB0eXBlIHNlbGVjdFxyXG4gICAgY29uc3Qgc2VsX2ljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1jYXJcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IHNlbF9pY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgc2VsX2ljb24pO1xyXG4gICAgY29uc3Qgc2VsMV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT2N0YW5lXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiRG9taW51cyBHVFwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJyZWFrb3V0IFR5cGUgU1wiKTtcclxuICAgIGNvbnN0IHNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJ1c2VyQ2FyXCIgfSwgbnVsbCwgc2VsMV9vcDEsIHNlbDFfb3AyLCBzZWwxX29wMyk7XHJcbiAgICBjb25zdCBzZWxfRGl2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy13aGl0ZS10ZXJcIiB9LCBudWxsLCBzZWxlY3QsIHNlbF9pY29uU3Bhbik7XHJcbiAgICBjb25zdCBzZWxfY29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsX0Rpdik7XHJcbiAgICBjb25zdCBjb250cm9sTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiQ2hvb3NlIFlvdXIgQ2FyXCIpXHJcblxyXG4gICAgY29uc3QgY2FyU2VsZWN0RmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGRcIiB9LCBudWxsLCBjb250cm9sTGFiZWwsIHNlbF9jb250cm9sKTtcclxuXHJcbiAgICAvLyBmb3JtXHJcbiAgICBjb25zdCBzaWdudXBGb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJzaWdudXBGb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiwgXCJzdHlsZVwiOiBcIm1pbi13aWR0aDoyMCVcIiB9LCBudWxsLCBzaWdudXBOYW1lRmllbGQsIHNpZ251cFVzZXJuYW1lRmllbGQsIHNpZ251cEVtYWlsRmllbGQsIHNpZ251cFBhc3N3b3JkRmllbGQsIHNpZ251cENvbmZpcm1GaWVsZCwgc2lnbnVwUHJvZmlsZVBpY0ZpZWxkLCBjYXJTZWxlY3RGaWVsZCwgc2lnbnVwQnRuQ29udHJvbCk7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gXCJjZW50ZXJcIjtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuYWxpZ25JdGVtcyA9IFwiY2VudGVyXCI7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHNpZ251cEZvcm0pO1xyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gYXNzaWduIGV2ZW50IGxpc3RlbmVycyBiYXNlZCBvbiB3aGljaCBmb3JtIGlzIG9uIHRoZSB3ZWJwYWdlXHJcbiAgdXNlckV2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGxvZ2luTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2dpbk5vd1wiKVxyXG4gICAgY29uc3Qgc2lnbnVwTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaWdudXBOb3dcIilcclxuICAgIGlmIChsb2dpbk5vdyA9PT0gbnVsbCkge1xyXG4gICAgICBzaWdudXBOb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2lnbnVwVXNlciwgZXZlbnQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2dpbk5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpblVzZXIsIGV2ZW50KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ2luVXNlcihlKSB7XHJcbiAgICAvLyB2YWxpZGF0ZSB1c2VyIGxvZ2luIGZvcm0gaW5wdXRzIGJlZm9yZSBsb2dnaW5nIGluXHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKGB1c2Vycz91c2VybmFtZT0ke3VzZXJuYW1lLnRvTG93ZXJDYXNlKCl9YCkudGhlbih1c2VyID0+IHtcclxuICAgICAgICAvLyB2YWxpZGF0ZSB1c2VybmFtZSBhbmQgcGFzc3dvcmRcclxuICAgICAgICBpZiAodXNlci5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGlmICh1c2VyWzBdLnBhc3N3b3JkID09PSBwYXNzd29yZCkge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXJbMF0pXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhbGVydChcIlVzZXJuYW1lIG9yIHBhc3N3b3JkIGlzIGluY29ycmVjdC5cIik7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhbGVydChcIlVzZXJuYW1lIG9yIHBhc3N3b3JkIGlzIGluY29ycmVjdC5cIik7XHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cFVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc3QgX25hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3VzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF9jb25maXJtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maXJtUGFzc3dvcmRcIikudmFsdWVcclxuICAgIGNvbnN0IF9lbWFpbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW1haWxJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3BpY3R1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByb2ZpbGVQaWNVUkxcIikudmFsdWVcclxuICAgIGNvbnN0IF9jYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJDYXJcIikudmFsdWVcclxuICAgIGlmIChfbmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3VzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9lbWFpbCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX2NvbmZpcm0gPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCAhPT0gX2NvbmZpcm0pIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKGB1c2Vycz91c2VybmFtZT0ke191c2VybmFtZS50b0xvd2VyQ2FzZSgpfWApLnRoZW4odXNlciA9PiB7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIGV4aXN0aW5nIHVzZXJuYW1lIGluIGRhdGFiYXNlLiBMZW5ndGggPSAxIGlmIHVzZXJuYW1lIGlzIG5vdCB1bmlxdWVcclxuICAgICAgICBpZiAodXNlci5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGFsZXJ0KFwidGhpcyB1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1wiKTtcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvL3Bvc3QgdGhlIG5ldyB1c2VyIGlmIHVzZXJuYW1lIGlzIHVuaXF1ZVxyXG4gICAgICAgICAgbGV0IG5ld1VzZXIgPSB7XHJcbiAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogX3VzZXJuYW1lLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgIGVtYWlsOiBfZW1haWwudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IF9wYXNzd29yZCxcclxuICAgICAgICAgICAgam9pbmVkOiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgICBjYXI6IF9jYXIsXHJcbiAgICAgICAgICAgIHBpY3R1cmU6IF9waWN0dXJlLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgQVBJLnBvc3RJdGVtKFwidXNlcnNcIiwgbmV3VXNlcikudGhlbih1c2VyID0+IHtcclxuICAgICAgICAgICAgbG9naW5PclNpZ251cC5sb2dpblN0YXR1c0FjdGl2ZSh1c2VyKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oXCJhY3RpdmVVc2VySWRcIiwgdXNlci5pZCk7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSk7IC8vYnVpbGQgbG9nZ2VkIGluIHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0VXNlcigpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoZmFsc2UpOyAvL2J1aWxkIGxvZ2dlZCBvdXQgdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsb2dpbk9yU2lnbnVwIiwiaW1wb3J0IG5hdmJhciBmcm9tIFwiLi9uYXZiYXJcIlxyXG5cclxubmF2YmFyLmdlbmVyYXRlTmF2YmFyKCk7IiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBsb2dpbk9yU2lnbnVwIGZyb20gXCIuL2xvZ2luXCJcclxuaW1wb3J0IHByb2ZpbGUgZnJvbSBcIi4vcHJvZmlsZVwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiXHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiXHJcblxyXG4vKlxyXG4gIEJ1bG1hIG5hdmJhciBzdHJ1Y3R1cmU6XHJcbiAgPG5hdj5cclxuICAgIDxuYXZiYXItYnJhbmQ+XHJcbiAgICAgIDxuYXZiYXItYnVyZ2VyPiAob3B0aW9uYWwpXHJcbiAgICA8L25hdmJhci1icmFuZD5cclxuICAgIDxuYXZiYXItbWVudT5cclxuICAgICAgPG5hdmJhci1zdGFydD5cclxuICAgICAgPC9uYXZiYXItc3RhcnQ+XHJcbiAgICAgIDxuYXZiYXItZW5kPlxyXG4gICAgICA8L25hdmJhci1lbmQ+XHJcbiAgICA8L25hdmJhci1tZW51PlxyXG4gIDwvbmF2PlxyXG4qL1xyXG5cclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IG5hdmJhciA9IHtcclxuXHJcbiAgZ2VuZXJhdGVOYXZiYXIobG9nZ2VkSW5Cb29sZWFuKSB7XHJcblxyXG4gICAgLy8gbmF2YmFyLW1lbnUgKHJpZ2h0IHNpZGUgb2YgbmF2YmFyIC0gYXBwZWFycyBvbiBkZXNrdG9wIDEwMjRweCspXHJcbiAgICBjb25zdCBidXR0b24yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW5cIilcclxuICAgIGNvbnN0IGJ1dHRvbjEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwXCIpXHJcbiAgICBjb25zdCBidXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGJ1dHRvbjEsIGJ1dHRvbjIpXHJcbiAgICBjb25zdCBtZW51SXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBudWxsLCBidXR0b25Db250YWluZXIpXHJcbiAgICBjb25zdCBuYXZiYXJFbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWVuZFwiIH0sIG51bGwsIG1lbnVJdGVtMSlcclxuICAgIGNvbnN0IG5hdmJhclN0YXJ0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1zdGFydFwiIH0pXHJcbiAgICBjb25zdCBuYXZiYXJNZW51ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIm5hdmJhck1lbnVcIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1tZW51XCIgfSwgbnVsbCwgbmF2YmFyU3RhcnQsIG5hdmJhckVuZClcclxuXHJcbiAgICAvLyBuYXZiYXItYnJhbmQgKGxlZnQgc2lkZSBvZiBuYXZiYXIgLSBpbmNsdWRlcyBtb2JpbGUgaGFtYnVyZ2VyIG1lbnUpXHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcInJvbGVcIjogXCJidXR0b25cIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1idXJnZXIgYnVyZ2VyXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1lbnVcIiwgXCJhcmlhLWV4cGFuZGVkXCI6IFwiZmFsc2VcIiwgXCJkYXRhLXRhcmdldFwiOiBcIm5hdmJhck1lbnVcIiB9LCBudWxsLCBidXJnZXJNZW51U3BhbjEsIGJ1cmdlck1lbnVTcGFuMiwgYnVyZ2VyTWVudVNwYW4zKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQxID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiLCBcImhyZWZcIjogXCIjXCIgfSwgbnVsbCwgZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvZmlyZTkwZGVnLnBuZ1wiLCBcIndpZHRoXCI6IFwiMTEyXCIsIFwiaGVpZ2h0XCI6IFwiMjhcIiB9KSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItYnJhbmRcIiB9LCBudWxsLCBuYXZiYXJCcmFuZENoaWxkMSwgbmF2YmFyQnJhbmRDaGlsZDIpO1xyXG5cclxuICAgIC8vIG5hdiAocGFyZW50IG5hdiBIVE1MIGVsZW1lbnQpXHJcbiAgICBjb25zdCBuYXYgPSBlbEJ1aWxkZXIoXCJuYXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyXCIsIFwicm9sZVwiOiBcIm5hdmlnYXRpb25cIiwgXCJhcmlhLWxhYmVsXCI6IFwibWFpbiBuYXZpZ2F0aW9uXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmQsIG5hdmJhck1lbnUpO1xyXG5cclxuICAgIC8vIGlmIGxvZ2dlZCBpbiwgYXBwZW5kIGFkZGl0aW9uYWwgbWVudSBvcHRpb25zIHRvIG5hdmJhciBhbmQgcmVtb3ZlIHNpZ251cC9sb2dpbiBidXR0b25zXHJcbiAgICBpZiAobG9nZ2VkSW5Cb29sZWFuKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBsb2cgaW4gYW5kIHNpZ24gdXAgYnV0dG9uc1xyXG4gICAgICBjb25zdCBzaWdudXAgPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1swXTtcclxuICAgICAgY29uc3QgbG9naW4gPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1sxXTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKHNpZ251cCk7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChsb2dpbik7XHJcbiAgICAgIC8vIGFkZCBsb2dvdXQgYnV0dG9uXHJcbiAgICAgIGNvbnN0IGJ1dHRvbjMgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dvdXRcIik7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChidXR0b24zKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhbmQgYXBwZW5kIG5ldyBtZW51IGl0ZW1zIGZvciB1c2VyXHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJIb21lXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiUHJvZmlsZVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkdhbWVwbGF5XCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW00ID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiSGVhdG1hcHNcIik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0yKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMyk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gbmF2YmFyXHJcbiAgICB0aGlzLm5hdmJhckV2ZW50TWFuYWdlcihuYXYpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlTmF2LmFwcGVuZENoaWxkKG5hdik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYWRkcyBhIHNpbmdsZSBjbGljayBsaXN0ZW5lciB0byB0aGUgbmF2IHRoYXQgcmVkaXJlY3RzIHRoZSB1c2VyIHRvIHRoZSBjb3JyZWN0IHBhZ2VcclxuICAgIC8vIGJhc2VkIG9uIHRoZSB0ZXh0IGNvbnRlbnQgb2YgdGhlIHRhcmdldFxyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xyXG5cclxuICAgICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ2luXCIpIHtcclxuICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luRm9ybSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgICAgbG9naW5PclNpZ251cC5zaWdudXBGb3JtKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dvdXRcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpO1xyXG4gICAgICAgIGxvZ2luT3JTaWdudXAubG9nb3V0VXNlcigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiUHJvZmlsZVwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuY2xlYXJIZWF0bWFwUmVwYWludEludGVydmFsKCk7XHJcbiAgICAgICAgcHJvZmlsZS5sb2FkUHJvZmlsZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiR2FtZXBsYXlcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpO1xyXG4gICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiSGVhdG1hcHNcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZUJhbGxTcGVlZEdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgICAgICBoZWF0bWFwcy5sb2FkSGVhdG1hcENvbnRhaW5lcnMoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmF2YmFyIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcbmxldCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHVzZWQgdG8gY291bnQgdG90YWwgZ2FtZXMgYW5kIHNob3RzXHJcbmxldCBnYW1lSWRzID0gW107XHJcblxyXG5jb25zdCBwcm9maWxlID0ge1xyXG5cclxuICBsb2FkUHJvZmlsZSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICAvLyBnZXQgdXNlciwgdGhlbiBwdXNoIGFsbCB1bmlxdWUgZ2FtZSBJRHMgdG8gYXJyYXksIHRoZW4gZmV0Y2ggYWxsIHNob3RzIGFzc29jaWF0ZWQgd2l0aCBnYW1lIElkc1xyXG4gICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJ1c2Vyc1wiLCBhY3RpdmVVc2VySWQpLnRoZW4odXNlciA9PiB7XHJcbiAgICAgIEFQSS5nZXRBbGwoYGdhbWVzP3VzZXJJZD0ke3VzZXIuaWR9YCkudGhlbihnYW1lcyA9PiB7XHJcbiAgICAgICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChnYW1lSWRzKTtcclxuICAgICAgfSlcclxuICAgICAgICAudGhlbihnYW1lSWRzID0+IHtcclxuICAgICAgICAgIGlmIChnYW1lSWRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBjYWxsIG5leHQgZnVuY3Rpb24gaW4gY2hhaW4gb2YgZnVuY3Rpb25zIHRvIGdldCBwbGF5c3R5bGVcclxuICAgICAgICAgICAgbGV0IHNob3RzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuZGV0ZXJtaW5lUGxheXN0eWxlKHVzZXIsIHNob3RzLCBnYW1lSWRzKTtcclxuICAgICAgICAgICAgZ2FtZUlkcyA9IFtdO1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBVUkwgPSBcInNob3RzXCI7XHJcbiAgICAgICAgICAgIGdhbWVJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKFVSTCA9PT0gXCJzaG90c1wiKSB7XHJcbiAgICAgICAgICAgICAgICBVUkwgKz0gYD9nYW1lSWQ9JHtpZH1gXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFVSTCArPSBgJmdhbWVJZD0ke2lkfWBcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiBBUEkuZ2V0QWxsKFVSTClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KS50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgIC8vIGNhbGwgbmV4dCBmdW5jdGlvbiBpbiBjaGFpbiBvZiBmdW5jdGlvbnMgdG8gZ2V0IHBsYXlzdHlsZVxyXG4gICAgICAgICAgdGhpcy5kZXRlcm1pbmVQbGF5c3R5bGUodXNlciwgc2hvdHMsIGdhbWVJZHMpO1xyXG4gICAgICAgICAgZ2FtZUlkcyA9IFtdO1xyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICB9LFxyXG5cclxuICBkZXRlcm1pbmVQbGF5c3R5bGUodXNlciwgc2hvdHMsIGdhbWVJZHMpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdXNlcyBhdmcgZmllbGQgY29vcmRpbmF0ZXMgdG8gbGFiZWwgdGhlIHVzZXIncyBwbGF5c3R5bGUgZm9yIHRoZWlyIHByb2ZpbGUgcGFnZVxyXG5cclxuICAgIC8vIGlmIHVzZXIgaGFzbid0IHNhdmVkIGFueSBnYW1lcywgcGFzcyBjb3JyZWN0IGluZm9ybWF0aW9uIHRvIGJ1aWxkIGZ1bmN0aW9uXHJcbiAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYnVpbGRQcm9maWxlKHVzZXIsIHNob3RzLCBnYW1lSWRzLCBcInVua25vd24gcG9zaXRpb25cIilcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc3VtWCA9IDA7XHJcbiAgICBsZXQgc3VtWSA9IDA7XHJcbiAgICBsZXQgYXZnWDtcclxuICAgIGxldCBhdmdZO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHN1bVggKz0gc2hvdC5maWVsZFg7XHJcbiAgICAgIHN1bVkgKz0gc2hvdC5maWVsZFk7XHJcbiAgICB9KVxyXG5cclxuICAgIGF2Z1ggPSBzdW1YIC8gc2hvdHMubGVuZ3RoO1xyXG4gICAgYXZnWSA9IHN1bVkgLyBzaG90cy5sZW5ndGg7XHJcbiAgICBsZXQgZmllbGRQb3NpdGlvbjtcclxuXHJcbiAgICBpZiAoYXZnWCA8IDAuMTUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwia2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4xNSA8PSBhdmdYICYmIGF2Z1ggPD0gMC4zMCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJzd2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJsZWZ0IGZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJyaWdodCBmdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNDUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiY2VudGVyIGZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJsZWZ0IGhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJyaWdodCBoYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNjApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiY2VudGVyIGhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC42MCA8PSBhdmdYICYmIGF2Z1ggPCAwLjc1ICYmIGF2Z1kgPD0gMC41MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJsZWZ0IGZvcndhcmRcIlxyXG4gICAgfSBlbHNlIGlmICgwLjYwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNzUgJiYgMC41MCA8IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwicmlnaHQgZm9yd2FyZFwiXHJcbiAgICB9IGVsc2UgaWYgKDAuNzUgPD0gYXZnWCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJzdHJpa2VyXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBjYWxsIGZ1bmN0aW9uIHRvIGxvYWQgY29udGFpbmVycyB1c2luZyBhbGwgZmV0Y2hlZCBpbmZvcm1hdGlvblxyXG4gICAgdGhpcy5idWlsZFByb2ZpbGUodXNlciwgc2hvdHMsIGdhbWVJZHMsIGZpZWxkUG9zaXRpb24pO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkUHJvZmlsZSh1c2VyLCBzaG90cywgZ2FtZUlkcywgZmllbGRQb3NpdGlvbikge1xyXG5cclxuICAgIC8vIG1lZGlhIGNvbnRhaW5lcnMgc2hvd2luZyB1c2VyIHN0YXRzIChhcHBlbmRlZCB0byBjYXJkIGNvbnRhaW5lcilcclxuICAgIGNvbnN0IHBsYXlzdHlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy0zXCIgfSwgYFBsYXlzICR7ZmllbGRQb3NpdGlvbn1gKVxyXG4gICAgY29uc3QgcGxheXN0eWxlQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250ZW50XCIgfSwgbnVsbCwgcGxheXN0eWxlKVxyXG4gICAgY29uc3QgcGxheXN0eWxlQ29udGVudFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1jb250ZW50XCIgfSwgbnVsbCwgcGxheXN0eWxlQ29udGVudClcclxuICAgIGNvbnN0IGljb24zID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvaWNvbnMvaWNvbnM4LXN0YWRpdW0tOTYucG5nXCIgfSwgbnVsbClcclxuICAgIGNvbnN0IGljb25QYXJlbnQzID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTQ4eDQ4XCIgfSwgbnVsbCwgaWNvbjMpXHJcbiAgICBjb25zdCBsZWZ0MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgaWNvblBhcmVudDMpO1xyXG4gICAgY29uc3QgdXNlclBsYXlzdHlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYSBpcy1tYXJnaW5sZXNzXCIsIFwic3R5bGVcIjogXCJwYWRkaW5nOjIwcHg7XCIgfSwgbnVsbCwgbGVmdDMsIHBsYXlzdHlsZUNvbnRlbnRQYXJlbnQpXHJcblxyXG4gICAgY29uc3QgZ2FtZVN0YXRzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTJcIiB9LCBgJHtnYW1lSWRzLmxlbmd0aH0gZ2FtZXNgKVxyXG4gICAgY29uc3QgZ2FtZUNvbnRlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGVudFwiIH0sIG51bGwsIGdhbWVTdGF0cylcclxuICAgIGNvbnN0IGdhbWVDb250ZW50UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhLWNvbnRlbnRcIiB9LCBudWxsLCBnYW1lQ29udGVudClcclxuICAgIGNvbnN0IGljb24yID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvaWNvbnMvaWNvbnM4LWdhbWUtY29udHJvbGxlci0xMDAucG5nXCIgfSwgbnVsbClcclxuICAgIGNvbnN0IGljb25QYXJlbnQyID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTQ4eDQ4XCIgfSwgbnVsbCwgaWNvbjIpXHJcbiAgICBjb25zdCBsZWZ0MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgaWNvblBhcmVudDIpO1xyXG4gICAgY29uc3QgdG90YWxHYW1lcyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYSBpcy1tYXJnaW5sZXNzXCIsIFwic3R5bGVcIjogXCJwYWRkaW5nOjIwcHg7XCIgfSwgbnVsbCwgbGVmdDIsIGdhbWVDb250ZW50UGFyZW50KVxyXG5cclxuICAgIGNvbnN0IGdvYWxTdGF0cyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy0yXCIgfSwgYCR7c2hvdHMubGVuZ3RofSBnb2Fsc2ApXHJcbiAgICBjb25zdCBnb2FsQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250ZW50XCIgfSwgbnVsbCwgZ29hbFN0YXRzKVxyXG4gICAgY29uc3QgZ29hbENvbnRlbnRQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibWVkaWEtY29udGVudFwiIH0sIG51bGwsIGdvYWxDb250ZW50KVxyXG4gICAgY29uc3QgaWNvbjEgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9pY29ucy9pY29uczgtc29jY2VyLWJhbGwtOTYucG5nXCIgfSwgbnVsbClcclxuICAgIGNvbnN0IGljb25QYXJlbnQxID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTQ4eDQ4XCIgfSwgbnVsbCwgaWNvbjEpXHJcbiAgICBjb25zdCBsZWZ0MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgaWNvblBhcmVudDEpO1xyXG4gICAgY29uc3QgdG90YWxHb2FscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYSBpcy1tYXJnaW5sZXNzXCIsIFwic3R5bGVcIjogXCJwYWRkaW5nOjIwcHg7XCIgfSwgbnVsbCwgbGVmdDEsIGdvYWxDb250ZW50UGFyZW50KVxyXG5cclxuICAgIC8vIGNhcmQgY29udGFpbmVyIHByb2ZpbGUgcGljdHVyZSwgY2FyIHBob3RvLCBuYW1lLCB1c2VybmFtZSwgYW5kIG1lbWJlciBzaW5jZSBtbS9kZC95eXl5XHJcbiAgICBsZXQgY2FySW1nVmFyaWFibGUgPSB1c2VyLmNhci50b0xvd2VyQ2FzZSgpO1xyXG4gICAgbGV0IHByb2ZpbGVJbWdWYXJpYWJsZSA9IHVzZXIucGljdHVyZTtcclxuICAgIGxldCBwcm9maWxlSW1nVGl0bGUgPSB1c2VyLnBpY3R1cmU7XHJcbiAgICBpZiAodXNlci5waWN0dXJlID09PSBcIlwiKSB7XHJcbiAgICAgIHByb2ZpbGVJbWdWYXJpYWJsZSA9IFwiaW1hZ2VzL3Byb2ZpbGUtcGxhY2Vob2xkZXIuanBnXCJcclxuICAgICAgcHJvZmlsZUltZ1RpdGxlID0gXCJwcm9maWxlLXBsYWNlaG9sZGVyLmpwZ1wiXHJcbiAgICB9XHJcbiAgICBsZXQgbWVtYmVyU2luY2VEYXRlRm9ybWF0dGVkID0gbmV3IERhdGUodXNlci5qb2luZWQpLnRvTG9jYWxlU3RyaW5nKCkuc3BsaXQoXCIsXCIpWzBdO1xyXG5cclxuICAgIGNvbnN0IG1lbWJlclNpbmNlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInN1YnRpdGxlIGlzLTZcIiwgXCJzdHlsZVwiOiBcIm1hcmdpbi10b3A6MTBweFwiIH0sIGBCZWNhbWUgYSBob3RzaG90IG9uICR7bWVtYmVyU2luY2VEYXRlRm9ybWF0dGVkfWApXHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJ0YWdcIiB9LCBgQCR7dXNlci51c2VybmFtZX1gKTtcclxuICAgIGNvbnN0IG5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNCBpcy1tYXJnaW5sZXNzXCIgfSwgYCR7dXNlci5uYW1lfWApO1xyXG4gICAgY29uc3QgdXNlckluZm8gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibWVkaWEtY29udGVudFwiIH0sIG51bGwsIG5hbWUsIHVzZXJuYW1lLCBtZW1iZXJTaW5jZSk7XHJcbiAgICBjb25zdCBjYXJJbWcgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBgaW1hZ2VzL2NhcnMvJHtjYXJJbWdWYXJpYWJsZX0ucG5nYCwgXCJhbHRcIjogXCJjYXJcIiwgXCJ0aXRsZVwiOiBgJHtjYXJJbWdWYXJpYWJsZX1gIH0sIG51bGwpO1xyXG4gICAgY29uc3QgY2FySW1nRmlndXJlID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTk2eDk2XCIgfSwgbnVsbCwgY2FySW1nKTtcclxuICAgIGNvbnN0IGNhckltZ1BhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgY2FySW1nRmlndXJlKTtcclxuICAgIGNvbnN0IG1lZGlhID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhXCIgfSwgbnVsbCwgY2FySW1nUGFyZW50LCB1c2VySW5mbyk7XHJcbiAgICBjb25zdCBjb250ZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNhcmQtY29udGVudFwiIH0sIG51bGwsIG1lZGlhKTtcclxuICAgIC8vIG1haW4gcHJvZmlsZSBwaWN0dXJlXHJcbiAgICBjb25zdCBJbWcgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBgJHtwcm9maWxlSW1nVmFyaWFibGV9YCwgXCJhbHRcIjogXCJwcm9maWxlIHBpY3R1cmVcIiwgXCJ0aXRsZVwiOiBgJHtwcm9maWxlSW1nVGl0bGV9YCB9KTtcclxuICAgIGNvbnN0IGZpZ3VyZSA9IGVsQnVpbGRlcihcImZpZ3VyZVwiLCB7IFwiY2xhc3NcIjogXCJpbWFnZVwiIH0sIG51bGwsIEltZyk7XHJcbiAgICBjb25zdCBwcm9maWxlUGljdHVyZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjYXJkLWltYWdlXCIgfSwgbnVsbCwgZmlndXJlKTtcclxuICAgIGNvbnN0IGNhcmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY2FyZFwiIH0sIG51bGwsIHByb2ZpbGVQaWN0dXJlLCBjb250ZW50LCB0b3RhbEdvYWxzLCB0b3RhbEdhbWVzLCB1c2VyUGxheXN0eWxlKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVycyB0aGF0IG9yZ2FuaXplIHByb2ZpbGUgaW5mb3JtYXRpb24gaW50byBjb2x1bW5zXHJcbiAgICBjb25zdCBibGFua0NvbHVtbkxlZnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS1mb3VydGhcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IHByb2ZpbGVDb2x1bW4gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLWhhbGZcIiB9LCBudWxsLCBjYXJkKTtcclxuICAgIGNvbnN0IGJsYW5rQ29sdW1uUmlnaHQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS1mb3VydGhcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGNvbHVtbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1ucyBpcy12Y2VudGVyZWRcIiB9LCBudWxsLCBibGFua0NvbHVtbkxlZnQsIHByb2ZpbGVDb2x1bW4sIGJsYW5rQ29sdW1uUmlnaHQpO1xyXG4gICAgY29uc3QgcGxheWVyUHJvZmlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJwcm9maWxlQ29udGFpbmVyXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXJcIiwgXCJzdHlsZVwiOiBcInBhZGRpbmc6MjBweDtcIiB9LCBudWxsLCBjb2x1bW5zKTtcclxuXHJcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChwbGF5ZXJQcm9maWxlKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHByb2ZpbGUiLCJjbGFzcyBzaG90T25Hb2FsIHtcclxuICBzZXQgZmllbGRYKGZpZWxkWCkge1xyXG4gICAgdGhpcy5fZmllbGRYID0gZmllbGRYXHJcbiAgfVxyXG4gIHNldCBmaWVsZFkoZmllbGRZKSB7XHJcbiAgICB0aGlzLl9maWVsZFkgPSBmaWVsZFlcclxuICB9XHJcbiAgc2V0IGdvYWxYKGdvYWxYKSB7XHJcbiAgICB0aGlzLl9nb2FsWCA9IGdvYWxYXHJcbiAgfVxyXG4gIHNldCBnb2FsWShnb2FsWSkge1xyXG4gICAgdGhpcy5fZ29hbFkgPSBnb2FsWVxyXG4gIH1cclxuICBzZXQgYWVyaWFsKGFlcmlhbEJvb2xlYW4pIHtcclxuICAgIHRoaXMuX2FlcmlhbCA9IGFlcmlhbEJvb2xlYW5cclxuICB9XHJcbiAgc2V0IGJhbGxTcGVlZChiYWxsU3BlZWQpIHtcclxuICAgIHRoaXMuYmFsbF9zcGVlZCA9IGJhbGxTcGVlZFxyXG4gIH1cclxuICBzZXQgdGltZVN0YW1wKGRhdGVPYmopIHtcclxuICAgIHRoaXMuX3RpbWVTdGFtcCA9IGRhdGVPYmpcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3RPbkdvYWwiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3RPbkdvYWwgZnJvbSBcIi4vc2hvdENsYXNzXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCI7XHJcblxyXG5sZXQgc2hvdENvdW50ZXIgPSAwO1xyXG5sZXQgZWRpdGluZ1Nob3QgPSBmYWxzZTsgLy9lZGl0aW5nIHNob3QgaXMgdXNlZCBmb3IgYm90aCBuZXcgYW5kIG9sZCBzaG90c1xyXG5sZXQgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxubGV0IHNob3RBcnJheSA9IFtdOyAvLyByZXNldCB3aGVuIGdhbWUgaXMgc2F2ZWRcclxuLy8gZ2xvYmFsIHZhcnMgdXNlZCB3aXRoIHNob3QgZWRpdGluZ1xyXG5sZXQgcHJldmlvdXNTaG90T2JqO1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRYO1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRZO1xyXG5sZXQgcHJldmlvdXNTaG90R29hbFg7XHJcbmxldCBwcmV2aW91c1Nob3RHb2FsWTtcclxuLy8gZ2xvYmFsIHZhciB1c2VkIHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lICh0byBkZXRlcm1pbmUgaWYgbmV3IHNob3RzIHdlcmUgYWRkZWQgZm9yIFBPU1QpXHJcbmxldCBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXk7XHJcblxyXG5jb25zdCBzaG90RGF0YSA9IHtcclxuXHJcbiAgcmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiBnYW1lcGxheSBpcyBjbGlja2VkIG9uIHRoZSBuYXZiYXIgYW5kIHdoZW4gYSBnYW1lIGlzIHNhdmVkLCBpbiBvcmRlciB0byBwcmV2ZW50IGJ1ZyBjb25mbGljdHMgd2l0aCBwcmV2aW91c2x5IGNyZWF0ZWQgc2hvdHNcclxuICAgIHNob3RDb3VudGVyID0gMDtcclxuICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgc2hvdEFycmF5ID0gW107XHJcbiAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gdW5kZWZpbmVkO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZU5ld1Nob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuICAgIHNob3RPYmogPSBuZXcgc2hvdE9uR29hbDtcclxuICAgIHNob3RPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IHVzZXIgZnJvbSBzZWxlY3RpbmcgYW55IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKHRydWUpO1xyXG5cclxuICAgIGVkaXRpbmdTaG90ID0gdHJ1ZTtcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG5cclxuICAgIC8vIGFjdGl2YXRlIGNsaWNrIGZ1bmN0aW9uYWxpdHkgYW5kIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgb24gYm90aCBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICB9LFxyXG5cclxuICBnZXRDbGlja0Nvb3JkcyhlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdldHMgdGhlIHJlbGF0aXZlIHggYW5kIHkgb2YgdGhlIGNsaWNrIHdpdGhpbiB0aGUgZmllbGQgaW1hZ2UgY29udGFpbmVyXHJcbiAgICAvLyBhbmQgdGhlbiBjYWxscyB0aGUgZnVuY3Rpb24gdGhhdCBhcHBlbmRzIGEgbWFya2VyIG9uIHRoZSBwYWdlXHJcbiAgICBsZXQgcGFyZW50Q29udGFpbmVyO1xyXG4gICAgaWYgKGUudGFyZ2V0LmlkID09PSBcImZpZWxkLWltZ1wiKSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgfVxyXG4gICAgLy8gb2Zmc2V0WCBhbmQgWSBhcmUgdGhlIHggYW5kIHkgY29vcmRpbmF0ZXMgKHBpeGVscykgb2YgdGhlIGNsaWNrIGluIHRoZSBjb250YWluZXJcclxuICAgIC8vIHRoZSBleHByZXNzaW9ucyBkaXZpZGUgdGhlIGNsaWNrIHggYW5kIHkgYnkgdGhlIHBhcmVudCBmdWxsIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgIGNvbnN0IHhDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFggLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpXHJcbiAgICBjb25zdCB5Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRZIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkudG9GaXhlZCgzKSk7XHJcbiAgICAvLyByZXN0cmljdCB1c2VyIGZyb20gc3VibWl0dGluZyBhIGNsaWNrIGluIHRoZSBnb2FsIGlmIHkgPCAwLjIwIG9yIHkgPiAwLjg1IG9yIHggPiAwLjkwIG9yIHggPCAwLjEwXHJcbiAgICBpZiAocGFyZW50Q29udGFpbmVyLmlkID09PSBcImdvYWwtaW1nLXBhcmVudFwiICYmIHlDb29yZFJlbGF0aXZlIDwgMC4yMCB8fCB5Q29vcmRSZWxhdGl2ZSA+IDAuODUgfHwgeENvb3JkUmVsYXRpdmUgPCAwLjEwIHx8IHhDb29yZFJlbGF0aXZlID4gMC45MCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeENvb3JkUmVsYXRpdmUsIHlDb29yZFJlbGF0aXZlLCBwYXJlbnRDb250YWluZXIpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpIHtcclxuICAgIGxldCBtYXJrZXJJZDtcclxuICAgIGlmIChwYXJlbnRDb250YWluZXIuaWQgPT09IFwiZmllbGQtaW1nLXBhcmVudFwiKSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1maWVsZFwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWdvYWxcIjtcclxuICAgIH1cclxuICAgIC8vIGFkanVzdCBmb3IgNTAlIG9mIHdpZHRoIGFuZCBoZWlnaHQgb2YgbWFya2VyIHNvIGl0J3MgY2VudGVyZWQgYWJvdXQgbW91c2UgcG9pbnRlclxyXG4gICAgbGV0IGFkanVzdE1hcmtlclggPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IGFkanVzdE1hcmtlclkgPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIE5PVCBhbHJlYWR5IGEgbWFya2VyLCB0aGVuIG1ha2Ugb25lIGFuZCBwbGFjZSBpdFxyXG4gICAgaWYgKCFwYXJlbnRDb250YWluZXIuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpKSkge1xyXG4gICAgICB0aGlzLmdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpO1xyXG4gICAgICAvLyBlbHNlIG1vdmUgdGhlIGV4aXN0aW5nIG1hcmtlciB0byB0aGUgbmV3IHBvc2l0aW9uXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpO1xyXG4gICAgfVxyXG4gICAgLy8gc2F2ZSBjb29yZGluYXRlcyB0byBvYmplY3RcclxuICAgIHRoaXMuYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSlcclxuICB9LFxyXG5cclxuICBnZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgZGl2LmlkID0gbWFya2VySWQ7XHJcbiAgICBkaXYuc3R5bGUud2lkdGggPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImZpcmVicmlja1wiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCI1MCVcIjtcclxuICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgIGRpdi5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgZGl2LnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpO1xyXG4gIH0sXHJcblxyXG4gIG1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpIHtcclxuICAgIGNvbnN0IGN1cnJlbnRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCk7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICB9LFxyXG5cclxuICBhZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHVwZGF0ZXMgdGhlIGluc3RhbmNlIG9mIHNob3RPbkdvYWwgY2xhc3MgdG8gcmVjb3JkIGNsaWNrIGNvb3JkaW5hdGVzXHJcbiAgICAvLyBpZiBhIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIGFwcGVuZCB0aGUgY29vcmRpbmF0ZXMgdG8gdGhlIG9iamVjdCBpbiBxdWVzdGlvblxyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgLy8gdXNlIGdsb2JhbCB2YXJzIGluc3RlYWQgb2YgdXBkYXRpbmcgb2JqZWN0IGRpcmVjdGx5IGhlcmUgdG8gcHJldmVudCBhY2NpZGVudGFsIGVkaXRpbmcgb2YgbWFya2VyIHdpdGhvdXQgY2xpY2tpbmcgXCJzYXZlIHNob3RcIlxyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIG90aGVyd2lzZSwgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBzbyBhcHBlbmQgY29vcmRpbmF0ZXMgdG8gdGhlIG5ldyBvYmplY3RcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaG90T2JqLmdvYWxYID0geDtcclxuICAgICAgICBzaG90T2JqLmdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbFNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBpZiAoZmllbGRNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdvYWxNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZSBjbGljayBsaXN0ZW5lcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGZpcnN0IGNoZWNrIGlmIGJhbGwgc3BlZWQgZW50cnkgaXMgYmxhbmsgb3IgaWYgdGhlIGZpZWxkL2dvYWwgaW1hZ2VzIGhhdmVuJ3QgYmVlbiBjbGlja2VkXHJcbiAgICAgIC8vIG5vdGUgXCJlXCIgaXMgY29uc2lkZXJlZCBhIG51bWJlciBhbmQgc2hvdWxkIG5vdCBiZSBhY2NlcHRlZCBlaXRoZXJcclxuICAgICAgaWYgKGlucHRfYmFsbFNwZWVkLnZhbHVlID09PSBcIlwiIHx8IGdvYWxNYXJrZXIgPT09IG51bGwgfHwgZmllbGRNYXJrZXIgPT09IG51bGwpIHtcclxuICAgICAgICBhbGVydChcIkEgYmFsbCBzcGVlZCwgYSBmaWVsZCBtYXJrZXIsIGFuZCBhIGdvYWwgbWFya2VyIGFyZSBhbGwgcmVxdWlyZWQgdG8gc2F2ZSBhIHNob3QuIElmIGJhbGwgc3BlZWQgaXMgdW5rbm93biwgdXNlIHlvdXIgYXZlcmFnZSBsaXN0ZWQgb24gdGhlIGhlYXRtYXBzIHBhZ2UuXCIpO1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAvLyBjbGVhciBmaWVsZCBhbmQgZ29hbCBldmVudCBsaXN0ZW5lcnNcclxuICAgICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAgIGdvYWxJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgICAvLyByZW1vdmUgbWFya2VycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICAgIGdvYWxJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZ29hbE1hcmtlcik7XHJcbiAgICAgICAgLy8gY29uZGl0aW9uYWwgc3RhdGVtZW50IHRvIHNhdmUgY29ycmVjdCBvYmplY3QgKGkuZS4gc2hvdCBiZWluZyBlZGl0ZWQgdnMuIG5ldyBzaG90KVxyXG4gICAgICAgIC8vIGlmIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHByZXZpb3VzU2hvdE9iaiB3aWxsIG5vdCBiZSB1bmRlZmluZWRcclxuICAgICAgICBpZiAocHJldmlvdXNTaG90T2JqICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgICBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgICAgcHJldmlvdXNTaG90T2JqLl9maWVsZFggPSBwcmV2aW91c1Nob3RGaWVsZFg7XHJcbiAgICAgICAgICBwcmV2aW91c1Nob3RPYmouX2ZpZWxkWSA9IHByZXZpb3VzU2hvdEZpZWxkWTtcclxuICAgICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFggPSBwcmV2aW91c1Nob3RHb2FsWDtcclxuICAgICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFkgPSBwcmV2aW91c1Nob3RHb2FsWTtcclxuICAgICAgICAgIC8vIGVsc2Ugc2F2ZSB0byBuZXcgaW5zdGFuY2Ugb2YgY2xhc3MgYW5kIGFwcGVuZCBidXR0b24gdG8gcGFnZSB3aXRoIGNvcnJlY3QgSUQgZm9yIGVkaXRpbmdcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgc2hvdE9iai5hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHNob3RPYmouYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICAgIHNob3RPYmouYmFsbFNwZWVkID0gaW5wdF9iYWxsU3BlZWQudmFsdWU7XHJcbiAgICAgICAgICBzaG90QXJyYXkucHVzaChzaG90T2JqKTtcclxuICAgICAgICAgIC8vIGFwcGVuZCBuZXcgYnV0dG9uXHJcbiAgICAgICAgICBzaG90Q291bnRlcisrO1xyXG4gICAgICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtzaG90Q291bnRlcn1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke3Nob3RDb3VudGVyfWApO1xyXG4gICAgICAgICAgc2hvdEJ0bkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdTaG90QnRuKTtcclxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7c2hvdENvdW50ZXJ9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnJlbmRlclNhdmVkU2hvdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICAgICAgICAvLyBjYW5jZWwgdGhlIG5ldyBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgKG1hdHRlcnMgaWYgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkKVxyXG4gICAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgLy8gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZCAobWF0dGVycyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQpXHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgLy8gYWxsb3cgdXNlciB0byBzZWxlY3QgYW55IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2F2ZWRTaG90KGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVmZXJlbmNlcyB0aGUgc2hvdEFycmF5IHRvIGdldCBhIHNob3Qgb2JqZWN0IHRoYXQgbWF0Y2hlcyB0aGUgc2hvdCMgYnV0dG9uIGNsaWNrZWQgKGUuZy4gc2hvdCAyIGJ1dHRvbiA9IGluZGV4IDEgb2YgdGhlIHNob3RBcnJheSlcclxuICAgIC8vIHRoZSBmdW5jdGlvbiAoYW5kIGl0cyBhc3NvY2lhdGVkIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gb3RoZXIgbG9jYWwgZnVuY3Rpb25zKSBoYXMgdGhlc2UgYmFzaWMgcmVxdWlyZW1lbnRzOlxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBjbGljayBsaXN0ZW5lcnMgb24gaW1hZ2VzXHJcbiAgICAvLyByZXZpdmUgYSBzYXZlZCBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgaW4gdGhlIHNob3RBcnJheSBmb3IgZWRpdGluZyBzaG90IGNvb3JkaW5hdGVzLCBiYWxsIHNwZWVkLCBhbmQgYWVyaWFsXHJcbiAgICAvLyByZW5kZXIgbWFya2VycyBmb3IgZXhpc3RpbmcgY29vcmRpbmF0ZXMgb24gZmllbGQgYW5kIGdvYWwgaW1hZ2VzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIHNhdmUgZWRpdHNcclxuICAgIC8vIGFmZm9yZGFuY2UgdG8gY2FuY2VsIGVkaXRzXHJcbiAgICAvLyB0aGUgZGF0YSBpcyByZW5kZXJlZCBvbiB0aGUgcGFnZSBhbmQgY2FuIGJlIHNhdmVkIChvdmVyd3JpdHRlbikgYnkgdXNpbmcgdGhlIFwic2F2ZSBzaG90XCIgYnV0dG9uIG9yIGNhbmNlbGVkIGJ5IGNsaWNraW5nIHRoZSBcImNhbmNlbCBzaG90XCIgYnV0dG9uXHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIC8vIHByZXZlbnQgbmV3IHNob3QgYnV0dG9uIGZyb20gYmVpbmcgY2xpY2tlZFxyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgLy8gYWxsb3cgY2FuY2VsIGFuZCBzYXZlZCBidXR0b25zIHRvIGJlIGNsaWNrZWRcclxuICAgIGVkaXRpbmdTaG90ID0gdHJ1ZTtcclxuICAgIC8vIGdldCBJRCBvZiBzaG90IyBidG4gY2xpY2tlZCBhbmQgYWNjZXNzIHNob3RBcnJheSBhdCBbYnRuSUQgLSAxXVxyXG4gICAgbGV0IGJ0bklkID0gZS50YXJnZXQuaWQuc2xpY2UoNSk7XHJcbiAgICBwcmV2aW91c1Nob3RPYmogPSBzaG90QXJyYXlbYnRuSWQgLSAxXTtcclxuICAgIC8vIHJlbmRlciBiYWxsIHNwZWVkIGFuZCBhZXJpYWwgZHJvcGRvd24gZm9yIHRoZSBzaG90XHJcbiAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IHByZXZpb3VzU2hvdE9iai5iYWxsX3NwZWVkO1xyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID09PSB0cnVlKSB7IHNlbF9hZXJpYWwudmFsdWUgPSBcIkFlcmlhbFwiOyB9IGVsc2UgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiOyB9XHJcbiAgICAvLyBhZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGZpZWxkIGFuZCBnb2FsXHJcbiAgICBmaWVsZEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgLy8gcmVuZGVyIHNob3QgbWFya2VyIG9uIGZpZWxkXHJcbiAgICBsZXQgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpXHJcbiAgICBsZXQgeCA9IChwcmV2aW91c1Nob3RPYmouX2ZpZWxkWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgeSA9IChwcmV2aW91c1Nob3RPYmouX2ZpZWxkWSAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuICAgIC8vIHJlbmRlciBnb2FsIG1hcmtlciBvbiBmaWVsZFxyXG4gICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIilcclxuICAgIHggPSBOdW1iZXIoKChwcmV2aW91c1Nob3RPYmouX2dvYWxYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSk7XHJcbiAgICB5ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWSAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkudG9GaXhlZCgzKSk7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcblxyXG4gIH0sXHJcblxyXG4gIGRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZGlzYWJsZU9yTm90KSB7XHJcbiAgICAvLyBmb3IgZWFjaCBidXR0b24gYWZ0ZXIgXCJOZXcgU2hvdFwiLCBcIlNhdmUgU2hvdFwiLCBhbmQgXCJDYW5jZWwgU2hvdFwiIGRpc2FibGUgdGhlIGJ1dHRvbnMgaWYgdGhlIHVzZXIgaXMgY3JlYXRpbmcgYSBuZXcgc2hvdCAoZGlzYWJsZU9yTm90ID0gdHJ1ZSkgb3IgZW5hYmxlIHRoZW0gb24gc2F2ZS9jYW5jZWwgb2YgYSBuZXcgc2hvdCAoZGlzYWJsZU9yTm90ID0gZmFsc2UpXHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcbiAgICBsZXQgZWRpdEJ0bjtcclxuICAgIGxldCBsZW5ndGggPSBzaG90QnRuQ29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoO1xyXG4gICAgZm9yIChsZXQgaSA9IDM7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICBlZGl0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpIC0gMn1gKTtcclxuICAgICAgZWRpdEJ0bi5kaXNhYmxlZCA9IGRpc2FibGVPck5vdDtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKSB7XHJcbiAgICAvLyBwcm92aWRlcyBhcnJheSBmb3IgdXNlIGluIGdhbWVEYXRhLmpzICh3aGVuIHNhdmluZyBhIG5ldyBnYW1lLCBub3Qgd2hlbiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUpXHJcbiAgICByZXR1cm4gc2hvdEFycmF5O1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxOdW1PZlNob3RzKCkge1xyXG4gICAgLy8gcHJvdmlkZXMgaW5pdGlhbCBudW1iZXIgb2Ygc2hvdHMgdGhhdCB3ZXJlIHNhdmVkIHRvIGRhdGFiYXNlIHRvIGdhbWVEYXRhLmpzIHRvIGlkZW50aWZ5IGFuIGVkaXRlZCBnYW1lIGlzIGJlaW5nIHNhdmVkXHJcbiAgICByZXR1cm4gaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlclNob3RzQnV0dG9uc0Zyb21QcmV2aW91c0dhbWUoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlcXVlc3RzIHRoZSBhcnJheSBvZiBzaG90cyBmcm9tIHRoZSBwcmV2aW91cyBzYXZlZCBnYW1lLCBzZXRzIGl0IGFzIHNob3RBcnJheSwgYW5kIHJlbmRlcnMgc2hvdCBidXR0b25zXHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcbiAgICAvLyBnZXQgc2F2ZWQgZ2FtZSB3aXRoIHNob3RzIGVtYmVkZGVkIGFzIGFycmF5XHJcbiAgICBsZXQgc2F2ZWRHYW1lT2JqID0gZ2FtZURhdGEucHJvdmlkZVNob3RzVG9TaG90RGF0YSgpO1xyXG4gICAgLy8gY3JlYXRlIHNob3RBcnJheSB3aXRoIGZvcm1hdCByZXF1aXJlZCBieSBsb2NhbCBmdW5jdGlvbnNcclxuICAgIGxldCBzYXZlZFNob3RPYmpcclxuICAgIHNhdmVkR2FtZU9iai5zaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBzYXZlZFNob3RPYmogPSBuZXcgc2hvdE9uR29hbFxyXG4gICAgICBzYXZlZFNob3RPYmouZmllbGRYID0gc2hvdC5maWVsZFg7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5maWVsZFkgPSBzaG90LmZpZWxkWTtcclxuICAgICAgc2F2ZWRTaG90T2JqLmdvYWxYID0gc2hvdC5nb2FsWDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmdvYWxZID0gc2hvdC5nb2FsWTtcclxuICAgICAgc2F2ZWRTaG90T2JqLmFlcmlhbCA9IHNob3QuYWVyaWFsO1xyXG4gICAgICBzYXZlZFNob3RPYmouYmFsbF9zcGVlZCA9IHNob3QuYmFsbF9zcGVlZC50b1N0cmluZygpO1xyXG4gICAgICBzYXZlZFNob3RPYmoudGltZVN0YW1wID0gc2hvdC50aW1lU3RhbXBcclxuICAgICAgc2F2ZWRTaG90T2JqLmlkID0gc2hvdC5pZFxyXG4gICAgICBzaG90QXJyYXkucHVzaChzYXZlZFNob3RPYmopO1xyXG4gICAgfSlcclxuXHJcbiAgICBzaG90QXJyYXkuZm9yRWFjaCgoc2hvdCwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7aWR4ICsgMX1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke2lkeCArIDF9YCk7XHJcbiAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aWR4ICsgMX1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgIH0pO1xyXG4gICAgc2hvdENvdW50ZXIgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gc2hvdEFycmF5Lmxlbmd0aDtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90RGF0YSJdfQ==
