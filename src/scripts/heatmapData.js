import heatmap from "../lib/node_modules/heatmap.js/build/heatmap.js"
import API from "./API.js";

// 1. fetch shots from database
// 2. use filter to append fetch URL

const heatmapData = {

  getUsersShots() {
    // this function goes to the database and retrieves shots stored
    // call function that handles filters
    const activeUserId = sessionStorage.getItem("id");
    API.getAll(`shots?userId=${activeUserId}`)
    .then(shots => {
      console.log(shots);
      heatmapData.buildHeatmap(shots);
    })

  },

  buildHeatmap(shots) {
    const mapContainer = document.getElementById("field-img-parent")
    let varWidth = mapContainer.offsetWidth
    let varHeight = mapContainer.offsetHeight


    let config = {
      container: mapContainer,
      radius: 60,
      maxOpacity: .5,
      minOpacity: 0,
      blur: .75,
      // backgroundColor: "rgba(206,231,255,.95)"
    };

    // create heatmap with configuration
    let heatmapInstance;

    heatmapInstance = heatmap.create(config);
    console.log(heatmapInstance)


    let dataPoints = [];

    shots.forEach(shot => {
      let x_ = shot.fieldX * varWidth;
      let y_ = shot.fieldY * varHeight;
      let value_ = 80;
      let obj = { x: x_, y: y_, value: value_ }
      console.log(obj)
      dataPoints.push(obj)
    });
    // for (let i = 0; i < 100; i++) {
    //   let x_ = Math.floor(Math.random() * varWidth);
    //   let y_ = Math.floor(Math.random() * varHeight);
    //   let value_ = Math.floor(Math.random() * 100);

    //   let obj = { x: x_, y: y_, value: value_ }

    //   if (x_ === 0 || y_ === 0 || value_ === 0) {
    //     console.log("ZERO", x_, y_, value_)
    //   }

    //   // console.log(obj.x, obj.y, obj.value)
    //   dataPoints.push(obj)
    // }

    const data = {
      max: 100,
      min: 0,
      data: dataPoints
    }

    heatmapInstance.setData(data);
  },
/*
  // determine container dimensions at a certain interval.
  // if
  getActiveOffsets() {
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
  }*/

  // setInterval(getActiveOffsets, 500)

}

export default heatmapData
