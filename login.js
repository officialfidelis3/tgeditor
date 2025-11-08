import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

window.login = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { user, error } = await supabase.auth.signIn({ email, password });
  const msg = document.getElementById('loginMessage');
  if(error) msg.textContent = error.message;
  else window.location.href = '/editor.html';
};

window.register = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { user, error } = await supabase.auth.signUp({ email, password });
  const msg = document.getElementById('loginMessage');
  if(error) msg.textContent = error.message;
  else msg.textContent = 'Registration successful! Check your email.';
};
