import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function handler(event){
  try{
    const { user_id, credits_added, amount } = JSON.parse(event.body);
    await supabase.from('users').update({ credits: supabase.raw('credits + ?', [credits_added]) }).eq('id', user_id);
    await supabase.from('transactions').insert({ user_id, credits_added, amount });
    return {statusCode:200, body:JSON.stringify({success:true})};
  } catch(e){ console.error(e); return {statusCode:500, body:JSON.stringify({error:e.message})}; }
}
