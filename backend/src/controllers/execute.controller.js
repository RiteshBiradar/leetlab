import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSubmissions, getLanguageById, pollBatchResults, submitBatch } from "../utils/judge0.js";
import {db} from "../libs/db.js"

export const executeCode = asyncHandler(async(req,res)=>{
    const {source_code, languageId , stdin, expected_outputs, problemId} = req.body;

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

    const detailedResults = results.map((result,i)=>{
        const expected_output = expected_outputs[i]?.trim();
        const stdout = result.stdout?.trim();

        const passed = stdout===expected_output
        if(!passed) {
            allPassed = false;
        }

        return {
            testCase : i+1,
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
    

    const submission = await db.submission.create({
        data:{
        userId,
        problemId,
        sourceCode : source_code,
        language : getLanguageById(languageId),
        stdin : stdin.join("\n"),
        stdout : JSON.stringify(detailedResults.map((r)=>r.stdout)),
        stderr : detailedResults.some((r)=>r.stderr) ? JSON.stringify(detailedResults.map((r) => r.stderr)) : null,
        compileOutput : detailedResults.some((r)=>r.compileOutput) ? JSON.stringify(detailedResults.map((r)=>r.compileOutput)): null,
        status : (allPassed) ? "Accepted" : "Wrong Answer",
        memory : detailedResults.some((r)=>r.memory) ? JSON.stringify(detailedResults.map((r) => r.memory)) : null,
        time : detailedResults.some((r)=>r.time) ? JSON.stringify(detailedResults.map((r) => r.time)) : null,
        },
    })    

    if(allPassed){
        await db.problemSolved.upsert({
            where:{
                userId_problemId : {
                    userId,problemId
                }
            },
            update:{},
            create:{
                userId,
                problemId
            }
        })
    }

    const testCaseResults = detailedResults.map((result) => ({
        submissionId: submission.id,
        testCase: result.testCase,
        passed: result.passed,
        stdout: result.stdout,
        expected: result.expected,
        stderr: result.stderr,
        compileOutput: result.compile_output,
        status: result.status,
        memory: result.memory,
        time: result.time,
      }));

      await db.testCaseResult.createMany({
        data: testCaseResults,
      });

      const submissionWithTestCase = await db.submission.findUnique({
        where: {
          id: submission.id,
        },
        include: {
          testCases: true,
        },
      });      
      
    res.status(200).json({
        success : true,
        message : "Code Executed Successfully",
        submission : submissionWithTestCase
    })
})