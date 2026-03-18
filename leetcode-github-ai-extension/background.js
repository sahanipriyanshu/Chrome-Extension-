import { pushToGitHub } from './github.js';
import { generateAI } from './ai.js';
import { saveProblem, GITHUB_TOKEN_KEY, GITHUB_REPO_KEY, SYNC_ENABLED_KEY, OPENAI_API_KEY } from './storage.js';

// Open dashboard as a full tab (stays open when switching tabs)
chrome.action.onClicked.addListener(async () => {
  const dashboardUrl = chrome.runtime.getURL('dashboard.html');
  const existingTabs = await chrome.tabs.query({ url: dashboardUrl });
  if (existingTabs.length > 0) {
    // Focus the existing dashboard tab
    await chrome.tabs.update(existingTabs[0].id, { active: true });
    await chrome.windows.update(existingTabs[0].windowId, { focused: true });
  } else {
    // Open a new tab
    chrome.tabs.create({ url: dashboardUrl });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'LEETCODE_SUBMISSION') return false;

  const problem = message.data;
  console.log('📨 Received submission for:', problem.title);

  // Must return true to keep the message channel open for async response
  (async () => {
    try {
      const settings = await chrome.storage.local.get([
        GITHUB_TOKEN_KEY,
        GITHUB_REPO_KEY,
        SYNC_ENABLED_KEY,
        OPENAI_API_KEY
      ]);

      console.log('Settings loaded:', {
        hasToken: !!settings[GITHUB_TOKEN_KEY],
        hasRepo: !!settings[GITHUB_REPO_KEY],
        hasApiKey: !!settings[OPENAI_API_KEY],
        syncEnabled: settings[SYNC_ENABLED_KEY]
      });

      if (settings[SYNC_ENABLED_KEY] === false) {
        console.log('Sync is disabled.');
        sendResponse({ ok: false, reason: 'sync disabled' });
        return;
      }

      // 1. Generate AI Explanation
      const apiKey = settings[OPENAI_API_KEY];
      if (!apiKey) {
        throw new Error('Gemini API Key is missing. Configure it in the dashboard.');
      }

      console.log('🤖 Generating AI breakdown...');
      const aiResponse = await generateAI(problem, apiKey);

      // 2. Save locally
      console.log('💾 Saving to local history...');
      await saveProblem(problem, aiResponse);

      // 3. Push to GitHub
      const token = settings[GITHUB_TOKEN_KEY];
      const repo = settings[GITHUB_REPO_KEY];

      if (token && repo) {
        console.log('🚀 Pushing to GitHub repo:', repo);
        await pushToGitHub(problem, aiResponse, token, repo);

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: '✅ Sync Success',
          message: `"${problem.title}" pushed to GitHub!`
        });

        sendResponse({ ok: true });
      } else {
        console.warn('⚠️ GitHub token/repo missing. Saved locally only.');
        sendResponse({ ok: false, reason: 'missing token or repo' });
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: '❌ Sync Failed',
        message: error.message
      });
      sendResponse({ ok: false, error: error.message });
    }
  })();

  return true; // Keep message channel open
});