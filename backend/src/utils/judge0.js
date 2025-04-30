import axios from "axios"
const sleep  = (ms)=> new Promise((resolve)=> setTimeout(resolve , ms))
import dotenv from "dotenv"
dotenv.config()

export const getLanguageId = (language)=>{
    const languages = {
        "PYTHON":71,
        "JAVA":62,
        "JAVASCRIPT":63,
    }
    return languages[language.toUpperCase()];
} 


export const submitBatch = async (submissions) => {
    const { data } = await axios.post(
        `${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,
        { submissions }
    );
    console.log("🚨 Full batch submission response:", data);
    return data;
};


export const pollBatchResults = async(tokens)=>{
    while(true){
        console.log("Judge0 URL:", process.env.JUDGE0_API_URL);
        const {data} = await axios.get(`${process.env.JUDGE0_API_URL}/submissions/batch`,{
            params:{
                tokens:tokens.join(","),
                base64_encoded:false,
            }
        })
        const results = data.submissions;

        const isAllDone = results.every(
            (r)=> r.status.id !== 1 && r.status.id !== 2
        )
        if(isAllDone) return results
        await sleep(1000)
    }
}