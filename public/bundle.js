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

var _gameplay = _interopRequireDefault(require("./gameplay"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_navbar.default.generateNavbar(true);

_gameplay.default.loadGameplay();

},{"./gameplay":6,"./navbar":12}],12:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2RhdGVGaWx0ZXIuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwRmVlZGJhY2suanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBzLmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIiwiLi4vc2NyaXB0cy9zaG90Q2xhc3MuanMiLCIuLi9zY3JpcHRzL3Nob3REYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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LENBQUUsRUFBeEI7QUFBMkIsaUJBQVM7QUFBcEMsT0FBcEIsRUFBNkUsUUFBTyxHQUFHLEdBQUcsQ0FBRSxFQUE1RixDQUFuQjtBQUNBLE1BQUEsZ0JBQWdCLENBQUMsV0FBakIsQ0FBNkIsVUFBN0I7QUFDQSxNQUFBLFFBQVEsQ0FBQyxjQUFULENBQXlCLFFBQU8sR0FBRyxHQUFHLENBQUUsRUFBeEMsRUFBMkMsZ0JBQTNDLENBQTRELE9BQTVELEVBQXFFLFFBQVEsQ0FBQyxlQUE5RTtBQUNELEtBSkQ7QUFLQSxJQUFBLFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBeEI7QUFDQSxJQUFBLHdCQUF3QixHQUFHLFNBQVMsQ0FBQyxNQUFyQztBQUNEOztBQW5VYyxDQUFqQjtlQXVVZSxRIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypcbiAqIGhlYXRtYXAuanMgdjIuMC41IHwgSmF2YVNjcmlwdCBIZWF0bWFwIExpYnJhcnlcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOC0yMDE2IFBhdHJpY2sgV2llZCA8aGVhdG1hcGpzQHBhdHJpY2std2llZC5hdD4gLSBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogRHVhbCBsaWNlbnNlZCB1bmRlciBNSVQgYW5kIEJlZXJ3YXJlIGxpY2Vuc2UgXG4gKlxuICogOjogMjAxNi0wOS0wNSAwMToxNlxuICovXG47KGZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBmYWN0b3J5KSB7XG5cbiAgLy8gU3VwcG9ydHMgVU1ELiBBTUQsIENvbW1vbkpTL05vZGUuanMgYW5kIGJyb3dzZXIgY29udGV4dFxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRleHRbbmFtZV0gPSBmYWN0b3J5KCk7XG4gIH1cblxufSkoXCJoMzM3XCIsIHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuLy8gSGVhdG1hcCBDb25maWcgc3RvcmVzIGRlZmF1bHQgdmFsdWVzIGFuZCB3aWxsIGJlIG1lcmdlZCB3aXRoIGluc3RhbmNlIGNvbmZpZ1xudmFyIEhlYXRtYXBDb25maWcgPSB7XG4gIGRlZmF1bHRSYWRpdXM6IDQwLFxuICBkZWZhdWx0UmVuZGVyZXI6ICdjYW52YXMyZCcsXG4gIGRlZmF1bHRHcmFkaWVudDogeyAwLjI1OiBcInJnYigwLDAsMjU1KVwiLCAwLjU1OiBcInJnYigwLDI1NSwwKVwiLCAwLjg1OiBcInllbGxvd1wiLCAxLjA6IFwicmdiKDI1NSwwLDApXCJ9LFxuICBkZWZhdWx0TWF4T3BhY2l0eTogMSxcbiAgZGVmYXVsdE1pbk9wYWNpdHk6IDAsXG4gIGRlZmF1bHRCbHVyOiAuODUsXG4gIGRlZmF1bHRYRmllbGQ6ICd4JyxcbiAgZGVmYXVsdFlGaWVsZDogJ3knLFxuICBkZWZhdWx0VmFsdWVGaWVsZDogJ3ZhbHVlJywgXG4gIHBsdWdpbnM6IHt9XG59O1xudmFyIFN0b3JlID0gKGZ1bmN0aW9uIFN0b3JlQ2xvc3VyZSgpIHtcblxuICB2YXIgU3RvcmUgPSBmdW5jdGlvbiBTdG9yZShjb25maWcpIHtcbiAgICB0aGlzLl9jb29yZGluYXRvciA9IHt9O1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLl9yYWRpID0gW107XG4gICAgdGhpcy5fbWluID0gMTA7XG4gICAgdGhpcy5fbWF4ID0gMTtcbiAgICB0aGlzLl94RmllbGQgPSBjb25maWdbJ3hGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0WEZpZWxkO1xuICAgIHRoaXMuX3lGaWVsZCA9IGNvbmZpZ1sneUZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRZRmllbGQ7XG4gICAgdGhpcy5fdmFsdWVGaWVsZCA9IGNvbmZpZ1sndmFsdWVGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0VmFsdWVGaWVsZDtcblxuICAgIGlmIChjb25maWdbXCJyYWRpdXNcIl0pIHtcbiAgICAgIHRoaXMuX2NmZ1JhZGl1cyA9IGNvbmZpZ1tcInJhZGl1c1wiXTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGRlZmF1bHRSYWRpdXMgPSBIZWF0bWFwQ29uZmlnLmRlZmF1bHRSYWRpdXM7XG5cbiAgU3RvcmUucHJvdG90eXBlID0ge1xuICAgIC8vIHdoZW4gZm9yY2VSZW5kZXIgPSBmYWxzZSAtPiBjYWxsZWQgZnJvbSBzZXREYXRhLCBvbWl0cyByZW5kZXJhbGwgZXZlbnRcbiAgICBfb3JnYW5pc2VEYXRhOiBmdW5jdGlvbihkYXRhUG9pbnQsIGZvcmNlUmVuZGVyKSB7XG4gICAgICAgIHZhciB4ID0gZGF0YVBvaW50W3RoaXMuX3hGaWVsZF07XG4gICAgICAgIHZhciB5ID0gZGF0YVBvaW50W3RoaXMuX3lGaWVsZF07XG4gICAgICAgIHZhciByYWRpID0gdGhpcy5fcmFkaTtcbiAgICAgICAgdmFyIHN0b3JlID0gdGhpcy5fZGF0YTtcbiAgICAgICAgdmFyIG1heCA9IHRoaXMuX21heDtcbiAgICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbjtcbiAgICAgICAgdmFyIHZhbHVlID0gZGF0YVBvaW50W3RoaXMuX3ZhbHVlRmllbGRdIHx8IDE7XG4gICAgICAgIHZhciByYWRpdXMgPSBkYXRhUG9pbnQucmFkaXVzIHx8IHRoaXMuX2NmZ1JhZGl1cyB8fCBkZWZhdWx0UmFkaXVzO1xuXG4gICAgICAgIGlmICghc3RvcmVbeF0pIHtcbiAgICAgICAgICBzdG9yZVt4XSA9IFtdO1xuICAgICAgICAgIHJhZGlbeF0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3RvcmVbeF1beV0pIHtcbiAgICAgICAgICBzdG9yZVt4XVt5XSA9IHZhbHVlO1xuICAgICAgICAgIHJhZGlbeF1beV0gPSByYWRpdXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcmVbeF1beV0gKz0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0b3JlZFZhbCA9IHN0b3JlW3hdW3ldO1xuXG4gICAgICAgIGlmIChzdG9yZWRWYWwgPiBtYXgpIHtcbiAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXggPSBzdG9yZWRWYWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YU1heChzdG9yZWRWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmVkVmFsIDwgbWluKSB7XG4gICAgICAgICAgaWYgKCFmb3JjZVJlbmRlcikge1xuICAgICAgICAgICAgdGhpcy5fbWluID0gc3RvcmVkVmFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldERhdGFNaW4oc3RvcmVkVmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgeDogeCwgXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLCBcbiAgICAgICAgICAgIHJhZGl1czogcmFkaXVzLFxuICAgICAgICAgICAgbWluOiBtaW4sXG4gICAgICAgICAgICBtYXg6IG1heCBcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcbiAgICBfdW5Pcmdhbml6ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHVub3JnYW5pemVkRGF0YSA9IFtdO1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9kYXRhO1xuICAgICAgdmFyIHJhZGkgPSB0aGlzLl9yYWRpO1xuXG4gICAgICBmb3IgKHZhciB4IGluIGRhdGEpIHtcbiAgICAgICAgZm9yICh2YXIgeSBpbiBkYXRhW3hdKSB7XG5cbiAgICAgICAgICB1bm9yZ2FuaXplZERhdGEucHVzaCh7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHJhZGl1czogcmFkaVt4XVt5XSxcbiAgICAgICAgICAgIHZhbHVlOiBkYXRhW3hdW3ldXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICBkYXRhOiB1bm9yZ2FuaXplZERhdGFcbiAgICAgIH07XG4gICAgfSxcbiAgICBfb25FeHRyZW1hQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ2V4dHJlbWFjaGFuZ2UnLCB7XG4gICAgICAgIG1pbjogdGhpcy5fbWluLFxuICAgICAgICBtYXg6IHRoaXMuX21heFxuICAgICAgfSk7XG4gICAgfSxcbiAgICBhZGREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgZGF0YUFyciA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgdmFyIGRhdGFMZW4gPSBkYXRhQXJyLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGRhdGFMZW4tLSkge1xuICAgICAgICAgIHRoaXMuYWRkRGF0YS5jYWxsKHRoaXMsIGRhdGFBcnJbZGF0YUxlbl0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhZGQgdG8gc3RvcmUgIFxuICAgICAgICB2YXIgb3JnYW5pc2VkRW50cnkgPSB0aGlzLl9vcmdhbmlzZURhdGEoYXJndW1lbnRzWzBdLCB0cnVlKTtcbiAgICAgICAgaWYgKG9yZ2FuaXNlZEVudHJ5KSB7XG4gICAgICAgICAgLy8gaWYgaXQncyB0aGUgZmlyc3QgZGF0YXBvaW50IGluaXRpYWxpemUgdGhlIGV4dHJlbWFzIHdpdGggaXRcbiAgICAgICAgICBpZiAodGhpcy5fZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX21pbiA9IHRoaXMuX21heCA9IG9yZ2FuaXNlZEVudHJ5LnZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJwYXJ0aWFsJywge1xuICAgICAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgICAgIGRhdGE6IFtvcmdhbmlzZWRFbnRyeV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgZGF0YVBvaW50cyA9IGRhdGEuZGF0YTtcbiAgICAgIHZhciBwb2ludHNMZW4gPSBkYXRhUG9pbnRzLmxlbmd0aDtcblxuXG4gICAgICAvLyByZXNldCBkYXRhIGFycmF5c1xuICAgICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgICAgdGhpcy5fcmFkaSA9IFtdO1xuXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcG9pbnRzTGVuOyBpKyspIHtcbiAgICAgICAgdGhpcy5fb3JnYW5pc2VEYXRhKGRhdGFQb2ludHNbaV0sIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21heCA9IGRhdGEubWF4O1xuICAgICAgdGhpcy5fbWluID0gZGF0YS5taW4gfHwgMDtcbiAgICAgIFxuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVE9ETzogaW1wbGVtZW50XG4gICAgfSxcbiAgICBzZXREYXRhTWF4OiBmdW5jdGlvbihtYXgpIHtcbiAgICAgIHRoaXMuX21heCA9IG1heDtcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWluOiBmdW5jdGlvbihtaW4pIHtcbiAgICAgIHRoaXMuX21pbiA9IG1pbjtcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXRDb29yZGluYXRvcjogZnVuY3Rpb24oY29vcmRpbmF0b3IpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0gY29vcmRpbmF0b3I7XG4gICAgfSxcbiAgICBfZ2V0SW50ZXJuYWxEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7IFxuICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgbWluOiB0aGlzLl9taW4sIFxuICAgICAgICBkYXRhOiB0aGlzLl9kYXRhLFxuICAgICAgICByYWRpOiB0aGlzLl9yYWRpIFxuICAgICAgfTtcbiAgICB9LFxuICAgIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3VuT3JnYW5pemVEYXRhKCk7XG4gICAgfS8qLFxuXG4gICAgICBUT0RPOiByZXRoaW5rLlxuXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhciByYWRpdXMgPSAxMDA7XG4gICAgICB2YXIgeCA9IHBvaW50Lng7XG4gICAgICB2YXIgeSA9IHBvaW50Lnk7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAgIGlmIChkYXRhW3hdICYmIGRhdGFbeF1beV0pIHtcbiAgICAgICAgcmV0dXJuIGRhdGFbeF1beV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIC8vIHJhZGlhbCBzZWFyY2ggZm9yIGRhdGFwb2ludHMgYmFzZWQgb24gZGVmYXVsdCByYWRpdXNcbiAgICAgICAgZm9yKHZhciBkaXN0YW5jZSA9IDE7IGRpc3RhbmNlIDwgcmFkaXVzOyBkaXN0YW5jZSsrKSB7XG4gICAgICAgICAgdmFyIG5laWdoYm9ycyA9IGRpc3RhbmNlICogMiArMTtcbiAgICAgICAgICB2YXIgc3RhcnRYID0geCAtIGRpc3RhbmNlO1xuICAgICAgICAgIHZhciBzdGFydFkgPSB5IC0gZGlzdGFuY2U7XG5cbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG8gPSAwOyBvIDwgbmVpZ2hib3JzOyBvKyspIHtcbiAgICAgICAgICAgICAgaWYgKChpID09IDAgfHwgaSA9PSBuZWlnaGJvcnMtMSkgfHwgKG8gPT0gMCB8fCBvID09IG5laWdoYm9ycy0xKSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhW3N0YXJ0WStpXSAmJiBkYXRhW3N0YXJ0WStpXVtzdGFydFgrb10pIHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKGRhdGFbc3RhcnRZK2ldW3N0YXJ0WCtvXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgdmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0qL1xuICB9O1xuXG5cbiAgcmV0dXJuIFN0b3JlO1xufSkoKTtcblxudmFyIENhbnZhczJkUmVuZGVyZXIgPSAoZnVuY3Rpb24gQ2FudmFzMmRSZW5kZXJlckNsb3N1cmUoKSB7XG5cbiAgdmFyIF9nZXRDb2xvclBhbGV0dGUgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICB2YXIgZ3JhZGllbnRDb25maWcgPSBjb25maWcuZ3JhZGllbnQgfHwgY29uZmlnLmRlZmF1bHRHcmFkaWVudDtcbiAgICB2YXIgcGFsZXR0ZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBwYWxldHRlQ3R4ID0gcGFsZXR0ZUNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgcGFsZXR0ZUNhbnZhcy53aWR0aCA9IDI1NjtcbiAgICBwYWxldHRlQ2FudmFzLmhlaWdodCA9IDE7XG5cbiAgICB2YXIgZ3JhZGllbnQgPSBwYWxldHRlQ3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDI1NiwgMSk7XG4gICAgZm9yICh2YXIga2V5IGluIGdyYWRpZW50Q29uZmlnKSB7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3Aoa2V5LCBncmFkaWVudENvbmZpZ1trZXldKTtcbiAgICB9XG5cbiAgICBwYWxldHRlQ3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgIHBhbGV0dGVDdHguZmlsbFJlY3QoMCwgMCwgMjU2LCAxKTtcblxuICAgIHJldHVybiBwYWxldHRlQ3R4LmdldEltYWdlRGF0YSgwLCAwLCAyNTYsIDEpLmRhdGE7XG4gIH07XG5cbiAgdmFyIF9nZXRQb2ludFRlbXBsYXRlID0gZnVuY3Rpb24ocmFkaXVzLCBibHVyRmFjdG9yKSB7XG4gICAgdmFyIHRwbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciB0cGxDdHggPSB0cGxDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB2YXIgeCA9IHJhZGl1cztcbiAgICB2YXIgeSA9IHJhZGl1cztcbiAgICB0cGxDYW52YXMud2lkdGggPSB0cGxDYW52YXMuaGVpZ2h0ID0gcmFkaXVzKjI7XG5cbiAgICBpZiAoYmx1ckZhY3RvciA9PSAxKSB7XG4gICAgICB0cGxDdHguYmVnaW5QYXRoKCk7XG4gICAgICB0cGxDdHguYXJjKHgsIHksIHJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgIHRwbEN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwxKSc7XG4gICAgICB0cGxDdHguZmlsbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZ3JhZGllbnQgPSB0cGxDdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoeCwgeSwgcmFkaXVzKmJsdXJGYWN0b3IsIHgsIHksIHJhZGl1cyk7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwwLDAsMSknKTtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLDAsMCwwKScpO1xuICAgICAgdHBsQ3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgICAgdHBsQ3R4LmZpbGxSZWN0KDAsIDAsIDIqcmFkaXVzLCAyKnJhZGl1cyk7XG4gICAgfVxuXG5cblxuICAgIHJldHVybiB0cGxDYW52YXM7XG4gIH07XG5cbiAgdmFyIF9wcmVwYXJlRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgcmVuZGVyRGF0YSA9IFtdO1xuICAgIHZhciBtaW4gPSBkYXRhLm1pbjtcbiAgICB2YXIgbWF4ID0gZGF0YS5tYXg7XG4gICAgdmFyIHJhZGkgPSBkYXRhLnJhZGk7XG4gICAgdmFyIGRhdGEgPSBkYXRhLmRhdGE7XG5cbiAgICB2YXIgeFZhbHVlcyA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgIHZhciB4VmFsdWVzTGVuID0geFZhbHVlcy5sZW5ndGg7XG5cbiAgICB3aGlsZSh4VmFsdWVzTGVuLS0pIHtcbiAgICAgIHZhciB4VmFsdWUgPSB4VmFsdWVzW3hWYWx1ZXNMZW5dO1xuICAgICAgdmFyIHlWYWx1ZXMgPSBPYmplY3Qua2V5cyhkYXRhW3hWYWx1ZV0pO1xuICAgICAgdmFyIHlWYWx1ZXNMZW4gPSB5VmFsdWVzLmxlbmd0aDtcbiAgICAgIHdoaWxlKHlWYWx1ZXNMZW4tLSkge1xuICAgICAgICB2YXIgeVZhbHVlID0geVZhbHVlc1t5VmFsdWVzTGVuXTtcbiAgICAgICAgdmFyIHZhbHVlID0gZGF0YVt4VmFsdWVdW3lWYWx1ZV07XG4gICAgICAgIHZhciByYWRpdXMgPSByYWRpW3hWYWx1ZV1beVZhbHVlXTtcbiAgICAgICAgcmVuZGVyRGF0YS5wdXNoKHtcbiAgICAgICAgICB4OiB4VmFsdWUsXG4gICAgICAgICAgeTogeVZhbHVlLFxuICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICByYWRpdXM6IHJhZGl1c1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWluOiBtaW4sXG4gICAgICBtYXg6IG1heCxcbiAgICAgIGRhdGE6IHJlbmRlckRhdGFcbiAgICB9O1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gQ2FudmFzMmRSZW5kZXJlcihjb25maWcpIHtcbiAgICB2YXIgY29udGFpbmVyID0gY29uZmlnLmNvbnRhaW5lcjtcbiAgICB2YXIgc2hhZG93Q2FudmFzID0gdGhpcy5zaGFkb3dDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXMgPSBjb25maWcuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciByZW5kZXJCb3VuZGFyaWVzID0gdGhpcy5fcmVuZGVyQm91bmRhcmllcyA9IFsxMDAwMCwgMTAwMDAsIDAsIDBdO1xuXG4gICAgdmFyIGNvbXB1dGVkID0gZ2V0Q29tcHV0ZWRTdHlsZShjb25maWcuY29udGFpbmVyKSB8fCB7fTtcblxuICAgIGNhbnZhcy5jbGFzc05hbWUgPSAnaGVhdG1hcC1jYW52YXMnO1xuXG4gICAgdGhpcy5fd2lkdGggPSBjYW52YXMud2lkdGggPSBzaGFkb3dDYW52YXMud2lkdGggPSBjb25maWcud2lkdGggfHwgKyhjb21wdXRlZC53aWR0aC5yZXBsYWNlKC9weC8sJycpKTtcbiAgICB0aGlzLl9oZWlnaHQgPSBjYW52YXMuaGVpZ2h0ID0gc2hhZG93Q2FudmFzLmhlaWdodCA9IGNvbmZpZy5oZWlnaHQgfHwgKyhjb21wdXRlZC5oZWlnaHQucmVwbGFjZSgvcHgvLCcnKSk7XG5cbiAgICB0aGlzLnNoYWRvd0N0eCA9IHNoYWRvd0NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAvLyBAVE9ETzpcbiAgICAvLyBjb25kaXRpb25hbCB3cmFwcGVyXG5cbiAgICBjYW52YXMuc3R5bGUuY3NzVGV4dCA9IHNoYWRvd0NhbnZhcy5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt0b3A6MDsnO1xuXG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuICAgIHRoaXMuX3BhbGV0dGUgPSBfZ2V0Q29sb3JQYWxldHRlKGNvbmZpZyk7XG4gICAgdGhpcy5fdGVtcGxhdGVzID0ge307XG5cbiAgICB0aGlzLl9zZXRTdHlsZXMoY29uZmlnKTtcbiAgfTtcblxuICBDYW52YXMyZFJlbmRlcmVyLnByb3RvdHlwZSA9IHtcbiAgICByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5fZHJhd0FscGhhKGRhdGEpO1xuICAgICAgICB0aGlzLl9jb2xvcml6ZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVyQWxsOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyByZXNldCByZW5kZXIgYm91bmRhcmllc1xuICAgICAgdGhpcy5fY2xlYXIoKTtcbiAgICAgIGlmIChkYXRhLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9kcmF3QWxwaGEoX3ByZXBhcmVEYXRhKGRhdGEpKTtcbiAgICAgICAgdGhpcy5fY29sb3JpemUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIF91cGRhdGVHcmFkaWVudDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9wYWxldHRlID0gX2dldENvbG9yUGFsZXR0ZShjb25maWcpO1xuICAgIH0sXG4gICAgdXBkYXRlQ29uZmlnOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIGlmIChjb25maWdbJ2dyYWRpZW50J10pIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlR3JhZGllbnQoY29uZmlnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NldFN0eWxlcyhjb25maWcpO1xuICAgIH0sXG4gICAgc2V0RGltZW5zaW9uczogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICAgICAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcbiAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5zaGFkb3dDYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuc2hhZG93Q2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9LFxuICAgIF9jbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNoYWRvd0N0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCk7XG4gICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCk7XG4gICAgfSxcbiAgICBfc2V0U3R5bGVzOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX2JsdXIgPSAoY29uZmlnLmJsdXIgPT0gMCk/MDooY29uZmlnLmJsdXIgfHwgY29uZmlnLmRlZmF1bHRCbHVyKTtcblxuICAgICAgaWYgKGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29uZmlnLmJhY2tncm91bmRDb2xvcjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fd2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuc2hhZG93Q2FudmFzLndpZHRoID0gY29uZmlnLndpZHRoIHx8IHRoaXMuX3dpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zaGFkb3dDYW52YXMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCB8fCB0aGlzLl9oZWlnaHQ7XG5cblxuICAgICAgdGhpcy5fb3BhY2l0eSA9IChjb25maWcub3BhY2l0eSB8fCAwKSAqIDI1NTtcbiAgICAgIHRoaXMuX21heE9wYWNpdHkgPSAoY29uZmlnLm1heE9wYWNpdHkgfHwgY29uZmlnLmRlZmF1bHRNYXhPcGFjaXR5KSAqIDI1NTtcbiAgICAgIHRoaXMuX21pbk9wYWNpdHkgPSAoY29uZmlnLm1pbk9wYWNpdHkgfHwgY29uZmlnLmRlZmF1bHRNaW5PcGFjaXR5KSAqIDI1NTtcbiAgICAgIHRoaXMuX3VzZUdyYWRpZW50T3BhY2l0eSA9ICEhY29uZmlnLnVzZUdyYWRpZW50T3BhY2l0eTtcbiAgICB9LFxuICAgIF9kcmF3QWxwaGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBtaW4gPSB0aGlzLl9taW4gPSBkYXRhLm1pbjtcbiAgICAgIHZhciBtYXggPSB0aGlzLl9tYXggPSBkYXRhLm1heDtcbiAgICAgIHZhciBkYXRhID0gZGF0YS5kYXRhIHx8IFtdO1xuICAgICAgdmFyIGRhdGFMZW4gPSBkYXRhLmxlbmd0aDtcbiAgICAgIC8vIG9uIGEgcG9pbnQgYmFzaXM/XG4gICAgICB2YXIgYmx1ciA9IDEgLSB0aGlzLl9ibHVyO1xuXG4gICAgICB3aGlsZShkYXRhTGVuLS0pIHtcblxuICAgICAgICB2YXIgcG9pbnQgPSBkYXRhW2RhdGFMZW5dO1xuXG4gICAgICAgIHZhciB4ID0gcG9pbnQueDtcbiAgICAgICAgdmFyIHkgPSBwb2ludC55O1xuICAgICAgICB2YXIgcmFkaXVzID0gcG9pbnQucmFkaXVzO1xuICAgICAgICAvLyBpZiB2YWx1ZSBpcyBiaWdnZXIgdGhhbiBtYXhcbiAgICAgICAgLy8gdXNlIG1heCBhcyB2YWx1ZVxuICAgICAgICB2YXIgdmFsdWUgPSBNYXRoLm1pbihwb2ludC52YWx1ZSwgbWF4KTtcbiAgICAgICAgdmFyIHJlY3RYID0geCAtIHJhZGl1cztcbiAgICAgICAgdmFyIHJlY3RZID0geSAtIHJhZGl1cztcbiAgICAgICAgdmFyIHNoYWRvd0N0eCA9IHRoaXMuc2hhZG93Q3R4O1xuXG5cblxuXG4gICAgICAgIHZhciB0cGw7XG4gICAgICAgIGlmICghdGhpcy5fdGVtcGxhdGVzW3JhZGl1c10pIHtcbiAgICAgICAgICB0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXSA9IHRwbCA9IF9nZXRQb2ludFRlbXBsYXRlKHJhZGl1cywgYmx1cik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHBsID0gdGhpcy5fdGVtcGxhdGVzW3JhZGl1c107XG4gICAgICAgIH1cbiAgICAgICAgLy8gdmFsdWUgZnJvbSBtaW5pbXVtIC8gdmFsdWUgcmFuZ2VcbiAgICAgICAgLy8gPT4gWzAsIDFdXG4gICAgICAgIHZhciB0ZW1wbGF0ZUFscGhhID0gKHZhbHVlLW1pbikvKG1heC1taW4pO1xuICAgICAgICAvLyB0aGlzIGZpeGVzICMxNzY6IHNtYWxsIHZhbHVlcyBhcmUgbm90IHZpc2libGUgYmVjYXVzZSBnbG9iYWxBbHBoYSA8IC4wMSBjYW5ub3QgYmUgcmVhZCBmcm9tIGltYWdlRGF0YVxuICAgICAgICBzaGFkb3dDdHguZ2xvYmFsQWxwaGEgPSB0ZW1wbGF0ZUFscGhhIDwgLjAxID8gLjAxIDogdGVtcGxhdGVBbHBoYTtcblxuICAgICAgICBzaGFkb3dDdHguZHJhd0ltYWdlKHRwbCwgcmVjdFgsIHJlY3RZKTtcblxuICAgICAgICAvLyB1cGRhdGUgcmVuZGVyQm91bmRhcmllc1xuICAgICAgICBpZiAocmVjdFggPCB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdID0gcmVjdFg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWN0WSA8IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV0gPSByZWN0WTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RYICsgMipyYWRpdXMgPiB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdID0gcmVjdFggKyAyKnJhZGl1cztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RZICsgMipyYWRpdXMgPiB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdID0gcmVjdFkgKyAyKnJhZGl1cztcbiAgICAgICAgICB9XG5cbiAgICAgIH1cbiAgICB9LFxuICAgIF9jb2xvcml6ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgeCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF07XG4gICAgICB2YXIgeSA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV07XG4gICAgICB2YXIgd2lkdGggPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdIC0geDtcbiAgICAgIHZhciBoZWlnaHQgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdIC0geTtcbiAgICAgIHZhciBtYXhXaWR0aCA9IHRoaXMuX3dpZHRoO1xuICAgICAgdmFyIG1heEhlaWdodCA9IHRoaXMuX2hlaWdodDtcbiAgICAgIHZhciBvcGFjaXR5ID0gdGhpcy5fb3BhY2l0eTtcbiAgICAgIHZhciBtYXhPcGFjaXR5ID0gdGhpcy5fbWF4T3BhY2l0eTtcbiAgICAgIHZhciBtaW5PcGFjaXR5ID0gdGhpcy5fbWluT3BhY2l0eTtcbiAgICAgIHZhciB1c2VHcmFkaWVudE9wYWNpdHkgPSB0aGlzLl91c2VHcmFkaWVudE9wYWNpdHk7XG5cbiAgICAgIGlmICh4IDwgMCkge1xuICAgICAgICB4ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh5IDwgMCkge1xuICAgICAgICB5ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh4ICsgd2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICB3aWR0aCA9IG1heFdpZHRoIC0geDtcbiAgICAgIH1cbiAgICAgIGlmICh5ICsgaGVpZ2h0ID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgIGhlaWdodCA9IG1heEhlaWdodCAtIHk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbWcgPSB0aGlzLnNoYWRvd0N0eC5nZXRJbWFnZURhdGEoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICB2YXIgaW1nRGF0YSA9IGltZy5kYXRhO1xuICAgICAgdmFyIGxlbiA9IGltZ0RhdGEubGVuZ3RoO1xuICAgICAgdmFyIHBhbGV0dGUgPSB0aGlzLl9wYWxldHRlO1xuXG5cbiAgICAgIGZvciAodmFyIGkgPSAzOyBpIDwgbGVuOyBpKz0gNCkge1xuICAgICAgICB2YXIgYWxwaGEgPSBpbWdEYXRhW2ldO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gYWxwaGEgKiA0O1xuXG5cbiAgICAgICAgaWYgKCFvZmZzZXQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmaW5hbEFscGhhO1xuICAgICAgICBpZiAob3BhY2l0eSA+IDApIHtcbiAgICAgICAgICBmaW5hbEFscGhhID0gb3BhY2l0eTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoYWxwaGEgPCBtYXhPcGFjaXR5KSB7XG4gICAgICAgICAgICBpZiAoYWxwaGEgPCBtaW5PcGFjaXR5KSB7XG4gICAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBtaW5PcGFjaXR5O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZmluYWxBbHBoYSA9IGFscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaW5hbEFscGhhID0gbWF4T3BhY2l0eTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpbWdEYXRhW2ktM10gPSBwYWxldHRlW29mZnNldF07XG4gICAgICAgIGltZ0RhdGFbaS0yXSA9IHBhbGV0dGVbb2Zmc2V0ICsgMV07XG4gICAgICAgIGltZ0RhdGFbaS0xXSA9IHBhbGV0dGVbb2Zmc2V0ICsgMl07XG4gICAgICAgIGltZ0RhdGFbaV0gPSB1c2VHcmFkaWVudE9wYWNpdHkgPyBwYWxldHRlW29mZnNldCArIDNdIDogZmluYWxBbHBoYTtcblxuICAgICAgfVxuXG4gICAgICBpbWcuZGF0YSA9IGltZ0RhdGE7XG4gICAgICB0aGlzLmN0eC5wdXRJbWFnZURhdGEoaW1nLCB4LCB5KTtcblxuICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllcyA9IFsxMDAwLCAxMDAwLCAwLCAwXTtcblxuICAgIH0sXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhciBzaGFkb3dDdHggPSB0aGlzLnNoYWRvd0N0eDtcbiAgICAgIHZhciBpbWcgPSBzaGFkb3dDdHguZ2V0SW1hZ2VEYXRhKHBvaW50LngsIHBvaW50LnksIDEsIDEpO1xuICAgICAgdmFyIGRhdGEgPSBpbWcuZGF0YVszXTtcbiAgICAgIHZhciBtYXggPSB0aGlzLl9tYXg7XG4gICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuXG4gICAgICB2YWx1ZSA9IChNYXRoLmFicyhtYXgtbWluKSAqIChkYXRhLzI1NSkpID4+IDA7XG5cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuICAgIGdldERhdGFVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FudmFzLnRvRGF0YVVSTCgpO1xuICAgIH1cbiAgfTtcblxuXG4gIHJldHVybiBDYW52YXMyZFJlbmRlcmVyO1xufSkoKTtcblxuXG52YXIgUmVuZGVyZXIgPSAoZnVuY3Rpb24gUmVuZGVyZXJDbG9zdXJlKCkge1xuXG4gIHZhciByZW5kZXJlckZuID0gZmFsc2U7XG5cbiAgaWYgKEhlYXRtYXBDb25maWdbJ2RlZmF1bHRSZW5kZXJlciddID09PSAnY2FudmFzMmQnKSB7XG4gICAgcmVuZGVyZXJGbiA9IENhbnZhczJkUmVuZGVyZXI7XG4gIH1cblxuICByZXR1cm4gcmVuZGVyZXJGbjtcbn0pKCk7XG5cblxudmFyIFV0aWwgPSB7XG4gIG1lcmdlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWVyZ2VkID0ge307XG4gICAgdmFyIGFyZ3NMZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJnc0xlbjsgaSsrKSB7XG4gICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2ldXG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIG1lcmdlZFtrZXldID0gb2JqW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXJnZWQ7XG4gIH1cbn07XG4vLyBIZWF0bWFwIENvbnN0cnVjdG9yXG52YXIgSGVhdG1hcCA9IChmdW5jdGlvbiBIZWF0bWFwQ2xvc3VyZSgpIHtcblxuICB2YXIgQ29vcmRpbmF0b3IgPSAoZnVuY3Rpb24gQ29vcmRpbmF0b3JDbG9zdXJlKCkge1xuXG4gICAgZnVuY3Rpb24gQ29vcmRpbmF0b3IoKSB7XG4gICAgICB0aGlzLmNTdG9yZSA9IHt9O1xuICAgIH07XG5cbiAgICBDb29yZGluYXRvci5wcm90b3R5cGUgPSB7XG4gICAgICBvbjogZnVuY3Rpb24oZXZ0TmFtZSwgY2FsbGJhY2ssIHNjb3BlKSB7XG4gICAgICAgIHZhciBjU3RvcmUgPSB0aGlzLmNTdG9yZTtcblxuICAgICAgICBpZiAoIWNTdG9yZVtldnROYW1lXSkge1xuICAgICAgICAgIGNTdG9yZVtldnROYW1lXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGNTdG9yZVtldnROYW1lXS5wdXNoKChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChzY29wZSwgZGF0YSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0sXG4gICAgICBlbWl0OiBmdW5jdGlvbihldnROYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBjU3RvcmUgPSB0aGlzLmNTdG9yZTtcbiAgICAgICAgaWYgKGNTdG9yZVtldnROYW1lXSkge1xuICAgICAgICAgIHZhciBsZW4gPSBjU3RvcmVbZXZ0TmFtZV0ubGVuZ3RoO1xuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gY1N0b3JlW2V2dE5hbWVdW2ldO1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDb29yZGluYXRvcjtcbiAgfSkoKTtcblxuXG4gIHZhciBfY29ubmVjdCA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgdmFyIHJlbmRlcmVyID0gc2NvcGUuX3JlbmRlcmVyO1xuICAgIHZhciBjb29yZGluYXRvciA9IHNjb3BlLl9jb29yZGluYXRvcjtcbiAgICB2YXIgc3RvcmUgPSBzY29wZS5fc3RvcmU7XG5cbiAgICBjb29yZGluYXRvci5vbigncmVuZGVycGFydGlhbCcsIHJlbmRlcmVyLnJlbmRlclBhcnRpYWwsIHJlbmRlcmVyKTtcbiAgICBjb29yZGluYXRvci5vbigncmVuZGVyYWxsJywgcmVuZGVyZXIucmVuZGVyQWxsLCByZW5kZXJlcik7XG4gICAgY29vcmRpbmF0b3Iub24oJ2V4dHJlbWFjaGFuZ2UnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzY29wZS5fY29uZmlnLm9uRXh0cmVtYUNoYW5nZSAmJlxuICAgICAgc2NvcGUuX2NvbmZpZy5vbkV4dHJlbWFDaGFuZ2Uoe1xuICAgICAgICBtaW46IGRhdGEubWluLFxuICAgICAgICBtYXg6IGRhdGEubWF4LFxuICAgICAgICBncmFkaWVudDogc2NvcGUuX2NvbmZpZ1snZ3JhZGllbnQnXSB8fCBzY29wZS5fY29uZmlnWydkZWZhdWx0R3JhZGllbnQnXVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3RvcmUuc2V0Q29vcmRpbmF0b3IoY29vcmRpbmF0b3IpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gSGVhdG1hcCgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5fY29uZmlnID0gVXRpbC5tZXJnZShIZWF0bWFwQ29uZmlnLCBhcmd1bWVudHNbMF0gfHwge30pO1xuICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0gbmV3IENvb3JkaW5hdG9yKCk7XG4gICAgaWYgKGNvbmZpZ1sncGx1Z2luJ10pIHtcbiAgICAgIHZhciBwbHVnaW5Ub0xvYWQgPSBjb25maWdbJ3BsdWdpbiddO1xuICAgICAgaWYgKCFIZWF0bWFwQ29uZmlnLnBsdWdpbnNbcGx1Z2luVG9Mb2FkXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBcXCcnKyBwbHVnaW5Ub0xvYWQgKyAnXFwnIG5vdCBmb3VuZC4gTWF5YmUgaXQgd2FzIG5vdCByZWdpc3RlcmVkLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHBsdWdpbiA9IEhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5Ub0xvYWRdO1xuICAgICAgICAvLyBzZXQgcGx1Z2luIHJlbmRlcmVyIGFuZCBzdG9yZVxuICAgICAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBwbHVnaW4ucmVuZGVyZXIoY29uZmlnKTtcbiAgICAgICAgdGhpcy5fc3RvcmUgPSBuZXcgcGx1Z2luLnN0b3JlKGNvbmZpZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IFJlbmRlcmVyKGNvbmZpZyk7XG4gICAgICB0aGlzLl9zdG9yZSA9IG5ldyBTdG9yZShjb25maWcpO1xuICAgIH1cbiAgICBfY29ubmVjdCh0aGlzKTtcbiAgfTtcblxuICAvLyBAVE9ETzpcbiAgLy8gYWRkIEFQSSBkb2N1bWVudGF0aW9uXG4gIEhlYXRtYXAucHJvdG90eXBlID0ge1xuICAgIGFkZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuYWRkRGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5yZW1vdmVEYXRhICYmIHRoaXMuX3N0b3JlLnJlbW92ZURhdGEuYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YU1heDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhTWF4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGFNaW4uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbmZpZ3VyZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9jb25maWcgPSBVdGlsLm1lcmdlKHRoaXMuX2NvbmZpZywgY29uZmlnKTtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLnVwZGF0ZUNvbmZpZyh0aGlzLl9jb25maWcpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fc3RvcmUuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVwYWludDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9zdG9yZS5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBnZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5nZXREYXRhKCk7XG4gICAgfSxcbiAgICBnZXREYXRhVVJMOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci5nZXREYXRhVVJMKCk7XG4gICAgfSxcbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuXG4gICAgICBpZiAodGhpcy5fc3RvcmUuZ2V0VmFsdWVBdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RvcmUuZ2V0VmFsdWVBdChwb2ludCk7XG4gICAgICB9IGVsc2UgIGlmICh0aGlzLl9yZW5kZXJlci5nZXRWYWx1ZUF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci5nZXRWYWx1ZUF0KHBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gSGVhdG1hcDtcblxufSkoKTtcblxuXG4vLyBjb3JlXG52YXIgaGVhdG1hcEZhY3RvcnkgPSB7XG4gIGNyZWF0ZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgcmV0dXJuIG5ldyBIZWF0bWFwKGNvbmZpZyk7XG4gIH0sXG4gIHJlZ2lzdGVyOiBmdW5jdGlvbihwbHVnaW5LZXksIHBsdWdpbikge1xuICAgIEhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5LZXldID0gcGx1Z2luO1xuICB9XG59O1xuXG5yZXR1cm4gaGVhdG1hcEZhY3Rvcnk7XG5cblxufSk7IiwiY29uc3QgVVJMID0gXCJodHRwOi8vbG9jYWxob3N0OjgwODhcIlxyXG5cclxuY29uc3QgQVBJID0ge1xyXG5cclxuICBnZXRTaW5nbGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBnZXRBbGwoZXh0ZW5zaW9uKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSXRlbShleHRlbnNpb24sIGlkKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJERUxFVEVcIlxyXG4gICAgfSlcclxuICAgICAgLnRoZW4oZSA9PiBlLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwb3N0SXRlbShleHRlbnNpb24sIG9iaikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCwge1xyXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwdXRJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQVVRcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQVBJIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgZGF0ZUZpbHRlciA9IHtcclxuXHJcbiAgYnVpbGREYXRlRmlsdGVyKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZnJvbSBoZWF0bWFwcy5qcyBhbmQgaXMgdHJpZ2dlcmVkIGZyb20gdGhlIGhlYXRtYXBzIHBhZ2Ugb2YgdGhlIHNpdGUgd2hlblxyXG4gICAgLy8gdGhlIGRhdGUgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJlbmREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGVuZERhdGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBlbmREYXRlSW5wdXQpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkRhdGUgMjpcXHhhMFwiKTtcclxuICAgIGNvbnN0IGVuZERhdGVJbnB1dEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGVuZERhdGVMYWJlbCwgZW5kRGF0ZUNvbnRyb2wpO1xyXG5cclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwic3RhcnREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIHN0YXJ0RGF0ZUlucHV0KTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkRhdGUgMTpcXHhhMFwiKTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0RmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgc3RhcnREYXRlTGFiZWwsIHN0YXJ0RGF0ZUNvbnRyb2wpO1xyXG5cclxuICAgIGNvbnN0IGNsZWFyRmlsdGVyQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNsZWFyRGF0ZUZpbHRlclwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2xlYXIgRmlsdGVyXCIpO1xyXG4gICAgY29uc3QgY2xlYXJGaWx0ZXJCdXR0b25Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBjbGVhckZpbHRlckJ0bik7XHJcbiAgICBjb25zdCBkYXRlU2F2ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzZXREYXRlRmlsdGVyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2V0IEZpbHRlclwiKTtcclxuICAgIGNvbnN0IHNhdmVCdXR0b25Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkYXRlU2F2ZUJ0bik7XHJcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsTW9kYWxXaW5kb3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbEJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGNhbmNlbEJ0bik7XHJcbiAgICBjb25zdCBidXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBzYXZlQnV0dG9uQ29udHJvbCwgY2xlYXJGaWx0ZXJCdXR0b25Db250cm9sLCBjYW5jZWxCdXR0b25Db250cm9sKTtcclxuXHJcbiAgICBjb25zdCBtb2RhbENvbnRlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibW9kYWwtY29udGVudCBib3hcIiB9LCBudWxsLCBzdGFydERhdGVJbnB1dEZpZWxkLCBlbmREYXRlSW5wdXRGaWVsZCwgYnV0dG9uRmllbGQpO1xyXG4gICAgY29uc3QgbW9kYWxCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1vZGFsLWJhY2tncm91bmRcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IG1vZGFsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIm1vZGFsLWRhdGVGaWx0ZXJcIiwgXCJjbGFzc1wiOiBcIm1vZGFsXCIgfSwgbnVsbCwgbW9kYWxCYWNrZ3JvdW5kLCBtb2RhbENvbnRlbnQpO1xyXG5cclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQobW9kYWwpO1xyXG4gICAgdGhpcy5tb2RhbHNFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBtb2RhbHNFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBjbGVhckRhdGVGaWx0ZXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNsZWFyRGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IHNldERhdGVGaWx0ZXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNldERhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBjYW5jZWxNb2RhbFdpbmRvd0J0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FuY2VsTW9kYWxXaW5kb3dcIik7XHJcblxyXG4gICAgY2FuY2VsTW9kYWxXaW5kb3dCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuY2FuY2VsTW9kYWxXaW5kb3cpO1xyXG4gICAgc2V0RGF0ZUZpbHRlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5zZXRGaWx0ZXIpO1xyXG4gICAgY2xlYXJEYXRlRmlsdGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLmNsZWFyRGF0ZUZpbHRlcik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG9wZW5EYXRlRmlsdGVyKCkge1xyXG4gICAgY29uc3QgZGF0ZVJhbmdlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXRlUmFuZ2VCdG5cIik7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICAvLyBjaGVjayBpZiBnbG9iYWwgdmFycyBhcmUgc2V0LiBJZiBzbywgZG9uJ3QgdG9nZ2xlIGNvbG9yIG9mIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZVNldCA9IGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXModHJ1ZSk7XHJcblxyXG4gICAgaWYgKGRhdGVTZXQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRhdGVSYW5nZUJ0bi5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBjbGVhckRhdGVGaWx0ZXIoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlc2V0cyBnbG9iYWwgZGF0ZSBmaWx0ZXIgdmFyaWFibGVzIGluIGhlYXRtYXBEYXRhLmpzIGFuZCByZXBsYWNlcyBkYXRlIGlucHV0cyB3aXRoIGJsYW5rIGRhdGUgaW5wdXRzXHJcbiAgICBsZXQgc3RhcnREYXRlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0YXJ0RGF0ZUlucHV0XCIpO1xyXG4gICAgbGV0IGVuZERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5kRGF0ZUlucHV0XCIpO1xyXG4gICAgY29uc3QgZGF0ZUZpbHRlck1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RhbC1kYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2V0RGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2V0RGF0ZUZpbHRlclwiKTtcclxuXHJcbiAgICBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKCk7XHJcbiAgICBkYXRlUmFuZ2VCdG4uY2xhc3NMaXN0LmFkZChcImlzLW91dGxpbmVkXCIpO1xyXG4gICAgc3RhcnREYXRlSW5wdXQucmVwbGFjZVdpdGgoZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwic3RhcnREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKSk7XHJcbiAgICBlbmREYXRlSW5wdXQucmVwbGFjZVdpdGgoZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiZW5kRGF0ZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJkYXRlXCIgfSwgbnVsbCkpO1xyXG4gICAgc2V0RGF0ZUZpbHRlckJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5zZXRGaWx0ZXIpO1xyXG4gICAgc2V0RGF0ZUZpbHRlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5zZXRGaWx0ZXIpO1xyXG5cclxuICAgIGlmIChkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYWN0aXZlXCIpKSB7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzZXRGaWx0ZXIoKSB7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBzdGFydERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhcnREYXRlSW5wdXRcIik7XHJcbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVuZERhdGVJbnB1dFwiKTtcclxuXHJcbiAgICBzdGFydERhdGVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgZW5kRGF0ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgLy8gY2hlY2sgaWYgZGF0ZSBwaWNrZXJzIGhhdmUgYSB2YWxpZCBkYXRlXHJcbiAgICBpZiAoc3RhcnREYXRlSW5wdXQudmFsdWUgPT09IFwiXCIpIHtcclxuICAgICAgc3RhcnREYXRlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgIH0gZWxzZSBpZiAoZW5kRGF0ZUlucHV0LnZhbHVlID09PSBcIlwiKSB7XHJcbiAgICAgIGVuZERhdGVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gaWYgdGhleSBkbywgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgaW4gaGVhdG1hcHMgcGFnZSBhbmQgY2xvc2UgbW9kYWxcclxuICAgICAgaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyhmYWxzZSwgc3RhcnREYXRlSW5wdXQudmFsdWUsIGVuZERhdGVJbnB1dC52YWx1ZSk7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbE1vZGFsV2luZG93KCkge1xyXG4gICAgY29uc3QgZGF0ZUZpbHRlck1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RhbC1kYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3QgZGF0ZVJhbmdlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXRlUmFuZ2VCdG5cIik7XHJcblxyXG4gICAgLy8gaWYgZ2xvYmFsIHZhcmlhYmxlcyBhcmUgZGVmaW5lZCBhbHJlYWR5LCBjYW5jZWwgc2hvdWxkIG5vdCBjaGFuZ2UgdGhlIGNsYXNzIG9uIHRoZSBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZVNldCA9IGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXModHJ1ZSk7XHJcbiAgICBpZiAoZGF0ZVNldCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGF0ZVJhbmdlQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlkYXRlRmlsdGVyKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgZ2FtZUlkcywgZ2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBleGFtaW5lcyB0aGUgZ2FtZSBvYmplY3QgYXJndW1lbnQgY29tcGFyZWQgdG8gdGhlIHVzZXItZGVmaW5lZCBzdGFydCBhbmQgZW5kIGRhdGVzXHJcbiAgICAvLyBpZiB0aGUgZ2FtZSBkYXRlIGlzIHdpdGhpbiB0aGUgdHdvIGRhdGVzIHNwZWNpZmllZCwgdGhlbiB0aGUgZ2FtZSBJRCBpcyBwdXNoZWQgdG8gdGhlIGdhbWVJZHMgYXJyYXlcclxuXHJcbiAgICAvLyBzcGxpdCB0aW1lc3RhbXAgYW5kIHJlY2FsbCBvbmx5IGRhdGVcclxuICAgIGxldCBnYW1lRGF0ZSA9IGdhbWUudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXTtcclxuXHJcbiAgICBpZiAoc3RhcnREYXRlIDw9IGdhbWVEYXRlICYmIGdhbWVEYXRlIDw9IGVuZERhdGUpIHtcclxuICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5ZGF0ZUZpbHRlclRvU2F2ZWRIZWF0bWFwKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgc2hvdHMsIHNob3RzTWF0Y2hpbmdGaWx0ZXIpIHtcclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCBzaG90RGF0ZSA9IHNob3QudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXTtcclxuXHJcbiAgICAgIGlmIChzdGFydERhdGUgPD0gc2hvdERhdGUgJiYgc2hvdERhdGUgPD0gZW5kRGF0ZSkge1xyXG4gICAgICAgIHNob3RzTWF0Y2hpbmdGaWx0ZXIucHVzaChzaG90KTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkYXRlRmlsdGVyIiwiZnVuY3Rpb24gZWxCdWlsZGVyKG5hbWUsIGF0dHJpYnV0ZXNPYmosIHR4dCwgLi4uY2hpbGRyZW4pIHtcclxuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgZm9yIChsZXQgYXR0ciBpbiBhdHRyaWJ1dGVzT2JqKSB7XHJcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ciwgYXR0cmlidXRlc09ialthdHRyXSk7XHJcbiAgfVxyXG4gIGVsLnRleHRDb250ZW50ID0gdHh0IHx8IG51bGw7XHJcbiAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICBlbC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbiAgfSlcclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGVsQnVpbGRlciIsImltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiO1xyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5cclxuLy8gdGhlIHB1cnBvc2Ugb2YgdGhpcyBtb2R1bGUgaXMgdG86XHJcbi8vIDEuIHNhdmUgYWxsIGNvbnRlbnQgaW4gdGhlIGdhbWVwbGF5IHBhZ2UgKHNob3QgYW5kIGdhbWUgZGF0YSkgdG8gdGhlIGRhdGFiYXNlXHJcbi8vIDIuIGltbWVkaWF0ZWx5IGNsZWFyIHRoZSBnYW1lcGxheSBjb250YWluZXJzIG9mIGNvbnRlbnQgb24gc2F2ZVxyXG4vLyAzLiBpbW1lZGlhdGVseSByZXNldCBhbGwgZ2xvYmFsIHZhcmlhYmxlcyBpbiB0aGUgc2hvdGRhdGEgZmlsZSB0byBhbGxvdyB0aGUgdXNlciB0byBiZWdpbiBzYXZpbmcgc2hvdHMgYW5kIGVudGVyaW5nIGdhbWUgZGF0YSBmb3IgdGhlaXIgbmV4dCBnYW1lXHJcbi8vIDQuIGFmZm9yZGFuY2UgZm9yIHVzZXIgdG8gcmVjYWxsIGFsbCBkYXRhIGZyb20gcHJldmlvdXMgc2F2ZWQgZ2FtZSBmb3IgZWRpdGluZ1xyXG4vLyA1LiBpbmNsdWRlIGFueSBvdGhlciBmdW5jdGlvbnMgbmVlZGVkIHRvIHN1cHBvcnQgdGhlIGZpcnN0IDQgcmVxdWlyZW1lbnRzXHJcblxyXG4vLyB0aGlzIGdsb2JhbCB2YXJpYWJsZSBpcyB1c2VkIHRvIHBhc3Mgc2F2ZWQgc2hvdHMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWwgYm9vbGVhbiB0byBzaG90RGF0YS5qcyBkdXJpbmcgdGhlIGVkaXQgcHJvY2Vzc1xyXG5sZXQgc2F2ZWRHYW1lT2JqZWN0O1xyXG5sZXQgcHV0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG5sZXQgcG9zdFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxubGV0IHBvc3RQcm9taXNlcyA9IFtdO1xyXG5cclxuY29uc3QgZ2FtZURhdGEgPSB7XHJcblxyXG4gIGdhbWVUeXBlQnV0dG9uVG9nZ2xlKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdG9nZ2xlcyB0aGUgXCJpcy1zZWxlY3RlZFwiIGNsYXNzIGJldHdlZW4gdGhlIGdhbWUgdHlwZSBidXR0b25zXHJcblxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGJ0bkNsaWNrZWQgPSBlLnRhcmdldDtcclxuXHJcbiAgICBpZiAoIWJ0bkNsaWNrZWQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgY29uc3QgY3VycmVudEdhbWVUeXBlQnRuID0gZ2FtZVR5cGVCdG5zLmZpbHRlcihidG4gPT4gYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICByZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKSB7XHJcbiAgICBzYXZlZEdhbWVPYmplY3QgPSB1bmRlZmluZWQ7XHJcbiAgICBwdXRQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbiAgICBwb3N0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG4gICAgcG9zdFByb21pc2VzID0gW107XHJcbiAgfSxcclxuXHJcbiAgcHV0RWRpdGVkU2hvdHMocHJldmlvdXNseVNhdmVkU2hvdHNBcnIpIHtcclxuICAgIC8vIFBVVCBmaXJzdCwgc2ljbmUgeW91IGNhbid0IHNhdmUgYSBnYW1lIGluaXRpYWxseSB3aXRob3V0IGF0IGxlYXN0IDEgc2hvdFxyXG4gICAgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgLy8gZXZlbiB0aG91Z2ggaXQncyBhIFBVVCwgd2UgaGF2ZSB0byByZWZvcm1hdCB0aGUgX2ZpZWxkWCBzeW50YXggdG8gZmllbGRYXHJcbiAgICAgIGxldCBzaG90Rm9yUHV0ID0ge307XHJcbiAgICAgIHNob3RGb3JQdXQuZ2FtZUlkID0gc2F2ZWRHYW1lT2JqZWN0LmlkO1xyXG4gICAgICBzaG90Rm9yUHV0LmZpZWxkWCA9IHNob3QuX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclB1dC5maWVsZFkgPSBzaG90Ll9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQdXQuZ29hbFggPSBzaG90Ll9nb2FsWDtcclxuICAgICAgc2hvdEZvclB1dC5nb2FsWSA9IHNob3QuX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUHV0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdC5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclB1dC5hZXJpYWwgPSBzaG90Ll9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQdXQudGltZVN0YW1wID0gc2hvdC5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcHV0UHJvbWlzZXNFZGl0TW9kZS5wdXNoKEFQSS5wdXRJdGVtKGBzaG90cy8ke3Nob3QuaWR9YCwgc2hvdEZvclB1dCkpO1xyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwdXRQcm9taXNlc0VkaXRNb2RlKVxyXG4gIH0sXHJcblxyXG4gIHBvc3ROZXdTaG90c01hZGVEdXJpbmdFZGl0TW9kZShzaG90c05vdFlldFBvc3RlZEFycikge1xyXG4gICAgc2hvdHNOb3RZZXRQb3N0ZWRBcnIuZm9yRWFjaChzaG90T2JqID0+IHtcclxuICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgIHNob3RGb3JQb3N0LmdhbWVJZCA9IHNhdmVkR2FtZU9iamVjdC5pZDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRYID0gc2hvdE9iai5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFkgPSBzaG90T2JqLl9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxYID0gc2hvdE9iai5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxZID0gc2hvdE9iai5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdE9iai5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclBvc3QuYWVyaWFsID0gc2hvdE9iai5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUG9zdC50aW1lU3RhbXAgPSBzaG90T2JqLl90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwb3N0UHJvbWlzZXNFZGl0TW9kZS5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RzXCIsIHNob3RGb3JQb3N0KSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocG9zdFByb21pc2VzRWRpdE1vZGUpXHJcbiAgfSxcclxuXHJcbiAgcG9zdE5ld1Nob3RzKGdhbWVJZCkge1xyXG4gICAgLy8gcG9zdCBzaG90cyB3aXRoIGdhbWVJZFxyXG4gICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yU2F2aW5nKCk7XHJcbiAgICBzaG90QXJyLmZvckVhY2goc2hvdE9iaiA9PiB7XHJcbiAgICAgIGxldCBzaG90Rm9yUG9zdCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBnYW1lSWQ7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclBvc3QudGltZVN0YW1wID0gc2hvdE9iai5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcG9zdFByb21pc2VzLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpKTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocG9zdFByb21pc2VzKVxyXG4gIH0sXHJcblxyXG4gIHNhdmVEYXRhKGdhbWVEYXRhT2JqLCBzYXZpbmdFZGl0ZWRHYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGZpcnN0IGRldGVybWluZXMgaWYgYSBnYW1lIGlzIGJlaW5nIHNhdmVkIGFzIG5ldywgb3IgYSBwcmV2aW91c2x5IHNhdmVkIGdhbWUgaXMgYmVpbmcgZWRpdGVkXHJcbiAgICAvLyBpZiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUsIHRoZSBnYW1lIGlzIFBVVCwgYWxsIHNob3RzIHNhdmVkIHByZXZpb3VzbHkgYXJlIFBVVCwgYW5kIG5ldyBzaG90cyBhcmUgUE9TVEVEXHJcbiAgICAvLyBpZiB0aGUgZ2FtZSBpcyBhIG5ldyBnYW1lIGFsdG9nZXRoZXIsIHRoZW4gdGhlIGdhbWUgaXMgUE9TVEVEIGFuZCBhbGwgc2hvdHMgYXJlIFBPU1RFRFxyXG4gICAgLy8gdGhlbiBmdW5jdGlvbnMgYXJlIGNhbGxlZCB0byByZWxvYWQgdGhlIG1hc3RlciBjb250YWluZXIgYW5kIHJlc2V0IGdsb2JhbCBzaG90IGRhdGEgdmFyaWFibGVzXHJcblxyXG4gICAgaWYgKHNhdmluZ0VkaXRlZEdhbWUpIHtcclxuICAgICAgLy8gdXNlIElEIG9mIGdhbWUgc3RvcmVkIGluIGdsb2JhbCB2YXJcclxuICAgICAgQVBJLnB1dEl0ZW0oYGdhbWVzLyR7c2F2ZWRHYW1lT2JqZWN0LmlkfWAsIGdhbWVEYXRhT2JqKVxyXG4gICAgICAgIC50aGVuKGdhbWVQVVQgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJQVVQgR0FNRVwiLCBnYW1lUFVUKVxyXG4gICAgICAgICAgLy8gcG9zdCBzaG90cyB3aXRoIGdhbWVJZFxyXG4gICAgICAgICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yU2F2aW5nKCk7XHJcbiAgICAgICAgICBjb25zdCBwcmV2aW91c2x5U2F2ZWRTaG90c0FyciA9IFtdO1xyXG4gICAgICAgICAgY29uc3Qgc2hvdHNOb3RZZXRQb3N0ZWRBcnIgPSBbXTtcclxuXHJcbiAgICAgICAgICAvLyBjcmVhdGUgYXJyYXlzIGZvciBQVVQgYW5kIFBPU1QgZnVuY3Rpb25zIChpZiB0aGVyZSdzIGFuIGlkIGluIHRoZSBhcnJheSwgaXQncyBiZWVuIHNhdmVkIHRvIHRoZSBkYXRhYmFzZSBiZWZvcmUpXHJcbiAgICAgICAgICBzaG90QXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChzaG90LmlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBwcmV2aW91c2x5U2F2ZWRTaG90c0Fyci5wdXNoKHNob3QpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHNob3RzTm90WWV0UG9zdGVkQXJyLnB1c2goc2hvdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLy8gY2FsbCBmdW5jdGlvbnMgdG8gUFVUIGFuZCBQT1NUXHJcbiAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0aGF0IGNsZWFyIGdhbWVwbGF5IGNvbnRlbnQgYW5kIHJlc2V0IGdsb2JhbCBzaG90L2dhbWUgZGF0YSB2YXJpYWJsZXNcclxuICAgICAgICAgIGdhbWVEYXRhLnB1dEVkaXRlZFNob3RzKHByZXZpb3VzbHlTYXZlZFNob3RzQXJyKVxyXG4gICAgICAgICAgICAudGhlbih4ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBVVFM6XCIsIHgpXHJcbiAgICAgICAgICAgICAgLy8gaWYgbm8gbmV3IHNob3RzIHdlcmUgbWFkZSwgcmVsb2FkLiBlbHNlIHBvc3QgbmV3IHNob3RzXHJcbiAgICAgICAgICAgICAgaWYgKHNob3RzTm90WWV0UG9zdGVkQXJyLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lRGF0YS5wb3N0TmV3U2hvdHNNYWRlRHVyaW5nRWRpdE1vZGUoc2hvdHNOb3RZZXRQb3N0ZWRBcnIpXHJcbiAgICAgICAgICAgICAgICAgIC50aGVuKHkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUE9TVFM6XCIsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLnBvc3RJdGVtKFwiZ2FtZXNcIiwgZ2FtZURhdGFPYmopXHJcbiAgICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmlkKVxyXG4gICAgICAgIC50aGVuKGdhbWVJZCA9PiB7XHJcbiAgICAgICAgICBnYW1lRGF0YS5wb3N0TmV3U2hvdHMoZ2FtZUlkKVxyXG4gICAgICAgICAgICAudGhlbih6ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNBVkVEIE5FVyBTSE9UU1wiLCB6KTtcclxuICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHBhY2thZ2VHYW1lRGF0YSgpIHtcclxuXHJcbiAgICAvLyBnZXQgdXNlciBJRCBmcm9tIHNlc3Npb24gc3RvcmFnZVxyXG4gICAgLy8gcGFja2FnZSBlYWNoIGlucHV0IGZyb20gZ2FtZSBkYXRhIGNvbnRhaW5lciBpbnRvIHZhcmlhYmxlc1xyXG4gICAgLy8gVE9ETzogY29uZGl0aW9uYWwgc3RhdGVtZW50IHRvIHByZXZlbnQgYmxhbmsgc2NvcmUgZW50cmllc1xyXG4gICAgLy8gVE9ETzogY3JlYXRlIGEgbW9kYWwgYXNraW5nIHVzZXIgaWYgdGhleSB3YW50IHRvIHNhdmUgZ2FtZVxyXG5cclxuICAgIC8vIHBsYXllcklkXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKSk7XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlICgxdjEsIDJ2MiwgM3YzKVxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGdhbWVUeXBlID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGdhbWVUeXBlQnRucy5mb3JFYWNoKGJ0biA9PiB7XHJcbiAgICAgIGlmIChidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgICBnYW1lVHlwZSA9IGJ0bi50ZXh0Q29udGVudFxyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGdhbWUgbW9kZSAobm90ZTogZGlkIG5vdCB1c2UgYm9vbGVhbiBpbiBjYXNlIG1vcmUgZ2FtZSBtb2RlcyBhcmUgc3VwcG9ydGVkIGluIHRoZSBmdXR1cmUpXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbF9nYW1lTW9kZS52YWx1ZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIC8vIG15IHRlYW1cclxuICAgIGNvbnN0IHNlbF90ZWFtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBsZXQgdGVhbWVkVXA7XHJcbiAgICBpZiAoc2VsX3RlYW0udmFsdWUgPT09IFwiTm8gcGFydHlcIikge1xyXG4gICAgICB0ZWFtZWRVcCA9IGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGVhbWVkVXAgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNjb3Jlc1xyXG4gICAgbGV0IG15U2NvcmU7XHJcbiAgICBsZXQgdGhlaXJTY29yZTtcclxuICAgIGNvbnN0IGlucHRfbXlTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF90aGVpclNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aGVpclNjb3JlSW5wdXRcIik7XHJcblxyXG4gICAgbXlTY29yZSA9IE51bWJlcihpbnB0X215U2NvcmUudmFsdWUpO1xyXG4gICAgdGhlaXJTY29yZSA9IE51bWJlcihpbnB0X3RoZWlyU2NvcmUudmFsdWUpO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBsZXQgb3ZlcnRpbWU7XHJcbiAgICBjb25zdCBzZWxfb3ZlcnRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm92ZXJ0aW1lSW5wdXRcIik7XHJcbiAgICBpZiAoc2VsX292ZXJ0aW1lLnZhbHVlID09PSBcIk92ZXJ0aW1lXCIpIHtcclxuICAgICAgb3ZlcnRpbWUgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3ZlcnRpbWUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZ2FtZURhdGFPYmogPSB7XHJcbiAgICAgIFwidXNlcklkXCI6IGFjdGl2ZVVzZXJJZCxcclxuICAgICAgXCJtb2RlXCI6IGdhbWVNb2RlLFxyXG4gICAgICBcInR5cGVcIjogZ2FtZVR5cGUsXHJcbiAgICAgIFwicGFydHlcIjogdGVhbWVkVXAsXHJcbiAgICAgIFwic2NvcmVcIjogbXlTY29yZSxcclxuICAgICAgXCJvcHBfc2NvcmVcIjogdGhlaXJTY29yZSxcclxuICAgICAgXCJvdmVydGltZVwiOiBvdmVydGltZSxcclxuICAgIH07XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IGEgbmV3IGdhbWUgb3IgZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQuIElmIGFuIGVkaXRlZCBnYW1lIGlzIGJlaW5nIHNhdmVkLCB0aGVuIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBzaG90IHNhdmVkIGFscmVhZHksIG1ha2luZyB0aGUgcmV0dXJuIGZyb20gdGhlIHNob3REYXRhIGZ1bmN0aW9uIG1vcmUgdGhhbiAwXHJcbiAgICBjb25zdCBzYXZpbmdFZGl0ZWRHYW1lID0gc2hvdERhdGEuZ2V0SW5pdGlhbE51bU9mU2hvdHMoKVxyXG4gICAgaWYgKHNhdmluZ0VkaXRlZEdhbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBnYW1lRGF0YU9iai50aW1lU3RhbXAgPSBzYXZlZEdhbWVPYmplY3QudGltZVN0YW1wXHJcbiAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCB0cnVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHRpbWUgc3RhbXAgaWYgbmV3IGdhbWVcclxuICAgICAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHRpbWVTdGFtcFxyXG4gICAgICBnYW1lRGF0YS5zYXZlRGF0YShnYW1lRGF0YU9iaiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlUHJldkdhbWVFZGl0cygpIHtcclxuICAgIGdhbWVEYXRhLnBhY2thZ2VHYW1lRGF0YSgpO1xyXG4gIH0sXHJcblxyXG4gIGNhbmNlbEVkaXRpbmdNb2RlKCkge1xyXG4gICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICB9LFxyXG5cclxuICByZW5kZXJFZGl0QnV0dG9ucygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVtb3ZlcyAmIHJlcGxhY2VzIGVkaXQgYW5kIHNhdmUgZ2FtZSBidXR0b25zIHdpdGggXCJTYXZlIEVkaXRzXCIgYW5kIFwiQ2FuY2VsIEVkaXRzXCJcclxuICAgIGNvbnN0IGJ0bl9lZGl0UHJldkdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRQcmV2R2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlR2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUdhbWVcIik7XHJcbiAgICAvLyBpbiBjYXNlIG9mIGxhZyBpbiBmZXRjaCwgcHJldmVudCB1c2VyIGZyb20gZG91YmxlIGNsaWNraW5nIGJ1dHRvblxyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmNsYXNzTGlzdC5hZGQoXCJpcy1sb2FkaW5nXCIpO1xyXG5cclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIEVkaXRzXCIpXHJcbiAgICBjb25zdCBidG5fc2F2ZUVkaXRzID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgRWRpdHNcIilcclxuXHJcbiAgICBidG5fY2FuY2VsRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmNhbmNlbEVkaXRpbmdNb2RlKVxyXG4gICAgYnRuX3NhdmVFZGl0cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuc2F2ZVByZXZHYW1lRWRpdHMpXHJcblxyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5yZXBsYWNlV2l0aChidG5fY2FuY2VsRWRpdHMpO1xyXG4gICAgYnRuX3NhdmVHYW1lLnJlcGxhY2VXaXRoKGJ0bl9zYXZlRWRpdHMpO1xyXG5cclxuICB9LFxyXG5cclxuICByZW5kZXJQcmV2R2FtZShnYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIHNhdmVkIGdhbWUgaW5mb3JtYXRpb24gaW4gdGhlIFwiRW50ZXIgR2FtZSBEYXRhXCIgY29udGFpbmVyLlxyXG4gICAgLy8gaXQgcmVsaWVzIG9uIGEgZnVuY3Rpb24gaW4gc2hvdERhdGEuanMgdG8gcmVuZGVyIHRoZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnNvbGUubG9nKGdhbWUpXHJcblxyXG4gICAgLy8gY2FsbCBmdW5jdGlvbiBpbiBzaG90RGF0YSB0aGF0IGNhbGxzIGdhbWFEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIHdpbGwgY2FwdHVyZSB0aGUgYXJyYXkgb2Ygc2F2ZWQgc2hvdHMgYW5kIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5yZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKClcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUub3ZlcnRpbWUpIHtcclxuICAgICAgc2VsX292ZXJ0aW1lLnZhbHVlID0gXCJPdmVydGltZVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfb3ZlcnRpbWUudmFsdWUgPSBcIk5vIG92ZXJ0aW1lXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBteSB0ZWFtXHJcbiAgICBjb25zdCBzZWxfdGVhbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUucGFydHkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHNlbF90ZWFtLnZhbHVlID0gXCJObyBwYXJ0eVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfdGVhbS52YWx1ZSA9IFwiUGFydHlcIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNjb3JlXHJcbiAgICBjb25zdCBpbnB0X215U2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15U2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfdGhlaXJTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGhlaXJTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIGlucHRfbXlTY29yZS52YWx1ZSA9IGdhbWUuc2NvcmU7XHJcbiAgICBpbnB0X3RoZWlyU2NvcmUudmFsdWUgPSBnYW1lLm9wcF9zY29yZTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcblxyXG4gICAgaWYgKGdhbWUudHlwZSA9PT0gXCIzdjNcIikge1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzN2My5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgLy8gMnYyIGlzIHRoZSBkZWZhdWx0XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIGlmIChnYW1lLnR5cGUgPT09IFwiMnYyXCIpIHtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzF2MS5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5tb2RlID0gXCJjb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIHNlbF9nYW1lTW9kZS52YWx1ZSA9IFwiQ29tcGV0aXRpdmVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDYXN1YWxcIlxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBwcm92aWRlU2hvdHNUb1Nob3REYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBwcm92aWRlcyB0aGUgc2hvdHMgZm9yIHJlbmRlcmluZyB0byBzaG90RGF0YVxyXG4gICAgcmV0dXJuIHNhdmVkR2FtZU9iamVjdFxyXG4gIH0sXHJcblxyXG4gIGVkaXRQcmV2R2FtZSgpIHtcclxuICAgIC8vIGZldGNoIGNvbnRlbnQgZnJvbSBtb3N0IHJlY2VudCBnYW1lIHNhdmVkIHRvIGJlIHJlbmRlcmVkXHJcblxyXG4gICAgLy8gVE9ETzogY3JlYXRlIGEgbW9kYWwgYXNraW5nIHVzZXIgaWYgdGhleSB3YW50IHRvIGVkaXQgcHJldmlvdXMgZ2FtZVxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuXHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGAke2FjdGl2ZVVzZXJJZH0/X2VtYmVkPWdhbWVzYCkudGhlbih1c2VyID0+IHtcclxuICAgICAgaWYgKHVzZXIuZ2FtZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYWxlcnQoXCJObyBnYW1lcyBoYXZlIGJlZW4gc2F2ZWQgYnkgdGhpcyB1c2VyXCIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGdldCBtYXggZ2FtZSBpZCAod2hpY2ggaXMgdGhlIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQpXHJcbiAgICAgICAgY29uc3QgcmVjZW50R2FtZUlkID0gdXNlci5nYW1lcy5yZWR1Y2UoKG1heCwgb2JqKSA9PiBvYmouaWQgPiBtYXggPyBvYmouaWQgOiBtYXgsIHVzZXIuZ2FtZXNbMF0uaWQpO1xyXG4gICAgICAgIC8vIGZldGNoIG1vc3QgcmVjZW50IGdhbWUgYW5kIGVtYmVkIHNob3RzXHJcbiAgICAgICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJnYW1lc1wiLCBgJHtyZWNlbnRHYW1lSWR9P19lbWJlZD1zaG90c2ApLnRoZW4oZ2FtZU9iaiA9PiB7XHJcbiAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgZ2FtZURhdGEucmVuZGVyRWRpdEJ1dHRvbnMoKTtcclxuICAgICAgICAgIHNhdmVkR2FtZU9iamVjdCA9IGdhbWVPYmo7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJQcmV2R2FtZShnYW1lT2JqKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVEYXRhIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgZ2FtZXBsYXkgPSB7XHJcblxyXG4gIGxvYWRHYW1lcGxheSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIC8vIGNvbnN0IHhCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiZGVsZXRlXCIgfSk7XHJcbiAgICAvLyB4QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZUJveCwgZXZlbnQpOyAvLyBidXR0b24gd2lsbCBkaXNwbGF5OiBub25lIG9uIHBhcmVudCBjb250YWluZXJcclxuICAgIC8vIGNvbnN0IGhlYWRlckluZm8gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uIGlzLWluZm9cIiB9LCBcIkNyZWF0ZSBhbmQgc2F2ZSBzaG90cyAtIHRoZW4gc2F2ZSB0aGUgZ2FtZSByZWNvcmQuXCIsIHhCdXR0b24pO1xyXG4gICAgLy8gd2VicGFnZS5hcHBlbmRDaGlsZChoZWFkZXJJbmZvKTtcclxuICAgIHRoaXMuYnVpbGRTaG90Q29udGVudCgpO1xyXG4gICAgdGhpcy5idWlsZEdhbWVDb250ZW50KCk7XHJcbiAgICB0aGlzLmdhbWVwbGF5RXZlbnRNYW5hZ2VyKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRTaG90Q29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYnVpbGRzIHNob3QgY29udGFpbmVycyBhbmQgYWRkcyBjb250YWluZXIgY29udGVudFxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3Qgc2hvdFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgU2hvdCBEYXRhXCIpO1xyXG4gICAgY29uc3Qgc2hvdFRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdFRpdGxlKTtcclxuXHJcbiAgICAvLyBuZXcgc2hvdCBhbmQgc2F2ZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IG5ld1Nob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwibmV3U2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIk5ldyBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2F2ZVNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZVNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIFNob3RcIik7XHJcbiAgICBjb25zdCBjYW5jZWxTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbFNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwic2hvdENvbnRyb2xzXCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGJ1dHRvbnNcIiB9LCBudWxsLCBuZXdTaG90LCBzYXZlU2hvdCwgY2FuY2VsU2hvdCk7XHJcbiAgICBjb25zdCBhbGlnblNob3RCdXR0b25zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBzaG90QnV0dG9ucyk7XHJcbiAgICBjb25zdCBzaG90QnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25TaG90QnV0dG9ucyk7XHJcblxyXG4gICAgLy8gYmFsbCBzcGVlZCBpbnB1dCBhbmQgYWVyaWFsIHNlbGVjdFxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJCYWxsIHNwZWVkIChtcGgpOlwiKVxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJiYWxsU3BlZWRJbnB1dFwiLCBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBpbnB1dFwiLCBcInR5cGVcIjpcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgYmFsbCBzcGVlZFwiIH0pO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTdGFuZGFyZFwiKTtcclxuICAgIGNvbnN0IGFlcmlhbE9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQWVyaWFsXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImFlcmlhbElucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxPcHRpb24xLCBhZXJpYWxPcHRpb24yKTtcclxuICAgIGNvbnN0IGFlcmlhbFNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxTZWxlY3QpO1xyXG4gICAgY29uc3QgYWVyaWFsQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBhZXJpYWxTZWxlY3RQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIGJhbGxTcGVlZElucHV0VGl0bGUsIGJhbGxTcGVlZElucHV0LCBhZXJpYWxDb250cm9sKTtcclxuICAgIGNvbnN0IHNob3REZXRhaWxzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdERldGFpbHMpO1xyXG5cclxuICAgIC8vIGZpZWxkIGFuZCBnb2FsIGltYWdlcyAobm90ZSBmaWVsZC1pbWcgaXMgY2xpcHBlZCB0byByZXN0cmljdCBjbGljayBhcmVhIGNvb3JkaW5hdGVzIGluIGxhdGVyIGZ1bmN0aW9uLlxyXG4gICAgLy8gZ29hbC1pbWcgdXNlcyBhbiB4L3kgZm9ybXVsYSBmb3IgY2xpY2sgYXJlYSBjb29yZGluYXRlcyByZXN0cmljdGlvbiwgc2luY2UgaXQncyBhIHJlY3RhbmdsZSlcclxuICAgIC8vIGFkZGl0aW9uYWxseSwgZmllbGQgYW5kIGdvYWwgYXJlIG5vdCBhbGlnbmVkIHdpdGggbGV2ZWwtbGVmdCBvciBsZXZlbC1yaWdodCAtIGl0J3MgYSBkaXJlY3QgbGV2ZWwgLS0+IGxldmVsLWl0ZW0gZm9yIGNlbnRlcmluZ1xyXG4gICAgY29uc3QgZmllbGRJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZUJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLWJnXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwiXCIgfSwgbnVsbCwgZmllbGRJbWFnZUJhY2tncm91bmQsIGZpZWxkSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZmllbGRJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvUkxfZ29hbF9jcm9wcGVkX25vX2JnX0JXLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdvYWxJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkdvYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdvYWxJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnbkZpZWxkLCBhbGlnbkdvYWwpO1xyXG5cclxuICAgIC8vIHBhcmVudCBjb250YWluZXIgaG9sZGluZyBhbGwgc2hvdCBpbmZvcm1hdGlvblxyXG4gICAgY29uc3QgcGFyZW50U2hvdENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgc2hvdFRpdGxlQ29udGFpbmVyLCBzaG90QnV0dG9uQ29udGFpbmVyLCBzaG90RGV0YWlsc0NvbnRhaW5lciwgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyKVxyXG5cclxuICAgIC8vIGFwcGVuZCBzaG90cyBjb250YWluZXIgdG8gcGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRTaG90Q29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdhbWVDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBjcmVhdGVzIGdhbWUgY29udGVudCBjb250YWluZXJzICh0ZWFtLCBnYW1lIHR5cGUsIGdhbWUgbW9kZSwgZXRjLilcclxuXHJcbiAgICAvLyBjb250YWluZXIgdGl0bGVcclxuICAgIGNvbnN0IGdhbWVUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIHRpdGxlIGlzLTRcIiB9LCBcIkVudGVyIEdhbWUgRGF0YVwiKTtcclxuICAgIGNvbnN0IHRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVRpdGxlKTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIHRvcCBjb250YWluZXJcclxuXHJcbiAgICAvLyAxdjEvMnYyLzN2MyBidXR0b25zIChub3RlOiBjb250cm9sIGNsYXNzIGlzIHVzZWQgd2l0aCBmaWVsZCB0byBhZGhlcmUgYnV0dG9ucyB0b2dldGhlcilcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8zdjNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiM3YzXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjNDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTN2Myk7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMnYyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc2VsZWN0ZWQgaXMtbGlua1wiIH0sIFwiMnYyXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjJDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTJ2Mik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUxdjEpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBoYXMtYWRkb25zXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjNDb250cm9sLCBnYW1lVHlwZTJ2MkNvbnRyb2wsIGdhbWVUeXBlMXYxQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25GaWVsZCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIHNlbGVjdFxyXG4gICAgY29uc3QgbW9kZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ2FzdWFsXCIpO1xyXG4gICAgY29uc3QgbW9kZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImdhbWVNb2RlSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVPcHRpb24xLCBtb2RlT3B0aW9uMik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVTZWxlY3QpO1xyXG4gICAgY29uc3QgbW9kZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgbW9kZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gdGVhbSBzZWxlY3RcclxuICAgIGNvbnN0IHRlYW1PcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIHBhcnR5XCIpO1xyXG4gICAgY29uc3QgdGVhbU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUGFydHlcIik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcInRlYW1JbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbU9wdGlvbjEsIHRlYW1PcHRpb24yKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbVNlbGVjdCk7XHJcbiAgICBjb25zdCB0ZWFtQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCB0ZWFtU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyBvdmVydGltZSBzZWxlY3RcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBvdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcIm92ZXJ0aW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lT3B0aW9uMSwgb3ZlcnRpbWVPcHRpb24yKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0KTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSBib3R0b20gY29udGFpbmVyXHJcblxyXG4gICAgLy8gc2NvcmUgaW5wdXRzXHJcbiAgICAvLyAqKioqTm90ZSBpbmxpbmUgc3R5bGluZyBvZiBpbnB1dCB3aWR0aHNcclxuICAgIGNvbnN0IG15U2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIlNjb3JlOlwiKTtcclxuICAgIGNvbnN0IG15U2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm15U2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJteSB0ZWFtJ3Mgc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IG15U2NvcmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gY29udHJvbFwiIH0sIG51bGwsIG15U2NvcmVJbnB1dCk7XHJcbiAgICBjb25zdCB0aGVpclNjb3JlSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJPcHBvbmVudCdzIHNjb3JlOlwiKVxyXG4gICAgY29uc3QgdGhlaXJTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidGhlaXJTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcInRoZWlyIHRlYW0ncyBzY29yZVwiIH0pO1xyXG4gICAgY29uc3QgdGhlaXJTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgdGhlaXJTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IHNjb3JlSW5wdXRDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIG15U2NvcmVJbnB1dFRpdGxlLCBteVNjb3JlQ29udHJvbCwgdGhlaXJTY29yZUlucHV0VGl0bGUsIHRoZWlyU2NvcmVDb250cm9sKTtcclxuXHJcbiAgICAvLyBlZGl0L3NhdmUgZ2FtZSBidXR0b25zXHJcbiAgICBjb25zdCBlZGl0UHJldmlvdXNHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImVkaXRQcmV2R2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRWRpdCBQcmV2aW91cyBHYW1lXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUdhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEdhbWVcIik7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQWxpZ25tZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnMgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHNhdmVHYW1lLCBlZGl0UHJldmlvdXNHYW1lKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtcmlnaHRcIiB9LCBudWxsLCBnYW1lQnV0dG9uQWxpZ25tZW50KTtcclxuXHJcbiAgICAvLyBhcHBlbmQgdG8gd2VicGFnZVxyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lclRvcCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyLCBtb2RlQ29udHJvbCwgdGVhbUNvbnRyb2wsIG92ZXJ0aW1lQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyQm90dG9tID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2NvcmVJbnB1dENvbnRhaW5lciwgZ2FtZUJ1dHRvbkNvbnRhaW5lcik7XHJcbiAgICBjb25zdCBwYXJlbnRHYW1lQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCB0aXRsZUNvbnRhaW5lciwgZ2FtZUNvbnRhaW5lclRvcCwgZ2FtZUNvbnRhaW5lckJvdHRvbSk7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudEdhbWVDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5RXZlbnRNYW5hZ2VyKCkge1xyXG5cclxuICAgIC8vIGJ1dHRvbnNcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzXHJcbiAgICBidG5fbmV3U2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY3JlYXRlTmV3U2hvdCk7XHJcbiAgICBidG5fc2F2ZVNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnNhdmVTaG90KTtcclxuICAgIGJ0bl9jYW5jZWxTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jYW5jZWxTaG90KTtcclxuICAgIGJ0bl9zYXZlR2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEucGFja2FnZUdhbWVEYXRhKTtcclxuICAgIGdhbWVUeXBlQnRucy5mb3JFYWNoKGJ0biA9PiBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmdhbWVUeXBlQnV0dG9uVG9nZ2xlKSk7XHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5lZGl0UHJldkdhbWUpXHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVwbGF5IiwiaW1wb3J0IGhlYXRtYXAgZnJvbSBcIi4uL2xpYi9ub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUEkuanNcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlci5qc1wiO1xyXG5pbXBvcnQgZGF0ZUZpbHRlciBmcm9tIFwiLi9kYXRlRmlsdGVyLmpzXCI7XHJcbmltcG9ydCBmZWVkYmFjayBmcm9tIFwiLi9oZWF0bWFwRmVlZGJhY2tcIjtcclxuXHJcbi8vIElEIG9mIHNldEludGVydmFsIGZ1bmN0aW9uIHVzZWQgdG8gbW9uaXRvciBjb250YWluZXIgd2lkdGggYW5kIHJlcGFpbnQgaGVhdG1hcCBpZiBjb250YWluZXIgd2lkdGggY2hhbmdlc1xyXG5sZXQgaW50ZXJ2YWxJZDtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHRvIHN0b3JlIGZldGNoZWQgc2hvdHNcclxubGV0IGdsb2JhbFNob3RzQXJyO1xyXG5sZXQgam9pblRhYmxlQXJyID0gW107XHJcbi8vIGdsb2JhbCB2YXJpYWJsZSB1c2VkIHdpdGggYmFsbCBzcGVlZCBmaWx0ZXIgb24gaGVhdG1hcHNcclxubGV0IGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gZmFsc2U7XHJcbi8vIGdsb2JhbCB2YXJpYWJsZXMgdXNlZCB3aXRoIGRhdGUgcmFuZ2UgZmlsdGVyXHJcbmxldCBzdGFydERhdGU7XHJcbmxldCBlbmREYXRlO1xyXG5cclxuLy8gRklYTUU6IHJlbmRlcmluZyBhIHNhdmVkIGhlYXRtYXAgd2l0aCBkYXRlIGZpbHRlciBzb21ldGltZXMgYnVncyBvdXRcclxuXHJcbmNvbnN0IGhlYXRtYXBEYXRhID0ge1xyXG5cclxuICBnZXRVc2VyU2hvdHMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlbW92ZXMgYW4gZXhpc3RpbmcgaGVhdG1hcCBpZiBuZWNlc3NhcnkgYW5kIHRoZW4gZGV0ZXJtaW5lcyB3aGV0aGVyXHJcbiAgICAvLyB0byBjYWxsIHRoZSBiYXNpYyBoZWF0bWFwIG9yIHNhdmVkIGhlYXRtYXAgZnVuY3Rpb25zXHJcblxyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuXHJcbiAgICBjb25zdCBoZWF0bWFwTmFtZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuICAgIGNvbnN0IGZpZWxkSGVhdG1hcENhbnZhcyA9IGZpZWxkQ29udGFpbmVyLmNoaWxkTm9kZXNbMl1cclxuICAgIGNvbnN0IGdvYWxIZWF0bWFwQ2FudmFzID0gZ29hbENvbnRhaW5lci5jaGlsZE5vZGVzWzFdXHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBhbHJlYWR5IGEgaGVhdG1hcCBsb2FkZWQsIHJlbW92ZSBpdCBiZWZvcmUgY29udGludWluZ1xyXG4gICAgaWYgKGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGZpZWxkSGVhdG1hcENhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgZ29hbEhlYXRtYXBDYW52YXMucmVtb3ZlKCk7XHJcbiAgICAgIGlmIChoZWF0bWFwTmFtZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgICBoZWF0bWFwRGF0YS5mZXRjaEJhc2ljSGVhdG1hcERhdGEoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBoZWF0bWFwRGF0YS5mZXRjaFNhdmVkSGVhdG1hcERhdGEoKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGhlYXRtYXBOYW1lID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBnb2VzIHRvIHRoZSBkYXRhYmFzZSBhbmQgcmV0cmlldmVzIHNob3RzIHRoYXQgbWVldCBzcGVjaWZpYyBmaWx0ZXJzIChhbGwgc2hvdHMgZmV0Y2hlZCBpZiApXHJcbiAgICBsZXQgZ2FtZUlkc19kYXRlID0gW107XHJcbiAgICBsZXQgZ2FtZUlkc19yZXN1bHQgPSBbXTtcclxuICAgIGxldCBnYW1lSWRzID0gW107IC8vIGFycmF5IHRoYXQgY29udGFpbnMgZ2FtZSBJRCB2YWx1ZXMgcGFzc2luZyBib3RoIHRoZSBkYXRlIGFuZCBnYW1lIHJlc3VsdCBmaWx0ZXJzXHJcbiAgICBjb25zdCBnYW1lUmVzdWx0RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVJlc3VsdFwiKS52YWx1ZTtcclxuICAgIGNvbnN0IGdhbWVVUkxleHRlbnNpb24gPSBoZWF0bWFwRGF0YS5hcHBseUdhbWVGaWx0ZXJzKCk7XHJcblxyXG4gICAgQVBJLmdldEFsbChnYW1lVVJMZXh0ZW5zaW9uKVxyXG4gICAgICAudGhlbihnYW1lcyA9PiB7XHJcbiAgICAgICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgICAgIC8vIHRoZSBkYXRlIGZpbHRlciBhbmQgZ2FtZSByZXN1bHRzIGZpbHRlcnMgY2Fubm90IGJlIGFwcGxpZWQgaW4gdGhlIEpTT04gc2VydmVyIFVSTCwgc28gdGhlIGZpbHRlcnMgYXJlXHJcbiAgICAgICAgICAvLyBjYWxsZWQgaGVyZS4gRWFjaCBmdW5jdGlvbiBwb3B1bGF0ZXMgYW4gYXJyYXkgd2l0aCBnYW1lIElEcyB0aGF0IG1hdGNoIHRoZSBmaWx0ZXIgcmVxdWlyZW1lbnRzLlxyXG4gICAgICAgICAgLy8gYSBmaWx0ZXIgbWV0aG9kIGlzIHRoZW4gdXNlZCB0byBjb2xsZWN0IGFsbCBtYXRjaGluZyBnYW1lIElEcyBmcm9tIHRoZSB0d28gYXJyYXlzIChpLmUuIGEgZ2FtZSB0aGF0IHBhc3NlZFxyXG4gICAgICAgICAgLy8gdGhlIHJlcXVpcmVtZW50cyBvZiBib3RoIGZpbHRlcnMpXHJcbiAgICAgICAgICAvLyBOT1RFOiBpZiBzdGFydCBkYXRlIGlzIG5vdCBkZWZpbmVkLCB0aGUgcmVzdWx0IGZpbHRlciBpcyB0aGUgb25seSBmdW5jdGlvbiBjYWxsZWQsIGFuZCBpdCBpcyBwYXNzZWQgdGhlIHRoaXJkIGFycmF5XHJcbiAgICAgICAgICBpZiAoc3RhcnREYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgZGF0ZUZpbHRlci5hcHBseWRhdGVGaWx0ZXIoc3RhcnREYXRlLCBlbmREYXRlLCBnYW1lSWRzX2RhdGUsIGdhbWUpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5hcHBseUdhbWVSZXN1bHRGaWx0ZXIoZ2FtZVJlc3VsdEZpbHRlciwgZ2FtZUlkc19yZXN1bHQsIGdhbWUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYXBwbHlHYW1lUmVzdWx0RmlsdGVyKGdhbWVSZXN1bHRGaWx0ZXIsIGdhbWVJZHMsIGdhbWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYgKHN0YXJ0RGF0ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBnYW1lSWRzID0gZ2FtZUlkc19kYXRlLmZpbHRlcihpZCA9PiBnYW1lSWRzX3Jlc3VsdC5pbmNsdWRlcyhpZCkpXHJcbiAgICAgICAgICByZXR1cm4gZ2FtZUlkcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGdhbWVJZHM7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKGdhbWVJZHMgPT4ge1xyXG4gICAgICAgIGlmIChnYW1lSWRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgYWxlcnQoXCJTb3JyeSEgRWl0aGVyIG5vIHNob3RzIGhhdmUgYmVlbiBzYXZlZCB5ZXQgb3Igbm8gZ2FtZXMgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy4gVmlzaXQgdGhlIEdhbWVwbGF5IHBhZ2UgdG8gZ2V0IHN0YXJ0ZWQgb3IgdG8gYWRkIG1vcmUgc2hvdHMuXCIpXHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3Qgc2hvdFVSTGV4dGVuc2lvbiA9IGhlYXRtYXBEYXRhLmFwcGx5U2hvdEZpbHRlcnMoZ2FtZUlkcyk7XHJcbiAgICAgICAgICBBUEkuZ2V0QWxsKHNob3RVUkxleHRlbnNpb24pXHJcbiAgICAgICAgICAgIC50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgICAgICBpZiAoc2hvdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIlNvcnJ5ISBObyBzaG90cyBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLiBWaXNpdCB0aGUgR2FtZXBsYXkgcGFnZSB0byBnZXQgc3RhcnRlZCBvciBhZGQgdG8gbW9yZSBzaG90cy5cIilcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBnbG9iYWxTaG90c0FyciA9IHNob3RzO1xyXG4gICAgICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgICAgICBmZWVkYmFjay5sb2FkRmVlZGJhY2soc2hvdHMpO1xyXG4gICAgICAgICAgICAgICAgLy8gaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKGhlYXRtYXBEYXRhLmdldEFjdGl2ZU9mZnNldHMsIDUwMCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiwgYW5kIGl0cyBjb3VudGVycGFydCBmZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMgcmVuZGVyIGFuIGFscmVhZHktc2F2ZWQgaGVhdG1hcCB0aG91Z2ggdGhlc2Ugc3RlcHM6XHJcbiAgICAvLyAxLiBnZXR0aW5nIHRoZSBoZWF0bWFwIG5hbWUgZnJvbSB0aGUgZHJvcGRvd24gdmFsdWVcclxuICAgIC8vIDIuIHVzaW5nIHRoZSBuYW1lIHRvIGZpbmQgdGhlIGNoaWxkTm9kZXMgaW5kZXggb2YgdGhlIGRyb3Bkb3duIHZhbHVlIChpLmUuIHdoaWNoIEhUTUwgPG9wdGlvbj4pIGFuZCBnZXQgaXRzIElEXHJcbiAgICAvLyAzLiBmZXRjaCBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzIHdpdGggbWF0Y2hpbmcgaGVhdG1hcCBJRFxyXG4gICAgLy8gNC4gZmV0Y2ggc2hvdHMgdXNpbmcgc2hvdCBJRHMgZnJvbSBqb2luIHRhYmxlc1xyXG4gICAgLy8gNS4gcmVuZGVyIGhlYXRtYXAgYnkgY2FsbGluZyBidWlsZCBmdW5jdGlvbnNcclxuXHJcbiAgICAvLyBzdGVwIDE6IGdldCBuYW1lIG9mIGhlYXRtYXBcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG4gICAgLy8gc3RlcCAyOiB1c2UgbmFtZSB0byBnZXQgaGVhdG1hcCBJRCBzdG9yZWQgaW4gSFRNTCBvcHRpb24gZWxlbWVudFxyXG4gICAgbGV0IGN1cnJlbnRIZWF0bWFwSWQ7XHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkge1xyXG4gICAgICAgIGN1cnJlbnRIZWF0bWFwSWQgPSBjaGlsZC5pZC5zbGljZSg4KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBzdGVwIDM6IGZldGNoIGpvaW4gdGFibGVzXHJcbiAgICBBUEkuZ2V0QWxsKGBzaG90X2hlYXRtYXA/aGVhdG1hcElkPSR7Y3VycmVudEhlYXRtYXBJZH1gKVxyXG4gICAgICAudGhlbihqb2luVGFibGVzID0+IGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyhqb2luVGFibGVzKVxyXG4gICAgICAgIC8vIHN0ZXAgNTogcGFzcyBzaG90cyB0byBidWlsZEZpZWxkSGVhdG1hcCgpIGFuZCBidWlsZEdvYWxIZWF0bWFwKClcclxuICAgICAgICAudGhlbihzaG90cyA9PiB7XHJcbiAgICAgICAgICAvLyBhcHBseSBkYXRlIGZpbHRlciBpZiBmaWx0ZXIgaGFzIGJlZW4gc2V0XHJcbiAgICAgICAgICBpZiAoc3RhcnREYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGV0IHNob3RzTWF0Y2hpbmdGaWx0ZXIgPSBbXTtcclxuICAgICAgICAgICAgZGF0ZUZpbHRlci5hcHBseWRhdGVGaWx0ZXJUb1NhdmVkSGVhdG1hcChzdGFydERhdGUsIGVuZERhdGUsIHNob3RzLCBzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHNNYXRjaGluZ0ZpbHRlcik7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkR29hbEhlYXRtYXAoc2hvdHNNYXRjaGluZ0ZpbHRlcik7XHJcbiAgICAgICAgICAgIGdsb2JhbFNob3RzQXJyID0gc2hvdHNNYXRjaGluZ0ZpbHRlciAvLyBJTVBPUlRBTlQhIHByZXZlbnRzIGVycm9yIGluIGhlYXRtYXAgc2F2ZSB3aGVuIHJlbmRlcmluZyBzYXZlZCBtYXAgYWZ0ZXIgcmVuZGVyaW5nIGJhc2ljIGhlYXRtYXBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgIGdsb2JhbFNob3RzQXJyID0gc2hvdHMgLy8gSU1QT1JUQU5UISBwcmV2ZW50cyBlcnJvciBpbiBoZWF0bWFwIHNhdmUgd2hlbiByZW5kZXJpbmcgc2F2ZWQgbWFwIGFmdGVyIHJlbmRlcmluZyBiYXNpYyBoZWF0bWFwXHJcbiAgICAgICAgICAgIGZlZWRiYWNrLmxvYWRGZWVkYmFjayhzaG90cyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBqb2luVGFibGVBcnIgPSBbXTtcclxuICAgICAgICB9KVxyXG4gICAgICApXHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hTYXZlZFNob3RzVXNpbmdKb2luVGFibGVzKGpvaW5UYWJsZXMpIHtcclxuICAgIC8vIHNlZSBub3RlcyBvbiBmZXRjaFNhdmVkSGVhdG1hcERhdGEoKVxyXG4gICAgam9pblRhYmxlcy5mb3JFYWNoKHRhYmxlID0+IHtcclxuICAgICAgLy8gc3RlcCA0LiB0aGVuIGZldGNoIHVzaW5nIGVhY2ggc2hvdElkIGluIHRoZSBqb2luIHRhYmxlc1xyXG4gICAgICBqb2luVGFibGVBcnIucHVzaChBUEkuZ2V0U2luZ2xlSXRlbShcInNob3RzXCIsIHRhYmxlLnNob3RJZCkpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW5UYWJsZUFycilcclxuICB9LFxyXG5cclxuICBhcHBseUdhbWVGaWx0ZXJzKCkge1xyXG4gICAgLy8gTk9URTogZ2FtZSByZXN1bHQgZmlsdGVyICh2aWN0b3J5L2RlZmVhdCkgY2Fubm90IGJlIGFwcGxpZWQgaW4gdGhpcyBmdW5jdGlvbiBhbmQgaXMgYXBwbGllZCBhZnRlciB0aGUgZmV0Y2hcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICBjb25zdCBnYW1lTW9kZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVNb2RlXCIpLnZhbHVlO1xyXG4gICAgY29uc3QgZ2FtZXR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lVHlwZVwiKS52YWx1ZTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItb3ZlcnRpbWVcIikudmFsdWU7XHJcbiAgICBjb25zdCB0ZWFtU3RhdHVzRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItdGVhbVN0YXR1c1wiKS52YWx1ZTtcclxuXHJcbiAgICBsZXQgVVJMID0gXCJnYW1lc1wiO1xyXG5cclxuICAgIFVSTCArPSBgP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gO1xyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBpZiAoZ2FtZU1vZGVGaWx0ZXIgPT09IFwiQ29tcGV0aXRpdmVcIikge1xyXG4gICAgICBVUkwgKz0gXCImbW9kZT1jb21wZXRpdGl2ZVwiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWVNb2RlRmlsdGVyID09PSBcIkNhc3VhbFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZtb2RlPWNhc3VhbFwiXHJcbiAgICB9XHJcbiAgICAvLyBnYW1lIHR5cGVcclxuICAgIGlmIChnYW1ldHlwZUZpbHRlciA9PT0gXCIzdjNcIikge1xyXG4gICAgICBVUkwgKz0gXCImdHlwZT0zdjNcIlxyXG4gICAgfSBlbHNlIGlmIChnYW1ldHlwZUZpbHRlciA9PT0gXCIydjJcIikge1xyXG4gICAgICBVUkwgKz0gXCImdHlwZT0ydjJcIlxyXG4gICAgfSBlbHNlIGlmIChnYW1ldHlwZUZpbHRlciA9PT0gXCIxdjFcIikge1xyXG4gICAgICBVUkwgKz0gXCImdHlwZT0xdjFcIlxyXG4gICAgfVxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGlmIChvdmVydGltZUZpbHRlciA9PT0gXCJPVFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZvdmVydGltZT10cnVlXCJcclxuICAgIH0gZWxzZSBpZiAob3ZlcnRpbWVGaWx0ZXIgPT09IFwiTm8gT1RcIikge1xyXG4gICAgICBVUkwgKz0gXCImb3ZlcnRpbWU9ZmFsc2VcIlxyXG4gICAgfVxyXG4gICAgLy8gdGVhbSBzdGF0dXNcclxuICAgIGlmICh0ZWFtU3RhdHVzRmlsdGVyID09PSBcIk5vIHBhcnR5XCIpIHtcclxuICAgICAgVVJMICs9IFwiJnBhcnR5PWZhbHNlXCJcclxuICAgIH0gZWxzZSBpZiAodGVhbVN0YXR1c0ZpbHRlciA9PT0gXCJQYXJ0eVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZwYXJ0eT10cnVlXCJcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVVJMO1xyXG4gIH0sXHJcblxyXG4gIGFwcGx5R2FtZVJlc3VsdEZpbHRlcihnYW1lUmVzdWx0RmlsdGVyLCBnYW1lSWRzLCBnYW1lKSB7XHJcbiAgICAvLyBpZiB2aWN0b3J5LCB0aGVuIGNoZWNrIGZvciBnYW1lJ3Mgc2NvcmUgdnMgZ2FtZSdzIG9wcG9uZW50IHNjb3JlXHJcbiAgICAvLyBpZiB0aGUgZmlsdGVyIGlzbid0IHNlbGVjdGVkIGF0IGFsbCwgcHVzaCBhbGwgZ2FtZSBJRHMgdG8gZ2FtZUlkcyBhcnJheVxyXG4gICAgaWYgKGdhbWVSZXN1bHRGaWx0ZXIgPT09IFwiVmljdG9yeVwiKSB7XHJcbiAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoZ2FtZVJlc3VsdEZpbHRlciA9PT0gXCJEZWZlYXRcIikge1xyXG4gICAgICBpZiAoZ2FtZS5zY29yZSA8IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlTaG90RmlsdGVycyhnYW1lSWRzKSB7XHJcbiAgICBjb25zdCBzaG90VHlwZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLXNob3RUeXBlXCIpLnZhbHVlO1xyXG4gICAgbGV0IFVSTCA9IFwic2hvdHNcIlxyXG5cclxuICAgIC8vIGdhbWUgSURcclxuICAgIC8vIGZvciBlYWNoIGdhbWVJZCwgYXBwZW5kIFVSTC4gQXBwZW5kICYgaW5zdGVhZCBvZiA/IG9uY2UgZmlyc3QgZ2FtZUlkIGlzIGFkZGVkIHRvIFVSTFxyXG4gICAgaWYgKGdhbWVJZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBsZXQgZ2FtZUlkQ291bnQgPSAwO1xyXG4gICAgICBnYW1lSWRzLmZvckVhY2goaWQgPT4ge1xyXG4gICAgICAgIGlmIChnYW1lSWRDb3VudCA8IDEpIHtcclxuICAgICAgICAgIFVSTCArPSBgP2dhbWVJZD0ke2lkfWA7XHJcbiAgICAgICAgICBnYW1lSWRDb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBVUkwgKz0gYCZnYW1lSWQ9JHtpZH1gO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0gLy8gZWxzZSBzdGF0ZW1lbnQgaXMgaGFuZGxlZCBpbiBmZXRjaEJhc2ljSGVhdG1hcERhdGEoKVxyXG4gICAgLy8gc2hvdCB0eXBlXHJcbiAgICBpZiAoc2hvdFR5cGVGaWx0ZXIgPT09IFwiQWVyaWFsXCIpIHtcclxuICAgICAgVVJMICs9IFwiJmFlcmlhbD10cnVlXCI7XHJcbiAgICB9IGVsc2UgaWYgKHNob3RUeXBlRmlsdGVyID09PSBcIlN0YW5kYXJkXCIpIHtcclxuICAgICAgVVJMICs9IFwiJmFlcmlhbD1mYWxzZVwiXHJcbiAgICB9XHJcbiAgICByZXR1cm4gVVJMO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkFycmF5IG9mIHNob3RzXCIsIHNob3RzKVxyXG5cclxuICAgIC8vIGNyZWF0ZSBmaWVsZCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBsZXQgdmFyV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB2YXJIZWlnaHQgPSBmaWVsZENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgbGV0IGZpZWxkQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0RmllbGRDb25maWcoZmllbGRDb250YWluZXIpO1xyXG5cclxuICAgIGxldCBmaWVsZEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIGZpZWxkSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZmllbGRDb25maWcpO1xyXG5cclxuICAgIGxldCBmaWVsZERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZmllbGRYICogdmFyV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZmllbGRZICogdmFySGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIC8vIHNldCB2YWx1ZSBhcyBiYWxsIHNwZWVkIGlmIHNwZWVkIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgICB2YWx1ZV8gPSBzaG90LmJhbGxfc3BlZWQ7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IGZpZWxkT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZmllbGREYXRhUG9pbnRzLnB1c2goZmllbGRPYmopO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZmllbGREYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZmllbGREYXRhUG9pbnRzXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHNldCBtYXggdmFsdWUgYXMgbWF4IGJhbGwgc3BlZWQgaW4gc2hvdHMsIGlmIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgIGxldCBtYXhCYWxsU3BlZWQgPSBzaG90cy5yZWR1Y2UoKG1heCwgc2hvdCkgPT4gc2hvdC5iYWxsX3NwZWVkID4gbWF4ID8gc2hvdC5iYWxsX3NwZWVkIDogbWF4LCBzaG90c1swXS5iYWxsX3NwZWVkKTtcclxuICAgICAgZmllbGREYXRhLm1heCA9IG1heEJhbGxTcGVlZDtcclxuICAgIH1cclxuXHJcbiAgICBmaWVsZEhlYXRtYXBJbnN0YW5jZS5zZXREYXRhKGZpZWxkRGF0YSk7XHJcblxyXG4gICAgbGV0IGluaXRpYWxXaWR0aCA9IHZhcldpZHRoO1xyXG5cclxuICAgIGlmIChpbnRlcnZhbElkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcclxuICAgICAgaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHsgaGVhdG1hcERhdGEuZ2V0QWN0aXZlT2Zmc2V0cyhmaWVsZENvbnRhaW5lciwgaW5pdGlhbFdpZHRoLCBzaG90cyk7IH0sIDUwMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkgeyBoZWF0bWFwRGF0YS5nZXRBY3RpdmVPZmZzZXRzKGZpZWxkQ29udGFpbmVyLCBpbml0aWFsV2lkdGgsIHNob3RzKTsgfSwgNTAwKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgZ2V0QWN0aXZlT2Zmc2V0cyhmaWVsZENvbnRhaW5lciwgaW5pdGlhbFdpZHRoLCBzaG90cykge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlIHdpZHRoIG9mIHRoZSBoZWF0bWFwIGNvbnRhaW5lciBhdCAwLjUgc2Vjb25kIGludGVydmFscy4gSWYgdGhlIHdpZHRoIGhhcyBjaGFuZ2VkLFxyXG4gICAgLy8gdGhlbiB0aGUgaGVhdG1hcCBjYW52YXMgaXMgcmVwYWludGVkIHRvIGZpdCB3aXRoaW4gdGhlIGNvbnRhaW5lciBsaW1pdHNcclxuICAgIGxldCB3aWR0aCA9IGluaXRpYWxXaWR0aDtcclxuXHJcbiAgICBsZXQgY2FwdHVyZVdpZHRoID0gZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGhcclxuICAgIC8vZXZhbHVhdGUgY29udGFpbmVyIHdpZHRoIGFmdGVyIDAuNSBzZWNvbmRzIHZzIGluaXRpYWwgY29udGFpbmVyIHdpZHRoXHJcbiAgICBpZiAoY2FwdHVyZVdpZHRoID09PSB3aWR0aCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcInVuY2hhbmdlZFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpZHRoID0gY2FwdHVyZVdpZHRoO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIm5ldyB3aWR0aFwiLCB3aWR0aCk7XHJcbiAgICAgIC8vIHJlbW92ZSBjdXJyZW50IGhlYXRtYXBzXHJcbiAgICAgIGNvbnN0IGhlYXRtYXBDYW52YXNBcnIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmhlYXRtYXAtY2FudmFzXCIpO1xyXG4gICAgICBoZWF0bWFwQ2FudmFzQXJyWzBdLnJlbW92ZSgpO1xyXG4gICAgICBoZWF0bWFwQ2FudmFzQXJyWzFdLnJlbW92ZSgpO1xyXG4gICAgICAvLyByZXBhaW50IHNhbWUgaGVhdG1hcCBpbnN0YW5jZVxyXG4gICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90cyk7XHJcbiAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkR29hbEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR29hbEhlYXRtYXAoc2hvdHMpIHtcclxuICAgIC8vIGNyZWF0ZSBnb2FsIGhlYXRtYXAgd2l0aCBjb25maWd1cmF0aW9uXHJcbiAgICBjb25zdCBnb2FsQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBsZXQgdmFyR29hbFdpZHRoID0gZ29hbENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB2YXJHb2FsSGVpZ2h0ID0gZ29hbENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgbGV0IGdvYWxDb25maWcgPSBoZWF0bWFwRGF0YS5nZXRHb2FsQ29uZmlnKGdvYWxDb250YWluZXIpO1xyXG5cclxuICAgIGxldCBHb2FsSGVhdG1hcEluc3RhbmNlO1xyXG4gICAgR29hbEhlYXRtYXBJbnN0YW5jZSA9IGhlYXRtYXAuY3JlYXRlKGdvYWxDb25maWcpO1xyXG5cclxuICAgIGxldCBnb2FsRGF0YVBvaW50cyA9IFtdO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCB4XyA9IE51bWJlcigoc2hvdC5nb2FsWCAqIHZhckdvYWxXaWR0aCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB5XyA9IE51bWJlcigoc2hvdC5nb2FsWSAqIHZhckdvYWxIZWlnaHQpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgdmFsdWVfID0gMTtcclxuICAgICAgLy8gc2V0IHZhbHVlIGFzIGJhbGwgc3BlZWQgaWYgc3BlZWQgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICAgIHZhbHVlXyA9IHNob3QuYmFsbF9zcGVlZDtcclxuICAgICAgfVxyXG4gICAgICBsZXQgZ29hbE9iaiA9IHsgeDogeF8sIHk6IHlfLCB2YWx1ZTogdmFsdWVfIH07XHJcbiAgICAgIGdvYWxEYXRhUG9pbnRzLnB1c2goZ29hbE9iaik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBnb2FsRGF0YSA9IHtcclxuICAgICAgbWF4OiAxLFxyXG4gICAgICBtaW46IDAsXHJcbiAgICAgIGRhdGE6IGdvYWxEYXRhUG9pbnRzXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IG1heCB2YWx1ZSBhcyBtYXggYmFsbCBzcGVlZCBpbiBzaG90cywgaWYgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgbGV0IG1heEJhbGxTcGVlZCA9IHNob3RzLnJlZHVjZSgobWF4LCBzaG90KSA9PiBzaG90LmJhbGxfc3BlZWQgPiBtYXggPyBzaG90LmJhbGxfc3BlZWQgOiBtYXgsIHNob3RzWzBdLmJhbGxfc3BlZWQpO1xyXG4gICAgICBnb2FsRGF0YS5tYXggPSBtYXhCYWxsU3BlZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgR29hbEhlYXRtYXBJbnN0YW5jZS5zZXREYXRhKGdvYWxEYXRhKTtcclxuICB9LFxyXG5cclxuICBnZXRGaWVsZENvbmZpZyhmaWVsZENvbnRhaW5lcikge1xyXG4gICAgLy8gSWRlYWwgcmFkaXVzIGlzIGFib3V0IDI1cHggYXQgNTUwcHggd2lkdGgsIG9yIDQuNTQ1JVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29udGFpbmVyOiBmaWVsZENvbnRhaW5lcixcclxuICAgICAgcmFkaXVzOiAwLjA0NTQ1NDU0NSAqIGZpZWxkQ29udGFpbmVyLm9mZnNldFdpZHRoLFxyXG4gICAgICBtYXhPcGFjaXR5OiAuNixcclxuICAgICAgbWluT3BhY2l0eTogMCxcclxuICAgICAgYmx1cjogLjg1XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGdldEdvYWxDb25maWcoZ29hbENvbnRhaW5lcikge1xyXG4gICAgLy8gSWRlYWwgcmFkaXVzIGlzIGFib3V0IDM1cHggYXQgNTUwcHggd2lkdGgsIG9yIDYuMzYzJVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29udGFpbmVyOiBnb2FsQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IC4wNjM2MzYzNjMgKiBnb2FsQ29udGFpbmVyLm9mZnNldFdpZHRoLFxyXG4gICAgICBtYXhPcGFjaXR5OiAuNixcclxuICAgICAgbWluT3BhY2l0eTogMCxcclxuICAgICAgYmx1cjogLjg1XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGJhbGxTcGVlZE1heCgpIHtcclxuICAgIC8vIHRoaXMgYnV0dG9uIGZ1bmN0aW9uIGNhbGxiYWNrIChpdCdzIGEgZmlsdGVyKSBjaGFuZ2VzIGEgYm9vbGVhbiBnbG9iYWwgdmFyaWFibGUgdGhhdCBkZXRlcm1pbmVzIHRoZSBtaW4gYW5kIG1heCB2YWx1ZXNcclxuICAgIC8vIHVzZWQgd2hlbiByZW5kZXJpbmcgdGhlIGhlYXRtYXBzIChzZWUgYnVpbGRGaWVsZEhlYXRtYXAoKSBhbmQgYnVpbGRHb2FsSGVhdG1hcCgpKVxyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRCdG5cIik7XHJcblxyXG4gICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgIGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gZmFsc2U7XHJcbiAgICAgIGJhbGxTcGVlZEJ0bi5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCA9IHRydWU7XHJcbiAgICAgIGJhbGxTcGVlZEJ0bi5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2F2ZUhlYXRtYXAoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBzYXZpbmcgYSBoZWF0bWFwIG9iamVjdCB3aXRoIGEgbmFtZSwgdXNlcklkLCBhbmQgZGF0ZSAtIHRoZW4gbWFraW5nIGpvaW4gdGFibGVzIHdpdGggaGVhdG1hcElkIGFuZCBlYWNoIHNob3RJZFxyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBjb25zdCBzYXZlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuICAgIGNvbnN0IHNhdmVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlSGVhdG1hcEJ0blwiKTtcclxuICAgIGxldCBoZWF0bWFwTmFtZUlzVW5pcXVlID0gdHJ1ZTtcclxuXHJcbiAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IHRydWU7IC8vIGltbWVkaWF0ZWx5IGRpc2FibGUgc2F2ZSBidXR0b24gdG8gcHJldmVudCBtdWx0aXBsZSBjbGlja3NcclxuICAgIGNvbnN0IGhlYXRtYXBUaXRsZSA9IHNhdmVJbnB1dC52YWx1ZTtcclxuICAgIGNvbnN0IGZpZWxkSGVhdG1hcENhbnZhcyA9IGZpZWxkQ29udGFpbmVyLmNoaWxkTm9kZXNbMl07XHJcblxyXG4gICAgLy8gMS4gaGVhdG1hcCBtdXN0IGhhdmUgdGl0bGUgJiB0aGUgdGl0bGUgY2Fubm90IGJlIFwiU2F2ZSBzdWNjZXNzZnVsIVwiIG9yIFwiQmFzaWMgSGVhdG1hcFwiIG9yIFwiQ2Fubm90IHNhdmUgcHJpb3IgaGVhdG1hcFwiIG9yIFwiTm8gdGl0bGUgcHJvdmlkZWRcIiBvciBcIkhlYXRtYXAgbmFtZSBub3QgdW5pcXVlXCJcclxuICAgIC8vIDIuIHRoZXJlIG11c3QgYmUgYSBoZWF0bWFwIGNhbnZhcyBsb2FkZWQgb24gdGhlIHBhZ2VcclxuICAgIC8vIDMuIChzZWUgc2Vjb25kIGlmIHN0YXRlbWVudCkgdGhlIHNhdmUgYnV0dG9uIHdpbGwgcmVzcG9uZCB3b3JrIGlmIHRoZSB1c2VyIGlzIHRyeWluZyB0byBzYXZlIGFuIGFscmVhZHktc2F2ZWQgaGVhdG1hcFxyXG4gICAgaWYgKGhlYXRtYXBUaXRsZS5sZW5ndGggPiAwICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJTYXZlIHN1Y2Nlc3NmdWxcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiQmFzaWMgSGVhdG1hcFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCIgJiYgaGVhdG1hcFRpdGxlICE9PSBcIkNhbm5vdCBzYXZlIHByaW9yIGhlYXRtYXBcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiSGVhdG1hcCBuYW1lIG5vdCB1bmlxdWVcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiTm8gdGl0bGUgcHJvdmlkZWRcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiTm8gaGVhdG1hcCBsb2FkZWRcIiAmJiBmaWVsZEhlYXRtYXBDYW52YXMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAoaGVhdG1hcERyb3Bkb3duLnZhbHVlICE9PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICAgIHNhdmVJbnB1dC52YWx1ZSA9IFwiQ2Fubm90IHNhdmUgcHJpb3IgaGVhdG1hcFwiXHJcbiAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBjaGVjayBmb3IgdW5pcXVlIGhlYXRtYXAgbmFtZSAtIGlmIGl0J3MgdW5pcXVlIHRoZW4gc2F2ZSB0aGUgaGVhdG1hcCBhbmQgam9pbiB0YWJsZXNcclxuICAgICAgICBBUEkuZ2V0QWxsKGBoZWF0bWFwcz91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICAgICAgICAgIC50aGVuKGhlYXRtYXBzID0+IHtcclxuICAgICAgICAgICAgaGVhdG1hcHMuZm9yRWFjaChoZWF0bWFwID0+IHtcclxuICAgICAgICAgICAgICBpZiAoaGVhdG1hcC5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGhlYXRtYXBUaXRsZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwTmFtZUlzVW5pcXVlID0gZmFsc2UgLy8gaWYgYW55IG5hbWVzIG1hdGNoLCB2YXJpYWJsZSBiZWNvbWVzIGZhbHNlXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvLyBpZiBuYW1lIGlzIHVuaXF1ZSAtIGFsbCBjb25kaXRpb25zIG1ldCAtIHNhdmUgaGVhdG1hcFxyXG4gICAgICAgICAgICBpZiAoaGVhdG1hcE5hbWVJc1VuaXF1ZSkge1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtc3VjY2Vzc1wiKTtcclxuICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5zYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUsIGFjdGl2ZVVzZXJJZClcclxuICAgICAgICAgICAgICAgIC50aGVuKGhlYXRtYXBPYmogPT4gaGVhdG1hcERhdGEuc2F2ZUpvaW5UYWJsZXMoaGVhdG1hcE9iaikudGhlbih4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqb2luIHRhYmxlcyBzYXZlZFwiLCB4KVxyXG4gICAgICAgICAgICAgICAgICAvLyBlbXB0eSB0aGUgdGVtcG9yYXJ5IGdsb2JhbCBhcnJheSB1c2VkIHdpdGggUHJvbWlzZS5hbGxcclxuICAgICAgICAgICAgICAgICAgam9pblRhYmxlQXJyID0gW107XHJcbiAgICAgICAgICAgICAgICAgIC8vIGFwcGVuZCBuZXdseSBjcmVhdGVkIGhlYXRtYXAgYXMgb3B0aW9uIGVsZW1lbnQgaW4gc2VsZWN0IGRyb3Bkb3duXHJcbiAgICAgICAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwgeyBcImlkXCI6IGBoZWF0bWFwLSR7aGVhdG1hcE9iai5pZH1gIH0sIGAke2hlYXRtYXBPYmoudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXX06ICR7aGVhdG1hcE9iai5uYW1lfWApKTtcclxuICAgICAgICAgICAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJTYXZlIHN1Y2Nlc3NmdWxcIjtcclxuICAgICAgICAgICAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgICAgICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIkhlYXRtYXAgbmFtZSBub3QgdW5pcXVlXCI7XHJcbiAgICAgICAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHNhdmVJbnB1dC52YWx1ZSA9IFwiTm8gdGl0bGUgcHJvdmlkZWRcIjtcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2UgaWYgKGZpZWxkSGVhdG1hcENhbnZhcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJObyBoZWF0bWFwIGxvYWRlZFwiO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNhdmVIZWF0bWFwT2JqZWN0KGhlYXRtYXBUaXRsZSwgYWN0aXZlVXNlcklkKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHNhdmVzIGEgaGVhdG1hcCBvYmplY3Qgd2l0aCB0aGUgdXNlci1wcm92aWRlZCBuYW1lLCB0aGUgdXNlcklkLCBhbmQgdGhlIGN1cnJlbnQgZGF0ZS90aW1lXHJcbiAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuICAgIGNvbnN0IGhlYXRtYXBPYmogPSB7XHJcbiAgICAgIG5hbWU6IGhlYXRtYXBUaXRsZSxcclxuICAgICAgdXNlcklkOiBhY3RpdmVVc2VySWQsXHJcbiAgICAgIHRpbWVTdGFtcDogdGltZVN0YW1wXHJcbiAgICB9XHJcbiAgICByZXR1cm4gQVBJLnBvc3RJdGVtKFwiaGVhdG1hcHNcIiwgaGVhdG1hcE9iailcclxuICB9LFxyXG5cclxuICBzYXZlSm9pblRhYmxlcyhoZWF0bWFwT2JqKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImdsb2JhbHNob3RzYXJyYXlcIiwgZ2xvYmFsU2hvdHNBcnIpXHJcbiAgICBnbG9iYWxTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgam9pblRhYmxlT2JqID0ge1xyXG4gICAgICAgIHNob3RJZDogc2hvdC5pZCxcclxuICAgICAgICBoZWF0bWFwSWQ6IGhlYXRtYXBPYmouaWRcclxuICAgICAgfVxyXG4gICAgICBqb2luVGFibGVBcnIucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90X2hlYXRtYXBcIiwgam9pblRhYmxlT2JqKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2luVGFibGVBcnIpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdGhlIGxvZ2ljIHRoYXQgcHJldmVudHMgdGhlIHVzZXIgZnJvbSBkZWxldGluZyBhIGhlYXRtYXAgaW4gb25lIGNsaWNrLlxyXG4gICAgLy8gYSBzZWNvbmQgZGVsZXRlIGJ1dHRvbiBhbmQgYSBjYW5jZWwgYnV0dG9uIGFyZSByZW5kZXJlZCBiZWZvcmUgYSBkZWxldGUgaXMgY29uZmlybWVkXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBpZiAoY3VycmVudERyb3Bkb3duVmFsdWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlSGVhdG1hcEJ0blwiKTtcclxuICAgICAgY29uc3QgY29uZmlybURlbGV0ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDb25maXJtIERlbGV0ZVwiKTtcclxuICAgICAgY29uc3QgcmVqZWN0RGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJDYW5jZWxcIik7XHJcbiAgICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZGVsZXRlQ29udHJvbFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGNvbmZpcm1EZWxldGVCdG4sIHJlamVjdERlbGV0ZUJ0bik7XHJcbiAgICAgIGRlbGV0ZUhlYXRtYXBCdG4ucmVwbGFjZVdpdGgoRGVsZXRlQ29udHJvbCk7XHJcbiAgICAgIGNvbmZpcm1EZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmNvbmZpcm1IZWF0bWFwRGVsZXRpb24pO1xyXG4gICAgICByZWplY3REZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLnJlamVjdEhlYXRtYXBEZWxldGlvbik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcmVqZWN0SGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZS1yZW5kZXJzIHRoZSBwcmltYXJ5IGRlbGV0ZSBidXR0b25cclxuICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUNvbnRyb2xcIik7XHJcbiAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImRlbGV0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkRlbGV0ZSBIZWF0bWFwXCIpXHJcbiAgICBEZWxldGVDb250cm9sLnJlcGxhY2VXaXRoKGRlbGV0ZUhlYXRtYXBCdG4pXHJcbiAgICBkZWxldGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwKTtcclxuICB9LFxyXG5cclxuICBjb25maXJtSGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB3aWxsIGRlbGV0ZSB0aGUgc2VsZWN0ZWQgaGVhdG1hcCBvcHRpb24gaW4gdGhlIGRyb3Bkb3duIGxpc3QgYW5kIHJlbW92ZSBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkge1xyXG4gICAgICAgIGNoaWxkLnJlbW92ZSgpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXBPYmplY3RhbmRKb2luVGFibGVzKGNoaWxkLmlkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24udmFsdWUgPSBcIkJhc2ljIEhlYXRtYXBcIjtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9LFxyXG5cclxuICBkZWxldGVIZWF0bWFwT2JqZWN0YW5kSm9pblRhYmxlcyhoZWF0bWFwSWQpIHtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICByZXR1cm4gQVBJLmRlbGV0ZUl0ZW0oXCJoZWF0bWFwc1wiLCBgJHtoZWF0bWFwSWQuc2xpY2UoOCl9P3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gIH0sXHJcblxyXG4gIGhhbmRsZUJhbGxTcGVlZEdsb2JhbFZhcmlhYmxlcygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCBieSB0aGUgcmVzZXQgZmlsdGVycyBidXR0b24gYW5kIG5hdmJhciBoZWF0bWFwcyB0YWIgdG8gZm9yY2UgdGhlIGJhbGwgc3BlZWQgZmlsdGVyIG9mZlxyXG4gICAgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKHJldHVybkJvb2xlYW4sIHN0YXJ0RGF0ZUlucHV0LCBlbmREYXRlSW5wdXQpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBTRVQgdGhlIGRhdGUgZmlsdGVyIGdsb2JhbCB2YXJpYWJsZXMgb24gdGhpcyBwYWdlIG9yIENMRUFSIHRoZW1cclxuICAgIC8vIGlmIHRoZSAxLiBwYWdlIGlzIHJlbG9hZGVkIG9yIDIuIHRoZSBcInJlc2V0IGZpbHRlcnNcIiBidXR0b24gaXMgY2xpY2tlZFxyXG5cclxuICAgIC8vIHRoZSBkYXRlRmlsdGVyLmpzIGNhbmNlbCBidXR0b24gcmVxdWVzdHMgYSBnbG9iYWwgdmFyIHRvIGRldGVybWluZSBob3cgdG8gaGFuZGxlIGJ1dHRvbiBjb2xvclxyXG4gICAgaWYgKHJldHVybkJvb2xlYW4pIHtcclxuICAgICAgcmV0dXJuIHN0YXJ0RGF0ZVxyXG4gICAgfVxyXG4gICAgLy8gaWYgbm8gaW5wdXQgdmFsdWVzIGFyZSBwcm92aWRlZCwgdGhhdCBtZWFucyB0aGUgdmFyaWFibGVzIG5lZWQgdG8gYmUgcmVzZXQgYW5kIHRoZSBkYXRlXHJcbiAgICAvLyBmaWx0ZXIgYnV0dG9uIHNob3VsZCBiZSBvdXRsaW5lZCAtIGVsc2Ugc2V0IGdsb2JhbCB2YXJzIGZvciBmaWx0ZXJcclxuICAgIGlmIChzdGFydERhdGVJbnB1dCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHN0YXJ0RGF0ZSA9IHVuZGVmaW5lZDtcclxuICAgICAgZW5kRGF0ZSA9IHVuZGVmaW5lZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHN0YXJ0RGF0ZSA9IHN0YXJ0RGF0ZUlucHV0O1xyXG4gICAgICBlbmREYXRlID0gZW5kRGF0ZUlucHV0O1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBwYWdlcyBzbyB0aGF0IHRoZSB3ZWJwYWdlIGRvZXNuJ3QgY29udGludWUgcnVubmluZyB0aGUgaGVhdG1hcCBjb250YWluZXIgd2lkdGggdHJhY2tlclxyXG4gICAgaWYgKGludGVydmFsSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsSWQpO1xyXG4gICAgICBpbnRlcnZhbElkID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGhlYXRtYXBEYXRhIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5cclxuY29uc3QgZmVlZGJhY2sgPSB7XHJcblxyXG4gIGxvYWRGZWVkYmFjayhzaG90cykge1xyXG5cclxuICAgIC8vIGZpcnN0LCB1c2UgdGhlIHNob3RzIHdlIGhhdmUgdG8gZmV0Y2ggdGhlIGdhbWVzIHRoZXkncmUgYXNzb2NpYXRlZCB3aXRoXHJcbiAgICBsZXQgZ2FtZUlkcyA9IFtdO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGdhbWVJZHMucHVzaChzaG90LmdhbWVJZCk7XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIHJlbW92ZSBkdXBsaWNhdGUgZ2FtZSBJRHNcclxuICAgIGdhbWVJZHMgPSBnYW1lSWRzLmZpbHRlcigoaXRlbSwgaWR4KSA9PiB7XHJcbiAgICAgIHJldHVybiBnYW1lSWRzLmluZGV4T2YoaXRlbSkgPT0gaWR4O1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5mZXRjaEdhbWVzKGdhbWVJZHMpXHJcbiAgICAgIC50aGVuKGdhbWVzID0+IHRoaXMuY2FsY3VsYXRlRmVlZGJhY2soc2hvdHMsIGdhbWVzKSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIGZldGNoR2FtZXMoZ2FtZUlkcykge1xyXG4gICAgbGV0IGdhbWVzID0gW107XHJcbiAgICBnYW1lSWRzLmZvckVhY2goZ2FtZUlkID0+IHtcclxuICAgICAgZ2FtZXMucHVzaChBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGdhbWVJZCkpXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChnYW1lcylcclxuICB9LFxyXG5cclxuICBjYWxjdWxhdGVGZWVkYmFjayhzaG90cywgZ2FtZXMpIHtcclxuXHJcbiAgICBsZXQgZmVlZGJhY2tSZXN1bHRzID0ge307XHJcblxyXG4gICAgLy8gZ2V0IGhlYXRtYXAgZGF0ZSBnZW5lcmF0ZWRcclxuICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCk7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubm93ID0gbm93O1xyXG5cclxuICAgIC8vIGNvbnZlcnQgZ2FtZSBkYXRlcyBvdXQgb2YgWiB0aW1lIHRvIGdldCBsb2NhbCB0aW1lem9uZSBhY2N1cmFjeVxyXG4gICAgbGV0IGdhbWVUaW1lcyA9IFtdO1xyXG4gICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgZ2FtZVRpbWVzLnB1c2gobmV3IERhdGUoZ2FtZS50aW1lU3RhbXApLnRvTG9jYWxlU3RyaW5nKCkuc3BsaXQoXCIsXCIpWzBdKTtcclxuICAgIH0pXHJcblxyXG4gICAgLy8gc29ydCBhcnJheSBvZiBkYXRlcyBmcm9tXHJcbiAgICBnYW1lVGltZXMuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICByZXR1cm4gIE51bWJlcihuZXcgRGF0ZShhKSkgLSBOdW1iZXIobmV3IERhdGUoYikpO1xyXG4gICAgfSlcclxuXHJcbiAgICAvLyBnZXQgcmFuZ2Ugb2YgZGF0ZXMgb24gZ2FtZXMgKG1heCBhbmQgbWluKVxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmxhc3RHYW1lID0gZ2FtZVRpbWVzLnBvcCgpXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuZmlyc3RHYW1lID0gZ2FtZVRpbWVzLnNoaWZ0KCk7XHJcblxyXG4gICAgLy8gZ2V0IGF2ZXJhZ2UgZmllbGQgeCx5IGNvb3JkaW5hdGUgb2YgcGxheWVyIGJhc2VkIG9uIHNob3RzIGFuZCBnaXZlIHBsYXllciBmZWVkYmFja1xyXG4gICAgbGV0IHN1bVggPSAwO1xyXG4gICAgbGV0IHN1bVkgPSAwO1xyXG4gICAgbGV0IGF2Z1g7XHJcbiAgICBsZXQgYXZnWTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBzdW1YICs9IHNob3QuZmllbGRYO1xyXG4gICAgICBzdW1ZICs9IHNob3QuZmllbGRZO1xyXG4gICAgfSlcclxuXHJcbiAgICBhdmdYID0gc3VtWCAvIHNob3RzLmxlbmd0aDtcclxuICAgIGF2Z1kgPSBzdW1ZIC8gc2hvdHMubGVuZ3RoO1xyXG4gICAgbGV0IGZpZWxkUG9zaXRpb247XHJcblxyXG4gICAgaWYgKGF2Z1ggPCAwLjE1KSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIktlZXBlclwiXHJcbiAgICB9IGVsc2UgaWYgKDAuMTUgPD0gYXZnWCAmJiBhdmdYIDw9IDAuMzApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiU3dlZXBlclwiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDwgMC40NSAmJiBhdmdZIDw9IDAuNDApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiTGVmdCBGdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDwgMC40NSAmJiAwLjYwIDw9IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiUmlnaHQgRnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8PSAwLjQ1KSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkNlbnRlciBGdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDwgMC42MCAmJiBhdmdZIDw9IDAuNDApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiTGVmdCBIYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDwgMC42MCAmJiAwLjYwIDw9IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiUmlnaHQgSGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8PSAwLjYwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkNlbnRlciBIYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNjAgPD0gYXZnWCAmJiBhdmdYIDwgMC43NSAmJiBhdmdZIDw9IDAuNTApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiTGVmdCBGb3J3YXJkXCJcclxuICAgIH0gZWxzZSBpZiAoMC42MCA8PSBhdmdYICYmIGF2Z1ggPCAwLjc1ICYmIDAuNTAgPCBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlJpZ2h0IEZvcndhcmRcIlxyXG4gICAgfSBlbHNlIGlmICgwLjc1IDw9IGF2Z1gpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiU3RyaWtlclwiXHJcbiAgICB9XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmZpZWxkUG9zaXRpb24gPSBmaWVsZFBvc2l0aW9uXHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIHBsYXllcnMgdGhhdCBjb21wbGltZW50IHRoZSBwbGF5ZXIncyBzdHlsZVxyXG4gICAgbGV0IGNvbXBsZW1lbnRBO1xyXG4gICAgbGV0IGNvbXBsZW1lbnRCO1xyXG5cclxuICAgIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIktlZXBlclwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJTd2VlcGVyXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiTGVmdCBGdWxsYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiUmlnaHQgRnVsbEJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiQ2VudGVyIEZ1bGxiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkxlZnQgSGFsZmJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlJpZ2h0IEhhbGZiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkNlbnRlciBIYWxmYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJTdHJpa2VyXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJMZWZ0IEZvcndhcmRcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiUmlnaHQgRm9yd2FyZFwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlN0cmlrZXJcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgIH1cclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY29tcGxlbWVudEEgPSBjb21wbGVtZW50QTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wbGVtZW50QiA9IGNvbXBsZW1lbnRCO1xyXG5cclxuICAgIC8vIHNob3RzIHNjb3JlZCBvbiB0ZWFtIHNpZGUgYW5kIG9wcG9uZW50IHNpZGUgb2YgZmllbGQsICYgZGVmZW5zaXZlIHJlZGlyZWN0cyAoaS5lLiB3aXRoaW4ga2VlcGVyIHJhbmdlIG9mIGdvYWwpXHJcbiAgICBsZXQgdGVhbVNpZGUgPSAwO1xyXG4gICAgbGV0IG9wcFNpZGUgPSAwO1xyXG4gICAgbGV0IGRlZmVuc2l2ZVJlZGlyZWN0ID0gMDtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBpZiAoc2hvdC5maWVsZFggPiAwLjUwKSB7XHJcbiAgICAgICAgb3BwU2lkZSsrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRlYW1TaWRlKys7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzaG90LmZpZWxkWCA8IDAuMTUpIHtcclxuICAgICAgICBkZWZlbnNpdmVSZWRpcmVjdCsrO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy50ZWFtU2lkZUdvYWxzID0gdGVhbVNpZGU7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMub3Bwb25lbnRTaWRlR29hbHMgPSBvcHBTaWRlO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmRlZmVuc2l2ZVJlZGlyZWN0ID0gZGVmZW5zaXZlUmVkaXJlY3Q7XHJcblxyXG4gICAgLy8gYWVyaWFsIGNvdW50ICYgcGVyY2VudGFnZSBvZiBhbGwgc2hvdHNcclxuICAgIGxldCBhZXJpYWwgPSAwO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGlmIChzaG90LmFlcmlhbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGFlcmlhbCsrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgYWVyaWFsUGVyY2VudGFnZSA9IE51bWJlcigoYWVyaWFsIC8gc2hvdHMubGVuZ3RoICogMTAwKS50b0ZpeGVkKDApKTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuYWVyaWFsID0gYWVyaWFsO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmFlcmlhbFBlcmNlbnRhZ2UgPSBhZXJpYWxQZXJjZW50YWdlO1xyXG5cclxuICAgIC8vIG1heCBiYWxsIHNwZWVkLCBhdmVyYWdlIGJhbGwgc3BlZWQsIHNob3RzIG92ZXIgNzAgbXBoXHJcbiAgICBsZXQgYXZnQmFsbFNwZWVkID0gMDtcclxuICAgIGxldCBzaG90c092ZXI3MG1waCA9IDA7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgaWYgKHNob3QuYmFsbF9zcGVlZCA+PSA3MCkge1xyXG4gICAgICAgIHNob3RzT3ZlcjcwbXBoKys7XHJcbiAgICAgIH1cclxuICAgICAgYXZnQmFsbFNwZWVkICs9IHNob3QuYmFsbF9zcGVlZFxyXG4gICAgfSk7XHJcblxyXG4gICAgYXZnQmFsbFNwZWVkID0gTnVtYmVyKChhdmdCYWxsU3BlZWQgLyBzaG90cy5sZW5ndGgpLnRvRml4ZWQoMSkpO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5tYXhCYWxsU3BlZWQgPSBzaG90cy5yZWR1Y2UoKG1heCwgc2hvdCkgPT4gc2hvdC5iYWxsX3NwZWVkID4gbWF4ID8gc2hvdC5iYWxsX3NwZWVkIDogbWF4LCBzaG90c1swXS5iYWxsX3NwZWVkKTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5hdmdCYWxsU3BlZWQgPSBhdmdCYWxsU3BlZWQ7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuc2hvdHNPdmVyNzBtcGggPSBzaG90c092ZXI3MG1waDtcclxuXHJcbiAgICAvLyAzdjMsIDJ2MiwgYW5kIDF2MSBnYW1lcyBwbGF5ZWRcclxuICAgIGxldCBfM3YzID0gMDtcclxuICAgIGxldCBfMnYyID0gMDtcclxuICAgIGxldCBfMXYxID0gMDtcclxuXHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBpZiAoZ2FtZS50eXBlID09PSBcIjN2M1wiKSB7XHJcbiAgICAgICAgXzN2MysrO1xyXG4gICAgICB9IGVsc2UgaWYgKGdhbWUudHlwZSA9PT0gXCIydjJcIikge1xyXG4gICAgICAgIF8ydjIrKztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBfMXYxKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5fM3YzID0gXzN2MztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5fMnYyID0gXzJ2MjtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5fMXYxID0gXzF2MTtcclxuXHJcbiAgICAvLyB0b3RhbCBnYW1lcyBwbGF5ZWQsIHRvdGFsIHNob3RzIHNjb3JlZCwgd2lucy9sb3NzZXMvd2luJVxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnRvdGFsR2FtZXMgPSBnYW1lcy5sZW5ndGg7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMudG90YWxTaG90cyA9IHNob3RzLmxlbmd0aDtcclxuXHJcbiAgICBsZXQgd2lucyA9IDA7XHJcbiAgICBsZXQgbG9zc2VzID0gMDtcclxuXHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgd2lucysrXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9zc2VzKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy53aW5zID0gd2lucztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5sb3NzZXMgPSBsb3NzZXM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMud2luUGN0ID0gTnVtYmVyKCgod2lucyAvICh3aW5zICsgbG9zc2VzKSkgKiAxMDApLnRvRml4ZWQoMCkpO1xyXG5cclxuICAgIC8vIGNvbXAgZ2FtZXMgLyB3aW4gJSwgY2FzdWFsIGdhbWVzIC8gd2luICUsIGdhbWVzIGluIE9UXHJcbiAgICBsZXQgY29tcGV0aXRpdmVHYW1lcyA9IDA7XHJcbiAgICBsZXQgY29tcFdpbiA9IDA7XHJcbiAgICBsZXQgY2FzdWFsR2FtZXMgPSAwO1xyXG4gICAgbGV0IGNhc3VhbFdpbiA9IDA7XHJcbiAgICBsZXQgb3ZlcnRpbWVHYW1lcyA9IDA7XHJcblxyXG4gICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgaWYgKGdhbWUubW9kZSA9PT0gXCJjYXN1YWxcIikge1xyXG4gICAgICAgIGNhc3VhbEdhbWVzKys7XHJcbiAgICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgICAgY2FzdWFsV2luKys7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbXBldGl0aXZlR2FtZXMrKztcclxuICAgICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgICBjb21wV2luKys7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChnYW1lLm92ZXJ0aW1lID09PSB0cnVlKSB7XHJcbiAgICAgICAgb3ZlcnRpbWVHYW1lcysrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgY29tcFdpblBjdCA9IDA7XHJcblxyXG4gICAgaWYgKGNvbXBldGl0aXZlR2FtZXMgPT09IDApIHtcclxuICAgICAgY29tcFdpblBjdCA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb21wV2luUGN0ID0gTnVtYmVyKCgoY29tcFdpbiAvIGNvbXBldGl0aXZlR2FtZXMpICogMTAwKS50b0ZpeGVkKDApKTtcclxuICAgIH1cclxuICAgIGxldCBjYXN1YWxXaW5QY3QgPSAwO1xyXG5cclxuICAgIGlmIChjYXN1YWxHYW1lcyA9PT0gMCkge1xyXG4gICAgICBjYXN1YWxXaW5QY3QgPSAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY2FzdWFsV2luUGN0ID0gTnVtYmVyKCgoY2FzdWFsV2luIC8gY2FzdWFsR2FtZXMpICogMTAwKS50b0ZpeGVkKDEpKTtcclxuICAgIH1cclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY29tcGV0aXRpdmVHYW1lcyA9IGNvbXBldGl0aXZlR2FtZXM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY2FzdWFsR2FtZXMgPSBjYXN1YWxHYW1lcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wV2luUGN0ID0gY29tcFdpblBjdDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jYXN1YWxXaW5QY3QgPSBjYXN1YWxXaW5QY3Q7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMub3ZlcnRpbWVHYW1lcyA9IG92ZXJ0aW1lR2FtZXM7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRMZXZlbHMoZmVlZGJhY2tSZXN1bHRzKTtcclxuICB9LFxyXG5cclxuICBidWlsZExldmVscyhmZWVkYmFja1Jlc3VsdHMpIHtcclxuXHJcbiAgICBjb25zdCBmZWVkYmFja0NvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcEFuZEZlZWRiYWNrQ29udGFpbmVyXCIpO1xyXG5cclxuICAgIC8vIHJlZm9ybWF0IGhlYXRtYXAgZ2VuZXJhdGlvbiB0aW1lIHRvIHJlbW92ZSBzZWNvbmRzXHJcbiAgICBjb25zdCB0aW1lUmVmb3JtYXQgPSBbZmVlZGJhY2tSZXN1bHRzLm5vdy5zcGxpdChcIjpcIilbMF0sIGZlZWRiYWNrUmVzdWx0cy5ub3cuc3BsaXQoXCI6XCIpWzFdXS5qb2luKFwiOlwiKSArIGZlZWRiYWNrUmVzdWx0cy5ub3cuc3BsaXQoXCI6XCIpWzJdLnNsaWNlKDIpO1xyXG5cclxuICAgIC8vIGhlYXRtYXAgZ2VuZXJhdGlvbiBhbmQgcmFuZ2Ugb2YgZGF0ZXMgb24gZ2FtZXMgKG1heCBhbmQgbWluKVxyXG4gICAgY29uc3QgaXRlbTNfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmxhc3RHYW1lfWApO1xyXG4gICAgY29uc3QgaXRlbTNfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkxhc3QgZ2FtZVwiKTtcclxuICAgIGNvbnN0IGl0ZW0zX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0zX2NoaWxkLCBpdGVtM19jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTNfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMl9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuZmlyc3RHYW1lfWApO1xyXG4gICAgY29uc3QgaXRlbTJfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkZpcnN0IGdhbWVcIik7XHJcbiAgICBjb25zdCBpdGVtMl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMl9jaGlsZCwgaXRlbTJfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0yX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7dGltZVJlZm9ybWF0fWApO1xyXG4gICAgY29uc3QgaXRlbTFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkhlYXRtYXAgZ2VuZXJhdGVkXCIpO1xyXG4gICAgY29uc3QgaXRlbTFfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTFfY2hpbGQsIGl0ZW0xX2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW0xID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnMxX0hlYXRtYXBEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTFcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnMgaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyXCIgfSwgbnVsbCwgaXRlbTEsIGl0ZW0yLCBpdGVtMylcclxuXHJcbiAgICAvLyBwbGF5ZXIgZmVlZGJhY2sgYmFzZWQgb24gYXZlcmFnZSBmaWVsZCB4LHkgY29vcmRpbmF0ZSBvZiBwbGF5ZXIgc2hvdHNcclxuICAgIGNvbnN0IGl0ZW02X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5jb21wbGVtZW50Qn1gKTtcclxuICAgIGNvbnN0IGl0ZW02X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJDb21wbGVtZW50aW5nIHBsYXllciAyXCIpO1xyXG4gICAgY29uc3QgaXRlbTZfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTZfY2hpbGQsIGl0ZW02X2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW02ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtNl93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW01X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5jb21wbGVtZW50QX1gKTtcclxuICAgIGNvbnN0IGl0ZW01X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJDb21wbGVtZW50aW5nIHBsYXllciAxXCIpO1xyXG4gICAgY29uc3QgaXRlbTVfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTVfY2hpbGQsIGl0ZW01X2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW01ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtNV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW00X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5maWVsZFBvc2l0aW9ufWApO1xyXG4gICAgY29uc3QgaXRlbTRfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIllvdXIgcGxheXN0eWxlXCIpO1xyXG4gICAgY29uc3QgaXRlbTRfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTRfY2hpbGQsIGl0ZW00X2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW00ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtNF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnMyX3BsYXllclR5cGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stMlwiLCBcImNsYXNzXCI6IFwiY29sdW1uc1wiIH0sIG51bGwsIGl0ZW00LCBpdGVtNSwgaXRlbTYpXHJcblxyXG4gICAgLy8gc2hvdHMgb24gdGVhbS9vcHBvbmVudCBzaWRlcyBvZiBmaWVsZCwgZGVmZW5zaXZlIHJlZGlyZWN0cywgYW5kIGFlcmlhbCBzaG90cyAvICVcclxuICAgIGNvbnN0IGl0ZW05X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5kZWZlbnNpdmVSZWRpcmVjdH1gKTtcclxuICAgIGNvbnN0IGl0ZW05X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJSZWRpcmVjdHMgZnJvbSBPd24gR29hbFwiKTtcclxuICAgIGNvbnN0IGl0ZW05X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW05X2NoaWxkLCBpdGVtOV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTkgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW05X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbThfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnRlYW1TaWRlR29hbHN9IDogJHtmZWVkYmFja1Jlc3VsdHMub3Bwb25lbnRTaWRlR29hbHN9YCk7XHJcbiAgICBjb25zdCBpdGVtOF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiR29hbHMgQmVoaW5kICYgQmV5b25kIE1pZGZpZWxkXCIpO1xyXG4gICAgY29uc3QgaXRlbThfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbThfY2hpbGQsIGl0ZW04X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtOCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbThfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtN19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuYWVyaWFsfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLmFlcmlhbFBlcmNlbnRhZ2V9JWApO1xyXG4gICAgY29uc3QgaXRlbTdfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkFlcmlhbCBHb2FsIFRvdGFsICYgUGN0XCIpO1xyXG4gICAgY29uc3QgaXRlbTdfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTdfY2hpbGQsIGl0ZW03X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtNyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTdfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zM19zaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay0zXCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zXCIgfSwgbnVsbCwgaXRlbTcsIGl0ZW04LCBpdGVtOSlcclxuXHJcbiAgICAvLyBtYXggYmFsbCBzcGVlZCwgYXZlcmFnZSBiYWxsIHNwZWVkLCBzaG90cyBvdmVyIDcwIG1waFxyXG4gICAgY29uc3QgaXRlbTEyX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5zaG90c092ZXI3MG1waH1gKTtcclxuICAgIGNvbnN0IGl0ZW0xMl9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiR29hbHMgT3ZlciA3MCBtcGhcIik7XHJcbiAgICBjb25zdCBpdGVtMTJfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTEyX2NoaWxkLCBpdGVtMTJfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTEyX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTExX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5hdmdCYWxsU3BlZWR9IG1waGApO1xyXG4gICAgY29uc3QgaXRlbTExX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJBdmVyYWdlIEJhbGwgU3BlZWRcIik7XHJcbiAgICBjb25zdCBpdGVtMTFfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTExX2NoaWxkLCBpdGVtMTFfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTExX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTEwX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5tYXhCYWxsU3BlZWR9IG1waGApO1xyXG4gICAgY29uc3QgaXRlbTEwX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJNYXggQmFsbCBTcGVlZFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTBfY2hpbGQsIGl0ZW0xMF9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTEwID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTBfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zNF9iYWxsRGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay00XCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zIGhhcy1iYWNrZ3JvdW5kLXdoaXRlLXRlclwiIH0sIG51bGwsIGl0ZW0xMCwgaXRlbTExLCBpdGVtMTIpXHJcblxyXG4gICAgLy8gdG90YWwgZ2FtZXMgcGxheWVkLCB0b3RhbCBzaG90cyBzY29yZWQsIHdpbnMvbG9zc2VzL3dpbiVcclxuICAgIGNvbnN0IGl0ZW0xNV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMud2luc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5sb3NzZXN9IDogJHtmZWVkYmFja1Jlc3VsdHMud2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0xNV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiV2lucywgTG9zc2VzLCAmIFdpbiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtMTVfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE1X2NoaWxkLCBpdGVtMTVfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE1X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE0X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy50b3RhbFNob3RzfWApO1xyXG4gICAgY29uc3QgaXRlbTE0X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJUb3RhbCBHb2Fsc1wiKTtcclxuICAgIGNvbnN0IGl0ZW0xNF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTRfY2hpbGQsIGl0ZW0xNF9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTRfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTNfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnRvdGFsR2FtZXN9YCk7XHJcbiAgICBjb25zdCBpdGVtMTNfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlRvdGFsIEdhbWVzXCIpO1xyXG4gICAgY29uc3QgaXRlbTEzX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xM19jaGlsZCwgaXRlbTEzX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xM193cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM1X3ZpY3RvcnlEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTVcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnMgaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyXCIgfSwgbnVsbCwgaXRlbTEzLCBpdGVtMTQsIGl0ZW0xNSlcclxuXHJcbiAgICAvLyAzdjMsIDJ2MiwgYW5kIDF2MSBnYW1lcyBwbGF5ZWRcclxuICAgIGNvbnN0IGl0ZW0xOF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuXzF2MX1gKTtcclxuICAgIGNvbnN0IGl0ZW0xOF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiMXYxIEdhbWVzXCIpO1xyXG4gICAgY29uc3QgaXRlbTE4X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xOF9jaGlsZCwgaXRlbTE4X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTggPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xOF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xN19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuXzJ2Mn1gKTtcclxuICAgIGNvbnN0IGl0ZW0xN19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiMnYyIGdhbWVzXCIpO1xyXG4gICAgY29uc3QgaXRlbTE3X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xN19jaGlsZCwgaXRlbTE3X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTcgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xN193cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xNl9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuXzN2M31gKTtcclxuICAgIGNvbnN0IGl0ZW0xNl9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiM3YzIEdhbWVzXCIpO1xyXG4gICAgY29uc3QgaXRlbTE2X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xNl9jaGlsZCwgaXRlbTE2X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xNl93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM2X2dhbWVUeXBlRGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay02XCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zXCIgfSwgbnVsbCwgaXRlbTE2LCBpdGVtMTcsIGl0ZW0xOClcclxuXHJcbiAgICAvLyBjb21wIGdhbWVzIC8gd2luICUsIGNhc3VhbCBnYW1lcyAvIHdpbiAlLCBnYW1lcyBpbiBPVFxyXG4gICAgY29uc3QgaXRlbTIxX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5vdmVydGltZUdhbWVzfWApO1xyXG4gICAgY29uc3QgaXRlbTIxX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJPdmVydGltZSBHYW1lc1wiKTtcclxuICAgIGNvbnN0IGl0ZW0yMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMjFfY2hpbGQsIGl0ZW0yMV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTIxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMjFfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMjBfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBldGl0aXZlR2FtZXN9IDogJHtmZWVkYmFja1Jlc3VsdHMuY29tcFdpblBjdH0lYCk7XHJcbiAgICBjb25zdCBpdGVtMjBfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBldGl0aXZlIEdhbWVzICYgV2luIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW0yMF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMjBfY2hpbGQsIGl0ZW0yMF9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTIwID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMjBfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTlfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNhc3VhbEdhbWVzfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLmNhc3VhbFdpblBjdH0lYCk7XHJcbiAgICBjb25zdCBpdGVtMTlfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNhc3VhbCBHYW1lcyAmIFdpbiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtMTlfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE5X2NoaWxkLCBpdGVtMTlfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xOSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE5X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczdfb3ZlcnRpbWVEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTdcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnMgaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyXCIgfSwgbnVsbCwgaXRlbTE5LCBpdGVtMjAsIGl0ZW0yMSlcclxuXHJcbiAgICAvLyByZXBsYWNlIG9sZCBjb250ZW50IGlmIGl0J3MgYWxyZWFkeSBvbiB0aGUgcGFnZVxyXG4gICAgY29uc3QgZmVlZGJhY2sxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFjay0xXCIpO1xyXG4gICAgY29uc3QgZmVlZGJhY2syID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFjay0yXCIpO1xyXG4gICAgY29uc3QgZmVlZGJhY2szID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFjay0zXCIpO1xyXG4gICAgY29uc3QgZmVlZGJhY2s0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFjay00XCIpO1xyXG4gICAgY29uc3QgZmVlZGJhY2s1ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFjay01XCIpO1xyXG4gICAgY29uc3QgZmVlZGJhY2s2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFjay02XCIpO1xyXG4gICAgY29uc3QgZmVlZGJhY2s3ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmZWVkYmFjay03XCIpO1xyXG5cclxuICAgIGlmIChmZWVkYmFjazEgIT09IG51bGwpIHtcclxuICAgICAgZmVlZGJhY2sxLnJlcGxhY2VXaXRoKGNvbHVtbnMxX0hlYXRtYXBEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2syLnJlcGxhY2VXaXRoKGNvbHVtbnMyX3BsYXllclR5cGUpO1xyXG4gICAgICBmZWVkYmFjazMucmVwbGFjZVdpdGgoY29sdW1uczNfc2hvdERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazQucmVwbGFjZVdpdGgoY29sdW1uczRfYmFsbERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazUucmVwbGFjZVdpdGgoY29sdW1uczVfdmljdG9yeURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazYucmVwbGFjZVdpdGgoY29sdW1uczZfZ2FtZVR5cGVEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2s3LnJlcGxhY2VXaXRoKGNvbHVtbnM3X292ZXJ0aW1lRGV0YWlscyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zMV9IZWF0bWFwRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnMyX3BsYXllclR5cGUpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zNF9iYWxsRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnMzX3Nob3REZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczVfdmljdG9yeURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zNl9nYW1lVHlwZURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zN19vdmVydGltZURldGFpbHMpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmZWVkYmFja1xyXG5cclxuXHJcbi8qXHJcbi0gSGVhdG1hcCBnZW5lcmF0ZWQgb25cclxuLSBzdGFydCBkYXRlXHJcbi0gZW5kIGRhdGVcclxuLS0tLS0tLS0tLS0tLVxyXG4tIHJlbGV2YW50IHNvY2NlciBwb3NpdGlvbiBiYXNlZCBvbiBhdmcgc2NvcmUgcG9zaXRpb25cclxuLSBwYWlyZWQgYmVzdCB3aXRoIDFcclxuLSBwYWlyZWQgYmVzdCB3aXRoIDJcclxuLS0tLS0tLS0tLS0tLS1cclxuLSBzaG90cyBzY29yZWQgbGVmdCAvIHJpZ2h0IG9mIG1pZGZpZWxkXHJcbi0gc2hvdHMgc2NvcmVkIGFzIHJlZGlyZWN0cyBiZXNpZGUgb3duIGdvYWwgKERlZmVuc2l2ZSByZWRpcmVjdHMpXHJcbi0gYWVyaWFsIGNvdW50ICYgc2hvdCAlXHJcbi0tLS0tLS0tLS0tLS0tXHJcbi0gbWF4IGJhbGwgc3BlZWRcclxuLSBhdmcgYmFsbCBzcGVlZFxyXG4tIHNob3RzIG92ZXIgNzBtcGggKH4gMTEwIGtwaClcclxuLS0tLS0tLS0tLS0tLS1cclxuLSAzdjMgZ2FtZXMgcGxheWVkXHJcbi0gMnYyIGdhbWVzIHBsYXllZFxyXG4tIDF2MSBnYW1lcyBwbGF5ZWRcclxuLS0tLS0tLS0tLS0tLVxyXG4tIHRvdGFsIGdhbWVzIHBsYXllZFxyXG4tIHRvdGFsIHNob3RzIHNjb3JlZFxyXG4tIHdpbiAvIGxvc3MgLyB3aW4lXHJcbi0tLS0tLS0tLS0tLS1cclxuLSBjb21wIGdhbWVzIC8gd2luICVcclxuLSBjYXN1YWwgZ2FtZXMgLyB3aW4gJVxyXG4tIGdhbWVzIGluIE9UXHJcbi0tLS0tLS0tLS0tLS1cclxuXHJcbiovIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5pbXBvcnQgaGVhdG1hcERhdGEgZnJvbSBcIi4vaGVhdG1hcERhdGFcIjtcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIjtcclxuaW1wb3J0IGRhdGVGaWx0ZXIgZnJvbSBcIi4vZGF0ZUZpbHRlclwiO1xyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGhlYXRtYXBzID0ge1xyXG5cclxuICBsb2FkSGVhdG1hcENvbnRhaW5lcnMoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB0aGlzLmJ1aWxkRmlsdGVycygpO1xyXG4gICAgLy8gYnVpbGRzIGJ1dHRvbiB0byBnZW5lcmF0ZSBoZWF0bWFwLCBzYXZlIGhlYXRtYXAsIGFuZCB2aWV3IHNhdmVkIGhlYXRtYXBzXHJcbiAgICAvLyB0aGUgYWN0aW9uIGlzIGFzeW5jIGJlY2F1c2UgdGhlIHVzZXIncyBzYXZlZCBoZWF0bWFwcyBoYXZlIHRvIGJlIHJlbmRlcmVkIGFzIEhUTUwgb3B0aW9uIGVsZW1lbnRzXHJcbiAgICB0aGlzLmJ1aWxkR2VuZXJhdG9yKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWx0ZXJzKCkge1xyXG5cclxuICAgIC8vIHJlc2V0IGJ1dHRvblxyXG4gICAgY29uc3QgcmVzZXRCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwicmVzZXRGaWx0ZXJzQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJSZXNldCBGaWx0ZXJzXCIpO1xyXG5cclxuICAgIC8vIGRhdGUgcmFuZ2UgYnV0dG9uXHJcbiAgICBjb25zdCBkYXRlQnRuVGV4dCA9IGVsQnVpbGRlcihcInNwYW5cIiwge30sIFwiRGF0ZXNcIik7XHJcbiAgICBjb25zdCBkYXRlQnRuSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFyIGZhLWNhbGVuZGFyXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBkYXRlQnRuSWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGxcIiB9LCBudWxsLCBkYXRlQnRuSWNvbik7XHJcbiAgICBjb25zdCBkYXRlQnRuID0gZWxCdWlsZGVyKFwiYVwiLCB7XCJpZFwiOlwiZGF0ZVJhbmdlQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtb3V0bGluZWQgaXMtZGFya1wiIH0sIG51bGwsIGRhdGVCdG5JY29uU3BhbiwgZGF0ZUJ0blRleHQpO1xyXG4gICAgY29uc3QgZGF0ZUJ0blBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZGF0ZUJ0bik7XHJcblxyXG4gICAgLy8gYmFsbCBzcGVlZCBidXR0b25cclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0blRleHQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHt9LCBcIkJhbGwgU3BlZWRcIik7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5JY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtYm9sdFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuSWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGxcIiB9LCBudWxsLCBiYWxsU3BlZWRCdG5JY29uKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0biA9IGVsQnVpbGRlcihcImFcIiwgeyBcImlkXCI6IFwiYmFsbFNwZWVkQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtb3V0bGluZWQgaXMtZGFya1wiIH0sIG51bGwsIGJhbGxTcGVlZEJ0bkljb25TcGFuLCBiYWxsU3BlZWRCdG5UZXh0KTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0blBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgYmFsbFNwZWVkQnRuKTtcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgY29uc3QgaWNvbjYgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1jbG9ja1wiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW42ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNik7XHJcbiAgICBjb25zdCBzZWw2X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IHNlbDZfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9UXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gT1RcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q2ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1vdmVydGltZVwiIH0sIG51bGwsIHNlbDZfb3AxLCBzZWw2X29wMiwgc2VsNl9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDYsIGljb25TcGFuNik7XHJcbiAgICBjb25zdCBjb250cm9sNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Nik7XHJcblxyXG4gICAgLy8gcmVzdWx0XHJcbiAgICBjb25zdCBpY29uNSA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXRyb3BoeVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW41ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNSk7XHJcbiAgICBjb25zdCBzZWw1X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJSZXN1bHRcIik7XHJcbiAgICBjb25zdCBzZWw1X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJWaWN0b3J5XCIpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiRGVmZWF0XCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItZ2FtZVJlc3VsdFwiIH0sIG51bGwsIHNlbDVfb3AxLCBzZWw1X29wMiwgc2VsNV9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDUsIGljb25TcGFuNSk7XHJcbiAgICBjb25zdCBjb250cm9sNSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2NSk7XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlXHJcbiAgICBjb25zdCBpY29uNCA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXNpdGVtYXBcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNCA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjQpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiR2FtZSBUeXBlXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiM3YzXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiMnYyXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDQgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiMXYxXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItZ2FtZVR5cGVcIiB9LCBudWxsLCBzZWw0X29wMSwgc2VsNF9vcDIsIHNlbDRfb3AzLCBzZWw0X29wNCk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NCwgaWNvblNwYW40KTtcclxuICAgIGNvbnN0IGNvbnRyb2w0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY0KTtcclxuXHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGNvbnN0IGljb24zID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZ2FtZXBhZFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uMyk7XHJcbiAgICBjb25zdCBzZWwzX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJHYW1lIE1vZGVcIik7XHJcbiAgICBjb25zdCBzZWwzX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDb21wZXRpdGl2ZVwiKTtcclxuICAgIGNvbnN0IHNlbDNfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNhc3VhbFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDMgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLWdhbWVNb2RlXCIgfSwgbnVsbCwgc2VsM19vcDEsIHNlbDNfb3AyLCBzZWwzX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MywgaWNvblNwYW4zKTtcclxuICAgIGNvbnN0IGNvbnRyb2wzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYzKTtcclxuXHJcbiAgICAvLyBwYXJ0eVxyXG4gICAgY29uc3QgaWNvbjIgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1oYW5kc2hha2VcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjIpO1xyXG4gICAgY29uc3Qgc2VsMl9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiVGVhbVwiKTtcclxuICAgIGNvbnN0IHNlbDJfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIHBhcnR5XCIpO1xyXG4gICAgY29uc3Qgc2VsMl9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUGFydHlcIik7XHJcbiAgICBjb25zdCBzZWxlY3QyID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci10ZWFtU3RhdHVzXCIgfSwgbnVsbCwgc2VsMl9vcDEsIHNlbDJfb3AyLCBzZWwyX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MiwgaWNvblNwYW4yKTtcclxuICAgIGNvbnN0IGNvbnRyb2wyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYyKTtcclxuXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGNvbnN0IGljb24xID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZnV0Ym9sXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24xKTtcclxuICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlNob3QgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItc2hvdFR5cGVcIiB9LCBudWxsLCBzZWwxX29wMSwgc2VsMV9vcDIsIHNlbDFfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QxLCBpY29uU3BhbjEpO1xyXG4gICAgY29uc3QgY29udHJvbDEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjEpO1xyXG5cclxuICAgIGNvbnN0IGZpbHRlckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpbHRlckZpZWxkXCIsIFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBjb250cm9sMSwgY29udHJvbDIsIGNvbnRyb2wzLCBjb250cm9sNCwgY29udHJvbDUsIGNvbnRyb2w2LCBiYWxsU3BlZWRCdG5QYXJlbnQsIGRhdGVCdG5QYXJlbnQsIHJlc2V0QnRuKTtcclxuICAgIGNvbnN0IFBhcmVudEZpbHRlckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZmlsdGVyRmllbGQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCBmaWx0ZXIgY29udGFpbmVyIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50RmlsdGVyQ29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdlbmVyYXRvcigpIHtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcblxyXG4gICAgLy8gdXNlIGZldGNoIHRvIGFwcGVuZCBvcHRpb25zIHRvIHNlbGVjdCBlbGVtZW50IGlmIHVzZXIgYXQgbGVhc3QgMSBzYXZlZCBoZWF0bWFwXHJcbiAgICBBUEkuZ2V0QWxsKGBoZWF0bWFwcz91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgIGNvbnN0IGljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1maXJlXCIgfSwgbnVsbCk7XHJcbiAgICAgICAgY29uc3QgaWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24pO1xyXG4gICAgICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJhc2ljIEhlYXRtYXBcIik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImhlYXRtYXBEcm9wZG93blwiIH0sIG51bGwsIHNlbDFfb3AxKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwU2VsZWN0RGl2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgaGVhdG1hcERyb3Bkb3duLCBpY29uU3Bhbik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIGhlYXRtYXBTZWxlY3REaXYpO1xyXG5cclxuICAgICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImRlbGV0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkRlbGV0ZSBIZWF0bWFwXCIpXHJcbiAgICAgICAgY29uc3QgZGVsZXRlQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZGVsZXRlSGVhdG1hcEJ0bilcclxuICAgICAgICBjb25zdCBzYXZlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBIZWF0bWFwXCIpXHJcbiAgICAgICAgY29uc3Qgc2F2ZUJ0bkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIHNhdmVCdG4pXHJcbiAgICAgICAgY29uc3Qgc2F2ZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwic2F2ZUhlYXRtYXBJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiTmFtZSBhbmQgc2F2ZSB0aGlzIGhlYXRtYXBcIiwgXCJtYXhsZW5ndGhcIjogXCIyNVwiIH0sIG51bGwpXHJcbiAgICAgICAgY29uc3Qgc2F2ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBpcy1leHBhbmRlZFwiIH0sIG51bGwsIHNhdmVJbnB1dClcclxuXHJcbiAgICAgICAgY29uc3QgZ2VuZXJhdG9yQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImdlbmVyYXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkdlbmVyYXRlIEhlYXRtYXBcIik7XHJcbiAgICAgICAgY29uc3QgZ2VuZXJhdG9yQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2VuZXJhdG9yQnV0dG9uKTtcclxuXHJcbiAgICAgICAgLy8gaWYgbm8gaGVhdG1hcHMgYXJlIHNhdmVkLCBnZW5lcmF0ZSBubyBleHRyYSBvcHRpb25zIGluIGRyb3Bkb3duXHJcbiAgICAgICAgaWYgKGhlYXRtYXBzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgY29uc3QgZ2VuZXJhdG9yRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgaGVhdG1hcENvbnRyb2wsIGdlbmVyYXRvckNvbnRyb2wsIHNhdmVDb250cm9sLCBzYXZlQnRuQ29udHJvbCwgZGVsZXRlQnRuQ29udHJvbCk7XHJcbiAgICAgICAgICBjb25zdCBQYXJlbnRHZW5lcmF0b3JDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGdlbmVyYXRvckZpZWxkKTtcclxuICAgICAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBlbHNlLCBmb3IgZWFjaCBoZWF0bWFwIHNhdmVkLCBtYWtlIGEgbmV3IG9wdGlvbiBhbmQgYXBwZW5kIGl0IHRvIHRoZVxyXG4gICAgICAgICAgaGVhdG1hcHMuZm9yRWFjaChoZWF0bWFwID0+IHtcclxuICAgICAgICAgICAgaGVhdG1hcERyb3Bkb3duLmFwcGVuZENoaWxkKGVsQnVpbGRlcihcIm9wdGlvblwiLCB7IFwiaWRcIjogYGhlYXRtYXAtJHtoZWF0bWFwLmlkfWAgfSwgYCR7aGVhdG1hcC50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdfTogJHtoZWF0bWFwLm5hbWV9YCkpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIGNvbnN0IGdlbmVyYXRvckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGhlYXRtYXBDb250cm9sLCBnZW5lcmF0b3JDb250cm9sLCBzYXZlQ29udHJvbCwgc2F2ZUJ0bkNvbnRyb2wsIGRlbGV0ZUJ0bkNvbnRyb2wpO1xyXG4gICAgICAgICAgY29uc3QgUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBnZW5lcmF0b3JGaWVsZCk7XHJcbiAgICAgICAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEdlbmVyYXRvckNvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnVpbGRGaWVsZGFuZEdvYWwoKTtcclxuICAgICAgICBkYXRlRmlsdGVyLmJ1aWxkRGF0ZUZpbHRlcigpO1xyXG4gICAgICAgIHRoaXMuaGVhdG1hcEV2ZW50TWFuYWdlcigpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWVsZGFuZEdvYWwoKSB7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGhlYXRtYXBJbWFnZUNvbnRhaW5lcnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnbkZpZWxkLCBhbGlnbkdvYWwpO1xyXG5cclxuICAgIC8vIHBhcmVudCBjb250YWluZXIgaG9sZGluZyBhbGwgc2hvdCBpbmZvcm1hdGlvblxyXG4gICAgY29uc3QgcGFyZW50U2hvdENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7XCJpZFwiOlwiaGVhdG1hcEFuZEZlZWRiYWNrQ29udGFpbmVyXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgaGVhdG1hcEltYWdlQ29udGFpbmVycylcclxuXHJcbiAgICAvLyBhcHBlbmQgZmllbGQgYW5kIGdvYWwgdG8gcGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRTaG90Q29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBoZWF0bWFwRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gcHJpbWFyeSBidXR0b25zIG9uIGhlYXRtYXAgcGFnZVxyXG4gICAgY29uc3QgZ2VuZXJhdGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnZW5lcmF0ZUhlYXRtYXBCdG5cIik7XHJcbiAgICBjb25zdCBzYXZlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBCdG5cIik7XHJcbiAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVIZWF0bWFwQnRuXCIpO1xyXG5cclxuICAgIGdlbmVyYXRlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuZ2V0VXNlclNob3RzKTtcclxuICAgIHNhdmVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5zYXZlSGVhdG1hcCk7XHJcbiAgICBkZWxldGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwKTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXIgdG8gaGVhdG1hcCBwYXJlbnQgdGhhdCBoaWdobGlnaHRzIGZpbHRlciBidXR0b25zIHJlZCB3aGVuIGNoYW5nZWRcclxuICAgIC8vIGhlYXRtYXAgYnV0dG9ucyByZXR1cm4gdG8gZGVmYXVsdCBjb2xvciBpZiB0aGUgZGVmYXVsdCBvcHRpb24gaXMgc2VsZWN0ZWRcclxuICAgIGNvbnN0IGZpbHRlckZpZWxkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXJGaWVsZFwiKTtcclxuICAgIGZpbHRlckZpZWxkLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGUpID0+IHtcclxuICAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICBpZiAoZS50YXJnZXQudmFsdWUgPT09IGUudGFyZ2V0LmNoaWxkTm9kZXNbMF0udGV4dENvbnRlbnQpIHtcclxuICAgICAgICBlLnRhcmdldC5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lciB0byBoZWF0bWFwIHRpdGxlIGlucHV0IHRvIGNsZWFyIHJlZCBoaWdobGl0aW5nIGFuZCB0ZXh0IGlmIGFuIGVycm9yIHdhcyB0aHJvd25cclxuICAgIGNvbnN0IHNhdmVIZWF0bWFwSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwSW5wdXRcIik7XHJcbiAgICBzYXZlSGVhdG1hcElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgIGlmIChzYXZlSGVhdG1hcElucHV0LmNsYXNzTGlzdC5jb250YWlucyhcImlzLWRhbmdlclwiKSB8fCBzYXZlSGVhdG1hcElucHV0LmNsYXNzTGlzdC5jb250YWlucyhcImlzLXN1Y2Nlc3NcIikpIHtcclxuICAgICAgICBzYXZlSGVhdG1hcElucHV0LnZhbHVlID0gXCJcIjtcclxuICAgICAgICBzYXZlSGVhdG1hcElucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc3VjY2Vzc1wiKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvLyBhZGQgZnVuY3Rpb25hbGl0eSB0byByZXNldCBmaWx0ZXIgYnV0dG9uXHJcbiAgICBjb25zdCByZXNldEZpbHRlcnNCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlc2V0RmlsdGVyc0J0blwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZU1vZGVcIik7XHJcbiAgICBjb25zdCBzaG90VHlwZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLXNob3RUeXBlXCIpO1xyXG4gICAgY29uc3QgZ2FtZVJlc3VsdEZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVSZXN1bHRcIik7XHJcbiAgICBjb25zdCBnYW1ldHlwZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVUeXBlXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1vdmVydGltZVwiKTtcclxuICAgIGNvbnN0IHRlYW1TdGF0dXNGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci10ZWFtU3RhdHVzXCIpO1xyXG4gICAgY29uc3QgZGF0ZVJhbmdlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXRlUmFuZ2VCdG5cIik7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZEJ0blwiKTtcclxuXHJcbiAgICByZXNldEZpbHRlcnNCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgZ2FtZU1vZGVGaWx0ZXIudmFsdWUgPSBcIkdhbWUgTW9kZVwiO1xyXG4gICAgICBnYW1lTW9kZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBzaG90VHlwZUZpbHRlci52YWx1ZSA9IFwiU2hvdCBUeXBlXCI7XHJcbiAgICAgIHNob3RUeXBlRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIGdhbWVSZXN1bHRGaWx0ZXIudmFsdWUgPSBcIlJlc3VsdFwiO1xyXG4gICAgICBnYW1lUmVzdWx0RmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIGdhbWV0eXBlRmlsdGVyLnZhbHVlID0gXCJHYW1lIFR5cGVcIjtcclxuICAgICAgZ2FtZXR5cGVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgb3ZlcnRpbWVGaWx0ZXIudmFsdWUgPSBcIk92ZXJ0aW1lXCI7XHJcbiAgICAgIG92ZXJ0aW1lRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIHRlYW1TdGF0dXNGaWx0ZXIudmFsdWUgPSBcIlRlYW1cIjtcclxuICAgICAgdGVhbVN0YXR1c0ZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICAvLyByZXNldCBiYWxsIHNwZWVkIGdsb2JhbCB2YXJpYWJsZXNcclxuICAgICAgaGVhdG1hcERhdGEuaGFuZGxlQmFsbFNwZWVkR2xvYmFsVmFyaWFibGVzKCk7XHJcbiAgICAgIGJhbGxTcGVlZEJ0bi5jbGFzc0xpc3QuYWRkKFwiaXMtb3V0bGluZWRcIik7XHJcblxyXG4gICAgICAvLyByZXNldCBkYXRlIGZpbHRlciBhbmQgYXNzb2NpYXRlZCBnbG9iYWwgdmFyaWFibGVzXHJcbiAgICAgIGRhdGVGaWx0ZXIuY2xlYXJEYXRlRmlsdGVyKCk7XHJcblxyXG4gICAgfSlcclxuXHJcbiAgICAvLyBhZGQgZnVuY3Rpb25hbGl0eSB0byBiYWxsIHNwZWVkIGJ1dHRvblxyXG4gICAgYmFsbFNwZWVkQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5iYWxsU3BlZWRNYXgpO1xyXG5cclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIGRhdGUgcmFuZ2UgYnV0dG9uXHJcbiAgICBkYXRlUmFuZ2VCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIub3BlbkRhdGVGaWx0ZXIpO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGhlYXRtYXBzIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuaW1wb3J0IG5hdmJhciBmcm9tIFwiLi9uYXZiYXJcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGxvZ2luT3JTaWdudXAgPSB7XHJcblxyXG4gIGxvZ2luRm9ybSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYnVpbGRzIGEgbG9naW4gZm9ybSB0aGF0IHZhbGlkYXRlcyB1c2VyIGlucHV0LiBTdWNjZXNzZnVsIGxvZ2luIHN0b3JlcyB1c2VyIGlkIGluIHNlc3Npb24gc3RvcmFnZVxyXG4gICAgY29uc3QgbG9naW5CdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwibG9naW5Ob3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpbiBub3dcIik7XHJcbiAgICBjb25zdCBsb2dpbkJ0bkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9ucyBpcy1jZW50ZXJlZFwiIH0sIG51bGwsIGxvZ2luQnV0dG9uKVxyXG5cclxuICAgIC8vIHBhc3N3b3JkIGlucHV0IHdpdGggaWNvblxyXG4gICAgY29uc3QgbG9naW5QYXNzd29yZEljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1sb2NrXCIgfSlcclxuICAgIGNvbnN0IGxvZ2luUGFzc3dvcmRJY29uRGl2ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsIGlzLWxlZnRcIiB9LCBudWxsLCBsb2dpblBhc3N3b3JkSWNvbilcclxuICAgIGNvbnN0IGxvZ2luSW5wdXRfcGFzc3dvcmQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwYXNzd29yZElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJwYXNzd29yZFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuXHJcbiAgICBjb25zdCBsb2dpblBhc3N3b3JkQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgbG9naW5JbnB1dF9wYXNzd29yZCwgbG9naW5QYXNzd29yZEljb25EaXYpXHJcbiAgICBjb25zdCBsb2dpblBhc3N3b3JkTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiUGFzc3dvcmRcIilcclxuICAgIGNvbnN0IGxvZ2luUGFzc3dvcmRGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIGxvZ2luUGFzc3dvcmRMYWJlbCwgbG9naW5QYXNzd29yZENvbnRyb2wpXHJcblxyXG4gICAgLy8gdXNlcm5hbWUgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXVzZXJcIiB9KVxyXG4gICAgY29uc3QgbG9naW5Vc2VybmFtZUljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIGxvZ2luVXNlcm5hbWVJY29uKVxyXG4gICAgY29uc3QgbG9naW5JbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcblxyXG4gICAgY29uc3QgbG9naW5Vc2VybmFtZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIGxvZ2luSW5wdXRfdXNlcm5hbWUsIGxvZ2luVXNlcm5hbWVJY29uRGl2KVxyXG4gICAgY29uc3QgbG9naW5Vc2VybmFtZUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIlVzZXJuYW1lXCIpXHJcbiAgICBjb25zdCBsb2dpblVzZXJuYW1lRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGRcIiB9LCBudWxsLCBsb2dpblVzZXJuYW1lTGFiZWwsIGxvZ2luVXNlcm5hbWVDb250cm9sKVxyXG5cclxuICAgIC8vIGZvcm1cclxuICAgIGNvbnN0IGxvZ2luRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwibG9naW5Gb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiwgXCJzdHlsZVwiOiBcIm1hcmdpbi10b3A6LTU3cHg7IG1pbi13aWR0aDoyMCVcIiB9LCBudWxsLCBsb2dpblVzZXJuYW1lRmllbGQsIGxvZ2luUGFzc3dvcmRGaWVsZCwgbG9naW5CdG5Db250cm9sKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICAvLyBzZXQgc3R5bGUgb2YgbWFzdGVyIGNvbnRhaW5lciB0byBkaXNwbGF5IGZsZXggdG8gYWxpZ24gZm9ybXMgaW4gY2VudGVyIG9mIGNvbnRhaW5lclxyXG4gICAgd2VicGFnZS5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gXCJjZW50ZXJcIjtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuYWxpZ25JdGVtcyA9IFwiY2VudGVyXCI7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKGxvZ2luRm9ybSk7XHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBzaWdudXBGb3JtKCkge1xyXG4gICAgY29uc3Qgc2lnbnVwQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNpZ251cE5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXAgbm93XCIpO1xyXG4gICAgY29uc3Qgc2lnbnVwQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zIGlzLWNlbnRlcmVkXCIgfSwgbnVsbCwgc2lnbnVwQnV0dG9uKVxyXG5cclxuICAgIC8vIG5hbWUgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBzaWdudXBOYW1lSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXBlbmNpbC1hbHRcIiB9KVxyXG4gICAgY29uc3Qgc2lnbnVwTmFtZUljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cE5hbWVJY29uKVxyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfbmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgbmFtZVwiIH0pO1xyXG5cclxuICAgIGNvbnN0IHNpZ251cE5hbWVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9uYW1lLCBzaWdudXBOYW1lSWNvbkRpdilcclxuICAgIGNvbnN0IHNpZ251cE5hbWVMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJOYW1lXCIpXHJcbiAgICBjb25zdCBzaWdudXBOYW1lRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGRcIiB9LCBudWxsLCBzaWdudXBOYW1lTGFiZWwsIHNpZ251cE5hbWVDb250cm9sKVxyXG5cclxuICAgIC8vIHVzZXJuYW1lIGlucHV0IHdpdGggaWNvblxyXG4gICAgY29uc3Qgc2lnbnVwVXNlcm5hbWVJY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtdXNlclwiIH0pXHJcbiAgICBjb25zdCBzaWdudXBVc2VybmFtZUljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cFVzZXJuYW1lSWNvbilcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiwgXCJtYXhsZW5ndGhcIjogXCIyMFwiIH0pO1xyXG5cclxuICAgIGNvbnN0IHNpZ251cFVzZXJuYW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2lnbnVwSW5wdXRfdXNlcm5hbWUsIHNpZ251cFVzZXJuYW1lSWNvbkRpdilcclxuICAgIGNvbnN0IHNpZ251cFVzZXJuYW1lTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiVXNlcm5hbWVcIilcclxuICAgIGNvbnN0IHNpZ251cFVzZXJuYW1lRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGRcIiB9LCBudWxsLCBzaWdudXBVc2VybmFtZUxhYmVsLCBzaWdudXBVc2VybmFtZUNvbnRyb2wpXHJcblxyXG4gICAgLy8gZW1haWwgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbEljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1hdFwiIH0pXHJcbiAgICBjb25zdCBzaWdudXBFbWFpbEljb25EaXYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGwgaXMtbGVmdFwiIH0sIG51bGwsIHNpZ251cEVtYWlsSWNvbilcclxuICAgIGNvbnN0IHNpZ251cElucHV0X2VtYWlsID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiZW1haWxJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZW1haWxcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIGVtYWlsXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwRW1haWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9lbWFpbCwgc2lnbnVwRW1haWxJY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwRW1haWxMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJFbWFpbFwiKVxyXG4gICAgY29uc3Qgc2lnbnVwRW1haWxGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIHNpZ251cEVtYWlsTGFiZWwsIHNpZ251cEVtYWlsQ29udHJvbClcclxuXHJcbiAgICAvLyBwYXNzd29yZCBpbnB1dCB3aXRoIGljb25cclxuICAgIGNvbnN0IHNpZ251cFBhc3N3b3JkSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWxvY2tcIiB9KVxyXG4gICAgY29uc3Qgc2lnbnVwUGFzc3dvcmRJY29uRGl2ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsIGlzLWxlZnRcIiB9LCBudWxsLCBzaWdudXBQYXNzd29yZEljb24pXHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwUGFzc3dvcmRDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9wYXNzd29yZCwgc2lnbnVwUGFzc3dvcmRJY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwUGFzc3dvcmRMYWJlbCA9IGVsQnVpbGRlcihcImxhYmVsXCIsIHsgXCJjbGFzc1wiOiBcImxhYmVsXCIgfSwgXCJQYXNzd29yZFwiKVxyXG4gICAgY29uc3Qgc2lnbnVwUGFzc3dvcmRGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIHNpZ251cFBhc3N3b3JkTGFiZWwsIHNpZ251cFBhc3N3b3JkQ29udHJvbClcclxuXHJcbiAgICAvLyBjb25maXJtIHBhc3N3b3JkIGlucHV0IHdpdGggaWNvblxyXG4gICAgY29uc3Qgc2lnbnVwQ29uZmlybUljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1sb2NrXCIgfSlcclxuICAgIGNvbnN0IHNpZ251cENvbmZpcm1JY29uRGl2ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsIGlzLWxlZnRcIiB9LCBudWxsLCBzaWdudXBDb25maXJtSWNvbilcclxuICAgIGNvbnN0IHNpZ251cElucHV0X2NvbmZpcm0gPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJjb25maXJtUGFzc3dvcmRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImVtYWlsXCIsIFwicGxhY2Vob2xkZXJcIjogXCJjb25maXJtIHBhc3N3b3JkXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwQ29uZmlybUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X2NvbmZpcm0sIHNpZ251cENvbmZpcm1JY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwQ29uZmlybUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkNvbmZpcm0gUGFzc3dvcmRcIilcclxuICAgIGNvbnN0IHNpZ251cENvbmZpcm1GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZFwiIH0sIG51bGwsIHNpZ251cENvbmZpcm1MYWJlbCwgc2lnbnVwQ29uZmlybUNvbnRyb2wpXHJcblxyXG4gICAgLy8gcHJvZmlsZSBwaWMgaW5wdXQgd2l0aCBpY29uXHJcbiAgICBjb25zdCBzaWdudXBQcm9maWxlUGljSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWltYWdlXCIgfSlcclxuICAgIGNvbnN0IHNpZ251cFByb2ZpbGVQaWNJY29uRGl2ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsIGlzLWxlZnRcIiB9LCBudWxsLCBzaWdudXBQcm9maWxlUGljSWNvbilcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3Byb2ZpbGVQaWMgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwcm9maWxlUGljVVJMXCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJlbWFpbFwiLCBcInBsYWNlaG9sZGVyXCI6IFwicHJvdmlkZSBhIFVSTCAob3B0aW9uYWwpXCIgfSk7XHJcblxyXG4gICAgY29uc3Qgc2lnbnVwUHJvZmlsZVBpY0NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNpZ251cElucHV0X3Byb2ZpbGVQaWMsIHNpZ251cFByb2ZpbGVQaWNJY29uRGl2KVxyXG4gICAgY29uc3Qgc2lnbnVwUHJvZmlsZVBpY0xhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIlByb2ZpbGUgUGljdHVyZVwiKVxyXG4gICAgY29uc3Qgc2lnbnVwUHJvZmlsZVBpY0ZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgc2lnbnVwUHJvZmlsZVBpY0xhYmVsLCBzaWdudXBQcm9maWxlUGljQ29udHJvbClcclxuXHJcbiAgICAvLyBjYXIgdHlwZSBzZWxlY3RcclxuICAgIGNvbnN0IHNlbF9pY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtY2FyXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBzZWxfaWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIHNlbF9pY29uKTtcclxuICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9jdGFuZVwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkRvbWludXMgR1RcIik7XHJcbiAgICBjb25zdCBzZWwxX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCcmVha291dCBUeXBlIFNcIik7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwidXNlckNhclwiIH0sIG51bGwsIHNlbDFfb3AxLCBzZWwxX29wMiwgc2VsMV9vcDMpO1xyXG4gICAgY29uc3Qgc2VsX0RpdiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtd2hpdGUtdGVyXCIgfSwgbnVsbCwgc2VsZWN0LCBzZWxfaWNvblNwYW4pO1xyXG4gICAgY29uc3Qgc2VsX2NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbF9EaXYpO1xyXG4gICAgY29uc3QgY29udHJvbExhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkNob29zZSBZb3VyIENhclwiKVxyXG5cclxuICAgIGNvbnN0IGNhclNlbGVjdEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkXCIgfSwgbnVsbCwgY29udHJvbExhYmVsLCBzZWxfY29udHJvbCk7XHJcblxyXG4gICAgLy8gZm9ybVxyXG4gICAgY29uc3Qgc2lnbnVwRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwic2lnbnVwRm9ybVwiLCBcImNsYXNzXCI6IFwiYm94XCIsIFwic3R5bGVcIjogXCJtaW4td2lkdGg6MjAlXCIgfSwgbnVsbCwgc2lnbnVwTmFtZUZpZWxkLCBzaWdudXBVc2VybmFtZUZpZWxkLCBzaWdudXBFbWFpbEZpZWxkLCBzaWdudXBQYXNzd29yZEZpZWxkLCBzaWdudXBDb25maXJtRmllbGQsIHNpZ251cFByb2ZpbGVQaWNGaWVsZCwgY2FyU2VsZWN0RmllbGQsIHNpZ251cEJ0bkNvbnRyb2wpO1xyXG5cclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2Uuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xyXG4gICAgd2VicGFnZS5zdHlsZS5qdXN0aWZ5Q29udGVudCA9IFwiY2VudGVyXCI7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmFsaWduSXRlbXMgPSBcImNlbnRlclwiO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChzaWdudXBGb3JtKTtcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIC8vIGFzc2lnbiBldmVudCBsaXN0ZW5lcnMgYmFzZWQgb24gd2hpY2ggZm9ybSBpcyBvbiB0aGUgd2VicGFnZVxyXG4gIHVzZXJFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBsb2dpbk5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9naW5Ob3dcIilcclxuICAgIGNvbnN0IHNpZ251cE5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2lnbnVwTm93XCIpXHJcbiAgICBpZiAobG9naW5Ob3cgPT09IG51bGwpIHtcclxuICAgICAgc2lnbnVwTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cFVzZXIsIGV2ZW50KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9naW5Ob3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9naW5Vc2VyLCBldmVudClcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsb2dpblVzZXIoZSkge1xyXG4gICAgLy8gdmFsaWRhdGUgdXNlciBsb2dpbiBmb3JtIGlucHV0cyBiZWZvcmUgbG9nZ2luZyBpblxyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc3QgdXNlcm5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IHBhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBpZiAodXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKHBhc3N3b3JkID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChgdXNlcnM/dXNlcm5hbWU9JHt1c2VybmFtZS50b0xvd2VyQ2FzZSgpfWApLnRoZW4odXNlciA9PiB7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgdXNlcm5hbWUgYW5kIHBhc3N3b3JkXHJcbiAgICAgICAgY29uc29sZS5sb2codXNlci5sZW5ndGgpXHJcbiAgICAgICAgaWYgKHVzZXIubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICBpZiAodXNlclswXS5wYXNzd29yZCA9PT0gcGFzc3dvcmQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwYXNzd29yZCBjaGVja1wiKVxyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXJbMF0pXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhbGVydChcIlVzZXJuYW1lIG9yIHBhc3N3b3JkIGlzIGluY29ycmVjdC5cIik7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhbGVydChcIlVzZXJuYW1lIG9yIHBhc3N3b3JkIGlzIGluY29ycmVjdC5cIik7XHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cFVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc3QgX25hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3VzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF9jb25maXJtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maXJtUGFzc3dvcmRcIikudmFsdWVcclxuICAgIGNvbnN0IF9lbWFpbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW1haWxJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3BpY3R1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByb2ZpbGVQaWNVUkxcIikudmFsdWVcclxuICAgIGNvbnN0IF9jYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJDYXJcIikudmFsdWVcclxuICAgIGlmIChfbmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3VzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9lbWFpbCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX2NvbmZpcm0gPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCAhPT0gX2NvbmZpcm0pIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKGB1c2Vycz91c2VybmFtZT0ke191c2VybmFtZS50b0xvd2VyQ2FzZSgpfWApLnRoZW4odXNlciA9PiB7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIGV4aXN0aW5nIHVzZXJuYW1lIGluIGRhdGFiYXNlLiBMZW5ndGggPSAxIGlmIHVzZXJuYW1lIGlzIG5vdCB1bmlxdWVcclxuICAgICAgICBpZiAodXNlci5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGFsZXJ0KFwidGhpcyB1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1wiKTtcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvL3Bvc3QgdGhlIG5ldyB1c2VyIGlmIHVzZXJuYW1lIGlzIHVuaXF1ZVxyXG4gICAgICAgICAgbGV0IG5ld1VzZXIgPSB7XHJcbiAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogX3VzZXJuYW1lLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgIGVtYWlsOiBfZW1haWwudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IF9wYXNzd29yZCxcclxuICAgICAgICAgICAgam9pbmVkOiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgICBjYXI6IF9jYXIsXHJcbiAgICAgICAgICAgIHBpY3R1cmU6IF9waWN0dXJlLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgQVBJLnBvc3RJdGVtKFwidXNlcnNcIiwgbmV3VXNlcikudGhlbih1c2VyID0+IHtcclxuICAgICAgICAgICAgbG9naW5PclNpZ251cC5sb2dpblN0YXR1c0FjdGl2ZSh1c2VyKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oXCJhY3RpdmVVc2VySWRcIiwgdXNlci5pZCk7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSk7IC8vYnVpbGQgbG9nZ2VkIGluIHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0VXNlcigpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoZmFsc2UpOyAvL2J1aWxkIGxvZ2dlZCBvdXQgdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsb2dpbk9yU2lnbnVwIiwiaW1wb3J0IG5hdmJhciBmcm9tIFwiLi9uYXZiYXJcIlxyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIjtcclxuXHJcbm5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKTtcclxuZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7IiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBsb2dpbk9yU2lnbnVwIGZyb20gXCIuL2xvZ2luXCJcclxuaW1wb3J0IHByb2ZpbGUgZnJvbSBcIi4vcHJvZmlsZVwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiXHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiXHJcblxyXG4vKlxyXG4gIEJ1bG1hIG5hdmJhciBzdHJ1Y3R1cmU6XHJcbiAgPG5hdj5cclxuICAgIDxuYXZiYXItYnJhbmQ+XHJcbiAgICAgIDxuYXZiYXItYnVyZ2VyPiAob3B0aW9uYWwpXHJcbiAgICA8L25hdmJhci1icmFuZD5cclxuICAgIDxuYXZiYXItbWVudT5cclxuICAgICAgPG5hdmJhci1zdGFydD5cclxuICAgICAgPC9uYXZiYXItc3RhcnQ+XHJcbiAgICAgIDxuYXZiYXItZW5kPlxyXG4gICAgICA8L25hdmJhci1lbmQ+XHJcbiAgICA8L25hdmJhci1tZW51PlxyXG4gIDwvbmF2PlxyXG4qL1xyXG5cclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IG5hdmJhciA9IHtcclxuXHJcbiAgZ2VuZXJhdGVOYXZiYXIobG9nZ2VkSW5Cb29sZWFuKSB7XHJcblxyXG4gICAgLy8gbmF2YmFyLW1lbnUgKHJpZ2h0IHNpZGUgb2YgbmF2YmFyIC0gYXBwZWFycyBvbiBkZXNrdG9wIDEwMjRweCspXHJcbiAgICBjb25zdCBidXR0b24yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW5cIilcclxuICAgIGNvbnN0IGJ1dHRvbjEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwXCIpXHJcbiAgICBjb25zdCBidXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGJ1dHRvbjEsIGJ1dHRvbjIpXHJcbiAgICBjb25zdCBtZW51SXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBudWxsLCBidXR0b25Db250YWluZXIpXHJcbiAgICBjb25zdCBuYXZiYXJFbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWVuZFwiIH0sIG51bGwsIG1lbnVJdGVtMSlcclxuICAgIGNvbnN0IG5hdmJhclN0YXJ0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1zdGFydFwiIH0pXHJcbiAgICBjb25zdCBuYXZiYXJNZW51ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIm5hdmJhck1lbnVcIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1tZW51XCIgfSwgbnVsbCwgbmF2YmFyU3RhcnQsIG5hdmJhckVuZClcclxuXHJcbiAgICAvLyBuYXZiYXItYnJhbmQgKGxlZnQgc2lkZSBvZiBuYXZiYXIgLSBpbmNsdWRlcyBtb2JpbGUgaGFtYnVyZ2VyIG1lbnUpXHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcInJvbGVcIjogXCJidXR0b25cIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1idXJnZXIgYnVyZ2VyXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1lbnVcIiwgXCJhcmlhLWV4cGFuZGVkXCI6IFwiZmFsc2VcIiwgXCJkYXRhLXRhcmdldFwiOiBcIm5hdmJhck1lbnVcIiB9LCBudWxsLCBidXJnZXJNZW51U3BhbjEsIGJ1cmdlck1lbnVTcGFuMiwgYnVyZ2VyTWVudVNwYW4zKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQxID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiLCBcImhyZWZcIjogXCIjXCIgfSwgbnVsbCwgZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvZmlyZTkwZGVnLnBuZ1wiLCBcIndpZHRoXCI6IFwiMTEyXCIsIFwiaGVpZ2h0XCI6IFwiMjhcIiB9KSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItYnJhbmRcIiB9LCBudWxsLCBuYXZiYXJCcmFuZENoaWxkMSwgbmF2YmFyQnJhbmRDaGlsZDIpO1xyXG5cclxuICAgIC8vIG5hdiAocGFyZW50IG5hdiBIVE1MIGVsZW1lbnQpXHJcbiAgICBjb25zdCBuYXYgPSBlbEJ1aWxkZXIoXCJuYXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyXCIsIFwicm9sZVwiOiBcIm5hdmlnYXRpb25cIiwgXCJhcmlhLWxhYmVsXCI6IFwibWFpbiBuYXZpZ2F0aW9uXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmQsIG5hdmJhck1lbnUpO1xyXG5cclxuICAgIC8vIGlmIGxvZ2dlZCBpbiwgYXBwZW5kIGFkZGl0aW9uYWwgbWVudSBvcHRpb25zIHRvIG5hdmJhciBhbmQgcmVtb3ZlIHNpZ251cC9sb2dpbiBidXR0b25zXHJcbiAgICBpZiAobG9nZ2VkSW5Cb29sZWFuKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBsb2cgaW4gYW5kIHNpZ24gdXAgYnV0dG9uc1xyXG4gICAgICBjb25zdCBzaWdudXAgPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1swXTtcclxuICAgICAgY29uc3QgbG9naW4gPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1sxXTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKHNpZ251cCk7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChsb2dpbik7XHJcbiAgICAgIC8vIGFkZCBsb2dvdXQgYnV0dG9uXHJcbiAgICAgIGNvbnN0IGJ1dHRvbjMgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dvdXRcIik7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChidXR0b24zKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhbmQgYXBwZW5kIG5ldyBtZW51IGl0ZW1zIGZvciB1c2VyXHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJIb21lXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiUHJvZmlsZVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkdhbWVwbGF5XCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW00ID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiSGVhdG1hcHNcIik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0yKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMyk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gbmF2YmFyXHJcbiAgICB0aGlzLm5hdmJhckV2ZW50TWFuYWdlcihuYXYpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlTmF2LmFwcGVuZENoaWxkKG5hdik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYWRkcyBhIHNpbmdsZSBjbGljayBsaXN0ZW5lciB0byB0aGUgbmF2IHRoYXQgcmVkaXJlY3RzIHRoZSB1c2VyIHRvIHRoZSBjb3JyZWN0IHBhZ2VcclxuICAgIC8vIGJhc2VkIG9uIHRoZSB0ZXh0IGNvbnRlbnQgb2YgdGhlIHRhcmdldFxyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xyXG5cclxuICAgICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ2luXCIpIHtcclxuICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luRm9ybSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgICAgbG9naW5PclNpZ251cC5zaWdudXBGb3JtKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dvdXRcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpO1xyXG4gICAgICAgIGxvZ2luT3JTaWdudXAubG9nb3V0VXNlcigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiUHJvZmlsZVwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuY2xlYXJIZWF0bWFwUmVwYWludEludGVydmFsKCk7XHJcbiAgICAgICAgcHJvZmlsZS5sb2FkUHJvZmlsZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiR2FtZXBsYXlcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpO1xyXG4gICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiSGVhdG1hcHNcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZUJhbGxTcGVlZEdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgICAgICBoZWF0bWFwcy5sb2FkSGVhdG1hcENvbnRhaW5lcnMoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmF2YmFyIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcbmxldCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHVzZWQgdG8gY291bnQgdG90YWwgZ2FtZXMgYW5kIHNob3RzXHJcbmxldCBnYW1lSWRzID0gW107XHJcblxyXG5jb25zdCBwcm9maWxlID0ge1xyXG5cclxuICBsb2FkUHJvZmlsZSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICAvLyBnZXQgdXNlciwgdGhlbiBwdXNoIGFsbCB1bmlxdWUgZ2FtZSBJRHMgdG8gYXJyYXksIHRoZW4gZmV0Y2ggYWxsIHNob3RzIGFzc29jaWF0ZWQgd2l0aCBnYW1lIElkc1xyXG4gICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJ1c2Vyc1wiLCBhY3RpdmVVc2VySWQpLnRoZW4odXNlciA9PiB7XHJcbiAgICAgIEFQSS5nZXRBbGwoYGdhbWVzP3VzZXJJZD0ke3VzZXIuaWR9YCkudGhlbihnYW1lcyA9PiB7XHJcbiAgICAgICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChnYW1lSWRzKTtcclxuICAgICAgfSlcclxuICAgICAgICAudGhlbihnYW1lSWRzID0+IHtcclxuICAgICAgICAgIGlmIChnYW1lSWRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBjYWxsIG5leHQgZnVuY3Rpb24gaW4gY2hhaW4gb2YgZnVuY3Rpb25zIHRvIGdldCBwbGF5c3R5bGVcclxuICAgICAgICAgICAgbGV0IHNob3RzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuZGV0ZXJtaW5lUGxheXN0eWxlKHVzZXIsIHNob3RzLCBnYW1lSWRzKTtcclxuICAgICAgICAgICAgZ2FtZUlkcyA9IFtdO1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBVUkwgPSBcInNob3RzXCI7XHJcbiAgICAgICAgICAgIGdhbWVJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKFVSTCA9PT0gXCJzaG90c1wiKSB7XHJcbiAgICAgICAgICAgICAgICBVUkwgKz0gYD9nYW1lSWQ9JHtpZH1gXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFVSTCArPSBgJmdhbWVJZD0ke2lkfWBcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiBBUEkuZ2V0QWxsKFVSTClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KS50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgIC8vIGNhbGwgbmV4dCBmdW5jdGlvbiBpbiBjaGFpbiBvZiBmdW5jdGlvbnMgdG8gZ2V0IHBsYXlzdHlsZVxyXG4gICAgICAgICAgdGhpcy5kZXRlcm1pbmVQbGF5c3R5bGUodXNlciwgc2hvdHMsIGdhbWVJZHMpO1xyXG4gICAgICAgICAgZ2FtZUlkcyA9IFtdO1xyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICB9LFxyXG5cclxuICBkZXRlcm1pbmVQbGF5c3R5bGUodXNlciwgc2hvdHMsIGdhbWVJZHMpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdXNlcyBhdmcgZmllbGQgY29vcmRpbmF0ZXMgdG8gbGFiZWwgdGhlIHVzZXIncyBwbGF5c3R5bGUgZm9yIHRoZWlyIHByb2ZpbGUgcGFnZVxyXG5cclxuICAgIC8vIGlmIHVzZXIgaGFzbid0IHNhdmVkIGFueSBnYW1lcywgcGFzcyBjb3JyZWN0IGluZm9ybWF0aW9uIHRvIGJ1aWxkIGZ1bmN0aW9uXHJcbiAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYnVpbGRQcm9maWxlKHVzZXIsIHNob3RzLCBnYW1lSWRzLCBcInVua25vd24gcG9zaXRpb25cIilcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc3VtWCA9IDA7XHJcbiAgICBsZXQgc3VtWSA9IDA7XHJcbiAgICBsZXQgYXZnWDtcclxuICAgIGxldCBhdmdZO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHN1bVggKz0gc2hvdC5maWVsZFg7XHJcbiAgICAgIHN1bVkgKz0gc2hvdC5maWVsZFk7XHJcbiAgICB9KVxyXG5cclxuICAgIGF2Z1ggPSBzdW1YIC8gc2hvdHMubGVuZ3RoO1xyXG4gICAgYXZnWSA9IHN1bVkgLyBzaG90cy5sZW5ndGg7XHJcbiAgICBsZXQgZmllbGRQb3NpdGlvbjtcclxuXHJcbiAgICBpZiAoYXZnWCA8IDAuMTUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwia2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4xNSA8PSBhdmdYICYmIGF2Z1ggPD0gMC4zMCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJzd2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJsZWZ0IGZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJyaWdodCBmdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNDUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiY2VudGVyIGZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJsZWZ0IGhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJyaWdodCBoYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNjApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiY2VudGVyIGhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC42MCA8PSBhdmdYICYmIGF2Z1ggPCAwLjc1ICYmIGF2Z1kgPD0gMC41MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJsZWZ0IGZvcndhcmRcIlxyXG4gICAgfSBlbHNlIGlmICgwLjYwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNzUgJiYgMC41MCA8IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwicmlnaHQgZm9yd2FyZFwiXHJcbiAgICB9IGVsc2UgaWYgKDAuNzUgPD0gYXZnWCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJzdHJpa2VyXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBjYWxsIGZ1bmN0aW9uIHRvIGxvYWQgY29udGFpbmVycyB1c2luZyBhbGwgZmV0Y2hlZCBpbmZvcm1hdGlvblxyXG4gICAgdGhpcy5idWlsZFByb2ZpbGUodXNlciwgc2hvdHMsIGdhbWVJZHMsIGZpZWxkUG9zaXRpb24pO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkUHJvZmlsZSh1c2VyLCBzaG90cywgZ2FtZUlkcywgZmllbGRQb3NpdGlvbikge1xyXG5cclxuICAgIC8vIG1lZGlhIGNvbnRhaW5lcnMgc2hvd2luZyB1c2VyIHN0YXRzIChhcHBlbmRlZCB0byBjYXJkIGNvbnRhaW5lcilcclxuICAgIGNvbnN0IHBsYXlzdHlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy0zXCIgfSwgYFBsYXlzICR7ZmllbGRQb3NpdGlvbn1gKVxyXG4gICAgY29uc3QgcGxheXN0eWxlQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250ZW50XCIgfSwgbnVsbCwgcGxheXN0eWxlKVxyXG4gICAgY29uc3QgcGxheXN0eWxlQ29udGVudFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1jb250ZW50XCIgfSwgbnVsbCwgcGxheXN0eWxlQ29udGVudClcclxuICAgIGNvbnN0IGljb24zID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvaWNvbnMvaWNvbnM4LXN0YWRpdW0tOTYucG5nXCIgfSwgbnVsbClcclxuICAgIGNvbnN0IGljb25QYXJlbnQzID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTQ4eDQ4XCIgfSwgbnVsbCwgaWNvbjMpXHJcbiAgICBjb25zdCBsZWZ0MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgaWNvblBhcmVudDMpO1xyXG4gICAgY29uc3QgdXNlclBsYXlzdHlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYSBpcy1tYXJnaW5sZXNzXCIsIFwic3R5bGVcIjogXCJwYWRkaW5nOjIwcHg7XCIgfSwgbnVsbCwgbGVmdDMsIHBsYXlzdHlsZUNvbnRlbnRQYXJlbnQpXHJcblxyXG4gICAgY29uc3QgZ2FtZVN0YXRzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTJcIiB9LCBgJHtnYW1lSWRzLmxlbmd0aH0gZ2FtZXNgKVxyXG4gICAgY29uc3QgZ2FtZUNvbnRlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGVudFwiIH0sIG51bGwsIGdhbWVTdGF0cylcclxuICAgIGNvbnN0IGdhbWVDb250ZW50UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhLWNvbnRlbnRcIiB9LCBudWxsLCBnYW1lQ29udGVudClcclxuICAgIGNvbnN0IGljb24yID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvaWNvbnMvaWNvbnM4LWdhbWUtY29udHJvbGxlci0xMDAucG5nXCIgfSwgbnVsbClcclxuICAgIGNvbnN0IGljb25QYXJlbnQyID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTQ4eDQ4XCIgfSwgbnVsbCwgaWNvbjIpXHJcbiAgICBjb25zdCBsZWZ0MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgaWNvblBhcmVudDIpO1xyXG4gICAgY29uc3QgdG90YWxHYW1lcyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYSBpcy1tYXJnaW5sZXNzXCIsIFwic3R5bGVcIjogXCJwYWRkaW5nOjIwcHg7XCIgfSwgbnVsbCwgbGVmdDIsIGdhbWVDb250ZW50UGFyZW50KVxyXG5cclxuICAgIGNvbnN0IGdvYWxTdGF0cyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy0yXCIgfSwgYCR7c2hvdHMubGVuZ3RofSBnb2Fsc2ApXHJcbiAgICBjb25zdCBnb2FsQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250ZW50XCIgfSwgbnVsbCwgZ29hbFN0YXRzKVxyXG4gICAgY29uc3QgZ29hbENvbnRlbnRQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibWVkaWEtY29udGVudFwiIH0sIG51bGwsIGdvYWxDb250ZW50KVxyXG4gICAgY29uc3QgaWNvbjEgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9pY29ucy9pY29uczgtc29jY2VyLWJhbGwtOTYucG5nXCIgfSwgbnVsbClcclxuICAgIGNvbnN0IGljb25QYXJlbnQxID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTQ4eDQ4XCIgfSwgbnVsbCwgaWNvbjEpXHJcbiAgICBjb25zdCBsZWZ0MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgaWNvblBhcmVudDEpO1xyXG4gICAgY29uc3QgdG90YWxHb2FscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYSBpcy1tYXJnaW5sZXNzXCIsIFwic3R5bGVcIjogXCJwYWRkaW5nOjIwcHg7XCIgfSwgbnVsbCwgbGVmdDEsIGdvYWxDb250ZW50UGFyZW50KVxyXG5cclxuICAgIC8vIGNhcmQgY29udGFpbmVyIHByb2ZpbGUgcGljdHVyZSwgY2FyIHBob3RvLCBuYW1lLCB1c2VybmFtZSwgYW5kIG1lbWJlciBzaW5jZSBtbS9kZC95eXl5XHJcbiAgICBsZXQgY2FySW1nVmFyaWFibGUgPSB1c2VyLmNhci50b0xvd2VyQ2FzZSgpO1xyXG4gICAgbGV0IHByb2ZpbGVJbWdWYXJpYWJsZSA9IHVzZXIucGljdHVyZTtcclxuICAgIGxldCBwcm9maWxlSW1nVGl0bGUgPSB1c2VyLnBpY3R1cmU7XHJcbiAgICBpZiAodXNlci5waWN0dXJlID09PSBcIlwiKSB7XHJcbiAgICAgIHByb2ZpbGVJbWdWYXJpYWJsZSA9IFwiaW1hZ2VzL3Byb2ZpbGUtcGxhY2Vob2xkZXIuanBnXCJcclxuICAgICAgcHJvZmlsZUltZ1RpdGxlID0gXCJwcm9maWxlLXBsYWNlaG9sZGVyLmpwZ1wiXHJcbiAgICB9XHJcbiAgICBsZXQgbWVtYmVyU2luY2VEYXRlRm9ybWF0dGVkID0gbmV3IERhdGUodXNlci5qb2luZWQpLnRvTG9jYWxlU3RyaW5nKCkuc3BsaXQoXCIsXCIpWzBdO1xyXG5cclxuICAgIGNvbnN0IG1lbWJlclNpbmNlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInN1YnRpdGxlIGlzLTZcIiwgXCJzdHlsZVwiOiBcIm1hcmdpbi10b3A6MTBweFwiIH0sIGBCZWNhbWUgYSBob3RzaG90IG9uICR7bWVtYmVyU2luY2VEYXRlRm9ybWF0dGVkfWApXHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJ0YWdcIiB9LCBgQCR7dXNlci51c2VybmFtZX1gKTtcclxuICAgIGNvbnN0IG5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNCBpcy1tYXJnaW5sZXNzXCIgfSwgYCR7dXNlci5uYW1lfWApO1xyXG4gICAgY29uc3QgdXNlckluZm8gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibWVkaWEtY29udGVudFwiIH0sIG51bGwsIG5hbWUsIHVzZXJuYW1lLCBtZW1iZXJTaW5jZSk7XHJcbiAgICBjb25zdCBjYXJJbWcgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBgaW1hZ2VzL2NhcnMvJHtjYXJJbWdWYXJpYWJsZX0ucG5nYCwgXCJhbHRcIjogXCJjYXJcIiwgXCJ0aXRsZVwiOiBgJHtjYXJJbWdWYXJpYWJsZX1gIH0sIG51bGwpO1xyXG4gICAgY29uc3QgY2FySW1nRmlndXJlID0gZWxCdWlsZGVyKFwiZmlndXJlXCIsIHsgXCJjbGFzc1wiOiBcImltYWdlIGlzLTk2eDk2XCIgfSwgbnVsbCwgY2FySW1nKTtcclxuICAgIGNvbnN0IGNhckltZ1BhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtZWRpYS1sZWZ0XCIgfSwgbnVsbCwgY2FySW1nRmlndXJlKTtcclxuICAgIGNvbnN0IG1lZGlhID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1lZGlhXCIgfSwgbnVsbCwgY2FySW1nUGFyZW50LCB1c2VySW5mbyk7XHJcbiAgICBjb25zdCBjb250ZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNhcmQtY29udGVudFwiIH0sIG51bGwsIG1lZGlhKTtcclxuICAgIC8vIG1haW4gcHJvZmlsZSBwaWN0dXJlXHJcbiAgICBjb25zdCBJbWcgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBgJHtwcm9maWxlSW1nVmFyaWFibGV9YCwgXCJhbHRcIjogXCJwcm9maWxlIHBpY3R1cmVcIiwgXCJ0aXRsZVwiOiBgJHtwcm9maWxlSW1nVGl0bGV9YCB9KTtcclxuICAgIGNvbnN0IGZpZ3VyZSA9IGVsQnVpbGRlcihcImZpZ3VyZVwiLCB7IFwiY2xhc3NcIjogXCJpbWFnZVwiIH0sIG51bGwsIEltZyk7XHJcbiAgICBjb25zdCBwcm9maWxlUGljdHVyZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjYXJkLWltYWdlXCIgfSwgbnVsbCwgZmlndXJlKTtcclxuICAgIGNvbnN0IGNhcmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY2FyZFwiIH0sIG51bGwsIHByb2ZpbGVQaWN0dXJlLCBjb250ZW50LCB0b3RhbEdvYWxzLCB0b3RhbEdhbWVzLCB1c2VyUGxheXN0eWxlKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVycyB0aGF0IG9yZ2FuaXplIHByb2ZpbGUgaW5mb3JtYXRpb24gaW50byBjb2x1bW5zXHJcbiAgICBjb25zdCBibGFua0NvbHVtbkxlZnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS1mb3VydGhcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IHByb2ZpbGVDb2x1bW4gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLWhhbGZcIiB9LCBudWxsLCBjYXJkKTtcclxuICAgIGNvbnN0IGJsYW5rQ29sdW1uUmlnaHQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS1mb3VydGhcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGNvbHVtbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1ucyBpcy12Y2VudGVyZWRcIiB9LCBudWxsLCBibGFua0NvbHVtbkxlZnQsIHByb2ZpbGVDb2x1bW4sIGJsYW5rQ29sdW1uUmlnaHQpO1xyXG4gICAgY29uc3QgcGxheWVyUHJvZmlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJwcm9maWxlQ29udGFpbmVyXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXJcIiwgXCJzdHlsZVwiOiBcInBhZGRpbmc6MjBweDtcIiB9LCBudWxsLCBjb2x1bW5zKTtcclxuXHJcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChwbGF5ZXJQcm9maWxlKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHByb2ZpbGUiLCJjbGFzcyBzaG90T25Hb2FsIHtcclxuICBzZXQgZmllbGRYKGZpZWxkWCkge1xyXG4gICAgdGhpcy5fZmllbGRYID0gZmllbGRYXHJcbiAgfVxyXG4gIHNldCBmaWVsZFkoZmllbGRZKSB7XHJcbiAgICB0aGlzLl9maWVsZFkgPSBmaWVsZFlcclxuICB9XHJcbiAgc2V0IGdvYWxYKGdvYWxYKSB7XHJcbiAgICB0aGlzLl9nb2FsWCA9IGdvYWxYXHJcbiAgfVxyXG4gIHNldCBnb2FsWShnb2FsWSkge1xyXG4gICAgdGhpcy5fZ29hbFkgPSBnb2FsWVxyXG4gIH1cclxuICBzZXQgYWVyaWFsKGFlcmlhbEJvb2xlYW4pIHtcclxuICAgIHRoaXMuX2FlcmlhbCA9IGFlcmlhbEJvb2xlYW5cclxuICB9XHJcbiAgc2V0IGJhbGxTcGVlZChiYWxsU3BlZWQpIHtcclxuICAgIHRoaXMuYmFsbF9zcGVlZCA9IGJhbGxTcGVlZFxyXG4gIH1cclxuICBzZXQgdGltZVN0YW1wKGRhdGVPYmopIHtcclxuICAgIHRoaXMuX3RpbWVTdGFtcCA9IGRhdGVPYmpcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3RPbkdvYWwiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3RPbkdvYWwgZnJvbSBcIi4vc2hvdENsYXNzXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCI7XHJcblxyXG5sZXQgc2hvdENvdW50ZXIgPSAwO1xyXG5sZXQgZWRpdGluZ1Nob3QgPSBmYWxzZTsgLy9lZGl0aW5nIHNob3QgaXMgdXNlZCBmb3IgYm90aCBuZXcgYW5kIG9sZCBzaG90c1xyXG5sZXQgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxubGV0IHNob3RBcnJheSA9IFtdOyAvLyByZXNldCB3aGVuIGdhbWUgaXMgc2F2ZWRcclxuLy8gZ2xvYmFsIHZhcnMgdXNlZCB3aXRoIHNob3QgZWRpdGluZ1xyXG5sZXQgcHJldmlvdXNTaG90T2JqO1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRYO1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRZO1xyXG5sZXQgcHJldmlvdXNTaG90R29hbFg7XHJcbmxldCBwcmV2aW91c1Nob3RHb2FsWTtcclxuLy8gZ2xvYmFsIHZhciB1c2VkIHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lICh0byBkZXRlcm1pbmUgaWYgbmV3IHNob3RzIHdlcmUgYWRkZWQgZm9yIFBPU1QpXHJcbmxldCBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXk7XHJcblxyXG5jb25zdCBzaG90RGF0YSA9IHtcclxuXHJcbiAgcmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiBnYW1lcGxheSBpcyBjbGlja2VkIG9uIHRoZSBuYXZiYXIgYW5kIHdoZW4gYSBnYW1lIGlzIHNhdmVkLCBpbiBvcmRlciB0byBwcmV2ZW50IGJ1Z3Mgd2l0aCBwcmV2aW91c2x5IGNyZWF0ZWQgc2hvdHNcclxuICAgIHNob3RDb3VudGVyID0gMDtcclxuICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgc2hvdEFycmF5ID0gW107XHJcbiAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gdW5kZWZpbmVkO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZU5ld1Nob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuICAgIHNob3RPYmogPSBuZXcgc2hvdE9uR29hbDtcclxuICAgIHNob3RPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IHVzZXIgZnJvbSBzZWxlY3RpbmcgYW55IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKHRydWUpO1xyXG5cclxuICAgIGVkaXRpbmdTaG90ID0gdHJ1ZTtcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG5cclxuICAgIC8vIGFjdGl2YXRlIGNsaWNrIGZ1bmN0aW9uYWxpdHkgYW5kIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgb24gYm90aCBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICB9LFxyXG5cclxuICBnZXRDbGlja0Nvb3JkcyhlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdldHMgdGhlIHJlbGF0aXZlIHggYW5kIHkgb2YgdGhlIGNsaWNrIHdpdGhpbiB0aGUgZmllbGQgaW1hZ2UgY29udGFpbmVyXHJcbiAgICAvLyBhbmQgdGhlbiBjYWxscyB0aGUgZnVuY3Rpb24gdGhhdCBhcHBlbmRzIGEgbWFya2VyIG9uIHRoZSBwYWdlXHJcbiAgICBsZXQgcGFyZW50Q29udGFpbmVyO1xyXG4gICAgaWYgKGUudGFyZ2V0LmlkID09PSBcImZpZWxkLWltZ1wiKSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgfVxyXG4gICAgLy8gb2Zmc2V0WCBhbmQgWSBhcmUgdGhlIHggYW5kIHkgY29vcmRpbmF0ZXMgKHBpeGVscykgb2YgdGhlIGNsaWNrIGluIHRoZSBjb250YWluZXJcclxuICAgIC8vIHRoZSBleHByZXNzaW9ucyBkaXZpZGUgdGhlIGNsaWNrIHggYW5kIHkgYnkgdGhlIHBhcmVudCBmdWxsIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgIGNvbnN0IHhDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFggLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpXHJcbiAgICBjb25zdCB5Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRZIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkudG9GaXhlZCgzKSk7XHJcbiAgICAvLyByZXN0cmljdCB1c2VyIGZyb20gc3VibWl0dGluZyBhIGNsaWNrIGluIHRoZSBnb2FsIGlmIHkgPCAwLjIwIG9yIHkgPiAwLjg1IG9yIHggPiAwLjkwIG9yIHggPCAwLjEwXHJcbiAgICBpZiAocGFyZW50Q29udGFpbmVyLmlkID09PSBcImdvYWwtaW1nLXBhcmVudFwiICYmIHlDb29yZFJlbGF0aXZlIDwgMC4yMCB8fCB5Q29vcmRSZWxhdGl2ZSA+IDAuODUgfHwgeENvb3JkUmVsYXRpdmUgPCAwLjEwIHx8IHhDb29yZFJlbGF0aXZlID4gMC45MCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeENvb3JkUmVsYXRpdmUsIHlDb29yZFJlbGF0aXZlLCBwYXJlbnRDb250YWluZXIpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpIHtcclxuICAgIGNvbnNvbGUubG9nKHgsIHkpXHJcbiAgICBsZXQgbWFya2VySWQ7XHJcbiAgICBpZiAocGFyZW50Q29udGFpbmVyLmlkID09PSBcImZpZWxkLWltZy1wYXJlbnRcIikge1xyXG4gICAgICBtYXJrZXJJZCA9IFwic2hvdC1tYXJrZXItZmllbGRcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1nb2FsXCI7XHJcbiAgICB9XHJcbiAgICAvLyBhZGp1c3QgZm9yIDUwJSBvZiB3aWR0aCBhbmQgaGVpZ2h0IG9mIG1hcmtlciBzbyBpdCdzIGNlbnRlcmVkIGFib3V0IG1vdXNlIHBvaW50ZXJcclxuICAgIGxldCBhZGp1c3RNYXJrZXJYID0gMTIuNSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCBhZGp1c3RNYXJrZXJZID0gMTIuNSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBOT1QgYWxyZWFkeSBhIG1hcmtlciwgdGhlbiBtYWtlIG9uZSBhbmQgcGxhY2UgaXRcclxuICAgIGlmICghcGFyZW50Q29udGFpbmVyLmNvbnRhaW5zKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1hcmtlcklkKSkpIHtcclxuICAgICAgdGhpcy5nZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KTtcclxuICAgICAgLy8gZWxzZSBtb3ZlIHRoZSBleGlzdGluZyBtYXJrZXIgdG8gdGhlIG5ldyBwb3NpdGlvblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5tb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKTtcclxuICAgIH1cclxuICAgIC8vIHNhdmUgY29vcmRpbmF0ZXMgdG8gb2JqZWN0XHJcbiAgICB0aGlzLmFkZENvb3Jkc1RvQ2xhc3MobWFya2VySWQsIHgsIHkpXHJcbiAgfSxcclxuXHJcbiAgZ2VuZXJhdGVNYXJrZXIocGFyZW50Q29udGFpbmVyLCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZLCBtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIGRpdi5pZCA9IG1hcmtlcklkO1xyXG4gICAgZGl2LnN0eWxlLndpZHRoID0gXCIyNXB4XCI7XHJcbiAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gXCIyNXB4XCI7XHJcbiAgICBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJmaXJlYnJpY2tcIjtcclxuICAgIGRpdi5zdHlsZS5ib3JkZXIgPSBcIjFweCBzb2xpZCBibGFja1wiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiNTAlXCI7XHJcbiAgICBkaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICBkaXYuc3R5bGUubGVmdCA9ICh4IC0gYWRqdXN0TWFya2VyWCkgKiAxMDAgKyBcIiVcIjtcclxuICAgIGRpdi5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQoZGl2KTtcclxuICB9LFxyXG5cclxuICBtb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKSB7XHJcbiAgICBjb25zdCBjdXJyZW50TWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgfSxcclxuXHJcbiAgYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB1cGRhdGVzIHRoZSBpbnN0YW5jZSBvZiBzaG90T25Hb2FsIGNsYXNzIHRvIHJlY29yZCBjbGljayBjb29yZGluYXRlc1xyXG4gICAgLy8gaWYgYSBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBhcHBlbmQgdGhlIGNvb3JkaW5hdGVzIHRvIHRoZSBvYmplY3QgaW4gcXVlc3Rpb25cclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIC8vIHVzZSBnbG9iYWwgdmFycyBpbnN0ZWFkIG9mIHVwZGF0aW5nIG9iamVjdCBkaXJlY3RseSBoZXJlIHRvIHByZXZlbnQgYWNjaWRlbnRhbCBlZGl0aW5nIG9mIG1hcmtlciB3aXRob3V0IGNsaWNraW5nIFwic2F2ZSBzaG90XCJcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgICAvLyBvdGhlcndpc2UsIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgc28gYXBwZW5kIGNvb3JkaW5hdGVzIHRvIHRoZSBuZXcgb2JqZWN0XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIHNob3RPYmouZmllbGRYID0geDtcclxuICAgICAgICBzaG90T2JqLmZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWCA9IHg7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWSA9IHk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjYW5jZWxTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICBpZiAoIWVkaXRpbmdTaG90KSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAvLyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQsIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzc1xyXG4gICAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZFxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgaWYgKGZpZWxkTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChnb2FsTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZ29hbEltZ1BhcmVudC5yZW1vdmVDaGlsZChnb2FsTWFya2VyKTtcclxuICAgICAgfVxyXG4gICAgICAvLyByZW1vdmUgY2xpY2sgbGlzdGVuZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgZ29hbEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBmaXJzdCBjaGVjayBpZiBiYWxsIHNwZWVkIGVudHJ5IGlzIGJsYW5rIG9yIGlmIHRoZSBmaWVsZC9nb2FsIGltYWdlcyBoYXZlbid0IGJlZW4gY2xpY2tlZFxyXG4gICAgICAvLyBub3RlIFwiZVwiIGlzIGNvbnNpZGVyZWQgYSBudW1iZXIgYW5kIHNob3VsZCBub3QgYmUgYWNjZXB0ZWQgZWl0aGVyXHJcbiAgICAgIGlmIChpbnB0X2JhbGxTcGVlZC52YWx1ZSA9PT0gXCJcIiB8fCBnb2FsTWFya2VyID09PSBudWxsIHx8IGZpZWxkTWFya2VyID09PSBudWxsKSB7XHJcbiAgICAgICAgYWxlcnQoXCJBIGJhbGwgc3BlZWQsIGEgZmllbGQgbWFya2VyLCBhbmQgYSBnb2FsIG1hcmtlciBhcmUgYWxsIHJlcXVpcmVkIHRvIHNhdmUgYSBzaG90LiBJZiBiYWxsIHNwZWVkIGlzIHVua25vd24sIHVzZSB5b3VyIGF2ZXJhZ2UgbGlzdGVkIG9uIHRoZSBoZWF0bWFwcyBwYWdlLlwiKTtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgLy8gY2xlYXIgZmllbGQgYW5kIGdvYWwgZXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICAgIGZpZWxkSW1nUGFyZW50LnJlbW92ZUNoaWxkKGZpZWxkTWFya2VyKTtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICAgIC8vIGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBzYXZlIGNvcnJlY3Qgb2JqZWN0IChpLmUuIHNob3QgYmVpbmcgZWRpdGVkIHZzLiBuZXcgc2hvdClcclxuICAgICAgICAvLyBpZiBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBwcmV2aW91c1Nob3RPYmogd2lsbCBub3QgYmUgdW5kZWZpbmVkXHJcbiAgICAgICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBpZiAoc2VsX2FlcmlhbC52YWx1ZSA9PT0gXCJBZXJpYWxcIikgeyBwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9IHRydWUgfSBlbHNlIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSBmYWxzZSB9O1xyXG4gICAgICAgICAgcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRYID0gcHJldmlvdXNTaG90RmllbGRYO1xyXG4gICAgICAgICAgcHJldmlvdXNTaG90T2JqLl9maWVsZFkgPSBwcmV2aW91c1Nob3RGaWVsZFk7XHJcbiAgICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxYID0gcHJldmlvdXNTaG90R29hbFg7XHJcbiAgICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxZID0gcHJldmlvdXNTaG90R29hbFk7XHJcbiAgICAgICAgICAvLyBlbHNlIHNhdmUgdG8gbmV3IGluc3RhbmNlIG9mIGNsYXNzIGFuZCBhcHBlbmQgYnV0dG9uIHRvIHBhZ2Ugd2l0aCBjb3JyZWN0IElEIGZvciBlZGl0aW5nXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHNob3RPYmouYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBzaG90T2JqLmFlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgICBzaG90T2JqLmJhbGxTcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgICAgc2hvdEFycmF5LnB1c2goc2hvdE9iaik7XHJcbiAgICAgICAgICAvLyBhcHBlbmQgbmV3IGJ1dHRvblxyXG4gICAgICAgICAgc2hvdENvdW50ZXIrKztcclxuICAgICAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7c2hvdENvdW50ZXJ9YCwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1saW5rXCIgfSwgYFNob3QgJHtzaG90Q291bnRlcn1gKTtcclxuICAgICAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke3Nob3RDb3VudGVyfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5yZW5kZXJTYXZlZFNob3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL1RPRE86IGFkZCBjb25kaXRpb24gdG8gcHJldmVudCBibGFuayBlbnRyaWVzIGFuZCBtaXNzaW5nIGNvb3JkaW5hdGVzXHJcblxyXG4gICAgICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gbnVsbDtcclxuICAgICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAgIC8vIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzcyAobWF0dGVycyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQpXHJcbiAgICAgICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgICAvLyBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkIChtYXR0ZXJzIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZClcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICByZW5kZXJTYXZlZFNob3QoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZWZlcmVuY2VzIHRoZSBzaG90QXJyYXkgdG8gZ2V0IGEgc2hvdCBvYmplY3QgdGhhdCBtYXRjaGVzIHRoZSBzaG90IyBidXR0b24gY2xpY2tlZCAoZS5nLiBzaG90IDIgYnV0dG9uID0gaW5kZXggMSBvZiB0aGUgc2hvdEFycmF5KVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIChhbmQgaXRzIGFzc29jaWF0ZWQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBpbiBvdGhlciBsb2NhbCBmdW5jdGlvbnMpIGhhcyB0aGVzZSBiYXNpYyByZXF1aXJlbWVudHM6XHJcbiAgICAvLyByZS1pbml0aWFsaXplIGNsaWNrIGxpc3RlbmVycyBvbiBpbWFnZXNcclxuICAgIC8vIHJldml2ZSBhIHNhdmVkIGluc3RhbmNlIG9mIHNob3RDbGFzcyBpbiB0aGUgc2hvdEFycmF5IGZvciBlZGl0aW5nIHNob3QgY29vcmRpbmF0ZXMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWxcclxuICAgIC8vIHJlbmRlciBtYXJrZXJzIGZvciBleGlzdGluZyBjb29yZGluYXRlcyBvbiBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICAgIC8vIGFmZm9yZGFuY2UgdG8gc2F2ZSBlZGl0c1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBjYW5jZWwgZWRpdHNcclxuICAgIC8vIHRoZSBkYXRhIGlzIHJlbmRlcmVkIG9uIHRoZSBwYWdlIGFuZCBjYW4gYmUgc2F2ZWQgKG92ZXJ3cml0dGVuKSBieSB1c2luZyB0aGUgXCJzYXZlIHNob3RcIiBidXR0b24gb3IgY2FuY2VsZWQgYnkgY2xpY2tpbmcgdGhlIFwiY2FuY2VsIHNob3RcIiBidXR0b25cclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcblxyXG4gICAgLy8gcHJldmVudCBuZXcgc2hvdCBidXR0b24gZnJvbSBiZWluZyBjbGlja2VkXHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAvLyBhbGxvdyBjYW5jZWwgYW5kIHNhdmVkIGJ1dHRvbnMgdG8gYmUgY2xpY2tlZFxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgLy8gZ2V0IElEIG9mIHNob3QjIGJ0biBjbGlja2VkIGFuZCBhY2Nlc3Mgc2hvdEFycmF5IGF0IFtidG5JRCAtIDFdXHJcbiAgICBsZXQgYnRuSWQgPSBlLnRhcmdldC5pZC5zbGljZSg1KTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHNob3RBcnJheVtidG5JZCAtIDFdO1xyXG4gICAgLy8gcmVuZGVyIGJhbGwgc3BlZWQgYW5kIGFlcmlhbCBkcm9wZG93biBmb3IgdGhlIHNob3RcclxuICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQ7XHJcbiAgICBpZiAocHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPT09IHRydWUpIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiQWVyaWFsXCI7IH0gZWxzZSB7IHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7IH1cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gZmllbGQgYW5kIGdvYWxcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAvLyByZW5kZXIgc2hvdCBtYXJrZXIgb24gZmllbGRcclxuICAgIGxldCBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIilcclxuICAgIGxldCB4ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB5ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG4gICAgLy8gcmVuZGVyIGdvYWwgbWFya2VyIG9uIGZpZWxkXHJcbiAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKVxyXG4gICAgeCA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKTtcclxuICAgIHkgPSBOdW1iZXIoKChwcmV2aW91c1Nob3RPYmouX2dvYWxZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhkaXNhYmxlT3JOb3QpIHtcclxuICAgIC8vIGZvciBlYWNoIGJ1dHRvbiBhZnRlciBcIk5ldyBTaG90XCIsIFwiU2F2ZSBTaG90XCIsIGFuZCBcIkNhbmNlbCBTaG90XCIgZGlzYWJsZSB0aGUgYnV0dG9ucyBpZiB0aGUgdXNlciBpcyBjcmVhdGluZyBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSB0cnVlKSBvciBlbmFibGUgdGhlbSBvbiBzYXZlL2NhbmNlbCBvZiBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSBmYWxzZSlcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIGxldCBlZGl0QnRuO1xyXG4gICAgbGV0IGxlbmd0aCA9IHNob3RCdG5Db250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGg7XHJcbiAgICBmb3IgKGxldCBpID0gMzsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVkaXRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke2kgLSAyfWApO1xyXG4gICAgICBlZGl0QnRuLmRpc2FibGVkID0gZGlzYWJsZU9yTm90O1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBnZXRTaG90T2JqZWN0c0ZvclNhdmluZygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGFycmF5IGZvciB1c2UgaW4gZ2FtZURhdGEuanMgKHdoZW4gc2F2aW5nIGEgbmV3IGdhbWUsIG5vdCB3aGVuIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSlcclxuICAgIHJldHVybiBzaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbE51bU9mU2hvdHMoKSB7XHJcbiAgICAvLyBwcm92aWRlcyBpbml0aWFsIG51bWJlciBvZiBzaG90cyB0aGF0IHdlcmUgc2F2ZWQgdG8gZGF0YWJhc2UgdG8gZ2FtZURhdGEuanMgdG8gaWRlbnRpZnkgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWRcclxuICAgIHJldHVybiBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2hvdHNCdXR0b25zRnJvbVByZXZpb3VzR2FtZSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVxdWVzdHMgdGhlIGFycmF5IG9mIHNob3RzIGZyb20gdGhlIHByZXZpb3VzIHNhdmVkIGdhbWUsIHNldHMgaXQgYXMgc2hvdEFycmF5LCBhbmQgcmVuZGVycyBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIC8vIGdldCBzYXZlZCBnYW1lIHdpdGggc2hvdHMgZW1iZWRkZWQgYXMgYXJyYXlcclxuICAgIGxldCBzYXZlZEdhbWVPYmogPSBnYW1lRGF0YS5wcm92aWRlU2hvdHNUb1Nob3REYXRhKCk7XHJcbiAgICAvLyBjcmVhdGUgc2hvdEFycmF5IHdpdGggZm9ybWF0IHJlcXVpcmVkIGJ5IGxvY2FsIGZ1bmN0aW9uc1xyXG4gICAgbGV0IHNhdmVkU2hvdE9ialxyXG4gICAgc2F2ZWRHYW1lT2JqLnNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHNhdmVkU2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsXHJcbiAgICAgIHNhdmVkU2hvdE9iai5maWVsZFggPSBzaG90LmZpZWxkWDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWSA9IHNob3QuZmllbGRZO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFggPSBzaG90LmdvYWxYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFkgPSBzaG90LmdvYWxZO1xyXG4gICAgICBzYXZlZFNob3RPYmouYWVyaWFsID0gc2hvdC5hZXJpYWw7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5iYWxsX3NwZWVkID0gc2hvdC5iYWxsX3NwZWVkLnRvU3RyaW5nKCk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai50aW1lU3RhbXAgPSBzaG90LnRpbWVTdGFtcFxyXG4gICAgICBzYXZlZFNob3RPYmouaWQgPSBzaG90LmlkXHJcbiAgICAgIHNob3RBcnJheS5wdXNoKHNhdmVkU2hvdE9iaik7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKHNob3RBcnJheSk7XHJcbiAgICBzaG90QXJyYXkuZm9yRWFjaCgoc2hvdCwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7aWR4ICsgMX1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke2lkeCArIDF9YCk7XHJcbiAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aWR4ICsgMX1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgIH0pO1xyXG4gICAgc2hvdENvdW50ZXIgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gc2hvdEFycmF5Lmxlbmd0aDtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90RGF0YSJdfQ==
