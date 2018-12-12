import elBuilder from "./elementBuilder"
import API from "./API"
import navbar from "./navbar"

const webpage = document.getElementById("container-master");
const webpageNav = document.getElementById("nav-master");

const loginOrSignup = {

  // build a login form that validates user input. Successful login stores user id in session storage
  loginForm() {

    //   <div class="field is-horizontal">
    //      <div class="field-label is-normal">
    //        <label class="label">From</label>
    //      </div>

    //      <div class="field-body">
    //        <div class="field">
    //          <p class="control is-expanded has-icons-left">
    //            <input class="input" type="text" placeholder="Name">
    //            <span class="icon is-small is-left">
    //              <i class="fas fa-user"></i>
    //            </span>
    //          </p>
    //        </div>

    //   <div class="field">
    //     <p class="control is-expanded has-icons-left has-icons-right">
    //       <input class="input is-success" type="email" placeholder="Email" value="alex@smith.com">
    //       <span class="icon is-small is-left">
    //         <i class="fas fa-envelope"></i>
    //       </span>
    //       <span class="icon is-small is-right">
    //         <i class="fas fa-check"></i>
    //       </span>
    //     </p>
    //   </div>


    //     <div class="field">
    //   <label class="label">Name</label>
    //   <div class="control">
    //     <input class="input" type="text" placeholder="Text input">
    //   </div>
    // </div>


    const loginButton = elBuilder("button", { "id": "loginNow", "class": "button is-dark" }, "Login now");
    const loginBtnControl = elBuilder("div", { "class": "buttons is-centered" }, null, loginButton)

    // password input with icon
    const loginPasswordIcon = elBuilder("i", { "class": "fas fa-key" })
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
    const loginForm = elBuilder("form", { "id": "loginForm", "class": "box", "style":"margin-top:-57px" }, null, loginUsernameField, loginPasswordField, loginBtnControl);

    webpage.innerHTML = null;
    // set style of master container to display flex to align forms in center of container
    webpage.style.display = "flex";
    webpage.style.justifyContent = "center";
    webpage.style.alignItems = "center";
    webpage.appendChild(loginForm);
    this.userEventManager();
  },

  signupForm() {
    const signupInput_name = elBuilder("input", { "id": "nameInput", "class": "input", "type": "text", "placeholder": "enter name" });
    const signupInput_username = elBuilder("input", { "id": "usernameInput", "class": "input", "type": "text", "placeholder": "enter username" });
    const signupInput_password = elBuilder("input", { "id": "passwordInput", "class": "input", "type": "text", "placeholder": "enter password" });
    const signupInput_confirm = elBuilder("input", { "id": "confirmPassword", "class": "input", "type": "text", "placeholder": "confirm password" });
    const signupButton = elBuilder("button", { "id": "signupNow", "class": "button is-dark" }, "Sign up now");
    const signupForm = elBuilder("form", { "id": "signupForm", "class": "field box" }, null, signupInput_name, signupInput_username, signupInput_password, signupInput_confirm, signupButton);

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