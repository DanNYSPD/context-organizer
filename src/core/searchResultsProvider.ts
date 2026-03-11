import * as vscode from 'vscode';

export interface SearchMatch {
  lineNumber: number;
  lineText: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchResultFile {
  filePath: string;
  absolutePath: string;
  matches: SearchMatch[];
}

export class SearchResultFileItem extends vscode.TreeItem {
  constructor(
    public file: SearchResultFile,
    public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded
  ) {
    const fileName = file.filePath.split('/').pop() || file.filePath;
    const matchCount = file.matches.length;
    super(
      `${fileName} (${matchCount} match${matchCount !== 1 ? 'es' : ''})`,
      collapsibleState
    );

    this.contextValue = 'searchFile';
    this.tooltip = file.filePath;
    this.description = file.filePath;
    this.iconPath = vscode.ThemeIcon.File;
  }
}

export class SearchResultMatchItem extends vscode.TreeItem {
  constructor(
    public match: SearchMatch,
    public filePath: string,
    public absolutePath: string
  ) {
    const preview = match.lineText.slice(0, 100);
    super(`Line ${match.lineNumber}: ${preview}`, vscode.TreeItemCollapsibleState.None);

    this.contextValue = 'searchMatch';
    this.tooltip = match.lineText;
    this.description = `Line ${match.lineNumber}`;
    this.iconPath = new vscode.ThemeIcon('circle-small-filled');
    this.command = {
      title: 'Open Match',
      command: 'context-organizer.openSearchMatch',
      arguments: [this.absolutePath, match.lineNumber]
    };
  }
}

export class SearchResultsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> =
    new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private results: SearchResultFile[] = [];

  setResults(results: SearchResultFile[]): void {
    this.results = results;
    this._onDidChangeTreeData.fire();
  }

  clearResults(): void {
    this.results = [];
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    // Root level: return file items
    if (!element) {
      return Promise.resolve(
        this.results.map(file => new SearchResultFileItem(file))
      );
    }

    // File level: return match items
    if (element instanceof SearchResultFileItem) {
      return Promise.resolve(
        element.file.matches.map(
          match => new SearchResultMatchItem(match, element.file.filePath, element.file.absolutePath)
        )
      );
    }

    return Promise.resolve([]);
  }

  getParent(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
    if (element instanceof SearchResultMatchItem) {
      const fileResult = this.results.find(f => f.absolutePath === element.absolutePath);
      if (fileResult) {
        return new SearchResultFileItem(fileResult);
      }
    }
    return null;
  }
}
