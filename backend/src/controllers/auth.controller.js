import bcryptjs from "bcryptjs"
import {db} from "../libs/db.js"
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken"

export const register = async(req,res)=>{
    const {name,email,password,image} = req.body;
    try {
        const existingUser = await db.user.findUnique({
            where : {
                email
            }
        })
        if(existingUser){
            console.log("Error at register",error);
            res.status(400).json({
                error : "User already exists"
            })
        }

        const hashedPassword = await bcryptjs.hash(password,10);
        const newUser = await db.user.create({
            data:{
                name,
                email,
                password : hashedPassword,
                role : UserRole.USER,
                image : "ritesh"
                //need to add image
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
    } catch (error) {
        console.log("Error in register",error);
        res.status(500).json({
            error : "Error creating user"
        })
    }
    
}

export const login = async(req,res)=>{
    const {email,password} = req.body;

    try {
        const user = await db.user.findUnique({
            where : {
                email
            }
        })
        if(!user){
            res.status(401).json({
                error : "User not found"
            })
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
            res.status(401).json({
                error : "Invalid credentials"
            })        
        }
    } catch (error) {
        console.log("Error logging in user",error);
        res.status(500).json({
            error : "Error logging in user"
        })   
    }
}

export const logout = async(req,res)=>{
    try {
        res.clearCookie("jwt",{
            httpOnly : true,
            sameSite : "strict",
            secure : process.env.NODE_ENV !=="development",
        })
        res.status(204).json({
            success : true,
            message : "User logged out successfully"
        })   
    } catch (error) {
        console.log("Error logging out",error);
        res.status(500).json({
            error : "Error logging out"
        })          
    }
}

export const check = async(req,res)=>{
    try {
        res.status(200).json({
            success : true,
            message : "User authenticated successfully",
            user : req.user
        })  
    } catch (error) {
        res.status(500).json({
            error : "Error checking user"
        })                   
    }
}