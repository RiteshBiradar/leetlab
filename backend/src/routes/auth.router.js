import express from "express"
import { check, login, logout, refreshTokenHandler, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register",register)

router.post("/login",login)

router.get("/logout", authMiddleware , logout)

router.get("/check",authMiddleware,check)

router.post("/refresh-token",refreshTokenHandler)
export default router