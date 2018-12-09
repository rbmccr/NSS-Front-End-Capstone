import elBuilder from "./elementBuilder"
import heatmapData from "./heatmapData"

const webpage = document.getElementById("container-master");

const modals = {

  buildDateFilter() {
    // this function is called from heatmaps.js and is triggered from the heatmaps page of the site when
    // the date filter is selected
    const endDateInput = elBuilder("input", { "id": "endDateInput", "type": "date" }, null);
    const endDateControl = elBuilder("div", { "class": "control" }, null, endDateInput);
    const startDateInput = elBuilder("input", { "id": "startDateInput", "type": "date" }, null);
    const startDateControl = elBuilder("div", { "class": "control" }, null, startDateInput);
    const dateInputField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, startDateControl, endDateControl);

    const dateSaveBtn = elBuilder("button", { "class": "button is-success" }, "Set Filter");
    const saveButtonControl = elBuilder("div", { "class": "control" }, null, dateSaveBtn);
    const cancelBtn = elBuilder("button", { "class": "button is-danger" }, "Cancel");
    const cancelButtonControl = elBuilder("div", { "class": "control" }, null, cancelBtn);
    const buttonField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, saveButtonControl, cancelButtonControl);

    const modalCloseBtn = elBuilder("button", { "class": "modal-close is-large", "aria-label": "close" }, null);
    const modalContent = elBuilder("div", { "class": "modal-content" }, null, dateInputField, buttonField);
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
    const dateFilter = document.getElementById("modal-dateFilter");
    const startDateInput = document.getElementById("startDateInput");
    const endDateInput = document.getElementById("endDateInput");

    dateFilter.addEventListener("click", (e) => {
      if (e.target.textContent === "Set Filter") {
        console.log("start", startDateInput.value, "end", endDateInput.value);
      } else if (e.target.textContent === "Cancel") {
        console.log("cancelling");
      }
    })
  }

}

export default modals