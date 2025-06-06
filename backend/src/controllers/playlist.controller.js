import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { db } from "../libs/db.js";

export const getAllPlaylist = asyncHandler(async(req,res)=>{
    const userId = req.user.id;
    if(!userId) throw new ApiError(404,"User not Found")
    
    const playlists = await db.playlist.findMany({
        where:{
            userId : userId
        },
        include:{
            problems:{
                include:{
                    problem :true
                }
            }
        }
    })
    res.status(200).json({
        success : true,
        message : "Playlists Fetched Succesfully",
        playlists 
    })
})

export const getPlayListDetails = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params; 
    if(!playlistId) throw new ApiError(404,"Problem Not Found")

    const userId = req.user.id;
    if(!userId) throw new ApiError(404,"User Not Found")
    
    
    const playlist = await db.playlist.findUnique({
        where:{
            id : playlistId,
            userId : userId
        },
        include:{
            problems:{
                include:{
                    problem :true
                }
            }
        }
    })    
    if(!playlist) throw new ApiError(404,"Playlist Not Found")

    res.status(200).json({
        success : true,
        message : "Playlist Fetched Succesfully",
        playlist
    })
})

export const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;
    if (!userId) throw new ApiError(404, "User not Found");
    const existing = await db.playlist.findFirst({
        where: {
            name,
            userId,
        },
    });

  if (existing) {
    throw new ApiError(400, "A playlist with this name already exists.");
  }

    const playlist = await db.playlist.create({
        data: {
            name,
            description,
            userId,
        },
    });

  res.status(200).json({
    success: true,
    message: "Playlist created successfully",
    playlist,
  });
});

export const addProblemToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if(!playlistId) throw new ApiError(404,"Playlist Not Found")

    const {problemIds} = req.body;
    console.log(problemIds)
    if(!problemIds) throw new ApiError(404,"Problem Not Found")
    
    if(!Array.isArray(problemIds) || problemIds.length==0) throw new ApiError(401,"Invalid or missing problemIds")

    const problemsInPlaylist = await db.problemInPlaylist.createMany({
        data: problemIds.map((problemId)=>({
                playlistId,
                problemId
            })
    )})

    res.status(201).json({
        success : true,
        message : "Problems Added Succesfully",
        problemsInPlaylist
    })
})

export const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if(!playlistId) throw new ApiError(404,"Playlist Not Found")
        
    const deletePlaylist = await db.playlist.delete({
        where:{
            id : playlistId
        }
    })
     res.status(200).json({
        success : true,
        message : "Playlist Deleted Succesfully",
        deletePlaylist
    })   
})

export const removeProblemFromPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if(!playlistId) throw new ApiError(404,"Playlist Not Found")
    
    const {problemIds} = req.body
    if(!Array.isArray(problemIds) || problemIds.length==0) throw new ApiError(401,"Invalid or missing problemIds")
    
    const deletedProblems = await db.problemInPlaylist.deleteMany({
        where:{
            playlistId,
            problemId : {
                in : problemIds
            }
        }
    })
     res.status(200).json({
        success : true,
        message : "Problems Deleted Succesfully",
        deletedProblems
    })  
})
