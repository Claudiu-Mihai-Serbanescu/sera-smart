// src/components/setari/SectionFarm.jsx
import React from "react";
import { Card, Row, Col, Form } from "react-bootstrap";

export default function SectionFarm({ formData, onChange }) {
  return (
    <Card className="settings-card">
      <Card.Body>
        <h3 className="section-title mb-4">
          <i className="bi bi-building me-2"></i> Informații Fermă
        </h3>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nume Fermă/Companie</Form.Label>
              <Form.Control
                name="numeFerma"
                value={formData.numeFerma}
                onChange={onChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>CUI/CIF</Form.Label>
              <Form.Control
                name="cui"
                value={formData.cui}
                onChange={onChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Suprafață Totală (m²)</Form.Label>
              <Form.Control
                type="number"
                name="suprafataTotala"
                value={formData.suprafataTotala}
                onChange={onChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Număr Sere</Form.Label>
              <Form.Control
                type="number"
                name="numarSere"
                value={formData.numarSere}
                onChange={onChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
