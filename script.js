document.getElementById('year').textContent = new Date().getFullYear();

async function processText(action) {
  const input = document.getElementById('inputText').value.trim();
  const output = document.getElementById('outputText');

  if (!input) {
    output.textContent = "Please enter or paste some text first.";
    return;
  }

  output.textContent = "Processing your request with AI...";

  try {
    const response = await fetch('/.netlify/functions/processText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, text: input }),
    });

    const data = await response.json();

    if (data.result) {
      output.textContent = data.result;
    } else {
      output.textContent = "❌ Error: " + (data.error || "Unknown issue.");
    }
  } catch (error) {
    output.textContent = "⚠️ Unable to connect to AI backend.";
  }
}
