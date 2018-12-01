// import shotData from "./shotData"
// import API from "./API"

// the purpose of this module is to:
// 1. save all content in the gameplay page (shot and game data) to the database
// 2. immediately clear the gameplay containers of content on save
// 3. immediately reset all global variables in the shotdata file to allow the user to begin saving shots and entering game data for their next game
// 4. affordance for user to recall all data from previous saved game for editing
// 5. include any other functions needed to support the first 4 requirements

const gameData = {

  //TODO: add function that defaults the game type (3v3 etc) to 2v2 and will toggle classes "is-selected" and "is-link" when any of the buttons is clicked.

  saveData() {
    console.log("saving...")
    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1];
    let gameType = undefined;

    // get user ID from session storage
    // TODO: package and save game data
    // TODO: then get ID of latest game saved (returned immediately in object from POST)
    // TODO: package and save shots with the game ID

    // playerId
    const activeUserId = Number(sessionStorage.getItem("activeUserId"));

    // game type (1v1, 2v2, 3v3)
    gameTypeBtns.forEach(btn => {
      console.log("btn", btn)
      if (btn.classList.contains("is-selected")) {
        gameType = btn.textContent
      }
    })

    let gameData = {
      "playerId": activeUserId,
      // "mode": "Competitive"
      "type": gameType,
      //   "blue": ,
      //   "score": ,
      //   "opp_score": ,
      //   "overtime":
    };

    console.log(gameData)

    // API.postItem(gameData, "games").then(data => console.log(data));

  },

  clearGameplayContent() {

  },

  editPrevGame() {

  }

  // const btn_editPrevGame = document.getElementById("editPrevGame");
  // const btn_3v3 = document.getElementById("_3v3");
  // const btn_2v2 = document.getElementById("_2v2");
  // const btn_1v1 = document.getElementById("_1v1");

  // // select dropdowns
  // const sel_aerial = document.getElementById("aerialInput");
  // const sel_gameMode = document.getElementById("gameModeInput");
  // const sel_teamColor = document.getElementById("teamInput");
  // const sel_overtime = document.getElementById("overtimeInput");

  // // input fields
  // const inpt_ballSpeed = document.getElementById("ballSpeedInput");
  // const inpt_orangeScore = document.getElementById("orangeScoreInput");
  // const inpt_blueScore = document.getElementById("blueScoreInput");


}

export default gameData