import jwt from "jsonwebtoken"
import {db} from "../libs/db.js"

export const authMiddleware = async(req,res,next) =>{
    try {
        const token = req.cookies.jwt;  
        if(!token){
            throw new ApiError(401,"User unathorized - No token provided")
        } 
        let decoded;
        try {
            decoded = jwt.verify(token,process.env.JWT_SECRET);
        } catch (error) {
            throw new ApiError(401,"User unathorized - Invalid provided")             
        }
        const user = await db.user.findUnique({
            where : {
                id : decoded.id,
            },
            select : {
                id:true,
                name:true,
                email:true,
                role:true,
                image:true
            }
        })

        if(!user){
            return res.status(401).json({
                message : "User not found"
            })             
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(500,"Error authenticating user") 
    }

}