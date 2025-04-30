import express from "express"
import { createProblem } from "../controllers/problem.controller.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/createProblem",authMiddleware,checkAdmin,createProblem);
router.get("/getProblem/:id",createProblem);
router.get("/getAllProblems",createProblem);
router.put("/updateProblem/:id",createProblem);
router.delete("/deletedProblem/:id",createProblem);
router.get("/getSolvedProblems",createProblem)

export default router