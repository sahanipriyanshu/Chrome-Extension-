export async function saveProblem(problem, ai) {
  const data = await chrome.storage.local.get("problems");
  const problems = data.problems || [];

  problems.push({
    ...problem,
    explanation: ai.explanation,
    date: new Date().toLocaleDateString()
  });

  await chrome.storage.local.set({ problems });
}

// Keeping keys for the dashboard settings
export const GITHUB_TOKEN_KEY = 'github_token';
export const GITHUB_REPO_KEY = 'github_repo';
export const SYNC_ENABLED_KEY = 'sync_enabled';
export const OPENAI_API_KEY = 'openai_api_key';