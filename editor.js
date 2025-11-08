import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

let user;

(async () => {
  user = supabase.auth.user();
  if(!user) window.location.href = '/index.html';

  const { data } = await supabase.from('users').select('credits, role').eq('id', user.id).single();
  document.getElementById('creditsDisplay').textContent = `Credits: ${data.credits}`;
})();

function escapeHtml(text){ return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

window.processText = async function(action){
  const input = document.getElementById('inputText').value.trim();
  const correctedDiv = document.getElementById('correctedText');
  const correctionsDiv = document.getElementById('correctionsReport');

  if(!input){ correctedDiv.innerHTML=""; correctionsDiv.textContent="Please enter text"; return; }

  correctedDiv.innerHTML="Processing...";
  correctionsDiv.textContent="Generating corrections report...";

  try{
    const response = await fetch('/.netlify/functions/processText', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,text:input,user_id:user.id})
    });
    const data = await response.json();

    if(data.error){ correctedDiv.textContent=data.error; correctionsDiv.textContent=""; return; }

    let highlightedText = escapeHtml(data.correctedText);
    if(data.corrections && data.corrections.length>0){
      data.corrections.forEach(c=>{
        if(c.original && c.corrected){
          const regex = new RegExp(escapeHtml(c.original).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
          highlightedText = highlightedText.replace(regex, `<span class="highlight-addition">${escapeHtml(c.corrected)}</span>`);
        }
      });
    }
    correctedDiv.innerHTML = highlightedText;

    if(data.corrections && data.corrections.length>0){
      correctionsDiv.innerHTML="";
      data.corrections.forEach((c,i)=>{
        correctionsDiv.innerHTML += `${i+1}. Original: "${c.original}"\n   Corrected: "${c.corrected}"\n   Reason: ${c.reason}\n\n`;
      });
    } else correctionsDiv.textContent="No corrections detected.";

    if(user.role!=='admin' && data.words_used){
      const { data: userUpdated } = await supabase.from('users').select('credits').eq('id',user.id).single();
      document.getElementById('creditsDisplay').textContent=`Credits: ${userUpdated.credits}`;
    }

  } catch(e){ correctedDiv.textContent="AI backend error"; correctionsDiv.textContent=""; console.error(e); }
};

// Buy credits via Paystack
window.buyCredits = function(dollars){
  const handler = PaystackPop.setup({
    key: 'YOUR_PAYSTACK_PUBLIC_KEY',
    email: user.email,
    amount: dollars*100,
    currency: 'USD',
    callback: async function(response){
      await fetch('/.netlify/functions/addCredits',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({user_id:user.id,amount:dollars,credits_added:dollars*3000})
      });
      alert('Credits added!');
      const { data } = await supabase.from('users').select('credits').eq('id', user.id).single();
      document.getElementById('creditsDisplay').textContent=`Credits: ${data.credits}`;
    },
    onClose:function(){ alert('Payment cancelled'); }
  });
  handler.openIframe();
};
