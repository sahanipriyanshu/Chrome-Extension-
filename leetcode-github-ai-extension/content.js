console.log('LeetCode Sync content script loaded on:', window.location.href);

let lastSubmittedId = null; // Prevent duplicate sends
let lastSubmitTime = 0;   // Timestamp guard (5s cooldown)

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
  // Check for accepted result — try known selectors first
  let resultEl =
    document.querySelector('[data-e2e-locator="submission-result"]') ||
    document.querySelector('[data-cy="submission-result"]');

  // Fallback: find any element whose VISIBLE text is exactly "Accepted"
  if (!resultEl) {
    resultEl = Array.from(document.querySelectorAll('span, div, p')).find(
      el => el.children.length === 0 && el.innerText?.trim() === 'Accepted'
    );
  }

  if (!resultEl) return;

  const resultText = resultEl.innerText?.trim() || '';
  if (!resultText.includes('Accepted')) return;

  // Dedup: 5-second cooldown to avoid double-firing on DOM re-renders
  const now = Date.now();
  if (now - lastSubmitTime < 5000) return;
  lastSubmitTime = now;

  const submissionKey = window.location.pathname + '@' + now;
  lastSubmittedId = submissionKey;

  const title = getProblemTitle();
  const code = getCode();
  const language = getLanguage();
  const problemId = window.location.pathname.split('/')[2];

  console.log('✅ Accepted submission detected:', title);
  console.log('Code length:', code.length);

  chrome.runtime.sendMessage({
    type: 'LEETCODE_SUBMISSION',
    data: { title, problemId, code, language }
  }, response => {
    if (chrome.runtime.lastError) {
      console.error('Message error:', chrome.runtime.lastError.message);
    } else {
      console.log('Message sent successfully', response);
    }
  });
}

// Watch DOM for result changes
const observer = new MutationObserver(() => {
  extractAndSend();
});

observer.observe(document.body, { childList: true, subtree: true });

// Also try once after page load (for cases where result is already on page)
setTimeout(extractAndSend, 2000);