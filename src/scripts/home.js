import elBuilder from "./elementBuilder";

const homePage = {

  loadHomePage() {
    const webpage = document.getElementById("container-master");
    webpage.innerHTML = null;

    const divider1 = elBuilder("div", { "class": "divider" });
    const divider2 = elBuilder("div", { "class": "divider" });
    const image1 = elBuilder("div", { "class": "bg1" });
    const image2 = elBuilder("div", { "class": "bg2" });
    const image3 = elBuilder("div", { "class": "bg3" });
    const parentScrollContainer = elBuilder("div", { "class": "scrollEffectContainer" }, null, image1, divider1, image2, divider2, image3);

    webpage.appendChild(parentScrollContainer);
    this.modifyNavbarCSS(true);
  },

  modifyNavbarCSS(homePageLoading) {
    const navbar = document.querySelector(".navbar");

    if (homePageLoading) {
      navbar.classList.add("is-fixed-top");
    } else {
      navbar.classList.remove("is-fixed-top");
    }
  }

}

export default homePage