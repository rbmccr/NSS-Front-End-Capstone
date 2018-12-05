(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
    }).then(e => e.json()).then(() => fetch(`${URL}/${extension}`)).then(e => e.json());
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

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{"./API":1,"./elementBuilder":2,"./gameplay":4,"./shotData":11}],4:[function(require,module,exports){
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

},{"./elementBuilder":2,"./gameData":3,"./shotData":11}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
const heatmaps = {
  loadHeatmapContainers() {
    webpage.innerHTML = null;
    this.buildFilters();
  },

  buildFilters() {
    //   <p class="buttons">
    // <a class="button">
    //   <span class="icon">
    //     <i class="fab fa-github"></i>
    //   </span>
    //   <span>GitHub</span>
    // </a>
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
      "class": "fas fa-handshake"
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
  }

};
var _default = heatmaps;
exports.default = _default;

},{"./elementBuilder":2}],6:[function(require,module,exports){
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

},{"./API":1,"./elementBuilder":2,"./navbar":8}],7:[function(require,module,exports){
"use strict";

var _navbar = _interopRequireDefault(require("./navbar"));

var _gameplay = _interopRequireDefault(require("./gameplay"));

var _heatmaps = _interopRequireDefault(require("./heatmaps"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// function closeBox(e) {
//   if (e.target.classList.contains("delete")) {
//     e.target.parentNode.style.display = "none";
//   }
// }
// navbar.generateNavbar()
_navbar.default.generateNavbar(true);

_heatmaps.default.loadHeatmapContainers();

},{"./gameplay":4,"./heatmaps":5,"./navbar":8}],8:[function(require,module,exports){
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

},{"./elementBuilder":2,"./gameplay":4,"./heatmaps":5,"./login":6,"./profile":9,"./shotData":11}],9:[function(require,module,exports){
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

},{"./API":1,"./elementBuilder":2}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"./elementBuilder":2,"./gameData":3,"./shotClass":10}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zY3JpcHRzL0FQSS5qcyIsIi4uL3NjcmlwdHMvZWxlbWVudEJ1aWxkZXIuanMiLCIuLi9zY3JpcHRzL2dhbWVEYXRhLmpzIiwiLi4vc2NyaXB0cy9nYW1lcGxheS5qcyIsIi4uL3NjcmlwdHMvaGVhdG1hcHMuanMiLCIuLi9zY3JpcHRzL2xvZ2luLmpzIiwiLi4vc2NyaXB0cy9tYWluLmpzIiwiLi4vc2NyaXB0cy9uYXZiYXIuanMiLCIuLi9zY3JpcHRzL3Byb2ZpbGUuanMiLCIuLi9zY3JpcHRzL3Nob3RDbGFzcy5qcyIsIi4uL3NjcmlwdHMvc2hvdERhdGEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxNQUFNLEdBQUcsR0FBRyx1QkFBWjtBQUVBLE1BQU0sR0FBRyxHQUFHO0FBRVYsRUFBQSxhQUFhLENBQUMsU0FBRCxFQUFZLEVBQVosRUFBZ0I7QUFDM0IsV0FBTyxLQUFLLENBQUUsR0FBRSxHQUFJLElBQUcsU0FBVSxJQUFHLEVBQUcsRUFBM0IsQ0FBTCxDQUFtQyxJQUFuQyxDQUF3QyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUwsRUFBaEQsQ0FBUDtBQUNELEdBSlM7O0FBTVYsRUFBQSxNQUFNLENBQUMsU0FBRCxFQUFZO0FBQ2hCLFdBQU8sS0FBSyxDQUFFLEdBQUUsR0FBSSxJQUFHLFNBQVUsRUFBckIsQ0FBTCxDQUE2QixJQUE3QixDQUFrQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUwsRUFBMUMsQ0FBUDtBQUNELEdBUlM7O0FBVVYsRUFBQSxVQUFVLENBQUMsU0FBRCxFQUFZLEVBQVosRUFBZ0I7QUFDeEIsV0FBTyxLQUFLLENBQUUsR0FBRSxHQUFJLElBQUcsU0FBVSxJQUFHLEVBQUcsRUFBM0IsRUFBOEI7QUFDeEMsTUFBQSxNQUFNLEVBQUU7QUFEZ0MsS0FBOUIsQ0FBTCxDQUdKLElBSEksQ0FHQyxDQUFDLElBQUksQ0FBQyxD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QUFBLFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBeEI7QUFDQSxJQUFBLHdCQUF3QixHQUFHLFNBQVMsQ0FBQyxNQUFyQztBQUNEOztBQXRUYyxDQUFqQjtlQTBUZSxRIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgVVJMID0gXCJodHRwOi8vbG9jYWxob3N0OjgwODhcIlxyXG5cclxuY29uc3QgQVBJID0ge1xyXG5cclxuICBnZXRTaW5nbGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBnZXRBbGwoZXh0ZW5zaW9uKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZGVsZXRlSXRlbShleHRlbnNpb24sIGlkKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJERUxFVEVcIlxyXG4gICAgfSlcclxuICAgICAgLnRoZW4oZSA9PiBlLmpzb24oKSlcclxuICAgICAgLnRoZW4oKCkgPT4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gKSlcclxuICAgICAgLnRoZW4oZSA9PiBlLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwb3N0SXRlbShleHRlbnNpb24sIG9iaikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCwge1xyXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkob2JqKVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4ociA9PiByLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBwdXRJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQVVRcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQVBJIiwiZnVuY3Rpb24gZWxCdWlsZGVyKG5hbWUsIGF0dHJpYnV0ZXNPYmosIHR4dCwgLi4uY2hpbGRyZW4pIHtcclxuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgZm9yIChsZXQgYXR0ciBpbiBhdHRyaWJ1dGVzT2JqKSB7XHJcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ciwgYXR0cmlidXRlc09ialthdHRyXSk7XHJcbiAgfVxyXG4gIGVsLnRleHRDb250ZW50ID0gdHh0IHx8IG51bGw7XHJcbiAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICBlbC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbiAgfSlcclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGVsQnVpbGRlciIsImltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiO1xyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5cclxuLy8gdGhlIHB1cnBvc2Ugb2YgdGhpcyBtb2R1bGUgaXMgdG86XHJcbi8vIDEuIHNhdmUgYWxsIGNvbnRlbnQgaW4gdGhlIGdhbWVwbGF5IHBhZ2UgKHNob3QgYW5kIGdhbWUgZGF0YSkgdG8gdGhlIGRhdGFiYXNlXHJcbi8vIDIuIGltbWVkaWF0ZWx5IGNsZWFyIHRoZSBnYW1lcGxheSBjb250YWluZXJzIG9mIGNvbnRlbnQgb24gc2F2ZVxyXG4vLyAzLiBpbW1lZGlhdGVseSByZXNldCBhbGwgZ2xvYmFsIHZhcmlhYmxlcyBpbiB0aGUgc2hvdGRhdGEgZmlsZSB0byBhbGxvdyB0aGUgdXNlciB0byBiZWdpbiBzYXZpbmcgc2hvdHMgYW5kIGVudGVyaW5nIGdhbWUgZGF0YSBmb3IgdGhlaXIgbmV4dCBnYW1lXHJcbi8vIDQuIGFmZm9yZGFuY2UgZm9yIHVzZXIgdG8gcmVjYWxsIGFsbCBkYXRhIGZyb20gcHJldmlvdXMgc2F2ZWQgZ2FtZSBmb3IgZWRpdGluZ1xyXG4vLyA1LiBpbmNsdWRlIGFueSBvdGhlciBmdW5jdGlvbnMgbmVlZGVkIHRvIHN1cHBvcnQgdGhlIGZpcnN0IDQgcmVxdWlyZW1lbnRzXHJcblxyXG4vLyB0aGlzIGdsb2JhbCB2YXJpYWJsZSBpcyB1c2VkIHRvIHBhc3Mgc2F2ZWQgc2hvdHMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWwgYm9vbGVhbiB0byBzaG90RGF0YS5qcyBkdXJpbmcgdGhlIGVkaXQgcHJvY2Vzc1xyXG5sZXQgc2F2ZWRHYW1lT2JqZWN0O1xyXG5sZXQgcHV0UHJvbWlzZXNFZGl0TW9kZSA9IFtdO1xyXG5sZXQgcG9zdFByb21pc2VzRWRpdE1vZGUgPSBbXVxyXG5sZXQgcG9zdFByb21pc2VzID0gW107XHJcblxyXG5jb25zdCBnYW1lRGF0YSA9IHtcclxuXHJcbiAgZ2FtZVR5cGVCdXR0b25Ub2dnbGUoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB0b2dnbGVzIHRoZSBcImlzLXNlbGVjdGVkXCIgY2xhc3MgYmV0d2VlbiB0aGUgZ2FtZSB0eXBlIGJ1dHRvbnNcclxuXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgYnRuQ2xpY2tlZCA9IGUudGFyZ2V0O1xyXG5cclxuICAgIGlmICghYnRuQ2xpY2tlZC5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICBjb25zdCBjdXJyZW50R2FtZVR5cGVCdG4gPSBnYW1lVHlwZUJ0bnMuZmlsdGVyKGJ0biA9PiBidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBjdXJyZW50R2FtZVR5cGVCdG5bMF0uY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICAgIGJ0bkNsaWNrZWQuY2xhc3NMaXN0LmFkZChcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpIHtcclxuICAgIHNhdmVkR2FtZU9iamVjdCA9IHVuZGVmaW5lZDtcclxuICAgIHB1dFByb21pc2VzRWRpdE1vZGUgPSBbXTtcclxuICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlID0gW107XHJcbiAgICBwb3N0UHJvbWlzZXMgPSBbXTtcclxuICB9LFxyXG5cclxuICBwdXRFZGl0ZWRTaG90cyhwcmV2aW91c2x5U2F2ZWRTaG90c0Fycikge1xyXG4gICAgLy8gUFVUIGZpcnN0LCBzaWNuZSB5b3UgY2FuJ3Qgc2F2ZSBhIGdhbWUgaW5pdGlhbGx5IHdpdGhvdXQgYXQgbGVhc3QgMSBzaG90XHJcbiAgICBwcmV2aW91c2x5U2F2ZWRTaG90c0Fyci5mb3JFYWNoKHNob3QgPT4ge1xyXG4gICAgICAvLyBldmVuIHRob3VnaCBpdCdzIGEgUFVULCB3ZSBoYXZlIHRvIHJlZm9ybWF0IHRoZSBfZmllbGRYIHN5bnRheCB0byBmaWVsZFhcclxuICAgICAgbGV0IHNob3RGb3JQdXQgPSB7fTtcclxuICAgICAgc2hvdEZvclB1dC5nYW1lSWQgPSBzYXZlZEdhbWVPYmplY3QuaWQ7XHJcbiAgICAgIHNob3RGb3JQdXQuZmllbGRYID0gc2hvdC5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUHV0LmZpZWxkWSA9IHNob3QuX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclB1dC5nb2FsWCA9IHNob3QuX2dvYWxYO1xyXG4gICAgICBzaG90Rm9yUHV0LmdvYWxZID0gc2hvdC5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQdXQuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90LmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUHV0LmFlcmlhbCA9IHNob3QuX2FlcmlhbDtcclxuICAgICAgc2hvdEZvclB1dC50aW1lU3RhbXAgPSBzaG90Ll90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwdXRQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnB1dEl0ZW0oYHNob3RzLyR7c2hvdC5pZH1gLCBzaG90Rm9yUHV0KSk7XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHB1dFByb21pc2VzRWRpdE1vZGUpXHJcbiAgfSxcclxuXHJcbiAgcG9zdE5ld1Nob3RzTWFkZUR1cmluZ0VkaXRNb2RlKHNob3RzTm90WWV0UG9zdGVkQXJyKSB7XHJcbiAgICBzaG90c05vdFlldFBvc3RlZEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICBsZXQgc2hvdEZvclBvc3QgPSB7fTtcclxuICAgICAgc2hvdEZvclBvc3QuZ2FtZUlkID0gc2F2ZWRHYW1lT2JqZWN0LmlkO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFggPSBzaG90T2JqLl9maWVsZFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmZpZWxkWSA9IHNob3RPYmouX2ZpZWxkWTtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFggPSBzaG90T2JqLl9nb2FsWDtcclxuICAgICAgc2hvdEZvclBvc3QuZ29hbFkgPSBzaG90T2JqLl9nb2FsWTtcclxuICAgICAgc2hvdEZvclBvc3QuYmFsbF9zcGVlZCA9IE51bWJlcihzaG90T2JqLmJhbGxfc3BlZWQpO1xyXG4gICAgICBzaG90Rm9yUG9zdC5hZXJpYWwgPSBzaG90T2JqLl9hZXJpYWw7XHJcbiAgICAgIHNob3RGb3JQb3N0LnRpbWVTdGFtcCA9IHNob3RPYmouX3RpbWVTdGFtcDtcclxuXHJcbiAgICAgIHBvc3RQcm9taXNlc0VkaXRNb2RlLnB1c2goQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXNFZGl0TW9kZSlcclxuICB9LFxyXG5cclxuICBwb3N0TmV3U2hvdHMoZ2FtZUlkKSB7XHJcbiAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgIHNob3RBcnIuZm9yRWFjaChzaG90T2JqID0+IHtcclxuICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgIHNob3RGb3JQb3N0LmdhbWVJZCA9IGdhbWVJZDtcclxuICAgICAgc2hvdEZvclBvc3QuZmllbGRYID0gc2hvdE9iai5fZmllbGRYO1xyXG4gICAgICBzaG90Rm9yUG9zdC5maWVsZFkgPSBzaG90T2JqLl9maWVsZFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxYID0gc2hvdE9iai5fZ29hbFg7XHJcbiAgICAgIHNob3RGb3JQb3N0LmdvYWxZID0gc2hvdE9iai5fZ29hbFk7XHJcbiAgICAgIHNob3RGb3JQb3N0LmJhbGxfc3BlZWQgPSBOdW1iZXIoc2hvdE9iai5iYWxsX3NwZWVkKTtcclxuICAgICAgc2hvdEZvclBvc3QuYWVyaWFsID0gc2hvdE9iai5fYWVyaWFsO1xyXG4gICAgICBzaG90Rm9yUG9zdC50aW1lU3RhbXAgPSBzaG90T2JqLl90aW1lU3RhbXA7XHJcblxyXG4gICAgICBwb3N0UHJvbWlzZXMucHVzaChBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkpO1xyXG4gICAgfSlcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwb3N0UHJvbWlzZXMpXHJcbiAgfSxcclxuXHJcbiAgc2F2ZURhdGEoZ2FtZURhdGFPYmosIHNhdmluZ0VkaXRlZEdhbWUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZmlyc3QgZGV0ZXJtaW5lcyBpZiBhIGdhbWUgaXMgYmVpbmcgc2F2ZWQgYXMgbmV3LCBvciBhIHByZXZpb3VzbHkgc2F2ZWQgZ2FtZSBpcyBiZWluZyBlZGl0ZWRcclxuICAgIC8vIGlmIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSwgdGhlIGdhbWUgaXMgUFVULCBhbGwgc2hvdHMgc2F2ZWQgcHJldmlvdXNseSBhcmUgUFVULCBhbmQgbmV3IHNob3RzIGFyZSBQT1NURURcclxuICAgIC8vIGlmIHRoZSBnYW1lIGlzIGEgbmV3IGdhbWUgYWx0b2dldGhlciwgdGhlbiB0aGUgZ2FtZSBpcyBQT1NURUQgYW5kIGFsbCBzaG90cyBhcmUgUE9TVEVEXHJcbiAgICAvLyB0aGVuIGZ1bmN0aW9ucyBhcmUgY2FsbGVkIHRvIHJlbG9hZCB0aGUgbWFzdGVyIGNvbnRhaW5lciBhbmQgcmVzZXQgZ2xvYmFsIHNob3QgZGF0YSB2YXJpYWJsZXNcclxuXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSkge1xyXG4gICAgICAvLyB1c2UgSUQgb2YgZ2FtZSBzdG9yZWQgaW4gZ2xvYmFsIHZhclxyXG4gICAgICBBUEkucHV0SXRlbShgZ2FtZXMvJHtzYXZlZEdhbWVPYmplY3QuaWR9YCwgZ2FtZURhdGFPYmopXHJcbiAgICAgICAgLnRoZW4oZ2FtZVBVVCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlBVVCBHQU1FXCIsIGdhbWVQVVQpXHJcbiAgICAgICAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICAgICAgICBjb25zdCBzaG90QXJyID0gc2hvdERhdGEuZ2V0U2hvdE9iamVjdHNGb3JTYXZpbmcoKTtcclxuICAgICAgICAgIGNvbnN0IHByZXZpb3VzbHlTYXZlZFNob3RzQXJyID0gW107XHJcbiAgICAgICAgICBjb25zdCBzaG90c05vdFlldFBvc3RlZEFyciA9IFtdO1xyXG5cclxuICAgICAgICAgIC8vIGNyZWF0ZSBhcnJheXMgZm9yIFBVVCBhbmQgUE9TVCBmdW5jdGlvbnMgKGlmIHRoZXJlJ3MgYW4gaWQgaW4gdGhlIGFycmF5LCBpdCdzIGJlZW4gc2F2ZWQgdG8gdGhlIGRhdGFiYXNlIGJlZm9yZSlcclxuICAgICAgICAgIHNob3RBcnIuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgICAgICAgaWYgKHNob3QuaWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHByZXZpb3VzbHlTYXZlZFNob3RzQXJyLnB1c2goc2hvdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc2hvdHNOb3RZZXRQb3N0ZWRBcnIucHVzaChzaG90KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0byBQVVQgYW5kIFBPU1RcclxuICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRoYXQgY2xlYXIgZ2FtZXBsYXkgY29udGVudCBhbmQgcmVzZXQgZ2xvYmFsIHNob3QvZ2FtZSBkYXRhIHZhcmlhYmxlc1xyXG4gICAgICAgICAgZ2FtZURhdGEucHV0RWRpdGVkU2hvdHMocHJldmlvdXNseVNhdmVkU2hvdHNBcnIpXHJcbiAgICAgICAgICAgIC50aGVuKHggPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFVUUzpcIiwgeClcclxuICAgICAgICAgICAgICAvLyBpZiBubyBuZXcgc2hvdHMgd2VyZSBtYWRlLCByZWxvYWQuIGVsc2UgcG9zdCBuZXcgc2hvdHNcclxuICAgICAgICAgICAgICBpZiAoc2hvdHNOb3RZZXRQb3N0ZWRBcnIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZURhdGEucmVzZXRHbG9iYWxHYW1lVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90c01hZGVEdXJpbmdFZGl0TW9kZShzaG90c05vdFlldFBvc3RlZEFycilcclxuICAgICAgICAgICAgICAgICAgLnRoZW4oeSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQT1NUUzpcIiwgeSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lRGF0YS5yZXNldEdsb2JhbEdhbWVWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkucG9zdEl0ZW0oXCJnYW1lc1wiLCBnYW1lRGF0YU9iailcclxuICAgICAgICAudGhlbihnYW1lID0+IGdhbWUuaWQpXHJcbiAgICAgICAgLnRoZW4oZ2FtZUlkID0+IHtcclxuICAgICAgICAgIGdhbWVEYXRhLnBvc3ROZXdTaG90cyhnYW1lSWQpXHJcbiAgICAgICAgICAgIC50aGVuKHogPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU0FWRUQgTkVXIFNIT1RTXCIsIHopO1xyXG4gICAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgIGdhbWVEYXRhLnJlc2V0R2xvYmFsR2FtZVZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcGFja2FnZUdhbWVEYXRhKCkge1xyXG5cclxuICAgIC8vIGdldCB1c2VyIElEIGZyb20gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgICAvLyBwYWNrYWdlIGVhY2ggaW5wdXQgZnJvbSBnYW1lIGRhdGEgY29udGFpbmVyIGludG8gdmFyaWFibGVzXHJcbiAgICAvLyBUT0RPOiBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gcHJldmVudCBibGFuayBzY29yZSBlbnRyaWVzXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gc2F2ZSBnYW1lXHJcblxyXG4gICAgLy8gcGxheWVySWRcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgZ2FtZVR5cGUgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IHtcclxuICAgICAgaWYgKGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICAgIGdhbWVUeXBlID0gYnRuLnRleHRDb250ZW50XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIChub3RlOiBkaWQgbm90IHVzZSBib29sZWFuIGluIGNhc2UgbW9yZSBnYW1lIG1vZGVzIGFyZSBzdXBwb3J0ZWQgaW4gdGhlIGZ1dHVyZSlcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsX2dhbWVNb2RlLnZhbHVlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gbXkgdGVhbSAobm90ZTogZGlkIG5vdCB1c2UgYm9vbGVhbiBpbiBwcmVwYXJhdGlvbiBmb3IgdXNlcnMgdG8gZW50ZXIgdGhlIGNsdWIgaW5mb3JtYXRpb24pXHJcbiAgICBjb25zdCBzZWxfdGVhbUNvbG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBsZXQgbXlUZWFtO1xyXG4gICAgaWYgKHNlbF90ZWFtQ29sb3IudmFsdWUgPT09IFwiT3JhbmdlIHRlYW1cIikge1xyXG4gICAgICBteVRlYW0gPSBcIm9yYW5nZVwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbXlUZWFtID0gXCJibHVlXCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2NvcmVzXHJcbiAgICBsZXQgbXlTY29yZTtcclxuICAgIGxldCB0aGVpclNjb3JlO1xyXG4gICAgY29uc3QgaW5wdF9vcmFuZ2VTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3JhbmdlU2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmx1ZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJibHVlU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICBpZiAobXlUZWFtID09PSBcIm9yYW5nZVwiKSB7XHJcbiAgICAgIG15U2NvcmUgPSBOdW1iZXIoaW5wdF9vcmFuZ2VTY29yZS52YWx1ZSk7XHJcbiAgICAgIHRoZWlyU2NvcmUgPSBOdW1iZXIoaW5wdF9ibHVlU2NvcmUudmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbXlTY29yZSA9IE51bWJlcihpbnB0X2JsdWVTY29yZS52YWx1ZSk7XHJcbiAgICAgIHRoZWlyU2NvcmUgPSBOdW1iZXIoaW5wdF9vcmFuZ2VTY29yZS52YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGxldCBvdmVydGltZTtcclxuICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgIGlmIChzZWxfb3ZlcnRpbWUudmFsdWUgPT09IFwiT3ZlcnRpbWVcIikge1xyXG4gICAgICBvdmVydGltZSA9IHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvdmVydGltZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBnYW1lRGF0YU9iaiA9IHtcclxuICAgICAgXCJ1c2VySWRcIjogYWN0aXZlVXNlcklkLFxyXG4gICAgICBcIm1vZGVcIjogZ2FtZU1vZGUsXHJcbiAgICAgIFwidHlwZVwiOiBnYW1lVHlwZSxcclxuICAgICAgXCJ0ZWFtXCI6IG15VGVhbSxcclxuICAgICAgXCJzY29yZVwiOiBteVNjb3JlLFxyXG4gICAgICBcIm9wcF9zY29yZVwiOiB0aGVpclNjb3JlLFxyXG4gICAgICBcIm92ZXJ0aW1lXCI6IG92ZXJ0aW1lLFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSBuZXcgZ2FtZSBvciBlZGl0ZWQgZ2FtZSBpcyBiZWluZyBzYXZlZC4gSWYgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWQsIHRoZW4gdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHNob3Qgc2F2ZWQgYWxyZWFkeSwgbWFraW5nIHRoZSByZXR1cm4gZnJvbSB0aGUgc2hvdERhdGEgZnVuY3Rpb24gbW9yZSB0aGFuIDBcclxuICAgIGNvbnN0IHNhdmluZ0VkaXRlZEdhbWUgPSBzaG90RGF0YS5nZXRJbml0aWFsTnVtT2ZTaG90cygpXHJcbiAgICBpZiAoc2F2aW5nRWRpdGVkR2FtZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdhbWVEYXRhT2JqLnRpbWVTdGFtcCA9IHNhdmVkR2FtZU9iamVjdC50aW1lU3RhbXBcclxuICAgICAgZ2FtZURhdGEuc2F2ZURhdGEoZ2FtZURhdGFPYmosIHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdGltZSBzdGFtcCBpZiBuZXcgZ2FtZVxyXG4gICAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuICAgICAgZ2FtZURhdGFPYmoudGltZVN0YW1wID0gdGltZVN0YW1wXHJcbiAgICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNhdmVQcmV2R2FtZUVkaXRzKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJzYXZpbmcgZWRpdHMuLi5cIilcclxuICAgIGdhbWVEYXRhLnBhY2thZ2VHYW1lRGF0YSgpO1xyXG4gICAgLy8gVE9ETzogKChTVEVQIDMpKSBQVVQgZWRpdHMgdG8gZGF0YWJhc2VcclxuICB9LFxyXG5cclxuICBjYW5jZWxFZGl0aW5nTW9kZSgpIHtcclxuICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyRWRpdEJ1dHRvbnMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlbW92ZXMgJiByZXBsYWNlcyBlZGl0IGFuZCBzYXZlIGdhbWUgYnV0dG9ucyB3aXRoIFwiU2F2ZSBFZGl0c1wiIGFuZCBcIkNhbmNlbCBFZGl0c1wiXHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgLy8gaW4gY2FzZSBvZiBsYWcgaW4gZmV0Y2gsIHByZXZlbnQgdXNlciBmcm9tIGRvdWJsZSBjbGlja2luZyBidXR0b25cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5jbGFzc0xpc3QuYWRkKFwiaXMtbG9hZGluZ1wiKTtcclxuXHJcbiAgICBjb25zdCBidG5fY2FuY2VsRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBFZGl0c1wiKVxyXG4gICAgY29uc3QgYnRuX3NhdmVFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEVkaXRzXCIpXHJcblxyXG4gICAgYnRuX2NhbmNlbEVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5jYW5jZWxFZGl0aW5nTW9kZSlcclxuICAgIGJ0bl9zYXZlRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnNhdmVQcmV2R2FtZUVkaXRzKVxyXG5cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUucmVwbGFjZVdpdGgoYnRuX2NhbmNlbEVkaXRzKTtcclxuICAgIGJ0bl9zYXZlR2FtZS5yZXBsYWNlV2l0aChidG5fc2F2ZUVkaXRzKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyUHJldkdhbWUoZ2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgcmVuZGVyaW5nIHRoZSBzYXZlZCBnYW1lIGluZm9ybWF0aW9uIGluIHRoZSBcIkVudGVyIEdhbWUgRGF0YVwiIGNvbnRhaW5lci5cclxuICAgIC8vIGl0IHJlbGllcyBvbiBhIGZ1bmN0aW9uIGluIHNob3REYXRhLmpzIHRvIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBjb25zb2xlLmxvZyhnYW1lKVxyXG5cclxuICAgIC8vIGNhbGwgZnVuY3Rpb24gaW4gc2hvdERhdGEgdGhhdCBjYWxscyBnYW1hRGF0YS5wcm92aWRlU2hvdHNUb1Nob3REYXRhKClcclxuICAgIC8vIHRoZSBmdW5jdGlvbiB3aWxsIGNhcHR1cmUgdGhlIGFycmF5IG9mIHNhdmVkIHNob3RzIGFuZCByZW5kZXIgdGhlIHNob3QgYnV0dG9uc1xyXG4gICAgc2hvdERhdGEucmVuZGVyU2hvdHNCdXR0b25zRnJvbVByZXZpb3VzR2FtZSgpXHJcblxyXG4gICAgLy8gb3ZlcnRpbWVcclxuICAgIGNvbnN0IHNlbF9vdmVydGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3ZlcnRpbWVJbnB1dFwiKTtcclxuICAgIGlmIChnYW1lLm92ZXJ0aW1lKSB7XHJcbiAgICAgIHNlbF9vdmVydGltZS52YWx1ZSA9IFwiT3ZlcnRpbWVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX292ZXJ0aW1lLnZhbHVlID0gXCJObyBvdmVydGltZVwiXHJcbiAgICB9XHJcblxyXG4gICAgLy8gbXkgdGVhbVxyXG4gICAgY29uc3Qgc2VsX3RlYW1Db2xvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgaWYgKGdhbWUudGVhbSA9PT0gXCJvcmFuZ2VcIikge1xyXG4gICAgICBzZWxfdGVhbUNvbG9yLnZhbHVlID0gXCJPcmFuZ2UgdGVhbVwiXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZWxfdGVhbUNvbG9yLnZhbHVlID0gXCJCbHVlIHRlYW1cIlxyXG4gICAgfVxyXG5cclxuICAgIC8vIG15IHNjb3JlXHJcbiAgICBjb25zdCBpbnB0X29yYW5nZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvcmFuZ2VTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF9ibHVlU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJsdWVTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIGlmIChnYW1lLnRlYW0gPT09IFwib3JhbmdlXCIpIHtcclxuICAgICAgaW5wdF9vcmFuZ2VTY29yZS52YWx1ZSA9IGdhbWUuc2NvcmU7XHJcbiAgICAgIGlucHRfYmx1ZVNjb3JlLnZhbHVlID0gZ2FtZS5vcHBfc2NvcmU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbnB0X29yYW5nZVNjb3JlLnZhbHVlID0gZ2FtZS5vcHBfc2NvcmU7XHJcbiAgICAgIGlucHRfYmx1ZVNjb3JlLnZhbHVlID0gZ2FtZS5zY29yZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcblxyXG4gICAgaWYgKGdhbWUudHlwZSA9PT0gXCIzdjNcIikge1xyXG4gICAgICBidG5fM3YzLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzN2My5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgLy8gMnYyIGlzIHRoZSBkZWZhdWx0XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLXNlbGVjdGVkXCIpO1xyXG4gICAgICBidG5fMnYyLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgfSBlbHNlIGlmIChnYW1lLnR5cGUgPT09IFwiMnYyXCIpIHtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QuYWRkKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LmFkZChcImlzLWxpbmtcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBidG5fMXYxLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuXzF2MS5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgICAgYnRuXzJ2Mi5jbGFzc0xpc3QucmVtb3ZlKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgIGJ0bl8ydjIuY2xhc3NMaXN0LnJlbW92ZShcImlzLWxpbmtcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlXHJcbiAgICBjb25zdCBzZWxfZ2FtZU1vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVNb2RlSW5wdXRcIik7XHJcbiAgICBpZiAoZ2FtZS5tb2RlID0gXCJjb21wZXRpdGl2ZVwiKSB7XHJcbiAgICAgIHNlbF9nYW1lTW9kZS52YWx1ZSA9IFwiQ29tcGV0aXRpdmVcIlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsX2dhbWVNb2RlLnZhbHVlID0gXCJDYXN1YWxcIlxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBwcm92aWRlU2hvdHNUb1Nob3REYXRhKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBwcm92aWRlcyB0aGUgc2hvdHMgZm9yIHJlbmRlcmluZyB0byBzaG90RGF0YVxyXG4gICAgcmV0dXJuIHNhdmVkR2FtZU9iamVjdFxyXG4gIH0sXHJcblxyXG4gIGVkaXRQcmV2R2FtZSgpIHtcclxuICAgIC8vIGZldGNoIGNvbnRlbnQgZnJvbSBtb3N0IHJlY2VudCBnYW1lIHNhdmVkIHRvIGJlIHJlbmRlcmVkXHJcblxyXG4gICAgLy8gVE9ETzogY3JlYXRlIGEgbW9kYWwgYXNraW5nIHVzZXIgaWYgdGhleSB3YW50IHRvIGVkaXQgcHJldmlvdXMgZ2FtZVxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuXHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGAke2FjdGl2ZVVzZXJJZH0/X2VtYmVkPWdhbWVzYCkudGhlbih1c2VyID0+IHtcclxuICAgICAgaWYgKHVzZXIuZ2FtZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYWxlcnQoXCJObyBnYW1lcyBoYXZlIGJlZW4gc2F2ZWQgYnkgdGhpcyB1c2VyXCIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGdldCBtYXggZ2FtZSBpZCAod2hpY2ggaXMgdGhlIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQpXHJcbiAgICAgICAgY29uc3QgcmVjZW50R2FtZUlkID0gdXNlci5nYW1lcy5yZWR1Y2UoKG1heCwgb2JqKSA9PiBvYmouaWQgPiBtYXggPyBvYmouaWQgOiBtYXgsIHVzZXIuZ2FtZXNbMF0uaWQpO1xyXG4gICAgICAgIC8vIGZldGNoIG1vc3QgcmVjZW50IGdhbWUgYW5kIGVtYmVkIHNob3RzXHJcbiAgICAgICAgQVBJLmdldFNpbmdsZUl0ZW0oXCJnYW1lc1wiLCBgJHtyZWNlbnRHYW1lSWR9P19lbWJlZD1zaG90c2ApLnRoZW4oZ2FtZU9iaiA9PiB7XHJcbiAgICAgICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgZ2FtZURhdGEucmVuZGVyRWRpdEJ1dHRvbnMoKTtcclxuICAgICAgICAgIHNhdmVkR2FtZU9iamVjdCA9IGdhbWVPYmo7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJQcmV2R2FtZShnYW1lT2JqKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVEYXRhIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgZ2FtZXBsYXkgPSB7XHJcblxyXG4gIGxvYWRHYW1lcGxheSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIC8vIGNvbnN0IHhCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiZGVsZXRlXCIgfSk7XHJcbiAgICAvLyB4QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZUJveCwgZXZlbnQpOyAvLyBidXR0b24gd2lsbCBkaXNwbGF5OiBub25lIG9uIHBhcmVudCBjb250YWluZXJcclxuICAgIC8vIGNvbnN0IGhlYWRlckluZm8gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uIGlzLWluZm9cIiB9LCBcIkNyZWF0ZSBhbmQgc2F2ZSBzaG90cyAtIHRoZW4gc2F2ZSB0aGUgZ2FtZSByZWNvcmQuXCIsIHhCdXR0b24pO1xyXG4gICAgLy8gd2VicGFnZS5hcHBlbmRDaGlsZChoZWFkZXJJbmZvKTtcclxuICAgIHRoaXMuYnVpbGRTaG90Q29udGVudCgpO1xyXG4gICAgdGhpcy5idWlsZEdhbWVDb250ZW50KCk7XHJcbiAgICB0aGlzLmdhbWVwbGF5RXZlbnRNYW5hZ2VyKCk7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRTaG90Q29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gYnVpbGRzIHNob3QgY29udGFpbmVycyBhbmQgYWRkcyBjb250YWluZXIgY29udGVudFxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3Qgc2hvdFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgU2hvdCBEYXRhXCIpO1xyXG4gICAgY29uc3Qgc2hvdFRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdFRpdGxlKTtcclxuXHJcbiAgICAvLyBuZXcgc2hvdCBhbmQgc2F2ZSBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IG5ld1Nob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwibmV3U2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIk5ldyBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2F2ZVNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZVNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIFNob3RcIik7XHJcbiAgICBjb25zdCBjYW5jZWxTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImNhbmNlbFNob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBTaG90XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwic2hvdENvbnRyb2xzXCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGJ1dHRvbnNcIiB9LCBudWxsLCBuZXdTaG90LCBzYXZlU2hvdCwgY2FuY2VsU2hvdCk7XHJcbiAgICBjb25zdCBhbGlnblNob3RCdXR0b25zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBzaG90QnV0dG9ucyk7XHJcbiAgICBjb25zdCBzaG90QnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25TaG90QnV0dG9ucyk7XHJcblxyXG4gICAgLy8gYmFsbCBzcGVlZCBpbnB1dCBhbmQgYWVyaWFsIHNlbGVjdFxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJCYWxsIHNwZWVkIChrcGgpOlwiKVxyXG4gICAgY29uc3QgYmFsbFNwZWVkSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJiYWxsU3BlZWRJbnB1dFwiLCBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBpbnB1dFwiLCBcInR5cGVcIjpcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgYmFsbCBzcGVlZFwiIH0pO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJTdGFuZGFyZFwiKTtcclxuICAgIGNvbnN0IGFlcmlhbE9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQWVyaWFsXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImFlcmlhbElucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxPcHRpb24xLCBhZXJpYWxPcHRpb24yKTtcclxuICAgIGNvbnN0IGFlcmlhbFNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBhZXJpYWxTZWxlY3QpO1xyXG4gICAgY29uc3QgYWVyaWFsQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBhZXJpYWxTZWxlY3RQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIGJhbGxTcGVlZElucHV0VGl0bGUsIGJhbGxTcGVlZElucHV0LCBhZXJpYWxDb250cm9sKTtcclxuICAgIGNvbnN0IHNob3REZXRhaWxzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2hvdERldGFpbHMpO1xyXG5cclxuICAgIC8vIGZpZWxkIGFuZCBnb2FsIGltYWdlcyAobm90ZSBmaWVsZC1pbWcgaXMgY2xpcHBlZCB0byByZXN0cmljdCBjbGljayBhcmVhIGNvb3JkaW5hdGVzIGluIGxhdGVyIGZ1bmN0aW9uLlxyXG4gICAgLy8gZ29hbC1pbWcgdXNlcyBhbiB4L3kgZm9ybXVsYSBmb3IgY2xpY2sgYXJlYSBjb29yZGluYXRlcyByZXN0cmljdGlvbiwgc2luY2UgaXQncyBhIHJlY3RhbmdsZSlcclxuICAgIC8vIGFkZGl0aW9uYWxseSwgZmllbGQgYW5kIGdvYWwgYXJlIG5vdCBhbGlnbmVkIHdpdGggbGV2ZWwtbGVmdCBvciBsZXZlbC1yaWdodCAtIGl0J3MgYSBkaXJlY3QgbGV2ZWwgLS0+IGxldmVsLWl0ZW0gZm9yIGNlbnRlcmluZ1xyXG4gICAgY29uc3QgZmllbGRJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZUJhY2tncm91bmQgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLWJnXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwiXCIgfSwgbnVsbCwgZmllbGRJbWFnZUJhY2tncm91bmQsIGZpZWxkSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZmllbGRJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvUkxfZ29hbF9jcm9wcGVkX25vX2JnX0JXLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBnb2FsSW1hZ2VQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiZ29hbC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdvYWxJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkdvYWwgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdvYWxJbWFnZVBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnbkZpZWxkLCBhbGlnbkdvYWwpO1xyXG5cclxuICAgIC8vIHBhcmVudCBjb250YWluZXIgaG9sZGluZyBhbGwgc2hvdCBpbmZvcm1hdGlvblxyXG4gICAgY29uc3QgcGFyZW50U2hvdENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgc2hvdFRpdGxlQ29udGFpbmVyLCBzaG90QnV0dG9uQ29udGFpbmVyLCBzaG90RGV0YWlsc0NvbnRhaW5lciwgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyKVxyXG5cclxuICAgIC8vIGFwcGVuZCBzaG90cyBjb250YWluZXIgdG8gcGFnZVxyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRTaG90Q29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBidWlsZEdhbWVDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBjcmVhdGVzIGdhbWUgY29udGVudCBjb250YWluZXJzICh0ZWFtLCBnYW1lIHR5cGUsIGdhbWUgbW9kZSwgZXRjLilcclxuXHJcbiAgICAvLyBjb250YWluZXIgdGl0bGVcclxuICAgIGNvbnN0IGdhbWVUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIHRpdGxlIGlzLTRcIiB9LCBcIkVudGVyIEdhbWUgRGF0YVwiKTtcclxuICAgIGNvbnN0IHRpdGxlQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVRpdGxlKTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIHRvcCBjb250YWluZXJcclxuXHJcbiAgICAvLyAxdjEvMnYyLzN2MyBidXR0b25zIChub3RlOiBjb250cm9sIGNsYXNzIGlzIHVzZWQgd2l0aCBmaWVsZCB0byBhZGhlcmUgYnV0dG9ucyB0b2dldGhlcilcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8zdjNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiM3YzXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjNDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTN2Myk7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MiA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMnYyXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc2VsZWN0ZWQgaXMtbGlua1wiIH0sIFwiMnYyXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjJDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTJ2Mik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUxdjEpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBoYXMtYWRkb25zXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjNDb250cm9sLCBnYW1lVHlwZTJ2MkNvbnRyb2wsIGdhbWVUeXBlMXYxQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25GaWVsZCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIHNlbGVjdFxyXG4gICAgY29uc3QgbW9kZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ2FzdWFsXCIpO1xyXG4gICAgY29uc3QgbW9kZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImdhbWVNb2RlSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVPcHRpb24xLCBtb2RlT3B0aW9uMik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVTZWxlY3QpO1xyXG4gICAgY29uc3QgbW9kZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgbW9kZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gdGVhbSBzZWxlY3RcclxuICAgIGNvbnN0IHRlYW1PcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9yYW5nZSB0ZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQmx1ZSB0ZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJ0ZWFtSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1PcHRpb24xLCB0ZWFtT3B0aW9uMik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1TZWxlY3QpO1xyXG4gICAgY29uc3QgdGVhbUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgdGVhbVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWUgc2VsZWN0XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gb3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJvdmVydGltZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZU9wdGlvbjEsIG92ZXJ0aW1lT3B0aW9uMik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdCk7XHJcbiAgICBjb25zdCBvdmVydGltZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gYm90dG9tIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIHNjb3JlIGlucHV0c1xyXG4gICAgLy8gKioqKk5vdGUgaW5saW5lIHN0eWxpbmcgb2YgaW5wdXQgd2lkdGhzXHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiT3JhbmdlIHRlYW0gc2NvcmU6XCIpO1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm9yYW5nZVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgb3JhbmdlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCBvcmFuZ2VTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiQmx1ZSB0ZWFtIHNjb3JlOlwiKVxyXG4gICAgY29uc3QgYmx1ZVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJibHVlU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBibHVlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgYmx1ZVNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3Qgc2NvcmVJbnB1dENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgb3JhbmdlU2NvcmVJbnB1dFRpdGxlLCBvcmFuZ2VTY29yZUNvbnRyb2wsIGJsdWVTY29yZUlucHV0VGl0bGUsIGJsdWVTY29yZUNvbnRyb2wpO1xyXG5cclxuICAgIC8vIGVkaXQvc2F2ZSBnYW1lIGJ1dHRvbnNcclxuICAgIGNvbnN0IGVkaXRQcmV2aW91c0dhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZWRpdFByZXZHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJFZGl0IFByZXZpb3VzIEdhbWVcIik7XHJcbiAgICBjb25zdCBzYXZlR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlR2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgR2FtZVwiKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25BbGlnbm1lbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9ucyBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgc2F2ZUdhbWUsIGVkaXRQcmV2aW91c0dhbWUpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1yaWdodFwiIH0sIG51bGwsIGdhbWVCdXR0b25BbGlnbm1lbnQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyVG9wID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25Db250YWluZXIsIG1vZGVDb250cm9sLCB0ZWFtQ29udHJvbCwgb3ZlcnRpbWVDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJCb3R0b20gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzY29yZUlucHV0Q29udGFpbmVyLCBnYW1lQnV0dG9uQ29udGFpbmVyKTtcclxuICAgIGNvbnN0IHBhcmVudEdhbWVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHRpdGxlQ29udGFpbmVyLCBnYW1lQ29udGFpbmVyVG9wLCBnYW1lQ29udGFpbmVyQm90dG9tKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50R2FtZUNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlFdmVudE1hbmFnZXIoKSB7XHJcblxyXG4gICAgLy8gYnV0dG9uc1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZVNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2NhbmNlbFNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbmNlbFNob3RcIik7XHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG5cclxuICAgIC8vIGFkZCBsaXN0ZW5lcnNcclxuICAgIGJ0bl9uZXdTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jcmVhdGVOZXdTaG90KTtcclxuICAgIGJ0bl9zYXZlU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuc2F2ZVNob3QpO1xyXG4gICAgYnRuX2NhbmNlbFNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmNhbmNlbFNob3QpO1xyXG4gICAgYnRuX3NhdmVHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5wYWNrYWdlR2FtZURhdGEpO1xyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZ2FtZVR5cGVCdXR0b25Ub2dnbGUpKTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmVkaXRQcmV2R2FtZSlcclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZXBsYXkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBoZWF0bWFwcyA9IHtcclxuXHJcbiAgbG9hZEhlYXRtYXBDb250YWluZXJzKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgdGhpcy5idWlsZEZpbHRlcnMoKTtcclxuICB9LFxyXG5cclxuICBidWlsZEZpbHRlcnMoKSB7XHJcblxyXG5cclxuICAgIC8vICAgPHAgY2xhc3M9XCJidXR0b25zXCI+XHJcbiAgICAvLyA8YSBjbGFzcz1cImJ1dHRvblwiPlxyXG4gICAgLy8gICA8c3BhbiBjbGFzcz1cImljb25cIj5cclxuICAgIC8vICAgICA8aSBjbGFzcz1cImZhYiBmYS1naXRodWJcIj48L2k+XHJcbiAgICAvLyAgIDwvc3Bhbj5cclxuICAgIC8vICAgPHNwYW4+R2l0SHViPC9zcGFuPlxyXG4gICAgLy8gPC9hPlxyXG5cclxuICAgIC8vIHJlc2V0IGJ1dHRvblxyXG4gICAgY29uc3QgcmVzZXRCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiUmVzZXQgRmlsdGVyc1wiKTtcclxuXHJcbiAgICAvLyBkYXRlIHJhbmdlIGJ1dHRvblxyXG4gICAgY29uc3QgZGF0ZUJ0blRleHQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHt9LCBcIkRhdGUgUmFuZ2VcIilcclxuICAgIGNvbnN0IGRhdGVCdG5JY29uID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtY2FsZW5kYXJcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGRhdGVCdG5JY29uU3BhbiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1zbWFsbFwiIH0sIG51bGwsIGRhdGVCdG5JY29uKTtcclxuICAgIGNvbnN0IGRhdGVCdG4gPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1vdXRsaW5lZCBpcy1kYXJrXCIgfSwgbnVsbCwgZGF0ZUJ0bkljb25TcGFuLCBkYXRlQnRuVGV4dCk7XHJcbiAgICBjb25zdCBkYXRlQnRuUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBkYXRlQnRuKTtcclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgY29uc3QgaWNvbjYgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1jbG9ja1wiIH0sIG51bGwpO1xyXG4gICAgY29uc3QgaWNvblNwYW42ID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiY2xhc3NcIjogXCJpY29uIGlzLWxlZnRcIiB9LCBudWxsLCBpY29uNik7XHJcbiAgICBjb25zdCBzZWw2X29wMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IHNlbDZfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlllc1wiKTtcclxuICAgIGNvbnN0IHNlbDZfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0NiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsNl9vcDEsIHNlbDZfb3AyLCBzZWw2X29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXY2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0NiwgaWNvblNwYW42KTtcclxuICAgIGNvbnN0IGNvbnRyb2w2ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXY2KTtcclxuXHJcbiAgICAvLyByZXN1bHRcclxuICAgIGNvbnN0IGljb241ID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtdHJvcGh5XCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjUgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb241KTtcclxuICAgIGNvbnN0IHNlbDVfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlJlc3VsdFwiKTtcclxuICAgIGNvbnN0IHNlbDVfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlZpY3RvcnlcIik7XHJcbiAgICBjb25zdCBzZWw1X29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJEZWZlYXRcIik7XHJcbiAgICBjb25zdCBzZWxlY3Q1ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWw1X29wMSwgc2VsNV9vcDIsIHNlbDVfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q1LCBpY29uU3BhbjUpO1xyXG4gICAgY29uc3QgY29udHJvbDUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjUpO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZVxyXG4gICAgY29uc3QgaWNvbjQgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1zaXRlbWFwXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjQgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb240KTtcclxuICAgIGNvbnN0IHNlbDRfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkdhbWUgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IHNlbDRfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IHNlbDRfb3A0ID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IHNlbGVjdDQgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwge30sIG51bGwsIHNlbDRfb3AxLCBzZWw0X29wMiwgc2VsNF9vcDMsIHNlbDRfb3A0KTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3Q0LCBpY29uU3BhbjQpO1xyXG4gICAgY29uc3QgY29udHJvbDQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjQpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZVxyXG4gICAgY29uc3QgaWNvbjMgPSBlbEJ1aWxkZXIoXCJpXCIsIHsgXCJjbGFzc1wiOiBcImZhcyBmYS1oYW5kc2hha2VcIiB9LCBudWxsKTtcclxuICAgIGNvbnN0IGljb25TcGFuMyA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImNsYXNzXCI6IFwiaWNvbiBpcy1sZWZ0XCIgfSwgbnVsbCwgaWNvbjMpO1xyXG4gICAgY29uc3Qgc2VsM19vcDEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiR2FtZSBNb2RlXCIpO1xyXG4gICAgY29uc3Qgc2VsM19vcDIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBzZWwzX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBzZWxlY3QzID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHt9LCBudWxsLCBzZWwzX29wMSwgc2VsM19vcDIsIHNlbDNfb3AzKTtcclxuICAgIGNvbnN0IHNlbGVjdERpdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0IGlzLWRhcmtcIiB9LCBudWxsLCBzZWxlY3QzLCBpY29uU3BhbjMpO1xyXG4gICAgY29uc3QgY29udHJvbDMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBoYXMtaWNvbnMtbGVmdFwiIH0sIG51bGwsIHNlbGVjdERpdjMpO1xyXG5cclxuICAgIC8vIHRlYW1cclxuICAgIGNvbnN0IGljb24yID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtaGFuZHNoYWtlXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24yKTtcclxuICAgIGNvbnN0IHNlbDJfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlRlYW1cIik7XHJcbiAgICBjb25zdCBzZWwyX29wMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPcmFuZ2VcIik7XHJcbiAgICBjb25zdCBzZWwyX29wMyA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCbHVlXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MiA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsMl9vcDEsIHNlbDJfb3AyLCBzZWwyX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MiwgaWNvblNwYW4yKTtcclxuICAgIGNvbnN0IGNvbnRyb2wyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYyKTtcclxuXHJcbiAgICAvLyBzaG90IHR5cGVcclxuICAgIGNvbnN0IGljb24xID0gZWxCdWlsZGVyKFwiaVwiLCB7IFwiY2xhc3NcIjogXCJmYXMgZmEtZnV0Ym9sXCIgfSwgbnVsbCk7XHJcbiAgICBjb25zdCBpY29uU3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJjbGFzc1wiOiBcImljb24gaXMtbGVmdFwiIH0sIG51bGwsIGljb24xKTtcclxuICAgIGNvbnN0IHNlbDFfb3AxID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlNob3QgVHlwZVwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AyID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IHNlbDFfb3AzID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3Qgc2VsZWN0MSA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7fSwgbnVsbCwgc2VsMV9vcDEsIHNlbDFfb3AyLCBzZWwxX29wMyk7XHJcbiAgICBjb25zdCBzZWxlY3REaXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdCBpcy1kYXJrXCIgfSwgbnVsbCwgc2VsZWN0MSwgaWNvblNwYW4xKTtcclxuICAgIGNvbnN0IGNvbnRyb2wxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgaGFzLWljb25zLWxlZnRcIiB9LCBudWxsLCBzZWxlY3REaXYxKTtcclxuXHJcbiAgICBjb25zdCBmaWx0ZXJGaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBpcy1ncm91cGVkIGlzLWdyb3VwZWQtY2VudGVyZWQgaXMtZ3JvdXBlZC1tdWx0aWxpbmVcIiB9LCBudWxsLCBjb250cm9sMSwgY29udHJvbDIsIGNvbnRyb2wzLCBjb250cm9sNCwgY29udHJvbDUsIGNvbnRyb2w2LCBkYXRlQnRuUGFyZW50LCByZXNldEJ0bik7XHJcbiAgICBjb25zdCBQYXJlbnRGaWx0ZXJDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIGZpbHRlckZpZWxkKTtcclxuXHJcbiAgICAvLyBhcHBlbmQgZmlsdGVyIGNvbnRhaW5lciB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKFBhcmVudEZpbHRlckNvbnRhaW5lcik7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaGVhdG1hcHMiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5pbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbG9naW5PclNpZ251cCA9IHtcclxuXHJcbiAgLy8gYnVpbGQgYSBsb2dpbiBmb3JtIHRoYXQgdmFsaWRhdGVzIHVzZXIgaW5wdXQuIFN1Y2Nlc3NmdWwgbG9naW4gc3RvcmVzIHVzZXIgaWQgaW4gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgbG9naW5Gb3JtKCkge1xyXG4gICAgY29uc3QgbG9naW5JbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwicGFzc3dvcmRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJsb2dpbk5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luIG5vd1wiKTtcclxuICAgIGNvbnN0IGxvZ2luRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwibG9naW5Gb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBsb2dpbklucHV0X3VzZXJuYW1lLCBsb2dpbklucHV0X3Bhc3N3b3JkLCBsb2dpbkJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChsb2dpbkZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cEZvcm0oKSB7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9uYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9jb25maXJtID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiY29uZmlybVBhc3N3b3JkXCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJjb25maXJtIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2lnbnVwTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cCBub3dcIik7XHJcbiAgICBjb25zdCBzaWdudXBGb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJzaWdudXBGb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9uYW1lLCBzaWdudXBJbnB1dF91c2VybmFtZSwgc2lnbnVwSW5wdXRfcGFzc3dvcmQsIHNpZ251cElucHV0X2NvbmZpcm0sIHNpZ251cEJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChzaWdudXBGb3JtKVxyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKClcclxuICB9LFxyXG5cclxuICAvLyBhc3NpZ24gZXZlbnQgbGlzdGVuZXJzIGJhc2VkIG9uIHdoaWNoIGZvcm0gaXMgb24gdGhlIHdlYnBhZ2VcclxuICB1c2VyRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgY29uc3QgbG9naW5Ob3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZ2luTm93XCIpXHJcbiAgICBjb25zdCBzaWdudXBOb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpZ251cE5vd1wiKVxyXG4gICAgaWYgKGxvZ2luTm93ID09PSBudWxsKSB7XHJcbiAgICAgIHNpZ251cE5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBVc2VyLCBldmVudClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxvZ2luTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luVXNlciwgZXZlbnQpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gdmFsaWRhdGUgdXNlciBsb2dpbiBmb3JtIGlucHV0cyBiZWZvcmUgbG9nZ2luZyBpblxyXG4gIGxvZ2luVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKHVzZXIgPT4ge1xyXG4gICAgICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFuZCBwYXNzd29yZFxyXG4gICAgICAgIGlmICh1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIGlmICh1c2VyLnBhc3N3b3JkID09PSBwYXNzd29yZCkge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cFVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc29sZS5sb2coZSlcclxuICAgIGNvbnN0IF9uYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF91c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3Bhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBjb25maXJtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maXJtUGFzc3dvcmRcIikudmFsdWVcclxuICAgIGxldCB1bmlxdWVVc2VybmFtZSA9IHRydWU7IC8vY2hhbmdlcyB0byBmYWxzZSBpZiB1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1xyXG4gICAgaWYgKF9uYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfdXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoY29uZmlybSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkICE9PSBjb25maXJtKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChcInVzZXJzXCIpLnRoZW4odXNlcnMgPT4gdXNlcnMuZm9yRWFjaCgodXNlciwgaWR4KSA9PiB7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIGV4aXN0aW5nIHVzZXJuYW1lIGluIGRhdGFiYXNlXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gX3VzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIHVuaXF1ZVVzZXJuYW1lID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vYXQgdGhlIGVuZCBvZiB0aGUgbG9vcCwgcG9zdFxyXG4gICAgICAgIGlmIChpZHggPT09IHVzZXJzLmxlbmd0aCAtIDEgJiYgdW5pcXVlVXNlcm5hbWUpIHtcclxuICAgICAgICAgIGxldCBuZXdVc2VyID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBfbmFtZSxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IF91c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IF9wYXNzd29yZCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBBUEkucG9zdEl0ZW0oXCJ1c2Vyc1wiLCBuZXdVc2VyKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9naW5TdGF0dXNBY3RpdmUodXNlcikge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiLCB1c2VyLmlkKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKTsgLy9idWlsZCBsb2dnZWQgaW4gdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9LFxyXG5cclxuICBsb2dvdXRVc2VyKCkge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcihmYWxzZSk7IC8vYnVpbGQgbG9nZ2VkIG91dCB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvZ2luT3JTaWdudXAiLCJpbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcbmltcG9ydCBoZWF0bWFwcyBmcm9tIFwiLi9oZWF0bWFwc1wiO1xyXG5cclxuLy8gZnVuY3Rpb24gY2xvc2VCb3goZSkge1xyXG4vLyAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJkZWxldGVcIikpIHtcclxuLy8gICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuLy8gbmF2YmFyLmdlbmVyYXRlTmF2YmFyKClcclxubmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpXHJcbmhlYXRtYXBzLmxvYWRIZWF0bWFwQ29udGFpbmVycygpOyIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgbG9naW5PclNpZ251cCBmcm9tIFwiLi9sb2dpblwiXHJcbmltcG9ydCBwcm9maWxlIGZyb20gXCIuL3Byb2ZpbGVcIlxyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIlxyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIlxyXG5pbXBvcnQgaGVhdG1hcHMgZnJvbSBcIi4vaGVhdG1hcHNcIlxyXG5cclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbi8qXHJcbiAgQnVsbWEgbmF2YmFyIHN0cnVjdHVyZTpcclxuICA8bmF2PlxyXG4gICAgPG5hdmJhci1icmFuZD5cclxuICAgICAgPG5hdmJhci1idXJnZXI+IChvcHRpb25hbClcclxuICAgIDwvbmF2YmFyLWJyYW5kPlxyXG4gICAgPG5hdmJhci1tZW51PlxyXG4gICAgICA8bmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8L25hdmJhci1zdGFydD5cclxuICAgICAgPG5hdmJhci1lbmQ+XHJcbiAgICAgIDwvbmF2YmFyLWVuZD5cclxuICAgIDwvbmF2YmFyLW1lbnU+XHJcbiAgPC9uYXY+XHJcblxyXG4gIFRoZSBmdW5jdGlvbnMgYmVsb3cgYnVpbGQgdGhlIG5hdmJhciBmcm9tIHRoZSBpbnNpZGUgb3V0XHJcbiovXHJcblxyXG5jb25zdCBuYXZiYXIgPSB7XHJcblxyXG4gIGdlbmVyYXRlTmF2YmFyKGxvZ2dlZEluQm9vbGVhbikge1xyXG5cclxuICAgIC8vIG5hdmJhci1tZW51IChyaWdodCBzaWRlIG9mIG5hdmJhciAtIGFwcGVhcnMgb24gZGVza3RvcCAxMDI0cHgrKVxyXG4gICAgY29uc3QgYnV0dG9uMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luXCIpXHJcbiAgICBjb25zdCBidXR0b24xID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cFwiKVxyXG4gICAgY29uc3QgYnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnNcIiB9LCBudWxsLCBidXR0b24xLCBidXR0b24yKVxyXG4gICAgY29uc3QgbWVudUl0ZW0xID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgbnVsbCwgYnV0dG9uQ29udGFpbmVyKVxyXG4gICAgY29uc3QgbmF2YmFyRW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1lbmRcIiB9LCBudWxsLCBtZW51SXRlbTEpXHJcbiAgICBjb25zdCBuYXZiYXJTdGFydCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItc3RhcnRcIiB9KVxyXG4gICAgY29uc3QgbmF2YmFyTWVudSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJuYXZiYXJNZW51XCIsIFwiY2xhc3NcIjogXCJuYXZiYXItbWVudVwiIH0sIG51bGwsIG5hdmJhclN0YXJ0LCBuYXZiYXJFbmQpXHJcblxyXG4gICAgLy8gbmF2YmFyLWJyYW5kIChsZWZ0IHNpZGUgb2YgbmF2YmFyIC0gaW5jbHVkZXMgbW9iaWxlIGhhbWJ1cmdlciBtZW51KVxyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4xID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMyA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJyb2xlXCI6IFwiYnV0dG9uXCIsIFwiY2xhc3NcIjogXCJuYXZiYXItYnVyZ2VyIGJ1cmdlclwiLCBcImFyaWEtbGFiZWxcIjogXCJtZW51XCIsIFwiYXJpYS1leHBhbmRlZFwiOiBcImZhbHNlXCIsIFwiZGF0YS10YXJnZXRcIjogXCJuYXZiYXJNZW51XCIgfSwgbnVsbCwgYnVyZ2VyTWVudVNwYW4xLCBidXJnZXJNZW51U3BhbjIsIGJ1cmdlck1lbnVTcGFuMyk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiwgXCJocmVmXCI6IFwiI1wiIH0sIG51bGwsIGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL2ZpcmU5MGRlZy5wbmdcIiwgXCJ3aWR0aFwiOiBcIjExMlwiLCBcImhlaWdodFwiOiBcIjI4XCIgfSkpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWJyYW5kXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmRDaGlsZDEsIG5hdmJhckJyYW5kQ2hpbGQyKTtcclxuXHJcbiAgICAvLyBuYXYgKHBhcmVudCBuYXYgSFRNTCBlbGVtZW50KVxyXG4gICAgY29uc3QgbmF2ID0gZWxCdWlsZGVyKFwibmF2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhclwiLCBcInJvbGVcIjogXCJuYXZpZ2F0aW9uXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1haW4gbmF2aWdhdGlvblwiIH0sIG51bGwsIG5hdmJhckJyYW5kLCBuYXZiYXJNZW51KTtcclxuXHJcbiAgICAvLyBpZiBsb2dnZWQgaW4sIGFwcGVuZCBhZGRpdGlvbmFsIG1lbnUgb3B0aW9ucyB0byBuYXZiYXIgYW5kIHJlbW92ZSBzaWdudXAvbG9naW4gYnV0dG9uc1xyXG4gICAgaWYgKGxvZ2dlZEluQm9vbGVhbikge1xyXG4gICAgICAvLyByZW1vdmUgbG9nIGluIGFuZCBzaWduIHVwIGJ1dHRvbnNcclxuICAgICAgY29uc3Qgc2lnbnVwID0gYnV0dG9uQ29udGFpbmVyLmNoaWxkTm9kZXNbMF07XHJcbiAgICAgIGNvbnN0IGxvZ2luID0gYnV0dG9uQ29udGFpbmVyLmNoaWxkTm9kZXNbMV07XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChzaWdudXApO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQobG9naW4pO1xyXG4gICAgICAvLyBhZGQgbG9nb3V0IGJ1dHRvblxyXG4gICAgICBjb25zdCBidXR0b24zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9nb3V0XCIpO1xyXG4gICAgICBidXR0b25Db250YWluZXIuYXBwZW5kQ2hpbGQoYnV0dG9uMyk7XHJcblxyXG4gICAgICAvLyBjcmVhdGUgYW5kIGFwcGVuZCBuZXcgbWVudSBpdGVtcyBmb3IgdXNlclxyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0xID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiUHJvZmlsZVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkdhbWVwbGF5XCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiSGVhdG1hcHNcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTQgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJMZWFkZXJib2FyZFwiKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMSk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTIpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0zKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtNCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBuYXZiYXJcclxuICAgIHRoaXMubmF2YmFyRXZlbnRNYW5hZ2VyKG5hdik7XHJcblxyXG4gICAgLy8gYXBwZW5kIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2VOYXYuYXBwZW5kQ2hpbGQobmF2KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgbmF2YmFyRXZlbnRNYW5hZ2VyKG5hdikge1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luQ2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cENsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dvdXRDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucHJvZmlsZUNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5nYW1lcGxheUNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oZWF0bWFwc0NsaWNrZWQsIGV2ZW50KTtcclxuICB9LFxyXG5cclxuICBsb2dpbkNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ2luXCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5sb2dpbkZvcm0oKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzaWdudXBDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJTaWduIHVwXCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5zaWdudXBGb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9nb3V0XCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5sb2dvdXRVc2VyKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcHJvZmlsZUNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIlByb2ZpbGVcIikge1xyXG4gICAgICBwcm9maWxlLmxvYWRQcm9maWxlKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJHYW1lcGxheVwiKSB7XHJcbiAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBoZWF0bWFwc0NsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkhlYXRtYXBzXCIpIHtcclxuICAgICAgaGVhdG1hcHMubG9hZEhlYXRtYXBDb250YWluZXJzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmF2YmFyIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBwcm9maWxlID0ge1xyXG5cclxuICBsb2FkUHJvZmlsZSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGFjdGl2ZVVzZXJJZCkudGhlbih1c2VyID0+IHtcclxuICAgICAgY29uc3QgcHJvZmlsZVBpYyA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL29jdGFuZS5qcGdcIiwgXCJjbGFzc1wiOiBcIlwiIH0pXHJcbiAgICAgIGNvbnN0IG5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYE5hbWU6ICR7dXNlci5uYW1lfWApXHJcbiAgICAgIGNvbnN0IHVzZXJuYW1lID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvblwiIH0sIGBVc2VybmFtZTogJHt1c2VyLnVzZXJuYW1lfWApXHJcbiAgICAgIGNvbnN0IHBsYXllclByb2ZpbGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwicGxheWVyUHJvZmlsZVwiLCBcImNsYXNzXCI6IFwiY29udGFpbmVyXCIgfSwgbnVsbCwgcHJvZmlsZVBpYywgbmFtZSwgdXNlcm5hbWUpXHJcbiAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGxheWVyUHJvZmlsZSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJvZmlsZSIsImNsYXNzIHNob3RPbkdvYWwge1xyXG4gIHNldCBmaWVsZFgoZmllbGRYKSB7XHJcbiAgICB0aGlzLl9maWVsZFggPSBmaWVsZFhcclxuICB9XHJcbiAgc2V0IGZpZWxkWShmaWVsZFkpIHtcclxuICAgIHRoaXMuX2ZpZWxkWSA9IGZpZWxkWVxyXG4gIH1cclxuICBzZXQgZ29hbFgoZ29hbFgpIHtcclxuICAgIHRoaXMuX2dvYWxYID0gZ29hbFhcclxuICB9XHJcbiAgc2V0IGdvYWxZKGdvYWxZKSB7XHJcbiAgICB0aGlzLl9nb2FsWSA9IGdvYWxZXHJcbiAgfVxyXG4gIHNldCBhZXJpYWwoYWVyaWFsQm9vbGVhbikge1xyXG4gICAgdGhpcy5fYWVyaWFsID0gYWVyaWFsQm9vbGVhblxyXG4gIH1cclxuICBzZXQgYmFsbFNwZWVkKGJhbGxTcGVlZCkge1xyXG4gICAgdGhpcy5iYWxsX3NwZWVkID0gYmFsbFNwZWVkXHJcbiAgfVxyXG4gIHNldCB0aW1lU3RhbXAoZGF0ZU9iaikge1xyXG4gICAgdGhpcy5fdGltZVN0YW1wID0gZGF0ZU9ialxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgc2hvdE9uR29hbCIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgc2hvdE9uR29hbCBmcm9tIFwiLi9zaG90Q2xhc3NcIlxyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSBcIi4vZ2FtZURhdGFcIjtcclxuXHJcbmxldCBzaG90Q291bnRlciA9IDA7XHJcbmxldCBlZGl0aW5nU2hvdCA9IGZhbHNlOyAvL2VkaXRpbmcgc2hvdCBpcyB1c2VkIGZvciBib3RoIG5ldyBhbmQgb2xkIHNob3RzXHJcbmxldCBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG5sZXQgc2hvdEFycmF5ID0gW107IC8vIHJlc2V0IHdoZW4gZ2FtZSBpcyBzYXZlZFxyXG4vLyBnbG9iYWwgdmFycyB1c2VkIHdpdGggc2hvdCBlZGl0aW5nXHJcbmxldCBwcmV2aW91c1Nob3RPYmo7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFg7XHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFk7XHJcbmxldCBwcmV2aW91c1Nob3RHb2FsWDtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxZO1xyXG4vLyBnbG9iYWwgdmFyIHVzZWQgd2hlbiBzYXZpbmcgYW4gZWRpdGVkIGdhbWUgKHRvIGRldGVybWluZSBpZiBuZXcgc2hvdHMgd2VyZSBhZGRlZCBmb3IgUE9TVClcclxubGV0IGluaXRpYWxMZW5ndGhPZlNob3RBcnJheTtcclxuXHJcbmNvbnN0IHNob3REYXRhID0ge1xyXG5cclxuICByZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGdhbWVwbGF5IGlzIGNsaWNrZWQgb24gdGhlIG5hdmJhciBhbmQgd2hlbiBhIGdhbWUgaXMgc2F2ZWQsIGluIG9yZGVyIHRvIHByZXZlbnQgYnVncyB3aXRoIHByZXZpb3VzbHkgY3JlYXRlZCBzaG90c1xyXG4gICAgc2hvdENvdW50ZXIgPSAwO1xyXG4gICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBzaG90QXJyYXkgPSBbXTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXkgPSB1bmRlZmluZWQ7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlTmV3U2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgc2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsO1xyXG4gICAgc2hvdE9iai50aW1lU3RhbXAgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vIHByZXZlbnQgdXNlciBmcm9tIHNlbGVjdGluZyBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnModHJ1ZSk7XHJcblxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcblxyXG4gICAgLy8gYWN0aXZhdGUgY2xpY2sgZnVuY3Rpb25hbGl0eSBhbmQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBvbiBib3RoIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gIH0sXHJcblxyXG4gIGdldENsaWNrQ29vcmRzKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZ2V0cyB0aGUgcmVsYXRpdmUgeCBhbmQgeSBvZiB0aGUgY2xpY2sgd2l0aGluIHRoZSBmaWVsZCBpbWFnZSBjb250YWluZXJcclxuICAgIC8vIGFuZCB0aGVuIGNhbGxzIHRoZSBmdW5jdGlvbiB0aGF0IGFwcGVuZHMgYSBtYXJrZXIgb24gdGhlIHBhZ2VcclxuICAgIGxldCBwYXJlbnRDb250YWluZXI7XHJcbiAgICBpZiAoZS50YXJnZXQuaWQgPT09IFwiZmllbGQtaW1nXCIpIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICB9XHJcbiAgICAvLyBvZmZzZXRYIGFuZCBZIGFyZSB0aGUgeCBhbmQgeSBjb29yZGluYXRlcyAocGl4ZWxzKSBvZiB0aGUgY2xpY2sgaW4gdGhlIGNvbnRhaW5lclxyXG4gICAgLy8gdGhlIGV4cHJlc3Npb25zIGRpdmlkZSB0aGUgY2xpY2sgeCBhbmQgeSBieSB0aGUgcGFyZW50IGZ1bGwgd2lkdGggYW5kIGhlaWdodFxyXG4gICAgY29uc3QgeENvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WCAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSlcclxuICAgIGNvbnN0IHlDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeENvb3JkUmVsYXRpdmUsIHlDb29yZFJlbGF0aXZlLCBwYXJlbnRDb250YWluZXIpXHJcbiAgfSxcclxuXHJcbiAgbWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpIHtcclxuICAgIGxldCBtYXJrZXJJZDtcclxuICAgIGlmIChwYXJlbnRDb250YWluZXIuaWQgPT09IFwiZmllbGQtaW1nLXBhcmVudFwiKSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1maWVsZFwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWdvYWxcIjtcclxuICAgIH1cclxuICAgIC8vIGFkanVzdCBmb3IgNTAlIG9mIHdpZHRoIGFuZCBoZWlnaHQgb2YgbWFya2VyIHNvIGl0J3MgY2VudGVyZWQgYWJvdXQgbW91c2UgcG9pbnRlclxyXG4gICAgbGV0IGFkanVzdE1hcmtlclggPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IGFkanVzdE1hcmtlclkgPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIE5PVCBhbHJlYWR5IGEgbWFya2VyLCB0aGVuIG1ha2Ugb25lIGFuZCBwbGFjZSBpdFxyXG4gICAgaWYgKCFwYXJlbnRDb250YWluZXIuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpKSkge1xyXG4gICAgICB0aGlzLmdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpO1xyXG4gICAgICAvLyBlbHNlIG1vdmUgdGhlIGV4aXN0aW5nIG1hcmtlciB0byB0aGUgbmV3IHBvc2l0aW9uXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpO1xyXG4gICAgfVxyXG4gICAgLy8gc2F2ZSBjb29yZGluYXRlcyB0byBvYmplY3RcclxuICAgIHRoaXMuYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSlcclxuICB9LFxyXG5cclxuICBnZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgZGl2LmlkID0gbWFya2VySWQ7XHJcbiAgICBkaXYuc3R5bGUud2lkdGggPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImxpZ2h0Z3JlZW5cIjtcclxuICAgIGRpdi5zdHlsZS5ib3JkZXIgPSBcIjFweCBzb2xpZCBibGFja1wiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiNTAlXCI7XHJcbiAgICBkaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICBkaXYuc3R5bGUubGVmdCA9ICh4IC0gYWRqdXN0TWFya2VyWCkgKiAxMDAgKyBcIiVcIjtcclxuICAgIGRpdi5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQoZGl2KTtcclxuICB9LFxyXG5cclxuICBtb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKSB7XHJcbiAgICBjb25zdCBjdXJyZW50TWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgfSxcclxuXHJcbiAgYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB1cGRhdGVzIHRoZSBpbnN0YW5jZSBvZiBzaG90T25Hb2FsIGNsYXNzIHRvIHJlY29yZCBjbGljayBjb29yZGluYXRlc1xyXG4gICAgLy8gaWYgYSBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBhcHBlbmQgdGhlIGNvb3JkaW5hdGVzIHRvIHRoZSBvYmplY3QgaW4gcXVlc3Rpb25cclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIC8vIHVzZSBnbG9iYWwgdmFycyBpbnN0ZWFkIG9mIHVwZGF0aW5nIG9iamVjdCBkaXJlY3RseSBoZXJlIHRvIHByZXZlbnQgYWNjaWRlbnRhbCBlZGl0aW5nIG9mIG1hcmtlciB3aXRob3V0IGNsaWNraW5nIFwic2F2ZSBzaG90XCJcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFggPSB4O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgICAvLyBvdGhlcndpc2UsIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgc28gYXBwZW5kIGNvb3JkaW5hdGVzIHRvIHRoZSBuZXcgb2JqZWN0XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAobWFya2VySWQgPT09IFwic2hvdC1tYXJrZXItZmllbGRcIikge1xyXG4gICAgICAgIHNob3RPYmouZmllbGRYID0geDtcclxuICAgICAgICBzaG90T2JqLmZpZWxkWSA9IHk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWCA9IHg7XHJcbiAgICAgICAgc2hvdE9iai5nb2FsWSA9IHk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjYW5jZWxTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICBpZiAoIWVkaXRpbmdTaG90KSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAvLyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQsIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzc1xyXG4gICAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZFxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgaWYgKGZpZWxkTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChnb2FsTWFya2VyICE9PSBudWxsKSB7XHJcbiAgICAgICAgZ29hbEltZ1BhcmVudC5yZW1vdmVDaGlsZChnb2FsTWFya2VyKTtcclxuICAgICAgfVxyXG4gICAgICAvLyByZW1vdmUgY2xpY2sgbGlzdGVuZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgZ29hbEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZ29hbEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgY29uc3QgZmllbGRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWZpZWxkXCIpO1xyXG4gICAgY29uc3QgZ29hbE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZ29hbFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAvLyBjbGVhciBmaWVsZCBhbmQgZ29hbCBldmVudCBsaXN0ZW5lcnNcclxuICAgICAgZmllbGRJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgZ29hbEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICAvLyByZW1vdmUgbWFya2VycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgIGZpZWxkSW1nUGFyZW50LnJlbW92ZUNoaWxkKGZpZWxkTWFya2VyKTtcclxuICAgICAgZ29hbEltZ1BhcmVudC5yZW1vdmVDaGlsZChnb2FsTWFya2VyKTtcclxuICAgICAgLy8gY29uZGl0aW9uYWwgc3RhdGVtZW50IHRvIHNhdmUgY29ycmVjdCBvYmplY3QgKGkuZS4gc2hvdCBiZWluZyBlZGl0ZWQgdnMuIG5ldyBzaG90KVxyXG4gICAgICAvLyBpZiBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBwcmV2aW91c1Nob3RPYmogd2lsbCBub3QgYmUgdW5kZWZpbmVkXHJcbiAgICAgIGlmIChwcmV2aW91c1Nob3RPYmogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2ZpZWxkWCA9IHByZXZpb3VzU2hvdEZpZWxkWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2ZpZWxkWSA9IHByZXZpb3VzU2hvdEZpZWxkWTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxYID0gcHJldmlvdXNTaG90R29hbFg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9nb2FsWSA9IHByZXZpb3VzU2hvdEdvYWxZO1xyXG4gICAgICAgIC8vIGVsc2Ugc2F2ZSB0byBuZXcgaW5zdGFuY2Ugb2YgY2xhc3MgYW5kIGFwcGVuZCBidXR0b24gdG8gcGFnZSB3aXRoIGNvcnJlY3QgSUQgZm9yIGVkaXRpbmdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoc2VsX2FlcmlhbC52YWx1ZSA9PT0gXCJBZXJpYWxcIikgeyBzaG90T2JqLmFlcmlhbCA9IHRydWUgfSBlbHNlIHsgc2hvdE9iai5hZXJpYWwgPSBmYWxzZSB9O1xyXG4gICAgICAgIHNob3RPYmouYmFsbFNwZWVkID0gaW5wdF9iYWxsU3BlZWQudmFsdWU7XHJcbiAgICAgICAgc2hvdEFycmF5LnB1c2goc2hvdE9iaik7XHJcbiAgICAgICAgLy8gYXBwZW5kIG5ldyBidXR0b25cclxuICAgICAgICBzaG90Q291bnRlcisrO1xyXG4gICAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7c2hvdENvdW50ZXJ9YCwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1saW5rXCIgfSwgYFNob3QgJHtzaG90Q291bnRlcn1gKTtcclxuICAgICAgICBzaG90QnRuQ29udGFpbmVyLmFwcGVuZENoaWxkKG5ld1Nob3RCdG4pO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7c2hvdENvdW50ZXJ9YCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnJlbmRlclNhdmVkU2hvdCk7XHJcbiAgICAgIH1cclxuICAgICAgLy9UT0RPOiBhZGQgY29uZGl0aW9uIHRvIHByZXZlbnQgYmxhbmsgZW50cmllcyBhbmQgbWlzc2luZyBjb29yZGluYXRlc1xyXG5cclxuICAgICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gICAgICAvLyBjYW5jZWwgdGhlIG5ldyBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgKG1hdHRlcnMgaWYgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkKVxyXG4gICAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkIChtYXR0ZXJzIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZClcclxuICAgICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyBhbGxvdyB1c2VyIHRvIHNlbGVjdCBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHJlbmRlclNhdmVkU2hvdChlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdGhlIHNob3RBcnJheSB0byBnZXQgYSBzaG90IG9iamVjdCB0aGF0IG1hdGNoZXMgdGhlIHNob3QjIGJ1dHRvbiBjbGlja2VkIChlLmcuIHNob3QgMiBidXR0b24gPSBpbmRleCAxIG9mIHRoZSBzaG90QXJyYXkpXHJcbiAgICAvLyB0aGUgZnVuY3Rpb24gKGFuZCBpdHMgYXNzb2NpYXRlZCBjb25kaXRpb25hbCBzdGF0ZW1lbnRzIGluIG90aGVyIGxvY2FsIGZ1bmN0aW9ucykgaGFzIHRoZXNlIGJhc2ljIHJlcXVpcmVtZW50czpcclxuICAgIC8vIHJlLWluaXRpYWxpemUgY2xpY2sgbGlzdGVuZXJzIG9uIGltYWdlc1xyXG4gICAgLy8gcmV2aXZlIGEgc2F2ZWQgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzIGZvciBlZGl0aW5nIHNob3QgY29vcmRpbmF0ZXMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWxcclxuICAgIC8vIHJlbmRlciBtYXJrZXJzIGZvciBleGlzdGluZyBjb29yZGluYXRlcyBvbiBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICAgIC8vIGFmZm9yZGFuY2UgdG8gc2F2ZSBlZGl0c1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBjYW5jZWwgZWRpdHNcclxuICAgIC8vIHRoZSBkYXRhIGlzIHJlbmRlcmVkIG9uIHRoZSBwYWdlIGFuZCBjYW4gYmUgc2F2ZWQgKG92ZXJ3cml0dGVuKSBieSB1c2luZyB0aGUgXCJzYXZlIHNob3RcIiBidXR0b24gb3IgY2FuY2VsZWQgYnkgY2xpY2tpbmcgdGhlIFwiY2FuY2VsIHNob3RcIiBidXR0b25cclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcblxyXG4gICAgLy8gcHJldmVudCBuZXcgc2hvdCBidXR0b24gZnJvbSBiZWluZyBjbGlja2VkXHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAvLyBhbGxvdyBjYW5jZWwgYW5kIHNhdmVkIGJ1dHRvbnMgdG8gYmUgY2xpY2tlZFxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgLy8gZ2V0IElEIG9mIHNob3QjIGJ0biBjbGlja2VkIGFuZCBhY2Nlc3Mgc2hvdEFycmF5IGF0IFtidG5JRCAtIDFdXHJcbiAgICBsZXQgYnRuSWQgPSBlLnRhcmdldC5pZC5zbGljZSg1KTtcclxuICAgIHByZXZpb3VzU2hvdE9iaiA9IHNob3RBcnJheVtidG5JZCAtIDFdO1xyXG4gICAgLy8gcmVuZGVyIGJhbGwgc3BlZWQgYW5kIGFlcmlhbCBkcm9wZG93biBmb3IgdGhlIHNob3RcclxuICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gcHJldmlvdXNTaG90T2JqLmJhbGxfc3BlZWQ7XHJcbiAgICBpZiAocHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPT09IHRydWUpIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiQWVyaWFsXCI7IH0gZWxzZSB7IHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7IH1cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gZmllbGQgYW5kIGdvYWxcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAvLyByZW5kZXIgc2hvdCBtYXJrZXIgb24gZmllbGRcclxuICAgIGxldCBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIilcclxuICAgIGxldCB4ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB5ID0gKHByZXZpb3VzU2hvdE9iai5fZmllbGRZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG4gICAgLy8gcmVuZGVyIGdvYWwgbWFya2VyIG9uIGZpZWxkXHJcbiAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKVxyXG4gICAgeCA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKTtcclxuICAgIHkgPSBOdW1iZXIoKChwcmV2aW91c1Nob3RPYmouX2dvYWxZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhkaXNhYmxlT3JOb3QpIHtcclxuICAgIC8vIGZvciBlYWNoIGJ1dHRvbiBhZnRlciBcIk5ldyBTaG90XCIsIFwiU2F2ZSBTaG90XCIsIGFuZCBcIkNhbmNlbCBTaG90XCIgZGlzYWJsZSB0aGUgYnV0dG9ucyBpZiB0aGUgdXNlciBpcyBjcmVhdGluZyBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSB0cnVlKSBvciBlbmFibGUgdGhlbSBvbiBzYXZlL2NhbmNlbCBvZiBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSBmYWxzZSlcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIGxldCBlZGl0QnRuO1xyXG4gICAgbGV0IGxlbmd0aCA9IHNob3RCdG5Db250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGg7XHJcbiAgICBmb3IgKGxldCBpID0gMzsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVkaXRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke2kgLSAyfWApO1xyXG4gICAgICBlZGl0QnRuLmRpc2FibGVkID0gZGlzYWJsZU9yTm90O1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBnZXRTaG90T2JqZWN0c0ZvclNhdmluZygpIHtcclxuICAgIC8vIHByb3ZpZGVzIGFycmF5IGZvciB1c2UgaW4gZ2FtZURhdGEuanMgKHdoZW4gc2F2aW5nIGEgbmV3IGdhbWUsIG5vdCB3aGVuIHNhdmluZyBhbiBlZGl0ZWQgZ2FtZSlcclxuICAgIHJldHVybiBzaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbE51bU9mU2hvdHMoKSB7XHJcbiAgICAvLyBwcm92aWRlcyBpbml0aWFsIG51bWJlciBvZiBzaG90cyB0aGF0IHdlcmUgc2F2ZWQgdG8gZGF0YWJhc2UgdG8gZ2FtZURhdGEuanMgdG8gaWRlbnRpZnkgYW4gZWRpdGVkIGdhbWUgaXMgYmVpbmcgc2F2ZWRcclxuICAgIHJldHVybiBpbml0aWFsTGVuZ3RoT2ZTaG90QXJyYXk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2hvdHNCdXR0b25zRnJvbVByZXZpb3VzR2FtZSgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVxdWVzdHMgdGhlIGFycmF5IG9mIHNob3RzIGZyb20gdGhlIHByZXZpb3VzIHNhdmVkIGdhbWUsIHNldHMgaXQgYXMgc2hvdEFycmF5LCBhbmQgcmVuZGVycyBzaG90IGJ1dHRvbnNcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIC8vIGdldCBzYXZlZCBnYW1lIHdpdGggc2hvdHMgZW1iZWRkZWQgYXMgYXJyYXlcclxuICAgIGxldCBzYXZlZEdhbWVPYmogPSBnYW1lRGF0YS5wcm92aWRlU2hvdHNUb1Nob3REYXRhKCk7XHJcbiAgICAvLyBjcmVhdGUgc2hvdEFycmF5IHdpdGggZm9ybWF0IHJlcXVpcmVkIGJ5IGxvY2FsIGZ1bmN0aW9uc1xyXG4gICAgbGV0IHNhdmVkU2hvdE9ialxyXG4gICAgc2F2ZWRHYW1lT2JqLnNob3RzLmZvckVhY2goc2hvdCA9PiB7XHJcbiAgICAgIHNhdmVkU2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsXHJcbiAgICAgIHNhdmVkU2hvdE9iai5maWVsZFggPSBzaG90LmZpZWxkWDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWSA9IHNob3QuZmllbGRZO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFggPSBzaG90LmdvYWxYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZ29hbFkgPSBzaG90LmdvYWxZO1xyXG4gICAgICBzYXZlZFNob3RPYmouYWVyaWFsID0gc2hvdC5hZXJpYWw7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5iYWxsX3NwZWVkID0gc2hvdC5iYWxsX3NwZWVkLnRvU3RyaW5nKCk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai50aW1lU3RhbXAgPSBzaG90LnRpbWVTdGFtcFxyXG4gICAgICBzYXZlZFNob3RPYmouaWQgPSBzaG90LmlkXHJcbiAgICAgIHNob3RBcnJheS5wdXNoKHNhdmVkU2hvdE9iaik7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKHNob3RBcnJheSk7XHJcbiAgICBzaG90QXJyYXkuZm9yRWFjaCgoc2hvdCwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7aWR4ICsgMX1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke2lkeCArIDF9YCk7XHJcbiAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aWR4ICsgMX1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgIH0pO1xyXG4gICAgc2hvdENvdW50ZXIgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gICAgaW5pdGlhbExlbmd0aE9mU2hvdEFycmF5ID0gc2hvdEFycmF5Lmxlbmd0aDtcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90RGF0YSJdfQ==
