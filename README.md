Smart Greenhouse – Complete IoT Monitoring & Automation Platform

Full Stack Project: React + Node.js + MQTT + Raspberry Pi + MySQL

Descriere generală

Smart Greenhouse este o platformă completă de monitorizare și automatizare a unei sere inteligente, construită cap-coadă cu tehnologii moderne web și IoT.

Proiectul include:

Frontend (React + Vite) – dashboard în timp real, live video, grafice, hartă interactivă, control actuatori, notificări, setări

Backend (Node.js + Express + MQTT) – API REST, procesarea datelor de la senzori, autentificare, control actuatori, conexiune cu Raspberry Pi Pico

Hardware (Raspberry Pi 4 + Raspberry Pi Pico + senzori) – acest layer nu este inclus în repository; datele sunt transmise către backend prin MQTT

Este un proiect complet funcțional, construit pentru a demonstra competențe de full stack development, IoT integration, real-time systems, UX design și dezvoltare de aplicații scalabile.

Arhitectura proiectului sera-smart/ │── backend/ → Node.js + Express + MQTT + MySQL API │── frontend/ → React + Vite responsive dashboard │── README.md → Documentația principală

Componentele proiectului

1. Frontend – Smart Dashboard (React + Vite)

Folder: /frontend

Funcționalități cheie:

dashboard senzori în timp real

grafice (24h, 7 zile, 30 zile)

hartă interactivă a serelor

sistem complet de notificări

control actuatori (udare, ventilație, iluminare)

streaming video live de la camere USB conectate la Raspberry Pi

sistem de autentificare (JWT)

UI complet responsive, optimizat pentru desktop/tabletă/mobil

Rol în proiect:

Frontend-ul a fost dezvoltat aproape integral de mine:

am propus și construit design-ul complet (UI/UX)

am structurat codul (componente, pagini, hooks, utilitare)

am implementat toate ecranele, logica, layout-urile și integrarea cu API-ul

am integrat video streaming & live sensor updates

am optimizat responsive design pentru toate dispozitivele

Documentație completă în: /frontend/README.md

2. Backend – API REST + MQTT Broker Client (Node.js)

Folder: /backend

Funcționalități cheie:

endpoint-uri REST pentru senzori, utilizatori, statistici, control

procesarea datelor trimise de Raspberry Pi Pico via MQTT

autentificare JWT + hashing parole

salvare date senzori în MySQL

trimitere comenzi către actuatori via MQTT

logica completă de business pentru automatizare

Rol în proiect:

am implementat endpoint-urile, controlerele, middleware-ul

am creat structura bazei de date

am implementat integrarea MQTT pentru ingestie senzori și actuatori

am realizat testarea API-ului cu Postman

am structurat arhitectura backend-ului conform standardelor profesionale

Documentație completă în: /backend/README.md

3. Layer Hardware (non-public)

Nu este inclus în repository, dar proiectul este testat cu:

Raspberry Pi 4 → rulează mjpg-streamer și gateway video

Raspberry Pi Pico W → colectează date senzori, controlează actuatori

senzori: DHT22, LDR, soil moisture, aer cald/rece etc.

comunicație: MQTT over WiFi

alimentare și conectare completă testată

Tehnologii utilizate (overview) Frontend

React 18

Vite

CSS modular

Hooks personalizate

Live MJPEG streaming

Fetch API/Axios

Backend

Node.js

Express

MySQL2

MQTT.js

dotenv

bcryptjs

jsonwebtoken

Hardware & IoT

Raspberry Pi 4

Raspberry Pi Pico W

MQTT

mjpg-streamer

multiple sensors & actuators

Screenshots (opțional)

Dacă dorești, pot genera secțiunea cu imagini + layout-uri (dashboard, grafică, video live). Spune-mi doar și le includ.

Cele mai importante capabilități ale proiectului

integrare completă IoT → backend → frontend

actualizare în timp real a datelor

control actuatori cu feedback instant

arhitectură scalabilă (poate gestiona multiple sere)

UI/UX modern, responsive, profesionist

management securizat al utilizatorilor

colectare și analiză istorică date

Cum rulezi proiectul local

1. Backend cd backend npm install npm run dev

2. Frontend cd frontend npm install npm run dev

3. Accesare aplicație http://localhost:5173

Rol personal în proiect (Full Stack & IoT Developer)

Am contribuit majoritar sau integral la:

arhitectura completă a aplicației

design UI/UX și implementare frontend completă

implementarea backend-ului (API REST + MQTT)

integrarea cu hardware-ul Raspberry Pi / Pico

testare, debugging, structurare, documentație

coordonarea echipei din partea de frontend & full stack

definirea fluxurilor, componentelor și logicii generale

Proiectul reprezintă o demonstrație practică a competențelor mele full stack și IoT.
