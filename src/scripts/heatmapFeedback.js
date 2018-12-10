import elBuilder from "./elementBuilder";
import API from "./API";

const feedback = {

  loadFeedback(shots) {

    // first, use the shots we have to fetch the games they're associated with
    let gameIds = [];

    shots.forEach(shot => {
      gameIds.push(shot.gameId); //FIXME: narrow down ids to one of each (since there will be multiples)
    })

    this.fetchGames(gameIds)
      .then(games => this.calculateFeedback(shots, games));

  },

  fetchGames(gameIds) {
    let games = [];
    gameIds.forEach(gameId => {
      games.push(API.getSingleItem("games", gameId))
    });
    return Promise.all(games)
  },

  calculateFeedback(shots, games) {
    console.log("shots", shots)
    console.log("games", games)

    let feedbackResults = {};

    // get heatmap date generated
    let now = new Date().toLocaleString();
    feedbackResults.now = now;
    console.log(feedbackResults.now)

    // get range of dates on games
    feedbackResults.firstGame = games.reduce((max, game) => game.timeStamp.split("T")[0] > max ? game.timeStamp.split("T")[0] : max, games[0].timeStamp.split("T")[0]);
    feedbackResults.lastGame = games.reduce((min, game) => game.timeStamp.split("T")[0] < min ? game.timeStamp.split("T")[0] : min, games[0].timeStamp.split("T")[0]);


    // get average field x,y coordinate of player based on shots and give player feedback
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
      fieldPosition = "Keeper"
    } else if (0.15 <= avgX && avgX <= 0.30) {
      fieldPosition = "Sweeper"
    } else if (0.30 <= avgX && avgX < 0.45 && avgY <= 0.40) {
      fieldPosition = "Left Fullback"
    } else if (0.30 <= avgX && avgX < 0.45 && 0.60 <= avgY) {
      fieldPosition = "Right Fullback"
    } else if (0.30 <= avgX && avgX <= 0.45) {
      fieldPosition = "Center Fullback"
    } else if (0.45 <= avgX && avgX < 0.60 && avgY <= 0.40) {
      fieldPosition = "Left Halfback"
    } else if (0.45 <= avgX && avgX < 0.60 && 0.60 <= avgY) {
      fieldPosition = "Right Halfback"
    } else if (0.45 <= avgX && avgX <= 0.60) {
      fieldPosition = "Center Halfback"
    } else if (0.60 <= avgX && avgX < 0.75 && avgY <= 0.50) {
      fieldPosition = "Left Forward"
    } else if (0.60 <= avgX && avgX < 0.75 && 0.50 < avgY) {
      fieldPosition = "Right Forward"
    } else if (0.75 <= avgX) {
      fieldPosition = "Striker"
    }

    feedbackResults.fieldPosition = fieldPosition

    // determine players that compliment the player's style
    let complementA;
    let complementB;

    if (fieldPosition === "Keeper") {
      complementA = "Left Forward";
      complementB = "Right Forward";
    } else if (fieldPosition === "Sweeper") {
      complementA = "Center Halfback";
      complementB = "Left/Right Forward";
    } else if (fieldPosition === "Left Fullback") {
      complementA = "Right Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Right FullBack") {
      complementA = "Left Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Center Fullback") {
      complementA = "Left/Right Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Left Halfback") {
      complementA = "Right Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Right Halfback") {
      complementA = "Left Forward";
      complementB = "Striker";
    } else if (fieldPosition === "Center Halfback") {
      complementA = "Striker";
      complementB = "Left/Right Forward";
    } else if (fieldPosition === "Left Forward") {
      complementA = "Center Halfback";
      complementB = "Right Forward";
    } else if (fieldPosition === "Right Forward") {
      complementA = "Center Halfback";
      complementB = "Left Forward";
    } else if (fieldPosition === "Striker") {
      complementA = "Left/Right Forward";
      complementB = "Center Halfback";
    }

    feedbackResults.complementA = complementA;
    feedbackResults.complementB = complementB;

    // shots scored on team side and opponent side of field, & defensive redirects (i.e. within keeper range of goal)
    let teamSide = 0;
    let oppSide = 0;
    let defensiveRedirect = 0;

    shots.forEach(shot => {
      if (shot.fieldX > 0.50) {
        oppSide++;
      } else {
        teamSide++;
      }

      if (shot.fieldX < 0.15) {
        defensiveRedirect++;
      }
    })

    feedbackResults.teamSideGoals = teamSide;
    feedbackResults.opponentSideGoals = oppSide;
    feedbackResults.defensiveRedirect = defensiveRedirect;

    // aerial count & percentage of all shots
    let aerial = 0;

    shots.forEach(shot => {
      if (shot.aerial === true) {
        aerial++;
      }
    })

    let aerialPercentage = Number((aerial / shots.length * 100).toFixed(0));

    feedbackResults.aerial = aerial;
    feedbackResults.aerialPercentage = aerialPercentage;

    console.log(feedbackResults);

    return this.buildLevels(feedbackResults);

    // let totalGames = games.length;
    // let totalCompetitiveGames;
    // let totalCasualGames;
  },

  buildLevels(feedbackResults) {

    const feedbackContainer = document.getElementById("heatmapAndFeedbackContainer");

    const item3_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.firstGame}`);
    const item3_child = elBuilder("p", { "class": "heading" }, "Last game");
    const item3_wrapper = elBuilder("div", {}, null, item3_child, item3_child2)
    const item3 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item3_wrapper);
    const item2_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.lastGame}`);
    const item2_child = elBuilder("p", { "class": "heading" }, "First game");
    const item2_wrapper = elBuilder("div", {}, null, item2_child, item2_child2)
    const item2 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item2_wrapper);
    const item1_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.now}`);
    const item1_child = elBuilder("p", { "class": "heading" }, "Heatmap generated on");
    const item1_wrapper = elBuilder("div", {}, null, item1_child, item1_child2)
    const item1 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item1_wrapper);
    const columns1_HeatmapDetails = elBuilder("div", { "id": "feedback-1", "class": "columns" }, null, item1, item2, item3)

    const item6_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.complementB}`);
    const item6_child = elBuilder("p", { "class": "heading" }, "Complementing player 2");
    const item6_wrapper = elBuilder("div", {}, null, item6_child, item6_child2)
    const item6 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item6_wrapper);
    const item5_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.complementA}`);
    const item5_child = elBuilder("p", { "class": "heading" }, "Complementing player 1");
    const item5_wrapper = elBuilder("div", {}, null, item5_child, item5_child2)
    const item5 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item5_wrapper);
    const item4_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.fieldPosition}`);
    const item4_child = elBuilder("p", { "class": "heading" }, "Your playstyle");
    const item4_wrapper = elBuilder("div", {}, null, item4_child, item4_child2)
    const item4 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item4_wrapper);
    const columns2_playerType = elBuilder("div", { "id": "feedback-2", "class": "columns" }, null, item4, item5, item6)

    // shots on team/opponent sides of field, defensive redirects, and aerial shots / %
    const item9_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.aerial} : ${feedbackResults.aerialPercentage}%`);
    const item9_child = elBuilder("p", { "class": "heading" }, "Aerial Shot Total & Percentage");
    const item9_wrapper = elBuilder("div", {}, null, item9_child, item9_child2)
    const item9 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item9_wrapper);
    const item8_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.defensiveRedirect}`);
    const item8_child = elBuilder("p", { "class": "heading" }, "Redirects from Own Goal");
    const item8_wrapper = elBuilder("div", {}, null, item8_child, item8_child2)
    const item8 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item8_wrapper);
    const item7_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.teamSideGoals} : ${feedbackResults.opponentSideGoals}`);
    const item7_child = elBuilder("p", { "class": "heading" }, "Goals from Behind & Beyond Midfield");
    const item7_wrapper = elBuilder("div", {}, null, item7_child, item7_child2)
    const item7 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item7_wrapper);
    const columns3_shotDetails = elBuilder("div", { "id": "feedback-3", "class": "columns" }, null, item7, item8, item9)


    // remove old content if it's already on page

    const feedback1 = document.getElementById("feedback-1");
    const feedback2 = document.getElementById("feedback-2");
    const feedback3 = document.getElementById("feedback-3");

    if (feedback1 !== null) {
      feedback1.replaceWith(columns1_HeatmapDetails);
      feedback2.replaceWith(columns2_playerType);
      feedback3.replaceWith(columns3_shotDetails);
    } else {
      feedbackContainer.appendChild(columns1_HeatmapDetails);
      feedbackContainer.appendChild(columns2_playerType);
      feedbackContainer.appendChild(columns3_shotDetails);
    }

  }

}

export default feedback


/*
- Heatmap generated on
- start date
- end date
-------------
- relevant soccer position based on avg score position
- paired best with 1
- paired best with 2
--------------
- shots scored left / right of midfield
- shots scored as redirects beside own goal (Defensive redirects)
- aerial count & shot %
--------------
- max ball speed
- avg ball speed
- shots over 70mph (~ 110 kph)
--------------
- 3v3 games played
- 2v2 games played
- 1v1 games played
-------------
- total games played
- total shots scored
- win / loss / win%
-------------
- comp games / win %
- casual games / win %
- games in OT
-------------

*/