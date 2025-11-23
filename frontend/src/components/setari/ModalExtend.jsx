// src/components/setari/ModalExtend.jsx
import React from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";

export default function ModalExtend({
  show,
  onClose,
  months,
  setMonths,
  currentExpiry,
  previewDate,
  onConfirm,
  saving,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Prelungește contractul</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Luni de prelungire</Form.Label>
            <Form.Select
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            >
              <option value="1">1 lună</option>
              <option value="3">3 luni</option>
              <option value="6">6 luni</option>
              <option value="12">12 luni</option>
              <option value="24">24 luni</option>
            </Form.Select>
          </Form.Group>
          <div className="small text-muted">
            Data curentă de expirare: <strong>{currentExpiry || "—"}</strong>
            {previewDate && (
              <>
                <br />
                Noua dată (estimare): <strong>{previewDate}</strong>
              </>
            )}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Anulează
        </Button>
        <Button variant="success" onClick={onConfirm} disabled={saving}>
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" /> Se procesează…
            </>
          ) : (
            <>Confirmă prelungirea</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
