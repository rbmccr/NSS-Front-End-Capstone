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

var _elementBuilder = _interopRequireDefault(require("./elementBuilder.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ID of setInterval function used to monitor container width and repaint heatmap if container width changes
// let intervalId;
// global variable to store fetched shots
let globalShotsArr;
let joinTableArr = []; // FIXME: examine confirmHeatmapDelete function. may not need for loop. grab ID from option
// FIXME: add condition to getUserShots that clears existing canvas - if there is one
// TODO: set interval for container width monitoring
// TODO: scale ball size with goal
// TODO: add filter compatibility
// TODO: if custom heatmap is selected from dropdown, then blur filter container

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
      if (gameIds.length === 0) {
        alert("No Shots have been saved yet. Visit the Gameplay page to get started.");
        return;
      } else {
        const shotURLextension = heatmapData.applyShotFilters(gameIds);

        _API.default.getAll(shotURLextension).then(shots => {
          globalShotsArr = shots;
          heatmapData.buildFieldHeatmap(shots);
          heatmapData.buildGoalHeatmap(shots); // intervalId = setInterval(heatmapData.getActiveOffsets, 500);
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
      console.log(shots);
      heatmapData.buildFieldHeatmap(shots);
      heatmapData.buildGoalHeatmap(shots);
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
    // TODO: require unique heatmap name (may not need to do this if function below uses ID instead of name)
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const saveInput = document.getElementById("saveHeatmapInput");
    const heatmapTitle = saveInput.value;

    if (heatmapTitle.length > 0 && heatmapTitle !== "Save successful!") {
      //TODO: add requirement for a heatmap to be loaded at the time save is clicked
      console.log("saving heatmap...");
      saveInput.classList.remove("is-danger");
      heatmapData.saveHeatmapObject(heatmapTitle).then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(x => {
        console.log("join tables saved", x); // empty the temporary global array used with Promise.all

        joinTableArr = []; // append newly created heatmap as option element in select dropdown

        heatmapDropdown.appendChild((0, _elementBuilder.default)("option", {
          "id": `heatmap-${heatmapObj.id}`
        }, heatmapObj.name)); // heatmapDropdown.value = heatmapTitle TODO: append child to select dropdown with new heatmap name

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
  }

};
var _default = heatmapData;
exports.default = _default;

},{"../lib/node_modules/heatmap.js/build/heatmap.js":1,"./API.js":2,"./elementBuilder.js":3}],7:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwcy5qcyIsIi4uL3NjcmlwdHMvbG9naW4uanMiLCIuLi9zY3JpcHRzL21haW4uanMiLCIuLi9zY3JpcHRzL25hdmJhci5qcyIsIi4uL3NjcmlwdHMvcHJvZmlsZS5qcyIsIi4uL3NjcmlwdHMvc2hvdENsYXNzLmpzIiwiLi4vc2NyaXB0cy9zaG90RGF0YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogaGVhdG1hcC5qcyB2Mi4wLjUgfCBKYXZhU2NyaXB0IEhlYXRtYXAgTGlicmFyeVxuICpcbiAqIENvcHlyaWdodCAyMDA4LTIwMTYgUGF0cmljayBXaWVkIDxoZWF0bWFwanNAcGF0cmljay13aWVkLmF0PiAtIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIE1JVCBhbmQgQmVlcndhcmUgbGljZW5zZSBcbiAqXG4gKiA6OiAyMDE2LTA5LTA1IDAxOjE2XG4gKi9cbjsoZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGZhY3RvcnkpIHtcblxuICAvLyBTdXBwb3J0cyBVTUQuIEFNRCwgQ29tbW9uSlMvTm9kZS5qcyBhbmQgYnJvd3NlciBjb250ZXh0XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSB7XG4gICAgY29udGV4dFtuYW1lXSA9IGZhY3RvcnkoKTtcbiAgfVxuXG59KShcImgzMzdcIiwgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4vLyBIZWF0bWFwIENvbmZpZyBzdG9yZXMgZGVmYXVsdCB2YWx1ZXMgYW5kIHdpbGwgYmUgbWVyZ2VkIHdpdGggaW5zdGFuY2UgY29uZmlnXG52YXIgSGVhdG1hcENvbmZpZyA9IHtcbiAgZGVmYXVsdFJhZGl1czogNDAsXG4gIGRlZmF1bHRSZW5kZXJlcjogJ2NhbnZhczJkJyxcbiAgZGVmYXVsdEdyYWRpZW50OiB7IDAuMjU6IFwicmdiKDAsMCwyNTUpXCIsIDAuNTU6IFwicmdiKDAsMjU1LDApXCIsIDAuODU6IFwieWVsbG93XCIsIDEuMDogXCJyZ2IoMjU1LDAsMClcIn0sXG4gIGRlZmF1bHRNYXhPcGFjaXR5OiAxLFxuICBkZWZhdWx0TWluT3BhY2l0eTogMCxcbiAgZGVmYXVsdEJsdXI6IC44NSxcbiAgZGVmYXVsdFhGaWVsZDogJ3gnLFxuICBkZWZhdWx0WUZpZWxkOiAneScsXG4gIGRlZmF1bHRWYWx1ZUZpZWxkOiAndmFsdWUnLCBcbiAgcGx1Z2luczoge31cbn07XG52YXIgU3RvcmUgPSAoZnVuY3Rpb24gU3RvcmVDbG9zdXJlKCkge1xuXG4gIHZhciBTdG9yZSA9IGZ1bmN0aW9uIFN0b3JlKGNvbmZpZykge1xuICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0ge307XG4gICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgIHRoaXMuX3JhZGkgPSBbXTtcbiAgICB0aGlzLl9taW4gPSAxMDtcbiAgICB0aGlzLl9tYXggPSAxO1xuICAgIHRoaXMuX3hGaWVsZCA9IGNvbmZpZ1sneEZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRYRmllbGQ7XG4gICAgdGhpcy5feUZpZWxkID0gY29uZmlnWyd5RmllbGQnXSB8fCBjb25maWcuZGVmYXVsdFlGaWVsZDtcbiAgICB0aGlzLl92YWx1ZUZpZWxkID0gY29uZmlnWyd2YWx1ZUZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRWYWx1ZUZpZWxkO1xuXG4gICAgaWYgKGNvbmZpZ1tcInJhZGl1c1wiXSkge1xuICAgICAgdGhpcy5fY2ZnUmFkaXVzID0gY29uZmlnW1wicmFkaXVzXCJdO1xuICAgIH1cbiAgfTtcblxuICB2YXIgZGVmYXVsdFJhZGl1cyA9IEhlYXRtYXBDb25maWcuZGVmYXVsdFJhZGl1cztcblxuICBTdG9yZS5wcm90b3R5cGUgPSB7XG4gICAgLy8gd2hlbiBmb3JjZVJlbmRlciA9IGZhbHNlIC0+IGNhbGxlZCBmcm9tIHNldERhdGEsIG9taXRzIHJlbmRlcmFsbCBldmVudFxuICAgIF9vcmdhbmlzZURhdGE6IGZ1bmN0aW9uKGRhdGFQb2ludCwgZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgdmFyIHggPSBkYXRhUG9pbnRbdGhpcy5feEZpZWxkXTtcbiAgICAgICAgdmFyIHkgPSBkYXRhUG9pbnRbdGhpcy5feUZpZWxkXTtcbiAgICAgICAgdmFyIHJhZGkgPSB0aGlzLl9yYWRpO1xuICAgICAgICB2YXIgc3RvcmUgPSB0aGlzLl9kYXRhO1xuICAgICAgICB2YXIgbWF4ID0gdGhpcy5fbWF4O1xuICAgICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhUG9pbnRbdGhpcy5fdmFsdWVGaWVsZF0gfHwgMTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IGRhdGFQb2ludC5yYWRpdXMgfHwgdGhpcy5fY2ZnUmFkaXVzIHx8IGRlZmF1bHRSYWRpdXM7XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XSkge1xuICAgICAgICAgIHN0b3JlW3hdID0gW107XG4gICAgICAgICAgcmFkaVt4XSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdG9yZVt4XVt5XSkge1xuICAgICAgICAgIHN0b3JlW3hdW3ldID0gdmFsdWU7XG4gICAgICAgICAgcmFkaVt4XVt5XSA9IHJhZGl1cztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdG9yZVt4XVt5XSArPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RvcmVkVmFsID0gc3RvcmVbeF1beV07XG5cbiAgICAgICAgaWYgKHN0b3JlZFZhbCA+IG1heCkge1xuICAgICAgICAgIGlmICghZm9yY2VSZW5kZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21heCA9IHN0b3JlZFZhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXREYXRhTWF4KHN0b3JlZFZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChzdG9yZWRWYWwgPCBtaW4pIHtcbiAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9taW4gPSBzdG9yZWRWYWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YU1pbihzdG9yZWRWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICB4OiB4LCBcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsIFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpdXMsXG4gICAgICAgICAgICBtaW46IG1pbixcbiAgICAgICAgICAgIG1heDogbWF4IFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIF91bk9yZ2FuaXplRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdW5vcmdhbml6ZWREYXRhID0gW107XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG4gICAgICB2YXIgcmFkaSA9IHRoaXMuX3JhZGk7XG5cbiAgICAgIGZvciAodmFyIHggaW4gZGF0YSkge1xuICAgICAgICBmb3IgKHZhciB5IGluIGRhdGFbeF0pIHtcblxuICAgICAgICAgIHVub3JnYW5pemVkRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgcmFkaXVzOiByYWRpW3hdW3ldLFxuICAgICAgICAgICAgdmFsdWU6IGRhdGFbeF1beV1cbiAgICAgICAgICB9KTtcblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgbWF4OiB0aGlzLl9tYXgsXG4gICAgICAgIGRhdGE6IHVub3JnYW5pemVkRGF0YVxuICAgICAgfTtcbiAgICB9LFxuICAgIF9vbkV4dHJlbWFDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgnZXh0cmVtYWNoYW5nZScsIHtcbiAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgIG1heDogdGhpcy5fbWF4XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGFkZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGFyZ3VtZW50c1swXS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBkYXRhQXJyID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB2YXIgZGF0YUxlbiA9IGRhdGFBcnIubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoZGF0YUxlbi0tKSB7XG4gICAgICAgICAgdGhpcy5hZGREYXRhLmNhbGwodGhpcywgZGF0YUFycltkYXRhTGVuXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCB0byBzdG9yZSAgXG4gICAgICAgIHZhciBvcmdhbmlzZWRFbnRyeSA9IHRoaXMuX29yZ2FuaXNlRGF0YShhcmd1bWVudHNbMF0sIHRydWUpO1xuICAgICAgICBpZiAob3JnYW5pc2VkRW50cnkpIHtcbiAgICAgICAgICAvLyBpZiBpdCdzIHRoZSBmaXJzdCBkYXRhcG9pbnQgaW5pdGlhbGl6ZSB0aGUgZXh0cmVtYXMgd2l0aCBpdFxuICAgICAgICAgIGlmICh0aGlzLl9kYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fbWluID0gdGhpcy5fbWF4ID0gb3JnYW5pc2VkRW50cnkudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcnBhcnRpYWwnLCB7XG4gICAgICAgICAgICBtaW46IHRoaXMuX21pbixcbiAgICAgICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICAgICAgZGF0YTogW29yZ2FuaXNlZEVudHJ5XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBkYXRhUG9pbnRzID0gZGF0YS5kYXRhO1xuICAgICAgdmFyIHBvaW50c0xlbiA9IGRhdGFQb2ludHMubGVuZ3RoO1xuXG5cbiAgICAgIC8vIHJlc2V0IGRhdGEgYXJyYXlzXG4gICAgICB0aGlzLl9kYXRhID0gW107XG4gICAgICB0aGlzLl9yYWRpID0gW107XG5cbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwb2ludHNMZW47IGkrKykge1xuICAgICAgICB0aGlzLl9vcmdhbmlzZURhdGEoZGF0YVBvaW50c1tpXSwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWF4ID0gZGF0YS5tYXg7XG4gICAgICB0aGlzLl9taW4gPSBkYXRhLm1pbiB8fCAwO1xuICAgICAgXG4gICAgICB0aGlzLl9vbkV4dHJlbWFDaGFuZ2UoKTtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUT0RPOiBpbXBsZW1lbnRcbiAgICB9LFxuICAgIHNldERhdGFNYXg6IGZ1bmN0aW9uKG1heCkge1xuICAgICAgdGhpcy5fbWF4ID0gbWF4O1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKG1pbikge1xuICAgICAgdGhpcy5fbWluID0gbWluO1xuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldENvb3JkaW5hdG9yOiBmdW5jdGlvbihjb29yZGluYXRvcikge1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IgPSBjb29yZGluYXRvcjtcbiAgICB9LFxuICAgIF9nZXRJbnRlcm5hbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHsgXG4gICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICBtaW46IHRoaXMuX21pbiwgXG4gICAgICAgIGRhdGE6IHRoaXMuX2RhdGEsXG4gICAgICAgIHJhZGk6IHRoaXMuX3JhZGkgXG4gICAgICB9O1xuICAgIH0sXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdW5Pcmdhbml6ZURhdGEoKTtcbiAgICB9LyosXG5cbiAgICAgIFRPRE86IHJldGhpbmsuXG5cbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHJhZGl1cyA9IDEwMDtcbiAgICAgIHZhciB4ID0gcG9pbnQueDtcbiAgICAgIHZhciB5ID0gcG9pbnQueTtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgICAgaWYgKGRhdGFbeF0gJiYgZGF0YVt4XVt5XSkge1xuICAgICAgICByZXR1cm4gZGF0YVt4XVt5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICAgICAgLy8gcmFkaWFsIHNlYXJjaCBmb3IgZGF0YXBvaW50cyBiYXNlZCBvbiBkZWZhdWx0IHJhZGl1c1xuICAgICAgICBmb3IodmFyIGRpc3RhbmNlID0gMTsgZGlzdGFuY2UgPCByYWRpdXM7IGRpc3RhbmNlKyspIHtcbiAgICAgICAgICB2YXIgbmVpZ2hib3JzID0gZGlzdGFuY2UgKiAyICsxO1xuICAgICAgICAgIHZhciBzdGFydFggPSB4IC0gZGlzdGFuY2U7XG4gICAgICAgICAgdmFyIHN0YXJ0WSA9IHkgLSBkaXN0YW5jZTtcblxuICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBuZWlnaGJvcnM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgbyA9IDA7IG8gPCBuZWlnaGJvcnM7IG8rKykge1xuICAgICAgICAgICAgICBpZiAoKGkgPT0gMCB8fCBpID09IG5laWdoYm9ycy0xKSB8fCAobyA9PSAwIHx8IG8gPT0gbmVpZ2hib3JzLTEpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFbc3RhcnRZK2ldICYmIGRhdGFbc3RhcnRZK2ldW3N0YXJ0WCtvXSkge1xuICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goZGF0YVtzdGFydFkraV1bc3RhcnRYK29dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCB2YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSovXG4gIH07XG5cblxuICByZXR1cm4gU3RvcmU7XG59KSgpO1xuXG52YXIgQ2FudmFzMmRSZW5kZXJlciA9IChmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyQ2xvc3VyZSgpIHtcblxuICB2YXIgX2dldENvbG9yUGFsZXR0ZSA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBncmFkaWVudENvbmZpZyA9IGNvbmZpZy5ncmFkaWVudCB8fCBjb25maWcuZGVmYXVsdEdyYWRpZW50O1xuICAgIHZhciBwYWxldHRlQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHBhbGV0dGVDdHggPSBwYWxldHRlQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBwYWxldHRlQ2FudmFzLndpZHRoID0gMjU2O1xuICAgIHBhbGV0dGVDYW52YXMuaGVpZ2h0ID0gMTtcblxuICAgIHZhciBncmFkaWVudCA9IHBhbGV0dGVDdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMjU2LCAxKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZ3JhZGllbnRDb25maWcpIHtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcChrZXksIGdyYWRpZW50Q29uZmlnW2tleV0pO1xuICAgIH1cblxuICAgIHBhbGV0dGVDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgcGFsZXR0ZUN0eC5maWxsUmVjdCgwLCAwLCAyNTYsIDEpO1xuXG4gICAgcmV0dXJuIHBhbGV0dGVDdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIDI1NiwgMSkuZGF0YTtcbiAgfTtcblxuICB2YXIgX2dldFBvaW50VGVtcGxhdGUgPSBmdW5jdGlvbihyYWRpdXMsIGJsdXJGYWN0b3IpIHtcbiAgICB2YXIgdHBsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHRwbEN0eCA9IHRwbENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHZhciB4ID0gcmFkaXVzO1xuICAgIHZhciB5ID0gcmFkaXVzO1xuICAgIHRwbENhbnZhcy53aWR0aCA9IHRwbENhbnZhcy5oZWlnaHQgPSByYWRpdXMqMjtcblxuICAgIGlmIChibHVyRmFjdG9yID09IDEpIHtcbiAgICAgIHRwbEN0eC5iZWdpblBhdGgoKTtcbiAgICAgIHRwbEN0eC5hcmMoeCwgeSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgdHBsQ3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEpJztcbiAgICAgIHRwbEN0eC5maWxsKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBncmFkaWVudCA9IHRwbEN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudCh4LCB5LCByYWRpdXMqYmx1ckZhY3RvciwgeCwgeSwgcmFkaXVzKTtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLDAsMCwxKScpO1xuICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDApJyk7XG4gICAgICB0cGxDdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICB0cGxDdHguZmlsbFJlY3QoMCwgMCwgMipyYWRpdXMsIDIqcmFkaXVzKTtcbiAgICB9XG5cblxuXG4gICAgcmV0dXJuIHRwbENhbnZhcztcbiAgfTtcblxuICB2YXIgX3ByZXBhcmVEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZW5kZXJEYXRhID0gW107XG4gICAgdmFyIG1pbiA9IGRhdGEubWluO1xuICAgIHZhciBtYXggPSBkYXRhLm1heDtcbiAgICB2YXIgcmFkaSA9IGRhdGEucmFkaTtcbiAgICB2YXIgZGF0YSA9IGRhdGEuZGF0YTtcblxuICAgIHZhciB4VmFsdWVzID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gICAgdmFyIHhWYWx1ZXNMZW4gPSB4VmFsdWVzLmxlbmd0aDtcblxuICAgIHdoaWxlKHhWYWx1ZXNMZW4tLSkge1xuICAgICAgdmFyIHhWYWx1ZSA9IHhWYWx1ZXNbeFZhbHVlc0xlbl07XG4gICAgICB2YXIgeVZhbHVlcyA9IE9iamVjdC5rZXlzKGRhdGFbeFZhbHVlXSk7XG4gICAgICB2YXIgeVZhbHVlc0xlbiA9IHlWYWx1ZXMubGVuZ3RoO1xuICAgICAgd2hpbGUoeVZhbHVlc0xlbi0tKSB7XG4gICAgICAgIHZhciB5VmFsdWUgPSB5VmFsdWVzW3lWYWx1ZXNMZW5dO1xuICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3hWYWx1ZV1beVZhbHVlXTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IHJhZGlbeFZhbHVlXVt5VmFsdWVdO1xuICAgICAgICByZW5kZXJEYXRhLnB1c2goe1xuICAgICAgICAgIHg6IHhWYWx1ZSxcbiAgICAgICAgICB5OiB5VmFsdWUsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgIHJhZGl1czogcmFkaXVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtaW46IG1pbixcbiAgICAgIG1heDogbWF4LFxuICAgICAgZGF0YTogcmVuZGVyRGF0YVxuICAgIH07XG4gIH07XG5cblxuICBmdW5jdGlvbiBDYW52YXMyZFJlbmRlcmVyKGNvbmZpZykge1xuICAgIHZhciBjb250YWluZXIgPSBjb25maWcuY29udGFpbmVyO1xuICAgIHZhciBzaGFkb3dDYW52YXMgPSB0aGlzLnNoYWRvd0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcyA9IGNvbmZpZy5jYW52YXMgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdmFyIHJlbmRlckJvdW5kYXJpZXMgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAwLCAxMDAwMCwgMCwgMF07XG5cbiAgICB2YXIgY29tcHV0ZWQgPSBnZXRDb21wdXRlZFN0eWxlKGNvbmZpZy5jb250YWluZXIpIHx8IHt9O1xuXG4gICAgY2FudmFzLmNsYXNzTmFtZSA9ICdoZWF0bWFwLWNhbnZhcyc7XG5cbiAgICB0aGlzLl93aWR0aCA9IGNhbnZhcy53aWR0aCA9IHNoYWRvd0NhbnZhcy53aWR0aCA9IGNvbmZpZy53aWR0aCB8fCArKGNvbXB1dGVkLndpZHRoLnJlcGxhY2UoL3B4LywnJykpO1xuICAgIHRoaXMuX2hlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSBzaGFkb3dDYW52YXMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCB8fCArKGNvbXB1dGVkLmhlaWdodC5yZXBsYWNlKC9weC8sJycpKTtcblxuICAgIHRoaXMuc2hhZG93Q3R4ID0gc2hhZG93Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIC8vIEBUT0RPOlxuICAgIC8vIGNvbmRpdGlvbmFsIHdyYXBwZXJcblxuICAgIGNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gc2hhZG93Q2FudmFzLnN0eWxlLmNzc1RleHQgPSAncG9zaXRpb246YWJzb2x1dGU7bGVmdDowO3RvcDowOyc7XG5cbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgdGhpcy5fcGFsZXR0ZSA9IF9nZXRDb2xvclBhbGV0dGUoY29uZmlnKTtcbiAgICB0aGlzLl90ZW1wbGF0ZXMgPSB7fTtcblxuICAgIHRoaXMuX3NldFN0eWxlcyhjb25maWcpO1xuICB9O1xuXG4gIENhbnZhczJkUmVuZGVyZXIucHJvdG90eXBlID0ge1xuICAgIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9kcmF3QWxwaGEoZGF0YSk7XG4gICAgICAgIHRoaXMuX2NvbG9yaXplKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZW5kZXJBbGw6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIHJlc2V0IHJlbmRlciBib3VuZGFyaWVzXG4gICAgICB0aGlzLl9jbGVhcigpO1xuICAgICAgaWYgKGRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuX2RyYXdBbHBoYShfcHJlcGFyZURhdGEoZGF0YSkpO1xuICAgICAgICB0aGlzLl9jb2xvcml6ZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3VwZGF0ZUdyYWRpZW50OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX3BhbGV0dGUgPSBfZ2V0Q29sb3JQYWxldHRlKGNvbmZpZyk7XG4gICAgfSxcbiAgICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgaWYgKGNvbmZpZ1snZ3JhZGllbnQnXSkge1xuICAgICAgICB0aGlzLl91cGRhdGVHcmFkaWVudChjb25maWcpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2V0U3R5bGVzKGNvbmZpZyk7XG4gICAgfSxcbiAgICBzZXREaW1lbnNpb25zOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLnNoYWRvd0NhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zaGFkb3dDYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH0sXG4gICAgX2NsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc2hhZG93Q3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0KTtcbiAgICB9LFxuICAgIF9zZXRTdHlsZXM6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgdGhpcy5fYmx1ciA9IChjb25maWcuYmx1ciA9PSAwKT8wOihjb25maWcuYmx1ciB8fCBjb25maWcuZGVmYXVsdEJsdXIpO1xuXG4gICAgICBpZiAoY29uZmlnLmJhY2tncm91bmRDb2xvcikge1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb25maWcuYmFja2dyb3VuZENvbG9yO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl93aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5zaGFkb3dDYW52YXMud2lkdGggPSBjb25maWcud2lkdGggfHwgdGhpcy5fd2lkdGg7XG4gICAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNoYWRvd0NhbnZhcy5oZWlnaHQgPSBjb25maWcuaGVpZ2h0IHx8IHRoaXMuX2hlaWdodDtcblxuXG4gICAgICB0aGlzLl9vcGFjaXR5ID0gKGNvbmZpZy5vcGFjaXR5IHx8IDApICogMjU1O1xuICAgICAgdGhpcy5fbWF4T3BhY2l0eSA9IChjb25maWcubWF4T3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1heE9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fbWluT3BhY2l0eSA9IChjb25maWcubWluT3BhY2l0eSB8fCBjb25maWcuZGVmYXVsdE1pbk9wYWNpdHkpICogMjU1O1xuICAgICAgdGhpcy5fdXNlR3JhZGllbnRPcGFjaXR5ID0gISFjb25maWcudXNlR3JhZGllbnRPcGFjaXR5O1xuICAgIH0sXG4gICAgX2RyYXdBbHBoYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbiA9IGRhdGEubWluO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heCA9IGRhdGEubWF4O1xuICAgICAgdmFyIGRhdGEgPSBkYXRhLmRhdGEgfHwgW107XG4gICAgICB2YXIgZGF0YUxlbiA9IGRhdGEubGVuZ3RoO1xuICAgICAgLy8gb24gYSBwb2ludCBiYXNpcz9cbiAgICAgIHZhciBibHVyID0gMSAtIHRoaXMuX2JsdXI7XG5cbiAgICAgIHdoaWxlKGRhdGFMZW4tLSkge1xuXG4gICAgICAgIHZhciBwb2ludCA9IGRhdGFbZGF0YUxlbl07XG5cbiAgICAgICAgdmFyIHggPSBwb2ludC54O1xuICAgICAgICB2YXIgeSA9IHBvaW50Lnk7XG4gICAgICAgIHZhciByYWRpdXMgPSBwb2ludC5yYWRpdXM7XG4gICAgICAgIC8vIGlmIHZhbHVlIGlzIGJpZ2dlciB0aGFuIG1heFxuICAgICAgICAvLyB1c2UgbWF4IGFzIHZhbHVlXG4gICAgICAgIHZhciB2YWx1ZSA9IE1hdGgubWluKHBvaW50LnZhbHVlLCBtYXgpO1xuICAgICAgICB2YXIgcmVjdFggPSB4IC0gcmFkaXVzO1xuICAgICAgICB2YXIgcmVjdFkgPSB5IC0gcmFkaXVzO1xuICAgICAgICB2YXIgc2hhZG93Q3R4ID0gdGhpcy5zaGFkb3dDdHg7XG5cblxuXG5cbiAgICAgICAgdmFyIHRwbDtcbiAgICAgICAgaWYgKCF0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXSkge1xuICAgICAgICAgIHRoaXMuX3RlbXBsYXRlc1tyYWRpdXNdID0gdHBsID0gX2dldFBvaW50VGVtcGxhdGUocmFkaXVzLCBibHVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cGwgPSB0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXTtcbiAgICAgICAgfVxuICAgICAgICAvLyB2YWx1ZSBmcm9tIG1pbmltdW0gLyB2YWx1ZSByYW5nZVxuICAgICAgICAvLyA9PiBbMCwgMV1cbiAgICAgICAgdmFyIHRlbXBsYXRlQWxwaGEgPSAodmFsdWUtbWluKS8obWF4LW1pbik7XG4gICAgICAgIC8vIHRoaXMgZml4ZXMgIzE3Njogc21hbGwgdmFsdWVzIGFyZSBub3QgdmlzaWJsZSBiZWNhdXNlIGdsb2JhbEFscGhhIDwgLjAxIGNhbm5vdCBiZSByZWFkIGZyb20gaW1hZ2VEYXRhXG4gICAgICAgIHNoYWRvd0N0eC5nbG9iYWxBbHBoYSA9IHRlbXBsYXRlQWxwaGEgPCAuMDEgPyAuMDEgOiB0ZW1wbGF0ZUFscGhhO1xuXG4gICAgICAgIHNoYWRvd0N0eC5kcmF3SW1hZ2UodHBsLCByZWN0WCwgcmVjdFkpO1xuXG4gICAgICAgIC8vIHVwZGF0ZSByZW5kZXJCb3VuZGFyaWVzXG4gICAgICAgIGlmIChyZWN0WCA8IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF0gPSByZWN0WDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RZIDwgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXSA9IHJlY3RZO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFggKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gPSByZWN0WCArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVjdFkgKyAyKnJhZGl1cyA+IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gPSByZWN0WSArIDIqcmFkaXVzO1xuICAgICAgICAgIH1cblxuICAgICAgfVxuICAgIH0sXG4gICAgX2NvbG9yaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB4ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1swXTtcbiAgICAgIHZhciB5ID0gdGhpcy5fcmVuZGVyQm91bmRhcmllc1sxXTtcbiAgICAgIHZhciB3aWR0aCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMl0gLSB4O1xuICAgICAgdmFyIGhlaWdodCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbM10gLSB5O1xuICAgICAgdmFyIG1heFdpZHRoID0gdGhpcy5fd2lkdGg7XG4gICAgICB2YXIgbWF4SGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xuICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5O1xuICAgICAgdmFyIG1heE9wYWNpdHkgPSB0aGlzLl9tYXhPcGFjaXR5O1xuICAgICAgdmFyIG1pbk9wYWNpdHkgPSB0aGlzLl9taW5PcGFjaXR5O1xuICAgICAgdmFyIHVzZUdyYWRpZW50T3BhY2l0eSA9IHRoaXMuX3VzZUdyYWRpZW50T3BhY2l0eTtcblxuICAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgIHggPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHkgPCAwKSB7XG4gICAgICAgIHkgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHggKyB3aWR0aCA+IG1heFdpZHRoKSB7XG4gICAgICAgIHdpZHRoID0gbWF4V2lkdGggLSB4O1xuICAgICAgfVxuICAgICAgaWYgKHkgKyBoZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgaGVpZ2h0ID0gbWF4SGVpZ2h0IC0geTtcbiAgICAgIH1cblxuICAgICAgdmFyIGltZyA9IHRoaXMuc2hhZG93Q3R4LmdldEltYWdlRGF0YSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIHZhciBpbWdEYXRhID0gaW1nLmRhdGE7XG4gICAgICB2YXIgbGVuID0gaW1nRGF0YS5sZW5ndGg7XG4gICAgICB2YXIgcGFsZXR0ZSA9IHRoaXMuX3BhbGV0dGU7XG5cblxuICAgICAgZm9yICh2YXIgaSA9IDM7IGkgPCBsZW47IGkrPSA0KSB7XG4gICAgICAgIHZhciBhbHBoYSA9IGltZ0RhdGFbaV07XG4gICAgICAgIHZhciBvZmZzZXQgPSBhbHBoYSAqIDQ7XG5cblxuICAgICAgICBpZiAoIW9mZnNldCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbmFsQWxwaGE7XG4gICAgICAgIGlmIChvcGFjaXR5ID4gMCkge1xuICAgICAgICAgIGZpbmFsQWxwaGEgPSBvcGFjaXR5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChhbHBoYSA8IG1heE9wYWNpdHkpIHtcbiAgICAgICAgICAgIGlmIChhbHBoYSA8IG1pbk9wYWNpdHkpIHtcbiAgICAgICAgICAgICAgZmluYWxBbHBoYSA9IG1pbk9wYWNpdHk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmaW5hbEFscGhhID0gYWxwaGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBtYXhPcGFjaXR5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGltZ0RhdGFbaS0zXSA9IHBhbGV0dGVbb2Zmc2V0XTtcbiAgICAgICAgaW1nRGF0YVtpLTJdID0gcGFsZXR0ZVtvZmZzZXQgKyAxXTtcbiAgICAgICAgaW1nRGF0YVtpLTFdID0gcGFsZXR0ZVtvZmZzZXQgKyAyXTtcbiAgICAgICAgaW1nRGF0YVtpXSA9IHVzZUdyYWRpZW50T3BhY2l0eSA/IHBhbGV0dGVbb2Zmc2V0ICsgM10gOiBmaW5hbEFscGhhO1xuXG4gICAgICB9XG5cbiAgICAgIGltZy5kYXRhID0gaW1nRGF0YTtcbiAgICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YShpbWcsIHgsIHkpO1xuXG4gICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzID0gWzEwMDAsIDEwMDAsIDAsIDBdO1xuXG4gICAgfSxcbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIHNoYWRvd0N0eCA9IHRoaXMuc2hhZG93Q3R4O1xuICAgICAgdmFyIGltZyA9IHNoYWRvd0N0eC5nZXRJbWFnZURhdGEocG9pbnQueCwgcG9pbnQueSwgMSwgMSk7XG4gICAgICB2YXIgZGF0YSA9IGltZy5kYXRhWzNdO1xuICAgICAgdmFyIG1heCA9IHRoaXMuX21heDtcbiAgICAgIHZhciBtaW4gPSB0aGlzLl9taW47XG5cbiAgICAgIHZhbHVlID0gKE1hdGguYWJzKG1heC1taW4pICogKGRhdGEvMjU1KSkgPj4gMDtcblxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgZ2V0RGF0YVVSTDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5jYW52YXMudG9EYXRhVVJMKCk7XG4gICAgfVxuICB9O1xuXG5cbiAgcmV0dXJuIENhbnZhczJkUmVuZGVyZXI7XG59KSgpO1xuXG5cbnZhciBSZW5kZXJlciA9IChmdW5jdGlvbiBSZW5kZXJlckNsb3N1cmUoKSB7XG5cbiAgdmFyIHJlbmRlcmVyRm4gPSBmYWxzZTtcblxuICBpZiAoSGVhdG1hcENvbmZpZ1snZGVmYXVsdFJlbmRlcmVyJ10gPT09ICdjYW52YXMyZCcpIHtcbiAgICByZW5kZXJlckZuID0gQ2FudmFzMmRSZW5kZXJlcjtcbiAgfVxuXG4gIHJldHVybiByZW5kZXJlckZuO1xufSkoKTtcblxuXG52YXIgVXRpbCA9IHtcbiAgbWVyZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtZXJnZWQgPSB7fTtcbiAgICB2YXIgYXJnc0xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzTGVuOyBpKyspIHtcbiAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbaV1cbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgbWVyZ2VkW2tleV0gPSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlZDtcbiAgfVxufTtcbi8vIEhlYXRtYXAgQ29uc3RydWN0b3JcbnZhciBIZWF0bWFwID0gKGZ1bmN0aW9uIEhlYXRtYXBDbG9zdXJlKCkge1xuXG4gIHZhciBDb29yZGluYXRvciA9IChmdW5jdGlvbiBDb29yZGluYXRvckNsb3N1cmUoKSB7XG5cbiAgICBmdW5jdGlvbiBDb29yZGluYXRvcigpIHtcbiAgICAgIHRoaXMuY1N0b3JlID0ge307XG4gICAgfTtcblxuICAgIENvb3JkaW5hdG9yLnByb3RvdHlwZSA9IHtcbiAgICAgIG9uOiBmdW5jdGlvbihldnROYW1lLCBjYWxsYmFjaywgc2NvcGUpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuXG4gICAgICAgIGlmICghY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgY1N0b3JlW2V2dE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgY1N0b3JlW2V2dE5hbWVdLnB1c2goKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHNjb3BlLCBkYXRhKTtcbiAgICAgICAgfSkpO1xuICAgICAgfSxcbiAgICAgIGVtaXQ6IGZ1bmN0aW9uKGV2dE5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIGNTdG9yZSA9IHRoaXMuY1N0b3JlO1xuICAgICAgICBpZiAoY1N0b3JlW2V2dE5hbWVdKSB7XG4gICAgICAgICAgdmFyIGxlbiA9IGNTdG9yZVtldnROYW1lXS5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBjU3RvcmVbZXZ0TmFtZV1baV07XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIENvb3JkaW5hdG9yO1xuICB9KSgpO1xuXG5cbiAgdmFyIF9jb25uZWN0ID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgICB2YXIgcmVuZGVyZXIgPSBzY29wZS5fcmVuZGVyZXI7XG4gICAgdmFyIGNvb3JkaW5hdG9yID0gc2NvcGUuX2Nvb3JkaW5hdG9yO1xuICAgIHZhciBzdG9yZSA9IHNjb3BlLl9zdG9yZTtcblxuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJwYXJ0aWFsJywgcmVuZGVyZXIucmVuZGVyUGFydGlhbCwgcmVuZGVyZXIpO1xuICAgIGNvb3JkaW5hdG9yLm9uKCdyZW5kZXJhbGwnLCByZW5kZXJlci5yZW5kZXJBbGwsIHJlbmRlcmVyKTtcbiAgICBjb29yZGluYXRvci5vbignZXh0cmVtYWNoYW5nZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNjb3BlLl9jb25maWcub25FeHRyZW1hQ2hhbmdlICYmXG4gICAgICBzY29wZS5fY29uZmlnLm9uRXh0cmVtYUNoYW5nZSh7XG4gICAgICAgIG1pbjogZGF0YS5taW4sXG4gICAgICAgIG1heDogZGF0YS5tYXgsXG4gICAgICAgIGdyYWRpZW50OiBzY29wZS5fY29uZmlnWydncmFkaWVudCddIHx8IHNjb3BlLl9jb25maWdbJ2RlZmF1bHRHcmFkaWVudCddXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBzdG9yZS5zZXRDb29yZGluYXRvcihjb29yZGluYXRvcik7XG4gIH07XG5cblxuICBmdW5jdGlvbiBIZWF0bWFwKCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLl9jb25maWcgPSBVdGlsLm1lcmdlKEhlYXRtYXBDb25maWcsIGFyZ3VtZW50c1swXSB8fCB7fSk7XG4gICAgdGhpcy5fY29vcmRpbmF0b3IgPSBuZXcgQ29vcmRpbmF0b3IoKTtcbiAgICBpZiAoY29uZmlnWydwbHVnaW4nXSkge1xuICAgICAgdmFyIHBsdWdpblRvTG9hZCA9IGNvbmZpZ1sncGx1Z2luJ107XG4gICAgICBpZiAoIUhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5Ub0xvYWRdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGx1Z2luIFxcJycrIHBsdWdpblRvTG9hZCArICdcXCcgbm90IGZvdW5kLiBNYXliZSBpdCB3YXMgbm90IHJlZ2lzdGVyZWQuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGx1Z2luID0gSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpblRvTG9hZF07XG4gICAgICAgIC8vIHNldCBwbHVnaW4gcmVuZGVyZXIgYW5kIHN0b3JlXG4gICAgICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IHBsdWdpbi5yZW5kZXJlcihjb25maWcpO1xuICAgICAgICB0aGlzLl9zdG9yZSA9IG5ldyBwbHVnaW4uc3RvcmUoY29uZmlnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoY29uZmlnKTtcbiAgICAgIHRoaXMuX3N0b3JlID0gbmV3IFN0b3JlKGNvbmZpZyk7XG4gICAgfVxuICAgIF9jb25uZWN0KHRoaXMpO1xuICB9O1xuXG4gIC8vIEBUT0RPOlxuICAvLyBhZGQgQVBJIGRvY3VtZW50YXRpb25cbiAgSGVhdG1hcC5wcm90b3R5cGUgPSB7XG4gICAgYWRkRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5hZGREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW1vdmVEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnJlbW92ZURhdGEgJiYgdGhpcy5fc3RvcmUucmVtb3ZlRGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhLmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWF4OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGFNYXguYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGFNaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YU1pbi5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX2NvbmZpZyA9IFV0aWwubWVyZ2UodGhpcy5fY29uZmlnLCBjb25maWcpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIudXBkYXRlQ29uZmlnKHRoaXMuX2NvbmZpZyk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9zdG9yZS5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZXBhaW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ3JlbmRlcmFsbCcsIHRoaXMuX3N0b3JlLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlLmdldERhdGEoKTtcbiAgICB9LFxuICAgIGdldERhdGFVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldERhdGFVUkwoKTtcbiAgICB9LFxuICAgIGdldFZhbHVlQXQ6IGZ1bmN0aW9uKHBvaW50KSB7XG5cbiAgICAgIGlmICh0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5nZXRWYWx1ZUF0KHBvaW50KTtcbiAgICAgIH0gZWxzZSAgaWYgKHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLmdldFZhbHVlQXQocG9pbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBIZWF0bWFwO1xuXG59KSgpO1xuXG5cbi8vIGNvcmVcbnZhciBoZWF0bWFwRmFjdG9yeSA9IHtcbiAgY3JlYXRlOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICByZXR1cm4gbmV3IEhlYXRtYXAoY29uZmlnKTtcbiAgfSxcbiAgcmVnaXN0ZXI6IGZ1bmN0aW9uKHBsdWdpbktleSwgcGx1Z2luKSB7XG4gICAgSGVhdG1hcENvbmZpZy5wbHVnaW5zW3BsdWdpbktleV0gPSBwbHVnaW47XG4gIH1cbn07XG5cbnJldHVybiBoZWF0bWFwRmFjdG9yeTtcblxuXG59KTsiLCJjb25zdCBVUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OFwiXHJcblxyXG5jb25zdCBBUEkgPSB7XHJcblxyXG4gIGdldFNpbmdsZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGdldEFsbChleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBkZWxldGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWAsIHtcclxuICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHBvc3RJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHB1dEl0ZW0oZXh0ZW5zaW9uLCBvYmopIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBVVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBUEkiLCJmdW5jdGlvbiBlbEJ1aWxkZXIobmFtZSwgYXR0cmlidXRlc09iaiwgdHh0LCAuLi5jaGlsZHJlbikge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcclxuICBmb3IgKGxldCBhdHRyIGluIGF0dHJpYnV0ZXNPYmopIHtcclxuICAgIGVsLnNldEF0dHJpYnV0ZShhdHRyLCBhdHRyaWJ1dGVzT2JqW2F0dHJdKTtcclxuICB9XHJcbiAgZWwudGV4dENvbnRlbnQgPSB0eHQgfHwgbnVsbDtcclxuICBjaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICB9KVxyXG4gIHJldHVybiBlbDtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZWxCdWlsZGVyIiwiaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIjtcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCI7XHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiO1xyXG5pbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCI7XHJcblxyXG4vLyB0aGUgcHVycG9zZSBvZiB0aGlzIG1vZHVsZSBpcyB0bzpcclxuLy8gMS4gc2F2ZSBhbGwgY29udGVudCBpbiB0aGUgZ2FtZXBsYXkgcGFnZSAoc2hvdCBhbmQgZ2FtZSBkYXRhKSB0byB0aGUgZGF0YWJhc2VcclxuLy8gMi4gaW1tZWRpYXRlbHkgY2xlYXIgdGhlIGdhbWVwbGF5IGNvbnRhaW5lcnMgb2YgY29udGVudCBvbiBzYXZlXHJcbi8vIDMuIGltbWVkaWF0ZWx5IHJlc2V0IGFsbCBnbG9iYWwgdmFyaWFibGVzIGluIHRoZSBzaG90ZGF0YSBmaWxlIHRvIGFsbG93IHRoZSB1c2VyIHRvIGJlZ2luIHNhdmluZyBzaG90cyBhbmQgZW50ZXJpbmcgZ2FtZSBkYXRhIGZvciB0aGVpciBuZXh0IGdhbWVcclxuLy8gNC4gYWZmb3JkYW5jZSBmb3IgdXNlciB0byByZWNhbGwgYWxsIGRhdGEgZnJvbSBwcmV2aW91cyBzYXZlZCBnYW1lIGZvciBlZGl0aW5nXHJcbi8vIDUuIGluY2x1ZGUgYW55IG90aGVyIGZ1bmN0aW9ucyBuZWVkZWQgdG8gc3VwcG9ydCB0aGUgZmlyc3QgNCByZXF1aXJlbWVudHNcclxuXHJcbi8vIHRoaXMgZ2xvYmFsIHZhcmlhYmxlIGlzIHVzZWQgdG8gcGFzcyBzYXZlZCBzaG90cywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbCBib29sZWFuIHRvIHNob3REYXRhLmpzIGR1cmluZyB0aGUgZWRpdCBwcm9jZXNzXHJcbmxldCBzYXZlZEdhbWVPYmplY3Q7XHJcbmxldCBwdXRQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbmxldCBwb3N0UHJvbWlzZXNFZGl0TW9kZSA9IFtdXHJcbmxldCBwb3N0UHJvbWlzZXMgPSBbXTtcclxuXHJcbmNvbnN0IGdhbWVEYXRhID0ge1xyXG5cclxuICBnYW1lVHlwZUJ1dHRvblRvZ2dsZShlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHRvZ2dsZXMgdGhlIFwiaXMtc2VsZWN0ZWRcIiBjbGFzcyBiZXR3ZWVuIHRoZSBnYW1lIHR5cGUgYnV0dG9uc1xyXG5cclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuICAgIGxldCBidG5DbGlja2VkID0gZS50YXJnZXQ7XHJcblxyXG4gICAgaWYgKCFidG5DbGlja2VkLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKSB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRHYW1lVHlwZUJ0biA9IGdhbWVUeXBlQnRucy5maWx0ZXIoYnRuID0+IGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSk7XHJcbiAgICAgIGN1cnJlbnRHYW1lVHlwZUJ0blswXS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGN1cnJlbnRHYW1lVHlwZUJ0blswXS5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bkNsaWNrZWQuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCkge1xyXG4gICAgc2F2ZWRHYW1lT2JqZWN0ID0gdW5kZWZpbmVkO1xyXG4gICAgcHV0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG4gICAgcG9zdFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxuICAgIHBvc3RQcm9taXNlcyA9IFtdO1xyXG4gIH0sXHJcblxyXG4gIHB1dEVkaXRlZFNob3RzKHByZXZpb3VzbHlTYXZlZFNob3RzQXJyKSB7XHJcbiAgICAvLyBQVVQgZmlyc3QsIHNpY25lIHlvdSBjYW4ndCBzYXZlIGEgZ2FtZSBpbml0aWFsbHkgd2l0aG91dCBhdCBsZWFzdCAxIHNob3RcclxuICAgIHByZXZpb3VzbHlTYXZlZFNob3RzQXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIC8vIGV2ZW4gdGhvdWdoIGl0J3MgYSBQVVQsIHdlIGhhdmUgdG8gcmVmb3JtYXQgdGhlIF9maWVsZFggc3ludGF4IHRvIGZpZWxkWFxyXG4gICAgICBsZXQgc2hvdEZvclB1dCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUHV0LmdhbWVJZCA9IHNhdmVkR2FtZU9iamVjdC5pZDtcclxuICAgICAgc2hvdEZvclB1dC5maWVsZFggPSBzaG90Ll9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQdXQuZmllbGRZID0gc2hvdC5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUHV0LmdvYWxYID0gc2hvdC5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQdXQuZ29hbFkgPSBzaG90Ll9nb2FsWTtcclxuICAgICAgc2hvdEZvclB1dC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3QuYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQdXQuYWVyaWFsID0gc2hvdC5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUHV0LnRpbWVTdGFtcCA9IHNob3QuX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHB1dFByb21pc2VzRWRpdE1vZGUucHVzaChBUEkucHV0SXRlbShgc2hvdHMvJHtzaG90LmlkfWAsIHNob3RGb3JQdXQpKTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHV0UHJvbWlzZXNFZGl0TW9kZSlcclxuICB9LFxyXG5cclxuICBwb3N0TmV3U2hvdHNNYWRlRHVyaW5nRWRpdE1vZGUoc2hvdHNOb3RZZXRQb3N0ZWRBcnIpIHtcclxuICAgIHNob3RzTm90WWV0UG9zdGVkQXJyLmZvckVhY2goc2hvdE9iaiA9PiB7XHJcbiAgICAgIGxldCBzaG90Rm9yUG9zdCA9IHt9O1xyXG4gICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBzYXZlZEdhbWVPYmplY3QuaWQ7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZO1xyXG4gICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZCk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclBvc3QudGltZVN0YW1wID0gc2hvdE9iai5fdGltZVN0YW1wO1xyXG5cclxuICAgICAgcG9zdFByb21pc2VzRWRpdE1vZGUucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHBvc3RQcm9taXNlc0VkaXRNb2RlKVxyXG4gIH0sXHJcblxyXG4gIHBvc3ROZXdTaG90cyhnYW1lSWQpIHtcclxuICAgIC8vIHBvc3Qgc2hvdHMgd2l0aCBnYW1lSWRcclxuICAgIGNvbnN0IHNob3RBcnIgPSBzaG90RGF0YS5nZXRTaG90T2JqZWN0c0ZvclNhdmluZygpO1xyXG4gICAgc2hvdEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICBsZXQgc2hvdEZvclBvc3QgPSB7fTtcclxuICAgICAgc2hvdEZvclBvc3QuZ2FtZUlkID0gZ2FtZUlkO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFggPSBzaG90T2JqLl9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWSA9IHNob3RPYmouX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFggPSBzaG90T2JqLl9nb2FsWDtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFkgPSBzaG90T2JqLl9nb2FsWTtcclxuICAgICAgc2hvdEZvclBvc3QuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90T2JqLmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUG9zdC5hZXJpYWwgPSBzaG90T2JqLl9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQb3N0LnRpbWVTdGFtcCA9IHNob3RPYmouX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHBvc3RQcm9taXNlcy5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RzXCIsIHNob3RGb3JQb3N0KSk7XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHBvc3RQcm9taXNlcylcclxuICB9LFxyXG5cclxuICBzYXZlRGF0YShnYW1lRGF0YU9iaiwgc2F2aW5nRWRpdGVkR2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBmaXJzdCBkZXRlcm1pbmVzIGlmIGEgZ2FtZSBpcyBiZWluZyBzYXZlZCBhcyBuZXcsIG9yIGEgcHJldmlvdXNseSBzYXZlZCBnYW1lIGlzIGJlaW5nIGVkaXRlZFxyXG4gICAgLy8gaWYgc2F2aW5nIGFuIGVkaXRlZCBnYW1lLCB0aGUgZ2FtZSBpcyBQVVQsIGFsbCBzaG90cyBzYXZlZCBwcmV2aW91c2x5IGFyZSBQVVQsIGFuZCBuZXcgc2hvdHMgYXJlIFBPU1RFRFxyXG4gICAgLy8gaWYgdGhlIGdhbWUgaXMgYSBuZXcgZ2FtZSBhbHRvZ2V0aGVyLCB0aGVuIHRoZSBnYW1lIGlzIFBPU1RFRCBhbmQgYWxsIHNob3RzIGFyZSBQT1NURURcclxuICAgIC8vIHRoZW4gZnVuY3Rpb25zIGFyZSBjYWxsZWQgdG8gcmVsb2FkIHRoZSBtYXN0ZXIgY29udGFpbmVyIGFuZCByZXNldCBnbG9iYWwgc2hvdCBkYXRhIHZhcmlhYmxlc1xyXG5cclxuICAgIGlmIChzYXZpbmdFZGl0ZWRHYW1lKSB7XHJcbiAgICAgIC8vIHVzZSBJRCBvZiBnYW1lIHN0b3JlZCBpbiBnbG9iYWwgdmFyXHJcbiAgICAgIEFQSS5wdXRJdGVtKGBnYW1lcy8ke3NhdmVkR2FtZU9iamVjdC5pZH1gLCBnYW1lRGF0YU9iailcclxuICAgICAgICAudGhlbihnYW1lUFVUID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUIEdBTUVcIiwgZ2FtZVBVVClcclxuICAgICAgICAgIC8vIHBvc3Qgc2hvdHMgd2l0aCBnYW1lSWRcclxuICAgICAgICAgIGNvbnN0IHNob3RBcnIgPSBzaG90RGF0YS5nZXRTaG90T2JqZWN0c0ZvclNhdmluZygpO1xyXG4gICAgICAgICAgY29uc3QgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIgPSBbXTtcclxuICAgICAgICAgIGNvbnN0IHNob3RzTm90WWV0UG9zdGVkQXJyID0gW107XHJcblxyXG4gICAgICAgICAgLy8gY3JlYXRlIGFycmF5cyBmb3IgUFVUIGFuZCBQT1NUIGZ1bmN0aW9ucyAoaWYgdGhlcmUncyBhbiBpZCBpbiB0aGUgYXJyYXksIGl0J3MgYmVlbiBzYXZlZCB0byB0aGUgZGF0YWJhc2UgYmVmb3JlKVxyXG4gICAgICAgICAgc2hvdEFyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc2hvdC5pZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgcHJldmlvdXNseVNhdmVkU2hvdHNBcnIucHVzaChzaG90KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzaG90c05vdFlldFBvc3RlZEFyci5wdXNoKHNob3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRvIFBVVCBhbmQgUE9TVFxyXG4gICAgICAgICAgLy8gY2FsbCBmdW5jdGlvbnMgdGhhdCBjbGVhciBnYW1lcGxheSBjb250ZW50IGFuZCByZXNldCBnbG9iYWwgc2hvdC9nYW1lIGRhdGEgdmFyaWFibGVzXHJcbiAgICAgICAgICBnYW1lRGF0YS5wdXRFZGl0ZWRTaG90cyhwcmV2aW91c2x5U2F2ZWRTaG90c0FycilcclxuICAgICAgICAgICAgLnRoZW4oeCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQVVRTOlwiLCB4KVxyXG4gICAgICAgICAgICAgIC8vIGlmIG5vIG5ldyBzaG90cyB3ZXJlIG1hZGUsIHJlbG9hZC4gZWxzZSBwb3N0IG5ldyBzaG90c1xyXG4gICAgICAgICAgICAgIGlmIChzaG90c05vdFlldFBvc3RlZEFyci5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZ2FtZURhdGEucG9zdE5ld1Nob3RzTWFkZUR1cmluZ0VkaXRNb2RlKHNob3RzTm90WWV0UG9zdGVkQXJyKVxyXG4gICAgICAgICAgICAgICAgICAudGhlbih5ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBPU1RTOlwiLCB5KVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5wb3N0SXRlbShcImdhbWVzXCIsIGdhbWVEYXRhT2JqKVxyXG4gICAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5pZClcclxuICAgICAgICAudGhlbihnYW1lSWQgPT4ge1xyXG4gICAgICAgICAgZ2FtZURhdGEucG9zdE5ld1Nob3RzKGdhbWVJZClcclxuICAgICAgICAgICAgLnRoZW4oeiA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTQVZFRCBORVcgU0hPVFNcIiwgeik7XHJcbiAgICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBwYWNrYWdlR2FtZURhdGEoKSB7XHJcblxyXG4gICAgLy8gZ2V0IHVzZXIgSUQgZnJvbSBzZXNzaW9uIHN0b3JhZ2VcclxuICAgIC8vIHBhY2thZ2UgZWFjaCBpbnB1dCBmcm9tIGdhbWUgZGF0YSBjb250YWluZXIgaW50byB2YXJpYWJsZXNcclxuICAgIC8vIFRPRE86IGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBwcmV2ZW50IGJsYW5rIHNjb3JlIGVudHJpZXNcclxuICAgIC8vIFRPRE86IGNyZWF0ZSBhIG1vZGFsIGFza2luZyB1c2VyIGlmIHRoZXkgd2FudCB0byBzYXZlIGdhbWVcclxuXHJcbiAgICAvLyBwbGF5ZXJJZFxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIikpO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZSAoMXYxLCAydjIsIDN2MylcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuICAgIGxldCBnYW1lVHlwZSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBnYW1lVHlwZUJ0bnMuZm9yRWFjaChidG4gPT4ge1xyXG4gICAgICBpZiAoYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKSB7XHJcbiAgICAgICAgZ2FtZVR5cGUgPSBidG4udGV4dENvbnRlbnRcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvLyBnYW1lIG1vZGUgKG5vdGU6IGRpZCBub3QgdXNlIGJvb2xlYW4gaW4gY2FzZSBtb3JlIGdhbWUgbW9kZXMgYXJlIHN1cHBvcnRlZCBpbiB0aGUgZnV0dXJlKVxyXG4gICAgY29uc3Qgc2VsX2dhbWVNb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lTW9kZUlucHV0XCIpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxfZ2FtZU1vZGUudmFsdWUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAvLyBteSB0ZWFtIChub3RlOiBkaWQgbm90IHVzZSBib29sZWFuIGluIHByZXBhcmF0aW9uIGZvciB1c2VycyB0byBlbnRlciB0aGUgY2x1YiBpbmZvcm1hdGlvbilcclxuICAgIGNvbnN0IHNlbF90ZWFtQ29sb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlYW1JbnB1dFwiKTtcclxuICAgIGxldCBteVRlYW07XHJcbiAgICBpZiAoc2VsX3RlYW1Db2xvci52YWx1ZSA9PT0gXCJPcmFuZ2UgdGVhbVwiKSB7XHJcbiAgICAgIG15VGVhbSA9IFwib3JhbmdlXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBteVRlYW0gPSBcImJsdWVcIjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzY29yZXNcclxuICAgIGxldCBteVNjb3JlO1xyXG4gICAgbGV0IHRoZWlyU2NvcmU7XHJcbiAgICBjb25zdCBpbnB0X29yYW5nZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvcmFuZ2VTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF9ibHVlU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJsdWVTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIGlmIChteVRlYW0gPT09IFwib3JhbmdlXCIpIHtcclxuICAgICAgbXlTY29yZSA9IE51bWJlcihpbnB0X29yYW5nZVNjb3JlLnZhbHVlKTtcclxuICAgICAgdGhlaXJTY29yZSA9IE51bWJlcihpbnB0X2JsdWVTY29yZS52YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBteVNjb3JlID0gTnVtYmVyKGlucHRfYmx1ZVNjb3JlLnZhbHVlKTtcclxuICAgICAgdGhlaXJTY29yZSA9IE51bWJlcihpbnB0X29yYW5nZVNjb3JlLnZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgbGV0IG92ZXJ0aW1lO1xyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG4gICAgaWYgKHNlbF9vdmVydGltZS52YWx1ZSA9PT0gXCJPdmVydGltZVwiKSB7XHJcbiAgICAgIG92ZXJ0aW1lID0gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG92ZXJ0aW1lID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGdhbWVEYXRhT2JqID0ge1xyXG4gICAgICBcInVzZXJJZFwiOiBhY3RpdmVVc2VySWQsXHJcbiAgICAgIFwibW9kZVwiOiBnYW1lTW9kZSxcclxuICAgICAgXCJ0eXBlXCI6IGdhbWVUeXBlLFxyXG4gICAgICBcInRlYW1cIjogbXlUZWFtLFxyXG4gICAgICBcInNjb3JlXCI6IG15U2NvcmUsXHJcbiAgICAgIFwib3BwX3Njb3JlXCI6IHRoZWlyU2NvcmUsXHJcbiAgICAgIFwib3ZlcnRpbWVcIjogb3ZlcnRpbWUsXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCBhIG5ldyBnYW1lIG9yIGVkaXRlZCBnYW1lIGlzIGJlaW5nIHNhdmVkLiBJZiBhbiBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZCwgdGhlbiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgc2hvdCBzYXZlZCBhbHJlYWR5LCBtYWtpbmcgdGhlIHJldHVybiBmcm9tIHRoZSBzaG90RGF0YSBmdW5jdGlvbiBtb3JlIHRoYW4gMFxyXG4gICAgY29uc3Qgc2F2aW5nRWRpdGVkR2FtZSA9IHNob3REYXRhLmdldEluaXRpYWxOdW1PZlNob3RzKClcclxuICAgIGlmIChzYXZpbmdFZGl0ZWRHYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZ2FtZURhdGFPYmoudGltZVN0YW1wID0gc2F2ZWRHYW1lT2JqZWN0LnRpbWVTdGFtcFxyXG4gICAgICBnYW1lRGF0YS5zYXZlRGF0YShnYW1lRGF0YU9iaiwgdHJ1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyB0aW1lIHN0YW1wIGlmIG5ldyBnYW1lXHJcbiAgICAgIGxldCB0aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICBnYW1lRGF0YU9iai50aW1lU3RhbXAgPSB0aW1lU3RhbXBcclxuICAgICAgZ2FtZURhdGEuc2F2ZURhdGEoZ2FtZURhdGFPYmosIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVByZXZHYW1lRWRpdHMoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInNhdmluZyBlZGl0cy4uLlwiKVxyXG4gICAgZ2FtZURhdGEucGFja2FnZUdhbWVEYXRhKCk7XHJcbiAgICAvLyBUT0RPOiAoKFNURVAgMykpIFBVVCBlZGl0cyB0byBkYXRhYmFzZVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbEVkaXRpbmdNb2RlKCkge1xyXG4gICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICB9LFxyXG5cclxuICByZW5kZXJFZGl0QnV0dG9ucygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVtb3ZlcyAmIHJlcGxhY2VzIGVkaXQgYW5kIHNhdmUgZ2FtZSBidXR0b25zIHdpdGggXCJTYXZlIEVkaXRzXCIgYW5kIFwiQ2FuY2VsIEVkaXRzXCJcclxuICAgIGNvbnN0IGJ0bl9lZGl0UHJldkdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRQcmV2R2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlR2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUdhbWVcIik7XHJcbiAgICAvLyBpbiBjYXNlIG9mIGxhZyBpbiBmZXRjaCwgcHJldmVudCB1c2VyIGZyb20gZG91YmxlIGNsaWNraW5nIGJ1dHRvblxyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBidG5fZWRpdFByZXZHYW1lLmNsYXNzTGlzdC5hZGQoXCJpcy1sb2FkaW5nXCIpO1xyXG5cclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIEVkaXRzXCIpXHJcbiAgICBjb25zdCBidG5fc2F2ZUVkaXRzID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVFZGl0c1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgRWRpdHNcIilcclxuXHJcbiAgICBidG5fY2FuY2VsRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmNhbmNlbEVkaXRpbmdNb2RlKVxyXG4gICAgYnRuX3NhdmVFZGl0cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuc2F2ZVByZXZHYW1lRWRpdHMpXHJcblxyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5yZXBsYWNlV2l0aChidG5fY2FuY2VsRWRpdHMpO1xyXG4gICAgYnRuX3NhdmVHYW1lLnJlcGxhY2VXaXRoKGJ0bl9zYXZlRWRpdHMpO1xyXG5cclxuICB9LFxyXG5cclxuICByZW5kZXJQcmV2R2FtZShnYW1lKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIHNhdmVkIGdhbWUgaW5mb3JtYXRpb24gaW4gdGhlIFwiRW50ZXIgR2FtZSBEYXRhXCIgY29udGFpbmVyLlxyXG4gICAgLy8gaXQgcmVsaWVzIG9uIGEgZnVuY3Rpb24gaW4gc2hvdERhdGEuanMgdG8gcmVuZGVyIHRoZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnNvbGUubG9nKGdhbWUpXHJcblxyXG4gICAgLy8gY2FsbCBmdW5jdGlvbiBpbiBzaG90RGF0YSB0aGF0IGNhbGxzIGdhbWFEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIHdpbGwgY2FwdHVyZSB0aGUgYXJyYXkgb2Ygc2F2ZWQgc2hvdHMgYW5kIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5yZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKClcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUub3ZlcnRpbWUpIHtcclxuICAgICAgc2VsX292ZXJ0aW1lLnZhbHVlID0gXCJPdmVydGltZVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfb3ZlcnRpbWUudmFsdWUgPSBcIk5vIG92ZXJ0aW1lXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBteSB0ZWFtXHJcbiAgICBjb25zdCBzZWxfdGVhbUNvbG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS50ZWFtID09PSBcIm9yYW5nZVwiKSB7XHJcbiAgICAgIHNlbF90ZWFtQ29sb3IudmFsdWUgPSBcIk9yYW5nZSB0ZWFtXCJcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbF90ZWFtQ29sb3IudmFsdWUgPSBcIkJsdWUgdGVhbVwiXHJcbiAgICB9XHJcblxyXG4gICAgLy8gbXkgc2NvcmVcclxuICAgIGNvbnN0IGlucHRfb3JhbmdlU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm9yYW5nZVNjb3JlSW5wdXRcIik7XHJcbiAgICBjb25zdCBpbnB0X2JsdWVTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmx1ZVNjb3JlSW5wdXRcIik7XHJcblxyXG4gICAgaWYgKGdhbWUudGVhbSA9PT0gXCJvcmFuZ2VcIikge1xyXG4gICAgICBpbnB0X29yYW5nZVNjb3JlLnZhbHVlID0gZ2FtZS5zY29yZTtcclxuICAgICAgaW5wdF9ibHVlU2NvcmUudmFsdWUgPSBnYW1lLm9wcF9zY29yZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlucHRfb3JhbmdlU2NvcmUudmFsdWUgPSBnYW1lLm9wcF9zY29yZTtcclxuICAgICAgaW5wdF9ibHVlU2NvcmUudmFsdWUgPSBnYW1lLnNjb3JlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGdhbWUgdHlwZSAoMXYxLCAydjIsIDN2MylcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuXHJcbiAgICBpZiAoZ2FtZS50eXBlID09PSBcIjN2M1wiKSB7XHJcbiAgICAgIGJ0bl8zdjMuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgICAvLyAydjIgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2UgaWYgKGdhbWUudHlwZSA9PT0gXCIydjJcIikge1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGJ0bl8xdjEuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtbGlua1wiKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLm1vZGUgPSBcImNvbXBldGl0aXZlXCIpIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDb21wZXRpdGl2ZVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfZ2FtZU1vZGUudmFsdWUgPSBcIkNhc3VhbFwiXHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHByb3ZpZGVTaG90c1RvU2hvdERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHByb3ZpZGVzIHRoZSBzaG90cyBmb3IgcmVuZGVyaW5nIHRvIHNob3REYXRhXHJcbiAgICByZXR1cm4gc2F2ZWRHYW1lT2JqZWN0XHJcbiAgfSxcclxuXHJcbiAgZWRpdFByZXZHYW1lKCkge1xyXG4gICAgLy8gZmV0Y2ggY29udGVudCBmcm9tIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQgdG8gYmUgcmVuZGVyZWRcclxuXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gZWRpdCBwcmV2aW91cyBnYW1lXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYCR7YWN0aXZlVXNlcklkfT9fZW1iZWQ9Z2FtZXNgKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBpZiAodXNlci5nYW1lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBhbGVydChcIk5vIGdhbWVzIGhhdmUgYmVlbiBzYXZlZCBieSB0aGlzIHVzZXJcIik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IG1heCBnYW1lIGlkICh3aGljaCBpcyB0aGUgbW9zdCByZWNlbnQgZ2FtZSBzYXZlZClcclxuICAgICAgICBjb25zdCByZWNlbnRHYW1lSWQgPSB1c2VyLmdhbWVzLnJlZHVjZSgobWF4LCBvYmopID0+IG9iai5pZCA+IG1heCA/IG9iai5pZCA6IG1heCwgdXNlci5nYW1lc1swXS5pZCk7XHJcbiAgICAgICAgLy8gZmV0Y2ggbW9zdCByZWNlbnQgZ2FtZSBhbmQgZW1iZWQgc2hvdHNcclxuICAgICAgICBBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGAke3JlY2VudEdhbWVJZH0/X2VtYmVkPXNob3RzYCkudGhlbihnYW1lT2JqID0+IHtcclxuICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJFZGl0QnV0dG9ucygpO1xyXG4gICAgICAgICAgc2F2ZWRHYW1lT2JqZWN0ID0gZ2FtZU9iajtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlclByZXZHYW1lKGdhbWVPYmopO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZURhdGEiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBnYW1lcGxheSA9IHtcclxuXHJcbiAgbG9hZEdhbWVwbGF5KCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgLy8gY29uc3QgeEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJkZWxldGVcIiB9KTtcclxuICAgIC8vIHhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQm94LCBldmVudCk7IC8vIGJ1dHRvbiB3aWxsIGRpc3BsYXk6IG5vbmUgb24gcGFyZW50IGNvbnRhaW5lclxyXG4gICAgLy8gY29uc3QgaGVhZGVySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb24gaXMtaW5mb1wiIH0sIFwiQ3JlYXRlIGFuZCBzYXZlIHNob3RzIC0gdGhlbiBzYXZlIHRoZSBnYW1lIHJlY29yZC5cIiwgeEJ1dHRvbik7XHJcbiAgICAvLyB3ZWJwYWdlLmFwcGVuZENoaWxkKGhlYWRlckluZm8pO1xyXG4gICAgdGhpcy5idWlsZFNob3RDb250ZW50KCk7XHJcbiAgICB0aGlzLmJ1aWxkR2FtZUNvbnRlbnQoKTtcclxuICAgIHRoaXMuZ2FtZXBsYXlFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBidWlsZFNob3RDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgc2hvdCBjb250YWluZXJzIGFuZCBhZGRzIGNvbnRhaW5lciBjb250ZW50XHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBzaG90VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBTaG90IERhdGFcIik7XHJcbiAgICBjb25zdCBzaG90VGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90VGl0bGUpO1xyXG5cclxuICAgIC8vIG5ldyBzaG90IGFuZCBzYXZlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3QgbmV3U2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJuZXdTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiTmV3IFNob3RcIik7XHJcbiAgICBjb25zdCBzYXZlU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgU2hvdFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbFNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIFNob3RcIik7XHJcbiAgICBjb25zdCBzaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJzaG90Q29udHJvbHNcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gYnV0dG9uc1wiIH0sIG51bGwsIG5ld1Nob3QsIHNhdmVTaG90LCBjYW5jZWxTaG90KTtcclxuICAgIGNvbnN0IGFsaWduU2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIHNob3RCdXR0b25zKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnblNob3RCdXR0b25zKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGlucHV0IGFuZCBhZXJpYWwgc2VsZWN0XHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJhbGwgc3BlZWQgKGtwaCk6XCIpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZElucHV0XCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGlucHV0XCIsIFwidHlwZVwiOlwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBiYWxsIHNwZWVkXCIgfSk7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiYWVyaWFsSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbE9wdGlvbjEsIGFlcmlhbE9wdGlvbjIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdCk7XHJcbiAgICBjb25zdCBhZXJpYWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdFBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgYmFsbFNwZWVkSW5wdXRUaXRsZSwgYmFsbFNwZWVkSW5wdXQsIGFlcmlhbENvbnRyb2wpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90RGV0YWlscyk7XHJcblxyXG4gICAgLy8gZmllbGQgYW5kIGdvYWwgaW1hZ2VzIChub3RlIGZpZWxkLWltZyBpcyBjbGlwcGVkIHRvIHJlc3RyaWN0IGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgaW4gbGF0ZXIgZnVuY3Rpb24uXHJcbiAgICAvLyBnb2FsLWltZyB1c2VzIGFuIHgveSBmb3JtdWxhIGZvciBjbGljayBhcmVhIGNvb3JkaW5hdGVzIHJlc3RyaWN0aW9uLCBzaW5jZSBpdCdzIGEgcmVjdGFuZ2xlKVxyXG4gICAgLy8gYWRkaXRpb25hbGx5LCBmaWVsZCBhbmQgZ29hbCBhcmUgbm90IGFsaWduZWQgd2l0aCBsZXZlbC1sZWZ0IG9yIGxldmVsLXJpZ2h0IC0gaXQncyBhIGRpcmVjdCBsZXZlbCAtLT4gbGV2ZWwtaXRlbSBmb3IgY2VudGVyaW5nXHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IHNob3RDb29yZGluYXRlc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBzaG90VGl0bGVDb250YWluZXIsIHNob3RCdXR0b25Db250YWluZXIsIHNob3REZXRhaWxzQ29udGFpbmVyLCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIpXHJcblxyXG4gICAgLy8gYXBwZW5kIHNob3RzIGNvbnRhaW5lciB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2FtZUNvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGNyZWF0ZXMgZ2FtZSBjb250ZW50IGNvbnRhaW5lcnMgKHRlYW0sIGdhbWUgdHlwZSwgZ2FtZSBtb2RlLCBldGMuKVxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3QgZ2FtZVRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgR2FtZSBEYXRhXCIpO1xyXG4gICAgY29uc3QgdGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVGl0bGUpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gdG9wIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIDF2MS8ydjIvM3YzIGJ1dHRvbnMgKG5vdGU6IGNvbnRyb2wgY2xhc3MgaXMgdXNlZCB3aXRoIGZpZWxkIHRvIGFkaGVyZSBidXR0b25zIHRvZ2V0aGVyKVxyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTN2M0NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlM3YzKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zZWxlY3RlZCBpcy1saW5rXCIgfSwgXCIydjJcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMnYyKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8xdjFcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjFDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTF2MSk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGhhcy1hZGRvbnNcIiB9LCBudWxsLCBnYW1lVHlwZTN2M0NvbnRyb2wsIGdhbWVUeXBlMnYyQ29udHJvbCwgZ2FtZVR5cGUxdjFDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkZpZWxkKTtcclxuXHJcbiAgICAvLyBnYW1lIG1vZGUgc2VsZWN0XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDb21wZXRpdGl2ZVwiKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZ2FtZU1vZGVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZU9wdGlvbjEsIG1vZGVPcHRpb24yKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZVNlbGVjdCk7XHJcbiAgICBjb25zdCBtb2RlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBtb2RlU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyB0ZWFtIHNlbGVjdFxyXG4gICAgY29uc3QgdGVhbU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3JhbmdlIHRlYW1cIik7XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCbHVlIHRlYW1cIik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcInRlYW1JbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbU9wdGlvbjEsIHRlYW1PcHRpb24yKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbVNlbGVjdCk7XHJcbiAgICBjb25zdCB0ZWFtQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCB0ZWFtU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyBvdmVydGltZSBzZWxlY3RcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBvdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcIm92ZXJ0aW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lT3B0aW9uMSwgb3ZlcnRpbWVPcHRpb24yKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0KTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSBib3R0b20gY29udGFpbmVyXHJcblxyXG4gICAgLy8gc2NvcmUgaW5wdXRzXHJcbiAgICAvLyAqKioqTm90ZSBpbmxpbmUgc3R5bGluZyBvZiBpbnB1dCB3aWR0aHNcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJPcmFuZ2UgdGVhbSBzY29yZTpcIik7XHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwib3JhbmdlU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBvcmFuZ2UgdGVhbSBzY29yZVwiIH0pO1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gY29udHJvbFwiIH0sIG51bGwsIG9yYW5nZVNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3QgYmx1ZVNjb3JlSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJCbHVlIHRlYW0gc2NvcmU6XCIpXHJcbiAgICBjb25zdCBibHVlU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJsdWVTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIGJsdWUgdGVhbSBzY29yZVwiIH0pO1xyXG4gICAgY29uc3QgYmx1ZVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCBibHVlU2NvcmVJbnB1dCk7XHJcbiAgICBjb25zdCBzY29yZUlucHV0Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBvcmFuZ2VTY29yZUlucHV0VGl0bGUsIG9yYW5nZVNjb3JlQ29udHJvbCwgYmx1ZVNjb3JlSW5wdXRUaXRsZSwgYmx1ZVNjb3JlQ29udHJvbCk7XHJcblxyXG4gICAgLy8gZWRpdC9zYXZlIGdhbWUgYnV0dG9uc1xyXG4gICAgY29uc3QgZWRpdFByZXZpb3VzR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJlZGl0UHJldkdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkVkaXQgUHJldmlvdXMgR2FtZVwiKTtcclxuICAgIGNvbnN0IHNhdmVHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBHYW1lXCIpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkFsaWdubWVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBzYXZlR2FtZSwgZWRpdFByZXZpb3VzR2FtZSk7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLXJpZ2h0XCIgfSwgbnVsbCwgZ2FtZUJ1dHRvbkFsaWdubWVudCk7XHJcblxyXG4gICAgLy8gYXBwZW5kIHRvIHdlYnBhZ2VcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJUb3AgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciwgbW9kZUNvbnRyb2wsIHRlYW1Db250cm9sLCBvdmVydGltZUNvbnRyb2wpO1xyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lckJvdHRvbSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNjb3JlSW5wdXRDb250YWluZXIsIGdhbWVCdXR0b25Db250YWluZXIpO1xyXG4gICAgY29uc3QgcGFyZW50R2FtZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgdGl0bGVDb250YWluZXIsIGdhbWVDb250YWluZXJUb3AsIGdhbWVDb250YWluZXJCb3R0b20pO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRHYW1lQ29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBnYW1lcGxheUV2ZW50TWFuYWdlcigpIHtcclxuXHJcbiAgICAvLyBidXR0b25zXHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlU2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZVNob3RcIik7XHJcbiAgICBjb25zdCBidG5fY2FuY2VsU2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FuY2VsU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9lZGl0UHJldkdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRQcmV2R2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlR2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcblxyXG4gICAgLy8gYWRkIGxpc3RlbmVyc1xyXG4gICAgYnRuX25ld1Nob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmNyZWF0ZU5ld1Nob3QpO1xyXG4gICAgYnRuX3NhdmVTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5zYXZlU2hvdCk7XHJcbiAgICBidG5fY2FuY2VsU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY2FuY2VsU2hvdCk7XHJcbiAgICBidG5fc2F2ZUdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnBhY2thZ2VHYW1lRGF0YSk7XHJcbiAgICBnYW1lVHlwZUJ0bnMuZm9yRWFjaChidG4gPT4gYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5nYW1lVHlwZUJ1dHRvblRvZ2dsZSkpO1xyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZWRpdFByZXZHYW1lKVxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lcGxheSIsImltcG9ydCBoZWF0bWFwIGZyb20gXCIuLi9saWIvbm9kZV9tb2R1bGVzL2hlYXRtYXAuanMvYnVpbGQvaGVhdG1hcC5qc1wiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJLmpzXCI7XHJcbmltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXIuanNcIjtcclxuXHJcbi8vIElEIG9mIHNldEludGVydmFsIGZ1bmN0aW9uIHVzZWQgdG8gbW9uaXRvciBjb250YWluZXIgd2lkdGggYW5kIHJlcGFpbnQgaGVhdG1hcCBpZiBjb250YWluZXIgd2lkdGggY2hhbmdlc1xyXG4vLyBsZXQgaW50ZXJ2YWxJZDtcclxuLy8gZ2xvYmFsIHZhcmlhYmxlIHRvIHN0b3JlIGZldGNoZWQgc2hvdHNcclxubGV0IGdsb2JhbFNob3RzQXJyO1xyXG5sZXQgam9pblRhYmxlQXJyID0gW107XHJcblxyXG4vLyBGSVhNRTogZXhhbWluZSBjb25maXJtSGVhdG1hcERlbGV0ZSBmdW5jdGlvbi4gbWF5IG5vdCBuZWVkIGZvciBsb29wLiBncmFiIElEIGZyb20gb3B0aW9uXHJcbi8vIEZJWE1FOiBhZGQgY29uZGl0aW9uIHRvIGdldFVzZXJTaG90cyB0aGF0IGNsZWFycyBleGlzdGluZyBjYW52YXMgLSBpZiB0aGVyZSBpcyBvbmVcclxuLy8gVE9ETzogc2V0IGludGVydmFsIGZvciBjb250YWluZXIgd2lkdGggbW9uaXRvcmluZ1xyXG4vLyBUT0RPOiBzY2FsZSBiYWxsIHNpemUgd2l0aCBnb2FsXHJcbi8vIFRPRE86IGFkZCBmaWx0ZXIgY29tcGF0aWJpbGl0eVxyXG4vLyBUT0RPOiBpZiBjdXN0b20gaGVhdG1hcCBpcyBzZWxlY3RlZCBmcm9tIGRyb3Bkb3duLCB0aGVuIGJsdXIgZmlsdGVyIGNvbnRhaW5lclxyXG5cclxuY29uc3QgaGVhdG1hcERhdGEgPSB7XHJcblxyXG4gIGdldFVzZXJTaG90cygpIHtcclxuICAgIC8vIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgLy8gY29uc3QgZ29hbENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcblxyXG4gICAgY29uc3QgaGVhdG1hcE5hbWUgPSBoZWF0bWFwRHJvcGRvd24udmFsdWU7XHJcbiAgICAvLyBjb25zdCBmaWVsZEhlYXRtYXBDYW52YXMgPSBmaWVsZENvbnRhaW5lci5jaGlsZE5vZGVzWzJdXHJcbiAgICAvLyBjb25zdCBnb2FsSGVhdG1hcENhbnZhcyA9IGdvYWxDb250YWluZXIuY2hpbGROb2Rlc1sxXVxyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3MgYWxyZWFkeSBhIGhlYXRtYXAgbG9hZGVkLCByZW1vdmUgaXQgYmVmb3JlIGNvbnRpbnVpbmdcclxuICAgIC8vIGlmIChmaWVsZEhlYXRtYXBDYW52YXMuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaGVhdG1hcC1jYW52YXNcIikpIHtcclxuICAgIC8vICAgZmllbGRIZWF0bWFwQ2FudmFzLnJlbW92ZSgpO1xyXG4gICAgLy8gICBnb2FsSGVhdG1hcENhbnZhcy5yZW1vdmUoKTtcclxuICAgIC8vICAgaWYgKGhlYXRtYXBOYW1lID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgLy8gICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgLy8gICB9IGVsc2Uge1xyXG4gICAgLy8gICAgIGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRIZWF0bWFwRGF0YShoZWF0bWFwTmFtZSk7XHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH0gZWxzZSB7XHJcbiAgICBpZiAoaGVhdG1hcE5hbWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVhdG1hcERhdGEuZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKGhlYXRtYXBOYW1lKTtcclxuICAgIH1cclxuICAgIC8vIH1cclxuICB9LFxyXG5cclxuICBmZXRjaEJhc2ljSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIGRhdGFiYXNlIGFuZCByZXRyaWV2ZXMgc2hvdHMgdGhhdCBtZWV0IHNwZWNpZmljIGZpbHRlcnMgKGFsbCBzaG90cyBmZXRjaGVkIGlmIClcclxuICAgIGxldCBnYW1lSWRzID0gW107XHJcbiAgICBjb25zdCBnYW1lVVJMZXh0ZW5zaW9uID0gaGVhdG1hcERhdGEuYXBwbHlHYW1lRmlsdGVycygpO1xyXG4gICAgQVBJLmdldEFsbChnYW1lVVJMZXh0ZW5zaW9uKVxyXG4gICAgICAudGhlbihnYW1lcyA9PiB7XHJcbiAgICAgICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBnYW1lSWRzO1xyXG4gICAgICB9KVxyXG4gICAgICAudGhlbihnYW1lSWRzID0+IHtcclxuICAgICAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGFsZXJ0KFwiTm8gU2hvdHMgaGF2ZSBiZWVuIHNhdmVkIHlldC4gVmlzaXQgdGhlIEdhbWVwbGF5IHBhZ2UgdG8gZ2V0IHN0YXJ0ZWQuXCIpXHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3Qgc2hvdFVSTGV4dGVuc2lvbiA9IGhlYXRtYXBEYXRhLmFwcGx5U2hvdEZpbHRlcnMoZ2FtZUlkcyk7XHJcbiAgICAgICAgICBBUEkuZ2V0QWxsKHNob3RVUkxleHRlbnNpb24pXHJcbiAgICAgICAgICAgIC50aGVuKHNob3RzID0+IHtcclxuICAgICAgICAgICAgICBnbG9iYWxTaG90c0FyciA9IHNob3RzO1xyXG4gICAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgICAvLyBpbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoaGVhdG1hcERhdGEuZ2V0QWN0aXZlT2Zmc2V0cywgNTAwKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIGZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24sIGFuZCBpdHMgY291bnRlcnBhcnQgZmV0Y2hTYXZlZFNob3RzVXNpbmdKb2luVGFibGVzIHJlbmRlciBhbiBhbHJlYWR5LXNhdmVkIGhlYXRtYXAgdGhvdWdoIHRoZXNlIHN0ZXBzOlxyXG4gICAgLy8gMS4gZ2V0dGluZyB0aGUgaGVhdG1hcCBuYW1lIGZyb20gdGhlIGRyb3Bkb3duIHZhbHVlXHJcbiAgICAvLyAyLiB1c2luZyB0aGUgbmFtZSB0byBmaW5kIHRoZSBjaGlsZE5vZGVzIGluZGV4IG9mIHRoZSBkcm9wZG93biB2YWx1ZSAoaS5lLiB3aGljaCBIVE1MIDxvcHRpb24+KSBhbmQgZ2V0IGl0cyBJRFxyXG4gICAgLy8gMy4gZmV0Y2ggYWxsIHNob3RfaGVhdG1hcCBqb2luIHRhYmxlcyB3aXRoIG1hdGNoaW5nIGhlYXRtYXAgSURcclxuICAgIC8vIDQuIGZldGNoIHNob3RzIHVzaW5nIHNob3QgSURzIGZyb20gam9pbiB0YWJsZXNcclxuICAgIC8vIDUuIHJlbmRlciBoZWF0bWFwIGJ5IGNhbGxpbmcgYnVpbGQgZnVuY3Rpb25zXHJcblxyXG4gICAgLy8gc3RlcCAxOiBnZXQgbmFtZSBvZiBoZWF0bWFwXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuICAgIC8vIHN0ZXAgMjogdXNlIG5hbWUgdG8gZ2V0IGhlYXRtYXAgSUQgc3RvcmVkIGluIEhUTUwgb3B0aW9uIGVsZW1lbnRcclxuICAgIGxldCBjdXJyZW50SGVhdG1hcElkO1xyXG4gICAgaGVhdG1hcERyb3Bkb3duLmNoaWxkTm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICAgIGlmIChjaGlsZC50ZXh0Q29udGVudCA9PT0gY3VycmVudERyb3Bkb3duVmFsdWUpIHtcclxuICAgICAgICBjdXJyZW50SGVhdG1hcElkID0gY2hpbGQuaWQuc2xpY2UoOCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gc3RlcCAzOiBmZXRjaCBqb2luIHRhYmxlc1xyXG4gICAgQVBJLmdldEFsbChgc2hvdF9oZWF0bWFwP2hlYXRtYXBJZD0ke2N1cnJlbnRIZWF0bWFwSWR9YClcclxuICAgICAgLnRoZW4oam9pblRhYmxlcyA9PiBoZWF0bWFwRGF0YS5mZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMoam9pblRhYmxlcylcclxuICAgICAgICAvLyBzdGVwIDU6IHBhc3Mgc2hvdHMgdG8gYnVpbGRGaWVsZEhlYXRtYXAoKSBhbmQgYnVpbGRHb2FsSGVhdG1hcCgpXHJcbiAgICAgICAgLnRoZW4oc2hvdHMgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coc2hvdHMpO1xyXG4gICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRGaWVsZEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgaGVhdG1hcERhdGEuYnVpbGRHb2FsSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgKVxyXG4gIH0sXHJcblxyXG4gIGZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyhqb2luVGFibGVzKSB7XHJcbiAgICAvLyBzZWUgbm90ZXMgb24gZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKClcclxuICAgIGpvaW5UYWJsZXMuZm9yRWFjaCh0YWJsZSA9PiB7XHJcbiAgICAgIC8vIHN0ZXAgNC4gdGhlbiBmZXRjaCB1c2luZyBlYWNoIHNob3RJZCBpbiB0aGUgam9pbiB0YWJsZXNcclxuICAgICAgam9pblRhYmxlQXJyLnB1c2goQVBJLmdldFNpbmdsZUl0ZW0oXCJzaG90c1wiLCB0YWJsZS5zaG90SWQpKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChqb2luVGFibGVBcnIpXHJcbiAgfSxcclxuXHJcbiAgYXBwbHlHYW1lRmlsdGVycygpIHsgLy8gVE9ETzogYWRkIG1vcmUgZmlsdGVyc1xyXG4gICAgbGV0IFVSTCA9IFwiZ2FtZXNcIlxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIFVSTCArPSBgP3VzZXJJZD0ke2FjdGl2ZVVzZXJJZH1gXHJcbiAgICByZXR1cm4gVVJMXHJcbiAgfSxcclxuXHJcbiAgYXBwbHlTaG90RmlsdGVycyhnYW1lSWRzKSB7XHJcbiAgICBsZXQgVVJMID0gXCJzaG90c1wiXHJcbiAgICAvLyBmb3IgZWFjaCBnYW1lSWQsIGFwcGVuZCBVUkwuIEFwcGVuZCAmIGluc3RlYWQgb2YgPyBvbmNlIGZpcnN0IGdhbWVJZCBpcyBhZGRlZCB0byBVUkxcclxuICAgIGlmIChnYW1lSWRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgbGV0IGdhbWVJZENvdW50ID0gMDtcclxuICAgICAgZ2FtZUlkcy5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgICBpZiAoZ2FtZUlkQ291bnQgPCAxKSB7XHJcbiAgICAgICAgICBVUkwgKz0gYD9nYW1lSWQ9JHtpZH1gXHJcbiAgICAgICAgICBnYW1lSWRDb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBVUkwgKz0gYCZnYW1lSWQ9JHtpZH1gXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSAvL1RPRE86IGVsc2UgZG8gbm90IGNvbnRpbnVlIChubyBnYW1lcyB3ZXJlIGZvdW5kKVxyXG4gICAgcmV0dXJuIFVSTDtcclxuICB9LFxyXG5cclxuICBidWlsZEZpZWxkSGVhdG1hcChzaG90cykge1xyXG4gICAgY29uc29sZS5sb2coXCJBcnJheSBvZiBmZXRjaGVkIHNob3RzXCIsIHNob3RzKVxyXG5cclxuICAgIC8vIGNyZWF0ZSBmaWVsZCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBsZXQgdmFyV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB2YXJIZWlnaHQgPSBmaWVsZENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgbGV0IGZpZWxkQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0RmllbGRDb25maWcoZmllbGRDb250YWluZXIpO1xyXG5cclxuICAgIGxldCBGaWVsZEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIEZpZWxkSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZmllbGRDb25maWcpO1xyXG5cclxuICAgIGxldCBmaWVsZERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZmllbGRYICogdmFyV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZmllbGRZICogdmFySGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIGxldCBmaWVsZE9iaiA9IHsgeDogeF8sIHk6IHlfLCB2YWx1ZTogdmFsdWVfIH07XHJcbiAgICAgIGZpZWxkRGF0YVBvaW50cy5wdXNoKGZpZWxkT2JqKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGZpZWxkRGF0YSA9IHtcclxuICAgICAgbWF4OiAxLFxyXG4gICAgICBtaW46IDAsXHJcbiAgICAgIGRhdGE6IGZpZWxkRGF0YVBvaW50c1xyXG4gICAgfVxyXG5cclxuICAgIEZpZWxkSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZmllbGREYXRhKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdvYWxIZWF0bWFwKHNob3RzKSB7XHJcbiAgICAvLyBjcmVhdGUgZ29hbCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZ29hbENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgbGV0IHZhckdvYWxXaWR0aCA9IGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgdmFyR29hbEhlaWdodCA9IGdvYWxDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIGxldCBnb2FsQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKTtcclxuXHJcbiAgICBsZXQgR29hbEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIEdvYWxIZWF0bWFwSW5zdGFuY2UgPSBoZWF0bWFwLmNyZWF0ZShnb2FsQ29uZmlnKTtcclxuXHJcbiAgICBsZXQgZ29hbERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZ29hbFggKiB2YXJHb2FsV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZ29hbFkgKiB2YXJHb2FsSGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIGxldCBnb2FsT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZ29hbERhdGFQb2ludHMucHVzaChnb2FsT2JqKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGdvYWxEYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZ29hbERhdGFQb2ludHNcclxuICAgIH1cclxuXHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZ29hbERhdGEpO1xyXG4gIH0sXHJcblxyXG4gIGdldEZpZWxkQ29uZmlnKGZpZWxkQ29udGFpbmVyKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGZpZWxkQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IDI1LFxyXG4gICAgICBtYXhPcGFjaXR5OiAuNSxcclxuICAgICAgbWluT3BhY2l0eTogMCxcclxuICAgICAgYmx1cjogLjc1XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGdldEdvYWxDb25maWcoZ29hbENvbnRhaW5lcikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgY29udGFpbmVyOiBnb2FsQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IDM1LFxyXG4gICAgICBtYXhPcGFjaXR5OiAuNSxcclxuICAgICAgbWluT3BhY2l0eTogMCxcclxuICAgICAgYmx1cjogLjc1XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIC8qZ2V0QWN0aXZlT2Zmc2V0cygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZXZhbHVhdGVzIHRoZSB3aWR0aCBvZiB0aGUgaGVhdG1hcCBjb250YWluZXIgYXQgMC41IHNlY29uZCBpbnRlcnZhbHMuIElmIHRoZSB3aWR0aCBoYXMgY2hhbmdlZCxcclxuICAgIC8vIHRoZW4gdGhlIGhlYXRtYXAgY2FudmFzIGlzIHJlcGFpbnRlZCB0byBmaXQgd2l0aGluIHRoZSBjb250YWluZXIgbGltaXRzXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IGNhcHR1cmVXaWR0aCA9IGZpZWxkQ29udGFpbmVyLm9mZnNldFdpZHRoXHJcbiAgICAvL2V2YWx1YXRlIGNvbnRhaW5lciB3aWR0aCBhZnRlciAwLjUgc2Vjb25kcyB2cyBpbml0aWFsIGNvbnRhaW5lciB3aWR0aFxyXG4gICAgaWYgKGNhcHR1cmVXaWR0aCA9PT0gdmFyV2lkdGgpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJ1bmNoYW5nZWRcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXJXaWR0aCA9IGNhcHR1cmVXaWR0aFxyXG4gICAgICBjb25zb2xlLmxvZyhcIm5ldyB3aWR0aFwiLCB2YXJXaWR0aCk7XHJcbiAgICAgIC8vY2xlYXIgaGVhdG1hcFxyXG4gICAgICBmaWVsZENvbnRhaW5lci5yZW1vdmVDaGlsZChmaWVsZENvbnRhaW5lci5jaGlsZE5vZGVzWzBdKTtcclxuICAgICAgLy9idWlsZCBoZWF0bWFwIGFnYWluXHJcbiAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkSGVhdG1hcCgpO1xyXG4gICAgfVxyXG4gIH0sKi9cclxuXHJcbiAgc2F2ZUhlYXRtYXAoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBzYXZpbmcgYSBoZWF0bWFwIG9iamVjdCB3aXRoIGEgbmFtZSBhbmQgdXNlcklkLCB0aGVuIG1ha2luZyBqb2luIHRhYmxlcyB3aXRoXHJcbiAgICAvLyBUT0RPOiByZXF1aXJlIHVuaXF1ZSBoZWF0bWFwIG5hbWUgKG1heSBub3QgbmVlZCB0byBkbyB0aGlzIGlmIGZ1bmN0aW9uIGJlbG93IHVzZXMgSUQgaW5zdGVhZCBvZiBuYW1lKVxyXG4gICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWF0bWFwRHJvcGRvd25cIik7XHJcbiAgICBjb25zdCBzYXZlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVIZWF0bWFwSW5wdXRcIik7XHJcbiAgICBjb25zdCBoZWF0bWFwVGl0bGUgPSBzYXZlSW5wdXQudmFsdWU7XHJcblxyXG4gICAgaWYgKGhlYXRtYXBUaXRsZS5sZW5ndGggPiAwICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJTYXZlIHN1Y2Nlc3NmdWwhXCIpIHsgLy9UT0RPOiBhZGQgcmVxdWlyZW1lbnQgZm9yIGEgaGVhdG1hcCB0byBiZSBsb2FkZWQgYXQgdGhlIHRpbWUgc2F2ZSBpcyBjbGlja2VkXHJcbiAgICAgIGNvbnNvbGUubG9nKFwic2F2aW5nIGhlYXRtYXAuLi5cIik7XHJcbiAgICAgIHNhdmVJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtZGFuZ2VyXCIpO1xyXG4gICAgICBoZWF0bWFwRGF0YS5zYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUpXHJcbiAgICAgICAgLnRoZW4oaGVhdG1hcE9iaiA9PiBoZWF0bWFwRGF0YS5zYXZlSm9pblRhYmxlcyhoZWF0bWFwT2JqKS50aGVuKHggPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJqb2luIHRhYmxlcyBzYXZlZFwiLCB4KVxyXG4gICAgICAgICAgLy8gZW1wdHkgdGhlIHRlbXBvcmFyeSBnbG9iYWwgYXJyYXkgdXNlZCB3aXRoIFByb21pc2UuYWxsXHJcbiAgICAgICAgICBqb2luVGFibGVBcnIgPSBbXVxyXG4gICAgICAgICAgLy8gYXBwZW5kIG5ld2x5IGNyZWF0ZWQgaGVhdG1hcCBhcyBvcHRpb24gZWxlbWVudCBpbiBzZWxlY3QgZHJvcGRvd25cclxuICAgICAgICAgIGhlYXRtYXBEcm9wZG93bi5hcHBlbmRDaGlsZChlbEJ1aWxkZXIoXCJvcHRpb25cIiwgeyBcImlkXCI6IGBoZWF0bWFwLSR7aGVhdG1hcE9iai5pZH1gIH0sIGhlYXRtYXBPYmoubmFtZSkpO1xyXG4gICAgICAgICAgLy8gaGVhdG1hcERyb3Bkb3duLnZhbHVlID0gaGVhdG1hcFRpdGxlIFRPRE86IGFwcGVuZCBjaGlsZCB0byBzZWxlY3QgZHJvcGRvd24gd2l0aCBuZXcgaGVhdG1hcCBuYW1lXHJcbiAgICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIlNhdmUgc3VjY2Vzc2Z1bCFcIjtcclxuICAgICAgICB9KSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gc2F2ZXMgYSBoZWF0bWFwIG9iamVjdCB3aXRoIHRoZSB1c2VyLXByb3ZpZGVkIG5hbWUgYW5kIHRoZSB1c2VySWRcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuICAgIGNvbnN0IGhlYXRtYXBPYmogPSB7XHJcbiAgICAgIG5hbWU6IGhlYXRtYXBUaXRsZSxcclxuICAgICAgdXNlcklkOiBhY3RpdmVVc2VySWRcclxuICAgIH1cclxuICAgIHJldHVybiBBUEkucG9zdEl0ZW0oXCJoZWF0bWFwc1wiLCBoZWF0bWFwT2JqKVxyXG4gIH0sXHJcblxyXG4gIHNhdmVKb2luVGFibGVzKGhlYXRtYXBPYmopIHtcclxuICAgIGNvbnNvbGUubG9nKFwiZ2xvYmFsc2hvdHNhcnJheVwiLCBnbG9iYWxTaG90c0FycilcclxuICAgIGdsb2JhbFNob3RzQXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCBqb2luVGFibGVPYmogPSB7XHJcbiAgICAgICAgc2hvdElkOiBzaG90LmlkLFxyXG4gICAgICAgIGhlYXRtYXBJZDogaGVhdG1hcE9iai5pZFxyXG4gICAgICB9XHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RfaGVhdG1hcFwiLCBqb2luVGFibGVPYmopKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW5UYWJsZUFycilcclxuICB9LFxyXG5cclxuICBkZWxldGVIZWF0bWFwKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB0aGUgbG9naWMgdGhhdCBwcmV2ZW50cyB0aGUgdXNlciBmcm9tIGRlbGV0aW5nIGEgaGVhdG1hcCBpbiBvbmUgY2xpY2suXHJcbiAgICAvLyBhIHNlY29uZCBkZWxldGUgYnV0dG9uIGFuZCBhIGNhbmNlbCBidXR0b24gYXJlIHJlbmRlcmVkIGJlZm9yZSBhIGRlbGV0ZSBpcyBjb25maXJtZWRcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG5cclxuICAgIGlmIChjdXJyZW50RHJvcGRvd25WYWx1ZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgICBjb25zdCBjb25maXJtRGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNvbmZpcm0gRGVsZXRlXCIpO1xyXG4gICAgICBjb25zdCByZWplY3REZWxldGVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkNhbmNlbFwiKTtcclxuICAgICAgY29uc3QgRGVsZXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJkZWxldGVDb250cm9sXCIsIFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgY29uZmlybURlbGV0ZUJ0biwgcmVqZWN0RGVsZXRlQnRuKTtcclxuICAgICAgZGVsZXRlSGVhdG1hcEJ0bi5yZXBsYWNlV2l0aChEZWxldGVDb250cm9sKTtcclxuICAgICAgY29uZmlybURlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuY29uZmlybUhlYXRtYXBEZWxldGlvbik7XHJcbiAgICAgIHJlamVjdERlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVqZWN0SGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZS1yZW5kZXJzIHRoZSBwcmltYXJ5IGRlbGV0ZSBidXR0b25cclxuICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUNvbnRyb2xcIik7XHJcbiAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImRlbGV0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkRlbGV0ZSBIZWF0bWFwXCIpXHJcbiAgICBEZWxldGVDb250cm9sLnJlcGxhY2VXaXRoKGRlbGV0ZUhlYXRtYXBCdG4pXHJcbiAgICBkZWxldGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwKTtcclxuICB9LFxyXG5cclxuICBjb25maXJtSGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB3aWxsIGRlbGV0ZSB0aGUgc2VsZWN0ZWQgaGVhdG1hcCBvcHRpb24gaW4gdGhlIGRyb3Bkb3duIGxpc3QgYW5kIHJlbW92ZSBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkgeyAvL1RPRE86IGNoZWNrIHRoaXMgbG9naWMuIG1heSBiZSBhYmxlIHRvIHVzZSBJRCBpbnN0ZWFkIG9mIHJlcXVpcmluZyB1bmlxdWUgbmFtZVxyXG4gICAgICAgIGNoaWxkLnJlbW92ZSgpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXBPYmplY3RhbmRKb2luVGFibGVzKGNoaWxkLmlkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24udmFsdWUgPSBcIkJhc2ljIEhlYXRtYXBcIjtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcE9iamVjdGFuZEpvaW5UYWJsZXMoaGVhdG1hcElkKSB7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgcmV0dXJuIEFQSS5kZWxldGVJdGVtKFwiaGVhdG1hcHNcIiwgYCR7aGVhdG1hcElkLnNsaWNlKDgpfT91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBoZWF0bWFwRGF0YSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgaGVhdG1hcERhdGEgZnJvbSBcIi4vaGVhdG1hcERhdGFcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGhlYXRtYXBzID0ge1xyXG5cclxuICBsb2FkSGVhdG1hcENvbnRhaW5lcnMoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB0aGlzLmJ1aWxkRmlsdGVycygpO1xyXG4gICAgLy8gYnVpbGRzIGJ1dHRvbiB0byBnZW5lcmF0ZSBoZWF0bWFwLCBzYXZlIGhlYXRtYXAsIGFuZCB2aWV3IHNhdmVkIGhlYXRtYXBzXHJcbiAgICAvLyB0aGUgYWN0aW9uIGlzIGFzeW5jIGJlY2F1c2UgdGhlIHVzZXIncyBzYXZlZCBoZWF0bWFwcyBoYXZlIHRvIGJlIHJlbmRlcmVkIGFzIEhUTUwgb3B0aW9uIGVsZW1lbnRzXHJcbiAgICB0aGlzLmJ1aWxkR2VuZXJhdG9yKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWx0ZXJzKCkge1xyXG5cclxuICAgIC8vIHJlc2V0IGJ1dHRvblxyXG4gICAgY29uc3QgcmVzZXRCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiUmVzZXQgRmlsdGVyc1wiKTtcclxuXHJcbiAgICAvLyBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZUJ0blRleHQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHt9LCBcIkRhdGUgUmFuZ2VcIik7XHJcbiAgICBjb25zdCBkYXRlQnRuSWNvbiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWNhbGVuZGFyXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBkYXRlQnRuSWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtc21hbGxcIiB9LCBudWxsLCBkYXRlQnRuSWNvbik7XHJcbiAgICBjb25zdCBkYXRlQnRuID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtb3V0bGluZWQgaXMtZGFya1wiIH0sIG51bGwsIGRhdGVCdG5JY29uU3BhbiwgZGF0ZUJ0blRleHQpO1xyXG4gICAgY29uc3QgZGF0ZUJ0blBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZGF0ZUJ0bik7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGNvbnN0IGljb242ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtY2xvY2tcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjYpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBzZWw2X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJZZXNcIik7XHJcbiAgICBjb25zdCBzZWw2X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJOb1wiKTtcclxuICAgIGNvbnN0IHNlbGVjdDYgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwge30sIG51bGwsIHNlbDZfb3AxLCBzZWw2X29wMiwgc2VsNl9vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2NiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDYsIGljb25TcGFuNik7XHJcbiAgICBjb25zdCBjb250cm9sNiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Nik7XHJcblxyXG4gICAgLy8gcmVzdWx0XHJcbiAgICBjb25zdCBpY29uNSA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLXRyb3BoeVwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW41ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNSk7XHJcbiAgICBjb25zdCBzZWw1X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJSZXN1bHRcIik7XHJcbiAgICBjb25zdCBzZWw1X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJWaWN0b3J5XCIpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiRGVmZWF0XCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsNV9vcDEsIHNlbDVfb3AyLCBzZWw1X29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NSwgaWNvblNwYW41KTtcclxuICAgIGNvbnN0IGNvbnRyb2w1ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY1KTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGVcclxuICAgIGNvbnN0IGljb240ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtc2l0ZW1hcFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW40ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNCk7XHJcbiAgICBjb25zdCBzZWw0X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJHYW1lIFR5cGVcIik7XHJcbiAgICBjb25zdCBzZWw0X29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBzZWw0X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIydjJcIik7XHJcbiAgICBjb25zdCBzZWw0X29wNCA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCIxdjFcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWw0X29wMSwgc2VsNF9vcDIsIHNlbDRfb3AzLCBzZWw0X29wNCk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NCwgaWNvblNwYW40KTtcclxuICAgIGNvbnN0IGNvbnRyb2w0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY0KTtcclxuXHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGNvbnN0IGljb24zID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZ2FtZXBhZFwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uMyk7XHJcbiAgICBjb25zdCBzZWwzX29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJHYW1lIE1vZGVcIik7XHJcbiAgICBjb25zdCBzZWwzX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDb21wZXRpdGl2ZVwiKTtcclxuICAgIGNvbnN0IHNlbDNfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNhc3VhbFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDMgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwge30sIG51bGwsIHNlbDNfb3AxLCBzZWwzX29wMiwgc2VsM19vcDMpO1xyXG4gICAgY29uc3Qgc2VsZWN0RGl2MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3QgaXMtZGFya1wiIH0sIG51bGwsIHNlbGVjdDMsIGljb25TcGFuMyk7XHJcbiAgICBjb25zdCBjb250cm9sMyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGhhcy1pY29ucy1sZWZ0XCIgfSwgbnVsbCwgc2VsZWN0RGl2Myk7XHJcblxyXG4gICAgLy8gdGVhbVxyXG4gICAgY29uc3QgaWNvbjIgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1oYW5kc2hha2VcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjIpO1xyXG4gICAgY29uc3Qgc2VsMl9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiVGVhbVwiKTtcclxuICAgIGNvbnN0IHNlbDJfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9yYW5nZVwiKTtcclxuICAgIGNvbnN0IHNlbDJfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJsdWVcIik7XHJcbiAgICBjb25zdCBzZWxlY3QyID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWwyX29wMSwgc2VsMl9vcDIsIHNlbDJfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QyLCBpY29uU3BhbjIpO1xyXG4gICAgY29uc3QgY29udHJvbDIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjIpO1xyXG5cclxuICAgIC8vIHNob3QgdHlwZVxyXG4gICAgY29uc3QgaWNvbjEgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1mdXRib2xcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjEpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU2hvdCBUeXBlXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQWVyaWFsXCIpO1xyXG4gICAgY29uc3Qgc2VsMV9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU3RhbmRhcmRcIik7XHJcbiAgICBjb25zdCBzZWxlY3QxID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWwxX29wMSwgc2VsMV9vcDIsIHNlbDFfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QxLCBpY29uU3BhbjEpO1xyXG4gICAgY29uc3QgY29udHJvbDEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjEpO1xyXG5cclxuICAgIGNvbnN0IGZpbHRlckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGNvbnRyb2wxLCBjb250cm9sMiwgY29udHJvbDMsIGNvbnRyb2w0LCBjb250cm9sNSwgY29udHJvbDYsIGRhdGVCdG5QYXJlbnQsIHJlc2V0QnRuKTtcclxuICAgIGNvbnN0IFBhcmVudEZpbHRlckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZmlsdGVyRmllbGQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCBmaWx0ZXIgY29udGFpbmVyIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50RmlsdGVyQ29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdlbmVyYXRvcigpIHtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcblxyXG4gICAgLy8gdXNlIGZldGNoIHRvIGFwcGVuZCBvcHRpb25zIHRvIHNlbGVjdCBlbGVtZW50IGlmIHVzZXIgYXQgbGVhc3QgMSBzYXZlZCBoZWF0bWFwXHJcbiAgICBBUEkuZ2V0QWxsKGBoZWF0bWFwcz91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQXJyYXkgb2YgdXNlcidzIHNhdmVkIGhlYXRtYXBzOlwiLCBoZWF0bWFwcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1maXJlXCIgfSwgbnVsbCk7XHJcbiAgICAgICAgY29uc3QgaWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24pO1xyXG4gICAgICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJhc2ljIEhlYXRtYXBcIik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImhlYXRtYXBEcm9wZG93blwiIH0sIG51bGwsIHNlbDFfb3AxKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwU2VsZWN0RGl2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgaGVhdG1hcERyb3Bkb3duLCBpY29uU3Bhbik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIGhlYXRtYXBTZWxlY3REaXYpO1xyXG5cclxuICAgICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOlwiZGVsZXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRGVsZXRlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBkZWxldGVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkZWxldGVIZWF0bWFwQnRuKVxyXG4gICAgICAgIGNvbnN0IHNhdmVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBzYXZlQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgc2F2ZUJ0bilcclxuICAgICAgICBjb25zdCBzYXZlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzYXZlSGVhdG1hcElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJOYW1lIGFuZCBzYXZlIHRoaXMgaGVhdG1hcFwiLCBcIm1heGxlbmd0aFwiOiBcIjMwXCIgfSwgbnVsbClcclxuICAgICAgICBjb25zdCBzYXZlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGlzLWV4cGFuZGVkXCIgfSwgbnVsbCwgc2F2ZUlucHV0KVxyXG5cclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZ2VuZXJhdGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiR2VuZXJhdGUgSGVhdG1hcFwiKTtcclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnZW5lcmF0b3JCdXR0b24pO1xyXG5cclxuICAgICAgICAvLyBpZiBubyBoZWF0bWFwcyBhcmUgc2F2ZWQsIGdlbmVyYXRlIG5vIGV4dHJhIG9wdGlvbnMgaW4gZHJvcGRvd25cclxuICAgICAgICBpZiAoaGVhdG1hcHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGVsc2UsIGZvciBlYWNoIGhlYXRtYXAgc2F2ZWQsIG1ha2UgYSBuZXcgb3B0aW9uIGFuZCBhcHBlbmQgaXQgdG8gdGhlXHJcbiAgICAgICAgICBoZWF0bWFwcy5mb3JFYWNoKGhlYXRtYXAgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24uYXBwZW5kQ2hpbGQoZWxCdWlsZGVyKFwib3B0aW9uXCIsIHtcImlkXCI6YGhlYXRtYXAtJHtoZWF0bWFwLmlkfWB9LCBoZWF0bWFwLm5hbWUpKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1aWxkRmllbGRhbmRHb2FsKCk7XHJcbiAgICAgICAgdGhpcy5oZWF0bWFwRXZlbnRNYW5hZ2VyKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICB9LFxyXG5cclxuICBidWlsZEZpZWxkYW5kR29hbCgpIHtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgaGVhdG1hcEltYWdlQ29udGFpbmVycyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBoZWF0bWFwSW1hZ2VDb250YWluZXJzKVxyXG5cclxuICAgIC8vIGFwcGVuZCBmaWVsZCBhbmQgZ29hbCB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGhlYXRtYXBFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBnZW5lcmF0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdlbmVyYXRlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IHNhdmVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUhlYXRtYXBCdG5cIik7XHJcblxyXG4gICAgZ2VuZXJhdGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5nZXRVc2VyU2hvdHMpO1xyXG4gICAgc2F2ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwKTtcclxuICAgIGRlbGV0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXApO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGhlYXRtYXBzIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuaW1wb3J0IG5hdmJhciBmcm9tIFwiLi9uYXZiYXJcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGxvZ2luT3JTaWdudXAgPSB7XHJcblxyXG4gIC8vIGJ1aWxkIGEgbG9naW4gZm9ybSB0aGF0IHZhbGlkYXRlcyB1c2VyIGlucHV0LiBTdWNjZXNzZnVsIGxvZ2luIHN0b3JlcyB1c2VyIGlkIGluIHNlc3Npb24gc3RvcmFnZVxyXG4gIGxvZ2luRm9ybSgpIHtcclxuICAgIGNvbnN0IGxvZ2luSW5wdXRfdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ1c2VybmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciB1c2VybmFtZVwiIH0pO1xyXG4gICAgY29uc3QgbG9naW5JbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInBhc3N3b3JkXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBwYXNzd29yZFwiIH0pO1xyXG4gICAgY29uc3QgbG9naW5CdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwibG9naW5Ob3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpbiBub3dcIik7XHJcbiAgICBjb25zdCBsb2dpbkZvcm0gPSBlbEJ1aWxkZXIoXCJmb3JtXCIsIHsgXCJpZFwiOiBcImxvZ2luRm9ybVwiLCBcImNsYXNzXCI6IFwiYm94XCIgfSwgbnVsbCwgbG9naW5JbnB1dF91c2VybmFtZSwgbG9naW5JbnB1dF9wYXNzd29yZCwgbG9naW5CdXR0b24pO1xyXG5cclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQobG9naW5Gb3JtKVxyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKClcclxuICB9LFxyXG5cclxuICBzaWdudXBGb3JtKCkge1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfbmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgbmFtZVwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ1c2VybmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciB1c2VybmFtZVwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfcGFzc3dvcmQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwYXNzd29yZElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBwYXNzd29yZFwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfY29uZmlybSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImNvbmZpcm1QYXNzd29yZFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiY29uZmlybSBwYXNzd29yZFwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNpZ251cE5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXAgbm93XCIpO1xyXG4gICAgY29uc3Qgc2lnbnVwRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwic2lnbnVwRm9ybVwiLCBcImNsYXNzXCI6IFwiYm94XCIgfSwgbnVsbCwgc2lnbnVwSW5wdXRfbmFtZSwgc2lnbnVwSW5wdXRfdXNlcm5hbWUsIHNpZ251cElucHV0X3Bhc3N3b3JkLCBzaWdudXBJbnB1dF9jb25maXJtLCBzaWdudXBCdXR0b24pO1xyXG5cclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoc2lnbnVwRm9ybSlcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpXHJcbiAgfSxcclxuXHJcbiAgLy8gYXNzaWduIGV2ZW50IGxpc3RlbmVycyBiYXNlZCBvbiB3aGljaCBmb3JtIGlzIG9uIHRoZSB3ZWJwYWdlXHJcbiAgdXNlckV2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGxvZ2luTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2dpbk5vd1wiKVxyXG4gICAgY29uc3Qgc2lnbnVwTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaWdudXBOb3dcIilcclxuICAgIGlmIChsb2dpbk5vdyA9PT0gbnVsbCkge1xyXG4gICAgICBzaWdudXBOb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2lnbnVwVXNlciwgZXZlbnQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2dpbk5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpblVzZXIsIGV2ZW50KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIHZhbGlkYXRlIHVzZXIgbG9naW4gZm9ybSBpbnB1dHMgYmVmb3JlIGxvZ2dpbmcgaW5cclxuICBsb2dpblVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc3QgdXNlcm5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IHBhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBpZiAodXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKHBhc3N3b3JkID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChcInVzZXJzXCIpLnRoZW4odXNlcnMgPT4gdXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcclxuICAgICAgICAvLyB2YWxpZGF0ZSB1c2VybmFtZSBhbmQgcGFzc3dvcmRcclxuICAgICAgICBpZiAodXNlci51c2VybmFtZS50b0xvd2VyQ2FzZSgpID09PSB1c2VybmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICBpZiAodXNlci5wYXNzd29yZCA9PT0gcGFzc3dvcmQpIHtcclxuICAgICAgICAgICAgbG9naW5PclNpZ251cC5sb2dpblN0YXR1c0FjdGl2ZSh1c2VyKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzaWdudXBVc2VyKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICBjb25zdCBfbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfdXNlcm5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF9wYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFzc3dvcmRJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgY29uZmlybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29uZmlybVBhc3N3b3JkXCIpLnZhbHVlXHJcbiAgICBsZXQgdW5pcXVlVXNlcm5hbWUgPSB0cnVlOyAvL2NoYW5nZXMgdG8gZmFsc2UgaWYgdXNlcm5hbWUgYWxyZWFkeSBleGlzdHNcclxuICAgIGlmIChfbmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3VzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKGNvbmZpcm0gPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCAhPT0gY29uZmlybSkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5nZXRBbGwoXCJ1c2Vyc1wiKS50aGVuKHVzZXJzID0+IHVzZXJzLmZvckVhY2goKHVzZXIsIGlkeCkgPT4ge1xyXG4gICAgICAgIC8vIGNoZWNrIGZvciBleGlzdGluZyB1c2VybmFtZSBpbiBkYXRhYmFzZVxyXG4gICAgICAgIGlmICh1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IF91c2VybmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICB1bmlxdWVVc2VybmFtZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2F0IHRoZSBlbmQgb2YgdGhlIGxvb3AsIHBvc3RcclxuICAgICAgICBpZiAoaWR4ID09PSB1c2Vycy5sZW5ndGggLSAxICYmIHVuaXF1ZVVzZXJuYW1lKSB7XHJcbiAgICAgICAgICBsZXQgbmV3VXNlciA9IHtcclxuICAgICAgICAgICAgbmFtZTogX25hbWUsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiBfdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBfcGFzc3dvcmQsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgQVBJLnBvc3RJdGVtKFwidXNlcnNcIiwgbmV3VXNlcikudGhlbih1c2VyID0+IHtcclxuICAgICAgICAgICAgbG9naW5PclNpZ251cC5sb2dpblN0YXR1c0FjdGl2ZSh1c2VyKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oXCJhY3RpdmVVc2VySWRcIiwgdXNlci5pZCk7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSk7IC8vYnVpbGQgbG9nZ2VkIGluIHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0VXNlcigpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoZmFsc2UpOyAvL2J1aWxkIGxvZ2dlZCBvdXQgdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsb2dpbk9yU2lnbnVwIiwiaW1wb3J0IG5hdmJhciBmcm9tIFwiLi9uYXZiYXJcIlxyXG4vLyBpbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIlxyXG5pbXBvcnQgaGVhdG1hcHMgZnJvbSBcIi4vaGVhdG1hcHNcIjtcclxuXHJcbi8vIGZ1bmN0aW9uIGNsb3NlQm94KGUpIHtcclxuLy8gICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiZGVsZXRlXCIpKSB7XHJcbi8vICAgICBlLnRhcmdldC5wYXJlbnROb2RlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuLy8gICB9XHJcbi8vIH1cclxuXHJcbi8vIG5hdmJhci5nZW5lcmF0ZU5hdmJhcigpXHJcbm5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKVxyXG5oZWF0bWFwcy5sb2FkSGVhdG1hcENvbnRhaW5lcnMoKTsiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGxvZ2luT3JTaWdudXAgZnJvbSBcIi4vbG9naW5cIlxyXG5pbXBvcnQgcHJvZmlsZSBmcm9tIFwiLi9wcm9maWxlXCJcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuaW1wb3J0IGhlYXRtYXBzIGZyb20gXCIuL2hlYXRtYXBzXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2VOYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdi1tYXN0ZXJcIik7XHJcblxyXG4vKlxyXG4gIEJ1bG1hIG5hdmJhciBzdHJ1Y3R1cmU6XHJcbiAgPG5hdj5cclxuICAgIDxuYXZiYXItYnJhbmQ+XHJcbiAgICAgIDxuYXZiYXItYnVyZ2VyPiAob3B0aW9uYWwpXHJcbiAgICA8L25hdmJhci1icmFuZD5cclxuICAgIDxuYXZiYXItbWVudT5cclxuICAgICAgPG5hdmJhci1zdGFydD5cclxuICAgICAgPC9uYXZiYXItc3RhcnQ+XHJcbiAgICAgIDxuYXZiYXItZW5kPlxyXG4gICAgICA8L25hdmJhci1lbmQ+XHJcbiAgICA8L25hdmJhci1tZW51PlxyXG4gIDwvbmF2PlxyXG5cclxuICBUaGUgZnVuY3Rpb25zIGJlbG93IGJ1aWxkIHRoZSBuYXZiYXIgZnJvbSB0aGUgaW5zaWRlIG91dFxyXG4qL1xyXG5cclxuY29uc3QgbmF2YmFyID0ge1xyXG5cclxuICBnZW5lcmF0ZU5hdmJhcihsb2dnZWRJbkJvb2xlYW4pIHtcclxuXHJcbiAgICAvLyBuYXZiYXItbWVudSAocmlnaHQgc2lkZSBvZiBuYXZiYXIgLSBhcHBlYXJzIG9uIGRlc2t0b3AgMTAyNHB4KylcclxuICAgIGNvbnN0IGJ1dHRvbjIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpblwiKVxyXG4gICAgY29uc3QgYnV0dG9uMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXBcIilcclxuICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgYnV0dG9uMSwgYnV0dG9uMilcclxuICAgIGNvbnN0IG1lbnVJdGVtMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIG51bGwsIGJ1dHRvbkNvbnRhaW5lcilcclxuICAgIGNvbnN0IG5hdmJhckVuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItZW5kXCIgfSwgbnVsbCwgbWVudUl0ZW0xKVxyXG4gICAgY29uc3QgbmF2YmFyU3RhcnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLXN0YXJ0XCIgfSlcclxuICAgIGNvbnN0IG5hdmJhck1lbnUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibmF2YmFyTWVudVwiLCBcImNsYXNzXCI6IFwibmF2YmFyLW1lbnVcIiB9LCBudWxsLCBuYXZiYXJTdGFydCwgbmF2YmFyRW5kKVxyXG5cclxuICAgIC8vIG5hdmJhci1icmFuZCAobGVmdCBzaWRlIG9mIG5hdmJhciAtIGluY2x1ZGVzIG1vYmlsZSBoYW1idXJnZXIgbWVudSlcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQyID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwicm9sZVwiOiBcImJ1dHRvblwiLCBcImNsYXNzXCI6IFwibmF2YmFyLWJ1cmdlciBidXJnZXJcIiwgXCJhcmlhLWxhYmVsXCI6IFwibWVudVwiLCBcImFyaWEtZXhwYW5kZWRcIjogXCJmYWxzZVwiLCBcImRhdGEtdGFyZ2V0XCI6IFwibmF2YmFyTWVudVwiIH0sIG51bGwsIGJ1cmdlck1lbnVTcGFuMSwgYnVyZ2VyTWVudVNwYW4yLCBidXJnZXJNZW51U3BhbjMpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIsIFwiaHJlZlwiOiBcIiNcIiB9LCBudWxsLCBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9maXJlOTBkZWcucG5nXCIsIFwid2lkdGhcIjogXCIxMTJcIiwgXCJoZWlnaHRcIjogXCIyOFwiIH0pKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1icmFuZFwiIH0sIG51bGwsIG5hdmJhckJyYW5kQ2hpbGQxLCBuYXZiYXJCcmFuZENoaWxkMik7XHJcblxyXG4gICAgLy8gbmF2IChwYXJlbnQgbmF2IEhUTUwgZWxlbWVudClcclxuICAgIGNvbnN0IG5hdiA9IGVsQnVpbGRlcihcIm5hdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXJcIiwgXCJyb2xlXCI6IFwibmF2aWdhdGlvblwiLCBcImFyaWEtbGFiZWxcIjogXCJtYWluIG5hdmlnYXRpb25cIiB9LCBudWxsLCBuYXZiYXJCcmFuZCwgbmF2YmFyTWVudSk7XHJcblxyXG4gICAgLy8gaWYgbG9nZ2VkIGluLCBhcHBlbmQgYWRkaXRpb25hbCBtZW51IG9wdGlvbnMgdG8gbmF2YmFyIGFuZCByZW1vdmUgc2lnbnVwL2xvZ2luIGJ1dHRvbnNcclxuICAgIGlmIChsb2dnZWRJbkJvb2xlYW4pIHtcclxuICAgICAgLy8gcmVtb3ZlIGxvZyBpbiBhbmQgc2lnbiB1cCBidXR0b25zXHJcbiAgICAgIGNvbnN0IHNpZ251cCA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdO1xyXG4gICAgICBjb25zdCBsb2dpbiA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzFdO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQoc2lnbnVwKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvZ2luKTtcclxuICAgICAgLy8gYWRkIGxvZ291dCBidXR0b25cclxuICAgICAgY29uc3QgYnV0dG9uMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ291dFwiKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbjMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgbmV3IG1lbnUgaXRlbXMgZm9yIHVzZXJcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIlByb2ZpbGVcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJHYW1lcGxheVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkhlYXRtYXBzXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW00ID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiTGVhZGVyYm9hcmRcIik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0yKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMyk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gbmF2YmFyXHJcbiAgICB0aGlzLm5hdmJhckV2ZW50TWFuYWdlcihuYXYpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlTmF2LmFwcGVuZENoaWxkKG5hdik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpbkNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9nb3V0Q2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByb2ZpbGVDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZ2FtZXBsYXlDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGVhdG1hcHNDbGlja2VkLCBldmVudCk7XHJcbiAgfSxcclxuXHJcbiAgbG9naW5DbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dpblwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9naW5Gb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAuc2lnbnVwRm9ybSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ291dENsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ291dFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9nb3V0VXNlcigpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHByb2ZpbGVDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJQcm9maWxlXCIpIHtcclxuICAgICAgcHJvZmlsZS5sb2FkUHJvZmlsZSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiR2FtZXBsYXlcIikge1xyXG4gICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgaGVhdG1hcHNDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJIZWF0bWFwc1wiKSB7XHJcbiAgICAgIGhlYXRtYXBzLmxvYWRIZWF0bWFwQ29udGFpbmVycygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5hdmJhciIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgcHJvZmlsZSA9IHtcclxuXHJcbiAgbG9hZFByb2ZpbGUoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJ1c2Vyc1wiLCBhY3RpdmVVc2VySWQpLnRoZW4odXNlciA9PiB7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGVQaWMgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9vY3RhbmUuanBnXCIsIFwiY2xhc3NcIjogXCJcIiB9KVxyXG4gICAgICBjb25zdCBuYW1lID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvblwiIH0sIGBOYW1lOiAke3VzZXIubmFtZX1gKVxyXG4gICAgICBjb25zdCB1c2VybmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb25cIiB9LCBgVXNlcm5hbWU6ICR7dXNlci51c2VybmFtZX1gKVxyXG4gICAgICBjb25zdCBwbGF5ZXJQcm9maWxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcInBsYXllclByb2ZpbGVcIiwgXCJjbGFzc1wiOiBcImNvbnRhaW5lclwiIH0sIG51bGwsIHByb2ZpbGVQaWMsIG5hbWUsIHVzZXJuYW1lKVxyXG4gICAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBsYXllclByb2ZpbGUpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHByb2ZpbGUiLCJjbGFzcyBzaG90T25Hb2FsIHtcclxuICBzZXQgZmllbGRYKGZpZWxkWCkge1xyXG4gICAgdGhpcy5fZmllbGRYID0gZmllbGRYXHJcbiAgfVxyXG4gIHNldCBmaWVsZFkoZmllbGRZKSB7XHJcbiAgICB0aGlzLl9maWVsZFkgPSBmaWVsZFlcclxuICB9XHJcbiAgc2V0IGdvYWxYKGdvYWxYKSB7XHJcbiAgICB0aGlzLl9nb2FsWCA9IGdvYWxYXHJcbiAgfVxyXG4gIHNldCBnb2FsWShnb2FsWSkge1xyXG4gICAgdGhpcy5fZ29hbFkgPSBnb2FsWVxyXG4gIH1cclxuICBzZXQgYWVyaWFsKGFlcmlhbEJvb2xlYW4pIHtcclxuICAgIHRoaXMuX2FlcmlhbCA9IGFlcmlhbEJvb2xlYW5cclxuICB9XHJcbiAgc2V0IGJhbGxTcGVlZChiYWxsU3BlZWQpIHtcclxuICAgIHRoaXMuYmFsbF9zcGVlZCA9IGJhbGxTcGVlZFxyXG4gIH1cclxuICBzZXQgdGltZVN0YW1wKGRhdGVPYmopIHtcclxuICAgIHRoaXMuX3RpbWVTdGFtcCA9IGRhdGVPYmpcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3RPbkdvYWwiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3RPbkdvYWwgZnJvbSBcIi4vc2hvdENsYXNzXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCI7XHJcblxyXG5sZXQgc2hvdENvdW50ZXIgPSAwO1xyXG5sZXQgZWRpdGluZ1Nob3QgPSBmYWxzZTsgLy9lZGl0aW5nIHNob3QgaXMgdXNlZCBmb3IgYm90aCBuZXcgYW5kIG9sZCBzaG90c1xyXG5sZXQgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxubGV0IHNob3RBcnJheSA9IFtdOyAvLyByZXNldCB3aGVuIGdhbWUgaXMgc2F2ZWRcclxuLy8gZ2xvYmFsIHZhcnMgdXNlZCB3aXRoIHNob3QgZWRpdGluZ1xyXG5sZXQgcHJldmlvdXNTaG90T2JqO1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRYO1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRZO1xyXG5sZXQgcHJldmlvdXNTaG90R29hbFg7XHJcbmxldCBwcmV2aW91c1Nob3RHb2FsWTtcclxuLy8gZ2xvYmFsIHZhciB1c2VkIHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lICh0byBkZXRlcm1pbmUgaWYgbmV3IHNob3RzIHdlcmUgYWRkZWQgZm9yIFBPU1QpXHJcbmxldCBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXk7XHJcblxyXG5jb25zdCBzaG90RGF0YSA9IHtcclxuXHJcbiAgcmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiBnYW1lcGxheSBpcyBjbGlja2VkIG9uIHRoZSBuYXZiYXIgYW5kIHdoZW4gYSBnYW1lIGlzIHNhdmVkLCBpbiBvcmRlciB0byBwcmV2ZW50IGJ1Z3Mgd2l0aCBwcmV2aW91c2x5IGNyZWF0ZWQgc2hvdHNcclxuICAgIHNob3RDb3VudGVyID0gMDtcclxuICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgc2hvdEFycmF5ID0gW107XHJcbiAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gdW5kZWZpbmVkO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZU5ld1Nob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuICAgIHNob3RPYmogPSBuZXcgc2hvdE9uR29hbDtcclxuICAgIHNob3RPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IHVzZXIgZnJvbSBzZWxlY3RpbmcgYW55IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKHRydWUpO1xyXG5cclxuICAgIGVkaXRpbmdTaG90ID0gdHJ1ZTtcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG5cclxuICAgIC8vIGFjdGl2YXRlIGNsaWNrIGZ1bmN0aW9uYWxpdHkgYW5kIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgb24gYm90aCBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICB9LFxyXG5cclxuICBnZXRDbGlja0Nvb3JkcyhlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdldHMgdGhlIHJlbGF0aXZlIHggYW5kIHkgb2YgdGhlIGNsaWNrIHdpdGhpbiB0aGUgZmllbGQgaW1hZ2UgY29udGFpbmVyXHJcbiAgICAvLyBhbmQgdGhlbiBjYWxscyB0aGUgZnVuY3Rpb24gdGhhdCBhcHBlbmRzIGEgbWFya2VyIG9uIHRoZSBwYWdlXHJcbiAgICBsZXQgcGFyZW50Q29udGFpbmVyO1xyXG4gICAgaWYgKGUudGFyZ2V0LmlkID09PSBcImZpZWxkLWltZ1wiKSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgfVxyXG4gICAgLy8gb2Zmc2V0WCBhbmQgWSBhcmUgdGhlIHggYW5kIHkgY29vcmRpbmF0ZXMgKHBpeGVscykgb2YgdGhlIGNsaWNrIGluIHRoZSBjb250YWluZXJcclxuICAgIC8vIHRoZSBleHByZXNzaW9ucyBkaXZpZGUgdGhlIGNsaWNrIHggYW5kIHkgYnkgdGhlIHBhcmVudCBmdWxsIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgIGNvbnN0IHhDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFggLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpXHJcbiAgICBjb25zdCB5Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRZIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkudG9GaXhlZCgzKSk7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHhDb29yZFJlbGF0aXZlLCB5Q29vcmRSZWxhdGl2ZSwgcGFyZW50Q29udGFpbmVyKVxyXG4gIH0sXHJcblxyXG4gIG1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKSB7XHJcbiAgICBsZXQgbWFya2VySWQ7XHJcbiAgICBpZiAocGFyZW50Q29udGFpbmVyLmlkID09PSBcImZpZWxkLWltZy1wYXJlbnRcIikge1xyXG4gICAgICBtYXJrZXJJZCA9IFwic2hvdC1tYXJrZXItZmllbGRcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1nb2FsXCI7XHJcbiAgICB9XHJcbiAgICAvLyBhZGp1c3QgZm9yIDUwJSBvZiB3aWR0aCBhbmQgaGVpZ2h0IG9mIG1hcmtlciBzbyBpdCdzIGNlbnRlcmVkIGFib3V0IG1vdXNlIHBvaW50ZXJcclxuICAgIGxldCBhZGp1c3RNYXJrZXJYID0gMTIuNSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCBhZGp1c3RNYXJrZXJZID0gMTIuNSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBOT1QgYWxyZWFkeSBhIG1hcmtlciwgdGhlbiBtYWtlIG9uZSBhbmQgcGxhY2UgaXRcclxuICAgIGlmICghcGFyZW50Q29udGFpbmVyLmNvbnRhaW5zKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1hcmtlcklkKSkpIHtcclxuICAgICAgdGhpcy5nZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KTtcclxuICAgICAgLy8gZWxzZSBtb3ZlIHRoZSBleGlzdGluZyBtYXJrZXIgdG8gdGhlIG5ldyBwb3NpdGlvblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5tb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKTtcclxuICAgIH1cclxuICAgIC8vIHNhdmUgY29vcmRpbmF0ZXMgdG8gb2JqZWN0XHJcbiAgICB0aGlzLmFkZENvb3Jkc1RvQ2xhc3MobWFya2VySWQsIHgsIHkpXHJcbiAgfSxcclxuXHJcbiAgZ2VuZXJhdGVNYXJrZXIocGFyZW50Q29udGFpbmVyLCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZLCBtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIGRpdi5pZCA9IG1hcmtlcklkO1xyXG4gICAgZGl2LnN0eWxlLndpZHRoID0gXCIyNXB4XCI7XHJcbiAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gXCIyNXB4XCI7XHJcbiAgICBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJsaWdodGdyZWVuXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyID0gXCIxcHggc29saWQgYmxhY2tcIjtcclxuICAgIGRpdi5zdHlsZS5ib3JkZXJSYWRpdXMgPSBcIjUwJVwiO1xyXG4gICAgZGl2LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgZGl2LnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBkaXYuc3R5bGUudG9wID0gKHkgLSBhZGp1c3RNYXJrZXJZKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgcGFyZW50Q29udGFpbmVyLmFwcGVuZENoaWxkKGRpdik7XHJcbiAgfSxcclxuXHJcbiAgbW92ZU1hcmtlcihtYXJrZXJJZCwgeCwgeSwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSkge1xyXG4gICAgY29uc3QgY3VycmVudE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1hcmtlcklkKTtcclxuICAgIGN1cnJlbnRNYXJrZXIuc3R5bGUubGVmdCA9ICh4IC0gYWRqdXN0TWFya2VyWCkgKiAxMDAgKyBcIiVcIjtcclxuICAgIGN1cnJlbnRNYXJrZXIuc3R5bGUudG9wID0gKHkgLSBhZGp1c3RNYXJrZXJZKSAqIDEwMCArIFwiJVwiO1xyXG4gIH0sXHJcblxyXG4gIGFkZENvb3Jkc1RvQ2xhc3MobWFya2VySWQsIHgsIHkpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdXBkYXRlcyB0aGUgaW5zdGFuY2Ugb2Ygc2hvdE9uR29hbCBjbGFzcyB0byByZWNvcmQgY2xpY2sgY29vcmRpbmF0ZXNcclxuICAgIC8vIGlmIGEgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gYXBwZW5kIHRoZSBjb29yZGluYXRlcyB0byB0aGUgb2JqZWN0IGluIHF1ZXN0aW9uXHJcbiAgICBpZiAocHJldmlvdXNTaG90T2JqICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWYgKG1hcmtlcklkID09PSBcInNob3QtbWFya2VyLWZpZWxkXCIpIHtcclxuICAgICAgICAvLyB1c2UgZ2xvYmFsIHZhcnMgaW5zdGVhZCBvZiB1cGRhdGluZyBvYmplY3QgZGlyZWN0bHkgaGVyZSB0byBwcmV2ZW50IGFjY2lkZW50YWwgZWRpdGluZyBvZiBtYXJrZXIgd2l0aG91dCBjbGlja2luZyBcInNhdmUgc2hvdFwiXHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRYID0geDtcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB5O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0geDtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gb3RoZXJ3aXNlLCBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQsIHNvIGFwcGVuZCBjb29yZGluYXRlcyB0byB0aGUgbmV3IG9iamVjdFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKG1hcmtlcklkID09PSBcInNob3QtbWFya2VyLWZpZWxkXCIpIHtcclxuICAgICAgICBzaG90T2JqLmZpZWxkWCA9IHg7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFkgPSB5O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNob3RPYmouZ29hbFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZ29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGZpZWxkTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1maWVsZFwiKTtcclxuICAgIGNvbnN0IGdvYWxNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWdvYWxcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gbnVsbDtcclxuICAgICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICAgICAgLy8gaWYgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBjYW5jZWwgdGhlIG5ldyBpbnN0YW5jZSBvZiBzaG90Q2xhc3NcclxuICAgICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWRcclxuICAgICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyByZW1vdmUgbWFya2VycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgIGlmIChmaWVsZE1hcmtlciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGZpZWxkSW1nUGFyZW50LnJlbW92ZUNoaWxkKGZpZWxkTWFya2VyKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZ29hbE1hcmtlciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGdvYWxJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZ29hbE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gcmVtb3ZlIGNsaWNrIGxpc3RlbmVycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgIGZpZWxkSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIGdvYWxJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgLy8gYWxsb3cgdXNlciB0byBzZWxlY3QgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNhdmVTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuICAgIGNvbnN0IGZpZWxkTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1maWVsZFwiKTtcclxuICAgIGNvbnN0IGdvYWxNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWdvYWxcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuXHJcbiAgICBpZiAoIWVkaXRpbmdTaG90KSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgLy8gY2xlYXIgZmllbGQgYW5kIGdvYWwgZXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgIGZpZWxkSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIGdvYWxJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIGdvYWxJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZ29hbE1hcmtlcik7XHJcbiAgICAgIC8vIGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBzYXZlIGNvcnJlY3Qgb2JqZWN0IChpLmUuIHNob3QgYmVpbmcgZWRpdGVkIHZzLiBuZXcgc2hvdClcclxuICAgICAgLy8gaWYgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gcHJldmlvdXNTaG90T2JqIHdpbGwgbm90IGJlIHVuZGVmaW5lZFxyXG4gICAgICBpZiAocHJldmlvdXNTaG90T2JqICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoc2VsX2FlcmlhbC52YWx1ZSA9PT0gXCJBZXJpYWxcIikgeyBwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9IHRydWUgfSBlbHNlIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSBmYWxzZSB9O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5iYWxsX3NwZWVkID0gaW5wdF9iYWxsU3BlZWQudmFsdWU7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9maWVsZFggPSBwcmV2aW91c1Nob3RGaWVsZFg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9maWVsZFkgPSBwcmV2aW91c1Nob3RGaWVsZFk7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9nb2FsWCA9IHByZXZpb3VzU2hvdEdvYWxYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFkgPSBwcmV2aW91c1Nob3RHb2FsWTtcclxuICAgICAgICAvLyBlbHNlIHNhdmUgdG8gbmV3IGluc3RhbmNlIG9mIGNsYXNzIGFuZCBhcHBlbmQgYnV0dG9uIHRvIHBhZ2Ugd2l0aCBjb3JyZWN0IElEIGZvciBlZGl0aW5nXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgc2hvdE9iai5hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHNob3RPYmouYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICBzaG90T2JqLmJhbGxTcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgIHNob3RBcnJheS5wdXNoKHNob3RPYmopO1xyXG4gICAgICAgIC8vIGFwcGVuZCBuZXcgYnV0dG9uXHJcbiAgICAgICAgc2hvdENvdW50ZXIrKztcclxuICAgICAgICBjb25zdCBuZXdTaG90QnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBgc2hvdC0ke3Nob3RDb3VudGVyfWAsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtbGlua1wiIH0sIGBTaG90ICR7c2hvdENvdW50ZXJ9YCk7XHJcbiAgICAgICAgc2hvdEJ0bkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdTaG90QnRuKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke3Nob3RDb3VudGVyfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5yZW5kZXJTYXZlZFNob3QpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vVE9ETzogYWRkIGNvbmRpdGlvbiB0byBwcmV2ZW50IGJsYW5rIGVudHJpZXMgYW5kIG1pc3NpbmcgY29vcmRpbmF0ZXNcclxuXHJcbiAgICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gbnVsbDtcclxuICAgICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICAgICAgLy8gY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzIChtYXR0ZXJzIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZClcclxuICAgICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZCAobWF0dGVycyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQpXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gYWxsb3cgdXNlciB0byBzZWxlY3QgYW55IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICByZW5kZXJTYXZlZFNob3QoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZWZlcmVuY2VzIHRoZSBzaG90QXJyYXkgdG8gZ2V0IGEgc2hvdCBvYmplY3QgdGhhdCBtYXRjaGVzIHRoZSBzaG90IyBidXR0b24gY2xpY2tlZCAoZS5nLiBzaG90IDIgYnV0dG9uID0gaW5kZXggMSBvZiB0aGUgc2hvdEFycmF5KVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIChhbmQgaXRzIGFzc29jaWF0ZWQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBpbiBvdGhlciBsb2NhbCBmdW5jdGlvbnMpIGhhcyB0aGVzZSBiYXNpYyByZXF1aXJlbWVudHM6XHJcbiAgICAvLyByZS1pbml0aWFsaXplIGNsaWNrIGxpc3RlbmVycyBvbiBpbWFnZXNcclxuICAgIC8vIHJldml2ZSBhIHNhdmVkIGluc3RhbmNlIG9mIHNob3RDbGFzcyBmb3IgZWRpdGluZyBzaG90IGNvb3JkaW5hdGVzLCBiYWxsIHNwZWVkLCBhbmQgYWVyaWFsXHJcbiAgICAvLyByZW5kZXIgbWFya2VycyBmb3IgZXhpc3RpbmcgY29vcmRpbmF0ZXMgb24gZmllbGQgYW5kIGdvYWwgaW1hZ2VzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIHNhdmUgZWRpdHNcclxuICAgIC8vIGFmZm9yZGFuY2UgdG8gY2FuY2VsIGVkaXRzXHJcbiAgICAvLyB0aGUgZGF0YSBpcyByZW5kZXJlZCBvbiB0aGUgcGFnZSBhbmQgY2FuIGJlIHNhdmVkIChvdmVyd3JpdHRlbikgYnkgdXNpbmcgdGhlIFwic2F2ZSBzaG90XCIgYnV0dG9uIG9yIGNhbmNlbGVkIGJ5IGNsaWNraW5nIHRoZSBcImNhbmNlbCBzaG90XCIgYnV0dG9uXHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIC8vIHByZXZlbnQgbmV3IHNob3QgYnV0dG9uIGZyb20gYmVpbmcgY2xpY2tlZFxyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgLy8gYWxsb3cgY2FuY2VsIGFuZCBzYXZlZCBidXR0b25zIHRvIGJlIGNsaWNrZWRcclxuICAgIGVkaXRpbmdTaG90ID0gdHJ1ZTtcclxuICAgIC8vIGdldCBJRCBvZiBzaG90IyBidG4gY2xpY2tlZCBhbmQgYWNjZXNzIHNob3RBcnJheSBhdCBbYnRuSUQgLSAxXVxyXG4gICAgbGV0IGJ0bklkID0gZS50YXJnZXQuaWQuc2xpY2UoNSk7XHJcbiAgICBwcmV2aW91c1Nob3RPYmogPSBzaG90QXJyYXlbYnRuSWQgLSAxXTtcclxuICAgIC8vIHJlbmRlciBiYWxsIHNwZWVkIGFuZCBhZXJpYWwgZHJvcGRvd24gZm9yIHRoZSBzaG90XHJcbiAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IHByZXZpb3VzU2hvdE9iai5iYWxsX3NwZWVkO1xyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID09PSB0cnVlKSB7IHNlbF9hZXJpYWwudmFsdWUgPSBcIkFlcmlhbFwiOyB9IGVsc2UgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiOyB9XHJcbiAgICAvLyBhZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGZpZWxkIGFuZCBnb2FsXHJcbiAgICBmaWVsZEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgLy8gcmVuZGVyIHNob3QgbWFya2VyIG9uIGZpZWxkXHJcbiAgICBsZXQgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpXHJcbiAgICBsZXQgeCA9IChwcmV2aW91c1Nob3RPYmouX2ZpZWxkWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgeSA9IChwcmV2aW91c1Nob3RPYmouX2ZpZWxkWSAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuICAgIC8vIHJlbmRlciBnb2FsIG1hcmtlciBvbiBmaWVsZFxyXG4gICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIilcclxuICAgIHggPSBOdW1iZXIoKChwcmV2aW91c1Nob3RPYmouX2dvYWxYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSk7XHJcbiAgICB5ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWSAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkudG9GaXhlZCgzKSk7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcblxyXG4gIH0sXHJcblxyXG4gIGRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZGlzYWJsZU9yTm90KSB7XHJcbiAgICAvLyBmb3IgZWFjaCBidXR0b24gYWZ0ZXIgXCJOZXcgU2hvdFwiLCBcIlNhdmUgU2hvdFwiLCBhbmQgXCJDYW5jZWwgU2hvdFwiIGRpc2FibGUgdGhlIGJ1dHRvbnMgaWYgdGhlIHVzZXIgaXMgY3JlYXRpbmcgYSBuZXcgc2hvdCAoZGlzYWJsZU9yTm90ID0gdHJ1ZSkgb3IgZW5hYmxlIHRoZW0gb24gc2F2ZS9jYW5jZWwgb2YgYSBuZXcgc2hvdCAoZGlzYWJsZU9yTm90ID0gZmFsc2UpXHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcbiAgICBsZXQgZWRpdEJ0bjtcclxuICAgIGxldCBsZW5ndGggPSBzaG90QnRuQ29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoO1xyXG4gICAgZm9yIChsZXQgaSA9IDM7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICBlZGl0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpIC0gMn1gKTtcclxuICAgICAgZWRpdEJ0bi5kaXNhYmxlZCA9IGRpc2FibGVPck5vdDtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKSB7XHJcbiAgICAvLyBwcm92aWRlcyBhcnJheSBmb3IgdXNlIGluIGdhbWVEYXRhLmpzICh3aGVuIHNhdmluZyBhIG5ldyBnYW1lLCBub3Qgd2hlbiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUpXHJcbiAgICByZXR1cm4gc2hvdEFycmF5O1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxOdW1PZlNob3RzKCkge1xyXG4gICAgLy8gcHJvdmlkZXMgaW5pdGlhbCBudW1iZXIgb2Ygc2hvdHMgdGhhdCB3ZXJlIHNhdmVkIHRvIGRhdGFiYXNlIHRvIGdhbWVEYXRhLmpzIHRvIGlkZW50aWZ5IGFuIGVkaXRlZCBnYW1lIGlzIGJlaW5nIHNhdmVkXHJcbiAgICByZXR1cm4gaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlclNob3RzQnV0dG9uc0Zyb21QcmV2aW91c0dhbWUoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlcXVlc3RzIHRoZSBhcnJheSBvZiBzaG90cyBmcm9tIHRoZSBwcmV2aW91cyBzYXZlZCBnYW1lLCBzZXRzIGl0IGFzIHNob3RBcnJheSwgYW5kIHJlbmRlcnMgc2hvdCBidXR0b25zXHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcbiAgICAvLyBnZXQgc2F2ZWQgZ2FtZSB3aXRoIHNob3RzIGVtYmVkZGVkIGFzIGFycmF5XHJcbiAgICBsZXQgc2F2ZWRHYW1lT2JqID0gZ2FtZURhdGEucHJvdmlkZVNob3RzVG9TaG90RGF0YSgpO1xyXG4gICAgLy8gY3JlYXRlIHNob3RBcnJheSB3aXRoIGZvcm1hdCByZXF1aXJlZCBieSBsb2NhbCBmdW5jdGlvbnNcclxuICAgIGxldCBzYXZlZFNob3RPYmpcclxuICAgIHNhdmVkR2FtZU9iai5zaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBzYXZlZFNob3RPYmogPSBuZXcgc2hvdE9uR29hbFxyXG4gICAgICBzYXZlZFNob3RPYmouZmllbGRYID0gc2hvdC5maWVsZFg7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5maWVsZFkgPSBzaG90LmZpZWxkWTtcclxuICAgICAgc2F2ZWRTaG90T2JqLmdvYWxYID0gc2hvdC5nb2FsWDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmdvYWxZID0gc2hvdC5nb2FsWTtcclxuICAgICAgc2F2ZWRTaG90T2JqLmFlcmlhbCA9IHNob3QuYWVyaWFsO1xyXG4gICAgICBzYXZlZFNob3RPYmouYmFsbF9zcGVlZCA9IHNob3QuYmFsbF9zcGVlZC50b1N0cmluZygpO1xyXG4gICAgICBzYXZlZFNob3RPYmoudGltZVN0YW1wID0gc2hvdC50aW1lU3RhbXBcclxuICAgICAgc2F2ZWRTaG90T2JqLmlkID0gc2hvdC5pZFxyXG4gICAgICBzaG90QXJyYXkucHVzaChzYXZlZFNob3RPYmopO1xyXG4gICAgfSlcclxuXHJcbiAgICBjb25zb2xlLmxvZyhzaG90QXJyYXkpO1xyXG4gICAgc2hvdEFycmF5LmZvckVhY2goKHNob3QsIGlkeCkgPT4ge1xyXG4gICAgICBjb25zdCBuZXdTaG90QnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBgc2hvdC0ke2lkeCArIDF9YCwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1saW5rXCIgfSwgYFNob3QgJHtpZHggKyAxfWApO1xyXG4gICAgICBzaG90QnRuQ29udGFpbmVyLmFwcGVuZENoaWxkKG5ld1Nob3RCdG4pO1xyXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke2lkeCArIDF9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnJlbmRlclNhdmVkU2hvdCk7XHJcbiAgICB9KTtcclxuICAgIHNob3RDb3VudGVyID0gc2hvdEFycmF5Lmxlbmd0aDtcclxuICAgIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheSA9IHNob3RBcnJheS5sZW5ndGg7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2hvdERhdGEiXX0=
