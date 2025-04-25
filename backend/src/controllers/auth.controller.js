import bcryptjs from "bcryptjs"
import {db} from "../libs/db.js"
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler (async(req,res)=>{
    const {name,email,password,image} = req.body;
    const existingUser = await db.user.findUnique({
            where : {
                email
            }
    })
        if(existingUser){
            throw new ApiError(400,"User already exists")
        }
    
        const hashedPassword = await bcryptjs.hash(password,10);
        const newUser = await db.user.create({
            data:{
                name,
                email,
                password : hashedPassword,
                role : UserRole.USER,
                image :"temp" //will add image here later
            }
        })
        const token = jwt.sign({id:newUser.id},process.env.JWT_SECRET,{
            expiresIn : "7day"
        })
        res.cookie("jwt", token,{
            httpOnly : true,
            sameSite : "strict",
            secure : process.env.NODE_ENV !=="development",
            maxAge : 1000 * 60 * 60 * 24 * 7
        })

        res.status(201).json({
            success : true,
            message : "User created successfully",
            user : {
                id : newUser.id,
                user : newUser.user,
                email : newUser.email,
                role : newUser.role,
                image : newUser.image
            }
        })    
})

export const login = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;
        const user = await db.user.findUnique({
            where : {
                email
            }
        })
        if(!user){
            throw new ApiError(401,"User not found")
        }
        const isVerified = await bcryptjs.compare(password,user.password)
    
        if(isVerified){
            const token = jwt.sign({id:user.id},process.env.JWT_SECRET,{
                expiresIn : "7d"
            })
    
            res.cookie("jwt", token,{
                httpOnly : true,
                sameSite : "strict",
                secure : process.env.NODE_ENV !=="development",
                maxAge : 1000 * 60 * 60 * 24 * 7
            })
    
            res.status(200).json({
                success  : true,
                message : "User logged in successfully",
                user : {
                    id : user.id,
                    name : user.name,
                    email,
                    role : UserRole.USER
                }
            })
        }
        else{
            throw new ApiError(401,"Invalid credentials")    
        } 
})

export const logout = asyncHandler(async(req,res)=>{
        res.clearCookie("jwt",{
            httpOnly : true,
            sameSite : "strict",
            secure : process.env.NODE_ENV !=="development",
        })
        res.status(204).json({
            success : true,
            message : "User logged out successfully"
        })   
    }
)

export const check = asyncHandler(async(req,res)=>{
        res.status(200).json({
            success : true,
            message : "User authenticated successfully",
            user : req.user
        })  
})