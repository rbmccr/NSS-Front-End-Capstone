import elBuilder from "./elementBuilder";

const webpage = document.getElementById("container-master");

const homePage = {

  loadHomePage() {
    webpage.innerHTML = null;
    this.buildHomePage();
    this.modifyNavbarCSS(true);
  },

  buildHomePage() {
    const text1 = elBuilder("p", {"id":"absoluteText1", "class": "title" }, "Identify your patterns")
    const text2 = elBuilder("p", {"id":"absoluteText2", "class": "title" }, "Conquer your weaknesses")
    const text3 = elBuilder("p", {"id":"absoluteText3", "class": "title" }, "Streamline your success")

    const divider1 = elBuilder("div", { "class": "divider" });
    const divider2 = elBuilder("div", { "class": "divider" });
    const image1 = elBuilder("div", { "class": "bg1" }, null, text1);
    const image2 = elBuilder("div", { "class": "bg2" }, null, text2);
    const image3 = elBuilder("div", { "class": "bg3" }, null, text3);
    const parentScrollContainer = elBuilder("div", { "class": "scrollEffectContainer" }, null, image1, divider1, image2, divider2, image3);

    webpage.appendChild(parentScrollContainer);
    webpage.style = null;
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