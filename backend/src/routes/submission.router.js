import express from "express"
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getAllSubmission, getAllTheSubmissionsForProblem, getSubmissionsForProblem } from "../controllers/submission.controller.js";

const router = express.Router();

router.get("/getAllSubmissions" , authMiddleware , getAllSubmission);
router.get("/getSubmission/:problemId" , authMiddleware , getSubmissionsForProblem)
router.get("/getSubmissionsCount/:problemId" , authMiddleware , getAllTheSubmissionsForProblem)


export default router;