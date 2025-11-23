import express from "express";
import {
    loginUser,
    registerUser,
    logoutUser
} from "../controllers/authController.js";
import {
    authenticateToken,
    authenticateSession
} from "../middleware/authMiddleware.js";



const router = express.Router();

// 🔐 Autentificare
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authenticateToken, logoutUser);

// 🔒 Rută protejată prin sesiune
router.get("/protected", authenticateSession, (req, res) => {
    res.json({
        message: "✅ Acces permis (sesiune activă)",
        user: req.user,
    });
});

// 🔒 Rută protejată prin token JWT
router.get("/jwt-protected", authenticateToken, (req, res) => {
    res.json({
        message: "✅ Acces permis (token JWT valid)",
        user: req.user,
    });
});

export default router;

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.post("/logout", authenticateToken, logoutUser);


// export default router;
