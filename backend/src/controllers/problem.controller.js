import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getLanguageId, pollBatchResults, submitBatch } from "../utils/judge0.js";
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

    for(const[language,solutionCode] of Object.entries(referenceSolutions)){
        const languageId = getLanguageId(language);
        if(!languageId) throw new ApiError("400", `Language ${language} is not supported yet`)

        const submissions = testcases.map(({input,output})=>({
            source_code: solutionCode,
            language_id: languageId,
            stdin: input,
            expected_output: output,            
        }));

        const submissionResults = await submitBatch(submissions)
        const tokens = submissionResults.map((res) => res.token);

        const results = await pollBatchResults(tokens);
        const failedTest = results.find((r) => r.status.id !== 3);
        if (failedTest) {
          const failedIndex = results.indexOf(failedTest) + 1;
          throw new ApiError(400, `Test case ${failedIndex} failed for language ${language}`)
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
        message: "Message Created Successfully",
        problem: newProblem,
      });
})