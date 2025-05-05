import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getLanguageId, pollBatchResults, submitBatch, createSubmissions, chunkArray } from "../utils/judge0.js";
import {db} from "../libs/db.js"

export const createProblem = asyncHandler(async(req,res)=>{
    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        // hints,
        // editorial,
        testcases,
        codeSnippets,
        referenceSolutions
    } = req.body;

    const existingProblem = await db.problem.findUnique({
      where : {
        title
      }
    })

    if(existingProblem) throw new ApiError(400,`Problem ${existingProblem.title} already exists`)
      
    for(const[language,solutionCode] of Object.entries(referenceSolutions)){
        const languageId = getLanguageId(language);
        if(!languageId) throw new ApiError("400", `Language ${language} is not supported yet`)

      const allSubmissions = createSubmissions(testcases, solutionCode, languageId);
      const chunks = chunkArray(allSubmissions, 20);

      for (const chunk of chunks) {
        const submissionResults = await submitBatch(chunk);
        const tokens = submissionResults.map((res) => res.token);
        const results = await pollBatchResults(tokens);

        for (let i = 0; i < results.length; i++) {
          const result = results[i];

          if (result.status.id !== 3) {
            throw new ApiError(400, `Testcase ${i + 1} failed for language ${language}`)
          }
        }
        
      }
    }
    const newProblem = await db.problem.create({
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          testcases,
          codeSnippets,
          referenceSolutions,
          userId: req.user.id,
        },
      });
    return res.status(201).json({
        sucess: true,
        message: "Problem Created Successfully",
        problem: newProblem,
      });
})


export const getAllProblems = asyncHandler(async(req,res)=>{
    const problems = await db.problem.findMany();
    if(!problems) throw new ApiError(401,"No problems found")

      return res.status(201).json({
        sucess: true,
        message: "Problem Fetched Successfully",
        problems 
      });   
      
})

export const getProblemByTitle = asyncHandler(async(req,res)=>{
  const {title} = req.params; 
  
  const problem  = await db.problem.findUnique({
    where : {
      title 
    }
  })

  if(!problem) throw new ApiError(404, `Problem not found`)
    return res.status(201).json({
      sucess: true,
      message: "Problem Fetched Successfully",
      problem 
    }); 
})


export const updateProblem = asyncHandler(async(req,res)=>{
  const { title: problemTitle } = req.params;

  const problem = await db.problem.findUnique({
    where:{
      title : problemTitle
    }
  })

  if(!problem) throw new ApiError(404, `Problem not found`)
    
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      // hints,
      // editorial,
      testcases,
      codeSnippets,
      referenceSolutions
  } = req.body;

    
  for(const[language,solutionCode] of Object.entries(referenceSolutions)){
      const languageId = getLanguageId(language);
      if(!languageId) throw new ApiError("400", `Language ${language} is not supported yet`)

    const allSubmissions = createSubmissions(testcases, solutionCode, languageId);
    const chunks = chunkArray(allSubmissions, 20);

    for (const chunk of chunks) {
      const submissionResults = await submitBatch(chunk);
      const tokens = submissionResults.map((res) => res.token);
      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.status.id !== 3) {
          throw new ApiError(400, `Testcase ${i + 1} failed for language ${language}`)
        }
      }
      
    }
  }
  const newProblem = await db.problem.update({
      data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippets,
        referenceSolutions,
        userId: req.user.id,
      },
    });
  return res.status(200).json({
      sucess: true,
      message: "Problem Updated Successfully",
      problem: newProblem,
    });    
})

export const deleteProblem = asyncHandler(async(req,res)=>{
  const {title} = req.params;

  const problem = await db.problem.findUnique({
    where:{
      title
    }
  })

  if(!problem) throw new ApiError(404, `Problem not found`)

  await db.problem.delete({
    where : {
      title
    }
  })

  return res.status(200).json({
    success: true,
    message: "Problem deleted successfully",
  });
})