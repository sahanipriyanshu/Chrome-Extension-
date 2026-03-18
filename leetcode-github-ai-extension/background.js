import { pushToGitHub } from './github.js';
import { generateAI } from './ai.js';
import { saveProblem, GITHUB_TOKEN_KEY, GITHUB_REPO_KEY, SYNC_ENABLED_KEY } from './storage.js';

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

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'LEETCODE_SUBMISSION') {
    const problem = message.data;
    console.log('Received submission for:', problem.title);

    const settings = await chrome.storage.local.get([
      GITHUB_TOKEN_KEY, 
      GITHUB_REPO_KEY, 
      SYNC_ENABLED_KEY,
      OPENAI_API_KEY
    ]);

    if (!settings[SYNC_ENABLED_KEY]) {
      console.log('Sync is disabled.');
      return;
    }

    try {
      // 1. Generate AI Explanation and Commit Message
      console.log('Generating AI breakdown...');
      const apiKey = settings[OPENAI_API_KEY];
      if (!apiKey) {
        throw new Error('OpenAI API Key is missing. Configure it in the dashboard.');
      }
      const aiResponse = await generateAI(problem, apiKey);

      // 2. Save to local storage for Dashboard
      console.log('Saving to local history...');
      await saveProblem(problem, aiResponse);

      // 3. Push to GitHub
      const token = settings[GITHUB_TOKEN_KEY];
      const repo = settings[GITHUB_REPO_KEY];

      if (token && repo) {
        console.log('Pushing to GitHub...');
        await pushToGitHub(problem, aiResponse, token, repo);
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Sync Success',
          message: `Solution for ${problem.title} pushed to GitHub!`
        });
      } else {
        console.warn('GitHub settings missing. Solution saved locally only.');
      }
    } catch (error) {
      console.error('Sync process failed:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Sync Failed',
        message: error.message
      });
    }
  }
});