import elBuilder from "./elementBuilder";
import API from "./API";

const feedback = {

  loadFeedback(shots) {

    // first, use the shots we have to fetch the games they're associated with
    let gameIds = [];

    shots.forEach(shot => {
      gameIds.push(shot.gameId);
    })

    // remove duplicate game IDs
    gameIds = gameIds.filter((item, idx) => {
      return gameIds.indexOf(item) == idx;
    });

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

    // get range of dates on games (max and min)
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
    });

    let aerialPercentage = Number((aerial / shots.length * 100).toFixed(0));

    feedbackResults.aerial = aerial;
    feedbackResults.aerialPercentage = aerialPercentage;

    // max ball speed, average ball speed, shots over 70 mph
    let avgBallSpeed = 0;
    let shotsOver70mph = 0;

    shots.forEach(shot => {
      if (shot.ball_speed >= 70) {
        shotsOver70mph++;
      }
      avgBallSpeed += shot.ball_speed
    });

    avgBallSpeed = Number((avgBallSpeed / shots.length).toFixed(1));

    feedbackResults.maxBallSpeed = shots.reduce((max, shot) => shot.ball_speed > max ? shot.ball_speed : max, shots[0].ball_speed);
    feedbackResults.avgBallSpeed = avgBallSpeed;
    feedbackResults.shotsOver70mph = shotsOver70mph;

    // 3v3, 2v2, and 1v1 games played
    let _3v3 = 0;
    let _2v2 = 0;
    let _1v1 = 0;

    games.forEach(game => {
      if (game.type === "3v3") {
        _3v3++;
      } else if (game.type === "2v2") {
        _2v2++;
      } else {
        _1v1++;
      }
    });

    feedbackResults._3v3 = _3v3;
    feedbackResults._2v2 = _2v2;
    feedbackResults._1v1 = _1v1;

    // total games played, total shots scored, wins/losses/win%
    feedbackResults.totalGames = games.length;
    feedbackResults.totalShots = shots.length;

    let wins = 0;
    let losses = 0;

    games.forEach(game => {
      if (game.score > game.opp_score) {
        wins++
      } else {
        losses++;
      }
    });

    feedbackResults.wins = wins;
    feedbackResults.losses = losses;
    feedbackResults.winPct = Number(((wins / (wins + losses)) * 100).toFixed(0));

    // comp games / win %, casual games / win %, games in OT
    let competitiveGames = 0;
    let compWin = 0;
    let casualGames = 0;
    let casualWin = 0;
    let overtimeGames = 0;

    games.forEach(game => {
      if (game.mode === "casual") {
        casualGames++;
        if (game.score > game.opp_score) {
          casualWin++;
        }
      } else {
        competitiveGames++;
        if (game.score > game.opp_score) {
          compWin++;
        }
      }
      if (game.overtime === true) {
        overtimeGames++;
      }
    });


    let compWinPct = 0;

    if (competitiveGames === 0) {
      compWinPct = 0;
    } else {
      compWinPct = Number(((compWin / competitiveGames) * 100).toFixed(0));
    }
    let casualWinPct = 0;

    if (casualGames === 0) {
      casualWinPct = 0;
    } else {
      casualWinPct = Number(((casualWin / casualGames) * 100).toFixed(1));
    }

    feedbackResults.competitiveGames = competitiveGames;
    feedbackResults.casualGames = casualGames;
    feedbackResults.compWinPct = compWinPct;
    feedbackResults.casualWinPct = casualWinPct;
    feedbackResults.overtimeGames = overtimeGames;

    console.log(feedbackResults)

    return this.buildLevels(feedbackResults);
  },

  buildLevels(feedbackResults) {

    const feedbackContainer = document.getElementById("heatmapAndFeedbackContainer");

    // reformat heatmap generation time to remove seconds
    const timeReformat = [feedbackResults.now.split(":")[0], feedbackResults.now.split(":")[1]].join(":") + feedbackResults.now.split(":")[2].slice(2);
    // reformat dates with slashes and put year at end
    const dateReformat1 = [feedbackResults.firstGame.split("-")[1], feedbackResults.firstGame.split("-")[2]].join("/") + "/" + feedbackResults.firstGame.split("-")[0];
    const dateReformat2 = [feedbackResults.lastGame.split("-")[1], feedbackResults.lastGame.split("-")[2]].join("/") + "/" + feedbackResults.lastGame.split("-")[0];

    // heatmap generation and range of dates on games (max and min)
    const item3_child2 = elBuilder("p", { "class": "title is-6" }, `${dateReformat2}`);
    const item3_child = elBuilder("p", { "class": "heading" }, "Last game");
    const item3_wrapper = elBuilder("div", {}, null, item3_child, item3_child2)
    const item3 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item3_wrapper);
    const item2_child2 = elBuilder("p", { "class": "title is-6" }, `${dateReformat1}`);
    const item2_child = elBuilder("p", { "class": "heading" }, "First game");
    const item2_wrapper = elBuilder("div", {}, null, item2_child, item2_child2)
    const item2 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item2_wrapper);
    const item1_child2 = elBuilder("p", { "class": "title is-6" }, `${timeReformat}`);
    const item1_child = elBuilder("p", { "class": "heading" }, "Heatmap generated");
    const item1_wrapper = elBuilder("div", {}, null, item1_child, item1_child2)
    const item1 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item1_wrapper);
    const columns1_HeatmapDetails = elBuilder("div", { "id": "feedback-1", "class": "columns has-background-white-ter" }, null, item1, item2, item3)

    // player feedback based on average field x,y coordinate of player shots
    const item6_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.complementB}`);
    const item6_child = elBuilder("p", { "class": "heading" }, "Complementing player 2");
    const item6_wrapper = elBuilder("div", {}, null, item6_child, item6_child2)
    const item6 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item6_wrapper);
    const item5_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.complementA}`);
    const item5_child = elBuilder("p", { "class": "heading" }, "Complementing player 1");
    const item5_wrapper = elBuilder("div", {}, null, item5_child, item5_child2)
    const item5 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item5_wrapper);
    const item4_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.fieldPosition}`);
    const item4_child = elBuilder("p", { "class": "heading" }, "Your playstyle");
    const item4_wrapper = elBuilder("div", {}, null, item4_child, item4_child2)
    const item4 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item4_wrapper);
    const columns2_playerType = elBuilder("div", { "id": "feedback-2", "class": "columns" }, null, item4, item5, item6)

    // shots on team/opponent sides of field, defensive redirects, and aerial shots / %
    const item9_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.defensiveRedirect}`);
    const item9_child = elBuilder("p", { "class": "heading" }, "Redirects from Own Goal");
    const item9_wrapper = elBuilder("div", {}, null, item9_child, item9_child2);
    const item9 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item9_wrapper);
    const item8_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.teamSideGoals} : ${feedbackResults.opponentSideGoals}`);
    const item8_child = elBuilder("p", { "class": "heading" }, "Goals Behind & Beyond Midfield");
    const item8_wrapper = elBuilder("div", {}, null, item8_child, item8_child2);
    const item8 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item8_wrapper);
    const item7_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.aerial} : ${feedbackResults.aerialPercentage}%`);
    const item7_child = elBuilder("p", { "class": "heading" }, "Aerial Goal Total & Pct");
    const item7_wrapper = elBuilder("div", {}, null, item7_child, item7_child2);
    const item7 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item7_wrapper);
    const columns3_shotDetails = elBuilder("div", { "id": "feedback-3", "class": "columns" }, null, item7, item8, item9)

    // max ball speed, average ball speed, shots over 70 mph
    const item12_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.shotsOver70mph}`);
    const item12_child = elBuilder("p", { "class": "heading" }, "Shots Over 70 mph");
    const item12_wrapper = elBuilder("div", {}, null, item12_child, item12_child2);
    const item12 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item12_wrapper);
    const item11_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.avgBallSpeed} mph`);
    const item11_child = elBuilder("p", { "class": "heading" }, "Average Ball Speed");
    const item11_wrapper = elBuilder("div", {}, null, item11_child, item11_child2);
    const item11 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item11_wrapper);
    const item10_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.maxBallSpeed} mph`);
    const item10_child = elBuilder("p", { "class": "heading" }, "Max Ball Speed");
    const item10_wrapper = elBuilder("div", {}, null, item10_child, item10_child2);
    const item10 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item10_wrapper);
    const columns4_ballDetails = elBuilder("div", { "id": "feedback-4", "class": "columns has-background-white-ter" }, null, item10, item11, item12)

    // total games played, total shots scored, wins/losses/win%
    const item15_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.wins} : ${feedbackResults.losses} : ${feedbackResults.winPct}%`);
    const item15_child = elBuilder("p", { "class": "heading" }, "Wins, Losses, & Win Pct");
    const item15_wrapper = elBuilder("div", {}, null, item15_child, item15_child2);
    const item15 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item15_wrapper);
    const item14_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.totalShots}`);
    const item14_child = elBuilder("p", { "class": "heading" }, "Total Goals");
    const item14_wrapper = elBuilder("div", {}, null, item14_child, item14_child2);
    const item14 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item14_wrapper);
    const item13_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.totalGames}`);
    const item13_child = elBuilder("p", { "class": "heading" }, "Total Games");
    const item13_wrapper = elBuilder("div", {}, null, item13_child, item13_child2);
    const item13 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item13_wrapper);
    const columns5_victoryDetails = elBuilder("div", { "id": "feedback-5", "class": "columns has-background-white-ter" }, null, item13, item14, item15)

    // 3v3, 2v2, and 1v1 games played
    const item18_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults._1v1}`);
    const item18_child = elBuilder("p", { "class": "heading" }, "1v1 Games");
    const item18_wrapper = elBuilder("div", {}, null, item18_child, item18_child2);
    const item18 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item18_wrapper);
    const item17_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults._2v2}`);
    const item17_child = elBuilder("p", { "class": "heading" }, "2v2 games");
    const item17_wrapper = elBuilder("div", {}, null, item17_child, item17_child2);
    const item17 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item17_wrapper);
    const item16_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults._3v3}`);
    const item16_child = elBuilder("p", { "class": "heading" }, "3v3 Games");
    const item16_wrapper = elBuilder("div", {}, null, item16_child, item16_child2);
    const item16 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item16_wrapper);
    const columns6_gameTypeDetails = elBuilder("div", { "id": "feedback-6", "class": "columns" }, null, item16, item17, item18)

    // comp games / win %, casual games / win %, games in OT
    const item21_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.overtimeGames}`);
    const item21_child = elBuilder("p", { "class": "heading" }, "Overtime Games");
    const item21_wrapper = elBuilder("div", {}, null, item21_child, item21_child2);
    const item21 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item21_wrapper);
    const item20_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.competitiveGames} : ${feedbackResults.compWinPct}%`);
    const item20_child = elBuilder("p", { "class": "heading" }, "Competitive Games & Win Pct");
    const item20_wrapper = elBuilder("div", {}, null, item20_child, item20_child2);
    const item20 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item20_wrapper);
    const item19_child2 = elBuilder("p", { "class": "title is-6" }, `${feedbackResults.casualGames} : ${feedbackResults.casualWinPct}%`);
    const item19_child = elBuilder("p", { "class": "heading" }, "Casual Games & Win Pct");
    const item19_wrapper = elBuilder("div", {}, null, item19_child, item19_child2);
    const item19 = elBuilder("div", { "class": "column is-one-third has-text-centered" }, null, item19_wrapper);
    const columns7_overtimeDetails = elBuilder("div", { "id": "feedback-7", "class": "columns has-background-white-ter" }, null, item19, item20, item21)

    // replace old content if it's already on the page
    const feedback1 = document.getElementById("feedback-1");
    const feedback2 = document.getElementById("feedback-2");
    const feedback3 = document.getElementById("feedback-3");
    const feedback4 = document.getElementById("feedback-4");
    const feedback5 = document.getElementById("feedback-5");
    const feedback6 = document.getElementById("feedback-6");
    const feedback7 = document.getElementById("feedback-7");

    if (feedback1 !== null) {
      feedback1.replaceWith(columns1_HeatmapDetails);
      feedback2.replaceWith(columns2_playerType);
      feedback3.replaceWith(columns3_shotDetails);
      feedback4.replaceWith(columns4_ballDetails);
      feedback5.replaceWith(columns5_victoryDetails);
      feedback6.replaceWith(columns6_gameTypeDetails);
      feedback7.replaceWith(columns7_overtimeDetails);
    } else {
      feedbackContainer.appendChild(columns1_HeatmapDetails);
      feedbackContainer.appendChild(columns2_playerType);
      feedbackContainer.appendChild(columns4_ballDetails);
      feedbackContainer.appendChild(columns3_shotDetails);
      feedbackContainer.appendChild(columns5_victoryDetails);
      feedbackContainer.appendChild(columns6_gameTypeDetails);
      feedbackContainer.appendChild(columns7_overtimeDetails);
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