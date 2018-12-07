import elBuilder from "./elementBuilder"
import heatmapData from "./heatmapData"
import API from "./API";

const webpage = document.getElementById("container-master");

const heatmaps = {

  loadHeatmapContainers() {
    webpage.innerHTML = null;
    this.buildFilters();
    // builds button to generate heatmap, save heatmap, and view saved heatmaps
    // the action is async because the user's saved heatmaps have to be rendered as HTML option elements
    this.buildGenerator();
  },

  buildFilters() {

    // reset button
    const resetBtn = elBuilder("button", { "class": "button is-danger" }, "Reset Filters");

    // date range button
    const dateBtnText = elBuilder("span", {}, "Date Range");
    const dateBtnIcon = elBuilder("i", { "class": "fas fa-calendar" }, null);
    const dateBtnIconSpan = elBuilder("span", { "class": "icon is-small" }, null, dateBtnIcon);
    const dateBtn = elBuilder("a", { "class": "button is-outlined is-dark" }, null, dateBtnIconSpan, dateBtnText);
    const dateBtnParent = elBuilder("div", { "class": "control" }, null, dateBtn);

    // overtime
    const icon6 = elBuilder("i", { "class": "fas fa-clock" }, null);
    const iconSpan6 = elBuilder("span", { "class": "icon is-left" }, null, icon6);
    const sel6_op1 = elBuilder("option", {}, "Overtime");
    const sel6_op2 = elBuilder("option", {}, "Yes");
    const sel6_op3 = elBuilder("option", {}, "No");
    const select6 = elBuilder("select", {}, null, sel6_op1, sel6_op2, sel6_op3);
    const selectDiv6 = elBuilder("div", { "class": "select is-dark" }, null, select6, iconSpan6);
    const control6 = elBuilder("div", { "class": "control has-icons-left" }, null, selectDiv6);

    // result
    const icon5 = elBuilder("i", { "class": "fas fa-trophy" }, null);
    const iconSpan5 = elBuilder("span", { "class": "icon is-left" }, null, icon5);
    const sel5_op1 = elBuilder("option", {}, "Result");
    const sel5_op2 = elBuilder("option", {}, "Victory");
    const sel5_op3 = elBuilder("option", {}, "Defeat");
    const select5 = elBuilder("select", {}, null, sel5_op1, sel5_op2, sel5_op3);
    const selectDiv5 = elBuilder("div", { "class": "select is-dark" }, null, select5, iconSpan5);
    const control5 = elBuilder("div", { "class": "control has-icons-left" }, null, selectDiv5);

    // game type
    const icon4 = elBuilder("i", { "class": "fas fa-sitemap" }, null);
    const iconSpan4 = elBuilder("span", { "class": "icon is-left" }, null, icon4);
    const sel4_op1 = elBuilder("option", {}, "Game Type");
    const sel4_op2 = elBuilder("option", {}, "3v3");
    const sel4_op3 = elBuilder("option", {}, "2v2");
    const sel4_op4 = elBuilder("option", {}, "1v1");
    const select4 = elBuilder("select", {}, null, sel4_op1, sel4_op2, sel4_op3, sel4_op4);
    const selectDiv4 = elBuilder("div", { "class": "select is-dark" }, null, select4, iconSpan4);
    const control4 = elBuilder("div", { "class": "control has-icons-left" }, null, selectDiv4);

    // game mode
    const icon3 = elBuilder("i", { "class": "fas fa-gamepad" }, null);
    const iconSpan3 = elBuilder("span", { "class": "icon is-left" }, null, icon3);
    const sel3_op1 = elBuilder("option", {}, "Game Mode");
    const sel3_op2 = elBuilder("option", {}, "Competitive");
    const sel3_op3 = elBuilder("option", {}, "Casual");
    const select3 = elBuilder("select", {}, null, sel3_op1, sel3_op2, sel3_op3);
    const selectDiv3 = elBuilder("div", { "class": "select is-dark" }, null, select3, iconSpan3);
    const control3 = elBuilder("div", { "class": "control has-icons-left" }, null, selectDiv3);

    // team
    const icon2 = elBuilder("i", { "class": "fas fa-handshake" }, null);
    const iconSpan2 = elBuilder("span", { "class": "icon is-left" }, null, icon2);
    const sel2_op1 = elBuilder("option", {}, "Team");
    const sel2_op2 = elBuilder("option", {}, "Orange");
    const sel2_op3 = elBuilder("option", {}, "Blue");
    const select2 = elBuilder("select", {}, null, sel2_op1, sel2_op2, sel2_op3);
    const selectDiv2 = elBuilder("div", { "class": "select is-dark" }, null, select2, iconSpan2);
    const control2 = elBuilder("div", { "class": "control has-icons-left" }, null, selectDiv2);

    // shot type
    const icon1 = elBuilder("i", { "class": "fas fa-futbol" }, null);
    const iconSpan1 = elBuilder("span", { "class": "icon is-left" }, null, icon1);
    const sel1_op1 = elBuilder("option", {}, "Shot Type");
    const sel1_op2 = elBuilder("option", {}, "Aerial");
    const sel1_op3 = elBuilder("option", {}, "Standard");
    const select1 = elBuilder("select", {"id":"filter-shotType"}, null, sel1_op1, sel1_op2, sel1_op3);
    const selectDiv1 = elBuilder("div", { "class": "select is-dark" }, null, select1, iconSpan1);
    const control1 = elBuilder("div", { "class": "control has-icons-left" }, null, selectDiv1);

    const filterField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, control1, control2, control3, control4, control5, control6, dateBtnParent, resetBtn);
    const ParentFilterContainer = elBuilder("div", { "class": "container box" }, null, filterField);

    // append filter container to webpage
    webpage.appendChild(ParentFilterContainer);
  },

  buildGenerator() {
    const activeUserId = sessionStorage.getItem("activeUserId");

    // use fetch to append options to select element if user at least 1 saved heatmap
    API.getAll(`heatmaps?userId=${activeUserId}`)
      .then(heatmaps => {
        console.log("Array of user's saved heatmaps:", heatmaps);

        const icon = elBuilder("i", { "class": "fas fa-fire" }, null);
        const iconSpan = elBuilder("span", { "class": "icon is-left" }, null, icon);
        const sel1_op1 = elBuilder("option", {}, "Basic Heatmap");
        const heatmapDropdown = elBuilder("select", { "id": "heatmapDropdown" }, null, sel1_op1);
        const heatmapSelectDiv = elBuilder("div", { "class": "select is-dark" }, null, heatmapDropdown, iconSpan);
        const heatmapControl = elBuilder("div", { "class": "control has-icons-left" }, null, heatmapSelectDiv);

        const deleteHeatmapBtn = elBuilder("button", { "id":"deleteHeatmapBtn", "class": "button is-danger" }, "Delete Heatmap")
        const deleteBtnControl = elBuilder("div", { "class": "control" }, null, deleteHeatmapBtn)
        const saveBtn = elBuilder("button", { "id": "saveHeatmapBtn", "class": "button is-success" }, "Save Heatmap")
        const saveBtnControl = elBuilder("div", { "class": "control" }, null, saveBtn)
        const saveInput = elBuilder("input", { "id": "saveHeatmapInput", "class": "input", "type": "text", "placeholder": "Name and save this heatmap", "maxlength": "30" }, null)
        const saveControl = elBuilder("div", { "class": "control is-expanded" }, null, saveInput)

        const generatorButton = elBuilder("button", { "id": "generateHeatmapBtn", "class": "button is-dark" }, "Generate Heatmap");
        const generatorControl = elBuilder("div", { "class": "control" }, null, generatorButton);

        // if no heatmaps are saved, generate no extra options in dropdown
        if (heatmaps.length === 0) {
          const generatorField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, heatmapControl, generatorControl, saveControl, saveBtnControl, deleteBtnControl);
          const ParentGeneratorContainer = elBuilder("div", { "class": "container box" }, null, generatorField);
          webpage.appendChild(ParentGeneratorContainer);
        } else { // else, for each heatmap saved, make a new option and append it to the
          heatmaps.forEach(heatmap => {
            heatmapDropdown.appendChild(elBuilder("option", {"id":`heatmap-${heatmap.id}`}, heatmap.name));
          })
          const generatorField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, heatmapControl, generatorControl, saveControl, saveBtnControl, deleteBtnControl);
          const ParentGeneratorContainer = elBuilder("div", { "class": "container box" }, null, generatorField);
          webpage.appendChild(ParentGeneratorContainer);
        }
        this.buildFieldandGoal();
        this.heatmapEventManager();
      });

  },

  buildFieldandGoal() {
    const fieldImage = elBuilder("img", { "id": "field-img", "src": "../images/DFH_stadium_790x540_no_bg_90deg.png", "alt": "DFH Stadium", "style": "height: 100%; width: 100%; object-fit: contain" });
    const fieldImageBackground = elBuilder("img", { "id": "field-img-bg", "src": "../images/DFH_stadium_790x540_no_bg_90deg.png", "alt": "DFH Stadium", "style": "height: 100%; width: 100%; object-fit: contain" });
    const fieldImageParent = elBuilder("div", { "id": "field-img-parent", "class": "" }, null, fieldImageBackground, fieldImage);
    const alignField = elBuilder("div", { "class": "level-item" }, null, fieldImageParent);
    const goalImage = elBuilder("img", { "id": "goal-img", "src": "../images/RL_goal_cropped_no_bg_BW.png", "alt": "DFH Stadium", "style": "height: 100%; width: 100%; object-fit: contain" });
    const goalImageParent = elBuilder("div", { "id": "goal-img-parent", "class": "level" }, null, goalImage);
    const alignGoal = elBuilder("div", { "class": "level-item" }, null, goalImageParent);
    const heatmapImageContainers = elBuilder("div", { "class": "level" }, null, alignField, alignGoal);

    // parent container holding all shot information
    const parentShotContainer = elBuilder("div", { "class": "container box" }, null, heatmapImageContainers)

    // append field and goal to page
    webpage.appendChild(parentShotContainer);
  },

  heatmapEventManager() {
    const generateHeatmapBtn = document.getElementById("generateHeatmapBtn");
    const saveHeatmapBtn = document.getElementById("saveHeatmapBtn");
    const deleteHeatmapBtn = document.getElementById("deleteHeatmapBtn");

    generateHeatmapBtn.addEventListener("click", heatmapData.getUserShots);
    saveHeatmapBtn.addEventListener("click", heatmapData.saveHeatmap);
    deleteHeatmapBtn.addEventListener("click", heatmapData.deleteHeatmap);
  }

}

export default heatmaps