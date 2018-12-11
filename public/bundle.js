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
    feedbackResults.now = now; // get range of dates on games (max and min)

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

      _heatmapData.default.clearHeatmapRepaintInterval();
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

      _heatmapData.default.clearHeatmapRepaintInterval();
    }
  },

  heatmapsClicked(e) {
    if (e.target.textContent === "Heatmaps") {
      _heatmaps.default.loadHeatmapContainers();

      _heatmapData.default.handleBallSpeedGlobalVariables();

      _heatmapData.default.handleDateFilterGlobalVariables();

      _heatmapData.default.clearHeatmapRepaintInterval();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2RhdGVGaWx0ZXIuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwRmVlZGJhY2suanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBzLmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIiwiLi4vc2NyaXB0cy9zaG90Q2xhc3MuanMiLCIuLi9zY3JpcHRzL3Nob3REYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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IjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogaGVhdG1hcC5qcyB2Mi4wLjUgfCBKYXZhU2NyaXB0IEhlYXRtYXAgTGlicmFyeVxuICpcbiAqIENvcHlyaWdodCAyMDA4LTIwMTYgUGF0cmljayBXaWVkIDxoZWF0bWFwanNAcGF0cmljay13aWVkLmF0PiAtIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIE1JVCBhbmQgQmVlcndhcmUgbGljZW5zZSBcbiAqXG4gKiA6OiAyMDE2LTA5LTA1IDAxOjE2XG4gKi9cbjsoZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGZhY3RvcnkpIHtcblxuICAvLyBTdXBwb3J0cyBVTUQuIEFNRCwgQ29tbW9uSlMvTm9kZS5qcyBhbmQgYnJvd3NlciBjb250ZXh0XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dFtuYW1lXSA9IGZhY3RvcnkoKTtcbiAgfVxuXG59KShcImgzMzdcIiwgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4vLyBIZWF0bWFwIENvbmZpZyBzdG9yZXMgZGVmYXVsdCB2YWx1ZXMgYW5kIHdpbGwgYmUgbWVyZ2VkIHdpdGggaW5zdGFuY2UgY29uZmlnXG52YXIgSGVhdG1hcENvbmZpZyA9IHtcbiAgZGVmYXVsdFJhZGl1czogNDAsXG4gIGRlZmF1bHRSZW5kZXJlcjogJ2NhbnZhczJkJyxcbiAgZGVmYXVsdEdyYWRpZW50OiB7IDAuMjU6IFwicmdiKDAsMCwyNTUpXCIsIDAuNTU6IFwicmdiKDAsMjU1LDApXCIsIDAuODU6IFwieWVsbG93XCIsIDEuMDogXCJyZ2IoMjU1LDAsMClcIn0sXG4gIGRlZmF1bHRNYXhPcGFjaXR5OiAxLFxuICBkZWZhdWx0TWluT3BhY2l0eTogMCxcbiAgZGVmYXVsdEJsdXI6IC44NSxcbiAgZGVmYXVsdFhGaWVsZDogJ3gnLFxuICBkZWZhdWx0WUZpZWxkOiAneScsXG4gIGRlZmF1bHRWYWx1ZUZpZWxkOiAndmFsdWUnLCBcbiAgcGx1Z2luczoge31cbn07XG52YXIgU3RvcmUgPSAoZnVuY3Rpb24gU3RvcmVDbG9zdXJlKCkge1xuXG4gIHZhciBTdG9yZSA9IGZ1bmN0aW9uIFN0b3JlKGNvbmZpZykge1xuICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0ge307XG4gICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgIHRoaXMuX3JhZGkgPSBbXTtcbiAgICB0aGlzLl9taW4gPSAxMDtcbiAgICB0aGlzLl9tYXggPSAxO1xuICAgIHRoaXMuX3hGaWVsZCA9IGNvbmZpZ1sneEZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRYRmllbGQ7XG4gICAgdGhpcy5feUZpZWxkID0gY29uZmlnWyd5RmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFlGaWVsZDtcbiAgICB0aGlzLl92YWx1ZUZpZWxkID0gY29uZmlnWyd2YWx1ZUZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRWYWx1ZUZpZWxkO1xuXG4gICAgaWYgKGNvbmZpZ1tcInJhZGl1c1wiXSkge1xuICAgICAgdGhpcy5fY2ZnUmFkaXVzID0gY29uZmlnW1wicmFkaXVzXCJdO1xuICAgIH1cbiAgfTtcblxuICB2YXIgZGVmYXVsdFJhZGl1cyA9IEhlYXRtYXBDb25maWcuZGVmYXVsdFJhZGl1cztcblxuICBTdG9yZS5wcm90b3R5cGUgPSB7XG4gICAgLy8gd2hlbiBmb3JjZVJlbmRlciA9IGZhbHNlIC0+IGNhbGxlZCBmcm9tIHNldERhdGEsIG9taXRzIHJlbmRlcmFsbCBldmVudFxuICAgIF9vcmdhbmlzZURhdGE6IGZ1bmN0aW9uKGRhdGFQb2ludCwgZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgdmFyIHggPSBkYXRhUG9pbnRbdGhpcy5feEZpZWxkXTtcbiAgICAgICAgdmFyIHkgPSBkYXRhUG9pbnRbdGhpcy5feUZpZWxkXTtcbiAgICAgICAgdmFyIHJhZGkgPSB0aGlzLl9yYWRpO1xuICAgICAgICB2YXIgc3RvcmUgPSB0aGlzLl9kYXRhO1xuICAgICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4O1xuICAgICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhUG9pbnRbdGhpcy5fdmFsdWVGaWVsZF0gfHwgMTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IGRhdGFQb2ludC5yYWRpdXMgfHwgdGhpcy5fY2ZnUmFkaXVzIHx8IGRlZmF1bHRSYWRpdXM7XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XSkge1xuICAgICAgICAgIHN0b3JlW3hdID0gW107XG4gICAgICAgICAgcmFkaVt4XSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XVt5XSkge1xuICAgICAgICAgIHN0b3JlW3hdW3ldID0gdmFsdWU7XG4gICAgICAgICAgcmFkaVt4XVt5XSA9IHJhZGl1cztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9yZVt4XVt5XSArPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RvcmVkVmFsID0gc3RvcmVbeF1beV07XG5cbiAgICAgICAgaWYgKHN0b3JlZFZhbCA+IG1heCkge1xuICAgICAgICAgIGlmICghZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21heCA9IHN0b3JlZFZhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXREYXRhTWF4KHN0b3JlZFZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yZWRWYWwgPCBtaW4pIHtcbiAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9taW4gPSBzdG9yZWRWYWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YU1pbihzdG9yZWRWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICB4OiB4LCBcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsIFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpdXMsXG4gICAgICAgICAgICBtaW46IG1pbixcbiAgICAgICAgICAgIG1heDogbWF4IFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIF91bk9yZ2FuaXplRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdW5vcmdhbml6ZWREYXRhID0gW107XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG4gICAgICB2YXIgcmFkaSA9IHRoaXMuX3JhZGk7XG5cbiAgICAgIGZvciAodmFyIHggaW4gZGF0YSkge1xuICAgICAgICBmb3IgKHZhciB5IGluIGRhdGFbeF0pIHtcblxuICAgICAgICAgIHVub3JnYW5pemVkRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpW3hdW3ldLFxuICAgICAgICAgICAgdmFsdWU6IGRhdGFbeF1beV1cbiAgICAgICAgICB9KTtcblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgIGRhdGE6IHVub3JnYW5pemVkRGF0YVxuICAgICAgfTtcbiAgICB9LFxuICAgIF9vbkV4dHJlbWFDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgnZXh0cmVtYWNoYW5nZScsIHtcbiAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgIG1heDogdGhpcy5fbWF4XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFkZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGFyZ3VtZW50c1swXS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBkYXRhQXJyID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB2YXIgZGF0YUxlbiA9IGRhdGFBcnIubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoZGF0YUxlbi0tKSB7XG4gICAgICAgICAgdGhpcy5hZGREYXRhLmNhbGwodGhpcywgZGF0YUFycltkYXRhTGVuXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCB0byBzdG9yZSAgXG4gICAgICAgIHZhciBvcmdhbmlzZWRFbnRyeSA9IHRoaXMuX29yZ2FuaXNlRGF0YShhcmd1bWVudHNbMF0sIHRydWUpO1xuICAgICAgICBpZiAob3JnYW5pc2VkRW50cnkpIHtcbiAgICAgICAgICAvLyBpZiBpdCdzIHRoZSBmaXJzdCBkYXRhcG9pbnQgaW5pdGlhbGl6ZSB0aGUgZXh0cmVtYXMgd2l0aCBpdFxuICAgICAgICAgIGlmICh0aGlzLl9kYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fbWluID0gdGhpcy5fbWF4ID0gb3JnYW5pc2VkRW50cnkudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcnBhcnRpYWwnLCB7XG4gICAgICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICAgICAgZGF0YTogW29yZ2FuaXNlZEVudHJ5XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBkYXRhUG9pbnRzID0gZGF0YS5kYXRhO1xuICAgICAgdmFyIHBvaW50c0xlbiA9IGRhdGFQb2ludHMubGVuZ3RoO1xuXG5cbiAgICAgIC8vIHJlc2V0IGRhdGEgYXJyYXlzXG4gICAgICB0aGlzLl9kYXRhID0gW107XG4gICAgICB0aGlzLl9yYWRpID0gW107XG5cbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwb2ludHNMZW47IGkrKykge1xuICAgICAgICB0aGlzLl9vcmdhbmlzZURhdGEoZGF0YVBvaW50c1tpXSwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWF4ID0gZGF0YS5tYXg7XG4gICAgICB0aGlzLl9taW4gPSBkYXRhLm1pbiB8fCAwO1xuICAgICAgXG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUT0RPOiBpbXBsZW1lbnRcbiAgICB9LFxuICAgIHNldERhdGFNYXg6IGZ1bmN0aW9uKG1heCkge1xuICAgICAgdGhpcy5fbWF4ID0gbWF4O1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKG1pbikge1xuICAgICAgdGhpcy5fbWluID0gbWluO1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldENvb3JkaW5hdG9yOiBmdW5jdGlvbihjb29yZGluYXRvcikge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IgPSBjb29yZGluYXRvcjtcbiAgICB9LFxuICAgIF9nZXRJbnRlcm5hbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHsgXG4gICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICBtaW46IHRoaXMuX21pbiwgXG4gICAgICAgIGRhdGE6IHRoaXMuX2RhdGEsXG4gICAgICAgIHJhZGk6IHRoaXMuX3JhZGkgXG4gICAgICB9O1xuICAgIH0sXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdW5Pcmdhbml6ZURhdGEoKTtcbiAgICB9LyosXG5cbiAgICAgIFRPRE86IHJldGhpbmsuXG5cbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHJhZGl1cyA9IDEwMDtcbiAgICAgIHZhciB4ID0gcG9pbnQueDtcbiAgICAgIHZhciB5ID0gcG9pbnQueTtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgICAgaWYgKGRhdGFbeF0gJiYgZGF0YVt4XVt5XSkge1xuICAgICAgICByZXR1cm4gZGF0YVt4XVt5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgLy8gcmFkaWFsIHNlYXJjaCBmb3IgZGF0YXBvaW50cyBiYXNlZCBvbiBkZWZhdWx0IHJhZGl1c1xuICAgICAgICBmb3IodmFyIGRpc3RhbmNlID0gMTsgZGlzdGFuY2UgPCByYWRpdXM7IGRpc3RhbmNlKyspIHtcbiAgICAgICAgICB2YXIgbmVpZ2hib3JzID0gZGlzdGFuY2UgKiAyICsxO1xuICAgICAgICAgIHZhciBzdGFydFggPSB4IC0gZGlzdGFuY2U7XG4gICAgICAgICAgdmFyIHN0YXJ0WSA9IHkgLSBkaXN0YW5jZTtcblxuICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgbyA9IDA7IG8gPCBuZWlnaGJvcnM7IG8rKykge1xuICAgICAgICAgICAgICBpZiAoKGkgPT0gMCB8fCBpID09IG5laWdoYm9ycy0xKSB8fCAobyA9PSAwIHx8IG8gPT0gbmVpZ2hib3JzLTEpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFbc3RhcnRZK2ldICYmIGRhdGFbc3RhcnRZK2ldW3N0YXJ0WCtvXSkge1xuICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goZGF0YVtzdGFydFkraV1bc3RhcnRYK29dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCB2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSovXG4gIH07XG5cblxuICByZXR1cm4gU3RvcmU7XG59KSgpO1xuXG52YXIgQ2FudmFzMmRSZW5kZXJlciA9IChmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyQ2xvc3VyZSgpIHtcblxuICB2YXIgX2dldENvbG9yUGFsZXR0ZSA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBncmFkaWVudENvbmZpZyA9IGNvbmZpZy5ncmFkaWVudCB8fCBjb25maWcuZGVmYXVsdEdyYWRpZW50O1xuICAgIHZhciBwYWxldHRlQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHBhbGV0dGVDdHggPSBwYWxldHRlQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBwYWxldHRlQ2FudmFzLndpZHRoID0gMjU2O1xuICAgIHBhbGV0dGVDYW52YXMuaGVpZ2h0ID0gMTtcblxuICAgIHZhciBncmFkaWVudCA9IHBhbGV0dGVDdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMjU2LCAxKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZ3JhZGllbnRDb25maWcpIHtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChrZXksIGdyYWRpZW50Q29uZmlnW2tleV0pO1xuICAgIH1cblxuICAgIHBhbGV0dGVDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgcGFsZXR0ZUN0eC5maWxsUmVjdCgwLCAwLCAyNTYsIDEpO1xuXG4gICAgcmV0dXJuIHBhbGV0dGVDdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIDI1NiwgMSkuZGF0YTtcbiAgfTtcblxuICB2YXIgX2dldFBvaW50VGVtcGxhdGUgPSBmdW5jdGlvbihyYWRpdXMsIGJsdXJGYWN0b3IpIHtcbiAgICB2YXIgdHBsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHRwbEN0eCA9IHRwbENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHZhciB4ID0gcmFkaXVzO1xuICAgIHZhciB5ID0gcmFkaXVzO1xuICAgIHRwbENhbnZhcy53aWR0aCA9IHRwbENhbnZhcy5oZWlnaHQgPSByYWRpdXMqMjtcblxuICAgIGlmIChibHVyRmFjdG9yID09IDEpIHtcbiAgICAgIHRwbEN0eC5iZWdpblBhdGgoKTtcbiAgICAgIHRwbEN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgdHBsQ3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEpJztcbiAgICAgIHRwbEN0eC5maWxsKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBncmFkaWVudCA9IHRwbEN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudCh4LCB5LCByYWRpdXMqYmx1ckZhY3RvciwgeCwgeSwgcmFkaXVzKTtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLDAsMCwxKScpO1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDApJyk7XG4gICAgICB0cGxDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICB0cGxDdHguZmlsbFJlY3QoMCwgMCwgMipyYWRpdXMsIDIqcmFkaXVzKTtcbiAgICB9XG5cblxuXG4gICAgcmV0dXJuIHRwbENhbnZhcztcbiAgfTtcblxuICB2YXIgX3ByZXBhcmVEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZW5kZXJEYXRhID0gW107XG4gICAgdmFyIG1pbiA9IGRhdGEubWluO1xuICAgIHZhciBtYXggPSBkYXRhLm1heDtcbiAgICB2YXIgcmFkaSA9IGRhdGEucmFkaTtcbiAgICB2YXIgZGF0YSA9IGRhdGEuZGF0YTtcblxuICAgIHZhciB4VmFsdWVzID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gICAgdmFyIHhWYWx1ZXNMZW4gPSB4VmFsdWVzLmxlbmd0aDtcblxuICAgIHdoaWxlKHhWYWx1ZXNMZW4tLSkge1xuICAgICAgdmFyIHhWYWx1ZSA9IHhWYWx1ZXNbeFZhbHVlc0xlbl07XG4gICAgICB2YXIgeVZhbHVlcyA9IE9iamVjdC5rZXlzKGRhdGFbeFZhbHVlXSk7XG4gICAgICB2YXIgeVZhbHVlc0xlbiA9IHlWYWx1ZXMubGVuZ3RoO1xuICAgICAgd2hpbGUoeVZhbHVlc0xlbi0tKSB7XG4gICAgICAgIHZhciB5VmFsdWUgPSB5VmFsdWVzW3lWYWx1ZXNMZW5dO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3hWYWx1ZV1beVZhbHVlXTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IHJhZGlbeFZhbHVlXVt5VmFsdWVdO1xuICAgICAgICByZW5kZXJEYXRhLnB1c2goe1xuICAgICAgICAgIHg6IHhWYWx1ZSxcbiAgICAgICAgICB5OiB5VmFsdWUsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgIHJhZGl1czogcmFkaXVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtaW46IG1pbixcbiAgICAgIG1heDogbWF4LFxuICAgICAgZGF0YTogcmVuZGVyRGF0YVxuICAgIH07XG4gIH07XG5cblxuICBmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyKGNvbmZpZykge1xuICAgIHZhciBjb250YWluZXIgPSBjb25maWcuY29udGFpbmVyO1xuICAgIHZhciBzaGFkb3dDYW52YXMgPSB0aGlzLnNoYWRvd0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcyA9IGNvbmZpZy5jYW52YXMgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHJlbmRlckJvdW5kYXJpZXMgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAwLCAxMDAwMCwgMCwgMF07XG5cbiAgICB2YXIgY29tcHV0ZWQgPSBnZXRDb21wdXRlZFN0eWxlKGNvbmZpZy5jb250YWluZXIpIHx8IHt9O1xuXG4gICAgY2FudmFzLmNsYXNzTmFtZSA9ICdoZWF0bWFwLWNhbnZhcyc7XG5cbiAgICB0aGlzLl93aWR0aCA9IGNhbnZhcy53aWR0aCA9IHNoYWRvd0NhbnZhcy53aWR0aCA9IGNvbmZpZy53aWR0aCB8fCArKGNvbXB1dGVkLndpZHRoLnJlcGxhY2UoL3B4LywnJykpO1xuICAgIHRoaXMuX2hlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSBzaGFkb3dDYW52YXMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCB8fCArKGNvbXB1dGVkLmhlaWdodC5yZXBsYWNlKC9weC8sJycpKTtcblxuICAgIHRoaXMuc2hhZG93Q3R4ID0gc2hhZG93Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIC8vIEBUT0RPOlxuICAgIC8vIGNvbmRpdGlvbmFsIHdyYXBwZXJcblxuICAgIGNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gc2hhZG93Q2FudmFzLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246YWJzb2x1dGU7bGVmdDowO3RvcDowOyc7XG5cbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgdGhpcy5fcGFsZXR0ZSA9IF9nZXRDb2xvclBhbGV0dGUoY29uZmlnKTtcbiAgICB0aGlzLl90ZW1wbGF0ZXMgPSB7fTtcblxuICAgIHRoaXMuX3NldFN0eWxlcyhjb25maWcpO1xuICB9O1xuXG4gIENhbnZhczJkUmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAgIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9kcmF3QWxwaGEoZGF0YSk7XG4gICAgICAgIHRoaXMuX2NvbG9yaXplKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZW5kZXJBbGw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIHJlc2V0IHJlbmRlciBib3VuZGFyaWVzXG4gICAgICB0aGlzLl9jbGVhcigpO1xuICAgICAgaWYgKGRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX2RyYXdBbHBoYShfcHJlcGFyZURhdGEoZGF0YSkpO1xuICAgICAgICB0aGlzLl9jb2xvcml6ZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3VwZGF0ZUdyYWRpZW50OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX3BhbGV0dGUgPSBfZ2V0Q29sb3JQYWxldHRlKGNvbmZpZyk7XG4gICAgfSxcbiAgICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgaWYgKGNvbmZpZ1snZ3JhZGllbnQnXSkge1xuICAgICAgICB0aGlzLl91cGRhdGVHcmFkaWVudChjb25maWcpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3R5bGVzKGNvbmZpZyk7XG4gICAgfSxcbiAgICBzZXREaW1lbnNpb25zOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLnNoYWRvd0NhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zaGFkb3dDYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH0sXG4gICAgX2NsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc2hhZG93Q3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICB9LFxuICAgIF9zZXRTdHlsZXM6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fYmx1ciA9IChjb25maWcuYmx1ciA9PSAwKT8wOihjb25maWcuYmx1ciB8fCBjb25maWcuZGVmYXVsdEJsdXIpO1xuXG4gICAgICBpZiAoY29uZmlnLmJhY2tncm91bmRDb2xvcikge1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb25maWcuYmFja2dyb3VuZENvbG9yO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5zaGFkb3dDYW52YXMud2lkdGggPSBjb25maWcud2lkdGggfHwgdGhpcy5fd2lkdGg7XG4gICAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNoYWRvd0NhbnZhcy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IHx8IHRoaXMuX2hlaWdodDtcblxuXG4gICAgICB0aGlzLl9vcGFjaXR5ID0gKGNvbmZpZy5vcGFjaXR5IHx8IDApICogMjU1O1xuICAgICAgdGhpcy5fbWF4T3BhY2l0eSA9IChjb25maWcubWF4T3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1heE9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fbWluT3BhY2l0eSA9IChjb25maWcubWluT3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1pbk9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fdXNlR3JhZGllbnRPcGFjaXR5ID0gISFjb25maWcudXNlR3JhZGllbnRPcGFjaXR5O1xuICAgIH0sXG4gICAgX2RyYXdBbHBoYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbiA9IGRhdGEubWluO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heCA9IGRhdGEubWF4O1xuICAgICAgdmFyIGRhdGEgPSBkYXRhLmRhdGEgfHwgW107XG4gICAgICB2YXIgZGF0YUxlbiA9IGRhdGEubGVuZ3RoO1xuICAgICAgLy8gb24gYSBwb2ludCBiYXNpcz9cbiAgICAgIHZhciBibHVyID0gMSAtIHRoaXMuX2JsdXI7XG5cbiAgICAgIHdoaWxlKGRhdGFMZW4tLSkge1xuXG4gICAgICAgIHZhciBwb2ludCA9IGRhdGFbZGF0YUxlbl07XG5cbiAgICAgICAgdmFyIHggPSBwb2ludC54O1xuICAgICAgICB2YXIgeSA9IHBvaW50Lnk7XG4gICAgICAgIHZhciByYWRpdXMgPSBwb2ludC5yYWRpdXM7XG4gICAgICAgIC8vIGlmIHZhbHVlIGlzIGJpZ2dlciB0aGFuIG1heFxuICAgICAgICAvLyB1c2UgbWF4IGFzIHZhbHVlXG4gICAgICAgIHZhciB2YWx1ZSA9IE1hdGgubWluKHBvaW50LnZhbHVlLCBtYXgpO1xuICAgICAgICB2YXIgcmVjdFggPSB4IC0gcmFkaXVzO1xuICAgICAgICB2YXIgcmVjdFkgPSB5IC0gcmFkaXVzO1xuICAgICAgICB2YXIgc2hhZG93Q3R4ID0gdGhpcy5zaGFkb3dDdHg7XG5cblxuXG5cbiAgICAgICAgdmFyIHRwbDtcbiAgICAgICAgaWYgKCF0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXSkge1xuICAgICAgICAgIHRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdID0gdHBsID0gX2dldFBvaW50VGVtcGxhdGUocmFkaXVzLCBibHVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cGwgPSB0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXTtcbiAgICAgICAgfVxuICAgICAgICAvLyB2YWx1ZSBmcm9tIG1pbmltdW0gLyB2YWx1ZSByYW5nZVxuICAgICAgICAvLyA9PiBbMCwgMV1cbiAgICAgICAgdmFyIHRlbXBsYXRlQWxwaGEgPSAodmFsdWUtbWluKS8obWF4LW1pbik7XG4gICAgICAgIC8vIHRoaXMgZml4ZXMgIzE3Njogc21hbGwgdmFsdWVzIGFyZSBub3QgdmlzaWJsZSBiZWNhdXNlIGdsb2JhbEFscGhhIDwgLjAxIGNhbm5vdCBiZSByZWFkIGZyb20gaW1hZ2VEYXRhXG4gICAgICAgIHNoYWRvd0N0eC5nbG9iYWxBbHBoYSA9IHRlbXBsYXRlQWxwaGEgPCAuMDEgPyAuMDEgOiB0ZW1wbGF0ZUFscGhhO1xuXG4gICAgICAgIHNoYWRvd0N0eC5kcmF3SW1hZ2UodHBsLCByZWN0WCwgcmVjdFkpO1xuXG4gICAgICAgIC8vIHVwZGF0ZSByZW5kZXJCb3VuZGFyaWVzXG4gICAgICAgIGlmIChyZWN0WCA8IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0gPSByZWN0WDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RZIDwgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSA9IHJlY3RZO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFggKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gPSByZWN0WCArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFkgKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gPSByZWN0WSArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cblxuICAgICAgfVxuICAgIH0sXG4gICAgX2NvbG9yaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB4ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXTtcbiAgICAgIHZhciB5ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXTtcbiAgICAgIHZhciB3aWR0aCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gLSB4O1xuICAgICAgdmFyIGhlaWdodCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gLSB5O1xuICAgICAgdmFyIG1heFdpZHRoID0gdGhpcy5fd2lkdGg7XG4gICAgICB2YXIgbWF4SGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xuICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5O1xuICAgICAgdmFyIG1heE9wYWNpdHkgPSB0aGlzLl9tYXhPcGFjaXR5O1xuICAgICAgdmFyIG1pbk9wYWNpdHkgPSB0aGlzLl9taW5PcGFjaXR5O1xuICAgICAgdmFyIHVzZUdyYWRpZW50T3BhY2l0eSA9IHRoaXMuX3VzZUdyYWRpZW50T3BhY2l0eTtcblxuICAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgIHggPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHkgPCAwKSB7XG4gICAgICAgIHkgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHggKyB3aWR0aCA+IG1heFdpZHRoKSB7XG4gICAgICAgIHdpZHRoID0gbWF4V2lkdGggLSB4O1xuICAgICAgfVxuICAgICAgaWYgKHkgKyBoZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgaGVpZ2h0ID0gbWF4SGVpZ2h0IC0geTtcbiAgICAgIH1cblxuICAgICAgdmFyIGltZyA9IHRoaXMuc2hhZG93Q3R4LmdldEltYWdlRGF0YSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIHZhciBpbWdEYXRhID0gaW1nLmRhdGE7XG4gICAgICB2YXIgbGVuID0gaW1nRGF0YS5sZW5ndGg7XG4gICAgICB2YXIgcGFsZXR0ZSA9IHRoaXMuX3BhbGV0dGU7XG5cblxuICAgICAgZm9yICh2YXIgaSA9IDM7IGkgPCBsZW47IGkrPSA0KSB7XG4gICAgICAgIHZhciBhbHBoYSA9IGltZ0RhdGFbaV07XG4gICAgICAgIHZhciBvZmZzZXQgPSBhbHBoYSAqIDQ7XG5cblxuICAgICAgICBpZiAoIW9mZnNldCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbmFsQWxwaGE7XG4gICAgICAgIGlmIChvcGFjaXR5ID4gMCkge1xuICAgICAgICAgIGZpbmFsQWxwaGEgPSBvcGFjaXR5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChhbHBoYSA8IG1heE9wYWNpdHkpIHtcbiAgICAgICAgICAgIGlmIChhbHBoYSA8IG1pbk9wYWNpdHkpIHtcbiAgICAgICAgICAgICAgZmluYWxBbHBoYSA9IG1pbk9wYWNpdHk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmaW5hbEFscGhhID0gYWxwaGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBtYXhPcGFjaXR5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGltZ0RhdGFbaS0zXSA9IHBhbGV0dGVbb2Zmc2V0XTtcbiAgICAgICAgaW1nRGF0YVtpLTJdID0gcGFsZXR0ZVtvZmZzZXQgKyAxXTtcbiAgICAgICAgaW1nRGF0YVtpLTFdID0gcGFsZXR0ZVtvZmZzZXQgKyAyXTtcbiAgICAgICAgaW1nRGF0YVtpXSA9IHVzZUdyYWRpZW50T3BhY2l0eSA/IHBhbGV0dGVbb2Zmc2V0ICsgM10gOiBmaW5hbEFscGhhO1xuXG4gICAgICB9XG5cbiAgICAgIGltZy5kYXRhID0gaW1nRGF0YTtcbiAgICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YShpbWcsIHgsIHkpO1xuXG4gICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAsIDEwMDAsIDAsIDBdO1xuXG4gICAgfSxcbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHNoYWRvd0N0eCA9IHRoaXMuc2hhZG93Q3R4O1xuICAgICAgdmFyIGltZyA9IHNoYWRvd0N0eC5nZXRJbWFnZURhdGEocG9pbnQueCwgcG9pbnQueSwgMSwgMSk7XG4gICAgICB2YXIgZGF0YSA9IGltZy5kYXRhWzNdO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heDtcbiAgICAgIHZhciBtaW4gPSB0aGlzLl9taW47XG5cbiAgICAgIHZhbHVlID0gKE1hdGguYWJzKG1heC1taW4pICogKGRhdGEvMjU1KSkgPj4gMDtcblxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgZ2V0RGF0YVVSTDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYW52YXMudG9EYXRhVVJMKCk7XG4gICAgfVxuICB9O1xuXG5cbiAgcmV0dXJuIENhbnZhczJkUmVuZGVyZXI7XG59KSgpO1xuXG5cbnZhciBSZW5kZXJlciA9IChmdW5jdGlvbiBSZW5kZXJlckNsb3N1cmUoKSB7XG5cbiAgdmFyIHJlbmRlcmVyRm4gPSBmYWxzZTtcblxuICBpZiAoSGVhdG1hcENvbmZpZ1snZGVmYXVsdFJlbmRlcmVyJ10gPT09ICdjYW52YXMyZCcpIHtcbiAgICByZW5kZXJlckZuID0gQ2FudmFzMmRSZW5kZXJlcjtcbiAgfVxuXG4gIHJldHVybiByZW5kZXJlckZuO1xufSkoKTtcblxuXG52YXIgVXRpbCA9IHtcbiAgbWVyZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtZXJnZWQgPSB7fTtcbiAgICB2YXIgYXJnc0xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzTGVuOyBpKyspIHtcbiAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbaV1cbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgbWVyZ2VkW2tleV0gPSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlZDtcbiAgfVxufTtcbi8vIEhlYXRtYXAgQ29uc3RydWN0b3JcbnZhciBIZWF0bWFwID0gKGZ1bmN0aW9uIEhlYXRtYXBDbG9zdXJlKCkge1xuXG4gIHZhciBDb29yZGluYXRvciA9IChmdW5jdGlvbiBDb29yZGluYXRvckNsb3N1cmUoKSB7XG5cbiAgICBmdW5jdGlvbiBDb29yZGluYXRvcigpIHtcbiAgICAgIHRoaXMuY1N0b3JlID0ge307XG4gICAgfTtcblxuICAgIENvb3JkaW5hdG9yLnByb3RvdHlwZSA9IHtcbiAgICAgIG9uOiBmdW5jdGlvbihldnROYW1lLCBjYWxsYmFjaywgc2NvcGUpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuXG4gICAgICAgIGlmICghY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgY1N0b3JlW2V2dE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgY1N0b3JlW2V2dE5hbWVdLnB1c2goKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHNjb3BlLCBkYXRhKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSxcbiAgICAgIGVtaXQ6IGZ1bmN0aW9uKGV2dE5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuICAgICAgICBpZiAoY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgdmFyIGxlbiA9IGNTdG9yZVtldnROYW1lXS5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBjU3RvcmVbZXZ0TmFtZV1baV07XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIENvb3JkaW5hdG9yO1xuICB9KSgpO1xuXG5cbiAgdmFyIF9jb25uZWN0ID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgICB2YXIgcmVuZGVyZXIgPSBzY29wZS5fcmVuZGVyZXI7XG4gICAgdmFyIGNvb3JkaW5hdG9yID0gc2NvcGUuX2Nvb3JkaW5hdG9yO1xuICAgIHZhciBzdG9yZSA9IHNjb3BlLl9zdG9yZTtcblxuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJwYXJ0aWFsJywgcmVuZGVyZXIucmVuZGVyUGFydGlhbCwgcmVuZGVyZXIpO1xuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJhbGwnLCByZW5kZXJlci5yZW5kZXJBbGwsIHJlbmRlcmVyKTtcbiAgICBjb29yZGluYXRvci5vbignZXh0cmVtYWNoYW5nZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNjb3BlLl9jb25maWcub25FeHRyZW1hQ2hhbmdlICYmXG4gICAgICBzY29wZS5fY29uZmlnLm9uRXh0cmVtYUNoYW5nZSh7XG4gICAgICAgIG1pbjogZGF0YS5taW4sXG4gICAgICAgIG1heDogZGF0YS5tYXgsXG4gICAgICAgIGdyYWRpZW50OiBzY29wZS5fY29uZmlnWydncmFkaWVudCddIHx8IHNjb3BlLl9jb25maWdbJ2RlZmF1bHRHcmFkaWVudCddXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBzdG9yZS5zZXRDb29yZGluYXRvcihjb29yZGluYXRvcik7XG4gIH07XG5cblxuICBmdW5jdGlvbiBIZWF0bWFwKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLl9jb25maWcgPSBVdGlsLm1lcmdlKEhlYXRtYXBDb25maWcsIGFyZ3VtZW50c1swXSB8fCB7fSk7XG4gICAgdGhpcy5fY29vcmRpbmF0b3IgPSBuZXcgQ29vcmRpbmF0b3IoKTtcbiAgICBpZiAoY29uZmlnWydwbHVnaW4nXSkge1xuICAgICAgdmFyIHBsdWdpblRvTG9hZCA9IGNvbmZpZ1sncGx1Z2luJ107XG4gICAgICBpZiAoIUhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5Ub0xvYWRdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGx1Z2luIFxcJycrIHBsdWdpblRvTG9hZCArICdcXCcgbm90IGZvdW5kLiBNYXliZSBpdCB3YXMgbm90IHJlZ2lzdGVyZWQuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGx1Z2luID0gSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpblRvTG9hZF07XG4gICAgICAgIC8vIHNldCBwbHVnaW4gcmVuZGVyZXIgYW5kIHN0b3JlXG4gICAgICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IHBsdWdpbi5yZW5kZXJlcihjb25maWcpO1xuICAgICAgICB0aGlzLl9zdG9yZSA9IG5ldyBwbHVnaW4uc3RvcmUoY29uZmlnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoY29uZmlnKTtcbiAgICAgIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JlKGNvbmZpZyk7XG4gICAgfVxuICAgIF9jb25uZWN0KHRoaXMpO1xuICB9O1xuXG4gIC8vIEBUT0RPOlxuICAvLyBhZGQgQVBJIGRvY3VtZW50YXRpb25cbiAgSGVhdG1hcC5wcm90b3R5cGUgPSB7XG4gICAgYWRkRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5hZGREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnJlbW92ZURhdGEgJiYgdGhpcy5fc3RvcmUucmVtb3ZlRGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWF4OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGFNYXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YU1pbi5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX2NvbmZpZyA9IFV0aWwubWVyZ2UodGhpcy5fY29uZmlnLCBjb25maWcpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIudXBkYXRlQ29uZmlnKHRoaXMuX2NvbmZpZyk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9zdG9yZS5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZXBhaW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX3N0b3JlLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlLmdldERhdGEoKTtcbiAgICB9LFxuICAgIGdldERhdGFVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldERhdGFVUkwoKTtcbiAgICB9LFxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG5cbiAgICAgIGlmICh0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KHBvaW50KTtcbiAgICAgIH0gZWxzZSAgaWYgKHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQocG9pbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBIZWF0bWFwO1xuXG59KSgpO1xuXG5cbi8vIGNvcmVcbnZhciBoZWF0bWFwRmFjdG9yeSA9IHtcbiAgY3JlYXRlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICByZXR1cm4gbmV3IEhlYXRtYXAoY29uZmlnKTtcbiAgfSxcbiAgcmVnaXN0ZXI6IGZ1bmN0aW9uKHBsdWdpbktleSwgcGx1Z2luKSB7XG4gICAgSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpbktleV0gPSBwbHVnaW47XG4gIH1cbn07XG5cbnJldHVybiBoZWF0bWFwRmFjdG9yeTtcblxuXG59KTsiLCJjb25zdCBVUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OFwiXHJcblxyXG5jb25zdCBBUEkgPSB7XHJcblxyXG4gIGdldFNpbmdsZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGdldEFsbChleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBkZWxldGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWAsIHtcclxuICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHBvc3RJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHB1dEl0ZW0oZXh0ZW5zaW9uLCBvYmopIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBVVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBUEkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGhlYXRtYXBEYXRhIGZyb20gXCIuL2hlYXRtYXBEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBkYXRlRmlsdGVyID0ge1xyXG5cclxuICBidWlsZERhdGVGaWx0ZXIoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tIGhlYXRtYXBzLmpzIGFuZCBpcyB0cmlnZ2VyZWQgZnJvbSB0aGUgaGVhdG1hcHMgcGFnZSBvZiB0aGUgc2l0ZSB3aGVuXHJcbiAgICAvLyB0aGUgZGF0ZSBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImVuZERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGVuZERhdGVJbnB1dCk7XHJcbiAgICBjb25zdCBlbmREYXRlTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiRGF0ZSAyOlxceGEwXCIpO1xyXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0RmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgZW5kRGF0ZUxhYmVsLCBlbmREYXRlQ29udHJvbCk7XHJcblxyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzdGFydERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgc3RhcnREYXRlSW5wdXQpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlTGFiZWwgPSBlbEJ1aWxkZXIoXCJsYWJlbFwiLCB7IFwiY2xhc3NcIjogXCJsYWJlbFwiIH0sIFwiRGF0ZSAxOlxceGEwXCIpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXRGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBzdGFydERhdGVMYWJlbCwgc3RhcnREYXRlQ29udHJvbCk7XHJcblxyXG4gICAgY29uc3QgY2xlYXJGaWx0ZXJCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2xlYXJEYXRlRmlsdGVyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDbGVhciBGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBjbGVhckZpbHRlckJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGNsZWFyRmlsdGVyQnRuKTtcclxuICAgIGNvbnN0IGRhdGVTYXZlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNldERhdGVGaWx0ZXJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTZXQgRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUJ1dHRvbkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRhdGVTYXZlQnRuKTtcclxuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxNb2RhbFdpbmRvd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsXCIpO1xyXG4gICAgY29uc3QgY2FuY2VsQnV0dG9uQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgY2FuY2VsQnRuKTtcclxuICAgIGNvbnN0IGJ1dHRvbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIHNhdmVCdXR0b25Db250cm9sLCBjbGVhckZpbHRlckJ1dHRvbkNvbnRyb2wsIGNhbmNlbEJ1dHRvbkNvbnRyb2wpO1xyXG5cclxuICAgIGNvbnN0IG1vZGFsQ29udGVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJtb2RhbC1jb250ZW50IGJveFwiIH0sIG51bGwsIHN0YXJ0RGF0ZUlucHV0RmllbGQsIGVuZERhdGVJbnB1dEZpZWxkLCBidXR0b25GaWVsZCk7XHJcbiAgICBjb25zdCBtb2RhbEJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibW9kYWwtYmFja2dyb3VuZFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgbW9kYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibW9kYWwtZGF0ZUZpbHRlclwiLCBcImNsYXNzXCI6IFwibW9kYWxcIiB9LCBudWxsLCBtb2RhbEJhY2tncm91bmQsIG1vZGFsQ29udGVudCk7XHJcblxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChtb2RhbCk7XHJcbiAgICB0aGlzLm1vZGFsc0V2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIG1vZGFsc0V2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGNsZWFyRGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xlYXJEYXRlRmlsdGVyXCIpO1xyXG4gICAgY29uc3Qgc2V0RGF0ZUZpbHRlckJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2V0RGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IGNhbmNlbE1vZGFsV2luZG93QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxNb2RhbFdpbmRvd1wiKTtcclxuXHJcbiAgICBjYW5jZWxNb2RhbFdpbmRvd0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGF0ZUZpbHRlci5jYW5jZWxNb2RhbFdpbmRvdyk7XHJcbiAgICBzZXREYXRlRmlsdGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLnNldEZpbHRlcik7XHJcbiAgICBjbGVhckRhdGVGaWx0ZXJCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGRhdGVGaWx0ZXIuY2xlYXJEYXRlRmlsdGVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgb3BlbkRhdGVGaWx0ZXIoKSB7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIC8vIGNoZWNrIGlmIGdsb2JhbCB2YXJzIGFyZSBzZXQuIElmIHNvLCBkb24ndCB0b2dnbGUgY29sb3Igb2YgYnV0dG9uXHJcbiAgICBjb25zdCBkYXRlU2V0ID0gaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyh0cnVlKTtcclxuXHJcbiAgICBpZiAoZGF0ZVNldCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFwiaXMtYWN0aXZlXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGF0ZVJhbmdlQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGNsZWFyRGF0ZUZpbHRlcigpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVzZXRzIGdsb2JhbCBkYXRlIGZpbHRlciB2YXJpYWJsZXMgaW4gaGVhdG1hcERhdGEuanMgYW5kIHJlcGxhY2VzIGRhdGUgaW5wdXRzIHdpdGggYmxhbmsgZGF0ZSBpbnB1dHNcclxuICAgIGxldCBzdGFydERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhcnREYXRlSW5wdXRcIik7XHJcbiAgICBsZXQgZW5kRGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbmREYXRlSW5wdXRcIik7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBzZXREYXRlRmlsdGVyQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZXREYXRlRmlsdGVyXCIpO1xyXG5cclxuICAgIGhlYXRtYXBEYXRhLmhhbmRsZURhdGVGaWx0ZXJHbG9iYWxWYXJpYWJsZXMoKTtcclxuICAgIGRhdGVSYW5nZUJ0bi5jbGFzc0xpc3QuYWRkKFwiaXMtb3V0bGluZWRcIik7XHJcbiAgICBzdGFydERhdGVJbnB1dC5yZXBsYWNlV2l0aChlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzdGFydERhdGVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwiZGF0ZVwiIH0sIG51bGwpKTtcclxuICAgIGVuZERhdGVJbnB1dC5yZXBsYWNlV2l0aChlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJlbmREYXRlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcImRhdGVcIiB9LCBudWxsKSk7XHJcbiAgICBzZXREYXRlRmlsdGVyQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLnNldEZpbHRlcik7XHJcbiAgICBzZXREYXRlRmlsdGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLnNldEZpbHRlcik7XHJcblxyXG4gICAgaWYgKGRhdGVGaWx0ZXJNb2RhbC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1hY3RpdmVcIikpIHtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNldEZpbHRlcigpIHtcclxuICAgIGNvbnN0IGRhdGVGaWx0ZXJNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibW9kYWwtZGF0ZUZpbHRlclwiKTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGFydERhdGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5kRGF0ZUlucHV0XCIpO1xyXG5cclxuICAgIHN0YXJ0RGF0ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICBlbmREYXRlSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAvLyBjaGVjayBpZiBkYXRlIHBpY2tlcnMgaGF2ZSBhIHZhbGlkIGRhdGVcclxuICAgIGlmIChzdGFydERhdGVJbnB1dC52YWx1ZSA9PT0gXCJcIikge1xyXG4gICAgICBzdGFydERhdGVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgfSBlbHNlIGlmIChlbmREYXRlSW5wdXQudmFsdWUgPT09IFwiXCIpIHtcclxuICAgICAgZW5kRGF0ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBpZiB0aGV5IGRvLCB0aGVuIHNldCBnbG9iYWwgdmFycyBpbiBoZWF0bWFwcyBwYWdlIGFuZCBjbG9zZSBtb2RhbFxyXG4gICAgICBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKGZhbHNlLCBzdGFydERhdGVJbnB1dC52YWx1ZSwgZW5kRGF0ZUlucHV0LnZhbHVlKTtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsTW9kYWxXaW5kb3coKSB7XHJcbiAgICBjb25zdCBkYXRlRmlsdGVyTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vZGFsLWRhdGVGaWx0ZXJcIik7XHJcbiAgICBjb25zdCBkYXRlUmFuZ2VCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRhdGVSYW5nZUJ0blwiKTtcclxuXHJcbiAgICAvLyBpZiBnbG9iYWwgdmFyaWFibGVzIGFyZSBkZWZpbmVkIGFscmVhZHksIGNhbmNlbCBzaG91bGQgbm90IGNoYW5nZSB0aGUgY2xhc3Mgb24gdGhlIGRhdGUgcmFuZ2UgYnV0dG9uXHJcbiAgICBjb25zdCBkYXRlU2V0ID0gaGVhdG1hcERhdGEuaGFuZGxlRGF0ZUZpbHRlckdsb2JhbFZhcmlhYmxlcyh0cnVlKTtcclxuICAgIGlmIChkYXRlU2V0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGF0ZUZpbHRlck1vZGFsLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1hY3RpdmVcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkYXRlUmFuZ2VCdG4uY2xhc3NMaXN0LnRvZ2dsZShcImlzLW91dGxpbmVkXCIpO1xyXG4gICAgICBkYXRlRmlsdGVyTW9kYWwuY2xhc3NMaXN0LnRvZ2dsZShcImlzLWFjdGl2ZVwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhcHBseWRhdGVGaWx0ZXIoc3RhcnREYXRlLCBlbmREYXRlLCBnYW1lSWRzLCBnYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGV4YW1pbmVzIHRoZSBnYW1lIG9iamVjdCBhcmd1bWVudCBjb21wYXJlZCB0byB0aGUgdXNlci1kZWZpbmVkIHN0YXJ0IGFuZCBlbmQgZGF0ZXNcclxuICAgIC8vIGlmIHRoZSBnYW1lIGRhdGUgaXMgd2l0aGluIHRoZSB0d28gZGF0ZXMgc3BlY2lmaWVkLCB0aGVuIHRoZSBnYW1lIElEIGlzIHB1c2hlZCB0byB0aGUgZ2FtZUlkcyBhcnJheVxyXG5cclxuICAgIC8vIHNwbGl0IHRpbWVzdGFtcCBhbmQgcmVjYWxsIG9ubHkgZGF0ZVxyXG4gICAgbGV0IGdhbWVEYXRlID0gZ2FtZS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdO1xyXG5cclxuICAgIGlmIChzdGFydERhdGUgPD0gZ2FtZURhdGUgJiYgZ2FtZURhdGUgPD0gZW5kRGF0ZSkge1xyXG4gICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlkYXRlRmlsdGVyVG9TYXZlZEhlYXRtYXAoc3RhcnREYXRlLCBlbmREYXRlLCBzaG90cywgc2hvdHNNYXRjaGluZ0ZpbHRlcikge1xyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IHNob3REYXRlID0gc2hvdC50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdO1xyXG5cclxuICAgICAgaWYgKHN0YXJ0RGF0ZSA8PSBzaG90RGF0ZSAmJiBzaG90RGF0ZSA8PSBlbmREYXRlKSB7XHJcbiAgICAgICAgc2hvdHNNYXRjaGluZ0ZpbHRlci5wdXNoKHNob3QpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRhdGVGaWx0ZXIiLCJmdW5jdGlvbiBlbEJ1aWxkZXIobmFtZSwgYXR0cmlidXRlc09iaiwgdHh0LCAuLi5jaGlsZHJlbikge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcclxuICBmb3IgKGxldCBhdHRyIGluIGF0dHJpYnV0ZXNPYmopIHtcclxuICAgIGVsLnNldEF0dHJpYnV0ZShhdHRyLCBhdHRyaWJ1dGVzT2JqW2F0dHJdKTtcclxuICB9XHJcbiAgZWwudGV4dENvbnRlbnQgPSB0eHQgfHwgbnVsbDtcclxuICBjaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICB9KVxyXG4gIHJldHVybiBlbDtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZWxCdWlsZGVyIiwiaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIjtcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCI7XHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiO1xyXG5pbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcblxyXG4vLyB0aGUgcHVycG9zZSBvZiB0aGlzIG1vZHVsZSBpcyB0bzpcclxuLy8gMS4gc2F2ZSBhbGwgY29udGVudCBpbiB0aGUgZ2FtZXBsYXkgcGFnZSAoc2hvdCBhbmQgZ2FtZSBkYXRhKSB0byB0aGUgZGF0YWJhc2VcclxuLy8gMi4gaW1tZWRpYXRlbHkgY2xlYXIgdGhlIGdhbWVwbGF5IGNvbnRhaW5lcnMgb2YgY29udGVudCBvbiBzYXZlXHJcbi8vIDMuIGltbWVkaWF0ZWx5IHJlc2V0IGFsbCBnbG9iYWwgdmFyaWFibGVzIGluIHRoZSBzaG90ZGF0YSBmaWxlIHRvIGFsbG93IHRoZSB1c2VyIHRvIGJlZ2luIHNhdmluZyBzaG90cyBhbmQgZW50ZXJpbmcgZ2FtZSBkYXRhIGZvciB0aGVpciBuZXh0IGdhbWVcclxuLy8gNC4gYWZmb3JkYW5jZSBmb3IgdXNlciB0byByZWNhbGwgYWxsIGRhdGEgZnJvbSBwcmV2aW91cyBzYXZlZCBnYW1lIGZvciBlZGl0aW5nXHJcbi8vIDUuIGluY2x1ZGUgYW55IG90aGVyIGZ1bmN0aW9ucyBuZWVkZWQgdG8gc3VwcG9ydCB0aGUgZmlyc3QgNCByZXF1aXJlbWVudHNcclxuXHJcbi8vIHRoaXMgZ2xvYmFsIHZhcmlhYmxlIGlzIHVzZWQgdG8gcGFzcyBzYXZlZCBzaG90cywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbCBib29sZWFuIHRvIHNob3REYXRhLmpzIGR1cmluZyB0aGUgZWRpdCBwcm9jZXNzXHJcbmxldCBzYXZlZEdhbWVPYmplY3Q7XHJcbmxldCBwdXRQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbmxldCBwb3N0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG5sZXQgcG9zdFByb21pc2VzID0gW107XHJcblxyXG5jb25zdCBnYW1lRGF0YSA9IHtcclxuXHJcbiAgZ2FtZVR5cGVCdXR0b25Ub2dnbGUoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB0b2dnbGVzIHRoZSBcImlzLXNlbGVjdGVkXCIgY2xhc3MgYmV0d2VlbiB0aGUgZ2FtZSB0eXBlIGJ1dHRvbnNcclxuXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgYnRuQ2xpY2tlZCA9IGUudGFyZ2V0O1xyXG5cclxuICAgIGlmICghYnRuQ2xpY2tlZC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICBjb25zdCBjdXJyZW50R2FtZVR5cGVCdG4gPSBnYW1lVHlwZUJ0bnMuZmlsdGVyKGJ0biA9PiBidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICAgIGJ0bkNsaWNrZWQuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpIHtcclxuICAgIHNhdmVkR2FtZU9iamVjdCA9IHVuZGVmaW5lZDtcclxuICAgIHB1dFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxuICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbiAgICBwb3N0UHJvbWlzZXMgPSBbXTtcclxuICB9LFxyXG5cclxuICBwdXRFZGl0ZWRTaG90cyhwcmV2aW91c2x5U2F2ZWRTaG90c0Fycikge1xyXG4gICAgLy8gUFVUIGZpcnN0LCBzaWNuZSB5b3UgY2FuJ3Qgc2F2ZSBhIGdhbWUgaW5pdGlhbGx5IHdpdGhvdXQgYXQgbGVhc3QgMSBzaG90XHJcbiAgICBwcmV2aW91c2x5U2F2ZWRTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICAvLyBldmVuIHRob3VnaCBpdCdzIGEgUFVULCB3ZSBoYXZlIHRvIHJlZm9ybWF0IHRoZSBfZmllbGRYIHN5bnRheCB0byBmaWVsZFhcclxuICAgICAgbGV0IHNob3RGb3JQdXQgPSB7fTtcclxuICAgICAgc2hvdEZvclB1dC5nYW1lSWQgPSBzYXZlZEdhbWVPYmplY3QuaWQ7XHJcbiAgICAgIHNob3RGb3JQdXQuZmllbGRYID0gc2hvdC5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUHV0LmZpZWxkWSA9IHNob3QuX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclB1dC5nb2FsWCA9IHNob3QuX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUHV0LmdvYWxZID0gc2hvdC5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQdXQuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90LmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUHV0LmFlcmlhbCA9IHNob3QuX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclB1dC50aW1lU3RhbXAgPSBzaG90Ll90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwdXRQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnB1dEl0ZW0oYHNob3RzLyR7c2hvdC5pZH1gLCBzaG90Rm9yUHV0KSk7XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHB1dFByb21pc2VzRWRpdE1vZGUpXHJcbiAgfSxcclxuXHJcbiAgcG9zdE5ld1Nob3RzTWFkZUR1cmluZ0VkaXRNb2RlKHNob3RzTm90WWV0UG9zdGVkQXJyKSB7XHJcbiAgICBzaG90c05vdFlldFBvc3RlZEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICBsZXQgc2hvdEZvclBvc3QgPSB7fTtcclxuICAgICAgc2hvdEZvclBvc3QuZ2FtZUlkID0gc2F2ZWRHYW1lT2JqZWN0LmlkO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFggPSBzaG90T2JqLl9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWSA9IHNob3RPYmouX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFggPSBzaG90T2JqLl9nb2FsWDtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFkgPSBzaG90T2JqLl9nb2FsWTtcclxuICAgICAgc2hvdEZvclBvc3QuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90T2JqLmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUG9zdC5hZXJpYWwgPSBzaG90T2JqLl9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQb3N0LnRpbWVTdGFtcCA9IHNob3RPYmouX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXNFZGl0TW9kZSlcclxuICB9LFxyXG5cclxuICBwb3N0TmV3U2hvdHMoZ2FtZUlkKSB7XHJcbiAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgIHNob3RBcnIuZm9yRWFjaChzaG90T2JqID0+IHtcclxuICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgIHNob3RGb3JQb3N0LmdhbWVJZCA9IGdhbWVJZDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRYID0gc2hvdE9iai5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFkgPSBzaG90T2JqLl9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxYID0gc2hvdE9iai5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxZID0gc2hvdE9iai5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdE9iai5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclBvc3QuYWVyaWFsID0gc2hvdE9iai5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUG9zdC50aW1lU3RhbXAgPSBzaG90T2JqLl90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwb3N0UHJvbWlzZXMucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkpO1xyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXMpXHJcbiAgfSxcclxuXHJcbiAgc2F2ZURhdGEoZ2FtZURhdGFPYmosIHNhdmluZ0VkaXRlZEdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZmlyc3QgZGV0ZXJtaW5lcyBpZiBhIGdhbWUgaXMgYmVpbmcgc2F2ZWQgYXMgbmV3LCBvciBhIHByZXZpb3VzbHkgc2F2ZWQgZ2FtZSBpcyBiZWluZyBlZGl0ZWRcclxuICAgIC8vIGlmIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSwgdGhlIGdhbWUgaXMgUFVULCBhbGwgc2hvdHMgc2F2ZWQgcHJldmlvdXNseSBhcmUgUFVULCBhbmQgbmV3IHNob3RzIGFyZSBQT1NURURcclxuICAgIC8vIGlmIHRoZSBnYW1lIGlzIGEgbmV3IGdhbWUgYWx0b2dldGhlciwgdGhlbiB0aGUgZ2FtZSBpcyBQT1NURUQgYW5kIGFsbCBzaG90cyBhcmUgUE9TVEVEXHJcbiAgICAvLyB0aGVuIGZ1bmN0aW9ucyBhcmUgY2FsbGVkIHRvIHJlbG9hZCB0aGUgbWFzdGVyIGNvbnRhaW5lciBhbmQgcmVzZXQgZ2xvYmFsIHNob3QgZGF0YSB2YXJpYWJsZXNcclxuXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSkge1xyXG4gICAgICAvLyB1c2UgSUQgb2YgZ2FtZSBzdG9yZWQgaW4gZ2xvYmFsIHZhclxyXG4gICAgICBBUEkucHV0SXRlbShgZ2FtZXMvJHtzYXZlZEdhbWVPYmplY3QuaWR9YCwgZ2FtZURhdGFPYmopXHJcbiAgICAgICAgLnRoZW4oZ2FtZVBVVCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlBVVCBHQU1FXCIsIGdhbWVQVVQpXHJcbiAgICAgICAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICAgICAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgICAgICAgIGNvbnN0IHByZXZpb3VzbHlTYXZlZFNob3RzQXJyID0gW107XHJcbiAgICAgICAgICBjb25zdCBzaG90c05vdFlldFBvc3RlZEFyciA9IFtdO1xyXG5cclxuICAgICAgICAgIC8vIGNyZWF0ZSBhcnJheXMgZm9yIFBVVCBhbmQgUE9TVCBmdW5jdGlvbnMgKGlmIHRoZXJlJ3MgYW4gaWQgaW4gdGhlIGFycmF5LCBpdCdzIGJlZW4gc2F2ZWQgdG8gdGhlIGRhdGFiYXNlIGJlZm9yZSlcclxuICAgICAgICAgIHNob3RBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgICAgICAgaWYgKHNob3QuaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHByZXZpb3VzbHlTYXZlZFNob3RzQXJyLnB1c2goc2hvdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc2hvdHNOb3RZZXRQb3N0ZWRBcnIucHVzaChzaG90KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0byBQVVQgYW5kIFBPU1RcclxuICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRoYXQgY2xlYXIgZ2FtZXBsYXkgY29udGVudCBhbmQgcmVzZXQgZ2xvYmFsIHNob3QvZ2FtZSBkYXRhIHZhcmlhYmxlc1xyXG4gICAgICAgICAgZ2FtZURhdGEucHV0RWRpdGVkU2hvdHMocHJldmlvdXNseVNhdmVkU2hvdHNBcnIpXHJcbiAgICAgICAgICAgIC50aGVuKHggPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUUzpcIiwgeClcclxuICAgICAgICAgICAgICAvLyBpZiBubyBuZXcgc2hvdHMgd2VyZSBtYWRlLCByZWxvYWQuIGVsc2UgcG9zdCBuZXcgc2hvdHNcclxuICAgICAgICAgICAgICBpZiAoc2hvdHNOb3RZZXRQb3N0ZWRBcnIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90c01hZGVEdXJpbmdFZGl0TW9kZShzaG90c05vdFlldFBvc3RlZEFycilcclxuICAgICAgICAgICAgICAgICAgLnRoZW4oeSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQT1NUUzpcIiwgeSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkucG9zdEl0ZW0oXCJnYW1lc1wiLCBnYW1lRGF0YU9iailcclxuICAgICAgICAudGhlbihnYW1lID0+IGdhbWUuaWQpXHJcbiAgICAgICAgLnRoZW4oZ2FtZUlkID0+IHtcclxuICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90cyhnYW1lSWQpXHJcbiAgICAgICAgICAgIC50aGVuKHogPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU0FWRUQgTkVXIFNIT1RTXCIsIHopO1xyXG4gICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcGFja2FnZUdhbWVEYXRhKCkge1xyXG5cclxuICAgIC8vIGdldCB1c2VyIElEIGZyb20gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgICAvLyBwYWNrYWdlIGVhY2ggaW5wdXQgZnJvbSBnYW1lIGRhdGEgY29udGFpbmVyIGludG8gdmFyaWFibGVzXHJcbiAgICAvLyBUT0RPOiBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gcHJldmVudCBibGFuayBzY29yZSBlbnRyaWVzXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gc2F2ZSBnYW1lXHJcblxyXG4gICAgLy8gcGxheWVySWRcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgZ2FtZVR5cGUgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IHtcclxuICAgICAgaWYgKGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICAgIGdhbWVUeXBlID0gYnRuLnRleHRDb250ZW50XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIChub3RlOiBkaWQgbm90IHVzZSBib29sZWFuIGluIGNhc2UgbW9yZSBnYW1lIG1vZGVzIGFyZSBzdXBwb3J0ZWQgaW4gdGhlIGZ1dHVyZSlcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsX2dhbWVNb2RlLnZhbHVlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gbXkgdGVhbVxyXG4gICAgY29uc3Qgc2VsX3RlYW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlYW1JbnB1dFwiKTtcclxuICAgIGxldCB0ZWFtZWRVcDtcclxuICAgIGlmIChzZWxfdGVhbS52YWx1ZSA9PT0gXCJObyBwYXJ0eVwiKSB7XHJcbiAgICAgIHRlYW1lZFVwID0gZmFsc2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0ZWFtZWRVcCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NvcmVzXHJcbiAgICBsZXQgbXlTY29yZTtcclxuICAgIGxldCB0aGVpclNjb3JlO1xyXG4gICAgY29uc3QgaW5wdF9teVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJteVNjb3JlSW5wdXRcIik7XHJcbiAgICBjb25zdCBpbnB0X3RoZWlyU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRoZWlyU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICBteVNjb3JlID0gTnVtYmVyKGlucHRfbXlTY29yZS52YWx1ZSk7XHJcbiAgICB0aGVpclNjb3JlID0gTnVtYmVyKGlucHRfdGhlaXJTY29yZS52YWx1ZSk7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGxldCBvdmVydGltZTtcclxuICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgIGlmIChzZWxfb3ZlcnRpbWUudmFsdWUgPT09IFwiT3ZlcnRpbWVcIikge1xyXG4gICAgICBvdmVydGltZSA9IHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvdmVydGltZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBnYW1lRGF0YU9iaiA9IHtcclxuICAgICAgXCJ1c2VySWRcIjogYWN0aXZlVXNlcklkLFxyXG4gICAgICBcIm1vZGVcIjogZ2FtZU1vZGUsXHJcbiAgICAgIFwidHlwZVwiOiBnYW1lVHlwZSxcclxuICAgICAgXCJwYXJ0eVwiOiB0ZWFtZWRVcCxcclxuICAgICAgXCJzY29yZVwiOiBteVNjb3JlLFxyXG4gICAgICBcIm9wcF9zY29yZVwiOiB0aGVpclNjb3JlLFxyXG4gICAgICBcIm92ZXJ0aW1lXCI6IG92ZXJ0aW1lLFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSBuZXcgZ2FtZSBvciBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZC4gSWYgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQsIHRoZW4gdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHNob3Qgc2F2ZWQgYWxyZWFkeSwgbWFraW5nIHRoZSByZXR1cm4gZnJvbSB0aGUgc2hvdERhdGEgZnVuY3Rpb24gbW9yZSB0aGFuIDBcclxuICAgIGNvbnN0IHNhdmluZ0VkaXRlZEdhbWUgPSBzaG90RGF0YS5nZXRJbml0aWFsTnVtT2ZTaG90cygpXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHNhdmVkR2FtZU9iamVjdC50aW1lU3RhbXBcclxuICAgICAgZ2FtZURhdGEuc2F2ZURhdGEoZ2FtZURhdGFPYmosIHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdGltZSBzdGFtcCBpZiBuZXcgZ2FtZVxyXG4gICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuICAgICAgZ2FtZURhdGFPYmoudGltZVN0YW1wID0gdGltZVN0YW1wXHJcbiAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNhdmVQcmV2R2FtZUVkaXRzKCkge1xyXG4gICAgZ2FtZURhdGEucGFja2FnZUdhbWVEYXRhKCk7XHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsRWRpdGluZ01vZGUoKSB7XHJcbiAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlckVkaXRCdXR0b25zKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZW1vdmVzICYgcmVwbGFjZXMgZWRpdCBhbmQgc2F2ZSBnYW1lIGJ1dHRvbnMgd2l0aCBcIlNhdmUgRWRpdHNcIiBhbmQgXCJDYW5jZWwgRWRpdHNcIlxyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIC8vIGluIGNhc2Ugb2YgbGFnIGluIGZldGNoLCBwcmV2ZW50IHVzZXIgZnJvbSBkb3VibGUgY2xpY2tpbmcgYnV0dG9uXHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuY2xhc3NMaXN0LmFkZChcImlzLWxvYWRpbmdcIik7XHJcblxyXG4gICAgY29uc3QgYnRuX2NhbmNlbEVkaXRzID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbEVkaXRzXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDYW5jZWwgRWRpdHNcIilcclxuICAgIGNvbnN0IGJ0bl9zYXZlRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUVkaXRzXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBFZGl0c1wiKVxyXG5cclxuICAgIGJ0bl9jYW5jZWxFZGl0cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuY2FuY2VsRWRpdGluZ01vZGUpXHJcbiAgICBidG5fc2F2ZUVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5zYXZlUHJldkdhbWVFZGl0cylcclxuXHJcbiAgICBidG5fZWRpdFByZXZHYW1lLnJlcGxhY2VXaXRoKGJ0bl9jYW5jZWxFZGl0cyk7XHJcbiAgICBidG5fc2F2ZUdhbWUucmVwbGFjZVdpdGgoYnRuX3NhdmVFZGl0cyk7XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlbmRlclByZXZHYW1lKGdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHJlbmRlcmluZyB0aGUgc2F2ZWQgZ2FtZSBpbmZvcm1hdGlvbiBpbiB0aGUgXCJFbnRlciBHYW1lIERhdGFcIiBjb250YWluZXIuXHJcbiAgICAvLyBpdCByZWxpZXMgb24gYSBmdW5jdGlvbiBpbiBzaG90RGF0YS5qcyB0byByZW5kZXIgdGhlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc29sZS5sb2coZ2FtZSlcclxuXHJcbiAgICAvLyBjYWxsIGZ1bmN0aW9uIGluIHNob3REYXRhIHRoYXQgY2FsbHMgZ2FtYURhdGEucHJvdmlkZVNob3RzVG9TaG90RGF0YSgpXHJcbiAgICAvLyB0aGUgZnVuY3Rpb24gd2lsbCBjYXB0dXJlIHRoZSBhcnJheSBvZiBzYXZlZCBzaG90cyBhbmQgcmVuZGVyIHRoZSBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLnJlbmRlclNob3RzQnV0dG9uc0Zyb21QcmV2aW91c0dhbWUoKVxyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBjb25zdCBzZWxfb3ZlcnRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm92ZXJ0aW1lSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5vdmVydGltZSkge1xyXG4gICAgICBzZWxfb3ZlcnRpbWUudmFsdWUgPSBcIk92ZXJ0aW1lXCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF9vdmVydGltZS52YWx1ZSA9IFwiTm8gb3ZlcnRpbWVcIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIG15IHRlYW1cclxuICAgIGNvbnN0IHNlbF90ZWFtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5wYXJ0eSA9PT0gZmFsc2UpIHtcclxuICAgICAgc2VsX3RlYW0udmFsdWUgPSBcIk5vIHBhcnR5XCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF90ZWFtLnZhbHVlID0gXCJQYXJ0eVwiXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NvcmVcclxuICAgIGNvbnN0IGlucHRfbXlTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF90aGVpclNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0aGVpclNjb3JlSW5wdXRcIik7XHJcblxyXG4gICAgaW5wdF9teVNjb3JlLnZhbHVlID0gZ2FtZS5zY29yZTtcclxuICAgIGlucHRfdGhlaXJTY29yZS52YWx1ZSA9IGdhbWUub3BwX3Njb3JlO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZSAoMXYxLCAydjIsIDN2MylcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuXHJcbiAgICBpZiAoZ2FtZS50eXBlID09PSBcIjN2M1wiKSB7XHJcbiAgICAgIGJ0bl8zdjMuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgICAvLyAydjIgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2UgaWYgKGdhbWUudHlwZSA9PT0gXCIydjJcIikge1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJ0bl8xdjEuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLm1vZGUgPSBcImNvbXBldGl0aXZlXCIpIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDb21wZXRpdGl2ZVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfZ2FtZU1vZGUudmFsdWUgPSBcIkNhc3VhbFwiXHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHByb3ZpZGVTaG90c1RvU2hvdERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHByb3ZpZGVzIHRoZSBzaG90cyBmb3IgcmVuZGVyaW5nIHRvIHNob3REYXRhXHJcbiAgICByZXR1cm4gc2F2ZWRHYW1lT2JqZWN0XHJcbiAgfSxcclxuXHJcbiAgZWRpdFByZXZHYW1lKCkge1xyXG4gICAgLy8gZmV0Y2ggY29udGVudCBmcm9tIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQgdG8gYmUgcmVuZGVyZWRcclxuXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gZWRpdCBwcmV2aW91cyBnYW1lXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYCR7YWN0aXZlVXNlcklkfT9fZW1iZWQ9Z2FtZXNgKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBpZiAodXNlci5nYW1lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBhbGVydChcIk5vIGdhbWVzIGhhdmUgYmVlbiBzYXZlZCBieSB0aGlzIHVzZXJcIik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IG1heCBnYW1lIGlkICh3aGljaCBpcyB0aGUgbW9zdCByZWNlbnQgZ2FtZSBzYXZlZClcclxuICAgICAgICBjb25zdCByZWNlbnRHYW1lSWQgPSB1c2VyLmdhbWVzLnJlZHVjZSgobWF4LCBvYmopID0+IG9iai5pZCA+IG1heCA/IG9iai5pZCA6IG1heCwgdXNlci5nYW1lc1swXS5pZCk7XHJcbiAgICAgICAgLy8gZmV0Y2ggbW9zdCByZWNlbnQgZ2FtZSBhbmQgZW1iZWQgc2hvdHNcclxuICAgICAgICBBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGAke3JlY2VudEdhbWVJZH0/X2VtYmVkPXNob3RzYCkudGhlbihnYW1lT2JqID0+IHtcclxuICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJFZGl0QnV0dG9ucygpO1xyXG4gICAgICAgICAgc2F2ZWRHYW1lT2JqZWN0ID0gZ2FtZU9iajtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlclByZXZHYW1lKGdhbWVPYmopO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZURhdGEiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBnYW1lcGxheSA9IHtcclxuXHJcbiAgbG9hZEdhbWVwbGF5KCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgLy8gY29uc3QgeEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJkZWxldGVcIiB9KTtcclxuICAgIC8vIHhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQm94LCBldmVudCk7IC8vIGJ1dHRvbiB3aWxsIGRpc3BsYXk6IG5vbmUgb24gcGFyZW50IGNvbnRhaW5lclxyXG4gICAgLy8gY29uc3QgaGVhZGVySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb24gaXMtaW5mb1wiIH0sIFwiQ3JlYXRlIGFuZCBzYXZlIHNob3RzIC0gdGhlbiBzYXZlIHRoZSBnYW1lIHJlY29yZC5cIiwgeEJ1dHRvbik7XHJcbiAgICAvLyB3ZWJwYWdlLmFwcGVuZENoaWxkKGhlYWRlckluZm8pO1xyXG4gICAgdGhpcy5idWlsZFNob3RDb250ZW50KCk7XHJcbiAgICB0aGlzLmJ1aWxkR2FtZUNvbnRlbnQoKTtcclxuICAgIHRoaXMuZ2FtZXBsYXlFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBidWlsZFNob3RDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgc2hvdCBjb250YWluZXJzIGFuZCBhZGRzIGNvbnRhaW5lciBjb250ZW50XHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBzaG90VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBTaG90IERhdGFcIik7XHJcbiAgICBjb25zdCBzaG90VGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90VGl0bGUpO1xyXG5cclxuICAgIC8vIG5ldyBzaG90IGFuZCBzYXZlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3QgbmV3U2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJuZXdTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiTmV3IFNob3RcIik7XHJcbiAgICBjb25zdCBzYXZlU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgU2hvdFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbFNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIFNob3RcIik7XHJcbiAgICBjb25zdCBzaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJzaG90Q29udHJvbHNcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gYnV0dG9uc1wiIH0sIG51bGwsIG5ld1Nob3QsIHNhdmVTaG90LCBjYW5jZWxTaG90KTtcclxuICAgIGNvbnN0IGFsaWduU2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIHNob3RCdXR0b25zKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnblNob3RCdXR0b25zKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGlucHV0IGFuZCBhZXJpYWwgc2VsZWN0XHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJhbGwgc3BlZWQgKGtwaCk6XCIpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZElucHV0XCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGlucHV0XCIsIFwidHlwZVwiOlwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBiYWxsIHNwZWVkXCIgfSk7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiYWVyaWFsSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbE9wdGlvbjEsIGFlcmlhbE9wdGlvbjIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdCk7XHJcbiAgICBjb25zdCBhZXJpYWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdFBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgYmFsbFNwZWVkSW5wdXRUaXRsZSwgYmFsbFNwZWVkSW5wdXQsIGFlcmlhbENvbnRyb2wpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90RGV0YWlscyk7XHJcblxyXG4gICAgLy8gZmllbGQgYW5kIGdvYWwgaW1hZ2VzIChub3RlIGZpZWxkLWltZyBpcyBjbGlwcGVkIHRvIHJlc3RyaWN0IGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgaW4gbGF0ZXIgZnVuY3Rpb24uXHJcbiAgICAvLyBnb2FsLWltZyB1c2VzIGFuIHgveSBmb3JtdWxhIGZvciBjbGljayBhcmVhIGNvb3JkaW5hdGVzIHJlc3RyaWN0aW9uLCBzaW5jZSBpdCdzIGEgcmVjdGFuZ2xlKVxyXG4gICAgLy8gYWRkaXRpb25hbGx5LCBmaWVsZCBhbmQgZ29hbCBhcmUgbm90IGFsaWduZWQgd2l0aCBsZXZlbC1sZWZ0IG9yIGxldmVsLXJpZ2h0IC0gaXQncyBhIGRpcmVjdCBsZXZlbCAtLT4gbGV2ZWwtaXRlbSBmb3IgY2VudGVyaW5nXHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IHNob3RDb29yZGluYXRlc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBzaG90VGl0bGVDb250YWluZXIsIHNob3RCdXR0b25Db250YWluZXIsIHNob3REZXRhaWxzQ29udGFpbmVyLCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIpXHJcblxyXG4gICAgLy8gYXBwZW5kIHNob3RzIGNvbnRhaW5lciB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2FtZUNvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGNyZWF0ZXMgZ2FtZSBjb250ZW50IGNvbnRhaW5lcnMgKHRlYW0sIGdhbWUgdHlwZSwgZ2FtZSBtb2RlLCBldGMuKVxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3QgZ2FtZVRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgR2FtZSBEYXRhXCIpO1xyXG4gICAgY29uc3QgdGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVGl0bGUpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gdG9wIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIDF2MS8ydjIvM3YzIGJ1dHRvbnMgKG5vdGU6IGNvbnRyb2wgY2xhc3MgaXMgdXNlZCB3aXRoIGZpZWxkIHRvIGFkaGVyZSBidXR0b25zIHRvZ2V0aGVyKVxyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTN2M0NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlM3YzKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zZWxlY3RlZCBpcy1saW5rXCIgfSwgXCIydjJcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMnYyKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8xdjFcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjFDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTF2MSk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGhhcy1hZGRvbnNcIiB9LCBudWxsLCBnYW1lVHlwZTN2M0NvbnRyb2wsIGdhbWVUeXBlMnYyQ29udHJvbCwgZ2FtZVR5cGUxdjFDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkZpZWxkKTtcclxuXHJcbiAgICAvLyBnYW1lIG1vZGUgc2VsZWN0XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDb21wZXRpdGl2ZVwiKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZ2FtZU1vZGVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZU9wdGlvbjEsIG1vZGVPcHRpb24yKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZVNlbGVjdCk7XHJcbiAgICBjb25zdCBtb2RlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBtb2RlU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyB0ZWFtIHNlbGVjdFxyXG4gICAgY29uc3QgdGVhbU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gcGFydHlcIik7XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJQYXJ0eVwiKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwidGVhbUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtT3B0aW9uMSwgdGVhbU9wdGlvbjIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtU2VsZWN0KTtcclxuICAgIGNvbnN0IHRlYW1Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHRlYW1TZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lIHNlbGVjdFxyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIG92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwib3ZlcnRpbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVPcHRpb24xLCBvdmVydGltZU9wdGlvbjIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3QpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIGJvdHRvbSBjb250YWluZXJcclxuXHJcbiAgICAvLyBzY29yZSBpbnB1dHNcclxuICAgIC8vICoqKipOb3RlIGlubGluZSBzdHlsaW5nIG9mIGlucHV0IHdpZHRoc1xyXG4gICAgY29uc3QgbXlTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiU2NvcmU6XCIpO1xyXG4gICAgY29uc3QgbXlTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibXlTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcIm15IHRlYW0ncyBzY29yZVwiIH0pO1xyXG4gICAgY29uc3QgbXlTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgbXlTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IHRoZWlyU2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIk9wcG9uZW50J3Mgc2NvcmU6XCIpXHJcbiAgICBjb25zdCB0aGVpclNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ0aGVpclNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwidGhlaXIgdGVhbSdzIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCB0aGVpclNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCB0aGVpclNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3Qgc2NvcmVJbnB1dENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgbXlTY29yZUlucHV0VGl0bGUsIG15U2NvcmVDb250cm9sLCB0aGVpclNjb3JlSW5wdXRUaXRsZSwgdGhlaXJTY29yZUNvbnRyb2wpO1xyXG5cclxuICAgIC8vIGVkaXQvc2F2ZSBnYW1lIGJ1dHRvbnNcclxuICAgIGNvbnN0IGVkaXRQcmV2aW91c0dhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZWRpdFByZXZHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJFZGl0IFByZXZpb3VzIEdhbWVcIik7XHJcbiAgICBjb25zdCBzYXZlR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlR2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgR2FtZVwiKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25BbGlnbm1lbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9ucyBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgc2F2ZUdhbWUsIGVkaXRQcmV2aW91c0dhbWUpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1yaWdodFwiIH0sIG51bGwsIGdhbWVCdXR0b25BbGlnbm1lbnQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyVG9wID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25Db250YWluZXIsIG1vZGVDb250cm9sLCB0ZWFtQ29udHJvbCwgb3ZlcnRpbWVDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJCb3R0b20gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzY29yZUlucHV0Q29udGFpbmVyLCBnYW1lQnV0dG9uQ29udGFpbmVyKTtcclxuICAgIGNvbnN0IHBhcmVudEdhbWVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHRpdGxlQ29udGFpbmVyLCBnYW1lQ29udGFpbmVyVG9wLCBnYW1lQ29udGFpbmVyQm90dG9tKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50R2FtZUNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlFdmVudE1hbmFnZXIoKSB7XHJcblxyXG4gICAgLy8gYnV0dG9uc1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZVNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2NhbmNlbFNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbmNlbFNob3RcIik7XHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lcnNcclxuICAgIGJ0bl9uZXdTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jcmVhdGVOZXdTaG90KTtcclxuICAgIGJ0bl9zYXZlU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuc2F2ZVNob3QpO1xyXG4gICAgYnRuX2NhbmNlbFNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmNhbmNlbFNob3QpO1xyXG4gICAgYnRuX3NhdmVHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5wYWNrYWdlR2FtZURhdGEpO1xyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZ2FtZVR5cGVCdXR0b25Ub2dnbGUpKTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmVkaXRQcmV2R2FtZSlcclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZXBsYXkiLCJpbXBvcnQgaGVhdG1hcCBmcm9tIFwiLi4vbGliL25vZGVfbW9kdWxlcy9oZWF0bWFwLmpzL2J1aWxkL2hlYXRtYXAuanNcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSS5qc1wiO1xyXG5pbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyLmpzXCI7XHJcbmltcG9ydCBkYXRlRmlsdGVyIGZyb20gXCIuL2RhdGVGaWx0ZXIuanNcIjtcclxuaW1wb3J0IGZlZWRiYWNrIGZyb20gXCIuL2hlYXRtYXBGZWVkYmFja1wiO1xyXG5cclxuLy8gSUQgb2Ygc2V0SW50ZXJ2YWwgZnVuY3Rpb24gdXNlZCB0byBtb25pdG9yIGNvbnRhaW5lciB3aWR0aCBhbmQgcmVwYWludCBoZWF0bWFwIGlmIGNvbnRhaW5lciB3aWR0aCBjaGFuZ2VzXHJcbmxldCBpbnRlcnZhbElkO1xyXG4vLyBnbG9iYWwgdmFyaWFibGUgdG8gc3RvcmUgZmV0Y2hlZCBzaG90c1xyXG5sZXQgZ2xvYmFsU2hvdHNBcnI7XHJcbmxldCBqb2luVGFibGVBcnIgPSBbXTtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHVzZWQgd2l0aCBiYWxsIHNwZWVkIGZpbHRlciBvbiBoZWF0bWFwc1xyXG5sZXQgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlcyB1c2VkIHdpdGggZGF0ZSByYW5nZSBmaWx0ZXJcclxubGV0IHN0YXJ0RGF0ZTtcclxubGV0IGVuZERhdGU7XHJcblxyXG4vLyBGSVhNRTogcmVuZGVyaW5nIGEgc2F2ZWQgaGVhdG1hcCB3aXRoIGRhdGUgZmlsdGVyIHNvbWV0aW1lcyBidWdzIG91dFxyXG5cclxuY29uc3QgaGVhdG1hcERhdGEgPSB7XHJcblxyXG4gIGdldFVzZXJTaG90cygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVtb3ZlcyBhbiBleGlzdGluZyBoZWF0bWFwIGlmIG5lY2Vzc2FyeSBhbmQgdGhlbiBkZXRlcm1pbmVzIHdoZXRoZXJcclxuICAgIC8vIHRvIGNhbGwgdGhlIGJhc2ljIGhlYXRtYXAgb3Igc2F2ZWQgaGVhdG1hcCBmdW5jdGlvbnNcclxuXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG5cclxuICAgIGNvbnN0IGhlYXRtYXBOYW1lID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXVxyXG4gICAgY29uc3QgZ29hbEhlYXRtYXBDYW52YXMgPSBnb2FsQ29udGFpbmVyLmNoaWxkTm9kZXNbMV1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIGFscmVhZHkgYSBoZWF0bWFwIGxvYWRlZCwgcmVtb3ZlIGl0IGJlZm9yZSBjb250aW51aW5nXHJcbiAgICBpZiAoZmllbGRIZWF0bWFwQ2FudmFzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZmllbGRIZWF0bWFwQ2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICBnb2FsSGVhdG1hcENhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgaWYgKGhlYXRtYXBOYW1lID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaGVhdG1hcE5hbWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBmZXRjaEJhc2ljSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIGRhdGFiYXNlIGFuZCByZXRyaWV2ZXMgc2hvdHMgdGhhdCBtZWV0IHNwZWNpZmljIGZpbHRlcnMgKGFsbCBzaG90cyBmZXRjaGVkIGlmIClcclxuICAgIGxldCBnYW1lSWRzX2RhdGUgPSBbXTtcclxuICAgIGxldCBnYW1lSWRzX3Jlc3VsdCA9IFtdO1xyXG4gICAgbGV0IGdhbWVJZHMgPSBbXTsgLy8gYXJyYXkgdGhhdCBjb250YWlucyBnYW1lIElEIHZhbHVlcyBwYXNzaW5nIGJvdGggdGhlIGRhdGUgYW5kIGdhbWUgcmVzdWx0IGZpbHRlcnNcclxuICAgIGNvbnN0IGdhbWVSZXN1bHRGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lUmVzdWx0XCIpLnZhbHVlO1xyXG4gICAgY29uc3QgZ2FtZVVSTGV4dGVuc2lvbiA9IGhlYXRtYXBEYXRhLmFwcGx5R2FtZUZpbHRlcnMoKTtcclxuXHJcbiAgICBBUEkuZ2V0QWxsKGdhbWVVUkxleHRlbnNpb24pXHJcbiAgICAgIC50aGVuKGdhbWVzID0+IHtcclxuICAgICAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICAgICAgLy8gdGhlIGRhdGUgZmlsdGVyIGFuZCBnYW1lIHJlc3VsdHMgZmlsdGVycyBjYW5ub3QgYmUgYXBwbGllZCBpbiB0aGUgSlNPTiBzZXJ2ZXIgVVJMLCBzbyB0aGUgZmlsdGVycyBhcmVcclxuICAgICAgICAgIC8vIGNhbGxlZCBoZXJlLiBFYWNoIGZ1bmN0aW9uIHBvcHVsYXRlcyBhbiBhcnJheSB3aXRoIGdhbWUgSURzIHRoYXQgbWF0Y2ggdGhlIGZpbHRlciByZXF1aXJlbWVudHMuXHJcbiAgICAgICAgICAvLyBhIGZpbHRlciBtZXRob2QgaXMgdGhlbiB1c2VkIHRvIGNvbGxlY3QgYWxsIG1hdGNoaW5nIGdhbWUgSURzIGZyb20gdGhlIHR3byBhcnJheXMgKGkuZS4gYSBnYW1lIHRoYXQgcGFzc2VkXHJcbiAgICAgICAgICAvLyB0aGUgcmVxdWlyZW1lbnRzIG9mIGJvdGggZmlsdGVycylcclxuICAgICAgICAgIC8vIE5PVEU6IGlmIHN0YXJ0IGRhdGUgaXMgbm90IGRlZmluZWQsIHRoZSByZXN1bHQgZmlsdGVyIGlzIHRoZSBvbmx5IGZ1bmN0aW9uIGNhbGxlZCwgYW5kIGl0IGlzIHBhc3NlZCB0aGUgdGhpcmQgYXJyYXlcclxuICAgICAgICAgIGlmIChzdGFydERhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBkYXRlRmlsdGVyLmFwcGx5ZGF0ZUZpbHRlcihzdGFydERhdGUsIGVuZERhdGUsIGdhbWVJZHNfZGF0ZSwgZ2FtZSk7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEYXRhLmFwcGx5R2FtZVJlc3VsdEZpbHRlcihnYW1lUmVzdWx0RmlsdGVyLCBnYW1lSWRzX3Jlc3VsdCwgZ2FtZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5hcHBseUdhbWVSZXN1bHRGaWx0ZXIoZ2FtZVJlc3VsdEZpbHRlciwgZ2FtZUlkcywgZ2FtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZiAoc3RhcnREYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGdhbWVJZHMgPSBnYW1lSWRzX2RhdGUuZmlsdGVyKGlkID0+IGdhbWVJZHNfcmVzdWx0LmluY2x1ZGVzKGlkKSlcclxuICAgICAgICAgIHJldHVybiBnYW1lSWRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZ2FtZUlkcztcclxuICAgICAgfSlcclxuICAgICAgLnRoZW4oZ2FtZUlkcyA9PiB7XHJcbiAgICAgICAgaWYgKGdhbWVJZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBhbGVydChcIlNvcnJ5ISBFaXRoZXIgbm8gc2hvdHMgaGF2ZSBiZWVuIHNhdmVkIHlldCBvciBubyBnYW1lcyBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLiBWaXNpdCB0aGUgR2FtZXBsYXkgcGFnZSB0byBnZXQgc3RhcnRlZCBvciB0byBhZGQgbW9yZSBzaG90cy5cIilcclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBzaG90VVJMZXh0ZW5zaW9uID0gaGVhdG1hcERhdGEuYXBwbHlTaG90RmlsdGVycyhnYW1lSWRzKTtcclxuICAgICAgICAgIEFQSS5nZXRBbGwoc2hvdFVSTGV4dGVuc2lvbilcclxuICAgICAgICAgICAgLnRoZW4oc2hvdHMgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChzaG90cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiU29ycnkhIE5vIHNob3RzIG1hdGNoIHRoZSBjdXJyZW50IGZpbHRlcnMuIFZpc2l0IHRoZSBHYW1lcGxheSBwYWdlIHRvIGdldCBzdGFydGVkIG9yIGFkZCB0byBtb3JlIHNob3RzLlwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGdsb2JhbFNob3RzQXJyID0gc2hvdHM7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgICAgIGZlZWRiYWNrLmxvYWRGZWVkYmFjayhzaG90cyk7XHJcbiAgICAgICAgICAgICAgICAvLyBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoaGVhdG1hcERhdGEuZ2V0QWN0aXZlT2Zmc2V0cywgNTAwKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9LFxyXG5cclxuICBmZXRjaFNhdmVkSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uLCBhbmQgaXRzIGNvdW50ZXJwYXJ0IGZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyByZW5kZXIgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwIHRob3VnaCB0aGVzZSBzdGVwczpcclxuICAgIC8vIDEuIGdldHRpbmcgdGhlIGhlYXRtYXAgbmFtZSBmcm9tIHRoZSBkcm9wZG93biB2YWx1ZVxyXG4gICAgLy8gMi4gdXNpbmcgdGhlIG5hbWUgdG8gZmluZCB0aGUgY2hpbGROb2RlcyBpbmRleCBvZiB0aGUgZHJvcGRvd24gdmFsdWUgKGkuZS4gd2hpY2ggSFRNTCA8b3B0aW9uPikgYW5kIGdldCBpdHMgSURcclxuICAgIC8vIDMuIGZldGNoIGFsbCBzaG90X2hlYXRtYXAgam9pbiB0YWJsZXMgd2l0aCBtYXRjaGluZyBoZWF0bWFwIElEXHJcbiAgICAvLyA0LiBmZXRjaCBzaG90cyB1c2luZyBzaG90IElEcyBmcm9tIGpvaW4gdGFibGVzXHJcbiAgICAvLyA1LiByZW5kZXIgaGVhdG1hcCBieSBjYWxsaW5nIGJ1aWxkIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8vIHN0ZXAgMTogZ2V0IG5hbWUgb2YgaGVhdG1hcFxyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBsZXQgY3VycmVudERyb3Bkb3duVmFsdWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcbiAgICAvLyBzdGVwIDI6IHVzZSBuYW1lIHRvIGdldCBoZWF0bWFwIElEIHN0b3JlZCBpbiBIVE1MIG9wdGlvbiBlbGVtZW50XHJcbiAgICBsZXQgY3VycmVudEhlYXRtYXBJZDtcclxuICAgIGhlYXRtYXBEcm9wZG93bi5jaGlsZE5vZGVzLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgICBpZiAoY2hpbGQudGV4dENvbnRlbnQgPT09IGN1cnJlbnREcm9wZG93blZhbHVlKSB7XHJcbiAgICAgICAgY3VycmVudEhlYXRtYXBJZCA9IGNoaWxkLmlkLnNsaWNlKDgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIHN0ZXAgMzogZmV0Y2ggam9pbiB0YWJsZXNcclxuICAgIEFQSS5nZXRBbGwoYHNob3RfaGVhdG1hcD9oZWF0bWFwSWQ9JHtjdXJyZW50SGVhdG1hcElkfWApXHJcbiAgICAgIC50aGVuKGpvaW5UYWJsZXMgPT4gaGVhdG1hcERhdGEuZmV0Y2hTYXZlZFNob3RzVXNpbmdKb2luVGFibGVzKGpvaW5UYWJsZXMpXHJcbiAgICAgICAgLy8gc3RlcCA1OiBwYXNzIHNob3RzIHRvIGJ1aWxkRmllbGRIZWF0bWFwKCkgYW5kIGJ1aWxkR29hbEhlYXRtYXAoKVxyXG4gICAgICAgIC50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgIC8vIGFwcGx5IGRhdGUgZmlsdGVyIGlmIGZpbHRlciBoYXMgYmVlbiBzZXRcclxuICAgICAgICAgIGlmIChzdGFydERhdGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBsZXQgc2hvdHNNYXRjaGluZ0ZpbHRlciA9IFtdO1xyXG4gICAgICAgICAgICBkYXRlRmlsdGVyLmFwcGx5ZGF0ZUZpbHRlclRvU2F2ZWRIZWF0bWFwKHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgc2hvdHMsIHNob3RzTWF0Y2hpbmdGaWx0ZXIpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90c01hdGNoaW5nRmlsdGVyKTtcclxuICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90c01hdGNoaW5nRmlsdGVyIC8vIElNUE9SVEFOVCEgcHJldmVudHMgZXJyb3IgaW4gaGVhdG1hcCBzYXZlIHdoZW4gcmVuZGVyaW5nIHNhdmVkIG1hcCBhZnRlciByZW5kZXJpbmcgYmFzaWMgaGVhdG1hcFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90cyAvLyBJTVBPUlRBTlQhIHByZXZlbnRzIGVycm9yIGluIGhlYXRtYXAgc2F2ZSB3aGVuIHJlbmRlcmluZyBzYXZlZCBtYXAgYWZ0ZXIgcmVuZGVyaW5nIGJhc2ljIGhlYXRtYXBcclxuICAgICAgICAgICAgZmVlZGJhY2subG9hZEZlZWRiYWNrKHNob3RzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGpvaW5UYWJsZUFyciA9IFtdO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIClcclxuICB9LFxyXG5cclxuICBmZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMoam9pblRhYmxlcykge1xyXG4gICAgLy8gc2VlIG5vdGVzIG9uIGZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpXHJcbiAgICBqb2luVGFibGVzLmZvckVhY2godGFibGUgPT4ge1xyXG4gICAgICAvLyBzdGVwIDQuIHRoZW4gZmV0Y2ggdXNpbmcgZWFjaCBzaG90SWQgaW4gdGhlIGpvaW4gdGFibGVzXHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5nZXRTaW5nbGVJdGVtKFwic2hvdHNcIiwgdGFibGUuc2hvdElkKSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoam9pblRhYmxlQXJyKVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5R2FtZUZpbHRlcnMoKSB7XHJcbiAgICAvLyBOT1RFOiBnYW1lIHJlc3VsdCBmaWx0ZXIgKHZpY3RvcnkvZGVmZWF0KSBjYW5ub3QgYmUgYXBwbGllZCBpbiB0aGlzIGZ1bmN0aW9uIGFuZCBpcyBhcHBsaWVkIGFmdGVyIHRoZSBmZXRjaFxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZU1vZGVcIikudmFsdWU7XHJcbiAgICBjb25zdCBnYW1ldHlwZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVUeXBlXCIpLnZhbHVlO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1vdmVydGltZVwiKS52YWx1ZTtcclxuICAgIGNvbnN0IHRlYW1TdGF0dXNGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci10ZWFtU3RhdHVzXCIpLnZhbHVlO1xyXG5cclxuICAgIGxldCBVUkwgPSBcImdhbWVzXCI7XHJcblxyXG4gICAgVVJMICs9IGA/dXNlcklkPSR7YWN0aXZlVXNlcklkfWA7XHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGlmIChnYW1lTW9kZUZpbHRlciA9PT0gXCJDb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZtb2RlPWNvbXBldGl0aXZlXCJcclxuICAgIH0gZWxzZSBpZiAoZ2FtZU1vZGVGaWx0ZXIgPT09IFwiQ2FzdWFsXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm1vZGU9Y2FzdWFsXCJcclxuICAgIH1cclxuICAgIC8vIGdhbWUgdHlwZVxyXG4gICAgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjN2M1wiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTN2M1wiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjJ2MlwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTJ2MlwiXHJcbiAgICB9IGVsc2UgaWYgKGdhbWV0eXBlRmlsdGVyID09PSBcIjF2MVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZ0eXBlPTF2MVwiXHJcbiAgICB9XHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgaWYgKG92ZXJ0aW1lRmlsdGVyID09PSBcIk9UXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm92ZXJ0aW1lPXRydWVcIlxyXG4gICAgfSBlbHNlIGlmIChvdmVydGltZUZpbHRlciA9PT0gXCJObyBPVFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZvdmVydGltZT1mYWxzZVwiXHJcbiAgICB9XHJcbiAgICAvLyB0ZWFtIHN0YXR1c1xyXG4gICAgaWYgKHRlYW1TdGF0dXNGaWx0ZXIgPT09IFwiTm8gcGFydHlcIikge1xyXG4gICAgICBVUkwgKz0gXCImcGFydHk9ZmFsc2VcIlxyXG4gICAgfSBlbHNlIGlmICh0ZWFtU3RhdHVzRmlsdGVyID09PSBcIlBhcnR5XCIpIHtcclxuICAgICAgVVJMICs9IFwiJnBhcnR5PXRydWVcIlxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBVUkw7XHJcbiAgfSxcclxuXHJcbiAgYXBwbHlHYW1lUmVzdWx0RmlsdGVyKGdhbWVSZXN1bHRGaWx0ZXIsIGdhbWVJZHMsIGdhbWUpIHtcclxuICAgIC8vIGlmIHZpY3RvcnksIHRoZW4gY2hlY2sgZm9yIGdhbWUncyBzY29yZSB2cyBnYW1lJ3Mgb3Bwb25lbnQgc2NvcmVcclxuICAgIC8vIGlmIHRoZSBmaWx0ZXIgaXNuJ3Qgc2VsZWN0ZWQgYXQgYWxsLCBwdXNoIGFsbCBnYW1lIElEcyB0byBnYW1lSWRzIGFycmF5XHJcbiAgICBpZiAoZ2FtZVJlc3VsdEZpbHRlciA9PT0gXCJWaWN0b3J5XCIpIHtcclxuICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChnYW1lUmVzdWx0RmlsdGVyID09PSBcIkRlZmVhdFwiKSB7XHJcbiAgICAgIGlmIChnYW1lLnNjb3JlIDwgZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBhcHBseVNob3RGaWx0ZXJzKGdhbWVJZHMpIHtcclxuICAgIGNvbnN0IHNob3RUeXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItc2hvdFR5cGVcIikudmFsdWU7XHJcbiAgICBsZXQgVVJMID0gXCJzaG90c1wiXHJcblxyXG4gICAgLy8gZ2FtZSBJRFxyXG4gICAgLy8gZm9yIGVhY2ggZ2FtZUlkLCBhcHBlbmQgVVJMLiBBcHBlbmQgJiBpbnN0ZWFkIG9mID8gb25jZSBmaXJzdCBnYW1lSWQgaXMgYWRkZWQgdG8gVVJMXHJcbiAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGxldCBnYW1lSWRDb3VudCA9IDA7XHJcbiAgICAgIGdhbWVJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgaWYgKGdhbWVJZENvdW50IDwgMSkge1xyXG4gICAgICAgICAgVVJMICs9IGA/Z2FtZUlkPSR7aWR9YDtcclxuICAgICAgICAgIGdhbWVJZENvdW50Kys7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIFVSTCArPSBgJmdhbWVJZD0ke2lkfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSAvLyBlbHNlIHN0YXRlbWVudCBpcyBoYW5kbGVkIGluIGZldGNoQmFzaWNIZWF0bWFwRGF0YSgpXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGlmIChzaG90VHlwZUZpbHRlciA9PT0gXCJBZXJpYWxcIikge1xyXG4gICAgICBVUkwgKz0gXCImYWVyaWFsPXRydWVcIjtcclxuICAgIH0gZWxzZSBpZiAoc2hvdFR5cGVGaWx0ZXIgPT09IFwiU3RhbmRhcmRcIikge1xyXG4gICAgICBVUkwgKz0gXCImYWVyaWFsPWZhbHNlXCJcclxuICAgIH1cclxuICAgIHJldHVybiBVUkw7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQXJyYXkgb2Ygc2hvdHNcIiwgc2hvdHMpXHJcblxyXG4gICAgLy8gY3JlYXRlIGZpZWxkIGhlYXRtYXAgd2l0aCBjb25maWd1cmF0aW9uXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGxldCB2YXJXaWR0aCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHZhckhlaWdodCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICBsZXQgZmllbGRDb25maWcgPSBoZWF0bWFwRGF0YS5nZXRGaWVsZENvbmZpZyhmaWVsZENvbnRhaW5lcik7XHJcblxyXG4gICAgbGV0IGZpZWxkSGVhdG1hcEluc3RhbmNlO1xyXG4gICAgZmllbGRIZWF0bWFwSW5zdGFuY2UgPSBoZWF0bWFwLmNyZWF0ZShmaWVsZENvbmZpZyk7XHJcblxyXG4gICAgbGV0IGZpZWxkRGF0YVBvaW50cyA9IFtdO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCB4XyA9IE51bWJlcigoc2hvdC5maWVsZFggKiB2YXJXaWR0aCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB5XyA9IE51bWJlcigoc2hvdC5maWVsZFkgKiB2YXJIZWlnaHQpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgdmFsdWVfID0gMTtcclxuICAgICAgLy8gc2V0IHZhbHVlIGFzIGJhbGwgc3BlZWQgaWYgc3BlZWQgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICAgIHZhbHVlXyA9IHNob3QuYmFsbF9zcGVlZDtcclxuICAgICAgfVxyXG4gICAgICBsZXQgZmllbGRPYmogPSB7IHg6IHhfLCB5OiB5XywgdmFsdWU6IHZhbHVlXyB9O1xyXG4gICAgICBmaWVsZERhdGFQb2ludHMucHVzaChmaWVsZE9iaik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBmaWVsZERhdGEgPSB7XHJcbiAgICAgIG1heDogMSxcclxuICAgICAgbWluOiAwLFxyXG4gICAgICBkYXRhOiBmaWVsZERhdGFQb2ludHNcclxuICAgIH07XHJcblxyXG4gICAgLy8gc2V0IG1heCB2YWx1ZSBhcyBtYXggYmFsbCBzcGVlZCBpbiBzaG90cywgaWYgZmlsdGVyIGlzIHNlbGVjdGVkXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgbGV0IG1heEJhbGxTcGVlZCA9IHNob3RzLnJlZHVjZSgobWF4LCBzaG90KSA9PiBzaG90LmJhbGxfc3BlZWQgPiBtYXggPyBzaG90LmJhbGxfc3BlZWQgOiBtYXgsIHNob3RzWzBdLmJhbGxfc3BlZWQpO1xyXG4gICAgICBmaWVsZERhdGEubWF4ID0gbWF4QmFsbFNwZWVkO1xyXG4gICAgfVxyXG5cclxuICAgIGZpZWxkSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZmllbGREYXRhKTtcclxuXHJcbiAgICBsZXQgaW5pdGlhbFdpZHRoID0gdmFyV2lkdGg7XHJcblxyXG4gICAgaWYgKGludGVydmFsSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsSWQpO1xyXG4gICAgICBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkgeyBoZWF0bWFwRGF0YS5nZXRBY3RpdmVPZmZzZXRzKGZpZWxkQ29udGFpbmVyLCBpbml0aWFsV2lkdGgsIHNob3RzKTsgfSwgNTAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGludGVydmFsSWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7IGhlYXRtYXBEYXRhLmdldEFjdGl2ZU9mZnNldHMoZmllbGRDb250YWluZXIsIGluaXRpYWxXaWR0aCwgc2hvdHMpOyB9LCA1MDApO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBnZXRBY3RpdmVPZmZzZXRzKGZpZWxkQ29udGFpbmVyLCBpbml0aWFsV2lkdGgsIHNob3RzKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGV2YWx1YXRlcyB0aGUgd2lkdGggb2YgdGhlIGhlYXRtYXAgY29udGFpbmVyIGF0IDAuNSBzZWNvbmQgaW50ZXJ2YWxzLiBJZiB0aGUgd2lkdGggaGFzIGNoYW5nZWQsXHJcbiAgICAvLyB0aGVuIHRoZSBoZWF0bWFwIGNhbnZhcyBpcyByZXBhaW50ZWQgdG8gZml0IHdpdGhpbiB0aGUgY29udGFpbmVyIGxpbWl0c1xyXG4gICAgbGV0IHdpZHRoID0gaW5pdGlhbFdpZHRoO1xyXG5cclxuICAgIGxldCBjYXB0dXJlV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aFxyXG4gICAgLy9ldmFsdWF0ZSBjb250YWluZXIgd2lkdGggYWZ0ZXIgMC41IHNlY29uZHMgdnMgaW5pdGlhbCBjb250YWluZXIgd2lkdGhcclxuICAgIGlmIChjYXB0dXJlV2lkdGggPT09IHdpZHRoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwidW5jaGFuZ2VkXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2lkdGggPSBjYXB0dXJlV2lkdGg7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwibmV3IHdpZHRoXCIsIHdpZHRoKTtcclxuICAgICAgLy8gcmVtb3ZlIGN1cnJlbnQgaGVhdG1hcHNcclxuICAgICAgY29uc3QgaGVhdG1hcENhbnZhc0FyciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuaGVhdG1hcC1jYW52YXNcIik7XHJcbiAgICAgIGhlYXRtYXBDYW52YXNBcnJbMF0ucmVtb3ZlKCk7XHJcbiAgICAgIGhlYXRtYXBDYW52YXNBcnJbMV0ucmVtb3ZlKCk7XHJcbiAgICAgIC8vIHJlcGFpbnQgc2FtZSBoZWF0bWFwIGluc3RhbmNlXHJcbiAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKTtcclxuICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90cyk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHb2FsSGVhdG1hcChzaG90cykge1xyXG4gICAgLy8gY3JlYXRlIGdvYWwgaGVhdG1hcCB3aXRoIGNvbmZpZ3VyYXRpb25cclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGxldCB2YXJHb2FsV2lkdGggPSBnb2FsQ29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHZhckdvYWxIZWlnaHQgPSBnb2FsQ29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICBsZXQgZ29hbENvbmZpZyA9IGhlYXRtYXBEYXRhLmdldEdvYWxDb25maWcoZ29hbENvbnRhaW5lcik7XHJcblxyXG4gICAgbGV0IEdvYWxIZWF0bWFwSW5zdGFuY2U7XHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZ29hbENvbmZpZyk7XHJcblxyXG4gICAgbGV0IGdvYWxEYXRhUG9pbnRzID0gW107XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IHhfID0gTnVtYmVyKChzaG90LmdvYWxYICogdmFyR29hbFdpZHRoKS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHlfID0gTnVtYmVyKChzaG90LmdvYWxZICogdmFyR29hbEhlaWdodCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB2YWx1ZV8gPSAxO1xyXG4gICAgICAvLyBzZXQgdmFsdWUgYXMgYmFsbCBzcGVlZCBpZiBzcGVlZCBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgICAgaWYgKGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkKSB7XHJcbiAgICAgICAgdmFsdWVfID0gc2hvdC5iYWxsX3NwZWVkO1xyXG4gICAgICB9XHJcbiAgICAgIGxldCBnb2FsT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZ29hbERhdGFQb2ludHMucHVzaChnb2FsT2JqKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGdvYWxEYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZ29hbERhdGFQb2ludHNcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgbWF4IHZhbHVlIGFzIG1heCBiYWxsIHNwZWVkIGluIHNob3RzLCBpZiBmaWx0ZXIgaXMgc2VsZWN0ZWRcclxuICAgIGlmIChjb25maWdIZWF0bWFwV2l0aEJhbGxzcGVlZCkge1xyXG4gICAgICBsZXQgbWF4QmFsbFNwZWVkID0gc2hvdHMucmVkdWNlKChtYXgsIHNob3QpID0+IHNob3QuYmFsbF9zcGVlZCA+IG1heCA/IHNob3QuYmFsbF9zcGVlZCA6IG1heCwgc2hvdHNbMF0uYmFsbF9zcGVlZCk7XHJcbiAgICAgIGdvYWxEYXRhLm1heCA9IG1heEJhbGxTcGVlZDtcclxuICAgIH1cclxuXHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZ29hbERhdGEpO1xyXG4gIH0sXHJcblxyXG4gIGdldEZpZWxkQ29uZmlnKGZpZWxkQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMjVweCBhdCA1NTBweCB3aWR0aCwgb3IgNC41NDUlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGZpZWxkQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IDAuMDQ1NDU0NTQ1ICogZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC42LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuODVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMzVweCBhdCA1NTBweCB3aWR0aCwgb3IgNi4zNjMlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGdvYWxDb250YWluZXIsXHJcbiAgICAgIHJhZGl1czogLjA2MzYzNjM2MyAqIGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC42LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuODVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgYmFsbFNwZWVkTWF4KCkge1xyXG4gICAgLy8gdGhpcyBidXR0b24gZnVuY3Rpb24gY2FsbGJhY2sgKGl0J3MgYSBmaWx0ZXIpIGNoYW5nZXMgYSBib29sZWFuIGdsb2JhbCB2YXJpYWJsZSB0aGF0IGRldGVybWluZXMgdGhlIG1pbiBhbmQgbWF4IHZhbHVlc1xyXG4gICAgLy8gdXNlZCB3aGVuIHJlbmRlcmluZyB0aGUgaGVhdG1hcHMgKHNlZSBidWlsZEZpZWxkSGVhdG1hcCgpIGFuZCBidWlsZEdvYWxIZWF0bWFwKCkpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZEJ0blwiKTtcclxuXHJcbiAgICBpZiAoY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQpIHtcclxuICAgICAgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbmZpZ0hlYXRtYXBXaXRoQmFsbHNwZWVkID0gdHJ1ZTtcclxuICAgICAgYmFsbFNwZWVkQnRuLmNsYXNzTGlzdC50b2dnbGUoXCJpcy1vdXRsaW5lZFwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzYXZlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHNhdmluZyBhIGhlYXRtYXAgb2JqZWN0IHdpdGggYSBuYW1lLCB1c2VySWQsIGFuZCBkYXRlIC0gdGhlbiBtYWtpbmcgam9pbiB0YWJsZXMgd2l0aCBoZWF0bWFwSWQgYW5kIGVhY2ggc2hvdElkXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGNvbnN0IHNhdmVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIikpO1xyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwQnRuXCIpO1xyXG4gICAgbGV0IGhlYXRtYXBOYW1lSXNVbmlxdWUgPSB0cnVlO1xyXG5cclxuICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gdHJ1ZTsgLy8gaW1tZWRpYXRlbHkgZGlzYWJsZSBzYXZlIGJ1dHRvbiB0byBwcmV2ZW50IG11bHRpcGxlIGNsaWNrc1xyXG4gICAgY29uc3QgaGVhdG1hcFRpdGxlID0gc2F2ZUlucHV0LnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXTtcclxuXHJcbiAgICAvLyAxLiBoZWF0bWFwIG11c3QgaGF2ZSB0aXRsZSAmIHRoZSB0aXRsZSBjYW5ub3QgYmUgXCJTYXZlIHN1Y2Nlc3NmdWwhXCIgb3IgXCJCYXNpYyBIZWF0bWFwXCIgb3IgXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCIgb3IgXCJObyB0aXRsZSBwcm92aWRlZFwiIG9yIFwiSGVhdG1hcCBuYW1lIG5vdCB1bmlxdWVcIlxyXG4gICAgLy8gMi4gdGhlcmUgbXVzdCBiZSBhIGhlYXRtYXAgY2FudmFzIGxvYWRlZCBvbiB0aGUgcGFnZVxyXG4gICAgLy8gMy4gKHNlZSBzZWNvbmQgaWYgc3RhdGVtZW50KSB0aGUgc2F2ZSBidXR0b24gd2lsbCByZXNwb25kIHdvcmsgaWYgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHNhdmUgYW4gYWxyZWFkeS1zYXZlZCBoZWF0bWFwXHJcbiAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA+IDAgJiYgaGVhdG1hcFRpdGxlICE9PSBcIlNhdmUgc3VjY2Vzc2Z1bFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJCYXNpYyBIZWF0bWFwXCIgJiYgaGVhdG1hcFRpdGxlICE9PSBcIkNhbm5vdCBzYXZlIHByaW9yIGhlYXRtYXBcIiAmJiBoZWF0bWFwVGl0bGUgIT09IFwiQ2Fubm90IHNhdmUgcHJpb3IgaGVhdG1hcFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJIZWF0bWFwIG5hbWUgbm90IHVuaXF1ZVwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyB0aXRsZSBwcm92aWRlZFwiICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJObyBoZWF0bWFwIGxvYWRlZFwiICYmIGZpZWxkSGVhdG1hcENhbnZhcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChoZWF0bWFwRHJvcGRvd24udmFsdWUgIT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJDYW5ub3Qgc2F2ZSBwcmlvciBoZWF0bWFwXCJcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGNoZWNrIGZvciB1bmlxdWUgaGVhdG1hcCBuYW1lIC0gaWYgaXQncyB1bmlxdWUgdGhlbiBzYXZlIHRoZSBoZWF0bWFwIGFuZCBqb2luIHRhYmxlc1xyXG4gICAgICAgIEFQSS5nZXRBbGwoYGhlYXRtYXBzP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gICAgICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhoZWF0bWFwcylcclxuICAgICAgICAgICAgaGVhdG1hcHMuZm9yRWFjaChoZWF0bWFwID0+IHtcclxuICAgICAgICAgICAgICBpZiAoaGVhdG1hcC5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGhlYXRtYXBUaXRsZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBoZWF0bWFwTmFtZUlzVW5pcXVlID0gZmFsc2UgLy8gaWYgYW55IG5hbWVzIG1hdGNoLCB2YXJpYWJsZSBiZWNvbWVzIGZhbHNlXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvLyBpZiBuYW1lIGlzIHVuaXF1ZSAtIGFsbCBjb25kaXRpb25zIG1ldCAtIHNhdmUgaGVhdG1hcFxyXG4gICAgICAgICAgICBpZiAoaGVhdG1hcE5hbWVJc1VuaXF1ZSkge1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICAgICAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtc3VjY2Vzc1wiKTtcclxuICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5zYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUsIGFjdGl2ZVVzZXJJZClcclxuICAgICAgICAgICAgICAgIC50aGVuKGhlYXRtYXBPYmogPT4gaGVhdG1hcERhdGEuc2F2ZUpvaW5UYWJsZXMoaGVhdG1hcE9iaikudGhlbih4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqb2luIHRhYmxlcyBzYXZlZFwiLCB4KVxyXG4gICAgICAgICAgICAgICAgICAvLyBlbXB0eSB0aGUgdGVtcG9yYXJ5IGdsb2JhbCBhcnJheSB1c2VkIHdpdGggUHJvbWlzZS5hbGxcclxuICAgICAgICAgICAgICAgICAgam9pblRhYmxlQXJyID0gW107XHJcbiAgICAgICAgICAgICAgICAgIC8vIGFwcGVuZCBuZXdseSBjcmVhdGVkIGhlYXRtYXAgYXMgb3B0aW9uIGVsZW1lbnQgaW4gc2VsZWN0IGRyb3Bkb3duXHJcbiAgICAgICAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwgeyBcImlkXCI6IGBoZWF0bWFwLSR7aGVhdG1hcE9iai5pZH1gIH0sIGAke2hlYXRtYXBPYmoudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXX06ICR7aGVhdG1hcE9iai5uYW1lfWApKTtcclxuICAgICAgICAgICAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJTYXZlIHN1Y2Nlc3NmdWxcIjtcclxuICAgICAgICAgICAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgICAgICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIkhlYXRtYXAgbmFtZSBub3QgdW5pcXVlXCI7XHJcbiAgICAgICAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHNhdmVJbnB1dC52YWx1ZSA9IFwiTm8gdGl0bGUgcHJvdmlkZWRcIjtcclxuICAgICAgICBzYXZlSGVhdG1hcEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2UgaWYgKGZpZWxkSGVhdG1hcENhbnZhcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJObyBoZWF0bWFwIGxvYWRlZFwiO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBCdG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNhdmVIZWF0bWFwT2JqZWN0KGhlYXRtYXBUaXRsZSwgYWN0aXZlVXNlcklkKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHNhdmVzIGEgaGVhdG1hcCBvYmplY3Qgd2l0aCB0aGUgdXNlci1wcm92aWRlZCBuYW1lLCB0aGUgdXNlcklkLCBhbmQgdGhlIGN1cnJlbnQgZGF0ZS90aW1lXHJcbiAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuICAgIGNvbnN0IGhlYXRtYXBPYmogPSB7XHJcbiAgICAgIG5hbWU6IGhlYXRtYXBUaXRsZSxcclxuICAgICAgdXNlcklkOiBhY3RpdmVVc2VySWQsXHJcbiAgICAgIHRpbWVTdGFtcDogdGltZVN0YW1wXHJcbiAgICB9XHJcbiAgICByZXR1cm4gQVBJLnBvc3RJdGVtKFwiaGVhdG1hcHNcIiwgaGVhdG1hcE9iailcclxuICB9LFxyXG5cclxuICBzYXZlSm9pblRhYmxlcyhoZWF0bWFwT2JqKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImdsb2JhbHNob3RzYXJyYXlcIiwgZ2xvYmFsU2hvdHNBcnIpXHJcbiAgICBnbG9iYWxTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgam9pblRhYmxlT2JqID0ge1xyXG4gICAgICAgIHNob3RJZDogc2hvdC5pZCxcclxuICAgICAgICBoZWF0bWFwSWQ6IGhlYXRtYXBPYmouaWRcclxuICAgICAgfVxyXG4gICAgICBqb2luVGFibGVBcnIucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90X2hlYXRtYXBcIiwgam9pblRhYmxlT2JqKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2luVGFibGVBcnIpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdGhlIGxvZ2ljIHRoYXQgcHJldmVudHMgdGhlIHVzZXIgZnJvbSBkZWxldGluZyBhIGhlYXRtYXAgaW4gb25lIGNsaWNrLlxyXG4gICAgLy8gYSBzZWNvbmQgZGVsZXRlIGJ1dHRvbiBhbmQgYSBjYW5jZWwgYnV0dG9uIGFyZSByZW5kZXJlZCBiZWZvcmUgYSBkZWxldGUgaXMgY29uZmlybWVkXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBpZiAoY3VycmVudERyb3Bkb3duVmFsdWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlSGVhdG1hcEJ0blwiKTtcclxuICAgICAgY29uc3QgY29uZmlybURlbGV0ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDb25maXJtIERlbGV0ZVwiKTtcclxuICAgICAgY29uc3QgcmVqZWN0RGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJDYW5jZWxcIik7XHJcbiAgICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZGVsZXRlQ29udHJvbFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGNvbmZpcm1EZWxldGVCdG4sIHJlamVjdERlbGV0ZUJ0bik7XHJcbiAgICAgIGRlbGV0ZUhlYXRtYXBCdG4ucmVwbGFjZVdpdGgoRGVsZXRlQ29udHJvbCk7XHJcbiAgICAgIGNvbmZpcm1EZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmNvbmZpcm1IZWF0bWFwRGVsZXRpb24pO1xyXG4gICAgICByZWplY3REZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLnJlamVjdEhlYXRtYXBEZWxldGlvbik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcmVqZWN0SGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZS1yZW5kZXJzIHRoZSBwcmltYXJ5IGRlbGV0ZSBidXR0b25cclxuICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUNvbnRyb2xcIik7XHJcbiAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImRlbGV0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkRlbGV0ZSBIZWF0bWFwXCIpXHJcbiAgICBEZWxldGVDb250cm9sLnJlcGxhY2VXaXRoKGRlbGV0ZUhlYXRtYXBCdG4pXHJcbiAgICBkZWxldGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwKTtcclxuICB9LFxyXG5cclxuICBjb25maXJtSGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB3aWxsIGRlbGV0ZSB0aGUgc2VsZWN0ZWQgaGVhdG1hcCBvcHRpb24gaW4gdGhlIGRyb3Bkb3duIGxpc3QgYW5kIHJlbW92ZSBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkge1xyXG4gICAgICAgIGNoaWxkLnJlbW92ZSgpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXBPYmplY3RhbmRKb2luVGFibGVzKGNoaWxkLmlkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24udmFsdWUgPSBcIkJhc2ljIEhlYXRtYXBcIjtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9LFxyXG5cclxuICBkZWxldGVIZWF0bWFwT2JqZWN0YW5kSm9pblRhYmxlcyhoZWF0bWFwSWQpIHtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICByZXR1cm4gQVBJLmRlbGV0ZUl0ZW0oXCJoZWF0bWFwc1wiLCBgJHtoZWF0bWFwSWQuc2xpY2UoOCl9P3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gIH0sXHJcblxyXG4gIGhhbmRsZUJhbGxTcGVlZEdsb2JhbFZhcmlhYmxlcygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCBieSB0aGUgcmVzZXQgZmlsdGVycyBidXR0b24gYW5kIG5hdmJhciBoZWF0bWFwcyB0YWIgdG8gZm9yY2UgdGhlIGJhbGwgc3BlZWQgZmlsdGVyIG9mZlxyXG4gICAgY29uZmlnSGVhdG1hcFdpdGhCYWxsc3BlZWQgPSBmYWxzZTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKHJldHVybkJvb2xlYW4sIHN0YXJ0RGF0ZUlucHV0LCBlbmREYXRlSW5wdXQpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBTRVQgdGhlIGRhdGUgZmlsdGVyIGdsb2JhbCB2YXJpYWJsZXMgb24gdGhpcyBwYWdlIG9yIENMRUFSIHRoZW1cclxuICAgIC8vIGlmIHRoZSAxLiBwYWdlIGlzIHJlbG9hZGVkIG9yIDIuIHRoZSBcInJlc2V0IGZpbHRlcnNcIiBidXR0b24gaXMgY2xpY2tlZFxyXG5cclxuICAgIC8vIHRoZSBkYXRlRmlsdGVyLmpzIGNhbmNlbCBidXR0b24gcmVxdWVzdHMgYSBnbG9iYWwgdmFyIHRvIGRldGVybWluZSBob3cgdG8gaGFuZGxlIGJ1dHRvbiBjb2xvclxyXG4gICAgaWYgKHJldHVybkJvb2xlYW4pIHtcclxuICAgICAgcmV0dXJuIHN0YXJ0RGF0ZVxyXG4gICAgfVxyXG4gICAgLy8gaWYgbm8gaW5wdXQgdmFsdWVzIGFyZSBwcm92aWRlZCwgdGhhdCBtZWFucyB0aGUgdmFyaWFibGVzIG5lZWQgdG8gYmUgcmVzZXQgYW5kIHRoZSBkYXRlXHJcbiAgICAvLyBmaWx0ZXIgYnV0dG9uIHNob3VsZCBiZSBvdXRsaW5lZCAtIGVsc2Ugc2V0IGdsb2JhbCB2YXJzIGZvciBmaWx0ZXJcclxuICAgIGlmIChzdGFydERhdGVJbnB1dCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHN0YXJ0RGF0ZSA9IHVuZGVmaW5lZDtcclxuICAgICAgZW5kRGF0ZSA9IHVuZGVmaW5lZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHN0YXJ0RGF0ZSA9IHN0YXJ0RGF0ZUlucHV0O1xyXG4gICAgICBlbmREYXRlID0gZW5kRGF0ZUlucHV0O1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBwYWdlcyBzbyB0aGF0IHRoZSB3ZWJwYWdlIGRvZXNuJ3QgY29udGludWUgcnVubmluZyB0aGUgaGVhdG1hcCBjb250YWluZXIgd2lkdGggdHJhY2tlclxyXG4gICAgaWYgKGludGVydmFsSWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsSWQpO1xyXG4gICAgICBpbnRlcnZhbElkID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGhlYXRtYXBEYXRhIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5cclxuY29uc3QgZmVlZGJhY2sgPSB7XHJcblxyXG4gIGxvYWRGZWVkYmFjayhzaG90cykge1xyXG5cclxuICAgIC8vIGZpcnN0LCB1c2UgdGhlIHNob3RzIHdlIGhhdmUgdG8gZmV0Y2ggdGhlIGdhbWVzIHRoZXkncmUgYXNzb2NpYXRlZCB3aXRoXHJcbiAgICBsZXQgZ2FtZUlkcyA9IFtdO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGdhbWVJZHMucHVzaChzaG90LmdhbWVJZCk7XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIHJlbW92ZSBkdXBsaWNhdGUgZ2FtZSBJRHNcclxuICAgIGdhbWVJZHMgPSBnYW1lSWRzLmZpbHRlcigoaXRlbSwgaWR4KSA9PiB7XHJcbiAgICAgIHJldHVybiBnYW1lSWRzLmluZGV4T2YoaXRlbSkgPT0gaWR4O1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5mZXRjaEdhbWVzKGdhbWVJZHMpXHJcbiAgICAgIC50aGVuKGdhbWVzID0+IHRoaXMuY2FsY3VsYXRlRmVlZGJhY2soc2hvdHMsIGdhbWVzKSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIGZldGNoR2FtZXMoZ2FtZUlkcykge1xyXG4gICAgbGV0IGdhbWVzID0gW107XHJcbiAgICBnYW1lSWRzLmZvckVhY2goZ2FtZUlkID0+IHtcclxuICAgICAgZ2FtZXMucHVzaChBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGdhbWVJZCkpXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChnYW1lcylcclxuICB9LFxyXG5cclxuICBjYWxjdWxhdGVGZWVkYmFjayhzaG90cywgZ2FtZXMpIHtcclxuXHJcbiAgICBsZXQgZmVlZGJhY2tSZXN1bHRzID0ge307XHJcblxyXG4gICAgLy8gZ2V0IGhlYXRtYXAgZGF0ZSBnZW5lcmF0ZWRcclxuICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCk7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubm93ID0gbm93O1xyXG5cclxuICAgIC8vIGdldCByYW5nZSBvZiBkYXRlcyBvbiBnYW1lcyAobWF4IGFuZCBtaW4pXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWUgPSBnYW1lcy5yZWR1Y2UoKG1heCwgZ2FtZSkgPT4gZ2FtZS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdID4gbWF4ID8gZ2FtZS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdIDogbWF4LCBnYW1lc1swXS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdKTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWUgPSBnYW1lcy5yZWR1Y2UoKG1pbiwgZ2FtZSkgPT4gZ2FtZS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdIDwgbWluID8gZ2FtZS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdIDogbWluLCBnYW1lc1swXS50aW1lU3RhbXAuc3BsaXQoXCJUXCIpWzBdKTtcclxuXHJcblxyXG4gICAgLy8gZ2V0IGF2ZXJhZ2UgZmllbGQgeCx5IGNvb3JkaW5hdGUgb2YgcGxheWVyIGJhc2VkIG9uIHNob3RzIGFuZCBnaXZlIHBsYXllciBmZWVkYmFja1xyXG4gICAgbGV0IHN1bVggPSAwO1xyXG4gICAgbGV0IHN1bVkgPSAwO1xyXG4gICAgbGV0IGF2Z1g7XHJcbiAgICBsZXQgYXZnWTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBzdW1YICs9IHNob3QuZmllbGRYO1xyXG4gICAgICBzdW1ZICs9IHNob3QuZmllbGRZO1xyXG4gICAgfSlcclxuXHJcbiAgICBhdmdYID0gc3VtWCAvIHNob3RzLmxlbmd0aDtcclxuICAgIGF2Z1kgPSBzdW1ZIC8gc2hvdHMubGVuZ3RoO1xyXG4gICAgbGV0IGZpZWxkUG9zaXRpb247XHJcblxyXG4gICAgaWYgKGF2Z1ggPCAwLjE1KSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIktlZXBlclwiXHJcbiAgICB9IGVsc2UgaWYgKDAuMTUgPD0gYXZnWCAmJiBhdmdYIDw9IDAuMzApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiU3dlZXBlclwiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDwgMC40NSAmJiBhdmdZIDw9IDAuNDApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiTGVmdCBGdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuMzAgPD0gYXZnWCAmJiBhdmdYIDwgMC40NSAmJiAwLjYwIDw9IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiUmlnaHQgRnVsbGJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjMwIDw9IGF2Z1ggJiYgYXZnWCA8PSAwLjQ1KSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkNlbnRlciBGdWxsYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDwgMC42MCAmJiBhdmdZIDw9IDAuNDApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiTGVmdCBIYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNDUgPD0gYXZnWCAmJiBhdmdYIDwgMC42MCAmJiAwLjYwIDw9IGF2Z1kpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiUmlnaHQgSGFsZmJhY2tcIlxyXG4gICAgfSBlbHNlIGlmICgwLjQ1IDw9IGF2Z1ggJiYgYXZnWCA8PSAwLjYwKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIkNlbnRlciBIYWxmYmFja1wiXHJcbiAgICB9IGVsc2UgaWYgKDAuNjAgPD0gYXZnWCAmJiBhdmdYIDwgMC43NSAmJiBhdmdZIDw9IDAuNTApIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiTGVmdCBGb3J3YXJkXCJcclxuICAgIH0gZWxzZSBpZiAoMC42MCA8PSBhdmdYICYmIGF2Z1ggPCAwLjc1ICYmIDAuNTAgPCBhdmdZKSB7XHJcbiAgICAgIGZpZWxkUG9zaXRpb24gPSBcIlJpZ2h0IEZvcndhcmRcIlxyXG4gICAgfSBlbHNlIGlmICgwLjc1IDw9IGF2Z1gpIHtcclxuICAgICAgZmllbGRQb3NpdGlvbiA9IFwiU3RyaWtlclwiXHJcbiAgICB9XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmZpZWxkUG9zaXRpb24gPSBmaWVsZFBvc2l0aW9uXHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIHBsYXllcnMgdGhhdCBjb21wbGltZW50IHRoZSBwbGF5ZXIncyBzdHlsZVxyXG4gICAgbGV0IGNvbXBsZW1lbnRBO1xyXG4gICAgbGV0IGNvbXBsZW1lbnRCO1xyXG5cclxuICAgIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIktlZXBlclwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJMZWZ0IEZvcndhcmRcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIlJpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJTd2VlcGVyXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkNlbnRlciBIYWxmYmFja1wiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiTGVmdCBGdWxsYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiUmlnaHQgRnVsbEJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJTdHJpa2VyXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiQ2VudGVyIEZ1bGxiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQvUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkxlZnQgSGFsZmJhY2tcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiUmlnaHQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlJpZ2h0IEhhbGZiYWNrXCIpIHtcclxuICAgICAgY29tcGxlbWVudEEgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgICBjb21wbGVtZW50QiA9IFwiU3RyaWtlclwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIkNlbnRlciBIYWxmYmFja1wiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJTdHJpa2VyXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJMZWZ0L1JpZ2h0IEZvcndhcmRcIjtcclxuICAgIH0gZWxzZSBpZiAoZmllbGRQb3NpdGlvbiA9PT0gXCJMZWZ0IEZvcndhcmRcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiQ2VudGVyIEhhbGZiYWNrXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJSaWdodCBGb3J3YXJkXCI7XHJcbiAgICB9IGVsc2UgaWYgKGZpZWxkUG9zaXRpb24gPT09IFwiUmlnaHQgRm9yd2FyZFwiKSB7XHJcbiAgICAgIGNvbXBsZW1lbnRBID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgICAgY29tcGxlbWVudEIgPSBcIkxlZnQgRm9yd2FyZFwiO1xyXG4gICAgfSBlbHNlIGlmIChmaWVsZFBvc2l0aW9uID09PSBcIlN0cmlrZXJcIikge1xyXG4gICAgICBjb21wbGVtZW50QSA9IFwiTGVmdC9SaWdodCBGb3J3YXJkXCI7XHJcbiAgICAgIGNvbXBsZW1lbnRCID0gXCJDZW50ZXIgSGFsZmJhY2tcIjtcclxuICAgIH1cclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY29tcGxlbWVudEEgPSBjb21wbGVtZW50QTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5jb21wbGVtZW50QiA9IGNvbXBsZW1lbnRCO1xyXG5cclxuICAgIC8vIHNob3RzIHNjb3JlZCBvbiB0ZWFtIHNpZGUgYW5kIG9wcG9uZW50IHNpZGUgb2YgZmllbGQsICYgZGVmZW5zaXZlIHJlZGlyZWN0cyAoaS5lLiB3aXRoaW4ga2VlcGVyIHJhbmdlIG9mIGdvYWwpXHJcbiAgICBsZXQgdGVhbVNpZGUgPSAwO1xyXG4gICAgbGV0IG9wcFNpZGUgPSAwO1xyXG4gICAgbGV0IGRlZmVuc2l2ZVJlZGlyZWN0ID0gMDtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBpZiAoc2hvdC5maWVsZFggPiAwLjUwKSB7XHJcbiAgICAgICAgb3BwU2lkZSsrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRlYW1TaWRlKys7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzaG90LmZpZWxkWCA8IDAuMTUpIHtcclxuICAgICAgICBkZWZlbnNpdmVSZWRpcmVjdCsrO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy50ZWFtU2lkZUdvYWxzID0gdGVhbVNpZGU7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMub3Bwb25lbnRTaWRlR29hbHMgPSBvcHBTaWRlO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmRlZmVuc2l2ZVJlZGlyZWN0ID0gZGVmZW5zaXZlUmVkaXJlY3Q7XHJcblxyXG4gICAgLy8gYWVyaWFsIGNvdW50ICYgcGVyY2VudGFnZSBvZiBhbGwgc2hvdHNcclxuICAgIGxldCBhZXJpYWwgPSAwO1xyXG5cclxuICAgIHNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGlmIChzaG90LmFlcmlhbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGFlcmlhbCsrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgYWVyaWFsUGVyY2VudGFnZSA9IE51bWJlcigoYWVyaWFsIC8gc2hvdHMubGVuZ3RoICogMTAwKS50b0ZpeGVkKDApKTtcclxuXHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuYWVyaWFsID0gYWVyaWFsO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmFlcmlhbFBlcmNlbnRhZ2UgPSBhZXJpYWxQZXJjZW50YWdlO1xyXG5cclxuICAgIC8vIG1heCBiYWxsIHNwZWVkLCBhdmVyYWdlIGJhbGwgc3BlZWQsIHNob3RzIG92ZXIgNzAgbXBoXHJcbiAgICBsZXQgYXZnQmFsbFNwZWVkID0gMDtcclxuICAgIGxldCBzaG90c092ZXI3MG1waCA9IDA7XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgaWYgKHNob3QuYmFsbF9zcGVlZCA+PSA3MCkge1xyXG4gICAgICAgIHNob3RzT3ZlcjcwbXBoKys7XHJcbiAgICAgIH1cclxuICAgICAgYXZnQmFsbFNwZWVkICs9IHNob3QuYmFsbF9zcGVlZFxyXG4gICAgfSk7XHJcblxyXG4gICAgYXZnQmFsbFNwZWVkID0gTnVtYmVyKChhdmdCYWxsU3BlZWQgLyBzaG90cy5sZW5ndGgpLnRvRml4ZWQoMSkpO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5tYXhCYWxsU3BlZWQgPSBzaG90cy5yZWR1Y2UoKG1heCwgc2hvdCkgPT4gc2hvdC5iYWxsX3NwZWVkID4gbWF4ID8gc2hvdC5iYWxsX3NwZWVkIDogbWF4LCBzaG90c1swXS5iYWxsX3NwZWVkKTtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5hdmdCYWxsU3BlZWQgPSBhdmdCYWxsU3BlZWQ7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuc2hvdHNPdmVyNzBtcGggPSBzaG90c092ZXI3MG1waDtcclxuXHJcbiAgICAvLyAzdjMsIDJ2MiwgYW5kIDF2MSBnYW1lcyBwbGF5ZWRcclxuICAgIGxldCBfM3YzID0gMDtcclxuICAgIGxldCBfMnYyID0gMDtcclxuICAgIGxldCBfMXYxID0gMDtcclxuXHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBpZiAoZ2FtZS50eXBlID09PSBcIjN2M1wiKSB7XHJcbiAgICAgICAgXzN2MysrO1xyXG4gICAgICB9IGVsc2UgaWYgKGdhbWUudHlwZSA9PT0gXCIydjJcIikge1xyXG4gICAgICAgIF8ydjIrKztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBfMXYxKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy5fM3YzID0gXzN2MztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5fMnYyID0gXzJ2MjtcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5fMXYxID0gXzF2MTtcclxuXHJcbiAgICAvLyB0b3RhbCBnYW1lcyBwbGF5ZWQsIHRvdGFsIHNob3RzIHNjb3JlZCwgd2lucy9sb3NzZXMvd2luJVxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLnRvdGFsR2FtZXMgPSBnYW1lcy5sZW5ndGg7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMudG90YWxTaG90cyA9IHNob3RzLmxlbmd0aDtcclxuXHJcbiAgICBsZXQgd2lucyA9IDA7XHJcbiAgICBsZXQgbG9zc2VzID0gMDtcclxuXHJcbiAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgd2lucysrXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9zc2VzKys7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZlZWRiYWNrUmVzdWx0cy53aW5zID0gd2lucztcclxuICAgIGZlZWRiYWNrUmVzdWx0cy5sb3NzZXMgPSBsb3NzZXM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMud2luUGN0ID0gTnVtYmVyKCgod2lucyAvICh3aW5zICsgbG9zc2VzKSkgKiAxMDApLnRvRml4ZWQoMCkpO1xyXG5cclxuICAgIC8vIGNvbXAgZ2FtZXMgLyB3aW4gJSwgY2FzdWFsIGdhbWVzIC8gd2luICUsIGdhbWVzIGluIE9UXHJcbiAgICBsZXQgY29tcGV0aXRpdmVHYW1lcyA9IDA7XHJcbiAgICBsZXQgY29tcFdpbiA9IDA7XHJcbiAgICBsZXQgY2FzdWFsR2FtZXMgPSAwO1xyXG4gICAgbGV0IGNhc3VhbFdpbiA9IDA7XHJcbiAgICBsZXQgb3ZlcnRpbWVHYW1lcyA9IDA7XHJcblxyXG4gICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgaWYgKGdhbWUubW9kZSA9PT0gXCJjYXN1YWxcIikge1xyXG4gICAgICAgIGNhc3VhbEdhbWVzKys7XHJcbiAgICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgICAgY2FzdWFsV2luKys7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbXBldGl0aXZlR2FtZXMrKztcclxuICAgICAgICBpZiAoZ2FtZS5zY29yZSA+IGdhbWUub3BwX3Njb3JlKSB7XHJcbiAgICAgICAgICBjb21wV2luKys7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChnYW1lLm92ZXJ0aW1lID09PSB0cnVlKSB7XHJcbiAgICAgICAgb3ZlcnRpbWVHYW1lcysrO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgbGV0IGNvbXBXaW5QY3QgPSAwO1xyXG5cclxuICAgIGlmIChjb21wZXRpdGl2ZUdhbWVzID09PSAwKSB7XHJcbiAgICAgIGNvbXBXaW5QY3QgPSAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29tcFdpblBjdCA9IE51bWJlcigoKGNvbXBXaW4gLyBjb21wZXRpdGl2ZUdhbWVzKSAqIDEwMCkudG9GaXhlZCgwKSk7XHJcbiAgICB9XHJcbiAgICBsZXQgY2FzdWFsV2luUGN0ID0gMDtcclxuXHJcbiAgICBpZiAoY2FzdWFsR2FtZXMgPT09IDApIHtcclxuICAgICAgY2FzdWFsV2luUGN0ID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNhc3VhbFdpblBjdCA9IE51bWJlcigoKGNhc3VhbFdpbiAvIGNhc3VhbEdhbWVzKSAqIDEwMCkudG9GaXhlZCgxKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNvbXBldGl0aXZlR2FtZXMgPSBjb21wZXRpdGl2ZUdhbWVzO1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLmNhc3VhbEdhbWVzID0gY2FzdWFsR2FtZXM7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY29tcFdpblBjdCA9IGNvbXBXaW5QY3Q7XHJcbiAgICBmZWVkYmFja1Jlc3VsdHMuY2FzdWFsV2luUGN0ID0gY2FzdWFsV2luUGN0O1xyXG4gICAgZmVlZGJhY2tSZXN1bHRzLm92ZXJ0aW1lR2FtZXMgPSBvdmVydGltZUdhbWVzO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmJ1aWxkTGV2ZWxzKGZlZWRiYWNrUmVzdWx0cyk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRMZXZlbHMoZmVlZGJhY2tSZXN1bHRzKSB7XHJcblxyXG4gICAgY29uc3QgZmVlZGJhY2tDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBBbmRGZWVkYmFja0NvbnRhaW5lclwiKTtcclxuXHJcbiAgICAvLyByZWZvcm1hdCBoZWF0bWFwIGdlbmVyYXRpb24gdGltZSB0byByZW1vdmUgc2Vjb25kc1xyXG4gICAgY29uc3QgdGltZVJlZm9ybWF0ID0gW2ZlZWRiYWNrUmVzdWx0cy5ub3cuc3BsaXQoXCI6XCIpWzBdLCBmZWVkYmFja1Jlc3VsdHMubm93LnNwbGl0KFwiOlwiKVsxXV0uam9pbihcIjpcIikgKyBmZWVkYmFja1Jlc3VsdHMubm93LnNwbGl0KFwiOlwiKVsyXS5zbGljZSgyKTtcclxuICAgIC8vIHJlZm9ybWF0IGRhdGVzIHdpdGggc2xhc2hlcyBhbmQgcHV0IHllYXIgYXQgZW5kXHJcbiAgICBjb25zdCBkYXRlUmVmb3JtYXQxID0gW2ZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWUuc3BsaXQoXCItXCIpWzFdLCBmZWVkYmFja1Jlc3VsdHMuZmlyc3RHYW1lLnNwbGl0KFwiLVwiKVsyXV0uam9pbihcIi9cIikgKyBcIi9cIiArIGZlZWRiYWNrUmVzdWx0cy5maXJzdEdhbWUuc3BsaXQoXCItXCIpWzBdO1xyXG4gICAgY29uc3QgZGF0ZVJlZm9ybWF0MiA9IFtmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWUuc3BsaXQoXCItXCIpWzFdLCBmZWVkYmFja1Jlc3VsdHMubGFzdEdhbWUuc3BsaXQoXCItXCIpWzJdXS5qb2luKFwiL1wiKSArIFwiL1wiICsgZmVlZGJhY2tSZXN1bHRzLmxhc3RHYW1lLnNwbGl0KFwiLVwiKVswXTtcclxuXHJcbiAgICAvLyBoZWF0bWFwIGdlbmVyYXRpb24gYW5kIHJhbmdlIG9mIGRhdGVzIG9uIGdhbWVzIChtYXggYW5kIG1pbilcclxuICAgIGNvbnN0IGl0ZW0zX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2RhdGVSZWZvcm1hdDJ9YCk7XHJcbiAgICBjb25zdCBpdGVtM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiTGFzdCBnYW1lXCIpO1xyXG4gICAgY29uc3QgaXRlbTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTNfY2hpbGQsIGl0ZW0zX2NoaWxkMilcclxuICAgIGNvbnN0IGl0ZW0zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtM193cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0yX2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2RhdGVSZWZvcm1hdDF9YCk7XHJcbiAgICBjb25zdCBpdGVtMl9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiRmlyc3QgZ2FtZVwiKTtcclxuICAgIGNvbnN0IGl0ZW0yX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yX2NoaWxkLCBpdGVtMl9jaGlsZDIpXHJcbiAgICBjb25zdCBpdGVtMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHt0aW1lUmVmb3JtYXR9YCk7XHJcbiAgICBjb25zdCBpdGVtMV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiSGVhdG1hcCBnZW5lcmF0ZWRcIik7XHJcbiAgICBjb25zdCBpdGVtMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMV9jaGlsZCwgaXRlbTFfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczFfSGVhdG1hcERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stMVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMSwgaXRlbTIsIGl0ZW0zKVxyXG5cclxuICAgIC8vIHBsYXllciBmZWVkYmFjayBiYXNlZCBvbiBhdmVyYWdlIGZpZWxkIHgseSBjb29yZGluYXRlIG9mIHBsYXllciBzaG90c1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRCfWApO1xyXG4gICAgY29uc3QgaXRlbTZfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDJcIik7XHJcbiAgICBjb25zdCBpdGVtNl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNl9jaGlsZCwgaXRlbTZfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW02X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmNvbXBsZW1lbnRBfWApO1xyXG4gICAgY29uc3QgaXRlbTVfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkNvbXBsZW1lbnRpbmcgcGxheWVyIDFcIik7XHJcbiAgICBjb25zdCBpdGVtNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNV9jaGlsZCwgaXRlbTVfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW01X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmZpZWxkUG9zaXRpb259YCk7XHJcbiAgICBjb25zdCBpdGVtNF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiWW91ciBwbGF5c3R5bGVcIik7XHJcbiAgICBjb25zdCBpdGVtNF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtNF9jaGlsZCwgaXRlbTRfY2hpbGQyKVxyXG4gICAgY29uc3QgaXRlbTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW00X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczJfcGxheWVyVHlwZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmZWVkYmFjay0yXCIsIFwiY2xhc3NcIjogXCJjb2x1bW5zXCIgfSwgbnVsbCwgaXRlbTQsIGl0ZW01LCBpdGVtNilcclxuXHJcbiAgICAvLyBzaG90cyBvbiB0ZWFtL29wcG9uZW50IHNpZGVzIG9mIGZpZWxkLCBkZWZlbnNpdmUgcmVkaXJlY3RzLCBhbmQgYWVyaWFsIHNob3RzIC8gJVxyXG4gICAgY29uc3QgaXRlbTlfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmRlZmVuc2l2ZVJlZGlyZWN0fWApO1xyXG4gICAgY29uc3QgaXRlbTlfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlJlZGlyZWN0cyBmcm9tIE93biBHb2FsXCIpO1xyXG4gICAgY29uc3QgaXRlbTlfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTlfY2hpbGQsIGl0ZW05X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtOSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTlfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtOF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudGVhbVNpZGVHb2Fsc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5vcHBvbmVudFNpZGVHb2Fsc31gKTtcclxuICAgIGNvbnN0IGl0ZW04X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJHb2FscyBCZWhpbmQgJiBCZXlvbmQgTWlkZmllbGRcIik7XHJcbiAgICBjb25zdCBpdGVtOF93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtOF9jaGlsZCwgaXRlbThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW04ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtOF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW03X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5hZXJpYWx9IDogJHtmZWVkYmFja1Jlc3VsdHMuYWVyaWFsUGVyY2VudGFnZX0lYCk7XHJcbiAgICBjb25zdCBpdGVtN19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQWVyaWFsIEdvYWwgVG90YWwgJiBQY3RcIik7XHJcbiAgICBjb25zdCBpdGVtN193cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtN19jaGlsZCwgaXRlbTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW03ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtN193cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnMzX3Nob3REZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTNcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtNywgaXRlbTgsIGl0ZW05KVxyXG5cclxuICAgIC8vIG1heCBiYWxsIHNwZWVkLCBhdmVyYWdlIGJhbGwgc3BlZWQsIHNob3RzIG92ZXIgNzAgbXBoXHJcbiAgICBjb25zdCBpdGVtMTJfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnNob3RzT3ZlcjcwbXBofWApO1xyXG4gICAgY29uc3QgaXRlbTEyX2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJTaG90cyBPdmVyIDcwIG1waFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMl93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTJfY2hpbGQsIGl0ZW0xMl9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTEyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTJfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLmF2Z0JhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIkF2ZXJhZ2UgQmFsbCBTcGVlZFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xMV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTFfY2hpbGQsIGl0ZW0xMV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTExID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTFfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLm1heEJhbGxTcGVlZH0gbXBoYCk7XHJcbiAgICBjb25zdCBpdGVtMTBfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIk1heCBCYWxsIFNwZWVkXCIpO1xyXG4gICAgY29uc3QgaXRlbTEwX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xMF9jaGlsZCwgaXRlbTEwX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTAgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xMF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGNvbHVtbnM0X2JhbGxEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTRcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnMgaGFzLWJhY2tncm91bmQtd2hpdGUtdGVyXCIgfSwgbnVsbCwgaXRlbTEwLCBpdGVtMTEsIGl0ZW0xMilcclxuXHJcbiAgICAvLyB0b3RhbCBnYW1lcyBwbGF5ZWQsIHRvdGFsIHNob3RzIHNjb3JlZCwgd2lucy9sb3NzZXMvd2luJVxyXG4gICAgY29uc3QgaXRlbTE1X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy53aW5zfSA6ICR7ZmVlZGJhY2tSZXN1bHRzLmxvc3Nlc30gOiAke2ZlZWRiYWNrUmVzdWx0cy53aW5QY3R9JWApO1xyXG4gICAgY29uc3QgaXRlbTE1X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCJXaW5zLCBMb3NzZXMsICYgV2luIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xNV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTVfY2hpbGQsIGl0ZW0xNV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTVfd3JhcHBlcik7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLnRvdGFsU2hvdHN9YCk7XHJcbiAgICBjb25zdCBpdGVtMTRfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIlRvdGFsIEdvYWxzXCIpO1xyXG4gICAgY29uc3QgaXRlbTE0X3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0xNF9jaGlsZCwgaXRlbTE0X2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMTQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0xNF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMudG90YWxHYW1lc31gKTtcclxuICAgIGNvbnN0IGl0ZW0xM19jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiVG90YWwgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTNfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTEzX2NoaWxkLCBpdGVtMTNfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTEzX3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczVfdmljdG9yeURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stNVwiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTMsIGl0ZW0xNCwgaXRlbTE1KVxyXG5cclxuICAgIC8vIDN2MywgMnYyLCBhbmQgMXYxIGdhbWVzIHBsYXllZFxyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMXYxfWApO1xyXG4gICAgY29uc3QgaXRlbTE4X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIxdjEgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMThfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE4X2NoaWxkLCBpdGVtMThfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xOCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE4X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fMnYyfWApO1xyXG4gICAgY29uc3QgaXRlbTE3X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIydjIgZ2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTdfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE3X2NoaWxkLCBpdGVtMTdfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE3X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkMiA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwidGl0bGUgaXMtNlwiIH0sIGAke2ZlZWRiYWNrUmVzdWx0cy5fM3YzfWApO1xyXG4gICAgY29uc3QgaXRlbTE2X2NoaWxkID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJoZWFkaW5nXCIgfSwgXCIzdjMgR2FtZXNcIik7XHJcbiAgICBjb25zdCBpdGVtMTZfd3JhcHBlciA9IGVsQnVpbGRlcihcImRpdlwiLCB7fSwgbnVsbCwgaXRlbTE2X2NoaWxkLCBpdGVtMTZfY2hpbGQyKTtcclxuICAgIGNvbnN0IGl0ZW0xNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb2x1bW4gaXMtb25lLXRoaXJkIGhhcy10ZXh0LWNlbnRlcmVkXCIgfSwgbnVsbCwgaXRlbTE2X3dyYXBwZXIpO1xyXG4gICAgY29uc3QgY29sdW1uczZfZ2FtZVR5cGVEZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZlZWRiYWNrLTZcIiwgXCJjbGFzc1wiOiBcImNvbHVtbnNcIiB9LCBudWxsLCBpdGVtMTYsIGl0ZW0xNywgaXRlbTE4KVxyXG5cclxuICAgIC8vIGNvbXAgZ2FtZXMgLyB3aW4gJSwgY2FzdWFsIGdhbWVzIC8gd2luICUsIGdhbWVzIGluIE9UXHJcbiAgICBjb25zdCBpdGVtMjFfY2hpbGQyID0gZWxCdWlsZGVyKFwicFwiLCB7IFwiY2xhc3NcIjogXCJ0aXRsZSBpcy02XCIgfSwgYCR7ZmVlZGJhY2tSZXN1bHRzLm92ZXJ0aW1lR2FtZXN9YCk7XHJcbiAgICBjb25zdCBpdGVtMjFfY2hpbGQgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcImhlYWRpbmdcIiB9LCBcIk92ZXJ0aW1lIEdhbWVzXCIpO1xyXG4gICAgY29uc3QgaXRlbTIxX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yMV9jaGlsZCwgaXRlbTIxX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0yMV93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0yMF9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY29tcGV0aXRpdmVHYW1lc30gOiAke2ZlZWRiYWNrUmVzdWx0cy5jb21wV2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0yMF9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ29tcGV0aXRpdmUgR2FtZXMgJiBXaW4gUGN0XCIpO1xyXG4gICAgY29uc3QgaXRlbTIwX3dyYXBwZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge30sIG51bGwsIGl0ZW0yMF9jaGlsZCwgaXRlbTIwX2NoaWxkMik7XHJcbiAgICBjb25zdCBpdGVtMjAgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29sdW1uIGlzLW9uZS10aGlyZCBoYXMtdGV4dC1jZW50ZXJlZFwiIH0sIG51bGwsIGl0ZW0yMF93cmFwcGVyKTtcclxuICAgIGNvbnN0IGl0ZW0xOV9jaGlsZDIgPSBlbEJ1aWxkZXIoXCJwXCIsIHsgXCJjbGFzc1wiOiBcInRpdGxlIGlzLTZcIiB9LCBgJHtmZWVkYmFja1Jlc3VsdHMuY2FzdWFsR2FtZXN9IDogJHtmZWVkYmFja1Jlc3VsdHMuY2FzdWFsV2luUGN0fSVgKTtcclxuICAgIGNvbnN0IGl0ZW0xOV9jaGlsZCA9IGVsQnVpbGRlcihcInBcIiwgeyBcImNsYXNzXCI6IFwiaGVhZGluZ1wiIH0sIFwiQ2FzdWFsIEdhbWVzICYgV2luIFBjdFwiKTtcclxuICAgIGNvbnN0IGl0ZW0xOV93cmFwcGVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHt9LCBudWxsLCBpdGVtMTlfY2hpbGQsIGl0ZW0xOV9jaGlsZDIpO1xyXG4gICAgY29uc3QgaXRlbTE5ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbHVtbiBpcy1vbmUtdGhpcmQgaGFzLXRleHQtY2VudGVyZWRcIiB9LCBudWxsLCBpdGVtMTlfd3JhcHBlcik7XHJcbiAgICBjb25zdCBjb2x1bW5zN19vdmVydGltZURldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmVlZGJhY2stN1wiLCBcImNsYXNzXCI6IFwiY29sdW1ucyBoYXMtYmFja2dyb3VuZC13aGl0ZS10ZXJcIiB9LCBudWxsLCBpdGVtMTksIGl0ZW0yMCwgaXRlbTIxKVxyXG5cclxuICAgIC8vIHJlcGxhY2Ugb2xkIGNvbnRlbnQgaWYgaXQncyBhbHJlYWR5IG9uIHRoZSBwYWdlXHJcbiAgICBjb25zdCBmZWVkYmFjazEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTFcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTJcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTNcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTRcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTVcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTZcIik7XHJcbiAgICBjb25zdCBmZWVkYmFjazcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZlZWRiYWNrLTdcIik7XHJcblxyXG4gICAgaWYgKGZlZWRiYWNrMSAhPT0gbnVsbCkge1xyXG4gICAgICBmZWVkYmFjazEucmVwbGFjZVdpdGgoY29sdW1uczFfSGVhdG1hcERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazIucmVwbGFjZVdpdGgoY29sdW1uczJfcGxheWVyVHlwZSk7XHJcbiAgICAgIGZlZWRiYWNrMy5yZXBsYWNlV2l0aChjb2x1bW5zM19zaG90RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNC5yZXBsYWNlV2l0aChjb2x1bW5zNF9iYWxsRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNS5yZXBsYWNlV2l0aChjb2x1bW5zNV92aWN0b3J5RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrNi5yZXBsYWNlV2l0aChjb2x1bW5zNl9nYW1lVHlwZURldGFpbHMpO1xyXG4gICAgICBmZWVkYmFjazcucmVwbGFjZVdpdGgoY29sdW1uczdfb3ZlcnRpbWVEZXRhaWxzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnMxX0hlYXRtYXBEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczJfcGxheWVyVHlwZSk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM0X2JhbGxEZXRhaWxzKTtcclxuICAgICAgZmVlZGJhY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoY29sdW1uczNfc2hvdERldGFpbHMpO1xyXG4gICAgICBmZWVkYmFja0NvbnRhaW5lci5hcHBlbmRDaGlsZChjb2x1bW5zNV92aWN0b3J5RGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM2X2dhbWVUeXBlRGV0YWlscyk7XHJcbiAgICAgIGZlZWRiYWNrQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvbHVtbnM3X292ZXJ0aW1lRGV0YWlscyk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZlZWRiYWNrXHJcblxyXG5cclxuLypcclxuLSBIZWF0bWFwIGdlbmVyYXRlZCBvblxyXG4tIHN0YXJ0IGRhdGVcclxuLSBlbmQgZGF0ZVxyXG4tLS0tLS0tLS0tLS0tXHJcbi0gcmVsZXZhbnQgc29jY2VyIHBvc2l0aW9uIGJhc2VkIG9uIGF2ZyBzY29yZSBwb3NpdGlvblxyXG4tIHBhaXJlZCBiZXN0IHdpdGggMVxyXG4tIHBhaXJlZCBiZXN0IHdpdGggMlxyXG4tLS0tLS0tLS0tLS0tLVxyXG4tIHNob3RzIHNjb3JlZCBsZWZ0IC8gcmlnaHQgb2YgbWlkZmllbGRcclxuLSBzaG90cyBzY29yZWQgYXMgcmVkaXJlY3RzIGJlc2lkZSBvd24gZ29hbCAoRGVmZW5zaXZlIHJlZGlyZWN0cylcclxuLSBhZXJpYWwgY291bnQgJiBzaG90ICVcclxuLS0tLS0tLS0tLS0tLS1cclxuLSBtYXggYmFsbCBzcGVlZFxyXG4tIGF2ZyBiYWxsIHNwZWVkXHJcbi0gc2hvdHMgb3ZlciA3MG1waCAofiAxMTAga3BoKVxyXG4tLS0tLS0tLS0tLS0tLVxyXG4tIDN2MyBnYW1lcyBwbGF5ZWRcclxuLSAydjIgZ2FtZXMgcGxheWVkXHJcbi0gMXYxIGdhbWVzIHBsYXllZFxyXG4tLS0tLS0tLS0tLS0tXHJcbi0gdG90YWwgZ2FtZXMgcGxheWVkXHJcbi0gdG90YWwgc2hvdHMgc2NvcmVkXHJcbi0gd2luIC8gbG9zcyAvIHdpbiVcclxuLS0tLS0tLS0tLS0tLVxyXG4tIGNvbXAgZ2FtZXMgLyB3aW4gJVxyXG4tIGNhc3VhbCBnYW1lcyAvIHdpbiAlXHJcbi0gZ2FtZXMgaW4gT1RcclxuLS0tLS0tLS0tLS0tLVxyXG5cclxuKi8iLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiO1xyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgZGF0ZUZpbHRlciBmcm9tIFwiLi9kYXRlRmlsdGVyXCI7XHJcbmltcG9ydCBmZWVkYmFjayBmcm9tIFwiLi9oZWF0bWFwRmVlZGJhY2tcIjtcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBoZWF0bWFwcyA9IHtcclxuXHJcbiAgbG9hZEhlYXRtYXBDb250YWluZXJzKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgdGhpcy5idWlsZEZpbHRlcnMoKTtcclxuICAgIC8vIGJ1aWxkcyBidXR0b24gdG8gZ2VuZXJhdGUgaGVhdG1hcCwgc2F2ZSBoZWF0bWFwLCBhbmQgdmlldyBzYXZlZCBoZWF0bWFwc1xyXG4gICAgLy8gdGhlIGFjdGlvbiBpcyBhc3luYyBiZWNhdXNlIHRoZSB1c2VyJ3Mgc2F2ZWQgaGVhdG1hcHMgaGF2ZSB0byBiZSByZW5kZXJlZCBhcyBIVE1MIG9wdGlvbiBlbGVtZW50c1xyXG4gICAgdGhpcy5idWlsZEdlbmVyYXRvcigpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmlsdGVycygpIHtcclxuXHJcbiAgICAvLyByZXNldCBidXR0b25cclxuICAgIGNvbnN0IHJlc2V0QnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInJlc2V0RmlsdGVyc0J0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiUmVzZXQgRmlsdGVyc1wiKTtcclxuXHJcbiAgICAvLyBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZUJ0blRleHQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHt9LCBcIkRhdGVzXCIpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhciBmYS1jYWxlbmRhclwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsXCIgfSwgbnVsbCwgZGF0ZUJ0bkljb24pO1xyXG4gICAgY29uc3QgZGF0ZUJ0biA9IGVsQnVpbGRlcihcImFcIiwge1wiaWRcIjpcImRhdGVSYW5nZUJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLW91dGxpbmVkIGlzLWRhcmtcIiB9LCBudWxsLCBkYXRlQnRuSWNvblNwYW4sIGRhdGVCdG5UZXh0KTtcclxuICAgIGNvbnN0IGRhdGVCdG5QYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRhdGVCdG4pO1xyXG5cclxuICAgIC8vIGJhbGwgc3BlZWQgYnV0dG9uXHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5UZXh0ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7fSwgXCJCYWxsIFNwZWVkXCIpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWJvbHRcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGJhbGxTcGVlZEJ0bkljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsXCIgfSwgbnVsbCwgYmFsbFNwZWVkQnRuSWNvbik7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG4gPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLW91dGxpbmVkIGlzLWRhcmtcIiB9LCBudWxsLCBiYWxsU3BlZWRCdG5JY29uU3BhbiwgYmFsbFNwZWVkQnRuVGV4dCk7XHJcbiAgICBjb25zdCBiYWxsU3BlZWRCdG5QYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGJhbGxTcGVlZEJ0bik7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGNvbnN0IGljb242ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtY2xvY2tcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjYpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBzZWw2X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPVFwiKTtcclxuICAgIGNvbnN0IHNlbDZfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIE9UXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItb3ZlcnRpbWVcIiB9LCBudWxsLCBzZWw2X29wMSwgc2VsNl9vcDIsIHNlbDZfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q2LCBpY29uU3BhbjYpO1xyXG4gICAgY29uc3QgY29udHJvbDYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjYpO1xyXG5cclxuICAgIC8vIHJlc3VsdFxyXG4gICAgY29uc3QgaWNvbjUgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS10cm9waHlcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjUpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUmVzdWx0XCIpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiVmljdG9yeVwiKTtcclxuICAgIGNvbnN0IHNlbDVfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkRlZmVhdFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDUgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLWdhbWVSZXN1bHRcIiB9LCBudWxsLCBzZWw1X29wMSwgc2VsNV9vcDIsIHNlbDVfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q1LCBpY29uU3BhbjUpO1xyXG4gICAgY29uc3QgY29udHJvbDUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjUpO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZVxyXG4gICAgY29uc3QgaWNvbjQgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1zaXRlbWFwXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb240KTtcclxuICAgIGNvbnN0IHNlbDRfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkdhbWUgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3A0ID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDQgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLWdhbWVUeXBlXCIgfSwgbnVsbCwgc2VsNF9vcDEsIHNlbDRfb3AyLCBzZWw0X29wMywgc2VsNF9vcDQpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDQsIGljb25TcGFuNCk7XHJcbiAgICBjb25zdCBjb250cm9sNCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2NCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBpY29uMyA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWdhbWVwYWRcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMyA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjMpO1xyXG4gICAgY29uc3Qgc2VsM19vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiR2FtZSBNb2RlXCIpO1xyXG4gICAgY29uc3Qgc2VsM19vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBzZWwzX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBzZWxlY3QzID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImZpbHRlci1nYW1lTW9kZVwiIH0sIG51bGwsIHNlbDNfb3AxLCBzZWwzX29wMiwgc2VsM19vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDMsIGljb25TcGFuMyk7XHJcbiAgICBjb25zdCBjb250cm9sMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Myk7XHJcblxyXG4gICAgLy8gcGFydHlcclxuICAgIGNvbnN0IGljb24yID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtaGFuZHNoYWtlXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24yKTtcclxuICAgIGNvbnN0IHNlbDJfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlRlYW1cIik7XHJcbiAgICBjb25zdCBzZWwyX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBwYXJ0eVwiKTtcclxuICAgIGNvbnN0IHNlbDJfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlBhcnR5XCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJmaWx0ZXItdGVhbVN0YXR1c1wiIH0sIG51bGwsIHNlbDJfb3AxLCBzZWwyX29wMiwgc2VsMl9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDIsIGljb25TcGFuMik7XHJcbiAgICBjb25zdCBjb250cm9sMiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Mik7XHJcblxyXG4gICAgLy8gc2hvdCB0eXBlXHJcbiAgICBjb25zdCBpY29uMSA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWZ1dGJvbFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW4xID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uMSk7XHJcbiAgICBjb25zdCBzZWwxX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTaG90IFR5cGVcIik7XHJcbiAgICBjb25zdCBzZWwxX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBzZWwxX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTdGFuZGFyZFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDEgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZmlsdGVyLXNob3RUeXBlXCIgfSwgbnVsbCwgc2VsMV9vcDEsIHNlbDFfb3AyLCBzZWwxX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MSwgaWNvblNwYW4xKTtcclxuICAgIGNvbnN0IGNvbnRyb2wxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYxKTtcclxuXHJcbiAgICBjb25zdCBmaWx0ZXJGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWx0ZXJGaWVsZFwiLCBcImNsYXNzXCI6IFwiZmllbGQgaXMtZ3JvdXBlZCBpcy1ncm91cGVkLWNlbnRlcmVkIGlzLWdyb3VwZWQtbXVsdGlsaW5lXCIgfSwgbnVsbCwgY29udHJvbDEsIGNvbnRyb2wyLCBjb250cm9sMywgY29udHJvbDQsIGNvbnRyb2w1LCBjb250cm9sNiwgYmFsbFNwZWVkQnRuUGFyZW50LCBkYXRlQnRuUGFyZW50LCByZXNldEJ0bik7XHJcbiAgICBjb25zdCBQYXJlbnRGaWx0ZXJDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGZpbHRlckZpZWxkKTtcclxuXHJcbiAgICAvLyBhcHBlbmQgZmlsdGVyIGNvbnRhaW5lciB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEZpbHRlckNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHZW5lcmF0b3IoKSB7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIC8vIHVzZSBmZXRjaCB0byBhcHBlbmQgb3B0aW9ucyB0byBzZWxlY3QgZWxlbWVudCBpZiB1c2VyIGF0IGxlYXN0IDEgc2F2ZWQgaGVhdG1hcFxyXG4gICAgQVBJLmdldEFsbChgaGVhdG1hcHM/dXNlcklkPSR7YWN0aXZlVXNlcklkfWApXHJcbiAgICAgIC50aGVuKGhlYXRtYXBzID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkFycmF5IG9mIHVzZXIncyBzYXZlZCBoZWF0bWFwczpcIiwgaGVhdG1hcHMpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZmlyZVwiIH0sIG51bGwpO1xyXG4gICAgICAgIGNvbnN0IGljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uKTtcclxuICAgICAgICBjb25zdCBzZWwxX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCYXNpYyBIZWF0bWFwXCIpO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJoZWF0bWFwRHJvcGRvd25cIiB9LCBudWxsLCBzZWwxX29wMSk7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcFNlbGVjdERpdiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIGhlYXRtYXBEcm9wZG93biwgaWNvblNwYW4pO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBoZWF0bWFwU2VsZWN0RGl2KTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJkZWxldGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJEZWxldGUgSGVhdG1hcFwiKVxyXG4gICAgICAgIGNvbnN0IGRlbGV0ZUJ0bkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRlbGV0ZUhlYXRtYXBCdG4pXHJcbiAgICAgICAgY29uc3Qgc2F2ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgSGVhdG1hcFwiKVxyXG4gICAgICAgIGNvbnN0IHNhdmVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBzYXZlQnRuKVxyXG4gICAgICAgIGNvbnN0IHNhdmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInNhdmVIZWF0bWFwSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcIk5hbWUgYW5kIHNhdmUgdGhpcyBoZWF0bWFwXCIsIFwibWF4bGVuZ3RoXCI6IFwiMjVcIiB9LCBudWxsKVxyXG4gICAgICAgIGNvbnN0IHNhdmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaXMtZXhwYW5kZWRcIiB9LCBudWxsLCBzYXZlSW5wdXQpXHJcblxyXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvckJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJnZW5lcmF0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJHZW5lcmF0ZSBIZWF0bWFwXCIpO1xyXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvckNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdlbmVyYXRvckJ1dHRvbik7XHJcblxyXG4gICAgICAgIC8vIGlmIG5vIGhlYXRtYXBzIGFyZSBzYXZlZCwgZ2VuZXJhdGUgbm8gZXh0cmEgb3B0aW9ucyBpbiBkcm9wZG93blxyXG4gICAgICAgIGlmIChoZWF0bWFwcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGNvbnN0IGdlbmVyYXRvckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGhlYXRtYXBDb250cm9sLCBnZW5lcmF0b3JDb250cm9sLCBzYXZlQ29udHJvbCwgc2F2ZUJ0bkNvbnRyb2wsIGRlbGV0ZUJ0bkNvbnRyb2wpO1xyXG4gICAgICAgICAgY29uc3QgUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBnZW5lcmF0b3JGaWVsZCk7XHJcbiAgICAgICAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEdlbmVyYXRvckNvbnRhaW5lcik7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZWxzZSwgZm9yIGVhY2ggaGVhdG1hcCBzYXZlZCwgbWFrZSBhIG5ldyBvcHRpb24gYW5kIGFwcGVuZCBpdCB0byB0aGVcclxuICAgICAgICAgIGhlYXRtYXBzLmZvckVhY2goaGVhdG1hcCA9PiB7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwgeyBcImlkXCI6IGBoZWF0bWFwLSR7aGVhdG1hcC5pZH1gIH0sIGAke2hlYXRtYXAudGltZVN0YW1wLnNwbGl0KFwiVFwiKVswXX06ICR7aGVhdG1hcC5uYW1lfWApKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1aWxkRmllbGRhbmRHb2FsKCk7XHJcbiAgICAgICAgZGF0ZUZpbHRlci5idWlsZERhdGVGaWx0ZXIoKTtcclxuICAgICAgICB0aGlzLmhlYXRtYXBFdmVudE1hbmFnZXIoKTtcclxuICAgICAgfSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmllbGRhbmRHb2FsKCkge1xyXG4gICAgY29uc3QgZmllbGRJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZUJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLWJnXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwiXCIgfSwgbnVsbCwgZmllbGRJbWFnZUJhY2tncm91bmQsIGZpZWxkSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZmllbGRJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvUkxfZ29hbF9jcm9wcGVkX25vX2JnX0JXLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdvYWxJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkdvYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdvYWxJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBoZWF0bWFwSW1hZ2VDb250YWluZXJzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25GaWVsZCwgYWxpZ25Hb2FsKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIGhvbGRpbmcgYWxsIHNob3QgaW5mb3JtYXRpb25cclxuICAgIGNvbnN0IHBhcmVudFNob3RDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwge1wiaWRcIjpcImhlYXRtYXBBbmRGZWVkYmFja0NvbnRhaW5lclwiLCBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGhlYXRtYXBJbWFnZUNvbnRhaW5lcnMpXHJcblxyXG4gICAgLy8gYXBwZW5kIGZpZWxkIGFuZCBnb2FsIHRvIHBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50U2hvdENvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgaGVhdG1hcEV2ZW50TWFuYWdlcigpIHtcclxuICAgIC8vIGFkZCBmdW5jdGlvbmFsaXR5IHRvIHByaW1hcnkgYnV0dG9ucyBvbiBoZWF0bWFwIHBhZ2VcclxuICAgIGNvbnN0IGdlbmVyYXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2VuZXJhdGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwQnRuXCIpO1xyXG4gICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlSGVhdG1hcEJ0blwiKTtcclxuXHJcbiAgICBnZW5lcmF0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmdldFVzZXJTaG90cyk7XHJcbiAgICBzYXZlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuc2F2ZUhlYXRtYXApO1xyXG4gICAgZGVsZXRlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcCk7XHJcblxyXG4gICAgLy8gYWRkIGxpc3RlbmVyIHRvIGhlYXRtYXAgcGFyZW50IHRoYXQgaGlnaGxpZ2h0cyBmaWx0ZXIgYnV0dG9ucyByZWQgd2hlbiBjaGFuZ2VkXHJcbiAgICAvLyBoZWF0bWFwIGJ1dHRvbnMgcmV0dXJuIHRvIGRlZmF1bHQgY29sb3IgaWYgdGhlIGRlZmF1bHQgb3B0aW9uIGlzIHNlbGVjdGVkXHJcbiAgICBjb25zdCBmaWx0ZXJGaWVsZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyRmllbGRcIik7XHJcbiAgICBmaWx0ZXJGaWVsZC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChlKSA9PiB7XHJcbiAgICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgICAgaWYgKGUudGFyZ2V0LnZhbHVlID09PSBlLnRhcmdldC5jaGlsZE5vZGVzWzBdLnRleHRDb250ZW50KSB7XHJcbiAgICAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXIgdG8gaGVhdG1hcCB0aXRsZSBpbnB1dCB0byBjbGVhciByZWQgaGlnaGxpdGluZyBhbmQgdGV4dCBpZiBhbiBlcnJvciB3YXMgdGhyb3duXHJcbiAgICBjb25zdCBzYXZlSGVhdG1hcElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlSGVhdG1hcElucHV0XCIpO1xyXG4gICAgc2F2ZUhlYXRtYXBJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICBpZiAoc2F2ZUhlYXRtYXBJbnB1dC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1kYW5nZXJcIikgfHwgc2F2ZUhlYXRtYXBJbnB1dC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zdWNjZXNzXCIpKSB7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBJbnB1dC52YWx1ZSA9IFwiXCI7XHJcbiAgICAgICAgc2F2ZUhlYXRtYXBJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICAgIHNhdmVIZWF0bWFwSW5wdXQuY2xhc3NMaXN0LnJlbW92ZShcImlzLXN1Y2Nlc3NcIik7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gcmVzZXQgZmlsdGVyIGJ1dHRvblxyXG4gICAgY29uc3QgcmVzZXRGaWx0ZXJzQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXNldEZpbHRlcnNCdG5cIik7XHJcbiAgICBjb25zdCBnYW1lTW9kZUZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmlsdGVyLWdhbWVNb2RlXCIpO1xyXG4gICAgY29uc3Qgc2hvdFR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1zaG90VHlwZVwiKTtcclxuICAgIGNvbnN0IGdhbWVSZXN1bHRGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lUmVzdWx0XCIpO1xyXG4gICAgY29uc3QgZ2FtZXR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lVHlwZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItb3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCB0ZWFtU3RhdHVzRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItdGVhbVN0YXR1c1wiKTtcclxuICAgIGNvbnN0IGRhdGVSYW5nZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGF0ZVJhbmdlQnRuXCIpO1xyXG4gICAgY29uc3QgYmFsbFNwZWVkQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRCdG5cIik7XHJcblxyXG4gICAgcmVzZXRGaWx0ZXJzQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgIGdhbWVNb2RlRmlsdGVyLnZhbHVlID0gXCJHYW1lIE1vZGVcIjtcclxuICAgICAgZ2FtZU1vZGVGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgc2hvdFR5cGVGaWx0ZXIudmFsdWUgPSBcIlNob3QgVHlwZVwiO1xyXG4gICAgICBzaG90VHlwZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBnYW1lUmVzdWx0RmlsdGVyLnZhbHVlID0gXCJSZXN1bHRcIjtcclxuICAgICAgZ2FtZVJlc3VsdEZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICBnYW1ldHlwZUZpbHRlci52YWx1ZSA9IFwiR2FtZSBUeXBlXCI7XHJcbiAgICAgIGdhbWV0eXBlRmlsdGVyLnBhcmVudE5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImlzLWRhbmdlclwiKTtcclxuXHJcbiAgICAgIG92ZXJ0aW1lRmlsdGVyLnZhbHVlID0gXCJPdmVydGltZVwiO1xyXG4gICAgICBvdmVydGltZUZpbHRlci5wYXJlbnROb2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcblxyXG4gICAgICB0ZWFtU3RhdHVzRmlsdGVyLnZhbHVlID0gXCJUZWFtXCI7XHJcbiAgICAgIHRlYW1TdGF0dXNGaWx0ZXIucGFyZW50Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG5cclxuICAgICAgLy8gcmVzZXQgYmFsbCBzcGVlZCBnbG9iYWwgdmFyaWFibGVzXHJcbiAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZUJhbGxTcGVlZEdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgICBiYWxsU3BlZWRCdG4uY2xhc3NMaXN0LmFkZChcImlzLW91dGxpbmVkXCIpO1xyXG5cclxuICAgICAgLy8gcmVzZXQgZGF0ZSBmaWx0ZXIgYW5kIGFzc29jaWF0ZWQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICBkYXRlRmlsdGVyLmNsZWFyRGF0ZUZpbHRlcigpO1xyXG5cclxuICAgIH0pXHJcblxyXG4gICAgLy8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gYmFsbCBzcGVlZCBidXR0b25cclxuICAgIGJhbGxTcGVlZEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuYmFsbFNwZWVkTWF4KTtcclxuXHJcbiAgICAvLyBhZGQgZnVuY3Rpb25hbGl0eSB0byBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgZGF0ZVJhbmdlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBkYXRlRmlsdGVyLm9wZW5EYXRlRmlsdGVyKTtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBoZWF0bWFwcyIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiXHJcbmltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcbmNvbnN0IHdlYnBhZ2VOYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdi1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBsb2dpbk9yU2lnbnVwID0ge1xyXG5cclxuICAvLyBidWlsZCBhIGxvZ2luIGZvcm0gdGhhdCB2YWxpZGF0ZXMgdXNlciBpbnB1dC4gU3VjY2Vzc2Z1bCBsb2dpbiBzdG9yZXMgdXNlciBpZCBpbiBzZXNzaW9uIHN0b3JhZ2VcclxuICBsb2dpbkZvcm0oKSB7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luSW5wdXRfcGFzc3dvcmQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwYXNzd29yZElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJwYXNzd29yZFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImxvZ2luTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW4gbm93XCIpO1xyXG4gICAgY29uc3QgbG9naW5Gb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJsb2dpbkZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIGxvZ2luSW5wdXRfdXNlcm5hbWUsIGxvZ2luSW5wdXRfcGFzc3dvcmQsIGxvZ2luQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKGxvZ2luRm9ybSlcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpXHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwRm9ybSgpIHtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X25hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIG5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X2NvbmZpcm0gPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJjb25maXJtUGFzc3dvcmRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImNvbmZpcm0gcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzaWdudXBOb3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwIG5vd1wiKTtcclxuICAgIGNvbnN0IHNpZ251cEZvcm0gPSBlbEJ1aWxkZXIoXCJmb3JtXCIsIHsgXCJpZFwiOiBcInNpZ251cEZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIHNpZ251cElucHV0X25hbWUsIHNpZ251cElucHV0X3VzZXJuYW1lLCBzaWdudXBJbnB1dF9wYXNzd29yZCwgc2lnbnVwSW5wdXRfY29uZmlybSwgc2lnbnVwQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHNpZ251cEZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIC8vIGFzc2lnbiBldmVudCBsaXN0ZW5lcnMgYmFzZWQgb24gd2hpY2ggZm9ybSBpcyBvbiB0aGUgd2VicGFnZVxyXG4gIHVzZXJFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBsb2dpbk5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9naW5Ob3dcIilcclxuICAgIGNvbnN0IHNpZ251cE5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2lnbnVwTm93XCIpXHJcbiAgICBpZiAobG9naW5Ob3cgPT09IG51bGwpIHtcclxuICAgICAgc2lnbnVwTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cFVzZXIsIGV2ZW50KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9naW5Ob3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9naW5Vc2VyLCBldmVudClcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyB2YWxpZGF0ZSB1c2VyIGxvZ2luIGZvcm0gaW5wdXRzIGJlZm9yZSBsb2dnaW5nIGluXHJcbiAgbG9naW5Vc2VyKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGNvbnN0IHVzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBwYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFzc3dvcmRJbnB1dFwiKS52YWx1ZVxyXG4gICAgaWYgKHVzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5nZXRBbGwoXCJ1c2Vyc1wiKS50aGVuKHVzZXJzID0+IHVzZXJzLmZvckVhY2godXNlciA9PiB7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgdXNlcm5hbWUgYW5kIHBhc3N3b3JkXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgaWYgKHVzZXIucGFzc3dvcmQgPT09IHBhc3N3b3JkKSB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgY29uc3QgX25hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3VzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IGNvbmZpcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbmZpcm1QYXNzd29yZFwiKS52YWx1ZVxyXG4gICAgbGV0IHVuaXF1ZVVzZXJuYW1lID0gdHJ1ZTsgLy9jaGFuZ2VzIHRvIGZhbHNlIGlmIHVzZXJuYW1lIGFscmVhZHkgZXhpc3RzXHJcbiAgICBpZiAoX25hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF91c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChjb25maXJtID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgIT09IGNvbmZpcm0pIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKCh1c2VyLCBpZHgpID0+IHtcclxuICAgICAgICAvLyBjaGVjayBmb3IgZXhpc3RpbmcgdXNlcm5hbWUgaW4gZGF0YWJhc2VcclxuICAgICAgICBpZiAodXNlci51c2VybmFtZS50b0xvd2VyQ2FzZSgpID09PSBfdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgdW5pcXVlVXNlcm5hbWUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9hdCB0aGUgZW5kIG9mIHRoZSBsb29wLCBwb3N0XHJcbiAgICAgICAgaWYgKGlkeCA9PT0gdXNlcnMubGVuZ3RoIC0gMSAmJiB1bmlxdWVVc2VybmFtZSkge1xyXG4gICAgICAgICAgbGV0IG5ld1VzZXIgPSB7XHJcbiAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogX3VzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogX3Bhc3N3b3JkLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIEFQSS5wb3N0SXRlbShcInVzZXJzXCIsIG5ld1VzZXIpLnRoZW4odXNlciA9PiB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsb2dpblN0YXR1c0FjdGl2ZSh1c2VyKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIsIHVzZXIuaWQpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpOyAvL2J1aWxkIGxvZ2dlZCBpbiB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH0sXHJcblxyXG4gIGxvZ291dFVzZXIoKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKGZhbHNlKTsgLy9idWlsZCBsb2dnZWQgb3V0IHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbG9naW5PclNpZ251cCIsImltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuLy8gaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuaW1wb3J0IGhlYXRtYXBzIGZyb20gXCIuL2hlYXRtYXBzXCI7XHJcblxyXG4vLyBmdW5jdGlvbiBjbG9zZUJveChlKSB7XHJcbi8vICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcImRlbGV0ZVwiKSkge1xyXG4vLyAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoKVxyXG5uYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSlcclxuaGVhdG1hcHMubG9hZEhlYXRtYXBDb250YWluZXJzKCk7IiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBsb2dpbk9yU2lnbnVwIGZyb20gXCIuL2xvZ2luXCJcclxuaW1wb3J0IHByb2ZpbGUgZnJvbSBcIi4vcHJvZmlsZVwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiXHJcbmltcG9ydCBoZWF0bWFwRGF0YSBmcm9tIFwiLi9oZWF0bWFwRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbmF2YmFyID0ge1xyXG5cclxuICBnZW5lcmF0ZU5hdmJhcihsb2dnZWRJbkJvb2xlYW4pIHtcclxuXHJcbiAgICAvLyBuYXZiYXItbWVudSAocmlnaHQgc2lkZSBvZiBuYXZiYXIgLSBhcHBlYXJzIG9uIGRlc2t0b3AgMTAyNHB4KylcclxuICAgIGNvbnN0IGJ1dHRvbjIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpblwiKVxyXG4gICAgY29uc3QgYnV0dG9uMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXBcIilcclxuICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgYnV0dG9uMSwgYnV0dG9uMilcclxuICAgIGNvbnN0IG1lbnVJdGVtMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIG51bGwsIGJ1dHRvbkNvbnRhaW5lcilcclxuICAgIGNvbnN0IG5hdmJhckVuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItZW5kXCIgfSwgbnVsbCwgbWVudUl0ZW0xKVxyXG4gICAgY29uc3QgbmF2YmFyU3RhcnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLXN0YXJ0XCIgfSlcclxuICAgIGNvbnN0IG5hdmJhck1lbnUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibmF2YmFyTWVudVwiLCBcImNsYXNzXCI6IFwibmF2YmFyLW1lbnVcIiB9LCBudWxsLCBuYXZiYXJTdGFydCwgbmF2YmFyRW5kKVxyXG5cclxuICAgIC8vIG5hdmJhci1icmFuZCAobGVmdCBzaWRlIG9mIG5hdmJhciAtIGluY2x1ZGVzIG1vYmlsZSBoYW1idXJnZXIgbWVudSlcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQyID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwicm9sZVwiOiBcImJ1dHRvblwiLCBcImNsYXNzXCI6IFwibmF2YmFyLWJ1cmdlciBidXJnZXJcIiwgXCJhcmlhLWxhYmVsXCI6IFwibWVudVwiLCBcImFyaWEtZXhwYW5kZWRcIjogXCJmYWxzZVwiLCBcImRhdGEtdGFyZ2V0XCI6IFwibmF2YmFyTWVudVwiIH0sIG51bGwsIGJ1cmdlck1lbnVTcGFuMSwgYnVyZ2VyTWVudVNwYW4yLCBidXJnZXJNZW51U3BhbjMpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIsIFwiaHJlZlwiOiBcIiNcIiB9LCBudWxsLCBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9maXJlOTBkZWcucG5nXCIsIFwid2lkdGhcIjogXCIxMTJcIiwgXCJoZWlnaHRcIjogXCIyOFwiIH0pKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1icmFuZFwiIH0sIG51bGwsIG5hdmJhckJyYW5kQ2hpbGQxLCBuYXZiYXJCcmFuZENoaWxkMik7XHJcblxyXG4gICAgLy8gbmF2IChwYXJlbnQgbmF2IEhUTUwgZWxlbWVudClcclxuICAgIGNvbnN0IG5hdiA9IGVsQnVpbGRlcihcIm5hdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXJcIiwgXCJyb2xlXCI6IFwibmF2aWdhdGlvblwiLCBcImFyaWEtbGFiZWxcIjogXCJtYWluIG5hdmlnYXRpb25cIiB9LCBudWxsLCBuYXZiYXJCcmFuZCwgbmF2YmFyTWVudSk7XHJcblxyXG4gICAgLy8gaWYgbG9nZ2VkIGluLCBhcHBlbmQgYWRkaXRpb25hbCBtZW51IG9wdGlvbnMgdG8gbmF2YmFyIGFuZCByZW1vdmUgc2lnbnVwL2xvZ2luIGJ1dHRvbnNcclxuICAgIGlmIChsb2dnZWRJbkJvb2xlYW4pIHtcclxuICAgICAgLy8gcmVtb3ZlIGxvZyBpbiBhbmQgc2lnbiB1cCBidXR0b25zXHJcbiAgICAgIGNvbnN0IHNpZ251cCA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdO1xyXG4gICAgICBjb25zdCBsb2dpbiA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzFdO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQoc2lnbnVwKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvZ2luKTtcclxuICAgICAgLy8gYWRkIGxvZ291dCBidXR0b25cclxuICAgICAgY29uc3QgYnV0dG9uMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ291dFwiKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbjMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgbmV3IG1lbnUgaXRlbXMgZm9yIHVzZXJcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIlByb2ZpbGVcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJHYW1lcGxheVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkhlYXRtYXBzXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW00ID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiTGVhZGVyYm9hcmRcIik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0yKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMyk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gbmF2YmFyXHJcbiAgICB0aGlzLm5hdmJhckV2ZW50TWFuYWdlcihuYXYpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlTmF2LmFwcGVuZENoaWxkKG5hdik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpbkNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9nb3V0Q2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByb2ZpbGVDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZ2FtZXBsYXlDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGVhdG1hcHNDbGlja2VkLCBldmVudCk7XHJcbiAgfSxcclxuXHJcbiAgbG9naW5DbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dpblwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9naW5Gb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAuc2lnbnVwRm9ybSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ291dENsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ291dFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9nb3V0VXNlcigpO1xyXG4gICAgICBoZWF0bWFwRGF0YS5jbGVhckhlYXRtYXBSZXBhaW50SW50ZXJ2YWwoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBwcm9maWxlQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiUHJvZmlsZVwiKSB7XHJcbiAgICAgIHByb2ZpbGUubG9hZFByb2ZpbGUoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBnYW1lcGxheUNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkdhbWVwbGF5XCIpIHtcclxuICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICBoZWF0bWFwRGF0YS5jbGVhckhlYXRtYXBSZXBhaW50SW50ZXJ2YWwoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBoZWF0bWFwc0NsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkhlYXRtYXBzXCIpIHtcclxuICAgICAgaGVhdG1hcHMubG9hZEhlYXRtYXBDb250YWluZXJzKCk7XHJcbiAgICAgIGhlYXRtYXBEYXRhLmhhbmRsZUJhbGxTcGVlZEdsb2JhbFZhcmlhYmxlcygpO1xyXG4gICAgICBoZWF0bWFwRGF0YS5oYW5kbGVEYXRlRmlsdGVyR2xvYmFsVmFyaWFibGVzKCk7XHJcbiAgICAgIGhlYXRtYXBEYXRhLmNsZWFySGVhdG1hcFJlcGFpbnRJbnRlcnZhbCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5hdmJhclxyXG5cclxuLypcclxuICBCdWxtYSBuYXZiYXIgc3RydWN0dXJlOlxyXG4gIDxuYXY+XHJcbiAgICA8bmF2YmFyLWJyYW5kPlxyXG4gICAgICA8bmF2YmFyLWJ1cmdlcj4gKG9wdGlvbmFsKVxyXG4gICAgPC9uYXZiYXItYnJhbmQ+XHJcbiAgICA8bmF2YmFyLW1lbnU+XHJcbiAgICAgIDxuYXZiYXItc3RhcnQ+XHJcbiAgICAgIDwvbmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8bmF2YmFyLWVuZD5cclxuICAgICAgPC9uYXZiYXItZW5kPlxyXG4gICAgPC9uYXZiYXItbWVudT5cclxuICA8L25hdj5cclxuKi8iLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IHByb2ZpbGUgPSB7XHJcblxyXG4gIGxvYWRQcm9maWxlKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYWN0aXZlVXNlcklkKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlUGljID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvb2N0YW5lLmpwZ1wiLCBcImNsYXNzXCI6IFwiXCIgfSlcclxuICAgICAgY29uc3QgbmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb25cIiB9LCBgTmFtZTogJHt1c2VyLm5hbWV9YClcclxuICAgICAgY29uc3QgdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYFVzZXJuYW1lOiAke3VzZXIudXNlcm5hbWV9YClcclxuICAgICAgY29uc3QgcGxheWVyUHJvZmlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJwbGF5ZXJQcm9maWxlXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXJcIiB9LCBudWxsLCBwcm9maWxlUGljLCBuYW1lLCB1c2VybmFtZSlcclxuICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChwbGF5ZXJQcm9maWxlKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwcm9maWxlIiwiY2xhc3Mgc2hvdE9uR29hbCB7XHJcbiAgc2V0IGZpZWxkWChmaWVsZFgpIHtcclxuICAgIHRoaXMuX2ZpZWxkWCA9IGZpZWxkWFxyXG4gIH1cclxuICBzZXQgZmllbGRZKGZpZWxkWSkge1xyXG4gICAgdGhpcy5fZmllbGRZID0gZmllbGRZXHJcbiAgfVxyXG4gIHNldCBnb2FsWChnb2FsWCkge1xyXG4gICAgdGhpcy5fZ29hbFggPSBnb2FsWFxyXG4gIH1cclxuICBzZXQgZ29hbFkoZ29hbFkpIHtcclxuICAgIHRoaXMuX2dvYWxZID0gZ29hbFlcclxuICB9XHJcbiAgc2V0IGFlcmlhbChhZXJpYWxCb29sZWFuKSB7XHJcbiAgICB0aGlzLl9hZXJpYWwgPSBhZXJpYWxCb29sZWFuXHJcbiAgfVxyXG4gIHNldCBiYWxsU3BlZWQoYmFsbFNwZWVkKSB7XHJcbiAgICB0aGlzLmJhbGxfc3BlZWQgPSBiYWxsU3BlZWRcclxuICB9XHJcbiAgc2V0IHRpbWVTdGFtcChkYXRlT2JqKSB7XHJcbiAgICB0aGlzLl90aW1lU3RhbXAgPSBkYXRlT2JqXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90T25Hb2FsIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90T25Hb2FsIGZyb20gXCIuL3Nob3RDbGFzc1wiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiO1xyXG5cclxubGV0IHNob3RDb3VudGVyID0gMDtcclxubGV0IGVkaXRpbmdTaG90ID0gZmFsc2U7IC8vZWRpdGluZyBzaG90IGlzIHVzZWQgZm9yIGJvdGggbmV3IGFuZCBvbGQgc2hvdHNcclxubGV0IHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbmxldCBzaG90QXJyYXkgPSBbXTsgLy8gcmVzZXQgd2hlbiBnYW1lIGlzIHNhdmVkXHJcbi8vIGdsb2JhbCB2YXJzIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdE9iajtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWDtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWTtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxYO1xyXG5sZXQgcHJldmlvdXNTaG90R29hbFk7XHJcbi8vIGdsb2JhbCB2YXIgdXNlZCB3aGVuIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSAodG8gZGV0ZXJtaW5lIGlmIG5ldyBzaG90cyB3ZXJlIGFkZGVkIGZvciBQT1NUKVxyXG5sZXQgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5O1xyXG5cclxuY29uc3Qgc2hvdERhdGEgPSB7XHJcblxyXG4gIHJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gZ2FtZXBsYXkgaXMgY2xpY2tlZCBvbiB0aGUgbmF2YmFyIGFuZCB3aGVuIGEgZ2FtZSBpcyBzYXZlZCwgaW4gb3JkZXIgdG8gcHJldmVudCBidWdzIHdpdGggcHJldmlvdXNseSBjcmVhdGVkIHNob3RzXHJcbiAgICBzaG90Q291bnRlciA9IDA7XHJcbiAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHNob3RBcnJheSA9IFtdO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheSA9IHVuZGVmaW5lZDtcclxuICB9LFxyXG5cclxuICBjcmVhdGVOZXdTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBzaG90T2JqID0gbmV3IHNob3RPbkdvYWw7XHJcbiAgICBzaG90T2JqLnRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XHJcblxyXG4gICAgLy8gcHJldmVudCB1c2VyIGZyb20gc2VsZWN0aW5nIGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyh0cnVlKTtcclxuXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBmaWVsZEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuXHJcbiAgICAvLyBhY3RpdmF0ZSBjbGljayBmdW5jdGlvbmFsaXR5IGFuZCBjb25kaXRpb25hbCBzdGF0ZW1lbnRzIG9uIGJvdGggZmllbGQgYW5kIGdvYWwgaW1hZ2VzXHJcbiAgfSxcclxuXHJcbiAgZ2V0Q2xpY2tDb29yZHMoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBnZXRzIHRoZSByZWxhdGl2ZSB4IGFuZCB5IG9mIHRoZSBjbGljayB3aXRoaW4gdGhlIGZpZWxkIGltYWdlIGNvbnRhaW5lclxyXG4gICAgLy8gYW5kIHRoZW4gY2FsbHMgdGhlIGZ1bmN0aW9uIHRoYXQgYXBwZW5kcyBhIG1hcmtlciBvbiB0aGUgcGFnZVxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lcjtcclxuICAgIGlmIChlLnRhcmdldC5pZCA9PT0gXCJmaWVsZC1pbWdcIikge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIH1cclxuICAgIC8vIG9mZnNldFggYW5kIFkgYXJlIHRoZSB4IGFuZCB5IGNvb3JkaW5hdGVzIChwaXhlbHMpIG9mIHRoZSBjbGljayBpbiB0aGUgY29udGFpbmVyXHJcbiAgICAvLyB0aGUgZXhwcmVzc2lvbnMgZGl2aWRlIHRoZSBjbGljayB4IGFuZCB5IGJ5IHRoZSBwYXJlbnQgZnVsbCB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICBjb25zdCB4Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRYIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKVxyXG4gICAgY29uc3QgeUNvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4Q29vcmRSZWxhdGl2ZSwgeUNvb3JkUmVsYXRpdmUsIHBhcmVudENvbnRhaW5lcilcclxuICB9LFxyXG5cclxuICBtYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcikge1xyXG4gICAgbGV0IG1hcmtlcklkO1xyXG4gICAgaWYgKHBhcmVudENvbnRhaW5lci5pZCA9PT0gXCJmaWVsZC1pbWctcGFyZW50XCIpIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWZpZWxkXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBtYXJrZXJJZCA9IFwic2hvdC1tYXJrZXItZ29hbFwiO1xyXG4gICAgfVxyXG4gICAgLy8gYWRqdXN0IGZvciA1MCUgb2Ygd2lkdGggYW5kIGhlaWdodCBvZiBtYXJrZXIgc28gaXQncyBjZW50ZXJlZCBhYm91dCBtb3VzZSBwb2ludGVyXHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWCA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWSA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3MgTk9UIGFscmVhZHkgYSBtYXJrZXIsIHRoZW4gbWFrZSBvbmUgYW5kIHBsYWNlIGl0XHJcbiAgICBpZiAoIXBhcmVudENvbnRhaW5lci5jb250YWlucyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCkpKSB7XHJcbiAgICAgIHRoaXMuZ2VuZXJhdGVNYXJrZXIocGFyZW50Q29udGFpbmVyLCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZLCBtYXJrZXJJZCwgeCwgeSk7XHJcbiAgICAgIC8vIGVsc2UgbW92ZSB0aGUgZXhpc3RpbmcgbWFya2VyIHRvIHRoZSBuZXcgcG9zaXRpb25cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubW92ZU1hcmtlcihtYXJrZXJJZCwgeCwgeSwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSk7XHJcbiAgICB9XHJcbiAgICAvLyBzYXZlIGNvb3JkaW5hdGVzIHRvIG9iamVjdFxyXG4gICAgdGhpcy5hZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KVxyXG4gIH0sXHJcblxyXG4gIGdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpIHtcclxuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBkaXYuaWQgPSBtYXJrZXJJZDtcclxuICAgIGRpdi5zdHlsZS53aWR0aCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwibGlnaHRncmVlblwiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCI1MCVcIjtcclxuICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgIGRpdi5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgZGl2LnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpO1xyXG4gIH0sXHJcblxyXG4gIG1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpIHtcclxuICAgIGNvbnN0IGN1cnJlbnRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCk7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICB9LFxyXG5cclxuICBhZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHVwZGF0ZXMgdGhlIGluc3RhbmNlIG9mIHNob3RPbkdvYWwgY2xhc3MgdG8gcmVjb3JkIGNsaWNrIGNvb3JkaW5hdGVzXHJcbiAgICAvLyBpZiBhIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIGFwcGVuZCB0aGUgY29vcmRpbmF0ZXMgdG8gdGhlIG9iamVjdCBpbiBxdWVzdGlvblxyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgLy8gdXNlIGdsb2JhbCB2YXJzIGluc3RlYWQgb2YgdXBkYXRpbmcgb2JqZWN0IGRpcmVjdGx5IGhlcmUgdG8gcHJldmVudCBhY2NpZGVudGFsIGVkaXRpbmcgb2YgbWFya2VyIHdpdGhvdXQgY2xpY2tpbmcgXCJzYXZlIHNob3RcIlxyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIG90aGVyd2lzZSwgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBzbyBhcHBlbmQgY29vcmRpbmF0ZXMgdG8gdGhlIG5ldyBvYmplY3RcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaG90T2JqLmdvYWxYID0geDtcclxuICAgICAgICBzaG90T2JqLmdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbFNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBpZiAoZmllbGRNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdvYWxNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZSBjbGljayBsaXN0ZW5lcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIC8vIGNsZWFyIGZpZWxkIGFuZCBnb2FsIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICAvLyBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gc2F2ZSBjb3JyZWN0IG9iamVjdCAoaS5lLiBzaG90IGJlaW5nIGVkaXRlZCB2cy4gbmV3IHNob3QpXHJcbiAgICAgIC8vIGlmIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHByZXZpb3VzU2hvdE9iaiB3aWxsIG5vdCBiZSB1bmRlZmluZWRcclxuICAgICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRYID0gcHJldmlvdXNTaG90RmllbGRYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRZID0gcHJldmlvdXNTaG90RmllbGRZO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFggPSBwcmV2aW91c1Nob3RHb2FsWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxZID0gcHJldmlvdXNTaG90R29hbFk7XHJcbiAgICAgICAgLy8gZWxzZSBzYXZlIHRvIG5ldyBpbnN0YW5jZSBvZiBjbGFzcyBhbmQgYXBwZW5kIGJ1dHRvbiB0byBwYWdlIHdpdGggY29ycmVjdCBJRCBmb3IgZWRpdGluZ1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHNob3RPYmouYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBzaG90T2JqLmFlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgc2hvdE9iai5iYWxsU3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBzaG90QXJyYXkucHVzaChzaG90T2JqKTtcclxuICAgICAgICAvLyBhcHBlbmQgbmV3IGJ1dHRvblxyXG4gICAgICAgIHNob3RDb3VudGVyKys7XHJcbiAgICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtzaG90Q291bnRlcn1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke3Nob3RDb3VudGVyfWApO1xyXG4gICAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtzaG90Q291bnRlcn1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgICAgfVxyXG4gICAgICAvL1RPRE86IGFkZCBjb25kaXRpb24gdG8gcHJldmVudCBibGFuayBlbnRyaWVzIGFuZCBtaXNzaW5nIGNvb3JkaW5hdGVzXHJcblxyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzcyAobWF0dGVycyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQpXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWQgKG1hdHRlcnMgaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkKVxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2F2ZWRTaG90KGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVmZXJlbmNlcyB0aGUgc2hvdEFycmF5IHRvIGdldCBhIHNob3Qgb2JqZWN0IHRoYXQgbWF0Y2hlcyB0aGUgc2hvdCMgYnV0dG9uIGNsaWNrZWQgKGUuZy4gc2hvdCAyIGJ1dHRvbiA9IGluZGV4IDEgb2YgdGhlIHNob3RBcnJheSlcclxuICAgIC8vIHRoZSBmdW5jdGlvbiAoYW5kIGl0cyBhc3NvY2lhdGVkIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gb3RoZXIgbG9jYWwgZnVuY3Rpb25zKSBoYXMgdGhlc2UgYmFzaWMgcmVxdWlyZW1lbnRzOlxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBjbGljayBsaXN0ZW5lcnMgb24gaW1hZ2VzXHJcbiAgICAvLyByZXZpdmUgYSBzYXZlZCBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgZm9yIGVkaXRpbmcgc2hvdCBjb29yZGluYXRlcywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbFxyXG4gICAgLy8gcmVuZGVyIG1hcmtlcnMgZm9yIGV4aXN0aW5nIGNvb3JkaW5hdGVzIG9uIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBzYXZlIGVkaXRzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIGNhbmNlbCBlZGl0c1xyXG4gICAgLy8gdGhlIGRhdGEgaXMgcmVuZGVyZWQgb24gdGhlIHBhZ2UgYW5kIGNhbiBiZSBzYXZlZCAob3ZlcndyaXR0ZW4pIGJ5IHVzaW5nIHRoZSBcInNhdmUgc2hvdFwiIGJ1dHRvbiBvciBjYW5jZWxlZCBieSBjbGlja2luZyB0aGUgXCJjYW5jZWwgc2hvdFwiIGJ1dHRvblxyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IG5ldyBzaG90IGJ1dHRvbiBmcm9tIGJlaW5nIGNsaWNrZWRcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIC8vIGFsbG93IGNhbmNlbCBhbmQgc2F2ZWQgYnV0dG9ucyB0byBiZSBjbGlja2VkXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICAvLyBnZXQgSUQgb2Ygc2hvdCMgYnRuIGNsaWNrZWQgYW5kIGFjY2VzcyBzaG90QXJyYXkgYXQgW2J0bklEIC0gMV1cclxuICAgIGxldCBidG5JZCA9IGUudGFyZ2V0LmlkLnNsaWNlKDUpO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gc2hvdEFycmF5W2J0bklkIC0gMV07XHJcbiAgICAvLyByZW5kZXIgYmFsbCBzcGVlZCBhbmQgYWVyaWFsIGRyb3Bkb3duIGZvciB0aGUgc2hvdFxyXG4gICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZDtcclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9PT0gdHJ1ZSkgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJBZXJpYWxcIjsgfSBlbHNlIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjsgfVxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBmaWVsZCBhbmQgZ29hbFxyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIC8vIHJlbmRlciBzaG90IG1hcmtlciBvbiBmaWVsZFxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IHggPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHkgPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcbiAgICAvLyByZW5kZXIgZ29hbCBtYXJrZXIgb24gZmllbGRcclxuICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpXHJcbiAgICB4ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpO1xyXG4gICAgeSA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG5cclxuICB9LFxyXG5cclxuICBkaXNhYmxlRWRpdFNob3RidXR0b25zKGRpc2FibGVPck5vdCkge1xyXG4gICAgLy8gZm9yIGVhY2ggYnV0dG9uIGFmdGVyIFwiTmV3IFNob3RcIiwgXCJTYXZlIFNob3RcIiwgYW5kIFwiQ2FuY2VsIFNob3RcIiBkaXNhYmxlIHRoZSBidXR0b25zIGlmIHRoZSB1c2VyIGlzIGNyZWF0aW5nIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IHRydWUpIG9yIGVuYWJsZSB0aGVtIG9uIHNhdmUvY2FuY2VsIG9mIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IGZhbHNlKVxyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgbGV0IGVkaXRCdG47XHJcbiAgICBsZXQgbGVuZ3RoID0gc2hvdEJ0bkNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aDtcclxuICAgIGZvciAobGV0IGkgPSAzOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWRpdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aSAtIDJ9YCk7XHJcbiAgICAgIGVkaXRCdG4uZGlzYWJsZWQgPSBkaXNhYmxlT3JOb3Q7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGdldFNob3RPYmplY3RzRm9yU2F2aW5nKCkge1xyXG4gICAgLy8gcHJvdmlkZXMgYXJyYXkgZm9yIHVzZSBpbiBnYW1lRGF0YS5qcyAod2hlbiBzYXZpbmcgYSBuZXcgZ2FtZSwgbm90IHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lKVxyXG4gICAgcmV0dXJuIHNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsTnVtT2ZTaG90cygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGluaXRpYWwgbnVtYmVyIG9mIHNob3RzIHRoYXQgd2VyZSBzYXZlZCB0byBkYXRhYmFzZSB0byBnYW1lRGF0YS5qcyB0byBpZGVudGlmeSBhbiBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZFxyXG4gICAgcmV0dXJuIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICByZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZXF1ZXN0cyB0aGUgYXJyYXkgb2Ygc2hvdHMgZnJvbSB0aGUgcHJldmlvdXMgc2F2ZWQgZ2FtZSwgc2V0cyBpdCBhcyBzaG90QXJyYXksIGFuZCByZW5kZXJzIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgLy8gZ2V0IHNhdmVkIGdhbWUgd2l0aCBzaG90cyBlbWJlZGRlZCBhcyBhcnJheVxyXG4gICAgbGV0IHNhdmVkR2FtZU9iaiA9IGdhbWVEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKTtcclxuICAgIC8vIGNyZWF0ZSBzaG90QXJyYXkgd2l0aCBmb3JtYXQgcmVxdWlyZWQgYnkgbG9jYWwgZnVuY3Rpb25zXHJcbiAgICBsZXQgc2F2ZWRTaG90T2JqXHJcbiAgICBzYXZlZEdhbWVPYmouc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc2F2ZWRTaG90T2JqID0gbmV3IHNob3RPbkdvYWxcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWCA9IHNob3QuZmllbGRYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZmllbGRZID0gc2hvdC5maWVsZFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWCA9IHNob3QuZ29hbFg7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWSA9IHNob3QuZ29hbFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5hZXJpYWwgPSBzaG90LmFlcmlhbDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmJhbGxfc3BlZWQgPSBzaG90LmJhbGxfc3BlZWQudG9TdHJpbmcoKTtcclxuICAgICAgc2F2ZWRTaG90T2JqLnRpbWVTdGFtcCA9IHNob3QudGltZVN0YW1wXHJcbiAgICAgIHNhdmVkU2hvdE9iai5pZCA9IHNob3QuaWRcclxuICAgICAgc2hvdEFycmF5LnB1c2goc2F2ZWRTaG90T2JqKTtcclxuICAgIH0pXHJcblxyXG4gICAgY29uc29sZS5sb2coc2hvdEFycmF5KTtcclxuICAgIHNob3RBcnJheS5mb3JFYWNoKChzaG90LCBpZHgpID0+IHtcclxuICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtpZHggKyAxfWAsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtbGlua1wiIH0sIGBTaG90ICR7aWR4ICsgMX1gKTtcclxuICAgICAgc2hvdEJ0bkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdTaG90QnRuKTtcclxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpZHggKyAxfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5yZW5kZXJTYXZlZFNob3QpO1xyXG4gICAgfSk7XHJcbiAgICBzaG90Q291bnRlciA9IHNob3RBcnJheS5sZW5ndGg7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3REYXRhIl19
