import heatmap from "../lib/node_modules/heatmap.js/build/heatmap.js"
import API from "./API.js";
import elBuilder from "./elementBuilder.js";

// ID of setInterval function used to monitor container width and repaint heatmap if container width changes
// let intervalId;
// global variable to store fetched shots
let globalShotsArr;
let joinTableArr = [];

// FIXME: examine confirmHeatmapDelete function. may not need for loop. grab ID from option
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

    const heatmapName = heatmapDropdown.value;
    // const fieldHeatmapCanvas = fieldContainer.childNodes[2]
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
    }
    // }
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
        if (gameIds.length === 0) {
          alert("No Shots have been saved yet. Visit the Gameplay page to get started.")
          return
        } else {
          const shotURLextension = heatmapData.applyShotFilters(gameIds);
          API.getAll(shotURLextension)
            .then(shots => {
              globalShotsArr = shots;
              heatmapData.buildFieldHeatmap(shots);
              heatmapData.buildGoalHeatmap(shots);
              // intervalId = setInterval(heatmapData.getActiveOffsets, 500);
            })
        }
      });
  },

  fetchSavedHeatmapData(heatmapName) {
    // this function, and its counterpart fetchSavedJoinTables render an already-saved heatmap though these steps:
    // 1. getting the heatmap name from the dropdown value
    // 2. using the name to find the childNodes index of the dropdown value (i.e. which HTML <option>) and get its ID
    // 3. fetch all shot_heatmap join tables with matching heatmap ID
    // 4. fetch shots using shot IDs from join tables
    // 5. render heatmap by calling build functions

    // step 1: get name of heatmap
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;
    // step 2: use name to get heatmap ID stored in HTML option element
    let currentHeatmapId;
    heatmapDropdown.childNodes.forEach(child => {
      if (child.textContent === currentDropdownValue) {
        currentHeatmapId = child.id.slice(8);
      }
    });
    // step 3: fetch join tables
    API.getAll(`shot_heatmap?heatmapId=${currentHeatmapId}`)
      .then(joinTables => heatmapData.fetchsavedJointables(joinTables)
        // step 5: pass shots to buildFieldHeatmap() and buildGoalHeatmap()
        .then(shots => {
          console.log(shots);
          heatmapData.buildFieldHeatmap(shots);
          heatmapData.buildGoalHeatmap(shots);
        })
      )
  },

  fetchsavedJointables(joinTables) {
    // see notes on fetchSavedHeatmapData()
    joinTables.forEach(table => {
      // step 4. then fetch using each shotId in the join tables
      joinTableArr.push(API.getSingleItem("shots", table.shotId))
    })
    return Promise.all(joinTableArr)
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
    console.log("Array of fetched shots", shots)

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

    const goalData = {
      max: 1,
      min: 0,
      data: goalDataPoints
    }

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

    if (heatmapTitle.length > 0 && heatmapTitle !== "Save successful!") { //TODO: add requirement for a heatmap to be loaded at the time save is clicked
      console.log("saving heatmap...");
      saveInput.classList.remove("is-danger");
      heatmapData.saveHeatmapObject(heatmapTitle)
        .then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(x => {
          console.log("join tables saved", x)
          joinTableArr = [] // empty the temporary global array used with Promise.all
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
    }
    return API.postItem("heatmaps", heatmapObj)
  },

  saveJoinTables(heatmapObj) {
    console.log("globalshotsarray", globalShotsArr)
    globalShotsArr.forEach(shot => {
      let joinTableObj = {
        shotId: shot.id,
        heatmapId: heatmapObj.id
      }
      joinTableArr.push(API.postItem("shot_heatmap", joinTableObj));
    });
    return Promise.all(joinTableArr)
  },

  deleteHeatmap() {
    // this function is the logic that prevents the user from deleting a heatmap in one click.
    // a second delete button and a cancel button are rendered before a delete is confirmed
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;

    if (currentDropdownValue === "Basic Heatmap") {
      return
    } else {
      const deleteHeatmapBtn = document.getElementById("deleteHeatmapBtn");
      const confirmDeleteBtn = elBuilder("button", { "class": "button is-danger" }, "Confirm Delete");
      const rejectDeleteBtn = elBuilder("button", { "class": "button is-dark" }, "Cancel");
      const DeleteControl = elBuilder("div", { "id": "deleteControl", "class": "buttons" }, null, confirmDeleteBtn, rejectDeleteBtn);
      deleteHeatmapBtn.replaceWith(DeleteControl);
      confirmDeleteBtn.addEventListener("click", heatmapData.confirmHeatmapDeletion);
      rejectDeleteBtn.addEventListener("click", heatmapData.rejectHeatmapDeletion);
    }

  },

  rejectHeatmapDeletion() {
    // this function re-renders the primary delete button
    const DeleteControl = document.getElementById("deleteControl");
    const deleteHeatmapBtn = elBuilder("button", { "id": "deleteHeatmapBtn", "class": "button is-danger" }, "Delete Heatmap")
    DeleteControl.replaceWith(deleteHeatmapBtn)
    deleteHeatmapBtn.addEventListener("click", heatmapData.deleteHeatmap);
  },

  confirmHeatmapDeletion() {
    // this function will delete the selected heatmap option in the dropdown list and remove all shot_heatmap join tables
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;

    heatmapDropdown.childNodes.forEach(child => {
      if (child.textContent === currentDropdownValue) { //TODO: check this logic. may be able to use ID instead of requiring unique name
        child.remove();
        heatmapData.deleteHeatmapObjectandJoinTables(child.id)
          .then(() => {
            heatmapDropdown.value = "Basic Heatmap";
            heatmapData.rejectHeatmapDeletion();
          });
      } else {
        return
      }
    })

  },

  deleteHeatmapObjectandJoinTables(heatmapId) {
    const activeUserId = sessionStorage.getItem("activeUserId");
    return API.deleteItem("heatmaps", `${heatmapId.slice(8)}?userId=${activeUserId}`)
  }

}

export default heatmapData