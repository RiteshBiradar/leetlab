import express from "express"
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getAllPlaylist,createPlaylist,getPlayListDetails,addProblemToPlaylist,deletePlaylist,removeProblemFromPlaylist } from "../controllers/playlist.controller.js";

const router = express.Router();


router.get("/",authMiddleware,getAllPlaylist)

router.get("/:playlistId",authMiddleware,getPlayListDetails)

router.post("/create",authMiddleware,createPlaylist);

router.post("/:playlistId/addProblem",authMiddleware,addProblemToPlaylist);

router.delete("/:playlistId",authMiddleware,deletePlaylist);

router.delete("/:playlistId/removeProblem",authMiddleware,removeProblemFromPlaylist)

export default router