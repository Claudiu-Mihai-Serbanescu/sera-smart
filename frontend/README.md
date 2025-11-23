# 🎨 Smart Greenhouse – Frontend Dashboard  
**React + Vite + Live Video + Real-Time Sensor Monitoring**

---

## 📌 Descriere generală

Frontend-ul reprezintă interfața principală a proiectului **Sera Smart / Smart Greenhouse**, dezvoltată cu **React + Vite**, optimizată pentru performanță, accesibilitate și utilizare pe orice dispozitiv (desktop, tabletă, mobil).

Interfața permite:

- monitorizarea în timp real a tuturor senzorilor
- controlul actuatorilor
- vizualizarea statisticilor
- notificări & recomandări
- configurări avansate
- streaming video live de la camerele conectate la Raspberry Pi

---

## ⚙️ Tehnologii utilizate

- **React 18**
- **Vite** – dev server extremely fast
- **JavaScript ES6+**
- **Fetch API / Axios** pentru comunicarea cu backend-ul
- **CSS modular / custom CSS**
- **Responsive Design complet** (desktop, tabletă, mobil)
- **Hooks personalizate**
- **Live MJPEG Streams (Webcam / mjpg-streamer)** integrate cu Raspberry Pi

---

## 🔹 Funcționalități principale

---

### 1. Dashboard senzori în timp real
- temperatură aer  
- umiditate aer  
- lumină ambiantă  
- umiditate sol  
- calitatea aerului (opțional)  
- actualizare în timp real din backend  

---

### 2. Vizualizare live camera Raspberry Pi
- streaming video în format **MJPEG**  
- refresh automat  
- latențe foarte mici  
- compatibil cu orice browser modern  

---

### 3. Hartă interactivă a serelor
- localizare sere  
- selectare seră activă  
- afișare detalii asociate  

---

### 4. Statistici extinse
- grafice dinamice (24h, 7 zile, 30 zile)  
- comparare senzori  
- detectare baseline  
- analize agregate (min / max / average)  

---

### 5. Notificări & Alerte
- valori critice ale senzorilor  
- recomandări automate (udare, ventilație etc.)  

---

### 6. Control actuatori direct din UI
- pornire / oprire ventilator  
- activare udare  
- control iluminare  
- trimitere comenzi → backend → MQTT  

---

### 7. Setări utilizator & aplicație
- mod afișare  
- interval refresh  
- schimbare seră activă  
- preferințe notificări  

---

### 8. Autentificare și sesiune
- login cu token în `localStorage`  
- protecție pagini interne  
- redirect logic login → dashboard  
- logout complet  

---

## 👤 Contribuții personale  
### **Lead Frontend Developer & UI/UX Architect**

Am coordonat întreaga componentă de frontend a proiectului, având rol major atât în design, cât și în implementare. Contribuțiile mele includ:

- definirea design-ului general al aplicației (UI/UX)  
- crearea conceptului vizual și structurii fiecărei pagini  
- implementarea completă a interfeței în React + Vite  
- dezvoltarea tuturor paginilor principale (Dashboard, Statistici, Hartă, Setări, Notificări etc.)  
- integrarea fluxurilor asincrone cu backend-ul  
- integrarea sistemului live video (USB camera + Raspberry Pi + mjpg-streamer)  
- gestionarea stării aplicației prin hooks personalizate  
- scrierea întregului CSS, optimizat pentru mobile-first  
- structurarea proiectului pe module, componente și foldere reutilizabile  
- colaborare cu echipa pentru backlog & code review  
- onboarding și suport tehnic pentru colegi (care au contribuit în mică măsură)  
- testare cross-device, debugging extins și optimizări  

---

## 📁 Structura proiectului

frontend/
│── public/
│── src/
│ ├── components/
│ ├── config/
│ ├── hooks/
│ ├── lib/
│ ├── pages/
│ │ ├── Agromi.jsx
│ │ ├── Agromi.css
│ │ ├── Harta.jsx
│ │ ├── Notificari.jsx
│ │ ├── Notificari.css
│ │ ├── Setari.jsx
│ │ ├── Statistici.jsx
│ │ ├── StatisticiPage.css
│ ├── utils/
│ │ ├── App.jsx
│ │ ├── main.jsx
│── index.html
│── package.json
└── vite.config.js


---

## ▶️ Instalare & Pornire

### 1. Instalare dependințe
```bash
npm install
2. Pornire server de dezvoltare
npm run dev
Serverul rulează de obicei la:
arduino
http://localhost:5173
3. Build pentru producție
npm run build
---

## 🔗 Integrare cu Backend
Frontend-ul comunică cu backend-ul prin API-uri REST:

/api/sensor-data

/api/status

/api/control

/api/auth

/api/advice

Endpoint-urile sunt centralizate în:

bash
Copy code
src/config/
src/lib/
src/utils/
📡 Live Video Integration
Streamingul video este asigurat prin:

camere USB conectate la Raspberry Pi

server MJPEG (mjpg-streamer pe porturile 8080/8081)

integrare directă în UI prin tag-ul <img> live

Avantaje:
latență aproape zero

consum redus

compatibilitate perfectă cu React

🚀 Optimizări notabile
design total responsive (mobile-first)

layout optimizat pentru dashboard (grile fluide + breakpoints)

management eficient al stării aplicației

revalidări inteligente ale datelor

cod modular și organizat pe foldere logice

naming profesionist pentru componente și fișiere

fallback UI pentru lipsă conexiune / erori senzori

integrare multi-pagină: statistici, notificări, hartă, setări

yaml
Copy code
