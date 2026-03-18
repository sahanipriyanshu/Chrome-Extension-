// Constants for LeetCode selectors (may need updates if LeetCode UI changes)
const SUCCESS_SELECTOR = '[data-e2e-locator="submission-result"]';
const PROBLEM_TITLE_SELECTOR = 'span.text-label-1.font-medium';
const CODE_SELECTOR = '.monaco-editor .view-lines'; // Rough selector, extraction might need more care

function extractSolution() {
  const resultElement = document.querySelector(SUCCESS_SELECTOR);
  if (resultElement && resultElement.innerText.includes('Accepted')) {
    console.log('Submission accepted! Extracting data...');

    const title = document.querySelector(PROBLEM_TITLE_SELECTOR)?.innerText || 'unknown-problem';
    const problemId = window.location.pathname.split('/')[2];
    
    // LeetCode's code editor is complex. A simple window.view-lines doesn't work well.
    // Usually, we'd need to scrape the text or use a more robust way. 
    // For now, let's assume we can find the code in a common container or via copy button hack.
    const codeLines = Array.from(document.querySelectorAll('.view-line')).map(line => line.innerText).join('\n');

    chrome.runtime.sendMessage({
      type: 'LEETCODE_SUBMISSION',
      data: {
        title: title,
        problemId: problemId,
        code: codeLines,
        language: document.querySelector('.ant-select-selection-selected-value')?.title || 'js'
      }
    });
  }
}

// Observe for result changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      extractSolution();
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
console.log('LeetCode Sync content script loaded.');