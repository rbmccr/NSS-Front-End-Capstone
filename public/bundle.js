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

},{}],4:[function(require,module,exports){
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
    const gameMode = sel_gameMode.value.toLowerCase(); // my team (note: did not use boolean in preparation for users to enter the club information)

    const sel_teamColor = document.getElementById("teamInput");
    let myTeam;

    if (sel_teamColor.value === "Orange team") {
      myTeam = "orange";
    } else {
      myTeam = "blue";
    } // scores


    let myScore;
    let theirScore;
    const inpt_orangeScore = document.getElementById("orangeScoreInput");
    const inpt_blueScore = document.getElementById("blueScoreInput");

    if (myTeam === "orange") {
      myScore = Number(inpt_orangeScore.value);
      theirScore = Number(inpt_blueScore.value);
    } else {
      myScore = Number(inpt_blueScore.value);
      theirScore = Number(inpt_orangeScore.value);
    } // overtime


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
      "team": myTeam,
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
    console.log("saving edits...");
    gameData.packageGameData(); // TODO: ((STEP 3)) PUT edits to database
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


    const sel_teamColor = document.getElementById("teamInput");

    if (game.team === "orange") {
      sel_teamColor.value = "Orange team";
    } else {
      sel_teamColor.value = "Blue team";
    } // my score


    const inpt_orangeScore = document.getElementById("orangeScoreInput");
    const inpt_blueScore = document.getElementById("blueScoreInput");

    if (game.team === "orange") {
      inpt_orangeScore.value = game.score;
      inpt_blueScore.value = game.opp_score;
    } else {
      inpt_orangeScore.value = game.opp_score;
      inpt_blueScore.value = game.score;
    } // game type (1v1, 2v2, 3v3)


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

},{"./API":2,"./elementBuilder":3,"./gameplay":5,"./shotData":13}],5:[function(require,module,exports){
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

    const teamOption1 = (0, _elementBuilder.default)("option", {}, "Orange team");
    const teamOption2 = (0, _elementBuilder.default)("option", {}, "Blue team");
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

    const orangeScoreInputTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, "Orange team score:");
    const orangeScoreInput = (0, _elementBuilder.default)("input", {
      "id": "orangeScoreInput",
      "class": "input",
      "type": "number",
      "placeholder": "enter orange team score"
    });
    const orangeScoreControl = (0, _elementBuilder.default)("div", {
      "class": "level-item control"
    }, null, orangeScoreInput);
    const blueScoreInputTitle = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, "Blue team score:");
    const blueScoreInput = (0, _elementBuilder.default)("input", {
      "id": "blueScoreInput",
      "class": "input",
      "type": "number",
      "placeholder": "enter blue team score"
    });
    const blueScoreControl = (0, _elementBuilder.default)("div", {
      "class": "level-item control"
    }, null, blueScoreInput);
    const scoreInputContainer = (0, _elementBuilder.default)("div", {
      "class": "level-left"
    }, null, orangeScoreInputTitle, orangeScoreControl, blueScoreInputTitle, blueScoreControl); // edit/save game buttons

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

},{"./elementBuilder":3,"./gameData":4,"./shotData":13}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _heatmap = _interopRequireDefault(require("../lib/node_modules/heatmap.js/build/heatmap.js"));

var _API = _interopRequireDefault(require("./API.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ID of setInterval function used to monitor container width and repaint heatmap if container width changes
// let intervalId;
// global variable to store fetched shots
let globalShotsArr;
let joinTableArr = [];
const activeUserId = sessionStorage.getItem("activeUserId");
const heatmapData = {
  getUserShots() {
    // const fieldContainer = document.getElementById("field-img-parent");
    // const goalContainer = document.getElementById("goal-img-parent");
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const heatmapName = heatmapDropdown.value; // const fieldHeatmapCanvas = fieldContainer.childNodes[2]
    // const goalHeatmapCanvas = goalContainer.childNodes[1]
    // if there's already a heatmap loaded, remove it before continuing
    // if (fieldHeatmapCanvas.classList.contains("heatmap-canvas")) {
    //   fieldHeatmapCanvas.remove();
    //   goalHeatmapCanvas.remove();
    //   if (heatmapName === "Basic Heatmap") {
    //     heatmapData.fetchBasicHeatmapData();
    //   } else {
    //     heatmapData.fetchSavedHeatmapData(heatmapName);
    //   }
    // } else {

    if (heatmapName === "Basic Heatmap") {
      heatmapData.fetchBasicHeatmapData();
    } else {
      heatmapData.fetchSavedHeatmapData(heatmapName);
    } // }

  },

  fetchBasicHeatmapData() {
    // this function goes to the database and retrieves shots that meet specific filters (all shots fetched if )
    let gameIds = [];
    const gameURLextension = heatmapData.applyGameFilters();

    _API.default.getAll(gameURLextension).then(games => {
      games.forEach(game => {
        gameIds.push(game.id);
      });
      return gameIds;
    }).then(gameIds => {
      const shotURLextension = heatmapData.applyShotFilters(gameIds);

      _API.default.getAll(shotURLextension).then(shots => {
        globalShotsArr = shots;
        heatmapData.buildFieldHeatmap(shots);
        heatmapData.buildGoalHeatmap(shots); // intervalId = setInterval(heatmapData.getActiveOffsets, 500);
      });
    });
  },

  fetchSavedHeatmapData(heatmapName) {
    console.log("fetching saved heatmap data..."); // fetch heatmaps with name= and userId=

    const activeUserId = sessionStorage.getItem("activeUserId");
  },

  applyGameFilters() {
    // TODO: add more filters
    let URL = "games";
    const activeUserId = sessionStorage.getItem("activeUserId");
    URL += `?userId=${activeUserId}`;
    return URL;
  },

  applyShotFilters(gameIds) {
    let URL = "shots"; // for each gameId, append URL. Append & instead of ? once first gameId is added to URL

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
    } //TODO: else do not continue (no games were found)


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
      let value_ = 1;
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
    };
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
      let value_ = 1;
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
      data: goalDataPoints
    };
    GoalHeatmapInstance.setData(goalData);
  },

  getFieldConfig(fieldContainer) {
    return {
      container: fieldContainer,
      radius: 25,
      maxOpacity: .5,
      minOpacity: 0,
      blur: .75
    };
  },

  getGoalConfig(goalContainer) {
    return {
      container: goalContainer,
      radius: 35,
      maxOpacity: .5,
      minOpacity: 0,
      blur: .75
    };
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
    // TODO: require unique heatmap name
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const saveInput = document.getElementById("saveHeatmapInput");
    const heatmapTitle = saveInput.value;

    if (heatmapTitle.length > 0 && heatmapTitle !== "Save successful!") {
      //TODO: add requirement for a heatmap to be loaded at the time save is clicked
      console.log("saving heatmap...");
      saveInput.classList.remove("is-danger");
      heatmapData.saveHeatmapObject(heatmapTitle).then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(x => {
        console.log("join tables saved", x);
        joinTableArr = []; // empty the temporary global array used with Promise.all
        // heatmapDropdown.value = heatmapTitle TODO: append child to select dropdown with new heatmap name

        saveInput.value = "Save successful!";
      }));
    } else {
      saveInput.classList.add("is-danger");
    }
  },

  saveHeatmapObject(heatmapTitle) {
    // this function saves a heatmap object with the user-provided name and the userId
    const activeUserId = Number(sessionStorage.getItem("activeUserId"));
    const heatmapObj = {
      name: heatmapTitle,
      userId: activeUserId
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
    // TODO: delete option in dropdown
    // TODO: delete heatmap object
    // TODO: delete all join tables associated with that heatmap object
    console.log("deleting heatmap...");
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;
    heatmapDropdown.childNodes.forEach(child => {
      if (child.textContent === currentDropdownValue && child.textContent !== "Basic Heatmap") {
        child.remove();
        heatmapData.deleteHeatmapObjectandJoinTables(child.id).then(x => heatmapDropdown.value = "Basic Heatmap");
      } else {
        return;
      }
    });
  },

  deleteHeatmapObjectandJoinTables(heatmapId) {
    return _API.default.deleteItem("heatmaps", `${heatmapId.slice(8)}?userId=${activeUserId}`);
  }

};
var _default = heatmapData; // TODO: delete heatmap functionality
// TODO: set interval for container width monitoring
// TODO: scale ball size with goal
// TODO: add filter compatibility
// TODO: if custom heatmap is selected from dropdown, then blur filter container
// TODO: on page load, render user-saved heatmaps as options in dropdown menu

exports.default = _default;

},{"../lib/node_modules/heatmap.js/build/heatmap.js":1,"./API.js":2}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _heatmapData = _interopRequireDefault(require("./heatmapData"));

var _API = _interopRequireDefault(require("./API"));

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
      "class": "button is-danger"
    }, "Reset Filters"); // date range button

    const dateBtnText = (0, _elementBuilder.default)("span", {}, "Date Range");
    const dateBtnIcon = (0, _elementBuilder.default)("i", {
      "class": "fas fa-calendar"
    }, null);
    const dateBtnIconSpan = (0, _elementBuilder.default)("span", {
      "class": "icon is-small"
    }, null, dateBtnIcon);
    const dateBtn = (0, _elementBuilder.default)("a", {
      "class": "button is-outlined is-dark"
    }, null, dateBtnIconSpan, dateBtnText);
    const dateBtnParent = (0, _elementBuilder.default)("div", {
      "class": "control"
    }, null, dateBtn); // overtime

    const icon6 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-clock"
    }, null);
    const iconSpan6 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon6);
    const sel6_op1 = (0, _elementBuilder.default)("option", {}, "Overtime");
    const sel6_op2 = (0, _elementBuilder.default)("option", {}, "Yes");
    const sel6_op3 = (0, _elementBuilder.default)("option", {}, "No");
    const select6 = (0, _elementBuilder.default)("select", {}, null, sel6_op1, sel6_op2, sel6_op3);
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
    const select5 = (0, _elementBuilder.default)("select", {}, null, sel5_op1, sel5_op2, sel5_op3);
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
    const select4 = (0, _elementBuilder.default)("select", {}, null, sel4_op1, sel4_op2, sel4_op3, sel4_op4);
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
    const select3 = (0, _elementBuilder.default)("select", {}, null, sel3_op1, sel3_op2, sel3_op3);
    const selectDiv3 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select3, iconSpan3);
    const control3 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv3); // team

    const icon2 = (0, _elementBuilder.default)("i", {
      "class": "fas fa-handshake"
    }, null);
    const iconSpan2 = (0, _elementBuilder.default)("span", {
      "class": "icon is-left"
    }, null, icon2);
    const sel2_op1 = (0, _elementBuilder.default)("option", {}, "Team");
    const sel2_op2 = (0, _elementBuilder.default)("option", {}, "Orange");
    const sel2_op3 = (0, _elementBuilder.default)("option", {}, "Blue");
    const select2 = (0, _elementBuilder.default)("select", {}, null, sel2_op1, sel2_op2, sel2_op3);
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
    const select1 = (0, _elementBuilder.default)("select", {}, null, sel1_op1, sel1_op2, sel1_op3);
    const selectDiv1 = (0, _elementBuilder.default)("div", {
      "class": "select is-dark"
    }, null, select1, iconSpan1);
    const control1 = (0, _elementBuilder.default)("div", {
      "class": "control has-icons-left"
    }, null, selectDiv1);
    const filterField = (0, _elementBuilder.default)("div", {
      "class": "field is-grouped is-grouped-centered is-grouped-multiline"
    }, null, control1, control2, control3, control4, control5, control6, dateBtnParent, resetBtn);
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
      const deleteBtn = (0, _elementBuilder.default)("button", {
        "id": "deleteHeatmapBtn",
        "class": "button is-danger"
      }, "Delete Heatmap");
      const deleteBtnControl = (0, _elementBuilder.default)("div", {
        "class": "control"
      }, null, deleteBtn);
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
        "maxlength": "30"
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
          }, heatmap.name));
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
      "class": "container box"
    }, null, heatmapImageContainers); // append field and goal to page

    webpage.appendChild(parentShotContainer);
  },

  heatmapEventManager() {
    const generateHeatmapBtn = document.getElementById("generateHeatmapBtn");
    const saveHeatmapBtn = document.getElementById("saveHeatmapBtn");
    const deleteHeatmapBtn = document.getElementById("deleteHeatmapBtn");
    generateHeatmapBtn.addEventListener("click", _heatmapData.default.getUserShots);
    saveHeatmapBtn.addEventListener("click", _heatmapData.default.saveHeatmap);
    deleteHeatmapBtn.addEventListener("click", _heatmapData.default.deleteHeatmap);
  }

};
var _default = heatmaps;
exports.default = _default;

},{"./API":2,"./elementBuilder":3,"./heatmapData":6}],8:[function(require,module,exports){
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

},{"./API":2,"./elementBuilder":3,"./navbar":10}],9:[function(require,module,exports){
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

},{"./heatmaps":7,"./navbar":10}],10:[function(require,module,exports){
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpageNav = document.getElementById("nav-master");
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

  The functions below build the navbar from the inside out
*/

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
    }
  }

};
var _default = navbar;
exports.default = _default;

},{"./elementBuilder":3,"./gameplay":5,"./heatmaps":7,"./login":8,"./profile":11,"./shotData":13}],11:[function(require,module,exports){
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

},{"./API":2,"./elementBuilder":3}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./elementBuilder":3,"./gameData":4,"./shotClass":12}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwcy5qcyIsIi4uL3NjcmlwdHMvbG9naW4uanMiLCIuLi9zY3JpcHRzL21haW4uanMiLCIuLi9zY3JpcHRzL25hdmJhci5qcyIsIi4uL3NjcmlwdHMvcHJvZmlsZS5qcyIsIi4uL3NjcmlwdHMvc2hvdENsYXNzLmpzIiwiLi4vc2NyaXB0cy9zaG90RGF0YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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MUI7QUFDQSxNQUFBLFlBQVksQ0FBQyxNQUFiLEdBQXNCLElBQUksQ0FBQyxNQUEzQjtBQUNBLE1BQUEsWUFBWSxDQUFDLFVBQWIsR0FBMEIsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsUUFBaEIsRUFBMUI7QUFDQSxNQUFBLFlBQVksQ0FBQyxTQUFiLEdBQXlCLElBQUksQ0FBQyxTQUE5QjtBQUNBLE1BQUEsWUFBWSxDQUFDLEVBQWIsR0FBa0IsSUFBSSxDQUFDLEVBQXZCO0FBQ0EsTUFBQSxTQUFTLENBQUMsSUFBVixDQUFlLFlBQWY7QUFDRCxLQVhEO0FBYUEsSUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLFNBQVo7QUFDQSxJQUFBLFNBQVMsQ0FBQyxPQUFWLENBQWtCLENBQUMsSUFBRCxFQUFPLEdBQVAsS0FBZTtBQUMvQixZQUFNLFVBQVUsR0FBRyw2QkFBVSxRQUFWLEVBQW9CO0FBQUUsY0FBTyxRQUFPLEdBQUcsR0FBRyxDQUFFLEVBQXhCO0FBQTJCLGlCQUFTO0FBQXBDLE9BQXBCLEVBQTZFLFFBQU8sR0FBRyxHQUFHLENBQUUsRUFBNUYsQ0FBbkI7QUFDQSxNQUFBLGdCQUFnQixDQUFDLFdBQWpCLENBQTZCLFVBQTdCO0FBQ0EsTUFBQSxRQUFRLENBQUMsY0FBVCxDQUF5QixRQUFPLEdBQUcsR0FBRyxDQUFFLEVBQXhDLEVBQTJDLGdCQUEzQyxDQUE0RCxPQUE1RCxFQUFxRSxRQUFRLENBQUMsZUFBOUU7QUFDRCxLQUpEO0FBS0EsSUFBQSxXQUFXLEdBQUcsU0FBUyxDQUFDLE1BQXhCO0FBQ0EsSUFBQSx3QkFBd0IsR0FBRyxTQUFTLENBQUMsTUFBckM7QUFDRDs7QUF0VGMsQ0FBakI7ZUEwVGUsUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qXG4gKiBoZWF0bWFwLmpzIHYyLjAuNSB8IEphdmFTY3JpcHQgSGVhdG1hcCBMaWJyYXJ5XG4gKlxuICogQ29weXJpZ2h0IDIwMDgtMjAxNiBQYXRyaWNrIFdpZWQgPGhlYXRtYXBqc0BwYXRyaWNrLXdpZWQuYXQ+IC0gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgTUlUIGFuZCBCZWVyd2FyZSBsaWNlbnNlIFxuICpcbiAqIDo6IDIwMTYtMDktMDUgMDE6MTZcbiAqL1xuOyhmdW5jdGlvbiAobmFtZSwgY29udGV4dCwgZmFjdG9yeSkge1xuXG4gIC8vIFN1cHBvcnRzIFVNRC4gQU1ELCBDb21tb25KUy9Ob2RlLmpzIGFuZCBicm93c2VyIGNvbnRleHRcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTtcbiAgfSBlbHNlIHtcbiAgICBjb250ZXh0W25hbWVdID0gZmFjdG9yeSgpO1xuICB9XG5cbn0pKFwiaDMzN1wiLCB0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbi8vIEhlYXRtYXAgQ29uZmlnIHN0b3JlcyBkZWZhdWx0IHZhbHVlcyBhbmQgd2lsbCBiZSBtZXJnZWQgd2l0aCBpbnN0YW5jZSBjb25maWdcbnZhciBIZWF0bWFwQ29uZmlnID0ge1xuICBkZWZhdWx0UmFkaXVzOiA0MCxcbiAgZGVmYXVsdFJlbmRlcmVyOiAnY2FudmFzMmQnLFxuICBkZWZhdWx0R3JhZGllbnQ6IHsgMC4yNTogXCJyZ2IoMCwwLDI1NSlcIiwgMC41NTogXCJyZ2IoMCwyNTUsMClcIiwgMC44NTogXCJ5ZWxsb3dcIiwgMS4wOiBcInJnYigyNTUsMCwwKVwifSxcbiAgZGVmYXVsdE1heE9wYWNpdHk6IDEsXG4gIGRlZmF1bHRNaW5PcGFjaXR5OiAwLFxuICBkZWZhdWx0Qmx1cjogLjg1LFxuICBkZWZhdWx0WEZpZWxkOiAneCcsXG4gIGRlZmF1bHRZRmllbGQ6ICd5JyxcbiAgZGVmYXVsdFZhbHVlRmllbGQ6ICd2YWx1ZScsIFxuICBwbHVnaW5zOiB7fVxufTtcbnZhciBTdG9yZSA9IChmdW5jdGlvbiBTdG9yZUNsb3N1cmUoKSB7XG5cbiAgdmFyIFN0b3JlID0gZnVuY3Rpb24gU3RvcmUoY29uZmlnKSB7XG4gICAgdGhpcy5fY29vcmRpbmF0b3IgPSB7fTtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5fcmFkaSA9IFtdO1xuICAgIHRoaXMuX21pbiA9IDEwO1xuICAgIHRoaXMuX21heCA9IDE7XG4gICAgdGhpcy5feEZpZWxkID0gY29uZmlnWyd4RmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFhGaWVsZDtcbiAgICB0aGlzLl95RmllbGQgPSBjb25maWdbJ3lGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0WUZpZWxkO1xuICAgIHRoaXMuX3ZhbHVlRmllbGQgPSBjb25maWdbJ3ZhbHVlRmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFZhbHVlRmllbGQ7XG5cbiAgICBpZiAoY29uZmlnW1wicmFkaXVzXCJdKSB7XG4gICAgICB0aGlzLl9jZmdSYWRpdXMgPSBjb25maWdbXCJyYWRpdXNcIl07XG4gICAgfVxuICB9O1xuXG4gIHZhciBkZWZhdWx0UmFkaXVzID0gSGVhdG1hcENvbmZpZy5kZWZhdWx0UmFkaXVzO1xuXG4gIFN0b3JlLnByb3RvdHlwZSA9IHtcbiAgICAvLyB3aGVuIGZvcmNlUmVuZGVyID0gZmFsc2UgLT4gY2FsbGVkIGZyb20gc2V0RGF0YSwgb21pdHMgcmVuZGVyYWxsIGV2ZW50XG4gICAgX29yZ2FuaXNlRGF0YTogZnVuY3Rpb24oZGF0YVBvaW50LCBmb3JjZVJlbmRlcikge1xuICAgICAgICB2YXIgeCA9IGRhdGFQb2ludFt0aGlzLl94RmllbGRdO1xuICAgICAgICB2YXIgeSA9IGRhdGFQb2ludFt0aGlzLl95RmllbGRdO1xuICAgICAgICB2YXIgcmFkaSA9IHRoaXMuX3JhZGk7XG4gICAgICAgIHZhciBzdG9yZSA9IHRoaXMuX2RhdGE7XG4gICAgICAgIHZhciBtYXggPSB0aGlzLl9tYXg7XG4gICAgICAgIHZhciBtaW4gPSB0aGlzLl9taW47XG4gICAgICAgIHZhciB2YWx1ZSA9IGRhdGFQb2ludFt0aGlzLl92YWx1ZUZpZWxkXSB8fCAxO1xuICAgICAgICB2YXIgcmFkaXVzID0gZGF0YVBvaW50LnJhZGl1cyB8fCB0aGlzLl9jZmdSYWRpdXMgfHwgZGVmYXVsdFJhZGl1cztcblxuICAgICAgICBpZiAoIXN0b3JlW3hdKSB7XG4gICAgICAgICAgc3RvcmVbeF0gPSBbXTtcbiAgICAgICAgICByYWRpW3hdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXN0b3JlW3hdW3ldKSB7XG4gICAgICAgICAgc3RvcmVbeF1beV0gPSB2YWx1ZTtcbiAgICAgICAgICByYWRpW3hdW3ldID0gcmFkaXVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0b3JlW3hdW3ldICs9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdG9yZWRWYWwgPSBzdG9yZVt4XVt5XTtcblxuICAgICAgICBpZiAoc3RvcmVkVmFsID4gbWF4KSB7XG4gICAgICAgICAgaWYgKCFmb3JjZVJlbmRlcikge1xuICAgICAgICAgICAgdGhpcy5fbWF4ID0gc3RvcmVkVmFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldERhdGFNYXgoc3RvcmVkVmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHN0b3JlZFZhbCA8IG1pbikge1xuICAgICAgICAgIGlmICghZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21pbiA9IHN0b3JlZFZhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXREYXRhTWluKHN0b3JlZFZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIHg6IHgsIFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSwgXG4gICAgICAgICAgICByYWRpdXM6IHJhZGl1cyxcbiAgICAgICAgICAgIG1pbjogbWluLFxuICAgICAgICAgICAgbWF4OiBtYXggXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgX3VuT3JnYW5pemVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB1bm9yZ2FuaXplZERhdGEgPSBbXTtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fZGF0YTtcbiAgICAgIHZhciByYWRpID0gdGhpcy5fcmFkaTtcblxuICAgICAgZm9yICh2YXIgeCBpbiBkYXRhKSB7XG4gICAgICAgIGZvciAodmFyIHkgaW4gZGF0YVt4XSkge1xuXG4gICAgICAgICAgdW5vcmdhbml6ZWREYXRhLnB1c2goe1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICByYWRpdXM6IHJhZGlbeF1beV0sXG4gICAgICAgICAgICB2YWx1ZTogZGF0YVt4XVt5XVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1pbjogdGhpcy5fbWluLFxuICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgZGF0YTogdW5vcmdhbml6ZWREYXRhXG4gICAgICB9O1xuICAgIH0sXG4gICAgX29uRXh0cmVtYUNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdleHRyZW1hY2hhbmdlJywge1xuICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgbWF4OiB0aGlzLl9tYXhcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWRkRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoYXJndW1lbnRzWzBdLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGRhdGFBcnIgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIHZhciBkYXRhTGVuID0gZGF0YUFyci5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChkYXRhTGVuLS0pIHtcbiAgICAgICAgICB0aGlzLmFkZERhdGEuY2FsbCh0aGlzLCBkYXRhQXJyW2RhdGFMZW5dKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYWRkIHRvIHN0b3JlICBcbiAgICAgICAgdmFyIG9yZ2FuaXNlZEVudHJ5ID0gdGhpcy5fb3JnYW5pc2VEYXRhKGFyZ3VtZW50c1swXSwgdHJ1ZSk7XG4gICAgICAgIGlmIChvcmdhbmlzZWRFbnRyeSkge1xuICAgICAgICAgIC8vIGlmIGl0J3MgdGhlIGZpcnN0IGRhdGFwb2ludCBpbml0aWFsaXplIHRoZSBleHRyZW1hcyB3aXRoIGl0XG4gICAgICAgICAgaWYgKHRoaXMuX2RhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9taW4gPSB0aGlzLl9tYXggPSBvcmdhbmlzZWRFbnRyeS52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVycGFydGlhbCcsIHtcbiAgICAgICAgICAgIG1pbjogdGhpcy5fbWluLFxuICAgICAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgICAgICBkYXRhOiBbb3JnYW5pc2VkRW50cnldXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIGRhdGFQb2ludHMgPSBkYXRhLmRhdGE7XG4gICAgICB2YXIgcG9pbnRzTGVuID0gZGF0YVBvaW50cy5sZW5ndGg7XG5cblxuICAgICAgLy8gcmVzZXQgZGF0YSBhcnJheXNcbiAgICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICAgIHRoaXMuX3JhZGkgPSBbXTtcblxuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHBvaW50c0xlbjsgaSsrKSB7XG4gICAgICAgIHRoaXMuX29yZ2FuaXNlRGF0YShkYXRhUG9pbnRzW2ldLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9tYXggPSBkYXRhLm1heDtcbiAgICAgIHRoaXMuX21pbiA9IGRhdGEubWluIHx8IDA7XG4gICAgICBcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFRPRE86IGltcGxlbWVudFxuICAgIH0sXG4gICAgc2V0RGF0YU1heDogZnVuY3Rpb24obWF4KSB7XG4gICAgICB0aGlzLl9tYXggPSBtYXg7XG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YU1pbjogZnVuY3Rpb24obWluKSB7XG4gICAgICB0aGlzLl9taW4gPSBtaW47XG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0Q29vcmRpbmF0b3I6IGZ1bmN0aW9uKGNvb3JkaW5hdG9yKSB7XG4gICAgICB0aGlzLl9jb29yZGluYXRvciA9IGNvb3JkaW5hdG9yO1xuICAgIH0sXG4gICAgX2dldEludGVybmFsRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4geyBcbiAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgIG1pbjogdGhpcy5fbWluLCBcbiAgICAgICAgZGF0YTogdGhpcy5fZGF0YSxcbiAgICAgICAgcmFkaTogdGhpcy5fcmFkaSBcbiAgICAgIH07XG4gICAgfSxcbiAgICBnZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl91bk9yZ2FuaXplRGF0YSgpO1xuICAgIH0vKixcblxuICAgICAgVE9ETzogcmV0aGluay5cblxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB2YXIgcmFkaXVzID0gMTAwO1xuICAgICAgdmFyIHggPSBwb2ludC54O1xuICAgICAgdmFyIHkgPSBwb2ludC55O1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgICBpZiAoZGF0YVt4XSAmJiBkYXRhW3hdW3ldKSB7XG4gICAgICAgIHJldHVybiBkYXRhW3hdW3ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgICAvLyByYWRpYWwgc2VhcmNoIGZvciBkYXRhcG9pbnRzIGJhc2VkIG9uIGRlZmF1bHQgcmFkaXVzXG4gICAgICAgIGZvcih2YXIgZGlzdGFuY2UgPSAxOyBkaXN0YW5jZSA8IHJhZGl1czsgZGlzdGFuY2UrKykge1xuICAgICAgICAgIHZhciBuZWlnaGJvcnMgPSBkaXN0YW5jZSAqIDIgKzE7XG4gICAgICAgICAgdmFyIHN0YXJ0WCA9IHggLSBkaXN0YW5jZTtcbiAgICAgICAgICB2YXIgc3RhcnRZID0geSAtIGRpc3RhbmNlO1xuXG4gICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG5laWdoYm9yczsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBvID0gMDsgbyA8IG5laWdoYm9yczsgbysrKSB7XG4gICAgICAgICAgICAgIGlmICgoaSA9PSAwIHx8IGkgPT0gbmVpZ2hib3JzLTEpIHx8IChvID09IDAgfHwgbyA9PSBuZWlnaGJvcnMtMSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVtzdGFydFkraV0gJiYgZGF0YVtzdGFydFkraV1bc3RhcnRYK29dKSB7XG4gICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaChkYXRhW3N0YXJ0WStpXVtzdGFydFgrb10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIHZhbHVlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9Ki9cbiAgfTtcblxuXG4gIHJldHVybiBTdG9yZTtcbn0pKCk7XG5cbnZhciBDYW52YXMyZFJlbmRlcmVyID0gKGZ1bmN0aW9uIENhbnZhczJkUmVuZGVyZXJDbG9zdXJlKCkge1xuXG4gIHZhciBfZ2V0Q29sb3JQYWxldHRlID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgdmFyIGdyYWRpZW50Q29uZmlnID0gY29uZmlnLmdyYWRpZW50IHx8IGNvbmZpZy5kZWZhdWx0R3JhZGllbnQ7XG4gICAgdmFyIHBhbGV0dGVDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgcGFsZXR0ZUN0eCA9IHBhbGV0dGVDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHBhbGV0dGVDYW52YXMud2lkdGggPSAyNTY7XG4gICAgcGFsZXR0ZUNhbnZhcy5oZWlnaHQgPSAxO1xuXG4gICAgdmFyIGdyYWRpZW50ID0gcGFsZXR0ZUN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAyNTYsIDEpO1xuICAgIGZvciAodmFyIGtleSBpbiBncmFkaWVudENvbmZpZykge1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKGtleSwgZ3JhZGllbnRDb25maWdba2V5XSk7XG4gICAgfVxuXG4gICAgcGFsZXR0ZUN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcbiAgICBwYWxldHRlQ3R4LmZpbGxSZWN0KDAsIDAsIDI1NiwgMSk7XG5cbiAgICByZXR1cm4gcGFsZXR0ZUN0eC5nZXRJbWFnZURhdGEoMCwgMCwgMjU2LCAxKS5kYXRhO1xuICB9O1xuXG4gIHZhciBfZ2V0UG9pbnRUZW1wbGF0ZSA9IGZ1bmN0aW9uKHJhZGl1cywgYmx1ckZhY3Rvcikge1xuICAgIHZhciB0cGxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgdHBsQ3R4ID0gdHBsQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdmFyIHggPSByYWRpdXM7XG4gICAgdmFyIHkgPSByYWRpdXM7XG4gICAgdHBsQ2FudmFzLndpZHRoID0gdHBsQ2FudmFzLmhlaWdodCA9IHJhZGl1cyoyO1xuXG4gICAgaWYgKGJsdXJGYWN0b3IgPT0gMSkge1xuICAgICAgdHBsQ3R4LmJlZ2luUGF0aCgpO1xuICAgICAgdHBsQ3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICB0cGxDdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMSknO1xuICAgICAgdHBsQ3R4LmZpbGwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGdyYWRpZW50ID0gdHBsQ3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KHgsIHksIHJhZGl1cypibHVyRmFjdG9yLCB4LCB5LCByYWRpdXMpO1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsMCwwLDEpJyk7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwwLDAsMCknKTtcbiAgICAgIHRwbEN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcbiAgICAgIHRwbEN0eC5maWxsUmVjdCgwLCAwLCAyKnJhZGl1cywgMipyYWRpdXMpO1xuICAgIH1cblxuXG5cbiAgICByZXR1cm4gdHBsQ2FudmFzO1xuICB9O1xuXG4gIHZhciBfcHJlcGFyZURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHJlbmRlckRhdGEgPSBbXTtcbiAgICB2YXIgbWluID0gZGF0YS5taW47XG4gICAgdmFyIG1heCA9IGRhdGEubWF4O1xuICAgIHZhciByYWRpID0gZGF0YS5yYWRpO1xuICAgIHZhciBkYXRhID0gZGF0YS5kYXRhO1xuXG4gICAgdmFyIHhWYWx1ZXMgPSBPYmplY3Qua2V5cyhkYXRhKTtcbiAgICB2YXIgeFZhbHVlc0xlbiA9IHhWYWx1ZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUoeFZhbHVlc0xlbi0tKSB7XG4gICAgICB2YXIgeFZhbHVlID0geFZhbHVlc1t4VmFsdWVzTGVuXTtcbiAgICAgIHZhciB5VmFsdWVzID0gT2JqZWN0LmtleXMoZGF0YVt4VmFsdWVdKTtcbiAgICAgIHZhciB5VmFsdWVzTGVuID0geVZhbHVlcy5sZW5ndGg7XG4gICAgICB3aGlsZSh5VmFsdWVzTGVuLS0pIHtcbiAgICAgICAgdmFyIHlWYWx1ZSA9IHlWYWx1ZXNbeVZhbHVlc0xlbl07XG4gICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbeFZhbHVlXVt5VmFsdWVdO1xuICAgICAgICB2YXIgcmFkaXVzID0gcmFkaVt4VmFsdWVdW3lWYWx1ZV07XG4gICAgICAgIHJlbmRlckRhdGEucHVzaCh7XG4gICAgICAgICAgeDogeFZhbHVlLFxuICAgICAgICAgIHk6IHlWYWx1ZSxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgcmFkaXVzOiByYWRpdXNcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1pbjogbWluLFxuICAgICAgbWF4OiBtYXgsXG4gICAgICBkYXRhOiByZW5kZXJEYXRhXG4gICAgfTtcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIENhbnZhczJkUmVuZGVyZXIoY29uZmlnKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGNvbmZpZy5jb250YWluZXI7XG4gICAgdmFyIHNoYWRvd0NhbnZhcyA9IHRoaXMuc2hhZG93Q2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzID0gY29uZmlnLmNhbnZhcyB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgcmVuZGVyQm91bmRhcmllcyA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXMgPSBbMTAwMDAsIDEwMDAwLCAwLCAwXTtcblxuICAgIHZhciBjb21wdXRlZCA9IGdldENvbXB1dGVkU3R5bGUoY29uZmlnLmNvbnRhaW5lcikgfHwge307XG5cbiAgICBjYW52YXMuY2xhc3NOYW1lID0gJ2hlYXRtYXAtY2FudmFzJztcblxuICAgIHRoaXMuX3dpZHRoID0gY2FudmFzLndpZHRoID0gc2hhZG93Q2FudmFzLndpZHRoID0gY29uZmlnLndpZHRoIHx8ICsoY29tcHV0ZWQud2lkdGgucmVwbGFjZSgvcHgvLCcnKSk7XG4gICAgdGhpcy5faGVpZ2h0ID0gY2FudmFzLmhlaWdodCA9IHNoYWRvd0NhbnZhcy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IHx8ICsoY29tcHV0ZWQuaGVpZ2h0LnJlcGxhY2UoL3B4LywnJykpO1xuXG4gICAgdGhpcy5zaGFkb3dDdHggPSBzaGFkb3dDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgLy8gQFRPRE86XG4gICAgLy8gY29uZGl0aW9uYWwgd3JhcHBlclxuXG4gICAgY2FudmFzLnN0eWxlLmNzc1RleHQgPSBzaGFkb3dDYW52YXMuc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7dG9wOjA7JztcblxuICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgICB0aGlzLl9wYWxldHRlID0gX2dldENvbG9yUGFsZXR0ZShjb25maWcpO1xuICAgIHRoaXMuX3RlbXBsYXRlcyA9IHt9O1xuXG4gICAgdGhpcy5fc2V0U3R5bGVzKGNvbmZpZyk7XG4gIH07XG5cbiAgQ2FudmFzMmRSZW5kZXJlci5wcm90b3R5cGUgPSB7XG4gICAgcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgaWYgKGRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX2RyYXdBbHBoYShkYXRhKTtcbiAgICAgICAgdGhpcy5fY29sb3JpemUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlckFsbDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gcmVzZXQgcmVuZGVyIGJvdW5kYXJpZXNcbiAgICAgIHRoaXMuX2NsZWFyKCk7XG4gICAgICBpZiAoZGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5fZHJhd0FscGhhKF9wcmVwYXJlRGF0YShkYXRhKSk7XG4gICAgICAgIHRoaXMuX2NvbG9yaXplKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBfdXBkYXRlR3JhZGllbnQ6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fcGFsZXR0ZSA9IF9nZXRDb2xvclBhbGV0dGUoY29uZmlnKTtcbiAgICB9LFxuICAgIHVwZGF0ZUNvbmZpZzogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICBpZiAoY29uZmlnWydncmFkaWVudCddKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUdyYWRpZW50KGNvbmZpZyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9zZXRTdHlsZXMoY29uZmlnKTtcbiAgICB9LFxuICAgIHNldERpbWVuc2lvbnM6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgIHRoaXMuX3dpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLl9oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuc2hhZG93Q2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNoYWRvd0NhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfSxcbiAgICBfY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zaGFkb3dDdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQpO1xuICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQpO1xuICAgIH0sXG4gICAgX3NldFN0eWxlczogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9ibHVyID0gKGNvbmZpZy5ibHVyID09IDApPzA6KGNvbmZpZy5ibHVyIHx8IGNvbmZpZy5kZWZhdWx0Qmx1cik7XG5cbiAgICAgIGlmIChjb25maWcuYmFja2dyb3VuZENvbG9yKSB7XG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3dpZHRoID0gdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLnNoYWRvd0NhbnZhcy53aWR0aCA9IGNvbmZpZy53aWR0aCB8fCB0aGlzLl93aWR0aDtcbiAgICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuc2hhZG93Q2FudmFzLmhlaWdodCA9IGNvbmZpZy5oZWlnaHQgfHwgdGhpcy5faGVpZ2h0O1xuXG5cbiAgICAgIHRoaXMuX29wYWNpdHkgPSAoY29uZmlnLm9wYWNpdHkgfHwgMCkgKiAyNTU7XG4gICAgICB0aGlzLl9tYXhPcGFjaXR5ID0gKGNvbmZpZy5tYXhPcGFjaXR5IHx8IGNvbmZpZy5kZWZhdWx0TWF4T3BhY2l0eSkgKiAyNTU7XG4gICAgICB0aGlzLl9taW5PcGFjaXR5ID0gKGNvbmZpZy5taW5PcGFjaXR5IHx8IGNvbmZpZy5kZWZhdWx0TWluT3BhY2l0eSkgKiAyNTU7XG4gICAgICB0aGlzLl91c2VHcmFkaWVudE9wYWNpdHkgPSAhIWNvbmZpZy51c2VHcmFkaWVudE9wYWNpdHk7XG4gICAgfSxcbiAgICBfZHJhd0FscGhhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgbWluID0gdGhpcy5fbWluID0gZGF0YS5taW47XG4gICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4ID0gZGF0YS5tYXg7XG4gICAgICB2YXIgZGF0YSA9IGRhdGEuZGF0YSB8fCBbXTtcbiAgICAgIHZhciBkYXRhTGVuID0gZGF0YS5sZW5ndGg7XG4gICAgICAvLyBvbiBhIHBvaW50IGJhc2lzP1xuICAgICAgdmFyIGJsdXIgPSAxIC0gdGhpcy5fYmx1cjtcblxuICAgICAgd2hpbGUoZGF0YUxlbi0tKSB7XG5cbiAgICAgICAgdmFyIHBvaW50ID0gZGF0YVtkYXRhTGVuXTtcblxuICAgICAgICB2YXIgeCA9IHBvaW50Lng7XG4gICAgICAgIHZhciB5ID0gcG9pbnQueTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IHBvaW50LnJhZGl1cztcbiAgICAgICAgLy8gaWYgdmFsdWUgaXMgYmlnZ2VyIHRoYW4gbWF4XG4gICAgICAgIC8vIHVzZSBtYXggYXMgdmFsdWVcbiAgICAgICAgdmFyIHZhbHVlID0gTWF0aC5taW4ocG9pbnQudmFsdWUsIG1heCk7XG4gICAgICAgIHZhciByZWN0WCA9IHggLSByYWRpdXM7XG4gICAgICAgIHZhciByZWN0WSA9IHkgLSByYWRpdXM7XG4gICAgICAgIHZhciBzaGFkb3dDdHggPSB0aGlzLnNoYWRvd0N0eDtcblxuXG5cblxuICAgICAgICB2YXIgdHBsO1xuICAgICAgICBpZiAoIXRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdKSB7XG4gICAgICAgICAgdGhpcy5fdGVtcGxhdGVzW3JhZGl1c10gPSB0cGwgPSBfZ2V0UG9pbnRUZW1wbGF0ZShyYWRpdXMsIGJsdXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRwbCA9IHRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdO1xuICAgICAgICB9XG4gICAgICAgIC8vIHZhbHVlIGZyb20gbWluaW11bSAvIHZhbHVlIHJhbmdlXG4gICAgICAgIC8vID0+IFswLCAxXVxuICAgICAgICB2YXIgdGVtcGxhdGVBbHBoYSA9ICh2YWx1ZS1taW4pLyhtYXgtbWluKTtcbiAgICAgICAgLy8gdGhpcyBmaXhlcyAjMTc2OiBzbWFsbCB2YWx1ZXMgYXJlIG5vdCB2aXNpYmxlIGJlY2F1c2UgZ2xvYmFsQWxwaGEgPCAuMDEgY2Fubm90IGJlIHJlYWQgZnJvbSBpbWFnZURhdGFcbiAgICAgICAgc2hhZG93Q3R4Lmdsb2JhbEFscGhhID0gdGVtcGxhdGVBbHBoYSA8IC4wMSA/IC4wMSA6IHRlbXBsYXRlQWxwaGE7XG5cbiAgICAgICAgc2hhZG93Q3R4LmRyYXdJbWFnZSh0cGwsIHJlY3RYLCByZWN0WSk7XG5cbiAgICAgICAgLy8gdXBkYXRlIHJlbmRlckJvdW5kYXJpZXNcbiAgICAgICAgaWYgKHJlY3RYIDwgdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXSA9IHJlY3RYO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFkgPCB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzFdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzFdID0gcmVjdFk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWN0WCArIDIqcmFkaXVzID4gdGhpcy5fcmVuZGVyQm91bmRhcmllc1syXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1syXSA9IHJlY3RYICsgMipyYWRpdXM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWN0WSArIDIqcmFkaXVzID4gdGhpcy5fcmVuZGVyQm91bmRhcmllc1szXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1szXSA9IHJlY3RZICsgMipyYWRpdXM7XG4gICAgICAgICAgfVxuXG4gICAgICB9XG4gICAgfSxcbiAgICBfY29sb3JpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHggPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdO1xuICAgICAgdmFyIHkgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzFdO1xuICAgICAgdmFyIHdpZHRoID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1syXSAtIHg7XG4gICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1szXSAtIHk7XG4gICAgICB2YXIgbWF4V2lkdGggPSB0aGlzLl93aWR0aDtcbiAgICAgIHZhciBtYXhIZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XG4gICAgICB2YXIgb3BhY2l0eSA9IHRoaXMuX29wYWNpdHk7XG4gICAgICB2YXIgbWF4T3BhY2l0eSA9IHRoaXMuX21heE9wYWNpdHk7XG4gICAgICB2YXIgbWluT3BhY2l0eSA9IHRoaXMuX21pbk9wYWNpdHk7XG4gICAgICB2YXIgdXNlR3JhZGllbnRPcGFjaXR5ID0gdGhpcy5fdXNlR3JhZGllbnRPcGFjaXR5O1xuXG4gICAgICBpZiAoeCA8IDApIHtcbiAgICAgICAgeCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoeSA8IDApIHtcbiAgICAgICAgeSA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoeCArIHdpZHRoID4gbWF4V2lkdGgpIHtcbiAgICAgICAgd2lkdGggPSBtYXhXaWR0aCAtIHg7XG4gICAgICB9XG4gICAgICBpZiAoeSArIGhlaWdodCA+IG1heEhlaWdodCkge1xuICAgICAgICBoZWlnaHQgPSBtYXhIZWlnaHQgLSB5O1xuICAgICAgfVxuXG4gICAgICB2YXIgaW1nID0gdGhpcy5zaGFkb3dDdHguZ2V0SW1hZ2VEYXRhKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgdmFyIGltZ0RhdGEgPSBpbWcuZGF0YTtcbiAgICAgIHZhciBsZW4gPSBpbWdEYXRhLmxlbmd0aDtcbiAgICAgIHZhciBwYWxldHRlID0gdGhpcy5fcGFsZXR0ZTtcblxuXG4gICAgICBmb3IgKHZhciBpID0gMzsgaSA8IGxlbjsgaSs9IDQpIHtcbiAgICAgICAgdmFyIGFscGhhID0gaW1nRGF0YVtpXTtcbiAgICAgICAgdmFyIG9mZnNldCA9IGFscGhhICogNDtcblxuXG4gICAgICAgIGlmICghb2Zmc2V0KSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZmluYWxBbHBoYTtcbiAgICAgICAgaWYgKG9wYWNpdHkgPiAwKSB7XG4gICAgICAgICAgZmluYWxBbHBoYSA9IG9wYWNpdHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGFscGhhIDwgbWF4T3BhY2l0eSkge1xuICAgICAgICAgICAgaWYgKGFscGhhIDwgbWluT3BhY2l0eSkge1xuICAgICAgICAgICAgICBmaW5hbEFscGhhID0gbWluT3BhY2l0eTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBhbHBoYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmluYWxBbHBoYSA9IG1heE9wYWNpdHk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaW1nRGF0YVtpLTNdID0gcGFsZXR0ZVtvZmZzZXRdO1xuICAgICAgICBpbWdEYXRhW2ktMl0gPSBwYWxldHRlW29mZnNldCArIDFdO1xuICAgICAgICBpbWdEYXRhW2ktMV0gPSBwYWxldHRlW29mZnNldCArIDJdO1xuICAgICAgICBpbWdEYXRhW2ldID0gdXNlR3JhZGllbnRPcGFjaXR5ID8gcGFsZXR0ZVtvZmZzZXQgKyAzXSA6IGZpbmFsQWxwaGE7XG5cbiAgICAgIH1cblxuICAgICAgaW1nLmRhdGEgPSBpbWdEYXRhO1xuICAgICAgdGhpcy5jdHgucHV0SW1hZ2VEYXRhKGltZywgeCwgeSk7XG5cbiAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXMgPSBbMTAwMCwgMTAwMCwgMCwgMF07XG5cbiAgICB9LFxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB2YXIgc2hhZG93Q3R4ID0gdGhpcy5zaGFkb3dDdHg7XG4gICAgICB2YXIgaW1nID0gc2hhZG93Q3R4LmdldEltYWdlRGF0YShwb2ludC54LCBwb2ludC55LCAxLCAxKTtcbiAgICAgIHZhciBkYXRhID0gaW1nLmRhdGFbM107XG4gICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4O1xuICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbjtcblxuICAgICAgdmFsdWUgPSAoTWF0aC5hYnMobWF4LW1pbikgKiAoZGF0YS8yNTUpKSA+PiAwO1xuXG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcbiAgICBnZXREYXRhVVJMOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbnZhcy50b0RhdGFVUkwoKTtcbiAgICB9XG4gIH07XG5cblxuICByZXR1cm4gQ2FudmFzMmRSZW5kZXJlcjtcbn0pKCk7XG5cblxudmFyIFJlbmRlcmVyID0gKGZ1bmN0aW9uIFJlbmRlcmVyQ2xvc3VyZSgpIHtcblxuICB2YXIgcmVuZGVyZXJGbiA9IGZhbHNlO1xuXG4gIGlmIChIZWF0bWFwQ29uZmlnWydkZWZhdWx0UmVuZGVyZXInXSA9PT0gJ2NhbnZhczJkJykge1xuICAgIHJlbmRlcmVyRm4gPSBDYW52YXMyZFJlbmRlcmVyO1xuICB9XG5cbiAgcmV0dXJuIHJlbmRlcmVyRm47XG59KSgpO1xuXG5cbnZhciBVdGlsID0ge1xuICBtZXJnZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1lcmdlZCA9IHt9O1xuICAgIHZhciBhcmdzTGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3NMZW47IGkrKykge1xuICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1tpXVxuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBtZXJnZWRba2V5XSA9IG9ialtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VkO1xuICB9XG59O1xuLy8gSGVhdG1hcCBDb25zdHJ1Y3RvclxudmFyIEhlYXRtYXAgPSAoZnVuY3Rpb24gSGVhdG1hcENsb3N1cmUoKSB7XG5cbiAgdmFyIENvb3JkaW5hdG9yID0gKGZ1bmN0aW9uIENvb3JkaW5hdG9yQ2xvc3VyZSgpIHtcblxuICAgIGZ1bmN0aW9uIENvb3JkaW5hdG9yKCkge1xuICAgICAgdGhpcy5jU3RvcmUgPSB7fTtcbiAgICB9O1xuXG4gICAgQ29vcmRpbmF0b3IucHJvdG90eXBlID0ge1xuICAgICAgb246IGZ1bmN0aW9uKGV2dE5hbWUsIGNhbGxiYWNrLCBzY29wZSkge1xuICAgICAgICB2YXIgY1N0b3JlID0gdGhpcy5jU3RvcmU7XG5cbiAgICAgICAgaWYgKCFjU3RvcmVbZXZ0TmFtZV0pIHtcbiAgICAgICAgICBjU3RvcmVbZXZ0TmFtZV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBjU3RvcmVbZXZ0TmFtZV0ucHVzaCgoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwoc2NvcGUsIGRhdGEpO1xuICAgICAgICB9KSk7XG4gICAgICB9LFxuICAgICAgZW1pdDogZnVuY3Rpb24oZXZ0TmFtZSwgZGF0YSkge1xuICAgICAgICB2YXIgY1N0b3JlID0gdGhpcy5jU3RvcmU7XG4gICAgICAgIGlmIChjU3RvcmVbZXZ0TmFtZV0pIHtcbiAgICAgICAgICB2YXIgbGVuID0gY1N0b3JlW2V2dE5hbWVdLmxlbmd0aDtcbiAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGNTdG9yZVtldnROYW1lXVtpXTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gQ29vcmRpbmF0b3I7XG4gIH0pKCk7XG5cblxuICB2YXIgX2Nvbm5lY3QgPSBmdW5jdGlvbihzY29wZSkge1xuICAgIHZhciByZW5kZXJlciA9IHNjb3BlLl9yZW5kZXJlcjtcbiAgICB2YXIgY29vcmRpbmF0b3IgPSBzY29wZS5fY29vcmRpbmF0b3I7XG4gICAgdmFyIHN0b3JlID0gc2NvcGUuX3N0b3JlO1xuXG4gICAgY29vcmRpbmF0b3Iub24oJ3JlbmRlcnBhcnRpYWwnLCByZW5kZXJlci5yZW5kZXJQYXJ0aWFsLCByZW5kZXJlcik7XG4gICAgY29vcmRpbmF0b3Iub24oJ3JlbmRlcmFsbCcsIHJlbmRlcmVyLnJlbmRlckFsbCwgcmVuZGVyZXIpO1xuICAgIGNvb3JkaW5hdG9yLm9uKCdleHRyZW1hY2hhbmdlJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2NvcGUuX2NvbmZpZy5vbkV4dHJlbWFDaGFuZ2UgJiZcbiAgICAgIHNjb3BlLl9jb25maWcub25FeHRyZW1hQ2hhbmdlKHtcbiAgICAgICAgbWluOiBkYXRhLm1pbixcbiAgICAgICAgbWF4OiBkYXRhLm1heCxcbiAgICAgICAgZ3JhZGllbnQ6IHNjb3BlLl9jb25maWdbJ2dyYWRpZW50J10gfHwgc2NvcGUuX2NvbmZpZ1snZGVmYXVsdEdyYWRpZW50J11cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN0b3JlLnNldENvb3JkaW5hdG9yKGNvb3JkaW5hdG9yKTtcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIEhlYXRtYXAoKSB7XG4gICAgdmFyIGNvbmZpZyA9IHRoaXMuX2NvbmZpZyA9IFV0aWwubWVyZ2UoSGVhdG1hcENvbmZpZywgYXJndW1lbnRzWzBdIHx8IHt9KTtcbiAgICB0aGlzLl9jb29yZGluYXRvciA9IG5ldyBDb29yZGluYXRvcigpO1xuICAgIGlmIChjb25maWdbJ3BsdWdpbiddKSB7XG4gICAgICB2YXIgcGx1Z2luVG9Mb2FkID0gY29uZmlnWydwbHVnaW4nXTtcbiAgICAgIGlmICghSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpblRvTG9hZF0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbHVnaW4gXFwnJysgcGx1Z2luVG9Mb2FkICsgJ1xcJyBub3QgZm91bmQuIE1heWJlIGl0IHdhcyBub3QgcmVnaXN0ZXJlZC4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwbHVnaW4gPSBIZWF0bWFwQ29uZmlnLnBsdWdpbnNbcGx1Z2luVG9Mb2FkXTtcbiAgICAgICAgLy8gc2V0IHBsdWdpbiByZW5kZXJlciBhbmQgc3RvcmVcbiAgICAgICAgdGhpcy5fcmVuZGVyZXIgPSBuZXcgcGx1Z2luLnJlbmRlcmVyKGNvbmZpZyk7XG4gICAgICAgIHRoaXMuX3N0b3JlID0gbmV3IHBsdWdpbi5zdG9yZShjb25maWcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBSZW5kZXJlcihjb25maWcpO1xuICAgICAgdGhpcy5fc3RvcmUgPSBuZXcgU3RvcmUoY29uZmlnKTtcbiAgICB9XG4gICAgX2Nvbm5lY3QodGhpcyk7XG4gIH07XG5cbiAgLy8gQFRPRE86XG4gIC8vIGFkZCBBUEkgZG9jdW1lbnRhdGlvblxuICBIZWF0bWFwLnByb3RvdHlwZSA9IHtcbiAgICBhZGREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLmFkZERhdGEuYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUucmVtb3ZlRGF0YSAmJiB0aGlzLl9zdG9yZS5yZW1vdmVEYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGEuYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNYXg6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YU1heC5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YU1pbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhTWluLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBjb25maWd1cmU6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fY29uZmlnID0gVXRpbC5tZXJnZSh0aGlzLl9jb25maWcsIGNvbmZpZyk7XG4gICAgICB0aGlzLl9yZW5kZXJlci51cGRhdGVDb25maWcodGhpcy5fY29uZmlnKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX3N0b3JlLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlcGFpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fc3RvcmUuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc3RvcmUuZ2V0RGF0YSgpO1xuICAgIH0sXG4gICAgZ2V0RGF0YVVSTDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIuZ2V0RGF0YVVSTCgpO1xuICAgIH0sXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcblxuICAgICAgaWYgKHRoaXMuX3N0b3JlLmdldFZhbHVlQXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlLmdldFZhbHVlQXQocG9pbnQpO1xuICAgICAgfSBlbHNlICBpZiAodGhpcy5fcmVuZGVyZXIuZ2V0VmFsdWVBdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIuZ2V0VmFsdWVBdChwb2ludCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIEhlYXRtYXA7XG5cbn0pKCk7XG5cblxuLy8gY29yZVxudmFyIGhlYXRtYXBGYWN0b3J5ID0ge1xuICBjcmVhdGU6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHJldHVybiBuZXcgSGVhdG1hcChjb25maWcpO1xuICB9LFxuICByZWdpc3RlcjogZnVuY3Rpb24ocGx1Z2luS2V5LCBwbHVnaW4pIHtcbiAgICBIZWF0bWFwQ29uZmlnLnBsdWdpbnNbcGx1Z2luS2V5XSA9IHBsdWdpbjtcbiAgfVxufTtcblxucmV0dXJuIGhlYXRtYXBGYWN0b3J5O1xuXG5cbn0pOyIsImNvbnN0IFVSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo4MDg4XCJcclxuXHJcbmNvbnN0IEFQSSA9IHtcclxuXHJcbiAgZ2V0U2luZ2xlSXRlbShleHRlbnNpb24sIGlkKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZ2V0QWxsKGV4dGVuc2lvbikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCwge1xyXG4gICAgICBtZXRob2Q6IFwiREVMRVRFXCJcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKGUgPT4gZS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgcG9zdEl0ZW0oZXh0ZW5zaW9uLCBvYmopIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgcHV0SXRlbShleHRlbnNpb24sIG9iaikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCwge1xyXG4gICAgICBtZXRob2Q6IFwiUFVUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFQSSIsImZ1bmN0aW9uIGVsQnVpbGRlcihuYW1lLCBhdHRyaWJ1dGVzT2JqLCB0eHQsIC4uLmNoaWxkcmVuKSB7XHJcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xyXG4gIGZvciAobGV0IGF0dHIgaW4gYXR0cmlidXRlc09iaikge1xyXG4gICAgZWwuc2V0QXR0cmlidXRlKGF0dHIsIGF0dHJpYnV0ZXNPYmpbYXR0cl0pO1xyXG4gIH1cclxuICBlbC50ZXh0Q29udGVudCA9IHR4dCB8fCBudWxsO1xyXG4gIGNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgZWwuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gIH0pXHJcbiAgcmV0dXJuIGVsO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBlbEJ1aWxkZXIiLCJpbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIjtcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCI7XHJcbmltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIjtcclxuXHJcbi8vIHRoZSBwdXJwb3NlIG9mIHRoaXMgbW9kdWxlIGlzIHRvOlxyXG4vLyAxLiBzYXZlIGFsbCBjb250ZW50IGluIHRoZSBnYW1lcGxheSBwYWdlIChzaG90IGFuZCBnYW1lIGRhdGEpIHRvIHRoZSBkYXRhYmFzZVxyXG4vLyAyLiBpbW1lZGlhdGVseSBjbGVhciB0aGUgZ2FtZXBsYXkgY29udGFpbmVycyBvZiBjb250ZW50IG9uIHNhdmVcclxuLy8gMy4gaW1tZWRpYXRlbHkgcmVzZXQgYWxsIGdsb2JhbCB2YXJpYWJsZXMgaW4gdGhlIHNob3RkYXRhIGZpbGUgdG8gYWxsb3cgdGhlIHVzZXIgdG8gYmVnaW4gc2F2aW5nIHNob3RzIGFuZCBlbnRlcmluZyBnYW1lIGRhdGEgZm9yIHRoZWlyIG5leHQgZ2FtZVxyXG4vLyA0LiBhZmZvcmRhbmNlIGZvciB1c2VyIHRvIHJlY2FsbCBhbGwgZGF0YSBmcm9tIHByZXZpb3VzIHNhdmVkIGdhbWUgZm9yIGVkaXRpbmdcclxuLy8gNS4gaW5jbHVkZSBhbnkgb3RoZXIgZnVuY3Rpb25zIG5lZWRlZCB0byBzdXBwb3J0IHRoZSBmaXJzdCA0IHJlcXVpcmVtZW50c1xyXG5cclxuLy8gdGhpcyBnbG9iYWwgdmFyaWFibGUgaXMgdXNlZCB0byBwYXNzIHNhdmVkIHNob3RzLCBiYWxsIHNwZWVkLCBhbmQgYWVyaWFsIGJvb2xlYW4gdG8gc2hvdERhdGEuanMgZHVyaW5nIHRoZSBlZGl0IHByb2Nlc3NcclxubGV0IHNhdmVkR2FtZU9iamVjdDtcclxubGV0IHB1dFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxubGV0IHBvc3RQcm9taXNlc0VkaXRNb2RlID0gW11cclxubGV0IHBvc3RQcm9taXNlcyA9IFtdO1xyXG5cclxuY29uc3QgZ2FtZURhdGEgPSB7XHJcblxyXG4gIGdhbWVUeXBlQnV0dG9uVG9nZ2xlKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdG9nZ2xlcyB0aGUgXCJpcy1zZWxlY3RlZFwiIGNsYXNzIGJldHdlZW4gdGhlIGdhbWUgdHlwZSBidXR0b25zXHJcblxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGJ0bkNsaWNrZWQgPSBlLnRhcmdldDtcclxuXHJcbiAgICBpZiAoIWJ0bkNsaWNrZWQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgY29uc3QgY3VycmVudEdhbWVUeXBlQnRuID0gZ2FtZVR5cGVCdG5zLmZpbHRlcihidG4gPT4gYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICByZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKSB7XHJcbiAgICBzYXZlZEdhbWVPYmplY3QgPSB1bmRlZmluZWQ7XHJcbiAgICBwdXRQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbiAgICBwb3N0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG4gICAgcG9zdFByb21pc2VzID0gW107XHJcbiAgfSxcclxuXHJcbiAgcHV0RWRpdGVkU2hvdHMocHJldmlvdXNseVNhdmVkU2hvdHNBcnIpIHtcclxuICAgIC8vIFBVVCBmaXJzdCwgc2ljbmUgeW91IGNhbid0IHNhdmUgYSBnYW1lIGluaXRpYWxseSB3aXRob3V0IGF0IGxlYXN0IDEgc2hvdFxyXG4gICAgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgLy8gZXZlbiB0aG91Z2ggaXQncyBhIFBVVCwgd2UgaGF2ZSB0byByZWZvcm1hdCB0aGUgX2ZpZWxkWCBzeW50YXggdG8gZmllbGRYXHJcbiAgICAgIGxldCBzaG90Rm9yUHV0ID0ge307XHJcbiAgICAgIHNob3RGb3JQdXQuZ2FtZUlkID0gc2F2ZWRHYW1lT2JqZWN0LmlkO1xyXG4gICAgICBzaG90Rm9yUHV0LmZpZWxkWCA9IHNob3QuX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclB1dC5maWVsZFkgPSBzaG90Ll9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQdXQuZ29hbFggPSBzaG90Ll9nb2FsWDtcclxuICAgICAgc2hvdEZvclB1dC5nb2FsWSA9IHNob3QuX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUHV0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdC5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclB1dC5hZXJpYWwgPSBzaG90Ll9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQdXQudGltZVN0YW1wID0gc2hvdC5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcHV0UHJvbWlzZXNFZGl0TW9kZS5wdXNoKEFQSS5wdXRJdGVtKGBzaG90cy8ke3Nob3QuaWR9YCwgc2hvdEZvclB1dCkpO1xyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwdXRQcm9taXNlc0VkaXRNb2RlKVxyXG4gIH0sXHJcblxyXG4gIHBvc3ROZXdTaG90c01hZGVEdXJpbmdFZGl0TW9kZShzaG90c05vdFlldFBvc3RlZEFycikge1xyXG4gICAgc2hvdHNOb3RZZXRQb3N0ZWRBcnIuZm9yRWFjaChzaG90T2JqID0+IHtcclxuICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgIHNob3RGb3JQb3N0LmdhbWVJZCA9IHNhdmVkR2FtZU9iamVjdC5pZDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRYID0gc2hvdE9iai5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFkgPSBzaG90T2JqLl9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxYID0gc2hvdE9iai5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxZID0gc2hvdE9iai5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdE9iai5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclBvc3QuYWVyaWFsID0gc2hvdE9iai5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUG9zdC50aW1lU3RhbXAgPSBzaG90T2JqLl90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwb3N0UHJvbWlzZXNFZGl0TW9kZS5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RzXCIsIHNob3RGb3JQb3N0KSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocG9zdFByb21pc2VzRWRpdE1vZGUpXHJcbiAgfSxcclxuXHJcbiAgcG9zdE5ld1Nob3RzKGdhbWVJZCkge1xyXG4gICAgLy8gcG9zdCBzaG90cyB3aXRoIGdhbWVJZFxyXG4gICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yU2F2aW5nKCk7XHJcbiAgICBzaG90QXJyLmZvckVhY2goc2hvdE9iaiA9PiB7XHJcbiAgICAgIGxldCBzaG90Rm9yUG9zdCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBnYW1lSWQ7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclBvc3QudGltZVN0YW1wID0gc2hvdE9iai5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcG9zdFByb21pc2VzLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpKTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocG9zdFByb21pc2VzKVxyXG4gIH0sXHJcblxyXG4gIHNhdmVEYXRhKGdhbWVEYXRhT2JqLCBzYXZpbmdFZGl0ZWRHYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGZpcnN0IGRldGVybWluZXMgaWYgYSBnYW1lIGlzIGJlaW5nIHNhdmVkIGFzIG5ldywgb3IgYSBwcmV2aW91c2x5IHNhdmVkIGdhbWUgaXMgYmVpbmcgZWRpdGVkXHJcbiAgICAvLyBpZiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUsIHRoZSBnYW1lIGlzIFBVVCwgYWxsIHNob3RzIHNhdmVkIHByZXZpb3VzbHkgYXJlIFBVVCwgYW5kIG5ldyBzaG90cyBhcmUgUE9TVEVEXHJcbiAgICAvLyBpZiB0aGUgZ2FtZSBpcyBhIG5ldyBnYW1lIGFsdG9nZXRoZXIsIHRoZW4gdGhlIGdhbWUgaXMgUE9TVEVEIGFuZCBhbGwgc2hvdHMgYXJlIFBPU1RFRFxyXG4gICAgLy8gdGhlbiBmdW5jdGlvbnMgYXJlIGNhbGxlZCB0byByZWxvYWQgdGhlIG1hc3RlciBjb250YWluZXIgYW5kIHJlc2V0IGdsb2JhbCBzaG90IGRhdGEgdmFyaWFibGVzXHJcblxyXG4gICAgaWYgKHNhdmluZ0VkaXRlZEdhbWUpIHtcclxuICAgICAgLy8gdXNlIElEIG9mIGdhbWUgc3RvcmVkIGluIGdsb2JhbCB2YXJcclxuICAgICAgQVBJLnB1dEl0ZW0oYGdhbWVzLyR7c2F2ZWRHYW1lT2JqZWN0LmlkfWAsIGdhbWVEYXRhT2JqKVxyXG4gICAgICAgIC50aGVuKGdhbWVQVVQgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJQVVQgR0FNRVwiLCBnYW1lUFVUKVxyXG4gICAgICAgICAgLy8gcG9zdCBzaG90cyB3aXRoIGdhbWVJZFxyXG4gICAgICAgICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yU2F2aW5nKCk7XHJcbiAgICAgICAgICBjb25zdCBwcmV2aW91c2x5U2F2ZWRTaG90c0FyciA9IFtdO1xyXG4gICAgICAgICAgY29uc3Qgc2hvdHNOb3RZZXRQb3N0ZWRBcnIgPSBbXTtcclxuXHJcbiAgICAgICAgICAvLyBjcmVhdGUgYXJyYXlzIGZvciBQVVQgYW5kIFBPU1QgZnVuY3Rpb25zIChpZiB0aGVyZSdzIGFuIGlkIGluIHRoZSBhcnJheSwgaXQncyBiZWVuIHNhdmVkIHRvIHRoZSBkYXRhYmFzZSBiZWZvcmUpXHJcbiAgICAgICAgICBzaG90QXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChzaG90LmlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBwcmV2aW91c2x5U2F2ZWRTaG90c0Fyci5wdXNoKHNob3QpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHNob3RzTm90WWV0UG9zdGVkQXJyLnB1c2goc2hvdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgLy8gY2FsbCBmdW5jdGlvbnMgdG8gUFVUIGFuZCBQT1NUXHJcbiAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0aGF0IGNsZWFyIGdhbWVwbGF5IGNvbnRlbnQgYW5kIHJlc2V0IGdsb2JhbCBzaG90L2dhbWUgZGF0YSB2YXJpYWJsZXNcclxuICAgICAgICAgIGdhbWVEYXRhLnB1dEVkaXRlZFNob3RzKHByZXZpb3VzbHlTYXZlZFNob3RzQXJyKVxyXG4gICAgICAgICAgICAudGhlbih4ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBVVFM6XCIsIHgpXHJcbiAgICAgICAgICAgICAgLy8gaWYgbm8gbmV3IHNob3RzIHdlcmUgbWFkZSwgcmVsb2FkLiBlbHNlIHBvc3QgbmV3IHNob3RzXHJcbiAgICAgICAgICAgICAgaWYgKHNob3RzTm90WWV0UG9zdGVkQXJyLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lRGF0YS5wb3N0TmV3U2hvdHNNYWRlRHVyaW5nRWRpdE1vZGUoc2hvdHNOb3RZZXRQb3N0ZWRBcnIpXHJcbiAgICAgICAgICAgICAgICAgIC50aGVuKHkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUE9TVFM6XCIsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLnBvc3RJdGVtKFwiZ2FtZXNcIiwgZ2FtZURhdGFPYmopXHJcbiAgICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmlkKVxyXG4gICAgICAgIC50aGVuKGdhbWVJZCA9PiB7XHJcbiAgICAgICAgICBnYW1lRGF0YS5wb3N0TmV3U2hvdHMoZ2FtZUlkKVxyXG4gICAgICAgICAgICAudGhlbih6ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNBVkVEIE5FVyBTSE9UU1wiLCB6KTtcclxuICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHBhY2thZ2VHYW1lRGF0YSgpIHtcclxuXHJcbiAgICAvLyBnZXQgdXNlciBJRCBmcm9tIHNlc3Npb24gc3RvcmFnZVxyXG4gICAgLy8gcGFja2FnZSBlYWNoIGlucHV0IGZyb20gZ2FtZSBkYXRhIGNvbnRhaW5lciBpbnRvIHZhcmlhYmxlc1xyXG4gICAgLy8gVE9ETzogY29uZGl0aW9uYWwgc3RhdGVtZW50IHRvIHByZXZlbnQgYmxhbmsgc2NvcmUgZW50cmllc1xyXG4gICAgLy8gVE9ETzogY3JlYXRlIGEgbW9kYWwgYXNraW5nIHVzZXIgaWYgdGhleSB3YW50IHRvIHNhdmUgZ2FtZVxyXG5cclxuICAgIC8vIHBsYXllcklkXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKSk7XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlICgxdjEsIDJ2MiwgM3YzKVxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGdhbWVUeXBlID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGdhbWVUeXBlQnRucy5mb3JFYWNoKGJ0biA9PiB7XHJcbiAgICAgIGlmIChidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgICBnYW1lVHlwZSA9IGJ0bi50ZXh0Q29udGVudFxyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGdhbWUgbW9kZSAobm90ZTogZGlkIG5vdCB1c2UgYm9vbGVhbiBpbiBjYXNlIG1vcmUgZ2FtZSBtb2RlcyBhcmUgc3VwcG9ydGVkIGluIHRoZSBmdXR1cmUpXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbF9nYW1lTW9kZS52YWx1ZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIC8vIG15IHRlYW0gKG5vdGU6IGRpZCBub3QgdXNlIGJvb2xlYW4gaW4gcHJlcGFyYXRpb24gZm9yIHVzZXJzIHRvIGVudGVyIHRoZSBjbHViIGluZm9ybWF0aW9uKVxyXG4gICAgY29uc3Qgc2VsX3RlYW1Db2xvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgbGV0IG15VGVhbTtcclxuICAgIGlmIChzZWxfdGVhbUNvbG9yLnZhbHVlID09PSBcIk9yYW5nZSB0ZWFtXCIpIHtcclxuICAgICAgbXlUZWFtID0gXCJvcmFuZ2VcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG15VGVhbSA9IFwiYmx1ZVwiO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNjb3Jlc1xyXG4gICAgbGV0IG15U2NvcmU7XHJcbiAgICBsZXQgdGhlaXJTY29yZTtcclxuICAgIGNvbnN0IGlucHRfb3JhbmdlU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm9yYW5nZVNjb3JlSW5wdXRcIik7XHJcbiAgICBjb25zdCBpbnB0X2JsdWVTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmx1ZVNjb3JlSW5wdXRcIik7XHJcblxyXG4gICAgaWYgKG15VGVhbSA9PT0gXCJvcmFuZ2VcIikge1xyXG4gICAgICBteVNjb3JlID0gTnVtYmVyKGlucHRfb3JhbmdlU2NvcmUudmFsdWUpO1xyXG4gICAgICB0aGVpclNjb3JlID0gTnVtYmVyKGlucHRfYmx1ZVNjb3JlLnZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG15U2NvcmUgPSBOdW1iZXIoaW5wdF9ibHVlU2NvcmUudmFsdWUpO1xyXG4gICAgICB0aGVpclNjb3JlID0gTnVtYmVyKGlucHRfb3JhbmdlU2NvcmUudmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBsZXQgb3ZlcnRpbWU7XHJcbiAgICBjb25zdCBzZWxfb3ZlcnRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm92ZXJ0aW1lSW5wdXRcIik7XHJcbiAgICBpZiAoc2VsX292ZXJ0aW1lLnZhbHVlID09PSBcIk92ZXJ0aW1lXCIpIHtcclxuICAgICAgb3ZlcnRpbWUgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3ZlcnRpbWUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZ2FtZURhdGFPYmogPSB7XHJcbiAgICAgIFwidXNlcklkXCI6IGFjdGl2ZVVzZXJJZCxcclxuICAgICAgXCJtb2RlXCI6IGdhbWVNb2RlLFxyXG4gICAgICBcInR5cGVcIjogZ2FtZVR5cGUsXHJcbiAgICAgIFwidGVhbVwiOiBteVRlYW0sXHJcbiAgICAgIFwic2NvcmVcIjogbXlTY29yZSxcclxuICAgICAgXCJvcHBfc2NvcmVcIjogdGhlaXJTY29yZSxcclxuICAgICAgXCJvdmVydGltZVwiOiBvdmVydGltZSxcclxuICAgIH07XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IGEgbmV3IGdhbWUgb3IgZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQuIElmIGFuIGVkaXRlZCBnYW1lIGlzIGJlaW5nIHNhdmVkLCB0aGVuIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBzaG90IHNhdmVkIGFscmVhZHksIG1ha2luZyB0aGUgcmV0dXJuIGZyb20gdGhlIHNob3REYXRhIGZ1bmN0aW9uIG1vcmUgdGhhbiAwXHJcbiAgICBjb25zdCBzYXZpbmdFZGl0ZWRHYW1lID0gc2hvdERhdGEuZ2V0SW5pdGlhbE51bU9mU2hvdHMoKVxyXG4gICAgaWYgKHNhdmluZ0VkaXRlZEdhbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBnYW1lRGF0YU9iai50aW1lU3RhbXAgPSBzYXZlZEdhbWVPYmplY3QudGltZVN0YW1wXHJcbiAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCB0cnVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHRpbWUgc3RhbXAgaWYgbmV3IGdhbWVcclxuICAgICAgbGV0IHRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHRpbWVTdGFtcFxyXG4gICAgICBnYW1lRGF0YS5zYXZlRGF0YShnYW1lRGF0YU9iaiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlUHJldkdhbWVFZGl0cygpIHtcclxuICAgIGNvbnNvbGUubG9nKFwic2F2aW5nIGVkaXRzLi4uXCIpXHJcbiAgICBnYW1lRGF0YS5wYWNrYWdlR2FtZURhdGEoKTtcclxuICAgIC8vIFRPRE86ICgoU1RFUCAzKSkgUFVUIGVkaXRzIHRvIGRhdGFiYXNlXHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsRWRpdGluZ01vZGUoKSB7XHJcbiAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlckVkaXRCdXR0b25zKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZW1vdmVzICYgcmVwbGFjZXMgZWRpdCBhbmQgc2F2ZSBnYW1lIGJ1dHRvbnMgd2l0aCBcIlNhdmUgRWRpdHNcIiBhbmQgXCJDYW5jZWwgRWRpdHNcIlxyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIC8vIGluIGNhc2Ugb2YgbGFnIGluIGZldGNoLCBwcmV2ZW50IHVzZXIgZnJvbSBkb3VibGUgY2xpY2tpbmcgYnV0dG9uXHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuY2xhc3NMaXN0LmFkZChcImlzLWxvYWRpbmdcIik7XHJcblxyXG4gICAgY29uc3QgYnRuX2NhbmNlbEVkaXRzID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbEVkaXRzXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDYW5jZWwgRWRpdHNcIilcclxuICAgIGNvbnN0IGJ0bl9zYXZlRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUVkaXRzXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBFZGl0c1wiKVxyXG5cclxuICAgIGJ0bl9jYW5jZWxFZGl0cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuY2FuY2VsRWRpdGluZ01vZGUpXHJcbiAgICBidG5fc2F2ZUVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5zYXZlUHJldkdhbWVFZGl0cylcclxuXHJcbiAgICBidG5fZWRpdFByZXZHYW1lLnJlcGxhY2VXaXRoKGJ0bl9jYW5jZWxFZGl0cyk7XHJcbiAgICBidG5fc2F2ZUdhbWUucmVwbGFjZVdpdGgoYnRuX3NhdmVFZGl0cyk7XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlbmRlclByZXZHYW1lKGdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHJlbmRlcmluZyB0aGUgc2F2ZWQgZ2FtZSBpbmZvcm1hdGlvbiBpbiB0aGUgXCJFbnRlciBHYW1lIERhdGFcIiBjb250YWluZXIuXHJcbiAgICAvLyBpdCByZWxpZXMgb24gYSBmdW5jdGlvbiBpbiBzaG90RGF0YS5qcyB0byByZW5kZXIgdGhlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc29sZS5sb2coZ2FtZSlcclxuXHJcbiAgICAvLyBjYWxsIGZ1bmN0aW9uIGluIHNob3REYXRhIHRoYXQgY2FsbHMgZ2FtYURhdGEucHJvdmlkZVNob3RzVG9TaG90RGF0YSgpXHJcbiAgICAvLyB0aGUgZnVuY3Rpb24gd2lsbCBjYXB0dXJlIHRoZSBhcnJheSBvZiBzYXZlZCBzaG90cyBhbmQgcmVuZGVyIHRoZSBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLnJlbmRlclNob3RzQnV0dG9uc0Zyb21QcmV2aW91c0dhbWUoKVxyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBjb25zdCBzZWxfb3ZlcnRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm92ZXJ0aW1lSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5vdmVydGltZSkge1xyXG4gICAgICBzZWxfb3ZlcnRpbWUudmFsdWUgPSBcIk92ZXJ0aW1lXCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF9vdmVydGltZS52YWx1ZSA9IFwiTm8gb3ZlcnRpbWVcIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIG15IHRlYW1cclxuICAgIGNvbnN0IHNlbF90ZWFtQ29sb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlYW1JbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLnRlYW0gPT09IFwib3JhbmdlXCIpIHtcclxuICAgICAgc2VsX3RlYW1Db2xvci52YWx1ZSA9IFwiT3JhbmdlIHRlYW1cIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX3RlYW1Db2xvci52YWx1ZSA9IFwiQmx1ZSB0ZWFtXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBteSBzY29yZVxyXG4gICAgY29uc3QgaW5wdF9vcmFuZ2VTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3JhbmdlU2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmx1ZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJibHVlU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICBpZiAoZ2FtZS50ZWFtID09PSBcIm9yYW5nZVwiKSB7XHJcbiAgICAgIGlucHRfb3JhbmdlU2NvcmUudmFsdWUgPSBnYW1lLnNjb3JlO1xyXG4gICAgICBpbnB0X2JsdWVTY29yZS52YWx1ZSA9IGdhbWUub3BwX3Njb3JlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaW5wdF9vcmFuZ2VTY29yZS52YWx1ZSA9IGdhbWUub3BwX3Njb3JlO1xyXG4gICAgICBpbnB0X2JsdWVTY29yZS52YWx1ZSA9IGdhbWUuc2NvcmU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlICgxdjEsIDJ2MiwgM3YzKVxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG5cclxuICAgIGlmIChnYW1lLnR5cGUgPT09IFwiM3YzXCIpIHtcclxuICAgICAgYnRuXzN2My5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8zdjMuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICAgIC8vIDJ2MiBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSBpZiAoZ2FtZS50eXBlID09PSBcIjJ2MlwiKSB7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnRuXzF2MS5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8xdjEuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGdhbWUgbW9kZVxyXG4gICAgY29uc3Qgc2VsX2dhbWVNb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lTW9kZUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUubW9kZSA9IFwiY29tcGV0aXRpdmVcIikge1xyXG4gICAgICBzZWxfZ2FtZU1vZGUudmFsdWUgPSBcIkNvbXBldGl0aXZlXCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF9nYW1lTW9kZS52YWx1ZSA9IFwiQ2FzdWFsXCJcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcHJvdmlkZVNob3RzVG9TaG90RGF0YSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcHJvdmlkZXMgdGhlIHNob3RzIGZvciByZW5kZXJpbmcgdG8gc2hvdERhdGFcclxuICAgIHJldHVybiBzYXZlZEdhbWVPYmplY3RcclxuICB9LFxyXG5cclxuICBlZGl0UHJldkdhbWUoKSB7XHJcbiAgICAvLyBmZXRjaCBjb250ZW50IGZyb20gbW9zdCByZWNlbnQgZ2FtZSBzYXZlZCB0byBiZSByZW5kZXJlZFxyXG5cclxuICAgIC8vIFRPRE86IGNyZWF0ZSBhIG1vZGFsIGFza2luZyB1c2VyIGlmIHRoZXkgd2FudCB0byBlZGl0IHByZXZpb3VzIGdhbWVcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcblxyXG4gICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJ1c2Vyc1wiLCBgJHthY3RpdmVVc2VySWR9P19lbWJlZD1nYW1lc2ApLnRoZW4odXNlciA9PiB7XHJcbiAgICAgIGlmICh1c2VyLmdhbWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGFsZXJ0KFwiTm8gZ2FtZXMgaGF2ZSBiZWVuIHNhdmVkIGJ5IHRoaXMgdXNlclwiKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBnZXQgbWF4IGdhbWUgaWQgKHdoaWNoIGlzIHRoZSBtb3N0IHJlY2VudCBnYW1lIHNhdmVkKVxyXG4gICAgICAgIGNvbnN0IHJlY2VudEdhbWVJZCA9IHVzZXIuZ2FtZXMucmVkdWNlKChtYXgsIG9iaikgPT4gb2JqLmlkID4gbWF4ID8gb2JqLmlkIDogbWF4LCB1c2VyLmdhbWVzWzBdLmlkKTtcclxuICAgICAgICAvLyBmZXRjaCBtb3N0IHJlY2VudCBnYW1lIGFuZCBlbWJlZCBzaG90c1xyXG4gICAgICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwiZ2FtZXNcIiwgYCR7cmVjZW50R2FtZUlkfT9fZW1iZWQ9c2hvdHNgKS50aGVuKGdhbWVPYmogPT4ge1xyXG4gICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlckVkaXRCdXR0b25zKCk7XHJcbiAgICAgICAgICBzYXZlZEdhbWVPYmplY3QgPSBnYW1lT2JqO1xyXG4gICAgICAgICAgZ2FtZURhdGEucmVuZGVyUHJldkdhbWUoZ2FtZU9iaik7XHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lRGF0YSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIlxyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSBcIi4vZ2FtZURhdGFcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGdhbWVwbGF5ID0ge1xyXG5cclxuICBsb2FkR2FtZXBsYXkoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICAvLyBjb25zdCB4QnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImRlbGV0ZVwiIH0pO1xyXG4gICAgLy8geEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xvc2VCb3gsIGV2ZW50KTsgLy8gYnV0dG9uIHdpbGwgZGlzcGxheTogbm9uZSBvbiBwYXJlbnQgY29udGFpbmVyXHJcbiAgICAvLyBjb25zdCBoZWFkZXJJbmZvID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvbiBpcy1pbmZvXCIgfSwgXCJDcmVhdGUgYW5kIHNhdmUgc2hvdHMgLSB0aGVuIHNhdmUgdGhlIGdhbWUgcmVjb3JkLlwiLCB4QnV0dG9uKTtcclxuICAgIC8vIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoaGVhZGVySW5mbyk7XHJcbiAgICB0aGlzLmJ1aWxkU2hvdENvbnRlbnQoKTtcclxuICAgIHRoaXMuYnVpbGRHYW1lQ29udGVudCgpO1xyXG4gICAgdGhpcy5nYW1lcGxheUV2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkU2hvdENvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGJ1aWxkcyBzaG90IGNvbnRhaW5lcnMgYW5kIGFkZHMgY29udGFpbmVyIGNvbnRlbnRcclxuXHJcbiAgICAvLyBjb250YWluZXIgdGl0bGVcclxuICAgIGNvbnN0IHNob3RUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIHRpdGxlIGlzLTRcIiB9LCBcIkVudGVyIFNob3QgRGF0YVwiKTtcclxuICAgIGNvbnN0IHNob3RUaXRsZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNob3RUaXRsZSk7XHJcblxyXG4gICAgLy8gbmV3IHNob3QgYW5kIHNhdmUgc2hvdCBidXR0b25zXHJcbiAgICBjb25zdCBuZXdTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcIm5ld1Nob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJOZXcgU2hvdFwiKTtcclxuICAgIGNvbnN0IHNhdmVTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBTaG90XCIpO1xyXG4gICAgY29uc3QgY2FuY2VsU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDYW5jZWwgU2hvdFwiKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcInNob3RDb250cm9sc1wiLCBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBidXR0b25zXCIgfSwgbnVsbCwgbmV3U2hvdCwgc2F2ZVNob3QsIGNhbmNlbFNob3QpO1xyXG4gICAgY29uc3QgYWxpZ25TaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgc2hvdEJ1dHRvbnMpO1xyXG4gICAgY29uc3Qgc2hvdEJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduU2hvdEJ1dHRvbnMpO1xyXG5cclxuICAgIC8vIGJhbGwgc3BlZWQgaW5wdXQgYW5kIGFlcmlhbCBzZWxlY3RcclxuICAgIGNvbnN0IGJhbGxTcGVlZElucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiQmFsbCBzcGVlZCAoa3BoKTpcIilcclxuICAgIGNvbnN0IGJhbGxTcGVlZElucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiYmFsbFNwZWVkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gaW5wdXRcIiwgXCJ0eXBlXCI6XCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIGJhbGwgc3BlZWRcIiB9KTtcclxuICAgIGNvbnN0IGFlcmlhbE9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU3RhbmRhcmRcIik7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IGFlcmlhbFNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJhZXJpYWxJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgYWVyaWFsT3B0aW9uMSwgYWVyaWFsT3B0aW9uMik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgYWVyaWFsU2VsZWN0KTtcclxuICAgIGNvbnN0IGFlcmlhbENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgYWVyaWFsU2VsZWN0UGFyZW50KTtcclxuICAgIGNvbnN0IHNob3REZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBiYWxsU3BlZWRJbnB1dFRpdGxlLCBiYWxsU3BlZWRJbnB1dCwgYWVyaWFsQ29udHJvbCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlsc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNob3REZXRhaWxzKTtcclxuXHJcbiAgICAvLyBmaWVsZCBhbmQgZ29hbCBpbWFnZXMgKG5vdGUgZmllbGQtaW1nIGlzIGNsaXBwZWQgdG8gcmVzdHJpY3QgY2xpY2sgYXJlYSBjb29yZGluYXRlcyBpbiBsYXRlciBmdW5jdGlvbi5cclxuICAgIC8vIGdvYWwtaW1nIHVzZXMgYW4geC95IGZvcm11bGEgZm9yIGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgcmVzdHJpY3Rpb24sIHNpbmNlIGl0J3MgYSByZWN0YW5nbGUpXHJcbiAgICAvLyBhZGRpdGlvbmFsbHksIGZpZWxkIGFuZCBnb2FsIGFyZSBub3QgYWxpZ25lZCB3aXRoIGxldmVsLWxlZnQgb3IgbGV2ZWwtcmlnaHQgLSBpdCdzIGEgZGlyZWN0IGxldmVsIC0tPiBsZXZlbC1pdGVtIGZvciBjZW50ZXJpbmdcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25GaWVsZCwgYWxpZ25Hb2FsKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIGhvbGRpbmcgYWxsIHNob3QgaW5mb3JtYXRpb25cclxuICAgIGNvbnN0IHBhcmVudFNob3RDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHNob3RUaXRsZUNvbnRhaW5lciwgc2hvdEJ1dHRvbkNvbnRhaW5lciwgc2hvdERldGFpbHNDb250YWluZXIsIHNob3RDb29yZGluYXRlc0NvbnRhaW5lcilcclxuXHJcbiAgICAvLyBhcHBlbmQgc2hvdHMgY29udGFpbmVyIHRvIHBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50U2hvdENvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHYW1lQ29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gY3JlYXRlcyBnYW1lIGNvbnRlbnQgY29udGFpbmVycyAodGVhbSwgZ2FtZSB0eXBlLCBnYW1lIG1vZGUsIGV0Yy4pXHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBnYW1lVGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBHYW1lIERhdGFcIik7XHJcbiAgICBjb25zdCB0aXRsZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUaXRsZSk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSB0b3AgY29udGFpbmVyXHJcblxyXG4gICAgLy8gMXYxLzJ2Mi8zdjMgYnV0dG9ucyAobm90ZTogY29udHJvbCBjbGFzcyBpcyB1c2VkIHdpdGggZmllbGQgdG8gYWRoZXJlIGJ1dHRvbnMgdG9nZXRoZXIpXHJcbiAgICBjb25zdCBnYW1lVHlwZTN2MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfM3YzXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjMpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzJ2MlwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXNlbGVjdGVkIGlzLWxpbmtcIiB9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUydjIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzF2MVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIxdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMXYxKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaGFzLWFkZG9uc1wiIH0sIG51bGwsIGdhbWVUeXBlM3YzQ29udHJvbCwgZ2FtZVR5cGUydjJDb250cm9sLCBnYW1lVHlwZTF2MUNvbnRyb2wpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdhbWVUeXBlQnV0dG9uRmllbGQpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZSBzZWxlY3RcclxuICAgIGNvbnN0IG1vZGVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNhc3VhbFwiKTtcclxuICAgIGNvbnN0IG1vZGVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNvbXBldGl0aXZlXCIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJnYW1lTW9kZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlT3B0aW9uMSwgbW9kZU9wdGlvbjIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlU2VsZWN0KTtcclxuICAgIGNvbnN0IG1vZGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIG1vZGVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIHRlYW0gc2VsZWN0XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPcmFuZ2UgdGVhbVwiKTtcclxuICAgIGNvbnN0IHRlYW1PcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJsdWUgdGVhbVwiKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwidGVhbUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtT3B0aW9uMSwgdGVhbU9wdGlvbjIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtU2VsZWN0KTtcclxuICAgIGNvbnN0IHRlYW1Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHRlYW1TZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lIHNlbGVjdFxyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIG92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwib3ZlcnRpbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVPcHRpb24xLCBvdmVydGltZU9wdGlvbjIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3QpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIGJvdHRvbSBjb250YWluZXJcclxuXHJcbiAgICAvLyBzY29yZSBpbnB1dHNcclxuICAgIC8vICoqKipOb3RlIGlubGluZSBzdHlsaW5nIG9mIGlucHV0IHdpZHRoc1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIk9yYW5nZSB0ZWFtIHNjb3JlOlwiKTtcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJvcmFuZ2VTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIG9yYW5nZSB0ZWFtIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgb3JhbmdlU2NvcmVJbnB1dCk7XHJcbiAgICBjb25zdCBibHVlU2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJsdWUgdGVhbSBzY29yZTpcIilcclxuICAgIGNvbnN0IGJsdWVTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiYmx1ZVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgYmx1ZSB0ZWFtIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCBibHVlU2NvcmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gY29udHJvbFwiIH0sIG51bGwsIGJsdWVTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IHNjb3JlSW5wdXRDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIG9yYW5nZVNjb3JlSW5wdXRUaXRsZSwgb3JhbmdlU2NvcmVDb250cm9sLCBibHVlU2NvcmVJbnB1dFRpdGxlLCBibHVlU2NvcmVDb250cm9sKTtcclxuXHJcbiAgICAvLyBlZGl0L3NhdmUgZ2FtZSBidXR0b25zXHJcbiAgICBjb25zdCBlZGl0UHJldmlvdXNHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImVkaXRQcmV2R2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRWRpdCBQcmV2aW91cyBHYW1lXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUdhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEdhbWVcIik7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQWxpZ25tZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnMgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHNhdmVHYW1lLCBlZGl0UHJldmlvdXNHYW1lKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtcmlnaHRcIiB9LCBudWxsLCBnYW1lQnV0dG9uQWxpZ25tZW50KTtcclxuXHJcbiAgICAvLyBhcHBlbmQgdG8gd2VicGFnZVxyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lclRvcCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyLCBtb2RlQ29udHJvbCwgdGVhbUNvbnRyb2wsIG92ZXJ0aW1lQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyQm90dG9tID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2NvcmVJbnB1dENvbnRhaW5lciwgZ2FtZUJ1dHRvbkNvbnRhaW5lcik7XHJcbiAgICBjb25zdCBwYXJlbnRHYW1lQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCB0aXRsZUNvbnRhaW5lciwgZ2FtZUNvbnRhaW5lclRvcCwgZ2FtZUNvbnRhaW5lckJvdHRvbSk7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudEdhbWVDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5RXZlbnRNYW5hZ2VyKCkge1xyXG5cclxuICAgIC8vIGJ1dHRvbnNcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzXHJcbiAgICBidG5fbmV3U2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY3JlYXRlTmV3U2hvdCk7XHJcbiAgICBidG5fc2F2ZVNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnNhdmVTaG90KTtcclxuICAgIGJ0bl9jYW5jZWxTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jYW5jZWxTaG90KTtcclxuICAgIGJ0bl9zYXZlR2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEucGFja2FnZUdhbWVEYXRhKTtcclxuICAgIGdhbWVUeXBlQnRucy5mb3JFYWNoKGJ0biA9PiBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmdhbWVUeXBlQnV0dG9uVG9nZ2xlKSk7XHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5lZGl0UHJldkdhbWUpXHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVwbGF5IiwiaW1wb3J0IGhlYXRtYXAgZnJvbSBcIi4uL2xpYi9ub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUEkuanNcIjtcclxuXHJcbi8vIElEIG9mIHNldEludGVydmFsIGZ1bmN0aW9uIHVzZWQgdG8gbW9uaXRvciBjb250YWluZXIgd2lkdGggYW5kIHJlcGFpbnQgaGVhdG1hcCBpZiBjb250YWluZXIgd2lkdGggY2hhbmdlc1xyXG4vLyBsZXQgaW50ZXJ2YWxJZDtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHRvIHN0b3JlIGZldGNoZWQgc2hvdHNcclxubGV0IGdsb2JhbFNob3RzQXJyO1xyXG5sZXQgam9pblRhYmxlQXJyID0gW107XHJcbmNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcblxyXG5jb25zdCBoZWF0bWFwRGF0YSA9IHtcclxuXHJcbiAgZ2V0VXNlclNob3RzKCkge1xyXG4gICAgLy8gY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICAvLyBjb25zdCBnb2FsQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuXHJcbiAgICBjb25zdCBoZWF0bWFwTmFtZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuICAgIC8vIGNvbnN0IGZpZWxkSGVhdG1hcENhbnZhcyA9IGZpZWxkQ29udGFpbmVyLmNoaWxkTm9kZXNbMl1cclxuICAgIC8vIGNvbnN0IGdvYWxIZWF0bWFwQ2FudmFzID0gZ29hbENvbnRhaW5lci5jaGlsZE5vZGVzWzFdXHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBhbHJlYWR5IGEgaGVhdG1hcCBsb2FkZWQsIHJlbW92ZSBpdCBiZWZvcmUgY29udGludWluZ1xyXG4gICAgLy8gaWYgKGZpZWxkSGVhdG1hcENhbnZhcy5jbGFzc0xpc3QuY29udGFpbnMoXCJoZWF0bWFwLWNhbnZhc1wiKSkge1xyXG4gICAgLy8gICBmaWVsZEhlYXRtYXBDYW52YXMucmVtb3ZlKCk7XHJcbiAgICAvLyAgIGdvYWxIZWF0bWFwQ2FudmFzLnJlbW92ZSgpO1xyXG4gICAgLy8gICBpZiAoaGVhdG1hcE5hbWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAvLyAgICAgaGVhdG1hcERhdGEuZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCk7XHJcbiAgICAvLyAgIH0gZWxzZSB7XHJcbiAgICAvLyAgICAgaGVhdG1hcERhdGEuZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKGhlYXRtYXBOYW1lKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfSBlbHNlIHtcclxuICAgIGlmIChoZWF0bWFwTmFtZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgaGVhdG1hcERhdGEuZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoZWF0bWFwRGF0YS5mZXRjaFNhdmVkSGVhdG1hcERhdGEoaGVhdG1hcE5hbWUpO1xyXG4gICAgfVxyXG4gICAgLy8gfVxyXG4gIH0sXHJcblxyXG4gIGZldGNoQmFzaWNIZWF0bWFwRGF0YSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZ29lcyB0byB0aGUgZGF0YWJhc2UgYW5kIHJldHJpZXZlcyBzaG90cyB0aGF0IG1lZXQgc3BlY2lmaWMgZmlsdGVycyAoYWxsIHNob3RzIGZldGNoZWQgaWYgKVxyXG4gICAgbGV0IGdhbWVJZHMgPSBbXTtcclxuICAgIGNvbnN0IGdhbWVVUkxleHRlbnNpb24gPSBoZWF0bWFwRGF0YS5hcHBseUdhbWVGaWx0ZXJzKCk7XHJcbiAgICBBUEkuZ2V0QWxsKGdhbWVVUkxleHRlbnNpb24pXHJcbiAgICAgIC50aGVuKGdhbWVzID0+IHtcclxuICAgICAgICBnYW1lcy5mb3JFYWNoKGdhbWUgPT4ge1xyXG4gICAgICAgICAgZ2FtZUlkcy5wdXNoKGdhbWUuaWQpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIGdhbWVJZHM7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKGdhbWVJZHMgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNob3RVUkxleHRlbnNpb24gPSBoZWF0bWFwRGF0YS5hcHBseVNob3RGaWx0ZXJzKGdhbWVJZHMpO1xyXG4gICAgICAgIEFQSS5nZXRBbGwoc2hvdFVSTGV4dGVuc2lvbilcclxuICAgICAgICAgIC50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90cztcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgLy8gaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKGhlYXRtYXBEYXRhLmdldEFjdGl2ZU9mZnNldHMsIDUwMCk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9KVxyXG4gIH0sXHJcblxyXG4gIGZldGNoU2F2ZWRIZWF0bWFwRGF0YShoZWF0bWFwTmFtZSkge1xyXG4gICAgY29uc29sZS5sb2coXCJmZXRjaGluZyBzYXZlZCBoZWF0bWFwIGRhdGEuLi5cIik7XHJcbiAgICAvLyBmZXRjaCBoZWF0bWFwcyB3aXRoIG5hbWU9IGFuZCB1c2VySWQ9XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gIH0sXHJcblxyXG4gIGFwcGx5R2FtZUZpbHRlcnMoKSB7IC8vIFRPRE86IGFkZCBtb3JlIGZpbHRlcnNcclxuICAgIGxldCBVUkwgPSBcImdhbWVzXCJcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICBVUkwgKz0gYD91c2VySWQ9JHthY3RpdmVVc2VySWR9YFxyXG4gICAgcmV0dXJuIFVSTFxyXG4gIH0sXHJcblxyXG4gIGFwcGx5U2hvdEZpbHRlcnMoZ2FtZUlkcykge1xyXG4gICAgbGV0IFVSTCA9IFwic2hvdHNcIlxyXG4gICAgLy8gZm9yIGVhY2ggZ2FtZUlkLCBhcHBlbmQgVVJMLiBBcHBlbmQgJiBpbnN0ZWFkIG9mID8gb25jZSBmaXJzdCBnYW1lSWQgaXMgYWRkZWQgdG8gVVJMXHJcbiAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGxldCBnYW1lSWRDb3VudCA9IDA7XHJcbiAgICAgIGdhbWVJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgaWYgKGdhbWVJZENvdW50IDwgMSkge1xyXG4gICAgICAgICAgVVJMICs9IGA/Z2FtZUlkPSR7aWR9YFxyXG4gICAgICAgICAgZ2FtZUlkQ291bnQrKztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgVVJMICs9IGAmZ2FtZUlkPSR7aWR9YFxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0gLy9UT0RPOiBlbHNlIGRvIG5vdCBjb250aW51ZSAobm8gZ2FtZXMgd2VyZSBmb3VuZClcclxuICAgIHJldHVybiBVUkw7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQXJyYXkgb2YgZmV0Y2hlZCBzaG90c1wiLCBzaG90cylcclxuXHJcbiAgICAvLyBjcmVhdGUgZmllbGQgaGVhdG1hcCB3aXRoIGNvbmZpZ3VyYXRpb25cclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgbGV0IHZhcldpZHRoID0gZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgdmFySGVpZ2h0ID0gZmllbGRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIGxldCBmaWVsZENvbmZpZyA9IGhlYXRtYXBEYXRhLmdldEZpZWxkQ29uZmlnKGZpZWxkQ29udGFpbmVyKTtcclxuXHJcbiAgICBsZXQgRmllbGRIZWF0bWFwSW5zdGFuY2U7XHJcbiAgICBGaWVsZEhlYXRtYXBJbnN0YW5jZSA9IGhlYXRtYXAuY3JlYXRlKGZpZWxkQ29uZmlnKTtcclxuXHJcbiAgICBsZXQgZmllbGREYXRhUG9pbnRzID0gW107XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IHhfID0gTnVtYmVyKChzaG90LmZpZWxkWCAqIHZhcldpZHRoKS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHlfID0gTnVtYmVyKChzaG90LmZpZWxkWSAqIHZhckhlaWdodCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB2YWx1ZV8gPSAxO1xyXG4gICAgICBsZXQgZmllbGRPYmogPSB7IHg6IHhfLCB5OiB5XywgdmFsdWU6IHZhbHVlXyB9O1xyXG4gICAgICBmaWVsZERhdGFQb2ludHMucHVzaChmaWVsZE9iaik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBmaWVsZERhdGEgPSB7XHJcbiAgICAgIG1heDogMSxcclxuICAgICAgbWluOiAwLFxyXG4gICAgICBkYXRhOiBmaWVsZERhdGFQb2ludHNcclxuICAgIH1cclxuXHJcbiAgICBGaWVsZEhlYXRtYXBJbnN0YW5jZS5zZXREYXRhKGZpZWxkRGF0YSk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHb2FsSGVhdG1hcChzaG90cykge1xyXG4gICAgLy8gY3JlYXRlIGdvYWwgaGVhdG1hcCB3aXRoIGNvbmZpZ3VyYXRpb25cclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGxldCB2YXJHb2FsV2lkdGggPSBnb2FsQ29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHZhckdvYWxIZWlnaHQgPSBnb2FsQ29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICBsZXQgZ29hbENvbmZpZyA9IGhlYXRtYXBEYXRhLmdldEdvYWxDb25maWcoZ29hbENvbnRhaW5lcik7XHJcblxyXG4gICAgbGV0IEdvYWxIZWF0bWFwSW5zdGFuY2U7XHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZ29hbENvbmZpZyk7XHJcblxyXG4gICAgbGV0IGdvYWxEYXRhUG9pbnRzID0gW107XHJcblxyXG4gICAgc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgbGV0IHhfID0gTnVtYmVyKChzaG90LmdvYWxYICogdmFyR29hbFdpZHRoKS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHlfID0gTnVtYmVyKChzaG90LmdvYWxZICogdmFyR29hbEhlaWdodCkudG9GaXhlZCgwKSk7XHJcbiAgICAgIGxldCB2YWx1ZV8gPSAxO1xyXG4gICAgICBsZXQgZ29hbE9iaiA9IHsgeDogeF8sIHk6IHlfLCB2YWx1ZTogdmFsdWVfIH07XHJcbiAgICAgIGdvYWxEYXRhUG9pbnRzLnB1c2goZ29hbE9iaik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBnb2FsRGF0YSA9IHtcclxuICAgICAgbWF4OiAxLFxyXG4gICAgICBtaW46IDAsXHJcbiAgICAgIGRhdGE6IGdvYWxEYXRhUG9pbnRzXHJcbiAgICB9XHJcblxyXG4gICAgR29hbEhlYXRtYXBJbnN0YW5jZS5zZXREYXRhKGdvYWxEYXRhKTtcclxuICB9LFxyXG5cclxuICBnZXRGaWVsZENvbmZpZyhmaWVsZENvbnRhaW5lcikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29udGFpbmVyOiBmaWVsZENvbnRhaW5lcixcclxuICAgICAgcmFkaXVzOiAyNSxcclxuICAgICAgbWF4T3BhY2l0eTogLjUsXHJcbiAgICAgIG1pbk9wYWNpdHk6IDAsXHJcbiAgICAgIGJsdXI6IC43NVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBnZXRHb2FsQ29uZmlnKGdvYWxDb250YWluZXIpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvbnRhaW5lcjogZ29hbENvbnRhaW5lcixcclxuICAgICAgcmFkaXVzOiAzNSxcclxuICAgICAgbWF4T3BhY2l0eTogLjUsXHJcbiAgICAgIG1pbk9wYWNpdHk6IDAsXHJcbiAgICAgIGJsdXI6IC43NVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICAvKmdldEFjdGl2ZU9mZnNldHMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGV2YWx1YXRlcyB0aGUgd2lkdGggb2YgdGhlIGhlYXRtYXAgY29udGFpbmVyIGF0IDAuNSBzZWNvbmQgaW50ZXJ2YWxzLiBJZiB0aGUgd2lkdGggaGFzIGNoYW5nZWQsXHJcbiAgICAvLyB0aGVuIHRoZSBoZWF0bWFwIGNhbnZhcyBpcyByZXBhaW50ZWQgdG8gZml0IHdpdGhpbiB0aGUgY29udGFpbmVyIGxpbWl0c1xyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIilcclxuICAgIGxldCBjYXB0dXJlV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aFxyXG4gICAgLy9ldmFsdWF0ZSBjb250YWluZXIgd2lkdGggYWZ0ZXIgMC41IHNlY29uZHMgdnMgaW5pdGlhbCBjb250YWluZXIgd2lkdGhcclxuICAgIGlmIChjYXB0dXJlV2lkdGggPT09IHZhcldpZHRoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwidW5jaGFuZ2VkXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdmFyV2lkdGggPSBjYXB0dXJlV2lkdGhcclxuICAgICAgY29uc29sZS5sb2coXCJuZXcgd2lkdGhcIiwgdmFyV2lkdGgpO1xyXG4gICAgICAvL2NsZWFyIGhlYXRtYXBcclxuICAgICAgZmllbGRDb250YWluZXIucmVtb3ZlQ2hpbGQoZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1swXSk7XHJcbiAgICAgIC8vYnVpbGQgaGVhdG1hcCBhZ2FpblxyXG4gICAgICBoZWF0bWFwRGF0YS5idWlsZEhlYXRtYXAoKTtcclxuICAgIH1cclxuICB9LCovXHJcblxyXG4gIHNhdmVIZWF0bWFwKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3Igc2F2aW5nIGEgaGVhdG1hcCBvYmplY3Qgd2l0aCBhIG5hbWUgYW5kIHVzZXJJZCwgdGhlbiBtYWtpbmcgam9pbiB0YWJsZXMgd2l0aFxyXG4gICAgLy8gVE9ETzogcmVxdWlyZSB1bmlxdWUgaGVhdG1hcCBuYW1lXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGNvbnN0IHNhdmVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIGNvbnN0IGhlYXRtYXBUaXRsZSA9IHNhdmVJbnB1dC52YWx1ZTtcclxuXHJcbiAgICBpZiAoaGVhdG1hcFRpdGxlLmxlbmd0aCA+IDAgJiYgaGVhdG1hcFRpdGxlICE9PSBcIlNhdmUgc3VjY2Vzc2Z1bCFcIikgeyAvL1RPRE86IGFkZCByZXF1aXJlbWVudCBmb3IgYSBoZWF0bWFwIHRvIGJlIGxvYWRlZCBhdCB0aGUgdGltZSBzYXZlIGlzIGNsaWNrZWRcclxuICAgICAgY29uc29sZS5sb2coXCJzYXZpbmcgaGVhdG1hcC4uLlwiKTtcclxuICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwT2JqZWN0KGhlYXRtYXBUaXRsZSlcclxuICAgICAgICAudGhlbihoZWF0bWFwT2JqID0+IGhlYXRtYXBEYXRhLnNhdmVKb2luVGFibGVzKGhlYXRtYXBPYmopLnRoZW4oeCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImpvaW4gdGFibGVzIHNhdmVkXCIsIHgpXHJcbiAgICAgICAgICBqb2luVGFibGVBcnIgPSBbXSAvLyBlbXB0eSB0aGUgdGVtcG9yYXJ5IGdsb2JhbCBhcnJheSB1c2VkIHdpdGggUHJvbWlzZS5hbGxcclxuICAgICAgICAgIC8vIGhlYXRtYXBEcm9wZG93bi52YWx1ZSA9IGhlYXRtYXBUaXRsZSBUT0RPOiBhcHBlbmQgY2hpbGQgdG8gc2VsZWN0IGRyb3Bkb3duIHdpdGggbmV3IGhlYXRtYXAgbmFtZVxyXG4gICAgICAgICAgc2F2ZUlucHV0LnZhbHVlID0gXCJTYXZlIHN1Y2Nlc3NmdWwhXCI7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJpcy1kYW5nZXJcIik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2F2ZUhlYXRtYXBPYmplY3QoaGVhdG1hcFRpdGxlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHNhdmVzIGEgaGVhdG1hcCBvYmplY3Qgd2l0aCB0aGUgdXNlci1wcm92aWRlZCBuYW1lIGFuZCB0aGUgdXNlcklkXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBOdW1iZXIoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKSk7XHJcbiAgICBjb25zdCBoZWF0bWFwT2JqID0ge1xyXG4gICAgICBuYW1lOiBoZWF0bWFwVGl0bGUsXHJcbiAgICAgIHVzZXJJZDogYWN0aXZlVXNlcklkXHJcbiAgICB9XHJcbiAgICByZXR1cm4gQVBJLnBvc3RJdGVtKFwiaGVhdG1hcHNcIiwgaGVhdG1hcE9iailcclxuICB9LFxyXG5cclxuICBzYXZlSm9pblRhYmxlcyhoZWF0bWFwT2JqKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImdsb2JhbHNob3RzYXJyYXlcIiwgZ2xvYmFsU2hvdHNBcnIpXHJcbiAgICBnbG9iYWxTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgam9pblRhYmxlT2JqID0ge1xyXG4gICAgICAgIHNob3RJZDogc2hvdC5pZCxcclxuICAgICAgICBoZWF0bWFwSWQ6IGhlYXRtYXBPYmouaWRcclxuICAgICAgfVxyXG4gICAgICBqb2luVGFibGVBcnIucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90X2hlYXRtYXBcIiwgam9pblRhYmxlT2JqKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2luVGFibGVBcnIpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcCgpIHtcclxuICAgIC8vIFRPRE86IGRlbGV0ZSBvcHRpb24gaW4gZHJvcGRvd25cclxuICAgIC8vIFRPRE86IGRlbGV0ZSBoZWF0bWFwIG9iamVjdFxyXG4gICAgLy8gVE9ETzogZGVsZXRlIGFsbCBqb2luIHRhYmxlcyBhc3NvY2lhdGVkIHdpdGggdGhhdCBoZWF0bWFwIG9iamVjdFxyXG4gICAgY29uc29sZS5sb2coXCJkZWxldGluZyBoZWF0bWFwLi4uXCIpO1xyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBsZXQgY3VycmVudERyb3Bkb3duVmFsdWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcblxyXG4gICAgaGVhdG1hcERyb3Bkb3duLmNoaWxkTm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICAgIGlmIChjaGlsZC50ZXh0Q29udGVudCA9PT0gY3VycmVudERyb3Bkb3duVmFsdWUgJiYgY2hpbGQudGV4dENvbnRlbnQgIT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgY2hpbGQucmVtb3ZlKCk7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcE9iamVjdGFuZEpvaW5UYWJsZXMoY2hpbGQuaWQpXHJcbiAgICAgICAgLnRoZW4oeCA9PiBoZWF0bWFwRHJvcGRvd24udmFsdWUgPSBcIkJhc2ljIEhlYXRtYXBcIilcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcE9iamVjdGFuZEpvaW5UYWJsZXMoaGVhdG1hcElkKSB7XHJcbiAgICByZXR1cm4gQVBJLmRlbGV0ZUl0ZW0oXCJoZWF0bWFwc1wiLCBgJHtoZWF0bWFwSWQuc2xpY2UoOCl9P3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gKVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGhlYXRtYXBEYXRhXHJcblxyXG4vLyBUT0RPOiBkZWxldGUgaGVhdG1hcCBmdW5jdGlvbmFsaXR5XHJcbi8vIFRPRE86IHNldCBpbnRlcnZhbCBmb3IgY29udGFpbmVyIHdpZHRoIG1vbml0b3JpbmdcclxuLy8gVE9ETzogc2NhbGUgYmFsbCBzaXplIHdpdGggZ29hbFxyXG4vLyBUT0RPOiBhZGQgZmlsdGVyIGNvbXBhdGliaWxpdHlcclxuLy8gVE9ETzogaWYgY3VzdG9tIGhlYXRtYXAgaXMgc2VsZWN0ZWQgZnJvbSBkcm9wZG93biwgdGhlbiBibHVyIGZpbHRlciBjb250YWluZXJcclxuLy8gVE9ETzogb24gcGFnZSBsb2FkLCByZW5kZXIgdXNlci1zYXZlZCBoZWF0bWFwcyBhcyBvcHRpb25zIGluIGRyb3Bkb3duIG1lbnUiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGhlYXRtYXBEYXRhIGZyb20gXCIuL2hlYXRtYXBEYXRhXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIjtcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBoZWF0bWFwcyA9IHtcclxuXHJcbiAgbG9hZEhlYXRtYXBDb250YWluZXJzKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgdGhpcy5idWlsZEZpbHRlcnMoKTtcclxuICAgIC8vIGJ1aWxkcyBidXR0b24gdG8gZ2VuZXJhdGUgaGVhdG1hcCwgc2F2ZSBoZWF0bWFwLCBhbmQgdmlldyBzYXZlZCBoZWF0bWFwc1xyXG4gICAgLy8gdGhlIGFjdGlvbiBpcyBhc3luYyBiZWNhdXNlIHRoZSB1c2VyJ3Mgc2F2ZWQgaGVhdG1hcHMgaGF2ZSB0byBiZSByZW5kZXJlZCBhcyBIVE1MIG9wdGlvbiBlbGVtZW50c1xyXG4gICAgdGhpcy5idWlsZEdlbmVyYXRvcigpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmlsdGVycygpIHtcclxuXHJcbiAgICAvLyByZXNldCBidXR0b25cclxuICAgIGNvbnN0IHJlc2V0QnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIlJlc2V0IEZpbHRlcnNcIik7XHJcblxyXG4gICAgLy8gZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGNvbnN0IGRhdGVCdG5UZXh0ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7fSwgXCJEYXRlIFJhbmdlXCIpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1jYWxlbmRhclwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsXCIgfSwgbnVsbCwgZGF0ZUJ0bkljb24pO1xyXG4gICAgY29uc3QgZGF0ZUJ0biA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLW91dGxpbmVkIGlzLWRhcmtcIiB9LCBudWxsLCBkYXRlQnRuSWNvblNwYW4sIGRhdGVCdG5UZXh0KTtcclxuICAgIGNvbnN0IGRhdGVCdG5QYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRhdGVCdG4pO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBjb25zdCBpY29uNiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWNsb2NrXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb242KTtcclxuICAgIGNvbnN0IHNlbDZfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiWWVzXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm9cIik7XHJcbiAgICBjb25zdCBzZWxlY3Q2ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWw2X29wMSwgc2VsNl9vcDIsIHNlbDZfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q2LCBpY29uU3BhbjYpO1xyXG4gICAgY29uc3QgY29udHJvbDYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjYpO1xyXG5cclxuICAgIC8vIHJlc3VsdFxyXG4gICAgY29uc3QgaWNvbjUgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS10cm9waHlcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjUpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUmVzdWx0XCIpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiVmljdG9yeVwiKTtcclxuICAgIGNvbnN0IHNlbDVfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkRlZmVhdFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDUgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwge30sIG51bGwsIHNlbDVfb3AxLCBzZWw1X29wMiwgc2VsNV9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDUsIGljb25TcGFuNSk7XHJcbiAgICBjb25zdCBjb250cm9sNSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2NSk7XHJcblxyXG4gICAgLy8gZ2FtZSB0eXBlXHJcbiAgICBjb25zdCBpY29uNCA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXNpdGVtYXBcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNCA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjQpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiR2FtZSBUeXBlXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiM3YzXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiMnYyXCIpO1xyXG4gICAgY29uc3Qgc2VsNF9vcDQgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiMXYxXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsNF9vcDEsIHNlbDRfb3AyLCBzZWw0X29wMywgc2VsNF9vcDQpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDQsIGljb25TcGFuNCk7XHJcbiAgICBjb25zdCBjb250cm9sNCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2NCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBpY29uMyA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWdhbWVwYWRcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMyA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjMpO1xyXG4gICAgY29uc3Qgc2VsM19vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiR2FtZSBNb2RlXCIpO1xyXG4gICAgY29uc3Qgc2VsM19vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBzZWwzX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBzZWxlY3QzID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWwzX29wMSwgc2VsM19vcDIsIHNlbDNfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QzLCBpY29uU3BhbjMpO1xyXG4gICAgY29uc3QgY29udHJvbDMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjMpO1xyXG5cclxuICAgIC8vIHRlYW1cclxuICAgIGNvbnN0IGljb24yID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtaGFuZHNoYWtlXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24yKTtcclxuICAgIGNvbnN0IHNlbDJfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlRlYW1cIik7XHJcbiAgICBjb25zdCBzZWwyX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPcmFuZ2VcIik7XHJcbiAgICBjb25zdCBzZWwyX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCbHVlXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsMl9vcDEsIHNlbDJfb3AyLCBzZWwyX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MiwgaWNvblNwYW4yKTtcclxuICAgIGNvbnN0IGNvbnRyb2wyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYyKTtcclxuXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGNvbnN0IGljb24xID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZnV0Ym9sXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24xKTtcclxuICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlNob3QgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsMV9vcDEsIHNlbDFfb3AyLCBzZWwxX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MSwgaWNvblNwYW4xKTtcclxuICAgIGNvbnN0IGNvbnRyb2wxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYxKTtcclxuXHJcbiAgICBjb25zdCBmaWx0ZXJGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBjb250cm9sMSwgY29udHJvbDIsIGNvbnRyb2wzLCBjb250cm9sNCwgY29udHJvbDUsIGNvbnRyb2w2LCBkYXRlQnRuUGFyZW50LCByZXNldEJ0bik7XHJcbiAgICBjb25zdCBQYXJlbnRGaWx0ZXJDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGZpbHRlckZpZWxkKTtcclxuXHJcbiAgICAvLyBhcHBlbmQgZmlsdGVyIGNvbnRhaW5lciB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEZpbHRlckNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHZW5lcmF0b3IoKSB7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIC8vIHVzZSBmZXRjaCB0byBhcHBlbmQgb3B0aW9ucyB0byBzZWxlY3QgZWxlbWVudCBpZiB1c2VyIGF0IGxlYXN0IDEgc2F2ZWQgaGVhdG1hcFxyXG4gICAgQVBJLmdldEFsbChgaGVhdG1hcHM/dXNlcklkPSR7YWN0aXZlVXNlcklkfWApXHJcbiAgICAgIC50aGVuKGhlYXRtYXBzID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkFycmF5IG9mIHVzZXIncyBzYXZlZCBoZWF0bWFwczpcIiwgaGVhdG1hcHMpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZmlyZVwiIH0sIG51bGwpO1xyXG4gICAgICAgIGNvbnN0IGljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uKTtcclxuICAgICAgICBjb25zdCBzZWwxX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCYXNpYyBIZWF0bWFwXCIpO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJoZWF0bWFwRHJvcGRvd25cIiB9LCBudWxsLCBzZWwxX29wMSk7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcFNlbGVjdERpdiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIGhlYXRtYXBEcm9wZG93biwgaWNvblNwYW4pO1xyXG4gICAgICAgIGNvbnN0IGhlYXRtYXBDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBoZWF0bWFwU2VsZWN0RGl2KTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOlwiZGVsZXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRGVsZXRlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBkZWxldGVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkZWxldGVCdG4pXHJcbiAgICAgICAgY29uc3Qgc2F2ZUJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgSGVhdG1hcFwiKVxyXG4gICAgICAgIGNvbnN0IHNhdmVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBzYXZlQnRuKVxyXG4gICAgICAgIGNvbnN0IHNhdmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInNhdmVIZWF0bWFwSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcIk5hbWUgYW5kIHNhdmUgdGhpcyBoZWF0bWFwXCIsIFwibWF4bGVuZ3RoXCI6IFwiMzBcIiB9LCBudWxsKVxyXG4gICAgICAgIGNvbnN0IHNhdmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaXMtZXhwYW5kZWRcIiB9LCBudWxsLCBzYXZlSW5wdXQpXHJcblxyXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvckJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJnZW5lcmF0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJHZW5lcmF0ZSBIZWF0bWFwXCIpO1xyXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvckNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdlbmVyYXRvckJ1dHRvbik7XHJcblxyXG4gICAgICAgIC8vIGlmIG5vIGhlYXRtYXBzIGFyZSBzYXZlZCwgZ2VuZXJhdGUgbm8gZXh0cmEgb3B0aW9ucyBpbiBkcm9wZG93blxyXG4gICAgICAgIGlmIChoZWF0bWFwcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGNvbnN0IGdlbmVyYXRvckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGhlYXRtYXBDb250cm9sLCBnZW5lcmF0b3JDb250cm9sLCBzYXZlQ29udHJvbCwgc2F2ZUJ0bkNvbnRyb2wsIGRlbGV0ZUJ0bkNvbnRyb2wpO1xyXG4gICAgICAgICAgY29uc3QgUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBnZW5lcmF0b3JGaWVsZCk7XHJcbiAgICAgICAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEdlbmVyYXRvckNvbnRhaW5lcik7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZWxzZSwgZm9yIGVhY2ggaGVhdG1hcCBzYXZlZCwgbWFrZSBhIG5ldyBvcHRpb24gYW5kIGFwcGVuZCBpdCB0byB0aGVcclxuICAgICAgICAgIGhlYXRtYXBzLmZvckVhY2goaGVhdG1hcCA9PiB7XHJcbiAgICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwge1wiaWRcIjpgaGVhdG1hcC0ke2hlYXRtYXAuaWR9YH0sIGhlYXRtYXAubmFtZSkpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIGNvbnN0IGdlbmVyYXRvckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGhlYXRtYXBDb250cm9sLCBnZW5lcmF0b3JDb250cm9sLCBzYXZlQ29udHJvbCwgc2F2ZUJ0bkNvbnRyb2wsIGRlbGV0ZUJ0bkNvbnRyb2wpO1xyXG4gICAgICAgICAgY29uc3QgUGFyZW50R2VuZXJhdG9yQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBnZW5lcmF0b3JGaWVsZCk7XHJcbiAgICAgICAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEdlbmVyYXRvckNvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnVpbGRGaWVsZGFuZEdvYWwoKTtcclxuICAgICAgICB0aGlzLmhlYXRtYXBFdmVudE1hbmFnZXIoKTtcclxuICAgICAgfSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIGJ1aWxkRmllbGRhbmRHb2FsKCkge1xyXG4gICAgY29uc3QgZmllbGRJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZUJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLWJnXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwiXCIgfSwgbnVsbCwgZmllbGRJbWFnZUJhY2tncm91bmQsIGZpZWxkSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZmllbGRJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvUkxfZ29hbF9jcm9wcGVkX25vX2JnX0JXLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdvYWxJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkdvYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdvYWxJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBoZWF0bWFwSW1hZ2VDb250YWluZXJzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25GaWVsZCwgYWxpZ25Hb2FsKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIGhvbGRpbmcgYWxsIHNob3QgaW5mb3JtYXRpb25cclxuICAgIGNvbnN0IHBhcmVudFNob3RDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGhlYXRtYXBJbWFnZUNvbnRhaW5lcnMpXHJcblxyXG4gICAgLy8gYXBwZW5kIGZpZWxkIGFuZCBnb2FsIHRvIHBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50U2hvdENvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgaGVhdG1hcEV2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGdlbmVyYXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2VuZXJhdGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwQnRuXCIpO1xyXG4gICAgY29uc3QgZGVsZXRlSGVhdG1hcEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlSGVhdG1hcEJ0blwiKTtcclxuXHJcbiAgICBnZW5lcmF0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmdldFVzZXJTaG90cyk7XHJcbiAgICBzYXZlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuc2F2ZUhlYXRtYXApO1xyXG4gICAgZGVsZXRlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcCk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGVhdG1hcHMiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5pbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbG9naW5PclNpZ251cCA9IHtcclxuXHJcbiAgLy8gYnVpbGQgYSBsb2dpbiBmb3JtIHRoYXQgdmFsaWRhdGVzIHVzZXIgaW5wdXQuIFN1Y2Nlc3NmdWwgbG9naW4gc3RvcmVzIHVzZXIgaWQgaW4gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgbG9naW5Gb3JtKCkge1xyXG4gICAgY29uc3QgbG9naW5JbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwicGFzc3dvcmRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJsb2dpbk5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luIG5vd1wiKTtcclxuICAgIGNvbnN0IGxvZ2luRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwibG9naW5Gb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBsb2dpbklucHV0X3VzZXJuYW1lLCBsb2dpbklucHV0X3Bhc3N3b3JkLCBsb2dpbkJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChsb2dpbkZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cEZvcm0oKSB7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9uYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9jb25maXJtID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiY29uZmlybVBhc3N3b3JkXCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJjb25maXJtIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2lnbnVwTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cCBub3dcIik7XHJcbiAgICBjb25zdCBzaWdudXBGb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJzaWdudXBGb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9uYW1lLCBzaWdudXBJbnB1dF91c2VybmFtZSwgc2lnbnVwSW5wdXRfcGFzc3dvcmQsIHNpZ251cElucHV0X2NvbmZpcm0sIHNpZ251cEJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChzaWdudXBGb3JtKVxyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKClcclxuICB9LFxyXG5cclxuICAvLyBhc3NpZ24gZXZlbnQgbGlzdGVuZXJzIGJhc2VkIG9uIHdoaWNoIGZvcm0gaXMgb24gdGhlIHdlYnBhZ2VcclxuICB1c2VyRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgY29uc3QgbG9naW5Ob3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZ2luTm93XCIpXHJcbiAgICBjb25zdCBzaWdudXBOb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpZ251cE5vd1wiKVxyXG4gICAgaWYgKGxvZ2luTm93ID09PSBudWxsKSB7XHJcbiAgICAgIHNpZ251cE5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBVc2VyLCBldmVudClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxvZ2luTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luVXNlciwgZXZlbnQpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gdmFsaWRhdGUgdXNlciBsb2dpbiBmb3JtIGlucHV0cyBiZWZvcmUgbG9nZ2luZyBpblxyXG4gIGxvZ2luVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKHVzZXIgPT4ge1xyXG4gICAgICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFuZCBwYXNzd29yZFxyXG4gICAgICAgIGlmICh1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIGlmICh1c2VyLnBhc3N3b3JkID09PSBwYXNzd29yZCkge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cFVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc29sZS5sb2coZSlcclxuICAgIGNvbnN0IF9uYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF91c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3Bhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBjb25maXJtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maXJtUGFzc3dvcmRcIikudmFsdWVcclxuICAgIGxldCB1bmlxdWVVc2VybmFtZSA9IHRydWU7IC8vY2hhbmdlcyB0byBmYWxzZSBpZiB1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1xyXG4gICAgaWYgKF9uYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfdXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoY29uZmlybSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkICE9PSBjb25maXJtKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChcInVzZXJzXCIpLnRoZW4odXNlcnMgPT4gdXNlcnMuZm9yRWFjaCgodXNlciwgaWR4KSA9PiB7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIGV4aXN0aW5nIHVzZXJuYW1lIGluIGRhdGFiYXNlXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gX3VzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIHVuaXF1ZVVzZXJuYW1lID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vYXQgdGhlIGVuZCBvZiB0aGUgbG9vcCwgcG9zdFxyXG4gICAgICAgIGlmIChpZHggPT09IHVzZXJzLmxlbmd0aCAtIDEgJiYgdW5pcXVlVXNlcm5hbWUpIHtcclxuICAgICAgICAgIGxldCBuZXdVc2VyID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBfbmFtZSxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IF91c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IF9wYXNzd29yZCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBBUEkucG9zdEl0ZW0oXCJ1c2Vyc1wiLCBuZXdVc2VyKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9naW5TdGF0dXNBY3RpdmUodXNlcikge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiLCB1c2VyLmlkKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKTsgLy9idWlsZCBsb2dnZWQgaW4gdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9LFxyXG5cclxuICBsb2dvdXRVc2VyKCkge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcihmYWxzZSk7IC8vYnVpbGQgbG9nZ2VkIG91dCB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvZ2luT3JTaWdudXAiLCJpbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcbi8vIGltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiO1xyXG5cclxuLy8gZnVuY3Rpb24gY2xvc2VCb3goZSkge1xyXG4vLyAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJkZWxldGVcIikpIHtcclxuLy8gICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuLy8gbmF2YmFyLmdlbmVyYXRlTmF2YmFyKClcclxubmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpXHJcbmhlYXRtYXBzLmxvYWRIZWF0bWFwQ29udGFpbmVycygpOyIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgbG9naW5PclNpZ251cCBmcm9tIFwiLi9sb2dpblwiXHJcbmltcG9ydCBwcm9maWxlIGZyb20gXCIuL3Byb2ZpbGVcIlxyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIlxyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIlxyXG5pbXBvcnQgaGVhdG1hcHMgZnJvbSBcIi4vaGVhdG1hcHNcIlxyXG5cclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbi8qXHJcbiAgQnVsbWEgbmF2YmFyIHN0cnVjdHVyZTpcclxuICA8bmF2PlxyXG4gICAgPG5hdmJhci1icmFuZD5cclxuICAgICAgPG5hdmJhci1idXJnZXI+IChvcHRpb25hbClcclxuICAgIDwvbmF2YmFyLWJyYW5kPlxyXG4gICAgPG5hdmJhci1tZW51PlxyXG4gICAgICA8bmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8L25hdmJhci1zdGFydD5cclxuICAgICAgPG5hdmJhci1lbmQ+XHJcbiAgICAgIDwvbmF2YmFyLWVuZD5cclxuICAgIDwvbmF2YmFyLW1lbnU+XHJcbiAgPC9uYXY+XHJcblxyXG4gIFRoZSBmdW5jdGlvbnMgYmVsb3cgYnVpbGQgdGhlIG5hdmJhciBmcm9tIHRoZSBpbnNpZGUgb3V0XHJcbiovXHJcblxyXG5jb25zdCBuYXZiYXIgPSB7XHJcblxyXG4gIGdlbmVyYXRlTmF2YmFyKGxvZ2dlZEluQm9vbGVhbikge1xyXG5cclxuICAgIC8vIG5hdmJhci1tZW51IChyaWdodCBzaWRlIG9mIG5hdmJhciAtIGFwcGVhcnMgb24gZGVza3RvcCAxMDI0cHgrKVxyXG4gICAgY29uc3QgYnV0dG9uMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luXCIpXHJcbiAgICBjb25zdCBidXR0b24xID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cFwiKVxyXG4gICAgY29uc3QgYnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnNcIiB9LCBudWxsLCBidXR0b24xLCBidXR0b24yKVxyXG4gICAgY29uc3QgbWVudUl0ZW0xID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgbnVsbCwgYnV0dG9uQ29udGFpbmVyKVxyXG4gICAgY29uc3QgbmF2YmFyRW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1lbmRcIiB9LCBudWxsLCBtZW51SXRlbTEpXHJcbiAgICBjb25zdCBuYXZiYXJTdGFydCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItc3RhcnRcIiB9KVxyXG4gICAgY29uc3QgbmF2YmFyTWVudSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJuYXZiYXJNZW51XCIsIFwiY2xhc3NcIjogXCJuYXZiYXItbWVudVwiIH0sIG51bGwsIG5hdmJhclN0YXJ0LCBuYXZiYXJFbmQpXHJcblxyXG4gICAgLy8gbmF2YmFyLWJyYW5kIChsZWZ0IHNpZGUgb2YgbmF2YmFyIC0gaW5jbHVkZXMgbW9iaWxlIGhhbWJ1cmdlciBtZW51KVxyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4xID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMyA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJyb2xlXCI6IFwiYnV0dG9uXCIsIFwiY2xhc3NcIjogXCJuYXZiYXItYnVyZ2VyIGJ1cmdlclwiLCBcImFyaWEtbGFiZWxcIjogXCJtZW51XCIsIFwiYXJpYS1leHBhbmRlZFwiOiBcImZhbHNlXCIsIFwiZGF0YS10YXJnZXRcIjogXCJuYXZiYXJNZW51XCIgfSwgbnVsbCwgYnVyZ2VyTWVudVNwYW4xLCBidXJnZXJNZW51U3BhbjIsIGJ1cmdlck1lbnVTcGFuMyk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiwgXCJocmVmXCI6IFwiI1wiIH0sIG51bGwsIGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL2ZpcmU5MGRlZy5wbmdcIiwgXCJ3aWR0aFwiOiBcIjExMlwiLCBcImhlaWdodFwiOiBcIjI4XCIgfSkpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWJyYW5kXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmRDaGlsZDEsIG5hdmJhckJyYW5kQ2hpbGQyKTtcclxuXHJcbiAgICAvLyBuYXYgKHBhcmVudCBuYXYgSFRNTCBlbGVtZW50KVxyXG4gICAgY29uc3QgbmF2ID0gZWxCdWlsZGVyKFwibmF2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhclwiLCBcInJvbGVcIjogXCJuYXZpZ2F0aW9uXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1haW4gbmF2aWdhdGlvblwiIH0sIG51bGwsIG5hdmJhckJyYW5kLCBuYXZiYXJNZW51KTtcclxuXHJcbiAgICAvLyBpZiBsb2dnZWQgaW4sIGFwcGVuZCBhZGRpdGlvbmFsIG1lbnUgb3B0aW9ucyB0byBuYXZiYXIgYW5kIHJlbW92ZSBzaWdudXAvbG9naW4gYnV0dG9uc1xyXG4gICAgaWYgKGxvZ2dlZEluQm9vbGVhbikge1xyXG4gICAgICAvLyByZW1vdmUgbG9nIGluIGFuZCBzaWduIHVwIGJ1dHRvbnNcclxuICAgICAgY29uc3Qgc2lnbnVwID0gYnV0dG9uQ29udGFpbmVyLmNoaWxkTm9kZXNbMF07XHJcbiAgICAgIGNvbnN0IGxvZ2luID0gYnV0dG9uQ29udGFpbmVyLmNoaWxkTm9kZXNbMV07XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChzaWdudXApO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQobG9naW4pO1xyXG4gICAgICAvLyBhZGQgbG9nb3V0IGJ1dHRvblxyXG4gICAgICBjb25zdCBidXR0b24zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9nb3V0XCIpO1xyXG4gICAgICBidXR0b25Db250YWluZXIuYXBwZW5kQ2hpbGQoYnV0dG9uMyk7XHJcblxyXG4gICAgICAvLyBjcmVhdGUgYW5kIGFwcGVuZCBuZXcgbWVudSBpdGVtcyBmb3IgdXNlclxyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0xID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiUHJvZmlsZVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkdhbWVwbGF5XCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiSGVhdG1hcHNcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTQgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJMZWFkZXJib2FyZFwiKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMSk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTIpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0zKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtNCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBuYXZiYXJcclxuICAgIHRoaXMubmF2YmFyRXZlbnRNYW5hZ2VyKG5hdik7XHJcblxyXG4gICAgLy8gYXBwZW5kIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2VOYXYuYXBwZW5kQ2hpbGQobmF2KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgbmF2YmFyRXZlbnRNYW5hZ2VyKG5hdikge1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luQ2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cENsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dvdXRDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucHJvZmlsZUNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5nYW1lcGxheUNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oZWF0bWFwc0NsaWNrZWQsIGV2ZW50KTtcclxuICB9LFxyXG5cclxuICBsb2dpbkNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ2luXCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5sb2dpbkZvcm0oKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzaWdudXBDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJTaWduIHVwXCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5zaWdudXBGb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9nb3V0XCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5sb2dvdXRVc2VyKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcHJvZmlsZUNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIlByb2ZpbGVcIikge1xyXG4gICAgICBwcm9maWxlLmxvYWRQcm9maWxlKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJHYW1lcGxheVwiKSB7XHJcbiAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBoZWF0bWFwc0NsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkhlYXRtYXBzXCIpIHtcclxuICAgICAgaGVhdG1hcHMubG9hZEhlYXRtYXBDb250YWluZXJzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmF2YmFyIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBwcm9maWxlID0ge1xyXG5cclxuICBsb2FkUHJvZmlsZSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGFjdGl2ZVVzZXJJZCkudGhlbih1c2VyID0+IHtcclxuICAgICAgY29uc3QgcHJvZmlsZVBpYyA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL29jdGFuZS5qcGdcIiwgXCJjbGFzc1wiOiBcIlwiIH0pXHJcbiAgICAgIGNvbnN0IG5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYE5hbWU6ICR7dXNlci5uYW1lfWApXHJcbiAgICAgIGNvbnN0IHVzZXJuYW1lID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvblwiIH0sIGBVc2VybmFtZTogJHt1c2VyLnVzZXJuYW1lfWApXHJcbiAgICAgIGNvbnN0IHBsYXllclByb2ZpbGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwicGxheWVyUHJvZmlsZVwiLCBcImNsYXNzXCI6IFwiY29udGFpbmVyXCIgfSwgbnVsbCwgcHJvZmlsZVBpYywgbmFtZSwgdXNlcm5hbWUpXHJcbiAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGxheWVyUHJvZmlsZSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJvZmlsZSIsImNsYXNzIHNob3RPbkdvYWwge1xyXG4gIHNldCBmaWVsZFgoZmllbGRYKSB7XHJcbiAgICB0aGlzLl9maWVsZFggPSBmaWVsZFhcclxuICB9XHJcbiAgc2V0IGZpZWxkWShmaWVsZFkpIHtcclxuICAgIHRoaXMuX2ZpZWxkWSA9IGZpZWxkWVxyXG4gIH1cclxuICBzZXQgZ29hbFgoZ29hbFgpIHtcclxuICAgIHRoaXMuX2dvYWxYID0gZ29hbFhcclxuICB9XHJcbiAgc2V0IGdvYWxZKGdvYWxZKSB7XHJcbiAgICB0aGlzLl9nb2FsWSA9IGdvYWxZXHJcbiAgfVxyXG4gIHNldCBhZXJpYWwoYWVyaWFsQm9vbGVhbikge1xyXG4gICAgdGhpcy5fYWVyaWFsID0gYWVyaWFsQm9vbGVhblxyXG4gIH1cclxuICBzZXQgYmFsbFNwZWVkKGJhbGxTcGVlZCkge1xyXG4gICAgdGhpcy5iYWxsX3NwZWVkID0gYmFsbFNwZWVkXHJcbiAgfVxyXG4gIHNldCB0aW1lU3RhbXAoZGF0ZU9iaikge1xyXG4gICAgdGhpcy5fdGltZVN0YW1wID0gZGF0ZU9ialxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2hvdE9uR29hbCIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgc2hvdE9uR29hbCBmcm9tIFwiLi9zaG90Q2xhc3NcIlxyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSBcIi4vZ2FtZURhdGFcIjtcclxuXHJcbmxldCBzaG90Q291bnRlciA9IDA7XHJcbmxldCBlZGl0aW5nU2hvdCA9IGZhbHNlOyAvL2VkaXRpbmcgc2hvdCBpcyB1c2VkIGZvciBib3RoIG5ldyBhbmQgb2xkIHNob3RzXHJcbmxldCBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG5sZXQgc2hvdEFycmF5ID0gW107IC8vIHJlc2V0IHdoZW4gZ2FtZSBpcyBzYXZlZFxyXG4vLyBnbG9iYWwgdmFycyB1c2VkIHdpdGggc2hvdCBlZGl0aW5nXHJcbmxldCBwcmV2aW91c1Nob3RPYmo7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFg7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFk7XHJcbmxldCBwcmV2aW91c1Nob3RHb2FsWDtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxZO1xyXG4vLyBnbG9iYWwgdmFyIHVzZWQgd2hlbiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUgKHRvIGRldGVybWluZSBpZiBuZXcgc2hvdHMgd2VyZSBhZGRlZCBmb3IgUE9TVClcclxubGV0IGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuXHJcbmNvbnN0IHNob3REYXRhID0ge1xyXG5cclxuICByZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGdhbWVwbGF5IGlzIGNsaWNrZWQgb24gdGhlIG5hdmJhciBhbmQgd2hlbiBhIGdhbWUgaXMgc2F2ZWQsIGluIG9yZGVyIHRvIHByZXZlbnQgYnVncyB3aXRoIHByZXZpb3VzbHkgY3JlYXRlZCBzaG90c1xyXG4gICAgc2hvdENvdW50ZXIgPSAwO1xyXG4gICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBzaG90QXJyYXkgPSBbXTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSB1bmRlZmluZWQ7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlTmV3U2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgc2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsO1xyXG4gICAgc2hvdE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vIHByZXZlbnQgdXNlciBmcm9tIHNlbGVjdGluZyBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnModHJ1ZSk7XHJcblxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcblxyXG4gICAgLy8gYWN0aXZhdGUgY2xpY2sgZnVuY3Rpb25hbGl0eSBhbmQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBvbiBib3RoIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gIH0sXHJcblxyXG4gIGdldENsaWNrQ29vcmRzKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZ2V0cyB0aGUgcmVsYXRpdmUgeCBhbmQgeSBvZiB0aGUgY2xpY2sgd2l0aGluIHRoZSBmaWVsZCBpbWFnZSBjb250YWluZXJcclxuICAgIC8vIGFuZCB0aGVuIGNhbGxzIHRoZSBmdW5jdGlvbiB0aGF0IGFwcGVuZHMgYSBtYXJrZXIgb24gdGhlIHBhZ2VcclxuICAgIGxldCBwYXJlbnRDb250YWluZXI7XHJcbiAgICBpZiAoZS50YXJnZXQuaWQgPT09IFwiZmllbGQtaW1nXCIpIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICB9XHJcbiAgICAvLyBvZmZzZXRYIGFuZCBZIGFyZSB0aGUgeCBhbmQgeSBjb29yZGluYXRlcyAocGl4ZWxzKSBvZiB0aGUgY2xpY2sgaW4gdGhlIGNvbnRhaW5lclxyXG4gICAgLy8gdGhlIGV4cHJlc3Npb25zIGRpdmlkZSB0aGUgY2xpY2sgeCBhbmQgeSBieSB0aGUgcGFyZW50IGZ1bGwgd2lkdGggYW5kIGhlaWdodFxyXG4gICAgY29uc3QgeENvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WCAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSlcclxuICAgIGNvbnN0IHlDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeENvb3JkUmVsYXRpdmUsIHlDb29yZFJlbGF0aXZlLCBwYXJlbnRDb250YWluZXIpXHJcbiAgfSxcclxuXHJcbiAgbWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpIHtcclxuICAgIGxldCBtYXJrZXJJZDtcclxuICAgIGlmIChwYXJlbnRDb250YWluZXIuaWQgPT09IFwiZmllbGQtaW1nLXBhcmVudFwiKSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1maWVsZFwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWdvYWxcIjtcclxuICAgIH1cclxuICAgIC8vIGFkanVzdCBmb3IgNTAlIG9mIHdpZHRoIGFuZCBoZWlnaHQgb2YgbWFya2VyIHNvIGl0J3MgY2VudGVyZWQgYWJvdXQgbW91c2UgcG9pbnRlclxyXG4gICAgbGV0IGFkanVzdE1hcmtlclggPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IGFkanVzdE1hcmtlclkgPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIE5PVCBhbHJlYWR5IGEgbWFya2VyLCB0aGVuIG1ha2Ugb25lIGFuZCBwbGFjZSBpdFxyXG4gICAgaWYgKCFwYXJlbnRDb250YWluZXIuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpKSkge1xyXG4gICAgICB0aGlzLmdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpO1xyXG4gICAgICAvLyBlbHNlIG1vdmUgdGhlIGV4aXN0aW5nIG1hcmtlciB0byB0aGUgbmV3IHBvc2l0aW9uXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpO1xyXG4gICAgfVxyXG4gICAgLy8gc2F2ZSBjb29yZGluYXRlcyB0byBvYmplY3RcclxuICAgIHRoaXMuYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSlcclxuICB9LFxyXG5cclxuICBnZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgZGl2LmlkID0gbWFya2VySWQ7XHJcbiAgICBkaXYuc3R5bGUud2lkdGggPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImxpZ2h0Z3JlZW5cIjtcclxuICAgIGRpdi5zdHlsZS5ib3JkZXIgPSBcIjFweCBzb2xpZCBibGFja1wiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiNTAlXCI7XHJcbiAgICBkaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICBkaXYuc3R5bGUubGVmdCA9ICh4IC0gYWRqdXN0TWFya2VyWCkgKiAxMDAgKyBcIiVcIjtcclxuICAgIGRpdi5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQoZGl2KTtcclxuICB9LFxyXG5cclxuICBtb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKSB7XHJcbiAgICBjb25zdCBjdXJyZW50TWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgfSxcclxuXHJcbiAgYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB1cGRhdGVzIHRoZSBpbnN0YW5jZSBvZiBzaG90T25Hb2FsIGNsYXNzIHRvIHJlY29yZCBjbGljayBjb29yZGluYXRlc1xyXG4gICAgLy8gaWYgYSBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBhcHBlbmQgdGhlIGNvb3JkaW5hdGVzIHRvIHRoZSBvYmplY3QgaW4gcXVlc3Rpb25cclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIC8vIHVzZSBnbG9iYWwgdmFycyBpbnN0ZWFkIG9mIHVwZGF0aW5nIG9iamVjdCBkaXJlY3RseSBoZXJlIHRvIHByZXZlbnQgYWNjaWRlbnRhbCBlZGl0aW5nIG9mIG1hcmtlciB3aXRob3V0IGNsaWNraW5nIFwic2F2ZSBzaG90XCJcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgICAvLyBvdGhlcndpc2UsIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgc28gYXBwZW5kIGNvb3JkaW5hdGVzIHRvIHRoZSBuZXcgb2JqZWN0XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIHNob3RPYmouZmllbGRYID0geDtcclxuICAgICAgICBzaG90T2JqLmZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWCA9IHg7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWSA9IHk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjYW5jZWxTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICBpZiAoIWVkaXRpbmdTaG90KSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAvLyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQsIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzc1xyXG4gICAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZFxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgaWYgKGZpZWxkTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChnb2FsTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZ29hbEltZ1BhcmVudC5yZW1vdmVDaGlsZChnb2FsTWFya2VyKTtcclxuICAgICAgfVxyXG4gICAgICAvLyByZW1vdmUgY2xpY2sgbGlzdGVuZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgZ29hbEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAvLyBjbGVhciBmaWVsZCBhbmQgZ29hbCBldmVudCBsaXN0ZW5lcnNcclxuICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgZ29hbEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAvLyByZW1vdmUgbWFya2VycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgIGZpZWxkSW1nUGFyZW50LnJlbW92ZUNoaWxkKGZpZWxkTWFya2VyKTtcclxuICAgICAgZ29hbEltZ1BhcmVudC5yZW1vdmVDaGlsZChnb2FsTWFya2VyKTtcclxuICAgICAgLy8gY29uZGl0aW9uYWwgc3RhdGVtZW50IHRvIHNhdmUgY29ycmVjdCBvYmplY3QgKGkuZS4gc2hvdCBiZWluZyBlZGl0ZWQgdnMuIG5ldyBzaG90KVxyXG4gICAgICAvLyBpZiBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBwcmV2aW91c1Nob3RPYmogd2lsbCBub3QgYmUgdW5kZWZpbmVkXHJcbiAgICAgIGlmIChwcmV2aW91c1Nob3RPYmogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2ZpZWxkWCA9IHByZXZpb3VzU2hvdEZpZWxkWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2ZpZWxkWSA9IHByZXZpb3VzU2hvdEZpZWxkWTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxYID0gcHJldmlvdXNTaG90R29hbFg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9nb2FsWSA9IHByZXZpb3VzU2hvdEdvYWxZO1xyXG4gICAgICAgIC8vIGVsc2Ugc2F2ZSB0byBuZXcgaW5zdGFuY2Ugb2YgY2xhc3MgYW5kIGFwcGVuZCBidXR0b24gdG8gcGFnZSB3aXRoIGNvcnJlY3QgSUQgZm9yIGVkaXRpbmdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoc2VsX2FlcmlhbC52YWx1ZSA9PT0gXCJBZXJpYWxcIikgeyBzaG90T2JqLmFlcmlhbCA9IHRydWUgfSBlbHNlIHsgc2hvdE9iai5hZXJpYWwgPSBmYWxzZSB9O1xyXG4gICAgICAgIHNob3RPYmouYmFsbFNwZWVkID0gaW5wdF9iYWxsU3BlZWQudmFsdWU7XHJcbiAgICAgICAgc2hvdEFycmF5LnB1c2goc2hvdE9iaik7XHJcbiAgICAgICAgLy8gYXBwZW5kIG5ldyBidXR0b25cclxuICAgICAgICBzaG90Q291bnRlcisrO1xyXG4gICAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7c2hvdENvdW50ZXJ9YCwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1saW5rXCIgfSwgYFNob3QgJHtzaG90Q291bnRlcn1gKTtcclxuICAgICAgICBzaG90QnRuQ29udGFpbmVyLmFwcGVuZENoaWxkKG5ld1Nob3RCdG4pO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7c2hvdENvdW50ZXJ9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnJlbmRlclNhdmVkU2hvdCk7XHJcbiAgICAgIH1cclxuICAgICAgLy9UT0RPOiBhZGQgY29uZGl0aW9uIHRvIHByZXZlbnQgYmxhbmsgZW50cmllcyBhbmQgbWlzc2luZyBjb29yZGluYXRlc1xyXG5cclxuICAgICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAvLyBjYW5jZWwgdGhlIG5ldyBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgKG1hdHRlcnMgaWYgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkKVxyXG4gICAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkIChtYXR0ZXJzIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZClcclxuICAgICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlbmRlclNhdmVkU2hvdChlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdGhlIHNob3RBcnJheSB0byBnZXQgYSBzaG90IG9iamVjdCB0aGF0IG1hdGNoZXMgdGhlIHNob3QjIGJ1dHRvbiBjbGlja2VkIChlLmcuIHNob3QgMiBidXR0b24gPSBpbmRleCAxIG9mIHRoZSBzaG90QXJyYXkpXHJcbiAgICAvLyB0aGUgZnVuY3Rpb24gKGFuZCBpdHMgYXNzb2NpYXRlZCBjb25kaXRpb25hbCBzdGF0ZW1lbnRzIGluIG90aGVyIGxvY2FsIGZ1bmN0aW9ucykgaGFzIHRoZXNlIGJhc2ljIHJlcXVpcmVtZW50czpcclxuICAgIC8vIHJlLWluaXRpYWxpemUgY2xpY2sgbGlzdGVuZXJzIG9uIGltYWdlc1xyXG4gICAgLy8gcmV2aXZlIGEgc2F2ZWQgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzIGZvciBlZGl0aW5nIHNob3QgY29vcmRpbmF0ZXMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWxcclxuICAgIC8vIHJlbmRlciBtYXJrZXJzIGZvciBleGlzdGluZyBjb29yZGluYXRlcyBvbiBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICAgIC8vIGFmZm9yZGFuY2UgdG8gc2F2ZSBlZGl0c1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBjYW5jZWwgZWRpdHNcclxuICAgIC8vIHRoZSBkYXRhIGlzIHJlbmRlcmVkIG9uIHRoZSBwYWdlIGFuZCBjYW4gYmUgc2F2ZWQgKG92ZXJ3cml0dGVuKSBieSB1c2luZyB0aGUgXCJzYXZlIHNob3RcIiBidXR0b24gb3IgY2FuY2VsZWQgYnkgY2xpY2tpbmcgdGhlIFwiY2FuY2VsIHNob3RcIiBidXR0b25cclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcblxyXG4gICAgLy8gcHJldmVudCBuZXcgc2hvdCBidXR0b24gZnJvbSBiZWluZyBjbGlja2VkXHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAvLyBhbGxvdyBjYW5jZWwgYW5kIHNhdmVkIGJ1dHRvbnMgdG8gYmUgY2xpY2tlZFxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgLy8gZ2V0IElEIG9mIHNob3QjIGJ0biBjbGlja2VkIGFuZCBhY2Nlc3Mgc2hvdEFycmF5IGF0IFtidG5JRCAtIDFdXHJcbiAgICBsZXQgYnRuSWQgPSBlLnRhcmdldC5pZC5zbGljZSg1KTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHNob3RBcnJheVtidG5JZCAtIDFdO1xyXG4gICAgLy8gcmVuZGVyIGJhbGwgc3BlZWQgYW5kIGFlcmlhbCBkcm9wZG93biBmb3IgdGhlIHNob3RcclxuICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQ7XHJcbiAgICBpZiAocHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPT09IHRydWUpIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiQWVyaWFsXCI7IH0gZWxzZSB7IHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7IH1cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gZmllbGQgYW5kIGdvYWxcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAvLyByZW5kZXIgc2hvdCBtYXJrZXIgb24gZmllbGRcclxuICAgIGxldCBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIilcclxuICAgIGxldCB4ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB5ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG4gICAgLy8gcmVuZGVyIGdvYWwgbWFya2VyIG9uIGZpZWxkXHJcbiAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKVxyXG4gICAgeCA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKTtcclxuICAgIHkgPSBOdW1iZXIoKChwcmV2aW91c1Nob3RPYmouX2dvYWxZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhkaXNhYmxlT3JOb3QpIHtcclxuICAgIC8vIGZvciBlYWNoIGJ1dHRvbiBhZnRlciBcIk5ldyBTaG90XCIsIFwiU2F2ZSBTaG90XCIsIGFuZCBcIkNhbmNlbCBTaG90XCIgZGlzYWJsZSB0aGUgYnV0dG9ucyBpZiB0aGUgdXNlciBpcyBjcmVhdGluZyBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSB0cnVlKSBvciBlbmFibGUgdGhlbSBvbiBzYXZlL2NhbmNlbCBvZiBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSBmYWxzZSlcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIGxldCBlZGl0QnRuO1xyXG4gICAgbGV0IGxlbmd0aCA9IHNob3RCdG5Db250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGg7XHJcbiAgICBmb3IgKGxldCBpID0gMzsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVkaXRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke2kgLSAyfWApO1xyXG4gICAgICBlZGl0QnRuLmRpc2FibGVkID0gZGlzYWJsZU9yTm90O1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBnZXRTaG90T2JqZWN0c0ZvclNhdmluZygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGFycmF5IGZvciB1c2UgaW4gZ2FtZURhdGEuanMgKHdoZW4gc2F2aW5nIGEgbmV3IGdhbWUsIG5vdCB3aGVuIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSlcclxuICAgIHJldHVybiBzaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbE51bU9mU2hvdHMoKSB7XHJcbiAgICAvLyBwcm92aWRlcyBpbml0aWFsIG51bWJlciBvZiBzaG90cyB0aGF0IHdlcmUgc2F2ZWQgdG8gZGF0YWJhc2UgdG8gZ2FtZURhdGEuanMgdG8gaWRlbnRpZnkgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWRcclxuICAgIHJldHVybiBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2hvdHNCdXR0b25zRnJvbVByZXZpb3VzR2FtZSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVxdWVzdHMgdGhlIGFycmF5IG9mIHNob3RzIGZyb20gdGhlIHByZXZpb3VzIHNhdmVkIGdhbWUsIHNldHMgaXQgYXMgc2hvdEFycmF5LCBhbmQgcmVuZGVycyBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIC8vIGdldCBzYXZlZCBnYW1lIHdpdGggc2hvdHMgZW1iZWRkZWQgYXMgYXJyYXlcclxuICAgIGxldCBzYXZlZEdhbWVPYmogPSBnYW1lRGF0YS5wcm92aWRlU2hvdHNUb1Nob3REYXRhKCk7XHJcbiAgICAvLyBjcmVhdGUgc2hvdEFycmF5IHdpdGggZm9ybWF0IHJlcXVpcmVkIGJ5IGxvY2FsIGZ1bmN0aW9uc1xyXG4gICAgbGV0IHNhdmVkU2hvdE9ialxyXG4gICAgc2F2ZWRHYW1lT2JqLnNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHNhdmVkU2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsXHJcbiAgICAgIHNhdmVkU2hvdE9iai5maWVsZFggPSBzaG90LmZpZWxkWDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWSA9IHNob3QuZmllbGRZO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFggPSBzaG90LmdvYWxYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFkgPSBzaG90LmdvYWxZO1xyXG4gICAgICBzYXZlZFNob3RPYmouYWVyaWFsID0gc2hvdC5hZXJpYWw7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5iYWxsX3NwZWVkID0gc2hvdC5iYWxsX3NwZWVkLnRvU3RyaW5nKCk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai50aW1lU3RhbXAgPSBzaG90LnRpbWVTdGFtcFxyXG4gICAgICBzYXZlZFNob3RPYmouaWQgPSBzaG90LmlkXHJcbiAgICAgIHNob3RBcnJheS5wdXNoKHNhdmVkU2hvdE9iaik7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKHNob3RBcnJheSk7XHJcbiAgICBzaG90QXJyYXkuZm9yRWFjaCgoc2hvdCwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7aWR4ICsgMX1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke2lkeCArIDF9YCk7XHJcbiAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aWR4ICsgMX1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgIH0pO1xyXG4gICAgc2hvdENvdW50ZXIgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gc2hvdEFycmF5Lmxlbmd0aDtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90RGF0YSJdfQ==
