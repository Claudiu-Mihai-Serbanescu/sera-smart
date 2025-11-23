// src/lib/apiRoot.js
// Baza pentru request-urile către PHP-ul tău.
// În DEV rămâne /api (Vite proxy), în PROD e /api din docroot (dist).
const env = import.meta.env.VITE_API_URL?.trim();
export const API_ROOT = (env && env !== "" ? env : "/api").replace(/\/$/, "");
