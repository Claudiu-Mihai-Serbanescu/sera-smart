// src/components/greenhouse/GreenhouseDesigner.jsx
import React, { useEffect, useMemo } from "react";
import "./greenhouse.css";

import { DEFAULT_CROPS, useLocalStorage, newGreenhouse, calcUsage, uid } from "./gh-shared";

import GreenhouseHeader from "./GreenhouseHeader";
import Canvas from "./Canvas";
import PropertiesPanel from "./PropertiesPanel";
import Legend from "./Legend";

export default function GreenhouseDesigner() {
  const [crops, setCrops] = useLocalStorage("gh-crops", DEFAULT_CROPS);
  const [greenhouses, setGreenhouses] = useLocalStorage("gh-list", [newGreenhouse()]);
  const [selectedId, setSelectedId] = useLocalStorage("gh-selected", greenhouses[0]?.id);

  useEffect(() => {
    if (!greenhouses.find((g) => g.id === selectedId) && greenhouses.length) {
      setSelectedId(greenhouses[0].id);
    }
  }, [greenhouses, selectedId, setSelectedId]);

  const gh = useMemo(() => greenhouses.find((g) => g.id === selectedId), [greenhouses, selectedId]);
  const usage = useMemo(() => calcUsage(gh), [gh]);

  const updateGh = (patch) => setGreenhouses((prev) => prev.map((g) => (g.id === gh.id ? { ...gh, ...patch } : g)));

  // beds
  const addBed = () =>
    updateGh({
      beds: gh.beds.concat({
        id: uid(),
        name: `Strat #${gh.beds.length + 1}`,
        crop: "gol",
        size_m: 1.0,
        path_m: 0.4,
      }),
    });
  const removeBed = (id) => updateGh({ beds: gh.beds.filter((b) => b.id !== id) });
  const setBed = (id, patch) => updateGh({ beds: gh.beds.map((b) => (b.id === id ? { ...b, ...patch } : b)) });

  // crops (legend editabilă)
  const deleteCrop = (key) => {
    if (crops[key]?.locked) return;
    const next = { ...crops };
    delete next[key];
    setCrops(next);
    setGreenhouses((prev) =>
      prev.map((g) => ({
        ...g,
        beds: g.beds.map((b) => (b.crop === key ? { ...b, crop: "gol" } : b)),
      }))
    );
  };
  const addCrop = () => {
    const id = "crop_" + uid();
    setCrops((prev) => ({ ...prev, [id]: { name: "Nouă cultură", color: "#6ee7b7" } }));
  };
  const setCropField = (key, patch) => setCrops((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  // senzori
  const addSensor = (pos) => {
    const created = {
      id: uid(),
      name: `Senzor #${(gh.sensors?.length || 0) + 1}`,
      x_m: pos?.x_m ?? Number((gh.lungime_m / 2).toFixed(2)),
      y_m: pos?.y_m ?? Number((gh.latime_m / 2).toFixed(2)),
    };
    updateGh({ sensors: [...(gh.sensors || []), created] });
    return created.id;
  };
  const setSensor = (id, patch) => updateGh({ sensors: (gh.sensors || []).map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const deleteSensor = (id) => updateGh({ sensors: (gh.sensors || []).filter((s) => s.id !== id) });

  if (!gh) return null;

  return (
    <div className="gh-page">
      <div className="gh-two">
        {/* COL STÂNGA: Header + Properties într-un singur card alb */}
        <div className="gh-col gh-left">
          <section className="card gh-left-card">
            <GreenhouseHeader
              greenhouses={greenhouses}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={() => {
                const created = newGreenhouse();
                setGreenhouses((prev) => [created, ...prev]);
                setSelectedId(created.id);
              }}
              onDelete={(id) => setGreenhouses((prev) => prev.filter((g) => g.id !== id))}
            />
            <PropertiesPanel
              gh={gh}
              usage={usage}
              crops={crops}
              onChange={updateGh}
              addBed={addBed}
              removeBed={removeBed}
              setBed={setBed}
              /* senzori (dacă păstrezi managerul aici) */
              addSensor={addSensor}
              setSensor={setSensor}
              deleteSensor={deleteSensor}
            />
          </section>
        </div>

        {/* COL DREAPTA: Canvas + Legend într-un singur card alb */}
        <div className="gh-col gh-right">
          <section className="card gh-canvas-card">
            <Canvas gh={gh} usage={usage} crops={crops} onUpdate={updateGh} addSensor={addSensor} setSensor={setSensor} deleteSensor={deleteSensor} />
            <Legend crops={crops} addCrop={addCrop} setCropField={setCropField} deleteCrop={deleteCrop} />
          </section>
        </div>
      </div>
    </div>
  );
}
