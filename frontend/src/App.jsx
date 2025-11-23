// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Menu from "./components/menu.jsx";
import Home from "./components/MainContent.jsx";
import Statistici from "./pages/Statistici.jsx";
import Harta from "./pages/Harta.jsx";
import Agromi from "./pages/Agromi.jsx";
import Setari from "./pages/Setari.jsx";

function DashboardLayout() {
  return (
    <>
      <Menu />
      <main>
        <Routes>
          <Route index element={<Home />} />
          <Route path="statistici" element={<Statistici />} />
          <Route path="harta-serelor" element={<Harta />} />
          <Route path="agromi" element={<Agromi />} />
          <Route path="settings" element={<Setari />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route path="/app/*" element={<DashboardLayout />} />

      <Route path="/" element={<Navigate to="/pages/homepage.html" replace />} />
    </Routes>
  );
}
