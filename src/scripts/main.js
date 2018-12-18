import navbar from "./navbar"
import homePage from "./home";

const activeUserId = sessionStorage.getItem("activeUserId");

if (activeUserId === null) {
  navbar.generateNavbar();
} else {
  navbar.generateNavbar(true);
  document.body.classList.remove("bodyWithBg");
  homePage.loadHomePage();
}
