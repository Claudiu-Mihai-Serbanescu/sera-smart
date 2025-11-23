Smart Greenhouse – Frontend Dashboard

Frontend-ul reprezintă interfața principală a proiectului Sera Smart / Smart Greenhouse, dezvoltată cu React + Vite, optimizată pentru performanță, accesibilitate și utilizarea pe orice dispozitiv (desktop, tabletă, mobil).

Interfața permite monitorizarea în timp real a tuturor senzorilor din seră, controlul actuatorilor, vizualizarea statisticilor, alerte, recomandări, setări și chiar streaming video live de la camerele conectate la Raspberry Pi.

Tehnologii utilizate

React 18

Vite – dev server extremely rapid

JavaScript ES6+

Fetch API / Axios pentru comunicarea cu backend-ul

CSS modular / custom CSS

Responsive Design complet (desktop, tabletă, mobile)

Hooks personalizate

Live Video Streams (MJPEG/Webcam) – integrat cu Raspberry Pi

Funcționalități principale

1. Dashboard senzori în timp real

temperatură aer

umiditate aer

lumină ambiantă

umiditate sol

calitatea aerului (dacă este activată)

actualizare în timp real din backend

2. Vizualizare live camera Raspberry Pi

streaming video direct în aplicație (format MJPEG)

refresh automat

latente minime

compatibil cu orice browser modern

3. Hartă interactivă a serelor

localizare sere

selectare seră activă

vizualizare informații atașate

4. Statistici extinse

grafice dinamice (24h, 7 zile, 30 zile)

comparare senzori

baseline detect

analize agregate (min/max/average)

5. Notificări & Alerte

stări critice senzori

recomandări automatizate (de ex. udare necesară, ventilație)

6. Control actuatori direct din UI

pornire / oprire ventilator

activare udare

iluminare

trimitere comenzi în timp real prin backend → MQTT

7. Setări utilizator & aplicație

selectare mod afișare

ajustare interval refresh

schimbare seră activă

preferințe notificări

8. Autentificare și sesiune

login cu token stocat în localStorage

protecție pentru pagini interne

redirect logic login → dashboard

logout complet

Contribuții personale (Lead Frontend Developer & UI/UX Architect)

Am coordonat întreaga componentă de frontend a proiectului Smart Greenhouse, având rol complet atât pe partea de arhitectură, cât și pe implementare. Principalele responsabilități și contribuții includ:

definirea designului general al aplicației (UI/UX)

crearea conceptului vizual și a structurii tuturor paginilor

implementarea completă a interfeței în React + Vite

dezvoltarea tuturor paginilor principale (Dashboard, Statistici, Hartă, Setări, Notificări etc.)

integrarea fluxurilor de date cu backend-ul și implementarea request-urilor asincrone

integrarea sistemului de live video streaming de la camerele USB conectate la Raspberry Pi

managementul stării aplicației prin hooks personalizate

scrierea întregului cod CSS, optimizat pentru responsive design (desktop/tabletă/mobile)

structurarea proiectului pe module, componente și foldere reutilizabile

colaborare cu echipa pe partea de backlog, prioritizare și code review (unde a fost nevoie)

suport pentru coechipieri (care au contribuit în mică măsură), inclusiv onboarding și explicații tehnice

testare cross-device și debugging complet

Structura proiectului frontend/ │── public/ │── src/ │ ├── components/ │ ├── config/ │ ├── hooks/ │ ├── lib/ │ ├── pages/ │ │ ├── Agromi.jsx │ │ ├── Agromi.css │ │ ├── Harta.jsx │ │ ├── Notificari.jsx │ │ ├── Notificari.css │ │ ├── Setari.jsx │ │ ├── Statistici.jsx │ │ ├── StatisticiPage.css │ ├── utils/ │ │ ├── App.jsx │ │ ├── main.jsx │── index.html │── package.json │── vite.config.js

Instalare & Pornire

1. Instalare dependințe npm install

2. Pornire server de dezvoltare npm run dev

Serverul pornește tipic pe:

http://localhost:5173

3. Build pentru producție npm run build

Integrare cu Backend

Frontend-ul comunică cu backend-ul prin API REST:

/api/sensor-data

/api/status

/api/control

/api/auth

/api/advice

Endpoint-urile sunt centralizate în fișierele din:

src/config/ src/lib/ src/utils/

Live Video Integration

Streaming video este asigurat prin:

camere USB conectate la Raspberry Pi

server MJPEG (mjpg-streamer pe porturile 8080/8081)

integrare directă în UI sub formă de img streaming live

Avantaje:

latency aproape zero

consum redus

compatibilitate perfectă cu React

Optimizări notabile realizate

design total responsive (mobile-first)

optimizare layout pentru dashboard (grile fluide + breakpoints)

management eficient al stării cu hooks personalizate

încărcări asincrone & revalidări inteligente

cod structurat pe module + foldere logice

abordare profesionistă în organizare și naming

fallback UI pentru lipsă conexiune / erori senzor

integrare multi-pagină pentru: statistici, notificări, hartă, setări
