// src/components/setari/SectionSystem.jsx
import React from "react";
import { Card, Row, Col, Form } from "react-bootstrap";

export default function SectionSystem({ formData, onChange, boards }) {
  return (
    <Card className="settings-card">
      <Card.Body>
        <h3 className="section-title mb-4">
          <i className="bi bi-gear me-2"></i> Setări Sistem
        </h3>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Limbă</Form.Label>
              <Form.Select
                name="limba"
                value={formData.limba}
                onChange={onChange}
                className="custom-input"
              >
                <option value="ro">Română</option>
                <option value="en">English</option>
                <option value="hu">Magyar</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Unități de Măsură</Form.Label>
              <Form.Select
                name="unitatiMasura"
                value={formData.unitatiMasura}
                onChange={onChange}
                className="custom-input"
              >
                <option value="metric">Metric (°C, m, kg)</option>
                <option value="imperial">Imperial (°F, ft, lb)</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fus Orar</Form.Label>
              <Form.Select
                name="fusOrar"
                value={formData.fusOrar}
                onChange={onChange}
                className="custom-input"
              >
                <option value="Europe/Bucharest">București (GMT+2)</option>
                <option value="Europe/London">Londra (GMT+0)</option>
                <option value="Europe/Berlin">Berlin (GMT+1)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Interval Actualizare Date (secunde)</Form.Label>
              <Form.Select
                name="intervalActualizare"
                value={formData.intervalActualizare}
                onChange={onChange}
                className="custom-input"
              >
                <option value="10">10 secunde</option>
                <option value="30">30 secunde</option>
                <option value="60">1 minut</option>
                <option value="300">5 minute</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <div className="system-info">
          <h5 className="mb-3">Informații Sistem</h5>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Versiune Aplicație:</span>
              <span className="info-value">v2.4.1</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ultima Actualizare:</span>
              <span className="info-value">15 Aug 2024</span>
            </div>
            <div className="info-item">
              <span className="info-label">Plăci asociate (ID):</span>
              <span className="info-value">
                {boards.length ? boards.map((b) => b.board_id).join(", ") : "—"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Status Server:</span>
              <span className="badge bg-success">Online</span>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
