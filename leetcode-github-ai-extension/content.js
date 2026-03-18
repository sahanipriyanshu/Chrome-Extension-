console.log('LeetCode Sync content script loaded on:', window.location.href);

let lastSubmittedId = null; // Prevent duplicate sends
let lastSubmitTime = 0;   // Timestamp guard (5s cooldown)

function showToast(message, bgColor = '#16a34a') {
  // Remove any existing toast
  const existing = document.getElementById('lc-sync-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'lc-sync-toast';
  toast.innerText = message;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '80px',
    right: '24px',
    zIndex: '999999',
    background: bgColor,
    color: '#fff',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
    transition: 'opacity 0.5s ease',
    opacity: '1',
    maxWidth: '340px',
    lineHeight: '1.4'
  });
  document.body.appendChild(toast);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}



function getLanguage() {
  // Try multiple selectors LeetCode uses for the language picker
  const sel =
    document.querySelector('[data-cy="lang-select"] .ant-select-selection-item')?.innerText ||
    document.querySelector('.ant-select-selection-item')?.innerText ||
    document.querySelector('[class*="LanguageSelector"] button')?.innerText ||
    'unknown';
  return sel.trim();
}

function getProblemTitle() {
  // Try multiple title selectors
  return (
    document.querySelector('a[href*="/problems/"] .mr-2')?.innerText ||
    document.querySelector('div[data-cy="question-title"]')?.innerText ||
    document.querySelector('span[data-cy="question-title"]')?.innerText ||
    document.querySelector('.text-title-large a')?.innerText ||
    document.title.replace(' - LeetCode', '').trim() ||
    window.location.pathname.split('/')[2]?.replace(/-/g, ' ') ||
    'Unknown Problem'
  );
}

function getCode() {
  // Get visible code from Monaco editor lines
  const lines = Array.from(document.querySelectorAll('.view-lines .view-line'));
  if (lines.length > 0) {
    return lines.map(l => l.innerText).join('\n');
  }
  // Fallback: CodeMirror
  const cm = document.querySelector('.CodeMirror');
  if (cm && cm.CodeMirror) return cm.CodeMirror.getValue();
  return '';
}

function extractAndSend() {
  // Try all known selectors for the Accepted result
  let resultEl =
    document.querySelector('[data-e2e-locator="submission-result"]') ||
    document.querySelector('[data-cy="submission-result"]') ||
    document.querySelector('[data-e2e-locator="result-state"]') ||
    document.querySelector('.text-green-s') ||   // LeetCode green text class
    document.querySelector('[class*="result-state"]');

  // Broad fallback: any leaf element containing exactly "Accepted"
  if (!resultEl) {
    resultEl = Array.from(document.querySelectorAll('span, div, p, h4, h5')).find(
      el => el.children.length === 0 && el.innerText?.trim() === 'Accepted'
    );
  }

  if (!resultEl) return;

  const resultText = resultEl.innerText?.trim() || '';
  if (!resultText.includes('Accepted')) return;

  // Dedup: store last push TIME per problem title in sessionStorage
  // This survives extension reloads and LeetCode SPA URL changes
  const title = getProblemTitle();
  const dedupKey = 'lc_push_' + title.replace(/\s+/g, '_');
  const lastPush = parseInt(sessionStorage.getItem(dedupKey) || '0', 10);
  const now = Date.now();
  if (now - lastPush < 60000) return;  // block same problem within 60s
  sessionStorage.setItem(dedupKey, String(now));
  lastSubmitTime = now;

  const code = getCode();
  const language = getLanguage();
  const problemId = window.location.pathname.split('/')[2];

  console.log('✅ Accepted submission detected:', title);
  console.log('Code length:', code.length);

  // If Monaco hasn't rendered yet, retry after a short delay
  if (!code || code.trim().length === 0) {
    console.warn('⚠️ Code is empty — Monaco editor not ready yet. Retrying in 1.5s...');
    // Reset the dedup key so the retry can proceed
    sessionStorage.removeItem(dedupKey);
    setTimeout(extractAndSend, 1500);
    return;
  }

  showToast('⏳ Pushing to GitHub...', '#4f46e5');

  try {
    chrome.runtime.sendMessage({
      type: 'LEETCODE_SUBMISSION',
      data: { title, problemId, code, language }
    }, response => {
      if (chrome.runtime.lastError) {
        const msg = chrome.runtime.lastError.message || '';
        if (msg.includes('invalidated') || msg.includes('context')) {
          showToast('🔄 Extension updated — please refresh this page!', '#d97706');
        } else {
          showToast('❌ Error: ' + msg, '#dc2626');
        }
      } else if (response?.ok) {
        showToast(`✅ "${title}" pushed to GitHub!`, '#16a34a');
      } else {
        showToast('⚠️ ' + (response?.reason || response?.error || 'Sync failed'), '#d97706');
      }
    });
  } catch (e) {
    showToast('🔄 Extension updated — please refresh this page!', '#d97706');
  }
}

// Watch DOM for result changes
const observer = new MutationObserver(() => {
  extractAndSend();
});

observer.observe(document.body, { childList: true, subtree: true });

// Also try once after page load (for cases where result is already on page)
setTimeout(extractAndSend, 2000);