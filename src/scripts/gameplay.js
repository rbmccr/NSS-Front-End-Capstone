import elBuilder from "./elementBuilder"
import shotData from "./shotData"
import gameData from "./gameData"

const webpage = document.getElementById("container-master");

const gameplay = {

  loadGameplay() {
    webpage.innerHTML = null;
    // const xButton = elBuilder("button", { "class": "delete" });
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
    const shotTitle = elBuilder("div", { "class": "level-item title is-4" }, "Enter Shot Data");
    const shotTitleContainer = elBuilder("div", { "class": "level" }, null, shotTitle);

    // new shot and save shot buttons
    const newShot = elBuilder("button", { "id": "newShot", "class": "button is-success" }, "New Shot");
    const saveShot = elBuilder("button", { "id": "saveShot", "class": "button is-success" }, "Save Shot");
    const cancelShot = elBuilder("button", { "id": "cancelShot", "class": "button is-danger" }, "Cancel Shot");
    const shotButtons = elBuilder("div", { "id": "shotControls", "class": "level-item buttons" }, null, newShot, saveShot, cancelShot);
    const alignShotButtons = elBuilder("div", { "class": "level-left" }, null, shotButtons);
    const shotButtonContainer = elBuilder("div", { "class": "level" }, null, alignShotButtons);

    // ball speed input and aerial select
    const ballSpeedInputTitle = elBuilder("div", { "class": "level-item" }, "Ball speed (kph):")
    const ballSpeedInput = elBuilder("input", { "id": "ballSpeedInput", "class": "level-item input", "placeholder": "enter ball speed" });
    const aerialOption1 = elBuilder("option", {}, "Standard");
    const aerialOption2 = elBuilder("option", {}, "Aerial");
    const aerialSelect = elBuilder("select", { "id": "aerialInput", "class": "select" }, null, aerialOption1, aerialOption2);
    const aerialSelectParent = elBuilder("div", { "class": "select" }, null, aerialSelect);
    const aerialControl = elBuilder("div", { "class": "control level-item" }, null, aerialSelectParent);
    const shotDetails = elBuilder("div", { "class": "level-left" }, null, ballSpeedInputTitle, ballSpeedInput, aerialControl);
    const shotDetailsContainer = elBuilder("div", { "class": "level" }, null, shotDetails);

    // field and goal images (note field-img is clipped to restrict click area coordinates in later function.
    // goal-img uses an x/y formula for click area coordinates restriction, since it's a rectangle)
    // additionally, field and goal are not aligned with level-left or level-right - it's a direct level --> level-item for centering
    const fieldImage = elBuilder("img", { "id": "field-img", "src": "../images/DFH_stadium_790x540_no_bg_90deg.png", "alt": "DFH Stadium", "style": "height: 100%; width: 100%; object-fit: contain" });
    const fieldImageBackground = elBuilder("img", { "id": "field-img-bg", "src": "../images/DFH_stadium_790x540_no_bg_90deg.png", "alt": "DFH Stadium", "style": "height: 100%; width: 100%; object-fit: contain" });
    const fieldImageParent = elBuilder("div", { "id": "field-img-parent", "class": "" }, null, fieldImageBackground, fieldImage);
    const alignField = elBuilder("div", { "class": "level-item" }, null, fieldImageParent);
    const goalImage = elBuilder("img", { "id": "goal-img", "src": "../images/RL_goal_cropped_no_bg_BW.png", "alt": "DFH Stadium", "style": "height: 100%; width: 100%; object-fit: contain" });
    const goalImageParent = elBuilder("div", { "id": "goal-img-parent", "class": "level" }, null, goalImage);
    const alignGoal = elBuilder("div", { "class": "level-item" }, null, goalImageParent);
    const shotCoordinatesContainer = elBuilder("div", { "class": "level" }, null, alignField, alignGoal);

    // parent container holding all shot information
    const parentShotContainer = elBuilder("div", { "class": "container box" }, null, shotTitleContainer, shotButtonContainer, shotDetailsContainer, shotCoordinatesContainer)

    // append shots container to page
    webpage.appendChild(parentShotContainer);
  },

  buildGameContent() {
    // this function creates game content containers (team, game type, game mode, etc.)

    // container title
    const gameTitle = elBuilder("div", { "class": "level-item title is-4" }, "Enter Game Data");
    const titleContainer = elBuilder("div", { "class": "level" }, null, gameTitle);

    // ---------- top container

    // 1v1/2v2/3v3 buttons (note: control class is used with field to adhere buttons together)
    const gameType3v3 = elBuilder("div", { "id": "_3v3", "class": "button" }, "3v3");
    const gameType3v3Control = elBuilder("div", { "class": "control" }, null, gameType3v3);
    const gameType2v2 = elBuilder("div", { "id": "_2v2", "class": "button is-selected is-link" }, "2v2");
    const gameType2v2Control = elBuilder("div", { "class": "control" }, null, gameType2v2);
    const gameType1v1 = elBuilder("div", { "id": "_1v1", "class": "button" }, "1v1");
    const gameType1v1Control = elBuilder("div", { "class": "control" }, null, gameType1v1);
    const gameTypeButtonField = elBuilder("div", { "class": "field has-addons" }, null, gameType3v3Control, gameType2v2Control, gameType1v1Control);
    const gameTypeButtonContainer = elBuilder("div", { "class": "level-item" }, null, gameTypeButtonField);

    // game mode select
    const modeOption1 = elBuilder("option", {}, "Casual");
    const modeOption2 = elBuilder("option", {}, "Competitive");
    const modeSelect = elBuilder("select", { "id": "gameModeInput", "class": "select" }, null, modeOption1, modeOption2);
    const modeSelectParent = elBuilder("div", { "class": "select" }, null, modeSelect);
    const modeControl = elBuilder("div", { "class": "control level-item" }, null, modeSelectParent);

    // team select
    const teamOption1 = elBuilder("option", {}, "Orange team");
    const teamOption2 = elBuilder("option", {}, "Blue Team");
    const teamSelect = elBuilder("select", { "id": "teamInput", "class": "select" }, null, teamOption1, teamOption2);
    const teamSelectParent = elBuilder("div", { "class": "select" }, null, teamSelect);
    const teamControl = elBuilder("div", { "class": "control level-item" }, null, teamSelectParent);

    // overtime select
    const overtimeOption1 = elBuilder("option", {}, "No overtime");
    const overtimeOption2 = elBuilder("option", {}, "Overtime");
    const overtimeSelect = elBuilder("select", { "id": "overtimeInput", "class": "select" }, null, overtimeOption1, overtimeOption2);
    const overtimeSelectParent = elBuilder("div", { "class": "select" }, null, overtimeSelect);
    const overtimeControl = elBuilder("div", { "class": "control level-item" }, null, overtimeSelectParent);

    // ---------- bottom container

    // score inputs
    // ****Note inline styling of input widths
    const orangeScoreInputTitle = elBuilder("div", { "class": "level-item" }, "Orange team score:");
    const orangeScoreInput = elBuilder("input", { "id": "orangeScoreInput", "class": "input", "type": "number", "placeholder": "enter orange team score" });
    const orangeScoreControl = elBuilder("div", { "class": "level-item control" }, null, orangeScoreInput);
    const blueScoreInputTitle = elBuilder("div", { "class": "level-item" }, "Blue team score:")
    const blueScoreInput = elBuilder("input", { "id": "blueScoreInput", "class": "input", "type": "number", "placeholder": "enter blue team score" });
    const blueScoreControl = elBuilder("div", { "class": "level-item control" }, null, blueScoreInput);
    const scoreInputContainer = elBuilder("div", { "class": "level-left" }, null, orangeScoreInputTitle, orangeScoreControl, blueScoreInputTitle, blueScoreControl);

    // edit/save game buttons
    const editPreviousGame = elBuilder("button", { "id": "editPrevGame", "class": "button is-danger" }, "Edit Previous Game");
    const saveGame = elBuilder("button", { "id": "saveGame", "class": "button is-success" }, "Save Game");
    const gameButtonAlignment = elBuilder("div", { "class": "buttons level-item" }, null, saveGame, editPreviousGame);
    const gameButtonContainer = elBuilder("div", { "class": "level-right" }, null, gameButtonAlignment);

    // append to webpage
    const gameContainerTop = elBuilder("div", { "class": "level" }, null, gameTypeButtonContainer, modeControl, teamControl, overtimeControl);
    const gameContainerBottom = elBuilder("div", { "class": "level" }, null, scoreInputContainer, gameButtonContainer);
    const parentGameContainer = elBuilder("div", { "class": "container box" }, null, titleContainer, gameContainerTop, gameContainerBottom);
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
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1];

    // add listeners
    btn_newShot.addEventListener("click", shotData.createNewShot);
    btn_saveShot.addEventListener("click", shotData.saveShot);
    btn_cancelShot.addEventListener("click", shotData.cancelShot);
    btn_saveGame.addEventListener("click", gameData.saveData);
    gameTypeBtns.forEach(btn => btn.addEventListener("click", gameData.gameTypeButtonToggle));
    btn_editPrevGame.addEventListener("click", gameData.editPrevGame)

  }

}

export default gameplay