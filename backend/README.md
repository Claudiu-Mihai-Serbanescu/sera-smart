# 🔧 Smart Greenhouse – Backend API  
**Node.js + Express + MQTT + MySQL**

---

## 📌 Descriere generală

Backend-ul proiectului **Sera Smart / Smart Greenhouse** gestionează fluxul de date dintre infrastructura hardware (Raspberry Pi Pico + senzori), baza de date și aplicația web.  

Acesta este construit folosind **Node.js + Express**, comunică prin **MQTT** cu dispozitivele IoT și expune un **API REST** utilizat de dashboard-ul frontend.

### Backend-ul este responsabil pentru:

- colectarea datelor trimise de senzori (temperatură, umiditate, lumină, sol etc.)  
- salvarea măsurătorilor în baza de date MySQL  
- gestionarea utilizatorilor și autentificării (JWT)  
- gestionarea statusului actuatorilor (udare, ventilație, lumină)  
- expunerea endpoint-urilor pentru dashboard și statistici  
- emiterea de comenzi către Raspberry Pi Pico prin MQTT  

---

## ⚙️ Tehnologii utilizate

- **Node.js (v18+)**  
- **Express.js**  
- **MySQL2**  
- **MQTT.js** – comunicare în timp real cu device-urile hardware  
- **dotenv** – gestionare variabile de mediu  
- **jsonwebtoken** – autentificare JWT  
- **bcryptjs** – hashing parole  
- **cors**  
- **nodemon** – development  

---

## 🧱 Structura proiectului

backend/
│── api/
│── config/
│ └── db.js
│── controllers/
│── middleware/
│ └── authMiddleware.js
│── routes/
│── utilsothers/
│── mqttClient.js → conexiune MQTT pentru senzori & actuatori
│── server.js → punctul principal de intrare
│── package.json
└── .env.example

yaml
Copy code

---

## 🔹 Funcționalități principale

---

### 1. Colectarea datelor de la senzori (MQTT → REST → MySQL)

- Raspberry Pi Pico publică date pe topic-uri MQTT.  
- `mqttClient.js` ascultă aceste topic-uri.  
- Payload-ul este validat și inserat în baza de date.  
- Datele devin disponibile pentru dashboard și statistici.

---

### 2. Autentificare și management utilizatori

- Înregistrare / Login cu email + parolă  
- Token JWT generat la autentificare  
- `authMiddleware.js` validează accesul la rutele protejate  

---

### 3. Managementul stărilor actuatorilor

- Comenzi pentru udare, ventilație, iluminare  
- Salvare stare în baza de date  
- Trimitere comandă în MQTT către dispozitive  

---

### 4. Endpoint-uri REST pentru dashboard

#### Autentificare
POST /api/auth/login
POST /api/auth/register

shell
Copy code

#### Date senzori
GET /api/sensor-data/all
GET /api/sensor-data/latest

shell
Copy code

#### Status actuatori
GET /api/status
POST /api/status/update

shell
Copy code

#### Control actuatori
POST /api/control/send

shell
Copy code

#### Recomandări (Advice Engine)
GET /api/advice

yaml
Copy code

---

## 🚀 Instalare & Pornire

### 1. Instalare dependințe
```bash
npm install
2. Pornire în dezvoltare
bash
Copy code
npm run dev
3. Pornire în producție
bash
Copy code
node server.js
📡 MQTT – Infrastructură IoT
Backend-ul stabilește o conexiune MQTT bidirecțională pentru ingestie și control.

Topic-uri principale:
Ingestie date senzori:

bash
Copy code
greenhouse/sensors/{deviceId}
Control actuatori:

bash
Copy code
greenhouse/control/{deviceId}
Payload-urile sunt convertite în JSON, validate și apoi salvate în MySQL.

👤 Contribuții personale (Backend Developer)
În acest proiect am realizat:

design-ul complet al arhitecturii backend

implementarea conexiunii MQTT cu Raspberry Pi Pico

parsarea și validarea payload-urilor de la senzori

structura bazei de date și logica de salvare

sistem complet de autentificare cu JWT

API-ul REST folosit de dashboard-ul frontend

control actuatori + sincronizare MQTT–DB

testare completă cu Postman
