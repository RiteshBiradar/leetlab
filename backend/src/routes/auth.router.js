import express from "express"
import { check, login, logout, refreshTokenHandler, register, resendVerificationEmail, verifyEmail } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register",register)

router.get("/verify",verifyEmail)

router.post("/resendVerification",resendVerificationEmail)
router.post("/login",login)

router.get("/logout", authMiddleware , logout)

router.get("/check",authMiddleware,check)

router.get("/refreshToken",refreshTokenHandler)

export default router