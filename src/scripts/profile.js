import elBuilder from "./elementBuilder"
import API from "./API"

const webpage = document.getElementById("container-master");
// global variable used to count total games and shots
let gameIds = [];

const profile = {

  loadProfile() {
    webpage.innerHTML = null;
    const activeUserId = sessionStorage.getItem("activeUserId");
    // get user, then push all unique game IDs to array, then fetch all shots associated with game Ids
    API.getSingleItem("users", activeUserId).then(user => {
      API.getAll(`games?userId=${user.id}`).then(games => {
        games.forEach(game => {
          gameIds.push(game.id);
        })
        return Promise.all(gameIds);
      })
        .then(gameIds => {
          console.log("check promise", gameIds)
          let URL = "shots";
          gameIds.forEach(id => {
            if (URL === "shots") {
              URL += `?gameId=${id}`
            } else {
              URL += `&gameId=${id}`
            }
          })
          return API.getAll(URL)
        }).then(shots => {
          console.log("check shots promise", shots)
          // call next function in chain of functions to get playstyle
          this.determinePlaystyle(user, shots, gameIds);
          gameIds = [];
        })
    })

  },

  determinePlaystyle(user, shots, gameIds) {
    // this function uses avg field coordinates to label the user's playstyle for their profile page
    let sumX = 0;
    let sumY = 0;
    let avgX;
    let avgY;

    shots.forEach(shot => {
      sumX += shot.fieldX;
      sumY += shot.fieldY;
    })

    avgX = sumX / shots.length;
    avgY = sumY / shots.length;
    let fieldPosition;

    if (avgX < 0.15) {
      fieldPosition = "keeper"
    } else if (0.15 <= avgX && avgX <= 0.30) {
      fieldPosition = "sweeper"
    } else if (0.30 <= avgX && avgX < 0.45 && avgY <= 0.40) {
      fieldPosition = "left fullback"
    } else if (0.30 <= avgX && avgX < 0.45 && 0.60 <= avgY) {
      fieldPosition = "right fullback"
    } else if (0.30 <= avgX && avgX <= 0.45) {
      fieldPosition = "center fullback"
    } else if (0.45 <= avgX && avgX < 0.60 && avgY <= 0.40) {
      fieldPosition = "left halfback"
    } else if (0.45 <= avgX && avgX < 0.60 && 0.60 <= avgY) {
      fieldPosition = "right halfback"
    } else if (0.45 <= avgX && avgX <= 0.60) {
      fieldPosition = "center halfback"
    } else if (0.60 <= avgX && avgX < 0.75 && avgY <= 0.50) {
      fieldPosition = "left horward"
    } else if (0.60 <= avgX && avgX < 0.75 && 0.50 < avgY) {
      fieldPosition = "right forward"
    } else if (0.75 <= avgX) {
      fieldPosition = "striker"
    }

    // call function to load containers using all fetched information
    this.buildProfile(user, shots, gameIds, fieldPosition);
  },

  buildProfile(user, shots, gameIds, fieldPosition) {

    // media containers showing user stats (appended to card container)
    const playstyle = elBuilder("div", {"class":"title is-3"}, `Plays ${fieldPosition}`)
    const playstyleContent = elBuilder("div", { "class": "content" }, null, playstyle)
    const playstyleContentParent = elBuilder("div", { "class": "media-content" }, null, playstyleContent)
    const icon3 = elBuilder("img", { "src": "images/icons/icons8-stadium-96.png" }, null)
    const iconParent3 = elBuilder("figure", { "class": "image is-48x48" }, null, icon3)
    const left3 = elBuilder("div", { "class": "media-left" }, null, iconParent3);
    const userPlaystyle = elBuilder("div", { "class": "media is-marginless", "style": "padding:20px;" }, null, left3, playstyleContentParent)

    const gameStats = elBuilder("div", {"class":"title is-2"}, `${gameIds.length} games`)
    const gameContent = elBuilder("div", { "class": "content" }, null, gameStats)
    const gameContentParent = elBuilder("div", { "class": "media-content" }, null, gameContent)
    const icon2 = elBuilder("img", { "src": "images/icons/icons8-game-controller-100.png" }, null)
    const iconParent2 = elBuilder("figure", { "class": "image is-48x48" }, null, icon2)
    const left2 = elBuilder("div", { "class": "media-left" }, null, iconParent2);
    const totalGames = elBuilder("div", { "class": "media is-marginless", "style": "padding:20px;" }, null, left2, gameContentParent)

    const goalStats = elBuilder("div", {"class":"title is-2"}, `${shots.length} goals`)
    const goalContent = elBuilder("div", { "class": "content" }, null, goalStats)
    const goalContentParent = elBuilder("div", { "class": "media-content" }, null, goalContent)
    const icon1 = elBuilder("img", { "src": "images/icons/icons8-soccer-ball-96.png" }, null)
    const iconParent1 = elBuilder("figure", { "class": "image is-48x48" }, null, icon1)
    const left1 = elBuilder("div", { "class": "media-left" }, null, iconParent1);
    const totalGoals = elBuilder("div", { "class": "media is-marginless", "style": "padding:20px;" }, null, left1, goalContentParent)

    // card container profile picture, car photo, name, username, and member since mm/dd/yyyy
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
    const card = elBuilder("div", { "class": "card" }, null, profilePicture, content, totalGoals, totalGames, userPlaystyle);

    // parent containers that organize profile information into columns
    const blankColumnLeft = elBuilder("div", { "class": "column is-one-fourth" }, null);
    const profileColumn = elBuilder("div", { "class": "column is-half" }, null, card);
    const blankColumnRight = elBuilder("div", { "class": "column is-one-fourth" }, null);
    const columns = elBuilder("div", { "class": "columns is-vcentered" }, null, blankColumnLeft, profileColumn, blankColumnRight);
    const playerProfile = elBuilder("div", { "id": "profileContainer", "class": "container", "style": "padding:20px;" }, null, columns);

    webpage.appendChild(playerProfile)
  }

}

export default profile