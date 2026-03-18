// Maps LeetCode language names to file extensions
const LANG_EXT = {
  'c++': 'cpp', 'cpp': 'cpp',
  'java': 'java',
  'python': 'py', 'python3': 'py',
  'javascript': 'js', 'typescript': 'ts',
  'c': 'c', 'c#': 'cs',
  'go': 'go', 'golang': 'go',
  'rust': 'rs', 'ruby': 'rb',
  'swift': 'swift', 'kotlin': 'kt',
  'scala': 'scala', 'php': 'php',
};

function getExtension(language) {
  return LANG_EXT[(language || '').toLowerCase()] || 'txt';
}

async function putFile(url, token, message, content, sha) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, content, sha })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to push to GitHub');
  }
  return res.json();
}

async function getSha(url, token) {
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (res.status === 200) {
    const data = await res.json();
    return data.sha;
  }
  return undefined;
}

export async function pushToGitHub(problem, ai, token, repo) {
  const folderName = problem.title.replace(/\s+/g, '_');
  const ext = getExtension(problem.language);
  const base = `https://api.github.com/repos/${repo}/contents/leetcode/${folderName}`;

  // ── 1. Push the raw code file (e.g. solution.cpp) ──────────────────
  const codeUrl = `${base}/solution.${ext}`;
  const codeSha = await getSha(codeUrl, token);
  const codeEncoded = btoa(unescape(encodeURIComponent(problem.code)));
  await putFile(codeUrl, token, ai.commit, codeEncoded, codeSha);

  // ── 2. Push the README with explanation ────────────────────────────
  const readmeContent = `# ${problem.title}

## Explanation
${ai.explanation}

## Code
\`\`\`${ext}
${problem.code}
\`\`\`
`;
  const readmeUrl = `${base}/README.md`;
  const readmeSha = await getSha(readmeUrl, token);
  const readmeEncoded = btoa(unescape(encodeURIComponent(readmeContent)));
  await putFile(readmeUrl, token, `docs: add explanation for ${problem.title}`, readmeEncoded, readmeSha);
}