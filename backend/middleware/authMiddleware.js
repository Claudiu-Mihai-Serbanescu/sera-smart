import jwt from "jsonwebtoken";
import 'dotenv/config';
import pool from "../config/db.js";


const JWT_SECRET = process.env.JWT_SECRET;

// Debug pentru confirmare încărcare secret
console.log(" JWT_SECRET loaded:", JWT_SECRET ? " YES" : " NO");

//  Middleware pentru sesiune Express
export const authenticateSession = (req, res, next) => {
    if (req.session?.user) {
        console.log(" Sesiune activă:", req.session.user);
        req.user = req.session.user;
        return next();
    }

    console.warn(" Acces refuzat: sesiune inexistentă");
    return res.status(401).json({ error: "Access denied: No active session" });
};

//  Middleware pentru autentificare JWT + DB check
export const authenticateToken = async (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers["authorization"];
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    const token = cookieToken || headerToken;

    console.log(" Autentificare token:");
    console.log(" Token primit:", token ? " DA" : " NU");

    if (!JWT_SECRET) {
        console.error(" JWT_SECRET lipsește din configurare (env)");
        return res.status(500).json({ error: "Server configuration error: JWT secret missing" });
    }

    if (!token) {
        return res.status(401).json({ error: "Access denied: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        // Verificăm dacă tokenul este valid și înregistrat în DB
        const [rows] = await pool.query(
            `SELECT * FROM A_TOKEN WHERE USER_ID = ? AND TOKEN = ?`,
            [decoded.user_id, token]
        );

        if (rows.length === 0) {
            console.warn(" Tokenul nu a fost găsit în baza de date (posibil revocat)");
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        console.log(" Token valid pentru USER_ID:", decoded.user_id);
        next();
    } catch (err) {
        console.error(" JWT invalid:", err.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};


