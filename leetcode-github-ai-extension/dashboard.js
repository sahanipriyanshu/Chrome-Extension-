import { GITHUB_TOKEN_KEY, GITHUB_REPO_KEY, SYNC_ENABLED_KEY, OPENAI_API_KEY } from './storage.js';

async function load() {
  const data = await chrome.storage.local.get(["problems", GITHUB_TOKEN_KEY, GITHUB_REPO_KEY, SYNC_ENABLED_KEY, OPENAI_API_KEY]);
  const list = document.getElementById("list");
  const settingsDiv = document.getElementById("settings");

  // Load History
  list.innerHTML = '';
  (data.problems || []).reverse().forEach(p => {
    const div = document.createElement("div");
    div.className = "problem-card";
    div.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.explanation}</p>
      <small>${p.date || 'Recently'}</small>
    `;
    list.appendChild(div);
  });

  // Simple Settings UI implementation
  document.getElementById('token').value = data[GITHUB_TOKEN_KEY] || '';
  document.getElementById('repo').value = data[GITHUB_REPO_KEY] || 'sahanipriyanshu/Test-Repo-';
  document.getElementById('openai').value = data[OPENAI_API_KEY] || '';
  document.getElementById('sync').checked = data[SYNC_ENABLED_KEY] ?? true;
}

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    [GITHUB_TOKEN_KEY]: document.getElementById('token').value,
    [GITHUB_REPO_KEY]: document.getElementById('repo').value,
    [OPENAI_API_KEY]: document.getElementById('openai').value,
    [SYNC_ENABLED_KEY]: document.getElementById('sync').checked
  });
  alert('Settings Saved!');
  load();
});

load();