// src/pages/Notificari.jsx
import React, { useState, useEffect } from "react";
import { Dropdown, ButtonGroup, Button } from "react-bootstrap";
import "./Notificari.css"; // Import CSS separat

// Funcție ajutătoare pentru a genera un ID unic pentru notificări
let nextNotificationId = 0;

export default function Notificari() {
  const [selectedSera, setSelectedSera] = useState("Sera Spanac");
  const seraOptions = ["Sera Spanac", "Sera Roșii", "Sera Castraveți"];

  const [notifications, setNotifications] = useState([
    {
      id: nextNotificationId++,
      message: "Temperatura va crește la 30 grade în următoarele zile.",
      type: "warning",
      status: "activ",
    },
    {
      id: nextNotificationId++,
      message: "În 5 zile se anunță precipitații de 2L/mp.",
      type: "info",
      status: "activ",
    },
    {
      id: nextNotificationId++,
      message: "Umiditatea solului a depășit 80%.",
      type: "urgent",
      status: "activ",
    },
    {
      id: nextNotificationId++,
      message: "Recoltarea spanacului se face în 8 zile.",
      type: "success",
      status: "activ",
    },
    {
      id: nextNotificationId++,
      message: "Verifică nivelul de nutrienți din rezervor.",
      type: "info",
      status: "activ",
    },
  ]);

  const activeNotificationCount = notifications.filter(
    (n) => n.status === "activ"
  ).length;

  useEffect(() => {
    // fetch('/api/notifications')...
  }, []);

  const handleMarkAsDone = (id) =>
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, status: "realizat" } : n))
    );
  const handlePostpone = (id) =>
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, status: "amanat" } : n))
    );
  const handleCancel = (id) =>
    setNotifications(notifications.filter((n) => n.id !== id));

  return (
    <div className="notifications-page-container">
      <div className="page-header">
        <Dropdown as={ButtonGroup}>
          <Button variant="success" className="rounded-start-pill">
            {selectedSera}
          </Button>
          <Dropdown.Toggle split variant="dark" className="rounded-end-pill" />
          <Dropdown.Menu>
            {seraOptions.map((sera) => (
              <Dropdown.Item key={sera} onClick={() => setSelectedSera(sera)}>
                {sera}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <button type="button" className="header-notification-button">
          <span className="header-notification-badge">
            <i className="bi bi-bell-fill"></i>
          </span>
          {activeNotificationCount} Notificări noi
        </button>
      </div>

      <h2 className="notifications-title">Toate Notificările</h2>

      <div className="notifications-grid-container">
        {activeNotificationCount === 0 ? (
          <p className="no-notifications-message">
            Nu există notificări active în acest moment.
          </p>
        ) : (
          notifications
            .filter((n) => n.status === "activ")
            .map((notif) => (
              <div
                key={notif.id}
                className={`notification-card ${notif.status} ${notif.type}`}
              >
                <div className="notification-message">{notif.message}</div>
                <div className="notification-actions">
                  <button
                    onClick={() => handleMarkAsDone(notif.id)}
                    className="notification-actionButton button-realizat"
                    disabled={notif.status === "realizat"}
                  >
                    Realizat
                  </button>
                  <button
                    onClick={() => handlePostpone(notif.id)}
                    className="notification-actionButton button-amanat"
                    disabled={notif.status === "amanat"}
                  >
                    Amanat
                  </button>
                  <button
                    onClick={() => handleCancel(notif.id)}
                    className="notification-actionButton button-anulat"
                  >
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
