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

  let content = data.candidates[0].content.parts[0].text;

  // Cleanup markdown if present
  content = content.replace(/```json\n|```/g, '').trim();

  return JSON.parse(content);
}