import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

export const generateAccessToken = (userId)=>{
    return jwt.sign({id:userId},process.env.ACCESS_TOKEN_KEY,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

export const generateRefreshToken = (userId)=>{
    return jwt.sign({id:userId},process.env.REFRESH_TOKEN_KEY,{
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}