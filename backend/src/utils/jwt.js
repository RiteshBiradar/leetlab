import jwt from "jsonwebtoken"

export const generateAccessToken = (userId)=>{
    jwt.sign({id:userId},process.env.ACCESS_TOKEN_KEY,{
        expiresIn : ACCESS_TOKEN_EXPIRY
    })
}

export const generateRefreshToken = (userId)=>{
    jwt.sign({id:userId},process.env.REFRESH_TOKEN_KEY,{
        expiresIn : REFRESH_TOKEN_EXPIRY
    })
}