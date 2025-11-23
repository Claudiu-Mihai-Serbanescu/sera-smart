// src/components/setari/SectionNotifications.jsx
import React, { useEffect, useState } from "react";
import { Card, Spinner, Alert } from "react-bootstrap";
import { apiFetch } from "./api";

export default function SectionNotifications() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [notifications, setNotifications] = useState([]);

  async function load() {
    try {
      setLoading(true);

      const url = "https://serty.ro/backend/api/notifications/index.php";
      console.log("🌍 Fetching:", url);

      const res = await fetch(url, { credentials: "omit" });
      const raw = await res.json();
      console.log("🔵 RAW direct:", raw);

      setNotifications(raw.data || []);
    } catch (e) {
      console.error("Eroare la load notifications:", e);
      setErr(e.message || "Nu s-au putut încărca notificările.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-3">
        <Spinner size="sm" /> Încarc notificările…
      </div>
    );
  }

  if (err) {
    return (
      <Alert variant="danger" className="m-3">
        <i className="bi bi-exclamation-triangle me-2" />
        {err}
      </Alert>
    );
  }

  return (
    <Card className="settings-card">
      <Card.Body>
        {notifications.length === 0 ? (
          <div className="text-center text-muted py-4">
            <i className="bi bi-bell-slash me-2" /> Nu există notificări.
          </div>
        ) : (
          <div className="notif-grid notif-grid--4">
            {notifications.map((notif) => (
              <div key={notif.id} className={`notif-card ${notif.type || ""}`}>
                <div className="notif-top">
                  <span className="sera-badge">
                    <i className="bi bi-house-door" /> {notif.sera || "General"}
                  </span>
                  <small className="text-muted">{notif.created_at || ""}</small>
                </div>
                <div className="notif-message">{notif.message}</div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
