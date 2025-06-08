import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import ms from "ms";

import { db } from "../libs/db.js";
import { UserRole } from "../generated/prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { sendMail, emailVerificationMailContent } from "../utils/mail.js";

const accessTokenMaxAge = ms(process.env.ACCESS_TOKEN_EXPIRY);
const refreshTokenMaxAge = ms(process.env.REFRESH_TOKEN_EXPIRY);

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, image } = req.body;
    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
        if (!existingUser.isVerified) {
            const verificationUrl = `${process.env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify?token=${existingUser.emailVerificationToken}`;
            await sendMail({
                email: existingUser.email,
                subject: "Verify your email",
                mailGenContent: emailVerificationMailContent(existingUser.name, verificationUrl),
            });
            throw new ApiError(400, "Verification email resent.");
        }
        throw new ApiError(400, "User already exists");
    }

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpiry = new Date(Date.now() + ms(process.env.EMAIL_VERIFY_EXPIRY));
    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.USER,
            emailVerificationToken,
            emailVerificationExpiry,
            image: image || "temp",
        },
    });

    const verificationUrl = `${process.env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify?token=${emailVerificationToken}`;
    await sendMail({
        email: newUser.email,
        subject: "Verify your email",
        mailGenContent: emailVerificationMailContent(newUser.name, verificationUrl),
    });

    res.status(201).json({
        success: true,
        message: "Verification email sent.",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            image: newUser.image,
            createdAt: newUser.createdAt,
        },
    });
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const token = req.query.token;
    if (!token) throw new ApiError(401, "Token missing");

    const user = await db.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) throw new ApiError(404, "Invalid token");

    await db.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            emailVerificationToken: null,
            emailVerificationExpiry: null,
        },
    });

    res.status(200).json({ success: true, message: "Email verified" });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email required");

    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(404, "User not found");
    if (user.isVerified) throw new ApiError(400, "Already verified");

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpiry = new Date(Date.now() + ms(process.env.EMAIL_VERIFY_EXPIRY));

    await db.user.update({
        where: { email },
        data: { emailVerificationToken, emailVerificationExpiry },
    });

    const verificationUrl = `${process.env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify?token=${emailVerificationToken}`;
    await sendMail({
        email: user.email,
        subject: "Verify your email",
        mailGenContent: emailVerificationMailContent(user.name, verificationUrl),
    });

    res.status(200).json({ success: true, message: "Verification email sent" });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await db.user.findUnique({ where: { email } });

    if (!user) throw new ApiError(401, "User not found");
    if (!user.isVerified) {
        const verificationUrl = `${process.env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify?token=${user.emailVerificationToken}`;
        await sendMail({
            email: user.email,
            subject: "Verify your email",
            mailGenContent: emailVerificationMailContent(user.name, verificationUrl),
        });
        throw new ApiError(400, "Email not verified");
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await db.user.update({ where: { id: user.id }, data: { refreshToken } });

    const cookieOptions = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    };

    res
        .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: accessTokenMaxAge })
        .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: refreshTokenMaxAge })
        .status(200)
        .json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
});

export const logout = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    };

    res
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .status(204)
        .json({ success: true, message: "Logged out" });
});

export const check = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Unauthenticated");

    res.status(200).json({
        success: true,
        message: "Authenticated",
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            image: req.user.image,
            createdAt: req.user.createdAt,
        },
    });
});

export const refreshTokenHandler = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Token missing");

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
    const user = await db.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Invalid token");
    }

    const newAccessToken = generateAccessToken(user.id);
    res
        .cookie("accessToken", newAccessToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: accessTokenMaxAge,
        })
        .status(200)
        .json({ success: true, message: "Token refreshed" });
});
