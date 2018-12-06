import elBuilder from "./elementBuilder"
import loginOrSignup from "./login"
import profile from "./profile"
import gameplay from "./gameplay"
import shotData from "./shotData"
import heatmaps from "./heatmaps"

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
    const button2 = elBuilder("a", { "class": "button is-dark" }, "Login")
    const button1 = elBuilder("a", { "class": "button is-dark" }, "Sign up")
    const buttonContainer = elBuilder("div", { "class": "buttons" }, null, button1, button2)
    const menuItem1 = elBuilder("div", { "class": "navbar-item" }, null, buttonContainer)
    const navbarEnd = elBuilder("div", { "class": "navbar-end" }, null, menuItem1)
    const navbarStart = elBuilder("div", { "class": "navbar-start" })
    const navbarMenu = elBuilder("div", { "id": "navbarMenu", "class": "navbar-menu" }, null, navbarStart, navbarEnd)

    // navbar-brand (left side of navbar - includes mobile hamburger menu)
    const burgerMenuSpan1 = elBuilder("span", { "aria-hidden": "true" });
    const burgerMenuSpan2 = elBuilder("span", { "aria-hidden": "true" });
    const burgerMenuSpan3 = elBuilder("span", { "aria-hidden": "true" });
    const navbarBrandChild2 = elBuilder("a", { "role": "button", "class": "navbar-burger burger", "aria-label": "menu", "aria-expanded": "false", "data-target": "navbarMenu" }, null, burgerMenuSpan1, burgerMenuSpan2, burgerMenuSpan3);
    const navbarBrandChild1 = elBuilder("a", { "class": "navbar-item", "href": "#" }, null, elBuilder("img", { "src": "images/fire90deg.png", "width": "112", "height": "28" }));
    const navbarBrand = elBuilder("div", { "class": "navbar-brand" }, null, navbarBrandChild1, navbarBrandChild2);

    // nav (parent nav HTML element)
    const nav = elBuilder("nav", { "class": "navbar", "role": "navigation", "aria-label": "main navigation" }, null, navbarBrand, navbarMenu);

    // if logged in, append additional menu options to navbar and remove signup/login buttons
    if (loggedInBoolean) {
      // remove log in and sign up buttons
      const signup = buttonContainer.childNodes[0];
      const login = buttonContainer.childNodes[1];
      buttonContainer.removeChild(signup);
      buttonContainer.removeChild(login);
      // add logout button
      const button3 = elBuilder("a", { "class": "button is-dark" }, "Logout");
      buttonContainer.appendChild(button3);

      // create and append new menu items for user
      const loggedInItem1 = elBuilder("a", { "class": "navbar-item" }, "Profile");
      const loggedInItem2 = elBuilder("a", { "class": "navbar-item" }, "Gameplay");
      const loggedInItem3 = elBuilder("a", { "class": "navbar-item" }, "Heatmaps");
      const loggedInItem4 = elBuilder("a", { "class": "navbar-item" }, "Leaderboard");
      navbarStart.appendChild(loggedInItem1);
      navbarStart.appendChild(loggedInItem2);
      navbarStart.appendChild(loggedInItem3);
      navbarStart.appendChild(loggedInItem4);
    }

    // add event listeners to navbar
    this.navbarEventManager(nav);

    // append to webpage
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
      loginOrSignup.loginForm();
    }
  },

  signupClicked(e) {
    if (e.target.textContent === "Sign up") {
      loginOrSignup.signupForm();
    }
  },

  logoutClicked(e) {
    if (e.target.textContent === "Logout") {
      loginOrSignup.logoutUser();
    }
  },

  profileClicked(e) {
    if (e.target.textContent === "Profile") {
      profile.loadProfile();
    }
  },

  gameplayClicked(e) {
    if (e.target.textContent === "Gameplay") {
      gameplay.loadGameplay();
      shotData.resetGlobalShotVariables();
    }
  },

  heatmapsClicked(e) {
    if (e.target.textContent === "Heatmaps") {
      heatmaps.loadHeatmapContainers();
    }
  }

}

export default navbar