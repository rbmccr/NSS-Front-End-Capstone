import elBuilder from "./elementBuilder"
import API from "./API"
import navbar from "./navbar"

const webpage = document.getElementById("container-master");
const webpageNav = document.getElementById("nav-master");

const loginOrSignup = {

  loginForm() {
    // this function builds a login form that validates user input. Successful login stores user id in session storage
    const loginButton = elBuilder("button", { "id": "loginNow", "class": "button is-dark" }, "Login now");
    const loginBtnControl = elBuilder("div", { "class": "buttons is-centered" }, null, loginButton)

    // password input with icon
    const loginPasswordIcon = elBuilder("i", { "class": "fas fa-lock" })
    const loginPasswordIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, loginPasswordIcon)
    const loginInput_password = elBuilder("input", { "id": "passwordInput", "class": "input", "type": "password", "placeholder": "enter password" });

    const loginPasswordControl = elBuilder("div", { "class": "control has-icons-left" }, null, loginInput_password, loginPasswordIconDiv)
    const loginPasswordLabel = elBuilder("label", { "class": "label" }, "Password")
    const loginPasswordField = elBuilder("div", { "class": "field" }, null, loginPasswordLabel, loginPasswordControl)

    // username input with icon
    const loginUsernameIcon = elBuilder("i", { "class": "fas fa-user" })
    const loginUsernameIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, loginUsernameIcon)
    const loginInput_username = elBuilder("input", { "id": "usernameInput", "class": "input", "type": "text", "placeholder": "enter username" });

    const loginUsernameControl = elBuilder("div", { "class": "control has-icons-left" }, null, loginInput_username, loginUsernameIconDiv)
    const loginUsernameLabel = elBuilder("label", { "class": "label" }, "Username")
    const loginUsernameField = elBuilder("div", { "class": "field" }, null, loginUsernameLabel, loginUsernameControl)

    // form
    const loginForm = elBuilder("form", { "id": "loginForm", "class": "box", "style": "margin-top:-57px; min-width:20%"}, null, loginUsernameField, loginPasswordField, loginBtnControl);

    webpage.innerHTML = null;
    // set style of master container to display flex to align forms in center of container
    webpage.style.display = "flex";
    webpage.style.justifyContent = "center";
    webpage.style.alignItems = "center";
    webpage.appendChild(loginForm);
    this.userEventManager();
  },

  signupForm() {
    const signupButton = elBuilder("button", { "id": "signupNow", "class": "button is-dark" }, "Sign up now");
    const signupBtnControl = elBuilder("div", { "class": "buttons is-centered" }, null, signupButton)

    // name input with icon
    const signupNameIcon = elBuilder("i", { "class": "fas fa-pencil-alt" })
    const signupNameIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, signupNameIcon)
    const signupInput_name = elBuilder("input", { "id": "nameInput", "class": "input", "type": "text", "placeholder": "enter name" });

    const signupNameControl = elBuilder("div", { "class": "control has-icons-left" }, null, signupInput_name, signupNameIconDiv)
    const signupNameLabel = elBuilder("label", { "class": "label" }, "Name")
    const signupNameField = elBuilder("div", { "class": "field" }, null, signupNameLabel, signupNameControl)

    // username input with icon
    const signupUsernameIcon = elBuilder("i", { "class": "fas fa-user" })
    const signupUsernameIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, signupUsernameIcon)
    const signupInput_username = elBuilder("input", { "id": "usernameInput", "class": "input", "type": "text", "placeholder": "enter username" });

    const signupUsernameControl = elBuilder("div", { "class": "control has-icons-left" }, null, signupInput_username, signupUsernameIconDiv)
    const signupUsernameLabel = elBuilder("label", { "class": "label" }, "Username")
    const signupUsernameField = elBuilder("div", { "class": "field" }, null, signupUsernameLabel, signupUsernameControl)

    // email input with icon
    const signupEmailIcon = elBuilder("i", { "class": "fas fa-at" })
    const signupEmailIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, signupEmailIcon)
    const signupInput_email = elBuilder("input", { "id": "emailInput", "class": "input", "type": "email", "placeholder": "enter email" });

    const signupEmailControl = elBuilder("div", { "class": "control has-icons-left" }, null, signupInput_email, signupEmailIconDiv)
    const signupEmailLabel = elBuilder("label", { "class": "label" }, "Email")
    const signupEmailField = elBuilder("div", { "class": "field" }, null, signupEmailLabel, signupEmailControl)

    // password input with icon
    const signupPasswordIcon = elBuilder("i", { "class": "fas fa-lock" })
    const signupPasswordIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, signupPasswordIcon)
    const signupInput_password = elBuilder("input", { "id": "passwordInput", "class": "input", "type": "text", "placeholder": "enter password" });

    const signupPasswordControl = elBuilder("div", { "class": "control has-icons-left" }, null, signupInput_password, signupPasswordIconDiv)
    const signupPasswordLabel = elBuilder("label", { "class": "label" }, "Password")
    const signupPasswordField = elBuilder("div", { "class": "field" }, null, signupPasswordLabel, signupPasswordControl)

    // confirm password input with icon
    const signupConfirmIcon = elBuilder("i", { "class": "fas fa-lock" })
    const signupConfirmIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, signupConfirmIcon)
    const signupInput_confirm = elBuilder("input", { "id": "confirmPassword", "class": "input", "type": "email", "placeholder": "confirm password" });

    const signupConfirmControl = elBuilder("div", { "class": "control has-icons-left" }, null, signupInput_confirm, signupConfirmIconDiv)
    const signupConfirmLabel = elBuilder("label", { "class": "label" }, "Confirm Password")
    const signupConfirmField = elBuilder("div", { "class": "field" }, null, signupConfirmLabel, signupConfirmControl)

    // confirm password input with icon
    const signupProfilePicIcon = elBuilder("i", { "class": "fas fa-image" })
    const signupProfilePicIconDiv = elBuilder("span", { "class": "icon is-small is-left" }, null, signupProfilePicIcon)
    const signupInput_profilePic = elBuilder("input", { "id": "profilePicURL", "class": "input", "type": "email", "placeholder": "provide a URL (optional)" });

    const signupProfilePicControl = elBuilder("div", { "class": "control has-icons-left" }, null, signupInput_profilePic, signupProfilePicIconDiv)
    const signupProfilePicLabel = elBuilder("label", { "class": "label" }, "Profile Picture")
    const signupProfilePicField = elBuilder("div", { "class": "field" }, null, signupProfilePicLabel, signupProfilePicControl)

    // form
    const signupForm = elBuilder("form", { "id": "signupForm", "class": "box", "style":"min-width:20%" }, null, signupNameField, signupUsernameField, signupEmailField, signupPasswordField, signupConfirmField, signupProfilePicField, signupBtnControl);

    webpage.innerHTML = null;
    webpage.style.display = "flex";
    webpage.style.justifyContent = "center";
    webpage.style.alignItems = "center";
    webpage.appendChild(signupForm);
    this.userEventManager();
  },

  // assign event listeners based on which form is on the webpage
  userEventManager() {
    const loginNow = document.getElementById("loginNow")
    const signupNow = document.getElementById("signupNow")
    if (loginNow === null) {
      signupNow.addEventListener("click", this.signupUser, event)
    } else {
      loginNow.addEventListener("click", this.loginUser, event)
    }
  },

  // validate user login form inputs before logging in
  loginUser(e) {
    e.preventDefault();
    const username = document.getElementById("usernameInput").value
    const password = document.getElementById("passwordInput").value
    if (username === "") {
      return
    } else if (password === "") {
      return
    } else {
      API.getAll("users").then(users => users.forEach(user => {
        // validate username and password
        if (user.username.toLowerCase() === username.toLowerCase()) {
          if (user.password === password) {
            loginOrSignup.loginStatusActive(user)
          } else {
            return
          }
        }
      }))
    }
  },

  signupUser(e) {
    e.preventDefault();
    console.log(e)
    const _name = document.getElementById("nameInput").value
    const _username = document.getElementById("usernameInput").value
    const _password = document.getElementById("passwordInput").value
    const confirm = document.getElementById("confirmPassword").value
    let uniqueUsername = true; //changes to false if username already exists
    if (_name === "") {
      return
    } else if (_username === "") {
      return
    } else if (_password === "") {
      return
    } else if (confirm === "") {
      return
    } else if (_password !== confirm) {
      return
    } else {
      API.getAll("users").then(users => users.forEach((user, idx) => {
        // check for existing username in database
        if (user.username.toLowerCase() === _username.toLowerCase()) {
          uniqueUsername = false;
        }
        //at the end of the loop, post
        if (idx === users.length - 1 && uniqueUsername) {
          let newUser = {
            name: _name,
            username: _username,
            password: _password,
          };
          API.postItem("users", newUser).then(user => {
            loginOrSignup.loginStatusActive(user)
          })
        }
      }))
    }
  },

  loginStatusActive(user) {
    sessionStorage.setItem("activeUserId", user.id);
    webpage.innerHTML = null;
    webpageNav.innerHTML = null;
    webpage.style.display = "block";
    navbar.generateNavbar(true); //build logged in version of navbar
  },

  logoutUser() {
    sessionStorage.removeItem("activeUserId");
    webpage.innerHTML = null;
    webpageNav.innerHTML = null;
    webpage.style.display = "block";
    navbar.generateNavbar(false); //build logged out version of navbar
  }

}

export default loginOrSignup