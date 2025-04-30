import jwt from "jsonwebtoken";
import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";


export const authMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
      throw new ApiError(401, "User unauthorized - No token provided");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);

    const user = await db.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    next();
});

export const checkAdmin = asyncHandler(async(req,res,next) =>{

    const userId = req.user.id;

    const user = await db.user.findUnique({
      where : {
        id : userId
      }
    })
    if(!user || user.role !== "ADMIN") throw new ApiError(400,"Access denied - User must be admin")
    
    // res.status(201).json({
    //   message : "Admin user authenticated successfully"
    // })
    next();
})
