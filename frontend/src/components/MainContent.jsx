// src/components/MainContent.jsx
import React from "react";
import Vreme from "./vreme.jsx";
import Senzori from "./senzori.jsx";
import Sarcini from "./sarcini.jsx";
import Camera from "./camera.jsx";
import NotificationsTile from "./NotificationsTile.jsx";
import "./MainContent.css";
import { useGreenhouse } from "./GreenhouseContext";

export default function MainContent() {
  const { boardId, selected } = useGreenhouse();

  return (
    <main className="dashboard">
      {/* DESKTOP GRID */}
      <div className="grid-desktop">
        <div className="tile tile--weather">
          {/* Vreme va folosi SeraPicker conectat, deci nu mai ai nevoie de callback-uri */}
          <Vreme />
        </div>

        <div className="tile tile--sensors">{boardId && <Senzori boardId={boardId} />}</div>

        <div className="tile tile--camera">
          <Camera boardId={boardId} seraName={selected?.name} />
        </div>

        <div className="tile tile--devices scrollable">
          <NotificationsTile />
        </div>

        <div className="tile tile--tasks scrollable">
          <Sarcini />
        </div>
      </div>

      {/* MOBILE STACK */}
      <div className="grid-mobile">
        <div className="stack">
          <Vreme />
        </div>

        <div className="stack">
          <Camera boardId={boardId} seraName={selected?.name} />
        </div>

        <div className="stack">{boardId && <Senzori boardId={boardId} />}</div>

        <div className="stack">
          <Sarcini />
        </div>

        <div className="stack">
          <NotificationsTile />
        </div>
      </div>
    </main>
  );
}
