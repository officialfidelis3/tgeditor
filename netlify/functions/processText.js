import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function escapeRegExp(string){ return string.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function countWords(text){ return text.trim().split(/\s+/).length; }

export async function handler(event){
  try{
    const { action,text,user_id } = JSON.parse(event.body);
    if(!text || !user_id) return {statusCode:400, body:JSON.stringify({error:"Missing text or user"})};

    const { data: userData } = await supabase.from('users').select('*').eq('id',user_id).single();
    if(!userData) return {statusCode:404, body:JSON.stringify({error:"User not found"})};

    const words = countWords(text);
    if(userData.role!=='admin' && userData.credits < words){
      return {statusCode:402, body:JSON.stringify({error:"Insufficient credits."})};
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Proofread/format/check text for action "${action}". Return JSON:
    {"correctedText":"full corrected text with all corrections applied","corrections":[{"original":"original snippet","corrected":"corrected snippet","reason":"why corrected"}]}
    Apply all corrections in correctedText. Text:\n\n${text}`;

    const aiResp = await client.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[{role:"user", content:prompt}]
    });

    let result = {};
    try{ result = JSON.parse(aiResp.choices[0].message.content); } 
    catch{ result={correctedText:aiResp.choices[0].message.content, corrections:[]}; }

    if(result.corrections && result.corrections.length>0){
      let finalText = result.correctedText || text;
      result.corrections.forEach(c=>{
        if(c.original && c.corrected){ finalText = finalText.replace(new RegExp(escapeRegExp(c.original),'g'), c.corrected); }
      });
      result.correctedText = finalText;
    }

    if(userData.role!=='admin'){
      await supabase.from('users').update({ credits: userData.credits - words }).eq('id',user_id);
      result.words_used = words;
    }

    return {statusCode:200, body:JSON.stringify(result)};

  } catch(e){ console.error(e); return {statusCode:500, body:JSON.stringify({error:e.message||"Server error"})}; }
}
