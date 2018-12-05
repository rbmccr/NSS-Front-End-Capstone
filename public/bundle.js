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

  saveData(gameData) {
    // this function determines the user's most recent game played (the game just saved),
    // and then saves all shots to the database with the correct gameId
    // calls functions to reload container and reset global shot data variables
    _API.default.postItem("games", gameData).then(game => game.id).then(gameId => {
      // post shots with gameId
      const shotArr = _shotData.default.getShotObjectsForPost();

      console.log(shotArr);
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

        _API.default.postItem("shots", shotForPost).then(post => {
          console.log(post); // call functions that clear gameplay content and reset global shot data variables

          _gameplay.default.loadGameplay();

          _shotData.default.resetGlobalShotVariables();
        });
      });
    });
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
    } // my score


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
    } // time stamp


    let timeStamp = new Date();
    let gameDataObj = {
      "userId": activeUserId,
      "mode": gameMode,
      "type": gameType,
      "team": myTeam,
      "score": myScore,
      "opp_score": theirScore,
      "overtime": overtime,
      "timeStamp": timeStamp
    };
    gameData.saveData(gameDataObj); //FIXME: ((STEP 2)) add intermediary function to determine whether data should be PUT from editing or POSTed from new game saved (consider passing event argument to use e.target)
  },

  savePrevGameEdits() {
    console.log("saving edits..."); // TODO: ((STEP 3)) PUT edits to database
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

    _shotData.default.renderShotsButtonsFromPreviousGame(); // TODO: ((STEP 1)) render game data on page

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

},{"./API":1,"./elementBuilder":2,"./gameplay":4,"./shotData":10}],4:[function(require,module,exports){
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
    const teamOption2 = (0, _elementBuilder.default)("option", {}, "Blue Team");
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

},{"./elementBuilder":2,"./gameData":3,"./shotData":10}],5:[function(require,module,exports){
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

},{"./API":1,"./elementBuilder":2,"./navbar":7}],6:[function(require,module,exports){
"use strict";

var _navbar = _interopRequireDefault(require("./navbar"));

var _gameplay = _interopRequireDefault(require("./gameplay"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// function closeBox(e) {
//   if (e.target.classList.contains("delete")) {
//     e.target.parentNode.style.display = "none";
//   }
// }
// navbar.generateNavbar()
_navbar.default.generateNavbar(true);

_gameplay.default.loadGameplay();

},{"./gameplay":4,"./navbar":7}],7:[function(require,module,exports){
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
  }

};
var _default = navbar;
exports.default = _default;

},{"./elementBuilder":2,"./gameplay":4,"./login":5,"./profile":8,"./shotData":10}],8:[function(require,module,exports){
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

},{"./API":1,"./elementBuilder":2}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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
let previousShotGoalY;
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

  getShotObjectsForPost() {
    // provides array for use in gameData.js (when saving a new game, not when saving an edited game)
    return shotArray;
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
  }

};
var _default = shotData; // TODO: notes on rendering game data and savings edited shots
// --- may need to create another global var in shotData.js that is assigned an integer representing
// the initial number of shots. If a user forgot to add a shot, for instance, and they add a new one in editing mode,
// then that shot needs to be POSTed, not PUT. Need to differentiate the methods
// fetch.PUT the already saved shots => then fetch.POST any new shots

exports.default = _default;

},{"./elementBuilder":2,"./gameData":3,"./shotClass":9}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zY3JpcHRzL0FQSS5qcyIsIi4uL3NjcmlwdHMvZWxlbWVudEJ1aWxkZXIuanMiLCIuLi9zY3JpcHRzL2dhbWVEYXRhLmpzIiwiLi4vc2NyaXB0cy9nYW1lcGxheS5qcyIsIi4uL3NjcmlwdHMvbG9naW4uanMiLCIuLi9zY3JpcHRzL21haW4uanMiLCIuLi9zY3JpcHRzL25hdmJhci5qcyIsIi4uL3NjcmlwdHMvcHJvZmlsZS5qcyIsIi4uL3NjcmlwdHMvc2hvdENsYXNzLmpzIiwiLi4vc2NyaXB0cy9zaG90RGF0YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBLE1BQU0sR0FBRyxHQUFHLHVCQUFaO0FBRUEsTUFBTSxHQUFHLEdBQUc7QUFFVixFQUFBLGFBQWEsQ0FBQyxTQUFELEVBQVksRUFBWixFQUFnQjtBQUMzQixXQUFPLEtBQUssQ0FBRSxHQUFFLEdBQUksSUFBRyxTQUFVLElBQUcsRUFBRyxFQUEzQixDQUFMLENBQW1DLElBQW5DLENBQXdDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBTCxFQUFoRCxDQUFQO0FBQ0QsR0FKUzs7QUFNVixFQUFBLE1BQU0sQ0FBQyxTQUFELEVBQVk7QUFDaEIsV0FBTyxLQUFLLENBQUUsR0FBRSxHQUFJLElBQUcsU0FBVSxFQUFyQixDQUFMLENBQTZCLElBQTdCLENBQWtDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBTCxFQUExQyxDQUFQO0FBQ0QsR0FSUzs7QUFVVixFQUFBLFVBQVUsQ0FBQyxTQUFELEVBQVksRUFBWixFQUFnQjtBQUN4QixXQUFPLEtBQUssQ0FBRSxHQUFFLEdBQUksSUFBRyxTQUFVLElBQUcsRUFBRyxFQUEzQixFQUE4QjtBQUN4QyxNQUFBLE1BQU0sRUFBRTtBQURnQyxLQUE5QixDQUFMLENBR0osSUFISSxDQUdDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBRixFQUhOLEVBSUosSUFKSSxD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QUFiLEdBQXlCLElBQUksQ0FBQyxTQUE5QjtBQUNBLE1BQUEsU0FBUyxDQUFDLElBQVYsQ0FBZSxZQUFmO0FBQ0QsS0FWRDtBQVlBLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxTQUFaO0FBQ0EsSUFBQSxTQUFTLENBQUMsT0FBVixDQUFrQixDQUFDLElBQUQsRUFBTyxHQUFQLEtBQWU7QUFDL0IsWUFBTSxVQUFVLEdBQUcsNkJBQVUsUUFBVixFQUFvQjtBQUFFLGNBQU8sUUFBTyxHQUFHLEdBQUcsQ0FBRSxFQUF4QjtBQUEyQixpQkFBUztBQUFwQyxPQUFwQixFQUE2RSxRQUFPLEdBQUcsR0FBRyxDQUFFLEVBQTVGLENBQW5CO0FBQ0EsTUFBQSxnQkFBZ0IsQ0FBQyxXQUFqQixDQUE2QixVQUE3QjtBQUNBLE1BQUEsUUFBUSxDQUFDLGNBQVQsQ0FBeUIsUUFBTyxHQUFHLEdBQUcsQ0FBRSxFQUF4QyxFQUEyQyxnQkFBM0MsQ0FBNEQsT0FBNUQsRUFBcUUsUUFBUSxDQUFDLGVBQTlFO0FBQ0QsS0FKRDtBQUtBLElBQUEsV0FBVyxHQUFHLFNBQVMsQ0FBQyxNQUF4QjtBQUNEOztBQTlTYyxDQUFqQjtlQWtUZSxRLEVBRWY7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IFVSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo4MDg4XCJcclxuXHJcbmNvbnN0IEFQSSA9IHtcclxuXHJcbiAgZ2V0U2luZ2xlSXRlbShleHRlbnNpb24sIGlkKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZ2V0QWxsKGV4dGVuc2lvbikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCwge1xyXG4gICAgICBtZXRob2Q6IFwiREVMRVRFXCJcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKGUgPT4gZS5qc29uKCkpXHJcbiAgICAgIC50aGVuKCgpID0+IGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCkpXHJcbiAgICAgIC50aGVuKGUgPT4gZS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgcG9zdEl0ZW0oZXh0ZW5zaW9uLCBvYmopIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQVBJIiwiZnVuY3Rpb24gZWxCdWlsZGVyKG5hbWUsIGF0dHJpYnV0ZXNPYmosIHR4dCwgLi4uY2hpbGRyZW4pIHtcclxuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgZm9yIChsZXQgYXR0ciBpbiBhdHRyaWJ1dGVzT2JqKSB7XHJcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ciwgYXR0cmlidXRlc09ialthdHRyXSk7XHJcbiAgfVxyXG4gIGVsLnRleHRDb250ZW50ID0gdHh0IHx8IG51bGw7XHJcbiAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICBlbC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbiAgfSlcclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGVsQnVpbGRlciIsImltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCI7XHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiO1xyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIjtcclxuaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiO1xyXG5cclxuLy8gdGhlIHB1cnBvc2Ugb2YgdGhpcyBtb2R1bGUgaXMgdG86XHJcbi8vIDEuIHNhdmUgYWxsIGNvbnRlbnQgaW4gdGhlIGdhbWVwbGF5IHBhZ2UgKHNob3QgYW5kIGdhbWUgZGF0YSkgdG8gdGhlIGRhdGFiYXNlXHJcbi8vIDIuIGltbWVkaWF0ZWx5IGNsZWFyIHRoZSBnYW1lcGxheSBjb250YWluZXJzIG9mIGNvbnRlbnQgb24gc2F2ZVxyXG4vLyAzLiBpbW1lZGlhdGVseSByZXNldCBhbGwgZ2xvYmFsIHZhcmlhYmxlcyBpbiB0aGUgc2hvdGRhdGEgZmlsZSB0byBhbGxvdyB0aGUgdXNlciB0byBiZWdpbiBzYXZpbmcgc2hvdHMgYW5kIGVudGVyaW5nIGdhbWUgZGF0YSBmb3IgdGhlaXIgbmV4dCBnYW1lXHJcbi8vIDQuIGFmZm9yZGFuY2UgZm9yIHVzZXIgdG8gcmVjYWxsIGFsbCBkYXRhIGZyb20gcHJldmlvdXMgc2F2ZWQgZ2FtZSBmb3IgZWRpdGluZ1xyXG4vLyA1LiBpbmNsdWRlIGFueSBvdGhlciBmdW5jdGlvbnMgbmVlZGVkIHRvIHN1cHBvcnQgdGhlIGZpcnN0IDQgcmVxdWlyZW1lbnRzXHJcblxyXG4vLyB0aGlzIGdsb2JhbCB2YXJpYWJsZSBpcyB1c2VkIHRvIHBhc3Mgc2F2ZWQgc2hvdHMsIGJhbGwgc3BlZWQsIGFuZCBhZXJpYWwgYm9vbGVhbiB0byBzaG90RGF0YS5qcyBkdXJpbmcgdGhlIGVkaXQgcHJvY2Vzc1xyXG5sZXQgc2F2ZWRHYW1lT2JqZWN0O1xyXG5cclxuY29uc3QgZ2FtZURhdGEgPSB7XHJcblxyXG4gIGdhbWVUeXBlQnV0dG9uVG9nZ2xlKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdG9nZ2xlcyB0aGUgXCJpcy1zZWxlY3RlZFwiIGNsYXNzIGJldHdlZW4gdGhlIGdhbWUgdHlwZSBidXR0b25zXHJcblxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGJ0bkNsaWNrZWQgPSBlLnRhcmdldDtcclxuXHJcbiAgICBpZiAoIWJ0bkNsaWNrZWQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgY29uc3QgY3VycmVudEdhbWVUeXBlQnRuID0gZ2FtZVR5cGVCdG5zLmZpbHRlcihidG4gPT4gYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlRGF0YShnYW1lRGF0YSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBkZXRlcm1pbmVzIHRoZSB1c2VyJ3MgbW9zdCByZWNlbnQgZ2FtZSBwbGF5ZWQgKHRoZSBnYW1lIGp1c3Qgc2F2ZWQpLFxyXG4gICAgLy8gYW5kIHRoZW4gc2F2ZXMgYWxsIHNob3RzIHRvIHRoZSBkYXRhYmFzZSB3aXRoIHRoZSBjb3JyZWN0IGdhbWVJZFxyXG4gICAgLy8gY2FsbHMgZnVuY3Rpb25zIHRvIHJlbG9hZCBjb250YWluZXIgYW5kIHJlc2V0IGdsb2JhbCBzaG90IGRhdGEgdmFyaWFibGVzXHJcblxyXG4gICAgQVBJLnBvc3RJdGVtKFwiZ2FtZXNcIiwgZ2FtZURhdGEpXHJcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5pZClcclxuICAgICAgLnRoZW4oZ2FtZUlkID0+IHtcclxuICAgICAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICAgICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yUG9zdCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNob3RBcnIpXHJcbiAgICAgICAgc2hvdEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBnYW1lSWRcclxuICAgICAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWFxyXG4gICAgICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZXHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYXHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZXHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZClcclxuICAgICAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbFxyXG4gICAgICAgICAgc2hvdEZvclBvc3QudGltZVN0YW1wID0gc2hvdE9iai5fdGltZVN0YW1wXHJcbiAgICAgICAgICBBUEkucG9zdEl0ZW0oXCJzaG90c1wiLCBzaG90Rm9yUG9zdCkudGhlbihwb3N0ID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocG9zdCk7XHJcbiAgICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb25zIHRoYXQgY2xlYXIgZ2FtZXBsYXkgY29udGVudCBhbmQgcmVzZXQgZ2xvYmFsIHNob3QgZGF0YSB2YXJpYWJsZXNcclxuICAgICAgICAgICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICAgICAgICAgIHNob3REYXRhLnJlc2V0R2xvYmFsU2hvdFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgICB9KTtcclxuICB9LFxyXG5cclxuICBwYWNrYWdlR2FtZURhdGEoKSB7XHJcblxyXG4gICAgLy8gZ2V0IHVzZXIgSUQgZnJvbSBzZXNzaW9uIHN0b3JhZ2VcclxuICAgIC8vIHBhY2thZ2UgZWFjaCBpbnB1dCBmcm9tIGdhbWUgZGF0YSBjb250YWluZXIgaW50byB2YXJpYWJsZXNcclxuICAgIC8vIFRPRE86IGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBwcmV2ZW50IGJsYW5rIHNjb3JlIGVudHJpZXNcclxuICAgIC8vIFRPRE86IGNyZWF0ZSBhIG1vZGFsIGFza2luZyB1c2VyIGlmIHRoZXkgd2FudCB0byBzYXZlIGdhbWVcclxuXHJcbiAgICAvLyBwbGF5ZXJJZFxyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gTnVtYmVyKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIikpO1xyXG5cclxuICAgIC8vIGdhbWUgdHlwZSAoMXYxLCAydjIsIDN2MylcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuICAgIGxldCBnYW1lVHlwZSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBnYW1lVHlwZUJ0bnMuZm9yRWFjaChidG4gPT4ge1xyXG4gICAgICBpZiAoYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKSB7XHJcbiAgICAgICAgZ2FtZVR5cGUgPSBidG4udGV4dENvbnRlbnRcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvLyBnYW1lIG1vZGUgKG5vdGU6IGRpZCBub3QgdXNlIGJvb2xlYW4gaW4gY2FzZSBtb3JlIGdhbWUgbW9kZXMgYXJlIHN1cHBvcnRlZCBpbiB0aGUgZnV0dXJlKVxyXG4gICAgY29uc3Qgc2VsX2dhbWVNb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lTW9kZUlucHV0XCIpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxfZ2FtZU1vZGUudmFsdWUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAvLyBteSB0ZWFtIChub3RlOiBkaWQgbm90IHVzZSBib29sZWFuIGluIHByZXBhcmF0aW9uIGZvciB1c2VycyB0byBlbnRlciB0aGUgY2x1YiBpbmZvcm1hdGlvbilcclxuICAgIGNvbnN0IHNlbF90ZWFtQ29sb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlYW1JbnB1dFwiKTtcclxuICAgIGxldCBteVRlYW07XHJcbiAgICBpZiAoc2VsX3RlYW1Db2xvci52YWx1ZSA9PT0gXCJPcmFuZ2UgdGVhbVwiKSB7XHJcbiAgICAgIG15VGVhbSA9IFwib3JhbmdlXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBteVRlYW0gPSBcImJsdWVcIjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBteSBzY29yZVxyXG4gICAgbGV0IG15U2NvcmU7XHJcbiAgICBsZXQgdGhlaXJTY29yZTtcclxuICAgIGNvbnN0IGlucHRfb3JhbmdlU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm9yYW5nZVNjb3JlSW5wdXRcIik7XHJcbiAgICBjb25zdCBpbnB0X2JsdWVTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmx1ZVNjb3JlSW5wdXRcIik7XHJcblxyXG4gICAgaWYgKG15VGVhbSA9PT0gXCJvcmFuZ2VcIikge1xyXG4gICAgICBteVNjb3JlID0gTnVtYmVyKGlucHRfb3JhbmdlU2NvcmUudmFsdWUpO1xyXG4gICAgICB0aGVpclNjb3JlID0gTnVtYmVyKGlucHRfYmx1ZVNjb3JlLnZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG15U2NvcmUgPSBOdW1iZXIoaW5wdF9ibHVlU2NvcmUudmFsdWUpO1xyXG4gICAgICB0aGVpclNjb3JlID0gTnVtYmVyKGlucHRfb3JhbmdlU2NvcmUudmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG92ZXJ0aW1lXHJcbiAgICBsZXQgb3ZlcnRpbWU7XHJcbiAgICBjb25zdCBzZWxfb3ZlcnRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm92ZXJ0aW1lSW5wdXRcIik7XHJcbiAgICBpZiAoc2VsX292ZXJ0aW1lLnZhbHVlID09PSBcIk92ZXJ0aW1lXCIpIHtcclxuICAgICAgb3ZlcnRpbWUgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3ZlcnRpbWUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aW1lIHN0YW1wXHJcbiAgICBsZXQgdGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICBsZXQgZ2FtZURhdGFPYmogPSB7XHJcbiAgICAgIFwidXNlcklkXCI6IGFjdGl2ZVVzZXJJZCxcclxuICAgICAgXCJtb2RlXCI6IGdhbWVNb2RlLFxyXG4gICAgICBcInR5cGVcIjogZ2FtZVR5cGUsXHJcbiAgICAgIFwidGVhbVwiOiBteVRlYW0sXHJcbiAgICAgIFwic2NvcmVcIjogbXlTY29yZSxcclxuICAgICAgXCJvcHBfc2NvcmVcIjogdGhlaXJTY29yZSxcclxuICAgICAgXCJvdmVydGltZVwiOiBvdmVydGltZSxcclxuICAgICAgXCJ0aW1lU3RhbXBcIjogdGltZVN0YW1wXHJcbiAgICB9O1xyXG5cclxuICAgIGdhbWVEYXRhLnNhdmVEYXRhKGdhbWVEYXRhT2JqKTtcclxuICAgIC8vRklYTUU6ICgoU1RFUCAyKSkgYWRkIGludGVybWVkaWFyeSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgd2hldGhlciBkYXRhIHNob3VsZCBiZSBQVVQgZnJvbSBlZGl0aW5nIG9yIFBPU1RlZCBmcm9tIG5ldyBnYW1lIHNhdmVkIChjb25zaWRlciBwYXNzaW5nIGV2ZW50IGFyZ3VtZW50IHRvIHVzZSBlLnRhcmdldClcclxuXHJcbiAgfSxcclxuXHJcbiAgc2F2ZVByZXZHYW1lRWRpdHMoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInNhdmluZyBlZGl0cy4uLlwiKVxyXG4gICAgLy8gVE9ETzogKChTVEVQIDMpKSBQVVQgZWRpdHMgdG8gZGF0YWJhc2VcclxuICB9LFxyXG5cclxuICBjYW5jZWxFZGl0aW5nTW9kZSgpIHtcclxuICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyRWRpdEJ1dHRvbnMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHJlbW92ZXMgJiByZXBsYWNlcyBlZGl0IGFuZCBzYXZlIGdhbWUgYnV0dG9ucyB3aXRoIFwiU2F2ZSBFZGl0c1wiIGFuZCBcIkNhbmNlbCBFZGl0c1wiXHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgLy8gaW4gY2FzZSBvZiBsYWcgaW4gZmV0Y2gsIHByZXZlbnQgdXNlciBmcm9tIGRvdWJsZSBjbGlja2luZyBidXR0b25cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5jbGFzc0xpc3QuYWRkKFwiaXMtbG9hZGluZ1wiKTtcclxuXHJcbiAgICBjb25zdCBidG5fY2FuY2VsRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBFZGl0c1wiKVxyXG4gICAgY29uc3QgYnRuX3NhdmVFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEVkaXRzXCIpXHJcblxyXG4gICAgYnRuX2NhbmNlbEVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5jYW5jZWxFZGl0aW5nTW9kZSlcclxuICAgIGJ0bl9zYXZlRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnNhdmVQcmV2R2FtZUVkaXRzKVxyXG5cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUucmVwbGFjZVdpdGgoYnRuX2NhbmNlbEVkaXRzKTtcclxuICAgIGJ0bl9zYXZlR2FtZS5yZXBsYWNlV2l0aChidG5fc2F2ZUVkaXRzKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyUHJldkdhbWUoZ2FtZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgcmVuZGVyaW5nIHRoZSBzYXZlZCBnYW1lIGluZm9ybWF0aW9uIGluIHRoZSBcIkVudGVyIEdhbWUgRGF0YVwiIGNvbnRhaW5lci5cclxuICAgIC8vIGl0IHJlbGllcyBvbiBhIGZ1bmN0aW9uIGluIHNob3REYXRhLmpzIHRvIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBjb25zb2xlLmxvZyhnYW1lKVxyXG4gICAgLy8gY2FsbCBmdW5jdGlvbiBpbiBzaG90RGF0YSB0aGF0IGNhbGxzIGdhbWFEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIHdpbGwgY2FwdHVyZSB0aGUgYXJyYXkgb2Ygc2F2ZWQgc2hvdHMgYW5kIHJlbmRlciB0aGUgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5yZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKClcclxuICAgIC8vIFRPRE86ICgoU1RFUCAxKSkgcmVuZGVyIGdhbWUgZGF0YSBvbiBwYWdlXHJcblxyXG4gIH0sXHJcblxyXG4gIHByb3ZpZGVTaG90c1RvU2hvdERhdGEoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHByb3ZpZGVzIHRoZSBzaG90cyBmb3IgcmVuZGVyaW5nIHRvIHNob3REYXRhXHJcbiAgICByZXR1cm4gc2F2ZWRHYW1lT2JqZWN0XHJcbiAgfSxcclxuXHJcbiAgZWRpdFByZXZHYW1lKCkge1xyXG4gICAgLy8gZmV0Y2ggY29udGVudCBmcm9tIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQgdG8gYmUgcmVuZGVyZWRcclxuXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gZWRpdCBwcmV2aW91cyBnYW1lXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYCR7YWN0aXZlVXNlcklkfT9fZW1iZWQ9Z2FtZXNgKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBpZiAodXNlci5nYW1lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBhbGVydChcIk5vIGdhbWVzIGhhdmUgYmVlbiBzYXZlZCBieSB0aGlzIHVzZXJcIik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IG1heCBnYW1lIGlkICh3aGljaCBpcyB0aGUgbW9zdCByZWNlbnQgZ2FtZSBzYXZlZClcclxuICAgICAgICBjb25zdCByZWNlbnRHYW1lSWQgPSB1c2VyLmdhbWVzLnJlZHVjZSgobWF4LCBvYmopID0+IG9iai5pZCA+IG1heCA/IG9iai5pZCA6IG1heCwgdXNlci5nYW1lc1swXS5pZCk7XHJcbiAgICAgICAgLy8gZmV0Y2ggbW9zdCByZWNlbnQgZ2FtZSBhbmQgZW1iZWQgc2hvdHNcclxuICAgICAgICBBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGAke3JlY2VudEdhbWVJZH0/X2VtYmVkPXNob3RzYCkudGhlbihnYW1lT2JqID0+IHtcclxuICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICAgICAgICBnYW1lRGF0YS5yZW5kZXJFZGl0QnV0dG9ucygpO1xyXG4gICAgICAgICAgc2F2ZWRHYW1lT2JqZWN0ID0gZ2FtZU9iajtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlclByZXZHYW1lKGdhbWVPYmopO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZURhdGEiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuaW1wb3J0IGdhbWVEYXRhIGZyb20gXCIuL2dhbWVEYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBnYW1lcGxheSA9IHtcclxuXHJcbiAgbG9hZEdhbWVwbGF5KCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgLy8gY29uc3QgeEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJkZWxldGVcIiB9KTtcclxuICAgIC8vIHhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQm94LCBldmVudCk7IC8vIGJ1dHRvbiB3aWxsIGRpc3BsYXk6IG5vbmUgb24gcGFyZW50IGNvbnRhaW5lclxyXG4gICAgLy8gY29uc3QgaGVhZGVySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb24gaXMtaW5mb1wiIH0sIFwiQ3JlYXRlIGFuZCBzYXZlIHNob3RzIC0gdGhlbiBzYXZlIHRoZSBnYW1lIHJlY29yZC5cIiwgeEJ1dHRvbik7XHJcbiAgICAvLyB3ZWJwYWdlLmFwcGVuZENoaWxkKGhlYWRlckluZm8pO1xyXG4gICAgdGhpcy5idWlsZFNob3RDb250ZW50KCk7XHJcbiAgICB0aGlzLmJ1aWxkR2FtZUNvbnRlbnQoKTtcclxuICAgIHRoaXMuZ2FtZXBsYXlFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBidWlsZFNob3RDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgc2hvdCBjb250YWluZXJzIGFuZCBhZGRzIGNvbnRhaW5lciBjb250ZW50XHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBzaG90VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBTaG90IERhdGFcIik7XHJcbiAgICBjb25zdCBzaG90VGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90VGl0bGUpO1xyXG5cclxuICAgIC8vIG5ldyBzaG90IGFuZCBzYXZlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3QgbmV3U2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJuZXdTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiTmV3IFNob3RcIik7XHJcbiAgICBjb25zdCBzYXZlU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgU2hvdFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbFNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIFNob3RcIik7XHJcbiAgICBjb25zdCBzaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJzaG90Q29udHJvbHNcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gYnV0dG9uc1wiIH0sIG51bGwsIG5ld1Nob3QsIHNhdmVTaG90LCBjYW5jZWxTaG90KTtcclxuICAgIGNvbnN0IGFsaWduU2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIHNob3RCdXR0b25zKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnblNob3RCdXR0b25zKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGlucHV0IGFuZCBhZXJpYWwgc2VsZWN0XHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJhbGwgc3BlZWQgKGtwaCk6XCIpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZElucHV0XCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGlucHV0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBiYWxsIHNwZWVkXCIgfSk7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiYWVyaWFsSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbE9wdGlvbjEsIGFlcmlhbE9wdGlvbjIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdCk7XHJcbiAgICBjb25zdCBhZXJpYWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdFBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgYmFsbFNwZWVkSW5wdXRUaXRsZSwgYmFsbFNwZWVkSW5wdXQsIGFlcmlhbENvbnRyb2wpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90RGV0YWlscyk7XHJcblxyXG4gICAgLy8gZmllbGQgYW5kIGdvYWwgaW1hZ2VzIChub3RlIGZpZWxkLWltZyBpcyBjbGlwcGVkIHRvIHJlc3RyaWN0IGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgaW4gbGF0ZXIgZnVuY3Rpb24uXHJcbiAgICAvLyBnb2FsLWltZyB1c2VzIGFuIHgveSBmb3JtdWxhIGZvciBjbGljayBhcmVhIGNvb3JkaW5hdGVzIHJlc3RyaWN0aW9uLCBzaW5jZSBpdCdzIGEgcmVjdGFuZ2xlKVxyXG4gICAgLy8gYWRkaXRpb25hbGx5LCBmaWVsZCBhbmQgZ29hbCBhcmUgbm90IGFsaWduZWQgd2l0aCBsZXZlbC1sZWZ0IG9yIGxldmVsLXJpZ2h0IC0gaXQncyBhIGRpcmVjdCBsZXZlbCAtLT4gbGV2ZWwtaXRlbSBmb3IgY2VudGVyaW5nXHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IHNob3RDb29yZGluYXRlc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBzaG90VGl0bGVDb250YWluZXIsIHNob3RCdXR0b25Db250YWluZXIsIHNob3REZXRhaWxzQ29udGFpbmVyLCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIpXHJcblxyXG4gICAgLy8gYXBwZW5kIHNob3RzIGNvbnRhaW5lciB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2FtZUNvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGNyZWF0ZXMgZ2FtZSBjb250ZW50IGNvbnRhaW5lcnMgKHRlYW0sIGdhbWUgdHlwZSwgZ2FtZSBtb2RlLCBldGMuKVxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3QgZ2FtZVRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgR2FtZSBEYXRhXCIpO1xyXG4gICAgY29uc3QgdGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVGl0bGUpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gdG9wIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIDF2MS8ydjIvM3YzIGJ1dHRvbnMgKG5vdGU6IGNvbnRyb2wgY2xhc3MgaXMgdXNlZCB3aXRoIGZpZWxkIHRvIGFkaGVyZSBidXR0b25zIHRvZ2V0aGVyKVxyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTN2M0NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlM3YzKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zZWxlY3RlZCBpcy1saW5rXCIgfSwgXCIydjJcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTJ2MkNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMnYyKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8xdjFcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjFDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTF2MSk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImZpZWxkIGhhcy1hZGRvbnNcIiB9LCBudWxsLCBnYW1lVHlwZTN2M0NvbnRyb2wsIGdhbWVUeXBlMnYyQ29udHJvbCwgZ2FtZVR5cGUxdjFDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkZpZWxkKTtcclxuXHJcbiAgICAvLyBnYW1lIG1vZGUgc2VsZWN0XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDb21wZXRpdGl2ZVwiKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiZ2FtZU1vZGVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZU9wdGlvbjEsIG1vZGVPcHRpb24yKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgbW9kZVNlbGVjdCk7XHJcbiAgICBjb25zdCBtb2RlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBtb2RlU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyB0ZWFtIHNlbGVjdFxyXG4gICAgY29uc3QgdGVhbU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3JhbmdlIHRlYW1cIik7XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJCbHVlIFRlYW1cIik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcInRlYW1JbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbU9wdGlvbjEsIHRlYW1PcHRpb24yKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgdGVhbVNlbGVjdCk7XHJcbiAgICBjb25zdCB0ZWFtQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCB0ZWFtU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyBvdmVydGltZSBzZWxlY3RcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJObyBvdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPdmVydGltZVwiKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcIm92ZXJ0aW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lT3B0aW9uMSwgb3ZlcnRpbWVPcHRpb24yKTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0KTtcclxuICAgIGNvbnN0IG92ZXJ0aW1lQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSBib3R0b20gY29udGFpbmVyXHJcblxyXG4gICAgLy8gc2NvcmUgaW5wdXRzXHJcbiAgICAvLyAqKioqTm90ZSBpbmxpbmUgc3R5bGluZyBvZiBpbnB1dCB3aWR0aHNcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJPcmFuZ2UgdGVhbSBzY29yZTpcIik7XHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwib3JhbmdlU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBvcmFuZ2UgdGVhbSBzY29yZVwiIH0pO1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gY29udHJvbFwiIH0sIG51bGwsIG9yYW5nZVNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3QgYmx1ZVNjb3JlSW5wdXRUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgXCJCbHVlIHRlYW0gc2NvcmU6XCIpXHJcbiAgICBjb25zdCBibHVlU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJsdWVTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIGJsdWUgdGVhbSBzY29yZVwiIH0pO1xyXG4gICAgY29uc3QgYmx1ZVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCBibHVlU2NvcmVJbnB1dCk7XHJcbiAgICBjb25zdCBzY29yZUlucHV0Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBvcmFuZ2VTY29yZUlucHV0VGl0bGUsIG9yYW5nZVNjb3JlQ29udHJvbCwgYmx1ZVNjb3JlSW5wdXRUaXRsZSwgYmx1ZVNjb3JlQ29udHJvbCk7XHJcblxyXG4gICAgLy8gZWRpdC9zYXZlIGdhbWUgYnV0dG9uc1xyXG4gICAgY29uc3QgZWRpdFByZXZpb3VzR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJlZGl0UHJldkdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkVkaXQgUHJldmlvdXMgR2FtZVwiKTtcclxuICAgIGNvbnN0IHNhdmVHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBHYW1lXCIpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkFsaWdubWVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zIGxldmVsLWl0ZW1cIiB9LCBudWxsLCBzYXZlR2FtZSwgZWRpdFByZXZpb3VzR2FtZSk7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLXJpZ2h0XCIgfSwgbnVsbCwgZ2FtZUJ1dHRvbkFsaWdubWVudCk7XHJcblxyXG4gICAgLy8gYXBwZW5kIHRvIHdlYnBhZ2VcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJUb3AgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciwgbW9kZUNvbnRyb2wsIHRlYW1Db250cm9sLCBvdmVydGltZUNvbnRyb2wpO1xyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lckJvdHRvbSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNjb3JlSW5wdXRDb250YWluZXIsIGdhbWVCdXR0b25Db250YWluZXIpO1xyXG4gICAgY29uc3QgcGFyZW50R2FtZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250YWluZXIgYm94XCIgfSwgbnVsbCwgdGl0bGVDb250YWluZXIsIGdhbWVDb250YWluZXJUb3AsIGdhbWVDb250YWluZXJCb3R0b20pO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChwYXJlbnRHYW1lQ29udGFpbmVyKTtcclxuICB9LFxyXG5cclxuICBnYW1lcGxheUV2ZW50TWFuYWdlcigpIHtcclxuXHJcbiAgICAvLyBidXR0b25zXHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlU2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZVNob3RcIik7XHJcbiAgICBjb25zdCBidG5fY2FuY2VsU2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FuY2VsU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9lZGl0UHJldkdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRQcmV2R2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl9zYXZlR2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2F2ZUdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcblxyXG4gICAgLy8gYWRkIGxpc3RlbmVyc1xyXG4gICAgYnRuX25ld1Nob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmNyZWF0ZU5ld1Nob3QpO1xyXG4gICAgYnRuX3NhdmVTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5zYXZlU2hvdCk7XHJcbiAgICBidG5fY2FuY2VsU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY2FuY2VsU2hvdCk7XHJcbiAgICBidG5fc2F2ZUdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnBhY2thZ2VHYW1lRGF0YSk7XHJcbiAgICBnYW1lVHlwZUJ0bnMuZm9yRWFjaChidG4gPT4gYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5nYW1lVHlwZUJ1dHRvblRvZ2dsZSkpO1xyXG4gICAgYnRuX2VkaXRQcmV2R2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZWRpdFByZXZHYW1lKVxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lcGxheSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiXHJcbmltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcbmNvbnN0IHdlYnBhZ2VOYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdi1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBsb2dpbk9yU2lnbnVwID0ge1xyXG5cclxuICAvLyBidWlsZCBhIGxvZ2luIGZvcm0gdGhhdCB2YWxpZGF0ZXMgdXNlciBpbnB1dC4gU3VjY2Vzc2Z1bCBsb2dpbiBzdG9yZXMgdXNlciBpZCBpbiBzZXNzaW9uIHN0b3JhZ2VcclxuICBsb2dpbkZvcm0oKSB7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luSW5wdXRfcGFzc3dvcmQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwYXNzd29yZElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJwYXNzd29yZFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IGxvZ2luQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImxvZ2luTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW4gbm93XCIpO1xyXG4gICAgY29uc3QgbG9naW5Gb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJsb2dpbkZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIGxvZ2luSW5wdXRfdXNlcm5hbWUsIGxvZ2luSW5wdXRfcGFzc3dvcmQsIGxvZ2luQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKGxvZ2luRm9ybSlcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpXHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwRm9ybSgpIHtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X25hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIG5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3VzZXJuYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwidXNlcm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgdXNlcm5hbWVcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cElucHV0X2NvbmZpcm0gPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJjb25maXJtUGFzc3dvcmRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImNvbmZpcm0gcGFzc3dvcmRcIiB9KTtcclxuICAgIGNvbnN0IHNpZ251cEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzaWdudXBOb3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwIG5vd1wiKTtcclxuICAgIGNvbnN0IHNpZ251cEZvcm0gPSBlbEJ1aWxkZXIoXCJmb3JtXCIsIHsgXCJpZFwiOiBcInNpZ251cEZvcm1cIiwgXCJjbGFzc1wiOiBcImJveFwiIH0sIG51bGwsIHNpZ251cElucHV0X25hbWUsIHNpZ251cElucHV0X3VzZXJuYW1lLCBzaWdudXBJbnB1dF9wYXNzd29yZCwgc2lnbnVwSW5wdXRfY29uZmlybSwgc2lnbnVwQnV0dG9uKTtcclxuXHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHNpZ251cEZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIC8vIGFzc2lnbiBldmVudCBsaXN0ZW5lcnMgYmFzZWQgb24gd2hpY2ggZm9ybSBpcyBvbiB0aGUgd2VicGFnZVxyXG4gIHVzZXJFdmVudE1hbmFnZXIoKSB7XHJcbiAgICBjb25zdCBsb2dpbk5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9naW5Ob3dcIilcclxuICAgIGNvbnN0IHNpZ251cE5vdyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2lnbnVwTm93XCIpXHJcbiAgICBpZiAobG9naW5Ob3cgPT09IG51bGwpIHtcclxuICAgICAgc2lnbnVwTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cFVzZXIsIGV2ZW50KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbG9naW5Ob3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9naW5Vc2VyLCBldmVudClcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyB2YWxpZGF0ZSB1c2VyIGxvZ2luIGZvcm0gaW5wdXRzIGJlZm9yZSBsb2dnaW5nIGluXHJcbiAgbG9naW5Vc2VyKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGNvbnN0IHVzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBwYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFzc3dvcmRJbnB1dFwiKS52YWx1ZVxyXG4gICAgaWYgKHVzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChwYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5nZXRBbGwoXCJ1c2Vyc1wiKS50aGVuKHVzZXJzID0+IHVzZXJzLmZvckVhY2godXNlciA9PiB7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgdXNlcm5hbWUgYW5kIHBhc3N3b3JkXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgaWYgKHVzZXIucGFzc3dvcmQgPT09IHBhc3N3b3JkKSB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgY29uc3QgX25hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3VzZXJuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ1c2VybmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IGNvbmZpcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbmZpcm1QYXNzd29yZFwiKS52YWx1ZVxyXG4gICAgbGV0IHVuaXF1ZVVzZXJuYW1lID0gdHJ1ZTsgLy9jaGFuZ2VzIHRvIGZhbHNlIGlmIHVzZXJuYW1lIGFscmVhZHkgZXhpc3RzXHJcbiAgICBpZiAoX25hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF91c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChjb25maXJtID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgIT09IGNvbmZpcm0pIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKCh1c2VyLCBpZHgpID0+IHtcclxuICAgICAgICAvLyBjaGVjayBmb3IgZXhpc3RpbmcgdXNlcm5hbWUgaW4gZGF0YWJhc2VcclxuICAgICAgICBpZiAodXNlci51c2VybmFtZS50b0xvd2VyQ2FzZSgpID09PSBfdXNlcm5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgdW5pcXVlVXNlcm5hbWUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9hdCB0aGUgZW5kIG9mIHRoZSBsb29wLCBwb3N0XHJcbiAgICAgICAgaWYgKGlkeCA9PT0gdXNlcnMubGVuZ3RoIC0gMSAmJiB1bmlxdWVVc2VybmFtZSkge1xyXG4gICAgICAgICAgbGV0IG5ld1VzZXIgPSB7XHJcbiAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogX3VzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogX3Bhc3N3b3JkLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIEFQSS5wb3N0SXRlbShcInVzZXJzXCIsIG5ld1VzZXIpLnRoZW4odXNlciA9PiB7XHJcbiAgICAgICAgICAgIGxvZ2luT3JTaWdudXAubG9naW5TdGF0dXNBY3RpdmUodXNlcilcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsb2dpblN0YXR1c0FjdGl2ZSh1c2VyKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIsIHVzZXIuaWQpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpOyAvL2J1aWxkIGxvZ2dlZCBpbiB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH0sXHJcblxyXG4gIGxvZ291dFVzZXIoKSB7XHJcbiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZU5hdi5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgbmF2YmFyLmdlbmVyYXRlTmF2YmFyKGZhbHNlKTsgLy9idWlsZCBsb2dnZWQgb3V0IHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbG9naW5PclNpZ251cCIsImltcG9ydCBuYXZiYXIgZnJvbSBcIi4vbmF2YmFyXCJcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuXHJcbi8vIGZ1bmN0aW9uIGNsb3NlQm94KGUpIHtcclxuLy8gICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiZGVsZXRlXCIpKSB7XHJcbi8vICAgICBlLnRhcmdldC5wYXJlbnROb2RlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuLy8gICB9XHJcbi8vIH1cclxuXHJcbi8vIG5hdmJhci5nZW5lcmF0ZU5hdmJhcigpXHJcbm5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKVxyXG5nYW1lcGxheS5sb2FkR2FtZXBsYXkoKSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgbG9naW5PclNpZ251cCBmcm9tIFwiLi9sb2dpblwiXHJcbmltcG9ydCBwcm9maWxlIGZyb20gXCIuL3Byb2ZpbGVcIlxyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIlxyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIlxyXG5cclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbi8qXHJcbiAgQnVsbWEgbmF2YmFyIHN0cnVjdHVyZTpcclxuICA8bmF2PlxyXG4gICAgPG5hdmJhci1icmFuZD5cclxuICAgICAgPG5hdmJhci1idXJnZXI+IChvcHRpb25hbClcclxuICAgIDwvbmF2YmFyLWJyYW5kPlxyXG4gICAgPG5hdmJhci1tZW51PlxyXG4gICAgICA8bmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8L25hdmJhci1zdGFydD5cclxuICAgICAgPG5hdmJhci1lbmQ+XHJcbiAgICAgIDwvbmF2YmFyLWVuZD5cclxuICAgIDwvbmF2YmFyLW1lbnU+XHJcbiAgPC9uYXY+XHJcblxyXG4gIFRoZSBmdW5jdGlvbnMgYmVsb3cgYnVpbGQgdGhlIG5hdmJhciBmcm9tIHRoZSBpbnNpZGUgb3V0XHJcbiovXHJcblxyXG5jb25zdCBuYXZiYXIgPSB7XHJcblxyXG4gIGdlbmVyYXRlTmF2YmFyKGxvZ2dlZEluQm9vbGVhbikge1xyXG5cclxuICAgIC8vIG5hdmJhci1tZW51IChyaWdodCBzaWRlIG9mIG5hdmJhciAtIGFwcGVhcnMgb24gZGVza3RvcCAxMDI0cHgrKVxyXG4gICAgY29uc3QgYnV0dG9uMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luXCIpXHJcbiAgICBjb25zdCBidXR0b24xID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cFwiKVxyXG4gICAgY29uc3QgYnV0dG9uQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnNcIiB9LCBudWxsLCBidXR0b24xLCBidXR0b24yKVxyXG4gICAgY29uc3QgbWVudUl0ZW0xID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgbnVsbCwgYnV0dG9uQ29udGFpbmVyKVxyXG4gICAgY29uc3QgbmF2YmFyRW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1lbmRcIiB9LCBudWxsLCBtZW51SXRlbTEpXHJcbiAgICBjb25zdCBuYXZiYXJTdGFydCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItc3RhcnRcIiB9KVxyXG4gICAgY29uc3QgbmF2YmFyTWVudSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJuYXZiYXJNZW51XCIsIFwiY2xhc3NcIjogXCJuYXZiYXItbWVudVwiIH0sIG51bGwsIG5hdmJhclN0YXJ0LCBuYXZiYXJFbmQpXHJcblxyXG4gICAgLy8gbmF2YmFyLWJyYW5kIChsZWZ0IHNpZGUgb2YgbmF2YmFyIC0gaW5jbHVkZXMgbW9iaWxlIGhhbWJ1cmdlciBtZW51KVxyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4xID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjIgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMyA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJyb2xlXCI6IFwiYnV0dG9uXCIsIFwiY2xhc3NcIjogXCJuYXZiYXItYnVyZ2VyIGJ1cmdlclwiLCBcImFyaWEtbGFiZWxcIjogXCJtZW51XCIsIFwiYXJpYS1leHBhbmRlZFwiOiBcImZhbHNlXCIsIFwiZGF0YS10YXJnZXRcIjogXCJuYXZiYXJNZW51XCIgfSwgbnVsbCwgYnVyZ2VyTWVudVNwYW4xLCBidXJnZXJNZW51U3BhbjIsIGJ1cmdlck1lbnVTcGFuMyk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiwgXCJocmVmXCI6IFwiI1wiIH0sIG51bGwsIGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL2ZpcmU5MGRlZy5wbmdcIiwgXCJ3aWR0aFwiOiBcIjExMlwiLCBcImhlaWdodFwiOiBcIjI4XCIgfSkpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWJyYW5kXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmRDaGlsZDEsIG5hdmJhckJyYW5kQ2hpbGQyKTtcclxuXHJcbiAgICAvLyBuYXYgKHBhcmVudCBuYXYgSFRNTCBlbGVtZW50KVxyXG4gICAgY29uc3QgbmF2ID0gZWxCdWlsZGVyKFwibmF2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhclwiLCBcInJvbGVcIjogXCJuYXZpZ2F0aW9uXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1haW4gbmF2aWdhdGlvblwiIH0sIG51bGwsIG5hdmJhckJyYW5kLCBuYXZiYXJNZW51KTtcclxuXHJcbiAgICAvLyBpZiBsb2dnZWQgaW4sIGFwcGVuZCBhZGRpdGlvbmFsIG1lbnUgb3B0aW9ucyB0byBuYXZiYXIgYW5kIHJlbW92ZSBzaWdudXAvbG9naW4gYnV0dG9uc1xyXG4gICAgaWYgKGxvZ2dlZEluQm9vbGVhbikge1xyXG4gICAgICAvLyByZW1vdmUgbG9nIGluIGFuZCBzaWduIHVwIGJ1dHRvbnNcclxuICAgICAgY29uc3Qgc2lnbnVwID0gYnV0dG9uQ29udGFpbmVyLmNoaWxkTm9kZXNbMF07XHJcbiAgICAgIGNvbnN0IGxvZ2luID0gYnV0dG9uQ29udGFpbmVyLmNoaWxkTm9kZXNbMV07XHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChzaWdudXApO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQobG9naW4pO1xyXG4gICAgICAvLyBhZGQgbG9nb3V0IGJ1dHRvblxyXG4gICAgICBjb25zdCBidXR0b24zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9nb3V0XCIpO1xyXG4gICAgICBidXR0b25Db250YWluZXIuYXBwZW5kQ2hpbGQoYnV0dG9uMyk7XHJcblxyXG4gICAgICAvLyBjcmVhdGUgYW5kIGFwcGVuZCBuZXcgbWVudSBpdGVtcyBmb3IgdXNlclxyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0xID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiUHJvZmlsZVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkdhbWVwbGF5XCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiSGVhdG1hcHNcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTQgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJMZWFkZXJib2FyZFwiKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMSk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTIpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0zKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtNCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBuYXZiYXJcclxuICAgIHRoaXMubmF2YmFyRXZlbnRNYW5hZ2VyKG5hdik7XHJcblxyXG4gICAgLy8gYXBwZW5kIHRvIHdlYnBhZ2VcclxuICAgIHdlYnBhZ2VOYXYuYXBwZW5kQ2hpbGQobmF2KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgbmF2YmFyRXZlbnRNYW5hZ2VyKG5hdikge1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luQ2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cENsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dvdXRDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMucHJvZmlsZUNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5nYW1lcGxheUNsaWNrZWQsIGV2ZW50KTtcclxuICB9LFxyXG5cclxuICBsb2dpbkNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ2luXCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5sb2dpbkZvcm0oKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzaWdudXBDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJTaWduIHVwXCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5zaWdudXBGb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9nb3V0XCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5sb2dvdXRVc2VyKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcHJvZmlsZUNsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIlByb2ZpbGVcIikge1xyXG4gICAgICBwcm9maWxlLmxvYWRQcm9maWxlKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJHYW1lcGxheVwiKSB7XHJcbiAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuYXZiYXIiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IHByb2ZpbGUgPSB7XHJcblxyXG4gIGxvYWRQcm9maWxlKCkge1xyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgY29uc3QgYWN0aXZlVXNlcklkID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYWN0aXZlVXNlcklkKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlUGljID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvb2N0YW5lLmpwZ1wiLCBcImNsYXNzXCI6IFwiXCIgfSlcclxuICAgICAgY29uc3QgbmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb25cIiB9LCBgTmFtZTogJHt1c2VyLm5hbWV9YClcclxuICAgICAgY29uc3QgdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYFVzZXJuYW1lOiAke3VzZXIudXNlcm5hbWV9YClcclxuICAgICAgY29uc3QgcGxheWVyUHJvZmlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJwbGF5ZXJQcm9maWxlXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXJcIiB9LCBudWxsLCBwcm9maWxlUGljLCBuYW1lLCB1c2VybmFtZSlcclxuICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChwbGF5ZXJQcm9maWxlKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwcm9maWxlIiwiY2xhc3Mgc2hvdE9uR29hbCB7XHJcbiAgc2V0IGZpZWxkWChmaWVsZFgpIHtcclxuICAgIHRoaXMuX2ZpZWxkWCA9IGZpZWxkWFxyXG4gIH1cclxuICBzZXQgZmllbGRZKGZpZWxkWSkge1xyXG4gICAgdGhpcy5fZmllbGRZID0gZmllbGRZXHJcbiAgfVxyXG4gIHNldCBnb2FsWChnb2FsWCkge1xyXG4gICAgdGhpcy5fZ29hbFggPSBnb2FsWFxyXG4gIH1cclxuICBzZXQgZ29hbFkoZ29hbFkpIHtcclxuICAgIHRoaXMuX2dvYWxZID0gZ29hbFlcclxuICB9XHJcbiAgc2V0IGFlcmlhbChhZXJpYWxCb29sZWFuKSB7XHJcbiAgICB0aGlzLl9hZXJpYWwgPSBhZXJpYWxCb29sZWFuXHJcbiAgfVxyXG4gIHNldCBiYWxsU3BlZWQoYmFsbFNwZWVkKSB7XHJcbiAgICB0aGlzLmJhbGxfc3BlZWQgPSBiYWxsU3BlZWRcclxuICB9XHJcbiAgc2V0IHRpbWVTdGFtcChkYXRlT2JqKSB7XHJcbiAgICB0aGlzLl90aW1lU3RhbXAgPSBkYXRlT2JqXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90T25Hb2FsIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90T25Hb2FsIGZyb20gXCIuL3Nob3RDbGFzc1wiXHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tIFwiLi9nYW1lRGF0YVwiO1xyXG5cclxubGV0IHNob3RDb3VudGVyID0gMDtcclxubGV0IGVkaXRpbmdTaG90ID0gZmFsc2U7IC8vZWRpdGluZyBzaG90IGlzIHVzZWQgZm9yIGJvdGggbmV3IGFuZCBvbGQgc2hvdHNcclxubGV0IHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbmxldCBzaG90QXJyYXkgPSBbXTsgLy8gcmVzZXQgd2hlbiBnYW1lIGlzIHNhdmVkXHJcbi8vIGdsb2JhbCB2YXJzIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdE9iajtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWDtcclxubGV0IHByZXZpb3VzU2hvdEZpZWxkWTtcclxubGV0IHByZXZpb3VzU2hvdEdvYWxYO1xyXG5sZXQgcHJldmlvdXNTaG90R29hbFk7XHJcblxyXG5jb25zdCBzaG90RGF0YSA9IHtcclxuXHJcbiAgcmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiBnYW1lcGxheSBpcyBjbGlja2VkIG9uIHRoZSBuYXZiYXIgYW5kIHdoZW4gYSBnYW1lIGlzIHNhdmVkLCBpbiBvcmRlciB0byBwcmV2ZW50IGJ1Z3Mgd2l0aCBwcmV2aW91c2x5IGNyZWF0ZWQgc2hvdHNcclxuICAgIHNob3RDb3VudGVyID0gMDtcclxuICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgc2hvdEFycmF5ID0gW107XHJcbiAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gIH0sXHJcblxyXG4gIGNyZWF0ZU5ld1Nob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuICAgIHNob3RPYmogPSBuZXcgc2hvdE9uR29hbDtcclxuICAgIHNob3RPYmoudGltZVN0YW1wID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IHVzZXIgZnJvbSBzZWxlY3RpbmcgYW55IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKHRydWUpO1xyXG5cclxuICAgIGVkaXRpbmdTaG90ID0gdHJ1ZTtcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIGZpZWxkSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG5cclxuICAgIC8vIGFjdGl2YXRlIGNsaWNrIGZ1bmN0aW9uYWxpdHkgYW5kIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgb24gYm90aCBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICB9LFxyXG5cclxuICBnZXRDbGlja0Nvb3JkcyhlKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGdldHMgdGhlIHJlbGF0aXZlIHggYW5kIHkgb2YgdGhlIGNsaWNrIHdpdGhpbiB0aGUgZmllbGQgaW1hZ2UgY29udGFpbmVyXHJcbiAgICAvLyBhbmQgdGhlbiBjYWxscyB0aGUgZnVuY3Rpb24gdGhhdCBhcHBlbmRzIGEgbWFya2VyIG9uIHRoZSBwYWdlXHJcbiAgICBsZXQgcGFyZW50Q29udGFpbmVyO1xyXG4gICAgaWYgKGUudGFyZ2V0LmlkID09PSBcImZpZWxkLWltZ1wiKSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpO1xyXG4gICAgfVxyXG4gICAgLy8gb2Zmc2V0WCBhbmQgWSBhcmUgdGhlIHggYW5kIHkgY29vcmRpbmF0ZXMgKHBpeGVscykgb2YgdGhlIGNsaWNrIGluIHRoZSBjb250YWluZXJcclxuICAgIC8vIHRoZSBleHByZXNzaW9ucyBkaXZpZGUgdGhlIGNsaWNrIHggYW5kIHkgYnkgdGhlIHBhcmVudCBmdWxsIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgIGNvbnN0IHhDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFggLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpXHJcbiAgICBjb25zdCB5Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRZIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkudG9GaXhlZCgzKSk7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHhDb29yZFJlbGF0aXZlLCB5Q29vcmRSZWxhdGl2ZSwgcGFyZW50Q29udGFpbmVyKVxyXG4gIH0sXHJcblxyXG4gIG1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKSB7XHJcbiAgICBsZXQgbWFya2VySWQ7XHJcbiAgICBpZiAocGFyZW50Q29udGFpbmVyLmlkID09PSBcImZpZWxkLWltZy1wYXJlbnRcIikge1xyXG4gICAgICBtYXJrZXJJZCA9IFwic2hvdC1tYXJrZXItZmllbGRcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1nb2FsXCI7XHJcbiAgICB9XHJcbiAgICAvLyBhZGp1c3QgZm9yIDUwJSBvZiB3aWR0aCBhbmQgaGVpZ2h0IG9mIG1hcmtlciBzbyBpdCdzIGNlbnRlcmVkIGFib3V0IG1vdXNlIHBvaW50ZXJcclxuICAgIGxldCBhZGp1c3RNYXJrZXJYID0gMTIuNSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCBhZGp1c3RNYXJrZXJZID0gMTIuNSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBOT1QgYWxyZWFkeSBhIG1hcmtlciwgdGhlbiBtYWtlIG9uZSBhbmQgcGxhY2UgaXRcclxuICAgIGlmICghcGFyZW50Q29udGFpbmVyLmNvbnRhaW5zKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1hcmtlcklkKSkpIHtcclxuICAgICAgdGhpcy5nZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KTtcclxuICAgICAgLy8gZWxzZSBtb3ZlIHRoZSBleGlzdGluZyBtYXJrZXIgdG8gdGhlIG5ldyBwb3NpdGlvblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5tb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKTtcclxuICAgIH1cclxuICAgIC8vIHNhdmUgY29vcmRpbmF0ZXMgdG8gb2JqZWN0XHJcbiAgICB0aGlzLmFkZENvb3Jkc1RvQ2xhc3MobWFya2VySWQsIHgsIHkpXHJcbiAgfSxcclxuXHJcbiAgZ2VuZXJhdGVNYXJrZXIocGFyZW50Q29udGFpbmVyLCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZLCBtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIGRpdi5pZCA9IG1hcmtlcklkO1xyXG4gICAgZGl2LnN0eWxlLndpZHRoID0gXCIyNXB4XCI7XHJcbiAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gXCIyNXB4XCI7XHJcbiAgICBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJsaWdodGdyZWVuXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyID0gXCIxcHggc29saWQgYmxhY2tcIjtcclxuICAgIGRpdi5zdHlsZS5ib3JkZXJSYWRpdXMgPSBcIjUwJVwiO1xyXG4gICAgZGl2LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgZGl2LnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBkaXYuc3R5bGUudG9wID0gKHkgLSBhZGp1c3RNYXJrZXJZKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgcGFyZW50Q29udGFpbmVyLmFwcGVuZENoaWxkKGRpdik7XHJcbiAgfSxcclxuXHJcbiAgbW92ZU1hcmtlcihtYXJrZXJJZCwgeCwgeSwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSkge1xyXG4gICAgY29uc3QgY3VycmVudE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1hcmtlcklkKTtcclxuICAgIGN1cnJlbnRNYXJrZXIuc3R5bGUubGVmdCA9ICh4IC0gYWRqdXN0TWFya2VyWCkgKiAxMDAgKyBcIiVcIjtcclxuICAgIGN1cnJlbnRNYXJrZXIuc3R5bGUudG9wID0gKHkgLSBhZGp1c3RNYXJrZXJZKSAqIDEwMCArIFwiJVwiO1xyXG4gIH0sXHJcblxyXG4gIGFkZENvb3Jkc1RvQ2xhc3MobWFya2VySWQsIHgsIHkpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdXBkYXRlcyB0aGUgaW5zdGFuY2Ugb2Ygc2hvdE9uR29hbCBjbGFzcyB0byByZWNvcmQgY2xpY2sgY29vcmRpbmF0ZXNcclxuICAgIC8vIGlmIGEgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gYXBwZW5kIHRoZSBjb29yZGluYXRlcyB0byB0aGUgb2JqZWN0IGluIHF1ZXN0aW9uXHJcbiAgICBpZiAocHJldmlvdXNTaG90T2JqICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWYgKG1hcmtlcklkID09PSBcInNob3QtbWFya2VyLWZpZWxkXCIpIHtcclxuICAgICAgICAvLyB1c2UgZ2xvYmFsIHZhcnMgaW5zdGVhZCBvZiB1cGRhdGluZyBvYmplY3QgZGlyZWN0bHkgaGVyZSB0byBwcmV2ZW50IGFjY2lkZW50YWwgZWRpdGluZyBvZiBtYXJrZXIgd2l0aG91dCBjbGlja2luZyBcInNhdmUgc2hvdFwiXHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRYID0geDtcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB5O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0geDtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gb3RoZXJ3aXNlLCBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQsIHNvIGFwcGVuZCBjb29yZGluYXRlcyB0byB0aGUgbmV3IG9iamVjdFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKG1hcmtlcklkID09PSBcInNob3QtbWFya2VyLWZpZWxkXCIpIHtcclxuICAgICAgICBzaG90T2JqLmZpZWxkWCA9IHg7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFkgPSB5O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNob3RPYmouZ29hbFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZ29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGZpZWxkTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1maWVsZFwiKTtcclxuICAgIGNvbnN0IGdvYWxNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWdvYWxcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gbnVsbDtcclxuICAgICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICAgICAgLy8gaWYgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBjYW5jZWwgdGhlIG5ldyBpbnN0YW5jZSBvZiBzaG90Q2xhc3NcclxuICAgICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWRcclxuICAgICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxZID0gdW5kZWZpbmVkO1xyXG4gICAgICAvLyByZW1vdmUgbWFya2VycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgIGlmIChmaWVsZE1hcmtlciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGZpZWxkSW1nUGFyZW50LnJlbW92ZUNoaWxkKGZpZWxkTWFya2VyKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZ29hbE1hcmtlciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGdvYWxJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZ29hbE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gcmVtb3ZlIGNsaWNrIGxpc3RlbmVycyBmcm9tIGZpZWxkIGFuZCBnb2FsXHJcbiAgICAgIGZpZWxkSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIGdvYWxJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgLy8gYWxsb3cgdXNlciB0byBzZWxlY3QgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIHNhdmVTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuICAgIGNvbnN0IGZpZWxkTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1maWVsZFwiKTtcclxuICAgIGNvbnN0IGdvYWxNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWdvYWxcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuXHJcbiAgICBpZiAoIWVkaXRpbmdTaG90KSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZWRpdGluZ1Nob3QgPSBmYWxzZTtcclxuICAgICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgLy8gY2xlYXIgZmllbGQgYW5kIGdvYWwgZXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgIGZpZWxkSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIGdvYWxJbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIGdvYWxJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZ29hbE1hcmtlcik7XHJcbiAgICAgIC8vIGNvbmRpdGlvbmFsIHN0YXRlbWVudCB0byBzYXZlIGNvcnJlY3Qgb2JqZWN0IChpLmUuIHNob3QgYmVpbmcgZWRpdGVkIHZzLiBuZXcgc2hvdClcclxuICAgICAgLy8gaWYgc2hvdCBpcyBiZWluZyBlZGl0ZWQsIHRoZW4gcHJldmlvdXNTaG90T2JqIHdpbGwgbm90IGJlIHVuZGVmaW5lZFxyXG4gICAgICBpZiAocHJldmlvdXNTaG90T2JqICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoc2VsX2FlcmlhbC52YWx1ZSA9PT0gXCJBZXJpYWxcIikgeyBwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9IHRydWUgfSBlbHNlIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSBmYWxzZSB9O1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5iYWxsX3NwZWVkID0gaW5wdF9iYWxsU3BlZWQudmFsdWU7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9maWVsZFggPSBwcmV2aW91c1Nob3RGaWVsZFg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9maWVsZFkgPSBwcmV2aW91c1Nob3RGaWVsZFk7XHJcbiAgICAgICAgcHJldmlvdXNTaG90T2JqLl9nb2FsWCA9IHByZXZpb3VzU2hvdEdvYWxYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFkgPSBwcmV2aW91c1Nob3RHb2FsWTtcclxuICAgICAgICAvLyBlbHNlIHNhdmUgdG8gbmV3IGluc3RhbmNlIG9mIGNsYXNzIGFuZCBhcHBlbmQgYnV0dG9uIHRvIHBhZ2Ugd2l0aCBjb3JyZWN0IElEIGZvciBlZGl0aW5nXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgc2hvdE9iai5hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHNob3RPYmouYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICBzaG90T2JqLmJhbGxTcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgIHNob3RBcnJheS5wdXNoKHNob3RPYmopO1xyXG4gICAgICAgIC8vIGFwcGVuZCBuZXcgYnV0dG9uXHJcbiAgICAgICAgc2hvdENvdW50ZXIrKztcclxuICAgICAgICBjb25zdCBuZXdTaG90QnRuID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBgc2hvdC0ke3Nob3RDb3VudGVyfWAsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtbGlua1wiIH0sIGBTaG90ICR7c2hvdENvdW50ZXJ9YCk7XHJcbiAgICAgICAgc2hvdEJ0bkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdTaG90QnRuKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgc2hvdC0ke3Nob3RDb3VudGVyfWApLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5yZW5kZXJTYXZlZFNob3QpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vVE9ETzogYWRkIGNvbmRpdGlvbiB0byBwcmV2ZW50IGJsYW5rIGVudHJpZXMgYW5kIG1pc3NpbmcgY29vcmRpbmF0ZXNcclxuXHJcbiAgICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gbnVsbDtcclxuICAgICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICAgICAgLy8gY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzIChtYXR0ZXJzIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZClcclxuICAgICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZCAobWF0dGVycyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQpXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gYWxsb3cgdXNlciB0byBzZWxlY3QgYW55IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICByZW5kZXJTYXZlZFNob3QoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZWZlcmVuY2VzIHRoZSBzaG90QXJyYXkgdG8gZ2V0IGEgc2hvdCBvYmplY3QgdGhhdCBtYXRjaGVzIHRoZSBzaG90IyBidXR0b24gY2xpY2tlZCAoZS5nLiBzaG90IDIgYnV0dG9uID0gaW5kZXggMSBvZiB0aGUgc2hvdEFycmF5KVxyXG4gICAgLy8gdGhlIGZ1bmN0aW9uIChhbmQgaXRzIGFzc29jaWF0ZWQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBpbiBvdGhlciBsb2NhbCBmdW5jdGlvbnMpIGhhcyB0aGVzZSBiYXNpYyByZXF1aXJlbWVudHM6XHJcbiAgICAvLyByZS1pbml0aWFsaXplIGNsaWNrIGxpc3RlbmVycyBvbiBpbWFnZXNcclxuICAgIC8vIHJldml2ZSBhIHNhdmVkIGluc3RhbmNlIG9mIHNob3RDbGFzcyBmb3IgZWRpdGluZyBzaG90IGNvb3JkaW5hdGVzLCBiYWxsIHNwZWVkLCBhbmQgYWVyaWFsXHJcbiAgICAvLyByZW5kZXIgbWFya2VycyBmb3IgZXhpc3RpbmcgY29vcmRpbmF0ZXMgb24gZmllbGQgYW5kIGdvYWwgaW1hZ2VzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIHNhdmUgZWRpdHNcclxuICAgIC8vIGFmZm9yZGFuY2UgdG8gY2FuY2VsIGVkaXRzXHJcbiAgICAvLyB0aGUgZGF0YSBpcyByZW5kZXJlZCBvbiB0aGUgcGFnZSBhbmQgY2FuIGJlIHNhdmVkIChvdmVyd3JpdHRlbikgYnkgdXNpbmcgdGhlIFwic2F2ZSBzaG90XCIgYnV0dG9uIG9yIGNhbmNlbGVkIGJ5IGNsaWNraW5nIHRoZSBcImNhbmNlbCBzaG90XCIgYnV0dG9uXHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIC8vIHByZXZlbnQgbmV3IHNob3QgYnV0dG9uIGZyb20gYmVpbmcgY2xpY2tlZFxyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgLy8gYWxsb3cgY2FuY2VsIGFuZCBzYXZlZCBidXR0b25zIHRvIGJlIGNsaWNrZWRcclxuICAgIGVkaXRpbmdTaG90ID0gdHJ1ZTtcclxuICAgIC8vIGdldCBJRCBvZiBzaG90IyBidG4gY2xpY2tlZCBhbmQgYWNjZXNzIHNob3RBcnJheSBhdCBbYnRuSUQgLSAxXVxyXG4gICAgbGV0IGJ0bklkID0gZS50YXJnZXQuaWQuc2xpY2UoNSk7XHJcbiAgICBwcmV2aW91c1Nob3RPYmogPSBzaG90QXJyYXlbYnRuSWQgLSAxXTtcclxuICAgIC8vIHJlbmRlciBiYWxsIHNwZWVkIGFuZCBhZXJpYWwgZHJvcGRvd24gZm9yIHRoZSBzaG90XHJcbiAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IHByZXZpb3VzU2hvdE9iai5iYWxsX3NwZWVkO1xyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID09PSB0cnVlKSB7IHNlbF9hZXJpYWwudmFsdWUgPSBcIkFlcmlhbFwiOyB9IGVsc2UgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiOyB9XHJcbiAgICAvLyBhZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGZpZWxkIGFuZCBnb2FsXHJcbiAgICBmaWVsZEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgLy8gcmVuZGVyIHNob3QgbWFya2VyIG9uIGZpZWxkXHJcbiAgICBsZXQgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpXHJcbiAgICBsZXQgeCA9IChwcmV2aW91c1Nob3RPYmouX2ZpZWxkWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgeSA9IChwcmV2aW91c1Nob3RPYmouX2ZpZWxkWSAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuICAgIC8vIHJlbmRlciBnb2FsIG1hcmtlciBvbiBmaWVsZFxyXG4gICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIilcclxuICAgIHggPSBOdW1iZXIoKChwcmV2aW91c1Nob3RPYmouX2dvYWxYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSk7XHJcbiAgICB5ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWSAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkudG9GaXhlZCgzKSk7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcblxyXG4gIH0sXHJcblxyXG4gIGRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZGlzYWJsZU9yTm90KSB7XHJcbiAgICAvLyBmb3IgZWFjaCBidXR0b24gYWZ0ZXIgXCJOZXcgU2hvdFwiLCBcIlNhdmUgU2hvdFwiLCBhbmQgXCJDYW5jZWwgU2hvdFwiIGRpc2FibGUgdGhlIGJ1dHRvbnMgaWYgdGhlIHVzZXIgaXMgY3JlYXRpbmcgYSBuZXcgc2hvdCAoZGlzYWJsZU9yTm90ID0gdHJ1ZSkgb3IgZW5hYmxlIHRoZW0gb24gc2F2ZS9jYW5jZWwgb2YgYSBuZXcgc2hvdCAoZGlzYWJsZU9yTm90ID0gZmFsc2UpXHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcbiAgICBsZXQgZWRpdEJ0bjtcclxuICAgIGxldCBsZW5ndGggPSBzaG90QnRuQ29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoO1xyXG4gICAgZm9yIChsZXQgaSA9IDM7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICBlZGl0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpIC0gMn1gKTtcclxuICAgICAgZWRpdEJ0bi5kaXNhYmxlZCA9IGRpc2FibGVPck5vdDtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgZ2V0U2hvdE9iamVjdHNGb3JQb3N0KCkge1xyXG4gICAgLy8gcHJvdmlkZXMgYXJyYXkgZm9yIHVzZSBpbiBnYW1lRGF0YS5qcyAod2hlbiBzYXZpbmcgYSBuZXcgZ2FtZSwgbm90IHdoZW4gc2F2aW5nIGFuIGVkaXRlZCBnYW1lKVxyXG4gICAgcmV0dXJuIHNob3RBcnJheTtcclxuICB9LFxyXG5cclxuICByZW5kZXJTaG90c0J1dHRvbnNGcm9tUHJldmlvdXNHYW1lKCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiByZXF1ZXN0cyB0aGUgYXJyYXkgb2Ygc2hvdHMgZnJvbSB0aGUgcHJldmlvdXMgc2F2ZWQgZ2FtZSwgc2V0cyBpdCBhcyBzaG90QXJyYXksIGFuZCByZW5kZXJzIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgLy8gZ2V0IHNhdmVkIGdhbWUgd2l0aCBzaG90cyBlbWJlZGRlZCBhcyBhcnJheVxyXG4gICAgbGV0IHNhdmVkR2FtZU9iaiA9IGdhbWVEYXRhLnByb3ZpZGVTaG90c1RvU2hvdERhdGEoKTtcclxuICAgIC8vIGNyZWF0ZSBzaG90QXJyYXkgd2l0aCBmb3JtYXQgcmVxdWlyZWQgYnkgbG9jYWwgZnVuY3Rpb25zXHJcbiAgICBsZXQgc2F2ZWRTaG90T2JqXHJcbiAgICBzYXZlZEdhbWVPYmouc2hvdHMuZm9yRWFjaChzaG90ID0+IHtcclxuICAgICAgc2F2ZWRTaG90T2JqID0gbmV3IHNob3RPbkdvYWxcclxuICAgICAgc2F2ZWRTaG90T2JqLmZpZWxkWCA9IHNob3QuZmllbGRYO1xyXG4gICAgICBzYXZlZFNob3RPYmouZmllbGRZID0gc2hvdC5maWVsZFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWCA9IHNob3QuZ29hbFg7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5nb2FsWSA9IHNob3QuZ29hbFk7XHJcbiAgICAgIHNhdmVkU2hvdE9iai5hZXJpYWwgPSBzaG90LmFlcmlhbDtcclxuICAgICAgc2F2ZWRTaG90T2JqLmJhbGxfc3BlZWQgPSBzaG90LmJhbGxfc3BlZWQudG9TdHJpbmcoKTtcclxuICAgICAgc2F2ZWRTaG90T2JqLnRpbWVTdGFtcCA9IHNob3QudGltZVN0YW1wXHJcbiAgICAgIHNob3RBcnJheS5wdXNoKHNhdmVkU2hvdE9iaik7XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKHNob3RBcnJheSk7XHJcbiAgICBzaG90QXJyYXkuZm9yRWFjaCgoc2hvdCwgaWR4KSA9PiB7XHJcbiAgICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IGBzaG90LSR7aWR4ICsgMX1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke2lkeCArIDF9YCk7XHJcbiAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aWR4ICsgMX1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgIH0pO1xyXG4gICAgc2hvdENvdW50ZXIgPSBzaG90QXJyYXkubGVuZ3RoO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3REYXRhXHJcblxyXG4vLyBUT0RPOiBub3RlcyBvbiByZW5kZXJpbmcgZ2FtZSBkYXRhIGFuZCBzYXZpbmdzIGVkaXRlZCBzaG90c1xyXG4vLyAtLS0gbWF5IG5lZWQgdG8gY3JlYXRlIGFub3RoZXIgZ2xvYmFsIHZhciBpbiBzaG90RGF0YS5qcyB0aGF0IGlzIGFzc2lnbmVkIGFuIGludGVnZXIgcmVwcmVzZW50aW5nXHJcbi8vIHRoZSBpbml0aWFsIG51bWJlciBvZiBzaG90cy4gSWYgYSB1c2VyIGZvcmdvdCB0byBhZGQgYSBzaG90LCBmb3IgaW5zdGFuY2UsIGFuZCB0aGV5IGFkZCBhIG5ldyBvbmUgaW4gZWRpdGluZyBtb2RlLFxyXG4vLyB0aGVuIHRoYXQgc2hvdCBuZWVkcyB0byBiZSBQT1NUZWQsIG5vdCBQVVQuIE5lZWQgdG8gZGlmZmVyZW50aWF0ZSB0aGUgbWV0aG9kc1xyXG4vLyBmZXRjaC5QVVQgdGhlIGFscmVhZHkgc2F2ZWQgc2hvdHMgPT4gdGhlbiBmZXRjaC5QT1NUIGFueSBuZXcgc2hvdHMiXX0=
