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

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  let content = data.choices[0].message.content;
  
  // Cleanup markdown if present
  content = content.replace(/```json\n|```/g, '').trim();

  return JSON.parse(content);
}