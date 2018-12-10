import elBuilder from "./elementBuilder";
import API from "./API";

const feedback = {

  loadFeedback(shots) {

    // first, use the shots we have to fetch the games they're associated with
    let gameIds = [];

    shots.forEach(shot => {
      gameIds.push(shot.gameId);
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




    return this.buildLevels(feedbackResults);

    // let totalGames = games.length;
    // let totalCompetitiveGames;
    // let totalCasualGames;
  },

  buildLevels(feedbackResults) {



    const feedbackContainer = document.getElementById("heatmapAndFeedbackContainer");

    const item3_child2 = elBuilder("p", { "class": "title is-5" }, "date here");
    const item3_child = elBuilder("p", { "class": "heading" }, "Last game");
    const item3_wrapper = elBuilder("div", {}, null, item3_child, item3_child2)
    const item3 = elBuilder("div", { "class": "level-item has-text-centered" }, null, item3_wrapper);
    const item2_child2 = elBuilder("p", { "class": "title is-5" }, "date here");
    const item2_child = elBuilder("p", { "class": "heading" }, "First game");
    const item2_wrapper = elBuilder("div", {}, null, item2_child, item2_child2)
    const item2 = elBuilder("div", { "class": "level-item has-text-centered" }, null, item2_wrapper);
    const item1_child2 = elBuilder("p", { "class": "title is-5" }, `${feedbackResults.now}`);
    const item1_child = elBuilder("p", { "class": "heading" }, "Heatmap generated on");
    const item1_wrapper = elBuilder("div", {}, null, item1_child, item1_child2)
    const item1 = elBuilder("div", { "class": "level-item has-text-centered" }, null, item1_wrapper);
    const level1_heatmapDetails = elBuilder("div", {"id":"feedback-1", "class": "level" }, null, item1, item2, item3)



    // const item4_child2 = elBuilder("p", { "class": "title is-5" }, "date here");
    // const item4_child = elBuilder("p", { "class": "heading" }, "End date");
    // const item4_wrapper = elBuilder("div",{}, null, item4_child, item4_child2)
    // const item4 = elBuilder("div", { "class": "level-item has-text-centered" }, null, item4_wrapper);
    // const item3_child2 = elBuilder("p", { "class": "title is-5" }, "date here");
    // const item3_child = elBuilder("p", { "class": "heading" }, "Start date");
    // const item3_wrapper = elBuilder("div",{}, null, item3_child, item3_child2)
    // const item3 = elBuilder("div", { "class": "level-item has-text-centered" }, null, item3_wrapper);
    // const item2_child2 = elBuilder("p", { "class": "title is-5" }, "date here");
    // const item2_child = elBuilder("p", { "class": "heading" }, "Heatmap saved on");
    // const item2_wrapper = elBuilder("div",{}, null, item2_child, item2_child2)
    // const item2 = elBuilder("div", { "class": "level-item has-text-centered" }, null, item2_wrapper);
    // const item1_child2 = elBuilder("p", { "class": "title is-5" }, "date here");
    // const item1_child = elBuilder("p", { "class": "heading" }, "Heatmap generated on");
    // const item1_wrapper = elBuilder("div",{}, null, item1_child, item1_child2)
    // const item1 = elBuilder("div", { "class": "level-item has-text-centered" }, null, item1_wrapper);
    // const level1_heatmapDetails = elBuilder("div", { "class": "level" }, null, item1, item2, item3, item4)


    // remove old content if it's already on page

    const feedback1 = document.getElementById("feedback-1");

    if (feedback1 === undefined) {
      feedback1.replaceWith(level1_heatmapDetails);
    } else {
      feedbackContainer.appendChild(level1_heatmapDetails);
    }

  }

}

export default feedback


/*
- Heatmap generated on
- start date
- end date
-------------
- avg user position on field
- relevant soccer position
- paired best with 1
- paired best with 2
-------------
- avg position in party
- relevant soccer position
- avg position without party
- relevant soccer position
--------------
- max ball speed
- avg ball speed
- aerial count
- aerial %
--------------
- 3v3 games played
- 2v2 games played
- 1v1 games played
--------------
- shots scored left of midfield
- shots scored right of midfield
- shots scored as redirects beside own goal (Defensive redirects)
--------------
- # of wins
- # of losses
- comp win ratio
- casual win ratio
--------------
- game in OT
- games with no OT
- OT win %
- OT loss %
--------------
- overall evaluation



*/