// src/pages/Setari.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Form, Button, Spinner, Alert } from "react-bootstrap";
import "../components/setari/Setari.css";

import {
  SetariHeaderAndTabs,
  SectionPersonal,
  SectionContract,
  SectionFarm,
  SectionNotifications,
  SectionSystem,
  ModalPassword,
  ModalExtend,
  apiFetch,
  unwrap,
  pickAny,
} from "../components/setari";

export default function Setari() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [saveOk, setSaveOk] = useState(false);
  const [activeSection, setActiveSection] = useState("notifications");

  // parole
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  // prelungire
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendMonths, setExtendMonths] = useState(12);
  const [extSaving, setExtSaving] = useState(false);

  // user
  const [me, setMe] = useState({
    user_id: null,
    nume: "",
    telefon: "",
    email: "",
    adresa: "",
    role: "user",
  });

  // setări
  const [formData, setFormData] = useState({
    tipAbonament: "Basic",
    dataContract: "",
    dataExpirare: "",
    numarContract: "",
    numeFerma: "",
    cui: "",
    suprafataTotala: "",
    numarSere: "",
    notificariEmail: true,
    notificariSMS: false,
    notificariPush: false,
    alerteTemperatura: true,
    alerteUmiditate: true,
    alerteVent: true,
    limba: "ro",
    unitatiMasura: "metric",
    fusOrar: "Europe/Bucharest",
    intervalActualizare: "30",
  });

  const [boards, setBoards] = useState([]);

  const isAdmin = me.role === "admin";

  const daysLeft = useMemo(() => {
    if (!formData.dataExpirare) return null;
    const expiry = new Date(formData.dataExpirare);
    const today = new Date();
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  }, [formData.dataExpirare]);

  const extendPreviewDate = useMemo(() => {
    if (!formData.dataExpirare) return "";
    const d = new Date(formData.dataExpirare);
    if (Number.isNaN(d.getTime())) return "";
    const copy = new Date(d);
    copy.setMonth(copy.getMonth() + Number(extendMonths || 0));
    return copy.toISOString().slice(0, 10);
  }, [formData.dataExpirare, extendMonths]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const [meRaw, settingsRaw, boardsRaw] = await Promise.all([apiFetch("/api/me/index.php"), apiFetch("/api/user-settings/index.php"), apiFetch("/api/boards/index.php")]);
        if (!alive) return;

        const meObj = unwrap(meRaw);
        const setObj = unwrap(settingsRaw);
        const boardsArr = Array.isArray(unwrap(boardsRaw)) ? unwrap(boardsRaw) : unwrap(boardsRaw)?.items || [];

        // !!! dacă serverul întoarce { ok:true, data:{ user:{...} } }
        // unwrap() îți dă { user:{...} }, deci accesezi direct user.*:
        const user = meObj.user ?? meObj; // fallback
        const nextMe = {
          user_id: pickAny(user, ["user_id", "id", "uid"], null),
          nume: pickAny(user, ["nume", "name", "full_name"], ""),
          telefon: pickAny(user, ["telefon", "phone", "phone_number"], ""),
          email: pickAny(user, ["email"], ""),
          adresa: pickAny(user, ["adresa", "address"], ""),
          role: pickAny(user, ["role", "rol"], "user"),
        };
        setMe(nextMe);

        const toBool = (v, def = false) => {
          if (v === true || v === 1 || v === "1" || v === "true") return true;
          if (v === false || v === 0 || v === "0" || v === "false") return false;
          return def;
        };

        setFormData((prev) => ({
          ...prev,
          tipAbonament: pickAny(setObj, ["tipAbonament", "plan", "subscription"], "Basic"),
          dataContract: pickAny(setObj, ["dataContract", "contract_date"], "") || "",
          dataExpirare: pickAny(setObj, ["dataExpirare", "expires_at"], "") || "",
          numarContract: pickAny(setObj, ["numarContract", "contract_no"], ""),
          numeFerma: pickAny(setObj, ["numeFerma", "farmName", "company"], ""),
          cui: pickAny(setObj, ["cui", "cif", "vat"], ""),
          suprafataTotala: String(pickAny(setObj, ["suprafataTotala", "area_total"], "")),
          numarSere: String(pickAny(setObj, ["numarSere", "greenhouse_count"], "")),
          notificariEmail: toBool(pickAny(setObj, ["notificariEmail", "notify_email"], true), true),
          notificariSMS: toBool(pickAny(setObj, ["notificariSMS", "notify_sms"], false), false),
          notificariPush: toBool(pickAny(setObj, ["notificariPush", "notify_push"], false), false),
          alerteTemperatura: toBool(pickAny(setObj, ["alerteTemperatura", "alert_temp"], true), true),
          alerteUmiditate: toBool(pickAny(setObj, ["alerteUmiditate", "alert_humidity"], true), true),
          alerteVent: toBool(pickAny(setObj, ["alerteVent", "alert_wind"], true), true),
          limba: pickAny(setObj, ["limba", "lang", "language"], "ro"),
          unitatiMasura: pickAny(setObj, ["unitatiMasura", "units"], "metric"),
          fusOrar: pickAny(setObj, ["fusOrar", "timezone"], "Europe/Bucharest"),
          intervalActualizare: String(pickAny(setObj, ["intervalActualizare", "refresh_interval_sec"], "30")),
        }));

        setBoards(
          (boardsArr || []).map((b) => ({
            ...b,
            board_id: b.board_id ?? b.id ?? b.identifier ?? b.boardId ?? "",
          }))
        );
      } catch (e) {
        setErr(e.message || "Nu s-au putut încărca setările.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // când vine me.email, pune-l în forgotEmail
  useEffect(() => {
    if (me?.email) setForgotEmail(me.email);
  }, [me?.email]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleMeChange = (e) => {
    const { name, value } = e.target;
    setMe((prev) => ({ ...prev, [name]: value }));
  };
  async function handleForgotPassword() {
    const email = (forgotEmail || "").trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      setPwdMessage({
        type: "danger",
        text: "Te rog introdu o adresă de email validă.",
      });
      return;
    }
    try {
      setSendingReset(true);
      const resp = await apiFetch("/api/me/request_reset.php", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const msg = (resp && typeof resp === "object" && (resp.message || resp.status)) || "Dacă emailul există în sistem, vei primi curând instrucțiunile.";
      setPwdMessage({ type: "success", text: String(msg) });
    } catch (e) {
      setPwdMessage({
        type: "danger",
        text: e.message || "Nu am putut iniția resetarea parolei.",
      });
    } finally {
      setSendingReset(false);
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveOk(false);
    setErr("");
    try {
      await apiFetch("/api/me/index.php", {
        method: "PUT",
        body: JSON.stringify({
          nume: me.nume,
          telefon: me.telefon,
          email: me.email,
          adresa: me.adresa,
        }),
      });
      await apiFetch("/api/user-settings/index.php", {
        method: "PUT",
        body: JSON.stringify({
          tipAbonament: formData.tipAbonament,
          dataContract: formData.dataContract || null,
          dataExpirare: formData.dataExpirare || null,
          numarContract: formData.numarContract || null,
          numeFerma: formData.numeFerma || null,
          cui: formData.cui || null,
          suprafataTotala: formData.suprafataTotala ? Number(formData.suprafataTotala) : null,
          numarSere: formData.numarSere ? Number(formData.numarSere) : null,
          notificariEmail: !!formData.notificariEmail,
          notificariSMS: !!formData.notificariSMS,
          notificariPush: !!formData.notificariPush,
          alerteTemperatura: !!formData.alerteTemperatura,
          alerteUmiditate: !!formData.alerteUmiditate,
          alerteVent: !!formData.alerteVent,
          limba: formData.limba,
          unitatiMasura: formData.unitatiMasura,
          fusOrar: formData.fusOrar,
          intervalActualizare: formData.intervalActualizare ? Number(formData.intervalActualizare) : 30,
        }),
      });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch (e2) {
      setErr(e2.message || "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  }

  // parole
  function onPasswordInputChange(e) {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePasswordSubmit(e) {
    if (e) e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      return setPwdMessage({
        type: "danger",
        text: "Completează toate câmpurile.",
      });
    }
    if (passwordData.newPassword.length < 8) {
      return setPwdMessage({
        type: "danger",
        text: "Parola nouă trebuie să aibă minim 8 caractere.",
      });
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPwdMessage({
        type: "danger",
        text: "Parola nouă și confirmarea nu coincid.",
      });
    }

    try {
      setSavingPwd(true);
      setPwdMessage(null);
      const resp = await apiFetch("/api/me/password.php", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      setPwdMessage({
        type: "success",
        text: resp?.message || "Parola a fost schimbată.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdMessage(null);
      }, 1200);
    } catch (e2) {
      setPwdMessage({
        type: "danger",
        text: e2.message || "Eroare la schimbarea parolei.",
      });
    } finally {
      setSavingPwd(false);
    }
  }

  // prelungire
  async function handleExtendContract() {
    try {
      setExtSaving(true);
      await apiFetch("/api/user-settings/index.php", {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          dataExpirare: extendPreviewDate, // noua dată calculată
        }),
      });
      setFormData((prev) => ({ ...prev, dataExpirare: extendPreviewDate }));
      setShowExtendModal(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } catch (e) {
      alert(e.message || "Nu am putut prelungi contractul.");
    } finally {
      setExtSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="section setari-container">
        <div className="container-fluid d-flex align-items-center gap-2">
          <Spinner size="sm" /> Încarc setările…
        </div>
      </section>
    );
  }

  return (
    <section className="section setari-container">
      <div className="container-fluid">
        <SetariHeaderAndTabs
          role={me.role}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          AlertComp={Alert}
          err={
            err && (
              <Alert variant="danger" className="mb-3">
                <i className="bi bi-exclamation-triangle me-2" />
                {err}
              </Alert>
            )
          }
          saveOk={
            saveOk && (
              <Alert variant="success" className="mb-3">
                <i className="bi bi-check-circle me-2" />
                Modificările au fost salvate cu succes.
              </Alert>
            )
          }
        />

        <Form onSubmit={handleSubmit}>
          {activeSection === "personal" && (
            <div className="two-col-wrap two-col-personal">
              <SectionPersonal
                me={me}
                onMeChange={handleMeChange}
                openPasswordModal={() => {
                  setForgotEmail(me.email || "");
                  setShowPasswordModal(true);
                }}
              />
            </div>
          )}

          {activeSection === "contract" && (
            <div className="two-col-wrap two-col-contract">
              <SectionContract formData={formData} onChange={handleInputChange} isAdmin={isAdmin} daysLeft={daysLeft} openExtendModal={() => setShowExtendModal(true)} />
            </div>
          )}

          {activeSection === "farm" && (
            <div className="two-col-wrap two-col-farm">
              <SectionFarm formData={formData} onChange={handleInputChange} />
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="two-col-notif">
              <SectionNotifications formData={formData} onChange={handleInputChange} />
            </div>
          )}

          {activeSection === "system" && (
            <div className="two-col-wrap two-col-system">
              <SectionSystem formData={formData} onChange={handleInputChange} boards={boards} />
            </div>
          )}

          <div className="form-actions">
            <Button variant="success" type="submit" size="lg" disabled={saving}>
              {saving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Se salvează…
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>Salvează Modificările
                </>
              )}
            </Button>
            <Button variant="outline-secondary" size="lg" type="button" className="ms-2" onClick={() => window.location.reload()}>
              <i className="bi bi-x-lg me-2"></i>
              Anulează
            </Button>
          </div>
        </Form>

        <ModalPassword
          show={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          data={passwordData}
          onInputChange={onPasswordInputChange}
          saving={savingPwd}
          message={pwdMessage}
          forgotEmail={forgotEmail}
          onForgotEmailChange={setForgotEmail}
          onForgotSubmit={handleForgotPassword}
          sendingReset={sendingReset}
        />

        <ModalExtend
          show={showExtendModal}
          onClose={() => setShowExtendModal(false)}
          months={extendMonths}
          setMonths={setExtendMonths}
          currentExpiry={formData.dataExpirare}
          previewDate={extendPreviewDate}
          onConfirm={handleExtendContract}
          saving={extSaving}
        />
      </div>
    </section>
  );
}
