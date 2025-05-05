import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pollBatchResults, submitBatch } from "../utils/judge0.js";

export const executeCode = asyncHandler(async(req,res)=>{
    const {source_code, languageId , stdin, expected_outputs, title} = req.body;

    const userId = req.user.id;

    if(!Array.isArray(stdin) ||!Array.isArray(expected_outputs) || stdin.length ==0 || expected_outputs.length!==stdin.length){
        throw new ApiError(401, "Invalid or missing test cases")
    }

    const submissions = stdin.map((input)=>({
        source_code,
        language_id : languageId,
        stdin: input
    })
    )

    const submissionsResponse  = await submitBatch(submissions);
    const tokens = submissionsResponse.map((res)=>res.token);

    const results = await pollBatchResults(tokens);

    console.log(results);
    res.status(200).json({
        success : true,
        message : "Code Executed Successfully"
    })
})