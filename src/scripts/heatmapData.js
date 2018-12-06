import heatmap from "../lib/node_modules/heatmap.js/build/heatmap.js"
import API from "./API.js";

// ID of setInterval function used to monitor container width and repaint heatmap if container width changes
// let intervalId;
// global variable to store fetched shots
let globalShotsArr;

const heatmapData = {

  getUserShots() {
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const heatmapName = heatmapDropdown.value;
    if (heatmapName === "Basic Heatmap") {
      heatmapData.fetchBasicHeatmapData();
    } else {
      heatmapData.fetchSavedHeatmapData(heatmapName);
    }
  },

  fetchBasicHeatmapData() {
    // this function goes to the database and retrieves shots that meet specific filters (all shots fetched if )
    let gameIds = [];
    const gameURLextension = heatmapData.applyGameFilters();
    API.getAll(gameURLextension)
      .then(games => {
        games.forEach(game => {
          gameIds.push(game.id);
        })
        return gameIds;
      })
      .then(gameIds => {
        const shotURLextension = heatmapData.applyShotFilters(gameIds);
        API.getAll(shotURLextension)
          .then(shots => {
            globalShotsArr = shots;
            heatmapData.buildFieldHeatmap(shots);
            heatmapData.buildGoalHeatmap(shots);
            // intervalId = setInterval(heatmapData.getActiveOffsets, 500);
          })
      })
  },

  fetchSavedHeatmapData(heatmapName) {
    console.log("fetching saved heatmap data...")
  },

  applyGameFilters() { // TODO: add more filters
    let URL = "games"
    const activeUserId = sessionStorage.getItem("activeUserId");
    URL += `?userId=${activeUserId}`
    return URL
  },

  applyShotFilters(gameIds) {
    let URL = "shots"
    // for each gameId, append URL. Append & instead of ? once first gameId is added to URL
    if (gameIds.length > 0) {
      let gameIdCount = 0;
      gameIds.forEach(id => {
        if (gameIdCount < 1) {
          URL += `?gameId=${id}`
          gameIdCount++;
        } else {
          URL += `&gameId=${id}`
        }
      })
    } //TODO: else do not continue (no games were found)
    return URL;
  },

  buildFieldHeatmap(shots) {
    console.log(shots)

    // create field heatmap with configuration
    const fieldContainer = document.getElementById("field-img-parent");
    let varWidth = fieldContainer.offsetWidth;
    let varHeight = fieldContainer.offsetHeight;

    let fieldConfig = heatmapData.getFieldConfig(fieldContainer);

    let FieldHeatmapInstance;
    FieldHeatmapInstance = heatmap.create(fieldConfig);

    let fieldDataPoints = [];

    shots.forEach(shot => {
      let x_ = Number((shot.fieldX * varWidth).toFixed(0));
      let y_ = Number((shot.fieldY * varHeight).toFixed(0));
      let value_ = 1;
      let fieldObj = { x: x_, y: y_, value: value_ };
      fieldDataPoints.push(fieldObj);
    });

    console.table(fieldDataPoints)

    const fieldData = {
      max: 1,
      min: 0,
      data: fieldDataPoints
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
    GoalHeatmapInstance = heatmap.create(goalConfig);

    let goalDataPoints = [];

    shots.forEach(shot => {
      let x_ = Number((shot.goalX * varGoalWidth).toFixed(0));
      let y_ = Number((shot.goalY * varGoalHeight).toFixed(0));
      let value_ = 1;
      let goalObj = { x: x_, y: y_, value: value_ };
      goalDataPoints.push(goalObj);
    });

    console.table(goalDataPoints)

    const goalData = {
      max: 1,
      min: 0,
      data: goalDataPoints
    }

    GoalHeatmapInstance.setData(goalData);
    console.log(GoalHeatmapInstance)
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
    // shot ID and heatmap ID as foreign keys
    const saveInput = document.getElementById("saveHeatmapInput");
    if (saveInput.value.length > 0 && saveInput.value.length <= 20) {
      console.log("saving heatmap...");
      saveInput.classList.remove("is-danger");
      heatmapData.saveHeatmapObject()
        .then(heatmapData.saveJoinTables().then(x => console.log(x)))
    } else {
      console.log("Name must be between 1 and 20 characters...");
      saveInput.classList.add("is-danger");
    }
  },

  saveHeatmapObject() {

  },

  saveJoinTables() {

  },

  deleteHeatmap() {
    console.log("deleting heatmap...");
  }

}

export default heatmapData

// TODO: make heatmap function for goal
// TODO: save heatmap functionality
// TODO: delete heatmap functionality
// TODO: set interval for container width monitoring
// TODO: scale ball size with goal
// TODO: add filter compatibility