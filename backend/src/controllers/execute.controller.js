import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSubmissions, pollBatchResults, submitBatch } from "../utils/judge0.js";

export const executeCode = asyncHandler(async(req,res)=>{
    const {source_code, languageId , stdin, expected_outputs, title} = req.body;

    const userId = req.user.id;

    if(!Array.isArray(stdin) ||!Array.isArray(expected_outputs) || stdin.length ==0 || expected_outputs.length!==stdin.length){
        throw new ApiError(401, "Invalid or missing test cases")
    }
    const testcases = stdin.map((input, i) => ({
        input,
        output: expected_outputs[i]
      })); 
      
    const submissions = createSubmissions(testcases,source_code,languageId)

    const submissionsResponse  = await submitBatch(submissions);
    const tokens = submissionsResponse.map((res)=>res.token);

    const results = await pollBatchResults(tokens);


    let allPassed = true;
    console.log(results);

    const detailedResults = results.map((result,i)=>{
        const expected_output = expected_outputs[i]?.trim();
        const stdout = result.stdout?.trim();

        const passed = stdout===expected_output
        if(!passed) {
            allPassed = false;
        }

        return {
            testCase : `${i+1}`,
            passed,
            stdout,
            expected : expected_output,
            stderr : result.stderr || null, 
            compileOutput : result.compile_output || null,
            status : result.status.description,
            memory : result.memory ? `${result.memory} KB` : undefined,
            time : result.time ? `${result.time} s` : undefined,
        }
    })
    console.log(detailedResults)
    res.status(200).json({
        success : true,
        message : "Code Executed Successfully"
    })
})