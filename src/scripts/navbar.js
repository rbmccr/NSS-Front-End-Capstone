import elBuilder from "./elementBuilder";
import loginOrSignup from "./login";
import profile from "./profile";
import gameplay from "./gameplay";
import shotData from "./shotData";
import heatmaps from "./heatmaps";
import heatmapData from "./heatmapData";
import homePage from "./home";

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
*/

const webpageNav = document.getElementById("nav-master");

const navbar = {

  generateNavbar(loggedInBoolean) {

    // navbar-menu (right side of navbar - appears on desktop 1024px+)
    const button2 = elBuilder("a", { "class": "button is-dark" }, "Login");
    const button1 = elBuilder("a", { "class": "button is-dark" }, "Sign up");
    const buttonContainer = elBuilder("div", { "class": "buttons" }, null, button1, button2);
    const menuItem1 = elBuilder("div", { "class": "navbar-item" }, null, buttonContainer);
    const navbarEnd = elBuilder("div", { "class": "navbar-end" }, null, menuItem1);
    const navbarStart = elBuilder("div", { "class": "navbar-start" });
    const navbarMenu = elBuilder("div", { "id": "navbarMenu", "class": "navbar-menu" }, null, navbarStart, navbarEnd);

    // navbar-brand (left side of navbar - includes mobile hamburger menu)
    const burgerMenuSpan1 = elBuilder("span", { "aria-hidden": "true" });
    const burgerMenuSpan2 = elBuilder("span", { "aria-hidden": "true" });
    const burgerMenuSpan3 = elBuilder("span", { "aria-hidden": "true" });
    const navbarBrandChild2 = elBuilder("a", { "role": "button", "class": "navbar-burger burger", "aria-label": "menu", "aria-expanded": "false", "data-target": "navbarMenu" }, null, burgerMenuSpan1, burgerMenuSpan2, burgerMenuSpan3);
    const navbarBrandChild1 = elBuilder("a", { "class": "navbar-item", "href": "#" }, null, elBuilder("img", { "src": "images/logo/logo-transparent-cropped.png", "width": "112", "height": "28" }));
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
      const loggedInItem1 = elBuilder("a", { "class": "navbar-item" }, "Home");
      const loggedInItem2 = elBuilder("a", { "class": "navbar-item" }, "Profile");
      const loggedInItem3 = elBuilder("a", { "class": "navbar-item" }, "Gameplay");
      const loggedInItem4 = elBuilder("a", { "class": "navbar-item" }, "Heatmaps");
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
    // this function adds a single click listener to the nav that redirects the user to the correct page
    // based on the text content of the target
    nav.addEventListener("click", (e) => {

      if (e.target.textContent === "Login") {
        loginOrSignup.loginForm();
      }

      if (e.target.textContent === "Sign up") {
        loginOrSignup.signupForm();
      }

      if (e.target.textContent === "Logout") {
        heatmapData.clearHeatmapRepaintInterval();
        loginOrSignup.logoutUser();
        homePage.modifyNavbarCSS(false);
      }

      if (e.target.textContent === "Home") {
        heatmapData.clearHeatmapRepaintInterval();
        homePage.loadHomePage();
      }

      if (e.target.textContent === "Profile") {
        homePage.modifyNavbarCSS(false);
        heatmapData.clearHeatmapRepaintInterval();
        profile.loadProfile();
      }

      if (e.target.textContent === "Gameplay") {
        homePage.modifyNavbarCSS(false);
        heatmapData.clearHeatmapRepaintInterval();
        gameplay.loadGameplay();
        shotData.resetGlobalShotVariables();
      }

      if (e.target.textContent === "Heatmaps") {
        homePage.modifyNavbarCSS(false);
        heatmapData.clearHeatmapRepaintInterval();
        heatmapData.handleBallSpeedGlobalVariables();
        heatmapData.handleDateFilterGlobalVariables();
        heatmaps.loadHeatmapContainers();
      }
    });
  }

}

export default navbar