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

    // media containers showing user stats

    // card container profile picture, car photo, name, username, and member since mm/dd/yyyy

    // const totalGames = elBuilder("div", { "class": "media" }, null, left2)

    const icon1 = elBuilder("img", { "src":"images/icons/icons8-soccer-ball-96.png" }, null)
    const iconParent1 = elBuilder("figure", { "class": "image is-64x64" }, null, icon1)
    const left1 = elBuilder("div", { "class": "media-left" }, null, iconParent1);
    const totalGoals = elBuilder("div", { "class": "media", "style":"padding:20px;" }, null, left1)

    //   <article class="media">
    // <figure class="media-left">
    //   <p class="image is-64x64">
    //     <img src="https://bulma.io/images/placeholders/128x128.png">
    //   </p>
    // </figure>
    // <div class="media-content">
    //   <div class="content">
    //     <p>
    //       <strong>John Smith</strong> <small>@johnsmith</small> <small>31m</small>
    //       <br>
    //       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare magna eros, eu pellentesque tortor vestibulum ut. Maecenas non massa sem. Etiam finibus odio quis feugiat facilisis.
    //     </p>
    //   </div>

    // profile content
    let carImgVariable = user.car.toLowerCase();
    let profileImgVariable = user.picture;
    let profileImgTitle = user.picture;
    if (user.picture === "") {
      profileImgVariable = "images/profile-placeholder.jpg"
      profileImgTitle = "profile-placeholder.jpg"
    }
    let memberSinceDateFormatted = new Date(user.joined).toLocaleString().split(",")[0];

    const memberSince = elBuilder("div", { "class": "subtitle is-6", "style": "margin-top:10px" }, `Became a hotshot on ${memberSinceDateFormatted}`)
    const username = elBuilder("div", { "class": "tag" }, `@${user.username}`);
    const name = elBuilder("div", { "class": "title is-4 is-marginless" }, `${user.name}`);
    const userInfo = elBuilder("div", { "class": "media-content" }, null, name, username, memberSince);
    const carImg = elBuilder("img", { "src": `images/cars/${carImgVariable}.jpg`, "alt": "car", "title": `${carImgVariable}` }, null);
    const carImgFigure = elBuilder("figure", { "class": "image is-96x96" }, null, carImg);
    const carImgParent = elBuilder("div", { "class": "media-left" }, null, carImgFigure);
    const media = elBuilder("div", { "class": "media" }, null, carImgParent, userInfo);
    const content = elBuilder("div", { "class": "card-content" }, null, media);
    // main profile picture
    const Img = elBuilder("img", { "src": `${profileImgVariable}`, "alt": "profile picture", "title": `${profileImgTitle}` });
    const figure = elBuilder("figure", { "class": "image" }, null, Img);
    const profilePicture = elBuilder("div", { "class": "card-image" }, null, figure);
    const card = elBuilder("div", { "class": "card" }, null, profilePicture, content, totalGoals);

    // parent containers that organize profile information into columns
    const blankColumnLeft = elBuilder("div", { "class": "column is-one-fourth" }, null);
    const profileColumn = elBuilder("div", { "class": "column is-half" }, null, card);
    const blankColumnRight = elBuilder("div", { "class": "column is-one-fourth" }, null);
    const columns = elBuilder("div", { "class": "columns" }, null, blankColumnLeft, profileColumn, blankColumnRight);
    const playerProfile = elBuilder("div", { "id": "profileContainer", "class": "container box" }, null, columns);

    webpage.appendChild(playerProfile)
  }

}

export default profile