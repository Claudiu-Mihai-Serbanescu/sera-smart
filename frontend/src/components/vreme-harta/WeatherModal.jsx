// src/pages/vreme-harta/WeatherModal.jsx
import { useEffect, useRef, useState } from "react";
import { Modal, Tabs, Tab } from "react-bootstrap";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { geocodeCity } from "./meteo";

function SearchCity({ onChangeLocation }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const doSearch = async () => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      setErr("");
      const loc = await geocodeCity(q.trim());
      onChangeLocation?.(loc);
    } catch {
      setErr("Oraș negăsit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex gap-2 align-items-stretch">
      <input
        className="form-control"
        placeholder="Caută oraș (ex: Cluj-Napoca)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && doSearch()}
      />
      <button className="btn btn-primary" onClick={doSearch} disabled={loading}>
        {loading ? "Caut..." : "Setează"}
      </button>
      {err && (
        <div className="text-danger small ms-2 align-self-center">{err}</div>
      )}
    </div>
  );
}

function MapPicker({ onChangeLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [picked, setPicked] = useState(null);

  const loadLeaflet = () =>
    new Promise((resolve) => {
      if (window.L) return resolve();
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);

      const js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      js.onload = resolve;
      document.body.appendChild(js);
    });

  async function reverseGeocodeSafe(lat, lon) {
    try {
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=ro&format=json`
      );
      if (r.ok) {
        const d = await r.json();
        const x = d?.results?.[0];
        if (x) {
          return {
            lat,
            lon,
            oras: {
              nume: x.name,
              tara: x.country,
              judet: x.admin1,
              codPostal: x.postcodes?.[0] ?? "—",
            },
          };
        }
      }
    } catch (_) {}

    // fallback Nominatim
    const r2 = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=ro`
    );
    const d2 = await r2.json();
    const a = d2?.address || {};
    const name =
      a.city ||
      a.town ||
      a.village ||
      d2?.display_name?.split(",")[0] ||
      `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    return {
      lat,
      lon,
      oras: {
        nume: name,
        tara: a.country || "",
        judet: a.state || a.county || "",
        codPostal: a.postcode || "—",
      },
    };
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadLeaflet();
      if (cancelled || !containerRef.current) return;

      const L = window.L;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [46.7712, 23.6236],
          zoom: 11,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);

        mapRef.current.on("click", (e) => {
          const { latlng } = e;
          if (!markerRef.current) {
            markerRef.current = L.marker(latlng, { draggable: true }).addTo(
              mapRef.current
            );
            markerRef.current.on("dragend", (ev) => {
              const p = ev.target.getLatLng();
              setPicked([p.lat, p.lng]);
            });
          } else {
            markerRef.current.setLatLng(latlng);
          }
          setPicked([latlng.lat, latlng.lng]);
        });
      }
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const confirm = async () => {
    if (!picked) return;
    const [lat, lon] = picked;
    const loc = await reverseGeocodeSafe(lat, lon);
    onChangeLocation?.(loc);
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 320,
          borderRadius: 8,
          overflow: "hidden",
          background: "#eef2f4",
        }}
      />
      <div className="d-flex justify-content-between mt-2">
        <div className="text-muted small">
          {picked
            ? `Selectat: ${picked[0].toFixed(4)}, ${picked[1].toFixed(4)}`
            : "Atinge harta pentru a plasa un marker (poți trage de el)."}
        </div>
        <button
          className="btn btn-primary"
          onClick={confirm}
          disabled={!picked}
        >
          Confirmă locația
        </button>
      </div>
    </>
  );
}

export default function WeatherModal({
  show,
  onHide,
  oras,
  current,
  daily,
  hourly,
  onChangeLocation,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tab, setTab] = useState("search");

  const hourlyChartData = hourly.map((h) => ({
    time: h.time,
    Temp: h.temp,
    Umiditate: h.hum,
    Vant: h.wind,
    Presiune: h.press,
  }));
  const dailyChartData = daily.map((d) => ({
    zi: d.zi,
    Max: d.tMax,
    Min: d.tMin,
  }));

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Vremea – {oras}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {current && (
          <div className="d-flex justify-content-between align-items-start flex-wrap mb-3">
            <div className="d-flex align-items-center gap-3">
              <div style={{ fontSize: 48, lineHeight: "48px" }}>
                {current.icon}
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 600 }}>
                  {current.temp}°C
                </div>
                <small className="text-muted">acum</small>
              </div>
            </div>
            <div className="text-end small">
              <div>
                Presiune: <strong>{current.press}</strong> hPa
              </div>
              <div>
                Umiditate: <strong>{current.hum}%</strong>
              </div>
              <div>
                Vânt: <strong>{current.wind.toFixed(1)} km/h</strong>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3">
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowPicker((s) => !s)}
          >
            {showPicker ? "Ascunde selector locație" : "Schimbă locația"}
          </button>

          {showPicker && (
            <div className="mt-3">
              <div className="btn-group mb-2">
                <button
                  className={`btn btn-sm ${
                    tab === "search" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  onClick={() => setTab("search")}
                >
                  Caută oraș
                </button>
                <button
                  className={`btn btn-sm ${
                    tab === "map" ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  onClick={() => setTab("map")}
                >
                  Alege pe hartă
                </button>
              </div>

              {tab === "search" ? (
                <SearchCity onChangeLocation={onChangeLocation} />
              ) : (
                <MapPicker key="map" onChangeLocation={onChangeLocation} />
              )}
            </div>
          )}
        </div>

        <Tabs defaultActiveKey="daily" className="mb-3">
          <Tab eventKey="daily" title="Pe zile">
            <div className="d-flex flex-wrap gap-3 mb-4">
              {daily.map((d, i) => (
                <div
                  key={i}
                  className="border rounded p-3 text-center"
                  style={{ width: 90 }}
                >
                  <div className="small fw-semibold">{d.zi}</div>
                  <div style={{ fontSize: 30, lineHeight: "30px" }}>
                    {d.icon}
                  </div>
                  <div className="fw-bold">{d.tMax}°</div>
                  <div className="text-muted">{d.tMin}°</div>
                </div>
              ))}
            </div>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zi" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Max" fill="#8884d8" />
                  <Bar dataKey="Min" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Tab>

          <Tab eventKey="hourly" title="Pe ore">
            <div className="d-flex flex-wrap gap-3 mb-4">
              {hourly.map((h, i) => (
                <div
                  key={i}
                  className="border rounded p-2 text-center"
                  style={{ width: 80 }}
                >
                  <div className="small">{h.time}</div>
                  <div style={{ fontSize: 26, lineHeight: "26px" }}>
                    {h.icon}
                  </div>
                  <div className="fw-semibold">{h.temp}°C</div>
                  <div className="small text-muted">{h.hum}%</div>
                </div>
              ))}
            </div>

            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart
                  data={hourly.map((h) => ({
                    time: h.time,
                    Temp: h.temp,
                    Umiditate: h.hum,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="Temp"
                    yAxisId="left"
                    stroke="#8884d8"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Umiditate"
                    yAxisId="right"
                    stroke="#82ca9d"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Tab>
        </Tabs>

        <div className="small text-center mt-3 text-muted">
          Weather data by Open-Meteo
        </div>
      </Modal.Body>
    </Modal>
  );
}
