import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * TreeDataProvider manages the tree view for the Context Organizer extension.
 * It loads contexts from the contexts.json file and displays them in a hierarchical structure.
 * 
 * The tree structure consists of:
 * - Sections (contexts) at the root level
 * - Optional folders (when showFolders config is enabled)
 * - Files within sections or folders
 */
export class TreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _items: vscode.TreeItem[] = [];

	/**
	 * Creates a new TreeDataProvider instance.
	 * @param workspaceRoot - The absolute path to the workspace root directory
	 */
	constructor(private workspaceRoot: string) {
		this.loadConfig();
	}

	/**
	 * Handles the loading and parsing of the contexts.json configuration file.
	 * Creates Section items with their associated files based on the configuration.
	 * @param configPath - Absolute path to the contexts.json file
	 */
	private handleLoadConfig(configPath:string){
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			const showFolders = config.configs.showFolders;

			for (const sectionName in config.contexts) {
				const sectionItems: Container[] = [];
				for (const filePath of config.contexts[sectionName]) {
					if (showFolders || path.extname(filePath)) {
						this.addToTree(sectionItems, filePath, sectionName);
					}
				}
				this._items.push(new Section(sectionName, sectionItems));
			}
	}

	/**
	 * Loads the contexts.json configuration file and populates the tree view.
	 * If the file doesn't exist, shows a warning message.
	 * If there's an error parsing the file, shows an error message with details.
	 */
	private loadConfig() {
		this._items = [];
		const configPath = path.join(this.workspaceRoot, '.vscode', 'contexts.json');
		
		if (fs.existsSync(configPath)) {
			try{
				this.handleLoadConfig(configPath);
			}catch(error){
				let message = `Error while reading file ${configPath}, check your file`;
				vscode.window.showErrorMessage(message); //not detailed error
				if (error instanceof SyntaxError){ 
					message = `Error while reading file configPath, details : ${error.message}`;
				}
				vscode.window.showErrorMessage(message);

				
				
			}
		} else {
			vscode.window.showWarningMessage('File contexts.json was not found in the .vscode folder, so it has been created for you.');
		}
	}

	/**
	 * Adds a file path to the tree structure, creating intermediate folder nodes if showFolders is enabled.
	 * @param parent - The parent container array to add items to
	 * @param fullPath - The relative file path (e.g., 'src/core/file.ts')
	 * @param contextName - The name of the context this file belongs to
	 */
	private addToTree(parent: Container[], fullPath: string, contextName: string) {
		const parts = fullPath.split(path.sep);
		let currentLevel: Container[] = parent;
		const configPath = path.join(this.workspaceRoot, '.vscode', 'contexts.json');
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		const showFolders = config.configs.showFolders;

		if (showFolders) {
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				const isFile = i === parts.length - 1;
				let existingItem = currentLevel.find(item => item.label === part);

				if (isFile) {
					if (!existingItem) {
						const file = new File(path.join(this.workspaceRoot, ...parts), contextName);
						currentLevel.push(file);
					}
				} else {
					if (!existingItem) {
						const folder = new Folder(part);
						currentLevel.push(folder);
						currentLevel = folder.children as Container[];
					} else {
						currentLevel = existingItem.children as Container[];
					}
				}
			}
		} else {
			const file = new File(path.join(this.workspaceRoot, ...parts), contextName);
			parent.push(file);
		}
	}

	/**
	 * Returns the children of a tree item.
	 * @param element - The tree item to get children for. If undefined, returns root items.
	 * @returns A promise resolving to an array of tree items
	 */
	getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		if (element instanceof Container) {
			return Promise.resolve(element.children);
		}
		return Promise.resolve(this._items);
	}

	/**
	 * Returns the tree item representation of the given element.
	 * @param element - The element to get the tree item for
	 * @returns The tree item representation
	 */
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	/** Event emitter for tree data changes */
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
	/** Event that fires when tree data changes */
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

	/**
	 * Refreshes the tree view by reloading the configuration and notifying listeners.
	 * Called when contexts.json is modified or when contexts are added/removed.
	 */
	refresh(): void {
		this.loadConfig();
		this._onDidChangeTreeData.fire(undefined);
	}
}

/**
 * Abstract base class for tree items that can contain children.
 * Used as the parent class for Section, Folder, and File items.
 */
abstract class Container extends vscode.TreeItem {
	/** Child items of this container */
	children: vscode.TreeItem[] = [];

	/**
	 * Creates a new Container.
	 * @param label - The display label for the tree item
	 * @param collapsibleState - Whether the item is collapsed, expanded, or not collapsible
	 */
	constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
		super(label, collapsibleState);
	}
}

/**
 * Represents a context section in the tree view.
 * Sections are top-level items that contain files and folders.
 */
export class Section extends Container {
	/**
	 * Creates a new Section.
	 * @param label - The name of the context/section
	 * @param children - Array of child items (files and folders)
	 */
	constructor(label: string, children: vscode.TreeItem[] = []) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
		this.iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'contextIcon.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'contextIcon.svg')
		};
		this.children = children;
		this.contextValue = 'section';
	}
}

/**
 * Represents a folder in the tree view.
 * Only displayed when showFolders configuration is enabled.
 */
export class Folder extends Container {
	/**
	 * Creates a new Folder.
	 * @param label - The folder name
	 */
	constructor(label: string) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'folder';
		this.iconPath = new vscode.ThemeIcon('folder');
	}
}

/**
 * Represents a file in the tree view.
 * Clicking a file opens it in the editor.
 */
export class File extends Container {
	/**
	 * Creates a new File.
	 * @param filePath - The absolute path to the file
	 * @param contextName - The name of the context this file belongs to
	 */
	constructor(public filePath: string, contextName: string) {
		super(path.basename(filePath), vscode.TreeItemCollapsibleState.None);
		this.resourceUri = vscode.Uri.file(filePath);
		this.command = {
			command: 'vscode.open',
			arguments: [this.resourceUri],
			title: 'Open File'
		};
		this.contextValue = 'file';
		this.id = filePath + contextName;

		const configPath = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath|| '', '.vscode', 'contexts.json');
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		const showFolders = config.configs.showFolders;

		// Get the relative path for notes lookup
		const workspaceRoot =vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
		const relativePath = path.relative(workspaceRoot, filePath);

		// Check if there's a note for this file
		if (config.notes && config.notes[relativePath]) {
			const note = config.notes[relativePath];
			// Show note as tooltip
			this.tooltip = `${path.basename(filePath)}\n\n📝 Note: ${note}`;
		}

		if (!showFolders) {
			const parts = filePath.split(path.sep);
			this.description = parts[parts.length - 2];
		} else if (config.notes && config.notes[relativePath]) {
			// If showing folders, add note indicator to description
			this.description = '📝';
		}
	}
}