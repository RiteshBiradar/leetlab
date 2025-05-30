import express from "express"
import cookieparse from "cookie-parser"
import dotenv from "dotenv"
import cors from "cors"
dotenv.config();

const app = express()
import authRouter from "./routes/auth.router.js"
import problemRouter from "./routes/problem.router.js"
import executeRouter from "./routes/executeCode.router.js"
import submissionRouter from "./routes/submission.router.js"
import playlistRouter from "./routes/playlist.router.js"
import { errorHandler } from "./middleware/errorHandler.middleware.js";


app.use(express.json());
app.use(cookieparse());

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,           
}));


app.get("/",(req,res)=>{
    res.send("Hello from Code Challenge")
})

app.use("/api/v1/auth",authRouter)
app.use("/api/v1/problems",problemRouter)
app.use("/api/v1/execute-code",executeRouter)
app.use("/api/v1/submission",submissionRouter) 
app.use("/api/v1/playlist",playlistRouter)


app.use(errorHandler);
app.listen(process.env.PORT,()=>{
    console.log("Server is running")
})