// src/components/setari/SectionContract.jsx
import React from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";

export default function SectionContract({ formData, onChange, isAdmin, daysLeft, openExtendModal }) {
  return (
    <Card className="settings-card">
      <Card.Body>
        <h3 className="section-title mb-4">
          <i className="bi bi-clipboard-check me-2"></i> Detalii Contract
        </h3>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Număr Contract</Form.Label>
              <Form.Control name="numarContract" value={formData.numarContract} onChange={onChange} className="custom-input" disabled={!isAdmin} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Tip Abonament</Form.Label>
              <Form.Select name="tipAbonament" value={formData.tipAbonament} onChange={onChange} className="custom-input" disabled={!isAdmin}>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Data Semnare Contract</Form.Label>
              <Form.Control
                type="date"
                name="dataContract"
                value={formData.dataContract || ""}
                onChange={onChange}
                className="custom-input"
                disabled={!isAdmin}
                readOnly={!isAdmin}
                tabIndex={!isAdmin ? -1 : undefined}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Data Expirare</Form.Label>
              <Form.Control
                type="date"
                name="dataExpirare"
                value={formData.dataExpirare || ""}
                onChange={onChange}
                className="custom-input"
                disabled={!isAdmin}
                readOnly={!isAdmin}
                tabIndex={!isAdmin ? -1 : undefined}
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="contract-status-box flex-grow-1">
            <div className="status-item">
              <span className="status-label">Status Contract:</span>
              <span className="badge bg-success">Activ</span>
            </div>
            <div className="status-item">
              <span className="status-label">Zile rămase:</span>
              <span className="badge bg-info">{Number.isFinite(daysLeft) ? daysLeft : "—"} zile</span>
            </div>
            <div className="status-item">
              <span className="status-label">Facturare:</span>
              <span className="badge bg-secondary">Lunară</span>
            </div>

            <div className="d-flex justify-content-center">
              <Button variant="primary" onClick={openExtendModal} className="btn-extend-contract">
                <i className="bi bi-arrow-repeat me-2"></i>
                Prelungește contractul
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
