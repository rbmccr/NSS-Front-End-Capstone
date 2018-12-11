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
    }, "Ball speed (kph):");
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
// let intervalId;
// global variable to store fetched shots
let globalShotsArr;
let joinTableArr = []; // global variable used with ball speed filter on heatmaps

let configHeatmapWithBallspeed = false; // global variables used with date range filter

let startDate;
let endDate; // FIXME: examine confirmHeatmapDelete function. may not need for loop. grab ID from option
// TODO: set interval for container width monitoring
// TODO: if custom heatmap is selected from dropdown, then blur filter container
// FIXME: rendering a saved heatmap with date filter sometimes bugs out
// TODO: saving heatmap needs to append date with name of heatmap in dropdown menu

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
    console.log("Array of fetched shots", shots); // create field heatmap with configuration

    const fieldContainer = document.getElementById("field-img-parent");
    let varWidth = fieldContainer.offsetWidth;
    let varHeight = fieldContainer.offsetHeight;
    let fieldConfig = heatmapData.getFieldConfig(fieldContainer);
    let FieldHeatmapInstance;
    FieldHeatmapInstance = _heatmap.default.create(fieldConfig);
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

    FieldHeatmapInstance.setData(fieldData);
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
    } // if there's a heatmap loaded already, convert the config immediately to use the max ball speed
    // the IF statement is needed so the user can't immediately render a heatmap just by clicking
    // the speed filter
    // const fieldContainer = document.getElementById("field-img-parent");
    // const fieldHeatmapCanvas = fieldContainer.childNodes[2]
    // if (fieldHeatmapCanvas !== undefined) {
    //   heatmapData.getUserShots();
    // }

  },

  /*getActiveOffsets() {
    // this function evaluates the width of the heatmap container at 0.5 second intervals. If the width has changed,
    // then the heatmap canvas is repainted to fit within the container limits
    const fieldContainer = document.getElementById("field-img-parent")
    let captureWidth = fieldContainer.offsetWidth
    //evaluate container width after 0.5 seconds vs initial container width
    if (captureWidth === varWidth) {
      console.log("unchanged");
    } else {
      varWidth = captureWidth
      console.log("new width", varWidth);
      //clear heatmap
      fieldContainer.removeChild(fieldContainer.childNodes[0]);
      //build heatmap again
      heatmapData.buildHeatmap();
    }
  },*/
  saveHeatmap() {
    // this function is responsible for saving a heatmap object with a name and userId, then making join tables with
    // TODO: require unique heatmap name (may not need to do this if function below uses ID instead of name)
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const saveInput = document.getElementById("saveHeatmapInput");
    const fieldContainer = document.getElementById("field-img-parent");
    const heatmapTitle = saveInput.value;
    const fieldHeatmapCanvas = fieldContainer.childNodes[2]; // heatmap must have a title, the title cannot be "Save successful!" or "Basic Heatmap"
    // there must be a heatmap canvas loaded on the page, and the save button will not work if
    // the user is trying to save an already-saved heatmap (see internal if statement)

    if (heatmapTitle.length > 0 && heatmapTitle !== "Save successful" && heatmapTitle !== "Basic Heatmap" && fieldHeatmapCanvas !== undefined) {
      if (heatmapDropdown.value !== "Basic Heatmap") {
        saveInput.classList.add("is-danger");
        saveInput.value = "Cannot save prior heatmap";
        return;
      } else {
        saveInput.classList.remove("is-danger");
        heatmapData.saveHeatmapObject(heatmapTitle).then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(x => {
          console.log("join tables saved", x); // empty the temporary global array used with Promise.all

          joinTableArr = []; // append newly created heatmap as option element in select dropdown

          heatmapDropdown.appendChild((0, _elementBuilder.default)("option", {
            "id": `heatmap-${heatmapObj.id}`
          }, heatmapObj.name));
          saveInput.value = "Save successful";
        }));
      }
    } else {
      saveInput.classList.add("is-danger");
    }
  },

  saveHeatmapObject(heatmapTitle) {
    // this function saves a heatmap object with the user-provided name, the userId, and the current date/time
    const activeUserId = Number(sessionStorage.getItem("activeUserId"));
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
        //TODO: check this logic. may be able to use ID instead of requiring unique name
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
    console.log("shots", shots);
    console.log("games", games);
    let feedbackResults = {}; // get heatmap date generated

    let now = new Date().toLocaleString();
    feedbackResults.now = now;
    console.log(feedbackResults.now); // get range of dates on games (max and min)

    feedbackResults.lastGame = games.reduce((max, game) => game.timeStamp.split("T")[0] > max ? game.timeStamp.split("T")[0] : max, games[0].timeStamp.split("T")[0]);
    feedbackResults.firstGame = games.reduce((min, game) => game.timeStamp.split("T")[0] < min ? game.timeStamp.split("T")[0] : min, games[0].timeStamp.split("T")[0]); // get average field x,y coordinate of player based on shots and give player feedback

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
    console.log(feedbackResults);
    return this.buildLevels(feedbackResults);
  },

  buildLevels(feedbackResults) {
    const feedbackContainer = document.getElementById("heatmapAndFeedbackContainer"); // reformat heatmap generation time to remove seconds

    const timeReformat = [feedbackResults.now.split(":")[0], feedbackResults.now.split(":")[1]].join(":") + feedbackResults.now.split(":")[2].slice(2); // reformat dates with slashes and put year at end

    const dateReformat1 = [feedbackResults.firstGame.split("-")[1], feedbackResults.firstGame.split("-")[2]].join("/") + "/" + feedbackResults.firstGame.split("-")[0];
    const dateReformat2 = [feedbackResults.lastGame.split("-")[1], feedbackResults.lastGame.split("-")[2]].join("/") + "/" + feedbackResults.lastGame.split("-")[0]; // heatmap generation and range of dates on games (max and min)

    const item3_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${dateReformat2}`);
    const item3_child = (0, _elementBuilder.default)("p", {
      "class": "heading"
    }, "Last game");
    const item3_wrapper = (0, _elementBuilder.default)("div", {}, null, item3_child, item3_child2);
    const item3 = (0, _elementBuilder.default)("div", {
      "class": "column is-one-third has-text-centered"
    }, null, item3_wrapper);
    const item2_child2 = (0, _elementBuilder.default)("p", {
      "class": "title is-6"
    }, `${dateReformat1}`);
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
    }, "Shots Over 70 mph");
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

var _heatmapFeedback = _interopRequireDefault(require("./heatmapFeedback"));

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
      console.log("Array of user's saved heatmaps:", heatmaps);
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
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
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
    }); // add functionality to reset filter button

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

},{"./API":2,"./dateFilter":3,"./elementBuilder":4,"./heatmapData":7,"./heatmapFeedback":8}],10:[function(require,module,exports){
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
  // build a login form that validates user input. Successful login stores user id in session storage
  loginForm() {
    const loginInput_username = (0, _elementBuilder.default)("input", {
      "id": "usernameInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter username"
    });
    const loginInput_password = (0, _elementBuilder.default)("input", {
      "id": "passwordInput",
      "class": "input",
      "type": "password",
      "placeholder": "enter password"
    });
    const loginButton = (0, _elementBuilder.default)("button", {
      "id": "loginNow",
      "class": "button is-dark"
    }, "Login now");
    const loginForm = (0, _elementBuilder.default)("form", {
      "id": "loginForm",
      "class": "box"
    }, null, loginInput_username, loginInput_password, loginButton);
    webpage.innerHTML = null;
    webpage.appendChild(loginForm);
    this.userEventManager();
  },

  signupForm() {
    const signupInput_name = (0, _elementBuilder.default)("input", {
      "id": "nameInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter name"
    });
    const signupInput_username = (0, _elementBuilder.default)("input", {
      "id": "usernameInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter username"
    });
    const signupInput_password = (0, _elementBuilder.default)("input", {
      "id": "passwordInput",
      "class": "input",
      "type": "text",
      "placeholder": "enter password"
    });
    const signupInput_confirm = (0, _elementBuilder.default)("input", {
      "id": "confirmPassword",
      "class": "input",
      "type": "text",
      "placeholder": "confirm password"
    });
    const signupButton = (0, _elementBuilder.default)("button", {
      "id": "signupNow",
      "class": "button is-dark"
    }, "Sign up now");
    const signupForm = (0, _elementBuilder.default)("form", {
      "id": "signupForm",
      "class": "box"
    }, null, signupInput_name, signupInput_username, signupInput_password, signupInput_confirm, signupButton);
    webpage.innerHTML = null;
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

  // validate user login form inputs before logging in
  loginUser(e) {
    e.preventDefault();
    const username = document.getElementById("usernameInput").value;
    const password = document.getElementById("passwordInput").value;

    if (username === "") {
      return;
    } else if (password === "") {
      return;
    } else {
      _API.default.getAll("users").then(users => users.forEach(user => {
        // validate username and password
        if (user.username.toLowerCase() === username.toLowerCase()) {
          if (user.password === password) {
            loginOrSignup.loginStatusActive(user);
          } else {
            return;
          }
        }
      }));
    }
  },

  signupUser(e) {
    e.preventDefault();
    console.log(e);
    const _name = document.getElementById("nameInput").value;
    const _username = document.getElementById("usernameInput").value;
    const _password = document.getElementById("passwordInput").value;
    const confirm = document.getElementById("confirmPassword").value;
    let uniqueUsername = true; //changes to false if username already exists

    if (_name === "") {
      return;
    } else if (_username === "") {
      return;
    } else if (_password === "") {
      return;
    } else if (confirm === "") {
      return;
    } else if (_password !== confirm) {
      return;
    } else {
      _API.default.getAll("users").then(users => users.forEach((user, idx) => {
        // check for existing username in database
        if (user.username.toLowerCase() === _username.toLowerCase()) {
          uniqueUsername = false;
        } //at the end of the loop, post


        if (idx === users.length - 1 && uniqueUsername) {
          let newUser = {
            name: _name,
            username: _username,
            password: _password
          };

          _API.default.postItem("users", newUser).then(user => {
            loginOrSignup.loginStatusActive(user);
          });
        }
      }));
    }
  },

  loginStatusActive(user) {
    sessionStorage.setItem("activeUserId", user.id);
    webpage.innerHTML = null;
    webpageNav.innerHTML = null;

    _navbar.default.generateNavbar(true); //build logged in version of navbar

  },

  logoutUser() {
    sessionStorage.removeItem("activeUserId");
    webpage.innerHTML = null;
    webpageNav.innerHTML = null;

    _navbar.default.generateNavbar(false); //build logged out version of navbar

  }

};
var _default = loginOrSignup;
exports.default = _default;

},{"./API":2,"./elementBuilder":4,"./navbar":12}],11:[function(require,module,exports){
"use strict";

var _navbar = _interopRequireDefault(require("./navbar"));

var _heatmaps = _interopRequireDefault(require("./heatmaps"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import gameplay from "./gameplay"
// function closeBox(e) {
//   if (e.target.classList.contains("delete")) {
//     e.target.parentNode.style.display = "none";
//   }
// }
// navbar.generateNavbar()
_navbar.default.generateNavbar(true);

_heatmaps.default.loadHeatmapContainers();

},{"./heatmaps":9,"./navbar":12}],12:[function(require,module,exports){
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
      }, "Profile");
      const loggedInItem2 = (0, _elementBuilder.default)("a", {
        "class": "navbar-item"
      }, "Gameplay");
      const loggedInItem3 = (0, _elementBuilder.default)("a", {
        "class": "navbar-item"
      }, "Heatmaps");
      const loggedInItem4 = (0, _elementBuilder.default)("a", {
        "class": "navbar-item"
      }, "Leaderboard");
      navbarStart.appendChild(loggedInItem1);
      navbarStart.appendChild(loggedInItem2);
      navbarStart.appendChild(loggedInItem3);
      navbarStart.appendChild(loggedInItem4);
    } // add event listeners to navbar


    this.navbarEventManager(nav); // append to webpage

    webpageNav.appendChild(nav);
  },

  navbarEventManager(nav) {
    nav.addEventListener("click", this.loginClicked, event);
    nav.addEventListener("click", this.signupClicked, event);
    nav.addEventListener("click", this.logoutClicked, event);
    nav.addEventListener("click", this.profileClicked, event);
    nav.addEventListener("click", this.gameplayClicked, event);
    nav.addEventListener("click", this.heatmapsClicked, event);
  },

  loginClicked(e) {
    if (e.target.textContent === "Login") {
      _login.default.loginForm();
    }
  },

  signupClicked(e) {
    if (e.target.textContent === "Sign up") {
      _login.default.signupForm();
    }
  },

  logoutClicked(e) {
    if (e.target.textContent === "Logout") {
      _login.default.logoutUser();
    }
  },

  profileClicked(e) {
    if (e.target.textContent === "Profile") {
      _profile.default.loadProfile();
    }
  },

  gameplayClicked(e) {
    if (e.target.textContent === "Gameplay") {
      _gameplay.default.loadGameplay();

      _shotData.default.resetGlobalShotVariables();
    }
  },

  heatmapsClicked(e) {
    if (e.target.textContent === "Heatmaps") {
      _heatmaps.default.loadHeatmapContainers();

      _heatmapData.default.handleBallSpeedGlobalVariables();

      _heatmapData.default.handleDateFilterGlobalVariables();
    }
  }

};
var _default = navbar;
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
const profile = {
  loadProfile() {
    webpage.innerHTML = null;
    const activeUserId = sessionStorage.getItem("activeUserId");

    _API.default.getSingleItem("users", activeUserId).then(user => {
      const profilePic = (0, _elementBuilder.default)("img", {
        "src": "images/octane.jpg",
        "class": ""
      });
      const name = (0, _elementBuilder.default)("div", {
        "class": "notification"
      }, `Name: ${user.name}`);
      const username = (0, _elementBuilder.default)("div", {
        "class": "notification"
      }, `Username: ${user.username}`);
      const playerProfile = (0, _elementBuilder.default)("div", {
        "id": "playerProfile",
        "class": "container"
      }, null, profilePic, name, username);
      webpage.appendChild(playerProfile);
    });
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
    const yCoordRelative = Number((e.offsetY / parentContainer.offsetHeight).toFixed(3));
    shotData.markClickonImage(xCoordRelative, yCoordRelative, parentContainer);
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
    div.style.backgroundColor = "lightgreen";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2RhdGVGaWx0ZXIuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwRmVlZGJhY2suanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBzLmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIiwiLi4vc2NyaXB0cy9zaG90Q2xhc3MuanMiLCIuLi9zY3JpcHRzL3Nob3REYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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TUFBQSxRQUFRLENBQUMsY0FBVCxDQUF5QixRQUFPLEdBQUcsR0FBRyxDQUFFLEVBQXhDLEVBQTJDLGdCQUEzQyxDQUE0RCxPQUE1RCxFQUFxRSxRQUFRLENBQUMsZUFBOUU7QUFDRCxLQUpEO0FBS0EsSUFBQSxXQUFXLEdBQUcsU0FBUyxDQUFDLE1BQXhCO0FBQ0EsSUFBQSx3QkFBd0IsR0FBRyxTQUFTLENBQUMsTUFBckM7QUFDRDs7QUF0VGMsQ0FBakI7ZUEwVGUsUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qXG4gKiBoZWF0bWFwLmpzIHYyLjAuNSB8IEphdmFTY3JpcHQgSGVhdG1hcCBMaWJyYXJ5XG4gKlxuICogQ29weXJpZ2h0IDIwMDgtMjAxNiBQYXRyaWNrIFdpZWQgPGhlYXRtYXBqc0BwYXRyaWNrLXdpZWQuYXQ+IC0gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgTUlUIGFuZCBCZWVyd2FyZSBsaWNlbnNlIFxuICpcbiAqIDo6IDIwMTYtMDktMDUgMDE6MTZcbiAqL1xuOyhmdW5jdGlvbiAobmFtZSwgY29udGV4dCwgZmFjdG9yeSkge1xuXG4gIC8vIFN1cHBvcnRzIFVNRC4gQU1ELCBDb21tb25KUy9Ob2RlLmpzIGFuZCBicm93c2VyIGNvbnRleHRcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTtcbiAgfSBlbHNlIHtcbiAgICBjb250ZXh0W25hbWVdID0gZmFjdG9yeSgpO1xuICB9XG5cbn0pKFwiaDMzN1wiLCB0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbi8vIEhlYXRtYXAgQ29uZmlnIHN0b3JlcyBkZWZhdWx0IHZhbHVlcyBhbmQgd2lsbCBiZSBtZXJnZWQgd2l0aCBpbnN0YW5jZSBjb25maWdcbnZhciBIZWF0bWFwQ29uZmlnID0ge1xuICBkZWZhdWx0UmFkaXVzOiA0MCxcbiAgZGVmYXVsdFJlbmRlcmVyOiAnY2FudmFzMmQnLFxuICBkZWZhdWx0R3JhZGllbnQ6IHsgMC4yNTogXCJyZ2IoMCwwLDI1NSlcIiwgMC41NTogXCJyZ2IoMCwyNTUsMClcIiwgMC44NTogXCJ5ZWxsb3dcIiwgMS4wOiBcInJnYigyNTUsMCwwKVwifSxcbiAgZGVmYXVsdE1heE9wYWNpdHk6IDEsXG4gIGRlZmF1bHRNaW5PcGFjaXR5OiAwLFxuICBkZWZhdWx0Qmx1cjogLjg1LFxuICBkZWZhdWx0WEZpZWxkOiAneCcsXG4gIGRlZmF1bHRZRmllbGQ6ICd5JyxcbiAgZGVmYXVsdFZhbHVlRmllbGQ6ICd2YWx1ZScsIFxuICBwbHVnaW5zOiB7fVxufTtcbnZhciBTdG9yZSA9IChmdW5jdGlvbiBTdG9yZUNsb3N1cmUoKSB7XG5cbiAgdmFyIFN0b3JlID0gZnVuY3Rpb24gU3RvcmUoY29uZmlnKSB7XG4gICAgdGhpcy5fY29vcmRpbmF0b3IgPSB7fTtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5fcmFkaSA9IFtdO1xuICAgIHRoaXMuX21pbiA9IDEwO1xuICAgIHRoaXMuX21heCA9IDE7XG4gICAgdGhpcy5feEZpZWxkID0gY29uZmlnWyd4RmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFhGaWVsZDtcbiAgICB0aGlzLl95RmllbGQgPSBjb25maWdbJ3lGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0WUZpZWxkO1xuICAgIHRoaXMuX3ZhbHVlRmllbGQgPSBjb25maWdbJ3ZhbHVlRmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFZhbHVlRmllbGQ7XG5cbiAgICBpZiAoY29uZmlnW1wicmFkaXVzXCJdKSB7XG4gICAgICB0aGlzLl9jZmdSYWRpdXMgPSBjb25maWdbXCJyYWRpdXNcIl07XG4gICAgfVxuICB9O1xuXG4gIHZhciBkZWZhdWx0UmFkaXVzID0gSGVhdG1hcENvbmZpZy5kZWZhdWx0UmFkaXVzO1xuXG4gIFN0b3JlLnByb3RvdHlwZSA9IHtcbiAgICAvLyB3aGVuIGZvcmNlUmVuZGVyID0gZmFsc2UgLT4gY2FsbGVkIGZyb20gc2V0RGF0YSwgb21pdHMgcmVuZGVyYWxsIGV2ZW50XG4gICAgX29yZ2FuaXNlRGF0YTogZnVuY3Rpb24oZGF0YVBvaW50LCBmb3JjZVJlbmRlcikge1xuICAgICAgICB2YXIgeCA9IGRhdGFQb2ludFt0aGlzLl94RmllbGRdO1xuICAgICAgICB2YXIgeSA9IGRhdGFQb2ludFt0aGlzLl95RmllbGRdO1xuICAgICAgICB2YXIgcmFkaSA9IHRoaXMuX3JhZGk7XG4gICAgICAgIHZhciBzdG9yZSA9IHRoaXMuX2RhdGE7XG4gICAgICAgIHZhciBtYXggPSB0aGlzLl9tYXg7XG4gICAgICAgIHZhciBtaW4gPSB0aGlzLl9taW47XG4gICAgICAgIHZhciB2YWx1ZSA9IGRhdGFQb2ludFt0aGlzLl92YWx1ZUZpZWxkXSB8fCAxO1xuICAgICAgICB2YXIgcmFkaXVzID0gZGF0YVBvaW50LnJhZGl1cyB8fCB0aGlzLl9jZmdSYWRpdXMgfHwgZGVmYXVsdFJhZGl1cztcblxuICAgICAgICBpZiAoIXN0b3JlW3hdKSB7XG4gICAgICAgICAgc3RvcmVbeF0gPSBbXTtcbiAgICAgICAgICByYWRpW3hdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXN0b3JlW3hdW3ldKSB7XG4gICAgICAgICAgc3RvcmVbeF1beV0gPSB2YWx1ZTtcbiAgICAgICAgICByYWRpW3hdW3ldID0gcmFkaXVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0b3JlW3hdW3ldICs9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdG9yZWRWYWwgPSBzdG9yZVt4XVt5XTtcblxuICAgICAgICBpZiAoc3RvcmVkVmFsID4gbWF4KSB7XG4gICAgICAgICAgaWYgKCFmb3JjZVJlbmRlcikge1xuICAgICAgICAgICAgdGhpcy5fbWF4ID0gc3RvcmVkVmFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldERhdGFNYXgoc3RvcmVkVmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JlZFZhbCA8IG1pbikge1xuICAgICAgICAgIGlmICghZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21pbiA9IHN0b3JlZFZhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXREYXRhTWluKHN0b3JlZFZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIHg6IHgsIFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSwgXG4gICAgICAgICAgICByYWRpdXM6IHJhZGl1cyxcbiAgICAgICAgICAgIG1pbjogbWluLFxuICAgICAgICAgICAgbWF4OiBtYXggXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgX3VuT3JnYW5pemVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB1bm9yZ2FuaXplZERhdGEgPSBbXTtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fZGF0YTtcbiAgICAgIHZhciByYWRpID0gdGhpcy5fcmFkaTtcblxuICAgICAgZm9yICh2YXIgeCBpbiBkYXRhKSB7XG4gICAgICAgIGZvciAodmFyIHkgaW4gZGF0YVt4XSkge1xuXG4gICAgICAgICAgdW5vcmdhbml6ZWREYXRhLnB1c2goe1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICByYWRpdXM6IHJhZGlbeF1beV0sXG4gICAgICAgICAgICB2YWx1ZTogZGF0YVt4XVt5XVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1pbjogdGhpcy5fbWluLFxuICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgZGF0YTogdW5vcmdhbml6ZWREYXRhXG4gICAgICB9O1xuICAgIH0sXG4gICAgX29uRXh0cmVtYUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdleHRyZW1hY2hhbmdlJywge1xuICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgbWF4OiB0aGlzLl9tYXhcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWRkRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoYXJndW1lbnRzWzBdLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGRhdGFBcnIgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIHZhciBkYXRhTGVuID0gZGF0YUFyci5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChkYXRhTGVuLS0pIHtcbiAgICAgICAgICB0aGlzLmFkZERhdGEuY2FsbCh0aGlzLCBkYXRhQXJyW2RhdGFMZW5dKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYWRkIHRvIHN0b3JlICBcbiAgICAgICAgdmFyIG9yZ2FuaXNlZEVudHJ5ID0gdGhpcy5fb3JnYW5pc2VEYXRhKGFyZ3VtZW50c1swXSwgdHJ1ZSk7XG4gICAgICAgIGlmIChvcmdhbmlzZWRFbnRyeSkge1xuICAgICAgICAgIC8vIGlmIGl0J3MgdGhlIGZpcnN0IGRhdGFwb2ludCBpbml0aWFsaXplIHRoZSBleHRyZW1hcyB3aXRoIGl0XG4gICAgICAgICAgaWYgKHRoaXMuX2RhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9taW4gPSB0aGlzLl9tYXggPSBvcmdhbmlzZWRFbnRyeS52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVycGFydGlhbCcsIHtcbiAgICAgICAgICAgIG1pbjogdGhpcy5fbWluLFxuICAgICAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgICAgICBkYXRhOiBbb3JnYW5pc2VkRW50cnldXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIGRhdGFQb2ludHMgPSBkYXRhLmRhdGE7XG4gICAgICB2YXIgcG9pbnRzTGVuID0gZGF0YVBvaW50cy5sZW5ndGg7XG5cblxuICAgICAgLy8gcmVzZXQgZGF0YSBhcnJheXNcbiAgICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICAgIHRoaXMuX3JhZGkgPSBbXTtcblxuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHBvaW50c0xlbjsgaSsrKSB7XG4gICAgICAgIHRoaXMuX29yZ2FuaXNlRGF0YShkYXRhUG9pbnRzW2ldLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9tYXggPSBkYXRhLm1heDtcbiAgICAgIHRoaXMuX21pbiA9IGRhdGEubWluIHx8IDA7XG4gICAgICBcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFRPRE86IGltcGxlbWVudFxuICAgIH0sXG4gICAgc2V0RGF0YU1heDogZnVuY3Rpb24obWF4KSB7XG4gICAgICB0aGlzLl9tYXggPSBtYXg7XG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YU1pbjogZnVuY3Rpb24obWluKSB7XG4gICAgICB0aGlzLl9taW4gPSBtaW47XG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0Q29vcmRpbmF0b3I6IGZ1bmN0aW9uKGNvb3JkaW5hdG9yKSB7XG4gICAgICB0aGlzLl9jb29yZGluYXRvciA9IGNvb3JkaW5hdG9yO1xuICAgIH0sXG4gICAgX2dldEludGVybmFsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4geyBcbiAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgIG1pbjogdGhpcy5fbWluLCBcbiAgICAgICAgZGF0YTogdGhpcy5fZGF0YSxcbiAgICAgICAgcmFkaTogdGhpcy5fcmFkaSBcbiAgICAgIH07XG4gICAgfSxcbiAgICBnZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl91bk9yZ2FuaXplRGF0YSgpO1xuICAgIH0vKixcblxuICAgICAgVE9ETzogcmV0aGluay5cblxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB2YXIgcmFkaXVzID0gMTAwO1xuICAgICAgdmFyIHggPSBwb2ludC54O1xuICAgICAgdmFyIHkgPSBwb2ludC55O1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgICBpZiAoZGF0YVt4XSAmJiBkYXRhW3hdW3ldKSB7XG4gICAgICAgIHJldHVybiBkYXRhW3hdW3ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgICAvLyByYWRpYWwgc2VhcmNoIGZvciBkYXRhcG9pbnRzIGJhc2VkIG9uIGRlZmF1bHQgcmFkaXVzXG4gICAgICAgIGZvcih2YXIgZGlzdGFuY2UgPSAxOyBkaXN0YW5jZSA8IHJhZGl1czsgZGlzdGFuY2UrKykge1xuICAgICAgICAgIHZhciBuZWlnaGJvcnMgPSBkaXN0YW5jZSAqIDIgKzE7XG4gICAgICAgICAgdmFyIHN0YXJ0WCA9IHggLSBkaXN0YW5jZTtcbiAgICAgICAgICB2YXIgc3RhcnRZID0geSAtIGRpc3RhbmNlO1xuXG4gICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG5laWdoYm9yczsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBvID0gMDsgbyA8IG5laWdoYm9yczsgbysrKSB7XG4gICAgICAgICAgICAgIGlmICgoaSA9PSAwIHx8IGkgPT0gbmVpZ2hib3JzLTEpIHx8IChvID09IDAgfHwgbyA9PSBuZWlnaGJvcnMtMSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVtzdGFydFkraV0gJiYgZGF0YVtzdGFydFkraV1bc3RhcnRYK29dKSB7XG4gICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaChkYXRhW3N0YXJ0WStpXVtzdGFydFgrb10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIHZhbHVlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9Ki9cbiAgfTtcblxuXG4gIHJldHVybiBTdG9yZTtcbn0pKCk7XG5cbnZhciBDYW52YXMyZFJlbmRlcmVyID0gKGZ1bmN0aW9uIENhbnZhczJkUmVuZGVyZXJDbG9zdXJlKCkge1xuXG4gIHZhciBfZ2V0Q29sb3JQYWxldHRlID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgdmFyIGdyYWRpZW50Q29uZmlnID0gY29uZmlnLmdyYWRpZW50IHx8IGNvbmZpZy5kZWZhdWx0R3JhZGllbnQ7XG4gICAgdmFyIHBhbGV0dGVDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgcGFsZXR0ZUN0eCA9IHBhbGV0dGVDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHBhbGV0dGVDYW52YXMud2lkdGggPSAyNTY7XG4gICAgcGFsZXR0ZUNhbnZhcy5oZWlnaHQgPSAxO1xuXG4gICAgdmFyIGdyYWRpZW50ID0gcGFsZXR0ZUN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAyNTYsIDEpO1xuICAgIGZvciAodmFyIGtleSBpbiBncmFkaWVudENvbmZpZykge1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKGtleSwgZ3JhZGllbnRDb25maWdba2V5XSk7XG4gICAgfVxuXG4gICAgcGFsZXR0ZUN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcbiAgICBwYWxldHRlQ3R4LmZpbGxSZWN0KDAsIDAsIDI1NiwgMSk7XG5cbiAgICByZXR1cm4gcGFsZXR0ZUN0eC5nZXRJbWFnZURhdGEoMCwgMCwgMjU2LCAxKS5kYXRhO1xuICB9O1xuXG4gIHZhciBfZ2V0UG9pbnRUZW1wbGF0ZSA9IGZ1bmN0aW9uKHJhZGl1cywgYmx1ckZhY3Rvcikge1xuICAgIHZhciB0cGxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgdHBsQ3R4ID0gdHBsQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdmFyIHggPSByYWRpdXM7XG4gICAgdmFyIHkgPSByYWRpdXM7XG4gICAgdHBsQ2FudmFzLndpZHRoID0gdHBsQ2FudmFzLmhlaWdodCA9IHJhZGl1cyoyO1xuXG4gICAgaWYgKGJsdXJGYWN0b3IgPT0gMSkge1xuICAgICAgdHBsQ3R4LmJlZ2luUGF0aCgpO1xuICAgICAgdHBsQ3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICB0cGxDdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMSknO1xuICAgICAgdHBsQ3R4LmZpbGwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGdyYWRpZW50ID0gdHBsQ3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KHgsIHksIHJhZGl1cypibHVyRmFjdG9yLCB4LCB5LCByYWRpdXMpO1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsMCwwLDEpJyk7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwwLDAsMCknKTtcbiAgICAgIHRwbEN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcbiAgICAgIHRwbEN0eC5maWxsUmVjdCgwLCAwLCAyKnJhZGl1cywgMipyYWRpdXMpO1xuICAgIH1cblxuXG5cbiAgICByZXR1cm4gdHBsQ2FudmFzO1xuICB9O1xuXG4gIHZhciBfcHJlcGFyZURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHJlbmRlckRhdGEgPSBbXTtcbiAgICB2YXIgbWluID0gZGF0YS5taW47XG4gICAgdmFyIG1heCA9IGRhdGEubWF4O1xuICAgIHZhciByYWRpID0gZGF0YS5yYWRpO1xuICAgIHZhciBkYXRhID0gZGF0YS5kYXRhO1xuXG4gICAgdmFyIHhWYWx1ZXMgPSBPYmplY3Qua2V5cyhkYXRhKTtcbiAgICB2YXIgeFZhbHVlc0xlbiA9IHhWYWx1ZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUoeFZhbHVlc0xlbi0tKSB7XG4gICAgICB2YXIgeFZhbHVlID0geFZhbHVlc1t4VmFsdWVzTGVuXTtcbiAgICAgIHZhciB5VmFsdWVzID0gT2JqZWN0LmtleXMoZGF0YVt4VmFsdWVdKTtcbiAgICAgIHZhciB5VmFsdWVzTGVuID0geVZhbHVlcy5sZW5ndGg7XG4gICAgICB3aGlsZSh5VmFsdWVzTGVuLS0pIHtcbiAgICAgICAgdmFyIHlWYWx1ZSA9IHlWYWx1ZXNbeVZhbHVlc0xlbl07XG4gICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbeFZhbHVlXVt5VmFsdWVdO1xuICAgICAgICB2YXIgcmFkaXVzID0gcmFkaVt4VmFsdWVdW3lWYWx1ZV07XG4gICAgICAgIHJlbmRlckRhdGEucHVzaCh7XG4gICAgICAgICAgeDogeFZhbHVlLFxuICAgICAgICAgIHk6IHlWYWx1ZSxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgcmFkaXVzOiByYWRpdXNcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1pbjogbWluLFxuICAgICAgbWF4OiBtYXgsXG4gICAgICBkYXRhOiByZW5kZXJEYXRhXG4gICAgfTtcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIENhbnZhczJkUmVuZGVyZXIoY29uZmlnKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGNvbmZpZy5jb250YWluZXI7XG4gICAgdmFyIHNoYWRvd0NhbnZhcyA9IHRoaXMuc2hhZG93Q2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzID0gY29uZmlnLmNhbnZhcyB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgcmVuZGVyQm91bmRhcmllcyA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXMgPSBbMTAwMDAsIDEwMDAwLCAwLCAwXTtcblxuICAgIHZhciBjb21wdXRlZCA9IGdldENvbXB1dGVkU3R5bGUoY29uZmlnLmNvbnRhaW5lcikgfHwge307XG5cbiAgICBjYW52YXMuY2xhc3NOYW1lID0gJ2hlYXRtYXAtY2FudmFzJztcblxuICAgIHRoaXMuX3dpZHRoID0gY2FudmFzLndpZHRoID0gc2hhZG93Q2FudmFzLndpZHRoID0gY29uZmlnLndpZHRoIHx8ICsoY29tcHV0ZWQud2lkdGgucmVwbGFjZSgvcHgvLCcnKSk7XG4gICAgdGhpcy5faGVpZ2h0ID0gY2FudmFzLmhlaWdodCA9IHNoYWRvd0NhbnZhcy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IHx8ICsoY29tcHV0ZWQuaGVpZ2h0LnJlcGxhY2UoL3B4LywnJykpO1xuXG4gICAgdGhpcy5zaGFkb3dDdHggPSBzaGFkb3dDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgLy8gQFRPRE86XG4gICAgLy8gY29uZGl0aW9uYWwgd3JhcHBlclxuXG4gICAgY2FudmFzLnN0eWxlLmNzc1RleHQgPSBzaGFkb3dDYW52YXMuc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7dG9wOjA7JztcblxuICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICB0aGlzLl9wYWxldHRlID0gX2dldENvbG9yUGFsZXR0ZShjb25maWcpO1xuICAgIHRoaXMuX3RlbXBsYXRlcyA9IHt9O1xuXG4gICAgdGhpcy5fc2V0U3R5bGVzKGNvbmZpZyk7XG4gIH07XG5cbiAgQ2FudmFzMmRSZW5kZXJlci5wcm90b3R5cGUgPSB7XG4gICAgcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgaWYgKGRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX2RyYXdBbHBoYShkYXRhKTtcbiAgICAgICAgdGhpcy5fY29sb3JpemUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlckFsbDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gcmVzZXQgcmVuZGVyIGJvdW5kYXJpZXNcbiAgICAgIHRoaXMuX2NsZWFyKCk7XG4gICAgICBpZiAoZGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5fZHJhd0FscGhhKF9wcmVwYXJlRGF0YShkYXRhKSk7XG4gICAgICAgIHRoaXMuX2NvbG9yaXplKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBfdXBkYXRlR3JhZGllbnQ6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fcGFsZXR0ZSA9IF9nZXRDb2xvclBhbGV0dGUoY29uZmlnKTtcbiAgICB9LFxuICAgIHVwZGF0ZUNvbmZpZzogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICBpZiAoY29uZmlnWydncmFkaWVudCddKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUdyYWRpZW50KGNvbmZpZyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9zZXRTdHlsZXMoY29uZmlnKTtcbiAgICB9LFxuICAgIHNldERpbWVuc2lvbnM6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgIHRoaXMuX3dpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLl9oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuc2hhZG93Q2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNoYWRvd0NhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfSxcbiAgICBfY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zaGFkb3dDdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQpO1xuICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQpO1xuICAgIH0sXG4gICAgX3NldFN0eWxlczogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9ibHVyID0gKGNvbmZpZy5ibHVyID09IDApPzA6KGNvbmZpZy5ibHVyIHx8IGNvbmZpZy5kZWZhdWx0Qmx1cik7XG5cbiAgICAgIGlmIChjb25maWcuYmFja2dyb3VuZENvbG9yKSB7XG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3dpZHRoID0gdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLnNoYWRvd0NhbnZhcy53aWR0aCA9IGNvbmZpZy53aWR0aCB8fCB0aGlzLl93aWR0aDtcbiAgICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuc2hhZG93Q2FudmFzLmhlaWdodCA9IGNvbmZpZy5oZWlnaHQgfHwgdGhpcy5faGVpZ2h0O1xuXG5cbiAgICAgIHRoaXMuX29wYWNpdHkgPSAoY29uZmlnLm9wYWNpdHkgfHwgMCkgKiAyNTU7XG4gICAgICB0aGlzLl9tYXhPcGFjaXR5ID0gKGNvbmZpZy5tYXhPcGFjaXR5IHx8IGNvbmZpZy5kZWZhdWx0TWF4T3BhY2l0eSkgKiAyNTU7XG4gICAgICB0aGlzLl9taW5PcGFjaXR5ID0gKGNvbmZpZy5taW5PcGFjaXR5IHx8IGNvbmZpZy5kZWZhdWx0TWluT3BhY2l0eSkgKiAyNTU7XG4gICAgICB0aGlzLl91c2VHcmFkaWVudE9wYWNpdHkgPSAhIWNvbmZpZy51c2VHcmFkaWVudE9wYWNpdHk7XG4gICAgfSxcbiAgICBfZHJhd0FscGhhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgbWluID0gdGhpcy5fbWluID0gZGF0YS5taW47XG4gICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4ID0gZGF0YS5tYXg7XG4gICAgICB2YXIgZGF0YSA9IGRhdGEuZGF0YSB8fCBbXTtcbiAgICAgIHZhciBkYXRhTGVuID0gZGF0YS5sZW5ndGg7XG4gICAgICAvLyBvbiBhIHBvaW50IGJhc2lzP1xuICAgICAgdmFyIGJsdXIgPSAxIC0gdGhpcy5fYmx1cjtcblxuICAgICAgd2hpbGUoZGF0YUxlbi0tKSB7XG5cbiAgICAgICAgdmFyIHBvaW50ID0gZGF0YVtkYXRhTGVuXTtcblxuICAgICAgICB2YXIgeCA9IHBvaW50Lng7XG4gICAgICAgIHZhciB5ID0gcG9pbnQueTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IHBvaW50LnJhZGl1cztcbiAgICAgICAgLy8gaWYgdmFsdWUgaXMgYmlnZ2VyIHRoYW4gbWF4XG4gICAgICAgIC8vIHVzZSBtYXggYXMgdmFsdWVcbiAgICAgICAgdmFyIHZhbHVlID0gTWF0aC5taW4ocG9pbnQudmFsdWUsIG1heCk7XG4gICAgICAgIHZhciByZWN0WCA9IHggLSByYWRpdXM7XG4gICAgICAgIHZhciByZWN0WSA9IHkgLSByYWRpdXM7XG4gICAgICAgIHZhciBzaGFkb3dDdHggPSB0aGlzLnNoYWRvd0N0eDtcblxuXG5cblxuICAgICAgICB2YXIgdHBsO1xuICAgICAgICBpZiAoIXRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdKSB7XG4gICAgICAgICAgdGhpcy5fdGVtcGxhdGVzW3JhZGl1c10gPSB0cGwgPSBfZ2V0UG9pbnRUZW1wbGF0ZShyYWRpdXMsIGJsdXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRwbCA9IHRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdO1xuICAgICAgICB9XG4gICAgICAgIC8vIHZhbHVlIGZyb20gbWluaW11bSAvIHZhbHVlIHJhbmdlXG4gICAgICAgIC8vID0+IFswLCAxXVxuICAgICAgICB2YXIgdGVtcGxhdGVBbHBoYSA9ICh2YWx1ZS1taW4pLyhtYXgtbWluKTtcbiAgICAgICAgLy8gdGhpcyBmaXhlcyAjMTc2OiBzbWFsbCB2YWx1ZXMgYXJlIG5vdCB2aXNpYmxlIGJlY2F1c2UgZ2xvYmFsQWxwaGEgPCAuMDEgY2Fubm90IGJlIHJlYWQgZnJvbSBpbWFnZURhdGFcbiAgICAgICAgc2hhZG93Q3R4Lmdsb2JhbEFscGhhID0gdGVtcGxhdGVBbHBoYSA8IC4wMSA/IC4wMSA6IHRlbXBsYXRlQWxwaGE7XG5cbiAgICAgICAgc2hhZG93Q3R4LmRyYXdJbWFnZSh0cGwsIHJlY3RYLCByZWN0WSk7XG5cbiAgICAgICAgLy8gdXBkYXRlIHJlbmRlckJvdW5kYXJpZXNcbiAgICAgICAgaWYgKHJlY3RYIDwgdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXSA9IHJlY3RYO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFkgPCB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzFdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzFdID0gcmVjdFk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWN0WCArIDIqcmFkaXVzID4gdGhpcy5fcmVuZGVyQm91bmRhcmllc1syXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1syXSA9IHJlY3RYICsgMipyYWRpdXM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWN0WSArIDIqcmFkaXVzID4gdGhpcy5fcmVuZGVyQm91bmRhcmllc1szXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1szXSA9IHJlY3RZICsgMipyYWRpdXM7XG4gICAgICAgICAgfVxuXG4gICAgICB9XG4gICAgfSxcbiAgICBfY29sb3JpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHggPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdO1xuICAgICAgdmFyIHkgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzFdO1xuICAgICAgdmFyIHdpZHRoID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1syXSAtIHg7XG4gICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1szXSAtIHk7XG4gICAgICB2YXIgbWF4V2lkdGggPSB0aGlzLl93aWR0aDtcbiAgICAgIHZhciBtYXhIZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XG4gICAgICB2YXIgb3BhY2l0eSA9IHRoaXMuX29wYWNpdHk7XG4gICAgICB2YXIgbWF4T3BhY2l0eSA9IHRoaXMuX21heE9wYWNpdHk7XG4gICAgICB2YXIgbWluT3BhY2l0eSA9IHRoaXMuX21pbk9wYWNpdHk7XG4gICAgICB2YXIgdXNlR3JhZGllbnRPcGFjaXR5ID0gdGhpcy5fdXNlR3JhZGllbnRPcGFjaXR5O1xuXG4gICAgICBpZiAoeCA8IDApIHtcbiAgICAgICAgeCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoeSA8IDApIHtcbiAgICAgICAgeSA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoeCArIHdpZHRoID4gbWF4V2lkdGgpIHtcbiAgICAgICAgd2lkdGggPSBtYXhXaWR0aCAtIHg7XG4gICAgICB9XG4gICAgICBpZiAoeSArIGhlaWdodCA+IG1heEhlaWdodCkge1xuICAgICAgICBoZWlnaHQgPSBtYXhIZWlnaHQgLSB5O1xuICAgICAgfVxuXG4gICAgICB2YXIgaW1nID0gdGhpcy5zaGFkb3dDdHguZ2V0SW1hZ2VEYXRhKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgdmFyIGltZ0RhdGEgPSBpbWcuZGF0YTtcbiAgICAgIHZhciBsZW4gPSBpbWdEYXRhLmxlbmd0aDtcbiAgICAgIHZhciBwYWxldHRlID0gdGhpcy5fcGFsZXR0ZTtcblxuXG4gICAgICBmb3IgKHZhciBpID0gMzsgaSA8IGxlbjsgaSs9IDQpIHtcbiAgICAgICAgdmFyIGFscGhhID0gaW1nRGF0YVtpXTtcbiAgICAgICAgdmFyIG9mZnNldCA9IGFscGhhICogNDtcblxuXG4gICAgICAgIGlmICghb2Zmc2V0KSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZmluYWxBbHBoYTtcbiAgICAgICAgaWYgKG9wYWNpdHkgPiAwKSB7XG4gICAgICAgICAgZmluYWxBbHBoYSA9IG9wYWNpdHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGFscGhhIDwgbWF4T3BhY2l0eSkge1xuICAgICAgICAgICAgaWYgKGFscGhhIDwgbWluT3BhY2l0eSkge1xuICAgICAgICAgICAgICBmaW5hbEFscGhhID0gbWluT3BhY2l0eTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBhbHBoYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmluYWxBbHBoYSA9IG1heE9wYWNpdHk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaW1nRGF0YVtpLTNdID0gcGFsZXR0ZVtvZmZzZXRdO1xuICAgICAgICBpbWdEYXRhW2ktMl0gPSBwYWxldHRlW29mZnNldCArIDFdO1xuICAgICAgICBpbWdEYXRhW2ktMV0gPSBwYWxldHRlW29mZnNldCArIDJdO1xuICAgICAgICBpbWdEYXRhW2ldID0gdXNlR3JhZGllbnRPcGFjaXR5ID8gcGFsZXR0ZVtvZmZzZXQgKyAzXSA6IGZpbmFsQWxwaGE7XG5cbiAgICAgIH1cblxuICAgICAgaW1nLmRhdGEgPSBpbWdEYXRhO1xuICAgICAgdGhpcy5jdHgucHV0SW1hZ2VEYXRhKGltZywgeCwgeSk7XG5cbiAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXMgPSBbMTAwMCwgMTAwMCwgMCwgMF07XG5cbiAgICB9LFxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB2YXIgc2hhZG93Q3R4ID0gdGhpcy5zaGFkb3dDdHg7XG4gICAgICB2YXIgaW1nID0gc2hhZG93Q3R4LmdldEltYWdlRGF0YShwb2ludC54LCBwb2ludC55LCAxLCAxKTtcbiAgICAgIHZhciBkYXRhID0gaW1nLmRhdGFbM107XG4gICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4O1xuICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbjtcblxuICAgICAgdmFsdWUgPSAoTWF0aC5hYnMobWF4LW1pbikgKiAoZGF0YS8yNTUpKSA+PiAwO1xuXG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcbiAgICBnZXREYXRhVVJMOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbnZhcy50b0RhdGFVUkwoKTtcbiAgICB9XG4gIH07XG5cblxuICByZXR1cm4gQ2FudmFzMmRSZW5kZXJlcjtcbn0pKCk7XG5cblxudmFyIFJlbmRlcmVyID0gKGZ1bmN0aW9uIFJlbmRlcmVyQ2xvc3VyZSgpIHtcblxuICB2YXIgcmVuZGVyZXJGbiA9IGZhbHNlO1xuXG4gIGlmIChIZWF0bWFwQ29uZmlnWydkZWZhdWx0UmVuZGVyZXInXSA9PT0gJ2NhbnZhczJkJykge1xuICAgIHJlbmRlcmVyRm4gPSBDYW52YXMyZFJlbmRlcmVyO1xuICB9XG5cbiAgcmV0dXJuIHJlbmRlcmVyRm47XG59KSgpO1xuXG5cbnZhciBVdGlsID0ge1xuICBtZXJnZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1lcmdlZCA9IHt9O1xuICAgIHZhciBhcmdzTGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3NMZW47IGkrKykge1xuICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1tpXVxuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBtZXJnZWRba2V5XSA9IG9ialtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VkO1xuICB9XG59O1xuLy8gSGVhdG1hcCBDb25zdHJ1Y3RvclxudmFyIEhlYXRtYXAgPSAoZnVuY3Rpb24gSGVhdG1hcENsb3N1cmUoKSB7XG5cbiAgdmFyIENvb3JkaW5hdG9yID0gKGZ1bmN0aW9uIENvb3JkaW5hdG9yQ2xvc3VyZSgpIHtcblxuICAgIGZ1bmN0aW9uIENvb3JkaW5hdG9yKCkge1xuICAgICAgdGhpcy5jU3RvcmUgPSB7fTtcbiAgICB9O1xuXG4gICAgQ29vcmRpbmF0b3IucHJvdG90eXBlID0ge1xuICAgICAgb246IGZ1bmN0aW9uKGV2dE5hbWUsIGNhbGxiYWNrLCBzY29wZSkge1xuICAgICAgICB2YXIgY1N0b3JlID0gdGhpcy5jU3RvcmU7XG5cbiAgICAgICAgaWYgKCFjU3RvcmVbZXZ0TmFtZV0pIHtcbiAgICAgICAgICBjU3RvcmVbZXZ0TmFtZV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBjU3RvcmVbZXZ0TmFtZV0ucHVzaCgoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwoc2NvcGUsIGRhdGEpO1xuICAgICAgICB9KSk7XG4gICAgICB9LFxuICAgICAgZW1pdDogZnVuY3Rpb24oZXZ0TmFtZSwgZGF0YSkge1xuICAgICAgICB2YXIgY1N0b3JlID0gdGhpcy5jU3RvcmU7XG4gICAgICAgIGlmIChjU3RvcmVbZXZ0TmFtZV0pIHtcbiAgICAgICAgICB2YXIgbGVuID0gY1N0b3JlW2V2dE5hbWVdLmxlbmd0aDtcbiAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGNTdG9yZVtldnROYW1lXVtpXTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gQ29vcmRpbmF0b3I7XG4gIH0pKCk7XG5cblxuICB2YXIgX2Nvbm5lY3QgPSBmdW5jdGlvbihzY29wZSkge1xuICAgIHZhciByZW5kZXJlciA9IHNjb3BlLl9yZW5kZXJlcjtcbiAgICB2YXIgY29vcmRpbmF0b3IgPSBzY29wZS5fY29vcmRpbmF0b3I7XG4gICAgdmFyIHN0b3JlID0gc2NvcGUuX3N0b3JlO1xuXG4gICAgY29vcmRpbmF0b3Iub24oJ3JlbmRlcnBhcnRpYWwnLCByZW5kZXJlci5yZW5kZXJQYXJ0aWFsLCByZW5kZXJlcik7XG4gICAgY29vcmRpbmF0b3Iub24oJ3JlbmRlcmFsbCcsIHJlbmRlcmVyLnJlbmRlckFsbCwgcmVuZGVyZXIpO1xuICAgIGNvb3JkaW5hdG9yLm9uKCdleHRyZW1hY2hhbmdlJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2NvcGUuX2NvbmZpZy5vbkV4dHJlbWFDaGFuZ2UgJiZcbiAgICAgIHNjb3BlLl9jb25maWcub25FeHRyZW1hQ2hhbmdlKHtcbiAgICAgICAgbWluOiBkYXRhLm1pbixcbiAgICAgICAgbWF4OiBkYXRhLm1heCxcbiAgICAgICAgZ3JhZGllbnQ6IHNjb3BlLl9jb25maWdbJ2dyYWRpZW50J10gfHwgc2NvcGUuX2NvbmZpZ1snZGVmYXVsdEdyYWRpZW50J11cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN0b3JlLnNldENvb3JkaW5hdG9yKGNvb3JkaW5hdG9yKTtcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIEhlYXRtYXAoKSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMuX2NvbmZpZyA9IFV0aWwubWVyZ2UoSGVhdG1hcENvbmZpZywgYXJndW1lbnRzWzBdIHx8IHt9KTtcbiAgICB0aGlzLl9jb29yZGluYXRvciA9IG5ldyBDb29yZGluYXRvcigpO1xuICAgIGlmIChjb25maWdbJ3BsdWdpbiddKSB7XG4gICAgICB2YXIgcGx1Z2luVG9Mb2FkID0gY29uZmlnWydwbHVnaW4nXTtcbiAgICAgIGlmICghSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpblRvTG9hZF0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gXFwnJysgcGx1Z2luVG9Mb2FkICsgJ1xcJyBub3QgZm91bmQuIE1heWJlIGl0IHdhcyBub3QgcmVnaXN0ZXJlZC4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwbHVnaW4gPSBIZWF0bWFwQ29uZmlnLnBsdWdpbnNbcGx1Z2luVG9Mb2FkXTtcbiAgICAgICAgLy8gc2V0IHBsdWdpbiByZW5kZXJlciBhbmQgc3RvcmVcbiAgICAgICAgdGhpcy5fcmVuZGVyZXIgPSBuZXcgcGx1Z2luLnJlbmRlcmVyKGNvbmZpZyk7XG4gICAgICAgIHRoaXMuX3N0b3JlID0gbmV3IHBsdWdpbi5zdG9yZShjb25maWcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBSZW5kZXJlcihjb25maWcpO1xuICAgICAgdGhpcy5fc3RvcmUgPSBuZXcgU3RvcmUoY29uZmlnKTtcbiAgICB9XG4gICAgX2Nvbm5lY3QodGhpcyk7XG4gIH07XG5cbiAgLy8gQFRPRE86XG4gIC8vIGFkZCBBUEkgZG9jdW1lbnRhdGlvblxuICBIZWF0bWFwLnByb3RvdHlwZSA9IHtcbiAgICBhZGREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLmFkZERhdGEuYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUucmVtb3ZlRGF0YSAmJiB0aGlzLl9zdG9yZS5yZW1vdmVEYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGEuYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNYXg6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YU1heC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YU1pbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhTWluLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBjb25maWd1cmU6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fY29uZmlnID0gVXRpbC5tZXJnZSh0aGlzLl9jb25maWcsIGNvbmZpZyk7XG4gICAgICB0aGlzLl9yZW5kZXJlci51cGRhdGVDb25maWcodGhpcy5fY29uZmlnKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX3N0b3JlLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlcGFpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fc3RvcmUuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc3RvcmUuZ2V0RGF0YSgpO1xuICAgIH0sXG4gICAgZ2V0RGF0YVVSTDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIuZ2V0RGF0YVVSTCgpO1xuICAgIH0sXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcblxuICAgICAgaWYgKHRoaXMuX3N0b3JlLmdldFZhbHVlQXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlLmdldFZhbHVlQXQocG9pbnQpO1xuICAgICAgfSBlbHNlICBpZiAodGhpcy5fcmVuZGVyZXIuZ2V0VmFsdWVBdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIuZ2V0VmFsdWVBdChwb2ludCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIEhlYXRtYXA7XG5cbn0pKCk7XG5cblxuLy8gY29yZVxudmFyIGhlYXRtYXBGYWN0b3J5ID0ge1xuICBjcmVhdGU6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHJldHVybiBuZXcgSGVhdG1hcChjb25maWcpO1xuICB9LFxuICByZWdpc3RlcjogZnVuY3Rpb24ocGx1Z2luS2V5LCBwbHVnaW4pIHtcbiAgICBIZWF0bWFwQ29uZmlnLnBsdWdpbnNbcGx1Z2luS2V5XSA9IHBsdWdpbjtcbiAgfVxufTtcblxucmV0dXJuIGhlYXRtYXBGYWN0b3J5O1xuXG5cbn0pOyIsImNvbnN0IFVSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo4MDg4XCJcclxuXHJcbmNvbnN0IEFQSSA9IHtcclxuXHJcbiAgZ2V0U2luZ2xlSXRlbShleHRlbnNpb24sIGlkKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZ2V0QWxsKGV4dGVuc2lvbikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCwge1xyXG4gICAgICBtZXRob2Q6IFwiREVMRVRFXCJcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKGUgPT4gZS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgcG9zdEl0ZW0oZXh0ZW5zaW9uLCBvYmopIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgcHV0SXRlbShleHRlbnNpb24sIG9iaikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCwge1xyXG4gICAgICBtZXRob2Q6IFwiUFVUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFQSSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgaGVhdG1hcERhdGEgZnJvbSBcIi4vaGVhdG1hcERhdGFcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGRhdGVGaWx0ZXIgPSB7XHJcblxyXG4gIGJ1aWxkRGF0ZUZpbHRlcigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGZyb20gaGVhdG1hcHMuanMgYW5kIGlzIHRyaWdnZXJlZCBmcm9tIHRoZSBoZWF0bWFwcyBwYWdlIG9mIHRoZSBzaXRlIHdoZW5cclxuICAgIC8vIHRoZSBkYXRlIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiZW5kRGF0ZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJkYXRlXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBlbmREYXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZW5kRGF0ZUlucHV0KTtcclxuICAgIGNvbnN0IGVuZERhdGVMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJEYXRlIDI6XFx4YTBcIik7XHJcbiAgICBjb25zdCBlbmREYXRlSW5wdXRGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBlbmREYXRlTGFiZWwsIGVuZERhdGVDb250cm9sKTtcclxuXHJcbiAgICBjb25zdCBzdGFydERhdGVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInN0YXJ0RGF0ZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJkYXRlXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBzdGFydERhdGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBzdGFydERhdGVJbnB1dCk7XHJcbiAgICBjb25zdCBzdGFydERhdGVMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJEYXRlIDE6XFx4YTBcIik7XHJcbiAgICBjb25zdCBzdGFydERhdGVJbnB1dEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIHN0YXJ0RGF0ZUxhYmVsLCBzdGFydERhdGVDb250cm9sKTtcclxuXHJcbiAgICBjb25zdCBjbGVhckZpbHRlckJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjbGVhckRhdGVGaWx0ZXJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNsZWFyIEZpbHRlclwiKTtcclxuICAgIGNvbnN0IGNsZWFyRmlsdGVyQnV0dG9uQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgY2xlYXJGaWx0ZXJCdG4pO1xyXG4gICAgY29uc3QgZGF0ZVNhdmVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2V0RGF0ZUZpbHRlclwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNldCBGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBzYXZlQnV0dG9uQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZGF0ZVNhdmVCdG4pO1xyXG4gICAgY29uc3QgY2FuY2VsQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbE1vZGFsV2luZG93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDYW5jZWxcIik7XHJcbiAgICBjb25zdCBjYW5jZWxCdXR0b25Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBjYW5jZWxCdG4pO1xyXG4gICAgY29uc3QgYnV0dG9uRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgc2F2ZUJ1dHRvbkNvbnRyb2wsIGNsZWFyRmlsdGVyQnV0dG9uQ29udHJvbCwgY2FuY2VsQnV0dG9uQ29udHJvbCk7XHJcblxyXG4gICAgY29uc3QgbW9kYWxDb250ZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1vZGFsLWNvbnRlbnQgYm94XCIgfSwgbnVsbCwgc3RhcnREYXRlSW5wdXRGaWVsZCwgZW5kRGF0ZUlucHV0RmllbGQsIGJ1dHRvbkZpZWxkKTtcclxuICAgIGNvbnN0IG1vZGFsQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtb2RhbC1iYWNrZ3JvdW5kXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBtb2RhbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJtb2RhbC1kYXRlRmlsdGVyXCIsIFwiY2xhc3NcIjogXCJtb2RhbFwiIH0sIG51bGwsIG1vZGFsQmFja2dyb3VuZCwgbW9kYWxDb250ZW50KTtcclxuXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKG1vZGFsKTtcclxuICAgIHRoaXMubW9kYWxzRXZlbnRNYW5hZ2VyKCk7XHJcbiAgfSxcclxuXHJcbiAgbW9kYWxzRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgY29uc3QgY2xlYXJEYXRlRmlsdGVyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjbGVhckRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBzZXREYXRlRmlsdGVyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZXREYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3QgY2FuY2VsTW9kYWxXaW5kb3dCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbmNlbE1vZGFsV2luZG93XCIpO1xyXG5cclxuICAgIGNhbmNlbE1vZGFsV2luZG93QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLmNhbmNlbE1vZGFsV2luZG93KTtcclxuICAgIHNldERhdGVGaWx0ZXJCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuc2V0RmlsdGVyKTtcclxuICAgIGNsZWFyRGF0ZUZpbHRlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5jbGVhckRhdGVGaWx0ZXIpO1xyXG5cclxuICB9LFxyXG5cclxuICBvcGVuRGF0ZUZpbHRlcigpIHtcclxuICAgIGNvbnN0IGRhdGVSYW5nZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGF0ZVJhbmdlQnRuXCIpO1xyXG4gICAgY29uc3QgZGF0ZUZpbHRlck1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RhbC1kYXRlRmlsdGVyXCIpO1xyXG4gICAgLy8gY2hlY2sgaWYgZ2xvYmFsIHZhcnMgYXJlIHNldC4gSWYgc28sIGRvbid0IHRvZ2dsZSBjb2xvciBvZiBidXR0b25cclxuICAgIGNvbnN0IGRhdGVTZXQgPSBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKHRydWUpO1xyXG5cclxuICAgIGlmIChkYXRlU2V0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkYXRlUmFuZ2VCdG4uY2xhc3NMaXN0LnRvZ2dsZShcImlzLW91dGxpbmVkXCIpO1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgY2xlYXJEYXRlRmlsdGVyKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZXNldHMgZ2xvYmFsIGRhdGUgZmlsdGVyIHZhcmlhYmxlcyBpbiBoZWF0bWFwRGF0YS5qcyBhbmQgcmVwbGFjZXMgZGF0ZSBpbnB1dHMgd2l0aCBibGFuayBkYXRlIGlucHV0c1xyXG4gICAgbGV0IHN0YXJ0RGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGFydERhdGVJbnB1dFwiKTtcclxuICAgIGxldCBlbmREYXRlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVuZERhdGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IHNldERhdGVGaWx0ZXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNldERhdGVGaWx0ZXJcIik7XHJcblxyXG4gICAgaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgZGF0ZVJhbmdlQnRuLmNsYXNzTGlzdC5hZGQoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIHN0YXJ0RGF0ZUlucHV0LnJlcGxhY2VXaXRoKGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInN0YXJ0RGF0ZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJkYXRlXCIgfSwgbnVsbCkpO1xyXG4gICAgZW5kRGF0ZUlucHV0LnJlcGxhY2VXaXRoKGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImVuZERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpKTtcclxuICAgIHNldERhdGVGaWx0ZXJCdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuc2V0RmlsdGVyKTtcclxuICAgIHNldERhdGVGaWx0ZXJCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuc2V0RmlsdGVyKTtcclxuXHJcbiAgICBpZiAoZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC5jb250YWlucyhcImlzLWFjdGl2ZVwiKSkge1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnJlbW92ZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2V0RmlsdGVyKCkge1xyXG4gICAgY29uc3QgZGF0ZUZpbHRlck1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RhbC1kYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0YXJ0RGF0ZUlucHV0XCIpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbmREYXRlSW5wdXRcIik7XHJcblxyXG4gICAgc3RhcnREYXRlSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgIGVuZERhdGVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgIC8vIGNoZWNrIGlmIGRhdGUgcGlja2VycyBoYXZlIGEgdmFsaWQgZGF0ZVxyXG4gICAgaWYgKHN0YXJ0RGF0ZUlucHV0LnZhbHVlID09PSBcIlwiKSB7XHJcbiAgICAgIHN0YXJ0RGF0ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICB9IGVsc2UgaWYgKGVuZERhdGVJbnB1dC52YWx1ZSA9PT0gXCJcIikge1xyXG4gICAgICBlbmREYXRlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGlmIHRoZXkgZG8sIHRoZW4gc2V0IGdsb2JhbCB2YXJzIGluIGhlYXRtYXBzIHBhZ2UgYW5kIGNsb3NlIG1vZGFsXHJcbiAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMoZmFsc2UsIHN0YXJ0RGF0ZUlucHV0LnZhbHVlLCBlbmREYXRlSW5wdXQudmFsdWUpO1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjYW5jZWxNb2RhbFdpbmRvdygpIHtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IGRhdGVSYW5nZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGF0ZVJhbmdlQnRuXCIpO1xyXG5cclxuICAgIC8vIGlmIGdsb2JhbCB2YXJpYWJsZXMgYXJlIGRlZmluZWQgYWxyZWFkeSwgY2FuY2VsIHNob3VsZCBub3QgY2hhbmdlIHRoZSBjbGFzcyBvbiB0aGUgZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGNvbnN0IGRhdGVTZXQgPSBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKHRydWUpO1xyXG4gICAgaWYgKGRhdGVTZXQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRhdGVSYW5nZUJ0bi5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5ZGF0ZUZpbHRlcihzdGFydERhdGUsIGVuZERhdGUsIGdhbWVJZHMsIGdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZXhhbWluZXMgdGhlIGdhbWUgb2JqZWN0IGFyZ3VtZW50IGNvbXBhcmVkIHRvIHRoZSB1c2VyLWRlZmluZWQgc3RhcnQgYW5kIGVuZCBkYXRlc1xyXG4gICAgLy8gaWYgdGhlIGdhbWUgZGF0ZSBpcyB3aXRoaW4gdGhlIHR3byBkYXRlcyBzcGVjaWZpZWQsIHRoZW4gdGhlIGdhbWUgSUQgaXMgcHVzaGVkIHRvIHRoZSBnYW1lSWRzIGFycmF5XHJcblxyXG4gICAgLy8gc3BsaXQgdGltZXN0YW1wIGFuZCByZWNhbGwgb25seSBkYXRlXHJcbiAgICBsZXQgZ2FtZURhdGUgPSBnYW1lLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF07XHJcblxyXG4gICAgaWYgKHN0YXJ0RGF0ZSA8PSBnYW1lRGF0ZSAmJiBnYW1lRGF0ZSA8PSBlbmREYXRlKSB7XHJcbiAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhcHBseWRhdGVGaWx0ZXJUb1NhdmVkSGVhdG1hcChzdGFydERhdGUsIGVuZERhdGUsIHNob3RzLCBzaG90c01hdGNoaW5nRmlsdGVyKSB7XHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgc2hvdERhdGUgPSBzaG90LnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF07XHJcblxyXG4gICAgICBpZiAoc3RhcnREYXRlIDw9IHNob3REYXRlICYmIHNob3REYXRlIDw9IGVuZERhdGUpIHtcclxuICAgICAgICBzaG90c01hdGNoaW5nRmlsdGVyLnB1c2goc2hvdCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGF0ZUZpbHRlciIsImZ1bmN0aW9uIGVsQnVpbGRlcihuYW1lLCBhdHRyaWJ1dGVzT2JqLCB0eHQsIC4uLmNoaWxkcmVuKSB7XHJcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xyXG4gIGZvciAobGV0IGF0dHIgaW4gYXR0cmlidXRlc09iaikge1xyXG4gICAgZWwuc2V0QXR0cmlidXRlKGF0dHIsIGF0dHJpYnV0ZXNPYmpbYXR0cl0pO1xyXG4gIH1cclxuICBlbC50ZXh0Q29udGVudCA9IHR4dCB8fCBudWxsO1xyXG4gIGNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgZWwuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gIH0pXHJcbiAgcmV0dXJuIGVsO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBlbEJ1aWxkZXIiLCJpbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIjtcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCI7XHJcbmltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIjtcclxuXHJcbi8vIHRoZSBwdXJwb3NlIG9mIHRoaXMgbW9kdWxlIGlzIHRvOlxyXG4vLyAxLiBzYXZlIGFsbCBjb250ZW50IGluIHRoZSBnYW1lcGxheSBwYWdlIChzaG90IGFuZCBnYW1lIGRhdGEpIHRvIHRoZSBkYXRhYmFzZVxyXG4vLyAyLiBpbW1lZGlhdGVseSBjbGVhciB0aGUgZ2FtZXBsYXkgY29udGFpbmVycyBvZiBjb250ZW50IG9uIHNhdmVcclxuLy8gMy4gaW1tZWRpYXRlbHkgcmVzZXQgYWxsIGdsb2JhbCB2YXJpYWJsZXMgaW4gdGhlIHNob3RkYXRhIGZpbGUgdG8gYWxsb3cgdGhlIHVzZXIgdG8gYmVnaW4gc2F2aW5nIHNob3RzIGFuZCBlbnRlcmluZyBnYW1lIGRhdGEgZm9yIHRoZWlyIG5leHQgZ2FtZVxyXG4vLyA0LiBhZmZvcmRhbmNlIGZvciB1c2VyIHRvIHJlY2FsbCBhbGwgZGF0YSBmcm9tIHByZXZpb3VzIHNhdmVkIGdhbWUgZm9yIGVkaXRpbmdcclxuLy8gNS4gaW5jbHVkZSBhbnkgb3RoZXIgZnVuY3Rpb25zIG5lZWRlZCB0byBzdXBwb3J0IHRoZSBmaXJzdCA0IHJlcXVpcmVtZW50c1xyXG5cclxuLy8gdGhpcyBnbG9iYWwgdmFyaWFibGUgaXMgdXNlZCB0byBwYXNzIHNhdmVkIHNob3RzLCBiYWxsIHNwZWVkLCBhbmQgYWVyaWFsIGJvb2xlYW4gdG8gc2hvdERhdGEuanMgZHVyaW5nIHRoZSBlZGl0IHByb2Nlc3NcclxubGV0IHNhdmVkR2FtZU9iamVjdDtcclxubGV0IHB1dFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxubGV0IHBvc3RQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbmxldCBwb3N0UHJvbWlzZXMgPSBbXTtcclxuXHJcbmNvbnN0IGdhbWVEYXRhID0ge1xyXG5cclxuICBnYW1lVHlwZUJ1dHRvblRvZ2dsZShlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHRvZ2dsZXMgdGhlIFwiaXMtc2VsZWN0ZWRcIiBjbGFzcyBiZXR3ZWVuIHRoZSBnYW1lIHR5cGUgYnV0dG9uc1xyXG5cclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuICAgIGxldCBidG5DbGlja2VkID0gZS50YXJnZXQ7XHJcblxyXG4gICAgaWYgKCFidG5DbGlja2VkLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKSB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRHYW1lVHlwZUJ0biA9IGdhbWVUeXBlQnRucy5maWx0ZXIoYnRuID0+IGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSk7XHJcbiAgICAgIGN1cnJlbnRHYW1lVHlwZUJ0blswXS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGN1cnJlbnRHYW1lVHlwZUJ0blswXS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bkNsaWNrZWQuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCkge1xyXG4gICAgc2F2ZWRHYW1lT2JqZWN0ID0gdW5kZWZpbmVkO1xyXG4gICAgcHV0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG4gICAgcG9zdFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxuICAgIHBvc3RQcm9taXNlcyA9IFtdO1xyXG4gIH0sXHJcblxyXG4gIHB1dEVkaXRlZFNob3RzKHByZXZpb3VzbHlTYXZlZFNob3RzQXJyKSB7XHJcbiAgICAvLyBQVVQgZmlyc3QsIHNpY25lIHlvdSBjYW4ndCBzYXZlIGEgZ2FtZSBpbml0aWFsbHkgd2l0aG91dCBhdCBsZWFzdCAxIHNob3RcclxuICAgIHByZXZpb3VzbHlTYXZlZFNob3RzQXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIC8vIGV2ZW4gdGhvdWdoIGl0J3MgYSBQVVQsIHdlIGhhdmUgdG8gcmVmb3JtYXQgdGhlIF9maWVsZFggc3ludGF4IHRvIGZpZWxkWFxyXG4gICAgICBsZXQgc2hvdEZvclB1dCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUHV0LmdhbWVJZCA9IHNhdmVkR2FtZU9iamVjdC5pZDtcclxuICAgICAgc2hvdEZvclB1dC5maWVsZFggPSBzaG90Ll9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQdXQuZmllbGRZID0gc2hvdC5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUHV0LmdvYWxYID0gc2hvdC5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQdXQuZ29hbFkgPSBzaG90Ll9nb2FsWTtcclxuICAgICAgc2hvdEZvclB1dC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3QuYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQdXQuYWVyaWFsID0gc2hvdC5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUHV0LnRpbWVTdGFtcCA9IHNob3QuX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHB1dFByb21pc2VzRWRpdE1vZGUucHVzaChBUEkucHV0SXRlbShgc2hvdHMvJHtzaG90LmlkfWAsIHNob3RGb3JQdXQpKTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHV0UHJvbWlzZXNFZGl0TW9kZSlcclxuICB9LFxyXG5cclxuICBwb3N0TmV3U2hvdHNNYWRlRHVyaW5nRWRpdE1vZGUoc2hvdHNOb3RZZXRQb3N0ZWRBcnIpIHtcclxuICAgIHNob3RzTm90WWV0UG9zdGVkQXJyLmZvckVhY2goc2hvdE9iaiA9PiB7XHJcbiAgICAgIGxldCBzaG90Rm9yUG9zdCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBzYXZlZEdhbWVPYmplY3QuaWQ7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclBvc3QudGltZVN0YW1wID0gc2hvdE9iai5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcG9zdFByb21pc2VzRWRpdE1vZGUucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHBvc3RQcm9taXNlc0VkaXRNb2RlKVxyXG4gIH0sXHJcblxyXG4gIHBvc3ROZXdTaG90cyhnYW1lSWQpIHtcclxuICAgIC8vIHBvc3Qgc2hvdHMgd2l0aCBnYW1lSWRcclxuICAgIGNvbnN0IHNob3RBcnIgPSBzaG90RGF0YS5nZXRTaG90T2JqZWN0c0ZvclNhdmluZygpO1xyXG4gICAgc2hvdEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICBsZXQgc2hvdEZvclBvc3QgPSB7fTtcclxuICAgICAgc2hvdEZvclBvc3QuZ2FtZUlkID0gZ2FtZUlkO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFggPSBzaG90T2JqLl9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWSA9IHNob3RPYmouX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFggPSBzaG90T2JqLl9nb2FsWDtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFkgPSBzaG90T2JqLl9nb2FsWTtcclxuICAgICAgc2hvdEZvclBvc3QuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90T2JqLmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUG9zdC5hZXJpYWwgPSBzaG90T2JqLl9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQb3N0LnRpbWVTdGFtcCA9IHNob3RPYmouX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHBvc3RQcm9taXNlcy5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RzXCIsIHNob3RGb3JQb3N0KSk7XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHBvc3RQcm9taXNlcylcclxuICB9LFxyXG5cclxuICBzYXZlRGF0YShnYW1lRGF0YU9iaiwgc2F2aW5nRWRpdGVkR2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBmaXJzdCBkZXRlcm1pbmVzIGlmIGEgZ2FtZSBpcyBiZWluZyBzYXZlZCBhcyBuZXcsIG9yIGEgcHJldmlvdXNseSBzYXZlZCBnYW1lIGlzIGJlaW5nIGVkaXRlZFxyXG4gICAgLy8gaWYgc2F2aW5nIGFuIGVkaXRlZCBnYW1lLCB0aGUgZ2FtZSBpcyBQVVQsIGFsbCBzaG90cyBzYXZlZCBwcmV2aW91c2x5IGFyZSBQVVQsIGFuZCBuZXcgc2hvdHMgYXJlIFBPU1RFRFxyXG4gICAgLy8gaWYgdGhlIGdhbWUgaXMgYSBuZXcgZ2FtZSBhbHRvZ2V0aGVyLCB0aGVuIHRoZSBnYW1lIGlzIFBPU1RFRCBhbmQgYWxsIHNob3RzIGFyZSBQT1NURURcclxuICAgIC8vIHRoZW4gZnVuY3Rpb25zIGFyZSBjYWxsZWQgdG8gcmVsb2FkIHRoZSBtYXN0ZXIgY29udGFpbmVyIGFuZCByZXNldCBnbG9iYWwgc2hvdCBkYXRhIHZhcmlhYmxlc1xyXG5cclxuICAgIGlmIChzYXZpbmdFZGl0ZWRHYW1lKSB7XHJcbiAgICAgIC8vIHVzZSBJRCBvZiBnYW1lIHN0b3JlZCBpbiBnbG9iYWwgdmFyXHJcbiAgICAgIEFQSS5wdXRJdGVtKGBnYW1lcy8ke3NhdmVkR2FtZU9iamVjdC5pZH1gLCBnYW1lRGF0YU9iailcclxuICAgICAgICAudGhlbihnYW1lUFVUID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUIEdBTUVcIiwgZ2FtZVBVVClcclxuICAgICAgICAgIC8vIHBvc3Qgc2hvdHMgd2l0aCBnYW1lSWRcclxuICAgICAgICAgIGNvbnN0IHNob3RBcnIgPSBzaG90RGF0YS5nZXRTaG90T2JqZWN0c0ZvclNhdmluZygpO1xyXG4gICAgICAgICAgY29uc3QgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIgPSBbXTtcclxuICAgICAgICAgIGNvbnN0IHNob3RzTm90WWV0UG9zdGVkQXJyID0gW107XHJcblxyXG4gICAgICAgICAgLy8gY3JlYXRlIGFycmF5cyBmb3IgUFVUIGFuZCBQT1NUIGZ1bmN0aW9ucyAoaWYgdGhlcmUncyBhbiBpZCBpbiB0aGUgYXJyYXksIGl0J3MgYmVlbiBzYXZlZCB0byB0aGUgZGF0YWJhc2UgYmVmb3JlKVxyXG4gICAgICAgICAgc2hvdEFyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc2hvdC5pZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIucHVzaChzaG90KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzaG90c05vdFlldFBvc3RlZEFyci5wdXNoKHNob3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRvIFBVVCBhbmQgUE9TVFxyXG4gICAgICAgICAgLy8gY2FsbCBmdW5jdGlvbnMgdGhhdCBjbGVhciBnYW1lcGxheSBjb250ZW50IGFuZCByZXNldCBnbG9iYWwgc2hvdC9nYW1lIGRhdGEgdmFyaWFibGVzXHJcbiAgICAgICAgICBnYW1lRGF0YS5wdXRFZGl0ZWRTaG90cyhwcmV2aW91c2x5U2F2ZWRTaG90c0FycilcclxuICAgICAgICAgICAgLnRoZW4oeCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQVVRTOlwiLCB4KVxyXG4gICAgICAgICAgICAgIC8vIGlmIG5vIG5ldyBzaG90cyB3ZXJlIG1hZGUsIHJlbG9hZC4gZWxzZSBwb3N0IG5ldyBzaG90c1xyXG4gICAgICAgICAgICAgIGlmIChzaG90c05vdFlldFBvc3RlZEFyci5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZ2FtZURhdGEucG9zdE5ld1Nob3RzTWFkZUR1cmluZ0VkaXRNb2RlKHNob3RzTm90WWV0UG9zdGVkQXJyKVxyXG4gICAgICAgICAgICAgICAgICAudGhlbih5ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBPU1RTOlwiLCB5KVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5wb3N0SXRlbShcImdhbWVzXCIsIGdhbWVEYXRhT2JqKVxyXG4gICAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5pZClcclxuICAgICAgICAudGhlbihnYW1lSWQgPT4ge1xyXG4gICAgICAgICAgZ2FtZURhdGEucG9zdE5ld1Nob3RzKGdhbWVJZClcclxuICAgICAgICAgICAgLnRoZW4oeiA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTQVZFRCBORVcgU0hPVFNcIiwgeik7XHJcbiAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBwYWNrYWdlR2FtZURhdGEoKSB7XHJcblxyXG4gICAgLy8gZ2V0IHVzZXIgSUQgZnJvbSBzZXNzaW9uIHN0b3JhZ2VcclxuICAgIC8vIHBhY2thZ2UgZWFjaCBpbnB1dCBmcm9tIGdhbWUgZGF0YSBjb250YWluZXIgaW50byB2YXJpYWJsZXNcclxuICAgIC8vIFRPRE86IGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBwcmV2ZW50IGJsYW5rIHNjb3JlIGVudHJpZXNcclxuICAgIC8vIFRPRE86IGNyZWF0ZSBhIG1vZGFsIGFza2luZyB1c2VyIGlmIHRoZXkgd2FudCB0byBzYXZlIGdhbWVcclxuXHJcbiAgICAvLyBwbGF5ZXJJZFxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIikpO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZSAoMXYxLCAydjIsIDN2MylcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuICAgIGxldCBnYW1lVHlwZSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBnYW1lVHlwZUJ0bnMuZm9yRWFjaChidG4gPT4ge1xyXG4gICAgICBpZiAoYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKSB7XHJcbiAgICAgICAgZ2FtZVR5cGUgPSBidG4udGV4dENvbnRlbnRcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvLyBnYW1lIG1vZGUgKG5vdGU6IGRpZCBub3QgdXNlIGJvb2xlYW4gaW4gY2FzZSBtb3JlIGdhbWUgbW9kZXMgYXJlIHN1cHBvcnRlZCBpbiB0aGUgZnV0dXJlKVxyXG4gICAgY29uc3Qgc2VsX2dhbWVNb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lTW9kZUlucHV0XCIpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxfZ2FtZU1vZGUudmFsdWUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAvLyBteSB0ZWFtXHJcbiAgICBjb25zdCBzZWxfdGVhbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgbGV0IHRlYW1lZFVwO1xyXG4gICAgaWYgKHNlbF90ZWFtLnZhbHVlID09PSBcIk5vIHBhcnR5XCIpIHtcclxuICAgICAgdGVhbWVkVXAgPSBmYWxzZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRlYW1lZFVwID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzY29yZXNcclxuICAgIGxldCBteVNjb3JlO1xyXG4gICAgbGV0IHRoZWlyU2NvcmU7XHJcbiAgICBjb25zdCBpbnB0X215U2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15U2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfdGhlaXJTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGhlaXJTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIG15U2NvcmUgPSBOdW1iZXIoaW5wdF9teVNjb3JlLnZhbHVlKTtcclxuICAgIHRoZWlyU2NvcmUgPSBOdW1iZXIoaW5wdF90aGVpclNjb3JlLnZhbHVlKTtcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgbGV0IG92ZXJ0aW1lO1xyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG4gICAgaWYgKHNlbF9vdmVydGltZS52YWx1ZSA9PT0gXCJPdmVydGltZVwiKSB7XHJcbiAgICAgIG92ZXJ0aW1lID0gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG92ZXJ0aW1lID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGdhbWVEYXRhT2JqID0ge1xyXG4gICAgICBcInVzZXJJZFwiOiBhY3RpdmVVc2VySWQsXHJcbiAgICAgIFwibW9kZVwiOiBnYW1lTW9kZSxcclxuICAgICAgXCJ0eXBlXCI6IGdhbWVUeXBlLFxyXG4gICAgICBcInBhcnR5XCI6IHRlYW1lZFVwLFxyXG4gICAgICBcInNjb3JlXCI6IG15U2NvcmUsXHJcbiAgICAgIFwib3BwX3Njb3JlXCI6IHRoZWlyU2NvcmUsXHJcbiAgICAgIFwib3ZlcnRpbWVcIjogb3ZlcnRpbWUsXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCBhIG5ldyBnYW1lIG9yIGVkaXRlZCBnYW1lIGlzIGJlaW5nIHNhdmVkLiBJZiBhbiBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZCwgdGhlbiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgc2hvdCBzYXZlZCBhbHJlYWR5LCBtYWtpbmcgdGhlIHJldHVybiBmcm9tIHRoZSBzaG90RGF0YSBmdW5jdGlvbiBtb3JlIHRoYW4gMFxyXG4gICAgY29uc3Qgc2F2aW5nRWRpdGVkR2FtZSA9IHNob3REYXRhLmdldEluaXRpYWxOdW1PZlNob3RzKClcclxuICAgIGlmIChzYXZpbmdFZGl0ZWRHYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZ2FtZURhdGFPYmoudGltZVN0YW1wID0gc2F2ZWRHYW1lT2JqZWN0LnRpbWVTdGFtcFxyXG4gICAgICBnYW1lRGF0YS5zYXZlRGF0YShnYW1lRGF0YU9iaiwgdHJ1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyB0aW1lIHN0YW1wIGlmIG5ldyBnYW1lXHJcbiAgICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICBnYW1lRGF0YU9iai50aW1lU3RhbXAgPSB0aW1lU3RhbXBcclxuICAgICAgZ2FtZURhdGEuc2F2ZURhdGEoZ2FtZURhdGFPYmosIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVByZXZHYW1lRWRpdHMoKSB7XHJcbiAgICBnYW1lRGF0YS5wYWNrYWdlR2FtZURhdGEoKTtcclxuICB9LFxyXG5cclxuICBjYW5jZWxFZGl0aW5nTW9kZSgpIHtcclxuICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyRWRpdEJ1dHRvbnMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlbW92ZXMgJiByZXBsYWNlcyBlZGl0IGFuZCBzYXZlIGdhbWUgYnV0dG9ucyB3aXRoIFwiU2F2ZSBFZGl0c1wiIGFuZCBcIkNhbmNlbCBFZGl0c1wiXHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgLy8gaW4gY2FzZSBvZiBsYWcgaW4gZmV0Y2gsIHByZXZlbnQgdXNlciBmcm9tIGRvdWJsZSBjbGlja2luZyBidXR0b25cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5jbGFzc0xpc3QuYWRkKFwiaXMtbG9hZGluZ1wiKTtcclxuXHJcbiAgICBjb25zdCBidG5fY2FuY2VsRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBFZGl0c1wiKVxyXG4gICAgY29uc3QgYnRuX3NhdmVFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEVkaXRzXCIpXHJcblxyXG4gICAgYnRuX2NhbmNlbEVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5jYW5jZWxFZGl0aW5nTW9kZSlcclxuICAgIGJ0bl9zYXZlRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnNhdmVQcmV2R2FtZUVkaXRzKVxyXG5cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUucmVwbGFjZVdpdGgoYnRuX2NhbmNlbEVkaXRzKTtcclxuICAgIGJ0bl9zYXZlR2FtZS5yZXBsYWNlV2l0aChidG5fc2F2ZUVkaXRzKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyUHJldkdhbWUoZ2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgcmVuZGVyaW5nIHRoZSBzYXZlZCBnYW1lIGluZm9ybWF0aW9uIGluIHRoZSBcIkVudGVyIEdhbWUgRGF0YVwiIGNvbnRhaW5lci5cclxuICAgIC8vIGl0IHJlbGllcyBvbiBhIGZ1bmN0aW9uIGluIHNob3REYXRhLmpzIHRvIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBjb25zb2xlLmxvZyhnYW1lKVxyXG5cclxuICAgIC8vIGNhbGwgZnVuY3Rpb24gaW4gc2hvdERhdGEgdGhhdCBjYWxscyBnYW1hRGF0YS5wcm92aWRlU2hvdHNUb1Nob3REYXRhKClcclxuICAgIC8vIHRoZSBmdW5jdGlvbiB3aWxsIGNhcHR1cmUgdGhlIGFycmF5IG9mIHNhdmVkIHNob3RzIGFuZCByZW5kZXIgdGhlIHNob3QgYnV0dG9uc1xyXG4gICAgc2hvdERhdGEucmVuZGVyU2hvdHNCdXR0b25zRnJvbVByZXZpb3VzR2FtZSgpXHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLm92ZXJ0aW1lKSB7XHJcbiAgICAgIHNlbF9vdmVydGltZS52YWx1ZSA9IFwiT3ZlcnRpbWVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX292ZXJ0aW1lLnZhbHVlID0gXCJObyBvdmVydGltZVwiXHJcbiAgICB9XHJcblxyXG4gICAgLy8gbXkgdGVhbVxyXG4gICAgY29uc3Qgc2VsX3RlYW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlYW1JbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLnBhcnR5ID09PSBmYWxzZSkge1xyXG4gICAgICBzZWxfdGVhbS52YWx1ZSA9IFwiTm8gcGFydHlcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX3RlYW0udmFsdWUgPSBcIlBhcnR5XCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBzY29yZVxyXG4gICAgY29uc3QgaW5wdF9teVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteVNjb3JlSW5wdXRcIik7XHJcbiAgICBjb25zdCBpbnB0X3RoZWlyU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRoZWlyU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICBpbnB0X215U2NvcmUudmFsdWUgPSBnYW1lLnNjb3JlO1xyXG4gICAgaW5wdF90aGVpclNjb3JlLnZhbHVlID0gZ2FtZS5vcHBfc2NvcmU7XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlICgxdjEsIDJ2MiwgM3YzKVxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG5cclxuICAgIGlmIChnYW1lLnR5cGUgPT09IFwiM3YzXCIpIHtcclxuICAgICAgYnRuXzN2My5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8zdjMuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICAgIC8vIDJ2MiBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSBpZiAoZ2FtZS50eXBlID09PSBcIjJ2MlwiKSB7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnRuXzF2MS5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8xdjEuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGdhbWUgbW9kZVxyXG4gICAgY29uc3Qgc2VsX2dhbWVNb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lTW9kZUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUubW9kZSA9IFwiY29tcGV0aXRpdmVcIikge1xyXG4gICAgICBzZWxfZ2FtZU1vZGUudmFsdWUgPSBcIkNvbXBldGl0aXZlXCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF9nYW1lTW9kZS52YWx1ZSA9IFwiQ2FzdWFsXCJcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcHJvdmlkZVNob3RzVG9TaG90RGF0YSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcHJvdmlkZXMgdGhlIHNob3RzIGZvciByZW5kZXJpbmcgdG8gc2hvdERhdGFcclxuICAgIHJldHVybiBzYXZlZEdhbWVPYmplY3RcclxuICB9LFxyXG5cclxuICBlZGl0UHJldkdhbWUoKSB7XHJcbiAgICAvLyBmZXRjaCBjb250ZW50IGZyb20gbW9zdCByZWNlbnQgZ2FtZSBzYXZlZCB0byBiZSByZW5kZXJlZFxyXG5cclxuICAgIC8vIFRPRE86IGNyZWF0ZSBhIG1vZGFsIGFza2luZyB1c2VyIGlmIHRoZXkgd2FudCB0byBlZGl0IHByZXZpb3VzIGdhbWVcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcblxyXG4gICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJ1c2Vyc1wiLCBgJHthY3RpdmVVc2VySWR9P19lbWJlZD1nYW1lc2ApLnRoZW4odXNlciA9PiB7XHJcbiAgICAgIGlmICh1c2VyLmdhbWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGFsZXJ0KFwiTm8gZ2FtZXMgaGF2ZSBiZWVuIHNhdmVkIGJ5IHRoaXMgdXNlclwiKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBnZXQgbWF4IGdhbWUgaWQgKHdoaWNoIGlzIHRoZSBtb3N0IHJlY2VudCBnYW1lIHNhdmVkKVxyXG4gICAgICAgIGNvbnN0IHJlY2VudEdhbWVJZCA9IHVzZXIuZ2FtZXMucmVkdWNlKChtYXgsIG9iaikgPT4gb2JqLmlkID4gbWF4ID8gb2JqLmlkIDogbWF4LCB1c2VyLmdhbWVzWzBdLmlkKTtcclxuICAgICAgICAvLyBmZXRjaCBtb3N0IHJlY2VudCBnYW1lIGFuZCBlbWJlZCBzaG90c1xyXG4gICAgICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwiZ2FtZXNcIiwgYCR7cmVjZW50R2FtZUlkfT9fZW1iZWQ9c2hvdHNgKS50aGVuKGdhbWVPYmogPT4ge1xyXG4gICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlckVkaXRCdXR0b25zKCk7XHJcbiAgICAgICAgICBzYXZlZEdhbWVPYmplY3QgPSBnYW1lT2JqO1xyXG4gICAgICAgICAgZ2FtZURhdGEucmVuZGVyUHJldkdhbWUoZ2FtZU9iaik7XHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lRGF0YSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIlxyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSBcIi4vZ2FtZURhdGFcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGdhbWVwbGF5ID0ge1xyXG5cclxuICBsb2FkR2FtZXBsYXkoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICAvLyBjb25zdCB4QnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImRlbGV0ZVwiIH0pO1xyXG4gICAgLy8geEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xvc2VCb3gsIGV2ZW50KTsgLy8gYnV0dG9uIHdpbGwgZGlzcGxheTogbm9uZSBvbiBwYXJlbnQgY29udGFpbmVyXHJcbiAgICAvLyBjb25zdCBoZWFkZXJJbmZvID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvbiBpcy1pbmZvXCIgfSwgXCJDcmVhdGUgYW5kIHNhdmUgc2hvdHMgLSB0aGVuIHNhdmUgdGhlIGdhbWUgcmVjb3JkLlwiLCB4QnV0dG9uKTtcclxuICAgIC8vIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoaGVhZGVySW5mbyk7XHJcbiAgICB0aGlzLmJ1aWxkU2hvdENvbnRlbnQoKTtcclxuICAgIHRoaXMuYnVpbGRHYW1lQ29udGVudCgpO1xyXG4gICAgdGhpcy5nYW1lcGxheUV2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkU2hvdENvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGJ1aWxkcyBzaG90IGNvbnRhaW5lcnMgYW5kIGFkZHMgY29udGFpbmVyIGNvbnRlbnRcclxuXHJcbiAgICAvLyBjb250YWluZXIgdGl0bGVcclxuICAgIGNvbnN0IHNob3RUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIHRpdGxlIGlzLTRcIiB9LCBcIkVudGVyIFNob3QgRGF0YVwiKTtcclxuICAgIGNvbnN0IHNob3RUaXRsZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNob3RUaXRsZSk7XHJcblxyXG4gICAgLy8gbmV3IHNob3QgYW5kIHNhdmUgc2hvdCBidXR0b25zXHJcbiAgICBjb25zdCBuZXdTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcIm5ld1Nob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJOZXcgU2hvdFwiKTtcclxuICAgIGNvbnN0IHNhdmVTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBTaG90XCIpO1xyXG4gICAgY29uc3QgY2FuY2VsU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDYW5jZWwgU2hvdFwiKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcInNob3RDb250cm9sc1wiLCBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBidXR0b25zXCIgfSwgbnVsbCwgbmV3U2hvdCwgc2F2ZVNob3QsIGNhbmNlbFNob3QpO1xyXG4gICAgY29uc3QgYWxpZ25TaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgc2hvdEJ1dHRvbnMpO1xyXG4gICAgY29uc3Qgc2hvdEJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduU2hvdEJ1dHRvbnMpO1xyXG5cclxuICAgIC8vIGJhbGwgc3BlZWQgaW5wdXQgYW5kIGFlcmlhbCBzZWxlY3RcclxuICAgIGNvbnN0IGJhbGxTcGVlZElucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiQmFsbCBzcGVlZCAoa3BoKTpcIilcclxuICAgIGNvbnN0IGJhbGxTcGVlZElucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiYmFsbFNwZWVkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gaW5wdXRcIiwgXCJ0eXBlXCI6XCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIGJhbGwgc3BlZWRcIiB9KTtcclxuICAgIGNvbnN0IGFlcmlhbE9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU3RhbmRhcmRcIik7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IGFlcmlhbFNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJhZXJpYWxJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgYWVyaWFsT3B0aW9uMSwgYWVyaWFsT3B0aW9uMik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgYWVyaWFsU2VsZWN0KTtcclxuICAgIGNvbnN0IGFlcmlhbENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgYWVyaWFsU2VsZWN0UGFyZW50KTtcclxuICAgIGNvbnN0IHNob3REZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBiYWxsU3BlZWRJbnB1dFRpdGxlLCBiYWxsU3BlZWRJbnB1dCwgYWVyaWFsQ29udHJvbCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlsc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNob3REZXRhaWxzKTtcclxuXHJcbiAgICAvLyBmaWVsZCBhbmQgZ29hbCBpbWFnZXMgKG5vdGUgZmllbGQtaW1nIGlzIGNsaXBwZWQgdG8gcmVzdHJpY3QgY2xpY2sgYXJlYSBjb29yZGluYXRlcyBpbiBsYXRlciBmdW5jdGlvbi5cclxuICAgIC8vIGdvYWwtaW1nIHVzZXMgYW4geC95IGZvcm11bGEgZm9yIGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgcmVzdHJpY3Rpb24sIHNpbmNlIGl0J3MgYSByZWN0YW5nbGUpXHJcbiAgICAvLyBhZGRpdGlvbmFsbHksIGZpZWxkIGFuZCBnb2FsIGFyZSBub3QgYWxpZ25lZCB3aXRoIGxldmVsLWxlZnQgb3IgbGV2ZWwtcmlnaHQgLSBpdCdzIGEgZGlyZWN0IGxldmVsIC0tPiBsZXZlbC1pdGVtIGZvciBjZW50ZXJpbmdcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25GaWVsZCwgYWxpZ25Hb2FsKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIGhvbGRpbmcgYWxsIHNob3QgaW5mb3JtYXRpb25cclxuICAgIGNvbnN0IHBhcmVudFNob3RDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHNob3RUaXRsZUNvbnRhaW5lciwgc2hvdEJ1dHRvbkNvbnRhaW5lciwgc2hvdERldGFpbHNDb250YWluZXIsIHNob3RDb29yZGluYXRlc0NvbnRhaW5lcilcclxuXHJcbiAgICAvLyBhcHBlbmQgc2hvdHMgY29udGFpbmVyIHRvIHBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50U2hvdENvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHYW1lQ29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gY3JlYXRlcyBnYW1lIGNvbnRlbnQgY29udGFpbmVycyAodGVhbSwgZ2FtZSB0eXBlLCBnYW1lIG1vZGUsIGV0Yy4pXHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBnYW1lVGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBHYW1lIERhdGFcIik7XHJcbiAgICBjb25zdCB0aXRsZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUaXRsZSk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSB0b3AgY29udGFpbmVyXHJcblxyXG4gICAgLy8gMXYxLzJ2Mi8zdjMgYnV0dG9ucyAobm90ZTogY29udHJvbCBjbGFzcyBpcyB1c2VkIHdpdGggZmllbGQgdG8gYWRoZXJlIGJ1dHRvbnMgdG9nZXRoZXIpXHJcbiAgICBjb25zdCBnYW1lVHlwZTN2MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfM3YzXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjMpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzJ2MlwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXNlbGVjdGVkIGlzLWxpbmtcIiB9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUydjIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzF2MVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIxdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMXYxKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaGFzLWFkZG9uc1wiIH0sIG51bGwsIGdhbWVUeXBlM3YzQ29udHJvbCwgZ2FtZVR5cGUydjJDb250cm9sLCBnYW1lVHlwZTF2MUNvbnRyb2wpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdhbWVUeXBlQnV0dG9uRmllbGQpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZSBzZWxlY3RcclxuICAgIGNvbnN0IG1vZGVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNhc3VhbFwiKTtcclxuICAgIGNvbnN0IG1vZGVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNvbXBldGl0aXZlXCIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJnYW1lTW9kZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlT3B0aW9uMSwgbW9kZU9wdGlvbjIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlU2VsZWN0KTtcclxuICAgIGNvbnN0IG1vZGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIG1vZGVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIHRlYW0gc2VsZWN0XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBwYXJ0eVwiKTtcclxuICAgIGNvbnN0IHRlYW1PcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlBhcnR5XCIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJ0ZWFtSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1PcHRpb24xLCB0ZWFtT3B0aW9uMik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1TZWxlY3QpO1xyXG4gICAgY29uc3QgdGVhbUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgdGVhbVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWUgc2VsZWN0XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gb3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJvdmVydGltZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZU9wdGlvbjEsIG92ZXJ0aW1lT3B0aW9uMik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdCk7XHJcbiAgICBjb25zdCBvdmVydGltZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gYm90dG9tIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIHNjb3JlIGlucHV0c1xyXG4gICAgLy8gKioqKk5vdGUgaW5saW5lIHN0eWxpbmcgb2YgaW5wdXQgd2lkdGhzXHJcbiAgICBjb25zdCBteVNjb3JlSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJTY29yZTpcIik7XHJcbiAgICBjb25zdCBteVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJteVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwibXkgdGVhbSdzIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCBteVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCBteVNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3QgdGhlaXJTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiT3Bwb25lbnQncyBzY29yZTpcIilcclxuICAgIGNvbnN0IHRoZWlyU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInRoZWlyU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJ0aGVpciB0ZWFtJ3Mgc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IHRoZWlyU2NvcmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gY29udHJvbFwiIH0sIG51bGwsIHRoZWlyU2NvcmVJbnB1dCk7XHJcbiAgICBjb25zdCBzY29yZUlucHV0Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBteVNjb3JlSW5wdXRUaXRsZSwgbXlTY29yZUNvbnRyb2wsIHRoZWlyU2NvcmVJbnB1dFRpdGxlLCB0aGVpclNjb3JlQ29udHJvbCk7XHJcblxyXG4gICAgLy8gZWRpdC9zYXZlIGdhbWUgYnV0dG9uc1xyXG4gICAgY29uc3QgZWRpdFByZXZpb3VzR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJlZGl0UHJldkdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkVkaXQgUHJldmlvdXMgR2FtZVwiKTtcclxuICAgIGNvbnN0IHNhdmVHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBHYW1lXCIpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkFsaWdubWVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBzYXZlR2FtZSwgZWRpdFByZXZpb3VzR2FtZSk7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLXJpZ2h0XCIgfSwgbnVsbCwgZ2FtZUJ1dHRvbkFsaWdubWVudCk7XHJcblxyXG4gICAgLy8gYXBwZW5kIHRvIHdlYnBhZ2VcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJUb3AgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciwgbW9kZUNvbnRyb2wsIHRlYW1Db250cm9sLCBvdmVydGltZUNvbnRyb2wpO1xyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lckJvdHRvbSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNjb3JlSW5wdXRDb250YWluZXIsIGdhbWVCdXR0b25Db250YWluZXIpO1xyXG4gICAgY29uc3QgcGFyZW50R2FtZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgdGl0bGVDb250YWluZXIsIGdhbWVDb250YWluZXJUb3AsIGdhbWVDb250YWluZXJCb3R0b20pO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRHYW1lQ29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBnYW1lcGxheUV2ZW50TWFuYWdlcigpIHtcclxuXHJcbiAgICAvLyBidXR0b25zXHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlU2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZVNob3RcIik7XHJcbiAgICBjb25zdCBidG5fY2FuY2VsU2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FuY2VsU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9lZGl0UHJldkdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRQcmV2R2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlR2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcblxyXG4gICAgLy8gYWRkIGxpc3RlbmVyc1xyXG4gICAgYnRuX25ld1Nob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmNyZWF0ZU5ld1Nob3QpO1xyXG4gICAgYnRuX3NhdmVTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5zYXZlU2hvdCk7XHJcbiAgICBidG5fY2FuY2VsU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY2FuY2VsU2hvdCk7XHJcbiAgICBidG5fc2F2ZUdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnBhY2thZ2VHYW1lRGF0YSk7XHJcbiAgICBnYW1lVHlwZUJ0bnMuZm9yRWFjaChidG4gPT4gYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5nYW1lVHlwZUJ1dHRvblRvZ2dsZSkpO1xyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZWRpdFByZXZHYW1lKVxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lcGxheSIsImltcG9ydCBoZWF0bWFwIGZyb20gXCIuLi9saWIvbm9kZV9tb2R1bGVzL2hlYXRtYXAuanMvYnVpbGQvaGVhdG1hcC5qc1wiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJLmpzXCI7XHJcbmltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXIuanNcIjtcclxuaW1wb3J0IGRhdGVGaWx0ZXIgZnJvbSBcIi4vZGF0ZUZpbHRlci5qc1wiO1xyXG5pbXBvcnQgZmVlZGJhY2sgZnJvbSBcIi4vaGVhdG1hcEZlZWRiYWNrXCI7XHJcblxyXG4vLyBJRCBvZiBzZXRJbnRlcnZhbCBmdW5jdGlvbiB1c2VkIHRvIG1vbml0b3IgY29udGFpbmVyIHdpZHRoIGFuZCByZXBhaW50IGhlYXRtYXAgaWYgY29udGFpbmVyIHdpZHRoIGNoYW5nZXNcclxuLy8gbGV0IGludGVydmFsSWQ7XHJcbi8vIGdsb2JhbCB2YXJpYWJsZSB0byBzdG9yZSBmZXRjaGVkIHNob3RzXHJcbmxldCBnbG9iYWxTaG90c0FycjtcclxubGV0IGpvaW5UYWJsZUFyciA9IFtdO1xyXG4vLyBnbG9iYWwgdmFyaWFibGUgdXNlZCB3aXRoIGJhbGwgc3BlZWQgZmlsdGVyIG9uIGhlYXRtYXBzXHJcbmxldCBjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCA9IGZhbHNlO1xyXG4vLyBnbG9iYWwgdmFyaWFibGVzIHVzZWQgd2l0aCBkYXRlIHJhbmdlIGZpbHRlclxyXG5sZXQgc3RhcnREYXRlO1xyXG5sZXQgZW5kRGF0ZTtcclxuXHJcbi8vIEZJWE1FOiBleGFtaW5lIGNvbmZpcm1IZWF0bWFwRGVsZXRlIGZ1bmN0aW9uLiBtYXkgbm90IG5lZWQgZm9yIGxvb3AuIGdyYWIgSUQgZnJvbSBvcHRpb25cclxuLy8gVE9ETzogc2V0IGludGVydmFsIGZvciBjb250YWluZXIgd2lkdGggbW9uaXRvcmluZ1xyXG4vLyBUT0RPOiBpZiBjdXN0b20gaGVhdG1hcCBpcyBzZWxlY3RlZCBmcm9tIGRyb3Bkb3duLCB0aGVuIGJsdXIgZmlsdGVyIGNvbnRhaW5lclxyXG4vLyBGSVhNRTogcmVuZGVyaW5nIGEgc2F2ZWQgaGVhdG1hcCB3aXRoIGRhdGUgZmlsdGVyIHNvbWV0aW1lcyBidWdzIG91dFxyXG4vLyBUT0RPOiBzYXZpbmcgaGVhdG1hcCBuZWVkcyB0byBhcHBlbmQgZGF0ZSB3aXRoIG5hbWUgb2YgaGVhdG1hcCBpbiBkcm9wZG93biBtZW51XHJcblxyXG5jb25zdCBoZWF0bWFwRGF0YSA9IHtcclxuXHJcbiAgZ2V0VXNlclNob3RzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZW1vdmVzIGFuIGV4aXN0aW5nIGhlYXRtYXAgaWYgbmVjZXNzYXJ5IGFuZCB0aGVuIGRldGVybWluZXMgd2hldGhlclxyXG4gICAgLy8gdG8gY2FsbCB0aGUgYmFzaWMgaGVhdG1hcCBvciBzYXZlZCBoZWF0bWFwIGZ1bmN0aW9uc1xyXG5cclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcblxyXG4gICAgY29uc3QgaGVhdG1hcE5hbWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcbiAgICBjb25zdCBmaWVsZEhlYXRtYXBDYW52YXMgPSBmaWVsZENvbnRhaW5lci5jaGlsZE5vZGVzWzJdXHJcbiAgICBjb25zdCBnb2FsSGVhdG1hcENhbnZhcyA9IGdvYWxDb250YWluZXIuY2hpbGROb2Rlc1sxXVxyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3MgYWxyZWFkeSBhIGhlYXRtYXAgbG9hZGVkLCByZW1vdmUgaXQgYmVmb3JlIGNvbnRpbnVpbmdcclxuICAgIGlmIChmaWVsZEhlYXRtYXBDYW52YXMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBmaWVsZEhlYXRtYXBDYW52YXMucmVtb3ZlKCk7XHJcbiAgICAgIGdvYWxIZWF0bWFwQ2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICBpZiAoaGVhdG1hcE5hbWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChoZWF0bWFwTmFtZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgICBoZWF0bWFwRGF0YS5mZXRjaEJhc2ljSGVhdG1hcERhdGEoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBoZWF0bWFwRGF0YS5mZXRjaFNhdmVkSGVhdG1hcERhdGEoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGZldGNoQmFzaWNIZWF0bWFwRGF0YSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZ29lcyB0byB0aGUgZGF0YWJhc2UgYW5kIHJldHJpZXZlcyBzaG90cyB0aGF0IG1lZXQgc3BlY2lmaWMgZmlsdGVycyAoYWxsIHNob3RzIGZldGNoZWQgaWYgKVxyXG4gICAgbGV0IGdhbWVJZHNfZGF0ZSA9IFtdO1xyXG4gICAgbGV0IGdhbWVJZHNfcmVzdWx0ID0gW107XHJcbiAgICBsZXQgZ2FtZUlkcyA9IFtdOyAvLyBhcnJheSB0aGF0IGNvbnRhaW5zIGdhbWUgSUQgdmFsdWVzIHBhc3NpbmcgYm90aCB0aGUgZGF0ZSBhbmQgZ2FtZSByZXN1bHQgZmlsdGVyc1xyXG4gICAgY29uc3QgZ2FtZVJlc3VsdEZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVSZXN1bHRcIikudmFsdWU7XHJcbiAgICBjb25zdCBnYW1lVVJMZXh0ZW5zaW9uID0gaGVhdG1hcERhdGEuYXBwbHlHYW1lRmlsdGVycygpO1xyXG5cclxuICAgIEFQSS5nZXRBbGwoZ2FtZVVSTGV4dGVuc2lvbilcclxuICAgICAgLnRoZW4oZ2FtZXMgPT4ge1xyXG4gICAgICAgIGdhbWVzLmZvckVhY2goZ2FtZSA9PiB7XHJcbiAgICAgICAgICAvLyB0aGUgZGF0ZSBmaWx0ZXIgYW5kIGdhbWUgcmVzdWx0cyBmaWx0ZXJzIGNhbm5vdCBiZSBhcHBsaWVkIGluIHRoZSBKU09OIHNlcnZlciBVUkwsIHNvIHRoZSBmaWx0ZXJzIGFyZVxyXG4gICAgICAgICAgLy8gY2FsbGVkIGhlcmUuIEVhY2ggZnVuY3Rpb24gcG9wdWxhdGVzIGFuIGFycmF5IHdpdGggZ2FtZSBJRHMgdGhhdCBtYXRjaCB0aGUgZmlsdGVyIHJlcXVpcmVtZW50cy5cclxuICAgICAgICAgIC8vIGEgZmlsdGVyIG1ldGhvZCBpcyB0aGVuIHVzZWQgdG8gY29sbGVjdCBhbGwgbWF0Y2hpbmcgZ2FtZSBJRHMgZnJvbSB0aGUgdHdvIGFycmF5cyAoaS5lLiBhIGdhbWUgdGhhdCBwYXNzZWRcclxuICAgICAgICAgIC8vIHRoZSByZXF1aXJlbWVudHMgb2YgYm90aCBmaWx0ZXJzKVxyXG4gICAgICAgICAgLy8gTk9URTogaWYgc3RhcnQgZGF0ZSBpcyBub3QgZGVmaW5lZCwgdGhlIHJlc3VsdCBmaWx0ZXIgaXMgdGhlIG9ubHkgZnVuY3Rpb24gY2FsbGVkLCBhbmQgaXQgaXMgcGFzc2VkIHRoZSB0aGlyZCBhcnJheVxyXG4gICAgICAgICAgaWYgKHN0YXJ0RGF0ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGRhdGVGaWx0ZXIuYXBwbHlkYXRlRmlsdGVyKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgZ2FtZUlkc19kYXRlLCBnYW1lKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYXBwbHlHYW1lUmVzdWx0RmlsdGVyKGdhbWVSZXN1bHRGaWx0ZXIsIGdhbWVJZHNfcmVzdWx0LCBnYW1lKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmFwcGx5R2FtZVJlc3VsdEZpbHRlcihnYW1lUmVzdWx0RmlsdGVyLCBnYW1lSWRzLCBnYW1lKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmIChzdGFydERhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgZ2FtZUlkcyA9IGdhbWVJZHNfZGF0ZS5maWx0ZXIoaWQgPT4gZ2FtZUlkc19yZXN1bHQuaW5jbHVkZXMoaWQpKVxyXG4gICAgICAgICAgcmV0dXJuIGdhbWVJZHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBnYW1lSWRzO1xyXG4gICAgICB9KVxyXG4gICAgICAudGhlbihnYW1lSWRzID0+IHtcclxuICAgICAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGFsZXJ0KFwiU29ycnkhIEVpdGhlciBubyBzaG90cyBoYXZlIGJlZW4gc2F2ZWQgeWV0IG9yIG5vIGdhbWVzIG1hdGNoIHRoZSBjdXJyZW50IGZpbHRlcnMuIFZpc2l0IHRoZSBHYW1lcGxheSBwYWdlIHRvIGdldCBzdGFydGVkIG9yIHRvIGFkZCBtb3JlIHNob3RzLlwiKVxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IHNob3RVUkxleHRlbnNpb24gPSBoZWF0bWFwRGF0YS5hcHBseVNob3RGaWx0ZXJzKGdhbWVJZHMpO1xyXG4gICAgICAgICAgQVBJLmdldEFsbChzaG90VVJMZXh0ZW5zaW9uKVxyXG4gICAgICAgICAgICAudGhlbihzaG90cyA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHNob3RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJTb3JyeSEgTm8gc2hvdHMgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy4gVmlzaXQgdGhlIEdhbWVwbGF5IHBhZ2UgdG8gZ2V0IHN0YXJ0ZWQgb3IgYWRkIHRvIG1vcmUgc2hvdHMuXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90cztcclxuICAgICAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkR29hbEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICAgICAgZmVlZGJhY2subG9hZEZlZWRiYWNrKHNob3RzKTtcclxuICAgICAgICAgICAgICAgIC8vIGludGVydmFsSWQgPSBzZXRJbnRlcnZhbChoZWF0bWFwRGF0YS5nZXRBY3RpdmVPZmZzZXRzLCA1MDApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIGZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24sIGFuZCBpdHMgY291bnRlcnBhcnQgZmV0Y2hTYXZlZFNob3RzVXNpbmdKb2luVGFibGVzIHJlbmRlciBhbiBhbHJlYWR5LXNhdmVkIGhlYXRtYXAgdGhvdWdoIHRoZXNlIHN0ZXBzOlxyXG4gICAgLy8gMS4gZ2V0dGluZyB0aGUgaGVhdG1hcCBuYW1lIGZyb20gdGhlIGRyb3Bkb3duIHZhbHVlXHJcbiAgICAvLyAyLiB1c2luZyB0aGUgbmFtZSB0byBmaW5kIHRoZSBjaGlsZE5vZGVzIGluZGV4IG9mIHRoZSBkcm9wZG93biB2YWx1ZSAoaS5lLiB3aGljaCBIVE1MIDxvcHRpb24+KSBhbmQgZ2V0IGl0cyBJRFxyXG4gICAgLy8gMy4gZmV0Y2ggYWxsIHNob3RfaGVhdG1hcCBqb2luIHRhYmxlcyB3aXRoIG1hdGNoaW5nIGhlYXRtYXAgSURcclxuICAgIC8vIDQuIGZldGNoIHNob3RzIHVzaW5nIHNob3QgSURzIGZyb20gam9pbiB0YWJsZXNcclxuICAgIC8vIDUuIHJlbmRlciBoZWF0bWFwIGJ5IGNhbGxpbmcgYnVpbGQgZnVuY3Rpb25zXHJcblxyXG4gICAgLy8gc3RlcCAxOiBnZXQgbmFtZSBvZiBoZWF0bWFwXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuICAgIC8vIHN0ZXAgMjogdXNlIG5hbWUgdG8gZ2V0IGhlYXRtYXAgSUQgc3RvcmVkIGluIEhUTUwgb3B0aW9uIGVsZW1lbnRcclxuICAgIGxldCBjdXJyZW50SGVhdG1hcElkO1xyXG4gICAgaGVhdG1hcERyb3Bkb3duLmNoaWxkTm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICAgIGlmIChjaGlsZC50ZXh0Q29udGVudCA9PT0gY3VycmVudERyb3Bkb3duVmFsdWUpIHtcclxuICAgICAgICBjdXJyZW50SGVhdG1hcElkID0gY2hpbGQuaWQuc2xpY2UoOCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gc3RlcCAzOiBmZXRjaCBqb2luIHRhYmxlc1xyXG4gICAgQVBJLmdldEFsbChgc2hvdF9oZWF0bWFwP2hlYXRtYXBJZD0ke2N1cnJlbnRIZWF0bWFwSWR9YClcclxuICAgICAgLnRoZW4oam9pblRhYmxlcyA9PiBoZWF0bWFwRGF0YS5mZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMoam9pblRhYmxlcylcclxuICAgICAgICAvLyBzdGVwIDU6IHBhc3Mgc2hvdHMgdG8gYnVpbGRGaWVsZEhlYXRtYXAoKSBhbmQgYnVpbGRHb2FsSGVhdG1hcCgpXHJcbiAgICAgICAgLnRoZW4oc2hvdHMgPT4ge1xyXG4gICAgICAgICAgLy8gYXBwbHkgZGF0ZSBmaWx0ZXIgaWYgZmlsdGVyIGhhcyBiZWVuIHNldFxyXG4gICAgICAgICAgaWYgKHN0YXJ0RGF0ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxldCBzaG90c01hdGNoaW5nRmlsdGVyID0gW107XHJcbiAgICAgICAgICAgIGRhdGVGaWx0ZXIuYXBwbHlkYXRlRmlsdGVyVG9TYXZlZEhlYXRtYXAoc3RhcnREYXRlLCBlbmREYXRlLCBzaG90cywgc2hvdHNNYXRjaGluZ0ZpbHRlcik7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzTWF0Y2hpbmdGaWx0ZXIpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzTWF0Y2hpbmdGaWx0ZXIpO1xyXG4gICAgICAgICAgICBnbG9iYWxTaG90c0FyciA9IHNob3RzTWF0Y2hpbmdGaWx0ZXIgLy8gSU1QT1JUQU5UISBwcmV2ZW50cyBlcnJvciBpbiBoZWF0bWFwIHNhdmUgd2hlbiByZW5kZXJpbmcgc2F2ZWQgbWFwIGFmdGVyIHJlbmRlcmluZyBiYXNpYyBoZWF0bWFwXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkR29hbEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICBnbG9iYWxTaG90c0FyciA9IHNob3RzIC8vIElNUE9SVEFOVCEgcHJldmVudHMgZXJyb3IgaW4gaGVhdG1hcCBzYXZlIHdoZW4gcmVuZGVyaW5nIHNhdmVkIG1hcCBhZnRlciByZW5kZXJpbmcgYmFzaWMgaGVhdG1hcFxyXG4gICAgICAgICAgICBmZWVkYmFjay5sb2FkRmVlZGJhY2soc2hvdHMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgam9pblRhYmxlQXJyID0gW107XHJcbiAgICAgICAgfSlcclxuICAgICAgKVxyXG4gIH0sXHJcblxyXG4gIGZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyhqb2luVGFibGVzKSB7XHJcbiAgICAvLyBzZWUgbm90ZXMgb24gZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKClcclxuICAgIGpvaW5UYWJsZXMuZm9yRWFjaCh0YWJsZSA9PiB7XHJcbiAgICAgIC8vIHN0ZXAgNC4gdGhlbiBmZXRjaCB1c2luZyBlYWNoIHNob3RJZCBpbiB0aGUgam9pbiB0YWJsZXNcclxuICAgICAgam9pblRhYmxlQXJyLnB1c2goQVBJLmdldFNpbmdsZUl0ZW0oXCJzaG90c1wiLCB0YWJsZS5zaG90SWQpKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2luVGFibGVBcnIpXHJcbiAgfSxcclxuXHJcbiAgYXBwbHlHYW1lRmlsdGVycygpIHtcclxuICAgIC8vIE5PVEU6IGdhbWUgcmVzdWx0IGZpbHRlciAodmljdG9yeS9kZWZlYXQpIGNhbm5vdCBiZSBhcHBsaWVkIGluIHRoaXMgZnVuY3Rpb24gYW5kIGlzIGFwcGxpZWQgYWZ0ZXIgdGhlIGZldGNoXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lTW9kZVwiKS52YWx1ZTtcclxuICAgIGNvbnN0IGdhbWV0eXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVR5cGVcIikudmFsdWU7XHJcbiAgICBjb25zdCBvdmVydGltZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLW92ZXJ0aW1lXCIpLnZhbHVlO1xyXG4gICAgY29uc3QgdGVhbVN0YXR1c0ZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLXRlYW1TdGF0dXNcIikudmFsdWU7XHJcblxyXG4gICAgbGV0IFVSTCA9IFwiZ2FtZXNcIjtcclxuXHJcbiAgICBVUkwgKz0gYD91c2VySWQ9JHthY3RpdmVVc2VySWR9YDtcclxuICAgIC8vIGdhbWUgbW9kZVxyXG4gICAgaWYgKGdhbWVNb2RlRmlsdGVyID09PSBcIkNvbXBldGl0aXZlXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm1vZGU9Y29tcGV0aXRpdmVcIlxyXG4gICAgfSBlbHNlIGlmIChnYW1lTW9kZUZpbHRlciA9PT0gXCJDYXN1YWxcIikge1xyXG4gICAgICBVUkwgKz0gXCImbW9kZT1jYXN1YWxcIlxyXG4gICAgfVxyXG4gICAgLy8gZ2FtZSB0eXBlXHJcbiAgICBpZiAoZ2FtZXR5cGVGaWx0ZXIgPT09IFwiM3YzXCIpIHtcclxuICAgICAgVVJMICs9IFwiJnR5cGU9M3YzXCJcclxuICAgIH0gZWxzZSBpZiAoZ2FtZXR5cGVGaWx0ZXIgPT09IFwiMnYyXCIpIHtcclxuICAgICAgVVJMICs9IFwiJnR5cGU9MnYyXCJcclxuICAgIH0gZWxzZSBpZiAoZ2FtZXR5cGVGaWx0ZXIgPT09IFwiMXYxXCIpIHtcclxuICAgICAgVVJMICs9IFwiJnR5cGU9MXYxXCJcclxuICAgIH1cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBpZiAob3ZlcnRpbWVGaWx0ZXIgPT09IFwiT1RcIikge1xyXG4gICAgICBVUkwgKz0gXCImb3ZlcnRpbWU9dHJ1ZVwiXHJcbiAgICB9IGVsc2UgaWYgKG92ZXJ0aW1lRmlsdGVyID09PSBcIk5vIE9UXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm92ZXJ0aW1lPWZhbHNlXCJcclxuICAgIH1cclxuICAgIC8vIHRlYW0gc3RhdHVzXHJcbiAgICBpZiAodGVhbVN0YXR1c0ZpbHRlciA9PT0gXCJObyBwYXJ0eVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZwYXJ0eT1mYWxzZVwiXHJcbiAgICB9IGVsc2UgaWYgKHRlYW1TdGF0dXNGaWx0ZXIgPT09IFwiUGFydHlcIikge1xyXG4gICAgICBVUkwgKz0gXCImcGFydHk9dHJ1ZVwiXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFVSTDtcclxuICB9LFxyXG5cclxuICBhcHBseUdhbWVSZXN1bHRGaWx0ZXIoZ2FtZVJlc3VsdEZpbHRlciwgZ2FtZUlkcywgZ2FtZSkge1xyXG4gICAgLy8gaWYgdmljdG9yeSwgdGhlbiBjaGVjayBmb3IgZ2FtZSdzIHNjb3JlIHZzIGdhbWUncyBvcHBvbmVudCBzY29yZVxyXG4gICAgLy8gaWYgdGhlIGZpbHRlciBpc24ndCBzZWxlY3RlZCBhdCBhbGwsIHB1c2ggYWxsIGdhbWUgSURzIHRvIGdhbWVJZHMgYXJyYXlcclxuICAgIGlmIChnYW1lUmVzdWx0RmlsdGVyID09PSBcIlZpY3RvcnlcIikge1xyXG4gICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGdhbWVSZXN1bHRGaWx0ZXIgPT09IFwiRGVmZWF0XCIpIHtcclxuICAgICAgaWYgKGdhbWUuc2NvcmUgPCBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5U2hvdEZpbHRlcnMoZ2FtZUlkcykge1xyXG4gICAgY29uc3Qgc2hvdFR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1zaG90VHlwZVwiKS52YWx1ZTtcclxuICAgIGxldCBVUkwgPSBcInNob3RzXCJcclxuXHJcbiAgICAvLyBnYW1lIElEXHJcbiAgICAvLyBmb3IgZWFjaCBnYW1lSWQsIGFwcGVuZCBVUkwuIEFwcGVuZCAmIGluc3RlYWQgb2YgPyBvbmNlIGZpcnN0IGdhbWVJZCBpcyBhZGRlZCB0byBVUkxcclxuICAgIGlmIChnYW1lSWRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgbGV0IGdhbWVJZENvdW50ID0gMDtcclxuICAgICAgZ2FtZUlkcy5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgICBpZiAoZ2FtZUlkQ291bnQgPCAxKSB7XHJcbiAgICAgICAgICBVUkwgKz0gYD9nYW1lSWQ9JHtpZH1gO1xyXG4gICAgICAgICAgZ2FtZUlkQ291bnQrKztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgVVJMICs9IGAmZ2FtZUlkPSR7aWR9YDtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9IC8vIGVsc2Ugc3RhdGVtZW50IGlzIGhhbmRsZWQgaW4gZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKClcclxuICAgIC8vIHNob3QgdHlwZVxyXG4gICAgaWYgKHNob3RUeXBlRmlsdGVyID09PSBcIkFlcmlhbFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZhZXJpYWw9dHJ1ZVwiO1xyXG4gICAgfSBlbHNlIGlmIChzaG90VHlwZUZpbHRlciA9PT0gXCJTdGFuZGFyZFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZhZXJpYWw9ZmFsc2VcIlxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFVSTDtcclxuICB9LFxyXG5cclxuICBidWlsZEZpZWxkSGVhdG1hcChzaG90cykge1xyXG4gICAgY29uc29sZS5sb2coXCJBcnJheSBvZiBmZXRjaGVkIHNob3RzXCIsIHNob3RzKVxyXG5cclxuICAgIC8vIGNyZWF0ZSBmaWVsZCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBsZXQgdmFyV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB2YXJIZWlnaHQgPSBmaWVsZENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgbGV0IGZpZWxkQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0RmllbGRDb25maWcoZmllbGRDb250YWluZXIpO1xyXG5cclxuICAgIGxldCBGaWVsZEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIEZpZWxkSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZmllbGRDb25maWcpO1xyXG5cclxuICAgIGxldCBmaWVsZERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZmllbGRYICogdmFyV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZmllbGRZICogdmFySGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIC8vIHNldCB2YWx1ZSBhcyBiYWxsIHNwZWVkIGlmIHNwZWVkIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgICB2YWx1ZV8gPSBzaG90LmJhbGxfc3BlZWQ7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IGZpZWxkT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZmllbGREYXRhUG9pbnRzLnB1c2goZmllbGRPYmopO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZmllbGREYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZmllbGREYXRhUG9pbnRzXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHNldCBtYXggdmFsdWUgYXMgbWF4IGJhbGwgc3BlZWQgaW4gc2hvdHMsIGlmIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgIGxldCBtYXhCYWxsU3BlZWQgPSBzaG90cy5yZWR1Y2UoKG1heCwgc2hvdCkgPT4gc2hvdC5iYWxsX3NwZWVkID4gbWF4ID8gc2hvdC5iYWxsX3NwZWVkIDogbWF4LCBzaG90c1swXS5iYWxsX3NwZWVkKTtcclxuICAgICAgZmllbGREYXRhLm1heCA9IG1heEJhbGxTcGVlZDtcclxuICAgIH1cclxuXHJcbiAgICBGaWVsZEhlYXRtYXBJbnN0YW5jZS5zZXREYXRhKGZpZWxkRGF0YSk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHb2FsSGVhdG1hcChzaG90cykge1xyXG4gICAgLy8gY3JlYXRlIGdvYWwgaGVhdG1hcCB3aXRoIGNvbmZpZ3VyYXRpb25cclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGxldCB2YXJHb2FsV2lkdGggPSBnb2FsQ29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHZhckdvYWxIZWlnaHQgPSBnb2FsQ29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICBsZXQgZ29hbENvbmZpZyA9IGhlYXRtYXBEYXRhLmdldEdvYWxDb25maWcoZ29hbENvbnRhaW5lcik7XHJcblxyXG4gICAgbGV0IEdvYWxIZWF0bWFwSW5zdGFuY2U7XHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZ29hbENvbmZpZyk7XHJcblxyXG4gICAgbGV0IGdvYWxEYXRhUG9pbnRzID0gW107XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IHhfID0gTnVtYmVyKChzaG90LmdvYWxYICogdmFyR29hbFdpZHRoKS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHlfID0gTnVtYmVyKChzaG90LmdvYWxZICogdmFyR29hbEhlaWdodCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB2YWx1ZV8gPSAxO1xyXG4gICAgICAvLyBzZXQgdmFsdWUgYXMgYmFsbCBzcGVlZCBpZiBzcGVlZCBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgICAgdmFsdWVfID0gc2hvdC5iYWxsX3NwZWVkO1xyXG4gICAgICB9XHJcbiAgICAgIGxldCBnb2FsT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZ29hbERhdGFQb2ludHMucHVzaChnb2FsT2JqKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGdvYWxEYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZ29hbERhdGFQb2ludHNcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgbWF4IHZhbHVlIGFzIG1heCBiYWxsIHNwZWVkIGluIHNob3RzLCBpZiBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICBsZXQgbWF4QmFsbFNwZWVkID0gc2hvdHMucmVkdWNlKChtYXgsIHNob3QpID0+IHNob3QuYmFsbF9zcGVlZCA+IG1heCA/IHNob3QuYmFsbF9zcGVlZCA6IG1heCwgc2hvdHNbMF0uYmFsbF9zcGVlZCk7XHJcbiAgICAgIGdvYWxEYXRhLm1heCA9IG1heEJhbGxTcGVlZDtcclxuICAgIH1cclxuXHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZ29hbERhdGEpO1xyXG4gIH0sXHJcblxyXG4gIGdldEZpZWxkQ29uZmlnKGZpZWxkQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMjVweCBhdCA1NTBweCB3aWR0aCwgb3IgNC41NDUlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGZpZWxkQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IDAuMDQ1NDU0NTQ1ICogZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC42LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuODVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMzVweCBhdCA1NTBweCB3aWR0aCwgb3IgNi4zNjMlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGdvYWxDb250YWluZXIsXHJcbiAgICAgIHJhZGl1czogLjA2MzYzNjM2MyAqIGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC42LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuODVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgYmFsbFNwZWVkTWF4KCkge1xyXG4gICAgLy8gdGhpcyBidXR0b24gZnVuY3Rpb24gY2FsbGJhY2sgKGl0J3MgYSBmaWx0ZXIpIGNoYW5nZXMgYSBib29sZWFuIGdsb2JhbCB2YXJpYWJsZSB0aGF0IGRldGVybWluZXMgdGhlIG1pbiBhbmQgbWF4IHZhbHVlc1xyXG4gICAgLy8gdXNlZCB3aGVuIHJlbmRlcmluZyB0aGUgaGVhdG1hcHMgKHNlZSBidWlsZEZpZWxkSGVhdG1hcCgpIGFuZCBidWlsZEdvYWxIZWF0bWFwKCkpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZEJ0blwiKTtcclxuXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gdHJ1ZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIGEgaGVhdG1hcCBsb2FkZWQgYWxyZWFkeSwgY29udmVydCB0aGUgY29uZmlnIGltbWVkaWF0ZWx5IHRvIHVzZSB0aGUgbWF4IGJhbGwgc3BlZWRcclxuICAgIC8vIHRoZSBJRiBzdGF0ZW1lbnQgaXMgbmVlZGVkIHNvIHRoZSB1c2VyIGNhbid0IGltbWVkaWF0ZWx5IHJlbmRlciBhIGhlYXRtYXAganVzdCBieSBjbGlja2luZ1xyXG4gICAgLy8gdGhlIHNwZWVkIGZpbHRlclxyXG4gICAgLy8gY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcblxyXG4gICAgLy8gY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXVxyXG4gICAgLy8gaWYgKGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyAgIGhlYXRtYXBEYXRhLmdldFVzZXJTaG90cygpO1xyXG4gICAgLy8gfVxyXG4gIH0sXHJcblxyXG4gIC8qZ2V0QWN0aXZlT2Zmc2V0cygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZXZhbHVhdGVzIHRoZSB3aWR0aCBvZiB0aGUgaGVhdG1hcCBjb250YWluZXIgYXQgMC41IHNlY29uZCBpbnRlcnZhbHMuIElmIHRoZSB3aWR0aCBoYXMgY2hhbmdlZCxcclxuICAgIC8vIHRoZW4gdGhlIGhlYXRtYXAgY2FudmFzIGlzIHJlcGFpbnRlZCB0byBmaXQgd2l0aGluIHRoZSBjb250YWluZXIgbGltaXRzXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IGNhcHR1cmVXaWR0aCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldFdpZHRoXHJcbiAgICAvL2V2YWx1YXRlIGNvbnRhaW5lciB3aWR0aCBhZnRlciAwLjUgc2Vjb25kcyB2cyBpbml0aWFsIGNvbnRhaW5lciB3aWR0aFxyXG4gICAgaWYgKGNhcHR1cmVXaWR0aCA9PT0gdmFyV2lkdGgpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJ1bmNoYW5nZWRcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJXaWR0aCA9IGNhcHR1cmVXaWR0aFxyXG4gICAgICBjb25zb2xlLmxvZyhcIm5ldyB3aWR0aFwiLCB2YXJXaWR0aCk7XHJcbiAgICAgIC8vY2xlYXIgaGVhdG1hcFxyXG4gICAgICBmaWVsZENvbnRhaW5lci5yZW1vdmVDaGlsZChmaWVsZENvbnRhaW5lci5jaGlsZE5vZGVzWzBdKTtcclxuICAgICAgLy9idWlsZCBoZWF0bWFwIGFnYWluXHJcbiAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkSGVhdG1hcCgpO1xyXG4gICAgfVxyXG4gIH0sKi9cclxuXHJcbiAgc2F2ZUhlYXRtYXAoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBzYXZpbmcgYSBoZWF0bWFwIG9iamVjdCB3aXRoIGEgbmFtZSBhbmQgdXNlcklkLCB0aGVuIG1ha2luZyBqb2luIHRhYmxlcyB3aXRoXHJcbiAgICAvLyBUT0RPOiByZXF1aXJlIHVuaXF1ZSBoZWF0bWFwIG5hbWUgKG1heSBub3QgbmVlZCB0byBkbyB0aGlzIGlmIGZ1bmN0aW9uIGJlbG93IHVzZXMgSUQgaW5zdGVhZCBvZiBuYW1lKVxyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBjb25zdCBzYXZlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuXHJcbiAgICBjb25zdCBoZWF0bWFwVGl0bGUgPSBzYXZlSW5wdXQudmFsdWU7XHJcbiAgICBjb25zdCBmaWVsZEhlYXRtYXBDYW52YXMgPSBmaWVsZENvbnRhaW5lci5jaGlsZE5vZGVzWzJdO1xyXG5cclxuICAgIC8vIGhlYXRtYXAgbXVzdCBoYXZlIGEgdGl0bGUsIHRoZSB0aXRsZSBjYW5ub3QgYmUgXCJTYXZlIHN1Y2Nlc3NmdWwhXCIgb3IgXCJCYXNpYyBIZWF0bWFwXCJcclxuICAgIC8vIHRoZXJlIG11c3QgYmUgYSBoZWF0bWFwIGNhbnZhcyBsb2FkZWQgb24gdGhlIHBhZ2UsIGFuZCB0aGUgc2F2ZSBidXR0b24gd2lsbCBub3Qgd29yayBpZlxyXG4gICAgLy8gdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHNhdmUgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwIChzZWUgaW50ZXJuYWwgaWYgc3RhdGVtZW50KVxyXG4gICAgaWYgKGhlYXRtYXBUaXRsZS5sZW5ndGggPiAwICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJTYXZlIHN1Y2Nlc3NmdWxcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiQmFzaWMgSGVhdG1hcFwiICYmIGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChoZWF0bWFwRHJvcGRvd24udmFsdWUgIT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCJcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgICAgICBoZWF0bWFwRGF0YS5zYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUpXHJcbiAgICAgICAgICAudGhlbihoZWF0bWFwT2JqID0+IGhlYXRtYXBEYXRhLnNhdmVKb2luVGFibGVzKGhlYXRtYXBPYmopLnRoZW4oeCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiam9pbiB0YWJsZXMgc2F2ZWRcIiwgeClcclxuICAgICAgICAgICAgLy8gZW1wdHkgdGhlIHRlbXBvcmFyeSBnbG9iYWwgYXJyYXkgdXNlZCB3aXRoIFByb21pc2UuYWxsXHJcbiAgICAgICAgICAgIGpvaW5UYWJsZUFyciA9IFtdXHJcbiAgICAgICAgICAgIC8vIGFwcGVuZCBuZXdseSBjcmVhdGVkIGhlYXRtYXAgYXMgb3B0aW9uIGVsZW1lbnQgaW4gc2VsZWN0IGRyb3Bkb3duXHJcbiAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwgeyBcImlkXCI6IGBoZWF0bWFwLSR7aGVhdG1hcE9iai5pZH1gIH0sIGhlYXRtYXBPYmoubmFtZSkpO1xyXG4gICAgICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIlNhdmUgc3VjY2Vzc2Z1bFwiO1xyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gc2F2ZXMgYSBoZWF0bWFwIG9iamVjdCB3aXRoIHRoZSB1c2VyLXByb3ZpZGVkIG5hbWUsIHRoZSB1c2VySWQsIGFuZCB0aGUgY3VycmVudCBkYXRlL3RpbWVcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG4gICAgY29uc3QgaGVhdG1hcE9iaiA9IHtcclxuICAgICAgbmFtZTogaGVhdG1hcFRpdGxlLFxyXG4gICAgICB1c2VySWQ6IGFjdGl2ZVVzZXJJZCxcclxuICAgICAgdGltZVN0YW1wOiB0aW1lU3RhbXBcclxuICAgIH1cclxuICAgIHJldHVybiBBUEkucG9zdEl0ZW0oXCJoZWF0bWFwc1wiLCBoZWF0bWFwT2JqKVxyXG4gIH0sXHJcblxyXG4gIHNhdmVKb2luVGFibGVzKGhlYXRtYXBPYmopIHtcclxuICAgIGNvbnNvbGUubG9nKFwiZ2xvYmFsc2hvdHNhcnJheVwiLCBnbG9iYWxTaG90c0FycilcclxuICAgIGdsb2JhbFNob3RzQXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCBqb2luVGFibGVPYmogPSB7XHJcbiAgICAgICAgc2hvdElkOiBzaG90LmlkLFxyXG4gICAgICAgIGhlYXRtYXBJZDogaGVhdG1hcE9iai5pZFxyXG4gICAgICB9XHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RfaGVhdG1hcFwiLCBqb2luVGFibGVPYmopKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW5UYWJsZUFycilcclxuICB9LFxyXG5cclxuICBkZWxldGVIZWF0bWFwKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB0aGUgbG9naWMgdGhhdCBwcmV2ZW50cyB0aGUgdXNlciBmcm9tIGRlbGV0aW5nIGEgaGVhdG1hcCBpbiBvbmUgY2xpY2suXHJcbiAgICAvLyBhIHNlY29uZCBkZWxldGUgYnV0dG9uIGFuZCBhIGNhbmNlbCBidXR0b24gYXJlIHJlbmRlcmVkIGJlZm9yZSBhIGRlbGV0ZSBpcyBjb25maXJtZWRcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG5cclxuICAgIGlmIChjdXJyZW50RHJvcGRvd25WYWx1ZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgICBjb25zdCBjb25maXJtRGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNvbmZpcm0gRGVsZXRlXCIpO1xyXG4gICAgICBjb25zdCByZWplY3REZWxldGVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkNhbmNlbFwiKTtcclxuICAgICAgY29uc3QgRGVsZXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJkZWxldGVDb250cm9sXCIsIFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgY29uZmlybURlbGV0ZUJ0biwgcmVqZWN0RGVsZXRlQnRuKTtcclxuICAgICAgZGVsZXRlSGVhdG1hcEJ0bi5yZXBsYWNlV2l0aChEZWxldGVDb250cm9sKTtcclxuICAgICAgY29uZmlybURlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuY29uZmlybUhlYXRtYXBEZWxldGlvbik7XHJcbiAgICAgIHJlamVjdERlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVqZWN0SGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZS1yZW5kZXJzIHRoZSBwcmltYXJ5IGRlbGV0ZSBidXR0b25cclxuICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUNvbnRyb2xcIik7XHJcbiAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImRlbGV0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkRlbGV0ZSBIZWF0bWFwXCIpXHJcbiAgICBEZWxldGVDb250cm9sLnJlcGxhY2VXaXRoKGRlbGV0ZUhlYXRtYXBCdG4pXHJcbiAgICBkZWxldGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwKTtcclxuICB9LFxyXG5cclxuICBjb25maXJtSGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB3aWxsIGRlbGV0ZSB0aGUgc2VsZWN0ZWQgaGVhdG1hcCBvcHRpb24gaW4gdGhlIGRyb3Bkb3duIGxpc3QgYW5kIHJlbW92ZSBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkgeyAvL1RPRE86IGNoZWNrIHRoaXMgbG9naWMuIG1heSBiZSBhYmxlIHRvIHVzZSBJRCBpbnN0ZWFkIG9mIHJlcXVpcmluZyB1bmlxdWUgbmFtZVxyXG4gICAgICAgIGNoaWxkLnJlbW92ZSgpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXBPYmplY3RhbmRKb2luVGFibGVzKGNoaWxkLmlkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24udmFsdWUgPSBcIkJhc2ljIEhlYXRtYXBcIjtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcE9iamVjdGFuZEpvaW5UYWJsZXMoaGVhdG1hcElkKSB7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgcmV0dXJuIEFQSS5kZWxldGVJdGVtKFwiaGVhdG1hcHNcIiwgYCR7aGVhdG1hcElkLnNsaWNlKDgpfT91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICB9LFxyXG5cclxuICBoYW5kbGVCYWxsU3BlZWRHbG9iYWxWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYnkgdGhlIHJlc2V0IGZpbHRlcnMgYnV0dG9uIGFuZCBuYXZiYXIgaGVhdG1hcHMgdGFiIHRvIGZvcmNlIHRoZSBiYWxsIHNwZWVkIGZpbHRlciBvZmZcclxuICAgIGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyhyZXR1cm5Cb29sZWFuLCBzdGFydERhdGVJbnB1dCwgZW5kRGF0ZUlucHV0KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gU0VUIHRoZSBkYXRlIGZpbHRlciBnbG9iYWwgdmFyaWFibGVzIG9uIHRoaXMgcGFnZSBvciBDTEVBUiB0aGVtXHJcbiAgICAvLyBpZiB0aGUgMS4gcGFnZSBpcyByZWxvYWRlZCBvciAyLiB0aGUgXCJyZXNldCBmaWx0ZXJzXCIgYnV0dG9uIGlzIGNsaWNrZWRcclxuXHJcbiAgICAvLyB0aGUgZGF0ZUZpbHRlci5qcyBjYW5jZWwgYnV0dG9uIHJlcXVlc3RzIGEgZ2xvYmFsIHZhciB0byBkZXRlcm1pbmUgaG93IHRvIGhhbmRsZSBidXR0b24gY29sb3JcclxuICAgIGlmIChyZXR1cm5Cb29sZWFuKSB7XHJcbiAgICAgIHJldHVybiBzdGFydERhdGVcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiBubyBpbnB1dCB2YWx1ZXMgYXJlIHByb3ZpZGVkLCB0aGF0IG1lYW5zIHRoZSB2YXJpYWJsZXMgbmVlZCB0byBiZSByZXNldCBhbmQgdGhlIGRhdGVcclxuICAgIC8vIGZpbHRlciBidXR0b24gc2hvdWxkIGJlIG91dGxpbmVkIC0gZWxzZSBzZXQgZ2xvYmFsIHZhcnMgZm9yIGZpbHRlclxyXG4gICAgaWYgKHN0YXJ0RGF0ZUlucHV0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgc3RhcnREYXRlID0gdW5kZWZpbmVkO1xyXG4gICAgICBlbmREYXRlID0gdW5kZWZpbmVkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc3RhcnREYXRlID0gc3RhcnREYXRlSW5wdXQ7XHJcbiAgICAgIGVuZERhdGUgPSBlbmREYXRlSW5wdXQ7XHJcbiAgICB9XHJcblxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBoZWF0bWFwRGF0YSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIjtcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIjtcclxuXHJcbmNvbnN0IGZlZWRiYWNrID0ge1xyXG5cclxuICBsb2FkRmVlZGJhY2soc2hvdHMpIHtcclxuXHJcbiAgICAvLyBmaXJzdCwgdXNlIHRoZSBzaG90cyB3ZSBoYXZlIHRvIGZldGNoIHRoZSBnYW1lcyB0aGV5J3JlIGFzc29jaWF0ZWQgd2l0aFxyXG4gICAgbGV0IGdhbWVJZHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBnYW1lSWRzLnB1c2goc2hvdC5nYW1lSWQpO1xyXG4gICAgfSlcclxuXHJcbiAgICAvLyByZW1vdmUgZHVwbGljYXRlIGdhbWUgSURzXHJcbiAgICBnYW1lSWRzID0gZ2FtZUlkcy5maWx0ZXIoKGl0ZW0sIGlkeCkgPT4ge1xyXG4gICAgICByZXR1cm4gZ2FtZUlkcy5pbmRleE9mKGl0ZW0pID09IGlkeDtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuZmV0Y2hHYW1lcyhnYW1lSWRzKVxyXG4gICAgICAudGhlbihnYW1lcyA9PiB0aGlzLmNhbGN1bGF0ZUZlZWRiYWNrKHNob3RzLCBnYW1lcykpO1xyXG5cclxuICB9LFxyXG5cclxuICBmZXRjaEdhbWVzKGdhbWVJZHMpIHtcclxuICAgIGxldCBnYW1lcyA9IFtdO1xyXG4gICAgZ2FtZUlkcy5mb3JFYWNoKGdhbWVJZCA9PiB7XHJcbiAgICAgIGdhbWVzLnB1c2goQVBJLmdldFNpbmdsZUl0ZW0oXCJnYW1lc1wiLCBnYW1lSWQpKVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoZ2FtZXMpXHJcbiAgfSxcclxuXHJcbiAgY2FsY3VsYXRlRmVlZGJhY2soc2hvdHMsIGdhbWVzKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInNob3RzXCIsIHNob3RzKVxyXG4gICAgY29uc29sZS5sb2coXCJnYW1lc1wiLCBnYW1lcylcclxuXHJcbiAgICBsZXQgZmVlZGJhY2tSZXN1bHRzID0ge307XHJcblxyXG4gICAgLy8gZ2V0IGhlYXRtYXAgZGF0ZSBnZW5lcmF0ZWRcclxuICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCk7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubm93ID0gbm93O1xyXG4gICAgY29uc29sZS5sb2coZmVlZGJhY2tSZXN1bHRzLm5vdylcclxuXHJcbiAgICAvLyBnZXQgcmFuZ2Ugb2YgZGF0ZXMgb24gZ2FtZXMgKG1heCBhbmQgbWluKVxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmxhc3RHYW1lID0gZ2FtZXMucmVkdWNlKChtYXgsIGdhbWUpID0+IGdhbWUudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXSA+IG1heCA/IGdhbWUudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXSA6IG1heCwgZ2FtZXNbMF0udGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXSk7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuZmlyc3RHYW1lID0gZ2FtZXMucmVkdWNlKChtaW4sIGdhbWUpID0+IGdhbWUudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXSA8IG1pbiA/IGdhbWUudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXSA6IG1pbiwgZ2FtZXNbMF0udGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXSk7XHJcblxyXG5cclxuICAgIC8vIGdldCBhdmVyYWdlIGZpZWxkIHgseSBjb29yZGluYXRlIG9mIHBsYXllciBiYXNlZCBvbiBzaG90cyBhbmQgZ2l2ZSBwbGF5ZXIgZmVlZGJhY2tcclxuICAgIGxldCBzdW1YID0gMDtcclxuICAgIGxldCBzdW1ZID0gMDtcclxuICAgIGxldCBhdmdYO1xyXG4gICAgbGV0IGF2Z1k7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc3VtWCArPSBzaG90LmZpZWxkWDtcclxuICAgICAgc3VtWSArPSBzaG90LmZpZWxkWTtcclxuICAgIH0pXHJcblxyXG4gICAgYXZnWCA9IHN1bVggLyBzaG90cy5sZW5ndGg7XHJcbiAgICBhdmdZID0gc3VtWSAvIHNob3RzLmxlbmd0aDtcclxuICAgIGxldCBmaWVsZFBvc2l0aW9uO1xyXG5cclxuICAgIGlmIChhdmdYIDwgMC4xNSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJLZWVwZXJcIlxyXG4gICAgfSBlbHNlIGlmICgwLjE1IDw9IGF2Z1ggJiYgYXZnWCA8PSAwLjMwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlN3ZWVwZXJcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNDUgJiYgYXZnWSA8PSAwLjQwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkxlZnQgRnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNDUgJiYgMC42MCA8PSBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlJpZ2h0IEZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPD0gMC40NSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJDZW50ZXIgRnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8IDAuNjAgJiYgYXZnWSA8PSAwLjQwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkxlZnQgSGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8IDAuNjAgJiYgMC42MCA8PSBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlJpZ2h0IEhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPD0gMC42MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJDZW50ZXIgSGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjYwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNzUgJiYgYXZnWSA8PSAwLjUwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkxlZnQgRm9yd2FyZFwiXHJcbiAgICB9IGVsc2UgaWYgKDAuNjAgPD0gYXZnWCAmJiBhdmdYIDwgMC43NSAmJiAwLjUwIDwgYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJSaWdodCBGb3J3YXJkXCJcclxuICAgIH0gZWxzZSBpZiAoMC43NSA8PSBhdmdYKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlN0cmlrZXJcIlxyXG4gICAgfVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5maWVsZFBvc2l0aW9uID0gZmllbGRQb3NpdGlvblxyXG5cclxuICAgIC8vIGRldGVybWluZSBwbGF5ZXJzIHRoYXQgY29tcGxpbWVudCB0aGUgcGxheWVyJ3Mgc3R5bGVcclxuICAgIGxldCBjb21wbGVtZW50QTtcclxuICAgIGxldCBjb21wbGVtZW50QjtcclxuXHJcbiAgICBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJLZWVwZXJcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiU3dlZXBlclwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkxlZnQgRnVsbGJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlJpZ2h0IEZ1bGxCYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkNlbnRlciBGdWxsYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJMZWZ0IEhhbGZiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJSaWdodCBIYWxmYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJDZW50ZXIgSGFsZmJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiU3RyaWtlclwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiTGVmdCBGb3J3YXJkXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlJpZ2h0IEZvcndhcmRcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJTdHJpa2VyXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICB9XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRBID0gY29tcGxlbWVudEE7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY29tcGxlbWVudEIgPSBjb21wbGVtZW50QjtcclxuXHJcbiAgICAvLyBzaG90cyBzY29yZWQgb24gdGVhbSBzaWRlIGFuZCBvcHBvbmVudCBzaWRlIG9mIGZpZWxkLCAmIGRlZmVuc2l2ZSByZWRpcmVjdHMgKGkuZS4gd2l0aGluIGtlZXBlciByYW5nZSBvZiBnb2FsKVxyXG4gICAgbGV0IHRlYW1TaWRlID0gMDtcclxuICAgIGxldCBvcHBTaWRlID0gMDtcclxuICAgIGxldCBkZWZlbnNpdmVSZWRpcmVjdCA9IDA7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgaWYgKHNob3QuZmllbGRYID4gMC41MCkge1xyXG4gICAgICAgIG9wcFNpZGUrKztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0ZWFtU2lkZSsrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoc2hvdC5maWVsZFggPCAwLjE1KSB7XHJcbiAgICAgICAgZGVmZW5zaXZlUmVkaXJlY3QrKztcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMudGVhbVNpZGVHb2FscyA9IHRlYW1TaWRlO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLm9wcG9uZW50U2lkZUdvYWxzID0gb3BwU2lkZTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5kZWZlbnNpdmVSZWRpcmVjdCA9IGRlZmVuc2l2ZVJlZGlyZWN0O1xyXG5cclxuICAgIC8vIGFlcmlhbCBjb3VudCAmIHBlcmNlbnRhZ2Ugb2YgYWxsIHNob3RzXHJcbiAgICBsZXQgYWVyaWFsID0gMDtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBpZiAoc2hvdC5hZXJpYWwgPT09IHRydWUpIHtcclxuICAgICAgICBhZXJpYWwrKztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgbGV0IGFlcmlhbFBlcmNlbnRhZ2UgPSBOdW1iZXIoKGFlcmlhbCAvIHNob3RzLmxlbmd0aCAqIDEwMCkudG9GaXhlZCgwKSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmFlcmlhbCA9IGFlcmlhbDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5hZXJpYWxQZXJjZW50YWdlID0gYWVyaWFsUGVyY2VudGFnZTtcclxuXHJcbiAgICAvLyBtYXggYmFsbCBzcGVlZCwgYXZlcmFnZSBiYWxsIHNwZWVkLCBzaG90cyBvdmVyIDcwIG1waFxyXG4gICAgbGV0IGF2Z0JhbGxTcGVlZCA9IDA7XHJcbiAgICBsZXQgc2hvdHNPdmVyNzBtcGggPSAwO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGlmIChzaG90LmJhbGxfc3BlZWQgPj0gNzApIHtcclxuICAgICAgICBzaG90c092ZXI3MG1waCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGF2Z0JhbGxTcGVlZCArPSBzaG90LmJhbGxfc3BlZWRcclxuICAgIH0pO1xyXG5cclxuICAgIGF2Z0JhbGxTcGVlZCA9IE51bWJlcigoYXZnQmFsbFNwZWVkIC8gc2hvdHMubGVuZ3RoKS50b0ZpeGVkKDEpKTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubWF4QmFsbFNwZWVkID0gc2hvdHMucmVkdWNlKChtYXgsIHNob3QpID0+IHNob3QuYmFsbF9zcGVlZCA+IG1heCA/IHNob3QuYmFsbF9zcGVlZCA6IG1heCwgc2hvdHNbMF0uYmFsbF9zcGVlZCk7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuYXZnQmFsbFNwZWVkID0gYXZnQmFsbFNwZWVkO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnNob3RzT3ZlcjcwbXBoID0gc2hvdHNPdmVyNzBtcGg7XHJcblxyXG4gICAgLy8gM3YzLCAydjIsIGFuZCAxdjEgZ2FtZXMgcGxheWVkXHJcbiAgICBsZXQgXzN2MyA9IDA7XHJcbiAgICBsZXQgXzJ2MiA9IDA7XHJcbiAgICBsZXQgXzF2MSA9IDA7XHJcblxyXG4gICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgaWYgKGdhbWUudHlwZSA9PT0gXCIzdjNcIikge1xyXG4gICAgICAgIF8zdjMrKztcclxuICAgICAgfSBlbHNlIGlmIChnYW1lLnR5cGUgPT09IFwiMnYyXCIpIHtcclxuICAgICAgICBfMnYyKys7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgXzF2MSsrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuXzN2MyA9IF8zdjM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuXzJ2MiA9IF8ydjI7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuXzF2MSA9IF8xdjE7XHJcblxyXG4gICAgLy8gdG90YWwgZ2FtZXMgcGxheWVkLCB0b3RhbCBzaG90cyBzY29yZWQsIHdpbnMvbG9zc2VzL3dpbiVcclxuICAgIGZlZWRiYWNrUmVzdWx0cy50b3RhbEdhbWVzID0gZ2FtZXMubGVuZ3RoO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnRvdGFsU2hvdHMgPSBzaG90cy5sZW5ndGg7XHJcblxyXG4gICAgbGV0IHdpbnMgPSAwO1xyXG4gICAgbGV0IGxvc3NlcyA9IDA7XHJcblxyXG4gICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgIHdpbnMrK1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvc3NlcysrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMud2lucyA9IHdpbnM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubG9zc2VzID0gbG9zc2VzO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLndpblBjdCA9IE51bWJlcigoKHdpbnMgLyAod2lucyArIGxvc3NlcykpICogMTAwKS50b0ZpeGVkKDApKTtcclxuXHJcbiAgICAvLyBjb21wIGdhbWVzIC8gd2luICUsIGNhc3VhbCBnYW1lcyAvIHdpbiAlLCBnYW1lcyBpbiBPVFxyXG4gICAgbGV0IGNvbXBldGl0aXZlR2FtZXMgPSAwO1xyXG4gICAgbGV0IGNvbXBXaW4gPSAwO1xyXG4gICAgbGV0IGNhc3VhbEdhbWVzID0gMDtcclxuICAgIGxldCBjYXN1YWxXaW4gPSAwO1xyXG4gICAgbGV0IG92ZXJ0aW1lR2FtZXMgPSAwO1xyXG5cclxuICAgIGdhbWVzLmZvckVhY2goZ2FtZSA9PiB7XHJcbiAgICAgIGlmIChnYW1lLm1vZGUgPT09IFwiY2FzdWFsXCIpIHtcclxuICAgICAgICBjYXN1YWxHYW1lcysrO1xyXG4gICAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICAgIGNhc3VhbFdpbisrO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb21wZXRpdGl2ZUdhbWVzKys7XHJcbiAgICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgICAgY29tcFdpbisrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoZ2FtZS5vdmVydGltZSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIG92ZXJ0aW1lR2FtZXMrKztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIGxldCBjb21wV2luUGN0ID0gMDtcclxuXHJcbiAgICBpZiAoY29tcGV0aXRpdmVHYW1lcyA9PT0gMCkge1xyXG4gICAgICBjb21wV2luUGN0ID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbXBXaW5QY3QgPSBOdW1iZXIoKChjb21wV2luIC8gY29tcGV0aXRpdmVHYW1lcykgKiAxMDApLnRvRml4ZWQoMCkpO1xyXG4gICAgfVxyXG4gICAgbGV0IGNhc3VhbFdpblBjdCA9IDA7XHJcblxyXG4gICAgaWYgKGNhc3VhbEdhbWVzID09PSAwKSB7XHJcbiAgICAgIGNhc3VhbFdpblBjdCA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjYXN1YWxXaW5QY3QgPSBOdW1iZXIoKChjYXN1YWxXaW4gLyBjYXN1YWxHYW1lcykgKiAxMDApLnRvRml4ZWQoMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wZXRpdGl2ZUdhbWVzID0gY29tcGV0aXRpdmVHYW1lcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jYXN1YWxHYW1lcyA9IGNhc3VhbEdhbWVzO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBXaW5QY3QgPSBjb21wV2luUGN0O1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNhc3VhbFdpblBjdCA9IGNhc3VhbFdpblBjdDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5vdmVydGltZUdhbWVzID0gb3ZlcnRpbWVHYW1lcztcclxuXHJcbiAgICBjb25zb2xlLmxvZyhmZWVkYmFja1Jlc3VsdHMpXHJcblxyXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRMZXZlbHMoZmVlZGJhY2tSZXN1bHRzKTtcclxuICB9LFxyXG5cclxuICBidWlsZExldmVscyhmZWVkYmFja1Jlc3VsdHMpIHtcclxuXHJcbiAgICBjb25zdCBmZWVkYmFja0NvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcEFuZEZlZWRiYWNrQ29udGFpbmVyXCIpO1xyXG5cclxuICAgIC8vIHJlZm9ybWF0IGhlYXRtYXAgZ2VuZXJhdGlvbiB0aW1lIHRvIHJlbW92ZSBzZWNvbmRzXHJcbiAgICBjb25zdCB0aW1lUmVmb3JtYXQgPSBbZmVlZGJhY2tSZXN1bHRzLm5vdy5zcGxpdChcIjpcIilbMF0sIGZlZWRiYWNrUmVzdWx0cy5ub3cuc3BsaXQoXCI6XCIpWzFdXS5qb2luKFwiOlwiKSArIGZlZWRiYWNrUmVzdWx0cy5ub3cuc3BsaXQoXCI6XCIpWzJdLnNsaWNlKDIpO1xyXG4gICAgLy8gcmVmb3JtYXQgZGF0ZXMgd2l0aCBzbGFzaGVzIGFuZCBwdXQgeWVhciBhdCBlbmRcclxuICAgIGNvbnN0IGRhdGVSZWZvcm1hdDEgPSBbZmVlZGJhY2tSZXN1bHRzLmZpcnN0R2FtZS5zcGxpdChcIi1cIilbMV0sIGZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWUuc3BsaXQoXCItXCIpWzJdXS5qb2luKFwiL1wiKSArIFwiL1wiICsgZmVlZGJhY2tSZXN1bHRzLmZpcnN0R2FtZS5zcGxpdChcIi1cIilbMF07XHJcbiAgICBjb25zdCBkYXRlUmVmb3JtYXQyID0gW2ZlZWRiYWNrUmVzdWx0cy5sYXN0R2FtZS5zcGxpdChcIi1cIilbMV0sIGZlZWRiYWNrUmVzdWx0cy5sYXN0R2FtZS5zcGxpdChcIi1cIilbMl1dLmpvaW4oXCIvXCIpICsgXCIvXCIgKyBmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWUuc3BsaXQoXCItXCIpWzBdO1xyXG5cclxuICAgIC8vIGhlYXRtYXAgZ2VuZXJhdGlvbiBhbmQgcmFuZ2Ugb2YgZGF0ZXMgb24gZ2FtZXMgKG1heCBhbmQgbWluKVxyXG4gICAgY29uc3QgaXRlbTNfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZGF0ZVJlZm9ybWF0Mn1gKTtcclxuICAgIGNvbnN0IGl0ZW0zX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJMYXN0IGdhbWVcIik7XHJcbiAgICBjb25zdCBpdGVtM193cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtM19jaGlsZCwgaXRlbTNfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0zX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTJfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZGF0ZVJlZm9ybWF0MX1gKTtcclxuICAgIGNvbnN0IGl0ZW0yX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJGaXJzdCBnYW1lXCIpO1xyXG4gICAgY29uc3QgaXRlbTJfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTJfY2hpbGQsIGl0ZW0yX2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW0yID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMl93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke3RpbWVSZWZvcm1hdH1gKTtcclxuICAgIGNvbnN0IGl0ZW0xX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJIZWF0bWFwIGdlbmVyYXRlZFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xX2NoaWxkLCBpdGVtMV9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTFfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zMV9IZWF0bWFwRGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay0xXCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zIGhhcy1iYWNrZ3JvdW5kLXdoaXRlLXRlclwiIH0sIG51bGwsIGl0ZW0xLCBpdGVtMiwgaXRlbTMpXHJcblxyXG4gICAgLy8gcGxheWVyIGZlZWRiYWNrIGJhc2VkIG9uIGF2ZXJhZ2UgZmllbGQgeCx5IGNvb3JkaW5hdGUgb2YgcGxheWVyIHNob3RzXHJcbiAgICBjb25zdCBpdGVtNl9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY29tcGxlbWVudEJ9YCk7XHJcbiAgICBjb25zdCBpdGVtNl9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ29tcGxlbWVudGluZyBwbGF5ZXIgMlwiKTtcclxuICAgIGNvbnN0IGl0ZW02X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW02X2NoaWxkLCBpdGVtNl9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTZfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtNV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY29tcGxlbWVudEF9YCk7XHJcbiAgICBjb25zdCBpdGVtNV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ29tcGxlbWVudGluZyBwbGF5ZXIgMVwiKTtcclxuICAgIGNvbnN0IGl0ZW01X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW01X2NoaWxkLCBpdGVtNV9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtNSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTVfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtNF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuZmllbGRQb3NpdGlvbn1gKTtcclxuICAgIGNvbnN0IGl0ZW00X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJZb3VyIHBsYXlzdHlsZVwiKTtcclxuICAgIGNvbnN0IGl0ZW00X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW00X2NoaWxkLCBpdGVtNF9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtNCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTRfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zMl9wbGF5ZXJUeXBlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTJcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtNCwgaXRlbTUsIGl0ZW02KVxyXG5cclxuICAgIC8vIHNob3RzIG9uIHRlYW0vb3Bwb25lbnQgc2lkZXMgb2YgZmllbGQsIGRlZmVuc2l2ZSByZWRpcmVjdHMsIGFuZCBhZXJpYWwgc2hvdHMgLyAlXHJcbiAgICBjb25zdCBpdGVtOV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuZGVmZW5zaXZlUmVkaXJlY3R9YCk7XHJcbiAgICBjb25zdCBpdGVtOV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiUmVkaXJlY3RzIGZyb20gT3duIEdvYWxcIik7XHJcbiAgICBjb25zdCBpdGVtOV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtOV9jaGlsZCwgaXRlbTlfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW05ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtOV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW04X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy50ZWFtU2lkZUdvYWxzfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLm9wcG9uZW50U2lkZUdvYWxzfWApO1xyXG4gICAgY29uc3QgaXRlbThfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkdvYWxzIEJlaGluZCAmIEJleW9uZCBNaWRmaWVsZFwiKTtcclxuICAgIGNvbnN0IGl0ZW04X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW04X2NoaWxkLCBpdGVtOF9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTggPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW04X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTdfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmFlcmlhbH0gOiAke2ZlZWRiYWNrUmVzdWx0cy5hZXJpYWxQZXJjZW50YWdlfSVgKTtcclxuICAgIGNvbnN0IGl0ZW03X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJBZXJpYWwgR29hbCBUb3RhbCAmIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW03X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW03X2NoaWxkLCBpdGVtN19jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTcgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW03X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczNfc2hvdERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stM1wiLCBcImNsYXNzXCI6IFwiY29sdW1uc1wiIH0sIG51bGwsIGl0ZW03LCBpdGVtOCwgaXRlbTkpXHJcblxyXG4gICAgLy8gbWF4IGJhbGwgc3BlZWQsIGF2ZXJhZ2UgYmFsbCBzcGVlZCwgc2hvdHMgb3ZlciA3MCBtcGhcclxuICAgIGNvbnN0IGl0ZW0xMl9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuc2hvdHNPdmVyNzBtcGh9YCk7XHJcbiAgICBjb25zdCBpdGVtMTJfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlNob3RzIE92ZXIgNzAgbXBoXCIpO1xyXG4gICAgY29uc3QgaXRlbTEyX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xMl9jaGlsZCwgaXRlbTEyX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xMl93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xMV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuYXZnQmFsbFNwZWVkfSBtcGhgKTtcclxuICAgIGNvbnN0IGl0ZW0xMV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQXZlcmFnZSBCYWxsIFNwZWVkXCIpO1xyXG4gICAgY29uc3QgaXRlbTExX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xMV9jaGlsZCwgaXRlbTExX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xMV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xMF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMubWF4QmFsbFNwZWVkfSBtcGhgKTtcclxuICAgIGNvbnN0IGl0ZW0xMF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiTWF4IEJhbGwgU3BlZWRcIik7XHJcbiAgICBjb25zdCBpdGVtMTBfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTEwX2NoaWxkLCBpdGVtMTBfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xMCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTEwX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczRfYmFsbERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stNFwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTAsIGl0ZW0xMSwgaXRlbTEyKVxyXG5cclxuICAgIC8vIHRvdGFsIGdhbWVzIHBsYXllZCwgdG90YWwgc2hvdHMgc2NvcmVkLCB3aW5zL2xvc3Nlcy93aW4lXHJcbiAgICBjb25zdCBpdGVtMTVfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLndpbnN9IDogJHtmZWVkYmFja1Jlc3VsdHMubG9zc2VzfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLndpblBjdH0lYCk7XHJcbiAgICBjb25zdCBpdGVtMTVfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIldpbnMsIExvc3NlcywgJiBXaW4gUGN0XCIpO1xyXG4gICAgY29uc3QgaXRlbTE1X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xNV9jaGlsZCwgaXRlbTE1X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xNV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xNF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudG90YWxTaG90c31gKTtcclxuICAgIGNvbnN0IGl0ZW0xNF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiVG90YWwgR29hbHNcIik7XHJcbiAgICBjb25zdCBpdGVtMTRfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE0X2NoaWxkLCBpdGVtMTRfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE0X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTEzX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy50b3RhbEdhbWVzfWApO1xyXG4gICAgY29uc3QgaXRlbTEzX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJUb3RhbCBHYW1lc1wiKTtcclxuICAgIGNvbnN0IGl0ZW0xM193cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTNfY2hpbGQsIGl0ZW0xM19jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTEzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTNfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zNV92aWN0b3J5RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay01XCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zIGhhcy1iYWNrZ3JvdW5kLXdoaXRlLXRlclwiIH0sIG51bGwsIGl0ZW0xMywgaXRlbTE0LCBpdGVtMTUpXHJcblxyXG4gICAgLy8gM3YzLCAydjIsIGFuZCAxdjEgZ2FtZXMgcGxheWVkXHJcbiAgICBjb25zdCBpdGVtMThfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLl8xdjF9YCk7XHJcbiAgICBjb25zdCBpdGVtMThfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIjF2MSBHYW1lc1wiKTtcclxuICAgIGNvbnN0IGl0ZW0xOF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMThfY2hpbGQsIGl0ZW0xOF9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE4ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMThfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTdfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLl8ydjJ9YCk7XHJcbiAgICBjb25zdCBpdGVtMTdfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIjJ2MiBnYW1lc1wiKTtcclxuICAgIGNvbnN0IGl0ZW0xN193cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTdfY2hpbGQsIGl0ZW0xN19jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE3ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTdfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTZfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLl8zdjN9YCk7XHJcbiAgICBjb25zdCBpdGVtMTZfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIjN2MyBHYW1lc1wiKTtcclxuICAgIGNvbnN0IGl0ZW0xNl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTZfY2hpbGQsIGl0ZW0xNl9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTZfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zNl9nYW1lVHlwZURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stNlwiLCBcImNsYXNzXCI6IFwiY29sdW1uc1wiIH0sIG51bGwsIGl0ZW0xNiwgaXRlbTE3LCBpdGVtMTgpXHJcblxyXG4gICAgLy8gY29tcCBnYW1lcyAvIHdpbiAlLCBjYXN1YWwgZ2FtZXMgLyB3aW4gJSwgZ2FtZXMgaW4gT1RcclxuICAgIGNvbnN0IGl0ZW0yMV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMub3ZlcnRpbWVHYW1lc31gKTtcclxuICAgIGNvbnN0IGl0ZW0yMV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiT3ZlcnRpbWUgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMjFfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTIxX2NoaWxkLCBpdGVtMjFfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0yMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTIxX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTIwX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5jb21wZXRpdGl2ZUdhbWVzfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBXaW5QY3R9JWApO1xyXG4gICAgY29uc3QgaXRlbTIwX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJDb21wZXRpdGl2ZSBHYW1lcyAmIFdpbiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtMjBfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTIwX2NoaWxkLCBpdGVtMjBfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0yMCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTIwX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE5X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5jYXN1YWxHYW1lc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5jYXN1YWxXaW5QY3R9JWApO1xyXG4gICAgY29uc3QgaXRlbTE5X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJDYXN1YWwgR2FtZXMgJiBXaW4gUGN0XCIpO1xyXG4gICAgY29uc3QgaXRlbTE5X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xOV9jaGlsZCwgaXRlbTE5X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTkgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xOV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM3X292ZXJ0aW1lRGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay03XCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zIGhhcy1iYWNrZ3JvdW5kLXdoaXRlLXRlclwiIH0sIG51bGwsIGl0ZW0xOSwgaXRlbTIwLCBpdGVtMjEpXHJcblxyXG4gICAgLy8gcmVwbGFjZSBvbGQgY29udGVudCBpZiBpdCdzIGFscmVhZHkgb24gdGhlIHBhZ2VcclxuICAgIGNvbnN0IGZlZWRiYWNrMSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stMVwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrMiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stMlwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrMyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stM1wiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stNFwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stNVwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stNlwiKTtcclxuICAgIGNvbnN0IGZlZWRiYWNrNyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmVlZGJhY2stN1wiKTtcclxuXHJcbiAgICBpZiAoZmVlZGJhY2sxICE9PSBudWxsKSB7XHJcbiAgICAgIGZlZWRiYWNrMS5yZXBsYWNlV2l0aChjb2x1bW5zMV9IZWF0bWFwRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrMi5yZXBsYWNlV2l0aChjb2x1bW5zMl9wbGF5ZXJUeXBlKTtcclxuICAgICAgZmVlZGJhY2szLnJlcGxhY2VXaXRoKGNvbHVtbnMzX3Nob3REZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2s0LnJlcGxhY2VXaXRoKGNvbHVtbnM0X2JhbGxEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2s1LnJlcGxhY2VXaXRoKGNvbHVtbnM1X3ZpY3RvcnlEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2s2LnJlcGxhY2VXaXRoKGNvbHVtbnM2X2dhbWVUeXBlRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNy5yZXBsYWNlV2l0aChjb2x1bW5zN19vdmVydGltZURldGFpbHMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczFfSGVhdG1hcERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zMl9wbGF5ZXJUeXBlKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczRfYmFsbERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zM19zaG90RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM1X3ZpY3RvcnlEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczZfZ2FtZVR5cGVEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczdfb3ZlcnRpbWVEZXRhaWxzKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZmVlZGJhY2tcclxuXHJcblxyXG4vKlxyXG4tIEhlYXRtYXAgZ2VuZXJhdGVkIG9uXHJcbi0gc3RhcnQgZGF0ZVxyXG4tIGVuZCBkYXRlXHJcbi0tLS0tLS0tLS0tLS1cclxuLSByZWxldmFudCBzb2NjZXIgcG9zaXRpb24gYmFzZWQgb24gYXZnIHNjb3JlIHBvc2l0aW9uXHJcbi0gcGFpcmVkIGJlc3Qgd2l0aCAxXHJcbi0gcGFpcmVkIGJlc3Qgd2l0aCAyXHJcbi0tLS0tLS0tLS0tLS0tXHJcbi0gc2hvdHMgc2NvcmVkIGxlZnQgLyByaWdodCBvZiBtaWRmaWVsZFxyXG4tIHNob3RzIHNjb3JlZCBhcyByZWRpcmVjdHMgYmVzaWRlIG93biBnb2FsIChEZWZlbnNpdmUgcmVkaXJlY3RzKVxyXG4tIGFlcmlhbCBjb3VudCAmIHNob3QgJVxyXG4tLS0tLS0tLS0tLS0tLVxyXG4tIG1heCBiYWxsIHNwZWVkXHJcbi0gYXZnIGJhbGwgc3BlZWRcclxuLSBzaG90cyBvdmVyIDcwbXBoICh+IDExMCBrcGgpXHJcbi0tLS0tLS0tLS0tLS0tXHJcbi0gM3YzIGdhbWVzIHBsYXllZFxyXG4tIDJ2MiBnYW1lcyBwbGF5ZWRcclxuLSAxdjEgZ2FtZXMgcGxheWVkXHJcbi0tLS0tLS0tLS0tLS1cclxuLSB0b3RhbCBnYW1lcyBwbGF5ZWRcclxuLSB0b3RhbCBzaG90cyBzY29yZWRcclxuLSB3aW4gLyBsb3NzIC8gd2luJVxyXG4tLS0tLS0tLS0tLS0tXHJcbi0gY29tcCBnYW1lcyAvIHdpbiAlXHJcbi0gY2FzdWFsIGdhbWVzIC8gd2luICVcclxuLSBnYW1lcyBpbiBPVFxyXG4tLS0tLS0tLS0tLS0tXHJcblxyXG4qLyIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIjtcclxuaW1wb3J0IGhlYXRtYXBEYXRhIGZyb20gXCIuL2hlYXRtYXBEYXRhXCI7XHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcbmltcG9ydCBkYXRlRmlsdGVyIGZyb20gXCIuL2RhdGVGaWx0ZXJcIjtcclxuaW1wb3J0IGZlZWRiYWNrIGZyb20gXCIuL2hlYXRtYXBGZWVkYmFja1wiO1xyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGhlYXRtYXBzID0ge1xyXG5cclxuICBsb2FkSGVhdG1hcENvbnRhaW5lcnMoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB0aGlzLmJ1aWxkRmlsdGVycygpO1xyXG4gICAgLy8gYnVpbGRzIGJ1dHRvbiB0byBnZW5lcmF0ZSBoZWF0bWFwLCBzYXZlIGhlYXRtYXAsIGFuZCB2aWV3IHNhdmVkIGhlYXRtYXBzXHJcbiAgICAvLyB0aGUgYWN0aW9uIGlzIGFzeW5jIGJlY2F1c2UgdGhlIHVzZXIncyBzYXZlZCBoZWF0bWFwcyBoYXZlIHRvIGJlIHJlbmRlcmVkIGFzIEhUTUwgb3B0aW9uIGVsZW1lbnRzXHJcbiAgICB0aGlzLmJ1aWxkR2VuZXJhdG9yKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWx0ZXJzKCkge1xyXG5cclxuICAgIC8vIHJlc2V0IGJ1dHRvblxyXG4gICAgY29uc3QgcmVzZXRCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwicmVzZXRGaWx0ZXJzQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJSZXNldCBGaWx0ZXJzXCIpO1xyXG5cclxuICAgIC8vIGRhdGUgcmFuZ2UgYnV0dG9uXHJcbiAgICBjb25zdCBkYXRlQnRuVGV4dCA9IGVsQnVpbGRlcihcInNwYW5cIiwge30sIFwiRGF0ZXNcIik7XHJcbiAgICBjb25zdCBkYXRlQnRuSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFyIGZhLWNhbGVuZGFyXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBkYXRlQnRuSWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGxcIiB9LCBudWxsLCBkYXRlQnRuSWNvbik7XHJcbiAgICBjb25zdCBkYXRlQnRuID0gZWxCdWlsZGVyKFwiYVwiLCB7XCJpZFwiOlwiZGF0ZVJhbmdlQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtb3V0bGluZWQgaXMtZGFya1wiIH0sIG51bGwsIGRhdGVCdG5JY29uU3BhbiwgZGF0ZUJ0blRleHQpO1xyXG4gICAgY29uc3QgZGF0ZUJ0blBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZGF0ZUJ0bik7XHJcblxyXG4gICAgLy8gYmFsbCBzcGVlZCBidXR0b25cclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0blRleHQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHt9LCBcIkJhbGwgU3BlZWRcIik7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5JY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtYm9sdFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuSWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGxcIiB9LCBudWxsLCBiYWxsU3BlZWRCdG5JY29uKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0biA9IGVsQnVpbGRlcihcImFcIiwgeyBcImlkXCI6IFwiYmFsbFNwZWVkQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtb3V0bGluZWQgaXMtZGFya1wiIH0sIG51bGwsIGJhbGxTcGVlZEJ0bkljb25TcGFuLCBiYWxsU3BlZWRCdG5UZXh0KTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0blBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgYmFsbFNwZWVkQnRuKTtcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgY29uc3QgaWNvbjYgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1jbG9ja1wiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW42ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNik7XHJcbiAgICBjb25zdCBzZWw2X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IHNlbDZfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9UXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gT1RcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q2ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1vdmVydGltZVwiIH0sIG51bGwsIHNlbDZfb3AxLCBzZWw2X29wMiwgc2VsNl9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDYsIGljb25TcGFuNik7XHJcbiAgICBjb25zdCBjb250cm9sNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Nik7XHJcblxyXG4gICAgLy8gcmVzdWx0XHJcbiAgICBjb25zdCBpY29uNSA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXRyb3BoeVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW41ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNSk7XHJcbiAgICBjb25zdCBzZWw1X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJSZXN1bHRcIik7XHJcbiAgICBjb25zdCBzZWw1X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJWaWN0b3J5XCIpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiRGVmZWF0XCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItZ2FtZVJlc3VsdFwiIH0sIG51bGwsIHNlbDVfb3AxLCBzZWw1X29wMiwgc2VsNV9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDUsIGljb25TcGFuNSk7XHJcbiAgICBjb25zdCBjb250cm9sNSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2NSk7XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlXHJcbiAgICBjb25zdCBpY29uNCA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXNpdGVtYXBcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNCA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjQpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiR2FtZSBUeXBlXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiM3YzXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiMnYyXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDQgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiMXYxXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItZ2FtZVR5cGVcIiB9LCBudWxsLCBzZWw0X29wMSwgc2VsNF9vcDIsIHNlbDRfb3AzLCBzZWw0X29wNCk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NCwgaWNvblNwYW40KTtcclxuICAgIGNvbnN0IGNvbnRyb2w0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY0KTtcclxuXHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGNvbnN0IGljb24zID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZ2FtZXBhZFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uMyk7XHJcbiAgICBjb25zdCBzZWwzX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJHYW1lIE1vZGVcIik7XHJcbiAgICBjb25zdCBzZWwzX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDb21wZXRpdGl2ZVwiKTtcclxuICAgIGNvbnN0IHNlbDNfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNhc3VhbFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDMgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLWdhbWVNb2RlXCIgfSwgbnVsbCwgc2VsM19vcDEsIHNlbDNfb3AyLCBzZWwzX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MywgaWNvblNwYW4zKTtcclxuICAgIGNvbnN0IGNvbnRyb2wzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYzKTtcclxuXHJcbiAgICAvLyBwYXJ0eVxyXG4gICAgY29uc3QgaWNvbjIgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1oYW5kc2hha2VcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjIpO1xyXG4gICAgY29uc3Qgc2VsMl9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiVGVhbVwiKTtcclxuICAgIGNvbnN0IHNlbDJfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIHBhcnR5XCIpO1xyXG4gICAgY29uc3Qgc2VsMl9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUGFydHlcIik7XHJcbiAgICBjb25zdCBzZWxlY3QyID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci10ZWFtU3RhdHVzXCIgfSwgbnVsbCwgc2VsMl9vcDEsIHNlbDJfb3AyLCBzZWwyX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MiwgaWNvblNwYW4yKTtcclxuICAgIGNvbnN0IGNvbnRyb2wyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYyKTtcclxuXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGNvbnN0IGljb24xID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZnV0Ym9sXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24xKTtcclxuICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlNob3QgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItc2hvdFR5cGVcIiB9LCBudWxsLCBzZWwxX29wMSwgc2VsMV9vcDIsIHNlbDFfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QxLCBpY29uU3BhbjEpO1xyXG4gICAgY29uc3QgY29udHJvbDEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjEpO1xyXG5cclxuICAgIGNvbnN0IGZpbHRlckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpbHRlckZpZWxkXCIsIFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBjb250cm9sMSwgY29udHJvbDIsIGNvbnRyb2wzLCBjb250cm9sNCwgY29udHJvbDUsIGNvbnRyb2w2LCBiYWxsU3BlZWRCdG5QYXJlbnQsIGRhdGVCdG5QYXJlbnQsIHJlc2V0QnRuKTtcclxuICAgIGNvbnN0IFBhcmVudEZpbHRlckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZmlsdGVyRmllbGQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCBmaWx0ZXIgY29udGFpbmVyIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50RmlsdGVyQ29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdlbmVyYXRvcigpIHtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcblxyXG4gICAgLy8gdXNlIGZldGNoIHRvIGFwcGVuZCBvcHRpb25zIHRvIHNlbGVjdCBlbGVtZW50IGlmIHVzZXIgYXQgbGVhc3QgMSBzYXZlZCBoZWF0bWFwXHJcbiAgICBBUEkuZ2V0QWxsKGBoZWF0bWFwcz91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQXJyYXkgb2YgdXNlcidzIHNhdmVkIGhlYXRtYXBzOlwiLCBoZWF0bWFwcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1maXJlXCIgfSwgbnVsbCk7XHJcbiAgICAgICAgY29uc3QgaWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24pO1xyXG4gICAgICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJhc2ljIEhlYXRtYXBcIik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImhlYXRtYXBEcm9wZG93blwiIH0sIG51bGwsIHNlbDFfb3AxKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwU2VsZWN0RGl2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgaGVhdG1hcERyb3Bkb3duLCBpY29uU3Bhbik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIGhlYXRtYXBTZWxlY3REaXYpO1xyXG5cclxuICAgICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImRlbGV0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkRlbGV0ZSBIZWF0bWFwXCIpXHJcbiAgICAgICAgY29uc3QgZGVsZXRlQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZGVsZXRlSGVhdG1hcEJ0bilcclxuICAgICAgICBjb25zdCBzYXZlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBIZWF0bWFwXCIpXHJcbiAgICAgICAgY29uc3Qgc2F2ZUJ0bkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIHNhdmVCdG4pXHJcbiAgICAgICAgY29uc3Qgc2F2ZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwic2F2ZUhlYXRtYXBJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiTmFtZSBhbmQgc2F2ZSB0aGlzIGhlYXRtYXBcIiwgXCJtYXhsZW5ndGhcIjogXCIyNVwiIH0sIG51bGwpXHJcbiAgICAgICAgY29uc3Qgc2F2ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBpcy1leHBhbmRlZFwiIH0sIG51bGwsIHNhdmVJbnB1dClcclxuXHJcbiAgICAgICAgY29uc3QgZ2VuZXJhdG9yQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImdlbmVyYXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkdlbmVyYXRlIEhlYXRtYXBcIik7XHJcbiAgICAgICAgY29uc3QgZ2VuZXJhdG9yQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2VuZXJhdG9yQnV0dG9uKTtcclxuXHJcbiAgICAgICAgLy8gaWYgbm8gaGVhdG1hcHMgYXJlIHNhdmVkLCBnZW5lcmF0ZSBubyBleHRyYSBvcHRpb25zIGluIGRyb3Bkb3duXHJcbiAgICAgICAgaWYgKGhlYXRtYXBzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgY29uc3QgZ2VuZXJhdG9yRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgaGVhdG1hcENvbnRyb2wsIGdlbmVyYXRvckNvbnRyb2wsIHNhdmVDb250cm9sLCBzYXZlQnRuQ29udHJvbCwgZGVsZXRlQnRuQ29udHJvbCk7XHJcbiAgICAgICAgICBjb25zdCBQYXJlbnRHZW5lcmF0b3JDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGdlbmVyYXRvckZpZWxkKTtcclxuICAgICAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBlbHNlLCBmb3IgZWFjaCBoZWF0bWFwIHNhdmVkLCBtYWtlIGEgbmV3IG9wdGlvbiBhbmQgYXBwZW5kIGl0IHRvIHRoZVxyXG4gICAgICAgICAgaGVhdG1hcHMuZm9yRWFjaChoZWF0bWFwID0+IHtcclxuICAgICAgICAgICAgaGVhdG1hcERyb3Bkb3duLmFwcGVuZENoaWxkKGVsQnVpbGRlcihcIm9wdGlvblwiLCB7IFwiaWRcIjogYGhlYXRtYXAtJHtoZWF0bWFwLmlkfWAgfSwgYCR7aGVhdG1hcC50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdfTogJHtoZWF0bWFwLm5hbWV9YCkpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIGNvbnN0IGdlbmVyYXRvckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGhlYXRtYXBDb250cm9sLCBnZW5lcmF0b3JDb250cm9sLCBzYXZlQ29udHJvbCwgc2F2ZUJ0bkNvbnRyb2wsIGRlbGV0ZUJ0bkNvbnRyb2wpO1xyXG4gICAgICAgICAgY29uc3QgUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBnZW5lcmF0b3JGaWVsZCk7XHJcbiAgICAgICAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEdlbmVyYXRvckNvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnVpbGRGaWVsZGFuZEdvYWwoKTtcclxuICAgICAgICBkYXRlRmlsdGVyLmJ1aWxkRGF0ZUZpbHRlcigpO1xyXG4gICAgICAgIHRoaXMuaGVhdG1hcEV2ZW50TWFuYWdlcigpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWVsZGFuZEdvYWwoKSB7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGhlYXRtYXBJbWFnZUNvbnRhaW5lcnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnbkZpZWxkLCBhbGlnbkdvYWwpO1xyXG5cclxuICAgIC8vIHBhcmVudCBjb250YWluZXIgaG9sZGluZyBhbGwgc2hvdCBpbmZvcm1hdGlvblxyXG4gICAgY29uc3QgcGFyZW50U2hvdENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7XCJpZFwiOlwiaGVhdG1hcEFuZEZlZWRiYWNrQ29udGFpbmVyXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgaGVhdG1hcEltYWdlQ29udGFpbmVycylcclxuXHJcbiAgICAvLyBhcHBlbmQgZmllbGQgYW5kIGdvYWwgdG8gcGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRTaG90Q29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBoZWF0bWFwRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gcHJpbWFyeSBidXR0b25zIG9uIGhlYXRtYXAgcGFnZVxyXG4gICAgY29uc3QgZ2VuZXJhdGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnZW5lcmF0ZUhlYXRtYXBCdG5cIik7XHJcbiAgICBjb25zdCBzYXZlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBCdG5cIik7XHJcbiAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgY29uc3QgcmVzZXRGaWx0ZXJzQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXNldEZpbHRlcnNCdG5cIik7XHJcblxyXG4gICAgZ2VuZXJhdGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5nZXRVc2VyU2hvdHMpO1xyXG4gICAgc2F2ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwKTtcclxuICAgIGRlbGV0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXApO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lciB0byBoZWF0bWFwIHBhcmVudCB0aGF0IGhpZ2hsaWdodHMgZmlsdGVyIGJ1dHRvbnMgcmVkIHdoZW4gY2hhbmdlZFxyXG4gICAgLy8gaGVhdG1hcCBidXR0b25zIHJldHVybiB0byBkZWZhdWx0IGNvbG9yIGlmIHRoZSBkZWZhdWx0IG9wdGlvbiBpcyBzZWxlY3RlZFxyXG4gICAgY29uc3QgZmlsdGVyRmllbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlckZpZWxkXCIpO1xyXG4gICAgZmlsdGVyRmllbGQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZSkgPT4ge1xyXG4gICAgICBlLnRhcmdldC5wYXJlbnROb2RlLmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgIGlmIChlLnRhcmdldC52YWx1ZSA9PT0gZS50YXJnZXQuY2hpbGROb2Rlc1swXS50ZXh0Q29udGVudCkge1xyXG4gICAgICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gcmVzZXQgZmlsdGVyIGJ1dHRvblxyXG4gICAgY29uc3QgZ2FtZU1vZGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lTW9kZVwiKTtcclxuICAgIGNvbnN0IHNob3RUeXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItc2hvdFR5cGVcIik7XHJcbiAgICBjb25zdCBnYW1lUmVzdWx0RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVJlc3VsdFwiKTtcclxuICAgIGNvbnN0IGdhbWV0eXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVR5cGVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLW92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3QgdGVhbVN0YXR1c0ZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLXRlYW1TdGF0dXNcIik7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkQnRuXCIpO1xyXG5cclxuICAgIHJlc2V0RmlsdGVyc0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICBnYW1lTW9kZUZpbHRlci52YWx1ZSA9IFwiR2FtZSBNb2RlXCI7XHJcbiAgICAgIGdhbWVNb2RlRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIHNob3RUeXBlRmlsdGVyLnZhbHVlID0gXCJTaG90IFR5cGVcIjtcclxuICAgICAgc2hvdFR5cGVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgZ2FtZVJlc3VsdEZpbHRlci52YWx1ZSA9IFwiUmVzdWx0XCI7XHJcbiAgICAgIGdhbWVSZXN1bHRGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgZ2FtZXR5cGVGaWx0ZXIudmFsdWUgPSBcIkdhbWUgVHlwZVwiO1xyXG4gICAgICBnYW1ldHlwZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBvdmVydGltZUZpbHRlci52YWx1ZSA9IFwiT3ZlcnRpbWVcIjtcclxuICAgICAgb3ZlcnRpbWVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgdGVhbVN0YXR1c0ZpbHRlci52YWx1ZSA9IFwiVGVhbVwiO1xyXG4gICAgICB0ZWFtU3RhdHVzRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIC8vIHJlc2V0IGJhbGwgc3BlZWQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICBoZWF0bWFwRGF0YS5oYW5kbGVCYWxsU3BlZWRHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC5hZGQoXCJpcy1vdXRsaW5lZFwiKTtcclxuXHJcbiAgICAgIC8vIHJlc2V0IGRhdGUgZmlsdGVyIGFuZCBhc3NvY2lhdGVkIGdsb2JhbCB2YXJpYWJsZXNcclxuICAgICAgZGF0ZUZpbHRlci5jbGVhckRhdGVGaWx0ZXIoKTtcclxuXHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIGJhbGwgc3BlZWQgYnV0dG9uXHJcbiAgICBiYWxsU3BlZWRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmJhbGxTcGVlZE1heCk7XHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGRhdGVSYW5nZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5vcGVuRGF0ZUZpbHRlcik7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGVhdG1hcHMiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5pbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbG9naW5PclNpZ251cCA9IHtcclxuXHJcbiAgLy8gYnVpbGQgYSBsb2dpbiBmb3JtIHRoYXQgdmFsaWRhdGVzIHVzZXIgaW5wdXQuIFN1Y2Nlc3NmdWwgbG9naW4gc3RvcmVzIHVzZXIgaWQgaW4gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgbG9naW5Gb3JtKCkge1xyXG4gICAgY29uc3QgbG9naW5JbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwicGFzc3dvcmRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJsb2dpbk5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luIG5vd1wiKTtcclxuICAgIGNvbnN0IGxvZ2luRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwibG9naW5Gb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBsb2dpbklucHV0X3VzZXJuYW1lLCBsb2dpbklucHV0X3Bhc3N3b3JkLCBsb2dpbkJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChsb2dpbkZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cEZvcm0oKSB7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9uYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9jb25maXJtID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiY29uZmlybVBhc3N3b3JkXCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJjb25maXJtIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2lnbnVwTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cCBub3dcIik7XHJcbiAgICBjb25zdCBzaWdudXBGb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJzaWdudXBGb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9uYW1lLCBzaWdudXBJbnB1dF91c2VybmFtZSwgc2lnbnVwSW5wdXRfcGFzc3dvcmQsIHNpZ251cElucHV0X2NvbmZpcm0sIHNpZ251cEJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChzaWdudXBGb3JtKVxyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKClcclxuICB9LFxyXG5cclxuICAvLyBhc3NpZ24gZXZlbnQgbGlzdGVuZXJzIGJhc2VkIG9uIHdoaWNoIGZvcm0gaXMgb24gdGhlIHdlYnBhZ2VcclxuICB1c2VyRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgY29uc3QgbG9naW5Ob3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZ2luTm93XCIpXHJcbiAgICBjb25zdCBzaWdudXBOb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpZ251cE5vd1wiKVxyXG4gICAgaWYgKGxvZ2luTm93ID09PSBudWxsKSB7XHJcbiAgICAgIHNpZ251cE5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBVc2VyLCBldmVudClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxvZ2luTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luVXNlciwgZXZlbnQpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gdmFsaWRhdGUgdXNlciBsb2dpbiBmb3JtIGlucHV0cyBiZWZvcmUgbG9nZ2luZyBpblxyXG4gIGxvZ2luVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKHVzZXIgPT4ge1xyXG4gICAgICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFuZCBwYXNzd29yZFxyXG4gICAgICAgIGlmICh1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIGlmICh1c2VyLnBhc3N3b3JkID09PSBwYXNzd29yZCkge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cFVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc29sZS5sb2coZSlcclxuICAgIGNvbnN0IF9uYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF91c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3Bhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBjb25maXJtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maXJtUGFzc3dvcmRcIikudmFsdWVcclxuICAgIGxldCB1bmlxdWVVc2VybmFtZSA9IHRydWU7IC8vY2hhbmdlcyB0byBmYWxzZSBpZiB1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1xyXG4gICAgaWYgKF9uYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfdXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoY29uZmlybSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkICE9PSBjb25maXJtKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChcInVzZXJzXCIpLnRoZW4odXNlcnMgPT4gdXNlcnMuZm9yRWFjaCgodXNlciwgaWR4KSA9PiB7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIGV4aXN0aW5nIHVzZXJuYW1lIGluIGRhdGFiYXNlXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gX3VzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIHVuaXF1ZVVzZXJuYW1lID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vYXQgdGhlIGVuZCBvZiB0aGUgbG9vcCwgcG9zdFxyXG4gICAgICAgIGlmIChpZHggPT09IHVzZXJzLmxlbmd0aCAtIDEgJiYgdW5pcXVlVXNlcm5hbWUpIHtcclxuICAgICAgICAgIGxldCBuZXdVc2VyID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBfbmFtZSxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IF91c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IF9wYXNzd29yZCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBBUEkucG9zdEl0ZW0oXCJ1c2Vyc1wiLCBuZXdVc2VyKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9naW5TdGF0dXNBY3RpdmUodXNlcikge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiLCB1c2VyLmlkKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKTsgLy9idWlsZCBsb2dnZWQgaW4gdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9LFxyXG5cclxuICBsb2dvdXRVc2VyKCkge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcihmYWxzZSk7IC8vYnVpbGQgbG9nZ2VkIG91dCB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvZ2luT3JTaWdudXAiLCJpbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcbi8vIGltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiO1xyXG5cclxuLy8gZnVuY3Rpb24gY2xvc2VCb3goZSkge1xyXG4vLyAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJkZWxldGVcIikpIHtcclxuLy8gICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuLy8gbmF2YmFyLmdlbmVyYXRlTmF2YmFyKClcclxubmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpXHJcbmhlYXRtYXBzLmxvYWRIZWF0bWFwQ29udGFpbmVycygpOyIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgbG9naW5PclNpZ251cCBmcm9tIFwiLi9sb2dpblwiXHJcbmltcG9ydCBwcm9maWxlIGZyb20gXCIuL3Byb2ZpbGVcIlxyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIlxyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIlxyXG5pbXBvcnQgaGVhdG1hcHMgZnJvbSBcIi4vaGVhdG1hcHNcIlxyXG5pbXBvcnQgaGVhdG1hcERhdGEgZnJvbSBcIi4vaGVhdG1hcERhdGFcIlxyXG5cclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IG5hdmJhciA9IHtcclxuXHJcbiAgZ2VuZXJhdGVOYXZiYXIobG9nZ2VkSW5Cb29sZWFuKSB7XHJcblxyXG4gICAgLy8gbmF2YmFyLW1lbnUgKHJpZ2h0IHNpZGUgb2YgbmF2YmFyIC0gYXBwZWFycyBvbiBkZXNrdG9wIDEwMjRweCspXHJcbiAgICBjb25zdCBidXR0b24yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW5cIilcclxuICAgIGNvbnN0IGJ1dHRvbjEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwXCIpXHJcbiAgICBjb25zdCBidXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGJ1dHRvbjEsIGJ1dHRvbjIpXHJcbiAgICBjb25zdCBtZW51SXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBudWxsLCBidXR0b25Db250YWluZXIpXHJcbiAgICBjb25zdCBuYXZiYXJFbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWVuZFwiIH0sIG51bGwsIG1lbnVJdGVtMSlcclxuICAgIGNvbnN0IG5hdmJhclN0YXJ0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1zdGFydFwiIH0pXHJcbiAgICBjb25zdCBuYXZiYXJNZW51ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIm5hdmJhck1lbnVcIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1tZW51XCIgfSwgbnVsbCwgbmF2YmFyU3RhcnQsIG5hdmJhckVuZClcclxuXHJcbiAgICAvLyBuYXZiYXItYnJhbmQgKGxlZnQgc2lkZSBvZiBuYXZiYXIgLSBpbmNsdWRlcyBtb2JpbGUgaGFtYnVyZ2VyIG1lbnUpXHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcInJvbGVcIjogXCJidXR0b25cIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1idXJnZXIgYnVyZ2VyXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1lbnVcIiwgXCJhcmlhLWV4cGFuZGVkXCI6IFwiZmFsc2VcIiwgXCJkYXRhLXRhcmdldFwiOiBcIm5hdmJhck1lbnVcIiB9LCBudWxsLCBidXJnZXJNZW51U3BhbjEsIGJ1cmdlck1lbnVTcGFuMiwgYnVyZ2VyTWVudVNwYW4zKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQxID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiLCBcImhyZWZcIjogXCIjXCIgfSwgbnVsbCwgZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvZmlyZTkwZGVnLnBuZ1wiLCBcIndpZHRoXCI6IFwiMTEyXCIsIFwiaGVpZ2h0XCI6IFwiMjhcIiB9KSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItYnJhbmRcIiB9LCBudWxsLCBuYXZiYXJCcmFuZENoaWxkMSwgbmF2YmFyQnJhbmRDaGlsZDIpO1xyXG5cclxuICAgIC8vIG5hdiAocGFyZW50IG5hdiBIVE1MIGVsZW1lbnQpXHJcbiAgICBjb25zdCBuYXYgPSBlbEJ1aWxkZXIoXCJuYXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyXCIsIFwicm9sZVwiOiBcIm5hdmlnYXRpb25cIiwgXCJhcmlhLWxhYmVsXCI6IFwibWFpbiBuYXZpZ2F0aW9uXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmQsIG5hdmJhck1lbnUpO1xyXG5cclxuICAgIC8vIGlmIGxvZ2dlZCBpbiwgYXBwZW5kIGFkZGl0aW9uYWwgbWVudSBvcHRpb25zIHRvIG5hdmJhciBhbmQgcmVtb3ZlIHNpZ251cC9sb2dpbiBidXR0b25zXHJcbiAgICBpZiAobG9nZ2VkSW5Cb29sZWFuKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBsb2cgaW4gYW5kIHNpZ24gdXAgYnV0dG9uc1xyXG4gICAgICBjb25zdCBzaWdudXAgPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1swXTtcclxuICAgICAgY29uc3QgbG9naW4gPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1sxXTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKHNpZ251cCk7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChsb2dpbik7XHJcbiAgICAgIC8vIGFkZCBsb2dvdXQgYnV0dG9uXHJcbiAgICAgIGNvbnN0IGJ1dHRvbjMgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dvdXRcIik7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChidXR0b24zKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhbmQgYXBwZW5kIG5ldyBtZW51IGl0ZW1zIGZvciB1c2VyXHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJQcm9maWxlXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiR2FtZXBsYXlcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTMgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJIZWF0bWFwc1wiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtNCA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkxlYWRlcmJvYXJkXCIpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0xKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTMpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW00KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgZXZlbnQgbGlzdGVuZXJzIHRvIG5hdmJhclxyXG4gICAgdGhpcy5uYXZiYXJFdmVudE1hbmFnZXIobmF2KTtcclxuXHJcbiAgICAvLyBhcHBlbmQgdG8gd2VicGFnZVxyXG4gICAgd2VicGFnZU5hdi5hcHBlbmRDaGlsZChuYXYpO1xyXG5cclxuICB9LFxyXG5cclxuICBuYXZiYXJFdmVudE1hbmFnZXIobmF2KSB7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9naW5DbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2lnbnVwQ2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ291dENsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wcm9maWxlQ2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmdhbWVwbGF5Q2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhlYXRtYXBzQ2xpY2tlZCwgZXZlbnQpO1xyXG4gIH0sXHJcblxyXG4gIGxvZ2luQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9naW5cIikge1xyXG4gICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luRm9ybSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cENsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIlNpZ24gdXBcIikge1xyXG4gICAgICBsb2dpbk9yU2lnbnVwLnNpZ251cEZvcm0oKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsb2dvdXRDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dvdXRcIikge1xyXG4gICAgICBsb2dpbk9yU2lnbnVwLmxvZ291dFVzZXIoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBwcm9maWxlQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiUHJvZmlsZVwiKSB7XHJcbiAgICAgIHByb2ZpbGUubG9hZFByb2ZpbGUoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBnYW1lcGxheUNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkdhbWVwbGF5XCIpIHtcclxuICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGhlYXRtYXBzQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiSGVhdG1hcHNcIikge1xyXG4gICAgICBoZWF0bWFwcy5sb2FkSGVhdG1hcENvbnRhaW5lcnMoKTtcclxuICAgICAgaGVhdG1hcERhdGEuaGFuZGxlQmFsbFNwZWVkR2xvYmFsVmFyaWFibGVzKCk7XHJcbiAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuYXZiYXJcclxuXHJcbi8qXHJcbiAgQnVsbWEgbmF2YmFyIHN0cnVjdHVyZTpcclxuICA8bmF2PlxyXG4gICAgPG5hdmJhci1icmFuZD5cclxuICAgICAgPG5hdmJhci1idXJnZXI+IChvcHRpb25hbClcclxuICAgIDwvbmF2YmFyLWJyYW5kPlxyXG4gICAgPG5hdmJhci1tZW51PlxyXG4gICAgICA8bmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8L25hdmJhci1zdGFydD5cclxuICAgICAgPG5hdmJhci1lbmQ+XHJcbiAgICAgIDwvbmF2YmFyLWVuZD5cclxuICAgIDwvbmF2YmFyLW1lbnU+XHJcbiAgPC9uYXY+XHJcbiovIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBwcm9maWxlID0ge1xyXG5cclxuICBsb2FkUHJvZmlsZSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGFjdGl2ZVVzZXJJZCkudGhlbih1c2VyID0+IHtcclxuICAgICAgY29uc3QgcHJvZmlsZVBpYyA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL29jdGFuZS5qcGdcIiwgXCJjbGFzc1wiOiBcIlwiIH0pXHJcbiAgICAgIGNvbnN0IG5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYE5hbWU6ICR7dXNlci5uYW1lfWApXHJcbiAgICAgIGNvbnN0IHVzZXJuYW1lID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvblwiIH0sIGBVc2VybmFtZTogJHt1c2VyLnVzZXJuYW1lfWApXHJcbiAgICAgIGNvbnN0IHBsYXllclByb2ZpbGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwicGxheWVyUHJvZmlsZVwiLCBcImNsYXNzXCI6IFwiY29udGFpbmVyXCIgfSwgbnVsbCwgcHJvZmlsZVBpYywgbmFtZSwgdXNlcm5hbWUpXHJcbiAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGxheWVyUHJvZmlsZSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJvZmlsZSIsImNsYXNzIHNob3RPbkdvYWwge1xyXG4gIHNldCBmaWVsZFgoZmllbGRYKSB7XHJcbiAgICB0aGlzLl9maWVsZFggPSBmaWVsZFhcclxuICB9XHJcbiAgc2V0IGZpZWxkWShmaWVsZFkpIHtcclxuICAgIHRoaXMuX2ZpZWxkWSA9IGZpZWxkWVxyXG4gIH1cclxuICBzZXQgZ29hbFgoZ29hbFgpIHtcclxuICAgIHRoaXMuX2dvYWxYID0gZ29hbFhcclxuICB9XHJcbiAgc2V0IGdvYWxZKGdvYWxZKSB7XHJcbiAgICB0aGlzLl9nb2FsWSA9IGdvYWxZXHJcbiAgfVxyXG4gIHNldCBhZXJpYWwoYWVyaWFsQm9vbGVhbikge1xyXG4gICAgdGhpcy5fYWVyaWFsID0gYWVyaWFsQm9vbGVhblxyXG4gIH1cclxuICBzZXQgYmFsbFNwZWVkKGJhbGxTcGVlZCkge1xyXG4gICAgdGhpcy5iYWxsX3NwZWVkID0gYmFsbFNwZWVkXHJcbiAgfVxyXG4gIHNldCB0aW1lU3RhbXAoZGF0ZU9iaikge1xyXG4gICAgdGhpcy5fdGltZVN0YW1wID0gZGF0ZU9ialxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2hvdE9uR29hbCIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgc2hvdE9uR29hbCBmcm9tIFwiLi9zaG90Q2xhc3NcIlxyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSBcIi4vZ2FtZURhdGFcIjtcclxuXHJcbmxldCBzaG90Q291bnRlciA9IDA7XHJcbmxldCBlZGl0aW5nU2hvdCA9IGZhbHNlOyAvL2VkaXRpbmcgc2hvdCBpcyB1c2VkIGZvciBib3RoIG5ldyBhbmQgb2xkIHNob3RzXHJcbmxldCBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG5sZXQgc2hvdEFycmF5ID0gW107IC8vIHJlc2V0IHdoZW4gZ2FtZSBpcyBzYXZlZFxyXG4vLyBnbG9iYWwgdmFycyB1c2VkIHdpdGggc2hvdCBlZGl0aW5nXHJcbmxldCBwcmV2aW91c1Nob3RPYmo7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFg7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFk7XHJcbmxldCBwcmV2aW91c1Nob3RHb2FsWDtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxZO1xyXG4vLyBnbG9iYWwgdmFyIHVzZWQgd2hlbiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUgKHRvIGRldGVybWluZSBpZiBuZXcgc2hvdHMgd2VyZSBhZGRlZCBmb3IgUE9TVClcclxubGV0IGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuXHJcbmNvbnN0IHNob3REYXRhID0ge1xyXG5cclxuICByZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGdhbWVwbGF5IGlzIGNsaWNrZWQgb24gdGhlIG5hdmJhciBhbmQgd2hlbiBhIGdhbWUgaXMgc2F2ZWQsIGluIG9yZGVyIHRvIHByZXZlbnQgYnVncyB3aXRoIHByZXZpb3VzbHkgY3JlYXRlZCBzaG90c1xyXG4gICAgc2hvdENvdW50ZXIgPSAwO1xyXG4gICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBzaG90QXJyYXkgPSBbXTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSB1bmRlZmluZWQ7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlTmV3U2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgc2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsO1xyXG4gICAgc2hvdE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vIHByZXZlbnQgdXNlciBmcm9tIHNlbGVjdGluZyBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnModHJ1ZSk7XHJcblxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcblxyXG4gICAgLy8gYWN0aXZhdGUgY2xpY2sgZnVuY3Rpb25hbGl0eSBhbmQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBvbiBib3RoIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gIH0sXHJcblxyXG4gIGdldENsaWNrQ29vcmRzKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZ2V0cyB0aGUgcmVsYXRpdmUgeCBhbmQgeSBvZiB0aGUgY2xpY2sgd2l0aGluIHRoZSBmaWVsZCBpbWFnZSBjb250YWluZXJcclxuICAgIC8vIGFuZCB0aGVuIGNhbGxzIHRoZSBmdW5jdGlvbiB0aGF0IGFwcGVuZHMgYSBtYXJrZXIgb24gdGhlIHBhZ2VcclxuICAgIGxldCBwYXJlbnRDb250YWluZXI7XHJcbiAgICBpZiAoZS50YXJnZXQuaWQgPT09IFwiZmllbGQtaW1nXCIpIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICB9XHJcbiAgICAvLyBvZmZzZXRYIGFuZCBZIGFyZSB0aGUgeCBhbmQgeSBjb29yZGluYXRlcyAocGl4ZWxzKSBvZiB0aGUgY2xpY2sgaW4gdGhlIGNvbnRhaW5lclxyXG4gICAgLy8gdGhlIGV4cHJlc3Npb25zIGRpdmlkZSB0aGUgY2xpY2sgeCBhbmQgeSBieSB0aGUgcGFyZW50IGZ1bGwgd2lkdGggYW5kIGhlaWdodFxyXG4gICAgY29uc3QgeENvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WCAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSlcclxuICAgIGNvbnN0IHlDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeENvb3JkUmVsYXRpdmUsIHlDb29yZFJlbGF0aXZlLCBwYXJlbnRDb250YWluZXIpXHJcbiAgfSxcclxuXHJcbiAgbWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpIHtcclxuICAgIGxldCBtYXJrZXJJZDtcclxuICAgIGlmIChwYXJlbnRDb250YWluZXIuaWQgPT09IFwiZmllbGQtaW1nLXBhcmVudFwiKSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1maWVsZFwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWdvYWxcIjtcclxuICAgIH1cclxuICAgIC8vIGFkanVzdCBmb3IgNTAlIG9mIHdpZHRoIGFuZCBoZWlnaHQgb2YgbWFya2VyIHNvIGl0J3MgY2VudGVyZWQgYWJvdXQgbW91c2UgcG9pbnRlclxyXG4gICAgbGV0IGFkanVzdE1hcmtlclggPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IGFkanVzdE1hcmtlclkgPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIE5PVCBhbHJlYWR5IGEgbWFya2VyLCB0aGVuIG1ha2Ugb25lIGFuZCBwbGFjZSBpdFxyXG4gICAgaWYgKCFwYXJlbnRDb250YWluZXIuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpKSkge1xyXG4gICAgICB0aGlzLmdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpO1xyXG4gICAgICAvLyBlbHNlIG1vdmUgdGhlIGV4aXN0aW5nIG1hcmtlciB0byB0aGUgbmV3IHBvc2l0aW9uXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpO1xyXG4gICAgfVxyXG4gICAgLy8gc2F2ZSBjb29yZGluYXRlcyB0byBvYmplY3RcclxuICAgIHRoaXMuYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSlcclxuICB9LFxyXG5cclxuICBnZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgZGl2LmlkID0gbWFya2VySWQ7XHJcbiAgICBkaXYuc3R5bGUud2lkdGggPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImxpZ2h0Z3JlZW5cIjtcclxuICAgIGRpdi5zdHlsZS5ib3JkZXIgPSBcIjFweCBzb2xpZCBibGFja1wiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiNTAlXCI7XHJcbiAgICBkaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICBkaXYuc3R5bGUubGVmdCA9ICh4IC0gYWRqdXN0TWFya2VyWCkgKiAxMDAgKyBcIiVcIjtcclxuICAgIGRpdi5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQoZGl2KTtcclxuICB9LFxyXG5cclxuICBtb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKSB7XHJcbiAgICBjb25zdCBjdXJyZW50TWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgfSxcclxuXHJcbiAgYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB1cGRhdGVzIHRoZSBpbnN0YW5jZSBvZiBzaG90T25Hb2FsIGNsYXNzIHRvIHJlY29yZCBjbGljayBjb29yZGluYXRlc1xyXG4gICAgLy8gaWYgYSBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBhcHBlbmQgdGhlIGNvb3JkaW5hdGVzIHRvIHRoZSBvYmplY3QgaW4gcXVlc3Rpb25cclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIC8vIHVzZSBnbG9iYWwgdmFycyBpbnN0ZWFkIG9mIHVwZGF0aW5nIG9iamVjdCBkaXJlY3RseSBoZXJlIHRvIHByZXZlbnQgYWNjaWRlbnRhbCBlZGl0aW5nIG9mIG1hcmtlciB3aXRob3V0IGNsaWNraW5nIFwic2F2ZSBzaG90XCJcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgICAvLyBvdGhlcndpc2UsIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgc28gYXBwZW5kIGNvb3JkaW5hdGVzIHRvIHRoZSBuZXcgb2JqZWN0XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIHNob3RPYmouZmllbGRYID0geDtcclxuICAgICAgICBzaG90T2JqLmZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWCA9IHg7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWSA9IHk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjYW5jZWxTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICBpZiAoIWVkaXRpbmdTaG90KSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAvLyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQsIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzc1xyXG4gICAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZFxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgaWYgKGZpZWxkTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChnb2FsTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZ29hbEltZ1BhcmVudC5yZW1vdmVDaGlsZChnb2FsTWFya2VyKTtcclxuICAgICAgfVxyXG4gICAgICAvLyByZW1vdmUgY2xpY2sgbGlzdGVuZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgZ29hbEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAvLyBjbGVhciBmaWVsZCBhbmQgZ29hbCBldmVudCBsaXN0ZW5lcnNcclxuICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgZ29hbEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAvLyByZW1vdmUgbWFya2VycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgIGZpZWxkSW1nUGFyZW50LnJlbW92ZUNoaWxkKGZpZWxkTWFya2VyKTtcclxuICAgICAgZ29hbEltZ1BhcmVudC5yZW1vdmVDaGlsZChnb2FsTWFya2VyKTtcclxuICAgICAgLy8gY29uZGl0aW9uYWwgc3RhdGVtZW50IHRvIHNhdmUgY29ycmVjdCBvYmplY3QgKGkuZS4gc2hvdCBiZWluZyBlZGl0ZWQgdnMuIG5ldyBzaG90KVxyXG4gICAgICAvLyBpZiBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBwcmV2aW91c1Nob3RPYmogd2lsbCBub3QgYmUgdW5kZWZpbmVkXHJcbiAgICAgIGlmIChwcmV2aW91c1Nob3RPYmogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2ZpZWxkWCA9IHByZXZpb3VzU2hvdEZpZWxkWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2ZpZWxkWSA9IHByZXZpb3VzU2hvdEZpZWxkWTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxYID0gcHJldmlvdXNTaG90R29hbFg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9nb2FsWSA9IHByZXZpb3VzU2hvdEdvYWxZO1xyXG4gICAgICAgIC8vIGVsc2Ugc2F2ZSB0byBuZXcgaW5zdGFuY2Ugb2YgY2xhc3MgYW5kIGFwcGVuZCBidXR0b24gdG8gcGFnZSB3aXRoIGNvcnJlY3QgSUQgZm9yIGVkaXRpbmdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoc2VsX2FlcmlhbC52YWx1ZSA9PT0gXCJBZXJpYWxcIikgeyBzaG90T2JqLmFlcmlhbCA9IHRydWUgfSBlbHNlIHsgc2hvdE9iai5hZXJpYWwgPSBmYWxzZSB9O1xyXG4gICAgICAgIHNob3RPYmouYmFsbFNwZWVkID0gaW5wdF9iYWxsU3BlZWQudmFsdWU7XHJcbiAgICAgICAgc2hvdEFycmF5LnB1c2goc2hvdE9iaik7XHJcbiAgICAgICAgLy8gYXBwZW5kIG5ldyBidXR0b25cclxuICAgICAgICBzaG90Q291bnRlcisrO1xyXG4gICAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7c2hvdENvdW50ZXJ9YCwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1saW5rXCIgfSwgYFNob3QgJHtzaG90Q291bnRlcn1gKTtcclxuICAgICAgICBzaG90QnRuQ29udGFpbmVyLmFwcGVuZENoaWxkKG5ld1Nob3RCdG4pO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7c2hvdENvdW50ZXJ9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnJlbmRlclNhdmVkU2hvdCk7XHJcbiAgICAgIH1cclxuICAgICAgLy9UT0RPOiBhZGQgY29uZGl0aW9uIHRvIHByZXZlbnQgYmxhbmsgZW50cmllcyBhbmQgbWlzc2luZyBjb29yZGluYXRlc1xyXG5cclxuICAgICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAvLyBjYW5jZWwgdGhlIG5ldyBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgKG1hdHRlcnMgaWYgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkKVxyXG4gICAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkIChtYXR0ZXJzIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZClcclxuICAgICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlbmRlclNhdmVkU2hvdChlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdGhlIHNob3RBcnJheSB0byBnZXQgYSBzaG90IG9iamVjdCB0aGF0IG1hdGNoZXMgdGhlIHNob3QjIGJ1dHRvbiBjbGlja2VkIChlLmcuIHNob3QgMiBidXR0b24gPSBpbmRleCAxIG9mIHRoZSBzaG90QXJyYXkpXHJcbiAgICAvLyB0aGUgZnVuY3Rpb24gKGFuZCBpdHMgYXNzb2NpYXRlZCBjb25kaXRpb25hbCBzdGF0ZW1lbnRzIGluIG90aGVyIGxvY2FsIGZ1bmN0aW9ucykgaGFzIHRoZXNlIGJhc2ljIHJlcXVpcmVtZW50czpcclxuICAgIC8vIHJlLWluaXRpYWxpemUgY2xpY2sgbGlzdGVuZXJzIG9uIGltYWdlc1xyXG4gICAgLy8gcmV2aXZlIGEgc2F2ZWQgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzIGZvciBlZGl0aW5nIHNob3QgY29vcmRpbmF0ZXMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWxcclxuICAgIC8vIHJlbmRlciBtYXJrZXJzIGZvciBleGlzdGluZyBjb29yZGluYXRlcyBvbiBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICAgIC8vIGFmZm9yZGFuY2UgdG8gc2F2ZSBlZGl0c1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBjYW5jZWwgZWRpdHNcclxuICAgIC8vIHRoZSBkYXRhIGlzIHJlbmRlcmVkIG9uIHRoZSBwYWdlIGFuZCBjYW4gYmUgc2F2ZWQgKG92ZXJ3cml0dGVuKSBieSB1c2luZyB0aGUgXCJzYXZlIHNob3RcIiBidXR0b24gb3IgY2FuY2VsZWQgYnkgY2xpY2tpbmcgdGhlIFwiY2FuY2VsIHNob3RcIiBidXR0b25cclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcblxyXG4gICAgLy8gcHJldmVudCBuZXcgc2hvdCBidXR0b24gZnJvbSBiZWluZyBjbGlja2VkXHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAvLyBhbGxvdyBjYW5jZWwgYW5kIHNhdmVkIGJ1dHRvbnMgdG8gYmUgY2xpY2tlZFxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgLy8gZ2V0IElEIG9mIHNob3QjIGJ0biBjbGlja2VkIGFuZCBhY2Nlc3Mgc2hvdEFycmF5IGF0IFtidG5JRCAtIDFdXHJcbiAgICBsZXQgYnRuSWQgPSBlLnRhcmdldC5pZC5zbGljZSg1KTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHNob3RBcnJheVtidG5JZCAtIDFdO1xyXG4gICAgLy8gcmVuZGVyIGJhbGwgc3BlZWQgYW5kIGFlcmlhbCBkcm9wZG93biBmb3IgdGhlIHNob3RcclxuICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQ7XHJcbiAgICBpZiAocHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPT09IHRydWUpIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiQWVyaWFsXCI7IH0gZWxzZSB7IHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7IH1cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gZmllbGQgYW5kIGdvYWxcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAvLyByZW5kZXIgc2hvdCBtYXJrZXIgb24gZmllbGRcclxuICAgIGxldCBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIilcclxuICAgIGxldCB4ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB5ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG4gICAgLy8gcmVuZGVyIGdvYWwgbWFya2VyIG9uIGZpZWxkXHJcbiAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKVxyXG4gICAgeCA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKTtcclxuICAgIHkgPSBOdW1iZXIoKChwcmV2aW91c1Nob3RPYmouX2dvYWxZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhkaXNhYmxlT3JOb3QpIHtcclxuICAgIC8vIGZvciBlYWNoIGJ1dHRvbiBhZnRlciBcIk5ldyBTaG90XCIsIFwiU2F2ZSBTaG90XCIsIGFuZCBcIkNhbmNlbCBTaG90XCIgZGlzYWJsZSB0aGUgYnV0dG9ucyBpZiB0aGUgdXNlciBpcyBjcmVhdGluZyBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSB0cnVlKSBvciBlbmFibGUgdGhlbSBvbiBzYXZlL2NhbmNlbCBvZiBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSBmYWxzZSlcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIGxldCBlZGl0QnRuO1xyXG4gICAgbGV0IGxlbmd0aCA9IHNob3RCdG5Db250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGg7XHJcbiAgICBmb3IgKGxldCBpID0gMzsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVkaXRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke2kgLSAyfWApO1xyXG4gICAgICBlZGl0QnRuLmRpc2FibGVkID0gZGlzYWJsZU9yTm90O1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBnZXRTaG90T2JqZWN0c0ZvclNhdmluZygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGFycmF5IGZvciB1c2UgaW4gZ2FtZURhdGEuanMgKHdoZW4gc2F2aW5nIGEgbmV3IGdhbWUsIG5vdCB3aGVuIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSlcclxuICAgIHJldHVybiBzaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbE51bU9mU2hvdHMoKSB7XHJcbiAgICAvLyBwcm92aWRlcyBpbml0aWFsIG51bWJlciBvZiBzaG90cyB0aGF0IHdlcmUgc2F2ZWQgdG8gZGF0YWJhc2UgdG8gZ2FtZURhdGEuanMgdG8gaWRlbnRpZnkgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWRcclxuICAgIHJldHVybiBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2hvdHNCdXR0b25zRnJvbVByZXZpb3VzR2FtZSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVxdWVzdHMgdGhlIGFycmF5IG9mIHNob3RzIGZyb20gdGhlIHByZXZpb3VzIHNhdmVkIGdhbWUsIHNldHMgaXQgYXMgc2hvdEFycmF5LCBhbmQgcmVuZGVycyBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIC8vIGdldCBzYXZlZCBnYW1lIHdpdGggc2hvdHMgZW1iZWRkZWQgYXMgYXJyYXlcclxuICAgIGxldCBzYXZlZEdhbWVPYmogPSBnYW1lRGF0YS5wcm92aWRlU2hvdHNUb1Nob3REYXRhKCk7XHJcbiAgICAvLyBjcmVhdGUgc2hvdEFycmF5IHdpdGggZm9ybWF0IHJlcXVpcmVkIGJ5IGxvY2FsIGZ1bmN0aW9uc1xyXG4gICAgbGV0IHNhdmVkU2hvdE9ialxyXG4gICAgc2F2ZWRHYW1lT2JqLnNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHNhdmVkU2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsXHJcbiAgICAgIHNhdmVkU2hvdE9iai5maWVsZFggPSBzaG90LmZpZWxkWDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWSA9IHNob3QuZmllbGRZO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFggPSBzaG90LmdvYWxYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFkgPSBzaG90LmdvYWxZO1xyXG4gICAgICBzYXZlZFNob3RPYmouYWVyaWFsID0gc2hvdC5hZXJpYWw7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5iYWxsX3NwZWVkID0gc2hvdC5iYWxsX3NwZWVkLnRvU3RyaW5nKCk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai50aW1lU3RhbXAgPSBzaG90LnRpbWVTdGFtcFxyXG4gICAgICBzYXZlZFNob3RPYmouaWQgPSBzaG90LmlkXHJcbiAgICAgIHNob3RBcnJheS5wdXNoKHNhdmVkU2hvdE9iaik7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKHNob3RBcnJheSk7XHJcbiAgICBzaG90QXJyYXkuZm9yRWFjaCgoc2hvdCwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7aWR4ICsgMX1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke2lkeCArIDF9YCk7XHJcbiAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aWR4ICsgMX1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgIH0pO1xyXG4gICAgc2hvdENvdW50ZXIgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gc2hvdEFycmF5Lmxlbmd0aDtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90RGF0YSJdfQ==
