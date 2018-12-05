import navbar from "./navbar"
import gameplay from "./gameplay"
import heatmaps from "./heatmaps";

// function closeBox(e) {
//   if (e.target.classList.contains("delete")) {
//     e.target.parentNode.style.display = "none";
//   }
// }

// navbar.generateNavbar()
navbar.generateNavbar(true)
heatmaps.loadHeatmapContainers();