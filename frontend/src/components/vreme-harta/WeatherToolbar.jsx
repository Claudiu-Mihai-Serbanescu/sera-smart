import { useMemo, useEffect } from "react";
import SeraPickerConnected from "../../components/SeraPickerConnected";
import { useGreenhouse } from "../../components/GreenhouseContext";
import useSeraSelection from "../../hooks/useSeraSelection";

function norm(s) {
  if (s == null) return "";
  return String(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function WeatherToolbar({ sereData, selectedSera, onUpdateSera, locatie, loadingVreme, daily, current, tempNow, iconNow, onShowModal }) {
  const { selected, selectById, selectByName } = useGreenhouse();

  const options = useMemo(() => (sereData || []).map((s) => ({ id: s.id ?? s.nume, name: s.nume })), [sereData]);

  const [seraId, setSeraId] = useSeraSelection(options[0]?.id, "gh.selected");

  useEffect(() => {
    const extId = selectedSera?.id ?? selectedSera?.nume;
    if (extId && extId !== seraId) setSeraId(extId);
  }, [selectedSera, seraId, setSeraId]);

  useEffect(() => {
    if (!seraId && options[0]?.id) setSeraId(options[0].id);
  }, [options, seraId, setSeraId]);

  const handlePick = (id) => {
    setSeraId(id);
    selectById?.(id);
    const sObj = (sereData || []).find((s) => (s.id ?? s.nume) === id) || null;
    if (!sObj && selectByName && typeof id === "string") selectByName(id);
    onUpdateSera?.(sObj?.id ?? id); // ⇐ trimitem ID în sus (părintele acceptă id/nume)
  };

  const seraForList = useMemo(() => {
    if (selectedSera) return selectedSera;
    if (selected) {
      return (
        (sereData || []).find((s) => s.id === selected.id) ||
        (sereData || []).find((s) => s.nume === (selected.nume ?? selected.name)) ||
        (sereData || []).find((s) => norm(s.nume) === norm(selected.nume ?? selected.name)) ||
        null
      );
    }
    if (seraId) {
      return (
        (sereData || []).find((s) => s.id === seraId) || (sereData || []).find((s) => s.nume === seraId) || (sereData || []).find((s) => norm(s.nume) === norm(seraId)) || null
      );
    }
    return null;
  }, [selectedSera, selected, seraId, sereData]);

  const dataFormatata = useMemo(() => {
    const azi = new Date();
    const opt = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    const x = azi.toLocaleDateString("ro-RO", opt);
    return x.charAt(0).toUpperCase() + x.slice(1);
  }, []);

  return (
    <div className="weather-info">
      <div className="top-toolbar">
        <div className="left-panel">
          <SeraPickerConnected options={options} value={selected?.id ?? seraId} onChange={handlePick} />

          <div className="info-card strat-panel">
            {seraForList?.straturi?.length ? (
              <ul className="straturi-list">
                {seraForList.straturi.map((st) => (
                  <li className="strat-row" key={st.nume}>
                    <div className="chip-row">
                      <span className="metric-chip">
                        <span className="metric-title">Recoltare {st.nume}</span>
                        <span className="metric-value">
                          <b>{st.zile}</b> zile
                        </span>
                      </span>
                      <span className="metric-chip">
                        <span className="metric-title">Suprafață</span>
                        <span className="metric-value">
                          <b>{st.suprafata}</b> m²
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="muted" style={{ padding: 8 }}>
                Alege o seră pentru detalii de recoltare.
              </div>
            )}
          </div>
        </div>

        {/* Panouri meteo - neschimbate */}
        <div className="toolbar-right toolbar-right--mobile">
          <button type="button" className="weather-cta" onClick={onShowModal} disabled={loadingVreme}>
            <span className="weather-cta__icon">{loadingVreme ? "⏳" : iconNow}</span>
            <span className="weather-cta__label">{loadingVreme ? "Se încarcă…" : `Vreme ${tempNow ?? "—"}°C`}</span>
            <i className="bi bi-arrow-right-short" aria-hidden="true" />
          </button>
          <div className="city-inline">
            <span className="city-label">
              <strong>{locatie.oras.nume} </strong>
              <br />
              <span>{dataFormatata}</span>
            </span>
          </div>
        </div>

        <div className="right-panel">
          <div className="rp-header">
            <div className="rp-title">
              {locatie.oras.nume} – {dataFormatata}
            </div>
          </div>
          <div className="rp-body">
            <div className="rp-left">
              <button type="button" className="weather-cta rp-cta" onClick={onShowModal} disabled={loadingVreme}>
                <span className="weather-cta__icon">{loadingVreme ? "⏳" : iconNow}</span>
                <span className="weather-cta__label">{loadingVreme ? "Se încarcă…" : `Acum ${tempNow ?? "—"}°C`}</span>
                <i className="bi bi-arrow-right-short" aria-hidden="true" />
              </button>
              <div className="rp-forecast">
                {daily.slice(0, 2).map((d, i) => (
                  <div key={i} className="rp-forecast__item">
                    <div className="rp-forecast__day">{d.zi}</div>
                    <div className="rp-forecast__icon">{d.icon}</div>
                    <div className="rp-forecast__temps">
                      <b>{d.tMax}°</b>
                      <span className="muted">{d.tMin}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rp-stats">
              <div className="rp-stat">
                <span>Umiditate</span>
                <b>{current?.hum ?? "—"}%</b>
              </div>
              <div className="rp-stat">
                <span>Vânt</span>
                <b>{current ? current.wind.toFixed(1) : "—"} km/h</b>
              </div>
              <div className="rp-stat">
                <span>Pres</span>
                <b>{current ? current.press.toFixed(1) : "—"} hPa</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
