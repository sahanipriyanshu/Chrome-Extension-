console.log('LeetCode Sync content script loaded on:', window.location.href);

// ─── Toast Notification ──────────────────────────────────────────────────────
function showToast(message, bgColor = '#16a34a') {
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

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLanguage() {
  const sel =
    document.querySelector('[data-cy="lang-select"] .ant-select-selection-item')?.innerText ||
    document.querySelector('.ant-select-selection-item')?.innerText ||
    document.querySelector('[class*="LanguageSelector"] button')?.innerText ||
    'unknown';
  return sel.trim();
}

function getProblemTitle() {
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
  const lines = Array.from(document.querySelectorAll('.view-lines .view-line'));
  if (lines.length > 0) return lines.map(l => l.innerText).join('\n');
  const cm = document.querySelector('.CodeMirror');
  if (cm && cm.CodeMirror) return cm.CodeMirror.getValue();
  return '';
}

// ─── Check if an element is the Submit button ─────────────────────────────────
function isSubmitButton(el) {
  if (!el) return false;
  const text = el.innerText?.trim().toLowerCase() || '';
  const testId = el.getAttribute('data-e2e-locator') || '';
  return (
    testId === 'console-submit-button' ||
    text === 'submit' ||
    (el.tagName === 'BUTTON' && text.includes('submit') && !text.includes('test'))
  );
}

// ─── Poll for the submission result after clicking Submit ─────────────────────
function pollForResult(title, maxAttempts = 30, intervalMs = 1500) {
  let attempts = 0;

  const interval = setInterval(() => {
    attempts++;

    // Look for the result element
    let resultEl =
      document.querySelector('[data-e2e-locator="submission-result"]') ||
      document.querySelector('[data-cy="submission-result"]') ||
      document.querySelector('[data-e2e-locator="result-state"]') ||
      document.querySelector('[class*="result-state"]');

    // Broad fallback: leaf element with exactly "Accepted" or "Wrong Answer" etc.
    if (!resultEl) {
      resultEl = Array.from(document.querySelectorAll('span, div, p, h4, h5')).find(
        el => el.children.length === 0 && /^(Accepted|Wrong Answer|Time Limit Exceeded|Runtime Error|Compile Error|Memory Limit Exceeded)$/i.test(el.innerText?.trim())
      );
    }

    if (resultEl) {
      const resultText = resultEl.innerText?.trim() || '';
      clearInterval(interval);

      if (resultText.toLowerCase() === 'accepted') {
        console.log('✅ Accepted! Pushing to GitHub...');
        sendToBackground(title);
      } else {
        console.log(`ℹ️ Result: "${resultText}" — not pushing.`);
        // No toast for wrong answers — keep it quiet
      }
      return;
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.warn('⚠️ Result not found after polling. Giving up.');
    }
  }, intervalMs);
}

// ─── Send accepted submission to background ────────────────────────────────────
function sendToBackground(title) {
  const code = getCode();
  const language = getLanguage();
  const problemId = window.location.pathname.split('/')[2];

  // If Monaco hasn't rendered yet, retry once
  if (!code || code.trim().length === 0) {
    console.warn('⚠️ Code empty — Monaco not ready. Retrying in 1.5s...');
    setTimeout(() => sendToBackground(title), 1500);
    return;
  }

  console.log('📤 Sending submission:', title, '| Lang:', language, '| Code length:', code.length);
  showToast('⏳ Pushing to GitHub...', '#4f46e5');

  try {
    chrome.runtime.sendMessage(
      { type: 'LEETCODE_SUBMISSION', data: { title, problemId, code, language } },
      response => {
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
      }
    );
  } catch (e) {
    showToast('🔄 Extension updated — please refresh this page!', '#d97706');
  }
}

// ─── Attach Submit Button Listener via Delegation ─────────────────────────────
// We use event delegation on the document so it works even after LeetCode's
// React re-renders (which replaces DOM nodes).
let isPolling = false;  // prevent overlapping polls from double-clicks

document.addEventListener('click', event => {
  // Walk up the tree in case the click landed on a child element of the button
  let target = event.target;
  for (let i = 0; i < 5 && target; i++) {
    if (target.tagName === 'BUTTON' && isSubmitButton(target)) {
      if (isPolling) return; // already waiting for a result
      isPolling = true;

      const title = getProblemTitle();
      console.log('🖱️ Submit button clicked for:', title);
      showToast('⏳ Waiting for result...', '#6366f1');

      // Give LeetCode a moment to kick off its own API call, then start polling
      setTimeout(() => {
        pollForResult(title, 30, 1500);
        // Release the polling lock after max wait time (30 × 1.5s = 45s)
        setTimeout(() => { isPolling = false; }, 45000);
      }, 1000);

      return; // no need to keep walking tree
    }
    target = target.parentElement;
  }
}, true); // capture phase so we see it before React

console.log('✅ Submit-button click listener registered.');