import express from "express"
import cookieparse from "cookie-parser"
import dotenv from "dotenv"
dotenv.config();

const app = express()
import authRouter from "./routes/auth.router.js"
import problemRouter from "./routes/problem.router.js"

app.use(express.json());
app.use(cookieparse());

app.get("/",(req,res)=>{
    res.send("Hello from TestLabs")
})

app.use("/api/v1/auth",authRouter)
app.use("/api/v1/problems",problemRouter)
app.listen(process.env.PORT,()=>{
    console.log("Server is running")
})