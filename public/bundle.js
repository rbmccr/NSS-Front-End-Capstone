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
// TODO: set interval for container width monitoring
// TODO: add filter compatibility
// TODO: if custom heatmap is selected from dropdown, then blur filter container

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
    let gameIds = [];
    const gameResultFilter = document.getElementById("filter-gameResult").value;
    const gameURLextension = heatmapData.applyGameFilters();

    _API.default.getAll(gameURLextension).then(games => {
      games.forEach(game => {
        // game result filter cannot be applied in gameURLextension, so it is applied here
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
      });
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
            heatmapData.buildGoalHeatmap(shots); // intervalId = setInterval(heatmapData.getActiveOffsets, 500);
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
      console.log(shots);
      heatmapData.buildFieldHeatmap(shots);
      heatmapData.buildGoalHeatmap(shots);
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
    // TODO: add more filters
    // NOTE: game result filter (victory/defeat) cannot be applied in this function and is applied after the fetch
    const activeUserId = sessionStorage.getItem("activeUserId");
    const gameModeFilter = document.getElementById("filter-gameMode").value;
    let URL = "games";
    URL += `?userId=${activeUserId}`; // game mode

    if (gameModeFilter === "Competitive") {
      URL += "&mode=competitive";
    } else if (gameModeFilter === "Casual") {
      URL += "&mode=casual";
    }

    return URL;
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
    // Ideal radius is about 25px at 550px width, or 4.545%
    return {
      container: fieldContainer,
      radius: 0.045454545 * fieldContainer.offsetWidth,
      maxOpacity: .5,
      minOpacity: 0,
      blur: .75
    };
  },

  getGoalConfig(goalContainer) {
    // Ideal radius is about 35px at 550px width, or 6.363%
    return {
      container: goalContainer,
      radius: .063636363 * goalContainer.offsetWidth,
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
    const fieldContainer = document.getElementById("field-img-parent");
    const heatmapTitle = saveInput.value;
    const fieldHeatmapCanvas = fieldContainer.childNodes[2]; // heatmap must have a title, the title cannot be "Save successful!", and there must be a heatmap loaded on the page

    if (heatmapTitle.length > 0 && heatmapTitle !== "Save successful!" && fieldHeatmapCanvas !== undefined) {
      console.log("saving heatmap...");
      saveInput.classList.remove("is-danger");
      heatmapData.saveHeatmapObject(heatmapTitle).then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(x => {
        console.log("join tables saved", x); // empty the temporary global array used with Promise.all

        joinTableArr = []; // append newly created heatmap as option element in select dropdown

        heatmapDropdown.appendChild((0, _elementBuilder.default)("option", {
          "id": `heatmap-${heatmapObj.id}`
        }, heatmapObj.name));
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
      "id": "resetFiltersBtn",
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
    const select3 = (0, _elementBuilder.default)("select", {
      "id": "filter-gameMode"
    }, null, sel3_op1, sel3_op2, sel3_op3);
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
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    generateHeatmapBtn.addEventListener("click", _heatmapData.default.getUserShots);
    saveHeatmapBtn.addEventListener("click", _heatmapData.default.saveHeatmap);
    deleteHeatmapBtn.addEventListener("click", _heatmapData.default.deleteHeatmap);
    const gameModeFilter = document.getElementById("filter-gameMode");
    const shotTypeFilter = document.getElementById("filter-shotType");
    const gameResultFilter = document.getElementById("filter-gameResult");
    resetFiltersBtn.addEventListener("click", () => {
      gameModeFilter.value = "Game Mode";
      shotTypeFilter.value = "Shot Type";
      gameResultFilter.value = "Result";
    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaGVhdG1hcC5qcy9idWlsZC9oZWF0bWFwLmpzIiwiLi4vc2NyaXB0cy9BUEkuanMiLCIuLi9zY3JpcHRzL2VsZW1lbnRCdWlsZGVyLmpzIiwiLi4vc2NyaXB0cy9nYW1lRGF0YS5qcyIsIi4uL3NjcmlwdHMvZ2FtZXBsYXkuanMiLCIuLi9zY3JpcHRzL2hlYXRtYXBEYXRhLmpzIiwiLi4vc2NyaXB0cy9oZWF0bWFwcy5qcyIsIi4uL3NjcmlwdHMvbG9naW4uanMiLCIuLi9zY3JpcHRzL21haW4uanMiLCIuLi9zY3JpcHRzL25hdmJhci5qcyIsIi4uL3NjcmlwdHMvcHJvZmlsZS5qcyIsIi4uL3NjcmlwdHMvc2hvdENsYXNzLmpzIiwiLi4vc2NyaXB0cy9zaG90RGF0YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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RTtBQUNELEtBSkQ7QUFLQSxJQUFBLFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBeEI7QUFDQSxJQUFBLHdCQUF3QixHQUFHLFNBQVMsQ0FBQyxNQUFyQztBQUNEOztBQXRUYyxDQUFqQjtlQTBUZSxRIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypcbiAqIGhlYXRtYXAuanMgdjIuMC41IHwgSmF2YVNjcmlwdCBIZWF0bWFwIExpYnJhcnlcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOC0yMDE2IFBhdHJpY2sgV2llZCA8aGVhdG1hcGpzQHBhdHJpY2std2llZC5hdD4gLSBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogRHVhbCBsaWNlbnNlZCB1bmRlciBNSVQgYW5kIEJlZXJ3YXJlIGxpY2Vuc2UgXG4gKlxuICogOjogMjAxNi0wOS0wNSAwMToxNlxuICovXG47KGZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBmYWN0b3J5KSB7XG5cbiAgLy8gU3VwcG9ydHMgVU1ELiBBTUQsIENvbW1vbkpTL05vZGUuanMgYW5kIGJyb3dzZXIgY29udGV4dFxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRleHRbbmFtZV0gPSBmYWN0b3J5KCk7XG4gIH1cblxufSkoXCJoMzM3XCIsIHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuLy8gSGVhdG1hcCBDb25maWcgc3RvcmVzIGRlZmF1bHQgdmFsdWVzIGFuZCB3aWxsIGJlIG1lcmdlZCB3aXRoIGluc3RhbmNlIGNvbmZpZ1xudmFyIEhlYXRtYXBDb25maWcgPSB7XG4gIGRlZmF1bHRSYWRpdXM6IDQwLFxuICBkZWZhdWx0UmVuZGVyZXI6ICdjYW52YXMyZCcsXG4gIGRlZmF1bHRHcmFkaWVudDogeyAwLjI1OiBcInJnYigwLDAsMjU1KVwiLCAwLjU1OiBcInJnYigwLDI1NSwwKVwiLCAwLjg1OiBcInllbGxvd1wiLCAxLjA6IFwicmdiKDI1NSwwLDApXCJ9LFxuICBkZWZhdWx0TWF4T3BhY2l0eTogMSxcbiAgZGVmYXVsdE1pbk9wYWNpdHk6IDAsXG4gIGRlZmF1bHRCbHVyOiAuODUsXG4gIGRlZmF1bHRYRmllbGQ6ICd4JyxcbiAgZGVmYXVsdFlGaWVsZDogJ3knLFxuICBkZWZhdWx0VmFsdWVGaWVsZDogJ3ZhbHVlJywgXG4gIHBsdWdpbnM6IHt9XG59O1xudmFyIFN0b3JlID0gKGZ1bmN0aW9uIFN0b3JlQ2xvc3VyZSgpIHtcblxuICB2YXIgU3RvcmUgPSBmdW5jdGlvbiBTdG9yZShjb25maWcpIHtcbiAgICB0aGlzLl9jb29yZGluYXRvciA9IHt9O1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLl9yYWRpID0gW107XG4gICAgdGhpcy5fbWluID0gMTA7XG4gICAgdGhpcy5fbWF4ID0gMTtcbiAgICB0aGlzLl94RmllbGQgPSBjb25maWdbJ3hGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0WEZpZWxkO1xuICAgIHRoaXMuX3lGaWVsZCA9IGNvbmZpZ1sneUZpZWxkJ10gfHwgY29uZmlnLmRlZmF1bHRZRmllbGQ7XG4gICAgdGhpcy5fdmFsdWVGaWVsZCA9IGNvbmZpZ1sndmFsdWVGaWVsZCddIHx8IGNvbmZpZy5kZWZhdWx0VmFsdWVGaWVsZDtcblxuICAgIGlmIChjb25maWdbXCJyYWRpdXNcIl0pIHtcbiAgICAgIHRoaXMuX2NmZ1JhZGl1cyA9IGNvbmZpZ1tcInJhZGl1c1wiXTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGRlZmF1bHRSYWRpdXMgPSBIZWF0bWFwQ29uZmlnLmRlZmF1bHRSYWRpdXM7XG5cbiAgU3RvcmUucHJvdG90eXBlID0ge1xuICAgIC8vIHdoZW4gZm9yY2VSZW5kZXIgPSBmYWxzZSAtPiBjYWxsZWQgZnJvbSBzZXREYXRhLCBvbWl0cyByZW5kZXJhbGwgZXZlbnRcbiAgICBfb3JnYW5pc2VEYXRhOiBmdW5jdGlvbihkYXRhUG9pbnQsIGZvcmNlUmVuZGVyKSB7XG4gICAgICAgIHZhciB4ID0gZGF0YVBvaW50W3RoaXMuX3hGaWVsZF07XG4gICAgICAgIHZhciB5ID0gZGF0YVBvaW50W3RoaXMuX3lGaWVsZF07XG4gICAgICAgIHZhciByYWRpID0gdGhpcy5fcmFkaTtcbiAgICAgICAgdmFyIHN0b3JlID0gdGhpcy5fZGF0YTtcbiAgICAgICAgdmFyIG1heCA9IHRoaXMuX21heDtcbiAgICAgICAgdmFyIG1pbiA9IHRoaXMuX21pbjtcbiAgICAgICAgdmFyIHZhbHVlID0gZGF0YVBvaW50W3RoaXMuX3ZhbHVlRmllbGRdIHx8IDE7XG4gICAgICAgIHZhciByYWRpdXMgPSBkYXRhUG9pbnQucmFkaXVzIHx8IHRoaXMuX2NmZ1JhZGl1cyB8fCBkZWZhdWx0UmFkaXVzO1xuXG4gICAgICAgIGlmICghc3RvcmVbeF0pIHtcbiAgICAgICAgICBzdG9yZVt4XSA9IFtdO1xuICAgICAgICAgIHJhZGlbeF0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3RvcmVbeF1beV0pIHtcbiAgICAgICAgICBzdG9yZVt4XVt5XSA9IHZhbHVlO1xuICAgICAgICAgIHJhZGlbeF1beV0gPSByYWRpdXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RvcmVbeF1beV0gKz0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0b3JlZFZhbCA9IHN0b3JlW3hdW3ldO1xuXG4gICAgICAgIGlmIChzdG9yZWRWYWwgPiBtYXgpIHtcbiAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXggPSBzdG9yZWRWYWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YU1heChzdG9yZWRWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmVkVmFsIDwgbWluKSB7XG4gICAgICAgICAgaWYgKCFmb3JjZVJlbmRlcikge1xuICAgICAgICAgICAgdGhpcy5fbWluID0gc3RvcmVkVmFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldERhdGFNaW4oc3RvcmVkVmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgeDogeCwgXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLCBcbiAgICAgICAgICAgIHJhZGl1czogcmFkaXVzLFxuICAgICAgICAgICAgbWluOiBtaW4sXG4gICAgICAgICAgICBtYXg6IG1heCBcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcbiAgICBfdW5Pcmdhbml6ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHVub3JnYW5pemVkRGF0YSA9IFtdO1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLl9kYXRhO1xuICAgICAgdmFyIHJhZGkgPSB0aGlzLl9yYWRpO1xuXG4gICAgICBmb3IgKHZhciB4IGluIGRhdGEpIHtcbiAgICAgICAgZm9yICh2YXIgeSBpbiBkYXRhW3hdKSB7XG5cbiAgICAgICAgICB1bm9yZ2FuaXplZERhdGEucHVzaCh7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHJhZGl1czogcmFkaVt4XVt5XSxcbiAgICAgICAgICAgIHZhbHVlOiBkYXRhW3hdW3ldXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgIG1heDogdGhpcy5fbWF4LFxuICAgICAgICBkYXRhOiB1bm9yZ2FuaXplZERhdGFcbiAgICAgIH07XG4gICAgfSxcbiAgICBfb25FeHRyZW1hQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yLmVtaXQoJ2V4dHJlbWFjaGFuZ2UnLCB7XG4gICAgICAgIG1pbjogdGhpcy5fbWluLFxuICAgICAgICBtYXg6IHRoaXMuX21heFxuICAgICAgfSk7XG4gICAgfSxcbiAgICBhZGREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMF0ubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgZGF0YUFyciA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgdmFyIGRhdGFMZW4gPSBkYXRhQXJyLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGRhdGFMZW4tLSkge1xuICAgICAgICAgIHRoaXMuYWRkRGF0YS5jYWxsKHRoaXMsIGRhdGFBcnJbZGF0YUxlbl0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhZGQgdG8gc3RvcmUgIFxuICAgICAgICB2YXIgb3JnYW5pc2VkRW50cnkgPSB0aGlzLl9vcmdhbmlzZURhdGEoYXJndW1lbnRzWzBdLCB0cnVlKTtcbiAgICAgICAgaWYgKG9yZ2FuaXNlZEVudHJ5KSB7XG4gICAgICAgICAgLy8gaWYgaXQncyB0aGUgZmlyc3QgZGF0YXBvaW50IGluaXRpYWxpemUgdGhlIGV4dHJlbWFzIHdpdGggaXRcbiAgICAgICAgICBpZiAodGhpcy5fZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX21pbiA9IHRoaXMuX21heCA9IG9yZ2FuaXNlZEVudHJ5LnZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJwYXJ0aWFsJywge1xuICAgICAgICAgICAgbWluOiB0aGlzLl9taW4sXG4gICAgICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgICAgIGRhdGE6IFtvcmdhbmlzZWRFbnRyeV1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgZGF0YVBvaW50cyA9IGRhdGEuZGF0YTtcbiAgICAgIHZhciBwb2ludHNMZW4gPSBkYXRhUG9pbnRzLmxlbmd0aDtcblxuXG4gICAgICAvLyByZXNldCBkYXRhIGFycmF5c1xuICAgICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgICAgdGhpcy5fcmFkaSA9IFtdO1xuXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcG9pbnRzTGVuOyBpKyspIHtcbiAgICAgICAgdGhpcy5fb3JnYW5pc2VEYXRhKGRhdGFQb2ludHNbaV0sIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21heCA9IGRhdGEubWF4O1xuICAgICAgdGhpcy5fbWluID0gZGF0YS5taW4gfHwgMDtcbiAgICAgIFxuICAgICAgdGhpcy5fb25FeHRyZW1hQ2hhbmdlKCk7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9nZXRJbnRlcm5hbERhdGEoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVE9ETzogaW1wbGVtZW50XG4gICAgfSxcbiAgICBzZXREYXRhTWF4OiBmdW5jdGlvbihtYXgpIHtcbiAgICAgIHRoaXMuX21heCA9IG1heDtcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWluOiBmdW5jdGlvbihtaW4pIHtcbiAgICAgIHRoaXMuX21pbiA9IG1pbjtcbiAgICAgIHRoaXMuX29uRXh0cmVtYUNoYW5nZSgpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXRDb29yZGluYXRvcjogZnVuY3Rpb24oY29vcmRpbmF0b3IpIHtcbiAgICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0gY29vcmRpbmF0b3I7XG4gICAgfSxcbiAgICBfZ2V0SW50ZXJuYWxEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7IFxuICAgICAgICBtYXg6IHRoaXMuX21heCxcbiAgICAgICAgbWluOiB0aGlzLl9taW4sIFxuICAgICAgICBkYXRhOiB0aGlzLl9kYXRhLFxuICAgICAgICByYWRpOiB0aGlzLl9yYWRpIFxuICAgICAgfTtcbiAgICB9LFxuICAgIGdldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3VuT3JnYW5pemVEYXRhKCk7XG4gICAgfS8qLFxuXG4gICAgICBUT0RPOiByZXRoaW5rLlxuXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhciByYWRpdXMgPSAxMDA7XG4gICAgICB2YXIgeCA9IHBvaW50Lng7XG4gICAgICB2YXIgeSA9IHBvaW50Lnk7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAgIGlmIChkYXRhW3hdICYmIGRhdGFbeF1beV0pIHtcbiAgICAgICAgcmV0dXJuIGRhdGFbeF1beV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdmFsdWVzID0gW107XG4gICAgICAgIC8vIHJhZGlhbCBzZWFyY2ggZm9yIGRhdGFwb2ludHMgYmFzZWQgb24gZGVmYXVsdCByYWRpdXNcbiAgICAgICAgZm9yKHZhciBkaXN0YW5jZSA9IDE7IGRpc3RhbmNlIDwgcmFkaXVzOyBkaXN0YW5jZSsrKSB7XG4gICAgICAgICAgdmFyIG5laWdoYm9ycyA9IGRpc3RhbmNlICogMiArMTtcbiAgICAgICAgICB2YXIgc3RhcnRYID0geCAtIGRpc3RhbmNlO1xuICAgICAgICAgIHZhciBzdGFydFkgPSB5IC0gZGlzdGFuY2U7XG5cbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JzOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG8gPSAwOyBvIDwgbmVpZ2hib3JzOyBvKyspIHtcbiAgICAgICAgICAgICAgaWYgKChpID09IDAgfHwgaSA9PSBuZWlnaGJvcnMtMSkgfHwgKG8gPT0gMCB8fCBvID09IG5laWdoYm9ycy0xKSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhW3N0YXJ0WStpXSAmJiBkYXRhW3N0YXJ0WStpXVtzdGFydFgrb10pIHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKGRhdGFbc3RhcnRZK2ldW3N0YXJ0WCtvXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgdmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0qL1xuICB9O1xuXG5cbiAgcmV0dXJuIFN0b3JlO1xufSkoKTtcblxudmFyIENhbnZhczJkUmVuZGVyZXIgPSAoZnVuY3Rpb24gQ2FudmFzMmRSZW5kZXJlckNsb3N1cmUoKSB7XG5cbiAgdmFyIF9nZXRDb2xvclBhbGV0dGUgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICB2YXIgZ3JhZGllbnRDb25maWcgPSBjb25maWcuZ3JhZGllbnQgfHwgY29uZmlnLmRlZmF1bHRHcmFkaWVudDtcbiAgICB2YXIgcGFsZXR0ZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBwYWxldHRlQ3R4ID0gcGFsZXR0ZUNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgcGFsZXR0ZUNhbnZhcy53aWR0aCA9IDI1NjtcbiAgICBwYWxldHRlQ2FudmFzLmhlaWdodCA9IDE7XG5cbiAgICB2YXIgZ3JhZGllbnQgPSBwYWxldHRlQ3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDI1NiwgMSk7XG4gICAgZm9yICh2YXIga2V5IGluIGdyYWRpZW50Q29uZmlnKSB7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3Aoa2V5LCBncmFkaWVudENvbmZpZ1trZXldKTtcbiAgICB9XG5cbiAgICBwYWxldHRlQ3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgIHBhbGV0dGVDdHguZmlsbFJlY3QoMCwgMCwgMjU2LCAxKTtcblxuICAgIHJldHVybiBwYWxldHRlQ3R4LmdldEltYWdlRGF0YSgwLCAwLCAyNTYsIDEpLmRhdGE7XG4gIH07XG5cbiAgdmFyIF9nZXRQb2ludFRlbXBsYXRlID0gZnVuY3Rpb24ocmFkaXVzLCBibHVyRmFjdG9yKSB7XG4gICAgdmFyIHRwbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciB0cGxDdHggPSB0cGxDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB2YXIgeCA9IHJhZGl1cztcbiAgICB2YXIgeSA9IHJhZGl1cztcbiAgICB0cGxDYW52YXMud2lkdGggPSB0cGxDYW52YXMuaGVpZ2h0ID0gcmFkaXVzKjI7XG5cbiAgICBpZiAoYmx1ckZhY3RvciA9PSAxKSB7XG4gICAgICB0cGxDdHguYmVnaW5QYXRoKCk7XG4gICAgICB0cGxDdHguYXJjKHgsIHksIHJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgIHRwbEN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwxKSc7XG4gICAgICB0cGxDdHguZmlsbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZ3JhZGllbnQgPSB0cGxDdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoeCwgeSwgcmFkaXVzKmJsdXJGYWN0b3IsIHgsIHksIHJhZGl1cyk7XG4gICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwwLDAsMSknKTtcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLDAsMCwwKScpO1xuICAgICAgdHBsQ3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgICAgdHBsQ3R4LmZpbGxSZWN0KDAsIDAsIDIqcmFkaXVzLCAyKnJhZGl1cyk7XG4gICAgfVxuXG5cblxuICAgIHJldHVybiB0cGxDYW52YXM7XG4gIH07XG5cbiAgdmFyIF9wcmVwYXJlRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgcmVuZGVyRGF0YSA9IFtdO1xuICAgIHZhciBtaW4gPSBkYXRhLm1pbjtcbiAgICB2YXIgbWF4ID0gZGF0YS5tYXg7XG4gICAgdmFyIHJhZGkgPSBkYXRhLnJhZGk7XG4gICAgdmFyIGRhdGEgPSBkYXRhLmRhdGE7XG5cbiAgICB2YXIgeFZhbHVlcyA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgIHZhciB4VmFsdWVzTGVuID0geFZhbHVlcy5sZW5ndGg7XG5cbiAgICB3aGlsZSh4VmFsdWVzTGVuLS0pIHtcbiAgICAgIHZhciB4VmFsdWUgPSB4VmFsdWVzW3hWYWx1ZXNMZW5dO1xuICAgICAgdmFyIHlWYWx1ZXMgPSBPYmplY3Qua2V5cyhkYXRhW3hWYWx1ZV0pO1xuICAgICAgdmFyIHlWYWx1ZXNMZW4gPSB5VmFsdWVzLmxlbmd0aDtcbiAgICAgIHdoaWxlKHlWYWx1ZXNMZW4tLSkge1xuICAgICAgICB2YXIgeVZhbHVlID0geVZhbHVlc1t5VmFsdWVzTGVuXTtcbiAgICAgICAgdmFyIHZhbHVlID0gZGF0YVt4VmFsdWVdW3lWYWx1ZV07XG4gICAgICAgIHZhciByYWRpdXMgPSByYWRpW3hWYWx1ZV1beVZhbHVlXTtcbiAgICAgICAgcmVuZGVyRGF0YS5wdXNoKHtcbiAgICAgICAgICB4OiB4VmFsdWUsXG4gICAgICAgICAgeTogeVZhbHVlLFxuICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICByYWRpdXM6IHJhZGl1c1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWluOiBtaW4sXG4gICAgICBtYXg6IG1heCxcbiAgICAgIGRhdGE6IHJlbmRlckRhdGFcbiAgICB9O1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gQ2FudmFzMmRSZW5kZXJlcihjb25maWcpIHtcbiAgICB2YXIgY29udGFpbmVyID0gY29uZmlnLmNvbnRhaW5lcjtcbiAgICB2YXIgc2hhZG93Q2FudmFzID0gdGhpcy5zaGFkb3dDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXMgPSBjb25maWcuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciByZW5kZXJCb3VuZGFyaWVzID0gdGhpcy5fcmVuZGVyQm91bmRhcmllcyA9IFsxMDAwMCwgMTAwMDAsIDAsIDBdO1xuXG4gICAgdmFyIGNvbXB1dGVkID0gZ2V0Q29tcHV0ZWRTdHlsZShjb25maWcuY29udGFpbmVyKSB8fCB7fTtcblxuICAgIGNhbnZhcy5jbGFzc05hbWUgPSAnaGVhdG1hcC1jYW52YXMnO1xuXG4gICAgdGhpcy5fd2lkdGggPSBjYW52YXMud2lkdGggPSBzaGFkb3dDYW52YXMud2lkdGggPSBjb25maWcud2lkdGggfHwgKyhjb21wdXRlZC53aWR0aC5yZXBsYWNlKC9weC8sJycpKTtcbiAgICB0aGlzLl9oZWlnaHQgPSBjYW52YXMuaGVpZ2h0ID0gc2hhZG93Q2FudmFzLmhlaWdodCA9IGNvbmZpZy5oZWlnaHQgfHwgKyhjb21wdXRlZC5oZWlnaHQucmVwbGFjZSgvcHgvLCcnKSk7XG5cbiAgICB0aGlzLnNoYWRvd0N0eCA9IHNoYWRvd0NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAvLyBAVE9ETzpcbiAgICAvLyBjb25kaXRpb25hbCB3cmFwcGVyXG5cbiAgICBjYW52YXMuc3R5bGUuY3NzVGV4dCA9IHNoYWRvd0NhbnZhcy5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt0b3A6MDsnO1xuXG4gICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuICAgIHRoaXMuX3BhbGV0dGUgPSBfZ2V0Q29sb3JQYWxldHRlKGNvbmZpZyk7XG4gICAgdGhpcy5fdGVtcGxhdGVzID0ge307XG5cbiAgICB0aGlzLl9zZXRTdHlsZXMoY29uZmlnKTtcbiAgfTtcblxuICBDYW52YXMyZFJlbmRlcmVyLnByb3RvdHlwZSA9IHtcbiAgICByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5fZHJhd0FscGhhKGRhdGEpO1xuICAgICAgICB0aGlzLl9jb2xvcml6ZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVyQWxsOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyByZXNldCByZW5kZXIgYm91bmRhcmllc1xuICAgICAgdGhpcy5fY2xlYXIoKTtcbiAgICAgIGlmIChkYXRhLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9kcmF3QWxwaGEoX3ByZXBhcmVEYXRhKGRhdGEpKTtcbiAgICAgICAgdGhpcy5fY29sb3JpemUoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIF91cGRhdGVHcmFkaWVudDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9wYWxldHRlID0gX2dldENvbG9yUGFsZXR0ZShjb25maWcpO1xuICAgIH0sXG4gICAgdXBkYXRlQ29uZmlnOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIGlmIChjb25maWdbJ2dyYWRpZW50J10pIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlR3JhZGllbnQoY29uZmlnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NldFN0eWxlcyhjb25maWcpO1xuICAgIH0sXG4gICAgc2V0RGltZW5zaW9uczogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICAgICAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcbiAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5zaGFkb3dDYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuc2hhZG93Q2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9LFxuICAgIF9jbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNoYWRvd0N0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCk7XG4gICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCk7XG4gICAgfSxcbiAgICBfc2V0U3R5bGVzOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHRoaXMuX2JsdXIgPSAoY29uZmlnLmJsdXIgPT0gMCk/MDooY29uZmlnLmJsdXIgfHwgY29uZmlnLmRlZmF1bHRCbHVyKTtcblxuICAgICAgaWYgKGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29uZmlnLmJhY2tncm91bmRDb2xvcjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fd2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuc2hhZG93Q2FudmFzLndpZHRoID0gY29uZmlnLndpZHRoIHx8IHRoaXMuX3dpZHRoO1xuICAgICAgdGhpcy5faGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zaGFkb3dDYW52YXMuaGVpZ2h0ID0gY29uZmlnLmhlaWdodCB8fCB0aGlzLl9oZWlnaHQ7XG5cblxuICAgICAgdGhpcy5fb3BhY2l0eSA9IChjb25maWcub3BhY2l0eSB8fCAwKSAqIDI1NTtcbiAgICAgIHRoaXMuX21heE9wYWNpdHkgPSAoY29uZmlnLm1heE9wYWNpdHkgfHwgY29uZmlnLmRlZmF1bHRNYXhPcGFjaXR5KSAqIDI1NTtcbiAgICAgIHRoaXMuX21pbk9wYWNpdHkgPSAoY29uZmlnLm1pbk9wYWNpdHkgfHwgY29uZmlnLmRlZmF1bHRNaW5PcGFjaXR5KSAqIDI1NTtcbiAgICAgIHRoaXMuX3VzZUdyYWRpZW50T3BhY2l0eSA9ICEhY29uZmlnLnVzZUdyYWRpZW50T3BhY2l0eTtcbiAgICB9LFxuICAgIF9kcmF3QWxwaGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciBtaW4gPSB0aGlzLl9taW4gPSBkYXRhLm1pbjtcbiAgICAgIHZhciBtYXggPSB0aGlzLl9tYXggPSBkYXRhLm1heDtcbiAgICAgIHZhciBkYXRhID0gZGF0YS5kYXRhIHx8IFtdO1xuICAgICAgdmFyIGRhdGFMZW4gPSBkYXRhLmxlbmd0aDtcbiAgICAgIC8vIG9uIGEgcG9pbnQgYmFzaXM/XG4gICAgICB2YXIgYmx1ciA9IDEgLSB0aGlzLl9ibHVyO1xuXG4gICAgICB3aGlsZShkYXRhTGVuLS0pIHtcblxuICAgICAgICB2YXIgcG9pbnQgPSBkYXRhW2RhdGFMZW5dO1xuXG4gICAgICAgIHZhciB4ID0gcG9pbnQueDtcbiAgICAgICAgdmFyIHkgPSBwb2ludC55O1xuICAgICAgICB2YXIgcmFkaXVzID0gcG9pbnQucmFkaXVzO1xuICAgICAgICAvLyBpZiB2YWx1ZSBpcyBiaWdnZXIgdGhhbiBtYXhcbiAgICAgICAgLy8gdXNlIG1heCBhcyB2YWx1ZVxuICAgICAgICB2YXIgdmFsdWUgPSBNYXRoLm1pbihwb2ludC52YWx1ZSwgbWF4KTtcbiAgICAgICAgdmFyIHJlY3RYID0geCAtIHJhZGl1cztcbiAgICAgICAgdmFyIHJlY3RZID0geSAtIHJhZGl1cztcbiAgICAgICAgdmFyIHNoYWRvd0N0eCA9IHRoaXMuc2hhZG93Q3R4O1xuXG5cblxuXG4gICAgICAgIHZhciB0cGw7XG4gICAgICAgIGlmICghdGhpcy5fdGVtcGxhdGVzW3JhZGl1c10pIHtcbiAgICAgICAgICB0aGlzLl90ZW1wbGF0ZXNbcmFkaXVzXSA9IHRwbCA9IF9nZXRQb2ludFRlbXBsYXRlKHJhZGl1cywgYmx1cik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHBsID0gdGhpcy5fdGVtcGxhdGVzW3JhZGl1c107XG4gICAgICAgIH1cbiAgICAgICAgLy8gdmFsdWUgZnJvbSBtaW5pbXVtIC8gdmFsdWUgcmFuZ2VcbiAgICAgICAgLy8gPT4gWzAsIDFdXG4gICAgICAgIHZhciB0ZW1wbGF0ZUFscGhhID0gKHZhbHVlLW1pbikvKG1heC1taW4pO1xuICAgICAgICAvLyB0aGlzIGZpeGVzICMxNzY6IHNtYWxsIHZhbHVlcyBhcmUgbm90IHZpc2libGUgYmVjYXVzZSBnbG9iYWxBbHBoYSA8IC4wMSBjYW5ub3QgYmUgcmVhZCBmcm9tIGltYWdlRGF0YVxuICAgICAgICBzaGFkb3dDdHguZ2xvYmFsQWxwaGEgPSB0ZW1wbGF0ZUFscGhhIDwgLjAxID8gLjAxIDogdGVtcGxhdGVBbHBoYTtcblxuICAgICAgICBzaGFkb3dDdHguZHJhd0ltYWdlKHRwbCwgcmVjdFgsIHJlY3RZKTtcblxuICAgICAgICAvLyB1cGRhdGUgcmVuZGVyQm91bmRhcmllc1xuICAgICAgICBpZiAocmVjdFggPCB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzBdID0gcmVjdFg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZWN0WSA8IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV0pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV0gPSByZWN0WTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RYICsgMipyYWRpdXMgPiB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdID0gcmVjdFggKyAyKnJhZGl1cztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlY3RZICsgMipyYWRpdXMgPiB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdID0gcmVjdFkgKyAyKnJhZGl1cztcbiAgICAgICAgICB9XG5cbiAgICAgIH1cbiAgICB9LFxuICAgIF9jb2xvcml6ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgeCA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMF07XG4gICAgICB2YXIgeSA9IHRoaXMuX3JlbmRlckJvdW5kYXJpZXNbMV07XG4gICAgICB2YXIgd2lkdGggPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzJdIC0geDtcbiAgICAgIHZhciBoZWlnaHQgPSB0aGlzLl9yZW5kZXJCb3VuZGFyaWVzWzNdIC0geTtcbiAgICAgIHZhciBtYXhXaWR0aCA9IHRoaXMuX3dpZHRoO1xuICAgICAgdmFyIG1heEhlaWdodCA9IHRoaXMuX2hlaWdodDtcbiAgICAgIHZhciBvcGFjaXR5ID0gdGhpcy5fb3BhY2l0eTtcbiAgICAgIHZhciBtYXhPcGFjaXR5ID0gdGhpcy5fbWF4T3BhY2l0eTtcbiAgICAgIHZhciBtaW5PcGFjaXR5ID0gdGhpcy5fbWluT3BhY2l0eTtcbiAgICAgIHZhciB1c2VHcmFkaWVudE9wYWNpdHkgPSB0aGlzLl91c2VHcmFkaWVudE9wYWNpdHk7XG5cbiAgICAgIGlmICh4IDwgMCkge1xuICAgICAgICB4ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh5IDwgMCkge1xuICAgICAgICB5ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh4ICsgd2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgICB3aWR0aCA9IG1heFdpZHRoIC0geDtcbiAgICAgIH1cbiAgICAgIGlmICh5ICsgaGVpZ2h0ID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgIGhlaWdodCA9IG1heEhlaWdodCAtIHk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbWcgPSB0aGlzLnNoYWRvd0N0eC5nZXRJbWFnZURhdGEoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICB2YXIgaW1nRGF0YSA9IGltZy5kYXRhO1xuICAgICAgdmFyIGxlbiA9IGltZ0RhdGEubGVuZ3RoO1xuICAgICAgdmFyIHBhbGV0dGUgPSB0aGlzLl9wYWxldHRlO1xuXG5cbiAgICAgIGZvciAodmFyIGkgPSAzOyBpIDwgbGVuOyBpKz0gNCkge1xuICAgICAgICB2YXIgYWxwaGEgPSBpbWdEYXRhW2ldO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gYWxwaGEgKiA0O1xuXG5cbiAgICAgICAgaWYgKCFvZmZzZXQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmaW5hbEFscGhhO1xuICAgICAgICBpZiAob3BhY2l0eSA+IDApIHtcbiAgICAgICAgICBmaW5hbEFscGhhID0gb3BhY2l0eTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoYWxwaGEgPCBtYXhPcGFjaXR5KSB7XG4gICAgICAgICAgICBpZiAoYWxwaGEgPCBtaW5PcGFjaXR5KSB7XG4gICAgICAgICAgICAgIGZpbmFsQWxwaGEgPSBtaW5PcGFjaXR5O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZmluYWxBbHBoYSA9IGFscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaW5hbEFscGhhID0gbWF4T3BhY2l0eTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpbWdEYXRhW2ktM10gPSBwYWxldHRlW29mZnNldF07XG4gICAgICAgIGltZ0RhdGFbaS0yXSA9IHBhbGV0dGVbb2Zmc2V0ICsgMV07XG4gICAgICAgIGltZ0RhdGFbaS0xXSA9IHBhbGV0dGVbb2Zmc2V0ICsgMl07XG4gICAgICAgIGltZ0RhdGFbaV0gPSB1c2VHcmFkaWVudE9wYWNpdHkgPyBwYWxldHRlW29mZnNldCArIDNdIDogZmluYWxBbHBoYTtcblxuICAgICAgfVxuXG4gICAgICBpbWcuZGF0YSA9IGltZ0RhdGE7XG4gICAgICB0aGlzLmN0eC5wdXRJbWFnZURhdGEoaW1nLCB4LCB5KTtcblxuICAgICAgdGhpcy5fcmVuZGVyQm91bmRhcmllcyA9IFsxMDAwLCAxMDAwLCAwLCAwXTtcblxuICAgIH0sXG4gICAgZ2V0VmFsdWVBdDogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhciBzaGFkb3dDdHggPSB0aGlzLnNoYWRvd0N0eDtcbiAgICAgIHZhciBpbWcgPSBzaGFkb3dDdHguZ2V0SW1hZ2VEYXRhKHBvaW50LngsIHBvaW50LnksIDEsIDEpO1xuICAgICAgdmFyIGRhdGEgPSBpbWcuZGF0YVszXTtcbiAgICAgIHZhciBtYXggPSB0aGlzLl9tYXg7XG4gICAgICB2YXIgbWluID0gdGhpcy5fbWluO1xuXG4gICAgICB2YWx1ZSA9IChNYXRoLmFicyhtYXgtbWluKSAqIChkYXRhLzI1NSkpID4+IDA7XG5cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuICAgIGdldERhdGFVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2FudmFzLnRvRGF0YVVSTCgpO1xuICAgIH1cbiAgfTtcblxuXG4gIHJldHVybiBDYW52YXMyZFJlbmRlcmVyO1xufSkoKTtcblxuXG52YXIgUmVuZGVyZXIgPSAoZnVuY3Rpb24gUmVuZGVyZXJDbG9zdXJlKCkge1xuXG4gIHZhciByZW5kZXJlckZuID0gZmFsc2U7XG5cbiAgaWYgKEhlYXRtYXBDb25maWdbJ2RlZmF1bHRSZW5kZXJlciddID09PSAnY2FudmFzMmQnKSB7XG4gICAgcmVuZGVyZXJGbiA9IENhbnZhczJkUmVuZGVyZXI7XG4gIH1cblxuICByZXR1cm4gcmVuZGVyZXJGbjtcbn0pKCk7XG5cblxudmFyIFV0aWwgPSB7XG4gIG1lcmdlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWVyZ2VkID0ge307XG4gICAgdmFyIGFyZ3NMZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJnc0xlbjsgaSsrKSB7XG4gICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2ldXG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIG1lcmdlZFtrZXldID0gb2JqW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXJnZWQ7XG4gIH1cbn07XG4vLyBIZWF0bWFwIENvbnN0cnVjdG9yXG52YXIgSGVhdG1hcCA9IChmdW5jdGlvbiBIZWF0bWFwQ2xvc3VyZSgpIHtcblxuICB2YXIgQ29vcmRpbmF0b3IgPSAoZnVuY3Rpb24gQ29vcmRpbmF0b3JDbG9zdXJlKCkge1xuXG4gICAgZnVuY3Rpb24gQ29vcmRpbmF0b3IoKSB7XG4gICAgICB0aGlzLmNTdG9yZSA9IHt9O1xuICAgIH07XG5cbiAgICBDb29yZGluYXRvci5wcm90b3R5cGUgPSB7XG4gICAgICBvbjogZnVuY3Rpb24oZXZ0TmFtZSwgY2FsbGJhY2ssIHNjb3BlKSB7XG4gICAgICAgIHZhciBjU3RvcmUgPSB0aGlzLmNTdG9yZTtcblxuICAgICAgICBpZiAoIWNTdG9yZVtldnROYW1lXSkge1xuICAgICAgICAgIGNTdG9yZVtldnROYW1lXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGNTdG9yZVtldnROYW1lXS5wdXNoKChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChzY29wZSwgZGF0YSk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0sXG4gICAgICBlbWl0OiBmdW5jdGlvbihldnROYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBjU3RvcmUgPSB0aGlzLmNTdG9yZTtcbiAgICAgICAgaWYgKGNTdG9yZVtldnROYW1lXSkge1xuICAgICAgICAgIHZhciBsZW4gPSBjU3RvcmVbZXZ0TmFtZV0ubGVuZ3RoO1xuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gY1N0b3JlW2V2dE5hbWVdW2ldO1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDb29yZGluYXRvcjtcbiAgfSkoKTtcblxuXG4gIHZhciBfY29ubmVjdCA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgdmFyIHJlbmRlcmVyID0gc2NvcGUuX3JlbmRlcmVyO1xuICAgIHZhciBjb29yZGluYXRvciA9IHNjb3BlLl9jb29yZGluYXRvcjtcbiAgICB2YXIgc3RvcmUgPSBzY29wZS5fc3RvcmU7XG5cbiAgICBjb29yZGluYXRvci5vbigncmVuZGVycGFydGlhbCcsIHJlbmRlcmVyLnJlbmRlclBhcnRpYWwsIHJlbmRlcmVyKTtcbiAgICBjb29yZGluYXRvci5vbigncmVuZGVyYWxsJywgcmVuZGVyZXIucmVuZGVyQWxsLCByZW5kZXJlcik7XG4gICAgY29vcmRpbmF0b3Iub24oJ2V4dHJlbWFjaGFuZ2UnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzY29wZS5fY29uZmlnLm9uRXh0cmVtYUNoYW5nZSAmJlxuICAgICAgc2NvcGUuX2NvbmZpZy5vbkV4dHJlbWFDaGFuZ2Uoe1xuICAgICAgICBtaW46IGRhdGEubWluLFxuICAgICAgICBtYXg6IGRhdGEubWF4LFxuICAgICAgICBncmFkaWVudDogc2NvcGUuX2NvbmZpZ1snZ3JhZGllbnQnXSB8fCBzY29wZS5fY29uZmlnWydkZWZhdWx0R3JhZGllbnQnXVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3RvcmUuc2V0Q29vcmRpbmF0b3IoY29vcmRpbmF0b3IpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gSGVhdG1hcCgpIHtcbiAgICB2YXIgY29uZmlnID0gdGhpcy5fY29uZmlnID0gVXRpbC5tZXJnZShIZWF0bWFwQ29uZmlnLCBhcmd1bWVudHNbMF0gfHwge30pO1xuICAgIHRoaXMuX2Nvb3JkaW5hdG9yID0gbmV3IENvb3JkaW5hdG9yKCk7XG4gICAgaWYgKGNvbmZpZ1sncGx1Z2luJ10pIHtcbiAgICAgIHZhciBwbHVnaW5Ub0xvYWQgPSBjb25maWdbJ3BsdWdpbiddO1xuICAgICAgaWYgKCFIZWF0bWFwQ29uZmlnLnBsdWdpbnNbcGx1Z2luVG9Mb2FkXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsdWdpbiBcXCcnKyBwbHVnaW5Ub0xvYWQgKyAnXFwnIG5vdCBmb3VuZC4gTWF5YmUgaXQgd2FzIG5vdCByZWdpc3RlcmVkLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHBsdWdpbiA9IEhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5Ub0xvYWRdO1xuICAgICAgICAvLyBzZXQgcGx1Z2luIHJlbmRlcmVyIGFuZCBzdG9yZVxuICAgICAgICB0aGlzLl9yZW5kZXJlciA9IG5ldyBwbHVnaW4ucmVuZGVyZXIoY29uZmlnKTtcbiAgICAgICAgdGhpcy5fc3RvcmUgPSBuZXcgcGx1Z2luLnN0b3JlKGNvbmZpZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyID0gbmV3IFJlbmRlcmVyKGNvbmZpZyk7XG4gICAgICB0aGlzLl9zdG9yZSA9IG5ldyBTdG9yZShjb25maWcpO1xuICAgIH1cbiAgICBfY29ubmVjdCh0aGlzKTtcbiAgfTtcblxuICAvLyBAVE9ETzpcbiAgLy8gYWRkIEFQSSBkb2N1bWVudGF0aW9uXG4gIEhlYXRtYXAucHJvdG90eXBlID0ge1xuICAgIGFkZERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuYWRkRGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5yZW1vdmVEYXRhICYmIHRoaXMuX3N0b3JlLnJlbW92ZURhdGEuYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNldERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fc3RvcmUuc2V0RGF0YS5hcHBseSh0aGlzLl9zdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2V0RGF0YU1heDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9zdG9yZS5zZXREYXRhTWF4LmFwcGx5KHRoaXMuX3N0b3JlLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzZXREYXRhTWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX3N0b3JlLnNldERhdGFNaW4uYXBwbHkodGhpcy5fc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbmZpZ3VyZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0aGlzLl9jb25maWcgPSBVdGlsLm1lcmdlKHRoaXMuX2NvbmZpZywgY29uZmlnKTtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLnVwZGF0ZUNvbmZpZyh0aGlzLl9jb25maWcpO1xuICAgICAgdGhpcy5fY29vcmRpbmF0b3IuZW1pdCgncmVuZGVyYWxsJywgdGhpcy5fc3RvcmUuX2dldEludGVybmFsRGF0YSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVwYWludDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jb29yZGluYXRvci5lbWl0KCdyZW5kZXJhbGwnLCB0aGlzLl9zdG9yZS5fZ2V0SW50ZXJuYWxEYXRhKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBnZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdG9yZS5nZXREYXRhKCk7XG4gICAgfSxcbiAgICBnZXREYXRhVVJMOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci5nZXREYXRhVVJMKCk7XG4gICAgfSxcbiAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihwb2ludCkge1xuXG4gICAgICBpZiAodGhpcy5fc3RvcmUuZ2V0VmFsdWVBdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RvcmUuZ2V0VmFsdWVBdChwb2ludCk7XG4gICAgICB9IGVsc2UgIGlmICh0aGlzLl9yZW5kZXJlci5nZXRWYWx1ZUF0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci5nZXRWYWx1ZUF0KHBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gSGVhdG1hcDtcblxufSkoKTtcblxuXG4vLyBjb3JlXG52YXIgaGVhdG1hcEZhY3RvcnkgPSB7XG4gIGNyZWF0ZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgcmV0dXJuIG5ldyBIZWF0bWFwKGNvbmZpZyk7XG4gIH0sXG4gIHJlZ2lzdGVyOiBmdW5jdGlvbihwbHVnaW5LZXksIHBsdWdpbikge1xuICAgIEhlYXRtYXBDb25maWcucGx1Z2luc1twbHVnaW5LZXldID0gcGx1Z2luO1xuICB9XG59O1xuXG5yZXR1cm4gaGVhdG1hcEZhY3Rvcnk7XG5cblxufSk7IiwiY29uc3QgVVJMID0gXCJodHRwOi8vbG9jYWxob3N0OjgwODhcIlxyXG5cclxuY29uc3QgQVBJID0ge1xyXG5cclxuICBnZXRTaW5nbGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBnZXRBbGwoZXh0ZW5zaW9uKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSXRlbShleHRlbnNpb24sIGlkKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJERUxFVEVcIlxyXG4gICAgfSlcclxuICAgICAgLnRoZW4oZSA9PiBlLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwb3N0SXRlbShleHRlbnNpb24sIG9iaikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCwge1xyXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwdXRJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQVVRcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQVBJIiwiZnVuY3Rpb24gZWxCdWlsZGVyKG5hbWUsIGF0dHJpYnV0ZXNPYmosIHR4dCwgLi4uY2hpbGRyZW4pIHtcclxuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgZm9yIChsZXQgYXR0ciBpbiBhdHRyaWJ1dGVzT2JqKSB7XHJcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ciwgYXR0cmlidXRlc09ialthdHRyXSk7XHJcbiAgfVxyXG4gIGVsLnRleHRDb250ZW50ID0gdHh0IHx8IG51bGw7XHJcbiAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICBlbC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbiAgfSlcclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGVsQnVpbGRlciIsImltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiO1xyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5cclxuLy8gdGhlIHB1cnBvc2Ugb2YgdGhpcyBtb2R1bGUgaXMgdG86XHJcbi8vIDEuIHNhdmUgYWxsIGNvbnRlbnQgaW4gdGhlIGdhbWVwbGF5IHBhZ2UgKHNob3QgYW5kIGdhbWUgZGF0YSkgdG8gdGhlIGRhdGFiYXNlXHJcbi8vIDIuIGltbWVkaWF0ZWx5IGNsZWFyIHRoZSBnYW1lcGxheSBjb250YWluZXJzIG9mIGNvbnRlbnQgb24gc2F2ZVxyXG4vLyAzLiBpbW1lZGlhdGVseSByZXNldCBhbGwgZ2xvYmFsIHZhcmlhYmxlcyBpbiB0aGUgc2hvdGRhdGEgZmlsZSB0byBhbGxvdyB0aGUgdXNlciB0byBiZWdpbiBzYXZpbmcgc2hvdHMgYW5kIGVudGVyaW5nIGdhbWUgZGF0YSBmb3IgdGhlaXIgbmV4dCBnYW1lXHJcbi8vIDQuIGFmZm9yZGFuY2UgZm9yIHVzZXIgdG8gcmVjYWxsIGFsbCBkYXRhIGZyb20gcHJldmlvdXMgc2F2ZWQgZ2FtZSBmb3IgZWRpdGluZ1xyXG4vLyA1LiBpbmNsdWRlIGFueSBvdGhlciBmdW5jdGlvbnMgbmVlZGVkIHRvIHN1cHBvcnQgdGhlIGZpcnN0IDQgcmVxdWlyZW1lbnRzXHJcblxyXG4vLyB0aGlzIGdsb2JhbCB2YXJpYWJsZSBpcyB1c2VkIHRvIHBhc3Mgc2F2ZWQgc2hvdHMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWwgYm9vbGVhbiB0byBzaG90RGF0YS5qcyBkdXJpbmcgdGhlIGVkaXQgcHJvY2Vzc1xyXG5sZXQgc2F2ZWRHYW1lT2JqZWN0O1xyXG5sZXQgcHV0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG5sZXQgcG9zdFByb21pc2VzRWRpdE1vZGUgPSBbXVxyXG5sZXQgcG9zdFByb21pc2VzID0gW107XHJcblxyXG5jb25zdCBnYW1lRGF0YSA9IHtcclxuXHJcbiAgZ2FtZVR5cGVCdXR0b25Ub2dnbGUoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB0b2dnbGVzIHRoZSBcImlzLXNlbGVjdGVkXCIgY2xhc3MgYmV0d2VlbiB0aGUgZ2FtZSB0eXBlIGJ1dHRvbnNcclxuXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgYnRuQ2xpY2tlZCA9IGUudGFyZ2V0O1xyXG5cclxuICAgIGlmICghYnRuQ2xpY2tlZC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICBjb25zdCBjdXJyZW50R2FtZVR5cGVCdG4gPSBnYW1lVHlwZUJ0bnMuZmlsdGVyKGJ0biA9PiBidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICAgIGJ0bkNsaWNrZWQuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpIHtcclxuICAgIHNhdmVkR2FtZU9iamVjdCA9IHVuZGVmaW5lZDtcclxuICAgIHB1dFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxuICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbiAgICBwb3N0UHJvbWlzZXMgPSBbXTtcclxuICB9LFxyXG5cclxuICBwdXRFZGl0ZWRTaG90cyhwcmV2aW91c2x5U2F2ZWRTaG90c0Fycikge1xyXG4gICAgLy8gUFVUIGZpcnN0LCBzaWNuZSB5b3UgY2FuJ3Qgc2F2ZSBhIGdhbWUgaW5pdGlhbGx5IHdpdGhvdXQgYXQgbGVhc3QgMSBzaG90XHJcbiAgICBwcmV2aW91c2x5U2F2ZWRTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICAvLyBldmVuIHRob3VnaCBpdCdzIGEgUFVULCB3ZSBoYXZlIHRvIHJlZm9ybWF0IHRoZSBfZmllbGRYIHN5bnRheCB0byBmaWVsZFhcclxuICAgICAgbGV0IHNob3RGb3JQdXQgPSB7fTtcclxuICAgICAgc2hvdEZvclB1dC5nYW1lSWQgPSBzYXZlZEdhbWVPYmplY3QuaWQ7XHJcbiAgICAgIHNob3RGb3JQdXQuZmllbGRYID0gc2hvdC5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUHV0LmZpZWxkWSA9IHNob3QuX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclB1dC5nb2FsWCA9IHNob3QuX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUHV0LmdvYWxZID0gc2hvdC5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQdXQuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90LmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUHV0LmFlcmlhbCA9IHNob3QuX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclB1dC50aW1lU3RhbXAgPSBzaG90Ll90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwdXRQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnB1dEl0ZW0oYHNob3RzLyR7c2hvdC5pZH1gLCBzaG90Rm9yUHV0KSk7XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHB1dFByb21pc2VzRWRpdE1vZGUpXHJcbiAgfSxcclxuXHJcbiAgcG9zdE5ld1Nob3RzTWFkZUR1cmluZ0VkaXRNb2RlKHNob3RzTm90WWV0UG9zdGVkQXJyKSB7XHJcbiAgICBzaG90c05vdFlldFBvc3RlZEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICBsZXQgc2hvdEZvclBvc3QgPSB7fTtcclxuICAgICAgc2hvdEZvclBvc3QuZ2FtZUlkID0gc2F2ZWRHYW1lT2JqZWN0LmlkO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFggPSBzaG90T2JqLl9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWSA9IHNob3RPYmouX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFggPSBzaG90T2JqLl9nb2FsWDtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFkgPSBzaG90T2JqLl9nb2FsWTtcclxuICAgICAgc2hvdEZvclBvc3QuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90T2JqLmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUG9zdC5hZXJpYWwgPSBzaG90T2JqLl9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQb3N0LnRpbWVTdGFtcCA9IHNob3RPYmouX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXNFZGl0TW9kZSlcclxuICB9LFxyXG5cclxuICBwb3N0TmV3U2hvdHMoZ2FtZUlkKSB7XHJcbiAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgIHNob3RBcnIuZm9yRWFjaChzaG90T2JqID0+IHtcclxuICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgIHNob3RGb3JQb3N0LmdhbWVJZCA9IGdhbWVJZDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRYID0gc2hvdE9iai5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFkgPSBzaG90T2JqLl9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxYID0gc2hvdE9iai5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxZID0gc2hvdE9iai5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdE9iai5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclBvc3QuYWVyaWFsID0gc2hvdE9iai5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUG9zdC50aW1lU3RhbXAgPSBzaG90T2JqLl90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwb3N0UHJvbWlzZXMucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkpO1xyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXMpXHJcbiAgfSxcclxuXHJcbiAgc2F2ZURhdGEoZ2FtZURhdGFPYmosIHNhdmluZ0VkaXRlZEdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZmlyc3QgZGV0ZXJtaW5lcyBpZiBhIGdhbWUgaXMgYmVpbmcgc2F2ZWQgYXMgbmV3LCBvciBhIHByZXZpb3VzbHkgc2F2ZWQgZ2FtZSBpcyBiZWluZyBlZGl0ZWRcclxuICAgIC8vIGlmIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSwgdGhlIGdhbWUgaXMgUFVULCBhbGwgc2hvdHMgc2F2ZWQgcHJldmlvdXNseSBhcmUgUFVULCBhbmQgbmV3IHNob3RzIGFyZSBQT1NURURcclxuICAgIC8vIGlmIHRoZSBnYW1lIGlzIGEgbmV3IGdhbWUgYWx0b2dldGhlciwgdGhlbiB0aGUgZ2FtZSBpcyBQT1NURUQgYW5kIGFsbCBzaG90cyBhcmUgUE9TVEVEXHJcbiAgICAvLyB0aGVuIGZ1bmN0aW9ucyBhcmUgY2FsbGVkIHRvIHJlbG9hZCB0aGUgbWFzdGVyIGNvbnRhaW5lciBhbmQgcmVzZXQgZ2xvYmFsIHNob3QgZGF0YSB2YXJpYWJsZXNcclxuXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSkge1xyXG4gICAgICAvLyB1c2UgSUQgb2YgZ2FtZSBzdG9yZWQgaW4gZ2xvYmFsIHZhclxyXG4gICAgICBBUEkucHV0SXRlbShgZ2FtZXMvJHtzYXZlZEdhbWVPYmplY3QuaWR9YCwgZ2FtZURhdGFPYmopXHJcbiAgICAgICAgLnRoZW4oZ2FtZVBVVCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlBVVCBHQU1FXCIsIGdhbWVQVVQpXHJcbiAgICAgICAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICAgICAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgICAgICAgIGNvbnN0IHByZXZpb3VzbHlTYXZlZFNob3RzQXJyID0gW107XHJcbiAgICAgICAgICBjb25zdCBzaG90c05vdFlldFBvc3RlZEFyciA9IFtdO1xyXG5cclxuICAgICAgICAgIC8vIGNyZWF0ZSBhcnJheXMgZm9yIFBVVCBhbmQgUE9TVCBmdW5jdGlvbnMgKGlmIHRoZXJlJ3MgYW4gaWQgaW4gdGhlIGFycmF5LCBpdCdzIGJlZW4gc2F2ZWQgdG8gdGhlIGRhdGFiYXNlIGJlZm9yZSlcclxuICAgICAgICAgIHNob3RBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgICAgICAgaWYgKHNob3QuaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHByZXZpb3VzbHlTYXZlZFNob3RzQXJyLnB1c2goc2hvdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc2hvdHNOb3RZZXRQb3N0ZWRBcnIucHVzaChzaG90KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0byBQVVQgYW5kIFBPU1RcclxuICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRoYXQgY2xlYXIgZ2FtZXBsYXkgY29udGVudCBhbmQgcmVzZXQgZ2xvYmFsIHNob3QvZ2FtZSBkYXRhIHZhcmlhYmxlc1xyXG4gICAgICAgICAgZ2FtZURhdGEucHV0RWRpdGVkU2hvdHMocHJldmlvdXNseVNhdmVkU2hvdHNBcnIpXHJcbiAgICAgICAgICAgIC50aGVuKHggPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUUzpcIiwgeClcclxuICAgICAgICAgICAgICAvLyBpZiBubyBuZXcgc2hvdHMgd2VyZSBtYWRlLCByZWxvYWQuIGVsc2UgcG9zdCBuZXcgc2hvdHNcclxuICAgICAgICAgICAgICBpZiAoc2hvdHNOb3RZZXRQb3N0ZWRBcnIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90c01hZGVEdXJpbmdFZGl0TW9kZShzaG90c05vdFlldFBvc3RlZEFycilcclxuICAgICAgICAgICAgICAgICAgLnRoZW4oeSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQT1NUUzpcIiwgeSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkucG9zdEl0ZW0oXCJnYW1lc1wiLCBnYW1lRGF0YU9iailcclxuICAgICAgICAudGhlbihnYW1lID0+IGdhbWUuaWQpXHJcbiAgICAgICAgLnRoZW4oZ2FtZUlkID0+IHtcclxuICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90cyhnYW1lSWQpXHJcbiAgICAgICAgICAgIC50aGVuKHogPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU0FWRUQgTkVXIFNIT1RTXCIsIHopO1xyXG4gICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcGFja2FnZUdhbWVEYXRhKCkge1xyXG5cclxuICAgIC8vIGdldCB1c2VyIElEIGZyb20gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgICAvLyBwYWNrYWdlIGVhY2ggaW5wdXQgZnJvbSBnYW1lIGRhdGEgY29udGFpbmVyIGludG8gdmFyaWFibGVzXHJcbiAgICAvLyBUT0RPOiBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gcHJldmVudCBibGFuayBzY29yZSBlbnRyaWVzXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gc2F2ZSBnYW1lXHJcblxyXG4gICAgLy8gcGxheWVySWRcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgZ2FtZVR5cGUgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IHtcclxuICAgICAgaWYgKGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICAgIGdhbWVUeXBlID0gYnRuLnRleHRDb250ZW50XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIChub3RlOiBkaWQgbm90IHVzZSBib29sZWFuIGluIGNhc2UgbW9yZSBnYW1lIG1vZGVzIGFyZSBzdXBwb3J0ZWQgaW4gdGhlIGZ1dHVyZSlcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsX2dhbWVNb2RlLnZhbHVlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gbXkgdGVhbSAobm90ZTogZGlkIG5vdCB1c2UgYm9vbGVhbiBpbiBwcmVwYXJhdGlvbiBmb3IgdXNlcnMgdG8gZW50ZXIgdGhlIGNsdWIgaW5mb3JtYXRpb24pXHJcbiAgICBjb25zdCBzZWxfdGVhbUNvbG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBsZXQgbXlUZWFtO1xyXG4gICAgaWYgKHNlbF90ZWFtQ29sb3IudmFsdWUgPT09IFwiT3JhbmdlIHRlYW1cIikge1xyXG4gICAgICBteVRlYW0gPSBcIm9yYW5nZVwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbXlUZWFtID0gXCJibHVlXCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NvcmVzXHJcbiAgICBsZXQgbXlTY29yZTtcclxuICAgIGxldCB0aGVpclNjb3JlO1xyXG4gICAgY29uc3QgaW5wdF9vcmFuZ2VTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3JhbmdlU2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmx1ZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJibHVlU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICBpZiAobXlUZWFtID09PSBcIm9yYW5nZVwiKSB7XHJcbiAgICAgIG15U2NvcmUgPSBOdW1iZXIoaW5wdF9vcmFuZ2VTY29yZS52YWx1ZSk7XHJcbiAgICAgIHRoZWlyU2NvcmUgPSBOdW1iZXIoaW5wdF9ibHVlU2NvcmUudmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbXlTY29yZSA9IE51bWJlcihpbnB0X2JsdWVTY29yZS52YWx1ZSk7XHJcbiAgICAgIHRoZWlyU2NvcmUgPSBOdW1iZXIoaW5wdF9vcmFuZ2VTY29yZS52YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGxldCBvdmVydGltZTtcclxuICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgIGlmIChzZWxfb3ZlcnRpbWUudmFsdWUgPT09IFwiT3ZlcnRpbWVcIikge1xyXG4gICAgICBvdmVydGltZSA9IHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvdmVydGltZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBnYW1lRGF0YU9iaiA9IHtcclxuICAgICAgXCJ1c2VySWRcIjogYWN0aXZlVXNlcklkLFxyXG4gICAgICBcIm1vZGVcIjogZ2FtZU1vZGUsXHJcbiAgICAgIFwidHlwZVwiOiBnYW1lVHlwZSxcclxuICAgICAgXCJ0ZWFtXCI6IG15VGVhbSxcclxuICAgICAgXCJzY29yZVwiOiBteVNjb3JlLFxyXG4gICAgICBcIm9wcF9zY29yZVwiOiB0aGVpclNjb3JlLFxyXG4gICAgICBcIm92ZXJ0aW1lXCI6IG92ZXJ0aW1lLFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSBuZXcgZ2FtZSBvciBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZC4gSWYgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQsIHRoZW4gdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHNob3Qgc2F2ZWQgYWxyZWFkeSwgbWFraW5nIHRoZSByZXR1cm4gZnJvbSB0aGUgc2hvdERhdGEgZnVuY3Rpb24gbW9yZSB0aGFuIDBcclxuICAgIGNvbnN0IHNhdmluZ0VkaXRlZEdhbWUgPSBzaG90RGF0YS5nZXRJbml0aWFsTnVtT2ZTaG90cygpXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHNhdmVkR2FtZU9iamVjdC50aW1lU3RhbXBcclxuICAgICAgZ2FtZURhdGEuc2F2ZURhdGEoZ2FtZURhdGFPYmosIHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdGltZSBzdGFtcCBpZiBuZXcgZ2FtZVxyXG4gICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuICAgICAgZ2FtZURhdGFPYmoudGltZVN0YW1wID0gdGltZVN0YW1wXHJcbiAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNhdmVQcmV2R2FtZUVkaXRzKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJzYXZpbmcgZWRpdHMuLi5cIilcclxuICAgIGdhbWVEYXRhLnBhY2thZ2VHYW1lRGF0YSgpO1xyXG4gICAgLy8gVE9ETzogKChTVEVQIDMpKSBQVVQgZWRpdHMgdG8gZGF0YWJhc2VcclxuICB9LFxyXG5cclxuICBjYW5jZWxFZGl0aW5nTW9kZSgpIHtcclxuICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyRWRpdEJ1dHRvbnMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlbW92ZXMgJiByZXBsYWNlcyBlZGl0IGFuZCBzYXZlIGdhbWUgYnV0dG9ucyB3aXRoIFwiU2F2ZSBFZGl0c1wiIGFuZCBcIkNhbmNlbCBFZGl0c1wiXHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgLy8gaW4gY2FzZSBvZiBsYWcgaW4gZmV0Y2gsIHByZXZlbnQgdXNlciBmcm9tIGRvdWJsZSBjbGlja2luZyBidXR0b25cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5jbGFzc0xpc3QuYWRkKFwiaXMtbG9hZGluZ1wiKTtcclxuXHJcbiAgICBjb25zdCBidG5fY2FuY2VsRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBFZGl0c1wiKVxyXG4gICAgY29uc3QgYnRuX3NhdmVFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEVkaXRzXCIpXHJcblxyXG4gICAgYnRuX2NhbmNlbEVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5jYW5jZWxFZGl0aW5nTW9kZSlcclxuICAgIGJ0bl9zYXZlRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnNhdmVQcmV2R2FtZUVkaXRzKVxyXG5cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUucmVwbGFjZVdpdGgoYnRuX2NhbmNlbEVkaXRzKTtcclxuICAgIGJ0bl9zYXZlR2FtZS5yZXBsYWNlV2l0aChidG5fc2F2ZUVkaXRzKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyUHJldkdhbWUoZ2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgcmVuZGVyaW5nIHRoZSBzYXZlZCBnYW1lIGluZm9ybWF0aW9uIGluIHRoZSBcIkVudGVyIEdhbWUgRGF0YVwiIGNvbnRhaW5lci5cclxuICAgIC8vIGl0IHJlbGllcyBvbiBhIGZ1bmN0aW9uIGluIHNob3REYXRhLmpzIHRvIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBjb25zb2xlLmxvZyhnYW1lKVxyXG5cclxuICAgIC8vIGNhbGwgZnVuY3Rpb24gaW4gc2hvdERhdGEgdGhhdCBjYWxscyBnYW1hRGF0YS5wcm92aWRlU2hvdHNUb1Nob3REYXRhKClcclxuICAgIC8vIHRoZSBmdW5jdGlvbiB3aWxsIGNhcHR1cmUgdGhlIGFycmF5IG9mIHNhdmVkIHNob3RzIGFuZCByZW5kZXIgdGhlIHNob3QgYnV0dG9uc1xyXG4gICAgc2hvdERhdGEucmVuZGVyU2hvdHNCdXR0b25zRnJvbVByZXZpb3VzR2FtZSgpXHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLm92ZXJ0aW1lKSB7XHJcbiAgICAgIHNlbF9vdmVydGltZS52YWx1ZSA9IFwiT3ZlcnRpbWVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX292ZXJ0aW1lLnZhbHVlID0gXCJObyBvdmVydGltZVwiXHJcbiAgICB9XHJcblxyXG4gICAgLy8gbXkgdGVhbVxyXG4gICAgY29uc3Qgc2VsX3RlYW1Db2xvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUudGVhbSA9PT0gXCJvcmFuZ2VcIikge1xyXG4gICAgICBzZWxfdGVhbUNvbG9yLnZhbHVlID0gXCJPcmFuZ2UgdGVhbVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfdGVhbUNvbG9yLnZhbHVlID0gXCJCbHVlIHRlYW1cIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIG15IHNjb3JlXHJcbiAgICBjb25zdCBpbnB0X29yYW5nZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvcmFuZ2VTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF9ibHVlU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJsdWVTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIGlmIChnYW1lLnRlYW0gPT09IFwib3JhbmdlXCIpIHtcclxuICAgICAgaW5wdF9vcmFuZ2VTY29yZS52YWx1ZSA9IGdhbWUuc2NvcmU7XHJcbiAgICAgIGlucHRfYmx1ZVNjb3JlLnZhbHVlID0gZ2FtZS5vcHBfc2NvcmU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbnB0X29yYW5nZVNjb3JlLnZhbHVlID0gZ2FtZS5vcHBfc2NvcmU7XHJcbiAgICAgIGlucHRfYmx1ZVNjb3JlLnZhbHVlID0gZ2FtZS5zY29yZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcblxyXG4gICAgaWYgKGdhbWUudHlwZSA9PT0gXCIzdjNcIikge1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzN2My5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgLy8gMnYyIGlzIHRoZSBkZWZhdWx0XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIGlmIChnYW1lLnR5cGUgPT09IFwiMnYyXCIpIHtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzF2MS5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5tb2RlID0gXCJjb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIHNlbF9nYW1lTW9kZS52YWx1ZSA9IFwiQ29tcGV0aXRpdmVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDYXN1YWxcIlxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBwcm92aWRlU2hvdHNUb1Nob3REYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBwcm92aWRlcyB0aGUgc2hvdHMgZm9yIHJlbmRlcmluZyB0byBzaG90RGF0YVxyXG4gICAgcmV0dXJuIHNhdmVkR2FtZU9iamVjdFxyXG4gIH0sXHJcblxyXG4gIGVkaXRQcmV2R2FtZSgpIHtcclxuICAgIC8vIGZldGNoIGNvbnRlbnQgZnJvbSBtb3N0IHJlY2VudCBnYW1lIHNhdmVkIHRvIGJlIHJlbmRlcmVkXHJcblxyXG4gICAgLy8gVE9ETzogY3JlYXRlIGEgbW9kYWwgYXNraW5nIHVzZXIgaWYgdGhleSB3YW50IHRvIGVkaXQgcHJldmlvdXMgZ2FtZVxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuXHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGAke2FjdGl2ZVVzZXJJZH0/X2VtYmVkPWdhbWVzYCkudGhlbih1c2VyID0+IHtcclxuICAgICAgaWYgKHVzZXIuZ2FtZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYWxlcnQoXCJObyBnYW1lcyBoYXZlIGJlZW4gc2F2ZWQgYnkgdGhpcyB1c2VyXCIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGdldCBtYXggZ2FtZSBpZCAod2hpY2ggaXMgdGhlIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQpXHJcbiAgICAgICAgY29uc3QgcmVjZW50R2FtZUlkID0gdXNlci5nYW1lcy5yZWR1Y2UoKG1heCwgb2JqKSA9PiBvYmouaWQgPiBtYXggPyBvYmouaWQgOiBtYXgsIHVzZXIuZ2FtZXNbMF0uaWQpO1xyXG4gICAgICAgIC8vIGZldGNoIG1vc3QgcmVjZW50IGdhbWUgYW5kIGVtYmVkIHNob3RzXHJcbiAgICAgICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJnYW1lc1wiLCBgJHtyZWNlbnRHYW1lSWR9P19lbWJlZD1zaG90c2ApLnRoZW4oZ2FtZU9iaiA9PiB7XHJcbiAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgZ2FtZURhdGEucmVuZGVyRWRpdEJ1dHRvbnMoKTtcclxuICAgICAgICAgIHNhdmVkR2FtZU9iamVjdCA9IGdhbWVPYmo7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJQcmV2R2FtZShnYW1lT2JqKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVEYXRhIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgZ2FtZXBsYXkgPSB7XHJcblxyXG4gIGxvYWRHYW1lcGxheSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIC8vIGNvbnN0IHhCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiZGVsZXRlXCIgfSk7XHJcbiAgICAvLyB4QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZUJveCwgZXZlbnQpOyAvLyBidXR0b24gd2lsbCBkaXNwbGF5OiBub25lIG9uIHBhcmVudCBjb250YWluZXJcclxuICAgIC8vIGNvbnN0IGhlYWRlckluZm8gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uIGlzLWluZm9cIiB9LCBcIkNyZWF0ZSBhbmQgc2F2ZSBzaG90cyAtIHRoZW4gc2F2ZSB0aGUgZ2FtZSByZWNvcmQuXCIsIHhCdXR0b24pO1xyXG4gICAgLy8gd2VicGFnZS5hcHBlbmRDaGlsZChoZWFkZXJJbmZvKTtcclxuICAgIHRoaXMuYnVpbGRTaG90Q29udGVudCgpO1xyXG4gICAgdGhpcy5idWlsZEdhbWVDb250ZW50KCk7XHJcbiAgICB0aGlzLmdhbWVwbGF5RXZlbnRNYW5hZ2VyKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRTaG90Q29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYnVpbGRzIHNob3QgY29udGFpbmVycyBhbmQgYWRkcyBjb250YWluZXIgY29udGVudFxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3Qgc2hvdFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgU2hvdCBEYXRhXCIpO1xyXG4gICAgY29uc3Qgc2hvdFRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdFRpdGxlKTtcclxuXHJcbiAgICAvLyBuZXcgc2hvdCBhbmQgc2F2ZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IG5ld1Nob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwibmV3U2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIk5ldyBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2F2ZVNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZVNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIFNob3RcIik7XHJcbiAgICBjb25zdCBjYW5jZWxTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbFNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwic2hvdENvbnRyb2xzXCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGJ1dHRvbnNcIiB9LCBudWxsLCBuZXdTaG90LCBzYXZlU2hvdCwgY2FuY2VsU2hvdCk7XHJcbiAgICBjb25zdCBhbGlnblNob3RCdXR0b25zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBzaG90QnV0dG9ucyk7XHJcbiAgICBjb25zdCBzaG90QnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25TaG90QnV0dG9ucyk7XHJcblxyXG4gICAgLy8gYmFsbCBzcGVlZCBpbnB1dCBhbmQgYWVyaWFsIHNlbGVjdFxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJCYWxsIHNwZWVkIChrcGgpOlwiKVxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJiYWxsU3BlZWRJbnB1dFwiLCBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBpbnB1dFwiLCBcInR5cGVcIjpcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgYmFsbCBzcGVlZFwiIH0pO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTdGFuZGFyZFwiKTtcclxuICAgIGNvbnN0IGFlcmlhbE9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQWVyaWFsXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImFlcmlhbElucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxPcHRpb24xLCBhZXJpYWxPcHRpb24yKTtcclxuICAgIGNvbnN0IGFlcmlhbFNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxTZWxlY3QpO1xyXG4gICAgY29uc3QgYWVyaWFsQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBhZXJpYWxTZWxlY3RQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIGJhbGxTcGVlZElucHV0VGl0bGUsIGJhbGxTcGVlZElucHV0LCBhZXJpYWxDb250cm9sKTtcclxuICAgIGNvbnN0IHNob3REZXRhaWxzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdERldGFpbHMpO1xyXG5cclxuICAgIC8vIGZpZWxkIGFuZCBnb2FsIGltYWdlcyAobm90ZSBmaWVsZC1pbWcgaXMgY2xpcHBlZCB0byByZXN0cmljdCBjbGljayBhcmVhIGNvb3JkaW5hdGVzIGluIGxhdGVyIGZ1bmN0aW9uLlxyXG4gICAgLy8gZ29hbC1pbWcgdXNlcyBhbiB4L3kgZm9ybXVsYSBmb3IgY2xpY2sgYXJlYSBjb29yZGluYXRlcyByZXN0cmljdGlvbiwgc2luY2UgaXQncyBhIHJlY3RhbmdsZSlcclxuICAgIC8vIGFkZGl0aW9uYWxseSwgZmllbGQgYW5kIGdvYWwgYXJlIG5vdCBhbGlnbmVkIHdpdGggbGV2ZWwtbGVmdCBvciBsZXZlbC1yaWdodCAtIGl0J3MgYSBkaXJlY3QgbGV2ZWwgLS0+IGxldmVsLWl0ZW0gZm9yIGNlbnRlcmluZ1xyXG4gICAgY29uc3QgZmllbGRJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZUJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLWJnXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwiXCIgfSwgbnVsbCwgZmllbGRJbWFnZUJhY2tncm91bmQsIGZpZWxkSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZmllbGRJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvUkxfZ29hbF9jcm9wcGVkX25vX2JnX0JXLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdvYWxJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkdvYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdvYWxJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnbkZpZWxkLCBhbGlnbkdvYWwpO1xyXG5cclxuICAgIC8vIHBhcmVudCBjb250YWluZXIgaG9sZGluZyBhbGwgc2hvdCBpbmZvcm1hdGlvblxyXG4gICAgY29uc3QgcGFyZW50U2hvdENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgc2hvdFRpdGxlQ29udGFpbmVyLCBzaG90QnV0dG9uQ29udGFpbmVyLCBzaG90RGV0YWlsc0NvbnRhaW5lciwgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyKVxyXG5cclxuICAgIC8vIGFwcGVuZCBzaG90cyBjb250YWluZXIgdG8gcGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRTaG90Q29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdhbWVDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBjcmVhdGVzIGdhbWUgY29udGVudCBjb250YWluZXJzICh0ZWFtLCBnYW1lIHR5cGUsIGdhbWUgbW9kZSwgZXRjLilcclxuXHJcbiAgICAvLyBjb250YWluZXIgdGl0bGVcclxuICAgIGNvbnN0IGdhbWVUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIHRpdGxlIGlzLTRcIiB9LCBcIkVudGVyIEdhbWUgRGF0YVwiKTtcclxuICAgIGNvbnN0IHRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVRpdGxlKTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIHRvcCBjb250YWluZXJcclxuXHJcbiAgICAvLyAxdjEvMnYyLzN2MyBidXR0b25zIChub3RlOiBjb250cm9sIGNsYXNzIGlzIHVzZWQgd2l0aCBmaWVsZCB0byBhZGhlcmUgYnV0dG9ucyB0b2dldGhlcilcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8zdjNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiM3YzXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjNDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTN2Myk7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMnYyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc2VsZWN0ZWQgaXMtbGlua1wiIH0sIFwiMnYyXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjJDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTJ2Mik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUxdjEpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBoYXMtYWRkb25zXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjNDb250cm9sLCBnYW1lVHlwZTJ2MkNvbnRyb2wsIGdhbWVUeXBlMXYxQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25GaWVsZCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIHNlbGVjdFxyXG4gICAgY29uc3QgbW9kZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ2FzdWFsXCIpO1xyXG4gICAgY29uc3QgbW9kZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImdhbWVNb2RlSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVPcHRpb24xLCBtb2RlT3B0aW9uMik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVTZWxlY3QpO1xyXG4gICAgY29uc3QgbW9kZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgbW9kZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gdGVhbSBzZWxlY3RcclxuICAgIGNvbnN0IHRlYW1PcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9yYW5nZSB0ZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQmx1ZSB0ZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJ0ZWFtSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1PcHRpb24xLCB0ZWFtT3B0aW9uMik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1TZWxlY3QpO1xyXG4gICAgY29uc3QgdGVhbUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgdGVhbVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWUgc2VsZWN0XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gb3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJvdmVydGltZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZU9wdGlvbjEsIG92ZXJ0aW1lT3B0aW9uMik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdCk7XHJcbiAgICBjb25zdCBvdmVydGltZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gYm90dG9tIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIHNjb3JlIGlucHV0c1xyXG4gICAgLy8gKioqKk5vdGUgaW5saW5lIHN0eWxpbmcgb2YgaW5wdXQgd2lkdGhzXHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiT3JhbmdlIHRlYW0gc2NvcmU6XCIpO1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm9yYW5nZVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgb3JhbmdlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCBvcmFuZ2VTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiQmx1ZSB0ZWFtIHNjb3JlOlwiKVxyXG4gICAgY29uc3QgYmx1ZVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJibHVlU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBibHVlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgYmx1ZVNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3Qgc2NvcmVJbnB1dENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgb3JhbmdlU2NvcmVJbnB1dFRpdGxlLCBvcmFuZ2VTY29yZUNvbnRyb2wsIGJsdWVTY29yZUlucHV0VGl0bGUsIGJsdWVTY29yZUNvbnRyb2wpO1xyXG5cclxuICAgIC8vIGVkaXQvc2F2ZSBnYW1lIGJ1dHRvbnNcclxuICAgIGNvbnN0IGVkaXRQcmV2aW91c0dhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZWRpdFByZXZHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJFZGl0IFByZXZpb3VzIEdhbWVcIik7XHJcbiAgICBjb25zdCBzYXZlR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlR2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgR2FtZVwiKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25BbGlnbm1lbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9ucyBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgc2F2ZUdhbWUsIGVkaXRQcmV2aW91c0dhbWUpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1yaWdodFwiIH0sIG51bGwsIGdhbWVCdXR0b25BbGlnbm1lbnQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyVG9wID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25Db250YWluZXIsIG1vZGVDb250cm9sLCB0ZWFtQ29udHJvbCwgb3ZlcnRpbWVDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJCb3R0b20gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzY29yZUlucHV0Q29udGFpbmVyLCBnYW1lQnV0dG9uQ29udGFpbmVyKTtcclxuICAgIGNvbnN0IHBhcmVudEdhbWVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHRpdGxlQ29udGFpbmVyLCBnYW1lQ29udGFpbmVyVG9wLCBnYW1lQ29udGFpbmVyQm90dG9tKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50R2FtZUNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlFdmVudE1hbmFnZXIoKSB7XHJcblxyXG4gICAgLy8gYnV0dG9uc1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZVNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2NhbmNlbFNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbmNlbFNob3RcIik7XHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lcnNcclxuICAgIGJ0bl9uZXdTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jcmVhdGVOZXdTaG90KTtcclxuICAgIGJ0bl9zYXZlU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuc2F2ZVNob3QpO1xyXG4gICAgYnRuX2NhbmNlbFNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmNhbmNlbFNob3QpO1xyXG4gICAgYnRuX3NhdmVHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5wYWNrYWdlR2FtZURhdGEpO1xyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZ2FtZVR5cGVCdXR0b25Ub2dnbGUpKTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmVkaXRQcmV2R2FtZSlcclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZXBsYXkiLCJpbXBvcnQgaGVhdG1hcCBmcm9tIFwiLi4vbGliL25vZGVfbW9kdWxlcy9oZWF0bWFwLmpzL2J1aWxkL2hlYXRtYXAuanNcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSS5qc1wiO1xyXG5pbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyLmpzXCI7XHJcblxyXG4vLyBJRCBvZiBzZXRJbnRlcnZhbCBmdW5jdGlvbiB1c2VkIHRvIG1vbml0b3IgY29udGFpbmVyIHdpZHRoIGFuZCByZXBhaW50IGhlYXRtYXAgaWYgY29udGFpbmVyIHdpZHRoIGNoYW5nZXNcclxuLy8gbGV0IGludGVydmFsSWQ7XHJcbi8vIGdsb2JhbCB2YXJpYWJsZSB0byBzdG9yZSBmZXRjaGVkIHNob3RzXHJcbmxldCBnbG9iYWxTaG90c0FycjtcclxubGV0IGpvaW5UYWJsZUFyciA9IFtdO1xyXG5cclxuLy8gRklYTUU6IGV4YW1pbmUgY29uZmlybUhlYXRtYXBEZWxldGUgZnVuY3Rpb24uIG1heSBub3QgbmVlZCBmb3IgbG9vcC4gZ3JhYiBJRCBmcm9tIG9wdGlvblxyXG4vLyBUT0RPOiBzZXQgaW50ZXJ2YWwgZm9yIGNvbnRhaW5lciB3aWR0aCBtb25pdG9yaW5nXHJcbi8vIFRPRE86IGFkZCBmaWx0ZXIgY29tcGF0aWJpbGl0eVxyXG4vLyBUT0RPOiBpZiBjdXN0b20gaGVhdG1hcCBpcyBzZWxlY3RlZCBmcm9tIGRyb3Bkb3duLCB0aGVuIGJsdXIgZmlsdGVyIGNvbnRhaW5lclxyXG5cclxuY29uc3QgaGVhdG1hcERhdGEgPSB7XHJcblxyXG4gIGdldFVzZXJTaG90cygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVtb3ZlcyBhbiBleGlzdGluZyBoZWF0bWFwIGlmIG5lY2Vzc2FyeSBhbmQgdGhlbiBkZXRlcm1pbmVzIHdoZXRoZXJcclxuICAgIC8vIHRvIGNhbGwgdGhlIGJhc2ljIGhlYXRtYXAgb3Igc2F2ZWQgaGVhdG1hcCBmdW5jdGlvbnNcclxuXHJcbiAgICBjb25zdCBmaWVsZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG5cclxuICAgIGNvbnN0IGhlYXRtYXBOYW1lID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG4gICAgY29uc3QgZmllbGRIZWF0bWFwQ2FudmFzID0gZmllbGRDb250YWluZXIuY2hpbGROb2Rlc1syXVxyXG4gICAgY29uc3QgZ29hbEhlYXRtYXBDYW52YXMgPSBnb2FsQ29udGFpbmVyLmNoaWxkTm9kZXNbMV1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIGFscmVhZHkgYSBoZWF0bWFwIGxvYWRlZCwgcmVtb3ZlIGl0IGJlZm9yZSBjb250aW51aW5nXHJcbiAgICBpZiAoZmllbGRIZWF0bWFwQ2FudmFzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgZmllbGRIZWF0bWFwQ2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICBnb2FsSGVhdG1hcENhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgaWYgKGhlYXRtYXBOYW1lID09PSBcIkJhc2ljIEhlYXRtYXBcIikge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoQmFzaWNIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaGVhdG1hcE5hbWUgPT09IFwiQmFzaWMgSGVhdG1hcFwiKSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGVhdG1hcERhdGEuZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBmZXRjaEJhc2ljSGVhdG1hcERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIGRhdGFiYXNlIGFuZCByZXRyaWV2ZXMgc2hvdHMgdGhhdCBtZWV0IHNwZWNpZmljIGZpbHRlcnMgKGFsbCBzaG90cyBmZXRjaGVkIGlmIClcclxuICAgIGxldCBnYW1lSWRzID0gW107XHJcbiAgICBjb25zdCBnYW1lUmVzdWx0RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVJlc3VsdFwiKS52YWx1ZTtcclxuICAgIGNvbnN0IGdhbWVVUkxleHRlbnNpb24gPSBoZWF0bWFwRGF0YS5hcHBseUdhbWVGaWx0ZXJzKCk7XHJcblxyXG4gICAgQVBJLmdldEFsbChnYW1lVVJMZXh0ZW5zaW9uKVxyXG4gICAgICAudGhlbihnYW1lcyA9PiB7XHJcbiAgICAgICAgZ2FtZXMuZm9yRWFjaChnYW1lID0+IHtcclxuICAgICAgICAgIC8vIGdhbWUgcmVzdWx0IGZpbHRlciBjYW5ub3QgYmUgYXBwbGllZCBpbiBnYW1lVVJMZXh0ZW5zaW9uLCBzbyBpdCBpcyBhcHBsaWVkIGhlcmVcclxuICAgICAgICAgIC8vIGlmIHZpY3RvcnksIHRoZW4gY2hlY2sgZm9yIGdhbWUncyBzY29yZSB2cyBnYW1lJ3Mgb3Bwb25lbnQgc2NvcmVcclxuICAgICAgICAgIC8vIGlmIHRoZSBmaWx0ZXIgaXNuJ3Qgc2VsZWN0ZWQgYXQgYWxsLCBwdXNoIGFsbCBnYW1lIElEcyB0byBnYW1lSWRzIGFycmF5XHJcbiAgICAgICAgICBpZiAoZ2FtZVJlc3VsdEZpbHRlciA9PT0gXCJWaWN0b3J5XCIpIHtcclxuICAgICAgICAgICAgaWYgKGdhbWUuc2NvcmUgPiBnYW1lLm9wcF9zY29yZSkge1xyXG4gICAgICAgICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIGlmIChnYW1lUmVzdWx0RmlsdGVyID09PSBcIkRlZmVhdFwiKSB7XHJcbiAgICAgICAgICAgIGlmIChnYW1lLnNjb3JlIDwgZ2FtZS5vcHBfc2NvcmUpIHtcclxuICAgICAgICAgICAgICBnYW1lSWRzLnB1c2goZ2FtZS5pZCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGdhbWVJZHMucHVzaChnYW1lLmlkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBnYW1lSWRzO1xyXG4gICAgICB9KVxyXG4gICAgICAudGhlbihnYW1lSWRzID0+IHtcclxuICAgICAgICBpZiAoZ2FtZUlkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGFsZXJ0KFwiU29ycnkhIEVpdGhlciBubyBzaG90cyBoYXZlIGJlZW4gc2F2ZWQgeWV0IG9yIG5vIGdhbWVzIG1hdGNoIHRoZSBjdXJyZW50IGZpbHRlcnMuIFZpc2l0IHRoZSBHYW1lcGxheSBwYWdlIHRvIGdldCBzdGFydGVkIG9yIHRvIGFkZCBtb3JlIHNob3RzLlwiKVxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IHNob3RVUkxleHRlbnNpb24gPSBoZWF0bWFwRGF0YS5hcHBseVNob3RGaWx0ZXJzKGdhbWVJZHMpO1xyXG4gICAgICAgICAgQVBJLmdldEFsbChzaG90VVJMZXh0ZW5zaW9uKVxyXG4gICAgICAgICAgICAudGhlbihzaG90cyA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHNob3RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJTb3JyeSEgTm8gc2hvdHMgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy4gVmlzaXQgdGhlIEdhbWVwbGF5IHBhZ2UgdG8gZ2V0IHN0YXJ0ZWQgb3IgYWRkIHRvIG1vcmUgc2hvdHMuXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZ2xvYmFsU2hvdHNBcnIgPSBzaG90cztcclxuICAgICAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkRmllbGRIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgICAgICAgIGhlYXRtYXBEYXRhLmJ1aWxkR29hbEhlYXRtYXAoc2hvdHMpO1xyXG4gICAgICAgICAgICAgICAgLy8gaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKGhlYXRtYXBEYXRhLmdldEFjdGl2ZU9mZnNldHMsIDUwMCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgZmV0Y2hTYXZlZEhlYXRtYXBEYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiwgYW5kIGl0cyBjb3VudGVycGFydCBmZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMgcmVuZGVyIGFuIGFscmVhZHktc2F2ZWQgaGVhdG1hcCB0aG91Z2ggdGhlc2Ugc3RlcHM6XHJcbiAgICAvLyAxLiBnZXR0aW5nIHRoZSBoZWF0bWFwIG5hbWUgZnJvbSB0aGUgZHJvcGRvd24gdmFsdWVcclxuICAgIC8vIDIuIHVzaW5nIHRoZSBuYW1lIHRvIGZpbmQgdGhlIGNoaWxkTm9kZXMgaW5kZXggb2YgdGhlIGRyb3Bkb3duIHZhbHVlIChpLmUuIHdoaWNoIEhUTUwgPG9wdGlvbj4pIGFuZCBnZXQgaXRzIElEXHJcbiAgICAvLyAzLiBmZXRjaCBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzIHdpdGggbWF0Y2hpbmcgaGVhdG1hcCBJRFxyXG4gICAgLy8gNC4gZmV0Y2ggc2hvdHMgdXNpbmcgc2hvdCBJRHMgZnJvbSBqb2luIHRhYmxlc1xyXG4gICAgLy8gNS4gcmVuZGVyIGhlYXRtYXAgYnkgY2FsbGluZyBidWlsZCBmdW5jdGlvbnNcclxuXHJcbiAgICAvLyBzdGVwIDE6IGdldCBuYW1lIG9mIGhlYXRtYXBcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG4gICAgLy8gc3RlcCAyOiB1c2UgbmFtZSB0byBnZXQgaGVhdG1hcCBJRCBzdG9yZWQgaW4gSFRNTCBvcHRpb24gZWxlbWVudFxyXG4gICAgbGV0IGN1cnJlbnRIZWF0bWFwSWQ7XHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkge1xyXG4gICAgICAgIGN1cnJlbnRIZWF0bWFwSWQgPSBjaGlsZC5pZC5zbGljZSg4KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBzdGVwIDM6IGZldGNoIGpvaW4gdGFibGVzXHJcbiAgICBBUEkuZ2V0QWxsKGBzaG90X2hlYXRtYXA/aGVhdG1hcElkPSR7Y3VycmVudEhlYXRtYXBJZH1gKVxyXG4gICAgICAudGhlbihqb2luVGFibGVzID0+IGhlYXRtYXBEYXRhLmZldGNoU2F2ZWRTaG90c1VzaW5nSm9pblRhYmxlcyhqb2luVGFibGVzKVxyXG4gICAgICAgIC8vIHN0ZXAgNTogcGFzcyBzaG90cyB0byBidWlsZEZpZWxkSGVhdG1hcCgpIGFuZCBidWlsZEdvYWxIZWF0bWFwKClcclxuICAgICAgICAudGhlbihzaG90cyA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhzaG90cyk7XHJcbiAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEZpZWxkSGVhdG1hcChzaG90cyk7XHJcbiAgICAgICAgICBoZWF0bWFwRGF0YS5idWlsZEdvYWxIZWF0bWFwKHNob3RzKTtcclxuICAgICAgICAgIGpvaW5UYWJsZUFyciA9IFtdO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIClcclxuICB9LFxyXG5cclxuICBmZXRjaFNhdmVkU2hvdHNVc2luZ0pvaW5UYWJsZXMoam9pblRhYmxlcykge1xyXG4gICAgLy8gc2VlIG5vdGVzIG9uIGZldGNoU2F2ZWRIZWF0bWFwRGF0YSgpXHJcbiAgICBqb2luVGFibGVzLmZvckVhY2godGFibGUgPT4ge1xyXG4gICAgICAvLyBzdGVwIDQuIHRoZW4gZmV0Y2ggdXNpbmcgZWFjaCBzaG90SWQgaW4gdGhlIGpvaW4gdGFibGVzXHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5nZXRTaW5nbGVJdGVtKFwic2hvdHNcIiwgdGFibGUuc2hvdElkKSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoam9pblRhYmxlQXJyKVxyXG4gIH0sXHJcblxyXG4gIGFwcGx5R2FtZUZpbHRlcnMoKSB7IC8vIFRPRE86IGFkZCBtb3JlIGZpbHRlcnNcclxuICAgIC8vIE5PVEU6IGdhbWUgcmVzdWx0IGZpbHRlciAodmljdG9yeS9kZWZlYXQpIGNhbm5vdCBiZSBhcHBsaWVkIGluIHRoaXMgZnVuY3Rpb24gYW5kIGlzIGFwcGxpZWQgYWZ0ZXIgdGhlIGZldGNoXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lTW9kZVwiKS52YWx1ZTtcclxuICAgIGxldCBVUkwgPSBcImdhbWVzXCI7XHJcblxyXG4gICAgVVJMICs9IGA/dXNlcklkPSR7YWN0aXZlVXNlcklkfWA7XHJcbiAgICAvLyBnYW1lIG1vZGVcclxuICAgIGlmIChnYW1lTW9kZUZpbHRlciA9PT0gXCJDb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZtb2RlPWNvbXBldGl0aXZlXCJcclxuICAgIH0gZWxzZSBpZiAoZ2FtZU1vZGVGaWx0ZXIgPT09IFwiQ2FzdWFsXCIpIHtcclxuICAgICAgVVJMICs9IFwiJm1vZGU9Y2FzdWFsXCJcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVVJMO1xyXG4gIH0sXHJcblxyXG4gIGFwcGx5U2hvdEZpbHRlcnMoZ2FtZUlkcykge1xyXG4gICAgY29uc3Qgc2hvdFR5cGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1zaG90VHlwZVwiKS52YWx1ZTtcclxuICAgIGxldCBVUkwgPSBcInNob3RzXCJcclxuXHJcbiAgICAvLyBnYW1lIElEXHJcbiAgICAvLyBmb3IgZWFjaCBnYW1lSWQsIGFwcGVuZCBVUkwuIEFwcGVuZCAmIGluc3RlYWQgb2YgPyBvbmNlIGZpcnN0IGdhbWVJZCBpcyBhZGRlZCB0byBVUkxcclxuICAgIGlmIChnYW1lSWRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgbGV0IGdhbWVJZENvdW50ID0gMDtcclxuICAgICAgZ2FtZUlkcy5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgICBpZiAoZ2FtZUlkQ291bnQgPCAxKSB7XHJcbiAgICAgICAgICBVUkwgKz0gYD9nYW1lSWQ9JHtpZH1gO1xyXG4gICAgICAgICAgZ2FtZUlkQ291bnQrKztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgVVJMICs9IGAmZ2FtZUlkPSR7aWR9YDtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9IC8vIGVsc2Ugc3RhdGVtZW50IGlzIGhhbmRsZWQgaW4gZmV0Y2hCYXNpY0hlYXRtYXBEYXRhKClcclxuICAgIC8vIHNob3QgdHlwZVxyXG4gICAgaWYgKHNob3RUeXBlRmlsdGVyID09PSBcIkFlcmlhbFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZhZXJpYWw9dHJ1ZVwiO1xyXG4gICAgfSBlbHNlIGlmIChzaG90VHlwZUZpbHRlciA9PT0gXCJTdGFuZGFyZFwiKSB7XHJcbiAgICAgIFVSTCArPSBcIiZhZXJpYWw9ZmFsc2VcIlxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFVSTDtcclxuICB9LFxyXG5cclxuICBidWlsZEZpZWxkSGVhdG1hcChzaG90cykge1xyXG4gICAgY29uc29sZS5sb2coXCJBcnJheSBvZiBmZXRjaGVkIHNob3RzXCIsIHNob3RzKVxyXG5cclxuICAgIC8vIGNyZWF0ZSBmaWVsZCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZmllbGRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBsZXQgdmFyV2lkdGggPSBmaWVsZENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB2YXJIZWlnaHQgPSBmaWVsZENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgbGV0IGZpZWxkQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0RmllbGRDb25maWcoZmllbGRDb250YWluZXIpO1xyXG5cclxuICAgIGxldCBGaWVsZEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIEZpZWxkSGVhdG1hcEluc3RhbmNlID0gaGVhdG1hcC5jcmVhdGUoZmllbGRDb25maWcpO1xyXG5cclxuICAgIGxldCBmaWVsZERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZmllbGRYICogdmFyV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZmllbGRZICogdmFySGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIGxldCBmaWVsZE9iaiA9IHsgeDogeF8sIHk6IHlfLCB2YWx1ZTogdmFsdWVfIH07XHJcbiAgICAgIGZpZWxkRGF0YVBvaW50cy5wdXNoKGZpZWxkT2JqKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGZpZWxkRGF0YSA9IHtcclxuICAgICAgbWF4OiAxLFxyXG4gICAgICBtaW46IDAsXHJcbiAgICAgIGRhdGE6IGZpZWxkRGF0YVBvaW50c1xyXG4gICAgfVxyXG5cclxuICAgIEZpZWxkSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZmllbGREYXRhKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdvYWxIZWF0bWFwKHNob3RzKSB7XHJcbiAgICAvLyBjcmVhdGUgZ29hbCBoZWF0bWFwIHdpdGggY29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgZ29hbENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgbGV0IHZhckdvYWxXaWR0aCA9IGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgdmFyR29hbEhlaWdodCA9IGdvYWxDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIGxldCBnb2FsQ29uZmlnID0gaGVhdG1hcERhdGEuZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKTtcclxuXHJcbiAgICBsZXQgR29hbEhlYXRtYXBJbnN0YW5jZTtcclxuICAgIEdvYWxIZWF0bWFwSW5zdGFuY2UgPSBoZWF0bWFwLmNyZWF0ZShnb2FsQ29uZmlnKTtcclxuXHJcbiAgICBsZXQgZ29hbERhdGFQb2ludHMgPSBbXTtcclxuXHJcbiAgICBzaG90cy5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICBsZXQgeF8gPSBOdW1iZXIoKHNob3QuZ29hbFggKiB2YXJHb2FsV2lkdGgpLnRvRml4ZWQoMCkpO1xyXG4gICAgICBsZXQgeV8gPSBOdW1iZXIoKHNob3QuZ29hbFkgKiB2YXJHb2FsSGVpZ2h0KS50b0ZpeGVkKDApKTtcclxuICAgICAgbGV0IHZhbHVlXyA9IDE7XHJcbiAgICAgIGxldCBnb2FsT2JqID0geyB4OiB4XywgeTogeV8sIHZhbHVlOiB2YWx1ZV8gfTtcclxuICAgICAgZ29hbERhdGFQb2ludHMucHVzaChnb2FsT2JqKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGdvYWxEYXRhID0ge1xyXG4gICAgICBtYXg6IDEsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgZGF0YTogZ29hbERhdGFQb2ludHNcclxuICAgIH1cclxuXHJcbiAgICBHb2FsSGVhdG1hcEluc3RhbmNlLnNldERhdGEoZ29hbERhdGEpO1xyXG4gIH0sXHJcblxyXG4gIGdldEZpZWxkQ29uZmlnKGZpZWxkQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMjVweCBhdCA1NTBweCB3aWR0aCwgb3IgNC41NDUlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGZpZWxkQ29udGFpbmVyLFxyXG4gICAgICByYWRpdXM6IDAuMDQ1NDU0NTQ1ICogZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC41LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuNzVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgZ2V0R29hbENvbmZpZyhnb2FsQ29udGFpbmVyKSB7XHJcbiAgICAvLyBJZGVhbCByYWRpdXMgaXMgYWJvdXQgMzVweCBhdCA1NTBweCB3aWR0aCwgb3IgNi4zNjMlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb250YWluZXI6IGdvYWxDb250YWluZXIsXHJcbiAgICAgIHJhZGl1czogLjA2MzYzNjM2MyAqIGdvYWxDb250YWluZXIub2Zmc2V0V2lkdGgsXHJcbiAgICAgIG1heE9wYWNpdHk6IC41LFxyXG4gICAgICBtaW5PcGFjaXR5OiAwLFxyXG4gICAgICBibHVyOiAuNzVcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgLypnZXRBY3RpdmVPZmZzZXRzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlIHdpZHRoIG9mIHRoZSBoZWF0bWFwIGNvbnRhaW5lciBhdCAwLjUgc2Vjb25kIGludGVydmFscy4gSWYgdGhlIHdpZHRoIGhhcyBjaGFuZ2VkLFxyXG4gICAgLy8gdGhlbiB0aGUgaGVhdG1hcCBjYW52YXMgaXMgcmVwYWludGVkIHRvIGZpdCB3aXRoaW4gdGhlIGNvbnRhaW5lciBsaW1pdHNcclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpXHJcbiAgICBsZXQgY2FwdHVyZVdpZHRoID0gZmllbGRDb250YWluZXIub2Zmc2V0V2lkdGhcclxuICAgIC8vZXZhbHVhdGUgY29udGFpbmVyIHdpZHRoIGFmdGVyIDAuNSBzZWNvbmRzIHZzIGluaXRpYWwgY29udGFpbmVyIHdpZHRoXHJcbiAgICBpZiAoY2FwdHVyZVdpZHRoID09PSB2YXJXaWR0aCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcInVuY2hhbmdlZFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhcldpZHRoID0gY2FwdHVyZVdpZHRoXHJcbiAgICAgIGNvbnNvbGUubG9nKFwibmV3IHdpZHRoXCIsIHZhcldpZHRoKTtcclxuICAgICAgLy9jbGVhciBoZWF0bWFwXHJcbiAgICAgIGZpZWxkQ29udGFpbmVyLnJlbW92ZUNoaWxkKGZpZWxkQ29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xyXG4gICAgICAvL2J1aWxkIGhlYXRtYXAgYWdhaW5cclxuICAgICAgaGVhdG1hcERhdGEuYnVpbGRIZWF0bWFwKCk7XHJcbiAgICB9XHJcbiAgfSwqL1xyXG5cclxuICBzYXZlSGVhdG1hcCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHNhdmluZyBhIGhlYXRtYXAgb2JqZWN0IHdpdGggYSBuYW1lIGFuZCB1c2VySWQsIHRoZW4gbWFraW5nIGpvaW4gdGFibGVzIHdpdGhcclxuICAgIC8vIFRPRE86IHJlcXVpcmUgdW5pcXVlIGhlYXRtYXAgbmFtZSAobWF5IG5vdCBuZWVkIHRvIGRvIHRoaXMgaWYgZnVuY3Rpb24gYmVsb3cgdXNlcyBJRCBpbnN0ZWFkIG9mIG5hbWUpXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGNvbnN0IHNhdmVJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUhlYXRtYXBJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG5cclxuICAgIGNvbnN0IGhlYXRtYXBUaXRsZSA9IHNhdmVJbnB1dC52YWx1ZTtcclxuICAgIGNvbnN0IGZpZWxkSGVhdG1hcENhbnZhcyA9IGZpZWxkQ29udGFpbmVyLmNoaWxkTm9kZXNbMl07XHJcblxyXG4gICAgLy8gaGVhdG1hcCBtdXN0IGhhdmUgYSB0aXRsZSwgdGhlIHRpdGxlIGNhbm5vdCBiZSBcIlNhdmUgc3VjY2Vzc2Z1bCFcIiwgYW5kIHRoZXJlIG11c3QgYmUgYSBoZWF0bWFwIGxvYWRlZCBvbiB0aGUgcGFnZVxyXG4gICAgaWYgKGhlYXRtYXBUaXRsZS5sZW5ndGggPiAwICYmIGhlYXRtYXBUaXRsZSAhPT0gXCJTYXZlIHN1Y2Nlc3NmdWwhXCIgJiYgZmllbGRIZWF0bWFwQ2FudmFzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJzYXZpbmcgaGVhdG1hcC4uLlwiKTtcclxuICAgICAgc2F2ZUlucHV0LmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1kYW5nZXJcIik7XHJcbiAgICAgIGhlYXRtYXBEYXRhLnNhdmVIZWF0bWFwT2JqZWN0KGhlYXRtYXBUaXRsZSlcclxuICAgICAgICAudGhlbihoZWF0bWFwT2JqID0+IGhlYXRtYXBEYXRhLnNhdmVKb2luVGFibGVzKGhlYXRtYXBPYmopLnRoZW4oeCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImpvaW4gdGFibGVzIHNhdmVkXCIsIHgpXHJcbiAgICAgICAgICAvLyBlbXB0eSB0aGUgdGVtcG9yYXJ5IGdsb2JhbCBhcnJheSB1c2VkIHdpdGggUHJvbWlzZS5hbGxcclxuICAgICAgICAgIGpvaW5UYWJsZUFyciA9IFtdXHJcbiAgICAgICAgICAvLyBhcHBlbmQgbmV3bHkgY3JlYXRlZCBoZWF0bWFwIGFzIG9wdGlvbiBlbGVtZW50IGluIHNlbGVjdCBkcm9wZG93blxyXG4gICAgICAgICAgaGVhdG1hcERyb3Bkb3duLmFwcGVuZENoaWxkKGVsQnVpbGRlcihcIm9wdGlvblwiLCB7IFwiaWRcIjogYGhlYXRtYXAtJHtoZWF0bWFwT2JqLmlkfWAgfSwgaGVhdG1hcE9iai5uYW1lKSk7XHJcbiAgICAgICAgICBzYXZlSW5wdXQudmFsdWUgPSBcIlNhdmUgc3VjY2Vzc2Z1bCFcIjtcclxuICAgICAgICB9KSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzYXZlSW5wdXQuY2xhc3NMaXN0LmFkZChcImlzLWRhbmdlclwiKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzYXZlSGVhdG1hcE9iamVjdChoZWF0bWFwVGl0bGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gc2F2ZXMgYSBoZWF0bWFwIG9iamVjdCB3aXRoIHRoZSB1c2VyLXByb3ZpZGVkIG5hbWUgYW5kIHRoZSB1c2VySWRcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuICAgIGNvbnN0IGhlYXRtYXBPYmogPSB7XHJcbiAgICAgIG5hbWU6IGhlYXRtYXBUaXRsZSxcclxuICAgICAgdXNlcklkOiBhY3RpdmVVc2VySWRcclxuICAgIH1cclxuICAgIHJldHVybiBBUEkucG9zdEl0ZW0oXCJoZWF0bWFwc1wiLCBoZWF0bWFwT2JqKVxyXG4gIH0sXHJcblxyXG4gIHNhdmVKb2luVGFibGVzKGhlYXRtYXBPYmopIHtcclxuICAgIGNvbnNvbGUubG9nKFwiZ2xvYmFsc2hvdHNhcnJheVwiLCBnbG9iYWxTaG90c0FycilcclxuICAgIGdsb2JhbFNob3RzQXJyLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIGxldCBqb2luVGFibGVPYmogPSB7XHJcbiAgICAgICAgc2hvdElkOiBzaG90LmlkLFxyXG4gICAgICAgIGhlYXRtYXBJZDogaGVhdG1hcE9iai5pZFxyXG4gICAgICB9XHJcbiAgICAgIGpvaW5UYWJsZUFyci5wdXNoKEFQSS5wb3N0SXRlbShcInNob3RfaGVhdG1hcFwiLCBqb2luVGFibGVPYmopKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGpvaW5UYWJsZUFycilcclxuICB9LFxyXG5cclxuICBkZWxldGVIZWF0bWFwKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyB0aGUgbG9naWMgdGhhdCBwcmV2ZW50cyB0aGUgdXNlciBmcm9tIGRlbGV0aW5nIGEgaGVhdG1hcCBpbiBvbmUgY2xpY2suXHJcbiAgICAvLyBhIHNlY29uZCBkZWxldGUgYnV0dG9uIGFuZCBhIGNhbmNlbCBidXR0b24gYXJlIHJlbmRlcmVkIGJlZm9yZSBhIGRlbGV0ZSBpcyBjb25maXJtZWRcclxuICAgIGNvbnN0IGhlYXRtYXBEcm9wZG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhdG1hcERyb3Bkb3duXCIpO1xyXG4gICAgbGV0IGN1cnJlbnREcm9wZG93blZhbHVlID0gaGVhdG1hcERyb3Bkb3duLnZhbHVlO1xyXG5cclxuICAgIGlmIChjdXJyZW50RHJvcGRvd25WYWx1ZSA9PT0gXCJCYXNpYyBIZWF0bWFwXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVIZWF0bWFwQnRuXCIpO1xyXG4gICAgICBjb25zdCBjb25maXJtRGVsZXRlQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNvbmZpcm0gRGVsZXRlXCIpO1xyXG4gICAgICBjb25zdCByZWplY3REZWxldGVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkNhbmNlbFwiKTtcclxuICAgICAgY29uc3QgRGVsZXRlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJkZWxldGVDb250cm9sXCIsIFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgY29uZmlybURlbGV0ZUJ0biwgcmVqZWN0RGVsZXRlQnRuKTtcclxuICAgICAgZGVsZXRlSGVhdG1hcEJ0bi5yZXBsYWNlV2l0aChEZWxldGVDb250cm9sKTtcclxuICAgICAgY29uZmlybURlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuY29uZmlybUhlYXRtYXBEZWxldGlvbik7XHJcbiAgICAgIHJlamVjdERlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVqZWN0SGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZS1yZW5kZXJzIHRoZSBwcmltYXJ5IGRlbGV0ZSBidXR0b25cclxuICAgIGNvbnN0IERlbGV0ZUNvbnRyb2wgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUNvbnRyb2xcIik7XHJcbiAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImRlbGV0ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkRlbGV0ZSBIZWF0bWFwXCIpXHJcbiAgICBEZWxldGVDb250cm9sLnJlcGxhY2VXaXRoKGRlbGV0ZUhlYXRtYXBCdG4pXHJcbiAgICBkZWxldGVIZWF0bWFwQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoZWF0bWFwRGF0YS5kZWxldGVIZWF0bWFwKTtcclxuICB9LFxyXG5cclxuICBjb25maXJtSGVhdG1hcERlbGV0aW9uKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB3aWxsIGRlbGV0ZSB0aGUgc2VsZWN0ZWQgaGVhdG1hcCBvcHRpb24gaW4gdGhlIGRyb3Bkb3duIGxpc3QgYW5kIHJlbW92ZSBhbGwgc2hvdF9oZWF0bWFwIGpvaW4gdGFibGVzXHJcbiAgICBjb25zdCBoZWF0bWFwRHJvcGRvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYXRtYXBEcm9wZG93blwiKTtcclxuICAgIGxldCBjdXJyZW50RHJvcGRvd25WYWx1ZSA9IGhlYXRtYXBEcm9wZG93bi52YWx1ZTtcclxuXHJcbiAgICBoZWF0bWFwRHJvcGRvd24uY2hpbGROb2Rlcy5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgaWYgKGNoaWxkLnRleHRDb250ZW50ID09PSBjdXJyZW50RHJvcGRvd25WYWx1ZSkgeyAvL1RPRE86IGNoZWNrIHRoaXMgbG9naWMuIG1heSBiZSBhYmxlIHRvIHVzZSBJRCBpbnN0ZWFkIG9mIHJlcXVpcmluZyB1bmlxdWUgbmFtZVxyXG4gICAgICAgIGNoaWxkLnJlbW92ZSgpO1xyXG4gICAgICAgIGhlYXRtYXBEYXRhLmRlbGV0ZUhlYXRtYXBPYmplY3RhbmRKb2luVGFibGVzKGNoaWxkLmlkKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24udmFsdWUgPSBcIkJhc2ljIEhlYXRtYXBcIjtcclxuICAgICAgICAgICAgaGVhdG1hcERhdGEucmVqZWN0SGVhdG1hcERlbGV0aW9uKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSGVhdG1hcE9iamVjdGFuZEpvaW5UYWJsZXMoaGVhdG1hcElkKSB7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgcmV0dXJuIEFQSS5kZWxldGVJdGVtKFwiaGVhdG1hcHNcIiwgYCR7aGVhdG1hcElkLnNsaWNlKDgpfT91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBoZWF0bWFwRGF0YSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgaGVhdG1hcERhdGEgZnJvbSBcIi4vaGVhdG1hcERhdGFcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGhlYXRtYXBzID0ge1xyXG5cclxuICBsb2FkSGVhdG1hcENvbnRhaW5lcnMoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB0aGlzLmJ1aWxkRmlsdGVycygpO1xyXG4gICAgLy8gYnVpbGRzIGJ1dHRvbiB0byBnZW5lcmF0ZSBoZWF0bWFwLCBzYXZlIGhlYXRtYXAsIGFuZCB2aWV3IHNhdmVkIGhlYXRtYXBzXHJcbiAgICAvLyB0aGUgYWN0aW9uIGlzIGFzeW5jIGJlY2F1c2UgdGhlIHVzZXIncyBzYXZlZCBoZWF0bWFwcyBoYXZlIHRvIGJlIHJlbmRlcmVkIGFzIEhUTUwgb3B0aW9uIGVsZW1lbnRzXHJcbiAgICB0aGlzLmJ1aWxkR2VuZXJhdG9yKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRGaWx0ZXJzKCkge1xyXG5cclxuICAgIC8vIHJlc2V0IGJ1dHRvblxyXG4gICAgY29uc3QgcmVzZXRCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6XCJyZXNldEZpbHRlcnNCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIlJlc2V0IEZpbHRlcnNcIik7XHJcblxyXG4gICAgLy8gZGF0ZSByYW5nZSBidXR0b25cclxuICAgIGNvbnN0IGRhdGVCdG5UZXh0ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7fSwgXCJEYXRlIFJhbmdlXCIpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1jYWxlbmRhclwiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgZGF0ZUJ0bkljb25TcGFuID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLXNtYWxsXCIgfSwgbnVsbCwgZGF0ZUJ0bkljb24pO1xyXG4gICAgY29uc3QgZGF0ZUJ0biA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLW91dGxpbmVkIGlzLWRhcmtcIiB9LCBudWxsLCBkYXRlQnRuSWNvblNwYW4sIGRhdGVCdG5UZXh0KTtcclxuICAgIGNvbnN0IGRhdGVCdG5QYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGRhdGVCdG4pO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBjb25zdCBpY29uNiA9IGVsQnVpbGRlcihcImlcIiwgeyBcImNsYXNzXCI6IFwiZmFzIGZhLWNsb2NrXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjYgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb242KTtcclxuICAgIGNvbnN0IHNlbDZfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiWWVzXCIpO1xyXG4gICAgY29uc3Qgc2VsNl9vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm9cIik7XHJcbiAgICBjb25zdCBzZWxlY3Q2ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWw2X29wMSwgc2VsNl9vcDIsIHNlbDZfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q2LCBpY29uU3BhbjYpO1xyXG4gICAgY29uc3QgY29udHJvbDYgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjYpO1xyXG5cclxuICAgIC8vIHJlc3VsdFxyXG4gICAgY29uc3QgaWNvbjUgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS10cm9waHlcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuNSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjUpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiUmVzdWx0XCIpO1xyXG4gICAgY29uc3Qgc2VsNV9vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiVmljdG9yeVwiKTtcclxuICAgIGNvbnN0IHNlbDVfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkRlZmVhdFwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDUgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwge1wiaWRcIjpcImZpbHRlci1nYW1lUmVzdWx0XCJ9LCBudWxsLCBzZWw1X29wMSwgc2VsNV9vcDIsIHNlbDVfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q1LCBpY29uU3BhbjUpO1xyXG4gICAgY29uc3QgY29udHJvbDUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjUpO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZVxyXG4gICAgY29uc3QgaWNvbjQgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1zaXRlbWFwXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb240KTtcclxuICAgIGNvbnN0IHNlbDRfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkdhbWUgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3A0ID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDQgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwge30sIG51bGwsIHNlbDRfb3AxLCBzZWw0X29wMiwgc2VsNF9vcDMsIHNlbDRfb3A0KTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q0LCBpY29uU3BhbjQpO1xyXG4gICAgY29uc3QgY29udHJvbDQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjQpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZVxyXG4gICAgY29uc3QgaWNvbjMgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1nYW1lcGFkXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24zKTtcclxuICAgIGNvbnN0IHNlbDNfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkdhbWUgTW9kZVwiKTtcclxuICAgIGNvbnN0IHNlbDNfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNvbXBldGl0aXZlXCIpO1xyXG4gICAgY29uc3Qgc2VsM19vcDMgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ2FzdWFsXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MyA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7XCJpZFwiOlwiZmlsdGVyLWdhbWVNb2RlXCJ9LCBudWxsLCBzZWwzX29wMSwgc2VsM19vcDIsIHNlbDNfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QzLCBpY29uU3BhbjMpO1xyXG4gICAgY29uc3QgY29udHJvbDMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjMpO1xyXG5cclxuICAgIC8vIHRlYW1cclxuICAgIGNvbnN0IGljb24yID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtaGFuZHNoYWtlXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24yKTtcclxuICAgIGNvbnN0IHNlbDJfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlRlYW1cIik7XHJcbiAgICBjb25zdCBzZWwyX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPcmFuZ2VcIik7XHJcbiAgICBjb25zdCBzZWwyX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCbHVlXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsMl9vcDEsIHNlbDJfb3AyLCBzZWwyX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MiwgaWNvblNwYW4yKTtcclxuICAgIGNvbnN0IGNvbnRyb2wyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYyKTtcclxuXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGNvbnN0IGljb24xID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZnV0Ym9sXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24xKTtcclxuICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlNob3QgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7XCJpZFwiOlwiZmlsdGVyLXNob3RUeXBlXCJ9LCBudWxsLCBzZWwxX29wMSwgc2VsMV9vcDIsIHNlbDFfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QxLCBpY29uU3BhbjEpO1xyXG4gICAgY29uc3QgY29udHJvbDEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjEpO1xyXG5cclxuICAgIGNvbnN0IGZpbHRlckZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGlzLWdyb3VwZWQgaXMtZ3JvdXBlZC1jZW50ZXJlZCBpcy1ncm91cGVkLW11bHRpbGluZVwiIH0sIG51bGwsIGNvbnRyb2wxLCBjb250cm9sMiwgY29udHJvbDMsIGNvbnRyb2w0LCBjb250cm9sNSwgY29udHJvbDYsIGRhdGVCdG5QYXJlbnQsIHJlc2V0QnRuKTtcclxuICAgIGNvbnN0IFBhcmVudEZpbHRlckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZmlsdGVyRmllbGQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCBmaWx0ZXIgY29udGFpbmVyIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoUGFyZW50RmlsdGVyQ29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdlbmVyYXRvcigpIHtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcblxyXG4gICAgLy8gdXNlIGZldGNoIHRvIGFwcGVuZCBvcHRpb25zIHRvIHNlbGVjdCBlbGVtZW50IGlmIHVzZXIgYXQgbGVhc3QgMSBzYXZlZCBoZWF0bWFwXHJcbiAgICBBUEkuZ2V0QWxsKGBoZWF0bWFwcz91c2VySWQ9JHthY3RpdmVVc2VySWR9YClcclxuICAgICAgLnRoZW4oaGVhdG1hcHMgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQXJyYXkgb2YgdXNlcidzIHNhdmVkIGhlYXRtYXBzOlwiLCBoZWF0bWFwcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGljb24gPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1maXJlXCIgfSwgbnVsbCk7XHJcbiAgICAgICAgY29uc3QgaWNvblNwYW4gPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24pO1xyXG4gICAgICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJhc2ljIEhlYXRtYXBcIik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcERyb3Bkb3duID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImhlYXRtYXBEcm9wZG93blwiIH0sIG51bGwsIHNlbDFfb3AxKTtcclxuICAgICAgICBjb25zdCBoZWF0bWFwU2VsZWN0RGl2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgaGVhdG1hcERyb3Bkb3duLCBpY29uU3Bhbik7XHJcbiAgICAgICAgY29uc3QgaGVhdG1hcENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIGhlYXRtYXBTZWxlY3REaXYpO1xyXG5cclxuICAgICAgICBjb25zdCBkZWxldGVIZWF0bWFwQnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOlwiZGVsZXRlSGVhdG1hcEJ0blwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRGVsZXRlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBkZWxldGVCdG5Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkZWxldGVIZWF0bWFwQnRuKVxyXG4gICAgICAgIGNvbnN0IHNhdmVCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUhlYXRtYXBCdG5cIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEhlYXRtYXBcIilcclxuICAgICAgICBjb25zdCBzYXZlQnRuQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgc2F2ZUJ0bilcclxuICAgICAgICBjb25zdCBzYXZlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJzYXZlSGVhdG1hcElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJOYW1lIGFuZCBzYXZlIHRoaXMgaGVhdG1hcFwiLCBcIm1heGxlbmd0aFwiOiBcIjMwXCIgfSwgbnVsbClcclxuICAgICAgICBjb25zdCBzYXZlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGlzLWV4cGFuZGVkXCIgfSwgbnVsbCwgc2F2ZUlucHV0KVxyXG5cclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZ2VuZXJhdGVIZWF0bWFwQnRuXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiR2VuZXJhdGUgSGVhdG1hcFwiKTtcclxuICAgICAgICBjb25zdCBnZW5lcmF0b3JDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnZW5lcmF0b3JCdXR0b24pO1xyXG5cclxuICAgICAgICAvLyBpZiBubyBoZWF0bWFwcyBhcmUgc2F2ZWQsIGdlbmVyYXRlIG5vIGV4dHJhIG9wdGlvbnMgaW4gZHJvcGRvd25cclxuICAgICAgICBpZiAoaGVhdG1hcHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGVsc2UsIGZvciBlYWNoIGhlYXRtYXAgc2F2ZWQsIG1ha2UgYSBuZXcgb3B0aW9uIGFuZCBhcHBlbmQgaXQgdG8gdGhlXHJcbiAgICAgICAgICBoZWF0bWFwcy5mb3JFYWNoKGhlYXRtYXAgPT4ge1xyXG4gICAgICAgICAgICBoZWF0bWFwRHJvcGRvd24uYXBwZW5kQ2hpbGQoZWxCdWlsZGVyKFwib3B0aW9uXCIsIHtcImlkXCI6YGhlYXRtYXAtJHtoZWF0bWFwLmlkfWB9LCBoZWF0bWFwLm5hbWUpKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICBjb25zdCBnZW5lcmF0b3JGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBoZWF0bWFwQ29udHJvbCwgZ2VuZXJhdG9yQ29udHJvbCwgc2F2ZUNvbnRyb2wsIHNhdmVCdG5Db250cm9sLCBkZWxldGVCdG5Db250cm9sKTtcclxuICAgICAgICAgIGNvbnN0IFBhcmVudEdlbmVyYXRvckNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgZ2VuZXJhdG9yRmllbGQpO1xyXG4gICAgICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChQYXJlbnRHZW5lcmF0b3JDb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1aWxkRmllbGRhbmRHb2FsKCk7XHJcbiAgICAgICAgdGhpcy5oZWF0bWFwRXZlbnRNYW5hZ2VyKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICB9LFxyXG5cclxuICBidWlsZEZpZWxkYW5kR29hbCgpIHtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgaGVhdG1hcEltYWdlQ29udGFpbmVycyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBoZWF0bWFwSW1hZ2VDb250YWluZXJzKVxyXG5cclxuICAgIC8vIGFwcGVuZCBmaWVsZCBhbmQgZ29hbCB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGhlYXRtYXBFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBnZW5lcmF0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdlbmVyYXRlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IHNhdmVIZWF0bWFwQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlSGVhdG1hcEJ0blwiKTtcclxuICAgIGNvbnN0IGRlbGV0ZUhlYXRtYXBCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRlbGV0ZUhlYXRtYXBCdG5cIik7XHJcbiAgICBjb25zdCByZXNldEZpbHRlcnNCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlc2V0RmlsdGVyc0J0blwiKTtcclxuXHJcbiAgICBnZW5lcmF0ZUhlYXRtYXBCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhlYXRtYXBEYXRhLmdldFVzZXJTaG90cyk7XHJcbiAgICBzYXZlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuc2F2ZUhlYXRtYXApO1xyXG4gICAgZGVsZXRlSGVhdG1hcEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGVhdG1hcERhdGEuZGVsZXRlSGVhdG1hcCk7XHJcblxyXG4gICAgY29uc3QgZ2FtZU1vZGVGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1nYW1lTW9kZVwiKTtcclxuICAgIGNvbnN0IHNob3RUeXBlRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItc2hvdFR5cGVcIik7XHJcbiAgICBjb25zdCBnYW1lUmVzdWx0RmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItZ2FtZVJlc3VsdFwiKTtcclxuXHJcbiAgICByZXNldEZpbHRlcnNCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgZ2FtZU1vZGVGaWx0ZXIudmFsdWUgPSBcIkdhbWUgTW9kZVwiO1xyXG4gICAgICBzaG90VHlwZUZpbHRlci52YWx1ZSA9IFwiU2hvdCBUeXBlXCI7XHJcbiAgICAgIGdhbWVSZXN1bHRGaWx0ZXIudmFsdWUgPSBcIlJlc3VsdFwiO1xyXG4gICAgfSlcclxuXHJcblxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBoZWF0bWFwcyIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiXHJcbmltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcbmNvbnN0IHdlYnBhZ2VOYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdi1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBsb2dpbk9yU2lnbnVwID0ge1xyXG5cclxuICAvLyBidWlsZCBhIGxvZ2luIGZvcm0gdGhhdCB2YWxpZGF0ZXMgdXNlciBpbnB1dC4gU3VjY2Vzc2Z1bCBsb2dpbiBzdG9yZXMgdXNlciBpZCBpbiBzZXNzaW9uIHN0b3JhZ2VcclxuICBsb2dpbkZvcm0oKSB7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luSW5wdXRfcGFzc3dvcmQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwYXNzd29yZElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJwYXNzd29yZFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImxvZ2luTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW4gbm93XCIpO1xyXG4gICAgY29uc3QgbG9naW5Gb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJsb2dpbkZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIGxvZ2luSW5wdXRfdXNlcm5hbWUsIGxvZ2luSW5wdXRfcGFzc3dvcmQsIGxvZ2luQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKGxvZ2luRm9ybSlcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpXHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwRm9ybSgpIHtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X25hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIG5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X2NvbmZpcm0gPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJjb25maXJtUGFzc3dvcmRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImNvbmZpcm0gcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzaWdudXBOb3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwIG5vd1wiKTtcclxuICAgIGNvbnN0IHNpZ251cEZvcm0gPSBlbEJ1aWxkZXIoXCJmb3JtXCIsIHsgXCJpZFwiOiBcInNpZ251cEZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIHNpZ251cElucHV0X25hbWUsIHNpZ251cElucHV0X3VzZXJuYW1lLCBzaWdudXBJbnB1dF9wYXNzd29yZCwgc2lnbnVwSW5wdXRfY29uZmlybSwgc2lnbnVwQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHNpZ251cEZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIC8vIGFzc2lnbiBldmVudCBsaXN0ZW5lcnMgYmFzZWQgb24gd2hpY2ggZm9ybSBpcyBvbiB0aGUgd2VicGFnZVxyXG4gIHVzZXJFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBsb2dpbk5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9naW5Ob3dcIilcclxuICAgIGNvbnN0IHNpZ251cE5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2lnbnVwTm93XCIpXHJcbiAgICBpZiAobG9naW5Ob3cgPT09IG51bGwpIHtcclxuICAgICAgc2lnbnVwTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cFVzZXIsIGV2ZW50KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9naW5Ob3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9naW5Vc2VyLCBldmVudClcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyB2YWxpZGF0ZSB1c2VyIGxvZ2luIGZvcm0gaW5wdXRzIGJlZm9yZSBsb2dnaW5nIGluXHJcbiAgbG9naW5Vc2VyKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGNvbnN0IHVzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBwYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFzc3dvcmRJbnB1dFwiKS52YWx1ZVxyXG4gICAgaWYgKHVzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5nZXRBbGwoXCJ1c2Vyc1wiKS50aGVuKHVzZXJzID0+IHVzZXJzLmZvckVhY2godXNlciA9PiB7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgdXNlcm5hbWUgYW5kIHBhc3N3b3JkXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgaWYgKHVzZXIucGFzc3dvcmQgPT09IHBhc3N3b3JkKSB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgY29uc3QgX25hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3VzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IGNvbmZpcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbmZpcm1QYXNzd29yZFwiKS52YWx1ZVxyXG4gICAgbGV0IHVuaXF1ZVVzZXJuYW1lID0gdHJ1ZTsgLy9jaGFuZ2VzIHRvIGZhbHNlIGlmIHVzZXJuYW1lIGFscmVhZHkgZXhpc3RzXHJcbiAgICBpZiAoX25hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF91c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChjb25maXJtID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgIT09IGNvbmZpcm0pIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKCh1c2VyLCBpZHgpID0+IHtcclxuICAgICAgICAvLyBjaGVjayBmb3IgZXhpc3RpbmcgdXNlcm5hbWUgaW4gZGF0YWJhc2VcclxuICAgICAgICBpZiAodXNlci51c2VybmFtZS50b0xvd2VyQ2FzZSgpID09PSBfdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgdW5pcXVlVXNlcm5hbWUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9hdCB0aGUgZW5kIG9mIHRoZSBsb29wLCBwb3N0XHJcbiAgICAgICAgaWYgKGlkeCA9PT0gdXNlcnMubGVuZ3RoIC0gMSAmJiB1bmlxdWVVc2VybmFtZSkge1xyXG4gICAgICAgICAgbGV0IG5ld1VzZXIgPSB7XHJcbiAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogX3VzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogX3Bhc3N3b3JkLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIEFQSS5wb3N0SXRlbShcInVzZXJzXCIsIG5ld1VzZXIpLnRoZW4odXNlciA9PiB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsb2dpblN0YXR1c0FjdGl2ZSh1c2VyKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIsIHVzZXIuaWQpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpOyAvL2J1aWxkIGxvZ2dlZCBpbiB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH0sXHJcblxyXG4gIGxvZ291dFVzZXIoKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKGZhbHNlKTsgLy9idWlsZCBsb2dnZWQgb3V0IHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbG9naW5PclNpZ251cCIsImltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuLy8gaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuaW1wb3J0IGhlYXRtYXBzIGZyb20gXCIuL2hlYXRtYXBzXCI7XHJcblxyXG4vLyBmdW5jdGlvbiBjbG9zZUJveChlKSB7XHJcbi8vICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcImRlbGV0ZVwiKSkge1xyXG4vLyAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoKVxyXG5uYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSlcclxuaGVhdG1hcHMubG9hZEhlYXRtYXBDb250YWluZXJzKCk7IiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBsb2dpbk9yU2lnbnVwIGZyb20gXCIuL2xvZ2luXCJcclxuaW1wb3J0IHByb2ZpbGUgZnJvbSBcIi4vcHJvZmlsZVwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiXHJcblxyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuLypcclxuICBCdWxtYSBuYXZiYXIgc3RydWN0dXJlOlxyXG4gIDxuYXY+XHJcbiAgICA8bmF2YmFyLWJyYW5kPlxyXG4gICAgICA8bmF2YmFyLWJ1cmdlcj4gKG9wdGlvbmFsKVxyXG4gICAgPC9uYXZiYXItYnJhbmQ+XHJcbiAgICA8bmF2YmFyLW1lbnU+XHJcbiAgICAgIDxuYXZiYXItc3RhcnQ+XHJcbiAgICAgIDwvbmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8bmF2YmFyLWVuZD5cclxuICAgICAgPC9uYXZiYXItZW5kPlxyXG4gICAgPC9uYXZiYXItbWVudT5cclxuICA8L25hdj5cclxuXHJcbiAgVGhlIGZ1bmN0aW9ucyBiZWxvdyBidWlsZCB0aGUgbmF2YmFyIGZyb20gdGhlIGluc2lkZSBvdXRcclxuKi9cclxuXHJcbmNvbnN0IG5hdmJhciA9IHtcclxuXHJcbiAgZ2VuZXJhdGVOYXZiYXIobG9nZ2VkSW5Cb29sZWFuKSB7XHJcblxyXG4gICAgLy8gbmF2YmFyLW1lbnUgKHJpZ2h0IHNpZGUgb2YgbmF2YmFyIC0gYXBwZWFycyBvbiBkZXNrdG9wIDEwMjRweCspXHJcbiAgICBjb25zdCBidXR0b24yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW5cIilcclxuICAgIGNvbnN0IGJ1dHRvbjEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwXCIpXHJcbiAgICBjb25zdCBidXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGJ1dHRvbjEsIGJ1dHRvbjIpXHJcbiAgICBjb25zdCBtZW51SXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBudWxsLCBidXR0b25Db250YWluZXIpXHJcbiAgICBjb25zdCBuYXZiYXJFbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWVuZFwiIH0sIG51bGwsIG1lbnVJdGVtMSlcclxuICAgIGNvbnN0IG5hdmJhclN0YXJ0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1zdGFydFwiIH0pXHJcbiAgICBjb25zdCBuYXZiYXJNZW51ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIm5hdmJhck1lbnVcIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1tZW51XCIgfSwgbnVsbCwgbmF2YmFyU3RhcnQsIG5hdmJhckVuZClcclxuXHJcbiAgICAvLyBuYXZiYXItYnJhbmQgKGxlZnQgc2lkZSBvZiBuYXZiYXIgLSBpbmNsdWRlcyBtb2JpbGUgaGFtYnVyZ2VyIG1lbnUpXHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcInJvbGVcIjogXCJidXR0b25cIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1idXJnZXIgYnVyZ2VyXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1lbnVcIiwgXCJhcmlhLWV4cGFuZGVkXCI6IFwiZmFsc2VcIiwgXCJkYXRhLXRhcmdldFwiOiBcIm5hdmJhck1lbnVcIiB9LCBudWxsLCBidXJnZXJNZW51U3BhbjEsIGJ1cmdlck1lbnVTcGFuMiwgYnVyZ2VyTWVudVNwYW4zKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQxID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiLCBcImhyZWZcIjogXCIjXCIgfSwgbnVsbCwgZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvZmlyZTkwZGVnLnBuZ1wiLCBcIndpZHRoXCI6IFwiMTEyXCIsIFwiaGVpZ2h0XCI6IFwiMjhcIiB9KSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItYnJhbmRcIiB9LCBudWxsLCBuYXZiYXJCcmFuZENoaWxkMSwgbmF2YmFyQnJhbmRDaGlsZDIpO1xyXG5cclxuICAgIC8vIG5hdiAocGFyZW50IG5hdiBIVE1MIGVsZW1lbnQpXHJcbiAgICBjb25zdCBuYXYgPSBlbEJ1aWxkZXIoXCJuYXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyXCIsIFwicm9sZVwiOiBcIm5hdmlnYXRpb25cIiwgXCJhcmlhLWxhYmVsXCI6IFwibWFpbiBuYXZpZ2F0aW9uXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmQsIG5hdmJhck1lbnUpO1xyXG5cclxuICAgIC8vIGlmIGxvZ2dlZCBpbiwgYXBwZW5kIGFkZGl0aW9uYWwgbWVudSBvcHRpb25zIHRvIG5hdmJhciBhbmQgcmVtb3ZlIHNpZ251cC9sb2dpbiBidXR0b25zXHJcbiAgICBpZiAobG9nZ2VkSW5Cb29sZWFuKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBsb2cgaW4gYW5kIHNpZ24gdXAgYnV0dG9uc1xyXG4gICAgICBjb25zdCBzaWdudXAgPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1swXTtcclxuICAgICAgY29uc3QgbG9naW4gPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1sxXTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKHNpZ251cCk7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChsb2dpbik7XHJcbiAgICAgIC8vIGFkZCBsb2dvdXQgYnV0dG9uXHJcbiAgICAgIGNvbnN0IGJ1dHRvbjMgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dvdXRcIik7XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChidXR0b24zKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhbmQgYXBwZW5kIG5ldyBtZW51IGl0ZW1zIGZvciB1c2VyXHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJQcm9maWxlXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiR2FtZXBsYXlcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTMgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJIZWF0bWFwc1wiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtNCA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkxlYWRlcmJvYXJkXCIpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0xKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTMpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW00KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgZXZlbnQgbGlzdGVuZXJzIHRvIG5hdmJhclxyXG4gICAgdGhpcy5uYXZiYXJFdmVudE1hbmFnZXIobmF2KTtcclxuXHJcbiAgICAvLyBhcHBlbmQgdG8gd2VicGFnZVxyXG4gICAgd2VicGFnZU5hdi5hcHBlbmRDaGlsZChuYXYpO1xyXG5cclxuICB9LFxyXG5cclxuICBuYXZiYXJFdmVudE1hbmFnZXIobmF2KSB7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9naW5DbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2lnbnVwQ2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ291dENsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5wcm9maWxlQ2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmdhbWVwbGF5Q2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhlYXRtYXBzQ2xpY2tlZCwgZXZlbnQpO1xyXG4gIH0sXHJcblxyXG4gIGxvZ2luQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9naW5cIikge1xyXG4gICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luRm9ybSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cENsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIlNpZ24gdXBcIikge1xyXG4gICAgICBsb2dpbk9yU2lnbnVwLnNpZ251cEZvcm0oKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsb2dvdXRDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dvdXRcIikge1xyXG4gICAgICBsb2dpbk9yU2lnbnVwLmxvZ291dFVzZXIoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBwcm9maWxlQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiUHJvZmlsZVwiKSB7XHJcbiAgICAgIHByb2ZpbGUubG9hZFByb2ZpbGUoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBnYW1lcGxheUNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkdhbWVwbGF5XCIpIHtcclxuICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGhlYXRtYXBzQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiSGVhdG1hcHNcIikge1xyXG4gICAgICBoZWF0bWFwcy5sb2FkSGVhdG1hcENvbnRhaW5lcnMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuYXZiYXIiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IHByb2ZpbGUgPSB7XHJcblxyXG4gIGxvYWRQcm9maWxlKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYWN0aXZlVXNlcklkKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlUGljID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvb2N0YW5lLmpwZ1wiLCBcImNsYXNzXCI6IFwiXCIgfSlcclxuICAgICAgY29uc3QgbmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb25cIiB9LCBgTmFtZTogJHt1c2VyLm5hbWV9YClcclxuICAgICAgY29uc3QgdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYFVzZXJuYW1lOiAke3VzZXIudXNlcm5hbWV9YClcclxuICAgICAgY29uc3QgcGxheWVyUHJvZmlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJwbGF5ZXJQcm9maWxlXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXJcIiB9LCBudWxsLCBwcm9maWxlUGljLCBuYW1lLCB1c2VybmFtZSlcclxuICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChwbGF5ZXJQcm9maWxlKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwcm9maWxlIiwiY2xhc3Mgc2hvdE9uR29hbCB7XHJcbiAgc2V0IGZpZWxkWChmaWVsZFgpIHtcclxuICAgIHRoaXMuX2ZpZWxkWCA9IGZpZWxkWFxyXG4gIH1cclxuICBzZXQgZmllbGRZKGZpZWxkWSkge1xyXG4gICAgdGhpcy5fZmllbGRZID0gZmllbGRZXHJcbiAgfVxyXG4gIHNldCBnb2FsWChnb2FsWCkge1xyXG4gICAgdGhpcy5fZ29hbFggPSBnb2FsWFxyXG4gIH1cclxuICBzZXQgZ29hbFkoZ29hbFkpIHtcclxuICAgIHRoaXMuX2dvYWxZID0gZ29hbFlcclxuICB9XHJcbiAgc2V0IGFlcmlhbChhZXJpYWxCb29sZWFuKSB7XHJcbiAgICB0aGlzLl9hZXJpYWwgPSBhZXJpYWxCb29sZWFuXHJcbiAgfVxyXG4gIHNldCBiYWxsU3BlZWQoYmFsbFNwZWVkKSB7XHJcbiAgICB0aGlzLmJhbGxfc3BlZWQgPSBiYWxsU3BlZWRcclxuICB9XHJcbiAgc2V0IHRpbWVTdGFtcChkYXRlT2JqKSB7XHJcbiAgICB0aGlzLl90aW1lU3RhbXAgPSBkYXRlT2JqXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90T25Hb2FsIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90T25Hb2FsIGZyb20gXCIuL3Nob3RDbGFzc1wiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiO1xyXG5cclxubGV0IHNob3RDb3VudGVyID0gMDtcclxubGV0IGVkaXRpbmdTaG90ID0gZmFsc2U7IC8vZWRpdGluZyBzaG90IGlzIHVzZWQgZm9yIGJvdGggbmV3IGFuZCBvbGQgc2hvdHNcclxubGV0IHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbmxldCBzaG90QXJyYXkgPSBbXTsgLy8gcmVzZXQgd2hlbiBnYW1lIGlzIHNhdmVkXHJcbi8vIGdsb2JhbCB2YXJzIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdE9iajtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWDtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWTtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxYO1xyXG5sZXQgcHJldmlvdXNTaG90R29hbFk7XHJcbi8vIGdsb2JhbCB2YXIgdXNlZCB3aGVuIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSAodG8gZGV0ZXJtaW5lIGlmIG5ldyBzaG90cyB3ZXJlIGFkZGVkIGZvciBQT1NUKVxyXG5sZXQgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5O1xyXG5cclxuY29uc3Qgc2hvdERhdGEgPSB7XHJcblxyXG4gIHJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gZ2FtZXBsYXkgaXMgY2xpY2tlZCBvbiB0aGUgbmF2YmFyIGFuZCB3aGVuIGEgZ2FtZSBpcyBzYXZlZCwgaW4gb3JkZXIgdG8gcHJldmVudCBidWdzIHdpdGggcHJldmlvdXNseSBjcmVhdGVkIHNob3RzXHJcbiAgICBzaG90Q291bnRlciA9IDA7XHJcbiAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHNob3RBcnJheSA9IFtdO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheSA9IHVuZGVmaW5lZDtcclxuICB9LFxyXG5cclxuICBjcmVhdGVOZXdTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBzaG90T2JqID0gbmV3IHNob3RPbkdvYWw7XHJcbiAgICBzaG90T2JqLnRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XHJcblxyXG4gICAgLy8gcHJldmVudCB1c2VyIGZyb20gc2VsZWN0aW5nIGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyh0cnVlKTtcclxuXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBmaWVsZEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuXHJcbiAgICAvLyBhY3RpdmF0ZSBjbGljayBmdW5jdGlvbmFsaXR5IGFuZCBjb25kaXRpb25hbCBzdGF0ZW1lbnRzIG9uIGJvdGggZmllbGQgYW5kIGdvYWwgaW1hZ2VzXHJcbiAgfSxcclxuXHJcbiAgZ2V0Q2xpY2tDb29yZHMoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBnZXRzIHRoZSByZWxhdGl2ZSB4IGFuZCB5IG9mIHRoZSBjbGljayB3aXRoaW4gdGhlIGZpZWxkIGltYWdlIGNvbnRhaW5lclxyXG4gICAgLy8gYW5kIHRoZW4gY2FsbHMgdGhlIGZ1bmN0aW9uIHRoYXQgYXBwZW5kcyBhIG1hcmtlciBvbiB0aGUgcGFnZVxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lcjtcclxuICAgIGlmIChlLnRhcmdldC5pZCA9PT0gXCJmaWVsZC1pbWdcIikge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIH1cclxuICAgIC8vIG9mZnNldFggYW5kIFkgYXJlIHRoZSB4IGFuZCB5IGNvb3JkaW5hdGVzIChwaXhlbHMpIG9mIHRoZSBjbGljayBpbiB0aGUgY29udGFpbmVyXHJcbiAgICAvLyB0aGUgZXhwcmVzc2lvbnMgZGl2aWRlIHRoZSBjbGljayB4IGFuZCB5IGJ5IHRoZSBwYXJlbnQgZnVsbCB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICBjb25zdCB4Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRYIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKVxyXG4gICAgY29uc3QgeUNvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4Q29vcmRSZWxhdGl2ZSwgeUNvb3JkUmVsYXRpdmUsIHBhcmVudENvbnRhaW5lcilcclxuICB9LFxyXG5cclxuICBtYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcikge1xyXG4gICAgbGV0IG1hcmtlcklkO1xyXG4gICAgaWYgKHBhcmVudENvbnRhaW5lci5pZCA9PT0gXCJmaWVsZC1pbWctcGFyZW50XCIpIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWZpZWxkXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBtYXJrZXJJZCA9IFwic2hvdC1tYXJrZXItZ29hbFwiO1xyXG4gICAgfVxyXG4gICAgLy8gYWRqdXN0IGZvciA1MCUgb2Ygd2lkdGggYW5kIGhlaWdodCBvZiBtYXJrZXIgc28gaXQncyBjZW50ZXJlZCBhYm91dCBtb3VzZSBwb2ludGVyXHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWCA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWSA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3MgTk9UIGFscmVhZHkgYSBtYXJrZXIsIHRoZW4gbWFrZSBvbmUgYW5kIHBsYWNlIGl0XHJcbiAgICBpZiAoIXBhcmVudENvbnRhaW5lci5jb250YWlucyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCkpKSB7XHJcbiAgICAgIHRoaXMuZ2VuZXJhdGVNYXJrZXIocGFyZW50Q29udGFpbmVyLCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZLCBtYXJrZXJJZCwgeCwgeSk7XHJcbiAgICAgIC8vIGVsc2UgbW92ZSB0aGUgZXhpc3RpbmcgbWFya2VyIHRvIHRoZSBuZXcgcG9zaXRpb25cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubW92ZU1hcmtlcihtYXJrZXJJZCwgeCwgeSwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSk7XHJcbiAgICB9XHJcbiAgICAvLyBzYXZlIGNvb3JkaW5hdGVzIHRvIG9iamVjdFxyXG4gICAgdGhpcy5hZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KVxyXG4gIH0sXHJcblxyXG4gIGdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpIHtcclxuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBkaXYuaWQgPSBtYXJrZXJJZDtcclxuICAgIGRpdi5zdHlsZS53aWR0aCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwibGlnaHRncmVlblwiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCI1MCVcIjtcclxuICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgIGRpdi5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgZGl2LnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpO1xyXG4gIH0sXHJcblxyXG4gIG1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpIHtcclxuICAgIGNvbnN0IGN1cnJlbnRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCk7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICB9LFxyXG5cclxuICBhZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHVwZGF0ZXMgdGhlIGluc3RhbmNlIG9mIHNob3RPbkdvYWwgY2xhc3MgdG8gcmVjb3JkIGNsaWNrIGNvb3JkaW5hdGVzXHJcbiAgICAvLyBpZiBhIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIGFwcGVuZCB0aGUgY29vcmRpbmF0ZXMgdG8gdGhlIG9iamVjdCBpbiBxdWVzdGlvblxyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgLy8gdXNlIGdsb2JhbCB2YXJzIGluc3RlYWQgb2YgdXBkYXRpbmcgb2JqZWN0IGRpcmVjdGx5IGhlcmUgdG8gcHJldmVudCBhY2NpZGVudGFsIGVkaXRpbmcgb2YgbWFya2VyIHdpdGhvdXQgY2xpY2tpbmcgXCJzYXZlIHNob3RcIlxyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIG90aGVyd2lzZSwgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBzbyBhcHBlbmQgY29vcmRpbmF0ZXMgdG8gdGhlIG5ldyBvYmplY3RcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaG90T2JqLmdvYWxYID0geDtcclxuICAgICAgICBzaG90T2JqLmdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbFNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBpZiAoZmllbGRNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdvYWxNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZSBjbGljayBsaXN0ZW5lcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIC8vIGNsZWFyIGZpZWxkIGFuZCBnb2FsIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICAvLyBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gc2F2ZSBjb3JyZWN0IG9iamVjdCAoaS5lLiBzaG90IGJlaW5nIGVkaXRlZCB2cy4gbmV3IHNob3QpXHJcbiAgICAgIC8vIGlmIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHByZXZpb3VzU2hvdE9iaiB3aWxsIG5vdCBiZSB1bmRlZmluZWRcclxuICAgICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRYID0gcHJldmlvdXNTaG90RmllbGRYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRZID0gcHJldmlvdXNTaG90RmllbGRZO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFggPSBwcmV2aW91c1Nob3RHb2FsWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxZID0gcHJldmlvdXNTaG90R29hbFk7XHJcbiAgICAgICAgLy8gZWxzZSBzYXZlIHRvIG5ldyBpbnN0YW5jZSBvZiBjbGFzcyBhbmQgYXBwZW5kIGJ1dHRvbiB0byBwYWdlIHdpdGggY29ycmVjdCBJRCBmb3IgZWRpdGluZ1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHNob3RPYmouYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBzaG90T2JqLmFlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgc2hvdE9iai5iYWxsU3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBzaG90QXJyYXkucHVzaChzaG90T2JqKTtcclxuICAgICAgICAvLyBhcHBlbmQgbmV3IGJ1dHRvblxyXG4gICAgICAgIHNob3RDb3VudGVyKys7XHJcbiAgICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtzaG90Q291bnRlcn1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke3Nob3RDb3VudGVyfWApO1xyXG4gICAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtzaG90Q291bnRlcn1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgICAgfVxyXG4gICAgICAvL1RPRE86IGFkZCBjb25kaXRpb24gdG8gcHJldmVudCBibGFuayBlbnRyaWVzIGFuZCBtaXNzaW5nIGNvb3JkaW5hdGVzXHJcblxyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzcyAobWF0dGVycyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQpXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWQgKG1hdHRlcnMgaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkKVxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2F2ZWRTaG90KGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVmZXJlbmNlcyB0aGUgc2hvdEFycmF5IHRvIGdldCBhIHNob3Qgb2JqZWN0IHRoYXQgbWF0Y2hlcyB0aGUgc2hvdCMgYnV0dG9uIGNsaWNrZWQgKGUuZy4gc2hvdCAyIGJ1dHRvbiA9IGluZGV4IDEgb2YgdGhlIHNob3RBcnJheSlcclxuICAgIC8vIHRoZSBmdW5jdGlvbiAoYW5kIGl0cyBhc3NvY2lhdGVkIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gb3RoZXIgbG9jYWwgZnVuY3Rpb25zKSBoYXMgdGhlc2UgYmFzaWMgcmVxdWlyZW1lbnRzOlxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBjbGljayBsaXN0ZW5lcnMgb24gaW1hZ2VzXHJcbiAgICAvLyByZXZpdmUgYSBzYXZlZCBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgZm9yIGVkaXRpbmcgc2hvdCBjb29yZGluYXRlcywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbFxyXG4gICAgLy8gcmVuZGVyIG1hcmtlcnMgZm9yIGV4aXN0aW5nIGNvb3JkaW5hdGVzIG9uIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBzYXZlIGVkaXRzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIGNhbmNlbCBlZGl0c1xyXG4gICAgLy8gdGhlIGRhdGEgaXMgcmVuZGVyZWQgb24gdGhlIHBhZ2UgYW5kIGNhbiBiZSBzYXZlZCAob3ZlcndyaXR0ZW4pIGJ5IHVzaW5nIHRoZSBcInNhdmUgc2hvdFwiIGJ1dHRvbiBvciBjYW5jZWxlZCBieSBjbGlja2luZyB0aGUgXCJjYW5jZWwgc2hvdFwiIGJ1dHRvblxyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IG5ldyBzaG90IGJ1dHRvbiBmcm9tIGJlaW5nIGNsaWNrZWRcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIC8vIGFsbG93IGNhbmNlbCBhbmQgc2F2ZWQgYnV0dG9ucyB0byBiZSBjbGlja2VkXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICAvLyBnZXQgSUQgb2Ygc2hvdCMgYnRuIGNsaWNrZWQgYW5kIGFjY2VzcyBzaG90QXJyYXkgYXQgW2J0bklEIC0gMV1cclxuICAgIGxldCBidG5JZCA9IGUudGFyZ2V0LmlkLnNsaWNlKDUpO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gc2hvdEFycmF5W2J0bklkIC0gMV07XHJcbiAgICAvLyByZW5kZXIgYmFsbCBzcGVlZCBhbmQgYWVyaWFsIGRyb3Bkb3duIGZvciB0aGUgc2hvdFxyXG4gICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZDtcclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9PT0gdHJ1ZSkgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJBZXJpYWxcIjsgfSBlbHNlIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjsgfVxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBmaWVsZCBhbmQgZ29hbFxyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIC8vIHJlbmRlciBzaG90IG1hcmtlciBvbiBmaWVsZFxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IHggPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHkgPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcbiAgICAvLyByZW5kZXIgZ29hbCBtYXJrZXIgb24gZmllbGRcclxuICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpXHJcbiAgICB4ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpO1xyXG4gICAgeSA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG5cclxuICB9LFxyXG5cclxuICBkaXNhYmxlRWRpdFNob3RidXR0b25zKGRpc2FibGVPck5vdCkge1xyXG4gICAgLy8gZm9yIGVhY2ggYnV0dG9uIGFmdGVyIFwiTmV3IFNob3RcIiwgXCJTYXZlIFNob3RcIiwgYW5kIFwiQ2FuY2VsIFNob3RcIiBkaXNhYmxlIHRoZSBidXR0b25zIGlmIHRoZSB1c2VyIGlzIGNyZWF0aW5nIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IHRydWUpIG9yIGVuYWJsZSB0aGVtIG9uIHNhdmUvY2FuY2VsIG9mIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IGZhbHNlKVxyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgbGV0IGVkaXRCdG47XHJcbiAgICBsZXQgbGVuZ3RoID0gc2hvdEJ0bkNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aDtcclxuICAgIGZvciAobGV0IGkgPSAzOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWRpdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aSAtIDJ9YCk7XHJcbiAgICAgIGVkaXRCdG4uZGlzYWJsZWQgPSBkaXNhYmxlT3JOb3Q7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGdldFNob3RPYmplY3RzRm9yU2F2aW5nKCkge1xyXG4gICAgLy8gcHJvdmlkZXMgYXJyYXkgZm9yIHVzZSBpbiBnYW1lRGF0YS5qcyAod2hlbiBzYXZpbmcgYSBuZXcgZ2FtZSwgbm90IHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lKVxyXG4gICAgcmV0dXJuIHNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsTnVtT2ZTaG90cygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGluaXRpYWwgbnVtYmVyIG9mIHNob3RzIHRoYXQgd2VyZSBzYXZlZCB0byBkYXRhYmFzZSB0byBnYW1lRGF0YS5qcyB0byBpZGVudGlmeSBhbiBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZFxyXG4gICAgcmV0dXJuIGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICByZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZXF1ZXN0cyB0aGUgYXJyYXkgb2Ygc2hvdHMgZnJvbSB0aGUgcHJldmlvdXMgc2F2ZWQgZ2FtZSwgc2V0cyBpdCBhcyBzaG90QXJyYXksIGFuZCByZW5kZXJzIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgLy8gZ2V0IHNhdmVkIGdhbWUgd2l0aCBzaG90cyBlbWJlZGRlZCBhcyBhcnJheVxyXG4gICAgbGV0IHNhdmVkR2FtZU9iaiA9IGdhbWVEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKTtcclxuICAgIC8vIGNyZWF0ZSBzaG90QXJyYXkgd2l0aCBmb3JtYXQgcmVxdWlyZWQgYnkgbG9jYWwgZnVuY3Rpb25zXHJcbiAgICBsZXQgc2F2ZWRTaG90T2JqXHJcbiAgICBzYXZlZEdhbWVPYmouc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc2F2ZWRTaG90T2JqID0gbmV3IHNob3RPbkdvYWxcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWCA9IHNob3QuZmllbGRYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZmllbGRZID0gc2hvdC5maWVsZFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWCA9IHNob3QuZ29hbFg7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWSA9IHNob3QuZ29hbFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5hZXJpYWwgPSBzaG90LmFlcmlhbDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmJhbGxfc3BlZWQgPSBzaG90LmJhbGxfc3BlZWQudG9TdHJpbmcoKTtcclxuICAgICAgc2F2ZWRTaG90T2JqLnRpbWVTdGFtcCA9IHNob3QudGltZVN0YW1wXHJcbiAgICAgIHNhdmVkU2hvdE9iai5pZCA9IHNob3QuaWRcclxuICAgICAgc2hvdEFycmF5LnB1c2goc2F2ZWRTaG90T2JqKTtcclxuICAgIH0pXHJcblxyXG4gICAgY29uc29sZS5sb2coc2hvdEFycmF5KTtcclxuICAgIHNob3RBcnJheS5mb3JFYWNoKChzaG90LCBpZHgpID0+IHtcclxuICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtpZHggKyAxfWAsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtbGlua1wiIH0sIGBTaG90ICR7aWR4ICsgMX1gKTtcclxuICAgICAgc2hvdEJ0bkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdTaG90QnRuKTtcclxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpZHggKyAxfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5yZW5kZXJTYXZlZFNob3QpO1xyXG4gICAgfSk7XHJcbiAgICBzaG90Q291bnRlciA9IHNob3RBcnJheS5sZW5ndGg7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3REYXRhIl19
