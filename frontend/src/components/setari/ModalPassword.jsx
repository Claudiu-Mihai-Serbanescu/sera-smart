// src/components/setari/ModalPassword.jsx
import React from "react";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";

export default function ModalPassword({
  show,
  onClose,
  onSubmit,
  data,
  onInputChange,
  saving,
  message,
  // NOU:
  forgotEmail,
  onForgotEmailChange,
  onForgotSubmit,
  sendingReset,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Schimbă Parola</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Parola Curentă</Form.Label>
            <Form.Control
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              value={data.currentPassword}
              onChange={onInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Parola Nouă</Form.Label>
            <Form.Control
              type="password"
              name="newPassword"
              autoComplete="new-password"
              value={data.newPassword}
              onChange={onInputChange}
              minLength={8}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirmă Parola Nouă</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={data.confirmPassword}
              onChange={onInputChange}
              minLength={8}
            />
          </Form.Group>

          {message && (
            <Alert variant={message.type} className="mb-3">
              {message.text}
            </Alert>
          )}

          {/* —— Zona "Ai uitat parola?" —— */}
          <div className="p-2 border rounded">
            <div className="small text-muted mb-2">
              Ai uitat parola? Trimite-ți un link de resetare pe email.
            </div>
            <div className="d-flex gap-2">
              <Form.Control
                type="email"
                placeholder="adresa@exemplu.ro"
                value={forgotEmail}
                onChange={(e) => onForgotEmailChange(e.target.value)}
              />
              <Button
                variant="link"
                className="text-decoration-underline"
                type="button"
                onClick={onForgotSubmit}
                disabled={sendingReset}
              >
                {sendingReset ? "Se trimite…" : "Trimite link de resetare"}
              </Button>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Anulează
          </Button>
          <Button variant="success" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" /> Se salvează…
              </>
            ) : (
              "Schimbă Parola"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
