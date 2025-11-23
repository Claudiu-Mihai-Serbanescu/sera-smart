import React, { useEffect, useMemo, useState } from "react";
import "./NotificationsTile.css";
import { notificationsStore } from "../lib/notificationsStore";

export default function NotificationsTile() {
  const [notifications, setNotifications] = useState([]);

  // se abonează la store
  useEffect(() => {
    // nu seed-uim aici; Setările au deja seedIfEmpty,
    // dar e safe să o faci și aici dacă vrei:
    // notificationsStore.seedIfEmpty(SEED);
    const unsubscribe = notificationsStore.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const activeCount = useMemo(() => notifications.filter((n) => n.status === "activ").length, [notifications]);

  const handleMarkAsDone = (id) => notificationsStore.update(id, { status: "realizat" });
  const handlePostpone = (id) => notificationsStore.update(id, { status: "amanat" });
  const handleCancel = (id) => notificationsStore.remove(id);

  return (
    <div className="home-notif-container service-item position-relative w-100 p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0 text-start">
          <i className="bi bi-bell-fill me-2 text-success"></i>
          Notificări
        </h3>
        <span className="badge rounded-pill bg-success fw-bold">{activeCount}</span>
      </div>

      <div className="home-notif-list">
        {activeCount === 0 ? (
          <div className="text-center text-muted py-3">Nu există notificări active.</div>
        ) : (
          notifications
            .filter((n) => n.status === "activ")
            .map((notif) => (
              <div key={notif.id} className={`home-notif-card ${notif.type}`}>
                <div className="home-notif-top">
                  <span className="home-sera-badge">
                    <i className="bi bi-house-door me-1"></i>
                    {notif.sera}
                  </span>
                </div>
                <div className="home-notif-message">{notif.message}</div>
                <div className="home-notif-actions">
                  <button onClick={() => handleMarkAsDone(notif.id)} className="home-notif-btn ok">
                    Realizat
                  </button>
                  <button onClick={() => handlePostpone(notif.id)} className="home-notif-btn postpone">
                    Amanat
                  </button>
                  <button onClick={() => handleCancel(notif.id)} className="home-notif-btn cancel">
                    Anulat
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
