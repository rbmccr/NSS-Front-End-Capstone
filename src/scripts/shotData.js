import elBuilder from "./elementBuilder"
import shotOnGoal from "./shotClass"

let shotCounter = 0;
let editingShot = false; //editing shot is used for both new and old shots
let shotObj = undefined;
let shotArray = []; // reset when game is saved
let previousShotData; // global var used with shot editing
let previousShotFieldX; // global var used with shot editing
let previousShotFieldY; // global var used with shot editing
let previousShotGoalX; // global var used with shot editing
let previousShotGoalY; // global var used with shot editing

//FIXME: bug occurs with shot editing button numbers
//FIXME: bug occurs with ball speed on shot edit (line 239) - caused by first FIXME

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
    if (!parentContainer.contains(document.getElementById(markerId))) {
      this.generateMarker(parentContainer, adjustMarkerX, adjustMarkerY, markerId, x, y);
      // else move the existing marker to the new position
    } else {
      this.moveMarker(markerId, x, y, adjustMarkerX, adjustMarkerY);
    }
    // save coordinates to object
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
    // if a shot is being edited, then append the coordinates to the object in question
    if (previousShotData !== undefined) {
      if (markerId === "shot-marker-field") {
        // use global vars instead of updating object directly here to prevent accidental editing of marker without clicking "save shot"
        previousShotFieldX = x;
        previousShotFieldY = y;
      } else {
        previousShotGoalX = x;
        previousShotGoalY = y;
      }
      console.log("previous shot", previousShotData)
      // otherwise, a new shot is being created, so append coordinates to the new object
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
      // if a new shot is being created, cancel the new instance of shotClass
      shotObj = undefined;
      // if a previously saved shot is being edited, then set global vars to undefined
      previousShotData = undefined;
      previousShotFieldX = undefined;
      previousShotFieldY = undefined;
      previousShotGoalX = undefined;
      previousShotGoalY = undefined;
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
      // clear field and goal event listeners
      fieldImg.removeEventListener("click", shotData.getClickCoords);
      goalImg.removeEventListener("click", shotData.getClickCoords);
      // remove markers from field and goal
      fieldImgParent.removeChild(fieldMarker);
      goalImgParent.removeChild(goalMarker);
      // conditional statement to save correct object (i.e. shot being edited vs. new shot)
      // if shot is being edited, then previousShotData will not be undefined
      if (previousShotData !== undefined) {
        if (sel_aerial.value === "Aerial") { previousShotData._aerial = true } else { previousShotData._aerial = false };
        previousShotData.ball_speed = inpt_ballSpeed.value;
        previousShotData._fieldX = previousShotFieldX;
        previousShotData._fieldY = previousShotFieldY;
        previousShotData._goalX = previousShotGoalX;
        previousShotData._goalY = previousShotGoalY;
        // else save to new instance of class and append button to page with correct ID for editing
      } else {
        if (sel_aerial.value === "Aerial") { shotObj.aerial = true } else { shotObj.aerial = false };
        shotObj.ballSpeed = inpt_ballSpeed.value;
        shotArray.push(shotObj);
        // append new button
        shotCounter++;
        const newShotBtn = elBuilder("button", { "id": `shot-${shotCounter}`, "class": "button is-link" }, `Shot ${shotCounter}`);
        shotBtnContainer.appendChild(newShotBtn);
        document.getElementById(`shot-${shotCounter}`).addEventListener("click", shotData.renderSavedShot);
      }
      //TODO: add condition to prevent blank entries and missing coordinates
      console.log(shotArray)

      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard";
      // cancel the new instance of shotClass (matters if a new shot is being created)
      shotObj = undefined;
      // set global vars to undefined (matters if a previously saved shot is being edited)
      previousShotData = undefined;
      previousShotFieldX = undefined;
      previousShotFieldY = undefined;
      previousShotGoalX = undefined;
      previousShotGoalY = undefined;
    }

  },

  renderSavedShot(e) {
    // this function references the shotArray to get a shot object that matches the shot# button clicked (e.g. shot 2 button = index 1 of the shotArray)
    // the function (and its associated conditional statements in other local functions) has these basic requirements:
    // re-initialize click listeners on images
    // revive a saved instance of shotClass for editing shot coordinates, ball speed, and aerial
    // render markers for existing coordinates on field and goal images
    // TODO: method to save edits
    // method to cancel edits
    // TODO: set parameters to prevent user from clicking another edit shot button
    // the data is rendered on the page and can be saved (overwritten) by using the "save shot" button or canceled by clicking the "cancel shot" button
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
    let btnId = e.target.id.slice(5);
    previousShotData = shotArray[btnId - 1];
    // render ball speed and aerial dropdown for the shot
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
    x = Number(((previousShotData._goalX * parentContainer.offsetWidth) / parentContainer.offsetWidth).toFixed(3));
    y = Number(((previousShotData._goalY * parentContainer.offsetHeight) / parentContainer.offsetHeight).toFixed(3));
    shotData.markClickonImage(x, y, parentContainer);

  }

}

export default shotData