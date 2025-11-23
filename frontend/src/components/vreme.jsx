import { useEffect, useMemo, useState } from "react";
import "./vreme-harta/vreme.css";
import { getSereData } from "./vreme-harta/data";
import { geocodeCity, fetchWeather } from "./vreme-harta/meteo";
import WeatherToolbar from "./vreme-harta/WeatherToolbar";
import SereMap from "./vreme-harta/SereMap";
import WeatherModal from "./vreme-harta/WeatherModal";
import { useGreenhouse } from "../components/GreenhouseContext";

export default function Vreme() {
  const { selected, selectById } = useGreenhouse();

  const [sereData, setSereData] = useState([]);
  const [oras, setOras] = useState("Cluj-Napoca");
  const [locatie, setLocatie] = useState({
    lat: 46.7712,
    lon: 23.6236,
    oras: { nume: "Cluj-Napoca", tara: "România", judet: "Cluj", codPostal: "—" },
  });
  const [daily, setDaily] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingVreme, setLoadingVreme] = useState(true);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [locationOverride, setLocationOverride] = useState(null);

  // inițializare sere + selecție implicită
  useEffect(() => {
    const d = getSereData();
    setSereData(d);
    if (!selected && d.length) selectById?.(d[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // obiectl complet pentru sera selectată (după ID)
  const selectedSera = useMemo(() => (selected ? sereData.find((s) => s.id === selected.id) ?? null : null), [selected, sereData]);

  // meteo
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoadingVreme(true);
        const loc = locationOverride
          ? {
              lat: locationOverride.lat,
              lon: locationOverride.lon,
              oras: { nume: locationOverride.label ?? oras, tara: "", judet: "", codPostal: "—" },
            }
          : await geocodeCity(oras);
        if (abort) return;
        setLocatie(loc);
        const w = await fetchWeather(loc.lat, loc.lon);
        if (abort) return;
        setDaily(w.daily);
        setHourly(w.hourly);
        setCurrent(w.current);
      } finally {
        if (!abort) setLoadingVreme(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [oras, locationOverride]);

  const handleChangeLocation = (loc) => {
    setLocationOverride({ lat: loc.lat, lon: loc.lon, label: loc.oras.nume });
    setOras(loc.oras.nume);
    setShowWeatherModal(false);
  };

  const tempNow = current?.temp ?? hourly?.[0]?.temp ?? null;
  const iconNow = current?.icon ?? hourly?.[0]?.icon ?? "ℹ️";

  return (
    <>
      <div className="weather-card">
        <WeatherToolbar
          sereData={sereData}
          selectedSera={selectedSera}
          onUpdateSera={(idSauNume) => {
            // din picker poți primi id sau nume; alege ID-ul din listă și setează-l
            const found = sereData.find((s) => s.id === idSauNume || s.nume === idSauNume);
            if (found) selectById?.(found.id);
          }}
          locatie={locatie}
          loadingVreme={loadingVreme}
          daily={daily}
          hourly={hourly}
          current={current}
          tempNow={tempNow}
          iconNow={iconNow}
          onShowModal={() => setShowWeatherModal(true)}
        />

        <div className="weather-map">
          <SereMap
            sereData={sereData}
            selectedSeraId={selected?.id}
            onSelect={(id) => selectById?.(id)} // click pe hartă ⇒ select global
          />
        </div>
      </div>

      <WeatherModal
        show={showWeatherModal}
        onHide={() => setShowWeatherModal(false)}
        oras={locatie.oras.nume}
        current={current}
        daily={daily}
        hourly={hourly}
        onChangeLocation={handleChangeLocation}
      />
    </>
  );
}
