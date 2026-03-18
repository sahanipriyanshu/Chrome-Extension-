export async function pushToGitHub(problem, ai, token, repo) {
  const fileName = `${problem.title.replace(/\s+/g, "_")}.md`;

  const content = `
# ${problem.title}

## Explanation
${ai.explanation}

## Code
\`\`\`
${problem.code}
\`\`\`
`;

  const encoded = btoa(unescape(encodeURIComponent(content)));
  const url = `https://api.github.com/repos/${repo}/contents/leetcode/${fileName}`;

  // Check if file exists to get SHA (for updates)
  const getRes = await fetch(url, {
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });

  let sha;
  if (getRes.status === 200) {
    const existingFile = await getRes.json();
    sha = existingFile.sha;
  }

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: ai.commit,
      content: encoded,
      sha: sha
    })
  });

  if (!putRes.ok) {
    const errorData = await putRes.json();
    throw new Error(errorData.message || 'Failed to push to GitHub');
  }

  return await putRes.json();
}