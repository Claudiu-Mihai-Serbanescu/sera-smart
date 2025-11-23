// src/components/GreenhouseContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GREENHOUSES, DEFAULT_GH_ID, findById as strictFindById } from "../lib/greenhouses";

const Ctx = createContext(null);

// normalizare tolerantă (diacritice/case/whitespace)
const norm = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const findByIdLoose = (id) => strictFindById(id) || GREENHOUSES.find((g) => norm(g.id) === norm(id)) || null;
const findByNameLoose = (name) => GREENHOUSES.find((g) => norm(g.name) === norm(name)) || null;

export function GreenhouseProvider({ children, initialId }) {
  const LS_KEY = "gh.selected";

  const [selectedId, setSelectedId] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) || initialId || DEFAULT_GH_ID;
    } catch {
      return initialId || DEFAULT_GH_ID;
    }
  });

  // dacă id-ul nu există (ai schimbat lista), revino la default
  useEffect(() => {
    if (!strictFindById(selectedId)) setSelectedId(DEFAULT_GH_ID);
  }, [selectedId]);

  // persistă selecția
  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(LS_KEY, selectedId);
    } catch {}
  }, [selectedId]);

  const selected = useMemo(() => strictFindById(selectedId), [selectedId]);

  // ——— API curat pentru selecție globală ———
  const selectById = (id) => {
    const hit = findByIdLoose(id);
    if (hit) setSelectedId(hit.id);
  };

  const selectByName = (name) => {
    const hit = findByNameLoose(name);
    if (hit) setSelectedId(hit.id);
  };

  // primește id SAU nume, decide singur
  const selectSmart = (val) => {
    if (!val) return;
    const byId = findByIdLoose(val);
    if (byId) return setSelectedId(byId.id);
    const byName = findByNameLoose(val);
    if (byName) return setSelectedId(byName.id);
  };

  const value = useMemo(
    () => ({
      list: GREENHOUSES,
      selectedId,
      selected,
      boardId: selected?.boardId || null,
      name: selected?.name || "",
      // setters
      setSelectedId,
      selectById,
      selectByName,
      selectSmart,
    }),
    [selectedId, selected]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useGreenhouse = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGreenhouse trebuie folosit în <GreenhouseProvider>.");
  return ctx;
};
