// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { GreenhouseProvider } from "./components/GreenhouseContext";

// Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
// Leaflet map CSS
import "leaflet/dist/leaflet.css";

// Fix pentru icon-urile implicite Leaflet (Vite/Webpack)
import L from "leaflet";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon, shadowUrl: shadow });

// Normalizare intrare: dacă ai ajuns pe /api|/ext sau ai vechiul #/route, rescrie către rute curate
(function normalizeEntryUrl() {
  const { origin, pathname, search, hash } = window.location;

  // 1) Dacă ai ajuns pe un URL de API (ex: /api/reports?...#/statistici)
  if (/^\/(api|ext)\//.test(pathname)) {
    const next = hash && hash.startsWith("#/") ? origin + hash.slice(1) : origin + "/";
    window.history.replaceState(null, "", next);
    return;
  }

  // 2) Dacă ai format vechi cu hash (#/statistici), transformă-l în /statistici
  if (hash && hash.startsWith("#/")) {
    const next = origin + hash.slice(1);
    window.history.replaceState(null, "", next);
    return;
  }

  // 3) (opțional) dacă s-a lipit un ?identifier=... pe ruta principală, îl poți curăța:
  if (!/^\/(api|ext)\//.test(pathname) && search) {
    const params = new URLSearchParams(search);
    if (params.has("identifier")) {
      window.history.replaceState(null, "", origin + pathname);
    }
  }
})();

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GreenhouseProvider>
      <App />
    </GreenhouseProvider>
  </BrowserRouter>
);
