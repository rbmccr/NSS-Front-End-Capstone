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

var _shotData = _interopRequireDefault(require("./shotData"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const webpage = document.getElementById("container-master");
const gameplay = {
  loadGameplay() {
    webpage.innerHTML = null; // const activeUser = sessionStorage.getItem("activeUserId");
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
    const btn_cancelShot = document.getElementById("cancelShot"); // const btn_editPrevGame = document.getElementById("editPrevGame");
    // const btn_saveGame = document.getElementById("saveGame");
    // const btn_3v3 = document.getElementById("_3v3");
    // const btn_2v2 = document.getElementById("_2v2");
    // const btn_1v1 = document.getElementById("_1v1");
    // // select dropdowns
    // const sel_aerial = document.getElementById("aerialInput");
    // const sel_gameMode = document.getElementById("gameModeInput");
    // const sel_teamColor = document.getElementById("teamInput");
    // const sel_overtime = document.getElementById("overtimeInput");
    // // input fields
    // const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    // const inpt_orangeScore = document.getElementById("orangeScoreInput");
    // const inpt_blueScore = document.getElementById("blueScoreInput");
    // add listeners

    btn_newShot.addEventListener("click", _shotData.default.createNewShot);
    btn_saveShot.addEventListener("click", _shotData.default.saveShot);
    btn_cancelShot.addEventListener("click", _shotData.default.cancelShot);
  }

};
var _default = gameplay;
exports.default = _default;

},{"./elementBuilder":2,"./shotData":9}],4:[function(require,module,exports){
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
// navbar.generateNavbar()
_navbar.default.generateNavbar(true);

_gameplay.default.loadGameplay();

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

},{"./elementBuilder":2,"./gameplay":3,"./login":4,"./profile":7,"./shotData":9}],7:[function(require,module,exports){
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

},{"./API":1,"./elementBuilder":2}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

let previousShotData; // global var used with shot editing

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
    previousShotData = undefined;
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
    if (previousShotData !== undefined) {
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

      previousShotData = undefined;
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
      // if shot is being edited, then previousShotData will not be undefined

      if (previousShotData !== undefined) {
        if (sel_aerial.value === "Aerial") {
          previousShotData._aerial = true;
        } else {
          previousShotData._aerial = false;
        }

        ;
        previousShotData.ball_speed = inpt_ballSpeed.value;
        previousShotData._fieldX = previousShotFieldX;
        previousShotData._fieldY = previousShotFieldY;
        previousShotData._goalX = previousShotGoalX;
        previousShotData._goalY = previousShotGoalY; // else save to new instance of class and append button to page with correct ID for editing
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


      console.log(shotArray);
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard"; // cancel the new instance of shotClass (matters if a new shot is being created)

      shotObj = undefined; // set global vars to undefined (matters if a previously saved shot is being edited)

      previousShotData = undefined;
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
    previousShotData = shotArray[btnId - 1]; // render ball speed and aerial dropdown for the shot

    inpt_ballSpeed.value = previousShotData.ball_speed;

    if (previousShotData._aerial === true) {
      sel_aerial.value = "Aerial";
    } else {
      sel_aerial.value = "Standard";
    } // add event listeners to field and goal


    fieldImg.addEventListener("click", shotData.getClickCoords);
    goalImg.addEventListener("click", shotData.getClickCoords); // render shot marker on field

    let parentContainer = document.getElementById("field-img-parent");
    let x = previousShotData._fieldX * parentContainer.offsetWidth / parentContainer.offsetWidth;
    let y = previousShotData._fieldY * parentContainer.offsetHeight / parentContainer.offsetHeight;
    shotData.markClickonImage(x, y, parentContainer); // render goal marker on field

    parentContainer = document.getElementById("goal-img-parent");
    x = Number((previousShotData._goalX * parentContainer.offsetWidth / parentContainer.offsetWidth).toFixed(3));
    y = Number((previousShotData._goalY * parentContainer.offsetHeight / parentContainer.offsetHeight).toFixed(3));
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
  }

};
var _default = shotData;
exports.default = _default;

},{"./elementBuilder":2,"./shotClass":8}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zY3JpcHRzL0FQSS5qcyIsIi4uL3NjcmlwdHMvZWxlbWVudEJ1aWxkZXIuanMiLCIuLi9zY3JpcHRzL2dhbWVwbGF5LmpzIiwiLi4vc2NyaXB0cy9sb2dpbi5qcyIsIi4uL3NjcmlwdHMvbWFpbi5qcyIsIi4uL3NjcmlwdHMvbmF2YmFyLmpzIiwiLi4vc2NyaXB0cy9wcm9maWxlLmpzIiwiLi4vc2NyaXB0cy9zaG90Q2xhc3MuanMiLCIuLi9zY3JpcHRzL3Nob3REYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsTUFBTSxHQUFHLEdBQUcsdUJBQVo7QUFFQSxNQUFNLEdBQUcsR0FBRztBQUVWLEVBQUEsYUFBYSxDQUFDLEVBQUQsRUFBSyxTQUFMLEVBQWdCO0FBQzNCLFdBQU8sS0FBSyxDQUFFLEdBQUUsR0FBSSxJQUFHLFNBQVUsSUFBRyxFQUFHLEVBQTNCLENBQUwsQ0FBbUMsSUFBbkMsQ0FBd0MsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFMLEVBQWhELENBQVA7QUFDRCxHQUpTOztBQU1WLEVBQUEsTUFBTSxDQUFDLFNBQUQsRUFBWTtBQUNoQixXQUFPLEtBQUssQ0FBRSxHQUFFLEdBQUksSUFBRyxTQUFVLEVBQXJCLENBQUwsQ0FBNkIsSUFBN0IsQ0FBa0MsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFMLEVBQTFDLENBQVA7QUFDRCxHQVJTOztBQVVWLEVBQUEsZ0JBQWdCLENBQUMsRUFBRCxFQUFLLFNBQUwsRUFBZ0I7QUFDOUIsV0FBTyxLQUFLLENBQUUsR0FBRSxHQUFJLElBQUcsU0FBVSxJQUFHLEVBQUcsRUFBM0IsRUFBOEI7QUFDeEMsTUFBQSxNQUFNLEVBQUU7QUFEZ0MsS0FBOUIsQ0FBTCxDQUdKLElBSEksQ0FHQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUYsRUFITixFQUlKLElBSkksQ0FJQyxNQUFNLEtBQUssQ0FBRSxHQUFF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VCxDQUF5QixRQUFPLENBQUMsR0FBRyxDQUFFLEVBQXRDLENBQVY7QUFDQSxNQUFBLE9BQU8sQ0FBQyxRQUFSLEdBQW1CLFlBQW5CO0FBQ0Q7QUFFRjs7QUE5UWMsQ0FBakI7ZUFrUmUsUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IFVSTCA9IFwiaHR0cDovL2xvY2FsaG9zdDo4MDg4XCJcclxuXHJcbmNvbnN0IEFQSSA9IHtcclxuXHJcbiAgZ2V0U2luZ2xlSXRlbShpZCwgZXh0ZW5zaW9uKSB7XHJcbiAgICByZXR1cm4gZmV0Y2goYCR7VVJMfS8ke2V4dGVuc2lvbn0vJHtpZH1gKS50aGVuKGRhdGEgPT4gZGF0YS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgZ2V0QWxsKGV4dGVuc2lvbikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCkudGhlbihkYXRhID0+IGRhdGEuanNvbigpKVxyXG4gIH0sXHJcblxyXG4gIGRlbGV0ZVNpbmdsZUl0ZW0oaWQsIGV4dGVuc2lvbikge1xyXG4gICAgcmV0dXJuIGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259LyR7aWR9YCwge1xyXG4gICAgICBtZXRob2Q6IFwiREVMRVRFXCJcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKGUgPT4gZS5qc29uKCkpXHJcbiAgICAgIC50aGVuKCgpID0+IGZldGNoKGAke1VSTH0vJHtleHRlbnNpb259YCkpXHJcbiAgICAgIC50aGVuKGUgPT4gZS5qc29uKCkpXHJcbiAgfSxcclxuXHJcbiAgcG9zdFNpbmdsZUl0ZW0ob2JqLCBleHRlbnNpb24pIHtcclxuICAgIHJldHVybiBmZXRjaChgJHtVUkx9LyR7ZXh0ZW5zaW9ufWAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG9iailcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHIgPT4gci5qc29uKCkpXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBUEkiLCJmdW5jdGlvbiBlbEJ1aWxkZXIobmFtZSwgYXR0cmlidXRlc09iaiwgdHh0LCAuLi5jaGlsZHJlbikge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcclxuICBmb3IgKGxldCBhdHRyIGluIGF0dHJpYnV0ZXNPYmopIHtcclxuICAgIGVsLnNldEF0dHJpYnV0ZShhdHRyLCBhdHRyaWJ1dGVzT2JqW2F0dHJdKTtcclxuICB9XHJcbiAgZWwudGV4dENvbnRlbnQgPSB0eHQgfHwgbnVsbDtcclxuICBjaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICB9KVxyXG4gIHJldHVybiBlbDtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZWxCdWlsZGVyIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBzaG90RGF0YSBmcm9tIFwiLi9zaG90RGF0YVwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgZ2FtZXBsYXkgPSB7XHJcblxyXG4gIGxvYWRHYW1lcGxheSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIC8vIGNvbnN0IGFjdGl2ZVVzZXIgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgLy8gY29uc3QgeEJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiY2xhc3NcIjogXCJkZWxldGVcIiB9KTtcclxuICAgIC8vIHhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQm94LCBldmVudCk7IC8vIGJ1dHRvbiB3aWxsIGRpc3BsYXk6IG5vbmUgb24gcGFyZW50IGNvbnRhaW5lclxyXG4gICAgLy8gY29uc3QgaGVhZGVySW5mbyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb24gaXMtaW5mb1wiIH0sIFwiQ3JlYXRlIGFuZCBzYXZlIHNob3RzIC0gdGhlbiBzYXZlIHRoZSBnYW1lIHJlY29yZC5cIiwgeEJ1dHRvbik7XHJcbiAgICAvLyB3ZWJwYWdlLmFwcGVuZENoaWxkKGhlYWRlckluZm8pO1xyXG4gICAgdGhpcy5idWlsZFNob3RDb250ZW50KCk7XHJcbiAgICB0aGlzLmJ1aWxkR2FtZUNvbnRlbnQoKTtcclxuICAgIHRoaXMuZ2FtZXBsYXlFdmVudE1hbmFnZXIoKTtcclxuICB9LFxyXG5cclxuICBidWlsZFNob3RDb250ZW50KCkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBidWlsZHMgc2hvdCBjb250YWluZXJzIGFuZCBhZGRzIGNvbnRhaW5lciBjb250ZW50XHJcblxyXG4gICAgLy8gY29udGFpbmVyIHRpdGxlXHJcbiAgICBjb25zdCBzaG90VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSB0aXRsZSBpcy00XCIgfSwgXCJFbnRlciBTaG90IERhdGFcIik7XHJcbiAgICBjb25zdCBzaG90VGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90VGl0bGUpO1xyXG5cclxuICAgIC8vIG5ldyBzaG90IGFuZCBzYXZlIHNob3QgYnV0dG9uc1xyXG4gICAgY29uc3QgbmV3U2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJuZXdTaG90XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtc3VjY2Vzc1wiIH0sIFwiTmV3IFNob3RcIik7XHJcbiAgICBjb25zdCBzYXZlU2hvdCA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgU2hvdFwiKTtcclxuICAgIGNvbnN0IGNhbmNlbFNob3QgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiY2FuY2VsU2hvdFwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhbmdlclwiIH0sIFwiQ2FuY2VsIFNob3RcIik7XHJcbiAgICBjb25zdCBzaG90QnV0dG9ucyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJzaG90Q29udHJvbHNcIiwgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gYnV0dG9uc1wiIH0sIG51bGwsIG5ld1Nob3QsIHNhdmVTaG90LCBjYW5jZWxTaG90KTtcclxuICAgIGNvbnN0IGFsaWduU2hvdEJ1dHRvbnMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtbGVmdFwiIH0sIG51bGwsIHNob3RCdXR0b25zKTtcclxuICAgIGNvbnN0IHNob3RCdXR0b25Db250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBhbGlnblNob3RCdXR0b25zKTtcclxuXHJcbiAgICAvLyBiYWxsIHNwZWVkIGlucHV0IGFuZCBhZXJpYWwgc2VsZWN0XHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dFRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBcIkJhbGwgc3BlZWQgKGtwaCk6XCIpXHJcbiAgICBjb25zdCBiYWxsU3BlZWRJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcImJhbGxTcGVlZElucHV0XCIsIFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGlucHV0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBiYWxsIHNwZWVkXCIgfSk7XHJcbiAgICBjb25zdCBhZXJpYWxPcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIlN0YW5kYXJkXCIpO1xyXG4gICAgY29uc3QgYWVyaWFsT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJBZXJpYWxcIik7XHJcbiAgICBjb25zdCBhZXJpYWxTZWxlY3QgPSBlbEJ1aWxkZXIoXCJzZWxlY3RcIiwgeyBcImlkXCI6IFwiYWVyaWFsSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbE9wdGlvbjEsIGFlcmlhbE9wdGlvbjIpO1xyXG4gICAgY29uc3QgYWVyaWFsU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdCk7XHJcbiAgICBjb25zdCBhZXJpYWxDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRyb2wgbGV2ZWwtaXRlbVwiIH0sIG51bGwsIGFlcmlhbFNlbGVjdFBhcmVudCk7XHJcbiAgICBjb25zdCBzaG90RGV0YWlscyA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgYmFsbFNwZWVkSW5wdXRUaXRsZSwgYmFsbFNwZWVkSW5wdXQsIGFlcmlhbENvbnRyb2wpO1xyXG4gICAgY29uc3Qgc2hvdERldGFpbHNDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzaG90RGV0YWlscyk7XHJcblxyXG4gICAgLy8gZmllbGQgYW5kIGdvYWwgaW1hZ2VzIChub3RlIGZpZWxkLWltZyBpcyBjbGlwcGVkIHRvIHJlc3RyaWN0IGNsaWNrIGFyZWEgY29vcmRpbmF0ZXMgaW4gbGF0ZXIgZnVuY3Rpb24uXHJcbiAgICAvLyBnb2FsLWltZyB1c2VzIGFuIHgveSBmb3JtdWxhIGZvciBjbGljayBhcmVhIGNvb3JkaW5hdGVzIHJlc3RyaWN0aW9uLCBzaW5jZSBpdCdzIGEgcmVjdGFuZ2xlKVxyXG4gICAgLy8gYWRkaXRpb25hbGx5LCBmaWVsZCBhbmQgZ29hbCBhcmUgbm90IGFsaWduZWQgd2l0aCBsZXZlbC1sZWZ0IG9yIGxldmVsLXJpZ2h0IC0gaXQncyBhIGRpcmVjdCBsZXZlbCAtLT4gbGV2ZWwtaXRlbSBmb3IgY2VudGVyaW5nXHJcbiAgICBjb25zdCBmaWVsZEltYWdlID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJpZFwiOiBcImZpZWxkLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9ERkhfc3RhZGl1bV83OTB4NTQwX25vX2JnXzkwZGVnLnBuZ1wiLCBcImFsdFwiOiBcIkRGSCBTdGFkaXVtXCIsIFwic3R5bGVcIjogXCJoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvYmplY3QtZml0OiBjb250YWluXCIgfSk7XHJcbiAgICBjb25zdCBmaWVsZEltYWdlQmFja2dyb3VuZCA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctYmdcIiwgXCJzcmNcIjogXCIuLi9pbWFnZXMvREZIX3N0YWRpdW1fNzkweDU0MF9ub19iZ185MGRlZy5wbmdcIiwgXCJhbHRcIjogXCJERkggU3RhZGl1bVwiLCBcInN0eWxlXCI6IFwiaGVpZ2h0OiAxMDAlOyB3aWR0aDogMTAwJTsgb2JqZWN0LWZpdDogY29udGFpblwiIH0pO1xyXG4gICAgY29uc3QgZmllbGRJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJmaWVsZC1pbWctcGFyZW50XCIsIFwiY2xhc3NcIjogXCJcIiB9LCBudWxsLCBmaWVsZEltYWdlQmFja2dyb3VuZCwgZmllbGRJbWFnZSk7XHJcbiAgICBjb25zdCBhbGlnbkZpZWxkID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW1cIiB9LCBudWxsLCBmaWVsZEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZSA9IGVsQnVpbGRlcihcImltZ1wiLCB7IFwiaWRcIjogXCJnb2FsLWltZ1wiLCBcInNyY1wiOiBcIi4uL2ltYWdlcy9STF9nb2FsX2Nyb3BwZWRfbm9fYmdfQlcucG5nXCIsIFwiYWx0XCI6IFwiREZIIFN0YWRpdW1cIiwgXCJzdHlsZVwiOiBcImhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG9iamVjdC1maXQ6IGNvbnRhaW5cIiB9KTtcclxuICAgIGNvbnN0IGdvYWxJbWFnZVBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJnb2FsLWltZy1wYXJlbnRcIiwgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ29hbEltYWdlKTtcclxuICAgIGNvbnN0IGFsaWduR29hbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ29hbEltYWdlUGFyZW50KTtcclxuICAgIGNvbnN0IHNob3RDb29yZGluYXRlc0NvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbFwiIH0sIG51bGwsIGFsaWduRmllbGQsIGFsaWduR29hbCk7XHJcblxyXG4gICAgLy8gcGFyZW50IGNvbnRhaW5lciBob2xkaW5nIGFsbCBzaG90IGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBwYXJlbnRTaG90Q29udGFpbmVyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImNvbnRhaW5lciBib3hcIiB9LCBudWxsLCBzaG90VGl0bGVDb250YWluZXIsIHNob3RCdXR0b25Db250YWluZXIsIHNob3REZXRhaWxzQ29udGFpbmVyLCBzaG90Q29vcmRpbmF0ZXNDb250YWluZXIpXHJcblxyXG4gICAgLy8gYXBwZW5kIHNob3RzIGNvbnRhaW5lciB0byBwYWdlXHJcbiAgICB3ZWJwYWdlLmFwcGVuZENoaWxkKHBhcmVudFNob3RDb250YWluZXIpO1xyXG4gIH0sXHJcblxyXG4gIGJ1aWxkR2FtZUNvbnRlbnQoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGNyZWF0ZXMgZ2FtZSBjb250ZW50IGNvbnRhaW5lcnMgKHRlYW0sIGdhbWUgdHlwZSwgZ2FtZSBtb2RlLCBldGMuKVxyXG5cclxuICAgIC8vIGNvbnRhaW5lciB0aXRsZVxyXG4gICAgY29uc3QgZ2FtZVRpdGxlID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsLWl0ZW0gdGl0bGUgaXMtNFwiIH0sIFwiRW50ZXIgR2FtZSBEYXRhXCIpO1xyXG4gICAgY29uc3QgdGl0bGVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBnYW1lVGl0bGUpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gdG9wIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIDF2MS8ydjIvM3YzIGJ1dHRvbnMgKG5vdGU6IGNvbnRyb2wgY2xhc3MgaXMgdXNlZCB3aXRoIGZpZWxkIHRvIGFkaGVyZSBidXR0b25zIHRvZ2V0aGVyKVxyXG4gICAgY29uc3QgZ2FtZVR5cGUzdjMgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uXCIgfSwgXCIzdjNcIik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTN2M0NvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwiXzN2M1wiLCBcImNsYXNzXCI6IFwiY29udHJvbFwiIH0sIG51bGwsIGdhbWVUeXBlM3YzKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMnYyID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImJ1dHRvblwiIH0sIFwiMnYyXCIpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGUydjJDb250cm9sID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJpZFwiOiBcIl8ydjJcIiwgXCJjbGFzc1wiOiBcImNvbnRyb2xcIiB9LCBudWxsLCBnYW1lVHlwZTJ2Mik7XHJcbiAgICBjb25zdCBnYW1lVHlwZTF2MSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJidXR0b25cIiB9LCBcIjF2MVwiKTtcclxuICAgIGNvbnN0IGdhbWVUeXBlMXYxQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJfMXYxXCIsIFwiY2xhc3NcIjogXCJjb250cm9sXCIgfSwgbnVsbCwgZ2FtZVR5cGUxdjEpO1xyXG4gICAgY29uc3QgZ2FtZVR5cGVCdXR0b25GaWVsZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJmaWVsZCBoYXMtYWRkb25zXCIgfSwgbnVsbCwgZ2FtZVR5cGUzdjNDb250cm9sLCBnYW1lVHlwZTJ2MkNvbnRyb2wsIGdhbWVUeXBlMXYxQ29udHJvbCk7XHJcbiAgICBjb25zdCBnYW1lVHlwZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25GaWVsZCk7XHJcblxyXG4gICAgLy8gZ2FtZSBtb2RlIHNlbGVjdFxyXG4gICAgY29uc3QgbW9kZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQ29tcGV0aXRpdmVcIik7XHJcbiAgICBjb25zdCBtb2RlT3B0aW9uMiA9IGVsQnVpbGRlcihcIm9wdGlvblwiLCB7fSwgXCJDYXN1YWxcIik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0ID0gZWxCdWlsZGVyKFwic2VsZWN0XCIsIHsgXCJpZFwiOiBcImdhbWVNb2RlSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVPcHRpb24xLCBtb2RlT3B0aW9uMik7XHJcbiAgICBjb25zdCBtb2RlU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIG1vZGVTZWxlY3QpO1xyXG4gICAgY29uc3QgbW9kZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgbW9kZVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gdGVhbSBzZWxlY3RcclxuICAgIGNvbnN0IHRlYW1PcHRpb24xID0gZWxCdWlsZGVyKFwib3B0aW9uXCIsIHt9LCBcIk9yYW5nZSB0ZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiQmx1ZSBUZWFtXCIpO1xyXG4gICAgY29uc3QgdGVhbVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJ0ZWFtSW5wdXRcIiwgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1PcHRpb24xLCB0ZWFtT3B0aW9uMik7XHJcbiAgICBjb25zdCB0ZWFtU2VsZWN0UGFyZW50ID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcInNlbGVjdFwiIH0sIG51bGwsIHRlYW1TZWxlY3QpO1xyXG4gICAgY29uc3QgdGVhbUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgdGVhbVNlbGVjdFBhcmVudCk7XHJcblxyXG4gICAgLy8gb3ZlcnRpbWUgc2VsZWN0XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjEgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiTm8gb3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZU9wdGlvbjIgPSBlbEJ1aWxkZXIoXCJvcHRpb25cIiwge30sIFwiT3ZlcnRpbWVcIik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdCA9IGVsQnVpbGRlcihcInNlbGVjdFwiLCB7IFwiaWRcIjogXCJvdmVydGltZUlucHV0XCIsIFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZU9wdGlvbjEsIG92ZXJ0aW1lT3B0aW9uMik7XHJcbiAgICBjb25zdCBvdmVydGltZVNlbGVjdFBhcmVudCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJzZWxlY3RcIiB9LCBudWxsLCBvdmVydGltZVNlbGVjdCk7XHJcbiAgICBjb25zdCBvdmVydGltZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udHJvbCBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgb3ZlcnRpbWVTZWxlY3RQYXJlbnQpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0gYm90dG9tIGNvbnRhaW5lclxyXG5cclxuICAgIC8vIHNjb3JlIGlucHV0c1xyXG4gICAgLy8gKioqKk5vdGUgaW5saW5lIHN0eWxpbmcgb2YgaW5wdXQgd2lkdGhzXHJcbiAgICBjb25zdCBvcmFuZ2VTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiT3JhbmdlIHRlYW0gc2NvcmU6XCIpO1xyXG4gICAgY29uc3Qgb3JhbmdlU2NvcmVJbnB1dCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcIm9yYW5nZVNjb3JlSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcIm51bWJlclwiLCBcInBsYWNlaG9sZGVyXCI6IFwiZW50ZXIgb3JhbmdlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IG9yYW5nZVNjb3JlQ29udHJvbCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1pdGVtIGNvbnRyb2xcIiB9LCBudWxsLCBvcmFuZ2VTY29yZUlucHV0KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUlucHV0VGl0bGUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbVwiIH0sIFwiQmx1ZSB0ZWFtIHNjb3JlOlwiKVxyXG4gICAgY29uc3QgYmx1ZVNjb3JlSW5wdXQgPSBlbEJ1aWxkZXIoXCJpbnB1dFwiLCB7IFwiaWRcIjogXCJibHVlU2NvcmVJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwibnVtYmVyXCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBibHVlIHRlYW0gc2NvcmVcIiB9KTtcclxuICAgIGNvbnN0IGJsdWVTY29yZUNvbnRyb2wgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWwtaXRlbSBjb250cm9sXCIgfSwgbnVsbCwgYmx1ZVNjb3JlSW5wdXQpO1xyXG4gICAgY29uc3Qgc2NvcmVJbnB1dENvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1sZWZ0XCIgfSwgbnVsbCwgb3JhbmdlU2NvcmVJbnB1dFRpdGxlLCBvcmFuZ2VTY29yZUNvbnRyb2wsIGJsdWVTY29yZUlucHV0VGl0bGUsIGJsdWVTY29yZUNvbnRyb2wpO1xyXG5cclxuICAgIC8vIGVkaXQvc2F2ZSBnYW1lIGJ1dHRvbnNcclxuICAgIGNvbnN0IGVkaXRQcmV2aW91c0dhbWUgPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwiZWRpdFByZXZHYW1lXCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFuZ2VyXCIgfSwgXCJFZGl0IFByZXZpb3VzIEdhbWVcIik7XHJcbiAgICBjb25zdCBzYXZlR2FtZSA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJzYXZlR2FtZVwiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLXN1Y2Nlc3NcIiB9LCBcIlNhdmUgR2FtZVwiKTtcclxuICAgIGNvbnN0IGdhbWVCdXR0b25BbGlnbm1lbnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9ucyBsZXZlbC1pdGVtXCIgfSwgbnVsbCwgZWRpdFByZXZpb3VzR2FtZSwgc2F2ZUdhbWUpO1xyXG4gICAgY29uc3QgZ2FtZUJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJsZXZlbC1yaWdodFwiIH0sIG51bGwsIGdhbWVCdXR0b25BbGlnbm1lbnQpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICBjb25zdCBnYW1lQ29udGFpbmVyVG9wID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcImxldmVsXCIgfSwgbnVsbCwgZ2FtZVR5cGVCdXR0b25Db250YWluZXIsIG1vZGVDb250cm9sLCB0ZWFtQ29udHJvbCwgb3ZlcnRpbWVDb250cm9sKTtcclxuICAgIGNvbnN0IGdhbWVDb250YWluZXJCb3R0b20gPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibGV2ZWxcIiB9LCBudWxsLCBzY29yZUlucHV0Q29udGFpbmVyLCBnYW1lQnV0dG9uQ29udGFpbmVyKTtcclxuICAgIGNvbnN0IHBhcmVudEdhbWVDb250YWluZXIgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwiY29udGFpbmVyIGJveFwiIH0sIG51bGwsIHRpdGxlQ29udGFpbmVyLCBnYW1lQ29udGFpbmVyVG9wLCBnYW1lQ29udGFpbmVyQm90dG9tKTtcclxuICAgIHdlYnBhZ2UuYXBwZW5kQ2hpbGQocGFyZW50R2FtZUNvbnRhaW5lcik7XHJcbiAgfSxcclxuXHJcbiAgZ2FtZXBsYXlFdmVudE1hbmFnZXIoKSB7XHJcblxyXG4gICAgLy8gYnV0dG9uc1xyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBidG5fc2F2ZVNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVTaG90XCIpO1xyXG4gICAgY29uc3QgYnRuX2NhbmNlbFNob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbmNlbFNob3RcIik7XHJcbiAgICAvLyBjb25zdCBidG5fZWRpdFByZXZHYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0UHJldkdhbWVcIik7XHJcbiAgICAvLyBjb25zdCBidG5fc2F2ZUdhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNhdmVHYW1lXCIpO1xyXG4gICAgLy8gY29uc3QgYnRuXzN2MyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiXzN2M1wiKTtcclxuICAgIC8vIGNvbnN0IGJ0bl8ydjIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl8ydjJcIik7XHJcbiAgICAvLyBjb25zdCBidG5fMXYxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfMXYxXCIpO1xyXG5cclxuICAgIC8vIC8vIHNlbGVjdCBkcm9wZG93bnNcclxuICAgIC8vIGNvbnN0IHNlbF9hZXJpYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFlcmlhbElucHV0XCIpO1xyXG4gICAgLy8gY29uc3Qgc2VsX2dhbWVNb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lTW9kZUlucHV0XCIpO1xyXG4gICAgLy8gY29uc3Qgc2VsX3RlYW1Db2xvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGVhbUlucHV0XCIpO1xyXG4gICAgLy8gY29uc3Qgc2VsX292ZXJ0aW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdmVydGltZUlucHV0XCIpO1xyXG5cclxuICAgIC8vIC8vIGlucHV0IGZpZWxkc1xyXG4gICAgLy8gY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgLy8gY29uc3QgaW5wdF9vcmFuZ2VTY29yZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3JhbmdlU2NvcmVJbnB1dFwiKTtcclxuICAgIC8vIGNvbnN0IGlucHRfYmx1ZVNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJibHVlU2NvcmVJbnB1dFwiKTtcclxuXHJcbiAgICAvLyBhZGQgbGlzdGVuZXJzXHJcbiAgICBidG5fbmV3U2hvdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuY3JlYXRlTmV3U2hvdCk7XHJcbiAgICBidG5fc2F2ZVNob3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLnNhdmVTaG90KTtcclxuICAgIGJ0bl9jYW5jZWxTaG90LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5jYW5jZWxTaG90KTtcclxuXHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZXBsYXkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IEFQSSBmcm9tIFwiLi9BUElcIlxyXG5pbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcblxyXG5jb25zdCB3ZWJwYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250YWluZXItbWFzdGVyXCIpO1xyXG5jb25zdCB3ZWJwYWdlTmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXYtbWFzdGVyXCIpO1xyXG5cclxuY29uc3QgbG9naW5PclNpZ251cCA9IHtcclxuXHJcbiAgLy8gYnVpbGQgYSBsb2dpbiBmb3JtIHRoYXQgdmFsaWRhdGVzIHVzZXIgaW5wdXQuIFN1Y2Nlc3NmdWwgbG9naW4gc3RvcmVzIHVzZXIgaWQgaW4gc2Vzc2lvbiBzdG9yYWdlXHJcbiAgbG9naW5Gb3JtKCkge1xyXG4gICAgY29uc3QgbG9naW5JbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbklucHV0X3Bhc3N3b3JkID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwicGFzc3dvcmRJbnB1dFwiLCBcImNsYXNzXCI6IFwiaW5wdXRcIiwgXCJ0eXBlXCI6IFwicGFzc3dvcmRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogXCJsb2dpbk5vd1wiLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ2luIG5vd1wiKTtcclxuICAgIGNvbnN0IGxvZ2luRm9ybSA9IGVsQnVpbGRlcihcImZvcm1cIiwgeyBcImlkXCI6IFwibG9naW5Gb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBsb2dpbklucHV0X3VzZXJuYW1lLCBsb2dpbklucHV0X3Bhc3N3b3JkLCBsb2dpbkJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChsb2dpbkZvcm0pXHJcbiAgICB0aGlzLnVzZXJFdmVudE1hbmFnZXIoKVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cEZvcm0oKSB7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9uYW1lID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwibmFtZUlucHV0XCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJlbnRlciBuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF91c2VybmFtZSA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInVzZXJuYW1lSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHVzZXJuYW1lXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9wYXNzd29yZCA9IGVsQnVpbGRlcihcImlucHV0XCIsIHsgXCJpZFwiOiBcInBhc3N3b3JkSW5wdXRcIiwgXCJjbGFzc1wiOiBcImlucHV0XCIsIFwidHlwZVwiOiBcInRleHRcIiwgXCJwbGFjZWhvbGRlclwiOiBcImVudGVyIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBJbnB1dF9jb25maXJtID0gZWxCdWlsZGVyKFwiaW5wdXRcIiwgeyBcImlkXCI6IFwiY29uZmlybVBhc3N3b3JkXCIsIFwiY2xhc3NcIjogXCJpbnB1dFwiLCBcInR5cGVcIjogXCJ0ZXh0XCIsIFwicGxhY2Vob2xkZXJcIjogXCJjb25maXJtIHBhc3N3b3JkXCIgfSk7XHJcbiAgICBjb25zdCBzaWdudXBCdXR0b24gPSBlbEJ1aWxkZXIoXCJidXR0b25cIiwgeyBcImlkXCI6IFwic2lnbnVwTm93XCIsIFwiY2xhc3NcIjogXCJidXR0b24gaXMtZGFya1wiIH0sIFwiU2lnbiB1cCBub3dcIik7XHJcbiAgICBjb25zdCBzaWdudXBGb3JtID0gZWxCdWlsZGVyKFwiZm9ybVwiLCB7IFwiaWRcIjogXCJzaWdudXBGb3JtXCIsIFwiY2xhc3NcIjogXCJib3hcIiB9LCBudWxsLCBzaWdudXBJbnB1dF9uYW1lLCBzaWdudXBJbnB1dF91c2VybmFtZSwgc2lnbnVwSW5wdXRfcGFzc3dvcmQsIHNpZ251cElucHV0X2NvbmZpcm0sIHNpZ251cEJ1dHRvbik7XHJcblxyXG4gICAgd2VicGFnZS5pbm5lckhUTUwgPSBudWxsO1xyXG4gICAgd2VicGFnZS5hcHBlbmRDaGlsZChzaWdudXBGb3JtKVxyXG4gICAgdGhpcy51c2VyRXZlbnRNYW5hZ2VyKClcclxuICB9LFxyXG5cclxuICAvLyBhc3NpZ24gZXZlbnQgbGlzdGVuZXJzIGJhc2VkIG9uIHdoaWNoIGZvcm0gaXMgb24gdGhlIHdlYnBhZ2VcclxuICB1c2VyRXZlbnRNYW5hZ2VyKCkge1xyXG4gICAgY29uc3QgbG9naW5Ob3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZ2luTm93XCIpXHJcbiAgICBjb25zdCBzaWdudXBOb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpZ251cE5vd1wiKVxyXG4gICAgaWYgKGxvZ2luTm93ID09PSBudWxsKSB7XHJcbiAgICAgIHNpZ251cE5vdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBVc2VyLCBldmVudClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxvZ2luTm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmxvZ2luVXNlciwgZXZlbnQpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gdmFsaWRhdGUgdXNlciBsb2dpbiBmb3JtIGlucHV0cyBiZWZvcmUgbG9nZ2luZyBpblxyXG4gIGxvZ2luVXNlcihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBjb25zdCB1c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhc3N3b3JkSW5wdXRcIikudmFsdWVcclxuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBBUEkuZ2V0QWxsKFwidXNlcnNcIikudGhlbih1c2VycyA9PiB1c2Vycy5mb3JFYWNoKHVzZXIgPT4ge1xyXG4gICAgICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFuZCBwYXNzd29yZFxyXG4gICAgICAgIGlmICh1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIGlmICh1c2VyLnBhc3N3b3JkID09PSBwYXNzd29yZCkge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHNpZ251cFVzZXIoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgY29uc29sZS5sb2coZSlcclxuICAgIGNvbnN0IF9uYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lSW5wdXRcIikudmFsdWVcclxuICAgIGNvbnN0IF91c2VybmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXNlcm5hbWVJbnB1dFwiKS52YWx1ZVxyXG4gICAgY29uc3QgX3Bhc3N3b3JkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXNzd29yZElucHV0XCIpLnZhbHVlXHJcbiAgICBjb25zdCBjb25maXJtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maXJtUGFzc3dvcmRcIikudmFsdWVcclxuICAgIGxldCB1bmlxdWVVc2VybmFtZSA9IHRydWU7IC8vY2hhbmdlcyB0byBmYWxzZSBpZiB1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1xyXG4gICAgaWYgKF9uYW1lID09PSBcIlwiKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIGlmIChfdXNlcm5hbWUgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9IGVsc2UgaWYgKF9wYXNzd29yZCA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoY29uZmlybSA9PT0gXCJcIikge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSBpZiAoX3Bhc3N3b3JkICE9PSBjb25maXJtKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgQVBJLmdldEFsbChcInVzZXJzXCIpLnRoZW4odXNlcnMgPT4gdXNlcnMuZm9yRWFjaCgodXNlciwgaWR4KSA9PiB7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIGV4aXN0aW5nIHVzZXJuYW1lIGluIGRhdGFiYXNlXHJcbiAgICAgICAgaWYgKHVzZXIudXNlcm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gX3VzZXJuYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgIHVuaXF1ZVVzZXJuYW1lID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vYXQgdGhlIGVuZCBvZiB0aGUgbG9vcCwgcG9zdFxyXG4gICAgICAgIGlmIChpZHggPT09IHVzZXJzLmxlbmd0aCAtIDEgJiYgdW5pcXVlVXNlcm5hbWUpIHtcclxuICAgICAgICAgIGxldCBuZXdVc2VyID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBfbmFtZSxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IF91c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IF9wYXNzd29yZCxcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBBUEkucG9zdFNpbmdsZUl0ZW0obmV3VXNlciwgXCJ1c2Vyc1wiKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICAgICAgICBsb2dpbk9yU2lnbnVwLmxvZ2luU3RhdHVzQWN0aXZlKHVzZXIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbG9naW5TdGF0dXNBY3RpdmUodXNlcikge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcImFjdGl2ZVVzZXJJZFwiLCB1c2VyLmlkKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcih0cnVlKTsgLy9idWlsZCBsb2dnZWQgaW4gdmVyc2lvbiBvZiBuYXZiYXJcclxuICB9LFxyXG5cclxuICBsb2dvdXRVc2VyKCkge1xyXG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShcImFjdGl2ZVVzZXJJZFwiKTtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIHdlYnBhZ2VOYXYuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIG5hdmJhci5nZW5lcmF0ZU5hdmJhcihmYWxzZSk7IC8vYnVpbGQgbG9nZ2VkIG91dCB2ZXJzaW9uIG9mIG5hdmJhclxyXG4gIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvZ2luT3JTaWdudXAiLCJpbXBvcnQgbmF2YmFyIGZyb20gXCIuL25hdmJhclwiXHJcbmltcG9ydCBnYW1lcGxheSBmcm9tIFwiLi9nYW1lcGxheVwiXHJcblxyXG4vLyBmdW5jdGlvbiBjbG9zZUJveChlKSB7XHJcbi8vICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcImRlbGV0ZVwiKSkge1xyXG4vLyAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBuYXZiYXIuZ2VuZXJhdGVOYXZiYXIoKVxyXG5uYXZiYXIuZ2VuZXJhdGVOYXZiYXIodHJ1ZSlcclxuZ2FtZXBsYXkubG9hZEdhbWVwbGF5KCkiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IGxvZ2luT3JTaWdudXAgZnJvbSBcIi4vbG9naW5cIlxyXG5pbXBvcnQgcHJvZmlsZSBmcm9tIFwiLi9wcm9maWxlXCJcclxuaW1wb3J0IGdhbWVwbGF5IGZyb20gXCIuL2dhbWVwbGF5XCJcclxuaW1wb3J0IHNob3REYXRhIGZyb20gXCIuL3Nob3REYXRhXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2VOYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdi1tYXN0ZXJcIik7XHJcblxyXG4vKlxyXG4gIEJ1bG1hIG5hdmJhciBzdHJ1Y3R1cmU6XHJcbiAgPG5hdj5cclxuICAgIDxuYXZiYXItYnJhbmQ+XHJcbiAgICAgIDxuYXZiYXItYnVyZ2VyPiAob3B0aW9uYWwpXHJcbiAgICA8L25hdmJhci1icmFuZD5cclxuICAgIDxuYXZiYXItbWVudT5cclxuICAgICAgPG5hdmJhci1zdGFydD5cclxuICAgICAgPC9uYXZiYXItc3RhcnQ+XHJcbiAgICAgIDxuYXZiYXItZW5kPlxyXG4gICAgICA8L25hdmJhci1lbmQ+XHJcbiAgICA8L25hdmJhci1tZW51PlxyXG4gIDwvbmF2PlxyXG5cclxuICBUaGUgZnVuY3Rpb25zIGJlbG93IGJ1aWxkIHRoZSBuYXZiYXIgZnJvbSB0aGUgaW5zaWRlIG91dFxyXG4qL1xyXG5cclxuY29uc3QgbmF2YmFyID0ge1xyXG5cclxuICBnZW5lcmF0ZU5hdmJhcihsb2dnZWRJbkJvb2xlYW4pIHtcclxuXHJcbiAgICAvLyBuYXZiYXItbWVudSAocmlnaHQgc2lkZSBvZiBuYXZiYXIgLSBhcHBlYXJzIG9uIGRlc2t0b3AgMTAyNHB4KylcclxuICAgIGNvbnN0IGJ1dHRvbjIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcImJ1dHRvbiBpcy1kYXJrXCIgfSwgXCJMb2dpblwiKVxyXG4gICAgY29uc3QgYnV0dG9uMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIlNpZ24gdXBcIilcclxuICAgIGNvbnN0IGJ1dHRvbkNvbnRhaW5lciA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJidXR0b25zXCIgfSwgbnVsbCwgYnV0dG9uMSwgYnV0dG9uMilcclxuICAgIGNvbnN0IG1lbnVJdGVtMSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIG51bGwsIGJ1dHRvbkNvbnRhaW5lcilcclxuICAgIGNvbnN0IG5hdmJhckVuZCA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItZW5kXCIgfSwgbnVsbCwgbWVudUl0ZW0xKVxyXG4gICAgY29uc3QgbmF2YmFyU3RhcnQgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLXN0YXJ0XCIgfSlcclxuICAgIGNvbnN0IG5hdmJhck1lbnUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImlkXCI6IFwibmF2YmFyTWVudVwiLCBcImNsYXNzXCI6IFwibmF2YmFyLW1lbnVcIiB9LCBudWxsLCBuYXZiYXJTdGFydCwgbmF2YmFyRW5kKVxyXG5cclxuICAgIC8vIG5hdmJhci1icmFuZCAobGVmdCBzaWRlIG9mIG5hdmJhciAtIGluY2x1ZGVzIG1vYmlsZSBoYW1idXJnZXIgbWVudSlcclxuICAgIGNvbnN0IGJ1cmdlck1lbnVTcGFuMSA9IGVsQnVpbGRlcihcInNwYW5cIiwgeyBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiIH0pO1xyXG4gICAgY29uc3QgYnVyZ2VyTWVudVNwYW4yID0gZWxCdWlsZGVyKFwic3BhblwiLCB7IFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIgfSk7XHJcbiAgICBjb25zdCBidXJnZXJNZW51U3BhbjMgPSBlbEJ1aWxkZXIoXCJzcGFuXCIsIHsgXCJhcmlhLWhpZGRlblwiOiBcInRydWVcIiB9KTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kQ2hpbGQyID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwicm9sZVwiOiBcImJ1dHRvblwiLCBcImNsYXNzXCI6IFwibmF2YmFyLWJ1cmdlciBidXJnZXJcIiwgXCJhcmlhLWxhYmVsXCI6IFwibWVudVwiLCBcImFyaWEtZXhwYW5kZWRcIjogXCJmYWxzZVwiLCBcImRhdGEtdGFyZ2V0XCI6IFwibmF2YmFyTWVudVwiIH0sIG51bGwsIGJ1cmdlck1lbnVTcGFuMSwgYnVyZ2VyTWVudVNwYW4yLCBidXJnZXJNZW51U3BhbjMpO1xyXG4gICAgY29uc3QgbmF2YmFyQnJhbmRDaGlsZDEgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIsIFwiaHJlZlwiOiBcIiNcIiB9LCBudWxsLCBlbEJ1aWxkZXIoXCJpbWdcIiwgeyBcInNyY1wiOiBcImltYWdlcy9maXJlOTBkZWcucG5nXCIsIFwid2lkdGhcIjogXCIxMTJcIiwgXCJoZWlnaHRcIjogXCIyOFwiIH0pKTtcclxuICAgIGNvbnN0IG5hdmJhckJyYW5kID0gZWxCdWlsZGVyKFwiZGl2XCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1icmFuZFwiIH0sIG51bGwsIG5hdmJhckJyYW5kQ2hpbGQxLCBuYXZiYXJCcmFuZENoaWxkMik7XHJcblxyXG4gICAgLy8gbmF2IChwYXJlbnQgbmF2IEhUTUwgZWxlbWVudClcclxuICAgIGNvbnN0IG5hdiA9IGVsQnVpbGRlcihcIm5hdlwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXJcIiwgXCJyb2xlXCI6IFwibmF2aWdhdGlvblwiLCBcImFyaWEtbGFiZWxcIjogXCJtYWluIG5hdmlnYXRpb25cIiB9LCBudWxsLCBuYXZiYXJCcmFuZCwgbmF2YmFyTWVudSk7XHJcblxyXG4gICAgLy8gaWYgbG9nZ2VkIGluLCBhcHBlbmQgYWRkaXRpb25hbCBtZW51IG9wdGlvbnMgdG8gbmF2YmFyIGFuZCByZW1vdmUgc2lnbnVwL2xvZ2luIGJ1dHRvbnNcclxuICAgIGlmIChsb2dnZWRJbkJvb2xlYW4pIHtcclxuICAgICAgLy8gcmVtb3ZlIGxvZyBpbiBhbmQgc2lnbiB1cCBidXR0b25zXHJcbiAgICAgIGNvbnN0IHNpZ251cCA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdO1xyXG4gICAgICBjb25zdCBsb2dpbiA9IGJ1dHRvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzFdO1xyXG4gICAgICBidXR0b25Db250YWluZXIucmVtb3ZlQ2hpbGQoc2lnbnVwKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvZ2luKTtcclxuICAgICAgLy8gYWRkIGxvZ291dCBidXR0b25cclxuICAgICAgY29uc3QgYnV0dG9uMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWRhcmtcIiB9LCBcIkxvZ291dFwiKTtcclxuICAgICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGJ1dHRvbjMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGFuZCBhcHBlbmQgbmV3IG1lbnUgaXRlbXMgZm9yIHVzZXJcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMSA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIlByb2ZpbGVcIik7XHJcbiAgICAgIGNvbnN0IGxvZ2dlZEluSXRlbTIgPSBlbEJ1aWxkZXIoXCJhXCIsIHsgXCJjbGFzc1wiOiBcIm5hdmJhci1pdGVtXCIgfSwgXCJHYW1lcGxheVwiKTtcclxuICAgICAgY29uc3QgbG9nZ2VkSW5JdGVtMyA9IGVsQnVpbGRlcihcImFcIiwgeyBcImNsYXNzXCI6IFwibmF2YmFyLWl0ZW1cIiB9LCBcIkhlYXRtYXBzXCIpO1xyXG4gICAgICBjb25zdCBsb2dnZWRJbkl0ZW00ID0gZWxCdWlsZGVyKFwiYVwiLCB7IFwiY2xhc3NcIjogXCJuYXZiYXItaXRlbVwiIH0sIFwiTGVhZGVyYm9hcmRcIik7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTEpO1xyXG4gICAgICBuYXZiYXJTdGFydC5hcHBlbmRDaGlsZChsb2dnZWRJbkl0ZW0yKTtcclxuICAgICAgbmF2YmFyU3RhcnQuYXBwZW5kQ2hpbGQobG9nZ2VkSW5JdGVtMyk7XHJcbiAgICAgIG5hdmJhclN0YXJ0LmFwcGVuZENoaWxkKGxvZ2dlZEluSXRlbTQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBldmVudCBsaXN0ZW5lcnMgdG8gbmF2YmFyXHJcbiAgICB0aGlzLm5hdmJhckV2ZW50TWFuYWdlcihuYXYpO1xyXG5cclxuICAgIC8vIGFwcGVuZCB0byB3ZWJwYWdlXHJcbiAgICB3ZWJwYWdlTmF2LmFwcGVuZENoaWxkKG5hdik7XHJcblxyXG4gIH0sXHJcblxyXG4gIG5hdmJhckV2ZW50TWFuYWdlcihuYXYpIHtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5sb2dpbkNsaWNrZWQsIGV2ZW50KTtcclxuICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaWdudXBDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMubG9nb3V0Q2xpY2tlZCwgZXZlbnQpO1xyXG4gICAgbmF2LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnByb2ZpbGVDbGlja2VkLCBldmVudCk7XHJcbiAgICBuYXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuZ2FtZXBsYXlDbGlja2VkLCBldmVudCk7XHJcbiAgfSxcclxuXHJcbiAgbG9naW5DbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJMb2dpblwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9naW5Gb3JtKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc2lnbnVwQ2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiU2lnbiB1cFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAuc2lnbnVwRm9ybSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGxvZ291dENsaWNrZWQoZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSBcIkxvZ291dFwiKSB7XHJcbiAgICAgIGxvZ2luT3JTaWdudXAubG9nb3V0VXNlcigpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHByb2ZpbGVDbGlja2VkKGUpIHtcclxuICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gXCJQcm9maWxlXCIpIHtcclxuICAgICAgcHJvZmlsZS5sb2FkUHJvZmlsZSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGdhbWVwbGF5Q2xpY2tlZChlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09IFwiR2FtZXBsYXlcIikge1xyXG4gICAgICBnYW1lcGxheS5sb2FkR2FtZXBsYXkoKTtcclxuICAgICAgc2hvdERhdGEucmVzZXRHbG9iYWxTaG90VmFyaWFibGVzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmF2YmFyIiwiaW1wb3J0IGVsQnVpbGRlciBmcm9tIFwiLi9lbGVtZW50QnVpbGRlclwiXHJcbmltcG9ydCBBUEkgZnJvbSBcIi4vQVBJXCJcclxuXHJcbmNvbnN0IHdlYnBhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1tYXN0ZXJcIik7XHJcblxyXG5jb25zdCBwcm9maWxlID0ge1xyXG5cclxuICBsb2FkUHJvZmlsZSgpIHtcclxuICAgIHdlYnBhZ2UuaW5uZXJIVE1MID0gbnVsbDtcclxuICAgIGNvbnN0IGFjdGl2ZVVzZXIgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKFwiYWN0aXZlVXNlcklkXCIpO1xyXG4gICAgQVBJLmdldFNpbmdsZUl0ZW0oYWN0aXZlVXNlciwgXCJ1c2Vyc1wiKS50aGVuKHVzZXIgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlUGljID0gZWxCdWlsZGVyKFwiaW1nXCIsIHsgXCJzcmNcIjogXCJpbWFnZXMvb2N0YW5lLmpwZ1wiLCBcImNsYXNzXCI6IFwiXCIgfSlcclxuICAgICAgY29uc3QgbmFtZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiY2xhc3NcIjogXCJub3RpZmljYXRpb25cIiB9LCBgTmFtZTogJHt1c2VyLm5hbWV9YClcclxuICAgICAgY29uc3QgdXNlcm5hbWUgPSBlbEJ1aWxkZXIoXCJkaXZcIiwgeyBcImNsYXNzXCI6IFwibm90aWZpY2F0aW9uXCIgfSwgYFVzZXJuYW1lOiAke3VzZXIudXNlcm5hbWV9YClcclxuICAgICAgY29uc3QgcGxheWVyUHJvZmlsZSA9IGVsQnVpbGRlcihcImRpdlwiLCB7IFwiaWRcIjogXCJwbGF5ZXJQcm9maWxlXCIsIFwiY2xhc3NcIjogXCJjb250YWluZXJcIiB9LCBudWxsLCBwcm9maWxlUGljLCBuYW1lLCB1c2VybmFtZSlcclxuICAgICAgd2VicGFnZS5hcHBlbmRDaGlsZChwbGF5ZXJQcm9maWxlKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwcm9maWxlIiwiY2xhc3Mgc2hvdE9uR29hbCB7XHJcbiAgc2V0IGZpZWxkWChmaWVsZFgpIHtcclxuICAgIHRoaXMuX2ZpZWxkWCA9IGZpZWxkWFxyXG4gIH1cclxuICBzZXQgZmllbGRZKGZpZWxkWSkge1xyXG4gICAgdGhpcy5fZmllbGRZID0gZmllbGRZXHJcbiAgfVxyXG4gIHNldCBnb2FsWChnb2FsWCkge1xyXG4gICAgdGhpcy5fZ29hbFggPSBnb2FsWFxyXG4gIH1cclxuICBzZXQgZ29hbFkoZ29hbFkpIHtcclxuICAgIHRoaXMuX2dvYWxZID0gZ29hbFlcclxuICB9XHJcbiAgc2V0IGFlcmlhbChhZXJpYWxCb29sZWFuKSB7XHJcbiAgICB0aGlzLl9hZXJpYWwgPSBhZXJpYWxCb29sZWFuXHJcbiAgfVxyXG4gIHNldCBiYWxsU3BlZWQoYmFsbFNwZWVkKSB7XHJcbiAgICB0aGlzLmJhbGxfc3BlZWQgPSBiYWxsU3BlZWRcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNob3RPbkdvYWwiLCJpbXBvcnQgZWxCdWlsZGVyIGZyb20gXCIuL2VsZW1lbnRCdWlsZGVyXCJcclxuaW1wb3J0IHNob3RPbkdvYWwgZnJvbSBcIi4vc2hvdENsYXNzXCJcclxuXHJcbmxldCBzaG90Q291bnRlciA9IDA7XHJcbmxldCBlZGl0aW5nU2hvdCA9IGZhbHNlOyAvL2VkaXRpbmcgc2hvdCBpcyB1c2VkIGZvciBib3RoIG5ldyBhbmQgb2xkIHNob3RzXHJcbmxldCBzaG90T2JqID0gdW5kZWZpbmVkO1xyXG5sZXQgc2hvdEFycmF5ID0gW107IC8vIHJlc2V0IHdoZW4gZ2FtZSBpcyBzYXZlZFxyXG5sZXQgcHJldmlvdXNTaG90RGF0YTsgLy8gZ2xvYmFsIHZhciB1c2VkIHdpdGggc2hvdCBlZGl0aW5nXHJcbmxldCBwcmV2aW91c1Nob3RGaWVsZFg7IC8vIGdsb2JhbCB2YXIgdXNlZCB3aXRoIHNob3QgZWRpdGluZ1xyXG5sZXQgcHJldmlvdXNTaG90RmllbGRZOyAvLyBnbG9iYWwgdmFyIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdEdvYWxYOyAvLyBnbG9iYWwgdmFyIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxubGV0IHByZXZpb3VzU2hvdEdvYWxZOyAvLyBnbG9iYWwgdmFyIHVzZWQgd2l0aCBzaG90IGVkaXRpbmdcclxuXHJcbmNvbnN0IHNob3REYXRhID0ge1xyXG5cclxuICByZXNldEdsb2JhbFNob3RWYXJpYWJsZXMoKSB7XHJcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGdhbWVwbGF5IGlzIGNsaWNrZWQgb24gdGhlIG5hdmJhciAoZnJvbSBuYXZiYXIuanMpIGluIG9yZGVyIHRvIHByZXZlbnQgYnVncyB3aXRoIHByZXZpb3VzbHkgY3JlYXRlZCBzaG90c1xyXG4gICAgLy9UT0RPOiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBcIlNhdmUgR2FtZVwiXHJcbiAgICBzaG90Q291bnRlciA9IDA7XHJcbiAgICBlZGl0aW5nU2hvdCA9IGZhbHNlO1xyXG4gICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgIHNob3RBcnJheSA9IFtdO1xyXG4gICAgcHJldmlvdXNTaG90RGF0YSA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEZpZWxkWSA9IHVuZGVmaW5lZDtcclxuICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlTmV3U2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZ1wiKTtcclxuICAgIGNvbnN0IGdvYWxJbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nXCIpO1xyXG4gICAgc2hvdE9iaiA9IG5ldyBzaG90T25Hb2FsO1xyXG5cclxuICAgIC8vIHByZXZlbnQgdXNlciBmcm9tIHNlbGVjdGluZyBhbnkgZWRpdCBzaG90IGJ1dHRvbnNcclxuICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnModHJ1ZSk7XHJcblxyXG4gICAgZWRpdGluZ1Nob3QgPSB0cnVlO1xyXG4gICAgYnRuX25ld1Nob3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKVxyXG4gICAgZ29hbEltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpXHJcblxyXG4gICAgLy8gYWN0aXZhdGUgY2xpY2sgZnVuY3Rpb25hbGl0eSBhbmQgY29uZGl0aW9uYWwgc3RhdGVtZW50cyBvbiBib3RoIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gIH0sXHJcblxyXG4gIGdldENsaWNrQ29vcmRzKGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gZ2V0cyB0aGUgcmVsYXRpdmUgeCBhbmQgeSBvZiB0aGUgY2xpY2sgd2l0aGluIHRoZSBmaWVsZCBpbWFnZSBjb250YWluZXJcclxuICAgIC8vIGFuZCB0aGVuIGNhbGxzIHRoZSBmdW5jdGlvbiB0aGF0IGFwcGVuZHMgYSBtYXJrZXIgb24gdGhlIHBhZ2VcclxuICAgIGxldCBwYXJlbnRDb250YWluZXI7XHJcbiAgICBpZiAoZS50YXJnZXQuaWQgPT09IFwiZmllbGQtaW1nXCIpIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWctcGFyZW50XCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICB9XHJcbiAgICAvLyBvZmZzZXRYIGFuZCBZIGFyZSB0aGUgeCBhbmQgeSBjb29yZGluYXRlcyAocGl4ZWxzKSBvZiB0aGUgY2xpY2sgaW4gdGhlIGNvbnRhaW5lclxyXG4gICAgLy8gdGhlIGV4cHJlc3Npb25zIGRpdmlkZSB0aGUgY2xpY2sgeCBhbmQgeSBieSB0aGUgcGFyZW50IGZ1bGwgd2lkdGggYW5kIGhlaWdodFxyXG4gICAgY29uc3QgeENvb3JkUmVsYXRpdmUgPSBOdW1iZXIoKGUub2Zmc2V0WCAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkudG9GaXhlZCgzKSlcclxuICAgIGNvbnN0IHlDb29yZFJlbGF0aXZlID0gTnVtYmVyKChlLm9mZnNldFkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeENvb3JkUmVsYXRpdmUsIHlDb29yZFJlbGF0aXZlLCBwYXJlbnRDb250YWluZXIpXHJcbiAgfSxcclxuXHJcbiAgbWFya0NsaWNrb25JbWFnZSh4LCB5LCBwYXJlbnRDb250YWluZXIpIHtcclxuICAgIGxldCBtYXJrZXJJZDtcclxuICAgIGlmIChwYXJlbnRDb250YWluZXIuaWQgPT09IFwiZmllbGQtaW1nLXBhcmVudFwiKSB7XHJcbiAgICAgIG1hcmtlcklkID0gXCJzaG90LW1hcmtlci1maWVsZFwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWFya2VySWQgPSBcInNob3QtbWFya2VyLWdvYWxcIjtcclxuICAgIH1cclxuICAgIC8vIGFkanVzdCBmb3IgNTAlIG9mIHdpZHRoIGFuZCBoZWlnaHQgb2YgbWFya2VyIHNvIGl0J3MgY2VudGVyZWQgYWJvdXQgbW91c2UgcG9pbnRlclxyXG4gICAgbGV0IGFkanVzdE1hcmtlclggPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG4gICAgbGV0IGFkanVzdE1hcmtlclkgPSAxMi41IC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIE5PVCBhbHJlYWR5IGEgbWFya2VyLCB0aGVuIG1ha2Ugb25lIGFuZCBwbGFjZSBpdFxyXG4gICAgaWYgKCFwYXJlbnRDb250YWluZXIuY29udGFpbnMoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpKSkge1xyXG4gICAgICB0aGlzLmdlbmVyYXRlTWFya2VyKHBhcmVudENvbnRhaW5lciwgYWRqdXN0TWFya2VyWCwgYWRqdXN0TWFya2VyWSwgbWFya2VySWQsIHgsIHkpO1xyXG4gICAgICAvLyBlbHNlIG1vdmUgdGhlIGV4aXN0aW5nIG1hcmtlciB0byB0aGUgbmV3IHBvc2l0aW9uXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm1vdmVNYXJrZXIobWFya2VySWQsIHgsIHksIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclkpO1xyXG4gICAgfVxyXG4gICAgLy8gc2F2ZSBjb29yZGluYXRlcyB0byBvYmplY3RcclxuICAgIHRoaXMuYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSlcclxuICB9LFxyXG5cclxuICBnZW5lcmF0ZU1hcmtlcihwYXJlbnRDb250YWluZXIsIGFkanVzdE1hcmtlclgsIGFkanVzdE1hcmtlclksIG1hcmtlcklkLCB4LCB5KSB7XHJcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgZGl2LmlkID0gbWFya2VySWQ7XHJcbiAgICBkaXYuc3R5bGUud2lkdGggPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIjI1cHhcIjtcclxuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImxpZ2h0Z3JlZW5cIjtcclxuICAgIGRpdi5zdHlsZS5ib3JkZXIgPSBcIjFweCBzb2xpZCBibGFja1wiO1xyXG4gICAgZGl2LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiNTAlXCI7XHJcbiAgICBkaXYuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICBkaXYuc3R5bGUubGVmdCA9ICh4IC0gYWRqdXN0TWFya2VyWCkgKiAxMDAgKyBcIiVcIjtcclxuICAgIGRpdi5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgICBwYXJlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQoZGl2KTtcclxuICB9LFxyXG5cclxuICBtb3ZlTWFya2VyKG1hcmtlcklkLCB4LCB5LCBhZGp1c3RNYXJrZXJYLCBhZGp1c3RNYXJrZXJZKSB7XHJcbiAgICBjb25zdCBjdXJyZW50TWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS5sZWZ0ID0gKHggLSBhZGp1c3RNYXJrZXJYKSAqIDEwMCArIFwiJVwiO1xyXG4gICAgY3VycmVudE1hcmtlci5zdHlsZS50b3AgPSAoeSAtIGFkanVzdE1hcmtlclkpICogMTAwICsgXCIlXCI7XHJcbiAgfSxcclxuXHJcbiAgYWRkQ29vcmRzVG9DbGFzcyhtYXJrZXJJZCwgeCwgeSkge1xyXG4gICAgLy8gdGhpcyBmdW5jdGlvbiB1cGRhdGVzIHRoZSBpbnN0YW5jZSBvZiBzaG90T25Hb2FsIGNsYXNzIHRvIHJlY29yZCBjbGljayBjb29yZGluYXRlc1xyXG4gICAgLy8gaWYgYSBzaG90IGlzIGJlaW5nIGVkaXRlZCwgdGhlbiBhcHBlbmQgdGhlIGNvb3JkaW5hdGVzIHRvIHRoZSBvYmplY3QgaW4gcXVlc3Rpb25cclxuICAgIGlmIChwcmV2aW91c1Nob3REYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWYgKG1hcmtlcklkID09PSBcInNob3QtbWFya2VyLWZpZWxkXCIpIHtcclxuICAgICAgICAvLyB1c2UgZ2xvYmFsIHZhcnMgaW5zdGVhZCBvZiB1cGRhdGluZyBvYmplY3QgZGlyZWN0bHkgaGVyZSB0byBwcmV2ZW50IGFjY2lkZW50YWwgZWRpdGluZyBvZiBtYXJrZXIgd2l0aG91dCBjbGlja2luZyBcInNhdmUgc2hvdFwiXHJcbiAgICAgICAgcHJldmlvdXNTaG90RmllbGRYID0geDtcclxuICAgICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB5O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0geDtcclxuICAgICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gb3RoZXJ3aXNlLCBhIG5ldyBzaG90IGlzIGJlaW5nIGNyZWF0ZWQsIHNvIGFwcGVuZCBjb29yZGluYXRlcyB0byB0aGUgbmV3IG9iamVjdFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKG1hcmtlcklkID09PSBcInNob3QtbWFya2VyLWZpZWxkXCIpIHtcclxuICAgICAgICBzaG90T2JqLmZpZWxkWCA9IHg7XHJcbiAgICAgICAgc2hvdE9iai5maWVsZFkgPSB5O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNob3RPYmouZ29hbFggPSB4O1xyXG4gICAgICAgIHNob3RPYmouZ29hbFkgPSB5O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY2FuY2VsU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZ1BhcmVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGdvYWxJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvYWwtaW1nLXBhcmVudFwiKTtcclxuICAgIGNvbnN0IGZpZWxkTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1maWVsZFwiKTtcclxuICAgIGNvbnN0IGdvYWxNYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3QtbWFya2VyLWdvYWxcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gbnVsbDtcclxuICAgICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICAgICAgLy8gaWYgYSBuZXcgc2hvdCBpcyBiZWluZyBjcmVhdGVkLCBjYW5jZWwgdGhlIG5ldyBpbnN0YW5jZSBvZiBzaG90Q2xhc3NcclxuICAgICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gaWYgYSBwcmV2aW91c2x5IHNhdmVkIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHNldCBnbG9iYWwgdmFycyB0byB1bmRlZmluZWRcclxuICAgICAgcHJldmlvdXNTaG90RGF0YSA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RGaWVsZFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEdvYWxYID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWSA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVtb3ZlIG1hcmtlcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBpZiAoZmllbGRNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBmaWVsZEltZ1BhcmVudC5yZW1vdmVDaGlsZChmaWVsZE1hcmtlcik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGdvYWxNYXJrZXIgIT09IG51bGwpIHtcclxuICAgICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZSBjbGljayBsaXN0ZW5lcnMgZnJvbSBmaWVsZCBhbmQgZ29hbFxyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGVkaXQgc2hvdCBidXR0b25zXHJcbiAgICAgIHNob3REYXRhLmRpc2FibGVFZGl0U2hvdGJ1dHRvbnMoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICBzYXZlU2hvdCgpIHtcclxuICAgIGNvbnN0IGJ0bl9uZXdTaG90ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuZXdTaG90XCIpO1xyXG4gICAgY29uc3QgZmllbGRJbWdQYXJlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpZWxkLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nUGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIik7XHJcbiAgICBjb25zdCBmaWVsZEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nXCIpO1xyXG4gICAgY29uc3QgZ29hbEltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29hbC1pbWdcIik7XHJcbiAgICBjb25zdCBmaWVsZE1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvdC1tYXJrZXItZmllbGRcIik7XHJcbiAgICBjb25zdCBnb2FsTWFya2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90LW1hcmtlci1nb2FsXCIpO1xyXG4gICAgY29uc3QgaW5wdF9iYWxsU3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhbGxTcGVlZElucHV0XCIpO1xyXG4gICAgY29uc3Qgc2VsX2FlcmlhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWVyaWFsSW5wdXRcIik7XHJcbiAgICBjb25zdCBzaG90QnRuQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG90Q29udHJvbHNcIik7XHJcblxyXG4gICAgaWYgKCFlZGl0aW5nU2hvdCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVkaXRpbmdTaG90ID0gZmFsc2U7XHJcbiAgICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIC8vIGNsZWFyIGZpZWxkIGFuZCBnb2FsIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAgICBmaWVsZEltZy5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEuZ2V0Q2xpY2tDb29yZHMpO1xyXG4gICAgICBnb2FsSW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzaG90RGF0YS5nZXRDbGlja0Nvb3Jkcyk7XHJcbiAgICAgIC8vIHJlbW92ZSBtYXJrZXJzIGZyb20gZmllbGQgYW5kIGdvYWxcclxuICAgICAgZmllbGRJbWdQYXJlbnQucmVtb3ZlQ2hpbGQoZmllbGRNYXJrZXIpO1xyXG4gICAgICBnb2FsSW1nUGFyZW50LnJlbW92ZUNoaWxkKGdvYWxNYXJrZXIpO1xyXG4gICAgICAvLyBjb25kaXRpb25hbCBzdGF0ZW1lbnQgdG8gc2F2ZSBjb3JyZWN0IG9iamVjdCAoaS5lLiBzaG90IGJlaW5nIGVkaXRlZCB2cy4gbmV3IHNob3QpXHJcbiAgICAgIC8vIGlmIHNob3QgaXMgYmVpbmcgZWRpdGVkLCB0aGVuIHByZXZpb3VzU2hvdERhdGEgd2lsbCBub3QgYmUgdW5kZWZpbmVkXHJcbiAgICAgIGlmIChwcmV2aW91c1Nob3REYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoc2VsX2FlcmlhbC52YWx1ZSA9PT0gXCJBZXJpYWxcIikgeyBwcmV2aW91c1Nob3REYXRhLl9hZXJpYWwgPSB0cnVlIH0gZWxzZSB7IHByZXZpb3VzU2hvdERhdGEuX2FlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgcHJldmlvdXNTaG90RGF0YS5iYWxsX3NwZWVkID0gaW5wdF9iYWxsU3BlZWQudmFsdWU7XHJcbiAgICAgICAgcHJldmlvdXNTaG90RGF0YS5fZmllbGRYID0gcHJldmlvdXNTaG90RmllbGRYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdERhdGEuX2ZpZWxkWSA9IHByZXZpb3VzU2hvdEZpZWxkWTtcclxuICAgICAgICBwcmV2aW91c1Nob3REYXRhLl9nb2FsWCA9IHByZXZpb3VzU2hvdEdvYWxYO1xyXG4gICAgICAgIHByZXZpb3VzU2hvdERhdGEuX2dvYWxZID0gcHJldmlvdXNTaG90R29hbFk7XHJcbiAgICAgICAgLy8gZWxzZSBzYXZlIHRvIG5ldyBpbnN0YW5jZSBvZiBjbGFzcyBhbmQgYXBwZW5kIGJ1dHRvbiB0byBwYWdlIHdpdGggY29ycmVjdCBJRCBmb3IgZWRpdGluZ1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZWxfYWVyaWFsLnZhbHVlID09PSBcIkFlcmlhbFwiKSB7IHNob3RPYmouYWVyaWFsID0gdHJ1ZSB9IGVsc2UgeyBzaG90T2JqLmFlcmlhbCA9IGZhbHNlIH07XHJcbiAgICAgICAgc2hvdE9iai5iYWxsU3BlZWQgPSBpbnB0X2JhbGxTcGVlZC52YWx1ZTtcclxuICAgICAgICBzaG90QXJyYXkucHVzaChzaG90T2JqKTtcclxuICAgICAgICAvLyBhcHBlbmQgbmV3IGJ1dHRvblxyXG4gICAgICAgIHNob3RDb3VudGVyKys7XHJcbiAgICAgICAgY29uc3QgbmV3U2hvdEJ0biA9IGVsQnVpbGRlcihcImJ1dHRvblwiLCB7IFwiaWRcIjogYHNob3QtJHtzaG90Q291bnRlcn1gLCBcImNsYXNzXCI6IFwiYnV0dG9uIGlzLWxpbmtcIiB9LCBgU2hvdCAke3Nob3RDb3VudGVyfWApO1xyXG4gICAgICAgIHNob3RCdG5Db250YWluZXIuYXBwZW5kQ2hpbGQobmV3U2hvdEJ0bik7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYHNob3QtJHtzaG90Q291bnRlcn1gKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2hvdERhdGEucmVuZGVyU2F2ZWRTaG90KTtcclxuICAgICAgfVxyXG4gICAgICAvL1RPRE86IGFkZCBjb25kaXRpb24gdG8gcHJldmVudCBibGFuayBlbnRyaWVzIGFuZCBtaXNzaW5nIGNvb3JkaW5hdGVzXHJcbiAgICAgIGNvbnNvbGUubG9nKHNob3RBcnJheSlcclxuXHJcbiAgICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gbnVsbDtcclxuICAgICAgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjtcclxuICAgICAgLy8gY2FuY2VsIHRoZSBuZXcgaW5zdGFuY2Ugb2Ygc2hvdENsYXNzIChtYXR0ZXJzIGlmIGEgbmV3IHNob3QgaXMgYmVpbmcgY3JlYXRlZClcclxuICAgICAgc2hvdE9iaiA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gc2V0IGdsb2JhbCB2YXJzIHRvIHVuZGVmaW5lZCAobWF0dGVycyBpZiBhIHByZXZpb3VzbHkgc2F2ZWQgc2hvdCBpcyBiZWluZyBlZGl0ZWQpXHJcbiAgICAgIHByZXZpb3VzU2hvdERhdGEgPSB1bmRlZmluZWQ7XHJcbiAgICAgIHByZXZpb3VzU2hvdEZpZWxkWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90RmllbGRZID0gdW5kZWZpbmVkO1xyXG4gICAgICBwcmV2aW91c1Nob3RHb2FsWCA9IHVuZGVmaW5lZDtcclxuICAgICAgcHJldmlvdXNTaG90R29hbFkgPSB1bmRlZmluZWQ7XHJcbiAgICAgIC8vIGFsbG93IHVzZXIgdG8gc2VsZWN0IGFueSBlZGl0IHNob3QgYnV0dG9uc1xyXG4gICAgICBzaG90RGF0YS5kaXNhYmxlRWRpdFNob3RidXR0b25zKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyU2F2ZWRTaG90KGUpIHtcclxuICAgIC8vIHRoaXMgZnVuY3Rpb24gcmVmZXJlbmNlcyB0aGUgc2hvdEFycmF5IHRvIGdldCBhIHNob3Qgb2JqZWN0IHRoYXQgbWF0Y2hlcyB0aGUgc2hvdCMgYnV0dG9uIGNsaWNrZWQgKGUuZy4gc2hvdCAyIGJ1dHRvbiA9IGluZGV4IDEgb2YgdGhlIHNob3RBcnJheSlcclxuICAgIC8vIHRoZSBmdW5jdGlvbiAoYW5kIGl0cyBhc3NvY2lhdGVkIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgaW4gb3RoZXIgbG9jYWwgZnVuY3Rpb25zKSBoYXMgdGhlc2UgYmFzaWMgcmVxdWlyZW1lbnRzOlxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBjbGljayBsaXN0ZW5lcnMgb24gaW1hZ2VzXHJcbiAgICAvLyByZXZpdmUgYSBzYXZlZCBpbnN0YW5jZSBvZiBzaG90Q2xhc3MgZm9yIGVkaXRpbmcgc2hvdCBjb29yZGluYXRlcywgYmFsbCBzcGVlZCwgYW5kIGFlcmlhbFxyXG4gICAgLy8gcmVuZGVyIG1hcmtlcnMgZm9yIGV4aXN0aW5nIGNvb3JkaW5hdGVzIG9uIGZpZWxkIGFuZCBnb2FsIGltYWdlc1xyXG4gICAgLy8gYWZmb3JkYW5jZSB0byBzYXZlIGVkaXRzXHJcbiAgICAvLyBhZmZvcmRhbmNlIHRvIGNhbmNlbCBlZGl0c1xyXG4gICAgLy8gdGhlIGRhdGEgaXMgcmVuZGVyZWQgb24gdGhlIHBhZ2UgYW5kIGNhbiBiZSBzYXZlZCAob3ZlcndyaXR0ZW4pIGJ5IHVzaW5nIHRoZSBcInNhdmUgc2hvdFwiIGJ1dHRvbiBvciBjYW5jZWxlZCBieSBjbGlja2luZyB0aGUgXCJjYW5jZWwgc2hvdFwiIGJ1dHRvblxyXG4gICAgY29uc3QgYnRuX25ld1Nob3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5ld1Nob3RcIik7XHJcbiAgICBjb25zdCBpbnB0X2JhbGxTcGVlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFsbFNwZWVkSW5wdXRcIik7XHJcbiAgICBjb25zdCBzZWxfYWVyaWFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZXJpYWxJbnB1dFwiKTtcclxuICAgIGNvbnN0IGZpZWxkSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWVsZC1pbWdcIik7XHJcbiAgICBjb25zdCBnb2FsSW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZ1wiKTtcclxuXHJcbiAgICAvLyBwcmV2ZW50IG5ldyBzaG90IGJ1dHRvbiBmcm9tIGJlaW5nIGNsaWNrZWRcclxuICAgIGJ0bl9uZXdTaG90LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIC8vIGFsbG93IGNhbmNlbCBhbmQgc2F2ZWQgYnV0dG9ucyB0byBiZSBjbGlja2VkXHJcbiAgICBlZGl0aW5nU2hvdCA9IHRydWU7XHJcbiAgICAvLyBnZXQgSUQgb2Ygc2hvdCMgYnRuIGNsaWNrZWQgYW5kIGFjY2VzcyBzaG90QXJyYXkgYXQgW2J0bklEIC0gMV1cclxuICAgIGxldCBidG5JZCA9IGUudGFyZ2V0LmlkLnNsaWNlKDUpO1xyXG4gICAgcHJldmlvdXNTaG90RGF0YSA9IHNob3RBcnJheVtidG5JZCAtIDFdO1xyXG4gICAgLy8gcmVuZGVyIGJhbGwgc3BlZWQgYW5kIGFlcmlhbCBkcm9wZG93biBmb3IgdGhlIHNob3RcclxuICAgIGlucHRfYmFsbFNwZWVkLnZhbHVlID0gcHJldmlvdXNTaG90RGF0YS5iYWxsX3NwZWVkO1xyXG4gICAgaWYgKHByZXZpb3VzU2hvdERhdGEuX2FlcmlhbCA9PT0gdHJ1ZSkgeyBzZWxfYWVyaWFsLnZhbHVlID0gXCJBZXJpYWxcIjsgfSBlbHNlIHsgc2VsX2FlcmlhbC52YWx1ZSA9IFwiU3RhbmRhcmRcIjsgfVxyXG4gICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyB0byBmaWVsZCBhbmQgZ29hbFxyXG4gICAgZmllbGRJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIGdvYWxJbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHNob3REYXRhLmdldENsaWNrQ29vcmRzKTtcclxuICAgIC8vIHJlbmRlciBzaG90IG1hcmtlciBvbiBmaWVsZFxyXG4gICAgbGV0IHBhcmVudENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmllbGQtaW1nLXBhcmVudFwiKVxyXG4gICAgbGV0IHggPSAocHJldmlvdXNTaG90RGF0YS5fZmllbGRYICogcGFyZW50Q29udGFpbmVyLm9mZnNldFdpZHRoKSAvIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgIGxldCB5ID0gKHByZXZpb3VzU2hvdERhdGEuX2ZpZWxkWSAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRIZWlnaHQpIC8gcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuICAgIC8vIHJlbmRlciBnb2FsIG1hcmtlciBvbiBmaWVsZFxyXG4gICAgcGFyZW50Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb2FsLWltZy1wYXJlbnRcIilcclxuICAgIHggPSBOdW1iZXIoKChwcmV2aW91c1Nob3REYXRhLl9nb2FsWCAqIHBhcmVudENvbnRhaW5lci5vZmZzZXRXaWR0aCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0V2lkdGgpLnRvRml4ZWQoMykpO1xyXG4gICAgeSA9IE51bWJlcigoKHByZXZpb3VzU2hvdERhdGEuX2dvYWxZICogcGFyZW50Q29udGFpbmVyLm9mZnNldEhlaWdodCkgLyBwYXJlbnRDb250YWluZXIub2Zmc2V0SGVpZ2h0KS50b0ZpeGVkKDMpKTtcclxuICAgIHNob3REYXRhLm1hcmtDbGlja29uSW1hZ2UoeCwgeSwgcGFyZW50Q29udGFpbmVyKTtcclxuXHJcbiAgfSxcclxuXHJcbiAgZGlzYWJsZUVkaXRTaG90YnV0dG9ucyhkaXNhYmxlT3JOb3QpIHtcclxuICAgIC8vIGZvciBlYWNoIGJ1dHRvbiBhZnRlciBcIk5ldyBTaG90XCIsIFwiU2F2ZSBTaG90XCIsIGFuZCBcIkNhbmNlbCBTaG90XCIgZGlzYWJsZSB0aGUgYnV0dG9ucyBpZiB0aGUgdXNlciBpcyBjcmVhdGluZyBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSB0cnVlKSBvciBlbmFibGUgdGhlbSBvbiBzYXZlL2NhbmNlbCBvZiBhIG5ldyBzaG90IChkaXNhYmxlT3JOb3QgPSBmYWxzZSlcclxuICAgIGNvbnN0IHNob3RCdG5Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3RDb250cm9sc1wiKTtcclxuICAgIGxldCBlZGl0QnRuO1xyXG4gICAgbGV0IGxlbmd0aCA9IHNob3RCdG5Db250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGhcclxuICAgIGZvciAobGV0IGkgPSAzOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWRpdEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBzaG90LSR7aSAtIDJ9YClcclxuICAgICAgZWRpdEJ0bi5kaXNhYmxlZCA9IGRpc2FibGVPck5vdFxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzaG90RGF0YSJdfQ==
