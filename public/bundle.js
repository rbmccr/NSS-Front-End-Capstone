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

  saveData() {
    // get user ID from session storage
    // package and save game data
    // then get ID of latest game saved (returned immediately in object from POST)
    // package and save shots with the game ID
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
    }

    let gameData = {
      "userId": activeUserId,
      "mode": gameMode,
      "type": gameType,
      "team": myTeam,
      "score": myScore,
      "opp_score": theirScore,
      "overtime": overtime
    };

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

        _API.default.postItem("shots", shotForPost).then(post => {
          console.log(post); // call functions that clear gameplay content and reset global shot data variables

          _gameplay.default.loadGameplay();

          _shotData.default.resetGlobalShotVariables();
        });
      });
    });
  },

  savePrevGameEdits() {
    console.log("saving edits..."); // TODO: PUT edits to database
  },

  cancelEditingMode() {
    _gameplay.default.loadGameplay();

    _shotData.default.resetGlobalShotVariables();
  },

  renderEditButtons() {
    // remove & replace edit and save game buttons with "Save Edits" and "Cancel Edits"
    const btn_editPrevGame = document.getElementById("editPrevGame");
    const btn_saveGame = document.getElementById("saveGame");
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
    console.log(game); // TODO: render shot data and game data on page
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
          gameData.renderEditButtons();
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
    btn_saveGame.addEventListener("click", _gameData.default.saveData);
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let shotCounter = 0;
let editingShot = false; //editing shot is used for both new and old shots

let shotObj = undefined;
let shotArray = []; // reset when game is saved

let previousShotObj; // global var used with shot editing

let previousShotFieldX; // global var used with shot editing

let previousShotFieldY; // global var used with shot editing

let previousShotGoalX; // global var used with shot editing

let previousShotGoalY; // global var used with shot editing

const shotData = {
  resetGlobalShotVariables() {
    // this function is called when gameplay is clicked on the navbar (from navbar.js) in order to prevent bugs with previously created shots
    //TODO: call this function with "Save Game"
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
    shotObj = new _shotClass.default(); // prevent user from selecting any edit shot buttons

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
    return shotArray;
  }

};
var _default = shotData;
exports.default = _default;

},{"./elementBuilder":2,"./shotClass":9}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zY3JpcHRzL0FQSS5qcyIsIi4uL3NjcmlwdHMvZWxlbWVudEJ1aWxkZXIuanMiLCIuLi9zY3JpcHRzL2dhbWVEYXRhLmpzIiwiLi4vc2NyaXB0cy9nYW1lcGxheS5qcyIsIi4uL3NjcmlwdHMvbG9naW4uanMiLCIuLi9zY3JpcHRzL21haW4uanMiLCIuLi9zY3JpcHRzL25hdmJhci5qcyIsIi4uL3NjcmlwdHMvcHJvZmlsZS5qcyIsIi4uL3NjcmlwdHMvc2hvdENsYXNzLmpzIiwiLi4vc2NyaXB0cy9zaG90RGF0YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBLE1BQU0sR0FBRyxHQUFHLHVCQUFaO0FBRUEsTUFBTSxHQUFHLEdBQUc7QUFFVixFQUFBLGFBQWEsQ0FBQyxTQUFELEVBQVksRUFBWixFQUFnQjtBQUMzQixXQUFPLEtBQUssQ0FBRSxHQUFFLEdBQUksSUFBRyxTQUFVLElBQUcsRUFBRyxFQUEzQixDQUFMLENBQW1DLElBQW5DLENBQXdDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBTCxFQUFoRCxDQUFQO0FBQ0QsR0FKUzs7QUFNVixFQUFBLE1BQU0sQ0FBQyxTQUFELEVBQVk7QUFDaEIsV0FBTyxLQUFLLENBQUUsR0FBRSxHQUFJLElBQUcsU0FBVSxFQUFyQixDQUFMLENBQTZCLElBQTdCLENBQWtDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBTCxFQUExQyxDQUFQO0FBQ0QsR0FSUzs7QUFVVixFQUFBLFVBQVUsQ0FBQyxTQUFELEVBQVksRUFBWixFQUFnQjtBQUN4QixXQUFPLEtBQUssQ0FBRSxHQUFFLEdBQUksSUFBRyxTQUFVLElBQUcsRUFBRyxFQUEzQixFQUE4QjtBQUN4QyxNQUFBLE1BQU0sRUFBRTtBQURnQyxLQUE5QixDQUFMLENBR0osSUFISSxDQUdDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBRixFQUhOLEVBSUosSUFKSSxDQUlDLE1BQU0sS0FBSyxDQUFFLEdBQUUsR0FBSSxJQUFHLFNBQVUsRUFBckIsQ0FKWixFQUtKLElBTEksQ0FLQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUYsRUFMTixDQUFQO0FBTUQsR0FqQlM7O0FBbUJWLEVBQUEsUUFBUSxDQUFDLFNBQUQsRUFBWSxHQUFaLEVBQWlCO0FBQ3ZCLFdBQU8sS0FBSyxDQUFFLEdBQUUsR0FBSSxJQUFHLFNBQVUsRUFBckIsRUFBd0I7QUFDbEMsTUFBQSxNQUFNLEVBQUUsTUFEMEI7QUFFbEMsTUFBQSxPQUFPLEVBQUU7QUFDUCx3QkFBZ0I7QUFEVCxPQUZ5QjtBQUtsQyxNQUFBLElBQUksRUFBRSxJQUFJLENBQUMsU0FBTCxDQUFlLEdBQWY7QUFMNEIsS0FBeEIsQ0FBTCxDQU9KLElBUEksQ0FPQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUYsRUFQTixDQUFQO0FBUUQ7O0FBNUJTLENBQVo7ZUFnQ2UsRzs7Ozs7Ozs7Ozs7QUNsQ2YsU0FBUyxTQUFULENBQW1CLElBQW5CLEVBQXlCLGFBQXpCLEVBQXdDLEdBQXhDLEVBQTZDLEdBQUcsUUFBaEQsRUFBMEQ7QUFDeEQsUUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsSUFBdkIsQ0FBWDs7QUFDQSxPQUFLLElBQUksSUFBVCxJQUFpQixhQUFqQixFQUFnQztBQUM5QixJQUFBLEVBQUUsQ0FBQyxZQUFILENBQWdCLElBQWhCLEVBQXNCLGFBQWEsQ0FBQyxJQUFELENBQW5DO0FBQ0Q7O0FBQ0QsRUFBQSxFQUFFLENBQUMsV0FBSCxHQUFpQixHQUFHLElBQUksSUFBeEI7QUFDQSxFQUFBLFFBQVEsQ0FBQyxPQUFULENBQWlCLEtBQUssSUFBSTtBQUN4QixJQUFBLEVBQUUsQ0FBQyxXQUFILENBQWUsS0FBZjtBQUNELEdBRkQ7QUFHQSxTQUFPLEVBQVA7QUFDRDs7ZUFFYyxTOzs7Ozs7Ozs7OztBQ1pmOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsTUFBTSxRQUFRLEdBQUc7QUFFZixFQUFBLG9CQUFvQixDQUFDLENBQUQsRUFBSTtBQUN0QjtBQUVBLFVBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLE1BQXhCLENBQWhCO0FBQ0EsVUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBaEI7QUFDQSxVQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixNQUF4QixDQUFoQjtBQUNBLFVBQU0sWUFBWSxHQUFHLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsT0FBbkIsQ0FBckI7QUFDQSxRQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsTUFBbkI7O0FBRUEsUUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFYLENBQXFCLFFBQXJCLENBQThCLGFBQTlCLENBQUwsRUFBbUQ7QUFDakQsWUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsTUFBYixDQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLFNBQUosQ0FBYyxRQUFkLENBQXVCLGFBQXZCLENBQTNCLENBQTNCO0FBQ0EsTUFBQSxrQkFBa0IsQ0FBQyxDQUFELENBQWxCLENBQXNCLFNBQXRCLENBQWdDLE1BQWhDLENBQXVDLGFBQXZDO0FBQ0EsTUFBQSxrQkFBa0IsQ0FBQyxDQUFELENBQWxCLENBQXNCLFNBQXRCLENBQWdDLE1BQWhDLENBQXVDLFNBQXZDO0FBQ0EsTUFBQSxVQUFVLENBQUMsU0FBWCxDQUFxQixHQUFyQixDQUF5QixhQUF6QjtBQUNBLE1BQUEsVUFBVSxDQUFDLFNBQVgsQ0FBcUIsR0FBckIsQ0FBeUIsU0FBekI7QUFDRCxLQU5ELE1BTU87QUFDTDtBQUNEO0FBRUYsR0FyQmM7O0FBdUJmLEVBQUEsUUFBUSxHQUFHO0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQSxVQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQWYsQ0FBdUIsY0FBdkIsQ0FBRCxDQUEzQixDQVZTLENBWVQ7O0FBQ0EsVUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBaEI7QUFDQSxVQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixNQUF4QixDQUFoQjtBQUNBLFVBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLE1BQXhCLENBQWhCO0FBQ0EsVUFBTSxZQUFZLEdBQUcsQ0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixPQUFuQixDQUFyQjtBQUNBLFFBQUksUUFBUSxHQUFHLFNBQWY7QUFFQSxJQUFBLFlBQVksQ0FBQyxPQUFiLENBQXFCLEdBQUcsSUFBSTtBQUMxQixVQUFJLEdBQUcsQ0FBQyxTQUFKLENBQWMsUUFBZCxDQUF1QixhQUF2QixDQUFKLEVBQTJDO0FBQ3pDLFFBQUEsUUFBUSxHQUFHLEdBQUcsQ0FBQyxXQUFmO0FBQ0Q7QUFDRixLQUpELEVBbkJTLENBeUJUOztBQUNBLFVBQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGVBQXhCLENBQXJCO0FBQ0EsVUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLEtBQWIsQ0FBbUIsV0FBbkIsRUFBakIsQ0EzQlMsQ0E2QlQ7O0FBQ0EsVUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBdEI7QUFDQSxRQUFJLE1BQUo7O0FBQ0EsUUFBSSxhQUFhLENBQUMsS0FBZCxLQUF3QixhQUE1QixFQUEyQztBQUN6QyxNQUFBLE1BQU0sR0FBRyxRQUFUO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsTUFBQSxNQUFNLEdBQUcsTUFBVDtBQUNELEtBcENRLENBc0NUOzs7QUFDQSxRQUFJLE9BQUo7QUFDQSxRQUFJLFVBQUo7QUFDQSxVQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGtCQUF4QixDQUF6QjtBQUNBLFVBQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGdCQUF4QixDQUF2Qjs7QUFFQSxRQUFJLE1BQU0sS0FBSyxRQUFmLEVBQXlCO0FBQ3ZCLE1BQUEsT0FBTyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFsQixDQUFoQjtBQUNBLE1BQUEsVUFBVSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBaEIsQ0FBbkI7QUFDRCxLQUhELE1BR087QUFDTCxNQUFBLE9BQU8sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQWhCLENBQWhCO0FBQ0EsTUFBQSxVQUFVLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQWxCLENBQW5CO0FBQ0QsS0FsRFEsQ0FvRFQ7OztBQUNBLFFBQUksUUFBSjtBQUNBLFVBQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGVBQXhCLENBQXJCOztBQUNBLFFBQUksWUFBWSxDQUFDLEtBQWIsS0FBdUIsVUFBM0IsRUFBdUM7QUFDckMsTUFBQSxRQUFRLEdBQUcsSUFBWDtBQUNELEtBRkQsTUFFTztBQUNMLE1BQUEsUUFBUSxHQUFHLEtBQVg7QUFDRDs7QUFFRCxRQUFJLFFBQVEsR0FBRztBQUNiLGdCQUFVLFlBREc7QUFFYixjQUFRLFFBRks7QUFHYixjQUFRLFFBSEs7QUFJYixjQUFRLE1BSks7QUFLYixlQUFTLE9BTEk7QUFNYixtQkFBYSxVQU5BO0FBT2Isa0JBQVk7QUFQQyxLQUFmOztBQVVBLGlCQUFJLFFBQUosQ0FBYSxPQUFiLEVBQXNCLFFBQXRCLEVBQ0csSUFESCxDQUNRLElBQUksSUFBSSxJQUFJLENBQUMsRUFEckIsRUFFRyxJQUZILENBRVEsTUFBTSxJQUFJO0FBQ2Q7QUFDQSxZQUFNLE9BQU8sR0FBRyxrQkFBUyxxQkFBVCxFQUFoQjs7QUFDQSxNQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksT0FBWjtBQUNBLE1BQUEsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsT0FBTyxJQUFJO0FBQ3pCLFlBQUksV0FBVyxHQUFHLEVBQWxCO0FBQ0EsUUFBQSxXQUFXLENBQUMsTUFBWixHQUFxQixNQUFyQjtBQUNBLFFBQUEsV0FBVyxDQUFDLE1BQVosR0FBcUIsT0FBTyxDQUFDLE9BQTdCO0FBQ0EsUUFBQSxXQUFXLENBQUMsTUFBWixHQUFxQixPQUFPLENBQUMsT0FBN0I7QUFDQSxRQUFBLFdBQVcsQ0FBQyxLQUFaLEdBQW9CLE9BQU8sQ0FBQyxNQUE1QjtBQUNBLFFBQUEsV0FBVyxDQUFDLEtBQVosR0FBb0IsT0FBTyxDQUFDLE1BQTVCO0FBQ0EsUUFBQSxXQUFXLENBQUMsVUFBWixHQUF5QixNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVQsQ0FBL0I7QUFDQSxRQUFBLFdBQVcsQ0FBQyxNQUFaLEdBQXFCLE9BQU8sQ0FBQyxPQUE3Qjs7QUFDQSxxQkFBSSxRQUFKLENBQWEsT0FBYixFQUFzQixXQUF0QixFQUFtQyxJQUFuQyxDQUF3QyxJQUFJLElBQUk7QUFDOUMsVUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLElBQVosRUFEOEMsQ0FFOUM7O0FBQ0EsNEJBQVMsWUFBVDs7QUFDQSw0QkFBUyx3QkFBVDtBQUNELFNBTEQ7QUFNRCxPQWZEO0FBZ0JELEtBdEJIO0FBd0JELEdBdEhjOztBQXdIZixFQUFBLGlCQUFpQixHQUFHO0FBQ2xCLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxpQkFBWixFQURrQixDQUVsQjtBQUNELEdBM0hjOztBQTZIZixFQUFBLGlCQUFpQixHQUFHO0FBQ2xCLHNCQUFTLFlBQVQ7O0FBQ0Esc0JBQVMsd0JBQVQ7QUFDRCxHQWhJYzs7QUFrSWYsRUFBQSxpQkFBaUIsR0FBRztBQUNsQjtBQUNBLFVBQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBekI7QUFDQSxVQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixVQUF4QixDQUFyQjtBQUVBLFVBQU0sZUFBZSxHQUFHLDZCQUFVLFFBQVYsRUFBb0I7QUFBRSxZQUFNLGFBQVI7QUFBdUIsZUFBUztBQUFoQyxLQUFwQixFQUEwRSxjQUExRSxDQUF4QjtBQUNBLFVBQU0sYUFBYSxHQUFHLDZCQUFVLFFBQVYsRUFBb0I7QUFBRSxZQUFNLFdBQVI7QUFBcUIsZUFBUztBQUE5QixLQUFwQixFQUF5RSxZQUF6RSxDQUF0QjtBQUVBLElBQUEsZUFBZSxDQUFDLGdCQUFoQixDQUFpQyxPQUFqQyxFQUEwQyxRQUFRLENBQUMsaUJBQW5EO0FBQ0EsSUFBQSxhQUFhLENBQUMsZ0JBQWQsQ0FBK0IsT0FBL0IsRUFBd0MsUUFBUSxDQUFDLGlCQUFqRDtBQUVBLElBQUEsZ0JBQWdCLENBQUMsV0FBakIsQ0FBNkIsZUFBN0I7QUFDQSxJQUFBLFlBQVksQ0FBQyxXQUFiLENBQXlCLGFBQXpCO0FBRUQsR0FoSmM7O0FBa0pmLEVBQUEsY0FBYyxDQUFDLElBQUQsRUFBTztBQUNuQixJQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksSUFBWixFQURtQixDQUVuQjtBQUNELEdBckpjOztBQXVKZixFQUFBLFlBQVksR0FBRztBQUNiO0FBRUE7QUFDQSxVQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsT0FBZixDQUF1QixjQUF2QixDQUFyQjs7QUFFQSxpQkFBSSxhQUFKLENBQWtCLE9BQWxCLEVBQTRCLEdBQUUsWUFBYSxlQUEzQyxFQUEyRCxJQUEzRCxDQUFnRSxJQUFJLElBQUk7QUFDdEUsVUFBSSxJQUFJLENBQUMsS0FBTCxDQUFXLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsUUFBQSxLQUFLLENBQUMsdUNBQUQsQ0FBTDtBQUNELE9BRkQsTUFFTztBQUNMO0FBQ0EsY0FBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxNQUFYLENBQWtCLENBQUMsR0FBRCxFQUFNLEdBQU4sS0FBYyxHQUFHLENBQUMsRUFBSixHQUFTLEdBQVQsR0FBZSxHQUFHLENBQUMsRUFBbkIsR0FBd0IsR0FBeEQsRUFBNkQsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLEVBQWMsRUFBM0UsQ0FBckIsQ0FGSyxDQUdMOztBQUNBLHFCQUFJLGFBQUosQ0FBa0IsT0FBbEIsRUFBNEIsR0FBRSxZQUFhLGVBQTNDLEVBQTJELElBQTNELENBQWdFLE9BQU8sSUFBSTtBQUN6RSxVQUFBLFFBQVEsQ0FBQyxpQkFBVDtBQUNBLFVBQUEsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsT0FBeEI7QUFDRCxTQUhEO0FBSUQ7QUFDRixLQVpEO0FBYUQ7O0FBMUtjLENBQWpCO2VBOEtlLFE7Ozs7Ozs7Ozs7O0FDMUxmOztBQUNBOztBQUNBOzs7O0FBRUEsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0Isa0JBQXhCLENBQWhCO0FBRUEsTUFBTSxRQUFRLEdBQUc7QUFFZixFQUFBLFlBQVksR0FBRztBQUNiLElBQUEsT0FBTyxDQUFDLFNBQVIsR0FBb0IsSUFBcEIsQ0FEYSxDQUViO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFNBQUssZ0JBQUw7QUFDQSxTQUFLLGdCQUFMO0FBQ0EsU0FBSyxvQkFBTDtBQUNELEdBWGM7O0FBYWYsRUFBQSxnQkFBZ0IsR0FBRztBQUNqQjtBQUVBO0FBQ0EsVUFBTSxTQUFTLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUF1RCxpQkFBdkQsQ0FBbEI7QUFDQSxVQUFNLGtCQUFrQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBdUMsSUFBdkMsRUFBNkMsU0FBN0MsQ0FBM0IsQ0FMaUIsQ0FPakI7O0FBQ0EsVUFBTSxPQUFPLEdBQUcsNkJBQVUsUUFBVixFQUFvQjtBQUFFLFlBQU0sU0FBUjtBQUFtQixlQUFTO0FBQTVCLEtBQXBCLEVBQXVFLFVBQXZFLENBQWhCO0FBQ0EsVUFBTSxRQUFRLEdBQUcsNkJBQVUsUUFBVixFQUFvQjtBQUFFLFlBQU0sVUFBUjtBQUFvQixlQUFTO0FBQTdCLEtBQXBCLEVBQXdFLFdBQXhFLENBQWpCO0FBQ0EsVUFBTSxVQUFVLEdBQUcsNkJBQVUsUUFBVixFQUFvQjtBQUFFLFlBQU0sWUFBUjtBQUFzQixlQUFTO0FBQS9CLEtBQXBCLEVBQXlFLGFBQXpFLENBQW5CO0FBQ0EsVUFBTSxXQUFXLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLFlBQU0sY0FBUjtBQUF3QixlQUFTO0FBQWpDLEtBQWpCLEVBQTBFLElBQTFFLEVBQWdGLE9BQWhGLEVBQXlGLFFBQXpGLEVBQW1HLFVBQW5HLENBQXBCO0FBQ0EsVUFBTSxnQkFBZ0IsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQTRDLElBQTVDLEVBQWtELFdBQWxELENBQXpCO0FBQ0EsVUFBTSxtQkFBbUIsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQXVDLElBQXZDLEVBQTZDLGdCQUE3QyxDQUE1QixDQWJpQixDQWVqQjs7QUFDQSxVQUFNLG1CQUFtQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBNEMsbUJBQTVDLENBQTVCO0FBQ0EsVUFBTSxjQUFjLEdBQUcsNkJBQVUsT0FBVixFQUFtQjtBQUFFLFlBQU0sZ0JBQVI7QUFBMEIsZUFBUyxrQkFBbkM7QUFBdUQscUJBQWU7QUFBdEUsS0FBbkIsQ0FBdkI7QUFDQSxVQUFNLGFBQWEsR0FBRyw2QkFBVSxRQUFWLEVBQW9CLEVBQXBCLEVBQXdCLFVBQXhCLENBQXRCO0FBQ0EsVUFBTSxhQUFhLEdBQUcsNkJBQVUsUUFBVixFQUFvQixFQUFwQixFQUF3QixRQUF4QixDQUF0QjtBQUNBLFVBQU0sWUFBWSxHQUFHLDZCQUFVLFFBQVYsRUFBb0I7QUFBRSxZQUFNLGFBQVI7QUFBdUIsZUFBUztBQUFoQyxLQUFwQixFQUFnRSxJQUFoRSxFQUFzRSxhQUF0RSxFQUFxRixhQUFyRixDQUFyQjtBQUNBLFVBQU0sa0JBQWtCLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUF3QyxJQUF4QyxFQUE4QyxZQUE5QyxDQUEzQjtBQUNBLFVBQU0sYUFBYSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBb0QsSUFBcEQsRUFBMEQsa0JBQTFELENBQXRCO0FBQ0EsVUFBTSxXQUFXLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUE0QyxJQUE1QyxFQUFrRCxtQkFBbEQsRUFBdUUsY0FBdkUsRUFBdUYsYUFBdkYsQ0FBcEI7QUFDQSxVQUFNLG9CQUFvQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBdUMsSUFBdkMsRUFBNkMsV0FBN0MsQ0FBN0IsQ0F4QmlCLENBMEJqQjtBQUNBO0FBQ0E7O0FBQ0EsVUFBTSxVQUFVLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLFlBQU0sV0FBUjtBQUFxQixhQUFPLCtDQUE1QjtBQUE2RSxhQUFPLGFBQXBGO0FBQW1HLGVBQVM7QUFBNUcsS0FBakIsQ0FBbkI7QUFDQSxVQUFNLG9CQUFvQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxZQUFNLGNBQVI7QUFBd0IsYUFBTywrQ0FBL0I7QUFBZ0YsYUFBTyxhQUF2RjtBQUFzRyxlQUFTO0FBQS9HLEtBQWpCLENBQTdCO0FBQ0EsVUFBTSxnQkFBZ0IsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsWUFBTSxrQkFBUjtBQUE0QixlQUFTO0FBQXJDLEtBQWpCLEVBQTRELElBQTVELEVBQWtFLG9CQUFsRSxFQUF3RixVQUF4RixDQUF6QjtBQUNBLFVBQU0sVUFBVSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBNEMsSUFBNUMsRUFBa0QsZ0JBQWxELENBQW5CO0FBQ0EsVUFBTSxTQUFTLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLFlBQU0sVUFBUjtBQUFvQixhQUFPLHdDQUEzQjtBQUFxRSxhQUFPLGFBQTVFO0FBQTJGLGVBQVM7QUFBcEcsS0FBakIsQ0FBbEI7QUFDQSxVQUFNLGVBQWUsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsWUFBTSxpQkFBUjtBQUEyQixlQUFTO0FBQXBDLEtBQWpCLEVBQWdFLElBQWhFLEVBQXNFLFNBQXRFLENBQXhCO0FBQ0EsVUFBTSxTQUFTLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUE0QyxJQUE1QyxFQUFrRCxlQUFsRCxDQUFsQjtBQUNBLFVBQU0sd0JBQXdCLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUF1QyxJQUF2QyxFQUE2QyxVQUE3QyxFQUF5RCxTQUF6RCxDQUFqQyxDQXBDaUIsQ0FzQ2pCOztBQUNBLFVBQU0sbUJBQW1CLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUErQyxJQUEvQyxFQUFxRCxrQkFBckQsRUFBeUUsbUJBQXpFLEVBQThGLG9CQUE5RixFQUFvSCx3QkFBcEgsQ0FBNUIsQ0F2Q2lCLENBeUNqQjs7QUFDQSxJQUFBLE9BQU8sQ0FBQyxXQUFSLENBQW9CLG1CQUFwQjtBQUNELEdBeERjOztBQTBEZixFQUFBLGdCQUFnQixHQUFHO0FBQ2pCO0FBRUE7QUFDQSxVQUFNLFNBQVMsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQXVELGlCQUF2RCxDQUFsQjtBQUNBLFVBQU0sY0FBYyxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBdUMsSUFBdkMsRUFBNkMsU0FBN0MsQ0FBdkIsQ0FMaUIsQ0FPakI7QUFFQTs7QUFDQSxVQUFNLFdBQVcsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsWUFBTSxNQUFSO0FBQWdCLGVBQVM7QUFBekIsS0FBakIsRUFBc0QsS0FBdEQsQ0FBcEI7QUFDQSxVQUFNLGtCQUFrQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBeUMsSUFBekMsRUFBK0MsV0FBL0MsQ0FBM0I7QUFDQSxVQUFNLFdBQVcsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsWUFBTSxNQUFSO0FBQWdCLGVBQVM7QUFBekIsS0FBakIsRUFBMEUsS0FBMUUsQ0FBcEI7QUFDQSxVQUFNLGtCQUFrQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBeUMsSUFBekMsRUFBK0MsV0FBL0MsQ0FBM0I7QUFDQSxVQUFNLFdBQVcsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsWUFBTSxNQUFSO0FBQWdCLGVBQVM7QUFBekIsS0FBakIsRUFBc0QsS0FBdEQsQ0FBcEI7QUFDQSxVQUFNLGtCQUFrQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBeUMsSUFBekMsRUFBK0MsV0FBL0MsQ0FBM0I7QUFDQSxVQUFNLG1CQUFtQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBa0QsSUFBbEQsRUFBd0Qsa0JBQXhELEVBQTRFLGtCQUE1RSxFQUFnRyxrQkFBaEcsQ0FBNUI7QUFDQSxVQUFNLHVCQUF1QixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBNEMsSUFBNUMsRUFBa0QsbUJBQWxELENBQWhDLENBakJpQixDQW1CakI7O0FBQ0EsVUFBTSxXQUFXLEdBQUcsNkJBQVUsUUFBVixFQUFvQixFQUFwQixFQUF3QixRQUF4QixDQUFwQjtBQUNBLFVBQU0sV0FBVyxHQUFHLDZCQUFVLFFBQVYsRUFBb0IsRUFBcEIsRUFBd0IsYUFBeEIsQ0FBcEI7QUFDQSxVQUFNLFVBQVUsR0FBRyw2QkFBVSxRQUFWLEVBQW9CO0FBQUUsWUFBTSxlQUFSO0FBQXlCLGVBQVM7QUFBbEMsS0FBcEIsRUFBa0UsSUFBbEUsRUFBd0UsV0FBeEUsRUFBcUYsV0FBckYsQ0FBbkI7QUFDQSxVQUFNLGdCQUFnQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBd0MsSUFBeEMsRUFBOEMsVUFBOUMsQ0FBekI7QUFDQSxVQUFNLFdBQVcsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQW9ELElBQXBELEVBQTBELGdCQUExRCxDQUFwQixDQXhCaUIsQ0EwQmpCOztBQUNBLFVBQU0sV0FBVyxHQUFHLDZCQUFVLFFBQVYsRUFBb0IsRUFBcEIsRUFBd0IsYUFBeEIsQ0FBcEI7QUFDQSxVQUFNLFdBQVcsR0FBRyw2QkFBVSxRQUFWLEVBQW9CLEVBQXBCLEVBQXdCLFdBQXhCLENBQXBCO0FBQ0EsVUFBTSxVQUFVLEdBQUcsNkJBQVUsUUFBVixFQUFvQjtBQUFFLFlBQU0sV0FBUjtBQUFxQixlQUFTO0FBQTlCLEtBQXBCLEVBQThELElBQTlELEVBQW9FLFdBQXBFLEVBQWlGLFdBQWpGLENBQW5CO0FBQ0EsVUFBTSxnQkFBZ0IsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQXdDLElBQXhDLEVBQThDLFVBQTlDLENBQXpCO0FBQ0EsVUFBTSxXQUFXLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUFvRCxJQUFwRCxFQUEwRCxnQkFBMUQsQ0FBcEIsQ0EvQmlCLENBaUNqQjs7QUFDQSxVQUFNLGVBQWUsR0FBRyw2QkFBVSxRQUFWLEVBQW9CLEVBQXBCLEVBQXdCLGFBQXhCLENBQXhCO0FBQ0EsVUFBTSxlQUFlLEdBQUcsNkJBQVUsUUFBVixFQUFvQixFQUFwQixFQUF3QixVQUF4QixDQUF4QjtBQUNBLFVBQU0sY0FBYyxHQUFHLDZCQUFVLFFBQVYsRUFBb0I7QUFBRSxZQUFNLGVBQVI7QUFBeUIsZUFBUztBQUFsQyxLQUFwQixFQUFrRSxJQUFsRSxFQUF3RSxlQUF4RSxFQUF5RixlQUF6RixDQUF2QjtBQUNBLFVBQU0sb0JBQW9CLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUF3QyxJQUF4QyxFQUE4QyxjQUE5QyxDQUE3QjtBQUNBLFVBQU0sZUFBZSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBb0QsSUFBcEQsRUFBMEQsb0JBQTFELENBQXhCLENBdENpQixDQXdDakI7QUFFQTtBQUNBOztBQUNBLFVBQU0scUJBQXFCLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUE0QyxvQkFBNUMsQ0FBOUI7QUFDQSxVQUFNLGdCQUFnQixHQUFHLDZCQUFVLE9BQVYsRUFBbUI7QUFBRSxZQUFNLGtCQUFSO0FBQTRCLGVBQVMsT0FBckM7QUFBOEMsY0FBUSxRQUF0RDtBQUFnRSxxQkFBZTtBQUEvRSxLQUFuQixDQUF6QjtBQUNBLFVBQU0sa0JBQWtCLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUFvRCxJQUFwRCxFQUEwRCxnQkFBMUQsQ0FBM0I7QUFDQSxVQUFNLG1CQUFtQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBNEMsa0JBQTVDLENBQTVCO0FBQ0EsVUFBTSxjQUFjLEdBQUcsNkJBQVUsT0FBVixFQUFtQjtBQUFFLFlBQU0sZ0JBQVI7QUFBMEIsZUFBUyxPQUFuQztBQUE0QyxjQUFRLFFBQXBEO0FBQThELHFCQUFlO0FBQTdFLEtBQW5CLENBQXZCO0FBQ0EsVUFBTSxnQkFBZ0IsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQW9ELElBQXBELEVBQTBELGNBQTFELENBQXpCO0FBQ0EsVUFBTSxtQkFBbUIsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQTRDLElBQTVDLEVBQWtELHFCQUFsRCxFQUF5RSxrQkFBekUsRUFBNkYsbUJBQTdGLEVBQWtILGdCQUFsSCxDQUE1QixDQWxEaUIsQ0FvRGpCOztBQUNBLFVBQU0sZ0JBQWdCLEdBQUcsNkJBQVUsUUFBVixFQUFvQjtBQUFFLFlBQU0sY0FBUjtBQUF3QixlQUFTO0FBQWpDLEtBQXBCLEVBQTJFLG9CQUEzRSxDQUF6QjtBQUNBLFVBQU0sUUFBUSxHQUFHLDZCQUFVLFFBQVYsRUFBb0I7QUFBRSxZQUFNLFVBQVI7QUFBb0IsZUFBUztBQUE3QixLQUFwQixFQUF3RSxXQUF4RSxDQUFqQjtBQUNBLFVBQU0sbUJBQW1CLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUFvRCxJQUFwRCxFQUEwRCxRQUExRCxFQUFvRSxnQkFBcEUsQ0FBNUI7QUFDQSxVQUFNLG1CQUFtQixHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBNkMsSUFBN0MsRUFBbUQsbUJBQW5ELENBQTVCLENBeERpQixDQTBEakI7O0FBQ0EsVUFBTSxnQkFBZ0IsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQXVDLElBQXZDLEVBQTZDLHVCQUE3QyxFQUFzRSxXQUF0RSxFQUFtRixXQUFuRixFQUFnRyxlQUFoRyxDQUF6QjtBQUNBLFVBQU0sbUJBQW1CLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUF1QyxJQUF2QyxFQUE2QyxtQkFBN0MsRUFBa0UsbUJBQWxFLENBQTVCO0FBQ0EsVUFBTSxtQkFBbUIsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQStDLElBQS9DLEVBQXFELGNBQXJELEVBQXFFLGdCQUFyRSxFQUF1RixtQkFBdkYsQ0FBNUI7QUFDQSxJQUFBLE9BQU8sQ0FBQyxXQUFSLENBQW9CLG1CQUFwQjtBQUNELEdBekhjOztBQTJIZixFQUFBLG9CQUFvQixHQUFHO0FBRXJCO0FBQ0EsVUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsU0FBeEIsQ0FBcEI7QUFDQSxVQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixVQUF4QixDQUFyQjtBQUNBLFVBQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFlBQXhCLENBQXZCO0FBQ0EsVUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixjQUF4QixDQUF6QjtBQUNBLFVBQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFVBQXhCLENBQXJCO0FBQ0EsVUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBaEI7QUFDQSxVQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixNQUF4QixDQUFoQjtBQUNBLFVBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLE1BQXhCLENBQWhCO0FBQ0EsVUFBTSxZQUFZLEdBQUcsQ0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixPQUFuQixDQUFyQixDQVhxQixDQWFyQjs7QUFDQSxJQUFBLFdBQVcsQ0FBQyxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxrQkFBUyxhQUEvQztBQUNBLElBQUEsWUFBWSxDQUFDLGdCQUFiLENBQThCLE9BQTlCLEVBQXVDLGtCQUFTLFFBQWhEO0FBQ0EsSUFBQSxjQUFjLENBQUMsZ0JBQWYsQ0FBZ0MsT0FBaEMsRUFBeUMsa0JBQVMsVUFBbEQ7QUFDQSxJQUFBLFlBQVksQ0FBQyxnQkFBYixDQUE4QixPQUE5QixFQUF1QyxrQkFBUyxRQUFoRDtBQUNBLElBQUEsWUFBWSxDQUFDLE9BQWIsQ0FBcUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixPQUFyQixFQUE4QixrQkFBUyxvQkFBdkMsQ0FBNUI7QUFDQSxJQUFBLGdCQUFnQixDQUFDLGdCQUFqQixDQUFrQyxPQUFsQyxFQUEyQyxrQkFBUyxZQUFwRDtBQUVEOztBQWhKYyxDQUFqQjtlQW9KZSxROzs7Ozs7Ozs7OztBQzFKZjs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGtCQUF4QixDQUFoQjtBQUNBLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFlBQXhCLENBQW5CO0FBRUEsTUFBTSxhQUFhLEdBQUc7QUFFcEI7QUFDQSxFQUFBLFNBQVMsR0FBRztBQUNWLFVBQU0sbUJBQW1CLEdBQUcsNkJBQVUsT0FBVixFQUFtQjtBQUFFLFlBQU0sZUFBUjtBQUF5QixlQUFTLE9BQWxDO0FBQTJDLGNBQVEsTUFBbkQ7QUFBMkQscUJBQWU7QUFBMUUsS0FBbkIsQ0FBNUI7QUFDQSxVQUFNLG1CQUFtQixHQUFHLDZCQUFVLE9BQVYsRUFBbUI7QUFBRSxZQUFNLGVBQVI7QUFBeUIsZUFBUyxPQUFsQztBQUEyQyxjQUFRLFVBQW5EO0FBQStELHFCQUFlO0FBQTlFLEtBQW5CLENBQTVCO0FBQ0EsVUFBTSxXQUFXLEdBQUcsNkJBQVUsUUFBVixFQUFvQjtBQUFFLFlBQU0sVUFBUjtBQUFvQixlQUFTO0FBQTdCLEtBQXBCLEVBQXFFLFdBQXJFLENBQXBCO0FBQ0EsVUFBTSxTQUFTLEdBQUcsNkJBQVUsTUFBVixFQUFrQjtBQUFFLFlBQU0sV0FBUjtBQUFxQixlQUFTO0FBQTlCLEtBQWxCLEVBQXlELElBQXpELEVBQStELG1CQUEvRCxFQUFvRixtQkFBcEYsRUFBeUcsV0FBekcsQ0FBbEI7QUFFQSxJQUFBLE9BQU8sQ0FBQyxTQUFSLEdBQW9CLElBQXBCO0FBQ0EsSUFBQSxPQUFPLENBQUMsV0FBUixDQUFvQixTQUFwQjtBQUNBLFNBQUssZ0JBQUw7QUFDRCxHQVptQjs7QUFjcEIsRUFBQSxVQUFVLEdBQUc7QUFDWCxVQUFNLGdCQUFnQixHQUFHLDZCQUFVLE9BQVYsRUFBbUI7QUFBRSxZQUFNLFdBQVI7QUFBcUIsZUFBUyxPQUE5QjtBQUF1QyxjQUFRLE1BQS9DO0FBQXVELHFCQUFlO0FBQXRFLEtBQW5CLENBQXpCO0FBQ0EsVUFBTSxvQkFBb0IsR0FBRyw2QkFBVSxPQUFWLEVBQW1CO0FBQUUsWUFBTSxlQUFSO0FBQXlCLGVBQVMsT0FBbEM7QUFBMkMsY0FBUSxNQUFuRDtBQUEyRCxxQkFBZTtBQUExRSxLQUFuQixDQUE3QjtBQUNBLFVBQU0sb0JBQW9CLEdBQUcsNkJBQVUsT0FBVixFQUFtQjtBQUFFLFlBQU0sZUFBUjtBQUF5QixlQUFTLE9BQWxDO0FBQTJDLGNBQVEsTUFBbkQ7QUFBMkQscUJBQWU7QUFBMUUsS0FBbkIsQ0FBN0I7QUFDQSxVQUFNLG1CQUFtQixHQUFHLDZCQUFVLE9BQVYsRUFBbUI7QUFBRSxZQUFNLGlCQUFSO0FBQTJCLGVBQVMsT0FBcEM7QUFBNkMsY0FBUSxNQUFyRDtBQUE2RCxxQkFBZTtBQUE1RSxLQUFuQixDQUE1QjtBQUNBLFVBQU0sWUFBWSxHQUFHLDZCQUFVLFFBQVYsRUFBb0I7QUFBRSxZQUFNLFdBQVI7QUFBcUIsZUFBUztBQUE5QixLQUFwQixFQUFzRSxhQUF0RSxDQUFyQjtBQUNBLFVBQU0sVUFBVSxHQUFHLDZCQUFVLE1BQVYsRUFBa0I7QUFBRSxZQUFNLFlBQVI7QUFBc0IsZUFBUztBQUEvQixLQUFsQixFQUEwRCxJQUExRCxFQUFnRSxnQkFBaEUsRUFBa0Ysb0JBQWxGLEVBQXdHLG9CQUF4RyxFQUE4SCxtQkFBOUgsRUFBbUosWUFBbkosQ0FBbkI7QUFFQSxJQUFBLE9BQU8sQ0FBQyxTQUFSLEdBQW9CLElBQXBCO0FBQ0EsSUFBQSxPQUFPLENBQUMsV0FBUixDQUFvQixVQUFwQjtBQUNBLFNBQUssZ0JBQUw7QUFDRCxHQXpCbUI7O0FBMkJwQjtBQUNBLEVBQUEsZ0JBQWdCLEdBQUc7QUFDakIsVUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsVUFBeEIsQ0FBakI7QUFDQSxVQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixXQUF4QixDQUFsQjs7QUFDQSxRQUFJLFFBQVEsS0FBSyxJQUFqQixFQUF1QjtBQUNyQixNQUFBLFNBQVMsQ0FBQyxnQkFBVixDQUEyQixPQUEzQixFQUFvQyxLQUFLLFVBQXpDLEVBQXFELEtBQXJEO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsTUFBQSxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBbUMsS0FBSyxTQUF4QyxFQUFtRCxLQUFuRDtBQUNEO0FBQ0YsR0FwQ21COztBQXNDcEI7QUFDQSxFQUFBLFNBQVMsQ0FBQyxDQUFELEVBQUk7QUFDWCxJQUFBLENBQUMsQ0FBQyxjQUFGO0FBQ0EsVUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsZUFBeEIsRUFBeUMsS0FBMUQ7QUFDQSxVQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixlQUF4QixFQUF5QyxLQUExRDs7QUFDQSxRQUFJLFFBQVEsS0FBSyxFQUFqQixFQUFxQjtBQUNuQjtBQUNELEtBRkQsTUFFTyxJQUFJLFFBQVEsS0FBSyxFQUFqQixFQUFxQjtBQUMxQjtBQUNELEtBRk0sTUFFQTtBQUNMLG1CQUFJLE1BQUosQ0FBVyxPQUFYLEVBQW9CLElBQXBCLENBQXlCLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTixDQUFjLElBQUksSUFBSTtBQUN0RDtBQUNBLFlBQUksSUFBSSxDQUFDLFFBQUwsQ0FBYyxXQUFkLE9BQWdDLFFBQVEsQ0FBQyxXQUFULEVBQXBDLEVBQTREO0FBQzFELGNBQUksSUFBSSxDQUFDLFFBQUwsS0FBa0IsUUFBdEIsRUFBZ0M7QUFDOUIsWUFBQSxhQUFhLENBQUMsaUJBQWQsQ0FBZ0MsSUFBaEM7QUFDRCxXQUZELE1BRU87QUFDTDtBQUNEO0FBQ0Y7QUFDRixPQVRpQyxDQUFsQztBQVVEO0FBQ0YsR0EzRG1COztBQTZEcEIsRUFBQSxVQUFVLENBQUMsQ0FBRCxFQUFJO0FBQ1osSUFBQSxDQUFDLENBQUMsY0FBRjtBQUNBLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUFaO0FBQ0EsVUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEIsRUFBcUMsS0FBbkQ7QUFDQSxVQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixlQUF4QixFQUF5QyxLQUEzRDtBQUNBLFVBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGVBQXhCLEVBQXlDLEtBQTNEO0FBQ0EsVUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsaUJBQXhCLEVBQTJDLEtBQTNEO0FBQ0EsUUFBSSxjQUFjLEdBQUcsSUFBckIsQ0FQWSxDQU9lOztBQUMzQixRQUFJLEtBQUssS0FBSyxFQUFkLEVBQWtCO0FBQ2hCO0FBQ0QsS0FGRCxNQUVPLElBQUksU0FBUyxLQUFLLEVBQWxCLEVBQXNCO0FBQzNCO0FBQ0QsS0FGTSxNQUVBLElBQUksU0FBUyxLQUFLLEVBQWxCLEVBQXNCO0FBQzNCO0FBQ0QsS0FGTSxNQUVBLElBQUksT0FBTyxLQUFLLEVBQWhCLEVBQW9CO0FBQ3pCO0FBQ0QsS0FGTSxNQUVBLElBQUksU0FBUyxLQUFLLE9BQWxCLEVBQTJCO0FBQ2hDO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsbUJBQUksTUFBSixDQUFXLE9BQVgsRUFBb0IsSUFBcEIsQ0FBeUIsS0FBSyxJQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBQyxJQUFELEVBQU8sR0FBUCxLQUFlO0FBQzdEO0FBQ0EsWUFBSSxJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQsT0FBZ0MsU0FBUyxDQUFDLFdBQVYsRUFBcEMsRUFBNkQ7QUFDM0QsVUFBQSxjQUFjLEdBQUcsS0FBakI7QUFDRCxTQUo0RCxDQUs3RDs7O0FBQ0EsWUFBSSxHQUFHLEtBQUssS0FBSyxDQUFDLE1BQU4sR0FBZSxDQUF2QixJQUE0QixjQUFoQyxFQUFnRDtBQUM5QyxjQUFJLE9BQU8sR0FBRztBQUNaLFlBQUEsSUFBSSxFQUFFLEtBRE07QUFFWixZQUFBLFFBQVEsRUFBRSxTQUZFO0FBR1osWUFBQSxRQUFRLEVBQUU7QUFIRSxXQUFkOztBQUtBLHVCQUFJLFFBQUosQ0FBYSxPQUFiLEVBQXNCLE9BQXRCLEVBQStCLElBQS9CLENBQW9DLElBQUksSUFBSTtBQUMxQyxZQUFBLGFBQWEsQ0FBQyxpQkFBZCxDQUFnQyxJQUFoQztBQUNELFdBRkQ7QUFHRDtBQUNGLE9BaEJpQyxDQUFsQztBQWlCRDtBQUNGLEdBbEdtQjs7QUFvR3BCLEVBQUEsaUJBQWlCLENBQUMsSUFBRCxFQUFPO0FBQ3RCLElBQUEsY0FBYyxDQUFDLE9BQWYsQ0FBdUIsY0FBdkIsRUFBdUMsSUFBSSxDQUFDLEVBQTVDO0FBQ0EsSUFBQSxPQUFPLENBQUMsU0FBUixHQUFvQixJQUFwQjtBQUNBLElBQUEsVUFBVSxDQUFDLFNBQVgsR0FBdUIsSUFBdkI7O0FBQ0Esb0JBQU8sY0FBUCxDQUFzQixJQUF0QixFQUpzQixDQUlPOztBQUM5QixHQXpHbUI7O0FBMkdwQixFQUFBLFVBQVUsR0FBRztBQUNYLElBQUEsY0FBYyxDQUFDLFVBQWYsQ0FBMEIsY0FBMUI7QUFDQSxJQUFBLE9BQU8sQ0FBQyxTQUFSLEdBQW9CLElBQXBCO0FBQ0EsSUFBQSxVQUFVLENBQUMsU0FBWCxHQUF1QixJQUF2Qjs7QUFDQSxvQkFBTyxjQUFQLENBQXNCLEtBQXRCLEVBSlcsQ0FJbUI7O0FBQy9COztBQWhIbUIsQ0FBdEI7ZUFvSGUsYTs7Ozs7O0FDM0hmOztBQUNBOzs7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0EsZ0JBQU8sY0FBUCxDQUFzQixJQUF0Qjs7QUFDQSxrQkFBUyxZQUFUOzs7Ozs7Ozs7O0FDWEE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixZQUF4QixDQUFuQjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQSxNQUFNLE1BQU0sR0FBRztBQUViLEVBQUEsY0FBYyxDQUFDLGVBQUQsRUFBa0I7QUFFOUI7QUFDQSxVQUFNLE9BQU8sR0FBRyw2QkFBVSxHQUFWLEVBQWU7QUFBRSxlQUFTO0FBQVgsS0FBZixFQUE4QyxPQUE5QyxDQUFoQjtBQUNBLFVBQU0sT0FBTyxHQUFHLDZCQUFVLEdBQVYsRUFBZTtBQUFFLGVBQVM7QUFBWCxLQUFmLEVBQThDLFNBQTlDLENBQWhCO0FBQ0EsVUFBTSxlQUFlLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUF5QyxJQUF6QyxFQUErQyxPQUEvQyxFQUF3RCxPQUF4RCxDQUF4QjtBQUNBLFVBQU0sU0FBUyxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFTO0FBQVgsS0FBakIsRUFBNkMsSUFBN0MsRUFBbUQsZUFBbkQsQ0FBbEI7QUFDQSxVQUFNLFNBQVMsR0FBRyw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsZUFBUztBQUFYLEtBQWpCLEVBQTRDLElBQTVDLEVBQWtELFNBQWxELENBQWxCO0FBQ0EsVUFBTSxXQUFXLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixDQUFwQjtBQUNBLFVBQU0sVUFBVSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxZQUFNLFlBQVI7QUFBc0IsZUFBUztBQUEvQixLQUFqQixFQUFpRSxJQUFqRSxFQUF1RSxXQUF2RSxFQUFvRixTQUFwRixDQUFuQixDQVQ4QixDQVc5Qjs7QUFDQSxVQUFNLGVBQWUsR0FBRyw2QkFBVSxNQUFWLEVBQWtCO0FBQUUscUJBQWU7QUFBakIsS0FBbEIsQ0FBeEI7QUFDQSxVQUFNLGVBQWUsR0FBRyw2QkFBVSxNQUFWLEVBQWtCO0FBQUUscUJBQWU7QUFBakIsS0FBbEIsQ0FBeEI7QUFDQSxVQUFNLGVBQWUsR0FBRyw2QkFBVSxNQUFWLEVBQWtCO0FBQUUscUJBQWU7QUFBakIsS0FBbEIsQ0FBeEI7QUFDQSxVQUFNLGlCQUFpQixHQUFHLDZCQUFVLEdBQVYsRUFBZTtBQUFFLGNBQVEsUUFBVjtBQUFvQixlQUFTLHNCQUE3QjtBQUFxRCxvQkFBYyxNQUFuRTtBQUEyRSx1QkFBaUIsT0FBNUY7QUFBcUcscUJBQWU7QUFBcEgsS0FBZixFQUFtSixJQUFuSixFQUF5SixlQUF6SixFQUEwSyxlQUExSyxFQUEyTCxlQUEzTCxDQUExQjtBQUNBLFVBQU0saUJBQWlCLEdBQUcsNkJBQVUsR0FBVixFQUFlO0FBQUUsZUFBUyxhQUFYO0FBQTBCLGNBQVE7QUFBbEMsS0FBZixFQUF3RCxJQUF4RCxFQUE4RCw2QkFBVSxLQUFWLEVBQWlCO0FBQUUsYUFBTyxzQkFBVDtBQUFpQyxlQUFTLEtBQTFDO0FBQWlELGdCQUFVO0FBQTNELEtBQWpCLENBQTlELENBQTFCO0FBQ0EsVUFBTSxXQUFXLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVM7QUFBWCxLQUFqQixFQUE4QyxJQUE5QyxFQUFvRCxpQkFBcEQsRUFBdUUsaUJBQXZFLENBQXBCLENBakI4QixDQW1COUI7O0FBQ0EsVUFBTSxHQUFHLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGVBQVMsUUFBWDtBQUFxQixjQUFRLFlBQTdCO0FBQTJDLG9CQUFjO0FBQXpELEtBQWpCLEVBQStGLElBQS9GLEVBQXFHLFdBQXJHLEVBQWtILFVBQWxILENBQVosQ0FwQjhCLENBc0I5Qjs7QUFDQSxRQUFJLGVBQUosRUFBcUI7QUFDbkI7QUFDQSxZQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsVUFBaEIsQ0FBMkIsQ0FBM0IsQ0FBZjtBQUNBLFlBQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxVQUFoQixDQUEyQixDQUEzQixDQUFkO0FBQ0EsTUFBQSxlQUFlLENBQUMsV0FBaEIsQ0FBNEIsTUFBNUI7QUFDQSxNQUFBLGVBQWUsQ0FBQyxXQUFoQixDQUE0QixLQUE1QixFQUxtQixDQU1uQjs7QUFDQSxZQUFNLE9BQU8sR0FBRyw2QkFBVSxHQUFWLEVBQWU7QUFBRSxpQkFBUztBQUFYLE9BQWYsRUFBOEMsUUFBOUMsQ0FBaEI7QUFDQSxNQUFBLGVBQWUsQ0FBQyxXQUFoQixDQUE0QixPQUE1QixFQVJtQixDQVVuQjs7QUFDQSxZQUFNLGFBQWEsR0FBRyw2QkFBVSxHQUFWLEVBQWU7QUFBRSxpQkFBUztBQUFYLE9BQWYsRUFBMkMsU0FBM0MsQ0FBdEI7QUFDQSxZQUFNLGFBQWEsR0FBRyw2QkFBVSxHQUFWLEVBQWU7QUFBRSxpQkFBUztBQUFYLE9BQWYsRUFBMkMsVUFBM0MsQ0FBdEI7QUFDQSxZQUFNLGFBQWEsR0FBRyw2QkFBVSxHQUFWLEVBQWU7QUFBRSxpQkFBUztBQUFYLE9BQWYsRUFBMkMsVUFBM0MsQ0FBdEI7QUFDQSxZQUFNLGFBQWEsR0FBRyw2QkFBVSxHQUFWLEVBQWU7QUFBRSxpQkFBUztBQUFYLE9BQWYsRUFBMkMsYUFBM0MsQ0FBdEI7QUFDQSxNQUFBLFdBQVcsQ0FBQyxXQUFaLENBQXdCLGFBQXhCO0FBQ0EsTUFBQSxXQUFXLENBQUMsV0FBWixDQUF3QixhQUF4QjtBQUNBLE1BQUEsV0FBVyxDQUFDLFdBQVosQ0FBd0IsYUFBeEI7QUFDQSxNQUFBLFdBQVcsQ0FBQyxXQUFaLENBQXdCLGFBQXhCO0FBQ0QsS0ExQzZCLENBNEM5Qjs7O0FBQ0EsU0FBSyxrQkFBTCxDQUF3QixHQUF4QixFQTdDOEIsQ0ErQzlCOztBQUNBLElBQUEsVUFBVSxDQUFDLFdBQVgsQ0FBdUIsR0FBdkI7QUFFRCxHQXBEWTs7QUFzRGIsRUFBQSxrQkFBa0IsQ0FBQyxHQUFELEVBQU07QUFDdEIsSUFBQSxHQUFHLENBQUMsZ0JBQUosQ0FBcUIsT0FBckIsRUFBOEIsS0FBSyxZQUFuQyxFQUFpRCxLQUFqRDtBQUNBLElBQUEsR0FBRyxDQUFDLGdCQUFKLENBQXFCLE9BQXJCLEVBQThCLEtBQUssYUFBbkMsRUFBa0QsS0FBbEQ7QUFDQSxJQUFBLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixPQUFyQixFQUE4QixLQUFLLGFBQW5DLEVBQWtELEtBQWxEO0FBQ0EsSUFBQSxHQUFHLENBQUMsZ0JBQUosQ0FBcUIsT0FBckIsRUFBOEIsS0FBSyxjQUFuQyxFQUFtRCxLQUFuRDtBQUNBLElBQUEsR0FBRyxDQUFDLGdCQUFKLENBQXFCLE9BQXJCLEVBQThCLEtBQUssZUFBbkMsRUFBb0QsS0FBcEQ7QUFDRCxHQTVEWTs7QUE4RGIsRUFBQSxZQUFZLENBQUMsQ0FBRCxFQUFJO0FBQ2QsUUFBSSxDQUFDLENBQUMsTUFBRixDQUFTLFdBQVQsS0FBeUIsT0FBN0IsRUFBc0M7QUFDcEMscUJBQWMsU0FBZDtBQUNEO0FBQ0YsR0FsRVk7O0FBb0ViLEVBQUEsYUFBYSxDQUFDLENBQUQsRUFBSTtBQUNmLFFBQUksQ0FBQyxDQUFDLE1BQUYsQ0FBUyxXQUFULEtBQXlCLFNBQTdCLEVBQXdDO0FBQ3RDLHFCQUFjLFVBQWQ7QUFDRDtBQUNGLEdBeEVZOztBQTBFYixFQUFBLGFBQWEsQ0FBQyxDQUFELEVBQUk7QUFDZixRQUFJLENBQUMsQ0FBQyxNQUFGLENBQVMsV0FBVCxLQUF5QixRQUE3QixFQUF1QztBQUNyQyxxQkFBYyxVQUFkO0FBQ0Q7QUFDRixHQTlFWTs7QUFnRmIsRUFBQSxjQUFjLENBQUMsQ0FBRCxFQUFJO0FBQ2hCLFFBQUksQ0FBQyxDQUFDLE1BQUYsQ0FBUyxXQUFULEtBQXlCLFNBQTdCLEVBQXdDO0FBQ3RDLHVCQUFRLFdBQVI7QUFDRDtBQUNGLEdBcEZZOztBQXNGYixFQUFBLGVBQWUsQ0FBQyxDQUFELEVBQUk7QUFDakIsUUFBSSxDQUFDLENBQUMsTUFBRixDQUFTLFdBQVQsS0FBeUIsVUFBN0IsRUFBeUM7QUFDdkMsd0JBQVMsWUFBVDs7QUFDQSx3QkFBUyx3QkFBVDtBQUNEO0FBQ0Y7O0FBM0ZZLENBQWY7ZUErRmUsTTs7Ozs7Ozs7Ozs7QUN4SGY7O0FBQ0E7Ozs7QUFFQSxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixrQkFBeEIsQ0FBaEI7QUFFQSxNQUFNLE9BQU8sR0FBRztBQUVkLEVBQUEsV0FBVyxHQUFHO0FBQ1osSUFBQSxPQUFPLENBQUMsU0FBUixHQUFvQixJQUFwQjtBQUNBLFVBQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxPQUFmLENBQXVCLGNBQXZCLENBQXJCOztBQUNBLGlCQUFJLGFBQUosQ0FBa0IsT0FBbEIsRUFBMkIsWUFBM0IsRUFBeUMsSUFBekMsQ0FBOEMsSUFBSSxJQUFJO0FBQ3BELFlBQU0sVUFBVSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFPLG1CQUFUO0FBQThCLGlCQUFTO0FBQXZDLE9BQWpCLENBQW5CO0FBQ0EsWUFBTSxJQUFJLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGlCQUFTO0FBQVgsT0FBakIsRUFBK0MsU0FBUSxJQUFJLENBQUMsSUFBSyxFQUFqRSxDQUFiO0FBQ0EsWUFBTSxRQUFRLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGlCQUFTO0FBQVgsT0FBakIsRUFBK0MsYUFBWSxJQUFJLENBQUMsUUFBUyxFQUF6RSxDQUFqQjtBQUNBLFlBQU0sYUFBYSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxjQUFNLGVBQVI7QUFBeUIsaUJBQVM7QUFBbEMsT0FBakIsRUFBa0UsSUFBbEUsRUFBd0UsVUFBeEUsRUFBb0YsSUFBcEYsRUFBMEYsUUFBMUYsQ0FBdEI7QUFDQSxNQUFBLE9BQU8sQ0FBQyxXQUFSLENBQW9CLGFBQXBCO0FBQ0QsS0FORDtBQU9EOztBQVphLENBQWhCO2VBZ0JlLE87Ozs7Ozs7Ozs7O0FDckJmLE1BQU0sVUFBTixDQUFpQjtBQUNmLE1BQUksTUFBSixDQUFXLE1BQVgsRUFBbUI7QUFDakIsU0FBSyxPQUFMLEdBQWUsTUFBZjtBQUNEOztBQUNELE1BQUksTUFBSixDQUFXLE1BQVgsRUFBbUI7QUFDakIsU0FBSyxPQUFMLEdBQWUsTUFBZjtBQUNEOztBQUNELE1BQUksS0FBSixDQUFVLEtBQVYsRUFBaUI7QUFDZixTQUFLLE1BQUwsR0FBYyxLQUFkO0FBQ0Q7O0FBQ0QsTUFBSSxLQUFKLENBQVUsS0FBVixFQUFpQjtBQUNmLFNBQUssTUFBTCxHQUFjLEtBQWQ7QUFDRDs7QUFDRCxNQUFJLE1BQUosQ0FBVyxhQUFYLEVBQTBCO0FBQ3hCLFNBQUssT0FBTCxHQUFlLGFBQWY7QUFDRDs7QUFDRCxNQUFJLFNBQUosQ0FBYyxTQUFkLEVBQXlCO0FBQ3ZCLFNBQUssVUFBTCxHQUFrQixTQUFsQjtBQUNEOztBQWxCYzs7ZUFxQkYsVTs7Ozs7Ozs7Ozs7QUNyQmY7O0FBQ0E7Ozs7QUFFQSxJQUFJLFdBQVcsR0FBRyxDQUFsQjtBQUNBLElBQUksV0FBVyxHQUFHLEtBQWxCLEMsQ0FBeUI7O0FBQ3pCLElBQUksT0FBTyxHQUFHLFNBQWQ7QUFDQSxJQUFJLFNBQVMsR0FBRyxFQUFoQixDLENBQW9COztBQUNwQixJQUFJLGVBQUosQyxDQUFxQjs7QUFDckIsSUFBSSxrQkFBSixDLENBQXdCOztBQUN4QixJQUFJLGtCQUFKLEMsQ0FBd0I7O0FBQ3hCLElBQUksaUJBQUosQyxDQUF1Qjs7QUFDdkIsSUFBSSxpQkFBSixDLENBQXVCOztBQUV2QixNQUFNLFFBQVEsR0FBRztBQUVmLEVBQUEsd0JBQXdCLEdBQUc7QUFDekI7QUFDQTtBQUNBLElBQUEsV0FBVyxHQUFHLENBQWQ7QUFDQSxJQUFBLFdBQVcsR0FBRyxLQUFkO0FBQ0EsSUFBQSxPQUFPLEdBQUcsU0FBVjtBQUNBLElBQUEsU0FBUyxHQUFHLEVBQVo7QUFDQSxJQUFBLGVBQWUsR0FBRyxTQUFsQjtBQUNBLElBQUEsa0JBQWtCLEdBQUcsU0FBckI7QUFDQSxJQUFBLGtCQUFrQixHQUFHLFNBQXJCO0FBQ0EsSUFBQSxpQkFBaUIsR0FBRyxTQUFwQjtBQUNBLElBQUEsaUJBQWlCLEdBQUcsU0FBcEI7QUFDRCxHQWRjOztBQWdCZixFQUFBLGFBQWEsR0FBRztBQUNkLFVBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFNBQXhCLENBQXBCO0FBQ0EsVUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEIsQ0FBakI7QUFDQSxVQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixVQUF4QixDQUFoQjtBQUNBLElBQUEsT0FBTyxHQUFHLElBQUksa0JBQUosRUFBVixDQUpjLENBTWQ7O0FBQ0EsSUFBQSxRQUFRLENBQUMsc0JBQVQsQ0FBZ0MsSUFBaEM7QUFFQSxJQUFBLFdBQVcsR0FBRyxJQUFkO0FBQ0EsSUFBQSxXQUFXLENBQUMsUUFBWixHQUF1QixJQUF2QjtBQUNBLElBQUEsUUFBUSxDQUFDLGdCQUFULENBQTBCLE9BQTFCLEVBQW1DLFFBQVEsQ0FBQyxjQUE1QztBQUNBLElBQUEsT0FBTyxDQUFDLGdCQUFSLENBQXlCLE9BQXpCLEVBQWtDLFFBQVEsQ0FBQyxjQUEzQyxFQVpjLENBY2Q7QUFDRCxHQS9CYzs7QUFpQ2YsRUFBQSxjQUFjLENBQUMsQ0FBRCxFQUFJO0FBQ2hCO0FBQ0E7QUFDQSxRQUFJLGVBQUo7O0FBQ0EsUUFBSSxDQUFDLENBQUMsTUFBRixDQUFTLEVBQVQsS0FBZ0IsV0FBcEIsRUFBaUM7QUFDL0IsTUFBQSxlQUFlLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0Isa0JBQXhCLENBQWxCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsTUFBQSxlQUFlLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsaUJBQXhCLENBQWxCO0FBQ0QsS0FSZSxDQVNoQjtBQUNBOzs7QUFDQSxVQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBRixHQUFZLGVBQWUsQ0FBQyxXQUE3QixFQUEwQyxPQUExQyxDQUFrRCxDQUFsRCxDQUFELENBQTdCO0FBQ0EsVUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQUYsR0FBWSxlQUFlLENBQUMsWUFBN0IsRUFBMkMsT0FBM0MsQ0FBbUQsQ0FBbkQsQ0FBRCxDQUE3QjtBQUNBLElBQUEsUUFBUSxDQUFDLGdCQUFULENBQTBCLGNBQTFCLEVBQTBDLGNBQTFDLEVBQTBELGVBQTFEO0FBQ0QsR0EvQ2M7O0FBaURmLEVBQUEsZ0JBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxlQUFQLEVBQXdCO0FBQ3RDLFFBQUksUUFBSjs7QUFDQSxRQUFJLGVBQWUsQ0FBQyxFQUFoQixLQUF1QixrQkFBM0IsRUFBK0M7QUFDN0MsTUFBQSxRQUFRLEdBQUcsbUJBQVg7QUFDRCxLQUZELE1BRU87QUFDTCxNQUFBLFFBQVEsR0FBRyxrQkFBWDtBQUNELEtBTnFDLENBT3RDOzs7QUFDQSxRQUFJLGFBQWEsR0FBRyxPQUFPLGVBQWUsQ0FBQyxXQUEzQztBQUNBLFFBQUksYUFBYSxHQUFHLE9BQU8sZUFBZSxDQUFDLFlBQTNDLENBVHNDLENBV3RDOztBQUNBLFFBQUksQ0FBQyxlQUFlLENBQUMsUUFBaEIsQ0FBeUIsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsUUFBeEIsQ0FBekIsQ0FBTCxFQUFrRTtBQUNoRSxXQUFLLGNBQUwsQ0FBb0IsZUFBcEIsRUFBcUMsYUFBckMsRUFBb0QsYUFBcEQsRUFBbUUsUUFBbkUsRUFBNkUsQ0FBN0UsRUFBZ0YsQ0FBaEYsRUFEZ0UsQ0FFaEU7QUFDRCxLQUhELE1BR087QUFDTCxXQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsRUFBMEIsQ0FBMUIsRUFBNkIsQ0FBN0IsRUFBZ0MsYUFBaEMsRUFBK0MsYUFBL0M7QUFDRCxLQWpCcUMsQ0FrQnRDOzs7QUFDQSxTQUFLLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLENBQWhDLEVBQW1DLENBQW5DO0FBQ0QsR0FyRWM7O0FBdUVmLEVBQUEsY0FBYyxDQUFDLGVBQUQsRUFBa0IsYUFBbEIsRUFBaUMsYUFBakMsRUFBZ0QsUUFBaEQsRUFBMEQsQ0FBMUQsRUFBNkQsQ0FBN0QsRUFBZ0U7QUFDNUUsVUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWjtBQUNBLElBQUEsR0FBRyxDQUFDLEVBQUosR0FBUyxRQUFUO0FBQ0EsSUFBQSxHQUFHLENBQUMsS0FBSixDQUFVLEtBQVYsR0FBa0IsTUFBbEI7QUFDQSxJQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVUsTUFBVixHQUFtQixNQUFuQjtBQUNBLElBQUEsR0FBRyxDQUFDLEtBQUosQ0FBVSxlQUFWLEdBQTRCLFlBQTVCO0FBQ0EsSUFBQSxHQUFHLENBQUMsS0FBSixDQUFVLE1BQVYsR0FBbUIsaUJBQW5CO0FBQ0EsSUFBQSxHQUFHLENBQUMsS0FBSixDQUFVLFlBQVYsR0FBeUIsS0FBekI7QUFDQSxJQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVUsUUFBVixHQUFxQixVQUFyQjtBQUNBLElBQUEsR0FBRyxDQUFDLEtBQUosQ0FBVSxJQUFWLEdBQWlCLENBQUMsQ0FBQyxHQUFHLGFBQUwsSUFBc0IsR0FBdEIsR0FBNEIsR0FBN0M7QUFDQSxJQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVUsR0FBVixHQUFnQixDQUFDLENBQUMsR0FBRyxhQUFMLElBQXNCLEdBQXRCLEdBQTRCLEdBQTVDO0FBQ0EsSUFBQSxlQUFlLENBQUMsV0FBaEIsQ0FBNEIsR0FBNUI7QUFDRCxHQW5GYzs7QUFxRmYsRUFBQSxVQUFVLENBQUMsUUFBRCxFQUFXLENBQVgsRUFBYyxDQUFkLEVBQWlCLGFBQWpCLEVBQWdDLGFBQWhDLEVBQStDO0FBQ3ZELFVBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFFBQXhCLENBQXRCO0FBQ0EsSUFBQSxhQUFhLENBQUMsS0FBZCxDQUFvQixJQUFwQixHQUEyQixDQUFDLENBQUMsR0FBRyxhQUFMLElBQXNCLEdBQXRCLEdBQTRCLEdBQXZEO0FBQ0EsSUFBQSxhQUFhLENBQUMsS0FBZCxDQUFvQixHQUFwQixHQUEwQixDQUFDLENBQUMsR0FBRyxhQUFMLElBQXNCLEdBQXRCLEdBQTRCLEdBQXREO0FBQ0QsR0F6RmM7O0FBMkZmLEVBQUEsZ0JBQWdCLENBQUMsUUFBRCxFQUFXLENBQVgsRUFBYyxDQUFkLEVBQWlCO0FBQy9CO0FBQ0E7QUFDQSxRQUFJLGVBQWUsS0FBSyxTQUF4QixFQUFtQztBQUNqQyxVQUFJLFFBQVEsS0FBSyxtQkFBakIsRUFBc0M7QUFDcEM7QUFDQSxRQUFBLGtCQUFrQixHQUFHLENBQXJCO0FBQ0EsUUFBQSxrQkFBa0IsR0FBRyxDQUFyQjtBQUNELE9BSkQsTUFJTztBQUNMLFFBQUEsaUJBQWlCLEdBQUcsQ0FBcEI7QUFDQSxRQUFBLGlCQUFpQixHQUFHLENBQXBCO0FBQ0QsT0FSZ0MsQ0FTakM7O0FBQ0QsS0FWRCxNQVVPO0FBQ0wsVUFBSSxRQUFRLEtBQUssbUJBQWpCLEVBQXNDO0FBQ3BDLFFBQUEsT0FBTyxDQUFDLE1BQVIsR0FBaUIsQ0FBakI7QUFDQSxRQUFBLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLENBQWpCO0FBQ0QsT0FIRCxNQUdPO0FBQ0wsUUFBQSxPQUFPLENBQUMsS0FBUixHQUFnQixDQUFoQjtBQUNBLFFBQUEsT0FBTyxDQUFDLEtBQVIsR0FBZ0IsQ0FBaEI7QUFDRDtBQUNGO0FBQ0YsR0FqSGM7O0FBbUhmLEVBQUEsVUFBVSxHQUFHO0FBQ1gsVUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsU0FBeEIsQ0FBcEI7QUFDQSxVQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixnQkFBeEIsQ0FBdkI7QUFDQSxVQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixhQUF4QixDQUFuQjtBQUNBLFVBQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGtCQUF4QixDQUF2QjtBQUNBLFVBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGlCQUF4QixDQUF0QjtBQUNBLFVBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLG1CQUF4QixDQUFwQjtBQUNBLFVBQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGtCQUF4QixDQUFuQjtBQUNBLFVBQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFdBQXhCLENBQWpCO0FBQ0EsVUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsVUFBeEIsQ0FBaEI7O0FBRUEsUUFBSSxDQUFDLFdBQUwsRUFBa0I7QUFDaEI7QUFDRCxLQUZELE1BRU87QUFDTCxNQUFBLFdBQVcsR0FBRyxLQUFkO0FBQ0EsTUFBQSxXQUFXLENBQUMsUUFBWixHQUF1QixLQUF2QjtBQUNBLE1BQUEsY0FBYyxDQUFDLEtBQWYsR0FBdUIsSUFBdkI7QUFDQSxNQUFBLFVBQVUsQ0FBQyxLQUFYLEdBQW1CLFVBQW5CLENBSkssQ0FLTDs7QUFDQSxNQUFBLE9BQU8sR0FBRyxTQUFWLENBTkssQ0FPTDs7QUFDQSxNQUFBLGVBQWUsR0FBRyxTQUFsQjtBQUNBLE1BQUEsa0JBQWtCLEdBQUcsU0FBckI7QUFDQSxNQUFBLGtCQUFrQixHQUFHLFNBQXJCO0FBQ0EsTUFBQSxpQkFBaUIsR0FBRyxTQUFwQjtBQUNBLE1BQUEsaUJBQWlCLEdBQUcsU0FBcEIsQ0FaSyxDQWFMOztBQUNBLFVBQUksV0FBVyxLQUFLLElBQXBCLEVBQTBCO0FBQ3hCLFFBQUEsY0FBYyxDQUFDLFdBQWYsQ0FBMkIsV0FBM0I7QUFDRDs7QUFDRCxVQUFJLFVBQVUsS0FBSyxJQUFuQixFQUF5QjtBQUN2QixRQUFBLGFBQWEsQ0FBQyxXQUFkLENBQTBCLFVBQTFCO0FBQ0QsT0FuQkksQ0FvQkw7OztBQUNBLE1BQUEsUUFBUSxDQUFDLG1CQUFULENBQTZCLE9BQTdCLEVBQXNDLFFBQVEsQ0FBQyxjQUEvQztBQUNBLE1BQUEsT0FBTyxDQUFDLG1CQUFSLENBQTRCLE9BQTVCLEVBQXFDLFFBQVEsQ0FBQyxjQUE5QyxFQXRCSyxDQXVCTDs7QUFDQSxNQUFBLFFBQVEsQ0FBQyxzQkFBVCxDQUFnQyxLQUFoQztBQUNEO0FBRUYsR0EzSmM7O0FBNkpmLEVBQUEsUUFBUSxHQUFHO0FBQ1QsVUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsU0FBeEIsQ0FBcEI7QUFDQSxVQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixrQkFBeEIsQ0FBdkI7QUFDQSxVQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixpQkFBeEIsQ0FBdEI7QUFDQSxVQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixXQUF4QixDQUFqQjtBQUNBLFVBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFVBQXhCLENBQWhCO0FBQ0EsVUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsbUJBQXhCLENBQXBCO0FBQ0EsVUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0Isa0JBQXhCLENBQW5CO0FBQ0EsVUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsZ0JBQXhCLENBQXZCO0FBQ0EsVUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBbkI7QUFDQSxVQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLGNBQXhCLENBQXpCOztBQUVBLFFBQUksQ0FBQyxXQUFMLEVBQWtCO0FBQ2hCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsTUFBQSxXQUFXLEdBQUcsS0FBZDtBQUNBLE1BQUEsV0FBVyxDQUFDLFFBQVosR0FBdUIsS0FBdkIsQ0FGSyxDQUdMOztBQUNBLE1BQUEsUUFBUSxDQUFDLG1CQUFULENBQTZCLE9BQTdCLEVBQXNDLFFBQVEsQ0FBQyxjQUEvQztBQUNBLE1BQUEsT0FBTyxDQUFDLG1CQUFSLENBQTRCLE9BQTVCLEVBQXFDLFFBQVEsQ0FBQyxjQUE5QyxFQUxLLENBTUw7O0FBQ0EsTUFBQSxjQUFjLENBQUMsV0FBZixDQUEyQixXQUEzQjtBQUNBLE1BQUEsYUFBYSxDQUFDLFdBQWQsQ0FBMEIsVUFBMUIsRUFSSyxDQVNMO0FBQ0E7O0FBQ0EsVUFBSSxlQUFlLEtBQUssU0FBeEIsRUFBbUM7QUFDakMsWUFBSSxVQUFVLENBQUMsS0FBWCxLQUFxQixRQUF6QixFQUFtQztBQUFFLFVBQUEsZUFBZSxDQUFDLE9BQWhCLEdBQTBCLElBQTFCO0FBQWdDLFNBQXJFLE1BQTJFO0FBQUUsVUFBQSxlQUFlLENBQUMsT0FBaEIsR0FBMEIsS0FBMUI7QUFBaUM7O0FBQUE7QUFDOUcsUUFBQSxlQUFlLENBQUMsVUFBaEIsR0FBNkIsY0FBYyxDQUFDLEtBQTVDO0FBQ0EsUUFBQSxlQUFlLENBQUMsT0FBaEIsR0FBMEIsa0JBQTFCO0FBQ0EsUUFBQSxlQUFlLENBQUMsT0FBaEIsR0FBMEIsa0JBQTFCO0FBQ0EsUUFBQSxlQUFlLENBQUMsTUFBaEIsR0FBeUIsaUJBQXpCO0FBQ0EsUUFBQSxlQUFlLENBQUMsTUFBaEIsR0FBeUIsaUJBQXpCLENBTmlDLENBT2pDO0FBQ0QsT0FSRCxNQVFPO0FBQ0wsWUFBSSxVQUFVLENBQUMsS0FBWCxLQUFxQixRQUF6QixFQUFtQztBQUFFLFVBQUEsT0FBTyxDQUFDLE1BQVIsR0FBaUIsSUFBakI7QUFBdUIsU0FBNUQsTUFBa0U7QUFBRSxVQUFBLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLEtBQWpCO0FBQXdCOztBQUFBO0FBQzVGLFFBQUEsT0FBTyxDQUFDLFNBQVIsR0FBb0IsY0FBYyxDQUFDLEtBQW5DO0FBQ0EsUUFBQSxTQUFTLENBQUMsSUFBVixDQUFlLE9BQWYsRUFISyxDQUlMOztBQUNBLFFBQUEsV0FBVztBQUNYLGNBQU0sVUFBVSxHQUFHLDZCQUFVLFFBQVYsRUFBb0I7QUFBRSxnQkFBTyxRQUFPLFdBQVksRUFBNUI7QUFBK0IsbUJBQVM7QUFBeEMsU0FBcEIsRUFBaUYsUUFBTyxXQUFZLEVBQXBHLENBQW5CO0FBQ0EsUUFBQSxnQkFBZ0IsQ0FBQyxXQUFqQixDQUE2QixVQUE3QjtBQUNBLFFBQUEsUUFBUSxDQUFDLGNBQVQsQ0FBeUIsUUFBTyxXQUFZLEVBQTVDLEVBQStDLGdCQUEvQyxDQUFnRSxPQUFoRSxFQUF5RSxRQUFRLENBQUMsZUFBbEY7QUFDRCxPQTVCSSxDQTZCTDs7O0FBRUEsTUFBQSxjQUFjLENBQUMsS0FBZixHQUF1QixJQUF2QjtBQUNBLE1BQUEsVUFBVSxDQUFDLEtBQVgsR0FBbUIsVUFBbkIsQ0FoQ0ssQ0FpQ0w7O0FBQ0EsTUFBQSxPQUFPLEdBQUcsU0FBVixDQWxDSyxDQW1DTDs7QUFDQSxNQUFBLGVBQWUsR0FBRyxTQUFsQjtBQUNBLE1BQUEsa0JBQWtCLEdBQUcsU0FBckI7QUFDQSxNQUFBLGtCQUFrQixHQUFHLFNBQXJCO0FBQ0EsTUFBQSxpQkFBaUIsR0FBRyxTQUFwQjtBQUNBLE1BQUEsaUJBQWlCLEdBQUcsU0FBcEIsQ0F4Q0ssQ0F5Q0w7O0FBQ0EsTUFBQSxRQUFRLENBQUMsc0JBQVQsQ0FBZ0MsS0FBaEM7QUFDRDtBQUVGLEdBeE5jOztBQTBOZixFQUFBLGVBQWUsQ0FBQyxDQUFELEVBQUk7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFNBQXhCLENBQXBCO0FBQ0EsVUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsZ0JBQXhCLENBQXZCO0FBQ0EsVUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBbkI7QUFDQSxVQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixXQUF4QixDQUFqQjtBQUNBLFVBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFULENBQXdCLFVBQXhCLENBQWhCLENBYmlCLENBZWpCOztBQUNBLElBQUEsV0FBVyxDQUFDLFFBQVosR0FBdUIsSUFBdkIsQ0FoQmlCLENBaUJqQjs7QUFDQSxJQUFBLFdBQVcsR0FBRyxJQUFkLENBbEJpQixDQW1CakI7O0FBQ0EsUUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxFQUFULENBQVksS0FBWixDQUFrQixDQUFsQixDQUFaO0FBQ0EsSUFBQSxlQUFlLEdBQUcsU0FBUyxDQUFDLEtBQUssR0FBRyxDQUFULENBQTNCLENBckJpQixDQXNCakI7O0FBQ0EsSUFBQSxjQUFjLENBQUMsS0FBZixHQUF1QixlQUFlLENBQUMsVUFBdkM7O0FBQ0EsUUFBSSxlQUFlLENBQUMsT0FBaEIsS0FBNEIsSUFBaEMsRUFBc0M7QUFBRSxNQUFBLFVBQVUsQ0FBQyxLQUFYLEdBQW1CLFFBQW5CO0FBQThCLEtBQXRFLE1BQTRFO0FBQUUsTUFBQSxVQUFVLENBQUMsS0FBWCxHQUFtQixVQUFuQjtBQUFnQyxLQXhCN0YsQ0F5QmpCOzs7QUFDQSxJQUFBLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixPQUExQixFQUFtQyxRQUFRLENBQUMsY0FBNUM7QUFDQSxJQUFBLE9BQU8sQ0FBQyxnQkFBUixDQUF5QixPQUF6QixFQUFrQyxRQUFRLENBQUMsY0FBM0MsRUEzQmlCLENBNEJqQjs7QUFDQSxRQUFJLGVBQWUsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixrQkFBeEIsQ0FBdEI7QUFDQSxRQUFJLENBQUMsR0FBSSxlQUFlLENBQUMsT0FBaEIsR0FBMEIsZUFBZSxDQUFDLFdBQTNDLEdBQTBELGVBQWUsQ0FBQyxXQUFsRjtBQUNBLFFBQUksQ0FBQyxHQUFJLGVBQWUsQ0FBQyxPQUFoQixHQUEwQixlQUFlLENBQUMsWUFBM0MsR0FBMkQsZUFBZSxDQUFDLFlBQW5GO0FBQ0EsSUFBQSxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsQ0FBMUIsRUFBNkIsQ0FBN0IsRUFBZ0MsZUFBaEMsRUFoQ2lCLENBaUNqQjs7QUFDQSxJQUFBLGVBQWUsR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixpQkFBeEIsQ0FBbEI7QUFDQSxJQUFBLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBRSxlQUFlLENBQUMsTUFBaEIsR0FBeUIsZUFBZSxDQUFDLFdBQTFDLEdBQXlELGVBQWUsQ0FBQyxXQUExRSxFQUF1RixPQUF2RixDQUErRixDQUEvRixDQUFELENBQVY7QUFDQSxJQUFBLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBRSxlQUFlLENBQUMsTUFBaEIsR0FBeUIsZUFBZSxDQUFDLFlBQTFDLEdBQTBELGVBQWUsQ0FBQyxZQUEzRSxFQUF5RixPQUF6RixDQUFpRyxDQUFqRyxDQUFELENBQVY7QUFDQSxJQUFBLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixDQUExQixFQUE2QixDQUE3QixFQUFnQyxlQUFoQztBQUVELEdBalFjOztBQW1RZixFQUFBLHNCQUFzQixDQUFDLFlBQUQsRUFBZTtBQUNuQztBQUNBLFVBQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBekI7QUFDQSxRQUFJLE9BQUo7QUFDQSxRQUFJLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxVQUFqQixDQUE0QixNQUF6Qzs7QUFDQSxTQUFLLElBQUksQ0FBQyxHQUFHLENBQWIsRUFBZ0IsQ0FBQyxHQUFHLE1BQXBCLEVBQTRCLENBQUMsRUFBN0IsRUFBaUM7QUFDL0IsTUFBQSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBeUIsUUFBTyxDQUFDLEdBQUcsQ0FBRSxFQUF0QyxDQUFWO0FBQ0EsTUFBQSxPQUFPLENBQUMsUUFBUixHQUFtQixZQUFuQjtBQUNEO0FBRUYsR0E3UWM7O0FBK1FmLEVBQUEscUJBQXFCLEdBQUc7QUFDdEIsV0FBTyxTQUFQO0FBQ0Q7O0FBalJjLENBQWpCO2VBcVJlLFEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBVUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OFwiXHJcblxyXG5jb25zdCBBUEkgPSB7XHJcblxyXG4gIGdldFNpbmdsZUl0ZW0oZXh0ZW5zaW9uLCBpZCkge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGdldEFsbChleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBkZWxldGVJdGVtKGV4dGVuc2lvbiwgaWQpIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWAsIHtcclxuICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gICAgICAudGhlbigoKSA9PiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApKVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHBvc3RJdGVtKGV4dGVuc2lvbiwgb2JqKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFQSSIsImZ1bmN0aW9uIGVsQnVpbGRlcihuYW1lLCBhdHRyaWJ1dGVzT2JqLCB0eHQsIC4uLmNoaWxkcmVuKSB7XHJcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xyXG4gIGZvciAobGV0IGF0dHIgaW4gYXR0cmlidXRlc09iaikge1xyXG4gICAgZWwuc2V0QXR0cmlidXRlKGF0dHIsIGF0dHJpYnV0ZXNPYmpbYXR0cl0pO1xyXG4gIH1cclxuICBlbC50ZXh0Q29udGVudCA9IHR4dCB8fCBudWxsO1xyXG4gIGNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgZWwuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gIH0pXHJcbiAgcmV0dXJuIGVsO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBlbEJ1aWxkZXIiLCJpbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiO1xyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIjtcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCI7XHJcbmltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIjtcclxuXHJcbi8vIHRoZSBwdXJwb3NlIG9mIHRoaXMgbW9kdWxlIGlzIHRvOlxyXG4vLyAxLiBzYXZlIGFsbCBjb250ZW50IGluIHRoZSBnYW1lcGxheSBwYWdlIChzaG90IGFuZCBnYW1lIGRhdGEpIHRvIHRoZSBkYXRhYmFzZVxyXG4vLyAyLiBpbW1lZGlhdGVseSBjbGVhciB0aGUgZ2FtZXBsYXkgY29udGFpbmVycyBvZiBjb250ZW50IG9uIHNhdmVcclxuLy8gMy4gaW1tZWRpYXRlbHkgcmVzZXQgYWxsIGdsb2JhbCB2YXJpYWJsZXMgaW4gdGhlIHNob3RkYXRhIGZpbGUgdG8gYWxsb3cgdGhlIHVzZXIgdG8gYmVnaW4gc2F2aW5nIHNob3RzIGFuZCBlbnRlcmluZyBnYW1lIGRhdGEgZm9yIHRoZWlyIG5leHQgZ2FtZVxyXG4vLyA0LiBhZmZvcmRhbmNlIGZvciB1c2VyIHRvIHJlY2FsbCBhbGwgZGF0YSBmcm9tIHByZXZpb3VzIHNhdmVkIGdhbWUgZm9yIGVkaXRpbmdcclxuLy8gNS4gaW5jbHVkZSBhbnkgb3RoZXIgZnVuY3Rpb25zIG5lZWRlZCB0byBzdXBwb3J0IHRoZSBmaXJzdCA0IHJlcXVpcmVtZW50c1xyXG5cclxuY29uc3QgZ2FtZURhdGEgPSB7XHJcblxyXG4gIGdhbWVUeXBlQnV0dG9uVG9nZ2xlKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gdG9nZ2xlcyB0aGUgXCJpcy1zZWxlY3RlZFwiIGNsYXNzIGJldHdlZW4gdGhlIGdhbWUgdHlwZSBidXR0b25zXHJcblxyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdG5zID0gW2J0bl8zdjMsIGJ0bl8ydjIsIGJ0bl8xdjFdO1xyXG4gICAgbGV0IGJ0bkNsaWNrZWQgPSBlLnRhcmdldDtcclxuXHJcbiAgICBpZiAoIWJ0bkNsaWNrZWQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaXMtc2VsZWN0ZWRcIikpIHtcclxuICAgICAgY29uc3QgY3VycmVudEdhbWVUeXBlQnRuID0gZ2FtZVR5cGVCdG5zLmZpbHRlcihidG4gPT4gYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImlzLXNlbGVjdGVkXCIpKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgY3VycmVudEdhbWVUeXBlQnRuWzBdLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy1saW5rXCIpO1xyXG4gICAgICBidG5DbGlja2VkLmNsYXNzTGlzdC5hZGQoXCJpcy1zZWxlY3RlZFwiKTtcclxuICAgICAgYnRuQ2xpY2tlZC5jbGFzc0xpc3QuYWRkKFwiaXMtbGlua1wiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlRGF0YSgpIHtcclxuXHJcbiAgICAvLyBnZXQgdXNlciBJRCBmcm9tIHNlc3Npb24gc3RvcmFnZVxyXG4gICAgLy8gcGFja2FnZSBhbmQgc2F2ZSBnYW1lIGRhdGFcclxuICAgIC8vIHRoZW4gZ2V0IElEIG9mIGxhdGVzdCBnYW1lIHNhdmVkIChyZXR1cm5lZCBpbW1lZGlhdGVseSBpbiBvYmplY3QgZnJvbSBQT1NUKVxyXG4gICAgLy8gcGFja2FnZSBhbmQgc2F2ZSBzaG90cyB3aXRoIHRoZSBnYW1lIElEXHJcbiAgICAvLyBUT0RPOiBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gcHJldmVudCBibGFuayBzY29yZSBlbnRyaWVzXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gc2F2ZSBnYW1lXHJcblxyXG4gICAgLy8gcGxheWVySWRcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IE51bWJlcihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpKTtcclxuXHJcbiAgICAvLyBnYW1lIHR5cGUgKDF2MSwgMnYyLCAzdjMpXHJcbiAgICBjb25zdCBidG5fM3YzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfM3YzXCIpO1xyXG4gICAgY29uc3QgYnRuXzJ2MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzJ2MlwiKTtcclxuICAgIGNvbnN0IGJ0bl8xdjEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8xdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ0bnMgPSBbYnRuXzN2MywgYnRuXzJ2MiwgYnRuXzF2MV07XHJcbiAgICBsZXQgZ2FtZVR5cGUgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IHtcclxuICAgICAgaWYgKGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJpcy1zZWxlY3RlZFwiKSkge1xyXG4gICAgICAgIGdhbWVUeXBlID0gYnRuLnRleHRDb250ZW50XHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIChub3RlOiBkaWQgbm90IHVzZSBib29sZWFuIGluIGNhc2UgbW9yZSBnYW1lIG1vZGVzIGFyZSBzdXBwb3J0ZWQgaW4gdGhlIGZ1dHVyZSlcclxuICAgIGNvbnN0IHNlbF9nYW1lTW9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZU1vZGVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsX2dhbWVNb2RlLnZhbHVlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gbXkgdGVhbSAobm90ZTogZGlkIG5vdCB1c2UgYm9vbGVhbiBpbiBwcmVwYXJhdGlvbiBmb3IgdXNlcnMgdG8gZW50ZXIgdGhlIGNsdWIgaW5mb3JtYXRpb24pXHJcbiAgICBjb25zdCBzZWxfdGVhbUNvbG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZWFtSW5wdXRcIik7XHJcbiAgICBsZXQgbXlUZWFtO1xyXG4gICAgaWYgKHNlbF90ZWFtQ29sb3IudmFsdWUgPT09IFwiT3JhbmdlIHRlYW1cIikge1xyXG4gICAgICBteVRlYW0gPSBcIm9yYW5nZVwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbXlUZWFtID0gXCJibHVlXCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbXkgc2NvcmVcclxuICAgIGxldCBteVNjb3JlO1xyXG4gICAgbGV0IHRoZWlyU2NvcmU7XHJcbiAgICBjb25zdCBpbnB0X29yYW5nZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvcmFuZ2VTY29yZUlucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF9ibHVlU2NvcmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJsdWVTY29yZUlucHV0XCIpO1xyXG5cclxuICAgIGlmIChteVRlYW0gPT09IFwib3JhbmdlXCIpIHtcclxuICAgICAgbXlTY29yZSA9IE51bWJlcihpbnB0X29yYW5nZVNjb3JlLnZhbHVlKTtcclxuICAgICAgdGhlaXJTY29yZSA9IE51bWJlcihpbnB0X2JsdWVTY29yZS52YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBteVNjb3JlID0gTnVtYmVyKGlucHRfYmx1ZVNjb3JlLnZhbHVlKTtcclxuICAgICAgdGhlaXJTY29yZSA9IE51bWJlcihpbnB0X29yYW5nZVNjb3JlLnZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBvdmVydGltZVxyXG4gICAgbGV0IG92ZXJ0aW1lO1xyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG4gICAgaWYgKHNlbF9vdmVydGltZS52YWx1ZSA9PT0gXCJPdmVydGltZVwiKSB7XHJcbiAgICAgIG92ZXJ0aW1lID0gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG92ZXJ0aW1lID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGdhbWVEYXRhID0ge1xyXG4gICAgICBcInVzZXJJZFwiOiBhY3RpdmVVc2VySWQsXHJcbiAgICAgIFwibW9kZVwiOiBnYW1lTW9kZSxcclxuICAgICAgXCJ0eXBlXCI6IGdhbWVUeXBlLFxyXG4gICAgICBcInRlYW1cIjogbXlUZWFtLFxyXG4gICAgICBcInNjb3JlXCI6IG15U2NvcmUsXHJcbiAgICAgIFwib3BwX3Njb3JlXCI6IHRoZWlyU2NvcmUsXHJcbiAgICAgIFwib3ZlcnRpbWVcIjogb3ZlcnRpbWVcclxuICAgIH07XHJcblxyXG4gICAgQVBJLnBvc3RJdGVtKFwiZ2FtZXNcIiwgZ2FtZURhdGEpXHJcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5pZClcclxuICAgICAgLnRoZW4oZ2FtZUlkID0+IHtcclxuICAgICAgICAvLyBwb3N0IHNob3RzIHdpdGggZ2FtZUlkXHJcbiAgICAgICAgY29uc3Qgc2hvdEFyciA9IHNob3REYXRhLmdldFNob3RPYmplY3RzRm9yUG9zdCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNob3RBcnIpXHJcbiAgICAgICAgc2hvdEFyci5mb3JFYWNoKHNob3RPYmogPT4ge1xyXG4gICAgICAgICAgbGV0IHNob3RGb3JQb3N0ID0ge307XHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5nYW1lSWQgPSBnYW1lSWRcclxuICAgICAgICAgIHNob3RGb3JQb3N0LmZpZWxkWCA9IHNob3RPYmouX2ZpZWxkWFxyXG4gICAgICAgICAgc2hvdEZvclBvc3QuZmllbGRZID0gc2hvdE9iai5fZmllbGRZXHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5nb2FsWCA9IHNob3RPYmouX2dvYWxYXHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5nb2FsWSA9IHNob3RPYmouX2dvYWxZXHJcbiAgICAgICAgICBzaG90Rm9yUG9zdC5iYWxsX3NwZWVkID0gTnVtYmVyKHNob3RPYmouYmFsbF9zcGVlZClcclxuICAgICAgICAgIHNob3RGb3JQb3N0LmFlcmlhbCA9IHNob3RPYmouX2FlcmlhbFxyXG4gICAgICAgICAgQVBJLnBvc3RJdGVtKFwic2hvdHNcIiwgc2hvdEZvclBvc3QpLnRoZW4ocG9zdCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvc3QpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIGZ1bmN0aW9ucyB0aGF0IGNsZWFyIGdhbWVwbGF5IGNvbnRlbnQgYW5kIHJlc2V0IGdsb2JhbCBzaG90IGRhdGEgdmFyaWFibGVzXHJcbiAgICAgICAgICAgIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpO1xyXG4gICAgICAgICAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgfSk7XHJcblxyXG4gIH0sXHJcblxyXG4gIHNhdmVQcmV2R2FtZUVkaXRzKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJzYXZpbmcgZWRpdHMuLi5cIilcclxuICAgIC8vIFRPRE86IFBVVCBlZGl0cyB0byBkYXRhYmFzZVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbEVkaXRpbmdNb2RlKCkge1xyXG4gICAgZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCk7XHJcbiAgICBzaG90RGF0YS5yZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKTtcclxuICB9LFxyXG5cclxuICByZW5kZXJFZGl0QnV0dG9ucygpIHtcclxuICAgIC8vIHJlbW92ZSAmIHJlcGxhY2UgZWRpdCBhbmQgc2F2ZSBnYW1lIGJ1dHRvbnMgd2l0aCBcIlNhdmUgRWRpdHNcIiBhbmQgXCJDYW5jZWwgRWRpdHNcIlxyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuXHJcbiAgICBjb25zdCBidG5fY2FuY2VsRWRpdHMgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYW5nZXJcIiB9LCBcIkNhbmNlbCBFZGl0c1wiKVxyXG4gICAgY29uc3QgYnRuX3NhdmVFZGl0cyA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlRWRpdHNcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEVkaXRzXCIpXHJcblxyXG4gICAgYnRuX2NhbmNlbEVkaXRzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBnYW1lRGF0YS5jYW5jZWxFZGl0aW5nTW9kZSlcclxuICAgIGJ0bl9zYXZlRWRpdHMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLnNhdmVQcmV2R2FtZUVkaXRzKVxyXG5cclxuICAgIGJ0bl9lZGl0UHJldkdhbWUucmVwbGFjZVdpdGgoYnRuX2NhbmNlbEVkaXRzKTtcclxuICAgIGJ0bl9zYXZlR2FtZS5yZXBsYWNlV2l0aChidG5fc2F2ZUVkaXRzKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyUHJldkdhbWUoZ2FtZSkge1xyXG4gICAgY29uc29sZS5sb2coZ2FtZSlcclxuICAgIC8vIFRPRE86IHJlbmRlciBzaG90IGRhdGEgYW5kIGdhbWUgZGF0YSBvbiBwYWdlXHJcbiAgfSxcclxuXHJcbiAgZWRpdFByZXZHYW1lKCkge1xyXG4gICAgLy8gZmV0Y2ggY29udGVudCBmcm9tIG1vc3QgcmVjZW50IGdhbWUgc2F2ZWQgdG8gYmUgcmVuZGVyZWRcclxuXHJcbiAgICAvLyBUT0RPOiBjcmVhdGUgYSBtb2RhbCBhc2tpbmcgdXNlciBpZiB0aGV5IHdhbnQgdG8gZWRpdCBwcmV2aW91cyBnYW1lXHJcbiAgICBjb25zdCBhY3RpdmVVc2VySWQgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG5cclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKFwidXNlcnNcIiwgYCR7YWN0aXZlVXNlcklkfT9fZW1iZWQ9Z2FtZXNgKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBpZiAodXNlci5nYW1lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBhbGVydChcIk5vIGdhbWVzIGhhdmUgYmVlbiBzYXZlZCBieSB0aGlzIHVzZXJcIik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IG1heCBnYW1lIGlkICh3aGljaCBpcyB0aGUgbW9zdCByZWNlbnQgZ2FtZSBzYXZlZClcclxuICAgICAgICBjb25zdCByZWNlbnRHYW1lSWQgPSB1c2VyLmdhbWVzLnJlZHVjZSgobWF4LCBvYmopID0+IG9iai5pZCA+IG1heCA/IG9iai5pZCA6IG1heCwgdXNlci5nYW1lc1swXS5pZCk7XHJcbiAgICAgICAgLy8gZmV0Y2ggbW9zdCByZWNlbnQgZ2FtZSBhbmQgZW1iZWQgc2hvdHNcclxuICAgICAgICBBUEkuZ2V0U2luZ2xlSXRlbShcImdhbWVzXCIsIGAke3JlY2VudEdhbWVJZH0/X2VtYmVkPXNob3RzYCkudGhlbihnYW1lT2JqID0+IHtcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlckVkaXRCdXR0b25zKClcclxuICAgICAgICAgIGdhbWVEYXRhLnJlbmRlclByZXZHYW1lKGdhbWVPYmopXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lRGF0YSIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgc2hvdERhdGEgZnJvbSBcIi4vc2hvdERhdGFcIlxyXG5pbXBvcnQgZ2FtZURhdGEgZnJvbSBcIi4vZ2FtZURhdGFcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGdhbWVwbGF5ID0ge1xyXG5cclxuICBsb2FkR2FtZXBsYXkoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICAvLyBjb25zdCB4QnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJjbGFzc1wiOiBcImRlbGV0ZVwiIH0pO1xyXG4gICAgLy8geEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xvc2VCb3gsIGV2ZW50KTsgLy8gYnV0dG9uIHdpbGwgZGlzcGxheTogbm9uZSBvbiBwYXJlbnQgY29udGFpbmVyXHJcbiAgICAvLyBjb25zdCBoZWFkZXJJbmZvID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvbiBpcy1pbmZvXCIgfSwgXCJDcmVhdGUgYW5kIHNhdmUgc2hvdHMgLSB0aGVuIHNhdmUgdGhlIGdhbWUgcmVjb3JkLlwiLCB4QnV0dG9uKTtcclxuICAgIC8vIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoaGVhZGVySW5mbyk7XHJcbiAgICB0aGlzLmJ1aWxkU2hvdENvbnRlbnQoKTtcclxuICAgIHRoaXMuYnVpbGRHYW1lQ29udGVudCgpO1xyXG4gICAgdGhpcy5nYW1lcGxheUV2ZW50TWFuYWdlcigpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkU2hvdENvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGJ1aWxkcyBzaG90IGNvbnRhaW5lcnMgYW5kIGFkZHMgY29udGFpbmVyIGNvbnRlbnRcclxuXHJcbiAgICAvLyBjb250YWluZXIgdGl0bGVcclxuICAgIGNvbnN0IHNob3RUaXRsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIHRpdGxlIGlzLTRcIiB9LCBcIkVudGVyIFNob3QgRGF0YVwiKTtcclxuICAgIGNvbnN0IHNob3RUaXRsZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNob3RUaXRsZSk7XHJcblxyXG4gICAgLy8gbmV3IHNob3QgYW5kIHNhdmUgc2hvdCBidXR0b25zXHJcbiAgICBjb25zdCBuZXdTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcIm5ld1Nob3RcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJOZXcgU2hvdFwiKTtcclxuICAgIGNvbnN0IHNhdmVTaG90ID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNhdmVTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiU2F2ZSBTaG90XCIpO1xyXG4gICAgY29uc3QgY2FuY2VsU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJjYW5jZWxTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJDYW5jZWwgU2hvdFwiKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25zID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcInNob3RDb250cm9sc1wiLCBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBidXR0b25zXCIgfSwgbnVsbCwgbmV3U2hvdCwgc2F2ZVNob3QsIGNhbmNlbFNob3QpO1xyXG4gICAgY29uc3QgYWxpZ25TaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgc2hvdEJ1dHRvbnMpO1xyXG4gICAgY29uc3Qgc2hvdEJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduU2hvdEJ1dHRvbnMpO1xyXG5cclxuICAgIC8vIGJhbGwgc3BlZWQgaW5wdXQgYW5kIGFlcmlhbCBzZWxlY3RcclxuICAgIGNvbnN0IGJhbGxTcGVlZElucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiQmFsbCBzcGVlZCAoa3BoKTpcIilcclxuICAgIGNvbnN0IGJhbGxTcGVlZElucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiYmFsbFNwZWVkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gaW5wdXRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIGJhbGwgc3BlZWRcIiB9KTtcclxuICAgIGNvbnN0IGFlcmlhbE9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiU3RhbmRhcmRcIik7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkFlcmlhbFwiKTtcclxuICAgIGNvbnN0IGFlcmlhbFNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJhZXJpYWxJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgYWVyaWFsT3B0aW9uMSwgYWVyaWFsT3B0aW9uMik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgYWVyaWFsU2VsZWN0KTtcclxuICAgIGNvbnN0IGFlcmlhbENvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgYWVyaWFsU2VsZWN0UGFyZW50KTtcclxuICAgIGNvbnN0IHNob3REZXRhaWxzID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWxlZnRcIiB9LCBudWxsLCBiYWxsU3BlZWRJbnB1dFRpdGxlLCBiYWxsU3BlZWRJbnB1dCwgYWVyaWFsQ29udHJvbCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlsc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIHNob3REZXRhaWxzKTtcclxuXHJcbiAgICAvLyBmaWVsZCBhbmQgZ29hbCBpbWFnZXMgKG5vdGUgZmllbGQtaW1nIGlzIGNsaXBwZWQgdG8gcmVzdHJpY3QgY2xpY2sgYXJlYSBjb29yZGluYXRlcyBpbiBsYXRlciBmdW5jdGlvbi5cclxuICAgIC8vIGdvYWwtaW1nIHVzZXMgYW4geC95IGZvcm11bGEgZm9yIGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgcmVzdHJpY3Rpb24sIHNpbmNlIGl0J3MgYSByZWN0YW5nbGUpXHJcbiAgICAvLyBhZGRpdGlvbmFsbHksIGZpZWxkIGFuZCBnb2FsIGFyZSBub3QgYWxpZ25lZCB3aXRoIGxldmVsLWxlZnQgb3IgbGV2ZWwtcmlnaHQgLSBpdCdzIGEgZGlyZWN0IGxldmVsIC0tPiBsZXZlbC1pdGVtIGZvciBjZW50ZXJpbmdcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2UgPSBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcImlkXCI6IFwiZmllbGQtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL0RGSF9zdGFkaXVtXzc5MHg1NDBfbm9fYmdfOTBkZWcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGZpZWxkSW1hZ2VCYWNrZ3JvdW5kID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1iZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcIlwiIH0sIG51bGwsIGZpZWxkSW1hZ2VCYWNrZ3JvdW5kLCBmaWVsZEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGZpZWxkSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3QgZ29hbEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nXCIsIFwic3JjXCI6IFwiLi4vaW1hZ2VzL1JMX2dvYWxfY3JvcHBlZF9ub19iZ19CVy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZ29hbEltYWdlUGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcImdvYWwtaW1nLXBhcmVudFwiLCBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnb2FsSW1hZ2UpO1xyXG4gICAgY29uc3QgYWxpZ25Hb2FsID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBnb2FsSW1hZ2VQYXJlbnQpO1xyXG4gICAgY29uc3Qgc2hvdENvb3JkaW5hdGVzQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgYWxpZ25GaWVsZCwgYWxpZ25Hb2FsKTtcclxuXHJcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIGhvbGRpbmcgYWxsIHNob3QgaW5mb3JtYXRpb25cclxuICAgIGNvbnN0IHBhcmVudFNob3RDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHNob3RUaXRsZUNvbnRhaW5lciwgc2hvdEJ1dHRvbkNvbnRhaW5lciwgc2hvdERldGFpbHNDb250YWluZXIsIHNob3RDb29yZGluYXRlc0NvbnRhaW5lcilcclxuXHJcbiAgICAvLyBhcHBlbmQgc2hvdHMgY29udGFpbmVyIHRvIHBhZ2VcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50U2hvdENvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgYnVpbGRHYW1lQ29udGVudCgpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gY3JlYXRlcyBnYW1lIGNvbnRlbnQgY29udGFpbmVycyAodGVhbSwgZ2FtZSB0eXBlLCBnYW1lIG1vZGUsIGV0Yy4pXHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBnYW1lVGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBHYW1lIERhdGFcIik7XHJcbiAgICBjb25zdCB0aXRsZUNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUaXRsZSk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLSB0b3AgY29udGFpbmVyXHJcblxyXG4gICAgLy8gMXYxLzJ2Mi8zdjMgYnV0dG9ucyAobm90ZTogY29udHJvbCBjbGFzcyBpcyB1c2VkIHdpdGggZmllbGQgdG8gYWRoZXJlIGJ1dHRvbnMgdG9nZXRoZXIpXHJcbiAgICBjb25zdCBnYW1lVHlwZTN2MyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfM3YzXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjN2M1wiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlM3YzQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjMpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzJ2MlwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXNlbGVjdGVkIGlzLWxpbmtcIiB9LCBcIjJ2MlwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUydjIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUxdjEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzF2MVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIxdjFcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlMXYxKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnV0dG9uRmllbGQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiZmllbGQgaGFzLWFkZG9uc1wiIH0sIG51bGwsIGdhbWVUeXBlM3YzQ29udHJvbCwgZ2FtZVR5cGUydjJDb250cm9sLCBnYW1lVHlwZTF2MUNvbnRyb2wpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIG51bGwsIGdhbWVUeXBlQnV0dG9uRmllbGQpO1xyXG5cclxuICAgIC8vIGdhbWUgbW9kZSBzZWxlY3RcclxuICAgIGNvbnN0IG1vZGVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNhc3VhbFwiKTtcclxuICAgIGNvbnN0IG1vZGVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkNvbXBldGl0aXZlXCIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJnYW1lTW9kZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlT3B0aW9uMSwgbW9kZU9wdGlvbjIpO1xyXG4gICAgY29uc3QgbW9kZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBtb2RlU2VsZWN0KTtcclxuICAgIGNvbnN0IG1vZGVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIG1vZGVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIHRlYW0gc2VsZWN0XHJcbiAgICBjb25zdCB0ZWFtT3B0aW9uMSA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJPcmFuZ2UgdGVhbVwiKTtcclxuICAgIGNvbnN0IHRlYW1PcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIkJsdWUgVGVhbVwiKTtcclxuICAgIGNvbnN0IHRlYW1TZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwidGVhbUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtT3B0aW9uMSwgdGVhbU9wdGlvbjIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCB0ZWFtU2VsZWN0KTtcclxuICAgIGNvbnN0IHRlYW1Db250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHRlYW1TZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIG92ZXJ0aW1lIHNlbGVjdFxyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk5vIG92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVPcHRpb24yID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk92ZXJ0aW1lXCIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwib3ZlcnRpbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVPcHRpb24xLCBvdmVydGltZU9wdGlvbjIpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVTZWxlY3RQYXJlbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwic2VsZWN0XCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3QpO1xyXG4gICAgY29uc3Qgb3ZlcnRpbWVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIG92ZXJ0aW1lU2VsZWN0UGFyZW50KTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tIGJvdHRvbSBjb250YWluZXJcclxuXHJcbiAgICAvLyBzY29yZSBpbnB1dHNcclxuICAgIC8vICoqKipOb3RlIGlubGluZSBzdHlsaW5nIG9mIGlucHV0IHdpZHRoc1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIk9yYW5nZSB0ZWFtIHNjb3JlOlwiKTtcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJvcmFuZ2VTY29yZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJudW1iZXJcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIG9yYW5nZSB0ZWFtIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgb3JhbmdlU2NvcmVJbnB1dCk7XHJcbiAgICBjb25zdCBibHVlU2NvcmVJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJsdWUgdGVhbSBzY29yZTpcIilcclxuICAgIGNvbnN0IGJsdWVTY29yZUlucHV0ID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiYmx1ZVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgYmx1ZSB0ZWFtIHNjb3JlXCIgfSk7XHJcbiAgICBjb25zdCBibHVlU2NvcmVDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gY29udHJvbFwiIH0sIG51bGwsIGJsdWVTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IHNjb3JlSW5wdXRDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIG9yYW5nZVNjb3JlSW5wdXRUaXRsZSwgb3JhbmdlU2NvcmVDb250cm9sLCBibHVlU2NvcmVJbnB1dFRpdGxlLCBibHVlU2NvcmVDb250cm9sKTtcclxuXHJcbiAgICAvLyBlZGl0L3NhdmUgZ2FtZSBidXR0b25zXHJcbiAgICBjb25zdCBlZGl0UHJldmlvdXNHYW1lID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcImVkaXRQcmV2R2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiRWRpdCBQcmV2aW91cyBHYW1lXCIpO1xyXG4gICAgY29uc3Qgc2F2ZUdhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2F2ZUdhbWVcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1zdWNjZXNzXCIgfSwgXCJTYXZlIEdhbWVcIik7XHJcbiAgICBjb25zdCBnYW1lQnV0dG9uQWxpZ25tZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbnMgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIHNhdmVHYW1lLCBlZGl0UHJldmlvdXNHYW1lKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtcmlnaHRcIiB9LCBudWxsLCBnYW1lQnV0dG9uQWxpZ25tZW50KTtcclxuXHJcbiAgICAvLyBhcHBlbmQgdG8gd2VicGFnZVxyXG4gICAgY29uc3QgZ2FtZUNvbnRhaW5lclRvcCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGdhbWVUeXBlQnV0dG9uQ29udGFpbmVyLCBtb2RlQ29udHJvbCwgdGVhbUNvbnRyb2wsIG92ZXJ0aW1lQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyQm90dG9tID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgc2NvcmVJbnB1dENvbnRhaW5lciwgZ2FtZUJ1dHRvbkNvbnRhaW5lcik7XHJcbiAgICBjb25zdCBwYXJlbnRHYW1lQ29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCB0aXRsZUNvbnRhaW5lciwgZ2FtZUNvbnRhaW5lclRvcCwgZ2FtZUNvbnRhaW5lckJvdHRvbSk7XHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudEdhbWVDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5RXZlbnRNYW5hZ2VyKCkge1xyXG5cclxuICAgIC8vIGJ1dHRvbnNcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlU2hvdFwiKTtcclxuICAgIGNvbnN0IGJ0bl9jYW5jZWxTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW5jZWxTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2VkaXRQcmV2R2FtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdFByZXZHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuX3NhdmVHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzYXZlR2FtZVwiKTtcclxuICAgIGNvbnN0IGJ0bl8zdjMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8zdjNcIik7XHJcbiAgICBjb25zdCBidG5fMnYyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMnYyXCIpO1xyXG4gICAgY29uc3QgYnRuXzF2MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlQnRucyA9IFtidG5fM3YzLCBidG5fMnYyLCBidG5fMXYxXTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzXHJcbiAgICBidG5fbmV3U2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY3JlYXRlTmV3U2hvdCk7XHJcbiAgICBidG5fc2F2ZVNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnNhdmVTaG90KTtcclxuICAgIGJ0bl9jYW5jZWxTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jYW5jZWxTaG90KTtcclxuICAgIGJ0bl9zYXZlR2FtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuc2F2ZURhdGEpO1xyXG4gICAgZ2FtZVR5cGVCdG5zLmZvckVhY2goYnRuID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZ2FtZURhdGEuZ2FtZVR5cGVCdXR0b25Ub2dnbGUpKTtcclxuICAgIGJ0bl9lZGl0UHJldkdhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGdhbWVEYXRhLmVkaXRQcmV2R2FtZSlcclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZXBsYXkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5pbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbG9naW5PclNpZ251cCA9IHtcclxuXHJcbiAgLy8gYnVpbGQgYSBsb2dpbiBmb3JtIHRoYXQgdmFsaWRhdGVzIHVzZXIgaW5wdXQuIFN1Y2Nlc3NmdWwgbG9naW4gc3RvcmVzIHVzZXIgaWQgaW4gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgbG9naW5Gb3JtKCkge1xyXG4gICAgY29uc3QgbG9naW5JbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwicGFzc3dvcmRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJsb2dpbk5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luIG5vd1wiKTtcclxuICAgIGNvbnN0IGxvZ2luRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwibG9naW5Gb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBsb2dpbklucHV0X3VzZXJuYW1lLCBsb2dpbklucHV0X3Bhc3N3b3JkLCBsb2dpbkJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChsb2dpbkZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cEZvcm0oKSB7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9uYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9jb25maXJtID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiY29uZmlybVBhc3N3b3JkXCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJjb25maXJtIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2lnbnVwTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cCBub3dcIik7XHJcbiAgICBjb25zdCBzaWdudXBGb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJzaWdudXBGb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9uYW1lLCBzaWdudXBJbnB1dF91c2VybmFtZSwgc2lnbnVwSW5wdXRfcGFzc3dvcmQsIHNpZ251cElucHV0X2NvbmZpcm0sIHNpZ251cEJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChzaWdudXBGb3JtKVxyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKClcclxuICB9LFxyXG5cclxuICAvLyBhc3NpZ24gZXZlbnQgbGlzdGVuZXJzIGJhc2VkIG9uIHdoaWNoIGZvcm0gaXMgb24gdGhlIHdlYnBhZ2VcclxuICB1c2VyRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgY29uc3QgbG9naW5Ob3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZ2luTm93XCIpXHJcbiAgICBjb25zdCBzaWdudXBOb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpZ251cE5vd1wiKVxyXG4gICAgaWYgKGxvZ2luTm93ID09PSBudWxsKSB7XHJcbiAgICAgIHNpZ251cE5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBVc2VyLCBldmVudClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxvZ2luTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luVXNlciwgZXZlbnQpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gdmFsaWRhdGUgdXNlciBsb2dpbiBmb3JtIGlucHV0cyBiZWZvcmUgbG9nZ2luZyBpblxyXG4gIGxvZ2luVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKHVzZXIgPT4ge1xyXG4gICAgICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFuZCBwYXNzd29yZFxyXG4gICAgICAgIGlmICh1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIGlmICh1c2VyLnBhc3N3b3JkID09PSBwYXNzd29yZCkge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cFVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc29sZS5sb2coZSlcclxuICAgIGNvbnN0IF9uYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF91c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3Bhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBjb25maXJtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maXJtUGFzc3dvcmRcIikudmFsdWVcclxuICAgIGxldCB1bmlxdWVVc2VybmFtZSA9IHRydWU7IC8vY2hhbmdlcyB0byBmYWxzZSBpZiB1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1xyXG4gICAgaWYgKF9uYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfdXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoY29uZmlybSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkICE9PSBjb25maXJtKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChcInVzZXJzXCIpLnRoZW4odXNlcnMgPT4gdXNlcnMuZm9yRWFjaCgodXNlciwgaWR4KSA9PiB7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIGV4aXN0aW5nIHVzZXJuYW1lIGluIGRhdGFiYXNlXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gX3VzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIHVuaXF1ZVVzZXJuYW1lID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vYXQgdGhlIGVuZCBvZiB0aGUgbG9vcCwgcG9zdFxyXG4gICAgICAgIGlmIChpZHggPT09IHVzZXJzLmxlbmd0aCAtIDEgJiYgdW5pcXVlVXNlcm5hbWUpIHtcclxuICAgICAgICAgIGxldCBuZXdVc2VyID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBfbmFtZSxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IF91c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IF9wYXNzd29yZCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBBUEkucG9zdEl0ZW0oXCJ1c2Vyc1wiLCBuZXdVc2VyKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9naW5TdGF0dXNBY3RpdmUodXNlcikge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiLCB1c2VyLmlkKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKTsgLy9idWlsZCBsb2dnZWQgaW4gdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9LFxyXG5cclxuICBsb2dvdXRVc2VyKCkge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcihmYWxzZSk7IC8vYnVpbGQgbG9nZ2VkIG91dCB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvZ2luT3JTaWdudXAiLCJpbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcblxyXG4vLyBmdW5jdGlvbiBjbG9zZUJveChlKSB7XHJcbi8vICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcImRlbGV0ZVwiKSkge1xyXG4vLyAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoKVxyXG5uYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSlcclxuZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGxvZ2luT3JTaWdudXAgZnJvbSBcIi4vbG9naW5cIlxyXG5pbXBvcnQgcHJvZmlsZSBmcm9tIFwiLi9wcm9maWxlXCJcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2VOYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdi1tYXN0ZXJcIik7XHJcblxyXG4vKlxyXG4gIEJ1bG1hIG5hdmJhciBzdHJ1Y3R1cmU6XHJcbiAgPG5hdj5cclxuICAgIDxuYXZiYXItYnJhbmQ+XHJcbiAgICAgIDxuYXZiYXItYnVyZ2VyPiAob3B0aW9uYWwpXHJcbiAgICA8L25hdmJhci1icmFuZD5cclxuICAgIDxuYXZiYXItbWVudT5cclxuICAgICAgPG5hdmJhci1zdGFydD5cclxuICAgICAgPC9uYXZiYXItc3RhcnQ+XHJcbiAgICAgIDxuYXZiYXItZW5kPlxyXG4gICAgICA8L25hdmJhci1lbmQ+XHJcbiAgICA8L25hdmJhci1tZW51PlxyXG4gIDwvbmF2PlxyXG5cclxuICBUaGUgZnVuY3Rpb25zIGJlbG93IGJ1aWxkIHRoZSBuYXZiYXIgZnJvbSB0aGUgaW5zaWRlIG91dFxyXG4qL1xyXG5cclxuY29uc3QgbmF2YmFyID0ge1xyXG5cclxuICBnZW5lcmF0ZU5hdmJhcihsb2dnZWRJbkJvb2xlYW4pIHtcclxuXHJcbiAgICAvLyBuYXZiYXItbWVudSAocmlnaHQgc2lkZSBvZiBuYXZiYXIgLSBhcHBlYXJzIG9uIGRlc2t0b3AgMTAyNHB4KylcclxuICAgIGNvbnN0IGJ1dHRvbjIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpblwiKVxyXG4gICAgY29uc3QgYnV0dG9uMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXBcIilcclxuICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgYnV0dG9uMSwgYnV0dG9uMilcclxuICAgIGNvbnN0IG1lbnVJdGVtMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIG51bGwsIGJ1dHRvbkNvbnRhaW5lcilcclxuICAgIGNvbnN0IG5hdmJhckVuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItZW5kXCIgfSwgbnVsbCwgbWVudUl0ZW0xKVxyXG4gICAgY29uc3QgbmF2YmFyU3RhcnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLXN0YXJ0XCIgfSlcclxuICAgIGNvbnN0IG5hdmJhck1lbnUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibmF2YmFyTWVudVwiLCBcImNsYXNzXCI6IFwibmF2YmFyLW1lbnVcIiB9LCBudWxsLCBuYXZiYXJTdGFydCwgbmF2YmFyRW5kKVxyXG5cclxuICAgIC8vIG5hdmJhci1icmFuZCAobGVmdCBzaWRlIG9mIG5hdmJhciAtIGluY2x1ZGVzIG1vYmlsZSBoYW1idXJnZXIgbWVudSlcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQyID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwicm9sZVwiOiBcImJ1dHRvblwiLCBcImNsYXNzXCI6IFwibmF2YmFyLWJ1cmdlciBidXJnZXJcIiwgXCJhcmlhLWxhYmVsXCI6IFwibWVudVwiLCBcImFyaWEtZXhwYW5kZWRcIjogXCJmYWxzZVwiLCBcImRhdGEtdGFyZ2V0XCI6IFwibmF2YmFyTWVudVwiIH0sIG51bGwsIGJ1cmdlck1lbnVTcGFuMSwgYnVyZ2VyTWVudVNwYW4yLCBidXJnZXJNZW51U3BhbjMpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIsIFwiaHJlZlwiOiBcIiNcIiB9LCBudWxsLCBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9maXJlOTBkZWcucG5nXCIsIFwid2lkdGhcIjogXCIxMTJcIiwgXCJoZWlnaHRcIjogXCIyOFwiIH0pKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1icmFuZFwiIH0sIG51bGwsIG5hdmJhckJyYW5kQ2hpbGQxLCBuYXZiYXJCcmFuZENoaWxkMik7XHJcblxyXG4gICAgLy8gbmF2IChwYXJlbnQgbmF2IEhUTUwgZWxlbWVudClcclxuICAgIGNvbnN0IG5hdiA9IGVsQnVpbGRlcihcIm5hdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXJcIiwgXCJyb2xlXCI6IFwibmF2aWdhdGlvblwiLCBcImFyaWEtbGFiZWxcIjogXCJtYWluIG5hdmlnYXRpb25cIiB9LCBudWxsLCBuYXZiYXJCcmFuZCwgbmF2YmFyTWVudSk7XHJcblxyXG4gICAgLy8gaWYgbG9nZ2VkIGluLCBhcHBlbmQgYWRkaXRpb25hbCBtZW51IG9wdGlvbnMgdG8gbmF2YmFyIGFuZCByZW1vdmUgc2lnbnVwL2xvZ2luIGJ1dHRvbnNcclxuICAgIGlmIChsb2dnZWRJbkJvb2xlYW4pIHtcclxuICAgICAgLy8gcmVtb3ZlIGxvZyBpbiBhbmQgc2lnbiB1cCBidXR0b25zXHJcbiAgICAgIGNvbnN0IHNpZ251cCA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdO1xyXG4gICAgICBjb25zdCBsb2dpbiA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzFdO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQoc2lnbnVwKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvZ2luKTtcclxuICAgICAgLy8gYWRkIGxvZ291dCBidXR0b25cclxuICAgICAgY29uc3QgYnV0dG9uMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ291dFwiKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbjMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgbmV3IG1lbnUgaXRlbXMgZm9yIHVzZXJcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIlByb2ZpbGVcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJHYW1lcGxheVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkhlYXRtYXBzXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW00ID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiTGVhZGVyYm9hcmRcIik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0yKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMyk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gbmF2YmFyXHJcbiAgICB0aGlzLm5hdmJhckV2ZW50TWFuYWdlcihuYXYpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlTmF2LmFwcGVuZENoaWxkKG5hdik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpbkNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9nb3V0Q2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByb2ZpbGVDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZ2FtZXBsYXlDbGlja2VkLCBldmVudCk7XHJcbiAgfSxcclxuXHJcbiAgbG9naW5DbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dpblwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9naW5Gb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAuc2lnbnVwRm9ybSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ291dENsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ291dFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9nb3V0VXNlcigpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHByb2ZpbGVDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJQcm9maWxlXCIpIHtcclxuICAgICAgcHJvZmlsZS5sb2FkUHJvZmlsZSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiR2FtZXBsYXlcIikge1xyXG4gICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmF2YmFyIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBwcm9maWxlID0ge1xyXG5cclxuICBsb2FkUHJvZmlsZSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXJJZCA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICBBUEkuZ2V0U2luZ2xlSXRlbShcInVzZXJzXCIsIGFjdGl2ZVVzZXJJZCkudGhlbih1c2VyID0+IHtcclxuICAgICAgY29uc3QgcHJvZmlsZVBpYyA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL29jdGFuZS5qcGdcIiwgXCJjbGFzc1wiOiBcIlwiIH0pXHJcbiAgICAgIGNvbnN0IG5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYE5hbWU6ICR7dXNlci5uYW1lfWApXHJcbiAgICAgIGNvbnN0IHVzZXJuYW1lID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvblwiIH0sIGBVc2VybmFtZTogJHt1c2VyLnVzZXJuYW1lfWApXHJcbiAgICAgIGNvbnN0IHBsYXllclByb2ZpbGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwicGxheWVyUHJvZmlsZVwiLCBcImNsYXNzXCI6IFwiY29udGFpbmVyXCIgfSwgbnVsbCwgcHJvZmlsZVBpYywgbmFtZSwgdXNlcm5hbWUpXHJcbiAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGxheWVyUHJvZmlsZSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJvZmlsZSIsImNsYXNzIHNob3RPbkdvYWwge1xyXG4gIHNldCBmaWVsZFgoZmllbGRYKSB7XHJcbiAgICB0aGlzLl9maWVsZFggPSBmaWVsZFhcclxuICB9XHJcbiAgc2V0IGZpZWxkWShmaWVsZFkpIHtcclxuICAgIHRoaXMuX2ZpZWxkWSA9IGZpZWxkWVxyXG4gIH1cclxuICBzZXQgZ29hbFgoZ29hbFgpIHtcclxuICAgIHRoaXMuX2dvYWxYID0gZ29hbFhcclxuICB9XHJcbiAgc2V0IGdvYWxZKGdvYWxZKSB7XHJcbiAgICB0aGlzLl9nb2FsWSA9IGdvYWxZXHJcbiAgfVxyXG4gIHNldCBhZXJpYWwoYWVyaWFsQm9vbGVhbikge1xyXG4gICAgdGhpcy5fYWVyaWFsID0gYWVyaWFsQm9vbGVhblxyXG4gIH1cclxuICBzZXQgYmFsbFNwZWVkKGJhbGxTcGVlZCkge1xyXG4gICAgdGhpcy5iYWxsX3NwZWVkID0gYmFsbFNwZWVkXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90T25Hb2FsIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90T25Hb2FsIGZyb20gXCIuL3Nob3RDbGFzc1wiXHJcblxyXG5sZXQgc2hvdENvdW50ZXIgPSAwO1xyXG5sZXQgZWRpdGluZ1Nob3QgPSBmYWxzZTsgLy9lZGl0aW5nIHNob3QgaXMgdXNlZCBmb3IgYm90aCBuZXcgYW5kIG9sZCBzaG90c1xyXG5sZXQgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxubGV0IHNob3RBcnJheSA9IFtdOyAvLyByZXNldCB3aGVuIGdhbWUgaXMgc2F2ZWRcclxubGV0IHByZXZpb3VzU2hvdE9iajsgLy8gZ2xvYmFsIHZhciB1c2VkIHdpdGggc2hvdCBlZGl0aW5nXHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFg7IC8vIGdsb2JhbCB2YXIgdXNlZCB3aXRoIHNob3QgZWRpdGluZ1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRZOyAvLyBnbG9iYWwgdmFyIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdEdvYWxYOyAvLyBnbG9iYWwgdmFyIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdEdvYWxZOyAvLyBnbG9iYWwgdmFyIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxuXHJcbmNvbnN0IHNob3REYXRhID0ge1xyXG5cclxuICByZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGdhbWVwbGF5IGlzIGNsaWNrZWQgb24gdGhlIG5hdmJhciAoZnJvbSBuYXZiYXIuanMpIGluIG9yZGVyIHRvIHByZXZlbnQgYnVncyB3aXRoIHByZXZpb3VzbHkgY3JlYXRlZCBzaG90c1xyXG4gICAgLy9UT0RPOiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBcIlNhdmUgR2FtZVwiXHJcbiAgICBzaG90Q291bnRlciA9IDA7XHJcbiAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHNob3RBcnJheSA9IFtdO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFggPSB1bmRlZmluZWQ7XHJcbiAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICB9LFxyXG5cclxuICBjcmVhdGVOZXdTaG90KCkge1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBzaG90T2JqID0gbmV3IHNob3RPbkdvYWw7XHJcblxyXG4gICAgLy8gcHJldmVudCB1c2VyIGZyb20gc2VsZWN0aW5nIGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgc2hvdERhdGEuZGlzYWJsZUVkaXRTaG90YnV0dG9ucyh0cnVlKTtcclxuXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBmaWVsZEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcbiAgICBnb2FsSW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3JkcylcclxuXHJcbiAgICAvLyBhY3RpdmF0ZSBjbGljayBmdW5jdGlvbmFsaXR5IGFuZCBjb25kaXRpb25hbCBzdGF0ZW1lbnRzIG9uIGJvdGggZmllbGQgYW5kIGdvYWwgaW1hZ2VzXHJcbiAgfSxcclxuXHJcbiAgZ2V0Q2xpY2tDb29yZHMoZSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBnZXRzIHRoZSByZWxhdGl2ZSB4IGFuZCB5IG9mIHRoZSBjbGljayB3aXRoaW4gdGhlIGZpZWxkIGltYWdlIGNvbnRhaW5lclxyXG4gICAgLy8gYW5kIHRoZW4gY2FsbHMgdGhlIGZ1bmN0aW9uIHRoYXQgYXBwZW5kcyBhIG1hcmtlciBvbiB0aGUgcGFnZVxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lcjtcclxuICAgIGlmIChlLnRhcmdldC5pZCA9PT0gXCJmaWVsZC1pbWdcIikge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwYXJlbnRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIH1cclxuICAgIC8vIG9mZnNldFggYW5kIFkgYXJlIHRoZSB4IGFuZCB5IGNvb3JkaW5hdGVzIChwaXhlbHMpIG9mIHRoZSBjbGljayBpbiB0aGUgY29udGFpbmVyXHJcbiAgICAvLyB0aGUgZXhwcmVzc2lvbnMgZGl2aWRlIHRoZSBjbGljayB4IGFuZCB5IGJ5IHRoZSBwYXJlbnQgZnVsbCB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICBjb25zdCB4Q29vcmRSZWxhdGl2ZSA9IE51bWJlcigoZS5vZmZzZXRYIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKS50b0ZpeGVkKDMpKVxyXG4gICAgY29uc3QgeUNvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4Q29vcmRSZWxhdGl2ZSwgeUNvb3JkUmVsYXRpdmUsIHBhcmVudENvbnRhaW5lcilcclxuICB9LFxyXG5cclxuICBtYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcikge1xyXG4gICAgbGV0IG1hcmtlcklkO1xyXG4gICAgaWYgKHBhcmVudENvbnRhaW5lci5pZCA9PT0gXCJmaWVsZC1pbWctcGFyZW50XCIpIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWZpZWxkXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBtYXJrZXJJZCA9IFwic2hvdC1tYXJrZXItZ29hbFwiO1xyXG4gICAgfVxyXG4gICAgLy8gYWRqdXN0IGZvciA1MCUgb2Ygd2lkdGggYW5kIGhlaWdodCBvZiBtYXJrZXIgc28gaXQncyBjZW50ZXJlZCBhYm91dCBtb3VzZSBwb2ludGVyXHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWCA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBsZXQgYWRqdXN0TWFya2VyWSA9IDEyLjUgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3MgTk9UIGFscmVhZHkgYSBtYXJrZXIsIHRoZW4gbWFrZSBvbmUgYW5kIHBsYWNlIGl0XHJcbiAgICBpZiAoIXBhcmVudENvbnRhaW5lci5jb250YWlucyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCkpKSB7XHJcbiAgICAgIHRoaXMuZ2VuZXJhdGVNYXJrZXIocGFyZW50Q29udGFpbmVyLCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZLCBtYXJrZXJJZCwgeCwgeSk7XHJcbiAgICAgIC8vIGVsc2UgbW92ZSB0aGUgZXhpc3RpbmcgbWFya2VyIHRvIHRoZSBuZXcgcG9zaXRpb25cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubW92ZU1hcmtlcihtYXJrZXJJZCwgeCwgeSwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSk7XHJcbiAgICB9XHJcbiAgICAvLyBzYXZlIGNvb3JkaW5hdGVzIHRvIG9iamVjdFxyXG4gICAgdGhpcy5hZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KVxyXG4gIH0sXHJcblxyXG4gIGdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpIHtcclxuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBkaXYuaWQgPSBtYXJrZXJJZDtcclxuICAgIGRpdi5zdHlsZS53aWR0aCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiMjVweFwiO1xyXG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwibGlnaHRncmVlblwiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XHJcbiAgICBkaXYuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCI1MCVcIjtcclxuICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgIGRpdi5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgZGl2LnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICAgIHBhcmVudENvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpO1xyXG4gIH0sXHJcblxyXG4gIG1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpIHtcclxuICAgIGNvbnN0IGN1cnJlbnRNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCk7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLmxlZnQgPSAoeCAtIGFkanVzdE1hcmtlclgpICogMTAwICsgXCIlXCI7XHJcbiAgICBjdXJyZW50TWFya2VyLnN0eWxlLnRvcCA9ICh5IC0gYWRqdXN0TWFya2VyWSkgKiAxMDAgKyBcIiVcIjtcclxuICB9LFxyXG5cclxuICBhZGRDb29yZHNUb0NsYXNzKG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHVwZGF0ZXMgdGhlIGluc3RhbmNlIG9mIHNob3RPbkdvYWwgY2xhc3MgdG8gcmVjb3JkIGNsaWNrIGNvb3JkaW5hdGVzXHJcbiAgICAvLyBpZiBhIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIGFwcGVuZCB0aGUgY29vcmRpbmF0ZXMgdG8gdGhlIG9iamVjdCBpbiBxdWVzdGlvblxyXG4gICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgLy8gdXNlIGdsb2JhbCB2YXJzIGluc3RlYWQgb2YgdXBkYXRpbmcgb2JqZWN0IGRpcmVjdGx5IGhlcmUgdG8gcHJldmVudCBhY2NpZGVudGFsIGVkaXRpbmcgb2YgbWFya2VyIHdpdGhvdXQgY2xpY2tpbmcgXCJzYXZlIHNob3RcIlxyXG4gICAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHg7XHJcbiAgICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIG90aGVyd2lzZSwgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBzbyBhcHBlbmQgY29vcmRpbmF0ZXMgdG8gdGhlIG5ldyBvYmplY3RcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChtYXJrZXJJZCA9PT0gXCJzaG90LW1hcmtlci1maWVsZFwiKSB7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZmllbGRZID0geTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzaG90T2JqLmdvYWxYID0geDtcclxuICAgICAgICBzaG90T2JqLmdvYWxZID0geTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNhbmNlbFNob3QoKSB7XHJcbiAgICBjb25zdCBidG5fbmV3U2hvdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmV3U2hvdFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG5cclxuICAgIGlmICghZWRpdGluZ1Nob3QpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgICBidG5fbmV3U2hvdC5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZCwgY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGlmIGEgcHJldmlvdXNseSBzYXZlZCBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBzZXQgZ2xvYmFsIHZhcnMgdG8gdW5kZWZpbmVkXHJcbiAgICAgIHByZXZpb3VzU2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBpZiAoZmllbGRNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdvYWxNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZSBjbGljayBsaXN0ZW5lcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIC8vIGNsZWFyIGZpZWxkIGFuZCBnb2FsIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICAvLyBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gc2F2ZSBjb3JyZWN0IG9iamVjdCAoaS5lLiBzaG90IGJlaW5nIGVkaXRlZCB2cy4gbmV3IHNob3QpXHJcbiAgICAgIC8vIGlmIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHByZXZpb3VzU2hvdE9iaiB3aWxsIG5vdCBiZSB1bmRlZmluZWRcclxuICAgICAgaWYgKHByZXZpb3VzU2hvdE9iaiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKHNlbF9hZXJpYWwudmFsdWUgPT09IFwiQWVyaWFsXCIpIHsgcHJldmlvdXNTaG90T2JqLl9hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHByZXZpb3VzU2hvdE9iai5fYWVyaWFsID0gZmFsc2UgfTtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZCA9IGlucHRfYmFsbFNwZWVkLnZhbHVlO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRYID0gcHJldmlvdXNTaG90RmllbGRYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZmllbGRZID0gcHJldmlvdXNTaG90RmllbGRZO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdE9iai5fZ29hbFggPSBwcmV2aW91c1Nob3RHb2FsWDtcclxuICAgICAgICBwcmV2aW91c1Nob3RPYmouX2dvYWxZID0gcHJldmlvdXNTaG90R29hbFk7XHJcbiAgICAgICAgLy8gZWxzZSBzYXZlIHRvIG5ldyBpbnN0YW5jZSBvZiBjbGFzcyBhbmQgYXBwZW5kIGJ1dHRvbiB0byBwYWdlIHdpdGggY29ycmVjdCBJRCBmb3IgZWRpdGluZ1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHNob3RPYmouYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBzaG90T2JqLmFlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgc2hvdE9iai5iYWxsU3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBzaG90QXJyYXkucHVzaChzaG90T2JqKTtcclxuICAgICAgICAvLyBhcHBlbmQgbmV3IGJ1dHRvblxyXG4gICAgICAgIHNob3RDb3VudGVyKys7XHJcbiAgICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtzaG90Q291bnRlcn1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke3Nob3RDb3VudGVyfWApO1xyXG4gICAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtzaG90Q291bnRlcn1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgICAgfVxyXG4gICAgICAvL1RPRE86IGFkZCBjb25kaXRpb24gdG8gcHJldmVudCBibGFuayBlbnRyaWVzIGFuZCBtaXNzaW5nIGNvb3JkaW5hdGVzXHJcblxyXG4gICAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICAgIHNlbF9hZXJpYWwudmFsdWUgPSBcIlN0YW5kYXJkXCI7XHJcbiAgICAgIC8vIGNhbmNlbCB0aGUgbmV3IGluc3RhbmNlIG9mIHNob3RDbGFzcyAobWF0dGVycyBpZiBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQpXHJcbiAgICAgIHNob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWQgKG1hdHRlcnMgaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkKVxyXG4gICAgICBwcmV2aW91c1Nob3RPYmogPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2F2ZWRTaG90KGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVmZXJlbmNlcyB0aGUgc2hvdEFycmF5IHRvIGdldCBhIHNob3Qgb2JqZWN0IHRoYXQgbWF0Y2hlcyB0aGUgc2hvdCMgYnV0dG9uIGNsaWNrZWQgKGUuZy4gc2hvdCAyIGJ1dHRvbiA9IGluZGV4IDEgb2YgdGhlIHNob3RBcnJheSlcclxuICAgIC8vIHRoZSBmdW5jdGlvbiAoYW5kIGl0cyBhc3NvY2lhdGVkIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gb3RoZXIgbG9jYWwgZnVuY3Rpb25zKSBoYXMgdGhlc2UgYmFzaWMgcmVxdWlyZW1lbnRzOlxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBjbGljayBsaXN0ZW5lcnMgb24gaW1hZ2VzXHJcbiAgICAvLyByZXZpdmUgYSBzYXZlZCBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgZm9yIGVkaXRpbmcgc2hvdCBjb29yZGluYXRlcywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbFxyXG4gICAgLy8gcmVuZGVyIG1hcmtlcnMgZm9yIGV4aXN0aW5nIGNvb3JkaW5hdGVzIG9uIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBzYXZlIGVkaXRzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIGNhbmNlbCBlZGl0c1xyXG4gICAgLy8gdGhlIGRhdGEgaXMgcmVuZGVyZWQgb24gdGhlIHBhZ2UgYW5kIGNhbiBiZSBzYXZlZCAob3ZlcndyaXR0ZW4pIGJ5IHVzaW5nIHRoZSBcInNhdmUgc2hvdFwiIGJ1dHRvbiBvciBjYW5jZWxlZCBieSBjbGlja2luZyB0aGUgXCJjYW5jZWwgc2hvdFwiIGJ1dHRvblxyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IG5ldyBzaG90IGJ1dHRvbiBmcm9tIGJlaW5nIGNsaWNrZWRcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIC8vIGFsbG93IGNhbmNlbCBhbmQgc2F2ZWQgYnV0dG9ucyB0byBiZSBjbGlja2VkXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICAvLyBnZXQgSUQgb2Ygc2hvdCMgYnRuIGNsaWNrZWQgYW5kIGFjY2VzcyBzaG90QXJyYXkgYXQgW2J0bklEIC0gMV1cclxuICAgIGxldCBidG5JZCA9IGUudGFyZ2V0LmlkLnNsaWNlKDUpO1xyXG4gICAgcHJldmlvdXNTaG90T2JqID0gc2hvdEFycmF5W2J0bklkIC0gMV07XHJcbiAgICAvLyByZW5kZXIgYmFsbCBzcGVlZCBhbmQgYWVyaWFsIGRyb3Bkb3duIGZvciB0aGUgc2hvdFxyXG4gICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBwcmV2aW91c1Nob3RPYmouYmFsbF9zcGVlZDtcclxuICAgIGlmIChwcmV2aW91c1Nob3RPYmouX2FlcmlhbCA9PT0gdHJ1ZSkgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJBZXJpYWxcIjsgfSBlbHNlIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjsgfVxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBmaWVsZCBhbmQgZ29hbFxyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIC8vIHJlbmRlciBzaG90IG1hcmtlciBvbiBmaWVsZFxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IHggPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFggKiBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IHkgPSAocHJldmlvdXNTaG90T2JqLl9maWVsZFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XHJcbiAgICBzaG90RGF0YS5tYXJrQ2xpY2tvbkltYWdlKHgsIHksIHBhcmVudENvbnRhaW5lcik7XHJcbiAgICAvLyByZW5kZXIgZ29hbCBtYXJrZXIgb24gZmllbGRcclxuICAgIHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWctcGFyZW50XCIpXHJcbiAgICB4ID0gTnVtYmVyKCgocHJldmlvdXNTaG90T2JqLl9nb2FsWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpO1xyXG4gICAgeSA9IE51bWJlcigoKHByZXZpb3VzU2hvdE9iai5fZ29hbFkgKiBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpLnRvRml4ZWQoMykpO1xyXG4gICAgc2hvdERhdGEubWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpO1xyXG5cclxuICB9LFxyXG5cclxuICBkaXNhYmxlRWRpdFNob3RidXR0b25zKGRpc2FibGVPck5vdCkge1xyXG4gICAgLy8gZm9yIGVhY2ggYnV0dG9uIGFmdGVyIFwiTmV3IFNob3RcIiwgXCJTYXZlIFNob3RcIiwgYW5kIFwiQ2FuY2VsIFNob3RcIiBkaXNhYmxlIHRoZSBidXR0b25zIGlmIHRoZSB1c2VyIGlzIGNyZWF0aW5nIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IHRydWUpIG9yIGVuYWJsZSB0aGVtIG9uIHNhdmUvY2FuY2VsIG9mIGEgbmV3IHNob3QgKGRpc2FibGVPck5vdCA9IGZhbHNlKVxyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG4gICAgbGV0IGVkaXRCdG47XHJcbiAgICBsZXQgbGVuZ3RoID0gc2hvdEJ0bkNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aFxyXG4gICAgZm9yIChsZXQgaSA9IDM7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICBlZGl0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtpIC0gMn1gKVxyXG4gICAgICBlZGl0QnRuLmRpc2FibGVkID0gZGlzYWJsZU9yTm90XHJcbiAgICB9XHJcblxyXG4gIH0sXHJcblxyXG4gIGdldFNob3RPYmplY3RzRm9yUG9zdCgpIHtcclxuICAgIHJldHVybiBzaG90QXJyYXlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90RGF0YSJdfQ==
