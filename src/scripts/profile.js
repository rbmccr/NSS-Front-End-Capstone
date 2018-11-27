import elBuilder from "./elementBuilder"
import API from "./API"

const webpage = document.getElementById("container-master");

const profile = {

  loadProfile() {
    webpage.innerHTML = null;
    const activeUser = sessionStorage.getItem("activeUserId");
    API.getSingleItem(activeUser, "users").then(user => {
      const profilePic = elBuilder("img", { "src": "images/octane.jpg", "class": "" })
      const name = elBuilder("div", { "class": "notification" }, `Name: ${user.name}`)
      const username = elBuilder("div", { "class": "notification" }, `Username: ${user.username}`)
      const playerProfile = elBuilder("div", { "id": "playerProfile", "class": "container" }, null, profilePic, name, username)
      webpage.appendChild(playerProfile)
    })
  }

}

export default profile