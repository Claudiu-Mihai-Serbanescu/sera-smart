// src/components/setari/SectionPersonal.jsx
import React from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";

export default function SectionPersonal({ me, onMeChange, openPasswordModal }) {
  return (
    <Card className="settings-card">
      <Card.Body>
        <h3 className="section-title mb-4">
          <i className="bi bi-person-circle me-2"></i> Informații Personale
        </h3>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nume Complet</Form.Label>
              <Form.Control
                name="nume"
                value={me.nume}
                onChange={onMeChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Număr Telefon</Form.Label>
              <Form.Control
                name="telefon"
                value={me.telefon}
                onChange={onMeChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={me.email}
                onChange={onMeChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Parolă</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="password"
                  value="••••••••"
                  disabled
                  className="custom-input"
                />
                <Button variant="outline-primary" onClick={openPasswordModal}>
                  Schimbă
                </Button>
              </div>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Adresă</Form.Label>
              <Form.Control
                name="adresa"
                value={me.adresa}
                onChange={onMeChange}
                className="custom-input"
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
