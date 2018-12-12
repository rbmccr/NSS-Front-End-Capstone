import elBuilder from "./elementBuilder"
import API from "./API"

const webpage = document.getElementById("container-master");

const profile = {

  loadProfile() {
    webpage.innerHTML = null;
    const activeUserId = sessionStorage.getItem("activeUserId");
    API.getSingleItem("users", activeUserId).then(user => {
      this.buildProfile(user)
    });
  },

  buildProfile(user) {
    // media card container profile picture, car photo, name, username, and member since mm/dd/yyyy


    // profile content
    let carImgVariable = `images/cars/${user.car.toLowerCase()}.jpg`;
    let profileImgVariable = user.picture;
    if (user.picture === "") {
      profileImgVariable = "images/profile-placeholder.jpg"
    }
    let memberSinceDateFormatted = new Date(user.joined).toLocaleString().split(",")[0];

    const memberSince = elBuilder("div",{"class":"subtitle is-6", "style":"margin-top:10px"}, `Became a hotshot on ${memberSinceDateFormatted}`)
    const username = elBuilder("div", { "class": "tag" }, `@${user.username}`);
    const name = elBuilder("div", { "class": "title is-4 is-marginless" }, `${user.name}`);
    const userInfo = elBuilder("div", { "class": "media-content" }, null, name, username, memberSince);
    const carImg = elBuilder("img", { "src": `${carImgVariable}`, "alt": "car" }, null);
    const carImgFigure = elBuilder("figure", { "class": "image is-96x96" }, null, carImg);
    const carImgParent = elBuilder("div", { "class": "media-left" }, null, carImgFigure);
    const media = elBuilder("div", { "class": "media" }, null, carImgParent, userInfo);
    const content = elBuilder("div", { "class": "card-content" }, null, media);
    // main profile picture
    const Img = elBuilder("img", { "src": `${profileImgVariable}`, "alt": "profile picture" });
    const figure = elBuilder("figure", { "class": "image" }, null, Img);
    const profilePicture = elBuilder("div", { "class": "card-image" }, null, figure);
    const card = elBuilder("div", { "class": "card" }, null, profilePicture, content);

    // parent containers that organize profile information into columns
    const blankColumnLeft = elBuilder("div", { "class": "column is-one-fourth" }, null);
    const profileColumn = elBuilder("div", { "class": "column is-half" }, null, card);
    const blankColumnRight = elBuilder("div", { "class": "column is-one-fourth" }, null);
    const columns = elBuilder("div", { "class": "columns" }, null, blankColumnLeft, profileColumn, blankColumnRight);
    const playerProfile = elBuilder("div", { "id": "profileContainer", "class": "container box" }, null, columns);




    // const car = elBuilder("img", {"src": "images/octane.jpg", "class": "" })
    // const name = elBuilder("div", {"class": "notification" }, `Name: ${user.name}`)
    // const username = elBuilder("div", {"class": "notification" }, `Username: ${user.username}`)
    // const playerProfile = elBuilder("div", {"id": "playerProfile", "class": "container" }, null, car, name, username)
    webpage.appendChild(playerProfile)
  }

}

export default profile