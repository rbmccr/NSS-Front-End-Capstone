import elBuilder from "./elementBuilder"

const webpage = document.getElementById("container-master");

let shotCounter = 0;
let newShotEditing = false;

const shotData = {

  createNewShot() {
    const btn_newShot = document.getElementById("newShot");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");

    if (newShotEditing) {
      return
    } else {
      newShotEditing = true;
      btn_newShot.disabled = true;
      console.log("new shot");
      console.log(shotData.getClickCoords)
      fieldImg.addEventListener("click", shotData.getClickCoords)
    }
    // activate click functionality and conditional statements on both field and goal images
  },

  getClickCoords(e) {
    console.log(e)
    // this function gets the relative x and y of the click within the field image container
    // and then calls the function that appends a marker on the page
    const fieldImgContainer = document.getElementById("field-img-parent");
    // offsetX and Y are the x and y coordinates (pixels) of the click in the container
    // the expressions divide the click x and y by the parent full width and height
    const xCoordRelative = Number((e.offsetX / fieldImgContainer.offsetWidth).toFixed(3))
    const yCoordRelative = Number((e.offsetY / fieldImgContainer.offsetHeight).toFixed(3));
    console.log("x:", xCoordRelative, "y:", yCoordRelative)
    shotData.markClickonImage(xCoordRelative, yCoordRelative)
  },

  markClickonImage(x, y) {
    const fieldImgContainer = document.getElementById("field-img-parent");

    // adjust for 50% of width and height of marker so it's centered about mouse pointer
    let adjustMarkerX = 12.5 / fieldImgContainer.offsetWidth;
    let adjustMarkerY = 12.5 / fieldImgContainer.offsetHeight;

    // if there's NOT already a marker, then make one and place it
    // else move the marker to the new position
    if (!fieldImgContainer.contains(document.getElementById("shot-marker-field"))) {
      const div = document.createElement("div");
      div.id = "shot-marker-field";
      div.style.width = "25px";
      div.style.height = "25px";
      div.style.backgroundColor = "white";
      div.style.border = "1px solid black";
      div.style.borderRadius = "50%";
      div.style.position = "absolute";
      div.style.left = (x - adjustMarkerX) * 100 + "%";
      div.style.top = (y - adjustMarkerY) * 100 + "%";
      fieldImgContainer.appendChild(div);
    } else {
      const currentMarker = document.getElementById("shot-marker-field");
      currentMarker.style.left = (x - adjustMarkerX) * 100 + "%";
      currentMarker.style.top = (y - adjustMarkerY) * 100 + "%";
    }

  },

  cancelShot() {
    const btn_newShot = document.getElementById("newShot");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");

    if (!newShotEditing) {
      return
    } else {
      // reset editing mode var to false
      // clear clicked items in field and goal images
      newShotEditing = false;
      btn_newShot.disabled = false;
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard";
    }

  },

  saveShot() {
    const btn_newShot = document.getElementById("newShot");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");
    const shotBtnContainer = document.getElementById("shotControls");

    if (!newShotEditing) {
      return
    } else {
      newShotEditing = false;
      btn_newShot.disabled = false;
      shotCounter++;

      const newShotBtn = elBuilder("button", { "id": `shot${shotCounter}`, "class": "button is-link" }, `Shot ${shotCounter}`)
      shotBtnContainer.appendChild(newShotBtn);
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard";
    }

  }

}

export default shotData