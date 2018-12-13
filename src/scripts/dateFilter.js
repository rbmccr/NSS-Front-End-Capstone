import elBuilder from "./elementBuilder"
import heatmapData from "./heatmapData"

const webpage = document.getElementById("container-master");

const dateFilter = {

  buildDateFilter() {
    // this function is called from heatmaps.js and is triggered from the heatmaps page of the site when
    // the date filter is selected
    const endDateInput = elBuilder("input", { "id": "endDateInput", "class": "input", "type": "date" }, null);
    const endDateControl = elBuilder("div", { "class": "control" }, null, endDateInput);
    const endDateLabel = elBuilder("label", { "class": "label" }, "Date 2:\xa0");
    const endDateInputField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, endDateLabel, endDateControl);

    const startDateInput = elBuilder("input", { "id": "startDateInput", "class": "input", "type": "date" }, null);
    const startDateControl = elBuilder("div", { "class": "control" }, null, startDateInput);
    const startDateLabel = elBuilder("label", { "class": "label" }, "Date 1:\xa0");
    const startDateInputField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, startDateLabel, startDateControl);

    const clearFilterBtn = elBuilder("button", { "id": "clearDateFilter", "class": "button is-danger" }, "Clear Filter");
    const clearFilterButtonControl = elBuilder("div", { "class": "control" }, null, clearFilterBtn);
    const dateSaveBtn = elBuilder("button", { "id": "setDateFilter", "class": "button is-success" }, "Set Filter");
    const saveButtonControl = elBuilder("div", { "class": "control" }, null, dateSaveBtn);
    const cancelBtn = elBuilder("button", { "id": "cancelModalWindow", "class": "button is-danger" }, "Cancel");
    const cancelButtonControl = elBuilder("div", { "class": "control" }, null, cancelBtn);
    const buttonField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, saveButtonControl, clearFilterButtonControl, cancelButtonControl);

    const modalContent = elBuilder("div", { "class": "modal-content box" }, null, startDateInputField, endDateInputField, buttonField);
    const modalBackground = elBuilder("div", { "class": "modal-background" }, null);
    const modal = elBuilder("div", { "id": "modal-dateFilter", "class": "modal" }, null, modalBackground, modalContent);

    webpage.appendChild(modal);
    this.modalsEventManager();
  },

  modalsEventManager() {
    const clearDateFilterBtn = document.getElementById("clearDateFilter");
    const setDateFilterBtn = document.getElementById("setDateFilter");
    const cancelModalWindowBtn = document.getElementById("cancelModalWindow");

    cancelModalWindowBtn.addEventListener("click", dateFilter.cancelModalWindow);
    setDateFilterBtn.addEventListener("click", dateFilter.setFilter);
    clearDateFilterBtn.addEventListener("click", dateFilter.clearDateFilter);

  },

  openDateFilter() {
    const dateRangeBtn = document.getElementById("dateRangeBtn");
    const dateFilterModal = document.getElementById("modal-dateFilter");
    // check if global vars are set. If so, don't toggle color of button
    const dateSet = heatmapData.handleDateFilterGlobalVariables(true);

    if (dateSet !== undefined) {
      dateFilterModal.classList.toggle("is-active");
    } else {
      dateRangeBtn.classList.toggle("is-outlined");
      dateFilterModal.classList.toggle("is-active");
    }

  },

  clearDateFilter() {
    // this function resets global date filter variables in heatmapData.js and replaces date inputs with blank date inputs
    let startDateInput = document.getElementById("startDateInput");
    let endDateInput = document.getElementById("endDateInput");
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const setDateFilterBtn = document.getElementById("setDateFilter");
    const dateRangeBtn = document.getElementById("dateRangeBtn");

    heatmapData.handleDateFilterGlobalVariables();
    dateRangeBtn.classList.add("is-outlined");
    startDateInput.replaceWith(elBuilder("input", { "id": "startDateInput", "class": "input", "type": "date" }, null));
    endDateInput.replaceWith(elBuilder("input", { "id": "endDateInput", "class": "input", "type": "date" }, null));
    setDateFilterBtn.removeEventListener("click", dateFilter.setFilter);
    setDateFilterBtn.addEventListener("click", dateFilter.setFilter);

    if (dateFilterModal.classList.contains("is-active")) {
      dateFilterModal.classList.remove("is-active");
    }

  },

  setFilter() {
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const startDateInput = document.getElementById("startDateInput");
    const endDateInput = document.getElementById("endDateInput");

    startDateInput.classList.remove("is-danger");
    endDateInput.classList.remove("is-danger");

    // check if date pickers have a valid date
    if (startDateInput.value === "") {
      startDateInput.classList.add("is-danger");
    } else if (endDateInput.value === "") {
      endDateInput.classList.add("is-danger");
    } else {
      // if they do, then set global vars in heatmaps page and close modal
      heatmapData.handleDateFilterGlobalVariables(false, startDateInput.value, endDateInput.value);
      dateFilterModal.classList.toggle("is-active");
    }
  },

  cancelModalWindow() {
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const dateRangeBtn = document.getElementById("dateRangeBtn");

    // if global variables are defined already, cancel should not change the class on the date range button
    const dateSet = heatmapData.handleDateFilterGlobalVariables(true);
    if (dateSet !== undefined) {
      dateFilterModal.classList.toggle("is-active");
    } else {
      dateRangeBtn.classList.toggle("is-outlined");
      dateFilterModal.classList.toggle("is-active");
    }
  },

  applydateFilter(startDate, endDate, gameIds, game) {
    // this function examines the game object argument compared to the user-defined start and end dates
    // if the game date is within the two dates specified, then the game ID is pushed to the gameIds array

    // split timestamp and recall only date
    let gameDate = game.timeStamp.split("T")[0];

    if (startDate <= gameDate && gameDate <= endDate) {
      gameIds.push(game.id);
    }
  },

  applydateFilterToSavedHeatmap(startDate, endDate, shots, shotsMatchingFilter) {
    shots.forEach(shot => {
      let shotDate = shot.timeStamp.split("T")[0];

      if (startDate <= shotDate && shotDate <= endDate) {
        shotsMatchingFilter.push(shot);
      }
    })
  }

}

export default dateFilter