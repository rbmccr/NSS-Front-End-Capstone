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
          console.log(heatmaps);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2RhdGVGaWx0ZXIuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwRmVlZGJhY2suanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBzLmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIiwiLi4vc2NyaXB0cy9zaG90Q2xhc3MuanMiLCIuLi9zY3JpcHRzL3Nob3REYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFyQztBQUNEOztBQXRUYyxDQUFqQjtlQTBUZSxRIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypcbiAqIGhlYXRtYXAuanMgdjIuMC41IHwgSmF2YVNjcmlwdCBIZWF0bWFwIExpYnJhcnlcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOC0yMDE2IFBhdHJpY2sgV2llZCA8aGVhdG1hcGpzQHBhdHJpY2std2llZC5hdD4gLSBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogRHVhbCBsaWNlbnNlZCB1bmRlciBNSVQgYW5kIEJlZXJ3YXJlIGxpY2Vuc2UgXG4gKlxuICogOjogMjAxNi0wOS0wNSAwMToxNlxuICovXG47KGZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBmYWN0b3J5KSB7XG5cbiAgLy8gU3VwcG9ydHMgVU1ELiBBTUQsIENvbW1vbkpTL05vZGUuanMgYW5kIGJyb3dzZXIgY29udGV4dFxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRleHRbbmFtZV0gPSBmYWN0b3J5KCk7XG4gIH1cblxufSkoXCJoMzM3XCIsIHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuLy8gSGVhdG1hcCBDb25maWcgc3RvcmVzIGRlZmF1bHQgdmFsdWVzIGFuZCB3aWxsIGJlIG1lcmdlZCB3aXRoIGluc3RhbmNlIGNvbmZpZ1xudmFyIEhlYXRtYXBDb25maWcgPSB7XG4gIGRlZmF1bHRSYWRpdXM6IDQwLFxuICBkZWZhdWx0UmVuZGVyZXI6ICdjYW52YXMyZCcsXG4gIGRlZmF1bHRHcmFkaWVudDogeyAwLjI1OiBcInJnYigwLDAsMjU1KVwiLCAwLjU1OiBcInJnYigwLDI1NSwwKVwiLCAwLjg1OiBcInllbGxvd1wiLCAxLjA6IFwicmdiKDI1NSwwLDApXCJ9LFxuICBkZWZhdWx0TWF4T3BhY2l0eTogMSxcbiAgZGVmYXVsdE1pbk9wYWNpdHk6IDAsXG4gIGRlZmF1bHRCbHVyOiAuODUsXG4gIGRlZmF1bHRYRmllbGQ6ICd4JyxcbiAgZGVmYXVsdFlGaWVsZDogJ3knLFxuICBkZWZhdWx0VmFsdWVGaWVsZDogJ3ZhbHVlJywgXG4gIHBsdWdpbnM6IHt9XG59O1xudmFyIFN0b3JlID0gKGZ1bmN0aW9uIFN0b3JlQ2xvc3VyZSgpIHtcblxuICB2YXIgU3RvcmUgPSBmdW5jdGlvbiBTdG9yZShjb25maWcpIHtcbiAgICB0aGlzLl9jb29yZGluYXRvciA9IHt9O1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLl9yYWRpID0gW107XG4gICAgdGhpcy5fbWluID0gMTA7XG4gICAgdGhpcy5fbWF4ID0gMTtcbiAgICB0aGlzLl94RmllbGQgPSBjb25maWdbJ3hGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0WEZpZWxkO1xuICAgIHRoaXMuX3lGaWVsZCA9IGNvbmZpZ1sneUZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRZRmllbGQ7XG4gICAgdGhpcy5fdmFsdWVGaWVsZCA9IGNvbmZpZ1sndmFsdWVGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0VmFsdWVGaWVsZDtcblxuICAgIGlmIChjb25maWdbXCJyYWRpdXNcIl0pIHtcbiAgICAgIHRoaXMuX2NmZ1JhZGl1cyA9IGNvbmZpZ1tcInJhZGl1c1wiXTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGRlZmF1bHRSYWRpdXMgPSBIZWF0bWFwQ29uZmlnLmRlZmF1bHRSYWRpdXM7XG5cbiAgU3RvcmUucHJvdG90eXBlID0ge1xuICAgIC8vIHdoZW4gZm9yY2VSZW5kZXIgPSBmYWxzZSAtPiBjYWxsZWQgZnJvbSBzZXREYXRhLCBvbWl0cyByZW5kZXJhbGwgZXZlbnRcbiAgICBfb3JnYW5pc2VEYXRhOiBmdW5jdGlvbihkYXRhUG9pbnQsIGZvcmNlUmVuZGVyKSB7XG4gICAgICAgIHZhciB4ID0gZGF0YVBvaW50W3RoaXMuX3hGaWVsZF07XG4gICAgICAgIHZhciB5ID0gZGF0YVBvaW50W3RoaXMuX3lGaWVsZF07XG4gICAgICAgIHZhciByYWRpID0gdGhpcy5fcmFkaTtcbiAgICAgICAgdmFyIHN0b3JlID0gdGhpcy5fZGF0YTtcbiAgICAgICAgdmFyIG1heCA9IHRoaXMuX21heDtcbiAgICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbjtcbiAgICAgICAgdmFyIHZhbHVlID0gZGF0YVBvaW50W3RoaXMuX3ZhbHVlRmllbGRdIHx8IDE7XG4gICAgICAgIHZhciByYWRpdXMgPSBkYXRhUG9pbnQucmFkaXVzIHx8IHRoaXMuX2NmZ1JhZGl1cyB8fCBkZWZhdWx0UmFkaXVzO1xuXG4gICAgICAgIGlmICghc3RvcmVbeF0pIHtcbiAgICAgICAgICBzdG9yZVt4XSA9IFtdO1xuICAgICAgICAgIHJhZGlbeF0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3RvcmVbeF1beV0pIHtcbiAgICAgICAgICBzdG9yZVt4XVt5XSA9IHZhbHVlO1xuICAgICAgICAgIHJhZGlbeF1beV0gPSByYWRpdXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcmVbeF1beV0gKz0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0b3JlZFZhbCA9IHN0b3JlW3hdW3ldO1xuXG4gICAgICAgIGlmIChzdG9yZWRWYWwgPiBtYXgpIHtcbiAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXggPSBzdG9yZWRWYWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YU1heChzdG9yZWRWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmVkVmFsIDwgbWluKSB7XG4gICAgICAgICAgaWYgKCFmb3JjZVJlbmRlcikge1xuICAgICAgICAgICAgdGhpcy5fbWluID0gc3RvcmVkVmFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldERhdGFNaW4oc3RvcmVkVmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgeDogeCwgXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLCBcbiAgICAgICAgICAgIHJhZGl1czogcmFkaXVzLFxuICAgICAgICAgICAgbWluOiBtaW4sXG4gICAgICAgICAgICBtYXg6IG1heCBcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcbiAgICBfdW5Pcmdhbml6ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHVub3JnYW5pemVkRGF0YSA9IFtdO1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9kYXRhO1xuICAgICAgdmFyIHJhZGkgPSB0aGlzLl9yYWRpO1xuXG4gICAgICBmb3IgKHZhciB4IGluIGRhdGEpIHtcbiAgICAgICAgZm9yICh2YXIgeSBpbiBkYXRhW3hdKSB7XG5cbiAgICAgICAgICB1bm9yZ2FuaXplZERhdGEucHVzaCh7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHJhZGl1czogcmFkaVt4XVt5XSxcbiAgICAgICAgICAgIHZhbHVlOiBkYXRhW3hdW3ldXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICBkYXRhOiB1bm9yZ2FuaXplZERhdGFcbiAgICAgIH07XG4gICAgfSxcbiAgICBfb25FeHRyZW1hQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ2V4dHJlbWFjaGFuZ2UnLCB7XG4gICAgICAgIG1pbjogdGhpcy5fbWluLFxuICAgICAgICBtYXg6IHRoaXMuX21heFxuICAgICAgfSk7XG4gICAgfSxcbiAgICBhZGREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgZGF0YUFyciA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgdmFyIGRhdGFMZW4gPSBkYXRhQXJyLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGRhdGFMZW4tLSkge1xuICAgICAgICAgIHRoaXMuYWRkRGF0YS5jYWxsKHRoaXMsIGRhdGFBcnJbZGF0YUxlbl0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhZGQgdG8gc3RvcmUgIFxuICAgICAgICB2YXIgb3JnYW5pc2VkRW50cnkgPSB0aGlzLl9vcmdhbmlzZURhdGEoYXJndW1lbnRzWzBdLCB0cnVlKTtcbiAgICAgICAgaWYgKG9yZ2FuaXNlZEVudHJ5KSB7XG4gICAgICAgICAgLy8gaWYgaXQncyB0aGUgZmlyc3QgZGF0YXBvaW50IGluaXRpYWxpemUgdGhlIGV4dHJlbWFzIHdpdGggaXRcbiAgICAgICAgICBpZiAodGhpcy5fZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX21pbiA9IHRoaXMuX21heCA9IG9yZ2FuaXNlZEVudHJ5LnZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJwYXJ0aWFsJywge1xuICAgICAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgICAgIGRhdGE6IFtvcmdhbmlzZWRFbnRyeV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgZGF0YVBvaW50cyA9IGRhdGEuZGF0YTtcbiAgICAgIHZhciBwb2ludHNMZW4gPSBkYXRhUG9pbnRzLmxlbmd0aDtcblxuXG4gICAgICAvLyByZXNldCBkYXRhIGFycmF5c1xuICAgICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgICAgdGhpcy5fcmFkaSA9IFtdO1xuXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcG9pbnRzTGVuOyBpKyspIHtcbiAgICAgICAgdGhpcy5fb3JnYW5pc2VEYXRhKGRhdGFQb2ludHNbaV0sIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21heCA9IGRhdGEubWF4O1xuICAgICAgdGhpcy5fbWluID0gZGF0YS5taW4gfHwgMDtcbiAgICAgIFxuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVE9ETzogaW1wbGVtZW50XG4gICAgfSxcbiAgICBzZXREYXRhTWF4OiBmdW5jdGlvbihtYXgpIHtcbiAgICAgIHRoaXMuX21heCA9IG1heDtcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWluOiBmdW5jdGlvbihtaW4pIHtcbiAgICAgIHRoaXMuX21pbiA9IG1pbjtcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXRDb29yZGluYXRvcjogZnVuY3Rpb24oY29vcmRpbmF0b3IpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0gY29vcmRpbmF0b3I7XG4gICAgfSxcbiAgICBfZ2V0SW50ZXJuYWxEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7IFxuICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgbWluOiB0aGlzLl9taW4sIFxuICAgICAgICBkYXRhOiB0aGlzLl9kYXRhLFxuICAgICAgICByYWRpOiB0aGlzLl9yYWRpIFxuICAgICAgfTtcbiAgICB9LFxuICAgIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3VuT3JnYW5pemVEYXRhKCk7XG4gICAgfS8qLFxuXG4gICAgICBUT0RPOiByZXRoaW5rLlxuXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhciByYWRpdXMgPSAxMDA7XG4gICAgICB2YXIgeCA9IHBvaW50Lng7XG4gICAgICB2YXIgeSA9IHBvaW50Lnk7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAgIGlmIChkYXRhW3hdICYmIGRhdGFbeF1beV0pIHtcbiAgICAgICAgcmV0dXJuIGRhdGFbeF1beV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIC8vIHJhZGlhbCBzZWFyY2ggZm9yIGRhdGFwb2ludHMgYmFzZWQgb24gZGVmYXVsdCByYWRpdXNcbiAgICAgICAgZm9yKHZhciBkaXN0YW5jZSA9IDE7IGRpc3RhbmNlIDwgcmFkaXVzOyBkaXN0YW5jZSsrKSB7XG4gICAgICAgICAgdmFyIG5laWdoYm9ycyA9IGRpc3RhbmNlICogMiArMTtcbiAgICAgICAgICB2YXIgc3RhcnRYID0geCAtIGRpc3RhbmNlO1xuICAgICAgICAgIHZhciBzdGFydFkgPSB5IC0gZGlzdGFuY2U7XG5cbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG8gPSAwOyBvIDwgbmVpZ2hib3JzOyBvKyspIHtcbiAgICAgICAgICAgICAgaWYgKChpID09IDAgfHwgaSA9PSBuZWlnaGJvcnMtMSkgfHwgKG8gPT0gMCB8fCBvID09IG5laWdoYm9ycy0xKSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhW3N0YXJ0WStpXSAmJiBkYXRhW3N0YXJ0WStpXVtzdGFydFgrb10pIHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKGRhdGFbc3RhcnRZK2ldW3N0YXJ0WCtvXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgdmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0qL1xuICB9O1xuXG5cbiAgcmV0dXJuIFN0b3JlO1xufSkoKTtcblxudmFyIENhbnZhczJkUmVuZGVyZXIgPSAoZnVuY3Rpb24gQ2FudmFzMmRSZW5kZXJlckNsb3N1cmUoKSB7XG5cbiAgdmFyIF9nZXRDb2xvclBhbGV0dGUgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICB2YXIgZ3JhZGllbnRDb25maWcgPSBjb25maWcuZ3JhZGllbnQgfHwgY29uZmlnLmRlZmF1bHRHcmFkaWVudDtcbiAgICB2YXIgcGFsZXR0ZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBwYWxldHRlQ3R4ID0gcGFsZXR0ZUNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgcGFsZXR0ZUNhbnZhcy53aWR0aCA9IDI1NjtcbiAgICBwYWxldHRlQ2FudmFzLmhlaWdodCA9IDE7XG5cbiAgICB2YXIgZ3JhZGllbnQgPSBwYWxldHRlQ3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDI1NiwgMSk7XG4gICAgZm9yICh2YXIga2V5IGluIGdyYWRpZW50Q29uZmlnKSB7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3Aoa2V5LCBncmFkaWVudENvbmZpZ1trZXldKTtcbiAgICB9XG5cbiAgICBwYWxldHRlQ3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgIHBhbGV0dGVDdHguZmlsbFJlY3QoMCwgMCwgMjU2LCAxKTtcblxuICAgIHJldHVybiBwYWxldHRlQ3R4LmdldEltYWdlRGF0YSgwLCAwLCAyNTYsIDEpLmRhdGE7XG4gIH07XG5cbiAgdmFyIF9nZXRQb2ludFRlbXBsYXRlID0gZnVuY3Rpb24ocmFkaXVzLCBibHVyRmFjdG9yKSB7XG4gICAgdmFyIHRwbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciB0cGxDdHggPSB0cGxDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB2YXIgeCA9IHJhZGl1cztcbiAgICB2YXIgeSA9IHJhZGl1cztcbiAgICB0cGxDYW52YXMud2lkdGggPSB0cGxDYW52YXMuaGVpZ2h0ID0gcmFkaXVzKjI7XG5cbiAgICBpZiAoYmx1ckZhY3RvciA9PSAxKSB7XG4gICAgICB0cGxDdHguYmVnaW5QYXRoKCk7XG4gICAgICB0cGxDdHguYXJjKHgsIHksIHJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgIHRwbEN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwxKSc7XG4gICAgICB0cGxDdHguZmlsbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZ3JhZGllbnQgPSB0cGxDdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoeCwgeSwgcmFkaXVzKmJsdXJGYWN0b3IsIHgsIHksIHJhZGl1cyk7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwwLDAsMSknKTtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLDAsMCwwKScpO1xuICAgICAgdHBsQ3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgICAgdHBsQ3R4LmZpbGxSZWN0KDAsIDAsIDIqcmFkaXVzLCAyKnJhZGl1cyk7XG4gICAgfVxuXG5cblxuICAgIHJldHVybiB0cGxDYW52YXM7XG4gIH07XG5cbiAgdmFyIF9wcmVwYXJlRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgcmVuZGVyRGF0YSA9IFtdO1xuICAgIHZhciBtaW4gPSBkYXRhLm1pbjtcbiAgICB2YXIgbWF4ID0gZGF0YS5tYXg7XG4gICAgdmFyIHJhZGkgPSBkYXRhLnJhZGk7XG4gICAgdmFyIGRhdGEgPSBkYXRhLmRhdGE7XG5cbiAgICB2YXIgeFZhbHVlcyA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgIHZhciB4VmFsdWVzTGVuID0geFZhbHVlcy5sZW5ndGg7XG5cbiAgICB3aGlsZSh4VmFsdWVzTGVuLS0pIHtcbiAgICAgIHZhciB4VmFsdWUgPSB4VmFsdWVzW3hWYWx1ZXNMZW5dO1xuICAgICAgdmFyIHlWYWx1ZXMgPSBPYmplY3Qua2V5cyhkYXRhW3hWYWx1ZV0pO1xuICAgICAgdmFyIHlWYWx1ZXNMZW4gPSB5VmFsdWVzLmxlbmd0aDtcbiAgICAgIHdoaWxlKHlWYWx1ZXNMZW4tLSkge1xuICAgICAgICB2YXIgeVZhbHVlID0geVZhbHVlc1t5VmFsdWVzTGVuXTtcbiAgICAgICAgdmFyIHZhbHVlID0gZGF0YVt4VmFsdWVdW3lWYWx1ZV07XG4gICAgICAgIHZhciByYWRpdXMgPSByYWRpW3hWYWx1ZV1beVZhbHVlXTtcbiAgICAgICAgcmVuZGVyRGF0YS5wdXNoKHtcbiAgICAgICAgICB4OiB4VmFsdWUsXG4gICAgICAgICAgeTogeVZhbHVlLFxuICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICByYWRpdXM6IHJhZGl1c1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWluOiBtaW4sXG4gICAgICBtYXg6IG1heCxcbiAgICAgIGRhdGE6IHJlbmRlckRhdGFcbiAgICB9O1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gQ2FudmFzMmRSZW5kZXJlcihjb25maWcpIHtcbiAgICB2YXIgY29udGFpbmVyID0gY29uZmlnLmNvbnRhaW5lcjtcbiAgICB2YXIgc2hhZG93Q2FudmFzID0gdGhpcy5zaGFkb3dDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXMgPSBjb25maWcuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciByZW5kZXJCb3VuZGFyaWVzID0gdGhpcy5fcmVuZGVyQm91bmRhcmllcyA9IFsxMDAwMCwgMTAwMDAsIDAsIDBdO1xuXG4gICAgdmFyIGNvbXB1dGVkID0gZ2V0Q29tcHV0ZWRTdHlsZShjb25maWcuY29udGFpbmVyKSB8fCB7fTtcblxuICAgIGNhbnZhcy5jbGFzc05hbWUgPSAnaGVhdG1hcC1jYW52YXMnO1xuXG4gICAgdGhpcy5fd2lkdGggPSBjYW52YXMud2lkdGggPSBzaGFkb3dDYW52YXMud2lkdGggPSBjb25maWcud2lkdGggfHwgKyhjb21wdXRlZC53aWR0aC5yZXBsYWNlKC9weC8sJycpKTtcbiAgICB0aGlzLl9oZWlnaHQgPSBjYW52YXMuaGVpZ2h0ID0gc2hhZG93Q2FudmFzLmhlaWdodCA9IGNvbmZpZy5oZWlnaHQgfHwgKyhjb21wdXRlZC5oZWlnaHQucmVwbGFjZSgvcHgvLCcnKSk7XG5cbiAgICB0aGlzLnNoYWRvd0N0eCA9IHNoYWRvd0NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAvLyBAVE9ETzpcbiAgICAvLyBjb25kaXRpb25hbCB3cmFwcGVyXG5cbiAgICBjYW52YXMuc3R5bGUuY3NzVGV4dCA9IHNoYWRvd0NhbnZhcy5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt0b3A6MDsnO1xuXG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuICAgIHRoaXMuX3BhbGV0dGUgPSBfZ2V0Q29sb3JQYWxldHRlKGNvbmZpZyk7XG4gICAgdGhpcy5fdGVtcGxhdGVzID0ge307XG5cbiAgICB0aGlzLl9zZXRTdHlsZXMoY29uZmlnKTtcbiAgfTtcblxuICBDYW52YXMyZFJlbmRlcmVyLnByb3RvdHlwZSA9IHtcbiAgICByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5fZHJhd0FscGhhKGRhdGEpO1xuICAgICAgICB0aGlzLl9jb2xvcml6ZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVyQWxsOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyByZXNldCByZW5kZXIgYm91bmRhcmllc1xuICAgICAgdGhpcy5fY2xlYXIoKTtcbiAgICAgIGlmIChkYXRhLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9kcmF3QWxwaGEoX3ByZXBhcmVEYXRhKGRhdGEpKTtcbiAgICAgICAgdGhpcy5fY29sb3JpemUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIF91cGRhdGVHcmFkaWVudDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9wYWxldHRlID0gX2dldENvbG9yUGFsZXR0ZShjb25maWcpO1xuICAgIH0sXG4gICAgdXBkYXRlQ29uZmlnOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIGlmIChjb25maWdbJ2dyYWRpZW50J10pIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlR3JhZGllbnQoY29uZmlnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NldFN0eWxlcyhjb25maWcpO1xuICAgIH0sXG4gICAgc2V0RGltZW5zaW9uczogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICAgICAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcbiAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5zaGFkb3dDYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuc2hhZG93Q2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9LFxuICAgIF9jbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNoYWRvd0N0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCk7XG4gICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCk7XG4gICAgfSxcbiAgICBfc2V0U3R5bGVzOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX2JsdXIgPSAoY29uZmlnLmJsdXIgPT0gMCk/MDooY29uZmlnLmJsdXIgfHwgY29uZmlnLmRlZmF1bHRCbHVyKTtcblxuICAgICAgaWYgKGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29uZmlnLmJhY2tncm91bmRDb2xvcjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fd2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuc2hhZG93Q2FudmFzLndpZHRoID0gY29uZmlnLndpZHRoIHx8IHRoaXMuX3dpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zaGFkb3dDYW52YXMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCB8fCB0aGlzLl9oZWlnaHQ7XG5cblxuICAgICAgdGhpcy5fb3BhY2l0eSA9IChjb25maWcub3BhY2l0eSB8fCAwKSAqIDI1NTtcbiAgICAgIHRoaXMuX21heE9wYWNpdHkgPSAoY29uZmlnLm1heE9wYWNpdHkgfHwgY29uZmlnLmRlZmF1bHRNYXhPcGFjaXR5KSAqIDI1NTtcbiAgICAgIHRoaXMuX21pbk9wYWNpdHkgPSAoY29uZmlnLm1pbk9wYWNpdHkgfHwgY29uZmlnLmRlZmF1bHRNaW5PcGFjaXR5KSAqIDI1NTtcbiAgICAgIHRoaXMuX3VzZUdyYWRpZW50T3BhY2l0eSA9ICEhY29uZmlnLnVzZUdyYWRpZW50T3BhY2l0eTtcbiAgICB9LFxuICAgIF9kcmF3QWxwaGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBtaW4gPSB0aGlzLl9taW4gPSBkYXRhLm1pbjtcbiAgICAgIHZhciBtYXggPSB0aGlzLl9tYXggPSBkYXRhLm1heDtcbiAgICAgIHZhciBkYXRhID0gZGF0YS5kYXRhIHx8IFtdO1xuICAgICAgdmFyIGRhdGFMZW4gPSBkYXRhLmxlbmd0aDtcbiAgICAgIC8vIG9uIGEgcG9pbnQgYmFzaXM/XG4gICAgICB2YXIgYmx1ciA9IDEgLSB0aGlzLl9ibHVyO1xuXG4gICAgICB3aGlsZShkYXRhTGVuLS0pIHtcblxuICAgICAgICB2YXIgcG9pbnQgPSBkYXRhW2RhdGFMZW5dO1xuXG4gICAgICAgIHZhciB4ID0gcG9pbnQueDtcbiAgICAgICAgdmFyIHkgPSBwb2ludC55O1xuICAgICAgICB2YXIgcmFkaXVzID0gcG9pbnQucmFkaXVzO1xuICAgICAgICAvLyBpZiB2YWx1ZSBpcyBiaWdnZXIgdGhhbiBtYXhcbiAgICAgICAgLy8gdXNlIG1heCBhcyB2YWx1ZVxuICAgICAgICB2YXIgdmFsdWUgPSBNYXRoLm1pbihwb2ludC52YWx1ZSwgbWF4KTtcbiAgICAgICAgdmFyIHJlY3RYID0geCAtIHJhZGl1cztcbiAgICAgICAgdmFyIHJlY3RZID0geSAtIHJhZGl1cztcbiAgICAgICAgdmFyIHNoYWRvd0N0eCA9IHRoaXMuc2hhZG93Q3R4O1xuXG5cblxuXG4gICAgICAgIHZhciB0cGw7XG4gICAgICAgIGlmICghdGhpcy5fdGVtcGxhdGVzW3JhZGl1c10pIHtcbiAgICAgICAgICB0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXSA9IHRwbCA9IF9nZXRQb2ludFRlbXBsYXRlKHJhZGl1cywgYmx1cik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHBsID0gdGhpcy5fdGVtcGxhdGVzW3JhZGl1c107XG4gICAgICAgIH1cbiAgICAgICAgLy8gdmFsdWUgZnJvbSBtaW5pbXVtIC8gdmFsdWUgcmFuZ2VcbiAgICAgICAgLy8gPT4gWzAsIDFdXG4gICAgICAgIHZhciB0ZW1wbGF0ZUFscGhhID0gKHZhbHVlLW1pbikvKG1heC1taW4pO1xuICAgICAgICAvLyB0aGlzIGZpeGVzICMxNzY6IHNtYWxsIHZhbHVlcyBhcmUgbm90IHZpc2libGUgYmVjYXVzZSBnbG9iYWxBbHBoYSA8IC4wMSBjYW5ub3QgYmUgcmVhZCBmcm9tIGltYWdlRGF0YVxuICAgICAgICBzaGFkb3dDdHguZ2xvYmFsQWxwaGEgPSB0ZW1wbGF0ZUFscGhhIDwgLjAxID8gLjAxIDogdGVtcGxhdGVBbHBoYTtcblxuICAgICAgICBzaGFkb3dDdHguZHJhd0ltYWdlKHRwbCwgcmVjdFgsIHJlY3RZKTtcblxuICAgICAgICAvLyB1cGRhdGUgcmVuZGVyQm91bmRhcmllc1xuICAgICAgICBpZiAocmVjdFggPCB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdID0gcmVjdFg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWN0WSA8IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV0gPSByZWN0WTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RYICsgMipyYWRpdXMgPiB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdID0gcmVjdFggKyAyKnJhZGl1cztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RZICsgMipyYWRpdXMgPiB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdID0gcmVjdFkgKyAyKnJhZGl1cztcbiAgICAgICAgICB9XG5cbiAgICAgIH1cbiAgICB9LFxuICAgIF9jb2xvcml6ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgeCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF07XG4gICAgICB2YXIgeSA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV07XG4gICAgICB2YXIgd2lkdGggPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdIC0geDtcbiAgICAgIHZhciBoZWlnaHQgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdIC0geTtcbiAgICAgIHZhciBtYXhXaWR0aCA9IHRoaXMuX3dpZHRoO1xuICAgICAgdmFyIG1heEhlaWdodCA9IHRoaXMuX2hlaWdodDtcbiAgICAgIHZhciBvcGFjaXR5ID0gdGhpcy5fb3BhY2l0eTtcbiAgICAgIHZhciBtYXhPcGFjaXR5ID0gdGhpcy5fbWF4T3BhY2l0eTtcbiAgICAgIHZhciBtaW5PcGFjaXR5ID0gdGhpcy5fbWluT3BhY2l0eTtcbiAgICAgIHZhciB1c2VHcmFkaWVudE9wYWNpdHkgPSB0aGlzLl91c2VHcmFkaWVudE9wYWNpdHk7XG5cbiAgICAgIGlmICh4IDwgMCkge1xuICAgICAgICB4ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh5IDwgMCkge1xuICAgICAgICB5ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh4ICsgd2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICB3aWR0aCA9IG1heFdpZHRoIC0geDtcbiAgICAgIH1cbiAgICAgIGlmICh5ICsgaGVpZ2h0ID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgIGhlaWdodCA9IG1heEhlaWdodCAtIHk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbWcgPSB0aGlzLnNoYWRvd0N0eC5nZXRJbWFnZURhdGEoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICB2YXIgaW1nRGF0YSA9IGltZy5kYXRhO1xuICAgICAgdmFyIGxlbiA9IGltZ0RhdGEubGVuZ3RoO1xuICAgICAgdmFyIHBhbGV0dGUgPSB0aGlzLl9wYWxldHRlO1xuXG5cbiAgICAgIGZvciAodmFyIGkgPSAzOyBpIDwgbGVuOyBpKz0gNCkge1xuICAgICAgICB2YXIgYWxwaGEgPSBpbWdEYXRhW2ldO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gYWxwaGEgKiA0O1xuXG5cbiAgICAgICAgaWYgKCFvZmZzZXQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmaW5hbEFscGhhO1xuICAgICAgICBpZiAob3BhY2l0eSA+IDApIHtcbiAgICAgICAgICBmaW5hbEFscGhhID0gb3BhY2l0eTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoYWxwaGEgPCBtYXhPcGFjaXR5KSB7XG4gICAgICAgICAgICBpZiAoYWxwaGEgPCBtaW5PcGFjaXR5KSB7XG4gICAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBtaW5PcGFjaXR5O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZmluYWxBbHBoYSA9IGFscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaW5hbEFscGhhID0gbWF4T3BhY2l0eTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpbWdEYXRhW2ktM10gPSBwYWxldHRlW29mZnNldF07XG4gICAgICAgIGltZ0RhdGFbaS0yXSA9IHBhbGV0dGVbb2Zmc2V0ICsgMV07XG4gICAgICAgIGltZ0RhdGFbaS0xXSA9IHBhbGV0dGVbb2Zmc2V0ICsgMl07XG4gICAgICAgIGltZ0RhdGFbaV0gPSB1c2VHcmFkaWVudE9wYWNpdHkgPyBwYWxldHRlW29mZnNldCArIDNdIDogZmluYWxBbHBoYTtcblxuICAgICAgfVxuXG4gICAgICBpbWcuZGF0YSA9IGltZ0RhdGE7XG4gICAgICB0aGlzLmN0eC5wdXRJbWFnZURhdGEoaW1nLCB4LCB5KTtcblxuICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllcyA9IFsxMDAwLCAxMDAwLCAwLCAwXTtcblxuICAgIH0sXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhciBzaGFkb3dDdHggPSB0aGlzLnNoYWRvd0N0eDtcbiAgICAgIHZhciBpbWcgPSBzaGFkb3dDdHguZ2V0SW1hZ2VEYXRhKHBvaW50LngsIHBvaW50LnksIDEsIDEpO1xuICAgICAgdmFyIGRhdGEgPSBpbWcuZGF0YVszXTtcbiAgICAgIHZhciBtYXggPSB0aGlzLl9tYXg7XG4gICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuXG4gICAgICB2YWx1ZSA9IChNYXRoLmFicyhtYXgtbWluKSAqIChkYXRhLzI1NSkpID4+IDA7XG5cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuICAgIGdldERhdGFVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FudmFzLnRvRGF0YVVSTCgpO1xuICAgIH1cbiAgfTtcblxuXG4gIHJldHVybiBDYW52YXMyZFJlbmRlcmVyO1xufSkoKTtcblxuXG52YXIgUmVuZGVyZXIgPSAoZnVuY3Rpb24gUmVuZGVyZXJDbG9zdXJlKCkge1xuXG4gIHZhciByZW5kZXJlckZuID0gZmFsc2U7XG5cbiAgaWYgKEhlYXRtYXBDb25maWdbJ2RlZmF1bHRSZW5kZXJlciddID09PSAnY2FudmFzMmQnKSB7XG4gICAgcmVuZGVyZXJGbiA9IENhbnZhczJkUmVuZGVyZXI7XG4gIH1cblxuICByZXR1cm4gcmVuZGVyZXJGbjtcbn0pKCk7XG5cblxudmFyIFV0aWwgPSB7XG4gIG1lcmdlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWVyZ2VkID0ge307XG4gICAgdmFyIGFyZ3NMZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJnc0xlbjsgaSsrKSB7XG4gICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2ldXG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIG1lcmdlZFtrZXldID0gb2JqW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXJnZWQ7XG4gIH1cbn07XG4vLyBIZWF0bWFwIENvbnN0cnVjdG9yXG52YXIgSGVhdG1hcCA9IChmdW5jdGlvbiBIZWF0bWFwQ2xvc3VyZSgpIHtcblxuICB2YXIgQ29vcmRpbmF0b3IgPSAoZnVuY3Rpb24gQ29vcmRpbmF0b3JDbG9zdXJlKCkge1xuXG4gICAgZnVuY3Rpb24gQ29vcmRpbmF0b3IoKSB7XG4gICAgICB0aGlzLmNTdG9yZSA9IHt9O1xuICAgIH07XG5cbiAgICBDb29yZGluYXRvci5wcm90b3R5cGUgPSB7XG4gICAgICBvbjogZnVuY3Rpb24oZXZ0TmFtZSwgY2FsbGJhY2ssIHNjb3BlKSB7XG4gICAgICAgIHZhciBjU3RvcmUgPSB0aGlzLmNTdG9yZTtcblxuICAgICAgICBpZiAoIWNTdG9yZVtldnROYW1lXSkge1xuICAgICAgICAgIGNTdG9yZVtldnROYW1lXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGNTdG9yZVtldnROYW1lXS5wdXNoKChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChzY29wZSwgZGF0YSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0sXG4gICAgICBlbWl0OiBmdW5jdGlvbihldnROYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBjU3RvcmUgPSB0aGlzLmNTdG9yZTtcbiAgICAgICAgaWYgKGNTdG9yZVtldnROYW1lXSkge1xuICAgICAgICAgIHZhciBsZW4gPSBjU3RvcmVbZXZ0TmFtZV0ubGVuZ3RoO1xuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gY1N0b3JlW2V2dE5hbWVdW2ldO1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDb29yZGluYXRvcjtcbiAgfSkoKTtcblxuXG4gIHZhciBfY29ubmVjdCA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgdmFyIHJlbmRlcmVyID0gc2NvcGUuX3JlbmRlcmVyO1xuICAgIHZhciBjb29yZGluYXRvciA9IHNjb3BlLl9jb29yZGluYXRvcjtcbiAgICB2YXIgc3RvcmUgPSBzY29wZS5fc3RvcmU7XG5cbiAgICBjb29yZGluYXRvci5vbigncmVuZGVycGFydGlhbCcsIHJlbmRlcmVyLnJlbmRlclBhcnRpYWwsIHJlbmRlcmVyKTtcbiAgICBjb29yZGluYXRvci5vbigncmVuZGVyYWxsJywgcmVuZGVyZXIucmVuZGVyQWxsLCByZW5kZXJlcik7XG4gICAgY29vcmRpbmF0b3Iub24oJ2V4dHJlbWFjaGFuZ2UnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzY29wZS5fY29uZmlnLm9uRXh0cmVtYUNoYW5nZSAmJlxuICAgICAgc2NvcGUuX2NvbmZpZy5vbkV4dHJlbWFDaGFuZ2Uoe1xuICAgICAgICBtaW46IGRhdGEubWluLFxuICAgICAgICBtYXg6IGRhdGEubWF4LFxuICAgICAgICBncmFkaWVudDogc2NvcGUuX2NvbmZpZ1snZ3JhZGllbnQnXSB8fCBzY29wZS5fY29uZmlnWydkZWZhdWx0R3JhZGllbnQnXVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3RvcmUuc2V0Q29vcmRpbmF0b3IoY29vcmRpbmF0b3IpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gSGVhdG1hcCgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5fY29uZmlnID0gVXRpbC5tZXJnZShIZWF0bWFwQ29uZmlnLCBhcmd1bWVudHNbMF0gfHwge30pO1xuICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0gbmV3IENvb3JkaW5hdG9yKCk7XG4gICAgaWYgKGNvbmZpZ1sncGx1Z2luJ10pIHtcbiAgICAgIHZhciBwbHVnaW5Ub0xvYWQgPSBjb25maWdbJ3BsdWdpbiddO1xuICAgICAgaWYgKCFIZWF0bWFwQ29uZmlnLnBsdWdpbnNbcGx1Z2luVG9Mb2FkXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBcXCcnKyBwbHVnaW5Ub0xvYWQgKyAnXFwnIG5vdCBmb3VuZC4gTWF5YmUgaXQgd2FzIG5vdCByZWdpc3RlcmVkLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHBsdWdpbiA9IEhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5Ub0xvYWRdO1xuICAgICAgICAvLyBzZXQgcGx1Z2luIHJlbmRlcmVyIGFuZCBzdG9yZVxuICAgICAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBwbHVnaW4ucmVuZGVyZXIoY29uZmlnKTtcbiAgICAgICAgdGhpcy5fc3RvcmUgPSBuZXcgcGx1Z2luLnN0b3JlKGNvbmZpZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IFJlbmRlcmVyKGNvbmZpZyk7XG4gICAgICB0aGlzLl9zdG9yZSA9IG5ldyBTdG9yZShjb25maWcpO1xuICAgIH1cbiAgICBfY29ubmVjdCh0aGlzKTtcbiAgfTtcblxuICAvLyBAVE9ETzpcbiAgLy8gYWRkIEFQSSBkb2N1bWVudGF0aW9uXG4gIEhlYXRtYXAucHJvdG90eXBlID0ge1xuICAgIGFkZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuYWRkRGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5yZW1vdmVEYXRhICYmIHRoaXMuX3N0b3JlLnJlbW92ZURhdGEuYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YU1heDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhTWF4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGFNaW4uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbmZpZ3VyZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9jb25maWcgPSBVdGlsLm1lcmdlKHRoaXMuX2NvbmZpZywgY29uZmlnKTtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLnVwZGF0ZUNvbmZpZyh0aGlzLl9jb25maWcpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fc3RvcmUuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVwYWludDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9zdG9yZS5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBnZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5nZXREYXRhKCk7XG4gICAgfSxcbiAgICBnZXREYXRhVVJMOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci5nZXREYXRhVVJMKCk7XG4gICAgfSxcbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuXG4gICAgICBpZiAodGhpcy5fc3RvcmUuZ2V0VmFsdWVBdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RvcmUuZ2V0VmFsdWVBdChwb2ludCk7XG4gICAgICB9IGVsc2UgIGlmICh0aGlzLl9yZW5kZXJlci5nZXRWYWx1ZUF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci5nZXRWYWx1ZUF0KHBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gSGVhdG1hcDtcblxufSkoKTtcblxuXG4vLyBjb3JlXG52YXIgaGVhdG1hcEZhY3RvcnkgPSB7XG4gIGNyZWF0ZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgcmV0dXJuIG5ldyBIZWF0bWFwKGNvbmZpZyk7XG4gIH0sXG4gIHJlZ2lzdGVyOiBmdW5jdGlvbihwbHVnaW5LZXksIHBsdWdpbikge1xuICAgIEhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5LZXldID0gcGx1Z2luO1xuICB9XG59O1xuXG5yZXR1cm4gaGVhdG1hcEZhY3Rvcnk7XG5cblxufSk7IiwiY29uc3QgVVJMID0gXCJodHRwOi8vbG9jYWxob3N0OjgwODhcIlxyXG5cclxuY29uc3QgQVBJID0ge1xyXG5cclxuICBnZXRTaW5nbGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBnZXRBbGwoZXh0ZW5zaW9uKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSXRlbShleHRlbnNpb24sIGlkKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJERUxFVEVcIlxyXG4gICAgfSlcclxuICAgICAgLnRoZW4oZSA9PiBlLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwb3N0SXRlbShleHRlbnNpb24sIG9iaikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCwge1xyXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwdXRJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQVVRcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQVBJIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgZGF0ZUZpbHRlciA9IHtcclxuXHJcbiAgYnVpbGREYXRlRmlsdGVyKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZnJvbSBoZWF0bWFwcy5qcyBhbmQgaXMgdHJpZ2dlcmVkIGZyb20gdGhlIGhlYXRtYXBzIHBhZ2Ugb2YgdGhlIHNpdGUgd2hlblxyXG4gICAgLy8gdGhlIGRhdGUgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJlbmREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGVuZERhdGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBlbmREYXRlSW5wdXQpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkRhdGUgMjpcXHhhMFwiKTtcclxuICAgIGNvbnN0IGVuZERhdGVJbnB1dEZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGVuZERhdGVMYWJlbCwgZW5kRGF0ZUNvbnRyb2wpO1xyXG5cclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwic3RhcnREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIHN0YXJ0RGF0ZUlucHV0KTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUxhYmVsID0gZWxCdWlsZGVyKFwibGFiZWxcIiwgeyBcImNsYXNzXCI6IFwibGFiZWxcIiB9LCBcIkRhdGUgMTpcXHhhMFwiKTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0RmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgc3RhcnREYXRlTGFiZWwsIHN0YXJ0RGF0ZUNvbnRyb2wpO1xyXG5cclxuICAgIGNvbnN0IGNsZWFyRmlsdGVyQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNsZWFyRGF0ZUZpbHRlclwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2xlYXIgRmlsdGVyXCIpO1xyXG4gICAgY29uc3QgY2xlYXJGaWx0ZXJCdXR0b25Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBjbGVhckZpbHRlckJ0bik7XHJcbiAgICBjb25zdCBkYXRlU2F2ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzZXREYXRlRmlsdGVyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2V0IEZpbHRlclwiKTtcclxuICAgIGNvbnN0IHNhdmVCdXR0b25Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkYXRlU2F2ZUJ0bik7XHJcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsTW9kYWxXaW5kb3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbEJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGNhbmNlbEJ0bik7XHJcbiAgICBjb25zdCBidXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBzYXZlQnV0dG9uQ29udHJvbCwgY2xlYXJGaWx0ZXJCdXR0b25Db250cm9sLCBjYW5jZWxCdXR0b25Db250cm9sKTtcclxuXHJcbiAgICBjb25zdCBtb2RhbENvbnRlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibW9kYWwtY29udGVudCBib3hcIiB9LCBudWxsLCBzdGFydERhdGVJbnB1dEZpZWxkLCBlbmREYXRlSW5wdXRGaWVsZCwgYnV0dG9uRmllbGQpO1xyXG4gICAgY29uc3QgbW9kYWxCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm1vZGFsLWJhY2tncm91bmRcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IG1vZGFsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIm1vZGFsLWRhdGVGaWx0ZXJcIiwgXCJjbGFzc1wiOiBcIm1vZGFsXCIgfSwgbnVsbCwgbW9kYWxCYWNrZ3JvdW5kLCBtb2RhbENvbnRlbnQpO1xyXG5cclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQobW9kYWwpO1xyXG4gICAgdGhpcy5tb2RhbHNFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBtb2RhbHNFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBjbGVhckRhdGVGaWx0ZXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNsZWFyRGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IHNldERhdGVGaWx0ZXJCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNldERhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBjYW5jZWxNb2RhbFdpbmRvd0J0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FuY2VsTW9kYWxXaW5kb3dcIik7XHJcblxyXG4gICAgY2FuY2VsTW9kYWxXaW5kb3dCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuY2FuY2VsTW9kYWxXaW5kb3cpO1xyXG4gICAgc2V0RGF0ZUZpbHRlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5zZXRGaWx0ZXIpO1xyXG4gICAgY2xlYXJEYXRlRmlsdGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLmNsZWFyRGF0ZUZpbHRlcik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG9wZW5EYXRlRmlsdGVyKCkge1xyXG4gICAgY29uc3QgZGF0ZVJhbmdlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXRlUmFuZ2VCdG5cIik7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICAvLyBjaGVjayBpZiBnbG9iYWwgdmFycyBhcmUgc2V0LiBJZiBzbywgZG9uJ3QgdG9nZ2xlIGNvbG9yIG9mIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZVNldCA9IGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXModHJ1ZSk7XHJcblxyXG4gICAgaWYgKGRhdGVTZXQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRhdGVSYW5nZUJ0bi5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBjbGVhckRhdGVGaWx0ZXIoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlc2V0cyBnbG9iYWwgZGF0ZSBmaWx0ZXIgdmFyaWFibGVzIGluIGhlYXRtYXBEYXRhLmpzIGFuZCByZXBsYWNlcyBkYXRlIGlucHV0cyB3aXRoIGJsYW5rIGRhdGUgaW5wdXRzXHJcbiAgICBsZXQgc3RhcnREYXRlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0YXJ0RGF0ZUlucHV0XCIpO1xyXG4gICAgbGV0IGVuZERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5kRGF0ZUlucHV0XCIpO1xyXG4gICAgY29uc3QgZGF0ZUZpbHRlck1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RhbC1kYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2V0RGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2V0RGF0ZUZpbHRlclwiKTtcclxuXHJcbiAgICBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKCk7XHJcbiAgICBkYXRlUmFuZ2VCdG4uY2xhc3NMaXN0LmFkZChcImlzLW91dGxpbmVkXCIpO1xyXG4gICAgc3RhcnREYXRlSW5wdXQucmVwbGFjZVdpdGgoZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwic3RhcnREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKSk7XHJcbiAgICBlbmREYXRlSW5wdXQucmVwbGFjZVdpdGgoZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiZW5kRGF0ZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJkYXRlXCIgfSwgbnVsbCkpO1xyXG4gICAgc2V0RGF0ZUZpbHRlckJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5zZXRGaWx0ZXIpO1xyXG4gICAgc2V0RGF0ZUZpbHRlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5zZXRGaWx0ZXIpO1xyXG5cclxuICAgIGlmIChkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtYWN0aXZlXCIpKSB7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzZXRGaWx0ZXIoKSB7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBzdGFydERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhcnREYXRlSW5wdXRcIik7XHJcbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVuZERhdGVJbnB1dFwiKTtcclxuXHJcbiAgICBzdGFydERhdGVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgZW5kRGF0ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgLy8gY2hlY2sgaWYgZGF0ZSBwaWNrZXJzIGhhdmUgYSB2YWxpZCBkYXRlXHJcbiAgICBpZiAoc3RhcnREYXRlSW5wdXQudmFsdWUgPT09IFwiXCIpIHtcclxuICAgICAgc3RhcnREYXRlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgIH0gZWxzZSBpZiAoZW5kRGF0ZUlucHV0LnZhbHVlID09PSBcIlwiKSB7XHJcbiAgICAgIGVuZERhdGVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gaWYgdGhleSBkbywgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgaW4gaGVhdG1hcHMgcGFnZSBhbmQgY2xvc2UgbW9kYWxcclxuICAgICAgaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyhmYWxzZSwgc3RhcnREYXRlSW5wdXQudmFsdWUsIGVuZERhdGVJbnB1dC52YWx1ZSk7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbE1vZGFsV2luZG93KCkge1xyXG4gICAgY29uc3QgZGF0ZUZpbHRlck1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RhbC1kYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3QgZGF0ZVJhbmdlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXRlUmFuZ2VCdG5cIik7XHJcblxyXG4gICAgLy8gaWYgZ2xvYmFsIHZhcmlhYmxlcyBhcmUgZGVmaW5lZCBhbHJlYWR5LCBjYW5jZWwgc2hvdWxkIG5vdCBjaGFuZ2UgdGhlIGNsYXNzIG9uIHRoZSBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZVNldCA9IGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXModHJ1ZSk7XHJcbiAgICBpZiAoZGF0ZVNldCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGF0ZVJhbmdlQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlkYXRlRmlsdGVyKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgZ2FtZUlkcywgZ2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBleGFtaW5lcyB0aGUgZ2FtZSBvYmplY3QgYXJndW1lbnQgY29tcGFyZWQgdG8gdGhlIHVzZXItZGVmaW5lZCBzdGFydCBhbmQgZW5kIGRhdGVzXHJcbiAgICAvLyBpZiB0aGUgZ2FtZSBkYXRlIGlzIHdpdGhpbiB0aGUgdHdvIGRhdGVzIHNwZWNpZmllZCwgdGhlbiB0aGUgZ2FtZSBJRCBpcyBwdXNoZWQgdG8gdGhlIGdhbWVJZHMgYXJyYXlcclxuXHJcbiAgICAvLyBzcGxpdCB0aW1lc3RhbXAgYW5kIHJlY2FsbCBvbmx5IGRhdGVcclxuICAgIGxldCBnYW1lRGF0ZSA9IGdhbWUudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXTtcclxuXHJcbiAgICBpZiAoc3RhcnREYXRlIDw9IGdhbWVEYXRlICYmIGdhbWVEYXRlIDw9IGVuZERhdGUpIHtcclxuICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5ZGF0ZUZpbHRlclRvU2F2ZWRIZWF0bWFwKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgc2hvdHMsIHNob3RzTWF0Y2hpbmdGaWx0ZXIpIHtcclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCBzaG90RGF0ZSA9IHNob3QudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXTtcclxuXHJcbiAgICAgIGlmIChzdGFydERhdGUgPD0gc2hvdERhdGUgJiYgc2hvdERhdGUgPD0gZW5kRGF0ZSkge1xyXG4gICAgICAgIHNob3RzTWF0Y2hpbmdGaWx0ZXIucHVzaChzaG90KTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkYXRlRmlsdGVyIiwiZnVuY3Rpb24gZWxCdWlsZGVyKG5hbWUsIGF0dHJpYnV0ZXNPYmosIHR4dCwgLi4uY2hpbGRyZW4pIHtcclxuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgZm9yIChsZXQgYXR0ciBpbiBhdHRyaWJ1dGVzT2JqKSB7XHJcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ciwgYXR0cmlidXRlc09ialthdHRyXSk7XHJcbiAgfVxyXG4gIGVsLnRleHRDb250ZW50ID0gdHh0IHx8IG51bGw7XHJcbiAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICBlbC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbiAgfSlcclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGVsQnVpbGRlciIsImltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiO1xyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5cclxuLy8gdGhlIHB1cnBvc2Ugb2YgdGhpcyBtb2R1bGUgaXMgdG86XHJcbi8vIDEuIHNhdmUgYWxsIGNvbnRlbnQgaW4gdGhlIGdhbWVwbGF5IHBhZ2UgKHNob3QgYW5kIGdhbWUgZGF0YSkgdG8gdGhlIGRhdGFiYXNlXHJcbi8vIDIuIGltbWVkaWF0ZWx5IGNsZWFyIHRoZSBnYW1lcGxheSBjb250YWluZXJzIG9mIGNvbnRlbnQgb24gc2F2ZVxyXG4vLyAzLiBpbW1lZGlhdGVseSByZXNldCBhbGwgZ2xvYmFsIHZhcmlhYmxlcyBpbiB0aGUgc2hvdGRhdGEgZmlsZSB0byBhbGxvdyB0aGUgdXNlciB0byBiZWdpbiBzYXZpbmcgc2hvdHMgYW5kIGVudGVyaW5nIGdhbWUgZGF0YSBmb3IgdGhlaXIgbmV4dCBnYW1lXHJcbi8vIDQuIGFmZm9yZGFuY2UgZm9yIHVzZXIgdG8gcmVjYWxsIGFsbCBkYXRhIGZyb20gcHJldmlvdXMgc2F2ZWQgZ2FtZSBmb3IgZWRpdGluZ1xyXG4vLyA1LiBpbmNsdWRlIGFueSBvdGhlciBmdW5jdGlvbnMgbmVlZGVkIHRvIHN1cHBvcnQgdGhlIGZpcnN0IDQgcmVxdWlyZW1lbnRzXHJcblxyXG4vLyB0aGlzIGdsb2JhbCB2YXJpYWJsZSBpcyB1c2VkIHRvIHBhc3Mgc2F2ZWQgc2hvdHMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWwgYm9vbGVhbiB0byBzaG90RGF0YS5qcyBkdXJpbmcgdGhlIGVkaXQgcHJvY2Vzc1xyXG5sZXQgc2F2ZWRHYW1lT2JqZWN0O1xyXG5sZXQgcHV0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG5sZXQgcG9zdFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxubGV0IHBvc3RQcm9taXNlcyA9IFtdO1xyXG5cclxuY29uc3QgZ2FtZURhdGEgPSB7XHJcblxyXG4gIGdhbWVUeXBlQnV0dG9uVG9nZ2xlKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdG9nZ2xlcyB0aGUgXCJpcy1zZWxlY3RlZFwiIGNsYXNzIGJldHdlZW4gdGhlIGdhbWUgdHlwZSBidXR0b25zXHJcblxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGJ0bkNsaWNrZWQgPSBlLnRhcmdldDtcclxuXHJcbiAgICBpZiAoIWJ0bkNsaWNrZWQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgY29uc3QgY3VycmVudEdhbWVUeXBlQnRuID0gZ2FtZVR5cGVCdG5zLmZpbHRlcihidG4gPT4gYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICByZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKSB7XHJcbiAgICBzYXZlZEdhbWVPYmplY3QgPSB1bmRlZmluZWQ7XHJcbiAgICBwdXRQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbiAgICBwb3N0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG4gICAgcG9zdFByb21pc2VzID0gW107XHJcbiAgfSxcclxuXHJcbiAgcHV0RWRpdGVkU2hvdHMocHJldmlvdXNseVNhdmVkU2hvdHNBcnIpIHtcclxuICAgIC8vIFBVVCBmaXJzdCwgc2ljbmUgeW91IGNhbid0IHNhdmUgYSBnYW1lIGluaXRpYWxseSB3aXRob3V0IGF0IGxlYXN0IDEgc2hvdFxyXG4gICAgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgLy8gZXZlbiB0aG91Z2ggaXQncyBhIFBVVCwgd2UgaGF2ZSB0byByZWZvcm1hdCB0aGUgX2ZpZWxkWCBzeW50YXggdG8gZmllbGRYXHJcbiAgICAgIGxldCBzaG90Rm9yUHV0ID0ge307XHJcbiAgICAgIHNob3RGb3JQdXQuZ2FtZUlkID0gc2F2ZWRHYW1lT2JqZWN0LmlkO1xyXG4gICAgICBzaG90Rm9yUHV0LmZpZWxkWCA9IHNob3QuX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclB1dC5maWVsZFkgPSBzaG90Ll9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQdXQuZ29hbFggPSBzaG90Ll9nb2FsWDtcclxuICAgICAgc2hvdEZvclB1dC5nb2FsWSA9IHNob3QuX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUHV0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdC5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclB1dC5hZXJpYWwgPSBzaG90Ll9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQdXQudGltZVN0YW1wID0gc2hvdC5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcHV0UHJvbWlzZXNFZGl0TW9kZS5wdXNoKEFQSS5wdXRJdGVtKGBzaG90cy8ke3Nob3QuaWR9YCwgc2hvdEZvclB1dCkpO1xyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwdXRQcm9taXNlc0VkaXRNb2RlKVxyXG4gIH0sXHJcblxyXG4gIHBvc3ROZXdTaG90c01hZGVEdXJpbmdFZGl0TW9kZShzaG90c05vdFlldFBvc3RlZEFycikge1xyXG4gICAgc2hvdHNOb3RZZXRQb3N0ZWRBcnIuZm9yRWFjaChzaG90T2JqID0+IHtcclxuICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgIHNob3RGb3JQb3N0LmdhbWVJZCA9IHNhdmVkR2FtZU9iamVjdC5pZDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRYID0gc2hvdE9iai5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFkgPSBzaG90T2JqLl9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxYID0gc2hvdE9iai5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxZID0gc2hvdE9iai5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdE9iai5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclBvc3QuYWVyaWFsID0gc2hvdE9iai5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUG9zdC50aW1lU3RhbXAgPSBzaG90T2JqLl90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwb3N0UHJvbWlzZXNFZGl0TW9kZS5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RzXCIsIHNob3RGb3JQb3N0KSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocG9zdFByb21pc2VzRWRpdE1vZGUpXHJcbiAgfSxcclxuXHJcbiAgcG9zdE5ld1Nob3RzKGdhbWVJZCkge1xyXG4gICAgLy8gcG9zdCBzaG90cyB3aXRoIGdhbWVJZFxyXG4gICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yU2F2aW5nKCk7XHJcbiAgICBzaG90QXJyLmZvckVhY2goc2hvdE9iaiA9PiB7XHJcbiAgICAgIGxldCBzaG90Rm9yUG9zdCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBnYW1lSWQ7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclBvc3QudGltZVN0YW1wID0gc2hvdE9iai5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcG9zdFByb21pc2VzLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpKTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocG9zdFByb21pc2VzKVxyXG4gIH0sXHJcblxyXG4gIHNhdmVEYXRhKGdhbWVEYXRhT2JqLCBzYXZpbmdFZGl0ZWRHYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGZpcnN0IGRldGVybWluZXMgaWYgYSBnYW1lIGlzIGJlaW5nIHNhdmVkIGFzIG5ldywgb3IgYSBwcmV2aW91c2x5IHNhdmVkIGdhbWUgaXMgYmVpbmcgZWRpdGVkXHJcbiAgICAvLyBpZiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUsIHRoZSBnYW1lIGlzIFBVVCwgYWxsIHNob3RzIHNhdmVkIHByZXZpb3VzbHkgYXJlIFBVVCwgYW5kIG5ldyBzaG90cyBhcmUgUE9TVEVEXHJcbiAgICAvLyBpZiB0aGUgZ2FtZSBpcyBhIG5ldyBnYW1lIGFsdG9nZXRoZXIsIHRoZW4gdGhlIGdhbWUgaXMgUE9TVEVEIGFuZCBhbGwgc2hvdHMgYXJlIFBPU1RFRFxyXG4gICAgLy8gdGhlbiBmdW5jdGlvbnMgYXJlIGNhbGxlZCB0byByZWxvYWQgdGhlIG1hc3RlciBjb250YWluZXIgYW5kIHJlc2V0IGdsb2JhbCBzaG90IGRhdGEgdmFyaWFibGVzXHJcblxyXG4gICAgaWYgKHNhdmluZ0VkaXRlZEdhbWUpIHtcclxuICAgICAgLy8gdXNlIElEIG9mIGdhbWUgc3RvcmVkIGluIGdsb2JhbCB2YXJcclxuICAgICAgQVBJLnB1dEl0ZW0oYGdhbWVzLyR7c2F2ZWRHYW1lT2JqZWN0LmlkfWAsIGdhbWVEYXRhT2JqKVxyXG4gICAgICAgIC50aGVuKGdhbWVQVVQgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJQVVQgR0FNRVwiLCBnYW1lUFVUKVxyXG4gICAgICAgICAgLy8gcG9zdCBzaG90cyB3aXRoIGdhbWVJZFxyXG4gICAgICAgICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yU2F2aW5nKCk7XHJcbiAgICAgICAgICBjb25zdCBwcmV2aW91c2x5U2F2ZWRTaG90c0FyciA9IFtdO1xyXG4gICAgICAgICAgY29uc3Qgc2hvdHNOb3RZZXRQb3N0ZWRBcnIgPSBbXTtcclxuXHJcbiAgICAgICAgICAvLyBjcmVhdGUgYXJyYXlzIGZvciBQVVQgYW5kIFBPU1QgZnVuY3Rpb25zIChpZiB0aGVyZSdzIGFuIGlkIGluIHRoZSBhcnJheSwgaXQncyBiZWVuIHNhdmVkIHRvIHRoZSBkYXRhYmFzZSBiZWZvcmUpXHJcbiAgICAgICAgICBzaG90QXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChzaG90LmlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBwcmV2aW91c2x5U2F2ZWRTaG90c0Fyci5wdXNoKHNob3QpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHNob3RzTm90WWV0UG9zdGVkQXJyLnB1c2goc2hvdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLy8gY2FsbCBmdW5jdGlvbnMgdG8gUFVUIGFuZCBQT1NUXHJcbiAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0aGF0IGNsZWFyIGdhbWVwbGF5IGNvbnRlbnQgYW5kIHJlc2V0IGdsb2JhbCBzaG90L2dhbWUgZGF0YSB2YXJpYWJsZXNcclxuICAgICAgICAgIGdhbWVEYXRhLnB1dEVkaXRlZFNob3RzKHByZXZpb3VzbHlTYXZlZFNob3RzQXJyKVxyXG4gICAgICAgICAgICAudGhlbih4ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBVVFM6XCIsIHgpXHJcbiAgICAgICAgICAgICAgLy8gaWYgbm8gbmV3IHNob3RzIHdlcmUgbWFkZSwgcmVsb2FkLiBlbHNlIHBvc3QgbmV3IHNob3RzXHJcbiAgICAgICAgICAgICAgaWYgKHNob3RzTm90WWV0UG9zdGVkQXJyLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lRGF0YS5wb3N0TmV3U2hvdHNNYWRlRHVyaW5nRWRpdE1vZGUoc2hvdHNOb3RZZXRQb3N0ZWRBcnIpXHJcbiAgICAgICAgICAgICAgICAgIC50aGVuKHkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUE9TVFM6XCIsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLnBvc3RJdGVtKFwiZ2FtZXNcIiwgZ2FtZURhdGFPYmopXHJcbiAgICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmlkKVxyXG4gICAgICAgIC50aGVuKGdhbWVJZCA9PiB7XHJcbiAgICAgICAgICBnYW1lRGF0YS5wb3N0TmV3U2hvdHMoZ2FtZUlkKVxyXG4gICAgICAgICAgICAudGhlbih6ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNBVkVEIE5FVyBTSE9UU1wiLCB6KTtcclxuICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHBhY2thZ2VHYW1lRGF0YSgpIHtcclxuXHJcbiAgICAvLyBnZXQgdXNlciBJRCBmcm9tIHNlc3Npb24gc3RvcmFnZVxyXG4gICAgLy8gcGFja2FnZSBlYWNoIGlucHV0IGZyb20gZ2FtZSBkYXRhIGNvbnRhaW5lciBpbnRvIHZhcmlhYmxlc1xyXG4gICAgLy8gVE9ETzogY29uZGl0aW9uYWwgc3RhdGVtZW50IHRvIHByZXZlbnQgYmxhbmsgc2NvcmUgZW50cmllc1xyXG4gICAgLy8gVE9ETzogY3JlYXRlIGEgbW9kYWwgYXNraW5nIHVzZXIgaWYgdGhleSB3YW50IHRvIHNhdmUgZ2FtZVxyXG5cclxuICAgIC8vIHBsYXllcklkXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKSk7XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlICgxdjEsIDJ2MiwgM3YzKVxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGdhbWVUeXBlID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGdhbWVUeXBlQnRucy5mb3JFYWNoKGJ0biA9PiB7XHJcbiAgICAgIGlmIChidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgICBnYW1lVHlwZSA9IGJ0bi50ZXh0Q29udGVudFxyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGdhbWUgbW9kZSAobm90ZTogZGlkIG5vdCB1c2UgYm9vbGVhbiBpbiBjYXNlIG1vcmUgZ2FtZSBtb2RlcyBhcmUgc3VwcG9ydGVkIGluIHRoZSBmdXR1cmUpXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbF9nYW1lTW9kZS52YWx1ZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIC8vIG15IHRlYW1cclxuICAgIGNvbnN0IHNlbF90ZWFtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBsZXQgdGVhbWVkVXA7XHJcbiAgICBpZiAoc2VsX3RlYW0udmFsdWUgPT09IFwiTm8gcGFydHlcIikge1xyXG4gICAgICB0ZWFtZWRVcCA9IGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGVhbWVkVXAgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNjb3Jlc1xyXG4gICAgbGV0IG15U2NvcmU7XHJcbiAgICBsZXQgdGhlaXJTY29yZTtcclxuICAgIGNvbnN0IGlucHRfbXlTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF90aGVpclNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aGVpclNjb3JlSW5wdXRcIik7XHJcblxyXG4gICAgbXlTY29yZSA9IE51bWJlcihpbnB0X215U2NvcmUudmFsdWUpO1xyXG4gICAgdGhlaXJTY29yZSA9IE51bWJlcihpbnB0X3RoZWlyU2NvcmUudmFsdWUpO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBsZXQgb3ZlcnRpbWU7XHJcbiAgICBjb25zdCBzZWxfb3ZlcnRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm92ZXJ0aW1lSW5wdXRcIik7XHJcbiAgICBpZiAoc2VsX292ZXJ0aW1lLnZhbHVlID09PSBcIk92ZXJ0aW1lXCIpIHtcclxuICAgICAgb3ZlcnRpbWUgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3ZlcnRpbWUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZ2FtZURhdGFPYmogPSB7XHJcbiAgICAgIFwidXNlcklkXCI6IGFjdGl2ZVVzZXJJZCxcclxuICAgICAgXCJtb2RlXCI6IGdhbWVNb2RlLFxyXG4gICAgICBcInR5cGVcIjogZ2FtZVR5cGUsXHJcbiAgICAgIFwicGFydHlcIjogdGVhbWVkVXAsXHJcbiAgICAgIFwic2NvcmVcIjogbXlTY29yZSxcclxuICAgICAgXCJvcHBfc2NvcmVcIjogdGhlaXJTY29yZSxcclxuICAgICAgXCJvdmVydGltZVwiOiBvdmVydGltZSxcclxuICAgIH07XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IGEgbmV3IGdhbWUgb3IgZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQuIElmIGFuIGVkaXRlZCBnYW1lIGlzIGJlaW5nIHNhdmVkLCB0aGVuIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBzaG90IHNhdmVkIGFscmVhZHksIG1ha2luZyB0aGUgcmV0dXJuIGZyb20gdGhlIHNob3REYXRhIGZ1bmN0aW9uIG1vcmUgdGhhbiAwXHJcbiAgICBjb25zdCBzYXZpbmdFZGl0ZWRHYW1lID0gc2hvdERhdGEuZ2V0SW5pdGlhbE51bU9mU2hvdHMoKVxyXG4gICAgaWYgKHNhdmluZ0VkaXRlZEdhbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBnYW1lRGF0YU9iai50aW1lU3RhbXAgPSBzYXZlZEdhbWVPYmplY3QudGltZVN0YW1wXHJcbiAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCB0cnVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHRpbWUgc3RhbXAgaWYgbmV3IGdhbWVcclxuICAgICAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHRpbWVTdGFtcFxyXG4gICAgICBnYW1lRGF0YS5zYXZlRGF0YShnYW1lRGF0YU9iaiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlUHJldkdhbWVFZGl0cygpIHtcclxuICAgIGdhbWVEYXRhLnBhY2thZ2VHYW1lRGF0YSgpO1xyXG4gIH0sXHJcblxyXG4gIGNhbmNlbEVkaXRpbmdNb2RlKCkge1xyXG4gICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICB9LFxyXG5cclxuICByZW5kZXJFZGl0QnV0dG9ucygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVtb3ZlcyAmIHJlcGxhY2VzIGVkaXQgYW5kIHNhdmUgZ2FtZSBidXR0b25zIHdpdGggXCJTYXZlIEVkaXRzXCIgYW5kIFwiQ2FuY2VsIEVkaXRzXCJcclxuICAgIGNvbnN0IGJ0bl9lZGl0UHJldkdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRQcmV2R2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlR2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUdhbWVcIik7XHJcbiAgICAvLyBpbiBjYXNlIG9mIGxhZyBpbiBmZXRjaCwgcHJldmVudCB1c2VyIGZyb20gZG91YmxlIGNsaWNraW5nIGJ1dHRvblxyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmNsYXNzTGlzdC5hZGQoXCJpcy1sb2FkaW5nXCIpO1xyXG5cclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIEVkaXRzXCIpXHJcbiAgICBjb25zdCBidG5fc2F2ZUVkaXRzID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgRWRpdHNcIilcclxuXHJcbiAgICBidG5fY2FuY2VsRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmNhbmNlbEVkaXRpbmdNb2RlKVxyXG4gICAgYnRuX3NhdmVFZGl0cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuc2F2ZVByZXZHYW1lRWRpdHMpXHJcblxyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5yZXBsYWNlV2l0aChidG5fY2FuY2VsRWRpdHMpO1xyXG4gICAgYnRuX3NhdmVHYW1lLnJlcGxhY2VXaXRoKGJ0bl9zYXZlRWRpdHMpO1xyXG5cclxuICB9LFxyXG5cclxuICByZW5kZXJQcmV2R2FtZShnYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIHNhdmVkIGdhbWUgaW5mb3JtYXRpb24gaW4gdGhlIFwiRW50ZXIgR2FtZSBEYXRhXCIgY29udGFpbmVyLlxyXG4gICAgLy8gaXQgcmVsaWVzIG9uIGEgZnVuY3Rpb24gaW4gc2hvdERhdGEuanMgdG8gcmVuZGVyIHRoZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnNvbGUubG9nKGdhbWUpXHJcblxyXG4gICAgLy8gY2FsbCBmdW5jdGlvbiBpbiBzaG90RGF0YSB0aGF0IGNhbGxzIGdhbWFEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIHdpbGwgY2FwdHVyZSB0aGUgYXJyYXkgb2Ygc2F2ZWQgc2hvdHMgYW5kIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5yZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKClcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUub3ZlcnRpbWUpIHtcclxuICAgICAgc2VsX292ZXJ0aW1lLnZhbHVlID0gXCJPdmVydGltZVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfb3ZlcnRpbWUudmFsdWUgPSBcIk5vIG92ZXJ0aW1lXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBteSB0ZWFtXHJcbiAgICBjb25zdCBzZWxfdGVhbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUucGFydHkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHNlbF90ZWFtLnZhbHVlID0gXCJObyBwYXJ0eVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfdGVhbS52YWx1ZSA9IFwiUGFydHlcIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNjb3JlXHJcbiAgICBjb25zdCBpbnB0X215U2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15U2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfdGhlaXJTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGhlaXJTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIGlucHRfbXlTY29yZS52YWx1ZSA9IGdhbWUuc2NvcmU7XHJcbiAgICBpbnB0X3RoZWlyU2NvcmUudmFsdWUgPSBnYW1lLm9wcF9zY29yZTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcblxyXG4gICAgaWYgKGdhbWUudHlwZSA9PT0gXCIzdjNcIikge1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzN2My5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgLy8gMnYyIGlzIHRoZSBkZWZhdWx0XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIGlmIChnYW1lLnR5cGUgPT09IFwiMnYyXCIpIHtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzF2MS5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5tb2RlID0gXCJjb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIHNlbF9nYW1lTW9kZS52YWx1ZSA9IFwiQ29tcGV0aXRpdmVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDYXN1YWxcIlxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBwcm92aWRlU2hvdHNUb1Nob3REYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBwcm92aWRlcyB0aGUgc2hvdHMgZm9yIHJlbmRlcmluZyB0byBzaG90RGF0YVxyXG4gICAgcmV0dXJuIHNhdmVkR2FtZU9iamVjdFxyXG4gIH0sXHJcblxyXG4gIGVkaXRQcmV2R2FtZSgpIHtcclxuICAgIC8vIGZldGNoIGNvbnRlbnQgZnJvbSBtb3N0IHJlY2VudCBnYW1lIHNhdmVkIHRvIGJlIHJlbmRlcmVkXHJcblxyXG4gICAgLy8gVE9ETzogY3JlYXRlIGEgbW9kYWwgYXNraW5nIHVzZXIgaWYgdGhleSB3YW50IHRvIGVkaXQgcHJldmlvdXMgZ2FtZVxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuXHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGAke2FjdGl2ZVVzZXJJZH0/X2VtYmVkPWdhbWVzYCkudGhlbih1c2VyID0+IHtcclxuICAgICAgaWYgKHVzZXIuZ2FtZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYWxlcnQoXCJObyBnYW1lcyBoYXZlIGJlZW4gc2F2ZWQgYnkgdGhpcyB1c2VyXCIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGdldCBtYXggZ2FtZSBpZCAod2hpY2ggaXMgdGhlIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQpXHJcbiAgICAgICAgY29uc3QgcmVjZW50R2FtZUlkID0gdXNlci5nYW1lcy5yZWR1Y2UoKG1heCwgb2JqKSA9PiBvYmouaWQgPiBtYXggPyBvYmouaWQgOiBtYXgsIHVzZXIuZ2FtZXNbMF0uaWQpO1xyXG4gICAgICAgIC8vIGZldGNoIG1vc3QgcmVjZW50IGdhbWUgYW5kIGVtYmVkIHNob3RzXHJcbiAgICAgICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJnYW1lc1wiLCBgJHtyZWNlbnRHYW1lSWR9P19lbWJlZD1zaG90c2ApLnRoZW4oZ2FtZU9iaiA9PiB7XHJcbiAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgZ2FtZURhdGEucmVuZGVyRWRpdEJ1dHRvbnMoKTtcclxuICAgICAgICAgIHNhdmVkR2FtZU9iamVjdCA9IGdhbWVPYmo7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJQcmV2R2FtZShnYW1lT2JqKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVEYXRhIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgZ2FtZXBsYXkgPSB7XHJcblxyXG4gIGxvYWRHYW1lcGxheSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIC8vIGNvbnN0IHhCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiZGVsZXRlXCIgfSk7XHJcbiAgICAvLyB4QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZUJveCwgZXZlbnQpOyAvLyBidXR0b24gd2lsbCBkaXNwbGF5OiBub25lIG9uIHBhcmVudCBjb250YWluZXJcclxuICAgIC8vIGNvbnN0IGhlYWRlckluZm8gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uIGlzLWluZm9cIiB9LCBcIkNyZWF0ZSBhbmQgc2F2ZSBzaG90cyAtIHRoZW4gc2F2ZSB0aGUgZ2FtZSByZWNvcmQuXCIsIHhCdXR0b24pO1xyXG4gICAgLy8gd2VicGFnZS5hcHBlbmRDaGlsZChoZWFkZXJJbmZvKTtcclxuICAgIHRoaXMuYnVpbGRTaG90Q29udGVudCgpO1xyXG4gICAgdGhpcy5idWlsZEdhbWVDb250ZW50KCk7XHJcbiAgICB0aGlzLmdhbWVwbGF5RXZlbnRNYW5hZ2VyKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRTaG90Q29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYnVpbGRzIHNob3QgY29udGFpbmVycyBhbmQgYWRkcyBjb250YWluZXIgY29udGVudFxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3Qgc2hvdFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgU2hvdCBEYXRhXCIpO1xyXG4gICAgY29uc3Qgc2hvdFRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdFRpdGxlKTtcclxuXHJcbiAgICAvLyBuZXcgc2hvdCBhbmQgc2F2ZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IG5ld1Nob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwibmV3U2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIk5ldyBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2F2ZVNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZVNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIFNob3RcIik7XHJcbiAgICBjb25zdCBjYW5jZWxTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbFNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwic2hvdENvbnRyb2xzXCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGJ1dHRvbnNcIiB9LCBudWxsLCBuZXdTaG90LCBzYXZlU2hvdCwgY2FuY2VsU2hvdCk7XHJcbiAgICBjb25zdCBhbGlnblNob3RCdXR0b25zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBzaG90QnV0dG9ucyk7XHJcbiAgICBjb25zdCBzaG90QnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25TaG90QnV0dG9ucyk7XHJcblxyXG4gICAgLy8gYmFsbCBzcGVlZCBpbnB1dCBhbmQgYWVyaWFsIHNlbGVjdFxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJCYWxsIHNwZWVkIChrcGgpOlwiKVxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJiYWxsU3BlZWRJbnB1dFwiLCBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBpbnB1dFwiLCBcInR5cGVcIjpcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgYmFsbCBzcGVlZFwiIH0pO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTdGFuZGFyZFwiKTtcclxuICAgIGNvbnN0IGFlcmlhbE9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQWVyaWFsXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImFlcmlhbElucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxPcHRpb24xLCBhZXJpYWxPcHRpb24yKTtcclxuICAgIGNvbnN0IGFlcmlhbFNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxTZWxlY3QpO1xyXG4gICAgY29uc3QgYWVyaWFsQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBhZXJpYWxTZWxlY3RQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIGJhbGxTcGVlZElucHV0VGl0bGUsIGJhbGxTcGVlZElucHV0LCBhZXJpYWxDb250cm9sKTtcclxuICAgIGNvbnN0IHNob3REZXRhaWxzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdERldGFpbHMpO1xyXG5cclxuICAgIC8vIGZpZWxkIGFuZCBnb2FsIGltYWdlcyAobm90ZSBmaWVsZC1pbWcgaXMgY2xpcHBlZCB0byByZXN0cmljdCBjbGljayBhcmVhIGNvb3JkaW5hdGVzIGluIGxhdGVyIGZ1bmN0aW9uLlxyXG4gICAgLy8gZ29hbC1pbWcgdXNlcyBhbiB4L3kgZm9ybXVsYSBmb3IgY2xpY2sgYXJlYSBjb29yZGluYXRlcyByZXN0cmljdGlvbiwgc2luY2UgaXQncyBhIHJlY3RhbmdsZSlcclxuICAgIC8vIGFkZGl0aW9uYWxseSwgZmllbGQgYW5kIGdvYWwgYXJlIG5vdCBhbGlnbmVkIHdpdGggbGV2ZWwtbGVmdCBvciBsZXZlbC1yaWdodCAtIGl0J3MgYSBkaXJlY3QgbGV2ZWwgLS0+IGxldmVsLWl0ZW0gZm9yIGNlbnRlcmluZ1xyXG4gICAgY29uc3QgZmllbGRJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZUJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLWJnXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwiXCIgfSwgbnVsbCwgZmllbGRJbWFnZUJhY2tncm91bmQsIGZpZWxkSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZmllbGRJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvUkxfZ29hbF9jcm9wcGVkX25vX2JnX0JXLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdvYWxJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkdvYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdvYWxJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnbkZpZWxkLCBhbGlnbkdvYWwpO1xyXG5cclxuICAgIC8vIHBhcmVudCBjb250YWluZXIgaG9sZGluZyBhbGwgc2hvdCBpbmZvcm1hdGlvblxyXG4gICAgY29uc3QgcGFyZW50U2hvdENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgc2hvdFRpdGxlQ29udGFpbmVyLCBzaG90QnV0dG9uQ29udGFpbmVyLCBzaG90RGV0YWlsc0NvbnRhaW5lciwgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyKVxyXG5cclxuICAgIC8vIGFwcGVuZCBzaG90cyBjb250YWluZXIgdG8gcGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRTaG90Q29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdhbWVDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBjcmVhdGVzIGdhbWUgY29udGVudCBjb250YWluZXJzICh0ZWFtLCBnYW1lIHR5cGUsIGdhbWUgbW9kZSwgZXRjLilcclxuXHJcbiAgICAvLyBjb250YWluZXIgdGl0bGVcclxuICAgIGNvbnN0IGdhbWVUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIHRpdGxlIGlzLTRcIiB9LCBcIkVudGVyIEdhbWUgRGF0YVwiKTtcclxuICAgIGNvbnN0IHRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVRpdGxlKTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIHRvcCBjb250YWluZXJcclxuXHJcbiAgICAvLyAxdjEvMnYyLzN2MyBidXR0b25zIChub3RlOiBjb250cm9sIGNsYXNzIGlzIHVzZWQgd2l0aCBmaWVsZCB0byBhZGhlcmUgYnV0dG9ucyB0b2dldGhlcilcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8zdjNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiM3YzXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjNDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTN2Myk7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMnYyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc2VsZWN0ZWQgaXMtbGlua1wiIH0sIFwiMnYyXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjJDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTJ2Mik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUxdjEpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBoYXMtYWRkb25zXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjNDb250cm9sLCBnYW1lVHlwZTJ2MkNvbnRyb2wsIGdhbWVUeXBlMXYxQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25GaWVsZCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIHNlbGVjdFxyXG4gICAgY29uc3QgbW9kZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ2FzdWFsXCIpO1xyXG4gICAgY29uc3QgbW9kZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImdhbWVNb2RlSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVPcHRpb24xLCBtb2RlT3B0aW9uMik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVTZWxlY3QpO1xyXG4gICAgY29uc3QgbW9kZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgbW9kZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gdGVhbSBzZWxlY3RcclxuICAgIGNvbnN0IHRlYW1PcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIHBhcnR5XCIpO1xyXG4gICAgY29uc3QgdGVhbU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUGFydHlcIik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcInRlYW1JbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbU9wdGlvbjEsIHRlYW1PcHRpb24yKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbVNlbGVjdCk7XHJcbiAgICBjb25zdCB0ZWFtQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCB0ZWFtU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyBvdmVydGltZSBzZWxlY3RcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBvdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcIm92ZXJ0aW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lT3B0aW9uMSwgb3ZlcnRpbWVPcHRpb24yKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0KTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSBib3R0b20gY29udGFpbmVyXHJcblxyXG4gICAgLy8gc2NvcmUgaW5wdXRzXHJcbiAgICAvLyAqKioqTm90ZSBpbmxpbmUgc3R5bGluZyBvZiBpbnB1dCB3aWR0aHNcclxuICAgIGNvbnN0IG15U2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIlNjb3JlOlwiKTtcclxuICAgIGNvbnN0IG15U2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm15U2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJteSB0ZWFtJ3Mgc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IG15U2NvcmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gY29udHJvbFwiIH0sIG51bGwsIG15U2NvcmVJbnB1dCk7XHJcbiAgICBjb25zdCB0aGVpclNjb3JlSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJPcHBvbmVudCdzIHNjb3JlOlwiKVxyXG4gICAgY29uc3QgdGhlaXJTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidGhlaXJTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcInRoZWlyIHRlYW0ncyBzY29yZVwiIH0pO1xyXG4gICAgY29uc3QgdGhlaXJTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgdGhlaXJTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IHNjb3JlSW5wdXRDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIG15U2NvcmVJbnB1dFRpdGxlLCBteVNjb3JlQ29udHJvbCwgdGhlaXJTY29yZUlucHV0VGl0bGUsIHRoZWlyU2NvcmVDb250cm9sKTtcclxuXHJcbiAgICAvLyBlZGl0L3NhdmUgZ2FtZSBidXR0b25zXHJcbiAgICBjb25zdCBlZGl0UHJldmlvdXNHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImVkaXRQcmV2R2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRWRpdCBQcmV2aW91cyBHYW1lXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUdhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEdhbWVcIik7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQWxpZ25tZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnMgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHNhdmVHYW1lLCBlZGl0UHJldmlvdXNHYW1lKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtcmlnaHRcIiB9LCBudWxsLCBnYW1lQnV0dG9uQWxpZ25tZW50KTtcclxuXHJcbiAgICAvLyBhcHBlbmQgdG8gd2VicGFnZVxyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lclRvcCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyLCBtb2RlQ29udHJvbCwgdGVhbUNvbnRyb2wsIG92ZXJ0aW1lQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyQm90dG9tID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2NvcmVJbnB1dENvbnRhaW5lciwgZ2FtZUJ1dHRvbkNvbnRhaW5lcik7XHJcbiAgICBjb25zdCBwYXJlbnRHYW1lQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCB0aXRsZUNvbnRhaW5lciwgZ2FtZUNvbnRhaW5lclRvcCwgZ2FtZUNvbnRhaW5lckJvdHRvbSk7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudEdhbWVDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5RXZlbnRNYW5hZ2VyKCkge1xyXG5cclxuICAgIC8vIGJ1dHRvbnNcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzXHJcbiAgICBidG5fbmV3U2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY3JlYXRlTmV3U2hvdCk7XHJcbiAgICBidG5fc2F2ZVNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnNhdmVTaG90KTtcclxuICAgIGJ0bl9jYW5jZWxTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jYW5jZWxTaG90KTtcclxuICAgIGJ0bl9zYXZlR2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEucGFja2FnZUdhbWVEYXRhKTtcclxuICAgIGdhbWVUeXBlQnRucy5mb3JFYWNoKGJ0biA9PiBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmdhbWVUeXBlQnV0dG9uVG9nZ2xlKSk7XHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5lZGl0UHJldkdhbWUpXHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVwbGF5IiwiaW1wb3J0IGhlYXRtYXAgZnJvbSBcIi4uL2xpYi9ub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUEkuanNcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlci5qc1wiO1xyXG5pbXBvcnQgZGF0ZUZpbHRlciBmcm9tIFwiLi9kYXRlRmlsdGVyLmpzXCI7XHJcbmltcG9ydCBmZWVkYmFjayBmcm9tIFwiLi9oZWF0bWFwRmVlZGJhY2tcIjtcclxuXHJcbi8vIElEIG9mIHNldEludGVydmFsIGZ1bmN0aW9uIHVzZWQgdG8gbW9uaXRvciBjb250YWluZXIgd2lkdGggYW5kIHJlcGFpbnQgaGVhdG1hcCBpZiBjb250YWluZXIgd2lkdGggY2hhbmdlc1xyXG4vLyBsZXQgaW50ZXJ2YWxJZDtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHRvIHN0b3JlIGZldGNoZWQgc2hvdHNcclxubGV0IGdsb2JhbFNob3RzQXJyO1xyXG5sZXQgam9pblRhYmxlQXJyID0gW107XHJcbi8vIGdsb2JhbCB2YXJpYWJsZSB1c2VkIHdpdGggYmFsbCBzcGVlZCBmaWx0ZXIgb24gaGVhdG1hcHNcclxubGV0IGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gZmFsc2U7XHJcbi8vIGdsb2JhbCB2YXJpYWJsZXMgdXNlZCB3aXRoIGRhdGUgcmFuZ2UgZmlsdGVyXHJcbmxldCBzdGFydERhdGU7XHJcbmxldCBlbmREYXRlO1xyXG5cclxuLy8gRklYTUU6IGV4YW1pbmUgY29uZmlybUhlYXRtYXBEZWxldGUgZnVuY3Rpb24uIG1heSBub3QgbmVlZCBmb3IgbG9vcC4gZ3JhYiBJRCBmcm9tIG9wdGlvblxyXG4vLyBUT0RPOiBzZXQgaW50ZXJ2YWwgZm9yIGNvbnRhaW5lciB3aWR0aCBtb25pdG9yaW5nXHJcbi8vIFRPRE86IGlmIGN1c3RvbSBoZWF0bWFwIGlzIHNlbGVjdGVkIGZyb20gZHJvcGRvd24sIHRoZW4gYmx1ciBmaWx0ZXIgY29udGFpbmVyXHJcbi8vIEZJWE1FOiByZW5kZXJpbmcgYSBzYXZlZCBoZWF0bWFwIHdpdGggZGF0ZSBmaWx0ZXIgc29tZXRpbWVzIGJ1Z3Mgb3V0XHJcbi8vIFRPRE86IHNhdmluZyBoZWF0bWFwIG5lZWRzIHRvIGFwcGVuZCBkYXRlIHdpdGggbmFtZSBvZiBoZWF0bWFwIGluIGRyb3Bkb3duIG1lbnVcclxuXHJcbmNvbnN0IGhlYXRtYXBEYXRhID0ge1xyXG5cclxuICBnZXRVc2VyU2hvdHMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlbW92ZXMgYW4gZXhpc3RpbmcgaGVhdG1hcCBpZiBuZWNlc3NhcnkgYW5kIHRoZW4gZGV0ZXJtaW5lcyB3aGV0aGVyXHJcbiAgICAvLyB0byBjYWxsIHRoZSBiYXNpYyBoZWF0bWFwIG9yIHNhdmVkIGhlYXRtYXAgZnVuY3Rpb25zXHJcblxyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuXHJcbiAgICBjb25zdCBoZWF0bWFwTmFtZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuICAgIGNvbnN0IGZpZWxkSGVhdG1hcENhbnZhcyA9IGZpZWxkQ29udGFpbmVyLmNoaWxkTm9kZXNbMl1cclxuICAgIGNvbnN0IGdvYWxIZWF0bWFwQ2FudmFzID0gZ29hbENvbnRhaW5lci5jaGlsZE5vZGVzWzFdXHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBhbHJlYWR5IGEgaGVhdG1hcCBsb2FkZWQsIHJlbW92ZSBpdCBiZWZvcmUgY29udGludWluZ1xyXG4gICAgaWYgKGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGZpZWxkSGVhdG1hcENhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgZ29hbEhlYXRtYXBDYW52YXMucmVtb3ZlKCk7XHJcbiAgICAgIGlmIChoZWF0bWFwTmFtZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgICBoZWF0bWFwRGF0YS5mZXRjaEJhc2ljSGVhdG1hcERhdGEoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBoZWF0bWFwRGF0YS5mZXRjaFNhdmVkSGVhdG1hcERhdGEoKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGhlYXRtYXBOYW1lID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBnb2VzIHRvIHRoZSBkYXRhYmFzZSBhbmQgcmV0cmlldmVzIHNob3RzIHRoYXQgbWVldCBzcGVjaWZpYyBmaWx0ZXJzIChhbGwgc2hvdHMgZmV0Y2hlZCBpZiApXHJcbiAgICBsZXQgZ2FtZUlkc19kYXRlID0gW107XHJcbiAgICBsZXQgZ2FtZUlkc19yZXN1bHQgPSBbXTtcclxuICAgIGxldCBnYW1lSWRzID0gW107IC8vIGFycmF5IHRoYXQgY29udGFpbnMgZ2FtZSBJRCB2YWx1ZXMgcGFzc2luZyBib3RoIHRoZSBkYXRlIGFuZCBnYW1lIHJlc3VsdCBmaWx0ZXJzXHJcbiAgICBjb25zdCBnYW1lUmVzdWx0RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVJlc3VsdFwiKS52YWx1ZTtcclxuICAgIGNvbnN0IGdhbWVVUkxleHRlbnNpb24gPSBoZWF0bWFwRGF0YS5hcHBseUdhbWVGaWx0ZXJzKCk7XHJcblxyXG4gICAgQVBJLmdldEFsbChnYW1lVVJMZXh0ZW5zaW9uKVxyXG4gICAgICAudGhlbihnYW1lcyA9PiB7XHJcbiAgICAgICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgICAgIC8vIHRoZSBkYXRlIGZpbHRlciBhbmQgZ2FtZSByZXN1bHRzIGZpbHRlcnMgY2Fubm90IGJlIGFwcGxpZWQgaW4gdGhlIEpTT04gc2VydmVyIFVSTCwgc28gdGhlIGZpbHRlcnMgYXJlXHJcbiAgICAgICAgICAvLyBjYWxsZWQgaGVyZS4gRWFjaCBmdW5jdGlvbiBwb3B1bGF0ZXMgYW4gYXJyYXkgd2l0aCBnYW1lIElEcyB0aGF0IG1hdGNoIHRoZSBmaWx0ZXIgcmVxdWlyZW1lbnRzLlxyXG4gICAgICAgICAgLy8gYSBmaWx0ZXIgbWV0aG9kIGlzIHRoZW4gdXNlZCB0byBjb2xsZWN0IGFsbCBtYXRjaGluZyBnYW1lIElEcyBmcm9tIHRoZSB0d28gYXJyYXlzIChpLmUuIGEgZ2FtZSB0aGF0IHBhc3NlZFxyXG4gICAgICAgICAgLy8gdGhlIHJlcXVpcmVtZW50cyBvZiBib3RoIGZpbHRlcnMpXHJcbiAgICAgICAgICAvLyBOT1RFOiBpZiBzdGFydCBkYXRlIGlzIG5vdCBkZWZpbmVkLCB0aGUgcmVzdWx0IGZpbHRlciBpcyB0aGUgb25seSBmdW5jdGlvbiBjYWxsZWQsIGFuZCBpdCBpcyBwYXNzZWQgdGhlIHRoaXJkIGFycmF5XHJcbiAgICAgICAgICBpZiAoc3RhcnREYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgZGF0ZUZpbHRlci5hcHBseWRhdGVGaWx0ZXIoc3RhcnREYXRlLCBlbmREYXRlLCBnYW1lSWRzX2RhdGUsIGdhbWUpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5hcHBseUdhbWVSZXN1bHRGaWx0ZXIoZ2FtZVJlc3VsdEZpbHRlciwgZ2FtZUlkc19yZXN1bHQsIGdhbWUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYXBwbHlHYW1lUmVzdWx0RmlsdGVyKGdhbWVSZXN1bHRGaWx0ZXIsIGdhbWVJZHMsIGdhbWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYgKHN0YXJ0RGF0ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBnYW1lSWRzID0gZ2FtZUlkc19kYXRlLmZpbHRlcihpZCA9PiBnYW1lSWRzX3Jlc3VsdC5pbmNsdWRlcyhpZCkpXHJcbiAgICAgICAgICByZXR1cm4gZ2FtZUlkcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGdhbWVJZHM7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKGdhbWVJZHMgPT4ge1xyXG4gICAgICAgIGlmIChnYW1lSWRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgYWxlcnQoXCJTb3JyeSEgRWl0aGVyIG5vIHNob3RzIGhhdmUgYmVlbiBzYXZlZCB5ZXQgb3Igbm8gZ2FtZXMgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy4gVmlzaXQgdGhlIEdhbWVwbGF5IHBhZ2UgdG8gZ2V0IHN0YXJ0ZWQgb3IgdG8gYWRkIG1vcmUgc2hvdHMuXCIpXHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3Qgc2hvdFVSTGV4dGVuc2lvbiA9IGhlYXRtYXBEYXRhLmFwcGx5U2hvdEZpbHRlcnMoZ2FtZUlkcyk7XHJcbiAgICAgICAgICBBUEkuZ2V0QWxsKHNob3RVUkxleHRlbnNpb24pXHJcbiAgICAgICAgICAgIC50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgICAgICBpZiAoc2hvdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIlNvcnJ5ISBObyBzaG90cyBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLiBWaXNpdCB0aGUgR2FtZXBsYXkgcGFnZSB0byBnZXQgc3RhcnRlZCBvciBhZGQgdG8gbW9yZSBzaG90cy5cIilcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBnbG9iYWxTaG90c0FyciA9IHNob3RzO1xyXG4gICAgICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgICAgICBmZWVkYmFjay5sb2FkRmVlZGJhY2soc2hvdHMpO1xyXG4gICAgICAgICAgICAgICAgLy8gaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKGhlYXRtYXBEYXRhLmdldEFjdGl2ZU9mZnNldHMsIDUwMCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiwgYW5kIGl0cyBjb3VudGVycGFydCBmZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMgcmVuZGVyIGFuIGFscmVhZHktc2F2ZWQgaGVhdG1hcCB0aG91Z2ggdGhlc2Ugc3RlcHM6XHJcbiAgICAvLyAxLiBnZXR0aW5nIHRoZSBoZWF0bWFwIG5hbWUgZnJvbSB0aGUgZHJvcGRvd24gdmFsdWVcclxuICAgIC8vIDIuIHVzaW5nIHRoZSBuYW1lIHRvIGZpbmQgdGhlIGNoaWxkTm9kZXMgaW5kZXggb2YgdGhlIGRyb3Bkb3duIHZhbHVlIChpLmUuIHdoaWNoIEhUTUwgPG9wdGlvbj4pIGFuZCBnZXQgaXRzIElEXHJcbiAgICAvLyAzLiBmZXRjaCBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzIHdpdGggbWF0Y2hpbmcgaGVhdG1hcCBJRFxyXG4gICAgLy8gNC4gZmV0Y2ggc2hvdHMgdXNpbmcgc2hvdCBJRHMgZnJvbSBqb2luIHRhYmxlc1xyXG4gICAgLy8gNS4gcmVuZGVyIGhlYXRtYXAgYnkgY2FsbGluZyBidWlsZCBmdW5jdGlvbnNcclxuXHJcbiAgICAvLyBzdGVwIDE6IGdldCBuYW1lIG9mIGhlYXRtYXBcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG4gICAgLy8gc3RlcCAyOiB1c2UgbmFtZSB0byBnZXQgaGVhdG1hcCBJRCBzdG9yZWQgaW4gSFRNTCBvcHRpb24gZWxlbWVudFxyXG4gICAgbGV0IGN1cnJlbnRIZWF0bWFwSWQ7XHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkge1xyXG4gICAgICAgIGN1cnJlbnRIZWF0bWFwSWQgPSBjaGlsZC5pZC5zbGljZSg4KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBzdGVwIDM6IGZldGNoIGpvaW4gdGFibGVzXHJcbiAgICBBUEkuZ2V0QWxsKGBzaG90X2hlYXRtYXA/aGVhdG1hcElkPSR7Y3VycmVudEhlYXRtYXBJZH1gKVxyXG4gICAgICAudGhlbihqb2luVGFibGVzID0+IGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyhqb2luVGFibGVzKVxyXG4gICAgICAgIC8vIHN0ZXAgNTogcGFzcyBzaG90cyB0byBidWlsZEZpZWxkSGVhdG1hcCgpIGFuZCBidWlsZEdvYWxIZWF0bWFwKClcclxuICAgICAgICAudGhlbihzaG90cyA9PiB7XHJcbiAgICAgICAgICAvLyBhcHBseSBkYXRlIGZpbHRlciBpZiBmaWx0ZXIgaGFzIGJlZW4gc2V0XHJcbiAgICAgICAgICBpZiAoc3RhcnREYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgbGV0IHNob3RzTWF0Y2hpbmdGaWx0ZXIgPSBbXTtcclxuICAgICAgICAgICAgZGF0ZUZpbHRlci5hcHBseWRhdGVGaWx0ZXJUb1NhdmVkSGVhdG1hcChzdGFydERhdGUsIGVuZERhdGUsIHNob3RzLCBzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHNNYXRjaGluZ0ZpbHRlcik7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkR29hbEhlYXRtYXAoc2hvdHNNYXRjaGluZ0ZpbHRlcik7XHJcbiAgICAgICAgICAgIGdsb2JhbFNob3RzQXJyID0gc2hvdHNNYXRjaGluZ0ZpbHRlciAvLyBJTVBPUlRBTlQhIHByZXZlbnRzIGVycm9yIGluIGhlYXRtYXAgc2F2ZSB3aGVuIHJlbmRlcmluZyBzYXZlZCBtYXAgYWZ0ZXIgcmVuZGVyaW5nIGJhc2ljIGhlYXRtYXBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgIGdsb2JhbFNob3RzQXJyID0gc2hvdHMgLy8gSU1QT1JUQU5UISBwcmV2ZW50cyBlcnJvciBpbiBoZWF0bWFwIHNhdmUgd2hlbiByZW5kZXJpbmcgc2F2ZWQgbWFwIGFmdGVyIHJlbmRlcmluZyBiYXNpYyBoZWF0bWFwXHJcbiAgICAgICAgICAgIGZlZWRiYWNrLmxvYWRGZWVkYmFjayhzaG90cyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBqb2luVGFibGVBcnIgPSBbXTtcclxuICAgICAgICB9KVxyXG4gICAgICApXHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hTYXZlZFNob3RzVXNpbmdKb2luVGFibGVzKGpvaW5UYWJsZXMpIHtcclxuICAgIC8vIHNlZSBub3RlcyBvbiBmZXRjaFNhdmVkSGVhdG1hcERhdGEoKVxyXG4gICAgam9pblRhYmxlcy5mb3JFYWNoKHRhYmxlID0+IHtcclxuICAgICAgLy8gc3RlcCA0LiB0aGVuIGZldGNoIHVzaW5nIGVhY2ggc2hvdElkIGluIHRoZSBqb2luIHRhYmxlc1xyXG4gICAgICBqb2luVGFibGVBcnIucHVzaChBUEkuZ2V0U2luZ2xlSXRlbShcInNob3RzXCIsIHRhYmxlLnNob3RJZCkpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW5UYWJsZUFycilcclxuICB9LFxyXG5cclxuICBhcHBseUdhbWVGaWx0ZXJzKCkge1xyXG4gICAgLy8gTk9URTogZ2FtZSByZXN1bHQgZmlsdGVyICh2aWN0b3J5L2RlZmVhdCkgY2Fubm90IGJlIGFwcGxpZWQgaW4gdGhpcyBmdW5jdGlvbiBhbmQgaXMgYXBwbGllZCBhZnRlciB0aGUgZmV0Y2hcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICBjb25zdCBnYW1lTW9kZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVNb2RlXCIpLnZhbHVlO1xyXG4gICAgY29uc3QgZ2FtZXR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lVHlwZVwiKS52YWx1ZTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItb3ZlcnRpbWVcIikudmFsdWU7XHJcbiAgICBjb25zdCB0ZWFtU3RhdHVzRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItdGVhbVN0YXR1c1wiKS52YWx1ZTtcclxuXHJcbiAgICBsZXQgVVJMID0gXCJnYW1lc1wiO1xyXG5cclxuICAgIFVSTCArPSBgP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gO1xyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBpZiAoZ2FtZU1vZGVGaWx0ZXIgPT09IFwiQ29tcGV0aXRpdmVcIikge1xyXG4gICAgICBVUkwgKz0gXCImbW9kZT1jb21wZXRpdGl2ZVwiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWVNb2RlRmlsdGVyID09PSBcIkNhc3VhbFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZtb2RlPWNhc3VhbFwiXHJcbiAgICB9XHJcbiAgICAvLyBnYW1lIHR5cGVcclxuICAgIGlmIChnYW1ldHlwZUZpbHRlciA9PT0gXCIzdjNcIikge1xyXG4gICAgICBVUkwgKz0gXCImdHlwZT0zdjNcIlxyXG4gICAgfSBlbHNlIGlmIChnYW1ldHlwZUZpbHRlciA9PT0gXCIydjJcIikge1xyXG4gICAgICBVUkwgKz0gXCImdHlwZT0ydjJcIlxyXG4gICAgfSBlbHNlIGlmIChnYW1ldHlwZUZpbHRlciA9PT0gXCIxdjFcIikge1xyXG4gICAgICBVUkwgKz0gXCImdHlwZT0xdjFcIlxyXG4gICAgfVxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGlmIChvdmVydGltZUZpbHRlciA9PT0gXCJPVFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZvdmVydGltZT10cnVlXCJcclxuICAgIH0gZWxzZSBpZiAob3ZlcnRpbWVGaWx0ZXIgPT09IFwiTm8gT1RcIikge1xyXG4gICAgICBVUkwgKz0gXCImb3ZlcnRpbWU9ZmFsc2VcIlxyXG4gICAgfVxyXG4gICAgLy8gdGVhbSBzdGF0dXNcclxuICAgIGlmICh0ZWFtU3RhdHVzRmlsdGVyID09PSBcIk5vIHBhcnR5XCIpIHtcclxuICAgICAgVVJMICs9IFwiJnBhcnR5PWZhbHNlXCJcclxuICAgIH0gZWxzZSBpZiAodGVhbVN0YXR1c0ZpbHRlciA9PT0gXCJQYXJ0eVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZwYXJ0eT10cnVlXCJcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVVJMO1xyXG4gIH0sXHJcblxyXG4gIGFwcGx5R2FtZVJlc3VsdEZpbHRlcihnYW1lUmVzdWx0RmlsdGVyLCBnYW1lSWRzLCBnYW1lKSB7XHJcbiAgICAvLyBpZiB2aWN0b3J5LCB0aGVuIGNoZWNrIGZvciBnYW1lJ3Mgc2NvcmUgdnMgZ2FtZSdzIG9wcG9uZW50IHNjb3JlXHJcbiAgICAvLyBpZiB0aGUgZmlsdGVyIGlzbid0IHNlbGVjdGVkIGF0IGFsbCwgcHVzaCBhbGwgZ2FtZSBJRHMgdG8gZ2FtZUlkcyBhcnJheVxyXG4gICAgaWYgKGdhbWVSZXN1bHRGaWx0ZXIgPT09IFwiVmljdG9yeVwiKSB7XHJcbiAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoZ2FtZVJlc3VsdEZpbHRlciA9PT0gXCJEZWZlYXRcIikge1xyXG4gICAgICBpZiAoZ2FtZS5zY29yZSA8IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlTaG90RmlsdGVycyhnYW1lSWRzKSB7XHJcbiAgICBjb25zdCBzaG90VHlwZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLXNob3RUeXBlXCIpLnZhbHVlO1xyXG4gICAgbGV0IFVSTCA9IFwic2hvdHNcIlxyXG5cclxuICAgIC8vIGdhbWUgSURcclxuICAgIC8vIGZvciBlYWNoIGdhbWVJZCwgYXBwZW5kIFVSTC4gQXBwZW5kICYgaW5zdGVhZCBvZiA/IG9uY2UgZmlyc3QgZ2FtZUlkIGlzIGFkZGVkIHRvIFVSTFxyXG4gICAgaWYgKGdhbWVJZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBsZXQgZ2FtZUlkQ291bnQgPSAwO1xyXG4gICAgICBnYW1lSWRzLmZvckVhY2goaWQgPT4ge1xyXG4gICAgICAgIGlmIChnYW1lSWRDb3VudCA8IDEpIHtcclxuICAgICAgICAgIFVSTCArPSBgP2dhbWVJZD0ke2lkfWA7XHJcbiAgICAgICAgICBnYW1lSWRDb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBVUkwgKz0gYCZnYW1lSWQ9JHtpZH1gO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0gLy8gZWxzZSBzdGF0ZW1lbnQgaXMgaGFuZGxlZCBpbiBmZXRjaEJhc2ljSGVhdG1hcERhdGEoKVxyXG4gICAgLy8gc2hvdCB0eXBlXHJcbiAgICBpZiAoc2hvdFR5cGVGaWx0ZXIgPT09IFwiQWVyaWFsXCIpIHtcclxuICAgICAgVVJMICs9IFwiJmFlcmlhbD10cnVlXCI7XHJcbiAgICB9IGVsc2UgaWYgKHNob3RUeXBlRmlsdGVyID09PSBcIlN0YW5kYXJkXCIpIHtcclxuICAgICAgVVJMICs9IFwiJmFlcmlhbD1mYWxzZVwiXHJcbiAgICB9XHJcbiAgICByZXR1cm4gVVJMO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkFycmF5IG9mIGZldGNoZWQgc2hvdHNcIiwgc2hvdHMpXHJcblxyXG4gICAgLy8gY3JlYXRlIGZpZWxkIGhlYXRtYXAgd2l0aCBjb25maWd1cmF0aW9uXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGxldCB2YXJXaWR0aCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHZhckhlaWdodCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICBsZXQgZmllbGRDb25maWcgPSBoZWF0bWFwRGF0YS5nZXRGaWVsZENvbmZpZyhmaWVsZENvbnRhaW5lcik7XHJcblxyXG4gICAgbGV0IEZpZWxkSGVhdG1hcEluc3RhbmNlO1xyXG4gICAgRmllbGRIZWF0bWFwSW5zdGFuY2UgPSBoZWF0bWFwLmNyZWF0ZShmaWVsZENvbmZpZyk7XHJcblxyXG4gICAgbGV0IGZpZWxkRGF0YVBvaW50cyA9IFtdO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCB4XyA9IE51bWJlcigoc2hvdC5maWVsZFggKiB2YXJXaWR0aCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB5XyA9IE51bWJlcigoc2hvdC5maWVsZFkgKiB2YXJIZWlnaHQpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgdmFsdWVfID0gMTtcclxuICAgICAgLy8gc2V0IHZhbHVlIGFzIGJhbGwgc3BlZWQgaWYgc3BlZWQgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICAgIHZhbHVlXyA9IHNob3QuYmFsbF9zcGVlZDtcclxuICAgICAgfVxyXG4gICAgICBsZXQgZmllbGRPYmogPSB7IHg6IHhfLCB5OiB5XywgdmFsdWU6IHZhbHVlXyB9O1xyXG4gICAgICBmaWVsZERhdGFQb2ludHMucHVzaChmaWVsZE9iaik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBmaWVsZERhdGEgPSB7XHJcbiAgICAgIG1heDogMSxcclxuICAgICAgbWluOiAwLFxyXG4gICAgICBkYXRhOiBmaWVsZERhdGFQb2ludHNcclxuICAgIH07XHJcblxyXG4gICAgLy8gc2V0IG1heCB2YWx1ZSBhcyBtYXggYmFsbCBzcGVlZCBpbiBzaG90cywgaWYgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgbGV0IG1heEJhbGxTcGVlZCA9IHNob3RzLnJlZHVjZSgobWF4LCBzaG90KSA9PiBzaG90LmJhbGxfc3BlZWQgPiBtYXggPyBzaG90LmJhbGxfc3BlZWQgOiBtYXgsIHNob3RzWzBdLmJhbGxfc3BlZWQpO1xyXG4gICAgICBmaWVsZERhdGEubWF4ID0gbWF4QmFsbFNwZWVkO1xyXG4gICAgfVxyXG5cclxuICAgIEZpZWxkSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZmllbGREYXRhKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdvYWxIZWF0bWFwKHNob3RzKSB7XHJcbiAgICAvLyBjcmVhdGUgZ29hbCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZ29hbENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgbGV0IHZhckdvYWxXaWR0aCA9IGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgdmFyR29hbEhlaWdodCA9IGdvYWxDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIGxldCBnb2FsQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKTtcclxuXHJcbiAgICBsZXQgR29hbEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIEdvYWxIZWF0bWFwSW5zdGFuY2UgPSBoZWF0bWFwLmNyZWF0ZShnb2FsQ29uZmlnKTtcclxuXHJcbiAgICBsZXQgZ29hbERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZ29hbFggKiB2YXJHb2FsV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZ29hbFkgKiB2YXJHb2FsSGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIC8vIHNldCB2YWx1ZSBhcyBiYWxsIHNwZWVkIGlmIHNwZWVkIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgICB2YWx1ZV8gPSBzaG90LmJhbGxfc3BlZWQ7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IGdvYWxPYmogPSB7IHg6IHhfLCB5OiB5XywgdmFsdWU6IHZhbHVlXyB9O1xyXG4gICAgICBnb2FsRGF0YVBvaW50cy5wdXNoKGdvYWxPYmopO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZ29hbERhdGEgPSB7XHJcbiAgICAgIG1heDogMSxcclxuICAgICAgbWluOiAwLFxyXG4gICAgICBkYXRhOiBnb2FsRGF0YVBvaW50c1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCBtYXggdmFsdWUgYXMgbWF4IGJhbGwgc3BlZWQgaW4gc2hvdHMsIGlmIGZpbHRlciBpcyBzZWxlY3RlZFxyXG4gICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgIGxldCBtYXhCYWxsU3BlZWQgPSBzaG90cy5yZWR1Y2UoKG1heCwgc2hvdCkgPT4gc2hvdC5iYWxsX3NwZWVkID4gbWF4ID8gc2hvdC5iYWxsX3NwZWVkIDogbWF4LCBzaG90c1swXS5iYWxsX3NwZWVkKTtcclxuICAgICAgZ29hbERhdGEubWF4ID0gbWF4QmFsbFNwZWVkO1xyXG4gICAgfVxyXG5cclxuICAgIEdvYWxIZWF0bWFwSW5zdGFuY2Uuc2V0RGF0YShnb2FsRGF0YSk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0RmllbGRDb25maWcoZmllbGRDb250YWluZXIpIHtcclxuICAgIC8vIElkZWFsIHJhZGl1cyBpcyBhYm91dCAyNXB4IGF0IDU1MHB4IHdpZHRoLCBvciA0LjU0NSVcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvbnRhaW5lcjogZmllbGRDb250YWluZXIsXHJcbiAgICAgIHJhZGl1czogMC4wNDU0NTQ1NDUgKiBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aCxcclxuICAgICAgbWF4T3BhY2l0eTogLjYsXHJcbiAgICAgIG1pbk9wYWNpdHk6IDAsXHJcbiAgICAgIGJsdXI6IC44NVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBnZXRHb2FsQ29uZmlnKGdvYWxDb250YWluZXIpIHtcclxuICAgIC8vIElkZWFsIHJhZGl1cyBpcyBhYm91dCAzNXB4IGF0IDU1MHB4IHdpZHRoLCBvciA2LjM2MyVcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvbnRhaW5lcjogZ29hbENvbnRhaW5lcixcclxuICAgICAgcmFkaXVzOiAuMDYzNjM2MzYzICogZ29hbENvbnRhaW5lci5vZmZzZXRXaWR0aCxcclxuICAgICAgbWF4T3BhY2l0eTogLjYsXHJcbiAgICAgIG1pbk9wYWNpdHk6IDAsXHJcbiAgICAgIGJsdXI6IC44NVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBiYWxsU3BlZWRNYXgoKSB7XHJcbiAgICAvLyB0aGlzIGJ1dHRvbiBmdW5jdGlvbiBjYWxsYmFjayAoaXQncyBhIGZpbHRlcikgY2hhbmdlcyBhIGJvb2xlYW4gZ2xvYmFsIHZhcmlhYmxlIHRoYXQgZGV0ZXJtaW5lcyB0aGUgbWluIGFuZCBtYXggdmFsdWVzXHJcbiAgICAvLyB1c2VkIHdoZW4gcmVuZGVyaW5nIHRoZSBoZWF0bWFwcyAoc2VlIGJ1aWxkRmllbGRIZWF0bWFwKCkgYW5kIGJ1aWxkR29hbEhlYXRtYXAoKSlcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkQnRuXCIpO1xyXG5cclxuICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICBjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCA9IGZhbHNlO1xyXG4gICAgICBiYWxsU3BlZWRCdG4uY2xhc3NMaXN0LnRvZ2dsZShcImlzLW91dGxpbmVkXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSB0cnVlO1xyXG4gICAgICBiYWxsU3BlZWRCdG4uY2xhc3NMaXN0LnRvZ2dsZShcImlzLW91dGxpbmVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3MgYSBoZWF0bWFwIGxvYWRlZCBhbHJlYWR5LCBjb252ZXJ0IHRoZSBjb25maWcgaW1tZWRpYXRlbHkgdG8gdXNlIHRoZSBtYXggYmFsbCBzcGVlZFxyXG4gICAgLy8gdGhlIElGIHN0YXRlbWVudCBpcyBuZWVkZWQgc28gdGhlIHVzZXIgY2FuJ3QgaW1tZWRpYXRlbHkgcmVuZGVyIGEgaGVhdG1hcCBqdXN0IGJ5IGNsaWNraW5nXHJcbiAgICAvLyB0aGUgc3BlZWQgZmlsdGVyXHJcbiAgICAvLyBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuXHJcbiAgICAvLyBjb25zdCBmaWVsZEhlYXRtYXBDYW52YXMgPSBmaWVsZENvbnRhaW5lci5jaGlsZE5vZGVzWzJdXHJcbiAgICAvLyBpZiAoZmllbGRIZWF0bWFwQ2FudmFzICE9PSB1bmRlZmluZWQpIHtcclxuICAgIC8vICAgaGVhdG1hcERhdGEuZ2V0VXNlclNob3RzKCk7XHJcbiAgICAvLyB9XHJcbiAgfSxcclxuXHJcbiAgLypnZXRBY3RpdmVPZmZzZXRzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlIHdpZHRoIG9mIHRoZSBoZWF0bWFwIGNvbnRhaW5lciBhdCAwLjUgc2Vjb25kIGludGVydmFscy4gSWYgdGhlIHdpZHRoIGhhcyBjaGFuZ2VkLFxyXG4gICAgLy8gdGhlbiB0aGUgaGVhdG1hcCBjYW52YXMgaXMgcmVwYWludGVkIHRvIGZpdCB3aXRoaW4gdGhlIGNvbnRhaW5lciBsaW1pdHNcclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpXHJcbiAgICBsZXQgY2FwdHVyZVdpZHRoID0gZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGhcclxuICAgIC8vZXZhbHVhdGUgY29udGFpbmVyIHdpZHRoIGFmdGVyIDAuNSBzZWNvbmRzIHZzIGluaXRpYWwgY29udGFpbmVyIHdpZHRoXHJcbiAgICBpZiAoY2FwdHVyZVdpZHRoID09PSB2YXJXaWR0aCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcInVuY2hhbmdlZFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcldpZHRoID0gY2FwdHVyZVdpZHRoXHJcbiAgICAgIGNvbnNvbGUubG9nKFwibmV3IHdpZHRoXCIsIHZhcldpZHRoKTtcclxuICAgICAgLy9jbGVhciBoZWF0bWFwXHJcbiAgICAgIGZpZWxkQ29udGFpbmVyLnJlbW92ZUNoaWxkKGZpZWxkQ29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xyXG4gICAgICAvL2J1aWxkIGhlYXRtYXAgYWdhaW5cclxuICAgICAgaGVhdG1hcERhdGEuYnVpbGRIZWF0bWFwKCk7XHJcbiAgICB9XHJcbiAgfSwqL1xyXG5cclxuICBzYXZlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHNhdmluZyBhIGhlYXRtYXAgb2JqZWN0IHdpdGggYSBuYW1lLCB1c2VySWQsIGFuZCBkYXRlIC0gdGhlbiBtYWtpbmcgam9pbiB0YWJsZXMgd2l0aCBoZWF0bWFwSWQgYW5kIGVhY2ggc2hvdElkXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGNvbnN0IHNhdmVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIikpO1xyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwQnRuXCIpO1xyXG4gICAgbGV0IGhlYXRtYXBOYW1lSXNVbmlxdWUgPSB0cnVlO1xyXG5cclxuICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gdHJ1ZTsgLy8gaW1tZWRpYXRlbHkgZGlzYWJsZSBzYXZlIGJ1dHRvbiB0byBwcmV2ZW50IG11bHRpcGxlIGNsaWNrc1xyXG4gICAgY29uc3QgaGVhdG1hcFRpdGxlID0gc2F2ZUlucHV0LnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXTtcclxuXHJcbiAgICAvLyAxLiBoZWF0bWFwIG11c3QgaGF2ZSB0aXRsZSAmIHRoZSB0aXRsZSBjYW5ub3QgYmUgXCJTYXZlIHN1Y2Nlc3NmdWwhXCIgb3IgXCJCYXNpYyBIZWF0bWFwXCIgb3IgXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCIgb3IgXCJObyB0aXRsZSBwcm92aWRlZFwiIG9yIFwiSGVhdG1hcCBuYW1lIG5vdCB1bmlxdWVcIlxyXG4gICAgLy8gMi4gdGhlcmUgbXVzdCBiZSBhIGhlYXRtYXAgY2FudmFzIGxvYWRlZCBvbiB0aGUgcGFnZVxyXG4gICAgLy8gMy4gKHNlZSBzZWNvbmQgaWYgc3RhdGVtZW50KSB0aGUgc2F2ZSBidXR0b24gd2lsbCByZXNwb25kIHdvcmsgaWYgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHNhdmUgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwXHJcbiAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA+IDAgJiYgaGVhdG1hcFRpdGxlICE9PSBcIlNhdmUgc3VjY2Vzc2Z1bFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJCYXNpYyBIZWF0bWFwXCIgJiYgaGVhdG1hcFRpdGxlICE9PSBcIkNhbm5vdCBzYXZlIHByaW9yIGhlYXRtYXBcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiQ2Fubm90IHNhdmUgcHJpb3IgaGVhdG1hcFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJIZWF0bWFwIG5hbWUgbm90IHVuaXF1ZVwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyB0aXRsZSBwcm92aWRlZFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyBoZWF0bWFwIGxvYWRlZFwiICYmIGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChoZWF0bWFwRHJvcGRvd24udmFsdWUgIT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCJcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGNoZWNrIGZvciB1bmlxdWUgaGVhdG1hcCBuYW1lIC0gaWYgaXQncyB1bmlxdWUgdGhlbiBzYXZlIHRoZSBoZWF0bWFwIGFuZCBqb2luIHRhYmxlc1xyXG4gICAgICAgIEFQSS5nZXRBbGwoYGhlYXRtYXBzP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gICAgICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhoZWF0bWFwcylcclxuICAgICAgICAgICAgaGVhdG1hcHMuZm9yRWFjaChoZWF0bWFwID0+IHtcclxuICAgICAgICAgICAgICBpZiAoaGVhdG1hcC5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGhlYXRtYXBUaXRsZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwTmFtZUlzVW5pcXVlID0gZmFsc2UgLy8gaWYgYW55IG5hbWVzIG1hdGNoLCB2YXJpYWJsZSBiZWNvbWVzIGZhbHNlXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvLyBpZiBuYW1lIGlzIHVuaXF1ZSAtIGFsbCBjb25kaXRpb25zIG1ldCAtIHNhdmUgaGVhdG1hcFxyXG4gICAgICAgICAgICBpZiAoaGVhdG1hcE5hbWVJc1VuaXF1ZSkge1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtc3VjY2Vzc1wiKTtcclxuICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5zYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUsIGFjdGl2ZVVzZXJJZClcclxuICAgICAgICAgICAgICAgIC50aGVuKGhlYXRtYXBPYmogPT4gaGVhdG1hcERhdGEuc2F2ZUpvaW5UYWJsZXMoaGVhdG1hcE9iaikudGhlbih4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqb2luIHRhYmxlcyBzYXZlZFwiLCB4KVxyXG4gICAgICAgICAgICAgICAgICAvLyBlbXB0eSB0aGUgdGVtcG9yYXJ5IGdsb2JhbCBhcnJheSB1c2VkIHdpdGggUHJvbWlzZS5hbGxcclxuICAgICAgICAgICAgICAgICAgam9pblRhYmxlQXJyID0gW107XHJcbiAgICAgICAgICAgICAgICAgIC8vIGFwcGVuZCBuZXdseSBjcmVhdGVkIGhlYXRtYXAgYXMgb3B0aW9uIGVsZW1lbnQgaW4gc2VsZWN0IGRyb3Bkb3duXHJcbiAgICAgICAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwgeyBcImlkXCI6IGBoZWF0bWFwLSR7aGVhdG1hcE9iai5pZH1gIH0sIGAke2hlYXRtYXBPYmoudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXX06ICR7aGVhdG1hcE9iai5uYW1lfWApKTtcclxuICAgICAgICAgICAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJTYXZlIHN1Y2Nlc3NmdWxcIjtcclxuICAgICAgICAgICAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgICAgICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIkhlYXRtYXAgbmFtZSBub3QgdW5pcXVlXCI7XHJcbiAgICAgICAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHNhdmVJbnB1dC52YWx1ZSA9IFwiTm8gdGl0bGUgcHJvdmlkZWRcIjtcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2UgaWYgKGZpZWxkSGVhdG1hcENhbnZhcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJObyBoZWF0bWFwIGxvYWRlZFwiO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNhdmVIZWF0bWFwT2JqZWN0KGhlYXRtYXBUaXRsZSwgYWN0aXZlVXNlcklkKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHNhdmVzIGEgaGVhdG1hcCBvYmplY3Qgd2l0aCB0aGUgdXNlci1wcm92aWRlZCBuYW1lLCB0aGUgdXNlcklkLCBhbmQgdGhlIGN1cnJlbnQgZGF0ZS90aW1lXHJcbiAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuICAgIGNvbnN0IGhlYXRtYXBPYmogPSB7XHJcbiAgICAgIG5hbWU6IGhlYXRtYXBUaXRsZSxcclxuICAgICAgdXNlcklkOiBhY3RpdmVVc2VySWQsXHJcbiAgICAgIHRpbWVTdGFtcDogdGltZVN0YW1wXHJcbiAgICB9XHJcbiAgICByZXR1cm4gQVBJLnBvc3RJdGVtKFwiaGVhdG1hcHNcIiwgaGVhdG1hcE9iailcclxuICB9LFxyXG5cclxuICBzYXZlSm9pblRhYmxlcyhoZWF0bWFwT2JqKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImdsb2JhbHNob3RzYXJyYXlcIiwgZ2xvYmFsU2hvdHNBcnIpXHJcbiAgICBnbG9iYWxTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgam9pblRhYmxlT2JqID0ge1xyXG4gICAgICAgIHNob3RJZDogc2hvdC5pZCxcclxuICAgICAgICBoZWF0bWFwSWQ6IGhlYXRtYXBPYmouaWRcclxuICAgICAgfVxyXG4gICAgICBqb2luVGFibGVBcnIucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90X2hlYXRtYXBcIiwgam9pblRhYmxlT2JqKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2luVGFibGVBcnIpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdGhlIGxvZ2ljIHRoYXQgcHJldmVudHMgdGhlIHVzZXIgZnJvbSBkZWxldGluZyBhIGhlYXRtYXAgaW4gb25lIGNsaWNrLlxyXG4gICAgLy8gYSBzZWNvbmQgZGVsZXRlIGJ1dHRvbiBhbmQgYSBjYW5jZWwgYnV0dG9uIGFyZSByZW5kZXJlZCBiZWZvcmUgYSBkZWxldGUgaXMgY29uZmlybWVkXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBpZiAoY3VycmVudERyb3Bkb3duVmFsdWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlSGVhdG1hcEJ0blwiKTtcclxuICAgICAgY29uc3QgY29uZmlybURlbGV0ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDb25maXJtIERlbGV0ZVwiKTtcclxuICAgICAgY29uc3QgcmVqZWN0RGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJDYW5jZWxcIik7XHJcbiAgICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZGVsZXRlQ29udHJvbFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGNvbmZpcm1EZWxldGVCdG4sIHJlamVjdERlbGV0ZUJ0bik7XHJcbiAgICAgIGRlbGV0ZUhlYXRtYXBCdG4ucmVwbGFjZVdpdGgoRGVsZXRlQ29udHJvbCk7XHJcbiAgICAgIGNvbmZpcm1EZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmNvbmZpcm1IZWF0bWFwRGVsZXRpb24pO1xyXG4gICAgICByZWplY3REZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLnJlamVjdEhlYXRtYXBEZWxldGlvbik7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlamVjdEhlYXRtYXBEZWxldGlvbigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmUtcmVuZGVycyB0aGUgcHJpbWFyeSBkZWxldGUgYnV0dG9uXHJcbiAgICBjb25zdCBEZWxldGVDb250cm9sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVDb250cm9sXCIpO1xyXG4gICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJkZWxldGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJEZWxldGUgSGVhdG1hcFwiKVxyXG4gICAgRGVsZXRlQ29udHJvbC5yZXBsYWNlV2l0aChkZWxldGVIZWF0bWFwQnRuKVxyXG4gICAgZGVsZXRlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcCk7XHJcbiAgfSxcclxuXHJcbiAgY29uZmlybUhlYXRtYXBEZWxldGlvbigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gd2lsbCBkZWxldGUgdGhlIHNlbGVjdGVkIGhlYXRtYXAgb3B0aW9uIGluIHRoZSBkcm9wZG93biBsaXN0IGFuZCByZW1vdmUgYWxsIHNob3RfaGVhdG1hcCBqb2luIHRhYmxlc1xyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBsZXQgY3VycmVudERyb3Bkb3duVmFsdWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcblxyXG4gICAgaGVhdG1hcERyb3Bkb3duLmNoaWxkTm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICAgIGlmIChjaGlsZC50ZXh0Q29udGVudCA9PT0gY3VycmVudERyb3Bkb3duVmFsdWUpIHsgLy9UT0RPOiBjaGVjayB0aGlzIGxvZ2ljLiBtYXkgYmUgYWJsZSB0byB1c2UgSUQgaW5zdGVhZCBvZiByZXF1aXJpbmcgdW5pcXVlIG5hbWVcclxuICAgICAgICBjaGlsZC5yZW1vdmUoKTtcclxuICAgICAgICBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwT2JqZWN0YW5kSm9pblRhYmxlcyhjaGlsZC5pZClcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaGVhdG1hcERyb3Bkb3duLnZhbHVlID0gXCJCYXNpYyBIZWF0bWFwXCI7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLnJlamVjdEhlYXRtYXBEZWxldGlvbigpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUhlYXRtYXBPYmplY3RhbmRKb2luVGFibGVzKGhlYXRtYXBJZCkge1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHJldHVybiBBUEkuZGVsZXRlSXRlbShcImhlYXRtYXBzXCIsIGAke2hlYXRtYXBJZC5zbGljZSg4KX0/dXNlcklkPSR7YWN0aXZlVXNlcklkfWApXHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlQmFsbFNwZWVkR2xvYmFsVmFyaWFibGVzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB1c2VkIGJ5IHRoZSByZXNldCBmaWx0ZXJzIGJ1dHRvbiBhbmQgbmF2YmFyIGhlYXRtYXBzIHRhYiB0byBmb3JjZSB0aGUgYmFsbCBzcGVlZCBmaWx0ZXIgb2ZmXHJcbiAgICBjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCA9IGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMocmV0dXJuQm9vbGVhbiwgc3RhcnREYXRlSW5wdXQsIGVuZERhdGVJbnB1dCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIFNFVCB0aGUgZGF0ZSBmaWx0ZXIgZ2xvYmFsIHZhcmlhYmxlcyBvbiB0aGlzIHBhZ2Ugb3IgQ0xFQVIgdGhlbVxyXG4gICAgLy8gaWYgdGhlIDEuIHBhZ2UgaXMgcmVsb2FkZWQgb3IgMi4gdGhlIFwicmVzZXQgZmlsdGVyc1wiIGJ1dHRvbiBpcyBjbGlja2VkXHJcblxyXG4gICAgLy8gdGhlIGRhdGVGaWx0ZXIuanMgY2FuY2VsIGJ1dHRvbiByZXF1ZXN0cyBhIGdsb2JhbCB2YXIgdG8gZGV0ZXJtaW5lIGhvdyB0byBoYW5kbGUgYnV0dG9uIGNvbG9yXHJcbiAgICBpZiAocmV0dXJuQm9vbGVhbikge1xyXG4gICAgICByZXR1cm4gc3RhcnREYXRlXHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgbm8gaW5wdXQgdmFsdWVzIGFyZSBwcm92aWRlZCwgdGhhdCBtZWFucyB0aGUgdmFyaWFibGVzIG5lZWQgdG8gYmUgcmVzZXQgYW5kIHRoZSBkYXRlXHJcbiAgICAvLyBmaWx0ZXIgYnV0dG9uIHNob3VsZCBiZSBvdXRsaW5lZCAtIGVsc2Ugc2V0IGdsb2JhbCB2YXJzIGZvciBmaWx0ZXJcclxuICAgIGlmIChzdGFydERhdGVJbnB1dCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHN0YXJ0RGF0ZSA9IHVuZGVmaW5lZDtcclxuICAgICAgZW5kRGF0ZSA9IHVuZGVmaW5lZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHN0YXJ0RGF0ZSA9IHN0YXJ0RGF0ZUlucHV0O1xyXG4gICAgICBlbmREYXRlID0gZW5kRGF0ZUlucHV0O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGVhdG1hcERhdGEiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcblxyXG5jb25zdCBmZWVkYmFjayA9IHtcclxuXHJcbiAgbG9hZEZlZWRiYWNrKHNob3RzKSB7XHJcblxyXG4gICAgLy8gZmlyc3QsIHVzZSB0aGUgc2hvdHMgd2UgaGF2ZSB0byBmZXRjaCB0aGUgZ2FtZXMgdGhleSdyZSBhc3NvY2lhdGVkIHdpdGhcclxuICAgIGxldCBnYW1lSWRzID0gW107XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgZ2FtZUlkcy5wdXNoKHNob3QuZ2FtZUlkKTtcclxuICAgIH0pXHJcblxyXG4gICAgLy8gcmVtb3ZlIGR1cGxpY2F0ZSBnYW1lIElEc1xyXG4gICAgZ2FtZUlkcyA9IGdhbWVJZHMuZmlsdGVyKChpdGVtLCBpZHgpID0+IHtcclxuICAgICAgcmV0dXJuIGdhbWVJZHMuaW5kZXhPZihpdGVtKSA9PSBpZHg7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmZldGNoR2FtZXMoZ2FtZUlkcylcclxuICAgICAgLnRoZW4oZ2FtZXMgPT4gdGhpcy5jYWxjdWxhdGVGZWVkYmFjayhzaG90cywgZ2FtZXMpKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hHYW1lcyhnYW1lSWRzKSB7XHJcbiAgICBsZXQgZ2FtZXMgPSBbXTtcclxuICAgIGdhbWVJZHMuZm9yRWFjaChnYW1lSWQgPT4ge1xyXG4gICAgICBnYW1lcy5wdXNoKEFQSS5nZXRTaW5nbGVJdGVtKFwiZ2FtZXNcIiwgZ2FtZUlkKSlcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGdhbWVzKVxyXG4gIH0sXHJcblxyXG4gIGNhbGN1bGF0ZUZlZWRiYWNrKHNob3RzLCBnYW1lcykge1xyXG4gICAgY29uc29sZS5sb2coXCJzaG90c1wiLCBzaG90cylcclxuICAgIGNvbnNvbGUubG9nKFwiZ2FtZXNcIiwgZ2FtZXMpXHJcblxyXG4gICAgbGV0IGZlZWRiYWNrUmVzdWx0cyA9IHt9O1xyXG5cclxuICAgIC8vIGdldCBoZWF0bWFwIGRhdGUgZ2VuZXJhdGVkXHJcbiAgICBsZXQgbm93ID0gbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLm5vdyA9IG5vdztcclxuICAgIGNvbnNvbGUubG9nKGZlZWRiYWNrUmVzdWx0cy5ub3cpXHJcblxyXG4gICAgLy8gZ2V0IHJhbmdlIG9mIGRhdGVzIG9uIGdhbWVzIChtYXggYW5kIG1pbilcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5sYXN0R2FtZSA9IGdhbWVzLnJlZHVjZSgobWF4LCBnYW1lKSA9PiBnYW1lLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF0gPiBtYXggPyBnYW1lLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF0gOiBtYXgsIGdhbWVzWzBdLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF0pO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmZpcnN0R2FtZSA9IGdhbWVzLnJlZHVjZSgobWluLCBnYW1lKSA9PiBnYW1lLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF0gPCBtaW4gPyBnYW1lLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF0gOiBtaW4sIGdhbWVzWzBdLnRpbWVTdGFtcC5zcGxpdChcIlRcIilbMF0pO1xyXG5cclxuXHJcbiAgICAvLyBnZXQgYXZlcmFnZSBmaWVsZCB4LHkgY29vcmRpbmF0ZSBvZiBwbGF5ZXIgYmFzZWQgb24gc2hvdHMgYW5kIGdpdmUgcGxheWVyIGZlZWRiYWNrXHJcbiAgICBsZXQgc3VtWCA9IDA7XHJcbiAgICBsZXQgc3VtWSA9IDA7XHJcbiAgICBsZXQgYXZnWDtcclxuICAgIGxldCBhdmdZO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHN1bVggKz0gc2hvdC5maWVsZFg7XHJcbiAgICAgIHN1bVkgKz0gc2hvdC5maWVsZFk7XHJcbiAgICB9KVxyXG5cclxuICAgIGF2Z1ggPSBzdW1YIC8gc2hvdHMubGVuZ3RoO1xyXG4gICAgYXZnWSA9IHN1bVkgLyBzaG90cy5sZW5ndGg7XHJcbiAgICBsZXQgZmllbGRQb3NpdGlvbjtcclxuXHJcbiAgICBpZiAoYXZnWCA8IDAuMTUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiS2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4xNSA8PSBhdmdYICYmIGF2Z1ggPD0gMC4zMCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJTd2VlcGVyXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJMZWZ0IEZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC4zMCA8PSBhdmdYICYmIGF2Z1ggPCAwLjQ1ICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJSaWdodCBGdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNDUpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiQ2VudGVyIEZ1bGxiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIGF2Z1kgPD0gMC40MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJMZWZ0IEhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC40NSA8PSBhdmdYICYmIGF2Z1ggPCAwLjYwICYmIDAuNjAgPD0gYXZnWSkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJSaWdodCBIYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDw9IDAuNjApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiQ2VudGVyIEhhbGZiYWNrXCJcclxuICAgIH0gZWxzZSBpZiAoMC42MCA8PSBhdmdYICYmIGF2Z1ggPCAwLjc1ICYmIGF2Z1kgPD0gMC41MCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJMZWZ0IEZvcndhcmRcIlxyXG4gICAgfSBlbHNlIGlmICgwLjYwIDw9IGF2Z1ggJiYgYXZnWCA8IDAuNzUgJiYgMC41MCA8IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiUmlnaHQgRm9yd2FyZFwiXHJcbiAgICB9IGVsc2UgaWYgKDAuNzUgPD0gYXZnWCkge1xyXG4gICAgICBmaWVsZFBvc2l0aW9uID0gXCJTdHJpa2VyXCJcclxuICAgIH1cclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuZmllbGRQb3NpdGlvbiA9IGZpZWxkUG9zaXRpb25cclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgcGxheWVycyB0aGF0IGNvbXBsaW1lbnQgdGhlIHBsYXllcidzIHN0eWxlXHJcbiAgICBsZXQgY29tcGxlbWVudEE7XHJcbiAgICBsZXQgY29tcGxlbWVudEI7XHJcblxyXG4gICAgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiS2VlcGVyXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlN3ZWVwZXJcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJMZWZ0IEZ1bGxiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJSaWdodCBGdWxsQmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlN0cmlrZXJcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJDZW50ZXIgRnVsbGJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiTGVmdCBIYWxmYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiUmlnaHQgSGFsZmJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiQ2VudGVyIEhhbGZiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIlN0cmlrZXJcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkxlZnQgRm9yd2FyZFwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJSaWdodCBGb3J3YXJkXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiU3RyaWtlclwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgfVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wbGVtZW50QSA9IGNvbXBsZW1lbnRBO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRCID0gY29tcGxlbWVudEI7XHJcblxyXG4gICAgLy8gc2hvdHMgc2NvcmVkIG9uIHRlYW0gc2lkZSBhbmQgb3Bwb25lbnQgc2lkZSBvZiBmaWVsZCwgJiBkZWZlbnNpdmUgcmVkaXJlY3RzIChpLmUuIHdpdGhpbiBrZWVwZXIgcmFuZ2Ugb2YgZ29hbClcclxuICAgIGxldCB0ZWFtU2lkZSA9IDA7XHJcbiAgICBsZXQgb3BwU2lkZSA9IDA7XHJcbiAgICBsZXQgZGVmZW5zaXZlUmVkaXJlY3QgPSAwO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGlmIChzaG90LmZpZWxkWCA+IDAuNTApIHtcclxuICAgICAgICBvcHBTaWRlKys7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGVhbVNpZGUrKztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNob3QuZmllbGRYIDwgMC4xNSkge1xyXG4gICAgICAgIGRlZmVuc2l2ZVJlZGlyZWN0Kys7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnRlYW1TaWRlR29hbHMgPSB0ZWFtU2lkZTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5vcHBvbmVudFNpZGVHb2FscyA9IG9wcFNpZGU7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuZGVmZW5zaXZlUmVkaXJlY3QgPSBkZWZlbnNpdmVSZWRpcmVjdDtcclxuXHJcbiAgICAvLyBhZXJpYWwgY291bnQgJiBwZXJjZW50YWdlIG9mIGFsbCBzaG90c1xyXG4gICAgbGV0IGFlcmlhbCA9IDA7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgaWYgKHNob3QuYWVyaWFsID09PSB0cnVlKSB7XHJcbiAgICAgICAgYWVyaWFsKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGxldCBhZXJpYWxQZXJjZW50YWdlID0gTnVtYmVyKChhZXJpYWwgLyBzaG90cy5sZW5ndGggKiAxMDApLnRvRml4ZWQoMCkpO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5hZXJpYWwgPSBhZXJpYWw7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuYWVyaWFsUGVyY2VudGFnZSA9IGFlcmlhbFBlcmNlbnRhZ2U7XHJcblxyXG4gICAgLy8gbWF4IGJhbGwgc3BlZWQsIGF2ZXJhZ2UgYmFsbCBzcGVlZCwgc2hvdHMgb3ZlciA3MCBtcGhcclxuICAgIGxldCBhdmdCYWxsU3BlZWQgPSAwO1xyXG4gICAgbGV0IHNob3RzT3ZlcjcwbXBoID0gMDtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBpZiAoc2hvdC5iYWxsX3NwZWVkID49IDcwKSB7XHJcbiAgICAgICAgc2hvdHNPdmVyNzBtcGgrKztcclxuICAgICAgfVxyXG4gICAgICBhdmdCYWxsU3BlZWQgKz0gc2hvdC5iYWxsX3NwZWVkXHJcbiAgICB9KTtcclxuXHJcbiAgICBhdmdCYWxsU3BlZWQgPSBOdW1iZXIoKGF2Z0JhbGxTcGVlZCAvIHNob3RzLmxlbmd0aCkudG9GaXhlZCgxKSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLm1heEJhbGxTcGVlZCA9IHNob3RzLnJlZHVjZSgobWF4LCBzaG90KSA9PiBzaG90LmJhbGxfc3BlZWQgPiBtYXggPyBzaG90LmJhbGxfc3BlZWQgOiBtYXgsIHNob3RzWzBdLmJhbGxfc3BlZWQpO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmF2Z0JhbGxTcGVlZCA9IGF2Z0JhbGxTcGVlZDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5zaG90c092ZXI3MG1waCA9IHNob3RzT3ZlcjcwbXBoO1xyXG5cclxuICAgIC8vIDN2MywgMnYyLCBhbmQgMXYxIGdhbWVzIHBsYXllZFxyXG4gICAgbGV0IF8zdjMgPSAwO1xyXG4gICAgbGV0IF8ydjIgPSAwO1xyXG4gICAgbGV0IF8xdjEgPSAwO1xyXG5cclxuICAgIGdhbWVzLmZvckVhY2goZ2FtZSA9PiB7XHJcbiAgICAgIGlmIChnYW1lLnR5cGUgPT09IFwiM3YzXCIpIHtcclxuICAgICAgICBfM3YzKys7XHJcbiAgICAgIH0gZWxzZSBpZiAoZ2FtZS50eXBlID09PSBcIjJ2MlwiKSB7XHJcbiAgICAgICAgXzJ2MisrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIF8xdjErKztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLl8zdjMgPSBfM3YzO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLl8ydjIgPSBfMnYyO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLl8xdjEgPSBfMXYxO1xyXG5cclxuICAgIC8vIHRvdGFsIGdhbWVzIHBsYXllZCwgdG90YWwgc2hvdHMgc2NvcmVkLCB3aW5zL2xvc3Nlcy93aW4lXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMudG90YWxHYW1lcyA9IGdhbWVzLmxlbmd0aDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy50b3RhbFNob3RzID0gc2hvdHMubGVuZ3RoO1xyXG5cclxuICAgIGxldCB3aW5zID0gMDtcclxuICAgIGxldCBsb3NzZXMgPSAwO1xyXG5cclxuICAgIGdhbWVzLmZvckVhY2goZ2FtZSA9PiB7XHJcbiAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICB3aW5zKytcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb3NzZXMrKztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLndpbnMgPSB3aW5zO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmxvc3NlcyA9IGxvc3NlcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy53aW5QY3QgPSBOdW1iZXIoKCh3aW5zIC8gKHdpbnMgKyBsb3NzZXMpKSAqIDEwMCkudG9GaXhlZCgwKSk7XHJcblxyXG4gICAgLy8gY29tcCBnYW1lcyAvIHdpbiAlLCBjYXN1YWwgZ2FtZXMgLyB3aW4gJSwgZ2FtZXMgaW4gT1RcclxuICAgIGxldCBjb21wZXRpdGl2ZUdhbWVzID0gMDtcclxuICAgIGxldCBjb21wV2luID0gMDtcclxuICAgIGxldCBjYXN1YWxHYW1lcyA9IDA7XHJcbiAgICBsZXQgY2FzdWFsV2luID0gMDtcclxuICAgIGxldCBvdmVydGltZUdhbWVzID0gMDtcclxuXHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBpZiAoZ2FtZS5tb2RlID09PSBcImNhc3VhbFwiKSB7XHJcbiAgICAgICAgY2FzdWFsR2FtZXMrKztcclxuICAgICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgICBjYXN1YWxXaW4rKztcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29tcGV0aXRpdmVHYW1lcysrO1xyXG4gICAgICAgIGlmIChnYW1lLnNjb3JlID4gZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICAgIGNvbXBXaW4rKztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdhbWUub3ZlcnRpbWUgPT09IHRydWUpIHtcclxuICAgICAgICBvdmVydGltZUdhbWVzKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBsZXQgY29tcFdpblBjdCA9IDA7XHJcblxyXG4gICAgaWYgKGNvbXBldGl0aXZlR2FtZXMgPT09IDApIHtcclxuICAgICAgY29tcFdpblBjdCA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb21wV2luUGN0ID0gTnVtYmVyKCgoY29tcFdpbiAvIGNvbXBldGl0aXZlR2FtZXMpICogMTAwKS50b0ZpeGVkKDApKTtcclxuICAgIH1cclxuICAgIGxldCBjYXN1YWxXaW5QY3QgPSAwO1xyXG5cclxuICAgIGlmIChjYXN1YWxHYW1lcyA9PT0gMCkge1xyXG4gICAgICBjYXN1YWxXaW5QY3QgPSAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY2FzdWFsV2luUGN0ID0gTnVtYmVyKCgoY2FzdWFsV2luIC8gY2FzdWFsR2FtZXMpICogMTAwKS50b0ZpeGVkKDEpKTtcclxuICAgIH1cclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY29tcGV0aXRpdmVHYW1lcyA9IGNvbXBldGl0aXZlR2FtZXM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY2FzdWFsR2FtZXMgPSBjYXN1YWxHYW1lcztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wV2luUGN0ID0gY29tcFdpblBjdDtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jYXN1YWxXaW5QY3QgPSBjYXN1YWxXaW5QY3Q7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMub3ZlcnRpbWVHYW1lcyA9IG92ZXJ0aW1lR2FtZXM7XHJcblxyXG4gICAgY29uc29sZS5sb2coZmVlZGJhY2tSZXN1bHRzKVxyXG5cclxuICAgIHJldHVybiB0aGlzLmJ1aWxkTGV2ZWxzKGZlZWRiYWNrUmVzdWx0cyk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRMZXZlbHMoZmVlZGJhY2tSZXN1bHRzKSB7XHJcblxyXG4gICAgY29uc3QgZmVlZGJhY2tDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBBbmRGZWVkYmFja0NvbnRhaW5lclwiKTtcclxuXHJcbiAgICAvLyByZWZvcm1hdCBoZWF0bWFwIGdlbmVyYXRpb24gdGltZSB0byByZW1vdmUgc2Vjb25kc1xyXG4gICAgY29uc3QgdGltZVJlZm9ybWF0ID0gW2ZlZWRiYWNrUmVzdWx0cy5ub3cuc3BsaXQoXCI6XCIpWzBdLCBmZWVkYmFja1Jlc3VsdHMubm93LnNwbGl0KFwiOlwiKVsxXV0uam9pbihcIjpcIikgKyBmZWVkYmFja1Jlc3VsdHMubm93LnNwbGl0KFwiOlwiKVsyXS5zbGljZSgyKTtcclxuICAgIC8vIHJlZm9ybWF0IGRhdGVzIHdpdGggc2xhc2hlcyBhbmQgcHV0IHllYXIgYXQgZW5kXHJcbiAgICBjb25zdCBkYXRlUmVmb3JtYXQxID0gW2ZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWUuc3BsaXQoXCItXCIpWzFdLCBmZWVkYmFja1Jlc3VsdHMuZmlyc3RHYW1lLnNwbGl0KFwiLVwiKVsyXV0uam9pbihcIi9cIikgKyBcIi9cIiArIGZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWUuc3BsaXQoXCItXCIpWzBdO1xyXG4gICAgY29uc3QgZGF0ZVJlZm9ybWF0MiA9IFtmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWUuc3BsaXQoXCItXCIpWzFdLCBmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWUuc3BsaXQoXCItXCIpWzJdXS5qb2luKFwiL1wiKSArIFwiL1wiICsgZmVlZGJhY2tSZXN1bHRzLmxhc3RHYW1lLnNwbGl0KFwiLVwiKVswXTtcclxuXHJcbiAgICAvLyBoZWF0bWFwIGdlbmVyYXRpb24gYW5kIHJhbmdlIG9mIGRhdGVzIG9uIGdhbWVzIChtYXggYW5kIG1pbilcclxuICAgIGNvbnN0IGl0ZW0zX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2RhdGVSZWZvcm1hdDJ9YCk7XHJcbiAgICBjb25zdCBpdGVtM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiTGFzdCBnYW1lXCIpO1xyXG4gICAgY29uc3QgaXRlbTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTNfY2hpbGQsIGl0ZW0zX2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW0zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtM193cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0yX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2RhdGVSZWZvcm1hdDF9YCk7XHJcbiAgICBjb25zdCBpdGVtMl9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiRmlyc3QgZ2FtZVwiKTtcclxuICAgIGNvbnN0IGl0ZW0yX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yX2NoaWxkLCBpdGVtMl9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHt0aW1lUmVmb3JtYXR9YCk7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiSGVhdG1hcCBnZW5lcmF0ZWRcIik7XHJcbiAgICBjb25zdCBpdGVtMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMV9jaGlsZCwgaXRlbTFfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczFfSGVhdG1hcERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stMVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMSwgaXRlbTIsIGl0ZW0zKVxyXG5cclxuICAgIC8vIHBsYXllciBmZWVkYmFjayBiYXNlZCBvbiBhdmVyYWdlIGZpZWxkIHgseSBjb29yZGluYXRlIG9mIHBsYXllciBzaG90c1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRCfWApO1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDJcIik7XHJcbiAgICBjb25zdCBpdGVtNl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNl9jaGlsZCwgaXRlbTZfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW02X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRBfWApO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDFcIik7XHJcbiAgICBjb25zdCBpdGVtNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNV9jaGlsZCwgaXRlbTVfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW01X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmZpZWxkUG9zaXRpb259YCk7XHJcbiAgICBjb25zdCBpdGVtNF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiWW91ciBwbGF5c3R5bGVcIik7XHJcbiAgICBjb25zdCBpdGVtNF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNF9jaGlsZCwgaXRlbTRfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW00X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczJfcGxheWVyVHlwZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay0yXCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zXCIgfSwgbnVsbCwgaXRlbTQsIGl0ZW01LCBpdGVtNilcclxuXHJcbiAgICAvLyBzaG90cyBvbiB0ZWFtL29wcG9uZW50IHNpZGVzIG9mIGZpZWxkLCBkZWZlbnNpdmUgcmVkaXJlY3RzLCBhbmQgYWVyaWFsIHNob3RzIC8gJVxyXG4gICAgY29uc3QgaXRlbTlfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmRlZmVuc2l2ZVJlZGlyZWN0fWApO1xyXG4gICAgY29uc3QgaXRlbTlfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlJlZGlyZWN0cyBmcm9tIE93biBHb2FsXCIpO1xyXG4gICAgY29uc3QgaXRlbTlfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTlfY2hpbGQsIGl0ZW05X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtOSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTlfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtOF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudGVhbVNpZGVHb2Fsc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5vcHBvbmVudFNpZGVHb2Fsc31gKTtcclxuICAgIGNvbnN0IGl0ZW04X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJHb2FscyBCZWhpbmQgJiBCZXlvbmQgTWlkZmllbGRcIik7XHJcbiAgICBjb25zdCBpdGVtOF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtOF9jaGlsZCwgaXRlbThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW04ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtOF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW03X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5hZXJpYWx9IDogJHtmZWVkYmFja1Jlc3VsdHMuYWVyaWFsUGVyY2VudGFnZX0lYCk7XHJcbiAgICBjb25zdCBpdGVtN19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQWVyaWFsIEdvYWwgVG90YWwgJiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtN193cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtN19jaGlsZCwgaXRlbTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW03ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtN193cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnMzX3Nob3REZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTNcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtNywgaXRlbTgsIGl0ZW05KVxyXG5cclxuICAgIC8vIG1heCBiYWxsIHNwZWVkLCBhdmVyYWdlIGJhbGwgc3BlZWQsIHNob3RzIG92ZXIgNzAgbXBoXHJcbiAgICBjb25zdCBpdGVtMTJfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnNob3RzT3ZlcjcwbXBofWApO1xyXG4gICAgY29uc3QgaXRlbTEyX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJTaG90cyBPdmVyIDcwIG1waFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTJfY2hpbGQsIGl0ZW0xMl9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTEyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmF2Z0JhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkF2ZXJhZ2UgQmFsbCBTcGVlZFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTFfY2hpbGQsIGl0ZW0xMV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTExID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTFfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLm1heEJhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIk1heCBCYWxsIFNwZWVkXCIpO1xyXG4gICAgY29uc3QgaXRlbTEwX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xMF9jaGlsZCwgaXRlbTEwX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTAgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xMF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM0X2JhbGxEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTRcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnMgaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyXCIgfSwgbnVsbCwgaXRlbTEwLCBpdGVtMTEsIGl0ZW0xMilcclxuXHJcbiAgICAvLyB0b3RhbCBnYW1lcyBwbGF5ZWQsIHRvdGFsIHNob3RzIHNjb3JlZCwgd2lucy9sb3NzZXMvd2luJVxyXG4gICAgY29uc3QgaXRlbTE1X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy53aW5zfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLmxvc3Nlc30gOiAke2ZlZWRiYWNrUmVzdWx0cy53aW5QY3R9JWApO1xyXG4gICAgY29uc3QgaXRlbTE1X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJXaW5zLCBMb3NzZXMsICYgV2luIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTVfY2hpbGQsIGl0ZW0xNV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTVfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnRvdGFsU2hvdHN9YCk7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlRvdGFsIEdvYWxzXCIpO1xyXG4gICAgY29uc3QgaXRlbTE0X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xNF9jaGlsZCwgaXRlbTE0X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xNF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudG90YWxHYW1lc31gKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiVG90YWwgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTEzX2NoaWxkLCBpdGVtMTNfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTEzX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczVfdmljdG9yeURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stNVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTMsIGl0ZW0xNCwgaXRlbTE1KVxyXG5cclxuICAgIC8vIDN2MywgMnYyLCBhbmQgMXYxIGdhbWVzIHBsYXllZFxyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMXYxfWApO1xyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIxdjEgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMThfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE4X2NoaWxkLCBpdGVtMThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xOCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE4X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMnYyfWApO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIydjIgZ2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTdfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE3X2NoaWxkLCBpdGVtMTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE3X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fM3YzfWApO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIzdjMgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTZfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE2X2NoaWxkLCBpdGVtMTZfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE2X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczZfZ2FtZVR5cGVEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTZcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtMTYsIGl0ZW0xNywgaXRlbTE4KVxyXG5cclxuICAgIC8vIGNvbXAgZ2FtZXMgLyB3aW4gJSwgY2FzdWFsIGdhbWVzIC8gd2luICUsIGdhbWVzIGluIE9UXHJcbiAgICBjb25zdCBpdGVtMjFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLm92ZXJ0aW1lR2FtZXN9YCk7XHJcbiAgICBjb25zdCBpdGVtMjFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIk92ZXJ0aW1lIEdhbWVzXCIpO1xyXG4gICAgY29uc3QgaXRlbTIxX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yMV9jaGlsZCwgaXRlbTIxX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0yMV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0yMF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY29tcGV0aXRpdmVHYW1lc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5jb21wV2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0yMF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ29tcGV0aXRpdmUgR2FtZXMgJiBXaW4gUGN0XCIpO1xyXG4gICAgY29uc3QgaXRlbTIwX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yMF9jaGlsZCwgaXRlbTIwX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMjAgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0yMF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xOV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY2FzdWFsR2FtZXN9IDogJHtmZWVkYmFja1Jlc3VsdHMuY2FzdWFsV2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0xOV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ2FzdWFsIEdhbWVzICYgV2luIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xOV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTlfY2hpbGQsIGl0ZW0xOV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE5ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTlfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zN19vdmVydGltZURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stN1wiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTksIGl0ZW0yMCwgaXRlbTIxKVxyXG5cclxuICAgIC8vIHJlcGxhY2Ugb2xkIGNvbnRlbnQgaWYgaXQncyBhbHJlYWR5IG9uIHRoZSBwYWdlXHJcbiAgICBjb25zdCBmZWVkYmFjazEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTFcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTJcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTNcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTRcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTVcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTZcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTdcIik7XHJcblxyXG4gICAgaWYgKGZlZWRiYWNrMSAhPT0gbnVsbCkge1xyXG4gICAgICBmZWVkYmFjazEucmVwbGFjZVdpdGgoY29sdW1uczFfSGVhdG1hcERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazIucmVwbGFjZVdpdGgoY29sdW1uczJfcGxheWVyVHlwZSk7XHJcbiAgICAgIGZlZWRiYWNrMy5yZXBsYWNlV2l0aChjb2x1bW5zM19zaG90RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNC5yZXBsYWNlV2l0aChjb2x1bW5zNF9iYWxsRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNS5yZXBsYWNlV2l0aChjb2x1bW5zNV92aWN0b3J5RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNi5yZXBsYWNlV2l0aChjb2x1bW5zNl9nYW1lVHlwZURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazcucmVwbGFjZVdpdGgoY29sdW1uczdfb3ZlcnRpbWVEZXRhaWxzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnMxX0hlYXRtYXBEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczJfcGxheWVyVHlwZSk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM0X2JhbGxEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczNfc2hvdERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zNV92aWN0b3J5RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM2X2dhbWVUeXBlRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM3X292ZXJ0aW1lRGV0YWlscyk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZlZWRiYWNrXHJcblxyXG5cclxuLypcclxuLSBIZWF0bWFwIGdlbmVyYXRlZCBvblxyXG4tIHN0YXJ0IGRhdGVcclxuLSBlbmQgZGF0ZVxyXG4tLS0tLS0tLS0tLS0tXHJcbi0gcmVsZXZhbnQgc29jY2VyIHBvc2l0aW9uIGJhc2VkIG9uIGF2ZyBzY29yZSBwb3NpdGlvblxyXG4tIHBhaXJlZCBiZXN0IHdpdGggMVxyXG4tIHBhaXJlZCBiZXN0IHdpdGggMlxyXG4tLS0tLS0tLS0tLS0tLVxyXG4tIHNob3RzIHNjb3JlZCBsZWZ0IC8gcmlnaHQgb2YgbWlkZmllbGRcclxuLSBzaG90cyBzY29yZWQgYXMgcmVkaXJlY3RzIGJlc2lkZSBvd24gZ29hbCAoRGVmZW5zaXZlIHJlZGlyZWN0cylcclxuLSBhZXJpYWwgY291bnQgJiBzaG90ICVcclxuLS0tLS0tLS0tLS0tLS1cclxuLSBtYXggYmFsbCBzcGVlZFxyXG4tIGF2ZyBiYWxsIHNwZWVkXHJcbi0gc2hvdHMgb3ZlciA3MG1waCAofiAxMTAga3BoKVxyXG4tLS0tLS0tLS0tLS0tLVxyXG4tIDN2MyBnYW1lcyBwbGF5ZWRcclxuLSAydjIgZ2FtZXMgcGxheWVkXHJcbi0gMXYxIGdhbWVzIHBsYXllZFxyXG4tLS0tLS0tLS0tLS0tXHJcbi0gdG90YWwgZ2FtZXMgcGxheWVkXHJcbi0gdG90YWwgc2hvdHMgc2NvcmVkXHJcbi0gd2luIC8gbG9zcyAvIHdpbiVcclxuLS0tLS0tLS0tLS0tLVxyXG4tIGNvbXAgZ2FtZXMgLyB3aW4gJVxyXG4tIGNhc3VhbCBnYW1lcyAvIHdpbiAlXHJcbi0gZ2FtZXMgaW4gT1RcclxuLS0tLS0tLS0tLS0tLVxyXG5cclxuKi8iLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiO1xyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgZGF0ZUZpbHRlciBmcm9tIFwiLi9kYXRlRmlsdGVyXCI7XHJcbmltcG9ydCBmZWVkYmFjayBmcm9tIFwiLi9oZWF0bWFwRmVlZGJhY2tcIjtcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBoZWF0bWFwcyA9IHtcclxuXHJcbiAgbG9hZEhlYXRtYXBDb250YWluZXJzKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgdGhpcy5idWlsZEZpbHRlcnMoKTtcclxuICAgIC8vIGJ1aWxkcyBidXR0b24gdG8gZ2VuZXJhdGUgaGVhdG1hcCwgc2F2ZSBoZWF0bWFwLCBhbmQgdmlldyBzYXZlZCBoZWF0bWFwc1xyXG4gICAgLy8gdGhlIGFjdGlvbiBpcyBhc3luYyBiZWNhdXNlIHRoZSB1c2VyJ3Mgc2F2ZWQgaGVhdG1hcHMgaGF2ZSB0byBiZSByZW5kZXJlZCBhcyBIVE1MIG9wdGlvbiBlbGVtZW50c1xyXG4gICAgdGhpcy5idWlsZEdlbmVyYXRvcigpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmlsdGVycygpIHtcclxuXHJcbiAgICAvLyByZXNldCBidXR0b25cclxuICAgIGNvbnN0IHJlc2V0QnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInJlc2V0RmlsdGVyc0J0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiUmVzZXQgRmlsdGVyc1wiKTtcclxuXHJcbiAgICAvLyBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZUJ0blRleHQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHt9LCBcIkRhdGVzXCIpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhciBmYS1jYWxlbmRhclwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsXCIgfSwgbnVsbCwgZGF0ZUJ0bkljb24pO1xyXG4gICAgY29uc3QgZGF0ZUJ0biA9IGVsQnVpbGRlcihcImFcIiwge1wiaWRcIjpcImRhdGVSYW5nZUJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLW91dGxpbmVkIGlzLWRhcmtcIiB9LCBudWxsLCBkYXRlQnRuSWNvblNwYW4sIGRhdGVCdG5UZXh0KTtcclxuICAgIGNvbnN0IGRhdGVCdG5QYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRhdGVCdG4pO1xyXG5cclxuICAgIC8vIGJhbGwgc3BlZWQgYnV0dG9uXHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5UZXh0ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7fSwgXCJCYWxsIFNwZWVkXCIpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWJvbHRcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0bkljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsXCIgfSwgbnVsbCwgYmFsbFNwZWVkQnRuSWNvbik7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG4gPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLW91dGxpbmVkIGlzLWRhcmtcIiB9LCBudWxsLCBiYWxsU3BlZWRCdG5JY29uU3BhbiwgYmFsbFNwZWVkQnRuVGV4dCk7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5QYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGJhbGxTcGVlZEJ0bik7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGNvbnN0IGljb242ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtY2xvY2tcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjYpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBzZWw2X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPVFwiKTtcclxuICAgIGNvbnN0IHNlbDZfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIE9UXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItb3ZlcnRpbWVcIiB9LCBudWxsLCBzZWw2X29wMSwgc2VsNl9vcDIsIHNlbDZfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q2LCBpY29uU3BhbjYpO1xyXG4gICAgY29uc3QgY29udHJvbDYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjYpO1xyXG5cclxuICAgIC8vIHJlc3VsdFxyXG4gICAgY29uc3QgaWNvbjUgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS10cm9waHlcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjUpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUmVzdWx0XCIpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiVmljdG9yeVwiKTtcclxuICAgIGNvbnN0IHNlbDVfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkRlZmVhdFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDUgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLWdhbWVSZXN1bHRcIiB9LCBudWxsLCBzZWw1X29wMSwgc2VsNV9vcDIsIHNlbDVfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q1LCBpY29uU3BhbjUpO1xyXG4gICAgY29uc3QgY29udHJvbDUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjUpO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZVxyXG4gICAgY29uc3QgaWNvbjQgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1zaXRlbWFwXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb240KTtcclxuICAgIGNvbnN0IHNlbDRfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkdhbWUgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3A0ID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDQgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLWdhbWVUeXBlXCIgfSwgbnVsbCwgc2VsNF9vcDEsIHNlbDRfb3AyLCBzZWw0X29wMywgc2VsNF9vcDQpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDQsIGljb25TcGFuNCk7XHJcbiAgICBjb25zdCBjb250cm9sNCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2NCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBpY29uMyA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWdhbWVwYWRcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMyA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjMpO1xyXG4gICAgY29uc3Qgc2VsM19vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiR2FtZSBNb2RlXCIpO1xyXG4gICAgY29uc3Qgc2VsM19vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBzZWwzX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBzZWxlY3QzID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1nYW1lTW9kZVwiIH0sIG51bGwsIHNlbDNfb3AxLCBzZWwzX29wMiwgc2VsM19vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDMsIGljb25TcGFuMyk7XHJcbiAgICBjb25zdCBjb250cm9sMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Myk7XHJcblxyXG4gICAgLy8gcGFydHlcclxuICAgIGNvbnN0IGljb24yID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtaGFuZHNoYWtlXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24yKTtcclxuICAgIGNvbnN0IHNlbDJfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlRlYW1cIik7XHJcbiAgICBjb25zdCBzZWwyX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBwYXJ0eVwiKTtcclxuICAgIGNvbnN0IHNlbDJfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlBhcnR5XCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItdGVhbVN0YXR1c1wiIH0sIG51bGwsIHNlbDJfb3AxLCBzZWwyX29wMiwgc2VsMl9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDIsIGljb25TcGFuMik7XHJcbiAgICBjb25zdCBjb250cm9sMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Mik7XHJcblxyXG4gICAgLy8gc2hvdCB0eXBlXHJcbiAgICBjb25zdCBpY29uMSA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWZ1dGJvbFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW4xID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uMSk7XHJcbiAgICBjb25zdCBzZWwxX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTaG90IFR5cGVcIik7XHJcbiAgICBjb25zdCBzZWwxX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBzZWwxX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTdGFuZGFyZFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDEgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLXNob3RUeXBlXCIgfSwgbnVsbCwgc2VsMV9vcDEsIHNlbDFfb3AyLCBzZWwxX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MSwgaWNvblNwYW4xKTtcclxuICAgIGNvbnN0IGNvbnRyb2wxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYxKTtcclxuXHJcbiAgICBjb25zdCBmaWx0ZXJGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWx0ZXJGaWVsZFwiLCBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgY29udHJvbDEsIGNvbnRyb2wyLCBjb250cm9sMywgY29udHJvbDQsIGNvbnRyb2w1LCBjb250cm9sNiwgYmFsbFNwZWVkQnRuUGFyZW50LCBkYXRlQnRuUGFyZW50LCByZXNldEJ0bik7XHJcbiAgICBjb25zdCBQYXJlbnRGaWx0ZXJDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGZpbHRlckZpZWxkKTtcclxuXHJcbiAgICAvLyBhcHBlbmQgZmlsdGVyIGNvbnRhaW5lciB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEZpbHRlckNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHZW5lcmF0b3IoKSB7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIC8vIHVzZSBmZXRjaCB0byBhcHBlbmQgb3B0aW9ucyB0byBzZWxlY3QgZWxlbWVudCBpZiB1c2VyIGF0IGxlYXN0IDEgc2F2ZWQgaGVhdG1hcFxyXG4gICAgQVBJLmdldEFsbChgaGVhdG1hcHM/dXNlcklkPSR7YWN0aXZlVXNlcklkfWApXHJcbiAgICAgIC50aGVuKGhlYXRtYXBzID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkFycmF5IG9mIHVzZXIncyBzYXZlZCBoZWF0bWFwczpcIiwgaGVhdG1hcHMpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZmlyZVwiIH0sIG51bGwpO1xyXG4gICAgICAgIGNvbnN0IGljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uKTtcclxuICAgICAgICBjb25zdCBzZWwxX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCYXNpYyBIZWF0bWFwXCIpO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJoZWF0bWFwRHJvcGRvd25cIiB9LCBudWxsLCBzZWwxX29wMSk7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcFNlbGVjdERpdiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIGhlYXRtYXBEcm9wZG93biwgaWNvblNwYW4pO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBoZWF0bWFwU2VsZWN0RGl2KTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJkZWxldGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJEZWxldGUgSGVhdG1hcFwiKVxyXG4gICAgICAgIGNvbnN0IGRlbGV0ZUJ0bkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRlbGV0ZUhlYXRtYXBCdG4pXHJcbiAgICAgICAgY29uc3Qgc2F2ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgSGVhdG1hcFwiKVxyXG4gICAgICAgIGNvbnN0IHNhdmVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBzYXZlQnRuKVxyXG4gICAgICAgIGNvbnN0IHNhdmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInNhdmVIZWF0bWFwSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcIk5hbWUgYW5kIHNhdmUgdGhpcyBoZWF0bWFwXCIsIFwibWF4bGVuZ3RoXCI6IFwiMjVcIiB9LCBudWxsKVxyXG4gICAgICAgIGNvbnN0IHNhdmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaXMtZXhwYW5kZWRcIiB9LCBudWxsLCBzYXZlSW5wdXQpXHJcblxyXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvckJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJnZW5lcmF0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJHZW5lcmF0ZSBIZWF0bWFwXCIpO1xyXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvckNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdlbmVyYXRvckJ1dHRvbik7XHJcblxyXG4gICAgICAgIC8vIGlmIG5vIGhlYXRtYXBzIGFyZSBzYXZlZCwgZ2VuZXJhdGUgbm8gZXh0cmEgb3B0aW9ucyBpbiBkcm9wZG93blxyXG4gICAgICAgIGlmIChoZWF0bWFwcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGNvbnN0IGdlbmVyYXRvckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGhlYXRtYXBDb250cm9sLCBnZW5lcmF0b3JDb250cm9sLCBzYXZlQ29udHJvbCwgc2F2ZUJ0bkNvbnRyb2wsIGRlbGV0ZUJ0bkNvbnRyb2wpO1xyXG4gICAgICAgICAgY29uc3QgUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBnZW5lcmF0b3JGaWVsZCk7XHJcbiAgICAgICAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEdlbmVyYXRvckNvbnRhaW5lcik7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZWxzZSwgZm9yIGVhY2ggaGVhdG1hcCBzYXZlZCwgbWFrZSBhIG5ldyBvcHRpb24gYW5kIGFwcGVuZCBpdCB0byB0aGVcclxuICAgICAgICAgIGhlYXRtYXBzLmZvckVhY2goaGVhdG1hcCA9PiB7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwgeyBcImlkXCI6IGBoZWF0bWFwLSR7aGVhdG1hcC5pZH1gIH0sIGAke2hlYXRtYXAudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXX06ICR7aGVhdG1hcC5uYW1lfWApKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1aWxkRmllbGRhbmRHb2FsKCk7XHJcbiAgICAgICAgZGF0ZUZpbHRlci5idWlsZERhdGVGaWx0ZXIoKTtcclxuICAgICAgICB0aGlzLmhlYXRtYXBFdmVudE1hbmFnZXIoKTtcclxuICAgICAgfSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmllbGRhbmRHb2FsKCkge1xyXG4gICAgY29uc3QgZmllbGRJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZUJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLWJnXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwiXCIgfSwgbnVsbCwgZmllbGRJbWFnZUJhY2tncm91bmQsIGZpZWxkSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZmllbGRJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvUkxfZ29hbF9jcm9wcGVkX25vX2JnX0JXLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdvYWxJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkdvYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdvYWxJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBoZWF0bWFwSW1hZ2VDb250YWluZXJzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25GaWVsZCwgYWxpZ25Hb2FsKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIGhvbGRpbmcgYWxsIHNob3QgaW5mb3JtYXRpb25cclxuICAgIGNvbnN0IHBhcmVudFNob3RDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge1wiaWRcIjpcImhlYXRtYXBBbmRGZWVkYmFja0NvbnRhaW5lclwiLCBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGhlYXRtYXBJbWFnZUNvbnRhaW5lcnMpXHJcblxyXG4gICAgLy8gYXBwZW5kIGZpZWxkIGFuZCBnb2FsIHRvIHBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50U2hvdENvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgaGVhdG1hcEV2ZW50TWFuYWdlcigpIHtcclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIHByaW1hcnkgYnV0dG9ucyBvbiBoZWF0bWFwIHBhZ2VcclxuICAgIGNvbnN0IGdlbmVyYXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2VuZXJhdGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwQnRuXCIpO1xyXG4gICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlSGVhdG1hcEJ0blwiKTtcclxuXHJcbiAgICBnZW5lcmF0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmdldFVzZXJTaG90cyk7XHJcbiAgICBzYXZlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuc2F2ZUhlYXRtYXApO1xyXG4gICAgZGVsZXRlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcCk7XHJcblxyXG4gICAgLy8gYWRkIGxpc3RlbmVyIHRvIGhlYXRtYXAgcGFyZW50IHRoYXQgaGlnaGxpZ2h0cyBmaWx0ZXIgYnV0dG9ucyByZWQgd2hlbiBjaGFuZ2VkXHJcbiAgICAvLyBoZWF0bWFwIGJ1dHRvbnMgcmV0dXJuIHRvIGRlZmF1bHQgY29sb3IgaWYgdGhlIGRlZmF1bHQgb3B0aW9uIGlzIHNlbGVjdGVkXHJcbiAgICBjb25zdCBmaWx0ZXJGaWVsZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyRmllbGRcIik7XHJcbiAgICBmaWx0ZXJGaWVsZC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChlKSA9PiB7XHJcbiAgICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgICAgaWYgKGUudGFyZ2V0LnZhbHVlID09PSBlLnRhcmdldC5jaGlsZE5vZGVzWzBdLnRleHRDb250ZW50KSB7XHJcbiAgICAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXIgdG8gaGVhdG1hcCB0aXRsZSBpbnB1dCB0byBjbGVhciByZWQgaGlnaGxpdGluZyBhbmQgdGV4dCBpZiBhbiBlcnJvciB3YXMgdGhyb3duXHJcbiAgICBjb25zdCBzYXZlSGVhdG1hcElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlSGVhdG1hcElucHV0XCIpO1xyXG4gICAgc2F2ZUhlYXRtYXBJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICBpZiAoc2F2ZUhlYXRtYXBJbnB1dC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1kYW5nZXJcIikgfHwgc2F2ZUhlYXRtYXBJbnB1dC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zdWNjZXNzXCIpKSB7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBJbnB1dC52YWx1ZSA9IFwiXCI7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLXN1Y2Nlc3NcIik7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gcmVzZXQgZmlsdGVyIGJ1dHRvblxyXG4gICAgY29uc3QgcmVzZXRGaWx0ZXJzQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXNldEZpbHRlcnNCdG5cIik7XHJcbiAgICBjb25zdCBnYW1lTW9kZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVNb2RlXCIpO1xyXG4gICAgY29uc3Qgc2hvdFR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1zaG90VHlwZVwiKTtcclxuICAgIGNvbnN0IGdhbWVSZXN1bHRGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lUmVzdWx0XCIpO1xyXG4gICAgY29uc3QgZ2FtZXR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lVHlwZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItb3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCB0ZWFtU3RhdHVzRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItdGVhbVN0YXR1c1wiKTtcclxuICAgIGNvbnN0IGRhdGVSYW5nZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGF0ZVJhbmdlQnRuXCIpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRCdG5cIik7XHJcblxyXG4gICAgcmVzZXRGaWx0ZXJzQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgIGdhbWVNb2RlRmlsdGVyLnZhbHVlID0gXCJHYW1lIE1vZGVcIjtcclxuICAgICAgZ2FtZU1vZGVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgc2hvdFR5cGVGaWx0ZXIudmFsdWUgPSBcIlNob3QgVHlwZVwiO1xyXG4gICAgICBzaG90VHlwZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBnYW1lUmVzdWx0RmlsdGVyLnZhbHVlID0gXCJSZXN1bHRcIjtcclxuICAgICAgZ2FtZVJlc3VsdEZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBnYW1ldHlwZUZpbHRlci52YWx1ZSA9IFwiR2FtZSBUeXBlXCI7XHJcbiAgICAgIGdhbWV0eXBlRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIG92ZXJ0aW1lRmlsdGVyLnZhbHVlID0gXCJPdmVydGltZVwiO1xyXG4gICAgICBvdmVydGltZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICB0ZWFtU3RhdHVzRmlsdGVyLnZhbHVlID0gXCJUZWFtXCI7XHJcbiAgICAgIHRlYW1TdGF0dXNGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgLy8gcmVzZXQgYmFsbCBzcGVlZCBnbG9iYWwgdmFyaWFibGVzXHJcbiAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZUJhbGxTcGVlZEdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgICBiYWxsU3BlZWRCdG4uY2xhc3NMaXN0LmFkZChcImlzLW91dGxpbmVkXCIpO1xyXG5cclxuICAgICAgLy8gcmVzZXQgZGF0ZSBmaWx0ZXIgYW5kIGFzc29jaWF0ZWQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICBkYXRlRmlsdGVyLmNsZWFyRGF0ZUZpbHRlcigpO1xyXG5cclxuICAgIH0pXHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gYmFsbCBzcGVlZCBidXR0b25cclxuICAgIGJhbGxTcGVlZEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuYmFsbFNwZWVkTWF4KTtcclxuXHJcbiAgICAvLyBhZGQgZnVuY3Rpb25hbGl0eSB0byBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgZGF0ZVJhbmdlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLm9wZW5EYXRlRmlsdGVyKTtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBoZWF0bWFwcyIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiXHJcbmltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcbmNvbnN0IHdlYnBhZ2VOYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdi1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBsb2dpbk9yU2lnbnVwID0ge1xyXG5cclxuICAvLyBidWlsZCBhIGxvZ2luIGZvcm0gdGhhdCB2YWxpZGF0ZXMgdXNlciBpbnB1dC4gU3VjY2Vzc2Z1bCBsb2dpbiBzdG9yZXMgdXNlciBpZCBpbiBzZXNzaW9uIHN0b3JhZ2VcclxuICBsb2dpbkZvcm0oKSB7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luSW5wdXRfcGFzc3dvcmQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwYXNzd29yZElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJwYXNzd29yZFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImxvZ2luTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW4gbm93XCIpO1xyXG4gICAgY29uc3QgbG9naW5Gb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJsb2dpbkZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIGxvZ2luSW5wdXRfdXNlcm5hbWUsIGxvZ2luSW5wdXRfcGFzc3dvcmQsIGxvZ2luQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKGxvZ2luRm9ybSlcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpXHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwRm9ybSgpIHtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X25hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIG5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X2NvbmZpcm0gPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJjb25maXJtUGFzc3dvcmRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImNvbmZpcm0gcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzaWdudXBOb3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwIG5vd1wiKTtcclxuICAgIGNvbnN0IHNpZ251cEZvcm0gPSBlbEJ1aWxkZXIoXCJmb3JtXCIsIHsgXCJpZFwiOiBcInNpZ251cEZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIHNpZ251cElucHV0X25hbWUsIHNpZ251cElucHV0X3VzZXJuYW1lLCBzaWdudXBJbnB1dF9wYXNzd29yZCwgc2lnbnVwSW5wdXRfY29uZmlybSwgc2lnbnVwQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHNpZ251cEZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIC8vIGFzc2lnbiBldmVudCBsaXN0ZW5lcnMgYmFzZWQgb24gd2hpY2ggZm9ybSBpcyBvbiB0aGUgd2VicGFnZVxyXG4gIHVzZXJFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBsb2dpbk5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9naW5Ob3dcIilcclxuICAgIGNvbnN0IHNpZ251cE5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2lnbnVwTm93XCIpXHJcbiAgICBpZiAobG9naW5Ob3cgPT09IG51bGwpIHtcclxuICAgICAgc2lnbnVwTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cFVzZXIsIGV2ZW50KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9naW5Ob3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9naW5Vc2VyLCBldmVudClcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyB2YWxpZGF0ZSB1c2VyIGxvZ2luIGZvcm0gaW5wdXRzIGJlZm9yZSBsb2dnaW5nIGluXHJcbiAgbG9naW5Vc2VyKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGNvbnN0IHVzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBwYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFzc3dvcmRJbnB1dFwiKS52YWx1ZVxyXG4gICAgaWYgKHVzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5nZXRBbGwoXCJ1c2Vyc1wiKS50aGVuKHVzZXJzID0+IHVzZXJzLmZvckVhY2godXNlciA9PiB7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgdXNlcm5hbWUgYW5kIHBhc3N3b3JkXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgaWYgKHVzZXIucGFzc3dvcmQgPT09IHBhc3N3b3JkKSB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgY29uc3QgX25hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3VzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IGNvbmZpcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbmZpcm1QYXNzd29yZFwiKS52YWx1ZVxyXG4gICAgbGV0IHVuaXF1ZVVzZXJuYW1lID0gdHJ1ZTsgLy9jaGFuZ2VzIHRvIGZhbHNlIGlmIHVzZXJuYW1lIGFscmVhZHkgZXhpc3RzXHJcbiAgICBpZiAoX25hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF91c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChjb25maXJtID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgIT09IGNvbmZpcm0pIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKCh1c2VyLCBpZHgpID0+IHtcclxuICAgICAgICAvLyBjaGVjayBmb3IgZXhpc3RpbmcgdXNlcm5hbWUgaW4gZGF0YWJhc2VcclxuICAgICAgICBpZiAodXNlci51c2VybmFtZS50b0xvd2VyQ2FzZSgpID09PSBfdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgdW5pcXVlVXNlcm5hbWUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9hdCB0aGUgZW5kIG9mIHRoZSBsb29wLCBwb3N0XHJcbiAgICAgICAgaWYgKGlkeCA9PT0gdXNlcnMubGVuZ3RoIC0gMSAmJiB1bmlxdWVVc2VybmFtZSkge1xyXG4gICAgICAgICAgbGV0IG5ld1VzZXIgPSB7XHJcbiAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogX3VzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogX3Bhc3N3b3JkLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIEFQSS5wb3N0SXRlbShcInVzZXJzXCIsIG5ld1VzZXIpLnRoZW4odXNlciA9PiB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsb2dpblN0YXR1c0FjdGl2ZSh1c2VyKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIsIHVzZXIuaWQpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpOyAvL2J1aWxkIGxvZ2dlZCBpbiB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH0sXHJcblxyXG4gIGxvZ291dFVzZXIoKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKGZhbHNlKTsgLy9idWlsZCBsb2dnZWQgb3V0IHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbG9naW5PclNpZ251cCIsImltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuLy8gaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuaW1wb3J0IGhlYXRtYXBzIGZyb20gXCIuL2hlYXRtYXBzXCI7XHJcblxyXG4vLyBmdW5jdGlvbiBjbG9zZUJveChlKSB7XHJcbi8vICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcImRlbGV0ZVwiKSkge1xyXG4vLyAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoKVxyXG5uYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSlcclxuaGVhdG1hcHMubG9hZEhlYXRtYXBDb250YWluZXJzKCk7IiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBsb2dpbk9yU2lnbnVwIGZyb20gXCIuL2xvZ2luXCJcclxuaW1wb3J0IHByb2ZpbGUgZnJvbSBcIi4vcHJvZmlsZVwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiXHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbmF2YmFyID0ge1xyXG5cclxuICBnZW5lcmF0ZU5hdmJhcihsb2dnZWRJbkJvb2xlYW4pIHtcclxuXHJcbiAgICAvLyBuYXZiYXItbWVudSAocmlnaHQgc2lkZSBvZiBuYXZiYXIgLSBhcHBlYXJzIG9uIGRlc2t0b3AgMTAyNHB4KylcclxuICAgIGNvbnN0IGJ1dHRvbjIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpblwiKVxyXG4gICAgY29uc3QgYnV0dG9uMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXBcIilcclxuICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgYnV0dG9uMSwgYnV0dG9uMilcclxuICAgIGNvbnN0IG1lbnVJdGVtMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIG51bGwsIGJ1dHRvbkNvbnRhaW5lcilcclxuICAgIGNvbnN0IG5hdmJhckVuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItZW5kXCIgfSwgbnVsbCwgbWVudUl0ZW0xKVxyXG4gICAgY29uc3QgbmF2YmFyU3RhcnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLXN0YXJ0XCIgfSlcclxuICAgIGNvbnN0IG5hdmJhck1lbnUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibmF2YmFyTWVudVwiLCBcImNsYXNzXCI6IFwibmF2YmFyLW1lbnVcIiB9LCBudWxsLCBuYXZiYXJTdGFydCwgbmF2YmFyRW5kKVxyXG5cclxuICAgIC8vIG5hdmJhci1icmFuZCAobGVmdCBzaWRlIG9mIG5hdmJhciAtIGluY2x1ZGVzIG1vYmlsZSBoYW1idXJnZXIgbWVudSlcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQyID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwicm9sZVwiOiBcImJ1dHRvblwiLCBcImNsYXNzXCI6IFwibmF2YmFyLWJ1cmdlciBidXJnZXJcIiwgXCJhcmlhLWxhYmVsXCI6IFwibWVudVwiLCBcImFyaWEtZXhwYW5kZWRcIjogXCJmYWxzZVwiLCBcImRhdGEtdGFyZ2V0XCI6IFwibmF2YmFyTWVudVwiIH0sIG51bGwsIGJ1cmdlck1lbnVTcGFuMSwgYnVyZ2VyTWVudVNwYW4yLCBidXJnZXJNZW51U3BhbjMpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIsIFwiaHJlZlwiOiBcIiNcIiB9LCBudWxsLCBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9maXJlOTBkZWcucG5nXCIsIFwid2lkdGhcIjogXCIxMTJcIiwgXCJoZWlnaHRcIjogXCIyOFwiIH0pKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1icmFuZFwiIH0sIG51bGwsIG5hdmJhckJyYW5kQ2hpbGQxLCBuYXZiYXJCcmFuZENoaWxkMik7XHJcblxyXG4gICAgLy8gbmF2IChwYXJlbnQgbmF2IEhUTUwgZWxlbWVudClcclxuICAgIGNvbnN0IG5hdiA9IGVsQnVpbGRlcihcIm5hdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXJcIiwgXCJyb2xlXCI6IFwibmF2aWdhdGlvblwiLCBcImFyaWEtbGFiZWxcIjogXCJtYWluIG5hdmlnYXRpb25cIiB9LCBudWxsLCBuYXZiYXJCcmFuZCwgbmF2YmFyTWVudSk7XHJcblxyXG4gICAgLy8gaWYgbG9nZ2VkIGluLCBhcHBlbmQgYWRkaXRpb25hbCBtZW51IG9wdGlvbnMgdG8gbmF2YmFyIGFuZCByZW1vdmUgc2lnbnVwL2xvZ2luIGJ1dHRvbnNcclxuICAgIGlmIChsb2dnZWRJbkJvb2xlYW4pIHtcclxuICAgICAgLy8gcmVtb3ZlIGxvZyBpbiBhbmQgc2lnbiB1cCBidXR0b25zXHJcbiAgICAgIGNvbnN0IHNpZ251cCA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdO1xyXG4gICAgICBjb25zdCBsb2dpbiA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzFdO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQoc2lnbnVwKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvZ2luKTtcclxuICAgICAgLy8gYWRkIGxvZ291dCBidXR0b25cclxuICAgICAgY29uc3QgYnV0dG9uMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ291dFwiKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbjMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgbmV3IG1lbnUgaXRlbXMgZm9yIHVzZXJcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIlByb2ZpbGVcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJHYW1lcGxheVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkhlYXRtYXBzXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW00ID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiTGVhZGVyYm9hcmRcIik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0yKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMyk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gbmF2YmFyXHJcbiAgICB0aGlzLm5hdmJhckV2ZW50TWFuYWdlcihuYXYpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlTmF2LmFwcGVuZENoaWxkKG5hdik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpbkNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9nb3V0Q2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByb2ZpbGVDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZ2FtZXBsYXlDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGVhdG1hcHNDbGlja2VkLCBldmVudCk7XHJcbiAgfSxcclxuXHJcbiAgbG9naW5DbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dpblwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9naW5Gb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAuc2lnbnVwRm9ybSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ291dENsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ291dFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9nb3V0VXNlcigpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHByb2ZpbGVDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJQcm9maWxlXCIpIHtcclxuICAgICAgcHJvZmlsZS5sb2FkUHJvZmlsZSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiR2FtZXBsYXlcIikge1xyXG4gICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgaGVhdG1hcHNDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJIZWF0bWFwc1wiKSB7XHJcbiAgICAgIGhlYXRtYXBzLmxvYWRIZWF0bWFwQ29udGFpbmVycygpO1xyXG4gICAgICBoZWF0bWFwRGF0YS5oYW5kbGVCYWxsU3BlZWRHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgICAgaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5hdmJhclxyXG5cclxuLypcclxuICBCdWxtYSBuYXZiYXIgc3RydWN0dXJlOlxyXG4gIDxuYXY+XHJcbiAgICA8bmF2YmFyLWJyYW5kPlxyXG4gICAgICA8bmF2YmFyLWJ1cmdlcj4gKG9wdGlvbmFsKVxyXG4gICAgPC9uYXZiYXItYnJhbmQ+XHJcbiAgICA8bmF2YmFyLW1lbnU+XHJcbiAgICAgIDxuYXZiYXItc3RhcnQ+XHJcbiAgICAgIDwvbmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8bmF2YmFyLWVuZD5cclxuICAgICAgPC9uYXZiYXItZW5kPlxyXG4gICAgPC9uYXZiYXItbWVudT5cclxuICA8L25hdj5cclxuKi8iLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IHByb2ZpbGUgPSB7XHJcblxyXG4gIGxvYWRQcm9maWxlKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYWN0aXZlVXNlcklkKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlUGljID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvb2N0YW5lLmpwZ1wiLCBcImNsYXNzXCI6IFwiXCIgfSlcclxuICAgICAgY29uc3QgbmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb25cIiB9LCBgTmFtZTogJHt1c2VyLm5hbWV9YClcclxuICAgICAgY29uc3QgdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYFVzZXJuYW1lOiAke3VzZXIudXNlcm5hbWV9YClcclxuICAgICAgY29uc3QgcGxheWVyUHJvZmlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJwbGF5ZXJQcm9maWxlXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXJcIiB9LCBudWxsLCBwcm9maWxlUGljLCBuYW1lLCB1c2VybmFtZSlcclxuICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChwbGF5ZXJQcm9maWxlKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwcm9maWxlIiwiY2xhc3Mgc2hvdE9uR29hbCB7XHJcbiAgc2V0IGZpZWxkWChmaWVsZFgpIHtcclxuICAgIHRoaXMuX2ZpZWxkWCA9IGZpZWxkWFxyXG4gIH1cclxuICBzZXQgZmllbGRZKGZpZWxkWSkge1xyXG4gICAgdGhpcy5fZmllbGRZID0gZmllbGRZXHJcbiAgfVxyXG4gIHNldCBnb2FsWChnb2FsWCkge1xyXG4gICAgdGhpcy5fZ29hbFggPSBnb2FsWFxyXG4gIH1cclxuICBzZXQgZ29hbFkoZ29hbFkpIHtcclxuICAgIHRoaXMuX2dvYWxZID0gZ29hbFlcclxuICB9XHJcbiAgc2V0IGFlcmlhbChhZXJpYWxCb29sZWFuKSB7XHJcbiAgICB0aGlzLl9hZXJpYWwgPSBhZXJpYWxCb29sZWFuXHJcbiAgfVxyXG4gIHNldCBiYWxsU3BlZWQoYmFsbFNwZWVkKSB7XHJcbiAgICB0aGlzLmJhbGxfc3BlZWQgPSBiYWxsU3BlZWRcclxuICB9XHJcbiAgc2V0IHRpbWVTdGFtcChkYXRlT2JqKSB7XHJcbiAgICB0aGlzLl90aW1lU3RhbXAgPSBkYXRlT2JqXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90T25Hb2FsIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90T25Hb2FsIGZyb20gXCIuL3Nob3RDbGFzc1wiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiO1xyXG5cclxubGV0IHNob3RDb3VudGVyID0gMDtcclxubGV0IGVkaXRpbmdTaG90ID0gZmFsc2U7IC8vZWRpdGluZyBzaG90IGlzIHVzZWQgZm9yIGJvdGggbmV3IGFuZCBvbGQgc2hvdHNcclxubGV0IHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbmxldCBzaG90QXJyYXkgPSBbXTsgLy8gcmVzZXQgd2hlbiBnYW1lIGlzIHNhdmVkXHJcbi8vIGdsb2JhbCB2YXJzIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdE9iajtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWDtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWTtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxYO1xyXG5sZXQgcHJldmlvdXNTaG90R29hbFk7XHJcbi8vIGdsb2JhbCB2YXIgdXNlZCB3aGVuIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSAodG8gZGV0ZXJtaW5lIGlmIG5ldyBzaG90cyB3ZXJlIGFkZGVkIGZvciBQT1NUKVxyXG5sZXQgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5O1xyXG5cclxuY29uc3Qgc2hvdERhdGEgPSB7XHJcblxyXG4gIHJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gZ2FtZXBsYXkgaXMgY2xpY2tlZCBvbiB0aGUgbmF2YmFyIGFuZCB3aGVuIGEgZ2FtZSBpcyBzYXZlZCwgaW4gb3JkZXIgdG8gcHJldmVudCBidWdzIHdpdGggcHJldmlvdXNseSBjcmVhdGVkIHNob3RzXHJcbiAgICBzaG90Q291bnRlciA9IDA7XHJcbiAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHNob3RBcnJheSA9IFtdO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheSA9IHVuZGVmaW5lZDtcclxuICB9LFxyXG5cclxuICBjcmVhdGVOZXdTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBzaG90T2JqID0gbmV3IHNob3RPbkdvYWw7XHJcbiAgICBzaG90T2JqLnRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XHJcblxyXG4gICAgLy8gcHJldmVudCB1c2VyIGZyb20gc2VsZWN0aW5nIGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyh0cnVlKTtcclxuXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBmaWVsZEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuXHJcbiAgICAvLyBhY3RpdmF0ZSBjbGljayBmdW5jdGlvbmFsaXR5IGFuZCBjb25kaXRpb25hbCBzdGF0ZW1lbnRzIG9uIGJvdGggZmllbGQgYW5kIGdvYWwgaW1hZ2VzXHJcbiAgfSxcclxuXHJcbiAgZ2V0Q2xpY2tDb29yZHMoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBnZXRzIHRoZSByZWxhdGl2ZSB4IGFuZCB5IG9mIHRoZSBjbGljayB3aXRoaW4gdGhlIGZpZWxkIGltYWdlIGNvbnRhaW5lclxyXG4gICAgLy8gYW5kIHRoZW4gY2FsbHMgdGhlIGZ1bmN0aW9uIHRoYXQgYXBwZW5kcyBhIG1hcmtlciBvbiB0aGUgcGFnZVxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lcjtcclxuICAgIGlmIChlLnRhcmdldC5pZCA9PT0gXCJmaWVsZC1pbWdcIikge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIH1cclxuICAgIC8vIG9mZnNldFggYW5kIFkgYXJlIHRoZSB4IGFuZCB5IGNvb3JkaW5hdGVzIChwaXhlbHMpIG9mIHRoZSBjbGljayBpbiB0aGUgY29udGFpbmVyXHJcbiAgICAvLyB0aGUgZXhwcmVzc2lvbnMgZGl2aWRlIHRoZSBjbGljayB4IGFuZCB5IGJ5IHRoZSBwYXJlbnQgZnVsbCB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICBjb25zdCB4Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRYIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKVxyXG4gICAgY29uc3QgeUNvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4Q29vcmRSZWxhdGl2ZSwgeUNvb3JkUmVsYXRpdmUsIHBhcmVudENvbnRhaW5lcilcclxuICB9LFxyXG5cclxuICBtYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcikge1xyXG4gICAgbGV0IG1hcmtlcklkO1xyXG4gICAgaWYgKHBhcmVudENvbnRhaW5lci5pZCA9PT0gXCJmaWVsZC1pbWctcGFyZW50XCIpIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWZpZWxkXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBtYXJrZXJJZCA9IFwic2hvdC1tYXJrZXItZ29hbFwiO1xyXG4gICAgfVxyXG4gICAgLy8gYWRqdXN0IGZvciA1MCUgb2Ygd2lkdGggYW5kIGhlaWdodCBvZiBtYXJrZXIgc28gaXQncyBjZW50ZXJlZCBhYm91dCBtb3VzZSBwb2ludGVyXHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWCA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWSA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3MgTk9UIGFscmVhZHkgYSBtYXJrZXIsIHRoZW4gbWFrZSBvbmUgYW5kIHBsYWNlIGl0XHJcbiAgICBpZiAoIXBhcmVudENvbnRhaW5lci5jb250YWlucyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCkpKSB7XHJcbiAgICAgIHRoaXMuZ2VuZXJhdGVNYXJrZXIocGFyZW50Q29udGFpbmVyLCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZLCBtYXJrZXJJZCwgeCwgeSk7XHJcbiAgICAgIC8vIGVsc2UgbW92ZSB0aGUgZXhpc3RpbmcgbWFya2VyIHRvIHRoZSBuZXcgcG9zaXRpb25cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubW92ZU1hcmtlcihtYXJrZXJJZCwgeCwgeSwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSk7XHJcbiAgICB9XHJcbiAgICAvLyBzYXZlIGNvb3JkaW5hdGVzIHRvIG9iamVjdFxyXG4gICAgdGhpcy5hZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KVxyXG4gIH0sXHJcblxyXG4gIGdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpIHtcclxuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBkaXYuaWQgPSBtYXJrZXJJZDtcclxuICAgIGRpdi5zdHlsZS53aWR0aCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwibGlnaHRncmVlblwiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCI1MCVcIjtcclxuICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgIGRpdi5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgZGl2LnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpO1xyXG4gIH0sXHJcblxyXG4gIG1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpIHtcclxuICAgIGNvbnN0IGN1cnJlbnRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCk7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICB9LFxyXG5cclxuICBhZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHVwZGF0ZXMgdGhlIGluc3RhbmNlIG9mIHNob3RPbkdvYWwgY2xhc3MgdG8gcmVjb3JkIGNsaWNrIGNvb3JkaW5hdGVzXHJcbiAgICAvLyBpZiBhIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIGFwcGVuZCB0aGUgY29vcmRpbmF0ZXMgdG8gdGhlIG9iamVjdCBpbiBxdWVzdGlvblxyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgLy8gdXNlIGdsb2JhbCB2YXJzIGluc3RlYWQgb2YgdXBkYXRpbmcgb2JqZWN0IGRpcmVjdGx5IGhlcmUgdG8gcHJldmVudCBhY2NpZGVudGFsIGVkaXRpbmcgb2YgbWFya2VyIHdpdGhvdXQgY2xpY2tpbmcgXCJzYXZlIHNob3RcIlxyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIG90aGVyd2lzZSwgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBzbyBhcHBlbmQgY29vcmRpbmF0ZXMgdG8gdGhlIG5ldyBvYmplY3RcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaG90T2JqLmdvYWxYID0geDtcclxuICAgICAgICBzaG90T2JqLmdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbFNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBpZiAoZmllbGRNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdvYWxNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZSBjbGljayBsaXN0ZW5lcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIC8vIGNsZWFyIGZpZWxkIGFuZCBnb2FsIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICAvLyBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gc2F2ZSBjb3JyZWN0IG9iamVjdCAoaS5lLiBzaG90IGJlaW5nIGVkaXRlZCB2cy4gbmV3IHNob3QpXHJcbiAgICAgIC8vIGlmIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHByZXZpb3VzU2hvdE9iaiB3aWxsIG5vdCBiZSB1bmRlZmluZWRcclxuICAgICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRYID0gcHJldmlvdXNTaG90RmllbGRYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRZID0gcHJldmlvdXNTaG90RmllbGRZO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFggPSBwcmV2aW91c1Nob3RHb2FsWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxZID0gcHJldmlvdXNTaG90R29hbFk7XHJcbiAgICAgICAgLy8gZWxzZSBzYXZlIHRvIG5ldyBpbnN0YW5jZSBvZiBjbGFzcyBhbmQgYXBwZW5kIGJ1dHRvbiB0byBwYWdlIHdpdGggY29ycmVjdCBJRCBmb3IgZWRpdGluZ1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHNob3RPYmouYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBzaG90T2JqLmFlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgc2hvdE9iai5iYWxsU3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBzaG90QXJyYXkucHVzaChzaG90T2JqKTtcclxuICAgICAgICAvLyBhcHBlbmQgbmV3IGJ1dHRvblxyXG4gICAgICAgIHNob3RDb3VudGVyKys7XHJcbiAgICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtzaG90Q291bnRlcn1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke3Nob3RDb3VudGVyfWApO1xyXG4gICAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtzaG90Q291bnRlcn1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgICAgfVxyXG4gICAgICAvL1RPRE86IGFkZCBjb25kaXRpb24gdG8gcHJldmVudCBibGFuayBlbnRyaWVzIGFuZCBtaXNzaW5nIGNvb3JkaW5hdGVzXHJcblxyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzcyAobWF0dGVycyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQpXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWQgKG1hdHRlcnMgaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkKVxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2F2ZWRTaG90KGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVmZXJlbmNlcyB0aGUgc2hvdEFycmF5IHRvIGdldCBhIHNob3Qgb2JqZWN0IHRoYXQgbWF0Y2hlcyB0aGUgc2hvdCMgYnV0dG9uIGNsaWNrZWQgKGUuZy4gc2hvdCAyIGJ1dHRvbiA9IGluZGV4IDEgb2YgdGhlIHNob3RBcnJheSlcclxuICAgIC8vIHRoZSBmdW5jdGlvbiAoYW5kIGl0cyBhc3NvY2lhdGVkIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gb3RoZXIgbG9jYWwgZnVuY3Rpb25zKSBoYXMgdGhlc2UgYmFzaWMgcmVxdWlyZW1lbnRzOlxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBjbGljayBsaXN0ZW5lcnMgb24gaW1hZ2VzXHJcbiAgICAvLyByZXZpdmUgYSBzYXZlZCBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgZm9yIGVkaXRpbmcgc2hvdCBjb29yZGluYXRlcywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbFxyXG4gICAgLy8gcmVuZGVyIG1hcmtlcnMgZm9yIGV4aXN0aW5nIGNvb3JkaW5hdGVzIG9uIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBzYXZlIGVkaXRzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIGNhbmNlbCBlZGl0c1xyXG4gICAgLy8gdGhlIGRhdGEgaXMgcmVuZGVyZWQgb24gdGhlIHBhZ2UgYW5kIGNhbiBiZSBzYXZlZCAob3ZlcndyaXR0ZW4pIGJ5IHVzaW5nIHRoZSBcInNhdmUgc2hvdFwiIGJ1dHRvbiBvciBjYW5jZWxlZCBieSBjbGlja2luZyB0aGUgXCJjYW5jZWwgc2hvdFwiIGJ1dHRvblxyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IG5ldyBzaG90IGJ1dHRvbiBmcm9tIGJlaW5nIGNsaWNrZWRcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIC8vIGFsbG93IGNhbmNlbCBhbmQgc2F2ZWQgYnV0dG9ucyB0byBiZSBjbGlja2VkXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICAvLyBnZXQgSUQgb2Ygc2hvdCMgYnRuIGNsaWNrZWQgYW5kIGFjY2VzcyBzaG90QXJyYXkgYXQgW2J0bklEIC0gMV1cclxuICAgIGxldCBidG5JZCA9IGUudGFyZ2V0LmlkLnNsaWNlKDUpO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gc2hvdEFycmF5W2J0bklkIC0gMV07XHJcbiAgICAvLyByZW5kZXIgYmFsbCBzcGVlZCBhbmQgYWVyaWFsIGRyb3Bkb3duIGZvciB0aGUgc2hvdFxyXG4gICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZDtcclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9PT0gdHJ1ZSkgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJBZXJpYWxcIjsgfSBlbHNlIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjsgfVxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBmaWVsZCBhbmQgZ29hbFxyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIC8vIHJlbmRlciBzaG90IG1hcmtlciBvbiBmaWVsZFxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IHggPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHkgPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcbiAgICAvLyByZW5kZXIgZ29hbCBtYXJrZXIgb24gZmllbGRcclxuICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpXHJcbiAgICB4ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpO1xyXG4gICAgeSA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG5cclxuICB9LFxyXG5cclxuICBkaXNhYmxlRWRpdFNob3RidXR0b25zKGRpc2FibGVPck5vdCkge1xyXG4gICAgLy8gZm9yIGVhY2ggYnV0dG9uIGFmdGVyIFwiTmV3IFNob3RcIiwgXCJTYXZlIFNob3RcIiwgYW5kIFwiQ2FuY2VsIFNob3RcIiBkaXNhYmxlIHRoZSBidXR0b25zIGlmIHRoZSB1c2VyIGlzIGNyZWF0aW5nIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IHRydWUpIG9yIGVuYWJsZSB0aGVtIG9uIHNhdmUvY2FuY2VsIG9mIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IGZhbHNlKVxyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgbGV0IGVkaXRCdG47XHJcbiAgICBsZXQgbGVuZ3RoID0gc2hvdEJ0bkNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aDtcclxuICAgIGZvciAobGV0IGkgPSAzOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWRpdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aSAtIDJ9YCk7XHJcbiAgICAgIGVkaXRCdG4uZGlzYWJsZWQgPSBkaXNhYmxlT3JOb3Q7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGdldFNob3RPYmplY3RzRm9yU2F2aW5nKCkge1xyXG4gICAgLy8gcHJvdmlkZXMgYXJyYXkgZm9yIHVzZSBpbiBnYW1lRGF0YS5qcyAod2hlbiBzYXZpbmcgYSBuZXcgZ2FtZSwgbm90IHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lKVxyXG4gICAgcmV0dXJuIHNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsTnVtT2ZTaG90cygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGluaXRpYWwgbnVtYmVyIG9mIHNob3RzIHRoYXQgd2VyZSBzYXZlZCB0byBkYXRhYmFzZSB0byBnYW1lRGF0YS5qcyB0byBpZGVudGlmeSBhbiBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZFxyXG4gICAgcmV0dXJuIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICByZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZXF1ZXN0cyB0aGUgYXJyYXkgb2Ygc2hvdHMgZnJvbSB0aGUgcHJldmlvdXMgc2F2ZWQgZ2FtZSwgc2V0cyBpdCBhcyBzaG90QXJyYXksIGFuZCByZW5kZXJzIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgLy8gZ2V0IHNhdmVkIGdhbWUgd2l0aCBzaG90cyBlbWJlZGRlZCBhcyBhcnJheVxyXG4gICAgbGV0IHNhdmVkR2FtZU9iaiA9IGdhbWVEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKTtcclxuICAgIC8vIGNyZWF0ZSBzaG90QXJyYXkgd2l0aCBmb3JtYXQgcmVxdWlyZWQgYnkgbG9jYWwgZnVuY3Rpb25zXHJcbiAgICBsZXQgc2F2ZWRTaG90T2JqXHJcbiAgICBzYXZlZEdhbWVPYmouc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc2F2ZWRTaG90T2JqID0gbmV3IHNob3RPbkdvYWxcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWCA9IHNob3QuZmllbGRYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZmllbGRZID0gc2hvdC5maWVsZFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWCA9IHNob3QuZ29hbFg7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWSA9IHNob3QuZ29hbFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5hZXJpYWwgPSBzaG90LmFlcmlhbDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmJhbGxfc3BlZWQgPSBzaG90LmJhbGxfc3BlZWQudG9TdHJpbmcoKTtcclxuICAgICAgc2F2ZWRTaG90T2JqLnRpbWVTdGFtcCA9IHNob3QudGltZVN0YW1wXHJcbiAgICAgIHNhdmVkU2hvdE9iai5pZCA9IHNob3QuaWRcclxuICAgICAgc2hvdEFycmF5LnB1c2goc2F2ZWRTaG90T2JqKTtcclxuICAgIH0pXHJcblxyXG4gICAgY29uc29sZS5sb2coc2hvdEFycmF5KTtcclxuICAgIHNob3RBcnJheS5mb3JFYWNoKChzaG90LCBpZHgpID0+IHtcclxuICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtpZHggKyAxfWAsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtbGlua1wiIH0sIGBTaG90ICR7aWR4ICsgMX1gKTtcclxuICAgICAgc2hvdEJ0bkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdTaG90QnRuKTtcclxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpZHggKyAxfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5yZW5kZXJTYXZlZFNob3QpO1xyXG4gICAgfSk7XHJcbiAgICBzaG90Q291bnRlciA9IHNob3RBcnJheS5sZW5ndGg7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3REYXRhIl19
