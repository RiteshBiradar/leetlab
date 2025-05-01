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

    if(existingProblem) throw new ApiError(400,`Problem ${existingProblem} already exists`)
      
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