import shotData from "./shotData"
import API from "./API"

// the purpose of this module is to:
// 1. save all content in the gameplay page (shot and game data) to the database
// 2. immediately clear the gameplay containers of content on save
// 3. immediately reset all global variables in the shotdata file to allow the user to begin saving shots and entering game data for their next game
// 4. affordance for user to recall all data from previous saved game for editing

const gameData = {

  saveData() {
    console.log("saving...")
  },

  clearGameplayContent() {

  },

  editPrevGame() {

  }

  // const btn_editPrevGame = document.getElementById("editPrevGame");
  // const btn_saveGame = document.getElementById("saveGame");
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