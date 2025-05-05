import express from "express"
import { createProblem, deleteProblem, getAllProblems, getProblemByTitle, updateProblem } from "../controllers/problem.controller.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/createProblem",authMiddleware,checkAdmin,createProblem);

router.get("/getProblem/:title",authMiddleware,getProblemByTitle);

router.get("/getAllProblems",authMiddleware,getAllProblems);

router.put("/updateProblem/:title",authMiddleware, checkAdmin,updateProblem);

router.delete("/deletedProblem/:title",authMiddleware , checkAdmin,deleteProblem);

router.get("/getSolvedProblems",authMiddleware,createProblem)

export default router