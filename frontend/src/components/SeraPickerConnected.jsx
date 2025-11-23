// src/components/SeraPickerConnected.jsx
import React from "react";
import SeraPicker from "./SeraPicker"; // componenta ta actuală, cu designul păstrat
import { useGreenhouse } from "./GreenhouseContext";

export default function SeraPickerConnected({ fill }) {
  const { list, selectedId, setSelectedId } = useGreenhouse();
  return <SeraPicker options={list} value={selectedId} onChange={setSelectedId} fill={fill} />;
}
