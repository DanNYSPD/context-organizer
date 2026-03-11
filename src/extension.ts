import * as vscode from 'vscode';
import { createDefaultContextsFile } from './utils/createDefaultContextsFile';
import { registerCommands } from './commands';
import { registerWatchers } from './watchers';
import { SearchPanelProvider } from './views/searchPanelProvider';
import { TreeDataProvider } from './core/treeDataProvider';

export function activate(extension: vscode.ExtensionContext) {

	const workspaceRoot = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';

	// Create tree data provider for contexts
	const dataProvider = new TreeDataProvider(workspaceRoot);

	// Create and register search panel provider
	const searchPanelProvider = new SearchPanelProvider(workspaceRoot, dataProvider, extension);
	const searchPanelView = vscode.window.registerWebviewViewProvider(
		SearchPanelProvider.viewType,
		searchPanelProvider
	);
	extension.subscriptions.push(searchPanelView);

	registerCommands(extension);

	registerWatchers(workspaceRoot, extension);

	// Create default contexts.json file
	if (workspaceRoot) {
		createDefaultContextsFile(workspaceRoot);
	}
}




