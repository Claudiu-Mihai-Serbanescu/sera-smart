// src/components/menu.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Menu() {
  const { pathname } = useLocation();

  const [notifCount, setNotifCount] = useState(() => {
    const v = Number(localStorage.getItem("notif.count"));
    return Number.isFinite(v) ? v : 0;
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "notif.count") {
        const v = Number(e.newValue);
        setNotifCount(Number.isFinite(v) ? v : 0);
      }
    };
    const onCustom = (e) => setNotifCount(Number(e.detail) || 0);

    window.addEventListener("storage", onStorage);
    window.addEventListener("notif-count", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("notif-count", onCustom);
    };
  }, []);

  const isActive = (to) => {
    if (to === "/app") {
      return pathname === "/app"; // doar exact dashboard
    }
    return pathname === to || pathname.startsWith(to + "/");
  };

  const renderItem = (item) => {
    const active = isActive(item.to);
    const showBadge = item.to === "/app/settings" && notifCount > 0;

    return (
      <Link key={item.to} to={item.to} className={`menu-item${active ? " active" : ""}${showBadge ? " has-badge" : ""}`} aria-label={item.label} title={item.label}>
        {item.imgSrc ? (
          <img src={item.imgSrc} alt={item.label} className="menu-icon-img" style={{ width: 42, height: 42, objectFit: "contain" }} />
        ) : (
          <i className={`bi ${item.iconClass}`} />
        )}

        {showBadge && <span className="menu-badge">{notifCount}</span>}
      </Link>
    );
  };

  const mainItems = [
    { to: "/app", iconClass: "bi-house", label: "Acasă / Dashboard" },
    { to: "/app/statistici", iconClass: "bi-sliders2-vertical", label: "Statistici / Automatizări" },
    { to: "/app/harta-serelor", iconClass: "bi-map", label: "Harta Serelor" },
    { to: "/app/agromi", imgSrc: "/assets/img/agromi-logo.png", label: "Agromi" },
  ];

  const profileItems = [{ to: "/app/settings", iconClass: "bi-gear", label: "Setări" }];

  return (
    <>
      {/* Sidebar desktop/tablet */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/app" aria-label="Acasă">
            <img src="/assets/img/bytestorm.png" alt="Bytestorm" className="logo" />
          </Link>
        </div>
        <nav className="sidebar-nav">{mainItems.map(renderItem)}</nav>
        <div className="sidebar-footer">{profileItems.map(renderItem)}</div>
      </aside>

      {/* Header mobil */}
      <header className="mobile-header">
        <Link to="/app" aria-label="Acasă">
          <img src="/assets/img/bytestorm.png" alt="Bytestorm" className="logo" />
        </Link>
        <div className="mobile-header-actions">{profileItems.map(renderItem)}</div>
      </header>

      {/* Bottom nav mobil */}
      <nav className="mobile-bottom-nav">{mainItems.map(renderItem)}</nav>
    </>
  );
}
