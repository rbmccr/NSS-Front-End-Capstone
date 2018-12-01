import elBuilder from "./elementBuilder"
import shotOnGoal from "./shotClass"

let shotCounter = 0;
let editingShot = false; //editing shot is used for both new and old shots
let shotObj = undefined;
let shotArray = []; // reset when game is saved
let previousShotData;

const shotData = {

  createNewShot() {
    const btn_newShot = document.getElementById("newShot");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");
    shotObj = new shotOnGoal;

    editingShot = true;
    btn_newShot.disabled = true;
    fieldImg.addEventListener("click", shotData.getClickCoords)
    goalImg.addEventListener("click", shotData.getClickCoords)

    // activate click functionality and conditional statements on both field and goal images
  },

  getClickCoords(e) {
    // this function gets the relative x and y of the click within the field image container
    // and then calls the function that appends a marker on the page
    let parentContainer;
    if (e.target.id === "field-img") {
      parentContainer = document.getElementById("field-img-parent");
    } else {
      parentContainer = document.getElementById("goal-img-parent");
    }
    // offsetX and Y are the x and y coordinates (pixels) of the click in the container
    // the expressions divide the click x and y by the parent full width and height
    const xCoordRelative = Number((e.offsetX / parentContainer.offsetWidth).toFixed(3))
    const yCoordRelative = Number((e.offsetY / parentContainer.offsetHeight).toFixed(3));
    shotData.markClickonImage(xCoordRelative, yCoordRelative, parentContainer)
  },

  markClickonImage(x, y, parentContainer) {
    console.log("x", x, "y", y)
    let markerId;
    if (parentContainer.id === "field-img-parent") {
      markerId = "shot-marker-field";
    } else {
      markerId = "shot-marker-goal";
    }
    // adjust for 50% of width and height of marker so it's centered about mouse pointer
    let adjustMarkerX = 12.5 / parentContainer.offsetWidth;
    let adjustMarkerY = 12.5 / parentContainer.offsetHeight;

    // if there's NOT already a marker, then make one and place it
    // else move the marker to the new position
    if (!parentContainer.contains(document.getElementById(markerId))) {
      this.generateMarker(parentContainer, adjustMarkerX, adjustMarkerY, markerId, x, y);
    } else {
      this.moveMarker(markerId, x, y, adjustMarkerX, adjustMarkerY);
    }
    this.addCoordsToClass(markerId, x, y)
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
    if (previousShotData !== undefined) {
      if (markerId === "shot-marker-field") {
        previousShotData._fieldX = x;
        previousShotData._fieldY = y;
      } else {
        previousShotData._goalX = x;
        previousShotData._goalY = y;
      }
      console.log("previous shot", previousShotData)
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
      return
    } else {
      editingShot = false;
      btn_newShot.disabled = false;
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard";
      shotObj = undefined;
      // remove markers from field and goal
      if (fieldMarker !== null) {
        fieldImgParent.removeChild(fieldMarker);
      }
      if (goalMarker !== null) {
        goalImgParent.removeChild(goalMarker);
      }
      fieldImg.removeEventListener("click", shotData.getClickCoords);
      goalImg.removeEventListener("click", shotData.getClickCoords);
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
      return
    } else {
      editingShot = false;
      btn_newShot.disabled = false;
      shotCounter++;
      // clear field and goal event listeners
      fieldImg.removeEventListener("click", shotData.getClickCoords);
      goalImg.removeEventListener("click", shotData.getClickCoords);
      // remove markers from field and goal
      fieldImgParent.removeChild(fieldMarker);
      goalImgParent.removeChild(goalMarker);

      //TODO: add condition to prevent blank entries and missing coordinates
      if (sel_aerial.value === "Aerial") { shotObj.aerial = true } else { shotObj.aerial = false };
      shotObj.ballSpeed = inpt_ballSpeed.value;
      shotArray.push(shotObj)
      console.log(shotArray)

      const newShotBtn = elBuilder("button", { "id": `shot-${shotCounter}`, "class": "button is-link" }, `Shot ${shotCounter}`)
      shotBtnContainer.appendChild(newShotBtn);
      document.getElementById(`shot-${shotCounter}`).addEventListener("click", shotData.renderSavedShot);

      shotObj = undefined;
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard";
    }

  },

  renderSavedShot(e) {
    // this function references the shotArray to get a shot object that matches the shot# button clicked (e.g. shot 2 button = index 1 of the shotArray)
    // the data is rendered on the page and can be saved (overwritten) by using the "save shot" button
    const btn_newShot = document.getElementById("newShot");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");

    // prevent new shot button from being clicked
    btn_newShot.disabled = true;
    // allow cancel and saved buttons to be clicked
    editingShot = true;
    // get ID of shot# btn clicked and access shotArray at [btnID - 1]
    let btnId = e.target.id.slice(5); //TODO: use btnId as condition with save!
    previousShotData = shotArray[btnId - 1];
    console.log(previousShotData);
    // render ball speed and aerial for the shot
    inpt_ballSpeed.value = previousShotData.ball_speed;
    if (previousShotData._aerial === true) { sel_aerial.value = "Aerial"; } else { sel_aerial.value = "Standard"; }
    // add event listeners to field and goal
    fieldImg.addEventListener("click", shotData.getClickCoords);
    goalImg.addEventListener("click", shotData.getClickCoords);
    // render shot marker on field
    let parentContainer = document.getElementById("field-img-parent")
    let x = (previousShotData._fieldX * parentContainer.offsetWidth) / parentContainer.offsetWidth;
    let y = (previousShotData._fieldY * parentContainer.offsetHeight) / parentContainer.offsetHeight;
    shotData.markClickonImage(x, y, parentContainer);
    // render goal marker on field
    parentContainer = document.getElementById("goal-img-parent")
    x = (previousShotData._goalX * parentContainer.offsetWidth) / parentContainer.offsetWidth;
    y = (previousShotData._goalY * parentContainer.offsetHeight) / parentContainer.offsetHeight;
    shotData.markClickonImage(x, y, parentContainer);

    // re initialize click on images
    // revive instance of class for editing coordinates stored, ball speed, and aerial
    // render points on images for shot to be edited
    // TODO: method to save
    // TODO: method to cancel edit
    // TODO: set parameters to prevent user from clicking another edit shot button
  }

}

export default shotData