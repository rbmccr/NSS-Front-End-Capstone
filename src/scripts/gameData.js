// import shotData from "./shotData"
import API from "./API"

// the purpose of this module is to:
// 1. save all content in the gameplay page (shot and game data) to the database
// 2. immediately clear the gameplay containers of content on save
// 3. immediately reset all global variables in the shotdata file to allow the user to begin saving shots and entering game data for their next game
// 4. affordance for user to recall all data from previous saved game for editing
// 5. include any other functions needed to support the first 4 requirements

const gameData = {

  //TODO: add function that defaults the game type (3v3 etc) to 2v2 and will toggle classes "is-selected" and "is-link" when any of the buttons is clicked.

  saveData() {

    // get user ID from session storage
    // package and save game data
    // TODO: then get ID of latest game saved (returned immediately in object from POST)
    // TODO: package and save shots with the game ID
    // TODO: conditional statement to prevent blank score entries

    // playerId
    const activeUserId = Number(sessionStorage.getItem("activeUserId"));

    // game type (1v1, 2v2, 3v3)
    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");
    const gameTypeBtns = [btn_3v3, btn_2v2, btn_1v1];
    let gameType = undefined;

    gameTypeBtns.forEach(btn => {
      console.log("btn", btn)
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
      "playerId": activeUserId,
      "mode": gameMode,
      "type": gameType,
      "team": myTeam,
      "score": myScore,
      "opp_score": theirScore,
      "overtime": overtime
    };

    console.log(gameData)

    API.postItem(gameData, "games").then(data => console.log(data));

  },

  clearGameplayContent() {

  },

  editPrevGame() {

    //TODO: allow user to edit content from most recent game saved (consider both MAX gameId and CURRENT userId to get the user's most recent game)

  }

  // const btn_editPrevGame = document.getElementById("editPrevGame");

  // // select dropdowns
  // const sel_aerial = document.getElementById("aerialInput");

  // // input fields
  // const inpt_ballSpeed = document.getElementById("ballSpeedInput");


}

export default gameData