import elBuilder from "./elementBuilder"

const webpage = document.getElementById("container-master");

const heatmaps = {

  loadHeatmapContainers() {
    webpage.innerHTML = null;
    this.buildFilters();
  },

  buildFilters() {


    //   <p class="buttons">
    // <a class="button">
    //   <span class="icon">
    //     <i class="fab fa-github"></i>
    //   </span>
    //   <span>GitHub</span>
    // </a>

    // reset button
    const resetBtn = elBuilder("button", { "class": "button is-danger" }, "Reset Filters");

    // date range button
    const dateBtnText = elBuilder("span", {}, "Date Range")
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
    const icon3 = elBuilder("i", { "class": "fas fa-handshake" }, null);
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
    const select1 = elBuilder("select", {}, null, sel1_op1, sel1_op2, sel1_op3);
    const selectDiv1 = elBuilder("div", { "class": "select is-dark" }, null, select1, iconSpan1);
    const control1 = elBuilder("div", { "class": "control has-icons-left" }, null, selectDiv1);

    const filterField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, control1, control2, control3, control4, control5, control6, dateBtnParent, resetBtn);
    const ParentFilterContainer = elBuilder("div", { "class": "container box" }, null, filterField);

    // append filter container to webpage
    webpage.appendChild(ParentFilterContainer);
  }

}

export default heatmaps