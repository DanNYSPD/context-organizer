const vscode = acquireVsCodeApi();

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const contextSelect = document.getElementById('contextSelect');
const matchCaseCheckbox = document.getElementById('matchCaseCheckbox');
const matchWholeWordCheckbox = document.getElementById('matchWholeWordCheckbox');
const useRegexCheckbox = document.getElementById('useRegexCheckbox');
const resultsContainer = document.getElementById('resultsContainer');

// Initialize
window.addEventListener('load', () => {
  // Request contexts list
  vscode.postMessage({ command: 'getContexts' });
  
  // Set up event listeners
  searchInput.addEventListener('keydown', handleSearchInputKeydown);
  searchBtn.addEventListener('click', performSearch);
  
  contextSelect.addEventListener('change', updateState);
  matchCaseCheckbox.addEventListener('change', updateState);
  matchWholeWordCheckbox.addEventListener('change', updateState);
  useRegexCheckbox.addEventListener('change', updateState);
});

// Handle messages from extension
window.addEventListener('message', event => {
  const message = event.data;
  
  switch (message.command) {
    case 'contextsList':
      populateContexts(message.contexts);
      break;
    case 'searchResults':
      displayResults(message);
      break;
    case 'noFilesFound':
      displayNoFiles();
      break;
    case 'error':
      displayError(message.message);
      break;
    case 'restoreState':
      restoreState(message.state);
      break;
  }
});

function handleSearchInputKeydown(e) {
  if (e.key === 'Enter') {
    performSearch();
  }
}

function performSearch() {
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    resultsContainer.innerHTML = '<div class="no-results">Please enter a search term</div>';
    return;
  }
  
  const selectedContext = contextSelect.value;
  const matchCase = matchCaseCheckbox.checked;
  const matchWholeWord = matchWholeWordCheckbox.checked;
  const useRegex = useRegexCheckbox.checked;
  
  resultsContainer.innerHTML = '<div class="no-results">Searching...</div>';
console.log('Search term:', searchTerm);
  vscode.postMessage({
    command: 'search',
    searchTerm,
    selectedContext,
    matchCase,
    matchWholeWord,
    useRegex
  });
  
  updateState();
}

function updateState() {
  const state = {
    searchTerm: searchInput.value,
    selectedContext: contextSelect.value,
    matchCase: matchCaseCheckbox.checked,
    matchWholeWord: matchWholeWordCheckbox.checked,
    useRegex: useRegexCheckbox.checked
  };
  
  vscode.postMessage({
    command: 'updateState',
    ...state
  });
}

function populateContexts(contexts) {
  // Keep "All Contexts" option
  const options = contextSelect.querySelectorAll('option');
  if (options.length > 1) {
    // Clear existing context options, keep only "All Contexts"
    while (options.length > 1) {
      options[options.length - 1].remove();
    }
  }
  
  // Add contexts
  contexts.forEach(context => {
    const option = document.createElement('option');
    option.value = context;
    option.textContent = context;
    contextSelect.appendChild(option);
  });
}

function displayResults(message) {
  const { results, totalMatches, totalFiles } = message;
  console.log("displayResults");
  if (results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="search-info">
        No matches found
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="search-info">
      Found ${totalMatches} match${totalMatches !== 1 ? 'es' : ''} in ${totalFiles} file${totalFiles !== 1 ? 's' : ''}
    </div>
  `;
  
  results.forEach(fileResult => {
    const fileName = fileResult.filePath.split('/').pop();
    const matchCount = fileResult.matches.length;
    const fileId = `file-${btoa(fileResult.absolutePath)}`;
    
    html += `
      <div class="file-result">
        <div class="file-header" onclick="toggleFileExpanded('${fileId}')">
          <span class="file-icon">📄</span>
          <span class="file-name">${escapeHtml(fileName)}</span>
          <span class="match-count">${matchCount} match${matchCount !== 1 ? 'es' : ''}</span>
        </div>
        <div class="matches-list" id="${fileId}">
    `;
    
    fileResult.matches.forEach(match => {
      const linePreview = match.lineText.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 120);
      html += `
        <div class="match-item" onclick="openMatch('${escapeHtml(fileResult.absolutePath)}', ${match.lineNumber})">
          <span class="match-line-num">Line ${match.lineNumber}:</span>
          <span class="match-preview">${escapeHtml(linePreview)}</span>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  resultsContainer.innerHTML = html;
}

function displayNoFiles() {
  resultsContainer.innerHTML = `
    <div class="error-message">
      No files found in selected context
    </div>
  `;
}

function displayError(errorMessage) {
  resultsContainer.innerHTML = `
    <div class="error-message">
      ${escapeHtml(errorMessage)}
    </div>
  `;
}

function restoreState(state) {
  searchInput.value = state.searchTerm || '';
  contextSelect.value = state.selectedContext || 'all';
  matchCaseCheckbox.checked = state.matchCase || false;
  matchWholeWordCheckbox.checked = state.matchWholeWord || false;
  useRegexCheckbox.checked = state.useRegex || false;
  
  if (state.lastResults && state.lastResults.length > 0) {
    displayResults({
      results: state.lastResults,
      totalMatches: state.lastResults.reduce((sum, file) => sum + file.matches.length, 0),
      totalFiles: state.lastResults.length
    });
  }
}

function toggleFileExpanded(fileId) {
  const element = document.getElementById(fileId);
  if (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

function openMatch(absolutePath, lineNumber) {
  vscode.postMessage({
    command: 'openMatch',
    absolutePath,
    lineNumber
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
