import API from "./API";
import shotData from "./shotData";
import gameplay from "./gameplay";
import elBuilder from "./elementBuilder";

// the purpose of this module is to:
// 1. save all content in the gameplay page (shot and game data) to the database
// 2. immediately clear the gameplay containers of content on save
// 3. immediately reset all global variables in the shotdata file to allow the user to begin saving shots and entering game data for their next game
// 4. affordance for user to recall all data from previous saved game for editing
// 5. include any other functions needed to support the first 4 requirements

const gameData = {

  gameTypeButtonToggle(e) {
    // this function toggles the "is-selected" class between the game type buttons

    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1];
    let btnClicked = e.target;

    if (!btnClicked.classList.contains("is-selected")) {
      const currentGameTypeBtn = gameTypeBtns.filter(btn => btn.classList.contains("is-selected"));
      currentGameTypeBtn[0].classList.remove("is-selected");
      currentGameTypeBtn[0].classList.remove("is-link");
      btnClicked.classList.add("is-selected");
      btnClicked.classList.add("is-link");
    } else {
      return
    }

  },

  saveData() {

    // get user ID from session storage
    // package and save game data
    // then get ID of latest game saved (returned immediately in object from POST)
    // package and save shots with the game ID
    // TODO: conditional statement to prevent blank score entries
    // TODO: create a modal asking user if they want to save game

    // playerId
    const activeUserId = Number(sessionStorage.getItem("activeUserId"));

    // game type (1v1, 2v2, 3v3)
    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1];
    let gameType = undefined;

    gameTypeBtns.forEach(btn => {
      if (btn.classList.contains("is-selected")) {
        gameType = btn.textContent
      }
    })

    // game mode (note: did not use boolean in case more game modes are supported in the future)
    const sel_gameMode = document.getElementById("gameModeInput");
    const gameMode = sel_gameMode.value.toLowerCase();

    // my team (note: did not use boolean in preparation for users to enter the club information)
    const sel_teamColor = document.getElementById("teamInput");
    let myTeam;
    if (sel_teamColor.value === "Orange team") {
      myTeam = "orange";
    } else {
      myTeam = "blue";
    }

    // my score
    let myScore;
    let theirScore;
    const inpt_orangeScore = document.getElementById("orangeScoreInput");
    const inpt_blueScore = document.getElementById("blueScoreInput");

    if (myTeam === "orange") {
      myScore = Number(inpt_orangeScore.value);
      theirScore = Number(inpt_blueScore.value);
    } else {
      myScore = Number(inpt_blueScore.value);
      theirScore = Number(inpt_orangeScore.value);
    }

    // overtime
    let overtime;
    const sel_overtime = document.getElementById("overtimeInput");
    if (sel_overtime.value === "Overtime") {
      overtime = true;
    } else {
      overtime = false;
    }

    let gameData = {
      "userId": activeUserId,
      "mode": gameMode,
      "type": gameType,
      "team": myTeam,
      "score": myScore,
      "opp_score": theirScore,
      "overtime": overtime
    };

    API.postItem("games", gameData)
      .then(game => game.id)
      .then(gameId => {
        // post shots with gameId
        const shotArr = shotData.getShotObjectsForPost();
        console.log(shotArr)
        shotArr.forEach(shotObj => {
          let shotForPost = {};
          shotForPost.gameId = gameId
          shotForPost.fieldX = shotObj._fieldX
          shotForPost.fieldY = shotObj._fieldY
          shotForPost.goalX = shotObj._goalX
          shotForPost.goalY = shotObj._goalY
          shotForPost.ball_speed = Number(shotObj.ball_speed)
          shotForPost.aerial = shotObj._aerial
          API.postItem("shots", shotForPost).then(post => {
            console.log(post);
            // call functions that clear gameplay content and reset variables
            gameplay.loadGameplay();
            shotData.resetGlobalShotVariables();
          })
        })
      });

  },

  renderPrevGame(game) {
    console.log(game)
    // remove & replace edit and save game buttons with "Save Edits" and "Cancel Edits"
    const btn_editPrevGame = document.getElementById("editPrevGame");
    const btn_saveGame = document.getElementById("saveGame");

    const btn_cancelEdits = elBuilder("button", { "id": "cancelEdits", "class": "button is-danger" }, "Cancel Edits")
    const btn_saveEdits = elBuilder("button", { "id": "saveEdits", "class": "button is-success" }, "Save Edits")

    btn_editPrevGame.replaceWith(btn_cancelEdits);
    btn_saveGame.replaceWith(btn_saveEdits);

    // TODO: create a modal asking user if they want to edit previous game
    // TODO: append save edits button and cancel edits button
    // TODO: append click listeners to save edits button and cancel edits button that PUT to database
    // TODO: render shot data and game data on page

  },

  editPrevGame() {
    // fetch content from most recent game saved to be rendered
    const activeUserId = sessionStorage.getItem("activeUserId");

    API.getSingleItem("users", `${activeUserId}?_embed=games`).then(user => {
      if (user.games.length === 0) {
        alert("No games have been saved by this user");
      } else {
        // get max game id (which is the most recent game saved)
        const recentGameId = user.games.reduce((max, obj) => obj.id > max ? obj.id : max, user.games[0].id);
        // fetch most recent game and embed shots
        API.getSingleItem("games", `${recentGameId}?_embed=shots`).then(game => gameData.renderPrevGame(game))
      }
    })
  }

}

export default gameData