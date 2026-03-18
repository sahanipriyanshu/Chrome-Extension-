export async function generateAI(problem, apiKey) {

  const prompt = `
Explain this LeetCode solution simply.
Also give a short commit message.

Problem: ${problem.title}
Code:
${problem.code}

Return JSON ONLY:
{
  "explanation": "...",
  "commit": "..."
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  const data = await res.json();

  if (!data.candidates || data.candidates.length === 0) {
    const errMsg = data.error?.message || 'No candidates returned from Gemini API';
    throw new Error(errMsg);
  }

  const candidate = data.candidates[0];
  const rawText = candidate?.content?.parts?.[0]?.text;
  if (!rawText) {
    const reason = candidate?.finishReason || 'unknown';
    throw new Error(`Gemini returned empty response (finishReason: ${reason}). Check your API key or try again.`);
  }

  // Cleanup markdown if present
  let content = rawText.replace(/```json\n?|```/g, '').trim();

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Gemini response was not valid JSON. Raw: ' + content.slice(0, 200));
  }
}