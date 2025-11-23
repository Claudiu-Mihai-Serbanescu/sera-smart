import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { encrypt } from "../utilsothers/encryption.js";


// ✅ Register
export const registerUser = async (req, res) => {
  const { fullname, username, password, role_id = 2 } = req.body;

  if (!fullname || !username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [existing] = await pool.query(
      `SELECT * FROM A_USERS WHERE USERNAME = ?`,
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO A_USERS (FULLNAME, USERNAME, PASSWORD, ROLE_ID, ACTIVE) VALUES (?, ?, ?, ?, ?)`,
      [fullname, username, hashedPassword, role_id, 1]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  const ipRaw = req.ip || req.connection.remoteAddress;
  const ip = encrypt(ipRaw);
  const userAgent = req.headers["user-agent"];

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const [results] = await pool.query(
      `SELECT * FROM A_USERS WHERE USERNAME = ?`,
      [username]
    );

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.USER_ID, username: user.USERNAME },
      SECRET_KEY,
      { expiresIn: "24h" }
    );

    await pool.query(
      `INSERT INTO A_TOKEN (USER_ID, TOKEN, IP_ADDRESS, USER_AGENT) VALUES (?, ?, ?, ?)`,
      [user.USER_ID, token, ip, userAgent]
    );

    req.session.user = {
      userId: user.USER_ID,
      username: user.USERNAME,
      role: user.ROLE_ID,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful", user_role: user.ROLE_ID });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Logout
export const logoutUser = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({ error: "No token found in cookies" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    const [result] = await pool.query(
      `DELETE FROM A_TOKEN WHERE USER_ID = ? AND TOKEN = ?`,
      [userId, token]
    );

    res.clearCookie("token");

    req.session.destroy(err => {
      if (err) {
        console.error("Eroare la distrugerea sesiunii:", err);
        return res.status(500).json({ error: "Logout failed" });
      }

      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
};



// // ⛓️ Config
// const SECRET_KEY = process.env.JWT_SECRET;
// ;

// // ✅ Register
// export const registerUser = async (req, res) => {
//   const { fullname, username, password, role_id = 2 } = req.body;

//   if (!fullname || !username || !password) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     // Verifică dacă utilizatorul există deja
//     const [existing] = await pool.query(
//       `SELECT * FROM A_USERS WHERE USERNAME = ?`,
//       [username]
//     );
//     if (existing.length > 0) {
//       return res.status(409).json({ error: "Username already exists" });
//     }

//     // 🔐 Hash parola
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 🗃️ Inserează în baza de date
//     await pool.query(
//       `INSERT INTO A_USERS (FULLNAME, USERNAME, PASSWORD, ROLE_ID, ACTIVE) VALUES (?, ?, ?, ?, ?)`,
//       [fullname, username, hashedPassword, role_id, 1]
//     );

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ✅ Login
// export const loginUser = async (req, res) => {
//   const { username, password } = req.body;

//   const ipRaw = req.ip || req.connection.remoteAddress;
//   const ip = encrypt(ipRaw); //  Criptare IP
//   const userAgent = req.headers["user-agent"]

//   if (!username || !password) {
//     return res.status(400).json({ error: "Username and password are required" });
//   }

//   try {
//     const [results] = await pool.query(
//       `SELECT * FROM A_USERS WHERE USERNAME = ?`,
//       [username]
//     );

//     if (results.length === 0) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const user = results[0];
//     const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);
//     if (!isPasswordValid) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { user_id: user.USER_ID, username: user.USERNAME },
//       SECRET_KEY,
//       { expiresIn: "24h" }
//     );

//     // 🔍 LOGURI DE VERIFICARE (aici le adaugi)
//     console.log("✅ Login reușit pentru:", user.USERNAME);
//     console.log("🔐 JWT:", token);
//     console.log("📡 IP:", ip);
//     console.log("📱 User-Agent:", userAgent);
//     console.log("🗃 USER_ID:", user.USER_ID);

//     // Salvează tokenul în DB
//     try {
//       await pool.query(
//         `INSERT INTO A_TOKEN (USER_ID, TOKEN, IP_ADDRESS, USER_AGENT) VALUES (?, ?, ?, ?)`,
//         [user.USER_ID, token, ip, userAgent]
//       );
//       console.log("✅ Token salvat în baza de date A_TOKEN CR");
//     } catch (err) {
//       console.error("❌ Eroare la inserarea tokenului în A_TOKEN:", err);
//     }

//     // Trimite cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     res.json({ message: "Login successful", user_role: user.ROLE_ID });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ✅ Logout
// export const logoutUser = async (req, res) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.status(400).json({ error: "No token found in cookies" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);
//     const userId = decoded.user_id;

//     const [result] = await pool.query(
//       `DELETE FROM A_TOKEN WHERE USER_ID = ? AND TOKEN = ?`,
//       [userId, token]
//     );

//     console.log("✅ Token șters din baza de date (dacă a existat)");
//     console.log("🔍 Rânduri afectate:", result.affectedRows);
//     console.log("🔍 Token din cookie:", req.cookies.token);


//     res.clearCookie("token");
//     res.json({ message: "Logged out successfully" });
//   } catch (err) {
//     console.error("Logout error:", err);
//     res.status(500).json({ error: "Logout failed" });
//   }
// };




