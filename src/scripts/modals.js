import elBuilder from "./elementBuilder"
import heatmapData from "./heatmapData"

const webpage = document.getElementById("container-master");

const modals = {

  buildDateFilter() {
    // this function is called from heatmaps.js and is triggered from the heatmaps page of the site when
    // the date filter is selected
    const endDateInput = elBuilder("input", { "id": "endDateInput", "type": "date" }, null);
    const endDateControl = elBuilder("div", { "class": "control" }, null, endDateInput);
    const endDateLabel = elBuilder("label", {"class":"label"}, "Date 2:\xa0");
    const endDateInputField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, endDateLabel, endDateControl);

    const startDateInput = elBuilder("input", { "id": "startDateInput", "type": "date" }, null);
    const startDateControl = elBuilder("div", { "class": "control" }, null, startDateInput);
    const startDateLabel = elBuilder("label", {"class":"label"}, "Date 1:\xa0");
    const startDateInputField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, startDateLabel, startDateControl);

    const dateSaveBtn = elBuilder("button", { "class": "button is-success" }, "Set Filter");
    const saveButtonControl = elBuilder("div", { "class": "control" }, null, dateSaveBtn);
    const cancelBtn = elBuilder("button", { "class": "button is-danger" }, "Cancel");
    const cancelButtonControl = elBuilder("div", { "class": "control" }, null, cancelBtn);
    const buttonField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, saveButtonControl, cancelButtonControl);

    const modalCloseBtn = elBuilder("button", { "class": "modal-close is-large", "aria-label": "close" }, null);
    const modalContent = elBuilder("div", { "class": "modal-content box" }, null, startDateInputField, endDateInputField, buttonField);
    const modalBackground = elBuilder("div", { "class": "modal-background" }, null);
    const modal = elBuilder("div", { "id": "modal-dateFilter", "class": "modal" }, null, modalBackground, modalContent, modalCloseBtn);

    webpage.appendChild(modal);
    this.modalsEventManager();
  },

  openDateFilter() {
    const dateRangeBtn = document.getElementById("dateRangeBtn");
    const dateFilterModal = document.getElementById("modal-dateFilter");

    dateRangeBtn.classList.toggle("is-outlined");
    dateFilterModal.classList.toggle("is-active");
  },

  modalsEventManager() {
    // date filter modal
    const dateRangeBtn = document.getElementById("dateRangeBtn");
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const startDateInput = document.getElementById("startDateInput");
    const endDateInput = document.getElementById("endDateInput");

    dateFilterModal.addEventListener("click", (e) => {
      if (e.target.textContent === "Set Filter") {
        if (startDateInput.value === "" || endDateInput.value === "") {
          console.log("Input not acceptable")
        } else {
          // set global vars in heatmaps page
        }
      } else if (e.target.textContent === "Cancel") {
        dateRangeBtn.classList.toggle("is-outlined");
        dateFilterModal.classList.toggle("is-active");
      }
    })
  }

}

export default modals