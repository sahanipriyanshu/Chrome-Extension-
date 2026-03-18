import { GITHUB_TOKEN_KEY, GITHUB_REPO_KEY, SYNC_ENABLED_KEY, OPENAI_API_KEY } from './storage.js';

// ── View helpers ──
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Load saved settings into the Settings form ──
async function loadSettings() {
  const data = await chrome.storage.local.get([GITHUB_TOKEN_KEY, GITHUB_REPO_KEY, SYNC_ENABLED_KEY, OPENAI_API_KEY]);
  document.getElementById('token').value  = data[GITHUB_TOKEN_KEY] || '';
  document.getElementById('repo').value   = data[GITHUB_REPO_KEY]  || '';
  document.getElementById('openai').value = data[OPENAI_API_KEY]   || '';
  document.getElementById('sync').checked = data[SYNC_ENABLED_KEY] ?? true;
}

// ── Load solved problems into the Home view ──
async function loadProblems() {
  const data = await chrome.storage.local.get('problems');
  const list  = document.getElementById('list');
  const empty = document.getElementById('empty-msg');
  const problems = data.problems || [];

  list.innerHTML = '';
  if (problems.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  [...problems].reverse().forEach(p => {
    const div = document.createElement('div');
    div.className = 'problem-card';
    div.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.explanation || 'No explanation.'}</p>
      <small>${p.date || 'Recently'} · ${p.language || ''}</small>
    `;
    list.appendChild(div);
  });
}

// ── Navigation ──
document.getElementById('go-settings').addEventListener('click', async () => {
  await loadSettings();
  showView('view-settings');
});

document.getElementById('go-home').addEventListener('click', () => {
  showView('view-home');
});

// ── Save settings → go back to Home with success toast ──
document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    [GITHUB_TOKEN_KEY]: document.getElementById('token').value.trim(),
    [GITHUB_REPO_KEY]:  document.getElementById('repo').value.trim(),
    [OPENAI_API_KEY]:   document.getElementById('openai').value.trim(),
    [SYNC_ENABLED_KEY]: document.getElementById('sync').checked
  });

  // Go back to Home and show toast
  showView('view-home');
  await loadProblems();

  const toast = document.getElementById('home-toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
});

// ── Init: start on Home ──
loadProblems();