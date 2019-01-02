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
let putPromisesEditMode = [];
let postPromisesEditMode = [];
let postPromises = [];

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

  resetGlobalGameVariables() {
    savedGameObject = undefined;
    putPromisesEditMode = [];
    postPromisesEditMode = [];
    postPromises = [];
  },

  putEditedShots(previouslySavedShotsArr) {
    // PUT first, sicne you can't save a game initially without at least 1 shot
    previouslySavedShotsArr.forEach(shot => {
      // even though it's a PUT, we have to reformat the _fieldX syntax to fieldX
      let shotForPut = {};
      shotForPut.gameId = savedGameObject.id;
      shotForPut.fieldX = shot._fieldX;
      shotForPut.fieldY = shot._fieldY;
      shotForPut.goalX = shot._goalX;
      shotForPut.goalY = shot._goalY;
      shotForPut.ball_speed = Number(shot.ball_speed);
      shotForPut.aerial = shot._aerial;
      shotForPut.timeStamp = shot._timeStamp;

      putPromisesEditMode.push(API.putItem(`shots/${shot.id}`, shotForPut));
    })
    return Promise.all(putPromisesEditMode)
  },

  postNewShotsMadeDuringEditMode(shotsNotYetPostedArr) {
    shotsNotYetPostedArr.forEach(shotObj => {
      let shotForPost = {};
      shotForPost.gameId = savedGameObject.id;
      shotForPost.fieldX = shotObj._fieldX;
      shotForPost.fieldY = shotObj._fieldY;
      shotForPost.goalX = shotObj._goalX;
      shotForPost.goalY = shotObj._goalY;
      shotForPost.ball_speed = Number(shotObj.ball_speed);
      shotForPost.aerial = shotObj._aerial;
      shotForPost.timeStamp = shotObj._timeStamp;

      postPromisesEditMode.push(API.postItem("shots", shotForPost))
    })
    return Promise.all(postPromisesEditMode)
  },

  postNewShots(gameId) {
    // post shots with gameId
    const shotArr = shotData.getShotObjectsForSaving();
    shotArr.forEach(shotObj => {
      let shotForPost = {};
      shotForPost.gameId = gameId;
      shotForPost.fieldX = shotObj._fieldX;
      shotForPost.fieldY = shotObj._fieldY;
      shotForPost.goalX = shotObj._goalX;
      shotForPost.goalY = shotObj._goalY;
      shotForPost.ball_speed = Number(shotObj.ball_speed);
      shotForPost.aerial = shotObj._aerial;
      shotForPost.timeStamp = shotObj._timeStamp;

      postPromises.push(API.postItem("shots", shotForPost));
    })
    return Promise.all(postPromises)
  },

  saveData(gameDataObj, savingEditedGame) {
    // this function first determines if a game is being saved as new, or a previously saved game is being edited
    // if saving an edited game, the game is PUT, all shots saved previously are PUT, and new shots are POSTED
    // if the game is a new game altogether, then the game is POSTED and all shots are POSTED
    // then functions are called to reload the master container and reset global shot data variables

    if (savingEditedGame) {
      // use ID of game stored in global var
      API.putItem(`games/${savedGameObject.id}`, gameDataObj)
        .then(() => {
          // post shots with gameId
          const shotArr = shotData.getShotObjectsForSaving();
          const previouslySavedShotsArr = [];
          const shotsNotYetPostedArr = [];

          // create arrays for PUT and POST functions (if there's an id in the array, it's been saved to the database before)
          shotArr.forEach(shot => {
            if (shot.id !== undefined) {
              previouslySavedShotsArr.push(shot);
            } else {
              shotsNotYetPostedArr.push(shot);
            }
          })

          // call functions to PUT and POST
          // call functions that clear gameplay content and reset global shot/game data variables
          gameData.putEditedShots(previouslySavedShotsArr)
            .then(() => {
              // if no new shots were made, reload. else post new shots
              if (shotsNotYetPostedArr.length === 0) {
                gameplay.loadGameplay();
                shotData.resetGlobalShotVariables();
                gameData.resetGlobalGameVariables();
              } else {
                gameData.postNewShotsMadeDuringEditMode(shotsNotYetPostedArr)
                  .then(() => {
                    gameplay.loadGameplay();
                    shotData.resetGlobalShotVariables();
                    gameData.resetGlobalGameVariables();
                  });
              }
            });
        });

    } else {
      API.postItem("games", gameDataObj)
        .then(game => game.id)
        .then(gameId => {
          gameData.postNewShots(gameId)
            .then(() => {
              gameplay.loadGameplay();
              shotData.resetGlobalShotVariables();
              gameData.resetGlobalGameVariables();
            })
        })
    }
  },

  packageGameData() {
    // get user ID from session storage
    // package each input from game data container into variables

    // conditional statement to prevent blank score entries .... else save game and shots to database
    const inpt_myScore = document.getElementById("myScoreInput");
    const inpt_theirScore = document.getElementById("theirScoreInput");
    // get number of shots currently saved. If there aren't any, then the user can't save the game
    let shots = shotData.getShotObjectsForSaving().length

    if (shots === 0) {
      alert("A game cannot be saved without at least one goal scored.");
      return
    } else if (inpt_myScore.value === "" || inpt_theirScore.value === "" || inpt_myScore.value === inpt_theirScore.value) {
      alert("Please enter scores. No tie games accepted.");
    } else {
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

      // my team
      const sel_team = document.getElementById("teamInput");
      let teamedUp;
      if (sel_team.value === "No party") {
        teamedUp = false;
      } else {
        teamedUp = true;
      }

      // scores
      let myScore;
      let theirScore;

      myScore = Number(inpt_myScore.value);
      theirScore = Number(inpt_theirScore.value);

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
        "party": teamedUp,
        "score": myScore,
        "opp_score": theirScore,
        "overtime": overtime,
      };

      // determine whether or not a new game or edited game is being saved. If an edited game is being saved, then there is at least one shot saved already, making the return from the shotData function more than 0
      const savingEditedGame = shotData.getInitialNumOfShots()
      if (savingEditedGame !== undefined) {
        gameDataObj.timeStamp = savedGameObject.timeStamp
        gameData.saveData(gameDataObj, true);
      } else {
        // time stamp if new game
        let timeStamp = new Date();
        gameDataObj.timeStamp = timeStamp
        gameData.saveData(gameDataObj, false);
      }
    }

  },

  savePrevGameEdits() {
    gameData.packageGameData();
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

    // call function in shotData that calls gamaData.provideShotsToShotData()
    // the function will capture the array of saved shots and render the shot buttons
    shotData.renderShotsButtonsFromPreviousGame()

    // overtime
    const sel_overtime = document.getElementById("overtimeInput");
    if (game.overtime) {
      sel_overtime.value = "Overtime"
    } else {
      sel_overtime.value = "No overtime"
    }

    // my team
    const sel_team = document.getElementById("teamInput");
    if (game.party === false) {
      sel_team.value = "No party"
    } else {
      sel_team.value = "Party"
    }

    // score
    const inpt_myScore = document.getElementById("myScoreInput");
    const inpt_theirScore = document.getElementById("theirScoreInput");

    inpt_myScore.value = game.score;
    inpt_theirScore.value = game.opp_score;

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