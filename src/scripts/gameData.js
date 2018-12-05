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

// this global variable is used to pass saved shots, ball speed, and aerial boolean to shotData.js during the edit process
let savedGameObject;

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

  saveData(gameData, savingEditedGame) {
    // this function saves the user's most recent game played (the newly created game or game just edited),
    // and then saves all shots to the database with the correct gameId
    // then calls functions to reload container and reset global shot data variables

    if (savingEditedGame) {
      // if saving an edited game, the game is PUT, all shots saved previously are PUT, and new shots are POSTED
      console.log("gameData", gameData)
      // use ID of game stored in global var
      API.putItem(`games/${savedGameObject.id}`, gameData)
        .then(game => game.id)
        .then(gameId => {
          // post shots with gameId
          const shotArr = shotData.getShotObjectsForSaving();
          const previouslySavedShotsArr = [];
          const shotsNotYetPostedArr = [];

          // create arrays for POST and PUT
          shotArr.forEach(shot => {
            console.log("SHOT ID", shot.id)
            if (shot.id !== undefined) {
              previouslySavedShotsArr.push(shot);
            } else {
              shotsNotYetPostedArr.push(shot);
            }
          })

          shotsNotYetPostedArr.forEach(shotObj => {
            let shotForPost = {};
            shotForPost.gameId = gameId
            shotForPost.fieldX = shotObj._fieldX
            shotForPost.fieldY = shotObj._fieldY
            shotForPost.goalX = shotObj._goalX
            shotForPost.goalY = shotObj._goalY
            shotForPost.ball_speed = Number(shotObj.ball_speed)
            shotForPost.aerial = shotObj._aerial
            shotForPost.timeStamp = shotObj._timeStamp
            API.postItem("shots", shotForPost).then(post => {
              console.log("POSTED NEW SHOTS MADE DURING EDIT", post);
              previouslySavedShotsArr.forEach(shot => {
                API.putItem(`shots/${shot.id}`, shot).then(put => {
                  console.log("PUT", put)
                  // call functions that clear gameplay content and reset global shot data variables
                  gameplay.loadGameplay();
                  shotData.resetGlobalShotVariables();
                })
              })
            })
          })
        });
      // if the game is a new game altogether, then the game is POSTED and all shots are POSTED
    } else {
      API.postItem("games", gameData)
        .then(game => game.id)
        .then(gameId => {
          // post shots with gameId
          const shotArr = shotData.getShotObjectsForSaving();
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
            shotForPost.timeStamp = shotObj._timeStamp
            API.postItem("shots", shotForPost).then(post => {
              console.log(post);
              // call functions that clear gameplay content and reset global shot data variables
              gameplay.loadGameplay();
              shotData.resetGlobalShotVariables();
            })
          })
        });
    }

  },

  packageGameData() {

    // get user ID from session storage
    // package each input from game data container into variables
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

    let gameDataObj = {
      "userId": activeUserId,
      "mode": gameMode,
      "type": gameType,
      "team": myTeam,
      "score": myScore,
      "opp_score": theirScore,
      "overtime": overtime,
    };

    // determine whether or not a new game or edited game is being saved. If an edited game is being saved, then there is at least one shot saved already, making the return from the shotData function more than 0
    const savingEditedGame = shotData.getInitialNumOfShots()
    console.log(savingEditedGame)
    if (savingEditedGame !== undefined) {
      gameData.saveData(gameDataObj, true);
    } else {
      // time stamp if new game
      let timeStamp = new Date();
      gameDataObj.timeStamp = timeStamp
      gameData.saveData(gameDataObj, false);
    }

  },

  savePrevGameEdits() {
    console.log("saving edits...")
    gameData.packageGameData();
    // TODO: ((STEP 3)) PUT edits to database
  },

  cancelEditingMode() {
    gameplay.loadGameplay();
    shotData.resetGlobalShotVariables();
  },

  renderEditButtons() {
    // this function removes & replaces edit and save game buttons with "Save Edits" and "Cancel Edits"
    const btn_editPrevGame = document.getElementById("editPrevGame");
    const btn_saveGame = document.getElementById("saveGame");
    // in case of lag in fetch, prevent user from double clicking button
    btn_editPrevGame.disabled = true;
    btn_editPrevGame.classList.add("is-loading");

    const btn_cancelEdits = elBuilder("button", { "id": "cancelEdits", "class": "button is-danger" }, "Cancel Edits")
    const btn_saveEdits = elBuilder("button", { "id": "saveEdits", "class": "button is-success" }, "Save Edits")

    btn_cancelEdits.addEventListener("click", gameData.cancelEditingMode)
    btn_saveEdits.addEventListener("click", gameData.savePrevGameEdits)

    btn_editPrevGame.replaceWith(btn_cancelEdits);
    btn_saveGame.replaceWith(btn_saveEdits);

  },

  renderPrevGame(game) {
    // this function is responsible for rendering the saved game information in the "Enter Game Data" container.
    // it relies on a function in shotData.js to render the shot buttons
    console.log(game)

    // call function in shotData that calls gamaData.provideShotsToShotData()
    // the function will capture the array of saved shots and render the shot buttons
    shotData.renderShotsButtonsFromPreviousGame()

    // overtime
    const sel_overtime = document.getElementById("overtimeInput");
    if (game.overtime) {
      sel_overtime.value = "Overtime"
    } else {
      sel_overtime.value = "No Overtime"
    }

    // my team
    const sel_teamColor = document.getElementById("teamInput");
    if (game.team === "orange") {
      sel_teamColor.value = "Orange team"
    } else {
      sel_teamColor.value = "Blue team"
    }

    // my score
    const inpt_orangeScore = document.getElementById("orangeScoreInput");
    const inpt_blueScore = document.getElementById("blueScoreInput");

    if (game.team === "orange") {
      inpt_orangeScore.value = game.score;
      inpt_blueScore.value = game.opp_score;
    } else {
      inpt_orangeScore.value = game.opp_score;
      inpt_blueScore.value = game.score;
    }

    // game type (1v1, 2v2, 3v3)
    const btn_3v3 = document.getElementById("_3v3");
    const btn_2v2 = document.getElementById("_2v2");
    const btn_1v1 = document.getElementById("_1v1");

    if (game.type === "3v3") {
      btn_3v3.classList.add("is-selected");
      btn_3v3.classList.add("is-link");
      // 2v2 is the default
      btn_2v2.classList.remove("is-selected");
      btn_2v2.classList.remove("is-link");
    } else if (game.type === "2v2") {
      btn_2v2.classList.add("is-selected");
      btn_2v2.classList.add("is-link");
    } else {
      btn_1v1.classList.add("is-selected");
      btn_1v1.classList.add("is-link");
      btn_2v2.classList.remove("is-selected");
      btn_2v2.classList.remove("is-link");
    }

    // game mode
    const sel_gameMode = document.getElementById("gameModeInput");
    if (game.mode = "competitive") {
      sel_gameMode.value = "Competitive"
    } else {
      sel_gameMode.value = "Casual"
    }

  },

  provideShotsToShotData() {
    // this function provides the shots for rendering to shotData
    return savedGameObject
  },

  editPrevGame() {
    // fetch content from most recent game saved to be rendered

    // TODO: create a modal asking user if they want to edit previous game
    const activeUserId = sessionStorage.getItem("activeUserId");

    API.getSingleItem("users", `${activeUserId}?_embed=games`).then(user => {
      if (user.games.length === 0) {
        alert("No games have been saved by this user");
      } else {
        // get max game id (which is the most recent game saved)
        const recentGameId = user.games.reduce((max, obj) => obj.id > max ? obj.id : max, user.games[0].id);
        // fetch most recent game and embed shots
        API.getSingleItem("games", `${recentGameId}?_embed=shots`).then(gameObj => {
          gameplay.loadGameplay();
          shotData.resetGlobalShotVariables();
          gameData.renderEditButtons();
          savedGameObject = gameObj;
          gameData.renderPrevGame(gameObj);
        })
      }
    })
  }

}

export default gameData