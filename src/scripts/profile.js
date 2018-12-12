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
    const carImgVariable = `images/cars/${user.car.toLowerCase()}.jpg`;
    const profileImgVariable = user.picture;
    if (user.picture === "") {
      profileImgVariable = "images/profile-placeholder.jpg"
    }

    const carImg = elBuilder("img",{"src":`${carImgVariable}`, "alt":"car"},null)
    const carImgFigure = elBuilder("figure",{"class":"image is-128x128"},null,carImg);
    const carImgParent = elBuilder("div", { "class": "media-left" }, null, carImgFigure);
    const car = elBuilder("div", { "class": "media" }, null, carImgParent);
    const content = elBuilder("div", { "class": "card-content" }, null, car);
    // main profile picture
    const Img = elBuilder("img", { "src": `${profileImgVariable}`, "alt":"profile picture" });
    const figure = elBuilder("figure", { "class": "image" }, null, Img);
    const profilePicture = elBuilder("div", { "class": "card-image" }, null, figure);
    const card = elBuilder("div", { "class": "card" }, null, profilePicture, content);

    //     < div class="card" >
    //       <div class="card-image">
    //         <figure class="image is-4by3">
    //           <img src="https://bulma.io/images/placeholders/1280x960.png" alt="Placeholder image">
    //   </figure>
    // </div>
    //         <div class="card-content">
    //           <div class="media">
    //             <div class="media-left">
    //               <figure class="image is-48x48">
    //                 <img src="https://bulma.io/images/placeholders/96x96.png" alt="Placeholder image">
    //       </figure>
    //     </div>
    //               <div class="media-content">
    //                 <p class="title is-4">John Smith</p>
    //                 <p class="subtitle is-6">@johnsmith</p>
    //               </div>
    //             </div>

    // parent containers that organize profile information into columns
    const blankColumnLeft = elBuilder("div", { "class": "column is-one-third" }, null);
    const profileColumn = elBuilder("div", { "class": "column is-one-third" }, null, card);
    const blankColumnRight = elBuilder("div", { "class": "column is-one-third" }, null);
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