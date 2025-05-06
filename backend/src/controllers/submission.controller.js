import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {db} from "../libs/db.js"

export const getAllSubmission = asyncHandler(async(req,res)=>{
    const userId = req.user.id;
    if(!userId) throw new ApiError(404, "User not Found")
    
    const submission = await db.submission.findMany({
        where:{
            userId : userId
        }
    })

    if(!submission) throw new ApiError(401, "No submissions found")

    res.status(200).json({
        success : true,
        message : "Submissions By User Fetched Successfully",
        submission
    })
})


export const getSubmissionsForProblem = asyncHandler(async(req,res)=>{
    const userId = req.user.id;
    if(!userId) throw new ApiError(404, "User not Found")
    
    const problemId = req.params.problemId;
    if(!problemId) throw new ApiError(404, "Problem not Found")
   
    const submissions = await db.submission.findMany({
        where:{
            userId:userId,
            problemId:problemId
        }
    })    
    
    res.status(200).json({
        success:true,
        message:"Submission fetched successfully",
        submissions
    })
})

export const getAllTheSubmissionsForProblem = asyncHandler(async(req,res)=>{
    const problemId = req.params.problemId;

    const submission = await db.submission.count({
        where:{
            problemId : problemId
        }
    })
    res.status(200).json({
        success:true,
        message:"Submissions Fetched successfully",
        count:submission
    })
})