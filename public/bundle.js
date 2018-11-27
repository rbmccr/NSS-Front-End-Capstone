(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const URL = "http://localhost:8088";
const API = {
  getSingleItem(id, extension) {
    return fetch(`${URL}/${extension}/${id}`).then(data => data.json());
  },

  getAll(extension) {
    return fetch(`${URL}/${extension}`).then(data => data.json());
  },

  deleteSingleItem(id, extension) {
    return fetch(`${URL}/${extension}/${id}`, {
      method: "DELETE"
    }).then(e => e.json()).then(() => fetch(`${URL}/${extension}`)).then(e => e.json());
  },

  postSingleItem(obj, extension) {
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

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
let shotCounter = 0;
let newShotEditing = false;
const gameplay = {
  loadGameplay() {
    webpage.innerHTML = null;
    const activeUser = sessionStorage.getItem("activeUserId"); // const xButton = elBuilder("button", { "class": "delete" });
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
      "id": "_3v3",
      "class": "control"
    }, null, gameType3v3);
    const gameType2v2 = (0, _elementBuilder.default)("div", {
      "id": "_2v2",
      "class": "button"
    }, "2v2");
    const gameType2v2Control = (0, _elementBuilder.default)("div", {
      "id": "_2v2",
      "class": "control"
    }, null, gameType2v2);
    const gameType1v1 = (0, _elementBuilder.default)("div", {
      "id": "_1v1",
      "class": "button"
    }, "1v1");
    const gameType1v1Control = (0, _elementBuilder.default)("div", {
      "id": "_1v1",
      "class": "control"
    }, null, gameType1v1);
    const gameTypeButtonField = (0, _elementBuilder.default)("div", {
      "class": "field has-addons"
    }, null, gameType3v3Control, gameType2v2Control, gameType1v1Control);
    const gameTypeButtonContainer = (0, _elementBuilder.default)("div", {
      "class": "level-item"
    }, null, gameTypeButtonField); // game mode select

    const modeOption1 = (0, _elementBuilder.default)("option", {}, "Competitive");
    const modeOption2 = (0, _elementBuilder.default)("option", {}, "Casual");
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
    }, null, editPreviousGame, saveGame);
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
    const btn_1v1 = document.getElementById("_1v1"); // select dropdowns

    const sel_aerial = document.getElementById("aerialInput");
    const sel_gameMode = document.getElementById("gameModeInput");
    const sel_teamColor = document.getElementById("teamInput");
    const sel_overtime = document.getElementById("overtimeInput"); // input fields

    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const inpt_orangeScore = document.getElementById("orangeScoreInput");
    const inpt_blueScore = document.getElementById("blueScoreInput"); // add listeners

    btn_newShot.addEventListener("click", this.createNewShot);
    btn_saveShot.addEventListener("click", this.saveShot);
    btn_cancelShot.addEventListener("click", this.cancelshot);
  },

  createNewShot() {
    console.log("new shot"); // establish editing mode variable true
    // disable functionality of new shot btn if edit var = true
    // activate click functionality and conditional statements on both field and goal images
  },

  cancelShot() {
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput"); // reset editing mode var to false
    // clear clicked items in field and goal images

    inpt_ballSpeed.value = null;
    sel_aerial.value = "Standard";
  },

  saveShot() {
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");
    const shotBtnContainer = document.getElementById("shotControls");
    shotCounter++;
    const newShotBtn = (0, _elementBuilder.default)("button", {
      "id": `shot${shotCounter}`,
      "class": "button is-link"
    }, `Shot ${shotCounter}`);
    shotBtnContainer.appendChild(newShotBtn);
    inpt_ballSpeed.value = null;
    sel_aerial.value = "Standard";
  }

};
var _default = gameplay;
exports.default = _default;

},{"./elementBuilder":2}],4:[function(require,module,exports){
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

          _API.default.postSingleItem(newUser, "users").then(user => {
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

},{"./API":1,"./elementBuilder":2,"./navbar":6}],5:[function(require,module,exports){
"use strict";

var _navbar = _interopRequireDefault(require("./navbar"));

var _gameplay = _interopRequireDefault(require("./gameplay"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// function closeBox(e) {
//   if (e.target.classList.contains("delete")) {
//     e.target.parentNode.style.display = "none";
//   }
// }
_navbar.default.generateNavbar(); // navbar.generateNavbar(true)
// gameplay.loadGameplay()

},{"./gameplay":3,"./navbar":6}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _elementBuilder = _interopRequireDefault(require("./elementBuilder"));

var _login = _interopRequireDefault(require("./login"));

var _profile = _interopRequireDefault(require("./profile"));

var _gameplay = _interopRequireDefault(require("./gameplay"));

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
    }
  }

};
var _default = navbar;
exports.default = _default;

},{"./elementBuilder":2,"./gameplay":3,"./login":4,"./profile":7}],7:[function(require,module,exports){
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
    const activeUser = sessionStorage.getItem("activeUserId");

    _API.default.getSingleItem(activeUser, "users").then(user => {
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

},{"./API":1,"./elementBuilder":2}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zY3JpcHRzL0FQSS5qcyIsIi4uL3NjcmlwdHMvZWxlbWVudEJ1aWxkZXIuanMiLCIuLi9zY3JpcHRzL2dhbWVwbGF5LmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsTUFBTSxHQUFHLEdBQUcsdUJBQVo7QUFFQSxNQUFNLEdBQUcsR0FBRztBQUVWLEVBQUEsYUFBYSxDQUFDLEVBQUQsRUFBSyxTQUFMLEVBQWdCO0FBQzNCLFdBQU8sS0FBSyxDQUFFLEdBQUUsR0FBSSxJQUFHLFNBQVUsSUFBRyxFQUFHLEVBQTNCLENBQUwsQ0FBbUMsSUFBbkMsQ0FBd0MsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFMLEVBQWhELENBQVA7QUFDRCxHQUpTOztBQU1WLEVBQUEsTUFBTSxDQUFDLFNBQUQsRUFBWTtBQUNoQixXQUFPLEtBQUssQ0FBRSxHQUFFLEdBQUksSUFBRyxTQUFVLEVBQXJCLENBQUwsQ0FBNkIsSUFBN0IsQ0FBa0MsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFMLEVBQTFDLENBQVA7QUFDRCxHQVJTOztBQVVWLEVBQUEsZ0JBQWdCLENBQUMsRUFBRCxFQUFLLFNBQUwsRUFBZ0I7QUFDOUIsV0FBTyxLQUFLLENBQUUsR0FBRSxHQUFJLElBQUcsU0FBVSxJQUFHLEVBQUcsRUFBM0IsRUFBOEI7QUFDeEMsTUFBQSxNQUFNLEVBQUU7QUFEZ0MsS0FBOUIsQ0FBTCxDQUdKLElBSEksQ0FHQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUYsRUFITixFQUlKLElBSkksQ0FJQyxNQUFNLEtBQUssQ0FBRSxHQUFFLEdBQUksSUFBRyxTQUFVLEVBQXJCLENBSlosRUFLSixJQUxJLENBS0MsQ0FBQyxJQUFJ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eUIsVUFBN0IsRUFBeUM7QUFDdkMsd0JBQVMsWUFBVDtBQUNEO0FBQ0Y7O0FBMUZZLENBQWY7ZUE4RmUsTTs7Ozs7Ozs7Ozs7QUN0SGY7O0FBQ0E7Ozs7QUFFQSxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixrQkFBeEIsQ0FBaEI7QUFFQSxNQUFNLE9BQU8sR0FBRztBQUVkLEVBQUEsV0FBVyxHQUFHO0FBQ1osSUFBQSxPQUFPLENBQUMsU0FBUixHQUFvQixJQUFwQjtBQUNBLFVBQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxPQUFmLENBQXVCLGNBQXZCLENBQW5COztBQUNBLGlCQUFJLGFBQUosQ0FBa0IsVUFBbEIsRUFBOEIsT0FBOUIsRUFBdUMsSUFBdkMsQ0FBNEMsSUFBSSxJQUFJO0FBQ2xELFlBQU0sVUFBVSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxlQUFPLG1CQUFUO0FBQThCLGlCQUFTO0FBQXZDLE9BQWpCLENBQW5CO0FBQ0EsWUFBTSxJQUFJLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGlCQUFTO0FBQVgsT0FBakIsRUFBK0MsU0FBUSxJQUFJLENBQUMsSUFBSyxFQUFqRSxDQUFiO0FBQ0EsWUFBTSxRQUFRLEdBQUcsNkJBQVUsS0FBVixFQUFpQjtBQUFFLGlCQUFTO0FBQVgsT0FBakIsRUFBK0MsYUFBWSxJQUFJLENBQUMsUUFBUyxFQUF6RSxDQUFqQjtBQUNBLFlBQU0sYUFBYSxHQUFHLDZCQUFVLEtBQVYsRUFBaUI7QUFBRSxjQUFNLGVBQVI7QUFBeUIsaUJBQVM7QUFBbEMsT0FBakIsRUFBa0UsSUFBbEUsRUFBd0UsVUFBeEUsRUFBb0YsSUFBcEYsRUFBMEYsUUFBMUYsQ0FBdEI7QUFDQSxNQUFBLE9BQU8sQ0FBQyxXQUFSLENBQW9CLGFBQXBCO0FBQ0QsS0FORDtBQU9EOztBQVphLENBQWhCO2VBZ0JlLE8iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBVUkwgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4OFwiXHJcblxyXG5jb25zdCBBUEkgPSB7XHJcblxyXG4gIGdldFNpbmdsZUl0ZW0oaWQsIGV4dGVuc2lvbikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGdldEFsbChleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApLnRoZW4oZGF0YSA9PiBkYXRhLmpzb24oKSlcclxuICB9LFxyXG5cclxuICBkZWxldGVTaW5nbGVJdGVtKGlkLCBleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufS8ke2lkfWAsIHtcclxuICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gICAgICAudGhlbigoKSA9PiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWApKVxyXG4gICAgICAudGhlbihlID0+IGUuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIHBvc3RTaW5nbGVJdGVtKG9iaiwgZXh0ZW5zaW9uKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn1gLCB7XHJcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShvYmopXHJcbiAgICB9KVxyXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQVBJIiwiZnVuY3Rpb24gZWxCdWlsZGVyKG5hbWUsIGF0dHJpYnV0ZXNPYmosIHR4dCwgLi4uY2hpbGRyZW4pIHtcclxuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgZm9yIChsZXQgYXR0ciBpbiBhdHRyaWJ1dGVzT2JqKSB7XHJcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ciwgYXR0cmlidXRlc09ialthdHRyXSk7XHJcbiAgfVxyXG4gIGVsLnRleHRDb250ZW50ID0gdHh0IHx8IG51bGw7XHJcbiAgY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcbiAgICBlbC5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbiAgfSlcclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGVsQnVpbGRlciIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuXHJcbmxldCBzaG90Q291bnRlciA9IDA7XHJcbmxldCBuZXdTaG90RWRpdGluZyA9IGZhbHNlO1xyXG5cclxuY29uc3QgZ2FtZXBsYXkgPSB7XHJcblxyXG4gIGxvYWRHYW1lcGxheSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXIgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgLy8gY29uc3QgeEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJkZWxldGVcIiB9KTtcclxuICAgIC8vIHhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQm94LCBldmVudCk7IC8vIGJ1dHRvbiB3aWxsIGRpc3BsYXk6IG5vbmUgb24gcGFyZW50IGNvbnRhaW5lclxyXG4gICAgLy8gY29uc3QgaGVhZGVySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb24gaXMtaW5mb1wiIH0sIFwiQ3JlYXRlIGFuZCBzYXZlIHNob3RzIC0gdGhlbiBzYXZlIHRoZSBnYW1lIHJlY29yZC5cIiwgeEJ1dHRvbik7XHJcbiAgICAvLyB3ZWJwYWdlLmFwcGVuZENoaWxkKGhlYWRlckluZm8pO1xyXG4gICAgdGhpcy5idWlsZFNob3RDb250ZW50KCk7XHJcbiAgICB0aGlzLmJ1aWxkR2FtZUNvbnRlbnQoKTtcclxuICAgIHRoaXMuZ2FtZXBsYXlFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBidWlsZFNob3RDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgc2hvdCBjb250YWluZXJzIGFuZCBhZGRzIGNvbnRhaW5lciBjb250ZW50XHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBzaG90VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBTaG90IERhdGFcIik7XHJcbiAgICBjb25zdCBzaG90VGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90VGl0bGUpO1xyXG5cclxuICAgIC8vIG5ldyBzaG90IGFuZCBzYXZlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3QgbmV3U2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJuZXdTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiTmV3IFNob3RcIik7XHJcbiAgICBjb25zdCBzYXZlU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgU2hvdFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbFNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIFNob3RcIik7XHJcbiAgICBjb25zdCBzaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJzaG90Q29udHJvbHNcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gYnV0dG9uc1wiIH0sIG51bGwsIG5ld1Nob3QsIHNhdmVTaG90LCBjYW5jZWxTaG90KTtcclxuICAgIGNvbnN0IGFsaWduU2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIHNob3RCdXR0b25zKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnblNob3RCdXR0b25zKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGlucHV0IGFuZCBhZXJpYWwgc2VsZWN0XHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJhbGwgc3BlZWQgKGtwaCk6XCIpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZElucHV0XCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGlucHV0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBiYWxsIHNwZWVkXCIgfSk7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiYWVyaWFsSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbE9wdGlvbjEsIGFlcmlhbE9wdGlvbjIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdCk7XHJcbiAgICBjb25zdCBhZXJpYWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdFBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgYmFsbFNwZWVkSW5wdXRUaXRsZSwgYmFsbFNwZWVkSW5wdXQsIGFlcmlhbENvbnRyb2wpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90RGV0YWlscyk7XHJcblxyXG4gICAgLy8gZmllbGQgYW5kIGdvYWwgaW1hZ2VzIChub3RlIGZpZWxkLWltZyBpcyBjbGlwcGVkIHRvIHJlc3RyaWN0IGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgaW4gbGF0ZXIgZnVuY3Rpb24uXHJcbiAgICAvLyBnb2FsLWltZyB1c2VzIGFuIHgveSBmb3JtdWxhIGZvciBjbGljayBhcmVhIGNvb3JkaW5hdGVzIHJlc3RyaWN0aW9uLCBzaW5jZSBpdCdzIGEgcmVjdGFuZ2xlKVxyXG4gICAgLy8gYWRkaXRpb25hbGx5LCBmaWVsZCBhbmQgZ29hbCBhcmUgbm90IGFsaWduZWQgd2l0aCBsZXZlbC1sZWZ0IG9yIGxldmVsLXJpZ2h0IC0gaXQncyBhIGRpcmVjdCBsZXZlbCAtLT4gbGV2ZWwtaXRlbSBmb3IgY2VudGVyaW5nXHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IHNob3RDb29yZGluYXRlc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBzaG90VGl0bGVDb250YWluZXIsIHNob3RCdXR0b25Db250YWluZXIsIHNob3REZXRhaWxzQ29udGFpbmVyLCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIpXHJcblxyXG4gICAgLy8gYXBwZW5kIHNob3RzIGNvbnRhaW5lciB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2FtZUNvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGNyZWF0ZXMgZ2FtZSBjb250ZW50IGNvbnRhaW5lcnMgKHRlYW0sIGdhbWUgdHlwZSwgZ2FtZSBtb2RlLCBldGMuKVxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3QgZ2FtZVRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgR2FtZSBEYXRhXCIpO1xyXG4gICAgY29uc3QgdGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVGl0bGUpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gdG9wIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIDF2MS8ydjIvM3YzIGJ1dHRvbnMgKG5vdGU6IGNvbnRyb2wgY2xhc3MgaXMgdXNlZCB3aXRoIGZpZWxkIHRvIGFkaGVyZSBidXR0b25zIHRvZ2V0aGVyKVxyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTN2M0NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlM3YzKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiMnYyXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjJDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTJ2Mik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUxdjEpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBoYXMtYWRkb25zXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjNDb250cm9sLCBnYW1lVHlwZTJ2MkNvbnRyb2wsIGdhbWVUeXBlMXYxQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25GaWVsZCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIHNlbGVjdFxyXG4gICAgY29uc3QgbW9kZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImdhbWVNb2RlSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVPcHRpb24xLCBtb2RlT3B0aW9uMik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVTZWxlY3QpO1xyXG4gICAgY29uc3QgbW9kZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgbW9kZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gdGVhbSBzZWxlY3RcclxuICAgIGNvbnN0IHRlYW1PcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9yYW5nZSB0ZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQmx1ZSBUZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJ0ZWFtSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1PcHRpb24xLCB0ZWFtT3B0aW9uMik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1TZWxlY3QpO1xyXG4gICAgY29uc3QgdGVhbUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgdGVhbVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWUgc2VsZWN0XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gb3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJvdmVydGltZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZU9wdGlvbjEsIG92ZXJ0aW1lT3B0aW9uMik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdCk7XHJcbiAgICBjb25zdCBvdmVydGltZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gYm90dG9tIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIHNjb3JlIGlucHV0c1xyXG4gICAgLy8gKioqKk5vdGUgaW5saW5lIHN0eWxpbmcgb2YgaW5wdXQgd2lkdGhzXHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiT3JhbmdlIHRlYW0gc2NvcmU6XCIpO1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm9yYW5nZVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgb3JhbmdlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCBvcmFuZ2VTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiQmx1ZSB0ZWFtIHNjb3JlOlwiKVxyXG4gICAgY29uc3QgYmx1ZVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJibHVlU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBibHVlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgYmx1ZVNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3Qgc2NvcmVJbnB1dENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgb3JhbmdlU2NvcmVJbnB1dFRpdGxlLCBvcmFuZ2VTY29yZUNvbnRyb2wsIGJsdWVTY29yZUlucHV0VGl0bGUsIGJsdWVTY29yZUNvbnRyb2wpO1xyXG5cclxuICAgIC8vIGVkaXQvc2F2ZSBnYW1lIGJ1dHRvbnNcclxuICAgIGNvbnN0IGVkaXRQcmV2aW91c0dhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZWRpdFByZXZHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJFZGl0IFByZXZpb3VzIEdhbWVcIik7XHJcbiAgICBjb25zdCBzYXZlR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlR2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgR2FtZVwiKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25BbGlnbm1lbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9ucyBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZWRpdFByZXZpb3VzR2FtZSwgc2F2ZUdhbWUpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1yaWdodFwiIH0sIG51bGwsIGdhbWVCdXR0b25BbGlnbm1lbnQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyVG9wID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25Db250YWluZXIsIG1vZGVDb250cm9sLCB0ZWFtQ29udHJvbCwgb3ZlcnRpbWVDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJCb3R0b20gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzY29yZUlucHV0Q29udGFpbmVyLCBnYW1lQnV0dG9uQ29udGFpbmVyKTtcclxuICAgIGNvbnN0IHBhcmVudEdhbWVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHRpdGxlQ29udGFpbmVyLCBnYW1lQ29udGFpbmVyVG9wLCBnYW1lQ29udGFpbmVyQm90dG9tKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50R2FtZUNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlFdmVudE1hbmFnZXIoKSB7XHJcblxyXG4gICAgLy8gYnV0dG9uc1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZVNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2NhbmNlbFNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbmNlbFNob3RcIik7XHJcbiAgICBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG5cclxuICAgIC8vIHNlbGVjdCBkcm9wZG93bnNcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2dhbWVNb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lTW9kZUlucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX3RlYW1Db2xvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG5cclxuICAgIC8vIGlucHV0IGZpZWxkc1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3QgaW5wdF9vcmFuZ2VTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3JhbmdlU2NvcmVJbnB1dFwiKTtcclxuICAgIGNvbnN0IGlucHRfYmx1ZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJibHVlU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzXHJcbiAgICBidG5fbmV3U2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jcmVhdGVOZXdTaG90KTtcclxuICAgIGJ0bl9zYXZlU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zYXZlU2hvdCk7XHJcbiAgICBidG5fY2FuY2VsU2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5jYW5jZWxzaG90KTtcclxuXHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlTmV3U2hvdCgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwibmV3IHNob3RcIilcclxuICAgIC8vIGVzdGFibGlzaCBlZGl0aW5nIG1vZGUgdmFyaWFibGUgdHJ1ZVxyXG4gICAgLy8gZGlzYWJsZSBmdW5jdGlvbmFsaXR5IG9mIG5ldyBzaG90IGJ0biBpZiBlZGl0IHZhciA9IHRydWVcclxuICAgIC8vIGFjdGl2YXRlIGNsaWNrIGZ1bmN0aW9uYWxpdHkgYW5kIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgb24gYm90aCBmaWVsZCBhbmQgZ29hbCBpbWFnZXNcclxuICB9LFxyXG5cclxuICBjYW5jZWxTaG90KCkge1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICAvLyByZXNldCBlZGl0aW5nIG1vZGUgdmFyIHRvIGZhbHNlXHJcbiAgICAvLyBjbGVhciBjbGlja2VkIGl0ZW1zIGluIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gICAgaW5wdF9iYWxsU3BlZWQudmFsdWUgPSBudWxsO1xyXG4gICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGlucHRfYmFsbFNwZWVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWxsU3BlZWRJbnB1dFwiKTtcclxuICAgIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2hvdEJ0bkNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdENvbnRyb2xzXCIpO1xyXG5cclxuICAgIHNob3RDb3VudGVyKys7XHJcblxyXG5cclxuICAgIGNvbnN0IG5ld1Nob3RCdG4gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwge1wiaWRcIjpgc2hvdCR7c2hvdENvdW50ZXJ9YCwgXCJjbGFzc1wiOlwiYnV0dG9uIGlzLWxpbmtcIn0sIGBTaG90ICR7c2hvdENvdW50ZXJ9YClcclxuICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICBpbnB0X2JhbGxTcGVlZC52YWx1ZSA9IG51bGw7XHJcbiAgICBzZWxfYWVyaWFsLnZhbHVlID0gXCJTdGFuZGFyZFwiO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVwbGF5IiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuaW1wb3J0IG5hdmJhciBmcm9tIFwiLi9uYXZiYXJcIlxyXG5cclxuY29uc3Qgd2VicGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLW1hc3RlclwiKTtcclxuY29uc3Qgd2VicGFnZU5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2LW1hc3RlclwiKTtcclxuXHJcbmNvbnN0IGxvZ2luT3JTaWdudXAgPSB7XHJcblxyXG4gIC8vIGJ1aWxkIGEgbG9naW4gZm9ybSB0aGF0IHZhbGlkYXRlcyB1c2VyIGlucHV0LiBTdWNjZXNzZnVsIGxvZ2luIHN0b3JlcyB1c2VyIGlkIGluIHNlc3Npb24gc3RvcmFnZVxyXG4gIGxvZ2luRm9ybSgpIHtcclxuICAgIGNvbnN0IGxvZ2luSW5wdXRfdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ1c2VybmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciB1c2VybmFtZVwiIH0pO1xyXG4gICAgY29uc3QgbG9naW5JbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInBhc3N3b3JkXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBwYXNzd29yZFwiIH0pO1xyXG4gICAgY29uc3QgbG9naW5CdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwibG9naW5Ob3dcIiwgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpbiBub3dcIik7XHJcbiAgICBjb25zdCBsb2dpbkZvcm0gPSBlbEJ1aWxkZXIoXCJmb3JtXCIsIHsgXCJpZFwiOiBcImxvZ2luRm9ybVwiLCBcImNsYXNzXCI6IFwiYm94XCIgfSwgbnVsbCwgbG9naW5JbnB1dF91c2VybmFtZSwgbG9naW5JbnB1dF9wYXNzd29yZCwgbG9naW5CdXR0b24pO1xyXG5cclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQobG9naW5Gb3JtKVxyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKClcclxuICB9LFxyXG5cclxuICBzaWdudXBGb3JtKCkge1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfbmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm5hbWVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgbmFtZVwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJ1c2VybmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciB1c2VybmFtZVwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfcGFzc3dvcmQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJwYXNzd29yZElucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBwYXNzd29yZFwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwSW5wdXRfY29uZmlybSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImNvbmZpcm1QYXNzd29yZFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwidGV4dFwiLCBcInBsYWNlaG9sZGVyXCI6IFwiY29uZmlybSBwYXNzd29yZFwiIH0pO1xyXG4gICAgY29uc3Qgc2lnbnVwQnV0dG9uID0gZWxCdWlsZGVyKFwiYnV0dG9uXCIsIHsgXCJpZFwiOiBcInNpZ251cE5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXAgbm93XCIpO1xyXG4gICAgY29uc3Qgc2lnbnVwRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwic2lnbnVwRm9ybVwiLCBcImNsYXNzXCI6IFwiYm94XCIgfSwgbnVsbCwgc2lnbnVwSW5wdXRfbmFtZSwgc2lnbnVwSW5wdXRfdXNlcm5hbWUsIHNpZ251cElucHV0X3Bhc3N3b3JkLCBzaWdudXBJbnB1dF9jb25maXJtLCBzaWdudXBCdXR0b24pO1xyXG5cclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQoc2lnbnVwRm9ybSlcclxuICAgIHRoaXMudXNlckV2ZW50TWFuYWdlcigpXHJcbiAgfSxcclxuXHJcbiAgLy8gYXNzaWduIGV2ZW50IGxpc3RlbmVycyBiYXNlZCBvbiB3aGljaCBmb3JtIGlzIG9uIHRoZSB3ZWJwYWdlXHJcbiAgdXNlckV2ZW50TWFuYWdlcigpIHtcclxuICAgIGNvbnN0IGxvZ2luTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2dpbk5vd1wiKVxyXG4gICAgY29uc3Qgc2lnbnVwTm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaWdudXBOb3dcIilcclxuICAgIGlmIChsb2dpbk5vdyA9PT0gbnVsbCkge1xyXG4gICAgICBzaWdudXBOb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2lnbnVwVXNlciwgZXZlbnQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2dpbk5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpblVzZXIsIGV2ZW50KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIHZhbGlkYXRlIHVzZXIgbG9naW4gZm9ybSBpbnB1dHMgYmVmb3JlIGxvZ2dpbmcgaW5cclxuICBsb2dpblVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc3QgdXNlcm5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IHBhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBpZiAodXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKHBhc3N3b3JkID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChcInVzZXJzXCIpLnRoZW4odXNlcnMgPT4gdXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcclxuICAgICAgICAvLyB2YWxpZGF0ZSB1c2VybmFtZSBhbmQgcGFzc3dvcmRcclxuICAgICAgICBpZiAodXNlci51c2VybmFtZS50b0xvd2VyQ2FzZSgpID09PSB1c2VybmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICBpZiAodXNlci5wYXNzd29yZCA9PT0gcGFzc3dvcmQpIHtcclxuICAgICAgICAgICAgbG9naW5PclNpZ251cC5sb2dpblN0YXR1c0FjdGl2ZSh1c2VyKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzaWdudXBVc2VyKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICBjb25zdCBfbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmFtZUlucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBfdXNlcm5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF9wYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFzc3dvcmRJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgY29uZmlybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29uZmlybVBhc3N3b3JkXCIpLnZhbHVlXHJcbiAgICBsZXQgdW5pcXVlVXNlcm5hbWUgPSB0cnVlOyAvL2NoYW5nZXMgdG8gZmFsc2UgaWYgdXNlcm5hbWUgYWxyZWFkeSBleGlzdHNcclxuICAgIGlmIChfbmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3VzZXJuYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfcGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKGNvbmZpcm0gPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCAhPT0gY29uZmlybSkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIEFQSS5nZXRBbGwoXCJ1c2Vyc1wiKS50aGVuKHVzZXJzID0+IHVzZXJzLmZvckVhY2goKHVzZXIsIGlkeCkgPT4ge1xyXG4gICAgICAgIC8vIGNoZWNrIGZvciBleGlzdGluZyB1c2VybmFtZSBpbiBkYXRhYmFzZVxyXG4gICAgICAgIGlmICh1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IF91c2VybmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICB1bmlxdWVVc2VybmFtZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2F0IHRoZSBlbmQgb2YgdGhlIGxvb3AsIHBvc3RcclxuICAgICAgICBpZiAoaWR4ID09PSB1c2Vycy5sZW5ndGggLSAxICYmIHVuaXF1ZVVzZXJuYW1lKSB7XHJcbiAgICAgICAgICBsZXQgbmV3VXNlciA9IHtcclxuICAgICAgICAgICAgbmFtZTogX25hbWUsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiBfdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBfcGFzc3dvcmQsXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgQVBJLnBvc3RTaW5nbGVJdGVtKG5ld1VzZXIsIFwidXNlcnNcIikudGhlbih1c2VyID0+IHtcclxuICAgICAgICAgICAgbG9naW5PclNpZ251cC5sb2dpblN0YXR1c0FjdGl2ZSh1c2VyKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oXCJhY3RpdmVVc2VySWRcIiwgdXNlci5pZCk7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSk7IC8vYnVpbGQgbG9nZ2VkIGluIHZlcnNpb24gb2YgbmF2YmFyXHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0VXNlcigpIHtcclxuICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oXCJhY3RpdmVVc2VySWRcIik7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICB3ZWJwYWdlTmF2LmlubmVySFRNTCA9IG51bGw7XHJcbiAgICBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoZmFsc2UpOyAvL2J1aWxkIGxvZ2dlZCBvdXQgdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsb2dpbk9yU2lnbnVwIiwiaW1wb3J0IG5hdmJhciBmcm9tIFwiLi9uYXZiYXJcIlxyXG5pbXBvcnQgZ2FtZXBsYXkgZnJvbSBcIi4vZ2FtZXBsYXlcIlxyXG5cclxuLy8gZnVuY3Rpb24gY2xvc2VCb3goZSkge1xyXG4vLyAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJkZWxldGVcIikpIHtcclxuLy8gICAgIGUudGFyZ2V0LnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxubmF2YmFyLmdlbmVyYXRlTmF2YmFyKClcclxuLy8gbmF2YmFyLmdlbmVyYXRlTmF2YmFyKHRydWUpXHJcbi8vIGdhbWVwbGF5LmxvYWRHYW1lcGxheSgpIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBsb2dpbk9yU2lnbnVwIGZyb20gXCIuL2xvZ2luXCJcclxuaW1wb3J0IHByb2ZpbGUgZnJvbSBcIi4vcHJvZmlsZVwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuLypcclxuICBCdWxtYSBuYXZiYXIgc3RydWN0dXJlOlxyXG4gIDxuYXY+XHJcbiAgICA8bmF2YmFyLWJyYW5kPlxyXG4gICAgICA8bmF2YmFyLWJ1cmdlcj4gKG9wdGlvbmFsKVxyXG4gICAgPC9uYXZiYXItYnJhbmQ+XHJcbiAgICA8bmF2YmFyLW1lbnU+XHJcbiAgICAgIDxuYXZiYXItc3RhcnQ+XHJcbiAgICAgIDwvbmF2YmFyLXN0YXJ0PlxyXG4gICAgICA8bmF2YmFyLWVuZD5cclxuICAgICAgPC9uYXZiYXItZW5kPlxyXG4gICAgPC9uYXZiYXItbWVudT5cclxuICA8L25hdj5cclxuXHJcbiAgVGhlIGZ1bmN0aW9ucyBiZWxvdyBidWlsZCB0aGUgbmF2YmFyIGZyb20gdGhlIGluc2lkZSBvdXRcclxuKi9cclxuXHJcbmNvbnN0IG5hdmJhciA9IHtcclxuXHJcbiAgZ2VuZXJhdGVOYXZiYXIobG9nZ2VkSW5Cb29sZWFuKSB7XHJcblxyXG4gICAgLy8gbmF2YmFyLW1lbnUgKHJpZ2h0IHNpZGUgb2YgbmF2YmFyIC0gYXBwZWFycyBvbiBkZXNrdG9wIDEwMjRweCspXHJcbiAgICBjb25zdCBidXR0b24yID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiTG9naW5cIilcclxuICAgIGNvbnN0IGJ1dHRvbjEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJTaWduIHVwXCIpXHJcbiAgICBjb25zdCBidXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uc1wiIH0sIG51bGwsIGJ1dHRvbjEsIGJ1dHRvbjIpXHJcbiAgICBjb25zdCBtZW51SXRlbTEgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBudWxsLCBidXR0b25Db250YWluZXIpXHJcbiAgICBjb25zdCBuYXZiYXJFbmQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWVuZFwiIH0sIG51bGwsIG1lbnVJdGVtMSlcclxuICAgIGNvbnN0IG5hdmJhclN0YXJ0ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1zdGFydFwiIH0pXHJcbiAgICBjb25zdCBuYXZiYXJNZW51ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIm5hdmJhck1lbnVcIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1tZW51XCIgfSwgbnVsbCwgbmF2YmFyU3RhcnQsIG5hdmJhckVuZClcclxuXHJcbiAgICAvLyBuYXZiYXItYnJhbmQgKGxlZnQgc2lkZSBvZiBuYXZiYXIgLSBpbmNsdWRlcyBtb2JpbGUgaGFtYnVyZ2VyIG1lbnUpXHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjEgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMiA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4zID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZENoaWxkMiA9IGVsQnVpbGRlcihcImFcIiwgeyBcInJvbGVcIjogXCJidXR0b25cIiwgXCJjbGFzc1wiOiBcIm5hdmJhci1idXJnZXIgYnVyZ2VyXCIsIFwiYXJpYS1sYWJlbFwiOiBcIm1lbnVcIiwgXCJhcmlhLWV4cGFuZGVkXCI6IFwiZmFsc2VcIiwgXCJkYXRhLXRhcmdldFwiOiBcIm5hdmJhck1lbnVcIiB9LCBudWxsLCBidXJnZXJNZW51U3BhbjEsIGJ1cmdlck1lbnVTcGFuMiwgYnVyZ2VyTWVudVNwYW4zKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQxID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiLCBcImhyZWZcIjogXCIjXCIgfSwgbnVsbCwgZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvZmlyZTkwZGVnLnBuZ1wiLCBcIndpZHRoXCI6IFwiMTEyXCIsIFwiaGVpZ2h0XCI6IFwiMjhcIiB9KSk7XHJcbiAgICBjb25zdCBuYXZiYXJCcmFuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItYnJhbmRcIiB9LCBudWxsLCBuYXZiYXJCcmFuZENoaWxkMSwgbmF2YmFyQnJhbmRDaGlsZDIpO1xyXG5cclxuICAgIC8vIG5hdiAocGFyZW50IG5hdiBIVE1MIGVsZW1lbnQpXHJcbiAgICBjb25zdCBuYXYgPSBlbEJ1aWxkZXIoXCJuYXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyXCIsIFwicm9sZVwiOiBcIm5hdmlnYXRpb25cIiwgXCJhcmlhLWxhYmVsXCI6IFwibWFpbiBuYXZpZ2F0aW9uXCIgfSwgbnVsbCwgbmF2YmFyQnJhbmQsIG5hdmJhck1lbnUpO1xyXG5cclxuICAgIC8vIGlmIGxvZ2dlZCBpbiwgYXBwZW5kIGFkZGl0aW9uYWwgbWVudSBvcHRpb25zIHRvIG5hdmJhciBhbmQgcmVtb3ZlIHNpZ251cC9sb2dpbiBidXR0b25zXHJcbiAgICBpZiAobG9nZ2VkSW5Cb29sZWFuKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBsb2cgaW4gYW5kIHNpZ24gdXAgYnV0dG9uc1xyXG4gICAgICBjb25zdCBzaWdudXAgPSBidXR0b25Db250YWluZXIuY2hpbGROb2Rlc1swXVxyXG4gICAgICBjb25zdCBsb2dpbiA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzFdXHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChzaWdudXApXHJcbiAgICAgIGJ1dHRvbkNvbnRhaW5lci5yZW1vdmVDaGlsZChsb2dpbilcclxuICAgICAgLy8gYWRkIGxvZ291dCBidXR0b25cclxuICAgICAgY29uc3QgYnV0dG9uMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ291dFwiKVxyXG4gICAgICBidXR0b25Db250YWluZXIuYXBwZW5kQ2hpbGQoYnV0dG9uMylcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhbmQgYXBwZW5kIG5ldyBtZW51IGl0ZW1zIGZvciB1c2VyXHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJQcm9maWxlXCIpXHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJHYW1lcGxheVwiKVxyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW0zID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiSGVhdG1hcHNcIilcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtNCA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkxlYWRlcmJvYXJkXCIpXHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpXHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTIpXHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTMpXHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBuYXZiYXJcclxuICAgIHRoaXMubmF2YmFyRXZlbnRNYW5hZ2VyKG5hdilcclxuXHJcbiAgICAvLyBhcHBlbmQgdG8gd2VicGFnZVxyXG4gICAgd2VicGFnZU5hdi5hcHBlbmRDaGlsZChuYXYpXHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpbkNsaWNrZWQsIGV2ZW50KVxyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNpZ251cENsaWNrZWQsIGV2ZW50KVxyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ291dENsaWNrZWQsIGV2ZW50KVxyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByb2ZpbGVDbGlja2VkLCBldmVudClcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5nYW1lcGxheUNsaWNrZWQsIGV2ZW50KVxyXG4gIH0sXHJcblxyXG4gIGxvZ2luQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9naW5cIikge1xyXG4gICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luRm9ybSgpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAuc2lnbnVwRm9ybSgpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9nb3V0Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiTG9nb3V0XCIpIHtcclxuICAgICAgbG9naW5PclNpZ251cC5sb2dvdXRVc2VyKClcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBwcm9maWxlQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiUHJvZmlsZVwiKSB7XHJcbiAgICAgIHByb2ZpbGUubG9hZFByb2ZpbGUoKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiR2FtZXBsYXlcIikge1xyXG4gICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5hdmJhciIsImltcG9ydCBlbEJ1aWxkZXIgZnJvbSBcIi4vZWxlbWVudEJ1aWxkZXJcIlxyXG5pbXBvcnQgQVBJIGZyb20gXCIuL0FQSVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgcHJvZmlsZSA9IHtcclxuXHJcbiAgbG9hZFByb2ZpbGUoKSB7XHJcbiAgICB3ZWJwYWdlLmlubmVySFRNTCA9IG51bGw7XHJcbiAgICBjb25zdCBhY3RpdmVVc2VyID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIEFQSS5nZXRTaW5nbGVJdGVtKGFjdGl2ZVVzZXIsIFwidXNlcnNcIikudGhlbih1c2VyID0+IHtcclxuICAgICAgY29uc3QgcHJvZmlsZVBpYyA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwic3JjXCI6IFwiaW1hZ2VzL29jdGFuZS5qcGdcIiwgXCJjbGFzc1wiOiBcIlwiIH0pXHJcbiAgICAgIGNvbnN0IG5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYE5hbWU6ICR7dXNlci5uYW1lfWApXHJcbiAgICAgIGNvbnN0IHVzZXJuYW1lID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5vdGlmaWNhdGlvblwiIH0sIGBVc2VybmFtZTogJHt1c2VyLnVzZXJuYW1lfWApXHJcbiAgICAgIGNvbnN0IHBsYXllclByb2ZpbGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwicGxheWVyUHJvZmlsZVwiLCBcImNsYXNzXCI6IFwiY29udGFpbmVyXCIgfSwgbnVsbCwgcHJvZmlsZVBpYywgbmFtZSwgdXNlcm5hbWUpXHJcbiAgICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGxheWVyUHJvZmlsZSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJvZmlsZSJdfQ==
