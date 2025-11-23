Smart Greenhouse – Backend API

Backend-ul proiectului Sera Smart / Smart Greenhouse gestionează fluxul de date dintre infrastructura hardware (Raspberry Pi Pico + senzori), baza de date și aplicația web. Este construit folosind Node.js + Express, comunică prin MQTT cu dispozitivele IoT și expune un API REST pentru frontend.

Acest backend este responsabil pentru:

colectarea datelor trimise de senzori (temperatură, umiditate, lumină, sol etc.)

salvarea măsurătorilor în baza de date MySQL

gestionarea utilizatorilor și autentificării (JWT)

gestionarea statusului actuatorilor (udare, ventilație, lumină)

expunerea endpoint-urilor pentru dashboard și statistici

emiterea de comenzi către Raspberry Pi Pico prin MQTT

Tehnologii utilizate

Node.js (v18+)

Express.js

MySQL2

MQTT.js – comunicare în timp real cu device-urile hardware

dotenv – gestionare variabile de mediu

jsonwebtoken – autentificare JWT

bcryptjs – hashing parole

cors

nodemon – development

Structura proiectului backend/ │── api/ │── config/ │ └── db.js │── controllers/ │── middleware/ │ └── authMiddleware.js │── routes/ │── utilsothers/ │── mqttClient.js → conexiune MQTT pentru senzori & actuatori │── server.js → punctul principal de intrare │── package.json │── .env.example

Funcționalități principale

1. Colectarea datelor de la senzori (MQTT → REST → MySQL)

Raspberry Pi Pico publică periodic date pe topic-uri MQTT.

mqttClient.js ascultă aceste topic-uri.

Payload-ul este validat și trimis către baza de date.

Datele sunt apoi expuse în frontend (dashboard + statistici).

2. Autentificare și management utilizatori

Login / Register cu email + parolă

Token JWT generat la autentificare

authMiddleware.js validează accesul la rutele protejate

3. Managementul stărilor actuatorilor

Comenzi pentru udare, ventilație, iluminare

Se salvează în baza de date și se trimit în MQTT către dispozitive

4. Endpoint-uri REST pentru dashboard

/api/sensor-data

/api/status

/api/control

/api/auth

/api/users

/api/advice (recomandări generate logic în backend)

Instalare & Pornire

1. Instalare dependințe npm install

2. Pornire în dezvoltare npm run dev

3. Pornire în producție node server.js

Exemple de endpoint-uri Autentificare

POST /api/auth/login POST /api/auth/register

Date senzori

GET /api/sensor-data/all GET /api/sensor-data/latest

Status actuatori

GET /api/status POST /api/status/update

Control actuatori

POST /api/control/send

Recomandări (Advice Engine)

GET /api/advice

MQTT – infrastructură IoT

Backend-ul stabilește o conexiune MQTT bidirecțională:

Topic-uri de ingestie (citire senzori): greenhouse/sensors/{deviceId}

Topic-uri de control (actuatori): greenhouse/control/{deviceId}

Payload-urile sunt convertite în JSON și validate înainte de salvare.

Contribuții personale (developer core contributor)

În acest proiect am realizat:

design-ul complet al arhitecturii backend

implementarea conexiunii MQTT cu Raspberry Pi Pico

parsarea și validarea payload-urilor de la senzori

structura bazelor de date și logica de salvare

autentificare completă cu JWT

API REST folosit de dashboardul frontend

control actuatori + sincronizare MQTT–DB

testarea completă cu Postman
