import bcryptjs from "bcryptjs"
import {db} from "../libs/db.js"
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import crypto from "crypto"
import ms from "ms"
import { emailVerificationMailContent } from "../utils/mail.js";
import { sendMail } from "../utils/mail.js";

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
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");
        const emailVerificationExpiry = new Date(new Date(Date.now()+ms(process.env.EMAIL_VERIFY_EXPIRY)))

        
        const hashedPassword = await bcryptjs.hash(password,10);
        const newUser = await db.user.create({
            data:{
                name,
                email,
                password : hashedPassword,
                role : UserRole.USER,
                emailVerificationToken,
                emailVerificationExpiry,
                image :"temp" //will add image here later
            }
        })
        const verificationUrl = `${process.env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify?token=${emailVerificationToken}`;


        try {
            await sendMail({
                email:newUser.email,
                subject:"Verify your email",
                mailGenContent : emailVerificationMailContent(
                    newUser.name,
                    verificationUrl
                )
            })
        } catch (error) {
            throw new ApiError(500,"Failed to send verification email")
        }
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

export const verifyEmail = asyncHandler(async(req,res)=>{
    const token = req.query.token;
    if(!token){
        throw new ApiError(401,"Invalid token for verification")
    }

    const user = await db.user.findFirst({
        where :{
            emailVerificationToken : token
        }
    })

    if(!user){
        throw new ApiError(404 , "User not found")
    }
    await db.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            emailVerificationToken: null,
            emailVerificationExpiry: null
        }
    });

    res.status(200).json({
        message : "User verification successfull",
        status : 200
    })
})

export const resendVerificationEmail = asyncHandler(async(req,res)=>{
    const {email} = req.body

    if(!email){
        throw new ApiError(401, "Invalid refresh token. Token might be expired or tampered with.");
    }
    const user = await db.user.findUnique({
        where : {
            email : email
        }
    })
    if(!user) throw new ApiError(404,"User not found")
    
    if(user.isVerified===true){
        throw new ApiError(400,"User already verified")
    }

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpiry = new Date(new Date(Date.now()+ms(process.env.EMAIL_VERIFY_EXPIRY)))

    await db.user.update({
        where : {
            email : email
        },
        data : {
            emailVerificationToken: emailVerificationToken, 
            emailVerificationExpiry : emailVerificationExpiry
        }
    })
    const verificationUrl = `${process.env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify?token=${emailVerificationToken}`;
    try {
        await sendMail({
            email:user.email,
            subject:"Verify your email",
            mailGenContent : emailVerificationMailContent(
                user.name,
                verificationUrl
            )
        })
    } catch (error) {
        throw new ApiError(500,"Failed to send verification email")
    }
    res.status(200).json({
        success : true,
        message : "Verification email sent successfully"
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
        
        const isPasswordValid  = await bcryptjs.compare(password,user.password)
        if(!isPasswordValid) throw new ApiError(401,"Invalid credentials") 

        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

        await db.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshToken },
        });


        const options = {
            httpOnly : true,
            sameSite : "strict",
            secure : process.env.NODE_ENV !=="development",
        }

        res.cookie("accessToken", accessToken, options)
           .cookie("refreshToken", refreshToken, options)
        
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
})

export const logout = asyncHandler(async(req,res)=>{
        res.clearCookie("refreshToken",{
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


export const refreshTokenHandler = asyncHandler(async(req,res)=>{
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) throw new ApiError(401, "Unathorized request")
    
    try {
        const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_KEY)
        const user = await db.user.findUnique({
            where : {
                id : decoded.id
            }
        })
        if(!user) throw new ApiError(401 , "User not found")
        
        if(refreshToken!== user.refreshToken) throw new ApiError(401, "Invalid refresh token")

        const newAccessToken = generateAccessToken(user.id)
        const newRefreshToken = generateRefreshToken(user.id)
    
        await db.user.update({
            where : {
                id : user.id
            },
            data :{
                refreshToken : newRefreshToken
            }
        })
    
        const options = {
            httpOnly : true,
            sameSite : "strict",
            secure : process.env.NODE_ENV !=="development",
        }
        
        res.cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .status(201)
            .json({
                success: true,
                message: "Access token refreshed",
            })
        
    } catch (error) {
        throw new ApiError(500, "Invalid refresh token")
    }
})