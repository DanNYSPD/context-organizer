import * as vscode from 'vscode';
import * as path from 'path';
import { TreeDataProvider, Section, File, Folder } from '../core/treeDataProvider';
import { performSearch, SearchOptions, SearchResultFile } from '../core/searchContexts';
import * as logger from '../utils/logger';

export interface SearchPanelState {
  searchTerm: string;
  selectedContext: string;
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
  lastResults: SearchResultFile[];
}

export class SearchPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'contextOrganizerSearchPanel';

  private view?: vscode.WebviewView;
  private workspaceRoot: string;
  private dataProvider: TreeDataProvider;
  private extensionContext: vscode.ExtensionContext;

  private state: SearchPanelState = {
    searchTerm: '',
    selectedContext: 'all',
    matchCase: false,
    matchWholeWord: false,
    useRegex: false,
    lastResults: []
  };

  constructor(
    workspaceRoot: string,
    dataProvider: TreeDataProvider,
    extensionContext: vscode.ExtensionContext
  ) {
    this.workspaceRoot = workspaceRoot;
    this.dataProvider = dataProvider;
    this.extensionContext = extensionContext;
    this.loadPersistedState();
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media')]
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // Handle messages from WebView
    webviewView.webview.onDidReceiveMessage(message => {
      this.handleWebViewMessage(message);
    });

    // Restore state when webview becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.restoreUIState();
      }
    });
  }

  private async handleWebViewMessage(message: any) {
    switch (message.command) {
      case 'search':
        await this.performSearchFromPanel(message);
        break;
      case 'openMatch':
        await this.openSearchMatch(message.absolutePath, message.lineNumber);
        break;
      case 'updateState':
        this.updateState(message);
        break;
      case 'getContexts':
        this.sendContextsList();
        break;
    }
  }

  private async performSearchFromPanel(message: any) {
    const { searchTerm, selectedContext, matchCase, matchWholeWord, useRegex } = message;

    logger.log('🔍 Search initiated:', {
      searchTerm,
      selectedContext,
      matchCase,
      matchWholeWord,
      useRegex
    });

    // Update state
    this.state = {
      searchTerm,
      selectedContext: selectedContext || 'all',
      matchCase,
      matchWholeWord,
      useRegex,
      lastResults: []
    };

    try {
      const sections = this.dataProvider.getContexts();
      logger.log('📋 Sections found:', sections.length, sections.map(s => s.label));
      
      if (sections.length === 0) {
        logger.log('❌ No contexts found');
        this.view?.webview.postMessage({
          command: 'error',
          message: 'No contexts found. Please create a context first.'
        });
        return;
      }

      // Gather files to search
      let filesToSearch: string[] = [];

      if (selectedContext === 'all' || !selectedContext) {
        // Search all contexts
        for (const section of sections) {
          const sectionFiles = this.getAllFilesInContext(section);
          logger.log(`📂 Context "${section.label}":`, sectionFiles.length, 'files');
          filesToSearch = [...filesToSearch, ...sectionFiles];
        }
      } else {
        // Search specific context
        const context = sections.find(s => s.label === selectedContext);
        if (context) {
          const sectionFiles = this.getAllFilesInContext(context);
          logger.log(`📂 Selected context "${selectedContext}":`, sectionFiles.length, 'files');
          filesToSearch = sectionFiles;
        }
      }

      // Remove duplicates
      filesToSearch = [...new Set(filesToSearch)];
      logger.log('📁 Total unique files to search:', filesToSearch.length);
      logger.log('📁 Files:', filesToSearch);

      if (filesToSearch.length === 0) {
        logger.log('⚠️ No files found in selected context');
        this.view?.webview.postMessage({
          command: 'noFilesFound'
        });
        return;
      }

      // Perform search
      const options: SearchOptions = {
        matchCase,
        matchWholeWord,
        useRegex
      };

      logger.log('🔎 Calling performSearch with:', {
        fileCount: filesToSearch.length,
        workspaceRoot: this.workspaceRoot,
        searchTerm,
        options
      });

      const results = performSearch(filesToSearch, this.workspaceRoot, searchTerm, options);
      logger.log('✅ Search results:', results.length, 'files with matches');
      results.forEach(r => {
        logger.log(`   - ${r.filePath}: ${r.matches.length} matches`);
      });

      this.state.lastResults = results;

      // Send results to WebView
      this.view?.webview.postMessage({
        command: 'searchResults',
        results,
        totalMatches: results.reduce((sum, file) => sum + file.matches.length, 0),
        totalFiles: results.length
      });

      // Persist state
      this.persistState();
    } catch (error) {
      logger.error('❌ Search error:', error);
      this.view?.webview.postMessage({
        command: 'error',
        message: `Search failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async openSearchMatch(absolutePath: string, lineNumber: number) {
    try {
      const uri = vscode.Uri.file(absolutePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      const range = new vscode.Range(
        new vscode.Position(lineNumber - 1, 0),
        new vscode.Position(lineNumber - 1, 0)
      );

      editor.selection = new vscode.Selection(range.start, range.start);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private updateState(data: Partial<SearchPanelState>) {
    this.state = {
      ...this.state,
      ...data
    };
    this.persistState();
  }

  private sendContextsList() {
    const sections = this.dataProvider.getContexts();
    const contextNames = sections.map(s => typeof s.label === 'string' ? s.label : 'Unnamed Context');
    
    this.view?.webview.postMessage({
      command: 'contextsList',
      contexts: contextNames
    });
  }

  private restoreUIState() {
    this.view?.webview.postMessage({
      command: 'restoreState',
      state: this.state
    });
  }

  private getAllFilesInContext(section: Section): string[] {
    const files: string[] = [];

    if (section.children) {
      for (const child of section.children) {
        if (child instanceof Folder) {
          this.collectFilesFromFolder(child, files);
        } else if (child instanceof File) {
          // Convert absolute path to relative for performSearch()
          const relativePath = path.relative(this.workspaceRoot, child.filePath);
          files.push(relativePath);
        }
      }
    }

    return files;
  }

  private collectFilesFromFolder(folder: Folder, files: string[]): void {
    if (folder.children) {
      for (const child of folder.children) {
        if (child instanceof Folder) {
          this.collectFilesFromFolder(child, files);
        } else if (child instanceof File) {
          // Convert absolute path to relative for performSearch()
          const relativePath = path.relative(this.workspaceRoot, child.filePath);
          files.push(relativePath);
        }
      }
    }
  }

  private persistState() {
    this.extensionContext.workspaceState.update('searchPanelState', this.state);
  }

  private loadPersistedState() {
    const persisted = this.extensionContext.workspaceState.get<SearchPanelState>('searchPanelState');
    if (persisted) {
      this.state = persisted;
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media', 'searchPanel.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'">
    <link rel="stylesheet" href="${styleUri}">
    <title>Search Contexts</title>
</head>
<body>
    <div class="search-panel">
        <div class="search-input-group">
            <input
                id="searchInput"
                type="text"
                class="search-input"
                placeholder="Search files..."
                autofocus
            >
            <button id="searchBtn" class="search-btn" title="Search (Enter)">
                <span class="icon">🔍</span>
            </button>
        </div>

        <div class="search-options">
            <div class="context-selector">
                <label for="contextSelect">Context:</label>
                <select id="contextSelect" class="context-select">
                    <option value="all">All Contexts</option>
                </select>
            </div>

            <div class="checkboxes">
                <label class="checkbox-label">
                    <input type="checkbox" id="matchCaseCheckbox" class="search-option">
                    <span>Match Case</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="matchWholeWordCheckbox" class="search-option">
                    <span>Whole Word</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="useRegexCheckbox" class="search-option">
                    <span>Regex</span>
                </label>
            </div>
        </div>

        <div id="resultsContainer" class="results-container">
            <div class="no-results">Enter a search term and press Enter to search</div>
        </div>
    </div>

    <script nonce="${nonce}" src="${webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media', 'searchPanel.js')
    )}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
