// import heatmapControl from "./heatmapControl"
// var heatmapjs = require("../lib/node_modules/heatmapjs/heatmap.min.js");
import heatmap from "../lib/node_modules/heatmap.js/build/heatmap.js"

const mapContainer = document.getElementById("container")
let varWidth = mapContainer.offsetWidth
let varHeight = mapContainer.offsetHeight

var config = {
  container: mapContainer,
  radius: 80,
  maxOpacity: .5,
  minOpacity: 0,
  blur: .75,
  backgroundColor: "rgba(206,231,255,.95)"
};
// create heatmap with configuration
let heatmapInstance;

console.log(heatmap)

function buildHeatmap() {

  heatmapInstance = heatmap.create(config);
  console.log(heatmapInstance)

  var dataPoints = [];
  for (let i = 0; i < 100; i++) {
    let x_ = Math.floor(Math.random() * varWidth);
    let y_ = Math.floor(Math.random() * varHeight);
    let value_ = Math.floor(Math.random() * 100);

    let obj = { x: x_, y: y_, value: value_ }

    if (x_ === 0 || y_ === 0 || value_ === 0) {
      console.log("ZERO", x_, y_, value_)
    }

    // console.log(obj.x, obj.y, obj.value)
    dataPoints.push(obj)
  }

  const data = {
    max: 100,
    min: 0,
    data: dataPoints
  }

  heatmapInstance.setData(data);
}

buildHeatmap()

// determine container dimensions at a certain interval.
// if
function getActiveOffsets() {
  const captureWidth = mapContainer.offsetWidth
  // const captureHeight = mapContainer.offsetHeight
  //evaluate container width after 0.5 seconds vs initial container width
  if (captureWidth === varWidth) {
    console.log("unchanged")
  } else {
    varWidth = captureWidth
    console.log("new width", varWidth)
    //clear heatmap
    mapContainer.removeChild(mapContainer.childNodes[0])
    //build heatmap again
    buildHeatmap()
  }
}

setInterval(getActiveOffsets, 500)
